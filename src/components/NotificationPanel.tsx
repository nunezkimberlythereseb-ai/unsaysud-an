import React from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  CreditCard, 
  Sparkles,
  ArrowRight,
  Megaphone,
  Store
} from 'lucide-react';
import { AppNotification, AppPage } from '../types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (notificationId?: string, markAll?: boolean) => void;
  onNavigate: (page: AppPage) => void;
  title?: string;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onNavigate,
  title = "In-App Notifications"
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'payment_approved':
      case 'access_granted':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'payment_rejected':
      case 'access_revoked':
      case 'expired':
        return <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'payment_info_requested':
      case 'due_today':
      case 'reminder_1d':
        return <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'payment_pending':
        return <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />;
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-orange-600 shrink-0" />;
      case 'registration':
        return <Store className="w-4 h-4 text-emerald-600 shrink-0" />;
      default:
        return <Clock className="w-4 h-4 text-orange-500 shrink-0" />;
    }
  };

  const getCardTone = (type: AppNotification['type']) => {
    switch (type) {
      case 'payment_approved':
      case 'access_granted':
        return 'border-emerald-200 bg-emerald-50/40';
      case 'payment_rejected':
      case 'access_revoked':
      case 'expired':
        return 'border-rose-200 bg-rose-50/40';
      case 'payment_info_requested':
      case 'due_today':
      case 'reminder_1d':
        return 'border-amber-200 bg-amber-50/40';
      case 'payment_pending':
        return 'border-blue-200 bg-blue-50/40';
      case 'announcement':
        return 'border-orange-200 bg-orange-50/50';
      default:
        return 'border-stone-200 bg-stone-50/40';
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const diffMs = Date.now() - d.getTime();
      const diffMin = Math.floor(diffMs / (60 * 1000));
      const diffHr = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHr / 24);

      if (diffMin < 2) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/40 backdrop-blur-xs flex justify-end animate-fade-in">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-stone-200 transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-stone-900 font-display flex items-center gap-2">
                <span>{title}</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-stone-500">Subscription due reminders & payment updates</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => onMarkRead(undefined, true)}
                className="p-1.5 text-stone-500 hover:text-stone-800 text-[11px] font-bold flex items-center gap-1 hover:bg-stone-200/60 rounded-lg transition"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2 text-stone-400">
              <Bell className="w-8 h-8 mx-auto stroke-[1.5] text-stone-300" />
              <p className="text-xs font-semibold text-stone-600">No notifications yet</p>
              <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                Due date alerts, renewal reminders, and payment status updates will appear here.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.isRead) onMarkRead(item.id, false);
                  if (item.link === 'subscription') {
                    onNavigate('subscription');
                    onClose();
                  } else if (item.link === 'admin') {
                    onNavigate('admin');
                    onClose();
                  } else if (item.link === 'portal') {
                    onNavigate('portal');
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-2xl border transition cursor-pointer relative group ${
                  getCardTone(item.type)
                } ${!item.isRead ? 'ring-1 ring-orange-200' : 'opacity-85'}`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">{getIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-1">
                      <h4 className="text-xs font-black text-stone-900 leading-tight">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-stone-400 shrink-0 font-medium">
                        {formatTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      {item.message}
                    </p>

                    {item.link && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-orange-600 group-hover:text-orange-700">
                        <span>
                          {item.link === 'subscription' && 'View Subscription & Pay'}
                          {item.link === 'admin' && 'Open Admin Verification'}
                          {item.link === 'portal' && 'Go to Stall Portal'}
                        </span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    )}
                  </div>
                </div>

                {!item.isRead && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-600 ring-2 ring-white" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-stone-100 bg-stone-50/80 flex items-center justify-between text-[11px]">
          <span className="text-stone-500 font-medium">
            Automatic server-side expiration & reminders
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-stone-700 hover:text-stone-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
