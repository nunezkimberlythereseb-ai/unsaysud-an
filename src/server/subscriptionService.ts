import fs from "fs";
import path from "path";
import crypto from "crypto";
import express from "express";
import {
  UserSubscription,
  PaymentRecord,
  AdminPaymentSettings,
  AppNotification,
  AuditLogEntry,
  AdminSubscriptionSummary,
  SubscriptionPlanType,
  PaymentMethod,
  TrialStatus,
  StallTrialRecord,
  AuthUser
} from "../types";
import {
  DATA_DIR,
  PRIVATE_PROOFS_DIR,
  PUBLIC_ADMIN_UPLOADS_DIR,
  ensureCoreDirectories,
  readJsonFile,
  writeJsonFile,
  resolveSafePath
} from "./storage";
import {
  AuthenticatedRequest,
  requireAuth,
  requireRole,
  attachOptionalAuth
} from "./authService";
import { getStallByName, readStalls } from "./stallsService";

ensureCoreDirectories();

const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "subscriptions.json");
const TRIALS_FILE = path.join(DATA_DIR, "stall_trials.json");
const PAYMENTS_FILE = path.join(DATA_DIR, "payments.json");
const NOTIFICATIONS_FILE = path.join(DATA_DIR, "notifications.json");
const SETTINGS_FILE = path.join(DATA_DIR, "admin_payment_settings.json");
const AUDIT_LOGS_FILE = path.join(DATA_DIR, "audit_logs.json");

interface StoredPaymentRecord extends PaymentRecord {
  proofStorageFile?: string;
}

// ============================================================================
// 1. DEFAULT SETTINGS & STORAGE LOADING
// ============================================================================

const defaultSettings: AdminPaymentSettings = {
  freeTrialDays: 14,
  trialEnabled: true,
  officialAppUrl:
    process.env.APP_URL ||
    "https://ais-pre-oruy4f4mj757x5vir5si2a-165677608534.asia-east1.run.app",
  requireStallApproval: false,
  defaultStudentBudget: 55,
  welcomeBannerMessage: "",
  gcash: {
    accountName: "USTP Cafeteria Admin (Finance Office)",
    accountNumber: "0917-882-9912",
    instructions:
      "Send the exact subscription amount via GCash Express Send. Save your screenshot and copy the Reference No.",
    isEnabled: true
  },
  bank: {
    bankName: "Landbank of the Philippines (USTP CDO Campus)",
    accountHolder: "USTP CDO Cafeteria Management",
    accountNumber: "3401-2290-88",
    instructions:
      "Transfer via InstaPay or PESONet. Include your Stall Number and Stall Name in the transaction remarks.",
    isEnabled: true
  },
  qrCode: {
    imageUrl: "/uploads/admin/official_qr.svg",
    instructions:
      "Scan using GCash, Maya, Landbank, or any QR Ph app. Verify merchant displays USTP CDO CAFETERIA.",
    isEnabled: true
  },
  plans: {
    weekly: {
      price: 25,
      durationDays: 7,
      name: "Weekly Plan",
      description: "₱25 for 7 full calendar days of stall storefront & dashboard visibility.",
      isEnabled: true
    },
    monthly: {
      price: 100,
      billingCycle: "calendar_month",
      name: "Monthly Plan",
      description: "₱100 for one full month. Regular renewal deadline aligns to the calendar month.",
      isEnabled: true
    }
  },
  updatedAt: new Date().toISOString(),
  updatedBy: "System Default"
};

function loadSettings(): AdminPaymentSettings {
  const loaded = readJsonFile<Partial<AdminPaymentSettings>>(SETTINGS_FILE, defaultSettings);
  const merged: AdminPaymentSettings = {
    ...defaultSettings,
    ...loaded,
    freeTrialDays:
      typeof loaded.freeTrialDays === "number" && loaded.freeTrialDays >= 1
        ? loaded.freeTrialDays
        : defaultSettings.freeTrialDays,
    trialEnabled: typeof loaded.trialEnabled === "boolean" ? loaded.trialEnabled : true,
    officialAppUrl:
      typeof loaded.officialAppUrl === "string" && loaded.officialAppUrl.trim()
        ? loaded.officialAppUrl.trim()
        : defaultSettings.officialAppUrl,
    requireStallApproval:
      typeof loaded.requireStallApproval === "boolean" ? loaded.requireStallApproval : false,
    defaultStudentBudget:
      typeof loaded.defaultStudentBudget === "number" &&
      loaded.defaultStudentBudget >= 1 &&
      loaded.defaultStudentBudget <= 500
        ? Math.round(loaded.defaultStudentBudget)
        : defaultSettings.defaultStudentBudget,
    welcomeBannerMessage:
      typeof loaded.welcomeBannerMessage === "string" ? loaded.welcomeBannerMessage : "",
    gcash: { ...defaultSettings.gcash, ...(loaded.gcash || {}) },
    bank: { ...defaultSettings.bank, ...(loaded.bank || {}) },
    qrCode: { ...defaultSettings.qrCode, ...(loaded.qrCode || {}) },
    plans: {
      weekly: { ...defaultSettings.plans.weekly, ...(loaded.plans?.weekly || {}) },
      monthly: { ...defaultSettings.plans.monthly, ...(loaded.plans?.monthly || {}) }
    }
  };
  if (!fs.existsSync(SETTINGS_FILE)) {
    writeJsonFile(SETTINGS_FILE, merged);
  }
  return merged;
}

export function normalizeSubscriptionStatus(
  status?: string
): "ACTIVE" | "PENDING" | "EXPIRED" | "SUSPENDED" {
  if (!status) return "EXPIRED";
  const upper = String(status).toUpperCase().trim();
  if (upper === "ACTIVE") return "ACTIVE";
  if (upper === "PENDING") return "PENDING";
  if (upper === "SUSPENDED") return "SUSPENDED";
  return "EXPIRED";
}

let adminSettings: AdminPaymentSettings = loadSettings();
let payments: StoredPaymentRecord[] = readJsonFile<StoredPaymentRecord[]>(PAYMENTS_FILE, []).filter(
  (p) => !String(p.id).startsWith("pay_demo_")
);
let notifications: AppNotification[] = readJsonFile<AppNotification[]>(NOTIFICATIONS_FILE, []).filter(
  (n) => n.id !== "notif_admin_init"
);
let auditLogs: AuditLogEntry[] = readJsonFile<AuditLogEntry[]>(AUDIT_LOGS_FILE, []);
let subscriptions: UserSubscription[] = readJsonFile<UserSubscription[]>(SUBSCRIPTIONS_FILE, []).map((s) => ({
  ...s,
  status: normalizeSubscriptionStatus(s.status)
}));
let trials: StallTrialRecord[] = readJsonFile<StallTrialRecord[]>(TRIALS_FILE, []);

function sanitizePaymentForClient(p: StoredPaymentRecord): PaymentRecord {
  const { proofStorageFile: _omit, ...rest } = p;
  return {
    ...rest,
    proofImageUrl: rest.proofImageUrl || `/api/payments/${rest.id}/proof`
  };
}

// ============================================================================
// 2. SHARED GETTERS & NOTIFICATION / AUDIT HELPERS
// ============================================================================

export function getAdminSettings(): AdminPaymentSettings {
  return adminSettings;
}

export function getAllPayments(): PaymentRecord[] {
  return payments.map(sanitizePaymentForClient);
}

export function getAllSubscriptions(): UserSubscription[] {
  return subscriptions;
}

export function getAllTrials(): StallTrialRecord[] {
  return trials;
}

export function getAuditLogs(): AuditLogEntry[] {
  return auditLogs;
}

export function computeRenewalsCount(rangeStartMs = 0, rangeEndMs = Infinity): number {
  const approvedSorted = payments
    .filter((p) => p.status === "Approved")
    .sort((a, b) => new Date(a.verifiedAt || a.submittedAt).getTime() - new Date(b.verifiedAt || b.submittedAt).getTime());

  const seenStallPaid = new Set<string>();
  let renewals = 0;
  for (const p of approvedSorted) {
    const ts = new Date(p.verifiedAt || p.submittedAt).getTime();
    const hadPriorPayment = seenStallPaid.has(p.stallName);
    seenStallPaid.add(p.stallName);
    if (hadPriorPayment && ts >= rangeStartMs && ts <= rangeEndMs) {
      renewals++;
    }
  }
  return renewals;
}

export function computeAwaitingPaymentCount(): number {
  const registeredStalls = readStalls();
  return registeredStalls.filter((s) => {
    if (s.status === "suspended" || s.status === "inactive" || s.registrationStatus === "rejected") {
      return false;
    }
    const info = getStallSubscriptionAndTrialInfo(s.name);
    return !info.isSubscribed && !info.isTrial;
  }).length;
}

export function addNotification(
  input: Omit<AppNotification, "id" | "createdAt" | "isRead">
): AppNotification {
  const entry: AppNotification = {
    id: `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    isRead: false,
    createdAt: new Date().toISOString(),
    ...input
  };
  notifications.unshift(entry);
  if (notifications.length > 1000) {
    notifications = notifications.slice(0, 1000);
  }
  writeJsonFile(NOTIFICATIONS_FILE, notifications);
  return entry;
}

export function logAuditAction(
  action: AuditLogEntry["action"],
  performedBy: string,
  targetStall: string,
  details: string,
  metadata?: Record<string, any>,
  extra?: {
    targetType?: AuditLogEntry["targetType"];
    targetUserId?: string;
    previousStatus?: string;
    newStatus?: string;
    remarks?: string;
  }
) {
  const entry: AuditLogEntry = {
    id: `audit_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    action,
    performedBy,
    targetType: extra?.targetType,
    targetStall,
    targetUserId: extra?.targetUserId,
    previousStatus: extra?.previousStatus,
    newStatus: extra?.newStatus,
    remarks: extra?.remarks,
    details,
    metadata,
    timestamp: new Date().toISOString()
  };
  auditLogs.unshift(entry);
  if (auditLogs.length > 1000) {
    auditLogs = auditLogs.slice(0, 1000);
  }
  writeJsonFile(AUDIT_LOGS_FILE, auditLogs);
}

// ============================================================================
// 3. DATE UTILITIES & CALENDAR-MONTH MATH
// ============================================================================

export function computeNextExpiration(
  currentExpirationIso: string | undefined,
  plan: SubscriptionPlanType,
  billingCycle: "calendar_month" | "weekly" | "exact_30_days" = "calendar_month"
): { startDate: Date; expirationDate: Date; nextDueDate: Date } {
  const now = new Date();
  let baseDate = now;

  if (currentExpirationIso) {
    const currentExp = new Date(currentExpirationIso);
    if (!isNaN(currentExp.getTime()) && currentExp.getTime() > now.getTime()) {
      baseDate = currentExp;
    }
  }

  let expDate: Date;

  if (plan === "weekly") {
    const days = Number(adminSettings.plans.weekly.durationDays) || 7;
    expDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
  } else if (billingCycle === "calendar_month") {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const day = baseDate.getDate();
    const lastDayOfCurrentMonth = new Date(year, month + 1, 0).getDate();
    if (day >= lastDayOfCurrentMonth - 3) {
      expDate = new Date(year, month + 2, 0, 23, 59, 59, 999);
    } else {
      expDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    }
  } else {
    expDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  return {
    startDate: baseDate === now ? now : new Date(now),
    expirationDate: expDate,
    nextDueDate: expDate
  };
}

// ============================================================================
// 4. AUTOMATIC EXPIRATION & REMINDERS SCHEDULER
// ============================================================================

export function checkAndExpireSubscriptionsAndSendReminders(): {
  expiredCount: number;
  remindersSent: number;
} {
  const now = Date.now();
  let expiredCount = 0;
  let remindersSent = 0;
  let subsModified = false;
  let notifsModified = false;

  subscriptions.forEach((sub) => {
    const norm = normalizeSubscriptionStatus(sub.status);
    const expTime = new Date(sub.expirationDate).getTime();
    const diffMs = expTime - now;
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    const expDateStr = (sub.expirationDate || "").split("T")[0];

    if (norm === "SUSPENDED") {
      sub.status = "SUSPENDED";
      return;
    }
    if (norm === "PENDING") {
      sub.status = "PENDING";
      return;
    }

    if (now >= expTime && norm === "ACTIVE") {
      sub.status = "EXPIRED";
      sub.updatedAt = new Date().toISOString();
      expiredCount++;
      subsModified = true;

      const dedupKey = `expired:${sub.id}:${expDateStr}`;
      if (!notifications.some((n) => n.dedupKey === dedupKey)) {
        notifications.unshift({
          id: `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
          recipientType: "stall",
          recipientId: sub.stallName,
          title: "Subscription Expired",
          message:
            "Your subscription has expired. Your menu items are now hidden from customers while your account and menu history remain safely preserved. Submit a renewal payment to restore visibility.",
          type: "expired",
          isRead: false,
          link: "subscription",
          createdAt: new Date().toISOString(),
          dedupKey
        });
        remindersSent++;
        notifsModified = true;
      }
    }

    if (norm === "ACTIVE" && now < expTime) {
      sub.status = "ACTIVE";
      const planPrice =
        sub.plan === "weekly" ? adminSettings.plans.weekly.price : adminSettings.plans.monthly.price;

      if (diffDays === 7 && sub.plan === "monthly") {
        const dedupKey = `remind_7d:${sub.id}:${expDateStr}`;
        if (!notifications.some((n) => n.dedupKey === dedupKey)) {
          notifications.unshift({
            id: `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
            recipientType: "stall",
            recipientId: sub.stallName,
            title: "Subscription Reminder (7 Days Left)",
            message: `Your monthly subscription expires in 7 days. Prepare your ₱${planPrice} renewal to keep your menu live.`,
            type: "reminder_7d",
            isRead: false,
            link: "subscription",
            createdAt: new Date().toISOString(),
            dedupKey
          });
          remindersSent++;
          notifsModified = true;
        }
      }

      if ((diffDays === 3 && sub.plan === "monthly") || (diffDays === 2 && sub.plan === "weekly")) {
        const dedupKey = `remind_${diffDays}d:${sub.id}:${expDateStr}`;
        if (!notifications.some((n) => n.dedupKey === dedupKey)) {
          notifications.unshift({
            id: `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
            recipientType: "stall",
            recipientId: sub.stallName,
            title: `Subscription Reminder (${diffDays} Days Left)`,
            message: `Your subscription expires in ${diffDays} days. Renew before expiration so customers continue seeing your dishes.`,
            type: "reminder_3d",
            isRead: false,
            link: "subscription",
            createdAt: new Date().toISOString(),
            dedupKey
          });
          remindersSent++;
          notifsModified = true;
        }
      }

      if (diffDays === 1) {
        const dedupKey = `remind_1d:${sub.id}:${expDateStr}`;
        if (!notifications.some((n) => n.dedupKey === dedupKey)) {
          notifications.unshift({
            id: `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
            recipientType: "stall",
            recipientId: sub.stallName,
            title: "Final Reminder: Subscription Due Tomorrow",
            message: "Your subscription expires tomorrow. Submit payment proof early for administrator review.",
            type: "reminder_1d",
            isRead: false,
            link: "subscription",
            createdAt: new Date().toISOString(),
            dedupKey
          });
          remindersSent++;
          notifsModified = true;
        }
      }

      if (diffDays === 0) {
        const dedupKey = `remind_due_today:${sub.id}:${expDateStr}`;
        if (!notifications.some((n) => n.dedupKey === dedupKey)) {
          notifications.unshift({
            id: `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
            recipientType: "stall",
            recipientId: sub.stallName,
            title: "Subscription Due Today",
            message: "Your subscription ends today. Renew your plan to keep your storefront visible.",
            type: "due_today",
            isRead: false,
            link: "subscription",
            createdAt: new Date().toISOString(),
            dedupKey
          });
          remindersSent++;
          notifsModified = true;
        }
      }
    }
  });

  let trialsModified = false;
  trials.forEach((trial) => {
    if (trial.startDate && trial.endDate) {
      const endMs = new Date(trial.endDate).getTime();
      const isPaid = subscriptions.some(
        (s) =>
          s.stallName === trial.stallName &&
          normalizeSubscriptionStatus(s.status) === "ACTIVE" &&
          !s.isTrial &&
          new Date(s.expirationDate).getTime() > now
      );

      if (isPaid) {
        if (trial.trialStatus !== "Subscribed") {
          trial.trialStatus = "Subscribed";
          trial.updatedAt = new Date().toISOString();
          trialsModified = true;
        }
      } else if (now >= endMs) {
        if (trial.trialStatus !== "Trial Expired") {
          trial.trialStatus = "Trial Expired";
          trial.updatedAt = new Date().toISOString();
          trialsModified = true;

          const dedupKey = `trial_expired:${trial.stallName}:${trial.endDate.split("T")[0]}`;
          if (!notifications.some((n) => n.dedupKey === dedupKey)) {
            notifications.unshift({
              id: `notif_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
              recipientType: "stall",
              recipientId: trial.stallName,
              title: "Free Trial Expired",
              message:
                "Your free trial has ended and your stall menu is currently hidden from customers. Choose a weekly or monthly plan and submit payment to continue.",
              type: "expired",
              isRead: false,
              link: "subscription",
              createdAt: new Date().toISOString(),
              dedupKey
            });
            notifsModified = true;
          }
        }
      } else if (trial.trialStatus !== "Trial Active") {
        trial.trialStatus = "Trial Active";
        trial.updatedAt = new Date().toISOString();
        trialsModified = true;
      }
    }
  });

  if (subsModified) writeJsonFile(SUBSCRIPTIONS_FILE, subscriptions);
  if (trialsModified) writeJsonFile(TRIALS_FILE, trials);
  if (notifsModified) writeJsonFile(NOTIFICATIONS_FILE, notifications);

  return { expiredCount, remindersSent };
}

checkAndExpireSubscriptionsAndSendReminders();
setInterval(checkAndExpireSubscriptionsAndSendReminders, 60 * 1000);

// ============================================================================
// 5. AUTHORITATIVE TRIAL & SUBSCRIPTION CALCULATOR
// ============================================================================

export function activateTrialForStall(
  stallName: string,
  ownerId: string,
  actorLabel: string = "Stall Registration"
): {
  success: boolean;
  error?: string;
  trialStatus: TrialStatus;
  trialStartDate: string | null;
  trialEndDate: string | null;
  trialDaysRemaining: number;
} {
  const cleanStallName = stallName.trim();
  const durationDays = Math.max(1, Number(adminSettings.freeTrialDays) || 14);
  const existingTrial = trials.find((t) => t.stallName === cleanStallName);

  if (existingTrial && existingTrial.startDate) {
    const endMs = new Date(existingTrial.endDate!).getTime();
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((endMs - now) / (24 * 60 * 60 * 1000)));
    const isExpired = now >= endMs;
    return {
      success: false,
      error: isExpired
        ? `Your ${existingTrial.durationDays}-day free trial has already expired and cannot be restarted.`
        : "Your free trial is already active.",
      trialStatus: isExpired ? "Trial Expired" : "Trial Active",
      trialStartDate: existingTrial.startDate,
      trialEndDate: existingTrial.endDate,
      trialDaysRemaining: remaining
    };
  }

  if (!adminSettings.trialEnabled) {
    return {
      success: false,
      error: "Free trials are currently disabled by platform administration.",
      trialStatus: "Not Started",
      trialStartDate: null,
      trialEndDate: null,
      trialDaysRemaining: 0
    };
  }

  const now = new Date();
  const startDate = now.toISOString();
  const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  if (!existingTrial) {
    trials.push({
      stallName: cleanStallName,
      ownerId,
      trialStatus: "Trial Active",
      startDate,
      endDate,
      durationDays,
      createdAt: startDate,
      updatedAt: startDate
    });
  } else {
    existingTrial.ownerId = ownerId;
    existingTrial.trialStatus = "Trial Active";
    existingTrial.startDate = startDate;
    existingTrial.endDate = endDate;
    existingTrial.durationDays = durationDays;
    existingTrial.updatedAt = startDate;
  }
  writeJsonFile(TRIALS_FILE, trials);

  let sub = subscriptions.find((s) => s.stallName === cleanStallName);
  if (!sub) {
    sub = {
      id: `sub_trial_${cleanStallName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
      stallName: cleanStallName,
      ownerId,
      plan: "trial",
      status: "ACTIVE",
      isTrial: true,
      trialStartDate: startDate,
      trialEndDate: endDate,
      trialStatus: "Trial Active",
      startDate,
      expirationDate: endDate,
      nextDueDate: endDate,
      billingCycle: "weekly",
      autoRenewReminder: true,
      updatedAt: startDate,
      createdAt: startDate
    };
    subscriptions.push(sub);
  } else {
    sub.status = "ACTIVE";
    sub.isTrial = true;
    sub.trialStartDate = startDate;
    sub.trialEndDate = endDate;
    sub.trialStatus = "Trial Active";
    sub.startDate = startDate;
    sub.expirationDate = endDate;
    sub.nextDueDate = endDate;
    sub.updatedAt = startDate;
  }
  writeJsonFile(SUBSCRIPTIONS_FILE, subscriptions);

  addNotification({
    recipientType: "stall",
    recipientId: cleanStallName,
    title: `Free ${durationDays}-Day Trial Activated`,
    message: `Welcome! Your ${durationDays}-day free trial is active until ${new Date(
      endDate
    ).toLocaleDateString()}. Your stall menu is live to customers.`,
    type: "access_granted",
    link: "portal"
  });

  logAuditAction(
    "grant_manual_access",
    actorLabel,
    cleanStallName,
    `Started ${durationDays}-day free trial ending ${endDate}`,
    { durationDays, trialEndDate: endDate },
    {
      targetType: "stall",
      previousStatus: "Not Started",
      newStatus: "Trial Active",
      remarks: `${durationDays}-day trial`
    }
  );

  return {
    success: true,
    trialStatus: "Trial Active",
    trialStartDate: startDate,
    trialEndDate: endDate,
    trialDaysRemaining: durationDays
  };
}

export function getStallSubscriptionAndTrialInfo(stallName: string) {
  checkAndExpireSubscriptionsAndSendReminders();

  const now = Date.now();
  const stallRec = getStallByName(stallName);
  const sub = subscriptions.find((s) => s.stallName === stallName);
  let trial = trials.find((t) => t.stallName === stallName);

  const defaultTrialDays = Number(adminSettings.freeTrialDays) || 14;

  if (!trial) {
    trial = {
      stallName,
      ownerId: stallRec?.ownerId || "",
      trialStatus: "Not Started",
      startDate: null,
      endDate: null,
      durationDays: defaultTrialDays,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  const normSubStatus = sub ? normalizeSubscriptionStatus(sub.status) : "EXPIRED";
  const latestPaymentRaw = payments.find((p) => p.stallName === stallName) || null;
  const pendingPaymentRaw = payments.find(
    (p) => p.stallName === stallName && p.status === "Pending Verification"
  );

  // Operational suspension or deactivation on stall record takes precedence over subscription
  if (stallRec && (stallRec.status === "suspended" || stallRec.status === "inactive")) {
    return {
      hasSubscription: Boolean(sub),
      status: stallRec.status === "suspended" ? ("SUSPENDED" as const) : ("EXPIRED" as const),
      trialStatus: trial.trialStatus,
      isTrial: false,
      isSubscribed: false,
      trialStartDate: trial.startDate,
      trialEndDate: trial.endDate,
      trialDaysRemaining: 0,
      serverTime: new Date().toISOString(),
      isExpired: true,
      daysRemaining: 0,
      freeTrialDays: defaultTrialDays,
      stallSuspended: stallRec.status === "suspended",
      stallStatus: stallRec.status,
      suspensionReason: stallRec.suspensionReason,
      subscription: sub,
      pendingPayment: pendingPaymentRaw ? sanitizePaymentForClient(pendingPaymentRaw) : undefined,
      latestPayment: latestPaymentRaw ? sanitizePaymentForClient(latestPaymentRaw) : undefined
    };
  }

  if (normSubStatus === "SUSPENDED") {
    return {
      hasSubscription: true,
      status: "SUSPENDED" as const,
      trialStatus: trial.trialStatus,
      isTrial: false,
      isSubscribed: false,
      trialStartDate: trial.startDate,
      trialEndDate: trial.endDate,
      trialDaysRemaining: 0,
      serverTime: new Date().toISOString(),
      isExpired: true,
      daysRemaining: 0,
      freeTrialDays: defaultTrialDays,
      stallSuspended: true,
      stallStatus: stallRec?.status || "suspended",
      suspensionReason: stallRec?.suspensionReason,
      subscription: sub,
      pendingPayment: pendingPaymentRaw ? sanitizePaymentForClient(pendingPaymentRaw) : undefined,
      latestPayment: latestPaymentRaw ? sanitizePaymentForClient(latestPaymentRaw) : undefined
    };
  }

  const isPaidActive =
    Boolean(sub) &&
    normSubStatus === "ACTIVE" &&
    !sub!.isTrial &&
    new Date(sub!.expirationDate).getTime() > now;

  let trialStatus: TrialStatus = trial.trialStatus;
  let isTrial = false;
  let isSubscribed = false;
  let trialDaysRemaining = 0;

  if (isPaidActive) {
    trialStatus = "Subscribed";
    isSubscribed = true;
  } else if (trial.startDate && trial.endDate) {
    const endMs = new Date(trial.endDate).getTime();
    if (now < endMs) {
      trialStatus = "Trial Active";
      isTrial = true;
      trialDaysRemaining = Math.max(1, Math.ceil((endMs - now) / (24 * 60 * 60 * 1000)));
    } else {
      trialStatus = "Trial Expired";
      trialDaysRemaining = 0;
    }
  } else {
    trialStatus = "Not Started";
  }

  const expTime = sub ? new Date(sub.expirationDate).getTime() : 0;
  const daysRemaining = isPaidActive
    ? Math.max(0, Math.ceil((expTime - now) / (24 * 60 * 60 * 1000)))
    : isTrial
    ? trialDaysRemaining
    : 0;

  const isExpired = !isPaidActive && !isTrial;
  const finalStatus: "ACTIVE" | "PENDING" | "EXPIRED" | "SUSPENDED" =
    isPaidActive || isTrial
      ? "ACTIVE"
      : pendingPaymentRaw
      ? "PENDING"
      : "EXPIRED";

  return {
    hasSubscription: Boolean(sub) || isTrial || isPaidActive,
    status: finalStatus,
    trialStatus,
    isTrial,
    isSubscribed,
    trialStartDate: trial.startDate,
    trialEndDate: trial.endDate,
    trialDaysRemaining,
    serverTime: new Date().toISOString(),
    isExpired,
    daysRemaining,
    freeTrialDays: defaultTrialDays,
    stallSuspended: false,
    stallStatus: stallRec?.status || "active",
    subscription: sub,
    pendingPayment: pendingPaymentRaw ? sanitizePaymentForClient(pendingPaymentRaw) : undefined,
    latestPayment: latestPaymentRaw ? sanitizePaymentForClient(latestPaymentRaw) : undefined
  };
}

export function isStallSubscriptionActive(stallName: string): {
  active: boolean;
  status: "ACTIVE" | "PENDING" | "EXPIRED" | "SUSPENDED";
  reason?: string;
  subscription?: UserSubscription;
} {
  if (!stallName) return { active: false, status: "EXPIRED", reason: "Stall identifier required." };

  const stallRec = getStallByName(stallName);
  if (!stallRec) {
    return { active: false, status: "EXPIRED", reason: "Stall is not registered." };
  }
  if (stallRec.registrationStatus !== "approved") {
    return { active: false, status: "PENDING", reason: "Stall registration is awaiting approval." };
  }
  if (stallRec.status === "suspended") {
    return {
      active: false,
      status: "SUSPENDED",
      reason: stallRec.suspensionReason || "Stall has been suspended by an administrator."
    };
  }
  if (stallRec.status === "inactive") {
    return {
      active: false,
      status: "EXPIRED",
      reason: "Stall is currently marked inactive."
    };
  }

  const info = getStallSubscriptionAndTrialInfo(stallName);
  if (info.status === "ACTIVE") {
    return { active: true, status: "ACTIVE", subscription: info.subscription };
  }
  if (info.status === "SUSPENDED") {
    return {
      active: false,
      status: "SUSPENDED",
      reason: "Stall access has been suspended by the administrator.",
      subscription: info.subscription
    };
  }
  if (info.status === "PENDING") {
    return {
      active: false,
      status: "PENDING",
      reason: "Subscription payment is pending administrator verification.",
      subscription: info.subscription
    };
  }
  return {
    active: false,
    status: "EXPIRED",
    reason: "Subscription or free trial has expired. Your menus are hidden until renewed and approved.",
    subscription: info.subscription
  };
}

// ============================================================================
// 6. PROTECTED ROUTES REGISTRATION
// ============================================================================

export function registerSubscriptionRoutes(app: express.Express) {
  // Public payment methods & plans info + public campus settings
  app.get("/api/subscription/settings", (_req, res) => {
    res.json({
      success: true,
      settings: {
        freeTrialDays: adminSettings.freeTrialDays,
        trialEnabled: adminSettings.trialEnabled,
        officialAppUrl: adminSettings.officialAppUrl,
        requireStallApproval: adminSettings.requireStallApproval,
        defaultStudentBudget: adminSettings.defaultStudentBudget,
        welcomeBannerMessage: adminSettings.welcomeBannerMessage,
        gcash: adminSettings.gcash,
        bank: adminSettings.bank,
        qrCode: adminSettings.qrCode,
        plans: adminSettings.plans
      }
    });
  });

  // Stall Owner / Admin: Subscription & Trial status
  app.get(
    "/api/subscription/status/:stallName",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      try {
        const stallName = decodeURIComponent(req.params.stallName);
        if (req.user?.role === "merchant" && req.user.stallName !== stallName) {
          return res.status(403).json({ error: "Unauthorized: cannot view another stall's subscription." });
        }

        const info = getStallSubscriptionAndTrialInfo(stallName);
        res.json({
          ...info,
          stallName
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to retrieve subscription status." });
      }
    }
  );

  // Stall Owner / Admin: Start Free Trial
  app.post(
    "/api/subscription/start-trial",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      try {
        const stallName = String(req.body.stallName || req.user?.stallName || "").trim();
        if (!stallName) {
          return res.status(400).json({ error: "Stall name is required." });
        }
        if (req.user?.role === "merchant" && req.user.stallName !== stallName) {
          return res.status(403).json({ error: "Unauthorized: cannot modify another stall's trial." });
        }

        const result = activateTrialForStall(
          stallName,
          req.user?.id || "merchant",
          req.user?.username || "Stall Owner"
        );
        if (!result.success) {
          return res.status(400).json({
            error: result.error,
            trialStatus: result.trialStatus,
            trialStartDate: result.trialStartDate,
            trialEndDate: result.trialEndDate,
            trialDaysRemaining: result.trialDaysRemaining,
            serverTime: new Date().toISOString()
          });
        }

        const days = Number(adminSettings.freeTrialDays) || 14;
        return res.json({
          success: true,
          message: `Free ${days}-Day Trial activated successfully.`,
          trialStatus: result.trialStatus,
          trialStartDate: result.trialStartDate,
          trialEndDate: result.trialEndDate,
          trialDaysRemaining: result.trialDaysRemaining,
          serverTime: new Date().toISOString()
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to start free trial." });
      }
    }
  );

  // Stall Owner: Submit (or Resubmit) Payment Proof for Verification
  app.post(
    "/api/subscription/submit-payment",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      try {
        const {
          stallName,
          plan,
          paymentMethod,
          referenceNumber,
          paymentDate,
          proofImageDataUrl,
          notes,
          resubmitPaymentId
        } = req.body;

        const targetStall = String(stallName || req.user?.stallName || "").trim();
        if (!targetStall) {
          return res.status(400).json({ error: "Stall name is required." });
        }
        if (req.user?.role === "merchant" && req.user.stallName !== targetStall) {
          return res.status(403).json({ error: "Unauthorized: cannot submit payments for another stall." });
        }

        if (!plan || !paymentMethod || !referenceNumber || (!proofImageDataUrl && !resubmitPaymentId)) {
          return res.status(400).json({
            error: "Plan, payment method, reference number, and payment receipt screenshot are required."
          });
        }

        const cleanRef = String(referenceNumber).trim();
        if (cleanRef.length < 4) {
          return res.status(400).json({ error: "Please enter a valid payment reference or transaction number." });
        }

        // Prevent duplicate active or pending payments using same reference number
        const duplicate = payments.find(
          (p) =>
            p.id !== resubmitPaymentId &&
            p.referenceNumber.toLowerCase() === cleanRef.toLowerCase() &&
            (p.status === "Approved" || p.status === "Pending Verification")
        );
        if (duplicate) {
          return res.status(400).json({
            error: "This reference number has already been submitted or verified."
          });
        }

        // Prevent accidental duplicate pending submission if another pending verification already exists
        if (!resubmitPaymentId) {
          const alreadyPending = payments.find(
            (p) => p.stallName === targetStall && p.status === "Pending Verification"
          );
          if (alreadyPending) {
            return res.status(400).json({
              error: `You already have a payment awaiting verification (Ref: ${alreadyPending.referenceNumber}). Please wait for administrator review.`
            });
          }
        }

        const authoritativeAmount =
          plan === "weekly" ? adminSettings.plans.weekly.price : adminSettings.plans.monthly.price;

        const stallRecord = getStallByName(targetStall);
        const ownerName = stallRecord?.ownerName || req.user?.name || targetStall;
        const ownerEmail = stallRecord?.email || req.user?.email;
        const ownerContact = stallRecord?.contactInfo || req.user?.contactInfo;

        const paymentId =
          resubmitPaymentId || `pay_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

        // Save proof privately inside DATA_DIR/proofs (NOT /public)
        let savedStorageFile: string | undefined;
        if (typeof proofImageDataUrl === "string" && proofImageDataUrl.startsWith("data:image/")) {
          const matches = proofImageDataUrl.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
          if (!matches) {
            return res.status(400).json({
              error: "Invalid receipt format. Only JPG, JPEG, PNG, and WEBP screenshots are accepted."
            });
          }
          let ext = matches[1].toLowerCase();
          if (ext === "jpeg") ext = "jpg";
          const buffer = Buffer.from(matches[2], "base64");
          if (buffer.length > 12 * 1024 * 1024) {
            return res.status(400).json({ error: "Receipt image must not exceed 12MB." });
          }

          const filename = `proof_${paymentId.replace(/[^a-zA-Z0-9_-]/g, "")}_${Date.now()}.${ext}`;
          const targetPath = resolveSafePath(PRIVATE_PROOFS_DIR, filename);
          fs.writeFileSync(targetPath, buffer);
          savedStorageFile = filename;
        }

        const nowIso = new Date().toISOString();

        // Resubmission flow for Rejected or Requires Additional Information
        if (resubmitPaymentId) {
          const existingIdx = payments.findIndex(
            (p) => p.id === resubmitPaymentId && p.stallName === targetStall
          );
          if (existingIdx === -1) {
            return res.status(404).json({ error: "Payment record for resubmission not found." });
          }
          const existing = payments[existingIdx];
          if (
            existing.status !== "Requires Additional Information" &&
            existing.status !== "Rejected"
          ) {
            return res.status(400).json({
              error: "Only payments marked Rejected or Requires Additional Information can be resubmitted."
            });
          }

          const previousStatus = existing.status;
          existing.plan = plan as SubscriptionPlanType;
          existing.amount = authoritativeAmount;
          existing.paymentMethod = paymentMethod as PaymentMethod;
          existing.referenceNumber = cleanRef;
          existing.paymentDate = paymentDate || existing.paymentDate;
          if (savedStorageFile) {
            existing.proofStorageFile = savedStorageFile;
            existing.proofImageUrl = `/api/payments/${existing.id}/proof?v=${Date.now()}`;
          }
          existing.status = "Pending Verification";
          existing.resubmittedAt = nowIso;
          existing.resubmissionNotes = notes ? String(notes).trim() : undefined;
          existing.notes = notes ? String(notes).trim() : existing.notes;
          existing.history = existing.history || [];
          existing.history.push({
            timestamp: nowIso,
            actor: ownerName,
            status: "Pending Verification",
            note: `Resubmitted after "${previousStatus}". Ref: ${cleanRef}${
              notes ? ` · Note: ${String(notes).trim()}` : ""
            }`
          });

          writeJsonFile(PAYMENTS_FILE, payments);

          addNotification({
            recipientType: "admin",
            recipientId: "admin",
            title: "Payment Information Resubmitted",
            message: `${targetStall} updated payment Ref: ${cleanRef} (₱${authoritativeAmount}) and resubmitted for verification.`,
            type: "payment_pending",
            link: "admin"
          });

          return res.json({
            success: true,
            message:
              "Your payment has been submitted successfully and is currently awaiting administrator verification. Your subscription will only be activated after your payment has been reviewed and approved.",
            payment: sanitizePaymentForClient(existing)
          });
        }

        if (!savedStorageFile) {
          return res.status(400).json({ error: "A valid payment receipt screenshot is required." });
        }

        const newPayment: StoredPaymentRecord = {
          id: paymentId,
          stallName: targetStall,
          ownerId: stallRecord?.ownerId || req.user?.id || targetStall,
          ownerName,
          ownerEmail,
          ownerContact,
          plan: plan as SubscriptionPlanType,
          amount: authoritativeAmount,
          paymentMethod: paymentMethod as PaymentMethod,
          referenceNumber: cleanRef,
          paymentDate: paymentDate || nowIso.split("T")[0],
          proofImageUrl: `/api/payments/${paymentId}/proof`,
          proofStorageFile: savedStorageFile,
          status: "Pending Verification",
          submittedAt: nowIso,
          notes: notes ? String(notes).trim() : undefined,
          history: [
            {
              timestamp: nowIso,
              actor: ownerName,
              status: "Pending Verification",
              note: `Submitted ₱${authoritativeAmount} (${plan}) via ${String(
                paymentMethod
              ).toUpperCase()}, Ref: ${cleanRef}`
            }
          ]
        };

        payments.unshift(newPayment);
        writeJsonFile(PAYMENTS_FILE, payments);

        addNotification({
          recipientType: "admin",
          recipientId: "admin",
          title: "New Payment Pending Verification",
          message: `${targetStall} submitted ₱${authoritativeAmount} (${plan}) via ${String(
            paymentMethod
          ).toUpperCase()} (Ref: ${cleanRef}).`,
          type: "payment_pending",
          link: "admin"
        });

        return res.json({
          success: true,
          message:
            "Your payment has been submitted successfully and is currently awaiting administrator verification. Your subscription will only be activated after your payment has been reviewed and approved.",
          payment: sanitizePaymentForClient(newPayment)
        });
      } catch (err: any) {
        console.error("Payment submission error:", err);
        res.status(500).json({ error: err.message || "Failed to submit payment." });
      }
    }
  );

  // Stall Owner / Admin: Payment History for a Stall
  app.get(
    "/api/subscription/payments/:stallName",
    requireRole("merchant", "admin"),
    (req: AuthenticatedRequest, res) => {
      try {
        const stallName = decodeURIComponent(req.params.stallName);
        if (req.user?.role === "merchant" && req.user.stallName !== stallName) {
          return res.status(403).json({ error: "Unauthorized: cannot view another stall's payments." });
        }

        const list = payments
          .filter((p) => p.stallName === stallName)
          .map(sanitizePaymentForClient);
        res.json({ success: true, payments: list });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to get payment history." });
      }
    }
  );

  // Protected Private Proof Endpoint: ONLY Admin or Owning Stall Owner
  app.get(
    "/api/payments/:paymentId/proof",
    requireAuth,
    (req: AuthenticatedRequest, res) => {
      try {
        const payment = payments.find((p) => p.id === req.params.paymentId);
        if (!payment) {
          return res.status(404).json({ error: "Payment record not found." });
        }

        const isAdmin = req.user?.role === "admin";
        const isOwningMerchant =
          req.user?.role === "merchant" && req.user.stallName === payment.stallName;

        if (!isAdmin && !isOwningMerchant) {
          return res.status(403).json({ error: "Forbidden: receipt is private." });
        }

        if (!payment.proofStorageFile) {
          return res.status(404).json({ error: "Receipt file not available." });
        }

        const filePath = resolveSafePath(PRIVATE_PROOFS_DIR, path.basename(payment.proofStorageFile));
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: "Receipt file missing from private storage." });
        }

        res.setHeader("Cache-Control", "no-store, private");
        res.sendFile(filePath);
      } catch (err: any) {
        res.status(400).json({ error: err.message || "Invalid receipt request." });
      }
    }
  );

  // Notifications: Strictly scoped by authenticated role
  app.get("/api/notifications", attachOptionalAuth, (req: AuthenticatedRequest, res) => {
    try {
      checkAndExpireSubscriptionsAndSendReminders();

      let filtered: AppNotification[] = [];
      if (req.user?.role === "admin") {
        filtered = notifications.filter(
          (n) => n.recipientType === "admin" || n.recipientType === "all"
        );
      } else if (req.user?.role === "merchant" && req.user.stallName) {
        filtered = notifications.filter(
          (n) =>
            (n.recipientType === "stall" && n.recipientId === req.user!.stallName) ||
            n.recipientType === "all"
        );
      } else {
        filtered = notifications.filter(
          (n) => n.recipientType === "customer" || n.recipientType === "all"
        );
      }

      const unreadCount = filtered.filter((n) => !n.isRead).length;
      res.json({ success: true, notifications: filtered, unreadCount });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load notifications." });
    }
  });

  app.post("/api/notifications/mark-read", attachOptionalAuth, (req: AuthenticatedRequest, res) => {
    try {
      const { notificationId, markAll } = req.body;
      const canAccess = (n: AppNotification) => {
        if (req.user?.role === "admin") {
          return n.recipientType === "admin" || n.recipientType === "all";
        }
        if (req.user?.role === "merchant" && req.user.stallName) {
          return (
            (n.recipientType === "stall" && n.recipientId === req.user.stallName) ||
            n.recipientType === "all"
          );
        }
        return n.recipientType === "customer" || n.recipientType === "all";
      };

      if (markAll) {
        notifications.forEach((n) => {
          if (canAccess(n)) n.isRead = true;
        });
      } else if (notificationId) {
        const item = notifications.find((n) => n.id === notificationId);
        if (item && canAccess(item)) {
          item.isRead = true;
        }
      }

      writeJsonFile(NOTIFICATIONS_FILE, notifications);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to mark notification read." });
    }
  });

  // ==========================================================================
  // ADMIN SUBSCRIPTION, PAYMENT VERIFICATION, SETTINGS & AUDIT ROUTES
  // ==========================================================================

  app.get("/api/admin/summary", requireRole("admin"), (_req, res) => {
    try {
      checkAndExpireSubscriptionsAndSendReminders();

      const registeredStalls = readStalls();
      const stallNames = new Set(registeredStalls.map((s) => s.name));
      const now = Date.now();

      const activeSubs = registeredStalls.filter((s) => isStallSubscriptionActive(s.name).active);
      const activePaidSubs = subscriptions.filter(
        (s) =>
          stallNames.has(s.stallName) &&
          normalizeSubscriptionStatus(s.status) === "ACTIVE" &&
          !s.isTrial &&
          new Date(s.expirationDate).getTime() > now
      );
      const activeTrials = trials.filter(
        (t) =>
          stallNames.has(t.stallName) &&
          t.trialStatus === "Trial Active" &&
          t.endDate &&
          new Date(t.endDate).getTime() > now
      );

      const summary: AdminSubscriptionSummary = {
        totalSubscribers: registeredStalls.length,
        activeSubscribers: activeSubs.length,
        activeTrials: activeTrials.length,
        weeklySubscribers: activePaidSubs.filter((s) => s.plan === "weekly").length,
        monthlySubscribers: activePaidSubs.filter((s) => s.plan === "monthly").length,
        expiredSubscribers: registeredStalls.length - activeSubs.length,
        awaitingPaymentCount: computeAwaitingPaymentCount(),
        renewalsCount: computeRenewalsCount(),
        pendingPaymentsCount: payments.filter((p) => p.status === "Pending Verification").length,
        requiresInfoPaymentsCount: payments.filter(
          (p) => p.status === "Requires Additional Information"
        ).length,
        approvedPaymentsCount: payments.filter((p) => p.status === "Approved").length,
        rejectedPaymentsCount: payments.filter((p) => p.status === "Rejected").length,
        totalVerifiedRevenue: payments
          .filter((p) => p.status === "Approved")
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      };

      const stallStatuses = registeredStalls.map((stall) => {
        const info = getStallSubscriptionAndTrialInfo(stall.name);
        return {
          ...info,
          stallName: stall.name,
          stallId: stall.id,
          ownerName: stall.ownerName,
          email: stall.email,
          contactInfo: stall.contactInfo,
          zone: stall.zone,
          operationalStatus: stall.status,
          registrationStatus: stall.registrationStatus
        };
      });

      res.json({
        success: true,
        summary,
        payments: payments.map(sanitizePaymentForClient),
        subscriptions,
        trials,
        stallStatuses,
        settings: adminSettings
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load admin summary." });
    }
  });

  // Admin: Verify Payment (Approve / Reject / Request Additional Information)
  app.post(
    "/api/admin/payments/:paymentId/verify",
    requireRole("admin"),
    (req: AuthenticatedRequest, res) => {
      try {
        const { paymentId } = req.params;
        const { action, rejectionReason, requestedInfoMessage } = req.body;
        const payment = payments.find((p) => p.id === paymentId);

        if (!payment) {
          return res.status(404).json({ error: "Payment record not found." });
        }

        if (!["approve", "reject", "request_info"].includes(action)) {
          return res.status(400).json({
            error: "Action must be 'approve', 'reject', or 'request_info'."
          });
        }

        const verifier = req.user?.name || req.user?.username || "Administrator";
        const previousStatus = payment.status;
        const now = new Date();
        const nowIso = now.toISOString();
        payment.history = payment.history || [];

        if (action === "approve") {
          let sub = subscriptions.find((s) => s.stallName === payment.stallName);
          const currentActiveExp =
            sub && normalizeSubscriptionStatus(sub.status) === "ACTIVE" && !sub.isTrial
              ? sub.expirationDate
              : undefined;

          const { startDate, expirationDate, nextDueDate } = computeNextExpiration(
            currentActiveExp,
            payment.plan,
            payment.plan === "monthly" ? adminSettings.plans.monthly.billingCycle : "weekly"
          );

          const durationDays = Math.max(
            1,
            Math.ceil((expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
          );

          payment.status = "Approved";
          payment.verifiedAt = nowIso;
          payment.verifiedBy = verifier;
          payment.rejectionReason = undefined;
          payment.requestedInfoMessage = undefined;
          payment.durationGrantedDays = durationDays;
          payment.subscriptionExtendedTo = expirationDate.toISOString();
          payment.history.push({
            timestamp: nowIso,
            actor: verifier,
            status: "Approved",
            note: `Approved ${payment.plan} plan (₱${payment.amount}). Active until ${expirationDate.toLocaleDateString()}.`
          });

          if (!sub) {
            sub = {
              id: `sub_${payment.stallName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
              stallName: payment.stallName,
              ownerId: payment.ownerId,
              plan: payment.plan,
              status: "ACTIVE",
              isTrial: false,
              isPaidSubscription: true,
              trialStatus: "Subscribed",
              startDate: startDate.toISOString(),
              expirationDate: expirationDate.toISOString(),
              nextDueDate: nextDueDate.toISOString(),
              billingCycle:
                payment.plan === "monthly" ? adminSettings.plans.monthly.billingCycle : "weekly",
              lastPaymentId: payment.id,
              autoRenewReminder: true,
              updatedAt: nowIso,
              createdAt: nowIso
            };
            subscriptions.push(sub);
          } else {
            sub.plan = payment.plan;
            sub.status = "ACTIVE";
            sub.isTrial = false;
            sub.isPaidSubscription = true;
            sub.trialStatus = "Subscribed";
            sub.startDate = startDate.toISOString();
            sub.expirationDate = expirationDate.toISOString();
            sub.nextDueDate = nextDueDate.toISOString();
            sub.billingCycle =
              payment.plan === "monthly" ? adminSettings.plans.monthly.billingCycle : "weekly";
            sub.lastPaymentId = payment.id;
            sub.updatedAt = nowIso;
          }

          const trialRec = trials.find((t) => t.stallName === payment.stallName);
          if (trialRec) {
            trialRec.trialStatus = "Subscribed";
            trialRec.updatedAt = nowIso;
            writeJsonFile(TRIALS_FILE, trials);
          }

          writeJsonFile(SUBSCRIPTIONS_FILE, subscriptions);
          writeJsonFile(PAYMENTS_FILE, payments);

          addNotification({
            recipientType: "stall",
            recipientId: payment.stallName,
            title: "Payment Approved — Subscription Active",
            message: `Your ₱${payment.amount} payment (Ref: ${payment.referenceNumber}) was approved. Your ${payment.plan} subscription is active until ${expirationDate.toLocaleDateString()}.`,
            type: "payment_approved",
            link: "portal"
          });

          logAuditAction(
            "approve_payment",
            verifier,
            payment.stallName,
            `Approved payment ${payment.id} (₱${payment.amount}, Ref: ${payment.referenceNumber})`,
            { paymentId: payment.id, plan: payment.plan, amount: payment.amount },
            {
              targetType: "payment",
              previousStatus,
              newStatus: "Approved",
              remarks: `Subscription extended until ${expirationDate.toLocaleDateString()}`
            }
          );

          return res.json({
            success: true,
            message: `Payment approved. ${payment.stallName} is active until ${expirationDate.toLocaleDateString()}.`,
            payment: sanitizePaymentForClient(payment),
            subscription: sub
          });
        }

        if (action === "request_info") {
          const msg = String(requestedInfoMessage || "").trim();
          if (!msg || msg.length < 4) {
            return res.status(400).json({
              error: "Please specify what additional information or receipt clarification is required."
            });
          }

          payment.status = "Requires Additional Information";
          payment.requestedInfoMessage = msg;
          payment.verifiedAt = nowIso;
          payment.verifiedBy = verifier;
          payment.history.push({
            timestamp: nowIso,
            actor: verifier,
            status: "Requires Additional Information",
            note: msg
          });

          writeJsonFile(PAYMENTS_FILE, payments);

          addNotification({
            recipientType: "stall",
            recipientId: payment.stallName,
            title: "Additional Payment Information Requested",
            message: `Administrator requested clarification for payment Ref: ${payment.referenceNumber}: "${msg}". Open Subscription & Payment to resubmit details.`,
            type: "payment_info_requested",
            link: "subscription"
          });

          logAuditAction(
            "request_payment_info",
            verifier,
            payment.stallName,
            `Requested additional info on payment ${payment.id}: ${msg}`,
            { paymentId: payment.id },
            {
              targetType: "payment",
              previousStatus,
              newStatus: "Requires Additional Information",
              remarks: msg
            }
          );

          return res.json({
            success: true,
            message: "Request for additional information sent to stall owner.",
            payment: sanitizePaymentForClient(payment)
          });
        }

        // Reject
        const reason = String(rejectionReason || "").trim();
        if (!reason || reason.length < 4) {
          return res.status(400).json({
            error: "A clear rejection reason is required."
          });
        }

        payment.status = "Rejected";
        payment.rejectionReason = reason;
        payment.verifiedAt = nowIso;
        payment.verifiedBy = verifier;
        payment.history.push({
          timestamp: nowIso,
          actor: verifier,
          status: "Rejected",
          note: reason
        });

        const sub = subscriptions.find((s) => s.stallName === payment.stallName);
        if (sub && normalizeSubscriptionStatus(sub.status) === "PENDING") {
          sub.status = "EXPIRED";
          sub.updatedAt = nowIso;
          writeJsonFile(SUBSCRIPTIONS_FILE, subscriptions);
        }

        writeJsonFile(PAYMENTS_FILE, payments);

        addNotification({
          recipientType: "stall",
          recipientId: payment.stallName,
          title: "Payment Submission Rejected",
          message: `Your payment of ₱${payment.amount} (Ref: ${payment.referenceNumber}) was rejected: "${reason}". You can submit a corrected receipt from your Subscription page.`,
          type: "payment_rejected",
          link: "subscription"
        });

        logAuditAction(
          "reject_payment",
          verifier,
          payment.stallName,
          `Rejected payment ${payment.id} (Ref: ${payment.referenceNumber}). Reason: ${reason}`,
          { paymentId: payment.id, reason },
          {
            targetType: "payment",
            previousStatus,
            newStatus: "Rejected",
            remarks: reason
          }
        );

        return res.json({
          success: true,
          message: "Payment rejected and stall owner notified.",
          payment: sanitizePaymentForClient(payment)
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to process verification." });
      }
    }
  );

  // Admin: Manual Grant or Revoke Subscription Access
  app.post(
    "/api/admin/manual-access",
    requireRole("admin"),
    (req: AuthenticatedRequest, res) => {
      try {
        const { stallName, action, durationDays, reason } = req.body;
        if (!stallName || !action) {
          return res.status(400).json({ error: "Stall name and action are required." });
        }

        const verifier = req.user?.name || req.user?.username || "Administrator";
        const now = new Date();
        const nowIso = now.toISOString();
        let sub = subscriptions.find((s) => s.stallName === stallName);
        const previousStatus = sub ? sub.status : "NONE";

        if (action === "grant" || action === "renew") {
          const days = Math.max(1, Number(durationDays) || 7);
          const grantExp = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
          const stallRec = getStallByName(stallName);

          if (!sub) {
            sub = {
              id: `sub_${stallName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
              stallName,
              ownerId: stallRec?.ownerId || stallName,
              plan: days >= 28 ? "monthly" : "weekly",
              status: "ACTIVE",
              isTrial: false,
              startDate: nowIso,
              expirationDate: grantExp.toISOString(),
              nextDueDate: grantExp.toISOString(),
              billingCycle: "weekly",
              autoRenewReminder: true,
              isManuallyGranted: true,
              manualGrantReason: reason || "Administrative extension granted",
              manualGrantExpiresAt: grantExp.toISOString(),
              updatedAt: nowIso,
              createdAt: nowIso
            };
            subscriptions.push(sub);
          } else {
            sub.status = "ACTIVE";
            sub.isTrial = false;
            sub.expirationDate = grantExp.toISOString();
            sub.nextDueDate = grantExp.toISOString();
            sub.isManuallyGranted = true;
            sub.manualGrantReason = reason || "Administrative extension granted";
            sub.manualGrantExpiresAt = grantExp.toISOString();
            sub.updatedAt = nowIso;
          }

          writeJsonFile(SUBSCRIPTIONS_FILE, subscriptions);

          addNotification({
            recipientType: "stall",
            recipientId: stallName,
            title: "Subscription Access Granted by Administrator",
            message: `Administrator granted ${days} days of active subscription access until ${grantExp.toLocaleDateString()}.`,
            type: "access_granted",
            link: "portal"
          });

          logAuditAction(
            "grant_manual_access",
            verifier,
            stallName,
            `Granted ${days} days access until ${grantExp.toISOString()}`,
            { days, reason },
            {
              targetType: "stall",
              previousStatus: String(previousStatus),
              newStatus: "ACTIVE",
              remarks: reason || `${days} days administrative grant`
            }
          );

          return res.json({
            success: true,
            message: `Granted ${days} days of active subscription to ${stallName}.`,
            subscription: sub
          });
        }

        // Revoke subscription access (marks EXPIRED without deleting account or menus)
        if (sub) {
          sub.status = "EXPIRED";
          sub.isManuallyGranted = false;
          sub.expirationDate = nowIso;
          sub.updatedAt = nowIso;
          writeJsonFile(SUBSCRIPTIONS_FILE, subscriptions);
        }

        addNotification({
          recipientType: "stall",
          recipientId: stallName,
          title: "Subscription Access Revoked",
          message: `Your active subscription access was revoked by administrator. Reason: ${
            reason || "Administrative review"
          }. Your account and menus remain preserved.`,
          type: "access_revoked",
          link: "subscription"
        });

        logAuditAction(
          "revoke_manual_access",
          verifier,
          stallName,
          `Revoked subscription access. Reason: ${reason || "N/A"}`,
          { reason },
          {
            targetType: "stall",
            previousStatus: String(previousStatus),
            newStatus: "EXPIRED",
            remarks: reason
          }
        );

        return res.json({
          success: true,
          message: `Subscription revoked for ${stallName}.`,
          subscription: sub
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to update subscription access." });
      }
    }
  );

  // Admin: Update Centralized Platform Settings, Pricing, Payment & Free Trial Rules
  app.post("/api/admin/settings", requireRole("admin"), (req: AuthenticatedRequest, res) => {
    try {
      const {
        gcash,
        bank,
        qrCode,
        plans,
        freeTrialDays,
        trialEnabled,
        officialAppUrl,
        requireStallApproval,
        defaultStudentBudget,
        welcomeBannerMessage
      } = req.body;
      const actor = req.user?.name || req.user?.username || "Administrator";

      if (typeof freeTrialDays === "number" && freeTrialDays >= 1 && freeTrialDays <= 90) {
        adminSettings.freeTrialDays = Math.round(freeTrialDays);
      }
      if (typeof trialEnabled === "boolean") {
        adminSettings.trialEnabled = trialEnabled;
      }
      if (typeof officialAppUrl === "string") {
        const trimmedUrl = officialAppUrl.trim();
        if (trimmedUrl && /^https?:\/\/.+/i.test(trimmedUrl)) {
          adminSettings.officialAppUrl = trimmedUrl;
        }
      }
      if (typeof requireStallApproval === "boolean") {
        adminSettings.requireStallApproval = requireStallApproval;
      }
      if (typeof defaultStudentBudget === "number" && !Number.isNaN(defaultStudentBudget)) {
        adminSettings.defaultStudentBudget = Math.min(500, Math.max(10, Math.round(defaultStudentBudget)));
      }
      if (typeof welcomeBannerMessage === "string") {
        adminSettings.welcomeBannerMessage = welcomeBannerMessage.trim().slice(0, 280);
      }
      if (gcash) adminSettings.gcash = { ...adminSettings.gcash, ...gcash };
      if (bank) adminSettings.bank = { ...adminSettings.bank, ...bank };
      if (qrCode) adminSettings.qrCode = { ...adminSettings.qrCode, ...qrCode };
      if (plans) {
        adminSettings.plans = {
          weekly: { ...adminSettings.plans.weekly, ...(plans.weekly || {}) },
          monthly: { ...adminSettings.plans.monthly, ...(plans.monthly || {}) }
        };
      }

      adminSettings.updatedAt = new Date().toISOString();
      adminSettings.updatedBy = actor;
      writeJsonFile(SETTINGS_FILE, adminSettings);

      logAuditAction(
        "update_settings",
        actor,
        "System Settings",
        `Updated centralized platform settings (Trial: ${adminSettings.freeTrialDays}d, Approval: ${Boolean(adminSettings.requireStallApproval)}, Default Budget: ₱${adminSettings.defaultStudentBudget})`,
        undefined,
        { targetType: "settings", remarks: `Trial days: ${adminSettings.freeTrialDays}` }
      );

      res.json({
        success: true,
        message: "Centralized platform settings updated successfully.",
        settings: adminSettings
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update settings." });
    }
  });

  // Admin: Upload Official Payment QR Code
  app.post("/api/admin/qr-upload", requireRole("admin"), (req: AuthenticatedRequest, res) => {
    try {
      const { dataUrl } = req.body;
      if (!dataUrl || typeof dataUrl !== "string") {
        return res.status(400).json({ error: "QR code image data URL required." });
      }

      const matches = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp|svg\+xml);base64,(.+)$/i);
      if (!matches) {
        return res.status(400).json({ error: "Invalid image format for QR code." });
      }

      let ext = matches[1].toLowerCase();
      if (ext === "jpeg") ext = "jpg";
      if (ext.includes("svg")) ext = "svg";

      const buffer = Buffer.from(matches[2], "base64");
      const filename = `official_payment_qr_${Date.now()}.${ext}`;
      const filePath = resolveSafePath(PUBLIC_ADMIN_UPLOADS_DIR, filename);
      fs.writeFileSync(filePath, buffer);

      const persistentUrl = `/uploads/admin/${filename}`;
      const actor = req.user?.name || req.user?.username || "Administrator";
      adminSettings.qrCode.imageUrl = persistentUrl;
      adminSettings.updatedAt = new Date().toISOString();
      adminSettings.updatedBy = actor;
      writeJsonFile(SETTINGS_FILE, adminSettings);

      logAuditAction(
        "update_settings",
        actor,
        "QR Code",
        `Uploaded official payment QR image: ${filename}`,
        undefined,
        { targetType: "settings" }
      );

      res.json({
        success: true,
        imageUrl: persistentUrl,
        message: "Official payment QR code uploaded and activated."
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to upload QR code." });
    }
  });

  // Admin: Broadcast Announcement Notification
  app.post(
    "/api/admin/announcements",
    requireRole("admin"),
    (req: AuthenticatedRequest, res) => {
      try {
        const { title, message, audience } = req.body;
        if (!title || !message) {
          return res.status(400).json({ error: "Title and message are required." });
        }
        const recipientType: AppNotification["recipientType"] =
          audience === "customers" ? "customer" : audience === "stalls" ? "all" : "all";

        const notif = addNotification({
          recipientType,
          recipientId: audience === "customers" ? "customers" : "all",
          title: String(title).trim(),
          message: String(message).trim(),
          type: "announcement",
          link: "home"
        });

        logAuditAction(
          "update_settings",
          req.user?.username || "Administrator",
          "Campus Announcement",
          `Published announcement: "${String(title).trim()}"`,
          undefined,
          { targetType: "settings" }
        );

        res.json({ success: true, notification: notif });
      } catch (err: any) {
        res.status(500).json({ error: err.message || "Failed to broadcast announcement." });
      }
    }
  );

  // Admin: Audit Logs
  app.get("/api/admin/audit-logs", requireRole("admin"), (_req, res) => {
    res.json({ success: true, logs: auditLogs });
  });
}
