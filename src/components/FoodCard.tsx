import React, { useState } from 'react';
import { 
  Plus, 
  Check, 
  Heart, 
  Flame, 
  Megaphone, 
  Camera, 
  Sparkles,
  Utensils,
  CupSoda,
  Cake,
  Croissant,
  Package,
  Apple,
  Layers,
  UtensilsCrossed
} from 'lucide-react';
import { DishItem, TranslationDictionary, FoodCategory } from '../types';
import { StallGraphic } from './StallGraphic';
import { getDishDisplayImage } from '../utils/imageHelper';

interface FoodCardProps {
  dish: DishItem;
  budget: number;
  isBestMatch: boolean;
  stallNotice?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (dishId: number) => void;
  onOpenDetail: (dish: DishItem) => void;
  onQuickAdd: (dish: DishItem) => void;
  t: TranslationDictionary;
}

// Clean category icon mapping (No emoji clutter)
export function getCategoryIcon(cat: FoodCategory, className = "w-3 h-3") {
  switch (cat) {
    case 'Rice Meals': return <Utensils className={className} />;
    case 'Snacks': return <Flame className={className} />;
    case 'Drinks': return <CupSoda className={className} />;
    case 'Desserts': return <Cake className={className} />;
    case 'Street Food': return <Sparkles className={className} />;
    case 'Bread & Pastries': return <Croissant className={className} />;
    case 'Dumplings': return <Package className={className} />;
    case 'Fruits': return <Apple className={className} />;
    default: return <Layers className={className} />;
  }
}

export const FoodCard: React.FC<FoodCardProps> = ({
  dish,
  budget,
  isBestMatch,
  stallNotice,
  isFavorite = false,
  onToggleFavorite,
  onOpenDetail,
  onQuickAdd,
  t
}) => {
  const [justAdded, setJustAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const displayImage = getDishDisplayImage(dish);

  React.useEffect(() => {
    setImageError(false);
  }, [displayImage.url]);

  const isSoldOut = !dish.available;
  const isAffordable = dish.price <= budget;
  const remainingAfter = budget - dish.price;

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSoldOut) return;

    onQuickAdd(dish);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(dish.id);
    }
  };

  const hasPhoto = Boolean(displayImage.url && !imageError);

  return (
    <div
      onClick={() => onOpenDetail(dish)}
      className={`group relative flex flex-col justify-between bg-white rounded-3xl border transition-all duration-300 overflow-hidden shadow-2xs hover:shadow-md ${
        isSoldOut
          ? 'opacity-70 border-stone-200 bg-stone-50/50 cursor-pointer'
          : isBestMatch
            ? 'border-orange-300 ring-2 ring-orange-400/20 hover:border-orange-400 cursor-pointer'
            : 'border-stone-200/90 hover:border-orange-200 cursor-pointer'
      }`}
    >
      {/* 1. Consistent Aspect-Ratio Food Image Container (4:3 ratio) */}
      <div className="relative aspect-[4/3] w-full bg-stone-100 overflow-hidden select-none border-b border-stone-100">
        
        {/* Actual Food Photo with Smooth Fit & Hover Zoom */}
        {hasPhoto ? (
          <div className="relative w-full h-full">
            <img
              src={displayImage.url}
              alt={dish.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {displayImage.isRepresentative && (
              <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
                <span className="text-[10px] font-bold text-stone-700 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-xs border border-stone-200/90 inline-flex items-center gap-1">
                  Representative Photo
                </span>
              </div>
            )}
            {displayImage.isOwnerUploaded && (
              <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
                <span className="text-[10px] font-bold text-emerald-800 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-full shadow-xs border border-emerald-300 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Official Stall Photo
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Neutral Placeholder: "No photo available" (Clean, NO random emojis) */
          <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100/90 text-stone-400 p-4 border-b border-stone-200/40">
            <Camera className="w-8 h-8 text-stone-300 mb-1" strokeWidth={1.5} />
            <span className="text-[11px] font-semibold text-stone-400 tracking-wide">
              No photo available
            </span>
          </div>
        )}

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition backdrop-blur-sm active:scale-90 ${
            isFavorite
              ? 'bg-white/90 text-rose-500 shadow-xs'
              : 'bg-white/80 hover:bg-white text-stone-400 hover:text-rose-500 shadow-2xs'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Best Match Overlay Badge */}
        {isBestMatch && !isSoldOut && (
          <div className="absolute top-2.5 left-2.5 z-10 text-[9px] font-black uppercase tracking-wider bg-orange-600 text-white px-2 py-0.5 rounded-full shadow-xs">
            Best Match
          </div>
        )}

        {/* Category Pill Overlay */}
        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-stone-900/80 backdrop-blur-md text-white px-2 py-0.5 rounded-lg text-[10px] font-bold">
          {getCategoryIcon(dish.category, "w-2.5 h-2.5 text-amber-300")}
          <span>{dish.category}</span>
        </div>
      </div>

      {/* 2. Middle Section: Food Title, Stall, and Ingredients */}
      <div className="p-4 py-3 space-y-1.5 flex-1 flex flex-col justify-start">
        
        {/* Food Name */}
        <h3
          className={`text-sm sm:text-base font-black text-stone-900 line-clamp-1 font-display group-hover:text-orange-600 transition-colors ${
            isSoldOut ? 'line-through text-stone-400' : ''
          }`}
          title={dish.name}
        >
          {dish.name}
        </h3>

        {/* Stall Name with Mini Graphic */}
        <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
          <StallGraphic stallName={dish.stall} size="xs" withBackground={false} className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-[200px]" title={dish.stall}>
            {dish.stall}
          </span>
        </div>

        {/* Ingredients/items snippet */}
        <p className="text-xs text-stone-500 line-clamp-1 leading-snug">
          {dish.items}
        </p>

        {/* Stall Notice broadcast if any */}
        {stallNotice && (
          <p className="text-[10px] text-amber-800 bg-amber-50 rounded-lg p-1.5 line-clamp-1 border border-amber-200/60 font-medium flex items-center gap-1 mt-1">
            <Megaphone className="w-3 h-3 text-amber-600 shrink-0" />
            <span className="truncate">{stallNotice}</span>
          </p>
        )}

      </div>

      {/* 3. Bottom Section: Price, Availability & Add to Tray Action */}
      <div className="p-4 pt-2 border-t border-stone-100 bg-[#FFFDF9]/60 space-y-2.5">
        
        {/* Price & Availability Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-stone-900 font-display tabular-nums">
              ₱{dish.price}
            </span>

            {/* Remaining Budget Calculation tag */}
            {isAffordable && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200/60 tabular-nums">
                +₱{remainingAfter} sukli
              </span>
            )}
          </div>

          {/* Availability Status Badge */}
          <span
            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              isSoldOut
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {isSoldOut ? '● Sold Out' : '● Available'}
          </span>
        </div>

        {/* Action Button: Add to Tray */}
        <button
          type="button"
          onClick={handleAddClick}
          disabled={isSoldOut}
          className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 ${
            isSoldOut
              ? 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
              : justAdded
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white shadow-xs'
          }`}
        >
          {isSoldOut ? (
            <span>Sold Out Today</span>
          ) : justAdded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added to Tray</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Tray</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
