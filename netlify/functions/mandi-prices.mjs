// ============================================================================
// Guru Ji Vision — Official Government of India AGMARKNET Mandi Price Proxy
// Queries official data.gov.in resource: 9ef84268-d588-465a-a308-a864a43d0070
// ("Current Daily Price of Various Commodities from Various Markets (Mandi)")
// Features:
//  - Supports pagination (offset + multi-page fetch up to 200 records)
//  - Handles HTTP 429 rate limits, invalid JSON, and network timeouts gracefully
//  - Preserves missing numeric prices as null (NEVER fabricates 0 or fake rates)
// ============================================================================

const AGMARKNET_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
}

function parsePriceOrNull(rawVal) {
  if (rawVal === null || rawVal === undefined || rawVal === "") return null;
  const cleaned = String(rawVal).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) && num > 0 ? num : null;
}

async function fetchAgmarknetPage({ apiKey, state, district, commodity, market, limit, offset }) {
  const apiUrl = new URL(`https://api.data.gov.in/resource/${AGMARKNET_RESOURCE_ID}`);
  apiUrl.searchParams.set("api-key", apiKey);
  apiUrl.searchParams.set("format", "json");
  apiUrl.searchParams.set("limit", String(limit));
  if (offset > 0) apiUrl.searchParams.set("offset", String(offset));
  if (state) apiUrl.searchParams.set("filters[state]", state);
  if (district) apiUrl.searchParams.set("filters[district]", district);
  if (commodity) apiUrl.searchParams.set("filters[commodity]", commodity);
  if (market) apiUrl.searchParams.set("filters[market]", market);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const upstream = await fetch(apiUrl.toString(), {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    if (upstream.status === 429) {
      const err = new Error("AGMARKNET API rate limit reached (HTTP 429). Please wait a moment and try again.");
      err.code = "RATE_LIMIT";
      throw err;
    }
    if (!upstream.ok) {
      throw new Error(`AGMARKNET API responded with HTTP ${upstream.status}`);
    }
    let raw;
    try {
      raw = await upstream.json();
    } catch (_) {
      throw new Error("AGMARKNET API returned invalid JSON response.");
    }
    return {
      rows: Array.isArray(raw?.records) ? raw.records : [],
      total: Number(raw?.total) || 0
    };
  } finally {
    clearTimeout(timer);
  }
}

export default async (req) => {
  if (req.method !== "GET") {
    return jsonResponse(405, { ok: false, configured: false, records: [], error: "Method not allowed." });
  }

  const apiKey = process.env.DATA_GOV_API_KEY || "";
  if (!apiKey) {
    return jsonResponse(200, {
      ok: false,
      configured: false,
      records: [],
      sourceName: "AGMARKNET (data.gov.in — Govt. of India)",
      error: "Live AGMARKNET API key (DATA_GOV_API_KEY) is not configured in Netlify Environment Variables yet. Static India State/District/Mandi directory and verified MSP remain available."
    });
  }

  try {
    const url = new URL(req.url);
    const state = (url.searchParams.get("state") || "").trim();
    const district = (url.searchParams.get("district") || "").trim();
    const commodity = (url.searchParams.get("commodity") || "").trim();
    const market = (url.searchParams.get("market") || "").trim();
    const requestedLimit = Math.min(200, Math.max(10, parseInt(url.searchParams.get("limit") || "100", 10) || 100));
    const startOffset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10) || 0);

    // Fetch up to 2 pages of 100 records to support larger districts/states cleanly
    const pageSize = Math.min(100, requestedLimit);
    const firstPage = await fetchAgmarknetPage({
      apiKey,
      state,
      district,
      commodity,
      market,
      limit: pageSize,
      offset: startOffset
    });

    let allRows = [...firstPage.rows];
    const totalAvailable = firstPage.total || allRows.length;

    if (requestedLimit > 100 && allRows.length === 100 && totalAvailable > startOffset + 100) {
      try {
        const secondPage = await fetchAgmarknetPage({
          apiKey,
          state,
          district,
          commodity,
          market,
          limit: Math.min(100, requestedLimit - 100),
          offset: startOffset + 100
        });
        allRows = allRows.concat(secondPage.rows);
      } catch (_) {
        // Keep first page cleanly if second page times out or rate-limits
      }
    }

    const records = allRows
      .map((r, idx) => ({
        id: `agm_${startOffset + idx}_${String(r.market || "mkt").replace(/\s+/g, "_")}_${String(r.commodity || "crop").replace(/\s+/g, "_")}`,
        cropName: String(r.commodity || "").trim(),
        variety: String(r.variety || "").trim(),
        grade: String(r.grade || "").trim(),
        state: String(r.state || "").trim(),
        district: String(r.district || "").trim(),
        marketName: String(r.market || "").trim(),
        unit: "₹ / Quintal",
        minPrice: parsePriceOrNull(r.min_price),
        maxPrice: parsePriceOrNull(r.max_price),
        modalPrice: parsePriceOrNull(r.modal_price),
        reportDate: String(r.arrival_date || "").trim() || "Not Available",
        sourceName: "AGMARKNET (data.gov.in — Govt. of India)",
        sourceUrl: "https://agmarknet.gov.in/",
        fromOfficialApi: true
      }))
      .filter((r) => r.cropName && (r.modalPrice !== null || r.minPrice !== null || r.maxPrice !== null));

    return jsonResponse(200, {
      ok: true,
      configured: true,
      sourceName: "AGMARKNET (data.gov.in — Govt. of India)",
      fetchedAt: new Date().toISOString(),
      totalAvailable,
      offset: startOffset,
      records
    });
  } catch (err) {
    const isRateLimit = err?.code === "RATE_LIMIT";
    return jsonResponse(200, {
      ok: false,
      configured: true,
      rateLimited: isRateLimit,
      records: [],
      sourceName: "AGMARKNET (data.gov.in — Govt. of India)",
      error: err?.name === "AbortError"
        ? "AGMARKNET API request timed out. Please try refreshing again."
        : (err?.message || "Live mandi price data is temporarily unavailable. Please try refreshing later.")
    });
  }
};
