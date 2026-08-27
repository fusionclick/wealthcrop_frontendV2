import { postApi, putApiWithToken } from "../api/api";
import { laravelUrl, nodeUrl } from "./nodeApi";
import { liveNav } from "./navSocket";

const MASTER = () => nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list");
const EXTERNAL = () => laravelUrl(import.meta.env.VITE_EXTERNAL_MF || "/portfolio/mf/external");

const norm = (s) => String(s || "").trim().toUpperCase().replace(/\s+/g, " ");

/** Catalogue se sabse qareeb scheme — published NAV yahan se aati hai (AMFI/BSE), formula se nahi. */
export function pickCatalogueHit(lists = [], schemeName = "") {
  const needle = norm(schemeName);
  if (!needle || needle.length < 3) return null;
  const rows = Array.isArray(lists) ? lists : [];
  const exact = rows.find((f) => norm(f.name) === needle);
  if (exact?.nav > 0) return exact;
  const starts = rows.find((f) => norm(f.name).startsWith(needle) || needle.startsWith(norm(f.name)));
  if (starts?.nav > 0) return starts;
  const has = rows.find((f) => norm(f.name).includes(needle) || needle.includes(norm(f.name).slice(0, 24)));
  return has?.nav > 0 ? has : null;
}

export async function searchCatalogue(schemeName) {
  const res = await postApi(MASTER(), {
    start: 0,
    length: 30,
    search: String(schemeName || "").trim(),
  });
  return res?.lists || res?.data?.lists || [];
}

/**
 * Holding ki published NAV lao (socket → catalogue). ISIN/code missing ho to
 * naam se link karke DB mein save bhi kar do taake agli baar socket match kare.
 */
export async function ensureExternalNav(row, navs = {}) {
  const fromLive = liveNav(
    { scheme_isin: row.scheme_isin, scheme_bse_code: row.scheme_bse_code, nav: row.nav },
    navs
  );
  if (fromLive != null && row.scheme_isin) {
    return { nav: fromLive, patched: false, row };
  }

  const lists = await searchCatalogue(row.scheme_name);
  const hit = pickCatalogueHit(lists, row.scheme_name);
  if (!hit) {
    return { nav: fromLive, patched: false, row };
  }

  const nav = Number(hit.nav);
  const patch = {
    nav,
    scheme_isin: hit.scheme_isin || row.scheme_isin || "",
    scheme_bse_code: hit.scheme_bse_code || row.scheme_bse_code || "",
    scheme_category: hit.category || row.scheme_category || "",
  };

  // pehle se linked + same nav → sirf return
  if (
    String(row.scheme_isin || "").toUpperCase() === String(patch.scheme_isin).toUpperCase() &&
    Number(row.nav) === nav
  ) {
    return { nav, patched: false, row: { ...row, ...patch } };
  }

  const saved = await putApiWithToken(`${EXTERNAL()}/${row.id}`, patch, { silent: true });
  const next = saved?.data || { ...row, ...patch };
  return { nav, patched: true, row: next };
}
