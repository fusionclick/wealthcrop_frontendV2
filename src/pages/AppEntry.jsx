import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { HiOutlineMail } from "react-icons/hi";
import logo from "../assets/logo.png";
import DistributorIdentity from "../components/DistributorIdentity";
import { isMobile } from "../utils/FormSchema";
import { sipSeries } from "../utils/calculators";
import { formatRupee } from "../utils/format";

// The Android app opens here (NativeAndroid MainActivity). Login/signup first; after that the
// investor is in the same web screens as everyone else, so this page only routes.
const AMOUNTS = [1000, 5000, 10000];
const YEARS = 10;
const CAGR = 12; // the footer disclaimer below states this assumption — change both together

export default function AppEntry() {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [monthly, setMonthly] = useState(5000);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  if (token) return <Navigate to="/user/mutual_fund" replace />;

  const series = sipSeries({ monthly, years: YEARS, cagr: CAGR });
  const final = series[series.length - 1];
  const max = final.value;

  // ponytail: hands off to the existing OTP login rather than duplicating it here.
  const submit = (e) => {
    e.preventDefault();
    if (!isMobile(phone)) return setError("Enter a valid 10-digit mobile number");
    navigate("/login", { state: { phone } });
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-blue-50 via-white to-white px-4 pb-8 pt-10 text-blue-950 dark:bg-none dark:bg-[var(--app-bg)] dark:text-gray-100">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <header className="flex flex-col items-center gap-2 text-center">
          <img src={logo} alt="Wealthcrop" className="h-14 w-auto" />
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Track. Transact. Monitor.</p>
        </header>

        <section className="no-glass rounded-3xl border border-blue-100 bg-white p-5 shadow-[0_8px_30px_-12px_rgba(30,64,175,0.18)] dark:border-white/10 dark:bg-[#0f172a] dark:shadow-none">
          <h2 className="text-lg font-semibold">Start a monthly SIP</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-gray-400">
            See what a fixed monthly investment could grow to in {YEARS} years.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label="Monthly amount">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={monthly === a}
                onClick={() => setMonthly(a)}
                className={`rounded-2xl border py-2 text-sm font-semibold transition active:scale-[0.98] ${
                  monthly === a
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-blue-100 bg-blue-50 text-blue-900 hover:border-blue-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                }`}
              >
                {formatRupee(a)}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-blue-50/60 p-4 dark:bg-white/5">
            <div className="flex h-24 items-end gap-1.5" aria-hidden="true">
              {series.map((y) => (
                <div key={y.year} className="flex h-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-blue-600 transition-[height] duration-300 motion-reduce:transition-none"
                    style={{ height: `${(y.value / max) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-gray-400">
              Invested {formatRupee(final.invested)}, could grow to{" "}
              <span className="font-semibold text-blue-950 dark:text-gray-100">{formatRupee(final.value)}*</span>
            </p>
          </div>
        </section>

        <section className="no-glass rounded-3xl border border-blue-100 bg-white p-5 shadow-[0_8px_30px_-12px_rgba(30,64,175,0.18)] dark:border-white/10 dark:bg-[#0f172a] dark:shadow-none">
          <h1 className="text-lg font-semibold">Get started</h1>

          <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-2">
            <label htmlFor="app-phone" className="text-sm font-medium text-slate-700 dark:text-gray-300">
              Mobile number
            </label>
            <div className="flex items-center rounded-2xl border border-slate-300 bg-white dark:border-white/10 dark:bg-white/5 focus-within:border-blue-700 focus-within:ring-1 focus-within:ring-blue-700">
              <span className="pl-4 pr-2 font-medium text-slate-600 dark:text-gray-400">+91</span>
              <input
                id="app-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => {
                  // No maxLength: it would cut a pasted "+91 98765 43210" before we strip it.
                  setPhone(e.target.value.replace(/\D/g, "").replace(/^(?:91|0)(?=\d{10}$)/, "").slice(0, 10));
                  setError("");
                }}
                placeholder="10-digit mobile number"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "app-phone-error" : undefined}
                className="no-glass w-full rounded-2xl bg-transparent py-3 pr-4 text-base text-blue-950 dark:text-gray-100 placeholder:text-slate-500 dark:placeholder:text-gray-500 focus:outline-none"
              />
            </div>
            {error && (
              <p id="app-phone-error" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="mt-2 rounded-2xl bg-blue-700 py-3 text-base font-semibold text-white shadow-[0_8px_20px_-8px_rgba(29,78,216,0.6)] transition hover:bg-blue-800 active:scale-[0.98]"
            >
              Login with OTP
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-gray-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            OR
            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 py-3 font-semibold text-blue-950 transition hover:border-blue-300 hover:bg-blue-50 dark:border-white/10 dark:bg-transparent dark:text-gray-100 dark:hover:bg-white/5 active:scale-[0.98]"
          >
            <HiOutlineMail className="text-xl text-blue-700 dark:text-blue-400" aria-hidden="true" />
            Continue with Email
          </Link>

          <div className="mt-4 flex items-center justify-between text-sm font-medium">
            <Link to="/signup" className="text-blue-700 hover:underline dark:text-blue-400">
              Create account
            </Link>
            <Link to="/" className="text-blue-700 hover:underline dark:text-blue-400">
              Continue as Guest
            </Link>
          </div>
        </section>

        <footer className="flex flex-col gap-2 text-center text-xs leading-relaxed text-slate-600 dark:text-gray-400">
          <DistributorIdentity />
          <p>
            By continuing, you accept our{" "}
            <Link to="/terms" className="text-blue-700 underline dark:text-blue-400">Terms</Link> &{" "}
            <Link to="/privacy" className="text-blue-700 underline dark:text-blue-400">Privacy Policy</Link>.
          </p>
          <p>
            *Illustration assumes {CAGR}% p.a. returns and is not a guarantee. Mutual Fund
            investments are subject to market risks, read all scheme related documents carefully.
          </p>
        </footer>
      </div>
    </div>
  );
}
