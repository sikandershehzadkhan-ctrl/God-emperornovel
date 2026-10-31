import assert from "node:assert/strict";
import { createPrivateMediaObjectKey, detectImageMimeType, validateImageBytes, validateMediaUploadMetadata } from "../src/media-upload-policy.mjs";

const fixtures = [
  ["image/jpeg", [0xff,0xd8,0xff,0x00]],
  ["image/png", [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]],
  ["image/gif", [0x47,0x49,0x46,0x38,0x39,0x61]],
  ["image/webp", [0x52,0x49,0x46,0x46,0x00,0x00,0x00,0x00,0x57,0x45,0x42,0x50]],
  ["image/avif", [0x00,0x00,0x00,0x18,0x66,0x74,0x79,0x70,0x61,0x76,0x69,0x66]],
];
for (const [mime, bytes] of fixtures) {
  assert.equal(detectImageMimeType(new Uint8Array(bytes)), mime);
  assert.equal(validateImageBytes(new Uint8Array(bytes), mime).ok, true);
}
assert.equal(validateImageBytes(new Uint8Array(fixtures[0][1]), "image/png").ok, false);
assert.equal(detectImageMimeType(new TextEncoder().encode("<svg onload=alert(1)>")), null);
assert.equal(validateMediaUploadMetadata({mime_type:"image/svg+xml",size_bytes:100}).ok, false);
assert.equal(validateMediaUploadMetadata({mime_type:"image/png",size_bytes:20*1024*1024+1}).ok, false);
assert.equal(validateMediaUploadMetadata({mime_type:"image/png",size_bytes:1}).ok, true);
assert.equal(createPrivateMediaObjectKey(7,12,"a".repeat(32)), "private/users/7/assets/12/"+"a".repeat(32));
assert.throws(() => createPrivateMediaObjectKey(7,12,"../escape"));
console.log("PASS: media size/type policy, image magic-byte checks, mismatch rejection, SVG rejection and private object-key safety.");
