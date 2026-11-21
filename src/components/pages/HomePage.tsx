import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Utensils,
  Flame,
  CupSoda,
  Cake,
  Sparkles,
  Croissant,
  Package,
  Apple,
  Layers,
  Dices,
  ArrowRight,
  Minus,
  Plus,
  Megaphone,
  Store,
  Wifi,
  WifiOff,
  RefreshCw,
  QrCode,
  RotateCcw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import {
  DishItem,
  CategoryFilter,
  AppPage,
  TranslationDictionary,
  AppNotification
} from '../../types';
import { FoodCard } from '../FoodCard';
import {
  RiceBowlDoodle,
  ChickenDoodle,
  DrinkDoodle,
  DumplingDoodle,
  FriesDoodle,
  BurgerDoodle,
  UtensilsDoodle
} from '../FoodDoodles';
import { formatSyncTimestamp } from '../../utils/offlineStore';

interface HomePageProps {
  budget: number;
  defaultBudget?: number;
  totalTrayCost: number;
  onBudgetChange: (val: number) => void;
  dishes: DishItem[];
  stallsCount?: number;
  isLoading?: boolean;
  isOnline?: boolean;
  isSyncing?: boolean;
  lastSyncedAt?: string | null;
  onManualSync?: () => void;
  onOpenCampusQR?: () => void;
  welcomeBannerMessage?: string;
  announcements?: AppNotification[];
  selectedCategory: CategoryFilter;
  onCategoryChange: (cat: CategoryFilter) => void;
  onQuickAdd: (dish: DishItem) => void;
  onOpenDetail: (dish: DishItem) => void;
  onOpenRoulette: () => void;
  onNavigate: (page: AppPage) => void;
  onToggleFavorite: (id: number) => void;
  favorites: number[];
  t: TranslationDictionary;
}

const BUDGET_PRESETS = [25, 40, 55, 75, 100];

const CATEGORIES: { key: CategoryFilter; label: string; icon: React.ReactNode }[] = [
  { key: 'All', label: 'All Categories', icon: <UtensilsCrossed className="w-4 h-4" /> },
  { key: 'Rice Meals', label: 'Rice Meals', icon: <Utensils className="w-4 h-4" /> },
  { key: 'Snacks', label: 'Snacks', icon: <Flame className="w-4 h-4" /> },
  { key: 'Drinks', label: 'Drinks', icon: <CupSoda className="w-4 h-4" /> },
  { key: 'Desserts', label: 'Desserts', icon: <Cake className="w-4 h-4" /> },
  { key: 'Street Food', label: 'Street Food', icon: <Sparkles className="w-4 h-4" /> },
  { key: 'Bread & Pastries', label: 'Bread & Pastries', icon: <Croissant className="w-4 h-4" /> },
  { key: 'Dumplings', label: 'Dumplings', icon: <Package className="w-4 h-4" /> },
  { key: 'Fruits', label: 'Fruits', icon: <Apple className="w-4 h-4" /> },
  { key: 'Other', label: 'Other', icon: <Layers className="w-4 h-4" /> }
];

export const HomePage: React.FC<HomePageProps> = ({
  budget,
  defaultBudget = 55,
  totalTrayCost,
  onBudgetChange,
  dishes,
  stallsCount = 0,
  isLoading = false,
  isOnline = true,
  isSyncing = false,
  lastSyncedAt = null,
  onManualSync,
  onOpenCampusQR,
  welcomeBannerMessage,
  announcements = [],
  selectedCategory,
  onCategoryChange,
  onQuickAdd,
  onOpenDetail,
  onOpenRoulette,
  onNavigate,
  onToggleFavorite,
  favorites,
  t
}) => {
  const [customBudgetInput, setCustomBudgetInput] = useState<string>(String(budget));
  const [budgetError, setBudgetError] = useState<string | null>(null);

  useEffect(() => {
    setCustomBudgetInput(String(budget));
  }, [budget]);

  const handleDecrement = () => {
    setBudgetError(null);
    onBudgetChange(Math.max(1, budget - 10));
  };

  const handleIncrement = () => {
    setBudgetError(null);
    onBudgetChange(Math.min(500, budget + 10));
  };

  const handleApplyCustomBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customBudgetInput.trim();
    if (!trimmed) {
      setBudgetError('Please enter a budget amount between ₱1 and ₱500.');
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || isNaN(parsed)) {
      setBudgetError('Enter numbers only (for example: 65 or 150).');
      return;
    }
    if (parsed <= 0) {
      setBudgetError('Budget must be at least ₱1.');
      return;
    }
    if (parsed > 500) {
      setBudgetError('Maximum budget allowed is ₱500.');
      return;
    }

    setBudgetError(null);
    const cleanVal = Math.round(parsed);
    setCustomBudgetInput(String(cleanVal));
    onBudgetChange(cleanVal);
  };

  const handleResetBudget = () => {
    setBudgetError(null);
    const resetVal = Math.min(500, Math.max(1, defaultBudget || 55));
    setCustomBudgetInput(String(resetVal));
    onBudgetChange(resetVal);
  };

  const remainingBudget = budget - totalTrayCost;
  const isOverBudget = remainingBudget < 0;

  const visibleDishes = dishes.filter((d) => !d.hidden);
  const matchingDishes = visibleDishes.filter((dish) => {
    if (dish.price > budget) return false;
    if (selectedCategory !== 'All' && dish.category !== selectedCategory) return false;
    return true;
  });

  const latestAnnouncement = announcements[0];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white p-6 sm:p-10 shadow-lg shadow-orange-900/10 border border-orange-400/30 text-center max-w-4xl mx-auto">
        <div className="absolute -left-2 -top-2 text-white/20 pointer-events-none rotate-12 hidden sm:block">
          <RiceBowlDoodle size={72} className="text-white/25" />
        </div>
        <div className="absolute -right-2 -top-2 text-white/20 pointer-events-none -rotate-12 hidden sm:block">
          <DrinkDoodle size={68} className="text-white/25" />
        </div>
        <div className="absolute left-6 -bottom-3 text-white/20 pointer-events-none -rotate-12 hidden md:block">
          <DumplingDoodle size={58} className="text-white/25" />
        </div>
        <div className="absolute right-6 -bottom-3 text-white/20 pointer-events-none rotate-12 hidden md:block">
          <ChickenDoodle size={60} className="text-white/25" />
        </div>
        <div className="absolute left-1/3 -top-5 text-white/10 pointer-events-none rotate-45 hidden lg:block">
          <FriesDoodle size={50} className="text-white/15" />
        </div>
        <div className="absolute right-1/4 -bottom-4 text-white/10 pointer-events-none -rotate-15 hidden lg:block">
          <BurgerDoodle size={52} className="text-white/15" />
        </div>

        <div className="relative z-10 max-w-xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-xs font-black text-orange-100 tracking-wide">
            <UtensilsDoodle size={14} className="text-amber-200" />
            <span>USTP CDO Campus Food Discovery</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white font-display tracking-tight leading-tight text-balance">
            “Unsay sud-an nimo today?”
          </h1>

          <p className="text-sm sm:text-base text-orange-100 font-medium max-w-md mx-auto">
            Set your budget up to ₱500, browse cafeteria stalls even offline, and track your sukli before heading to the counter.
          </p>

          <div className="pt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-orange-50 tabular-nums">
            <span>{stallsCount} {stallsCount === 1 ? 'Live Stall' : 'Live Stalls'}</span>
            <span aria-hidden="true">·</span>
            <span>{visibleDishes.length} {visibleDishes.length === 1 ? 'Dish' : 'Dishes'}</span>
          </div>
        </div>
      </section>

      {/* Sync Status & Campus QR Bar */}
      <section className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 bg-white border border-stone-200/80 rounded-2xl px-4 py-2.5 text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 text-stone-700">
          <span
            className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg border ${
              !isOnline
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : isSyncing
                ? 'bg-sky-50 text-sky-900 border-sky-200'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}
          >
            {!isOnline ? (
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            ) : isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>
              {!isOnline ? 'Offline Snapshot' : isSyncing ? 'Syncing Menus...' : 'Online & Synced'}
            </span>
          </span>

          <span className="text-[11px] text-stone-500 font-medium">
            Last synchronized: <strong className="text-stone-700">{formatSyncTimestamp(lastSyncedAt)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOnline && onManualSync && (
            <button
              type="button"
              onClick={onManualSync}
              disabled={isSyncing}
              className="min-h-[36px] px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[11px] flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Now</span>
            </button>
          )}
          {onOpenCampusQR && (
            <button
              type="button"
              onClick={onOpenCampusQR}
              className="min-h-[36px] px-3 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold text-[11px] flex items-center gap-1.5 transition"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Campus QR</span>
            </button>
          )}
        </div>
      </section>

      {/* Welcome Banner (from Centralized Super Admin Settings if set) */}
      {welcomeBannerMessage && welcomeBannerMessage.trim() && (
        <section className="max-w-4xl mx-auto bg-orange-50/90 border border-orange-200 rounded-2xl px-4 py-3 text-xs text-orange-950 font-medium">
          {welcomeBannerMessage}
        </section>
      )}

      {/* Live Campus Announcement Banner */}
      {latestAnnouncement && (
        <section className="max-w-4xl mx-auto bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
          <Megaphone className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950">
            <span className="font-black block">{latestAnnouncement.title}</span>
            <p className="text-amber-900 mt-0.5 leading-relaxed">{latestAnnouncement.message}</p>
          </div>
        </section>
      )}

      {/* Step 1: Customizable Budget Selection (Up to ₱500) */}
      <section className="bg-white rounded-3xl border border-orange-100 p-5 sm:p-7 shadow-xs space-y-5 max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-100/80 px-2 py-0.5 rounded-md">
              Step 1
            </span>
            <h2 className="text-base sm:text-lg font-black text-stone-900 font-display mt-1">
              How much is your budget today?
            </h2>
          </div>
          <span className="text-xs font-bold text-stone-600 bg-orange-50/80 border border-orange-200 px-3 py-1 rounded-lg tabular-nums">
            Maximum budget: ₱500
          </span>
        </div>

        {/* Visual Counter & Stepper */}
        <div className="flex items-center justify-center gap-5 sm:gap-10 py-4 sm:py-5 px-4 bg-gradient-to-b from-orange-50/50 via-amber-50/20 to-white rounded-2xl border border-orange-100/80">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={budget <= 1}
            aria-label="Decrease budget by ₱10"
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all select-none border-2 ${
              budget <= 1
                ? 'bg-stone-100 border-stone-200 text-stone-300 cursor-not-allowed shadow-none'
                : 'bg-white border-orange-200 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-md hover:shadow-orange-500/20 active:scale-95 shadow-xs cursor-pointer'
            }`}
          >
            <Minus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
          </button>

          <div className="flex flex-col items-center justify-center min-w-[130px] sm:min-w-[170px] select-none text-center">
            <span className="text-4xl sm:text-5xl font-black text-stone-900 font-display tracking-tight leading-none tabular-nums">
              ₱{budget}
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-orange-600 uppercase tracking-wider mt-1.5">
              Active Budget
            </span>
          </div>

          <button
            type="button"
            onClick={handleIncrement}
            disabled={budget >= 500}
            aria-label="Increase budget by ₱10"
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all select-none border-2 ${
              budget >= 500
                ? 'bg-stone-100 border-stone-200 text-stone-300 cursor-not-allowed shadow-none'
                : 'bg-white border-orange-200 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:shadow-md hover:shadow-orange-500/20 active:scale-95 shadow-xs cursor-pointer'
            }`}
          >
            <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
          </button>
        </div>

        {/* Manual Custom Input Form */}
        <form onSubmit={handleApplyCustomBudget} className="space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-stone-600 text-sm">
                ₱
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={500}
                step={1}
                value={customBudgetInput}
                onChange={(e) => {
                  setCustomBudgetInput(e.target.value);
                  if (budgetError) setBudgetError(null);
                }}
                placeholder="Enter your budget (₱1–₱500)"
                aria-label="Enter custom student budget up to 500 pesos"
                className="w-full min-h-[44px] pl-8 pr-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-black text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white tabular-nums"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none min-h-[44px] px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black tracking-wide uppercase transition shadow-xs active:scale-95 whitespace-nowrap"
              >
                APPLY BUDGET
              </button>
              <button
                type="button"
                onClick={handleResetBudget}
                className="min-h-[44px] px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap"
                title={`Reset budget to ₱${defaultBudget}`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {budgetError && (
            <p role="alert" className="text-xs font-bold text-rose-600 flex items-center gap-1.5 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{budgetError}</span>
            </p>
          )}
        </form>

        {/* Presets: ₱25, ₱40, ₱55, ₱75, ₱100 */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-semibold text-stone-500 mr-1">Quick select:</span>
          {BUDGET_PRESETS.map((amt) => {
            const active = budget === amt;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setBudgetError(null);
                  onBudgetChange(amt);
                }}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition active:scale-95 border tabular-nums ${
                  active
                    ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                    : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700'
                }`}
              >
                ₱{amt}
              </button>
            );
          })}
        </div>

        {/* Real-Time Budget Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-stone-100 tabular-nums text-xs">
          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
              Selected Budget
            </span>
            <strong className="text-base font-black text-stone-900 font-display">
              ₱{budget}
            </strong>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
              Total Food Cost
            </span>
            <strong className="text-base font-black text-stone-900 font-display">
              ₱{totalTrayCost}
            </strong>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isOverBudget
                ? 'bg-rose-50 border-rose-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}
          >
            <span
              className={`text-[10px] font-black uppercase tracking-wider block ${
                isOverBudget ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              Remaining (Sukli)
            </span>
            <strong
              className={`text-base font-black font-display ${
                isOverBudget ? 'text-rose-800' : 'text-emerald-800'
              }`}
            >
              {isOverBudget ? `-₱${Math.abs(remainingBudget)}` : `₱${remainingBudget}`}
            </strong>
          </div>

          <div
            className={`p-3 rounded-2xl border flex flex-col justify-center ${
              isOverBudget
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider block">
              Budget Status
            </span>
            <div className="flex items-center gap-1 font-black text-xs mt-0.5">
              {isOverBudget ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Over by ₱{Math.abs(remainingBudget)}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Within Budget</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Warning if newly lowered budget is less than current tray */}
        {isOverBudget && totalTrayCost > 0 && (
          <div
            role="alert"
            className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <span>
              <strong>Tray Notice:</strong> Your current tray (₱{totalTrayCost}) exceeds your ₱{budget} budget by ₱{Math.abs(remainingBudget)}. Your tray items were kept intact so you can review them.
            </span>
            <button
              type="button"
              onClick={() => onNavigate('tray')}
              className="min-h-[36px] px-3 rounded-xl bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 font-bold shrink-0 self-start sm:self-center"
            >
              Review Tray →
            </button>
          </div>
        )}
      </section>

      {/* Step 2: Category Selection */}
      <section className="bg-white rounded-3xl border border-orange-100 p-5 sm:p-7 shadow-xs space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-100/80 px-2 py-0.5 rounded-md">
              Step 2
            </span>
            <h2 className="text-base sm:text-lg font-black text-stone-900 font-display mt-1">
              What do you want to eat?
            </h2>
          </div>
          {selectedCategory !== 'All' && (
            <button
              type="button"
              onClick={() => onCategoryChange('All')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 underline"
            >
              Show all
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onCategoryChange(cat.key)}
                className={`min-h-[44px] flex items-center gap-2.5 p-3 rounded-2xl border text-left transition active:scale-95 text-xs sm:text-sm font-bold ${
                  isSelected
                    ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-orange-50/80 hover:text-orange-700 hover:border-orange-200'
                }`}
              >
                <span className={isSelected ? 'text-amber-100' : 'text-orange-500'}>
                  {cat.icon}
                </span>
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Surprise Me Card Banner */}
      <section className="max-w-4xl mx-auto overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-5 sm:p-6 text-white shadow-md hover:shadow-xl transition-all duration-300 border border-amber-300/30 relative">
        <div className="absolute -right-4 -bottom-4 text-white/15 pointer-events-none hidden sm:block">
          <FriesDoodle size={76} className="text-white/20" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs">
              <Dices className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-100">
                <Sparkles className="w-3 h-3 text-amber-200" />
                <span>SURPRISE ME!</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white font-display">
                “Don't know what to eat?”
              </h3>
              <p className="text-xs sm:text-sm text-orange-100 font-medium tabular-nums">
                Let Our Sud-an pick an available meal within your ₱{budget} budget.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenRoulette}
            className="min-h-[44px] self-start sm:self-auto px-5 py-2.5 rounded-2xl bg-white text-orange-700 hover:bg-orange-50 font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-2 shrink-0 whitespace-nowrap"
          >
            <Dices className="w-4 h-4 text-orange-600" />
            <span>Surprise Me</span>
            <ArrowRight className="w-3.5 h-3.5 text-orange-600" />
          </button>
        </div>
      </section>

      {/* Step 3: Matching Food Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-orange-100">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-100/80 px-2 py-0.5 rounded-md">
              Step 3
            </span>
            <h2 className="text-base sm:text-xl font-black text-stone-900 font-display mt-1">
              What food fits your budget?
            </h2>
            <p className="text-xs text-stone-500 tabular-nums">
              Showing {matchingDishes.length} {matchingDishes.length === 1 ? 'meal' : 'meals'} for ₱{budget}
              {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 self-start sm:self-auto min-h-[36px]"
          >
            <span>Explore full menu with filters</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading && visibleDishes.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-3xl border border-stone-200 h-72 p-4 space-y-3">
                <div className="w-full h-36 bg-stone-100 rounded-2xl" />
                <div className="h-4 w-3/4 bg-stone-100 rounded" />
                <div className="h-3 w-1/2 bg-stone-100 rounded" />
              </div>
            ))}
          </div>
        ) : visibleDishes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-stone-900 font-display">
                No active cafeteria items posted yet
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Active stall menus will appear here automatically once cafeteria stall owners register and publish their dishes.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('stalls')}
                className="min-h-[44px] px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-black transition"
              >
                Browse Stalls
              </button>
              <button
                type="button"
                onClick={() => onNavigate('portal')}
                className="min-h-[44px] px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
              >
                Stall Owner Portal
              </button>
            </div>
          </div>
        ) : matchingDishes.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-stone-900 font-display">
                No meals found for ₱{budget}
                {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Try selecting "All Categories" or increasing your budget to see more options.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              {selectedCategory !== 'All' && (
                <button
                  type="button"
                  onClick={() => onCategoryChange('All')}
                  className="min-h-[44px] px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-black transition"
                >
                  All Categories
                </button>
              )}
              <button
                type="button"
                onClick={() => onBudgetChange(Math.min(500, Math.max(1, budget + 20)))}
                className="min-h-[44px] px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
              >
                Increase Budget (+₱20)
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {matchingDishes.map((dish) => (
              <FoodCard
                key={dish.id}
                dish={dish}
                budget={budget}
                isBestMatch={dish.price <= budget && dish.price >= budget - 15}
                isFavorite={favorites.includes(dish.id)}
                onToggleFavorite={onToggleFavorite}
                onOpenDetail={onOpenDetail}
                onQuickAdd={onQuickAdd}
                t={t}
              />
            ))}
          </div>
        )}
      </section>

      {/* Bottom Navigation Prompt */}
      <section className="text-center pt-6 border-t border-orange-100">
        <p className="text-xs text-stone-500 mb-3">
          Looking for specific cafeteria stalls or want to review your tray?
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-orange-100 text-stone-800 text-xs font-bold hover:bg-orange-50/50 hover:border-orange-200 transition shadow-2xs"
          >
            Explore Search & Filters
          </button>
          <button
            type="button"
            onClick={() => onNavigate('stalls')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-orange-100 text-stone-800 text-xs font-bold hover:bg-orange-50/50 hover:border-orange-200 transition shadow-2xs tabular-nums"
          >
            View All Live Stalls ({stallsCount})
          </button>
          <button
            type="button"
            onClick={() => onNavigate('tray')}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition shadow-xs"
          >
            Check My Tray
          </button>
        </div>
      </section>
    </div>
  );
};
