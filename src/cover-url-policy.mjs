const PLACEHOLDER = "/story-cover-placeholder.svg";

export function normalizeCoverUrl(value) {
  if (value === null || value === undefined || value === "") return PLACEHOLDER;
  if (typeof value !== "string") return null;
  const path = value;
  if (path !== path.trim()) return null;
  if (!path || path.length > 180 || /[\x00-\x20\x7f\\%?#]/.test(path)) return null;
  if (path === PLACEHOLDER) return PLACEHOLDER;
  if (!/^\/covers\/[a-z0-9][a-z0-9._-]{0,119}\.(?:avif|jpe?g|png|webp)$/i.test(path)) return null;
  if (path.split("/").some(part => part === "." || part === "..")) return null;
  return path;
}
