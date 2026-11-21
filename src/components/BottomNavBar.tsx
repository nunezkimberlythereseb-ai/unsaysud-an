import React from 'react';
import { Home, Search, Store, ShoppingBag, ClipboardList, HelpCircle, ShieldCheck } from 'lucide-react';
import { AppPage } from '../types';

interface BottomNavBarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  trayCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentPage,
  onNavigate,
  trayCount
}) => {
  const items: { id: AppPage; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4.5 h-4.5" /> },
    { id: 'explore', label: 'Explore', icon: <Search className="w-4.5 h-4.5" /> },
    { id: 'stalls', label: 'Stalls', icon: <Store className="w-4.5 h-4.5" /> },
    { id: 'tray', label: 'Tray', icon: <ShoppingBag className="w-4.5 h-4.5" />, badge: trayCount },
    { id: 'orders', label: 'Orders', icon: <ClipboardList className="w-4.5 h-4.5" /> },
    { id: 'portal', label: 'Portal', icon: <ShieldCheck className="w-4.5 h-4.5" /> },
    { id: 'help', label: 'Help', icon: <HelpCircle className="w-4.5 h-4.5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-t border-[#F0EBE1] py-1 px-1.5 lg:hidden shadow-lg safe-bottom">
      <div className="flex items-center justify-around max-w-xl mx-auto">
        {items.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition active:scale-90 relative ${
                isActive
                  ? 'text-orange-600 font-black'
                  : 'text-stone-500 hover:text-stone-800 font-medium'
              }`}
            >
              <div className="relative">
                {item.icon}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-orange-600 text-white font-black text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center ring-1 ring-white tabular-nums">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 whitespace-nowrap ${isActive ? 'font-black' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
