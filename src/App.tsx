import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Language,
  ZoneFilter,
  CategoryFilter,
  SortOption,
  DishItem,
  TrayItem,
  StallCredential,
  AppPage,
  AppNotification,
  AuthUser,
  AdminPaymentSettings
} from './types';
import { translations } from './data/initialData';
import {
  fetchMenuData,
  checkMenuVersionAPI,
  toggleItemStockAPI,
  updateItemPriceAPI,
  saveStallNoticeAPI,
  recordItemClickAPI,
  recordStallViewAPI,
  recordItemViewAPI,
  recordSessionVisitAPI,
  flushOfflineAnalyticsAPI,
  syncRestoredPhotosAPI,
  deleteMenuItemSafelyAPI,
  restoreArchivedDishAPI,
  fetchNotificationsAPI,
  markNotificationsReadAPI,
  fetchSubscriptionSettingsAPI
} from './services/api';
import { getAnonymousVisitorId } from './utils/visitorId';
import { getDishDisplayImage } from './utils/imageHelper';
import {
  subscribeAuth,
  getAuthUser,
  getAuthOwner,
  clearAuthSession
} from './utils/authStore';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  saveOfflineSnapshot,
  loadOfflineSnapshot,
  saveBudgetPref,
  loadBudgetPref,
  queueOfflineEvent,
  popOfflineEvents,
  warmOfflineMediaCache
} from './utils/offlineStore';

// ============================================================================
// Stall Owner Image Preservation Vault (Multi-layer Safety & Self-Healing)
// ============================================================================
const OWNER_IMAGE_VAULT_KEY = 'unsay_sudan_owner_image_vault';

interface VaultEntry {
  id: number;
  stall: string;
  name: string;
  imageUrl: string;
  updatedAt: number;
}

export function getOwnerImageVault(): Record<string, VaultEntry> {
  try {
    const raw = localStorage.getItem(OWNER_IMAGE_VAULT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveToOwnerImageVault(id: number, stall: string, name: string, imageUrl: string) {
  if (!imageUrl) return;
  if (imageUrl.includes('representative')) return;
  try {
    const vault = getOwnerImageVault();
    const entry: VaultEntry = { id, stall, name, imageUrl, updatedAt: Date.now() };
    vault[`id_${id}`] = entry;
    vault[`stall_name_${stall}_${name.toLowerCase()}`] = entry;
    localStorage.setItem(OWNER_IMAGE_VAULT_KEY, JSON.stringify(vault));
  } catch (err) {
    console.warn('Could not save to image vault:', err);
  }
}

export function removeFromOwnerImageVault(id: number, stall: string, name: string) {
  try {
    const vault = getOwnerImageVault();
    delete vault[`id_${id}`];
    delete vault[`stall_name_${stall}_${name.toLowerCase()}`];
    localStorage.setItem(OWNER_IMAGE_VAULT_KEY, JSON.stringify(vault));
  } catch {
    // ignore storage quota errors
  }
}

// Components
import { Header } from './components/Header';
import { BudgetSummaryBar } from './components/BudgetSummaryBar';
import { BottomNavBar } from './components/BottomNavBar';
import { MealDetailModal } from './components/MealDetailModal';
import { RouletteModal } from './components/RouletteModal';
import { MerchantAuthModal } from './components/MerchantAuthModal';
import { OnboardingModal } from './components/OnboardingModal';
import { CampusQRModal } from './components/CampusQRModal';
import { Toast } from './components/Toast';
import { SubscriptionPaywall } from './components/SubscriptionPaywall';
import { AdminSubscriptionDashboard } from './components/AdminSubscriptionDashboard';
import { NotificationPanel } from './components/NotificationPanel';
import { OfflineIndicator } from './components/OfflineIndicator';

// Pages
import { HomePage } from './components/pages/HomePage';
import { ExplorePage } from './components/pages/ExplorePage';
import { StallsPage } from './components/pages/StallsPage';
import { TrayPage } from './components/pages/TrayPage';
import { OrdersPage } from './components/pages/OrdersPage';
import { HelpPage } from './components/pages/HelpPage';
import { StallPortalPage } from './components/pages/StallPortalPage';
import { FloatingFoodBackground } from './components/FoodDoodles';

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const [currentLang, setCurrentLang] = useState<Language>('bisaya');
  const t = translations[currentLang];

  const isOnline = useOnlineStatus();

  // Core Budget State (persisted offline in IndexedDB / localStorage)
  const [userBudget, setUserBudget] = useState<number>(55);
  const hasExplicitBudgetRef = useRef(false);

  // Filters State for Explore page
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentZone, setCurrentZone] = useState<ZoneFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [currentSort, setCurrentSort] = useState<SortOption>('best-value');
  const [selectedStall, setSelectedStall] = useState<string | null>(null);
  const [withinBudgetOnly, setWithinBudgetOnly] = useState(true);
  const [availableOnly, setAvailableOnly] = useState(false);

  // Real Database-Backed & Offline-Cached Menu & Stalls State
  const [menuItems, setMenuItems] = useState<DishItem[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(true);
  const [isSyncingMenu, setIsSyncingMenu] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [stallNotices, setStallNotices] = useState<Record<string, string>>({});
  const [stallsList, setStallsList] = useState<StallCredential[]>([]);
  const [platformSettings, setPlatformSettings] = useState<Partial<AdminPaymentSettings> | null>(null);

  // User Tray State (persist in localStorage)
  const [myTray, setMyTray] = useState<TrayItem[]>(() => {
    try {
      const saved = localStorage.getItem('unsay_sudan_tray');
      if (!saved) return [];
      const parsed: TrayItem[] = JSON.parse(saved);
      return Array.isArray(parsed)
        ? parsed.map((item) => ({ ...item, quantity: item.quantity || 1 }))
        : [];
    } catch {
      return [];
    }
  });

  // Student Favorites (persist in localStorage)
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('unsay_sudan_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal visibility
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [activeDetailDish, setActiveDetailDish] = useState<DishItem | null>(null);
  const [isMerchantAuthOpen, setIsMerchantAuthOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCampusQROpen, setIsCampusQROpen] = useState(false);

  // In-Memory Auth Session State (Stall Owner & Centralized Super Admin only)
  const [authenticatedStall, setAuthenticatedStall] = useState<string | null>(
    () => getAuthOwner()?.stallName || null
  );
  const [adminUser, setAdminUser] = useState<AuthUser | null>(() => {
    const u = getAuthUser();
    return u?.role === 'admin' ? u : null;
  });

  useEffect(() => {
    return subscribeAuth(() => {
      const user = getAuthUser();
      const owner = getAuthOwner();
      setAdminUser(user?.role === 'admin' ? user : null);
      setAuthenticatedStall(owner?.stallName || (user?.role === 'merchant' ? user.stallName || null : null));
    });
  }, []);

  // Clean up any stale legacy session keys
  useEffect(() => {
    try {
      localStorage.removeItem('unsay_sudan_admin_session');
      localStorage.removeItem('unsay_sudan_owner_account');
    } catch {
      // ignore
    }
  }, []);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Hydrate Saved Budget & Offline IndexedDB Snapshot immediately on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [savedBudget, snapshot] = await Promise.all([
        loadBudgetPref(),
        loadOfflineSnapshot()
      ]);
      if (!mounted) return;
      if (savedBudget !== null) {
        hasExplicitBudgetRef.current = true;
        setUserBudget(savedBudget);
      }
      if (snapshot) {
        setMenuItems((prev) => (prev.length === 0 ? snapshot.items : prev));
        setStallsList((prev) => (prev.length === 0 ? snapshot.stalls : prev));
        setStallNotices((prev) =>
          Object.keys(prev).length === 0 ? snapshot.notices || {} : prev
        );
        if (snapshot.announcements?.length) {
          setNotifications((prev) => (prev.length === 0 ? snapshot.announcements : prev));
        }
        if (snapshot.platformSettings) {
          setPlatformSettings((prev) => prev || snapshot.platformSettings || null);
          if (
            savedBudget === null &&
            !hasExplicitBudgetRef.current &&
            snapshot.platformSettings.defaultStudentBudget
          ) {
            setUserBudget(
              Math.min(500, Math.max(1, snapshot.platformSettings.defaultStudentBudget))
            );
          }
        }
        if (snapshot.lastSyncedAt) {
          setLastSyncedAt((prev) => prev || snapshot.lastSyncedAt);
        }
        setIsLoadingMenu(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadNotifs = async () => {
      if (!navigator.onLine) return;
      const res = await fetchNotificationsAPI();
      if (isMounted && res.success && res.notifications) {
        setNotifications(res.notifications);
      }
    };

    loadNotifs();
    const interval = setInterval(loadNotifs, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [adminUser, authenticatedStall, isOnline]);

  // Record anonymous campus session visit (online directly, offline queued to IndexedDB)
  const recordedPortalsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const portal: 'customer' | 'merchant' | 'admin' =
      currentPage === 'admin'
        ? 'admin'
        : currentPage === 'portal' || currentPage === 'subscription'
        ? 'merchant'
        : 'customer';
    if (!recordedPortalsRef.current.has(portal)) {
      recordedPortalsRef.current.add(portal);
      const visitorId = getAnonymousVisitorId();
      if (navigator.onLine) {
        recordSessionVisitAPI(visitorId, portal, 'online');
      } else {
        queueOfflineEvent({ type: 'app_session', visitorId, portal });
      }
    }
  }, [currentPage]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncMenuRef = useRef<((force?: boolean) => void) | null>(null);

  const activeFetchRole: 'customer' | 'merchant' | 'admin' = useMemo(() => {
    if (currentPage === 'admin' && adminUser) return 'admin';
    if ((currentPage === 'portal' || currentPage === 'subscription') && authenticatedStall) {
      return 'merchant';
    }
    return 'customer';
  }, [currentPage, adminUser, authenticatedStall]);

  // Listen for SW offline-ready & update events
  useEffect(() => {
    const onOfflineReady = () => {
      setToastMessage('App cached! Menus and budgeting now work offline.');
      setTimeout(() => setToastMessage(null), 3000);
    };
    const onNeedRefresh = () => {
      syncMenuRef.current?.(true);
    };
    window.addEventListener('pwa:offline-ready', onOfflineReady);
    window.addEventListener('pwa:need-refresh', onNeedRefresh);
    return () => {
      window.removeEventListener('pwa:offline-ready', onOfflineReady);
      window.removeEventListener('pwa:need-refresh', onNeedRefresh);
    };
  }, []);

  // Flush queued offline analytics & re-sync when coming back online
  useEffect(() => {
    if (!isOnline) return;
    let active = true;
    (async () => {
      const queued = await popOfflineEvents();
      if (active && queued.length > 0) {
        await flushOfflineAnalyticsAPI(queued);
      }
      if (active) {
        syncMenuRef.current?.(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOnline]);

  // Live Synchronization with Server Database + Persistent Offline Snapshot
  useEffect(() => {
    let isMounted = true;
    let lastKnownVersion: number | null = null;

    async function syncMenu(force = false) {
      if (!navigator.onLine) {
        if (isMounted) {
          setIsLoadingMenu(false);
          setIsSyncingMenu(false);
        }
        return;
      }

      try {
        if (force) setIsSyncingMenu(true);

        if (!force && lastKnownVersion !== null) {
          const remoteVersion = await checkMenuVersionAPI();
          if (remoteVersion !== null && remoteVersion === lastKnownVersion) {
            if (isMounted) setIsSyncingMenu(false);
            return;
          }
        }

        const [data, settingsRes] = await Promise.all([
          fetchMenuData(
            activeFetchRole,
            activeFetchRole === 'merchant' && authenticatedStall ? authenticatedStall : undefined
          ),
          fetchSubscriptionSettingsAPI()
        ]);
        if (!isMounted) return;

        // Guard: never overwrite cached offline menus if response failed offline
        if (data.version === undefined && data.items.length === 0 && data.stalls.length === 0) {
          setIsLoadingMenu(false);
          setIsSyncingMenu(false);
          return;
        }

        if (data.version) {
          lastKnownVersion = data.version;
        }

        let latestSettings = platformSettings;
        if (settingsRes.success && settingsRes.settings) {
          latestSettings = settingsRes.settings;
          setPlatformSettings(settingsRes.settings);
          if (!hasExplicitBudgetRef.current && settingsRes.settings.defaultStudentBudget) {
            const adminDefault = Math.min(
              500,
              Math.max(1, settingsRes.settings.defaultStudentBudget)
            );
            setUserBudget(adminDefault);
          }
        }

        const vault = getOwnerImageVault();
        const restoredForBackend: { id: number; stall: string; imageUrl: string }[] = [];
        let computedMergedItems: DishItem[] = [];

        setMenuItems((prevItems) => {
          const serverList = data.items || [];
          computedMergedItems = serverList.map((serverItem) => {
            const prev = prevItems.find((p) => p.id === serverItem.id);
            const vaultEntry =
              vault[`id_${serverItem.id}`] ||
              vault[`stall_name_${serverItem.stall}_${serverItem.name.toLowerCase()}`];

            let ownerImg = serverItem.ownerUploadedImage;
            const repImg =
              serverItem.representativeImage || (prev ? prev.representativeImage : undefined);

            if (!ownerImg) {
              if (prev && prev.ownerUploadedImage) {
                ownerImg = prev.ownerUploadedImage;
              } else if (vaultEntry && vaultEntry.imageUrl) {
                ownerImg = vaultEntry.imageUrl;
              } else if (prev && prev.imageUrl && !prev.imageUrl.includes('representative')) {
                ownerImg = prev.imageUrl;
              }

              if (ownerImg) {
                restoredForBackend.push({
                  id: serverItem.id,
                  stall: serverItem.stall,
                  imageUrl: ownerImg
                });
              }
            } else {
              saveToOwnerImageVault(serverItem.id, serverItem.stall, serverItem.name, ownerImg);
            }

            const finalImageUrl = ownerImg || repImg || serverItem.imageUrl;

            return {
              ...serverItem,
              ownerUploadedImage: ownerImg,
              representativeImage: repImg,
              imageUrl: finalImageUrl,
              hidden:
                serverItem.hidden !== undefined
                  ? serverItem.hidden
                  : prev
                  ? prev.hidden
                  : false
            };
          });
          return computedMergedItems;
        });

        // Keep tray items synced if dish prices changed on backend
        setMyTray((prevTray) =>
          prevTray.map((tItem) => {
            const latestDish = (data.items || []).find((m) => m.id === tItem.dishId);
            if (!latestDish || tItem.selectedVariant) return tItem;
            const addonsSum = (tItem.customAddons || []).reduce((s, a) => s + a.price, 0);
            if (latestDish.price === tItem.basePrice) return tItem;
            return {
              ...tItem,
              basePrice: latestDish.price,
              totalWithAddons: latestDish.price + addonsSum
            };
          })
        );

        if (restoredForBackend.length > 0 && activeFetchRole === 'merchant') {
          syncRestoredPhotosAPI(restoredForBackend);
        }

        const mappedStalls: StallCredential[] = (data.stalls || []).map((s) => ({
          name: s.name,
          zone: s.zone,
          stallNo: s.stallNo,
          officialName: s.officialName,
          description: s.description,
          contactInfo: s.contactInfo
        }));
        if (data.stalls) {
          setStallsList(mappedStalls);
        }

        const nextNotices = data.notices || {};
        if (data.notices) {
          setStallNotices(nextNotices);
        }

        const syncTimestamp = new Date().toISOString();
        setLastSyncedAt(syncTimestamp);

        if (activeFetchRole === 'customer') {
          await saveOfflineSnapshot({
            items: computedMergedItems,
            stalls: mappedStalls,
            notices: nextNotices,
            announcements: notifications.filter((n) => n.type === 'announcement'),
            platformSettings: latestSettings || undefined,
            lastSyncedAt: syncTimestamp
          });

          // Pre-warm Cache API with dish images & QR image so they display cleanly offline
          warmOfflineMediaCache([
            ...computedMergedItems.map((d) => d.ownerUploadedImage || d.imageUrl),
            latestSettings?.qrCode?.imageUrl
          ]);
        }
      } catch (err) {
        console.warn('Background menu sync error:', err);
      } finally {
        if (isMounted) {
          setIsLoadingMenu(false);
          setIsSyncingMenu(false);
        }
      }
    }

    syncMenuRef.current = syncMenu;
    syncMenu(true);

    const interval = setInterval(() => {
      syncMenu(false);
    }, 5000);

    const onFocus = () => syncMenu(false);
    window.addEventListener('focus', onFocus);

    return () => {
      syncMenuRef.current = null;
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [activeFetchRole, authenticatedStall]);

  // Keep Active Dish Detail Modal in sync
  useEffect(() => {
    if (activeDetailDish) {
      const current = menuItems.find((m) => m.id === activeDetailDish.id);
      if (
        current &&
        (current.imageUrl !== activeDetailDish.imageUrl ||
          current.price !== activeDetailDish.price ||
          current.available !== activeDetailDish.available ||
          current.name !== activeDetailDish.name)
      ) {
        setActiveDetailDish(current);
      }
    }
  }, [menuItems, activeDetailDish]);

  // First-time Onboarding Check
  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem('unsay_sudan_onboarding_completed');
      if (!hasCompleted) {
        setIsOnboardingOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleCloseOnboarding = () => {
    setIsOnboardingOpen(false);
    try {
      localStorage.setItem('unsay_sudan_onboarding_completed', 'true');
    } catch {
      // ignore
    }
  };

  // Persist Tray
  useEffect(() => {
    try {
      localStorage.setItem('unsay_sudan_tray', JSON.stringify(myTray));
    } catch {
      // ignore
    }
  }, [myTray]);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleNavigate = (page: AppPage) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleFavorite = (dishId: number) => {
    setFavorites((prev) => {
      const exists = prev.includes(dishId);
      const next = exists ? prev.filter((id) => id !== dishId) : [...prev, dishId];
      try {
        localStorage.setItem('unsay_sudan_favorites', JSON.stringify(next));
      } catch {
        // ignore
      }
      showToast(exists ? 'Removed from favorites' : 'Saved to favorites');
      return next;
    });
  };

  // Filtered & Sorted Dishes for Explore Page
  const filteredDishes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const matches = menuItems.filter((dish) => {
      if (dish.hidden) return false;
      if (selectedStall && dish.stall !== selectedStall) return false;
      if (selectedCategory !== 'All' && dish.category !== selectedCategory) return false;
      if (withinBudgetOnly && dish.price > userBudget) return false;
      if (availableOnly && !dish.available) return false;
      if (currentZone !== 'all' && dish.zone !== currentZone) return false;

      if (q) {
        const matchName = dish.name.toLowerCase().includes(q);
        const matchStall = dish.stall.toLowerCase().includes(q);
        const matchItems = dish.items.toLowerCase().includes(q);
        const matchCat = dish.category.toLowerCase().includes(q);
        if (!matchName && !matchStall && !matchItems && !matchCat) return false;
      }

      return true;
    });

    return matches.sort((a, b) => {
      if (currentSort === 'best-value') {
        const aFits = a.price <= userBudget;
        const bFits = b.price <= userBudget;
        if (aFits && !bFits) return -1;
        if (!aFits && bFits) return 1;
        if (aFits && bFits) return b.price - a.price;
        return a.price - b.price;
      }
      if (currentSort === 'cheapest') return a.price - b.price;
      if (currentSort === 'priciest') return b.price - a.price;
      if (currentSort === 'popular') return (b.clicks || 0) - (a.clicks || 0);
      if (currentSort === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [
    menuItems,
    userBudget,
    currentZone,
    selectedCategory,
    searchQuery,
    selectedStall,
    currentSort,
    withinBudgetOnly,
    availableOnly
  ]);

  // Tray Actions (with quantity support)
  const handleQuickAdd = (dish: DishItem) => {
    recordItemClickAPI(dish.id);
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === dish.id ? { ...item, clicks: (item.clicks || 0) + 1 } : item
      )
    );

    const displayImage = getDishDisplayImage(dish);
    setMyTray((prev) => {
      const existingIdx = prev.findIndex(
        (tItem) =>
          tItem.dishId === dish.id &&
          !tItem.selectedVariant &&
          (!tItem.customAddons || tItem.customAddons.length === 0)
      );
      if (existingIdx >= 0) {
        return prev.map((tItem, i) =>
          i === existingIdx ? { ...tItem, quantity: (tItem.quantity || 1) + 1 } : tItem
        );
      }
      const newTrayItem: TrayItem = {
        trayId: `${dish.id}-${Date.now()}-${Math.random()}`,
        dishId: dish.id,
        name: dish.name,
        stall: dish.stall,
        basePrice: dish.price,
        totalWithAddons: dish.price,
        quantity: 1,
        customAddons: [],
        imageUrl: displayImage.url || dish.imageUrl
      };
      return [...prev, newTrayItem];
    });
    showToast(t.toastTrayAdded);
  };

  const handleAddToTrayFromModal = (
    dish: DishItem,
    addons: { name: string; price: number }[],
    total: number,
    selectedVariant?: string
  ) => {
    recordItemClickAPI(dish.id);
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === dish.id ? { ...item, clicks: (item.clicks || 0) + 1 } : item
      )
    );

    const addonsCost = addons.reduce((sum, a) => sum + a.price, 0);
    const displayImage = getDishDisplayImage(dish);
    const addonKey = addons
      .map((a) => a.name)
      .sort()
      .join('|');

    setMyTray((prev) => {
      const existingIdx = prev.findIndex((tItem) => {
        const existingKey = (tItem.customAddons || [])
          .map((a) => a.name)
          .sort()
          .join('|');
        return (
          tItem.dishId === dish.id &&
          (tItem.selectedVariant || '') === (selectedVariant || '') &&
          existingKey === addonKey
        );
      });
      if (existingIdx >= 0) {
        return prev.map((tItem, i) =>
          i === existingIdx ? { ...tItem, quantity: (tItem.quantity || 1) + 1 } : tItem
        );
      }
      const newTrayItem: TrayItem = {
        trayId: `${dish.id}-${Date.now()}-${Math.random()}`,
        dishId: dish.id,
        name: selectedVariant ? `${dish.name} (${selectedVariant})` : dish.name,
        stall: dish.stall,
        basePrice: total - addonsCost,
        totalWithAddons: total,
        quantity: 1,
        customAddons: addons,
        imageUrl: displayImage.url || dish.imageUrl,
        selectedVariant
      };
      return [...prev, newTrayItem];
    });

    setActiveDetailDish(null);
    showToast(t.toastTrayAdded);
  };

  const handleUpdateTrayQuantity = (trayId: string, delta: number) => {
    setMyTray((prev) =>
      prev
        .map((item) => {
          if (item.trayId !== trayId) return item;
          const nextQty = (item.quantity || 1) + delta;
          if (nextQty <= 0) return null;
          return { ...item, quantity: nextQty };
        })
        .filter((item): item is TrayItem => item !== null)
    );
  };

  const handleRemoveFromTray = (trayId: string) => {
    setMyTray((prev) => prev.filter((item) => item.trayId !== trayId));
    showToast('Item removed from tray');
  };

  const handleClearTray = () => {
    setMyTray([]);
    showToast('Tray cleared');
  };

  const handleBudgetChange = (val: number) => {
    const cleanVal = Math.min(500, Math.max(1, Math.round(val)));
    hasExplicitBudgetRef.current = true;
    setUserBudget(cleanVal);
    saveBudgetPref(cleanVal);
  };

  const handleCopyTray = async () => {
    if (myTray.length === 0) return;

    let note = 'UNIVERSITY CAFETERIA ORDER LIST:\n\n';
    let grandTotal = 0;

    myTray.forEach((item, idx) => {
      const qty = item.quantity || 1;
      const lineTotal = item.totalWithAddons * qty;
      note += `${idx + 1}. [${item.stall}]\n   • ${qty}x ${item.name} (₱${lineTotal})\n`;
      if (item.customAddons.length > 0) {
        note += `   • Add-ons: ${item.customAddons.map((a) => a.name).join(', ')}\n`;
      }
      note += '\n';
      grandTotal += lineTotal;
    });

    note += `TOTAL COST: ₱${grandTotal}\nSUKLI FROM ₱${userBudget}: ₱${userBudget - grandTotal}\nGenerated via Our Sud-an`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(note);
      } else {
        const ta = document.createElement('textarea');
        ta.value = note;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showToast(t.toastCopied);
    } catch {
      showToast('Could not access clipboard');
    }
  };

  // Merchant Actions
  const handleToggleStock = async (dishId: number) => {
    if (!authenticatedStall) return;

    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === dishId ? { ...item, available: !item.available } : item
      )
    );

    const updated = await toggleItemStockAPI(dishId, authenticatedStall);
    if (updated) {
      showToast(`${updated.name} is now ${updated.available ? 'Available' : 'Sold Out'}`);
    } else {
      syncMenuRef.current?.(true);
    }
  };

  const handleOpenDetailDish = (dish: DishItem) => {
    setActiveDetailDish(dish);
    if (dish && dish.stall) {
      const visitorId = getAnonymousVisitorId();
      if (navigator.onLine) {
        recordItemViewAPI(dish.stall, dish.id, dish.name, visitorId);
      } else {
        queueOfflineEvent({
          type: 'item_view',
          visitorId,
          stallName: dish.stall,
          dishId: dish.id,
          dishName: dish.name
        });
      }
    }
  };

  const handleUpdatePrice = async (dishId: number, delta: number) => {
    if (!authenticatedStall) return;

    let targetPrice = 0;
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === dishId) {
          const newPrice = Math.max(5, item.price + delta);
          targetPrice = newPrice;
          return { ...item, price: newPrice };
        }
        return item;
      })
    );

    if (targetPrice > 0) {
      setMyTray((prev) =>
        prev.map((tItem) => {
          if (tItem.dishId === dishId) {
            const addonsSum = (tItem.customAddons || []).reduce((s, a) => s + a.price, 0);
            return {
              ...tItem,
              basePrice: targetPrice,
              totalWithAddons: targetPrice + addonsSum
            };
          }
          return tItem;
        })
      );
    }

    const updated = await updateItemPriceAPI(dishId, delta, authenticatedStall);
    if (updated) {
      showToast(`Price updated to ₱${updated.price}`);
    } else {
      syncMenuRef.current?.(true);
    }
  };

  const handleSaveNotice = async (notice: string) => {
    if (!authenticatedStall) return;
    setStallNotices((prev) => ({ ...prev, [authenticatedStall]: notice }));
    await saveStallNoticeAPI(authenticatedStall, notice);
    showToast(`Broadcast notice updated for ${authenticatedStall}!`);
  };

  const handleAddItem = (newItem: Omit<DishItem, 'id' | 'clicks'>) => {
    const created: DishItem = {
      ...newItem,
      id: (newItem as DishItem).id || Math.max(...menuItems.map((m) => m.id), 0) + 1,
      clicks: 0
    };
    if (created.imageUrl) {
      saveToOwnerImageVault(created.id, created.stall, created.name, created.imageUrl);
    }
    setMenuItems((prev) => [created, ...prev]);
    syncMenuRef.current?.(true);
    showToast(`Added ${created.name} to ${created.stall} menu!`);
  };

  const handleUpdateItem = (dishId: number, updates: Partial<DishItem>) => {
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === dishId) {
          const updated = { ...item, ...updates };
          if (updates.imageUrl) {
            saveToOwnerImageVault(updated.id, updated.stall, updated.name, updates.imageUrl);
          } else if (updates.imageUrl === null) {
            removeFromOwnerImageVault(updated.id, updated.stall, updated.name);
          }
          return updated;
        }
        return item;
      })
    );

    if (updates.price !== undefined || updates.name || updates.imageUrl !== undefined) {
      setMyTray((prev) =>
        prev.map((tItem) => {
          if (tItem.dishId === dishId) {
            const newBase = updates.price !== undefined ? updates.price : tItem.basePrice;
            const addonsSum = (tItem.customAddons || []).reduce((s, a) => s + a.price, 0);
            return {
              ...tItem,
              name: updates.name || tItem.name,
              basePrice: newBase,
              totalWithAddons: newBase + addonsSum,
              imageUrl: updates.imageUrl !== undefined ? updates.imageUrl : tItem.imageUrl
            };
          }
          return tItem;
        })
      );
    }

    showToast('Menu updated successfully.');
  };

  const handleToggleHideItem = (dishId: number) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === dishId ? { ...item, hidden: !item.hidden } : item))
    );
    showToast('Visibility toggled for menu item');
  };

  const handleDeleteItem = async (
    dishId: number,
    deleteImagePermanently = false
  ): Promise<boolean> => {
    if (!authenticatedStall) return false;
    const target = menuItems.find((m) => m.id === dishId);
    if (!target) return false;

    const result = await deleteMenuItemSafelyAPI(
      dishId,
      authenticatedStall,
      deleteImagePermanently
    );
    if (!result.success) {
      showToast(result.error || 'Failed to remove menu item');
      return false;
    }

    if (deleteImagePermanently) {
      removeFromOwnerImageVault(target.id, target.stall, target.name);
    }

    setMenuItems((prev) => prev.filter((m) => m.id !== dishId));
    setMyTray((prev) => prev.filter((t) => t.dishId !== dishId));

    showToast(
      deleteImagePermanently
        ? `Removed ${target.name}. Image permanently erased.`
        : `Removed ${target.name}. Photo preserved safely in Stall Photo Vault.`
    );
    return true;
  };

  const handleRestoreItem = async (archiveId: string): Promise<boolean> => {
    if (!authenticatedStall) return false;
    const result = await restoreArchivedDishAPI(archiveId, authenticatedStall);
    if (!result.success || !result.item) {
      showToast(result.error || 'Failed to restore archived dish');
      return false;
    }

    const restored = result.item;
    if (restored.ownerUploadedImage) {
      saveToOwnerImageVault(
        restored.id,
        restored.stall,
        restored.name,
        restored.ownerUploadedImage
      );
    }
    setMenuItems((prev) => [restored, ...prev.filter((m) => m.id !== restored.id)]);
    showToast(`Restored "${restored.name}" with original protected photo!`);
    return true;
  };

  const handleMenuBatchSaved = (updatedStallItems: DishItem[]) => {
    if (!authenticatedStall) return;
    setMenuItems((prev) => {
      const rest = prev.filter((m) => m.stall !== authenticatedStall);
      return [...rest, ...updatedStallItems];
    });

    updatedStallItems.forEach((item) => {
      if (item.ownerUploadedImage) {
        saveToOwnerImageVault(item.id, item.stall, item.name, item.ownerUploadedImage);
      }
    });

    syncMenuRef.current?.(true);
    showToast('Changes saved successfully.');
  };

  const totalTrayCount = myTray.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  const totalTrayCost = myTray.reduce(
    (acc, curr) => acc + curr.totalWithAddons * (curr.quantity || 1),
    0
  );
  const stallsListNames = stallsList.map((s) => s.name);
  const campusAnnouncements = useMemo(
    () => notifications.filter((n) => n.type === 'announcement'),
    [notifications]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5EC] via-[#FFF9F3] to-[#FFFDF9] text-stone-900 flex flex-col font-sans selection:bg-orange-200 selection:text-orange-950 relative overflow-x-hidden">
      <FloatingFoodBackground />
      <OfflineIndicator
        onReconnected={() => syncMenuRef.current?.(true)}
        lastSyncedAt={lastSyncedAt}
        isSyncing={isSyncingMenu}
        onManualSync={() => syncMenuRef.current?.(true)}
      />

      {/* 1. Header */}
      <Header
        currentPage={currentPage}
        onNavigate={handleNavigate}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        trayCount={totalTrayCount}
        onOpenMerchantAuth={() => setIsMerchantAuthOpen(true)}
        t={t}
        isMerchantActive={!!authenticatedStall}
        activeStallName={authenticatedStall}
        onLogoutMerchant={() => {
          clearAuthSession();
          setAuthenticatedStall(null);
          showToast('Merchant session locked. Returned to Student mode.');
        }}
        unreadNotificationsCount={notifications.filter((n) => !n.isRead).length}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        isAdminActive={!!adminUser}
        onLogoutAdmin={() => {
          clearAuthSession();
          setAdminUser(null);
          showToast('Administrator session ended.');
          handleNavigate('home');
        }}
      />

      {/* 2. Persistent Budget & Sukli Bar */}
      {!authenticatedStall &&
        !adminUser &&
        currentPage !== 'portal' &&
        currentPage !== 'admin' &&
        currentPage !== 'subscription' && (
          <BudgetSummaryBar
            budget={userBudget}
            spent={totalTrayCost}
            trayCount={totalTrayCount}
            onBudgetChange={handleBudgetChange}
            onNavigate={handleNavigate}
            currentPage={currentPage}
          />
        )}

      {/* 3. Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 relative z-10">
        {currentPage === 'portal' && (
          <StallPortalPage
            authenticatedStall={authenticatedStall}
            onAuthenticate={(stallName) => {
              setAuthenticatedStall(stallName);
              syncMenuRef.current?.(true);
              showToast(`Welcome, ${stallName}! Stall dashboard unlocked.`);
            }}
            onLogout={() => {
              clearAuthSession();
              setAuthenticatedStall(null);
              showToast('Stall portal locked.');
            }}
            items={menuItems}
            stallNotices={stallNotices}
            onSaveNotice={handleSaveNotice}
            onToggleStock={handleToggleStock}
            onUpdatePrice={handleUpdatePrice}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onToggleHideItem={handleToggleHideItem}
            onDeleteItem={handleDeleteItem}
            onRestoreItem={handleRestoreItem}
            onBatchSaved={handleMenuBatchSaved}
            stalls={stallsList}
            onNavigate={handleNavigate}
            t={t}
          />
        )}

        {currentPage === 'home' && (
          <HomePage
            budget={userBudget}
            defaultBudget={platformSettings?.defaultStudentBudget || 55}
            totalTrayCost={totalTrayCost}
            onBudgetChange={handleBudgetChange}
            dishes={menuItems}
            stallsCount={stallsList.length}
            isLoading={isLoadingMenu}
            isOnline={isOnline}
            isSyncing={isSyncingMenu}
            lastSyncedAt={lastSyncedAt}
            onManualSync={() => syncMenuRef.current?.(true)}
            onOpenCampusQR={() => setIsCampusQROpen(true)}
            welcomeBannerMessage={platformSettings?.welcomeBannerMessage}
            announcements={campusAnnouncements}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onQuickAdd={handleQuickAdd}
            onOpenDetail={handleOpenDetailDish}
            onOpenRoulette={() => setIsRouletteOpen(true)}
            onNavigate={handleNavigate}
            onToggleFavorite={handleToggleFavorite}
            favorites={favorites}
            t={t}
          />
        )}

        {currentPage === 'explore' && (
          <ExplorePage
            dishes={filteredDishes}
            userBudget={userBudget}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            currentZone={currentZone}
            onZoneChange={setCurrentZone}
            selectedStall={selectedStall}
            onSelectStall={setSelectedStall}
            stallsList={stallsListNames}
            currentSort={currentSort}
            onSortChange={setCurrentSort}
            availableOnly={availableOnly}
            onToggleAvailableOnly={() => setAvailableOnly((prev) => !prev)}
            withinBudgetOnly={withinBudgetOnly}
            onToggleWithinBudgetOnly={() => setWithinBudgetOnly((prev) => !prev)}
            onResetFilters={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedStall(null);
              setCurrentZone('all');
              setAvailableOnly(false);
              setWithinBudgetOnly(true);
              setCurrentSort('best-value');
              showToast('Filters reset to default');
            }}
            onQuickAdd={handleQuickAdd}
            onOpenDetail={handleOpenDetailDish}
            onOpenRoulette={() => setIsRouletteOpen(true)}
            onToggleFavorite={handleToggleFavorite}
            favorites={favorites}
            t={t}
          />
        )}

        {currentPage === 'stalls' && (
          <StallsPage
            stalls={stallsList}
            allDishes={menuItems}
            selectedStall={selectedStall}
            onSelectStall={(stall) => {
              setSelectedStall(stall);
              if (stall) {
                showToast(`Showing menu for ${stall}`);
                const visitorId = getAnonymousVisitorId();
                if (navigator.onLine) {
                  recordStallViewAPI(stall, visitorId);
                } else {
                  queueOfflineEvent({
                    type: 'stall_view',
                    visitorId,
                    stallName: stall
                  });
                }
              }
            }}
            stallNotices={stallNotices}
            userBudget={userBudget}
            isOnline={isOnline}
            lastSyncedAt={lastSyncedAt}
            onQuickAdd={handleQuickAdd}
            onOpenDetail={handleOpenDetailDish}
            onToggleFavorite={handleToggleFavorite}
            favorites={favorites}
            t={t}
          />
        )}

        {currentPage === 'tray' && (
          <TrayPage
            tray={myTray}
            userBudget={userBudget}
            onUpdateQuantity={handleUpdateTrayQuantity}
            onRemoveItem={handleRemoveFromTray}
            onClearTray={handleClearTray}
            onCopyTray={handleCopyTray}
            onNavigate={handleNavigate}
            t={t}
          />
        )}

        {currentPage === 'orders' && (
          <OrdersPage
            tray={myTray}
            userBudget={userBudget}
            onNavigate={handleNavigate}
            onClearTray={handleClearTray}
          />
        )}

        {currentPage === 'subscription' && (
          <SubscriptionPaywall
            stallName={authenticatedStall || undefined}
            stalls={stallsList}
            onPaymentSubmitted={() => {
              showToast('Payment submitted! Awaiting administrator verification.');
            }}
            onNavigate={handleNavigate}
            showBackToPortal={!!authenticatedStall}
          />
        )}

        {currentPage === 'admin' && (
          <AdminSubscriptionDashboard
            adminUser={adminUser}
            onLoginSuccess={(admin) => {
              setAdminUser(admin);
              syncMenuRef.current?.(true);
              showToast(`Administrator session verified. Welcome, ${admin.name}!`);
            }}
            onLogout={() => {
              clearAuthSession();
              setAdminUser(null);
              showToast('Admin logged out.');
              handleNavigate('home');
            }}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'help' && (
          <HelpPage
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenMerchantAuth={() => setIsMerchantAuthOpen(true)}
            onOpenCampusQR={() => setIsCampusQROpen(true)}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#F0EBE1] bg-[#FFFDF9] py-6 text-center text-xs text-stone-500 pb-20 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-display">
            <span className="font-black text-stone-900">unsaysud-an</span>
            <span className="text-orange-600 font-bold">tech</span>
            <span>•</span>
            <span>USTP CDO Campus Cafeteria</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-stone-500">
            <button onClick={() => handleNavigate('home')} className="hover:text-orange-600">
              Home
            </button>
            <button onClick={() => handleNavigate('explore')} className="hover:text-orange-600">
              Explore
            </button>
            <button onClick={() => handleNavigate('stalls')} className="hover:text-orange-600">
              Stalls
            </button>
            <button onClick={() => handleNavigate('tray')} className="hover:text-orange-600">
              Tray
            </button>
            <button onClick={() => handleNavigate('orders')} className="hover:text-orange-600">
              Orders
            </button>
            <button
              onClick={() => handleNavigate('subscription')}
              className="hover:text-orange-600 font-bold"
            >
              Subscription
            </button>
            <button
              onClick={() => handleNavigate('portal')}
              className="hover:text-orange-600 font-bold"
            >
              Stall Portal
            </button>
            <button
              onClick={() => handleNavigate('admin')}
              className="hover:text-purple-600 font-bold"
            >
              Admin
            </button>
            <button onClick={() => handleNavigate('help')} className="hover:text-orange-600">
              Help & FAQ
            </button>
          </div>

          <div className="text-[11px] text-stone-400">
            Official USTP CDO Campus Cafeteria meal guide & budget matcher.
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <BottomNavBar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        trayCount={totalTrayCount}
      />

      {/* Item Detail / Addon Customizer Modal */}
      <MealDetailModal
        dish={activeDetailDish}
        budget={userBudget}
        onClose={() => setActiveDetailDish(null)}
        onAddToTray={handleAddToTrayFromModal}
        t={t}
      />

      {/* Roulette Modal */}
      <RouletteModal
        isOpen={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
        allDishes={menuItems}
        userBudget={userBudget}
        onSelectDish={handleOpenDetailDish}
        onQuickAdd={handleQuickAdd}
        onAdjustBudget={(newBudget) => {
          handleBudgetChange(newBudget);
          showToast(`Budget updated to ₱${newBudget}`);
        }}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          handleNavigate('explore');
        }}
        t={t}
      />

      {/* Onboarding Interactive Guide Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={handleCloseOnboarding}
        onApplyBudgetPreset={(budgetVal: number) => {
          handleBudgetChange(budgetVal);
          showToast(`Budget set to ₱${budgetVal}`);
        }}
      />

      {/* Campus QR Modal */}
      <CampusQRModal
        isOpen={isCampusQROpen}
        onClose={() => setIsCampusQROpen(false)}
        officialAppUrl={platformSettings?.officialAppUrl}
      />

      {/* Merchant Auth Modal */}
      <MerchantAuthModal
        isOpen={isMerchantAuthOpen}
        onClose={() => setIsMerchantAuthOpen(false)}
        stalls={stallsList}
        onLoginSuccess={(stallName) => {
          setAuthenticatedStall(stallName);
          setIsMerchantAuthOpen(false);
          handleNavigate('portal');
          showToast(`Welcome, ${stallName}! Management mode activated.`);
        }}
        onOpenPortal={() => handleNavigate('portal')}
      />

      {/* In-App Notifications Drawer Panel */}
      <NotificationPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkRead={async (id, markAll) => {
          await markNotificationsReadAPI(id, markAll);
          setNotifications((prev) =>
            prev.map((n) => (markAll || n.id === id ? { ...n, isRead: true } : n))
          );
        }}
        onNavigate={(page) => {
          setIsNotificationsOpen(false);
          handleNavigate(page);
        }}
        title={
          adminUser
            ? 'Admin System Notifications'
            : authenticatedStall
            ? `${authenticatedStall} Notifications`
            : 'Cafeteria Notifications'
        }
      />

      <Toast message={toastMessage} />
    </div>
  );
}
