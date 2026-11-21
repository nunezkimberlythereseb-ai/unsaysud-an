import React, { useState } from 'react';
import { ShoppingBag, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { AppPage } from '../types';

interface BudgetSummaryBarProps {
  budget: number;
  spent: number;
  trayCount: number;
  onBudgetChange: (val: number) => void;
  onNavigate: (page: AppPage) => void;
  currentPage: AppPage;
}

const PRESET_BUDGETS = [25, 40, 55, 75, 100];

export const BudgetSummaryBar: React.FC<BudgetSummaryBarProps> = ({
  budget,
  spent,
  trayCount,
  onBudgetChange,
  onNavigate,
  currentPage
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget.toString());
  const [inlineError, setInlineError] = useState<string | null>(null);

  const remaining = budget - spent;
  const isOverBudget = remaining < 0;

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = tempBudget.trim();
    const val = Number(raw);
    if (!raw || !Number.isFinite(val) || val < 1 || val > 500) {
      setInlineError('₱1–₱500 only');
      return;
    }
    setInlineError(null);
    onBudgetChange(Math.round(val));
    setIsEditing(false);
  };

  return (
    <div className="sticky top-14 sm:top-16 z-20 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#F0EBE1] shadow-2xs py-1.5 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 text-xs sm:text-sm overflow-x-auto no-scrollbar">
        {/* Left: Budget, Spent, and Sukli / Remaining */}
        <div className="flex items-center gap-2.5 sm:gap-5 shrink-0">
          {/* Your Budget */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 font-semibold text-[11px] uppercase tracking-wider hidden sm:inline">
              Budget:
            </span>
            {isEditing ? (
              <form onSubmit={handleSaveBudget} className="flex items-center gap-1">
                <span className="text-stone-500 font-bold">₱</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  step={1}
                  value={tempBudget}
                  onChange={(e) => {
                    setTempBudget(e.target.value);
                    if (inlineError) setInlineError(null);
                  }}
                  aria-label="Edit student budget"
                  className="w-16 min-h-[32px] px-1.5 py-0.5 text-xs font-bold bg-white border border-orange-400 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500 tabular-nums"
                  autoFocus
                />
                <button
                  type="submit"
                  aria-label="Apply budget"
                  className="min-h-[32px] min-w-[32px] p-1 bg-orange-600 text-white rounded-lg text-[10px] font-bold hover:bg-orange-700 flex items-center justify-center"
                >
                  <Check className="w-3 h-3" />
                </button>
                {inlineError && (
                  <span className="text-[10px] font-bold text-rose-600 whitespace-nowrap">
                    {inlineError}
                  </span>
                )}
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTempBudget(budget.toString());
                  setInlineError(null);
                  setIsEditing(true);
                }}
                className="group flex items-center gap-1 hover:text-orange-600 transition whitespace-nowrap min-h-[36px] px-1"
                title="Click to edit budget (₱1–₱500)"
              >
                <span className="text-stone-900 font-black text-sm sm:text-base font-display tabular-nums">
                  ₱{budget}
                </span>
                <span className="text-[10px] text-stone-400 group-hover:text-orange-600 underline">
                  edit
                </span>
              </button>
            )}
          </div>

          <span className="text-stone-300">|</span>

          {/* Spent Amount */}
          <div className="flex items-center gap-1 whitespace-nowrap">
            <span className="text-stone-500 font-semibold text-[11px] uppercase tracking-wider">
              Total:
            </span>
            <span className="text-stone-800 font-bold text-xs sm:text-sm tabular-nums">
              ₱{spent}
            </span>
            {trayCount > 0 && (
              <span className="text-[11px] text-stone-500 font-medium hidden sm:inline tabular-nums">
                ({trayCount} {trayCount === 1 ? 'item' : 'items'})
              </span>
            )}
          </div>

          <span className="text-stone-300">|</span>

          {/* Sukli / Remaining */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-stone-600 font-bold text-[11px] uppercase tracking-wider">
              Sukli:
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs sm:text-sm font-black transition tabular-nums ${
                isOverBudget
                  ? 'bg-rose-50 text-rose-800 border border-rose-300'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
              }`}
            >
              {isOverBudget ? (
                <>
                  <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                  <span>₱{Math.abs(remaining)} over</span>
                </>
              ) : (
                <span>₱{remaining}</span>
              )}
            </span>
          </div>
        </div>

        {/* Right: Quick Budget Preset Selector & View Tray action */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
          <div className="hidden md:flex items-center gap-1 text-[11px]">
            <span className="text-stone-400 mr-1 font-medium">Presets:</span>
            {PRESET_BUDGETS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => onBudgetChange(amt)}
                className={`min-h-[34px] px-2.5 py-1 rounded-lg font-bold transition tabular-nums whitespace-nowrap ${
                  budget === amt
                    ? 'bg-orange-600 text-white shadow-2xs font-black'
                    : 'bg-stone-100 text-stone-600 hover:bg-orange-50 hover:text-orange-700'
                }`}
              >
                ₱{amt}
              </button>
            ))}
          </div>

          {currentPage !== 'tray' && (
            <button
              type="button"
              onClick={() => onNavigate('tray')}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs whitespace-nowrap shrink-0 ${
                trayCount > 0
                  ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Tray</span>
              {trayCount > 0 && (
                <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px] font-black tabular-nums">
                  {trayCount}
                </span>
              )}
              <ArrowRight className="w-3 h-3 hidden sm:inline" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
