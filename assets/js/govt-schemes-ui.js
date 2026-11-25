// ============================================================================
// Guru Ji Vision — Bilingual Agriculture Government Schemes & Farmer Benefits UI
// Module: Agriculture Government Schemes & Farmer Benefits
// Bengali: কৃষি সরকারি প্রকল্প ও কৃষক সহায়তা কেন্দ্র
//
// Features:
// - Seamless Bengali (বাংলা) | English switcher across Directory & Detail Page
// - Bilingual search + State (28 States + 8 UTs) -> District cascading filter
// - All 23 agricultural categories + 13 quick filter chips
// - Complete 19-field Scheme Detail Page separating Eligibility vs Documents
// - Interactive scheme-specific Required Documents checklist
// - Strict freshness & verification badges (never labels stale/unverified as verified)
// - Honest national coverage notice & official source verification links
// ============================================================================

import { escapeHtml, safeUrl } from "./calculators.js";
import { INDIA_STATES_AND_UTS } from "./india-mandi-directory.js";
import {
  SCHEMES_DIRECTORY_META,
  SCHEME_CATEGORIES,
  SCHEME_CATEGORY_MAP,
  SCHEME_QUICK_FILTERS,
  SCHEME_STATUSES,
  evaluateSchemeVerification,
  filterAgricultureSchemes,
  mergeAgricultureSchemes
} from "./govt-schemes-data.js";

const STATUS_MAP = Object.fromEntries(SCHEME_STATUSES.map((s) => [s.key, s]));

const UI_TEXT = {
  EN: {
    langLabel: "Language:",
    searchLabel: "Search Schemes (English or বাংলা)",
    searchPlaceholder: "Search PM-KISAN, Krishak Bandhu, KCC, Fishery, Dairy, Irrigation, পিএম-কিষাণ, কৃষক বন্ধু...",
    stateLabel: "State / UT (28 States + 8 UTs)",
    allStates: "All States & UTs",
    districtLabel: "District",
    allDistricts: "All Districts",
    selectStateFirst: "Select a State/UT to filter districts",
    categoryLabel: "Scheme Category (23 Categories)",
    allCategories: "All 23 Agricultural Categories",
    quickFiltersLabel: "Quick Filters",
    clearFilters: "Clear Filters",
    showingPrefix: "Showing",
    showingOf: "of",
    schemesWord: "verified government schemes",
    centralLevel: "Central Govt",
    stateLevel: "State Govt",
    districtLevel: "District Level",
    womenBadge: "Women Eligible",
    purposeLabel: "Purpose",
    benefitsLabel: "Key Benefits",
    eligibilityPreview: "Eligibility Snapshot",
    docsCountLabel: "Required Documents",
    lastVerified: "Last Verified",
    viewDetails: "View Full Details →",
    officialPortal: "Official Portal ↗",
    emptyTitle: "No schemes matched your selected filters",
    emptyDesc: "Try clearing your search text, switching the State/District filter, or selecting 'All Schemes'. Remember that Central Government (All India) schemes apply across all states.",
    coverageTitle: "Honest Coverage Notice",
    disclaimerTitle: "Important Farmer Notice",
    backToList: "← Back to All Schemes",
    detailEyebrow: "Official Scheme Guide",
    applicableRegion: "Applicable State / Region",
    applicableDistricts: "Focused Districts",
    currentStatus: "Current Scheme Status",
    verificationStatus: "Verification Status",
    department: "Government Department",
    deadline: "Application Deadline",
    helpline: "Official Helpline",
    callNow: "Call Helpline",
    outdatedWarningTitle: "Information Needs Official Re-Verification",
    outdatedWarningBody: "This scheme entry is currently marked as outdated, unverified, or older than 12 months. Please confirm the latest rules, amounts, and deadlines directly on the official government portal below before applying.",
    secPurposeTitle: "1. Scheme Purpose & Benefits",
    secEligibilityTitle: "2. Eligibility Criteria (Mandatory Conditions)",
    secEligibilitySub: "These are the mandatory eligibility rules — separate from the supporting documents listed in Section 3.",
    eligCategories: "Eligible Farmer Categories",
    eligLand: "Landholding Requirement",
    eligTenant: "Tenant / Sharecropper / Landless Farmers",
    eligWomen: "Women Farmer Eligibility",
    eligAge: "Age Requirement",
    eligIncome: "Income Limit / Financial Condition",
    eligResidency: "State / Regional Residency",
    whoCanApply: "Who Can Apply",
    whoCannotApply: "Who Cannot Apply / Key Exclusions",
    secDocsTitle: "3. Required Documents Checklist (Scheme-Specific)",
    secDocsSub: "Tap items below as you prepare your documents. Only documents actually required for this specific scheme are listed.",
    docsReady: "prepared",
    docMandatory: "Mandatory",
    docOptional: "If Applicable",
    secApplyTitle: "4. How to Apply (Online & Offline)",
    onlineProcess: "Online Application Process",
    offlineProcess: "Offline Application Process (CSC / Block Office / Bank)",
    applyPortalBtn: "Open Official Application Portal ↗",
    secContactTitle: "5. Department, Helpline, Deadline & Official Source",
    officialSource: "Official Source & Reference",
    openSourceLink: "Verify on Official Source Website ↗",
    lastUpdateNote: "Latest Admin Review Note",
    notSpecified: "Confirm with local Agriculture Office / Official Portal",
    portalExploreMyScheme: "Explore More State Schemes on MyScheme.gov.in ↗",
    portalIndiaGov: "National Portal of India (india.gov.in) ↗"
  },
  BN: {
    langLabel: "ভাষা নির্বাচন করুন:",
    searchLabel: "প্রকল্প খুঁজুন (বাংলা বা English-এ লিখুন)",
    searchPlaceholder: "খুঁজুন: কৃষক বন্ধু, পিএম-কিষাণ, ফসল বীমা, KCC, মৎস্য, দুগ্ধ, সেচ, কৃষি যন্ত্রপাতি...",
    stateLabel: "রাজ্য / কেন্দ্রশাসিত অঞ্চল (২৮ রাজ্য + ৮ UT)",
    allStates: "সকল রাজ্য ও কেন্দ্রশাসিত অঞ্চল",
    districtLabel: "জেলা",
    allDistricts: "সকল জেলা",
    selectStateFirst: "জেলা বাছাই করতে আগে রাজ্য নির্বাচন করুন",
    categoryLabel: "প্রকল্পের বিভাগ (২৩টি কৃষি বিভাগ)",
    allCategories: "সকল ২৩টি কৃষি বিভাগ",
    quickFiltersLabel: "দ্রুত ফিল্টার",
    clearFilters: "ফিল্টার মুছুন",
    showingPrefix: "দেখানো হচ্ছে",
    showingOf: "টির মধ্যে",
    schemesWord: "টি সরকারি কৃষি প্রকল্প",
    centralLevel: "কেন্দ্রীয় সরকার",
    stateLevel: "রাজ্য সরকার",
    districtLevel: "জেলা-স্তর",
    womenBadge: "মহিলা কৃষক যোগ্য",
    purposeLabel: "উদ্দেশ্য",
    benefitsLabel: "মূল সুবিধা",
    eligibilityPreview: "সংক্ষিপ্ত যোগ্যতা",
    docsCountLabel: "প্রয়োজনীয় নথি",
    lastVerified: "সর্বশেষ যাচাই",
    viewDetails: "সম্পূর্ণ বিবরণ দেখুন →",
    officialPortal: "অফিশিয়াল পোর্টাল ↗",
    emptyTitle: "আপনার বাছাই করা ফিল্টারে কোনো প্রকল্প পাওয়া যায়নি",
    emptyDesc: "অনুসন্ধানের শব্দ মুছে দিন অথবা রাজ্য/জেলা/বিভাগ পরিবর্তন করে 'সব প্রকল্প' নির্বাচন করুন।",
    coverageTitle: "তথ্য পরিসর সম্পর্কে স্বচ্ছ ঘোষণা",
    disclaimerTitle: "কৃষক বন্ধুদের জন্য জরুরি তথ্য",
    backToList: "← সব সরকারি প্রকল্পের তালিকায় ফিরুন",
    detailEyebrow: "অফিশিয়াল সরকারি প্রকল্প গাইড",
    applicableRegion: "প্রযোজ্য রাজ্য / অঞ্চল",
    applicableDistricts: "বিশেষ প্রযোজ্য জেলা",
    currentStatus: "বর্তমান প্রকল্পের অবস্থা",
    verificationStatus: "যাচাইয়ের অবস্থা",
    department: "সংশ্লিষ্ট সরকারি দপ্তর",
    deadline: "আবেদনের সময়সীমা",
    helpline: "অফিশিয়াল হেল্পলাইন",
    callNow: "কল করুন",
    outdatedWarningTitle: "এই তথ্যটি অফিশিয়াল পোর্টালে পুনরায় যাচাই করুন",
    outdatedWarningBody: "এই প্রকল্পের তথ্য বর্তমানে পুরনো, যাচাই বাকি অথবা ১২ মাসের বেশি পুরনো হিসেবে চিহ্নিত আছে। আবেদন করার আগে নিচের অফিশিয়াল সরকারি ওয়েবসাইট থেকে সর্বশেষ নিয়ম ও তারিখ নিশ্চিত করে নিন।",
    secPurposeTitle: "১. প্রকল্পের উদ্দেশ্য ও সুবিধাসমূহ",
    secEligibilityTitle: "২. যোগ্যতার শর্তাবলি (বাধ্যতামূলক শর্ত)",
    secEligibilitySub: "এগুলি হলো প্রকল্পে আবেদনের মূল যোগ্যতার শর্ত — প্রয়োজনীয় কাগজপত্র আলাদাভাবে নিচে ৩ নম্বর অংশে দেওয়া আছে।",
    eligCategories: "কোন কৃষকরা যোগ্য",
    eligLand: "জমির মালিকানা সংক্রান্ত শর্ত",
    eligTenant: "ভাগচাষী / ভাড়াটে / ভূমিহীন কৃষক",
    eligWomen: "মহিলা কৃষকদের যোগ্যতা",
    eligAge: "বয়সসীমা",
    eligIncome: "আয়সীমা / আর্থিক শর্ত",
    eligResidency: "রাজ্য / স্থায়ী বাসিন্দার শর্ত",
    whoCanApply: "কারা আবেদন করতে পারবেন",
    whoCannotApply: "কারা আবেদন করতে পারবেন না (বাদ পড়ার শর্ত)",
    secDocsTitle: "৩. প্রয়োজনীয় নথিপত্রের চেকলিস্ট (শুধু এই প্রকল্পের জন্য)",
    secDocsSub: "যে কাগজপত্রগুলো আপনার কাছে তৈরি আছে সেগুলোতে টিক (✓) দিয়ে রাখুন। এখানে কেবল এই নির্দিষ্ট প্রকল্পের দরকারি নথিগুলোই দেওয়া হয়েছে।",
    docsReady: "টি প্রস্তুত",
    docMandatory: "বাধ্যতামূলক",
    docOptional: "প্রযোজ্য ক্ষেত্রে",
    secApplyTitle: "৪. কীভাবে আবেদন করবেন (অনলাইন ও অফলাইন)",
    onlineProcess: "অনলাইন আবেদন পদ্ধতি",
    offlineProcess: "অফলাইন আবেদন পদ্ধতি (তথ্যমিত্র কেন্দ্র / ব্লক কৃষি অফিস / ব্যাংক)",
    applyPortalBtn: "অফিশিয়াল আবেদন পোর্টাল খুলুন ↗",
    secContactTitle: "৫. সরকারি দপ্তর, হেল্পলাইন, সময়সীমা ও অফিশিয়াল সূত্র",
    officialSource: "অফিশিয়াল তথ্যসূত্র",
    openSourceLink: "অফিশিয়াল সরকারি সূত্র যাচাই করুন ↗",
    lastUpdateNote: "সর্বশেষ অ্যাডমিন আপডেট নোট",
    notSpecified: "স্থানীয় কৃষি অফিস বা অফিশিয়াল পোর্টালে নিশ্চিত করুন",
    portalExploreMyScheme: "আরও রাজ্য প্রকল্প দেখতে MyScheme.gov.in খুলুন ↗",
    portalIndiaGov: "ভারত সরকারের জাতীয় পোর্টাল (india.gov.in) ↗"
  }
};

function sanitizeTel(tel) {
  return String(tel || "").replace(/[^0-9+]/g, "");
}

function getActiveLang(state) {
  const ffLang = state?.farmerFinance?.schemeLang;
  if (ffLang === "BN" || ffLang === "EN") return ffLang;
  return state?.lang === "bn" ? "BN" : "EN";
}

function pickLang(lang, enVal, bnVal) {
  if (lang === "BN") return bnVal || enVal || "";
  return enVal || bnVal || "";
}

function getGovtLevelLabel(level, t) {
  if (level === "STATE") return t.stateLevel;
  if (level === "DISTRICT") return t.districtLevel;
  return t.centralLevel;
}

function getGovtLevelBadgeClass(level) {
  if (level === "STATE") return "bg-emerald-50 text-emerald-900 border-emerald-200";
  if (level === "DISTRICT") return "bg-sky-50 text-sky-900 border-sky-200";
  return "bg-indigo-50 text-indigo-900 border-indigo-200";
}

function getStatusBadge(statusKey, lang) {
  const meta = STATUS_MAP[statusKey] || STATUS_MAP.UNVERIFIED;
  const label = lang === "BN" ? meta.bn : meta.en;
  let cls = "bg-[#DCFCE7] text-[#14532D] border-[#BBF7D0]";
  if (statusKey === "SEASONAL") cls = "bg-sky-100 text-sky-900 border-sky-200";
  if (statusKey === "UNVERIFIED" || statusKey === "OUTDATED") cls = "bg-amber-100 text-amber-950 border-amber-300";
  if (statusKey === "CLOSED") cls = "bg-rose-100 text-rose-900 border-rose-200";
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${cls}">${escapeHtml(label)}</span>`;
}

function renderLanguageToggle(lang, t) {
  return `
    <div class="inline-flex items-center gap-1.5 rounded-2xl bg-[#F1F5F9] border border-[#CBD5E1] p-1" role="group" aria-label="${escapeHtml(t.langLabel)}">
      <button
        type="button"
        data-ff-scheme-lang="BN"
        aria-pressed="${lang === "BN" ? "true" : "false"}"
        class="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-colors ${
          lang === "BN"
            ? "bg-[#14532D] text-white shadow-sm"
            : "text-[#14532D] hover:bg-white"
        }"
      >
        বাংলা
      </button>
      <button
        type="button"
        data-ff-scheme-lang="EN"
        aria-pressed="${lang === "EN" ? "true" : "false"}"
        class="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-colors ${
          lang === "EN"
            ? "bg-[#14532D] text-white shadow-sm"
            : "text-[#14532D] hover:bg-white"
        }"
      >
        English
      </button>
    </div>
  `;
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================
export function renderAgricultureSchemesCentre(state) {
  const ff = state?.farmerFinance || {};
  const lang = getActiveLang(state);
  const t = UI_TEXT[lang] || UI_TEXT.EN;
  const allSchemes = mergeAgricultureSchemes(state?.agricultureSchemes || [], false);

  if (ff.selectedSchemeId) {
    const selected = allSchemes.find((s) => s.id === ff.selectedSchemeId);
    if (selected) {
      return renderSchemeDetailPage({ scheme: selected, lang, t, ff });
    }
  }

  return renderSchemeDirectory({ allSchemes, lang, t, ff });
}

// ============================================================================
// 1. SCHEMES DIRECTORY VIEW (SEARCH + STATE/DISTRICT + 23 CATEGORIES + QUICK FILTERS)
// ============================================================================
function renderSchemeDirectory({ allSchemes, lang, t, ff }) {
  const search = String(ff.schemeSearch || "");
  const stateFilter = String(ff.schemeState || "ALL");
  const districtFilter = String(ff.schemeDistrict || "ALL");
  const categoryFilter = String(ff.schemeCategory || "ALL");
  const quickFilter = String(ff.schemeQuickFilter || "ALL");

  const selectedStateObj = stateFilter !== "ALL"
    ? INDIA_STATES_AND_UTS.find((s) => s.name.toLowerCase() === stateFilter.toLowerCase())
    : null;
  const availableDistricts = selectedStateObj?.districts || [];

  const filtered = filterAgricultureSchemes(allSchemes, {
    search,
    stateFilter,
    districtFilter,
    categoryFilter,
    quickFilter
  });

  const hasActiveFilters = Boolean(
    search.trim() ||
    stateFilter !== "ALL" ||
    districtFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    quickFilter !== "ALL"
  );

  return `
    <div data-schemes-centre="true" data-schemes-lang="${lang}" class="space-y-5">
      <!-- ==================== TOP CONTROL BAR (LANGUAGE + SEARCH + CASCADING FILTERS) ==================== -->
      <section class="gv-card p-4 sm:p-6 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div class="space-y-0.5">
            <h2 class="font-display text-lg sm:text-xl font-bold text-[#14532D]">
              ${escapeHtml(lang === "BN" ? SCHEMES_DIRECTORY_META.moduleNameBn : SCHEMES_DIRECTORY_META.moduleNameEn)}
            </h2>
            <p class="text-xs text-[#475569] font-semibold">
              ${escapeHtml(lang === "BN" ? SCHEMES_DIRECTORY_META.moduleNameEn : SCHEMES_DIRECTORY_META.moduleNameBn)}
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs font-bold text-[#475569]">${escapeHtml(t.langLabel)}</span>
            ${renderLanguageToggle(lang, t)}
          </div>
        </div>

        <!-- Search + Cascading State/District + 23-Category Filters -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div class="md:col-span-12">
            <label for="ffSchemeSearch" class="block text-xs font-extrabold text-[#14532D] mb-1">${escapeHtml(t.searchLabel)}</label>
            <div class="relative">
              <input
                id="ffSchemeSearch"
                type="search"
                value="${escapeHtml(search)}"
                placeholder="${escapeHtml(t.searchPlaceholder)}"
                class="w-full min-h-[48px] rounded-2xl border border-[#CBD5E1] focus:border-[#15803D] focus:ring-2 focus:ring-[#22C55E]/25 px-4 py-2.5 text-sm bg-white text-[#0F172A] outline-none"
              />
            </div>
          </div>

          <!-- State Filter (28 States + 8 UTs) -->
          <div class="md:col-span-4">
            <label for="ffSchemeState" class="block text-xs font-extrabold text-[#14532D] mb-1">${escapeHtml(t.stateLabel)}</label>
            <select id="ffSchemeState" class="w-full min-h-[46px] rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs sm:text-sm font-semibold bg-white text-[#0F172A]">
              <option value="ALL" ${stateFilter === "ALL" ? "selected" : ""}>${escapeHtml(t.allStates)} (${INDIA_STATES_AND_UTS.length})</option>
              ${INDIA_STATES_AND_UTS.map((st) => `
                <option value="${escapeHtml(st.name)}" ${stateFilter === st.name ? "selected" : ""}>
                  ${escapeHtml(st.name)} ${st.type === "UT" ? "(UT)" : ""}
                </option>
              `).join("")}
            </select>
          </div>

          <!-- District Filter (Cascading from Selected State) -->
          <div class="md:col-span-4">
            <label for="ffSchemeDistrict" class="block text-xs font-extrabold text-[#14532D] mb-1">${escapeHtml(t.districtLabel)}</label>
            <select
              id="ffSchemeDistrict"
              ${availableDistricts.length === 0 ? "disabled" : ""}
              class="w-full min-h-[46px] rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs sm:text-sm font-semibold bg-white text-[#0F172A] disabled:bg-slate-100 disabled:text-slate-500"
            >
              ${availableDistricts.length === 0
                ? `<option value="ALL">${escapeHtml(t.selectStateFirst)}</option>`
                : `
                  <option value="ALL" ${districtFilter === "ALL" ? "selected" : ""}>${escapeHtml(t.allDistricts)} (${availableDistricts.length})</option>
                  ${availableDistricts.map((d) => `
                    <option value="${escapeHtml(d)}" ${districtFilter === d ? "selected" : ""}>${escapeHtml(d)}</option>
                  `).join("")}
                `
              }
            </select>
          </div>

          <!-- Category Filter (All 23 Categories) -->
          <div class="md:col-span-4">
            <label for="ffSchemeCategory" class="block text-xs font-extrabold text-[#14532D] mb-1">${escapeHtml(t.categoryLabel)}</label>
            <select id="ffSchemeCategory" class="w-full min-h-[46px] rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs sm:text-sm font-semibold bg-white text-[#0F172A]">
              <option value="ALL" ${categoryFilter === "ALL" ? "selected" : ""}>${escapeHtml(t.allCategories)}</option>
              ${SCHEME_CATEGORIES.map((c, idx) => `
                <option value="${escapeHtml(c.key)}" ${categoryFilter === c.key ? "selected" : ""}>
                  ${idx + 1}. ${escapeHtml(lang === "BN" ? c.bn : c.en)}
                </option>
              `).join("")}
            </select>
          </div>
        </div>

        <!-- Quick Filter Chips -->
        <div class="space-y-2 pt-1">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-[11px] font-extrabold uppercase tracking-wider text-[#475569]">${escapeHtml(t.quickFiltersLabel)}</span>
            ${hasActiveFilters ? `
              <button data-ff-action="clear-scheme-search" type="button" class="text-xs font-extrabold text-rose-700 hover:underline">
                ${escapeHtml(t.clearFilters)}
              </button>
            ` : ""}
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${SCHEME_QUICK_FILTERS.map((qf) => {
              const active = quickFilter === qf.key;
              return `
                <button
                  type="button"
                  data-ff-quick-filter="${escapeHtml(qf.key)}"
                  aria-pressed="${active ? "true" : "false"}"
                  class="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-colors ${
                    active
                      ? "bg-[#14532D] text-white border-[#14532D] shadow-sm"
                      : "bg-[#F8FAFC] text-[#14532D] border-[#D9EAE0] hover:bg-[#ECFDF5]"
                  }"
                >
                  ${escapeHtml(lang === "BN" ? qf.bn : qf.en)}
                </button>
              `;
            }).join("")}
          </div>
        </div>

        <!-- Result Count Bar -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0] text-xs font-bold text-[#334155]">
          <span>
            ${escapeHtml(t.showingPrefix)} <strong class="text-[#14532D]">${filtered.length}</strong> ${escapeHtml(t.showingOf)} <strong>${allSchemes.length}</strong> ${escapeHtml(t.schemesWord)}
          </span>
          <span class="text-[11px] text-[#64748B]">
            ${escapeHtml(t.lastVerified)}: ${escapeHtml(SCHEMES_DIRECTORY_META.lastDirectoryReviewDate)}
          </span>
        </div>
      </section>

      <!-- ==================== SCHEMES LIST / CARDS GRID ==================== -->
      ${filtered.length === 0 ? `
        <section class="gv-card p-8 text-center space-y-3">
          <h3 class="text-base font-extrabold text-[#14532D]">${escapeHtml(t.emptyTitle)}</h3>
          <p class="text-xs sm:text-sm text-[#475569] max-w-xl mx-auto leading-relaxed">${escapeHtml(t.emptyDesc)}</p>
          <button data-ff-action="clear-scheme-search" type="button" class="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#14532D] text-white text-xs sm:text-sm font-extrabold">
            ${escapeHtml(t.clearFilters)}
          </button>
        </section>
      ` : `
        <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          ${filtered.map((scheme) => renderSchemeCard(scheme, lang, t)).join("")}
        </section>
      `}

      <!-- ==================== HONEST COVERAGE & DISCLAIMER FOOTER ==================== -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="rounded-2xl bg-[#ECFDF5] border border-[#BBF7D0] p-4 sm:p-5 space-y-3">
          <div class="text-xs sm:text-sm font-extrabold text-[#14532D]">${escapeHtml(t.coverageTitle)}</div>
          <p class="text-xs text-[#334155] leading-relaxed">
            ${escapeHtml(lang === "BN" ? SCHEMES_DIRECTORY_META.coverageNoticeBn : SCHEMES_DIRECTORY_META.coverageNoticeEn)}
          </p>
          <div class="flex flex-wrap gap-2 pt-1">
            <a href="${escapeHtml(safeUrl("https://www.myscheme.gov.in/"))}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-3 py-2 rounded-xl bg-[#14532D] text-white text-xs font-extrabold hover:opacity-95">
              ${escapeHtml(t.portalExploreMyScheme)}
            </a>
            <a href="${escapeHtml(safeUrl("https://www.india.gov.in/"))}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-3 py-2 rounded-xl bg-white border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold hover:bg-[#DCFCE7]">
              ${escapeHtml(t.portalIndiaGov)}
            </a>
          </div>
        </div>

        <div class="rounded-2xl bg-[#FEFCE8] border border-[#FDE047] p-4 sm:p-5 space-y-2">
          <div class="text-xs sm:text-sm font-extrabold text-[#713F12]">${escapeHtml(t.disclaimerTitle)}</div>
          <p class="text-xs text-[#713F12] leading-relaxed">
            ${escapeHtml(lang === "BN" ? SCHEMES_DIRECTORY_META.disclaimerBn : SCHEMES_DIRECTORY_META.disclaimerEn)}
          </p>
        </div>
      </section>
    </div>
  `;
}

function renderSchemeCard(scheme, lang, t) {
  const cat = SCHEME_CATEGORY_MAP[scheme.category] || { en: scheme.category, bn: scheme.category };
  const verif = evaluateSchemeVerification(scheme);
  const titleMain = pickLang(lang, scheme.name, scheme.nameBn);
  const titleSub = lang === "BN" ? scheme.name : scheme.nameBn;
  const region = pickLang(lang, scheme.applicableRegion, scheme.applicableRegionBn);
  const purpose = pickLang(lang, scheme.purpose, scheme.purposeBn);
  const benefits = pickLang(lang, scheme.benefits, scheme.benefitsBn);
  const eligPreview = pickLang(lang, scheme.eligibility?.eligibleCategories, scheme.eligibility?.eligibleCategoriesBn);
  const portalHref = safeUrl(scheme.officialPortalUrl);
  const docsCount = Array.isArray(scheme.requiredDocuments) ? scheme.requiredDocuments.length : 0;

  return `
    <article data-scheme-card="${escapeHtml(scheme.id)}" class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-4 border ${verif.isVerifiedCurrent ? "border-[#D9EAE0]" : "border-amber-300 bg-amber-50/30"}">
      <div class="space-y-3">
        <!-- Badges Row -->
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getGovtLevelBadgeClass(scheme.govtLevel)}">
            ${escapeHtml(getGovtLevelLabel(scheme.govtLevel, t))}
          </span>
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#ECFDF5] text-[#14532D] border border-[#BBF7D0]">
            ${escapeHtml(lang === "BN" ? cat.bn : cat.en)}
          </span>
          ${getStatusBadge(scheme.status, lang)}
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${verif.badgeClass}">
            ${escapeHtml(lang === "BN" ? verif.bn : verif.en)}
          </span>
        </div>

        <!-- Title & Region -->
        <div>
          <h3 class="text-base sm:text-lg font-extrabold text-[#14532D] leading-snug">
            ${escapeHtml(titleMain)}
          </h3>
          ${titleSub && titleSub !== titleMain ? `
            <div class="text-xs font-semibold text-[#15803D] mt-0.5">${escapeHtml(titleSub)}</div>
          ` : ""}
          <div class="text-[11px] font-bold text-[#475569] mt-1">
            📍 ${escapeHtml(region || scheme.applicableState)}
            ${scheme.womenFarmerEligible ? ` • <span class="text-purple-800">${escapeHtml(t.womenBadge)}</span>` : ""}
          </div>
        </div>

        <!-- Purpose & Benefits -->
        <div class="space-y-2 text-xs text-[#334155] leading-relaxed">
          <p><strong class="text-[#0F172A]">${escapeHtml(t.purposeLabel)}:</strong> ${escapeHtml(purpose)}</p>
          <div class="rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] p-2.5 text-[#14532D]">
            <strong class="block text-[11px] uppercase tracking-wide text-[#15803D] mb-0.5">${escapeHtml(t.benefitsLabel)}</strong>
            <span>${escapeHtml(benefits)}</span>
          </div>
          ${eligPreview ? `
            <p class="text-[11px] text-[#475569]"><strong class="text-[#14532D]">${escapeHtml(t.eligibilityPreview)}:</strong> ${escapeHtml(eligPreview)}</p>
          ` : ""}
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="pt-3 border-t border-[#E2E8F0] space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-[#64748B]">
          <span>📄 ${docsCount} ${escapeHtml(t.docsCountLabel)}</span>
          <span>🗓 ${escapeHtml(t.lastVerified)}: ${escapeHtml(scheme.lastVerifiedDate || "—")}</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-ff-open-scheme="${escapeHtml(scheme.id)}"
            class="flex-1 min-h-[46px] inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#14532D] to-[#15803D] text-white text-xs sm:text-sm font-extrabold shadow-sm hover:opacity-95"
          >
            ${escapeHtml(t.viewDetails)}
          </button>
          ${portalHref ? `
            <a
              href="${escapeHtml(portalHref)}"
              target="_blank"
              rel="noopener noreferrer"
              class="min-h-[46px] inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#ECFDF5] text-[#14532D] text-xs font-extrabold"
            >
              ${escapeHtml(t.officialPortal)}
            </a>
          ` : ""}
        </div>
      </div>
    </article>
  `;
}

// ============================================================================
// 2. COMPLETE BILINGUAL SCHEME DETAIL PAGE (ALL 19 REQUIRED FIELDS)
// ============================================================================
function renderSchemeDetailPage({ scheme, lang, t, ff }) {
  const cat = SCHEME_CATEGORY_MAP[scheme.category] || { en: scheme.category, bn: scheme.category };
  const verif = evaluateSchemeVerification(scheme);
  const titleMain = pickLang(lang, scheme.name, scheme.nameBn);
  const titleSub = lang === "BN" ? scheme.name : scheme.nameBn;
  const region = pickLang(lang, scheme.applicableRegion, scheme.applicableRegionBn);
  const purpose = pickLang(lang, scheme.purpose, scheme.purposeBn);
  const benefits = pickLang(lang, scheme.benefits, scheme.benefitsBn);
  const onlineProcess = pickLang(lang, scheme.applicationProcess, scheme.applicationProcessBn);
  const offlineProcess = pickLang(lang, scheme.offlineProcess, scheme.offlineProcessBn);
  const department = pickLang(lang, scheme.department, scheme.departmentBn);
  const helpline = pickLang(lang, scheme.helpline, scheme.helplineBn);
  const deadline = pickLang(lang, scheme.deadline, scheme.deadlineBn);

  const portalHref = safeUrl(scheme.officialPortalUrl);
  const sourceHref = safeUrl(scheme.officialSourceUrl || scheme.officialPortalUrl);
  const cleanTel = sanitizeTel(scheme.helplineTel);

  const elig = scheme.eligibility || {};
  const eligibilityRows = [
    { label: t.eligCategories, value: pickLang(lang, elig.eligibleCategories, elig.eligibleCategoriesBn) },
    { label: t.eligLand, value: pickLang(lang, elig.landholding, elig.landholdingBn) },
    { label: t.eligTenant, value: pickLang(lang, elig.tenantFarmers, elig.tenantFarmersBn) },
    { label: t.eligWomen, value: pickLang(lang, elig.womenFarmers, elig.womenFarmersBn) },
    { label: t.eligAge, value: pickLang(lang, elig.ageLimit, elig.ageLimitBn) },
    { label: t.eligIncome, value: pickLang(lang, elig.incomeLimit, elig.incomeLimitBn) },
    { label: t.eligResidency, value: pickLang(lang, elig.residency, elig.residencyBn) }
  ];

  const whoCan = (lang === "BN" && Array.isArray(scheme.whoCanApplyBn) && scheme.whoCanApplyBn.length > 0)
    ? scheme.whoCanApplyBn
    : (Array.isArray(scheme.whoCanApply) ? scheme.whoCanApply : []);
  const whoCannot = (lang === "BN" && Array.isArray(scheme.whoCannotApplyBn) && scheme.whoCannotApplyBn.length > 0)
    ? scheme.whoCannotApplyBn
    : (Array.isArray(scheme.whoCannotApply) ? scheme.whoCannotApply : []);

  const docs = Array.isArray(scheme.requiredDocuments) ? scheme.requiredDocuments : [];
  const checkedMap = ff.checkedDocs || {};
  const checkedCount = docs.reduce((acc, _d, idx) => acc + (checkedMap[`${scheme.id}::${idx}`] ? 1 : 0), 0);

  return `
    <div data-scheme-detail="${escapeHtml(scheme.id)}" data-schemes-lang="${lang}" class="space-y-5">
      <!-- Top Bar: Back + Language Switcher -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          data-ff-scheme-back="true"
          class="min-h-[46px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#ECFDF5] border border-[#CBD5E1] text-[#14532D] text-xs sm:text-sm font-extrabold shadow-sm"
        >
          ${escapeHtml(t.backToList)}
        </button>
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-[#475569]">${escapeHtml(t.langLabel)}</span>
          ${renderLanguageToggle(lang, t)}
        </div>
      </div>

      <!-- Stale / Outdated / Unverified Warning (Never silently appear verified) -->
      ${!verif.isVerifiedCurrent ? `
        <div data-scheme-unverified-warning="true" class="rounded-2xl bg-amber-50 border-2 border-amber-400 p-4 sm:p-5 space-y-1.5 text-amber-950">
          <div class="text-sm font-extrabold">⚠️ ${escapeHtml(t.outdatedWarningTitle)}</div>
          <p class="text-xs sm:text-sm leading-relaxed">${escapeHtml(t.outdatedWarningBody)}</p>
        </div>
      ` : ""}

      <!-- Scheme Header Card -->
      <section class="gv-card p-5 sm:p-7 space-y-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${getGovtLevelBadgeClass(scheme.govtLevel)}">
            ${escapeHtml(getGovtLevelLabel(scheme.govtLevel, t))}
          </span>
          <span class="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#ECFDF5] text-[#14532D] border border-[#BBF7D0]">
            ${escapeHtml(lang === "BN" ? cat.bn : cat.en)}
          </span>
          ${getStatusBadge(scheme.status, lang)}
          <span class="px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${verif.badgeClass}">
            ${escapeHtml(lang === "BN" ? verif.bn : verif.en)}
          </span>
        </div>

        <div class="space-y-1">
          <div class="text-[11px] font-extrabold uppercase tracking-wider text-[#15803D]">${escapeHtml(t.detailEyebrow)}</div>
          <h2 class="font-display text-xl sm:text-3xl font-bold text-[#14532D] leading-tight">
            ${escapeHtml(titleMain)}
          </h2>
          ${titleSub && titleSub !== titleMain ? `
            <div class="text-sm sm:text-base font-bold text-[#15803D]">${escapeHtml(titleSub)}</div>
          ` : ""}
        </div>

        <!-- Quick Facts Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div class="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">${escapeHtml(t.applicableRegion)}</div>
            <div class="text-xs sm:text-sm font-extrabold text-[#0F172A] mt-0.5">${escapeHtml(region || scheme.applicableState)}</div>
          </div>
          <div class="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">${escapeHtml(t.currentStatus)}</div>
            <div class="text-xs sm:text-sm font-extrabold text-[#14532D] mt-0.5">${escapeHtml(lang === "BN" ? (STATUS_MAP[scheme.status]?.bn || scheme.status) : (STATUS_MAP[scheme.status]?.en || scheme.status))}</div>
          </div>
          <div class="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">${escapeHtml(t.lastVerified)}</div>
            <div class="text-xs sm:text-sm font-extrabold text-[#0F172A] mt-0.5">${escapeHtml(scheme.lastVerifiedDate || t.notSpecified)}</div>
          </div>
          <div class="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">${escapeHtml(t.deadline)}</div>
            <div class="text-xs sm:text-sm font-extrabold text-[#0F172A] mt-0.5">${escapeHtml(deadline || t.notSpecified)}</div>
          </div>
        </div>

        ${Array.isArray(scheme.applicableDistricts) && scheme.applicableDistricts.length > 0 ? `
          <div class="rounded-xl bg-sky-50 border border-sky-200 px-3.5 py-2.5 text-xs text-sky-950">
            <strong>${escapeHtml(t.applicableDistricts)}:</strong> ${escapeHtml(scheme.applicableDistricts.join(", "))}
          </div>
        ` : ""}
      </section>

      <!-- SECTION 1: PURPOSE & BENEFITS -->
      <section class="gv-card p-5 sm:p-6 space-y-3">
        <h3 class="text-base sm:text-lg font-extrabold text-[#14532D]">${escapeHtml(t.secPurposeTitle)}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div class="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 space-y-1.5">
            <div class="text-xs font-extrabold uppercase tracking-wider text-[#475569]">${escapeHtml(t.purposeLabel)}</div>
            <p class="text-xs sm:text-sm text-[#0F172A] leading-relaxed">${escapeHtml(purpose)}</p>
          </div>
          <div class="rounded-2xl bg-[#ECFDF5] border border-[#BBF7D0] p-4 space-y-1.5">
            <div class="text-xs font-extrabold uppercase tracking-wider text-[#15803D]">${escapeHtml(t.benefitsLabel)}</div>
            <p class="text-xs sm:text-sm font-semibold text-[#14532D] leading-relaxed">${escapeHtml(benefits)}</p>
          </div>
        </div>
      </section>

      <!-- SECTION 2: ELIGIBILITY CRITERIA (CLEARLY SEPARATED FROM DOCUMENTS) -->
      <section class="gv-card p-5 sm:p-6 space-y-4">
        <div>
          <h3 class="text-base sm:text-lg font-extrabold text-[#14532D]">${escapeHtml(t.secEligibilityTitle)}</h3>
          <p class="text-xs text-[#475569] mt-0.5">${escapeHtml(t.secEligibilitySub)}</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${eligibilityRows.map((row) => `
            <div class="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 space-y-1">
              <div class="text-[11px] font-extrabold text-[#15803D]">${escapeHtml(row.label)}</div>
              <div class="text-xs sm:text-sm text-[#0F172A] leading-relaxed">${escapeHtml(row.value || t.notSpecified)}</div>
            </div>
          `).join("")}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          <div class="rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] p-4 space-y-2">
            <h4 class="text-xs sm:text-sm font-extrabold text-[#14532D]">✓ ${escapeHtml(t.whoCanApply)}</h4>
            <ul class="space-y-1.5 text-xs sm:text-sm text-[#14532D]">
              ${whoCan.map((item) => `
                <li class="flex items-start gap-2">
                  <span class="font-extrabold text-[#15803D] shrink-0">•</span>
                  <span>${escapeHtml(item)}</span>
                </li>
              `).join("")}
            </ul>
          </div>

          <div class="rounded-2xl bg-rose-50/70 border border-rose-200 p-4 space-y-2">
            <h4 class="text-xs sm:text-sm font-extrabold text-rose-900">✕ ${escapeHtml(t.whoCannotApply)}</h4>
            <ul class="space-y-1.5 text-xs sm:text-sm text-rose-950">
              ${whoCannot.map((item) => `
                <li class="flex items-start gap-2">
                  <span class="font-extrabold text-rose-700 shrink-0">•</span>
                  <span>${escapeHtml(item)}</span>
                </li>
              `).join("")}
            </ul>
          </div>
        </div>
      </section>

      <!-- SECTION 3: SCHEME-SPECIFIC INTERACTIVE REQUIRED DOCUMENTS CHECKLIST -->
      <section class="gv-card p-5 sm:p-6 space-y-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 class="text-base sm:text-lg font-extrabold text-[#14532D]">${escapeHtml(t.secDocsTitle)}</h3>
            <p class="text-xs text-[#475569] mt-0.5">${escapeHtml(t.secDocsSub)}</p>
          </div>
          <span class="px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#BBF7D0] text-xs font-extrabold text-[#14532D]">
            ${checkedCount} / ${docs.length} ${escapeHtml(t.docsReady)}
          </span>
        </div>

        <div class="space-y-2">
          ${docs.map((doc, idx) => {
            const docKey = `${scheme.id}::${idx}`;
            const isChecked = Boolean(checkedMap[docKey]);
            const docLabel = pickLang(lang, doc.en, doc.bn);
            const docSecondary = lang === "BN" ? doc.en : doc.bn;
            const mandatory = doc.mandatory !== false;
            return `
              <button
                type="button"
                data-ff-toggle-doc="${escapeHtml(docKey)}"
                aria-pressed="${isChecked ? "true" : "false"}"
                class="w-full min-h-[52px] text-left rounded-2xl border p-3.5 flex items-center justify-between gap-3 transition-colors ${
                  isChecked
                    ? "bg-[#ECFDF5] border-[#15803D]"
                    : "bg-[#F8FAFC] border-[#E2E8F0] hover:bg-white"
                }"
              >
                <div class="flex items-start gap-3 min-w-0">
                  <span class="w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center text-xs font-extrabold shrink-0 ${
                    isChecked
                      ? "bg-[#14532D] border-[#14532D] text-white"
                      : "bg-white border-[#94A3B8] text-transparent"
                  }">✓</span>
                  <div class="min-w-0">
                    <div class="text-xs sm:text-sm font-extrabold ${isChecked ? "text-[#14532D] line-through" : "text-[#0F172A]"}">
                      ${escapeHtml(docLabel)}
                    </div>
                    ${docSecondary && docSecondary !== docLabel ? `
                      <div class="text-[11px] text-[#64748B]">${escapeHtml(docSecondary)}</div>
                    ` : ""}
                  </div>
                </div>
                <span class="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  mandatory
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }">
                  ${escapeHtml(mandatory ? t.docMandatory : t.docOptional)}
                </span>
              </button>
            `;
          }).join("")}
        </div>
      </section>

      <!-- SECTION 4: APPLICATION PROCESS (ONLINE + OFFLINE) -->
      <section class="gv-card p-5 sm:p-6 space-y-4">
        <h3 class="text-base sm:text-lg font-extrabold text-[#14532D]">${escapeHtml(t.secApplyTitle)}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div class="rounded-2xl bg-[#ECFDF5] border border-[#BBF7D0] p-4 space-y-3 flex flex-col justify-between">
            <div class="space-y-1.5">
              <div class="text-xs font-extrabold uppercase tracking-wider text-[#15803D]">${escapeHtml(t.onlineProcess)}</div>
              <p class="text-xs sm:text-sm text-[#0F172A] leading-relaxed">${escapeHtml(onlineProcess || t.notSpecified)}</p>
            </div>
            ${portalHref ? `
              <a
                href="${escapeHtml(portalHref)}"
                target="_blank"
                rel="noopener noreferrer"
                class="min-h-[48px] inline-flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-[#14532D] to-[#15803D] text-white text-xs sm:text-sm font-extrabold shadow-sm hover:opacity-95"
              >
                ${escapeHtml(t.applyPortalBtn)}
              </a>
            ` : ""}
          </div>

          <div class="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 space-y-1.5">
            <div class="text-xs font-extrabold uppercase tracking-wider text-[#475569]">${escapeHtml(t.offlineProcess)}</div>
            <p class="text-xs sm:text-sm text-[#0F172A] leading-relaxed">${escapeHtml(offlineProcess || t.notSpecified)}</p>
          </div>
        </div>
      </section>

      <!-- SECTION 5: DEPARTMENT, HELPLINE, OFFICIAL SOURCE & DISCLAIMER -->
      <section class="gv-card p-5 sm:p-6 space-y-4">
        <h3 class="text-base sm:text-lg font-extrabold text-[#14532D]">${escapeHtml(t.secContactTitle)}</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 space-y-1">
            <div class="text-[11px] font-extrabold text-[#64748B]">${escapeHtml(t.department)}</div>
            <div class="text-xs sm:text-sm font-bold text-[#0F172A]">${escapeHtml(department || t.notSpecified)}</div>
          </div>

          <div class="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 flex items-center justify-between gap-3">
            <div class="space-y-1 min-w-0">
              <div class="text-[11px] font-extrabold text-[#64748B]">${escapeHtml(t.helpline)}</div>
              <div class="text-xs sm:text-sm font-extrabold text-[#14532D]">${escapeHtml(helpline || t.notSpecified)}</div>
            </div>
            ${cleanTel ? `
              <a href="tel:${escapeHtml(cleanTel)}" class="shrink-0 min-h-[44px] inline-flex items-center px-3.5 py-2 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">
                📞 ${escapeHtml(t.callNow)}
              </a>
            ` : ""}
          </div>
        </div>

        <div class="rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="space-y-0.5 min-w-0">
            <div class="text-[11px] font-extrabold uppercase tracking-wider text-[#15803D]">${escapeHtml(t.officialSource)}</div>
            <div class="text-xs sm:text-sm font-bold text-[#14532D]">${escapeHtml(scheme.officialSourceName || department || "Official Government Portal")}</div>
            <div class="text-[11px] text-[#475569]">${escapeHtml(t.lastVerified)}: <strong>${escapeHtml(scheme.lastVerifiedDate || "—")}</strong></div>
            ${scheme.lastUpdateNote ? `
              <div class="text-[11px] text-[#334155] pt-1"><strong>${escapeHtml(t.lastUpdateNote)}:</strong> ${escapeHtml(scheme.lastUpdateNote)}</div>
            ` : ""}
          </div>
          ${sourceHref ? `
            <a href="${escapeHtml(sourceHref)}" target="_blank" rel="noopener noreferrer" class="shrink-0 min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white border border-[#15803D] text-[#14532D] text-xs font-extrabold hover:bg-[#DCFCE7]">
              ${escapeHtml(t.openSourceLink)}
            </a>
          ` : ""}
        </div>

        <div class="rounded-2xl bg-[#FEFCE8] border border-[#FDE047] p-4 text-xs text-[#713F12] leading-relaxed">
          <strong>${escapeHtml(t.disclaimerTitle)}:</strong> ${escapeHtml(lang === "BN" ? SCHEMES_DIRECTORY_META.disclaimerBn : SCHEMES_DIRECTORY_META.disclaimerEn)}
        </div>
      </section>
    </div>
  `;
}
