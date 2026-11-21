import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw, Clock } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { formatSyncTimestamp } from '../utils/offlineStore';

interface OfflineIndicatorProps {
  onReconnected?: () => void;
  lastSyncedAt?: string | null;
  isSyncing?: boolean;
  onManualSync?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  onReconnected,
  lastSyncedAt = null,
  isSyncing = false,
  onManualSync
}) => {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [showBackOnlineToast, setShowBackOnlineToast] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowBackOnlineToast(true);
      if (onReconnected) onReconnected();
      const timer = setTimeout(() => {
        setShowBackOnlineToast(false);
        setWasOffline(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, onReconnected]);

  if (showBackOnlineToast) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold shadow-xl border border-emerald-400">
          <Wifi className="w-4 h-4 shrink-0" />
          <span>Back online — Syncing latest menus, stalls & offline visits</span>
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-amber-600 text-white px-4 py-2.5 text-xs shadow-sm sticky top-0 z-40 border-b border-amber-700"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
          <div className="flex items-start sm:items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0 text-amber-100" />
            <span className="font-semibold leading-snug">
              You're currently offline. You can still browse previously loaded menus and use the budgeting features.
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-100 shrink-0 pl-6 sm:pl-0">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Last synced: {formatSyncTimestamp(lastSyncedAt)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (isSyncing && onManualSync) {
    return (
      <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 px-4 py-1 text-[11px] font-semibold">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5">
          <RefreshCw className="w-3 h-3 animate-spin text-emerald-700" />
          <span>Refreshing latest cafeteria menus...</span>
        </div>
      </div>
    );
  }

  return null;
};
