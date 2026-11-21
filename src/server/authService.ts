import crypto from "crypto";
import path from "path";
import type { Request, Response, NextFunction } from "express";
import type { AuthUser, UserAccountStatus, UserRole } from "../types";
import { DATA_DIR, readJsonFile, writeJsonFile } from "./storage";

export interface StoredUserRecord {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserAccountStatus;
  passwordHash: string;
  passwordSalt: string;
  pinHash?: string;
  pinSalt?: string;
  stallId?: string;
  stallName?: string;
  stallNo?: string;
  contactInfo?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  loginCount: number;
}

const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function hashSecret(secret: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(secret, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifySecret(secret: string, hash: string, salt: string): boolean {
  if (!secret || !hash || !salt) return false;
  const computed = crypto.scryptSync(secret, salt, 64).toString("hex");
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function readUsers(): StoredUserRecord[] {
  return readJsonFile<StoredUserRecord[]>(USERS_FILE, []);
}

export function writeUsers(users: StoredUserRecord[]): boolean {
  return writeJsonFile(USERS_FILE, users);
}

export function toPublicUser(user: StoredUserRecord): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    status: user.status,
    stallName: user.stallName,
    stallNo: user.stallNo,
    contactInfo: user.contactInfo,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    loginCount: user.loginCount || 0
  };
}

export function signAuthToken(user: AuthUser): string {
  const payload = {
    uid: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    username: user.username,
    stallName: user.stallName,
    stallNo: user.stallNo,
    exp: Date.now() + TOKEN_TTL_MS
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyAuthToken(token: string): AuthUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"));
    if (!decoded.exp || Date.now() > decoded.exp) {
      return null;
    }

    // Re-check live user status from users.json so deactivated/suspended accounts lose access immediately
    const users = readUsers();
    const live = users.find((u) => u.id === decoded.uid);
    if (!live || live.status !== "active") {
      return null;
    }
    return toPublicUser(live);
  } catch {
    return null;
  }
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim() || null;
}

export function attachOptionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (token) {
    const user = verifyAuthToken(token);
    if (user) req.user = user;
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authentication required. Please log in." });
  }
  const user = verifyAuthToken(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid, expired, or deactivated session. Please log in again." });
  }
  req.user = user;
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Authentication required." });
    }
    const user = verifyAuthToken(token);
    if (!user) {
      return res.status(401).json({ error: "Session expired or account inactive. Please log in again." });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role permissions." });
    }
    req.user = user;
    next();
  };
}

function timingSafeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function getAdminBootstrapStatus(): { initialized: boolean; envPasscodeConfigured: boolean } {
  const users = readUsers();
  const hasAdmin = users.some((u) => u.role === "admin");
  const envPass = Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0);
  return {
    initialized: hasAdmin,
    envPasscodeConfigured: envPass
  };
}

export function bootstrapFirstAdmin(params: {
  name: string;
  username: string;
  email: string;
  password: string;
  passcode?: string;
}): {
  success: boolean;
  admin?: AuthUser;
  token?: string;
  error?: string;
  alreadyInitialized?: boolean;
  invalidPasscode?: boolean;
} {
  const users = readUsers();
  const existingAdmin = users.find((u) => u.role === "admin");
  if (existingAdmin) {
    return {
      success: false,
      alreadyInitialized: true,
      error: "Super Administrator account is already initialized. Public admin registration is permanently disabled."
    };
  }

  const envPass = process.env.ADMIN_PASSCODE?.trim();
  if (envPass) {
    const providedPass = (params.passcode || "").trim();
    if (!providedPass || !timingSafeCompare(providedPass, envPass)) {
      return {
        success: false,
        invalidPasscode: true,
        error: "Invalid server administrator setup passcode. Enter the configured ADMIN_PASSCODE secret."
      };
    }
  }

  const name = (params.name || "").trim();
  const username = (params.username || "").trim().toLowerCase();
  const email = (params.email || "").trim().toLowerCase();
  const password = params.password || "";

  if (!name || username.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    return {
      success: false,
      error: "Full name, username (min 3 chars), valid email, and password (minimum 8 characters) are required."
    };
  }

  if (!/^[a-z0-9._-]+$/.test(username)) {
    return {
      success: false,
      error: "Username may only contain letters, numbers, dots, underscores, and hyphens."
    };
  }

  if (users.some((u) => u.username.toLowerCase() === username || u.email.toLowerCase() === email)) {
    return { success: false, error: "Username or email is already registered." };
  }

  // Re-verify single-admin constraint immediately before persisting
  const latestUsers = readUsers();
  if (latestUsers.some((u) => u.role === "admin")) {
    return {
      success: false,
      alreadyInitialized: true,
      error: "Super Administrator account is already initialized. Public admin registration is permanently disabled."
    };
  }

  const { hash, salt } = hashSecret(password);
  const now = new Date().toISOString();
  const newAdmin: StoredUserRecord = {
    id: `admin_${crypto.randomBytes(6).toString("hex")}`,
    name,
    username,
    email,
    role: "admin",
    status: "active",
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
    loginCount: 1
  };

  latestUsers.push(newAdmin);
  writeUsers(latestUsers);
  const pub = toPublicUser(newAdmin);
  return { success: true, admin: pub, token: signAuthToken(pub) };
}

export function loginAdminAccount(params: {
  identifier?: string;
  password?: string;
}): { success: boolean; admin?: AuthUser; token?: string; error?: string } {
  const identifier = (params.identifier || "").trim().toLowerCase();
  const password = params.password || "";

  if (!identifier || !password) {
    return { success: false, error: "Administrator username/email and password are required." };
  }

  const users = readUsers();
  const idx = users.findIndex(
    (u) =>
      u.role === "admin" &&
      (u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier)
  );

  const envPass = process.env.ADMIN_PASSCODE?.trim();

  if (idx === -1) {
    return { success: false, error: "Invalid administrator credentials." };
  }

  const admin = users[idx];
  if (admin.status !== "active") {
    return { success: false, error: "This administrator account is deactivated." };
  }

  const passwordValid =
    verifySecret(password, admin.passwordHash, admin.passwordSalt) ||
    (Boolean(envPass) && timingSafeCompare(password, envPass!));

  if (!passwordValid) {
    return { success: false, error: "Invalid administrator credentials." };
  }

  const now = new Date().toISOString();
  users[idx].lastLoginAt = now;
  users[idx].loginCount = (users[idx].loginCount || 0) + 1;
  users[idx].updatedAt = now;
  writeUsers(users);

  const pub = toPublicUser(users[idx]);
  return { success: true, admin: pub, token: signAuthToken(pub) };
}

export function registerCustomerAccount(): {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
} {
  return {
    success: false,
    error: "Public student browsing does not require registration or sign-in."
  };
}

export function loginCustomerAccount(): {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
} {
  return {
    success: false,
    error: "Public student browsing does not require registration or sign-in."
  };
}

export function getAllUsersSafe(): AuthUser[] {
  return readUsers().map(toPublicUser);
}

export function updateUserStatusAdmin(
  userId: string,
  newStatus: UserAccountStatus,
  actingAdminId: string
): { success: boolean; user?: AuthUser; previousStatus?: string; error?: string } {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    return { success: false, error: "User not found." };
  }
  if (users[idx].id === actingAdminId || users[idx].role === "admin") {
    return { success: false, error: "The centralized Super Administrator account cannot be deactivated." };
  }

  const previousStatus = users[idx].status;
  users[idx].status = newStatus;
  users[idx].updatedAt = new Date().toISOString();
  writeUsers(users);
  return { success: true, user: toPublicUser(users[idx]), previousStatus };
}

export function updateUserRoleAdmin(
  userId: string,
  newRole: "customer" | "merchant",
  actingAdminId: string
): { success: boolean; user?: AuthUser; previousRole?: string; error?: string } {
  const users = readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    return { success: false, error: "User not found." };
  }
  if (users[idx].id === actingAdminId || users[idx].role === "admin") {
    return { success: false, error: "The single Super Administrator role cannot be altered or replicated." };
  }
  if (newRole !== "merchant" && newRole !== "customer") {
    return { success: false, error: "Role cannot be elevated to administrator." };
  }

  const previousRole = users[idx].role;
  users[idx].role = newRole;
  users[idx].updatedAt = new Date().toISOString();
  writeUsers(users);
  return { success: true, user: toPublicUser(users[idx]), previousRole };
}
