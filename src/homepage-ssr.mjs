function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function coverSource(value) {
  const source = String(value ?? "").trim();
  if (source.startsWith("/") && !source.startsWith("//") && !source.includes(String.fromCharCode(92))) return source;
  try {
    const url = new URL(source);
    return url.protocol === "https:" ? url.href : "/story-cover-placeholder.svg";
  } catch {
    return "/story-cover-placeholder.svg";
  }
}

function storyCard(story) {
  const id = Number(story.id);
  if (!Number.isSafeInteger(id) || id < 1) return "";
  const title = escapeHtml(story.title || "Untitled story");
  const author = escapeHtml(story.author || "Unknown author");
  const chapters = Math.max(0, Number(story.chapter_count) || 0);
  const cover = escapeHtml(coverSource(story.cover_url));
  return `<a class="card" href="/novel/${id}"><div class="cover"><img src="${cover}" alt="${title} cover" loading="lazy" decoding="async"></div><div class="cardBody"><div class="cardTitle">${title}</div><div class="muted">${author}</div><div class="meta"><span>◷ ${chapters} chapters</span></div></div></a>`;
}

function shelf(title, description, link, label, rows, emptyText, id) {
  const cards = rows.map(storyCard).filter(Boolean).join("");
  return `<section class="section nextShelf"><div class="sectionHead"><div><div class="eyebrow"><span class="eyebrowDot"></span> ${label}</div><h2>${title}</h2><p>${description}</p></div><a class="ghost" href="${link}">Explore all <span>↗</span></a></div><div id="${id}" class="grid homeStoryGrid ${rows.length === 1 ? "singleStory" : rows.length > 1 ? "multiStory" : ""}" aria-live="polite">${cards || `<div class="empty homeCatalogEmpty in-grid-span-all">${emptyText}</div>`}</div></section>`;
}

export function renderHomepage(trending = [], latest = []) {
  const trendIds = new Set(trending.map(row => String(row.id)));
  const distinctLatest = latest.filter(row => !trendIds.has(String(row.id)));
  return `<a class="skipLink" href="#app">Skip to main content</a><header class="top homeSsrHeader"><div class="wrap homeSsrNav"><a class="brand" href="/"><span class="brandText"><b>IMPERIAL NOVEL</b><small>Read • Create • Conquer</small></span></a><nav aria-label="Main navigation"><a href="/catalog">Discover</a><a href="/formats">Formats</a><a href="/genres">Genres</a><a href="/community">Community</a><a href="/author">Create</a><a href="/account">Account</a></nav></div></header><main id="app" class="appBootRoot" tabindex="-1"><div class="page homePage" data-home-ssr="true"><div class="wrap">
    <section class="hero nextHero imperialArchiveHero"><div class="nextHeroGlow" aria-hidden="true"></div><div class="nextHeroCopy">
      <p class="eyebrow">WELCOME TO IMPERIAL NOVEL</p><h1>Open a world.<br><span>Shape an empire.</span></h1>
      <p class="nextHeroLead">Discover stories worth staying up for, then create the worlds only you can imagine.</p>
      <form class="heroSearch" action="/search" method="get" role="search"><span aria-hidden="true">⌕</span><input name="q" type="search" placeholder="Search titles, tropes, worlds..." aria-label="Search novels, genres and authors"><button type="submit">Find your story <span aria-hidden="true">↗</span></button></form>
      <div class="heroTags"><a href="/genres?genre=Fantasy">Fantasy</a><a href="/genres?genre=Progression">Progression</a><a href="/genres?genre=Romance">Romance</a><a href="/genres?genre=Isekai">Isekai</a></div>
      <div class="heroPromise">Read • Create • Conquer <span class="promiseText">Original. Authorized. Reader-first.</span></div>
    </div></section>
    <section class="homeFormatShelf" aria-labelledby="homeFormatTitle"><div class="homeFormatHeading"><div><div class="eyebrow"><span class="eyebrowDot"></span> ONE LIBRARY · MANY WAYS TO TELL A STORY</div><h2 id="homeFormatTitle">Start with the kind of story <span>you love.</span></h2><p>Novels and fanfiction are at the heart of Imperial Novel. Explore other formats whenever you're ready.</p></div><a class="ghost" href="/formats">All formats <span>↗</span></a></div>
      <div class="homeFormatGrid"><a class="homeFormatCard homeFormatPrimary" href="/format/original"><span class="homeFormatGlyph" aria-hidden="true">▤</span><span class="homeFormatCopy"><b>Original novels</b><small>Build a world from page one.</small></span><span class="homeFormatArrow" aria-hidden="true">↗</span></a>
      <a class="homeFormatCard homeFormatPrimary" href="/format/fanfiction"><span class="homeFormatGlyph" aria-hidden="true">✧</span><span class="homeFormatCopy"><b>Fanfiction</b><small>Return to worlds you love.</small></span><span class="homeFormatArrow" aria-hidden="true">↗</span></a>
      <a class="homeFormatCard" href="/format/light_novel"><span class="homeFormatGlyph" aria-hidden="true">文</span><span class="homeFormatCopy"><b>Light novels</b><small>Illustrated, serialized adventures.</small></span><span class="homeFormatArrow" aria-hidden="true">↗</span></a>
      <a class="homeFormatCard" href="/format/web_novel"><span class="homeFormatGlyph" aria-hidden="true">⌘</span><span class="homeFormatCopy"><b>Web novels</b><small>Follow the next chapter.</small></span><span class="homeFormatArrow" aria-hidden="true">↗</span></a>
      <a class="homeFormatCard" href="/format/manga"><span class="homeFormatGlyph" aria-hidden="true">▧</span><span class="homeFormatCopy"><b>Manga & comics</b><small>Stories told in panels.</small></span><span class="homeFormatArrow" aria-hidden="true">↗</span></a>
      <a class="homeFormatCard" href="/format/manhwa"><span class="homeFormatGlyph" aria-hidden="true">▥</span><span class="homeFormatCopy"><b>Manhwa & webtoons</b><small>Scroll into another world.</small></span><span class="homeFormatArrow" aria-hidden="true">↗</span></a></div></section>
    ${shelf("Stories with momentum.", "Real published stories from the Imperial catalog. No made-up counters, no filler.", "/catalog?sort=trending", "THE CURRENT ROTATION", trending, "The catalog is growing. Be among the first to discover what comes next.", "trend")}
    <section class="nextFeatureDeck"><div class="nextFeatureIntro"><div class="eyebrow">NOT JUST ANOTHER READER</div><h2>Read the lore.<br><span>Build the universe.</span></h2><p>A creative ecosystem built around the stories you love and the worlds you want to make.</p><a class="featureInlineLink" href="/author">Meet your Creator Studio ↗</a></div>
      <a class="nextFeatureTile featureTrend" href="/trend-factory"><span class="featureMeta">01 / DISCOVER</span><b>Trend Factory</b><p>Explore story metadata and find creators worth inviting. Rights review stays in control.</p></a>
      <a class="nextFeatureTile featureForge" href="/author"><span class="featureMeta">02 / CREATE</span><b>World Forge</b><p>Shape your premise, build a story bible and draft chapters in a focused studio.</p></a>
      <a class="nextFeatureTile featureCommunity" href="/community"><span class="featureMeta">03 / BELONG</span><b>Reader Constellation</b><p>Find your people, trade theories and make a fandom feel alive.</p></a>
      <a class="nextFeatureTile featurePortal" href="/omniportal"><span class="featureMeta">04 / CONNECT</span><b>OmniPortal</b><p>A rights-first gateway for approved sources and future partnerships.</p></a></section>
    ${shelf("New chapters. New reasons to stay.", "Recently updated stories from the live catalog.", "/catalog?sort=updated", "FRESH FROM THE REALM", distinctLatest, "No new updates yet. Explore the catalog and find your first world.", "latest")}
    <section class="nextReaderPromise"><span class="promiseIcon">◈</span><div><b>Clear rules. Your reading, your call.</b><p>Imperial Crowns and chapter unlocks show their real status. Payments remain pending until manually reviewed.</p></div><a href="/tickets">Imperial Crown Vault ↗</a></section>
  </div></div></main><footer class="homeSsrFooter"><div class="wrap"><span>IMPERIAL NOVEL · Read • Create • Conquer</span><nav aria-label="Footer navigation"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/copyright">Copyright</a></nav></div></footer>`;
}

export async function loadHomepageStories(db) {
  const eligible = "n.publication_status='published' AND n.rights_status IN ('original','public_domain','licensed','authorized')";
  const select = "SELECT n.id,n.title,n.author,n.cover_url,n.rating,COUNT(c.id) chapter_count FROM novels n LEFT JOIN chapters c ON c.novel_id=n.id AND c.publication_status='published' WHERE " + eligible;
  const [trending, latest] = await Promise.all([
    db.prepare(select + " GROUP BY n.id ORDER BY (SELECT COUNT(*) FROM unlocks ux JOIN chapters cx ON cx.id=ux.chapter_id WHERE cx.novel_id=n.id AND ux.unlocked_at>=datetime('now','-7 days')) DESC,n.id DESC LIMIT 10").all(),
    db.prepare(select + " GROUP BY n.id ORDER BY n.updated_at DESC,n.id DESC LIMIT 10").all()
  ]);
  return { trending: trending.results || [], latest: latest.results || [] };
}

export function injectHomepageMarkup(documentHtml, homepageMarkup) {
  const source = String(documentHtml ?? "");
  if (!homepageMarkup) return source;
  const appStart = source.indexOf('<main id="app"');
  const appClose = source.indexOf("</main>", appStart);
  if (appStart < 0 || appClose < 0) return source;
  return source.slice(0, appStart) + homepageMarkup + source.slice(appClose + 7);
}
