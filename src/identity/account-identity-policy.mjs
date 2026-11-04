const RESERVED = new Set(["admin","administrator","api","account","author","authors","catalog","community","discover","forgot-password","history","library","login","logout","novel","novels","notifications","profile","read","register","search","settings","u","user","users"]);
export function validateUsernameChange(input, currentUsername) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, error: "A username change request is required." };
  const username = typeof input.username === "string" ? input.username.normalize("NFC").trim() : "";
  if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) return { ok: false, error: "Username must be 3-24 letters, numbers or underscores." };
  if (RESERVED.has(username.toLowerCase())) return { ok: false, error: "That username is reserved. Choose another." };
  if (username.toLowerCase() === String(currentUsername || "").toLowerCase()) return { ok: false, error: "Choose a different username." };
  return { ok: true, value: username };
}
