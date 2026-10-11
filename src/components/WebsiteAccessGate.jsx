import { useLocation, Link } from "react-router-dom";
import { usePlatformSettings } from "../hooks/usePlatformSettings";

export default function WebsiteAccessGate({ token, children }) {
  const { pathname } = useLocation();
  const { data, isLoading } = usePlatformSettings();
  const essential = pathname === "/" || /^\/(login|signup|verify-otp|reset-password|support|grievance-redressal|profile|kyc|privacy|terms|investor-charter|disclaimer|commission)(\/|$)/.test(pathname);
  if (essential) return children;
  if (isLoading) return <p className="p-8 text-center">Checking website access…</p>;
  if (data?.[token ? "investor_browsing_enabled" : "guest_browsing_enabled"] !== false) return children;
  return <div className="p-8 text-center text-[var(--text-primary)]"><h1 className="text-xl font-semibold">Website browsing is currently restricted</h1>
    <p className="my-3">{token ? "Contact support for help with your account." : "Sign in to access the investment platform."}</p>
    <Link className="underline text-[var(--accent)]" to={token ? "/support" : "/login"}>{token ? "Contact support" : "Sign in"}</Link></div>;
}
