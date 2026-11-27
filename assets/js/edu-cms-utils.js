// ============================================================================
// GURU JI VISION — PHASE 3 EDUCATION CMS UTILITIES & VALIDATORS
// ============================================================================
// Shared pure utilities for:
// - Strict YouTube URL / Video ID / Playlist ID validation & safe embed URLs
// - Supported study document validation (PDF, DOC, DOCX, PPT, PPTX, TXT)
// - Agricultural Learning Resource taxonomy (7 official categories + legacy)
// - Official PYQ vs Practice vs AI-Generated provenance badges
// - Admin CMS search/filter & date formatting helpers
// - Practice Test / Mock Test question resolution
// ============================================================================

export const EDU_LANGUAGES = [
  { key: "EN", label: "English", bn: "ইংরেজি" },
  { key: "BN", label: "Bengali (বাংলা)", bn: "বাংলা" },
  { key: "HI", label: "Hindi (हिन्दी)", bn: "হিন্দি" },
  { key: "BILINGUAL", label: "Bilingual (EN + BN)", bn: "দ্বিভাষিক (EN + BN)" }
];

export const EDU_LANGUAGE_MAP = Object.fromEntries(EDU_LANGUAGES.map((l) => [l.key, l]));

export const LEARNING_RESOURCE_CATEGORIES = [
  { key: "ICAR_RESOURCE", en: "ICAR Resources", bn: "ICAR রিসোর্স", badge: "bg-emerald-100 text-emerald-950" },
  { key: "UNIVERSITY_MATERIAL", en: "University Materials", bn: "কৃষি বিশ্ববিদ্যালয় সামগ্রী", badge: "bg-teal-100 text-teal-950" },
  { key: "RESEARCH_PAPER", en: "Research Papers", bn: "গবেষণাপত্র", badge: "bg-indigo-100 text-indigo-950" },
  { key: "GOVT_PUBLICATION", en: "Govt Publications", bn: "সরকারি প্রকাশনা", badge: "bg-sky-100 text-sky-950" },
  { key: "YOUTUBE_PLAYLIST", en: "YouTube Playlists", bn: "শিক্ষামূলক YouTube প্লেলিস্ট", badge: "bg-rose-100 text-rose-950" },
  { key: "BOOK_REFERENCE", en: "Books & References", bn: "বই ও রেফারেন্স", badge: "bg-amber-100 text-amber-950" },
  { key: "OFFICIAL_NOTIFICATION", en: "Official Notifications", bn: "অফিশিয়াল বিজ্ঞপ্তি", badge: "bg-purple-100 text-purple-950" }
];

export const LEARNING_RESOURCE_CATEGORY_MAP = {
  ...Object.fromEntries(LEARNING_RESOURCE_CATEGORIES.map((c) => [c.key, c])),
  // Backward-compatible legacy discovery categories from Phase 7
  NOTES_PDF: { key: "NOTES_PDF", en: "Study Notes / PDF", bn: "নোটস / PDF", badge: "bg-emerald-100 text-emerald-950" },
  PYQ: { key: "PYQ", en: "Official PYQ", bn: "অফিশিয়াল PYQ", badge: "bg-amber-100 text-amber-950" },
  PRACTICAL: { key: "PRACTICAL", en: "Practical Manual", bn: "প্র্যাক্টিক্যাল", badge: "bg-sky-100 text-sky-950" },
  SYLLABUS: { key: "SYLLABUS", en: "Official Syllabus", bn: "অফিশিয়াল সিলেবাস", badge: "bg-teal-100 text-teal-950" },
  EXAM_NOTIFICATION: { key: "EXAM_NOTIFICATION", en: "Exam Notification", bn: "পরীক্ষার বিজ্ঞপ্তি", badge: "bg-purple-100 text-purple-950" }
};

export const PYQ_ORIGIN_META = {
  OFFICIAL_PYQ: {
    key: "OFFICIAL_PYQ",
    en: "Official Previous Year Paper",
    bn: "অফিশিয়াল বিগত বছরের প্রশ্নপত্র",
    badge: "bg-emerald-100 text-emerald-950 border-emerald-300"
  },
  PRACTICE_SET: {
    key: "PRACTICE_SET",
    en: "Practice Question Set (Not Official PYQ)",
    bn: "অনুশীলন প্রশ্নসেট (অফিশিয়াল নয়)",
    badge: "bg-amber-100 text-amber-950 border-amber-300"
  },
  AI_PRACTICE: {
    key: "AI_PRACTICE",
    en: "AI-Generated Practice (Not Official PYQ)",
    bn: "AI-তৈরি অনুশীলন (অফিশিয়াল নয়)",
    badge: "bg-fuchsia-100 text-fuchsia-950 border-fuchsia-300"
  }
};

export const ALLOWED_DOC_EXTENSIONS = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt"];

export const ALLOWED_DOC_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain"
]);

export const MAX_STUDY_DOC_BYTES = 25 * 1024 * 1024; // 25 MB

export function validateStudyDocumentFile(file) {
  if (!file) return { ok: false, error: "No file selected." };
  const name = String(file.name || "").trim();
  const lower = name.toLowerCase();
  const ext = ALLOWED_DOC_EXTENSIONS.find((e) => lower.endsWith(e)) || "";
  const mime = String(file.type || "").toLowerCase();
  if (!ext && !ALLOWED_DOC_MIME_TYPES.has(mime)) {
    return {
      ok: false,
      error: "Unsupported file format. Upload PDF, DOC, DOCX, PPT, PPTX, or TXT only."
    };
  }
  if (typeof file.size === "number" && file.size > MAX_STUDY_DOC_BYTES) {
    return {
      ok: false,
      error: "File exceeds the 25 MB upload limit. Compress the file or paste a hosted document link."
    };
  }
  const fileType = ext ? ext.slice(1).toUpperCase() : (mime === "application/pdf" ? "PDF" : "DOC");
  return { ok: true, fileName: name.slice(0, 180), fileType };
}

const YOUTUBE_ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com"
]);

/**
 * Strictly parses and validates YouTube video or playlist URLs.
 * Rejects non-YouTube domains and non-HTTPS/HTTP schemes to prevent unsafe iframes.
 */
export function extractYouTubeInfo(rawUrl = "") {
  const input = String(rawUrl || "").trim();
  if (!input) return { ok: false, error: "YouTube URL is required." };

  let parsed;
  try {
    parsed = new URL(input);
  } catch (_) {
    return { ok: false, error: "Please enter a valid YouTube URL starting with https://." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, error: "Only https:// YouTube URLs are permitted." };
  }

  const host = parsed.hostname.toLowerCase();
  if (!YOUTUBE_ALLOWED_HOSTS.has(host)) {
    return { ok: false, error: "Only official YouTube links (youtube.com or youtu.be) are supported." };
  }

  let videoId = "";
  const playlistIdRaw = parsed.searchParams.get("list") || "";
  const playlistId = /^[a-zA-Z0-9_-]{10,64}$/.test(playlistIdRaw) ? playlistIdRaw : "";

  if (host === "youtu.be" || host === "www.youtu.be") {
    videoId = parsed.pathname.replace(/^\/+/, "").split("/")[0] || "";
  } else {
    const pathParts = parsed.pathname.replace(/^\/+/, "").split("/");
    if (pathParts[0] === "watch") {
      videoId = parsed.searchParams.get("v") || "";
    } else if (["embed", "shorts", "live", "v"].includes(pathParts[0]) && pathParts[1]) {
      videoId = pathParts[1];
    }
  }

  if (videoId && !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    videoId = "";
  }

  if (videoId) {
    return {
      ok: true,
      isPlaylist: false,
      videoId,
      playlistId,
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    };
  }

  if (playlistId) {
    return {
      ok: true,
      isPlaylist: true,
      videoId: "",
      playlistId,
      canonicalUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlistId)}`,
      thumbnailUrl: ""
    };
  }

  return { ok: false, error: "Could not detect a valid YouTube video or playlist ID in this URL." };
}

export function formatCmsDate(tsMs, fallback = "") {
  if (typeof tsMs === "number" && Number.isFinite(tsMs) && tsMs > 0) {
    return new Date(tsMs).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }
  if (fallback) return String(fallback);
  return "—";
}

export function isRecordPublished(record) {
  if (!record) return false;
  if (typeof record.reviewStatus === "string") {
    return record.reviewStatus === "APPROVED_PUBLISHED";
  }
  return record.published !== false;
}

export function filterCmsRecords(records = [], filters = {}) {
  const q = String(filters.search || "").trim().toLowerCase();
  const subjectKey = filters.subjectKey || "ALL";
  const status = filters.status || "ALL"; // ALL | PUBLISHED | DRAFT | PENDING
  const category = filters.category || "ALL";

  return (Array.isArray(records) ? records : []).filter((item) => {
    if (!item) return false;
    if (subjectKey !== "ALL" && item.subjectKey && item.subjectKey !== subjectKey) return false;
    if (category !== "ALL" && item.category !== category && item.examCategory !== category && item.testType !== category) {
      return false;
    }
    if (status === "PUBLISHED" && !isRecordPublished(item)) return false;
    if (status === "DRAFT" && isRecordPublished(item)) return false;
    if (status === "PENDING" && item.reviewStatus !== "PENDING_REVIEW") return false;
    if (q) {
      const hay = [
        item.title, item.titleBn, item.subject, item.topic, item.summary,
        item.description, item.questionText, item.university, item.universityShort,
        item.course, item.academicSession, item.sourceName, item.sourceWebsite,
        item.examCategory, item.examYear, item.sourcePaper
      ].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Resolves the questions for an Admin-created Practice Test or Mock Test.
 * Uses explicit questionIds if assigned by Admin; otherwise filters published
 * MCQs by the test's examCategory, subjectKey, semester, and difficulty.
 */
export function resolveMockTestQuestions(test, allPublishedQuizzes = []) {
  const pool = Array.isArray(allPublishedQuizzes) ? allPublishedQuizzes : [];
  if (!test) return [];

  if (Array.isArray(test.questionIds) && test.questionIds.length > 0) {
    const byId = new Map(pool.map((q) => [q.id, q]));
    const picked = test.questionIds.map((id) => byId.get(id)).filter(Boolean);
    if (picked.length > 0) return picked;
  }

  return pool.filter((q) => {
    if (test.examCategory && test.examCategory !== "ALL" && q.examCategory !== test.examCategory) return false;
    if (test.subjectKey && test.subjectKey !== "ALL" && q.subjectKey !== test.subjectKey) return false;
    if (Number(test.semester) > 0 && Number(q.semester) !== Number(test.semester)) return false;
    if (test.difficulty && test.difficulty !== "ALL" && q.difficulty !== test.difficulty) return false;
    if (test.onlyOfficialPyq && q.questionType !== "OFFICIAL_PYQ") return false;
    return true;
  });
}
