import React, { useState } from 'react';
import {
  Store,
  Compass,
  X,
  ChevronRight,
  Navigation,
  Phone,
  WifiOff
} from 'lucide-react';
import { StallCredential, DishItem, TranslationDictionary } from '../../types';
import { StallGraphic } from '../StallGraphic';
import { FoodCard } from '../FoodCard';
import { formatSyncTimestamp } from '../../utils/offlineStore';

interface StallsPageProps {
  stalls: StallCredential[];
  allDishes: DishItem[];
  selectedStall: string | null;
  onSelectStall: (stallName: string | null) => void;
  stallNotices: Record<string, string>;
  userBudget: number;
  isOnline?: boolean;
  lastSyncedAt?: string | null;
  onQuickAdd: (dish: DishItem) => void;
  onOpenDetail: (dish: DishItem) => void;
  onToggleFavorite: (id: number) => void;
  favorites: number[];
  t: TranslationDictionary;
}

export const StallsPage: React.FC<StallsPageProps> = ({
  stalls,
  allDishes,
  selectedStall,
  onSelectStall,
  stallNotices,
  userBudget,
  isOnline = true,
  lastSyncedAt = null,
  onQuickAdd,
  onOpenDetail,
  onToggleFavorite,
  favorites,
  t
}) => {
  const [zoneFilter, setZoneFilter] = useState<'all' | 'outside' | 'inside'>('all');
  const [showMapDiagram, setShowMapDiagram] = useState(false);

  const outsideStalls = stalls.filter((s) => s.zone === 'outside');
  const insideStalls = stalls.filter((s) => s.zone === 'inside');

  const dishCountMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    allDishes.forEach((d) => {
      if (!d.hidden) {
        map[d.stall] = (map[d.stall] || 0) + 1;
      }
    });
    return map;
  }, [allDishes]);

  const filteredStalls = stalls.filter((s) => {
    if (zoneFilter === 'all') return true;
    return s.zone === zoneFilter;
  });

  const selectedStallMeta = selectedStall
    ? stalls.find((s) => s.name === selectedStall)
    : undefined;

  const stallDishes = selectedStall
    ? allDishes.filter((d) => d.stall === selectedStall && !d.hidden)
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#F0EBE1]">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 font-display">
            Cafeteria Stalls Directory
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 tabular-nums">
            {stalls.length} {stalls.length === 1 ? 'active stall' : 'active stalls'}{' '}
            {isOnline ? 'currently open' : 'from cached menu snapshot'} at the USTP CDO Cafeteria Complex.
          </p>
        </div>

        {stalls.length > 0 && (
          <button
            type="button"
            onClick={() => setShowMapDiagram(!showMapDiagram)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-2xs self-start sm:self-auto ${
              showMapDiagram
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-stone-700 border-[#F0EBE1] hover:bg-orange-50/50'
            }`}
          >
            <Compass className="w-4 h-4 text-orange-500" />
            <span>{showMapDiagram ? 'Hide Complex Map' : 'View Complex Map'}</span>
          </button>
        )}
      </div>

      {!isOnline && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Showing previously cached stall menus (last synchronized: <strong>{formatSyncTimestamp(lastSyncedAt)}</strong>). Reconnect for live stock changes.
          </span>
        </div>
      )}

      {/* Interactive Map Diagram */}
      {showMapDiagram && stalls.length > 0 && (
        <section className="bg-stone-900 text-white rounded-3xl p-5 sm:p-7 border border-stone-800 space-y-4 animate-fade-in shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-stone-300 pb-1 border-b border-stone-800">
            <span className="flex items-center gap-1.5 text-orange-400">
              <Navigation className="w-4 h-4" />
              <span>USTP CDO CAFETERIA COMPLEX FLOORPLAN</span>
            </span>
            <span className="text-[11px] bg-stone-800 px-2 py-0.5 rounded text-emerald-400 font-mono tabular-nums">
              {stalls.length} ACTIVE {stalls.length === 1 ? 'STALL' : 'STALLS'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Outside Zone Box */}
            <div className="bg-stone-800/90 rounded-2xl p-4 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-emerald-400 uppercase tracking-wider text-xs">
                  Outside Canopy Lane
                </span>
                <span className="text-[10px] text-stone-400 tabular-nums">
                  {outsideStalls.length} {outsideStalls.length === 1 ? 'stall' : 'stalls'}
                </span>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                Open-air covered walkway serving snacks, fruit shakes, waffles, rice bowls, and street bites.
              </p>
              {outsideStalls.length === 0 ? (
                <p className="text-[11px] text-stone-400 italic">No active stalls in this zone yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {outsideStalls.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => {
                        onSelectStall(s.name);
                        setShowMapDiagram(false);
                      }}
                      className="p-2 rounded-lg bg-stone-700/80 hover:bg-orange-600 text-[10px] font-semibold text-stone-200 hover:text-white transition text-left truncate"
                    >
                      {s.stallNo ? `${s.stallNo} — ${s.name}` : s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Inside Zone Box */}
            <div className="bg-stone-800/90 rounded-2xl p-4 border border-sky-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-sky-400 uppercase tracking-wider text-xs">
                  Inside Dining Hall
                </span>
                <span className="text-[10px] text-stone-400 tabular-nums">
                  {insideStalls.length} {insideStalls.length === 1 ? 'stall' : 'stalls'}
                </span>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                Air-ventilated dining hall with student tables offering home-cooked rice meals, dumplings, desserts, and bakery items.
              </p>
              {insideStalls.length === 0 ? (
                <p className="text-[11px] text-stone-400 italic">No active stalls in this zone yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {insideStalls.map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => {
                        onSelectStall(s.name);
                        setShowMapDiagram(false);
                      }}
                      className="p-2 rounded-lg bg-stone-700/80 hover:bg-orange-600 text-[10px] font-semibold text-stone-200 hover:text-white transition text-left truncate"
                    >
                      {s.stallNo ? `${s.stallNo} — ${s.name}` : s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Selected Stall View */}
      {selectedStall ? (
        <section className="space-y-6">
          <div className="bg-orange-50/90 rounded-3xl border border-orange-200/90 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <StallGraphic stallName={selectedStall} size="md" />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 font-semibold">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md">
                    {selectedStallMeta?.zone === 'inside' ? 'Inside Hall' : 'Outside Canopy'}
                  </span>
                  <span className="tabular-nums">{stallDishes.length} menu items</span>
                  {selectedStallMeta?.contactInfo && (
                    <span className="inline-flex items-center gap-1 text-stone-600">
                      <Phone className="w-3 h-3 text-orange-600" />
                      {selectedStallMeta.contactInfo}
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900 font-display">
                  {selectedStall}
                </h2>
                {selectedStallMeta?.description && (
                  <p className="text-xs text-stone-600 max-w-2xl leading-relaxed">
                    {selectedStallMeta.description}
                  </p>
                )}
                {stallNotices[selectedStall] && (
                  <p className="text-xs text-amber-900 bg-amber-100/70 border border-amber-200 rounded-lg px-2.5 py-1 mt-1.5 inline-block font-medium">
                    Notice: {stallNotices[selectedStall]}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectStall(null)}
              className="min-h-[44px] px-4 py-2 bg-white hover:bg-stone-50 border border-orange-200 text-stone-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto shadow-2xs shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Back to All Stalls</span>
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-700">Menu from {selectedStall}</h3>

            {stallDishes.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#F0EBE1] p-8 text-center text-xs text-stone-500">
                No menu items have been posted for this stall yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {stallDishes.map((dish) => (
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
        </section>
      ) : stalls.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-10 sm:p-14 text-center max-w-lg mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
            <Store className="w-7 h-7" />
          </div>
          <h2 className="text-base sm:text-lg font-black text-stone-900 font-display">
            No active stalls available yet
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
            Registered cafeteria stalls with an active trial or approved subscription will automatically appear here.
          </p>
        </div>
      ) : (
        <section className="space-y-5">
          {/* Dynamic Zone Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setZoneFilter('all')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl transition border tabular-nums ${
                zoneFilter === 'all'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-2xs font-black'
                  : 'bg-white text-stone-600 border-[#F0EBE1] hover:bg-orange-50/50 hover:text-orange-700'
              }`}
            >
              All Stalls ({stalls.length})
            </button>
            <button
              type="button"
              onClick={() => setZoneFilter('outside')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl transition border tabular-nums ${
                zoneFilter === 'outside'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-2xs font-black'
                  : 'bg-white text-stone-600 border-[#F0EBE1] hover:bg-orange-50/50 hover:text-orange-700'
              }`}
            >
              Outside Canopy ({outsideStalls.length})
            </button>
            <button
              type="button"
              onClick={() => setZoneFilter('inside')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl transition border tabular-nums ${
                zoneFilter === 'inside'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-2xs font-black'
                  : 'bg-white text-stone-600 border-[#F0EBE1] hover:bg-orange-50/50 hover:text-orange-700'
              }`}
            >
              Inside Dining Hall ({insideStalls.length})
            </button>
          </div>

          {filteredStalls.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-10 text-center text-xs text-stone-500">
              No active stalls found in this zone.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredStalls.map((s) => {
                const count = dishCountMap[s.name] || 0;
                const notice = stallNotices[s.name];

                return (
                  <div
                    key={s.name}
                    onClick={() => onSelectStall(s.name)}
                    className="bg-white rounded-3xl border border-[#F0EBE1] p-5 hover:border-orange-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <StallGraphic stallName={s.name} size="sm" />
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            s.zone === 'outside'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}
                        >
                          {s.zone === 'outside' ? 'Outside' : 'Inside'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-extrabold text-orange-600 block">
                          {s.stallNo || 'Cafeteria Stall'}
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-stone-900 font-display group-hover:text-orange-600 transition-colors line-clamp-1">
                          {s.name}
                        </h3>
                        {s.description && (
                          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                            {s.description}
                          </p>
                        )}
                        {s.contactInfo && (
                          <p className="text-[11px] text-stone-500 flex items-center gap-1 pt-0.5">
                            <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                            <span className="truncate">{s.contactInfo}</span>
                          </p>
                        )}
                      </div>

                      {notice && (
                        <p className="text-[11px] text-amber-800 bg-amber-50 rounded-lg p-2 border border-amber-200/60 line-clamp-2">
                          {notice}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-semibold">
                      <span className="text-stone-500 tabular-nums">
                        {count} {count === 1 ? 'dish' : 'dishes'}
                      </span>
                      <span className="text-orange-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        <span>View Menu</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

