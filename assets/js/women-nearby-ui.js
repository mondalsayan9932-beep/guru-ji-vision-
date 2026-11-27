// ============================================================================
// GURU JI VISION — WOMEN FARMER NEARBY SERVICES, SHG SEARCH & ENTERPRISE UI
// ============================================================================
// Strictly rendered as sub-sections INSIDE Women Farmer Zone (NO new Main Zone):
// 1. Nearby Services (West Bengal priority, GPS-independent 6-digit PIN Code
//    search, all 9 categories, List & Map Views, Surrounding PIN suggestions,
//    Admin-verified vs Public Map Directory vs Pending Submission badges)
// 2. SHG Search (Dedicated verified SHG directory by PIN/District/Activity,
//    showing SHG name, Area, Address, PIN, Verified Contact, Activities,
//    Services, Women Entrepreneurship Info, Relevant Govt Support)
// 3. Entrepreneurship & Financial Support (PMFME, Women FPOs, KCC, SHG Credit,
//    Financial Literacy, Women Farmer Rights & Official Helplines)
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
// 1. NEARBY SERVICES SUB-VIEW (GPS-INDEPENDENT PIN CODE SEARCH + LIST & MAP)
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

  const verifiedPins = (state.nearbyServiceListings || [])
    .filter((x) => x.verificationStatus === "ADMIN_VERIFIED" && x.published)
    .map((x) => x.pinCode);
  const surroundingPins = activePin ? getSurroundingPinSuggestions(activePin, verifiedPins) : [];

  const refCoords = gpsCoords || apiRes?.centerCoords || null;
  const filtered = filterNearbyListings({
    verifiedListings: state.nearbyServiceListings || [],
    liveDirectoryListings: apiRes?.pinCode === activePin ? (apiRes.liveListings || []) : [],
    myPendingListings: state.myPendingNearbyListings || [],
    pinCode: activePin,
    surroundingPins,
    category,
    search,
    referenceCoords: refCoords
  });

  const pinCheck = activePin ? validatePinCode(activePin) : null;
  const selectedMapItem =
    filtered.allResults.find((x) => x.id === nb.selectedMapId) ||
    filtered.allResults.find((x) => isValidIndiaCoordinate(x.lat, x.lng)) ||
    null;

  const osmEmbed = buildOsmEmbedUrl(
    refCoords?.lat,
    refCoords?.lng,
    selectedMapItem?.lat,
    selectedMapItem?.lng
  );

  return `
    <div data-wf-section="nearby-services" class="space-y-5">
      <!-- Header Banner -->
      <div class="rounded-2xl border border-emerald-200 bg-gradient-to-r from-[#ECFDF5] via-white to-[#F0FDF4] p-4 sm:p-5 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="space-y-1">
            <span class="inline-block px-2.5 py-0.5 rounded-full bg-[#14532D] text-white text-[10px] font-extrabold uppercase tracking-wider">
              ${bn ? "পশ্চিমবঙ্গ অগ্রাধিকার • GPS ছাড়াই কাজ করে" : "West Bengal Priority • Works Without GPS"}
            </span>
            <h3 class="font-display text-lg sm:text-xl font-bold text-[#14532D]">
              ${bn ? "নিকটবর্তী কৃষি ও গ্রামীণ পরিষেবা (Nearby Services)" : "Nearby Services — PIN Code Search (West Bengal)"}
            </h3>
            <p class="text-xs text-[#334155] leading-relaxed max-w-2xl">
              ${bn
                ? "আপনার ৬ সংখ্যার পিন কোড লিখে ওষুধের দোকান, সার-বীজ-কীটনাশক, কৃষি যন্ত্রপাতি, মুদিখানা, স্বনির্ভর গোষ্ঠী (SHG) ও কৃষক সহায়তা কেন্দ্র খুঁজুন। GPS বন্ধ থাকলেও সম্পূর্ণ কাজ করে।"
                : "Enter any 6-digit PIN Code to find verified Medical Stores, Fertilizer/Seed/Pesticide & Agri Input Shops, Equipment Dealers, Grocery Stores, SHGs & Farmer Support Centres. Works even when GPS is disabled."}
            </p>
          </div>
          ${state.isAdmin ? `
            <button type="button" data-nav="admin" data-open-admin-sub="women-cms" data-open-wcms-section="nearby-admin" class="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0C3B20] text-xs font-extrabold shrink-0">
              Admin Verify Listings ↗
            </button>
          ` : ""}
        </div>
      </div>

      <!-- 6-Digit PIN Code Search Form (GPS-Independent) -->
      <div class="gv-card p-4 sm:p-5 space-y-3.5">
        <form id="wfNearbyPinForm" class="flex flex-col sm:flex-row gap-2.5">
          <div class="flex-1">
            <label for="wfNearbyPinInput" class="block text-[11px] font-extrabold text-[#14532D] mb-1">
              ${bn ? "৬ সংখ্যার পিন কোড লিখুন (যেমন: 741235, 713101, 722101)" : "Enter 6-Digit PIN Code (e.g., 741235, 713101, 722101)"}
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
              ${nb.loading ? (bn ? "খোঁজা হচ্ছে..." : "Searching...") : (bn ? "পিন কোড খুঁজুন" : "Search PIN Code")}
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

        ${nb.pinError ? `
          <div role="alert" data-wf-pin-error="1" class="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-bold text-rose-800">
            ${escapeHtml(nb.pinError)}
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
            ${bn ? "পশ্চিমবঙ্গের প্রধান কৃষি জেলার দ্রুত পিন কোড:" : "Quick West Bengal District PIN Codes:"}
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
          <div class="rounded-xl bg-[#F8FBF8] border border-[#D9EAE0] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div class="space-y-0.5">
              <div class="font-extrabold text-[#14532D]">
                ${bn ? `পিন কোড: ${escapeHtml(activePin)}` : `Active PIN Code: ${escapeHtml(activePin)}`}
                ${apiRes?.postal ? ` — ${escapeHtml([apiRes.postal.block, apiRes.postal.district, apiRes.postal.state].filter(Boolean).join(", "))}` : (pinCheck.isWestBengal ? " — West Bengal" : " — India")}
              </div>
              ${apiRes?.postal?.postOffices?.length ? `
                <div class="text-[11px] text-[#496052]">
                  ${bn ? "পোস্ট অফিস এলাকা:" : "Postal Areas:"} ${escapeHtml(apiRes.postal.postOffices.slice(0, 6).join(", "))}
                </div>
              ` : ""}
              ${!pinCheck.isWestBengal ? `
                <div class="text-[11px] font-bold text-amber-800">
                  ${bn ? "দ্রষ্টব্য: বর্তমানে পশ্চিমবঙ্গের পিন কোডগুলো অগ্রাধিকার পাচ্ছে; তবুও আপনার পিন কোডের যাচাইকৃত তালিকা ও ম্যাপ খোঁজা হয়েছে।" : "Note: West Bengal PINs are prioritized first; searching available verified & public directory entries for this PIN."}
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
              ${bn ? "যেকোনো ৬ সংখ্যার পিন কোড দিয়ে খুঁজুন বা নিচের যাচাইকৃত তালিকা দেখুন।" : "Search any 6-digit PIN Code above or browse verified West Bengal listings below."}
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

        <!-- All 9 Search Categories -->
        <div class="flex flex-wrap gap-1.5">
          <button type="button" data-wf-nearby-cat="ALL" class="px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-extrabold ${
            category === "ALL" ? "bg-[#14532D] text-white" : "bg-[#F4F9F5] border border-[#CDE0D3] text-[#14532D]"
          }">${bn ? "সব ৯টি বিভাগ" : "All 9 Categories"}</button>
          ${NEARBY_SERVICE_CATEGORIES.map((c) => `
            <button type="button" data-wf-nearby-cat="${escapeHtml(c.key)}" class="px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-bold ${
              category === c.key ? "bg-[#14532D] text-white" : "bg-white border border-[#CDE0D3] text-[#14532D] hover:bg-[#ECFDF5]"
            }">${c.icon} ${escapeHtml(bn ? c.bn : c.en)}</button>
          `).join("")}
        </div>

        <input
          id="wfNearbySearch"
          type="search"
          value="${escapeHtml(search)}"
          placeholder="${bn ? "দোকানের নাম, এলাকা বা ঠিকানা দিয়ে খুঁজুন..." : "Filter results by shop name, village, road or landmark..."}"
          class="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white"
        />
      </div>

      <!-- Surrounding PIN Code Suggestions Bar -->
      ${surroundingPins.length ? `
        <div data-wf-surrounding-pins="1" class="gv-card p-3.5 sm:p-4 space-y-2 bg-[#F8FBF8]">
          <div class="text-xs font-extrabold text-[#14532D]">
            ${bn ? `পিন ${escapeHtml(activePin)}-এর পার্শ্ববর্তী পিন কোড পরামর্শ:` : `Surrounding PIN Code Suggestions near ${escapeHtml(activePin)}:`}
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${surroundingPins.map((sp) => `
              <button type="button" data-wf-quick-pin="${escapeHtml(sp.pin)}" class="px-3 py-1.5 min-h-[36px] rounded-xl bg-white hover:bg-[#DCFCE7] border border-[#CDE0D3] text-[#14532D] text-xs font-extrabold">
                ${escapeHtml(sp.pin)}${sp.labelEn ? ` • ${escapeHtml(bn ? sp.labelBn : sp.labelEn)}` : ""}
              </button>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <!-- MAP VIEW -->
      ${viewMode === "MAP" ? `
        <section data-wf-nearby-map="1" class="gv-card p-4 sm:p-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 class="text-sm font-extrabold text-[#14532D]">${bn ? "ম্যাপ ভিউ (OpenStreetMap)" : "Interactive Map View (OpenStreetMap)"}</h4>
              <p class="text-[11px] text-[#496052]">
                ${selectedMapItem
                  ? `${bn ? "নির্বাচিত স্থান:" : "Focused Pin:"} ${escapeHtml(selectedMapItem.name)} (${escapeHtml(selectedMapItem.pinCode)})`
                  : (bn ? "নির্ভরযোগ্য স্থানাঙ্ক সহ পিন এলাকা দেখানো হচ্ছে।" : "Showing resolved PIN area coordinates. Click any listing below to focus on map.")}
              </p>
            </div>
            ${selectedMapItem ? `
              <a href="${escapeHtml(safeUrl(buildDirectionsUrl(selectedMapItem)))}" target="_blank" rel="noopener noreferrer" class="min-h-[38px] inline-flex items-center px-3.5 py-1.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">
                🧭 ${bn ? "রাস্তার দিকনির্দেশ (Directions) ↗" : "Get Directions ↗"}
              </a>
            ` : ""}
          </div>
          ${osmEmbed ? `
            <div class="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-[#CDE0D3] bg-[#EDF4EE]">
              <iframe
                src="${escapeHtml(osmEmbed)}"
                title="${bn ? "নিকটবর্তী পরিষেবা ম্যাপ" : "Nearby Services Map"}"
                class="w-full h-full"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          ` : `
            <div class="rounded-2xl bg-[#F8FBF8] border border-[#D9EAE0] p-6 text-center space-y-2">
              <p class="text-xs font-bold text-[#14532D]">
                ${bn ? "ম্যাপ দেখতে উপরে একটি ৬ সংখ্যার পিন কোড খুঁজুন অথবা স্থানাঙ্কযুক্ত যাচাইকৃত দোকান নির্বাচন করুন।" : "Search a 6-digit PIN Code above to load the OpenStreetMap area view (works even without GPS)."}
              </p>
            </div>
          `}
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
              ? "আমরা কখনোই ভুয়া দোকানের নাম বা ঠিকানা তৈরি করি না। পার্শ্ববর্তী পিন কোড খুঁজে দেখুন অথবা আপনার এলাকার প্রকৃত দোকান অ্যাডমিন যাচাইকরণের জন্য জমা দিন।"
              : "Guru Ji Vision never invents shop names, addresses, or phone numbers. Try searching one of the surrounding PIN Codes above, or submit a genuine local shop/centre below for Admin verification."}
          </p>
          <div class="flex flex-wrap justify-center gap-2 pt-1">
            <button type="button" data-wf-toggle-nearby-submit="1" class="min-h-[42px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
              + ${bn ? "স্থানীয় দোকান জমা দিন (অ্যাডমিন যাচাই)" : "Submit Local Business for Admin Verification"}
            </button>
          </div>
        </div>
      ` : `
        <div class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="text-xs font-extrabold text-[#14532D]">
              ${bn
                ? `মোট ${filtered.allResults.length}টি ফলাফল (${filtered.exactPinResults.length}টি এই পিন এলাকায়, ${filtered.surroundingResults.length}টি পার্শ্ববর্তী এলাকায়)`
                : `Showing ${filtered.allResults.length} listing(s) (${filtered.exactPinResults.length} in PIN area, ${filtered.surroundingResults.length} surrounding)`}
            </div>
            <button type="button" data-wf-toggle-nearby-submit="1" class="px-3.5 py-2 min-h-[38px] rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">
              + ${bn ? "নতুন দোকান জমা দিন" : "Submit Local Shop"}
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${filtered.allResults.map((item) => renderNearbyBusinessCard(item, bn, viewMode)).join("")}
          </div>
        </div>
      `}

      <!-- Submitter's Own Pending Unverified Submissions (Clearly Marked Unverified) -->
      ${filtered.myPendingResults.length ? `
        <section class="gv-card p-4 sm:p-5 border-amber-300 bg-amber-50/50 space-y-3">
          <div class="text-xs sm:text-sm font-extrabold text-amber-950">
            ⏳ ${bn ? `আপনার জমা দেওয়া অযাচাইকৃত তালিকা (${filtered.myPendingResults.length}) — অ্যাডমিন যাচাই বাকি` : `Your Pending Submissions (${filtered.myPendingResults.length}) — Awaiting Admin Verification`}
          </div>
          <p class="text-[11px] text-amber-900">
            ${bn ? "অ্যাডমিন যাচাই ও প্রকাশ না করা পর্যন্ত এগুলো জনসাধারণের তালিকায় দেখা যাবে না।" : "These unverified submissions are visible only to you and Admins until verified and published."}
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${filtered.myPendingResults.map((item) => renderNearbyBusinessCard(item, bn, "LIST")).join("")}
          </div>
        </section>
      ` : ""}

      <!-- Contributor Submission Form (Strictly PENDING_REVIEW until Admin verifies) -->
      ${showSubmitForm ? renderNearbyContributorForm(state, lang, activePin) : ""}

      <!-- Transparent Data Source & Optional Google Places API Setup Note -->
      <details class="gv-card p-4 text-xs text-[#496052]">
        <summary class="font-extrabold text-[#14532D] cursor-pointer">
          ℹ️ ${bn ? "তথ্যের উৎস ও ম্যাপ API সেটআপ তথ্য" : "Data Sources, Verification Policy & Optional Places API Setup"}
        </summary>
        <div class="mt-2.5 space-y-1.5 leading-relaxed">
          <p>${escapeHtml(apiRes?.apiInfo?.setupHint || "Active sources: India Post PIN Code API + OpenStreetMap Public Directory + Guru Ji Vision Admin-Verified Local Directory. No secret API keys are ever placed in frontend JavaScript.")}</p>
          <p>${bn ? "অপারেটররা চাইলে Netlify Environment Variables-এ সার্ভার-সাইড GOOGLE_PLACES_API_KEY সেট করে বাণিজ্যিক Google Places কভারেজ চালু করতে পারেন।" : "To enable optional commercial Google Places API coverage, configure GOOGLE_PLACES_API_KEY strictly in Netlify Environment Variables (server-side Netlify Function only)."}</p>
        </div>
      </details>
    </div>
  `;
}

function renderNearbyBusinessCard(item, bn, viewMode) {
  const cat = NEARBY_SERVICE_CATEGORY_MAP[item.category] || { en: item.category, bn: item.category, icon: "📍" };
  const badge = getVerificationBadgeMeta(item.verificationStatus);
  const dirUrl = safeUrl(buildDirectionsUrl(item));
  const mapUrl = safeUrl(buildMapExternalUrl(item));
  const hasCoords = isValidIndiaCoordinate(item.lat, item.lng);
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
              ~${escapeHtml(String(item.distanceKm))} km
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

        ${item.phone ? `
          <div class="text-xs font-bold text-[#14532D]">
            📞 ${cleanTel ? `<a href="tel:${escapeHtml(cleanTel)}" class="underline">${escapeHtml(item.phone)}</a>` : escapeHtml(item.phone)}
          </div>
        ` : ""}

        ${item.notes ? `<p class="text-[11px] text-[#496052]">${escapeHtml(item.notes)}</p>` : ""}

        ${item.lastVerifiedDate ? `
          <div class="text-[10px] text-[#64748B]">${bn ? "সর্বশেষ যাচাই:" : "Last Verified:"} ${escapeHtml(item.lastVerifiedDate)}</div>
        ` : ""}
      </div>

      <div class="flex flex-wrap gap-2 pt-2 border-t border-[#EDF4EE]">
        ${dirUrl ? `
          <a href="${escapeHtml(dirUrl)}" target="_blank" rel="noopener noreferrer" class="flex-1 min-h-[40px] inline-flex items-center justify-center px-3 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
            🧭 ${bn ? "দিকনির্দেশ (Directions) ↗" : "Directions ↗"}
          </a>
        ` : ""}
        ${hasCoords ? `
          <button type="button" data-wf-focus-map="${escapeHtml(item.id || "")}" class="min-h-[40px] px-3 py-2 rounded-xl bg-[#ECFDF5] hover:bg-[#DCFCE7] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">
            🗺️ ${viewMode === "MAP" ? (bn ? "ম্যাপে দেখুন" : "Focus Map") : (bn ? "ম্যাপ ভিউ" : "Map")}
          </button>
        ` : (mapUrl ? `
          <a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer" class="min-h-[40px] inline-flex items-center px-3 py-2 rounded-xl bg-[#EDF4EE] text-[#14532D] text-xs font-extrabold">
            🗺️ Map ↗
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
            ${bn ? "স্থানীয় দোকান বা সহায়তা কেন্দ্র জমা দিন (অ্যাডমিন যাচাই সাপেক্ষে)" : "Submit a Local Business or Support Centre (Admin Verification Required)"}
          </h4>
          <p class="text-[11px] text-[#496052]">
            ${bn ? "জমা দেওয়া তথ্য অ্যাডমিন যাচাই না করা পর্যন্ত জনসাধারণের তালিকায় প্রকাশিত হবে না।" : "Submitted entries are stored as Unverified / Pending Review and published only after Admin verification."}
          </p>
        </div>
        <button type="button" data-wf-toggle-nearby-submit="1" class="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-bold">✕</button>
      </div>

      ${!state.user ? `
        <div class="rounded-xl bg-amber-50 border border-amber-200 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span class="font-bold text-amber-950">${bn ? "নতুন তালিকা জমা দিতে অনুগ্রহ করে সাইন ইন করুন।" : "Please sign in with your authorized account to submit a local business listing."}</span>
          <button type="button" data-action="open-auth" class="px-3.5 py-2 rounded-xl bg-[#14532D] text-white font-extrabold">${bn ? "সাইন ইন করুন" : "Sign In"}</button>
        </div>
      ` : `
        <form id="wfNearbySubmitForm" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input id="wfNbName" type="text" required minlength="2" maxlength="140" placeholder="${bn ? "দোকান বা সংস্থার নাম (English) *" : "Shop or Organization Name *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          <input id="wfNbNameBn" type="text" maxlength="180" placeholder="${bn ? "বাংলা নাম (ঐচ্ছিক)" : "Bengali Name (optional)"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          <select id="wfNbCategory" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
            ${NEARBY_SERVICE_CATEGORIES.map((c) => `<option value="${escapeHtml(c.key)}">${escapeHtml(bn ? c.bn : c.en)}</option>`).join("")}
          </select>
          <input id="wfNbPin" type="text" inputmode="numeric" required maxlength="6" value="${escapeHtml(activePin)}" placeholder="${bn ? "৬ সংখ্যার পিন কোড *" : "6-Digit PIN Code *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm font-bold" />
          <input id="wfNbAddress" type="text" required minlength="3" maxlength="280" placeholder="${bn ? "সম্পূর্ণ ঠিকানা (গ্রাম/রাস্তা/বাজার) *" : "Full Address (Village / Market / Road) *"}" class="sm:col-span-2 px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          <input id="wfNbArea" type="text" maxlength="120" placeholder="${bn ? "এলাকা / ব্লক" : "Area / Block"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfNbDistrict" type="text" required minlength="2" maxlength="80" value="Nadia" placeholder="${bn ? "জেলা *" : "District *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfNbPhone" type="tel" maxlength="32" placeholder="${bn ? "ফোন নম্বর (যাচাইকৃত হলে)" : "Phone Number (optional)"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfNbNotes" type="text" maxlength="500" placeholder="${bn ? "অতিরিক্ত তথ্য (যেমন: সকাল ৯টা–রাত ৮টা)" : "Services / Timings (optional)"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <div class="sm:col-span-2">
            <button type="submit" class="w-full min-h-[44px] py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">
              ${bn ? "অ্যাডমিন যাচাইকরণের জন্য জমা দিন" : "Submit for Admin Verification"}
            </button>
          </div>
        </form>
      `}
    </section>
  `;
}

// ----------------------------------------------------------------------------
// 2. DEDICATED SHG SEARCH SUB-VIEW (WEST BENGAL PRIORITY + VERIFIED SHGs)
// ----------------------------------------------------------------------------
export function renderWomenShgDiscoverySubView(state, lang) {
  const bn = lang === "BN";
  const nb = state.womenNearby || {};
  const shgPin = nb.shgPin || "";
  const shgDistrict = nb.shgDistrict || "ALL";
  const shgSearch = nb.shgSearch || "";
  const showShgSubmit = Boolean(nb.showShgSubmitForm);

  const verifiedPins = (state.shgDirectoryListings || [])
    .filter((x) => x.verificationStatus === "ADMIN_VERIFIED" && x.published)
    .map((x) => x.pinCode);
  const validPin = validatePinCode(shgPin);
  const surroundingPins = validPin.valid ? getSurroundingPinSuggestions(validPin.pin, verifiedPins) : [];

  const filtered = filterShgListings({
    verifiedShgs: state.shgDirectoryListings || [],
    myPendingShgs: state.myPendingShgListings || [],
    pinCode: validPin.valid ? validPin.pin : "",
    surroundingPins,
    district: shgDistrict,
    search: shgSearch
  });

  const wbDistricts = Array.from(new Set(WEST_BENGAL_PIN_HUBS.map((h) => h.district))).sort();

  return `
    <div data-wf-section="shg-search" class="space-y-5">
      <div class="rounded-2xl border border-fuchsia-200 bg-gradient-to-r from-[#FDF4FF] via-white to-[#ECFDF5] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="space-y-1">
          <span class="inline-block px-2.5 py-0.5 rounded-full bg-fuchsia-800 text-white text-[10px] font-extrabold uppercase tracking-wider">
            ${bn ? "স্বনির্ভর গোষ্ঠী (SHG) অনুসন্ধান • পশ্চিমবঙ্গ" : "Verified SHG Discovery • West Bengal"}
          </span>
          <h3 class="font-display text-lg sm:text-xl font-bold text-[#14532D]">
            ${bn ? "নারী স্বনির্ভর গোষ্ঠী (SHG) ও উৎপাদক দল খুঁজুন" : "Self Help Group (SHG) Search & Discovery"}
          </h3>
          <p class="text-xs text-[#334155] leading-relaxed max-w-2xl">
            ${bn
              ? "পিন কোড, জেলা বা কাজের ধরন অনুযায়ী যাচাইকৃত নারী স্বনির্ভর গোষ্ঠী (SHG), তাঁদের কার্যক্রম, পরিষেবা, নারী উদ্যোক্তা তথ্য ও সরকারি সহায়তা খুঁজুন।"
              : "Discover Admin-verified Women Self Help Groups by 6-digit PIN Code, area, or activity — including verified contacts, activities, services, women entrepreneurship details & government support."}
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

      <!-- SHG Search Controls -->
      <div class="gv-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label class="block">
          <span class="text-[11px] font-bold text-[#496052]">${bn ? "৬ সংখ্যার পিন কোড (ঐচ্ছিক)" : "6-Digit PIN Code (optional)"}</span>
          <input id="wfShgPinInput" type="text" inputmode="numeric" maxlength="6" value="${escapeHtml(shgPin)}" placeholder="${bn ? "যেমন: 741235" : "e.g., 741235"}" class="mt-1 w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm font-bold bg-white" />
        </label>
        <label class="block">
          <span class="text-[11px] font-bold text-[#496052]">${bn ? "জেলা (পশ্চিমবঙ্গ)" : "West Bengal District"}</span>
          <select id="wfShgDistrict" class="mt-1 w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white">
            <option value="ALL">${bn ? "সকল জেলা" : "All Districts"}</option>
            ${wbDistricts.map((d) => `<option value="${escapeHtml(d)}" ${shgDistrict === d ? "selected" : ""}>${escapeHtml(d)}</option>`).join("")}
          </select>
        </label>
        <label class="block">
          <span class="text-[11px] font-bold text-[#496052]">${bn ? "কার্যক্রম বা নাম খুঁজুন" : "Search SHG Name or Activity"}</span>
          <input id="wfShgSearchInput" type="search" value="${escapeHtml(shgSearch)}" placeholder="${bn ? "যেমন: সবজি, মশলা, দুগ্ধ, আনন্দধারা..." : "e.g., Organic, Spices, Dairy, Anandadhara..."}" class="mt-1 w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white" />
        </label>
      </div>

      ${shgPin && !validPin.valid ? `
        <div role="alert" class="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-800">
          ${escapeHtml(bn ? validPin.errorBn : validPin.errorEn)}
        </div>
      ` : ""}

      ${surroundingPins.length ? `
        <div class="flex flex-wrap items-center gap-1.5 text-xs">
          <span class="font-bold text-[#496052]">${bn ? "পার্শ্ববর্তী পিন:" : "Nearby PINs:"}</span>
          ${surroundingPins.slice(0, 6).map((sp) => `
            <button type="button" data-wf-shg-quick-pin="${escapeHtml(sp.pin)}" class="px-2.5 py-1 rounded-lg bg-[#EDF4EE] hover:bg-[#DCFCE7] text-[#14532D] font-extrabold">${escapeHtml(sp.pin)}</button>
          `).join("")}
        </div>
      ` : ""}

      <!-- Verified SHG Cards OR Honest Empty State -->
      ${filtered.allShgs.length === 0 ? `
        <div data-wf-shg-empty="1" class="gv-card p-6 sm:p-8 text-center space-y-3">
          <div class="text-2xl" aria-hidden="true">🤝</div>
          <h4 class="text-sm sm:text-base font-extrabold text-[#14532D]">
            ${validPin.valid
              ? (bn ? `পিন ${escapeHtml(validPin.pin)}-এ এখনো কোনো অ্যাডমিন-যাচাইকৃত SHG তালিকা নেই` : `No Admin-verified SHG listings are currently available for PIN ${escapeHtml(validPin.pin)}`)
              : (bn ? "এখনো কোনো যাচাইকৃত স্বনির্ভর গোষ্ঠী (SHG) যুক্ত হয়নি" : "No verified SHG listings match your filter yet")}
          </h4>
          <p class="text-xs text-[#475569] max-w-xl mx-auto leading-relaxed">
            ${bn
              ? "আমরা কখনোই ভুয়া SHG-র নাম বা ফোন নম্বর তৈরি করি না। আপনার গ্রামের স্বীকৃত আনন্দধারা / DAY-NRLM স্বনির্ভর গোষ্ঠীর তথ্য জমা দিন — অ্যাডমিন যাচাইয়ের পর এখানে প্রকাশিত হবে। পাশাপাশি স্থানীয় BMMU বা গ্রাম পঞ্চায়েত সংঘ অফিসে যোগাযোগ করতে পারেন।"
              : "We never fabricate SHG names, addresses, or phone numbers. Submit your recognized Anandadhara / DAY-NRLM Women SHG for Admin verification, or verify local village Sanghas via official WBSRLM / DAY-NRLM portals."}
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
          ${filtered.allShgs.map((shg) => renderShgCard(shg, bn)).join("")}
        </div>
      `}

      ${filtered.myPendingShgs.length ? `
        <section class="gv-card p-4 border-amber-300 bg-amber-50/50 space-y-3">
          <div class="text-xs font-extrabold text-amber-950">
            ⏳ ${bn ? `আপনার জমা দেওয়া SHG (${filtered.myPendingShgs.length}) — অ্যাডমিন যাচাই বাকি` : `Your Pending SHG Submissions (${filtered.myPendingShgs.length}) — Awaiting Admin Verification`}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${filtered.myPendingShgs.map((shg) => renderShgCard(shg, bn)).join("")}
          </div>
        </section>
      ` : ""}

      ${showShgSubmit ? renderShgContributorForm(state, lang, validPin.valid ? validPin.pin : "") : ""}
    </div>
  `;
}

function renderShgCard(shg, bn) {
  const badge = getVerificationBadgeMeta(shg.verificationStatus);
  const cleanTel = String(shg.contactPhone || "").replace(/[^+\d]/g, "");
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
        </div>

        <div>
          <h4 class="text-base font-extrabold text-[#132219] leading-snug">${escapeHtml(bn && shg.shgNameBn ? shg.shgNameBn : shg.shgName)}</h4>
          ${shg.shgNameBn && shg.shgNameBn !== shg.shgName ? `<div class="text-xs text-[#496052]">${escapeHtml(bn ? shg.shgName : shg.shgNameBn)}</div>` : ""}
          <p class="text-xs text-[#334155] mt-1">📍 ${escapeHtml(shg.area ? `${shg.area}, ` : "")}${escapeHtml(shg.address || "")} (${escapeHtml(shg.pinCode || "")})</p>
        </div>

        ${(shg.contactName || shg.contactPhone) ? `
          <div class="rounded-xl bg-[#F8FBF8] border border-[#E2ECE5] p-2.5 text-xs">
            <span class="font-extrabold text-[#14532D]">📞 ${bn ? "যাচাইকৃত যোগাযোগ:" : "Verified Contact:"}</span>
            ${escapeHtml(shg.contactName || "")}
            ${shg.contactPhone ? (cleanTel ? `<a href="tel:${escapeHtml(cleanTel)}" class="underline font-bold text-[#14532D] ml-1">${escapeHtml(shg.contactPhone)}</a>` : ` ${escapeHtml(shg.contactPhone)}`) : ""}
          </div>
        ` : ""}

        ${shg.activities?.length ? `
          <div class="space-y-1">
            <div class="text-[11px] font-extrabold text-[#14532D]">${bn ? "কার্যক্রম (Activities):" : "Activities:"}</div>
            <div class="flex flex-wrap gap-1">
              ${shg.activities.map((a) => `<span class="px-2 py-0.5 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-bold">${escapeHtml(a)}</span>`).join("")}
            </div>
          </div>
        ` : ""}

        ${shg.services?.length ? `
          <div class="text-xs text-[#334155]">
            <strong class="text-[#14532D]">${bn ? "পরিষেবা (Services):" : "Services:"}</strong> ${escapeHtml(shg.services.join(" • "))}
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
      ${shg.lastVerifiedDate ? `<div class="text-[10px] text-[#64748B] pt-1 border-t border-[#EDF4EE]">${bn ? "সর্বশেষ যাচাই:" : "Last Verified:"} ${escapeHtml(shg.lastVerifiedDate)}</div>` : ""}
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
            ${bn ? "স্বনির্ভর গোষ্ঠী (SHG) জমা দিন — অ্যাডমিন যাচাই সাপেক্ষে" : "Submit a Women Self Help Group (SHG) for Admin Verification"}
          </h4>
          <p class="text-[11px] text-[#496052]">${bn ? "অ্যাডমিন যাচাই করার পরেই এটি SHG ডিরেক্টরিতে প্রকাশিত হবে।" : "Published to the public SHG directory only after Admin verification."}</p>
        </div>
        <button type="button" data-wf-toggle-shg-submit="1" class="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-bold">✕</button>
      </div>
      ${!state.user ? `
        <div class="rounded-xl bg-amber-50 border border-amber-200 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span class="font-bold text-amber-950">${bn ? "SHG জমা দিতে অনুগ্রহ করে সাইন ইন করুন।" : "Sign in to submit an SHG listing for Admin verification."}</span>
          <button type="button" data-action="open-auth" class="px-3.5 py-2 rounded-xl bg-[#14532D] text-white font-extrabold">${bn ? "সাইন ইন করুন" : "Sign In"}</button>
        </div>
      ` : `
        <form id="wfShgSubmitForm" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input id="wfShgName" type="text" required minlength="2" maxlength="150" placeholder="${bn ? "SHG-র নাম (English) *" : "SHG Name *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          <input id="wfShgNameBn" type="text" maxlength="190" placeholder="${bn ? "SHG-র বাংলা নাম (ঐচ্ছিক)" : "SHG Bengali Name (optional)"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          <input id="wfShgArea" type="text" required minlength="2" maxlength="120" placeholder="${bn ? "এলাকা / গ্রাম / ব্লক *" : "Area / Village / Block *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfShgFormDistrict" type="text" required minlength="2" maxlength="80" value="Nadia" placeholder="${bn ? "জেলা *" : "District *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfShgAddress" type="text" required minlength="3" maxlength="280" placeholder="${bn ? "সম্পূর্ণ ঠিকানা *" : "Full Address *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfShgPin" type="text" inputmode="numeric" required maxlength="6" value="${escapeHtml(activePin)}" placeholder="${bn ? "৬ সংখ্যার পিন কোড *" : "6-Digit PIN Code *"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs font-bold" />
          <input id="wfShgContactName" type="text" maxlength="80" placeholder="${bn ? "দলনেত্রী / যোগাযোগকারীর নাম" : "Contact Person Name"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfShgContactPhone" type="tel" maxlength="32" placeholder="${bn ? "ফোন নম্বর (যদি প্রকাশের অনুমতি থাকে)" : "Verified Contact Phone (optional)"}" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfShgActivities" type="text" required placeholder="${bn ? "কার্যক্রম (কমা দিয়ে লিখুন, যেমন: সবজি চাষ, মশলা তৈরি) *" : "Activities (comma-separated, e.g., Organic Vegetables, Pickles) *"}" class="sm:col-span-2 px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="wfShgServices" type="text" placeholder="${bn ? "পরিষেবা (যেমন: বীজ সরবরাহ, প্রক্রিয়াকরণ)" : "Services Offered (comma-separated)"}" class="sm:col-span-2 px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <textarea id="wfShgEnterprise" rows="2" maxlength="600" placeholder="${bn ? "নারী উদ্যোক্তা ও পণ্যের তথ্য" : "Women Entrepreneurship & Value-Added Product Details"}" class="sm:col-span-2 px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
          <select id="wfShgGovtSupport" class="sm:col-span-2 px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
            ${SHG_GOVT_SUPPORT_OPTIONS.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("")}
          </select>
          <div class="sm:col-span-2">
            <button type="submit" class="w-full min-h-[44px] py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">
              ${bn ? "SHG অ্যাডমিন যাচাইকরণের জন্য জমা দিন" : "Submit SHG for Admin Verification"}
            </button>
          </div>
        </form>
      `}
    </section>
  `;
}

// ----------------------------------------------------------------------------
// 3. ENTREPRENEURSHIP & FINANCIAL SUPPORT SUB-VIEW (NAVIGATION PILLAR #6)
// ----------------------------------------------------------------------------
export function renderWomenEnterpriseFinanceSubView(state, lang) {
  const bn = lang === "BN";
  const pathways = [
    {
      titleEn: "PMFME Micro Food Processing & Women SHG Seed Capital",
      titleBn: "PMFME ক্ষুদ্র খাদ্য প্রক্রিয়াকরণ ও নারী SHG সিড ক্যাপিটাল",
      descEn: "Upgrade spice, pickle, dal, honey, dairy, horticulture or fish processing units with MoFPI credit-linked subsidy and SRLM/Anandadhara Seed Capital.",
      descBn: "মসলা, আচার, ডাল, মধু, দুগ্ধ, ফল-সবজি বা মাছ প্রক্রিয়াকরণ ইউনিটের জন্য MoFPI ভর্তুকি এবং আনন্দধারা সিড ক্যাপিটাল।",
      schemeId: "pmfme-micro-food-processing"
    },
    {
      titleEn: "Anandadhara (WBSRLM / DAY-NRLM) & SHG Bank Linkage",
      titleBn: "আনন্দধারা (WBSRLM / DAY-NRLM) ও SHG ব্যাংক ঋণ সহায়তা",
      descEn: "Revolving Fund, Community Investment Fund (CIF), low-interest SHG Bank Linkage credit, and Krishi Sakhi / Pashu Sakhi livelihood support across West Bengal.",
      descBn: "পশ্চিমবঙ্গে রিভলভিং ফান্ড, কমিউনিটি ইনভেস্টমেন্ট ফান্ড (CIF), কম সুদে SHG ব্যাংক ঋণ ও কৃষি সখী সহায়তা।",
      schemeId: "wb-anandadhara-wbsrlm"
    },
    {
      titleEn: "Women-Led Farmer Producer Organizations (10,000 FPO Scheme)",
      titleBn: "নারী-পরিচালিত FPO গঠন ও বিপণন সহায়তা (১০,০০০ FPO প্রকল্প)",
      descEn: "Form collective women-led FPOs supported via NABARD / SFAC / NCDC for bulk input purchase, grading, branding, and better mandi prices.",
      descBn: "NABARD / SFAC-এর সহায়তায় নারী-পরিচালিত FPO গড়ে যৌথভাবে বীজ-সার কেনা ও ফসলের ন্যায্য দাম নিশ্চিত করুন।",
      schemeId: "fpo-10000"
    },
    {
      titleEn: "Kisan Credit Card (KCC) — Crop, Dairy & Fisheries Working Capital",
      titleBn: "কিষাণ ক্রেডিট কার্ড (KCC) — চাষ, পশুপালন ও মৎস্য ঋণ",
      descEn: "Formal low-interest crop and allied dairy/poultry/fisheries working capital with official interest subvention for timely repayment.",
      descBn: "ফসল চাষ, গবাদি পশু, হাঁস-মুরগি ও মৎস্য চাষের জন্য কম সুদে সরকারি ব্যাংক ঋণ ও সময়মতো পরিশোধে সুদে ছাড়।",
      schemeId: "kcc-miss"
    }
  ];

  return `
    <div data-wf-section="enterprise-finance" class="space-y-5">
      <div class="rounded-2xl border border-emerald-200 bg-gradient-to-r from-[#ECFDF5] via-white to-[#FEFCE8] p-4 sm:p-5 space-y-1.5">
        <span class="inline-block px-2.5 py-0.5 rounded-full bg-[#14532D] text-white text-[10px] font-extrabold uppercase tracking-wider">
          ${bn ? "উদ্যোক্তা, ঋণ, অধিকার ও হেল্পলাইন" : "Entrepreneurship, Credit, Rights & Official Helplines"}
        </span>
        <h3 class="font-display text-lg sm:text-xl font-bold text-[#14532D]">
          ${bn ? "নারী কৃষি উদ্যোক্তা ও আর্থিক সহায়তা কেন্দ্র" : "Entrepreneurship & Financial Support for Women Farmers"}
        </h3>
        <p class="text-xs text-[#334155] leading-relaxed max-w-2xl">
          ${bn
            ? "খাদ্য প্রক্রিয়াকরণ, নারী-পরিচালিত FPO, SHG ব্যাংক ঋণ, KCC, আর্থিক সাক্ষরতা, নারী কৃষকের অধিকার এবং সরকারি টোল-ফ্রি হেল্পলাইন।"
            : "Verified pathways for micro food processing, Women-Led FPOs, SHG bank credit, KCC working capital, women farmers' rights, and official toll-free helplines."}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${pathways.map((p) => `
          <div class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-3">
            <div class="space-y-1.5">
              <h4 class="text-sm sm:text-base font-extrabold text-[#132219]">${escapeHtml(bn ? p.titleBn : p.titleEn)}</h4>
              <p class="text-xs text-[#475569] leading-relaxed">${escapeHtml(bn ? p.descBn : p.descEn)}</p>
            </div>
            <button type="button" data-wf-open-scheme-detail="${escapeHtml(p.schemeId)}" class="min-h-[42px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold text-left">
              ${bn ? "সম্পূর্ণ সরকারি নিয়ম ও আবেদন দেখুন →" : "View Full Verified Scheme Details →"}
            </button>
          </div>
        `).join("")}
      </div>

      <!-- Integrated Women Farmer Rights & Official Helplines -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${WOMEN_FARMER_RIGHTS_INFO.map((r) => `
          <div class="gv-card p-4 space-y-1.5">
            <h4 class="text-sm font-extrabold text-[#14532D]">${escapeHtml(bn ? r.titleBn : r.titleEn)}</h4>
            <p class="text-xs text-[#334155] leading-relaxed">${escapeHtml(bn ? r.bodyBn : r.bodyEn)}</p>
          </div>
        `).join("")}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        ${WOMEN_OFFICIAL_HELPLINES.slice(0, 4).map((h) => {
          const href = safeUrl(h.url);
          return `
            <div class="gv-card p-4 flex flex-col justify-between gap-2.5">
              <div>
                <div class="text-sm font-extrabold text-[#132219]">${escapeHtml(bn ? h.nameBn : h.nameEn)}</div>
                <p class="text-xs text-[#475569] mt-0.5">${escapeHtml(bn ? h.descBn : h.descEn)}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                ${h.tel ? `<a href="tel:${escapeHtml(h.tel)}" class="min-h-[40px] inline-flex items-center px-3.5 py-1.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">📞 ${escapeHtml(h.number)}</a>` : ""}
                ${href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="min-h-[40px] inline-flex items-center px-3.5 py-1.5 rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">${bn ? "পোর্টাল ↗" : "Portal ↗"}</a>` : ""}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}
