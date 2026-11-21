import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  Copy,
  Check,
  ArrowRight,
  Plus,
  Minus
} from 'lucide-react';
import { TrayItem, AppPage, TranslationDictionary } from '../../types';
import { FoodIcon } from '../FoodIcon';

interface TrayPageProps {
  tray: TrayItem[];
  userBudget: number;
  onUpdateQuantity: (trayId: string, delta: number) => void;
  onRemoveItem: (trayId: string) => void;
  onClearTray: () => void;
  onCopyTray: () => void;
  onNavigate: (page: AppPage) => void;
  t: TranslationDictionary;
}

export const TrayPage: React.FC<TrayPageProps> = ({
  tray,
  userBudget,
  onUpdateQuantity,
  onRemoveItem,
  onClearTray,
  onCopyTray,
  onNavigate
}) => {
  const [copied, setCopied] = useState(false);

  const totalItemsCount = tray.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalCost = tray.reduce((sum, item) => sum + item.totalWithAddons * (item.quantity || 1), 0);
  const remaining = userBudget - totalCost;
  const isOverBudget = remaining < 0;

  const handleCopy = () => {
    onCopyTray();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#F0EBE1]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 font-display">
            My Food Tray
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Adjust item quantities and verify your total and sukli before heading to the counters.
          </p>
        </div>

        {tray.length > 0 && (
          <button
            type="button"
            onClick={onClearTray}
            className="text-xs font-bold text-stone-500 hover:text-rose-600 transition flex items-center gap-1 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Tray</span>
          </button>
        )}
      </div>

      {tray.length > 0 && isOverBudget && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
        >
          <div>
            <strong className="font-black block">
              Over Budget by ₱{Math.abs(remaining)}
            </strong>
            <span className="text-rose-800">
              Your selected items (₱{totalCost}) exceed your current ₱{userBudget} budget. Adjust quantities or remove items below — nothing was removed automatically.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="min-h-[40px] px-3.5 rounded-xl bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 font-bold text-xs shrink-0 self-start sm:self-center"
          >
            Adjust Budget
          </button>
        </div>
      )}

      {tray.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#F0EBE1] p-8 sm:p-14 text-center max-w-lg mx-auto space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-stone-900 font-display">
              Your tray is currently empty
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
              Explore meals that fit your ₱{userBudget} budget and add items to calculate your total and sukli.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition shadow-xs"
            >
              Browse Budget Meals (Home)
            </button>
            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-orange-50 hover:text-orange-700 text-stone-700 font-bold text-xs transition"
            >
              Explore Full Menu
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          {/* Left Column: Tray Items */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium px-1 tabular-nums">
              <span>{totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in your tray</span>
              <span>Qty & Subtotal</span>
            </div>

            <div className="space-y-3">
              {tray.map((item) => {
                const qty = item.quantity || 1;
                const lineSubtotal = item.totalWithAddons * qty;
                return (
                  <div
                    key={item.trayId}
                    className="bg-white rounded-2xl border border-[#F0EBE1] p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <FoodIcon dish={item} size="xs" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-orange-600 block truncate">
                          {item.stall}
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-stone-900 font-display truncate">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-stone-500 tabular-nums">
                          ₱{item.totalWithAddons} each
                          {item.selectedVariant ? ` · ${item.selectedVariant}` : ''}
                        </p>
                        {item.customAddons && item.customAddons.length > 0 && (
                          <div className="text-[11px] text-stone-500 font-medium pt-0.5">
                            Add-ons: {item.customAddons.map((a) => `${a.name} (+₱${a.price})`).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1 border border-stone-200/80">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.trayId, -1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="w-9 h-9 rounded-lg bg-white hover:bg-orange-50 text-stone-700 hover:text-orange-700 flex items-center justify-center transition shadow-2xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs sm:text-sm font-black text-stone-900 tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.trayId, 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="w-9 h-9 rounded-lg bg-white hover:bg-orange-50 text-stone-700 hover:text-orange-700 flex items-center justify-center transition shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-base sm:text-lg font-black text-stone-900 font-display min-w-[60px] text-right tabular-nums">
                        ₱{lineSubtotal}
                      </span>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.trayId)}
                        className="min-h-[40px] min-w-[40px] p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition flex items-center justify-center"
                        title="Remove item"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="w-full min-h-[44px] py-3 rounded-2xl border border-dashed border-stone-300 text-stone-600 hover:text-stone-900 hover:border-orange-300 hover:bg-orange-50/40 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add More Food to Tray</span>
              </button>
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="bg-[#FFFDF9] rounded-3xl border border-[#F0EBE1] p-5 sm:p-6 shadow-xs space-y-5 sticky top-28">
            <h2 className="text-base font-black text-stone-900 font-display">
              Budget & Sukli Summary
            </h2>

            <div className="space-y-2.5 text-xs sm:text-sm border-b border-stone-100 pb-4 tabular-nums">
              <div className="flex items-center justify-between text-stone-600">
                <span>Target Budget</span>
                <span className="font-bold text-stone-900">₱{userBudget}</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Tray Total ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'})</span>
                <span className="font-bold text-stone-900">₱{totalCost}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <span className="font-bold text-stone-800">Remaining Sukli</span>
                <span
                  className={`font-black text-sm sm:text-base px-2.5 py-0.5 rounded-md ${
                    isOverBudget
                      ? 'text-rose-700 bg-rose-50 border border-rose-200'
                      : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                  }`}
                >
                  {isOverBudget ? `₱${Math.abs(remaining)} over` : `₱${remaining}`}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onNavigate('orders')}
                className="w-full min-h-[44px] py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs active:scale-95"
              >
                <span>View Orders Slip</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="w-full min-h-[44px] py-2.5 rounded-xl border border-stone-300 hover:bg-white text-stone-700 font-bold text-xs transition flex items-center justify-center gap-2 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Order Checklist</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-stone-400 text-center leading-relaxed">
              Unsay-Sud-an helps you plan your cafeteria budget. Pay in person at the respective stall counters via Cash or GCash.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

