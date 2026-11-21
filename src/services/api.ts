import {
  DishItem,
  StallOwnerAccount,
  StallAnalyticsData,
  MenuVersionSnapshot,
  UserSubscription,
  PaymentRecord,
  AdminPaymentSettings,
  AppNotification,
  AuditLogEntry,
  AdminSubscriptionSummary,
  SalesRecord,
  SalesItemEntry,
  SalesDashboardMetrics,
  SalesDateFilter,
  SubscriptionStatusResponse,
  TrialStatus,
  AuthUser,
  PlatformAnalyticsData,
  StallRecord
} from '../types';
import { getAuthHeaders, setAuthSession } from '../utils/authStore';

export interface MenuResponse {
  items: DishItem[];
  notices: Record<string, string>;
  stalls: {
    name: string;
    zone: 'outside' | 'inside';
    stallNo?: string;
    officialName?: string;
    description?: string;
    contactInfo?: string;
    isActive?: boolean;
    subscriptionStatus?: string;
  }[];
  version?: number;
}

export interface CampusTemplate {
  stallNo: string;
  officialName: string;
  name: string;
  zone: 'outside' | 'inside';
  isRegistered: boolean;
}

function authJsonHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...getAuthHeaders()
  };
}

export async function fetchMenuData(
  role?: 'customer' | 'merchant' | 'admin',
  stallName?: string
): Promise<MenuResponse> {
  try {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (stallName) params.set('stall', stallName);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/menu${qs}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load menu data');
    return await res.json();
  } catch (err) {
    console.warn('Menu fetch error:', err);
    return {
      items: [],
      notices: {},
      stalls: []
    };
  }
}

export async function fetchCampusStallTemplatesAPI(): Promise<CampusTemplate[]> {
  try {
    const res = await fetch('/api/stalls/templates');
    if (!res.ok) return [];
    const data = await res.json();
    return data.templates || [];
  } catch {
    return [];
  }
}

export async function checkMenuVersionAPI(): Promise<number | null> {
  try {
    const res = await fetch('/api/menu/version');
    if (!res.ok) return null;
    const data = await res.json();
    return data.version || null;
  } catch {
    return null;
  }
}

export async function saveItemPhotoAPI(
  dishId: number,
  stallName: string,
  dataUrl: string | null,
  remove = false
): Promise<{ success: boolean; item?: DishItem; imageUrl?: string; error?: string; message?: string }> {
  try {
    const res = await fetch(`/api/menu/${dishId}/photo`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ stall: stallName, dataUrl, remove })
    });
    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Photo upload failed.' };
    }
    return {
      success: true,
      item: result.item,
      imageUrl: result.imageUrl,
      message: result.message
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Couldn't save photo." };
  }
}

export async function updateMenuItemAPI(
  dishId: number,
  stallName: string,
  updates: Partial<DishItem>
): Promise<{ success: boolean; item?: DishItem; error?: string }> {
  try {
    const res = await fetch(`/api/menu/${dishId}/update`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ stall: stallName, updates })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Failed to update menu item' };
    return { success: true, item: data.item };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update menu item' };
  }
}

export async function syncRestoredPhotosAPI(
  photos: { id: number; stall: string; imageUrl: string }[]
): Promise<{ success: boolean; updatedCount?: number }> {
  try {
    const res = await fetch('/api/menu/sync-photos', {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ photos })
    });
    if (!res.ok) return { success: false };
    return await res.json();
  } catch {
    return { success: false };
  }
}

export async function addMenuItemAPI(
  stallName: string,
  item: Omit<DishItem, 'id' | 'clicks'>
): Promise<{ success: boolean; item?: DishItem; error?: string }> {
  try {
    const res = await fetch('/api/menu/add', {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ stall: stallName, item })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Failed to create menu item' };
    return { success: true, item: data.item };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create menu item' };
  }
}

export async function toggleItemStockAPI(id: number, stallName: string): Promise<DishItem | null> {
  try {
    const res = await fetch(`/api/menu/${id}/toggle-stock`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ stall: stallName })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.item;
  } catch {
    return null;
  }
}

export async function updateItemPriceAPI(
  id: number,
  delta: number,
  stallName: string
): Promise<DishItem | null> {
  try {
    const res = await fetch(`/api/menu/${id}/price`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ delta, stall: stallName })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.item;
  } catch {
    return null;
  }
}

export async function saveStallNoticeAPI(stallName: string, notice: string): Promise<boolean> {
  try {
    const res = await fetch('/api/stalls/notice', {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ stall: stallName, notice })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function recordItemClickAPI(id: number): Promise<void> {
  try {
    await fetch(`/api/menu/${id}/click`, { method: 'POST' });
  } catch {
    // non-blocking
  }
}

// ============================================================================
// PUBLIC CUSTOMER ACCESS (NO STUDENT REGISTRATION OR LOGIN REQUIRED)
// ============================================================================

// ============================================================================
// STALL OWNER REGISTRATION & AUTHENTICATION
// ============================================================================

export async function verifyStallLoginAPI(
  stall: string,
  pin: string
): Promise<{ success: boolean; owner?: StallOwnerAccount; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/stalls/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stall, pin })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Authentication failed.' };
    if (data.token && data.owner) {
      setAuthSession({
        token: data.token,
        owner: data.owner,
        user: {
          id: data.owner.id,
          name: data.owner.ownerName,
          email: data.owner.email,
          username: data.owner.username,
          role: 'merchant',
          status: 'active',
          stallName: data.owner.stallName,
          stallNo: data.owner.stallNo,
          createdAt: data.owner.createdAt
        }
      });
    }
    return { success: true, owner: data.owner, token: data.token };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error verifying credentials.' };
  }
}

export async function registerStallOwnerAPI(data: {
  stallNo?: string;
  stallName: string;
  zone: 'outside' | 'inside';
  description: string;
  contactInfo: string;
  ownerName: string;
  username: string;
  email: string;
  password: string;
  pin: string;
  useCampusTemplateName?: string;
}): Promise<{
  success: boolean;
  owner?: StallOwnerAccount;
  token?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Registration failed.' };
    }
    if (result.token && result.owner) {
      setAuthSession({
        token: result.token,
        owner: result.owner,
        user: {
          id: result.owner.id,
          name: result.owner.ownerName,
          email: result.owner.email,
          username: result.owner.username,
          role: 'merchant',
          status: 'active',
          stallName: result.owner.stallName,
          stallNo: result.owner.stallNo,
          contactInfo: result.owner.contactInfo,
          createdAt: result.owner.createdAt
        }
      });
    }
    return { success: true, owner: result.owner, token: result.token };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during registration.' };
  }
}

export async function loginStallOwnerAPI(credentials: {
  identifier?: string;
  password?: string;
  stall?: string;
  pin?: string;
}): Promise<{ success: boolean; owner?: StallOwnerAccount; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Login failed.' };
    }
    if (result.token && result.owner) {
      setAuthSession({
        token: result.token,
        owner: result.owner,
        user: {
          id: result.owner.id,
          name: result.owner.ownerName,
          email: result.owner.email,
          username: result.owner.username,
          role: 'merchant',
          status: 'active',
          stallName: result.owner.stallName,
          stallNo: result.owner.stallNo,
          contactInfo: result.owner.contactInfo,
          createdAt: result.owner.createdAt
        }
      });
    }
    return { success: true, owner: result.owner, token: result.token };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during login.' };
  }
}

export async function forgotPasswordAPI(data: {
  stallName: string;
  email?: string;
  pin: string;
  newPassword: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) return { success: false, error: result.error || 'Password reset failed.' };
    return { success: true, message: result.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error.' };
  }
}

export async function updateProfileAPI(data: {
  stallName: string;
  currentPin: string;
  newOwnerName?: string;
  contactInfo?: string;
  description?: string;
  newPassword?: string;
  newPin?: string;
}): Promise<{ success: boolean; owner?: StallOwnerAccount; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) return { success: false, error: result.error || 'Failed to update settings.' };
    return { success: true, owner: result.owner, message: result.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during update.' };
  }
}

// ============================================================================
// REAL ANALYTICS TRACKING SERVICES
// ============================================================================

export async function recordSessionVisitAPI(
  visitorId: string,
  portal: 'customer' | 'merchant' | 'admin' = 'customer',
  mode: 'online' | 'offline' = 'online'
): Promise<boolean> {
  try {
    const res = await fetch('/api/analytics/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId, portal, mode })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function flushOfflineAnalyticsAPI(
  offlineEvents: Array<{
    type: 'app_session' | 'stall_view' | 'item_view';
    visitorId: string;
    portal?: 'customer' | 'merchant' | 'admin';
    stallName?: string;
    dishId?: number;
    dishName?: string;
    timestamp: string;
  }>
): Promise<boolean> {
  if (!offlineEvents || offlineEvents.length === 0) return true;
  try {
    const res = await fetch('/api/analytics/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offlineEvents })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function recordStallViewAPI(stallName: string, visitorId: string): Promise<void> {
  try {
    await fetch('/api/analytics/stall-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stallName, visitorId })
    });
  } catch {
    // non-blocking
  }
}

export async function recordItemViewAPI(
  stallName: string,
  dishId: number,
  dishName: string,
  visitorId: string
): Promise<void> {
  try {
    await fetch('/api/analytics/item-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stallName, dishId, dishName, visitorId })
    });
  } catch {
    // non-blocking
  }
}

export async function fetchStallAnalyticsAPI(
  stallName: string,
  period = '7days'
): Promise<StallAnalyticsData | null> {
  try {
    const res = await fetch(
      `/api/analytics/${encodeURIComponent(stallName)}?period=${period}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ============================================================================
// OWNER IMAGE VAULT, BATCH SAVE & MENU VERSIONING
// ============================================================================

export async function deleteMenuItemSafelyAPI(
  dishId: number,
  stallName: string,
  deleteImagePermanently = false
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/menu/${dishId}/delete`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ stall: stallName, deleteImagePermanently })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Failed to remove item' };
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to remove item' };
  }
}

export async function fetchStallPhotoVaultAPI(
  stallName: string
): Promise<{ success: boolean; protectedImages?: any[]; archivedDishes?: any[]; error?: string }> {
  try {
    const res = await fetch(`/api/menu/photo-vault/${encodeURIComponent(stallName)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch photo vault');
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch stall photo vault' };
  }
}

export async function restoreArchivedDishAPI(
  archiveId: string,
  stallName: string
): Promise<{ success: boolean; item?: DishItem; error?: string }> {
  try {
    const res = await fetch('/api/menu/restore-dish', {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ archiveId, stall: stallName })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Failed to restore dish' };
    return { success: true, item: data.item };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to restore dish' };
  }
}

export async function saveMenuBatchAPI(
  stallName: string,
  items: DishItem[],
  deletedItemIds?: number[],
  summary?: string
): Promise<{
  success: boolean;
  items?: DishItem[];
  snapshot?: MenuVersionSnapshot;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/menu/save-batch', {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ stall: stallName, items, deletedItemIds, summary })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Failed to save changes' };
    return {
      success: true,
      items: data.items,
      snapshot: data.snapshot,
      message: data.message || 'Changes saved successfully.'
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error saving changes' };
  }
}

export async function fetchMenuVersionsAPI(
  stallName: string
): Promise<{ success: boolean; versions?: MenuVersionSnapshot[]; error?: string }> {
  try {
    const res = await fetch(`/api/menu/versions/${encodeURIComponent(stallName)}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch versions');
    const data = await res.json();
    return { success: true, versions: data.versions };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch version history' };
  }
}

export async function restoreMenuVersionAPI(
  stallName: string,
  versionId: string
): Promise<{
  success: boolean;
  items?: DishItem[];
  snapshot?: MenuVersionSnapshot;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/menu/versions/restore', {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ stall: stallName, versionId })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Failed to restore version' };
    return {
      success: true,
      items: data.items,
      snapshot: data.snapshot,
      message: data.message
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

// ============================================================================
// SUBSCRIPTION, PAYMENT & NOTIFICATIONS
// ============================================================================

export async function fetchSubscriptionSettingsAPI(): Promise<{
  success: boolean;
  settings?: AdminPaymentSettings;
  error?: string;
}> {
  try {
    const res = await fetch('/api/subscription/settings');
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Failed to fetch settings' };
    return { success: true, settings: data.settings };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to connect to server' };
  }
}

export async function fetchSubscriptionStatusAPI(
  stallName: string
): Promise<SubscriptionStatusResponse> {
  try {
    const res = await fetch(`/api/subscription/status/${encodeURIComponent(stallName)}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        hasSubscription: false,
        status: 'None',
        trialStatus: 'Not Started',
        isTrial: false,
        isSubscribed: false,
        isExpired: true,
        daysRemaining: 0,
        serverTime: new Date().toISOString(),
        error: data.error
      };
    }
    return data;
  } catch (err: any) {
    return {
      hasSubscription: false,
      status: 'None',
      trialStatus: 'Not Started',
      isTrial: false,
      isSubscribed: false,
      isExpired: true,
      daysRemaining: 0,
      serverTime: new Date().toISOString(),
      error: err.message || 'Failed to get subscription status'
    };
  }
}

export async function startFreeTrialAPI(stallName: string): Promise<{
  success: boolean;
  message?: string;
  trialStatus?: TrialStatus;
  trialStartDate?: string;
  trialEndDate?: string;
  trialDaysRemaining?: number;
  serverTime?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/subscription/start-trial', {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ stallName })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Failed to start free trial' };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error starting trial' };
  }
}

export async function submitSubscriptionPaymentAPI(paymentData: {
  stallName: string;
  plan: 'weekly' | 'monthly';
  paymentMethod: 'gcash' | 'bank' | 'qr';
  referenceNumber: string;
  paymentDate: string;
  proofImageDataUrl?: string;
  notes?: string;
  resubmitPaymentId?: string;
}): Promise<{ success: boolean; message?: string; payment?: PaymentRecord; error?: string }> {
  try {
    const res = await fetch('/api/subscription/submit-payment', {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(paymentData)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Payment submission failed' };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit payment' };
  }
}

export async function fetchStallPaymentsAPI(stallName: string): Promise<{
  success: boolean;
  payments?: PaymentRecord[];
  error?: string;
}> {
  try {
    const res = await fetch(`/api/subscription/payments/${encodeURIComponent(stallName)}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true, payments: data.payments || [] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchNotificationsAPI(): Promise<{
  success: boolean;
  notifications?: AppNotification[];
  unreadCount?: number;
  error?: string;
}> {
  try {
    const res = await fetch('/api/notifications', {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return {
      success: true,
      notifications: data.notifications || [],
      unreadCount: data.unreadCount || 0
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function markNotificationsReadAPI(
  notificationId?: string,
  markAll = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ notificationId, markAll })
    });
    const data = await res.json();
    return { success: Boolean(data.success) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ============================================================================
// ADMINISTRATOR PORTAL APIs
// ============================================================================

export async function fetchAdminBootstrapStatusAPI(): Promise<{
  initialized: boolean;
  envPasscodeConfigured: boolean;
}> {
  try {
    const res = await fetch('/api/admin/bootstrap-status');
    if (!res.ok) return { initialized: true, envPasscodeConfigured: false };
    return await res.json();
  } catch {
    return { initialized: true, envPasscodeConfigured: false };
  }
}

export async function bootstrapAdminAPI(data: {
  name: string;
  username: string;
  email: string;
  password: string;
  passcode?: string;
}): Promise<{ success: boolean; admin?: AuthUser; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/bootstrap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) return { success: false, error: result.error || 'Admin initialization failed.' };
    if (result.token && result.admin) {
      setAuthSession({ token: result.token, user: result.admin });
    }
    return { success: true, admin: result.admin, token: result.token };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error.' };
  }
}

export async function adminLoginAPI(credentials: {
  identifier: string;
  password: string;
}): Promise<{ success: boolean; admin?: AuthUser; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Admin login failed' };
    if (data.token && data.admin) {
      setAuthSession({ token: data.token, user: data.admin });
    }
    return { success: true, admin: data.admin, token: data.token };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during admin login' };
  }
}

export async function fetchAdminSummaryAPI(): Promise<{
  success: boolean;
  summary?: AdminSubscriptionSummary;
  subscriptions?: UserSubscription[];
  payments?: PaymentRecord[];
  trials?: any[];
  stallStatuses?: any[];
  settings?: AdminPaymentSettings;
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin/summary', { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchAdminAnalyticsAPI(
  range: 'today' | '7days' | '30days' | 'custom' | 'all' = '7days',
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; analytics?: PlatformAnalyticsData; error?: string }> {
  try {
    const params = new URLSearchParams({ range });
    if (range === 'custom' && startDate && endDate) {
      params.set('startDate', startDate);
      params.set('endDate', endDate);
    }
    const res = await fetch(`/api/admin/analytics?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminVerifyPaymentAPI(
  paymentId: string,
  action: 'approve' | 'reject' | 'request_info',
  payload?: { rejectionReason?: string; requestedInfoMessage?: string }
): Promise<{
  success: boolean;
  message?: string;
  payment?: PaymentRecord;
  subscription?: UserSubscription;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/admin/payments/${paymentId}/verify`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({
        action,
        rejectionReason: payload?.rejectionReason,
        requestedInfoMessage: payload?.requestedInfoMessage
      })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Verification failed' };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminManualAccessAPI(params: {
  stallName: string;
  action: 'grant' | 'renew' | 'revoke';
  durationDays?: number;
  reason?: string;
}): Promise<{ success: boolean; message?: string; subscription?: UserSubscription; error?: string }> {
  try {
    const res = await fetch('/api/admin/manual-access', {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Subscription update failed' };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchAdminStallsAPI(): Promise<{
  success: boolean;
  stalls?: any[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin/stalls', { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchAdminStallDetailsAPI(stallName: string): Promise<{
  success: boolean;
  stall?: StallRecord;
  subscription?: SubscriptionStatusResponse;
  items?: DishItem[];
  payments?: PaymentRecord[];
  error?: string;
}> {
  try {
    const res = await fetch(`/api/admin/stalls/${encodeURIComponent(stallName)}/details`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminUpdateStallStatusAPI(
  stallName: string,
  action: 'activate' | 'deactivate' | 'suspend' | 'restore' | 'approve_registration' | 'reject_registration',
  reason?: string
): Promise<{ success: boolean; stall?: StallRecord; error?: string }> {
  try {
    const res = await fetch(`/api/admin/stalls/${encodeURIComponent(stallName)}/status`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ action, reason })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchAdminUsersAPI(): Promise<{
  success: boolean;
  users?: AuthUser[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin/users', { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminUpdateUserStatusAPI(
  userId: string,
  status: 'active' | 'deactivated' | 'suspended',
  reason?: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ status, reason })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminUpdateUserRoleAPI(
  userId: string,
  role: 'customer' | 'merchant'
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminUpdateSettingsAPI(
  settings: Partial<AdminPaymentSettings>
): Promise<{ success: boolean; message?: string; settings?: AdminPaymentSettings; error?: string }> {
  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Failed to update settings' };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminUploadQRCodeAPI(
  dataUrl: string
): Promise<{ success: boolean; imageUrl?: string; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/qr-upload', {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ dataUrl })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Failed to upload QR code' };
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminBroadcastAnnouncementAPI(payload: {
  title: string;
  message: string;
  audience: 'all' | 'customers' | 'stalls';
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchAdminAuditLogsAPI(): Promise<{
  success: boolean;
  logs?: AuditLogEntry[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin/audit-logs', { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true, logs: data.logs || [] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ============================================================================
// SMART SALES TRACKER APIs
// ============================================================================

export interface FetchSalesResponse {
  success: boolean;
  stallName?: string;
  records: SalesRecord[];
  totalCount?: number;
  metrics?: SalesDashboardMetrics;
  error?: string;
}

export async function fetchStallSalesAPI(
  stallName: string,
  filter: SalesDateFilter = 'all',
  startDate?: string,
  endDate?: string,
  recordType?: 'all' | 'daily_summary' | 'itemized'
): Promise<FetchSalesResponse> {
  try {
    const params = new URLSearchParams();
    if (filter) params.set('filter', filter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (recordType && recordType !== 'all') params.set('recordType', recordType);

    const res = await fetch(`/api/sales/${encodeURIComponent(stallName)}?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch sales records');
    return {
      success: true,
      stallName: data.stallName,
      records: data.records || [],
      totalCount: data.totalCount || 0,
      metrics: data.metrics
    };
  } catch (err: any) {
    return {
      success: false,
      records: [],
      error: err.message || 'Failed to load sales records'
    };
  }
}

export interface SaveSalesRecordResult {
  success: boolean;
  record?: SalesRecord;
  duplicate?: boolean;
  existingId?: string;
  message?: string;
  error?: string;
}

export async function saveSalesRecordAPI(payload: {
  stallName: string;
  recordType: 'daily_summary' | 'itemized';
  date: string;
  totalSales: number;
  totalExpenses: number;
  notes?: string;
  items?: SalesItemEntry[];
  overrideDuplicate?: boolean;
}): Promise<SaveSalesRecordResult> {
  try {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        duplicate: data.duplicate,
        existingId: data.existingId,
        message: data.message,
        error: data.error || 'Failed to save sales record'
      };
    }
    return { success: true, record: data.record, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error saving sales record' };
  }
}

export async function updateSalesRecordAPI(
  id: string,
  updates: Partial<SalesRecord>
): Promise<{ success: boolean; record?: SalesRecord; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/sales/${id}`, {
      method: 'PUT',
      headers: authJsonHeaders(),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Failed to update record' };
    return { success: true, record: data.record, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error updating record' };
  }
}

export async function deleteSalesRecordAPI(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/sales/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Failed to delete record' };
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error deleting record' };
  }
}
