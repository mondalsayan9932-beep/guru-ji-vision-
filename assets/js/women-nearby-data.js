// ============================================================================
// GURU JI VISION — WOMEN FARMER NEARBY SERVICES & SHG DISCOVERY DATA (FREE APIs)
// ============================================================================
// - 100% Free-First Architecture: India Post PIN Code API + OpenStreetMap
//   (Leaflet.js tiles & OSRM directions) + Admin-verified Firestore Directory.
// - NO paid Google Maps or GOOGLE_PLACES_API_KEY required.
// - Initially focused on West Bengal (PIN range 700001–743711) with full
//   support for any valid 6-digit Indian PIN Code.
// - ZERO FABRICATION: Never invents fake shop names, SHG names, addresses,
//   phone numbers, PIN Code data, or coordinates.
// - NEVER assumes nearby PIN Codes are geographically close merely because
//   their numbers are consecutive; only uses verified district postal hubs &
//   same-district verified listings.
// - NEVER claims a shop is nearby based only on its PIN Code; distance is
//   calculated ONLY when verified latitude & longitude coordinates exist.
// ============================================================================

export const NEARBY_SERVICE_CATEGORIES = [
  {
    key: "MEDICAL_PHARMACY",
    en: "Medical Store",
    bn: "ওষুধের দোকান",
    icon: "💊",
    descEn: "Pharmacies, essential medicines & first-aid stores",
    descBn: "ওষুধ, ফার্মেসি ও প্রাথমিক চিকিৎসা সামগ্রী"
  },
  {
    key: "FERTILIZER_SHOP",
    en: "Fertilizer Shop",
    bn: "সারের দোকান",
    icon: "🧪",
    descEn: "Urea, DAP, MOP, organic & micronutrient fertilizers",
    descBn: "ইউরিয়া, ডিএপি, পটাশ, জৈব ও অণুখাদ্য সার"
  },
  {
    key: "SEED_SHOP",
    en: "Seed Shop",
    bn: "বীজের দোকান",
    icon: "🌱",
    descEn: "Certified paddy, vegetable, oilseed & hybrid seeds",
    descBn: "প্রত্যয়িত ধান, সবজি, তৈলবীজ ও উন্নত বীজ"
  },
  {
    key: "PESTICIDE_SHOP",
    en: "Pesticide Shop",
    bn: "কীটনাশকের দোকান",
    icon: "🛡️",
    descEn: "Crop protection, fungicides, bio-pesticides & IPM",
    descBn: "ফসল সুরক্ষা, ছত্রাকনাশক ও জৈব কীটনাশক"
  },
  {
    key: "GROCERY_GENERAL",
    en: "Grocery Shop",
    bn: "মুদিখানা দোকান",
    icon: "🛒",
    descEn: "Daily essentials, grains & rural grocery stores",
    descBn: "নিত্যপ্রয়োজনীয় খাদ্যসামগ্রী ও মুদি দোকান"
  },
  {
    key: "AGRI_EQUIPMENT_SHOP",
    en: "Agricultural Equipment Shop",
    bn: "কৃষি যন্ত্রপাতির দোকান",
    icon: "🚜",
    descEn: "Sprayers, water pumps, tillers, tools & spare parts",
    descBn: "স্প্রেয়ার, পাম্প, টিলার, যন্ত্রাংশ ও কৃষি সরঞ্জাম"
  }
];

export const NEARBY_SERVICE_CATEGORY_KEYS = NEARBY_SERVICE_CATEGORIES.map((c) => c.key);
export const NEARBY_SERVICE_CATEGORY_SET = new Set(NEARBY_SERVICE_CATEGORY_KEYS);

// Primary 6-category lookup map (with display-only fallback labels for any pre-existing Admin records)
export const NEARBY_SERVICE_CATEGORY_MAP = {
  ...Object.fromEntries(NEARBY_SERVICE_CATEGORIES.map((c) => [c.key, c]))
};

// Verified West Bengal Agricultural District PIN Hubs (strictly postal reference — NO fabricated businesses)
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
      errorEn: "Please enter a 6-digit Indian PIN Code (e.g., 741235 for Kalyani, West Bengal).",
      errorBn: "অনুগ্রহ করে একটি ৬ সংখ্যার ভারতীয় পিন কোড লিখুন (যেমন: কল্যাণীর জন্য 741235)।"
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
// 2. DISTRICT-VERIFIED NEARBY PIN SUGGESTIONS
//    (NEVER assumes consecutive PIN numbers are geographically close!)
// ----------------------------------------------------------------------------
export function getSurroundingPinSuggestions(pin, verifiedItemsOrPins = [], resolvedDistrict = "") {
  const v = validatePinCode(pin);
  if (!v.valid) return [];

  const suggestions = [];
  const seen = new Set([v.pin]);
  const normDistrict = String(resolvedDistrict || "").trim().toLowerCase();

  const add = (p, labelEn = "", labelBn = "") => {
    const pStr = String(p || "").trim();
    if (!/^[1-9][0-9]{5}$/.test(pStr) || seen.has(pStr)) return;
    seen.add(pStr);
    suggestions.push({ pin: pStr, labelEn, labelBn });
  };

  // 1) Verified West Bengal District Postal Hubs matching exact PIN or hub nearby list
  const exactHub = WEST_BENGAL_PIN_HUBS.find((h) => h.pin === v.pin || h.nearby.includes(v.pin));
  const activeDistrict = normDistrict || String(exactHub?.district || "").toLowerCase();

  if (exactHub) {
    add(exactHub.pin, exactHub.areaEn, exactHub.areaBn);
    for (const np of exactHub.nearby) {
      add(np, `${exactHub.district} Postal Area`, `${exactHub.district} ডাক এলাকা`);
    }
  }

  // 2) Same-district hubs from WEST_BENGAL_PIN_HUBS (using verified India Post district name)
  if (activeDistrict) {
    for (const h of WEST_BENGAL_PIN_HUBS) {
      if (h.district.toLowerCase() === activeDistrict) {
        add(h.pin, h.areaEn, h.areaBn);
        for (const np of h.nearby) {
          add(np, `${h.district} Postal Area`, `${h.district} ডাক এলাকা`);
        }
      }
    }
  }

  // 3) Verified Firestore records in the SAME verified district (never guessing by consecutive numbers!)
  for (const entry of verifiedItemsOrPins || []) {
    if (entry && typeof entry === "object") {
      const entryPin = String(entry.pinCode || "").trim();
      const entryDist = String(entry.district || "").trim().toLowerCase();
      if (/^[1-9][0-9]{5}$/.test(entryPin) && activeDistrict && entryDist === activeDistrict) {
        add(entryPin, `Verified Listings (${entry.district})`, `যাচাইকৃত তালিকা (${entry.district})`);
      }
    }
  }

  return suggestions.slice(0, 8);
}

// ----------------------------------------------------------------------------
// 3. RELIABLE HAVERSINE DISTANCE & OPENSTREETMAP DIRECTIONS / MAP URL BUILDERS
//    (100% Free OpenStreetMap — ZERO Google Maps / Google Places URLs!)
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

/**
 * Builds an OpenStreetMap OSRM Directions URL ONLY when verified destination
 * coordinates exist. Returns "" when coordinates are unavailable so UI can
 * show an honest "Route unavailable" notice instead of fabricating a route.
 */
export function buildDirectionsUrl(item = {}, originCoords = null) {
  if (!isValidIndiaCoordinate(item.lat, item.lng)) return "";
  const dLat = Number(item.lat).toFixed(6);
  const dLng = Number(item.lng).toFixed(6);
  if (originCoords && isValidIndiaCoordinate(originCoords.lat, originCoords.lng)) {
    const oLat = Number(originCoords.lat).toFixed(6);
    const oLng = Number(originCoords.lng).toFixed(6);
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(`${oLat},${oLng};${dLat},${dLng}`)}#map=13/${dLat}/${dLng}`;
  }
  return `https://www.openstreetmap.org/directions?to=${encodeURIComponent(`${dLat},${dLng}`)}#map=15/${dLat}/${dLng}`;
}

export function buildMapExternalUrl(item = {}) {
  if (isValidIndiaCoordinate(item.lat, item.lng)) {
    const la = Number(item.lat).toFixed(6);
    const lo = Number(item.lng).toFixed(6);
    return `https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=15/${la}/${lo}`;
  }
  const q = [item.name || item.shgName, item.village || item.area, item.block, item.district, item.pinCode, "West Bengal", "India"]
    .filter(Boolean)
    .join(", ");
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
// 4. VERIFICATION & ADMIN APPROVAL STATUS BADGES
// ----------------------------------------------------------------------------
export function getVerificationBadgeMeta(status = "") {
  const s = String(status || "").toUpperCase();
  if (s === "ADMIN_VERIFIED") {
    return {
      en: "Admin Verified & Approved",
      bn: "অ্যাডমিন যাচাইকৃত ও অনুমোদিত",
      cls: "bg-[#DCFCE7] text-[#14532D] border-[#BBF7D0]"
    };
  }
  if (s === "GOOGLE_PLACES") {
    return {
      en: "Optional Places Directory",
      bn: "ঐচ্ছিক ম্যাপ ডিরেক্টরি",
      cls: "bg-sky-100 text-sky-900 border-sky-200"
    };
  }
  if (s === "OSM_DIRECTORY") {
    return {
      en: "OpenStreetMap Directory (Verify before visit)",
      bn: "OpenStreetMap তালিকা (যাওয়ার আগে যাচাই করুন)",
      cls: "bg-sky-50 text-sky-900 border-sky-200"
    };
  }
  if (s === "REJECTED") {
    return {
      en: "Rejected by Admin",
      bn: "অ্যাডমিন দ্বারা বাতিল",
      cls: "bg-rose-100 text-rose-800 border-rose-200"
    };
  }
  return {
    en: "Pending Admin Approval (Private)",
    bn: "অ্যাডমিন অনুমোদনের অপেক্ষায় (ব্যক্তিগত)",
    cls: "bg-amber-100 text-amber-900 border-amber-300"
  };
}

// ----------------------------------------------------------------------------
// 5. MERGE & FILTER HELPERS (NEARBY SERVICES + SHG SEARCH)
// ----------------------------------------------------------------------------
/**
 * Merges Admin-verified Firestore Nearby Services + OpenStreetMap directory items
 * (and, strictly for the submitter only, their own pending private items).
 * Distance is calculated ONLY when BOTH valid reference coordinates AND verified
 * listing coordinates exist — never inferred from PIN Code alone.
 */
export function filterNearbyListings({
  verifiedListings = [],
  liveDirectoryListings = [],
  myPendingListings = [],
  pinCode = "",
  surroundingPins = [],
  district = "",
  category = "ALL",
  search = "",
  userCoords = null,
  pinCenterCoords = null
} = {}) {
  const cleanPin = String(pinCode || "").trim();
  const cleanDistrict = String(district || "").trim().toLowerCase();
  const surroundingSet = new Set((surroundingPins || []).map((x) => (typeof x === "string" ? x : x?.pin)).filter(Boolean));
  const q = String(search || "").trim().toLowerCase();

  const hasUserGps = Boolean(userCoords && isValidIndiaCoordinate(userCoords.lat, userCoords.lng));
  const hasPinCenter = Boolean(pinCenterCoords && isValidIndiaCoordinate(pinCenterCoords.lat, pinCenterCoords.lng));
  const refCoords = hasUserGps ? userCoords : (hasPinCenter ? pinCenterCoords : null);
  const refBasis = hasUserGps ? "GPS" : (hasPinCenter ? "PIN_CENTER" : "NONE");

  const normalizeItem = (raw, sourceTag) => {
    if (!raw || !NEARBY_SERVICE_CATEGORY_SET.has(raw.category)) return null;
    const hasItemCoords = isValidIndiaCoordinate(raw.lat, raw.lng);
    const dist = refCoords && hasItemCoords
      ? computeReliableDistanceKm(refCoords.lat, refCoords.lng, raw.lat, raw.lng)
      : null;
    return {
      ...raw,
      category: raw.category,
      pinCode: String(raw.pinCode || "").trim(),
      approvalStatus: raw.approvalStatus || (raw.verificationStatus === "ADMIN_VERIFIED" ? "APPROVED" : raw.verificationStatus === "REJECTED" ? "REJECTED" : "PENDING"),
      distanceKm: dist,
      distanceBasis: dist !== null ? refBasis : "NONE",
      sourceTag
    };
  };

  // Public verified Firestore records only (strictly limited to the 6 shop categories)
  const verifiedMatched = (verifiedListings || [])
    .filter((item) => item && item.verificationStatus === "ADMIN_VERIFIED" && item.published === true)
    .map((item) => normalizeItem(item, "FIRESTORE_VERIFIED"))
    .filter(Boolean)
    .filter((item) => {
      if (!cleanPin) return true;
      if (item.pinCode === cleanPin || surroundingSet.has(item.pinCode)) return true;
      if (cleanDistrict && String(item.district || "").trim().toLowerCase() === cleanDistrict) return true;
      return false;
    });

  // OpenStreetMap live mapped items for searched PIN (strictly limited to the 6 shop categories)
  const liveMatched = cleanPin
    ? (liveDirectoryListings || []).map((item) => normalizeItem(item, "LIVE_DIRECTORY")).filter(Boolean)
    : [];

  // Submitter's own pending private submissions (NEVER mixed into public verified counts)
  const pendingOwn = (myPendingListings || [])
    .filter((item) => item && item.verificationStatus === "PENDING_REVIEW")
    .map((item) => normalizeItem(item, "MY_PENDING"))
    .filter(Boolean)
    .filter((item) => (!cleanPin || item.pinCode === cleanPin || surroundingSet.has(item.pinCode)));

  const matchesSearchOnly = (item) => {
    if (!q) return true;
    const catMeta = NEARBY_SERVICE_CATEGORY_MAP[item.category] || { en: "", bn: "" };
    const hay = [
      item.name, item.nameBn, item.address, item.area, item.district,
      item.pinCode, item.notes, catMeta.en, catMeta.bn
    ].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  };

  // Per-category counts across all 6 categories (after PIN & text search, before single-category selection)
  const allPublicBeforeCategory = [...verifiedMatched, ...liveMatched].filter(matchesSearchOnly);
  const categoryCounts = Object.fromEntries(NEARBY_SERVICE_CATEGORY_KEYS.map((k) => [k, 0]));
  for (const item of allPublicBeforeCategory) {
    if (Object.prototype.hasOwnProperty.call(categoryCounts, item.category)) {
      categoryCounts[item.category] += 1;
    }
  }

  const activeCategory = category === "ALL" || NEARBY_SERVICE_CATEGORY_SET.has(category) ? category : "ALL";
  const applyCategory = (list) => (activeCategory === "ALL" ? list : list.filter((item) => item.category === activeCategory));

  const combinedPublic = applyCategory(allPublicBeforeCategory)
    .sort((a, b) => {
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
    categoryCounts,
    totalBeforeCategory: allPublicBeforeCategory.length,
    myPendingResults: applyCategory(pendingOwn.filter(matchesSearchOnly))
  };
}

/**
 * Filters verified SHGs by PIN Code, Village / Locality, Block, District & keyword.
 */
export function filterShgListings({
  verifiedShgs = [],
  myPendingShgs = [],
  pinCode = "",
  surroundingPins = [],
  district = "ALL",
  block = "",
  village = "",
  search = "",
  userCoords = null
} = {}) {
  const cleanPin = String(pinCode || "").trim();
  const surroundingSet = new Set((surroundingPins || []).map((x) => (typeof x === "string" ? x : x?.pin)).filter(Boolean));
  const blockQ = String(block || "").trim().toLowerCase();
  const villageQ = String(village || "").trim().toLowerCase();
  const q = String(search || "").trim().toLowerCase();
  const hasUserGps = Boolean(userCoords && isValidIndiaCoordinate(userCoords.lat, userCoords.lng));

  const normalizeShg = (item) => {
    const dist = hasUserGps && isValidIndiaCoordinate(item.lat, item.lng)
      ? computeReliableDistanceKm(userCoords.lat, userCoords.lng, item.lat, item.lng)
      : null;
    return {
      ...item,
      village: String(item.village || item.area || "").trim(),
      gramPanchayat: String(item.gramPanchayat || "").trim(),
      block: String(item.block || "").trim(),
      approvalStatus: item.approvalStatus || (item.verificationStatus === "ADMIN_VERIFIED" ? "APPROVED" : item.verificationStatus === "REJECTED" ? "REJECTED" : "PENDING"),
      distanceKm: dist,
      distanceBasis: dist !== null ? "GPS" : "NONE"
    };
  };

  const matches = (item) => {
    if (!item) return false;
    if (district !== "ALL" && String(item.district || "").trim().toLowerCase() !== district.trim().toLowerCase()) return false;
    if (cleanPin && item.pinCode !== cleanPin && !surroundingSet.has(item.pinCode)) return false;
    if (blockQ) {
      const blkHay = [item.block, item.area, item.address].filter(Boolean).join(" ").toLowerCase();
      if (!blkHay.includes(blockQ)) return false;
    }
    if (villageQ) {
      const vilHay = [item.village, item.area, item.gramPanchayat, item.address].filter(Boolean).join(" ").toLowerCase();
      if (!vilHay.includes(villageQ)) return false;
    }
    if (q) {
      const hay = [
        item.shgName, item.shgNameBn, item.village, item.area, item.gramPanchayat,
        item.block, item.district, item.address, item.pinCode,
        ...(item.activities || []), ...(item.services || []), ...(item.products || []),
        item.entrepreneurshipInfo, item.govtSupport
      ].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  };

  const publicShgs = (verifiedShgs || [])
    .filter((s) => s && s.verificationStatus === "ADMIN_VERIFIED" && s.published === true)
    .map(normalizeShg)
    .filter(matches)
    .sort((a, b) => {
      const aExact = cleanPin && a.pinCode === cleanPin ? 0 : 1;
      const bExact = cleanPin && b.pinCode === cleanPin ? 0 : 1;
      return aExact - bExact;
    });

  const ownPending = (myPendingShgs || [])
    .filter((s) => s && s.verificationStatus === "PENDING_REVIEW")
    .map(normalizeShg)
    .filter(matches);

  return {
    exactPinShgs: cleanPin ? publicShgs.filter((s) => s.pinCode === cleanPin) : publicShgs,
    surroundingShgs: cleanPin ? publicShgs.filter((s) => s.pinCode !== cleanPin) : [],
    allShgs: publicShgs,
    myPendingShgs: ownPending
  };
}
