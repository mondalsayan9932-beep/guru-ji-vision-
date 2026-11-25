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
  const progress = [];
  for (const b of list) {
    if (!b || !b.itemId) continue;
    if (b.itemType === "NOTE") notes.add(b.itemId);
    else if (b.itemType === "MCQ") mcqs.add(b.itemId);
    else if (b.itemType === "SYLLABUS") syllabi.add(b.itemId);
    else if (b.itemType === "PROGRESS") progress.push(b);
  }
  progress.sort((a, b) => (Number(b.updatedAtMs) || 0) - (Number(a.updatedAtMs) || 0));
  return { notes, mcqs, syllabi, progress };
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
  const mode = edu.quizMode || "PRACTICE"; // PRACTICE | MOCK_TEST | PYQ_SET
  const effectiveTypeFilter = mode === "PYQ_SET" ? "OFFICIAL_PYQ" : (edu.quizType || "ALL");

  const quizzes = filterQuizQuestions(allQuizzes, {
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
      <!-- Exam Preparation Category Bar -->
      <div class="gv-card p-3.5 sm:p-4 space-y-3">
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
                  ${pdfHref && syl.downloadPermitted ? `
                    <a href="${escapeHtml(pdfHref)}" target="_blank" rel="noopener noreferrer" class="min-h-[38px] inline-flex items-center px-3 py-1.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">
                      ⬇ ${bn ? "সিলেবাস PDF" : "Syllabus PDF"}
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
// 4. NEW & DISCOVERED RESOURCES + SOURCE TRANSPARENCY SUB-VIEW
// ----------------------------------------------------------------------------
function renderDiscoveredResourcesSubView(state, lang) {
  const bn = lang === "BN";
  const approved = (state.discoveredStudyResources || []).filter((r) => r.reviewStatus === "APPROVED_PUBLISHED");

  return `
    <div class="space-y-5">
      <div class="gv-card p-4 sm:p-5 space-y-2">
        <h3 class="text-base font-extrabold text-[#14532D]">
          ${bn ? "নতুন প্রকাশিত ও যাচাইকৃত কৃষি শিক্ষা রিসোর্স" : "Newly Discovered & Admin-Verified Study Resources"} (${approved.length})
        </h3>
        <p class="text-xs text-[#496052]">
          ${bn
            ? "স্বয়ংক্রিয় অনুমোদিত সরকারি RSS/OpenAlex ফিড এবং অ্যাডমিন যাচাইকরণের পর নতুন রিসোর্স এখানে প্রকাশিত হয়।"
            : "Resources discovered from permitted official feeds (PIB Agriculture RSS, FAO RSS, OpenAlex Open-Access API) or verified by Admins appear here after review."}
        </p>
        ${approved.length === 0 ? `
          <div class="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-5 text-xs text-[#475569]">
            ${bn
              ? "এখনো কোনো নতুন রিসোর্স অ্যাডমিন কর্তৃক প্রকাশিত হয়নি। নিচের অফিশিয়াল পোর্টালগুলো থেকে সরাসরি পড়ুন।"
              : "No newly approved discovery feed items published yet. Explore the verified official portals below or run Discovery inside Admin Studio."}
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            ${approved.map((r) => {
              const href = safeUrl(r.sourceUrl);
              const subj = AGRI_SUBJECT_MAP[r.subjectKey] || AGRI_SUBJECT_MAP.OTHER;
              return `
                <article class="rounded-2xl border border-[#CDE0D3] bg-[#F7F9F5] p-4 flex flex-col justify-between gap-2.5">
                  <div class="space-y-1.5">
                    <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                      <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950">NEW • ${escapeHtml(r.category)}</span>
                      <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[#14532D]">${escapeHtml(bn ? subj.bn : subj.en)}</span>
                      <span class="text-[#496052] ml-auto">${escapeHtml(r.publicationDate || "")}</span>
                    </div>
                    <h4 class="text-sm font-extrabold text-[#132219]">${escapeHtml(r.title)}</h4>
                    <div class="text-[11px] font-bold text-[#1E7E45]">${escapeHtml(r.sourceWebsite)} • ${escapeHtml(r.topic)}</div>
                    ${r.summary ? `<p class="text-xs text-[#475569]">${escapeHtml(r.summary)}</p>` : ""}
                  </div>
                  ${href ? `
                    <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="min-h-[38px] inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">
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
  const savedMcqs = allQuizzes.filter((q) => bookmarks.mcqs.has(q.id));
  const savedSyllabi = allSyllabi.filter((s) => bookmarks.syllabi.has(s.id));

  return `
    <div class="space-y-4">
      ${!state.user ? `
        <div class="rounded-2xl bg-sky-50 border border-sky-200 p-4 text-xs text-sky-950 flex flex-wrap items-center justify-between gap-2">
          <span>${bn ? "আপনার সংরক্ষিত নোটস ও MCQ এই ডিভাইসে আছে। সব ডিভাইসে নিরাপদে সিঙ্ক করতে Google দিয়ে সাইন ইন করুন।" : "Bookmarks are saved locally on this device. Sign in with Google to sync your saved notes, MCQs, and progress privately across devices."}</span>
          <button type="button" data-action="open-auth" class="px-3.5 py-2 rounded-xl bg-[#14532D] text-white font-extrabold">${bn ? "সাইন ইন" : "Sign In"}</button>
        </div>
      ` : ""}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Saved Notes -->
        <div class="gv-card p-4 space-y-2.5">
          <h3 class="text-sm font-extrabold text-[#14532D]">★ ${bn ? "সংরক্ষিত নোটস" : "Saved Notes"} (${savedNotes.length})</h3>
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

        <!-- Saved Syllabi & Recent Activity -->
        <div class="gv-card p-4 space-y-2.5">
          <h3 class="text-sm font-extrabold text-[#14532D]">★ ${bn ? "সংরক্ষিত সিলেবাস ও ইতিহাস" : "Saved Syllabi & History"} (${savedSyllabi.length})</h3>
          ${savedSyllabi.length === 0 ? `<p class="text-xs text-[#64748B]">${bn ? "কোনো সিলেবাস সংরক্ষিত নেই।" : "No saved syllabi yet."}</p>` : savedSyllabi.map((s) => `
            <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-xs">
              <div class="font-extrabold text-[#14532D]">${escapeHtml(s.universityShort)} • Sem ${escapeHtml(s.semester)}</div>
              <div class="text-[#475569]">${escapeHtml(s.subject)}</div>
            </div>
          `).join("")}
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
  const allQuizzes = mergeQuizQuestions(state.quizzes || [], false);
  const allSyllabi = mergeSyllabi(state.universitySyllabi || [], false);
  const bookmarks = getBookmarkSets(state);

  const tabs = [
    ["materials", bn ? `নোটস ও PYQ (${allMaterials.length})` : `Notes & PYQs (${allMaterials.length})`],
    ["quiz", bn ? `MCQ ব্যাংক (${allQuizzes.length})` : `MCQ Bank (${allQuizzes.length})`],
    ["syllabus", bn ? `সিলেবাস (${allSyllabi.length})` : `Syllabus (${allSyllabi.length})`],
    ["resources", bn ? "নতুন রিসোর্স" : "New Resources"],
    ["saved", bn ? `সংরক্ষিত (${bookmarks.notes.size + bookmarks.mcqs.size})` : `Saved (${bookmarks.notes.size + bookmarks.mcqs.size})`]
  ];

  return `
    <div data-module="agri-education-hub" class="space-y-4">
      <!-- Header + Bilingual Toggle -->
      <div class="gv-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="font-display text-xl sm:text-2xl font-bold text-[#14532D]">
            ${bn ? "কৃষি শিক্ষা কেন্দ্র — নোটস, MCQ, PYQ ও সিলেবাস" : "Agriculture Education Hub — Notes, MCQs, PYQs & Syllabus"}
          </h2>
          <p class="text-xs sm:text-sm text-[#496052]">
            ${bn
              ? "B.Sc. Agriculture সেমিস্টার ১–৮, ICAR JRF, CUET-PG, IBPS AFO, NABARD ও State AO পরীক্ষার সম্পূর্ণ প্রস্তুতি"
              : "13 Subjects • Semesters 1–8 • ICAR JRF, CUET-PG, IBPS AFO, NABARD & State AO Prep"}
          </p>
        </div>
        <div class="inline-flex items-center gap-1 bg-[#EDF4EE] p-1 rounded-xl shrink-0">
          <button type="button" data-edu-lang="EN" class="px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-extrabold ${
            lang === "EN" ? "bg-[#14532D] text-white" : "text-[#14532D]"
          }">English</button>
          <button type="button" data-edu-lang="BN" class="px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-extrabold ${
            lang === "BN" ? "bg-[#14532D] text-white" : "text-[#14532D]"
          }">বাংলা</button>
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

      <!-- Shared Semester Filter Bar (Notes, MCQ & Syllabus) -->
      ${(sub === "materials" || sub === "quiz" || sub === "syllabus") ? `
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
      ${sub === "quiz" ? renderMcqBankSubView(state, lang, allQuizzes, bookmarks.mcqs) : ""}
      ${sub === "syllabus" ? renderSyllabusSubView(state, lang, allSyllabi, bookmarks.syllabi) : ""}
      ${sub === "resources" ? renderDiscoveredResourcesSubView(state, lang) : ""}
      ${sub === "saved" ? renderSavedDeskSubView(state, lang, allMaterials, allQuizzes, allSyllabi, bookmarks) : ""}

      <!-- Inline PDF Viewer Modal -->
      ${renderInlinePdfModal(state.edu, bn)}
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
