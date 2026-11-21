import crypto from "crypto";
import path from "path";
import type {
  FrequentStallStat,
  MostViewedItemStat,
  PlatformAnalyticsData,
  PlatformAnalyticsSeriesPoint,
  StallAnalyticsData,
  UserRole
} from "../types";
import { DATA_DIR, readJsonFile, writeJsonFile } from "./storage";
import { readUsers } from "./authService";
import { readStalls } from "./stallsService";
import {
  computeAwaitingPaymentCount,
  computeRenewalsCount,
  getAllPayments,
  getAllSubscriptions,
  getAllTrials,
  isStallSubscriptionActive
} from "./subscriptionService";

export interface AnalyticsEvent {
  id: string;
  type: "app_session" | "login" | "registration" | "stall_view" | "item_view";
  timestamp: string;
  visitorId?: string;
  portal?: "customer" | "merchant" | "admin";
  mode?: "online" | "offline";
  userId?: string;
  role?: UserRole;
  stallName?: string;
  dishId?: number;
  dishName?: string;
}

const ANALYTICS_FILE = path.join(DATA_DIR, "analytics_events.json");
const MAX_EVENTS = 25000;

function readEvents(): AnalyticsEvent[] {
  return readJsonFile<AnalyticsEvent[]>(ANALYTICS_FILE, []);
}

function appendEvent(
  evt: Omit<AnalyticsEvent, "id" | "timestamp">,
  timestampOverride?: string
) {
  const events = readEvents();
  let resolvedTs = new Date().toISOString();
  if (timestampOverride) {
    const parsed = new Date(timestampOverride);
    const now = Date.now();
    // Accept offline timestamps from up to 60 days ago (not future)
    if (!isNaN(parsed.getTime()) && parsed.getTime() <= now + 60_000 && now - parsed.getTime() <= 60 * 86400_000) {
      resolvedTs = parsed.toISOString();
    }
  }

  events.push({
    id: `evt_${crypto.randomBytes(6).toString("hex")}`,
    timestamp: resolvedTs,
    ...evt
  });
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
  writeJsonFile(ANALYTICS_FILE, events);
}

export function recordSessionVisit(
  visitorId: string,
  portal: "customer" | "merchant" | "admin" = "customer",
  mode: "online" | "offline" = "online",
  timestampOverride?: string
) {
  appendEvent(
    {
      type: "app_session",
      visitorId: visitorId || "anonymous",
      portal,
      mode: mode === "offline" ? "offline" : "online"
    },
    timestampOverride
  );
}

export function recordUserLoginEvent(userId: string, role: UserRole, stallName?: string) {
  appendEvent({
    type: "login",
    userId,
    role,
    stallName
  });
}

export function recordRegistrationEvent(userId: string, role: UserRole, stallName?: string) {
  appendEvent({
    type: "registration",
    userId,
    role,
    stallName
  });
}

export function recordStallViewEvent(stallName: string, visitorId: string, timestampOverride?: string) {
  appendEvent(
    {
      type: "stall_view",
      stallName,
      visitorId: visitorId || "anonymous"
    },
    timestampOverride
  );
}

export function recordItemViewEvent(
  stallName: string,
  dishId: number,
  dishName: string,
  visitorId: string,
  timestampOverride?: string
) {
  appendEvent(
    {
      type: "item_view",
      stallName,
      dishId,
      dishName,
      visitorId: visitorId || "anonymous"
    },
    timestampOverride
  );
}

function formatTimeAgo(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / (60 * 1000));
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

export function getStallAnalytics(stallName: string, period: string = "7days"): StallAnalyticsData {
  const events = readEvents();
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();
  const oneWeekAgoMs = now - 7 * 24 * 60 * 60 * 1000;
  const oneMonthAgoMs = now - 30 * 24 * 60 * 60 * 1000;

  const stallViews = events.filter((e) => e.type === "stall_view" && e.stallName === stallName);
  const itemViews = events.filter((e) => e.type === "item_view" && e.stallName === stallName);

  const todayViews = stallViews.filter((v) => new Date(v.timestamp).getTime() >= todayMs).length;
  const uniqueVisitorsToday = new Set(
    stallViews.filter((v) => new Date(v.timestamp).getTime() >= todayMs).map((v) => v.visitorId)
  ).size;
  const thisWeekViews = stallViews.filter((v) => new Date(v.timestamp).getTime() >= oneWeekAgoMs).length;
  const thisMonthViews = stallViews.filter((v) => new Date(v.timestamp).getTime() >= oneMonthAgoMs).length;
  const totalViews = stallViews.length;

  const daysCount = period === "30days" ? 30 : period === "today" ? 1 : 7;
  const viewsByDay = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const dayStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayStart = new Date(dayStr + "T00:00:00").getTime();
    const dayEnd = new Date(dayStr + "T23:59:59.999").getTime();

    const dayViews = stallViews.filter((v) => {
      const ts = new Date(v.timestamp).getTime();
      return ts >= dayStart && ts <= dayEnd;
    });

    viewsByDay.push({
      date: dayStr,
      label: daysCount === 1 ? "Today" : label,
      views: dayViews.length,
      uniqueVisitors: new Set(dayViews.map((v) => v.visitorId)).size
    });
  }

  const itemCountMap = new Map<number, { dishName: string; views: number }>();
  for (const iv of itemViews) {
    if (!iv.dishId) continue;
    const prev = itemCountMap.get(iv.dishId);
    if (prev) prev.views++;
    else itemCountMap.set(iv.dishId, { dishName: iv.dishName || `Dish #${iv.dishId}`, views: 1 });
  }

  const popularItems = Array.from(itemCountMap.entries())
    .map(([dishId, info]) => ({ dishId, dishName: info.dishName, views: info.views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const recentActivity = [
    ...stallViews.slice(-15).map((v) => ({
      id: v.id,
      type: "stall_view" as const,
      description: "Student visited your stall menu",
      timestamp: v.timestamp,
      timeAgo: formatTimeAgo(v.timestamp)
    })),
    ...itemViews.slice(-15).map((iv) => ({
      id: iv.id,
      type: "item_view" as const,
      description: `Student viewed "${iv.dishName}"`,
      timestamp: iv.timestamp,
      timeAgo: formatTimeAgo(iv.timestamp)
    }))
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 12);

  return {
    stallName,
    todayViews,
    uniqueVisitorsToday,
    thisWeekViews,
    thisMonthViews,
    totalViews,
    menuItemViewsCount: itemViews.length,
    mostViewedItem: popularItems.length > 0 ? popularItems[0].dishName : null,
    viewsByDay,
    popularItems,
    recentActivity
  };
}

export function getPlatformAnalytics(
  range: "today" | "7days" | "30days" | "custom" | "all" = "7days",
  customStart?: string,
  customEnd?: string
): PlatformAnalyticsData {
  const users = readUsers();
  const stalls = readStalls();
  const subs = getAllSubscriptions();
  const trials = getAllTrials();
  const payments = getAllPayments();
  const events = readEvents();

  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayStartMs = startOfToday.getTime();
  const weekStartMs = now - 7 * 24 * 60 * 60 * 1000;
  const monthStartMs = now - 30 * 24 * 60 * 60 * 1000;

  let rangeStartMs = 0;
  let rangeEndMs = now;
  let resolvedRange = range;

  if (range === "today") {
    rangeStartMs = todayStartMs;
  } else if (range === "7days") {
    rangeStartMs = weekStartMs;
  } else if (range === "30days") {
    rangeStartMs = monthStartMs;
  } else if (range === "custom" && customStart && customEnd) {
    const s = new Date(customStart + "T00:00:00").getTime();
    const e = new Date(customEnd + "T23:59:59.999").getTime();
    if (!isNaN(s) && !isNaN(e) && s <= e) {
      rangeStartMs = s;
      rangeEndMs = e;
    } else {
      resolvedRange = "7days";
      rangeStartMs = weekStartMs;
    }
  } else if (range === "custom") {
    resolvedRange = "7days";
    rangeStartMs = weekStartMs;
  }

  const inRange = (iso?: string) => {
    if (!iso) return false;
    const ts = new Date(iso).getTime();
    return !isNaN(ts) && ts >= rangeStartMs && ts <= rangeEndMs;
  };

  const filteredEvents = events.filter((e) => inRange(e.timestamp));
  const sessionEvents = filteredEvents.filter((e) => e.type === "app_session");
  const allSessions = events.filter((e) => e.type === "app_session");
  const loginEvents = filteredEvents.filter((e) => e.type === "login");

  const dailyOpens = allSessions.filter((e) => new Date(e.timestamp).getTime() >= todayStartMs).length;
  const weeklyOpens = allSessions.filter((e) => new Date(e.timestamp).getTime() >= weekStartMs).length;
  const monthlyOpens = allSessions.filter((e) => new Date(e.timestamp).getTime() >= monthStartMs).length;

  const onlineSessions = sessionEvents.filter((s) => s.mode !== "offline").length;
  const offlineSessions = sessionEvents.filter((s) => s.mode === "offline").length;

  // Frequently visited stalls
  const stallViewMap = new Map<string, { views: number; visitors: Set<string> }>();
  for (const evt of filteredEvents) {
    if (evt.type === "stall_view" && evt.stallName) {
      const entry = stallViewMap.get(evt.stallName) || { views: 0, visitors: new Set<string>() };
      entry.views++;
      if (evt.visitorId) entry.visitors.add(evt.visitorId);
      stallViewMap.set(evt.stallName, entry);
    }
  }
  const frequentStalls: FrequentStallStat[] = Array.from(stallViewMap.entries())
    .map(([stallName, data]) => ({
      stallName,
      views: data.views,
      uniqueVisitors: data.visitors.size
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  // Most viewed food items
  const itemViewMap = new Map<number, { dishName: string; stallName: string; views: number }>();
  for (const evt of filteredEvents) {
    if (evt.type === "item_view" && evt.dishId) {
      const entry = itemViewMap.get(evt.dishId) || {
        dishName: evt.dishName || `Dish #${evt.dishId}`,
        stallName: evt.stallName || "Cafeteria Stall",
        views: 0
      };
      entry.views++;
      itemViewMap.set(evt.dishId, entry);
    }
  }
  const mostViewedItems: MostViewedItemStat[] = Array.from(itemViewMap.entries())
    .map(([dishId, data]) => ({
      dishId,
      dishName: data.dishName,
      stallName: data.stallName,
      views: data.views
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const activeTrialsCount = trials.filter(
    (t) => t.trialStatus === "Trial Active" && t.endDate && new Date(t.endDate).getTime() > now
  ).length;

  const activePaidSubsCount = subs.filter((s) => {
    const isStallSuspended = stalls.some((st) => st.name === s.stallName && st.status === "suspended");
    if (isStallSuspended) return false;
    return !s.isTrial && isStallSubscriptionActive(s.stallName).active;
  }).length;

  const expiredSubsCount = stalls.filter((st) => !isStallSubscriptionActive(st.name).active).length;

  const rangePayments = resolvedRange === "all" ? payments : payments.filter((p) => inRange(p.submittedAt));
  const pendingPayments = rangePayments.filter((p) => p.status === "Pending Verification").length;
  const approvedPaymentsList = rangePayments.filter((p) => p.status === "Approved");
  const approvedPayments = approvedPaymentsList.length;
  const rejectedPayments = rangePayments.filter((p) => p.status === "Rejected").length;
  const requiresInfoPayments = rangePayments.filter(
    (p) => p.status === "Requires Additional Information"
  ).length;
  const verifiedRevenue = approvedPaymentsList.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );

  const newUsersInRange =
    resolvedRange === "all" ? users.length : users.filter((u) => inRange(u.createdAt)).length;
  const newStallsInRange =
    resolvedRange === "all" ? stalls.length : stalls.filter((s) => inRange(s.createdAt)).length;

  // Build daily activity series aligned to selected window
  const series: PlatformAnalyticsSeriesPoint[] = [];
  if (resolvedRange === "custom" && customStart && customEnd) {
    const startDt = new Date(customStart + "T00:00:00");
    const endDt = new Date(customEnd + "T00:00:00");
    const diffDays = Math.min(31, Math.max(1, Math.round((endDt.getTime() - startDt.getTime()) / 86400_000) + 1));
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(startDt.getTime() + i * 86400_000);
      const dayStr = d.toISOString().split("T")[0];
      const dayStart = new Date(dayStr + "T00:00:00").getTime();
      const dayEnd = new Date(dayStr + "T23:59:59.999").getTime();

      const daySessions = events.filter(
        (e) => e.type === "app_session" && new Date(e.timestamp).getTime() >= dayStart && new Date(e.timestamp).getTime() <= dayEnd
      );
      const dayLogins = events.filter(
        (e) => e.type === "login" && new Date(e.timestamp).getTime() >= dayStart && new Date(e.timestamp).getTime() <= dayEnd
      );
      const dayRegs = users.filter((u) => {
        const ts = new Date(u.createdAt).getTime();
        return ts >= dayStart && ts <= dayEnd;
      });
      const dayApproved = payments.filter((p) => {
        if (p.status !== "Approved" || !p.verifiedAt) return false;
        const ts = new Date(p.verifiedAt).getTime();
        return ts >= dayStart && ts <= dayEnd;
      });

      series.push({
        date: dayStr,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        sessions: daySessions.length,
        onlineSessions: daySessions.filter((s) => s.mode !== "offline").length,
        offlineSessions: daySessions.filter((s) => s.mode === "offline").length,
        uniqueVisitors: new Set(daySessions.map((s) => s.visitorId)).size,
        logins: dayLogins.length,
        registrations: dayRegs.length,
        approvedPayments: dayApproved.length
      });
    }
  } else {
    const seriesDays = resolvedRange === "today" ? 1 : resolvedRange === "30days" ? 30 : resolvedRange === "all" ? 14 : 7;
    for (let i = seriesDays - 1; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().split("T")[0];
      const label = seriesDays === 1 ? "Today" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayStart = new Date(dayStr + "T00:00:00").getTime();
      const dayEnd = new Date(dayStr + "T23:59:59.999").getTime();

      const daySessions = events.filter(
        (e) => e.type === "app_session" && new Date(e.timestamp).getTime() >= dayStart && new Date(e.timestamp).getTime() <= dayEnd
      );
      const dayLogins = events.filter(
        (e) => e.type === "login" && new Date(e.timestamp).getTime() >= dayStart && new Date(e.timestamp).getTime() <= dayEnd
      );
      const dayRegs = users.filter((u) => {
        const ts = new Date(u.createdAt).getTime();
        return ts >= dayStart && ts <= dayEnd;
      });
      const dayApproved = payments.filter((p) => {
        if (p.status !== "Approved" || !p.verifiedAt) return false;
        const ts = new Date(p.verifiedAt).getTime();
        return ts >= dayStart && ts <= dayEnd;
      });

      series.push({
        date: dayStr,
        label,
        sessions: daySessions.length,
        onlineSessions: daySessions.filter((s) => s.mode !== "offline").length,
        offlineSessions: daySessions.filter((s) => s.mode === "offline").length,
        uniqueVisitors: new Set(daySessions.map((s) => s.visitorId)).size,
        logins: dayLogins.length,
        registrations: dayRegs.length,
        approvedPayments: dayApproved.length
      });
    }
  }

  return {
    range: resolvedRange,
    startDate: customStart,
    endDate: customEnd,
    totals: {
      registeredUsers: users.length,
      customerUsers: users.filter((u) => u.role === "customer").length,
      stallOwners: users.filter((u) => u.role === "merchant").length,
      adminUsers: users.filter((u) => u.role === "admin").length,
      registeredStalls: stalls.length,
      activeStalls: stalls.filter((s) => s.status === "active" && s.registrationStatus === "approved").length,
      inactiveStalls: stalls.filter((s) => s.status === "inactive").length,
      suspendedStalls: stalls.filter((s) => s.status === "suspended").length,
      pendingStallApprovals: stalls.filter((s) => s.registrationStatus === "pending").length,
      activeSubscriptions: activePaidSubsCount,
      activeTrials: activeTrialsCount,
      expiredSubscriptions: expiredSubsCount,
      subscriptionsAwaitingPayment: computeAwaitingPaymentCount(),
      subscriptionRenewals: computeRenewalsCount(
        resolvedRange === "all" ? 0 : rangeStartMs,
        resolvedRange === "all" ? Infinity : rangeEndMs
      ),
      pendingPayments,
      approvedPayments,
      rejectedPayments,
      requiresInfoPayments,
      verifiedRevenue,
      appSessions: sessionEvents.length,
      dailyOpens,
      weeklyOpens,
      monthlyOpens,
      onlineSessions,
      offlineSessions,
      uniqueVisitors: new Set(sessionEvents.map((s) => s.visitorId)).size,
      totalLogins: loginEvents.length,
      newUsersInRange,
      newStallsInRange,
      customerPortalVisits: sessionEvents.filter((s) => s.portal === "customer").length,
      merchantPortalVisits: sessionEvents.filter((s) => s.portal === "merchant").length
    },
    frequentStalls,
    mostViewedItems,
    series
  };
}
