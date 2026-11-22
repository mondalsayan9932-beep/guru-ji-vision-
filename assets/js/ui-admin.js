// ============================================================================
// Guru Ji Vision — Admin Panel & Founder Owner Control Center Renderers
// Strictly verified via Firebase Auth & Firestore Rules (NO hardcoded secrets)
// NEVER reads or exposes private student Money Manager or private Doubt Chats
// ============================================================================

import { escapeHtml, formatDateShort } from "./calculators.js";

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
    ["notices", "Notices"],
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
          <p class="text-xs text-[#496052] mt-0.5">Live Firebase Firestore sync • Private student Money Manager &amp; 1-on-1 Doubt Chats remain strictly inaccessible.</p>
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
      ${sub === "notices" ? renderAdminNotices(state) : ""}
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
      <form id="adminMaterialForm" class="lg:col-span-5 gv-card p-5 space-y-3 h-fit">
        <div class="flex items-center justify-between">
          <h3 id="amFormTitle" class="text-base font-extrabold text-[#14532D]">Add Study Material / PDF</h3>
          <button id="amCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel</button>
        </div>
        <input id="amEditId" type="hidden" value="" />
        <input id="amTitle" type="text" required minlength="2" maxlength="150" placeholder="Title *" class="w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
        <div class="grid grid-cols-2 gap-2">
          <select id="amSemester" class="px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map((s) => `<option value="${s}">Semester ${s}</option>`).join("")}
          </select>
          <select id="amCategory" class="px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm">
            <option value="NOTES_PDF">Notes &amp; PDFs</option>
            <option value="PYQ">PYQ Papers</option>
            <option value="PRACTICAL">Practical</option>
            <option value="VIDEO_LECTURE">Video Lecture</option>
          </select>
        </div>
        <input id="amSubject" type="text" required minlength="2" maxlength="80" placeholder="Subject (e.g. Agronomy) *" class="w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
        <div class="space-y-1.5">
          <input id="amUrl" type="url" maxlength="400" placeholder="PDF / Resource URL (https://...)" class="w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
          <label class="inline-flex items-center gap-2 text-xs font-bold text-[#1E7E45] cursor-pointer">
            <span>⬆️ Or upload PDF to Firebase Storage</span>
            <input id="amPdfUpload" type="file" accept="application/pdf" class="hidden" />
          </label>
        </div>
        <textarea id="amSummary" rows="2" required minlength="5" maxlength="1000" placeholder="Summary *" class="w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm"></textarea>
        <textarea id="amContent" rows="4" maxlength="12000" placeholder="Full Notes Text (also indexed by AI Guru Knowledge Base)" class="w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm"></textarea>
        <div class="flex flex-wrap gap-4 text-xs font-bold">
          <label class="flex items-center gap-1.5"><input id="amPublished" type="checkbox" checked class="accent-[#14532D]" /> Published</label>
          <label class="flex items-center gap-1.5"><input id="amVerifiedAi" type="checkbox" checked class="accent-[#14532D]" /> Verified for AI Guru</label>
        </div>
        <button type="submit" class="w-full py-3 rounded-xl bg-[#14532D] text-white text-sm font-extrabold">Save Study Material</button>
      </form>

      <div class="lg:col-span-7 gv-card p-5 space-y-2.5">
        <h3 class="text-base font-extrabold text-[#14532D]">Published &amp; Draft Materials (${state.studyMaterials.length})</h3>
        <div class="space-y-2 max-h-[600px] overflow-y-auto">
          ${state.studyMaterials.map((m) => `
            <div class="rounded-2xl border border-[#CDE0D3] p-3.5 flex items-center justify-between gap-3 bg-[#F7F9F5]">
              <div class="min-w-0">
                <div class="text-xs font-bold text-[#1E7E45]">Sem ${m.semester} • ${escapeHtml(m.subject)} • ${m.published ? "Live" : "Draft"}</div>
                <div class="text-sm font-extrabold text-[#132219] truncate">${escapeHtml(m.title)}</div>
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
        <h3 class="text-base font-extrabold text-[#14532D]">Add MCQ Question</h3>
        <input id="aqTitle" type="text" required minlength="2" maxlength="120" placeholder="Short Topic Title *" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
        <div class="grid grid-cols-2 gap-2">
          <select id="aqSem" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-sm">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map((s) => `<option value="${s}">Sem ${s}</option>`).join("")}
          </select>
          <input id="aqSubject" type="text" required minlength="2" maxlength="80" placeholder="Subject *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
        </div>
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
        <textarea id="aqExplanation" rows="2" maxlength="500" placeholder="Explanation" class="w-full px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
        <button type="submit" class="w-full py-2.5 rounded-xl bg-[#14532D] text-white text-sm font-extrabold">Publish MCQ</button>
      </form>

      <div class="lg:col-span-7 gv-card p-5 space-y-2.5">
        <h3 class="text-base font-extrabold text-[#14532D]">MCQ Bank (${state.quizzes.length})</h3>
        <div class="space-y-2 max-h-[540px] overflow-y-auto">
          ${state.quizzes.map((q) => `
            <div class="rounded-2xl border border-[#CDE0D3] p-3.5 flex items-center justify-between gap-3 bg-[#F7F9F5]">
              <div class="min-w-0">
                <div class="text-xs font-bold text-[#1E7E45]">Sem ${q.semester} • ${escapeHtml(q.subject)}</div>
                <div class="text-sm font-bold text-[#132219] truncate">${escapeHtml(q.questionText)}</div>
              </div>
              <button data-del-quiz="${escapeHtml(q.id)}" class="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold shrink-0">Delete</button>
            </div>
          `).join("")}
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

function renderAdminCareers(state) {
  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form id="adminCareerForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
        <h3 class="text-base font-extrabold text-[#14532D]">Add Job / Internship / Scholarship</h3>
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
        <button type="submit" class="w-full py-2.5 rounded-xl bg-[#14532D] text-white text-sm font-extrabold">Publish Opportunity</button>
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
              <button data-del-career="${escapeHtml(c.id)}" class="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold shrink-0">Delete</button>
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
                <span class="font-extrabold text-sm text-[#14532D]">${escapeHtml(fq.farmerName)} — ${escapeHtml(fq.cropName)} (${escapeHtml(fq.category)})</span>
                <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-xs font-bold">${escapeHtml(fq.status)}</span>
              </div>
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
  return `
    <div class="space-y-4">
      <div class="gv-card p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-base font-extrabold text-[#14532D]">Faculty &amp; Advisor Directory (9 Official Advisors)</h3>
          <p class="text-xs text-[#496052]">Founder can sync all 9 authoritative advisors to Firestore and link Firebase UIDs for professors without email.</p>
        </div>
        ${state.isSuperAdmin ? `
          <button data-action="sync-9-professors" class="px-4 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">
            Sync All 9 Advisors to Firestore
          </button>
        ` : ""}
      </div>

      ${state.isSuperAdmin ? `
        <form id="adminProfForm" class="gv-card p-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
              ${state.isSuperAdmin ? `<button data-edit-prof="${escapeHtml(p.id)}" class="text-xs font-bold text-[#1E7E45] hover:underline">Edit</button>` : ""}
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
      <h3 class="text-base font-extrabold text-[#14532D]">Community Post Moderation (${state.communityPosts.length})</h3>
      <div class="space-y-2.5">
        ${state.communityPosts.map((p) => `
          <div class="rounded-2xl border border-[#CDE0D3] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F7F9F5]">
            <div class="min-w-0">
              <div class="text-xs font-bold text-[#1E7E45]">${escapeHtml(p.authorName)} • ${escapeHtml(p.collegeGroup)} • ${escapeHtml(p.status)}</div>
              <div class="text-sm font-bold text-[#132219] truncate">${escapeHtml(p.title)}</div>
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
