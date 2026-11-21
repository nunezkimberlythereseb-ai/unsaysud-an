import React from 'react';
import { 
  Search, 
  X, 
  ArrowUpDown, 
  Building2, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Dices,
  Layers,
  UtensilsCrossed,
  Utensils,
  Flame,
  CupSoda,
  Cake,
  Croissant,
  Package,
  Apple,
  Leaf
} from 'lucide-react';
import { 
  DishItem, 
  CategoryFilter, 
  ZoneFilter, 
  SortOption, 
  AppPage, 
  TranslationDictionary 
} from '../../types';
import { FoodCard } from '../FoodCard';

interface ExplorePageProps {
  dishes: DishItem[];
  userBudget: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: CategoryFilter;
  onCategoryChange: (cat: CategoryFilter) => void;
  currentZone: ZoneFilter;
  onZoneChange: (z: ZoneFilter) => void;
  selectedStall: string | null;
  onSelectStall: (stall: string | null) => void;
  stallsList: string[];
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  availableOnly: boolean;
  onToggleAvailableOnly: () => void;
  withinBudgetOnly: boolean;
  onToggleWithinBudgetOnly: () => void;
  onResetFilters: () => void;
  onQuickAdd: (dish: DishItem) => void;
  onOpenDetail: (dish: DishItem) => void;
  onOpenRoulette: () => void;
  onToggleFavorite: (id: number) => void;
  favorites: number[];
  t: TranslationDictionary;
}

const CATEGORIES: { key: CategoryFilter; label: string; icon: React.ReactNode }[] = [
  { key: 'All', label: 'All', icon: <UtensilsCrossed className="w-3.5 h-3.5" /> },
  { key: 'Rice Meals', label: 'Rice Meals', icon: <Utensils className="w-3.5 h-3.5" /> },
  { key: 'Snacks', label: 'Snacks', icon: <Flame className="w-3.5 h-3.5" /> },
  { key: 'Drinks', label: 'Drinks', icon: <CupSoda className="w-3.5 h-3.5" /> },
  { key: 'Desserts', label: 'Desserts', icon: <Cake className="w-3.5 h-3.5" /> },
  { key: 'Street Food', label: 'Street Food', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { key: 'Bread & Pastries', label: 'Bread & Pastries', icon: <Croissant className="w-3.5 h-3.5" /> },
  { key: 'Dumplings', label: 'Dumplings', icon: <Package className="w-3.5 h-3.5" /> },
  { key: 'Fruits', label: 'Fruits', icon: <Apple className="w-3.5 h-3.5" /> },
  { key: 'Other', label: 'Other', icon: <Layers className="w-3.5 h-3.5" /> },
];

export const ExplorePage: React.FC<ExplorePageProps> = ({
  dishes,
  userBudget,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  currentZone,
  onZoneChange,
  selectedStall,
  onSelectStall,
  stallsList,
  currentSort,
  onSortChange,
  availableOnly,
  onToggleAvailableOnly,
  withinBudgetOnly,
  onToggleWithinBudgetOnly,
  onResetFilters,
  onQuickAdd,
  onOpenDetail,
  onOpenRoulette,
  onToggleFavorite,
  favorites,
  t
}) => {
  const visibleDishes = dishes.filter(d => !d.hidden);

  const isFiltered = 
    selectedCategory !== 'All' || 
    currentZone !== 'all' || 
    Boolean(searchQuery) || 
    Boolean(selectedStall) || 
    availableOnly ||
    withinBudgetOnly;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#F0EBE1]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 font-display">
            Explore Cafeteria Food
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 tabular-nums">
            Browse {visibleDishes.length} {visibleDishes.length === 1 ? 'dish' : 'dishes'} across {stallsList.length} live {stallsList.length === 1 ? 'stall' : 'stalls'} at USTP CDO cafeteria.
          </p>
        </div>

        {/* Surprise Me Quick Action */}
        <button
          type="button"
          onClick={onOpenRoulette}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black transition flex items-center gap-1.5 shadow-xs active:scale-95"
        >
          <Dices className="w-4 h-4" />
          <span>Surprise Me</span>
        </button>
      </div>

      {/* Filter Control Box */}
      <div className="bg-white rounded-3xl border border-[#F0EBE1] p-4 sm:p-6 shadow-2xs space-y-4">
        
        {/* Row 1: Search & Stall selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Search bar */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search dishes, ingredients, or stalls..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Stall Selector */}
          <div>
            <select
              value={selectedStall || ''}
              onChange={(e) => onSelectStall(e.target.value ? e.target.value : null)}
              className="w-full py-2.5 px-3 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-stone-700 font-medium"
            >
              <option value="">All Live Stalls ({stallsList.length})</option>
              {stallsList.map((stall) => (
                <option key={stall} value={stall}>
                  {stall}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Row 2: Category Pills */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Category
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => onCategoryChange(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 border ${
                    isSelected
                      ? 'bg-orange-600 text-white border-orange-600 shadow-2xs font-black'
                      : 'bg-white text-stone-700 border-[#F0EBE1] hover:bg-orange-50/80 hover:text-orange-700 hover:border-orange-200'
                  }`}
                >
                  <span className={isSelected ? 'text-amber-100' : 'text-orange-500'}>
                    {cat.icon}
                  </span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Zone, Availability, Budget Toggle, and Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs">
          
          {/* Zone Selector */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => onZoneChange('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                currentZone === 'all' ? 'bg-white text-stone-900 shadow-2xs font-black' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              All Zones
            </button>
            <button
              type="button"
              onClick={() => onZoneChange('outside')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                currentZone === 'outside' ? 'bg-white text-emerald-800 shadow-2xs font-black' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Leaf className="w-3 h-3 text-emerald-600" />
              <span>Outside</span>
            </button>
            <button
              type="button"
              onClick={() => onZoneChange('inside')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                currentZone === 'inside' ? 'bg-white text-sky-800 shadow-2xs font-black' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Building2 className="w-3 h-3 text-sky-600" />
              <span>Inside</span>
            </button>
          </div>

          {/* Quick Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Filter by Budget toggle */}
            <button
              type="button"
              onClick={onToggleWithinBudgetOnly}
              className={`px-3 py-1.5 rounded-xl font-bold transition border flex items-center gap-1.5 ${
                withinBudgetOnly
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${withinBudgetOnly ? 'bg-emerald-600' : 'bg-stone-300'}`} />
              <span>≤ ₱{userBudget} Budget Only</span>
            </button>

            {/* Available Only */}
            <button
              type="button"
              onClick={onToggleAvailableOnly}
              className={`px-3 py-1.5 rounded-xl font-bold transition border flex items-center gap-1.5 ${
                availableOnly
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${availableOnly ? 'bg-emerald-600' : 'bg-stone-300'}`} />
              <span>Available Only</span>
            </button>

            {/* Sort selector */}
            <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200">
              <ArrowUpDown className="w-3 h-3 text-stone-400" />
              <select
                value={currentSort}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="bg-transparent text-stone-700 font-bold focus:outline-none"
              >
                <option value="best-value">Best Budget Match</option>
                <option value="cheapest">Price: Low to High</option>
                <option value="priciest">Price: High to Low</option>
                <option value="popular">Most Popular</option>
                <option value="name">Dish Name (A-Z)</option>
              </select>
            </div>

          </div>

        </div>

      </div>

      {/* Active Filters Pill Bar & Results Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="text-stone-600 font-medium">
          Showing <strong className="text-stone-900 font-bold">{visibleDishes.length}</strong> matching meals
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-bold text-xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset all filters</span>
          </button>
        )}
      </div>

      {/* Results Grid - Multi-column Spacious Layout */}
      {visibleDishes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-8 sm:p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-stone-900 font-display">
            No matching food found
          </h3>
          <p className="text-xs text-stone-500">
            No dishes match your active search and filter combinations. Try loosening some filters or resetting them.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {visibleDishes.map((dish) => (
            <FoodCard
              key={dish.id}
              dish={dish}
              budget={userBudget}
              isBestMatch={dish.price <= userBudget && dish.price >= userBudget - 15}
              isFavorite={favorites.includes(dish.id)}
              onToggleFavorite={onToggleFavorite}
              onOpenDetail={onOpenDetail}
              onQuickAdd={onQuickAdd}
              t={t}
            />
          ))}
        </div>
      )}

    </div>
  );
};
