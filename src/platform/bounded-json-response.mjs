const DEFAULT_MAX_JSON_RESPONSE_BYTES = 1_048_576;

export async function readBoundedJsonResponse(response, maxBytes = DEFAULT_MAX_JSON_RESPONSE_BYTES) {
  if (!response || response.ok !== true) {
    throw new Error("Connector response is not successful");
  }
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new TypeError("A positive safe-integer response limit is required");
  }

  const contentType = String(response.headers?.get("content-type") || "").toLowerCase();
  if (!/^application\/(?:[a-z0-9.+-]*\+)?json(?:\s*;|$)/.test(contentType)) {
    throw new Error("Connector response must be JSON");
  }

  const declaredLengthHeader = response.headers.get("content-length");
  if (declaredLengthHeader !== null) {
    const declaredLength = Number(declaredLengthHeader);
    if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
      throw new Error("Connector response has an invalid content length");
    }
    if (declaredLength > maxBytes) {
      throw new Error("Connector response exceeds size limit");
    }
  }

  if (!response.body) {
    throw new Error("Connector response body is missing");
  }

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) {
        throw new Error("Connector response stream returned invalid bytes");
      }
      total += value.byteLength;
      if (total > maxBytes) {
        try {
          await reader.cancel("Connector response exceeds size limit");
        } catch {
          // The response is already rejected; cancellation is best-effort.
        }
        throw new Error("Connector response exceeds size limit");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return JSON.parse(decoded);
}
