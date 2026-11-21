import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { initialMenuDatabase } from "./src/data/initialData";
import { DishItem, SalesRecord, SalesItemEntry } from "./src/types";
import {
  DATA_DIR,
  PUBLIC_DISH_UPLOADS_DIR,
  ensureCoreDirectories,
  readJsonFile,
  writeJsonFile,
  resolveSafePath
} from "./src/server/storage";
import {
  getAdminBootstrapStatus,
  getAllUsersSafe,
  hashSecret,
  loginAdminAccount,
  readUsers,
  requireAuth,
  requireRole,
  signAuthToken,
  toPublicUser,
  updateUserRoleAdmin,
  updateUserStatusAdmin,
  verifySecret,
  writeUsers,
  AuthenticatedRequest,
  attachOptionalAuth,
  bootstrapFirstAdmin
} from "./src/server/authService";
import {
  CAMPUS_STALL_TEMPLATES,
  createStallRecord,
  getAvailableCampusTemplates,
  getStallByName,
  readStalls,
  updateStallStatusAdmin,
  writeStalls
} from "./src/server/stallsService";
import {
  getPlatformAnalytics,
  getStallAnalytics,
  recordItemViewEvent,
  recordRegistrationEvent,
  recordSessionVisit,
  recordStallViewEvent,
  recordUserLoginEvent
} from "./src/server/analyticsService";
import {
  activateTrialForStall,
  addNotification,
  getAdminSettings,
  getAllPayments,
  getStallSubscriptionAndTrialInfo,
  isStallSubscriptionActive,
  logAuditAction,
  registerSubscriptionRoutes
} from "./src/server/subscriptionService";

ensureCoreDirectories();

const MENU_STORE_FILE = path.join(DATA_DIR, "menu_items.json");
const NOTICES_STORE_FILE = path.join(DATA_DIR, "stall_notices.json");
const IMAGE_REGISTRY_FILE = path.join(DATA_DIR, "owner_images_registry.json");
const IMAGE_REGISTRY_BACKUP = path.join(DATA_DIR, "owner_images_registry.backup.json");
const VERSIONS_STORE_FILE = path.join(DATA_DIR, "menu_versions.json");
const SALES_STORE_FILE = path.join(DATA_DIR, "stall_sales_records.json");

let menuVersion = Date.now();

// ============================================================================
// Protected Owner Image Registry & Version History Stores
// ============================================================================

interface OwnerImageRecord {
  imageId: string;
  storageId: string;
  persistentImageUrl: string;
  menuId: number;
  stallName: string;
  stallNo: string;
  ownerId: string;
  dishName: string;
  dishCategory: string;
  dishPrice: number;
  uploadTimestamp: number;
  isProtected: boolean;
  active: boolean;
}

interface ArchivedDishItemRecord {
  archiveId: string;
  dish: DishItem;
  archivedAt: number;
  archivedBy: string;
  preservedImageId?: string;
}

interface ImageRegistryData {
  version: string;
  lastUpdated: string;
  description: string;
  images: OwnerImageRecord[];
  archivedDishes: ArchivedDishItemRecord[];
}

export interface MenuVersionSnapshot {
  versionId: string;
  stallName: string;
  timestamp: number;
  savedAt: string;
  itemCount: number;
  items: DishItem[];
  summary: string;
}

function loadImageRegistry(): ImageRegistryData {
  const defaultReg: ImageRegistryData = {
    version: "1.0",
    lastUpdated: new Date().toISOString(),
    description: "Permanent Protected Stall-Owner Uploaded Images Master Registry",
    images: [],
    archivedDishes: []
  };
  const primary = readJsonFile<ImageRegistryData>(IMAGE_REGISTRY_FILE, defaultReg);
  if (Array.isArray(primary.images)) return primary;
  const backup = readJsonFile<ImageRegistryData>(IMAGE_REGISTRY_BACKUP, defaultReg);
  return Array.isArray(backup.images) ? backup : defaultReg;
}

function saveImageRegistry(registry: ImageRegistryData) {
  registry.lastUpdated = new Date().toISOString();
  writeJsonFile(IMAGE_REGISTRY_FILE, registry);
  writeJsonFile(IMAGE_REGISTRY_BACKUP, registry);
}

let imageRegistry: ImageRegistryData = loadImageRegistry();
let menuVersions: Record<string, MenuVersionSnapshot[]> = readJsonFile<Record<string, MenuVersionSnapshot[]>>(
  VERSIONS_STORE_FILE,
  {}
);

function saveMenuVersions(versions: Record<string, MenuVersionSnapshot[]>) {
  writeJsonFile(VERSIONS_STORE_FILE, versions);
}

function reconnectProtectedOwnerImages(items: DishItem[], registry: ImageRegistryData): boolean {
  let changed = false;
  for (const reg of registry.images) {
    if (!reg.active) continue;
    let match = items.find((i) => i.imageId && i.imageId === reg.imageId);
    if (!match) {
      match = items.find((i) => i.id === reg.menuId && i.stall === reg.stallName);
    }
    if (!match) {
      match = items.find(
        (i) => i.stall === reg.stallName && i.name.toLowerCase() === reg.dishName.toLowerCase()
      );
    }
    if (match) {
      if (
        !match.ownerUploadedImage ||
        match.ownerUploadedImage !== reg.persistentImageUrl ||
        match.imageId !== reg.imageId
      ) {
        match.ownerUploadedImage = reg.persistentImageUrl;
        match.imageUrl = reg.persistentImageUrl;
        match.imageId = reg.imageId;
        match.storageId = reg.storageId;
        match.uploadTimestamp = reg.uploadTimestamp;
        match.isOwnerImageProtected = true;
        changed = true;
      }
    }
  }
  return changed;
}

function loadMenuData(): DishItem[] {
  const existing = readJsonFile<DishItem[]>(MENU_STORE_FILE, []);
  if (Array.isArray(existing) && existing.length > 0) {
    return existing;
  }
  const cleanInitial = initialMenuDatabase.map((d) => ({ ...d, clicks: 0 }));
  writeJsonFile(MENU_STORE_FILE, cleanInitial);
  return cleanInitial;
}

let menuItems: DishItem[] = loadMenuData();
let stallNotices: Record<string, string> = readJsonFile<Record<string, string>>(NOTICES_STORE_FILE, {});
let salesRecords: SalesRecord[] = readJsonFile<SalesRecord[]>(SALES_STORE_FILE, []).filter(
  (r) => !String(r.id).startsWith("sale_seed_")
);

function saveMenuToDisk() {
  writeJsonFile(MENU_STORE_FILE, menuItems);
}

function saveNoticesToDisk() {
  writeJsonFile(NOTICES_STORE_FILE, stallNotices);
}

function saveSalesRecordsToDisk(records: SalesRecord[]) {
  writeJsonFile(SALES_STORE_FILE, records);
}

// Cooldown maps for deduplicated analytics tracking
const VIEW_COOLDOWN_MS = 10 * 60 * 1000;
const sessionCooldowns = new Map<string, number>();
const stallViewCooldowns = new Map<string, number>();
const itemViewCooldowns = new Map<string, number>();

// Helper to ensure stall ownership on authenticated merchant routes
function assertStallOwnership(req: AuthenticatedRequest, targetStall: string): boolean {
  if (!req.user) return false;
  if (req.user.role === "admin") return true;
  return req.user.role === "merchant" && req.user.stallName === targetStall;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Serve public dish/admin uploads (NOTE: payment proofs live in /data/proofs and are NEVER served publicly)
  const uploadsStaticPath = path.join(process.cwd(), "public", "uploads");
  app.use("/uploads", express.static(uploadsStaticPath));
  app.use("/uploads", (_req, res) => res.status(404).send("File not found"));
  app.use("/api/uploads", express.static(uploadsStaticPath));
  app.use("/api/uploads", (_req, res) => res.status(404).send("File not found"));

  const assetsStaticPath = path.join(process.cwd(), "public", "assets");
  app.use("/assets", express.static(assetsStaticPath));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/stalls/templates", (_req, res) => {
    res.json({ success: true, templates: getAvailableCampusTemplates() });
  });

  // Register subscription, protected proof, notification & audit routes
  registerSubscriptionRoutes(app);

  // ==========================================================================
  // PUBLIC CUSTOMER ACCESS (NO STUDENT REGISTRATION OR LOGIN REQUIRED)
  // ==========================================================================

  app.post("/api/auth/customer/register", (_req, res) => {
    return res.status(403).json({
      error: "Student registration is disabled. Customers have immediate public access without an account."
    });
  });

  app.post("/api/auth/customer/login", (_req, res) => {
    return res.status(403).json({
      error: "Student sign-in is disabled. Customers have immediate public access without an account."
    });
  });

  // ==========================================================================
  // ADMINISTRATOR BOOTSTRAP, LOGIN & PORTAL MANAGEMENT ROUTES
  // ==========================================================================

  app.get("/api/admin/bootstrap-status", (_req, res) => {
    res.json({ success: true, ...getAdminBootstrapStatus() });
  });

  app.post("/api/admin/bootstrap", (req, res) => {
    const { name, username, email, password, passcode } = req.body;
    const result = bootstrapFirstAdmin({ name, username, email, password, passcode });
    if (!result.success || !result.admin || !result.token) {
      return res.status(400).json({ error: result.error || "Failed to initialize administrator." });
    }
    recordRegistrationEvent(result.admin.id, "admin");
    logAuditAction(
      "update_settings",
      result.admin.username,
      "Administrator Account",
      `Initialized primary platform administrator account (${result.admin.username})`,
      undefined,
      { targetType: "user", targetUserId: result.admin.id, previousStatus: "none", newStatus: "active" }
    );
    return res.json({ success: true, admin: result.admin, token: result.token });
  });

  app.post("/api/admin/login", (req, res) => {
    const { identifier, password } = req.body;
    const result = loginAdminAccount({ identifier, password });
    if (!result.success || !result.admin || !result.token) {
      return res.status(401).json({ error: result.error || "Invalid administrator credentials." });
    }
    recordUserLoginEvent(result.admin.id, "admin");
    return res.json({ success: true, admin: result.admin, token: result.token });
  });

  app.get("/api/admin/analytics", requireRole("admin"), (req, res) => {
    const range = String(req.query.range || "7days") as
      | "today"
      | "7days"
      | "30days"
      | "custom"
      | "all";
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
    const validRange = ["today", "7days", "30days", "custom", "all"].includes(range) ? range : "7days";
    res.json({
      success: true,
      analytics: getPlatformAnalytics(validRange, startDate, endDate)
    });
  });

  app.get("/api/admin/stalls", requireRole("admin"), (_req, res) => {
    const stalls = readStalls();
    const payments = getAllPayments();

    const enriched = stalls.map((st) => {
      const subInfo = getStallSubscriptionAndTrialInfo(st.name);
      const stallMenu = menuItems.filter((m) => m.stall === st.name);
      const stallPayments = payments.filter((p) => p.stallName === st.name);
      return {
        ...st,
        subscription: subInfo,
        menuStats: {
          total: stallMenu.length,
          available: stallMenu.filter((m) => m.available && !m.hidden).length,
          soldOut: stallMenu.filter((m) => !m.available).length
        },
        paymentCount: stallPayments.length,
        latestPayment: stallPayments[0] || null
      };
    });

    res.json({ success: true, stalls: enriched });
  });

  app.get("/api/admin/stalls/:stallName/details", requireRole("admin"), (req, res) => {
    const stallName = decodeURIComponent(req.params.stallName);
    const stall = getStallByName(stallName);
    if (!stall) {
      return res.status(404).json({ error: "Stall not found." });
    }
    const subscription = getStallSubscriptionAndTrialInfo(stallName);
    const items = menuItems.filter((m) => m.stall === stallName);
    const payments = getAllPayments().filter((p) => p.stallName === stallName);
    res.json({ success: true, stall, subscription, items, payments });
  });

  app.post(
    "/api/admin/stalls/:stallName/status",
    requireRole("admin"),
    (req: AuthenticatedRequest, res) => {
      const stallName = decodeURIComponent(req.params.stallName);
      const { action, reason } = req.body;
      const actor = req.user?.username || "Administrator";

      if (
        ![
          "activate",
          "deactivate",
          "suspend",
          "restore",
          "approve_registration",
          "reject_registration"
        ].includes(action)
      ) {
        return res.status(400).json({ error: "Invalid stall management action." });
      }

      let updates: Parameters<typeof updateStallStatusAdmin>[1] = {};
      let auditAction: Parameters<typeof logAuditAction>[0] = "activate_stall";
      let notifTitle = "Stall Status Updated";
      let notifMsg = "";

      if (action === "activate" || action === "restore") {
        updates = { status: "active", suspensionReason: undefined };
        auditAction = action === "restore" ? "restore_stall" : "activate_stall";
        notifTitle = "Stall Restored to Active";
        notifMsg = `Your stall has been ${action === "restore" ? "restored" : "activated"} by the administrator.`;
      } else if (action === "deactivate") {
        updates = { status: "inactive" };
        auditAction = "deactivate_stall";
        notifTitle = "Stall Marked Inactive";
        notifMsg = `Your stall was set to inactive by administrator.${reason ? ` Note: ${reason}` : ""}`;
      } else if (action === "suspend") {
        const cleanReason = String(reason || "").trim() || "Administrative review";
        updates = { status: "suspended", suspensionReason: cleanReason };
        auditAction = "suspend_stall";
        notifTitle = "Stall Suspended by Administrator";
        notifMsg = `Your stall and customer menu visibility have been suspended. Reason: ${cleanReason}`;
      } else if (action === "approve_registration") {
        updates = { registrationStatus: "approved", status: "active" };
        auditAction = "approve_stall_registration";
        notifTitle = "Stall Registration Approved";
        notifMsg = "Your stall registration is approved and ready to serve customers.";
      } else if (action === "reject_registration") {
        const cleanReason = String(reason || "").trim() || "Registration requirements incomplete";
        updates = { registrationStatus: "rejected", status: "inactive", suspensionReason: cleanReason };
        auditAction = "reject_stall_registration";
        notifTitle = "Stall Registration Rejected";
        notifMsg = `Your stall registration was rejected: ${cleanReason}`;
      }

      const result = updateStallStatusAdmin(stallName, updates);
      if (!result.success || !result.stall) {
        return res.status(404).json({ error: result.error || "Stall not found." });
      }

      menuVersion = Date.now();

      addNotification({
        recipientType: "stall",
        recipientId: stallName,
        title: notifTitle,
        message: notifMsg,
        type: action === "suspend" || action === "reject_registration" ? "access_revoked" : "access_granted",
        link: "portal"
      });

      logAuditAction(
        auditAction,
        actor,
        stallName,
        `${auditAction.replace(/_/g, " ")} for ${stallName}`,
        { action, reason },
        {
          targetType: "stall",
          previousStatus: result.previousStatus,
          newStatus: `${result.stall.status}/${result.stall.registrationStatus}`,
          remarks: reason || undefined
        }
      );

      res.json({ success: true, stall: result.stall });
    }
  );

  app.get("/api/admin/users", requireRole("admin"), (_req, res) => {
    res.json({ success: true, users: getAllUsersSafe() });
  });

  app.post(
    "/api/admin/users/:userId/status",
    requireRole("admin"),
    (req: AuthenticatedRequest, res) => {
      const { userId } = req.params;
      const { status, reason } = req.body;
      if (!["active", "deactivated", "suspended"].includes(status)) {
        return res.status(400).json({ error: "Status must be active, deactivated, or suspended." });
      }

      const result = updateUserStatusAdmin(userId, status, req.user!.id);
      if (!result.success || !result.user) {
        return res.status(400).json({ error: result.error || "Failed to update user status." });
      }

      logAuditAction(
        "update_user_status",
        req.user!.username,
        result.user.stallName || result.user.email,
        `Updated user ${result.user.username} status to ${status}`,
        { userId },
        {
          targetType: "user",
          targetUserId: userId,
          previousStatus: result.previousStatus,
          newStatus: status,
          remarks: reason || undefined
        }
      );

      res.json({ success: true, user: result.user });
    }
  );

  app.post(
    "/api/admin/users/:userId/role",
    requireRole("admin"),
    (req: AuthenticatedRequest, res) => {
      const { userId } = req.params;
      const { role } = req.body;
      if (role !== "customer" && role !== "merchant") {
        return res.status(400).json({ error: "Role must be customer or merchant." });
      }

      const result = updateUserRoleAdmin(userId, role, req.user!.id);
      if (!result.success || !result.user) {
        return res.status(400).json({ error: result.error || "Failed to update user role." });
      }

      logAuditAction(
        "update_user_role",
        req.user!.username,
        result.user.email,
        `Changed user ${result.user.username} role from ${result.previousRole} to ${role}`,
        { userId },
        {
          targetType: "user",
          targetUserId: userId,
          previousStatus: result.previousRole,
          newStatus: role
        }
      );

      res.json({ success: true, user: result.user });
    }
  );

  // ==========================================================================
  // STALL OWNER AUTHENTICATION & REGISTRATION ROUTES
  // ==========================================================================

  app.get("/api/auth/me", requireAuth, (req: AuthenticatedRequest, res) => {
    const stall = req.user?.stallName ? getStallByName(req.user.stallName) : null;
    res.json({ success: true, user: req.user, stall });
  });

  app.post("/api/auth/register", (req, res) => {
    try {
      const {
        stallNo,
        stallName,
        zone,
        description,
        contactInfo,
        ownerName,
        username,
        email,
        password,
        pin,
        useCampusTemplateName
      } = req.body;

      const resolvedStallName = String(useCampusTemplateName || stallName || "").trim();
      const cleanOwner = String(ownerName || "").trim();
      const cleanUsername = String(username || "").trim().toLowerCase();
      const cleanEmail = String(email || "").trim().toLowerCase();
      const cleanContact = String(contactInfo || "").trim();
      const cleanDesc = String(description || "").trim();

      if (!resolvedStallName || !cleanOwner || !cleanUsername || !cleanEmail || !password || !pin) {
        return res.status(400).json({
          error: "Stall name, owner name, username, email, password, and PIN are required."
        });
      }
      if (!cleanEmail.includes("@")) {
        return res.status(400).json({ error: "Please enter a valid email address." });
      }
      if (String(password).length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
      }
      if (!/^\d{4,6}$/.test(String(pin))) {
        return res.status(400).json({ error: "Security PIN must be 4 to 6 digits." });
      }

      if (getStallByName(resolvedStallName)) {
        return res.status(400).json({
          error: `Stall "${resolvedStallName}" is already registered.`
        });
      }

      const users = readUsers();
      if (
        users.some(
          (u) =>
            u.username.toLowerCase() === cleanUsername ||
            u.email.toLowerCase() === cleanEmail
        )
      ) {
        return res.status(400).json({ error: "Username or email is already in use." });
      }

      const template = CAMPUS_STALL_TEMPLATES.find(
        (t) => t.name.toLowerCase() === resolvedStallName.toLowerCase()
      );
      const resolvedZone: "outside" | "inside" =
        zone === "inside" || template?.zone === "inside" ? "inside" : "outside";
      const resolvedStallNo =
        String(stallNo || template?.stallNo || resolvedStallName.split("—")[0] || "Stall").trim();
      const resolvedOfficial =
        template?.officialName ||
        (resolvedStallName.includes("—") ? resolvedStallName.split("—")[1].trim() : resolvedStallName);

      const { hash: passwordHash, salt: passwordSalt } = hashSecret(String(password));
      const { hash: pinHash, salt: pinSalt } = hashSecret(String(pin));
      const now = new Date().toISOString();
      const userId = `owner_${crypto.randomBytes(6).toString("hex")}`;

      const settings = getAdminSettings();
      const stallRecord = createStallRecord({
        stallName: resolvedStallName,
        stallNo: resolvedStallNo,
        officialName: resolvedOfficial,
        zone: resolvedZone,
        description: cleanDesc || `${resolvedOfficial} serving campus meals`,
        contactInfo: cleanContact || cleanEmail,
        email: cleanEmail,
        ownerId: userId,
        ownerName: cleanOwner,
        registrationStatus: settings.requireStallApproval ? "pending" : "approved"
      });

      const newUserRecord = {
        id: userId,
        name: cleanOwner,
        email: cleanEmail,
        username: cleanUsername,
        role: "merchant" as const,
        status: "active" as const,
        passwordHash,
        passwordSalt,
        pinHash,
        pinSalt,
        stallId: stallRecord.id,
        stallName: resolvedStallName,
        stallNo: resolvedStallNo,
        contactInfo: cleanContact || undefined,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        loginCount: 1
      };

      users.push(newUserRecord);
      writeUsers(users);

      // Seed menu version snapshot if dishes already exist in catalog for a claimed template
      const existingStallDishes = menuItems.filter((m) => m.stall === resolvedStallName);
      if (existingStallDishes.length > 0 && (!menuVersions[resolvedStallName] || menuVersions[resolvedStallName].length === 0)) {
        menuVersions[resolvedStallName] = [
          {
            versionId: `v_initial_${Date.now()}`,
            stallName: resolvedStallName,
            timestamp: Date.now(),
            savedAt: now,
            itemCount: existingStallDishes.length,
            items: JSON.parse(JSON.stringify(existingStallDishes)),
            summary: `Initial catalog (${existingStallDishes.length} dishes)`
          }
        ];
        saveMenuVersions(menuVersions);
      }

      // Automatically grant configurable Free Trial (default 14 days)
      const trialInfo = activateTrialForStall(resolvedStallName, userId, cleanUsername);

      recordRegistrationEvent(userId, "merchant", resolvedStallName);

      addNotification({
        recipientType: "admin",
        recipientId: "admin",
        title: "New Stall Registered",
        message: `${resolvedStallName} registered by ${cleanOwner} (${cleanEmail}). Free ${
          trialInfo.trialDaysRemaining || 14
        }-day trial started.`,
        type: "registration",
        link: "admin"
      });

      menuVersion = Date.now();
      const pubUser = toPublicUser(newUserRecord);
      const token = signAuthToken(pubUser);

      res.json({
        success: true,
        token,
        stall: stallRecord,
        trial: trialInfo,
        owner: {
          id: pubUser.id,
          stallNo: resolvedStallNo,
          stallName: resolvedStallName,
          ownerName: cleanOwner,
          username: cleanUsername,
          email: cleanEmail,
          contactInfo: stallRecord.contactInfo,
          description: stallRecord.description,
          createdAt: now,
          role: "merchant",
          status: "active"
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to register stall." });
    }
  });

  function handleMerchantLogin(req: express.Request, res: express.Response) {
    try {
      const { identifier, password, stall, pin } = req.body;
      const users = readUsers();
      let matchedIndex = -1;

      if (identifier && password) {
        const idLower = String(identifier).trim().toLowerCase();
        matchedIndex = users.findIndex(
          (u) =>
            u.role === "merchant" &&
            (u.username.toLowerCase() === idLower || u.email.toLowerCase() === idLower)
        );
        if (matchedIndex === -1) {
          return res.status(401).json({ error: "Invalid username/email or password." });
        }
        const user = users[matchedIndex];
        if (!verifySecret(String(password), user.passwordHash, user.passwordSalt)) {
          return res.status(401).json({ error: "Invalid username/email or password." });
        }
      } else if (stall && pin) {
        const stallClean = String(stall).trim();
        matchedIndex = users.findIndex(
          (u) => u.role === "merchant" && u.stallName === stallClean
        );
        if (matchedIndex === -1) {
          return res.status(401).json({ error: "Stall account not found. Please register your stall first." });
        }
        const user = users[matchedIndex];
        if (!user.pinHash || !user.pinSalt || !verifySecret(String(pin), user.pinHash, user.pinSalt)) {
          return res.status(401).json({ error: "Incorrect security PIN." });
        }
      } else {
        return res.status(400).json({ error: "Please provide valid credentials." });
      }

      const user = users[matchedIndex];
      if (user.status !== "active") {
        return res.status(403).json({
          error: `Account is currently ${user.status}. Please contact platform administration.`
        });
      }

      const now = new Date().toISOString();
      user.lastLoginAt = now;
      user.loginCount = (user.loginCount || 0) + 1;
      user.updatedAt = now;
      writeUsers(users);

      const stallRecord = user.stallName ? getStallByName(user.stallName) : null;
      const pubUser = toPublicUser(user);
      const token = signAuthToken(pubUser);

      recordUserLoginEvent(user.id, "merchant", user.stallName);

      return res.json({
        success: true,
        token,
        stall: stallRecord,
        owner: {
          id: pubUser.id,
          stallNo: user.stallNo || "Stall",
          stallName: user.stallName || "",
          ownerName: user.name,
          username: user.username,
          email: user.email,
          contactInfo: stallRecord?.contactInfo || user.contactInfo,
          description: stallRecord?.description,
          createdAt: user.createdAt,
          role: "merchant",
          status: user.status
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Login failed." });
    }
  }

  app.post("/api/auth/login", handleMerchantLogin);
  app.post("/api/stalls/login", handleMerchantLogin);

  app.post("/api/auth/forgot-password", (req, res) => {
    try {
      const { stallName, email, pin, newPassword } = req.body;
      if (!stallName || !pin || !newPassword) {
        return res.status(400).json({ error: "Stall name, security PIN, and new password are required." });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters." });
      }

      const users = readUsers();
      const idx = users.findIndex(
        (u) =>
          u.role === "merchant" &&
          u.stallName === String(stallName).trim() &&
          (!email || u.email.toLowerCase() === String(email).trim().toLowerCase())
      );
      if (idx === -1) {
        return res.status(404).json({ error: "No matching stall owner account found." });
      }

      const owner = users[idx];
      if (!owner.pinHash || !owner.pinSalt || !verifySecret(String(pin), owner.pinHash, owner.pinSalt)) {
        return res.status(403).json({ error: "Security PIN verification failed." });
      }

      const { hash, salt } = hashSecret(String(newPassword));
      owner.passwordHash = hash;
      owner.passwordSalt = salt;
      owner.updatedAt = new Date().toISOString();
      writeUsers(users);

      res.json({ success: true, message: "Password updated successfully. You may now sign in." });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to reset password." });
    }
  });

  app.post("/api/auth/update-profile", requireRole("merchant"), (req: AuthenticatedRequest, res) => {
    try {
      const { stallName, currentPin, newOwnerName, contactInfo, description, newPassword, newPin } =
        req.body;
      const targetStall = String(stallName || req.user?.stallName || "").trim();

      if (!targetStall || req.user?.stallName !== targetStall) {
        return res.status(403).json({ error: "Unauthorized: stall verification mismatch." });
      }
      if (!currentPin) {
        return res.status(400).json({ error: "Current security PIN is required." });
      }

      const users = readUsers();
      const idx = users.findIndex((u) => u.id === req.user!.id);
      if (idx === -1) {
        return res.status(404).json({ error: "Account not found." });
      }
      const owner = users[idx];

      if (!owner.pinHash || !owner.pinSalt || !verifySecret(String(currentPin), owner.pinHash, owner.pinSalt)) {
        return res.status(403).json({ error: "Current security PIN is incorrect." });
      }

      if (newOwnerName && String(newOwnerName).trim()) {
        owner.name = String(newOwnerName).trim();
      }
      if (contactInfo !== undefined) {
        owner.contactInfo = String(contactInfo).trim();
      }
      if (newPassword) {
        if (String(newPassword).length < 6) {
          return res.status(400).json({ error: "New password must be at least 6 characters." });
        }
        const { hash, salt } = hashSecret(String(newPassword));
        owner.passwordHash = hash;
        owner.passwordSalt = salt;
      }
      if (newPin) {
        if (!/^\d{4,6}$/.test(String(newPin))) {
          return res.status(400).json({ error: "New PIN must be 4 to 6 digits." });
        }
        const { hash, salt } = hashSecret(String(newPin));
        owner.pinHash = hash;
        owner.pinSalt = salt;
      }

      owner.updatedAt = new Date().toISOString();
      writeUsers(users);

      // Keep stalls.json synced
      const stalls = readStalls();
      const stIdx = stalls.findIndex((s) => s.name === targetStall);
      if (stIdx !== -1) {
        stalls[stIdx].ownerName = owner.name;
        if (contactInfo !== undefined) stalls[stIdx].contactInfo = String(contactInfo).trim();
        if (description !== undefined) stalls[stIdx].description = String(description).trim();
        stalls[stIdx].updatedAt = new Date().toISOString();
        writeStalls(stalls);
      }

      const stallRec = stIdx !== -1 ? stalls[stIdx] : null;
      const pub = toPublicUser(owner);

      res.json({
        success: true,
        message: "Profile and stall information updated successfully.",
        owner: {
          id: pub.id,
          stallNo: owner.stallNo || "Stall",
          stallName: owner.stallName || targetStall,
          ownerName: owner.name,
          username: owner.username,
          email: owner.email,
          contactInfo: stallRec?.contactInfo || owner.contactInfo,
          description: stallRec?.description,
          createdAt: owner.createdAt,
          role: "merchant",
          status: owner.status
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update settings." });
    }
  });

  // ==========================================================================
  // REAL ANALYTICS TRACKING ROUTES
  // ==========================================================================

  app.post("/api/analytics/session", (req, res) => {
    const queued = Array.isArray(req.body?.offlineEvents) ? req.body.offlineEvents : null;
    if (queued && queued.length > 0) {
      for (const evt of queued.slice(0, 50)) {
        const vId = String(evt?.visitorId || "anonymous");
        if (evt?.type === "stall_view" && evt.stallName) {
          recordStallViewEvent(String(evt.stallName), vId, evt.timestamp);
        } else if (evt?.type === "item_view" && evt.stallName && evt.dishId) {
          recordItemViewEvent(
            String(evt.stallName),
            Number(evt.dishId),
            String(evt.dishName || "Menu Item"),
            vId,
            evt.timestamp
          );
        } else {
          const p = (evt?.portal || "customer") as "customer" | "merchant" | "admin";
          recordSessionVisit(vId, p, "offline", evt?.timestamp);
        }
      }
      return res.json({ success: true, synced: queued.length });
    }

    const visitorId = String(req.body?.visitorId || "anonymous");
    const portal = (req.body?.portal || "customer") as "customer" | "merchant" | "admin";
    const mode = req.body?.mode === "offline" ? "offline" : "online";
    const key = `${portal}:${mode}:${visitorId}`;
    const now = Date.now();
    const last = sessionCooldowns.get(key) || 0;
    if (now - last >= VIEW_COOLDOWN_MS) {
      sessionCooldowns.set(key, now);
      recordSessionVisit(visitorId, portal, mode);
    }
    res.json({ success: true });
  });

  app.post("/api/analytics/stall-view", (req, res) => {
    const { stallName, visitorId } = req.body;
    if (!stallName || !visitorId) {
      return res.status(400).json({ error: "Stall name and visitor ID required." });
    }
    const key = `${stallName}:${visitorId}`;
    const now = Date.now();
    const last = stallViewCooldowns.get(key) || 0;
    if (now - last < VIEW_COOLDOWN_MS) {
      return res.json({ success: true, deduplicated: true });
    }
    stallViewCooldowns.set(key, now);
    recordStallViewEvent(String(stallName), String(visitorId));
    res.json({ success: true });
  });

  app.post("/api/analytics/item-view", (req, res) => {
    const { stallName, dishId, dishName, visitorId } = req.body;
    if (!stallName || !dishId || !visitorId) {
      return res.status(400).json({ error: "Missing required item analytics fields." });
    }
    const numericId = Number(dishId);
    const key = `${numericId}:${visitorId}`;
    const now = Date.now();
    const last = itemViewCooldowns.get(key) || 0;
    if (now - last < VIEW_COOLDOWN_MS) {
      return res.json({ success: true, deduplicated: true });
    }
    itemViewCooldowns.set(key, now);
    recordItemViewEvent(String(stallName), numericId, String(dishName || "Menu Item"), String(visitorId));

    const dish = menuItems.find((m) => m.id === numericId);
    if (dish) {
      dish.clicks = (dish.clicks || 0) + 1;
      saveMenuToDisk();
    }
    res.json({ success: true });
  });

  app.get("/api/analytics/:stallName", requireRole("merchant", "admin"), (req: AuthenticatedRequest, res) => {
    const stallName = decodeURIComponent(req.params.stallName);
    if (!assertStallOwnership(req, stallName)) {
      return res.status(403).json({ error: "Unauthorized: cannot view another stall's analytics." });
    }
    const period = String(req.query.period || "7days");
    res.json(getStallAnalytics(stallName, period));
  });

  // ==========================================================================
  // MENU & STALL STOREFRONT ROUTES
  // ==========================================================================

  app.get("/api/menu", attachOptionalAuth, (req: AuthenticatedRequest, res) => {
    if (reconnectProtectedOwnerImages(menuItems, imageRegistry)) {
      saveMenuToDisk();
      menuVersion = Date.now();
    }

    const requestedRole = String(req.query.role || "customer").toLowerCase();
    const requestedStall = req.query.stall ? decodeURIComponent(String(req.query.stall)) : null;

    const registeredStalls = readStalls();

    // Admin view (only when authenticated as admin)
    if (requestedRole === "admin" && req.user?.role === "admin") {
      return res.json({
        items: requestedStall ? menuItems.filter((m) => m.stall === requestedStall) : menuItems,
        notices: stallNotices,
        stalls: registeredStalls.map((s) => {
          const access = isStallSubscriptionActive(s.name);
          return {
            name: s.name,
            zone: s.zone,
            stallNo: s.stallNo,
            officialName: s.officialName,
            description: s.description,
            contactInfo: s.contactInfo,
            status: s.status,
            isActive: access.active,
            subscriptionStatus: access.status
          };
        }),
        version: menuVersion
      });
    }

    // Merchant view (authenticated owner viewing own stall even if expired/suspended)
    const merchantTargetStall =
      requestedStall || (req.user?.role === "merchant" ? req.user.stallName || null : null);
    if (
      requestedRole === "merchant" &&
      merchantTargetStall &&
      req.user &&
      (req.user.role === "admin" || (req.user.role === "merchant" && req.user.stallName === merchantTargetStall))
    ) {
      const ownStall = registeredStalls.find((s) => s.name === merchantTargetStall);
      const access = isStallSubscriptionActive(merchantTargetStall);
      return res.json({
        items: menuItems.filter((d) => d.stall === merchantTargetStall),
        notices: ownStall && stallNotices[ownStall.name] ? { [ownStall.name]: stallNotices[ownStall.name] } : {},
        stalls: ownStall
          ? [
              {
                name: ownStall.name,
                zone: ownStall.zone,
                stallNo: ownStall.stallNo,
                officialName: ownStall.officialName,
                description: ownStall.description,
                contactInfo: ownStall.contactInfo,
                status: ownStall.status,
                isActive: access.active,
                subscriptionStatus: access.status
              }
            ]
          : [],
        version: menuVersion
      });
    }

    // Customer / Public storefront: strictly filter to active, approved, non-expired, non-suspended stalls
    const eligibleStalls = registeredStalls.filter((s) => isStallSubscriptionActive(s.name).active);
    const eligibleNames = new Set(eligibleStalls.map((s) => s.name));

    let itemsToReturn = menuItems.filter((dish) => !dish.hidden && eligibleNames.has(dish.stall));
    if (requestedStall) {
      itemsToReturn = eligibleNames.has(requestedStall)
        ? itemsToReturn.filter((d) => d.stall === requestedStall)
        : [];
    }

    const eligibleNotices: Record<string, string> = {};
    for (const st of eligibleStalls) {
      if (stallNotices[st.name]) {
        eligibleNotices[st.name] = stallNotices[st.name];
      }
    }

    res.json({
      items: itemsToReturn,
      notices: eligibleNotices,
      stalls: eligibleStalls.map((s) => ({
        name: s.name,
        zone: s.zone,
        stallNo: s.stallNo,
        officialName: s.officialName,
        description: s.description,
        contactInfo: s.contactInfo,
        status: s.status,
        isActive: true,
        subscriptionStatus: "ACTIVE"
      })),
      version: menuVersion
    });
  });

  app.get("/api/menu/version", (_req, res) => {
    res.json({ version: menuVersion });
  });

  app.post("/api/menu/:id/click", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const item = menuItems.find((m) => m.id === id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    item.clicks = (item.clicks || 0) + 1;
    saveMenuToDisk();
    res.json({ success: true, clicks: item.clicks });
  });

  // Merchant menu mutations (authenticated + ownership check + active subscription gate)
  app.post(
    "/api/menu/:id/toggle-stock",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      const id = parseInt(req.params.id, 10);
      const item = menuItems.find((m) => m.id === id);
      if (!item) return res.status(404).json({ error: "Item not found." });

      const targetStall = String(req.body.stall || item.stall);
      if (item.stall !== targetStall || !assertStallOwnership(req, targetStall)) {
        return res.status(403).json({ error: "Unauthorized: cannot modify another stall's menu." });
      }

      const access = isStallSubscriptionActive(targetStall);
      if (!access.active) {
        return res.status(403).json({
          error: access.reason || "Active subscription required.",
          subscriptionExpired: true,
          code: "SUBSCRIPTION_REQUIRED"
        });
      }

      item.available = !item.available;
      saveMenuToDisk();
      menuVersion = Date.now();
      res.json({ success: true, item });
    }
  );

  app.post(
    "/api/menu/:id/price",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      const id = parseInt(req.params.id, 10);
      const { price, delta, stall } = req.body;
      const item = menuItems.find((m) => m.id === id);
      if (!item) return res.status(404).json({ error: "Item not found." });

      const targetStall = String(stall || item.stall);
      if (item.stall !== targetStall || !assertStallOwnership(req, targetStall)) {
        return res.status(403).json({ error: "Unauthorized: cannot modify another stall's menu." });
      }

      const access = isStallSubscriptionActive(targetStall);
      if (!access.active) {
        return res.status(403).json({
          error: access.reason || "Active subscription required.",
          subscriptionExpired: true,
          code: "SUBSCRIPTION_REQUIRED"
        });
      }

      if (typeof price === "number" && price >= 1) {
        item.price = price;
      } else if (typeof delta === "number") {
        const nextPrice = item.price + delta;
        if (nextPrice >= 1) item.price = nextPrice;
      }

      saveMenuToDisk();
      menuVersion = Date.now();
      res.json({ success: true, item });
    }
  );

  app.post(
    "/api/menu/:id/photo",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id, 10);
        const { stall, dataUrl, remove } = req.body;
        const item = menuItems.find((m) => m.id === id);
        if (!item) return res.status(404).json({ error: "Menu item not found." });

        const targetStall = String(stall || item.stall);
        if (item.stall !== targetStall || !assertStallOwnership(req, targetStall)) {
          return res.status(403).json({ error: "Unauthorized: cannot modify another stall's photo." });
        }

        const access = isStallSubscriptionActive(targetStall);
        if (!access.active) {
          return res.status(403).json({
            error: access.reason || "Active subscription required.",
            subscriptionExpired: true,
            code: "SUBSCRIPTION_REQUIRED"
          });
        }

        if (remove === true || dataUrl === null || dataUrl === "") {
          const { explicitPermanentDelete } = req.body;
          const previousImageId = item.imageId;
          const previousImageUrl = item.ownerUploadedImage || item.imageUrl;

          if (previousImageId) {
            const regEntry = imageRegistry.images.find((r) => r.imageId === previousImageId);
            if (regEntry) {
              regEntry.active = false;
              saveImageRegistry(imageRegistry);
            }
          }

          if (
            explicitPermanentDelete === true &&
            previousImageUrl &&
            previousImageUrl.includes("/uploads/dishes/")
          ) {
            const oldFilename = path.basename(previousImageUrl.split("?")[0]);
            if (oldFilename) {
              const oldFilePath = resolveSafePath(PUBLIC_DISH_UPLOADS_DIR, oldFilename);
              if (fs.existsSync(oldFilePath)) {
                try {
                  fs.unlinkSync(oldFilePath);
                } catch {}
              }
            }
          }

          delete item.ownerUploadedImage;
          delete item.imageId;
          delete item.storageId;
          delete item.isOwnerImageProtected;
          if (item.representativeImage) item.imageUrl = item.representativeImage;
          else delete item.imageUrl;

          saveMenuToDisk();
          menuVersion = Date.now();
          return res.json({
            success: true,
            item,
            message: explicitPermanentDelete
              ? "Photo permanently deleted."
              : "Photo unlinked and preserved in Stall Photo Vault."
          });
        }

        if (typeof dataUrl !== "string") {
          return res.status(400).json({ error: "Valid photo payload required." });
        }

        const matches = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
        if (!matches) {
          return res.status(400).json({ error: "Invalid image format (JPG, PNG, or WEBP only)." });
        }

        let ext = matches[1].toLowerCase();
        if (ext === "jpeg") ext = "jpg";
        const buffer = Buffer.from(matches[2], "base64");
        if (buffer.length > 15 * 1024 * 1024) {
          return res.status(400).json({ error: "Image exceeds 15MB limit." });
        }

        const timestamp = Date.now();
        const stallSlug = item.stall.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
        const filename = `stall_${stallSlug}_item_${item.id}_${timestamp}.${ext}`;
        const imageId = `img_${stallSlug}_item_${item.id}_${timestamp}`;
        const targetFilePath = resolveSafePath(PUBLIC_DISH_UPLOADS_DIR, filename);

        fs.writeFileSync(targetFilePath, buffer);
        const persistentUrl = `/uploads/dishes/${filename}?v=${timestamp}`;

        const regRecord: OwnerImageRecord = {
          imageId,
          storageId: filename,
          persistentImageUrl: persistentUrl,
          menuId: item.id,
          stallName: item.stall,
          stallNo: item.stall.split("—")[0].trim(),
          ownerId: req.user?.id || item.stall,
          dishName: item.name,
          dishCategory: item.category,
          dishPrice: item.price,
          uploadTimestamp: timestamp,
          isProtected: true,
          active: true
        };

        const existingRegIndex = imageRegistry.images.findIndex(
          (r) => r.imageId === imageId || (r.menuId === item.id && r.stallName === item.stall)
        );
        if (existingRegIndex >= 0) imageRegistry.images[existingRegIndex] = regRecord;
        else imageRegistry.images.push(regRecord);
        saveImageRegistry(imageRegistry);

        item.imageId = imageId;
        item.storageId = filename;
        item.uploadTimestamp = timestamp;
        item.isOwnerImageProtected = true;
        item.ownerUploadedImage = persistentUrl;
        item.imageUrl = persistentUrl;

        saveMenuToDisk();
        menuVersion = Date.now();

        res.json({
          success: true,
          item,
          imageUrl: persistentUrl,
          message: "Photo saved and protected in Stall Photo Vault."
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to save dish photo." });
      }
    }
  );

  app.post(
    "/api/menu/:id/update",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id, 10);
        const { stall, updates } = req.body;
        const item = menuItems.find((m) => m.id === id);
        if (!item) return res.status(404).json({ error: "Item not found." });

        const targetStall = String(stall || item.stall);
        if (item.stall !== targetStall || !assertStallOwnership(req, targetStall)) {
          return res.status(403).json({ error: "Unauthorized: cannot modify another stall's item." });
        }

        const access = isStallSubscriptionActive(targetStall);
        if (!access.active) {
          return res.status(403).json({
            error: access.reason || "Active subscription required.",
            subscriptionExpired: true,
            code: "SUBSCRIPTION_REQUIRED"
          });
        }

        if (updates?.name && typeof updates.name === "string") {
          item.name = updates.name.trim();
          if (item.imageId) {
            const regEntry = imageRegistry.images.find((r) => r.imageId === item.imageId);
            if (regEntry) {
              regEntry.dishName = item.name;
              saveImageRegistry(imageRegistry);
            }
          }
        }
        if (typeof updates?.price === "number" && updates.price >= 1) {
          item.price = updates.price;
          if (item.imageId) {
            const regEntry = imageRegistry.images.find((r) => r.imageId === item.imageId);
            if (regEntry) {
              regEntry.dishPrice = item.price;
              saveImageRegistry(imageRegistry);
            }
          }
        }
        if (updates?.category) {
          item.category = updates.category;
          if (item.imageId) {
            const regEntry = imageRegistry.images.find((r) => r.imageId === item.imageId);
            if (regEntry) {
              regEntry.dishCategory = item.category;
              saveImageRegistry(imageRegistry);
            }
          }
        }
        if (typeof updates?.items === "string") item.items = updates.items.trim();
        if (typeof updates?.available === "boolean") item.available = updates.available;
        if (typeof updates?.hidden === "boolean") item.hidden = updates.hidden;

        if (updates?.ownerUploadedImage !== undefined) {
          if (!updates.ownerUploadedImage) delete item.ownerUploadedImage;
          else item.ownerUploadedImage = updates.ownerUploadedImage;
        }
        if (updates?.representativeImage !== undefined) {
          item.representativeImage = updates.representativeImage;
        }
        if (updates?.imageUrl !== undefined) {
          if (updates.imageUrl === null || updates.imageUrl === "") {
            if (item.representativeImage) item.imageUrl = item.representativeImage;
            else delete item.imageUrl;
          } else {
            item.imageUrl = updates.imageUrl;
          }
        }

        saveMenuToDisk();
        menuVersion = Date.now();
        res.json({ success: true, item });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to update item." });
      }
    }
  );

  app.post(
    "/api/menu/:id/delete",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id, 10);
        const { stall, deleteImagePermanently } = req.body;
        const itemIndex = menuItems.findIndex((m) => m.id === id);
        if (itemIndex === -1) return res.status(404).json({ error: "Menu item not found." });

        const item = menuItems[itemIndex];
        const targetStall = String(stall || item.stall);
        if (item.stall !== targetStall || !assertStallOwnership(req, targetStall)) {
          return res.status(403).json({ error: "Unauthorized: cannot delete another stall's item." });
        }

        const access = isStallSubscriptionActive(targetStall);
        if (!access.active) {
          return res.status(403).json({
            error: access.reason || "Active subscription required.",
            subscriptionExpired: true,
            code: "SUBSCRIPTION_REQUIRED"
          });
        }

        const archiveRecord: ArchivedDishItemRecord = {
          archiveId: `archived_${id}_${Date.now()}`,
          dish: { ...item },
          archivedAt: Date.now(),
          archivedBy: targetStall,
          preservedImageId: item.imageId
        };
        imageRegistry.archivedDishes.push(archiveRecord);

        if (item.imageId) {
          const regEntry = imageRegistry.images.find((r) => r.imageId === item.imageId);
          if (regEntry) regEntry.active = false;
        }

        if (
          deleteImagePermanently === true &&
          item.ownerUploadedImage &&
          item.ownerUploadedImage.includes("/uploads/dishes/")
        ) {
          const filename = path.basename(item.ownerUploadedImage.split("?")[0]);
          if (filename) {
            const filePath = resolveSafePath(PUBLIC_DISH_UPLOADS_DIR, filename);
            if (fs.existsSync(filePath)) {
              try {
                fs.unlinkSync(filePath);
              } catch {}
            }
          }
        }

        saveImageRegistry(imageRegistry);
        menuItems.splice(itemIndex, 1);
        saveMenuToDisk();
        menuVersion = Date.now();

        res.json({
          success: true,
          message: "Menu item removed. Uploaded photos remain preserved in your Stall Photo Vault.",
          archivedDish: archiveRecord
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to delete item." });
      }
    }
  );

  app.get(
    "/api/menu/photo-vault/:stallName",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      const stallName = decodeURIComponent(req.params.stallName);
      if (!assertStallOwnership(req, stallName)) {
        return res.status(403).json({ error: "Unauthorized." });
      }
      res.json({
        success: true,
        stallName,
        protectedImages: imageRegistry.images.filter((r) => r.stallName === stallName),
        archivedDishes: imageRegistry.archivedDishes.filter((a) => a.dish.stall === stallName)
      });
    }
  );

  app.post(
    "/api/menu/restore-dish",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      try {
        const { archiveId, stall } = req.body;
        const idx = imageRegistry.archivedDishes.findIndex((a) => a.archiveId === archiveId);
        if (idx === -1) return res.status(404).json({ error: "Archived dish not found." });

        const record = imageRegistry.archivedDishes[idx];
        const targetStall = String(stall || record.dish.stall);
        if (record.dish.stall !== targetStall || !assertStallOwnership(req, targetStall)) {
          return res.status(403).json({ error: "Unauthorized." });
        }

        let targetId = record.dish.id;
        if (menuItems.some((m) => m.id === targetId)) {
          targetId = Math.max(...menuItems.map((m) => m.id), 0) + 1;
        }

        const restoredDish: DishItem = { ...record.dish, id: targetId };
        if (record.preservedImageId) {
          const reg = imageRegistry.images.find((r) => r.imageId === record.preservedImageId);
          if (reg) {
            reg.active = true;
            reg.menuId = targetId;
            restoredDish.ownerUploadedImage = reg.persistentImageUrl;
            restoredDish.imageUrl = reg.persistentImageUrl;
            restoredDish.imageId = reg.imageId;
            restoredDish.storageId = reg.storageId;
            restoredDish.isOwnerImageProtected = true;
          }
        }

        imageRegistry.archivedDishes.splice(idx, 1);
        saveImageRegistry(imageRegistry);

        menuItems.push(restoredDish);
        saveMenuToDisk();
        menuVersion = Date.now();
        res.json({ success: true, item: restoredDish });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to restore dish." });
      }
    }
  );

  app.post(
    "/api/menu/sync-photos",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      try {
        const { photos } = req.body;
        if (!Array.isArray(photos) || photos.length === 0) {
          return res.json({ success: true, updatedCount: 0 });
        }

        let updatedCount = 0;
        for (const p of photos) {
          if (!p || typeof p.id !== "number" || !p.imageUrl) continue;
          const item = menuItems.find((m) => m.id === p.id);
          if (!item || !assertStallOwnership(req, item.stall)) continue;
          if (item.imageUrl === p.imageUrl) continue;

          if (p.imageUrl.startsWith("data:image/")) {
            const matches = p.imageUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
            if (matches) {
              let ext = matches[1].toLowerCase();
              if (ext === "jpeg") ext = "jpg";
              const buffer = Buffer.from(matches[2], "base64");
              const timestamp = Date.now();
              const stallSlug = item.stall.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
              const filename = `stall_${stallSlug}_item_${item.id}_${timestamp}.${ext}`;
              const targetFilePath = resolveSafePath(PUBLIC_DISH_UPLOADS_DIR, filename);
              fs.writeFileSync(targetFilePath, buffer);
              const savedUrl = `/uploads/dishes/${filename}?v=${timestamp}`;
              item.ownerUploadedImage = savedUrl;
              item.imageUrl = savedUrl;
              updatedCount++;
            }
          } else if (p.imageUrl.startsWith("/uploads/")) {
            item.ownerUploadedImage = p.imageUrl;
            item.imageUrl = p.imageUrl;
            updatedCount++;
          }
        }

        if (updatedCount > 0) {
          saveMenuToDisk();
          menuVersion = Date.now();
        }
        res.json({ success: true, updatedCount, version: menuVersion });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to sync photos." });
      }
    }
  );

  app.post("/api/menu/add", requireRole("merchant", "admin"), (req: AuthenticatedRequest, res) => {
    try {
      const { stall, item } = req.body;
      if (!item || !stall) {
        return res.status(400).json({ error: "Missing menu item details." });
      }
      if (item.stall !== stall || !assertStallOwnership(req, stall)) {
        return res.status(403).json({ error: "Unauthorized: stall mismatch." });
      }

      const access = isStallSubscriptionActive(stall);
      if (!access.active) {
        return res.status(403).json({
          error: access.reason || "Active subscription required.",
          subscriptionExpired: true,
          code: "SUBSCRIPTION_REQUIRED"
        });
      }

      const newId = Math.max(...menuItems.map((m) => m.id), 0) + 1;
      let persistentImageUrl = item.imageUrl;
      let imageId: string | undefined;
      let storageId: string | undefined;
      let uploadTimestamp: number | undefined;

      if (item.imageUrl && item.imageUrl.startsWith("data:image/")) {
        const matches = item.imageUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
        if (matches) {
          let ext = matches[1].toLowerCase();
          if (ext === "jpeg") ext = "jpg";
          const buffer = Buffer.from(matches[2], "base64");
          const timestamp = Date.now();
          const stallSlug = stall.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");
          const filename = `stall_${stallSlug}_item_${newId}_${timestamp}.${ext}`;
          imageId = `img_${stallSlug}_item_${newId}_${timestamp}`;
          storageId = filename;
          uploadTimestamp = timestamp;
          const targetFilePath = resolveSafePath(PUBLIC_DISH_UPLOADS_DIR, filename);
          fs.writeFileSync(targetFilePath, buffer);
          persistentImageUrl = `/uploads/dishes/${filename}?v=${timestamp}`;

          imageRegistry.images.push({
            imageId,
            storageId: filename,
            persistentImageUrl,
            menuId: newId,
            stallName: stall,
            stallNo: stall.split("—")[0].trim(),
            ownerId: req.user?.id || stall,
            dishName: item.name,
            dishCategory: item.category,
            dishPrice: item.price,
            uploadTimestamp: timestamp,
            isProtected: true,
            active: true
          });
          saveImageRegistry(imageRegistry);
        }
      }

      const created: DishItem = {
        ...item,
        id: newId,
        imageUrl: persistentImageUrl,
        ownerUploadedImage: imageId
          ? persistentImageUrl
          : item.ownerUploadedImage || (persistentImageUrl?.includes("/uploads/") ? persistentImageUrl : undefined),
        imageId,
        storageId,
        uploadTimestamp,
        isOwnerImageProtected: imageId ? true : item.isOwnerImageProtected,
        clicks: 0
      };

      menuItems.unshift(created);
      saveMenuToDisk();
      menuVersion = Date.now();
      res.json({ success: true, item: created });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to add menu item." });
    }
  });

  app.post(
    "/api/menu/save-batch",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      try {
        const { stall, items, deletedItemIds, summary } = req.body;
        if (!stall || !Array.isArray(items)) {
          return res.status(400).json({ error: "Stall name and menu items array required." });
        }
        if (!assertStallOwnership(req, stall)) {
          return res.status(403).json({ error: "Unauthorized: cannot save changes for another stall." });
        }
        for (const item of items) {
          if (item.stall && item.stall !== stall) {
            return res.status(403).json({ error: `Item "${item.name}" does not belong to stall "${stall}".` });
          }
        }

        const access = isStallSubscriptionActive(stall);
        if (!access.active) {
          return res.status(403).json({
            error: access.reason || "Active subscription required.",
            subscriptionExpired: true,
            code: "SUBSCRIPTION_REQUIRED"
          });
        }

        const stallSlug = stall.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");

        if (Array.isArray(deletedItemIds) && deletedItemIds.length > 0) {
          for (const delId of deletedItemIds) {
            const existingItem = menuItems.find((m) => m.id === delId && m.stall === stall);
            if (existingItem) {
              imageRegistry.archivedDishes.push({
                archiveId: `archived_${delId}_${Date.now()}`,
                dish: { ...existingItem },
                archivedAt: Date.now(),
                archivedBy: stall,
                preservedImageId: existingItem.imageId
              });
              if (existingItem.imageId) {
                const reg = imageRegistry.images.find((r) => r.imageId === existingItem.imageId);
                if (reg) reg.active = false;
              }
            }
          }
        }

        let currentMaxId = Math.max(...menuItems.map((m) => (typeof m.id === "number" ? m.id : 0)), 0);
        const processedStallItems: DishItem[] = [];

        for (const rawItem of items) {
          let itemId = rawItem.id;
          if (
            !itemId ||
            itemId < 0 ||
            typeof itemId !== "number" ||
            (!menuItems.some((m) => m.id === itemId) && itemId > 1000000000000)
          ) {
            currentMaxId += 1;
            itemId = currentMaxId;
          }

          let itemImageUrl = rawItem.imageUrl;
          let itemOwnerImage = rawItem.ownerUploadedImage;
          let itemImageId = rawItem.imageId;
          let itemStorageId = rawItem.storageId;
          let itemUploadTimestamp = rawItem.uploadTimestamp;

          const existingDbItem = menuItems.find((m) => m.id === itemId);
          if (existingDbItem && existingDbItem.ownerUploadedImage && !itemOwnerImage && rawItem.removePhoto !== true) {
            itemOwnerImage = existingDbItem.ownerUploadedImage;
            itemImageId = existingDbItem.imageId;
            itemStorageId = existingDbItem.storageId;
            itemUploadTimestamp = existingDbItem.uploadTimestamp;
          }

          if (itemImageId) {
            const regEntry = imageRegistry.images.find((r) => r.imageId === itemImageId);
            if (regEntry) {
              regEntry.dishName = String(rawItem.name).trim();
              regEntry.dishPrice = Number(rawItem.price);
              regEntry.dishCategory = rawItem.category;
              regEntry.active = true;
              itemOwnerImage = regEntry.persistentImageUrl;
            }
          }

          const candidatePhoto =
            itemImageUrl && itemImageUrl.startsWith("data:image/")
              ? itemImageUrl
              : itemOwnerImage && itemOwnerImage.startsWith("data:image/")
              ? itemOwnerImage
              : null;

          if (candidatePhoto) {
            const matches = candidatePhoto.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
            if (matches) {
              let ext = matches[1].toLowerCase();
              if (ext === "jpeg") ext = "jpg";
              const buffer = Buffer.from(matches[2], "base64");
              const timestamp = Date.now();
              const filename = `stall_${stallSlug}_item_${itemId}_${timestamp}.${ext}`;
              const targetFilePath = resolveSafePath(PUBLIC_DISH_UPLOADS_DIR, filename);
              fs.writeFileSync(targetFilePath, buffer);

              const persistentUrl = `/uploads/dishes/${filename}?v=${timestamp}`;
              const newImageId = `img_${stallSlug}_item_${itemId}_${timestamp}`;

              itemImageId = newImageId;
              itemStorageId = filename;
              itemUploadTimestamp = timestamp;
              itemOwnerImage = persistentUrl;
              itemImageUrl = persistentUrl;

              const regRecord: OwnerImageRecord = {
                imageId: newImageId,
                storageId: filename,
                persistentImageUrl: persistentUrl,
                menuId: itemId,
                stallName: stall,
                stallNo: stall.split("—")[0].trim(),
                ownerId: req.user?.id || stall,
                dishName: String(rawItem.name).trim(),
                dishCategory: rawItem.category,
                dishPrice: Number(rawItem.price),
                uploadTimestamp: timestamp,
                isProtected: true,
                active: true
              };

              const existingIdx = imageRegistry.images.findIndex(
                (r) => r.imageId === newImageId || (r.menuId === itemId && r.stallName === stall)
              );
              if (existingIdx >= 0) imageRegistry.images[existingIdx] = regRecord;
              else imageRegistry.images.push(regRecord);
            }
          }

          const finalOwnerImage =
            itemOwnerImage && !itemOwnerImage.includes("representative") ? itemOwnerImage : undefined;
          const finalRepImage =
            rawItem.representativeImage || (existingDbItem ? existingDbItem.representativeImage : undefined);

          processedStallItems.push({
            ...rawItem,
            id: itemId,
            stall,
            name: String(rawItem.name).trim(),
            items: String(rawItem.items || rawItem.name).trim(),
            price: Number(rawItem.price),
            category: rawItem.category,
            available: rawItem.available !== false,
            ownerUploadedImage: finalOwnerImage,
            representativeImage: finalRepImage,
            imageUrl: finalOwnerImage || finalRepImage || rawItem.imageUrl,
            imageId: itemImageId,
            storageId: itemStorageId,
            uploadTimestamp: itemUploadTimestamp,
            isOwnerImageProtected: Boolean(finalOwnerImage),
            clicks: rawItem.clicks || (existingDbItem ? existingDbItem.clicks : 0) || 0
          });
        }

        menuItems = [...menuItems.filter((m) => m.stall !== stall), ...processedStallItems];
        saveMenuToDisk();
        saveImageRegistry(imageRegistry);

        const snapshot: MenuVersionSnapshot = {
          versionId: `v_${stallSlug}_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`,
          stallName: stall,
          timestamp: Date.now(),
          savedAt: new Date().toISOString(),
          itemCount: processedStallItems.length,
          items: JSON.parse(JSON.stringify(processedStallItems)),
          summary: summary || `Saved ${processedStallItems.length} menu items`
        };

        if (!menuVersions[stall]) menuVersions[stall] = [];
        menuVersions[stall].unshift(snapshot);
        if (menuVersions[stall].length > 35) menuVersions[stall] = menuVersions[stall].slice(0, 35);
        saveMenuVersions(menuVersions);

        menuVersion = Date.now();
        res.json({
          success: true,
          message: "Changes saved successfully.",
          items: processedStallItems,
          snapshot,
          version: menuVersion
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to save batch changes." });
      }
    }
  );

  app.get(
    "/api/menu/versions/:stallName",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      const stallName = decodeURIComponent(req.params.stallName);
      if (!assertStallOwnership(req, stallName)) {
        return res.status(403).json({ error: "Unauthorized." });
      }
      res.json({ success: true, stallName, versions: menuVersions[stallName] || [] });
    }
  );

  app.post(
    "/api/menu/versions/restore",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      try {
        const { stall, versionId } = req.body;
        if (!stall || !versionId) {
          return res.status(400).json({ error: "Stall and versionId required." });
        }
        if (!assertStallOwnership(req, stall)) {
          return res.status(403).json({ error: "Unauthorized." });
        }

        const stallVersions = menuVersions[stall] || [];
        const targetVersion = stallVersions.find((v) => v.versionId === versionId);
        if (!targetVersion) return res.status(404).json({ error: "Version snapshot not found." });

        const restoredItems: DishItem[] = JSON.parse(JSON.stringify(targetVersion.items));
        reconnectProtectedOwnerImages(restoredItems, imageRegistry);

        menuItems = [...menuItems.filter((m) => m.stall !== stall), ...restoredItems];
        saveMenuToDisk();

        const newSnapshot: MenuVersionSnapshot = {
          versionId: `v_restore_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`,
          stallName: stall,
          timestamp: Date.now(),
          savedAt: new Date().toISOString(),
          itemCount: restoredItems.length,
          items: JSON.parse(JSON.stringify(restoredItems)),
          summary: `Restored version from ${new Date(targetVersion.timestamp).toLocaleString()}`
        };

        stallVersions.unshift(newSnapshot);
        saveMenuVersions(menuVersions);
        menuVersion = Date.now();

        res.json({
          success: true,
          message: "Version restored successfully.",
          items: restoredItems,
          snapshot: newSnapshot,
          version: menuVersion
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to restore version." });
      }
    }
  );

  app.post(
    "/api/stalls/notice",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      const { stall, notice } = req.body;
      if (!stall) return res.status(400).json({ error: "Stall name is required." });
      if (!assertStallOwnership(req, stall)) {
        return res.status(403).json({ error: "Unauthorized." });
      }

      const access = isStallSubscriptionActive(stall);
      if (!access.active) {
        return res.status(403).json({
          error: access.reason || "Active subscription required.",
          subscriptionExpired: true,
          code: "SUBSCRIPTION_REQUIRED"
        });
      }

      stallNotices[stall] = String(notice || "").trim();
      saveNoticesToDisk();
      menuVersion = Date.now();
      res.json({ success: true, stall, notice: stallNotices[stall] });
    }
  );

  // ==========================================================================
  // SMART SALES TRACKER ROUTES (Protected by Stall Ownership)
  // ==========================================================================

  app.get(
    "/api/sales/:stallName",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      try {
        const stallName = decodeURIComponent(req.params.stallName).trim();
        if (!assertStallOwnership(req, stallName)) {
          return res.status(403).json({ error: "Unauthorized: cannot access another stall's sales." });
        }

        const { filter, startDate, endDate, recordType } = req.query;
        const matchedRecords = salesRecords.filter((r) => r.stallName === stallName);

        const todayStr = new Date().toISOString().slice(0, 10);
        const now = new Date();
        const dayOfWeek = (now.getDay() + 6) % 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - dayOfWeek);
        const startOfWeekStr = monday.toISOString().slice(0, 10);
        const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

        let filtered = [...matchedRecords];
        if (filter === "today") filtered = filtered.filter((r) => r.date === todayStr);
        else if (filter === "this_week") filtered = filtered.filter((r) => r.date >= startOfWeekStr && r.date <= todayStr);
        else if (filter === "this_month") filtered = filtered.filter((r) => r.date >= startOfMonthStr && r.date <= todayStr);
        else if (filter === "custom" && startDate && endDate) {
          filtered = filtered.filter((r) => r.date >= String(startDate) && r.date <= String(endDate));
        }

        if (recordType === "daily_summary" || recordType === "itemized") {
          filtered = filtered.filter((r) => r.recordType === recordType);
        }

        filtered.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

        const todayRecords = matchedRecords.filter((r) => r.date === todayStr);
        const todayItemized = todayRecords.filter((r) => r.recordType === "itemized");
        const todaySummaries = todayRecords.filter((r) => r.recordType === "daily_summary");
        const primaryToday = todayItemized.length > 0 ? todayItemized : todaySummaries;

        const todaySales = primaryToday.reduce((sum, r) => sum + (r.totalSales || 0), 0);
        const todayExpenses = primaryToday.reduce((sum, r) => sum + (r.totalExpenses || 0), 0);
        const todayItemsSold = primaryToday.reduce((sum, r) => sum + (r.totalItemsSold || 0), 0);
        const todayProfit = todaySales - todayExpenses;

        const todayItemMap: Record<string, { quantity: number; totalSales: number }> = {};
        todayRecords.forEach((r) => {
          r.items?.forEach((it) => {
            const k = it.foodName.trim();
            if (!todayItemMap[k]) todayItemMap[k] = { quantity: 0, totalSales: 0 };
            todayItemMap[k].quantity += it.quantitySold || 0;
            todayItemMap[k].totalSales += it.totalSales || 0;
          });
        });

        let todayBestSellingItem: { name: string; quantity: number; totalSales: number } | null = null;
        let maxTodayQty = 0;
        Object.entries(todayItemMap).forEach(([name, data]) => {
          if (data.quantity > maxTodayQty) {
            maxTodayQty = data.quantity;
            todayBestSellingItem = { name, ...data };
          }
        });

        const dateMap = new Map<string, SalesRecord[]>();
        filtered.forEach((r) => {
          const list = dateMap.get(r.date) || [];
          list.push(r);
          dateMap.set(r.date, list);
        });

        let filterSales = 0;
        let filterExpenses = 0;
        let filterItemsSold = 0;

        dateMap.forEach((dayRecords) => {
          const source =
            recordType === "daily_summary"
              ? dayRecords.filter((r) => r.recordType === "daily_summary")
              : recordType === "itemized"
              ? dayRecords.filter((r) => r.recordType === "itemized")
              : dayRecords.some((r) => r.recordType === "itemized")
              ? dayRecords.filter((r) => r.recordType === "itemized")
              : dayRecords.filter((r) => r.recordType === "daily_summary");

          source.forEach((r) => {
            filterSales += r.totalSales || 0;
            filterExpenses += r.totalExpenses || 0;
            filterItemsSold += r.totalItemsSold || 0;
          });
        });

        const rangeItemMap: Record<string, { quantity: number; totalSales: number }> = {};
        filtered.forEach((r) => {
          r.items?.forEach((it) => {
            const k = it.foodName.trim();
            if (!rangeItemMap[k]) rangeItemMap[k] = { quantity: 0, totalSales: 0 };
            rangeItemMap[k].quantity += it.quantitySold || 0;
            rangeItemMap[k].totalSales += it.totalSales || 0;
          });
        });

        let filterBestSellingItem: { name: string; quantity: number; totalSales: number } | null = null;
        let maxRangeQty = 0;
        Object.entries(rangeItemMap).forEach(([name, data]) => {
          if (data.quantity > maxRangeQty) {
            maxRangeQty = data.quantity;
            filterBestSellingItem = { name, ...data };
          }
        });

        const itemKeys = Object.keys(rangeItemMap);
        const slowSellingItems: { name: string; quantity: number; totalSales: number; reason: string }[] = [];
        const insufficientDataForSlowSelling = itemKeys.length < 3;

        if (!insufficientDataForSlowSelling) {
          const sortedAsc = Object.entries(rangeItemMap).sort((a, b) => a[1].quantity - b[1].quantity);
          const avgQty = sortedAsc.reduce((sum, item) => sum + item[1].quantity, 0) / sortedAsc.length;
          sortedAsc.forEach(([name, data]) => {
            if (data.quantity <= Math.max(3, Math.floor(avgQty * 0.4)) && slowSellingItems.length < 3) {
              slowSellingItems.push({
                name,
                quantity: data.quantity,
                totalSales: data.totalSales,
                reason: `${data.quantity} sold vs average of ${Math.round(avgQty)} units.`
              });
            }
          });
        }

        res.json({
          success: true,
          stallName,
          records: filtered,
          totalCount: matchedRecords.length,
          metrics: {
            todayTotalSales: todaySales,
            todayExpenses,
            todayEstimatedProfit: todayProfit,
            todayItemsSold,
            todayBestSellingItem,
            filterTotalSales: filterSales,
            filterExpenses,
            filterEstimatedProfit: filterSales - filterExpenses,
            filterItemsSold,
            filterBestSellingItem,
            slowSellingItems,
            insufficientDataForSlowSelling
          }
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to retrieve sales records." });
      }
    }
  );

  app.post("/api/sales", requireRole("merchant", "admin"), (req: AuthenticatedRequest, res) => {
    try {
      const {
        stallName,
        recordType,
        date,
        totalSales,
        totalExpenses,
        notes,
        items,
        overrideDuplicate
      } = req.body;

      if (!stallName || !recordType || !date) {
        return res.status(400).json({ error: "Stall name, record type, and date are required." });
      }
      if (!assertStallOwnership(req, String(stallName).trim())) {
        return res.status(403).json({ error: "Unauthorized: cannot log sales for another stall." });
      }
      if (recordType !== "daily_summary" && recordType !== "itemized") {
        return res.status(400).json({ error: "Invalid sales record type." });
      }

      const numExpenses = Math.max(0, parseFloat(totalExpenses) || 0);
      let numSales = Math.max(0, parseFloat(totalSales) || 0);
      let totalItemsSold = 0;
      let processedItems: SalesItemEntry[] | undefined;

      if (recordType === "itemized") {
        if (!Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ error: "At least one food item entry is required." });
        }
        processedItems = items.map((it: any, index: number) => {
          const foodName = String(it.foodName || "").trim();
          if (!foodName) throw new Error(`Item #${index + 1} must have a valid food name.`);
          const quantitySold = Math.max(0, parseInt(it.quantitySold, 10) || 0);
          const sellingPrice = Math.max(0, parseFloat(it.sellingPrice) || 0);
          totalItemsSold += quantitySold;
          return {
            id: it.id || `item_${Date.now()}_${index}`,
            dishId: it.dishId ? Number(it.dishId) : undefined,
            foodName,
            quantitySold,
            sellingPrice,
            totalSales: quantitySold * sellingPrice,
            notes: it.notes ? String(it.notes).trim() : undefined
          };
        });
        numSales = processedItems.reduce((sum, it) => sum + it.totalSales, 0);
      }

      const existingIndex = salesRecords.findIndex(
        (r) => r.stallName === stallName.trim() && r.date === date && r.recordType === recordType
      );
      if (existingIndex !== -1 && !overrideDuplicate) {
        return res.status(409).json({
          duplicate: true,
          existingId: salesRecords[existingIndex].id,
          message: `A ${recordType === "daily_summary" ? "Daily Sales Summary" : "Per-Item Sales Record"} already exists for ${date}. Update it?`
        });
      }

      if (existingIndex !== -1 && overrideDuplicate) {
        salesRecords[existingIndex] = {
          ...salesRecords[existingIndex],
          totalSales: numSales,
          totalExpenses: numExpenses,
          estimatedProfit: numSales - numExpenses,
          notes: notes ? String(notes).trim() : undefined,
          items: processedItems,
          totalItemsSold: recordType === "itemized" ? totalItemsSold : salesRecords[existingIndex].totalItemsSold,
          updatedAt: new Date().toISOString()
        };
        saveSalesRecordsToDisk(salesRecords);
        return res.json({ success: true, message: "Sales record updated.", record: salesRecords[existingIndex] });
      }

      const newRecord: SalesRecord = {
        id: `sale_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
        stallName: stallName.trim(),
        recordType,
        date,
        totalSales: numSales,
        totalExpenses: numExpenses,
        estimatedProfit: numSales - numExpenses,
        notes: notes ? String(notes).trim() : undefined,
        items: processedItems,
        totalItemsSold: recordType === "itemized" ? totalItemsSold : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      salesRecords.unshift(newRecord);
      saveSalesRecordsToDisk(salesRecords);
      res.status(201).json({ success: true, message: "Sales record saved.", record: newRecord });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to save sales record." });
    }
  });

  app.put("/api/sales/:id", requireRole("merchant", "admin"), (req: AuthenticatedRequest, res) => {
    try {
      const record = salesRecords.find((r) => r.id === req.params.id);
      if (!record) return res.status(404).json({ error: "Sales record not found." });
      if (!assertStallOwnership(req, record.stallName)) {
        return res.status(403).json({ error: "Unauthorized." });
      }

      const { date, totalSales, totalExpenses, notes, items } = req.body;
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) record.date = date;
      if (totalExpenses !== undefined) record.totalExpenses = Math.max(0, parseFloat(totalExpenses) || 0);

      if (record.recordType === "itemized" && Array.isArray(items)) {
        let totalItemsSold = 0;
        record.items = items.map((it: any, index: number) => {
          const foodName = String(it.foodName || "").trim();
          if (!foodName) throw new Error(`Item #${index + 1} must have a name.`);
          const quantitySold = Math.max(0, parseInt(it.quantitySold, 10) || 0);
          const sellingPrice = Math.max(0, parseFloat(it.sellingPrice) || 0);
          totalItemsSold += quantitySold;
          return {
            id: it.id || `item_${Date.now()}_${index}`,
            dishId: it.dishId ? Number(it.dishId) : undefined,
            foodName,
            quantitySold,
            sellingPrice,
            totalSales: quantitySold * sellingPrice,
            notes: it.notes ? String(it.notes).trim() : undefined
          };
        });
        record.totalSales = record.items.reduce((sum, it) => sum + it.totalSales, 0);
        record.totalItemsSold = totalItemsSold;
      } else if (totalSales !== undefined) {
        record.totalSales = Math.max(0, parseFloat(totalSales) || 0);
      }

      record.estimatedProfit = record.totalSales - record.totalExpenses;
      if (notes !== undefined) record.notes = String(notes || "").trim();
      record.updatedAt = new Date().toISOString();

      saveSalesRecordsToDisk(salesRecords);
      res.json({ success: true, message: "Sales record updated.", record });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to update record." });
    }
  });

  app.delete("/api/sales/:id", requireRole("merchant", "admin"), (req: AuthenticatedRequest, res) => {
    const record = salesRecords.find((r) => r.id === req.params.id);
    if (!record) return res.status(404).json({ error: "Sales record not found." });
    if (!assertStallOwnership(req, record.stallName)) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    salesRecords = salesRecords.filter((r) => r.id !== req.params.id);
    saveSalesRecordsToDisk(salesRecords);
    res.json({ success: true, message: "Record deleted." });
  });

  // ==========================================================================
  // VITE MIDDLEWARE & STATIC FALLBACK
  // ==========================================================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Unsay Sud-an? server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
