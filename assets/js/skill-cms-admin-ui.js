// ============================================================================
// GURU JI VISION — PHASE 6 ADMIN SKILL ZONE CONTENT MANAGEMENT STUDIO
// ============================================================================
// Authorized Admin-only studio inside Admin Control Studio for managing:
// 1. Skill Training Programs & Courses (all 15 categories, role assignment,
//    YouTube video links, online courses, PDFs, provider, eligibility,
//    duration, verified fees, application links, certificates, official sources,
//    structured lessons for strict completion tracking)
// 2. Job & Career Preparation Resources (explicitly distinguishing Verified
//    Official Notifications from General Career Guidance)
// ============================================================================

import { escapeHtml } from "./calculators.js";
import {
  CAREER_PREP_CATEGORIES,
  CAREER_PREP_CATEGORY_MAP,
  CAREER_RECORD_KINDS,
  SKILL_AUDIENCE_ROLES,
  SKILL_CATEGORIES,
  SKILL_CATEGORY_MAP
} from "./skill-zone-data.js";

export function renderAdminSkillCmsView(state) {
  if (!state.user || !state.isAdmin) {
    return `
      <div class="gv-card p-6 text-center text-sm font-bold text-rose-800 bg-rose-50 border border-rose-200">
        Authorized Admin permissions are required to manage Skill Zone content.
      </div>
    `;
  }

  const cms = state.skillCms || {};
  const section = cms.section || "programs";
  const cloudPrograms = Array.isArray(state.skillPrograms) ? state.skillPrograms : [];
  const cloudCareers = Array.isArray(state.skillCareerResources) ? state.skillCareerResources : [];
  const publishedProgCount = cloudPrograms.filter((p) => p.published === true).length;
  const publishedCareerCount = cloudCareers.filter((c) => c.published === true).length;

  return `
    <div data-admin-skill-cms="1" class="space-y-4">
      <div class="gv-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#ECFDF5] via-white to-[#F0FDFA]">
        <div>
          <h3 class="font-display text-lg font-bold text-[#14532D]">Skill Zone Content Management Studio</h3>
          <p class="text-xs text-[#496052]">
            Add, edit, publish, unpublish, and delete Skill Training Programs across all 15 categories &amp; Verified Job / Career Preparation resources with role-based targeting.
          </p>
        </div>
        <button type="button" data-nav="skill-zone" class="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold shrink-0">
          Preview Skill Zone →
        </button>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          data-scms-section="programs"
          class="px-4 py-2 min-h-[40px] rounded-xl text-xs font-extrabold transition-colors ${
            section === "programs" ? "bg-[#14532D] text-white shadow-sm" : "bg-white border border-[#CDE0D3] text-[#14532D]"
          }"
        >Training Programs &amp; Courses (${cloudPrograms.length} • ${publishedProgCount} Live)</button>
        <button
          type="button"
          data-scms-section="careers"
          class="px-4 py-2 min-h-[40px] rounded-xl text-xs font-extrabold transition-colors ${
            section === "careers" ? "bg-[#14532D] text-white shadow-sm" : "bg-white border border-[#CDE0D3] text-[#14532D]"
          }"
        >Job &amp; Career Preparation (${cloudCareers.length} • ${publishedCareerCount} Live)</button>
      </div>

      ${section === "programs" ? renderAdminSkillProgramsSection(cloudPrograms, cms) : ""}
      ${section === "careers" ? renderAdminSkillCareersSection(cloudCareers, cms) : ""}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// A. ADMIN SKILL TRAINING PROGRAMS CRUD
// ----------------------------------------------------------------------------
function renderAdminSkillProgramsSection(cloudPrograms, cms) {
  const filterCat = cms.programCategoryFilter || "ALL";
  const search = String(cms.programSearch || "").trim().toLowerCase();
  const visible = cloudPrograms.filter((p) => {
    if (filterCat !== "ALL" && p.category !== filterCat) return false;
    if (search) {
      const hay = [p.title, p.titleBn, p.provider, p.description, p.category].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  return `
    <div data-admin-skill-programs="1" class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form id="adminSkillProgramForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
        <div class="flex items-center justify-between gap-2">
          <h4 id="aspFormTitle" class="text-base font-extrabold text-[#14532D]">Add Skill Training Program</h4>
          <button id="aspCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
        </div>
        <input id="aspEditId" type="hidden" value="" />
        <input id="aspTitle" type="text" required minlength="2" maxlength="160" placeholder="Program / Course Title (English) *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
        <input id="aspTitleBn" type="text" maxlength="200" placeholder="Bengali Title (বাংলা শিরোনাম — optional)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select id="aspCategory" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
            ${SKILL_CATEGORIES.map((c) => `<option value="${c.key}">${escapeHtml(c.en)}</option>`).join("")}
          </select>
          <input id="aspProvider" type="text" required minlength="2" maxlength="140" placeholder="Training Provider / Organization *" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>

        <!-- Role-Based Audience Assignment -->
        <div class="p-3 rounded-xl bg-[#F8FBF8] border border-[#E2ECE5] space-y-1.5">
          <div class="text-[11px] font-extrabold text-[#14532D]">Assign Target Audience (Role-Based Learning) *</div>
          <div class="flex flex-wrap gap-3 text-xs">
            ${SKILL_AUDIENCE_ROLES.map((r) => `
              <label class="inline-flex items-center gap-1.5 font-bold text-[#1E3A2F]">
                <input type="checkbox" name="aspTargetRoles" value="${r.key}" ${r.key === "ALL" ? "checked" : ""} class="w-4 h-4 accent-[#14532D]" />
                <span>${escapeHtml(r.en)}</span>
              </label>
            `).join("")}
          </div>
        </div>

        <textarea id="aspDescription" rows="2" required minlength="5" maxlength="1200" placeholder="Training Program Details &amp; Objectives *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input id="aspEligibility" type="text" maxlength="300" placeholder="Eligibility Criteria" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="aspDuration" type="text" maxlength="100" placeholder="Course Duration (e.g., 4 weeks)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input id="aspVerifiedFees" type="text" maxlength="160" placeholder="Verified Fees (e.g., Free / Govt funded)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="aspCertificateDetails" type="text" maxlength="260" placeholder="Certificate Details" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>

        <input id="aspYoutubeUrl" type="url" maxlength="400" placeholder="YouTube Video / Playlist URL (optional, https://...)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <input id="aspCourseUrl" type="url" maxlength="400" placeholder="Online Course Link (optional, https://...)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <input id="aspPdfUrl" type="url" maxlength="400" placeholder="PDF / Document URL (optional, https://...)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input id="aspApplicationUrl" type="url" maxlength="400" placeholder="Application Link (https://...)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="aspOfficialSourceUrl" type="url" maxlength="400" placeholder="Official Source Link (https://...)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <input id="aspCertificateUrl" type="url" maxlength="400" placeholder="Official Certificate Portal Link (optional, https://...)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />

        <div class="space-y-1">
          <label for="aspLessons" class="text-[11px] font-extrabold text-[#14532D]">
            Defined Lessons (1 lesson per line — required for user progress &amp; completion) *
          </label>
          <textarea id="aspLessons" rows="3" required placeholder="Module 1: Introduction &amp; Eligibility&#10;Module 2: Practical Field Steps&#10;Module 3: Assessment &amp; Certification" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
        </div>

        <label class="flex items-center gap-2 text-xs font-bold text-[#14532D] pt-1">
          <input id="aspPublished" type="checkbox" checked class="w-4 h-4 accent-[#14532D]" />
          Publish immediately in Skill Zone
        </label>
        <button type="submit" class="w-full min-h-[44px] py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">
          Save Skill Training Program
        </button>
      </form>

      <div class="lg:col-span-7 gv-card p-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-base font-extrabold text-[#14532D]">Admin-Managed Skill Programs (${visible.length})</h4>
          <div class="flex flex-wrap gap-1.5">
            <input id="aspListSearch" type="search" value="${escapeHtml(cms.programSearch || "")}" placeholder="Search..." class="px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs" />
            <select id="aspListCatFilter" class="px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] bg-white text-xs font-bold">
              <option value="ALL" ${filterCat === "ALL" ? "selected" : ""}>All 15 Categories</option>
              ${SKILL_CATEGORIES.map((c) => `<option value="${c.key}" ${filterCat === c.key ? "selected" : ""}>${escapeHtml(c.en)}</option>`).join("")}
            </select>
          </div>
        </div>

        ${visible.length === 0 ? `
          <p class="text-xs text-[#64748B]">No cloud-saved Skill Programs match yet. Add custom courses, YouTube links, PDFs, and lessons on the left (15 verified official seed portals also remain live in Skill Zone).</p>
        ` : `
          <div class="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            ${visible.map((p) => {
              const cat = SKILL_CATEGORY_MAP[p.category] || { en: p.category };
              const roles = Array.isArray(p.targetRoles) ? p.targetRoles.join(", ") : "ALL";
              const lessonCount = Array.isArray(p.lessons) ? p.lessons.length : 0;
              return `
                <div class="p-3.5 rounded-2xl border ${p.published ? "bg-[#F8FBF8] border-[#E2ECE5]" : "bg-amber-50/60 border-amber-300"} flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="min-w-0 space-y-1">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${p.published ? "bg-[#DCFCE7] text-[#14532D]" : "bg-amber-200 text-amber-950"}">${p.published ? "Published Live" : "Draft / Unpublished"}</span>
                      <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[10px] font-bold text-[#14532D]">${escapeHtml(cat.en)}</span>
                      <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">Roles: ${escapeHtml(roles)}</span>
                      <span class="px-2 py-0.5 rounded-full bg-teal-50 text-teal-900 text-[10px] font-bold">${lessonCount} lessons</span>
                    </div>
                    <div class="text-sm font-extrabold text-[#132219]">${escapeHtml(p.title || "")}</div>
                    <div class="text-[11px] text-[#475569]">${escapeHtml(p.provider || "")}${p.duration ? ` • ${escapeHtml(p.duration)}` : ""}${p.verifiedFees ? ` • ${escapeHtml(p.verifiedFees)}` : ""}</div>
                  </div>
                  <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button type="button" data-scms-toggle-prog="${escapeHtml(p.id)}" data-next-pub="${p.published ? "0" : "1"}" class="px-2.5 py-1.5 rounded-lg ${p.published ? "bg-amber-100 text-amber-900" : "bg-[#14532D] text-white"} text-[11px] font-extrabold">
                      ${p.published ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" data-scms-edit-prog="${escapeHtml(p.id)}" class="px-2.5 py-1.5 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-extrabold">Edit</button>
                    <button type="button" data-scms-del-prog="${escapeHtml(p.id)}" class="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-extrabold">Delete</button>
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
// B. ADMIN JOB & CAREER PREPARATION RESOURCES CRUD
// ----------------------------------------------------------------------------
function renderAdminSkillCareersSection(cloudCareers, cms) {
  const filterKind = cms.careerKindFilter || "ALL";
  const visible = cloudCareers.filter((c) => filterKind === "ALL" || c.recordKind === filterKind);

  return `
    <div data-admin-skill-careers="1" class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form id="adminSkillCareerForm" class="lg:col-span-5 gv-card p-5 space-y-2.5 h-fit">
        <div class="flex items-center justify-between gap-2">
          <h4 id="ascFormTitle" class="text-base font-extrabold text-[#14532D]">Add Job / Career Resource</h4>
          <button id="ascCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
        </div>
        <p class="text-[11px] text-[#496052]">
          Only select <strong>Verified Official Notification</strong> when referencing a real, officially announced vacancy/internship with a verified official link. Never invent vacancies, salaries, or deadlines.
        </p>
        <input id="ascEditId" type="hidden" value="" />
        <input id="ascTitle" type="text" required minlength="2" maxlength="160" placeholder="Title (English) *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-sm" />
        <input id="ascTitleBn" type="text" maxlength="200" placeholder="Bengali Title (optional)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select id="ascRecordKind" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-extrabold">
            <option value="CAREER_GUIDANCE">Career Guidance &amp; Prep</option>
            <option value="VERIFIED_NOTIFICATION">Verified Official Notification</option>
          </select>
          <select id="ascPrepCategory" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
            ${CAREER_PREP_CATEGORIES.map((c) => `<option value="${c.key}">${escapeHtml(c.en)}</option>`).join("")}
          </select>
        </div>

        <div class="p-3 rounded-xl bg-[#F8FBF8] border border-[#E2ECE5] space-y-1.5">
          <div class="text-[11px] font-extrabold text-[#14532D]">Target Audience *</div>
          <div class="flex flex-wrap gap-3 text-xs">
            ${SKILL_AUDIENCE_ROLES.map((r) => `
              <label class="inline-flex items-center gap-1.5 font-bold text-[#1E3A2F]">
                <input type="checkbox" name="ascTargetRoles" value="${r.key}" ${r.key === "ALL" ? "checked" : ""} class="w-4 h-4 accent-[#14532D]" />
                <span>${escapeHtml(r.en)}</span>
              </label>
            `).join("")}
          </div>
        </div>

        <input id="ascOrganization" type="text" required minlength="2" maxlength="140" placeholder="Organization / Official Portal Name *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <textarea id="ascSummary" rows="2" required minlength="5" maxlength="1000" placeholder="Summary / Career Guidance Details *" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs"></textarea>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input id="ascEligibility" type="text" maxlength="300" placeholder="Eligibility Criteria" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="ascDeadline" type="text" maxlength="60" placeholder="Verified Deadline (ONLY if official)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <input id="ascOfficialSourceUrl" type="url" maxlength="400" placeholder="Official Source Link (https://...)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <input id="ascApplicationUrl" type="url" maxlength="400" placeholder="Official Application / Portal Link (https://...)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input id="ascYoutubeUrl" type="url" maxlength="400" placeholder="YouTube Guide Link (optional)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
          <input id="ascPdfUrl" type="url" maxlength="400" placeholder="PDF Guide Link (optional)" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        </div>
        <input id="ascVerifiedNote" type="text" maxlength="260" placeholder="Verification Note (e.g., Verified from official circular)" class="w-full px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
        <label class="flex items-center gap-2 text-xs font-bold text-[#14532D] pt-1">
          <input id="ascPublished" type="checkbox" checked class="w-4 h-4 accent-[#14532D]" />
          Publish immediately in Skill Zone
        </label>
        <button type="submit" class="w-full min-h-[44px] py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">
          Save Career Preparation Resource
        </button>
      </form>

      <div class="lg:col-span-7 gv-card p-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-base font-extrabold text-[#14532D]">Admin-Managed Career Resources (${visible.length})</h4>
          <select id="ascListKindFilter" class="px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] bg-white text-xs font-bold">
            <option value="ALL" ${filterKind === "ALL" ? "selected" : ""}>All Types</option>
            <option value="VERIFIED_NOTIFICATION" ${filterKind === "VERIFIED_NOTIFICATION" ? "selected" : ""}>Verified Notifications</option>
            <option value="CAREER_GUIDANCE" ${filterKind === "CAREER_GUIDANCE" ? "selected" : ""}>Career Guidance</option>
          </select>
        </div>

        ${visible.length === 0 ? `
          <p class="text-xs text-[#64748B]">No cloud-saved Skill Career resources yet. Add verified job notifications or interview/resume guides on the left.</p>
        ` : `
          <div class="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            ${visible.map((item) => {
              const cat = CAREER_PREP_CATEGORY_MAP[item.prepCategory] || { en: item.prepCategory };
              const kindMeta = CAREER_RECORD_KINDS[item.recordKind] || CAREER_RECORD_KINDS.CAREER_GUIDANCE;
              return `
                <div class="p-3.5 rounded-2xl border ${item.published ? "bg-[#F8FBF8] border-[#E2ECE5]" : "bg-amber-50/60 border-amber-300"} flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="min-w-0 space-y-1">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${item.published ? "bg-[#DCFCE7] text-[#14532D]" : "bg-amber-200 text-amber-950"}">${item.published ? "Published Live" : "Draft"}</span>
                      <span class="px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${escapeHtml(kindMeta.cls)}">${escapeHtml(kindMeta.en)}</span>
                      <span class="px-2 py-0.5 rounded-full bg-white border border-[#CDE0D3] text-[10px] font-bold text-[#14532D]">${escapeHtml(cat.en)}</span>
                    </div>
                    <div class="text-sm font-extrabold text-[#132219]">${escapeHtml(item.title || "")}</div>
                    <div class="text-[11px] text-[#475569]">${escapeHtml(item.organization || "")}${item.deadline ? ` • Deadline: ${escapeHtml(item.deadline)}` : ""}</div>
                  </div>
                  <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button type="button" data-scms-toggle-career="${escapeHtml(item.id)}" data-next-pub="${item.published ? "0" : "1"}" class="px-2.5 py-1.5 rounded-lg ${item.published ? "bg-amber-100 text-amber-900" : "bg-[#14532D] text-white"} text-[11px] font-extrabold">
                      ${item.published ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" data-scms-edit-career="${escapeHtml(item.id)}" class="px-2.5 py-1.5 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-extrabold">Edit</button>
                    <button type="button" data-scms-del-career="${escapeHtml(item.id)}" class="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-extrabold">Delete</button>
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
