import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Store,
  Sparkles,
  Phone,
  FileText
} from 'lucide-react';
import {
  DishItem,
  StallCredential,
  TranslationDictionary,
  AppPage,
  StallOwnerAccount
} from '../../types';
import { MerchantDashboard } from '../MerchantDashboard';
import {
  loginStallOwnerAPI,
  registerStallOwnerAPI,
  forgotPasswordAPI,
  fetchCampusStallTemplatesAPI,
  CampusTemplate
} from '../../services/api';
import { getAuthOwner } from '../../utils/authStore';

interface StallPortalPageProps {
  authenticatedStall: string | null;
  onAuthenticate: (stallName: string, owner?: StallOwnerAccount) => void;
  onLogout: () => void;
  items: DishItem[];
  stallNotices: Record<string, string>;
  onSaveNotice: (notice: string) => void;
  onToggleStock: (id: number) => void;
  onUpdatePrice: (id: number, delta: number) => void;
  onAddItem: (item: Omit<DishItem, 'id' | 'clicks'>) => void;
  onUpdateItem: (id: number, updates: Partial<DishItem>) => void;
  onToggleHideItem: (id: number) => void;
  onDeleteItem?: (id: number, deleteImagePermanently?: boolean) => Promise<boolean>;
  onRestoreItem?: (archiveId: string) => Promise<boolean>;
  onBatchSaved?: (items: DishItem[]) => void;
  stalls: StallCredential[];
  onNavigate: (page: AppPage) => void;
  t: TranslationDictionary;
}

export const StallPortalPage: React.FC<StallPortalPageProps> = ({
  authenticatedStall,
  onAuthenticate,
  onLogout,
  items,
  stallNotices,
  onSaveNotice,
  onToggleStock,
  onUpdatePrice,
  onAddItem,
  onUpdateItem,
  onToggleHideItem,
  onDeleteItem,
  onRestoreItem,
  onBatchSaved,
  stalls,
  onNavigate,
  t
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [currentOwner, setCurrentOwner] = useState<StallOwnerAccount | null>(() => getAuthOwner());

  useEffect(() => {
    const authOwner = getAuthOwner();
    if (authenticatedStall && authOwner && authOwner.stallName === authenticatedStall) {
      setCurrentOwner(authOwner);
    } else if (!authenticatedStall) {
      setCurrentOwner(null);
    }
  }, [authenticatedStall]);

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Quick PIN login toggle
  const [usePinLogin, setUsePinLogin] = useState(false);
  const [quickStallName, setQuickStallName] = useState(stalls[0]?.name || '');
  const [quickPin, setQuickPin] = useState('');

  // Campus templates for registration
  const [campusTemplates, setCampusTemplates] = useState<CampusTemplate[]>([]);
  const [regMode, setRegMode] = useState<'custom' | 'template'>('custom');
  const [selectedTemplateName, setSelectedTemplateName] = useState('');

  // Registration Form State
  const [regStallNo, setRegStallNo] = useState('');
  const [regStallName, setRegStallName] = useState('');
  const [regZone, setRegZone] = useState<'outside' | 'inside'>('outside');
  const [regDescription, setRegDescription] = useState('');
  const [regContactInfo, setRegContactInfo] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regConfirmPin, setRegConfirmPin] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegPin, setShowRegPin] = useState(false);

  // Forgot Password Form State
  const [forgotStallName, setForgotStallName] = useState(stalls[0]?.name || '');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPin, setForgotPin] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  useEffect(() => {
    if (stalls.length > 0) {
      if (!stalls.some((s) => s.name === quickStallName)) {
        setQuickStallName(stalls[0].name);
      }
      if (!stalls.some((s) => s.name === forgotStallName)) {
        setForgotStallName(stalls[0].name);
      }
    }
  }, [stalls, quickStallName, forgotStallName]);

  useEffect(() => {
    if (authMode === 'register') {
      fetchCampusStallTemplatesAPI().then((list) => {
        const unclaimed = list.filter((tpl) => !tpl.isRegistered);
        setCampusTemplates(unclaimed);
        if (unclaimed.length > 0 && !selectedTemplateName) {
          setSelectedTemplateName(unclaimed[0].name);
        }
      });
    }
  }, [authMode]);

  const handleSelectTemplate = (templateName: string) => {
    setSelectedTemplateName(templateName);
    const tpl = campusTemplates.find((c) => c.name === templateName);
    if (tpl) {
      setRegStallNo(tpl.stallNo);
      setRegStallName(tpl.name);
      setRegZone(tpl.zone);
    }
  };

  // If already authenticated, show the full Merchant Dashboard
  if (authenticatedStall) {
    return (
      <MerchantDashboard
        stallName={authenticatedStall}
        items={items}
        stallNotice={stallNotices[authenticatedStall] || ''}
        onSaveNotice={onSaveNotice}
        onToggleStock={onToggleStock}
        onUpdatePrice={onUpdatePrice}
        onAddItem={onAddItem}
        onUpdateItem={onUpdateItem}
        onToggleHideItem={onToggleHideItem}
        onDeleteItem={onDeleteItem}
        onRestoreItem={onRestoreItem}
        onBatchSaved={onBatchSaved}
        onLogout={() => {
          setCurrentOwner(null);
          onLogout();
        }}
        ownerProfile={currentOwner}
        onUpdateOwnerProfile={(updated) => {
          setCurrentOwner(updated);
        }}
        t={t}
      />
    );
  }

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      if (usePinLogin) {
        if (!quickStallName) {
          setErrorMsg('Please select a registered cafeteria stall.');
          setIsSubmitting(false);
          return;
        }
        const result = await loginStallOwnerAPI({
          stall: quickStallName,
          pin: quickPin
        });

        if (result.success && result.owner) {
          setCurrentOwner(result.owner);
          setQuickPin('');
          onAuthenticate(result.owner.stallName, result.owner);
        } else {
          setErrorMsg(result.error || 'Incorrect security PIN for this stall.');
        }
      } else {
        if (!loginIdentifier.trim() || !loginPassword) {
          setErrorMsg('Please enter your username/email and password.');
          setIsSubmitting(false);
          return;
        }

        const result = await loginStallOwnerAPI({
          identifier: loginIdentifier.trim(),
          password: loginPassword
        });

        if (result.success && result.owner) {
          setCurrentOwner(result.owner);
          setLoginPassword('');
          onAuthenticate(result.owner.stallName, result.owner);
        } else {
          setErrorMsg(result.error || 'Invalid credentials.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const chosenTemplate =
      regMode === 'template'
        ? campusTemplates.find((c) => c.name === selectedTemplateName)
        : undefined;

    const finalStallName = chosenTemplate ? chosenTemplate.name : regStallName.trim();
    const finalStallNo = chosenTemplate
      ? chosenTemplate.stallNo
      : regStallNo.trim() || undefined;
    const finalZone = chosenTemplate ? chosenTemplate.zone : regZone;

    if (!finalStallName || finalStallName.length < 2) {
      setErrorMsg('Please enter your stall name or select an available campus stall.');
      return;
    }

    if (!regOwnerName.trim() || !regContactInfo.trim() || !regDescription.trim()) {
      setErrorMsg('Please complete owner name, contact information, and stall description.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (!/^\d{4,6}$/.test(regPin)) {
      setErrorMsg('Security PIN must be 4–6 digits.');
      return;
    }

    if (regPin !== regConfirmPin) {
      setErrorMsg('Security PINs do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerStallOwnerAPI({
        stallNo: finalStallNo,
        stallName: finalStallName,
        zone: finalZone,
        description: regDescription.trim(),
        contactInfo: regContactInfo.trim(),
        ownerName: regOwnerName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
        pin: regPin,
        useCampusTemplateName: chosenTemplate ? chosenTemplate.name : undefined
      });

      if (result.success && result.owner) {
        setCurrentOwner(result.owner);
        setRegPassword('');
        setRegConfirmPassword('');
        setRegPin('');
        setRegConfirmPin('');
        onAuthenticate(result.owner.stallName, result.owner);
      } else {
        setErrorMsg(result.error || 'Failed to register stall owner account.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Forgot Password Submit
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!forgotStallName) {
      setErrorMsg('Please enter or select your stall name.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    if (forgotNewPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await forgotPasswordAPI({
        stallName: forgotStallName,
        email: forgotEmail.trim() || undefined,
        pin: forgotPin,
        newPassword: forgotNewPassword
      });

      if (result.success) {
        setSuccessMsg(result.message || 'Password reset successfully. Please sign in.');
        setAuthMode('login');
        setLoginPassword('');
        setForgotPin('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      } else {
        setErrorMsg(result.error || 'Failed to reset password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Reset failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8 space-y-6 animate-fade-in">
      {/* Portal Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 text-xs font-black uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
          <span>Cafeteria Merchant Portal</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display">
          {authMode === 'login' && 'Stall Owner Sign In'}
          {authMode === 'register' && 'Register Cafeteria Stall'}
          {authMode === 'forgot' && 'Reset Stall Password'}
        </h1>

        <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
          {authMode === 'login' &&
            'Sign in to manage your stall menu, prices, food photos, sales records, and subscription billing.'}
          {authMode === 'register' &&
            'Create your merchant account and start your complimentary 14-day free trial automatically upon registration.'}
          {authMode === 'forgot' &&
            'Verify your stall identity using your registered stall, email, and 4–6 digit security PIN.'}
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-orange-100 p-6 sm:p-8 shadow-sm space-y-5">
        {authMode !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl border border-stone-200 text-xs font-bold text-stone-600">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`min-h-[44px] rounded-xl transition flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-white text-stone-900 shadow-2xs font-black'
                  : 'hover:text-stone-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`min-h-[44px] rounded-xl transition flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-white text-stone-900 shadow-2xs font-black'
                  : 'hover:text-stone-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Stall</span>
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORM 1: LOGIN */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            {!usePinLogin ? (
              <>
                <div>
                  <label className="block font-black text-stone-800 mb-1">
                    Username or Email Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter your stall username or email"
                    className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium text-stone-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-black text-stone-800">Password *</label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full min-h-[44px] text-xs sm:text-sm pl-3 pr-10 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-stone-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block font-black text-stone-800 mb-1">
                    Select Registered Cafeteria Stall *
                  </label>
                  {stalls.length === 0 ? (
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-500 text-xs">
                      No stalls are registered yet. Switch to Register Stall to create the first stall account.
                    </div>
                  ) : (
                    <select
                      value={quickStallName}
                      onChange={(e) => setQuickStallName(e.target.value)}
                      className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-800"
                    >
                      {stalls.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name} ({s.zone === 'outside' ? 'Outside Canopy' : 'Inside Hall'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-black text-stone-800 mb-1">
                    Security PIN (4–6 Digits) *
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={quickPin}
                    onChange={(e) => setQuickPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter your stall security PIN"
                    className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl font-mono tracking-widest text-stone-900"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || (usePinLogin && stalls.length === 0)}
              className="w-full min-h-[46px] bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Stall Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setUsePinLogin(!usePinLogin);
                  setErrorMsg('');
                }}
                className="text-orange-600 font-bold hover:underline"
              >
                {usePinLogin ? '← Switch to Username / Password Login' : 'Switch to Registered Stall + PIN Login'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMsg('');
                }}
                className="text-stone-700 font-bold hover:underline"
              >
                Need an account? Register Stall
              </button>
            </div>
          </form>
        )}

        {/* FORM 2: REGISTER STALL OWNER */}
        {authMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>14-Day Free Trial Included:</strong> Upon registering your stall, your complimentary 14-day trial activates automatically so you can publish your menu to students right away.
              </p>
            </div>

            {/* Choose Custom Stall vs Claim Campus Template */}
            {campusTemplates.length > 0 && (
              <div className="space-y-2">
                <label className="block font-black text-stone-800">Registration Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRegMode('custom');
                      setRegStallName('');
                      setRegStallNo('');
                    }}
                    className={`min-h-[42px] px-3 rounded-xl border text-xs font-bold transition ${
                      regMode === 'custom'
                        ? 'border-orange-500 bg-orange-50 text-orange-800'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    New Custom Stall
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegMode('template');
                      if (campusTemplates[0]) {
                        handleSelectTemplate(campusTemplates[0].name);
                      }
                    }}
                    className={`min-h-[42px] px-3 rounded-xl border text-xs font-bold transition ${
                      regMode === 'template'
                        ? 'border-orange-500 bg-orange-50 text-orange-800'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Claim Campus Stall ({campusTemplates.length})
                  </button>
                </div>
              </div>
            )}

            {regMode === 'template' && campusTemplates.length > 0 ? (
              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Available Campus Cafeteria Stall *
                </label>
                <select
                  value={selectedTemplateName}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-800"
                >
                  {campusTemplates.map((tpl) => (
                    <option key={tpl.name} value={tpl.name}>
                      {tpl.stallNo} — {tpl.officialName} ({tpl.zone === 'outside' ? 'Outside Canopy' : 'Inside Hall'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-black text-stone-800 mb-1">
                    Stall Name *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regStallName}
                      onChange={(e) => setRegStallName(e.target.value)}
                      placeholder="e.g. Ate Minda's Lutong Bahay"
                      className="w-full min-h-[44px] pl-9 pr-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-black text-stone-800 mb-1">
                    Cafeteria Zone *
                  </label>
                  <select
                    value={regZone}
                    onChange={(e) => setRegZone(e.target.value as 'outside' | 'inside')}
                    className="w-full min-h-[44px] px-3 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-800"
                  >
                    <option value="outside">Outside Canopy</option>
                    <option value="inside">Inside Cafeteria Hall</option>
                  </select>
                </div>
              </div>
            )}

            {/* Owner Full Name & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Owner / Manager Name *
                </label>
                <input
                  type="text"
                  required
                  value={regOwnerName}
                  onChange={(e) => setRegOwnerName(e.target.value)}
                  placeholder="Full name of stall owner"
                  className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-stone-900"
                />
              </div>

              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Contact Information *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regContactInfo}
                    onChange={(e) => setRegContactInfo(e.target.value)}
                    placeholder="Mobile no. or Messenger"
                    className="w-full min-h-[44px] text-xs sm:text-sm pl-9 pr-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-stone-900"
                  />
                </div>
              </div>
            </div>

            {/* Stall Description */}
            <div>
              <label className="block font-black text-stone-800 mb-1">
                Stall Description & Specialty *
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <textarea
                  required
                  rows={2}
                  value={regDescription}
                  onChange={(e) => setRegDescription(e.target.value)}
                  placeholder="Describe your specialties, operating hours, or meal offerings for students..."
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-stone-900"
                />
              </div>
            </div>

            {/* Username & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-black text-stone-800 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Choose a unique username"
                  className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-stone-900"
                />
              </div>

              <div>
                <label className="block font-black text-stone-800 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="owner@example.com"
                  className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900"
                />
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-black text-stone-800">Password *</label>
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="text-[11px] text-stone-500 hover:text-stone-800"
                  >
                    {showRegPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900"
                />
              </div>

              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Confirm Password *
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900"
                />
              </div>
            </div>

            {/* 4-6 Digit Security PIN */}
            <div className="p-3.5 bg-orange-50/70 rounded-2xl border border-orange-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-950 block">
                  Security PIN (4–6 Digits)
                </span>
                <button
                  type="button"
                  onClick={() => setShowRegPin(!showRegPin)}
                  className="text-[11px] text-orange-700 font-bold"
                >
                  {showRegPin ? 'Hide PIN' : 'Show PIN'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Create 4–6 Digit PIN *
                  </label>
                  <input
                    type={showRegPin ? 'text' : 'password'}
                    required
                    maxLength={6}
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="4–6 numeric digits"
                    className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono tracking-widest text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Confirm PIN *</label>
                  <input
                    type={showRegPin ? 'text' : 'password'}
                    required
                    maxLength={6}
                    value={regConfirmPin}
                    onChange={(e) => setRegConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Re-enter PIN"
                    className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono tracking-widest text-stone-900"
                  />
                </div>
              </div>

              <span className="text-[11px] text-stone-500 block leading-tight">
                Used to authorize profile changes and reset your password. Hashed securely on the server.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[46px] bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Creating Account & Starting Trial...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register Stall & Start 14-Day Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-xs text-orange-600 font-bold hover:underline"
              >
                Already registered? Sign In
              </button>
            </div>
          </form>
        )}

        {/* FORM 3: FORGOT PASSWORD RESET */}
        {authMode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              Verify your identity using your registered stall, email address, and 4–6 digit security PIN.
            </div>

            <div>
              <label className="block font-black text-stone-800 mb-1">
                Registered Stall *
              </label>
              {stalls.length > 0 ? (
                <select
                  value={forgotStallName}
                  onChange={(e) => setForgotStallName(e.target.value)}
                  className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-800"
                >
                  {stalls.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={forgotStallName}
                  onChange={(e) => setForgotStallName(e.target.value)}
                  placeholder="Enter exact registered stall name"
                  className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-900"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Registered Email (Recommended)
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="owner@example.com"
                  className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                />
              </div>

              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Security PIN *
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={forgotPin}
                  onChange={(e) => setForgotPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="4–6 digit PIN"
                  className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl font-mono tracking-widest text-stone-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-black text-stone-800 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder="Min. 6 chars"
                  className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block font-black text-stone-800 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full min-h-[44px] text-xs sm:text-sm px-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[46px] bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <span>Reset Password & Proceed to Sign In</span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-xs text-stone-600 hover:text-stone-900 font-bold hover:underline"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Student Return Prompt */}
      <div className="text-center p-4 bg-white/60 rounded-2xl border border-orange-100/60 space-y-1 text-xs">
        <p className="text-stone-500">
          Are you a student looking for meals within your budget?
        </p>
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="text-orange-600 font-bold hover:text-orange-700 underline"
        >
          Return to Student Meal Discovery (Home)
        </button>
      </div>
    </div>
  );
};
