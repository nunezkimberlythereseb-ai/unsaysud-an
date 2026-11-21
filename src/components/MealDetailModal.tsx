import React, { useState, useEffect } from 'react';
import { X, Plus, AlertTriangle, Check, Sparkles, MapPin, Camera } from 'lucide-react';
import { DishItem, TranslationDictionary, AddonOption } from '../types';
import { getAddonsForDish } from '../data/initialData';
import { FoodIcon } from './FoodIcon';
import { StallGraphic } from './StallGraphic';
import { getDishDisplayImage } from '../utils/imageHelper';

interface MealDetailModalProps {
  dish: DishItem | null;
  budget: number;
  onClose: () => void;
  onAddToTray: (dish: DishItem, addons: { name: string; price: number }[], total: number, selectedVariant?: string) => void;
  t: TranslationDictionary;
}

export const MealDetailModal: React.FC<MealDetailModalProps> = ({
  dish,
  budget,
  onClose,
  onAddToTray,
  t
}) => {
  const [selectedAddons, setSelectedAddons] = useState<{ name: string; price: number }[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<number>(dish?.price || 0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');

  useEffect(() => {
    setSelectedAddons([]);
    if (dish) {
      if (dish.sizeOptions && dish.sizeOptions.length > 0) {
        setSelectedSize(dish.sizeOptions[0].label);
        setSelectedPrice(dish.sizeOptions[0].price);
      } else if (dish.priceOptions && dish.priceOptions.length > 0) {
        setSelectedPrice(dish.priceOptions[0]);
        setSelectedSize('');
      } else {
        setSelectedPrice(dish.price);
        setSelectedSize('');
      }

      if (dish.flavorOptions && dish.flavorOptions.length > 0) {
        setSelectedFlavor(dish.flavorOptions[0]);
      } else {
        setSelectedFlavor('');
      }
    }
  }, [dish]);

  if (!dish) return null;

  const displayImage = getDishDisplayImage(dish);
  const availableAddons: AddonOption[] = getAddonsForDish(dish);

  const toggleAddon = (addon: AddonOption) => {
    const exists = selectedAddons.some(a => a.name === addon.name);
    if (exists) {
      setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, { name: addon.name, price: addon.price }]);
    }
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const currentBasePrice = selectedPrice || dish.price;
  const finalPrice = currentBasePrice + addonsTotal;
  const isOverBudget = finalPrice > budget;
  const overAmount = finalPrice - budget;

  const handleConfirm = () => {
    let variantParts: string[] = [];
    if (selectedSize) variantParts.push(selectedSize);
    if (selectedFlavor) variantParts.push(selectedFlavor);
    if (!selectedSize && dish.priceOptions && dish.priceOptions.length > 0) {
      variantParts.push(`₱${selectedPrice}`);
    }
    const variantDesc = variantParts.length > 0 ? variantParts.join(' • ') : undefined;
    onAddToTray(dish, selectedAddons, finalPrice, variantDesc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        id="meal-modal-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Card / Bottom Sheet */}
      <div 
        id="meal-modal-content"
        className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        
        {/* Modal Top Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-stone-100 bg-[#FFFDF9]">
          <div className="flex items-center gap-3">
            <StallGraphic stallName={dish.stall} size="sm" />
            <div>
              <h3 className="text-sm font-black text-stone-900 font-display">
                {dish.stall}
              </h3>
              <p className="text-[11px] text-stone-600 font-medium">
                {dish.zone === 'outside' ? 'Outside Canopy Lane' : 'Inside Main Hall'} • USTP CDO Campus
              </p>
            </div>
          </div>

          <button
            id="close-meal-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition active:scale-90"
            aria-label="Close meal details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Dish Hero Card with Food Photo or Neutral Fallback */}
          <div className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-50/70">
            {displayImage.url ? (
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100">
                    <img
                      src={displayImage.url}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                    />
                    {displayImage.isRepresentative && (
                      <div className="absolute bottom-2.5 left-2.5 z-10">
                        <span className="text-[11px] font-bold text-stone-700 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-xs border border-stone-200/90 inline-flex items-center gap-1.5">
                          Representative Photo
                        </span>
                      </div>
                    )}
                    {displayImage.isOwnerUploaded && (
                      <div className="absolute bottom-2.5 left-2.5 z-10">
                        <span className="text-[11px] font-bold text-emerald-800 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-xs border border-emerald-300 inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          Official Stall Photo
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[16/9] w-full flex flex-col items-center justify-center bg-stone-100 text-stone-400 border-b border-stone-200/50">
                    <Camera className="w-8 h-8 text-stone-300 mb-1" strokeWidth={1.5} />
                    <span className="text-xs font-semibold text-stone-400">No photo available</span>
                  </div>
                )}

            <div className="p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                <h4 className="text-base sm:text-lg font-black text-stone-900 font-display">
                  {dish.name}
                </h4>
                <span className="text-xl sm:text-2xl font-black text-stone-900 font-display shrink-0">
                  ₱{currentBasePrice}
                </span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                {dish.items}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-lg bg-orange-100 text-orange-800 text-[11px] font-extrabold uppercase tracking-wide">
                  {dish.category}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-bold">
                  {dish.zone === 'outside' ? 'Outside Canopy' : 'Inside Dining Hall'}
                </span>
              </div>
            </div>
          </div>

          {/* Flavor Selection (e.g. Gulaman District Drinks) */}
          {dish.flavorOptions && dish.flavorOptions.length > 0 && (
            <div className="space-y-2 p-3.5 bg-orange-50/60 rounded-2xl border border-orange-200/80">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>Select Flavor (Required):</span>
                </h4>
                <span className="text-[10px] text-orange-700 font-bold bg-orange-100 px-2 py-0.5 rounded">
                  {selectedFlavor || 'Pick a flavor'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {dish.flavorOptions.map((flavor) => {
                  const isSelected = selectedFlavor === flavor;
                  return (
                    <button
                      key={flavor}
                      type="button"
                      onClick={() => setSelectedFlavor(flavor)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-white hover:bg-orange-100/50 border-stone-200 text-stone-800'
                      }`}
                    >
                      <span>{flavor}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size / Variant Selection (when explicit labels like Small, 12 oz, etc. are provided) */}
          {dish.sizeOptions && dish.sizeOptions.length > 0 && (
            <div className="space-y-2 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  <span>Select Size / Option:</span>
                </h4>
                <span className="text-[10px] text-stone-600 font-bold">
                  {selectedSize}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {dish.sizeOptions.map((opt) => {
                  const isSelected = selectedSize === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        setSelectedSize(opt.label);
                        setSelectedPrice(opt.price);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-800'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span>₱{opt.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Options (when multiple prices exist without specified size labels) */}
          {(!dish.sizeOptions || dish.sizeOptions.length === 0) && dish.priceOptions && dish.priceOptions.length > 0 && (
            <div className="space-y-2 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  <span>Select Price:</span>
                </h4>
                <span className="text-[10px] text-stone-600 font-bold">
                  Selected: ₱{selectedPrice}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dish.priceOptions.map((priceVal) => {
                  const isSelected = selectedPrice === priceVal;
                  return (
                    <button
                      key={priceVal}
                      type="button"
                      onClick={() => setSelectedPrice(priceVal)}
                      className={`px-4 py-2 rounded-xl border text-xs font-black transition ${
                        isSelected
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-800'
                      }`}
                    >
                      ₱{priceVal}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons Customization Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Dugang / Add-ons & Drinks:</span>
              </h4>
              <span className="text-[10px] text-stone-600 font-semibold">Optional</span>
            </div>

            <div className="space-y-2">
              {availableAddons.map((addon) => {
                const isChecked = selectedAddons.some(a => a.name === addon.name);
                return (
                  <div
                    key={addon.name}
                    onClick={() => toggleAddon(addon)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer select-none transition ${
                      isChecked
                        ? 'bg-orange-50/80 border-orange-300 shadow-2xs'
                        : 'bg-white hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          isChecked
                            ? 'bg-orange-600 border-orange-600 text-white'
                            : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-bold text-stone-800">
                        {addon.icon} {addon.name}
                      </span>
                    </div>

                    <span className="text-xs font-black text-orange-700">
                      +₱{addon.price}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Budget Warning Alert if Exceeded */}
          {isOverBudget && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-start gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Lapas na sa imong gitakda nga budget! Ang total (₱{finalPrice}) kay ₱{overAmount} lapas sa imong ₱{budget} budget.
              </span>
            </div>
          )}

        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-stone-600 uppercase font-extrabold block tracking-wider">
              Total Tray Amount
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-stone-900 font-display">
                ₱{finalPrice}
              </span>
              {addonsTotal > 0 && (
                <span className="text-[11px] text-stone-600">
                  (Base ₱{dish.price} + ₱{addonsTotal})
                </span>
              )}
            </div>
          </div>

          <button
            id="modal-confirm-add-tray"
            onClick={dish.available ? handleConfirm : undefined}
            disabled={!dish.available}
            className={`flex items-center gap-2 px-5 py-3 font-black text-xs sm:text-sm rounded-2xl transition ${
              !dish.available
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
                : 'bg-orange-600 hover:bg-orange-700 active:scale-95 text-white shadow-md hover:shadow-lg'
            }`}
          >
            <span>{dish.available ? t.saveTray : 'Sold Out Today'}</span>
            {dish.available && <Plus className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
};
