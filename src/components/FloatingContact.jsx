import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAppLinks } from '../hooks/useAppLinks';

// Client 2026-10-09 — a WhatsApp chat box and a floating "download the app" QR code.
//
// Both point at things only the client can supply: the WhatsApp Business number and the
// APK download or store listings. Until they are configured nothing renders — an invented number or a QR to
// a store page that does not exist is worse than no widget (support page rule: no false
// contact details).

const TOPICS = ["KYC or bank update", "Starting a SIP", "Redemption or switch", "Something else"];

const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: the card just comes back next visit */
  }
};

export default function FloatingContact() {
  const { whatsapp: WHATSAPP, appStore, playStore } = useAppLinks();
  const APP_URL = playStore || appStore;
  const [chatOpen, setChatOpen] = useState(false);
  const [qrHidden, setQrHidden] = useState(() => read("wc_app_qr_hidden") === "1");

  const chat = (topic) =>
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi Wealthcrop, I need help with: ${topic}`)}`, "_blank", "noopener");

  return (
    <>
      {/* App QR — desktop only: a phone cannot scan its own screen. */}
      {APP_URL && !qrHidden && (
        <div className="hidden lg:block fixed left-4 bottom-4 z-40 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[var(--card-bg)] shadow-lg p-3 w-40 text-center">
          <button
            type="button"
            aria-label="Hide app QR code"
            onClick={() => {
              setQrHidden(true);
              write("wc_app_qr_hidden", "1");
            }}
            className="absolute top-1 right-1 p-1 text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={14} />
          </button>
          {/* White in both themes: a QR code needs a light quiet zone to scan. */}
          <div className="bg-white dark:bg-white p-1.5 rounded inline-block">
            <QRCodeSVG value={APP_URL} size={110} />
          </div>
          <p className="mt-1 text-xs font-semibold text-blue-950 dark:text-gray-100">Scan to get the app</p>
        </div>
      )}

      {/* WhatsApp chat box */}
      {WHATSAPP && (
        <div className="fixed right-4 bottom-[168px] lg:bottom-6 z-40 flex flex-col items-end gap-2">
          {chatOpen && (
            <div className="w-72 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[var(--card-bg)] shadow-xl overflow-hidden">
              <div className="bg-emerald-600 text-white px-4 py-3">
                <p className="font-semibold">Chat with Wealthcrop</p>
                <p className="text-xs text-emerald-50">Opens WhatsApp. Never share your OTP, PIN or password.</p>
              </div>
              <ul className="p-2">
                {TOPICS.map((t) => (
                  <li key={t}>
                    <button
                      type="button"
                      onClick={() => chat(t)}
                      className="w-full text-left rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-[var(--white-5)]"
                    >
                      {t}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={() => setChatOpen((v) => !v)}
            aria-expanded={chatOpen}
            aria-label="WhatsApp chat"
            className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center justify-center"
          >
            {chatOpen ? <X size={24} /> : <MessageCircle size={26} />}
          </button>
        </div>
      )}
    </>
  );
}
