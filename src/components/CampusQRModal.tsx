import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Copy,
  Check,
  X,
  Wifi,
  WifiOff,
  Smartphone,
  ExternalLink
} from 'lucide-react';

interface CampusQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  officialAppUrl?: string;
}

export const CampusQRModal: React.FC<CampusQRModalProps> = ({
  isOpen,
  onClose,
  officialAppUrl
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const targetUrl = React.useMemo(() => {
    const trimmed = (officialAppUrl || '').trim();
    if (trimmed && /^https?:\/\//i.test(trimmed)) {
      return trimmed.replace(/\/+$/, '');
    }
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://ais-pre-oruy4f4mj757x5vir5si2a-165677608534.asia-east1.run.app';
  }, [officialAppUrl]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    QRCode.toDataURL(targetUrl, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1c1917',
        light: '#ffffff'
      }
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard fallback
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = 'our-sudan-campus-qr.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 backdrop-blur-xs p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[#FFFDF9] border border-orange-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 bg-white border-b border-stone-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-stone-900 font-display">
                Our Sud-an Campus QR Code
              </h2>
              <p className="text-[11px] text-stone-500">
                Scan with your phone camera to open & install Our Sud-an
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR modal"
            className="min-h-[40px] min-w-[40px] rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          <div className="flex flex-col items-center gap-3 bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR code to launch Our Sud-an"
                className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-2xl border border-stone-100"
              />
            ) : (
              <div className="w-52 h-52 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">
                Generating QR...
              </div>
            )}

            <div className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-stone-700 truncate">{targetUrl}</span>
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700 shrink-0"
                title="Open URL"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2.5 w-full">
              <button
                type="button"
                onClick={handleDownloadQR}
                disabled={!qrDataUrl}
                className="min-h-[44px] px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Save QR PNG</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="min-h-[44px] px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Honest 3-Scenario Online / Offline Guidance */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-stone-500">
              How QR Access & Offline Mode Work
            </h3>

            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-2.5">
              <Wifi className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-950 block">1. First-Time Opening (Online)</strong>
                <p className="text-emerald-900/90 leading-relaxed mt-0.5">
                  Scan this QR code with internet access. Our Sud-an opens and automatically saves menus, images, and budget tools to your phone, then lets you tap <strong>Install App</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5">
              <WifiOff className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-950 block">2. Returning User (Currently Offline)</strong>
                <p className="text-amber-900/90 leading-relaxed mt-0.5">
                  If you already loaded this URL in the same browser, the cached app opens offline. Some phone QR scanners use an isolated mini-browser—if offline, open the installed <strong>Our Sud-an</strong> icon from your home screen directly.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-stone-100 border border-stone-200 flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900 block">3. Installed App (Always Offline-Ready)</strong>
                <p className="text-stone-600 leading-relaxed mt-0.5">
                  Once installed on Android or iPhone Home Screen, Our Sud-an opens standalone with zero browser bars and full offline budgeting without needing any QR scan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
