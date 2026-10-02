import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { postApiWithToken } from "../api/api";
import { laravelUrl } from "../utils/nodeApi";
import { toastSuccess } from "../utils/notifyCustom";
import { titleCase } from "../utils/schemeName";

/**
 * Audit #11 — "Add to basket", on Explore's cards and on the fund page.
 *
 * Laravel's basket API can create a basket, list them and open one; it has NO call that adds
 * a fund to an existing basket (BasketController: createBasket / fetchBaskets /
 * getBasketDetail — and createBasket insists the weights add up to 100%). So this does the
 * part that exists end to end: a new basket that starts with this fund at 100%, created
 * through the same POST /baskets — and the same server-side validation — as Create Basket.
 * Adding to one of the investor's existing baskets waits for that endpoint.
 *
 * Signed out → login, before anything else.
 */
export default function AddToBasket({ fund, className = "" }) {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth?.token);
  const [name, setName] = useState(null);
  const [busy, setBusy] = useState(false);

  const start = (e) => {
    e.stopPropagation();
    if (!token) {
      navigate("/login");
      return;
    }
    setName(titleCase(fund?.name).slice(0, 100));
  };

  const create = async () => {
    setBusy(true);
    const res = await postApiWithToken(laravelUrl("/baskets"), {
      name: name.trim(),
      holdings: [
        {
          // Same shape Create Basket sends for a mutual fund.
          code: fund.scheme_bse_code || fund.scheme_isin,
          name: fund.name,
          asset_type: "mutual_fund",
          category: fund.subType || fund.category || null,
          weight: 100,
        },
      ],
    });
    setBusy(false);
    if (!res?.data?.id) return; // postApiWithToken already showed the server's reason
    toastSuccess(res.message || "Basket created");
    setName(null);
    navigate(`/basket/${res.data.id}`);
  };

  return (
    <>
      <button
        type="button"
        onClick={start}
        className={
          className ||
          "px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[var(--border-color)] text-xs font-medium text-slate-700 dark:text-[var(--text-primary)] hover:bg-slate-50 dark:hover:bg-[var(--white-5)]"
        }
      >
        Add to basket
      </button>

      {name !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setName(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border-color)] p-5 shadow-xl text-left"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-[var(--text-primary)]">Start a basket with this fund</h3>
            <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)] mt-1">
              {titleCase(fund?.name)} goes in at 100%. You can open the basket and invest in it right after.
            </p>
            <label className="block text-xs font-medium text-slate-600 dark:text-[var(--text-secondary)] mt-4 mb-1">
              Basket name
            </label>
            <input
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 dark:border-[var(--border-color)] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[var(--white-5)] text-slate-900 dark:text-[var(--text-primary)]"
            />
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setName(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[var(--border-color)] text-sm text-slate-700 dark:text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !name.trim()}
                onClick={create}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium"
              >
                {busy ? "Creating…" : "Create basket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
