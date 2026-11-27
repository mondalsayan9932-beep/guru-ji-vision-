// ============================================================================
// GURU JI VISION — WOMEN FARMER NEARBY SERVICES, SHG SEARCH & ENTERPRISE UI
// ============================================================================
// 100% Free Services Architecture (India Post PIN API + OpenStreetMap +
// Leaflet.js interactive maps + Admin-Verified Firestore Directory).
// ZERO mandatory GOOGLE_PLACES_API_KEY or paid Google Maps dependency!
// Strictly rendered as sub-sections INSIDE Women Farmer Zone (NO new Main Zone):
// 1. Nearby Services (7 categories, India Post PIN lookup, Leaflet.js + OSM
//    Map View & List View, OSRM Directions, verified-coordinate distance only)
// 2. SHG Search (Search by PIN Code, Village, Block, District; full SHG
//    details including Gram Panchayat, Products/Services & Map/List Views)
// 3. Entrepreneurship & Financial Support (PMFME, Anandadhara, Women FPOs, KCC)
// ============================================================================

import { escapeHtml, safeUrl } from "./calculators.js";
import {
  WOMEN_FARMER_RIGHTS_INFO,
  WOMEN_OFFICIAL_HELPLINES
} from "./women-farmer-data.js";
import {
  NEARBY_SERVICE_CATEGORIES,
  NEARBY_SERVICE_CATEGORY_MAP,
  SHG_GOVT_SUPPORT_OPTIONS,
  WEST_BENGAL_PIN_HUBS,
  buildDirectionsUrl,
  buildMapExternalUrl,
  buildOsmEmbedUrl,
  filterNearbyListings,
  filterShgListings,
  getSurroundingPinSuggestions,
  getVerificationBadgeMeta,
  isValidIndiaCoordinate,
  validatePinCode
} from "./women-nearby-data.js";

// ----------------------------------------------------------------------------
// 1. NEARBY SERVICES SUB-VIEW (INDIA POST PIN + LEAFLET OSM MAP + 7 CATEGORIES)
// ----------------------------------------------------------------------------
export function renderWomenNearbyServicesSubView(state, lang) {
  const bn = lang === "BN";
  const nb = state.womenNearby || {};
  const pinInput = nb.pinInput || "";
  const activePin = nb.activePin || "";
  const category = nb.category || "ALL";
  const search = nb.search || "";
  const viewMode = nb.viewMode === "MAP" ? "MAP" : "LIST";
  const apiRes = nb.apiResult || null;
  const gpsCoords = nb.gpsCoords || null;
  const showSubmitForm = Boolean(nb.showSubmitForm);

  const verifiedShops = (state.nearbyServiceListings || []).filter(
    (x) => x.verificationStatus === "ADMIN_VERIFIED" && x.published
  );
  const resolvedDistrict = apiRes?.pinCode === activePin ? (apiRes?.postal?.district || "") : "";
  const surroundingPins = activePin
    ? getSurroundingPinSuggestions(activePin, verifiedShops, resolvedDistrict)
    : [];

  const pinCenterCoords = apiRes?.pinCode === activePin ? apiRes?.centerCoords : null;
  const originCoords = gpsCoords && isValidIndiaCoordinate(gpsCoords.lat, gpsCoords.lng)
    ? gpsCoords
    : (pinCenterCoords && isValidIndiaCoordinate(pinCenterCoords.lat, pinCenterCoords.lng) ? pinCenterCoords : null);

  const filtered = filterNearbyListings({
    verifiedListings: state.nearbyServiceListings || [],
    liveDirectoryListings: apiRes?.pinCode === activePin ? (apiRes.liveListings || []) : [],
    myPendingListings: state.myPendingNearbyListings || [],
    pinCode: activePin,
    surroundingPins,
    district: resolvedDistrict,
    category,
    search,
    userCoords: gpsCoords,
    pinCenterCoords
  });

  const pinCheck = activePin ? validatePinCode(activePin) : null;
  const selectedMapItem =
    filtered.allResults.find((x) => x.id === nb.selectedMapId) ||
    filtered.allResults.find((x) => isValidIndiaCoordinate(x.lat, x.lng)) ||
    null;

  const osmEmbed = buildOsmEmbedUrl(
    originCoords?.lat,
    originCoords?.lng,
    selectedMapItem?.lat,
    selectedMapItem?.lng
  );
  const mappedShopsCount = filtered.allResults.filter((x) => isValidIndiaCoordinate(x.lat, x.lng)).length;
  const mappedShgsCount = (state.shgDirectoryListings || []).filter(
    (s) => s.verificationStatus === "ADMIN_VERIFIED" && s.published && isValidIndiaCoordinate(s.lat, s.lng)
  ).length;
  const selectedDirUrl = selectedMapItem ? safeUrl(buildDirectionsUrl(selectedMapItem, originCoords)) : "";

  const activeCategoryMeta = category !== "ALL" ? (NEARBY_SERVICE_CATEGORY_MAP[category] || null) : null;

  return `
    <div data-wf-section="nearby-services" class="space-y-5">
      <!-- Header Banner -->
      <div class="rounded-2xl border border-emerald-200 bg-gradient-to-r from-[#ECFDF5] via-white to-[#F0FDF4] p-4 sm:p-5 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="space-y-1">
            <span class="inline-block px-2.5 py-0.5 rounded-full bg-[#14532D] text-white text-[10px] font-extrabold uppercase tracking-wider">
              ${bn ? "১০০% ফ্রি পরিষেবা • India Post + OpenStreetMap • ৬টি দোকান বিভাগ" : "100% Free Services • India Post + OpenStreetMap • 6 Shop Categories"}
            </span>
            <h3 class="font-display text-lg sm:text-xl font-bold text-[#14532D]">
              ${bn ? "নিকটবর্তী পরিষেবা (Nearby Services)" : "Nearby Services — 6 Local Shop Categories"}
            </h3>
            <p class="text-xs text-[#334155] leading-relaxed max-w-2xl">
              ${bn
                ? "৬ সংখ্যার পিন কোড লিখে ওষুধের দোকান, সারের দোকান, বীজের দোকান, কীটনাশকের দোকান, মুদিখানা দোকান এবং কৃষি যন্ত্রপাতির দোকান খুঁজুন। GPS বা কোনো পেইড Google Places API কী ছাড়াই সম্পূর্ণ কাজ করে।"
                : "Search Medical Stores, Fertilizer Shops, Seed Shops, Pesticide Shops, Grocery Shops, and Agricultural Equipment Shops by 6-digit PIN Code using India Post + OpenStreetMap. Works without GPS or paid API keys."}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button type="button" data-wf-tab="shg" class="min-h-[40px] px-3.5 py-2 rounded-xl bg-fuchsia-50 hover:bg-fuchsia-100 border border-fuchsia-200 text-fuchsia-950 text-xs font-extrabold">
              🤝 ${bn ? "SHG অনুসন্ধান দেখুন →" : "Go to SHG Search →"}
            </button>
            ${state.isAdmin ? `
              <button type="button" data-nav="admin" data-open-admin-sub="women-cms" data-open-wcms-section="nearby-admin" class="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0C3B20] text-xs font-extrabold">
                Admin Verify Listings ↗
              </button>
            ` : ""}
          </div>
        </div>
      </div>

      <!-- 6-Digit PIN Code Search Form (India Post API + GPS-Independent) -->
      <div class="gv-card p-4 sm:p-5 space-y-3.5">
        <form id="wfNearbyPinForm" class="flex flex-col sm:flex-row gap-2.5">
          <div class="flex-1">
            <label for="wfNearbyPinInput" class="block text-[11px] font-extrabold text-[#14532D] mb-1">
              ${bn ? "৬ সংখ্যার ভারতীয় পিন কোড লিখুন (যেমন: 741235, 713101, 722101)" : "Enter 6-Digit Indian PIN Code (e.g., 741235, 713101, 722101)"}
            </label>
            <input
              id="wfNearbyPinInput"
              type="text"
              inputmode="numeric"
              maxlength="6"
              value="${escapeHtml(pinInput)}"
              placeholder="${bn ? "৬ সংখ্যার পিন কোড (যেমন 741235)..." : "Enter 6-digit PIN Code (e.g. 741235)..."}"
              class="w-full px-3.5 py-2.5 min-h-[46px] rounded-xl border border-[#CDE0D3] text-sm font-bold tracking-wider bg-white"
            />
          </div>
          <div class="flex flex-wrap items-end gap-2">
            <button type="submit" ${nb.loading ? "disabled" : ""} class="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] disabled:opacity-60 text-white text-xs sm:text-sm font-extrabold">
              ${nb.loading ? (bn ? "খোঁজা হচ্ছে..." : "Looking up PIN...") : (bn ? "পিন কোড খুঁজুন" : "Search PIN Code")}
            </button>
            <button type="button" id="wfNearbyUseGpsBtn" class="min-h-[46px] px-3.5 py-2.5 rounded-xl bg-[#ECFDF5] hover:bg-[#DCFCE7] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">
              📍 ${bn ? "GPS (ঐচ্ছিক)" : "Optional GPS"}
            </button>
            ${activePin ? `
              <button type="button" data-wf-nearby-clear-pin="1" class="min-h-[46px] px-3 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-extrabold">
                ${bn ? "রিসেট" : "Clear"}
              </button>
            ` : ""}
          </div>
        </form>

        ${nb.loading ? `
          <div data-wf-pin-loading="1" class="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-bold text-[#14532D]">
            ⏳ ${bn ? `India Post থেকে পিন কোড ${escapeHtml(activePin)} এবং OpenStreetMap তথ্য যাচাই করা হচ্ছে...` : `Looking up PIN Code ${escapeHtml(activePin)} via India Post & OpenStreetMap...`}
          </div>
        ` : ""}

        ${nb.pinError ? `
          <div role="alert" data-wf-pin-error="1" class="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-bold text-rose-800">
            ${escapeHtml(nb.pinError)}
          </div>
        ` : ""}

        ${apiRes?.pinCode === activePin && apiRes?.postalNotFound ? `
          <div role="alert" data-wf-pin-not-found="1" class="rounded-xl bg-amber-50 border border-amber-300 px-3.5 py-2.5 text-xs font-bold text-amber-950">
            ⚠️ ${bn
              ? `India Post ডিরেক্টরিতে পিন কোড ${escapeHtml(activePin)} পাওয়া যায়নি। অনুগ্রহ করে সঠিক ৬ সংখ্যার পিন কোড যাচাই করুন।`
              : `PIN Code ${escapeHtml(activePin)} was not found in the India Post directory. Please double-check the 6-digit PIN Code (we never fabricate PIN details).`}
          </div>
        ` : ""}

        ${apiRes?.pinCode === activePin && !apiRes?.postalFound && !apiRes?.postalNotFound && apiRes?.postalError ? `
          <div data-wf-pin-network-warn="1" class="rounded-xl bg-sky-50 border border-sky-200 px-3.5 py-2 text-xs font-semibold text-sky-900">
            ℹ️ ${bn
              ? "India Post লাইভ সার্ভার সাময়িকভাবে উত্তর দেয়নি — আপনার যাচাইকৃত স্থানীয় তালিকা দেখানো হচ্ছে।"
              : "India Post live lookup is temporarily unreachable — showing verified Guru Ji Vision directory records."}
          </div>
        ` : ""}

        ${nb.gpsStatus ? `
          <div data-wf-gps-status="1" class="rounded-xl bg-sky-50 border border-sky-200 px-3.5 py-2 text-xs font-semibold text-sky-900">
            ${escapeHtml(nb.gpsStatus)}
          </div>
        ` : ""}

        <!-- Quick West Bengal District PIN Chips -->
        <div class="space-y-1.5">
          <div class="text-[11px] font-bold text-[#496052]">
            ${bn ? "পশ্চিমবঙ্গের প্রধান কৃষি জেলার যাচাইকৃত পিন কোড:" : "West Bengal Agricultural District PIN Codes:"}
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${WEST_BENGAL_PIN_HUBS.slice(0, 10).map((h) => `
              <button
                type="button"
                data-wf-quick-pin="${escapeHtml(h.pin)}"
                class="px-2.5 py-1.5 min-h-[34px] rounded-lg text-[11px] font-bold transition-colors ${
                  activePin === h.pin ? "bg-[#14532D] text-white" : "bg-[#F4F9F5] border border-[#CDE0D3] text-[#14532D] hover:bg-[#DCFCE7]"
                }"
              >${escapeHtml(h.pin)} • ${escapeHtml(bn ? h.areaBn : h.areaEn)}</button>
            `).join("")}
          </div>
        </div>

        <!-- Resolved India Post PIN Info Banner -->
        ${activePin && pinCheck?.valid ? `
          <div data-wf-postal-summary="1" class="rounded-xl bg-[#F8FBF8] border border-[#D9EAE0] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div class="space-y-1">
              <div class="font-extrabold text-[#14532D]">
                📮 ${bn ? `পিন কোড: ${escapeHtml(activePin)}` : `PIN Code: ${escapeHtml(activePin)}`}
                ${apiRes?.postal
                  ? ` • ${escapeHtml(apiRes.postal.district || "")}, ${escapeHtml(apiRes.postal.state || "")}`
                  : (apiRes?.postalNotFound
                      ? (bn ? " • India Post-এ পাওয়া যায়নি" : " • Not found in India Post")
                      : (pinCheck.isWestBengal ? " • West Bengal" : " • India"))}
              </div>
              ${apiRes?.postal?.postOffices?.length ? `
                <div class="text-[11px] text-[#334155]">
                  <strong>${bn ? "পোস্ট অফিস:" : "Post Office(s):"}</strong> ${escapeHtml(apiRes.postal.postOffices.slice(0, 6).join(", "))}
                  ${apiRes.postal.block ? ` • <strong>${bn ? "ব্লক:" : "Block:"}</strong> ${escapeHtml(apiRes.postal.block)}` : ""}
                </div>
              ` : ""}
              ${!pinCheck.isWestBengal && !apiRes?.postalNotFound ? `
                <div class="text-[11px] font-bold text-amber-800">
                  ${bn ? "দ্রষ্টব্য: বর্তমানে পশ্চিমবঙ্গের পিন কোডগুলো অগ্রাধিকার পাচ্ছে; তবুও এই পিন কোডের উপলব্ধ যাচাইকৃত তথ্য দেখানো হচ্ছে।" : "Note: West Bengal is currently prioritized; displaying available verified & OpenStreetMap records for this PIN."}
                </div>
              ` : ""}
            </div>
            <div class="inline-flex items-center gap-1 bg-white border border-[#CDE0D3] p-1 rounded-xl shrink-0">
              <button type="button" data-wf-nearby-view="LIST" class="px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-extrabold ${viewMode === "LIST" ? "bg-[#14532D] text-white" : "text-[#14532D]"}">
                ☰ ${bn ? "তালিকা" : "List View"}
              </button>
              <button type="button" data-wf-nearby-view="MAP" class="px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-extrabold ${viewMode === "MAP" ? "bg-[#14532D] text-white" : "text-[#14532D]"}">
                🗺️ ${bn ? "ম্যাপ" : "Map View"}
              </button>
            </div>
          </div>
        ` : `
          <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span class="text-[11px] font-semibold text-[#496052]">
              ${bn ? "৬ সংখ্যার পিন কোড খুঁজুন বা নিচের অ্যাডমিন-যাচাইকৃত তালিকা দেখুন।" : "Enter a 6-digit PIN Code above or browse verified West Bengal listings below."}
            </span>
            <div class="inline-flex items-center gap-1 bg-white border border-[#CDE0D3] p-1 rounded-xl shrink-0">
              <button type="button" data-wf-nearby-view="LIST" class="px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-extrabold ${viewMode === "LIST" ? "bg-[#14532D] text-white" : "text-[#14532D]"}">
                ☰ ${bn ? "তালিকা" : "List View"}
              </button>
              <button type="button" data-wf-nearby-view="MAP" class="px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-extrabold ${viewMode === "MAP" ? "bg-[#14532D] text-white" : "text-[#14532D]"}">
                🗺️ ${bn ? "ম্যাপ" : "Map View"}
              </button>
            </div>
          </div>
        `}

        <!-- Dedicated Selectable Cards for Exactly the 6 Nearby Services Shop Categories -->
        <div data-wf-nearby-cat-grid="1" class="space-y-2.5 pt-1">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="text-xs font-extrabold text-[#14532D]">
              ${bn ? "দোকানের বিভাগ নির্বাচন করুন (৬টি বিভাগ):" : "Select a Nearby Services Category (6 Shop Categories):"}
            </div>
            <button type="button" data-wf-nearby-cat="ALL" class="px-3 py-1.5 min-h-[34px] rounded-xl text-[11px] font-extrabold transition-colors ${
              category === "ALL" ? "bg-[#14532D] text-white shadow-sm" : "bg-[#F4F9F5] border border-[#CDE0D3] text-[#14532D] hover:bg-[#DCFCE7]"
            }">
              ${bn ? `সব ৬টি বিভাগ (${filtered.totalBeforeCategory ?? filtered.allResults.length})` : `All 6 Categories (${filtered.totalBeforeCategory ?? filtered.allResults.length})`}
            </button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            ${NEARBY_SERVICE_CATEGORIES.map((c) => {
              const isSelected = category === c.key;
              const catCount = filtered.categoryCounts?.[c.key] ?? 0;
              return `
                <button
                  type="button"
                  data-wf-nearby-cat="${escapeHtml(c.key)}"
                  data-wf-nearby-cat-card="${escapeHtml(c.key)}"
                  aria-pressed="${isSelected ? "true" : "false"}"
                  class="text-left p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-2 min-h-[104px] ${
                    isSelected
                      ? "bg-[#14532D] border-[#14532D] text-white shadow-md"
                      : "bg-white border-[#D9EAE0] hover:border-[#15803D] hover:bg-[#F8FBF8] text-[#132219]"
                  }"
                >
                  <div class="flex items-start justify-between gap-2">
                    <span class="text-xl leading-none" aria-hidden="true">${c.icon}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isSelected ? "bg-white/20 text-white" : "bg-[#ECFDF5] text-[#14532D] border border-[#BBF7D0]"
                    }">${catCount}</span>
                  </div>
                  <div class="space-y-0.5">
                    <div class="text-xs sm:text-sm font-extrabold leading-snug">${escapeHtml(bn ? c.bn : c.en)}</div>
                    <div class="text-[10px] leading-snug ${isSelected ? "text-[#DCFCE7]" : "text-[#496052]"}">${escapeHtml(bn ? c.descBn : c.descEn)}</div>
                  </div>
                </button>
              `;
            }).join("")}
          </div>
        </div>

        ${activeCategoryMeta ? `
          <div data-wf-active-cat-banner="${escapeHtml(activeCategoryMeta.key)}" class="rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div class="font-extrabold text-[#14532D]">
              ${activeCategoryMeta.icon} ${bn ? `নির্বাচিত বিভাগ: ${escapeHtml(activeCategoryMeta.bn)}` : `Viewing Category: ${escapeHtml(activeCategoryMeta.en)}`}
              <span class="font-bold text-[#15803D]">(${filtered.allResults.length})</span>
            </div>
            <button type="button" data-wf-nearby-cat="ALL" class="px-2.5 py-1 rounded-lg bg-white border border-[#CDE0D3] text-[#14532D] text-[11px] font-extrabold">
              ${bn ? "সব ৬টি বিভাগ দেখুন" : "Show All 6 Categories"}
            </button>
          </div>
        ` : ""}

        <input
          id="wfNearbySearch"
          type="search"
          value="${escapeHtml(search)}"
          placeholder="${activeCategoryMeta
            ? (bn ? `${activeCategoryMeta.bn} খুঁজুন (নাম, গ্রাম, বাজার বা রাস্তা)...` : `Search ${activeCategoryMeta.en} by shop name, village, market or road...`)
            : (bn ? "যেকোনো দোকানের নাম, এলাকা বা ঠিকানা দিয়ে খুঁজুন..." : "Search shops across all 6 categories by name, village, road or landmark...")}"
          class="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white"
        />
      </div>

      <!-- District-Verified Nearby PIN Code Suggestions (Never consecutive-number guessing) -->
      ${surroundingPins.length ? `
        <div data-wf-surrounding-pins="1" class="gv-card p-3.5 sm:p-4 space-y-2 bg-[#F8FBF8]">
          <div class="text-xs font-extrabold text-[#14532D]">
            ${bn ? `একই জেলার অন্যান্য ডাক পিন কোড (${escapeHtml(activePin)}):` : `Other Postal PIN Codes in the Same District (${escapeHtml(activePin)}):`}
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${surroundingPins.map((sp) => `
              <button type="button" data-wf-quick-pin="${escapeHtml(sp.pin)}" class="px-3 py-1.5 min-h-[36px] rounded-xl bg-white hover:bg-[#DCFCE7] border border-[#CDE0D3] text-[#14532D] text-xs font-extrabold">
                ${escapeHtml(sp.pin)}${sp.labelEn ? ` • ${escapeHtml(bn ? sp.labelBn : sp.labelEn)}` : ""}
              </button>
            `).join("")}
          </div>
          <p class="text-[10px] text-[#64748B]">
            ${bn
              ? "পিন কোডগুলো শুধুমাত্র যাচাইকৃত জেলা-ভিত্তিক ডাক অঞ্চল থেকে দেখানো হয়েছে; দূরত্ব শুধুমাত্র প্রকৃত স্থানাঙ্ক (Latitude/Longitude) থাকলে হিসাব করা হয়।"
              : "Suggestions come only from verified district postal hubs — never assumed nearby from consecutive PIN numbers. Distance is shown only when verified coordinates exist."}
          </p>
        </div>
      ` : ""}

      <!-- INTERACTIVE LEAFLET.JS + OPENSTREETMAP MAP VIEW -->
      ${viewMode === "MAP" ? `
        <section data-wf-nearby-map="1" class="gv-card p-4 sm:p-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 class="text-sm font-extrabold text-[#14532D]">
                🗺️ ${bn ? "ইন্টারঅ্যাক্টিভ ম্যাপ ভিউ (Leaflet.js + OpenStreetMap)" : "Interactive Map View (Leaflet.js + OpenStreetMap)"}
              </h4>
              <p class="text-[11px] text-[#496052]">
                ${selectedMapItem
                  ? `${bn ? "নির্বাচিত স্থান:" : "Focused:"} ${escapeHtml(selectedMapItem.name)} (${escapeHtml(selectedMapItem.pinCode)})`
                  : (bn
                      ? `ম্যাপে যাচাইকৃত স্থানাঙ্কযুক্ত দোকান (${mappedShopsCount}) ও SHG (${mappedShgsCount}) দেখানো হচ্ছে।`
                      : `Displaying mapped shops (${mappedShopsCount}) and verified SHGs (${mappedShgsCount}) with real coordinates.`)}
              </p>
            </div>
            ${selectedDirUrl ? `
              <a href="${escapeHtml(selectedDirUrl)}" target="_blank" rel="noopener noreferrer" class="min-h-[38px] inline-flex items-center px-3.5 py-1.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">
                🧭 ${bn ? "OpenStreetMap দিকনির্দেশ ↗" : "OSM Directions ↗"}
              </a>
            ` : (selectedMapItem ? `
              <span class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold">
                ${bn ? "রুট অনুপলব্ধ (স্থানাঙ্ক নেই)" : "Route unavailable (no verified coordinates)"}
              </span>
            ` : "")}
          </div>

          <div class="flex flex-wrap items-center gap-3 text-[11px] font-bold text-[#475569]">
            <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[#22C55E] border border-[#14532D]"></span>${bn ? "যাচাইকৃত দোকান" : "Verified Shop"}</span>
            <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[#38BDF8] border border-[#0369A1]"></span>${bn ? "OSM ডিরেক্টরি" : "OSM Directory"}</span>
            <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-[#D946EF] border border-[#701A75]"></span>${bn ? "যাচাইকৃত SHG" : "Verified SHG"}</span>
          </div>

          <div
            id="wfNearbyLeafletMap"
            data-wf-leaflet-map="nearby"
            class="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-[#CDE0D3] bg-[#EDF4EE] relative z-0"
          >
            ${osmEmbed ? `
              <iframe
                src="${escapeHtml(osmEmbed)}"
                title="${bn ? "নিকটবর্তী পরিষেবা ম্যাপ" : "Nearby Services OpenStreetMap"}"
                class="w-full h-full"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            ` : `
              <div class="w-full h-full flex items-center justify-center p-6 text-center text-xs font-bold text-[#14532D]">
                ${bn
                  ? "ম্যাপে অবস্থান দেখতে উপরে একটি ৬ সংখ্যার পিন কোড খুঁজুন অথবা স্থানাঙ্কযুক্ত যাচাইকৃত দোকান নির্বাচন করুন।"
                  : "Enter a 6-digit PIN Code above or add verified shop/SHG coordinates to view markers on OpenStreetMap."}
              </div>
            `}
          </div>

          <p class="text-[10px] text-[#64748B]">
            ${bn
              ? "ম্যাপ টাইল ও রাউটিং: © OpenStreetMap contributors (OSRM)। পাবলিক OpenStreetMap সার্ভারের নীতি মেনে সীমিত হারে ব্যবহৃত হয়।"
              : "Map tiles & routing: © OpenStreetMap contributors (FOSSGIS OSRM). Public OSM tile/routing services are subject to fair-use rate limits."}
          </p>
        </section>
      ` : ""}

      <!-- RESULTS LIST (OR HONEST EMPTY STATE) -->
      ${filtered.allResults.length === 0 ? `
        <div data-wf-nearby-empty="1" class="gv-card p-6 sm:p-8 text-center space-y-3">
          <div class="text-2xl" aria-hidden="true">📍</div>
          <h4 class="text-sm sm:text-base font-extrabold text-[#14532D]">
            ${activePin
              ? (bn
                  ? `পিন কোড ${escapeHtml(activePin)}-এ এখনো কোনো যাচাইকৃত তালিকা পাওয়া যায়নি`
                  : `No verified listings are currently available for PIN Code ${escapeHtml(activePin)}`)
              : (bn
                  ? "এখনো কোনো যাচাইকৃত স্থানীয় পরিষেবা যোগ করা হয়নি"
                  : "Enter a 6-digit West Bengal PIN Code above to search nearby services")}
          </h4>
          <p class="text-xs text-[#475569] max-w-xl mx-auto leading-relaxed">
            ${bn
              ? "আমরা কখনোই ভুয়া দোকানের নাম, ঠিকানা, ফোন নম্বর বা স্থানাঙ্ক তৈরি করি না। আপনার এলাকার প্রকৃত দোকান অ্যাডমিন যাচাইকরণের জন্য জমা দিন।"
              : "Guru Ji Vision never fabricates shop names, addresses, phone numbers, or coordinates. Try another verified district PIN Code above, or submit a genuine local business below for Admin approval."}
          </p>
          <div class="flex flex-wrap justify-center gap-2 pt-1">
            <button type="button" data-wf-toggle-nearby-submit="1" class="min-h-[42px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
              + ${bn ? "স্থানীয় দোকান জমা দিন (অ্যাডমিন অনুমোদন)" : "Submit Local Business for Admin Approval"}
            </button>
          </div>
        </div>
      ` : `
        <div class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="text-xs font-extrabold text-[#14532D]">
              ${bn
                ? `মোট ${filtered.allResults.length}টি ফলাফল (${filtered.exactPinResults.length}টি এই পিন কোডে, ${filtered.surroundingResults.length}টি জেলার অন্যান্য পিনে)`
                : `Showing ${filtered.allResults.length} listing(s) (${filtered.exactPinResults.length} in exact PIN, ${filtered.surroundingResults.length} in same district)`}
            </div>
            <button type="button" data-wf-toggle-nearby-submit="1" class="px-3.5 py-2 min-h-[38px] rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">
              + ${bn ? "নতুন দোকান জমা দিন" : "Submit Local Shop"}
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${filtered.allResults.map((item) => renderNearbyBusinessCard(item, bn, viewMode, originCoords)).join("")}
          </div>
        </div>
      `}

      <!-- Submitter's Own Pending Unverified Submissions (Private to Submitter & Admin) -->
      ${filtered.myPendingResults.length ? `
        <section class="gv-card p-4 sm:p-5 border-amber-300 bg-amber-50/50 space-y-3">
          <div class="text-xs sm:text-sm font-extrabold text-amber-950">
            ⏳ ${bn ? `আপনার জমা দেওয়া তালিকা (${filtered.myPendingResults.length}) — অ্যাডমিন অনুমোদনের অপেক্ষায়` : `Your Private Pending Submissions (${filtered.myPendingResults.length}) — Awaiting Admin Approval`}
          </div>
          <p class="text-[11px] text-amber-900">
            ${bn ? "অ্যাডমিন যাচাই ও প্রকাশ না করা পর্যন্ত এগুলো ব্যক্তিগত থাকবে এবং অন্য কেউ দেখতে পাবে না।" : "Protected by Firestore security rules: only you and authorized Admins can view pending entries until approved & published."}
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${filtered.myPendingResults.map((item) => renderNearbyBusinessCard(item, bn, "LIST", null)).join("")}
          </div>
        </section>
      ` : ""}

      <!-- Contributor Submission Form (Strictly PENDING_REVIEW until Admin approves) -->
      ${showSubmitForm ? renderNearbyContributorForm(state, lang, activePin) : ""}

      <!-- Transparent Free Data Sources & Optional Future Configuration Note -->
      <details class="gv-card p-4 text-xs text-[#496052]">
        <summary class="font-extrabold text-[#14532D] cursor-pointer">
          ℹ️ ${bn ? "ফ্রি তথ্যের উৎস ও যাচাইকরণ নীতি (India Post + OpenStreetMap)" : "Free Data Sources, OSM Usage Policy & Optional Future Places Configuration"}
        </summary>
        <div class="mt-2.5 space-y-1.5 leading-relaxed">
          <p>${escapeHtml(apiRes?.apiInfo?.setupHint || "Running 100% on free services: India Post PIN Code API + OpenStreetMap (Leaflet.js tiles & OSRM routing) + Admin-Verified Firestore Directory. No paid Google Maps or GOOGLE_PLACES_API_KEY is required.")}</p>
          <p>${bn
            ? "ভবিষ্যতে চাইলে Netlify Environment Variables-এ ঐচ্ছিক সার্ভার-সাইড GOOGLE_PLACES_API_KEY যোগ করা যাবে — এটি ছাড়াই অ্যাপ সম্পূর্ণভাবে কাজ করে।"
            : "Optional future support: GOOGLE_PLACES_API_KEY is never required and never blocks deployment; if configured later as a server-side Netlify Environment Variable, it enriches results automatically."}</p>
        </div>
      </details>
    </div>
  `;
}

function renderNearbyBusinessCard(item, bn, viewMode, originCoords) {
  const cat = NEARBY_SERVICE_CATEGORY_MAP[item.category] || { en: item.category, bn: item.category, icon: "📍" };
  const badge = getVerificationBadgeMeta(item.verificationStatus);
  const hasCoords = isValidIndiaCoordinate(item.lat, item.lng);
  const dirUrl = hasCoords ? safeUrl(buildDirectionsUrl(item, originCoords)) : "";
  const mapUrl = safeUrl(buildMapExternalUrl(item));
  const isVerified = item.verificationStatus === "ADMIN_VERIFIED";
  const showPhone = Boolean(item.phone) && (isVerified || item.verificationStatus === "OSM_DIRECTORY" || item.verificationStatus === "GOOGLE_PLACES" || item.sourceTag === "MY_PENDING");
  const cleanTel = String(item.phone || "").replace(/[^+\d]/g, "");

  return `
    <article data-wf-nearby-card="${escapeHtml(item.id || "")}" class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-3">
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold ${escapeHtml(badge.cls)}">
            ${escapeHtml(bn ? badge.bn : badge.en)}
          </span>
          <span class="px-2 py-0.5 rounded-full bg-[#EDF4EE] text-[#14532D] text-[10px] font-bold">
            ${cat.icon} ${escapeHtml(bn ? cat.bn : cat.en)}
          </span>
          <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
            PIN ${escapeHtml(item.pinCode || "—")}
          </span>
          ${item.distanceKm !== null && item.distanceKm !== undefined ? `
            <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-extrabold">
              📏 ~${escapeHtml(String(item.distanceKm))} km (${item.distanceBasis === "GPS" ? (bn ? "GPS" : "GPS") : (bn ? "পিন কেন্দ্র" : "PIN centre")})
            </span>
          ` : ""}
        </div>

        <div>
          <h4 class="text-sm sm:text-base font-extrabold text-[#132219] leading-snug">
            ${escapeHtml(bn && item.nameBn ? item.nameBn : item.name)}
          </h4>
          ${item.nameBn && item.nameBn !== item.name ? `<div class="text-xs text-[#496052]">${escapeHtml(bn ? item.name : item.nameBn)}</div>` : ""}
        </div>

        <p class="text-xs text-[#334155] leading-relaxed">
          📍 ${escapeHtml(item.address || "")}${item.district ? `, ${escapeHtml(item.district)}` : ""}${item.pinCode ? ` - ${escapeHtml(item.pinCode)}` : ""}
        </p>

        ${showPhone ? `
          <div class="text-xs font-bold text-[#14532D]">
            📞 ${cleanTel ? `<a href="tel:${escapeHtml(cleanTel)}" class="underline">${escapeHtml(item.phone)}</a>` : escapeHtml(item.phone)}
            ${isVerified ? `<span class="ml-1 text-[10px] text-emerald-700">(${bn ? "যাচাইকৃত" : "Verified"})</span>` : ""}
          </div>
        ` : ""}

        ${item.notes ? `<p class="text-[11px] text-[#496052]">${escapeHtml(item.notes)}</p>` : ""}

        <div class="flex flex-wrap items-center gap-2 text-[10px] text-[#64748B]">
          ${item.approvalStatus ? `<span>${bn ? "অনুমোদন:" : "Approval:"} <strong>${escapeHtml(item.approvalStatus)}</strong></span>` : ""}
          ${item.lastVerifiedDate ? `<span>• ${bn ? "যাচাই:" : "Verified:"} ${escapeHtml(item.lastVerifiedDate)}</span>` : ""}
          ${!hasCoords ? `<span>• ${bn ? "স্থানাঙ্ক যোগ করা হয়নি" : "Coordinates unavailable"}</span>` : ""}
        </div>
      </div>

      <div class="flex flex-wrap gap-2 pt-2 border-t border-[#EDF4EE]">
        ${dirUrl ? `
          <a href="${escapeHtml(dirUrl)}" target="_blank" rel="noopener noreferrer" class="flex-1 min-h-[40px] inline-flex items-center justify-center px-3 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
            🧭 ${bn ? "OSM দিকনির্দেশ ↗" : "OSM Directions ↗"}
          </a>
        ` : `
          <span class="flex-1 min-h-[40px] inline-flex items-center justify-center px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold">
            ${bn ? "রুট অনুপলব্ধ (স্থানাঙ্ক নেই)" : "Route unavailable (no coords)"}
          </span>
        `}
        ${hasCoords ? `
          <button type="button" data-wf-focus-map="${escapeHtml(item.id || "")}" class="min-h-[40px] px-3 py-2 rounded-xl bg-[#ECFDF5] hover:bg-[#DCFCE7] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">
            🗺️ ${viewMode === "MAP" ? (bn ? "ম্যাপে দেখুন" : "Focus Map") : (bn ? "ম্যাপ ভিউ" : "Map")}
          </button>
        ` : (mapUrl ? `
          <a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer" class="min-h-[40px] inline-flex items-center px-3 py-2 rounded-xl bg-[#EDF4EE] text-[#14532D] text-xs font-extrabold">
            🗺️ OSM Search ↗
          </a>
        ` : "")}
      </div>
    </article>
  `;
}

function renderNearbyContributorForm(state, lang, activePin) {
  const bn = lang === "BN";
  return `
    <section class="gv-card p-5 border-2 border-[#14532D]/30 space-y-3 animate-fade-up">
      <div class="flex items-center justify-between gap-2">
        <div>
          <h4 class="text-sm sm:text-base font-extrabold text-[#14532D]">
            ${bn ? "স্থানীয় দোকান জমা দিন (অ্যাডমিন অনুমোদন সাপেক্ষে)" : "Submit a Local Shop (Admin Approval Required)"}
          </h4>
          <p class="text-[11px] text-[#496052]">
            ${bn ? "জমা দেওয়া তথ্য ব্যক্তিগত ও অপেক্ষমাণ থাকবে এবং অ্যাডমিন অনুমোদনের পরই জনসাধারণের তালিকায় প্রকাশিত হবে।" : "Submitted records stay strictly private & pending until an authorized Admin verifies and publishes them."}
          </p>
        </div>
        <button type="button" data-wf-toggle-nearby-submit="1" class="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-bold">✕</button>
      </div>

      ${!state.user ? `
        <div class="rounded-xl bg-amber-50 border border-amber-200 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span class="font-bold text-amber-950">${bn ? "নতুন তালিকা জমা দিতে অনুগ্রহ করে সাইন ইন করুন।" : "Please sign in with your account to submit a local business listing."}</span>
          <button type="button" data-action="open-auth" class="px-3.5 py-2 rounded-xl bg-[#14532D] text-white font-extrabold">${bn ? "সাইন ইন করুন" : "Sign In"}</button>
        </div>
      ` : `
        <form id="wfNearbySubmitForm" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input id="wfNbName" type="text" required minlength="2" maxlength="140" placeholder="${bn ? "দোকান বা সংস্থার নাম (English) *" : "Business / Organization Name *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          <input id="wfNbNameBn" type="text" maxlength="180" placeholder="${bn ? "বাংলা নাম (ঐচ্ছিক)" : "Bengali Name (optional)"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          <select id="wfNbCategory" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
            ${NEARBY_SERVICE_CATEGORIES.map((c) => `<option value="${escapeHtml(c.key)}">${escapeHtml(bn ? c.bn : c.en)}</option>`).join("")}
          </select>
          <input id="wfNbPin" type="text" inputmode="numeric" required maxlength="6" pattern="[1-9][0-9]{5}" value="${escapeHtml(activePin)}" placeholder="${bn ? "৬ সংখ্যার পিন কোড *" : "6-Digit PIN Code *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm font-bold" />
          <input id="wfNbAddress" type="text" required minlength="3" maxlength="280" placeholder="${bn ? "সম্পূর্ণ ঠিকানা (গ্রাম/রাস্তা/বাজার) *" : "Full Address (Village / Market / Road) *"}" class="sm:col-span-2 px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          <input id="wfNbArea" type="text" maxlength="120" placeholder="${bn ? "এলাকা / ব্লক" : "Area / Block"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfNbDistrict" type="text" required minlength="2" maxlength="80" value="Nadia" placeholder="${bn ? "জেলা *" : "District *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfNbPhone" type="tel" maxlength="32" placeholder="${bn ? "ফোন নম্বর (যাচাইকৃত ও প্রকাশের অনুমতি থাকলে)" : "Contact Number (only if authorized to share)"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfNbNotes" type="text" maxlength="500" placeholder="${bn ? "অতিরিক্ত তথ্য (যেমন: সকাল ৯টা–রাত ৮টা)" : "Services / Timings (optional)"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <div class="sm:col-span-2">
            <button type="submit" class="w-full min-h-[44px] py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">
              ${bn ? "অ্যাডমিন অনুমোদনের জন্য জমা দিন" : "Submit for Admin Approval"}
            </button>
          </div>
        </form>
      `}
    </section>
  `;
}

// ----------------------------------------------------------------------------
// 2. DEDICATED SHG SEARCH SUB-VIEW (PIN, VILLAGE, BLOCK, DISTRICT + MAP/LIST)
// ----------------------------------------------------------------------------
export function renderWomenShgDiscoverySubView(state, lang) {
  const bn = lang === "BN";
  const nb = state.womenNearby || {};
  const shgPin = nb.shgPin || "";
  const shgDistrict = nb.shgDistrict || "ALL";
  const shgBlock = nb.shgBlock || "";
  const shgVillage = nb.shgVillage || "";
  const shgSearch = nb.shgSearch || "";
  const shgViewMode = nb.shgViewMode === "MAP" ? "MAP" : "LIST";
  const showShgSubmit = Boolean(nb.showShgSubmitForm);
  const gpsCoords = nb.gpsCoords || null;

  const verifiedShgs = (state.shgDirectoryListings || []).filter(
    (x) => x.verificationStatus === "ADMIN_VERIFIED" && x.published
  );
  const validPin = validatePinCode(shgPin);
  const surroundingPins = validPin.valid
    ? getSurroundingPinSuggestions(validPin.pin, verifiedShgs, shgDistrict !== "ALL" ? shgDistrict : "")
    : [];

  const filtered = filterShgListings({
    verifiedShgs: state.shgDirectoryListings || [],
    myPendingShgs: state.myPendingShgListings || [],
    pinCode: validPin.valid ? validPin.pin : "",
    surroundingPins,
    district: shgDistrict,
    block: shgBlock,
    village: shgVillage,
    search: shgSearch,
    userCoords: gpsCoords
  });

  const wbDistricts = Array.from(
    new Set([
      ...WEST_BENGAL_PIN_HUBS.map((h) => h.district),
      ...verifiedShgs.map((s) => s.district).filter(Boolean)
    ])
  ).sort();

  const mappedShgs = filtered.allShgs.filter((s) => isValidIndiaCoordinate(s.lat, s.lng));
  const selectedShg = mappedShgs.find((s) => s.id === nb.selectedShgMapId) || mappedShgs[0] || null;
  const osmEmbed = selectedShg ? buildOsmEmbedUrl(selectedShg.lat, selectedShg.lng, selectedShg.lat, selectedShg.lng) : "";

  return `
    <div data-wf-section="shg-search" class="space-y-5">
      <div class="rounded-2xl border border-fuchsia-200 bg-gradient-to-r from-[#FDF4FF] via-white to-[#ECFDF5] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="space-y-1">
          <span class="inline-block px-2.5 py-0.5 rounded-full bg-fuchsia-800 text-white text-[10px] font-extrabold uppercase tracking-wider">
            ${bn ? "স্বনির্ভর গোষ্ঠী (SHG) অনুসন্ধান • পশ্চিমবঙ্গ" : "Verified SHG Discovery • West Bengal"}
          </span>
          <h3 class="font-display text-lg sm:text-xl font-bold text-[#14532D]">
            ${bn ? "নারী স্বনির্ভর গোষ্ঠী (SHG) ও উৎপাদক দল খুঁজুন" : "Self Help Group (SHG) Search — PIN, Village, Block & District"}
          </h3>
          <p class="text-xs text-[#334155] leading-relaxed max-w-2xl">
            ${bn
              ? "পিন কোড, গ্রাম/এলাকা, গ্রাম পঞ্চায়েত, ব্লক ও জেলা অনুযায়ী অ্যাডমিন-যাচাইকৃত নারী স্বনির্ভর গোষ্ঠী (SHG), প্রধান কার্যক্রম, পণ্য/পরিষেবা এবং যাচাইকৃত যোগাযোগ খুঁজুন।"
              : "Search Admin-verified Women Self Help Groups by PIN Code, Village, Block, or District — including Gram Panchayat, verified contact details, main activities, products/services & OpenStreetMap location."}
          </p>
        </div>
        <div class="flex flex-wrap gap-2 shrink-0">
          <button type="button" data-wf-toggle-shg-submit="1" class="min-h-[42px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
            + ${bn ? "SHG নথিভুক্তির আবেদন" : "Submit an SHG"}
          </button>
          ${state.isAdmin ? `
            <button type="button" data-nav="admin" data-open-admin-sub="women-cms" data-open-wcms-section="shg-admin" class="min-h-[42px] px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0C3B20] text-xs font-extrabold">
              Admin Manage SHGs ↗
            </button>
          ` : ""}
        </div>
      </div>

      <!-- SHG Search Controls: PIN Code, District, Block, Village & Keyword + List/Map Toggle -->
      <div class="gv-card p-4 space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label class="block">
            <span class="text-[11px] font-bold text-[#496052]">${bn ? "৬ সংখ্যার পিন কোড" : "PIN Code"}</span>
            <input id="wfShgPinInput" type="text" inputmode="numeric" maxlength="6" value="${escapeHtml(shgPin)}" placeholder="${bn ? "যেমন: 741249" : "e.g., 741249"}" class="mt-1 w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm font-bold bg-white" />
          </label>
          <label class="block">
            <span class="text-[11px] font-bold text-[#496052]">${bn ? "জেলা (District)" : "District"}</span>
            <select id="wfShgDistrict" class="mt-1 w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white">
              <option value="ALL">${bn ? "সকল জেলা" : "All Districts"}</option>
              ${wbDistricts.map((d) => `<option value="${escapeHtml(d)}" ${shgDistrict === d ? "selected" : ""}>${escapeHtml(d)}</option>`).join("")}
            </select>
          </label>
          <label class="block">
            <span class="text-[11px] font-bold text-[#496052]">${bn ? "ব্লক (Block)" : "Block"}</span>
            <input id="wfShgBlockInput" type="search" value="${escapeHtml(shgBlock)}" placeholder="${bn ? "যেমন: Haringhata, Memari..." : "e.g., Haringhata, Memari..."}" class="mt-1 w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white" />
          </label>
          <label class="block">
            <span class="text-[11px] font-bold text-[#496052]">${bn ? "গ্রাম / এলাকা (Village / Locality)" : "Village / Locality"}</span>
            <input id="wfShgVillageInput" type="search" value="${escapeHtml(shgVillage)}" placeholder="${bn ? "গ্রাম বা গ্রাম পঞ্চায়েত..." : "Village or Gram Panchayat..."}" class="mt-1 w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white" />
          </label>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <input id="wfShgSearchInput" type="search" value="${escapeHtml(shgSearch)}" placeholder="${bn ? "SHG-র নাম, কার্যক্রম, পণ্য বা সরকারি সহায়তা দিয়ে খুঁজুন..." : "Search by SHG name, main activities, products or services..."}" class="flex-1 px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white" />
          <div class="inline-flex items-center gap-1 bg-[#F8FBF8] border border-[#CDE0D3] p-1 rounded-xl shrink-0">
            <button type="button" data-wf-shg-view="LIST" class="px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-extrabold ${shgViewMode === "LIST" ? "bg-fuchsia-800 text-white" : "text-[#14532D]"}">
              ☰ ${bn ? "তালিকা" : "List View"}
            </button>
            <button type="button" data-wf-shg-view="MAP" class="px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-extrabold ${shgViewMode === "MAP" ? "bg-fuchsia-800 text-white" : "text-[#14532D]"}">
              🗺️ ${bn ? "ম্যাপ" : "Map View"}
            </button>
          </div>
        </div>
      </div>

      ${shgPin && !validPin.valid ? `
        <div role="alert" class="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-800">
          ${escapeHtml(bn ? validPin.errorBn : validPin.errorEn)}
        </div>
      ` : ""}

      ${surroundingPins.length ? `
        <div class="flex flex-wrap items-center gap-1.5 text-xs">
          <span class="font-bold text-[#496052]">${bn ? "একই জেলার অন্যান্য পিন:" : "Same-District PINs:"}</span>
          ${surroundingPins.slice(0, 6).map((sp) => `
            <button type="button" data-wf-shg-quick-pin="${escapeHtml(sp.pin)}" class="px-2.5 py-1 rounded-lg bg-[#EDF4EE] hover:bg-[#DCFCE7] text-[#14532D] font-extrabold">${escapeHtml(sp.pin)}</button>
          `).join("")}
        </div>
      ` : ""}

      <!-- SHG INTERACTIVE LEAFLET.JS OPENSTREETMAP VIEW -->
      ${shgViewMode === "MAP" ? `
        <section data-wf-shg-map="1" class="gv-card p-4 sm:p-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 class="text-sm font-extrabold text-[#14532D]">🗺️ ${bn ? "যাচাইকৃত SHG ম্যাপ (OpenStreetMap)" : "Verified SHG Locations (Leaflet.js + OpenStreetMap)"}</h4>
              <p class="text-[11px] text-[#496052]">
                ${mappedShgs.length
                  ? `${bn ? `ম্যাপে ${mappedShgs.length}টি যাচাইকৃত SHG দেখানো হচ্ছে।` : `Showing ${mappedShgs.length} verified SHG location(s) with coordinates.`}`
                  : (bn ? "বর্তমান ফিল্টারে স্থানাঙ্কযুক্ত কোনো যাচাইকৃত SHG নেই।" : "No verified SHGs with map coordinates match this filter yet.")}
              </p>
            </div>
          </div>
          <div
            id="wfShgLeafletMap"
            data-wf-leaflet-map="shg"
            class="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-[#CDE0D3] bg-[#EDF4EE] relative z-0"
          >
            ${osmEmbed ? `
              <iframe src="${escapeHtml(osmEmbed)}" title="SHG OpenStreetMap" class="w-full h-full" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            ` : `
              <div class="w-full h-full flex items-center justify-center p-6 text-center text-xs font-bold text-[#496052]">
                ${bn ? "স্থানাঙ্কযুক্ত যাচাইকৃত SHG যোগ হলে এখানে OpenStreetMap মার্কার দেখা যাবে।" : "Verified SHG locations with coordinates will appear as interactive markers on OpenStreetMap."}
              </div>
            `}
          </div>
        </section>
      ` : ""}

      <!-- Verified SHG Cards OR Honest Empty State -->
      ${filtered.allShgs.length === 0 ? `
        <div data-wf-shg-empty="1" class="gv-card p-6 sm:p-8 text-center space-y-3">
          <div class="text-2xl" aria-hidden="true">🤝</div>
          <h4 class="text-sm sm:text-base font-extrabold text-[#14532D]">
            ${validPin.valid
              ? (bn ? `পিন ${escapeHtml(validPin.pin)}-এ এখনো কোনো অ্যাডমিন-যাচাইকৃত SHG তালিকা নেই` : `No Admin-verified SHG listings are currently available for PIN ${escapeHtml(validPin.pin)}`)
              : (bn ? "আপনার খোঁজার সাথে মিলে এমন কোনো যাচাইকৃত SHG এখনো নেই" : "No verified SHG listings match your filter yet")}
          </h4>
          <p class="text-xs text-[#475569] max-w-xl mx-auto leading-relaxed">
            ${bn
              ? "আমরা কখনোই ভুয়া SHG-র নাম, ঠিকানা বা ফোন নম্বর তৈরি করি না। আপনার গ্রামের স্বীকৃত আনন্দধারা / DAY-NRLM স্বনির্ভর গোষ্ঠীর তথ্য জমা দিন — অ্যাডমিন যাচাই ও অনুমোদনের পর এখানে প্রকাশিত হবে।"
              : "We never fabricate SHG names, addresses, or phone numbers. Submit your recognized Anandadhara / DAY-NRLM Women SHG for Admin approval, or verify village Sanghas via official WBSRLM / DAY-NRLM portals."}
          </p>
          <div class="flex flex-wrap justify-center gap-2">
            <button type="button" data-wf-toggle-shg-submit="1" class="min-h-[42px] px-4 py-2 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">
              + ${bn ? "প্রকৃত SHG জমা দিন" : "Submit Verified SHG"}
            </button>
            <a href="https://aajeevika.gov.in/" target="_blank" rel="noopener noreferrer" class="min-h-[42px] inline-flex items-center px-4 py-2 rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">
              DAY-NRLM / Anandadhara Portal ↗
            </a>
          </div>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${filtered.allShgs.map((shg) => renderShgCard(shg, bn, gpsCoords)).join("")}
        </div>
      `}

      ${filtered.myPendingShgs.length ? `
        <section class="gv-card p-4 border-amber-300 bg-amber-50/50 space-y-3">
          <div class="text-xs font-extrabold text-amber-950">
            ⏳ ${bn ? `আপনার জমা দেওয়া SHG (${filtered.myPendingShgs.length}) — অ্যাডমিন অনুমোদনের অপেক্ষায়` : `Your Private Pending SHG Submissions (${filtered.myPendingShgs.length}) — Awaiting Admin Approval`}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${filtered.myPendingShgs.map((shg) => renderShgCard(shg, bn, null)).join("")}
          </div>
        </section>
      ` : ""}

      ${showShgSubmit ? renderShgContributorForm(state, lang, validPin.valid ? validPin.pin : "") : ""}
    </div>
  `;
}

function renderShgCard(shg, bn, originCoords) {
  const badge = getVerificationBadgeMeta(shg.verificationStatus);
  const isVerified = shg.verificationStatus === "ADMIN_VERIFIED";
  const cleanTel = String(shg.contactPhone || "").replace(/[^+\d]/g, "");
  const hasCoords = isValidIndiaCoordinate(shg.lat, shg.lng);
  const dirUrl = hasCoords ? safeUrl(buildDirectionsUrl(shg, originCoords)) : "";
  const productsOrServices = [...(shg.products || []), ...(shg.services || [])].filter(Boolean);

  return `
    <article data-wf-shg-card="${escapeHtml(shg.id || "")}" class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-3">
      <div class="space-y-2.5">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold ${escapeHtml(badge.cls)}">
            ${escapeHtml(bn ? badge.bn : badge.en)}
          </span>
          <span class="px-2 py-0.5 rounded-full bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-900 text-[10px] font-bold">
            PIN ${escapeHtml(shg.pinCode || "—")} • ${escapeHtml(shg.district || "West Bengal")}
          </span>
          ${shg.distanceKm !== null && shg.distanceKm !== undefined ? `
            <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-extrabold">
              📏 ~${escapeHtml(String(shg.distanceKm))} km
            </span>
          ` : ""}
        </div>

        <div>
          <h4 class="text-base font-extrabold text-[#132219] leading-snug">${escapeHtml(bn && shg.shgNameBn ? shg.shgNameBn : shg.shgName)}</h4>
          ${shg.shgNameBn && shg.shgNameBn !== shg.shgName ? `<div class="text-xs text-[#496052]">${escapeHtml(bn ? shg.shgName : shg.shgNameBn)}</div>` : ""}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#334155] bg-[#F8FBF8] border border-[#E2ECE5] rounded-xl p-2.5">
          <div><strong class="text-[#14532D]">${bn ? "গ্রাম/এলাকা:" : "Village / Locality:"}</strong> ${escapeHtml(shg.village || shg.area || "—")}</div>
          <div><strong class="text-[#14532D]">${bn ? "গ্রাম পঞ্চায়েত:" : "Gram Panchayat:"}</strong> ${escapeHtml(shg.gramPanchayat || "—")}</div>
          <div><strong class="text-[#14532D]">${bn ? "ব্লক:" : "Block:"}</strong> ${escapeHtml(shg.block || "—")}</div>
          <div><strong class="text-[#14532D]">${bn ? "জেলা ও পিন:" : "District & PIN:"}</strong> ${escapeHtml(shg.district || "—")} (${escapeHtml(shg.pinCode || "—")})</div>
        </div>

        ${shg.address ? `<p class="text-xs text-[#475569]">📍 ${escapeHtml(shg.address)}</p>` : ""}

        ${(shg.contactName || shg.contactPhone) ? `
          <div class="rounded-xl bg-[#F8FBF8] border border-[#E2ECE5] p-2.5 text-xs">
            <span class="font-extrabold text-[#14532D]">📞 ${isVerified ? (bn ? "যাচাইকৃত যোগাযোগ:" : "Verified Contact:") : (bn ? "জমা দেওয়া যোগাযোগ (ব্যক্তিগত):" : "Submitted Contact (Private):")}</span>
            ${escapeHtml(shg.contactName || "")}
            ${shg.contactPhone ? (cleanTel ? `<a href="tel:${escapeHtml(cleanTel)}" class="underline font-bold text-[#14532D] ml-1">${escapeHtml(shg.contactPhone)}</a>` : ` ${escapeHtml(shg.contactPhone)}`) : ""}
          </div>
        ` : ""}

        ${shg.activities?.length ? `
          <div class="space-y-1">
            <div class="text-[11px] font-extrabold text-[#14532D]">${bn ? "প্রধান কার্যক্রম (Main Activities):" : "Main Activities:"}</div>
            <div class="flex flex-wrap gap-1">
              ${shg.activities.map((a) => `<span class="px-2 py-0.5 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-bold">${escapeHtml(a)}</span>`).join("")}
            </div>
          </div>
        ` : ""}

        ${productsOrServices.length ? `
          <div class="text-xs text-[#334155]">
            <strong class="text-[#14532D]">${bn ? "পণ্য ও পরিষেবা:" : "Products / Services:"}</strong> ${escapeHtml(productsOrServices.join(" • "))}
          </div>
        ` : ""}

        ${shg.entrepreneurshipInfo ? `
          <div class="text-xs text-[#334155]">
            <strong class="text-[#14532D]">${bn ? "নারী উদ্যোক্তা তথ্য:" : "Women Entrepreneurship:"}</strong> ${escapeHtml(shg.entrepreneurshipInfo)}
          </div>
        ` : ""}

        ${shg.govtSupport ? `
          <div class="rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] p-2.5 text-xs text-[#14532D]">
            <strong>${bn ? "সংশ্লিষ্ট সরকারি সহায়তা:" : "Relevant Government Support:"}</strong> ${escapeHtml(shg.govtSupport)}
          </div>
        ` : ""}
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EDF4EE]">
        <div class="text-[10px] text-[#64748B]">
          ${shg.lastVerifiedDate ? `${bn ? "সর্বশেষ যাচাই:" : "Last Verified:"} ${escapeHtml(shg.lastVerifiedDate)}` : `${bn ? "অবস্থা:" : "Status:"} ${escapeHtml(shg.approvalStatus || "PENDING")}`}
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${dirUrl ? `
            <a href="${escapeHtml(dirUrl)}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-[#14532D] text-white text-[11px] font-extrabold">
              🧭 ${bn ? "OSM দিকনির্দেশ ↗" : "OSM Directions ↗"}
            </a>
          ` : ""}
          ${hasCoords ? `
            <button type="button" data-wf-focus-shg-map="${escapeHtml(shg.id || "")}" class="px-3 py-1.5 rounded-lg bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-900 text-[11px] font-extrabold">
              🗺️ ${bn ? "ম্যাপে দেখুন" : "View on Map"}
            </button>
          ` : ""}
        </div>
      </div>
    </article>
  `;
}

function renderShgContributorForm(state, lang, activePin) {
  const bn = lang === "BN";
  return `
    <section class="gv-card p-5 border-2 border-fuchsia-300 space-y-3 animate-fade-up">
      <div class="flex items-center justify-between gap-2">
        <div>
          <h4 class="text-sm sm:text-base font-extrabold text-[#14532D]">
            ${bn ? "নারী স্বনির্ভর গোষ্ঠী (SHG) জমা দিন (অ্যাডমিন অনুমোদন সাপেক্ষে)" : "Submit a Women Self Help Group (Admin Approval Required)"}
          </h4>
          <p class="text-[11px] text-[#496052]">
            ${bn ? "জমা দেওয়া SHG তথ্য ব্যক্তিগত থাকবে এবং অ্যাডমিন যাচাই না করা পর্যন্ত জনসাধারণের তালিকায় প্রকাশিত হবে না।" : "Submitted SHGs stay private & pending until verified and approved by an authorized Admin."}
          </p>
        </div>
        <button type="button" data-wf-toggle-shg-submit="1" class="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-bold">✕</button>
      </div>

      ${!state.user ? `
        <div class="rounded-xl bg-amber-50 border border-amber-200 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span class="font-bold text-amber-950">${bn ? "SHG জমা দিতে অনুগ্রহ করে সাইন ইন করুন।" : "Please sign in to submit a Women SHG listing for verification."}</span>
          <button type="button" data-action="open-auth" class="px-3.5 py-2 rounded-xl bg-[#14532D] text-white font-extrabold">${bn ? "সাইন ইন করুন" : "Sign In"}</button>
        </div>
      ` : `
        <form id="wfShgSubmitForm" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input id="wfShgName" type="text" required minlength="2" maxlength="150" placeholder="${bn ? "SHG-র নাম (English) *" : "SHG Name *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          <input id="wfShgNameBn" type="text" maxlength="190" placeholder="${bn ? "SHG-র বাংলা নাম (ঐচ্ছিক)" : "SHG Bengali Name (optional)"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          <input id="wfShgVillage" type="text" required minlength="2" maxlength="120" placeholder="${bn ? "গ্রাম / এলাকা (Village / Locality) *" : "Village / Locality *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfShgGramPanchayat" type="text" maxlength="120" placeholder="${bn ? "গ্রাম পঞ্চায়েত (Gram Panchayat)" : "Gram Panchayat (optional)"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfShgBlock" type="text" required minlength="2" maxlength="100" placeholder="${bn ? "ব্লক (Block) *" : "Block *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfShgFormDistrict" type="text" required minlength="2" maxlength="80" value="Nadia" placeholder="${bn ? "জেলা (District) *" : "District *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfShgAddress" type="text" required minlength="3" maxlength="280" placeholder="${bn ? "সম্পূর্ণ ঠিকানা *" : "Full Address *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfShgPin" type="text" inputmode="numeric" required maxlength="6" pattern="[1-9][0-9]{5}" value="${escapeHtml(activePin)}" placeholder="${bn ? "৬ সংখ্যার পিন কোড *" : "6-Digit PIN Code *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs font-bold" />
          <input id="wfShgContactName" type="text" maxlength="80" placeholder="${bn ? "দলনেত্রী / যোগাযোগকারীর নাম" : "Contact Person Name (optional)"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfShgContactPhone" type="tel" maxlength="32" placeholder="${bn ? "ফোন নম্বর (যদি প্রকাশের অনুমতি থাকে)" : "Contact Phone (only with consent)"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfShgActivities" type="text" required placeholder="${bn ? "প্রধান কার্যক্রম (কমা দিয়ে লিখুন, যেমন: সবজি চাষ, মশলা তৈরি) *" : "Main Activities (comma-separated, e.g., Vegetables, Pickles) *"}" class="sm:col-span-2 px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfShgServices" type="text" placeholder="${bn ? "পণ্য বা পরিষেবা (যেমন: জৈব সার, হলুদ গুঁড়ো, বীজ সরবরাহ)" : "Products or Services Offered (comma-separated)"}" class="sm:col-span-2 px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <textarea id="wfShgEnterprise" rows="2" maxlength="600" placeholder="${bn ? "নারী উদ্যোক্তা ও পণ্যের তথ্য" : "Women Entrepreneurship Details (optional)"}" class="sm:col-span-2 px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
          <select id="wfShgGovtSupport" class="sm:col-span-2 px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
            ${SHG_GOVT_SUPPORT_OPTIONS.map((opt) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join("")}
          </select>
          <div class="sm:col-span-2">
            <button type="submit" class="w-full min-h-[44px] py-2.5 rounded-xl bg-fuchsia-800 hover:bg-fuchsia-900 text-white text-sm font-extrabold">
              ${bn ? "অ্যাডমিন অনুমোদনের জন্য SHG জমা দিন" : "Submit SHG for Admin Approval"}
            </button>
          </div>
        </form>
      `}
    </section>
  `;
}

// ----------------------------------------------------------------------------
// 3. ENTREPRENEURSHIP & FINANCIAL SUPPORT SUB-VIEW (INSIDE WOMEN FARMER ZONE)
// ----------------------------------------------------------------------------
export function renderWomenEnterpriseFinanceSubView(state, lang) {
  const bn = lang === "BN";
  const enterpriseTracks = [
    {
      badgeEn: "Food Processing • MoFPI",
      badgeBn: "খাদ্য প্রক্রিয়াকরণ • MoFPI",
      titleEn: "PMFME Seed Capital & Micro-Enterprise Subsidy",
      titleBn: "PMFME সিড ক্যাপিটাল ও ক্ষুদ্র খাদ্য প্রক্রিয়াকরণ ভর্তুকি",
      descEn: "SHG members receive working capital seed support (up to ₹40,000 per member via SRLM/Anandadhara) plus 35% credit-linked capital subsidy (up to ₹10 lakh) for spice, pickle, dal, honey, dairy & millet units.",
      descBn: "SHG সদস্যদের জন্য সদস্যপ্রতি ₹৪০,০০০ পর্যন্ত সিড ক্যাপিটাল (আনন্দধারা/SRLM মারফত) এবং মশলা, আচার, ডাল, মধু ও দুগ্ধ ইউনিটে ৩৫% পর্যন্ত মূলধনী ভর্তুকি।",
      url: "https://pmfme.mofpi.gov.in/"
    },
    {
      badgeEn: "West Bengal SRLM",
      badgeBn: "পশ্চিমবঙ্গ আনন্দধারা",
      titleEn: "Anandadhara SHG Revolving Fund & Low-Interest Bank Credit",
      titleBn: "আনন্দধারা SHG রিভলভিং ফান্ড ও কম সুদে ব্যাংক ঋণ",
      descEn: "Panchasutra-compliant women SHGs in West Bengal access Revolving Fund, Community Investment Fund (CIF), and interest-subvented bank credit linkage through Block Mission Management Units (BMMU).",
      descBn: "পঞ্চসূত্র মানা পশ্চিমবঙ্গের নারী SHG দলগুলো BMMU-এর মাধ্যমে রিভলভিং ফান্ড, CIF এবং কম সুদে ব্যাংক ঋণ সহায়তা পায়।",
      url: "https://aajeevika.gov.in/"
    },
    {
      badgeEn: "Collective Business • NABARD / SFAC",
      badgeBn: "সম্মিলিত ব্যবসা • NABARD / SFAC",
      titleEn: "Women-Led FPOs (10,000 FPO Scheme) & Collective Marketing",
      titleBn: "নারী-নেতৃত্বাধীন FPO ও সম্মিলিত বাজারজাতকরণ",
      descEn: "Register Women Farmer Producer Organizations for matching equity grants (up to ₹15 lakh), bulk seed/fertilizer procurement, grading, packaging & direct market linkage.",
      descBn: "নারী কৃষক উৎপাদক সংস্থা (FPO) গঠনের মাধ্যমে ম্যাচিং ইক্যুইটি গ্রান্ট, যৌথভাবে সার-বীজ ক্রয় এবং সরাসরি বাজারে ফসল বিক্রির সুযোগ।",
      url: "https://enam.gov.in/"
    },
    {
      badgeEn: "Institutional Credit • RBI / Banks",
      badgeBn: "প্রাতিষ্ঠানিক ঋণ • RBI / ব্যাংক",
      titleEn: "Kisan Credit Card (KCC) for Crops, Dairy & Fisheries",
      titleBn: "ফসল, দুগ্ধ ও মৎস্য চাষের জন্য কিষাণ ক্রেডিট কার্ড (KCC)",
      descEn: "Eligible women cultivators, tenant farmers, dairy & fishery farmers can apply for KCC short-term working capital with prompt-repayment interest subvention (effective 4% p.a. under current GoI norms).",
      descBn: "যোগ্য নারী কৃষক, ভাগচাষি, দুগ্ধ ও মৎস্য চাষিরা সময়মতো পরিশোধে কম সুদে (বার্ষিক কার্যকর ৪%) KCC কৃষি ঋণের আবেদন করতে পারেন।",
      url: "https://www.jansamarth.in/"
    }
  ];

  return `
    <div data-wf-section="enterprise-finance" class="space-y-6">
      <div class="rounded-2xl border border-emerald-200 bg-gradient-to-r from-[#ECFDF5] via-white to-[#FDF4FF] p-4 sm:p-5 space-y-2">
        <span class="inline-block px-2.5 py-0.5 rounded-full bg-[#14532D] text-white text-[10px] font-extrabold uppercase tracking-wider">
          ${bn ? "নারী কৃষক উদ্যোক্তা, ঋণ ও অধিকার" : "Women Agri-Entrepreneurship, Credit & Rights"}
        </span>
        <h3 class="font-display text-lg sm:text-xl font-bold text-[#14532D]">
          ${bn ? "উদ্যোক্তা উন্নয়ন, আর্থিক সহায়তা ও সরকারি হেল্পলাইন" : "Entrepreneurship, Financial Support & Official Helplines"}
        </h3>
        <p class="text-xs text-[#334155] leading-relaxed max-w-2xl">
          ${bn
            ? "SHG-ভিত্তিক ক্ষুদ্র কৃষি ব্যবসা, PMFME খাদ্য প্রক্রিয়াকরণ, নারী FPO, KCC ব্যাংক ঋণ, এবং নারী কৃষক অধিকার ও সরকারি হেল্পলাইন।"
            : "Verified pathways for women-led agri-business, PMFME food processing, Anandadhara SHG credit, KCC loans, Women Farmer Rights & official helplines."}
        </p>
        <div class="flex flex-wrap gap-2 pt-1">
          <button type="button" data-wf-tab="schemes" class="px-3.5 py-2 min-h-[40px] rounded-xl bg-[#14532D] text-white text-xs font-extrabold">
            ${bn ? "সব সরকারি প্রকল্প দেখুন →" : "Browse All Govt Schemes →"}
          </button>
          <button type="button" data-wf-tab="shg" class="px-3.5 py-2 min-h-[40px] rounded-xl bg-fuchsia-800 text-white text-xs font-extrabold">
            ${bn ? "SHG অনুসন্ধান →" : "Search Verified SHGs →"}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${enterpriseTracks.map((t) => {
          const href = safeUrl(t.url);
          return `
            <article class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div class="space-y-1.5">
                <span class="inline-block px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-[10px] font-extrabold">
                  ${escapeHtml(bn ? t.badgeBn : t.badgeEn)}
                </span>
                <h4 class="text-sm sm:text-base font-extrabold text-[#132219]">${escapeHtml(bn ? t.titleBn : t.titleEn)}</h4>
                <p class="text-xs text-[#475569] leading-relaxed">${escapeHtml(bn ? t.descBn : t.descEn)}</p>
              </div>
              ${href ? `
                <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="min-h-[40px] inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-[#EDF4EE] hover:bg-[#DCFCE7] text-[#14532D] text-xs font-extrabold">
                  ${bn ? "সরকারি পোর্টাল দেখুন ↗" : "Visit Official Portal ↗"}
                </a>
              ` : ""}
            </article>
          `;
        }).join("")}
      </div>

      <!-- Women Farmer Rights & Official Helplines -->
      <section class="space-y-3">
        <h4 class="text-sm sm:text-base font-extrabold text-[#14532D] px-1">
          ${bn ? "নারী কৃষকের অধিকার ও যাচাইকৃত সরকারি হেল্পলাইন" : "Women Farmer Rights & Verified Official Helplines"}
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${WOMEN_FARMER_RIGHTS_INFO.slice(0, 4).map((r) => `
            <div class="gv-card p-4 space-y-1">
              <div class="text-xs sm:text-sm font-extrabold text-[#14532D]">${escapeHtml(bn ? r.titleBn : r.titleEn)}</div>
              <p class="text-xs text-[#475569] leading-relaxed">${escapeHtml(bn ? r.bodyBn : r.bodyEn)}</p>
            </div>
          `).join("")}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${WOMEN_OFFICIAL_HELPLINES.map((h) => `
            <div class="gv-card p-3.5 flex flex-col justify-between gap-2">
              <div>
                <div class="text-xs font-extrabold text-[#132219]">${escapeHtml(bn ? h.nameBn : h.nameEn)}</div>
                <p class="text-[11px] text-[#475569] mt-0.5">${escapeHtml(bn ? h.descBn : h.descEn)}</p>
              </div>
              <div class="flex flex-wrap gap-1.5">
                ${h.tel ? `<a href="tel:${escapeHtml(h.tel)}" class="px-3 py-1.5 rounded-lg bg-[#14532D] text-white text-[11px] font-extrabold">📞 ${escapeHtml(h.number)}</a>` : ""}
                ${safeUrl(h.url) ? `<a href="${escapeHtml(safeUrl(h.url))}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-[11px] font-extrabold">${bn ? "ওয়েবসাইট ↗" : "Portal ↗"}</a>` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      </section>
    </div>
  `;
}
