import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Clock,
  MapPin,
  MessageSquare,
  ShieldCheck,
  QrCode,
  WifiOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PWAInstallButton } from '../PWAInstallButton';

interface HelpPageProps {
  onOpenOnboarding: () => void;
  onOpenMerchantAuth: () => void;
  onOpenCampusQR?: () => void;
  onShowToast: (msg: string) => void;
}

export const HelpPage: React.FC<HelpPageProps> = ({
  onOpenOnboarding,
  onOpenMerchantAuth,
  onOpenCampusQR,
  onShowToast
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const faqs = [
    {
      q: "How does the Budget Matcher calculate my meal choices?",
      a: "Set any custom wallet amount from ₱1 up to ₱500 (or tap quick presets like ₱25, ₱40, ₱55, ₱75, or ₱100). Our Sud-an filters dishes that cost equal to or less than your budget and calculates your remaining sukli."
    },
    {
      q: "Can I use Our Sud-an without mobile data or Wi-Fi?",
      a: "Yes! Once you open Our Sud-an while online or install it to your Android or iPhone Home Screen, previously loaded stalls, menus, images, your custom budget, and Surprise Me continue working offline."
    },
    {
      q: "What is the difference between Outside and Inside stalls?",
      a: "Outside Canopy stalls are located along the open-air covered walkway, while Inside Dining Hall stalls are inside the main dining complex with student tables."
    },
    {
      q: "What does 'Surprise Me!' do?",
      a: "Can't decide what to eat during lunch break? Surprise Me picks a random available meal within your selected budget and craving preference—never recommending sold-out dishes."
    },
    {
      q: "How does 'My Tray' order checklist work?",
      a: "Add meals, set item quantities, and include customized add-ons into your tray. You can review total spending, check your remaining sukli, and copy the organized order slip before heading to the counters."
    },
    {
      q: "How can cafeteria stall owners update prices or mark items Sold Out?",
      a: "Stall owners can open 'Stall Portal' in the navigation bar, sign in with their registered credentials, and add dishes, upload photos, update prices, or mark items Sold Out in real time."
    }
  ];

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setFeedbackText('');
    onShowToast('Salamat! Your feedback has been received.');
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      
      {/* Page Header */}
      <div className="pb-2 border-b border-[#F0EBE1]">
        <h1 className="text-xl sm:text-2xl font-black text-stone-900 font-display">
          Help & Cafeteria Guide
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Frequently asked questions, offline PWA install guide, campus QR access, and stall management.
        </p>
      </div>

      {/* PWA Home Screen Installation Banner */}
      <PWAInstallButton variant="banner" />

      {/* Campus QR Code & Offline Access Card */}
      {onOpenCampusQR && (
        <section className="bg-white rounded-3xl border border-orange-100 p-5 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-md">
              <WifiOff className="w-3 h-3" />
              <span>Campus QR & Offline Access</span>
            </span>
            <h2 className="text-base sm:text-lg font-black text-stone-900 font-display mt-1">
              Scan & Install Our Sud-an QR Code
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md">
              Share or download the official campus QR code so students can open Our Sud-an, cache cafeteria menus, and install it on Android or iPhone.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCampusQR}
            className="min-h-[44px] px-5 py-3 rounded-2xl bg-stone-900 hover:bg-black text-white font-black text-xs sm:text-sm transition flex items-center gap-2 active:scale-95 shadow-xs shrink-0 self-start sm:self-auto"
          >
            <QrCode className="w-4 h-4 text-orange-400" />
            <span>Open Campus QR Code</span>
          </button>
        </section>
      )}

      {/* 1. First-Time Interactive Tutorial Banner */}
      <section className="bg-white rounded-3xl border border-orange-100 p-5 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md">
            New User Tutorial
          </span>
          <h2 className="text-base sm:text-lg font-black text-stone-900 font-display mt-1">
            How to Use Unsay-Sud-an
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md">
            Review the 7-step guide on setting your budget, browsing categories, spinning Surprise Me, and building your tray.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenOnboarding}
          className="px-5 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs sm:text-sm transition flex items-center gap-2 active:scale-95 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>How to Use Unsay-Sud-an</span>
        </button>
      </section>

      {/* 2. Frequently Asked Questions Accordion */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-black text-stone-900 font-display">
          Frequently Asked Questions
        </h2>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#F0EBE1] overflow-hidden shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 font-display font-bold text-stone-900 text-xs sm:text-sm hover:text-orange-600 transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-orange-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Cafeteria Hours & Campus Location */}
      <section className="bg-[#FFFDF9] rounded-3xl border border-[#F0EBE1] p-5 sm:p-6 space-y-3">
        <h2 className="text-sm sm:text-base font-black text-stone-900 font-display">
          USTP CDO Cafeteria Operations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600">
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 block font-bold">Service Hours</strong>
              <span>Monday to Saturday: 7:00 AM – 6:00 PM</span>
              <span className="block text-[11px] text-stone-400 mt-0.5">Peak lunch hours: 11:30 AM – 1:00 PM</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 block font-bold">Location</strong>
              <span>USTP Cagayan de Oro Campus, Main Food Complex</span>
              <span className="block text-[11px] text-stone-400 mt-0.5">Canopy Walk & Air-Ventilated Dining Hall</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Merchant Portal Access & Student Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Stall Owner Portal Card */}
        <section className="bg-white rounded-3xl border border-[#F0EBE1] p-5 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-stone-900 font-display font-black text-sm">
            <ShieldCheck className="w-4 h-4 text-orange-600" />
            <span>Cafeteria Stall Owners</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Stall owners can add menu items, edit names, update prices, upload photos, and toggle availability from the Stall Portal.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenMerchantAuth}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Open Stall Owner Sign In</span>
            </button>
          </div>
        </section>

        {/* Student Feedback Form */}
        <section className="bg-white rounded-3xl border border-[#F0EBE1] p-5 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-stone-900 font-display font-black text-sm">
            <MessageSquare className="w-4 h-4 text-orange-600" />
            <span>Student Feedback</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Spotted a price change or have a suggestion? Let the student development team know.
          </p>
          <form onSubmit={handleFeedbackSubmit} className="space-y-2">
            <input
              type="text"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Your feedback or stall price correction..."
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={feedbackSent}
              className="px-4 py-2 bg-stone-100 hover:bg-orange-50 hover:text-orange-700 text-stone-700 text-xs font-bold rounded-xl transition"
            >
              {feedbackSent ? 'Sent! Salamat.' : 'Submit Feedback'}
            </button>
          </form>
        </section>

      </div>

    </div>
  );
};
