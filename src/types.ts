export type Language = 'bisaya' | 'tagalog' | 'english';

export type AppPage =
  | 'home'
  | 'explore'
  | 'stalls'
  | 'tray'
  | 'orders'
  | 'portal'
  | 'subscription'
  | 'admin'
  | 'help';

export type UserRole = 'customer' | 'merchant' | 'admin';
export type UserAccountStatus = 'active' | 'deactivated' | 'suspended';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserAccountStatus;
  stallName?: string;
  stallNo?: string;
  contactInfo?: string;
  createdAt: string;
  lastLoginAt?: string;
  loginCount?: number;
}

export type StallOperationalStatus = 'active' | 'inactive' | 'suspended';
export type StallRegistrationStatus = 'approved' | 'pending' | 'rejected';

export interface StallRecord {
  id: string;
  stallNo: string;
  name: string;
  officialName: string;
  zone: 'outside' | 'inside';
  description: string;
  contactInfo: string;
  email: string;
  ownerId: string;
  ownerName: string;
  status: StallOperationalStatus;
  registrationStatus: StallRegistrationStatus;
  suspensionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionPlanType = 'weekly' | 'monthly' | 'trial';
export type SubscriptionStatus =
  | 'ACTIVE'
  | 'PENDING'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'Active'
  | 'Pending'
  | 'Expired'
  | 'Suspended'
  | 'None';
export type TrialStatus = 'Not Started' | 'Trial Active' | 'Trial Expired' | 'Subscribed';
export type PaymentMethod = 'gcash' | 'bank' | 'qr';
export type PaymentStatus =
  | 'Pending Verification'
  | 'Approved'
  | 'Rejected'
  | 'Requires Additional Information'
  | 'Expired';

export interface StallTrialRecord {
  stallName: string;
  ownerId?: string;
  trialStatus: TrialStatus;
  startDate: string | null;
  endDate: string | null;
  durationDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: string;
  stallName: string;
  ownerId: string;
  plan: SubscriptionPlanType;
  status: SubscriptionStatus;
  startDate: string;
  expirationDate: string;
  nextDueDate: string;
  billingCycle: 'calendar_month' | 'weekly' | 'exact_30_days';
  lastPaymentId?: string;
  autoRenewReminder: boolean;
  isManuallyGranted?: boolean;
  manualGrantReason?: string;
  manualGrantExpiresAt?: string;
  isTrial?: boolean;
  trialStartDate?: string;
  trialEndDate?: string;
  trialStatus?: TrialStatus;
  isPaidSubscription?: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface SubscriptionStatusResponse {
  hasSubscription: boolean;
  status: SubscriptionStatus;
  trialStatus: TrialStatus;
  isTrial: boolean;
  isSubscribed: boolean;
  trialStartDate?: string | null;
  trialEndDate?: string | null;
  trialDaysRemaining?: number;
  serverTime: string;
  subscription?: UserSubscription;
  pendingPayment?: PaymentRecord | null;
  latestPayment?: PaymentRecord | null;
  stallSuspended?: boolean;
  stallStatus?: StallOperationalStatus;
  suspensionReason?: string;
  isExpired: boolean;
  daysRemaining: number;
  stallName?: string;
  freeTrialDays?: number;
  error?: string;
}

export interface PaymentHistoryNote {
  timestamp: string;
  actor: string;
  status: PaymentStatus;
  note: string;
}

export interface PaymentRecord {
  id: string;
  stallName: string;
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  ownerContact?: string;
  plan: SubscriptionPlanType;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  paymentDate: string;
  proofImageUrl: string;
  status: PaymentStatus;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  requestedInfoMessage?: string;
  resubmittedAt?: string;
  resubmissionNotes?: string;
  durationGrantedDays?: number;
  subscriptionExtendedTo?: string;
  notes?: string;
  history?: PaymentHistoryNote[];
}

export interface AdminPaymentSettings {
  freeTrialDays: number;
  trialEnabled: boolean;
  officialAppUrl?: string;
  requireStallApproval?: boolean;
  defaultStudentBudget?: number;
  welcomeBannerMessage?: string;
  gcash: {
    accountName: string;
    accountNumber: string;
    instructions: string;
    isEnabled: boolean;
  };
  bank: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    instructions: string;
    isEnabled: boolean;
  };
  qrCode: {
    imageUrl: string | null;
    instructions: string;
    isEnabled: boolean;
  };
  plans: {
    weekly: {
      price: number;
      durationDays: number;
      name: string;
      description: string;
      isEnabled: boolean;
    };
    monthly: {
      price: number;
      billingCycle: 'calendar_month' | 'exact_30_days';
      name: string;
      description: string;
      isEnabled: boolean;
    };
  };
  updatedAt: string;
  updatedBy: string;
}

export interface AppNotification {
  id: string;
  recipientType: 'stall' | 'admin' | 'customer' | 'all';
  recipientId: string;
  title: string;
  message: string;
  type:
    | 'reminder_7d'
    | 'reminder_3d'
    | 'reminder_1d'
    | 'due_today'
    | 'expired'
    | 'payment_pending'
    | 'payment_approved'
    | 'payment_rejected'
    | 'payment_info_requested'
    | 'access_granted'
    | 'access_revoked'
    | 'registration'
    | 'announcement'
    | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
  dedupKey?: string;
}

export interface AuditLogEntry {
  id: string;
  action:
    | 'approve_payment'
    | 'reject_payment'
    | 'request_payment_info'
    | 'grant_manual_access'
    | 'revoke_manual_access'
    | 'suspend_stall'
    | 'restore_stall'
    | 'activate_stall'
    | 'deactivate_stall'
    | 'approve_stall_registration'
    | 'reject_stall_registration'
    | 'update_user_status'
    | 'update_user_role'
    | 'update_settings'
    | 'update_plans';
  performedBy: string;
  targetType?: 'payment' | 'stall' | 'user' | 'settings';
  targetStall: string;
  targetUserId?: string;
  previousStatus?: string;
  newStatus?: string;
  remarks?: string;
  details: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface AdminSubscriptionSummary {
  totalSubscribers: number;
  activeSubscribers: number;
  activeTrials: number;
  weeklySubscribers: number;
  monthlySubscribers: number;
  expiredSubscribers: number;
  awaitingPaymentCount: number;
  renewalsCount: number;
  pendingPaymentsCount: number;
  requiresInfoPaymentsCount: number;
  approvedPaymentsCount: number;
  rejectedPaymentsCount: number;
  totalVerifiedRevenue: number;
}

export interface PlatformAnalyticsSeriesPoint {
  date: string;
  label: string;
  sessions: number;
  onlineSessions: number;
  offlineSessions: number;
  uniqueVisitors: number;
  logins: number;
  registrations: number;
  approvedPayments: number;
}

export interface FrequentStallStat {
  stallName: string;
  views: number;
  uniqueVisitors: number;
}

export interface MostViewedItemStat {
  dishId: number;
  dishName: string;
  stallName: string;
  views: number;
}

export interface PlatformAnalyticsData {
  range: 'today' | '7days' | '30days' | 'custom' | 'all';
  startDate?: string;
  endDate?: string;
  totals: {
    registeredUsers: number;
    customerUsers: number;
    stallOwners: number;
    adminUsers: number;
    registeredStalls: number;
    activeStalls: number;
    inactiveStalls: number;
    suspendedStalls: number;
    pendingStallApprovals: number;
    activeSubscriptions: number;
    activeTrials: number;
    expiredSubscriptions: number;
    subscriptionsAwaitingPayment: number;
    subscriptionRenewals: number;
    pendingPayments: number;
    approvedPayments: number;
    rejectedPayments: number;
    requiresInfoPayments: number;
    verifiedRevenue: number;
    appSessions: number;
    dailyOpens: number;
    weeklyOpens: number;
    monthlyOpens: number;
    onlineSessions: number;
    offlineSessions: number;
    uniqueVisitors: number;
    totalLogins: number;
    newUsersInRange: number;
    newStallsInRange: number;
    customerPortalVisits: number;
    merchantPortalVisits: number;
  };
  frequentStalls: FrequentStallStat[];
  mostViewedItems: MostViewedItemStat[];
  series: PlatformAnalyticsSeriesPoint[];
}

export type ZoneFilter = 'all' | 'outside' | 'inside';

export type FoodCategory =
  | 'Rice Meals'
  | 'Snacks'
  | 'Drinks'
  | 'Desserts'
  | 'Street Food'
  | 'Bread & Pastries'
  | 'Dumplings'
  | 'Fruits'
  | 'Other';

export type CategoryFilter = 'All' | FoodCategory;
export type CategoryTag = CategoryFilter;

export type SortOption = 'best-value' | 'cheapest' | 'priciest' | 'popular' | 'name';

export interface DishItem {
  id: number;
  name: string;
  items: string;
  price: number;
  rating: number;
  stall: string;
  zone: 'outside' | 'inside';
  category: FoodCategory;
  tags: string[];
  available: boolean;
  cal: string;
  clicks: number;
  imageUrl?: string;
  ownerUploadedImage?: string;
  representativeImage?: string;
  imageId?: string;
  storageId?: string;
  uploadTimestamp?: number;
  isOwnerImageProtected?: boolean;
  isRepresentative?: boolean;
  priceOptions?: number[];
  sizeOptions?: { label: string; price: number }[];
  flavorOptions?: string[];
  hidden?: boolean;
}

export interface AddonOption {
  name: string;
  price: number;
  icon: string;
}

export interface TrayItem {
  trayId: string;
  dishId: number;
  name: string;
  stall: string;
  basePrice: number;
  totalWithAddons: number;
  quantity: number;
  customAddons: { name: string; price: number }[];
  imageUrl?: string;
  selectedVariant?: string;
}

export interface StallCredential {
  name: string;
  zone: 'outside' | 'inside';
  stallNo?: string;
  officialName?: string;
  description?: string;
  contactInfo?: string;
  status?: StallOperationalStatus;
}

export interface TranslationDictionary {
  budgetPrompt: string;
  budgetSub: string;
  searchPlaceholder: string;
  surpriseBtn: string;
  allZone: string;
  outsideZone: string;
  insideZone: string;
  allPill: string;
  ricePill: string;
  drinksPill: string;
  snacksPill: string;
  fruitsPill: string;
  bakeryPill: string;
  campusLoc: string;
  liveOpen: string;
  combosFound: string;
  emptyMatch: string;
  changeLabel: string;
  exactChange: string;
  orderLocate: string;
  saveTray: string;
  trayHeading: string;
  trayEmpty: string;
  trayCost: string;
  clearTray: string;
  copyTray: string;
  rouletteTitle: string;
  rouletteSub: string;
  soldOutTag: string;
  availableTag: string;
  toastCopied: string;
  toastTrayAdded: string;
  merchantPortal: string;
  studentMode: string;
  logoutMerchant: string;
}

export interface StallOwnerAccount {
  id: string;
  stallName: string;
  stallNo: string;
  ownerName: string;
  username: string;
  email: string;
  contactInfo?: string;
  description?: string;
  createdAt: string;
  role?: UserRole;
  status?: UserAccountStatus;
}

export interface ViewsByDayItem {
  date: string;
  label: string;
  views: number;
  uniqueVisitors: number;
}

export interface PopularItemData {
  dishId: number;
  dishName: string;
  views: number;
}

export interface RecentActivityItem {
  id: string;
  type: 'stall_view' | 'item_view';
  description: string;
  timestamp: string;
  timeAgo: string;
}

export interface StallAnalyticsData {
  stallName: string;
  todayViews: number;
  uniqueVisitorsToday: number;
  thisWeekViews: number;
  thisMonthViews: number;
  totalViews: number;
  menuItemViewsCount: number;
  mostViewedItem: string | null;
  viewsByDay: ViewsByDayItem[];
  popularItems: PopularItemData[];
  recentActivity: RecentActivityItem[];
}

export interface ProtectedOwnerImageRecord {
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

export interface ArchivedDishRecord {
  archiveId: string;
  dish: DishItem;
  archivedAt: number;
  archivedBy: string;
  preservedImageId?: string;
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

export type SalesRecordType = 'daily_summary' | 'itemized';

export interface SalesItemEntry {
  id: string;
  dishId?: number;
  foodName: string;
  quantitySold: number;
  sellingPrice: number;
  totalSales: number;
  notes?: string;
}

export interface SalesRecord {
  id: string;
  stallName: string;
  recordType: SalesRecordType;
  date: string;
  totalSales: number;
  totalExpenses: number;
  estimatedProfit: number;
  notes?: string;
  items?: SalesItemEntry[];
  totalItemsSold?: number;
  createdAt: string;
  updatedAt: string;
}

export type SalesDateFilter = 'today' | 'this_week' | 'this_month' | 'custom' | 'all';

export interface SalesDashboardMetrics {
  todayTotalSales: number;
  todayExpenses: number;
  todayEstimatedProfit: number;
  todayItemsSold: number;
  todayBestSellingItem: {
    name: string;
    quantity: number;
    totalSales: number;
  } | null;
  filterTotalSales: number;
  filterExpenses: number;
  filterEstimatedProfit: number;
  filterItemsSold: number;
  filterBestSellingItem: {
    name: string;
    quantity: number;
    totalSales: number;
  } | null;
  slowSellingItems: {
    name: string;
    quantity: number;
    totalSales: number;
    reason: string;
  }[];
  insufficientDataForSlowSelling: boolean;
}
