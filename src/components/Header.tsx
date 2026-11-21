import {
  Home,
  Search,
  Store,
  ShoppingBag,
  ClipboardList,
  HelpCircle,
  LogOut,
  ShieldCheck,
  Bell,
  ShieldAlert
} from 'lucide-react';
import { Language, TranslationDictionary, AppPage } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  trayCount: number;
  onOpenMerchantAuth: () => void;
  t: TranslationDictionary;
  isMerchantActive: boolean;
  activeStallName: string | null;
  onLogoutMerchant: () => void;
  onSecretTap?: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  isAdminActive?: boolean;
  onLogoutAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  currentLang,
  onLanguageChange,
  trayCount,
  isMerchantActive,
  activeStallName,
  onLogoutMerchant,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  isAdminActive = false,
  onLogoutAdmin
}) => {
  const navItems: { id: AppPage; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'explore', label: 'Explore', icon: <Search className="w-4 h-4" /> },
    { id: 'stalls', label: 'Stalls', icon: <Store className="w-4 h-4" /> },
    { id: 'tray', label: 'Tray', icon: <ShoppingBag className="w-4 h-4" />, badge: trayCount },
    { id: 'orders', label: 'Orders', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'portal', label: 'Stall Portal', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'admin', label: 'Admin', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'help', label: 'Help', icon: <HelpCircle className="w-4 h-4" /> }
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#F0EBE1] shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              id="brand-logo"
              onClick={() => onNavigate('home')}
              className="flex items-baseline gap-1 cursor-pointer select-none whitespace-nowrap shrink-0 text-left focus:outline-none"
            >
              <span className="text-base sm:text-lg font-black tracking-tight text-stone-900 font-display">
                unsaysud-an<span className="text-orange-600">tech</span>
              </span>
              <span className="hidden xl:inline text-xs font-bold text-stone-500 font-mono">
                / ustpcdocafeteria
              </span>
            </button>

            {/* Zone 2: Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-stone-600">
              {navItems.map((item) => {
                const isActive =
                  currentPage === item.id ||
                  (item.id === 'portal' && currentPage === 'subscription');
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`relative px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-orange-50 text-orange-700 border border-orange-200/80 font-black'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <span className={isActive ? 'text-orange-600' : 'text-stone-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-black min-w-[18px] text-center bg-orange-600 text-white tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Zone 3: Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isMerchantActive && (
              <div
                onClick={() => onNavigate('portal')}
                className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition whitespace-nowrap shrink-0"
                title="Go to Stall Dashboard"
              >
                <span className="font-bold text-amber-900 truncate max-w-[96px] sm:max-w-[140px]">
                  {activeStallName}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogoutMerchant();
                  }}
                  className="text-stone-500 hover:text-stone-800 p-0.5"
                  title="Sign out stall owner"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isAdminActive && (
              <div
                onClick={() => onNavigate('admin')}
                className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-300 px-2.5 py-1.5 rounded-xl text-xs cursor-pointer transition whitespace-nowrap shrink-0"
                title="Go to Admin Dashboard"
              >
                <span className="font-bold text-purple-900">Admin</span>
                {onLogoutAdmin && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLogoutAdmin();
                    }}
                    className="text-stone-500 hover:text-stone-800 p-0.5"
                    title="Sign out admin"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <PWAInstallButton />

            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative min-h-[36px] min-w-[36px] p-2 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-600 hover:text-stone-900 transition active:scale-95 flex items-center justify-center shrink-0"
                title="In-app Notifications"
                aria-label="In-app Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white tabular-nums">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200/80 text-[11px] font-bold text-stone-600 shrink-0">
              <button
                type="button"
                onClick={() => onLanguageChange('bisaya')}
                className={`px-2 py-1 rounded-lg transition whitespace-nowrap ${
                  currentLang === 'bisaya'
                    ? 'bg-white text-stone-900 shadow-2xs font-black'
                    : 'hover:text-stone-900'
                }`}
              >
                Bisaya
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('english')}
                className={`px-2 py-1 rounded-lg transition whitespace-nowrap ${
                  currentLang === 'english'
                    ? 'bg-white text-stone-900 shadow-2xs font-black'
                    : 'hover:text-stone-900'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

