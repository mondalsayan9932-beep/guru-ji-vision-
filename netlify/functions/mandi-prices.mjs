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

// Upstream AGMARKNET sometimes retains legacy spelling for select States/Districts
const AGMARKNET_STATE_FALLBACKS = {
  "Delhi": "NCT of Delhi",
  "Odisha": "Orissa",
  "Puducherry": "Pondicherry"
};

const AGMARKNET_DISTRICT_FALLBACKS = {
  "Paschim Medinipur": "Medinipur(W)",
  "Purba Medinipur": "Medinipur(E)",
  "Purba Bardhaman": "Burdwan",
  "North 24 Parganas": "24 Paraganas North",
  "South 24 Parganas": "24 Paraganas South"
};

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
    if (upstream.status === 401 || upstream.status === 403) {
      const err = new Error("AGMARKNET API key is invalid or expired (HTTP " + upstream.status + "). Please verify DATA_GOV_API_KEY in Netlify Environment Variables.");
      err.code = "AUTH_ERROR";
      throw err;
    }
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
    if (raw?.status === "error" || (raw?.message && !Array.isArray(raw?.records))) {
      const err = new Error(String(raw.message || "AGMARKNET API returned an error response."));
      err.code = /key|auth|forbidden|unauthoriz/i.test(err.message) ? "AUTH_ERROR" : "API_ERROR";
      throw err;
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

  if (req.method !== "GET") {
    return jsonResponse(405, { ok: false, configured: false, records: [], error: "Method not allowed." });
  }

  const apiKey = (process.env.DATA_GOV_API_KEY || "").trim();
  if (!apiKey) {
    return jsonResponse(200, {
      ok: false,
      configured: false,
      records: [],
      sourceName: "AGMARKNET (data.gov.in — Govt. of India)",
      error: "Live mandi price data is temporarily unavailable. DATA_GOV_API_KEY is not configured in Netlify Environment Variables yet. Static India State/District/Mandi directory and verified MSP remain available."
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
    let activeState = state;
    let activeDistrict = district;

    let firstPage = await fetchAgmarknetPage({
      apiKey,
      state: activeState,
      district: activeDistrict,
      commodity,
      market,
      limit: pageSize,
      offset: startOffset
    });

    // If official LGD state/district spelling returns 0 rows, retry once with legacy AGMARKNET alias
    if (firstPage.rows.length === 0) {
      const altState = AGMARKNET_STATE_FALLBACKS[state] || state;
      const altDistrict = AGMARKNET_DISTRICT_FALLBACKS[district] || district;
      if (altState !== state || altDistrict !== district) {
        activeState = altState;
        activeDistrict = altDistrict;
        firstPage = await fetchAgmarknetPage({
          apiKey,
          state: activeState,
          district: activeDistrict,
          commodity,
          market,
          limit: pageSize,
          offset: startOffset
        });
      }
    }

    let allRows = [...firstPage.rows];
    const totalAvailable = firstPage.total || allRows.length;

    if (requestedLimit > 100 && allRows.length === 100 && totalAvailable > startOffset + 100) {
      try {
        const secondPage = await fetchAgmarknetPage({
          apiKey,
          state: activeState,
          district: activeDistrict,
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
        unit: "₹/quintal",
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
    const isAuthError = err?.code === "AUTH_ERROR";
    return jsonResponse(200, {
      ok: false,
      configured: !isAuthError,
      rateLimited: isRateLimit,
      authError: isAuthError,
      records: [],
      sourceName: "AGMARKNET (data.gov.in — Govt. of India)",
      error: err?.name === "AbortError"
        ? "Live mandi price data is temporarily unavailable (AGMARKNET request timed out). Please try refreshing later."
        : (err?.message || "Live mandi price data is temporarily unavailable. Please try refreshing later.")
    });
  }
};
