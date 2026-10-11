import { Link } from "react-router-dom";

// Client 2026-10-09 — the Grievance Redressal Mechanism page, in the client's own words and
// escalation matrix. The client's "Direct Desk: +91 (Kolkata Office Desk)" line is left out:
// it has no number, and an incomplete phone line is a false contact detail.
const LEVELS = [
  {
    level: "Level 1: Primary Contact Desk",
    tat: "Ack: 24 hrs | TAT: 3–5 Days",
    who: "Customer Care & Client Support Desk",
    text: "First point of contact for service requests, SIP auto-debit status, folio statements, or transaction-related queries.",
    rows: [
      ["Email", "support@wealthcrop.in", "mailto:support@wealthcrop.in"],
      ["Hours", "Mon – Fri (9:30 AM to 6:30 PM IST)"],
    ],
  },
  {
    level: "Level 2: Officer & Compliance Escalation",
    tat: "TAT: 7 Working Days",
    who: "Grievance Redressal Officer (GRO)",
    text: "If your grievance is not resolved at Level 1 within 5 working days, or if you are dissatisfied with the resolution, escalate directly to our Compliance Officer.",
    rows: [
      ["GRO Name", "Sanjib Debnath"],
      ["Designation", "Compliance Lead & Director"],
      ["Email", "sanjib@wealthcrop.in", "mailto:sanjib@wealthcrop.in"],
    ],
  },
  {
    level: "Level 3: Executive Board Escalation",
    tat: "TAT: 10 Working Days",
    who: "Designated Director & Management Board",
    text: "For unresolved disputes involving conduct, advice, or unresolved Level 2 grievances, escalate directly to the Board of Directors.",
    rows: [
      ["Escalation Authority", "Board of Directors"],
      ["Executive Email", "director@wealthcrop.in", "mailto:director@wealthcrop.in"],
      ["Corporate Office", "Wealthcrop Securities Pvt. Ltd., Kolkata, WB, India"],
    ],
  },
  {
    level: "Level 4: AMC / SEBI Regulatory Statutory Bodies",
    tat: "Statutory Process",
    who: "AMCs, SEBI SCORES & SMART ODR Portal",
    text: "If a complaint remains un-redressed after 30 calendar days, investors can lodge grievances directly with the AMC / RTA (CAMS / KFintech) or SEBI's official dispute portals.",
    rows: [
      ["SEBI SCORES Portal", "scores.sebi.gov.in", "https://scores.sebi.gov.in"],
      ["SMART ODR Dispute Portal", "smartodr.in", "https://smartodr.in"],
      ["SEBI Toll-Free Helpline", "1800 266 7575 / 1800 22 7575"],
    ],
  },
];

const GrievanceRedressal = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-[var(--app-bg)] px-4 py-10">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-950 dark:text-[var(--text-primary)]">Grievance Redressal Mechanism</h1>
      <p className="mt-3 text-gray-700 dark:text-[var(--text-secondary)]">
        At Wealthcrop, client trust and statutory compliance are paramount. We follow a structured, multi-tier escalation
        matrix to resolve all investor complaints efficiently and impartially.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-blue-950 dark:text-[var(--text-primary)]">Escalation Matrix</h2>
      <ol className="mt-4 space-y-4">
        {LEVELS.map((l) => (
          <li key={l.level} className="rounded-xl border border-gray-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)] p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold text-blue-950 dark:text-[var(--text-primary)]">{l.level}</h3>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-50 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300">{l.tat}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-[var(--text-primary)]">{l.who}</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-[var(--text-secondary)]">{l.text}</p>
            <dl className="mt-3 grid sm:grid-cols-[180px_1fr] gap-x-4 gap-y-1 text-sm">
              {l.rows.map(([k, v, href]) => (
                <div key={k} className="contents">
                  <dt className="text-gray-500 dark:text-[var(--text-secondary)]">{k}</dt>
                  <dd className="text-gray-900 dark:text-[var(--text-primary)]">
                    {href ? (
                      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-blue-700 dark:text-blue-400 hover:underline">
                        {v}
                      </a>
                    ) : (
                      v
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-sm text-gray-700 dark:text-[var(--text-secondary)]">
        Already have an account? <Link to="/support/complaint" className="text-blue-700 dark:text-blue-400 font-medium hover:underline">Raise a complaint online</Link> and track it to closure.
      </p>
    </div>
  </div>
);

export default GrievanceRedressal;
