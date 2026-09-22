import { useEffect, useState } from "react";
import { Download, ShieldCheck, Trash2 } from "lucide-react";
import { getApiWithToken, postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";

/**
 * SRS "Compliance" — GDPR data-subject rights, the investor's side of them.
 *
 * Access and portability are one download: the server assembles the record and this saves
 * it as a file. Erasure is a request, and the copy says so plainly — promising deletion
 * and then keeping the transactions (which SEBI/PMLA require) would be the misleading
 * version of the same feature.
 */
const api = (path) => `${import.meta.env.VITE_URL}${path}`;

export default function DataRights() {
  const [request, setRequest] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    getApiWithToken(api("/privacy/erasure")).then((res) => {
      setRequest(res?.data?.data ?? null);
    });
  }, []);

  const download = async () => {
    setBusy(true);
    try {
      const res = await getApiWithToken(api("/privacy/export"));
      const data = res?.data?.data;
      if (!data) return toastError("Could not build your data file.");

      // Blob + object URL: the file is already in hand, so there is nothing to fetch again.
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `wealthcrop-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toastSuccess("Your data file has been downloaded.");
    } catch (e) {
      toastError(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  const requestErasure = async () => {
    setBusy(true);
    try {
      const res = await postApiWithToken(api("/privacy/erasure"), { reason });
      if (res?.status) {
        toastSuccess(res?.message || "Request received.");
        setConfirming(false);
        setReason("");
        const fresh = await getApiWithToken(api("/privacy/erasure"));
        setRequest(fresh?.data?.data ?? null);
      } else {
        toastError(res?.message || "Could not raise the request.");
      }
    } catch (e) {
      toastError(e?.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  const pending = request?.status === "pending";

  return (
    <div className="relative p-8 overflow-hidden rounded-lg bg-white dark:bg-[var(--card-bg)]">
      <h2 className="text-xl font-semibold mb-6 text-blue-950 dark:text-[var(--text-primary)]">
        Your Data &amp; Privacy
      </h2>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Download className="w-4 h-4 text-emerald-600" />
          <h3 className="font-semibold text-blue-950 dark:text-[var(--text-primary)]">
            Download a copy of your data
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-[var(--text-secondary)] mb-3">
          Everything we hold about you — profile, KYC, bank accounts, nominees, orders,
          holdings, goals, alerts and activity — as a machine-readable JSON file.
        </p>
        <button
          onClick={download}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
        >
          {busy ? "Preparing…" : "Download my data"}
        </button>
      </div>

      <div className="border-t border-gray-200 dark:border-[var(--border-color)] pt-6">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-4 h-4 text-red-500" />
          <h3 className="font-semibold text-blue-950 dark:text-[var(--text-primary)]">
            Request erasure of your data
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-[var(--text-secondary)] mb-3">
          We remove your name, contact details and account activity, and deactivate your
          login. Your transaction and KYC records are kept — SEBI and PMLA require us to
          hold them, and that obligation overrides an erasure request. You will be told
          exactly what was removed.
        </p>

        {pending ? (
          <div className="flex items-start gap-2 text-sm rounded-lg p-3 bg-amber-50 dark:bg-[var(--white-5)] text-amber-900 dark:text-[var(--text-secondary)]">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Your erasure request is with our compliance team. We will write to you when
              it has been reviewed.
            </span>
          </div>
        ) : request?.status === "refused" ? (
          <div className="text-sm rounded-lg p-3 bg-gray-50 dark:bg-[var(--white-5)] text-gray-700 dark:text-[var(--text-secondary)]">
            Your last request was not granted.
            {request.review_note ? ` Reason: ${request.review_note}` : ""}
          </div>
        ) : request?.status === "completed" ? (
          <div className="text-sm rounded-lg p-3 bg-gray-50 dark:bg-[var(--white-5)] text-gray-700 dark:text-[var(--text-secondary)]">
            Your data has been erased. Retained records remain for regulatory reasons only.
          </div>
        ) : confirming ? (
          <div className="space-y-3">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Why are you asking? (optional)"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none border-gray-300 bg-transparent text-gray-900 focus:border-blue-400 dark:border-[var(--border-color)] dark:text-[var(--text-primary)]"
            />
            <div className="flex gap-2">
              <button
                onClick={requestErasure}
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {busy ? "Sending…" : "Confirm request"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-4 py-2 rounded-lg border text-sm border-gray-300 dark:border-[var(--border-color)] dark:text-[var(--text-secondary)]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="px-4 py-2 rounded-lg border border-red-500 text-red-600 text-sm font-semibold"
          >
            Request erasure
          </button>
        )}
      </div>
    </div>
  );
}
