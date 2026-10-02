import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, ShieldCheck, Upload } from "lucide-react";
import AadhaarSides from "../../components/kyc/AadhaarSides";
import { uploadKycDocument } from "../../components/kyc/uploadKycDocument";
import { isKycVerified } from "../../utils/kycVerdict";
import { formatDate } from "../../utils/format";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { DOC_LABELS, documentRows } from "./kycDocuments.js";

/**
 * Audit #43 — documents could only be uploaded during onboarding, while the KYC wizard told the
 * investor they could "add them later from your profile". This is that place.
 *
 * Reads the `documents` investor-data already returns; no new endpoint. A document can be
 * replaced until it, or the KYC it belongs to, is verified — the server enforces the same rule
 * and keeps every earlier copy as the audit trail; this only decides which control to offer.
 */
const sideText = (row) => {
  if (row.type === "aadhaar") {
    if (row.sides.length === 2) return "front & back";
    return row.sides.length ? `${row.sides[0]} only` : "single file";
  }
  return row.side || "";
};

const mask = (n) => (n ? `••••${String(n).slice(-4)}` : null);

export default function ProfileDocuments({ userData, refetch }) {
  const rows = documentRows(userData?.documents);
  const kycDone = isKycVerified(userData?.kyc?.kyc_status) || isKycVerified(userData?.kyc_status);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);

  const send = async (type, file, meta = {}) => {
    if (!file) return null;
    setBusy(true);
    try {
      const res = await uploadKycDocument(type, file, meta);
      toastSuccess(res?.message || "Uploaded");
      setOpen(null);
      refetch?.();
      return res;
    } catch (e) {
      toastError(e?.message || "Upload failed");
      return null;
    } finally {
      setBusy(false);
    }
  };

  // The two the KYC wizard asks for, offered here whenever they are missing. Adding one never
  // changes anything that was verified, so it is allowed after KYC too.
  const missing = ["pan", "aadhaar"].filter((t) => !rows.some((r) => r.type === t));

  const control = (type, meta = {}) =>
    type === "aadhaar" ? (
      <AadhaarSides onUpload={(front, back) => send("aadhaar", front, { ...meta, back })} />
    ) : (
      <label className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 cursor-pointer">
        <Upload size={14} /> {busy ? "Uploading…" : "Choose file"}
        <input
          type="file"
          className="hidden"
          disabled={busy}
          accept={type === "selfie" ? "video/*" : "image/*,.pdf"}
          aria-label={`${DOC_LABELS[type] || type} file`}
          onChange={(e) => {
            send(type, e.target.files[0], meta);
            e.target.value = "";
          }}
        />
      </label>
    );

  return (
    <div className="space-y-3 border-t border-gray-200 dark:border-[var(--border-color)] pt-3">
      <p className="font-semibold text-blue-950 dark:text-[var(--text-primary)]">Documents</p>

      {rows.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-[var(--text-secondary)]">No documents uploaded yet.</p>
      )}

      {rows.map((row) => {
        const locked = row.verified || kycDone;
        return (
          <div key={row.key} className="rounded-lg border border-gray-200 dark:border-[var(--border-color)] p-3">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <p className="text-blue-950 font-semibold dark:text-[var(--text-secondary)]">
                  {DOC_LABELS[row.type] || row.type}
                  {sideText(row) && (
                    <span className="font-normal text-gray-500 dark:text-gray-400"> · {sideText(row)}</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {[mask(row.number), row.uploadedAt && `Uploaded ${formatDate(row.uploadedAt)}`].filter(Boolean).join(" · ")}
                </p>
              </div>
              {row.verified ? (
                <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 dark:text-green-400">
                  <ShieldCheck size={14} /> Verified
                </span>
              ) : (
                <span
                  className={`shrink-0 text-[11px] font-semibold ${
                    kycDone ? "text-slate-500 dark:text-slate-400" : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {kycDone ? "On file with your verified KYC" : "Not yet verified"}
                </span>
              )}
            </div>

            {locked ? (
              <p className="mt-2 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                <Lock size={12} /> Locked once verified.{" "}
                <Link to="/support" className="underline text-blue-700 dark:text-blue-400">
                  Contact support
                </Link>{" "}
                to change it.
              </p>
            ) : open === row.key ? (
              <div className="mt-2 space-y-2">
                {control(row.type, row.type === "aadhaar" ? {} : { side: row.side, document_number: row.number })}
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="text-[11px] text-gray-500 dark:text-gray-400 underline"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(row.key)}
                className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Replace
              </button>
            )}
          </div>
        );
      })}

      {missing.map((type) => (
        <div key={type} className="rounded-lg border border-dashed border-gray-300 dark:border-white/10 p-3 space-y-2">
          <p className="text-sm text-blue-950 dark:text-[var(--text-secondary)]">
            Add your {DOC_LABELS[type]}
            {type === "aadhaar" && <span className="text-gray-500 dark:text-gray-400"> — front and back</span>}
          </p>
          {control(type)}
        </div>
      ))}
    </div>
  );
}
