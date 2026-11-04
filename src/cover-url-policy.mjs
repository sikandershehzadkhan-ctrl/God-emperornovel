const PLACEHOLDER = "/story-cover-placeholder.svg";

export function normalizeCoverUrl(value) {
  if (value === null || value === undefined || value === "") return PLACEHOLDER;
  if (typeof value !== "string") return null;
  const path = value.trim();
  if (!path || path.length > 180 || /[\\u0000-\\u0020\\u007f\\\\%?#]/.test(path)) return null;
  if (path === PLACEHOLDER) return PLACEHOLDER;
  if (!/^\\/covers\\/[a-z0-9][a-z0-9._-]{0,119}\\.(?:avif|jpe?g|png|webp)$/i.test(path)) return null;
  if (path.split("/").some(part => part === "." || part === "..")) return null;
  return path;
}
