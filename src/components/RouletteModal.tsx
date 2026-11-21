import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  Sparkles, 
  Dices, 
  ChevronRight, 
  Flame, 
  UtensilsCrossed, 
  Soup, 
  CupSoda, 
  Croissant,
  Check,
  Plus,
  ArrowRight,
  SlidersHorizontal,
  Layers,
  AlertCircle
} from 'lucide-react';
import { DishItem, TranslationDictionary, CategoryFilter } from '../types';
import { FoodIcon } from './FoodIcon';
import { StallGraphic } from './StallGraphic';

export type SurpriseCategoryType = 'meal' | 'rice' | 'snack' | 'drink' | 'dessert' | 'anything';

interface RouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  allDishes: DishItem[];
  userBudget: number;
  onSelectDish: (dish: DishItem) => void;
  onQuickAdd: (dish: DishItem) => void;
  onAdjustBudget?: (newBudget: number) => void;
  onSelectCategory?: (category: CategoryFilter) => void;
  t: TranslationDictionary;
}

const SPIN_ICONS = [
  <UtensilsCrossed key="1" className="w-10 h-10 text-white" />,
  <Soup key="2" className="w-10 h-10 text-white" />,
  <CupSoda key="3" className="w-10 h-10 text-white" />,
  <Croissant key="4" className="w-10 h-10 text-white" />,
  <Flame key="5" className="w-10 h-10 text-white" />,
  <Sparkles key="6" className="w-10 h-10 text-white" />
];

export const RouletteModal: React.FC<RouletteModalProps> = ({
  isOpen,
  onClose,
  allDishes,
  userBudget,
  onSelectDish,
  onQuickAdd,
  onAdjustBudget,
  onSelectCategory,
  t
}) => {
  const [spinning, setSpinning] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);
  const [pickedDish, setPickedDish] = useState<DishItem | null>(null);
  const [selectedPreference, setSelectedPreference] = useState<SurpriseCategoryType>('meal');
  const [justAdded, setJustAdded] = useState(false);

  // Helper to test if dish is a condiment / add-on / side item to exclude
  const isCondimentOrSide = (dish: DishItem) => {
    if (dish.category === 'Other') return true;
    const lowerName = dish.name.toLowerCase();
    if (lowerName.includes('extra cup') || lowerName.includes('extra rice') || lowerName.includes('plain rice')) {
      return true;
    }
    if (lowerName.includes('solo pack') || lowerName.includes('sauce') || lowerName.includes('dip')) {
      return true;
    }
    return false;
  };

  // Compute candidate dishes based on rules
  const candidates = useMemo(() => {
    // Basic criteria: available, not hidden, and within student budget
    const affordable = allDishes.filter(d => d.available && !d.hidden && d.price <= userBudget);

    if (selectedPreference === 'rice') {
      return affordable.filter(d => d.category === 'Rice Meals' && !isCondimentOrSide(d));
    }

    if (selectedPreference === 'snack') {
      return affordable.filter(d => (d.category === 'Snacks' || d.category === 'Street Food') && !isCondimentOrSide(d));
    }

    if (selectedPreference === 'drink') {
      return affordable.filter(d => d.category === 'Drinks');
    }

    if (selectedPreference === 'dessert') {
      return affordable.filter(d => (d.category === 'Desserts' || d.category === 'Bread & Pastries' || d.category === 'Fruits') && !isCondimentOrSide(d));
    }

    if (selectedPreference === 'anything') {
      return affordable.filter(d => !isCondimentOrSide(d));
    }

    // DEFAULT MODE: 'meal'
    // 1. The recommendation must be a meal or food item, preferably a filling meal such as a rice meal when available.
    // 2. Do NOT recommend a drink alone.
    // 3. Do NOT recommend a condiment, add-on, or side item.
    // 10. Do not randomly select a drink, snack, or dessert when a proper meal is available within the budget.
    const riceMeals = affordable.filter(d => d.category === 'Rice Meals' && !isCondimentOrSide(d));
    if (riceMeals.length > 0) {
      return riceMeals;
    }

    // If NO rice meal fits within budget, fall back to substantial meal/food alternatives:
    // e.g., Dumplings combo or filling snacks (Burger, Sandwich, Shawarma, Pancit Canton, Empanada)
    const substantialFood = affordable.filter(d => {
      if (isCondimentOrSide(d)) return false;
      if (d.category === 'Drinks') return false; // Never a drink alone
      return d.category === 'Dumplings' || d.category === 'Snacks' || d.category === 'Street Food';
    });

    return substantialFood;
  }, [allDishes, userBudget, selectedPreference]);

  // Pick a random dish from candidates (excluding previous pick if multiple exist)
  const pickDishFromPool = useCallback((excludeId?: number) => {
    if (candidates.length === 0) {
      setPickedDish(null);
      setSpinning(false);
      return;
    }

    let pool = candidates;
    if (excludeId && candidates.length > 1) {
      const filtered = candidates.filter(d => d.id !== excludeId);
      if (filtered.length > 0) pool = filtered;
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    setPickedDish(pool[randomIndex]);
    setSpinning(false);
  }, [candidates]);

  // Spin animation
  const triggerSpin = useCallback((excludeId?: number) => {
    if (candidates.length === 0) {
      setPickedDish(null);
      return;
    }

    setSpinning(true);
    setJustAdded(false);

    let count = 0;
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % SPIN_ICONS.length);
      count++;
      if (count > 10) {
        clearInterval(interval);
        pickDishFromPool(excludeId);
      }
    }, 70);
  }, [candidates, pickDishFromPool]);

  // When modal opens or preference changes or budget changes, trigger spin
  useEffect(() => {
    if (isOpen) {
      triggerSpin();
    } else {
      setPickedDish(null);
      setSpinning(false);
      setJustAdded(false);
    }
  }, [isOpen, selectedPreference, userBudget]);

  if (!isOpen) return null;

  const remainingBudget = pickedDish ? Math.max(0, userBudget - pickedDish.price) : userBudget;

  const handleAddCurrentToTray = () => {
    if (!pickedDish) return;
    onQuickAdd(pickedDish);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 2000);
  };

  const handleSurpriseAgain = () => {
    triggerSpin(pickedDish?.id);
  };

  const handleQuickBudgetPreset = (preset: number) => {
    onAdjustBudget?.(preset);
  };

  const handleBrowseCategoryClick = (category: CategoryFilter) => {
    onSelectCategory?.(category);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        id="roulette-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div
        id="roulette-modal-card"
        className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-5 sm:p-6 text-center space-y-4 overflow-hidden max-h-[92vh] flex flex-col justify-between"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition active:scale-90"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="overflow-y-auto no-scrollbar space-y-3.5 pr-0.5">
          
          {/* Header Title with Official Prompt Formatting */}
          <div className="space-y-1 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-900 text-[11px] font-extrabold uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>🎲 Your Surprise Meal!</span>
            </div>
            
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 font-display">
              Unsay Sud-an Karon?
            </h3>
            
            {/* Prominently show Available Budget */}
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-stone-600">
              <span>Available Budget:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 font-display font-black text-sm">
                ₱{userBudget}
              </span>
            </div>
          </div>

          {/* Optional Category-Based Surprise Selector: What do you want? */}
          <div className="bg-stone-50/80 p-2.5 rounded-2xl border border-stone-200/80 text-left space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 px-1">
              <span>What do you want?</span>
              <span className="text-[10px] text-stone-600 font-semibold">
                {selectedPreference === 'meal' ? 'Default: Filling Meal' : 'Category Filtered'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setSelectedPreference('meal')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 shrink-0 ${
                  selectedPreference === 'meal'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>🍱</span>
                <span>Complete Meal</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreference('rice')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 shrink-0 ${
                  selectedPreference === 'rice'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>🍚</span>
                <span>Rice Meal</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreference('snack')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 shrink-0 ${
                  selectedPreference === 'snack'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>🍟</span>
                <span>Snack</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreference('drink')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 shrink-0 ${
                  selectedPreference === 'drink'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>🥤</span>
                <span>Drink</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreference('dessert')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 shrink-0 ${
                  selectedPreference === 'dessert'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>🍰</span>
                <span>Dessert</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreference('anything')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1 shrink-0 ${
                  selectedPreference === 'anything'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>🎲</span>
                <span>Surprise Anything</span>
              </button>
            </div>
          </div>

          {/* Spinner Animation Visual */}
          <div className="py-1 flex justify-center items-center">
            {spinning ? (
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-500 via-orange-600 to-amber-500 flex items-center justify-center shadow-xl shadow-orange-500/25">
                {SPIN_ICONS[iconIndex]}
              </div>
            ) : pickedDish ? (
              <div className="relative group">
                <FoodIcon dish={pickedDish} size="lg" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-3xl bg-stone-100 flex items-center justify-center text-stone-400">
                <AlertCircle className="w-8 h-8 text-stone-400" />
              </div>
            )}
          </div>

          {/* RESULT STATE: Found a valid surprise meal/food item within budget */}
          {pickedDish && !spinning ? (
            <div className="p-4 bg-orange-50/90 rounded-2xl border border-orange-200/90 text-left space-y-2.5 shadow-2xs animate-fade-in">
              
              {/* Stall Name and Number with Mini Graphic */}
              <div className="flex items-center justify-between gap-2 border-b border-orange-200/70 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <StallGraphic stallName={pickedDish.stall} size="xs" withBackground={false} />
                  <span className="text-xs font-extrabold text-orange-900 truncate">
                    {pickedDish.stall}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/80 text-orange-800 border border-orange-200/60 uppercase shrink-0">
                  {pickedDish.category}
                </span>
              </div>

              {/* Food Name & Actual Menu Price */}
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-base sm:text-lg font-black text-stone-900 font-display leading-snug">
                  {pickedDish.name}
                </h4>
                <div className="text-right shrink-0">
                  <span className="text-lg font-black text-stone-900 font-display">
                    ₱{pickedDish.price}
                  </span>
                </div>
              </div>

              {/* Menu Details Description */}
              <p className="text-xs text-stone-600 leading-relaxed">
                {pickedDish.items}
              </p>

              {/* Remaining Budget Banner Rule #7 */}
              <div className="bg-white/90 rounded-xl p-2.5 border border-orange-200/80 flex items-center justify-between text-xs">
                <span className="font-bold text-stone-700">
                  Remaining Budget:
                </span>
                <span className="font-extrabold text-emerald-700 font-display text-sm">
                  You have ₱{remainingBudget} remaining.
                </span>
              </div>

              {/* Zone and category banner */}
              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5 font-medium">
                <span>{pickedDish.zone === 'outside' ? 'Outside Canopy' : 'Inside Dining Hall'}</span>
                <span>USTP Cafeteria</span>
              </div>

            </div>
          ) : !spinning && candidates.length === 0 ? (
            
            /* EMPTY STATE Rule #9: No meal is currently available within your budget */
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center space-y-3 animate-fade-in">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-black text-stone-900 font-display">
                  No meal is currently available within your budget.
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                  Your budget is currently ₱{userBudget}. Try adjusting your budget or selecting another category.
                </p>
              </div>

              {/* Quick Option to adjust budget */}
              <div className="pt-2 border-t border-stone-200/80 space-y-2">
                <span className="text-[11px] font-bold text-stone-600 block">
                  Adjust budget to find meals:
                </span>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {[25, 40, 55, 75, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleQuickBudgetPreset(preset)}
                      className="px-2.5 py-1 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-bold transition active:scale-95 tabular-nums"
                    >
                      ₱{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option to browse other categories */}
              <div className="pt-2 border-t border-stone-200/80 space-y-2">
                <span className="text-[11px] font-bold text-stone-600 block">
                  Or browse categories:
                </span>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleBrowseCategoryClick('Snacks')}
                    className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition active:scale-95"
                  >
                    🍟 Snacks
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBrowseCategoryClick('Drinks')}
                    className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition active:scale-95"
                  >
                    🥤 Drinks
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBrowseCategoryClick('Street Food')}
                    className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition active:scale-95"
                  >
                    🍢 Street Food
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBrowseCategoryClick('All')}
                    className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition active:scale-95"
                  >
                    🍽️ All Menu
                  </button>
                </div>
              </div>

            </div>
          ) : null}

        </div>

        {/* Action Controls */}
        <div className="pt-1 flex flex-col gap-2 border-t border-stone-100">
          {!spinning && pickedDish ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                {/* [Surprise Me Again] */}
                <button
                  id="surprise-me-again-btn"
                  onClick={handleSurpriseAgain}
                  className="w-1/2 py-2.5 sm:py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm transition active:scale-95 flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Dices className="w-4 h-4 text-orange-600" />
                  <span>Surprise Me Again</span>
                </button>

                {/* [Add to Tray] */}
                <button
                  id="surprise-add-to-tray-btn"
                  onClick={handleAddCurrentToTray}
                  className={`flex-1 py-2.5 sm:py-3 rounded-2xl font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 ${
                    justAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Tray!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add to Tray</span>
                    </>
                  )}
                </button>
              </div>

              {/* View Meal Details Modal Button */}
              <button
                onClick={() => {
                  onClose();
                  onSelectDish(pickedDish);
                }}
                className="w-full py-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-900 font-bold text-xs transition flex items-center justify-center gap-1"
              >
                <span>View Full Dish Details & Add-ons</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              disabled={spinning || candidates.length === 0}
              onClick={() => triggerSpin()}
              className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs sm:text-sm shadow-md transition disabled:opacity-50"
            >
              {spinning ? 'Finding a delicious meal...' : '🎲 Surprise Me!'}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-1.5 text-stone-400 hover:text-stone-600 text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
