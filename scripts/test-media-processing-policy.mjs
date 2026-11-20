import assert from "node:assert/strict";
import { evaluateMediaProcessingResult } from "../src/media/media-processing-policy.mjs";

const valid = {
  sourceMimeType: "image/png", outputMimeType: "image/webp",
  sourceSizeBytes: 4096, outputSizeBytes: 2048,
  width: 1200, height: 1800,
  sourceSha256: "a".repeat(64), outputSha256: "b".repeat(64),
  processorVersion: "imperial-image-worker/1",
  decoded: true, reencoded: true, rightsStatus: "approved"
};
const accepted = evaluateMediaProcessingResult(valid);
assert.equal(accepted.ok, true);
assert.equal(accepted.status, "ready");
assert.equal(accepted.value.mimeType, "image/webp");

for (const [field, value, reason] of [
  ["outputMimeType", "image/svg+xml", "unsupported_image_type"],
  ["outputSizeBytes", 20 * 1024 * 1024 + 1, "invalid_image_size"],
  ["width", 20001, "invalid_image_dimensions"],
  ["height", 0, "invalid_image_dimensions"],
  ["outputSha256", "not-a-hash", "invalid_content_hash"],
  ["processorVersion", "", "missing_processor_provenance"],
  ["decoded", false, "trusted_processing_not_confirmed"],
  ["reencoded", false, "trusted_processing_not_confirmed"],
  ["rightsStatus", "pending_review", "rights_not_approved"]
]) {
  const result = evaluateMediaProcessingResult({ ...valid, [field]: value });
  assert.equal(result.ok, false, field);
  assert.equal(result.reason, reason, field);
}
assert.equal(evaluateMediaProcessingResult({ ...valid, sourceMimeType: "image/svg+xml" }).ok, false);
console.log("PASS: media processing readiness requires bounded decoded/re-encoded image metadata, provenance, valid hashes and approved rights.");
