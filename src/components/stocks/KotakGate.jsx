import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { ExternalLink, ShieldCheck, CandlestickChart } from "lucide-react";
import { fetchKotakStatus } from "../../api/portfolioApi";
import KotakLinkForm from "./KotakLinkForm";

// Kotak's own onboarding for investors who do not have a Neo account yet. Opening one under
// this partner link is what gives them the access token and UCC this gate asks for.
export const KOTAK_SIGNUP_URL =
  "https://www.kotakneo.com/landing-page/franchisee/open-demat-account-partner-wealthcrop-securities-private-limited-one/";

/**
 * Route wrapper for the stocks and F&O sections. Stocks trade on each investor's own Kotak
 * account, so this gate blocks the section until one is linked — there is no dismiss. The
 * order endpoints refuse an unlinked investor server-side too; this is the front door.
 *
 * If the status call itself fails we let them through rather than locking them out of the
 * section permanently on a transient error.
 */
const KotakGate = () => {
  const [linked, setLinked] = useState(null); // null = still asking

  useEffect(() => {
    fetchKotakStatus()
      .then((res) => setLinked(Boolean(res?.data?.linked)))
      .catch(() => setLinked(true)); // status unreachable: do not lock the section
  }, []);

  const open = linked === false;

  // Blocking modal: stop the page behind it from scrolling underneath.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <Outlet />

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center overflow-y-auto
                     bg-slate-950/60 px-4 py-8 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kotak-gate-title"
        >
          {/* The blue glow existed to give the old glass something to refract. The app is flat
              now and the blur is gone, so it was just a blue smear on a red-accented dark UI. */}

          <div className="relative my-auto w-full max-w-md">
            {/* Gradient hairline that the card sits inside of. */}
            <div className="rounded-[1.75rem] bg-gradient-to-br from-white/70 via-white/20 to-transparent p-px shadow-[0_25px_70px_-15px_rgba(2,6,23,0.6)] dark:from-white/25 dark:via-white/5">
              <div className="rounded-[1.7rem] bg-white/80 px-6 py-7 backdrop-blur-2xl dark:bg-slate-900/70">
                <div className="flex flex-col items-center text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-700 text-white shadow-lg shadow-blue-600/30">
                    <CandlestickChart size={26} />
                  </span>

                  <h2
                    id="kotak-gate-title"
                    className="mt-4 text-xl font-semibold tracking-tight text-blue-950 dark:text-white"
                  >
                    Connect your Kotak account
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    Stocks are traded on your own Kotak Neo account. Link it once to unlock the
                    stocks and F&amp;O sections.
                  </p>
                </div>

                <ol className="mt-6 space-y-3">
                  <li className="flex items-start gap-3">
                    <Step n={1} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-950 dark:text-gray-100">
                        Open or sign in to Kotak Neo
                      </p>
                      <a
                        href={KOTAK_SIGNUP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-900
                                   px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-900/25
                                   transition hover:from-blue-600 hover:to-blue-800 hover:shadow-blue-900/40
                                   dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-500 dark:hover:to-blue-600"
                      >
                        Login for stocks <ExternalLink size={15} />
                      </a>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <Step n={2} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-950 dark:text-gray-100">
                        Paste your access token and UCC
                      </p>
                      <div className="mt-2">
                        <KotakLinkForm forceOpen compact onLinked={() => setLinked(true)} />
                      </div>
                    </div>
                  </li>
                </ol>

                <p className="mt-6 flex items-center justify-center gap-1.5 border-t border-gray-200/70 pt-4 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
                  <ShieldCheck size={13} /> Stored encrypted, and only used to place your own orders.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Step = ({ n }) => (
  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-950/90 text-[11px] font-semibold text-white dark:bg-white/15">
    {n}
  </span>
);

export default KotakGate;
