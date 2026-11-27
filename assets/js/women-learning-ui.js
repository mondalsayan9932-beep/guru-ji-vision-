// ============================================================================
// GURU JI VISION — WOMEN FARMER LEARNING CENTRE, YOUTUBE LIBRARY & 15-FIELD
// SCHEME DETAIL RENDERERS (PHASE 4)
// ============================================================================
// Bilingual (Bengali & English), accessible, mobile-first UI helpers imported
// by women-farmer-ui.js. Uses strict escapeHtml/safeUrl and youtube-nocookie.
// ============================================================================

import { escapeHtml, safeUrl } from "./calculators.js";
import { extractYouTubeInfo } from "./edu-cms-utils.js";
import {
  SCHEME_CATEGORY_MAP,
  evaluateSchemeVerification
} from "./govt-schemes-data.js";
import {
  WOMEN_LEARNING_PILLARS,
  WOMEN_LEARNING_PILLAR_MAP,
  WOMEN_VIDEO_CATEGORIES,
  WOMEN_VIDEO_CATEGORY_MAP,
  filterWomenLearningResources,
  filterWomenVideos,
  mergeWomenLearningResources,
  mergeWomenVideos
} from "./women-learning-data.js";

// ----------------------------------------------------------------------------
// 1. INLINE 15-FIELD BILINGUAL SCHEME DETAIL PANEL (ALL REQUIRED FIELDS)
// ----------------------------------------------------------------------------
export function renderWomenSchemeDetailPanel(scheme, classification, lang) {
  if (!scheme) return "";
  const bn = lang === "BN";
  const verif = evaluateSchemeVerification(scheme);
  const catMeta = SCHEME_CATEGORY_MAP[scheme.category] || { en: scheme.category || "Agriculture", bn: scheme.category || "কৃষি" };
  const portalUrl = safeUrl(scheme.officialPortalUrl || "");
  const sourceUrl = safeUrl(scheme.officialSourceUrl || scheme.officialPortalUrl || "");

  const officialName = bn && scheme.nameBn ? scheme.nameBn : scheme.name;
  const altName = bn && scheme.nameBn ? scheme.name : (scheme.nameBn || "");
  const department = bn ? (scheme.departmentBn || scheme.department || "") : (scheme.department || "");
  const govtLevelLabel =
    scheme.govtLevel === "STATE"
      ? (bn ? `রাজ্য সরকার (${scheme.applicableState || "State"})` : `State Government (${scheme.applicableState || "State"})`)
      : scheme.govtLevel === "DISTRICT"
        ? (bn ? `জেলা / রাজ্য পর্যায় (${scheme.applicableState || "District"})` : `District / State Programme (${scheme.applicableState || "District"})`)
        : (bn ? `কেন্দ্রীয় সরকার (${scheme.applicableState || "All India"})` : `Central Government (${scheme.applicableState || "All India"})`);
  const purpose = bn ? (scheme.purposeBn || scheme.purpose || "") : (scheme.purpose || "");
  const benefits = bn ? (scheme.benefitsBn || scheme.benefits || "") : (scheme.benefits || "");
  const elig = scheme.eligibility || {};
  const whoCan = (bn && Array.isArray(scheme.whoCanApplyBn) && scheme.whoCanApplyBn.length)
    ? scheme.whoCanApplyBn
    : (Array.isArray(scheme.whoCanApply) ? scheme.whoCanApply : []);
  const exclusions = (bn && Array.isArray(scheme.whoCannotApplyBn) && scheme.whoCannotApplyBn.length)
    ? scheme.whoCannotApplyBn
    : (Array.isArray(scheme.whoCannotApply) ? scheme.whoCannotApply : []);
  const reqDocs = (Array.isArray(scheme.requiredDocuments) ? scheme.requiredDocuments : [])
    .map((d) => (typeof d === "string" ? d : (bn ? (d?.bn || d?.en || "") : (d?.en || d?.bn || ""))))
    .filter(Boolean);
  const onlineProcess = bn ? (scheme.applicationProcessBn || scheme.applicationProcess || "") : (scheme.applicationProcess || "");
  const offlineProcess = bn ? (scheme.offlineProcessBn || scheme.offlineProcess || "") : (scheme.offlineProcess || "");
  const helpline = bn ? (scheme.helplineBn || scheme.helpline || "") : (scheme.helpline || "");
  const deadline = bn ? (scheme.deadlineBn || scheme.deadline || "") : (scheme.deadline || "");
  const lastVerified = scheme.lastVerifiedDate || (bn ? "সরকারি পোর্টালে যাচাই করুন" : "Verify on official portal");
  const sourceName = scheme.officialSourceName || department || (bn ? "সরকারি সূত্র" : "Official Source");

  return `
    <section data-wf-scheme-detail-panel="1" class="gv-card p-5 sm:p-6 border-2 border-[#14532D] bg-white space-y-5 animate-fade-up">
      <div class="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2ECE5] pb-4">
        <div class="space-y-1.5 max-w-3xl">
          <div class="flex flex-wrap items-center gap-1.5">
            ${classification?.badgeEn ? `
              <span class="px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold ${escapeHtml(classification.badgeClass || "")}">
                ${escapeHtml(bn ? classification.badgeBn : classification.badgeEn)}
              </span>
            ` : ""}
            <span class="px-2.5 py-0.5 rounded-full bg-[#EDF4EE] text-[#14532D] text-[10px] font-bold">
              ${escapeHtml(govtLevelLabel)}
            </span>
            <span class="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
              ${escapeHtml(bn ? catMeta.bn : catMeta.en)}
            </span>
            <span class="px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${escapeHtml(verif.badgeClass)}">
              ${escapeHtml(bn ? verif.bn : verif.en)}
            </span>
          </div>
          <h3 class="font-display text-lg sm:text-xl font-bold text-[#132219] leading-snug">${escapeHtml(officialName)}</h3>
          ${altName && altName !== officialName ? `<p class="text-xs font-semibold text-[#496052]">${escapeHtml(altName)}</p>` : ""}
        </div>
        <button type="button" data-wf-close-scheme-detail="1" class="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold">
          ✕ ${bn ? "তালিকায় ফিরুন" : "Close Details"}
        </button>
      </div>

      <!-- 15 Verified Fields Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div class="p-3.5 rounded-2xl bg-[#F8FBF8] border border-[#E2ECE5] space-y-1">
          <div class="text-[11px] font-extrabold uppercase tracking-wide text-[#14532D]">${bn ? "দপ্তর ও সরকার" : "Department & Government Level"}</div>
          <p class="font-bold text-[#132219]">${escapeHtml(department || "—")}</p>
          <p class="text-[#475569]">${escapeHtml(govtLevelLabel)}${scheme.applicableRegion ? ` • ${escapeHtml(bn && scheme.applicableRegionBn ? scheme.applicableRegionBn : scheme.applicableRegion)}` : ""}</p>
        </div>

        <div class="p-3.5 rounded-2xl bg-[#F8FBF8] border border-[#E2ECE5] space-y-1">
          <div class="text-[11px] font-extrabold uppercase tracking-wide text-[#14532D]">${bn ? "সময়সীমা ও সর্বশেষ যাচাইয়ের তারিখ" : "Deadline & Last Verified Date"}</div>
          <p class="text-[#132219]"><span class="font-extrabold">${bn ? "সময়সীমা:" : "Deadline:"}</span> ${escapeHtml(deadline || (bn ? "সরকারি পোর্টাল দেখুন" : "Check official portal"))}</p>
          <p class="text-[#475569]"><span class="font-extrabold">${bn ? "সর্বশেষ যাচাই:" : "Last Verified:"}</span> ${escapeHtml(lastVerified)}</p>
        </div>

        <div class="p-3.5 rounded-2xl bg-white border border-[#E2ECE5] space-y-1.5">
          <div class="text-[11px] font-extrabold uppercase tracking-wide text-[#14532D]">${bn ? "উদ্দেশ্য (Purpose)" : "Purpose"}</div>
          <p class="text-[#334155] leading-relaxed">${escapeHtml(purpose || "—")}</p>
        </div>

        <div class="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#BBF7D0] space-y-1.5">
          <div class="text-[11px] font-extrabold uppercase tracking-wide text-[#14532D]">${bn ? "প্রকল্পের সুবিধা (Benefits)" : "Benefits"}</div>
          <p class="text-[#132219] leading-relaxed">${escapeHtml(benefits || "—")}</p>
        </div>

        <div class="p-3.5 rounded-2xl bg-white border border-[#E2ECE5] space-y-1.5">
          <div class="text-[11px] font-extrabold uppercase tracking-wide text-[#14532D]">${bn ? "যোগ্যতার শর্তাবলী (Eligibility Criteria)" : "Eligibility Criteria"}</div>
          <ul class="space-y-1 text-[#334155] leading-relaxed list-disc pl-4">
            ${elig.eligibleCategories ? `<li><span class="font-bold">${bn ? "যোগ্য শ্রেণি:" : "Eligible Categories:"}</span> ${escapeHtml(bn && elig.eligibleCategoriesBn ? elig.eligibleCategoriesBn : elig.eligibleCategories)}</li>` : ""}
            ${elig.womenFarmers ? `<li><span class="font-bold">${bn ? "নারী কৃষক:" : "Women Farmers:"}</span> ${escapeHtml(bn && elig.womenFarmersBn ? elig.womenFarmersBn : elig.womenFarmers)}</li>` : ""}
            ${elig.landholding ? `<li><span class="font-bold">${bn ? "জমির শর্ত:" : "Landholding:"}</span> ${escapeHtml(bn && elig.landholdingBn ? elig.landholdingBn : elig.landholding)}</li>` : ""}
            ${elig.tenantFarmers ? `<li><span class="font-bold">${bn ? "ভাগচাষী:" : "Tenant Farmers:"}</span> ${escapeHtml(bn && elig.tenantFarmersBn ? elig.tenantFarmersBn : elig.tenantFarmers)}</li>` : ""}
            ${elig.ageLimit ? `<li><span class="font-bold">${bn ? "বয়স:" : "Age Limit:"}</span> ${escapeHtml(bn && elig.ageLimitBn ? elig.ageLimitBn : elig.ageLimit)}</li>` : ""}
            ${elig.incomeLimit ? `<li><span class="font-bold">${bn ? "আয়:" : "Income:"}</span> ${escapeHtml(bn && elig.incomeLimitBn ? elig.incomeLimitBn : elig.incomeLimit)}</li>` : ""}
            ${elig.residency ? `<li><span class="font-bold">${bn ? "বসবাস:" : "Residency:"}</span> ${escapeHtml(bn && elig.residencyBn ? elig.residencyBn : elig.residency)}</li>` : ""}
            ${whoCan.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}
          </ul>
        </div>

        <div class="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1.5">
          <div class="text-[11px] font-extrabold uppercase tracking-wide text-rose-900">${bn ? "কারা আবেদন করতে পারবেন না (Exclusions)" : "Exclusions (Where Available)"}</div>
          ${exclusions.length ? `
            <ul class="space-y-1 text-rose-950/90 leading-relaxed list-disc pl-4">
              ${exclusions.map((ex) => `<li>${escapeHtml(ex)}</li>`).join("")}
            </ul>
          ` : `
            <p class="text-rose-900/80">${bn ? "নির্দিষ্ট ব্যতিক্রম বা অযোগ্যতার শর্ত সরকারি পোর্টালে যাচাই করুন।" : "Verify specific exclusion criteria directly on the official department portal."}</p>
          `}
        </div>

        <div class="p-3.5 rounded-2xl bg-white border border-[#E2ECE5] space-y-1.5">
          <div class="text-[11px] font-extrabold uppercase tracking-wide text-[#14532D]">${bn ? "প্রয়োজনীয় কাগজপত্র (Required Documents)" : "Required Documents"}</div>
          <ul class="space-y-1 text-[#334155] leading-relaxed list-disc pl-4">
            ${reqDocs.length ? reqDocs.map((d) => `<li>${escapeHtml(d)}</li>`).join("") : `<li>${bn ? "আধার, ব্যাংক পাসবই ও সরকারি পোর্টালে উল্লিখিত নথি।" : "Aadhaar, bank passbook & documents specified on the official portal."}</li>`}
          </ul>
        </div>

        <div class="p-3.5 rounded-2xl bg-white border border-[#E2ECE5] space-y-2">
          <div>
            <div class="text-[11px] font-extrabold uppercase tracking-wide text-[#14532D]">${bn ? "অনলাইন আবেদন পদ্ধতি (Application Process)" : "Online Application Process"}</div>
            <p class="text-[#334155] leading-relaxed mt-1">${escapeHtml(onlineProcess || "—")}</p>
          </div>
          <div class="pt-2 border-t border-[#EDF4EE]">
            <div class="text-[11px] font-extrabold uppercase tracking-wide text-[#14532D]">${bn ? "অফলাইন আবেদন পদ্ধতি (Offline Process)" : "Offline Application Process"}</div>
            <p class="text-[#334155] leading-relaxed mt-1">${escapeHtml(offlineProcess || "—")}</p>
          </div>
        </div>
      </div>

      <!-- Verified Helpline, Official Website & Official Source Footer -->
      <div class="rounded-2xl bg-[#F4F9F5] border border-[#D9EAE0] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="space-y-1 text-xs">
          <div class="font-extrabold text-[#14532D]">
            📞 ${bn ? "যাচাইকৃত হেল্পলাইন:" : "Verified Helpline:"}
            ${scheme.helplineTel
              ? `<a href="tel:${escapeHtml(scheme.helplineTel)}" class="underline ml-1">${escapeHtml(helpline || scheme.helplineTel)}</a>`
              : `<span class="font-semibold text-[#334155] ml-1">${escapeHtml(helpline || (bn ? "ব্লক কৃষি অফিস / সরকারি পোর্টাল" : "Contact Block Office / Official Portal"))}</span>`}
          </div>
          <div class="text-[11px] text-[#496052]">
            ${bn ? "অফিশিয়াল সূত্র:" : "Official Source:"} <span class="font-bold text-[#132219]">${escapeHtml(sourceName)}</span>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          ${portalUrl ? `
            <a href="${escapeHtml(portalUrl)}" target="_blank" rel="noopener noreferrer" class="min-h-[42px] inline-flex items-center px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
              ${bn ? "অফিশিয়াল ওয়েবসাইট ↗" : "Official Website ↗"}
            </a>
          ` : ""}
          ${sourceUrl && sourceUrl !== portalUrl ? `
            <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer" class="min-h-[42px] inline-flex items-center px-3.5 py-2 rounded-xl bg-white border border-[#CDE0D3] text-[#14532D] text-xs font-extrabold">
              ${bn ? "সরকারি সূত্র লিংক ↗" : "Official Source Link ↗"}
            </a>
          ` : ""}
        </div>
      </div>
    </section>
  `;
}

// ----------------------------------------------------------------------------
// 2. SAFE INLINE YOUTUBE VIDEO MODAL (youtube-nocookie.com ONLY)
// ----------------------------------------------------------------------------
export function renderWomenVideoPlayerModal(wf = {}, lang = "EN") {
  if (!wf.activeVideoUrl) return "";
  const yt = extractYouTubeInfo(wf.activeVideoUrl);
  if (!yt.ok) return "";
  const bn = lang === "BN";
  const title = wf.activeVideoTitle || (bn ? "নারী কৃষক শিক্ষামূলক ভিডিও" : "Women Farmer Educational Video");

  return `
    <div id="wfVideoModal" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="w-full max-w-3xl bg-[#0F1F16] rounded-3xl overflow-hidden shadow-2xl border border-white/15">
        <div class="flex items-center justify-between gap-3 px-4 py-3 bg-[#14532D] text-white">
          <h3 class="text-sm font-extrabold truncate">${escapeHtml(title)}</h3>
          <div class="flex items-center gap-2 shrink-0">
            <a href="${escapeHtml(yt.watchUrl)}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold">
              YouTube ↗
            </a>
            <button type="button" data-wf-close-video="1" aria-label="Close video player" class="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold">
              ✕
            </button>
          </div>
        </div>
        <div class="aspect-video w-full bg-black">
          <iframe
            src="${escapeHtml(yt.embedUrl)}"
            title="${escapeHtml(title)}"
            class="w-full h-full"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 3. WOMEN FARMER LEARNING CENTRE (ALL 7 REQUIRED PILLARS — BILINGUAL)
// ----------------------------------------------------------------------------
export function renderWomenLearningCentreSubView(state, lang) {
  const bn = lang === "BN";
  const wf = state.womenFarmer || {};
  const pillar = wf.learningPillar || "ALL";
  const search = wf.learningSearch || "";

  const allGuides = mergeWomenLearningResources(state.womenLearningResources || [], false);
  const filtered = filterWomenLearningResources(allGuides, { pillar, search });
  const totalVideos = mergeWomenVideos(state.womenVideos || [], false).length;

  return `
    <div data-wf-section="learning-centre" class="space-y-5">
      <div class="rounded-2xl border border-emerald-200 bg-gradient-to-r from-[#ECFDF5] via-white to-[#F0FDF4] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="space-y-1">
          <span class="inline-block px-2.5 py-0.5 rounded-full bg-[#14532D] text-white text-[10px] font-extrabold uppercase tracking-wider">
            ${bn ? "৭টি শিক্ষণ স্তম্ভ • যাচাইকৃত উৎস" : "7 Learning Pillars • Verified Sources"}
          </span>
          <h3 class="font-display text-lg sm:text-xl font-bold text-[#14532D]">
            ${bn ? "নারী কৃষক লার্নিং সেন্টার (Women Farmer Learning Centre)" : "Women Farmer Learning Centre"}
          </h3>
          <p class="text-xs text-[#334155] leading-relaxed max-w-2xl">
            ${bn
              ? "সরকারি প্রকল্প নির্দেশিকা, আধুনিক কৃষি পদ্ধতি, ফসল উৎপাদন, বিনামূল্যে KVK/ATMA প্রশিক্ষণ, কৃষি উদ্যোক্তা, আর্থিক সাক্ষরতা ও শিক্ষামূলক ভিডিও — সব এক জায়গায়।"
              : "Structured bilingual guides covering government scheme guidance, agricultural techniques, crop production, free KVK/ATMA training, entrepreneurship, financial literacy, and educational videos."}
          </p>
        </div>
        <button type="button" data-wf-tab="videos" class="min-h-[44px] px-4 py-2 rounded-xl bg-fuchsia-800 hover:bg-fuchsia-900 text-white text-xs font-extrabold shrink-0">
          ▶ ${bn ? `ভিডিও লাইব্রেরি (${totalVideos})` : `Open Video Library (${totalVideos})`}
        </button>
      </div>

      <!-- 7 Pillar Filter Chips -->
      <div class="flex flex-wrap gap-2">
        <button type="button" data-wf-learning-pillar="ALL" class="px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-extrabold transition-colors ${
          pillar === "ALL" ? "bg-[#14532D] text-white shadow-sm" : "bg-white border border-[#CDE0D3] text-[#14532D] hover:bg-[#ECFDF5]"
        }">${bn ? `সব বিষয় (${allGuides.length})` : `All 7 Pillars (${allGuides.length})`}</button>
        ${WOMEN_LEARNING_PILLARS.map((p) => {
          const count = allGuides.filter((g) => g.pillar === p.key).length;
          return `
            <button type="button" data-wf-learning-pillar="${escapeHtml(p.key)}" class="px-3 py-2 min-h-[40px] rounded-xl text-xs font-extrabold transition-colors ${
              pillar === p.key ? "bg-[#14532D] text-white shadow-sm" : "bg-white border border-[#CDE0D3] text-[#14532D] hover:bg-[#ECFDF5]"
            }">${escapeHtml(bn ? p.bn : p.en)} (${count})</button>
          `;
        }).join("")}
      </div>

      <!-- Search Bar -->
      <div class="gv-card p-3.5">
        <input
          id="wfLearningSearch"
          type="search"
          value="${escapeHtml(search)}"
          placeholder="${bn ? "লার্নিং গাইড খুঁজুন (যেমন: মাটি পরীক্ষা, KVK, PMFME, KCC, বীমা)..." : "Search learning guides (e.g., Soil Health, KVK, PMFME, KCC, Crop Guide)..."}"
          class="w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white"
        />
      </div>

      <!-- Learning Guides Grid -->
      ${filtered.length === 0 ? `
        <div class="gv-card p-8 text-center space-y-2">
          <p class="text-sm font-bold text-[#14532D]">${bn ? "এই ফিল্টারে কোনো লার্নিং গাইড পাওয়া যায়নি।" : "No learning guides match this filter."}</p>
          <button type="button" data-wf-reset-learning="1" class="px-4 py-2 rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">
            ${bn ? "ফিল্টার রিসেট করুন" : "Reset Filter"}
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${filtered.map((g) => {
            const pMeta = WOMEN_LEARNING_PILLAR_MAP[g.pillar] || { en: g.pillar, bn: g.pillar };
            const points = bn && g.keyPointsBn?.length ? g.keyPointsBn : (g.keyPointsEn || []);
            const srcUrl = safeUrl(g.officialSourceUrl || "");
            const isVideoPillar = g.pillar === "GOVT_EDU_VIDEOS";
            return `
              <article class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div class="space-y-2.5">
                  <div class="flex flex-wrap items-center justify-between gap-1.5">
                    <span class="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-[10px] font-extrabold">
                      ${escapeHtml(bn ? pMeta.bn : pMeta.en)}
                    </span>
                    ${g.lastVerifiedDate ? `
                      <span class="text-[10px] font-bold text-[#64748B]">
                        ${bn ? "যাচাইকৃত:" : "Verified:"} ${escapeHtml(g.lastVerifiedDate)}
                      </span>
                    ` : ""}
                  </div>
                  <h4 class="text-sm sm:text-base font-extrabold text-[#132219] leading-snug">
                    ${escapeHtml(bn ? (g.titleBn || g.title) : g.title)}
                  </h4>
                  <p class="text-xs text-[#334155] leading-relaxed">
                    ${escapeHtml(bn ? (g.summaryBn || g.summary) : g.summary)}
                  </p>
                  ${points.length ? `
                    <ul class="space-y-1 text-xs text-[#1E293B] bg-[#F8FBF8] border border-[#E2ECE5] rounded-xl p-3 list-disc pl-6">
                      ${points.map((pt) => `<li class="leading-relaxed">${escapeHtml(pt)}</li>`).join("")}
                    </ul>
                  ` : ""}
                </div>
                <div class="pt-2 border-t border-[#EDF4EE] flex flex-wrap items-center justify-between gap-2">
                  <span class="text-[11px] font-semibold text-[#496052] truncate max-w-[230px]">
                    ${escapeHtml(g.officialSourceName || "Official Source")}
                  </span>
                  <div class="flex flex-wrap gap-2">
                    ${isVideoPillar ? `
                      <button type="button" data-wf-tab="videos" class="min-h-[38px] px-3 py-1.5 rounded-xl bg-fuchsia-800 hover:bg-fuchsia-900 text-white text-xs font-extrabold">
                        ▶ ${bn ? "সব ভিডিও দেখুন" : "Watch Library"}
                      </button>
                    ` : ""}
                    ${srcUrl ? `
                      <a href="${escapeHtml(srcUrl)}" target="_blank" rel="noopener noreferrer" class="min-h-[38px] inline-flex items-center px-3 py-1.5 rounded-xl bg-[#ECFDF5] hover:bg-[#DCFCE7] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">
                        ${bn ? "সরকারি উৎস ↗" : "Official Source ↗"}
                      </a>
                    ` : ""}
                  </div>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      `}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 4. WOMEN FARMER YOUTUBE LEARNING LIBRARY (ALL 10 CATEGORIES + St_38fwwE1M)
// ----------------------------------------------------------------------------
export function renderWomenYouTubeLibrarySubView(state, lang) {
  const bn = lang === "BN";
  const wf = state.womenFarmer || {};
  const catFilter = wf.videoCategory || "ALL";
  const langFilter = wf.videoLanguage || "ALL";
  const search = wf.videoSearch || "";

  const allVideos = mergeWomenVideos(state.womenVideos || [], false);
  const filtered = filterWomenVideos(allVideos, {
    category: catFilter,
    language: langFilter,
    search
  });

  return `
    <div data-wf-section="youtube-library" class="space-y-4">
      ${renderWomenVideoPlayerModal(wf, lang)}

      <div class="gv-card p-4 sm:p-5 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 class="font-display text-lg font-bold text-[#14532D]">
              ${bn ? "নারী কৃষক YouTube শিক্ষামূলক ভিডিও লাইব্রেরি" : "Women Farmer YouTube Learning Library"}
            </h3>
            <p class="text-xs text-[#496052]">
              ${bn
                ? "১০টি কৃষি বিভাগের যাচাইকৃত প্রশিক্ষণ ভিডিও — নারী কৃষক ও কৃষি শিক্ষার্থী উভয়ের জন্য নিরাপদ ইনলাইন প্লেব্যাক।"
                : "Verified training videos across 10 categories — accessible to both Women Farmers & Agriculture Students with safe inline playback."}
            </p>
          </div>
          ${state.isAdmin ? `
            <button type="button" data-nav="admin" data-open-admin-sub="women-cms" class="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0C3B20] text-xs font-extrabold shrink-0">
              + ${bn ? "ভিডিও যোগ/সম্পাদনা (Admin)" : "Manage Videos (Admin)"}
            </button>
          ` : ""}
        </div>

        <!-- 10 Category Chips -->
        <div class="flex flex-wrap gap-1.5">
          <button type="button" data-wf-video-cat="ALL" class="px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-extrabold ${
            catFilter === "ALL" ? "bg-[#14532D] text-white" : "bg-[#F4F9F5] border border-[#CDE0D3] text-[#14532D]"
          }">${bn ? `সব ১০টি বিভাগ (${allVideos.length})` : `All 10 Categories (${allVideos.length})`}</button>
          ${WOMEN_VIDEO_CATEGORIES.map((c) => {
            const cnt = allVideos.filter((v) => v.category === c.key).length;
            return `
              <button type="button" data-wf-video-cat="${escapeHtml(c.key)}" class="px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-bold ${
                catFilter === c.key ? "bg-[#14532D] text-white" : "bg-white border border-[#CDE0D3] text-[#14532D] hover:bg-[#ECFDF5]"
              }">${escapeHtml(bn ? c.bn : c.en)}${cnt ? ` (${cnt})` : ""}</button>
            `;
          }).join("")}
        </div>

        <!-- Search & Language Filter -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input
            id="wfVideoSearch"
            type="search"
            value="${escapeHtml(search)}"
            placeholder="${bn ? "ভিডিও খুঁজুন (বাংলা বা English)..." : "Search videos by title, topic or category..."}"
            class="sm:col-span-2 px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white"
          />
          <select id="wfVideoLanguage" class="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white">
            <option value="ALL">${bn ? "সব ভাষা" : "All Languages"}</option>
            <option value="BILINGUAL" ${langFilter === "BILINGUAL" ? "selected" : ""}>Bengali + English</option>
            <option value="BN" ${langFilter === "BN" ? "selected" : ""}>Bengali (বাংলা)</option>
            <option value="EN" ${langFilter === "EN" ? "selected" : ""}>English</option>
            <option value="HI" ${langFilter === "HI" ? "selected" : ""}>Hindi (हिन्दी)</option>
          </select>
        </div>
      </div>

      ${filtered.length === 0 ? `
        <div class="gv-card p-8 text-center space-y-2">
          <p class="text-sm font-extrabold text-[#14532D]">${bn ? "এই বিভাগে এখনো কোনো ভিডিও প্রকাশিত হয়নি।" : "No published videos match this category or search yet."}</p>
          <p class="text-xs text-[#496052]">${bn ? "অ্যাডমিন Women Farmer CMS থেকে নতুন YouTube ভিডিও যোগ করলে এখানে দেখা যাবে।" : "Admins can add verified YouTube videos under any of the 10 categories in Women Farmer CMS."}</p>
          <button type="button" data-wf-reset-videos="1" class="px-4 py-2 rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">
            ${bn ? "সব ভিডিও দেখুন" : "Show All Videos"}
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filtered.map((v) => {
            const yt = extractYouTubeInfo(v.youtubeUrl);
            const thumb = safeUrl(v.thumbnailUrl || (yt.ok ? yt.thumbnailUrl : ""));
            const watchHref = safeUrl(yt.ok ? yt.watchUrl : v.youtubeUrl);
            const catMeta = WOMEN_VIDEO_CATEGORY_MAP[v.category] || { en: v.category, bn: v.category };
            const title = bn && v.titleBn ? v.titleBn : v.title;
            const desc = bn && v.descriptionBn ? v.descriptionBn : v.description;
            return `
              <article data-wf-video-id="${escapeHtml(v.videoId || v.id)}" class="gv-card overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div class="relative aspect-video bg-slate-900 overflow-hidden">
                    ${thumb ? `
                      <img src="${escapeHtml(thumb)}" alt="${escapeHtml(title)}" class="w-full h-full object-cover" loading="lazy" />
                    ` : `
                      <div class="w-full h-full flex items-center justify-center text-white text-xs font-extrabold">YouTube Video</div>
                    `}
                    <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-extrabold">
                      ${escapeHtml(bn ? catMeta.bn : catMeta.en)}
                    </span>
                    <span class="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#14532D]/90 text-white text-[10px] font-extrabold">
                      ${escapeHtml(v.language === "BILINGUAL" ? "BN/EN" : v.language)}
                    </span>
                  </div>
                  <div class="p-4 space-y-2">
                    <h4 class="text-sm font-extrabold text-[#132219] leading-snug">${escapeHtml(title)}</h4>
                    ${desc ? `<p class="text-xs text-[#496052] leading-relaxed line-clamp-3">${escapeHtml(desc)}</p>` : ""}
                    <div class="flex flex-wrap items-center justify-between gap-1 text-[11px] text-[#64748B]">
                      <span class="truncate max-w-[180px]">${escapeHtml(v.sourceName || "YouTube")}</span>
                      ${v.lastVerifiedDate ? `<span>${escapeHtml(v.lastVerifiedDate)}</span>` : ""}
                    </div>
                  </div>
                </div>
                <div class="px-4 pb-4 flex flex-wrap gap-2">
                  ${yt.ok ? `
                    <button
                      type="button"
                      data-wf-play-video="${escapeHtml(yt.watchUrl)}"
                      data-wf-play-title="${escapeHtml(title)}"
                      class="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold"
                    >▶ ${bn ? "ভিডিও দেখুন" : "Watch Video"}</button>
                  ` : ""}
                  ${watchHref ? `
                    <a href="${escapeHtml(watchHref)}" target="_blank" rel="noopener noreferrer" class="min-h-[42px] inline-flex items-center justify-center px-3 py-2 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-extrabold">
                      YouTube ↗
                    </a>
                  ` : ""}
                </div>
              </article>
            `;
          }).join("")}
        </div>
      `}
    </div>
  `;
}
