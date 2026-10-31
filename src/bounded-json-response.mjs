export async function readBoundedJsonResponse(response, maxBytes = 1_048_576) {
  if (!response || !response.ok) throw new Error("Connector response is not successful");
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (!/^application\/(?:[a-z0-9.+-]*\+)?json(?:\s*;|$)/.test(contentType)) {
    throw new Error("Connector response must be JSON");
  }

  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > maxBytes) throw new Error("Connector response exceeds size limit");

  if (!response.body) throw new Error("Connector response body is missing");
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("Connector response exceeds size limit");
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
  return JSON.parse(new TextDecoder().decode(bytes));
}
