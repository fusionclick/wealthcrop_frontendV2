// src/utils/highlight.js
// Returns HTML string with the query highlighted using <mark>
// Escapes special HTML to avoid injection
export function highlightText(text = "", query = "") {
  if (!query) return escapeHtml(text);
  const escapedQuery = escapeRegex(query.trim());
  const re = new RegExp(`(${escapedQuery})`, "ig");
  return escapeHtml(text).replace(re, '<mark class="bg-yellow-200 text-yellow-900">$1</mark>');
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function escapeHtml(unsafe) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
