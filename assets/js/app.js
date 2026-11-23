// ============================================================================
// Guru Ji Vision — Main Web Application Controller & State Store
// Instant Public Live Firestore Sync + Weather API + Crop Market Prices +
// Student Career Guidance + Farmer Advisor Expert + Professor Dashboard +
// Private Student & Farmer Money Manager (Zero Admin Approval) + PWA Updates
// ============================================================================

import {
  CROP_PRESETS,
  DEFAULT_APP_SETTINGS,
  FALLBACK_ANNOUNCEMENTS,
  FALLBACK_CAREERS,
  FALLBACK_QUIZZES,
  FALLBACK_STUDY_MATERIALS,
  I18N,
  OFFICIAL_FACULTY,
  QUICK_WEATHER_LOCATIONS
} from "./config.js";
import {
  buildDoubtChatId,
  compressImageFileToBase64,
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
  renderMarketplaceView,
  renderStudentView,
  renderToolsView
} from "./ui-public.js";
import {
  renderCareerGuidanceView,
  renderDoubtZoneView,
  renderFarmerAdvisorView,
  renderMeetingZoneView,
  renderMoneyManagerView,
  renderProfessorDashboardView
} from "./ui-private.js";
import {
  renderAdminView,
  renderOwnerControlView
} from "./ui-admin.js";
import {
  fetchOfficialMandiPrices,
  fetchWeatherByLocation,
  renderMarketPriceView,
  renderWeatherView,
  searchWeatherLocations
} from "./weather-market.js";
import { farmerFinanceService } from "./farmer-finance-service.js";
import { renderFarmerFinanceView } from "./farmer-finance-ui-core.js";
import {
  bindFarmerFinanceEvents,
  clearFarmerFinancePrivateState,
  createInitialFarmerFinanceState
} from "./farmer-finance-controller.js";

const VALID_ROUTES = new Set([
  "home",
  "weather",
  "market",
  "marketplace",
  "student",
  "farmer",
  "farmer-finance",
  "tools",
  "ai",
  "community",
  "career-guidance",
  "farmer-advisor",
  "professor",
  "meeting",
  "money",
  "doubt",
  "admin",
  "owner"
]);

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
  facultyIdentity: {
    isAuthorizedProfessor: false,
    canHostMeetings: false,
    professorId: "",
    professorName: "",
    matchedByEmail: "",
    matchedByAccountLink: false
  },

  // Public / Ecosystem Collections (Hydrated immediately with safe reference fallback until live public Firestore connects)
  appSettings: { ...DEFAULT_APP_SETTINGS },
  studyMaterials: [...FALLBACK_STUDY_MATERIALS],
  quizzes: [...FALLBACK_QUIZZES],
  careerOpportunities: [...FALLBACK_CAREERS],
  communityPosts: [],
  announcements: [...FALLBACK_ANNOUNCEMENTS],
  farmerQueries: [],
  meetings: [],
  professors: OFFICIAL_FACULTY.map((p) => ({ ...p })),
  firestoreMarketPrices: [],

  // Live Weather State (Real Open-Meteo API — ZERO fake data)
  weatherQuery: "",
  weatherData: null,
  weatherLoading: false,
  weatherError: "",
  weatherSearchResults: [],
  weatherLastLocation: QUICK_WEATHER_LOCATIONS[0],

  // Live Crop Market Price State (Official AGMARKNET Proxy + Admin Verified)
  mandiApiRecords: [],
  mandiLoading: false,
  mandiFetchedOnce: false,
  mandiUsingCached: false,
  mandiLastRefreshedAt: "",
  mandiStatusMessage: "",
  marketSearchCrop: "",
  marketFilterState: "ALL",
  marketFilterDistrict: "ALL",
  marketFilterMandi: "ALL",

  // Private Owner-Only Student & Farmer Financial Data (Strictly cleared on logout!)
  openingBalance: 0,
  moneyTransactions: [],
  moneyBudgets: [],
  moneyLedgerScope: "", // "STUDENT" or "FARMER"
  moneyFilter: "ALL",
  moneyFormType: "EXPENSE",
  quizAttempts: [],

  // Farmer Financial Support & Rights Module State (Private records cleared on logout!)
  farmerFinance: createInitialFarmerFinanceState(),

  // Student Career Guidance / Farmer Advisor / Professor Dashboard Threads
  studentDoubtThreads: [],
  professorDoubtThreads: [],
  activeDoubtChat: null,
  activeDoubtMessages: [],
  pendingDoubtImageBase64: "",
  pendingCareerImageBase64: "",
  pendingFarmerAdvisorImageBase64: "",
  pendingFarmerQueryImageBase64: "",
  selectedCareerProfId: "",
  selectedFarmerProfId: "",
  selectedFarmerTopic: "DISEASE_PEST",
  profInboxFilter: "ALL",
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
  professorSearch: "",
  adminSubTab: "materials",

  // Agri Calculator Inputs
  fertInput: { areaValue: 1, unitKey: "HECTARE", nPerHa: 120, pPerHa: 60, kPerHa: 60 },
  seedInput: { areaValue: 1, unitKey: "HECTARE", rowSpacingCm: 20, plantSpacingCm: 15, testWeightGramsPer1000: 25, germinationPercent: 85, purityPercent: 98 },

  // AI Guru State
  aiHistory: [],
  aiBusy: false,

  // Google Auth Session State
  authInitializing: true,
  justSignedInFromAuth: false,

  // PWA Install & Update State
  deferredInstallPrompt: null,
  waitingServiceWorker: null
};

// ----------------------------------------------------------------------------
// TOAST, BUSY SUBMIT GUARD & HELPERS
// ----------------------------------------------------------------------------
let toastTimer = null;
function showToast(msg, isError = false) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden", "bg-[#14532D]", "bg-rose-700");
  el.classList.add(isError ? "bg-rose-700" : "bg-[#14532D]");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 4200);
}

async function withBusySubmit(form, task) {
  const submitBtn = form?.querySelector("button[type='submit']");
  if (submitBtn?.disabled) return;
  const origText = submitBtn ? submitBtn.textContent : "";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";
  }
  try {
    await task();
  } finally {
    if (submitBtn && document.body.contains(submitBtn)) {
      submitBtn.disabled = false;
      submitBtn.textContent = origText;
    }
  }
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
  state.facultyIdentity = {
    isAuthorizedProfessor: false,
    canHostMeetings: false,
    professorId: "",
    professorName: "",
    matchedByEmail: "",
    matchedByAccountLink: false
  };

  // Strictly purge private financial & consultation state from memory
  state.openingBalance = 0;
  state.moneyTransactions = [];
  state.moneyBudgets = [];
  state.moneyLedgerScope = "";
  state.quizAttempts = [];
  state.farmerQueries = [];
  state.studentDoubtThreads = [];
  state.professorDoubtThreads = [];
  state.activeDoubtChat = null;
  state.activeDoubtMessages = [];
  state.pendingDoubtImageBase64 = "";
  state.pendingCareerImageBase64 = "";
  state.pendingFarmerAdvisorImageBase64 = "";
  state.pendingFarmerQueryImageBase64 = "";
  state.totalUnreadDoubts = 0;
  state.ownerUsers = [];
  state.ownerAdmins = [];
  state.ownerActivities = [];
  state.ownerExamStats = [];
  state.ownerAiLogs = [];
  state.ownerErrorLogs = [];
  state.ownerContentReports = [];
  state.ownerAuditLogs = [];
  clearFarmerFinancePrivateState(state);
}

function recomputeUnreadDoubts() {
  const stuUnread = state.studentDoubtThreads.reduce((s, t) => s + (Number(t.unreadForStudent) || 0), 0);
  const profUnread = state.professorDoubtThreads.reduce((s, t) => s + (Number(t.unreadForProfessor) || 0), 0);
  state.totalUnreadDoubts = stuUnread + profUnread;
}

// ----------------------------------------------------------------------------
// REAL WEATHER & OFFICIAL MARKET PRICE CONTROLLERS
// ----------------------------------------------------------------------------
async function loadWeatherForLocation(loc) {
  if (!loc) return;
  state.weatherLastLocation = loc;
  state.weatherLoading = true;
  state.weatherError = "";
  state.weatherSearchResults = [];
  if (state.route === "weather") renderActiveView();

  const res = await fetchWeatherByLocation(loc);
  state.weatherLoading = false;
  if (res.ok) {
    state.weatherData = res.data;
    state.weatherError = "";
  } else {
    state.weatherError = res.error;
  }
  if (state.route === "weather") renderActiveView();
}

async function loadOfficialMandiData(force = false) {
  if (state.mandiLoading) return;
  if (state.mandiFetchedOnce && !force) return;
  state.mandiLoading = true;
  state.mandiFetchedOnce = true;
  if (state.route === "market" || state.route === "farmer-finance") renderActiveView();

  const res = await fetchOfficialMandiPrices({
    state: state.marketFilterState !== "ALL" ? state.marketFilterState : "",
    district: state.marketFilterDistrict !== "ALL" ? state.marketFilterDistrict : "",
    market: state.marketFilterMandi !== "ALL" ? state.marketFilterMandi : "",
    commodity: state.marketSearchCrop || "",
    limit: 120
  });

  state.mandiLoading = false;
  if (res.ok && Array.isArray(res.records)) {
    state.mandiApiRecords = res.records;
    state.mandiUsingCached = false;
    state.mandiLastRefreshedAt = res.fetchedAt
      ? new Date(res.fetchedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
      : new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    state.mandiStatusMessage = res.records.length > 0
      ? `Synced ${res.records.length} live official records from Government of India AGMARKNET (${state.mandiLastRefreshedAt}).`
      : `Connected to official AGMARKNET API (${state.mandiLastRefreshedAt}), but no daily price records matched the current filter.`;
  } else {
    // Preserve any previously fetched valid records as cached/historical on subsequent failure
    if (Array.isArray(state.mandiApiRecords) && state.mandiApiRecords.length > 0) {
      state.mandiUsingCached = true;
    }
    state.mandiStatusMessage = res.error || "Live mandi price data is temporarily unavailable. Please try refreshing later.";
  }
  if (state.route === "market" || state.route === "home" || state.route === "farmer-finance") renderActiveView();
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

  // Sync status pill
  const syncPill = document.getElementById("syncStatusPill");
  if (syncPill) {
    if (state.cloudConnected) {
      syncPill.className = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#14532D] border border-[#BBF7D0] shrink-0";
      syncPill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span> Live Cloud`;
    } else {
      syncPill.className = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#15803D] border border-[#BBF7D0] shrink-0";
      syncPill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span> Public`;
    }
  }

  // Auth button in header
  const authBtn = document.getElementById("headerAuthBtn");
  if (authBtn) {
    if (state.user) {
      const label = (state.userProfile?.displayName || state.user.displayName || state.user.phoneNumber || state.user.email || "Account").split(" ")[0];
      authBtn.textContent = label;
      authBtn.dataset.action = "open-profile";
    } else {
      authBtn.textContent = dict.signIn;
      authBtn.dataset.action = "open-auth";
    }
  }

  // Badges for Meetings & Consultations
  const upcomingCount = state.meetings.filter((m) => m.published !== false && isUpcomingMeeting(m)).length;
  document.querySelectorAll("[data-badge='meetings']").forEach((el) => {
    el.textContent = upcomingCount > 0 ? String(upcomingCount) : "";
    el.classList.toggle("hidden", upcomingCount === 0);
  });
  document.querySelectorAll("[data-badge='doubts']").forEach((el) => {
    el.textContent = state.totalUnreadDoubts > 0 ? (state.totalUnreadDoubts > 99 ? "99+" : String(state.totalUnreadDoubts)) : "";
    el.classList.toggle("hidden", state.totalUnreadDoubts === 0);
  });

  // Role-gated navigation links
  document.querySelectorAll("[data-role-only='admin']").forEach((el) => {
    el.classList.toggle("hidden", !state.isAdmin);
  });
  document.querySelectorAll("[data-role-only='owner']").forEach((el) => {
    el.classList.toggle("hidden", !state.isSuperAdmin);
  });
  document.querySelectorAll("[data-role-only='professor']").forEach((el) => {
    el.classList.toggle("hidden", !state.facultyIdentity?.isAuthorizedProfessor);
  });

  // Active nav highlighting
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    const isBottom = btn.classList.contains("bottom-nav-item");
    const isRail = btn.classList.contains("rail-nav-item");
    const isDrawer = btn.classList.contains("drawer-nav-item");
    const active = btn.dataset.nav === state.route;

    if (isBottom) {
      btn.className = active
        ? "bottom-nav-item flex flex-col items-center justify-center gap-0.5 min-h-[48px] rounded-xl text-[10px] font-extrabold bg-[#DCFCE7] text-[#14532D] transition-colors"
        : "bottom-nav-item flex flex-col items-center justify-center gap-0.5 min-h-[48px] rounded-xl text-[10px] font-semibold text-[#475569] hover:text-[#14532D] transition-colors";
    } else if (isRail || isDrawer) {
      btn.className = `${isRail ? "rail-nav-item" : "drawer-nav-item"} w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-all ${
        active
          ? "bg-gradient-to-r from-[#14532D] to-[#15803D] text-white font-extrabold shadow-sm"
          : "text-[#0F172A] hover:bg-[#ECFDF5] hover:text-[#14532D] font-semibold"
      }`;
    }
  });

  // Drawer user header
  const drawerName = document.getElementById("drawerUserName");
  const drawerSub = document.getElementById("drawerUserSub");
  const drawerAuthAction = document.getElementById("drawerAuthAction");
  if (drawerName && drawerSub && drawerAuthAction) {
    if (state.user) {
      drawerName.textContent = state.userProfile?.displayName || state.user.displayName || "Guru Ji Member";
      drawerSub.textContent = state.user.phoneNumber || state.user.email || state.user.uid;
      drawerAuthAction.textContent = dict.signOut;
      drawerAuthAction.dataset.action = "sign-out";
      drawerAuthAction.className = "w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold transition-colors";
    } else {
      drawerName.textContent = "Guest Visitor";
      drawerSub.textContent = "Public access active • Sign in with Google for private tools";
      drawerAuthAction.textContent = "Continue with Google";
      drawerAuthAction.dataset.action = "open-auth";
      drawerAuthAction.className = "w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#14532D] to-[#15803D] hover:opacity-95 text-white text-xs font-extrabold shadow-sm transition-opacity";
    }
  }
}

function renderActiveView() {
  const root = document.getElementById("appMainContent");
  if (!root) return;

  let html = "";
  switch (state.route) {
    case "home": html = renderHomeView(state); break;
    case "weather": html = renderWeatherView(state); break;
    case "market": html = renderMarketPriceView(state); break;
    case "marketplace": html = renderMarketplaceView(state); break;
    case "student": html = renderStudentView(state); break;
    case "farmer": html = renderFarmerView(state); break;
    case "farmer-finance": html = renderFarmerFinanceView(state); break;
    case "tools": html = renderToolsView(state); break;
    case "ai": html = renderAiGuruView(state); break;
    case "community": html = renderCommunityView(state); break;
    case "money": html = renderMoneyManagerView(state); break;
    case "meeting": html = renderMeetingZoneView(state); break;
    case "career-guidance": html = renderCareerGuidanceView(state); break;
    case "farmer-advisor": html = renderFarmerAdvisorView(state); break;
    case "professor": html = renderProfessorDashboardView(state); break;
    case "doubt": html = renderDoubtZoneView(state); break;
    case "admin": html = renderAdminView(state); break;
    case "owner": html = renderOwnerControlView(state); break;
    default: html = renderHomeView(state); break;
  }

  root.innerHTML = html;
  renderShellChrome();

  // Auto-scroll active consultation chat to bottom
  const chatBox = document.getElementById("doubtMessagesContainer");
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

function navigateTo(route, updateHash = true) {
  const cleanRoute = VALID_ROUTES.has(route) ? route : "home";
  const consultationRoutes = new Set(["career-guidance", "farmer-advisor", "professor", "doubt"]);
  if (!consultationRoutes.has(cleanRoute)) {
    state.activeDoubtChat = null;
    firebaseService.setSub("activeDoubtMessages", null);
  }
  state.route = cleanRoute;
  if (updateHash && typeof window !== "undefined") {
    const nextHash = cleanRoute === "home" ? "" : `#${cleanRoute}`;
    if (window.location.hash !== nextHash) {
      history.replaceState(null, "", nextHash || window.location.pathname);
    }
  }
  closeDrawer();
  renderActiveView();
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Auto-load genuine live Weather / Official Mandi prices on first visit
  if (cleanRoute === "weather" && !state.weatherData && !state.weatherLoading) {
    loadWeatherForLocation(state.weatherLastLocation || QUICK_WEATHER_LOCATIONS[0]);
  }
  if ((cleanRoute === "market" || (cleanRoute === "farmer-finance" && state.farmerFinance?.subTab === "market-sales")) && !state.mandiFetchedOnce) {
    loadOfficialMandiData(false);
  }
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

const PROTECTED_ROUTES = new Set(["money", "doubt", "career-guidance", "farmer-advisor", "professor", "admin", "owner"]);

function setAuthLoadingOverlay(show, title = "Signing you in...", sub = "Verifying your Google Account with Guru Ji Vision.") {
  const overlay = document.getElementById("authLoadingOverlay");
  if (!overlay) return;
  if (show) {
    const t = document.getElementById("authLoadingTitle");
    const s = document.getElementById("authLoadingSub");
    if (t) t.textContent = title;
    if (s) s.textContent = sub;
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

function clearAuthMessages() {
  document.getElementById("authErrorBox")?.classList.add("hidden");
  document.getElementById("authInfoBox")?.classList.add("hidden");
  document.getElementById("googleRedirectFallbackBtn")?.classList.add("hidden");
}

function showAuthError(msg, offerRedirectFallback = false) {
  document.getElementById("authInfoBox")?.classList.add("hidden");
  const box = document.getElementById("authErrorBox");
  if (box) {
    box.textContent = msg;
    box.classList.remove("hidden");
  }
  const fallbackBtn = document.getElementById("googleRedirectFallbackBtn");
  if (fallbackBtn) {
    fallbackBtn.classList.toggle("hidden", !offerRedirectFallback);
  }
}

function showAuthInfo(msg) {
  document.getElementById("authErrorBox")?.classList.add("hidden");
  const box = document.getElementById("authInfoBox");
  if (!box) return;
  box.textContent = msg;
  box.classList.remove("hidden");
}

function setGoogleBtnLoading(loading) {
  const btn = document.getElementById("googleSignInBtn");
  const fallbackBtn = document.getElementById("googleRedirectFallbackBtn");
  const label = document.getElementById("googleSignInBtnLabel");
  if (btn) btn.disabled = loading;
  if (fallbackBtn) fallbackBtn.disabled = loading;
  if (label) label.textContent = loading ? "Signing in with Google..." : "Continue with Google";
}

function openAuthModal() {
  clearAuthMessages();
  setGoogleBtnLoading(false);
  document.getElementById("authModal")?.classList.remove("hidden");
}

function closeAuthModal() {
  document.getElementById("authModal")?.classList.add("hidden");
}

function showLinkFeedback(msg, isError = false) {
  const box = document.getElementById("linkFeedbackBox");
  if (!box) return;
  box.textContent = msg;
  box.className = isError
    ? "rounded-xl p-2.5 text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800"
    : "rounded-xl p-2.5 text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-900";
}

function renderLinkedProvidersState(user) {
  const providers = user?.providerData || [];
  const googleProvider = providers.find((p) => p.providerId === "google.com");

  const googleStatus = document.getElementById("linkedGoogleStatus");
  const linkGoogleBtn = document.getElementById("linkGoogleBtn");
  if (googleStatus && linkGoogleBtn) {
    if (googleProvider) {
      googleStatus.textContent = `Google Account: Connected (${googleProvider.email || user.email || "Verified"})`;
      linkGoogleBtn.classList.add("hidden");
    } else {
      googleStatus.textContent = "Google Account: Not linked yet (Legacy session)";
      linkGoogleBtn.classList.remove("hidden");
    }
  }
}

function openProfileModal() {
  if (!state.user) {
    openAuthModal();
    return;
  }
  const p = state.userProfile || {};
  document.getElementById("profFullName").value = p.displayName || state.user.displayName || "";
  document.getElementById("profMobile").value = p.phoneNumber || state.user.phoneNumber || "";
  document.getElementById("profEmail").value = p.email && !p.email.endsWith(".gurujivision.app") ? p.email : (state.user.email || "");
  const effectiveSelectRole = (p.role === "PROFESSOR" || p.requestedRole === "PROFESSOR")
    ? "PROFESSOR"
    : (p.role === "FARMER" ? "FARMER" : "STUDENT");
  document.getElementById("profRole").value = effectiveSelectRole;
  document.getElementById("profCollege").value = p.institutionOrVillage || "";
  document.getElementById("profDistrict").value = p.district || "";
  document.getElementById("profState").value = p.state || "";
  document.getElementById("profSemester").value = String(p.semester ?? (effectiveSelectRole === "STUDENT" ? 1 : 0));
  document.getElementById("profDepartment").value = p.department || "";
  document.getElementById("profSpec").value = p.subjectSpecialization || "";
  document.getElementById("profUidDisplay").textContent = `Firebase UID: ${state.user.uid}`;

  const badge = document.getElementById("profApprovalBadge");
  if (badge) {
    if (state.facultyIdentity?.isAuthorizedProfessor || p.professorApprovalStatus === "APPROVED") {
      badge.className = "rounded-xl px-3 py-2 text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-900";
      badge.textContent = "Verified Professor Account — Faculty Dashboard & Meeting Host access enabled.";
    } else if (p.professorApprovalStatus === "PENDING") {
      badge.className = "rounded-xl px-3 py-2 text-xs font-bold bg-amber-50 border border-amber-200 text-amber-950";
      badge.textContent = "Professor Verification Pending — Awaiting Super Admin approval. You have full Student access while under review.";
    } else if (p.professorApprovalStatus === "REJECTED") {
      badge.className = "rounded-xl px-3 py-2 text-xs font-bold bg-rose-50 border border-rose-200 text-rose-800";
      badge.textContent = "Professor verification request was not approved. Contact Guru Ji Vision support if you are official faculty.";
    } else {
      badge.className = "hidden";
      badge.textContent = "";
    }
  }

  document.getElementById("linkFeedbackBox")?.classList.add("hidden");
  renderLinkedProvidersState(state.user);
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

function closeReaderModal() {
  document.getElementById("readerModal")?.classList.add("hidden");
}

function redirectAfterSignIn(profile) {
  if (state.route !== "home") return;
  if (state.facultyIdentity?.isAuthorizedProfessor) {
    navigateTo("professor");
  } else if (profile?.role === "FARMER") {
    navigateTo("farmer");
  } else if (profile?.role === "STUDENT") {
    navigateTo("student");
  }
}

async function handleGoogleSignIn(forceMethod = "") {
  clearAuthMessages();
  setGoogleBtnLoading(true);
  let redirecting = false;
  try {
    const res = await firebaseService.signInWithGoogle({ forceMethod });
    if (res.redirecting) {
      redirecting = true;
      showAuthInfo("Redirecting securely to Google Sign-In...");
      setAuthLoadingOverlay(true, "Opening Google Sign-In...", "Select your Google Account to enter Guru Ji Vision.");
      return;
    }
    if (res.ok && res.user) {
      state.justSignedInFromAuth = true;
      closeAuthModal();
    } else if (!res.inFlight) {
      showAuthError(
        res.error || "Google Sign-In could not be completed. Please try again.",
        Boolean(res.offerRedirectFallback)
      );
    }
  } finally {
    if (!redirecting) setGoogleBtnLoading(false);
  }
}

// ----------------------------------------------------------------------------
// FIREBASE LIVE PUBLIC & AUTH SUBSCRIPTIONS
// ----------------------------------------------------------------------------
function handleCollectionUpdate(key, data, isLivePublic = false) {
  if (isLivePublic) state.cloudConnected = true;

  if (key === "studyMaterials") {
    state.studyMaterials = data.length > 0 ? data : (state.isAdmin ? [] : [...FALLBACK_STUDY_MATERIALS]);
  } else if (key === "quizzes") {
    state.quizzes = data.length > 0 ? data : (state.isAdmin ? [] : [...FALLBACK_QUIZZES]);
  } else if (key === "careerOpportunities") {
    state.careerOpportunities = data.length > 0 ? data : (state.isAdmin ? [] : [...FALLBACK_CAREERS]);
  } else if (key === "announcements") {
    state.announcements = data.length > 0 ? data : [...FALLBACK_ANNOUNCEMENTS];
  } else if (key === "openingBalance") {
    state.openingBalance = Number(data) || 0;
    if (state.user) localStorage.setItem(openingBalanceKey(state.user.uid), String(state.openingBalance));
  } else {
    state[key] = data;
  }

  renderActiveView();
}

function handleRedirectOutcome(res) {
  if (!res) return;
  if (res.ok && res.user) {
    state.justSignedInFromAuth = true;
    closeAuthModal();
    if (!document.getElementById("profileModal")?.classList.contains("hidden")) {
      renderLinkedProvidersState(res.user);
      showLinkFeedback("Google Account linked successfully!", false);
    }
  } else if (!res.ok && res.error) {
    setAuthLoadingOverlay(false);
    openAuthModal();
    showAuthError(res.error, false);
    showToast(res.error, true);
  }
}

async function handleAuthStateChange(user) {
  state.authInitializing = false;

  if (!user) {
    setAuthLoadingOverlay(false);
    clearPrivateStateOnLogout();
    state.justSignedInFromAuth = false;
    // Re-subscribe public collections in guest mode so live public data stays connected
    firebaseService.subscribePublicCollections({
      isAdmin: false,
      isSuperAdmin: false,
      isAuthorizedMeetingHost: false,
      onUpdate: handleCollectionUpdate
    });
    renderActiveView();
    return;
  }

  state.user = user;
  state.openingBalance = loadOpeningBalanceForUid(user.uid);
  const [roles, profileResult] = await Promise.all([
    firebaseService.resolveUserRoles(user),
    firebaseService.ensureGoogleUserProfile(user, state.lang.toUpperCase())
  ]);

  state.isAdmin = roles.isAdmin;
  state.isSuperAdmin = roles.isSuperAdmin;
  state.facultyIdentity = roles.facultyIdentity;
  state.cloudConnected = true;

  const activeProfile = profileResult.profile;
  if (activeProfile) {
    state.userProfile = activeProfile;
    if (!state.moneyLedgerScope && activeProfile.role) {
      state.moneyLedgerScope = activeProfile.role === "FARMER" ? "FARMER" : "STUDENT";
    }
  }

  firebaseService.subscribeUserProfile(user.uid, (profile) => {
    state.userProfile = profile;
    if (!state.moneyLedgerScope && profile?.role) {
      state.moneyLedgerScope = profile.role === "FARMER" ? "FARMER" : "STUDENT";
    }
    if (profile?.language) {
      state.lang = profile.language === "BN" ? "bn" : "en";
      localStorage.setItem("gjv_lang", state.lang);
    }
    renderShellChrome();
    if (state.route === "home" || state.route === "money") renderActiveView();
  });

  firebaseService.subscribeEcosystemCollections({
    isAdmin: state.isAdmin,
    isSuperAdmin: state.isSuperAdmin,
    isAuthorizedMeetingHost: state.isAdmin || state.facultyIdentity.canHostMeetings,
    uid: user.uid,
    onUpdate: handleCollectionUpdate
  });

  farmerFinanceService.subscribeFarmerFinance(user.uid, (key, list) => {
    state.farmerFinance[key] = list;
    if (state.route === "farmer-finance") renderActiveView();
  });

  firebaseService.subscribeDoubtThreads({
    uid: user.uid,
    facultyIdentity: state.facultyIdentity,
    onStudentThreads: (threads) => {
      state.studentDoubtThreads = threads;
      recomputeUnreadDoubts();
      if (["career-guidance", "farmer-advisor", "doubt", "home"].includes(state.route)) renderActiveView();
      else renderShellChrome();
    },
    onProfessorThreads: (threads) => {
      state.professorDoubtThreads = threads;
      recomputeUnreadDoubts();
      if (["professor", "career-guidance", "doubt", "home"].includes(state.route)) renderActiveView();
      else renderShellChrome();
    }
  });

  if (state.isSuperAdmin) {
    firebaseService.subscribeOwnerTelemetry(true, (key, data) => {
      state[key] = data;
      if (state.route === "owner" || state.route === "admin") renderActiveView();
    });
  }

  closeAuthModal();
  setAuthLoadingOverlay(false);

  // One-click seamless dashboard entry (zero blocking registration forms)
  if (state.justSignedInFromAuth) {
    state.justSignedInFromAuth = false;
    const firstName = (activeProfile?.displayName || user.displayName || user.email || "Scholar").split(" ")[0];
    showToast(
      profileResult.isNewUser
        ? `Welcome to Guru Ji Vision, ${firstName}! You can customize your role anytime in Profile.`
        : `Welcome back, ${firstName}!`
    );
    if (state.route === "home") {
      redirectAfterSignIn(activeProfile);
      return;
    }
  }

  renderActiveView();
}

// ----------------------------------------------------------------------------
// OPEN PRIVATE CONSULTATION CHAT ROOM (Student Career / Farmer Advisor / Prof)
// ----------------------------------------------------------------------------
function openConsultationRoom({
  professor,
  studentId,
  studentName,
  studentSemester,
  asProfessor,
  serviceType = "STUDENT_CAREER",
  chatIdOverride = "",
  questionTitle = ""
}) {
  if (!state.user) {
    showToast("Sign in to start a private 1-on-1 consultation with your advisor.");
    openAuthModal();
    return;
  }
  const isFarmer = serviceType === "FARMER_ADVISOR";
  const chatId = chatIdOverride || (isFarmer
    ? `${buildDoubtChatId(professor.id, studentId)}__farmer`
    : buildDoubtChatId(professor.id, studentId));

  state.activeDoubtChat = {
    chatId,
    professor,
    studentId,
    studentName,
    studentSemester,
    asProfessor,
    serviceType,
    questionTitle
  };
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
    parts.push("No direct match found in current study notes or Wikipedia. Try searching a specific crop, disease, soil property, or ask our professors in Student Career Guidance / Farmer Advisor Expert!");
  }

  state.aiHistory.unshift({ question: q, answer: parts.join("\n"), sources });
  state.aiBusy = false;
  renderActiveView();
}

// ----------------------------------------------------------------------------
// GLOBAL EVENT DELEGATION
// ----------------------------------------------------------------------------
function bindGlobalEvents() {
  document.addEventListener("click", async (e) => {
    // Modal dark backdrop clicks
    if (e.target.id === "authModal") { closeAuthModal(); return; }
    if (e.target.id === "profileModal") { closeProfileModal(); return; }
    if (e.target.id === "readerModal") { closeReaderModal(); return; }

    // Inline form cancel buttons
    if (e.target.id === "fqCancelEdit") {
      document.getElementById("farmerQueryForm")?.reset();
      document.getElementById("fqEditId").value = "";
      document.getElementById("fqFormHeading").textContent = "Submit Crop Issue Query";
      state.pendingFarmerQueryImageBase64 = "";
      e.target.classList.add("hidden");
      renderActiveView();
      return;
    }
    if (e.target.id === "cpCancelEdit") {
      document.getElementById("communityPostForm")?.reset();
      document.getElementById("cpEditId").value = "";
      document.getElementById("cpFormHeading").textContent = "Start a Discussion / Ask Doubt";
      e.target.classList.add("hidden");
      return;
    }
    if (e.target.id === "cancelMoneyEditBtn") {
      document.getElementById("moneyTxForm")?.reset();
      document.getElementById("moneyEditId").value = "";
      document.getElementById("moneyTxFormHeading").textContent = state.moneyLedgerScope === "FARMER" ? "Add Farm Income / Expense" : "Add Income / Expense";
      e.target.classList.add("hidden");
      return;
    }
    if (e.target.id === "cancelGoalEditBtn") {
      document.getElementById("moneyGoalForm")?.reset();
      document.getElementById("goalEditId").value = "";
      document.getElementById("goalFormHeading").textContent = "Monthly Budgets & Savings Goals";
      e.target.classList.add("hidden");
      return;
    }
    if (e.target.id === "cancelMeetingEditBtn") {
      document.getElementById("meetingForm")?.reset();
      document.getElementById("meetingEditId").value = "";
      document.getElementById("meetingFormHeading").textContent = "Schedule Google Meet Session (Host Controls)";
      e.target.classList.add("hidden");
      return;
    }
    if (e.target.id === "amCancelEdit") {
      document.getElementById("adminMaterialForm")?.reset();
      document.getElementById("amEditId").value = "";
      document.getElementById("amFormTitle").textContent = "Add Study Material / PDF";
      e.target.classList.add("hidden");
      return;
    }
    if (e.target.id === "aqCancelEdit") {
      document.getElementById("adminQuizForm")?.reset();
      document.getElementById("aqEditId").value = "";
      document.getElementById("aqFormTitle").textContent = "Add MCQ Question";
      e.target.classList.add("hidden");
      return;
    }
    if (e.target.id === "anCancelEdit") {
      document.getElementById("adminNoticeForm")?.reset();
      document.getElementById("anEditId").value = "";
      document.getElementById("anFormTitle").textContent = "Publish Notice";
      e.target.classList.add("hidden");
      return;
    }
    if (e.target.id === "ampCancelEdit") {
      document.getElementById("adminMarketPriceForm")?.reset();
      document.getElementById("ampEditId").value = "";
      document.getElementById("ampFormTitle").textContent = "Publish Verified Mandi Price";
      e.target.classList.add("hidden");
      return;
    }
    if (e.target.id === "acCancelEdit") {
      document.getElementById("adminCareerForm")?.reset();
      document.getElementById("acEditId").value = "";
      document.getElementById("acFormTitle").textContent = "Add Job / Internship / Scholarship";
      e.target.classList.add("hidden");
      return;
    }
    if (e.target.id === "apCancelEdit") {
      document.getElementById("adminProfForm")?.reset();
      document.getElementById("apId").value = "";
      document.getElementById("apFormTitle").textContent = "Add / Edit Faculty Advisor";
      e.target.classList.add("hidden");
      return;
    }

    const selector = [
      "[data-nav]", "[data-action]",
      "[data-weather-quick]", "[data-weather-pick]", "[data-market-quick-crop]", "[data-market-quick-mandi]",
      "[data-student-sub]", "[data-student-sem]", "[data-student-cat]", "[data-student-jump-sem]", "[data-read-material]", "[data-quiz-q]",
      "[data-load-crop-tool]", "[data-apply-crop-preset]", "[data-edit-fq]", "[data-del-fq]",
      "[data-ai-prompt]",
      "[data-comm-sub]", "[data-comm-topic]", "[data-career-cat]", "[data-upvote-post]", "[data-report-post]", "[data-edit-post]", "[data-del-post]",
      "[data-money-scope]", "[data-money-type]", "[data-money-filter]", "[data-edit-tx]", "[data-del-tx]", "[data-edit-goal]", "[data-del-goal]",
      "[data-edit-meeting]", "[data-del-meeting]",
      "[data-start-career-prof]", "[data-open-student-thread]", "[data-open-prof-thread]", "[data-prof-filter]", "[data-pick-fa-topic]", "[data-del-doubt-msg]", "[data-retry-email]",
      "[data-admin-sub]", "[data-edit-mat]", "[data-del-mat]", "[data-edit-quiz]", "[data-del-quiz]", "[data-edit-notice]", "[data-del-notice]",
      "[data-edit-mp]", "[data-del-mp]", "[data-edit-career]", "[data-del-career]", "[data-edit-prof]", "[data-del-prof]",
      "[data-approve-prof]", "[data-reject-prof]",
      "[data-mod-post]", "[data-del-admin]", "[data-resolve-report]", "[data-resolve-error]"
    ].join(", ");

    const target = e.target.closest(selector);
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
        case "close-reader": closeReaderModal(); return;
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
            showToast("Signed out safely. Private financial & chat data cleared.");
            renderActiveView();
          }
          return;
        case "google-signin":
          await handleGoogleSignIn("");
          return;
        case "google-signin-redirect":
          await handleGoogleSignIn("redirect");
          return;
        case "link-google": {
          const btn = document.getElementById("linkGoogleBtn");
          if (btn) { btn.disabled = true; btn.textContent = "Linking..."; }
          let redirecting = false;
          try {
            const res = await firebaseService.linkGoogleAccount();
            if (res.redirecting) {
              redirecting = true;
              showLinkFeedback("Redirecting to Google to complete account linking...", false);
              return;
            }
            if (res.ok && res.user) {
              renderLinkedProvidersState(res.user);
              showLinkFeedback("Google Account linked to this account! All your data remains unified.", false);
              showToast("Google Account linked successfully!");
            } else {
              showLinkFeedback(res.error || "Could not link Google Account.", true);
            }
          } finally {
            if (!redirecting && btn) {
              btn.disabled = false;
              btn.textContent = "Link Google (Gmail)";
            }
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
        case "apply-sw-update":
          if (state.waitingServiceWorker) {
            state.waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
          } else {
            window.location.reload();
          }
          return;
        case "weather-gps":
          if (!navigator.geolocation) {
            showToast("GPS geolocation is not supported on this browser. Search your town or PIN code instead.", true);
            return;
          }
          state.weatherLoading = true;
          state.weatherError = "";
          renderActiveView();
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              loadWeatherForLocation({
                name: "My Current Location",
                admin1: `${pos.coords.latitude.toFixed(2)}°N, ${pos.coords.longitude.toFixed(2)}°E`,
                country: "",
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
              });
            },
            () => {
              state.weatherLoading = false;
              state.weatherError = "Location permission was denied. Please search your village, district, or 6-digit Indian PIN code above.";
              renderActiveView();
            },
            { enableHighAccuracy: false, timeout: 10000 }
          );
          return;
        case "weather-refresh":
          loadWeatherForLocation(state.weatherLastLocation || QUICK_WEATHER_LOCATIONS[0]);
          return;
        case "refresh-mandi":
          loadOfficialMandiData(true);
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
          const val = Math.max(0, parseFloat(document.getElementById("openingBalanceInput")?.value) || 0);
          try {
            await firebaseService.saveOpeningBalance(state.user.uid, val);
            state.openingBalance = val;
            localStorage.setItem(openingBalanceKey(state.user.uid), String(val));
            showToast("Opening balance synced privately to your Firebase account.");
            renderActiveView();
          } catch (err) {
            showToast(err.message || "Failed to save opening balance.", true);
          }
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
        case "clear-career-image":
          state.pendingCareerImageBase64 = "";
          renderActiveView();
          return;
        case "clear-fa-image":
          state.pendingFarmerAdvisorImageBase64 = "";
          renderActiveView();
          return;
        case "clear-fq-image":
          state.pendingFarmerQueryImageBase64 = "";
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
            ["Verified Market Prices", state.firestoreMarketPrices.length],
            ["Exam Completions", state.ownerExamStats.length],
            ["Farmer Queries", state.farmerQueries.length],
            ["Community Posts", state.communityPosts.length],
            ["Privacy Notice", "Private Money Manager & 1-on-1 Consultations strictly excluded"]
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

    // Weather interactions
    if (target.dataset.weatherQuick !== undefined) {
      const loc = QUICK_WEATHER_LOCATIONS[parseInt(target.dataset.weatherQuick, 10)];
      if (loc) loadWeatherForLocation(loc);
      return;
    }
    if (target.dataset.weatherPick !== undefined) {
      const loc = state.weatherSearchResults[parseInt(target.dataset.weatherPick, 10)];
      if (loc) loadWeatherForLocation(loc);
      return;
    }

    // Market price quick crop chip & verified mandi chip
    if (target.dataset.marketQuickCrop !== undefined) {
      state.marketSearchCrop = target.dataset.marketQuickCrop;
      renderActiveView();
      return;
    }
    if (target.dataset.marketQuickMandi !== undefined) {
      const mVal = target.dataset.marketQuickMandi;
      state.marketFilterMandi = state.marketFilterMandi === mVal ? "ALL" : mVal;
      renderActiveView();
      return;
    }

    // Student Hub interactions
    if (target.dataset.studentSub) { state.studentSubTab = target.dataset.studentSub; renderActiveView(); return; }
    if (target.dataset.studentSem !== undefined) { state.studentSemester = parseInt(target.dataset.studentSem, 10) || 0; state.quizSubmitted = false; renderActiveView(); return; }
    if (target.dataset.studentCat) { state.studentCategory = target.dataset.studentCat; renderActiveView(); return; }
    if (target.dataset.studentJumpSem) { state.studentSemester = parseInt(target.dataset.studentJumpSem, 10) || 0; state.studentSubTab = "materials"; renderActiveView(); return; }
    if (target.dataset.readMaterial) { openMaterialReader(target.dataset.readMaterial); return; }
    if (target.dataset.quizQ) { state.quizAnswers[target.dataset.quizQ] = parseInt(target.dataset.quizOpt, 10); renderActiveView(); return; }

    // Farmer Help & Agri Tools presets
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
    if (target.dataset.editFq) {
      const fq = state.farmerQueries.find((x) => x.id === target.dataset.editFq);
      if (fq) {
        document.getElementById("fqEditId").value = fq.id;
        document.getElementById("fqCrop").value = fq.cropName || "";
        document.getElementById("fqCategory").value = fq.category || "DISEASE";
        document.getElementById("fqDistrict").value = fq.district || "";
        document.getElementById("fqDesc").value = fq.description || "";
        document.getElementById("fqFormHeading").textContent = "Edit Crop Issue Query";
        document.getElementById("fqCancelEdit")?.classList.remove("hidden");
        document.getElementById("farmerQueryForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    if (target.dataset.delFq) {
      if (!confirm("Delete this crop query?")) return;
      try {
        await firebaseService.deleteFarmerQuery(target.dataset.delFq);
        showToast("Farmer query deleted.");
      } catch (err) {
        showToast(err.message || "Failed to delete query.", true);
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
    if (target.dataset.editPost) {
      const p = state.communityPosts.find((x) => x.id === target.dataset.editPost);
      if (p) {
        document.getElementById("cpEditId").value = p.id;
        document.getElementById("cpTopic").value = p.topic || "DOUBT";
        document.getElementById("cpGroup").value = p.collegeGroup || "";
        document.getElementById("cpTitle").value = p.title || "";
        document.getElementById("cpBody").value = p.body || "";
        document.getElementById("cpFormHeading").textContent = "Edit Community Post";
        document.getElementById("cpCancelEdit")?.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (target.dataset.delPost) {
      if (!confirm("Delete this community post?")) return;
      try {
        await firebaseService.deleteCommunityPost(target.dataset.delPost);
        showToast("Post deleted.");
      } catch (err) {
        showToast(err.message || "Failed to delete post.", true);
      }
      return;
    }

    // Money & Farm Manager (Owner-Only — Full Edit & Delete)
    if (target.dataset.moneyScope) {
      state.moneyLedgerScope = target.dataset.moneyScope;
      state.moneyFilter = "ALL";
      renderActiveView();
      return;
    }
    if (target.dataset.moneyType) { state.moneyFormType = target.dataset.moneyType; renderActiveView(); return; }
    if (target.dataset.moneyFilter) { state.moneyFilter = target.dataset.moneyFilter; renderActiveView(); return; }
    if (target.dataset.editTx) {
      const tx = state.moneyTransactions.find((x) => x.id === target.dataset.editTx);
      if (tx) {
        state.moneyFormType = tx.type === "INCOME" ? "INCOME" : "EXPENSE";
        state.moneyLedgerScope = tx.ledgerScope || "STUDENT";
        renderActiveView();
        document.getElementById("moneyEditId").value = tx.id;
        document.getElementById("moneyTitle").value = tx.title || "";
        document.getElementById("moneyAmount").value = String(tx.amount || "");
        document.getElementById("moneyDate").value = tx.dateLabel || new Date().toISOString().slice(0, 10);
        const catSel = document.getElementById("moneyCategory");
        if (catSel) catSel.value = tx.category || "OTHER";
        const sw = document.getElementById("moneySharedWith");
        if (sw) sw.value = tx.sharedWith || "";
        const ct = document.getElementById("moneyCropTag");
        if (ct) ct.value = tx.cropTag || "";
        document.getElementById("moneyNote").value = tx.note || "";
        document.getElementById("moneyTxFormHeading").textContent = "Edit Private Entry";
        document.getElementById("cancelMoneyEditBtn")?.classList.remove("hidden");
        document.getElementById("moneyTxForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    if (target.dataset.delTx) {
      if (!state.user || !confirm("Delete this financial transaction?")) return;
      try {
        await firebaseService.deleteMoneyTransaction(state.user.uid, target.dataset.delTx);
        showToast("Transaction deleted.");
      } catch (err) {
        showToast(err.message || "Delete failed.", true);
      }
      return;
    }
    if (target.dataset.editGoal) {
      const g = state.moneyBudgets.find((x) => x.id === target.dataset.editGoal);
      if (g) {
        document.getElementById("goalEditId").value = g.id;
        document.getElementById("goalName").value = g.name || "";
        document.getElementById("goalKind").value = g.kind || "MONTHLY_BUDGET";
        document.getElementById("goalMonth").value = g.monthKey || new Date().toISOString().slice(0, 7);
        document.getElementById("goalTarget").value = String(g.targetAmount || "");
        document.getElementById("goalSaved").value = String(g.savedAmount || 0);
        document.getElementById("goalFormHeading").textContent = "Edit Budget / Savings Goal";
        document.getElementById("cancelGoalEditBtn")?.classList.remove("hidden");
        document.getElementById("moneyGoalForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    if (target.dataset.delGoal) {
      if (!state.user || !confirm("Delete this budget/goal?")) return;
      try {
        await firebaseService.deleteFinancialGoal(state.user.uid, target.dataset.delGoal);
        showToast("Budget/goal deleted.");
      } catch (err) {
        showToast(err.message || "Delete failed.", true);
      }
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
      try {
        await firebaseService.deleteMeeting(target.dataset.delMeeting);
        showToast("Meeting deleted.");
      } catch (err) {
        showToast(err.message || "Delete failed.", true);
      }
      return;
    }

    // Career Guidance / Farmer Advisor / Professor Dashboard
    if (target.dataset.profFilter) { state.profInboxFilter = target.dataset.profFilter; renderActiveView(); return; }
    if (target.dataset.pickFaTopic) { state.selectedFarmerTopic = target.dataset.pickFaTopic; renderActiveView(); return; }
    if (target.dataset.startCareerProf) {
      const prof = state.professors.find((p) => p.id === target.dataset.startCareerProf);
      if (prof) {
        state.selectedCareerProfId = prof.id;
        openConsultationRoom({
          professor: prof,
          studentId: state.user?.uid || "",
          studentName: state.userProfile?.displayName || state.user?.displayName || "Student",
          studentSemester: state.userProfile?.semester || 1,
          asProfessor: false,
          serviceType: "STUDENT_CAREER"
        });
      }
      return;
    }
    if (target.dataset.openStudentThread) {
      const th = state.studentDoubtThreads.find((t) => t.id === target.dataset.openStudentThread);
      if (th) {
        const prof = state.professors.find((p) => p.id === th.professorId) || { id: th.professorId, name: th.professorName, email: th.professorEmail || "" };
        openConsultationRoom({
          professor: prof,
          studentId: th.studentId,
          studentName: th.studentName,
          studentSemester: th.studentSemester,
          asProfessor: false,
          serviceType: th.serviceType || "STUDENT_CAREER",
          chatIdOverride: th.id,
          questionTitle: th.questionTitle || ""
        });
      }
      return;
    }
    if (target.dataset.openProfThread) {
      const th = state.professorDoubtThreads.find((t) => t.id === target.dataset.openProfThread);
      if (th) {
        const prof = state.professors.find((p) => p.id === th.professorId) || { id: th.professorId, name: th.professorName, email: th.professorEmail || "" };
        openConsultationRoom({
          professor: prof,
          studentId: th.studentId,
          studentName: th.studentName,
          studentSemester: th.studentSemester,
          asProfessor: true,
          serviceType: th.serviceType || "STUDENT_CAREER",
          chatIdOverride: th.id,
          questionTitle: th.questionTitle || ""
        });
      }
      return;
    }
    if (target.dataset.retryEmail && state.activeDoubtChat) {
      const msg = state.activeDoubtMessages.find((m) => m.id === target.dataset.retryEmail);
      const chat = state.activeDoubtChat;
      if (msg && chat) {
        showToast("Retrying direct email delivery to assigned professor...");
        const res = await firebaseService.triggerProfessorEmailDelivery({
          chatId: chat.chatId,
          messageId: msg.id,
          professorId: chat.professor.id,
          serviceType: chat.serviceType,
          senderName: msg.senderName || chat.studentName,
          questionTitle: msg.questionTitle || chat.questionTitle || "",
          questionCategory: msg.questionCategory || "",
          questionText: msg.text || "",
          hasAttachment: Boolean(msg.hasImage)
        });
        showToast(res.ok ? "Email sent to assigned professor!" : (res.error || "Email delivery failed; question remains saved in-app."), !res.ok);
      }
      return;
    }
    if (target.dataset.delDoubtMsg && state.activeDoubtChat) {
      if (!confirm("Delete your message?")) return;
      try {
        await firebaseService.deleteOwnDoubtMessage(state.activeDoubtChat.chatId, target.dataset.delDoubtMsg);
        showToast("Message deleted.");
      } catch (err) {
        showToast(err.message || "Delete failed.", true);
      }
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
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (target.dataset.delMat) {
      if (!confirm("Delete this study material?")) return;
      try {
        await firebaseService.deleteStudyMaterial(target.dataset.delMat);
        showToast("Material deleted.");
      } catch (err) { showToast(err.message, true); }
      return;
    }
    if (target.dataset.editQuiz) {
      const q = state.quizzes.find((x) => x.id === target.dataset.editQuiz);
      if (q) {
        document.getElementById("aqEditId").value = q.id;
        document.getElementById("aqTitle").value = q.title || "";
        document.getElementById("aqSem").value = String(q.semester || 1);
        document.getElementById("aqSubject").value = q.subject || "";
        document.getElementById("aqQuestion").value = q.questionText || "";
        [0, 1, 2, 3].forEach((i) => {
          document.getElementById(`aqOpt${i}`).value = q.options?.[i] || "";
        });
        document.getElementById("aqCorrect").value = String(q.correctIndex ?? 0);
        document.getElementById("aqExplanation").value = q.explanation || "";
        document.getElementById("aqFormTitle").textContent = "Edit MCQ Question";
        document.getElementById("aqCancelEdit")?.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (target.dataset.delQuiz) {
      if (!confirm("Delete this MCQ question?")) return;
      try {
        await firebaseService.deleteQuizQuestion(target.dataset.delQuiz);
        showToast("Quiz deleted.");
      } catch (err) { showToast(err.message, true); }
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
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (target.dataset.delNotice) {
      if (!confirm("Delete this notice?")) return;
      try {
        await firebaseService.deleteAnnouncement(target.dataset.delNotice);
        showToast("Notice deleted.");
      } catch (err) { showToast(err.message, true); }
      return;
    }
    if (target.dataset.editMp) {
      const r = state.firestoreMarketPrices.find((x) => x.id === target.dataset.editMp);
      if (r) {
        document.getElementById("ampEditId").value = r.id;
        document.getElementById("ampCrop").value = r.cropName || "";
        document.getElementById("ampCropBn").value = r.cropNameBn || "";
        document.getElementById("ampState").value = r.state || "West Bengal";
        document.getElementById("ampDistrict").value = r.district || "";
        document.getElementById("ampMarket").value = r.marketName || "";
        document.getElementById("ampUnit").value = r.unit || "₹ / Quintal";
        document.getElementById("ampMin").value = String(r.minPrice ?? "");
        document.getElementById("ampModal").value = String(r.modalPrice ?? "");
        document.getElementById("ampMax").value = String(r.maxPrice ?? "");
        document.getElementById("ampDate").value = r.reportDate || new Date().toISOString().slice(0, 10);
        document.getElementById("ampSource").value = r.sourceName || "";
        document.getElementById("ampSourceUrl").value = r.sourceUrl || "";
        document.getElementById("ampPublished").checked = r.published !== false;
        document.getElementById("ampFormTitle").textContent = "Edit Verified Mandi Price";
        document.getElementById("ampCancelEdit")?.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (target.dataset.delMp) {
      if (!confirm("Delete this verified market price entry?")) return;
      try {
        await firebaseService.deleteMarketPriceAsAdmin(target.dataset.delMp);
        showToast("Market price deleted.");
      } catch (err) { showToast(err.message, true); }
      return;
    }
    if (target.dataset.editCareer) {
      const c = state.careerOpportunities.find((x) => x.id === target.dataset.editCareer);
      if (c) {
        document.getElementById("acEditId").value = c.id;
        document.getElementById("acTitle").value = c.title || "";
        document.getElementById("acOrg").value = c.organization || "";
        document.getElementById("acCategory").value = c.category || "GOVT_JOB";
        document.getElementById("acDeadline").value = c.deadline || "";
        document.getElementById("acEligibility").value = c.eligibility || "";
        document.getElementById("acUrl").value = c.applyUrl || "";
        document.getElementById("acDesc").value = c.description || "";
        document.getElementById("acFormTitle").textContent = "Edit Career Opportunity";
        document.getElementById("acCancelEdit")?.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (target.dataset.delCareer) {
      if (!confirm("Delete this career opportunity?")) return;
      try {
        await firebaseService.deleteCareerOpportunity(target.dataset.delCareer);
        showToast("Opportunity deleted.");
      } catch (err) { showToast(err.message, true); }
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
        document.getElementById("apFormTitle").textContent = `Edit Advisor: ${p.name}`;
        document.getElementById("apCancelEdit")?.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (target.dataset.delProf) {
      if (!confirm("Delete this professor from Firestore?")) return;
      try {
        await firebaseService.deleteProfessorAsAdmin(target.dataset.delProf);
        showToast("Advisor removed from Firestore.");
      } catch (err) { showToast(err.message, true); }
      return;
    }
    if (target.dataset.approveProf && state.user && state.isSuperAdmin) {
      const applicant = (state.ownerUsers || []).find((u) => u.id === target.dataset.approveProf);
      if (!applicant) {
        showToast("Applicant profile not loaded yet.", true);
        return;
      }
      if (!confirm(`Approve ${applicant.displayName || "this applicant"} as an authorized Professor?`)) return;
      try {
        await firebaseService.approveProfessorRequest(state.user.uid, applicant);
        showToast(`${applicant.displayName || "Applicant"} approved as Professor and added to faculty directory!`);
      } catch (err) { showToast(err.message || "Failed to approve professor request.", true); }
      return;
    }
    if (target.dataset.rejectProf && state.user && state.isSuperAdmin) {
      if (!confirm("Reject this Professor verification request?")) return;
      try {
        await firebaseService.rejectProfessorRequest(target.dataset.rejectProf);
        showToast("Professor request marked as rejected.");
      } catch (err) { showToast(err.message || "Failed to reject request.", true); }
      return;
    }
    if (target.dataset.modPost) {
      try {
        await firebaseService.moderateCommunityPost(target.dataset.modPost, target.dataset.modStatus);
        showToast("Post moderation updated.");
      } catch (err) { showToast(err.message, true); }
      return;
    }
    if (target.dataset.delAdmin) {
      if (!confirm("Remove this admin role?")) return;
      try {
        await firebaseService.removeAdminRole(target.dataset.delAdmin);
        showToast("Admin role removed.");
      } catch (err) { showToast(err.message, true); }
      return;
    }
    if (target.dataset.resolveReport) {
      try {
        await firebaseService.updateContentReportStatus(target.dataset.resolveReport, target.dataset.reportStatus);
        showToast("Content report updated.");
      } catch (err) { showToast(err.message, true); }
      return;
    }
    if (target.dataset.resolveError) {
      try {
        await firebaseService.resolveErrorLog(target.dataset.resolveError);
        showToast("Error marked resolved.");
      } catch (err) { showToast(err.message, true); }
      return;
    }
  });

  // Escape closes modals & drawer
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAuthModal();
      closeProfileModal();
      closeReaderModal();
      closeDrawer();
    }
  });

  // Live Input Delegation
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
    } else if (id === "marketCropSearch") {
      state.marketSearchCrop = e.target.value;
      renderActiveView();
      const el = document.getElementById("marketCropSearch");
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

  // Change Delegation (Select filters + Image/PDF Uploads)
  document.addEventListener("change", async (e) => {
    const id = e.target.id;
    if (id === "marketStateSelect") {
      state.marketFilterState = e.target.value;
      state.marketFilterDistrict = "ALL";
      state.marketFilterMandi = "ALL";
      renderActiveView();
      return;
    }
    if (id === "marketDistrictSelect") {
      state.marketFilterDistrict = e.target.value;
      state.marketFilterMandi = "ALL";
      renderActiveView();
      return;
    }
    if (id === "marketMandiSelect") {
      state.marketFilterMandi = e.target.value;
      renderActiveView();
      return;
    }
    if (id === "doubtImageFile" && e.target.files?.[0]) {
      try {
        state.pendingDoubtImageBase64 = await compressImageFileToBase64(e.target.files[0]);
        renderActiveView();
      } catch (err) { showToast(err.message, true); }
      return;
    }
    if (id === "cgImageFile" && e.target.files?.[0]) {
      try {
        state.pendingCareerImageBase64 = await compressImageFileToBase64(e.target.files[0]);
        renderActiveView();
      } catch (err) { showToast(err.message, true); }
      return;
    }
    if (id === "faImageFile" && e.target.files?.[0]) {
      try {
        state.pendingFarmerAdvisorImageBase64 = await compressImageFileToBase64(e.target.files[0]);
        renderActiveView();
      } catch (err) { showToast(err.message, true); }
      return;
    }
    if (id === "fqImageFile" && e.target.files?.[0]) {
      try {
        state.pendingFarmerQueryImageBase64 = await compressImageFileToBase64(e.target.files[0]);
        renderActiveView();
      } catch (err) { showToast(err.message, true); }
      return;
    }
    if (id === "amPdfUpload" && e.target.files?.[0]) {
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

  // Form Submission Delegation (with Busy Guard + Honest Firebase Confirmation)
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    e.preventDefault();

    try {
      // Weather Search (Village, Town, District, or 6-digit Indian PIN)
      if (form.id === "weatherSearchForm") {
        const q = document.getElementById("weatherLocationQuery")?.value?.trim() || "";
        state.weatherQuery = q;
        if (!q) return;
        state.weatherLoading = true;
        state.weatherError = "";
        state.weatherSearchResults = [];
        renderActiveView();

        const res = await searchWeatherLocations(q);
        state.weatherLoading = false;
        if (!res.ok) {
          state.weatherError = res.error;
          renderActiveView();
        } else if (res.results.length === 1) {
          await loadWeatherForLocation(res.results[0]);
        } else {
          state.weatherSearchResults = res.results;
          renderActiveView();
        }
        return;
      }

      // AI Guru
      if (form.id === "aiGuruForm") {
        await runAiGuruSearch(document.getElementById("aiGuruInput").value);
        return;
      }

      // Farmer Query (Create & Edit + Photo)
      if (form.id === "farmerQueryForm" && state.user) {
        await withBusySubmit(form, async () => {
          const editId = document.getElementById("fqEditId")?.value || "";
          await firebaseService.createFarmerQuery(
            state.user.uid,
            state.userProfile?.displayName || state.user.displayName || "Farmer",
            {
              cropName: document.getElementById("fqCrop").value,
              category: document.getElementById("fqCategory").value,
              district: document.getElementById("fqDistrict").value,
              description: document.getElementById("fqDesc").value,
              imageBase64: state.pendingFarmerQueryImageBase64
            },
            editId
          );
          form.reset();
          document.getElementById("fqEditId").value = "";
          state.pendingFarmerQueryImageBase64 = "";
          showToast(editId ? "Farmer query updated!" : "Farmer query submitted to Guru Ji Vision Desk!");
        });
        return;
      }

      // Community Post (Create & Edit)
      if (form.id === "communityPostForm" && state.user) {
        await withBusySubmit(form, async () => {
          const editId = document.getElementById("cpEditId")?.value || "";
          await firebaseService.saveCommunityPost(
            state.user.uid,
            state.userProfile?.displayName || state.user.displayName || "Student",
            {
              topic: document.getElementById("cpTopic").value,
              collegeGroup: document.getElementById("cpGroup").value,
              title: document.getElementById("cpTitle").value,
              body: document.getElementById("cpBody").value
            },
            editId
          );
          form.reset();
          document.getElementById("cpEditId").value = "";
          showToast(editId ? "Community post updated!" : "Community post published!");
        });
        return;
      }

      // Private Money Transaction (Student & Farmer — Owner-Only, No Admin Approval)
      if (form.id === "moneyTxForm" && state.user) {
        await withBusySubmit(form, async () => {
          const editId = document.getElementById("moneyEditId")?.value || "";
          const scope = state.moneyLedgerScope || (state.userProfile?.role === "FARMER" ? "FARMER" : "STUDENT");
          await firebaseService.saveMoneyTransaction(
            state.user.uid,
            {
              title: document.getElementById("moneyTitle").value,
              amount: document.getElementById("moneyAmount").value,
              type: state.moneyFormType,
              category: document.getElementById("moneyCategory").value,
              ledgerScope: scope,
              dateLabel: document.getElementById("moneyDate").value,
              sharedWith: document.getElementById("moneySharedWith")?.value || "",
              cropTag: document.getElementById("moneyCropTag")?.value || "",
              note: document.getElementById("moneyNote").value
            },
            editId
          );
          form.reset();
          document.getElementById("moneyEditId").value = "";
          showToast(editId ? "Private financial entry updated!" : "Private entry saved directly to your account.");
        });
        return;
      }

      // Private Financial Goal (Create & Edit)
      if (form.id === "moneyGoalForm" && state.user) {
        await withBusySubmit(form, async () => {
          const editId = document.getElementById("goalEditId")?.value || "";
          await firebaseService.saveFinancialGoal(
            state.user.uid,
            {
              name: document.getElementById("goalName").value,
              kind: document.getElementById("goalKind").value,
              monthKey: document.getElementById("goalMonth").value,
              targetAmount: document.getElementById("goalTarget").value,
              savedAmount: document.getElementById("goalSaved").value
            },
            editId
          );
          form.reset();
          document.getElementById("goalEditId").value = "";
          showToast(editId ? "Budget / goal updated!" : "Budget / savings goal saved!");
        });
        return;
      }

      // Meeting Form
      if (form.id === "meetingForm" && state.user) {
        await withBusySubmit(form, async () => {
          const editId = document.getElementById("meetingEditId")?.value || "";
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
            editId
          );
          form.reset();
          document.getElementById("meetingEditId").value = "";
          showToast("Google Meet session saved!");
        });
        return;
      }

      // Student Career Guidance Structured Question -> Firestore + Direct Email Delivery
      if (form.id === "careerGuidanceForm" && state.user) {
        await withBusySubmit(form, async () => {
          const profId = document.getElementById("cgProfSelect").value;
          const prof = state.professors.find((p) => p.id === profId);
          if (!prof) throw new Error("Select a valid professor.");
          const title = document.getElementById("cgTitle").value.trim();
          const category = document.getElementById("cgCategory").value;
          const text = document.getElementById("cgMessage").value.trim();
          const consent = document.getElementById("cgContactConsent")?.checked;
          const contactInfo = consent ? (document.getElementById("cgContactInfo")?.value || "").trim() : "";
          const studentName = state.userProfile?.displayName || state.user.displayName || "Student";
          const sem = state.userProfile?.semester || 1;
          const img = state.pendingCareerImageBase64;

          const sent = await firebaseService.sendDoubtMessage({
            uid: state.user.uid,
            professor: prof,
            studentId: state.user.uid,
            studentName,
            studentSemester: sem,
            senderRole: "STUDENT",
            senderName: studentName,
            text,
            imageBase64: img,
            serviceType: "STUDENT_CAREER",
            questionTitle: title,
            questionCategory: category,
            contactInfo
          });

          state.pendingCareerImageBase64 = "";
          form.reset();

          if (sent.hasConfiguredProfessorEmail) {
            const emailRes = await firebaseService.triggerProfessorEmailDelivery({
              chatId: sent.chatId,
              messageId: sent.messageId,
              professorId: prof.id,
              serviceType: "STUDENT_CAREER",
              senderName: studentName,
              contactInfo,
              questionTitle: title,
              questionCategory: category,
              questionText: text,
              hasAttachment: Boolean(img)
            });
            showToast(emailRes.ok
              ? `Question saved & emailed directly to ${prof.name}!`
              : `Question saved for ${prof.name}! (${emailRes.status}: ${emailRes.error || "visible in Professor Dashboard"})`
            );
          } else {
            showToast(`Question saved to ${prof.name}'s Professor Dashboard!`);
          }

          openConsultationRoom({
            professor: prof,
            studentId: state.user.uid,
            studentName,
            studentSemester: sem,
            asProfessor: false,
            serviceType: "STUDENT_CAREER",
            chatIdOverride: sent.chatId,
            questionTitle: title
          });
        });
        return;
      }

      // Farmer Advisor Expert Structured Question -> Firestore + Direct Email Delivery
      if (form.id === "farmerAdvisorForm" && state.user) {
        await withBusySubmit(form, async () => {
          const profId = document.getElementById("faProfSelect").value;
          const prof = state.professors.find((p) => p.id === profId);
          if (!prof) throw new Error("Select a valid agricultural expert.");
          const title = document.getElementById("faTitle").value.trim();
          const category = document.getElementById("faCategory").value;
          const text = document.getElementById("faMessage").value.trim();
          const consent = document.getElementById("faContactConsent")?.checked;
          const contactInfo = consent ? (document.getElementById("faContactInfo")?.value || "").trim() : "";
          const farmerName = state.userProfile?.displayName || state.user.displayName || "Farmer";
          const img = state.pendingFarmerAdvisorImageBase64;

          const sent = await firebaseService.sendDoubtMessage({
            uid: state.user.uid,
            professor: prof,
            studentId: state.user.uid,
            studentName: farmerName,
            studentSemester: 0,
            senderRole: "STUDENT",
            senderName: farmerName,
            text,
            imageBase64: img,
            serviceType: "FARMER_ADVISOR",
            questionTitle: title,
            questionCategory: category,
            contactInfo
          });

          state.pendingFarmerAdvisorImageBase64 = "";
          form.reset();

          if (sent.hasConfiguredProfessorEmail) {
            const emailRes = await firebaseService.triggerProfessorEmailDelivery({
              chatId: sent.chatId,
              messageId: sent.messageId,
              professorId: prof.id,
              serviceType: "FARMER_ADVISOR",
              senderName: farmerName,
              contactInfo,
              questionTitle: title,
              questionCategory: category,
              questionText: text,
              hasAttachment: Boolean(img)
            });
            showToast(emailRes.ok
              ? `Crop question saved & emailed directly to ${prof.name}!`
              : `Crop question saved for ${prof.name}! (${emailRes.status}: visible in Professor Dashboard)`
            );
          } else {
            showToast(`Crop question saved to ${prof.name}'s Professor Dashboard!`);
          }

          openConsultationRoom({
            professor: prof,
            studentId: state.user.uid,
            studentName: farmerName,
            studentSemester: 0,
            asProfessor: false,
            serviceType: "FARMER_ADVISOR",
            chatIdOverride: sent.chatId,
            questionTitle: title
          });
        });
        return;
      }

      // In-Room 1-on-1 Consultation Message Composer
      if (form.id === "doubtComposerForm" && state.user && state.activeDoubtChat) {
        await withBusySubmit(form, async () => {
          const chat = state.activeDoubtChat;
          const input = document.getElementById("doubtMessageInput");
          const text = input.value;
          const img = state.pendingDoubtImageBase64;
          const sent = await firebaseService.sendDoubtMessage({
            uid: state.user.uid,
            professor: chat.professor,
            studentId: chat.studentId,
            studentName: chat.studentName,
            studentSemester: chat.studentSemester,
            senderRole: chat.asProfessor ? "PROFESSOR" : "STUDENT",
            senderName: chat.asProfessor ? chat.professor.name : chat.studentName,
            text,
            imageBase64: img,
            serviceType: chat.serviceType || "STUDENT_CAREER",
            chatIdOverride: chat.chatId
          });
          input.value = "";
          state.pendingDoubtImageBase64 = "";

          if (!chat.asProfessor && sent.hasConfiguredProfessorEmail) {
            firebaseService.triggerProfessorEmailDelivery({
              chatId: sent.chatId,
              messageId: sent.messageId,
              professorId: chat.professor.id,
              serviceType: chat.serviceType || "STUDENT_CAREER",
              senderName: chat.studentName,
              questionTitle: chat.questionTitle || "",
              questionText: text,
              hasAttachment: Boolean(img)
            });
          }
          renderActiveView();
        });
        return;
      }

      // Admin Study Material
      if (form.id === "adminMaterialForm" && state.user) {
        await withBusySubmit(form, async () => {
          const editId = document.getElementById("amEditId").value;
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
            editId
          );
          form.reset();
          document.getElementById("amEditId").value = "";
          showToast(editId ? "Study material updated live!" : "Study material saved live to Firestore!");
        });
        return;
      }

      // Admin Quiz (Create & Edit)
      if (form.id === "adminQuizForm" && state.user) {
        await withBusySubmit(form, async () => {
          const editId = document.getElementById("aqEditId")?.value || "";
          await firebaseService.saveQuizQuestion(
            state.user.uid,
            {
              title: document.getElementById("aqTitle").value,
              semester: document.getElementById("aqSem").value,
              subject: document.getElementById("aqSubject").value,
              questionText: document.getElementById("aqQuestion").value,
              options: [0, 1, 2, 3].map((i) => document.getElementById(`aqOpt${i}`).value),
              correctIndex: document.getElementById("aqCorrect").value,
              explanation: document.getElementById("aqExplanation").value,
              published: true
            },
            editId
          );
          form.reset();
          document.getElementById("aqEditId").value = "";
          showToast(editId ? "MCQ updated live!" : "MCQ published live!");
        });
        return;
      }

      // Admin Notice
      if (form.id === "adminNoticeForm" && state.user) {
        await withBusySubmit(form, async () => {
          const editId = document.getElementById("anEditId").value;
          await firebaseService.saveAnnouncement(
            state.user.uid,
            {
              title: document.getElementById("anTitle").value,
              audience: document.getElementById("anAudience").value,
              message: document.getElementById("anMessage").value,
              active: document.getElementById("anActive").checked
            },
            editId
          );
          form.reset();
          document.getElementById("anEditId").value = "";
          showToast(editId ? "Notice updated live!" : "Notice published live!");
        });
        return;
      }

      // Admin Verified Market Price (Create & Edit)
      if (form.id === "adminMarketPriceForm" && state.user) {
        await withBusySubmit(form, async () => {
          const editId = document.getElementById("ampEditId")?.value || "";
          await firebaseService.saveMarketPriceAsAdmin(
            state.user.uid,
            {
              cropName: document.getElementById("ampCrop").value,
              cropNameBn: document.getElementById("ampCropBn").value,
              state: document.getElementById("ampState").value,
              district: document.getElementById("ampDistrict").value,
              marketName: document.getElementById("ampMarket").value,
              unit: document.getElementById("ampUnit").value,
              minPrice: document.getElementById("ampMin").value,
              modalPrice: document.getElementById("ampModal").value,
              maxPrice: document.getElementById("ampMax").value,
              reportDate: document.getElementById("ampDate").value,
              sourceName: document.getElementById("ampSource").value,
              sourceUrl: document.getElementById("ampSourceUrl").value,
              published: document.getElementById("ampPublished").checked
            },
            editId
          );
          form.reset();
          document.getElementById("ampEditId").value = "";
          showToast(editId ? "Market price updated live!" : "Verified market price published live!");
        });
        return;
      }

      // Admin Career (Create & Edit)
      if (form.id === "adminCareerForm" && state.user) {
        await withBusySubmit(form, async () => {
          const editId = document.getElementById("acEditId")?.value || "";
          await firebaseService.saveCareerOpportunity(
            state.user.uid,
            {
              title: document.getElementById("acTitle").value,
              organization: document.getElementById("acOrg").value,
              category: document.getElementById("acCategory").value,
              deadline: document.getElementById("acDeadline").value,
              eligibility: document.getElementById("acEligibility").value,
              applyUrl: document.getElementById("acUrl").value,
              description: document.getElementById("acDesc").value,
              published: true
            },
            editId
          );
          form.reset();
          document.getElementById("acEditId").value = "";
          showToast(editId ? "Career opportunity updated!" : "Career opportunity published!");
        });
        return;
      }

      // Admin Farmer Query Reply
      if (form.dataset.replyFq) {
        await withBusySubmit(form, async () => {
          const reply = form.querySelector("input[name='reply']").value;
          const status = form.querySelector("select[name='status']").value;
          await firebaseService.replyFarmerQueryAsAdmin(form.dataset.replyFq, status, reply);
          showToast("Farmer query reply saved!");
        });
        return;
      }

      // Admin Professor Profile
      if (form.id === "adminProfForm" && state.user) {
        await withBusySubmit(form, async () => {
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
        });
        return;
      }

      // Admin App Settings
      if (form.id === "adminSettingsForm") {
        await withBusySubmit(form, async () => {
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
        });
        return;
      }

      // Add Admin Role
      if (form.id === "addAdminRoleForm" && state.user) {
        await withBusySubmit(form, async () => {
          await firebaseService.addAdminRole(
            state.user.uid,
            document.getElementById("arUid").value,
            document.getElementById("arEmail").value,
            document.getElementById("arRole").value
          );
          form.reset();
          showToast("Authorized admin added.");
        });
        return;
      }

      // User Profile Save (Preserves existing UID & prevents self-escalation)
      if (form.id === "profileForm" && state.user) {
        await withBusySubmit(form, async () => {
          const selectedRole = document.getElementById("profRole").value;
          await firebaseService.saveUserProfile(
            state.user,
            {
              displayName: document.getElementById("profFullName").value,
              phoneNumber: document.getElementById("profMobile").value,
              email: document.getElementById("profEmail").value,
              role: selectedRole,
              requestedRole: selectedRole,
              institutionOrVillage: document.getElementById("profCollege").value,
              district: document.getElementById("profDistrict").value,
              state: document.getElementById("profState").value,
              semester: document.getElementById("profSemester").value,
              department: document.getElementById("profDepartment").value,
              subjectSpecialization: document.getElementById("profSpec").value,
              language: state.lang.toUpperCase()
            },
            state.userProfile
          );
          closeProfileModal();
          if (selectedRole === "PROFESSOR" && !state.facultyIdentity?.isAuthorizedProfessor && state.userProfile?.professorApprovalStatus !== "APPROVED") {
            showToast("Profile saved! Professor verification request submitted for Super Admin approval.");
          } else {
            showToast("Profile saved successfully!");
          }
        });
        return;
      }
    } catch (err) {
      console.error("Action failed:", err);
      showToast(err?.message || "Operation failed. Check permissions or internet connection.", true);
    }
  });

  // Hash deep link listener (supports PWA shortcuts & email reply links)
  window.addEventListener("hashchange", () => {
    const h = (window.location.hash || "").replace(/^#/, "");
    if (h && VALID_ROUTES.has(h) && h !== state.route) {
      navigateTo(h, false);
    }
  });

  // PWA Install Prompt
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    state.deferredInstallPrompt = e;
    const btn = document.getElementById("installAppBtn");
    if (btn) {
      btn.classList.remove("hidden");
      btn.classList.add("inline-flex");
    }
  });
}

// ----------------------------------------------------------------------------
// BOOTSTRAP (Instant Public Render + Live Public Firestore + PWA SW Update)
// ----------------------------------------------------------------------------
bindGlobalEvents();
bindFarmerFinanceEvents({
  state,
  renderActiveView,
  showToast,
  withBusySubmit,
  openAuthModal,
  loadOfficialMandiData
});
const initialHash = (window.location.hash || "").replace(/^#/, "");
if (initialHash && VALID_ROUTES.has(initialHash)) {
  navigateTo(initialHash, false);
} else {
  renderActiveView();
}

// Show auth session loading overlay ONLY when returning from Google Redirect or opening a protected route
if (firebaseService.hasPendingRedirect()) {
  setAuthLoadingOverlay(true, "Completing Google Sign-In...", "Loading your Guru Ji Vision dashboard...");
} else if (PROTECTED_ROUTES.has(state.route)) {
  setAuthLoadingOverlay(true, "Restoring your session...", "Checking your Google Account status...");
}

firebaseService.init(handleAuthStateChange, handleCollectionUpdate, handleRedirectOutcome);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("./sw.js");
      if (reg.waiting) {
        state.waitingServiceWorker = reg.waiting;
        document.getElementById("pwaUpdateBanner")?.classList.remove("hidden");
      }
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener("statechange", () => {
          if (nw.state === "installed" && navigator.serviceWorker.controller) {
            state.waitingServiceWorker = nw;
            document.getElementById("pwaUpdateBanner")?.classList.remove("hidden");
          }
        });
      });
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    } catch (_) {}
  });
}
