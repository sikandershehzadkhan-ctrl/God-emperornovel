const MAX_MEDIA_BYTES = 20 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export function validateMediaUploadMetadata(input = {}) {
  const mimeType = String(input.mime_type || "").trim().toLowerCase();
  const sizeBytes = Number(input.size_bytes);
  if (!ALLOWED_MEDIA_TYPES.has(mimeType)) return { ok: false, error: "Unsupported image format." };
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_MEDIA_BYTES) {
    return { ok: false, error: "Image must be between 1 byte and 20 MiB." };
  }
  return { ok: true, value: { mime_type: mimeType, size_bytes: sizeBytes } };
}

function startsWith(bytes, signature, offset = 0) {
  return bytes.length >= offset + signature.length && signature.every((value, index) => bytes[offset + index] === value);
}

export function detectImageMimeType(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input || []);
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) || startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])) return "image/gif";
  if (bytes.length >= 12 && startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  if (bytes.length >= 12 && startsWith(bytes, [0x00, 0x00, 0x00]) && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp") {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (["avif", "avis"].includes(brand)) return "image/avif";
  }
  return null;
}

export function validateImageBytes(input, declaredMimeType) {
  const actual = detectImageMimeType(input);
  if (!actual) return { ok: false, error: "File contents are not a supported image." };
  if (actual !== declaredMimeType) return { ok: false, error: "Image content does not match its declared format." };
  return { ok: true, mime_type: actual };
}

export function createPrivateMediaObjectKey(ownerId, assetId, randomToken) {
  const owner = Number(ownerId), asset = Number(assetId);
  const token = String(randomToken || "");
  if (!Number.isSafeInteger(owner) || owner < 1 || !Number.isSafeInteger(asset) || asset < 1 || !/^[a-f0-9]{32,64}$/i.test(token)) {
    throw new TypeError("Invalid private media object identity.");
  }
  return `private/users/${owner}/assets/${asset}/${token}`;
}
