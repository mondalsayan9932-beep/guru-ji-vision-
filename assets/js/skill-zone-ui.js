// ============================================================================
// GURU JI VISION — PHASE 6 SKILL ZONE USER INTERFACE
// ============================================================================
// Dedicated Skill Zone inside Guru Ji Vision for:
// - Agriculture Students, Farmers, Women Farmers & all registered users
// - All 15 Skill Categories with search, role-based & resource-format filters
// - Full Training Program details (YouTube player, online course, PDF, fees,
//   eligibility, duration, provider, official source, certificate details)
// - Job & Career Preparation (strictly separating Verified Official
//   Notifications from General Career Guidance — zero invented vacancies!)
// - User Enrolment, Lesson Progress Tracker, Completed Training & Certificates
//   (never claims completion unless ALL defined lessons are completed!)
// ============================================================================

import { escapeHtml, safeUrl } from "./calculators.js";
import { extractYouTubeInfo } from "./edu-cms-utils.js";
import {
  CAREER_PREP_CATEGORIES,
  CAREER_PREP_CATEGORY_MAP,
  CAREER_RECORD_KINDS,
  SKILL_AUDIENCE_MAP,
  SKILL_AUDIENCE_ROLES,
  SKILL_CATEGORIES,
  SKILL_CATEGORY_MAP,
  evaluateProgramCompletion,
  filterSkillCareerResources,
  filterSkillPrograms,
  mergeSkillCareerResources,
  mergeSkillPrograms
} from "./skill-zone-data.js";

function getProgressMap(state) {
  const list = Array.isArray(state.userSkillProgress) ? state.userSkillProgress : [];
  return new Map(list.map((p) => [p.programId || p.id, p]));
}

function renderAudienceBadges(targetRoles = ["ALL"], isBn = false) {
  const roles = Array.isArray(targetRoles) && targetRoles.length ? targetRoles : ["ALL"];
  return roles.map((r) => {
    const meta = SKILL_AUDIENCE_MAP[r] || SKILL_AUDIENCE_MAP.ALL;
    const cls = r === "WOMEN_FARMER"
      ? "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200"
      : r === "FARMER"
        ? "bg-amber-50 text-amber-900 border-amber-200"
        : r === "STUDENT"
          ? "bg-emerald-50 text-emerald-900 border-emerald-200"
          : "bg-slate-100 text-slate-800 border-slate-200";
    return `<span class="px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${cls}">${escapeHtml(isBn ? meta.bn : meta.en)}</span>`;
  }).join("");
}

export function renderSkillZoneWorkspace(state, {
  topNavHtml = "",
  commonModulesHtml = "",
  connectedModulesHtml = ""
} = {}) {
  const isBn = state.lang === "bn";
  const sz = state.skillZone || {};
  const subTab = sz.subTab || "programs";
  const programs = mergeSkillPrograms(state.skillPrograms || [], false);
  const careers = mergeSkillCareerResources(
    state.skillCareerResources || [],
    state.careerOpportunities || [],
    false
  );
  const progressMap = getProgressMap(state);

  const enrolledEntries = programs
    .map((p) => {
      const rec = progressMap.get(p.id);
      if (!rec || rec.enrolled !== true) return null;
      const evalRes = evaluateProgramCompletion(p, rec.completedLessonIds || []);
      return { program: p, progress: rec, evalRes };
    })
    .filter(Boolean);

  const completedCount = enrolledEntries.filter((e) => e.evalRes.isCompleted).length;
  const inProgressCount = enrolledEntries.length - completedCount;

  const subTabs = [
    ["programs", isBn ? `প্রশিক্ষণ ও কোর্স (${programs.length})` : `Skill Courses (${programs.length})`],
    ["careers", isBn ? `চাকরি ও ক্যারিয়ার (${careers.length})` : `Job & Career Prep (${careers.length})`],
    ["my-learning", isBn ? `আমার অগ্রগতি (${enrolledEntries.length})` : `My Progress (${enrolledEntries.length})`],
    ["connected", isBn ? "মেন্টরশিপ ও ওয়ার্কশপ" : "Mentorship & Tools"]
  ];

  return `
    <div data-zone-dashboard="skill-zone" class="space-y-6">
      ${topNavHtml}

      <!-- Skill Zone Hero Banner -->
      <section class="relative overflow-hidden rounded-3xl gv-hero-agritech text-white p-5 sm:p-7">
        <div class="absolute inset-0 gv-hero-grid pointer-events-none"></div>
        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="space-y-2">
            <span class="inline-block px-2.5 py-0.5 rounded-full bg-teal-300/25 border border-teal-200/40 text-teal-100 text-[10px] font-extrabold uppercase tracking-wider">
              ${isBn ? "১৫টি দক্ষতা বিভাগ • প্রশিক্ষণ • ক্যারিয়ার ও অগ্রগতি" : "15 Skill Categories • Verified Training • Career Prep • Progress"}
            </span>
            <h2 class="font-display text-2xl sm:text-3xl font-bold leading-tight">
              ${isBn ? "স্কিল জোন | দক্ষতা উন্নয়ন ও ক্যারিয়ার কেন্দ্র" : "Skill Zone | স্কিল ও প্রশিক্ষণ জোন"}
            </h2>
            <p class="text-xs sm:text-sm text-[#DCFCE7]/95 max-w-2xl">
              ${isBn
                ? "কৃষি শিক্ষার্থী, কৃষক, নারী কৃষক এবং সকল নিবন্ধিত ব্যবহারকারীর জন্য সরকারি প্রশিক্ষণ, ডিজিটাল দক্ষতা, কৃষি-উদ্যোক্তা, চাকরির প্রস্তুতি ও সার্টিফিকেট ট্র্যাকিং।"
                : "Role-based skill training, verified government programs, digital & agri-tech courses, honest job preparation, and lesson-by-lesson progress tracking for Students, Farmers, and Women Farmers."}
            </p>
          </div>
          <div class="grid grid-cols-3 gap-2 shrink-0">
            <div class="rounded-2xl bg-white/12 border border-white/20 px-3 py-2 text-center">
              <div class="text-lg font-extrabold">${SKILL_CATEGORIES.length}</div>
              <div class="text-[10px] text-[#DCFCE7] font-bold">${isBn ? "বিভাগ" : "Categories"}</div>
            </div>
            <div class="rounded-2xl bg-white/12 border border-white/20 px-3 py-2 text-center">
              <div class="text-lg font-extrabold">${programs.length}</div>
              <div class="text-[10px] text-[#DCFCE7] font-bold">${isBn ? "প্রোগ্রাম" : "Programs"}</div>
            </div>
            <div class="rounded-2xl bg-white/12 border border-white/20 px-3 py-2 text-center">
              <div class="text-lg font-extrabold">${completedCount}</div>
              <div class="text-[10px] text-[#DCFCE7] font-bold">${isBn ? "সম্পন্ন" : "Completed"}</div>
            </div>
          </div>
        </div>

        <!-- Role-Based Audience Quick Switcher -->
        <div class="relative z-10 mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center gap-2">
          <span class="text-[11px] font-bold text-[#DCFCE7] mr-1">${isBn ? "আপনার ভূমিকা:" : "Learning Path For:"}</span>
          ${SKILL_AUDIENCE_ROLES.map((r) => {
            const active = (sz.audienceRole || "ALL") === r.key;
            return `
              <button
                type="button"
                data-skill-role="${r.key}"
                class="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
                  active
                    ? "bg-white text-[#14532D] shadow-sm"
                    : "bg-white/12 text-white hover:bg-white/20 border border-white/20"
                }"
              >${escapeHtml(isBn ? r.bn : r.en)}</button>
            `;
          }).join("")}
        </div>
      </section>

      <!-- Skill Zone Sub-Navigation Tabs -->
      <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1" role="tablist">
        ${subTabs.map(([key, label]) => `
          <button
            type="button"
            role="tab"
            data-skill-sub="${key}"
            class="shrink-0 min-h-[42px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-colors ${
              subTab === key
                ? "bg-[#14532D] text-white shadow-sm"
                : "bg-white border border-[#CDE0D3] text-[#14532D] hover:bg-[#ECFDF5]"
            }"
          >${escapeHtml(label)}</button>
        `).join("")}
        ${state.isAdmin ? `
          <button
            type="button"
            data-nav="admin"
            data-open-admin-sub="skill-cms"
            class="shrink-0 min-h-[42px] px-3.5 py-2 rounded-2xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-extrabold"
          >⚙ Manage Skill CMS</button>
        ` : ""}
      </div>

      <!-- Active Sub-View -->
      ${subTab === "programs" ? renderSkillProgramsSection(state, programs, progressMap, isBn) : ""}
      ${subTab === "careers" ? renderSkillCareerPrepSection(state, careers, isBn) : ""}
      ${subTab === "my-learning" ? renderUserProgressSection(state, enrolledEntries, inProgressCount, completedCount, isBn) : ""}
      ${subTab === "connected" ? connectedModulesHtml : ""}

      <!-- 5 Common Services -->
      ${commonModulesHtml}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 1. TRAINING PROGRAMS & 15 SKILL CATEGORIES
// ----------------------------------------------------------------------------
function renderSkillProgramsSection(state, allPrograms, progressMap, isBn) {
  const sz = state.skillZone || {};
  const activeCat = sz.category || "ALL";
  const activeRole = sz.audienceRole || "ALL";
  const activeFormat = sz.format || "ALL";
  const search = sz.search || "";
  const expandedId = sz.expandedProgramId || "";

  const filtered = filterSkillPrograms(allPrograms, {
    category: activeCat,
    audienceRole: activeRole,
    format: activeFormat,
    search
  });

  // Count programs per category under current audience filter
  const catCounts = new Map();
  allPrograms.forEach((p) => {
    if (activeRole === "ALL" || (p.targetRoles || ["ALL"]).includes("ALL") || (p.targetRoles || []).includes(activeRole)) {
      catCounts.set(p.category, (catCounts.get(p.category) || 0) + 1);
    }
  });

  return `
    <section data-skill-programs-view="1" class="space-y-4">
      <!-- Search & Format Filter Bar -->
      <div class="gv-card p-4 space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <div class="md:col-span-6">
            <label for="skillSearchInput" class="sr-only">Search skill courses</label>
            <input
              id="skillSearchInput"
              type="search"
              value="${escapeHtml(search)}"
              placeholder="${isBn ? "কোর্স, প্রশিক্ষণ, প্রদানকারী বা বিষয় খুঁজুন..." : "Search skill courses, training providers, certificates, topics..."}"
              class="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs sm:text-sm bg-white"
            />
          </div>
          <div class="md:col-span-4">
            <label for="skillCategorySelect" class="sr-only">Filter by skill category</label>
            <select id="skillCategorySelect" class="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold text-[#14532D]">
              <option value="ALL" ${activeCat === "ALL" ? "selected" : ""}>${isBn ? `সকল ১৫টি বিভাগ (${allPrograms.length})` : `All 15 Skill Categories (${allPrograms.length})`}</option>
              ${SKILL_CATEGORIES.map((c) => `
                <option value="${c.key}" ${activeCat === c.key ? "selected" : ""}>
                  ${escapeHtml(isBn ? c.bn : c.en)} (${catCounts.get(c.key) || 0})
                </option>
              `).join("")}
            </select>
          </div>
          <div class="md:col-span-2">
            <label for="skillFormatSelect" class="sr-only">Filter by resource format</label>
            <select id="skillFormatSelect" class="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold text-[#14532D]">
              <option value="ALL" ${activeFormat === "ALL" ? "selected" : ""}>${isBn ? "সব ফরম্যাট" : "All Formats"}</option>
              <option value="VIDEO" ${activeFormat === "VIDEO" ? "selected" : ""}>YouTube Video</option>
              <option value="COURSE" ${activeFormat === "COURSE" ? "selected" : ""}>Online Course</option>
              <option value="PDF" ${activeFormat === "PDF" ? "selected" : ""}>PDF Guide</option>
              <option value="CERT" ${activeFormat === "CERT" ? "selected" : ""}>Certificate Info</option>
            </select>
          </div>
        </div>

        <!-- All 15 Skill Category Quick Chips -->
        <div class="flex flex-wrap gap-1.5" data-skill-category-chips="1">
          <button
            type="button"
            data-skill-cat="ALL"
            class="px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border transition-colors ${
              activeCat === "ALL" ? "bg-[#14532D] text-white border-[#14532D]" : "bg-[#F8FBF8] text-[#14532D] border-[#CDE0D3] hover:bg-[#ECFDF5]"
            }"
          >${isBn ? "সকল বিভাগ" : "All 15 Categories"}</button>
          ${SKILL_CATEGORIES.map((c) => `
            <button
              type="button"
              data-skill-cat="${c.key}"
              class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                activeCat === c.key ? "bg-[#14532D] text-white border-[#14532D]" : "bg-white text-[#1E3A2F] border-[#D9EAE0] hover:bg-[#ECFDF5]"
              }"
            >${escapeHtml(isBn ? c.bn : c.en)} <span class="opacity-70">(${catCounts.get(c.key) || 0})</span></button>
          `).join("")}
        </div>
      </div>

      <!-- Result Count & Reset -->
      <div class="flex flex-wrap items-center justify-between gap-2 px-1">
        <p class="text-xs font-bold text-[#496052]">
          ${isBn ? `মোট ${filtered.length}টি প্রশিক্ষণ প্রোগ্রাম পাওয়া গেছে` : `Showing ${filtered.length} verified training & skill program${filtered.length === 1 ? "" : "s"}`}
        </p>
        ${(activeCat !== "ALL" || activeRole !== "ALL" || activeFormat !== "ALL" || search) ? `
          <button type="button" data-skill-reset-filters="1" class="text-xs font-extrabold text-[#14532D] underline">
            ${isBn ? "ফিল্টার রিসেট করুন" : "Reset All Filters"}
          </button>
        ` : ""}
      </div>

      ${filtered.length === 0 ? `
        <div class="gv-card p-6 text-center space-y-2">
          <p class="text-sm font-extrabold text-[#14532D]">${isBn ? "এই ফিল্টারে কোনো প্রশিক্ষণ প্রোগ্রাম পাওয়া যায়নি" : "No skill programs match the selected filters"}</p>
          <p class="text-xs text-[#496052]">${isBn ? "অন্য বিভাগ বা ভূমিকা নির্বাচন করুন অথবা সার্চ শব্দ পরিবর্তন করুন।" : "Try switching the role filter to Everyone, picking another category, or clearing the search box."}</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${filtered.map((prog) => renderSkillProgramCard(prog, progressMap.get(prog.id), expandedId === prog.id, state, isBn)).join("")}
        </div>
      `}
    </section>
  `;
}

function renderSkillProgramCard(prog, progressRec, isExpanded, state, isBn) {
  const cat = SKILL_CATEGORY_MAP[prog.category] || SKILL_CATEGORIES[0];
  const enrolled = Boolean(progressRec && progressRec.enrolled === true);
  const evalRes = evaluateProgramCompletion(prog, progressRec?.completedLessonIds || []);
  const completedSet = new Set(evalRes.completedLessonIds);

  const ytInfo = prog.youtubeUrl ? extractYouTubeInfo(prog.youtubeUrl) : null;
  const courseLink = safeUrl(prog.courseUrl || "");
  const pdfLink = safeUrl(prog.pdfUrl || "");
  const applyLink = safeUrl(prog.applicationUrl || "");
  const sourceLink = safeUrl(prog.officialSourceUrl || "");
  const certLink = safeUrl(prog.certificateUrl || "");

  return `
    <article data-skill-program-card="${escapeHtml(prog.id)}" class="gv-card p-5 flex flex-col justify-between gap-3 border ${evalRes.isCompleted ? "border-emerald-400 bg-emerald-50/20" : "border-[#D9EAE0]"}">
      <div class="space-y-2.5">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${escapeHtml(cat.badge)}">${escapeHtml(isBn ? cat.bn : cat.en)}</span>
          ${renderAudienceBadges(prog.targetRoles, isBn)}
          ${enrolled ? `
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${evalRes.isCompleted ? "bg-emerald-700 text-white" : "bg-teal-100 text-teal-950"}">
              ${evalRes.isCompleted ? (isBn ? "✓ সম্পন্ন" : "✓ Completed") : `${evalRes.progressPercent}% ${isBn ? "সম্পন্ন" : "Progress"}`}
            </span>
          ` : ""}
        </div>

        <div>
          <h3 class="text-sm sm:text-base font-extrabold text-[#132219] leading-snug">
            ${escapeHtml(isBn && prog.titleBn ? prog.titleBn : prog.title)}
          </h3>
          ${prog.provider ? `<p class="text-[11px] font-bold text-[#15803D] mt-0.5">${escapeHtml(prog.provider)}</p>` : ""}
        </div>

        <p class="text-xs text-[#475569] leading-relaxed">${escapeHtml(prog.description || "")}</p>

        <!-- Key Verified Metadata Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-[#F8FBF8] border border-[#E2ECE5] rounded-2xl p-3">
          ${prog.eligibility ? `<div><span class="font-extrabold text-[#14532D]">${isBn ? "যোগ্যতা:" : "Eligibility:"}</span> <span class="text-[#334155]">${escapeHtml(prog.eligibility)}</span></div>` : ""}
          ${prog.duration ? `<div><span class="font-extrabold text-[#14532D]">${isBn ? "সময়কাল:" : "Duration:"}</span> <span class="text-[#334155]">${escapeHtml(prog.duration)}</span></div>` : ""}
          ${prog.verifiedFees ? `<div><span class="font-extrabold text-[#14532D]">${isBn ? "যাচাইকৃত ফি:" : "Verified Fees:"}</span> <span class="text-[#334155]">${escapeHtml(prog.verifiedFees)}</span></div>` : ""}
          ${prog.certificateDetails ? `<div><span class="font-extrabold text-[#14532D]">${isBn ? "সার্টিফিকেট:" : "Certificate:"}</span> <span class="text-[#334155]">${escapeHtml(prog.certificateDetails)}</span></div>` : ""}
        </div>

        <!-- Enrolment Progress Bar (Visible when enrolled) -->
        ${enrolled ? `
          <div class="space-y-1">
            <div class="flex items-center justify-between text-[11px] font-bold text-[#14532D]">
              <span>${isBn ? "পাঠের অগ্রগতি:" : "Lesson Progress:"} ${evalRes.completedCount}/${evalRes.totalLessons}</span>
              <span>${evalRes.progressPercent}%</span>
            </div>
            <div class="w-full h-2 rounded-full bg-[#E2ECE5] overflow-hidden">
              <div class="h-full rounded-full ${evalRes.isCompleted ? "bg-emerald-600" : "bg-teal-600"}" style="width:${evalRes.progressPercent}%"></div>
            </div>
          </div>
        ` : ""}

        <!-- Expanded Lesson Checklist & Embedded YouTube Video -->
        ${isExpanded ? `
          <div class="pt-2 border-t border-[#E2ECE5] space-y-3">
            ${ytInfo && ytInfo.ok ? `
              <div class="space-y-1.5">
                <div class="text-[11px] font-extrabold text-[#14532D]">${isBn ? "প্রশিক্ষণ ভিডিও (YouTube)" : "Training Video (YouTube)"}</div>
                <div class="relative w-full aspect-video rounded-2xl overflow-hidden border border-[#CDE0D3] bg-black">
                  <iframe
                    src="${escapeHtml(ytInfo.embedUrl)}"
                    title="${escapeHtml(prog.title || "Training Video")}"
                    class="w-full h-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                </div>
              </div>
            ` : ""}

            <div class="space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-extrabold text-[#14532D]">
                  ${isBn ? `পাঠ তালিকা (${evalRes.totalLessons}টি পাঠ সম্পন্ন হলে কোর্স সম্পূর্ণ হবে)` : `Course Lessons (Complete all ${evalRes.totalLessons} lessons to unlock completion)`}
                </span>
              </div>
              ${(prog.lessons || []).length === 0 ? `
                <p class="text-[11px] text-[#64748B]">${isBn ? "এই প্রোগ্রামের জন্য কোনো পাঠ যুক্ত করা হয়নি।" : "No lessons defined yet for this program."}</p>
              ` : `
                <div class="space-y-1.5">
                  ${(prog.lessons || []).map((lesson, idx) => {
                    const done = completedSet.has(lesson.id);
                    return `
                      <label class="flex items-start gap-2.5 p-2.5 rounded-xl border ${done ? "bg-emerald-50 border-emerald-300" : "bg-white border-[#E2ECE5]"} ${enrolled ? "cursor-pointer hover:bg-[#F8FBF8]" : "opacity-80"}">
                        <input
                          type="checkbox"
                          data-skill-lesson-toggle="${escapeHtml(prog.id)}"
                          data-lesson-id="${escapeHtml(lesson.id)}"
                          ${done ? "checked" : ""}
                          ${!enrolled ? "disabled" : ""}
                          class="mt-0.5 w-4 h-4 accent-[#14532D]"
                        />
                        <span class="text-xs ${done ? "line-through text-emerald-900 font-bold" : "text-[#132219] font-semibold"}">
                          ${idx + 1}. ${escapeHtml(lesson.title)}
                        </span>
                      </label>
                    `;
                  }).join("")}
                </div>
              `}
              ${!enrolled ? `
                <p class="text-[11px] text-amber-800 font-semibold">
                  ${isBn ? "পাঠ সম্পন্ন হিসেবে চিহ্নিত করতে আগে প্রোগ্রামে এনরোল (Enrol) করুন।" : "Click Enrol in Program below to track lessons and unlock completion."}
                </p>
              ` : ""}
            </div>
          </div>
        ` : ""}
      </div>

      <!-- Actions & Verified Links Footer -->
      <div class="pt-3 border-t border-[#E2ECE5] space-y-2.5">
        <div class="flex flex-wrap gap-1.5">
          ${ytInfo && ytInfo.ok ? `<a href="${escapeHtml(ytInfo.canonicalUrl)}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-[11px] font-extrabold">▶ Watch YouTube</a>` : ""}
          ${courseLink ? `<a href="${escapeHtml(courseLink)}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 rounded-lg bg-[#ECFDF5] hover:bg-[#DCFCE7] border border-[#BBF7D0] text-[#14532D] text-[11px] font-extrabold">🌐 Online Course</a>` : ""}
          ${pdfLink ? `<a href="${escapeHtml(pdfLink)}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 text-[11px] font-extrabold">📄 PDF Guide</a>` : ""}
          ${applyLink ? `<a href="${escapeHtml(applyLink)}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-950 text-[11px] font-extrabold">📝 Apply / Register</a>` : ""}
          ${sourceLink ? `<a href="${escapeHtml(sourceLink)}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold">Official Source ↗</a>` : ""}
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            data-skill-expand="${escapeHtml(prog.id)}"
            class="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#EDF4EE] hover:bg-[#DCFCE7] text-[#14532D] text-xs font-extrabold"
          >
            ${isExpanded
              ? (isBn ? "পাঠ লুকান ▲" : "Hide Lessons ▲")
              : (isBn ? `পাঠ ও বিস্তারিত (${evalRes.totalLessons}) ▼` : `Lessons & Details (${evalRes.totalLessons}) ▼`)}
          </button>

          ${!enrolled ? `
            <button
              type="button"
              data-skill-enrol="${escapeHtml(prog.id)}"
              class="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold"
            >${isBn ? "+ প্রোগ্রামে এনরোল করুন" : "+ Enrol in Program"}</button>
          ` : evalRes.certificateUnlocked ? `
            <div class="flex flex-wrap items-center gap-1.5">
              ${certLink ? `
                <a href="${escapeHtml(certLink)}" target="_blank" rel="noopener noreferrer" class="min-h-[40px] inline-flex items-center px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold">
                  🎓 ${isBn ? "অফিশিয়াল সার্টিফিকেট পোর্টাল" : "Provider Certificate Portal ↗"}
                </a>
              ` : ""}
              <button
                type="button"
                data-skill-view-cert="${escapeHtml(prog.id)}"
                class="min-h-[40px] px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0C3B20] text-xs font-extrabold"
              >🏅 ${isBn ? "সম্পূর্ণতা সনদ দেখুন" : "View Completion Record"}</button>
            </div>
          ` : `
            <span class="text-[11px] font-bold text-teal-800">
              ${isBn ? `সার্টিফিকেটের জন্য আরও ${evalRes.remainingCount}টি পাঠ বাকি` : `${evalRes.remainingCount} lesson${evalRes.remainingCount === 1 ? "" : "s"} remaining`}
            </span>
          `}
        </div>
      </div>
    </article>
  `;
}

// ----------------------------------------------------------------------------
// 2. JOB & CAREER PREPARATION (VERIFIED NOTIFICATIONS VS GENERAL GUIDANCE)
// ----------------------------------------------------------------------------
function renderSkillCareerPrepSection(state, allCareers, isBn) {
  const sz = state.skillZone || {};
  const prepCat = sz.careerPrepCategory || "ALL";
  const recordKind = sz.careerRecordKind || "ALL";
  const audienceRole = sz.audienceRole || "ALL";
  const search = sz.careerSearch || "";

  const filtered = filterSkillCareerResources(allCareers, {
    prepCategory: prepCat,
    recordKind,
    audienceRole,
    search
  });

  const verifiedCount = allCareers.filter((c) => c.recordKind === "VERIFIED_NOTIFICATION").length;
  const guidanceCount = allCareers.filter((c) => c.recordKind !== "VERIFIED_NOTIFICATION").length;

  return `
    <section data-skill-careers-view="1" class="space-y-4">
      <!-- Honest Anti-Fabrication Notice -->
      <div class="rounded-2xl bg-sky-50 border border-sky-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="space-y-1">
          <div class="text-xs font-extrabold text-sky-950">
            ${isBn ? "স্বচ্ছ ও যাচাইকৃত ক্যারিয়ার নীতি (ভুয়া বিজ্ঞপ্তি মুক্ত)" : "Verified Career Information Standard — Zero Fabricated Vacancies"}
          </div>
          <p class="text-[11px] text-sky-900 leading-relaxed">
            ${isBn
              ? "আমরা কখনোই ভুয়া চাকরির শূন্যপদ, বেতন বা শেষ তারিখ তৈরি করি না। প্রতিটি কার্ডে স্পষ্টভাবে লেখা থাকে এটি অ্যাডমিন-যাচাইকৃত অফিশিয়াল বিজ্ঞপ্তি নাকি সাধারণ ক্যারিয়ার প্রস্তুতি গাইড।"
              : "Guru Ji Vision never invents vacancies, salaries, recruitment deadlines, or job offers. Every card is clearly badged as either an Admin-Verified Official Notification or General Career Guidance."}
          </p>
        </div>
        <div class="flex flex-wrap gap-1.5 shrink-0">
          <span class="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-950 text-[10px] font-extrabold">
            ✓ Verified Notifications (${verifiedCount})
          </span>
          <span class="px-2.5 py-1 rounded-full bg-white border border-sky-300 text-sky-950 text-[10px] font-extrabold">
            📘 Career Guidance (${guidanceCount})
          </span>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="gv-card p-4 space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <div class="md:col-span-5">
            <label for="skillCareerSearchInput" class="sr-only">Search job and career resources</label>
            <input
              id="skillCareerSearchInput"
              type="search"
              value="${escapeHtml(search)}"
              placeholder="${isBn ? "চাকরি প্রস্তুতি, ইন্টার্নশিপ, রিজিউমে বা পরীক্ষা খুঁজুন..." : "Search agri jobs, internships, apprenticeships, resume, exams..."}"
              class="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs sm:text-sm bg-white"
            />
          </div>
          <div class="md:col-span-4">
            <label for="skillCareerCatSelect" class="sr-only">Filter career prep category</label>
            <select id="skillCareerCatSelect" class="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold text-[#14532D]">
              <option value="ALL" ${prepCat === "ALL" ? "selected" : ""}>${isBn ? "সকল ৮টি ক্যারিয়ার বিভাগ" : "All 8 Career Prep Tracks"}</option>
              ${CAREER_PREP_CATEGORIES.map((c) => `
                <option value="${c.key}" ${prepCat === c.key ? "selected" : ""}>${escapeHtml(isBn ? c.bn : c.en)}</option>
              `).join("")}
            </select>
          </div>
          <div class="md:col-span-3">
            <label for="skillCareerKindSelect" class="sr-only">Filter notification vs guidance</label>
            <select id="skillCareerKindSelect" class="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold text-[#14532D]">
              <option value="ALL" ${recordKind === "ALL" ? "selected" : ""}>${isBn ? "বিজ্ঞপ্তি ও গাইড (সব)" : "All (Notifications + Guidance)"}</option>
              <option value="VERIFIED_NOTIFICATION" ${recordKind === "VERIFIED_NOTIFICATION" ? "selected" : ""}>${isBn ? "শুধুমাত্র যাচাইকৃত বিজ্ঞপ্তি" : "Verified Official Notifications Only"}</option>
              <option value="CAREER_GUIDANCE" ${recordKind === "CAREER_GUIDANCE" ? "selected" : ""}>${isBn ? "শুধুমাত্র ক্যারিয়ার গাইডেন্স" : "Career Guidance & Prep Only"}</option>
            </select>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <button type="button" data-skill-career-cat="ALL" class="px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border ${prepCat === "ALL" ? "bg-[#14532D] text-white border-[#14532D]" : "bg-[#F8FBF8] text-[#14532D] border-[#CDE0D3]"}">
            ${isBn ? "সব ট্র্যাক" : "All Tracks"}
          </button>
          ${CAREER_PREP_CATEGORIES.map((c) => `
            <button type="button" data-skill-career-cat="${c.key}" class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border ${prepCat === c.key ? "bg-[#14532D] text-white border-[#14532D]" : "bg-white text-[#1E3A2F] border-[#D9EAE0]"}">
              ${escapeHtml(isBn ? c.bn : c.en)}
            </button>
          `).join("")}
        </div>
      </div>

      ${filtered.length === 0 ? `
        <div class="gv-card p-6 text-center space-y-2">
          <p class="text-sm font-extrabold text-[#14532D]">
            ${recordKind === "VERIFIED_NOTIFICATION"
              ? (isBn ? "বর্তমানে কোনো অ্যাডমিন-যাচাইকৃত চাকরির বিজ্ঞপ্তি প্রকাশিত হয়নি।" : "No Admin-verified recruitment notifications match this filter right now.")
              : (isBn ? "কোনো ক্যারিয়ার রিসোর্স পাওয়া যায়নি।" : "No career preparation resources match this filter.")}
          </p>
          <p class="text-xs text-[#496052]">
            ${recordKind === "VERIFIED_NOTIFICATION"
              ? (isBn ? "আমরা ভুয়া শূন্যপদ তৈরি করি না — সাধারণ প্রস্তুতি গাইড ও অফিশিয়াল পোর্টাল দেখতে 'Career Guidance' নির্বাচন করুন।" : "We never invent vacancies or deadlines. Switch to Career Guidance to browse verified official recruitment portals & preparation checklists.")
              : (isBn ? "ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।" : "Try selecting another track or clearing your search.")}
          </p>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${filtered.map((item) => {
            const cat = CAREER_PREP_CATEGORY_MAP[item.prepCategory] || CAREER_PREP_CATEGORIES[0];
            const kindMeta = CAREER_RECORD_KINDS[item.recordKind] || CAREER_RECORD_KINDS.CAREER_GUIDANCE;
            const srcUrl = safeUrl(item.officialSourceUrl || "");
            const appUrl = safeUrl(item.applicationUrl || "");
            const pdfUrl = safeUrl(item.pdfUrl || "");
            const yt = item.youtubeUrl ? extractYouTubeInfo(item.youtubeUrl) : null;
            return `
              <article data-skill-career-card="${escapeHtml(item.id)}" data-record-kind="${escapeHtml(item.recordKind)}" class="gv-card p-5 flex flex-col justify-between gap-3">
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold ${escapeHtml(kindMeta.cls)}">
                      ${item.recordKind === "VERIFIED_NOTIFICATION" ? "✓ " : "📘 "}${escapeHtml(isBn ? kindMeta.bn : kindMeta.en)}
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-[#EDF4EE] text-[#14532D] text-[10px] font-bold">${escapeHtml(isBn ? cat.bn : cat.en)}</span>
                    ${renderAudienceBadges(item.targetRoles, isBn)}
                  </div>
                  <h3 class="text-sm sm:text-base font-extrabold text-[#132219] leading-snug">
                    ${escapeHtml(isBn && item.titleBn ? item.titleBn : item.title)}
                  </h3>
                  ${item.organization ? `<p class="text-[11px] font-bold text-[#15803D]">${escapeHtml(item.organization)}</p>` : ""}
                  <p class="text-xs text-[#475569] leading-relaxed">${escapeHtml(item.summary || "")}</p>
                  ${item.eligibility ? `<div class="text-[11px] text-[#334155]"><span class="font-extrabold text-[#14532D]">${isBn ? "যোগ্যতা:" : "Eligibility:"}</span> ${escapeHtml(item.eligibility)}</div>` : ""}
                  ${item.deadline ? `<div class="text-[11px] font-bold text-rose-800">${isBn ? "যাচাইকৃত শেষ তারিখ:" : "Verified Deadline:"} ${escapeHtml(item.deadline)}</div>` : ""}
                  ${item.verifiedNote ? `<div class="text-[10px] text-[#64748B] bg-[#F8FBF8] border border-[#E2ECE5] rounded-xl px-2.5 py-1.5">${escapeHtml(item.verifiedNote)}</div>` : ""}
                </div>
                <div class="pt-2 border-t border-[#E2ECE5] flex flex-wrap gap-1.5">
                  ${appUrl ? `<a href="${escapeHtml(appUrl)}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-[#14532D] hover:bg-[#0C3B20] text-white text-[11px] font-extrabold">${item.recordKind === "VERIFIED_NOTIFICATION" ? "Official Apply Portal ↗" : "Official Portal ↗"}</a>` : ""}
                  ${srcUrl && srcUrl !== appUrl ? `<a href="${escapeHtml(srcUrl)}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-extrabold">Official Source ↗</a>` : ""}
                  ${yt && yt.ok ? `<a href="${escapeHtml(yt.canonicalUrl)}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-[11px] font-extrabold">▶ Watch Guide</a>` : ""}
                  ${pdfUrl ? `<a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-[11px] font-extrabold">📄 PDF Guide</a>` : ""}
                </div>
              </article>
            `;
          }).join("")}
        </div>
      `}
    </section>
  `;
}

// ----------------------------------------------------------------------------
// 3. USER LEARNING PROGRESS, COMPLETED TRAINING & VERIFIED CERTIFICATES
// ----------------------------------------------------------------------------
function renderUserProgressSection(state, enrolledEntries, inProgressCount, completedCount, isBn) {
  if (!state.user) {
    return `
      <section data-skill-progress-view="1" class="gv-card p-6 sm:p-8 text-center space-y-3">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-[#ECFDF5] text-[#14532D] flex items-center justify-center text-2xl">🎓</div>
        <h3 class="font-display text-xl font-bold text-[#14532D]">
          ${isBn ? "আপনার শেখার অগ্রগতি ও সার্টিফিকেট সংরক্ষণ করুন" : "Sign In to Track Your Skill Progress & Certificates"}
        </h3>
        <p class="text-xs sm:text-sm text-[#496052] max-w-lg mx-auto">
          ${isBn
            ? "যেকোনো প্রশিক্ষণে এনরোল করতে, প্রতিটি পাঠ সম্পন্ন হিসেবে চিহ্নিত করতে এবং সম্পূর্ণ প্রশিক্ষণের সনদ দেখতে Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন।"
            : "Sign in to enrol in skill programs, save lesson completion in your private cloud account, view completed training, and access unlocked certificates."}
        </p>
        <button type="button" data-action="open-auth" class="min-h-[44px] px-6 py-2.5 rounded-2xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs sm:text-sm font-extrabold">
          ${isBn ? "Google দিয়ে সাইন ইন করুন" : "Sign In to Track Progress"}
        </button>
      </section>
    `;
  }

  const completedEntries = enrolledEntries.filter((e) => e.evalRes.isCompleted);
  const activeEntries = enrolledEntries.filter((e) => !e.evalRes.isCompleted);
  const viewingCertId = state.skillZone?.viewingCertificateId || "";
  const viewingCertEntry = completedEntries.find((e) => e.program.id === viewingCertId) || null;

  return `
    <section data-skill-progress-view="1" class="space-y-5">
      <!-- Summary KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="gv-card p-4">
          <div class="text-[11px] font-bold text-[#496052]">${isBn ? "মোট এনরোলকৃত প্রোগ্রাম" : "Enrolled Programs"}</div>
          <div class="text-2xl font-extrabold text-[#14532D] mt-1">${enrolledEntries.length}</div>
        </div>
        <div class="gv-card p-4">
          <div class="text-[11px] font-bold text-[#496052]">${isBn ? "চলমান প্রশিক্ষণ" : "In Progress"}</div>
          <div class="text-2xl font-extrabold text-teal-700 mt-1">${inProgressCount}</div>
        </div>
        <div class="gv-card p-4">
          <div class="text-[11px] font-bold text-[#496052]">${isBn ? "সম্পন্ন প্রশিক্ষণ ও সার্টিফিকেট" : "Completed & Certificates"}</div>
          <div class="text-2xl font-extrabold text-emerald-700 mt-1">${completedCount}</div>
        </div>
      </div>

      <!-- Verifiable Completion Record Preview (ONLY shown for genuinely 100% completed programs) -->
      ${viewingCertEntry ? `
        <div data-skill-certificate-card="${escapeHtml(viewingCertEntry.program.id)}" class="rounded-3xl bg-gradient-to-br from-[#ECFDF5] via-white to-[#FEF9C3] border-2 border-[#14532D] p-6 space-y-3 shadow-md">
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="px-2.5 py-0.5 rounded-full bg-[#14532D] text-white text-[10px] font-extrabold uppercase">Verified Learning Completion Record</span>
              <h3 class="font-display text-xl font-bold text-[#14532D] mt-1">Guru Ji Vision — Skill Zone Completion</h3>
            </div>
            <button type="button" data-skill-close-cert="1" class="px-3 py-1 rounded-lg bg-white border border-[#CDE0D3] text-xs font-bold text-[#14532D]">Close ✕</button>
          </div>
          <p class="text-sm text-[#132219]">
            This confirms that <strong>${escapeHtml(state.userProfile?.displayName || state.user.displayName || state.user.email || "Learner")}</strong> completed all <strong>${viewingCertEntry.evalRes.totalLessons} / ${viewingCertEntry.evalRes.totalLessons}</strong> defined learning lessons in:
          </p>
          <div class="p-3.5 rounded-2xl bg-white border border-[#CDE0D3]">
            <div class="text-base font-extrabold text-[#14532D]">${escapeHtml(viewingCertEntry.program.title)}</div>
            <div class="text-xs text-[#475569] mt-0.5">${escapeHtml(viewingCertEntry.program.provider || "Guru Ji Vision Skill Zone")}</div>
            ${viewingCertEntry.program.certificateDetails ? `<div class="text-[11px] text-[#15803D] mt-1">${escapeHtml(viewingCertEntry.program.certificateDetails)}</div>` : ""}
          </div>
          <p class="text-[11px] text-[#64748B]">
            Note: Official government / university certificates (ASCI, SWAYAM, MANAGE, RSETI, NAPS, NIELIT) are issued directly by those authorities after completing their official assessments.
          </p>
          <div class="flex flex-wrap gap-2">
            ${safeUrl(viewingCertEntry.program.certificateUrl || "") ? `
              <a href="${escapeHtml(safeUrl(viewingCertEntry.program.certificateUrl))}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">
                Open Official Provider Certificate Portal ↗
              </a>
            ` : ""}
          </div>
        </div>
      ` : ""}

      ${enrolledEntries.length === 0 ? `
        <div class="gv-card p-6 text-center space-y-3">
          <p class="text-sm font-extrabold text-[#14532D]">${isBn ? "আপনি এখনো কোনো প্রশিক্ষণ প্রোগ্রামে এনরোল করেননি।" : "You have not enrolled in any skill program yet."}</p>
          <button type="button" data-skill-sub="programs" class="min-h-[42px] px-4 py-2 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">
            ${isBn ? "১৫টি বিভাগের কোর্স দেখুন →" : "Browse All 15 Skill Categories →"}
          </button>
        </div>
      ` : `
        <!-- Active / In-Progress Programs -->
        ${activeEntries.length > 0 ? `
          <div class="space-y-3">
            <h3 class="text-sm sm:text-base font-extrabold text-[#14532D]">${isBn ? "চলমান প্রশিক্ষণসমূহ" : "In-Progress Training Programs"}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${activeEntries.map(({ program, progress, evalRes }) => {
                const completedSet = new Set(evalRes.completedLessonIds);
                return `
                  <div class="gv-card p-4 space-y-3">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <h4 class="text-sm font-extrabold text-[#132219]">${escapeHtml(program.title)}</h4>
                        <p class="text-[11px] text-[#496052]">${evalRes.completedCount}/${evalRes.totalLessons} lessons completed (${evalRes.progressPercent}%)</p>
                      </div>
                      <span class="px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 text-[10px] font-extrabold shrink-0">In Progress</span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-[#E2ECE5] overflow-hidden">
                      <div class="h-full bg-teal-600 rounded-full" style="width:${evalRes.progressPercent}%"></div>
                    </div>
                    <div class="space-y-1.5">
                      ${(program.lessons || []).map((lesson, idx) => {
                        const done = completedSet.has(lesson.id);
                        return `
                          <label class="flex items-start gap-2 p-2 rounded-xl border ${done ? "bg-emerald-50 border-emerald-200" : "bg-[#F8FBF8] border-[#E2ECE5]"} cursor-pointer text-xs">
                            <input type="checkbox" data-skill-lesson-toggle="${escapeHtml(program.id)}" data-lesson-id="${escapeHtml(lesson.id)}" ${done ? "checked" : ""} class="mt-0.5 w-4 h-4 accent-[#14532D]" />
                            <span class="${done ? "line-through text-emerald-900 font-bold" : "text-[#132219]"}">${idx + 1}. ${escapeHtml(lesson.title)}</span>
                          </label>
                        `;
                      }).join("")}
                    </div>
                    <p class="text-[11px] text-amber-800 font-semibold">
                      Complete the remaining ${evalRes.remainingCount} lesson${evalRes.remainingCount === 1 ? "" : "s"} to mark this program completed and unlock certificate access.
                    </p>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        ` : ""}

        <!-- Completed Training & Certificates -->
        ${completedEntries.length > 0 ? `
          <div class="space-y-3">
            <h3 class="text-sm sm:text-base font-extrabold text-emerald-900">${isBn ? "সম্পন্ন প্রশিক্ষণ ও সার্টিফিকেট" : "Completed Training & Unlocked Certificates"}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${completedEntries.map(({ program, evalRes }) => {
                const certUrl = safeUrl(program.certificateUrl || "");
                return `
                  <div class="gv-card p-4 border-2 border-emerald-300 bg-emerald-50/30 space-y-2.5">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <span class="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-extrabold">✓ 100% Completed (${evalRes.completedCount}/${evalRes.totalLessons} lessons)</span>
                        <h4 class="text-sm font-extrabold text-[#132219] mt-1">${escapeHtml(program.title)}</h4>
                        <p class="text-[11px] text-[#496052]">${escapeHtml(program.provider || "")}</p>
                      </div>
                    </div>
                    ${program.certificateDetails ? `<p class="text-[11px] text-[#14532D]">${escapeHtml(program.certificateDetails)}</p>` : ""}
                    <div class="flex flex-wrap gap-2 pt-1">
                      <button type="button" data-skill-view-cert="${escapeHtml(program.id)}" class="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0C3B20] text-xs font-extrabold">
                        🏅 View Completion Record
                      </button>
                      ${certUrl ? `
                        <a href="${escapeHtml(certUrl)}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">
                          Official Certificate Portal ↗
                        </a>
                      ` : ""}
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        ` : ""}
      `}
    </section>
  `;
}
