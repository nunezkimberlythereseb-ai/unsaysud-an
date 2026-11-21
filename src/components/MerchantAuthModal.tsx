import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  LogIn,
  Store
} from 'lucide-react';
import { StallCredential, StallOwnerAccount } from '../types';
import { loginStallOwnerAPI } from '../services/api';

interface MerchantAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  stalls: StallCredential[];
  onLoginSuccess: (stallName: string, owner?: StallOwnerAccount) => void;
  onOpenPortal?: () => void;
}

export const MerchantAuthModal: React.FC<MerchantAuthModalProps> = ({
  isOpen,
  onClose,
  stalls,
  onLoginSuccess,
  onOpenPortal
}) => {
  const [authMethod, setAuthMethod] = useState<'credentials' | 'pin'>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStall, setSelectedStall] = useState(stalls[0]?.name || '');
  const [pin, setPin] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stalls.length > 0 && !stalls.some((s) => s.name === selectedStall)) {
      setSelectedStall(stalls[0].name);
    } else if (stalls.length === 0) {
      setSelectedStall('');
    }
  }, [stalls, selectedStall]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (authMethod === 'credentials') {
      if (!identifier.trim() || !password) {
        setErrorMsg('Please enter your username/email and password.');
        return;
      }

      setLoading(true);
      const res = await loginStallOwnerAPI({
        identifier: identifier.trim(),
        password
      });
      setLoading(false);

      if (res.success && res.owner) {
        setPassword('');
        onLoginSuccess(res.owner.stallName, res.owner);
        onClose();
      } else {
        setErrorMsg(res.error || 'Invalid stall owner credentials.');
      }
      return;
    }

    // PIN authentication mode
    if (!selectedStall) {
      setErrorMsg('Please select a registered stall first.');
      return;
    }
    if (!pin || pin.length < 4) {
      setErrorMsg('Please enter your 4–6 digit security PIN.');
      return;
    }

    setLoading(true);
    const res = await loginStallOwnerAPI({
      stall: selectedStall,
      pin
    });
    setLoading(false);

    if (res.success && res.owner) {
      setPin('');
      onLoginSuccess(res.owner.stallName, res.owner);
      onClose();
    } else {
      setErrorMsg(res.error || 'Incorrect security PIN for this stall.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        id="merchant-auth-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity"
      />

      <div
        id="merchant-auth-card"
        className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200 p-5 space-y-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-lg font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900 font-display">
                Stall Owner Sign In
              </h3>
              <p className="text-[11px] text-stone-500">
                Authorized Cafeteria Merchants
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close stall sign in modal"
            className="min-h-[44px] min-w-[44px] rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-bold text-stone-600">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('credentials');
              setErrorMsg('');
            }}
            className={`min-h-[40px] rounded-lg transition ${
              authMethod === 'credentials'
                ? 'bg-white text-stone-900 shadow-2xs font-black'
                : 'hover:text-stone-900'
            }`}
          >
            Username / Email
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('pin');
              setErrorMsg('');
            }}
            className={`min-h-[40px] rounded-lg transition ${
              authMethod === 'pin'
                ? 'bg-white text-stone-900 shadow-2xs font-black'
                : 'hover:text-stone-900'
            }`}
          >
            Stall + PIN
          </button>
        </div>

        {authMethod === 'credentials' ? (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-stone-700 block">
                Username or Email
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Enter username or email"
                className="w-full min-h-[44px] bg-stone-50 border border-stone-200 text-sm text-stone-900 rounded-xl px-3 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-stone-700 block">Password</label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Enter password"
                  className="w-full min-h-[44px] bg-stone-50 border border-stone-200 text-sm text-stone-900 rounded-xl pl-3 pr-11 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-stone-400 hover:text-stone-700"
                  aria-label={showSecret ? 'Hide password' : 'Show password'}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              id="merchant-login-submit"
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-black text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Sign In to Stall Dashboard'}</span>
            </button>
          </form>
        ) : stalls.length === 0 ? (
          <div className="py-5 text-center space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Store className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-stone-900">No Registered Stalls Available</p>
              <p className="text-[11px] text-stone-500">
                Register your cafeteria stall first in the Stall Owner Portal to receive your 14-day free trial and set a security PIN.
              </p>
            </div>
            {onOpenPortal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPortal();
                }}
                className="w-full min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs transition"
              >
                Open Stall Registration
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 block">
                Select Registered Stall
              </label>
              <select
                id="merchant-stall-select"
                value={selectedStall}
                onChange={(e) => setSelectedStall(e.target.value)}
                className="w-full min-h-[44px] bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 rounded-xl px-3 focus:outline-none focus:border-orange-500 transition"
              >
                {stalls.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.zone === 'outside' ? 'Outside' : 'Inside'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 block">
                Security PIN (4–6 Digits)
              </label>
              <div className="relative">
                <input
                  id="merchant-pin-input"
                  type={showSecret ? 'text' : 'password'}
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ''));
                    setErrorMsg('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                  }}
                  placeholder="••••"
                  className="w-full min-h-[44px] bg-stone-50 border border-stone-200 text-base font-black tracking-widest text-stone-900 rounded-xl px-3 text-center focus:outline-none focus:border-orange-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700"
                  aria-label={showSecret ? 'Hide PIN' : 'Show PIN'}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="min-h-[44px] rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 font-black text-sm transition"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="min-h-[44px] rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 font-bold text-xs transition"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="min-h-[44px] rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 font-black text-sm transition"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="min-h-[44px] rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-bold text-sm transition"
              >
                ⌫
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              id="merchant-login-submit"
              type="button"
              disabled={loading}
              onClick={() => handleSubmit()}
              className="w-full min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-black text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Unlock Stall Dashboard'}</span>
            </button>
          </div>
        )}

        {onOpenPortal && (
          <div className="pt-2 border-t border-stone-100 text-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPortal();
              }}
              className="text-xs font-bold text-orange-600 hover:underline"
            >
              New cafeteria stall? Register for a 14-day free trial →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
