import fs from "node:fs";
import assert from "node:assert/strict";

const tokens = fs.readFileSync("public/imperial-design-tokens.css", "utf8");
const components = fs.readFileSync("public/imperial-ui-primitives.css", "utf8");
const releaseStylesheets = [
  "public/style-17.23.0.css",
  "public/app-17.23.0.css",
  "public/imperial-luxury-17.23.0.css",
  "public/imperial-formats-17.23.0.css",
  "public/imperial-comic-reader-17.23.0.css",
  "public/imperial-glass.css"
].map(path => fs.readFileSync(path, "utf8"));
const spec = fs.readFileSync("design-system/IMPERIAL-DESIGN-SYSTEM-18.0.0.md", "utf8");
const html = fs.readFileSync("public/index.html", "utf8");
const app = fs.readFileSync("public/app.js", "utf8");
const versionedApp = fs.readFileSync("public/app-17.23.0.js", "utf8");
const adminHtml = fs.readFileSync("public/admin.html", "utf8");
const authorHtml = fs.readFileSync("public/author.html", "utf8");
const privacyHtml = fs.readFileSync("public/privacy.html", "utf8");
const termsHtml = fs.readFileSync("public/terms.html", "utf8");
const copyrightHtml = fs.readFileSync("public/copyright.html", "utf8");
const taxonomyHtml = fs.readFileSync("public/community-taxonomy.html", "utf8");
const standaloneDirectionTemplates = [
  ["index.html", html], ["catalog.html", fs.readFileSync("public/catalog.html", "utf8")],
  ["genres.html", fs.readFileSync("public/genres.html", "utf8")], ["tags.html", fs.readFileSync("public/tags.html", "utf8")],
  ["search.html", fs.readFileSync("public/search.html", "utf8")], ["library.html", fs.readFileSync("public/library.html", "utf8")],
  ["history.html", fs.readFileSync("public/history.html", "utf8")], ["following.html", fs.readFileSync("public/following.html", "utf8")],
  ["tickets.html", fs.readFileSync("public/tickets.html", "utf8")], ["requests.html", fs.readFileSync("public/requests.html", "utf8")],
  ["omniportal.html", fs.readFileSync("public/omniportal.html", "utf8")], ["privacy.html", privacyHtml],
  ["terms.html", termsHtml], ["copyright.html", copyrightHtml], ["account.html", fs.readFileSync("public/account.html", "utf8")],
  ["login.html", fs.readFileSync("public/login.html", "utf8")], ["register.html", fs.readFileSync("public/register.html", "utf8")],
  ["admin.html", adminHtml], ["author.html", authorHtml], ["novel.html", fs.readFileSync("public/novel.html", "utf8")],
  ["read.html", fs.readFileSync("public/read.html", "utf8")], ["fandom.html", fs.readFileSync("public/fandom.html", "utf8")],
  ["author-public.html", fs.readFileSync("public/author-public.html", "utf8")], ["404.html", fs.readFileSync("public/404.html", "utf8")],
  ["community-taxonomy.html", taxonomyHtml]
];
const worker = fs.readFileSync("src/index.js", "utf8");
const localeStart = app.indexOf("const IN_LANG=") + "const IN_LANG=".length;
const localeEnd = app.indexOf("};function setINLang", localeStart) + 1;
const localeSource = localeStart >= "const IN_LANG=".length && localeEnd > localeStart ? app.slice(localeStart, localeEnd) : null;
assert.ok(localeSource, "interface locale dictionaries must remain available for contract validation");
const localeDictionaries = JSON.parse(localeSource);
const expectedLocales = ["en","ur","hi","zh-CN","zh-TW","es","fr","id","ja","ko","pt-BR","ar","vi","fa"];
assert.deepEqual(Object.keys(localeDictionaries).sort(), expectedLocales.sort(), "all fourteen supported interface locales must have dictionaries");
const englishLocaleKeys = Object.keys(localeDictionaries.en).sort();
for (const [locale, dictionary] of Object.entries(localeDictionaries)) {
  assert.deepEqual(Object.keys(dictionary).sort(), englishLocaleKeys, locale + " must cover every English interface string");
}
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const usage = fs.readFileSync("design-system/COMPONENT-USAGE-18.0.0.md", "utf8");
const routeMap = fs.readFileSync("design-system/ROUTE-TEMPLATE-MIGRATION-MAP-18.0.0.md", "utf8");
assert.ok(spec.includes("Design-system specification version `18.0.0` is independent from the application runtime release"));
assert.ok(spec.includes("runtime release in `package.json`"));

function readHex(block, token, theme) {
  const match = block.match(new RegExp(token + ":[\\t\\r\\n ]*(#[0-9A-Fa-f]{6})"));
  assert.ok(match, theme + " is missing a valid hex value for " + token);
  return match[1];
}
function luminance(hex) {
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrastRatio(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

const themes = ["light", "dark", "midnight", "sepia", "imperial", "cosmic"];
const themeRoles = [
  "--in-bg-canvas", "--in-bg-subtle", "--in-bg-surface", "--in-bg-elevated", "--in-bg-inverse",
  "--in-text-primary", "--in-text-secondary", "--in-text-muted", "--in-text-inverse",
  "--in-border-default", "--in-border-strong",
  "--in-action-primary", "--in-action-primary-hover", "--in-action-primary-active", "--in-action-primary-text",
  "--in-action-secondary", "--in-action-secondary-hover", "--in-action-secondary-text", "--in-focus-ring", "--in-link",
  "--in-status-success", "--in-status-success-bg", "--in-status-warning", "--in-status-warning-bg",
  "--in-status-danger", "--in-status-danger-bg", "--in-status-info", "--in-status-info-bg",
  "--in-reader-paper", "--in-reader-ink"
];
for (const theme of themes) {
  const match = tokens.match(new RegExp('(?:^|,)[\\t\\r\\n ]*\\[data-theme="' + theme + '"\\][\\t\\r\\n ]*\\{([^}]*)\\}', "m"));
  assert.ok(match, "missing theme: " + theme);
  for (const role of themeRoles) {
    assert.ok(match[1].includes(role + ":"), theme + " theme is missing semantic role: " + role);
  }
  const canvas = readHex(match[1], "--in-bg-canvas", theme);
  const primaryText = readHex(match[1], "--in-text-primary", theme);
  const secondaryText = readHex(match[1], "--in-text-secondary", theme);
  const mutedText = readHex(match[1], "--in-text-muted", theme);
  const readerInk = readHex(match[1], "--in-reader-ink", theme);
  const readerPaper = readHex(match[1], "--in-reader-paper", theme);
  const primary = readHex(match[1], "--in-action-primary", theme);
  const primaryActionText = readHex(match[1], "--in-action-primary-text", theme);
  const secondary = readHex(match[1], "--in-action-secondary", theme);
  const secondaryActionText = readHex(match[1], "--in-action-secondary-text", theme);
  const link = readHex(match[1], "--in-link", theme);
  const focus = readHex(match[1], "--in-focus-ring", theme);
  assert.ok(contrastRatio(primaryText, canvas) >= 4.5, theme + " body text fails WCAG AA contrast");
  assert.ok(contrastRatio(secondaryText, canvas) >= 4.5, theme + " secondary text fails WCAG AA contrast");
  assert.ok(contrastRatio(mutedText, canvas) >= 4.5, theme + " muted text fails WCAG AA contrast");
  assert.ok(contrastRatio(primaryText, readHex(match[1], "--in-bg-surface", theme)) >= 4.5, theme + " primary text fails on surface backgrounds");
  assert.ok(contrastRatio(readerInk, readerPaper) >= 4.5, theme + " reader ink/paper pair fails WCAG AA contrast");
  assert.ok(contrastRatio(primaryActionText, primary) >= 4.5, theme + " primary action text fails WCAG AA contrast");
  assert.ok(contrastRatio(secondaryActionText, secondary) >= 4.5, theme + " secondary action text fails WCAG AA contrast");
  assert.ok(contrastRatio(link, canvas) >= 4.5, theme + " link color fails WCAG AA contrast");
  assert.ok(contrastRatio(focus, canvas) >= 3, theme + " focus indicator fails non-text contrast");
  const strongBorder = readHex(match[1], "--in-border-strong", theme);
  assert.ok(contrastRatio(strongBorder, canvas) >= 3, theme + " strong control border fails non-text contrast");
  const highContrastLight = ["light", "sepia"].includes(theme);
  const highContrastBorder = highContrastLight ? "#68757D" : "#8799A3";
  const highContrastStrongBorder = highContrastLight ? "#46535B" : "#B1C0C7";
  const highContrastFocus = highContrastLight ? "#064A9E" : "#A9D0FF";
  assert.ok(contrastRatio(highContrastBorder, canvas) >= 3, theme + " high-contrast default boundary fails non-text contrast");
  assert.ok(contrastRatio(highContrastStrongBorder, canvas) >= 3, theme + " high-contrast strong boundary fails non-text contrast");
  assert.ok(contrastRatio(highContrastFocus, canvas) >= 3, theme + " high-contrast focus indicator fails non-text contrast");
  for (const status of ["success", "warning", "danger", "info"]) {
    const foreground = readHex(match[1], "--in-status-" + status, theme);
    const background = readHex(match[1], "--in-status-" + status + "-bg", theme);
    assert.ok(contrastRatio(foreground, background) >= 4.5, theme + " " + status + " status fails WCAG AA contrast");
  }

  const textRoles = ["--in-text-primary", "--in-text-secondary", "--in-text-muted"];
  const surfaceRoles = ["--in-bg-canvas", "--in-bg-subtle", "--in-bg-surface", "--in-bg-elevated"];
  for (const textRole of textRoles) {
    const foreground = readHex(match[1], textRole, theme);
    for (const surfaceRole of surfaceRoles) {
      const background = readHex(match[1], surfaceRole, theme);
      assert.ok(contrastRatio(foreground, background) >= 4.5, theme + " " + textRole + " fails WCAG AA on " + surfaceRole);
    }
  }
  assert.ok(contrastRatio(readHex(match[1], "--in-text-inverse", theme), readHex(match[1], "--in-bg-inverse", theme)) >= 4.5, theme + " inverse text/background pair fails WCAG AA");
  for (const [foregroundRole, backgroundRole] of [
    ["--in-action-primary-text", "--in-action-primary-hover"],
    ["--in-action-primary-text", "--in-action-primary-active"],
    ["--in-action-secondary-text", "--in-action-secondary-hover"]
  ]) {
    assert.ok(contrastRatio(readHex(match[1], foregroundRole, theme), readHex(match[1], backgroundRole, theme)) >= 4.5, theme + " " + foregroundRole + " fails WCAG AA on " + backgroundRole);
  }

}

const requiredFoundationTokens = [
  "--in-brand-white", "--in-brand-obsidian", "--in-brand-purple", "--in-brand-sapphire",
  "--in-font-sans", "--in-font-serif", "--in-font-mono", "--in-space-4", "--in-radius-md",
  "--in-touch-target", "--in-content-max", "--in-reading-max", "--in-z-dialog", "--in-motion-normal"
];
for (const token of requiredFoundationTokens) {
  assert.ok(tokens.includes(token), "missing foundation token: " + token);
}
const requiredComponents = [
  ".in-button--primary", ".in-button--secondary", ".in-button--danger",
  ".in-field", ".in-select", ".in-textarea", ".in-checkbox", ".in-radio", ".in-switch",
  ".in-check-row", ".in-card", ".in-badge", ".in-avatar", ".in-tabs", ".in-table",
  ".in-dialog", ".in-toast", ".in-tooltip", ".in-empty-state", ".in-skeleton",
  ".in-alert", ".in-progress", ".in-divider", ".in-nav-link", ".in-pagination"
];
for (const component of requiredComponents) {
  assert.ok(components.includes(component), "missing component primitive: " + component);
}
assert.match(components, /:focus-visible/, "visible keyboard focus is required");
assert.ok(components.includes('.in-tabs [role="tab"]:focus-visible{outline:3px solid var(--in-focus-ring)'), "tab controls must expose a visible keyboard focus indicator");
assert.match(components, /\.in-textarea:focus-visible/, "textarea keyboard focus must be visible");
assert.match(components, /\.in-radio:focus-visible/, "radio keyboard focus must be visible");
assert.match(components, /\.in-checkbox:focus-visible/, "standalone checkbox keyboard focus must be visible");
assert.match(components, /\.in-button--danger\{background:var\(--in-status-danger-bg\);color:var\(--in-status-danger\)/, "danger button text must use the theme-verified status contrast pair");
assert.match(components, /in-nav-link:focus-visible/, "navigation focus must be visible");
assert.match(components, /aria-busy="true"/, "button loading state must be styled");
assert.match(components, /in-dialog::backdrop/, "dialog backdrop primitive is required");
assert.match(components, /prefers-reduced-motion:reduce/, "reduced-motion support is required");
assert.match(components, /forced-colors:active/, "forced-colors support is required");
for (const theme of ["light","dark","midnight","sepia","imperial","cosmic"]) {
  assert.ok(components.includes('html[data-high-contrast="true"][data-theme="'+theme+'"]') || (theme==="light" && components.includes('html[data-high-contrast="true"][data-theme="light"]')) || (theme==="sepia" && components.includes('html[data-high-contrast="true"][data-theme="sepia"]')), "high-contrast semantic overrides must cover theme: "+theme);
}
assert.ok(components.includes("--in-text-secondary:var(--in-text-primary)") && components.includes("--in-border-default:#8799A3") && components.includes("--in-border-default:#68757D"), "high-contrast mode must strengthen semantic text, borders and focus in light and dark theme families");
assert.ok(components.includes(".in-button--sm{min-height:var(--in-touch-target)"), "small button variant must preserve the 44px target");
const checkRow = components.slice(components.indexOf(".in-check-row{"), components.indexOf(".in-check-row{") + 220);
assert.ok(checkRow.includes("min-height:var(--in-touch-target)"), "checkbox/radio row must preserve the 44px target");
const primitiveTokenReferences = [...components.matchAll(/var\((--in-[a-z0-9-]+)/g)].map(match => match[1]);
const definedTokenNames = new Set([...tokens.matchAll(/(--in-[a-z0-9-]+)\s*:/g)].map(match => match[1]));
for (const token of new Set(primitiveTokenReferences)) {
  assert.ok(definedTokenNames.has(token), "component stylesheet references an undefined design token: " + token);
}
const releaseCss = releaseStylesheets.join("\n") + "\n" + components;
const releaseTokenReferences = [...releaseCss.matchAll(/var\((--in-[a-z0-9-]+)/g)].map(match => match[1]);
const releaseDefinedTokenNames = new Set([
  ...definedTokenNames,
  ...[...releaseCss.matchAll(/(--in-[a-z0-9-]+)\s*:/g)].map(match => match[1])
]);
for (const token of new Set(releaseTokenReferences)) {
  assert.ok(releaseDefinedTokenNames.has(token), "loaded release stylesheet references an undefined semantic token: " + token);
}
assert.match(tokens, /prefers-reduced-motion:reduce/, "token motion fallback is required");
assert.ok(spec.includes("WCAG 2.2 AA"), "accessibility target missing from specification");
assert.ok(spec.includes("RTL"), "RTL guidance missing from specification");
assert.ok(usage.includes("Dialog behavior must be implemented") && usage.includes("server must enforce"), "component usage guide must document behavior and security boundaries");
assert.ok(routeMap.includes("33 explicit static route entries") && routeMap.includes("/read/:id/:chapter") && routeMap.includes("No route family is declared fully migrated"), "route migration map must inventory templates and preserve honest migration status");
assert.ok(spec.includes("primitives are opt-in") || spec.includes("Do not bulk-replace legacy selectors"), "rollout boundary must be documented");
assert.ok(html.includes('href="/imperial-design-tokens.css"'), "semantic tokens must be loaded by the application shell");
assert.ok(html.includes('href="/imperial-ui-primitives.css"'), "component primitives must be loaded by the application shell");
assert.ok(html.includes('href="/imperial-glass.css"'), "glass foundation stylesheet must be loaded by the application shell");
assert.ok(worker.includes("'/imperial-design-tokens.css'") && worker.includes("'/imperial-ui-primitives.css'") && worker.includes("'/imperial-glass.css'"), "Worker must register semantic tokens, component primitives and glass foundation for every HTML template");
assert.ok(app.includes("const IMPERIAL_THEMES=['light','dark','midnight','sepia','imperial','cosmic']"), "shared shell must expose all six supported themes");
assert.ok(app.includes('document.documentElement.dir=(c==="ur"||c==="ar"||c==="fa")?"rtl":"ltr"'), "Urdu, Arabic and Persian interface locales must set RTL document direction");
assert.ok(components.includes('[dir="rtl"] .in-switch:checked::after{transform:translateX(-1.25rem)}'), "shared switch thumb must mirror its checked position in RTL layouts");
assert.doesNotMatch(components, /(?:^|[;{])\s*(?:margin|padding|inset|border)-(?:left|right)\s*:/m, "shared component primitives must use logical directional properties");
assert.doesNotMatch(components, /(?:^|[;{])\s*(?:left|right)\s*:/m, "shared component primitives must not hard-code physical positioning");
assert.ok(components.includes('[dir="rtl"] .chapterDrawer{inset-inline-start:0;border-inline-start:1px solid'), "chapter drawer must mirror to the inline-start edge using logical properties");
assert.ok(components.includes('[dir="rtl"] .side a:hover,[dir="rtl"] .side a.active{border-inline-start:2px solid'), "active side navigation indicator must mirror using logical borders");
assert.ok(releaseStylesheets[0].includes(".tooltip[data-tooltip]:hover:after,[data-tooltip]:focus-visible:after{content:attr(data-tooltip);position:absolute;z-index:100;bottom:calc(100% + 8px);inset-inline-start:50%;transform:translateX(-50%)"), "tooltip centering anchor must use a logical inline start");
assert.ok(releaseStylesheets[0].includes(".heroSigil{position:absolute;inset-inline-end:10%;"), "homepage celestial sigil must mirror with writing direction");
assert.ok(releaseStylesheets[0].includes(".heroOrbit{position:absolute;inset-inline-end:6%;"), "homepage orbit must mirror with writing direction");
assert.ok(releaseStylesheets[0].includes(".heroCornerMark{position:absolute;inset-inline-end:24px;"), "homepage hero corner mark must follow writing direction");
assert.ok(releaseStylesheets[0].includes(".nextHeroGlow{position:absolute;z-index:-1;inset-inline-end:25%;"), "next homepage hero glow must follow writing direction");
assert.ok(releaseStylesheets[2].includes("inset-inline-end:-7%;top:50%;transform:translateY(-50%)"), "dark archive hero celestial ring must mirror with writing direction");
assert.ok(releaseStylesheets[2].includes("inset-inline-end:calc(clamp(250px,38vw,500px)*.43);top:50%"), "dark archive hero inner ornament must mirror with writing direction");
assert.ok(releaseStylesheets[2].includes("width:210px;inset-inline-end:-95px;top:20%") && releaseStylesheets[2].includes("width:74px;inset-inline-end:36px;top:25%"), "dark archive hero mobile ornaments must preserve responsive logical anchoring");

assert.ok(releaseStylesheets[0].includes(".chapterDrawer{position:fixed;z-index:40;inset-inline-end:0;inset-block:0;"), "reader chapter drawer must anchor to the logical end edge");
assert.ok(releaseStylesheets[0].includes("border-inline-start:1px solid var(--line);box-shadow:0 12px 40px"), "reader chapter drawer divider must follow writing direction");

assert.ok(releaseStylesheets[0].includes(".homePage .consoleStatus{margin-inline-start:auto;") && releaseStylesheets[0].includes(".homePage .consoleStatus i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#72d6b2;margin-inline-end:5px}"), "homepage console status and indicator spacing must follow writing direction");
assert.ok(releaseStylesheets[0].includes(".liveBadge{margin-inline-start:auto;"), "live status badge alignment must follow writing direction");
assert.ok(releaseStylesheets[0].includes(".trendDataTag i{display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;margin-inline-end:6px}"), "Trend Factory data indicator spacing must follow writing direction");
assert.ok(releaseStylesheets[0].includes(".navright{margin-inline-start:auto;"), "mobile navigation action group must align to logical end");
assert.ok(releaseStylesheets[0].includes(".nextReaderPromise>a{margin-inline-start:52px}"), "mobile reader promise link indentation must follow writing direction");
assert.ok(!/(?:^|[;{])\s*(?:left|right|margin-left|margin-right|padding-left|padding-right|border-left|border-right)(?:-[a-z]+)?\s*:/im.test(releaseStylesheets[0]), "main stylesheet must not reintroduce physical horizontal positioning or spacing properties");

const physicalDirectionDeclaration = /(?:^|[;{])\s*(?:(?:left|right|margin-left|margin-right|padding-left|padding-right|inset-left|inset-right|border-left(?:-[a-z]+)?|border-right(?:-[a-z]+)?)\s*:|(?:float|clear)\s*:\s*(?:left|right)\b|text-align\s*:\s*(?:left|right)\b)/im;
for (const [templateName, templateSource] of standaloneDirectionTemplates) {
  assert.ok(!physicalDirectionDeclaration.test(templateSource), templateName + " must use direction-aware logical CSS in standalone template styles");
}

for (const [stylesheetIndex, stylesheetSource] of [...releaseStylesheets, tokens, components].entries()) {
  assert.ok(!physicalDirectionDeclaration.test(stylesheetSource), "registered stylesheet " + stylesheetIndex + " must not reintroduce physical direction declarations");
}

assert.ok(releaseStylesheets[0].includes(".randomCard{display:grid;grid-template-columns:180px 1fr;gap:24px;text-align:start;"), "random discovery card copy must follow writing direction");
assert.ok(releaseStylesheets[0].includes(".settingRow output{min-width:48px;text-align:end;"), "settings value output must align to logical end");
assert.ok(releaseStylesheets[0].includes(".readerBook{text-align:start}"), "mobile reader title alignment must follow writing direction");
assert.ok(releaseStylesheets[0].includes(".settingsPanel .settingRow output{min-width:42px;text-align:end;"), "advanced settings value output must align to logical end");
assert.ok(releaseStylesheets[3].includes(".formatExperience{display:flex;align-items:center;gap:6px;max-width:48%;font-size:10px;line-height:1.3;text-align:end;"), "format experience metadata must align to logical end");

assert.ok(releaseStylesheets[0].includes(".side a:hover,.side a.active{background:linear-gradient(90deg,rgba(117,48,255,.18),rgba(242,216,137,.05));color:#fff;border-inline-start:2px solid"), "active side navigation indicator must use a logical border");
assert.ok(releaseStylesheets[0].includes(".menuDrawer{position:fixed;z-index:9999;inset-block:0;inset-inline-start:0;inset-inline-end:auto;"), "menu drawer must anchor to the logical start edge");
assert.ok(releaseStylesheets[0].includes('[dir="rtl"] .menuDrawer{transform:translateX(105%)}[dir="rtl"] .menuDrawer.is-open{transform:translateX(0)}'), "RTL menu drawer must enter from the right and retain its open state");
assert.ok(releaseStylesheets[0].includes(".menuDrawer .imperialIcon{margin-inline-end:10px;"), "menu drawer icon spacing must follow writing direction");
assert.ok(releaseStylesheets[0].includes(".legalSection ul{padding-inline-start:22px}"), "legal list indentation must follow writing direction");
assert.ok(releaseStylesheets[0].includes(".legalNotice{padding:13px 15px;border-inline-start:3px solid"), "legal notice accent must follow writing direction");
assert.ok(releaseStylesheets[0].includes(".activeFiltersLabel{font-size:10px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-inline-end:3px}"), "active filter label spacing must follow writing direction");
assert.ok(releaseStylesheets[0].includes(".trendFactoryNote{display:flex;gap:12px;align-items:flex-start;padding:15px 17px;margin-top:16px;border-inline-start:2px solid"), "Trend Factory note accent must follow writing direction");

assert.ok(releaseStylesheets[0].includes(".mobileNav{display:flex;position:fixed;bottom:0;inset-inline:0;"), "mobile navigation must span the viewport using logical inline insets");
assert.ok(releaseStylesheets[0].includes(".catalogMeta b{margin-inline-end:auto;"), "catalog metadata alignment must follow writing direction");
assert.ok(releaseStylesheets[0].includes(".statusBadge{position:absolute;inset-inline-start:9px;"), "catalog status badge must anchor to the inline start edge");
assert.ok(releaseStylesheets[0].includes(".readerLock .secondary{display:inline-flex;margin-inline-start:7px}"), "reader lock action spacing must follow writing direction");
assert.ok(!/\\.mobileNav\\{[^}]*\\bleft\s*:|\\.mobileNav\\{[^}]*\\bright\s*:/.test(releaseStylesheets[0]), "mobile navigation must not regress to physical viewport edges");
assert.ok(!/\\.catalogMeta b\\{[^}]*margin-right\s*:|\\.statusBadge\\{[^}]*left\s*:|\\.readerLock \\.secondary\\{[^}]*margin-left\s*:/.test(releaseStylesheets[0]), "shared catalog and reader alignment must not regress to physical left/right declarations");

assert.ok(releaseStylesheets[1].includes(".commentReply{margin-inline-start:28px}") && !components.includes(".commentReply{"), "community reply indentation must follow writing direction without a physical RTL override");
assert.ok(components.includes('[dir="rtl"] .legalSection ul{padding-inline-start:22px}'), "legal list indentation must mirror using logical padding");
assert.ok(components.includes('[dir="rtl"] .formatExperience{text-align:start}'), "format experience alignment must follow RTL writing direction");


assert.ok(app.includes('id="imperialThemeSelect"') && app.includes("applyImperialTheme(event.target.value)"), "shared theme selector must be operable and update the root theme");
assert.ok(app.includes("</footer>`);applyImperialTheme(document.documentElement.dataset.theme)}"), "shared shell must synchronize the saved theme into the selector after it mounts");
assert.ok(app.includes('id="setSiteTheme"><option value="light">Light</option><option value="dark">Dark</option><option value="midnight">Midnight</option><option value="sepia">Sepia</option><option value="imperial">Imperial</option><option value="cosmic">Cosmic</option>'), "Settings must expose the complete six-theme global palette");
assert.ok(app.includes("IMPERIAL_THEMES.includes(document.documentElement.dataset.theme)") && app.includes("applyImperialTheme($('#setSiteTheme').value)"), "Settings must initialize and persist the validated global theme through the shared theme controller");
assert.ok(app.includes("function initImperialAccessibilityPreferences()") && app.includes("values.reduced==='true'") && app.includes("values.contrast==='true'") && app.includes("values.compact==='true'") && app.includes("initImperialAccessibilityPreferences();"), "Saved motion, contrast and compact-card preferences must be restored globally on every route");
assert.ok(worker.includes('["light","dark","midnight","sepia","imperial","cosmic"].includes(t)?t:"light"'), "Worker theme bootstrap must preserve all six themes before hydration");
assert.ok(worker.includes('["en","ur","hi","zh-CN","zh-TW","ja","id","fr","ko","pt-BR","ar","es","vi","fa"].includes(l)?l:"en"'), "Worker must restore only supported interface locales before template paint");
assert.ok(worker.includes('document.documentElement.lang=q;document.documentElement.dir=["ur","ar","fa"].includes(q)?"rtl":"ltr"'), "Worker must restore saved document language and RTL direction before standalone templates render");
assert.ok(app.includes('<option value="zh-CN">简体中文</option><option value="zh-TW">繁體中文</option>') && app.includes('<option value="pt-BR">PT-BR</option>'), "language selector must retain its Chinese and Portuguese locale choices");
assert.ok(components.includes(".themePicker:focus-visible") && components.includes(".themePicker{"), "theme selector must have a visible keyboard focus state and shared styling");
assert.ok(tokens.includes("--bg:var(--in-bg-canvas)") && tokens.includes("--panel:var(--in-bg-surface)") && tokens.includes("--text:var(--in-text-primary)"), "legacy page tokens must bridge to semantic theme roles");
assert.ok(components.includes("html[data-theme] .top") && components.includes("html[data-theme] .menuDrawer") && components.includes("html[data-theme] .nextHero"), "shared shell and homepage must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .homeFormatShelf") && components.includes("html[data-theme] .nextFeatureTile"), "homepage discovery and feature surfaces must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .catalogTop") && components.includes("html[data-theme] .catalogCard"), "catalog filters and story cards must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .genreCard") && components.includes("html[data-theme] .tagTile"), "genre and tag discovery surfaces must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .formatLink") && components.includes("html[data-theme] #sf input"), "format directory and search controls must consume semantic theme roles");
assert.ok(components.includes("prefers-reduced-motion:reduce") && components.includes("html[data-theme] .catalogGrid a:focus-visible"), "discovery interactions must preserve reduced motion and visible focus");
assert.ok(packageJson.scripts.build.startsWith("node scripts/design-system/test-contract.mjs && "), "design-system contract must run before the platform build");


assert.ok(components.includes("html[data-theme] .novelHero") && components.includes("html[data-theme] .novelInfo h1"), "novel detail surfaces must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .chapter:hover") && components.includes("html[data-theme] .tabs a.active"), "chapter navigation and novel tabs must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .readerPage .readerTool:focus-visible") && components.includes("html[data-theme] .readerPage .readerChapterItem:focus-visible"), "reader controls and chapter drawer must preserve visible keyboard focus");
assert.ok(components.includes("html[data-theme] .readerPage .readerTool{") && components.includes("min-width:var(--in-touch-target)"), "reader tool controls must preserve 44px touch targets");
assert.ok(components.includes("html[data-theme] .readerPage .readerPrefs select") && components.includes("prefers-reduced-motion:reduce"), "reader preferences must retain semantic focus and reduced-motion support");

assert.ok(components.includes("html[data-theme] .accountGrid .accountMenu") && components.includes("html[data-theme] .accountGrid .metric"), "account navigation and profile metrics must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .page .grid > .card") && components.includes("html[data-theme] .page .statline"), "library cards and bookmark/history rows must consume semantic theme roles outside the account dashboard grid");
assert.ok(components.includes("html[data-theme] .accountGrid a:focus-visible") && components.includes("html[data-theme] .accountGrid button:focus-visible"), "account and library actions must preserve visible keyboard focus");
assert.ok(components.includes("html[data-theme] .accountGrid .accountMenu a{") && components.includes("min-height:var(--in-touch-target)"), "account navigation targets must meet the 44px touch target");
assert.ok(components.includes("@media(max-width:760px)") && components.includes("html[data-theme] .accountGrid .metricGrid"), "account navigation and profile metrics must adapt to mobile widths");

assert.ok(components.includes("html[data-theme] .settingsGridPro .settingsPanel") && components.includes("html[data-theme] .settingsGridPro .settingRow"), "settings panels and preference rows must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .settingsGridPro select:focus-visible") || components.includes("html[data-theme] .settingsGridPro input:focus-visible"), "settings controls must preserve visible keyboard focus");
assert.ok(components.includes("html[data-theme] .page .chapterList .chapter.unreadNotice"), "unread notification rows must use semantic theme roles");
assert.ok(components.includes("html[data-theme] .page #markRead") && components.includes("min-height:var(--in-touch-target)"), "notification actions must preserve touch targets");

assert.ok(app.includes("authorStudioLayout") && app.includes("authorCreateForm") && app.includes("authorWorksPanel"), "Author Studio source must retain its real creation and works regions");
assert.ok(components.includes("html[data-theme] .page .authorStudioLayout") && components.includes("html[data-theme] .page .authorCreateForm"), "Author Studio layout and creation form must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .page .authorWork") && components.includes("html[data-theme] .page .authorChapterForm"), "author work cards and chapter composer must be theme-aware");
assert.ok(components.includes("html[data-theme] .page .comicAuthorBuilder") && components.includes("html[data-theme] .page .authorStudioLayout input:focus-visible"), "comic composer and keyboard focus must be styled");
assert.ok(components.includes("html[data-theme] .page .authorWorkActions > *") && components.includes("min-height:var(--in-touch-target)"), "author actions must preserve touch targets");

assert.ok(app.includes("communityDiscussions") && app.includes("communityGrid") && app.includes("quickGrid"), "Community renderer must retain its real discovery and discussion regions");

assert.ok(app.includes("function authorPublic()") && app.includes('class="authorHero"') && app.includes('id="authorProfile"'), "public author profile must retain its real identity and published-work regions");

assert.ok(app.includes("async function authPage(mode)") && app.includes('id="auth"') && app.includes('id="authMsg"'), "login and registration must retain their existing authentication form and feedback regions");
assert.ok(components.includes("html[data-theme] #app .form.panel") && components.includes("html[data-theme] #app .form.panel .field input"), "authentication form surfaces and fields must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] #app .form.panel button:focus-visible") && components.includes("html[data-theme] #app .form.panel #authMsg .notice"), "authentication controls and feedback must preserve semantic focus and theme surfaces");
assert.ok(components.includes("html[data-theme] #app .form.panel form button{min-height:var(--in-touch-target)}") && components.includes("@media(max-width:520px)"), "authentication submit controls and form layout must remain usable on narrow mobile screens");
assert.ok(components.includes("html[data-theme] #app #authorProfile") && components.includes("html[data-theme] #app #authorProfile .authorHero"), "public author profile surfaces and identity header must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] #app #authorProfile .authorAvatar") && components.includes("var(--in-action-primary-text)"), "public author identity mark must use the selected theme action palette");
assert.ok(components.includes("html[data-theme] #app #authorProfile a:focus-visible") && components.includes("html[data-theme] #app #authorProfile .notice"), "public author profile links and error states must retain semantic focus and surfaces");
assert.ok(components.includes("@media(max-width:520px)") && components.includes("html[data-theme] #app #authorProfile .authorHero"), "public author identity header must reflow on narrow mobile screens");
assert.ok(components.includes("html[data-theme] .quickCard") && components.includes("html[data-theme] #communityDiscussions"), "Community discovery links and discussion feed must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] #communityGrid .card") && components.includes("html[data-theme] .unlockBanner"), "Community story cards and discovery banner must be theme-aware");
assert.ok(components.includes("html[data-theme] #communityDiscussions a:focus-visible") && components.includes("min-height:var(--in-touch-target)"), "Community navigation must preserve visible focus and touch targets");
assert.ok(components.includes("@media(max-width:760px)") && components.includes("html[data-theme] .quickGrid{grid-template-columns:repeat(2"), "Community quick links must adapt to mobile widths");

assert.ok(app.includes("tfSearch") && app.includes("tfResults") && app.includes("/api/novels?sort=trending"), "Trend Factory must retain its live published-catalog search and result flow");
assert.ok(app.includes("chapter text") && app.includes("rights-first") && app.includes("trendPending"), "Trend Factory must retain its metadata-first rights boundary and disclose the unavailable admin review workspace");
assert.ok(!app.includes('<a href="/admin">Open review center'), "Trend Factory must not send users to an unimplemented admin review route");
assert.ok(components.includes("html[data-theme] .trendFactoryPage .trendFactoryHero") && components.includes("html[data-theme] .trendFactoryPage .trendControls"), "Trend Factory hero and live controls must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .trendFactoryPage .trendResults .card") && components.includes("html[data-theme] .trendFactoryPage .trendSafetyCard"), "Trend Factory results and rights-safety cards must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] .trendFactoryPage input:focus-visible") && components.includes("html[data-theme] .trendFactoryPage .trendPending"), "Trend Factory must preserve visible focus and clearly disclose unavailable admin review");

assert.ok(worker.includes("admin.html") && worker.includes("adminDashboardPage"), "Worker must serve the dedicated noindex Admin template with its page identity");
assert.ok(worker.includes('localStorage.getItem("imperial_reduced_motion")') && worker.includes('localStorage.getItem("imperial_high_contrast")') && worker.includes('localStorage.getItem("imperial_compact_cards")') && worker.includes('dataset.reducedMotion') && worker.includes('dataset.highContrast') && worker.includes('dataset.compactCards'), "Worker must restore saved accessibility preferences before standalone pages render");
assert.ok(adminHtml.includes("me.user?.role!=='admin'") && adminHtml.includes("api('/api/me')"), "Admin template must verify the signed-in role before showing its command center");
assert.ok(worker.includes('const admin=u=>u?.role==="admin"?null:json({error:"Administrator access required"},403)'), "Admin API routes must use the server-side administrator role guard");
for (const endpoint of ['if(p==="/api/admin/stats")','if(p==="/api/admin/users"&&m==="GET")','if(p==="/api/admin/publishing"&&m==="GET")','if(p==="/api/admin/connectors"&&m==="GET")']) {
 const pos=worker.indexOf(endpoint);
 assert.ok(pos>=0 && worker.slice(pos,pos+180).includes("admin(u)"), "Admin endpoint must enforce the server-side role guard: "+endpoint);
}
assert.ok(adminHtml.includes(".adminTable th,.adminTable td{text-align:start;"), "Standalone Admin table content must align to the active writing direction");
assert.ok(adminHtml.includes(".mobileAdmin{display:flex;position:fixed;top:8px;inset-inline-end:10px;"), "Standalone Admin mobile action must anchor to the logical inline end in RTL and LTR");
assert.ok(components.includes("html[data-theme] body.adminDashboardPage .adminHero") && components.includes("html[data-theme] body.adminDashboardPage .adminTable"), "Dedicated Admin hero and tables must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] body.adminDashboardPage .adminNav button") && components.includes("html[data-theme] body.adminDashboardPage button:focus-visible"), "Admin navigation must preserve touch targets and visible keyboard focus");
assert.ok(components.includes("html[data-theme] body.adminDashboardPage .adminForm input") && components.includes("prefers-reduced-motion:reduce"), "Admin forms and motion must follow the semantic theme and accessibility contract");

assert.equal(app, versionedApp, "the versioned public browser bundle must stay synchronized with the editable application source");

assert.ok(worker.includes('if(file==="community-taxonomy.html")text=text.replace("<body>",\'<body class="taxonomyPage">\')'), "Worker must mark the standalone Community Taxonomy template for semantic theme styling");
assert.ok(taxonomyHtml.includes('id="taxonomy-form"') && taxonomyHtml.includes('fetch("/api/taxonomy"'), "Community Taxonomy form and submission API must remain intact");
assert.ok(components.includes("html[data-theme] body.taxonomyPage .tax-card") && components.includes("html[data-theme] body.taxonomyPage .tax-field input"), "Community Taxonomy panels and fields must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] body.taxonomyPage .tax-submit") && components.includes("html[data-theme] body.taxonomyPage .tax-links a:focus-visible"), "Community Taxonomy actions must preserve touch targets and visible focus");

assert.ok(authorHtml.includes('class="wrap"') && authorHtml.includes('id="createForm"') && authorHtml.includes('id="aiCreateForm"'), "Standalone Author Studio must retain its real chapter and AI project workspaces");
assert.ok(worker.includes('if(file==="author.html")text=text.replace("<body>",\'<body class="authorStudioPage">\')'), "Worker must mark the standalone Author Studio document for shared theme adoption");
assert.ok(components.includes("html[data-theme] body.authorStudioPage .card") && components.includes("html[data-theme] body.authorStudioPage input"), "Standalone Author Studio cards and form controls must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] body.authorStudioPage button:focus-visible") && components.includes("body.authorStudioPage .grid{grid-template-columns:minmax(0,1fr)}"), "Standalone Author Studio must preserve visible focus and narrow-screen layout");

for (const token of ['if(kind===\'leaderboard\')','if(kind===\'tier-list\')','if(kind===\'random\')','if(kind===\'vote\')','async function tickets()','async function requests()','async function omni()']) {
 assert.ok(app.includes(token), "Expected existing reader utility route renderer: "+token);
}
assert.ok(app.includes('class="rankBadge"') && app.includes('class="tierPanel"') && app.includes('class="randomCard"'), "Ranking, tier and random discovery must retain their actual route components");
assert.ok(app.includes("voteRow") && app.includes('id="req"') && app.includes('id="omni"'), "Voting, request and OmniPortal controls must retain their actual route components");
assert.ok(components.includes("html[data-theme] #app .rankBadge") && components.includes("html[data-theme] #app .tierPanel") && components.includes("html[data-theme] #app .randomCard"), "Ranking, tier and random discovery must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] #app .voteRow") && components.includes("html[data-theme] #app #req input") && components.includes("html[data-theme] #app #omni input"), "Voting, request and OmniPortal controls must consume semantic theme roles");
assert.ok(components.includes("html[data-theme] #app .period:focus-visible") && components.includes("html[data-theme] #app .randomCard{grid-template-columns:minmax(0,1fr)}"), "Utility routes must retain keyboard focus and small-screen layouts");

for (const [name, page] of [["privacy", privacyHtml], ["terms", termsHtml], ["copyright", copyrightHtml]]) {
 assert.ok(page.includes('class="legalPage"') && page.includes('class="legalHero"') && page.includes('class="legalContent"'), name+" must retain its standalone legal document structure");
}
assert.ok(components.includes("html[data-theme] body.legalPage .legalHero") && components.includes("html[data-theme] body.legalPage .legalSection"), "Standalone legal documents must consume semantic theme surfaces");
assert.ok(components.includes("html[data-theme] body.legalPage a:focus-visible") && components.includes("body.legalPage .legalSection{padding:16px}"), "Legal documents must preserve visible keyboard focus and mobile reading layout");
assert.ok(worker.includes('"\/privacy":"privacy.html"') && worker.includes('"\/terms":"terms.html"') && worker.includes('"\/copyright":"copyright.html"'), "Worker must continue routing the three legal documents");

assert.ok(app.includes("['#setSiteTheme','#setReaderTheme'].forEach(s=>$(s)?.addEventListener('change',save))"), "Theme preference selects must save reliably on change as well as input");
assert.ok(app.includes("['imperial_theme','imperial_reader_theme','readerSize','imperial_font_size','imperial_reader_line_height','imperial_line_height','imperial_reader_width','imperial_reduced_motion','imperial_high_contrast','imperial_compact_cards'].forEach(k=>localStorage.removeItem(k))"), "Reset preferences must clear only the documented appearance and reading preference keys");
assert.ok(app.includes("/^(readerProgress:|readerProgressChapter:|readerBookmark:)/.test(k)"), "Clearing local reading helpers must remain scoped to local progress and bookmark keys");
assert.ok(app.includes("$('#exportPrefs').onclick=()=>") && app.includes("imperial-novel-preferences.json") && app.includes("Object.fromEntries(keys.filter(k=>localStorage.getItem(k)!==null)"), "Preference export must produce a portable JSON file containing only present preference keys");
assert.ok(app.includes("$('#resetPrefs').onclick=()=>") && app.includes("if(!confirm('Reset appearance and reader preferences on this device?'))return") && app.includes("location.reload()"), "Preference reset must require confirmation and reinitialize defaults after clearing preferences");
assert.ok(app.includes("$('#clearLocalReading').onclick=()=>") && app.includes("if(!confirm('Clear local reading progress and bookmark helpers? Server account data will not be deleted.'))return"), "Local reading cleanup must explain its scope and require confirmation");

assert.ok(releaseStylesheets[1].includes(".commentReply{margin-inline-start:28px}") && releaseStylesheets[1].includes(".commentReply{margin-inline-start:12px}"), "Community reply indentation must follow the active writing direction at desktop and mobile widths");
assert.ok(!/\\.commentReply\\{[^}]*margin-left\s*:/.test(releaseStylesheets[1]), "Community reply indentation must not regress to a physical left margin");
assert.ok(releaseStylesheets[3].includes(".homeFormatArrow{margin-inline-start:auto;"), "Home format shelf arrow must follow the active writing direction");
assert.ok(!/\\.homeFormatArrow\\{[^}]*margin-left\s*:/.test(releaseStylesheets[3]), "Home format shelf arrow must not regress to a physical left margin");

assert.ok(app.includes('aria-label="Decrease reading text size"') && app.includes('aria-label="Increase reading text size"'), "Reader font controls must expose descriptive accessible names");
assert.ok(app.includes('aria-controls="chapterDrawer"') && app.includes('aria-label="Open chapter list"') && app.includes('aria-label="Close chapter list"'), "Reader chapter drawer controls must expose their relationship and accessible names");
assert.ok(releaseStylesheets[0].includes("@media(max-width:420px){") && releaseStylesheets[0].includes(".readerTools .readerTool{min-width:44px!important;min-height:44px!important;height:44px!important;"), "Reader toolbar controls must preserve 44px touch targets at narrow mobile widths");
assert.ok(releaseStylesheets[0].includes(".readerBarInner{height:auto!important;min-height:60px;flex-wrap:wrap;") && releaseStylesheets[0].includes(".readerActions{flex-wrap:wrap}"), "Reader toolbar and chapter actions must reflow instead of compressing at narrow widths");
assert.ok(releaseStylesheets[4].includes(".comicPageNav .readerTool{min-width:44px;min-height:44px}") && releaseStylesheets[4].includes(".comicReaderControls .secondary"), "Comic reader navigation must preserve 44px touch targets");
console.log("Imperial Novel design-system contract passed: six themes, body/secondary/muted and reader contrast, action/status pairs, semantic tokens, component primitives, 44px targets, focus, reduced motion, forced colors, RTL, route adoption and runtime asset registration.");
