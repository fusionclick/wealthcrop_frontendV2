/** AMC site favicon as scheme logo. Falls back in <img onError>. */
const AMC = [
  [/nippon|reliance/i, "nipponindiamf.com"],
  [/hdfc/i, "hdfcfund.com"],
  [/icici/i, "icicipruamc.com"],
  [/sbi/i, "sbimf.com"],
  [/axis/i, "axismf.com"],
  [/kotak/i, "kotakmf.com"],
  [/uti/i, "utimf.com"],
  [/\bdsp\b/i, "dspim.com"],
  [/franklin/i, "franklintempletonindia.com"],
  [/mirae/i, "miraeassetmf.co.in"],
  [/parag parikh|ppfas/i, "ppfas.com"],
  [/\btata\b/i, "tatamutualfund.com"],
  [/aditya birla|birla sun/i, "mutualfund.adityabirlacapital.com"],
  [/invesco/i, "invescomutualfund.co.in"],
  [/motilal/i, "motilaloswalmf.com"],
  [/\bquant\b/i, "quantmutual.com"],
  [/canara/i, "canararobeco.com"],
  [/sundaram/i, "sundarammutual.com"],
  [/\blic\b/i, "licmf.com"],
  [/bandhan/i, "bandhanmutual.com"],
  [/\bhsbc\b/i, "assetmanagement.hsbc.co.in"],
  [/baroda|bnp/i, "barodabnpparibasmf.in"],
  [/edelweiss/i, "edelweissmf.com"],
  [/pgim/i, "pgimindiamf.com"],
  [/whiteoak|white oak/i, "whiteoakamc.com"],
  [/mahindra/i, "mahindramanulife.com"],
  [/\biti\b/i, "itiamc.com"],
  [/\bjm\b/i, "jmfinancialmf.com"],
  [/union /i, "unionmf.com"],
  [/bank of india|\bboi\b/i, "boimf.in"],
  [/\bnavi\b/i, "navimutualfund.com"],
  [/zerodha/i, "zerodhafundhouse.com"],
  [/\bgroww\b/i, "growwmf.in"],
  [/bajaj/i, "bajajamc.com"],
];

export function amcLogoUrl(name = "") {
  const domain = AMC.find(([re]) => re.test(name))?.[1];
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : "";
}

export function amcInitial(name = "") {
  const t = String(name).trim();
  return t ? t[0].toUpperCase() : "F";
}
