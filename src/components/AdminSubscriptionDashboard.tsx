import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  CreditCard,
  TrendingUp,
  Search,
  Upload,
  QrCode,
  RefreshCw,
  FileText,
  History,
  Settings,
  Eye,
  LogOut,
  Megaphone,
  Store,
  Lock,
  Unlock,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
  X,
  Check,
  Calendar,
  Wifi,
  WifiOff,
  Award,
  Flame,
  Globe,
  EyeOff
} from 'lucide-react';
import {
  UserSubscription,
  PaymentRecord,
  AdminPaymentSettings,
  AdminSubscriptionSummary,
  AuditLogEntry,
  AppPage,
  AuthUser,
  PlatformAnalyticsData,
  StallRecord,
  DishItem,
  SubscriptionStatusResponse
} from '../types';
import {
  fetchAdminBootstrapStatusAPI,
  bootstrapAdminAPI,
  adminLoginAPI,
  fetchAdminSummaryAPI,
  fetchAdminAnalyticsAPI,
  adminVerifyPaymentAPI,
  adminManualAccessAPI,
  fetchAdminStallsAPI,
  fetchAdminStallDetailsAPI,
  adminUpdateStallStatusAPI,
  fetchAdminUsersAPI,
  adminUpdateUserStatusAPI,
  adminUpdateSettingsAPI,
  adminUploadQRCodeAPI,
  adminBroadcastAnnouncementAPI,
  fetchAdminAuditLogsAPI
} from '../services/api';
import { compressImageFile } from '../utils/imageCompressor';
import { ProtectedReceiptImage } from './ProtectedReceiptImage';
import { CampusQRModal } from './CampusQRModal';

interface AdminSubscriptionDashboardProps {
  onLogout: () => void;
  onNavigate: (page: AppPage) => void;
  adminUser?: AuthUser | null;
  onLoginSuccess?: (admin: AuthUser) => void;
}

type AdminTab = 'overview' | 'payments' | 'stalls' | 'users' | 'settings' | 'audit';

export const AdminSubscriptionDashboard: React.FC<AdminSubscriptionDashboardProps> = ({
  onLogout,
  onNavigate,
  adminUser,
  onLoginSuccess
}) => {
  const [currentAdmin, setCurrentAdmin] = useState<AuthUser | null>(adminUser || null);
  const [bootstrapChecked, setBootstrapChecked] = useState(false);
  const [isInitialized, setIsInitialized] = useState(true);
  const [envPasscodeConfigured, setEnvPasscodeConfigured] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'setup' | 'signin'>('signin');

  // Login Form State (Zero hardcoded defaults)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // First-run Bootstrap Form State
  const [bootName, setBootName] = useState('');
  const [bootUsername, setBootUsername] = useState('');
  const [bootEmail, setBootEmail] = useState('');
  const [bootPassword, setBootPassword] = useState('');
  const [bootConfirmPassword, setBootConfirmPassword] = useState('');
  const [bootPasscode, setBootPasscode] = useState('');
  const [showBootPassword, setShowBootPassword] = useState(false);
  const [showBootPasscode, setShowBootPasscode] = useState(false);

  useEffect(() => {
    setCurrentAdmin(adminUser || null);
  }, [adminUser]);

  const refreshBootstrapStatus = async () => {
    setBootstrapChecked(false);
    setStatusError(null);
    const status = await fetchAdminBootstrapStatusAPI();
    if (status.success) {
      setIsInitialized(status.initialized);
      setEnvPasscodeConfigured(status.envPasscodeConfigured);
      setAuthMode(status.initialized ? 'signin' : 'setup');
      setStatusError(null);
    } else {
      setIsInitialized(true);
      setAuthMode('signin');
      setStatusError(status.error || 'Unable to verify Super Administrator setup status.');
    }
    setBootstrapChecked(true);
  };

  useEffect(() => {
    if (currentAdmin) return;
    let active = true;
    fetchAdminBootstrapStatusAPI().then((status) => {
      if (!active) return;
      if (status.success) {
        setIsInitialized(status.initialized);
        setEnvPasscodeConfigured(status.envPasscodeConfigured);
        setAuthMode(status.initialized ? 'signin' : 'setup');
        setStatusError(null);
      } else {
        setIsInitialized(true);
        setAuthMode('signin');
        setStatusError(status.error || 'Unable to verify Super Administrator setup status.');
      }
      setBootstrapChecked(true);
    });
    return () => {
      active = false;
    };
  }, [currentAdmin]);

  // Dashboard State
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [analyticsRange, setAnalyticsRange] = useState<'today' | '7days' | '30days' | 'custom' | 'all'>('7days');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [analytics, setAnalytics] = useState<PlatformAnalyticsData | null>(null);
  const [summary, setSummary] = useState<AdminSubscriptionSummary | null>(null);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [adminStalls, setAdminStalls] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<AuthUser[]>([]);
  const [settings, setSettings] = useState<AdminPaymentSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isCampusQrModalOpen, setIsCampusQrModalOpen] = useState(false);

  // Announcement Broadcaster
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annAudience, setAnnAudience] = useState<'all' | 'customers' | 'stalls'>('all');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Payment Verification Filters & Modals
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('All');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [inspectPayment, setInspectPayment] = useState<PaymentRecord | null>(null);
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<'none' | 'reject' | 'request_info'>('none');
  const [actionText, setActionText] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Stall Management Filters & Modals
  const [stallFilter, setStallFilter] = useState<string>('all');
  const [stallSearch, setStallSearch] = useState('');
  const [stallDetailsModal, setStallDetailsModal] = useState<{
    stall: StallRecord;
    subscription?: SubscriptionStatusResponse;
    items: DishItem[];
    payments: PaymentRecord[];
  } | null>(null);
  const [suspendTargetStall, setSuspendTargetStall] = useState<string | null>(null);
  const [suspendReasonInput, setSuspendReasonInput] = useState('');
  const [manualAccessModal, setManualAccessModal] = useState<{
    stallName: string;
    action: 'grant' | 'renew' | 'revoke';
  } | null>(null);
  const [manualDays, setManualDays] = useState(30);
  const [manualReason, setManualReason] = useState('');

  // User Management Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  // Centralized Platform & Settings Form State
  const [editOfficialAppUrl, setEditOfficialAppUrl] = useState(
    'https://ais-pre-oruy4f4mj757x5vir5si2a-165677608534.asia-east1.run.app'
  );
  const [editRequireStallApproval, setEditRequireStallApproval] = useState(false);
  const [editDefaultStudentBudget, setEditDefaultStudentBudget] = useState(55);
  const [editWelcomeBannerMessage, setEditWelcomeBannerMessage] = useState('');
  const [editFreeTrialDays, setEditFreeTrialDays] = useState(14);
  const [editTrialEnabled, setEditTrialEnabled] = useState(true);
  const [editGcashName, setEditGcashName] = useState('');
  const [editGcashNumber, setEditGcashNumber] = useState('');
  const [editGcashInstructions, setEditGcashInstructions] = useState('');
  const [editGcashEnabled, setEditGcashEnabled] = useState(true);
  const [editBankName, setEditBankName] = useState('');
  const [editBankHolder, setEditBankHolder] = useState('');
  const [editBankNumber, setEditBankNumber] = useState('');
  const [editBankInstructions, setEditBankInstructions] = useState('');
  const [editBankEnabled, setEditBankEnabled] = useState(true);
  const [editQrInstructions, setEditQrInstructions] = useState('');
  const [editQrEnabled, setEditQrEnabled] = useState(true);
  const [editWeeklyPrice, setEditWeeklyPrice] = useState(25);
  const [editWeeklyDays, setEditWeeklyDays] = useState(7);
  const [editWeeklyDesc, setEditWeeklyDesc] = useState('');
  const [editWeeklyEnabled, setEditWeeklyEnabled] = useState(true);
  const [editMonthlyPrice, setEditMonthlyPrice] = useState(100);
  const [editBillingCycle, setEditBillingCycle] = useState<'calendar_month' | 'exact_30_days'>('calendar_month');
  const [editMonthlyDesc, setEditMonthlyDesc] = useState('');
  const [editMonthlyEnabled, setEditMonthlyEnabled] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Audit Log Filter
  const [auditSearch, setAuditSearch] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadAllAdminData = async (
    rangeOverride?: 'today' | '7days' | '30days' | 'custom' | 'all',
    startOverride?: string,
    endOverride?: string
  ) => {
    if (!currentAdmin) return;
    setIsLoading(true);
    try {
      const rangeToUse = rangeOverride || analyticsRange;
      const startToUse = startOverride || customStartDate;
      const endToUse = endOverride || customEndDate;
      const [sumRes, analyticsRes, stallsRes, usersRes, logsRes] = await Promise.all([
        fetchAdminSummaryAPI(),
        fetchAdminAnalyticsAPI(
          rangeToUse,
          rangeToUse === 'custom' ? startToUse : undefined,
          rangeToUse === 'custom' ? endToUse : undefined
        ),
        fetchAdminStallsAPI(),
        fetchAdminUsersAPI(),
        fetchAdminAuditLogsAPI()
      ]);

      if (sumRes.success) {
        setSummary(sumRes.summary || null);
        setSubscriptions(sumRes.subscriptions || []);
        setPayments(sumRes.payments || []);
        if (sumRes.settings) {
          const s = sumRes.settings;
          setSettings(s);
          setEditOfficialAppUrl(
            s.officialAppUrl || 'https://ais-pre-oruy4f4mj757x5vir5si2a-165677608534.asia-east1.run.app'
          );
          setEditRequireStallApproval(Boolean(s.requireStallApproval));
          setEditDefaultStudentBudget(s.defaultStudentBudget ?? 55);
          setEditWelcomeBannerMessage(s.welcomeBannerMessage || '');
          setEditFreeTrialDays(s.freeTrialDays ?? 14);
          setEditTrialEnabled(s.trialEnabled !== false);
          setEditGcashName(s.gcash.accountName);
          setEditGcashNumber(s.gcash.accountNumber);
          setEditGcashInstructions(s.gcash.instructions);
          setEditGcashEnabled(s.gcash.isEnabled !== false);
          setEditBankName(s.bank.bankName);
          setEditBankHolder(s.bank.accountHolder);
          setEditBankNumber(s.bank.accountNumber);
          setEditBankInstructions(s.bank.instructions);
          setEditBankEnabled(s.bank.isEnabled !== false);
          setEditQrInstructions(s.qrCode.instructions);
          setEditQrEnabled(s.qrCode.isEnabled !== false);
          setEditWeeklyPrice(s.plans.weekly.price);
          setEditWeeklyDays(s.plans.weekly.durationDays);
          setEditWeeklyDesc(s.plans.weekly.description);
          setEditWeeklyEnabled(s.plans.weekly.isEnabled !== false);
          setEditMonthlyPrice(s.plans.monthly.price);
          setEditBillingCycle(s.plans.monthly.billingCycle);
          setEditMonthlyDesc(s.plans.monthly.description);
          setEditMonthlyEnabled(s.plans.monthly.isEnabled !== false);
        }
      }

      if (analyticsRes.success && analyticsRes.analytics) {
        setAnalytics(analyticsRes.analytics);
      }
      if (stallsRes.success && stallsRes.stalls) {
        setAdminStalls(stallsRes.stalls);
      }
      if (usersRes.success && usersRes.users) {
        setAdminUsers(usersRes.users);
      }
      if (logsRes.success && logsRes.logs) {
        setAuditLogs(logsRes.logs);
      }
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentAdmin) {
      loadAllAdminData();
    }
  }, [currentAdmin]);

  const handleRangeChange = (nextRange: 'today' | '7days' | '30days' | 'custom' | 'all') => {
    setAnalyticsRange(nextRange);
    fetchAdminAnalyticsAPI(
      nextRange,
      nextRange === 'custom' ? customStartDate : undefined,
      nextRange === 'custom' ? customEndDate : undefined
    ).then((res) => {
      if (res.success && res.analytics) {
        setAnalytics(res.analytics);
      }
    });
  };

  // Bootstrap Submit
  const handleBootstrapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (bootPassword !== bootConfirmPassword) {
      setLoginError('Passwords do not match.');
      return;
    }
    if (bootPassword.length < 8) {
      setLoginError('Administrator password must be at least 8 characters long.');
      return;
    }

    setIsAuthenticating(true);
    const res = await bootstrapAdminAPI({
      name: bootName.trim(),
      username: bootUsername.trim(),
      email: bootEmail.trim(),
      password: bootPassword,
      passcode: envPasscodeConfigured ? bootPasscode : undefined
    });
    setIsAuthenticating(false);

    if (res.success && res.admin) {
      setBootPassword('');
      setBootConfirmPassword('');
      setBootPasscode('');
      setIsInitialized(true);
      setAuthMode('signin');
      setCurrentAdmin(res.admin);
      if (onLoginSuccess) onLoginSuccess(res.admin);
    } else {
      if (res.alreadyInitialized) {
        setIsInitialized(true);
        setAuthMode('signin');
      }
      setLoginError(res.error || 'Failed to initialize administrator account.');
    }
  };

  // Admin Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError('Please enter your administrator username or email and password.');
      return;
    }

    setIsAuthenticating(true);
    const res = await adminLoginAPI({
      identifier: loginIdentifier.trim(),
      password: loginPassword
    });
    setIsAuthenticating(false);

    if (res.success && res.admin) {
      setLoginPassword('');
      setCurrentAdmin(res.admin);
      if (onLoginSuccess) onLoginSuccess(res.admin);
    } else {
      setLoginError(res.error || 'Invalid administrator credentials.');
    }
  };

  // Payment Verification Actions
  const handleVerifyAction = async (
    paymentId: string,
    action: 'approve' | 'reject' | 'request_info'
  ) => {
    if (action === 'reject' && !actionText.trim()) {
      showToast('Please enter a clear rejection reason.');
      return;
    }
    if (action === 'request_info' && !actionText.trim()) {
      showToast('Please specify the additional information requested from the stall owner.');
      return;
    }

    setIsProcessingAction(true);
    const res = await adminVerifyPaymentAPI(paymentId, action, {
      rejectionReason: action === 'reject' ? actionText.trim() : undefined,
      requestedInfoMessage: action === 'request_info' ? actionText.trim() : undefined
    });
    setIsProcessingAction(false);

    if (res.success) {
      showToast(res.message || 'Payment verification updated.');
      setInspectPayment(null);
      setConfirmApproveId(null);
      setActionMode('none');
      setActionText('');
      await loadAllAdminData();
    } else {
      showToast(res.error || 'Failed to process verification action.');
    }
  };

  // Announcement Broadcaster
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;
    setIsBroadcasting(true);
    const res = await adminBroadcastAnnouncementAPI({
      title: annTitle.trim(),
      message: annMessage.trim(),
      audience: annAudience
    });
    setIsBroadcasting(false);
    if (res.success) {
      showToast('Platform announcement broadcasted!');
      setAnnTitle('');
      setAnnMessage('');
    } else {
      showToast(res.error || 'Failed to broadcast announcement.');
    }
  };

  // Stall Actions
  const handleStallStatusAction = async (
    stallName: string,
    action: 'activate' | 'deactivate' | 'suspend' | 'restore' | 'approve_registration' | 'reject_registration',
    reason?: string
  ) => {
    setIsProcessingAction(true);
    const res = await adminUpdateStallStatusAPI(stallName, action, reason);
    setIsProcessingAction(false);
    if (res.success) {
      showToast(`Updated stall status for ${stallName}.`);
      setSuspendTargetStall(null);
      setSuspendReasonInput('');
      await loadAllAdminData();
    } else {
      showToast(res.error || 'Failed to update stall status.');
    }
  };

  const handleOpenStallDetails = async (stallName: string) => {
    const res = await fetchAdminStallDetailsAPI(stallName);
    if (res.success && res.stall) {
      setStallDetailsModal({
        stall: res.stall,
        subscription: res.subscription,
        items: res.items || [],
        payments: res.payments || []
      });
    } else {
      showToast(res.error || 'Failed to fetch stall details.');
    }
  };

  const handleManualAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAccessModal) return;
    setIsProcessingAction(true);
    const res = await adminManualAccessAPI({
      stallName: manualAccessModal.stallName,
      action: manualAccessModal.action,
      durationDays: manualAccessModal.action === 'revoke' ? undefined : manualDays,
      reason: manualReason.trim() || undefined
    });
    setIsProcessingAction(false);
    if (res.success) {
      showToast(res.message || 'Subscription access updated.');
      setManualAccessModal(null);
      setManualReason('');
      await loadAllAdminData();
    } else {
      showToast(res.error || 'Failed to update subscription access.');
    }
  };

  // User Actions
  const handleToggleUserStatus = async (user: AuthUser) => {
    const nextStatus = user.status === 'active' ? 'deactivated' : 'active';
    const res = await adminUpdateUserStatusAPI(user.id, nextStatus);
    if (res.success) {
      showToast(`User ${user.username} is now ${nextStatus}.`);
      await loadAllAdminData();
    } else {
      showToast(res.error || 'Failed to update user status.');
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    const clampedDefaultBudget = Math.min(500, Math.max(10, Number(editDefaultStudentBudget) || 55));
    const res = await adminUpdateSettingsAPI({
      officialAppUrl: editOfficialAppUrl.trim() || 'https://ais-pre-oruy4f4mj757x5vir5si2a-165677608534.asia-east1.run.app',
      requireStallApproval: editRequireStallApproval,
      defaultStudentBudget: clampedDefaultBudget,
      welcomeBannerMessage: editWelcomeBannerMessage.trim(),
      freeTrialDays: Math.max(1, Number(editFreeTrialDays) || 14),
      trialEnabled: editTrialEnabled,
      gcash: {
        accountName: editGcashName,
        accountNumber: editGcashNumber,
        instructions: editGcashInstructions,
        isEnabled: editGcashEnabled
      },
      bank: {
        bankName: editBankName,
        accountHolder: editBankHolder,
        accountNumber: editBankNumber,
        instructions: editBankInstructions,
        isEnabled: editBankEnabled
      },
      qrCode: {
        imageUrl: settings?.qrCode.imageUrl || null,
        instructions: editQrInstructions,
        isEnabled: editQrEnabled
      },
      plans: {
        weekly: {
          price: Math.max(1, Number(editWeeklyPrice) || 25),
          durationDays: Math.max(1, Number(editWeeklyDays) || 7),
          name: settings?.plans.weekly.name || 'Weekly Plan',
          description: editWeeklyDesc,
          isEnabled: editWeeklyEnabled
        },
        monthly: {
          price: Math.max(1, Number(editMonthlyPrice) || 100),
          billingCycle: editBillingCycle,
          name: settings?.plans.monthly.name || 'Monthly Plan',
          description: editMonthlyDesc,
          isEnabled: editMonthlyEnabled
        }
      }
    });
    setIsSavingSettings(false);
    if (res.success) {
      showToast('Centralized platform & subscription settings saved.');
      await loadAllAdminData();
    } else {
      showToast(res.error || 'Failed to save settings.');
    }
  };

  const handleQrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      const res = await adminUploadQRCodeAPI(compressed.dataUrl);
      if (res.success) {
        showToast('Official QR code uploaded!');
        await loadAllAdminData();
      } else {
        showToast(res.error || 'QR upload failed.');
      }
    } catch {
      showToast('Failed to read QR image file.');
    }
  };

  // Filtered Lists
  const filteredPayments = useMemo(() => {
    const q = paymentSearch.toLowerCase().trim();
    return payments.filter((p) => {
      if (paymentStatusFilter !== 'All' && p.status !== paymentStatusFilter) return false;
      if (q) {
        return (
          p.stallName.toLowerCase().includes(q) ||
          p.ownerName.toLowerCase().includes(q) ||
          p.referenceNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, paymentStatusFilter, paymentSearch]);

  const filteredStalls = useMemo(() => {
    const q = stallSearch.toLowerCase().trim();
    return adminStalls.filter((s) => {
      if (stallFilter === 'pending_registration' && s.registrationStatus !== 'pending') return false;
      if (stallFilter === 'active' && s.status !== 'active') return false;
      if (stallFilter === 'inactive' && s.status !== 'inactive') return false;
      if (stallFilter === 'suspended' && s.status !== 'suspended') return false;
      if (q) {
        return (
          String(s.name || '').toLowerCase().includes(q) ||
          String(s.ownerName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [adminStalls, stallFilter, stallSearch]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    return adminUsers.filter((u) => {
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
      if (q) {
        return (
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [adminUsers, userRoleFilter, userSearch]);

  const filteredLogs = useMemo(() => {
    const q = auditSearch.toLowerCase().trim();
    return auditLogs.filter((log) => {
      if (!q) return true;
      return (
        log.action.toLowerCase().includes(q) ||
        log.targetStall.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.performedBy.toLowerCase().includes(q)
      );
    });
  }, [auditLogs, auditSearch]);

  // =========================================================================
  // GATE 1: ONE-TIME INITIAL SUPER ADMIN SETUP OR SUPER ADMIN SIGN IN
  // =========================================================================
  if (!currentAdmin) {
    if (!bootstrapChecked) {
      return (
        <div className="max-w-md mx-auto py-16 text-center text-xs text-stone-500">
          Checking Super Administrator setup status...
        </div>
      );
    }

    if (!isInitialized && authMode === 'setup') {
      return (
        <div className="max-w-md mx-auto py-8 sm:py-12 px-4">
          <form
            onSubmit={handleBootstrapSubmit}
            className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-4 text-xs"
          >
            <div className="text-center space-y-2 pb-3 border-b border-stone-100">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-black text-[10px] uppercase tracking-wider">
                <Lock className="w-3 h-3" />
                One-Time Initial Setup
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-black text-stone-900 font-display">
                Super Admin Account Setup
              </h1>
              <p className="text-xs text-stone-600">
                No Super Administrator exists yet. Create the sole centralized Super Administrator account for Our Sud-an. Once created, admin registration permanently locks.
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block font-black text-stone-800 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={bootName}
                onChange={(e) => setBootName(e.target.value)}
                placeholder="Authorized app owner full name"
                className="w-full min-h-[44px] px-3 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-black text-stone-800 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={bootUsername}
                  onChange={(e) => setBootUsername(e.target.value)}
                  placeholder="superadmin"
                  className="w-full min-h-[44px] px-3 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-black text-stone-800 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={bootEmail}
                  onChange={(e) => setBootEmail(e.target.value)}
                  placeholder="owner@oursudan.ph"
                  className="w-full min-h-[44px] px-3 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-black text-stone-800 mb-1">
                Password (min 8 chars) *
              </label>
              <div className="relative">
                <input
                  type={showBootPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={bootPassword}
                  onChange={(e) => setBootPassword(e.target.value)}
                  placeholder="Strong password"
                  className="w-full min-h-[44px] pl-3 pr-10 bg-stone-50 border border-stone-200 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowBootPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-700"
                  aria-label={showBootPassword ? 'Hide password' : 'Show password'}
                >
                  {showBootPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-black text-stone-800 mb-1">Confirm Password *</label>
              <input
                type={showBootPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={bootConfirmPassword}
                onChange={(e) => setBootConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full min-h-[44px] px-3 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            {envPasscodeConfigured && (
              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
                <label className="block font-black text-purple-950">
                  Authorized Setup Passcode (Server Secret) *
                </label>
                <div className="relative">
                  <input
                    type={showBootPasscode ? 'text' : 'password'}
                    required
                    value={bootPasscode}
                    onChange={(e) => setBootPasscode(e.target.value)}
                    placeholder="Enter ADMIN_PASSCODE secret"
                    className="w-full min-h-[44px] pl-3 pr-10 bg-white border border-purple-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBootPasscode((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-700"
                    aria-label={showBootPasscode ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showBootPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-purple-900/80 leading-relaxed">
                  Protected by the server-side <code className="font-mono font-bold">ADMIN_PASSCODE</code> configuration so only the authorized app owner can claim initial Super Admin access.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full min-h-[46px] bg-purple-700 hover:bg-purple-800 text-white font-black text-sm rounded-xl transition disabled:opacity-50"
            >
              {isAuthenticating ? 'Creating Super Administrator...' : 'Create Super Administrator & Lock Setup'}
            </button>

            <div className="flex flex-col gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setLoginError(null);
                  setAuthMode('signin');
                }}
                className="w-full text-center text-xs font-bold text-purple-700 hover:underline"
              >
                Already initialized? Go to Super Admin Sign In →
              </button>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="w-full text-center text-xs font-bold text-stone-500 hover:text-stone-900"
              >
                ← Return to Customer Portal
              </button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto py-8 sm:py-12 px-4">
        <form
          onSubmit={handleLoginSubmit}
          className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-4 text-xs"
        >
          <div className="text-center space-y-2 pb-2 border-b border-stone-100">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-stone-900 font-display">
              Super Administrator Sign In
            </h1>
            <p className="text-xs text-stone-600">
              Restricted to the sole primary platform Super Administrator.
            </p>
          </div>

          {statusError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-start gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <span>{statusError}</span>
              </div>
              <button
                type="button"
                onClick={refreshBootstrapStatus}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-black text-[11px]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Status Check
              </button>
            </div>
          )}

          {!statusError && !isInitialized && (
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
              <p className="font-black text-purple-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                One-Time Super Admin Account Setup Available
              </p>
              <p className="text-[11px] text-purple-900">
                No Super Administrator has been registered yet. Complete one-time initial setup to claim the Super Admin account.
              </p>
              <button
                type="button"
                onClick={() => {
                  setLoginError(null);
                  setAuthMode('setup');
                }}
                className="w-full min-h-[40px] rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs transition"
              >
                Open One-Time Super Admin Setup
              </button>
            </div>
          )}

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <div>
            <label className="block font-black text-stone-800 mb-1">
              Admin Username or Email *
            </label>
            <input
              type="text"
              required
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              placeholder="Enter admin username or email"
              className="w-full min-h-[44px] px-3 bg-stone-50 border border-stone-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-black text-stone-800 mb-1">Password *</label>
            <div className="relative">
              <input
                type={showLoginPassword ? 'text' : 'password'}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter administrator password"
                className="w-full min-h-[44px] pl-3 pr-10 bg-stone-50 border border-stone-200 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-700"
                aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
              >
                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full min-h-[46px] bg-stone-900 hover:bg-stone-800 text-white font-black text-sm rounded-xl transition disabled:opacity-50"
          >
            {isAuthenticating ? 'Verifying...' : 'Sign In to Admin Portal'}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="w-full text-center text-xs font-bold text-stone-500 hover:text-stone-900 pt-1"
          >
            ← Return to Customer Portal
          </button>
        </form>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  const maxSeriesCount = Math.max(
    ...(analytics?.series.map((p) => Math.max(p.sessions, p.logins, p.uniqueVisitors)) || [1]),
    1
  );

  return (
    <div className="max-w-7xl mx-auto py-4 space-y-6 animate-fade-in pb-16">
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-purple-500/40 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Admin Header */}
      <div className="bg-stone-900 rounded-3xl p-5 sm:p-7 text-white border border-stone-800 space-y-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Centralized Super Administrator</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display">
              Our Sud-an Control Center
            </h1>
            <p className="text-xs text-stone-400">
              Primary Super Admin: <strong className="text-white">{currentAdmin.name}</strong> ({currentAdmin.email}) • Single-Admin Protected
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setIsCampusQrModalOpen(true)}
              className="min-h-[40px] px-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-black flex items-center gap-1.5 transition"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Campus QR</span>
            </button>
            <button
              type="button"
              onClick={() => loadAllAdminData()}
              disabled={isLoading}
              className="min-h-[40px] px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[40px] px-3.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-xs font-black flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* 6 Portal Tabs */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10 text-xs">
          {(
            [
              { id: 'overview', label: 'Overview & Analytics', icon: <TrendingUp className="w-3.5 h-3.5" /> },
              {
                id: 'payments',
                label: 'Payment Verification',
                icon: <CreditCard className="w-3.5 h-3.5" />,
                badge: summary?.pendingPaymentsCount || 0
              },
              {
                id: 'stalls',
                label: 'Stall Management',
                icon: <Store className="w-3.5 h-3.5" />,
                badge: analytics?.totals.pendingStallApprovals || 0
              },
              { id: 'users', label: 'Stall Owners & Admin', icon: <Users className="w-3.5 h-3.5" /> },
              { id: 'settings', label: 'Platform & Payment Settings', icon: <Settings className="w-3.5 h-3.5" /> },
              { id: 'audit', label: 'Audit Logs', icon: <History className="w-3.5 h-3.5" /> }
            ] as { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[40px] px-3.5 rounded-xl font-black transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white'
                  : 'bg-white/10 text-stone-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black tabular-nums">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: OVERVIEW & ANALYTICS                                           */}
      {/* ===================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-stone-900 font-display">
                Real-Time Database Analytics & Engagement
              </h2>
              <p className="text-xs text-stone-500">
                100% live records from server database files — empty states appear cleanly until activity occurs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 text-xs font-bold">
                {(
                  [
                    { id: 'today', label: 'Today' },
                    { id: '7days', label: '7 Days' },
                    { id: '30days', label: '30 Days' },
                    { id: 'all', label: 'All Time' },
                    { id: 'custom', label: 'Custom Range' }
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRangeChange(r.id)}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      analyticsRange === r.id
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {analyticsRange === 'custom' && (
                <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-xl border border-stone-200 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-stone-400 ml-1" />
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    aria-label="Analytics start date"
                    className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg font-mono text-[11px]"
                  />
                  <span className="text-stone-400 font-bold">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    aria-label="Analytics end date"
                    className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRangeChange('custom')}
                    className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Primary KPI Grid (8 real metric cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 tabular-nums">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1">
              <span className="text-[10px] font-black uppercase text-stone-400 block">
                App Opens (Daily / Wk / Mo)
              </span>
              <span className="text-2xl font-black text-stone-900 font-display block">
                {analytics?.totals.appSessions ?? 0}
              </span>
              <span className="text-[11px] text-stone-600 block">
                {analytics?.totals.dailyOpens ?? 0} today • {analytics?.totals.weeklyOpens ?? 0} wk •{' '}
                {analytics?.totals.monthlyOpens ?? 0} mo
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1">
              <span className="text-[10px] font-black uppercase text-stone-400 block">
                Unique Visitors & Mode
              </span>
              <span className="text-2xl font-black text-stone-900 font-display block">
                {analytics?.totals.uniqueVisitors ?? 0}
              </span>
              <span className="text-[11px] text-stone-600 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                  <Wifi className="w-3 h-3" /> {analytics?.totals.onlineSessions ?? 0} online
                </span>
                <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                  <WifiOff className="w-3 h-3" /> {analytics?.totals.offlineSessions ?? 0} offline
                </span>
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1">
              <span className="text-[10px] font-black uppercase text-stone-400 block">
                Stall Owners & Registrations
              </span>
              <span className="text-2xl font-black text-stone-900 font-display block">
                {analytics?.totals.stallOwners ?? 0}
              </span>
              <span className="text-[11px] text-stone-600 block">
                +{analytics?.totals.newStallsInRange ?? 0} new stalls • {analytics?.totals.totalLogins ?? 0} logins
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1">
              <span className="text-[10px] font-black uppercase text-stone-400 block">
                Registered Stalls
              </span>
              <span className="text-2xl font-black text-stone-900 font-display block">
                {analytics?.totals.registeredStalls ?? adminStalls.length}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold block">
                {analytics?.totals.activeStalls ?? 0} active • {analytics?.totals.inactiveStalls ?? 0} inactive •{' '}
                {analytics?.totals.suspendedStalls ?? 0} susp
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1">
              <span className="text-[10px] font-black uppercase text-stone-400 block">
                Subscriptions & Trials
              </span>
              <span className="text-2xl font-black text-indigo-700 font-display block">
                {(summary?.activeSubscribers ?? 0) + (summary?.activeTrials ?? 0)}
              </span>
              <span className="text-[11px] text-stone-600 block">
                {summary?.activeSubscribers ?? 0} active paid • {summary?.activeTrials ?? 0} trials •{' '}
                {summary?.expiredSubscribers ?? 0} expired
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1">
              <span className="text-[10px] font-black uppercase text-stone-400 block">
                Awaiting Payment & Renewals
              </span>
              <span className="text-2xl font-black text-amber-600 font-display block">
                {summary?.awaitingPaymentCount ?? analytics?.totals.subscriptionsAwaitingPayment ?? 0}
              </span>
              <span className="text-[11px] text-stone-600 block">
                {summary?.renewalsCount ?? analytics?.totals.subscriptionRenewals ?? 0} renewals •{' '}
                {analytics?.totals.pendingStallApprovals ?? 0} pending stalls
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1">
              <span className="text-[10px] font-black uppercase text-stone-400 block">
                Payment Verifications
              </span>
              <span className="text-2xl font-black text-stone-900 font-display block">
                {summary?.pendingPaymentsCount ?? 0} pending
              </span>
              <span className="text-[11px] text-stone-600 block">
                {summary?.approvedPaymentsCount ?? 0} approved • {summary?.rejectedPaymentsCount ?? 0} rej •{' '}
                {summary?.requiresInfoPaymentsCount ?? 0} info
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-1">
              <span className="text-[10px] font-black uppercase text-stone-400 block">
                Verified Subscription Revenue
              </span>
              <span className="text-2xl font-black text-emerald-700 font-display block">
                ₱{(summary?.totalVerifiedRevenue ?? 0).toLocaleString('en-PH')}
              </span>
              <span className="text-[11px] text-stone-500 block">
                From {summary?.approvedPaymentsCount ?? 0} verified payments
              </span>
            </div>
          </div>

          {/* Pending Payment Alert Bar */}
          {(summary?.pendingPaymentsCount || 0) > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-amber-950">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  <strong>{summary?.pendingPaymentsCount} payment receipt(s)</strong> are awaiting administrator verification.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPaymentStatusFilter('Pending Verification');
                  setActiveTab('payments');
                }}
                className="min-h-[40px] px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition self-start sm:self-center"
              >
                Review Pending Payments →
              </button>
            </div>
          )}

          {/* Trend Visualization + Broadcast Announcement */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-stone-200 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-stone-900 font-display">
                    Platform Activity Trend (Online vs Offline)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Recorded app opens, unique visitors, offline synced events, and stall logins
                  </p>
                </div>
              </div>

              {!analytics || analytics.series.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400">
                  No recorded session or transaction activity in this date range yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2 tabular-nums">
                  {analytics.series.slice(-7).map((pt) => {
                    const sessH = Math.max(8, Math.round((pt.sessions / maxSeriesCount) * 100));
                    const visH = Math.max(8, Math.round((pt.uniqueVisitors / maxSeriesCount) * 100));
                    return (
                      <div
                        key={pt.date}
                        className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between gap-2 text-center"
                      >
                        <span className="text-[11px] font-black text-stone-800">{pt.label}</span>
                        <div className="h-20 flex items-end justify-center gap-1.5 bg-white rounded-lg p-1.5 border border-stone-100">
                          <div
                            className="w-2.5 rounded-t bg-orange-500"
                            style={{ height: `${sessH}%` }}
                            title={`Sessions: ${pt.sessions} (${pt.onlineSessions} online / ${pt.offlineSessions} offline)`}
                          />
                          <div
                            className="w-2.5 rounded-t bg-indigo-500"
                            style={{ height: `${visH}%` }}
                            title={`Unique Visitors: ${pt.uniqueVisitors}`}
                          />
                        </div>
                        <div className="text-[10px] text-stone-600 font-semibold leading-tight">
                          <div>{pt.sessions} opens</div>
                          <div className="text-[9px] text-stone-400">
                            {pt.onlineSessions} on / {pt.offlineSessions} off
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Announcement Broadcaster */}
            <form
              onSubmit={handleBroadcastAnnouncement}
              className="bg-white p-5 rounded-3xl border border-stone-200 space-y-3 text-xs"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                <Megaphone className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-black text-stone-900 font-display">
                  Broadcast Campus Announcement
                </h3>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Cafeteria Holiday Schedule"
                  className="w-full min-h-[40px] px-3 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Audience</label>
                <select
                  value={annAudience}
                  onChange={(e) => setAnnAudience(e.target.value as 'all' | 'customers' | 'stalls')}
                  className="w-full min-h-[40px] px-3 bg-stone-50 border border-stone-200 rounded-xl font-bold"
                >
                  <option value="all">All Users (Students & Stalls)</option>
                  <option value="customers">Students Only</option>
                  <option value="stalls">Stall Owners Only</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Message *</label>
                <textarea
                  required
                  rows={3}
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  placeholder="Announcement details..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={isBroadcasting}
                className="w-full min-h-[42px] bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl transition disabled:opacity-50"
              >
                {isBroadcasting ? 'Broadcasting...' : 'Publish Announcement'}
              </button>
            </form>
          </div>

          {/* Frequently Visited Stalls & Most Viewed Food Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            <div className="bg-white p-5 rounded-3xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-600" />
                  <h3 className="text-sm font-black text-stone-900 font-display">
                    Frequently Visited Stalls
                  </h3>
                </div>
                <span className="text-[11px] text-stone-400">In selected date range</span>
              </div>

              {!analytics || analytics.frequentStalls.length === 0 ? (
                <div className="py-8 text-center text-stone-400">
                  No stall views recorded in this period yet.
                </div>
              ) : (
                <div className="space-y-2.5 tabular-nums">
                  {analytics.frequentStalls.map((st, idx) => {
                    const maxViews = analytics.frequentStalls[0]?.views || 1;
                    const pct = Math.max(10, Math.round((st.views / maxViews) * 100));
                    return (
                      <div key={st.stallName} className="space-y-1">
                        <div className="flex items-center justify-between font-bold text-stone-800">
                          <span className="truncate">
                            {idx + 1}. {st.stallName}
                          </span>
                          <span className="text-orange-700 shrink-0">
                            {st.views} {st.views === 1 ? 'view' : 'views'} ({st.uniqueVisitors} visitors)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-3xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-black text-stone-900 font-display">
                    Most Viewed Food Items
                  </h3>
                </div>
                <span className="text-[11px] text-stone-400">In selected date range</span>
              </div>

              {!analytics || analytics.mostViewedItems.length === 0 ? (
                <div className="py-8 text-center text-stone-400">
                  No dish views recorded in this period yet.
                </div>
              ) : (
                <div className="space-y-2.5 tabular-nums">
                  {analytics.mostViewedItems.map((item, idx) => {
                    const maxViews = analytics.mostViewedItems[0]?.views || 1;
                    const pct = Math.max(10, Math.round((item.views / maxViews) * 100));
                    return (
                      <div key={`${item.dishId}-${idx}`} className="space-y-1">
                        <div className="flex items-center justify-between font-bold text-stone-800 gap-2">
                          <span className="truncate">
                            {idx + 1}. {item.dishName}{' '}
                            <span className="text-stone-400 font-normal">({item.stallName})</span>
                          </span>
                          <span className="text-amber-700 shrink-0">
                            {item.views} {item.views === 1 ? 'view' : 'views'}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: PAYMENT VERIFICATION                                           */}
      {/* ===================================================================== */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                'All',
                'Pending Verification',
                'Approved',
                'Rejected',
                'Requires Additional Information'
              ].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setPaymentStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition ${
                    paymentStatusFilter === st
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-72 text-xs">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                placeholder="Search stall, owner, or ref no..."
                className="w-full min-h-[40px] pl-9 pr-3 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xs">
            {filteredPayments.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">
                <FileText className="w-8 h-8 mx-auto mb-1 text-stone-300" />
                <p>No payment records match the selected filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead className="bg-stone-50 border-b border-stone-200 text-[10px] font-black uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4">Stall & Owner</th>
                      <th className="py-3 px-4">Plan & Amount</th>
                      <th className="py-3 px-4">Method & Ref</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50/70">
                        <td className="py-3 px-4 whitespace-nowrap text-stone-600">
                          {new Date(p.submittedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-black text-stone-900">{p.stallName}</div>
                          <div className="text-[11px] text-stone-500">{p.ownerName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize font-bold">{p.plan}</span> •{' '}
                          <strong className="text-stone-900">₱{p.amount}</strong>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="uppercase text-[10px] font-bold text-stone-500 mr-1.5">
                            {p.paymentMethod}
                          </span>
                          <span className="font-bold text-stone-900">{p.referenceNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              p.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : p.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : p.status === 'Requires Additional Information'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setInspectPayment(p);
                              setConfirmApproveId(null);
                              setActionMode('none');
                              setActionText('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-orange-600 text-white font-bold text-[11px] transition inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: STALL MANAGEMENT                                               */}
      {/* ===================================================================== */}
      {activeTab === 'stalls' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-stone-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { id: 'all', label: 'All Stalls' },
                { id: 'pending_registration', label: 'Pending Approval' },
                { id: 'active', label: 'Active' },
                { id: 'inactive', label: 'Inactive' },
                { id: 'suspended', label: 'Suspended' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStallFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition ${
                    stallFilter === f.id
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-72 text-xs">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={stallSearch}
                onChange={(e) => setStallSearch(e.target.value)}
                placeholder="Search stall or owner name..."
                className="w-full min-h-[40px] pl-9 pr-3 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>
          </div>

          {filteredStalls.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 py-12 text-center text-xs text-stone-400">
              No stalls registered matching this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStalls.map((s) => (
                <div
                  key={s.id || s.name}
                  className="bg-white rounded-3xl border border-stone-200 p-5 space-y-3 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            s.status === 'suspended'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : s.status === 'inactive'
                              ? 'bg-stone-100 text-stone-700 border-stone-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {s.status}
                        </span>
                        {s.registrationStatus === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                            Pending Registration
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                          {s.trialStatus || s.subscriptionStatus || 'Trial'}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-stone-900 font-display">
                        {s.name}
                      </h3>
                      <p className="text-xs text-stone-600">
                        Owner: <strong>{s.ownerName}</strong> • {s.contactInfo || s.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenStallDetails(s.name)}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-700 shrink-0"
                    >
                      Details
                    </button>
                  </div>

                  {s.suspensionReason && s.status === 'suspended' && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
                      <strong>Suspension Reason:</strong> {s.suspensionReason}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-100 text-[11px]">
                    {s.registrationStatus === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStallStatusAction(s.name, 'approve_registration')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          Approve Registration
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleStallStatusAction(
                              s.name,
                              'reject_registration',
                              'Registration declined by administrator'
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {s.status === 'active' ? (
                      <button
                        type="button"
                        onClick={() => handleStallStatusAction(s.name, 'deactivate')}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center gap-1"
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>Deactivate</span>
                      </button>
                    ) : s.status === 'inactive' ? (
                      <button
                        type="button"
                        onClick={() => handleStallStatusAction(s.name, 'activate')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Activate</span>
                      </button>
                    ) : null}

                    {s.status === 'suspended' ? (
                      <button
                        type="button"
                        onClick={() => handleStallStatusAction(s.name, 'restore')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Restore Stall</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSuspendTargetStall(s.name);
                          setSuspendReasonInput('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 flex items-center gap-1"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Suspend</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setManualAccessModal({ stallName: s.name, action: 'grant' });
                        setManualDays(30);
                        setManualReason('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold border border-indigo-200"
                    >
                      Grant / Renew Access
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setManualAccessModal({ stallName: s.name, action: 'revoke' });
                        setManualReason('');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-rose-50 text-stone-600 hover:text-rose-700 font-bold border border-stone-200"
                    >
                      Revoke Access
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: STALL OWNERS & SUPER ADMIN ACCOUNTS                            */}
      {/* ===================================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { id: 'all', label: 'All Accounts' },
                { id: 'merchant', label: 'Stall Owners' },
                { id: 'admin', label: 'Super Admin' }
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setUserRoleFilter(r.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition ${
                    userRoleFilter === r.id
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72 text-xs">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search name, username, email..."
                className="w-full min-h-[40px] pl-9 pr-3 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xs">
            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">
                No registered accounts found matching this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead className="bg-stone-50 border-b border-stone-200 text-[10px] font-black uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="py-3 px-4">Account</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role / Stall</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Logins</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50/70">
                        <td className="py-3 px-4">
                          <div className="font-black text-stone-900">{u.name}</div>
                          <div className="text-[11px] font-mono text-stone-500">@{u.username}</div>
                        </td>
                        <td className="py-3 px-4 text-stone-600">{u.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {u.role === 'admin' ? 'Super Administrator' : 'Stall Owner'}
                          </span>
                          {u.stallName && (
                            <span className="block text-[10px] text-stone-500 mt-0.5">
                              {u.stallName}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black capitalize ${
                              u.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-600">{u.loginCount ?? 0}</td>
                        <td className="py-3 px-4 text-right">
                          {u.role === 'admin' ? (
                            <span className="text-[11px] font-bold text-purple-700">
                              Primary Admin (Locked)
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] border ${
                                u.status === 'active'
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {u.status === 'active' ? 'Deactivate Account' : 'Reactivate Account'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: PLATFORM, CAMPUS QR & SUBSCRIPTION SETTINGS                    */}
      {/* ===================================================================== */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
          {/* Centralized Platform Controls & Campus QR */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-orange-600" />
                <h3 className="text-base font-black text-stone-900 font-display">
                  Centralized Platform & Customer Defaults
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCampusQrModalOpen(true)}
                className="min-h-[38px] px-3.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold flex items-center gap-1.5 self-start sm:self-auto"
              >
                <QrCode className="w-3.5 h-3.5 text-orange-400" />
                <span>Download Official Campus QR</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Official Production App URL (Encoded in Campus QR)
                </label>
                <input
                  type="url"
                  value={editOfficialAppUrl}
                  onChange={(e) => setEditOfficialAppUrl(e.target.value)}
                  placeholder="https://ais-pre-oruy4f4mj757x5vir5si2a-165677608534.asia-east1.run.app"
                  className="w-full min-h-[40px] px-3 bg-stone-50 border border-stone-200 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Default Student Budget (₱10 – ₱500)
                </label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={editDefaultStudentBudget}
                  onChange={(e) => setEditDefaultStudentBudget(Number(e.target.value))}
                  className="w-full min-h-[40px] px-3 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-stone-700 mb-1">
                  Student Home Welcome Banner Message (Optional)
                </label>
                <input
                  type="text"
                  value={editWelcomeBannerMessage}
                  onChange={(e) => setEditWelcomeBannerMessage(e.target.value)}
                  placeholder="e.g. Welcome USTP CDO Trailblazers! Install Our Sud-an for offline cafeteria browsing."
                  className="w-full min-h-[40px] px-3 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>

              <label className="md:col-span-2 flex items-center gap-2.5 font-bold text-stone-800 cursor-pointer p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <input
                  type="checkbox"
                  checked={editRequireStallApproval}
                  onChange={(e) => setEditRequireStallApproval(e.target.checked)}
                  className="w-4 h-4 accent-orange-600"
                />
                <span>
                  Require Super Admin approval before newly registered stalls appear to students
                </span>
              </label>
            </div>
          </div>
          {/* Trial & Plan Pricing */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-black text-stone-900 font-display border-b border-stone-100 pb-2">
              Free Trial & Plan Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <label className="flex items-center gap-2.5 font-bold text-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editTrialEnabled}
                  onChange={(e) => setEditTrialEnabled(e.target.checked)}
                  className="w-4 h-4 accent-orange-600"
                />
                <span>Enable Free Trial for Newly Registered Stalls</span>
              </label>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Free Trial Duration (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={editFreeTrialDays}
                  onChange={(e) => setEditFreeTrialDays(Number(e.target.value))}
                  className="w-full min-h-[40px] px-3 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-stone-900">Weekly Plan</span>
                  <label className="flex items-center gap-1.5 font-bold">
                    <input
                      type="checkbox"
                      checked={editWeeklyEnabled}
                      onChange={(e) => setEditWeeklyEnabled(e.target.checked)}
                      className="accent-orange-600"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-stone-600 mb-1">Price (₱)</label>
                    <input
                      type="number"
                      min={1}
                      value={editWeeklyPrice}
                      onChange={(e) => setEditWeeklyPrice(Number(e.target.value))}
                      className="w-full min-h-[38px] px-2.5 bg-white border border-stone-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-600 mb-1">Duration (Days)</label>
                    <input
                      type="number"
                      min={1}
                      value={editWeeklyDays}
                      onChange={(e) => setEditWeeklyDays(Number(e.target.value))}
                      className="w-full min-h-[38px] px-2.5 bg-white border border-stone-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={editWeeklyDesc}
                  onChange={(e) => setEditWeeklyDesc(e.target.value)}
                  placeholder="Weekly plan description"
                  className="w-full min-h-[38px] px-2.5 bg-white border border-stone-200 rounded-lg"
                />
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-stone-900">Monthly Plan</span>
                  <label className="flex items-center gap-1.5 font-bold">
                    <input
                      type="checkbox"
                      checked={editMonthlyEnabled}
                      onChange={(e) => setEditMonthlyEnabled(e.target.checked)}
                      className="accent-orange-600"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-stone-600 mb-1">Price (₱)</label>
                    <input
                      type="number"
                      min={1}
                      value={editMonthlyPrice}
                      onChange={(e) => setEditMonthlyPrice(Number(e.target.value))}
                      className="w-full min-h-[38px] px-2.5 bg-white border border-stone-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-600 mb-1">Billing Cycle</label>
                    <select
                      value={editBillingCycle}
                      onChange={(e) =>
                        setEditBillingCycle(e.target.value as 'calendar_month' | 'exact_30_days')
                      }
                      className="w-full min-h-[38px] px-2 bg-white border border-stone-200 rounded-lg font-bold"
                    >
                      <option value="calendar_month">Calendar Month</option>
                      <option value="exact_30_days">Exact 30 Days</option>
                    </select>
                  </div>
                </div>
                <input
                  type="text"
                  value={editMonthlyDesc}
                  onChange={(e) => setEditMonthlyDesc(e.target.value)}
                  placeholder="Monthly plan description"
                  className="w-full min-h-[38px] px-2.5 bg-white border border-stone-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Payment Channels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* GCash */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h4 className="font-black text-stone-900">GCash Account</h4>
                <input
                  type="checkbox"
                  checked={editGcashEnabled}
                  onChange={(e) => setEditGcashEnabled(e.target.checked)}
                  className="accent-orange-600"
                />
              </div>
              <input
                type="text"
                value={editGcashName}
                onChange={(e) => setEditGcashName(e.target.value)}
                placeholder="Account Name"
                className="w-full min-h-[40px] px-3 bg-stone-50 border border-stone-200 rounded-xl"
              />
              <input
                type="text"
                value={editGcashNumber}
                onChange={(e) => setEditGcashNumber(e.target.value)}
                placeholder="GCash Mobile Number"
                className="w-full min-h-[40px] px-3 bg-stone-50 border border-stone-200 rounded-xl font-mono"
              />
              <textarea
                rows={2}
                value={editGcashInstructions}
                onChange={(e) => setEditGcashInstructions(e.target.value)}
                placeholder="Payment instructions"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            {/* Bank Transfer */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h4 className="font-black text-stone-900">Bank Transfer</h4>
                <input
                  type="checkbox"
                  checked={editBankEnabled}
                  onChange={(e) => setEditBankEnabled(e.target.checked)}
                  className="accent-orange-600"
                />
              </div>
              <input
                type="text"
                value={editBankName}
                onChange={(e) => setEditBankName(e.target.value)}
                placeholder="Bank Name"
                className="w-full min-h-[40px] px-3 bg-stone-50 border border-stone-200 rounded-xl"
              />
              <input
                type="text"
                value={editBankHolder}
                onChange={(e) => setEditBankHolder(e.target.value)}
                placeholder="Account Holder"
                className="w-full min-h-[40px] px-3 bg-stone-50 border border-stone-200 rounded-xl"
              />
              <input
                type="text"
                value={editBankNumber}
                onChange={(e) => setEditBankNumber(e.target.value)}
                placeholder="Account Number"
                className="w-full min-h-[40px] px-3 bg-stone-50 border border-stone-200 rounded-xl font-mono"
              />
              <textarea
                rows={2}
                value={editBankInstructions}
                onChange={(e) => setEditBankInstructions(e.target.value)}
                placeholder="Bank instructions"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h4 className="font-black text-stone-900">Official QR Code</h4>
                <input
                  type="checkbox"
                  checked={editQrEnabled}
                  onChange={(e) => setEditQrEnabled(e.target.checked)}
                  className="accent-orange-600"
                />
              </div>

              {settings?.qrCode.imageUrl && (
                <img
                  src={settings.qrCode.imageUrl}
                  alt="Official QR"
                  className="w-32 h-32 mx-auto object-contain rounded-xl border border-stone-200 bg-white p-1.5"
                />
              )}

              <label className="w-full min-h-[40px] px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New QR Image</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleQrFileUpload}
                  className="hidden"
                />
              </label>

              <textarea
                rows={2}
                value={editQrInstructions}
                onChange={(e) => setEditQrInstructions(e.target.value)}
                placeholder="QR scanning instructions"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingSettings}
            className="min-h-[46px] px-6 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm rounded-xl transition shadow-sm"
          >
            {isSavingSettings ? 'Saving Configuration...' : 'Save Subscription & Payment Settings'}
          </button>
        </form>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: AUDIT LOGS                                                     */}
      {/* ===================================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-stone-200 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black text-stone-900 font-display">
              Administrator Audit Trail
            </h3>
            <div className="relative w-64 text-xs">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Filter audit logs..."
                className="w-full min-h-[38px] pl-9 pr-3 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">
                No audit log entries recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead className="bg-stone-50 border-b border-stone-200 text-[10px] font-black uppercase text-stone-500">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target</th>
                      <th className="py-3 px-4">Details</th>
                      <th className="py-3 px-4">Performed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50/70">
                        <td className="py-3 px-4 whitespace-nowrap text-stone-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-stone-800">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 font-bold text-stone-900">{log.targetStall}</td>
                        <td className="py-3 px-4 text-stone-600">{log.details}</td>
                        <td className="py-3 px-4 text-stone-700 font-semibold">
                          {log.performedBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: PAYMENT INSPECTION & VERIFICATION                              */}
      {/* ===================================================================== */}
      {inspectPayment && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setInspectPayment(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-black text-stone-900 font-display">
                  Inspect Payment Verification
                </h3>
                <p className="text-stone-500">
                  {inspectPayment.stallName} • Ref: {inspectPayment.referenceNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectPayment(null)}
                className="min-h-[40px] min-w-[40px] rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 tabular-nums">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold uppercase text-stone-400 block">
                  Owner
                </span>
                <strong className="text-stone-900">{inspectPayment.ownerName}</strong>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold uppercase text-stone-400 block">
                  Plan & Amount
                </span>
                <strong className="text-stone-900 capitalize">
                  {inspectPayment.plan} — ₱{inspectPayment.amount}
                </strong>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold uppercase text-stone-400 block">
                  Status
                </span>
                <strong className="text-stone-900">{inspectPayment.status}</strong>
              </div>
            </div>

            {inspectPayment.resubmissionNotes && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <strong>Owner Resubmission Note:</strong> {inspectPayment.resubmissionNotes}
              </div>
            )}

            {/* Protected Receipt Image */}
            <div className="bg-stone-100 rounded-2xl p-3 border border-stone-200 flex justify-center">
              <ProtectedReceiptImage
                src={inspectPayment.proofImageUrl}
                alt={`Receipt ${inspectPayment.referenceNumber}`}
                className="max-h-80 w-auto object-contain rounded-xl"
              />
            </div>

            {/* Prior History */}
            {inspectPayment.history && inspectPayment.history.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-stone-400 block">
                  Verification Trail
                </span>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {inspectPayment.history.map((h, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-[11px] flex justify-between gap-2"
                    >
                      <span>
                        <strong>{h.status}</strong> — {h.note}
                      </span>
                      <span className="text-stone-400 shrink-0">
                        {new Date(h.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Decision Controls */}
            {inspectPayment.status !== 'Approved' && (
              <div className="space-y-3 pt-2 border-t border-stone-100">
                {confirmApproveId === inspectPayment.id ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2.5">
                    <p className="font-black text-emerald-950">
                      Confirm Payment Approval: Activate subscription for {inspectPayment.stallName} (₱
                      {inspectPayment.amount} {inspectPayment.plan})?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isProcessingAction}
                        onClick={() => handleVerifyAction(inspectPayment.id, 'approve')}
                        className="min-h-[40px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirm & Activate Subscription</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmApproveId(null)}
                        className="min-h-[40px] px-3 rounded-xl bg-white border border-stone-200 font-bold text-stone-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : actionMode !== 'none' ? (
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                    <label className="block font-black text-stone-900">
                      {actionMode === 'reject'
                        ? 'Rejection Reason (Required) *'
                        : 'Requested Additional Information (Required) *'}
                    </label>
                    <textarea
                      rows={2}
                      value={actionText}
                      onChange={(e) => setActionText(e.target.value)}
                      placeholder={
                        actionMode === 'reject'
                          ? 'Explain why this payment proof was rejected...'
                          : 'Specify what details or clearer screenshot the owner needs to resubmit...'
                      }
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isProcessingAction}
                        onClick={() => handleVerifyAction(inspectPayment.id, actionMode)}
                        className={`min-h-[40px] px-4 rounded-xl text-white font-black ${
                          actionMode === 'reject'
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : 'bg-amber-600 hover:bg-amber-700'
                        }`}
                      >
                        {actionMode === 'reject' ? 'Confirm Reject' : 'Send Info Request'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionMode('none');
                          setActionText('');
                        }}
                        className="min-h-[40px] px-3 rounded-xl bg-white border border-stone-200 font-bold text-stone-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmApproveId(inspectPayment.id)}
                      className="min-h-[42px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Activate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionMode('request_info');
                        setActionText('');
                      }}
                      className="min-h-[42px] px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-black border border-amber-300"
                    >
                      Request Additional Info
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionMode('reject');
                        setActionText('');
                      }}
                      className="min-h-[42px] px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black border border-rose-200 flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Payment</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: SUSPEND STALL                                                  */}
      {/* ===================================================================== */}
      {suspendTargetStall && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/75 flex items-center justify-center p-4"
          onClick={() => setSuspendTargetStall(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-stone-900 font-display">
              Suspend {suspendTargetStall}
            </h3>
            <p className="text-stone-600">
              Suspending this stall immediately hides its menu from customers while keeping all stall records intact.
            </p>
            <textarea
              rows={3}
              value={suspendReasonInput}
              onChange={(e) => setSuspendReasonInput(e.target.value)}
              placeholder="Enter suspension reason..."
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSuspendTargetStall(null)}
                className="min-h-[40px] px-4 rounded-xl bg-stone-100 font-bold text-stone-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleStallStatusAction(
                    suspendTargetStall,
                    'suspend',
                    suspendReasonInput.trim() || 'Suspended by administrator'
                  )
                }
                className="min-h-[40px] px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black"
              >
                Confirm Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: MANUAL SUBSCRIPTION ACCESS                                     */}
      {/* ===================================================================== */}
      {manualAccessModal && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/75 flex items-center justify-center p-4"
          onClick={() => setManualAccessModal(null)}
        >
          <form
            onSubmit={handleManualAccessSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-stone-900 font-display capitalize">
              {manualAccessModal.action} Subscription — {manualAccessModal.stallName}
            </h3>

            {manualAccessModal.action !== 'revoke' && (
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={manualDays}
                  onChange={(e) => setManualDays(Number(e.target.value))}
                  className="w-full min-h-[40px] px-3 bg-stone-50 border border-stone-200 rounded-xl font-mono"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Administrator Reason / Remarks
              </label>
              <textarea
                rows={2}
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                placeholder="Reason for manual update..."
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setManualAccessModal(null)}
                className="min-h-[40px] px-4 rounded-xl bg-stone-100 font-bold text-stone-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessingAction}
                className={`min-h-[40px] px-4 rounded-xl text-white font-black ${
                  manualAccessModal.action === 'revoke'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: STALL DETAILS                                                  */}
      {/* ===================================================================== */}
      {stallDetailsModal && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/75 flex items-center justify-center p-4"
          onClick={() => setStallDetailsModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 text-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900 font-display">
                  {stallDetailsModal.stall.name}
                </h3>
                <p className="text-stone-500">
                  {stallDetailsModal.stall.ownerName} • {stallDetailsModal.stall.contactInfo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStallDetailsModal(null)}
                className="min-h-[36px] min-w-[36px] rounded-full bg-stone-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200">
              {stallDetailsModal.stall.description}
            </p>

            <div>
              <h4 className="font-black text-stone-900 mb-2">
                Menu Items ({stallDetailsModal.items.length})
              </h4>
              {stallDetailsModal.items.length === 0 ? (
                <p className="text-stone-400">No menu items added by this stall yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                  {stallDetailsModal.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-stone-200 flex items-center justify-between"
                    >
                      <span className="font-bold text-stone-800 truncate">{item.name}</span>
                      <span className="font-black text-orange-600 tabular-nums shrink-0 ml-2">
                        ₱{item.price}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CampusQRModal
        isOpen={isCampusQrModalOpen}
        onClose={() => setIsCampusQrModalOpen(false)}
        officialAppUrl={editOfficialAppUrl}
      />
    </div>
  );
};
