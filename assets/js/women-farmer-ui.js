// ============================================================================
// GURU JI VISION — WOMEN FARMER ZONE & DISCUSSION BOARD UI (PHASE 6)
// ============================================================================
// Module: Women Farmer Zone | নারী কৃষক সহায়তা কেন্দ্র
// - Bilingual UI switcher (English & simple Bengali)
// - International Year of the Woman Farmer (2026) recognition banner (UN / FAO)
// - All 15 Women Farmer Zone dashboard areas
// - Zero-duplication integration with Phase 5 verified schemes database
// - Full Women Farmer Discussion Board with 11 categories, threaded comments,
//   replies, per-user likes, owner edit/delete, moderator controls & reporting
// - Original user-written posts & comments are NEVER modified or auto-translated
// - Strict XSS escaping on every user-supplied field; no personal phone/email shown
// ============================================================================

import { escapeHtml, formatDateShort, safeUrl } from "./calculators.js";
import { getAllStatesList } from "./india-mandi-directory.js";
import {
  SCHEME_CATEGORIES,
  SCHEME_CATEGORY_MAP,
  evaluateSchemeVerification
} from "./govt-schemes-data.js";
import {
  INTERNATIONAL_WOMEN_FARMER_BANNER,
  WOMEN_DISCUSSION_CATEGORIES,
  WOMEN_DISCUSSION_POST_CATEGORIES,
  WOMEN_FARMER_DASHBOARD_AREAS,
  WOMEN_FARMER_RIGHTS_INFO,
  WOMEN_OFFICIAL_HELPLINES,
  buildCommentThreads,
  filterWomenDiscussions,
  getDiscussionCategoryMeta,
  getWomenFarmerSchemes
} from "./women-farmer-data.js";

function resolveLang(state) {
  const wfLang = state.womenFarmer?.lang;
  if (wfLang === "BN" || wfLang === "EN") return wfLang;
  return state.lang === "bn" ? "BN" : "EN";
}

function renderBilingualBar(lang) {
  return `
    <div class="inline-flex items-center gap-1 bg-white/15 border border-white/25 p-1 rounded-xl shrink-0" role="group" aria-label="Language Switcher">
      <button type="button" data-wf-lang="BN" class="px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-extrabold transition-colors ${
        lang === "BN" ? "bg-white text-[#14532D] shadow-sm" : "text-white hover:bg-white/15"
      }">বাংলা</button>
      <button type="button" data-wf-lang="EN" class="px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-extrabold transition-colors ${
        lang === "EN" ? "bg-white text-[#14532D] shadow-sm" : "text-white hover:bg-white/15"
      }">English</button>
    </div>
  `;
}

function renderInternationalBanner(lang) {
  const b = INTERNATIONAL_WOMEN_FARMER_BANNER;
  const bn = lang === "BN";
  const faoUrl = safeUrl(b.officialUrl);
  return `
    <section data-wf-banner="iywf-2026" class="rounded-3xl border border-fuchsia-200 bg-gradient-to-r from-fuchsia-50 via-rose-50/70 to-emerald-50/80 p-4 sm:p-5 space-y-2.5 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-100 border border-fuchsia-300 text-fuchsia-950 text-[11px] font-extrabold">
          <span>🌾</span>
          <span>${escapeHtml(bn ? b.badgeBn : b.badgeEn)}</span>
        </span>
        ${faoUrl ? `
          <a href="${escapeHtml(faoUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-fuchsia-200 hover:bg-fuchsia-50 text-fuchsia-900 text-[11px] font-extrabold">
            <span>${escapeHtml(bn ? b.officialLabelBn : b.officialLabelEn)} ↗</span>
          </a>
        ` : ""}
      </div>
      <h3 class="text-sm sm:text-base font-extrabold text-[#14532D]">${escapeHtml(bn ? b.titleBn : b.titleEn)}</h3>
      <p class="text-xs sm:text-sm text-[#1E293B] leading-relaxed">${escapeHtml(bn ? b.bodyBn : b.bodyEn)}</p>
      <p class="text-[11px] text-[#475569] italic">${escapeHtml(bn ? b.noteBn : b.noteEn)}</p>
    </section>
  `;
}

function renderDashboardSubView(state, lang, stats) {
  const bn = lang === "BN";
  const groups = [
    {
      key: "SCHEMES_AND_BENEFITS",
      titleEn: "Government Schemes, Benefits & Credit",
      titleBn: "সরকারি প্রকল্প, সহায়তা ও কৃষি ঋণ"
    },
    {
      key: "FARMING_SECTORS",
      titleEn: "Crop, Horticulture, Dairy & Fisheries Support",
      titleBn: "ফসল, উদ্যানপালন, দুগ্ধ-পশুপালন ও মৎস্য চাষ"
    },
    {
      key: "SKILLS_AND_ENTERPRISE",
      titleEn: "Training, SHG, Women-Led FPO & Agri-Business",
      titleBn: "প্রশিক্ষণ, স্বনির্ভর গোষ্ঠী (SHG), নারী FPO ও কৃষি ব্যবসা"
    },
    {
      key: "RIGHTS_AND_COMMUNITY",
      titleEn: "Women Farmer Rights, Helplines & Success Stories",
      titleBn: "নারী কৃষক অধিকার, সরকারি হেল্পলাইন ও সাফল্যের গল্প"
    }
  ];

  return `
    <div class="space-y-6">
      <!-- Quick KPI Strip -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button type="button" data-wf-tab="schemes" class="gv-card p-3.5 text-left hover:border-[#15803D] transition-colors">
          <div class="text-[11px] font-bold text-[#496052]">${bn ? "নারীদের যোগ্য প্রকল্প" : "Women-Eligible Schemes"}</div>
          <div class="text-xl font-extrabold text-[#14532D] mt-0.5">${stats.totalEligibleSchemes}</div>
          <div class="text-[10px] text-[#15803D] font-bold">${bn ? `${stats.dedicatedSchemes}টি বিশেষ নারী প্রকল্প` : `${stats.dedicatedSchemes} Women-Dedicated`}</div>
        </button>
        <button type="button" data-wf-tab="discussion" class="gv-card p-3.5 text-left hover:border-[#15803D] transition-colors">
          <div class="text-[11px] font-bold text-[#496052]">${bn ? "আলোচনা ও প্রশ্নোত্তর" : "Discussion Posts"}</div>
          <div class="text-xl font-extrabold text-[#14532D] mt-0.5">${stats.discussionCount}</div>
          <div class="text-[10px] text-[#15803D] font-bold">${bn ? "১১টি কৃষি বিষয়" : "11 Farming Topics"}</div>
        </button>
        <button type="button" data-wf-tab="rights" class="gv-card p-3.5 text-left hover:border-[#15803D] transition-colors">
          <div class="text-[11px] font-bold text-[#496052]">${bn ? "সরকারি হেল্পলাইন" : "Official Helplines"}</div>
          <div class="text-xl font-extrabold text-[#14532D] mt-0.5">${WOMEN_OFFICIAL_HELPLINES.length}</div>
          <div class="text-[10px] text-[#15803D] font-bold">1800-180-1551 • 181 • 15100</div>
        </button>
        <div class="gv-card p-3.5 text-left">
          <div class="text-[11px] font-bold text-[#496052]">${bn ? "সাহায্য বিভাগ" : "Support Areas"}</div>
          <div class="text-xl font-extrabold text-[#14532D] mt-0.5">${WOMEN_FARMER_DASHBOARD_AREAS.length}</div>
          <div class="text-[10px] text-[#15803D] font-bold">${bn ? "বাংলা ও English" : "Bilingual EN & BN"}</div>
        </div>
      </div>

      <!-- All 15 Women Farmer Zone Areas Organized Cleanly -->
      ${groups.map((grp) => {
        const items = WOMEN_FARMER_DASHBOARD_AREAS.filter((a) => a.group === grp.key);
        return `
          <section class="space-y-3">
            <h3 class="text-sm sm:text-base font-extrabold text-[#14532D] px-1">${escapeHtml(bn ? grp.titleBn : grp.titleEn)}</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              ${items.map((item) => `
                <button
                  type="button"
                  data-wf-area-id="${escapeHtml(item.id)}"
                  data-wf-area-action="${escapeHtml(item.actionType)}"
                  data-wf-area-value="${escapeHtml(item.actionValue)}"
                  class="gv-card p-4 text-left flex flex-col justify-between gap-3 hover:border-[#15803D] hover:shadow-md transition-all min-h-[124px]"
                >
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between gap-2">
                      <span class="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-[10px] font-extrabold">
                        ${escapeHtml(bn ? item.badgeBn : item.badgeEn)}
                      </span>
                      <span class="text-[#15803D] text-xs font-extrabold" aria-hidden="true">→</span>
                    </div>
                    <h4 class="text-sm sm:text-base font-extrabold text-[#132219] leading-snug">${escapeHtml(bn ? item.bn : item.en)}</h4>
                    <p class="text-xs text-[#475569] leading-relaxed">${escapeHtml(bn ? item.descBn : item.descEn)}</p>
                  </div>
                </button>
              `).join("")}
            </div>
          </section>
        `;
      }).join("")}
    </div>
  `;
}

function renderSchemesSubView(state, lang) {
  const bn = lang === "BN";
  const wf = state.womenFarmer || {};
  const mode = wf.schemeMode || "ALL";
  const stateFilter = wf.schemeState || "ALL";
  const catFilter = wf.schemeCategory || "ALL";
  const search = wf.schemeSearch || "";

  const matched = getWomenFarmerSchemes(state.agricultureSchemes || [], {
    mode,
    stateName: stateFilter,
    category: catFilter,
    search
  });

  const allCount = getWomenFarmerSchemes(state.agricultureSchemes || [], { mode: "ALL" }).length;
  const dedicatedCount = getWomenFarmerSchemes(state.agricultureSchemes || [], { mode: "WOMEN_DEDICATED" }).length;
  const generalCount = getWomenFarmerSchemes(state.agricultureSchemes || [], { mode: "GENERAL_ELIGIBLE" }).length;

  return `
    <div class="space-y-4">
      <!-- Transparency Notice (Never Falsely Claiming Women-Exclusivity) -->
      <div class="rounded-2xl border border-emerald-200 bg-[#ECFDF5] p-4 space-y-1">
        <div class="text-xs sm:text-sm font-extrabold text-[#14532D]">
          ${bn
            ? "যাচাইকৃত সরকারি প্রকল্পের সরাসরি সংযোগ (Phase 5 ডাটাবেস)"
            : "Connected Directly to Verified Government Schemes Centre (Zero Duplication)"}
        </div>
        <p class="text-xs text-[#334155] leading-relaxed">
          ${bn
            ? "এখানে শুধুমাত্র সরকারি নিয়মে নারী-নির্ধারিত প্রকল্পগুলোকেই 'নারী কৃষক বিশেষ প্রকল্প' হিসেবে দেখানো হয়েছে। অন্যান্য সাধারণ কৃষি প্রকল্পগুলোকে স্পষ্টভাবে 'সাধারণ কৃষি প্রকল্প • নারী কৃষকরা আবেদনযোগ্য' হিসেবে চিহ্নিত করা হয়েছে।"
            : "Only schemes officially dedicated to women farmers or women SHGs are labeled 'Women-Focused / Dedicated'. All general agricultural schemes open to women are clearly labeled as 'General Scheme • Women Farmers Eligible' or 'Higher Women Priority/Subsidy'."}
        </p>
      </div>

      <!-- Mode Pills -->
      <div class="flex flex-wrap gap-2">
        <button type="button" data-wf-scheme-mode="ALL" class="px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-extrabold transition-colors ${
          mode === "ALL" ? "bg-[#14532D] text-white shadow-sm" : "bg-white border border-[#CDE0D3] text-[#14532D] hover:bg-[#ECFDF5]"
        }">${bn ? `সব নারী-যোগ্য প্রকল্প (${allCount})` : `All Women-Eligible Schemes (${allCount})`}</button>
        <button type="button" data-wf-scheme-mode="WOMEN_DEDICATED" class="px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-extrabold transition-colors ${
          mode === "WOMEN_DEDICATED" ? "bg-fuchsia-800 text-white shadow-sm" : "bg-white border border-fuchsia-200 text-fuchsia-900 hover:bg-fuchsia-50"
        }">${bn ? `শুধু নারী-বিশেষ প্রকল্প (${dedicatedCount})` : `Women-Dedicated Schemes (${dedicatedCount})`}</button>
        <button type="button" data-wf-scheme-mode="GENERAL_ELIGIBLE" class="px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-extrabold transition-colors ${
          mode === "GENERAL_ELIGIBLE" ? "bg-[#14532D] text-white shadow-sm" : "bg-white border border-[#CDE0D3] text-[#14532D] hover:bg-[#ECFDF5]"
        }">${bn ? `সাধারণ কৃষি প্রকল্পে নারী যোগ্য (${generalCount})` : `General Agri Schemes Eligible for Women (${generalCount})`}</button>
      </div>

      <!-- Search, State & Category Filters -->
      <div class="gv-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label class="block">
          <span class="text-[11px] font-bold text-[#496052]">${bn ? "প্রকল্প খুঁজুন (বাংলা বা English)" : "Search Schemes"}</span>
          <input id="wfSchemeSearch" type="search" value="${escapeHtml(search)}" placeholder="${bn ? "যেমন: MKSP, ড্রোন, PM-KISAN, মাছ..." : "e.g., MKSP, Drone, PM-KISAN, Dairy..."}" class="mt-1 w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white" />
        </label>
        <label class="block">
          <span class="text-[11px] font-bold text-[#496052]">${bn ? "রাজ্য / কেন্দ্রশাসিত অঞ্চল (৩৬)" : "State / UT Filter (All 36)"}</span>
          <select id="wfSchemeState" class="mt-1 w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white">
            <option value="ALL">${bn ? "সারা ভারত + সব রাজ্য" : "All India + All States"}</option>
            ${getAllStatesList().map((st) => `
              <option value="${escapeHtml(st)}" ${stateFilter === st ? "selected" : ""}>${escapeHtml(st)}</option>
            `).join("")}
          </select>
        </label>
        <label class="block">
          <span class="text-[11px] font-bold text-[#496052]">${bn ? "কৃষি বিভাগ" : "Scheme Category"}</span>
          <select id="wfSchemeCategory" class="mt-1 w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white">
            <option value="ALL">${bn ? "সব বিভাগ" : "All Categories"}</option>
            ${SCHEME_CATEGORIES.map((c) => `
              <option value="${escapeHtml(c.key)}" ${catFilter === c.key ? "selected" : ""}>${escapeHtml(bn ? c.bn : c.en)}</option>
            `).join("")}
          </select>
        </label>
      </div>

      <!-- Matched Schemes List -->
      ${matched.length === 0 ? `
        <div class="gv-card p-8 text-center space-y-2">
          <p class="text-sm font-bold text-[#14532D]">${bn ? "এই ফিল্টারে কোনো প্রকল্প পাওয়া যায়নি।" : "No schemes match the selected filter."}</p>
          <button type="button" data-wf-reset-scheme-filters="1" class="px-4 py-2 rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">
            ${bn ? "সব ফিল্টার রিসেট করুন" : "Reset Scheme Filters"}
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${matched.map(({ scheme, classification }) => {
            const verif = evaluateSchemeVerification(scheme);
            const catMeta = SCHEME_CATEGORY_MAP[scheme.category] || { en: scheme.category || "Agriculture", bn: scheme.category || "কৃষি" };
            const portalUrl = safeUrl(scheme.officialPortalUrl || scheme.officialSourceUrl);
            const titleText = bn && scheme.nameBn ? scheme.nameBn : scheme.name;
            const subTitle = bn && scheme.nameBn ? scheme.name : (scheme.nameBn || "");
            const summaryText = bn && scheme.summaryBn ? scheme.summaryBn : scheme.summary;
            const womenNote = bn
              ? (scheme.eligibility?.womenFarmersBn || scheme.eligibility?.womenFarmers || "")
              : (scheme.eligibility?.womenFarmers || "");
            const docs = (bn && Array.isArray(scheme.requiredDocumentsBn) && scheme.requiredDocumentsBn.length)
              ? scheme.requiredDocumentsBn
              : (scheme.requiredDocuments || []);
            return `
              <article class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div class="space-y-2.5">
                  <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                    <span class="px-2.5 py-0.5 rounded-full border ${classification.badgeClass}">
                      ${escapeHtml(bn ? classification.badgeBn : classification.badgeEn)}
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-[#EDF4EE] text-[#14532D]">
                      ${escapeHtml(scheme.applicableState || "All India")}
                    </span>
                    <span class="px-2 py-0.5 rounded-full border ${verif.badgeClass}">
                      ${escapeHtml(bn ? verif.bn : verif.en)}
                    </span>
                  </div>

                  <div>
                    <h4 class="text-base font-extrabold text-[#132219] leading-snug">${escapeHtml(titleText)}</h4>
                    ${subTitle ? `<div class="text-xs font-semibold text-[#1E7E45] mt-0.5">${escapeHtml(subTitle)}</div>` : ""}
                    <div class="text-[11px] text-[#496052] mt-0.5">${escapeHtml(bn ? catMeta.bn : catMeta.en)} • ${escapeHtml(scheme.department || "")}</div>
                  </div>

                  <p class="text-xs sm:text-sm text-[#334155] leading-relaxed">${escapeHtml(summaryText)}</p>

                  ${womenNote ? `
                    <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-xs text-[#1E293B]">
                      <strong class="text-[#14532D]">${bn ? "নারী কৃষকদের যোগ্যতা:" : "Women Farmer Eligibility:"}</strong>
                      ${escapeHtml(womenNote)}
                    </div>
                  ` : ""}

                  ${docs.length ? `
                    <div class="text-[11px] text-[#475569]">
                      <strong class="text-[#14532D]">${bn ? "প্রয়োজনীয় নথি:" : "Key Documents:"}</strong>
                      ${escapeHtml(docs.slice(0, 4).join(" • "))}
                    </div>
                  ` : ""}

                  <div class="text-[11px] text-[#496052]">
                    ${bn ? "সর্বশেষ যাচাই:" : "Last Verified:"} <strong>${escapeHtml(scheme.lastVerifiedDate || "—")}</strong>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-50">
                  <button type="button" data-wf-open-scheme-detail="${escapeHtml(scheme.id)}" class="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold transition-colors">
                    ${bn ? "সম্পূর্ণ নিয়ম ও আবেদন পদ্ধতি দেখুন →" : "Full Eligibility & How to Apply →"}
                  </button>
                  ${portalUrl ? `
                    <a href="${escapeHtml(portalUrl)}" target="_blank" rel="noopener noreferrer" class="min-h-[42px] inline-flex items-center px-3 py-2 rounded-xl bg-[#ECFDF5] hover:bg-[#DCFCE7] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">
                      ${bn ? "সরকারি পোর্টাল ↗" : "Official Portal ↗"}
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

function renderCommentItem(postId, comment, isReply, state, lang, editingComment) {
  const bn = lang === "BN";
  const isOwner = Boolean(state.user && state.user.uid === comment.authorId);
  const canDelete = Boolean(state.user && (isOwner || state.isAdmin));
  const isEditingThis = Boolean(editingComment && editingComment.postId === postId && editingComment.commentId === comment.id);
  const isHidden = comment.status === "HIDDEN";

  return `
    <div class="${isReply ? "ml-5 sm:ml-8 border-l-2 border-emerald-200 pl-3" : ""} rounded-2xl ${isHidden ? "bg-amber-50/70 border border-amber-200" : "bg-[#F8FAFC] border border-[#E2E8F0]"} p-3 space-y-2">
      <div class="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
        <div class="flex items-center gap-1.5">
          <span class="font-extrabold text-[#14532D]">${escapeHtml(comment.authorName || "Member")}</span>
          ${isReply ? `<span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-bold">${bn ? "উত্তর" : "Reply"}</span>` : ""}
          ${isHidden ? `<span class="px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 text-[10px] font-extrabold">HIDDEN</span>` : ""}
        </div>
        <span class="text-[#64748B]">${escapeHtml(formatDateShort(comment.createdAtMs || comment.updatedAtMs))}</span>
      </div>

      ${isEditingThis ? `
        <form data-wf-edit-comment-form="${escapeHtml(postId)}" data-wf-comment-id="${escapeHtml(comment.id)}" class="space-y-2">
          <textarea name="body" rows="2" required minlength="1" maxlength="1000" class="w-full px-3 py-2 rounded-xl border border-[#15803D] bg-white text-xs sm:text-sm">${escapeHtml(comment.body || "")}</textarea>
          <div class="flex gap-2">
            <button type="submit" class="px-3 py-1.5 rounded-lg bg-[#14532D] text-white text-xs font-extrabold">${bn ? "সংরক্ষণ করুন" : "Save Edit"}</button>
            <button type="button" data-wf-cancel-edit-comment="1" class="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold">${bn ? "বাতিল" : "Cancel"}</button>
          </div>
        </form>
      ` : `
        <p class="text-xs sm:text-sm text-[#1E293B] whitespace-pre-line leading-relaxed">${escapeHtml(comment.body || "")}</p>
      `}

      <div class="flex flex-wrap items-center gap-2 text-[11px]">
        ${!isReply && state.user ? `
          <button type="button" data-wf-reply-comment="${escapeHtml(postId)}" data-wf-parent-id="${escapeHtml(comment.id)}" data-wf-parent-author="${escapeHtml(comment.authorName || "Member")}" class="px-2.5 py-1 rounded-lg bg-white border border-[#CDE0D3] text-[#14532D] font-bold hover:bg-[#ECFDF5]">
            ↩ ${bn ? "উত্তর দিন" : "Reply"}
          </button>
        ` : ""}
        ${isOwner && !isEditingThis ? `
          <button type="button" data-wf-edit-comment="${escapeHtml(postId)}" data-wf-comment-id="${escapeHtml(comment.id)}" class="px-2.5 py-1 rounded-lg bg-white border border-[#CDE0D3] text-[#14532D] font-bold hover:bg-[#ECFDF5]">
            ${bn ? "সম্পাদনা" : "Edit"}
          </button>
        ` : ""}
        ${canDelete ? `
          <button type="button" data-wf-del-comment="${escapeHtml(postId)}" data-wf-comment-id="${escapeHtml(comment.id)}" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold hover:bg-rose-100">
            ${bn ? "মুছুন" : "Delete"}
          </button>
        ` : ""}
        ${state.isAdmin ? `
          <button type="button" data-wf-mod-comment="${escapeHtml(postId)}" data-wf-comment-id="${escapeHtml(comment.id)}" data-wf-mod-status="${isHidden ? "ACTIVE" : "HIDDEN"}" class="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 font-bold">
            ${isHidden ? (bn ? "পুনরুদ্ধার" : "Restore") : (bn ? "লুকান" : "Hide")}
          </button>
        ` : ""}
        ${state.user && !isOwner ? `
          <button type="button" data-wf-report-comment="${escapeHtml(postId)}" data-wf-comment-id="${escapeHtml(comment.id)}" class="ml-auto text-slate-500 hover:text-rose-700 font-bold">
            ⚑ ${bn ? "রিপোর্ট" : "Report"}
          </button>
        ` : ""}
      </div>
    </div>
  `;
}

function renderDiscussionSubView(state, lang) {
  const bn = lang === "BN";
  const wf = state.womenFarmer || {};
  const activeCat = wf.discussionCategory || "ALL";
  const search = wf.discussionSearch || "";
  const editingPostId = wf.editingPostId || "";
  const editingPost = editingPostId ? (state.communityPosts || []).find((p) => p.id === editingPostId) : null;
  const expandedMap = wf.expandedPostIds || {};
  const commentsByPost = wf.commentsByPost || {};
  const likesByPost = wf.likesByPost || {};
  const replyingTo = wf.replyingTo || null;
  const editingComment = wf.editingComment || null;

  const posts = filterWomenDiscussions(state.communityPosts || [], {
    category: activeCat,
    search
  }, Boolean(state.isAdmin));

  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <!-- Left Column: Post Creation / Edit Form -->
      <div class="lg:col-span-4 space-y-3 h-fit">
        <div class="gv-card p-4 sm:p-5 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-base font-extrabold text-[#14532D]">
              ${editingPost
                ? (bn ? "আপনার পোস্ট সম্পাদনা করুন" : "Edit Your Discussion Post")
                : (bn ? "নতুন আলোচনা / প্রশ্ন পোস্ট করুন" : "Start a Discussion / Ask a Question")}
            </h3>
            ${editingPost ? `
              <button type="button" data-wf-cancel-edit-post="1" class="text-xs font-extrabold text-rose-600 hover:underline">
                ${bn ? "বাতিল" : "Cancel Edit"}
              </button>
            ` : ""}
          </div>

          <p class="text-[11px] text-[#475569] leading-relaxed bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5">
            ${bn
              ? "আপনি বাংলা বা English যেকোনো ভাষায় লিখতে পারেন। আপনার লেখা স্বয়ংক্রিয়ভাবে পরিবর্তন করা হবে না। গোপনীয়তার জন্য ব্যক্তিগত ফোন নম্বর বা ইমেইল পোস্টে লিখবেন না।"
              : "Write freely in Bengali or English — your original text is never modified or auto-translated. For your safety, never share personal phone numbers, Aadhaar, or bank details publicly."}
          </p>

          ${!state.user ? `
            <div class="space-y-2.5 pt-1">
              <p class="text-xs text-[#496052]">
                ${bn
                  ? "পোস্ট লিখতে, মন্তব্য করতে, উত্তর দিতে বা লাইক করতে আপনার Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন।"
                  : "Sign in with your Google account to create discussions, comment, reply, react, or report abuse."}
              </p>
              <button type="button" data-action="open-auth" class="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs sm:text-sm font-extrabold">
                ${bn ? "Google দিয়ে সাইন ইন করুন" : "Sign In with Google to Post"}
              </button>
            </div>
          ` : `
            <form id="wfPostForm" class="space-y-3">
              <input id="wfPostEditId" type="hidden" value="${escapeHtml(editingPost?.id || "")}" />
              <label class="block">
                <span class="text-xs font-bold text-[#132219]">${bn ? "আলোচনার বিষয় (১১টি বিভাগ) *" : "Category (11 Topics) *"}</span>
                <select id="wfPostCategory" required class="mt-1 w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] bg-white text-sm">
                  ${WOMEN_DISCUSSION_POST_CATEGORIES.map((c) => {
                    const selected = editingPost
                      ? (editingPost.category === c.key)
                      : (activeCat !== "ALL" ? activeCat === c.key : c.key === "CROP_CULTIVATION");
                    return `<option value="${escapeHtml(c.key)}" ${selected ? "selected" : ""}>${escapeHtml(bn ? `${c.bn} (${c.en})` : `${c.en} | ${c.bn}`)}</option>`;
                  }).join("")}
                </select>
              </label>

              <label class="block">
                <span class="text-xs font-bold text-[#132219]">${bn ? "জেলা / রাজ্য (ঐচ্ছিক)" : "District / State (Optional)"}</span>
                <input id="wfPostDistrict" type="text" maxlength="80" value="${escapeHtml(editingPost?.district || "")}" placeholder="${bn ? "যেমন: নদীয়া, পশ্চিমবঙ্গ" : "e.g., Nadia, West Bengal"}" class="mt-1 w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white" />
              </label>

              <label class="block">
                <span class="text-xs font-bold text-[#132219]">${bn ? "শিরোনাম *" : "Title *"}</span>
                <input id="wfPostTitle" type="text" required minlength="3" maxlength="140" value="${escapeHtml(editingPost?.title || "")}" placeholder="${bn ? "সংক্ষিপ্ত শিরোনাম লিখুন..." : "Short clear headline..."}" class="mt-1 w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white" />
              </label>

              <label class="block">
                <span class="text-xs font-bold text-[#132219]">${bn ? "বিস্তারিত লিখুন *" : "Your Question, Experience or Story *"}</span>
                <textarea id="wfPostBody" rows="4" required minlength="5" maxlength="1500" placeholder="${bn ? "চাষের অভিজ্ঞতা, ফসলের রোগ, সরকারি প্রকল্প বা আপনার সাফল্যের কথা লিখুন..." : "Share your farming question, crop issue, scheme experience, or success story..."}" class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm bg-white">${escapeHtml(editingPost?.body || "")}</textarea>
              </label>

              <button type="submit" class="w-full min-h-[48px] py-3 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold transition-colors">
                ${editingPost ? (bn ? "পরিবর্তন সংরক্ষণ করুন" : "Save Changes") : (bn ? "আলোচনা প্রকাশ করুন" : "Publish Discussion")}
              </button>
            </form>
          `}
        </div>
      </div>

      <!-- Right Column: Search, 11 Category Filters & Discussion Feed -->
      <div class="lg:col-span-8 space-y-4">
        <div class="gv-card p-3.5 sm:p-4 space-y-3">
          <div class="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <input id="wfDiscussionSearch" type="search" value="${escapeHtml(search)}" placeholder="${bn ? "আলোচনা খুঁজুন (বাংলা বা English)..." : "Search discussions in Bengali or English..."}" class="flex-1 px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white" />
            <span class="px-3 py-2 rounded-xl bg-[#ECFDF5] border border-[#D9EAE0] text-xs font-extrabold text-[#14532D] text-center shrink-0">
              ${posts.length} ${bn ? "টি আলোচনা" : (posts.length === 1 ? "Post" : "Posts")}
            </span>
          </div>

          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Discussion Categories">
            ${WOMEN_DISCUSSION_CATEGORIES.map((c) => `
              <button type="button" data-wf-disc-cat="${escapeHtml(c.key)}" class="px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-bold transition-colors ${
                activeCat === c.key
                  ? "bg-[#14532D] text-white shadow-sm"
                  : "bg-[#F8FAFC] hover:bg-[#ECFDF5] border border-[#D9EAE0] text-[#14532D]"
              }">${escapeHtml(bn ? c.bn : c.en)}</button>
            `).join("")}
          </div>
        </div>

        ${posts.length === 0 ? `
          <div class="gv-card p-8 text-center space-y-2">
            <div class="text-base font-extrabold text-[#14532D]">
              ${bn ? "এই বিভাগে এখনো কোনো আলোচনা নেই।" : "No discussions in this topic yet."}
            </div>
            <p class="text-xs sm:text-sm text-[#496052]">
              ${bn
                ? "প্রথম আলোচনা শুরু করুন — আপনার প্রশ্ন, অভিজ্ঞতা বা সাফল্যের গল্প শেয়ার করুন।"
                : "Be the first to share a question, crop experience, scheme tip, or success story!"}
            </p>
          </div>
        ` : posts.map((post) => {
          const catMeta = getDiscussionCategoryMeta(post.category || "GENERAL");
          const isOwner = Boolean(state.user && state.user.uid === post.authorId);
          const canDelete = Boolean(state.user && (isOwner || state.isAdmin));
          const isHidden = post.status === "HIDDEN";
          const isExpanded = Boolean(expandedMap[post.id]);
          const postComments = commentsByPost[post.id] || [];
          const threads = buildCommentThreads(postComments, Boolean(state.isAdmin), state.user?.uid || "");
          const totalCommentCount = isExpanded ? postComments.filter((c) => c.status === "ACTIVE" || state.isAdmin).length : (Number(post.commentCount) || postComments.length || 0);
          const postLikes = likesByPost[post.id] || [];
          const userLiked = Boolean(state.user && postLikes.some((l) => l.userId === state.user.uid || l.id === state.user.uid));
          const likeCount = postLikes.length > 0 ? postLikes.length : (Number(post.helpfulCount) || 0);

          return `
            <article data-wf-post-card="${escapeHtml(post.id)}" class="gv-card p-4 sm:p-5 space-y-3 ${isHidden ? "border-amber-300 bg-amber-50/40" : ""}">
              <!-- Header: Category, District, Author, Date -->
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="px-2.5 py-0.5 rounded-full bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-950 text-[11px] font-extrabold">
                    ${escapeHtml(bn ? catMeta.bn : catMeta.en)}
                  </span>
                  ${post.district ? `
                    <span class="px-2 py-0.5 rounded-full bg-[#EDF4EE] text-[#14532D] text-[11px] font-bold">
                      📍 ${escapeHtml(post.district)}
                    </span>
                  ` : ""}
                  ${isHidden ? `
                    <span class="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-extrabold">HIDDEN BY MODERATOR</span>
                  ` : ""}
                </div>
                <div class="text-[11px] text-[#496052]">
                  <strong class="text-[#14532D]">${escapeHtml(post.authorName || "Member")}</strong> • ${escapeHtml(formatDateShort(post.createdAtMs || post.updatedAtMs))}
                </div>
              </div>

              <!-- Original Untouched User Title & Body -->
              <h4 class="text-base sm:text-lg font-extrabold text-[#132219] leading-snug">${escapeHtml(post.title || "")}</h4>
              <p class="text-sm text-[#334155] whitespace-pre-line leading-relaxed">${escapeHtml(post.body || "")}</p>

              <!-- Action Row -->
              <div class="flex flex-wrap items-center gap-2 pt-2.5 border-t border-emerald-50">
                <button
                  type="button"
                  data-wf-like-post="${escapeHtml(post.id)}"
                  data-wf-liked="${userLiked ? "1" : "0"}"
                  class="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
                    userLiked
                      ? "bg-[#14532D] text-white"
                      : "bg-[#ECFDF5] hover:bg-[#DCFCE7] border border-[#BBF7D0] text-[#14532D]"
                  }"
                >
                  ${userLiked ? "♥" : "♡"} ${bn ? "পছন্দ" : "Support"} (${likeCount})
                </button>

                <button
                  type="button"
                  data-wf-toggle-comments="${escapeHtml(post.id)}"
                  class="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
                    isExpanded
                      ? "bg-[#1E7E45] text-white"
                      : "bg-[#F8FAFC] hover:bg-[#ECFDF5] border border-[#D9EAE0] text-[#14532D]"
                  }"
                >
                  💬 ${bn ? "মন্তব্য ও উত্তর" : "Comments & Replies"}${totalCommentCount > 0 ? ` (${totalCommentCount})` : ""}
                </button>

                ${state.user && !isOwner ? `
                  <button type="button" data-wf-report-post="${escapeHtml(post.id)}" class="min-h-[40px] px-3 py-1.5 rounded-xl text-slate-500 hover:text-rose-700 text-xs font-bold">
                    ⚑ ${bn ? "রিপোর্ট" : "Report"}
                  </button>
                ` : ""}

                <div class="ml-auto flex flex-wrap gap-1.5">
                  ${isOwner ? `
                    <button type="button" data-wf-edit-post="${escapeHtml(post.id)}" class="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-bold">
                      ${bn ? "সম্পাদনা" : "Edit"}
                    </button>
                  ` : ""}
                  ${state.isAdmin ? `
                    <button type="button" data-wf-mod-post="${escapeHtml(post.id)}" data-wf-mod-status="${isHidden ? "ACTIVE" : "HIDDEN"}" class="min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-100 text-amber-950 text-xs font-bold">
                      ${isHidden ? (bn ? "পুনরুদ্ধার" : "Restore") : (bn ? "লুকান" : "Hide")}
                    </button>
                  ` : ""}
                  ${canDelete ? `
                    <button type="button" data-wf-del-post="${escapeHtml(post.id)}" class="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold">
                      ${bn ? "মুছুন" : "Delete"}
                    </button>
                  ` : ""}
                </div>
              </div>

              <!-- Threaded Comments & Replies Section -->
              ${isExpanded ? `
                <div class="pt-3 border-t border-[#E2E8F0] space-y-3">
                  ${threads.length === 0 ? `
                    <p class="text-xs text-[#64748B]">${bn ? "এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্য লিখুন।" : "No comments yet. Share a helpful reply below."}</p>
                  ` : `
                    <div class="space-y-2.5">
                      ${threads.map(({ comment, replies }) => `
                        <div class="space-y-2">
                          ${renderCommentItem(post.id, comment, false, state, lang, editingComment)}
                          ${replies.map((rep) => renderCommentItem(post.id, rep, true, state, lang, editingComment)).join("")}
                        </div>
                      `).join("")}
                    </div>
                  `}

                  ${state.user ? `
                    <form data-wf-comment-form="${escapeHtml(post.id)}" class="space-y-2 pt-1">
                      ${replyingTo && replyingTo.postId === post.id ? `
                        <div class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#14532D]">
                          <span>↩ ${bn ? "উত্তর দিচ্ছেন:" : "Replying to:"} <strong>${escapeHtml(replyingTo.authorName || "Member")}</strong></span>
                          <button type="button" data-wf-cancel-reply="1" class="text-rose-600 font-bold">${bn ? "বাতিল" : "Cancel"}</button>
                        </div>
                        <input type="hidden" name="parentCommentId" value="${escapeHtml(replyingTo.commentId)}" />
                      ` : `<input type="hidden" name="parentCommentId" value="" />`}
                      <div class="flex flex-col sm:flex-row gap-2">
                        <input name="body" type="text" required minlength="1" maxlength="1000" placeholder="${
                          replyingTo && replyingTo.postId === post.id
                            ? (bn ? "আপনার উত্তর লিখুন..." : "Write your reply...")
                            : (bn ? "আপনার মন্তব্য লিখুন (বাংলা বা English)..." : "Write a comment in Bengali or English...")
                        }" class="flex-1 px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-xs sm:text-sm bg-white" />
                        <button type="submit" class="min-h-[44px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold shrink-0">
                          ${replyingTo && replyingTo.postId === post.id ? (bn ? "উত্তর পাঠান" : "Post Reply") : (bn ? "মন্তব্য করুন" : "Add Comment")}
                        </button>
                      </div>
                    </form>
                  ` : `
                    <button type="button" data-action="open-auth" class="px-4 py-2 rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">
                      ${bn ? "মন্তব্য বা উত্তর দিতে সাইন ইন করুন" : "Sign in to comment or reply"}
                    </button>
                  `}
                </div>
              ` : ""}
            </article>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function renderRightsAndHelplinesSubView(lang) {
  const bn = lang === "BN";
  return `
    <div class="space-y-6">
      <!-- Rights, FPO & Agri-Business Guidance -->
      <section class="space-y-3">
        <h3 class="text-base sm:text-lg font-extrabold text-[#14532D] px-1">
          ${bn ? "নারী কৃষকদের অধিকার, FPO ও কৃষি ব্যবসা নির্দেশিকা" : "Women Farmer Rights, FPOs & Agri-Business Guidance"}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${WOMEN_FARMER_RIGHTS_INFO.map((item) => `
            <article class="gv-card p-5 space-y-2">
              <h4 class="text-sm sm:text-base font-extrabold text-[#14532D]">${escapeHtml(bn ? item.titleBn : item.titleEn)}</h4>
              <p class="text-xs sm:text-sm text-[#334155] leading-relaxed">${escapeHtml(bn ? item.bodyBn : item.bodyEn)}</p>
            </article>
          `).join("")}
        </div>
      </section>

      <!-- Verified Official Helplines & Grievance Portals -->
      <section class="space-y-3">
        <h3 class="text-base sm:text-lg font-extrabold text-[#14532D] px-1">
          ${bn ? "সরকারি হেল্পলাইন ও অভিযোগ নিষ্পত্তি কেন্দ্র" : "Verified Official Helplines & Grievance Portals"}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${WOMEN_OFFICIAL_HELPLINES.map((h) => {
            const href = safeUrl(h.url);
            return `
              <div class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div class="space-y-1.5">
                  <div class="text-sm font-extrabold text-[#132219]">${escapeHtml(bn ? h.nameBn : h.nameEn)}</div>
                  <p class="text-xs text-[#475569] leading-relaxed">${escapeHtml(bn ? h.descBn : h.descEn)}</p>
                </div>
                <div class="flex flex-wrap items-center gap-2 pt-1">
                  ${h.tel ? `
                    <a href="tel:${escapeHtml(h.tel)}" class="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
                      📞 ${escapeHtml(h.number)}
                    </a>
                  ` : ""}
                  ${href ? `
                    <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="min-h-[42px] inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#ECFDF5] hover:bg-[#DCFCE7] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">
                      ${bn ? "সরকারি ওয়েবসাইট ↗" : "Official Portal ↗"}
                    </a>
                  ` : ""}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </section>
    </div>
  `;
}

export function renderWomenFarmerZoneView(state) {
  const lang = resolveLang(state);
  const bn = lang === "BN";
  const wf = state.womenFarmer || {};
  const activeTab = wf.subTab || "dashboard";

  const allWomenSchemes = getWomenFarmerSchemes(state.agricultureSchemes || [], { mode: "ALL" });
  const dedicatedSchemes = allWomenSchemes.filter((x) => x.classification.tier === "WOMEN_DEDICATED").length;
  const discussionPosts = filterWomenDiscussions(state.communityPosts || [], { category: "ALL" }, Boolean(state.isAdmin));

  const stats = {
    totalEligibleSchemes: allWomenSchemes.length,
    dedicatedSchemes,
    discussionCount: discussionPosts.length
  };

  const tabs = [
    { key: "dashboard", en: "15 Support Areas", bn: "১৫টি সহায়তা কেন্দ্র" },
    { key: "schemes", en: `Govt Schemes (${stats.totalEligibleSchemes})`, bn: `সরকারি প্রকল্প (${stats.totalEligibleSchemes})` },
    { key: "discussion", en: `Discussion Board (${stats.discussionCount})`, bn: `আলোচনা বোর্ড (${stats.discussionCount})` },
    { key: "rights", en: "Rights & Helplines", bn: "অধিকার ও হেল্পলাইন" }
  ];

  return `
    <div data-module="women-farmer-zone" class="space-y-5">
      <!-- Hero Header -->
      <section class="relative overflow-hidden rounded-3xl gv-hero-agritech text-white p-5 sm:p-7">
        <div class="absolute inset-0 gv-hero-grid pointer-events-none"></div>
        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1.5">
            <span class="inline-block px-2.5 py-0.5 rounded-full bg-fuchsia-400/25 border border-fuchsia-300/40 text-fuchsia-100 text-[10px] font-extrabold uppercase tracking-wider">
              ${bn ? "কৃষক জোন • নারী কৃষক ক্ষমতায়ন" : "Farmer Zone • Women Farmer Empowerment"}
            </span>
            <h2 class="font-display text-2xl sm:text-3xl font-bold leading-tight">
              Women Farmer Zone | নারী কৃষক সহায়তা কেন্দ্র
            </h2>
            <p class="text-xs sm:text-sm text-[#DCFCE7]/95 max-w-2xl">
              ${bn
                ? "নারী কৃষকদের সরকারি প্রকল্প, কৃষি প্রশিক্ষণ, স্বনির্ভর গোষ্ঠী (SHG), নারী FPO, পশুপালন, মৎস্য, অধিকার, হেল্পলাইন এবং নিরাপদ আলোচনা বোর্ড।"
                : "Government schemes, agricultural training, SHG & women-led FPO guidance, crop/dairy/fisheries support, rights, official helplines & community discussion board."}
            </p>
          </div>
          ${renderBilingualBar(lang)}
        </div>
      </section>

      <!-- International Year of the Woman Farmer (2026) Banner -->
      ${renderInternationalBanner(lang)}

      <!-- Sub-Navigation Tabs -->
      <nav class="flex flex-wrap gap-2 bg-[#EDF4EE] p-1.5 rounded-2xl border border-[#D9EAE0]" aria-label="Women Farmer Zone Navigation">
        ${tabs.map((t) => `
          <button
            type="button"
            data-wf-tab="${t.key}"
            class="flex-1 sm:flex-none min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-colors ${
              activeTab === t.key
                ? "bg-[#14532D] text-white shadow-sm"
                : "text-[#14532D] hover:bg-white/70"
            }"
          >${escapeHtml(bn ? t.bn : t.en)}</button>
        `).join("")}
      </nav>

      <!-- Active Sub-View -->
      ${activeTab === "dashboard" ? renderDashboardSubView(state, lang, stats) : ""}
      ${activeTab === "schemes" ? renderSchemesSubView(state, lang) : ""}
      ${activeTab === "discussion" ? renderDiscussionSubView(state, lang) : ""}
      ${activeTab === "rights" ? renderRightsAndHelplinesSubView(lang) : ""}
    </div>
  `;
}
