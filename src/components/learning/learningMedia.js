/**
 * Audit #76 — where an image module's picture comes from.
 *
 * An upload from Admin → Learning is served by Laravel (`/learning/media/<name>` on the API
 * base); a link is used as given, but only an https URL or a path on this site ever reaches
 * the <img> — plain http is mixed content on the live site, and anything else is not a picture.
 */
export const learningImageSrc = (module, apiBase) => {
  if (module?.image_file) return `${apiBase}/learning/media/${encodeURIComponent(module.image_file)}`;
  const url = String(module?.image_url || "");
  return /^(https:\/\/|\/(?!\/))\S+$/.test(url) ? url : null;
};
