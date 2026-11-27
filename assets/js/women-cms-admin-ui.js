// ============================================================================
// GURU JI VISION — ADMIN WOMEN FARMER CMS STUDIO (PHASE 4)
// ============================================================================
// Authorized Admin-only studio inside Admin Control Studio for managing:
// 1. Government Schemes (WB & Central Women-Eligible quick manager + link to full editor)
// 2. YouTube Learning Library (all 10 categories — add, edit, publish/unpublish, delete)
// 3. Women Farmer Learning Centre (all 7 pillars — add, edit, publish/unpublish, delete)
// 4. Automatic Official Scheme Discovery + Admin Review Queue (PENDING_REVIEW -> Verified)
// ============================================================================

import { escapeHtml, safeUrl } from "./calculators.js";
import {
  SCHEME_CATEGORIES,
  evaluateSchemeVerification,
  mergeAgricultureSchemes
} from "./govt-schemes-data.js";
import { getWomenSchemeClassification } from "./women-farmer-data.js";
import {
  WOMEN_LEARNING_PILLARS,
  WOMEN_LEARNING_PILLAR_MAP,
  WOMEN_VIDEO_CATEGORIES,
  WOMEN_VIDEO_CATEGORY_MAP,
  isDuplicateDiscoveredScheme,
  mergeWomenLearningResources,
  mergeWomenVideos
} from "./women-learning-data.js";

const DEFAULT_SOURCE_CAPABILITIES = [
  { name: "PIB — Ministry of Agriculture & Farmers Welfare (Official RSS)", mode: "AUTOMATIC", notes: "Discovers new Central agri & women-farmer announcements for Admin Review." },
  { name: "PIB — Rural Development / Fisheries / Livestock RSS", mode: "AUTOMATIC", notes: "Discovers DAY-NRLM, SHG, PMMSY, NLM & PMFME press releases." },
  { name: "FAO Newsroom RSS (Women in Agriculture)", mode: "AUTOMATIC", notes: "Discovers FAO women-farmer programmes & training notes." },
  { name: "West Bengal Matir Katha, Krishak Bandhu, BSB & Anandadhara Portals", mode: "ADMIN_MANAGED", notes: "No open scheme RSS feed — Admins verify official WB circulars manually." },
  { name: "MyScheme, PMFME & DAY-NRLM Official Portals", mode: "ADMIN_MANAGED", notes: "Manual Admin verification ensures exact eligibility & subsidy accuracy." }
];

export function renderAdminWomenCmsView(state) {
  if (!state.user || !state.isAdmin) {
    return `
      <div class="gv-card p-6 text-center text-sm font-bold text-rose-800 bg-rose-50 border border-rose-200">
        Authorized Admin permissions are required to manage Women Farmer CMS content.
      </div>
    `;
  }

  const cms = state.womenCms || {};
  const section = cms.section || "videos";
  const allSchemes = mergeAgricultureSchemes(state.agricultureSchemes || [], true);
  const womenSchemes = allSchemes.filter((s) => s.womenFarmerEligible !== false);
  const allVideos = mergeWomenVideos(state.womenVideos || [], true);
  const allLearning = mergeWomenLearningResources(state.womenLearningResources || [], true);
  const queue = Array.isArray(state.womenSchemeDiscoveryQueue) ? state.womenSchemeDiscoveryQueue : [];
  const pendingCount = queue.filter((q) => q.reviewStatus === "PENDING_REVIEW").length;

  const subTabs = [
    ["videos", `YouTube Library (${allVideos.length})`],
    ["learning", `Learning Centre (${allLearning.length})`],
    ["discovery", `Auto Discovery & Queue (${pendingCount} Pending)`],
    ["schemes", `WB & Central Schemes (${womenSchemes.length})`]
  ];

  return `
    <div data-admin-women-cms="1" class="space-y-4">
      <div class="gv-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#FDF4FF] via-white to-[#ECFDF5]">
        <div>
          <h3 class="font-display text-lg font-bold text-[#14532D]">Women Farmer Zone Content Studio</h3>
          <p class="text-xs text-[#496052]">
            Manage West Bengal &amp; Central women-eligible schemes, 10-category YouTube Learning Library, 7-pillar Learning Centre, and Automatic Official Discovery Review Queue.
          </p>
        </div>
        <button type="button" data-nav="women-farmer" class="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold shrink-0">
          Preview Women Farmer Zone →
        </button>
      </div>

      <div class="flex flex-wrap gap-1.5">
        ${subTabs.map(([k, label]) => `
          <button
            type="button"
            data-wcms-section="${k}"
            class="px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-extrabold transition-colors ${
              section === k ? "bg-[#14532D] text-white shadow-sm" : "bg-white border border-[#CDE0D3] text-[#14532D]"
            }"
          >${escapeHtml(label)}</button>
        `).join("")}
      </div>

      ${section === "videos" ? renderAdminWomenVideosSection(state, allVideos) : ""}
      ${section === "learning" ? renderAdminWomenLearningSection(state, allLearning) : ""}
      ${section === "discovery" ? renderAdminSchemeDiscoverySection(state, queue, allSchemes) : ""}
      ${section === "schemes" ? renderAdminWomenSchemesQuickSection(state, womenSchemes) : ""}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// A. ADMIN YOUTUBE LEARNING LIBRARY CRUD (ALL 10 CATEGORIES)
// ----------------------------------------------------------------------------
function renderAdminWomenVideosSection(state, allVideos) {
  const cloudVideos = Array.isArray(state.womenVideos) ? state.womenVideos : [];
  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form id="adminWomenVideoForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
        <div class="flex items-center justify-between">
          <h4 id="awvFormTitle" class="text-base font-extrabold text-[#14532D]">Add Women Farmer YouTube Video</h4>
          <button id="awvCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
        </div>
        <input id="awvEditId" type="hidden" value="" />
        <input id="awvUrl" type="url" required placeholder="YouTube URL * (e.g. https://youtu.be/St_38fwwE1M)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
        <input id="awvTitle" type="text" required minlength="2" maxlength="160" placeholder="Video Title (English) *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
        <input id="awvTitleBn" type="text" maxlength="200" placeholder="Video Title (Bengali / বাংলা)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <div class="grid grid-cols-2 gap-2">
          <select id="awvCategory" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
            ${WOMEN_VIDEO_CATEGORIES.map((c) => `<option value="${escapeHtml(c.key)}">${escapeHtml(c.en)}</option>`).join("")}
          </select>
          <select id="awvLanguage" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
            <option value="BILINGUAL">Bengali + English</option>
            <option value="BN">Bengali (বাংলা)</option>
            <option value="EN">English</option>
            <option value="HI">Hindi</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <select id="awvAudience" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
            <option value="BOTH">Women Farmers &amp; Students</option>
            <option value="WOMEN_FARMER">Women Farmers Only</option>
          </select>
          <input id="awvVerifiedDate" type="date" value="${escapeHtml(new Date().toISOString().slice(0, 10))}" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <input id="awvSourceName" type="text" maxlength="160" placeholder="Channel / Official Source Name (e.g., ICAR / KVK / DD Kisan)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <textarea id="awvDesc" rows="2" maxlength="1000" placeholder="Short description (English)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
        <textarea id="awvDescBn" rows="2" maxlength="1200" placeholder="সংক্ষিপ্ত বিবরণ (বাংলা)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
        <label class="flex items-center gap-2 text-xs font-bold text-[#14532D] pt-1">
          <input id="awvPublished" type="checkbox" checked class="w-4 h-4 accent-[#14532D]" />
          Publish immediately to Women Farmer Zone (and Student Zone if shared)
        </label>
        <button type="submit" class="w-full min-h-[44px] py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">
          Save YouTube Video
        </button>
      </form>

      <div class="lg:col-span-7 gv-card p-5 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <h4 class="text-base font-extrabold text-[#14532D]">Curated YouTube Library (${allVideos.length})</h4>
          <span class="text-[11px] font-bold text-[#496052]">${cloudVideos.length} Cloud • ${allVideos.length - cloudVideos.length} Baseline</span>
        </div>
        <div class="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
          ${allVideos.map((v) => {
            const catMeta = WOMEN_VIDEO_CATEGORY_MAP[v.category] || { en: v.category };
            return `
              <div class="p-3.5 rounded-2xl bg-[#F8FBF8] border border-[#E2ECE5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="min-w-0 space-y-1">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${v.published ? "bg-[#DCFCE7] text-[#14532D]" : "bg-amber-100 text-amber-900"}">
                      ${v.published ? "Published" : "Draft / Unpublished"}
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[10px] font-bold text-[#14532D]">
                      ${escapeHtml(catMeta.en)}
                    </span>
                    <span class="text-[10px] font-bold text-[#64748B]">${v.fromCloud ? "Cloud" : "Baseline Reference"} • ${escapeHtml(v.videoId || "")}</span>
                  </div>
                  <div class="text-sm font-extrabold text-[#132219] truncate">${escapeHtml(v.title)}</div>
                  ${v.titleBn && v.titleBn !== v.title ? `<div class="text-xs text-[#496052] truncate">${escapeHtml(v.titleBn)}</div>` : ""}
                </div>
                <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button type="button" data-wcms-edit-video="${escapeHtml(v.id)}" class="px-2.5 py-1.5 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-extrabold">
                    ${v.fromCloud ? "Edit" : "Clone & Edit"}
                  </button>
                  ${v.fromCloud ? `
                    <button type="button" data-wcms-toggle-video="${escapeHtml(v.id)}" data-next-pub="${v.published ? "0" : "1"}" class="px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-900 text-[11px] font-extrabold">
                      ${v.published ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" data-wcms-del-video="${escapeHtml(v.id)}" class="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-extrabold">
                      Delete
                    </button>
                  ` : ""}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// B. ADMIN LEARNING CENTRE CRUD (ALL 7 PILLARS)
// ----------------------------------------------------------------------------
function renderAdminWomenLearningSection(state, allLearning) {
  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form id="adminWomenLearningForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
        <div class="flex items-center justify-between">
          <h4 id="awlFormTitle" class="text-base font-extrabold text-[#14532D]">Add Learning Centre Guide</h4>
          <button id="awlCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
        </div>
        <input id="awlEditId" type="hidden" value="" />
        <select id="awlPillar" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
          ${WOMEN_LEARNING_PILLARS.map((p) => `<option value="${escapeHtml(p.key)}">${escapeHtml(p.en)}</option>`).join("")}
        </select>
        <input id="awlTitle" type="text" required minlength="2" maxlength="180" placeholder="Guide Title (English) *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
        <input id="awlTitleBn" type="text" maxlength="220" placeholder="Guide Title (Bengali / বাংলা)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <textarea id="awlSummary" rows="2" required minlength="5" maxlength="1200" placeholder="Summary / Guidance (English) *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
        <textarea id="awlSummaryBn" rows="2" maxlength="1500" placeholder="সংক্ষিপ্ত নির্দেশিকা (বাংলা)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
        <textarea id="awlPointsEn" rows="2" placeholder="Key Action Steps (English — one per line)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
        <textarea id="awlPointsBn" rows="2" placeholder="গুরুত্বপূর্ণ ধাপসমূহ (বাংলা — প্রতি লাইনে একটি)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
        <input id="awlSourceName" type="text" required minlength="2" maxlength="180" placeholder="Official Source Name * (e.g., ICAR / WBSRLM / RBI)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <div class="grid grid-cols-2 gap-2">
          <input id="awlSourceUrl" type="url" placeholder="Official Source URL (https://...)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="awlVerifiedDate" type="date" required value="${escapeHtml(new Date().toISOString().slice(0, 10))}" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <label class="flex items-center gap-2 text-xs font-bold text-[#14532D] pt-1">
          <input id="awlPublished" type="checkbox" checked class="w-4 h-4 accent-[#14532D]" />
          Publish immediately to Women Farmer Learning Centre
        </label>
        <button type="submit" class="w-full min-h-[44px] py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">
          Save Learning Guide
        </button>
      </form>

      <div class="lg:col-span-7 gv-card p-5 space-y-3">
        <h4 class="text-base font-extrabold text-[#14532D]">Women Farmer Learning Centre Guides (${allLearning.length})</h4>
        <div class="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
          ${allLearning.map((g) => {
            const pMeta = WOMEN_LEARNING_PILLAR_MAP[g.pillar] || { en: g.pillar };
            return `
              <div class="p-3.5 rounded-2xl bg-[#F8FBF8] border border-[#E2ECE5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="min-w-0 space-y-1">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${g.published ? "bg-[#DCFCE7] text-[#14532D]" : "bg-amber-100 text-amber-900"}">
                      ${g.published ? "Published" : "Draft"}
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[10px] font-bold text-[#14532D]">
                      ${escapeHtml(pMeta.en)}
                    </span>
                    <span class="text-[10px] text-[#64748B]">Verified: ${escapeHtml(g.lastVerifiedDate || "—")}</span>
                  </div>
                  <div class="text-sm font-extrabold text-[#132219] truncate">${escapeHtml(g.title)}</div>
                  <div class="text-[11px] text-[#496052] truncate">${escapeHtml(g.officialSourceName || "")}</div>
                </div>
                <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button type="button" data-wcms-edit-learning="${escapeHtml(g.id)}" class="px-2.5 py-1.5 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-extrabold">
                    ${g.fromCloud ? "Edit" : "Clone & Edit"}
                  </button>
                  ${g.fromCloud ? `
                    <button type="button" data-wcms-toggle-learning="${escapeHtml(g.id)}" data-next-pub="${g.published ? "0" : "1"}" class="px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-900 text-[11px] font-extrabold">
                      ${g.published ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" data-wcms-del-learning="${escapeHtml(g.id)}" class="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-extrabold">
                      Delete
                    </button>
                  ` : ""}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// C. AUTOMATIC OFFICIAL SCHEME DISCOVERY & ADMIN REVIEW QUEUE
// ----------------------------------------------------------------------------
function renderAdminSchemeDiscoverySection(state, queue, allSchemes) {
  const cms = state.womenCms || {};
  const scanResults = Array.isArray(cms.discoveryResults) ? cms.discoveryResults : [];
  const capabilities = Array.isArray(cms.sourceCapabilities) && cms.sourceCapabilities.length
    ? cms.sourceCapabilities
    : DEFAULT_SOURCE_CAPABILITIES;

  return `
    <div class="space-y-4">
      <div class="gv-card p-5 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 class="text-base font-extrabold text-[#14532D]">Automatic Official Scheme Discovery (Allowlist-Only RSS → Review Queue)</h4>
            <p class="text-xs text-[#496052] leading-relaxed">
              Scans permitted official RSS feeds (PIB Ministry of Agriculture, Rural Development/Fisheries/Livestock &amp; FAO). Discovered items NEVER auto-publish — they go strictly to the Admin Review Queue for verification of benefits, eligibility &amp; official links.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <input id="wcmsDiscoverQuery" type="search" value="${escapeHtml(cms.discoveryQuery || "")}" placeholder="Optional filter (e.g., West Bengal, SHG, Fisheries)" class="px-3 py-2 min-h-[42px] rounded-xl border border-[#CDE0D3] text-xs bg-white w-56" />
            <button type="button" id="wcmsRunDiscoveryBtn" ${cms.discoveryLoading ? "disabled" : ""} class="min-h-[42px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] disabled:opacity-60 text-white text-xs font-extrabold">
              ${cms.discoveryLoading ? "Scanning Official Feeds..." : "Scan Official Feeds Now"}
            </button>
          </div>
        </div>

        ${cms.discoveryStatusMsg ? `
          <div class="rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] px-3.5 py-2 text-xs font-bold text-[#14532D]">
            ${escapeHtml(cms.discoveryStatusMsg)}
          </div>
        ` : ""}

        ${scanResults.length ? `
          <div class="space-y-2 pt-2">
            <div class="text-xs font-extrabold text-[#14532D]">Live Scan Candidates (${scanResults.length}) — Queue for Admin Verification:</div>
            <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              ${scanResults.map((cand, idx) => {
                const isDup = isDuplicateDiscoveredScheme(cand, queue, allSchemes);
                const href = safeUrl(cand.officialSourceUrl);
                return `
                  <div class="p-3 rounded-xl bg-[#F8FBF8] border border-[#E2ECE5] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div class="min-w-0 space-y-1">
                      <div class="flex flex-wrap items-center gap-1.5">
                        <span class="px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 text-[10px] font-extrabold">${escapeHtml(cand.suggestedState)} • ${escapeHtml(cand.suggestedGovtLevel)}</span>
                        <span class="px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-900 text-[10px] font-bold">${escapeHtml(cand.suggestedCategory)}</span>
                        <span class="text-[10px] text-[#64748B]">${escapeHtml(cand.publicationDate)}</span>
                      </div>
                      <div class="text-xs font-extrabold text-[#132219]">${escapeHtml(cand.title)}</div>
                      <div class="text-[11px] text-[#496052]">${escapeHtml(cand.sourceName)}</div>
                    </div>
                    <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                      ${href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 rounded-lg bg-white border border-[#CDE0D3] text-[#14532D] text-[11px] font-bold">Source ↗</a>` : ""}
                      ${isDup
                        ? `<span class="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">Already Queued / Live</span>`
                        : `<button type="button" data-wcms-queue-candidate="${idx}" class="px-3 py-1.5 rounded-lg bg-[#14532D] text-white text-[11px] font-extrabold">+ Send to Review Queue</button>`}
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        ` : ""}
      </div>

      <!-- Firestore Admin Review Queue -->
      <div class="gv-card p-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-base font-extrabold text-[#14532D]">Admin Scheme Review Queue (${queue.length})</h4>
          <button type="button" data-admin-sub="schemes" class="px-3 py-1.5 rounded-xl bg-[#EDF4EE] text-[#14532D] text-xs font-extrabold">
            + Manual Official Scheme Entry →
          </button>
        </div>

        ${queue.length === 0 ? `
          <p class="text-xs text-[#64748B]">No items in the Admin Review Queue yet. Click "Scan Official Feeds Now" above or add official West Bengal / Central schemes manually.</p>
        ` : `
          <div class="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            ${queue.map((item) => {
              const href = safeUrl(item.officialSourceUrl);
              const badge =
                item.reviewStatus === "APPROVED_PUBLISHED"
                  ? "bg-[#DCFCE7] text-[#14532D]"
                  : item.reviewStatus === "REJECTED"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-900";
              return `
                <div class="p-3.5 rounded-2xl bg-[#F8FBF8] border border-[#E2ECE5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="min-w-0 space-y-1">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badge}">${escapeHtml(item.reviewStatus)}</span>
                      <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[10px] font-bold text-[#14532D]">${escapeHtml(item.suggestedState || "All India")}</span>
                      <span class="text-[10px] text-[#64748B]">${escapeHtml(item.publicationDate || "")}</span>
                    </div>
                    <div class="text-sm font-extrabold text-[#132219]">${escapeHtml(item.title)}</div>
                    <p class="text-[11px] text-[#496052] line-clamp-2">${escapeHtml(item.summary || "")}</p>
                    <div class="text-[10px] text-[#64748B]">Source: ${escapeHtml(item.sourceName || "")}</div>
                  </div>
                  <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                    ${href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 rounded-lg bg-white border border-[#CDE0D3] text-[#14532D] text-[11px] font-bold">Verify ↗</a>` : ""}
                    <button type="button" data-wcms-promote-queue="${escapeHtml(item.id)}" class="px-2.5 py-1.5 rounded-lg bg-[#14532D] text-white text-[11px] font-extrabold">Promote to Scheme Form →</button>
                    ${item.reviewStatus !== "APPROVED_PUBLISHED" ? `<button type="button" data-wcms-queue-status="${escapeHtml(item.id)}" data-status="APPROVED_PUBLISHED" class="px-2.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 text-[11px] font-extrabold">Approve</button>` : ""}
                    ${item.reviewStatus !== "REJECTED" ? `<button type="button" data-wcms-queue-status="${escapeHtml(item.id)}" data-status="REJECTED" class="px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-900 text-[11px] font-extrabold">Reject</button>` : ""}
                    <button type="button" data-wcms-del-queue="${escapeHtml(item.id)}" class="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-extrabold">Delete</button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>

      <!-- Source Transparency & Manual Fallback Matrix -->
      <div class="gv-card p-5 space-y-2.5">
        <h4 class="text-sm font-extrabold text-[#14532D]">Official Source Capability &amp; Manual Update Policy</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          ${capabilities.map((cap) => `
            <div class="p-3 rounded-xl bg-[#F8FBF8] border border-[#E2ECE5] space-y-1">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-extrabold text-[#132219]">${escapeHtml(cap.name)}</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${cap.mode === "AUTOMATIC" ? "bg-[#DCFCE7] text-[#14532D]" : "bg-amber-100 text-amber-900"}">
                  ${cap.mode === "AUTOMATIC" ? "Auto RSS" : "Manual Admin"}
                </span>
              </div>
              <p class="text-[11px] text-[#496052]">${escapeHtml(cap.notes || "")}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// D. QUICK WB & CENTRAL WOMEN-ELIGIBLE SCHEMES MANAGER
// ----------------------------------------------------------------------------
function renderAdminWomenSchemesQuickSection(state, womenSchemes) {
  const wbCount = womenSchemes.filter((s) => String(s.applicableState || "").toLowerCase().includes("west bengal")).length;
  const centralCount = womenSchemes.filter((s) => s.govtLevel === "CENTRAL").length;

  return `
    <div class="gv-card p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 class="text-base font-extrabold text-[#14532D]">West Bengal &amp; Central Women-Eligible Schemes (${womenSchemes.length})</h4>
          <p class="text-xs text-[#496052]">
            ${wbCount} West Bengal State/District schemes • ${centralCount} Central Government schemes • Zero duplication (shared with Govt Schemes engine).
          </p>
        </div>
        <button type="button" data-admin-sub="schemes" class="min-h-[42px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold shrink-0">
          + Add / Edit Full Bilingual Scheme →
        </button>
      </div>

      <div class="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
        ${womenSchemes.map((s) => {
          const cls = getWomenSchemeClassification(s);
          const verif = evaluateSchemeVerification(s);
          const portal = safeUrl(s.officialPortalUrl || s.officialSourceUrl);
          return `
            <div class="p-3.5 rounded-2xl bg-[#F8FBF8] border border-[#E2ECE5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="min-w-0 space-y-1">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${escapeHtml(cls.badgeClass || "")}">${escapeHtml(cls.badgeEn || "Women Eligible")}</span>
                  <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[10px] font-bold text-[#14532D]">${escapeHtml(s.applicableState || "All India")} (${escapeHtml(s.govtLevel)})</span>
                  <span class="px-2 py-0.5 rounded-full border text-[10px] font-bold ${escapeHtml(verif.badgeClass)}">${escapeHtml(verif.en)}</span>
                </div>
                <div class="text-sm font-extrabold text-[#132219] truncate">${escapeHtml(s.name)}</div>
                ${s.nameBn ? `<div class="text-xs text-[#496052] truncate">${escapeHtml(s.nameBn)}</div>` : ""}
              </div>
              <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                ${portal ? `<a href="${escapeHtml(portal)}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 rounded-lg bg-white border border-[#CDE0D3] text-[#14532D] text-[11px] font-bold">Portal ↗</a>` : ""}
                <button type="button" data-wcms-open-scheme-editor="${escapeHtml(s.id)}" class="px-3 py-1.5 rounded-lg bg-[#EDF4EE] hover:bg-[#DCFCE7] text-[#14532D] text-[11px] font-extrabold">
                  Edit / Verify →
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}
