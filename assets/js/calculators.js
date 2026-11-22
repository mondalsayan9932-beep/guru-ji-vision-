// ============================================================================
// Guru Ji Vision — Exact Agronomic Calculators, Knowledge Base Engine & Utils
// Migrated 1:1 from AgriReferenceData.kt, KnowledgeBaseEngine.kt,
// FreeWebSearchService.kt, ProfessorDirectorySeed.kt, DoubtRepository.kt
// ============================================================================

import { AREA_UNITS, CROP_PRESETS } from "./config.js";

// --- XSS-Safe Escaping & URL Sanitization ---
export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function safeUrl(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.href;
    }
  } catch (_) {}
  return "";
}

export function formatInr(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(num);
}

export function formatDateShort(ms) {
  if (!ms) return "";
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function formatTimeShort(ms) {
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function getTimestampMs(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val.toMillis === "function") return val.toMillis();
  if (typeof val.seconds === "number") return val.seconds * 1000;
  return 0;
}

export function buildWhatsAppDirectUrl(rawNumber, message = "") {
  const digits = String(rawNumber ?? "").replace(/[^\d]/g, "");
  const clean = digits.length === 10 ? `91${digits}` : digits;
  if (clean.length < 8) return "";
  const encoded = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${clean}${encoded}`;
}

export function isValidGoogleMeetUrl(rawUrl) {
  const trimmed = String(rawUrl ?? "").trim();
  return trimmed.length >= 15 && trimmed.length <= 300 && /^https:\/\/meet\.google\.com\/[a-zA-Z0-9_\-/?=&]+$/.test(trimmed);
}

export function buildDoubtChatId(professorId, studentId) {
  return `${String(professorId).trim()}__${String(studentId).trim()}`;
}

export function parseMeetingEpochMs(dateStr, timeStr) {
  const d = String(dateStr || "").trim();
  const t = String(timeStr || "").trim();
  if (!d) return Date.now();
  // Support YYYY-MM-DD + HH:mm or hh:mm AM/PM
  const ampm = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  let isoTime = "10:00";
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = ampm[2];
    const mer = ampm[3].toUpperCase();
    if (mer === "PM" && h < 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    isoTime = `${String(h).padStart(2, "0")}:${m}`;
  } else if (/^\d{1,2}:\d{2}$/.test(t)) {
    const [h, m] = t.split(":");
    isoTime = `${String(parseInt(h, 10)).padStart(2, "0")}:${m}`;
  }
  const parsed = Date.parse(`${d}T${isoTime}:00`);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

export function isUpcomingMeeting(meeting, nowMs = Date.now()) {
  const liveGraceMs = 60 * 60 * 1000; // 60-minute live grace window from ProfessorDirectorySeed.kt
  return (Number(meeting.scheduledAtEpochMs) || 0) + liveGraceMs >= nowMs;
}

// --- Exact ICAR Agronomic Calculators (from AgriReferenceData.kt) ---
export function calculateFertilizer({ areaValue, unitKey, nPerHa, pPerHa, kPerHa }) {
  const unit = AREA_UNITS[unitKey] || AREA_UNITS.HECTARE;
  const areaHa = Math.max(0, (Number(areaValue) || 0) * unit.hectaresPerUnit);
  const targetN = Math.max(0, (Number(nPerHa) || 0) * areaHa);
  const targetP = Math.max(0, (Number(pPerHa) || 0) * areaHa);
  const targetK = Math.max(0, (Number(kPerHa) || 0) * areaHa);

  // Route 1: DAP (18% N, 46% P2O5) + Urea (46% N) + MOP (60% K2O)
  const dapKg = targetP > 0 ? targetP / 0.46 : 0;
  const nFromDap = dapKg * 0.18;
  const remainingN = Math.max(0, targetN - nFromDap);
  const ureaKg = remainingN / 0.46;
  const mopKg = targetK > 0 ? targetK / 0.60 : 0;

  // Route 2: SSP (16% P2O5) + Urea (46% N) + MOP (60% K2O)
  const sspAlternativeKg = targetP > 0 ? targetP / 0.16 : 0;
  const ureaWithSspKg = targetN / 0.46;

  return {
    areaHa,
    targetN,
    targetP,
    targetK,
    dapKg,
    ureaKg,
    mopKg,
    sspAlternativeKg,
    ureaWithSspKg
  };
}

export function calculateSeedRate({ areaValue, unitKey, rowSpacingCm, plantSpacingCm, testWeightGramsPer1000, germinationPercent, purityPercent }) {
  const unit = AREA_UNITS[unitKey] || AREA_UNITS.HECTARE;
  const areaSqM = Math.max(0, (Number(areaValue) || 0) * unit.hectaresPerUnit * 10000);
  const rowM = Math.max(0.01, (Number(rowSpacingCm) || 1) / 100);
  const plantM = Math.max(0.01, (Number(plantSpacingCm) || 1) / 100);
  const totalPlants = Math.round(areaSqM / (rowM * plantM));

  const germFrac = Math.min(100, Math.max(1, Number(germinationPercent) || 85)) / 100;
  const purityFrac = Math.min(100, Math.max(1, Number(purityPercent) || 98)) / 100;
  const effectiveSeedsNeeded = totalPlants / (germFrac * purityFrac);
  const seedWeightGrams = (effectiveSeedsNeeded / 1000) * Math.max(0.1, Number(testWeightGramsPer1000) || 1);

  return {
    areaSqM,
    totalPlants,
    seedRateKg: seedWeightGrams / 1000
  };
}

// --- Client-Side Image Compression for Doubt Chat (<= 320,000 Base64 chars matching firestore.rules <= 350,000) ---
export function compressImageFileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please choose a valid image file."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image format."));
      img.onload = () => {
        const maxDim = 720;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height, 1));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        let quality = 0.72;
        let base64 = "";
        while (quality >= 0.25) {
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          base64 = dataUrl.split(",")[1] || "";
          if (base64.length <= 320000) break;
          quality -= 0.14;
        }
        if (base64.length > 340000) {
          reject(new Error("Image is too large even after compression. Choose a smaller photo."));
        } else {
          resolve(base64);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// --- Knowledge Base Engine (migrated from KnowledgeBaseEngine.kt) ---
const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "what", "when", "where", "which",
  "from", "into", "about", "explain", "write", "give", "tell", "how", "why",
  "are", "was", "were", "can", "could", "should", "would", "please", "notes",
  "note", "answer", "exam", "short", "long", "summary", "simple", "in", "of", "to", "on", "is"
]);

const SUBJECT_ALIASES = {
  agronomy: ["tillage", "tilth", "crop", "sowing", "irrigation", "cri", "wheat", "paddy", "rice", "weed", "cropping", "yield"],
  "soil science": ["soil", "ph", "cec", "cation", "clay", "humus", "gypsum", "lime", "saline", "sodic", "alkali", "organic", "nitrogen", "phosphorus", "potassium", "npk", "urea", "dap", "mop"],
  botany: ["botany", "plant", "tissue", "culture", "photosynthesis", "xylem", "phloem", "cell", "mitosis", "meiosis", "flower", "seed", "germination"],
  genetics: ["genetics", "mendel", "gene", "allele", "chromosome", "dna", "rna", "hybrid", "breeding", "heterosis", "mutation", "linkage", "epistasis"],
  "plant pathology": ["pathology", "disease", "fungus", "fungal", "blight", "blast", "rust", "smut", "wilt", "mosaic", "virus", "bacteria", "pathogen", "tricyclazole"],
  entomology: ["entomology", "insect", "pest", "ipm", "borer", "aphid", "hopper", "bph", "caterpillar", "larva", "pheromone", "neem", "pesticide", "etl", "eil"],
  extension: ["extension", "rural", "kvk", "farmer", "adoption", "diffusion", "pra", "communication", "training"]
};

export function tokenizeQuestion(text) {
  return new Set(
    String(text || "")
      .toLowerCase()
      .split(/[^a-z0-9\u0980-\u09FF]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2 && !STOP_WORDS.has(s))
  );
}

export function searchKnowledgeBase(question, studyMaterials = []) {
  const qLower = String(question || "").toLowerCase();
  const qTokens = tokenizeQuestion(question);
  if (!qTokens.size) return { materialMatches: [], cropMatches: [] };

  const inferredSubjects = Object.entries(SUBJECT_ALIASES)
    .filter(([, keywords]) => keywords.some((kw) => qTokens.has(kw) || qLower.includes(kw)))
    .map(([subj]) => subj);

  const materialMatches = (studyMaterials || [])
    .filter((m) => m.published !== false)
    .map((mat) => {
      const titleL = String(mat.title || "").toLowerCase();
      const subjL = String(mat.subject || "").toLowerCase();
      const sumL = String(mat.summary || "").toLowerCase();
      const bodyL = String(mat.contentText || "").toLowerCase();

      let score = 0;
      for (const tok of qTokens) {
        if (titleL.includes(tok)) score += 6;
        if (subjL.includes(tok)) score += 5;
        if (sumL.includes(tok)) score += 3;
        if (bodyL.includes(tok)) score += 4;
      }
      if (inferredSubjects.some((s) => subjL.includes(s) || titleL.includes(s))) score += 5;
      if (score > 0 && mat.verifiedForAi) score += 4;
      if (score > 0 && bodyL.trim()) score += 2;
      return { material: mat, score };
    })
    .filter((x) => x.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const cropMatches = CROP_PRESETS.filter((crop) => {
    const hay = `${crop.nameEn} ${crop.nameBn} ${crop.majorDiseases.join(" ")} ${crop.majorPests.join(" ")} ${crop.ipmGuidance}`.toLowerCase();
    return Array.from(qTokens).some((tok) => hay.includes(tok));
  }).slice(0, 3);

  return { materialMatches, cropMatches };
}

// --- Free Wikipedia Open Search (CORS-enabled with origin=* from FreeWebSearchService.kt) ---
export async function searchFreeWikipedia(query, lang = "en", maxResults = 3) {
  const clean = String(query || "").replace(/[\r\n]+/g, " ").trim().slice(0, 120);
  if (clean.length < 3) return [];
  const wikiLang = lang === "bn" ? "bn" : "en";

  async function runQuery(l) {
    try {
      const url = `https://${l}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(clean)}&srlimit=${maxResults}&utf8=1&format=json&origin=*`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      const items = json?.query?.search || [];
      return items.map((item) => {
        const title = String(item.title || "").trim();
        const snippet = String(item.snippet || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
        return {
          title: `${title} (Wikipedia)`,
          url: `https://${l}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
          snippet,
          kind: "WEB_WIKIPEDIA"
        };
      });
    } catch (_) {
      return [];
    }
  }

  const hits = await runQuery(wikiLang);
  if (hits.length > 0 || wikiLang === "en") return hits;
  return runQuery("en");
}
