const IMAGE_MIME_TYPES = new Set(["image/jpeg","image/png","image/webp","image/avif","image/gif"]);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 20000;
const SHA256 = /^[0-9a-f]{64}$/i;

/**
 * Evaluate metadata produced by a trusted image-processing worker.
 * This is a policy gate, not an image decoder or processor. Callers must only
 * invoke it after decoding, re-encoding and hashing the actual output bytes.
 */
export function evaluateMediaProcessingResult(input = {}) {
  const sourceMimeType = String(input.sourceMimeType || "").toLowerCase();
  const outputMimeType = String(input.outputMimeType || "").toLowerCase();
  const sourceSizeBytes = Number(input.sourceSizeBytes);
  const outputSizeBytes = Number(input.outputSizeBytes);
  const width = Number(input.width);
  const height = Number(input.height);
  const sourceSha256 = String(input.sourceSha256 || "");
  const outputSha256 = String(input.outputSha256 || "");
  const processorVersion = String(input.processorVersion || "").trim();
  const rightsStatus = String(input.rightsStatus || "");

  if (!IMAGE_MIME_TYPES.has(sourceMimeType) || !IMAGE_MIME_TYPES.has(outputMimeType)) {
    return { ok: false, reason: "unsupported_image_type" };
  }
  if (!Number.isSafeInteger(sourceSizeBytes) || sourceSizeBytes < 1 || sourceSizeBytes > MAX_IMAGE_BYTES ||
      !Number.isSafeInteger(outputSizeBytes) || outputSizeBytes < 1 || outputSizeBytes > MAX_IMAGE_BYTES) {
    return { ok: false, reason: "invalid_image_size" };
  }
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) ||
      width < 1 || height < 1 || width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    return { ok: false, reason: "invalid_image_dimensions" };
  }
  if (!SHA256.test(sourceSha256) || !SHA256.test(outputSha256)) {
    return { ok: false, reason: "invalid_content_hash" };
  }
  if (!processorVersion || processorVersion.length > 64) {
    return { ok: false, reason: "missing_processor_provenance" };
  }
  if (input.decoded !== true || input.reencoded !== true) {
    return { ok: false, reason: "trusted_processing_not_confirmed" };
  }
  if (rightsStatus !== "approved") {
    return { ok: false, reason: "rights_not_approved" };
  }

  return {
    ok: true,
    status: "ready",
    value: {
      mimeType: outputMimeType,
      sizeBytes: outputSizeBytes,
      width,
      height,
      sourceSha256: sourceSha256.toLowerCase(),
      outputSha256: outputSha256.toLowerCase(),
      processorVersion
    }
  };
}
