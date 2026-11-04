const PLACEHOLDER = "/story-cover-placeholder.svg";
const ALLOWED_COVERS = new Set([
  "/covers/ascendant.jpg",
  "/covers/cartographer.jpg",
  "/covers/ember.jpg",
  "/covers/glass.jpg",
  "/covers/isekai.jpg",
  "/covers/mercy.jpg",
  "/covers/neon.jpg",
  "/covers/swords.jpg"
]);

export function normalizeCoverUrl(value) {
  if (value === null || value === undefined || value === "") return PLACEHOLDER;
  if (typeof value !== "string" || value !== value.trim()) return null;
  if (value === PLACEHOLDER) return PLACEHOLDER;
  return ALLOWED_COVERS.has(value) ? value : null;
}
