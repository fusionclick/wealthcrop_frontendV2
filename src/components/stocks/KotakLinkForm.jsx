import React, { useEffect, useState } from "react";
import {
  fetchKotakStatus,
  saveBrokerCredentials,
  saveKotakCredentials,
  syncStockPortfolio,
  useKotakBroker,
} from "../../api/portfolioApi";
import { toastError, toastSuccess } from "../../utils/notifyCustom";

// Stocks run on the investor's own Kotak Neo account, not a shared platform login, so this
// collects the credentials Kotak needs to place an order for them. Access token and UCC are
// the two the investor copies out of Kotak; mobile, MPIN and TOTP are what tradeApiLogin
// additionally needs, so the form asks for them here rather than failing at order time.
const KotakLinkForm = ({ onLinked, forceOpen = false, compact = false }) => {
  const [show, setShow] = useState(false);
  const [values, setValues] = useState({
    access_token: "",
    ucc: "",
    mobile: "",
    mpin: "",
    totp_secret: "",
  });
  const [saving, setSaving] = useState(false);

  // FR 2.1 — Kotak is the default, not the only one. The catalogue comes from the server so
  // a broker added there appears here without a frontend change.
  const [catalogue, setCatalogue] = useState([]);
  const [broker, setBroker] = useState("kotak");
  const [other, setOther] = useState({ access_token: "", client_id: "", api_key: "" });

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const setOtherField = (key) => (e) => setOther((v) => ({ ...v, [key]: e.target.value }));

  useEffect(() => {
    if (forceOpen) setShow(true);
  }, [forceOpen]);

  useEffect(() => {
    fetchKotakStatus()
      .then((res) => {
        if (!res?.data) return;
        setCatalogue(res.data.brokers || []);
        if (res.data.broker) setBroker(res.data.broker);
        if (!forceOpen && !res.data.linked) setShow(true);
      })
      .catch(() => {});
  }, [forceOpen]);

  // Selecting Kotak is itself the switch back — there is nothing to collect, the investor's
  // Kotak credentials are already stored under their own columns.
  const pickBroker = async (key) => {
    setBroker(key);
    if (key !== "kotak") return;
    const res = await useKotakBroker();
    if (res?.status) {
      toastSuccess(res.message || "Switched to Kotak Neo");
      onLinked?.();
    }
  };

  const handleSaveOther = async (e) => {
    e.preventDefault();
    if (!other.access_token.trim()) {
      toastError("Access token is required");
      return;
    }

    setSaving(true);
    const res = await saveBrokerCredentials({
      broker,
      access_token: other.access_token.trim(),
      client_id: other.client_id.trim(),
      api_key: other.api_key.trim(),
    });
    setSaving(false);

    if (!res?.status) {
      toastError(res?.message || "Could not link that account");
      return;
    }

    toastSuccess(res.message);
    // Still missing a required field: keep the form open, the message says which.
    if (!res.missing?.length) setShow(false);
    onLinked?.();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      access_token: values.access_token.trim(),
      ucc: values.ucc.trim(),
      mobile: values.mobile.trim(),
      mpin: values.mpin.trim(),
      totp_secret: values.totp_secret.trim(),
    };
    if (!payload.access_token || !payload.ucc) {
      toastError("Access token and UCC are both required");
      return;
    }
    if (payload.mpin && payload.mpin.length !== 6) {
      toastError("MPIN must be 6 digits");
      return;
    }

    setSaving(true);
    const res = await saveKotakCredentials(payload);
    setSaving(false);
    if (!res?.status) {
      toastError(res?.message || "Could not link your Kotak account");
      return;
    }

    toastSuccess(res.message || "Kotak account linked");
    setShow(false);
    onLinked?.();

    // Pull whatever is already in that account. It needs the full login, so a partial
    // link (no MPIN/TOTP yet) is expected to say so rather than look broken.
    const sync = await syncStockPortfolio();
    if (sync?.status) {
      toastSuccess(sync.message || "Holdings imported");
    } else if (sync?.message) {
      toastError(sync.message);
    }
  };

  if (!show) return null;

  const field = "w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-[var(--border-color)] dark:bg-[var(--gray-800)]";

  return (
    <form
      onSubmit={broker === "kotak" ? handleSave : handleSaveOther}
      className={`w-full space-y-3 text-left ${
        compact ? "" : "mt-4 max-w-sm p-4 rounded-lg border border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-950/20"
      }`}
    >
      {!compact && (
        <p className="text-sm font-medium text-blue-950 dark:text-[var(--text-primary)]">
          Link your broking account
        </p>
      )}

      {catalogue.length > 1 && (
        <div>
          <label className="block text-xs mb-1 text-gray-600 dark:text-[var(--text-secondary)]">
            Broker
          </label>
          <select
            value={broker}
            onChange={(e) => pickBroker(e.target.value)}
            className={field}
          >
            {catalogue.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
                {b.default ? " (default)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {broker !== "kotak" ? (
        <>
          <div>
            <label className="block text-xs mb-1 text-gray-600 dark:text-[var(--text-secondary)]">
              Access token <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              autoComplete="off"
              placeholder="From your broker's developer console"
              value={other.access_token}
              onChange={setOtherField("access_token")}
              className={field}
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-600 dark:text-[var(--text-secondary)]">
              Client ID
            </label>
            <input
              type="text"
              autoComplete="off"
              placeholder="Your client code with this broker"
              value={other.client_id}
              onChange={setOtherField("client_id")}
              className={field}
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-600 dark:text-[var(--text-secondary)]">
              API key
            </label>
            <input
              type="password"
              autoComplete="off"
              placeholder="Only if your broker issues one"
              value={other.api_key}
              onChange={setOtherField("api_key")}
              className={field}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white py-2 rounded-md text-sm font-medium transition"
          >
            {saving ? "Linking…" : "Save & continue"}
          </button>
        </>
      ) : (
      <>
      <div>
        <label className="block text-xs mb-1 text-gray-600 dark:text-[var(--text-secondary)]">
          Access token <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          autoComplete="off"
          placeholder="From your Kotak Neo Trade API dashboard"
          value={values.access_token}
          onChange={set("access_token")}
          className={field}
        />
      </div>

      <div>
        <label className="block text-xs mb-1 text-gray-600 dark:text-[var(--text-secondary)]">
          UCC <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          autoComplete="off"
          placeholder="Your Kotak client code"
          value={values.ucc}
          onChange={(e) => setValues((v) => ({ ...v, ucc: e.target.value.toUpperCase() }))}
          className={field}
        />
      </div>

      {/* Open by default: the backend no longer borrows the platform's mobile/MPIN/TOTP for a
          linked investor, so leaving these blank means orders are refused with nothing on
          screen to explain why. */}
      <details open className="text-xs text-gray-600 dark:text-[var(--text-secondary)]">
        <summary className="cursor-pointer select-none py-1">
          Also needed to place orders (mobile, MPIN, TOTP)
        </summary>
        <div className="space-y-3 pt-2">
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            autoComplete="off"
            placeholder="Mobile registered with Kotak"
            value={values.mobile}
            onChange={(e) => setValues((v) => ({ ...v, mobile: e.target.value.replace(/\D/g, "") }))}
            className={field}
          />
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            autoComplete="off"
            placeholder="6-digit Neo login MPIN"
            value={values.mpin}
            onChange={(e) => setValues((v) => ({ ...v, mpin: e.target.value.replace(/\D/g, "") }))}
            className={field}
          />
          <input
            type="password"
            autoComplete="off"
            placeholder="Trade API TOTP secret (the authenticator key)"
            value={values.totp_secret}
            onChange={set("totp_secret")}
            className={field}
          />
        </div>
      </details>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white py-2 rounded-md text-sm font-medium transition"
      >
        {saving ? "Linking…" : "Save & continue"}
      </button>
      </>
      )}
    </form>
  );
};

export default KotakLinkForm;
