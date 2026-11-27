// ============================================================================
// GURU JI VISION — WOMEN FARMER NEARBY SERVICES & SHG DISCOVERY DATA (PHASE 5)
// ============================================================================
// - Initially focused on West Bengal (PIN range 700001–743711) with full
//   support for any valid 6-digit Indian PIN Code.
// - Works 100% independently of GPS (manual 6-digit PIN Code search +
//   surrounding PIN Code suggestions).
// - ZERO FABRICATION: Never invents fake shop names, SHG names, addresses,
//   phone numbers, or coordinates. All verified listings come from Admin-verified
//   Firestore records or real public map/postal APIs via secure Netlify Function.
// ============================================================================

export const NEARBY_SERVICE_CATEGORIES = [
  { key: "MEDICAL_PHARMACY", en: "Medical Stores / Pharmacies", bn: "ওষুধের দোকান / ফার্মেসি", icon: "💊" },
  { key: "FERTILIZER_SHOP", en: "Fertilizer Shops", bn: "সারের দোকান", icon: "🧪" },
  { key: "SEED_SHOP", en: "Seed Shops", bn: "বীজের দোকান", icon: "🌱" },
  { key: "PESTICIDE_SHOP", en: "Pesticide Shops", bn: "কীটনাশকের দোকান", icon: "🛡️" },
  { key: "AGRI_INPUT_SHOP", en: "Agricultural Input Shops", bn: "কৃষি উপকরণের দোকান", icon: "🌾" },
  { key: "GROCERY_GENERAL", en: "Grocery / General Stores", bn: "মুদিখানা / সাধারণ দোকান", icon: "🛒" },
  { key: "AGRI_EQUIPMENT_SHOP", en: "Agricultural Equipment Shops", bn: "কৃষি যন্ত্রপাতির দোকান", icon: "🚜" },
  { key: "SHG_GROUP", en: "Self Help Groups (SHGs)", bn: "স্বনির্ভর গোষ্ঠী (SHG)", icon: "🤝" },
  { key: "FARMER_SUPPORT_CENTRE", en: "Farmer Support Centres", bn: "কৃষক সহায়তা কেন্দ্র", icon: "🏛️" }
];

export const NEARBY_SERVICE_CATEGORY_MAP = Object.fromEntries(
  NEARBY_SERVICE_CATEGORIES.map((c) => [c.key, c])
);

export const NEARBY_SERVICE_CATEGORY_KEYS = NEARBY_SERVICE_CATEGORIES.map((c) => c.key);

// Real West Bengal Agricultural District PIN Hubs (strictly postal PIN reference — NO fabricated businesses)
export const WEST_BENGAL_PIN_HUBS = [
  { pin: "741235", areaEn: "Kalyani, Nadia", areaBn: "কল্যাণী, নদিয়া", district: "Nadia", nearby: ["741252", "741245", "741234", "741251"] },
  { pin: "741101", areaEn: "Krishnanagar, Nadia", areaBn: "কৃষ্ণনগর, নদিয়া", district: "Nadia", nearby: ["741102", "741103", "741125", "741126"] },
  { pin: "713101", areaEn: "Bardhaman, Purba Bardhaman", areaBn: "বর্ধমান, পূর্ব বর্ধমান", district: "Purba Bardhaman", nearby: ["713102", "713103", "713104", "713124"] },
  { pin: "712101", areaEn: "Chinsurah, Hooghly", areaBn: "চুঁচুড়া, হুগলি", district: "Hooghly", nearby: ["712102", "712103", "712104", "712121"] },
  { pin: "721101", areaEn: "Midnapore, Paschim Medinipur", areaBn: "মেদিনীপুর, পশ্চিম মেদিনীপুর", district: "Paschim Medinipur", nearby: ["721102", "721129", "721301", "721305"] },
  { pin: "721636", areaEn: "Tamluk, Purba Medinipur", areaBn: "তমলুক, পূর্ব মেদিনীপুর", district: "Purba Medinipur", nearby: ["721627", "721637", "721649", "721653"] },
  { pin: "722101", areaEn: "Bankura Sadar, Bankura", areaBn: "বাঁকুড়া সদর, বাঁকুড়া", district: "Bankura", nearby: ["722102", "722121", "722122", "722146"] },
  { pin: "723101", areaEn: "Purulia Sadar, Purulia", areaBn: "পুরুলিয়া সদর, পুরুলিয়া", district: "Purulia", nearby: ["723102", "723103", "723121", "723128"] },
  { pin: "731101", areaEn: "Suri, Birbhum", areaBn: "সিউড়ি, বীরভূম", district: "Birbhum", nearby: ["731102", "731103", "731204", "731235"] },
  { pin: "742101", areaEn: "Berhampore, Murshidabad", areaBn: "বহরমপুর, মুর্শিদাবাদ", district: "Murshidabad", nearby: ["742102", "742103", "742149", "742165"] },
  { pin: "743201", areaEn: "Bangaon / Barasat Belt, North 24 Parganas", areaBn: "বনগাঁ / উত্তর ২৪ পরগনা", district: "North 24 Parganas", nearby: ["700124", "700125", "743235", "743263"] },
  { pin: "743329", areaEn: "Baruipur, South 24 Parganas", areaBn: "বারুইপুর, দক্ষিণ ২৪ পরগনা", district: "South 24 Parganas", nearby: ["743312", "743330", "743387", "700144"] },
  { pin: "732101", areaEn: "English Bazar, Malda", areaBn: "ইংলিশ বাজার, মালদা", district: "Malda", nearby: ["732102", "732103", "732124", "732128"] },
  { pin: "736101", areaEn: "Cooch Behar Sadar", areaBn: "কোচবিহার সদর", district: "Cooch Behar", nearby: ["736102", "736135", "736156", "736170"] },
  { pin: "735101", areaEn: "Jalpaiguri Sadar", areaBn: "জলপাইগুড়ি সদর", district: "Jalpaiguri", nearby: ["735102", "735121", "735133", "735219"] },
  { pin: "734001", areaEn: "Siliguri, Darjeeling", areaBn: "শিলিগুড়ি, দার্জিলিং", district: "Darjeeling", nearby: ["734002", "734003", "734004", "734010"] },
  { pin: "711101", areaEn: "Howrah Sadar, Howrah", areaBn: "হাওড়া সদর, হাওড়া", district: "Howrah", nearby: ["711102", "711103", "711302", "711316"] }
];

export const SHG_ACTIVITY_TAGS = [
  { key: "VEGETABLE_HORTICULTURE", en: "Vegetable & Horticulture Farming", bn: "সবজি ও উদ্যান চাষ" },
  { key: "ORGANIC_VERMICOMPOST", en: "Organic Farming & Vermicompost", bn: "জৈব চাষ ও কেঁচো সার" },
  { key: "DAIRY_LIVESTOCK", en: "Dairy, Goatery & Livestock", bn: "দুগ্ধ, ছাগল ও পশুপালন" },
  { key: "POULTRY_FISHERIES", en: "Backyard Poultry & Pond Fisheries", bn: "হাঁস-মুরগি ও পুকুর মাছ চাষ" },
  { key: "FOOD_PROCESSING", en: "Food Processing (Spices, Pickles, Dal, Honey)", bn: "খাদ্য প্রক্রিয়াকরণ (মসলা, আচার, ডাল, মধু)" },
  { key: "SEED_NURSERY", en: "Seed Production & Plant Nursery", bn: "বীজ উৎপাদন ও নার্সারি" },
  { key: "SHG_MICROCREDIT", en: "SHG Savings, Bank Linkage & Micro-Enterprise", bn: "SHG সঞ্চয়, ব্যাংক ঋণ ও ক্ষুদ্র উদ্যোগ" }
];

export const SHG_GOVT_SUPPORT_OPTIONS = [
  "Anandadhara (WBSRLM / DAY-NRLM)",
  "Mahila Kisan Sashaktikaran Pariyojana (MKSP)",
  "PMFME Seed Capital (MoFPI)",
  "NABARD SHG-Bank Linkage & FPO Support",
  "Namo Drone Didi (Women SHG Agri Drone)",
  "PMMSY Fisheries (Women Subsidy)",
  "National Livestock Mission (NLM)",
  "West Bengal Matir Srishti / State Horticulture"
];

// ----------------------------------------------------------------------------
// 1. STRICT 6-DIGIT PIN CODE VALIDATION & WEST BENGAL DETECTION
// ----------------------------------------------------------------------------
export function validatePinCode(raw = "") {
  const cleaned = String(raw || "").replace(/\s+/g, "").trim();
  if (!cleaned) {
    return {
      valid: false,
      pin: "",
      isWestBengal: false,
      errorEn: "Please enter a 6-digit PIN Code (e.g., 741235 for Kalyani, West Bengal).",
      errorBn: "অনুগ্রহ করে একটি ৬ সংখ্যার পিন কোড লিখুন (যেমন: কল্যাণীর জন্য 741235)।"
    };
  }
  if (!/^[1-9][0-9]{5}$/.test(cleaned)) {
    return {
      valid: false,
      pin: cleaned,
      isWestBengal: false,
      errorEn: "Invalid PIN Code. Enter exactly 6 digits starting with 1–9 (West Bengal PINs are 700001–743711).",
      errorBn: "সঠিক পিন কোড নয়। ১–৯ দিয়ে শুরু হওয়া ঠিক ৬ সংখ্যার পিন কোড দিন (পশ্চিমবঙ্গের পিন ৭০০০০১–৭৪৩৭১১)।"
    };
  }
  const num = parseInt(cleaned, 10);
  const isWestBengal = num >= 700001 && num <= 743711;
  return {
    valid: true,
    pin: cleaned,
    isWestBengal,
    errorEn: "",
    errorBn: ""
  };
}

// ----------------------------------------------------------------------------
// 2. SURROUNDING PIN CODE SUGGESTIONS (WORKS EVEN WITHOUT GPS OR API)
// ----------------------------------------------------------------------------
export function getSurroundingPinSuggestions(pin, existingPins = []) {
  const v = validatePinCode(pin);
  if (!v.valid) return [];
  const pinNum = parseInt(v.pin, 10);
  const suggestions = [];
  const seen = new Set([v.pin]);

  const add = (p, labelEn = "", labelBn = "") => {
    const pStr = String(p || "").trim();
    if (!/^[1-9][0-9]{5}$/.test(pStr) || seen.has(pStr)) return;
    seen.add(pStr);
    suggestions.push({ pin: pStr, labelEn, labelBn });
  };

  // 1) Exact match or same-prefix West Bengal Hub neighbors
  const exactHub = WEST_BENGAL_PIN_HUBS.find((h) => h.pin === v.pin || h.nearby.includes(v.pin));
  if (exactHub) {
    add(exactHub.pin, exactHub.areaEn, exactHub.areaBn);
    for (const np of exactHub.nearby) {
      add(np, `${exactHub.district} Nearby PIN`, `${exactHub.district} পার্শ্ববর্তী পিন`);
    }
  }

  // 2) Verified Firestore listings sharing the same 3-digit or 4-digit postal zone
  const prefix3 = v.pin.slice(0, 3);
  for (const ep of existingPins || []) {
    const clean = String(ep || "").trim();
    if (/^[1-9][0-9]{5}$/.test(clean) && clean.startsWith(prefix3)) {
      add(clean, "Verified Listings Nearby", "যাচাইকৃত তালিকা রয়েছে");
    }
  }

  // 3) Numerically adjacent surrounding postal PINs in the same 3-digit postal division
  for (const delta of [-1, 1, -2, 2, -3, 3]) {
    const cand = pinNum + delta;
    const candStr = String(cand);
    if (cand >= 100001 && cand <= 899999 && candStr.startsWith(prefix3)) {
      add(candStr, "Adjacent PIN Area", "পার্শ্ববর্তী পিন এলাকা");
    }
  }

  // 4) Same 2-digit West Bengal region hubs if still fewer than 6 suggestions
  if (suggestions.length < 6 && v.isWestBengal) {
    const prefix2 = v.pin.slice(0, 2);
    for (const h of WEST_BENGAL_PIN_HUBS) {
      if (h.pin.startsWith(prefix2)) add(h.pin, h.areaEn, h.areaBn);
    }
  }

  return suggestions.slice(0, 8);
}

// ----------------------------------------------------------------------------
// 3. RELIABLE HAVERSINE DISTANCE & SAFE MAP / DIRECTIONS URL BUILDERS
// ----------------------------------------------------------------------------
export function isValidIndiaCoordinate(lat, lng) {
  const la = Number(lat);
  const lo = Number(lng);
  return Number.isFinite(la) && Number.isFinite(lo) && la >= 6 && la <= 38 && lo >= 67 && lo <= 98;
}

export function computeReliableDistanceKm(lat1, lng1, lat2, lng2) {
  if (!isValidIndiaCoordinate(lat1, lng1) || !isValidIndiaCoordinate(lat2, lng2)) return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLng = toRad(Number(lng2) - Number(lng1));
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(Number(lat1))) * Math.cos(toRad(Number(lat2))) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  return Number.isFinite(km) ? Math.round(km * 10) / 10 : null;
}

export function buildDirectionsUrl(item = {}) {
  if (isValidIndiaCoordinate(item.lat, item.lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${Number(item.lat).toFixed(6)},${Number(item.lng).toFixed(6)}`)}`;
  }
  const dest = [item.name, item.address, item.pinCode, item.state || "West Bengal", "India"]
    .filter(Boolean)
    .join(", ");
  if (!dest) return "";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

export function buildMapExternalUrl(item = {}) {
  if (isValidIndiaCoordinate(item.lat, item.lng)) {
    const la = Number(item.lat).toFixed(6);
    const lo = Number(item.lng).toFixed(6);
    return `https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=15/${la}/${lo}`;
  }
  const q = [item.name, item.address, item.pinCode, "West Bengal", "India"].filter(Boolean).join(", ");
  return q ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(q)}` : "";
}

export function buildOsmEmbedUrl(centerLat, centerLng, markerLat = null, markerLng = null) {
  const lat = isValidIndiaCoordinate(markerLat, markerLng) ? Number(markerLat) : Number(centerLat);
  const lng = isValidIndiaCoordinate(markerLat, markerLng) ? Number(markerLng) : Number(centerLng);
  if (!isValidIndiaCoordinate(lat, lng)) return "";
  const delta = 0.035;
  const bbox = `${(lng - delta).toFixed(5)},${(lat - delta).toFixed(5)},${(lng + delta).toFixed(5)},${(lat + delta).toFixed(5)}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat.toFixed(6)},${lng.toFixed(6)}`)}`;
}

// ----------------------------------------------------------------------------
// 4. VERIFICATION STATUS BADGES & MERGE / FILTER HELPERS
// ----------------------------------------------------------------------------
export function getVerificationBadgeMeta(status = "") {
  const s = String(status || "").toUpperCase();
  if (s === "ADMIN_VERIFIED") {
    return {
      en: "Admin Verified",
      bn: "অ্যাডমিন যাচাইকৃত",
      cls: "bg-[#DCFCE7] text-[#14532D] border-[#BBF7D0]"
    };
  }
  if (s === "GOOGLE_PLACES") {
    return {
      en: "Live Places Directory",
      bn: "লাইভ ম্যাপ ডিরেক্টরি",
      cls: "bg-sky-100 text-sky-900 border-sky-200"
    };
  }
  if (s === "OSM_DIRECTORY") {
    return {
      en: "OpenStreetMap Directory (Verify before visit)",
      bn: "ম্যাপ ডিরেক্টরি (যাওয়ার আগে যাচাই করুন)",
      cls: "bg-sky-50 text-sky-900 border-sky-200"
    };
  }
  if (s === "REJECTED") {
    return {
      en: "Rejected",
      bn: "বাতিলকৃত",
      cls: "bg-rose-100 text-rose-800 border-rose-200"
    };
  }
  return {
    en: "Unverified Submission (Pending Admin Review)",
    bn: "অযাচাইকৃত জমা (অ্যাডমিন যাচাই বাকি)",
    cls: "bg-amber-100 text-amber-900 border-amber-300"
  };
}

/**
 * Merges Admin-verified Firestore Nearby Services + optional live directory items
 * (and, strictly for the submitter/admin only, their own pending unverified items).
 */
export function filterNearbyListings({
  verifiedListings = [],
  liveDirectoryListings = [],
  myPendingListings = [],
  pinCode = "",
  surroundingPins = [],
  category = "ALL",
  search = "",
  referenceCoords = null
} = {}) {
  const cleanPin = String(pinCode || "").trim();
  const surroundingSet = new Set((surroundingPins || []).map((x) => (typeof x === "string" ? x : x?.pin)).filter(Boolean));
  const q = String(search || "").trim().toLowerCase();

  const normalizeItem = (raw, sourceTag) => {
    const dist = referenceCoords
      ? computeReliableDistanceKm(referenceCoords.lat, referenceCoords.lng, raw.lat, raw.lng)
      : (typeof raw.distanceKm === "number" && Number.isFinite(raw.distanceKm) ? raw.distanceKm : null);
    return {
      ...raw,
      category: NEARBY_SERVICE_CATEGORY_MAP[raw.category] ? raw.category : "AGRI_INPUT_SHOP",
      pinCode: String(raw.pinCode || "").trim(),
      distanceKm: dist,
      sourceTag
    };
  };

  // Verified Firestore records matching exact PIN or surrounding PINs (or all when no PIN entered)
  const verifiedMatched = (verifiedListings || [])
    .filter((item) => item && item.verificationStatus === "ADMIN_VERIFIED" && item.published === true)
    .map((item) => normalizeItem(item, "FIRESTORE_VERIFIED"))
    .filter((item) => {
      if (!cleanPin) return true;
      return item.pinCode === cleanPin || surroundingSet.has(item.pinCode);
    });

  // Live OpenStreetMap / Google Places real directory items for the searched PIN
  const liveMatched = cleanPin
    ? (liveDirectoryListings || []).map((item) => normalizeItem(item, "LIVE_DIRECTORY"))
    : [];

  // Submitter's own pending unverified submissions (NEVER mixed into public verified counts)
  const pendingOwn = (myPendingListings || [])
    .filter((item) => item && item.verificationStatus === "PENDING_REVIEW")
    .map((item) => normalizeItem(item, "MY_PENDING"))
    .filter((item) => (!cleanPin || item.pinCode === cleanPin || surroundingSet.has(item.pinCode)));

  const applyFilters = (list) => list.filter((item) => {
    if (category !== "ALL" && item.category !== category) return false;
    if (q) {
      const catMeta = NEARBY_SERVICE_CATEGORY_MAP[item.category] || { en: "", bn: "" };
      const hay = [
        item.name, item.nameBn, item.address, item.area, item.district,
        item.pinCode, item.phone, item.notes, catMeta.en, catMeta.bn
      ].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const combinedPublic = [...applyFilters(verifiedMatched), ...applyFilters(liveMatched)]
    .sort((a, b) => {
      // Exact PIN first, Admin Verified first, then shortest reliable distance
      const aExact = cleanPin && a.pinCode === cleanPin ? 0 : 1;
      const bExact = cleanPin && b.pinCode === cleanPin ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const aVer = a.verificationStatus === "ADMIN_VERIFIED" ? 0 : 1;
      const bVer = b.verificationStatus === "ADMIN_VERIFIED" ? 0 : 1;
      if (aVer !== bVer) return aVer - bVer;
      const aDist = a.distanceKm ?? 99999;
      const bDist = b.distanceKm ?? 99999;
      return aDist - bDist;
    });

  return {
    exactPinResults: cleanPin ? combinedPublic.filter((x) => x.pinCode === cleanPin || x.matchScope === "EXACT_PIN") : combinedPublic,
    surroundingResults: cleanPin ? combinedPublic.filter((x) => x.pinCode !== cleanPin && x.matchScope !== "EXACT_PIN") : [],
    allResults: combinedPublic,
    myPendingResults: applyFilters(pendingOwn)
  };
}

export function filterShgListings({
  verifiedShgs = [],
  myPendingShgs = [],
  pinCode = "",
  surroundingPins = [],
  district = "ALL",
  search = ""
} = {}) {
  const cleanPin = String(pinCode || "").trim();
  const surroundingSet = new Set((surroundingPins || []).map((x) => (typeof x === "string" ? x : x?.pin)).filter(Boolean));
  const q = String(search || "").trim().toLowerCase();

  const matches = (item) => {
    if (!item) return false;
    if (district !== "ALL" && String(item.district || "").toLowerCase() !== district.toLowerCase()) return false;
    if (cleanPin && item.pinCode !== cleanPin && !surroundingSet.has(item.pinCode)) return false;
    if (q) {
      const hay = [
        item.shgName, item.shgNameBn, item.area, item.district, item.address, item.pinCode,
        ...(item.activities || []), ...(item.services || []),
        item.entrepreneurshipInfo, item.govtSupport
      ].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  };

  const publicShgs = (verifiedShgs || [])
    .filter((s) => s && s.verificationStatus === "ADMIN_VERIFIED" && s.published === true)
    .filter(matches)
    .sort((a, b) => {
      const aExact = cleanPin && a.pinCode === cleanPin ? 0 : 1;
      const bExact = cleanPin && b.pinCode === cleanPin ? 0 : 1;
      return aExact - bExact;
    });

  const ownPending = (myPendingShgs || [])
    .filter((s) => s && s.verificationStatus === "PENDING_REVIEW")
    .filter(matches);

  return {
    exactPinShgs: cleanPin ? publicShgs.filter((s) => s.pinCode === cleanPin) : publicShgs,
    surroundingShgs: cleanPin ? publicShgs.filter((s) => s.pinCode !== cleanPin) : [],
    allShgs: publicShgs,
    myPendingShgs: ownPending
  };
}
