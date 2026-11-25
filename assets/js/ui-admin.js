// ============================================================================
// Guru Ji Vision — Admin Panel & Founder Owner Control Center Renderers
// Strictly verified via Firebase Auth & Firestore Rules (NO hardcoded secrets)
// NEVER reads or exposes private student Money Manager or private Doubt Chats
// ============================================================================

import { escapeHtml, formatDateShort, safeUrl } from "./calculators.js";
import { INDIA_STATES_AND_UTS } from "./india-mandi-directory.js";
import {
  SCHEME_CATEGORIES,
  SCHEME_STATUSES,
  evaluateSchemeVerification,
  mergeAgricultureSchemes
} from "./govt-schemes-data.js";
import {
  AGRI_SUBJECTS,
  DIFFICULTY_META,
  EXAM_PREP_CATEGORIES,
  QUESTION_PROVENANCE_META
} from "./agri-education-data.js";
import { renderAdminSyllabusDiscoveryTab } from "./agri-education-ui.js";

// ----------------------------------------------------------------------------
// 1. ADMIN DASHBOARD
// ----------------------------------------------------------------------------
export function renderAdminView(state) {
  if (!state.user || !state.isAdmin) {
    return `
      <div class="max-w-lg mx-auto gv-card p-6 sm:p-8 text-center space-y-4 animate-fade-up">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center text-2xl">🛡️</div>
        <h2 class="font-display text-2xl font-bold text-[#14532D]">Authorized Admin Access Required</h2>
        <p class="text-sm text-[#496052] leading-relaxed">
          Administrative controls are strictly protected by Firebase Authentication and Firestore Security Rules. Sign in with your verified Founder or authorized Admin account to manage notes, quizzes, notices, meetings, faculty, and settings.
        </p>
        ${!state.user ? `
          <button data-action="open-auth" class="w-full py-3 rounded-2xl bg-[#14532D] text-white text-sm font-extrabold">Sign In with Authorized Account</button>
        ` : `
          <div class="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-800">
            Signed in as ${escapeHtml(state.user.email || state.user.phoneNumber || state.user.uid)} — This account does not have Admin permissions.
          </div>
        `}
      </div>
    `;
  }

  const sub = state.adminSubTab || "materials";
  const tabs = [
    ["materials", "Notes & PDFs"],
    ["quizzes", "MCQs"],
    ["syllabus-discovery", "Syllabus & Discovery"],
    ["notices", "Notices"],
    ["market", "Market Prices"],
    ["schemes", "Govt Schemes"],
    ["careers", "Jobs/Careers"],
    ["farmer", "Farmer Queries"],
    ["professors", "9 Advisors"],
    ["community", "Moderation"],
    ["settings", "Settings & Roles"]
  ];

  return `
    <div class="space-y-4 animate-fade-up">
      <div class="gv-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="font-display text-xl sm:text-2xl font-bold text-[#14532D]">Admin Control Studio</h2>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#14532D]">
              ${state.isSuperAdmin ? "Founder / Super Admin" : "Authorized Admin"}
            </span>
          </div>
          <p class="text-xs text-[#496052] mt-0.5">Live Firebase Firestore sync • Private student/farmer Money Manager &amp; 1-on-1 Consultations remain strictly inaccessible.</p>
        </div>
        ${state.isSuperAdmin ? `
          <button data-nav="owner" class="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0C3B20] text-xs font-extrabold shrink-0">
            Open Owner Telemetry →
          </button>
        ` : ""}
      </div>

      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        ${tabs.map(([k, label]) => `
          <button data-admin-sub="${k}" class="shrink-0 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors ${
            sub === k ? "bg-[#14532D] text-white" : "bg-white border border-[#CDE0D3] text-[#14532D]"
          }">${label}</button>
        `).join("")}
      </div>

      ${sub === "materials" ? renderAdminMaterials(state) : ""}
      ${sub === "quizzes" ? renderAdminQuizzes(state) : ""}
      ${sub === "syllabus-discovery" ? renderAdminSyllabusDiscoveryTab(state) : ""}
      ${sub === "notices" ? renderAdminNotices(state) : ""}
      ${sub === "market" ? renderAdminMarketPrices(state) : ""}
      ${sub === "schemes" ? renderAdminSchemes(state) : ""}
      ${sub === "careers" ? renderAdminCareers(state) : ""}
      ${sub === "farmer" ? renderAdminFarmerQueries(state) : ""}
      ${sub === "professors" ? renderAdminProfessors(state) : ""}
      ${sub === "community" ? renderAdminModeration(state) : ""}
      ${sub === "settings" ? renderAdminSettings(state) : ""}
    </div>
  `;
}

function renderAdminMaterials(state) {
  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form id="adminMaterialForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
        <div class="flex items-center justify-between">
          <h3 id="amFormTitle" class="text-base font-extrabold text-[#14532D]">Add Study Material / PDF</h3>
          <button id="amCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel</button>
        </div>
        <input id="amEditId" type="hidden" value="" />
        <input id="amTitle" type="text" required minlength="2" maxlength="150" placeholder="Title (English) *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
        <input id="amTitleBn" type="text" maxlength="180" placeholder="Bengali Title (optional)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <div class="grid grid-cols-2 gap-2">
          <select id="amSemester" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-sm">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map((s) => `<option value="${s}">Semester ${s}</option>`).join("")}
          </select>
          <select id="amCategory" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-sm">
            <option value="NOTES_PDF">Notes &amp; PDFs</option>
            <option value="PYQ">PYQ Papers</option>
            <option value="PRACTICAL">Practical</option>
            <option value="VIDEO_LECTURE">Video Lecture</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <select id="amSubjectKey" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
            ${AGRI_SUBJECTS.map((s) => `<option value="${s.key}">${escapeHtml(s.en)}</option>`).join("")}
          </select>
          <input id="amSubject" type="text" required minlength="2" maxlength="80" placeholder="Subject Label *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <input id="amTopic" type="text" maxlength="120" placeholder="Topic / Chapter (e.g. Tillage, IPM, Soil Colloids)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <div class="space-y-1.5">
          <input id="amUrl" type="url" maxlength="400" placeholder="PDF / Official Resource URL (https://...)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <label class="inline-flex items-center gap-2 text-xs font-bold text-[#1E7E45] cursor-pointer">
            <span>⬆️ Or upload PDF to Firebase Storage</span>
            <input id="amPdfUpload" type="file" accept="application/pdf" class="hidden" />
          </label>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input id="amSourceName" type="text" maxlength="140" placeholder="Source Name (e.g. ICAR e-Courses)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="amLastUpdated" type="date" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <input id="amSourceUrl" type="url" maxlength="400" placeholder="Official Source / Reference URL (optional)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <input id="amReference" type="text" maxlength="300" placeholder="Citation / Book Reference (optional)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <select id="amOrigin" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs">
          <option value="VERIFIED_FACULTY">Origin: Verified Faculty Notes</option>
          <option value="OFFICIAL_PUBLICATION">Origin: Official Publication / ICAR / University</option>
          <option value="CURATED_REFERENCE">Origin: Curated Academic Reference</option>
          <option value="AI_PRACTICE">Origin: AI-Assisted Study Summary (Reviewed)</option>
        </select>
        <textarea id="amSummary" rows="2" required minlength="5" maxlength="1000" placeholder="Summary *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm"></textarea>
        <textarea id="amContent" rows="4" maxlength="12000" placeholder="Full Notes Text (also indexed by AI Guru Knowledge Base)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm"></textarea>
        <div class="flex flex-wrap gap-3 text-xs font-bold">
          <label class="flex items-center gap-1.5"><input id="amPublished" type="checkbox" checked class="accent-[#14532D]" /> Published</label>
          <label class="flex items-center gap-1.5"><input id="amVerifiedAi" type="checkbox" checked class="accent-[#14532D]" /> Verified for AI Guru</label>
          <label class="flex items-center gap-1.5"><input id="amDownloadOk" type="checkbox" class="accent-[#14532D]" /> Legal Download Permitted</label>
        </div>
        <button type="submit" class="w-full py-3 rounded-xl bg-[#14532D] text-white text-sm font-extrabold">Save Study Material</button>
      </form>

      <div class="lg:col-span-7 gv-card p-5 space-y-2.5">
        <h3 class="text-base font-extrabold text-[#14532D]">Published &amp; Draft Materials (${state.studyMaterials.length})</h3>
        <div class="space-y-2 max-h-[680px] overflow-y-auto">
          ${state.studyMaterials.map((m) => `
            <div class="rounded-2xl border border-[#CDE0D3] p-3.5 flex items-center justify-between gap-3 bg-[#F7F9F5]">
              <div class="min-w-0">
                <div class="text-xs font-bold text-[#1E7E45]">
                  Sem ${m.semester} • ${escapeHtml(m.subject)}${m.topic ? ` • ${escapeHtml(m.topic)}` : ""} • ${m.published ? "Live" : "Draft"}
                </div>
                <div class="text-sm font-extrabold text-[#132219] truncate">${escapeHtml(m.title)}</div>
                ${m.sourceName ? `<div class="text-[11px] text-[#496052] truncate">Source: ${escapeHtml(m.sourceName)} ${m.lastUpdatedDate ? `(${escapeHtml(m.lastUpdatedDate)})` : ""}</div>` : ""}
              </div>
              <div class="flex gap-1.5 shrink-0">
                <button data-edit-mat="${escapeHtml(m.id)}" class="px-3 py-1.5 rounded-lg bg-[#EDF4EE] text-[#14532D] text-xs font-bold">Edit</button>
                <button data-del-mat="${escapeHtml(m.id)}" class="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">Delete</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderAdminQuizzes(state) {
  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form id="adminQuizForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
        <div class="flex items-center justify-between">
          <h3 id="aqFormTitle" class="text-base font-extrabold text-[#14532D]">Add MCQ Question</h3>
          <button id="aqCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel</button>
        </div>
        <div class="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-950 font-semibold">
          Integrity Rule: Label Official PYQs ONLY when verified from an authentic official exam paper. Never label AI-generated or practice questions as Official PYQs.
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
        <textarea id="aqExplanation" rows="2" maxlength="500" placeholder="Detailed Explanation" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
        <label class="flex items-center gap-1.5 text-xs font-bold"><input id="aqPublished" type="checkbox" checked class="accent-[#14532D]" /> Published (Uncheck to hold in Admin review draft)</label>
        <button type="submit" class="w-full py-2.5 rounded-xl bg-[#14532D] text-white text-sm font-extrabold">Save MCQ Question</button>
      </form>

      <div class="lg:col-span-7 gv-card p-5 space-y-2.5">
        <h3 class="text-base font-extrabold text-[#14532D]">Cloud MCQ Bank (${state.quizzes.length})</h3>
        <div class="space-y-2 max-h-[680px] overflow-y-auto">
          ${state.quizzes.map((q) => {
            const prov = QUESTION_PROVENANCE_META[q.questionType] || QUESTION_PROVENANCE_META.PRACTICE;
            const diff = DIFFICULTY_META[q.difficulty] || DIFFICULTY_META.MEDIUM;
            return `
              <div class="rounded-2xl border border-[#CDE0D3] p-3.5 flex items-center justify-between gap-3 bg-[#F7F9F5]">
                <div class="min-w-0 space-y-1">
                  <div class="flex flex-wrap items-center gap-1 text-[10px] font-extrabold">
                    <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[#14532D]">Sem ${q.semester} • ${escapeHtml(q.subject)}</span>
                    <span class="px-2 py-0.5 rounded-full border ${prov.badgeClass}">${escapeHtml(prov.en)}</span>
                    <span class="px-2 py-0.5 rounded-full border ${diff.badgeClass}">${escapeHtml(diff.en)}</span>
                    <span class="px-2 py-0.5 rounded-full ${q.published !== false ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}">${q.published !== false ? "Published" : "Draft"}</span>
                  </div>
                  <div class="text-sm font-bold text-[#132219] truncate">${escapeHtml(q.questionText)}</div>
                </div>
                <div class="flex gap-1.5 shrink-0">
                  <button data-edit-quiz="${escapeHtml(q.id)}" class="px-3 py-1.5 rounded-lg bg-[#EDF4EE] text-[#14532D] text-xs font-bold">Edit</button>
                  <button data-del-quiz="${escapeHtml(q.id)}" class="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">Delete</button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderAdminNotices(state) {
  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form id="adminNoticeForm" class="lg:col-span-5 gv-card p-5 space-y-3 h-fit">
        <div class="flex items-center justify-between">
          <h3 id="anFormTitle" class="text-base font-extrabold text-[#14532D]">Publish Notice</h3>
          <button id="anCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel</button>
        </div>
        <input id="anEditId" type="hidden" value="" />
        <input id="anTitle" type="text" required minlength="2" maxlength="120" placeholder="Notice Title *" class="w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
        <select id="anAudience" class="w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm">
          <option value="ALL">All Users</option>
          <option value="STUDENTS">Students</option>
          <option value="FARMERS">Farmers</option>
        </select>
        <textarea id="anMessage" rows="3" required minlength="3" maxlength="500" placeholder="Notice Message *" class="w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm"></textarea>
        <label class="flex items-center gap-2 text-xs font-bold"><input id="anActive" type="checkbox" checked class="accent-[#14532D]" /> Active</label>
        <button type="submit" class="w-full py-3 rounded-xl bg-[#14532D] text-white text-sm font-extrabold">Save Notice</button>
      </form>

      <div class="lg:col-span-7 gv-card p-5 space-y-2.5">
        <h3 class="text-base font-extrabold text-[#14532D]">All Notices (${state.announcements.length})</h3>
        <div class="space-y-2">
          ${state.announcements.map((a) => `
            <div class="rounded-2xl border border-[#CDE0D3] p-3.5 flex items-center justify-between gap-3 bg-[#F7F9F5]">
              <div class="min-w-0">
                <div class="text-xs font-bold text-amber-800">${escapeHtml(a.audience)} • ${a.active ? "Active" : "Hidden"}</div>
                <div class="text-sm font-bold text-[#132219] truncate">${escapeHtml(a.title)}</div>
              </div>
              <div class="flex gap-1.5 shrink-0">
                <button data-edit-notice="${escapeHtml(a.id)}" class="px-3 py-1.5 rounded-lg bg-[#EDF4EE] text-[#14532D] text-xs font-bold">Edit</button>
                <button data-del-notice="${escapeHtml(a.id)}" class="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">Delete</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderAdminMarketPrices(state) {
  const list = state.firestoreMarketPrices || [];
  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form id="adminMarketPriceForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
        <div class="flex items-center justify-between">
          <h3 id="ampFormTitle" class="text-base font-extrabold text-[#14532D]">Publish Verified Mandi Price</h3>
          <button id="ampCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel</button>
        </div>
        <p class="text-[11px] text-[#496052]">Publish only official verified mandi / Sufal Bangla / AGMARKNET rates with exact source and date.</p>
        <input id="ampEditId" type="hidden" value="" />
        <div class="grid grid-cols-2 gap-2">
          <input id="ampCrop" type="text" required minlength="2" maxlength="80" placeholder="Crop (English) *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="ampCropBn" type="text" maxlength="80" placeholder="ফসলের নাম (বাংলা)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input id="ampState" type="text" required maxlength="60" value="West Bengal" placeholder="State *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="ampDistrict" type="text" required maxlength="80" placeholder="District *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input id="ampMarket" type="text" required maxlength="100" placeholder="Mandi / Market Name *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="ampUnit" type="text" required maxlength="40" value="₹ / Quintal" placeholder="Unit (₹ / Quintal)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <div class="grid grid-cols-3 gap-2">
          <input id="ampMin" type="number" required min="0" step="1" placeholder="Min ₹ *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs font-bold" />
          <input id="ampModal" type="number" required min="0" step="1" placeholder="Modal ₹ *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs font-bold" />
          <input id="ampMax" type="number" required min="0" step="1" placeholder="Max ₹ *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs font-bold" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <input id="ampDate" type="date" required value="${new Date().toISOString().slice(0, 10)}" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="ampSource" type="text" required minlength="2" maxlength="120" value="Govt. AGMARKNET / WB Agri Marketing" placeholder="Official Source *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <input id="ampSourceUrl" type="url" maxlength="400" placeholder="Official Verification URL (optional)" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <label class="flex items-center gap-2 text-xs font-bold"><input id="ampPublished" type="checkbox" checked class="accent-[#14532D]" /> Published Publicly</label>
        <button type="submit" class="w-full py-2.5 rounded-xl bg-[#14532D] text-white text-sm font-extrabold">Save Verified Market Price</button>
      </form>

      <div class="lg:col-span-7 gv-card p-5 space-y-2.5">
        <h3 class="text-base font-extrabold text-[#14532D]">Published Verified Mandi Rates (${list.length})</h3>
        ${list.length === 0 ? `<p class="text-xs text-[#496052]">No Admin-verified market prices added yet.</p>` : `
          <div class="space-y-2 max-h-[560px] overflow-y-auto">
            ${list.map((r) => `
              <div class="rounded-2xl border border-[#CDE0D3] p-3.5 flex items-center justify-between gap-3 bg-[#F7F9F5]">
                <div class="min-w-0">
                  <div class="text-xs font-bold text-[#1E7E45]">${escapeHtml(r.marketName)}, ${escapeHtml(r.district)} • ${escapeHtml(r.reportDate)}</div>
                  <div class="text-sm font-extrabold text-[#132219] truncate">${escapeHtml(r.cropName)} ${r.cropNameBn ? `(${escapeHtml(r.cropNameBn)})` : ""} — ₹${r.modalPrice} (${escapeHtml(r.unit)})</div>
                  <div class="text-[11px] text-[#496052] truncate">Min ₹${r.minPrice} • Max ₹${r.maxPrice} • ${escapeHtml(r.sourceName)}</div>
                </div>
                <div class="flex gap-1.5 shrink-0">
                  <button data-edit-mp="${escapeHtml(r.id)}" class="px-3 py-1.5 rounded-lg bg-[#EDF4EE] text-[#14532D] text-xs font-bold">Edit</button>
                  <button data-del-mp="${escapeHtml(r.id)}" class="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">Delete</button>
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    </div>
  `;
}

function renderAdminSchemes(state) {
  const allSchemes = mergeAgricultureSchemes(state.agricultureSchemes || [], true);
  const history = state.agricultureSchemeHistory || [];
  const today = new Date().toISOString().slice(0, 10);

  return `
    <div class="space-y-5">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Add / Edit Government Scheme Form -->
        <form id="adminSchemeForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
          <div class="flex items-center justify-between gap-2">
            <h3 id="asFormTitle" class="text-base font-extrabold text-[#14532D]">Add / Update Agriculture Govt Scheme</h3>
            <button id="asCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
          </div>
          <p class="text-[11px] text-[#496052]">
            Publish only verified official Central, State, or District agriculture schemes with official source URLs and verification dates. Never invent benefits or deadlines.
          </p>
          <input id="asEditCloudId" type="hidden" value="" />
          <input id="asSlug" type="hidden" value="" />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input id="asName" type="text" required minlength="2" maxlength="200" placeholder="Scheme Name (English) *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
            <input id="asNameBn" type="text" maxlength="220" placeholder="প্রকল্পের নাম (বাংলা)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select id="asCategory" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
              ${SCHEME_CATEGORIES.map((c) => `<option value="${escapeHtml(c.key)}">${escapeHtml(c.en)}</option>`).join("")}
            </select>
            <select id="asLevel" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
              <option value="CENTRAL">Central Government</option>
              <option value="STATE">State Government</option>
              <option value="DISTRICT">District Level Programme</option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select id="asState" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
              <option value="All India">All India</option>
              <option value="Participating States">Participating States</option>
              ${INDIA_STATES_AND_UTS.map((s) => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("")}
            </select>
            <select id="asStatus" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
              ${SCHEME_STATUSES.map((st) => `<option value="${escapeHtml(st.key)}">${escapeHtml(st.en)}</option>`).join("")}
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input id="asRegion" type="text" maxlength="220" placeholder="Applicable Region (English)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
            <input id="asRegionBn" type="text" maxlength="240" placeholder="প্রযোজ্য অঞ্চল (বাংলা)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          </div>
          <input id="asDistricts" type="text" maxlength="400" placeholder="Focused Districts (comma-separated, leave blank for all districts)" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />

          <textarea id="asPurpose" rows="2" required minlength="2" maxlength="1200" placeholder="Scheme Purpose (English) *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
          <textarea id="asPurposeBn" rows="2" maxlength="1400" placeholder="প্রকল্পের উদ্দেশ্য (বাংলা)" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>

          <textarea id="asBenefits" rows="2" required minlength="2" maxlength="1500" placeholder="Verified Benefits (English) *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
          <textarea id="asBenefitsBn" rows="2" maxlength="1700" placeholder="যাচাইকৃত সুবিধাসমূহ (বাংলা)" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>

          <details class="rounded-xl bg-[#F7F9F5] border border-[#CDE0D3] p-3 space-y-2">
            <summary class="text-xs font-extrabold text-[#14532D] cursor-pointer">Eligibility Criteria &amp; Exclusions (EN + বাংলা)</summary>
            <div class="space-y-2 pt-2">
              <input id="asEligCat" type="text" maxlength="600" placeholder="Eligible Farmer Categories (EN)" class="w-full px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
              <input id="asEligCatBn" type="text" maxlength="700" placeholder="কোন কৃষকরা যোগ্য (বাংলা)" class="w-full px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
              <input id="asEligLand" type="text" maxlength="500" placeholder="Landholding Requirement (EN)" class="w-full px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
              <input id="asEligLandBn" type="text" maxlength="600" placeholder="জমির শর্ত (বাংলা)" class="w-full px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
              <input id="asEligTenant" type="text" maxlength="500" placeholder="Tenant / Sharecropper Eligibility (EN)" class="w-full px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
              <input id="asEligTenantBn" type="text" maxlength="600" placeholder="ভাগচাষী / ভূমিহীন যোগ্যতা (বাংলা)" class="w-full px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
              <input id="asEligWomen" type="text" maxlength="500" placeholder="Women Farmer Eligibility (EN)" class="w-full px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
              <input id="asEligWomenBn" type="text" maxlength="600" placeholder="মহিলা কৃষক যোগ্যতা (বাংলা)" class="w-full px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
              <div class="grid grid-cols-2 gap-1.5">
                <input id="asEligAge" type="text" maxlength="240" placeholder="Age Limit (EN)" class="px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
                <input id="asEligAgeBn" type="text" maxlength="260" placeholder="বয়সসীমা (বাংলা)" class="px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
                <input id="asEligIncome" type="text" maxlength="400" placeholder="Income Limit (EN)" class="px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
                <input id="asEligIncomeBn" type="text" maxlength="450" placeholder="আয়সীমা (বাংলা)" class="px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
                <input id="asEligRes" type="text" maxlength="400" placeholder="Residency (EN)" class="px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
                <input id="asEligResBn" type="text" maxlength="450" placeholder="বাসিন্দা শর্ত (বাংলা)" class="px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white" />
              </div>
              <textarea id="asWhoCan" rows="2" placeholder="Who Can Apply (EN — one bullet per line)" class="w-full px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white"></textarea>
              <textarea id="asWhoCanBn" rows="2" placeholder="কারা আবেদন করতে পারবেন (বাংলা — প্রতি লাইনে একটি)" class="w-full px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white"></textarea>
              <textarea id="asWhoCannot" rows="2" placeholder="Who Cannot Apply (EN — one bullet per line)" class="w-full px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white"></textarea>
              <textarea id="asWhoCannotBn" rows="2" placeholder="কারা আবেদন করতে পারবেন না (বাংলা — প্রতি লাইনে একটি)" class="w-full px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs bg-white"></textarea>
            </div>
          </details>

          <div>
            <label for="asDocs" class="block text-[11px] font-bold text-[#14532D] mb-1">Required Documents (1 per line: English | বাংলা | mandatory or optional)</label>
            <textarea id="asDocs" rows="3" placeholder="Aadhaar Card | আধার কার্ড | mandatory&#10;Land Parcha (RoR) | জমির পর্চা | mandatory&#10;Caste Certificate | জাতিগত শংসাপত্র | optional" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
          </div>

          <textarea id="asOnline" rows="2" maxlength="1500" placeholder="Online Application Process (English)" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
          <textarea id="asOnlineBn" rows="2" maxlength="1700" placeholder="অনলাইন আবেদন পদ্ধতি (বাংলা)" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
          <input id="asPortalUrl" type="url" maxlength="400" placeholder="Official Application Portal URL (https://...)" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />

          <textarea id="asOffline" rows="2" maxlength="1200" placeholder="Offline Application Process (CSC / Block Office / Bank)" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
          <textarea id="asOfflineBn" rows="2" maxlength="1400" placeholder="অফলাইন আবেদন পদ্ধতি (বাংলা)" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input id="asDept" type="text" required minlength="2" maxlength="200" placeholder="Government Department (EN) *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
            <input id="asDeptBn" type="text" maxlength="220" placeholder="সরকারি দপ্তর (বাংলা)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
            <input id="asHelpline" type="text" maxlength="180" placeholder="Verified Helpline (EN)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
            <input id="asHelplineBn" type="text" maxlength="200" placeholder="অফিশিয়াল হেল্পলাইন (বাংলা)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
            <input id="asHelplineTel" type="text" maxlength="30" placeholder="Dialable Tel (digits only, e.g. 18001801551)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
            <input id="asVerifiedDate" type="date" value="${today}" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
            <input id="asDeadline" type="text" maxlength="240" placeholder="Application Deadline (EN)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
            <input id="asDeadlineBn" type="text" maxlength="260" placeholder="আবেদনের সময়সীমা (বাংলা)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          </div>

          <input id="asSourceUrl" type="url" required maxlength="400" placeholder="Official Verification Source URL (https://...) *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="asSourceName" type="text" maxlength="180" placeholder="Official Source Name (e.g. Ministry of Agriculture)" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="asUpdateNote" type="text" maxlength="400" placeholder="Update History Note (what changed in this review?)" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />

          <div class="flex flex-wrap gap-4 text-xs font-bold pt-1">
            <label class="flex items-center gap-1.5"><input id="asPublished" type="checkbox" checked class="accent-[#14532D]" /> Published Publicly</label>
            <label class="flex items-center gap-1.5"><input id="asWomenEligible" type="checkbox" checked class="accent-[#14532D]" /> Women Farmer Eligible</label>
          </div>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-[#14532D] text-white text-sm font-extrabold">Save Government Scheme</button>
        </form>

        <!-- Managed Schemes Directory & Quick Moderation -->
        <div class="lg:col-span-7 space-y-4">
          <div class="gv-card p-5 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-base font-extrabold text-[#14532D]">Managed Schemes Directory (${allSchemes.length})</h3>
              <span class="text-[11px] font-bold text-[#496052]">
                ${(state.agricultureSchemes || []).length} Cloud Overrides/Additions • ${allSchemes.filter((s) => s.published !== false).length} Public
              </span>
            </div>
            <div class="space-y-2 max-h-[520px] overflow-y-auto">
              ${allSchemes.map((s) => {
                const verif = evaluateSchemeVerification(s);
                const srcHref = safeUrl(s.officialSourceUrl || s.officialPortalUrl);
                return `
                  <div class="rounded-2xl border border-[#CDE0D3] p-3.5 bg-[#F7F9F5] space-y-2">
                    <div class="flex flex-wrap items-start justify-between gap-2">
                      <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                          <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[#14532D]">${escapeHtml(s.govtLevel)} • ${escapeHtml(s.applicableState)}</span>
                          <span class="px-2 py-0.5 rounded-full border ${verif.badgeClass}">${escapeHtml(verif.en)}</span>
                          <span class="px-2 py-0.5 rounded-full ${s.published !== false ? "bg-emerald-100 text-emerald-900" : "bg-slate-200 text-slate-700"}">${s.published !== false ? "Published" : "Unpublished"}</span>
                          <span class="px-2 py-0.5 rounded-full ${s.fromCloud ? "bg-indigo-100 text-indigo-900" : "bg-slate-100 text-slate-600"}">${s.fromCloud ? "Firestore Cloud" : "Verified Baseline"}</span>
                        </div>
                        <div class="text-sm font-extrabold text-[#132219] mt-1">${escapeHtml(s.name)}</div>
                        ${s.nameBn ? `<div class="text-xs font-semibold text-[#1E7E45]">${escapeHtml(s.nameBn)}</div>` : ""}
                        <div class="text-[11px] text-[#496052] mt-0.5">
                          Status: <strong>${escapeHtml(s.status)}</strong> • Verified: ${escapeHtml(s.lastVerifiedDate || "—")}
                          ${srcHref ? ` • <a href="${escapeHtml(srcHref)}" target="_blank" rel="noopener noreferrer" class="underline text-[#14532D]">Official Source ↗</a>` : ""}
                        </div>
                      </div>
                      <div class="flex flex-wrap gap-1.5 shrink-0">
                        <button type="button" data-edit-scheme="${escapeHtml(s.id)}" class="px-2.5 py-1.5 rounded-lg bg-[#EDF4EE] text-[#14532D] text-xs font-bold">Edit</button>
                        <button type="button" data-toggle-scheme-pub="${escapeHtml(s.id)}" class="px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-800 text-xs font-bold">
                          ${s.published !== false ? "Unpublish" : "Publish"}
                        </button>
                        <button type="button" data-mark-scheme-outdated="${escapeHtml(s.id)}" class="px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-950 text-xs font-bold">Mark Outdated</button>
                        ${s.cloudId ? `<button type="button" data-del-scheme="${escapeHtml(s.cloudId)}" data-del-scheme-name="${escapeHtml(s.name)}" class="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">Delete</button>` : ""}
                      </div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- Append-Only Update History & Official Sources Log -->
          <div class="gv-card p-5 space-y-2.5">
            <h3 class="text-base font-extrabold text-[#14532D]">Scheme Update History &amp; Official Source Log (${history.length})</h3>
            ${history.length === 0 ? `
              <p class="text-xs text-[#496052]">No cloud edits logged yet. Every Add, Edit, Publish/Unpublish, Outdated Flag, or Delete automatically records the source URL and timestamp here.</p>
            ` : `
              <div class="space-y-2 max-h-[260px] overflow-y-auto">
                ${history.map((h) => {
                  const hUrl = safeUrl(h.officialSourceUrl);
                  return `
                    <div class="rounded-xl border border-[#CDE0D3] p-3 bg-[#F7F9F5] text-xs space-y-1">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <span class="font-extrabold text-[#14532D]">${escapeHtml(h.action)} — ${escapeHtml(h.schemeName)}</span>
                        <span class="text-[11px] text-[#496052]">${h.createdAtMs ? escapeHtml(formatDateShort(h.createdAtMs)) : ""} • ${escapeHtml(h.statusAfter)}</span>
                      </div>
                      <div class="text-[#132219]">${escapeHtml(h.summary)}</div>
                      <div class="text-[11px] text-[#496052]">
                        By: ${escapeHtml(h.actorEmail || h.actorUid)} • Verified Date: ${escapeHtml(h.lastVerifiedDate || "—")}
                        ${hUrl ? ` • <a href="${escapeHtml(hUrl)}" target="_blank" rel="noopener noreferrer" class="underline text-[#14532D]">Source ↗</a>` : ""}
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAdminCareers(state) {
  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form id="adminCareerForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
        <div class="flex items-center justify-between">
          <h3 id="acFormTitle" class="text-base font-extrabold text-[#14532D]">Add Job / Internship / Scholarship</h3>
          <button id="acCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel</button>
        </div>
        <input id="acEditId" type="hidden" value="" />
        <input id="acTitle" type="text" required minlength="2" maxlength="150" placeholder="Role / Exam Title *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
        <input id="acOrg" type="text" required minlength="2" maxlength="120" placeholder="Organization *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
        <div class="grid grid-cols-2 gap-2">
          <select id="acCategory" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
            <option value="GOVT_JOB">Govt Job</option>
            <option value="PRIVATE_JOB">Private Job</option>
            <option value="SCHOLARSHIP">Scholarship</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="COMPETITIVE_EXAM">Competitive Exam</option>
          </select>
          <input id="acDeadline" type="text" required minlength="2" maxlength="40" placeholder="Deadline *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <input id="acEligibility" type="text" required minlength="2" maxlength="200" placeholder="Eligibility *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <input id="acUrl" type="url" maxlength="400" placeholder="Official Apply URL" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <textarea id="acDesc" rows="2" required minlength="5" maxlength="1000" placeholder="Description *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
        <button type="submit" class="w-full py-2.5 rounded-xl bg-[#14532D] text-white text-sm font-extrabold">Save Opportunity</button>
      </form>
      <div class="lg:col-span-7 gv-card p-5 space-y-2.5">
        <h3 class="text-base font-extrabold text-[#14532D]">Career Listings (${state.careerOpportunities.length})</h3>
        <div class="space-y-2">
          ${state.careerOpportunities.map((c) => `
            <div class="rounded-2xl border border-[#CDE0D3] p-3.5 flex items-center justify-between gap-3 bg-[#F7F9F5]">
              <div class="min-w-0">
                <div class="text-xs font-bold text-[#1E7E45]">${escapeHtml(c.organization)} • ${escapeHtml(c.deadline)}</div>
                <div class="text-sm font-bold text-[#132219] truncate">${escapeHtml(c.title)}</div>
              </div>
              <div class="flex gap-1.5 shrink-0">
                <button data-edit-career="${escapeHtml(c.id)}" class="px-3 py-1.5 rounded-lg bg-[#EDF4EE] text-[#14532D] text-xs font-bold">Edit</button>
                <button data-del-career="${escapeHtml(c.id)}" class="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">Delete</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderAdminFarmerQueries(state) {
  return `
    <div class="gv-card p-5 space-y-3">
      <h3 class="text-base font-extrabold text-[#14532D]">Farmer Support Queries (${state.farmerQueries.length})</h3>
      ${state.farmerQueries.length === 0 ? `<p class="text-sm text-[#496052]">No farmer queries found.</p>` : `
        <div class="space-y-3">
          ${state.farmerQueries.map((fq) => `
            <div class="rounded-2xl border border-[#CDE0D3] p-4 bg-[#F7F9F5] space-y-2.5">
              <div class="flex flex-wrap justify-between gap-2">
                <span class="font-extrabold text-sm text-[#14532D]">${escapeHtml(fq.farmerName)} — ${escapeHtml(fq.cropName)} (${escapeHtml(fq.category)})${fq.district ? ` • ${escapeHtml(fq.district)}` : ""}</span>
                <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-xs font-bold">${escapeHtml(fq.status)}</span>
              </div>
              ${fq.hasImage && fq.imageBase64 ? `
                <img src="data:image/jpeg;base64,${escapeHtml(fq.imageBase64)}" alt="Farmer crop photo" class="rounded-xl max-h-44 w-auto object-contain border border-[#CDE0D3]" />
              ` : ""}
              <p class="text-xs text-[#132219]">${escapeHtml(fq.description)}</p>
              <form data-reply-fq="${escapeHtml(fq.id)}" class="flex flex-col sm:flex-row gap-2">
                <input name="reply" type="text" value="${escapeHtml(fq.adminReply || "")}" placeholder="Write agronomic guidance..." class="flex-1 px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
                <select name="status" class="px-2.5 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
                  <option value="OPEN" ${fq.status === "OPEN" ? "selected" : ""}>OPEN</option>
                  <option value="IN_REVIEW" ${fq.status === "IN_REVIEW" ? "selected" : ""}>IN_REVIEW</option>
                  <option value="RESOLVED" ${fq.status === "RESOLVED" ? "selected" : ""}>RESOLVED</option>
                </select>
                <button type="submit" class="px-4 py-2 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">Send Reply</button>
              </form>
            </div>
          `).join("")}
        </div>
      `}
    </div>
  `;
}

function renderAdminProfessors(state) {
  const pendingProfRequests = (state.ownerUsers || []).filter((u) => u.professorApprovalStatus === "PENDING");
  return `
    <div class="space-y-4">
      <div class="gv-card p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-base font-extrabold text-[#14532D]">Faculty &amp; Advisor Directory (9 Official Advisors)</h3>
          <p class="text-xs text-[#496052]">Founder can sync all 9 authoritative advisors to Firestore, link Firebase UIDs, and approve pending Professor verification requests. Emails stay hidden from public pages.</p>
        </div>
        ${state.isSuperAdmin ? `
          <button data-action="sync-9-professors" class="px-4 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">
            Sync All 9 Advisors to Firestore
          </button>
        ` : ""}
      </div>

      ${state.isSuperAdmin && pendingProfRequests.length > 0 ? `
        <div class="rounded-3xl border-2 border-amber-300 bg-amber-50/80 p-5 space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-sm sm:text-base font-extrabold text-amber-950">Pending Professor Verification Requests (${pendingProfRequests.length})</h4>
            <span class="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-extrabold">Admin Review Required</span>
          </div>
          <div class="space-y-2.5">
            ${pendingProfRequests.map((u) => `
              <div class="rounded-2xl bg-white border border-amber-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="min-w-0 space-y-0.5">
                  <div class="text-sm font-extrabold text-[#14532D]">${escapeHtml(u.displayName || "Applicant")}</div>
                  <div class="text-xs text-[#496052]">${escapeHtml(u.institutionOrVillage || "Institution not specified")}${u.department ? ` • ${escapeHtml(u.department)}` : ""}</div>
                  <div class="text-xs text-[#132219]"><strong>Specialization:</strong> ${escapeHtml(u.subjectSpecialization || "—")}</div>
                  <div class="text-[11px] text-[#496052] break-all">${escapeHtml(u.email || "")}${u.phoneNumber ? ` • ${escapeHtml(u.phoneNumber)}` : ""} • UID: ${escapeHtml(u.id)}</div>
                </div>
                <div class="flex gap-2 shrink-0">
                  <button type="button" data-approve-prof="${escapeHtml(u.id)}" class="px-3.5 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">Approve Professor</button>
                  <button type="button" data-reject-prof="${escapeHtml(u.id)}" class="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold">Reject</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}

      ${state.isSuperAdmin ? `
        <form id="adminProfForm" class="gv-card p-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div class="sm:col-span-3 flex items-center justify-between">
            <span id="apFormTitle" class="text-sm font-extrabold text-[#14532D]">Add / Edit Faculty Advisor</span>
            <button id="apCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
          </div>
          <input id="apId" type="hidden" value="" />
          <input id="apName" type="text" required placeholder="Professor Name *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="apDesignation" type="text" required placeholder="Designation *" value="Assistant Professor" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="apQualification" type="text" placeholder="Qualification (M.Sc., PhD)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="apSubject" type="text" placeholder="Subject" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="apDepartment" type="text" required value="Biological Science" placeholder="Department *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="apEmail" type="email" placeholder="Faculty Email" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="apSpec" type="text" required placeholder="Specialization *" class="sm:col-span-2 px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="apAuthUid" type="text" placeholder="Authorized Firebase UID (optional)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <button type="submit" class="sm:col-span-3 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">Save Advisor Profile</button>
        </form>
      ` : ""}

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        ${state.professors.map((p) => `
          <div class="gv-card p-4 space-y-1.5">
            <div class="flex justify-between items-start gap-2">
              <div class="font-extrabold text-sm text-[#14532D]">${escapeHtml(p.name)}</div>
              ${state.isSuperAdmin ? `
                <div class="flex gap-2 shrink-0">
                  <button data-edit-prof="${escapeHtml(p.id)}" class="text-xs font-bold text-[#1E7E45] hover:underline">Edit</button>
                  <button data-del-prof="${escapeHtml(p.id)}" class="text-xs font-bold text-rose-600 hover:underline">Delete</button>
                </div>
              ` : ""}
            </div>
            <div class="text-xs text-[#496052]">${escapeHtml(p.designation)} • ${escapeHtml(p.qualification || "—")}</div>
            <div class="text-xs font-semibold text-[#132219]">${escapeHtml(p.specialization)}</div>
            <div class="text-[11px] text-[#496052]">Email: ${escapeHtml(p.email || "Not listed")}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderAdminModeration(state) {
  return `
    <div class="gv-card p-5 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-base font-extrabold text-[#14532D]">Community &amp; Women Farmer Moderation (${state.communityPosts.length})</h3>
        <span class="text-xs font-bold text-[#496052]">
          ${state.communityPosts.filter((p) => p.board === "WOMEN_FARMER").length} Women Farmer Board • ${state.communityPosts.filter((p) => p.board !== "WOMEN_FARMER").length} Community Forum
        </span>
      </div>
      <div class="space-y-2.5">
        ${state.communityPosts.map((p) => `
          <div class="rounded-2xl border border-[#CDE0D3] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F7F9F5]">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#1E7E45]">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${p.board === "WOMEN_FARMER" ? "bg-fuchsia-100 text-fuchsia-900" : "bg-emerald-100 text-emerald-900"}">
                  ${p.board === "WOMEN_FARMER" ? "Women Farmer Board" : "Community"}
                </span>
                ${p.category ? `<span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[10px] text-[#14532D]">${escapeHtml(p.category)}</span>` : ""}
                <span>${escapeHtml(p.authorName)} • ${escapeHtml(p.collegeGroup)} • ${escapeHtml(p.status)}</span>
              </div>
              <div class="text-sm font-bold text-[#132219] truncate mt-0.5">${escapeHtml(p.title)}</div>
            </div>
            <div class="flex gap-1.5 shrink-0">
              <button data-mod-post="${escapeHtml(p.id)}" data-mod-status="${p.status === "ACTIVE" ? "HIDDEN" : "ACTIVE"}" class="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold">
                ${p.status === "ACTIVE" ? "Hide" : "Restore"}
              </button>
              <button data-del-post="${escapeHtml(p.id)}" class="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">Delete</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderAdminSettings(state) {
  const s = state.appSettings;
  if (!state.isSuperAdmin) {
    return `<div class="gv-card p-6 text-sm text-[#496052]">Global App Settings and Admin Role Registry are restricted to the Founder (Super Admin) by Firestore Security Rules.</div>`;
  }
  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form id="adminSettingsForm" class="lg:col-span-7 gv-card p-5 space-y-3">
        <h3 class="text-base font-extrabold text-[#14532D]">App Configuration &amp; WhatsApp Support</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="block">
            <span class="text-xs font-bold">WhatsApp Support Number *</span>
            <input id="setWaNum" type="text" required value="${escapeHtml(s.whatsappNumber)}" class="mt-1 w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          </label>
          <label class="block">
            <span class="text-xs font-bold">Support Email *</span>
            <input id="setSupportEmail" type="email" required value="${escapeHtml(s.supportEmail)}" class="mt-1 w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          </label>
          <label class="sm:col-span-2 block">
            <span class="text-xs font-bold">Official WhatsApp Group Invite URL</span>
            <input id="setWaGroup" type="url" value="${escapeHtml(s.whatsappGroupInviteUrl || "")}" class="mt-1 w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          </label>
          <label class="sm:col-span-2 block">
            <span class="text-xs font-bold">Hero Headline *</span>
            <input id="setHeadline" type="text" required value="${escapeHtml(s.heroHeadline)}" class="mt-1 w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          </label>
          <label class="sm:col-span-2 block">
            <span class="text-xs font-bold">About Text *</span>
            <textarea id="setAbout" rows="2" required class="mt-1 w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-sm">${escapeHtml(s.aboutText)}</textarea>
          </label>
          <label class="sm:col-span-2 block">
            <span class="text-xs font-bold">Maintenance Banner (leave blank to hide)</span>
            <input id="setMaint" type="text" value="${escapeHtml(s.maintenanceBanner || "")}" class="mt-1 w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
          </label>
        </div>
        <button type="submit" class="w-full py-3 rounded-xl bg-[#14532D] text-white text-sm font-extrabold">Save Global App Settings</button>
      </form>

      <div class="lg:col-span-5 gv-card p-5 space-y-3 h-fit">
        <h3 class="text-base font-extrabold text-[#14532D]">Authorized Admin Roles</h3>
        <form id="addAdminRoleForm" class="space-y-2">
          <input id="arUid" type="text" required placeholder="Target User Firebase UID *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="arEmail" type="email" required placeholder="Admin Email *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="arRole" type="text" required value="Content Admin" placeholder="Role Title *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <button type="submit" class="w-full py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">Grant Admin Access</button>
        </form>
        <div class="space-y-1.5 pt-2">
          ${(state.ownerAdmins || []).map((a) => `
            <div class="rounded-xl bg-[#F7F9F5] border border-[#CDE0D3] px-3 py-2 flex items-center justify-between text-xs">
              <div class="min-w-0">
                <div class="font-bold truncate">${escapeHtml(a.email)}</div>
                <div class="text-[10px] text-[#496052]">${escapeHtml(a.roleTitle)} • ${escapeHtml(a.id)}</div>
              </div>
              <button data-del-admin="${escapeHtml(a.id)}" class="text-rose-600 font-bold">Remove</button>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 2. OWNER CONTROL CENTER (Founder-Only Monitoring)
// ----------------------------------------------------------------------------
export function renderOwnerControlView(state) {
  if (!state.isSuperAdmin) {
    return `<div class="max-w-lg mx-auto gv-card p-8 text-center text-sm font-bold text-rose-700">Owner Control Center is restricted exclusively to the Founder account.</div>`;
  }
  const users = state.ownerUsers || [];
  const students = users.filter((u) => u.role === "STUDENT").length;
  const farmers = users.filter((u) => u.role === "FARMER").length;
  const examStats = state.ownerExamStats || [];
  const avgExam = examStats.length ? Math.round(examStats.reduce((s, e) => s + (Number(e.percentage) || 0), 0) / examStats.length) : 0;
  const unresolvedErrors = (state.ownerErrorLogs || []).filter((e) => !e.resolved);
  const pendingReports = (state.ownerContentReports || []).filter((r) => r.status === "PENDING");

  return `
    <div class="space-y-5 animate-fade-up">
      <div class="gv-card p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-display text-2xl font-bold text-[#14532D]">Founder Owner Control Center</h2>
          <p class="text-xs text-[#496052]">Live non-financial telemetry • Privacy Guard active: student Money Manager &amp; private Doubt Chats are strictly excluded.</p>
        </div>
        <button data-action="export-owner-csv" class="px-4 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">⬇️ Export CSV Report</button>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="gv-card p-4"><div class="text-[11px] font-bold text-[#496052]">USERS</div><div class="text-2xl font-extrabold text-[#14532D]">${users.length}</div><div class="text-[11px] text-[#496052]">${students} Students • ${farmers} Farmers</div></div>
        <div class="gv-card p-4"><div class="text-[11px] font-bold text-[#496052]">EXAMS COMPLETED</div><div class="text-2xl font-extrabold text-[#14532D]">${examStats.length}</div><div class="text-[11px] text-[#496052]">Avg Score: ${avgExam}%</div></div>
        <div class="gv-card p-4"><div class="text-[11px] font-bold text-[#496052]">PENDING REPORTS</div><div class="text-2xl font-extrabold text-amber-700">${pendingReports.length}</div><div class="text-[11px] text-[#496052]">Moderation queue</div></div>
        <div class="gv-card p-4"><div class="text-[11px] font-bold text-[#496052]">SYSTEM ALERTS</div><div class="text-2xl font-extrabold text-rose-700">${unresolvedErrors.length}</div><div class="text-[11px] text-[#496052]">Unresolved errors</div></div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="gv-card p-5 space-y-2.5">
          <h3 class="text-base font-extrabold text-[#14532D]">Reported Content Queue (${pendingReports.length} pending)</h3>
          ${pendingReports.length === 0 ? `<p class="text-xs text-[#496052]">All reports cleared.</p>` : pendingReports.map((r) => `
            <div class="rounded-xl border border-[#CDE0D3] p-3 text-xs space-y-1.5">
              <div class="font-bold">${escapeHtml(r.targetTitle)}</div>
              <div class="text-[#496052]">Reason: ${escapeHtml(r.reason)} (by ${escapeHtml(r.reporterName)})</div>
              <div class="flex gap-2">
                <button data-resolve-report="${escapeHtml(r.id)}" data-report-status="ACTION_TAKEN" class="px-2.5 py-1 rounded bg-[#14532D] text-white font-bold">Mark Action Taken</button>
                <button data-resolve-report="${escapeHtml(r.id)}" data-report-status="DISMISSED" class="px-2.5 py-1 rounded bg-slate-200 text-slate-700 font-bold">Dismiss</button>
              </div>
            </div>
          `).join("")}
        </div>

        <div class="gv-card p-5 space-y-2.5">
          <h3 class="text-base font-extrabold text-[#14532D]">Error Logs &amp; Health (${unresolvedErrors.length} open)</h3>
          ${unresolvedErrors.length === 0 ? `<p class="text-xs text-emerald-700 font-bold">All systems healthy.</p>` : unresolvedErrors.slice(0, 10).map((e) => `
            <div class="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs flex items-center justify-between gap-2">
              <div class="min-w-0">
                <div class="font-bold text-rose-900">${escapeHtml(e.source)} • ${escapeHtml(e.module)}</div>
                <div class="text-rose-800 truncate">${escapeHtml(e.message)}</div>
                <div class="text-[10px] text-slate-500">${formatDateShort(e.createdAtMs)}</div>
              </div>
              <button data-resolve-error="${escapeHtml(e.id)}" class="px-2.5 py-1 rounded bg-white border border-rose-200 text-rose-700 font-bold shrink-0">Resolve</button>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}
