/**
 * Audit #32 — where an investor reads a scheme's SID, SAI and KIM, from one maintained map.
 *
 * Neither BSE's scheme master nor the enrichment feed carries per-scheme document URLs, so
 * this points at each fund house's own documents page (a deep link where one was checked,
 * otherwise its official site, and the label says which), keyed by the AMC name in the
 * scheme's name. A scheme whose house is not listed — or a checkout that cannot tell which
 * scheme it is buying — gets SEBI's register of Scheme Information Documents, which covers
 * every fund house and is never wrong, merely less direct.
 *
 * ponytail: a regex table, same idea as amcLogo.js. Add a row when a new AMC shows up; swap a
 * homepage for its documents page once someone has checked the deep link.
 */
export const SEBI_SID_REGISTER = "https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doMutualFund=yes&mftype=2";

const AMC_DOCS = [
  [/aditya birla|birla sun/i, "Aditya Birla Sun Life Mutual Fund", "https://mutualfund.adityabirlacapital.com/forms-and-downloads/forms"],
  [/nippon|reliance/i, "Nippon India Mutual Fund", "https://mf.nipponindiaim.com"],
  [/hdfc/i, "HDFC Mutual Fund", "https://www.hdfcfund.com/investor-services/fund-documents/kim"],
  [/icici/i, "ICICI Prudential Mutual Fund", "https://www.icicipruamc.com"],
  [/\bsbi\b/i, "SBI Mutual Fund", "https://www.sbimf.com/offer-document-sid-kim"],
  [/\baxis\b/i, "Axis Mutual Fund", "https://www.axismf.com"],
  [/kotak/i, "Kotak Mahindra Mutual Fund", "https://www.kotakmf.com"],
  [/\buti\b/i, "UTI Mutual Fund", "https://www.utimf.com"],
  [/\bdsp\b/i, "DSP Mutual Fund", "https://www.dspim.com"],
  [/franklin/i, "Franklin Templeton Mutual Fund", "https://www.franklintempletonindia.com"],
  [/mirae/i, "Mirae Asset Mutual Fund", "https://www.miraeassetmf.co.in"],
  [/parag parikh|ppfas/i, "PPFAS Mutual Fund", "https://amc.ppfas.com"],
  [/\btata\b/i, "Tata Mutual Fund", "https://www.tatamutualfund.com"],
  [/invesco/i, "Invesco Mutual Fund", "https://www.invescomutualfund.com"],
  [/motilal/i, "Motilal Oswal Mutual Fund", "https://www.motilaloswalmf.com"],
  [/\bquant\b/i, "quant Mutual Fund", "https://quantmutual.com"],
  [/canara/i, "Canara Robeco Mutual Fund", "https://www.canararobeco.com"],
  [/sundaram/i, "Sundaram Mutual Fund", "https://www.sundarammutual.com"],
  [/\blic\b/i, "LIC Mutual Fund", "https://www.licmf.com"],
  [/bandhan|\bidfc\b/i, "Bandhan Mutual Fund", "https://bandhanmutual.com"],
  [/\bhsbc\b/i, "HSBC Mutual Fund", "https://www.assetmanagement.hsbc.co.in"],
  [/baroda|\bbnp\b/i, "Baroda BNP Paribas Mutual Fund", "https://www.barodabnpparibasmf.in"],
  [/edelweiss/i, "Edelweiss Mutual Fund", "https://www.edelweissmf.com"],
  [/\bpgim\b/i, "PGIM India Mutual Fund", "https://www.pgimindiamf.com"],
  [/whiteoak|white oak/i, "WhiteOak Capital Mutual Fund", "https://mf.whiteoakamc.com"],
  [/mahindra/i, "Mahindra Manulife Mutual Fund", "https://www.mahindramanulife.com"],
  [/\bjm\b/i, "JM Financial Mutual Fund", "https://www.jmfinancialmf.com"],
  [/\bunion\b/i, "Union Mutual Fund", "https://www.unionmf.com"],
  [/bank of india|\bboi\b/i, "Bank of India Mutual Fund", "https://www.boimf.in"],
  [/\bnavi\b/i, "Navi Mutual Fund", "https://navi.com/mutual-fund/downloads/scheme-documents"],
  [/zerodha/i, "Zerodha Mutual Fund", "https://www.zerodhafundhouse.com"],
  [/\bgroww\b/i, "Groww Mutual Fund", "https://www.growwmf.in"],
  [/bajaj/i, "Bajaj Finserv Mutual Fund", "https://www.bajajamc.com/downloads"],
];

/**
 * @param name  the scheme name (or the AMC's own name), as BSE / AMFI spell it
 * @returns {{ amc: string|null, url: string }}  amc null = SEBI's register, not a fund house
 */
export function schemeDocsFor(name = "") {
  const hit = AMC_DOCS.find(([re]) => re.test(String(name)));
  return hit ? { amc: hit[1], url: hit[2] } : { amc: null, url: SEBI_SID_REGISTER };
}

/** Exact scheme documents from the admin's maintained register; never match just the AMC. */
export function selectedSchemeDocuments(schemes = [], media = []) {
  return schemes.map((scheme) => {
    const code = scheme.scheme_bse_code || scheme.scheme_code || scheme.code;
    const isin = scheme.scheme_isin || scheme.isin;
    const name = scheme.name || scheme.scheme_name || "";
    const row = media.find((m) => code ? m.scheme_bse_code === code : isin ? m.scheme_isin === isin
      : name && String(m.scheme_name || "").toLowerCase() === name.toLowerCase());
    const links = Object.fromEntries(["sid", "sai", "kim"].map((key) => [key, /^https:\/\//i.test(row?.[key] || "") ? row[key] : null]));
    return { name: row?.scheme_name || name, code, isin, ...links, available: Object.values(links).every(Boolean) };
  });
}
