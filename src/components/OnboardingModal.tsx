import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Wallet, 
  Dices, 
  ShoppingBag, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Check,
  Utensils,
  Flame,
  CupSoda,
  Cake,
  Croissant,
  Package,
  Apple,
  Layers,
  UtensilsCrossed,
  RotateCcw
} from 'lucide-react';
import { 
  RiceBowlDoodle, 
  ChickenDoodle, 
  DrinkDoodle, 
  BurgerDoodle, 
  FriesDoodle, 
  TrayDoodle,
  DumplingDoodle,
  UtensilsDoodle
} from './FoodDoodles';
import { FoodCategory } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBudgetPreset?: (budget: number) => void;
}

const OFFICIAL_CATEGORIES: { name: FoodCategory; icon: React.ReactNode }[] = [
  { name: 'Rice Meals', icon: <Utensils className="w-3.5 h-3.5 text-orange-600" /> },
  { name: 'Snacks', icon: <Flame className="w-3.5 h-3.5 text-orange-600" /> },
  { name: 'Drinks', icon: <CupSoda className="w-3.5 h-3.5 text-orange-600" /> },
  { name: 'Desserts', icon: <Cake className="w-3.5 h-3.5 text-orange-600" /> },
  { name: 'Street Food', icon: <Sparkles className="w-3.5 h-3.5 text-orange-600" /> },
  { name: 'Bread & Pastries', icon: <Croissant className="w-3.5 h-3.5 text-orange-600" /> },
  { name: 'Dumplings', icon: <Package className="w-3.5 h-3.5 text-orange-600" /> },
  { name: 'Fruits', icon: <Apple className="w-3.5 h-3.5 text-orange-600" /> },
  { name: 'Other', icon: <Layers className="w-3.5 h-3.5 text-orange-600" /> },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onApplyBudgetPreset
}) => {
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  // Reset to step 1 whenever opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && step < totalSteps) {
        setStep(s => s + 1);
      } else if (e.key === 'ArrowLeft' && step > 1) {
        setStep(s => s - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, totalSteps, onClose]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Dark backdrop */}
      <div 
        id="onboarding-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity"
      />

      {/* Main Modal Card */}
      <div 
        id="onboarding-dialog"
        className="relative z-10 w-full max-w-lg bg-[#FFFDF9] rounded-3xl shadow-2xl border border-orange-100 overflow-hidden flex flex-col max-h-[92vh] animate-fade-in"
      >
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-orange-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-stone-500 font-mono">
              New User Guide • Step {step} of {totalSteps}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-xs font-bold text-stone-400 hover:text-stone-700 px-2 py-1 rounded-lg hover:bg-stone-100 transition"
          >
            Skip
          </button>
        </div>

        {/* Content Body Area */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-4 text-stone-800 flex-1">
          
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="space-y-4 text-center py-1 animate-fade-in">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-orange-500 via-orange-600 to-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20 relative overflow-hidden">
                <RiceBowlDoodle size={48} className="text-white" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 font-display">
                  Welcome to Unsay-Sud-an! 🍱
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 font-medium max-w-sm mx-auto leading-relaxed">
                  Find food that fits your budget before you reach the counter.
                </p>
              </div>

              <div className="p-4 bg-orange-50/80 rounded-2xl border border-orange-200/80 text-left space-y-2 max-w-md mx-auto">
                <div className="flex items-center gap-2 text-xs font-black text-orange-950">
                  <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Unsay-Sud-an helps USTP students:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                    <span>Set a daily budget</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                    <span>Find affordable food</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                    <span>Compare meals & snacks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                    <span>Build a food tray</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                    <span>Check remaining budget</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                    <span>See live availability</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SET YOUR BUDGET */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 font-display">
                    Set Your Budget 💰
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Choose how much you want to spend today.
                  </p>
                </div>
              </div>

              <div className="space-y-2 bg-orange-50/70 p-4 rounded-2xl border border-orange-200/80">
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-950 block">
                  Available Budget Options:
                </span>
                
                <div className="grid grid-cols-5 gap-2">
                  {[25, 40, 55, 75, 100].map((preset) => (
                    <div
                      key={preset}
                      className="py-2.5 rounded-xl font-black text-center text-xs bg-white text-stone-900 border border-orange-200 shadow-2xs font-display tabular-nums"
                    >
                      ₱{preset}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-stone-600 pt-2 leading-relaxed">
                  Tap any quick preset or enter any custom budget up to <strong>₱500</strong>. The app displays meals within your budget and saves your preference even offline.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: FIND YOUR FOOD */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 font-display">
                    Find Your Food 🍜
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Browse food by category, search for a specific item, or explore the available stalls.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-stone-700 px-0.5">
                  Official Cafeteria Food Categories:
                </span>

                <div className="grid grid-cols-3 gap-2">
                  {OFFICIAL_CATEGORIES.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center gap-2 p-2 bg-white rounded-xl border border-stone-200 text-xs font-bold text-stone-800 shadow-2xs"
                    >
                      {c.icon}
                      <span className="truncate">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-stone-500 bg-stone-100 p-2.5 rounded-xl border border-stone-200">
                You can browse by active cafeteria stall, filter by campus zone (Outside Canopy vs Inside Hall), or search by dish name.
              </p>
            </div>
          )}

          {/* STEP 4: SURPRISE ME! */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Dices className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 font-display">
                    Not Sure What to Eat? 🎲
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Choose a food category and let Unsay-Sud-an recommend one available item that fits your budget.
                  </p>
                </div>
              </div>

              {/* Visual preview of Surprise Me card */}
              <div className="p-4 bg-orange-50/90 rounded-2xl border border-orange-200 text-left space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-orange-900">Example Budget Match:</span>
                  <span className="text-xs font-black text-stone-900 font-display tabular-nums">₱45</span>
                </div>

                <div className="text-sm font-black text-stone-900 font-display">
                  Sample Rice Meal within ₱55 Budget
                </div>
                <div className="text-xs text-stone-600 font-medium">
                  Active Cafeteria Stall • Rice Meals
                </div>

                <div className="bg-white/90 p-2 rounded-xl border border-orange-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
                  <span>Remaining Sukli:</span>
                  <span className="tabular-nums">₱10 remaining from ₱55</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
                <span className="font-bold text-stone-900 block">Strict Fairness Rules:</span>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  <li>Respects your selected category first</li>
                  <li>Strictly fits your budget amount</li>
                  <li>Recommends only in-stock (Available) food</li>
                  <li>Never invents food, fake prices, or offline stalls</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 5: BUILD YOUR TRAY */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 font-display">
                    Build Your Tray 🛒
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Add the food you want and see your total before ordering.
                  </p>
                </div>
              </div>

              {/* Example Tutorial Calculation Card (Visual only) */}
              <div className="p-4 bg-white rounded-2xl border border-orange-200/90 shadow-2xs space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-950 block">
                  Example Budget Split:
                </span>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200">
                    <span className="text-[10px] text-stone-500 font-bold block uppercase">Your Budget</span>
                    <span className="text-base font-black text-stone-900 font-display">₱55</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] text-stone-500 font-bold block uppercase">Spent</span>
                    <span className="text-base font-black text-orange-700 font-display">₱40</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] text-stone-500 font-bold block uppercase">Remaining</span>
                    <span className="text-base font-black text-emerald-700 font-display">₱15</span>
                  </div>
                </div>

                <p className="text-[11px] text-stone-500 text-center italic">
                  * Example calculation for preview only. Does not alter your actual tray.
                </p>
              </div>

              <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                📋 You can also copy your order list with one tap to show your classmate or review your order slip before queuing.
              </p>
            </div>
          )}

          {/* STEP 6: CHECK AVAILABILITY */}
          {step === 6 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 font-display">
                    Check Availability
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    See whether your chosen food is Available or Sold Out before heading to the stall.
                  </p>
                </div>
              </div>

              {/* Status Comparison Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-emerald-800 text-xs">
                    <span>Available</span>
                  </div>
                  <p className="text-[11px] text-emerald-700/90 leading-snug">
                    In stock! Can be added to your tray and recommended in Surprise Me.
                  </p>
                </div>

                <div className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-rose-800 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>● Sold Out</span>
                  </div>
                  <p className="text-[11px] text-rose-700/90 leading-snug">
                    Temporarily out of stock. Cannot be added to tray or recommended.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-xs text-stone-600">
                <span className="font-bold text-stone-900">🛡️ Live Stall Updates:</span>
                <p className="text-[11px] leading-relaxed pt-0.5">
                  Cafeteria stall owners update their dish availability directly through their Stall Portal so you never waste time in line.
                </p>
              </div>
            </div>
          )}

          {/* STEP 7: YOU'RE READY! */}
          {step === 7 && (
            <div className="space-y-4 text-center py-2 animate-fade-in">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <span className="text-3xl sm:text-4xl">🎉</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 font-display">
                  You're Ready! 🎉
                </h3>
                <p className="text-xs sm:text-sm text-stone-700 font-medium max-w-sm mx-auto leading-relaxed">
                  Set your budget, find your food, build your tray, and enjoy your meal without going over budget.
                </p>
              </div>

              <div className="p-3.5 bg-orange-50/70 rounded-2xl border border-orange-200 text-xs text-stone-700 max-w-sm mx-auto space-y-2">
                <div className="font-black text-orange-950 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span>Ready to explore USTP CDO Cafeteria?</span>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[11px] text-stone-500 hover:text-stone-800 font-semibold underline block mx-auto pt-1"
                >
                  View Guide Again Later
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Bar */}
        <div className="px-5 py-3.5 bg-stone-50/90 border-t border-orange-100 flex items-center justify-between gap-3">
          
          {/* Progress Indicator Dots: ● ○ ○ ○ ○ ○ ○ */}
          <div className="flex items-center gap-1.5" aria-label={`Step ${step} of ${totalSteps}`}>
            {Array.from({ length: totalSteps }).map((_, i) => {
              const dotIndex = i + 1;
              const isActive = dotIndex === step;
              const isPast = dotIndex < step;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(dotIndex)}
                  title={`Go to step ${dotIndex}`}
                  className={`transition-all rounded-full ${
                    isActive
                      ? 'w-5 h-2 bg-orange-600'
                      : isPast
                      ? 'w-2 h-2 bg-orange-300 hover:bg-orange-400'
                      : 'w-2 h-2 bg-stone-300 hover:bg-stone-400'
                  }`}
                  aria-label={`Step ${dotIndex}`}
                />
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs border border-stone-200 transition active:scale-95 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            {step < totalSteps ? (
              <button
                id="onboarding-next-btn"
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs sm:text-sm shadow-xs transition active:scale-95 flex items-center gap-1.5"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="onboarding-start-btn"
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs sm:text-sm shadow-xs transition active:scale-95 flex items-center gap-1.5"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
