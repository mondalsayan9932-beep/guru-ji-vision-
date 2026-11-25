// ============================================================================
// GURU JI VISION — AUTOMATIC AGRICULTURE STUDY RESOURCE DISCOVERY (PHASE 7)
// ============================================================================
// Ethical, allowlist-only discovery of newly published official & open-access
// agriculture educational resources.
//
// POLICY & HONESTY RULES:
// 1. NEVER scrapes websites against their terms or access restrictions.
// 2. Queries ONLY officially permitted public RSS/Atom feeds and open APIs:
//    - PIB (Press Information Bureau, Govt. of India — Agriculture RSS)
//    - FAO Newsroom Public RSS Feed
//    - OpenAlex Permitted Public Scholarly API (Open-Access Indian Agri Works)
// 3. Clearly reports which Indian exam/university portals (ICAR, eCourses,
//    KrishiKosh, NTA, IBPS, NABARD, BCKV, UBKV, TNAU, PAU) do NOT provide
//    open automatic feeds and therefore require Admin-Managed updates.
// 4. Deduplicates candidates, classifies subject/topic, and returns items
//    strictly for Admin Review before public publication.
// ============================================================================

export const SOURCE_CAPABILITY_MATRIX = [
  {
    id: "pib-agri-rss",
    name: "PIB — Ministry of Agriculture & Farmers Welfare (Official RSS)",
    url: "https://pib.gov.in/",
    mode: "AUTOMATIC",
    mechanism: "Official Public Government RSS Feed",
    notes: "Automatically discovers new Ministry/ICAR education, fellowship, KVK, and research announcements."
  },
  {
    id: "fao-rss",
    name: "FAO Agriculture & Food Systems Knowledge Feed (Official RSS)",
    url: "https://www.fao.org/",
    mode: "AUTOMATIC",
    mechanism: "Official Public RSS Feed",
    notes: "Automatically discovers open international agronomy, soil, livestock, and crop science briefs."
  },
  {
    id: "openalex-oa-api",
    name: "OpenAlex Open-Access Agricultural Research API (ICAR / SAU Papers)",
    url: "https://openalex.org/",
    mode: "AUTOMATIC",
    mechanism: "Permitted Public REST API (CC0 Metadata, Open-Access Only)",
    notes: "Automatically discovers newly published open-access peer-reviewed agronomy, soil, pathology & genetics papers."
  },
  {
    id: "icar-official",
    name: "ICAR Official Portal & e-Krishi Shiksha (ecourses.icar.gov.in)",
    url: "https://ecourses.icar.gov.in/",
    mode: "ADMIN_MANAGED",
    mechanism: "Manual Admin Verification & Link/PDF Publishing",
    notes: "No open structured RSS/API feed for course PDFs; admins add verified links and official updates."
  },
  {
    id: "krishikosh",
    name: "KrishiKosh Institutional Repository (ICAR)",
    url: "https://krishikosh.egranth.ac.in/",
    mode: "ADMIN_MANAGED",
    mechanism: "Manual Admin Verification & Link Publishing",
    notes: "Repository pages require manual citation verification before linking."
  },
  {
    id: "nta-exams",
    name: "NTA Official Portal (ICAR AIEEA / JRF / CUET-PG Agriculture)",
    url: "https://exams.nta.ac.in/",
    mode: "ADMIN_MANAGED",
    mechanism: "Manual Admin Upload of Official Notifications & PYQ Papers",
    notes: "Exam bulletins & PDFs are published dynamically without public RSS/API; admins verify and publish."
  },
  {
    id: "ibps-nabard",
    name: "IBPS (AFO) & NABARD Official Examination Portals",
    url: "https://www.ibps.in/",
    mode: "ADMIN_MANAGED",
    mechanism: "Manual Admin Verification",
    notes: "Banking/regulatory recruitment portals prohibit automated scraping; admins add verified notifications."
  },
  {
    id: "state-agri-univs",
    name: "State Agricultural Universities (BCKV, UBKV, TNAU, PAU, GBPUAT, PSB)",
    url: "https://www.bckv.edu.in/",
    mode: "ADMIN_MANAGED",
    mechanism: "Manual Admin Official Syllabus & PYQ Upload",
    notes: "Each university publishes its own official syllabus PDFs; admins upload university-specific versions without overwriting."
  }
];

const SUBJECT_KEYWORDS = [
  ["AGRONOMY", ["agronomy", "tillage", "crop production", "weed", "irrigation", "cropping system", "rice", "wheat", "maize", "millets", "pulses"]],
  ["SOIL_SCIENCE", ["soil", "fertilizer", "nutrient", "manure", "compost", "salinity", "biochar", "soil health", "micrometer", "rhizosphere"]],
  ["GENETICS_BREEDING", ["genetics", "breeding", "hybrid", "genome", "variety", "cultivar", "mutation", "heterosis", "biotechnology", "crispr"]],
  ["PLANT_PATHOLOGY", ["pathology", "fungus", "fungal", "blight", "rust", "wilt", "mosaic", "virus", "disease", "pathogen"]],
  ["ENTOMOLOGY", ["entomology", "insect", "pest", "ipm", "biocontrol", "borer", "aphid", "locust", "pollinator", "honeybee"]],
  ["HORTICULTURE", ["horticulture", "fruit", "vegetable", "orchard", "floriculture", "spice", "mango", "banana", "potato", "tomato", "post-harvest"]],
  ["AGRI_ECONOMICS", ["economics", "market", "msp", "mandi", "value chain", "fpo", "credit", "insurance", "farm income", "agribusiness"]],
  ["AGRI_EXTENSION", ["extension", "kvk", "training", "farmer field school", "rural development", "advisory", "communication"]],
  ["SEED_SCIENCE", ["seed", "germination", "certification", "seedling", "breeder seed", "foundation seed"]],
  ["PLANT_PHYSIOLOGY", ["physiology", "photosynthesis", "drought", "stress", "transpiration", "hormone", "growth regulator"]],
  ["AGRI_ENGINEERING", ["engineering", "tractor", "machinery", "drone", "drip", "sprinkler", "watershed", "solar", "precision agriculture"]],
  ["ANIMAL_HUSBANDRY", ["livestock", "dairy", "cattle", "poultry", "goat", "fisheries", "aquaculture", "fodder", "veterinary"]]
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

function stripTags(raw = "") {
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

function classifySubjectAndTopic(text = "") {
  const hay = String(text).toLowerCase();
  for (const [subjectKey, keywords] of SUBJECT_KEYWORDS) {
    const hit = keywords.find((k) => hay.includes(k));
    if (hit) {
      return {
        subjectKey,
        topic: hit.replace(/\b\w/g, (c) => c.toUpperCase())
      };
    }
  }
  return { subjectKey: "OTHER", topic: "General Agriculture Education" };
}

function classifyCategory(text = "", url = "") {
  const hay = `${text} ${url}`.toLowerCase();
  if (hay.includes("syllabus") || hay.includes("curriculum")) return "SYLLABUS";
  if (hay.includes("question paper") || hay.includes("pyq") || hay.includes("exam") || hay.includes("notification") || hay.includes("fellowship")) return "EXAM_NOTIFICATION";
  if (hay.includes("practical") || hay.includes("manual") || hay.includes("handbook")) return "PRACTICAL";
  return "NOTES_PDF";
}

function normalizeDedupeKey(url = "", title = "") {
  const cleanUrl = String(url || "").trim().toLowerCase().replace(/\/+$/, "");
  if (cleanUrl) return cleanUrl.slice(0, 240);
  return String(title || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 140);
}

function parseIsoDate(raw = "") {
  if (!raw) return new Date().toISOString().slice(0, 10);
  const parsed = Date.parse(raw);
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }
  return String(raw).trim().slice(0, 20);
}

function parseRssItems(xmlText = "", maxItems = 12) {
  const items = [];
  const matches = xmlText.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi);
  for (const m of matches) {
    if (items.length >= maxItems) break;
    const block = m[1] || "";
    const title = stripTags((block.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
    const link = stripTags((block.match(/<link\b[^>]*>([\s\S]*?)<\/link>/i) || [])[1] || "");
    const pubDate = stripTags((block.match(/<pubDate\b[^>]*>([\s\S]*?)<\/pubDate>/i) || [])[1] || "");
    const desc = stripTags((block.match(/<description\b[^>]*>([\s\S]*?)<\/description>/i) || [])[1] || "");
    if (title && /^https?:\/\//i.test(link)) {
      items.push({ title, link, pubDate, desc });
    }
  }
  return items;
}

async function fetchWithTimeout(url, headers = {}, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPibAgriFeed() {
  const feedUrl = "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3";
  try {
    const res = await fetchWithTimeout(feedUrl, { Accept: "application/rss+xml, application/xml, text/xml" });
    if (!res.ok) return { ok: false, sourceId: "pib-agri-rss", items: [], error: `HTTP ${res.status}` };
    const xml = await res.text();
    const rawItems = parseRssItems(xml, 15);
    const eduItems = rawItems
      .filter((it) => /agri|icar|crop|soil|kisan|krishi|farm|horti|dairy|fish|seed|university|research|fellowship|kvk|icssr/i.test(`${it.title} ${it.desc}`))
      .slice(0, 8)
      .map((it) => {
        const cls = classifySubjectAndTopic(`${it.title} ${it.desc}`);
        return {
          title: it.title.slice(0, 150),
          sourceWebsite: "Press Information Bureau (Govt. of India)",
          publicationDate: parseIsoDate(it.pubDate),
          subjectKey: cls.subjectKey,
          topic: cls.topic,
          category: classifyCategory(`${it.title} ${it.desc}`, it.link),
          sourceUrl: it.link.slice(0, 400),
          summary: (it.desc || it.title).slice(0, 400),
          discoveryMethod: "RSS_FEED",
          dedupeKey: normalizeDedupeKey(it.link, it.title)
        };
      });
    return { ok: true, sourceId: "pib-agri-rss", items: eduItems };
  } catch (err) {
    return { ok: false, sourceId: "pib-agri-rss", items: [], error: err?.message || "Fetch timeout" };
  }
}

async function fetchFaoRssFeed() {
  const feedUrl = "https://www.fao.org/feeds/fao-newsroom-rss";
  try {
    const res = await fetchWithTimeout(feedUrl, { Accept: "application/rss+xml, application/xml, text/xml" });
    if (!res.ok) return { ok: false, sourceId: "fao-rss", items: [], error: `HTTP ${res.status}` };
    const xml = await res.text();
    const rawItems = parseRssItems(xml, 8);
    const items = rawItems.slice(0, 6).map((it) => {
      const cls = classifySubjectAndTopic(`${it.title} ${it.desc}`);
      return {
        title: it.title.slice(0, 150),
        sourceWebsite: "Food and Agriculture Organization (FAO)",
        publicationDate: parseIsoDate(it.pubDate),
        subjectKey: cls.subjectKey,
        topic: cls.topic,
        category: classifyCategory(`${it.title} ${it.desc}`, it.link),
        sourceUrl: it.link.slice(0, 400),
        summary: (it.desc || it.title).slice(0, 400),
        discoveryMethod: "RSS_FEED",
        dedupeKey: normalizeDedupeKey(it.link, it.title)
      };
    });
    return { ok: true, sourceId: "fao-rss", items };
  } catch (err) {
    return { ok: false, sourceId: "fao-rss", items: [], error: err?.message || "Fetch timeout" };
  }
}

async function fetchOpenAlexAgriPapers(searchQuery = "agriculture agronomy soil science India ICAR") {
  const apiUrl = new URL("https://api.openalex.org/works");
  apiUrl.searchParams.set("search", String(searchQuery || "agriculture agronomy soil science India ICAR").slice(0, 120));
  apiUrl.searchParams.set("filter", "is_oa:true,type:article");
  apiUrl.searchParams.set("sort", "publication_date:desc");
  apiUrl.searchParams.set("per-page", "8");
  apiUrl.searchParams.set("select", "id,display_name,publication_date,primary_location,open_access,topics");

  try {
    const res = await fetchWithTimeout(apiUrl.toString(), {
      Accept: "application/json",
      "User-Agent": "GuruJiVision-EduDiscovery/1.0 (https://guru-ji-vision.netlify.app)"
    });
    if (!res.ok) return { ok: false, sourceId: "openalex-oa-api", items: [], error: `HTTP ${res.status}` };
    const data = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    const items = results
      .map((w) => {
        const title = String(w?.display_name || "").trim();
        const url = w?.open_access?.oa_url || w?.primary_location?.landing_page_url || w?.id || "";
        if (!title || !/^https?:\/\//i.test(url)) return null;
        const sourceName = w?.primary_location?.source?.display_name || "OpenAlex Open-Access Repository";
        const firstTopic = w?.topics?.[0]?.display_name || "";
        const cls = classifySubjectAndTopic(`${title} ${firstTopic}`);
        return {
          title: title.slice(0, 150),
          sourceWebsite: String(sourceName).slice(0, 120),
          publicationDate: parseIsoDate(w?.publication_date),
          subjectKey: cls.subjectKey,
          topic: (firstTopic || cls.topic).slice(0, 120),
          category: "NOTES_PDF",
          sourceUrl: String(url).slice(0, 400),
          summary: `Open-access agricultural research paper (${sourceName}). Review before publishing to students.`,
          discoveryMethod: "PUBLIC_API",
          dedupeKey: normalizeDedupeKey(url, title)
        };
      })
      .filter(Boolean);
    return { ok: true, sourceId: "openalex-oa-api", items };
  } catch (err) {
    return { ok: false, sourceId: "openalex-oa-api", items: [], error: err?.message || "Fetch timeout" };
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
    const topicQuery = (reqUrl.searchParams.get("q") || "").trim();

    const [pibRes, faoRes, openAlexRes] = await Promise.all([
      fetchPibAgriFeed(),
      fetchFaoRssFeed(),
      fetchOpenAlexAgriPapers(topicQuery ? `agriculture ${topicQuery} India` : "agriculture agronomy soil science India ICAR")
    ]);

    // Deduplicate across all feeds by dedupeKey
    const seen = new Set();
    const discovered = [];
    for (const batch of [pibRes, openAlexRes, faoRes]) {
      for (const item of batch.items || []) {
        if (!item?.dedupeKey || seen.has(item.dedupeKey)) continue;
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
        { sourceId: pibRes.sourceId, ok: pibRes.ok, count: pibRes.items.length, error: pibRes.error || "" },
        { sourceId: openAlexRes.sourceId, ok: openAlexRes.ok, count: openAlexRes.items.length, error: openAlexRes.error || "" },
        { sourceId: faoRes.sourceId, ok: faoRes.ok, count: faoRes.items.length, error: faoRes.error || "" }
      ],
      sourceCapabilities: SOURCE_CAPABILITY_MATRIX
    });
  } catch (err) {
    return jsonResponse(500, {
      ok: false,
      error: err?.message || "Discovery service temporarily unavailable.",
      sourceCapabilities: SOURCE_CAPABILITY_MATRIX
    });
  }
}
