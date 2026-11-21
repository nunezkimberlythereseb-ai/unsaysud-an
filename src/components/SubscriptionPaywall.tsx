import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Check,
  Upload,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  Download,
  RefreshCw,
  ArrowRight,
  QrCode,
  Building2,
  Sparkles,
  Copy,
  ChevronRight,
  Store
} from 'lucide-react';
import {
  UserSubscription,
  PaymentRecord,
  AdminPaymentSettings,
  SubscriptionPlanType,
  PaymentMethod,
  AppPage,
  StallCredential,
  TrialStatus
} from '../types';
import {
  fetchSubscriptionSettingsAPI,
  fetchSubscriptionStatusAPI,
  submitSubscriptionPaymentAPI,
  fetchStallPaymentsAPI,
  startFreeTrialAPI
} from '../services/api';
import { compressImageFile } from '../utils/imageCompressor';
import { ProtectedReceiptImage } from './ProtectedReceiptImage';

interface SubscriptionPaywallProps {
  stallName?: string;
  stalls?: StallCredential[];
  onPaymentSubmitted?: () => void;
  onNavigate: (page: AppPage) => void;
  onRefreshStatus?: () => void;
  showBackToPortal?: boolean;
}

export const SubscriptionPaywall: React.FC<SubscriptionPaywallProps> = ({
  stallName,
  stalls = [],
  onPaymentSubmitted,
  onNavigate,
  onRefreshStatus,
  showBackToPortal = false
}) => {
  const [activeStall, setActiveStall] = useState<string>(() => {
    return stallName || (stalls && stalls[0]?.name) || '';
  });

  useEffect(() => {
    if (stallName) {
      setActiveStall(stallName);
    } else if (!activeStall && stalls.length > 0) {
      setActiveStall(stalls[0].name);
    }
  }, [stallName, stalls, activeStall]);

  // Settings & Status
  const [settings, setSettings] = useState<AdminPaymentSettings | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [trialStatus, setTrialStatus] = useState<TrialStatus>('Not Started');
  const [trialStartDate, setTrialStartDate] = useState<string | null>(null);
  const [trialEndDate, setTrialEndDate] = useState<string | null>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0);
  const [isActivatingTrial, setIsActivatingTrial] = useState<boolean>(false);
  const [trialSuccessMsg, setTrialSuccessMsg] = useState<string | null>(null);
  const [trialErrorMsg, setTrialErrorMsg] = useState<string | null>(null);
  const [stallSuspended, setStallSuspended] = useState<boolean>(false);
  const [suspensionReason, setSuspensionReason] = useState<string>('');

  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [pendingPayment, setPendingPayment] = useState<PaymentRecord | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Payment Submission / Resubmission Form State
  const [resubmitPaymentId, setResubmitPaymentId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType>('monthly');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('gcash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [proofDataUrl, setProofDataUrl] = useState<string | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Lightbox modal for previewing payment proofs or QR
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setTrialSuccessMsg(null);
    setTrialErrorMsg(null);
    try {
      const settingsRes = await fetchSubscriptionSettingsAPI();
      if (settingsRes.success && settingsRes.settings) {
        setSettings(settingsRes.settings);
      }

      if (!activeStall) {
        setIsLoading(false);
        return;
      }

      const [statusRes, paymentsRes] = await Promise.all([
        fetchSubscriptionStatusAPI(activeStall),
        fetchStallPaymentsAPI(activeStall)
      ]);

      if (statusRes) {
        setTrialStatus(statusRes.trialStatus || 'Not Started');
        setTrialStartDate(statusRes.trialStartDate || null);
        setTrialEndDate(statusRes.trialEndDate || null);
        setTrialDaysRemaining(statusRes.trialDaysRemaining ?? 0);
        setIsExpired(!!statusRes.isExpired);
        setDaysRemaining(statusRes.daysRemaining || 0);
        setStallSuspended(Boolean(statusRes.stallSuspended));
        setSuspensionReason(statusRes.suspensionReason || '');

        if (statusRes.hasSubscription && statusRes.subscription) {
          setSubscription(statusRes.subscription);
          if (statusRes.subscription.plan && statusRes.subscription.plan !== 'trial') {
            setSelectedPlan(statusRes.subscription.plan);
          }
        } else {
          setSubscription(null);
        }

        setPendingPayment(statusRes.pendingPayment || null);
      }

      if (paymentsRes.success && paymentsRes.payments) {
        setPaymentHistory(paymentsRes.payments);
      }
    } catch (err) {
      console.error('Failed to load subscription data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeStall]);

  const freeTrialDays = settings?.freeTrialDays ?? 14;
  const trialEnabled = settings?.trialEnabled !== false;

  const handleStartTrial = async () => {
    if (!activeStall) return;
    setIsActivatingTrial(true);
    setTrialErrorMsg(null);
    setTrialSuccessMsg(null);
    try {
      const res = await startFreeTrialAPI(activeStall);
      if (res.success) {
        setTrialSuccessMsg(res.message || `Free ${freeTrialDays}-Day Trial activated successfully.`);
        await loadData();
        if (onRefreshStatus) onRefreshStatus();
      } else {
        setTrialErrorMsg(res.error || 'Failed to activate free trial.');
      }
    } catch (err: any) {
      setTrialErrorMsg(err.message || 'Network error activating free trial.');
    } finally {
      setIsActivatingTrial(false);
    }
  };

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setProofError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
      setProofError('Please upload an image file (JPG, PNG, or WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setProofError('File size exceeds 15MB limit.');
      return;
    }

    try {
      const compressionRes = await compressImageFile(file);
      const compressedDataUrl = compressionRes.dataUrl;
      setProofDataUrl(compressedDataUrl);
      setProofPreview(compressedDataUrl);
    } catch {
      setProofError('Failed to process image. Please try another file.');
    }
  };

  const handleStartResubmit = (payment: PaymentRecord) => {
    setResubmitPaymentId(payment.id);
    setSelectedPlan(payment.plan === 'weekly' ? 'weekly' : 'monthly');
    setSelectedMethod(payment.paymentMethod);
    setReferenceNumber(payment.referenceNumber);
    setPaymentDate(payment.paymentDate || new Date().toISOString().split('T')[0]);
    setPaymentNotes(payment.resubmissionNotes || '');
    setProofDataUrl(null);
    setProofPreview(null);
    setSubmitError(null);
    setSubmitSuccess(null);
    const formEl = document.getElementById('payment-proof-form');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!activeStall) {
      setSubmitError('Please sign in to your stall owner account first.');
      return;
    }

    if (!proofDataUrl && !resubmitPaymentId) {
      setSubmitError('Please upload a screenshot or photo of your payment receipt.');
      return;
    }

    if (!referenceNumber.trim()) {
      setSubmitError('Please enter the transaction reference number or ID from your receipt.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitSubscriptionPaymentAPI({
        stallName: activeStall,
        plan: selectedPlan === 'weekly' ? 'weekly' : 'monthly',
        paymentMethod: selectedMethod,
        referenceNumber: referenceNumber.trim(),
        paymentDate,
        proofImageDataUrl: proofDataUrl || undefined,
        notes: paymentNotes.trim() || undefined,
        resubmitPaymentId: resubmitPaymentId || undefined
      });

      if (res.success) {
        setSubmitSuccess(
          res.message ||
            'Your payment has been submitted successfully and is currently awaiting administrator verification. Your subscription will only be activated after your payment has been reviewed and approved.'
        );
        setReferenceNumber('');
        setPaymentNotes('');
        setProofDataUrl(null);
        setProofPreview(null);
        setResubmitPaymentId(null);
        await loadData();
        if (onPaymentSubmitted) onPaymentSubmitted();
        if (onRefreshStatus) onRefreshStatus();
      } else {
        setSubmitError(res.error || 'Failed to submit payment. Please try again.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Network error submitting payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!activeStall) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-stone-900 font-display">
            Sign In Required for Subscription Management
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Register or sign in as a cafeteria stall owner in the Stall Portal to view your trial expiration, submit payment verification receipts, and manage billing.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('portal')}
            className="min-h-[44px] px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs transition inline-flex items-center gap-2"
          >
            <span>Open Stall Owner Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const weeklyPrice = settings?.plans.weekly.price ?? 25;
  const monthlyPrice = settings?.plans.monthly.price ?? 100;
  const weeklyDays = settings?.plans.weekly.durationDays ?? 7;
  const currentPlanAmount = selectedPlan === 'weekly' ? weeklyPrice : monthlyPrice;
  const normSubStatus = subscription ? String(subscription.status).toUpperCase() : '';
  const isSuspended = stallSuspended || normSubStatus === 'SUSPENDED';
  const infoRequestedPayments = paymentHistory.filter(
    (p) => p.status === 'Requires Additional Information'
  );

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-6 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black uppercase tracking-wider shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {trialEnabled
              ? `${freeTrialDays}-Day Free Trial for Registered Stalls`
              : 'Cafeteria Merchant Subscription'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display">
          Stall Subscription & Verification
        </h1>

        <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto">
          Manage subscription access for <strong className="text-stone-900">{activeStall}</strong>.
          Payments always require administrator verification before subscription time is activated or extended.
        </p>

        {!stallName && stalls.length > 0 && (
          <div className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-stone-200 shadow-2xs text-xs font-medium max-w-md w-full mx-auto">
            <span className="text-stone-500 font-bold shrink-0">Stall Account:</span>
            <select
              value={activeStall}
              onChange={(e) => setActiveStall(e.target.value)}
              className="bg-transparent font-bold text-stone-900 focus:outline-none w-full cursor-pointer truncate"
            >
              {stalls.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Trial Alerts */}
      {trialSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-3 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="font-black text-emerald-950">Free Trial Activated</h4>
            <p className="text-[11px]">{trialSuccessMsg}</p>
          </div>
        </div>
      )}

      {trialErrorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="font-black text-rose-950">Trial Notice</h4>
            <p className="text-[11px]">{trialErrorMsg}</p>
          </div>
        </div>
      )}

      {/* 2. SUBSCRIPTION STATUS CARD */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-100/80 px-2.5 py-0.5 rounded-md">
              Stall Subscription Status
            </span>

            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {isSuspended ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-900 text-xs font-black border border-red-300">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>SUSPENDED BY ADMIN</span>
                </span>
              ) : normSubStatus === 'PENDING' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-300">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>PENDING VERIFICATION</span>
                </span>
              ) : trialStatus === 'Trial Active' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Free {freeTrialDays}-Day Trial: Active</span>
                </span>
              ) : trialStatus === 'Subscribed' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-black border border-indigo-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    Active Paid ({subscription?.plan === 'weekly' ? 'Weekly Plan' : 'Monthly Plan'})
                  </span>
                </span>
              ) : trialStatus === 'Trial Expired' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-black border border-rose-300">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Trial / Subscription Expired</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Trial Eligible</span>
                </span>
              )}

              {pendingPayment && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Pending Verification</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="min-h-[40px] px-3.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-700 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {(trialStatus === 'Trial Active' || trialStatus === 'Subscribed') &&
              !isSuspended &&
              showBackToPortal && (
                <button
                  type="button"
                  onClick={() => onNavigate('portal')}
                  className="min-h-[40px] px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>Enter Stall Portal</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
          </div>
        </div>

        {/* Suspended Banner */}
        {isSuspended && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-1">
            <p className="font-black">This stall is currently suspended by an administrator.</p>
            <p className="text-[11px]">
              {suspensionReason || 'Your menu is temporarily hidden from students until restored by the platform administrator.'}
            </p>
          </div>
        )}

        {/* Requires Additional Info Alert */}
        {infoRequestedPayments.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1">
                <h4 className="font-black flex items-center gap-1.5 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Action Required: Administrator Requested Additional Information</span>
                </h4>
                <p className="text-[11px] leading-relaxed">
                  <strong>Admin Note (Ref {infoRequestedPayments[0].referenceNumber}):</strong>{' '}
                  {infoRequestedPayments[0].requestedInfoMessage ||
                    'Please verify your reference number or upload a clearer receipt image.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleStartResubmit(infoRequestedPayments[0])}
                className="min-h-[40px] px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition shrink-0"
              >
                Update & Resubmit
              </button>
            </div>
          </div>
        )}

        {/* State A: NOT STARTED */}
        {trialStatus === 'Not Started' && trialEnabled && !isSuspended && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-white border border-amber-200/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-stone-900 font-display">
                  Start Your Free {freeTrialDays}-Day Trial
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed max-w-xl">
                  Activate your complimentary {freeTrialDays}-day trial to publish your menu to students, manage prices and photos, and use Smart Sales Tracker without upfront fees.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartTrial}
                disabled={isActivatingTrial}
                className="min-h-[44px] px-5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs transition flex items-center gap-2 shadow-sm shrink-0"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>
                  {isActivatingTrial ? 'Activating...' : `Activate ${freeTrialDays}-Day Trial`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* State B: TRIAL ACTIVE */}
        {trialStatus === 'Trial Active' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-[#F7FCF9] to-white border border-emerald-200/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-emerald-950 font-display">
                  Free {freeTrialDays}-Day Trial is Active
                </h3>
                <p className="text-xs text-emerald-800/90 mt-1">
                  Your stall menu is visible to customers and all merchant management tools are unlocked.
                </p>
              </div>

              <div className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs text-center shrink-0 tabular-nums">
                <span className="block text-lg font-display leading-tight">
                  {trialDaysRemaining}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold">
                  Days Remaining
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-emerald-100">
              <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-stone-500 font-bold uppercase block">
                  Trial Started
                </span>
                <span className="text-xs sm:text-sm font-black text-stone-900 mt-0.5 block">
                  {trialStartDate
                    ? new Date(trialStartDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'Active'}
                </span>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-stone-500 font-bold uppercase block">
                  Trial Expires
                </span>
                <span className="text-xs sm:text-sm font-black text-emerald-800 mt-0.5 block">
                  {trialEndDate
                    ? new Date(trialEndDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : `${freeTrialDays} Days`}
                </span>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-stone-500 font-bold uppercase block">
                  Customer Visibility
                </span>
                <span className="text-xs sm:text-sm font-black text-stone-900 mt-0.5 block">
                  Published & Live
                </span>
              </div>
            </div>
          </div>
        )}

        {/* State C: TRIAL / SUBSCRIPTION EXPIRED */}
        {(trialStatus === 'Trial Expired' || isExpired) && trialStatus !== 'Subscribed' && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50/90 via-rose-50/40 to-white border border-rose-300 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-rose-950 font-display">
                  Your Subscription / Trial Has Expired
                </h3>
                <p className="text-xs text-rose-900/90 leading-relaxed">
                  After your {freeTrialDays}-day trial or subscription expires, your stall menu is automatically hidden from students until renewed. Your stall account, menu items, saved photos, and historical records are safely preserved.
                </p>
              </div>
            </div>

            {trialEndDate && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-rose-100">
                <div className="p-3 bg-white/90 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-stone-500 font-bold uppercase block">
                    Trial Started
                  </span>
                  <span className="text-xs font-black text-stone-900 mt-0.5 block">
                    {trialStartDate
                      ? new Date(trialStartDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : '—'}
                  </span>
                </div>
                <div className="p-3 bg-white/90 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-stone-500 font-bold uppercase block">
                    Trial Expired
                  </span>
                  <span className="text-xs font-black text-rose-700 mt-0.5 block">
                    {new Date(trialEndDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="p-3 bg-white/90 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-stone-500 font-bold uppercase block">
                    Menu Visibility
                  </span>
                  <span className="text-xs font-black text-rose-700 mt-0.5 block">
                    Hidden Until Renewed
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* State D: SUBSCRIBED */}
        {trialStatus === 'Subscribed' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-indigo-50/30 to-white border border-indigo-200/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-indigo-950 font-display">
                  Active Subscription ({subscription?.plan === 'weekly' ? 'Weekly Plan' : 'Monthly Plan'})
                </h3>
                <p className="text-xs text-indigo-900/90">
                  Your subscription is verified and your stall menu is live for students.
                </p>
              </div>

              <div className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-black text-xs text-center shrink-0 tabular-nums">
                <span className="block text-lg font-display leading-tight">{daysRemaining}</span>
                <span className="text-[10px] uppercase tracking-wider font-bold">Days Left</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-indigo-100">
              <div className="p-3 bg-white/90 rounded-xl border border-indigo-100">
                <span className="text-[10px] text-stone-500 font-bold uppercase block">
                  Active Plan
                </span>
                <span className="text-xs font-black text-stone-900 mt-0.5 block">
                  {subscription?.plan === 'weekly'
                    ? `Weekly (₱${weeklyPrice} / ${weeklyDays} days)`
                    : `Monthly (₱${monthlyPrice})`}
                </span>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-indigo-100">
                <span className="text-[10px] text-stone-500 font-bold uppercase block">
                  Expiration Date
                </span>
                <span className="text-xs font-black text-stone-900 mt-0.5 block">
                  {subscription
                    ? new Date(subscription.expirationDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-indigo-100">
                <span className="text-[10px] text-stone-500 font-bold uppercase block">
                  Renewal Due Date
                </span>
                <span className="text-xs font-black text-indigo-800 mt-0.5 block">
                  {subscription
                    ? new Date(subscription.nextDueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Pending Payment Alert */}
        {pendingPayment && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black text-amber-950">
                Pending Verification (Ref: {pendingPayment.referenceNumber})
              </h4>
              <p className="text-[11px] leading-relaxed">
                Submitted ₱{pendingPayment.amount} ({pendingPayment.plan} plan) on{' '}
                {new Date(pendingPayment.submittedAt).toLocaleDateString()}. Access activates once reviewed and approved by an administrator.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Choose Subscription Plan */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-stone-900 font-display">
            1. Choose Subscription Plan
          </h2>
          <span className="text-xs text-stone-500 font-medium">Admin-configured pricing</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings?.plans.weekly.isEnabled !== false && (
            <button
              type="button"
              onClick={() => setSelectedPlan('weekly')}
              className={`text-left p-5 rounded-3xl border-2 transition cursor-pointer flex flex-col justify-between ${
                selectedPlan === 'weekly'
                  ? 'border-orange-500 bg-orange-50/40 shadow-xs'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black uppercase tracking-wider">
                    {settings?.plans.weekly.name || 'Weekly Plan'}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === 'weekly'
                        ? 'border-orange-600 bg-orange-600 text-white'
                        : 'border-stone-300'
                    }`}
                  >
                    {selectedPlan === 'weekly' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline gap-1 tabular-nums">
                    <span className="text-3xl font-black text-stone-900 font-display">
                      ₱{weeklyPrice}
                    </span>
                    <span className="text-xs font-bold text-stone-500">/ {weeklyDays} days</span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">
                    {settings?.plans.weekly.description ||
                      `Full cafeteria stall access for ${weeklyDays} days from verification approval.`}
                  </p>
                </div>
              </div>
            </button>
          )}

          {settings?.plans.monthly.isEnabled !== false && (
            <button
              type="button"
              onClick={() => setSelectedPlan('monthly')}
              className={`text-left p-5 rounded-3xl border-2 transition cursor-pointer flex flex-col justify-between ${
                selectedPlan === 'monthly'
                  ? 'border-orange-500 bg-orange-50/40 shadow-xs'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                      {settings?.plans.monthly.name || 'Monthly Plan'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      Recommended
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === 'monthly'
                        ? 'border-orange-600 bg-orange-600 text-white'
                        : 'border-stone-300'
                    }`}
                  >
                    {selectedPlan === 'monthly' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline gap-1 tabular-nums">
                    <span className="text-3xl font-black text-stone-900 font-display">
                      ₱{monthlyPrice}
                    </span>
                    <span className="text-xs font-bold text-stone-500">
                      /{' '}
                      {settings?.plans.monthly.billingCycle === 'exact_30_days'
                        ? '30 days'
                        : 'calendar month'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">
                    {settings?.plans.monthly.description ||
                      'Full monthly merchant portal access, photo preservation, and sales tracking.'}
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 4. Payment Instructions */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900 font-display">
              2. Official Payment Instructions
            </h2>
            <p className="text-xs text-stone-500">
              Configured by the platform administrator.
            </p>
          </div>

          <div className="text-right tabular-nums">
            <span className="text-[10px] font-bold text-stone-400 block uppercase">Amount Due</span>
            <span className="text-lg sm:text-xl font-black text-orange-600 font-display">
              ₱{currentPlanAmount}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 p-1 bg-stone-100 rounded-2xl text-xs font-bold text-stone-600">
          {settings?.gcash.isEnabled !== false && (
            <button
              type="button"
              onClick={() => setSelectedMethod('gcash')}
              className={`min-h-[42px] rounded-xl transition flex items-center justify-center gap-1.5 ${
                selectedMethod === 'gcash'
                  ? 'bg-white text-stone-900 shadow-2xs font-black'
                  : 'hover:text-stone-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>GCash</span>
            </button>
          )}

          {settings?.bank.isEnabled !== false && (
            <button
              type="button"
              onClick={() => setSelectedMethod('bank')}
              className={`min-h-[42px] rounded-xl transition flex items-center justify-center gap-1.5 ${
                selectedMethod === 'bank'
                  ? 'bg-white text-stone-900 shadow-2xs font-black'
                  : 'hover:text-stone-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bank Transfer</span>
            </button>
          )}

          {settings?.qrCode.isEnabled !== false && (
            <button
              type="button"
              onClick={() => setSelectedMethod('qr')}
              className={`min-h-[42px] rounded-xl transition flex items-center justify-center gap-1.5 ${
                selectedMethod === 'qr'
                  ? 'bg-white text-stone-900 shadow-2xs font-black'
                  : 'hover:text-stone-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-purple-600" />
              <span>QR Code</span>
            </button>
          )}
        </div>

        {selectedMethod === 'gcash' && (
          <div className="p-4 sm:p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-blue-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold block uppercase">
                    Account Name
                  </span>
                  <span className="text-sm font-black text-stone-900">
                    {settings?.gcash.accountName || 'Not configured yet'}
                  </span>
                </div>
                {settings?.gcash.accountName && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(settings.gcash.accountName, 'gcash_name')}
                    className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                    title="Copy Name"
                  >
                    {copiedField === 'gcash_name' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              <div className="p-3 bg-white rounded-xl border border-blue-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold block uppercase">
                    GCash Number
                  </span>
                  <span className="text-sm font-black text-blue-700 font-mono">
                    {settings?.gcash.accountNumber || 'Not configured yet'}
                  </span>
                </div>
                {settings?.gcash.accountNumber && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(settings.gcash.accountNumber, 'gcash_num')}
                    className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                    title="Copy Number"
                  >
                    {copiedField === 'gcash_num' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-blue-900/80 leading-relaxed">
              {settings?.gcash.instructions ||
                'Send the exact amount and keep a screenshot showing the reference number.'}
            </p>
          </div>
        )}

        {selectedMethod === 'bank' && (
          <div className="p-4 sm:p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-emerald-200/60">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">
                  Bank Name
                </span>
                <span className="text-xs sm:text-sm font-black text-stone-900 block mt-0.5">
                  {settings?.bank.bankName || 'Not configured'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-200/60">
                <span className="text-[10px] text-stone-400 font-bold block uppercase">
                  Account Holder
                </span>
                <span className="text-xs sm:text-sm font-black text-stone-900 block mt-0.5">
                  {settings?.bank.accountHolder || 'Not configured'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold block uppercase">
                    Account Number
                  </span>
                  <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono block mt-0.5">
                    {settings?.bank.accountNumber || 'Not configured'}
                  </span>
                </div>
                {settings?.bank.accountNumber && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(settings.bank.accountNumber, 'bank_num')}
                    className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                    title="Copy Number"
                  >
                    {copiedField === 'bank_num' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-emerald-950/80 leading-relaxed">
              {settings?.bank.instructions ||
                'Transfer exact amount and include your stall name in the transfer remarks.'}
            </p>
          </div>
        )}

        {selectedMethod === 'qr' && (
          <div className="p-4 sm:p-5 bg-purple-50/50 rounded-2xl border border-purple-100">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="shrink-0">
                <div className="w-48 h-48 sm:w-52 sm:h-52 bg-white p-3 rounded-2xl border-2 border-purple-200 shadow-sm flex items-center justify-center overflow-hidden">
                  {settings?.qrCode.imageUrl ? (
                    <img
                      src={settings.qrCode.imageUrl}
                      alt="Official Payment QR"
                      className="w-full h-full object-contain cursor-pointer"
                      onClick={() => setPreviewModalImg(settings.qrCode.imageUrl)}
                    />
                  ) : (
                    <div className="text-center text-stone-400 p-4">
                      <QrCode className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                      <span className="text-xs">QR Code configured by Admin</span>
                    </div>
                  )}
                </div>

                {settings?.qrCode.imageUrl && (
                  <a
                    href={settings.qrCode.imageUrl}
                    download="Cafeteria_Payment_QR"
                    className="mt-2 w-full min-h-[38px] px-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 flex items-center justify-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR</span>
                  </a>
                )}
              </div>

              <div className="space-y-2.5 flex-1">
                <h3 className="text-base font-black text-stone-900 font-display">
                  Scan to Pay ₱{currentPlanAmount}
                </h3>
                <p className="text-xs text-purple-900 leading-relaxed">
                  {settings?.qrCode.instructions ||
                    'Scan using GCash, Maya, or any bank app and save your transaction screenshot.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Submit / Resubmit Payment Proof Form */}
      <form
        id="payment-proof-form"
        onSubmit={handleSubmitPayment}
        className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900 font-display">
              {resubmitPaymentId
                ? '3. Update & Resubmit Payment Proof'
                : '3. Submit Proof of Payment'}
            </h2>
            <p className="text-xs text-stone-500">
              All submitted receipts receive <strong className="text-amber-700">Pending Verification</strong> status until approved.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {resubmitPaymentId && (
              <button
                type="button"
                onClick={() => {
                  setResubmitPaymentId(null);
                  setReferenceNumber('');
                  setPaymentNotes('');
                }}
                className="text-xs font-bold text-stone-500 hover:text-stone-900 px-2.5 py-1 rounded-lg border border-stone-200"
              >
                Cancel Resubmit
              </button>
            )}
            <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-800 text-xs font-black border border-orange-200 tabular-nums">
              {selectedPlan === 'weekly' ? `Weekly (₱${weeklyPrice})` : `Monthly (₱${monthlyPrice})`}
            </span>
          </div>
        </div>

        {submitError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {submitSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{submitSuccess}</span>
          </div>
        )}

        {/* Receipt Screenshot Upload */}
        <div>
          <label className="block font-black text-stone-800 text-xs mb-1.5">
            {resubmitPaymentId
              ? 'Upload Updated Receipt Screenshot (Optional if keeping existing receipt)'
              : 'Upload Receipt Screenshot / Photo *'}
          </label>

          <div className="border-2 border-dashed border-stone-300 hover:border-orange-500 rounded-2xl p-4 sm:p-6 text-center transition bg-stone-50/50 hover:bg-orange-50/20 relative">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleReceiptFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />

            {proofPreview ? (
              <div className="flex flex-col items-center gap-2 relative z-20">
                <img
                  src={proofPreview}
                  alt="Receipt Preview"
                  className="max-h-48 rounded-xl object-contain border border-stone-200 shadow-2xs cursor-pointer"
                  onClick={() => setPreviewModalImg(proofPreview)}
                />
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Receipt ready — click anywhere outside image to replace</span>
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mx-auto text-orange-600">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-orange-600">Click to upload</span>
                  <span className="text-stone-500"> or drag and drop receipt image</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  PNG, JPG, or WEBP up to 15MB. Stored privately for administrator verification.
                </p>
              </div>
            )}
          </div>

          {proofError && <p className="text-xs text-rose-600 mt-1 font-medium">{proofError}</p>}
        </div>

        {/* Reference Number & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-black text-stone-800 mb-1">
              Transaction Reference Number / ID *
            </label>
            <input
              type="text"
              required
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Enter reference number from receipt"
              className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-stone-900"
            />
          </div>

          <div>
            <label className="block font-black text-stone-800 mb-1">Payment Date *</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-stone-900"
            />
          </div>
        </div>

        {resubmitPaymentId && (
          <div className="text-xs">
            <label className="block font-black text-stone-800 mb-1">
              Clarification / Notes for Administrator
            </label>
            <textarea
              rows={2}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Provide requested details or correction notes..."
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[46px] bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>
            {isSubmitting
              ? 'Submitting Payment Proof...'
              : resubmitPaymentId
              ? 'Resubmit Updated Payment for Verification'
              : `Submit ₱${currentPlanAmount} Payment for Verification`}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* 6. Payment History */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-base font-black text-stone-900 font-display">
              Payment Submission History
            </h3>
            <p className="text-xs text-stone-500">Verification records for {activeStall}</p>
          </div>
          <span className="text-xs text-stone-500 font-bold tabular-nums">
            {paymentHistory.length} record(s)
          </span>
        </div>

        {paymentHistory.length === 0 ? (
          <div className="text-center py-8 text-stone-400 text-xs">
            <FileText className="w-8 h-8 mx-auto mb-1 text-stone-300 stroke-[1.5]" />
            <span>No payment records submitted for this stall yet.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 text-[10px] uppercase font-black tracking-wider">
                  <th className="py-2.5 px-2">Submitted</th>
                  <th className="py-2.5 px-2">Plan</th>
                  <th className="py-2.5 px-2">Method</th>
                  <th className="py-2.5 px-2">Reference No.</th>
                  <th className="py-2.5 px-2">Amount</th>
                  <th className="py-2.5 px-2">Receipt</th>
                  <th className="py-2.5 px-2">Status & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {paymentHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3 px-2 font-medium whitespace-nowrap">
                      {new Date(item.submittedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-2 capitalize font-bold text-stone-900">{item.plan}</td>
                    <td className="py-3 px-2 uppercase font-mono text-[11px] font-bold text-stone-600">
                      {item.paymentMethod}
                    </td>
                    <td className="py-3 px-2 font-mono text-stone-900 font-bold">
                      {item.referenceNumber}
                    </td>
                    <td className="py-3 px-2 font-black text-stone-900 font-display">
                      ₱{item.amount}
                    </td>
                    <td className="py-3 px-2">
                      {item.proofImageUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewModalImg(item.proofImageUrl)}
                          className="text-[11px] font-bold text-orange-600 hover:underline"
                        >
                          View Receipt
                        </button>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {item.status === 'Approved' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved</span>
                        </span>
                      ) : item.status === 'Rejected' ? (
                        <div className="space-y-0.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                          {item.rejectionReason && (
                            <span className="block text-[11px] text-rose-700 max-w-xs">
                              {item.rejectionReason}
                            </span>
                          )}
                        </div>
                      ) : item.status === 'Requires Additional Information' ? (
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black inline-flex items-center gap-1 border border-amber-300">
                            <AlertCircle className="w-3 h-3" />
                            <span>Requires Additional Info</span>
                          </span>
                          {item.requestedInfoMessage && (
                            <span className="block text-[11px] text-amber-800 max-w-xs">
                              {item.requestedInfoMessage}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartResubmit(item)}
                            className="block text-[11px] font-black text-orange-600 hover:underline"
                          >
                            Update & Resubmit →
                          </button>
                        </div>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Pending Verification</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proof / QR Lightbox Modal */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewModalImg(null)}
        >
          <div
            className="max-w-xl w-full max-h-[85vh] bg-white rounded-3xl p-4 overflow-hidden relative shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h4 className="text-xs font-black text-stone-900">Receipt / Payment Preview</h4>
              <button
                type="button"
                onClick={() => setPreviewModalImg(null)}
                className="min-h-[36px] px-3 rounded-lg text-stone-500 hover:text-stone-900 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center">
              {previewModalImg.startsWith('/api/') ? (
                <ProtectedReceiptImage
                  src={previewModalImg}
                  alt="Submitted Payment Receipt"
                  className="max-w-full max-h-[65vh] object-contain rounded-xl"
                />
              ) : (
                <img
                  src={previewModalImg}
                  alt="Preview"
                  className="max-w-full max-h-[65vh] object-contain rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
