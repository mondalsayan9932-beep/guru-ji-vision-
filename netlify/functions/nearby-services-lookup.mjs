// ============================================================================
// GURU JI VISION — SECURE NEARBY SERVICES & PIN CODE LOOKUP FUNCTION (PHASE 5)
// ============================================================================
// Works independently of GPS using 6-digit PIN Code resolution!
//
// SECURITY & DATA INTEGRITY POLICY:
// 1. NEVER invents shop names, addresses, phone numbers, or coordinates.
// 2. Strict SSRF hostname allowlist: ONLY official India Post PIN API,
//    OpenStreetMap Nominatim, OpenStreetMap Overpass API, and (when configured
//    via server-side Netlify env var) Google Places API (New).
// 3. Optional GOOGLE_PLACES_API_KEY stays strictly in server-side process.env
//    and is NEVER exposed to frontend JavaScript.
// 4. Returns honest empty results + surrounding PIN Code suggestions when a
//    rural PIN Code has no public map listings yet.
// ============================================================================

export const ALLOWED_LOOKUP_HOSTS = new Set([
  "api.postalpincode.in",
  "nominatim.openstreetmap.org",
  "overpass-api.de",
  "places.googleapis.com"
]);

export function isAllowedLookupUrl(rawUrl = "") {
  try {
    const parsed = new URL(String(rawUrl));
    return parsed.protocol === "https:" && ALLOWED_LOOKUP_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function validateSixDigitPin(raw = "") {
  const clean = String(raw || "").replace(/\s+/g, "").trim();
  if (!/^[1-9][0-9]{5}$/.test(clean)) return null;
  return clean;
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=600",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

async function fetchAllowlisted(url, options = {}, timeoutMs = 9000) {
  if (!isAllowedLookupUrl(url)) {
    throw new Error("Blocked non-allowlisted lookup host.");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const a1 = Number(lat1), o1 = Number(lng1), a2 = Number(lat2), o2 = Number(lng2);
  if (![a1, o1, a2, o2].every(Number.isFinite)) return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(a2 - a1);
  const dLng = toRad(o2 - o1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a1)) * Math.cos(toRad(a2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 10) / 10;
}

export function classifyOsmTagsToCategory(tags = {}) {
  const amenity = String(tags.amenity || "").toLowerCase();
  const shop = String(tags.shop || "").toLowerCase();
  const name = String(tags.name || "").toLowerCase();

  if (amenity === "pharmacy" || shop === "chemist" || shop === "medical_supply" || /medical|pharmacy|medicine|drug|ওষুধ|ফার্মেসি/i.test(name)) {
    return "MEDICAL_PHARMACY";
  }
  if (/pesticid|insecticid|fungicid|herbicid|kitnashak|কীটনাশক/i.test(name)) {
    return "PESTICIDE_SHOP";
  }
  if (/seed|beej|বীজ/i.test(name)) {
    return "SEED_SHOP";
  }
  if (/fertiliz|urea|dap|\bsar\b|সার/i.test(name)) {
    return "FERTILIZER_SHOP";
  }
  if (/tractor|pump|sprayer|machin|equipment|tiller|hardware|যন্ত্র/i.test(name) || shop === "farm_machinery" || shop === "hardware") {
    return "AGRI_EQUIPMENT_SHOP";
  }
  if (shop === "agrarian" || shop === "farm" || shop === "garden_centre" || /krishi|agri|kisan|কৃষি/i.test(name)) {
    return "FERTILIZER_SHOP";
  }
  if (["convenience", "supermarket", "general", "greengrocer", "grocery"].includes(shop) || /grocery|kirana|bhandar|store|মুদি/i.test(name)) {
    return "GROCERY_GENERAL";
  }
  // Return null for unrelated POIs so only the 6 allowed shop categories are included
  return null;
}

async function resolveIndiaPostPin(pin) {
  try {
    const res = await fetchAllowlisted(`https://api.postalpincode.in/pincode/${pin}`, {
      headers: { Accept: "application/json" }
    }, 7000);
    if (!res.ok) return { found: false, networkError: `India Post HTTP ${res.status}`, data: null };
    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;
    if (!first || first.Status !== "Success" || !Array.isArray(first.PostOffice) || !first.PostOffice.length) {
      return {
        found: false,
        notFound: true,
        message: String(first?.Message || "PIN Code not found in India Post directory."),
        data: null
      };
    }
    const offices = first.PostOffice.slice(0, 12);
    const primary = offices[0];
    return {
      found: true,
      data: {
        pinCode: pin,
        state: String(primary.State || "").trim(),
        district: String(primary.District || "").trim(),
        block: String(primary.Block || primary.Taluk || "").trim(),
        division: String(primary.Division || "").trim(),
        postOffices: offices.map((po) => String(po.Name || "").trim()).filter(Boolean)
      }
    };
  } catch (err) {
    return { found: false, networkError: err?.message || "India Post API unreachable", data: null };
  }
}

async function geocodePinNominatim(pin, postalMeta) {
  const queryParts = postalMeta?.district
    ? `${pin}, ${postalMeta.district}, ${postalMeta.state || "West Bengal"}, India`
    : `${pin}, India`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryParts)}&format=json&limit=1&countrycodes=in`;
  try {
    const res = await fetchAllowlisted(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "GuruJiVision-WomenFarmerNearby/1.0 (https://guru-ji-vision.netlify.app)"
      }
    }, 7000);
    if (!res.ok) return null;
    const arr = await res.json();
    const hit = Array.isArray(arr) ? arr[0] : null;
    if (!hit) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng, displayName: String(hit.display_name || "").slice(0, 220) };
  } catch {
    return null;
  }
}

async function fetchOverpassNearby(lat, lng, pin, postalMeta) {
  // Radius 6000m around verified PIN centroid; strictly real OpenStreetMap shops matching the 6 allowed categories
  const radiusM = 6000;
  const ql = `
    [out:json][timeout:8];
    (
      node(around:${radiusM},${lat},${lng})["amenity"="pharmacy"]["name"];
      way(around:${radiusM},${lat},${lng})["amenity"="pharmacy"]["name"];
      node(around:${radiusM},${lat},${lng})["shop"~"chemist|agrarian|farm|garden_centre|farm_machinery|hardware|convenience|general|supermarket|grocery"]["name"];
      way(around:${radiusM},${lat},${lng})["shop"~"chemist|agrarian|farm|garden_centre|farm_machinery|hardware|convenience|general|supermarket|grocery"]["name"];
    );
    out center 35;
  `.trim();

  try {
    const res = await fetchAllowlisted("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "GuruJiVision-WomenFarmerNearby/1.0"
      },
      body: `data=${encodeURIComponent(ql)}`
    }, 9000);
    if (!res.ok) return { ok: false, items: [], error: `Overpass HTTP ${res.status}` };
    const data = await res.json();
    const elements = Array.isArray(data?.elements) ? data.elements : [];
    const seenNames = new Set();
    const items = [];

    for (const el of elements) {
      const tags = el.tags || {};
      const name = String(tags.name || "").trim();
      if (!name) continue;
      const elLat = Number(el.lat ?? el.center?.lat);
      const elLng = Number(el.lon ?? el.center?.lon);
      if (!Number.isFinite(elLat) || !Number.isFinite(elLng)) continue;

      const dedupe = `${name.toLowerCase()}|${elLat.toFixed(3)}|${elLng.toFixed(3)}`;
      if (seenNames.has(dedupe)) continue;
      seenNames.add(dedupe);

      const addrParts = [
        tags["addr:housenumber"],
        tags["addr:street"],
        tags["addr:suburb"] || tags["addr:village"] || tags["addr:city"],
        postalMeta?.district,
        postalMeta?.state || "West Bengal"
      ].filter(Boolean);
      const itemPin = String(tags["addr:postcode"] || "").trim();
      const validItemPin = /^[1-9][0-9]{5}$/.test(itemPin) ? itemPin : pin;
      const phone = String(tags.phone || tags["contact:phone"] || "").trim().slice(0, 32);

      const category = classifyOsmTagsToCategory(tags);
      if (!category) continue;

      items.push({
        id: `osm-${el.type}-${el.id}`,
        name: name.slice(0, 140),
        category,
        address: (addrParts.join(", ") || `${postalMeta?.block || postalMeta?.district || "PIN"} ${validItemPin}`).slice(0, 260),
        area: String(tags["addr:suburb"] || tags["addr:village"] || postalMeta?.block || postalMeta?.district || "").slice(0, 100),
        district: String(postalMeta?.district || "").slice(0, 80),
        state: String(postalMeta?.state || "West Bengal").slice(0, 60),
        pinCode: validItemPin,
        phone,
        lat: elLat,
        lng: elLng,
        distanceKm: haversineKm(lat, lng, elLat, elLng),
        matchScope: validItemPin === pin ? "EXACT_PIN" : "SURROUNDING_PIN",
        verificationStatus: "OSM_DIRECTORY",
        sourceName: "OpenStreetMap Public Directory"
      });
    }

    return { ok: true, items: items.slice(0, 30) };
  } catch (err) {
    return { ok: false, items: [], error: err?.message || "Overpass lookup timed out" };
  }
}

async function fetchGooglePlacesNearby(lat, lng, pin, postalMeta, apiKey) {
  // Runs ONLY when server-side process.env.GOOGLE_PLACES_API_KEY is explicitly configured
  try {
    const res = await fetchAllowlisted("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.location,places.types"
      },
      body: JSON.stringify({
        includedTypes: ["pharmacy", "grocery_store", "hardware_store"],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 6000.0
          }
        }
      })
    }, 8000);
    if (!res.ok) return { ok: false, items: [], error: `Google Places HTTP ${res.status}` };
    const data = await res.json();
    const places = Array.isArray(data?.places) ? data.places : [];
    const items = places.map((p) => {
      const name = String(p?.displayName?.text || "").trim();
      const types = Array.isArray(p?.types) ? p.types : [];
      const pLat = Number(p?.location?.latitude);
      const pLng = Number(p?.location?.longitude);
      let category = null;
      if (types.includes("pharmacy")) category = "MEDICAL_PHARMACY";
      else if (types.includes("hardware_store")) category = "AGRI_EQUIPMENT_SHOP";
      else if (types.includes("grocery_store")) category = "GROCERY_GENERAL";
      if (!category) return null;
      return {
        id: `gp-${String(p.id || "").slice(0, 48)}`,
        name: name.slice(0, 140),
        category,
        address: String(p.formattedAddress || "").slice(0, 260),
        area: String(postalMeta?.block || postalMeta?.district || "").slice(0, 100),
        district: String(postalMeta?.district || "").slice(0, 80),
        state: String(postalMeta?.state || "West Bengal").slice(0, 60),
        pinCode: pin,
        phone: String(p.nationalPhoneNumber || "").trim().slice(0, 32),
        lat: Number.isFinite(pLat) ? pLat : null,
        lng: Number.isFinite(pLng) ? pLng : null,
        distanceKm: haversineKm(lat, lng, pLat, pLng),
        matchScope: "EXACT_PIN",
        verificationStatus: "GOOGLE_PLACES",
        sourceName: "Google Places API (Server-Side)"
      };
    }).filter((x) => x && x.name);
    return { ok: true, items };
  } catch (err) {
    return { ok: false, items: [], error: err?.message || "Google Places request failed" };
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
    const pin = validateSixDigitPin(reqUrl.searchParams.get("pin") || "");
    if (!pin) {
      return jsonResponse(400, {
        ok: false,
        error: "Invalid PIN Code. Please enter a valid 6-digit Indian PIN Code (e.g., 741235)."
      });
    }

    const postalRes = await resolveIndiaPostPin(pin);
    const postal = postalRes?.data || null;
    const postalFound = Boolean(postalRes?.found && postal);
    const postalNotFound = Boolean(postalRes?.notFound);
    const postalError = postalRes?.networkError || (postalNotFound ? (postalRes?.message || "PIN Code not found in India Post directory.") : "");

    // Do NOT geocode or fabricate results when India Post explicitly reports the PIN does not exist
    const geo = postalNotFound ? null : await geocodePinNominatim(pin, postal);

    // Optional future Google Places integration — strictly optional, never required or blocking
    const googlePlacesKey = String(process.env.GOOGLE_PLACES_API_KEY || "").trim();
    const googlePlacesConfigured = Boolean(googlePlacesKey);

    let directoryRes = { ok: false, items: [], error: "" };
    if (geo) {
      if (googlePlacesConfigured) {
        directoryRes = await fetchGooglePlacesNearby(geo.lat, geo.lng, pin, postal, googlePlacesKey);
        if (!directoryRes.ok || !directoryRes.items.length) {
          const osmRes = await fetchOverpassNearby(geo.lat, geo.lng, pin, postal);
          if (osmRes.ok) directoryRes = osmRes;
        }
      } else {
        directoryRes = await fetchOverpassNearby(geo.lat, geo.lng, pin, postal);
      }
    }

    const pinNum = parseInt(pin, 10);
    const isWestBengal =
      (postal?.state && postal.state.toLowerCase().includes("west bengal")) ||
      (!postalNotFound && pinNum >= 700001 && pinNum <= 743711);

    return jsonResponse(200, {
      ok: true,
      pinCode: pin,
      isWestBengal,
      postal,
      postalFound,
      postalNotFound,
      postalError,
      centerCoords: geo ? { lat: geo.lat, lng: geo.lng, displayName: geo.displayName } : null,
      liveListings: directoryRes.items || [],
      liveSourceOk: Boolean(directoryRes.ok),
      liveSourceError: directoryRes.error || "",
      apiInfo: {
        googlePlacesConfigured,
        activePublicProvider: googlePlacesConfigured
          ? "India Post PIN API + OpenStreetMap + Optional Google Places (Server-Side)"
          : "Free Services Only: India Post PIN API + OpenStreetMap + Admin-Verified Directory",
        setupHint: googlePlacesConfigured
          ? "Optional server-side Google Places integration is enabled alongside India Post & OpenStreetMap."
          : "Running 100% on free services (India Post PIN API + OpenStreetMap + Admin-Verified Directory). No GOOGLE_PLACES_API_KEY is required; it remains optional for future server-side configuration via Netlify Environment Variables."
      }
    });
  } catch (err) {
    return jsonResponse(500, {
      ok: false,
      error: err?.message || "Nearby services lookup is temporarily unavailable."
    });
  }
}
