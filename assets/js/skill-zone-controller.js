// ============================================================================
// GURU JI VISION — PHASE 6 SKILL ZONE & ADMIN SKILL CMS CONTROLLER
// ============================================================================
// Manages:
// 1. Skill Zone tab switching, 15-category filtering, role-based filtering,
//    resource format filtering, and career prep (Verified vs Guidance) filters
// 2. Authenticated User Program Enrolment, Lesson Completion Tracking &
//    Strict Certificate Unlock Verification
// 3. Admin Skill CMS Create / Edit / Update / Publish / Unpublish / Delete
// ============================================================================

import { extractYouTubeInfo } from "./edu-cms-utils.js";
import {
  evaluateProgramCompletion,
  mergeSkillPrograms,
  normalizeLessons
} from "./skill-zone-data.js";

export function createInitialSkillZoneState() {
  return {
    subTab: "programs", // programs | careers | my-learning | connected
    category: "ALL",
    audienceRole: "ALL", // ALL | STUDENT | FARMER | WOMEN_FARMER
    format: "ALL", // ALL | VIDEO | COURSE | PDF | CERT
    search: "",
    expandedProgramId: "",
    careerPrepCategory: "ALL",
    careerRecordKind: "ALL", // ALL | VERIFIED_NOTIFICATION | CAREER_GUIDANCE
    careerSearch: "",
    viewingCertificateId: ""
  };
}

export function createInitialSkillCmsState() {
  return {
    section: "programs", // programs | careers
    programCategoryFilter: "ALL",
    programSearch: "",
    careerKindFilter: "ALL"
  };
}

function getCheckedValues(form, name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value);
}

export function bindSkillZoneEvents({
  state,
  firebaseService,
  renderActiveView,
  showToast,
  openAuthModal
}) {
  // Delegated click handler
  document.addEventListener("click", async (e) => {
    const target = e.target.closest("button, a");
    if (!target) return;

    // --- PUBLIC / LEARNER SKILL ZONE ACTIONS ---
    if (target.dataset.skillSub) {
      state.skillZone.subTab = target.dataset.skillSub;
      renderActiveView();
      return;
    }

    if (target.dataset.skillRole) {
      state.skillZone.audienceRole = target.dataset.skillRole;
      renderActiveView();
      return;
    }

    if (target.dataset.skillCat) {
      state.skillZone.category = target.dataset.skillCat;
      renderActiveView();
      return;
    }

    if (target.dataset.skillCareerCat) {
      state.skillZone.careerPrepCategory = target.dataset.skillCareerCat;
      renderActiveView();
      return;
    }

    if (target.dataset.skillResetFilters) {
      state.skillZone.category = "ALL";
      state.skillZone.audienceRole = "ALL";
      state.skillZone.format = "ALL";
      state.skillZone.search = "";
      renderActiveView();
      return;
    }

    if (target.dataset.skillExpand) {
      const id = target.dataset.skillExpand;
      state.skillZone.expandedProgramId = state.skillZone.expandedProgramId === id ? "" : id;
      renderActiveView();
      return;
    }

    // Enrol in a Skill Program
    if (target.dataset.skillEnrol) {
      if (!state.user) {
        showToast("Please sign in to enrol in skill programs and save your progress.", "error");
        if (openAuthModal) openAuthModal();
        return;
      }
      const progId = target.dataset.skillEnrol;
      const allProgs = mergeSkillPrograms(state.skillPrograms || [], false);
      const program = allProgs.find((p) => p.id === progId);
      if (!program) return;

      const existing = (state.userSkillProgress || []).find((r) => (r.programId || r.id) === progId);
      try {
        await firebaseService.saveUserSkillProgress(state.user.uid, program, {
          enrolled: true,
          completedLessonIds: existing?.completedLessonIds || []
        });
        state.skillZone.expandedProgramId = progId;
        showToast(`Enrolled in "${program.title}". Mark lessons completed as you learn!`, "success");
        renderActiveView();
      } catch (err) {
        showToast(err?.message || "Could not save enrolment right now.", "error");
      }
      return;
    }

    // View Verified Completion Record / Certificate (strictly enforces 100% lesson completion!)
    if (target.dataset.skillViewCert) {
      const progId = target.dataset.skillViewCert;
      const allProgs = mergeSkillPrograms(state.skillPrograms || [], false);
      const program = allProgs.find((p) => p.id === progId);
      const progressRec = (state.userSkillProgress || []).find((r) => (r.programId || r.id) === progId);
      const evalRes = evaluateProgramCompletion(program, progressRec?.completedLessonIds || []);
      if (!program || !progressRec?.enrolled || !evalRes.isCompleted) {
        showToast("Complete all defined lessons in this program first to unlock completion & certificate access.", "error");
        return;
      }
      state.skillZone.subTab = "my-learning";
      state.skillZone.viewingCertificateId = progId;
      renderActiveView();
      return;
    }

    if (target.dataset.skillCloseCert) {
      state.skillZone.viewingCertificateId = "";
      renderActiveView();
      return;
    }

    // --- ADMIN SKILL CMS ACTIONS ---
    if (target.dataset.scmsSection) {
      state.skillCms.section = target.dataset.scmsSection;
      renderActiveView();
      return;
    }

    if (target.id === "aspCancelEdit") {
      const form = document.getElementById("adminSkillProgramForm");
      if (form) form.reset();
      const editEl = document.getElementById("aspEditId");
      if (editEl) editEl.value = "";
      const titleEl = document.getElementById("aspFormTitle");
      if (titleEl) titleEl.textContent = "Add Skill Training Program";
      target.classList.add("hidden");
      return;
    }

    if (target.id === "ascCancelEdit") {
      const form = document.getElementById("adminSkillCareerForm");
      if (form) form.reset();
      const editEl = document.getElementById("ascEditId");
      if (editEl) editEl.value = "";
      const titleEl = document.getElementById("ascFormTitle");
      if (titleEl) titleEl.textContent = "Add Job / Career Resource";
      target.classList.add("hidden");
      return;
    }

    if (target.dataset.scmsToggleProg) {
      if (!state.isAdmin) return;
      const id = target.dataset.scmsToggleProg;
      const nextPub = target.dataset.nextPub === "1";
      try {
        await firebaseService.setSkillProgramPublished(state.user.uid, id, nextPub);
        showToast(nextPub ? "Skill program published live." : "Skill program unpublished (saved as draft).", "success");
      } catch (err) {
        showToast(err?.message || "Failed to update publish status.", "error");
      }
      return;
    }

    if (target.dataset.scmsEditProg) {
      if (!state.isAdmin) return;
      const prog = (state.skillPrograms || []).find((p) => p.id === target.dataset.scmsEditProg);
      if (!prog) return;
      const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ""; };
      setVal("aspEditId", prog.id);
      setVal("aspTitle", prog.title);
      setVal("aspTitleBn", prog.titleBn);
      setVal("aspCategory", prog.category);
      setVal("aspProvider", prog.provider);
      setVal("aspDescription", prog.description);
      setVal("aspEligibility", prog.eligibility);
      setVal("aspDuration", prog.duration);
      setVal("aspVerifiedFees", prog.verifiedFees);
      setVal("aspCertificateDetails", prog.certificateDetails);
      setVal("aspYoutubeUrl", prog.youtubeUrl);
      setVal("aspCourseUrl", prog.courseUrl);
      setVal("aspPdfUrl", prog.pdfUrl);
      setVal("aspApplicationUrl", prog.applicationUrl);
      setVal("aspOfficialSourceUrl", prog.officialSourceUrl);
      setVal("aspCertificateUrl", prog.certificateUrl);
      setVal("aspLessons", (prog.lessons || []).map((l) => l.title).join("\n"));
      const pubEl = document.getElementById("aspPublished");
      if (pubEl) pubEl.checked = prog.published !== false;
      const roleSet = new Set(Array.isArray(prog.targetRoles) ? prog.targetRoles : ["ALL"]);
      document.querySelectorAll('input[name="aspTargetRoles"]').forEach((cb) => {
        cb.checked = roleSet.has(cb.value);
      });
      const titleEl = document.getElementById("aspFormTitle");
      if (titleEl) titleEl.textContent = "Edit Skill Training Program";
      const cancelBtn = document.getElementById("aspCancelEdit");
      if (cancelBtn) cancelBtn.classList.remove("hidden");
      document.getElementById("adminSkillProgramForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (target.dataset.scmsDelProg) {
      if (!state.isAdmin) return;
      if (!confirm("Delete this Skill Training Program permanently?")) return;
      try {
        await firebaseService.deleteSkillProgram(target.dataset.scmsDelProg);
        showToast("Skill training program deleted.", "success");
      } catch (err) {
        showToast(err?.message || "Could not delete program.", "error");
      }
      return;
    }

    if (target.dataset.scmsToggleCareer) {
      if (!state.isAdmin) return;
      const id = target.dataset.scmsToggleCareer;
      const nextPub = target.dataset.nextPub === "1";
      try {
        await firebaseService.setSkillCareerResourcePublished(state.user.uid, id, nextPub);
        showToast(nextPub ? "Career resource published live." : "Career resource unpublished.", "success");
      } catch (err) {
        showToast(err?.message || "Could not update career resource.", "error");
      }
      return;
    }

    if (target.dataset.scmsEditCareer) {
      if (!state.isAdmin) return;
      const item = (state.skillCareerResources || []).find((c) => c.id === target.dataset.scmsEditCareer);
      if (!item) return;
      const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ""; };
      setVal("ascEditId", item.id);
      setVal("ascTitle", item.title);
      setVal("ascTitleBn", item.titleBn);
      setVal("ascRecordKind", item.recordKind || "CAREER_GUIDANCE");
      setVal("ascPrepCategory", item.prepCategory || "AGRI_JOB_PREP");
      setVal("ascOrganization", item.organization);
      setVal("ascSummary", item.summary);
      setVal("ascEligibility", item.eligibility);
      setVal("ascDeadline", item.deadline);
      setVal("ascOfficialSourceUrl", item.officialSourceUrl);
      setVal("ascApplicationUrl", item.applicationUrl);
      setVal("ascYoutubeUrl", item.youtubeUrl);
      setVal("ascPdfUrl", item.pdfUrl);
      setVal("ascVerifiedNote", item.verifiedNote);
      const pubEl = document.getElementById("ascPublished");
      if (pubEl) pubEl.checked = item.published !== false;
      const roleSet = new Set(Array.isArray(item.targetRoles) ? item.targetRoles : ["ALL"]);
      document.querySelectorAll('input[name="ascTargetRoles"]').forEach((cb) => {
        cb.checked = roleSet.has(cb.value);
      });
      const titleEl = document.getElementById("ascFormTitle");
      if (titleEl) titleEl.textContent = "Edit Job / Career Resource";
      const cancelBtn = document.getElementById("ascCancelEdit");
      if (cancelBtn) cancelBtn.classList.remove("hidden");
      document.getElementById("adminSkillCareerForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (target.dataset.scmsDelCareer) {
      if (!state.isAdmin) return;
      if (!confirm("Delete this Career Preparation resource permanently?")) return;
      try {
        await firebaseService.deleteSkillCareerResource(target.dataset.scmsDelCareer);
        showToast("Career resource deleted.", "success");
      } catch (err) {
        showToast(err?.message || "Could not delete career resource.", "error");
      }
      return;
    }
  });

  // Delegated input & change handlers
  document.addEventListener("input", (e) => {
    const id = e.target?.id;
    if (id === "skillSearchInput") {
      state.skillZone.search = e.target.value;
      renderActiveView();
    } else if (id === "skillCareerSearchInput") {
      state.skillZone.careerSearch = e.target.value;
      renderActiveView();
    } else if (id === "aspListSearch") {
      state.skillCms.programSearch = e.target.value;
      renderActiveView();
    }
  });

  document.addEventListener("change", async (e) => {
    const el = e.target;
    if (!el) return;

    // Lesson completion checkbox toggle
    if (el.dataset?.skillLessonToggle) {
      if (!state.user) {
        el.checked = !el.checked;
        showToast("Please sign in to save lesson progress.", "error");
        return;
      }
      const progId = el.dataset.skillLessonToggle;
      const lessonId = el.dataset.lessonId;
      const allProgs = mergeSkillPrograms(state.skillPrograms || [], false);
      const program = allProgs.find((p) => p.id === progId);
      if (!program || !lessonId) return;

      const existing = (state.userSkillProgress || []).find((r) => (r.programId || r.id) === progId);
      if (!existing?.enrolled) {
        el.checked = false;
        showToast("Enrol in this program first before marking lessons completed.", "error");
        return;
      }

      const nextSet = new Set(Array.isArray(existing.completedLessonIds) ? existing.completedLessonIds : []);
      if (el.checked) nextSet.add(lessonId);
      else nextSet.delete(lessonId);

      const evalRes = evaluateProgramCompletion(program, Array.from(nextSet));
      try {
        await firebaseService.saveUserSkillProgress(state.user.uid, program, {
          enrolled: true,
          completedLessonIds: evalRes.completedLessonIds
        });
        if (evalRes.isCompleted) {
          showToast(`All ${evalRes.totalLessons} lessons completed! Program marked Completed & certificate unlocked.`, "success");
        } else {
          showToast(`Progress saved: ${evalRes.completedCount}/${evalRes.totalLessons} lessons (${evalRes.progressPercent}%).`, "success");
        }
      } catch (err) {
        el.checked = !el.checked;
        showToast(err?.message || "Could not update lesson progress.", "error");
      }
      return;
    }

    if (el.id === "skillCategorySelect") {
      state.skillZone.category = el.value;
      renderActiveView();
    } else if (el.id === "skillFormatSelect") {
      state.skillZone.format = el.value;
      renderActiveView();
    } else if (el.id === "skillCareerCatSelect") {
      state.skillZone.careerPrepCategory = el.value;
      renderActiveView();
    } else if (el.id === "skillCareerKindSelect") {
      state.skillZone.careerRecordKind = el.value;
      renderActiveView();
    } else if (el.id === "aspListCatFilter") {
      state.skillCms.programCategoryFilter = el.value;
      renderActiveView();
    } else if (el.id === "ascListKindFilter") {
      state.skillCms.careerKindFilter = el.value;
      renderActiveView();
    }
  });

  // Admin Skill CMS form submissions
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (!form) return;

    if (form.id === "adminSkillProgramForm") {
      e.preventDefault();
      if (!state.user || !state.isAdmin) {
        showToast("Admin permission required.", "error");
        return;
      }
      const youtubeUrl = document.getElementById("aspYoutubeUrl")?.value?.trim() || "";
      if (youtubeUrl) {
        const ytCheck = extractYouTubeInfo(youtubeUrl);
        if (!ytCheck.ok) {
          showToast(ytCheck.error || "Please enter a valid YouTube URL.", "error");
          return;
        }
      }
      const lessons = normalizeLessons(document.getElementById("aspLessons")?.value || "");
      if (!lessons.length) {
        showToast("Please define at least 1 lesson (one per line) so user completion can be tracked accurately.", "error");
        return;
      }
      const targetRoles = getCheckedValues(form, "aspTargetRoles");
      const editId = document.getElementById("aspEditId")?.value?.trim() || "";
      const payload = {
        title: document.getElementById("aspTitle")?.value?.trim() || "",
        titleBn: document.getElementById("aspTitleBn")?.value?.trim() || "",
        category: document.getElementById("aspCategory")?.value || "AGRI_SKILL_DEV",
        provider: document.getElementById("aspProvider")?.value?.trim() || "",
        targetRoles: targetRoles.length ? targetRoles : ["ALL"],
        description: document.getElementById("aspDescription")?.value?.trim() || "",
        eligibility: document.getElementById("aspEligibility")?.value?.trim() || "",
        duration: document.getElementById("aspDuration")?.value?.trim() || "",
        verifiedFees: document.getElementById("aspVerifiedFees")?.value?.trim() || "",
        certificateDetails: document.getElementById("aspCertificateDetails")?.value?.trim() || "",
        youtubeUrl,
        courseUrl: document.getElementById("aspCourseUrl")?.value?.trim() || "",
        pdfUrl: document.getElementById("aspPdfUrl")?.value?.trim() || "",
        applicationUrl: document.getElementById("aspApplicationUrl")?.value?.trim() || "",
        officialSourceUrl: document.getElementById("aspOfficialSourceUrl")?.value?.trim() || "",
        certificateUrl: document.getElementById("aspCertificateUrl")?.value?.trim() || "",
        lessons,
        published: Boolean(document.getElementById("aspPublished")?.checked)
      };

      try {
        await firebaseService.saveSkillProgram(state.user.uid, payload, { editId });
        form.reset();
        const editEl = document.getElementById("aspEditId");
        if (editEl) editEl.value = "";
        showToast(editId ? "Skill program updated." : "Skill program saved to Firestore.", "success");
      } catch (err) {
        showToast(err?.message || "Could not save skill program.", "error");
      }
      return;
    }

    if (form.id === "adminSkillCareerForm") {
      e.preventDefault();
      if (!state.user || !state.isAdmin) {
        showToast("Admin permission required.", "error");
        return;
      }
      const youtubeUrl = document.getElementById("ascYoutubeUrl")?.value?.trim() || "";
      if (youtubeUrl) {
        const ytCheck = extractYouTubeInfo(youtubeUrl);
        if (!ytCheck.ok) {
          showToast(ytCheck.error || "Please enter a valid YouTube URL.", "error");
          return;
        }
      }
      const targetRoles = getCheckedValues(form, "ascTargetRoles");
      const editId = document.getElementById("ascEditId")?.value?.trim() || "";
      const payload = {
        title: document.getElementById("ascTitle")?.value?.trim() || "",
        titleBn: document.getElementById("ascTitleBn")?.value?.trim() || "",
        recordKind: document.getElementById("ascRecordKind")?.value || "CAREER_GUIDANCE",
        prepCategory: document.getElementById("ascPrepCategory")?.value || "AGRI_JOB_PREP",
        targetRoles: targetRoles.length ? targetRoles : ["ALL"],
        organization: document.getElementById("ascOrganization")?.value?.trim() || "",
        summary: document.getElementById("ascSummary")?.value?.trim() || "",
        eligibility: document.getElementById("ascEligibility")?.value?.trim() || "",
        deadline: document.getElementById("ascDeadline")?.value?.trim() || "",
        officialSourceUrl: document.getElementById("ascOfficialSourceUrl")?.value?.trim() || "",
        applicationUrl: document.getElementById("ascApplicationUrl")?.value?.trim() || "",
        youtubeUrl,
        pdfUrl: document.getElementById("ascPdfUrl")?.value?.trim() || "",
        verifiedNote: document.getElementById("ascVerifiedNote")?.value?.trim() || "",
        published: Boolean(document.getElementById("ascPublished")?.checked)
      };

      try {
        await firebaseService.saveSkillCareerResource(state.user.uid, payload, { editId });
        form.reset();
        const editEl = document.getElementById("ascEditId");
        if (editEl) editEl.value = "";
        showToast(editId ? "Career resource updated." : "Career resource saved to Firestore.", "success");
      } catch (err) {
        showToast(err?.message || "Could not save career resource.", "error");
      }
    }
  });
}
