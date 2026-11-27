// ============================================================================
// GURU JI VISION — PHASE 3 ADMIN EDUCATION CONTENT MANAGEMENT SYSTEM (CMS) UI
// ============================================================================
// Organized Admin Dashboard for ALL Student Zone educational content:
// 1. Agriculture Notes & Supported Documents (PDF, DOC, DOCX, PPT, PPTX, TXT)
// 2. Video Learning (YouTube URLs, Auto-Thumbnails, Language, Status)
// 3. MCQ Practice Bank + Practice Test / Mock Test Builder
// 4. Official Previous Year Question Papers & Answer Keys (strict provenance)
// 5. University-Wise Syllabus + Academic Session + Direct PDF Upload
// 6. Agricultural Learning Resources (7 Official Categories: ICAR, University,
//    Research Papers, Govt Publications, YouTube Playlists, Books, Notices)
// 7. Automatic Discovery & Admin Review Queue (Allowlisted Official APIs/RSS)
//
// Every section includes Search, Filters, Publication Status (one-click
// Publish/Unpublish), Created Date, Updated Date, Edit, and Authorized Delete.
// ============================================================================

import { escapeHtml, safeUrl } from "./calculators.js";
import {
  AGRI_SUBJECTS,
  AGRI_SUBJECT_MAP,
  DIFFICULTY_META,
  EDUCATION_SOURCE_CAPABILITIES,
  EXAM_PREP_CATEGORIES,
  EXAM_PREP_MAP,
  QUESTION_PROVENANCE_META
} from "./agri-education-data.js";
import {
  EDU_LANGUAGES,
  EDU_LANGUAGE_MAP,
  LEARNING_RESOURCE_CATEGORIES,
  LEARNING_RESOURCE_CATEGORY_MAP,
  PYQ_ORIGIN_META,
  extractYouTubeInfo,
  filterCmsRecords,
  formatCmsDate,
  isRecordPublished
} from "./edu-cms-utils.js";

function renderCmsFilterToolbar(cms, { showCategory = false, categoryOptions = [], showPendingOption = false } = {}) {
  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pb-2 border-b border-emerald-100">
      <input
        id="eduCmsSearchInput"
        type="search"
        value="${escapeHtml(cms.search || "")}"
        placeholder="Search title, subject, topic, exam..."
        class="px-3 py-2 min-h-[40px] rounded-xl border border-[#CDE0D3] text-xs bg-white"
      />
      <select id="eduCmsSubjectFilter" class="px-3 py-2 min-h-[40px] rounded-xl border border-[#CDE0D3] text-xs bg-white">
        <option value="ALL">All 13 Subjects</option>
        ${AGRI_SUBJECTS.map((s) => `
          <option value="${escapeHtml(s.key)}" ${cms.subjectKey === s.key ? "selected" : ""}>${escapeHtml(s.en)}</option>
        `).join("")}
      </select>
      ${showCategory ? `
        <select id="eduCmsCategoryFilter" class="px-3 py-2 min-h-[40px] rounded-xl border border-[#CDE0D3] text-xs bg-white">
          <option value="ALL">All Categories</option>
          ${categoryOptions.map((c) => `
            <option value="${escapeHtml(c.key)}" ${cms.category === c.key ? "selected" : ""}>${escapeHtml(c.label)}</option>
          `).join("")}
        </select>
      ` : ""}
      <select id="eduCmsStatusFilter" class="px-3 py-2 min-h-[40px] rounded-xl border border-[#CDE0D3] text-xs bg-white">
        <option value="ALL" ${cms.status === "ALL" ? "selected" : ""}>Status: All</option>
        <option value="PUBLISHED" ${cms.status === "PUBLISHED" ? "selected" : ""}>Published Only</option>
        <option value="DRAFT" ${cms.status === "DRAFT" ? "selected" : ""}>Draft / Unpublished</option>
        ${showPendingOption ? `<option value="PENDING" ${cms.status === "PENDING" ? "selected" : ""}>Pending Review Queue</option>` : ""}
      </select>
    </div>
  `;
}

function renderDateMetaRow(item) {
  const created = formatCmsDate(item.createdAtMs, item.publicationDate || "");
  const updated = formatCmsDate(item.updatedAtMs, item.lastUpdatedDate || item.publicationDate || "");
  return `
    <div class="text-[10px] text-[#64748B] flex flex-wrap gap-x-3 gap-y-0.5">
      <span>Created: <strong class="text-[#334155]">${escapeHtml(created)}</strong></span>
      <span>Updated: <strong class="text-[#334155]">${escapeHtml(updated)}</strong></span>
    </div>
  `;
}

function renderStatusBadge(published, reviewStatus = "") {
  if (reviewStatus) {
    const cls = reviewStatus === "APPROVED_PUBLISHED"
      ? "bg-emerald-100 text-emerald-950"
      : (reviewStatus === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-950");
    const label = reviewStatus === "APPROVED_PUBLISHED"
      ? "Published"
      : (reviewStatus === "REJECTED" ? "Rejected" : "Pending Review");
    return `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${cls}">${label}</span>`;
  }
  return published
    ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-950">Published</span>`
    : `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-950">Unpublished Draft</span>`;
}

// ----------------------------------------------------------------------------
// SUB-TAB 1: AGRICULTURE NOTES & SUPPORTED DOCUMENTS
// ----------------------------------------------------------------------------
function renderCmsNotesSection(state, cms) {
  const rawNotes = (state.studyMaterials || []).filter((m) => m.category === "NOTES_PDF" || m.category === "PRACTICAL");
  const filtered = filterCmsRecords(rawNotes, cms);

  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form id="adminMaterialForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
        <div class="flex items-center justify-between">
          <h3 id="amFormTitle" class="text-base font-extrabold text-[#14532D]">Add Agriculture Note / Document</h3>
          <button id="amCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
        </div>
        <input id="amEditId" type="hidden" value="" />
        <input id="amFileName" type="hidden" value="" />
        <input id="amFileType" type="hidden" value="" />
        <input id="amTitle" type="text" required minlength="2" maxlength="150" placeholder="Note Title (English) *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
        <input id="amTitleBn" type="text" maxlength="180" placeholder="Bengali Title (optional)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <div class="grid grid-cols-2 gap-2">
          <select id="amSemester" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-sm">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map((s) => `<option value="${s}">Semester ${s}</option>`).join("")}
          </select>
          <select id="amCategory" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-sm">
            <option value="NOTES_PDF">Agriculture Notes &amp; Docs</option>
            <option value="PRACTICAL">Practical / Lab Manual</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <select id="amSubjectKey" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
            ${AGRI_SUBJECTS.map((s) => `<option value="${s.key}">${escapeHtml(s.en)}</option>`).join("")}
          </select>
          <input id="amSubject" type="text" required minlength="2" maxlength="80" placeholder="Subject Label *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input id="amTopic" type="text" maxlength="120" placeholder="Topic / Chapter *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <select id="amLanguage" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
            ${EDU_LANGUAGES.map((l) => `<option value="${l.key}">${escapeHtml(l.label)}</option>`).join("")}
          </select>
        </div>
        <div class="rounded-xl bg-[#F1F8F3] border border-[#CDE0D3] p-3 space-y-1.5">
          <input id="amUrl" type="url" maxlength="400" placeholder="Document / PDF URL (https://...)" class="w-full px-3 py-2 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
          <label class="inline-flex items-center gap-2 text-xs font-bold text-[#14532D] cursor-pointer">
            <span>⬆️ Upload PDF, DOC, DOCX, PPT, PPTX or TXT (max 25 MB)</span>
            <input id="amPdfUpload" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain" class="hidden" />
          </label>
          <div id="amUploadMeta" class="text-[10px] text-[#496052]">Uploaded files attach their cloud URL automatically.</div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input id="amSourceName" type="text" maxlength="140" placeholder="Source (e.g. ICAR eCourses)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="amLastUpdated" type="date" value="${new Date().toISOString().slice(0, 10)}" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <input id="amSourceUrl" type="url" maxlength="400" placeholder="Official Source / Reference URL (optional)" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <input id="amReference" type="text" maxlength="300" placeholder="Citation / Book Reference (optional)" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <select id="amOrigin" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
          <option value="VERIFIED_FACULTY">Origin: Verified Faculty Notes</option>
          <option value="OFFICIAL_PUBLICATION">Origin: Official Publication / ICAR / University</option>
          <option value="CURATED_REFERENCE">Origin: Curated Academic Reference</option>
          <option value="AI_PRACTICE">Origin: AI-Assisted Study Summary (Admin Reviewed)</option>
        </select>
        <textarea id="amSummary" rows="2" required minlength="5" maxlength="1000" placeholder="Description / Summary *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm"></textarea>
        <textarea id="amContent" rows="4" maxlength="12000" placeholder="Full Notes Text (optional; also searchable in Student Zone & AI Guru)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm"></textarea>
        <div class="flex flex-wrap gap-3 text-xs font-bold">
          <label class="flex items-center gap-1.5"><input id="amPublished" type="checkbox" checked class="accent-[#14532D]" /> Published</label>
          <label class="flex items-center gap-1.5"><input id="amVerifiedAi" type="checkbox" checked class="accent-[#14532D]" /> Verified for AI Guru</label>
          <label class="flex items-center gap-1.5"><input id="amDownloadOk" type="checkbox" checked class="accent-[#14532D]" /> Download Permitted</label>
        </div>
        <button type="submit" class="w-full py-3 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">Save Agriculture Note</button>
      </form>

      <div class="lg:col-span-7 gv-card p-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-base font-extrabold text-[#14532D]">Agriculture Notes &amp; Practicals (${filtered.length} / ${rawNotes.length})</h3>
          <span class="text-[11px] font-bold text-[#496052]">${rawNotes.filter(isRecordPublished).length} Published • ${rawNotes.filter((r) => !isRecordPublished(r)).length} Drafts</span>
        </div>
        ${renderCmsFilterToolbar(cms, {
          showCategory: true,
          categoryOptions: [
            { key: "NOTES_PDF", label: "Notes & PDFs" },
            { key: "PRACTICAL", label: "Practicals" }
          ]
        })}
        ${filtered.length === 0 ? `
          <div class="rounded-2xl border border-dashed border-[#CDE0D3] p-6 text-center text-xs text-[#64748B]">
            No cloud notes match your filter yet. Add a note using the form on the left.
          </div>
        ` : `
          <div class="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            ${filtered.map((m) => `
              <div class="rounded-2xl border border-[#CDE0D3] p-3.5 bg-[#F7F9F5] space-y-1.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                    ${renderStatusBadge(m.published !== false)}
                    <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[#14532D]">Sem ${escapeHtml(m.semester)} • ${escapeHtml(m.subject)}</span>
                    ${m.topic ? `<span class="px-2 py-0.5 rounded-full bg-emerald-50 text-[#15803D]">${escapeHtml(m.topic)}</span>` : ""}
                    ${m.fileType ? `<span class="px-2 py-0.5 rounded-full bg-sky-100 text-sky-900">${escapeHtml(m.fileType)}</span>` : ""}
                  </div>
                  <div class="flex flex-wrap gap-1.5 shrink-0">
                    <button type="button" data-cms-toggle-mat="${escapeHtml(m.id)}" data-next-pub="${m.published !== false ? "0" : "1"}" class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${m.published !== false ? "bg-amber-100 text-amber-950" : "bg-emerald-600 text-white"}">
                      ${m.published !== false ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" data-edit-mat="${escapeHtml(m.id)}" class="px-2.5 py-1 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-bold">Edit</button>
                    <button type="button" data-del-mat="${escapeHtml(m.id)}" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold">Delete</button>
                  </div>
                </div>
                <div class="text-sm font-extrabold text-[#132219]">${escapeHtml(m.title)}</div>
                ${m.sourceName ? `<div class="text-[11px] text-[#496052]">Source: ${escapeHtml(m.sourceName)}</div>` : ""}
                ${renderDateMetaRow(m)}
              </div>
            `).join("")}
          </div>
        `}
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// SUB-TAB 2: VIDEO LEARNING (YOUTUBE)
// ----------------------------------------------------------------------------
function renderCmsVideosSection(state, cms) {
  const rawVideos = (state.studyMaterials || []).filter((m) => m.category === "VIDEO_LECTURE");
  const filtered = filterCmsRecords(rawVideos, cms);

  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form id="adminVideoForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
        <div class="flex items-center justify-between">
          <h3 id="avFormTitle" class="text-base font-extrabold text-[#14532D]">Add YouTube Learning Video</h3>
          <button id="avCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
        </div>
        <p class="text-[11px] text-[#496052]">Paste any official YouTube video URL (youtube.com/watch?v=... or youtu.be/...). Video ID and thumbnail are verified automatically.</p>
        <input id="avEditId" type="hidden" value="" />
        <input id="avTitle" type="text" required minlength="2" maxlength="150" placeholder="Video Title *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
        <input id="avTitleBn" type="text" maxlength="180" placeholder="Bengali Title (optional)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <input id="avYoutubeUrl" type="url" required maxlength="400" placeholder="YouTube URL (https://www.youtube.com/watch?v=...) *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs font-semibold" />
        <input id="avThumbnailUrl" type="url" maxlength="400" placeholder="Custom Thumbnail URL (optional — auto-detected from YouTube)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <div class="grid grid-cols-2 gap-2">
          <select id="avSubjectKey" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
            ${AGRI_SUBJECTS.map((s) => `<option value="${s.key}">${escapeHtml(s.en)}</option>`).join("")}
          </select>
          <input id="avSubject" type="text" required minlength="2" maxlength="80" placeholder="Subject Label *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <div class="grid grid-cols-3 gap-2">
          <input id="avTopic" type="text" required minlength="2" maxlength="120" placeholder="Topic *" class="col-span-1 px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <select id="avLanguage" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
            ${EDU_LANGUAGES.map((l) => `<option value="${l.key}">${escapeHtml(l.label)}</option>`).join("")}
          </select>
          <select id="avSemester" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map((s) => `<option value="${s}">Sem ${s}</option>`).join("")}
          </select>
        </div>
        <input id="avSourceName" type="text" maxlength="140" placeholder="Channel / Instructor / University Name (optional)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <textarea id="avDescription" rows="3" required minlength="5" maxlength="1000" placeholder="Video Description & Key Learning Points *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm"></textarea>
        <label class="flex items-center gap-2 text-xs font-bold"><input id="avPublished" type="checkbox" checked class="accent-[#14532D]" /> Published to Student Zone Video Learning</label>
        <button type="submit" class="w-full py-3 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">Save Video Lecture</button>
      </form>

      <div class="lg:col-span-7 gv-card p-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-base font-extrabold text-[#14532D]">Video Learning Catalog (${filtered.length} / ${rawVideos.length})</h3>
          <span class="text-[11px] font-bold text-[#496052]">${rawVideos.filter(isRecordPublished).length} Published • ${rawVideos.filter((r) => !isRecordPublished(r)).length} Drafts</span>
        </div>
        ${renderCmsFilterToolbar(cms)}
        ${filtered.length === 0 ? `
          <div class="rounded-2xl border border-dashed border-[#CDE0D3] p-6 text-center text-xs text-[#64748B]">
            No YouTube video lectures added yet. Add verified ICAR, university, or faculty video links using the form.
          </div>
        ` : `
          <div class="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            ${filtered.map((v) => {
              const yt = extractYouTubeInfo(v.youtubeUrl || v.resourceUrl || "");
              const thumb = safeUrl(v.thumbnailUrl || (yt.ok ? yt.thumbnailUrl : ""));
              const langLabel = EDU_LANGUAGE_MAP[v.language]?.label || "English";
              return `
                <div class="rounded-2xl border border-[#CDE0D3] p-3 bg-[#F7F9F5] flex flex-col sm:flex-row gap-3">
                  ${thumb ? `
                    <img src="${escapeHtml(thumb)}" alt="${escapeHtml(v.title)}" class="w-full sm:w-32 h-24 object-cover rounded-xl border border-[#CDE0D3] shrink-0 bg-slate-200" loading="lazy" />
                  ` : `
                    <div class="w-full sm:w-32 h-24 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center text-xs font-extrabold shrink-0">YouTube</div>
                  `}
                  <div class="flex-1 min-w-0 space-y-1.5">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                        ${renderStatusBadge(v.published !== false)}
                        <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[#14532D]">${escapeHtml(v.subject)}</span>
                        <span class="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">${escapeHtml(langLabel)}</span>
                        <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Sem ${escapeHtml(v.semester || 1)}</span>
                      </div>
                      <div class="flex flex-wrap gap-1.5 shrink-0">
                        <button type="button" data-cms-toggle-mat="${escapeHtml(v.id)}" data-next-pub="${v.published !== false ? "0" : "1"}" class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${v.published !== false ? "bg-amber-100 text-amber-950" : "bg-emerald-600 text-white"}">
                          ${v.published !== false ? "Unpublish" : "Publish"}
                        </button>
                        <button type="button" data-cms-edit-video="${escapeHtml(v.id)}" class="px-2.5 py-1 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-bold">Edit</button>
                        <button type="button" data-del-mat="${escapeHtml(v.id)}" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold">Delete</button>
                      </div>
                    </div>
                    <div class="text-sm font-extrabold text-[#132219] truncate">${escapeHtml(v.title)}</div>
                    <div class="text-[11px] text-[#496052] line-clamp-2">${escapeHtml(v.summary || "")}</div>
                    ${renderDateMetaRow(v)}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// SUB-TAB 3: MCQ BANK & PRACTICE / MOCK TEST BUILDER
// ----------------------------------------------------------------------------
function renderCmsMcqAndTestsSection(state, cms) {
  const rawQuizzes = state.quizzes || [];
  const filteredQuizzes = filterCmsRecords(rawQuizzes, cms);
  const rawTests = state.mockTests || [];
  const filteredTests = filterCmsRecords(rawTests, { search: cms.search, subjectKey: cms.subjectKey, status: cms.status, category: "ALL" });

  return `
    <div class="space-y-6">
      <!-- Part A: Practice Test & Mock Test Builder -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <form id="adminMockTestForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit border-2 border-emerald-200">
          <div class="flex items-center justify-between">
            <h3 id="amtFormTitle" class="text-base font-extrabold text-[#14532D]">Create Practice Test / Mock Test</h3>
            <button id="amtCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
          </div>
          <p class="text-[11px] text-[#496052]">Assemble structured timed Mock Tests or Practice Tests from your published MCQ Bank. Students can launch them directly and track scores.</p>
          <input id="amtEditId" type="hidden" value="" />
          <input id="amtTitle" type="text" required minlength="2" maxlength="150" placeholder="Test Title (e.g. ICAR JRF Agronomy Mock Test #1) *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          <div class="grid grid-cols-2 gap-2">
            <select id="amtTestType" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
              <option value="MOCK_TEST">Mock Test (Timed Exam)</option>
              <option value="PRACTICE_TEST">Practice Test (Instant Feedback)</option>
            </select>
            <input id="amtDuration" type="number" min="5" max="240" value="30" required placeholder="Duration (mins)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <select id="amtExamCategory" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
              ${EXAM_PREP_CATEGORIES.map((ex) => `<option value="${escapeHtml(ex.key)}">${escapeHtml(ex.en)}</option>`).join("")}
            </select>
            <select id="amtSubjectKey" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
              <option value="ALL">All Subjects</option>
              ${AGRI_SUBJECTS.map((s) => `<option value="${s.key}">${escapeHtml(s.en)}</option>`).join("")}
            </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <select id="amtSemester" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
              <option value="0">All Semesters</option>
              ${[1, 2, 3, 4, 5, 6, 7, 8].map((s) => `<option value="${s}">Semester ${s}</option>`).join("")}
            </select>
            <select id="amtDifficulty" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
              <option value="ALL">All Difficulties</option>
              ${Object.values(DIFFICULTY_META).map((d) => `<option value="${d.key}">${escapeHtml(d.en)}</option>`).join("")}
            </select>
          </div>
          <textarea id="amtDescription" rows="2" maxlength="600" placeholder="Instructions & syllabus coverage for this test..." class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
          <div class="flex flex-wrap gap-3 text-xs font-bold">
            <label class="flex items-center gap-1.5"><input id="amtOfficialPyqOnly" type="checkbox" class="accent-[#14532D]" /> Official PYQs Only</label>
            <label class="flex items-center gap-1.5"><input id="amtPublished" type="checkbox" checked class="accent-[#14532D]" /> Published to Students</label>
          </div>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">Save Practice / Mock Test</button>
        </form>

        <div class="lg:col-span-7 gv-card p-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-base font-extrabold text-[#14532D]">Practice Tests &amp; Mock Tests (${filteredTests.length})</h3>
            <span class="text-[11px] font-bold text-[#496052]">${rawTests.filter(isRecordPublished).length} Published</span>
          </div>
          ${filteredTests.length === 0 ? `
            <div class="rounded-2xl border border-dashed border-[#CDE0D3] p-5 text-center text-xs text-[#64748B]">
              No Practice Tests or Mock Tests created yet. Use the builder on the left to publish timed Mock Tests or Practice Tests.
            </div>
          ` : `
            <div class="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              ${filteredTests.map((t) => {
                const examLabel = EXAM_PREP_MAP[t.examCategory]?.en || "All Exams";
                const subjLabel = t.subjectKey === "ALL" ? "All Subjects" : (AGRI_SUBJECT_MAP[t.subjectKey]?.en || t.subjectKey);
                return `
                  <div class="rounded-2xl border border-[#CDE0D3] p-3 bg-[#F7F9F5] space-y-1.5">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                        ${renderStatusBadge(t.published !== false)}
                        <span class="px-2 py-0.5 rounded-full ${t.testType === "MOCK_TEST" ? "bg-indigo-100 text-indigo-950" : "bg-sky-100 text-sky-950"}">${t.testType === "MOCK_TEST" ? "Mock Test" : "Practice Test"}</span>
                        <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[#14532D]">${escapeHtml(examLabel)} • ${escapeHtml(subjLabel)}</span>
                        <span class="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900">${escapeHtml(t.durationMinutes)} mins</span>
                      </div>
                      <div class="flex gap-1.5 shrink-0">
                        <button type="button" data-cms-toggle-test="${escapeHtml(t.id)}" data-next-pub="${t.published !== false ? "0" : "1"}" class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${t.published !== false ? "bg-amber-100 text-amber-950" : "bg-emerald-600 text-white"}">
                          ${t.published !== false ? "Unpublish" : "Publish"}
                        </button>
                        <button type="button" data-cms-edit-test="${escapeHtml(t.id)}" class="px-2.5 py-1 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-bold">Edit</button>
                        <button type="button" data-cms-del-test="${escapeHtml(t.id)}" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold">Delete</button>
                      </div>
                    </div>
                    <div class="text-sm font-extrabold text-[#132219]">${escapeHtml(t.title)}</div>
                    ${t.description ? `<div class="text-[11px] text-[#496052]">${escapeHtml(t.description)}</div>` : ""}
                    ${renderDateMetaRow(t)}
                  </div>
                `;
              }).join("")}
            </div>
          `}
        </div>
      </div>

      <!-- Part B: Individual MCQ Question Bank CRUD -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <form id="adminQuizForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
          <div class="flex items-center justify-between">
            <h3 id="aqFormTitle" class="text-base font-extrabold text-[#14532D]">Add MCQ Question</h3>
            <button id="aqCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
          </div>
          <div class="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-950 font-semibold">
            Integrity Rule: Label Official PYQs ONLY when verified from an authentic official exam paper. Never label practice or AI questions as Official PYQs.
          </div>
          <input id="aqEditId" type="hidden" value="" />
          <input id="aqTitle" type="text" required minlength="2" maxlength="120" placeholder="Short Topic Title *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          <div class="grid grid-cols-2 gap-2">
            <select id="aqSem" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-sm">
              ${[1, 2, 3, 4, 5, 6, 7, 8].map((s) => `<option value="${s}">Sem ${s}</option>`).join("")}
            </select>
            <select id="aqSubjectKey" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
              ${AGRI_SUBJECTS.map((s) => `<option value="${s.key}">${escapeHtml(s.en)}</option>`).join("")}
            </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input id="aqSubject" type="text" required minlength="2" maxlength="80" placeholder="Subject Label *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
            <input id="aqTopic" type="text" maxlength="120" placeholder="Topic (e.g. Irrigation)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <select id="aqQuestionType" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
              ${Object.values(QUESTION_PROVENANCE_META).map((pt) => `<option value="${pt.key}" ${pt.key === "PRACTICE" ? "selected" : ""}>${escapeHtml(pt.en)}</option>`).join("")}
            </select>
            <select id="aqDifficulty" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
              ${Object.values(DIFFICULTY_META).map((d) => `<option value="${d.key}" ${d.key === "MEDIUM" ? "selected" : ""}>Difficulty: ${escapeHtml(d.en)}</option>`).join("")}
            </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <select id="aqExamCategory" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
              ${EXAM_PREP_CATEGORIES.filter((e) => e.key !== "ALL").map((ex) => `<option value="${ex.key}">${escapeHtml(ex.en)}</option>`).join("")}
            </select>
            <input id="aqExamYear" type="text" maxlength="20" placeholder="Exam Year (if PYQ, e.g. 2024)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          </div>
          <input id="aqSourcePaper" type="text" maxlength="160" placeholder="Official Paper / Reference Source (optional)" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="aqSourceUrl" type="url" maxlength="400" placeholder="Official Source URL (optional)" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <textarea id="aqQuestion" rows="2" required minlength="5" maxlength="500" placeholder="Question text *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-sm"></textarea>
          <input id="aqOpt0" type="text" required maxlength="160" placeholder="Option A *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="aqOpt1" type="text" required maxlength="160" placeholder="Option B *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="aqOpt2" type="text" required maxlength="160" placeholder="Option C *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="aqOpt3" type="text" required maxlength="160" placeholder="Option D *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <select id="aqCorrect" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
            <option value="0">Correct Answer: Option A</option>
            <option value="1">Correct Answer: Option B</option>
            <option value="2">Correct Answer: Option C</option>
            <option value="3">Correct Answer: Option D</option>
          </select>
          <textarea id="aqExplanation" rows="2" maxlength="500" placeholder="Detailed Explanation *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
          <label class="flex items-center gap-1.5 text-xs font-bold"><input id="aqPublished" type="checkbox" checked class="accent-[#14532D]" /> Published</label>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">Save MCQ Question</button>
        </form>

        <div class="lg:col-span-7 gv-card p-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-base font-extrabold text-[#14532D]">Cloud MCQ Question Bank (${filteredQuizzes.length} / ${rawQuizzes.length})</h3>
            <span class="text-[11px] font-bold text-[#496052]">${rawQuizzes.filter(isRecordPublished).length} Published</span>
          </div>
          ${renderCmsFilterToolbar(cms, {
            showCategory: true,
            categoryOptions: EXAM_PREP_CATEGORIES.filter((e) => e.key !== "ALL").map((e) => ({ key: e.key, label: e.en }))
          })}
          <div class="space-y-2 max-h-[680px] overflow-y-auto pr-1">
            ${filteredQuizzes.map((q) => {
              const prov = QUESTION_PROVENANCE_META[q.questionType] || QUESTION_PROVENANCE_META.PRACTICE;
              const diff = DIFFICULTY_META[q.difficulty] || DIFFICULTY_META.MEDIUM;
              return `
                <div class="rounded-2xl border border-[#CDE0D3] p-3.5 bg-[#F7F9F5] space-y-1.5">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex flex-wrap items-center gap-1 text-[10px] font-extrabold">
                      ${renderStatusBadge(q.published !== false)}
                      <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[#14532D]">Sem ${escapeHtml(q.semester)} • ${escapeHtml(q.subject)}</span>
                      <span class="px-2 py-0.5 rounded-full border ${prov.badgeClass}">${escapeHtml(prov.en)}</span>
                      <span class="px-2 py-0.5 rounded-full border ${diff.badgeClass}">${escapeHtml(diff.en)}</span>
                    </div>
                    <div class="flex gap-1.5 shrink-0">
                      <button type="button" data-cms-toggle-quiz="${escapeHtml(q.id)}" data-next-pub="${q.published !== false ? "0" : "1"}" class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${q.published !== false ? "bg-amber-100 text-amber-950" : "bg-emerald-600 text-white"}">
                        ${q.published !== false ? "Unpublish" : "Publish"}
                      </button>
                      <button type="button" data-edit-quiz="${escapeHtml(q.id)}" class="px-2.5 py-1 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-bold">Edit</button>
                      <button type="button" data-del-quiz="${escapeHtml(q.id)}" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold">Delete</button>
                    </div>
                  </div>
                  <div class="text-sm font-bold text-[#132219]">${escapeHtml(q.questionText)}</div>
                  ${renderDateMetaRow(q)}
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// SUB-TAB 4: OFFICIAL PREVIOUS YEAR QUESTION PAPERS & ANSWER KEYS
// ----------------------------------------------------------------------------
function renderCmsPyqSection(state, cms) {
  const rawPyqs = (state.studyMaterials || []).filter((m) => m.category === "PYQ");
  const filtered = filterCmsRecords(rawPyqs, cms);

  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form id="adminPyqForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
        <div class="flex items-center justify-between">
          <h3 id="apyqFormTitle" class="text-base font-extrabold text-[#14532D]">Upload Official PYQ Paper &amp; Answer Key</h3>
          <button id="apyqCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
        </div>
        <div class="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-950 font-semibold">
          Strictly distinguish authentic Official PYQs from Practice Sets and AI-Generated practice papers. Never mark practice sets as Official PYQs.
        </div>
        <input id="apyqEditId" type="hidden" value="" />
        <input id="apyqTitle" type="text" required minlength="2" maxlength="150" placeholder="Paper Title (e.g. ICAR AIEEA PG Agronomy 2024 Official Paper) *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
        <div class="grid grid-cols-2 gap-2">
          <select id="apyqExamCategory" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
            ${EXAM_PREP_CATEGORIES.filter((e) => e.key !== "ALL").map((ex) => `<option value="${escapeHtml(ex.key)}">${escapeHtml(ex.en)}</option>`).join("")}
          </select>
          <input id="apyqExamYear" type="text" required minlength="4" maxlength="20" placeholder="Exam Year (e.g. 2024) *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs font-bold" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <select id="apyqOrigin" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
            <option value="OFFICIAL_PYQ">Official Previous Year Paper</option>
            <option value="PRACTICE_SET">Practice Question Set (Not Official PYQ)</option>
            <option value="AI_PRACTICE">AI-Generated Practice (Not Official PYQ)</option>
          </select>
          <select id="apyqSemester" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map((s) => `<option value="${s}">Semester ${s}</option>`).join("")}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <select id="apyqSubjectKey" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
            ${AGRI_SUBJECTS.map((s) => `<option value="${s.key}">${escapeHtml(s.en)}</option>`).join("")}
          </select>
          <input id="apyqSubject" type="text" required minlength="2" maxlength="80" placeholder="Subject / Paper Code *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>

        <div class="rounded-xl bg-[#F1F8F3] border border-[#CDE0D3] p-3 space-y-1.5">
          <input id="apyqPaperUrl" type="url" maxlength="400" placeholder="Question Paper PDF URL (https://...)" class="w-full px-3 py-2 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
          <label class="inline-flex items-center gap-2 text-xs font-bold text-[#14532D] cursor-pointer">
            <span>⬆️ Upload Question Paper PDF</span>
            <input id="apyqPaperUpload" type="file" accept=".pdf,.doc,.docx,application/pdf" class="hidden" />
          </label>
        </div>

        <div class="rounded-xl bg-[#EEF2FF] border border-indigo-200 p-3 space-y-1.5">
          <input id="apyqAnswerKeyUrl" type="url" maxlength="400" placeholder="Official Answer Key PDF URL (optional)" class="w-full px-3 py-2 rounded-lg border border-indigo-200 text-xs bg-white" />
          <label class="inline-flex items-center gap-2 text-xs font-bold text-indigo-900 cursor-pointer">
            <span>⬆️ Upload Answer Key PDF</span>
            <input id="apyqAnswerKeyUpload" type="file" accept=".pdf,.doc,.docx,application/pdf" class="hidden" />
          </label>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <input id="apyqSourceName" type="text" maxlength="140" placeholder="Exam Authority (e.g. NTA / BCKV / IBPS)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="apyqSourceUrl" type="url" maxlength="400" placeholder="Official Portal URL" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <textarea id="apyqSummary" rows="2" required minlength="5" maxlength="1000" placeholder="Paper Details (sections, total marks, shift, answer key status) *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
        <div class="flex flex-wrap gap-3 text-xs font-bold">
          <label class="flex items-center gap-1.5"><input id="apyqDownloadOk" type="checkbox" checked class="accent-[#14532D]" /> Legal Download Permitted</label>
          <label class="flex items-center gap-1.5"><input id="apyqPublished" type="checkbox" checked class="accent-[#14532D]" /> Published</label>
        </div>
        <button type="submit" class="w-full py-3 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">Save PYQ Paper</button>
      </form>

      <div class="lg:col-span-7 gv-card p-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-base font-extrabold text-[#14532D]">Official PYQ Papers &amp; Question Sets (${filtered.length} / ${rawPyqs.length})</h3>
          <span class="text-[11px] font-bold text-[#496052]">${rawPyqs.filter((p) => (p.pyqOrigin || "OFFICIAL_PYQ") === "OFFICIAL_PYQ").length} Official PYQs</span>
        </div>
        ${renderCmsFilterToolbar(cms, {
          showCategory: true,
          categoryOptions: EXAM_PREP_CATEGORIES.filter((e) => e.key !== "ALL").map((e) => ({ key: e.key, label: e.en }))
        })}
        ${filtered.length === 0 ? `
          <div class="rounded-2xl border border-dashed border-[#CDE0D3] p-6 text-center text-xs text-[#64748B]">
            No cloud PYQ papers uploaded yet. Upload official exam-wise and year-wise papers &amp; answer keys using the form.
          </div>
        ` : `
          <div class="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            ${filtered.map((p) => {
              const orig = PYQ_ORIGIN_META[p.pyqOrigin] || PYQ_ORIGIN_META.OFFICIAL_PYQ;
              const examMeta = EXAM_PREP_MAP[p.examCategory]?.en || "Exam Paper";
              return `
                <div class="rounded-2xl border border-[#CDE0D3] p-3.5 bg-[#F7F9F5] space-y-1.5">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                      ${renderStatusBadge(p.published !== false)}
                      <span class="px-2 py-0.5 rounded-full border ${orig.badge}">${escapeHtml(orig.en)}</span>
                      <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[#14532D]">${escapeHtml(examMeta)} ${p.examYear ? `• ${escapeHtml(p.examYear)}` : ""}</span>
                      ${p.answerKeyUrl ? `<span class="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900">✓ Answer Key</span>` : ""}
                    </div>
                    <div class="flex gap-1.5 shrink-0">
                      <button type="button" data-cms-toggle-mat="${escapeHtml(p.id)}" data-next-pub="${p.published !== false ? "0" : "1"}" class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${p.published !== false ? "bg-amber-100 text-amber-950" : "bg-emerald-600 text-white"}">
                        ${p.published !== false ? "Unpublish" : "Publish"}
                      </button>
                      <button type="button" data-cms-edit-pyq="${escapeHtml(p.id)}" class="px-2.5 py-1 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-bold">Edit</button>
                      <button type="button" data-del-mat="${escapeHtml(p.id)}" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold">Delete</button>
                    </div>
                  </div>
                  <div class="text-sm font-extrabold text-[#132219]">${escapeHtml(p.title)}</div>
                  <div class="text-[11px] text-[#496052]">${escapeHtml(p.subject)}${p.sourceName ? ` • ${escapeHtml(p.sourceName)}` : ""}</div>
                  ${renderDateMetaRow(p)}
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// SUB-TAB 5: UNIVERSITY-WISE SYLLABUS (WITH ACADEMIC SESSION & PDF UPLOAD)
// ----------------------------------------------------------------------------
function renderCmsSyllabusSection(state, cms) {
  const rawSyllabi = state.universitySyllabi || [];
  const filtered = filterCmsRecords(rawSyllabi, cms);

  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form id="adminSyllabusForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
        <div class="flex items-center justify-between">
          <h3 id="asylFormTitle" class="text-base font-extrabold text-[#14532D]">Add Official University Syllabus</h3>
          <button id="asylCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
        </div>
        <input id="asylEditId" type="hidden" value="" />
        <input id="asylUniversity" type="text" required minlength="2" maxlength="160" placeholder="Full University Name (e.g. Bidhan Chandra Krishi Viswavidyalaya) *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <div class="grid grid-cols-3 gap-2">
          <input id="asylUniShort" type="text" required minlength="2" maxlength="60" placeholder="Short (BCKV) *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="asylSession" type="text" maxlength="40" placeholder="Session (2025-26)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="asylPubYear" type="text" required minlength="4" maxlength="60" placeholder="Year (2025) *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
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
        <textarea id="asylTopics" rows="4" required placeholder="Syllabus Topics (one unit/topic per line) *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
        <input id="asylSourceUrl" type="url" required maxlength="400" placeholder="Official University Source URL (https://...) *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <div class="rounded-xl bg-[#F1F8F3] border border-[#CDE0D3] p-3 space-y-1.5">
          <input id="asylPdfUrl" type="url" maxlength="400" placeholder="Syllabus PDF URL (optional)" class="w-full px-3 py-2 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
          <label class="inline-flex items-center gap-2 text-xs font-bold text-[#14532D] cursor-pointer">
            <span>⬆️ Upload Official Syllabus PDF to Storage</span>
            <input id="asylPdfUpload" type="file" accept=".pdf,application/pdf" class="hidden" />
          </label>
        </div>
        <div class="flex flex-wrap gap-3 text-xs font-bold">
          <label class="flex items-center gap-1.5"><input id="asylDownloadOk" type="checkbox" checked class="accent-[#14532D]" /> Legal Download Permitted</label>
          <label class="flex items-center gap-1.5"><input id="asylPublished" type="checkbox" checked class="accent-[#14532D]" /> Published</label>
        </div>
        <button type="submit" class="w-full py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">Save University Syllabus</button>
      </form>

      <div class="lg:col-span-7 gv-card p-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-base font-extrabold text-[#14532D]">Cloud University Syllabi (${filtered.length} / ${rawSyllabi.length})</h3>
          <span class="text-[11px] font-bold text-[#496052]">ICAR 5th Deans' Baseline Always Preserved</span>
        </div>
        ${renderCmsFilterToolbar(cms)}
        ${filtered.length === 0 ? `
          <div class="rounded-2xl border border-dashed border-[#CDE0D3] p-6 text-center text-xs text-[#64748B]">
            No custom cloud university syllabi match this filter yet.
          </div>
        ` : `
          <div class="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            ${filtered.map((s) => `
              <div class="rounded-2xl border border-[#CDE0D3] p-3.5 bg-[#F7F9F5] space-y-1.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                    ${renderStatusBadge(s.published !== false)}
                    <span class="px-2 py-0.5 rounded-full bg-[#14532D] text-white">${escapeHtml(s.universityShort)}</span>
                    <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[#14532D]">Sem ${escapeHtml(s.semester)}</span>
                    ${s.academicSession ? `<span class="px-2 py-0.5 rounded-full bg-sky-100 text-sky-900">Session ${escapeHtml(s.academicSession)}</span>` : ""}
                    <span class="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900">${escapeHtml(s.publicationYear)}</span>
                  </div>
                  <div class="flex gap-1.5 shrink-0">
                    <button type="button" data-cms-toggle-syl="${escapeHtml(s.id)}" data-next-pub="${s.published !== false ? "0" : "1"}" class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${s.published !== false ? "bg-amber-100 text-amber-950" : "bg-emerald-600 text-white"}">
                      ${s.published !== false ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" data-admin-edit-syl="${escapeHtml(s.id)}" class="px-2.5 py-1 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-bold">Edit</button>
                    <button type="button" data-admin-del-syl="${escapeHtml(s.id)}" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold">Delete</button>
                  </div>
                </div>
                <div class="text-sm font-extrabold text-[#132219]">${escapeHtml(s.subject)} — ${escapeHtml(s.university)}</div>
                <div class="text-[11px] text-[#496052]">${escapeHtml(s.course)} • ${(s.topics || []).length} topics${s.pdfUrl ? " • PDF Attached" : ""}</div>
                ${renderDateMetaRow(s)}
              </div>
            `).join("")}
          </div>
        `}
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// SUB-TAB 6: AGRICULTURAL LEARNING RESOURCES (ALL 7 CATEGORIES — MANUAL CRUD)
// ----------------------------------------------------------------------------
function renderCmsResourcesSection(state, cms) {
  const allRes = state.discoveredStudyResources || [];
  const filtered = filterCmsRecords(allRes, cms);

  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form id="adminResourceForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
        <div class="flex items-center justify-between">
          <h3 id="aresFormTitle" class="text-base font-extrabold text-[#14532D]">Add Agricultural Learning Resource</h3>
          <button id="aresCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
        </div>
        <p class="text-[11px] text-[#496052]">Manually publish verified ICAR resources, university materials, research papers, government publications, educational YouTube playlists, reference books, and official notifications.</p>
        <input id="aresEditId" type="hidden" value="" />
        <input id="aresTitle" type="text" required minlength="2" maxlength="150" placeholder="Resource Title *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
        <div class="grid grid-cols-2 gap-2">
          <select id="aresCategory" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
            ${LEARNING_RESOURCE_CATEGORIES.map((c) => `<option value="${c.key}">${escapeHtml(c.en)}</option>`).join("")}
          </select>
          <select id="aresSubjectKey" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
            ${AGRI_SUBJECTS.map((s) => `<option value="${s.key}">${escapeHtml(s.en)}</option>`).join("")}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input id="aresSourceWebsite" type="text" required minlength="2" maxlength="140" placeholder="Institution / Publisher (e.g. ICAR / TNAU) *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="aresTopic" type="text" required minlength="2" maxlength="120" placeholder="Topic / Focus Area *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <div class="grid grid-cols-3 gap-2">
          <select id="aresLanguage" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
            ${EDU_LANGUAGES.map((l) => `<option value="${l.key}">${escapeHtml(l.label)}</option>`).join("")}
          </select>
          <select id="aresOrigin" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
            <option value="OFFICIAL_ICAR">ICAR Official</option>
            <option value="UNIVERSITY">Agri University</option>
            <option value="GOVT">Govt Institution</option>
            <option value="RESEARCH">Peer Research</option>
            <option value="CURATED">Educational</option>
          </select>
          <input id="aresPubDate" type="date" value="${new Date().toISOString().slice(0, 10)}" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <input id="aresSourceUrl" type="url" required maxlength="400" placeholder="Official Resource / Playlist / Notification URL (https://...) *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <textarea id="aresSummary" rows="3" maxlength="500" placeholder="Concise description for students..." class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
        <select id="aresStatus" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
          <option value="APPROVED_PUBLISHED">Published (Visible in Student Zone)</option>
          <option value="PENDING_REVIEW">Draft / Pending Review Queue</option>
        </select>
        <button type="submit" class="w-full py-3 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">Save Learning Resource</button>
      </form>

      <div class="lg:col-span-7 gv-card p-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-base font-extrabold text-[#14532D]">Agricultural Learning Resources (${filtered.length} / ${allRes.length})</h3>
          <span class="text-[11px] font-bold text-[#496052]">${allRes.filter((r) => r.reviewStatus === "APPROVED_PUBLISHED").length} Published • ${allRes.filter((r) => r.reviewStatus === "PENDING_REVIEW").length} Pending</span>
        </div>
        ${renderCmsFilterToolbar(cms, {
          showCategory: true,
          showPendingOption: true,
          categoryOptions: LEARNING_RESOURCE_CATEGORIES.map((c) => ({ key: c.key, label: c.en }))
        })}
        ${filtered.length === 0 ? `
          <div class="rounded-2xl border border-dashed border-[#CDE0D3] p-6 text-center text-xs text-[#64748B]">
            No learning resources match this filter yet. Add official resources manually or approve items from the Auto-Discovery Queue.
          </div>
        ` : `
          <div class="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            ${filtered.map((r) => {
              const catMeta = LEARNING_RESOURCE_CATEGORY_MAP[r.category] || LEARNING_RESOURCE_CATEGORY_MAP.ICAR_RESOURCE;
              const href = safeUrl(r.sourceUrl);
              return `
                <div class="rounded-2xl border border-[#CDE0D3] p-3.5 bg-[#F7F9F5] space-y-1.5">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                      ${renderStatusBadge(false, r.reviewStatus)}
                      <span class="px-2 py-0.5 rounded-full ${catMeta.badge}">${escapeHtml(catMeta.en)}</span>
                      <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[#14532D]">${escapeHtml(AGRI_SUBJECT_MAP[r.subjectKey]?.en || r.subjectKey)}</span>
                      <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">${escapeHtml(r.discoveryMethod || "ADMIN_SUBMITTED")}</span>
                    </div>
                    <div class="flex gap-1.5 shrink-0">
                      <button type="button" data-admin-review-disc="${escapeHtml(r.id)}" data-review-status="${r.reviewStatus === "APPROVED_PUBLISHED" ? "PENDING_REVIEW" : "APPROVED_PUBLISHED"}" class="px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${r.reviewStatus === "APPROVED_PUBLISHED" ? "bg-amber-100 text-amber-950" : "bg-emerald-600 text-white"}">
                        ${r.reviewStatus === "APPROVED_PUBLISHED" ? "Unpublish" : "Publish"}
                      </button>
                      <button type="button" data-cms-edit-res="${escapeHtml(r.id)}" class="px-2.5 py-1 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-bold">Edit</button>
                      <button type="button" data-admin-del-disc="${escapeHtml(r.id)}" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold">Delete</button>
                    </div>
                  </div>
                  <div class="text-sm font-extrabold text-[#132219]">${escapeHtml(r.title)}</div>
                  <div class="text-[11px] text-[#496052]">
                    ${escapeHtml(r.sourceWebsite)} • ${escapeHtml(r.topic)}
                    ${href ? ` • <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="underline text-[#14532D] font-bold">Open Source ↗</a>` : ""}
                  </div>
                  ${renderDateMetaRow(r)}
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// SUB-TAB 7: AUTOMATIC DISCOVERY & ADMIN REVIEW QUEUE
// ----------------------------------------------------------------------------
function renderCmsDiscoveryQueueSection(state) {
  const discovered = state.discoveredStudyResources || [];
  const pendingQueue = discovered.filter((r) => r.reviewStatus === "PENDING_REVIEW");
  const liveCandidates = state.edu?.liveDiscoveryCandidates || [];
  const discoveryLoading = Boolean(state.edu?.discoveryLoading);
  const discoveryStatus = state.edu?.discoveryStatus || "";

  return `
    <div class="space-y-5">
      <div class="gv-card p-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-extrabold text-[#14532D]">Automatic Official Resource Discovery → Admin Review Queue</h3>
            <p class="text-xs text-[#496052]">
              Queries ONLY reliable permitted official RSS feeds &amp; open APIs (PIB Ministry of Agriculture RSS, FAO RSS, OpenAlex Open-Access Indian Agri Research API). All newly discovered items go into the Admin Review Queue before publication. Never invents notes, PYQs, or syllabus updates.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <input id="adminDiscoveryQuery" type="text" placeholder="Optional topic (e.g. ICAR, Soil, Agronomy)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs bg-white" />
            <button type="button" data-admin-run-discovery="1" ${discoveryLoading ? "disabled" : ""} class="px-4 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
              ${discoveryLoading ? "Scanning Official Sources..." : "🔄 Discover Official Resources"}
            </button>
          </div>
        </div>

        ${discoveryStatus ? `
          <div class="rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] px-3.5 py-2 text-xs font-bold text-[#14532D]">${escapeHtml(discoveryStatus)}</div>
        ` : ""}

        ${liveCandidates.length > 0 ? `
          <div class="space-y-2 pt-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h4 class="text-xs font-extrabold uppercase tracking-wider text-[#15803D]">Newly Discovered Candidates (${liveCandidates.length}) — Send to Review Queue</h4>
              <button type="button" data-cms-queue-all-candidates="1" class="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0C3B20] text-[11px] font-extrabold">
                Send All New to Review Queue
              </button>
            </div>
            <div class="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              ${liveCandidates.map((c, idx) => {
                const href = safeUrl(c.sourceUrl);
                return `
                  <div class="rounded-2xl border ${c.isDuplicate ? "border-amber-200 bg-amber-50/40" : "border-[#CDE0D3] bg-[#F7F9F5]"} p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div class="min-w-0 space-y-0.5">
                      <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                        <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[#14532D]">${escapeHtml(c.discoveryMethod)} • ${escapeHtml(c.subjectKey)}</span>
                        <span class="px-2 py-0.5 rounded-full bg-sky-100 text-sky-900">${escapeHtml(c.category)}</span>
                        <span class="text-[#496052]">${escapeHtml(c.publicationDate)}</span>
                        ${c.isDuplicate ? `<span class="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950">ALREADY IN CATALOG</span>` : ""}
                      </div>
                      <div class="text-xs sm:text-sm font-extrabold text-[#132219]">${escapeHtml(c.title)}</div>
                      <div class="text-[11px] text-[#496052]">
                        ${escapeHtml(c.sourceWebsite)} • ${escapeHtml(c.topic)}
                        ${href ? ` • <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="underline text-[#14532D] font-bold">Verify Official Source ↗</a>` : ""}
                      </div>
                    </div>
                    <div class="flex gap-1.5 shrink-0">
                      <button type="button" data-admin-queue-candidate="${idx}" ${c.isDuplicate ? "disabled" : ""} class="px-3 py-1.5 rounded-lg ${c.isDuplicate ? "bg-slate-200 text-slate-500" : "bg-amber-400 text-[#0C3B20]"} text-xs font-extrabold">
                        Add to Review Queue
                      </button>
                      <button type="button" data-admin-approve-candidate="${idx}" ${c.isDuplicate ? "disabled" : ""} class="px-3 py-1.5 rounded-lg ${c.isDuplicate ? "bg-slate-200 text-slate-500" : "bg-[#14532D] text-white"} text-xs font-extrabold">
                        Verify &amp; Publish
                      </button>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        ` : ""}
      </div>

      <!-- Pending Review Queue in Firestore -->
      <div class="gv-card p-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-base font-extrabold text-[#14532D]">Admin Review Queue — Awaiting Publication (${pendingQueue.length})</h3>
          <span class="text-[11px] font-bold text-[#496052]">Total Stored Resources: ${discovered.length}</span>
        </div>
        ${pendingQueue.length === 0 ? `
          <div class="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-5 text-xs text-[#475569]">
            Review Queue is clear. Run Automatic Discovery above to check PIB Agriculture RSS, FAO RSS, and OpenAlex for new open-access research and official announcements.
          </div>
        ` : `
          <div class="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            ${pendingQueue.map((r) => {
              const href = safeUrl(r.sourceUrl);
              return `
                <div class="rounded-2xl border border-amber-200 bg-amber-50/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="min-w-0 space-y-1">
                    <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                      ${renderStatusBadge(false, r.reviewStatus)}
                      <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[#14532D]">${escapeHtml(r.category)}</span>
                      <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">${escapeHtml(r.discoveryMethod)}</span>
                    </div>
                    <div class="text-sm font-extrabold text-[#132219]">${escapeHtml(r.title)}</div>
                    <div class="text-[11px] text-[#496052]">
                      ${escapeHtml(r.sourceWebsite)} • ${escapeHtml(r.topic)}
                      ${href ? ` • <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="underline text-[#14532D] font-bold">Inspect Source ↗</a>` : ""}
                    </div>
                    ${renderDateMetaRow(r)}
                  </div>
                  <div class="flex flex-wrap gap-1.5 shrink-0">
                    <button type="button" data-admin-review-disc="${escapeHtml(r.id)}" data-review-status="APPROVED_PUBLISHED" class="px-3 py-1.5 rounded-lg bg-[#14532D] text-white text-xs font-extrabold">Approve &amp; Publish</button>
                    <button type="button" data-admin-review-disc="${escapeHtml(r.id)}" data-review-status="REJECTED" class="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-950 text-xs font-bold">Reject</button>
                    <button type="button" data-admin-del-disc="${escapeHtml(r.id)}" class="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">Delete</button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>

      <!-- Honest Automatic vs Manual Source Policy -->
      <div class="gv-card p-5 space-y-2.5">
        <h4 class="text-sm font-extrabold text-[#14532D]">Official Source Integration Policy (Automatic Feeds vs. Manual Admin Updates)</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          ${EDUCATION_SOURCE_CAPABILITIES.map((src) => `
            <div class="rounded-xl border border-[#CDE0D3] p-3 bg-white flex items-start justify-between gap-2 text-xs">
              <div class="space-y-0.5">
                <div class="font-extrabold text-[#132219]">${escapeHtml(src.name)}</div>
                <div class="text-[11px] text-[#496052]">${escapeHtml(src.method)}</div>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${src.autoSupported ? "bg-emerald-100 text-emerald-950" : "bg-amber-100 text-amber-950"}">
                ${src.autoSupported ? "Auto Feed" : "Manual CMS"}
              </span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// MAIN EXPORT: ORGANIZED ADMIN EDUCATION CONTENT MANAGEMENT STUDIO
// ----------------------------------------------------------------------------
export function renderAdminEducationCmsView(state) {
  const cms = state.eduCms || {
    activeSection: "notes",
    search: "",
    subjectKey: "ALL",
    category: "ALL",
    status: "ALL"
  };

  const mats = state.studyMaterials || [];
  const notesCount = mats.filter((m) => m.category === "NOTES_PDF" || m.category === "PRACTICAL").length;
  const videosCount = mats.filter((m) => m.category === "VIDEO_LECTURE").length;
  const pyqsCount = mats.filter((m) => m.category === "PYQ").length;
  const mcqCount = (state.quizzes || []).length;
  const testCount = (state.mockTests || []).length;
  const sylCount = (state.universitySyllabi || []).length;
  const resList = state.discoveredStudyResources || [];
  const pendingCount = resList.filter((r) => r.reviewStatus === "PENDING_REVIEW").length;

  const sections = [
    ["notes", `Notes & Docs (${notesCount})`],
    ["videos", `Video Learning (${videosCount})`],
    ["mcqs", `MCQs (${mcqCount}) & Tests (${testCount})`],
    ["pyqs", `Official PYQs (${pyqsCount})`],
    ["syllabus", `Syllabus (${sylCount})`],
    ["resources", `Learning Resources (${resList.length})`],
    ["discovery", `Review Queue (${pendingCount})`]
  ];

  const active = cms.activeSection || "notes";

  return `
    <div data-module="admin-education-cms" class="space-y-4">
      <!-- CMS Header & KPI Strip -->
      <div class="gv-card p-4 sm:p-5 space-y-3 bg-gradient-to-br from-[#F1F8F3] to-white">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span class="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#14532D] text-[10px] font-extrabold uppercase tracking-wider">Student Zone Content Management System</span>
            <h3 class="font-display text-lg sm:text-xl font-bold text-[#14532D] mt-1">Education CMS — Notes, Videos, MCQs, Mock Tests, PYQs, Syllabus &amp; Resources</h3>
          </div>
          <button type="button" data-nav="student" data-from-zone="student-zone" class="px-3.5 py-2 rounded-xl bg-white hover:bg-[#ECFDF5] border border-[#CDE0D3] text-[#14532D] text-xs font-extrabold">
            Preview Student View ↗
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center">
          ${[
            ["Notes & Docs", notesCount, "notes"],
            ["Videos", videosCount, "videos"],
            ["MCQs", mcqCount, "mcqs"],
            ["Mock Tests", testCount, "mcqs"],
            ["PYQ Papers", pyqsCount, "pyqs"],
            ["Syllabi", sylCount, "syllabus"],
            ["Review Queue", pendingCount, "discovery"]
          ].map(([label, val, secKey]) => `
            <button type="button" data-cms-section="${secKey}" class="rounded-xl p-2.5 border transition-colors text-left ${
              active === secKey ? "bg-[#14532D] text-white border-[#14532D]" : "bg-white border-[#D9EAE0] hover:bg-[#ECFDF5] text-[#14532D]"
            }">
              <div class="text-lg font-extrabold leading-tight">${val}</div>
              <div class="text-[10px] font-bold opacity-85 truncate">${label}</div>
            </button>
          `).join("")}
        </div>
      </div>

      <!-- Organized CMS Section Navigation -->
      <nav class="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-[#EDF4EE] p-1.5 rounded-2xl border border-[#D9EAE0]" aria-label="Education CMS Sections">
        ${sections.map(([k, label]) => `
          <button type="button" data-cms-section="${k}" class="shrink-0 min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors ${
            active === k ? "bg-[#14532D] text-white shadow-sm" : "text-[#14532D] hover:bg-white/75"
          }">${escapeHtml(label)}</button>
        `).join("")}
      </nav>

      <!-- Active CMS Workspace -->
      ${active === "notes" ? renderCmsNotesSection(state, cms) : ""}
      ${active === "videos" ? renderCmsVideosSection(state, cms) : ""}
      ${active === "mcqs" ? renderCmsMcqAndTestsSection(state, cms) : ""}
      ${active === "pyqs" ? renderCmsPyqSection(state, cms) : ""}
      ${active === "syllabus" ? renderCmsSyllabusSection(state, cms) : ""}
      ${active === "resources" ? renderCmsResourcesSection(state, cms) : ""}
      ${active === "discovery" ? renderCmsDiscoveryQueueSection(state) : ""}
    </div>
  `;
}
