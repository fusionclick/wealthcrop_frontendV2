import { Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Ban } from "lucide-react";
import { getApi } from "../api/api";
import { laravelUrl } from "../utils/nodeApi";

/**
 * Admin ke Settings -> Trading Modules switch. Route par lagta hai, nav par nahi:
 * har header, menu aur deep link isi se guzarta hai, to segment band karne ke liye
 * ek jagah kaafi hai. Asli rok Laravel ke order endpoints par hai — ye sirf investor
 * ko band darwaze par khara nahi chhorta.
 *
 * Settings na mile (network/500) to darwaza khula rehta hai: ek transient error par
 * poora section band kar dena us se bura hai jo ye rok raha hai.
 */
function usePlatformSettings() {
  return useQuery({
    queryKey: ["platformSettings"],
    // getApi returns the parsed body (not the axios response, unlike getApiWithToken),
    // so the settings object is one `.data` deep, not two.
    queryFn: () => getApi(laravelUrl("/platform-settings")),
    select: (res) => res?.data ?? {},
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export default function ModuleGate({ setting, label }) {
  const navigate = useNavigate();
  const { data, isLoading } = usePlatformSettings();

  if (isLoading || data?.[setting] !== false) return <Outlet />;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-[var(--white-10)]">
          <Ban size={26} />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-[var(--text-primary)]">
          {label} is currently unavailable
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-[var(--text-secondary)]">
          This segment has been switched off by the platform. Your existing positions are
          untouched — mutual funds are still open.
        </p>
        <button
          type="button"
          onClick={() => navigate("/user/mutual_fund/explore")}
          className="mt-5 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
        >
          Go to Mutual Funds
        </button>
      </div>
    </div>
  );
}
