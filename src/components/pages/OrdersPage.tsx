import React, { useState } from 'react';
import { 
  ClipboardList, 
  Copy, 
  Check, 
  Store, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { TrayItem, AppPage } from '../../types';

interface OrdersPageProps {
  tray: TrayItem[];
  userBudget: number;
  onNavigate: (page: AppPage) => void;
  onClearTray: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  tray,
  userBudget,
  onNavigate,
  onClearTray
}) => {
  const [copied, setCopied] = useState(false);
  const [completedStalls, setCompletedStalls] = useState<Record<string, boolean>>({});

  const totalCost = tray.reduce((sum, i) => sum + i.totalWithAddons * (i.quantity || 1), 0);

  // Group by stall
  const itemsByStall = tray.reduce((acc, item) => {
    if (!acc[item.stall]) {
      acc[item.stall] = [];
    }
    acc[item.stall].push(item);
    return acc;
  }, {} as Record<string, TrayItem[]>);

  const stallList = Object.keys(itemsByStall);

  const toggleStallPickup = (stall: string) => {
    setCompletedStalls(prev => ({
      ...prev,
      [stall]: !prev[stall]
    }));
  };

  const handleCopyOrderSlip = async () => {
    if (tray.length === 0) return;

    let text = "🍱 USTP CDO CAFETERIA ORDER SLIP\n";
    text += "──────────────────────────────\n";
    
    stallList.forEach((stall) => {
      text += `📍 ${stall}\n`;
      itemsByStall[stall].forEach((item) => {
        const qty = item.quantity || 1;
        text += `  • ${qty}x ${item.name} — ₱${item.totalWithAddons * qty}\n`;
        if (item.customAddons && item.customAddons.length > 0) {
          text += `    Add-ons: ${item.customAddons.map(a => a.name).join(', ')}\n`;
        }
      });
      text += "\n";
    });

    text += "──────────────────────────────\n";
    text += `TOTAL: ₱${totalCost} (Budget: ₱${userBudget})\n`;
    text += "Generated via Unsay-Sud-an App";

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#F0EBE1]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 font-display">
            Orders & Pickup Slip
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            A tidy pickup checklist organized by stall to speed up your cafeteria lunch run.
          </p>
        </div>

        {tray.length > 0 && (
          <button
            type="button"
            onClick={handleCopyOrderSlip}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Order Slip</span>
              </>
            )}
          </button>
        )}
      </div>

      {tray.length > 0 && totalCost > userBudget && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 text-xs sm:text-sm flex items-start gap-2.5 tabular-nums"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-black">Budget Exceeded by ₱{totalCost - userBudget}:</strong>{' '}
            Your pickup slip total (₱{totalCost}) is higher than your ₱{userBudget} budget. You can adjust items in your Tray or increase your budget.
          </div>
        </div>
      )}

      {tray.length === 0 ? (
        /* Empty Orders State */
        <div className="bg-white rounded-3xl border border-[#F0EBE1] p-8 sm:p-14 text-center max-w-lg mx-auto space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
            <ClipboardList className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-stone-900 font-display">
              No active order yet
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto leading-relaxed">
              When you add food to your tray, this page generates an organized pickup checklist grouped by stall.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition shadow-xs"
            >
              Start an Order (Go to Home)
            </button>
          </div>
        </div>
      ) : (
        /* Order Slip + Pickup Checklist */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          
          {/* Left Column: Stall by Stall Pickup Checklist */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-500 font-medium px-1">
              <span>Visit {stallList.length} {stallList.length === 1 ? 'stall' : 'stalls'}</span>
              <span>Check off when picked up</span>
            </div>

            <div className="space-y-4">
              {stallList.map((stall) => {
                const items = itemsByStall[stall];
                const stallTotal = items.reduce((s, i) => s + i.totalWithAddons * (i.quantity || 1), 0);
                const isPickedUp = !!completedStalls[stall];

                return (
                  <div
                    key={stall}
                    className={`bg-white rounded-3xl border transition-all p-5 shadow-2xs space-y-3 ${
                      isPickedUp ? 'border-emerald-300 bg-emerald-50/20' : 'border-[#F0EBE1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                          isPickedUp ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-stone-900 font-display">
                            {stall}
                          </h3>
                          <span className="text-[11px] text-stone-500">
                            Stall subtotal: <strong className="text-orange-600 font-black">₱{stallTotal}</strong>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleStallPickup(stall)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          isPickedUp
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-orange-50 hover:text-orange-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isPickedUp ? 'Picked Up' : 'Mark Done'}</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-stone-100 space-y-2">
                      {items.map((item) => {
                        const qty = item.quantity || 1;
                        return (
                          <div
                            key={item.trayId}
                            className="flex items-center justify-between text-xs sm:text-sm"
                          >
                            <div>
                              <span className="font-bold text-stone-800 tabular-nums">
                                {qty > 1 ? `${qty}× ` : ''}{item.name}
                              </span>
                              {item.customAddons && item.customAddons.length > 0 && (
                                <span className="text-stone-500 text-xs ml-1">
                                  (+ {item.customAddons.map(a => a.name).join(', ')})
                                </span>
                              )}
                            </div>
                            <span className="font-black text-stone-900 tabular-nums">₱{item.totalWithAddons * qty}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clear after lunch */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => onNavigate('tray')}
                className="text-orange-600 hover:text-orange-700 font-bold underline"
              >
                ← Edit items in Tray
              </button>
              <button
                type="button"
                onClick={onClearTray}
                className="text-stone-400 hover:text-rose-600 font-bold"
              >
                Clear Order
              </button>
            </div>
          </div>

          {/* Right Column: Campus Pickup Guide & Tips */}
          <div className="bg-[#FFFDF9] rounded-3xl border border-[#F0EBE1] p-5 sm:p-6 shadow-xs space-y-5">
            <h2 className="text-base font-black text-stone-900 font-display">
              Campus Ordering Tips
            </h2>

            <div className="space-y-3.5 text-xs text-stone-600">
              <div className="flex gap-2.5">
                <Clock className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block font-bold">Peak Rush Hours</strong>
                  <span>Cafeteria is most crowded from 11:30 AM to 1:00 PM. Arriving before 11:30 AM gets you faster service.</span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <Store className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block font-bold">Payment Methods</strong>
                  <span>Both Cash and GCash QR are accepted at cafeteria stall counters. Exact change is always appreciated.</span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block font-bold">Tray Return Station</strong>
                  <span>Remember the CLAYGO (Clean As You Go) rule. Return your empty trays and utensils to the central dish drop station.</span>
                </div>
              </div>
            </div>

            {/* Quick summary button */}
            <div className="pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={handleCopyOrderSlip}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied Slip!' : 'Copy Order Text'}</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
