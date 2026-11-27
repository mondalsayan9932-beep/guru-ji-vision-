// ============================================================================
// GURU JI VISION — AGRICULTURE EDUCATION & ADMIN DISCOVERY CONTROLLER (PHASE 7)
// ============================================================================
// Handles:
// - Bilingual EN/BN education toggle, 13-subject/topic/exam filters, PDF viewer
// - Private cloud bookmarks (/users/{uid}/studyBookmarks) + guest localStorage fallback
// - Continue Learning progress recording
// - MCQ Practice / Mock Test / Official PYQ mode & saved MCQ filters
// - University Syllabus filters & Admin Syllabus CRUD
// - Automatic Official Study Resource Discovery (allowlisted RSS/OpenAlex API)
//   with duplicate detection & Admin Review / Publish workflow
// ============================================================================

import { firebaseService } from "./firebase-service.js";
import { isDuplicateDiscoveredResource, mergeStudyMaterials } from "./agri-education-data.js";

const GUEST_BOOKMARKS_STORAGE_KEY = "gjv_edu_bookmarks_guest";

export function createInitialEduState() {
  return {
    lang: "", // "" follows global state.lang, or explicit "EN" | "BN"
    noteSubject: "ALL",
    noteTopic: "",
    noteExamTag: "ALL",
    noteViewMode: "ALL", // ALL | RECENT | POPULAR | SAVED
    previewPdfUrl: "",
    previewPdfTitle: "",
    previewVideoUrl: "",
    previewVideoTitle: "",
    videoSubject: "ALL",
    videoLanguage: "ALL",
    videoSearch: "",
    pyqExam: "ALL",
    pyqYear: "",
    pyqOrigin: "ALL",
    pyqSearch: "",
    resCategory: "ALL",
    resSubject: "ALL",
    resSearch: "",
    activeMockTestId: "",
    quizMode: "PRACTICE", // PRACTICE | MOCK_TEST | PYQ_SET
    quizExam: "ALL",
    quizSubject: "ALL",
    quizType: "ALL",
    quizDifficulty: "ALL",
    quizSearch: "",
    quizSavedOnly: false,
    syllabusUniversity: "ALL",
    syllabusSubject: "ALL",
    syllabusSearch: "",
    discoveryLoading: false,
    discoveryStatus: "",
    liveDiscoveryCandidates: []
  };
}

export function loadGuestBookmarks() {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(GUEST_BOOKMARKS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function saveGuestBookmarks(list) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(GUEST_BOOKMARKS_STORAGE_KEY, JSON.stringify((list || []).slice(0, 120)));
  } catch (_) {}
}

function makeBookmarkDocId(itemType, itemId) {
  const cleanType = String(itemType || "NOTE").toUpperCase().replace(/[^A-Z0-9_]/g, "");
  const cleanId = String(itemId || "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  return `${cleanType}__${cleanId}`;
}

export async function recordContinueLearning(state, mat) {
  if (!mat || !mat.id) return;
  const entry = {
    id: makeBookmarkDocId("PROGRESS", mat.id),
    itemType: "PROGRESS",
    itemId: String(mat.id).slice(0, 140),
    title: String(mat.title || "Study Note").slice(0, 180),
    subject: String(mat.subjectLabelEn || mat.subject || "Agriculture").slice(0, 100),
    semester: Math.min(8, Math.max(0, parseInt(mat.semester, 10) || 0)),
    updatedAtMs: Date.now()
  };

  if (state.user && firebaseService.ready) {
    try {
      await firebaseService.saveStudyBookmark(state.user.uid, entry);
    } catch (_) {}
    return;
  }

  const current = Array.isArray(state.studyBookmarks) ? [...state.studyBookmarks] : [];
  const filtered = current.filter((b) => !(b.itemType === "PROGRESS" && b.itemId === entry.itemId));
  filtered.unshift(entry);
  state.studyBookmarks = filtered;
  saveGuestBookmarks(filtered);
}

function resetSyllabusForm() {
  const form = document.getElementById("adminSyllabusForm");
  if (!form) return;
  form.reset();
  const editEl = document.getElementById("asylEditId");
  if (editEl) editEl.value = "";
  const titleEl = document.getElementById("asylFormTitle");
  if (titleEl) titleEl.textContent = "Add Official University Syllabus";
  document.getElementById("asylCancelEdit")?.classList.add("hidden");
  const courseEl = document.getElementById("asylCourse");
  if (courseEl && !courseEl.value) courseEl.value = "B.Sc. (Hons.) Agriculture";
  const pubEl = document.getElementById("asylPublished");
  if (pubEl) pubEl.checked = true;
}

export function bindAgriEducationEvents({
  state,
  renderActiveView,
  showToast,
  withBusySubmit
}) {
  const ensureEdu = () => {
    if (!state.edu) state.edu = createInitialEduState();
    return state.edu;
  };

  // CLICK DELEGATION
  document.addEventListener("click", async (e) => {
    const target = e.target.closest([
      "[data-edu-lang]",
      "[data-edu-note-mode]",
      "[data-edu-reset-notes]",
      "[data-edu-preview-pdf]",
      "[data-edu-close-pdf]",
      "[data-edu-play-video]",
      "[data-edu-close-video]",
      "[data-edu-jump-pyq-mcqs]",
      "[data-edu-start-test]",
      "[data-edu-exit-test]",
      "[data-edu-res-cat]",
      "[data-edu-bookmark-type]",
      "[data-edu-quiz-mode]",
      "[data-edu-quiz-exam]",
      "[data-edu-quiz-saved-toggle]",
      "[data-edu-reset-quiz-filters]",
      "[data-edu-open-saved-mcqs]",
      "[data-admin-run-discovery]",
      "[data-admin-approve-candidate]",
      "[data-admin-queue-candidate]",
      "[data-admin-review-disc]",
      "[data-admin-del-disc]",
      "[data-admin-edit-syl]",
      "[data-admin-del-syl]",
      "#asylCancelEdit"
    ].join(", "));
    if (!target) return;

    const edu = ensureEdu();

    if (target.id === "asylCancelEdit") {
      resetSyllabusForm();
      return;
    }

    if (target.dataset.eduLang) {
      edu.lang = target.dataset.eduLang === "BN" ? "BN" : "EN";
      renderActiveView();
      return;
    }

    if (target.dataset.eduNoteMode) {
      edu.noteViewMode = target.dataset.eduNoteMode;
      renderActiveView();
      return;
    }

    if (target.dataset.eduResetNotes) {
      state.studentSemester = 0;
      state.studentCategory = "ALL";
      state.studentSearch = "";
      edu.noteSubject = "ALL";
      edu.noteTopic = "";
      edu.noteExamTag = "ALL";
      edu.noteViewMode = "ALL";
      renderActiveView();
      return;
    }

    if (target.dataset.eduPreviewPdf) {
      edu.previewPdfUrl = target.dataset.eduPreviewPdf;
      edu.previewPdfTitle = target.dataset.eduPreviewTitle || "PDF Viewer";
      renderActiveView();
      return;
    }

    if (target.dataset.eduClosePdf) {
      edu.previewPdfUrl = "";
      edu.previewPdfTitle = "";
      renderActiveView();
      return;
    }

    if (target.dataset.eduPlayVideo) {
      edu.previewVideoUrl = target.dataset.eduPlayVideo;
      edu.previewVideoTitle = target.dataset.eduPlayTitle || "Video Lecture";
      renderActiveView();
      return;
    }

    if (target.dataset.eduCloseVideo) {
      edu.previewVideoUrl = "";
      edu.previewVideoTitle = "";
      renderActiveView();
      return;
    }

    if (target.dataset.eduJumpPyqMcqs) {
      state.studentSubTab = "quiz";
      edu.activeMockTestId = "";
      edu.quizMode = "PYQ_SET";
      state.quizSubmitted = false;
      renderActiveView();
      return;
    }

    if (target.dataset.eduStartTest) {
      edu.activeMockTestId = target.dataset.eduStartTest;
      state.quizAnswers = {};
      state.quizSubmitted = false;
      renderActiveView();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (target.dataset.eduExitTest) {
      edu.activeMockTestId = "";
      state.quizAnswers = {};
      state.quizSubmitted = false;
      renderActiveView();
      return;
    }

    if (target.dataset.eduResCat) {
      edu.resCategory = target.dataset.eduResCat;
      renderActiveView();
      return;
    }

    if (target.dataset.eduBookmarkType) {
      const itemType = target.dataset.eduBookmarkType;
      const itemId = target.dataset.eduBookmarkId || "";
      const title = target.dataset.eduBookmarkTitle || "Saved Item";
      const subject = target.dataset.eduBookmarkSubject || "Agriculture";
      const semester = parseInt(target.dataset.eduBookmarkSem || "0", 10) || 0;
      if (!itemId) return;

      const docId = makeBookmarkDocId(itemType, itemId);
      const list = Array.isArray(state.studyBookmarks) ? state.studyBookmarks : [];
      const exists = list.find((b) => b.itemType === itemType && b.itemId === itemId);

      if (state.user && firebaseService.ready) {
        try {
          if (exists) {
            await firebaseService.deleteStudyBookmark(state.user.uid, exists.id || docId);
            showToast("Removed from Saved.");
          } else {
            await firebaseService.saveStudyBookmark(state.user.uid, {
              id: docId,
              itemType,
              itemId,
              title,
              subject,
              semester
            });
            showToast("Saved to your private Study Desk!");
          }
        } catch (err) {
          showToast(err.message || "Could not update bookmark.", true);
        }
      } else {
        if (exists) {
          state.studyBookmarks = list.filter((b) => !(b.itemType === itemType && b.itemId === itemId));
          showToast("Removed from Saved.");
        } else {
          state.studyBookmarks = [
            { id: docId, itemType, itemId, title, subject, semester, updatedAtMs: Date.now() },
            ...list
          ];
          showToast("Saved on this device. Sign in to sync across devices.");
        }
        saveGuestBookmarks(state.studyBookmarks);
        renderActiveView();
      }
      return;
    }

    if (target.dataset.eduQuizMode) {
      edu.quizMode = target.dataset.eduQuizMode;
      state.quizSubmitted = false;
      renderActiveView();
      return;
    }

    if (target.dataset.eduQuizExam) {
      edu.quizExam = target.dataset.eduQuizExam;
      state.quizSubmitted = false;
      renderActiveView();
      return;
    }

    if (target.dataset.eduQuizSavedToggle) {
      edu.quizSavedOnly = !edu.quizSavedOnly;
      state.quizSubmitted = false;
      renderActiveView();
      return;
    }

    if (target.dataset.eduResetQuizFilters) {
      state.studentSemester = 0;
      edu.quizMode = "PRACTICE";
      edu.quizExam = "ALL";
      edu.quizSubject = "ALL";
      edu.quizType = "ALL";
      edu.quizDifficulty = "ALL";
      edu.quizSearch = "";
      edu.quizSavedOnly = false;
      state.quizSubmitted = false;
      renderActiveView();
      return;
    }

    if (target.dataset.eduOpenSavedMcqs) {
      state.studentSubTab = "quiz";
      edu.quizSavedOnly = true;
      edu.quizMode = "PRACTICE";
      state.quizSubmitted = false;
      renderActiveView();
      return;
    }

    // --- ADMIN AUTOMATIC DISCOVERY ---
    if (target.dataset.adminRunDiscovery) {
      if (!state.user || !state.isAdmin) {
        showToast("Admin access required.", true);
        return;
      }
      const qVal = (document.getElementById("adminDiscoveryQuery")?.value || "").trim();
      edu.discoveryLoading = true;
      edu.discoveryStatus = "Querying permitted official RSS & OpenAlex APIs...";
      renderActiveView();

      try {
        const endpoint = qVal
          ? `/.netlify/functions/discover-study-resources?q=${encodeURIComponent(qVal)}`
          : "/.netlify/functions/discover-study-resources";
        const res = await fetch(endpoint, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`Discovery service returned HTTP ${res.status}`);
        const payload = await res.json();
        const existingMaterials = mergeStudyMaterials(state.studyMaterials || [], true);
        const existingDiscovered = state.discoveredStudyResources || [];
        const rawItems = Array.isArray(payload.discovered)
          ? payload.discovered
          : (Array.isArray(payload.items) ? payload.items : []);
        const enriched = rawItems.map((item) => ({
          ...item,
          isDuplicate: isDuplicateDiscoveredResource(item, existingDiscovered, existingMaterials)
        }));
        edu.liveDiscoveryCandidates = enriched;
        const dupCount = enriched.filter((x) => x.isDuplicate).length;
        const statusList = Array.isArray(payload.feedStatuses)
          ? payload.feedStatuses
          : (Array.isArray(payload.sourcesChecked) ? payload.sourcesChecked : []);
        const autoSources = statusList.filter((s) => s.ok).length;
        edu.discoveryStatus = `Scan complete: ${enriched.length} candidates found from ${autoSources} permitted official feed(s) (${dupCount} already in catalog). Review below before publishing.`;
        showToast(`Discovered ${enriched.length} candidate resources for review.`);
      } catch (err) {
        edu.discoveryStatus = `Live discovery endpoint unavailable locally (${err.message}). In production on Netlify, PIB Agriculture RSS, FAO RSS, and OpenAlex API run automatically.`;
        showToast(err.message || "Discovery scan failed.", true);
      } finally {
        edu.discoveryLoading = false;
        renderActiveView();
      }
      return;
    }

    if (target.dataset.adminApproveCandidate !== undefined || target.dataset.adminQueueCandidate !== undefined) {
      if (!state.user || !state.isAdmin) return;
      const isApprove = target.dataset.adminApproveCandidate !== undefined;
      const idx = parseInt(isApprove ? target.dataset.adminApproveCandidate : target.dataset.adminQueueCandidate, 10);
      const candidate = (edu.liveDiscoveryCandidates || [])[idx];
      if (!candidate) return;
      try {
        await firebaseService.saveDiscoveredStudyResource(state.user.uid, {
          ...candidate,
          reviewStatus: isApprove ? "APPROVED_PUBLISHED" : "PENDING_REVIEW"
        });
        edu.liveDiscoveryCandidates[idx] = { ...candidate, isDuplicate: true };
        showToast(isApprove ? "Resource approved & published to Student Portal!" : "Resource saved to Pending Review queue.");
        renderActiveView();
      } catch (err) {
        showToast(err.message || "Failed to save discovered resource.", true);
      }
      return;
    }

    if (target.dataset.adminReviewDisc) {
      if (!state.user || !state.isAdmin) return;
      const id = target.dataset.adminReviewDisc;
      const rawStatus = target.dataset.reviewStatus;
      const nextStatus = ["APPROVED_PUBLISHED", "PENDING_REVIEW", "REJECTED"].includes(rawStatus)
        ? rawStatus
        : "PENDING_REVIEW";
      try {
        await firebaseService.updateDiscoveredStudyResourceStatus(state.user.uid, id, nextStatus);
        showToast(
          nextStatus === "APPROVED_PUBLISHED"
            ? "Published live to students!"
            : (nextStatus === "REJECTED" ? "Marked as Rejected." : "Moved back to Pending Review.")
        );
      } catch (err) {
        showToast(err.message || "Failed to update review status.", true);
      }
      return;
    }

    if (target.dataset.adminDelDisc) {
      if (!state.user || !state.isAdmin) return;
      if (!confirm("Delete this learning resource from Firestore?")) return;
      try {
        await firebaseService.deleteDiscoveredStudyResource(target.dataset.adminDelDisc);
        showToast("Learning resource deleted.");
      } catch (err) {
        showToast(err.message || "Delete failed.", true);
      }
      return;
    }

    // --- ADMIN UNIVERSITY SYLLABUS EDIT / DELETE ---
    if (target.dataset.adminEditSyl) {
      const syl = (state.universitySyllabi || []).find((s) => s.id === target.dataset.adminEditSyl);
      if (!syl) return;
      const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
      setVal("asylEditId", syl.id);
      setVal("asylUniversity", syl.university || "");
      setVal("asylUniShort", syl.universityShort || "");
      setVal("asylSession", syl.academicSession || "");
      setVal("asylPubYear", syl.publicationYear || "");
      setVal("asylCourse", syl.course || "B.Sc. (Hons.) Agriculture");
      setVal("asylSemester", String(syl.semester || 1));
      setVal("asylSubjectKey", syl.subjectKey || "OTHER");
      setVal("asylSubject", syl.subject || "");
      setVal("asylTopics", Array.isArray(syl.topics) ? syl.topics.join("\n") : "");
      setVal("asylSourceUrl", syl.sourceUrl || "");
      setVal("asylPdfUrl", syl.pdfUrl || "");
      const dl = document.getElementById("asylDownloadOk");
      if (dl) dl.checked = Boolean(syl.downloadPermitted);
      const pub = document.getElementById("asylPublished");
      if (pub) pub.checked = syl.published !== false;
      const titleEl = document.getElementById("asylFormTitle");
      if (titleEl) titleEl.textContent = "Edit Official University Syllabus";
      document.getElementById("asylCancelEdit")?.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (target.dataset.adminDelSyl) {
      if (!state.user || !state.isAdmin) return;
      if (!confirm("Delete this university syllabus entry?")) return;
      try {
        await firebaseService.deleteUniversitySyllabus(target.dataset.adminDelSyl);
        showToast("University syllabus deleted.");
      } catch (err) {
        showToast(err.message || "Delete failed.", true);
      }
      return;
    }
  });

  // LIVE SEARCH INPUTS (Caret-preserving)
  document.addEventListener("input", (e) => {
    const id = e.target.id;
    const edu = ensureEdu();
    const refocus = (elId) => {
      const el = document.getElementById(elId);
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    };
    if (id === "eduNoteTopic") {
      edu.noteTopic = e.target.value;
      renderActiveView();
      refocus("eduNoteTopic");
    } else if (id === "eduQuizSearch") {
      edu.quizSearch = e.target.value;
      state.quizSubmitted = false;
      renderActiveView();
      refocus("eduQuizSearch");
    } else if (id === "eduSyllabusSearch") {
      edu.syllabusSearch = e.target.value;
      renderActiveView();
      refocus("eduSyllabusSearch");
    } else if (id === "eduVideoSearch") {
      edu.videoSearch = e.target.value;
      renderActiveView();
      refocus("eduVideoSearch");
    } else if (id === "eduPyqSearch") {
      edu.pyqSearch = e.target.value;
      renderActiveView();
      refocus("eduPyqSearch");
    } else if (id === "eduResSearch") {
      edu.resSearch = e.target.value;
      renderActiveView();
      refocus("eduResSearch");
    }
  });

  // DROPDOWN FILTERS
  document.addEventListener("change", (e) => {
    const id = e.target.id;
    const edu = ensureEdu();
    if (id === "eduNoteSubject") {
      edu.noteSubject = e.target.value;
      renderActiveView();
    } else if (id === "eduNoteExamTag") {
      edu.noteExamTag = e.target.value;
      renderActiveView();
    } else if (id === "eduQuizSubject") {
      edu.quizSubject = e.target.value;
      state.quizSubmitted = false;
      renderActiveView();
    } else if (id === "eduQuizType") {
      edu.quizType = e.target.value;
      state.quizSubmitted = false;
      renderActiveView();
    } else if (id === "eduQuizDifficulty") {
      edu.quizDifficulty = e.target.value;
      state.quizSubmitted = false;
      renderActiveView();
    } else if (id === "eduSyllabusUniversity") {
      edu.syllabusUniversity = e.target.value;
      renderActiveView();
    } else if (id === "eduSyllabusSubject") {
      edu.syllabusSubject = e.target.value;
      renderActiveView();
    } else if (id === "eduVideoSubject") {
      edu.videoSubject = e.target.value;
      renderActiveView();
    } else if (id === "eduVideoLanguage") {
      edu.videoLanguage = e.target.value;
      renderActiveView();
    } else if (id === "eduPyqExam") {
      edu.pyqExam = e.target.value;
      renderActiveView();
    } else if (id === "eduPyqYear") {
      edu.pyqYear = e.target.value;
      renderActiveView();
    } else if (id === "eduPyqOrigin") {
      edu.pyqOrigin = e.target.value;
      renderActiveView();
    } else if (id === "eduResSubject") {
      edu.resSubject = e.target.value;
      renderActiveView();
    }
  });

  // ADMIN UNIVERSITY SYLLABUS SUBMIT
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (form.id !== "adminSyllabusForm") return;
    e.preventDefault();
    if (!state.user || !state.isAdmin) {
      showToast("Admin sign-in required.", true);
      return;
    }

    await withBusySubmit(form, async () => {
      const editId = document.getElementById("asylEditId")?.value || "";
      const topicsRaw = document.getElementById("asylTopics")?.value || "";
      const topics = topicsRaw.split(/\r?\n/).map((t) => t.trim()).filter(Boolean).slice(0, 40);
      if (!topics.length) throw new Error("Please enter at least one syllabus topic (one per line).");

      await firebaseService.saveUniversitySyllabus(
        state.user.uid,
        {
          university: document.getElementById("asylUniversity")?.value || "",
          universityShort: document.getElementById("asylUniShort")?.value || "",
          academicSession: document.getElementById("asylSession")?.value || "",
          publicationYear: document.getElementById("asylPubYear")?.value || "",
          course: document.getElementById("asylCourse")?.value || "B.Sc. (Hons.) Agriculture",
          semester: document.getElementById("asylSemester")?.value || 1,
          subjectKey: document.getElementById("asylSubjectKey")?.value || "OTHER",
          subject: document.getElementById("asylSubject")?.value || "",
          topics,
          sourceUrl: document.getElementById("asylSourceUrl")?.value || "",
          pdfUrl: document.getElementById("asylPdfUrl")?.value || "",
          downloadPermitted: Boolean(document.getElementById("asylDownloadOk")?.checked),
          published: Boolean(document.getElementById("asylPublished")?.checked)
        },
        editId
      );
      resetSyllabusForm();
      showToast(editId ? "University syllabus updated live!" : "Official university syllabus published live!");
    });
  });

  // ESC closes inline PDF / Video modals cleanly
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (state.edu?.previewPdfUrl) {
      state.edu.previewPdfUrl = "";
      state.edu.previewPdfTitle = "";
      renderActiveView();
    } else if (state.edu?.previewVideoUrl) {
      state.edu.previewVideoUrl = "";
      state.edu.previewVideoTitle = "";
      renderActiveView();
    }
  });
}
