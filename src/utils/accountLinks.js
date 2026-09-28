import { Bot, Target, BarChart3, ShieldCheck, Calculator, BookOpen, MessageSquare } from "lucide-react";

/**
 * The signed-in investor's own sections, in one place.
 *
 * These pages have routes and no entry point of their own. MoreMenu carries the same links
 * but is rendered `{!token && <MoreMenu/>}` (and gated `!token` internally too), so anything
 * living only there vanishes the moment someone logs in. QA filed that as four separate bugs
 * before the pattern was obvious: Advisor/Goals, then Calculators (10.1), then Community
 * (11.1), then Learning Centre.
 *
 * There are TWO signed-in surfaces and both need this list, which is why it is not inlined
 * in either:
 *   - desktop: the account dropdown in OldHeader
 *   - mobile:  the Profile page, because App renders `{(!token || isLg) && <OldHeader/>}`, so
 *              below 1024px a logged-in investor has no header at all — only BottomHeader,
 *              whose Profile tab is the only way in.
 *
 * Add a section here, not to either surface.
 */
export const ACCOUNT_LINKS = [
  { to: "/advisor", label: "Advisor", Icon: Bot },
  { to: "/goals", label: "Goals", Icon: Target },
  { to: "/reports", label: "Reports", Icon: BarChart3 },
  { to: "/user/approvals", label: "Approvals", Icon: ShieldCheck },
  { to: "/calculators", label: "Calculators", Icon: Calculator },
  { to: "/learning-centre", label: "Learning Centre", Icon: BookOpen },
  { to: "/community", label: "Community", Icon: MessageSquare },
];
