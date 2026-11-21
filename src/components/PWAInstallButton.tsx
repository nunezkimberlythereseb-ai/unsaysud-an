import React, { useState } from 'react';
import {
  Download,
  Share,
  X,
  Smartphone,
  MoreVertical,
  PlusSquare,
  WifiOff
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'banner' | 'button';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header'
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Never show install UI when already running as an installed standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const accepted = await install();
      if (!accepted) {
        setShowGuideModal(true);
      }
    } finally {
      setInstalling(false);
    }
  };

  const renderGuideModal = () => {
    if (!showGuideModal) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 backdrop-blur-xs p-4 animate-fade-in"
        onClick={() => setShowGuideModal(false)}
      >
        <div
          className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900 font-display">
                  {isIOS ? 'Install on iPhone / iPad' : 'Install Our Sud-an App'}
                </h3>
                <p className="text-[11px] text-stone-500">
                  Launch directly from your home screen, online or offline
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              aria-label="Close install instructions"
              className="min-h-[36px] min-w-[36px] rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isIOS ? (
            <div className="space-y-2.5 text-xs text-stone-700 leading-relaxed">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Open this page in <strong className="text-stone-900">Safari</strong> and tap the{' '}
                  <strong className="text-stone-900">Share</strong> icon{' '}
                  <Share className="inline w-3.5 h-3.5 text-sky-600 mx-0.5" /> in the Safari toolbar.
                </p>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Scroll down and select{' '}
                  <strong className="text-stone-900 inline-flex items-center gap-1">
                    Add to Home Screen <PlusSquare className="w-3.5 h-3.5 text-stone-700" />
                  </strong>
                  .
                </p>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Tap <strong className="text-stone-900">Add</strong> at the top right. Our Sud-an opens in standalone mode with zero browser bars.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 text-xs text-stone-700 leading-relaxed">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Open <strong className="text-stone-900">Google Chrome</strong> (or Edge) and tap the browser menu{' '}
                  <strong className="text-stone-900 inline-flex items-center">
                    <MoreVertical className="w-3.5 h-3.5 inline" />
                  </strong>{' '}
                  at the top right.
                </p>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Tap <strong className="text-stone-900">Install app</strong> or{' '}
                  <strong className="text-stone-900">Add to Home screen</strong>, then confirm{' '}
                  <strong className="text-stone-900">Install</strong>.
                </p>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-start gap-2.5">
                <WifiOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  If you scanned a QR code inside a social app or camera viewer, tap <em>Open in Browser</em> first so installation is enabled.
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowGuideModal(false)}
            className="w-full min-h-[44px] py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black transition shadow-xs"
          >
            Got It
          </button>
        </div>
      </div>
    );
  };

  // Chromium / Android native one-tap install available
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <>
          <div
            className={`p-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-black font-display">Install Our Sud-an App</h4>
                <p className="text-xs text-white/95">
                  Add to your home screen for offline menus, sukli calculator & Surprise Me
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={installing}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-white text-orange-600 hover:bg-orange-50 font-black text-xs transition shadow-xs shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{installing ? 'Installing...' : 'Install App'}</span>
            </button>
          </div>
          {renderGuideModal()}
        </>
      );
    }

    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={installing}
          className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black transition shadow-xs active:scale-95 whitespace-nowrap ${className}`}
          title="Install Our Sud-an to your home screen"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{installing ? 'Installing...' : 'Install App'}</span>
          <span className="sm:hidden">Install</span>
        </button>
        {renderGuideModal()}
      </>
    );
  }

  // Banner fallback when browser hasn't fired beforeinstallprompt (iOS Safari, Android Chrome fallback, Desktop)
  if (variant === 'banner') {
    return (
      <>
        <div
          className={`p-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-black font-display">
                {isIOS ? 'Add Our Sud-an to iPhone Home Screen' : 'Install Our Sud-an on Your Phone'}
              </h4>
              <p className="text-xs text-white/95">
                {isIOS
                  ? 'Install via Safari Share -> Add to Home Screen for full offline access'
                  : 'Install as an app for standalone launch & offline campus food budgeting'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white text-orange-600 hover:bg-orange-50 font-black text-xs transition shadow-xs shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
          >
            {isIOS ? <Share className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{isIOS ? 'Add to Home Screen' : 'How to Install'}</span>
          </button>
        </div>
        {renderGuideModal()}
      </>
    );
  }

  // Header compact button for iOS Safari or Android fallback
  if (isIOS || isAndroid) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuideModal(true)}
          className={`min-h-[36px] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition active:scale-95 whitespace-nowrap ${className}`}
          title={isIOS ? 'Add to iPhone Home Screen' : 'Install Our Sud-an App'}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isIOS ? 'Add to Home' : 'Install App'}</span>
        </button>
        {renderGuideModal()}
      </>
    );
  }

  return renderGuideModal();
};
