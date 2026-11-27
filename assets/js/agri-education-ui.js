// ============================================================================
// GURU JI VISION — UPGRADED AGRICULTURE EDUCATION & ADMIN DISCOVERY UI (PHASE 7)
// ============================================================================
// Features:
// 1. Study Notes & PYQs: 13 subjects, topic filter, bilingual EN/BN, inline PDF
//    viewer, legal-only download button, source/citation/last-updated, bookmarks
// 2. MCQ Question Bank: 8 Exam Prep Categories, Subject/Difficulty/Provenance
//    filters, Practice Mode vs Mock Test Mode, strict 4-tier provenance badges
//    (Official PYQ | Verified Published | Practice | AI-Generated Practice),
//    detailed explanations, bookmarks, score tracking & attempt history
// 3. University & ICAR Syllabus: Preserves 8-semester ICAR 5th Deans' Syllabus
//    AND supports University-wise official syllabi with publication year & source
// 4. New & Discovered Resources + Student Saved & Continue Learning Desk
// 5. Admin Syllabus & Automatic Study Resource Discovery Studio
// ============================================================================

import { STUDY_CATEGORIES } from "./config.js";
import { escapeHtml, formatDateShort, safeUrl } from "./calculators.js";
import {
  AGRI_SUBJECTS,
  AGRI_SUBJECT_MAP,
  DIFFICULTY_META,
  EDUCATION_SOURCE_CAPABILITIES,
  EXAM_PREP_CATEGORIES,
  EXAM_PREP_MAP,
  QUESTION_PROVENANCE_META,
  filterQuizQuestions,
  filterStudyMaterials,
  filterSyllabi,
  mergeQuizQuestions,
  mergeStudyMaterials,
  mergeSyllabi
} from "./agri-education-data.js";
import {
  EDU_LANGUAGES,
  EDU_LANGUAGE_MAP,
  LEARNING_RESOURCE_CATEGORIES,
  LEARNING_RESOURCE_CATEGORY_MAP,
  PYQ_ORIGIN_META,
  extractYouTubeInfo,
  resolveMockTestQuestions
} from "./edu-cms-utils.js";

function resolveEduLang(state) {
  const pref = state.edu?.lang;
  if (pref === "BN" || pref === "EN") return pref;
  return state.lang === "bn" ? "BN" : "EN";
}

function getBookmarkSets(state) {
  const list = Array.isArray(state.studyBookmarks) ? state.studyBookmarks : [];
  const notes = new Set();
  const mcqs = new Set();
  const syllabi = new Set();
  const videos = new Set();
  const resources = new Set();
  const progress = [];
  for (const b of list) {
    if (!b || !b.itemId) continue;
    if (b.itemType === "NOTE") notes.add(b.itemId);
    else if (b.itemType === "MCQ") mcqs.add(b.itemId);
    else if (b.itemType === "SYLLABUS") syllabi.add(b.itemId);
    else if (b.itemType === "VIDEO") videos.add(b.itemId);
    else if (b.itemType === "RESOURCE") resources.add(b.itemId);
    else if (b.itemType === "PROGRESS") progress.push(b);
  }
  progress.sort((a, b) => (Number(b.updatedAtMs) || 0) - (Number(a.updatedAtMs) || 0));
  return { notes, mcqs, syllabi, videos, resources, progress };
}

function renderContinueLearningBar(progressList, bn) {
  if (!progressList.length) return "";
  const latest = progressList[0];
  return `
    <div class="rounded-2xl border border-emerald-200 bg-gradient-to-r from-[#ECFDF5] to-white p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
      <div class="min-w-0 space-y-0.5">
        <div class="text-[10px] font-extrabold uppercase tracking-wider text-[#15803D]">
          ${bn ? "▶ পড়া চালিয়ে যান (Continue Learning)" : "▶ Continue Learning"}
        </div>
        <div class="text-sm font-extrabold text-[#14532D] truncate">${escapeHtml(latest.title || "")}</div>
        <div class="text-[11px] text-[#496052]">
          ${escapeHtml(latest.subject || "Agriculture")}${latest.semester ? ` • Sem ${escapeHtml(latest.semester)}` : ""}
        </div>
      </div>
      <button type="button" data-read-material="${escapeHtml(latest.itemId)}" class="min-h-[40px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold shrink-0">
        ${bn ? "নোট খুলুন →" : "Resume Reading →"}
      </button>
    </div>
  `;
}

function renderInlinePdfModal(edu, bn) {
  if (!edu?.previewPdfUrl) return "";
  const url = safeUrl(edu.previewPdfUrl);
  if (!url) return "";
  const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  return `
    <div class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-[#CDE0D3]">
        <div class="px-4 sm:px-5 py-3.5 bg-[#14532D] text-white flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="text-xs text-[#DCFCE7] font-bold">${bn ? "PDF রিডার" : "PDF Viewer"}</div>
            <div class="text-sm font-extrabold truncate">${escapeHtml(edu.previewPdfTitle || "Document")}</div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold">
              ${bn ? "নতুন ট্যাবে খুলুন ↗" : "Open Direct ↗"}
            </a>
            <button type="button" data-edu-close-pdf="1" class="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold">✕</button>
          </div>
        </div>
        <div class="flex-1 bg-slate-100 relative">
          <iframe src="${escapeHtml(viewerUrl)}" title="${escapeHtml(edu.previewPdfTitle || "PDF Preview")}" class="w-full h-full border-0"></iframe>
        </div>
      </div>
    </div>
  `;
}

function renderInlineVideoModal(edu, bn) {
  if (!edu?.previewVideoUrl) return "";
  const yt = extractYouTubeInfo(edu.previewVideoUrl);
  if (!yt.ok || !yt.embedUrl) return "";
  return `
    <div class="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-[#CDE0D3]">
        <div class="px-4 sm:px-5 py-3.5 bg-[#14532D] text-white flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="text-xs text-[#DCFCE7] font-bold">${bn ? "ভিডিও ক্লাস প্লেয়ার" : "YouTube Video Player"}</div>
            <div class="text-sm font-extrabold truncate">${escapeHtml(edu.previewVideoTitle || "Video Lecture")}</div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <a href="${escapeHtml(yt.watchUrl)}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold">
              YouTube ↗
            </a>
            <button type="button" data-edu-close-video="1" class="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-extrabold">✕</button>
          </div>
        </div>
        <div class="aspect-video w-full bg-black">
          <iframe
            src="${escapeHtml(yt.embedUrl)}"
            title="${escapeHtml(edu.previewVideoTitle || "YouTube Lecture")}"
            class="w-full h-full border-0"
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
// 1B. DEDICATED VIDEO LEARNING SUB-VIEW (ADMIN-CURATED YOUTUBE VIDEOS)
// ----------------------------------------------------------------------------
function renderVideoLearningSubView(state, lang, allMaterials, savedVideoIds) {
  const bn = lang === "BN";
  const edu = state.edu || {};
  const semFilter = Number(state.studentSemester) || 0;
  const subjFilter = edu.videoSubject || "ALL";
  const langFilter = edu.videoLanguage || "ALL";
  const q = String(edu.videoSearch || "").trim().toLowerCase();

  const allVideos = allMaterials.filter((m) => m.category === "VIDEO_LECTURE");
  const filtered = allVideos.filter((v) => {
    if (semFilter > 0 && Number(v.semester) !== semFilter) return false;
    if (subjFilter !== "ALL" && v.subjectKey !== subjFilter) return false;
    if (langFilter !== "ALL" && (v.language || "EN") !== langFilter) return false;
    if (q) {
      const hay = `${v.title || ""} ${v.titleBn || ""} ${v.subject || ""} ${v.topic || ""} ${v.summary || ""} ${v.sourceName || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return `
    <div class="space-y-4">
      <div class="gv-card p-3.5 sm:p-4 space-y-3">
        <div>
          <h3 class="text-sm sm:text-base font-extrabold text-[#14532D]">
            ${bn ? "কৃষি ভিডিও লার্নিং (YouTube ক্লাস ও লেকচার)" : "Agriculture Video Learning (Curated YouTube Lectures)"}
          </h3>
          <p class="text-[11px] text-[#496052]">
            ${bn ? "অ্যাডমিন কর্তৃক প্রকাশিত যাচাইকৃত কৃষি ভিডিও লেকচার — বিষয়, টপিক ও ভাষা অনুযায়ী খুঁজুন।" : "Admin-curated agriculture lectures, field demos & exam prep videos with safe inline playback."}
          </p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input id="eduVideoSearch" type="search" value="${escapeHtml(edu.videoSearch || "")}" placeholder="${bn ? "ভিডিও, বিষয় বা টপিক খুঁজুন..." : "Search videos, subject, topic..."}" class="px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white" />
          <select id="eduVideoSubject" class="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white">
            <option value="ALL">${bn ? "সব বিষয় (১৩টি)" : "All 13 Subjects"}</option>
            ${AGRI_SUBJECTS.map((s) => `<option value="${escapeHtml(s.key)}" ${subjFilter === s.key ? "selected" : ""}>${escapeHtml(bn ? s.bn : s.en)}</option>`).join("")}
          </select>
          <select id="eduVideoLanguage" class="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white">
            <option value="ALL">${bn ? "সব ভাষা" : "All Languages"}</option>
            ${EDU_LANGUAGES.map((l) => `<option value="${escapeHtml(l.key)}" ${langFilter === l.key ? "selected" : ""}>${escapeHtml(l.label)}</option>`).join("")}
          </select>
        </div>
      </div>

      ${filtered.length === 0 ? `
        <div class="gv-card p-8 text-center space-y-2">
          <p class="text-sm font-extrabold text-[#14532D]">${bn ? "এখনো কোনো ভিডিও লেকচার প্রকাশিত হয়নি বা ফিল্টারের সাথে মিলেনি।" : "No published video lectures match this filter yet."}</p>
          <p class="text-xs text-[#496052]">${bn ? "অ্যাডমিন এডুকেশন CMS থেকে নতুন YouTube ভিডিও যোগ করলে সাথে সাথে এখানে দেখা যাবে।" : "New YouTube video lectures published by Admins in Education CMS appear here immediately."}</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filtered.map((v) => {
            const rawYt = v.youtubeUrl || v.resourceUrl || "";
            const yt = extractYouTubeInfo(rawYt);
            const thumb = safeUrl(v.thumbnailUrl || (yt.ok ? yt.thumbnailUrl : ""));
            const watchHref = safeUrl(yt.ok ? yt.watchUrl : rawYt);
            const langLabel = EDU_LANGUAGE_MAP[v.language]?.label || "English";
            const isSaved = savedVideoIds.has(v.id);
            const title = bn && v.titleBn ? v.titleBn : v.title;
            return `
              <article class="gv-card overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div class="relative aspect-video bg-slate-900 overflow-hidden">
                    ${thumb ? `
                      <img src="${escapeHtml(thumb)}" alt="${escapeHtml(title)}" class="w-full h-full object-cover" loading="lazy" />
                    ` : `
                      <div class="w-full h-full flex items-center justify-center text-white text-xs font-extrabold">YouTube Video Lecture</div>
                    `}
                    <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-extrabold">${escapeHtml(langLabel)}</span>
                    <span class="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#14532D]/90 text-white text-[10px] font-extrabold">Sem ${escapeHtml(v.semester || 1)}</span>
                  </div>
                  <div class="p-4 space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-[11px] font-extrabold text-[#1E7E45] truncate">${escapeHtml(v.subject)}${v.topic ? ` • ${escapeHtml(v.topic)}` : ""}</span>
                      <button
                        type="button"
                        data-edu-bookmark-type="VIDEO"
                        data-edu-bookmark-id="${escapeHtml(v.id)}"
                        data-edu-bookmark-title="${escapeHtml(v.title)}"
                        data-edu-bookmark-subject="${escapeHtml(v.subject)}"
                        data-edu-bookmark-sem="${escapeHtml(v.semester || 1)}"
                        class="px-2 py-0.5 rounded-lg text-[11px] font-extrabold shrink-0 ${isSaved ? "bg-amber-400 text-[#0C3B20]" : "bg-slate-100 text-slate-700"}"
                      >${isSaved ? "★ Saved" : "☆ Save"}</button>
                    </div>
                    <h4 class="text-sm font-extrabold text-[#132219] leading-snug line-clamp-2">${escapeHtml(title)}</h4>
                    ${v.summary ? `<p class="text-xs text-[#496052] line-clamp-2">${escapeHtml(v.summary)}</p>` : ""}
                    ${v.sourceName ? `<div class="text-[11px] text-[#64748B] truncate">${escapeHtml(v.sourceName)}</div>` : ""}
                  </div>
                </div>
                <div class="px-4 pb-4 flex flex-wrap gap-2">
                  ${yt.ok ? `
                    <button type="button" data-edu-play-video="${escapeHtml(yt.watchUrl)}" data-edu-play-title="${escapeHtml(title)}" class="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
                      ▶ ${bn ? "ভিডিও দেখুন" : "Watch Lecture"}
                    </button>
                  ` : ""}
                  ${watchHref ? `
                    <a href="${escapeHtml(watchHref)}" target="_blank" rel="noopener noreferrer" class="min-h-[40px] inline-flex items-center justify-center px-3 py-2 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-extrabold">
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

// ----------------------------------------------------------------------------
// 1C. DEDICATED OFFICIAL PREVIOUS YEAR QUESTION PAPERS & ANSWER KEYS SUB-VIEW
// ----------------------------------------------------------------------------
function renderPyqPapersSubView(state, lang, allMaterials, savedNoteIds) {
  const bn = lang === "BN";
  const edu = state.edu || {};
  const examFilter = edu.pyqExam || "ALL";
  const yearFilter = String(edu.pyqYear || "").trim();
  const originFilter = edu.pyqOrigin || "ALL";
  const q = String(edu.pyqSearch || "").trim().toLowerCase();

  const allPyqs = allMaterials.filter((m) => m.category === "PYQ");
  const years = Array.from(new Set(allPyqs.map((p) => p.examYear).filter(Boolean))).sort().reverse();
  const filtered = allPyqs.filter((p) => {
    const pOrigin = p.pyqOrigin || (p.contentOrigin === "AI_PRACTICE" ? "AI_PRACTICE" : "OFFICIAL_PYQ");
    if (examFilter !== "ALL" && p.examCategory && p.examCategory !== examFilter) return false;
    if (yearFilter && String(p.examYear || "") !== yearFilter) return false;
    if (originFilter !== "ALL" && pOrigin !== originFilter) return false;
    if (q) {
      const hay = `${p.title || ""} ${p.subject || ""} ${p.examCategory || ""} ${p.examYear || ""} ${p.sourceName || ""} ${p.summary || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return `
    <div class="space-y-4">
      <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-3">
        <div class="space-y-0.5 max-w-2xl">
          <div class="font-extrabold">${bn ? "অফিশিয়াল PYQ বনাম প্র্যাকটিস প্রশ্নপত্রের স্বচ্ছতা নীতি" : "Strict PYQ Authenticity Policy"}</div>
          <div>${bn ? "অফিশিয়াল বিগত বছরের প্রশ্নপত্র (Official PYQ), প্র্যাকটিস সেট এবং AI-তৈরি প্রশ্নপত্র স্পষ্টভাবে আলাদা ব্যাজে দেখানো হয়।" : "Verified Official Previous Year Question Papers, Practice Sets, and AI-Generated Practice Papers are strictly distinguished with clear labels and official answer keys where available."}</div>
        </div>
        <button type="button" data-edu-jump-pyq-mcqs="1" class="px-3.5 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold shrink-0">
          ${bn ? "অফিশিয়াল PYQ MCQ অনুশীলন →" : "Practice Official PYQ MCQs →"}
        </button>
      </div>

      <div class="gv-card p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <input id="eduPyqSearch" type="search" value="${escapeHtml(edu.pyqSearch || "")}" placeholder="${bn ? "পরীক্ষা, সাল বা বিষয় খুঁজুন..." : "Search exam, year, subject..."}" class="px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white" />
        <select id="eduPyqExam" class="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white">
          ${EXAM_PREP_CATEGORIES.map((ex) => `<option value="${escapeHtml(ex.key)}" ${examFilter === ex.key ? "selected" : ""}>${escapeHtml(bn ? ex.bn : ex.en)}</option>`).join("")}
        </select>
        <select id="eduPyqYear" class="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white">
          <option value="">${bn ? "সব সাল" : "All Exam Years"}</option>
          ${years.map((y) => `<option value="${escapeHtml(y)}" ${yearFilter === String(y) ? "selected" : ""}>${escapeHtml(y)}</option>`).join("")}
        </select>
        <select id="eduPyqOrigin" class="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white">
          <option value="ALL">${bn ? "সব ধরনের প্রশ্নপত্র" : "All Provenance Types"}</option>
          <option value="OFFICIAL_PYQ" ${originFilter === "OFFICIAL_PYQ" ? "selected" : ""}>Official PYQs Only</option>
          <option value="PRACTICE_SET" ${originFilter === "PRACTICE_SET" ? "selected" : ""}>Practice Sets</option>
          <option value="AI_PRACTICE" ${originFilter === "AI_PRACTICE" ? "selected" : ""}>AI-Generated Practice</option>
        </select>
      </div>

      ${filtered.length === 0 ? `
        <div class="gv-card p-8 text-center space-y-2">
          <p class="text-sm font-extrabold text-[#14532D]">${bn ? "এই ফিল্টারে কোনো PYQ প্রশ্নপত্র পাওয়া যায়নি।" : "No PYQ papers match this filter yet."}</p>
          <p class="text-xs text-[#496052]">${bn ? "আমরা কখনোই ভুয়া বিগত বছরের প্রশ্ন তৈরি করি না। অ্যাডমিন প্যানেল থেকে যাচাইকৃত অফিশিয়াল PYQ আপলোড করা যাবে।" : "We never fabricate Previous Year Questions. Verified official papers & answer keys uploaded by Admins appear here immediately."}</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${filtered.map((p) => {
            const pOrigin = p.pyqOrigin || (p.contentOrigin === "AI_PRACTICE" ? "AI_PRACTICE" : "OFFICIAL_PYQ");
            const origMeta = PYQ_ORIGIN_META[pOrigin] || PYQ_ORIGIN_META.OFFICIAL_PYQ;
            const examMeta = EXAM_PREP_MAP[p.examCategory]?.en || "B.Sc / Competitive Exam";
            const paperUrl = safeUrl(p.resourceUrl);
            const answerUrl = safeUrl(p.answerKeyUrl);
            const srcUrl = safeUrl(p.sourceUrl);
            const isSaved = savedNoteIds.has(p.id);
            return `
              <article class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                    <span class="px-2 py-0.5 rounded-full border ${origMeta.badge}">${escapeHtml(bn ? origMeta.bn : origMeta.en)}</span>
                    <span class="px-2 py-0.5 rounded-full bg-[#EDF4EE] text-[#14532D]">${escapeHtml(examMeta)}</span>
                    ${p.examYear ? `<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-950">${escapeHtml(p.examYear)}</span>` : ""}
                    <button
                      type="button"
                      data-edu-bookmark-type="NOTE"
                      data-edu-bookmark-id="${escapeHtml(p.id)}"
                      data-edu-bookmark-title="${escapeHtml(p.title)}"
                      data-edu-bookmark-subject="${escapeHtml(p.subject)}"
                      data-edu-bookmark-sem="${escapeHtml(p.semester || 0)}"
                      class="ml-auto px-2 py-0.5 rounded-lg text-[11px] font-extrabold ${isSaved ? "bg-amber-400 text-[#0C3B20]" : "bg-slate-100 text-slate-700"}"
                    >${isSaved ? "★ Saved" : "☆ Save"}</button>
                  </div>
                  <h4 class="text-sm sm:text-base font-extrabold text-[#132219]">${escapeHtml(p.title)}</h4>
                  <div class="text-xs font-bold text-[#1E7E45]">${escapeHtml(p.subject)}${p.sourceName ? ` • ${escapeHtml(p.sourceName)}` : ""}</div>
                  ${p.summary ? `<p class="text-xs text-[#496052]">${escapeHtml(p.summary)}</p>` : ""}
                </div>
                <div class="flex flex-wrap gap-2 pt-2 border-t border-emerald-50">
                  ${paperUrl ? `
                    <button type="button" data-edu-preview-pdf="${escapeHtml(paperUrl)}" data-edu-preview-title="${escapeHtml(p.title)}" class="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
                      📄 ${bn ? "প্রশ্নপত্র দেখুন" : "View Question Paper"}
                    </button>
                  ` : `
                    <button type="button" data-read-material="${escapeHtml(p.id)}" class="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#EDF4EE] text-[#14532D] text-xs font-extrabold">
                      ${bn ? "বিস্তারিত পড়ুন" : "Read Paper Details"}
                    </button>
                  `}
                  ${answerUrl ? `
                    <button type="button" data-edu-preview-pdf="${escapeHtml(answerUrl)}" data-edu-preview-title="${escapeHtml(`${p.title} — Official Answer Key`)}" class="min-h-[38px] px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold">
                      ✓ ${bn ? "উত্তরপত্র (Answer Key)" : "View Answer Key"}
                    </button>
                  ` : ""}
                  ${paperUrl && p.downloadPermitted ? `
                    <a href="${escapeHtml(paperUrl)}" download target="_blank" rel="noopener noreferrer" class="min-h-[38px] inline-flex items-center px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#14532D] text-xs font-extrabold">⬇ PDF</a>
                  ` : ""}
                  ${srcUrl ? `
                    <a href="${escapeHtml(srcUrl)}" target="_blank" rel="noopener noreferrer" class="ml-auto min-h-[38px] inline-flex items-center px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#14532D] underline">Source ↗</a>
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

// ----------------------------------------------------------------------------
// 1. STUDY NOTES & PYQs SUB-VIEW
// ----------------------------------------------------------------------------
function renderMaterialsSubView(state, lang, allMaterials, savedNoteIds) {
  const bn = lang === "BN";
  const edu = state.edu || {};
  const filtered = filterStudyMaterials(allMaterials, {
    semester: state.studentSemester || 0,
    category: state.studentCategory || "ALL",
    subjectKey: edu.noteSubject || "ALL",
    topic: edu.noteTopic || "",
    examCategory: edu.noteExamTag || "ALL",
    search: state.studentSearch || "",
    viewMode: edu.noteViewMode || "ALL"
  }, savedNoteIds);

  const viewModes = [
    { key: "ALL", en: "All Notes", bn: "সব নোটস" },
    { key: "RECENT", en: "Recently Added", bn: "সাম্প্রতিক" },
    { key: "POPULAR", en: "Popular", bn: "জনপ্রিয়" },
    { key: "SAVED", en: `Saved Notes (${savedNoteIds.size})`, bn: `সংরক্ষিত (${savedNoteIds.size})` }
  ];

  return `
    <div class="space-y-4">
      <!-- Filter Card -->
      <div class="gv-card p-3.5 sm:p-4 space-y-3">
        <!-- Search & Subject/Topic/Exam Dropdowns -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <input id="studentSearchInput" type="search" value="${escapeHtml(state.studentSearch || "")}" placeholder="${bn ? "বিষয়, অধ্যায়, নোটস বা PYQ খুঁজুন..." : "Search subject, topic, Agronomy, Soil, PYQ..."}" class="px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white" />
          <select id="eduNoteSubject" class="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white">
            <option value="ALL">${bn ? "সব বিষয় (১৩টি)" : "All 13 Agriculture Subjects"}</option>
            ${AGRI_SUBJECTS.map((s) => `
              <option value="${escapeHtml(s.key)}" ${edu.noteSubject === s.key ? "selected" : ""}>${escapeHtml(bn ? s.bn : s.en)}</option>
            `).join("")}
          </select>
          <input id="eduNoteTopic" type="search" value="${escapeHtml(edu.noteTopic || "")}" placeholder="${bn ? "টপিক ফিল্টার (যেমন: Tillage, IPM)..." : "Filter by topic (e.g. Tillage, IPM, Seed)..."}" class="px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white" />
          <select id="eduNoteExamTag" class="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white">
            ${EXAM_PREP_CATEGORIES.map((ex) => `
              <option value="${escapeHtml(ex.key)}" ${edu.noteExamTag === ex.key ? "selected" : ""}>${escapeHtml(bn ? ex.bn : ex.en)}</option>
            `).join("")}
          </select>
        </div>

        <!-- Category Pills + View Mode Pills -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-50">
          <div class="flex flex-wrap gap-1.5">
            ${Object.entries(STUDY_CATEGORIES).map(([key, meta]) => `
              <button type="button" data-student-cat="${key}" class="px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-bold transition-colors ${
                state.studentCategory === key ? "bg-amber-400 text-[#0C3B20]" : "bg-slate-100 text-slate-700 hover:bg-emerald-50"
              }">${escapeHtml(bn ? meta.bn : meta.en)}</button>
            `).join("")}
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${viewModes.map((vm) => `
              <button type="button" data-edu-note-mode="${vm.key}" class="px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-extrabold transition-colors ${
                (edu.noteViewMode || "ALL") === vm.key
                  ? "bg-[#14532D] text-white"
                  : "bg-[#EDF4EE] text-[#14532D] hover:bg-[#D8F3DC]"
              }">${escapeHtml(bn ? vm.bn : vm.en)}</button>
            `).join("")}
          </div>
        </div>
      </div>

      ${!state.cloudConnected ? `
        <div class="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
          <span>${bn ? "অফিশিয়াল রেফারেন্স নোটস দেখানো হচ্ছে। লাইভ ক্লাউড আপলোড ও বুকমার্ক সিঙ্ক করতে সাইন ইন করুন।" : "Showing curated reference study notes. Sign in to sync live cloud uploads and private bookmarks."}</span>
          <button type="button" data-action="open-auth" class="px-3 py-1.5 rounded-lg bg-[#14532D] text-white font-bold">${bn ? "সাইন ইন" : "Sign In"}</button>
        </div>
      ` : ""}

      ${filtered.length === 0 ? `
        <div class="gv-card p-8 text-center space-y-2">
          <p class="text-base font-extrabold text-[#14532D]">${bn ? "কোনো নোট পাওয়া যায়নি" : "No matching study notes found"}</p>
          <p class="text-xs text-[#496052]">${bn ? "ফিল্টার পরিবর্তন করুন বা সব সেমিস্টার নির্বাচন করুন।" : "Try clearing your search or selecting All Semesters / All Subjects."}</p>
          <button type="button" data-edu-reset-notes="1" class="px-4 py-2 rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">
            ${bn ? "ফিল্টার রিসেট করুন" : "Reset Filters"}
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filtered.map((mat) => {
            const cat = STUDY_CATEGORIES[mat.category] || STUDY_CATEGORIES.NOTES_PDF;
            const pdfUrl = safeUrl(mat.resourceUrl);
            const srcUrl = safeUrl(mat.sourceUrl || mat.resourceUrl);
            const isPdfFile = Boolean(pdfUrl && (/\.pdf(\?|$)/i.test(pdfUrl) || pdfUrl.includes("firebasestorage.googleapis.com")));
            const isSaved = savedNoteIds.has(mat.id);
            const displayTitle = bn && mat.titleBn ? mat.titleBn : mat.title;
            const displaySummary = bn && mat.summaryBn ? mat.summaryBn : mat.summary;
            return `
              <article class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-3.5 hover:shadow-md transition-shadow">
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${cat.badge}">${escapeHtml(bn ? cat.bn : cat.en)}</span>
                    <span class="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-[#EDF4EE] text-[#14532D]">Sem ${escapeHtml(mat.semester)}</span>
                    ${mat.contentOrigin === "OFFICIAL_PUBLICATION" ? `<span class="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-100 text-emerald-950">Official Ref</span>` : ""}
                    <button
                      type="button"
                      data-edu-bookmark-type="NOTE"
                      data-edu-bookmark-id="${escapeHtml(mat.id)}"
                      data-edu-bookmark-title="${escapeHtml(mat.title)}"
                      data-edu-bookmark-subject="${escapeHtml(mat.subjectLabelEn || mat.subject)}"
                      data-edu-bookmark-sem="${escapeHtml(mat.semester || 0)}"
                      aria-label="${isSaved ? "Remove bookmark" : "Save note"}"
                      class="ml-auto px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors ${
                        isSaved ? "bg-amber-400 text-[#0C3B20]" : "bg-slate-100 hover:bg-amber-100 text-slate-700"
                      }"
                    >${isSaved ? "★ Saved" : "☆ Save"}</button>
                  </div>

                  <h3 class="text-sm sm:text-base font-extrabold text-[#132219] leading-snug">${escapeHtml(displayTitle)}</h3>
                  <div class="text-xs font-bold text-[#1E7E45]">
                    ${escapeHtml(bn ? (mat.subjectLabelBn || mat.subject) : (mat.subjectLabelEn || mat.subject))}
                    ${mat.topic ? ` • <span class="text-[#475569] font-semibold">${escapeHtml(mat.topic)}</span>` : ""}
                  </div>
                  <p class="text-xs sm:text-sm text-[#496052] leading-relaxed line-clamp-3">${escapeHtml(displaySummary)}</p>

                  <!-- Source, Reference & Last Updated Metadata -->
                  <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-[11px] text-[#475569] space-y-0.5">
                    <div>
                      <strong>${bn ? "উৎস:" : "Source:"}</strong>
                      ${srcUrl ? `<a href="${escapeHtml(srcUrl)}" target="_blank" rel="noopener noreferrer" class="underline text-[#14532D] font-semibold">${escapeHtml(mat.sourceName)}</a>` : escapeHtml(mat.sourceName)}
                    </div>
                    <div><strong>${bn ? "সর্বশেষ হালনাগাদ:" : "Last Updated:"}</strong> ${escapeHtml(mat.lastUpdatedDate || "—")}</div>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2 pt-2 border-t border-emerald-50">
                  <button type="button" data-read-material="${escapeHtml(mat.id)}" class="flex-1 min-h-[40px] py-2 px-3 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-extrabold transition-colors">
                    ${bn ? "নোট পড়ুন" : "Read Notes"}
                  </button>
                  ${isPdfFile ? `
                    <button type="button" data-edu-preview-pdf="${escapeHtml(pdfUrl)}" data-edu-preview-title="${escapeHtml(mat.title)}" class="min-h-[40px] py-2 px-3 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
                      ${bn ? "PDF দেখুন" : "View PDF"}
                    </button>
                    ${mat.downloadPermitted ? `
                      <a href="${escapeHtml(pdfUrl)}" download target="_blank" rel="noopener noreferrer" class="min-h-[40px] inline-flex items-center px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[#14532D] text-xs font-extrabold">
                        ⬇ PDF
                      </a>
                    ` : ""}
                  ` : (pdfUrl ? `
                    <a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener noreferrer" class="min-h-[40px] inline-flex items-center justify-center px-3 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
                      ${bn ? "অফিশিয়াল পোর্টাল ↗" : "Official Source ↗"}
                    </a>
                  ` : "")}
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
// 2. MCQ & QUESTION BANK SUB-VIEW (Practice, Mock Test, PYQ & Strict Labels)
// ----------------------------------------------------------------------------
function renderMcqBankSubView(state, lang, allQuizzes, savedMcqIds) {
  const bn = lang === "BN";
  const edu = state.edu || {};
  const publishedTests = (state.mockTests || []).filter((t) => t.published !== false);
  const activeTest = edu.activeMockTestId
    ? publishedTests.find((t) => t.id === edu.activeMockTestId) || null
    : null;

  const mode = activeTest
    ? (activeTest.testType === "MOCK_TEST" ? "MOCK_TEST" : "PRACTICE")
    : (edu.quizMode || "PRACTICE"); // PRACTICE | MOCK_TEST | PYQ_SET
  const effectiveTypeFilter = mode === "PYQ_SET" ? "OFFICIAL_PYQ" : (edu.quizType || "ALL");

  const quizzes = activeTest
    ? resolveMockTestQuestions(activeTest, allQuizzes)
    : filterQuizQuestions(allQuizzes, {
      semester: state.studentSemester || 0,
      subjectKey: edu.quizSubject || "ALL",
      examCategory: edu.quizExam || "ALL",
      questionType: effectiveTypeFilter,
      difficulty: edu.quizDifficulty || "ALL",
      search: edu.quizSearch || "",
      savedOnly: Boolean(edu.quizSavedOnly)
    }, savedMcqIds);

  const answers = state.quizAnswers || {};
  const submitted = Boolean(state.quizSubmitted);
  let score = 0;
  let attempted = 0;
  quizzes.forEach((q) => {
    if (answers[q.id] !== undefined) {
      attempted++;
      if (Number(answers[q.id]) === Number(q.correctIndex)) score++;
    }
  });

  const attempts = Array.isArray(state.quizAttempts) ? state.quizAttempts : [];
  const bestPct = attempts.length
    ? Math.max(...attempts.map((a) => Math.round(((Number(a.score) || 0) * 100) / Math.max(1, Number(a.totalQuestions) || 1))))
    : 0;

  return `
    <div class="space-y-4">
      ${activeTest ? `
        <div class="rounded-2xl border-2 border-[#14532D] bg-[#ECFDF5] p-4 flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-0.5">
            <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
              <span class="px-2 py-0.5 rounded-full bg-[#14532D] text-white">${activeTest.testType === "MOCK_TEST" ? "MOCK TEST ACTIVE" : "PRACTICE TEST ACTIVE"}</span>
              <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-950">${escapeHtml(activeTest.durationMinutes)} mins</span>
              <span class="px-2 py-0.5 rounded-full bg-white text-[#14532D]">${quizzes.length} Questions</span>
            </div>
            <div class="text-sm sm:text-base font-extrabold text-[#14532D]">${escapeHtml(activeTest.title)}</div>
            ${activeTest.description ? `<div class="text-xs text-[#496052]">${escapeHtml(activeTest.description)}</div>` : ""}
          </div>
          <button type="button" data-edu-exit-test="1" class="min-h-[38px] px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 text-xs font-extrabold">
            ✕ ${bn ? "টেস্ট থেকে বের হন" : "Exit Test"}
          </button>
        </div>
      ` : (publishedTests.length > 0 ? `
        <div class="gv-card p-4 space-y-3 bg-gradient-to-br from-[#F1F8F3] to-white">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="text-sm sm:text-base font-extrabold text-[#14532D]">${bn ? "অফিশিয়াল প্র্যাকটিস ও মক টেস্ট সিরিজ" : "Structured Practice Tests & Mock Tests"} (${publishedTests.length})</h3>
              <p class="text-[11px] text-[#496052]">${bn ? "অ্যাডমিন তৈরি সময়ভিত্তিক মক টেস্ট ও প্র্যাকটিস সেট শুরু করুন এবং ফলাফল সংরক্ষণ করুন।" : "Launch Admin-curated Mock Tests & Practice Sets and track your scores automatically."}</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            ${publishedTests.map((t) => {
              const qCount = resolveMockTestQuestions(t, allQuizzes).length;
              const examLbl = EXAM_PREP_MAP[t.examCategory]?.en || "All Exams";
              return `
                <div class="rounded-2xl border border-[#CDE0D3] bg-white p-3.5 flex flex-col justify-between gap-2.5">
                  <div class="space-y-1">
                    <div class="flex flex-wrap items-center gap-1 text-[10px] font-extrabold">
                      <span class="px-2 py-0.5 rounded-full ${t.testType === "MOCK_TEST" ? "bg-indigo-100 text-indigo-950" : "bg-sky-100 text-sky-950"}">${t.testType === "MOCK_TEST" ? "Mock Test" : "Practice Test"}</span>
                      <span class="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900">${escapeHtml(t.durationMinutes)} mins</span>
                      <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900">${qCount} Qs</span>
                    </div>
                    <div class="text-sm font-extrabold text-[#132219]">${escapeHtml(t.title)}</div>
                    <div class="text-[11px] text-[#496052]">${escapeHtml(examLbl)}${t.description ? ` • ${escapeHtml(t.description)}` : ""}</div>
                  </div>
                  <button type="button" data-edu-start-test="${escapeHtml(t.id)}" ${qCount === 0 ? "disabled" : ""} class="min-h-[38px] w-full py-2 rounded-xl ${qCount === 0 ? "bg-slate-200 text-slate-500" : "bg-[#14532D] hover:bg-[#0C3B20] text-white"} text-xs font-extrabold">
                    ${qCount === 0 ? "Questions Pending" : (bn ? "টেস্ট শুরু করুন →" : "Start Test →")}
                  </button>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      ` : "")}

      <!-- Exam Preparation Category Bar -->
      <div class="gv-card p-3.5 sm:p-4 space-y-3 ${activeTest ? "hidden" : ""}">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 class="text-sm sm:text-base font-extrabold text-[#14532D]">
              ${bn ? "কৃষি MCQ ও প্রশ্নব্যাংক (প্রতিযোগিতামূলক ও সেমিস্টার)" : "Agriculture MCQ & Competitive Question Bank"}
            </h3>
            <p class="text-[11px] text-[#496052]">
              ${bn
                ? "অফিশিয়াল PYQ, প্রকাশিত প্রশ্নপত্র, অনুশীলন ও AI-তৈরি প্রশ্ন স্পষ্টভাবে আলাদা লেবেলযুক্ত।"
                : "Official PYQs, Verified Published Papers, Practice Questions, and AI-Generated Practice Questions are strictly labeled and never mixed."}
            </p>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${[
              ["PRACTICE", bn ? "অনুশীলন (তাৎক্ষণিক ব্যাখ্যা)" : "Practice Mode"],
              ["MOCK_TEST", bn ? "মক টেস্ট (সাবমিট স্কোর)" : "Mock Test Mode"],
              ["PYQ_SET", bn ? "অফিশিয়াল PYQ" : "Official PYQs"]
            ].map(([mKey, mLabel]) => `
              <button type="button" data-edu-quiz-mode="${mKey}" class="px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-extrabold transition-colors ${
                mode === mKey ? "bg-[#14532D] text-white shadow-sm" : "bg-[#EDF4EE] text-[#14532D] hover:bg-[#D8F3DC]"
              }">${escapeHtml(mLabel)}</button>
            `).join("")}
          </div>
        </div>

        <!-- Exam Prep Pills -->
        <div class="flex flex-wrap gap-1.5">
          ${EXAM_PREP_CATEGORIES.map((ex) => `
            <button type="button" data-edu-quiz-exam="${escapeHtml(ex.key)}" class="px-3 py-1.5 min-h-[34px] rounded-xl text-xs font-bold transition-colors ${
              (edu.quizExam || "ALL") === ex.key
                ? "bg-amber-400 text-[#0C3B20]"
                : "bg-[#F8FAFC] border border-[#D9EAE0] text-[#14532D] hover:bg-[#ECFDF5]"
            }">${escapeHtml(bn ? ex.bn : ex.en)}</button>
          `).join("")}
        </div>

        <!-- Subject, Provenance, Difficulty, Search & Saved Toggle -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-emerald-50">
          <input id="eduQuizSearch" type="search" value="${escapeHtml(edu.quizSearch || "")}" placeholder="${bn ? "MCQ খুঁজুন..." : "Search MCQs..."}" class="px-3 py-2 min-h-[42px] rounded-xl border border-[#CDE0D3] text-xs sm:text-sm bg-white" />
          <select id="eduQuizSubject" class="px-3 py-2 min-h-[42px] rounded-xl border border-[#CDE0D3] text-xs sm:text-sm bg-white">
            <option value="ALL">${bn ? "সব বিষয় (১৩টি)" : "All Subjects"}</option>
            ${AGRI_SUBJECTS.map((s) => `
              <option value="${escapeHtml(s.key)}" ${edu.quizSubject === s.key ? "selected" : ""}>${escapeHtml(bn ? s.bn : s.en)}</option>
            `).join("")}
          </select>
          <select id="eduQuizType" ${mode === "PYQ_SET" ? "disabled" : ""} class="px-3 py-2 min-h-[42px] rounded-xl border border-[#CDE0D3] text-xs sm:text-sm bg-white">
            <option value="ALL">${bn ? "সব প্রশ্নের ধরন" : "All Question Sources"}</option>
            ${Object.values(QUESTION_PROVENANCE_META).map((pt) => `
              <option value="${pt.key}" ${effectiveTypeFilter === pt.key ? "selected" : ""}>${escapeHtml(bn ? pt.bn : pt.en)}</option>
            `).join("")}
          </select>
          <select id="eduQuizDifficulty" class="px-3 py-2 min-h-[42px] rounded-xl border border-[#CDE0D3] text-xs sm:text-sm bg-white">
            <option value="ALL">${bn ? "সব কঠিনতার স্তর" : "All Difficulty Levels"}</option>
            ${Object.values(DIFFICULTY_META).map((d) => `
              <option value="${d.key}" ${edu.quizDifficulty === d.key ? "selected" : ""}>${escapeHtml(bn ? d.bn : d.en)}</option>
            `).join("")}
          </select>
          <button type="button" data-edu-quiz-saved-toggle="1" class="min-h-[42px] px-3 py-2 rounded-xl text-xs font-extrabold border transition-colors ${
            edu.quizSavedOnly
              ? "bg-amber-400 border-amber-500 text-[#0C3B20]"
              : "bg-white border-[#CDE0D3] text-[#14532D] hover:bg-[#ECFDF5]"
          }">★ ${bn ? `সংরক্ষিত MCQ (${savedMcqIds.size})` : `Saved MCQs (${savedMcqIds.size})`}</button>
        </div>
      </div>

      <!-- Score Bar -->
      <div class="gv-card p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2 text-xs font-extrabold">
          <span class="px-3 py-1.5 rounded-xl bg-[#EDF4EE] text-[#14532D]">${quizzes.length} ${bn ? "টি প্রশ্ন" : "Questions"}</span>
          <span class="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-900">${bn ? "উত্তর দিয়েছেন:" : "Attempted:"} ${attempted}/${quizzes.length}</span>
          ${(submitted || (mode === "PRACTICE" && attempted > 0)) ? `
            <span class="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-950">
              ${bn ? "সঠিক:" : "Score:"} ${score}/${quizzes.length} (${quizzes.length ? Math.round((score * 100) / quizzes.length) : 0}%)
            </span>
          ` : ""}
          ${attempts.length ? `<span class="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900">${bn ? "সেরা স্কোর:" : "Best:"} ${bestPct}%</span>` : ""}
        </div>
        <div class="flex gap-2">
          ${!submitted && quizzes.length > 0 ? `
            <button type="button" data-action="submit-quiz" class="min-h-[40px] px-4 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
              ${bn ? "পরীক্ষা জমা দিন ও স্কোর সেভ করুন" : "Submit & Save Score"}
            </button>
          ` : ""}
          <button type="button" data-action="reset-quiz" class="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold text-[#14532D]">
            ${bn ? "পুনরায় শুরু" : "Reset"}
          </button>
        </div>
      </div>

      ${quizzes.length === 0 ? `
        <div class="gv-card p-8 text-center space-y-2">
          <p class="text-sm font-extrabold text-[#14532D]">
            ${mode === "PYQ_SET"
              ? (bn ? "এই ফিল্টারে এখনো কোনো অফিশিয়াল PYQ আপলোড করা হয়নি। অনুগ্রহ করে অ্যাডমিন প্যানেল থেকে যাচাইকৃত PYQ যোগ করুন অথবা 'Practice Mode' দেখুন।" : "No Official Previous Year Questions uploaded for this filter yet. We never mislabel practice or AI questions as Official PYQs — switch to Practice Mode or add verified PYQs in Admin Studio.")
              : (bn ? "এই ফিল্টারে কোনো MCQ পাওয়া যায়নি।" : "No MCQs match your current filters.")}
          </p>
          <button type="button" data-edu-reset-quiz-filters="1" class="px-4 py-2 rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">
            ${bn ? "সব প্রশ্ন দেখুন" : "Show All MCQs"}
          </button>
        </div>
      ` : `
        <div class="space-y-3.5">
          ${quizzes.map((q, idx) => {
            const chosen = answers[q.id];
            const showFeedback = submitted || (mode === "PRACTICE" && chosen !== undefined);
            const prov = QUESTION_PROVENANCE_META[q.questionType] || QUESTION_PROVENANCE_META.PRACTICE;
            const diff = DIFFICULTY_META[q.difficulty] || DIFFICULTY_META.MEDIUM;
            const examMeta = EXAM_PREP_MAP[q.examCategory] || EXAM_PREP_MAP.BSC_SEMESTER;
            const isSaved = savedMcqIds.has(q.id);
            const qText = bn && q.questionTextBn ? q.questionTextBn : q.questionText;
            const expText = bn && q.explanationBn ? q.explanationBn : q.explanation;

            return `
              <article data-mcq-card="${escapeHtml(q.id)}" data-mcq-type="${escapeHtml(prov.key)}" class="gv-card p-4 sm:p-5 space-y-3">
                <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                  <span class="px-2 py-0.5 rounded-md bg-[#EDF4EE] text-[#14532D]">Q${idx + 1} • Sem ${escapeHtml(q.semester)}</span>
                  <span class="px-2 py-0.5 rounded-full border ${prov.badgeClass}">${escapeHtml(bn ? prov.bn : prov.en)}</span>
                  <span class="px-2 py-0.5 rounded-full border ${diff.badgeClass}">${escapeHtml(bn ? diff.bn : diff.en)}</span>
                  <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">${escapeHtml(bn ? examMeta.bn : examMeta.en)}</span>
                  ${q.examYear ? `<span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900">${escapeHtml(q.examYear)}</span>` : ""}
                  <button
                    type="button"
                    data-edu-bookmark-type="MCQ"
                    data-edu-bookmark-id="${escapeHtml(q.id)}"
                    data-edu-bookmark-title="${escapeHtml(q.title || q.questionText.slice(0, 80))}"
                    data-edu-bookmark-subject="${escapeHtml(q.subject)}"
                    data-edu-bookmark-sem="${escapeHtml(q.semester || 0)}"
                    class="ml-auto px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${
                      isSaved ? "bg-amber-400 text-[#0C3B20]" : "bg-slate-100 hover:bg-amber-100 text-slate-700"
                    }"
                  >${isSaved ? "★ Saved" : "☆ Save"}</button>
                </div>

                <div class="text-xs font-bold text-[#1E7E45]">
                  ${escapeHtml(q.subject)}${q.topic ? ` • ${escapeHtml(q.topic)}` : ""}
                </div>
                <p class="text-sm sm:text-base font-bold text-[#132219] leading-snug">${escapeHtml(qText)}</p>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  ${(q.options || []).map((opt, oIdx) => {
                    const isSelected = chosen !== undefined && Number(chosen) === oIdx;
                    const isCorrect = Number(q.correctIndex) === oIdx;
                    let cls = "border-[#CDE0D3] bg-white hover:bg-[#F1F7F2] text-[#132219]";
                    if (showFeedback) {
                      if (isCorrect) cls = "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold";
                      else if (isSelected && !isCorrect) cls = "border-rose-400 bg-rose-50 text-rose-900";
                    } else if (isSelected) {
                      cls = "border-[#14532D] bg-[#D8F3DC] text-[#0A2E18] font-bold";
                    }
                    return `
                      <button type="button" data-quiz-q="${escapeHtml(q.id)}" data-quiz-opt="${oIdx}" ${submitted ? "disabled" : ""} class="text-left min-h-[44px] px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm transition-colors ${cls}">
                        <span class="font-extrabold mr-1.5">${["A", "B", "C", "D"][oIdx]}.</span> ${escapeHtml(opt)}
                      </button>
                    `;
                  }).join("")}
                </div>

                ${showFeedback ? `
                  <div class="rounded-xl bg-[#EDF4EE] border border-[#CDE0D3] px-3.5 py-2.5 text-xs text-[#0A2E18] space-y-1">
                    <div>
                      <strong>${bn ? "সঠিক উত্তর:" : "Correct Answer:"}</strong>
                      ${["A", "B", "C", "D"][Number(q.correctIndex) || 0]}. ${escapeHtml((q.options || [])[Number(q.correctIndex) || 0] || "")}
                    </div>
                    ${expText ? `<div><strong>${bn ? "ব্যাখ্যা:" : "Explanation:"}</strong> ${escapeHtml(expText)}</div>` : ""}
                    ${q.sourcePaper ? `<div class="text-[11px] text-[#496052]"><strong>${bn ? "উৎস:" : "Source:"}</strong> ${escapeHtml(q.sourcePaper)}</div>` : ""}
                  </div>
                ` : ""}
              </article>
            `;
          }).join("")}
        </div>
      `}

      <!-- Attempt History -->
      ${attempts.length > 0 ? `
        <div class="gv-card p-4 sm:p-5 space-y-2.5">
          <h4 class="text-sm font-extrabold text-[#14532D]">${bn ? "আপনার বিগত পরীক্ষার ফলাফল" : "Your Past Exam & Mock Test Attempts"} (${attempts.length})</h4>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            ${attempts.slice(0, 9).map((a) => {
              const pct = Math.round(((Number(a.score) || 0) * 100) / Math.max(1, Number(a.totalQuestions) || 1));
              return `
                <div class="rounded-xl bg-[#F1F7F2] border border-[#CDE0D3] p-3 text-xs space-y-0.5">
                  <div class="font-extrabold text-[#14532D]">
                    Sem ${escapeHtml(a.semester)} — ${escapeHtml(a.score)}/${escapeHtml(a.totalQuestions)} (${pct}%)
                  </div>
                  <div class="text-[11px] text-[#496052]">
                    ${escapeHtml(a.mode || "PRACTICE")}${a.examCategory && a.examCategory !== "ALL" ? ` • ${escapeHtml(a.examCategory)}` : ""} • ${escapeHtml(formatDateShort(a.createdAtMs))}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      ` : ""}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 3. UNIVERSITY & ICAR SYLLABUS SUB-VIEW (Preserves Official Syllabi!)
// ----------------------------------------------------------------------------
function renderSyllabusSubView(state, lang, allSyllabi, savedSyllabusIds) {
  const bn = lang === "BN";
  const edu = state.edu || {};
  const universities = Array.from(new Set(allSyllabi.map((s) => s.universityShort).filter(Boolean)));
  const filtered = filterSyllabi(allSyllabi, {
    university: edu.syllabusUniversity || "ALL",
    semester: state.studentSemester || 0,
    subjectKey: edu.syllabusSubject || "ALL",
    search: edu.syllabusSearch || ""
  });

  return `
    <div class="space-y-4">
      <div class="rounded-2xl border border-emerald-200 bg-[#ECFDF5] p-4 text-xs text-[#1E293B] leading-relaxed">
        <strong class="text-[#14532D]">${bn ? "অফিশিয়াল সিলেবাস সংরক্ষণ নীতি:" : "Official University Syllabus Policy:"}</strong>
        ${bn
          ? "প্রতিটি বিশ্ববিদ্যালয়ের (BCKV, UBKV, বিশ্বভারতী, TNAU, PAU ইত্যাদি) নিজস্ব সরকারি সিলেবাস আলাদাভাবে দেখানো হয় এবং কখনোই সাধারণ সিলেবাস দিয়ে প্রতিস্থাপন করা হয় না। ICAR ৫ম ডিনস কমিটির ৮-সেমিস্টারের সিলেবাস সম্পূর্ণ সংরক্ষিত আছে।"
          : "ICAR 5th Deans' Committee's complete 8-semester syllabus is preserved alongside university-specific curriculum records (BCKV, UBKV, Visva-Bharati, TNAU, PAU, and Admin uploads). We never replace a university's official syllabus with a generic syllabus."}
      </div>

      <!-- Syllabus Filters -->
      <div class="gv-card p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <select id="eduSyllabusUniversity" class="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white">
          <option value="ALL">${bn ? `সব বিশ্ববিদ্যালয় (${universities.length})` : `All Universities & ICAR (${universities.length})`}</option>
          ${universities.map((u) => `
            <option value="${escapeHtml(u)}" ${edu.syllabusUniversity === u ? "selected" : ""}>${escapeHtml(u)}</option>
          `).join("")}
        </select>
        <select id="eduSyllabusSubject" class="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white">
          <option value="ALL">${bn ? "সব বিষয়" : "All Subjects"}</option>
          ${AGRI_SUBJECTS.map((s) => `
            <option value="${escapeHtml(s.key)}" ${edu.syllabusSubject === s.key ? "selected" : ""}>${escapeHtml(bn ? s.bn : s.en)}</option>
          `).join("")}
        </select>
        <input id="eduSyllabusSearch" type="search" value="${escapeHtml(edu.syllabusSearch || "")}" placeholder="${bn ? "বিশ্ববিদ্যালয়, বিষয় বা টপিক খুঁজুন..." : "Search university, course, subject, topic..."}" class="px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#CDE0D3] text-sm bg-white" />
      </div>

      ${filtered.length === 0 ? `
        <div class="gv-card p-8 text-center text-sm text-[#496052]">
          ${bn ? "এই ফিল্টারে কোনো সিলেবাস পাওয়া যায়নি।" : "No syllabus records match this filter. Try selecting All Universities or All Semesters."}
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${filtered.map((syl) => {
            const srcHref = safeUrl(syl.sourceUrl);
            const pdfHref = safeUrl(syl.pdfUrl);
            const isSaved = savedSyllabusIds.has(syl.id);
            return `
              <article class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div class="space-y-2.5">
                  <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                    <span class="px-2.5 py-0.5 rounded-full bg-[#14532D] text-white">${escapeHtml(syl.universityShort)}</span>
                    <span class="px-2 py-0.5 rounded-full bg-[#EDF4EE] text-[#14532D]">Sem ${escapeHtml(syl.semester)}</span>
                    ${syl.academicSession ? `<span class="px-2 py-0.5 rounded-full bg-sky-100 text-sky-900">Session ${escapeHtml(syl.academicSession)}</span>` : ""}
                    <span class="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">${escapeHtml(syl.publicationYear || "—")}</span>
                    <button
                      type="button"
                      data-edu-bookmark-type="SYLLABUS"
                      data-edu-bookmark-id="${escapeHtml(syl.id)}"
                      data-edu-bookmark-title="${escapeHtml(`${syl.universityShort} — Sem ${syl.semester} ${syl.subject}`)}"
                      data-edu-bookmark-subject="${escapeHtml(syl.subject)}"
                      data-edu-bookmark-sem="${escapeHtml(syl.semester || 0)}"
                      class="ml-auto px-2 py-0.5 rounded-lg text-[11px] font-extrabold ${
                        isSaved ? "bg-amber-400 text-[#0C3B20]" : "bg-slate-100 text-slate-700"
                      }"
                    >${isSaved ? "★ Saved" : "☆ Save"}</button>
                  </div>
                  <div>
                    <h4 class="text-sm sm:text-base font-extrabold text-[#132219]">${escapeHtml(syl.university)}</h4>
                    <div class="text-xs font-bold text-[#1E7E45]">${escapeHtml(syl.course)} • ${escapeHtml(syl.subject)}</div>
                  </div>
                  <ul class="space-y-1.5 text-xs sm:text-sm text-[#1E293B]">
                    ${(syl.topics || []).map((t, idx) => `
                      <li class="flex items-start gap-2">
                        <span class="w-5 h-5 rounded-md bg-[#EDF4EE] text-[#14532D] text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">${idx + 1}</span>
                        <span>${escapeHtml(t)}</span>
                      </li>
                    `).join("")}
                  </ul>
                </div>

                <div class="flex flex-wrap items-center gap-2 pt-2.5 border-t border-emerald-50">
                  <button type="button" data-student-jump-sem="${escapeHtml(syl.semester)}" class="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-extrabold">
                    ${bn ? "এই সেমিস্টারের নোটস →" : "View Sem Notes →"}
                  </button>
                  ${pdfHref ? `
                    <button type="button" data-edu-preview-pdf="${escapeHtml(pdfHref)}" data-edu-preview-title="${escapeHtml(`${syl.universityShort} — ${syl.subject} Syllabus`)}" class="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
                      📄 ${bn ? "PDF দেখুন" : "View PDF"}
                    </button>
                  ` : ""}
                  ${pdfHref && syl.downloadPermitted ? `
                    <a href="${escapeHtml(pdfHref)}" download target="_blank" rel="noopener noreferrer" class="min-h-[38px] inline-flex items-center px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#14532D] text-xs font-extrabold">
                      ⬇ PDF
                    </a>
                  ` : ""}
                  ${srcHref ? `
                    <a href="${escapeHtml(srcHref)}" target="_blank" rel="noopener noreferrer" class="ml-auto min-h-[38px] inline-flex items-center px-3 py-1.5 rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold">
                      ${bn ? "অফিশিয়াল উৎস ↗" : "Official Source ↗"}
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

// ----------------------------------------------------------------------------
// 4. AGRICULTURAL LEARNING RESOURCES (7 CATEGORIES) + SOURCE TRANSPARENCY
// ----------------------------------------------------------------------------
function renderDiscoveredResourcesSubView(state, lang, savedResourceIds) {
  const bn = lang === "BN";
  const edu = state.edu || {};
  const catFilter = edu.resCategory || "ALL";
  const subjFilter = edu.resSubject || "ALL";
  const q = String(edu.resSearch || "").trim().toLowerCase();

  const approved = (state.discoveredStudyResources || []).filter((r) => r.reviewStatus === "APPROVED_PUBLISHED");
  const filtered = approved.filter((r) => {
    if (catFilter !== "ALL" && r.category !== catFilter) return false;
    if (subjFilter !== "ALL" && r.subjectKey !== subjFilter) return false;
    if (q) {
      const hay = `${r.title || ""} ${r.sourceWebsite || ""} ${r.topic || ""} ${r.summary || ""} ${r.category || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return `
    <div class="space-y-5">
      <div class="gv-card p-4 sm:p-5 space-y-3">
        <div>
          <h3 class="text-base font-extrabold text-[#14532D]">
            ${bn ? "কৃষি শিক্ষামূলক রিসোর্স ও অফিশিয়াল প্রকাশনা" : "Agricultural Learning Resources & Official Publications"} (${filtered.length} / ${approved.length})
          </h3>
          <p class="text-xs text-[#496052]">
            ${bn
              ? "ICAR রিসোর্স, বিশ্ববিদ্যালয়ের মেটেরিয়াল, গবেষণাপত্র, সরকারি প্রকাশনা, YouTube প্লেলিস্ট, রেফারেন্স বই এবং অফিশিয়াল নোটিশ।"
              : "Admin-verified ICAR resources, university materials, research papers, government publications, educational YouTube playlists, books & official notifications."}
          </p>
        </div>

        <!-- Category Filter Pills (All 7 Official Categories) -->
        <div class="flex flex-wrap gap-1.5">
          <button type="button" data-edu-res-cat="ALL" class="px-3 py-1.5 min-h-[34px] rounded-xl text-xs font-extrabold transition-colors ${catFilter === "ALL" ? "bg-[#14532D] text-white" : "bg-[#EDF4EE] text-[#14532D]"}">
            ${bn ? "সব ক্যাটাগরি" : "All 7 Categories"}
          </button>
          ${LEARNING_RESOURCE_CATEGORIES.map((c) => `
            <button type="button" data-edu-res-cat="${escapeHtml(c.key)}" class="px-3 py-1.5 min-h-[34px] rounded-xl text-xs font-bold transition-colors ${catFilter === c.key ? "bg-amber-400 text-[#0C3B20]" : "bg-[#F8FAFC] border border-[#D9EAE0] text-[#14532D] hover:bg-[#ECFDF5]"}">
              ${escapeHtml(bn ? c.bn : c.en)}
            </button>
          `).join("")}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <input id="eduResSearch" type="search" value="${escapeHtml(edu.resSearch || "")}" placeholder="${bn ? "রিসোর্স, ICAR, বই বা নোটিশ খুঁজুন..." : "Search resources, ICAR, books, playlists, notices..."}" class="px-3.5 py-2.5 min-h-[42px] rounded-xl border border-[#CDE0D3] text-sm bg-white" />
          <select id="eduResSubject" class="px-3 py-2.5 min-h-[42px] rounded-xl border border-[#CDE0D3] text-sm bg-white">
            <option value="ALL">${bn ? "সব বিষয় (১৩টি)" : "All 13 Subjects"}</option>
            ${AGRI_SUBJECTS.map((s) => `<option value="${escapeHtml(s.key)}" ${subjFilter === s.key ? "selected" : ""}>${escapeHtml(bn ? s.bn : s.en)}</option>`).join("")}
          </select>
        </div>

        ${filtered.length === 0 ? `
          <div class="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-5 text-xs text-[#475569]">
            ${bn
              ? "এই ফিল্টারে এখনো কোনো প্রকাশিত রিসোর্স নেই। নিচের অফিশিয়াল পোর্টালগুলো থেকে সরাসরি পড়ুন।"
              : "No published learning resources match this filter yet. Explore the verified official portals below or publish curated items via Admin Education CMS."}
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            ${filtered.map((r) => {
              const href = safeUrl(r.sourceUrl);
              const subj = AGRI_SUBJECT_MAP[r.subjectKey] || AGRI_SUBJECT_MAP.OTHER;
              const catMeta = LEARNING_RESOURCE_CATEGORY_MAP[r.category] || LEARNING_RESOURCE_CATEGORY_MAP.ICAR_RESOURCE;
              const isSaved = savedResourceIds.has(r.id);
              return `
                <article class="rounded-2xl border border-[#CDE0D3] bg-[#F7F9F5] p-4 flex flex-col justify-between gap-2.5">
                  <div class="space-y-1.5">
                    <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                      <span class="px-2 py-0.5 rounded-full ${catMeta.badge}">${escapeHtml(bn ? catMeta.bn : catMeta.en)}</span>
                      <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[#14532D]">${escapeHtml(bn ? subj.bn : subj.en)}</span>
                      ${r.language ? `<span class="px-2 py-0.5 rounded-full bg-purple-50 text-purple-900">${escapeHtml(EDU_LANGUAGE_MAP[r.language]?.label || r.language)}</span>` : ""}
                      <button
                        type="button"
                        data-edu-bookmark-type="RESOURCE"
                        data-edu-bookmark-id="${escapeHtml(r.id)}"
                        data-edu-bookmark-title="${escapeHtml(r.title)}"
                        data-edu-bookmark-subject="${escapeHtml(subj.en)}"
                        data-edu-bookmark-sem="0"
                        class="ml-auto px-2 py-0.5 rounded-lg text-[11px] font-extrabold ${isSaved ? "bg-amber-400 text-[#0C3B20]" : "bg-white border border-[#CDE0D3] text-slate-700"}"
                      >${isSaved ? "★ Saved" : "☆ Save"}</button>
                    </div>
                    <h4 class="text-sm font-extrabold text-[#132219]">${escapeHtml(r.title)}</h4>
                    <div class="text-[11px] font-bold text-[#1E7E45]">${escapeHtml(r.sourceWebsite)} • ${escapeHtml(r.topic)} • ${escapeHtml(r.publicationDate || "")}</div>
                    ${r.summary ? `<p class="text-xs text-[#475569]">${escapeHtml(r.summary)}</p>` : ""}
                  </div>
                  ${href ? `
                    <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="min-h-[38px] inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
                      ${bn ? "অফিশিয়াল রিসোর্স খুলুন ↗" : "Open Official Resource ↗"}
                    </a>
                  ` : ""}
                </article>
              `;
            }).join("")}
          </div>
        `}
      </div>

      <!-- Honest Automatic vs Admin-Managed Source Directory -->
      <div class="gv-card p-4 sm:p-5 space-y-3">
        <h3 class="text-sm sm:text-base font-extrabold text-[#14532D]">
          ${bn ? "অফিশিয়াল কৃষি শিক্ষা উৎসের তালিকা (স্বয়ংক্রিয় বনাম অ্যাডমিন আপডেট)" : "Official Agriculture Education Sources (Automatic Feeds vs. Admin-Managed)"}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${EDUCATION_SOURCE_CAPABILITIES.map((src) => {
            const href = safeUrl(src.url);
            return `
              <div class="rounded-2xl border border-[#CDE0D3] p-3.5 bg-white flex flex-col justify-between gap-2">
                <div class="space-y-1">
                  <div class="flex items-center justify-between gap-2">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      src.autoSupported ? "bg-emerald-100 text-emerald-950" : "bg-amber-100 text-amber-950"
                    }">
                      ${src.autoSupported ? "Automatic Feed Supported" : "Admin-Managed Updates"}
                    </span>
                  </div>
                  <div class="text-xs sm:text-sm font-extrabold text-[#132219]">${escapeHtml(src.name)}</div>
                  <div class="text-[11px] text-[#496052]">${escapeHtml(src.method)}</div>
                </div>
                ${href ? `
                  <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-xs font-extrabold text-[#14532D] underline">
                    ${escapeHtml(src.url)} ↗
                  </a>
                ` : ""}
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 5. SAVED & CONTINUE LEARNING DESK SUB-VIEW
// ----------------------------------------------------------------------------
function renderSavedDeskSubView(state, lang, allMaterials, allQuizzes, allSyllabi, bookmarks) {
  const bn = lang === "BN";
  const savedNotes = allMaterials.filter((m) => bookmarks.notes.has(m.id));
  const savedVideos = allMaterials.filter((m) => m.category === "VIDEO_LECTURE" && bookmarks.videos.has(m.id));
  const savedMcqs = allQuizzes.filter((q) => bookmarks.mcqs.has(q.id));
  const savedSyllabi = allSyllabi.filter((s) => bookmarks.syllabi.has(s.id));
  const savedResources = (state.discoveredStudyResources || []).filter((r) => bookmarks.resources.has(r.id));

  return `
    <div class="space-y-4">
      ${!state.user ? `
        <div class="rounded-2xl bg-sky-50 border border-sky-200 p-4 text-xs text-sky-950 flex flex-wrap items-center justify-between gap-2">
          <span>${bn ? "আপনার সংরক্ষিত নোটস ও MCQ এই ডিভাইসে আছে। সব ডিভাইসে নিরাপদে সিঙ্ক করতে Google দিয়ে সাইন ইন করুন।" : "Bookmarks are saved locally on this device. Sign in with Google to sync your saved notes, videos, MCQs, and progress privately across devices."}</span>
          <button type="button" data-action="open-auth" class="px-3.5 py-2 rounded-xl bg-[#14532D] text-white font-extrabold">${bn ? "সাইন ইন" : "Sign In"}</button>
        </div>
      ` : ""}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Saved Notes -->
        <div class="gv-card p-4 space-y-2.5">
          <h3 class="text-sm font-extrabold text-[#14532D]">★ ${bn ? "সংরক্ষিত নোটস ও PYQ" : "Saved Notes & PYQs"} (${savedNotes.length})</h3>
          ${savedNotes.length === 0 ? `<p class="text-xs text-[#64748B]">${bn ? "এখনো কোনো নোট সংরক্ষণ করেননি।" : "No saved notes yet."}</p>` : savedNotes.map((m) => `
            <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 flex items-center justify-between gap-2">
              <div class="min-w-0">
                <div class="text-xs font-extrabold text-[#132219] truncate">${escapeHtml(m.title)}</div>
                <div class="text-[11px] text-[#496052]">Sem ${escapeHtml(m.semester)} • ${escapeHtml(m.subjectLabelEn || m.subject)}</div>
              </div>
              <button type="button" data-read-material="${escapeHtml(m.id)}" class="px-2.5 py-1.5 rounded-lg bg-[#14532D] text-white text-[11px] font-bold shrink-0">${bn ? "পড়ুন" : "Read"}</button>
            </div>
          `).join("")}
        </div>

        <!-- Saved MCQs -->
        <div class="gv-card p-4 space-y-2.5">
          <h3 class="text-sm font-extrabold text-[#14532D]">★ ${bn ? "সংরক্ষিত MCQ" : "Saved MCQs"} (${savedMcqs.length})</h3>
          ${savedMcqs.length === 0 ? `<p class="text-xs text-[#64748B]">${bn ? "এখনো কোনো MCQ সংরক্ষণ করেননি।" : "No saved MCQs yet."}</p>` : savedMcqs.map((q) => `
            <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 space-y-1">
              <div class="text-xs font-bold text-[#132219]">${escapeHtml(q.questionText)}</div>
              <div class="text-[11px] text-[#15803D] font-bold">${escapeHtml(q.subject)} • ${escapeHtml(QUESTION_PROVENANCE_META[q.questionType]?.en || "Practice")}</div>
            </div>
          `).join("")}
          ${savedMcqs.length > 0 ? `
            <button type="button" data-edu-open-saved-mcqs="1" class="w-full py-2 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">
              ${bn ? "সংরক্ষিত MCQ অনুশীলন করুন →" : "Practice Saved MCQs →"}
            </button>
          ` : ""}
        </div>

        <!-- Saved Videos, Syllabi & Resources -->
        <div class="gv-card p-4 space-y-3">
          <div class="space-y-2">
            <h3 class="text-sm font-extrabold text-[#14532D]">★ ${bn ? "সংরক্ষিত ভিডিও" : "Saved Videos"} (${savedVideos.length})</h3>
            ${savedVideos.length === 0 ? `<p class="text-xs text-[#64748B]">${bn ? "কোনো ভিডিও সংরক্ষিত নেই।" : "No saved videos yet."}</p>` : savedVideos.map((v) => `
              <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 flex items-center justify-between gap-2 text-xs">
                <span class="font-bold text-[#132219] truncate">${escapeHtml(v.title)}</span>
                <button type="button" data-edu-play-video="${escapeHtml(v.youtubeUrl || v.resourceUrl || "")}" data-edu-play-title="${escapeHtml(v.title)}" class="px-2.5 py-1 rounded-lg bg-[#14532D] text-white text-[11px] font-bold shrink-0">▶</button>
              </div>
            `).join("")}
          </div>

          <div class="space-y-2 pt-2 border-t border-emerald-50">
            <h3 class="text-sm font-extrabold text-[#14532D]">★ ${bn ? "সংরক্ষিত সিলেবাস ও রিসোর্স" : "Saved Syllabi & Resources"} (${savedSyllabi.length + savedResources.length})</h3>
            ${savedSyllabi.length === 0 && savedResources.length === 0 ? `<p class="text-xs text-[#64748B]">${bn ? "কোনো সিলেবাস বা রিসোর্স সংরক্ষিত নেই।" : "No saved syllabi or resources yet."}</p>` : `
              ${savedSyllabi.map((s) => `
                <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-xs">
                  <div class="font-extrabold text-[#14532D]">${escapeHtml(s.universityShort)} • Sem ${escapeHtml(s.semester)}</div>
                  <div class="text-[#475569]">${escapeHtml(s.subject)}</div>
                </div>
              `).join("")}
              ${savedResources.map((r) => {
                const href = safeUrl(r.sourceUrl);
                return `
                  <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 text-xs flex items-center justify-between gap-2">
                    <span class="font-bold text-[#132219] truncate">${escapeHtml(r.title)}</span>
                    ${href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-[#14532D] font-extrabold shrink-0">↗</a>` : ""}
                  </div>
                `;
              }).join("")}
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// MAIN EXPORT: UPGRADED STUDENT ACADEMIC PORTAL VIEW
// ----------------------------------------------------------------------------
export function renderAgriEducationView(state) {
  const lang = resolveEduLang(state);
  const bn = lang === "BN";
  const sub = state.studentSubTab || "materials";

  const allMaterials = mergeStudyMaterials(state.studyMaterials || [], false);
  const videosCount = allMaterials.filter((m) => m.category === "VIDEO_LECTURE").length;
  const pyqsCount = allMaterials.filter((m) => m.category === "PYQ").length;
  const allQuizzes = mergeQuizQuestions(state.quizzes || [], false);
  const allSyllabi = mergeSyllabi(state.universitySyllabi || [], false);
  const approvedResourcesCount = (state.discoveredStudyResources || []).filter((r) => r.reviewStatus === "APPROVED_PUBLISHED").length;
  const bookmarks = getBookmarkSets(state);
  const totalSaved = bookmarks.notes.size + bookmarks.mcqs.size + bookmarks.syllabi.size + bookmarks.videos.size + bookmarks.resources.size;

  const tabs = [
    ["materials", bn ? `নোটস (${allMaterials.length})` : `Notes (${allMaterials.length})`],
    ["videos", bn ? `ভিডিও (${videosCount})` : `Videos (${videosCount})`],
    ["quiz", bn ? `MCQ ও মক টেস্ট (${allQuizzes.length})` : `MCQs & Tests (${allQuizzes.length})`],
    ["pyq", bn ? `PYQ পেপার (${pyqsCount})` : `PYQ Papers (${pyqsCount})`],
    ["syllabus", bn ? `সিলেবাস (${allSyllabi.length})` : `Syllabus (${allSyllabi.length})`],
    ["resources", bn ? `রিসোর্স (${approvedResourcesCount})` : `Resources (${approvedResourcesCount})`],
    ["saved", bn ? `সংরক্ষিত (${totalSaved})` : `Saved (${totalSaved})`]
  ];

  return `
    <div data-module="agri-education-hub" class="space-y-4">
      <!-- Header + Bilingual Toggle -->
      <div class="gv-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="font-display text-xl sm:text-2xl font-bold text-[#14532D]">
            ${bn ? "কৃষি শিক্ষা কেন্দ্র — নোটস, ভিডিও, MCQ, PYQ ও সিলেবাস" : "Agriculture Education Hub — Notes, Videos, MCQs, PYQs & Syllabus"}
          </h2>
          <p class="text-xs sm:text-sm text-[#496052]">
            ${bn
              ? "B.Sc. Agriculture সেমিস্টার ১–৮, ICAR JRF, CUET-PG, IBPS AFO, NABARD ও State AO পরীক্ষার সম্পূর্ণ প্রস্তুতি"
              : "13 Subjects • Semesters 1–8 • Videos • Mock Tests • Official PYQs • University Syllabi"}
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          ${state.isAdmin ? `
            <button type="button" data-nav="admin" data-open-admin-sub="edu-cms" class="px-3 py-1.5 min-h-[36px] rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0C3B20] text-xs font-extrabold">
              Manage CMS ↗
            </button>
          ` : ""}
          <div class="inline-flex items-center gap-1 bg-[#EDF4EE] p-1 rounded-xl">
            <button type="button" data-edu-lang="EN" class="px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-extrabold ${
              lang === "EN" ? "bg-[#14532D] text-white" : "text-[#14532D]"
            }">English</button>
            <button type="button" data-edu-lang="BN" class="px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-extrabold ${
              lang === "BN" ? "bg-[#14532D] text-white" : "text-[#14532D]"
            }">বাংলা</button>
          </div>
        </div>
      </div>

      <!-- Continue Learning Banner -->
      ${renderContinueLearningBar(bookmarks.progress, bn)}

      <!-- Primary Education Tabs -->
      <nav class="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-[#EDF4EE] p-1.5 rounded-2xl border border-[#D9EAE0]" aria-label="Agriculture Education Navigation">
        ${tabs.map(([key, label]) => `
          <button type="button" data-student-sub="${key}" class="shrink-0 min-h-[42px] px-4 py-2 rounded-xl text-xs font-extrabold transition-colors ${
            sub === key ? "bg-[#14532D] text-white shadow-sm" : "text-[#14532D] hover:bg-white/70"
          }">${escapeHtml(label)}</button>
        `).join("")}
      </nav>

      <!-- Shared Semester Filter Bar (Notes, Videos, MCQ & Syllabus) -->
      ${(sub === "materials" || sub === "videos" || sub === "quiz" || sub === "syllabus") ? `
        <div class="gv-card p-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((sem) => `
            <button type="button" data-student-sem="${sem}" class="shrink-0 min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              state.studentSemester === sem ? "bg-[#14532D] text-white" : "bg-[#EDF4EE] text-[#14532D] hover:bg-[#D8F3DC]"
            }">${sem === 0 ? (bn ? "সব সেমিস্টার" : "All Semesters") : `Sem ${sem}`}</button>
          `).join("")}
        </div>
      ` : ""}

      <!-- Active Sub-View -->
      ${sub === "materials" ? renderMaterialsSubView(state, lang, allMaterials, bookmarks.notes) : ""}
      ${sub === "videos" ? renderVideoLearningSubView(state, lang, allMaterials, bookmarks.videos) : ""}
      ${sub === "quiz" ? renderMcqBankSubView(state, lang, allQuizzes, bookmarks.mcqs) : ""}
      ${sub === "pyq" ? renderPyqPapersSubView(state, lang, allMaterials, bookmarks.notes) : ""}
      ${sub === "syllabus" ? renderSyllabusSubView(state, lang, allSyllabi, bookmarks.syllabi) : ""}
      ${sub === "resources" ? renderDiscoveredResourcesSubView(state, lang, bookmarks.resources) : ""}
      ${sub === "saved" ? renderSavedDeskSubView(state, lang, allMaterials, allQuizzes, allSyllabi, bookmarks) : ""}

      <!-- Inline PDF Viewer Modal -->
      ${renderInlinePdfModal(state.edu, bn)}

      <!-- Inline Safe YouTube Video Modal -->
      ${renderInlineVideoModal(state.edu, bn)}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// ADMIN SUB-VIEW: SYLLABUS MANAGEMENT & AUTOMATIC RESOURCE DISCOVERY STUDIO
// ----------------------------------------------------------------------------
export function renderAdminSyllabusDiscoveryTab(state) {
  const cloudSyllabi = state.universitySyllabi || [];
  const discovered = state.discoveredStudyResources || [];
  const liveCandidates = state.edu?.liveDiscoveryCandidates || [];
  const discoveryLoading = Boolean(state.edu?.discoveryLoading);
  const discoveryStatus = state.edu?.discoveryStatus || "";

  return `
    <div class="space-y-5">
      <!-- Automatic Resource Discovery Engine (Allowlisted Feeds + Admin Review) -->
      <div class="gv-card p-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-extrabold text-[#14532D]">Automatic Study Resource Discovery &amp; Review Queue</h3>
            <p class="text-xs text-[#496052]">
              Queries ONLY permitted public RSS/Open-Access APIs (PIB Agriculture RSS, FAO RSS, OpenAlex Open-Access API). Checks duplicates automatically and requires Admin approval before publishing.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <input id="adminDiscoveryQuery" type="text" placeholder="Optional topic (e.g. Soil, Rice, JRF)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs bg-white" />
            <button type="button" data-admin-run-discovery="1" ${discoveryLoading ? "disabled" : ""} class="px-4 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
              ${discoveryLoading ? "Scanning Official Feeds..." : "🔄 Run Automatic Discovery"}
            </button>
          </div>
        </div>

        ${discoveryStatus ? `
          <div class="rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] px-3.5 py-2 text-xs font-bold text-[#14532D]">${escapeHtml(discoveryStatus)}</div>
        ` : ""}

        ${liveCandidates.length > 0 ? `
          <div class="space-y-2 pt-2">
            <h4 class="text-xs font-extrabold uppercase tracking-wider text-[#15803D]">Live Discovered Candidates (${liveCandidates.length}) — Review &amp; Approve</h4>
            <div class="space-y-2 max-h-[340px] overflow-y-auto">
              ${liveCandidates.map((c, idx) => {
                const href = safeUrl(c.sourceUrl);
                return `
                  <div class="rounded-2xl border ${c.isDuplicate ? "border-amber-200 bg-amber-50/40" : "border-[#CDE0D3] bg-[#F7F9F5]"} p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div class="min-w-0 space-y-0.5">
                      <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                        <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[#14532D]">${escapeHtml(c.discoveryMethod)} • ${escapeHtml(c.subjectKey)}</span>
                        <span class="px-2 py-0.5 rounded-full bg-sky-100 text-sky-900">${escapeHtml(c.category)}</span>
                        <span class="text-[#496052]">${escapeHtml(c.publicationDate)}</span>
                        ${c.isDuplicate ? `<span class="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950">DUPLICATE DETECTED</span>` : ""}
                      </div>
                      <div class="text-xs sm:text-sm font-extrabold text-[#132219]">${escapeHtml(c.title)}</div>
                      <div class="text-[11px] text-[#496052]">
                        ${escapeHtml(c.sourceWebsite)} • ${escapeHtml(c.topic)}
                        ${href ? ` • <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="underline text-[#14532D]">Verify Source ↗</a>` : ""}
                      </div>
                    </div>
                    <div class="flex gap-1.5 shrink-0">
                      <button type="button" data-admin-approve-candidate="${idx}" ${c.isDuplicate ? "disabled" : ""} class="px-3 py-1.5 rounded-lg ${c.isDuplicate ? "bg-slate-200 text-slate-500" : "bg-[#14532D] text-white"} text-xs font-extrabold">
                        Approve &amp; Publish
                      </button>
                      <button type="button" data-admin-queue-candidate="${idx}" ${c.isDuplicate ? "disabled" : ""} class="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-950 text-xs font-bold">
                        Save Pending
                      </button>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        ` : ""}

        <!-- Stored Discovered Resources Queue in Firestore -->
        <div class="space-y-2 pt-2 border-t border-emerald-50">
          <h4 class="text-xs font-extrabold uppercase tracking-wider text-[#14532D]">Saved Discovery &amp; Review Queue in Firestore (${discovered.length})</h4>
          ${discovered.length === 0 ? `<p class="text-xs text-[#496052]">No discovered resources saved in Firestore yet.</p>` : `
            <div class="space-y-2 max-h-[260px] overflow-y-auto">
              ${discovered.map((r) => `
                <div class="rounded-xl border border-[#CDE0D3] p-3 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div class="min-w-0">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      r.reviewStatus === "APPROVED_PUBLISHED" ? "bg-emerald-100 text-emerald-950" : (r.reviewStatus === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-950")
                    }">${escapeHtml(r.reviewStatus)}</span>
                    <strong class="ml-1.5 text-[#132219]">${escapeHtml(r.title)}</strong>
                    <div class="text-[11px] text-[#496052]">${escapeHtml(r.sourceWebsite)} • ${escapeHtml(r.subjectKey)} • ${escapeHtml(r.publicationDate)}</div>
                  </div>
                  <div class="flex gap-1.5 shrink-0">
                    <button type="button" data-admin-review-disc="${escapeHtml(r.id)}" data-review-status="${r.reviewStatus === "APPROVED_PUBLISHED" ? "PENDING_REVIEW" : "APPROVED_PUBLISHED"}" class="px-2.5 py-1 rounded-lg bg-[#EDF4EE] text-[#14532D] font-bold">
                      ${r.reviewStatus === "APPROVED_PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" data-admin-del-disc="${escapeHtml(r.id)}" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold">Delete</button>
                  </div>
                </div>
              `).join("")}
            </div>
          `}
        </div>
      </div>

      <!-- University Syllabus Management Form & List -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <form id="adminSyllabusForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
          <div class="flex items-center justify-between">
            <h3 id="asylFormTitle" class="text-base font-extrabold text-[#14532D]">Add Official University Syllabus</h3>
            <button id="asylCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel</button>
          </div>
          <input id="asylEditId" type="hidden" value="" />
          <input id="asylUniversity" type="text" required minlength="2" maxlength="160" placeholder="Full University Name (e.g. BCKV, Mohanpur) *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <div class="grid grid-cols-2 gap-2">
            <input id="asylUniShort" type="text" required minlength="2" maxlength="60" placeholder="Short Name (e.g. BCKV) *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
            <input id="asylPubYear" type="text" required minlength="4" maxlength="60" placeholder="Publication Year (e.g. 2025) *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          </div>
          <input id="asylCourse" type="text" required minlength="2" maxlength="120" value="B.Sc. (Hons.) Agriculture" placeholder="Course Name *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <div class="grid grid-cols-2 gap-2">
            <select id="asylSemester" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
              ${[1, 2, 3, 4, 5, 6, 7, 8].map((s) => `<option value="${s}">Semester ${s}</option>`).join("")}
            </select>
            <select id="asylSubjectKey" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
              ${AGRI_SUBJECTS.map((s) => `<option value="${s.key}">${escapeHtml(s.en)}</option>`).join("")}
            </select>
          </div>
          <input id="asylSubject" type="text" required minlength="2" maxlength="140" placeholder="Subject / Paper Title *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <textarea id="asylTopics" rows="4" required placeholder="Topics (one topic per line) *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
          <input id="asylSourceUrl" type="url" required maxlength="400" placeholder="Official University Source URL (https://...) *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="asylPdfUrl" type="url" maxlength="400" placeholder="Permitted Syllabus PDF URL (optional)" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <div class="flex flex-wrap gap-3 text-xs font-bold">
            <label class="flex items-center gap-1.5"><input id="asylDownloadOk" type="checkbox" class="accent-[#14532D]" /> Legal Download Permitted</label>
            <label class="flex items-center gap-1.5"><input id="asylPublished" type="checkbox" checked class="accent-[#14532D]" /> Published</label>
          </div>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">Save University Syllabus</button>
        </form>

        <div class="lg:col-span-7 gv-card p-5 space-y-2.5">
          <h3 class="text-base font-extrabold text-[#14532D]">Cloud University Syllabi (${cloudSyllabi.length})</h3>
          <p class="text-[11px] text-[#496052]">Baseline ICAR 5th Deans' Committee (Sem 1–8) &amp; university references are always preserved automatically.</p>
          ${cloudSyllabi.length === 0 ? `<p class="text-xs text-[#64748B]">No custom cloud syllabi added yet. Use the form to publish official university syllabus PDFs.</p>` : `
            <div class="space-y-2 max-h-[460px] overflow-y-auto">
              ${cloudSyllabi.map((s) => `
                <div class="rounded-xl border border-[#CDE0D3] p-3 bg-[#F7F9F5] flex items-center justify-between gap-2 text-xs">
                  <div class="min-w-0">
                    <div class="font-extrabold text-[#14532D]">${escapeHtml(s.universityShort)} • Sem ${escapeHtml(s.semester)} • ${s.published !== false ? "Published" : "Draft"}</div>
                    <div class="font-bold text-[#132219] truncate">${escapeHtml(s.subject)} (${escapeHtml(s.publicationYear)})</div>
                  </div>
                  <div class="flex gap-1.5 shrink-0">
                    <button type="button" data-admin-edit-syl="${escapeHtml(s.id)}" class="px-2.5 py-1 rounded-lg bg-[#EDF4EE] text-[#14532D] font-bold">Edit</button>
                    <button type="button" data-admin-del-syl="${escapeHtml(s.id)}" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold">Delete</button>
                  </div>
                </div>
              `).join("")}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}
