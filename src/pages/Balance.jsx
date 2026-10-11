import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import setupImg from "../assets/setup.svg";
import { fetchKotakStatus } from "../api/portfolioApi";
import KotakLinkForm from "../components/stocks/KotakLinkForm";
import { KOTAK_SIGNUP_URL } from "../components/stocks/KotakGate";

// Client 2026-10-09 — "Margin with Broker". The page says only "Broker not yet linked" and
// offers "Link My Broker": an investor who already has a Kotak Neo account links it here; one
// who does not opens it first through the partner link, then comes back to link it. Stock
// trading is optional — mutual funds never need this.
//
// ponytail: no margin figure. The broker API we link to returns no funds/limits call yet,
// and the ₹0.00 this used to print was invented. Show the amount once that call exists.
const Balance = () => {
  const navigate = useNavigate();
  const [linked, setLinked] = useState(null); // null = still asking
  const [step, setStep] = useState("idle"); // idle | ask | link | open

  useEffect(() => {
    fetchKotakStatus()
      .then((res) => setLinked(Boolean(res?.data?.linked)))
      .catch(() => setLinked(false));
  }, []);

  const button =
    "bg-blue-950 hover:bg-blue-900 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium transition";
  const ghost =
    "border border-blue-950/30 dark:border-white/20 text-blue-950 dark:text-[var(--text-primary)] px-5 py-2.5 rounded-lg font-medium transition hover:bg-blue-50 dark:hover:bg-white/5";

  return (
    <div className="bg-white dark:bg-[var(--app-bg)] min-h-[400px] rounded-xl p-8 flex items-center justify-center">
      <div className="flex flex-col items-center text-center gap-5 px-6 py-10 w-full max-w-md">
        <img src={setupImg} alt="" className="w-40 md:w-56 object-contain opacity-90" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[var(--text-secondary)]">
            Margin with Broker
          </p>
          <h2 className="text-2xl font-semibold text-blue-950 dark:text-[var(--text-primary)] mt-1">
            {linked === null ? "Checking…" : linked ? "Broker linked" : "Broker not yet linked"}
          </h2>
        </div>

        {linked === true && (
          <button type="button" onClick={() => navigate("/user/stocks/explore")} className={button}>
            Go to Stocks &amp; F&amp;O
          </button>
        )}

        {linked === false && step === "idle" && (
          <button type="button" onClick={() => setStep("ask")} className={button}>
            Link My Broker
          </button>
        )}

        {linked === false && step === "ask" && (
          <div className="w-full space-y-3">
            <p className="text-sm text-gray-600 dark:text-[var(--text-secondary)]">Do you already have a Kotak Neo account?</p>
            <div className="flex gap-2 justify-center">
              <button type="button" onClick={() => setStep("link")} className={button}>
                Yes, link it
              </button>
              <button type="button" onClick={() => setStep("open")} className={ghost}>
                No, open one
              </button>
            </div>
          </div>
        )}

        {linked === false && step === "open" && (
          <div className="w-full space-y-3 text-sm text-gray-600 dark:text-[var(--text-secondary)]">
            <p>Open your Kotak Neo account first. Once it is active, come back to this page to link it.</p>
            <a href={KOTAK_SIGNUP_URL} target="_blank" rel="noopener noreferrer" className={`${button} inline-flex items-center gap-2`}>
              Open Kotak Neo Account <ExternalLink size={15} />
            </a>
            <div>
              <button type="button" onClick={() => setStep("link")} className="text-blue-700 dark:text-blue-400 font-medium hover:underline">
                My account is active — link it now
              </button>
            </div>
          </div>
        )}

        {linked === false && step === "link" && (
          <div className="w-full text-left">
            <KotakLinkForm forceOpen compact onLinked={() => setLinked(true)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Balance;
