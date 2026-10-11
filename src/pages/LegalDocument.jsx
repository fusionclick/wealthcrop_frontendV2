import { Link } from 'react-router-dom';
import { useDistributorIdentity } from '../components/DistributorIdentity';
import { legalDrafts } from '../content/legalDrafts';

export default function LegalDocument({ document }) {
  const draft = legalDrafts[document];
  const identity = useDistributorIdentity();
  return <article className="mx-auto max-w-4xl px-5 py-10 text-slate-800 dark:text-[var(--text-primary)]">
    <h1 className="text-3xl font-bold">{draft.title}</h1>
    <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">Draft for client review · Version {draft.version}. Effective date pending client confirmation.</p>
    <p className="mt-4 font-semibold">{identity?.entity || 'Wealthcrop'}{identity?.arn ? ` · ${identity.arn}` : ''}</p>
    {identity?.address && <p className="mt-1 text-sm">{identity.address}</p>}
    <div className="mt-7 space-y-6">{draft.sections.map(([heading, body]) => <section key={heading}>
      <h2 className="text-xl font-semibold">{heading}</h2><p className="mt-2 leading-7 text-slate-600 dark:text-[var(--text-secondary)]">{body}</p>
    </section>)}</div>
    <nav aria-label="Related legal documents" className="mt-8 flex flex-wrap gap-4 border-t border-slate-200 pt-5 text-sm dark:border-white/10">
      <Link to="/terms" className="underline">Terms of Use</Link><Link to="/privacy" className="underline">Privacy Policy</Link><Link to="/investor-charter" className="underline">Investor Charter</Link>
      <Link to="/grievance-redressal" className="underline">Grievance Redressal</Link><Link to="/support" className="underline">Support</Link>
      {document === 'privacy' && <Link to="/profile/data" className="underline">Your Data &amp; Privacy</Link>}
    </nav>
    <p className="mt-5 text-xs text-slate-500">Reference: <a className="underline" href="https://www.amfiindia.com/uploads/AMFI_Master_Cicular_for_MF_Ds_3c7f5ee44f.pdf" target="_blank" rel="noopener noreferrer">AMFI Master Circular for Mutual Fund Distributors</a>
      {document === 'privacy' && <> · <a className="underline" href="https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf" target="_blank" rel="noopener noreferrer">MeitY DPDP Rules 2025 (phased commencement)</a></>}</p>
  </article>;
}
