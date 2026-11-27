// ============================================================================
// GURU JI VISION — AUTOMATIC WOMEN FARMER SCHEME DISCOVERY (PHASE 4)
// ============================================================================
// Ethical, SSRF-safe, allowlist-only discovery of newly published official
// government agriculture & women-farmer announcements from permitted public
// RSS feeds.
//
// POLICY & SAFETY RULES:
// 1. Strict SSRF hostname allowlist — ONLY official permitted RSS endpoints
//    (pib.gov.in, www.fao.org) may ever be fetched.
// 2. NEVER scrapes restricted government portals or invents scheme amounts,
//    deadlines, eligibility rules, or application URLs.
// 3. Discovered candidates are NEVER auto-published; they MUST enter the
//    Firestore Admin Review Queue (/womenSchemeDiscoveryQueue) as PENDING_REVIEW
//    for human Admin verification before publication.
// 4. Clearly reports which West Bengal & Central portals require manual Admin
//    updates when no open official RSS/API feed exists.
// ============================================================================

export const ALLOWED_FEED_HOSTS = new Set(["pib.gov.in", "www.fao.org"]);

export const WOMEN_SCHEME_SOURCE_CAPABILITIES = [
  {
    id: "pib-agri-women-rss",
    name: "PIB — Ministry of Agriculture & Farmers Welfare (Official RSS)",
    url: "https://pib.gov.in/",
    mode: "AUTOMATIC",
    mechanism: "Official Public Government RSS Feed",
    notes: "Discovers new Central agriculture schemes, Namo Drone Didi, FPO, MIDH, KCC, and crop insurance press releases."
  },
  {
    id: "pib-rural-allied-rss",
    name: "PIB — National Press Releases (Rural Development, Fisheries & Livestock Filter)",
    url: "https://pib.gov.in/",
    mode: "AUTOMATIC",
    mechanism: "Official Public Government RSS Feed",
    notes: "Discovers DAY-NRLM, Lakhpati Didi, SHG, PMMSY fisheries, NLM dairy/poultry, and PMFME announcements."
  },
  {
    id: "fao-women-agri-rss",
    name: "FAO Newsroom — Women in Agriculture & Rural Livelihoods (Official RSS)",
    url: "https://www.fao.org/",
    mode: "AUTOMATIC",
    mechanism: "Official Public RSS Feed",
    notes: "Discovers International Year of the Woman Farmer (2026) and FAO women-farmer training publications."
  },
  {
    id: "wb-matirkatha",
    name: "Matir Katha & Krishak Bandhu — Dept. of Agriculture, Govt. of West Bengal",
    url: "https://matirkatha.net/",
    mode: "ADMIN_MANAGED",
    mechanism: "Manual Admin Verification & Direct Official Update",
    notes: "State portals do not provide open scheme RSS/APIs; Admins verify notices directly and update records with verified date."
  },
  {
    id: "wb-anandadhara",
    name: "Anandadhara (WBSRLM) & Bangla Shasya Bima — Govt. of West Bengal",
    url: "https://wbprd.gov.in/",
    mode: "ADMIN_MANAGED",
    mechanism: "Manual Admin Verification",
    notes: "West Bengal SHG, crop insurance, ARD & fisheries circulars require direct Admin verification from official state notifications."
  },
  {
    id: "myscheme-pmfme-nrlm",
    name: "MyScheme, PMFME (MoFPI), PMMSY & DAY-NRLM Official Portals",
    url: "https://www.myscheme.gov.in/",
    mode: "ADMIN_MANAGED",
    mechanism: "Manual Admin Verification",
    notes: "Eligibility rules, subsidy ceilings, and seasonal deadlines are verified directly on official .gov.in portals."
  }
];

const CATEGORY_KEYWORDS = [
  ["WOMEN_FARMER", ["woman", "women", "mahila", "lakhpati", "drone didi", "krishi sakhi", "pashu sakhi", "shg", "self help", "nrlm", "anandadhara"]],
  ["FISHERIES_AQUACULTURE", ["fish", "fisheries", "aquaculture", "pmmsy", "matsya", "pisciculture", "shrimp"]],
  ["POULTRY_FARMING", ["poultry", "duckery", "egg", "broiler", "hatchery"]],
  ["DAIRY_FARMING", ["dairy", "milk", "cattle", "gokul", "npdd", "bovine"]],
  ["LIVESTOCK_DEV", ["livestock", "animal husbandry", "goat", "sheep", "fodder", "veterinary", "nlm"]],
  ["HORTICULTURE", ["horticulture", "midh", "fruit", "vegetable", "floriculture", "orchard", "spice", "mushroom", "nursery"]],
  ["FPO", ["fpo", "farmer producer", "cooperative", "collective"]],
  ["AGRI_ENTREPRENEURSHIP", ["pmfme", "food processing", "entrepreneur", "agribusiness", "startup", "value addition"]],
  ["CROP_INSURANCE", ["fasal bima", "pmfby", "shasya bima", "crop insurance"]],
  ["KCC", ["kisan credit card", "kcc", "interest subvention"]],
  ["FINANCIAL_ASSISTANCE", ["pm-kisan", "krishak bandhu", "dbt", "income support", "subsidy", "financial assistance"]],
  ["ORGANIC_NATURAL", ["organic", "natural farming", "pkvy", "bio-fertilizer", "vermicompost"]],
  ["TRAINING_SKILL", ["training", "kvk", "atma", "workshop", "skill", "capacity building"]]
];

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

export function isAllowedFeedUrl(rawUrl = "") {
  try {
    const parsed = new URL(String(rawUrl));
    return parsed.protocol === "https:" && ALLOWED_FEED_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function stripXmlTags(raw = "") {
  return String(raw)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRssItems(xmlText = "", maxItems = 20) {
  const items = [];
  const matches = String(xmlText || "").matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi);
  for (const m of matches) {
    if (items.length >= maxItems) break;
    const block = m[1] || "";
    const title = stripXmlTags((block.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
    const link = stripXmlTags((block.match(/<link\b[^>]*>([\s\S]*?)<\/link>/i) || [])[1] || "");
    const pubDate = stripXmlTags((block.match(/<pubDate\b[^>]*>([\s\S]*?)<\/pubDate>/i) || [])[1] || "");
    const desc = stripXmlTags((block.match(/<description\b[^>]*>([\s\S]*?)<\/description>/i) || [])[1] || "");
    if (title && /^https?:\/\//i.test(link)) {
      items.push({ title, link, pubDate, desc });
    }
  }
  return items;
}

function parseIsoDate(raw = "") {
  if (!raw) return new Date().toISOString().slice(0, 10);
  const parsed = Date.parse(raw);
  if (Number.isFinite(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  return String(raw).trim().slice(0, 20);
}

export function classifyDiscoveredScheme(text = "") {
  const hay = String(text || "").toLowerCase();
  let suggestedCategory = "OTHER_AGRI";
  for (const [catKey, words] of CATEGORY_KEYWORDS) {
    if (words.some((w) => hay.includes(w))) {
      suggestedCategory = catKey;
      break;
    }
  }
  const isWestBengal = /west bengal|kolkata|krishak bandhu|shasya bima|anandadhara|matir|bengal/i.test(hay);
  const isWomenFocused = /woman|women|mahila|didi|sakhi|shg|self help|female/i.test(hay);
  return {
    suggestedCategory,
    suggestedGovtLevel: isWestBengal ? "STATE" : "CENTRAL",
    suggestedState: isWestBengal ? "West Bengal" : "All India",
    womenRelevanceTag: isWomenFocused ? "WOMEN_FOCUSED" : "WOMEN_ELIGIBLE_GENERAL"
  };
}

function buildDedupeKey(url = "", title = "") {
  const cleanUrl = String(url || "").trim().toLowerCase().replace(/\/+$/, "");
  if (cleanUrl) return cleanUrl.slice(0, 240);
  return String(title || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 160);
}

async function fetchAllowedRss(url, timeoutMs = 9000) {
  if (!isAllowedFeedUrl(url)) {
    throw new Error("Blocked non-allowlisted feed host.");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPibFeed(sourceId, feedUrl, sourceName, relevanceRegex) {
  try {
    const res = await fetchAllowedRss(feedUrl);
    if (!res.ok) return { ok: false, sourceId, items: [], error: `HTTP ${res.status}` };
    const xml = await res.text();
    const rawItems = parseRssItems(xml, 25);
    const matched = rawItems
      .filter((it) => relevanceRegex.test(`${it.title} ${it.desc}`))
      .slice(0, 10)
      .map((it) => {
        const cls = classifyDiscoveredScheme(`${it.title} ${it.desc}`);
        return {
          title: it.title.slice(0, 160),
          sourceName,
          officialSourceUrl: it.link.slice(0, 400),
          publicationDate: parseIsoDate(it.pubDate),
          summary: (it.desc || it.title).slice(0, 500),
          suggestedCategory: cls.suggestedCategory,
          suggestedGovtLevel: cls.suggestedGovtLevel,
          suggestedState: cls.suggestedState,
          womenRelevanceTag: cls.womenRelevanceTag,
          discoveryMethod: "RSS_FEED",
          dedupeKey: buildDedupeKey(it.link, it.title)
        };
      });
    return { ok: true, sourceId, items: matched };
  } catch (err) {
    return { ok: false, sourceId, items: [], error: err?.message || "Feed timeout" };
  }
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  try {
    const reqUrl = new URL(req.url);
    const filterQ = String(reqUrl.searchParams.get("q") || "").trim().toLowerCase();

    const agriSchemeRegex =
      /agri|kisan|krishi|farm|woman|women|mahila|shg|self help|lakhpati|drone didi|fpo|horti|dairy|livestock|poultry|fish|matsya|nrlm|pmfme|bima|credit|scheme|yojana|west bengal/i;
    const faoWomenRegex =
      /woman|women|gender|rural|farmer|agri|smallholder|livestock|fish|horti|food|livelihood/i;

    const [pibAgri, pibNational, faoFeed] = await Promise.all([
      fetchPibFeed(
        "pib-agri-women-rss",
        "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
        "PIB — Ministry of Agriculture & Farmers Welfare (Govt. of India)",
        agriSchemeRegex
      ),
      fetchPibFeed(
        "pib-rural-allied-rss",
        "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=1",
        "PIB — Govt. of India (Rural Development / Fisheries / Livestock)",
        /woman|women|mahila|shg|lakhpati|nrlm|fpo|fisheries|pmmsy|dairy|livestock|poultry|pmfme|kisan|krishi|west bengal/i
      ),
      fetchPibFeed(
        "fao-women-agri-rss",
        "https://www.fao.org/feeds/fao-newsroom-rss",
        "FAO — Food and Agriculture Organization",
        faoWomenRegex
      )
    ]);

    const seen = new Set();
    const discovered = [];
    for (const batch of [pibAgri, pibNational, faoFeed]) {
      for (const item of batch.items || []) {
        if (!item?.dedupeKey || seen.has(item.dedupeKey)) continue;
        if (filterQ) {
          const hay = `${item.title} ${item.summary} ${item.suggestedCategory} ${item.suggestedState}`.toLowerCase();
          if (!hay.includes(filterQ)) continue;
        }
        seen.add(item.dedupeKey);
        discovered.push(item);
      }
    }

    return jsonResponse(200, {
      ok: true,
      fetchedAt: new Date().toISOString(),
      discoveredCount: discovered.length,
      discovered,
      feedStatuses: [
        { sourceId: pibAgri.sourceId, ok: pibAgri.ok, count: pibAgri.items.length, error: pibAgri.error || "" },
        { sourceId: pibNational.sourceId, ok: pibNational.ok, count: pibNational.items.length, error: pibNational.error || "" },
        { sourceId: faoFeed.sourceId, ok: faoFeed.ok, count: faoFeed.items.length, error: faoFeed.error || "" }
      ],
      sourceCapabilities: WOMEN_SCHEME_SOURCE_CAPABILITIES
    });
  } catch (err) {
    return jsonResponse(500, {
      ok: false,
      error: err?.message || "Women Farmer scheme discovery service temporarily unavailable.",
      sourceCapabilities: WOMEN_SCHEME_SOURCE_CAPABILITIES
    });
  }
}
