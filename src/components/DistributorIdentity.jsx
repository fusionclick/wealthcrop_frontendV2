import { useEffect, useState } from "react";
import { getApi } from "../api/api";
import { nodeUrl } from "../utils/nodeApi";

/**
 * AMFI §1.A — the branding line and the Regular Plan disclosure that must appear on EVERY
 * web page and app screen.
 *
 * ── The font-size rule is the whole point of this component ──────────────────────────────
 * AMFI requires at least 12pt, which the spec spells out as 16px. Tailwind's `text-sm` is
 * 14px and `text-xs` is 12px, and a footer is exactly where a 14px default gets applied
 * without anyone noticing — so the size is written as an inline style rather than a utility
 * class. A utility can be purged, overridden by a later class in the cascade, or "tidied"
 * to text-sm by someone making the footer look balanced; `fontSize: 16` survives all three.
 *
 * ── Why the text is fetched, not hardcoded ───────────────────────────────────────────────
 * The ARN belongs to the distributor, not to the bundle. A stale ARN on a live screen is a
 * misrepresentation to every visitor, and this codebase has already shipped one ARN that
 * belonged to somebody else. The server owns it; a change takes effect without a frontend
 * deploy, and one value cannot be current on one screen and stale on another.
 *
 * ── What happens when the ARN is not configured ──────────────────────────────────────────
 * Nothing renders. An "ARN: " with nothing after it, or a placeholder, is a false statement
 * of registration — worse than an absent line, which is merely incomplete. The absence is
 * loud in the console instead, so an unconfigured deployment is noticed.
 */
export default function DistributorIdentity({ className = "" }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let live = true;
    getApi(nodeUrl("/disclaimers"))
      .then((res) => {
        if (!live) return;
        const data = res?.data?.data || res?.data;
        setInfo({
          line: String(data?.distributor?.line || ""),
          regularPlan: String(data?.disclaimers?.regular_plan_commission || ""),
        });
      })
      .catch(() => live && setInfo({ line: "", regularPlan: "" }));
    return () => {
      live = false;
    };
  }, []);

  if (!info) return null;

  if (!info.line) {
    // Not a user-facing message: the operator has to see it, the investor must not be shown
    // a half-finished registration claim.
    console.warn("[compliance] DISTRIBUTOR_ARN is not configured — the AMFI identity line is not being shown.");
    return null;
  }

  return (
    <div className={`text-gray-700 dark:text-gray-300 ${className}`} style={{ fontSize: 16, lineHeight: 1.5 }}>
      {/* §1.A.1 — legal entity | AMFI-registered Mutual Fund Distributor | ARN */}
      <p className="font-semibold">{info.line}</p>
      {/* §1.A.2 — the Regular Plan and trail commission disclosure. */}
      {info.regularPlan ? <p className="mt-1">{info.regularPlan}</p> : null}
    </div>
  );
}
