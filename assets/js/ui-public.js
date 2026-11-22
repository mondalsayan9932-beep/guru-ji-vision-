// ============================================================================
// Guru Ji Vision — Public & Educational Module Renderers
// Home, Student Hub (Notes/Syllabus/MCQ), Farmer Help, Agri Tools,
// AI Guru Knowledge Base, and Career & Student Community
// ============================================================================

import {
  AREA_UNITS,
  CAREER_CATEGORIES,
  COMMUNITY_TOPICS,
  CROP_PRESETS,
  ICAR_SYLLABUS,
  STUDY_CATEGORIES
} from "./config.js";
import {
  buildWhatsAppDirectUrl,
  calculateFertilizer,
  calculateSeedRate,
  escapeHtml,
  formatDateShort,
  isUpcomingMeeting,
  safeUrl
} from "./calculators.js";

// ----------------------------------------------------------------------------
// 1. HOME DASHBOARD
// ----------------------------------------------------------------------------
export function renderHomeView(state) {
  const settings = state.appSettings;
  const publicMaterials = state.studyMaterials.filter((m) => m.published !== false);
  const activeNotices = state.announcements.filter((a) => a.active !== false);
  const upcomingMeetings = state.meetings.filter((m) => m.published !== false && isUpcomingMeeting(m));
  const waDirect = buildWhatsAppDirectUrl(settings.whatsappNumber, "Namaskar Guru Ji Vision Team, I need help regarding agriculture / B.Sc Agriculture.");
  const waGroup = safeUrl(settings.whatsappGroupInviteUrl);
  const unreadDoubts = state.totalUnreadDoubts || 0;

  const moduleCards = [
    { tab: "student", title: "Student Portal", sub: `${publicMaterials.length} Notes, Syllabus, PYQs & MCQs`, icon: "🎓", bg: "bg-emerald-50 border-emerald-200" },
    { tab: "farmer", title: "Farmer Help Desk", sub: "Crop Diseases, IPM & WhatsApp Support", icon: "🌾", bg: "bg-amber-50 border-amber-200" },
    { tab: "tools", title: "Agri Calculators", sub: "NPK Fertilizer (DAP/SSP) & Seed Rate", icon: "🧮", bg: "bg-teal-50 border-teal-200" },
    { tab: "ai", title: "AI Guru Knowledge Base", sub: "Verified Notes + Free Encyclopedia Search", icon: "✨", bg: "bg-lime-50 border-lime-200" },
    { tab: "community", title: "Community & Careers", sub: `${state.careerOpportunities.length} Jobs & Student Forum`, icon: "🤝", bg: "bg-sky-50 border-sky-200" },
    { tab: "money", title: "Private Money Manager", sub: "100% Private Student Ledger (₹ INR)", icon: "🔒", bg: "bg-emerald-50 border-emerald-200" },
    { tab: "meeting", title: "Meeting Zone", sub: `${upcomingMeetings.length} Upcoming Google Meet Live Classes`, icon: "📹", bg: "bg-indigo-50 border-indigo-200" },
    { tab: "doubt", title: "Doubt Zone (9 Advisors)", sub: unreadDoubts > 0 ? `${unreadDoubts} unread professor replies` : "Private 1-on-1 Chat with Faculty", icon: "💬", bg: "bg-orange-50 border-orange-200" }
  ];

  return `
    <div class="space-y-5 animate-fade-up">
      ${settings.maintenanceBanner ? `
        <div class="rounded-2xl bg-amber-100 border border-amber-300 px-4 py-3 text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2.5">
          <span>⚠️</span>
          <span>${escapeHtml(settings.maintenanceBanner)}</span>
        </div>
      ` : ""}

      <!-- Hero Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C3B20] via-[#14532D] to-[#1E7E45] text-white p-5 sm:p-7 shadow-lg">
        <div class="absolute -right-12 -top-12 w-52 h-52 rounded-full bg-amber-300/15 blur-2xl pointer-events-none"></div>
        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div class="space-y-2.5 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold text-emerald-100">
              <span class="w-2 h-2 rounded-full ${state.cloudConnected ? "bg-emerald-300" : "bg-amber-300"}"></span>
              <span>${state.cloudConnected ? "Live Firebase Cloud Connected" : "Instant Public Access • Offline-Ready"}</span>
            </div>
            <h2 class="font-display text-2xl sm:text-3xl font-bold leading-tight">${escapeHtml(settings.heroHeadline)}</h2>
            <p class="text-sm sm:text-base text-emerald-100/95 leading-relaxed">${escapeHtml(settings.aboutText)}</p>
            <div class="flex flex-wrap gap-2.5 pt-1">
              <button data-nav="student" class="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0C3B20] text-xs sm:text-sm font-extrabold shadow-sm transition-colors">
                Browse Notes &amp; PDFs →
              </button>
              ${!state.user ? `
                <button data-action="open-auth" class="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs sm:text-sm font-bold transition-colors">
                  Continue with WhatsApp / Sign In
                </button>
              ` : `
                <button data-action="open-profile" class="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs sm:text-sm font-bold transition-colors">
                  Hi, ${escapeHtml(state.userProfile?.displayName || state.user.displayName || state.user.phoneNumber || "Scholar")} • Profile
                </button>
              `}
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2.5 shrink-0">
            <div class="rounded-2xl bg-white/10 border border-white/15 px-3 py-3 text-center">
              <div class="text-xl sm:text-2xl font-extrabold">${publicMaterials.length}</div>
              <div class="text-[11px] text-emerald-100">Materials</div>
            </div>
            <div class="rounded-2xl bg-white/10 border border-white/15 px-3 py-3 text-center">
              <div class="text-xl sm:text-2xl font-extrabold text-amber-300">${state.professors.length}</div>
              <div class="text-[11px] text-emerald-100">Advisors</div>
            </div>
            <div class="rounded-2xl bg-white/10 border border-white/15 px-3 py-3 text-center">
              <div class="text-xl sm:text-2xl font-extrabold text-emerald-200">${activeNotices.length}</div>
              <div class="text-[11px] text-emerald-100">Notices</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Notices Banner -->
      ${activeNotices.length > 0 ? `
        <div class="gv-card p-4 sm:p-5 space-y-2.5">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-extrabold uppercase tracking-wider text-[#14532D] flex items-center gap-2">
              <span>📢</span> Latest Notices &amp; Updates
            </h3>
            <span class="text-xs font-semibold text-[#496052]">${activeNotices.length} active</span>
          </div>
          <div class="space-y-2">
            ${activeNotices.slice(0, 3).map((n) => `
              <div class="rounded-2xl bg-[#FFFBEB] border border-amber-200/80 p-3.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="font-bold text-sm text-amber-950">${escapeHtml(n.title)}</span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-200/80 text-amber-950">${escapeHtml(n.audience || "ALL")}</span>
                </div>
                <p class="text-xs sm:text-sm text-amber-900/90 mt-1 leading-relaxed">${escapeHtml(n.message)}</p>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <!-- Complete Ecosystem Quick Launch Grid -->
      <div>
        <h3 class="text-base font-extrabold text-[#14532D] mb-3 px-1">Explore Guru Ji Vision Modules</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          ${moduleCards.map((c) => `
            <button data-nav="${c.tab}" type="button" class="text-left p-4 rounded-2xl border ${c.bg} hover:shadow-md transition-all flex items-start gap-3.5">
              <span class="text-2xl shrink-0 leading-none mt-0.5">${c.icon}</span>
              <div class="min-w-0">
                <div class="text-sm font-extrabold text-[#132219]">${escapeHtml(c.title)}</div>
                <div class="text-xs text-[#496052] mt-0.5 leading-snug">${escapeHtml(c.sub)}</div>
              </div>
            </button>
          `).join("")}
        </div>
      </div>

      <!-- Direct WhatsApp Support & Official Group Bar -->
      <div class="gv-card-tinted p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-extrabold text-[#14532D]">Need Agriculture Guidance or Student Help?</h3>
          <p class="text-xs sm:text-sm text-[#496052] mt-0.5">Connect directly with Guru Ji Vision on WhatsApp or join our official B.Sc Agriculture community group.</p>
        </div>
        <div class="flex flex-wrap gap-2.5 shrink-0">
          ${waDirect ? `
            <a href="${escapeHtml(waDirect)}" target="_blank" rel="noopener noreferrer" class="gv-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-colors">
              <span>WhatsApp Help</span>
            </a>
          ` : ""}
          ${waGroup ? `
            <a href="${escapeHtml(waGroup)}" target="_blank" rel="noopener noreferrer" class="gv-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-colors">
              <span>Join Official Group</span>
            </a>
          ` : ""}
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 2. STUDENT SECTION (Materials, Syllabus, PYQ, Practicals, Online MCQ Quiz)
// ----------------------------------------------------------------------------
export function renderStudentView(state) {
  const sub = state.studentSubTab || "materials";
  const publicMaterials = state.studyMaterials.filter((m) => m.published !== false);
  const q = (state.studentSearch || "").trim().toLowerCase();

  const filteredMaterials = publicMaterials.filter((m) => {
    if (state.studentSemester > 0 && Number(m.semester) !== state.studentSemester) return false;
    if (state.studentCategory !== "ALL" && m.category !== state.studentCategory) return false;
    if (q) {
      const hay = `${m.title} ${m.subject} ${m.summary} ${m.contentText || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const activeQuizzes = state.quizzes.filter((qz) =>
    qz.published !== false && (state.studentSemester === 0 || Number(qz.semester) === state.studentSemester)
  );

  return `
    <div class="space-y-4 animate-fade-up">
      <!-- Header + Sub-tabs -->
      <div class="gv-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="font-display text-xl sm:text-2xl font-bold text-[#14532D]">Student Academic Portal</h2>
          <p class="text-xs sm:text-sm text-[#496052]">ICAR B.Sc (Hons.) Agriculture • Semesters 1–8 Notes, PDFs, Syllabus, Practicals &amp; MCQs</p>
        </div>
        <div class="flex flex-wrap gap-1.5 bg-[#EDF4EE] p-1 rounded-xl">
          ${[
            ["materials", "Notes & PDFs"],
            ["syllabus", "ICAR Syllabus"],
            ["quiz", "MCQ Quiz"]
          ].map(([key, label]) => `
            <button data-student-sub="${key}" class="px-3.5 py-2 rounded-lg text-xs font-extrabold transition-colors ${
              sub === key ? "bg-[#14532D] text-white shadow-sm" : "text-[#14532D] hover:bg-white/70"
            }">${label}</button>
          `).join("")}
        </div>
      </div>

      <!-- Semester Filter Bar (Shared across Materials, Syllabus & Quiz) -->
      <div class="gv-card p-3.5 space-y-3">
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((sem) => `
            <button data-student-sem="${sem}" class="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              state.studentSemester === sem ? "bg-[#14532D] text-white" : "bg-[#EDF4EE] text-[#14532D] hover:bg-[#D8F3DC]"
            }">${sem === 0 ? "All Semesters" : `Sem ${sem}`}</button>
          `).join("")}
        </div>

        ${sub === "materials" ? `
          <div class="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-emerald-100">
            <input id="studentSearchInput" type="search" value="${escapeHtml(state.studentSearch || "")}" placeholder="Search subject, chapter, Agronomy, Soil Science, PYQ..." class="flex-1 px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E7E45]" />
            <div class="flex flex-wrap gap-1.5">
              ${Object.entries(STUDY_CATEGORIES).map(([key, meta]) => `
                <button data-student-cat="${key}" class="px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  state.studentCategory === key ? "bg-amber-400 text-[#0C3B20]" : "bg-slate-100 text-slate-700 hover:bg-emerald-50"
                }">${escapeHtml(meta.en)}</button>
              `).join("")}
            </div>
          </div>
        ` : ""}
      </div>

      ${sub === "materials" ? `
        ${!state.cloudConnected ? `
          <div class="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
            <span>Showing open-access reference study notes. Sign in to sync live cloud uploads from Guru Ji Vision Firestore.</span>
            <button data-action="open-auth" class="px-3 py-1.5 rounded-lg bg-[#14532D] text-white font-bold">Sign In</button>
          </div>
        ` : ""}

        ${filteredMaterials.length === 0 ? `
          <div class="gv-card p-8 text-center space-y-2">
            <p class="text-base font-bold text-[#14532D]">No matching study materials found</p>
            <p class="text-xs text-[#496052]">Try clearing your search or selecting "All Semesters".</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${filteredMaterials.map((mat) => {
              const cat = STUDY_CATEGORIES[mat.category] || STUDY_CATEGORIES.NOTES_PDF;
              const pdfUrl = safeUrl(mat.resourceUrl);
              return `
                <article class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-3.5 hover:shadow-md transition-shadow">
                  <div class="space-y-2">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${cat.badge}">${escapeHtml(cat.en)}</span>
                      <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#EDF4EE] text-[#14532D]">Sem ${escapeHtml(mat.semester)}</span>
                      ${mat.verifiedForAi ? `<span class="ml-auto text-[10px] font-bold text-emerald-700">✓ Verified</span>` : ""}
                    </div>
                    <h3 class="text-base font-extrabold text-[#132219] leading-snug">${escapeHtml(mat.title)}</h3>
                    <p class="text-xs font-bold text-[#1E7E45]">${escapeHtml(mat.subject)}</p>
                    <p class="text-xs sm:text-sm text-[#496052] leading-relaxed line-clamp-3">${escapeHtml(mat.summary)}</p>
                  </div>
                  <div class="flex gap-2 pt-2 border-t border-emerald-50">
                    <button data-read-material="${escapeHtml(mat.id)}" class="flex-1 py-2.5 px-3 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-extrabold transition-colors">
                      Read Notes
                    </button>
                    ${pdfUrl ? `
                      <a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener noreferrer" class="gv-btn flex-1 inline-flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold transition-colors">
                        Open PDF ↗
                      </a>
                    ` : ""}
                  </div>
                </article>
              `;
            }).join("")}
          </div>
        `}
      ` : ""}

      ${sub === "syllabus" ? `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${Object.entries(ICAR_SYLLABUS)
            .filter(([sem]) => state.studentSemester === 0 || Number(sem) === state.studentSemester)
            .map(([sem, courses]) => `
              <div class="gv-card p-5 space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-base font-extrabold text-[#14532D]">Semester ${sem} — ICAR 5th Deans' Syllabus</h3>
                  <button data-student-jump-sem="${sem}" class="text-xs font-bold text-[#1E7E45] hover:underline">View Notes →</button>
                </div>
                <ul class="space-y-1.5 text-sm text-[#132219]">
                  ${courses.map((c, idx) => `
                    <li class="flex items-start gap-2">
                      <span class="w-5 h-5 rounded-md bg-[#EDF4EE] text-[#14532D] text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">${idx + 1}</span>
                      <span>${escapeHtml(c)}</span>
                    </li>
                  `).join("")}
                </ul>
              </div>
            `).join("")}
        </div>
      ` : ""}

      ${sub === "quiz" ? renderQuizSection(state, activeQuizzes) : ""}
    </div>
  `;
}

function renderQuizSection(state, quizzes) {
  const answers = state.quizAnswers || {};
  const submitted = state.quizSubmitted;
  let score = 0;
  if (submitted) {
    quizzes.forEach((q) => {
      if (Number(answers[q.id]) === Number(q.correctIndex)) score++;
    });
  }

  return `
    <div class="space-y-4">
      <div class="gv-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-base font-extrabold text-[#14532D]">B.Sc Agriculture Online MCQ Practice (${quizzes.length} Questions)</h3>
          <p class="text-xs text-[#496052]">Select your answers and submit to check score, explanations, and save to your student history.</p>
        </div>
        ${submitted ? `
          <div class="flex items-center gap-2">
            <span class="px-3.5 py-2 rounded-xl bg-emerald-100 text-[#14532D] text-sm font-extrabold">
              Score: ${score} / ${quizzes.length} (${quizzes.length ? Math.round((score * 100) / quizzes.length) : 0}%)
            </span>
            <button data-action="reset-quiz" class="px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs font-bold text-[#14532D]">Retake</button>
          </div>
        ` : ""}
      </div>

      ${quizzes.length === 0 ? `
        <div class="gv-card p-6 text-center text-sm text-[#496052]">No MCQ questions for this semester yet. Select "All Semesters".</div>
      ` : `
        <div class="space-y-3.5">
          ${quizzes.map((q, idx) => {
            const chosen = answers[q.id];
            return `
              <div class="gv-card p-4 sm:p-5 space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="px-2 py-0.5 rounded-md bg-[#EDF4EE] text-[#14532D] text-[11px] font-bold">Q${idx + 1} • Sem ${escapeHtml(q.semester)}</span>
                  <span class="text-xs font-bold text-[#1E7E45]">${escapeHtml(q.subject)}</span>
                </div>
                <p class="text-sm sm:text-base font-bold text-[#132219]">${escapeHtml(q.questionText)}</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  ${(q.options || []).map((opt, oIdx) => {
                    const isSelected = Number(chosen) === oIdx;
                    const isCorrect = Number(q.correctIndex) === oIdx;
                    let cls = "border-[#CDE0D3] bg-white hover:bg-[#F1F7F2] text-[#132219]";
                    if (submitted) {
                      if (isCorrect) cls = "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold";
                      else if (isSelected && !isCorrect) cls = "border-rose-400 bg-rose-50 text-rose-900";
                    } else if (isSelected) {
                      cls = "border-[#14532D] bg-[#D8F3DC] text-[#0A2E18] font-bold";
                    }
                    return `
                      <button type="button" data-quiz-q="${escapeHtml(q.id)}" data-quiz-opt="${oIdx}" ${submitted ? "disabled" : ""} class="text-left px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm transition-colors ${cls}">
                        <span class="font-extrabold mr-1.5">${["A", "B", "C", "D"][oIdx]}.</span> ${escapeHtml(opt)}
                      </button>
                    `;
                  }).join("")}
                </div>
                ${submitted && q.explanation ? `
                  <div class="rounded-xl bg-[#EDF4EE] px-3.5 py-2.5 text-xs text-[#0A2E18]">
                    <strong>Explanation:</strong> ${escapeHtml(q.explanation)}
                  </div>
                ` : ""}
              </div>
            `;
          }).join("")}
        </div>
        ${!submitted ? `
          <button data-action="submit-quiz" class="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold shadow-sm">
            Submit Exam &amp; View Score
          </button>
        ` : ""}
      `}

      ${state.quizAttempts.length > 0 ? `
        <div class="gv-card p-4 sm:p-5 space-y-2.5">
          <h4 class="text-sm font-extrabold text-[#14532D]">Your Past Exam Attempts</h4>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            ${state.quizAttempts.slice(0, 6).map((a) => `
              <div class="rounded-xl bg-[#F1F7F2] border border-[#CDE0D3] p-3 text-xs">
                <div class="font-extrabold text-[#14532D]">Sem ${a.semester} — ${a.score}/${a.totalQuestions} (${Math.round((a.score * 100) / Math.max(1, a.totalQuestions))}%)</div>
                <div class="text-[#496052] mt-0.5">${formatDateShort(a.createdAtMs)}</div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 3. FARMER HELP SECTION & CROP KNOWLEDGE BASE
// ----------------------------------------------------------------------------
export function renderFarmerView(state) {
  const settings = state.appSettings;
  const waDirect = buildWhatsAppDirectUrl(settings.whatsappNumber, "Namaskar Guru Ji Vision, I am a farmer seeking crop guidance.");
  const waGroup = safeUrl(settings.whatsappGroupInviteUrl);

  return `
    <div class="space-y-5 animate-fade-up">
      <!-- Top Farmer Support Banner with Configurable WhatsApp -->
      <div class="rounded-3xl bg-gradient-to-br from-[#14532D] to-[#1E7E45] text-white p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <h2 class="font-display text-2xl font-bold">Farmer Help Desk &amp; Crop Advisory</h2>
          <p class="text-xs sm:text-sm text-emerald-100 max-w-2xl">
            Get ICAR crop disease guides, IPM schedules, direct WhatsApp expert contact, or submit your private field query for review.
          </p>
        </div>
        <div class="flex flex-wrap gap-2.5 shrink-0">
          ${waDirect ? `
            <a href="${escapeHtml(waDirect)}" target="_blank" rel="noopener noreferrer" class="gv-btn inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#25D366] hover:bg-[#1FB857] text-[#052E16] text-xs sm:text-sm font-extrabold shadow-sm">
              <span>💬 Direct WhatsApp (${escapeHtml(settings.whatsappNumber)})</span>
            </a>
          ` : ""}
          ${waGroup ? `
            <a href="${escapeHtml(waGroup)}" target="_blank" rel="noopener noreferrer" class="gv-btn inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#0C3B20] text-xs sm:text-sm font-extrabold shadow-sm">
              <span>Official WhatsApp Group</span>
            </a>
          ` : ""}
        </div>
      </div>

      <!-- Crop Production, Disease & IPM Knowledge Base (All 6 Original Crops) -->
      <div class="space-y-3">
        <h3 class="text-base font-extrabold text-[#14532D] px-1">Crop Production, Disease &amp; Pest Management Guide</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${CROP_PRESETS.map((crop) => `
            <article class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div class="space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h4 class="text-base font-extrabold text-[#14532D]">${escapeHtml(crop.nameEn)}</h4>
                    <p class="text-xs font-semibold text-[#1E7E45]">${escapeHtml(crop.nameBn)}</p>
                  </div>
                  <span class="px-2 py-1 rounded-lg bg-amber-100 text-amber-900 text-[10px] font-bold shrink-0">NPK ${crop.npkPerHa.n}:${crop.npkPerHa.p}:${crop.npkPerHa.k}</span>
                </div>
                <div class="text-xs text-[#496052] space-y-1">
                  <p><strong>Season:</strong> ${escapeHtml(crop.season)}</p>
                  <p><strong>Soil pH:</strong> ${escapeHtml(crop.soilPh)}</p>
                  <p><strong>Seed Rate:</strong> ${escapeHtml(crop.seedRateKgPerHa)}</p>
                  <p><strong>Diseases:</strong> ${escapeHtml(crop.majorDiseases.join(", "))}</p>
                  <p><strong>Pests:</strong> ${escapeHtml(crop.majorPests.join(", "))}</p>
                </div>
                <div class="rounded-xl bg-[#F1F7F2] border border-[#CDE0D3] p-2.5 text-xs text-[#132219] leading-relaxed">
                  <strong>IPM Guidance:</strong> ${escapeHtml(crop.ipmGuidance)}
                </div>
              </div>
              <button data-load-crop-tool="${escapeHtml(crop.id)}" class="w-full py-2.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-extrabold transition-colors">
                Open in Fertilizer &amp; Seed Calculator →
              </button>
            </article>
          `).join("")}
        </div>
      </div>

      <!-- Submit Private Farmer Crop Query -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div class="lg:col-span-5 gv-card p-5 space-y-3.5">
          <h3 class="text-base font-extrabold text-[#14532D]">Submit Crop Issue Query</h3>
          ${!state.user ? `
            <p class="text-xs sm:text-sm text-[#496052]">Sign in with WhatsApp/Phone or Email to submit private crop queries and receive replies from Guru Ji Vision experts.</p>
            <button data-action="open-auth" class="w-full py-3 rounded-xl bg-[#14532D] text-white text-sm font-extrabold">Sign In to Submit Query</button>
          ` : `
            <form id="farmerQueryForm" class="space-y-3">
              <label class="block">
                <span class="text-xs font-bold text-[#132219]">Crop Name *</span>
                <input id="fqCrop" type="text" required maxlength="80" placeholder="e.g. Paddy (Swarna), Potato" class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
              </label>
              <div class="grid grid-cols-2 gap-2.5">
                <label class="block">
                  <span class="text-xs font-bold text-[#132219]">Issue Category</span>
                  <select id="fqCategory" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm">
                    <option value="DISEASE">Disease</option>
                    <option value="PEST">Insect / Pest</option>
                    <option value="FERTILIZER">Fertilizer</option>
                    <option value="SOIL">Soil Health</option>
                    <option value="WEATHER">Weather</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label class="block">
                  <span class="text-xs font-bold text-[#132219]">District</span>
                  <input id="fqDistrict" type="text" maxlength="80" value="${escapeHtml(state.userProfile?.district || "")}" placeholder="e.g. Purba Bardhaman" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
                </label>
              </div>
              <label class="block">
                <span class="text-xs font-bold text-[#132219]">Describe Crop Symptoms *</span>
                <textarea id="fqDesc" rows="3" required minlength="5" maxlength="1000" placeholder="Describe leaf spots, yellowing, insect damage, crop age..." class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm"></textarea>
              </label>
              <button type="submit" class="w-full py-3 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">Submit Farmer Query</button>
            </form>
          `}
        </div>

        <div class="lg:col-span-7 gv-card p-5 space-y-3">
          <h3 class="text-base font-extrabold text-[#14532D]">Your Submitted Queries (${state.farmerQueries.length})</h3>
          ${state.farmerQueries.length === 0 ? `
            <p class="text-sm text-[#496052]">No submitted queries yet.</p>
          ` : `
            <div class="space-y-3 max-h-[420px] overflow-y-auto">
              ${state.farmerQueries.map((fq) => `
                <div class="rounded-2xl border border-[#CDE0D3] bg-[#F7F9F5] p-3.5 space-y-1.5">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="font-extrabold text-sm text-[#14532D]">${escapeHtml(fq.cropName)} (${escapeHtml(fq.category)})</span>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      fq.status === "RESOLVED" ? "bg-emerald-100 text-emerald-900" : fq.status === "IN_REVIEW" ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-800"
                    }">${escapeHtml(fq.status)}</span>
                  </div>
                  <p class="text-xs text-[#132219]">${escapeHtml(fq.description)}</p>
                  ${fq.adminReply ? `
                    <div class="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-950">
                      <strong>Expert Reply:</strong> ${escapeHtml(fq.adminReply)}
                    </div>
                  ` : ""}
                </div>
              `).join("")}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 4. AGRICULTURE TOOLS (Real ICAR NPK + SSP + Seed Rate + Plant Population)
// ----------------------------------------------------------------------------
export function renderToolsView(state) {
  const f = state.fertInput;
  const fRes = calculateFertilizer(f);
  const s = state.seedInput;
  const sRes = calculateSeedRate(s);

  return `
    <div class="space-y-5 animate-fade-up">
      <div class="gv-card p-4 sm:p-5 space-y-3">
        <div>
          <h2 class="font-display text-xl sm:text-2xl font-bold text-[#14532D]">ICAR Agriculture Calculators</h2>
          <p class="text-xs sm:text-sm text-[#496052]">Real agronomic calculations for Hectare, Acre, and West Bengal Bigha. Tap a crop preset to auto-fill standard doses:</p>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${CROP_PRESETS.map((c) => `
            <button data-apply-crop-preset="${escapeHtml(c.id)}" class="px-3 py-1.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-bold transition-colors">
              🌱 ${escapeHtml(c.nameEn.split(" (")[0])}
            </button>
          `).join("")}
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- NPK Fertilizer Calculator (Route 1: DAP + Urea + MOP, Route 2: SSP + Urea + MOP) -->
        <div class="gv-card p-5 space-y-4">
          <h3 class="text-base font-extrabold text-[#14532D]">1. NPK Fertilizer Calculator (ICAR Standard)</h3>
          <div class="grid grid-cols-2 gap-2.5">
            <label class="block">
              <span class="text-xs font-bold text-[#132219]">Field Area</span>
              <input id="toolFertArea" type="number" min="0.05" step="0.1" value="${f.areaValue}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" />
            </label>
            <label class="block">
              <span class="text-xs font-bold text-[#132219]">Area Unit</span>
              <select id="toolFertUnit" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm font-semibold">
                ${Object.values(AREA_UNITS).map((u) => `<option value="${u.id}" ${f.unitKey === u.id ? "selected" : ""}>${escapeHtml(u.labelEn)}</option>`).join("")}
              </select>
            </label>
          </div>
          <div class="grid grid-cols-3 gap-2.5">
            <label class="block"><span class="text-xs font-bold">N (kg/ha)</span><input id="toolFertN" type="number" min="0" value="${f.nPerHa}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" /></label>
            <label class="block"><span class="text-xs font-bold">P₂O₅ (kg/ha)</span><input id="toolFertP" type="number" min="0" value="${f.pPerHa}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" /></label>
            <label class="block"><span class="text-xs font-bold">K₂O (kg/ha)</span><input id="toolFertK" type="number" min="0" value="${f.kPerHa}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" /></label>
          </div>

          <div class="rounded-2xl bg-[#EDF4EE] p-3.5 space-y-2">
            <div class="text-xs font-extrabold text-[#14532D]">Option A: DAP (18-46-0) + Urea (46% N) + MOP (60% K₂O)</div>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="bg-white rounded-xl p-2.5 border border-[#CDE0D3]">
                <div class="text-[10px] font-bold text-amber-800">DAP</div>
                <div class="text-base font-extrabold text-[#132219]">${fRes.dapKg.toFixed(1)} kg</div>
                <div class="text-[10px] text-[#496052]">${(fRes.dapKg / 50).toFixed(2)} bags</div>
              </div>
              <div class="bg-white rounded-xl p-2.5 border border-[#CDE0D3]">
                <div class="text-[10px] font-bold text-emerald-800">UREA</div>
                <div class="text-base font-extrabold text-[#132219]">${fRes.ureaKg.toFixed(1)} kg</div>
                <div class="text-[10px] text-[#496052]">${(fRes.ureaKg / 45).toFixed(2)} bags</div>
              </div>
              <div class="bg-white rounded-xl p-2.5 border border-[#CDE0D3]">
                <div class="text-[10px] font-bold text-sky-800">MOP</div>
                <div class="text-base font-extrabold text-[#132219]">${fRes.mopKg.toFixed(1)} kg</div>
                <div class="text-[10px] text-[#496052]">${(fRes.mopKg / 50).toFixed(2)} bags</div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl bg-[#FFFBEB] border border-amber-200 p-3.5 space-y-1.5 text-xs">
            <div class="font-extrabold text-amber-950">Option B (Sulphur-rich SSP Route): SSP (16% P₂O₅) + Urea + MOP</div>
            <p class="text-amber-900">
              SSP: <strong>${fRes.sspAlternativeKg.toFixed(1)} kg</strong> (${(fRes.sspAlternativeKg / 50).toFixed(2)} bags) •
              Urea: <strong>${fRes.ureaWithSspKg.toFixed(1)} kg</strong> •
              MOP: <strong>${fRes.mopKg.toFixed(1)} kg</strong>
            </p>
            <p class="text-[11px] text-amber-800">Computed for ${fRes.areaHa.toFixed(3)} ha | Nutrient Target: N ${fRes.targetN.toFixed(1)} kg, P₂O₅ ${fRes.targetP.toFixed(1)} kg, K₂O ${fRes.targetK.toFixed(1)} kg</p>
          </div>
        </div>

        <!-- Seed Rate & Plant Population Calculator -->
        <div class="gv-card p-5 space-y-4">
          <h3 class="text-base font-extrabold text-[#14532D]">2. Seed Rate &amp; Plant Population Calculator</h3>
          <div class="grid grid-cols-2 gap-2.5">
            <label class="block">
              <span class="text-xs font-bold">Area</span>
              <input id="toolSeedArea" type="number" min="0.05" step="0.1" value="${s.areaValue}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" />
            </label>
            <label class="block">
              <span class="text-xs font-bold">Unit</span>
              <select id="toolSeedUnit" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm font-semibold">
                ${Object.values(AREA_UNITS).map((u) => `<option value="${u.id}" ${s.unitKey === u.id ? "selected" : ""}>${escapeHtml(u.labelEn)}</option>`).join("")}
              </select>
            </label>
            <label class="block"><span class="text-xs font-bold">Row Spacing (cm)</span><input id="toolSeedRow" type="number" min="1" value="${s.rowSpacingCm}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" /></label>
            <label class="block"><span class="text-xs font-bold">Plant Spacing (cm)</span><input id="toolSeedPlant" type="number" min="1" value="${s.plantSpacingCm}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" /></label>
            <label class="block"><span class="text-xs font-bold">1000-Seed Test Wt (g)</span><input id="toolSeedTestWt" type="number" min="0.5" step="0.5" value="${s.testWeightGramsPer1000}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" /></label>
            <div class="grid grid-cols-2 gap-2">
              <label class="block"><span class="text-xs font-bold">Germ %</span><input id="toolSeedGerm" type="number" min="1" max="100" value="${s.germinationPercent}" class="mt-1 w-full px-2.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" /></label>
              <label class="block"><span class="text-xs font-bold">Purity %</span><input id="toolSeedPurity" type="number" min="1" max="100" value="${s.purityPercent}" class="mt-1 w-full px-2.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" /></label>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2.5 pt-2">
            <div class="rounded-2xl bg-[#EDF4EE] border border-[#CDE0D3] p-3 text-center">
              <div class="text-[10px] font-bold text-[#14532D]">AREA (m²)</div>
              <div class="text-base sm:text-lg font-extrabold text-[#132219] mt-0.5">${Math.round(sRes.areaSqM).toLocaleString("en-IN")}</div>
            </div>
            <div class="rounded-2xl bg-[#EDF4EE] border border-[#CDE0D3] p-3 text-center">
              <div class="text-[10px] font-bold text-[#14532D]">PLANTS</div>
              <div class="text-base sm:text-lg font-extrabold text-[#132219] mt-0.5">${sRes.totalPlants.toLocaleString("en-IN")}</div>
            </div>
            <div class="rounded-2xl bg-[#FFFBEB] border border-amber-200 p-3 text-center">
              <div class="text-[10px] font-bold text-amber-800">SEED NEEDED</div>
              <div class="text-base sm:text-lg font-extrabold text-amber-950 mt-0.5">${sRes.seedRateKg.toFixed(2)} kg</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 5. AI GURU KNOWLEDGE BASE & FREE ENCYCLOPEDIA SEARCH
// ----------------------------------------------------------------------------
export function renderAiGuruView(state) {
  const history = state.aiHistory || [];
  return `
    <div class="space-y-4 animate-fade-up">
      <div class="gv-card p-5 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="font-display text-xl sm:text-2xl font-bold text-[#14532D]">AI Guru Knowledge Base</h2>
            <p class="text-xs sm:text-sm text-[#496052]">Searches verified Guru Ji Vision B.Sc Agriculture notes, ICAR crop disease guides, and free Wikipedia references with source links.</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-[#14532D]">100% Free • Source Cited</span>
        </div>

        <form id="aiGuruForm" class="flex flex-col sm:flex-row gap-2 pt-2">
          <input id="aiGuruInput" type="text" required placeholder="Ask about Rice Blast, Gypsum sodic soil, CRI stage wheat, Mendelian 9:7 ratio..." class="flex-1 px-4 py-3 rounded-2xl border border-[#CDE0D3] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E7E45]" />
          <button type="submit" ${state.aiBusy ? "disabled" : ""} class="px-5 py-3 rounded-2xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold shrink-0">
            ${state.aiBusy ? "Searching..." : "Search Knowledge Base"}
          </button>
        </form>

        <div class="flex flex-wrap gap-1.5 pt-1">
          ${["Reclamation of sodic soil", "Rice Blast symptoms", "Wheat CRI stage", "Mendelian ratios"].map((prompt) => `
            <button type="button" data-ai-prompt="${escapeHtml(prompt)}" class="px-3 py-1.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-bold">${escapeHtml(prompt)}</button>
          `).join("")}
        </div>
      </div>

      <div class="space-y-3">
        ${history.length === 0 ? `
          <div class="gv-card-tinted p-6 text-center text-sm text-[#496052]">
            Ask any B.Sc Agriculture or farming question above to retrieve verified notes from Guru Ji Vision Knowledge Base + Free Wikipedia references.
          </div>
        ` : history.map((entry) => `
          <div class="gv-card p-5 space-y-3">
            <div class="text-sm font-extrabold text-[#14532D]">Q: ${escapeHtml(entry.question)}</div>
            <div class="text-sm text-[#132219] whitespace-pre-line leading-relaxed">${escapeHtml(entry.answer)}</div>
            ${entry.sources?.length ? `
              <div class="pt-2 border-t border-emerald-100 space-y-1.5">
                <div class="text-[11px] font-bold uppercase tracking-wider text-[#496052]">Sources</div>
                <div class="flex flex-wrap gap-2">
                  ${entry.sources.map((src) => {
                    const href = safeUrl(src.url);
                    return href
                      ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-bold">${src.kind === "KNOWLEDGE_BASE" ? "📚" : "🌐"} ${escapeHtml(src.title)} ↗</a>`
                      : `<span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EDF4EE] text-[#14532D] text-xs font-bold">📚 ${escapeHtml(src.title)}</span>`;
                  }).join("")}
                </div>
              </div>
            ` : ""}
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 6. CAREER OPPORTUNITIES & STUDENT COMMUNITY
// ----------------------------------------------------------------------------
export function renderCommunityView(state) {
  const sub = state.communitySubTab || "forum";
  const posts = state.communityPosts.filter((p) =>
    p.status === "ACTIVE" && (state.communityTopic === "ALL" || p.topic === state.communityTopic)
  );
  const careers = state.careerOpportunities.filter((c) =>
    c.published !== false && (state.careerCategory === "ALL" || c.category === state.careerCategory)
  );

  return `
    <div class="space-y-4 animate-fade-up">
      <div class="gv-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="font-display text-xl sm:text-2xl font-bold text-[#14532D]">Student Community &amp; Agri Careers</h2>
          <p class="text-xs sm:text-sm text-[#496052]">Ask doubts, share study notes across college groups, and track AFO/ICAR jobs &amp; scholarships.</p>
        </div>
        <div class="flex gap-1.5 bg-[#EDF4EE] p-1 rounded-xl">
          <button data-comm-sub="forum" class="px-4 py-2 rounded-lg text-xs font-extrabold ${sub === "forum" ? "bg-[#14532D] text-white" : "text-[#14532D]"}">Discussion Forum (${posts.length})</button>
          <button data-comm-sub="careers" class="px-4 py-2 rounded-lg text-xs font-extrabold ${sub === "careers" ? "bg-[#14532D] text-white" : "text-[#14532D]"}">Jobs &amp; Internships (${careers.length})</button>
        </div>
      </div>

      ${sub === "forum" ? `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div class="lg:col-span-4 gv-card p-5 space-y-3 h-fit">
            <h3 class="text-base font-extrabold text-[#14532D]">Start a Discussion / Ask Doubt</h3>
            ${!state.user ? `
              <p class="text-xs text-[#496052]">Sign in to publish posts, share college notes, or mark helpful answers.</p>
              <button data-action="open-auth" class="w-full py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">Sign In to Post</button>
            ` : `
              <form id="communityPostForm" class="space-y-3">
                <label class="block">
                  <span class="text-xs font-bold">Topic</span>
                  <select id="cpTopic" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm">
                    <option value="DOUBT">Ask a Doubt</option>
                    <option value="NOTES_SHARE">Notes &amp; Resource Share</option>
                    <option value="EXAM_PREP">Exam Prep</option>
                    <option value="FARM_TALK">Farm Talk</option>
                  </select>
                </label>
                <label class="block">
                  <span class="text-xs font-bold">College Group *</span>
                  <input id="cpGroup" type="text" required maxlength="100" value="${escapeHtml(state.userProfile?.institutionOrVillage || "B.Sc Agriculture India")}" class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
                </label>
                <label class="block">
                  <span class="text-xs font-bold">Title *</span>
                  <input id="cpTitle" type="text" required minlength="3" maxlength="140" placeholder="Short headline..." class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
                </label>
                <label class="block">
                  <span class="text-xs font-bold">Message *</span>
                  <textarea id="cpBody" rows="3" required minlength="5" maxlength="1500" placeholder="Share your question or resource details (never share personal financial info here)..." class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm"></textarea>
                </label>
                <button type="submit" class="w-full py-3 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">Publish Post</button>
              </form>
            `}
          </div>

          <div class="lg:col-span-8 space-y-3">
            <div class="flex flex-wrap gap-1.5">
              ${Object.entries(COMMUNITY_TOPICS).map(([k, v]) => `
                <button data-comm-topic="${k}" class="px-3 py-1.5 rounded-xl text-xs font-bold ${
                  state.communityTopic === k ? "bg-[#14532D] text-white" : "bg-white border border-[#CDE0D3] text-[#14532D]"
                }">${escapeHtml(v.en)}</button>
              `).join("")}
            </div>

            ${posts.length === 0 ? `
              <div class="gv-card p-8 text-center text-sm text-[#496052]">No community posts in this topic yet. Start the first conversation!</div>
            ` : posts.map((p) => `
              <article class="gv-card p-4 sm:p-5 space-y-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="px-2.5 py-0.5 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-bold">${escapeHtml(COMMUNITY_TOPICS[p.topic]?.en || p.topic)}</span>
                    <span class="text-xs font-bold text-[#1E7E45]">${escapeHtml(p.collegeGroup)}</span>
                  </div>
                  <span class="text-[11px] text-[#496052]">By ${escapeHtml(p.authorName)} • ${formatDateShort(p.updatedAtMs)}</span>
                </div>
                <h4 class="text-base font-extrabold text-[#132219]">${escapeHtml(p.title)}</h4>
                <p class="text-sm text-[#496052] whitespace-pre-line leading-relaxed">${escapeHtml(p.body)}</p>
                <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-50">
                  <button data-upvote-post="${escapeHtml(p.id)}" data-upvote-count="${Number(p.helpfulCount) || 0}" class="px-3 py-1.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-bold">
                    👍 Helpful (${Number(p.helpfulCount) || 0})
                  </button>
                  ${state.user && state.user.uid !== p.authorId ? `
                    <button data-report-post="${escapeHtml(p.id)}" class="px-3 py-1.5 rounded-xl text-slate-500 hover:text-rose-700 text-xs font-bold">Report</button>
                  ` : ""}
                  ${state.user && (state.user.uid === p.authorId || state.isAdmin) ? `
                    <button data-del-post="${escapeHtml(p.id)}" class="ml-auto px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">Delete</button>
                  ` : ""}
                </div>
              </article>
            `).join("")}
          </div>
        </div>
      ` : `
        <div class="space-y-3">
          <div class="flex flex-wrap gap-1.5">
            ${Object.entries(CAREER_CATEGORIES).map(([k, v]) => `
              <button data-career-cat="${k}" class="px-3 py-1.5 rounded-xl text-xs font-bold ${
                state.careerCategory === k ? "bg-[#14532D] text-white" : "bg-white border border-[#CDE0D3] text-[#14532D]"
              }">${escapeHtml(v.en)}</button>
            `).join("")}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${careers.map((c) => {
              const url = safeUrl(c.applyUrl);
              return `
                <article class="gv-card p-5 flex flex-col justify-between gap-3">
                  <div class="space-y-2">
                    <span class="inline-block px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-[11px] font-bold">${escapeHtml(CAREER_CATEGORIES[c.category]?.en || c.category)}</span>
                    <h4 class="text-base font-extrabold text-[#14532D]">${escapeHtml(c.title)}</h4>
                    <p class="text-xs font-bold text-[#1E7E45]">${escapeHtml(c.organization)}</p>
                    <p class="text-xs text-[#496052]"><strong>Eligibility:</strong> ${escapeHtml(c.eligibility)}</p>
                    <p class="text-xs text-[#496052]"><strong>Deadline:</strong> ${escapeHtml(c.deadline)}</p>
                    <p class="text-xs sm:text-sm text-[#132219] leading-relaxed">${escapeHtml(c.description)}</p>
                  </div>
                  ${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="gv-btn w-full text-center py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">Apply / Official Portal ↗</a>` : ""}
                </article>
              `;
            }).join("")}
          </div>
        </div>
      `}
    </div>
  `;
}
