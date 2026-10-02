/**
 * POST /kyc/document as multipart — the one place a KYC document leaves the browser, shared by
 * the KYC wizard and Profile → Documents (Audit #43). Resolves to the server's body; rejects
 * with the server's own reason, so "upload both sides" or "this document is locked" reaches
 * the investor instead of a bare "Upload failed".
 */
export async function uploadKycDocument(type, file, { document_number, side, back } = {}) {
  const formData = new FormData();
  formData.append("type", type);
  formData.append("file", file);
  // SRS p.3 — a secondary ID carries its number and which side this image is.
  if (document_number) formData.append("document_number", document_number);
  if (side) formData.append("side", side);
  // Audit #43 — an Aadhaar goes up as a pair; `file` is its front.
  if (back) formData.append("file_back", back);

  const res = await fetch(`${import.meta.env.VITE_URL}/kyc/document`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: formData,
  });

  // A raw fetch Response, not an axios one: `ok` sits on the response itself. Reading
  // `res.data?.ok` (8eb9cd7) failed every upload on screen although the server kept the file.
  const data = await res.json().catch(() => null);
  if (!res.ok || !(data?.status === true || data?.status === 200)) {
    throw new Error(data?.message || "Upload failed");
  }
  return data;
}
