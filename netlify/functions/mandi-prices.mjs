// ============================================================================
// Guru Ji Vision — Official Government of India AGMARKNET Mandi Price Proxy
// Queries official data.gov.in resource: 9ef84268-d588-465a-a308-a864a43d0070
// ("Current Daily Price of Various Commodities from Various Markets (Mandi)")
// NEVER fabricates market prices if DATA_GOV_API_KEY is missing or API is down.
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
      error: "Live AGMARKNET API key (DATA_GOV_API_KEY) is not yet configured in Netlify Environment Variables. Displaying Admin-verified mandi rates if available."
    });
  }

  try {
    const url = new URL(req.url);
    const state = (url.searchParams.get("state") || "").trim();
    const district = (url.searchParams.get("district") || "").trim();
    const commodity = (url.searchParams.get("commodity") || "").trim();
    const market = (url.searchParams.get("market") || "").trim();
    const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get("limit") || "60", 10) || 60));

    const apiUrl = new URL(`https://api.data.gov.in/resource/${AGMARKNET_RESOURCE_ID}`);
    apiUrl.searchParams.set("api-key", apiKey);
    apiUrl.searchParams.set("format", "json");
    apiUrl.searchParams.set("limit", String(limit));
    if (state) apiUrl.searchParams.set("filters[state]", state);
    if (district) apiUrl.searchParams.set("filters[district]", district);
    if (commodity) apiUrl.searchParams.set("filters[commodity]", commodity);
    if (market) apiUrl.searchParams.set("filters[market]", market);

    const upstream = await fetch(apiUrl.toString(), {
      headers: { "Accept": "application/json" }
    });
    if (!upstream.ok) {
      throw new Error(`AGMARKNET API responded with HTTP ${upstream.status}`);
    }
    const raw = await upstream.json();
    const rows = Array.isArray(raw?.records) ? raw.records : [];

    const records = rows.map((r, idx) => ({
      id: `agm_${idx}_${r.market || "mkt"}_${r.commodity || "crop"}`,
      cropName: String(r.commodity || "").trim(),
      variety: String(r.variety || "").trim(),
      grade: String(r.grade || "").trim(),
      state: String(r.state || "").trim(),
      district: String(r.district || "").trim(),
      marketName: String(r.market || "").trim(),
      unit: "₹ / Quintal",
      minPrice: Number(r.min_price) || 0,
      maxPrice: Number(r.max_price) || 0,
      modalPrice: Number(r.modal_price) || 0,
      reportDate: String(r.arrival_date || "").trim(),
      sourceName: "AGMARKNET (data.gov.in — Govt. of India)",
      sourceUrl: "https://agmarknet.gov.in/",
      fromOfficialApi: true
    })).filter((r) => r.cropName && r.modalPrice > 0);

    return jsonResponse(200, {
      ok: true,
      configured: true,
      sourceName: "AGMARKNET (data.gov.in — Govt. of India)",
      fetchedAt: new Date().toISOString(),
      totalAvailable: Number(raw?.total) || records.length,
      records
    });
  } catch (err) {
    return jsonResponse(200, {
      ok: false,
      configured: true,
      records: [],
      sourceName: "AGMARKNET (data.gov.in — Govt. of India)",
      error: err?.message || "Unable to reach AGMARKNET API right now."
    });
  }
};
