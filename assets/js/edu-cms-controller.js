// ============================================================================
// GURU JI VISION — PHASE 3 ADMIN EDUCATION CMS CONTROLLER
// ============================================================================
// Wires all Admin Student Zone CMS interactions:
// - Section switching & live search/subject/category/status filtering
// - One-click Publish / Unpublish toggles across Notes, Videos, MCQs, PYQs,
//   Syllabi, Practice/Mock Tests, and Agricultural Learning Resources
// - YouTube Video Learning CRUD with strict URL/ID validation
// - Official PYQ Paper + Answer Key PDF Upload & CRUD
// - Practice Test & Mock Test Builder CRUD
// - University Syllabus PDF Upload
// - Manual Agricultural Learning Resources CRUD (all 7 official categories)
// - Bulk "Send All New to Review Queue" for Automatic Discovery
// ============================================================================

import { firebaseService } from "./firebase-service.js";
import { resolveSubjectKey } from "./agri-education-data.js";
import {
  extractYouTubeInfo,
  validateStudyDocumentFile
} from "./edu-cms-utils.js";

export function createInitialEduCmsState() {
  return {
    activeSection: "notes",
    search: "",
    subjectKey: "ALL",
    category: "ALL",
    status: "ALL"
  };
}

function setFieldVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function resetVideoForm() {
  const form = document.getElementById("adminVideoForm");
  if (!form) return;
  form.reset();
  setFieldVal("avEditId", "");
  const titleEl = document.getElementById("avFormTitle");
  if (titleEl) titleEl.textContent = "Add YouTube Learning Video";
  document.getElementById("avCancelEdit")?.classList.add("hidden");
  const pubEl = document.getElementById("avPublished");
  if (pubEl) pubEl.checked = true;
}

function resetPyqForm() {
  const form = document.getElementById("adminPyqForm");
  if (!form) return;
  form.reset();
  setFieldVal("apyqEditId", "");
  const titleEl = document.getElementById("apyqFormTitle");
  if (titleEl) titleEl.textContent = "Upload Official PYQ Paper & Answer Key";
  document.getElementById("apyqCancelEdit")?.classList.add("hidden");
  const pubEl = document.getElementById("apyqPublished");
  if (pubEl) pubEl.checked = true;
  const dlEl = document.getElementById("apyqDownloadOk");
  if (dlEl) dlEl.checked = true;
}

function resetMockTestForm() {
  const form = document.getElementById("adminMockTestForm");
  if (!form) return;
  form.reset();
  setFieldVal("amtEditId", "");
  setFieldVal("amtDuration", "30");
  const titleEl = document.getElementById("amtFormTitle");
  if (titleEl) titleEl.textContent = "Create Practice Test / Mock Test";
  document.getElementById("amtCancelEdit")?.classList.add("hidden");
  const pubEl = document.getElementById("amtPublished");
  if (pubEl) pubEl.checked = true;
}

function resetResourceForm() {
  const form = document.getElementById("adminResourceForm");
  if (!form) return;
  form.reset();
  setFieldVal("aresEditId", "");
  setFieldVal("aresPubDate", new Date().toISOString().slice(0, 10));
  const titleEl = document.getElementById("aresFormTitle");
  if (titleEl) titleEl.textContent = "Add Agricultural Learning Resource";
  document.getElementById("aresCancelEdit")?.classList.add("hidden");
}

export function bindEduCmsEvents({
  state,
  renderActiveView,
  showToast,
  withBusySubmit
}) {
  const ensureCms = () => {
    if (!state.eduCms) state.eduCms = createInitialEduCmsState();
    return state.eduCms;
  };

  // CLICK DELEGATION
  document.addEventListener("click", async (e) => {
    const target = e.target.closest([
      "[data-cms-section]",
      "[data-cms-toggle-mat]",
      "[data-cms-toggle-quiz]",
      "[data-cms-toggle-syl]",
      "[data-cms-toggle-test]",
      "[data-cms-edit-video]",
      "[data-cms-edit-pyq]",
      "[data-cms-edit-test]",
      "[data-cms-del-test]",
      "[data-cms-edit-res]",
      "[data-cms-queue-all-candidates]",
      "#avCancelEdit",
      "#apyqCancelEdit",
      "#amtCancelEdit",
      "#aresCancelEdit"
    ].join(", "));
    if (!target) return;

    const cms = ensureCms();

    // Cancel Edit buttons
    if (target.id === "avCancelEdit") { resetVideoForm(); return; }
    if (target.id === "apyqCancelEdit") { resetPyqForm(); return; }
    if (target.id === "amtCancelEdit") { resetMockTestForm(); return; }
    if (target.id === "aresCancelEdit") { resetResourceForm(); return; }

    // Switch CMS Section
    if (target.dataset.cmsSection) {
      cms.activeSection = target.dataset.cmsSection;
      cms.category = "ALL";
      renderActiveView();
      return;
    }

    // All write operations require verified Admin
    if (!state.user || !state.isAdmin) {
      showToast("Authorized Admin sign-in required.", true);
      return;
    }

    // One-click Publish / Unpublish — Study Materials (Notes, Videos, PYQs)
    if (target.dataset.cmsToggleMat) {
      const nextPub = target.dataset.nextPub === "1";
      try {
        await firebaseService.toggleStudyMaterialPublished(target.dataset.cmsToggleMat, nextPub);
        showToast(nextPub ? "Published live to Student Zone!" : "Moved to Unpublished Draft.");
      } catch (err) {
        showToast(err.message || "Could not update publication status.", true);
      }
      return;
    }

    // One-click Publish / Unpublish — MCQs
    if (target.dataset.cmsToggleQuiz) {
      const nextPub = target.dataset.nextPub === "1";
      try {
        await firebaseService.toggleQuizPublished(target.dataset.cmsToggleQuiz, nextPub);
        showToast(nextPub ? "MCQ published to Student Zone!" : "MCQ moved to Draft.");
      } catch (err) {
        showToast(err.message || "Could not update MCQ status.", true);
      }
      return;
    }

    // One-click Publish / Unpublish — University Syllabi
    if (target.dataset.cmsToggleSyl) {
      const nextPub = target.dataset.nextPub === "1";
      try {
        await firebaseService.toggleUniversitySyllabusPublished(target.dataset.cmsToggleSyl, nextPub);
        showToast(nextPub ? "Syllabus published live!" : "Syllabus moved to Draft.");
      } catch (err) {
        showToast(err.message || "Could not update syllabus status.", true);
      }
      return;
    }

    // One-click Publish / Unpublish — Practice / Mock Tests
    if (target.dataset.cmsToggleTest) {
      const nextPub = target.dataset.nextPub === "1";
      try {
        await firebaseService.toggleMockTestPublished(target.dataset.cmsToggleTest, nextPub);
        showToast(nextPub ? "Test published live to students!" : "Test moved to Draft.");
      } catch (err) {
        showToast(err.message || "Could not update test status.", true);
      }
      return;
    }

    // Edit Video Lecture
    if (target.dataset.cmsEditVideo) {
      const v = (state.studyMaterials || []).find((x) => x.id === target.dataset.cmsEditVideo);
      if (!v) return;
      setFieldVal("avEditId", v.id);
      setFieldVal("avTitle", v.title || "");
      setFieldVal("avTitleBn", v.titleBn || "");
      setFieldVal("avYoutubeUrl", v.youtubeUrl || v.resourceUrl || "");
      setFieldVal("avThumbnailUrl", v.thumbnailUrl || "");
      setFieldVal("avSubjectKey", v.subjectKey || resolveSubjectKey(v.subject, v.title));
      setFieldVal("avSubject", v.subject || "");
      setFieldVal("avTopic", v.topic || "");
      setFieldVal("avLanguage", v.language || "EN");
      setFieldVal("avSemester", String(v.semester || 1));
      setFieldVal("avSourceName", v.sourceName || "");
      setFieldVal("avDescription", v.summary || "");
      const pubEl = document.getElementById("avPublished");
      if (pubEl) pubEl.checked = v.published !== false;
      const titleEl = document.getElementById("avFormTitle");
      if (titleEl) titleEl.textContent = "Edit YouTube Learning Video";
      document.getElementById("avCancelEdit")?.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Edit Official PYQ Paper
    if (target.dataset.cmsEditPyq) {
      const p = (state.studyMaterials || []).find((x) => x.id === target.dataset.cmsEditPyq);
      if (!p) return;
      setFieldVal("apyqEditId", p.id);
      setFieldVal("apyqTitle", p.title || "");
      setFieldVal("apyqExamCategory", p.examCategory || "BSC_SEMESTER");
      setFieldVal("apyqExamYear", p.examYear || "");
      setFieldVal("apyqOrigin", p.pyqOrigin || "OFFICIAL_PYQ");
      setFieldVal("apyqSemester", String(p.semester || 1));
      setFieldVal("apyqSubjectKey", p.subjectKey || resolveSubjectKey(p.subject, p.title));
      setFieldVal("apyqSubject", p.subject || "");
      setFieldVal("apyqPaperUrl", p.resourceUrl || "");
      setFieldVal("apyqAnswerKeyUrl", p.answerKeyUrl || "");
      setFieldVal("apyqSourceName", p.sourceName || "");
      setFieldVal("apyqSourceUrl", p.sourceUrl || "");
      setFieldVal("apyqSummary", p.summary || "");
      const dlEl = document.getElementById("apyqDownloadOk");
      if (dlEl) dlEl.checked = Boolean(p.downloadPermitted);
      const pubEl = document.getElementById("apyqPublished");
      if (pubEl) pubEl.checked = p.published !== false;
      const titleEl = document.getElementById("apyqFormTitle");
      if (titleEl) titleEl.textContent = "Edit PYQ Paper & Answer Key";
      document.getElementById("apyqCancelEdit")?.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Edit Practice / Mock Test
    if (target.dataset.cmsEditTest) {
      const t = (state.mockTests || []).find((x) => x.id === target.dataset.cmsEditTest);
      if (!t) return;
      setFieldVal("amtEditId", t.id);
      setFieldVal("amtTitle", t.title || "");
      setFieldVal("amtTestType", t.testType || "MOCK_TEST");
      setFieldVal("amtDuration", String(t.durationMinutes || 30));
      setFieldVal("amtExamCategory", t.examCategory || "ALL");
      setFieldVal("amtSubjectKey", t.subjectKey || "ALL");
      setFieldVal("amtSemester", String(t.semester || 0));
      setFieldVal("amtDifficulty", t.difficulty || "ALL");
      setFieldVal("amtDescription", t.description || "");
      const pyqEl = document.getElementById("amtOfficialPyqOnly");
      if (pyqEl) pyqEl.checked = Boolean(t.onlyOfficialPyq);
      const pubEl = document.getElementById("amtPublished");
      if (pubEl) pubEl.checked = t.published !== false;
      const titleEl = document.getElementById("amtFormTitle");
      if (titleEl) titleEl.textContent = "Edit Practice / Mock Test";
      document.getElementById("amtCancelEdit")?.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Delete Practice / Mock Test
    if (target.dataset.cmsDelTest) {
      if (!confirm("Delete this Practice / Mock Test? Student past attempt history will be preserved.")) return;
      try {
        await firebaseService.deleteMockTest(target.dataset.cmsDelTest);
        showToast("Practice / Mock Test deleted.");
      } catch (err) {
        showToast(err.message || "Delete failed.", true);
      }
      return;
    }

    // Edit Agricultural Learning Resource
    if (target.dataset.cmsEditRes) {
      const r = (state.discoveredStudyResources || []).find((x) => x.id === target.dataset.cmsEditRes);
      if (!r) return;
      setFieldVal("aresEditId", r.id);
      setFieldVal("aresTitle", r.title || "");
      setFieldVal("aresCategory", r.category || "ICAR_RESOURCE");
      setFieldVal("aresSubjectKey", r.subjectKey || "OTHER");
      setFieldVal("aresSourceWebsite", r.sourceWebsite || "");
      setFieldVal("aresTopic", r.topic || "");
      setFieldVal("aresLanguage", r.language || "EN");
      setFieldVal("aresOrigin", r.resourceOrigin || "OFFICIAL_ICAR");
      setFieldVal("aresPubDate", r.publicationDate || new Date().toISOString().slice(0, 10));
      setFieldVal("aresSourceUrl", r.sourceUrl || "");
      setFieldVal("aresSummary", r.summary || "");
      setFieldVal("aresStatus", r.reviewStatus === "APPROVED_PUBLISHED" ? "APPROVED_PUBLISHED" : "PENDING_REVIEW");
      const titleEl = document.getElementById("aresFormTitle");
      if (titleEl) titleEl.textContent = "Edit Agricultural Learning Resource";
      document.getElementById("aresCancelEdit")?.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Bulk Send All New Discovery Candidates to Admin Review Queue
    if (target.dataset.cmsQueueAllCandidates) {
      const candidates = state.edu?.liveDiscoveryCandidates || [];
      const fresh = candidates.filter((c) => !c.isDuplicate);
      if (!fresh.length) {
        showToast("All discovered candidates are already in the catalog or review queue.");
        return;
      }
      target.disabled = true;
      let queued = 0;
      try {
        for (let i = 0; i < candidates.length; i++) {
          const c = candidates[i];
          if (c.isDuplicate) continue;
          await firebaseService.saveDiscoveredStudyResource(state.user.uid, {
            ...c,
            reviewStatus: "PENDING_REVIEW"
          });
          candidates[i] = { ...c, isDuplicate: true };
          queued++;
        }
        showToast(`Queued ${queued} new official resource(s) into Admin Review Queue.`);
        renderActiveView();
      } catch (err) {
        showToast(err.message || "Could not queue all candidates.", true);
      } finally {
        target.disabled = false;
      }
      return;
    }
  });

  // LIVE SEARCH INPUT (Caret-preserving)
  document.addEventListener("input", (e) => {
    if (e.target.id !== "eduCmsSearchInput") return;
    const cms = ensureCms();
    cms.search = e.target.value;
    renderActiveView();
    const el = document.getElementById("eduCmsSearchInput");
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  });

  // DROPDOWN FILTERS & FILE UPLOADS
  document.addEventListener("change", async (e) => {
    const id = e.target.id;
    const cms = ensureCms();

    if (id === "eduCmsSubjectFilter") {
      cms.subjectKey = e.target.value;
      renderActiveView();
      return;
    }
    if (id === "eduCmsCategoryFilter") {
      cms.category = e.target.value;
      renderActiveView();
      return;
    }
    if (id === "eduCmsStatusFilter") {
      cms.status = e.target.value;
      renderActiveView();
      return;
    }

    // PYQ Question Paper Upload
    if (id === "apyqPaperUpload" && e.target.files?.[0]) {
      const file = e.target.files[0];
      const check = validateStudyDocumentFile(file);
      if (!check.ok) {
        showToast(check.error, true);
        e.target.value = "";
        return;
      }
      try {
        showToast(`Uploading ${check.fileType} question paper...`);
        const url = await firebaseService.uploadPdfToStorage(file);
        setFieldVal("apyqPaperUrl", url);
        showToast("Question paper uploaded & attached!");
      } catch (err) {
        showToast(err.message || "Upload failed. You can paste a verified URL instead.", true);
      }
      return;
    }

    // PYQ Answer Key Upload
    if (id === "apyqAnswerKeyUpload" && e.target.files?.[0]) {
      const file = e.target.files[0];
      const check = validateStudyDocumentFile(file);
      if (!check.ok) {
        showToast(check.error, true);
        e.target.value = "";
        return;
      }
      try {
        showToast(`Uploading ${check.fileType} answer key...`);
        const url = await firebaseService.uploadPdfToStorage(file);
        setFieldVal("apyqAnswerKeyUrl", url);
        showToast("Official answer key uploaded & attached!");
      } catch (err) {
        showToast(err.message || "Upload failed. You can paste a verified URL instead.", true);
      }
      return;
    }

    // University Syllabus PDF Upload
    if (id === "asylPdfUpload" && e.target.files?.[0]) {
      const file = e.target.files[0];
      const check = validateStudyDocumentFile(file);
      if (!check.ok) {
        showToast(check.error, true);
        e.target.value = "";
        return;
      }
      try {
        showToast("Uploading official syllabus PDF...");
        const url = await firebaseService.uploadPdfToStorage(file);
        setFieldVal("asylPdfUrl", url);
        showToast("Syllabus PDF uploaded & attached!");
      } catch (err) {
        showToast(err.message || "Upload failed. Paste an official PDF URL instead.", true);
      }
      return;
    }
  });

  // FORM SUBMISSIONS
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    const handledForms = new Set([
      "adminVideoForm",
      "adminPyqForm",
      "adminMockTestForm",
      "adminResourceForm"
    ]);
    if (!handledForms.has(form.id)) return;
    e.preventDefault();

    if (!state.user || !state.isAdmin) {
      showToast("Authorized Admin sign-in required.", true);
      return;
    }

    // 1. Video Learning Form
    if (form.id === "adminVideoForm") {
      await withBusySubmit(form, async () => {
        const rawUrl = (document.getElementById("avYoutubeUrl")?.value || "").trim();
        const yt = extractYouTubeInfo(rawUrl);
        if (!yt.ok || !yt.videoId) {
          throw new Error(yt.error || "Please enter a valid YouTube video URL (youtube.com/watch?v=... or youtu.be/...).");
        }
        const editId = document.getElementById("avEditId")?.value || "";
        const customThumb = (document.getElementById("avThumbnailUrl")?.value || "").trim();
        const title = document.getElementById("avTitle")?.value || "";
        const subject = document.getElementById("avSubject")?.value || "";

        await firebaseService.saveStudyMaterial(
          state.user.uid,
          {
            title,
            titleBn: document.getElementById("avTitleBn")?.value || "",
            semester: document.getElementById("avSemester")?.value || 1,
            category: "VIDEO_LECTURE",
            subjectKey: document.getElementById("avSubjectKey")?.value || resolveSubjectKey(subject, title),
            subject,
            topic: document.getElementById("avTopic")?.value || "",
            language: document.getElementById("avLanguage")?.value || "EN",
            resourceUrl: yt.watchUrl,
            youtubeUrl: yt.watchUrl,
            youtubeVideoId: yt.videoId,
            thumbnailUrl: customThumb || yt.thumbnailUrl,
            sourceName: document.getElementById("avSourceName")?.value || "YouTube Educational Lecture",
            sourceUrl: yt.watchUrl,
            lastUpdatedDate: new Date().toISOString().slice(0, 10),
            contentOrigin: "CURATED_REFERENCE",
            summary: document.getElementById("avDescription")?.value || "",
            contentText: "",
            published: Boolean(document.getElementById("avPublished")?.checked),
            verifiedForAi: false,
            downloadPermitted: false
          },
          editId
        );
        resetVideoForm();
        showToast(editId ? "Video lecture updated live!" : "Video lecture saved to Student Zone!");
      });
      return;
    }

    // 2. Official PYQ Paper Form
    if (form.id === "adminPyqForm") {
      await withBusySubmit(form, async () => {
        const editId = document.getElementById("apyqEditId")?.value || "";
        const title = document.getElementById("apyqTitle")?.value || "";
        const subject = document.getElementById("apyqSubject")?.value || "";
        const pyqOrigin = document.getElementById("apyqOrigin")?.value || "OFFICIAL_PYQ";
        const contentOrigin = pyqOrigin === "OFFICIAL_PYQ"
          ? "OFFICIAL_PUBLICATION"
          : (pyqOrigin === "AI_PRACTICE" ? "AI_PRACTICE" : "CURATED_REFERENCE");

        await firebaseService.saveStudyMaterial(
          state.user.uid,
          {
            title,
            semester: document.getElementById("apyqSemester")?.value || 1,
            category: "PYQ",
            subjectKey: document.getElementById("apyqSubjectKey")?.value || resolveSubjectKey(subject, title),
            subject,
            topic: `${document.getElementById("apyqExamCategory")?.value || "Exam"} ${document.getElementById("apyqExamYear")?.value || ""}`.trim(),
            examCategory: document.getElementById("apyqExamCategory")?.value || "BSC_SEMESTER",
            examYear: document.getElementById("apyqExamYear")?.value || "",
            pyqOrigin,
            resourceUrl: document.getElementById("apyqPaperUrl")?.value || "",
            answerKeyUrl: document.getElementById("apyqAnswerKeyUrl")?.value || "",
            sourceName: document.getElementById("apyqSourceName")?.value || "Exam Authority",
            sourceUrl: document.getElementById("apyqSourceUrl")?.value || "",
            lastUpdatedDate: new Date().toISOString().slice(0, 10),
            contentOrigin,
            summary: document.getElementById("apyqSummary")?.value || "",
            contentText: "",
            downloadPermitted: Boolean(document.getElementById("apyqDownloadOk")?.checked),
            published: Boolean(document.getElementById("apyqPublished")?.checked),
            verifiedForAi: false
          },
          editId
        );
        resetPyqForm();
        showToast(editId ? "PYQ paper updated live!" : "PYQ paper saved live!");
      });
      return;
    }

    // 3. Practice Test & Mock Test Form
    if (form.id === "adminMockTestForm") {
      await withBusySubmit(form, async () => {
        const editId = document.getElementById("amtEditId")?.value || "";
        await firebaseService.saveMockTest(
          state.user.uid,
          {
            title: document.getElementById("amtTitle")?.value || "",
            testType: document.getElementById("amtTestType")?.value || "MOCK_TEST",
            durationMinutes: document.getElementById("amtDuration")?.value || 30,
            examCategory: document.getElementById("amtExamCategory")?.value || "ALL",
            subjectKey: document.getElementById("amtSubjectKey")?.value || "ALL",
            semester: document.getElementById("amtSemester")?.value || 0,
            difficulty: document.getElementById("amtDifficulty")?.value || "ALL",
            description: document.getElementById("amtDescription")?.value || "",
            onlyOfficialPyq: Boolean(document.getElementById("amtOfficialPyqOnly")?.checked),
            published: Boolean(document.getElementById("amtPublished")?.checked)
          },
          editId
        );
        resetMockTestForm();
        showToast(editId ? "Practice / Mock Test updated!" : "Practice / Mock Test created live!");
      });
      return;
    }

    // 4. Agricultural Learning Resource Form (All 7 Categories)
    if (form.id === "adminResourceForm") {
      await withBusySubmit(form, async () => {
        const editId = document.getElementById("aresEditId")?.value || "";
        await firebaseService.saveDiscoveredStudyResource(
          state.user.uid,
          {
            title: document.getElementById("aresTitle")?.value || "",
            category: document.getElementById("aresCategory")?.value || "ICAR_RESOURCE",
            subjectKey: document.getElementById("aresSubjectKey")?.value || "OTHER",
            sourceWebsite: document.getElementById("aresSourceWebsite")?.value || "Official Institution",
            topic: document.getElementById("aresTopic")?.value || "Agriculture",
            language: document.getElementById("aresLanguage")?.value || "EN",
            resourceOrigin: document.getElementById("aresOrigin")?.value || "OFFICIAL_ICAR",
            publicationDate: document.getElementById("aresPubDate")?.value || new Date().toISOString().slice(0, 10),
            sourceUrl: document.getElementById("aresSourceUrl")?.value || "",
            summary: document.getElementById("aresSummary")?.value || "",
            reviewStatus: document.getElementById("aresStatus")?.value || "APPROVED_PUBLISHED",
            discoveryMethod: "ADMIN_SUBMITTED"
          },
          editId
        );
        resetResourceForm();
        showToast(editId ? "Learning resource updated live!" : "Agricultural learning resource saved!");
      });
      return;
    }
  });
}
