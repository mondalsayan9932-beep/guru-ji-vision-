// ============================================================================
// Guru Ji Vision — Main Web Application Controller & State Store
// Instant Public Access + Real Firebase Sync + Strict Privacy + WhatsApp/Phone/Email Auth
// ============================================================================

import {
  CROP_PRESETS,
  DEFAULT_APP_SETTINGS,
  FALLBACK_ANNOUNCEMENTS,
  FALLBACK_CAREERS,
  FALLBACK_QUIZZES,
  FALLBACK_STUDY_MATERIALS,
  I18N,
  OFFICIAL_FACULTY
} from "./config.js";
import {
  buildDoubtChatId,
  compressImageFileToBase64,
  escapeHtml,
  isUpcomingMeeting,
  safeUrl,
  searchFreeWikipedia,
  searchKnowledgeBase
} from "./calculators.js";
import { firebaseService } from "./firebase-service.js";
import {
  renderAiGuruView,
  renderCommunityView,
  renderFarmerView,
  renderHomeView,
  renderStudentView,
  renderToolsView
} from "./ui-public.js";
import {
  renderDoubtZoneView,
  renderMeetingZoneView,
  renderMoneyManagerView
} from "./ui-private.js";
import {
  renderAdminView,
  renderOwnerControlView
} from "./ui-admin.js";

// ----------------------------------------------------------------------------
// APPLICATION STATE
// ----------------------------------------------------------------------------
const state = {
  route: "home",
  lang: localStorage.getItem("gjv_lang") || "en",
  cloudConnected: false,

  // Authenticated User & Roles
  user: null,
  userProfile: null,
  isAdmin: false,
  isSuperAdmin: false,
  facultyIdentity: { isAuthorizedProfessor: false, canHostMeetings: false, professorId: "", professorName: "", matchedByEmail: "", matchedByAccountLink: false },

  // Public / Ecosystem Collections (Hydrated immediately with safe reference fallback until live cloud connects)
  appSettings: { ...DEFAULT_APP_SETTINGS },
  studyMaterials: [...FALLBACK_STUDY_MATERIALS],
  quizzes: [...FALLBACK_QUIZZES],
  careerOpportunities: [...FALLBACK_CAREERS],
  communityPosts: [],
  announcements: [...FALLBACK_ANNOUNCEMENTS],
  farmerQueries: [],
  meetings: [],
  professors: OFFICIAL_FACULTY.map((p) => ({ ...p })),

  // Private Owner-Only Student Financial & Quiz Data (Strictly cleared on logout!)
  openingBalance: 0,
  moneyTransactions: [],
  moneyBudgets: [],
  moneyFilter: "ALL",
  moneyFormType: "EXPENSE",
  quizAttempts: [],

  // Doubt Zone Private Threads
  studentDoubtThreads: [],
  professorDoubtThreads: [],
  activeDoubtChat: null,
  activeDoubtMessages: [],
  pendingDoubtImageBase64: "",
  totalUnreadDoubts: 0,

  // Owner Control Center Telemetry (SuperAdmin only)
  ownerUsers: [],
  ownerAdmins: [],
  ownerActivities: [],
  ownerExamStats: [],
  ownerAiLogs: [],
  ownerErrorLogs: [],
  ownerContentReports: [],
  ownerAuditLogs: [],

  // View UI Sub-states
  studentSubTab: "materials",
  studentSemester: 0,
  studentCategory: "ALL",
  studentSearch: "",
  quizAnswers: {},
  quizSubmitted: false,
  communitySubTab: "forum",
  communityTopic: "ALL",
  careerCategory: "ALL",
  doubtSubTab: "advisors",
  professorSearch: "",
  adminSubTab: "materials",

  // Agri Calculator Inputs
  fertInput: { areaValue: 1, unitKey: "HECTARE", nPerHa: 120, pPerHa: 60, kPerHa: 60 },
  seedInput: { areaValue: 1, unitKey: "HECTARE", rowSpacingCm: 20, plantSpacingCm: 15, testWeightGramsPer1000: 25, germinationPercent: 85, purityPercent: 98 },

  // AI Guru State
  aiHistory: [],
  aiBusy: false,

  // Auth OTP Flow State (cooldown & attempt limiting)
  otpChannel: "", // "whatsapp" or "sms"
  otpPhoneE164: "",
  otpSessionId: "",
  otpCooldownSec: 0,
  otpAttempts: 0,

  // PWA Install Prompt
  deferredInstallPrompt: null
};

// ----------------------------------------------------------------------------
// TOAST & HELPERS
// ----------------------------------------------------------------------------
let toastTimer = null;
function showToast(msg, isError = false) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden", "bg-[#14532D]", "bg-rose-700");
  el.classList.add(isError ? "bg-rose-700" : "bg-[#14532D]");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 3800);
}

function openingBalanceKey(uid) {
  return `gjv_opening_bal_${uid}`;
}

function loadOpeningBalanceForUid(uid) {
  if (!uid) return 0;
  const val = parseFloat(localStorage.getItem(openingBalanceKey(uid)));
  return Number.isFinite(val) ? val : 0;
}

function clearPrivateStateOnLogout() {
  state.user = null;
  state.userProfile = null;
  state.isAdmin = false;
  state.isSuperAdmin = false;
  state.facultyIdentity = { isAuthorizedProfessor: false, canHostMeetings: false, professorId: "", professorName: "", matchedByEmail: "", matchedByAccountLink: false };
  state.cloudConnected = false;

  // Strictly purge private financial & chat state from memory
  state.openingBalance = 0;
  state.moneyTransactions = [];
  state.moneyBudgets = [];
  state.quizAttempts = [];
  state.farmerQueries = [];
  state.studentDoubtThreads = [];
  state.professorDoubtThreads = [];
  state.activeDoubtChat = null;
  state.activeDoubtMessages = [];
  state.pendingDoubtImageBase64 = "";
  state.totalUnreadDoubts = 0;
  state.ownerUsers = [];
  state.ownerAdmins = [];
  state.ownerActivities = [];
  state.ownerExamStats = [];
  state.ownerAiLogs = [];
  state.ownerErrorLogs = [];
  state.ownerContentReports = [];
  state.ownerAuditLogs = [];

  // Restore safe public reference views
  state.studyMaterials = [...FALLBACK_STUDY_MATERIALS];
  state.quizzes = [...FALLBACK_QUIZZES];
  state.careerOpportunities = [...FALLBACK_CAREERS];
  state.announcements = [...FALLBACK_ANNOUNCEMENTS];
  state.professors = OFFICIAL_FACULTY.map((p) => ({ ...p }));
}

function recomputeUnreadDoubts() {
  const stuUnread = state.studentDoubtThreads.reduce((s, t) => s + (Number(t.unreadForStudent) || 0), 0);
  const profUnread = state.professorDoubtThreads.reduce((s, t) => s + (Number(t.unreadForProfessor) || 0), 0);
  state.totalUnreadDoubts = stuUnread + profUnread;
}

// ----------------------------------------------------------------------------
// RENDER SHELL & ACTIVE VIEW
// ----------------------------------------------------------------------------
function renderShellChrome() {
  const dict = I18N[state.lang] || I18N.en;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });

  const langBtn = document.getElementById("langToggleBtn");
  if (langBtn) langBtn.textContent = state.lang === "en" ? "বাংলা" : "EN";

  // Sync pill
  const syncPill = document.getElementById("syncStatusPill");
  if (syncPill) {
    if (state.cloudConnected) {
      syncPill.className = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900";
      syncPill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Cloud`;
    } else {
      syncPill.className = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900";
      syncPill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Public`;
    }
  }

  // Auth button in header
  const authBtn = document.getElementById("headerAuthBtn");
  if (authBtn) {
    if (state.user) {
      const label = (state.userProfile?.displayName || state.user.displayName || state.user.phoneNumber || state.user.email || "Account").split(" ")[0];
      authBtn.textContent = `👤 ${label}`;
      authBtn.dataset.action = "open-profile";
    } else {
      authBtn.textContent = dict.signIn;
      authBtn.dataset.action = "open-auth";
    }
  }

  // Badges for Meeting Zone & Doubt Zone
  const upcomingCount = state.meetings.filter((m) => m.published !== false && isUpcomingMeeting(m)).length;
  document.querySelectorAll("[data-badge='meetings']").forEach((el) => {
    el.textContent = upcomingCount > 0 ? String(upcomingCount) : "";
    el.classList.toggle("hidden", upcomingCount === 0);
  });
  document.querySelectorAll("[data-badge='doubts']").forEach((el) => {
    el.textContent = state.totalUnreadDoubts > 0 ? (state.totalUnreadDoubts > 99 ? "99+" : String(state.totalUnreadDoubts)) : "";
    el.classList.toggle("hidden", state.totalUnreadDoubts === 0);
  });

  // Show/hide Admin & Owner nav items strictly when verified
  document.querySelectorAll("[data-role-only='admin']").forEach((el) => {
    el.classList.toggle("hidden", !state.isAdmin);
  });
  document.querySelectorAll("[data-role-only='owner']").forEach((el) => {
    el.classList.toggle("hidden", !state.isSuperAdmin);
  });

  // Active nav highlighting
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    const isBottom = btn.classList.contains("bottom-nav-item");
    const isRail = btn.classList.contains("rail-nav-item");
    const isDrawer = btn.classList.contains("drawer-nav-item");
    const active = btn.dataset.nav === state.route;

    if (isBottom) {
      btn.className = active
        ? "bottom-nav-item flex flex-col items-center justify-center min-h-[48px] rounded-xl text-[10px] font-extrabold bg-[#D8F3DC] text-[#14532D]"
        : "bottom-nav-item flex flex-col items-center justify-center min-h-[48px] rounded-xl text-[10px] font-semibold text-[#496052]";
    } else if (isRail || isDrawer) {
      btn.className = `${isRail ? "rail-nav-item" : "drawer-nav-item"} w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors ${
        active ? "bg-[#14532D] text-white font-extrabold shadow-sm" : "text-[#132219] hover:bg-[#EDF4EE] font-semibold"
      }`;
    }
  });

  // Drawer user header
  const drawerName = document.getElementById("drawerUserName");
  const drawerSub = document.getElementById("drawerUserSub");
  const drawerAuthAction = document.getElementById("drawerAuthAction");
  if (drawerName && drawerSub && drawerAuthAction) {
    if (state.user) {
      drawerName.textContent = state.userProfile?.displayName || state.user.displayName || "Guru Ji Scholar";
      drawerSub.textContent = state.user.phoneNumber || state.user.email || state.user.uid;
      drawerAuthAction.textContent = "Sign Out";
      drawerAuthAction.dataset.action = "sign-out";
      drawerAuthAction.className = "w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold";
    } else {
      drawerName.textContent = "Guest Visitor";
      drawerSub.textContent = "Public access active • Sign in for private tools";
      drawerAuthAction.textContent = "Continue with WhatsApp / Sign In";
      drawerAuthAction.dataset.action = "open-auth";
      drawerAuthAction.className = "w-full py-2.5 px-4 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold";
    }
  }
}

function renderActiveView() {
  const root = document.getElementById("appMainContent");
  if (!root) return;

  let html = "";
  switch (state.route) {
    case "home": html = renderHomeView(state); break;
    case "student": html = renderStudentView(state); break;
    case "farmer": html = renderFarmerView(state); break;
    case "tools": html = renderToolsView(state); break;
    case "ai": html = renderAiGuruView(state); break;
    case "community": html = renderCommunityView(state); break;
    case "money": html = renderMoneyManagerView(state); break;
    case "meeting": html = renderMeetingZoneView(state); break;
    case "doubt": html = renderDoubtZoneView(state); break;
    case "admin": html = renderAdminView(state); break;
    case "owner": html = renderOwnerControlView(state); break;
    default: html = renderHomeView(state); break;
  }

  root.innerHTML = html;
  renderShellChrome();

  // Auto-scroll doubt chat to bottom when open
  const chatBox = document.getElementById("doubtMessagesContainer");
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

function navigateTo(route) {
  state.route = route;
  if (route !== "doubt") {
    state.activeDoubtChat = null;
    firebaseService.setSub("activeDoubtMessages", null);
  }
  closeDrawer();
  renderActiveView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ----------------------------------------------------------------------------
// DRAWER & MODALS
// ----------------------------------------------------------------------------
function openDrawer() {
  document.getElementById("mobileDrawerBackdrop")?.classList.remove("hidden");
  document.getElementById("mobileDrawer")?.classList.remove("-translate-x-full");
}

function closeDrawer() {
  document.getElementById("mobileDrawerBackdrop")?.classList.add("hidden");
  document.getElementById("mobileDrawer")?.classList.add("-translate-x-full");
}

function openAuthModal() {
  document.getElementById("authModal")?.classList.remove("hidden");
  document.getElementById("authErrorBox")?.classList.add("hidden");
  updateOtpConfigNotice();
}

function closeAuthModal() {
  document.getElementById("authModal")?.classList.add("hidden");
}

function showAuthError(msg) {
  const box = document.getElementById("authErrorBox");
  if (!box) return;
  box.textContent = msg;
  box.classList.remove("hidden");
}

function updateOtpConfigNotice() {
  const el = document.getElementById("waBackendNotice");
  if (!el) return;
  if (firebaseService.hasWhatsAppOtpBackend()) {
    el.className = "rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-[11px] text-emerald-900";
    el.textContent = "Official WhatsApp Business OTP backend detected and ready.";
  } else {
    el.className = "rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-950";
    el.textContent = "WhatsApp Business Cloud API requires a server-side Cloud Function (secrets cannot live in browser JS). Tap 'Send SMS OTP (Firebase)' for instant real phone verification right now, or configure window.GJV_WHATSAPP_OTP_ENDPOINT after deploying your WhatsApp OTP backend.";
  }
}

function openProfileModal() {
  if (!state.user) {
    openAuthModal();
    return;
  }
  const p = state.userProfile || {};
  document.getElementById("profFullName").value = p.displayName || state.user.displayName || "";
  document.getElementById("profMobile").value = state.user.phoneNumber || "";
  document.getElementById("profEmail").value = p.email && !p.email.endsWith(".gurujivision.app") ? p.email : (state.user.email || "");
  document.getElementById("profRole").value = p.role === "FARMER" ? "FARMER" : "STUDENT";
  document.getElementById("profCollege").value = p.institutionOrVillage || "";
  document.getElementById("profDistrict").value = p.district || "";
  document.getElementById("profSemester").value = String(p.semester || 1);
  document.getElementById("profUidDisplay").textContent = `Firebase UID: ${state.user.uid}`;
  document.getElementById("profileModal")?.classList.remove("hidden");
}

function closeProfileModal() {
  document.getElementById("profileModal")?.classList.add("hidden");
}

function openMaterialReader(materialId) {
  const mat = state.studyMaterials.find((m) => m.id === materialId);
  if (!mat) return;
  document.getElementById("readerTitle").textContent = mat.title;
  document.getElementById("readerMeta").textContent = `Semester ${mat.semester} • ${mat.subject} • ${mat.category}`;
  document.getElementById("readerSummary").textContent = mat.summary;
  document.getElementById("readerContent").textContent = mat.contentText || "Open the linked PDF resource below to view full study material.";
  const link = document.getElementById("readerPdfBtn");
  const href = safeUrl(mat.resourceUrl);
  if (href) {
    link.href = href;
    link.classList.remove("hidden");
  } else {
    link.classList.add("hidden");
  }
  document.getElementById("readerModal")?.classList.remove("hidden");
}

// ----------------------------------------------------------------------------
// OTP COOLDOWN TIMER (Anti-spam & security)
// ----------------------------------------------------------------------------
let otpCooldownInterval = null;
function startOtpCooldown(seconds = 45) {
  state.otpCooldownSec = seconds;
  clearInterval(otpCooldownInterval);
  const updateBtn = () => {
    const waBtn = document.getElementById("sendWaOtpBtn");
    const smsBtn = document.getElementById("sendSmsOtpBtn");
    if (state.otpCooldownSec > 0) {
      if (waBtn) { waBtn.disabled = true; waBtn.textContent = `Resend in ${state.otpCooldownSec}s`; }
      if (smsBtn) { smsBtn.disabled = true; smsBtn.textContent = `Wait ${state.otpCooldownSec}s`; }
    } else {
      if (waBtn) { waBtn.disabled = false; waBtn.textContent = "Continue with WhatsApp OTP"; }
      if (smsBtn) { smsBtn.disabled = false; smsBtn.textContent = "Send SMS OTP (Firebase)"; }
    }
  };
  updateBtn();
  otpCooldownInterval = setInterval(() => {
    state.otpCooldownSec = Math.max(0, state.otpCooldownSec - 1);
    updateBtn();
    if (state.otpCooldownSec <= 0) clearInterval(otpCooldownInterval);
  }, 1000);
}

// ----------------------------------------------------------------------------
// FIREBASE AUTH CALLBACK & LIVE SUBSCRIPTIONS
// ----------------------------------------------------------------------------
async function handleAuthStateChange(user) {
  if (!user) {
    clearPrivateStateOnLogout();
    renderActiveView();
    return;
  }

  state.user = user;
  state.openingBalance = loadOpeningBalanceForUid(user.uid);
  const roles = await firebaseService.resolveUserRoles(user);
  state.isAdmin = roles.isAdmin;
  state.isSuperAdmin = roles.isSuperAdmin;
  state.facultyIdentity = roles.facultyIdentity;
  state.cloudConnected = true;

  firebaseService.subscribeUserProfile(user.uid, (profile) => {
    state.userProfile = profile;
    if (profile?.language) {
      state.lang = profile.language === "BN" ? "bn" : "en";
      localStorage.setItem("gjv_lang", state.lang);
    }
    renderShellChrome();
    if (state.route === "home") renderActiveView();
  });

  firebaseService.subscribeEcosystemCollections({
    isAdmin: state.isAdmin,
    isSuperAdmin: state.isSuperAdmin,
    isAuthorizedMeetingHost: state.isAdmin || state.facultyIdentity.canHostMeetings,
    uid: user.uid,
    onUpdate: (key, data) => {
      // Preserve fallback reference items ONLY if cloud collection is completely empty and user isn't admin editing
      if (key === "studyMaterials") {
        state.studyMaterials = data.length > 0 ? data : (state.isAdmin ? [] : [...FALLBACK_STUDY_MATERIALS]);
      } else if (key === "quizzes") {
        state.quizzes = data.length > 0 ? data : (state.isAdmin ? [] : [...FALLBACK_QUIZZES]);
      } else if (key === "careerOpportunities") {
        state.careerOpportunities = data.length > 0 ? data : (state.isAdmin ? [] : [...FALLBACK_CAREERS]);
      } else if (key === "announcements") {
        state.announcements = data.length > 0 ? data : [...FALLBACK_ANNOUNCEMENTS];
      } else {
        state[key] = data;
      }
      renderActiveView();
    }
  });

  firebaseService.subscribeDoubtThreads({
    uid: user.uid,
    facultyIdentity: state.facultyIdentity,
    onStudentThreads: (threads) => {
      state.studentDoubtThreads = threads;
      recomputeUnreadDoubts();
      if (state.route === "doubt" || state.route === "home") renderActiveView();
      else renderShellChrome();
    },
    onProfessorThreads: (threads) => {
      state.professorDoubtThreads = threads;
      recomputeUnreadDoubts();
      if (state.route === "doubt" || state.route === "home") renderActiveView();
      else renderShellChrome();
    }
  });

  if (state.isSuperAdmin) {
    firebaseService.subscribeOwnerTelemetry(true, (key, data) => {
      state[key] = data;
      if (state.route === "owner" || state.route === "admin") renderActiveView();
    });
  }

  renderActiveView();
}

// ----------------------------------------------------------------------------
// OPEN PRIVATE DOUBT CHAT ROOM
// ----------------------------------------------------------------------------
function openDoubtRoom({ professor, studentId, studentName, studentSemester, asProfessor }) {
  if (!state.user) {
    showToast("Sign in to start a private 1-on-1 doubt conversation with your professor.");
    openAuthModal();
    return;
  }
  const chatId = buildDoubtChatId(professor.id, studentId);
  state.activeDoubtChat = { chatId, professor, studentId, studentName, studentSemester, asProfessor };
  state.activeDoubtMessages = [];
  state.pendingDoubtImageBase64 = "";

  firebaseService.subscribeDoubtMessages({
    chatId,
    asProfessor,
    facultyIdentity: state.facultyIdentity,
    studentId,
    uid: state.user.uid,
    onMessages: (msgs) => {
      state.activeDoubtMessages = msgs;
      const threadList = asProfessor ? state.professorDoubtThreads : state.studentDoubtThreads;
      const thread = threadList.find((t) => t.id === chatId);
      if (thread) {
        firebaseService.markDoubtConversationRead(state.user.uid, thread, msgs, asProfessor);
      }
      renderActiveView();
    }
  });
  renderActiveView();
}

// ----------------------------------------------------------------------------
// AI GURU SEARCH HANDLER
// ----------------------------------------------------------------------------
async function runAiGuruSearch(question) {
  const q = String(question || "").trim();
  if (!q) return;
  state.aiBusy = true;
  renderActiveView();

  const { materialMatches, cropMatches } = searchKnowledgeBase(q, state.studyMaterials);
  const wikiResults = state.appSettings.aiFreeSearchEnabled !== false
    ? await searchFreeWikipedia(q, state.lang, 3)
    : [];

  const parts = [];
  const sources = [];

  if (materialMatches.length > 0) {
    parts.push("📚 Verified Guru Ji Vision Study Notes:");
    materialMatches.forEach(({ material }) => {
      parts.push(`\n• ${material.title} (Sem ${material.semester} • ${material.subject})\n${material.contentText ? material.contentText.slice(0, 700) : material.summary}`);
      sources.push({ title: `${material.title} (Sem ${material.semester})`, url: material.resourceUrl, kind: "KNOWLEDGE_BASE" });
    });
  }

  if (cropMatches.length > 0) {
    parts.push("\n🌾 ICAR Crop Advisory Reference:");
    cropMatches.forEach((c) => {
      parts.push(`\n• ${c.nameEn} (${c.season}) — NPK: ${c.npkPerHa.n}:${c.npkPerHa.p}:${c.npkPerHa.k} kg/ha\n  Diseases: ${c.majorDiseases.join(", ")}\n  IPM: ${c.ipmGuidance}`);
    });
  }

  if (wikiResults.length > 0) {
    parts.push("\n🌐 Free Encyclopedia References:");
    wikiResults.forEach((w) => {
      parts.push(`• ${w.title}: ${w.snippet}`);
      sources.push(w);
    });
  }

  if (parts.length === 0) {
    parts.push("No direct match found in current study notes or Wikipedia. Try searching a specific crop, disease, soil property, or B.Sc Agriculture topic, or ask one of our 9 faculty advisors in Doubt Zone!");
  }

  state.aiHistory.unshift({ question: q, answer: parts.join("\n"), sources });
  state.aiBusy = false;
  renderActiveView();
}

// ----------------------------------------------------------------------------
// GLOBAL EVENT DELEGATION (Clean, Leak-Free, Responsive)
// ----------------------------------------------------------------------------
function bindGlobalEvents() {
  // Click delegation
  document.addEventListener("click", async (e) => {
    const target = e.target.closest("[data-nav], [data-action], [data-student-sub], [data-student-sem], [data-student-cat], [data-student-jump-sem], [data-read-material], [data-quiz-q], [data-load-crop-tool], [data-apply-crop-preset], [data-ai-prompt], [data-comm-sub], [data-comm-topic], [data-career-cat], [data-upvote-post], [data-report-post], [data-del-post], [data-money-type], [data-money-filter], [data-del-tx], [data-del-goal], [data-edit-meeting], [data-del-meeting], [data-doubt-sub], [data-start-doubt-prof], [data-open-prof-thread], [data-del-doubt-msg], [data-admin-sub], [data-edit-mat], [data-del-mat], [data-del-quiz], [data-edit-notice], [data-del-notice], [data-del-career], [data-edit-prof], [data-mod-post], [data-del-admin], [data-resolve-report], [data-resolve-error]");
    if (!target) return;

    // Navigation
    if (target.dataset.nav) {
      navigateTo(target.dataset.nav);
      return;
    }

    // Named actions
    const action = target.dataset.action;
    if (action) {
      switch (action) {
        case "open-drawer": openDrawer(); return;
        case "close-drawer": closeDrawer(); return;
        case "open-auth": closeDrawer(); openAuthModal(); return;
        case "close-auth": closeAuthModal(); return;
        case "open-profile": closeDrawer(); openProfileModal(); return;
        case "close-profile": closeProfileModal(); return;
        case "close-reader": document.getElementById("readerModal")?.classList.add("hidden"); return;
        case "toggle-lang":
          state.lang = state.lang === "en" ? "bn" : "en";
          localStorage.setItem("gjv_lang", state.lang);
          renderActiveView();
          return;
        case "sign-out":
          if (confirm("Sign out of Guru Ji Vision?")) {
            await firebaseService.signOutUser();
            closeDrawer();
            closeProfileModal();
            showToast("Signed out safely. Private financial data cleared.");
            renderActiveView();
          }
          return;
        case "google-signin": {
          const res = await firebaseService.signInWithGoogle();
          if (res.ok) {
            closeAuthModal();
            showToast(`Welcome, ${res.user.displayName || res.user.email}!`);
          } else {
            showAuthError(res.error);
          }
          return;
        }
        case "install-app":
          if (state.deferredInstallPrompt) {
            state.deferredInstallPrompt.prompt();
            await state.deferredInstallPrompt.userChoice;
            state.deferredInstallPrompt = null;
            document.getElementById("installAppBtn")?.classList.add("hidden");
          }
          return;
        case "submit-quiz": {
          const activeQuizzes = state.quizzes.filter((qz) =>
            qz.published !== false && (state.studentSemester === 0 || Number(qz.semester) === state.studentSemester)
          );
          let score = 0;
          activeQuizzes.forEach((q) => {
            if (Number(state.quizAnswers[q.id]) === Number(q.correctIndex)) score++;
          });
          state.quizSubmitted = true;
          if (state.user && activeQuizzes.length > 0) {
            await firebaseService.recordQuizAttempt(state.user.uid, state.studentSemester || 1, score, activeQuizzes.length).catch(() => {});
          }
          showToast(`Exam submitted! Score: ${score}/${activeQuizzes.length}`);
          renderActiveView();
          return;
        }
        case "reset-quiz":
          state.quizAnswers = {};
          state.quizSubmitted = false;
          renderActiveView();
          return;
        case "save-opening-balance": {
          if (!state.user) return;
          const val = parseFloat(document.getElementById("openingBalanceInput")?.value) || 0;
          state.openingBalance = val;
          localStorage.setItem(openingBalanceKey(state.user.uid), String(val));
          showToast("Opening balance saved privately for your account.");
          renderActiveView();
          return;
        }
        case "export-money-pdf":
          window.print();
          return;
        case "close-doubt-chat":
          state.activeDoubtChat = null;
          firebaseService.setSub("activeDoubtMessages", null);
          renderActiveView();
          return;
        case "clear-doubt-image":
          state.pendingDoubtImageBase64 = "";
          renderActiveView();
          return;
        case "sync-9-professors":
          try {
            await firebaseService.syncOfficialFacultyToFirestore();
            showToast("All 9 official advisors synced to Firestore!");
          } catch (err) {
            showToast(err.message || "Failed to sync professors.", true);
          }
          return;
        case "export-owner-csv": {
          const rows = [
            ["Metric", "Value"],
            ["Total Users", state.ownerUsers.length],
            ["Study Materials", state.studyMaterials.length],
            ["MCQs", state.quizzes.length],
            ["Exam Completions", state.ownerExamStats.length],
            ["Farmer Queries", state.farmerQueries.length],
            ["Community Posts", state.communityPosts.length],
            ["Privacy Notice", "Student private Money Manager & Doubt Chats excluded"]
          ];
          const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `guruji_vision_owner_report_${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          showToast("Owner CSV report downloaded.");
          return;
        }
      }
    }

    // Student Hub interactions
    if (target.dataset.studentSub) { state.studentSubTab = target.dataset.studentSub; renderActiveView(); return; }
    if (target.dataset.studentSem !== undefined) { state.studentSemester = parseInt(target.dataset.studentSem, 10) || 0; state.quizSubmitted = false; renderActiveView(); return; }
    if (target.dataset.studentCat) { state.studentCategory = target.dataset.studentCat; renderActiveView(); return; }
    if (target.dataset.studentJumpSem) { state.studentSemester = parseInt(target.dataset.studentJumpSem, 10) || 0; state.studentSubTab = "materials"; renderActiveView(); return; }
    if (target.dataset.readMaterial) { openMaterialReader(target.dataset.readMaterial); return; }
    if (target.dataset.quizQ) { state.quizAnswers[target.dataset.quizQ] = parseInt(target.dataset.quizOpt, 10); renderActiveView(); return; }

    // Farmer & Tools presets
    if (target.dataset.loadCropTool || target.dataset.applyCropPreset) {
      const id = target.dataset.loadCropTool || target.dataset.applyCropPreset;
      const crop = CROP_PRESETS.find((c) => c.id === id);
      if (crop) {
        state.fertInput = { ...state.fertInput, nPerHa: crop.npkPerHa.n, pPerHa: crop.npkPerHa.p, kPerHa: crop.npkPerHa.k };
        state.seedInput = { ...state.seedInput, rowSpacingCm: crop.spacingCm.row, plantSpacingCm: crop.spacingCm.plant };
        showToast(`Loaded ${crop.nameEn} NPK & spacing preset.`);
        navigateTo("tools");
      }
      return;
    }

    // AI Guru quick prompts
    if (target.dataset.aiPrompt) {
      runAiGuruSearch(target.dataset.aiPrompt);
      return;
    }

    // Community & Careers
    if (target.dataset.commSub) { state.communitySubTab = target.dataset.commSub; renderActiveView(); return; }
    if (target.dataset.commTopic) { state.communityTopic = target.dataset.commTopic; renderActiveView(); return; }
    if (target.dataset.careerCat) { state.careerCategory = target.dataset.careerCat; renderActiveView(); return; }
    if (target.dataset.upvotePost) {
      if (!state.user) { openAuthModal(); return; }
      try {
        await firebaseService.upvoteCommunityPost(target.dataset.upvotePost, parseInt(target.dataset.upvoteCount, 10) || 0);
        showToast("Marked helpful!");
      } catch (err) { showToast(err.message || "Unable to upvote.", true); }
      return;
    }
    if (target.dataset.reportPost) {
      if (!state.user) { openAuthModal(); return; }
      const post = state.communityPosts.find((p) => p.id === target.dataset.reportPost);
      const reason = prompt("Why are you reporting this post?");
      if (post && reason && reason.trim().length >= 3) {
        await firebaseService.reportCommunityPost(state.user.uid, state.userProfile?.displayName || state.user.displayName || "User", post, reason).catch(() => {});
        showToast("Report submitted to Admin Moderation.");
      }
      return;
    }
    if (target.dataset.delPost) {
      if (!confirm("Delete this community post?")) return;
      await firebaseService.deleteCommunityPost(target.dataset.delPost).catch((err) => showToast(err.message, true));
      showToast("Post deleted.");
      return;
    }

    // Money Manager
    if (target.dataset.moneyType) { state.moneyFormType = target.dataset.moneyType; renderActiveView(); return; }
    if (target.dataset.moneyFilter) { state.moneyFilter = target.dataset.moneyFilter; renderActiveView(); return; }
    if (target.dataset.delTx) {
      if (!state.user || !confirm("Delete this financial transaction?")) return;
      await firebaseService.deleteMoneyTransaction(state.user.uid, target.dataset.delTx).catch((err) => showToast(err.message, true));
      showToast("Transaction deleted.");
      return;
    }
    if (target.dataset.delGoal) {
      if (!state.user || !confirm("Delete this budget/goal?")) return;
      await firebaseService.deleteFinancialGoal(state.user.uid, target.dataset.delGoal).catch((err) => showToast(err.message, true));
      showToast("Budget/goal deleted.");
      return;
    }

    // Meetings
    if (target.dataset.editMeeting) {
      const m = state.meetings.find((x) => x.id === target.dataset.editMeeting);
      if (m) {
        document.getElementById("meetingEditId").value = m.id;
        document.getElementById("meetTitle").value = m.title;
        document.getElementById("meetSubject").value = m.subject;
        document.getElementById("meetUrl").value = m.meetUrl;
        document.getElementById("meetDate").value = m.scheduledDate;
        document.getElementById("meetTime").value = m.scheduledTime;
        document.getElementById("meetDesc").value = m.description || "";
        document.getElementById("meetingFormHeading").textContent = "Edit Google Meet Session";
        document.getElementById("cancelMeetingEditBtn")?.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (target.dataset.delMeeting) {
      if (!confirm("Delete this Google Meet session?")) return;
      await firebaseService.deleteMeeting(target.dataset.delMeeting).catch((err) => showToast(err.message, true));
      showToast("Meeting deleted.");
      return;
    }

    // Doubt Zone
    if (target.dataset.doubtSub) { state.doubtSubTab = target.dataset.doubtSub; renderActiveView(); return; }
    if (target.dataset.startDoubtProf) {
      const prof = state.professors.find((p) => p.id === target.dataset.startDoubtProf);
      if (prof) {
        openDoubtRoom({
          professor: prof,
          studentId: state.user?.uid || "",
          studentName: state.userProfile?.displayName || state.user?.displayName || "Student",
          studentSemester: state.userProfile?.semester || 1,
          asProfessor: false
        });
      }
      return;
    }
    if (target.dataset.openProfThread) {
      const th = state.professorDoubtThreads.find((t) => t.id === target.dataset.openProfThread);
      const prof = state.professors.find((p) => p.id === th?.professorId) || { id: th?.professorId, name: th?.professorName, email: th?.professorEmail };
      if (th) {
        openDoubtRoom({
          professor: prof,
          studentId: th.studentId,
          studentName: th.studentName,
          studentSemester: th.studentSemester,
          asProfessor: true
        });
      }
      return;
    }
    if (target.dataset.delDoubtMsg && state.activeDoubtChat) {
      if (!confirm("Delete your message?")) return;
      await firebaseService.deleteOwnDoubtMessage(state.activeDoubtChat.chatId, target.dataset.delDoubtMsg).catch((err) => showToast(err.message, true));
      return;
    }

    // Admin actions
    if (target.dataset.adminSub) { state.adminSubTab = target.dataset.adminSub; renderActiveView(); return; }
    if (target.dataset.editMat) {
      const m = state.studyMaterials.find((x) => x.id === target.dataset.editMat);
      if (m) {
        document.getElementById("amEditId").value = m.id;
        document.getElementById("amTitle").value = m.title;
        document.getElementById("amSemester").value = String(m.semester || 1);
        document.getElementById("amCategory").value = m.category || "NOTES_PDF";
        document.getElementById("amSubject").value = m.subject || "";
        document.getElementById("amUrl").value = m.resourceUrl || "";
        document.getElementById("amSummary").value = m.summary || "";
        document.getElementById("amContent").value = m.contentText || "";
        document.getElementById("amPublished").checked = m.published !== false;
        document.getElementById("amVerifiedAi").checked = m.verifiedForAi !== false;
        document.getElementById("amFormTitle").textContent = "Edit Study Material";
        document.getElementById("amCancelEdit")?.classList.remove("hidden");
      }
      return;
    }
    if (target.dataset.delMat) {
      if (!confirm("Delete this study material?")) return;
      await firebaseService.deleteStudyMaterial(target.dataset.delMat).catch((err) => showToast(err.message, true));
      showToast("Material deleted.");
      return;
    }
    if (target.dataset.delQuiz) {
      if (!confirm("Delete this MCQ question?")) return;
      await firebaseService.deleteQuizQuestion(target.dataset.delQuiz).catch((err) => showToast(err.message, true));
      showToast("Quiz deleted.");
      return;
    }
    if (target.dataset.editNotice) {
      const a = state.announcements.find((x) => x.id === target.dataset.editNotice);
      if (a) {
        document.getElementById("anEditId").value = a.id;
        document.getElementById("anTitle").value = a.title;
        document.getElementById("anAudience").value = a.audience || "ALL";
        document.getElementById("anMessage").value = a.message || "";
        document.getElementById("anActive").checked = a.active !== false;
        document.getElementById("anFormTitle").textContent = "Edit Notice";
        document.getElementById("anCancelEdit")?.classList.remove("hidden");
      }
      return;
    }
    if (target.dataset.delNotice) {
      if (!confirm("Delete this notice?")) return;
      await firebaseService.deleteAnnouncement(target.dataset.delNotice).catch((err) => showToast(err.message, true));
      showToast("Notice deleted.");
      return;
    }
    if (target.dataset.delCareer) {
      if (!confirm("Delete this career opportunity?")) return;
      await firebaseService.deleteCareerOpportunity(target.dataset.delCareer).catch((err) => showToast(err.message, true));
      showToast("Opportunity deleted.");
      return;
    }
    if (target.dataset.editProf) {
      const p = state.professors.find((x) => x.id === target.dataset.editProf);
      if (p) {
        document.getElementById("apId").value = p.id;
        document.getElementById("apName").value = p.name;
        document.getElementById("apDesignation").value = p.designation || "";
        document.getElementById("apQualification").value = p.qualification || "";
        document.getElementById("apSubject").value = p.subject || "";
        document.getElementById("apDepartment").value = p.department || "";
        document.getElementById("apEmail").value = p.email || "";
        document.getElementById("apSpec").value = p.specialization || "";
        document.getElementById("apAuthUid").value = p.authorizedUid || "";
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (target.dataset.modPost) {
      await firebaseService.moderateCommunityPost(target.dataset.modPost, target.dataset.modStatus).catch((err) => showToast(err.message, true));
      showToast("Post moderation updated.");
      return;
    }
    if (target.dataset.delAdmin) {
      if (!confirm("Remove this admin role?")) return;
      await firebaseService.removeAdminRole(target.dataset.delAdmin).catch((err) => showToast(err.message, true));
      showToast("Admin role removed.");
      return;
    }
    if (target.dataset.resolveReport) {
      await firebaseService.updateContentReportStatus(target.dataset.resolveReport, target.dataset.reportStatus).catch((err) => showToast(err.message, true));
      showToast("Content report updated.");
      return;
    }
    if (target.dataset.resolveError) {
      await firebaseService.resolveErrorLog(target.dataset.resolveError).catch((err) => showToast(err.message, true));
      showToast("Error marked resolved.");
      return;
    }

    // Cancel edit buttons for inline forms
    if (target.id === "cancelMeetingEditBtn") {
      document.getElementById("meetingForm")?.reset();
      const editId = document.getElementById("meetingEditId");
      if (editId) editId.value = "";
      const heading = document.getElementById("meetingFormHeading");
      if (heading) heading.textContent = "Schedule / Edit Google Meet Session";
      target.classList.add("hidden");
      return;
    }
    if (target.id === "amCancelEdit") {
      document.getElementById("adminMaterialForm")?.reset();
      const editId = document.getElementById("amEditId");
      if (editId) editId.value = "";
      const heading = document.getElementById("amFormTitle");
      if (heading) heading.textContent = "Publish / Edit Study Material";
      target.classList.add("hidden");
      return;
    }
    if (target.id === "anCancelEdit") {
      document.getElementById("adminNoticeForm")?.reset();
      const editId = document.getElementById("anEditId");
      if (editId) editId.value = "";
      const heading = document.getElementById("anFormTitle");
      if (heading) heading.textContent = "Publish / Edit Notice";
      target.classList.add("hidden");
      return;
    }
    if (target.id === "cancelMoneyEditBtn") {
      document.getElementById("moneyTxForm")?.reset();
      const editId = document.getElementById("moneyEditId");
      if (editId) editId.value = "";
      target.classList.add("hidden");
      return;
    }

    // Close modals when clicking the dark backdrop directly
    if (e.target.id === "authModal") { closeAuthModal(); return; }
    if (e.target.id === "profileModal") { closeProfileModal(); return; }
    if (e.target.id === "readerModal") { closeReaderModal(); return; }
  });

  // Escape key closes open modals and mobile navigation drawer
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAuthModal();
      closeProfileModal();
      closeReaderModal();
      closeDrawer();
    }
  });

  // Live Input / Change Delegation
  document.addEventListener("input", (e) => {
    const id = e.target.id;
    if (id === "studentSearchInput") {
      state.studentSearch = e.target.value;
      renderActiveView();
      const el = document.getElementById("studentSearchInput");
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    } else if (id === "professorSearchInput") {
      state.professorSearch = e.target.value;
      renderActiveView();
      const el = document.getElementById("professorSearchInput");
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    } else if (["toolFertArea", "toolFertUnit", "toolFertN", "toolFertP", "toolFertK"].includes(id)) {
      state.fertInput = {
        areaValue: parseFloat(document.getElementById("toolFertArea").value) || 0,
        unitKey: document.getElementById("toolFertUnit").value,
        nPerHa: parseFloat(document.getElementById("toolFertN").value) || 0,
        pPerHa: parseFloat(document.getElementById("toolFertP").value) || 0,
        kPerHa: parseFloat(document.getElementById("toolFertK").value) || 0
      };
      renderActiveView();
    } else if (["toolSeedArea", "toolSeedUnit", "toolSeedRow", "toolSeedPlant", "toolSeedTestWt", "toolSeedGerm", "toolSeedPurity"].includes(id)) {
      state.seedInput = {
        areaValue: parseFloat(document.getElementById("toolSeedArea").value) || 0,
        unitKey: document.getElementById("toolSeedUnit").value,
        rowSpacingCm: parseFloat(document.getElementById("toolSeedRow").value) || 1,
        plantSpacingCm: parseFloat(document.getElementById("toolSeedPlant").value) || 1,
        testWeightGramsPer1000: parseFloat(document.getElementById("toolSeedTestWt").value) || 1,
        germinationPercent: parseFloat(document.getElementById("toolSeedGerm").value) || 85,
        purityPercent: parseFloat(document.getElementById("toolSeedPurity").value) || 98
      };
      renderActiveView();
    }
  });

  document.addEventListener("change", async (e) => {
    // Doubt image attachment compression
    if (e.target.id === "doubtImageFile" && e.target.files?.[0]) {
      try {
        state.pendingDoubtImageBase64 = await compressImageFileToBase64(e.target.files[0]);
        renderActiveView();
      } catch (err) {
        showToast(err.message, true);
      }
    }
    // Admin PDF upload to Firebase Storage
    if (e.target.id === "amPdfUpload" && e.target.files?.[0]) {
      try {
        showToast("Uploading PDF to Firebase Storage...");
        const url = await firebaseService.uploadPdfToStorage(e.target.files[0]);
        const urlInput = document.getElementById("amUrl");
        if (urlInput) urlInput.value = url;
        showToast("PDF uploaded! URL attached automatically.");
      } catch (err) {
        showToast(err.message || "Storage upload failed. Paste a Drive/PDF URL instead.", true);
      }
    }
  });

  // Form Submission Delegation
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    e.preventDefault();

    try {
      // AI Guru
      if (form.id === "aiGuruForm") {
        await runAiGuruSearch(document.getElementById("aiGuruInput").value);
        return;
      }

      // Farmer Query
      if (form.id === "farmerQueryForm" && state.user) {
        await firebaseService.createFarmerQuery(
          state.user.uid,
          state.userProfile?.displayName || state.user.displayName || "Farmer",
          {
            cropName: document.getElementById("fqCrop").value,
            category: document.getElementById("fqCategory").value,
            district: document.getElementById("fqDistrict").value,
            description: document.getElementById("fqDesc").value,
            hasImage: false,
            imageSummary: ""
          }
        );
        form.reset();
        showToast("Farmer query submitted to Guru Ji Vision Desk!");
        return;
      }

      // Community Post
      if (form.id === "communityPostForm" && state.user) {
        await firebaseService.createCommunityPost(
          state.user.uid,
          state.userProfile?.displayName || state.user.displayName || "Student",
          {
            topic: document.getElementById("cpTopic").value,
            collegeGroup: document.getElementById("cpGroup").value,
            title: document.getElementById("cpTitle").value,
            body: document.getElementById("cpBody").value
          }
        );
        form.reset();
        showToast("Community post published!");
        return;
      }

      // Private Money Transaction
      if (form.id === "moneyTxForm" && state.user) {
        await firebaseService.saveMoneyTransaction(
          state.user.uid,
          {
            title: document.getElementById("moneyTitle").value,
            amount: document.getElementById("moneyAmount").value,
            type: state.moneyFormType,
            category: document.getElementById("moneyCategory").value,
            dateLabel: document.getElementById("moneyDate").value,
            sharedWith: document.getElementById("moneySharedWith").value,
            note: document.getElementById("moneyNote").value
          },
          document.getElementById("moneyEditId").value
        );
        form.reset();
        showToast("Private financial entry saved to your account.");
        return;
      }

      // Private Financial Goal
      if (form.id === "moneyGoalForm" && state.user) {
        await firebaseService.saveFinancialGoal(state.user.uid, {
          name: document.getElementById("goalName").value,
          kind: document.getElementById("goalKind").value,
          monthKey: document.getElementById("goalMonth").value,
          targetAmount: document.getElementById("goalTarget").value,
          savedAmount: document.getElementById("goalSaved").value
        });
        form.reset();
        showToast("Budget / Savings goal added.");
        return;
      }

      // Meeting Form
      if (form.id === "meetingForm" && state.user) {
        await firebaseService.saveMeeting(
          state.user.uid,
          state.facultyIdentity?.professorName || state.userProfile?.displayName || state.user.displayName || "Faculty",
          {
            title: document.getElementById("meetTitle").value,
            subject: document.getElementById("meetSubject").value,
            meetUrl: document.getElementById("meetUrl").value,
            scheduledDate: document.getElementById("meetDate").value,
            scheduledTime: document.getElementById("meetTime").value,
            description: document.getElementById("meetDesc").value,
            notifyStudents: document.getElementById("meetNotify").checked,
            published: true
          },
          document.getElementById("meetingEditId").value
        );
        form.reset();
        document.getElementById("meetingEditId").value = "";
        showToast("Google Meet session saved!");
        return;
      }

      // Doubt Chat Composer
      if (form.id === "doubtComposerForm" && state.user && state.activeDoubtChat) {
        const chat = state.activeDoubtChat;
        const input = document.getElementById("doubtMessageInput");
        const text = input.value;
        await firebaseService.sendDoubtMessage({
          uid: state.user.uid,
          professor: chat.professor,
          studentId: chat.studentId,
          studentName: chat.studentName,
          studentSemester: chat.studentSemester,
          senderRole: chat.asProfessor ? "PROFESSOR" : "STUDENT",
          senderName: chat.asProfessor ? chat.professor.name : chat.studentName,
          text,
          imageBase64: state.pendingDoubtImageBase64
        });
        input.value = "";
        state.pendingDoubtImageBase64 = "";
        renderActiveView();
        return;
      }

      // Admin Study Material
      if (form.id === "adminMaterialForm" && state.user) {
        await firebaseService.saveStudyMaterial(
          state.user.uid,
          {
            title: document.getElementById("amTitle").value,
            semester: document.getElementById("amSemester").value,
            category: document.getElementById("amCategory").value,
            subject: document.getElementById("amSubject").value,
            resourceUrl: document.getElementById("amUrl").value,
            summary: document.getElementById("amSummary").value,
            contentText: document.getElementById("amContent").value,
            published: document.getElementById("amPublished").checked,
            verifiedForAi: document.getElementById("amVerifiedAi").checked
          },
          document.getElementById("amEditId").value
        );
        form.reset();
        document.getElementById("amEditId").value = "";
        showToast("Study material saved live to Firestore!");
        return;
      }

      // Admin Quiz
      if (form.id === "adminQuizForm" && state.user) {
        await firebaseService.saveQuizQuestion(state.user.uid, {
          title: document.getElementById("aqTitle").value,
          semester: document.getElementById("aqSem").value,
          subject: document.getElementById("aqSubject").value,
          questionText: document.getElementById("aqQuestion").value,
          options: [0, 1, 2, 3].map((i) => document.getElementById(`aqOpt${i}`).value),
          correctIndex: document.getElementById("aqCorrect").value,
          explanation: document.getElementById("aqExplanation").value,
          published: true
        });
        form.reset();
        showToast("MCQ published live!");
        return;
      }

      // Admin Notice
      if (form.id === "adminNoticeForm" && state.user) {
        await firebaseService.saveAnnouncement(
          state.user.uid,
          {
            title: document.getElementById("anTitle").value,
            audience: document.getElementById("anAudience").value,
            message: document.getElementById("anMessage").value,
            active: document.getElementById("anActive").checked
          },
          document.getElementById("anEditId").value
        );
        form.reset();
        document.getElementById("anEditId").value = "";
        showToast("Notice published live!");
        return;
      }

      // Admin Career
      if (form.id === "adminCareerForm" && state.user) {
        await firebaseService.saveCareerOpportunity(state.user.uid, {
          title: document.getElementById("acTitle").value,
          organization: document.getElementById("acOrg").value,
          category: document.getElementById("acCategory").value,
          deadline: document.getElementById("acDeadline").value,
          eligibility: document.getElementById("acEligibility").value,
          applyUrl: document.getElementById("acUrl").value,
          description: document.getElementById("acDesc").value,
          published: true
        });
        form.reset();
        showToast("Career opportunity published!");
        return;
      }

      // Admin Farmer Query Reply
      if (form.dataset.replyFq) {
        const reply = form.querySelector("input[name='reply']").value;
        const status = form.querySelector("select[name='status']").value;
        await firebaseService.replyFarmerQueryAsAdmin(form.dataset.replyFq, status, reply);
        showToast("Farmer query updated!");
        return;
      }

      // Admin Professor Profile
      if (form.id === "adminProfForm" && state.user) {
        await firebaseService.saveProfessorAsAdmin(state.user.uid, {
          id: document.getElementById("apId").value,
          name: document.getElementById("apName").value,
          designation: document.getElementById("apDesignation").value,
          qualification: document.getElementById("apQualification").value,
          subject: document.getElementById("apSubject").value,
          department: document.getElementById("apDepartment").value,
          email: document.getElementById("apEmail").value,
          specialization: document.getElementById("apSpec").value,
          authorizedUid: document.getElementById("apAuthUid").value,
          canHostMeetings: true,
          active: true
        });
        form.reset();
        document.getElementById("apId").value = "";
        showToast("Advisor profile saved to Firestore!");
        return;
      }

      // Admin App Settings
      if (form.id === "adminSettingsForm") {
        await firebaseService.saveAppSettings({
          ...state.appSettings,
          whatsappNumber: document.getElementById("setWaNum").value,
          supportEmail: document.getElementById("setSupportEmail").value,
          whatsappGroupInviteUrl: document.getElementById("setWaGroup").value,
          heroHeadline: document.getElementById("setHeadline").value,
          aboutText: document.getElementById("setAbout").value,
          maintenanceBanner: document.getElementById("setMaint").value
        });
        showToast("Global App Settings & WhatsApp config updated live!");
        return;
      }

      // Add Admin Role
      if (form.id === "addAdminRoleForm" && state.user) {
        await firebaseService.addAdminRole(
          state.user.uid,
          document.getElementById("arUid").value,
          document.getElementById("arEmail").value,
          document.getElementById("arRole").value
        );
        form.reset();
        showToast("Authorized admin added.");
        return;
      }

      // User Profile Save
      if (form.id === "profileForm" && state.user) {
        await firebaseService.saveUserProfile(
          state.user,
          {
            displayName: document.getElementById("profFullName").value,
            email: document.getElementById("profEmail").value,
            role: document.getElementById("profRole").value,
            institutionOrVillage: document.getElementById("profCollege").value,
            district: document.getElementById("profDistrict").value,
            semester: document.getElementById("profSemester").value,
            language: state.lang.toUpperCase()
          },
          Boolean(state.userProfile)
        );
        closeProfileModal();
        showToast("Profile saved successfully!");
        return;
      }

      // Optional Email / Password Auth Form
      if (form.id === "emailAuthForm") {
        const email = document.getElementById("authEmailInput").value;
        const pass = document.getElementById("authPassInput").value;
        const isReg = document.getElementById("authEmailModeToggle").dataset.mode === "register";
        const res = isReg
          ? await firebaseService.registerWithEmail(email, pass, email.split("@")[0])
          : await firebaseService.signInWithEmail(email, pass);
        if (res.ok) {
          closeAuthModal();
          showToast("Signed in with Email!");
        } else {
          showAuthError(res.error);
        }
        return;
      }

      // OTP Verification Form (WhatsApp Backend or Real Firebase SMS OTP)
      if (form.id === "verifyOtpForm") {
        if (state.otpAttempts >= 5) {
          showAuthError("Too many verification attempts. Please request a fresh OTP.");
          return;
        }
        state.otpAttempts++;
        const code = document.getElementById("otpCodeInput").value.trim();
        const res = state.otpChannel === "whatsapp"
          ? await firebaseService.verifyWhatsAppOtp(state.otpPhoneE164, code, state.otpSessionId)
          : await firebaseService.verifyFirebaseSmsOtp(code);
        if (res.ok) {
          state.otpAttempts = 0;
          closeAuthModal();
          showToast("Phone verified! Welcome to Guru Ji Vision.");
        } else {
          showAuthError(res.error);
        }
        return;
      }
    } catch (err) {
      console.error("Action failed:", err);
      showToast(err?.message || "Operation failed. Check permissions or network.", true);
    }
  });

  // Dedicated WhatsApp OTP & Firebase SMS OTP buttons inside Auth Modal
  document.getElementById("sendWaOtpBtn")?.addEventListener("click", async () => {
    const cc = (document.getElementById("phoneCountryCode")?.value || "+91").trim();
    const num = (document.getElementById("phoneNumberInput")?.value || "").replace(/[^\d]/g, "");
    if (num.length < 8) { showAuthError("Enter a valid mobile number."); return; }
    const e164 = `${cc}${num}`;
    const res = await firebaseService.requestWhatsAppOtp(e164);
    if (res.ok) {
      state.otpChannel = "whatsapp";
      state.otpPhoneE164 = e164;
      state.otpSessionId = res.sessionId;
      state.otpAttempts = 0;
      document.getElementById("verifyOtpForm")?.classList.remove("hidden");
      startOtpCooldown(45);
      showToast(`WhatsApp OTP sent to ${e164}`);
    } else {
      showAuthError(res.error);
    }
  });

  document.getElementById("sendSmsOtpBtn")?.addEventListener("click", async () => {
    const cc = (document.getElementById("phoneCountryCode")?.value || "+91").trim();
    const num = (document.getElementById("phoneNumberInput")?.value || "").replace(/[^\d]/g, "");
    if (num.length < 8) { showAuthError("Enter a valid 10-digit mobile number."); return; }
    const e164 = `${cc}${num}`;
    const res = await firebaseService.sendFirebaseSmsOtp(e164, "recaptcha-container");
    if (res.ok) {
      state.otpChannel = "sms";
      state.otpPhoneE164 = e164;
      state.otpAttempts = 0;
      document.getElementById("authErrorBox")?.classList.add("hidden");
      document.getElementById("verifyOtpForm")?.classList.remove("hidden");
      startOtpCooldown(45);
      showToast(`Verification OTP sent via SMS to ${e164}`);
    } else {
      showAuthError(res.error);
    }
  });

  // Toggle Login vs Register for Optional Email Auth
  document.getElementById("authEmailModeToggle")?.addEventListener("click", (e) => {
    const btn = e.currentTarget;
    const isReg = btn.dataset.mode === "register";
    btn.dataset.mode = isReg ? "login" : "register";
    btn.textContent = isReg ? "Need a new email account? Register" : "Already have an account? Sign In";
    const submit = document.getElementById("authEmailSubmitBtn");
    if (submit) submit.textContent = isReg ? "Sign In with Email" : "Create Email Account";
  });

  // PWA Install Prompt
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    state.deferredInstallPrompt = e;
    document.getElementById("installAppBtn")?.classList.remove("hidden");
    document.getElementById("installAppBtn")?.classList.add("inline-flex");
  });
}

// ----------------------------------------------------------------------------
// BOOTSTRAP (Instant Public Render + Non-Blocking Firebase & SW Registration)
// ----------------------------------------------------------------------------
bindGlobalEvents();
renderActiveView();
firebaseService.init(handleAuthStateChange);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
