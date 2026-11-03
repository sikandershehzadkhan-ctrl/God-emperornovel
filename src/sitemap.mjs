export const SITEMAP_PAGE_SIZE = 10000;

const STATIC_PATHS = [
  "/", "/catalog", "/formats", "/genres", "/tags", "/search",
  "/community", "/leaderboard", "/omniportal", "/trend-factory",
  "/community-taxonomy", "/privacy", "/terms", "/copyright"
];

function xmlEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
  }[character]));
}

function safeOrigin(value) {
  const parsed = new URL(value);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new TypeError("Sitemap origin must use HTTP or HTTPS");
  return parsed.origin;
}

function lastmod(value) {
  const match = String(value ?? "").match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? `<lastmod>${match[1]}</lastmod>` : "";
}

function urlEntry(origin, path, modified) {
  return `<url><loc>${xmlEscape(origin + path)}</loc>${lastmod(modified)}</url>`;
}

export function renderSitemapIndex(originValue, novelPages = 0, chapterPages = 0) {
  const origin = safeOrigin(originValue);
  const paths = ["/sitemap-static.xml"];
  for (let page = 0; page < Math.min(50000, Math.max(0, Number(novelPages) || 0)); page++) paths.push(`/sitemap-novels.xml?page=${page}`);
  for (let page = 0; page < Math.min(50000, Math.max(0, Number(chapterPages) || 0)); page++) paths.push(`/sitemap-chapters.xml?page=${page}`);
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<sitemap><loc>${xmlEscape(origin + path)}</loc></sitemap>`).join("")}</sitemapindex>`;
}

export function renderStaticSitemap(originValue) {
  const origin = safeOrigin(originValue);
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${STATIC_PATHS.map(path => urlEntry(origin, path)).join("")}</urlset>`;
}

export function renderNovelSitemap(originValue, rows = []) {
  const origin = safeOrigin(originValue);
  const entries = (Array.isArray(rows) ? rows : []).filter(row => Number.isSafeInteger(Number(row?.id)) && Number(row.id) > 0).map(row => urlEntry(origin, `/novel/${Number(row.id)}`, row.updated_at));
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join("")}</urlset>`;
}

export function renderChapterSitemap(originValue, rows = []) {
  const origin = safeOrigin(originValue);
  const entries = (Array.isArray(rows) ? rows : []).filter(row => Number.isSafeInteger(Number(row?.novel_id)) && Number(row.novel_id) > 0 && Number.isSafeInteger(Number(row?.chapter_number)) && Number(row.chapter_number) > 0).map(row => urlEntry(origin, `/read/${Number(row.novel_id)}/${Number(row.chapter_number)}`, row.created_at));
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join("")}</urlset>`;
}

export const SITEMAP_STATIC_PATHS = Object.freeze([...STATIC_PATHS]);
