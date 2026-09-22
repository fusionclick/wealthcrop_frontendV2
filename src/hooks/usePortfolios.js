import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiWithToken, postApiWithToken, putApiWithToken, deleteApiWithToken } from "../api/api";
import { toastError, toastSuccess } from "../utils/notifyCustom";

/**
 * FR 4.1 — the investor's own portfolios, and which holding sits in which.
 *
 * One hook because three screens need the same answer (the dashboard filters by it, the
 * holding sheet writes to it, the manage list edits it) and a second copy of "which
 * portfolio is this folio in" would drift the moment one of them forgot to invalidate.
 */

const base = () => `${import.meta.env.VITE_URL}/portfolios`;

/**
 * How a holding is named to the server. Must match PortfolioItem::bseKey exactly — the
 * same scheme in two folios is two holdings, so the folio is part of the identity.
 */
export const holdingKey = (holding, source = "internal") =>
  source === "external"
    ? `ext:${holding?.id}`
    : `bse:${String(holding?.scheme_bse_code || holding?.code || "").trim()}|${String(holding?.folio || "").trim()}`;

export default function usePortfolios(enabled = true) {
  const queryClient = useQueryClient();

  const { data: portfolios = [], isLoading } = useQuery({
    queryKey: ["portfolios"],
    queryFn: () => getApiWithToken(base()),
    select: (res) => res?.data || [],
    enabled,
  });

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["portfolios"] }),
    [queryClient]
  );

  // key -> portfolio, built once per change rather than scanned per row.
  const byHolding = useMemo(() => {
    const map = new Map();
    for (const p of portfolios) {
      for (const key of p.holding_keys || []) map.set(key, p);
    }
    return map;
  }, [portfolios]);

  const create = useCallback(
    async (name) => {
      const trimmed = String(name || "").trim();
      if (!trimmed) return null;
      try {
        const res = await postApiWithToken(base(), { name: trimmed }, { silent: true, throwOnError: true });
        await refresh();
        return res?.data || null;
      } catch (e) {
        toastError(e?.response?.data?.message || e?.message || "Could not create that portfolio.");
        return null;
      }
    },
    [refresh]
  );

  const rename = useCallback(
    async (id, name) => {
      try {
        await putApiWithToken(`${base()}/${id}`, { name: String(name || "").trim() }, { silent: true });
        await refresh();
        return true;
      } catch (e) {
        toastError(e?.response?.data?.message || "Could not rename that portfolio.");
        return false;
      }
    },
    [refresh]
  );

  const remove = useCallback(
    async (id) => {
      try {
        const res = await deleteApiWithToken(`${base()}/${id}`);
        await refresh();
        toastSuccess(res?.message || "Portfolio deleted.");
        return true;
      } catch (e) {
        toastError(e?.message || "Could not delete that portfolio.");
        return false;
      }
    },
    [refresh]
  );

  /** `portfolioId` of null takes the holdings out of whatever they are in. */
  const assign = useCallback(
    async (portfolioId, keys) => {
      const list = (Array.isArray(keys) ? keys : [keys]).filter(Boolean);
      if (!list.length) return false;
      try {
        await postApiWithToken(
          `${base()}/assign`,
          { portfolio_id: portfolioId ?? null, holding_keys: list },
          { silent: true, throwOnError: true }
        );
        await refresh();
        return true;
      } catch (e) {
        toastError(e?.response?.data?.message || "Could not move that holding.");
        return false;
      }
    },
    [refresh]
  );

  return { portfolios, isLoading, byHolding, create, rename, remove, assign, refresh };
}
