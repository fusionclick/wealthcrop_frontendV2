import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { FiEdit2 } from "react-icons/fi";
import { getApiWithToken, postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";

/**
 * SRS §3 — PAN, city and occupation after KYC is done.
 *
 * The approval pipeline for a verified PAN was already complete on the server
 * (`KycController::saveProfile` → `requestPanChange` → admin queue) and completely
 * unreachable: the only screen that posts to `kyc/profile` is the onboarding KYC form,
 * which an investor never sees again once KYC passes. This is that missing way back in.
 *
 * Self-contained for the same reason SecondaryEmail.jsx is — BasicDetails.jsx renders its
 * fields twice, once per layout, through a shared modal and an `editType` string switch.
 *
 * Only the three fields below are sent. `saveProfile` writes just the keys it receives, so
 * a partial save no longer blanks dob/aadhaar/address the way it would have before.
 */
const api = (path) => `${import.meta.env.VITE_URL}${path}`;

export default function KycDetails({ userData, refetch }) {
  const profile = userData?.profile || {};
  const panVerified = Boolean(profile?.pan_verified);

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);
  const [form, setForm] = useState({ pan_number: "", city: "", occupation: "" });

  useEffect(() => {
    setForm({
      pan_number: profile?.pan_number || "",
      city: profile?.city || "",
      occupation: profile?.occupation || "",
    });
  }, [profile?.pan_number, profile?.city, profile?.occupation]);

  // The banner for a PAN change already waiting on an admin.
  //
  // QA 2.7 — `getApiWithToken` returns the AXIOS RESPONSE, so the Laravel body is `res.data`
  // and its payload is `res.data.data`. This read `res.data.state`, which is the envelope
  // and has no `state`, so `pending` was permanently null and the banner never appeared
  // once — the investor was told nothing about a request they had just raised.
  const loadPending = () =>
    getApiWithToken(api("/kyc/pan-change"))
      .then((res) => {
        const row = res?.data?.data;
        setPending(row?.state === "pending" ? row : null);
      })
      .catch(() => {});

  useEffect(() => {
    loadPending();
  }, []);

  const save = async () => {
    const pan = form.pan_number.trim().toUpperCase();
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      return toastError("PAN must look like ABCDE1234F.");
    }
    setBusy(true);
    try {
      const res = await postApiWithToken(api("/kyc/profile"), {
        pan_number: pan,
        city: form.city.trim(),
        occupation: form.occupation.trim(),
      });
      // QA 2.7 / 2.8 — every read below was one level too high. `postApiWithToken` returns
      // the AXIOS RESPONSE, so `res.status` was the HTTP code (truthy for any success) and
      // `res.message` / `res.pan_change_pending` were both undefined. The result: the
      // server's "your PAN is verified, so the change has been sent for approval" was
      // replaced by a bare "Saved", the pending banner never refreshed, and the PAN on
      // screen did not move — which reads exactly as "PAN cannot be edited".
      const body = res?.data;
      if (body?.status) {
        setEditing(false);
        toastSuccess(body.message || "Saved");
        // A locked PAN is not applied here — it becomes a request, so refresh the banner.
        if (body.pan_change_pending) loadPending();
        refetch?.();
      } else {
        toastError(body?.message || "Could not save.");
      }
    } catch (err) {
      // A 422 from the validator rejects the promise, and with only a `finally` here it
      // died silently: the investor pressed Save, nothing happened, nothing was said.
      toastError(err?.response?.data?.message || err?.message || "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "border border-slate-200 rounded-md px-2 py-1 text-sm bg-white dark:bg-[var(--white-10)] dark:border-[var(--border-color)] dark:text-[var(--text-primary)]";
  const label = "text-gray-500 text-sm dark:text-[var(--text-primary)]";
  const value = "text-blue-950 font-semibold dark:text-[var(--text-secondary)]";

  // A function, not a component: a component declared here is a new type on every render,
  // so React would unmount the input on each keystroke and the field would lose focus.
  const row = (name, title, placeholder) => (
    <div>
      <p className={label}>{title}</p>
      {editing ? (
        <input
          value={form[name]}
          onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
          placeholder={placeholder}
          aria-label={title}
          className={`${field} mt-1`}
        />
      ) : (
        <p className={value}>{profile?.[name] || "—"}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-3 border-t border-gray-200 dark:border-[var(--border-color)] pt-3">
      <div className="flex justify-between items-center">
        <p className="font-semibold text-blue-950 dark:text-[var(--text-primary)]">
          KYC details
        </p>
        {editing ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs px-3 py-1 rounded-md border border-slate-300 dark:border-[var(--border-color)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md disabled:opacity-50"
            >
              {busy ? "…" : "Save"}
            </button>
          </div>
        ) : (
          // QA 2.8 — every other row on this page carries a pencil, so a bare word "Edit"
          // in the section header did not read as the control for these three fields and
          // was reported as "there is no edit button in front of occupation".
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit KYC details"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            <FiEdit2 /> Edit
          </button>
        )}
      </div>

      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className={label}>PAN</p>
          {editing ? (
            <input
              value={form.pan_number}
              onChange={(e) =>
                setForm((f) => ({ ...f, pan_number: e.target.value.toUpperCase() }))
              }
              maxLength={10}
              placeholder="ABCDE1234F"
              aria-label="PAN"
              className={`${field} mt-1 uppercase`}
            />
          ) : (
            <div className="flex gap-2 items-center">
              <p className={value}>{profile?.pan_number || "—"}</p>
              {panVerified && <ShieldCheck className="fill-green-600 shrink-0" size={18} />}
            </div>
          )}
        </div>
      </div>

      {row("city", "City", "City")}
      {row("occupation", "Occupation", "Occupation")}

      {panVerified && editing && (
        <p className="text-[11px] text-amber-600">
          Your PAN is verified. Changing it does not take effect immediately — it is sent to
          our team for approval. City and occupation save straight away.
        </p>
      )}

      {pending && (
        <p className="text-[11px] text-amber-600">
          PAN change to <strong>{pending.requested_pan}</strong> is awaiting approval. The
          PAN above stays in use until then.
        </p>
      )}
    </div>
  );
}
