import {
  DishItem,
  StallCredential,
  AppNotification,
  AdminPaymentSettings
} from '../types';

export interface OfflineMenuSnapshot {
  items: DishItem[];
  stalls: StallCredential[];
  notices: Record<string, string>;
  announcements: AppNotification[];
  platformSettings?: Partial<AdminPaymentSettings>;
  lastSyncedAt: string;
}

export interface OfflineAnalyticsEvent {
  id: string;
  type: 'app_session' | 'stall_view' | 'item_view';
  visitorId: string;
  portal?: 'customer' | 'merchant' | 'admin';
  stallName?: string;
  dishId?: number;
  dishName?: string;
  timestamp: string;
}

const DB_NAME = 'our_sudan_offline_db';
const DB_VERSION = 1;
const STORE_KV = 'kv_store';
const STORE_EVENTS = 'offline_events';

const KEY_SNAPSHOT = 'menu_snapshot_v1';
const KEY_BUDGET = 'student_budget_v1';

const LS_SNAPSHOT_KEY = 'unsay_sudan_offline_snapshot';
const LS_BUDGET_KEY = 'unsay_sudan_budget_pref';
const LS_EVENTS_KEY = 'unsay_sudan_offline_events';

function openOfflineDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_KV)) {
          db.createObjectStore(STORE_KV, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORE_EVENTS)) {
          db.createObjectStore(STORE_EVENTS, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openOfflineDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_KV, 'readonly');
      const store = tx.objectStore(STORE_KV);
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result ? (req.result.value as T) : null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openOfflineDB();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_KV, 'readwrite');
      const store = tx.objectStore(STORE_KV);
      store.put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function saveOfflineSnapshot(snapshot: OfflineMenuSnapshot): Promise<void> {
  try {
    localStorage.setItem(LS_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore storage quota limits on localStorage; IndexedDB below holds larger payloads
  }
  await idbSet(KEY_SNAPSHOT, snapshot);
}

export async function loadOfflineSnapshot(): Promise<OfflineMenuSnapshot | null> {
  const idbData = await idbGet<OfflineMenuSnapshot>(KEY_SNAPSHOT);
  if (idbData && Array.isArray(idbData.items)) {
    return idbData;
  }
  try {
    const raw = localStorage.getItem(LS_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OfflineMenuSnapshot;
    return parsed && Array.isArray(parsed.items) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveBudgetPref(budget: number): Promise<void> {
  const clean = Math.min(500, Math.max(1, Math.round(budget)));
  const payload = { budget: clean, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(LS_BUDGET_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
  await idbSet(KEY_BUDGET, payload);
}

export async function loadBudgetPref(): Promise<number | null> {
  const idbData = await idbGet<{ budget: number; updatedAt: string }>(KEY_BUDGET);
  if (idbData && typeof idbData.budget === 'number' && idbData.budget >= 1 && idbData.budget <= 500) {
    return idbData.budget;
  }
  try {
    const raw = localStorage.getItem(LS_BUDGET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { budget: number };
    if (typeof parsed.budget === 'number' && parsed.budget >= 1 && parsed.budget <= 500) {
      return parsed.budget;
    }
    return null;
  } catch {
    return null;
  }
}

export async function queueOfflineEvent(
  event: Omit<OfflineAnalyticsEvent, 'id' | 'timestamp'> & { timestamp?: string }
): Promise<void> {
  const entry: OfflineAnalyticsEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: event.type,
    visitorId: event.visitorId,
    portal: event.portal,
    stallName: event.stallName,
    dishId: event.dishId,
    dishName: event.dishName,
    timestamp: event.timestamp || new Date().toISOString()
  };

  try {
    const raw = localStorage.getItem(LS_EVENTS_KEY);
    const list: OfflineAnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    list.push(entry);
    localStorage.setItem(LS_EVENTS_KEY, JSON.stringify(list.slice(-150)));
  } catch {
    // ignore
  }

  const db = await openOfflineDB();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_EVENTS, 'readwrite');
      tx.objectStore(STORE_EVENTS).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function popOfflineEvents(): Promise<OfflineAnalyticsEvent[]> {
  let events: OfflineAnalyticsEvent[] = [];

  const db = await openOfflineDB();
  if (db) {
    events = await new Promise<OfflineAnalyticsEvent[]>((resolve) => {
      try {
        const tx = db.transaction(STORE_EVENTS, 'readwrite');
        const store = tx.objectStore(STORE_EVENTS);
        const req = store.getAll();
        req.onsuccess = () => {
          const rows = (req.result || []) as OfflineAnalyticsEvent[];
          store.clear();
          resolve(rows);
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  if (events.length === 0) {
    try {
      const raw = localStorage.getItem(LS_EVENTS_KEY);
      if (raw) {
        events = JSON.parse(raw) as OfflineAnalyticsEvent[];
      }
    } catch {
      // ignore
    }
  }

  try {
    localStorage.removeItem(LS_EVENTS_KEY);
  } catch {
    // ignore
  }

  return events;
}

export async function warmOfflineMediaCache(urls: (string | undefined | null)[]): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window) || !navigator.onLine) {
    return;
  }

  const uniqueUrls = Array.from(
    new Set(
      urls
        .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
        .filter((u) => u.startsWith('/') || u.startsWith(window.location.origin))
    )
  ).slice(0, 120);

  if (uniqueUrls.length === 0) return;

  try {
    const cache = await window.caches.open('app-media-cache');
    await Promise.allSettled(
      uniqueUrls.map(async (url) => {
        const existing = await cache.match(url);
        if (!existing) {
          const response = await fetch(url, { credentials: 'same-origin' });
          if (response.ok) {
            await cache.put(url, response.clone());
          }
        }
      })
    );
  } catch {
    // non-fatal media pre-warming failure
  }
}

export function formatSyncTimestamp(iso?: string | null): string {
  if (!iso) return 'Not yet synced';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Not yet synced';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
