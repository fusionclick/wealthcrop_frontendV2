import React, { useEffect, useState } from "react";
import {
  fetchKotakStatus,
  saveKotakCredentials,
  syncStockPortfolio,
} from "../../api/portfolioApi";
import { toastError, toastSuccess } from "../../utils/notifyCustom";

const KotakLinkForm = ({ onLinked, forceOpen = false }) => {
  const [show, setShow] = useState(false);
  const [mpin, setMpin] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (forceOpen) setShow(true);
  }, [forceOpen]);

  useEffect(() => {
    fetchKotakStatus()
      .then((res) => {
        const data = res?.data;
        if (data?.token_ok && !data?.trading_auth) {
          setShow(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (mpin.length !== 6) {
      toastError("MPIN 6 digits hona chahiye");
      return;
    }
    setSaving(true);
    const res = await saveKotakCredentials(mpin, totpSecret.trim());
    setSaving(false);
    if (!res?.status) {
      toastError(res?.message || "Save failed");
      return;
    }
    toastSuccess(res.message || "Kotak linked");
    setShow(false);
    const sync = await syncStockPortfolio();
    if (sync?.status) {
      toastSuccess(sync.message || "Imported");
      onLinked?.();
    } else if (sync?.needs_setup) {
      setShow(true);
    } else if (sync?.message) {
      toastError(sync.message);
    }
  };

  if (!show) return null;

  return (
    <form
      onSubmit={handleSave}
      className="mt-4 w-full max-w-sm space-y-3 p-4 rounded-lg border border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-950/20 text-left"
    >
      <p className="text-sm font-medium text-blue-950 dark:text-[var(--text-primary)]">
        Kotak account link karein
      </p>
      <p className="text-xs text-gray-600 dark:text-[var(--text-secondary)]">
        Neo login MPIN aur Trade API TOTP secret (authenticator setup wali key).
      </p>
      <input
        type="password"
        inputMode="numeric"
        maxLength={6}
        placeholder="6-digit MPIN"
        value={mpin}
        onChange={(e) => setMpin(e.target.value.replace(/\D/g, ""))}
        className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-[var(--border-color)] dark:bg-[var(--gray-800)]"
      />
      <input
        type="password"
        placeholder="TOTP secret key"
        value={totpSecret}
        onChange={(e) => setTotpSecret(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-[var(--border-color)] dark:bg-[var(--gray-800)]"
      />
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white py-2 rounded-md text-sm font-medium"
      >
        {saving ? "Linking…" : "Save & Import"}
      </button>
    </form>
  );
};

export default KotakLinkForm;
