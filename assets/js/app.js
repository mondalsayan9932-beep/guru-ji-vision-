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
  patchHomeDashboardInPlace,
  renderAiGuruView,
  renderCommunityView,
  renderFarmerView,
  renderFarmerZoneView,
  renderHomeView,
  renderMarketplaceView,
  renderSkillZoneView,
  renderStudentView,
  renderStudentZoneView,
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
import { mergeAgricultureSchemes } from "./govt-schemes-data.js";
import { renderWomenFarmerZoneView } from "./women-farmer-ui.js";
import {
  bindWomenFarmerEvents,
  clearWomenFarmerTransientState,
  createInitialWomenFarmerState
} from "./women-farmer-controller.js";
import {
  bindWomenCmsEvents,
  createInitialWomenCmsState
} from "./women-cms-controller.js";
import {
  bindWomenNearbyEvents,
  createInitialWomenNearbyState
} from "./women-nearby-controller.js";
import { syncWomenNearbyLeafletMap } from "./women-nearby-map.js";
import {
  filterQuizQuestions,
  mergeQuizQuestions,
  mergeStudyMaterials,
  resolveSubjectKey
} from "./agri-education-data.js";
import {
  bindAgriEducationEvents,
  createInitialEduState,
  loadGuestBookmarks,
  recordContinueLearning
} from "./agri-education-controller.js";
import {
  bindEduCmsEvents,
  createInitialEduCmsState
} from "./edu-cms-controller.js";
import {
  resolveMockTestQuestions,
  validateStudyDocumentFile
} from "./edu-cms-utils.js";
import {
  getAllowedFinancialProfiles,
  normalizeProfileType,
  profileTypeToLedgerScope,
  resolveActiveFinancialProfile
} from "./money-profile-utils.js";

const VALID_ROUTES = new Set([
  "home",
  "student-zone",
  "farmer-zone",
  "women-farmer",
  "skill-zone",
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

const PRIMARY_ZONE_ROUTES = new Set([
  "student-zone",
  "farmer-zone",
  "women-farmer",
  "skill-zone"
]);

// ----------------------------------------------------------------------------
// APPLICATION STATE
// ----------------------------------------------------------------------------
const state = {
  route: "home",
  lastZone: "",
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
  agricultureSchemes: [],
  agricultureSchemeHistory: [],

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

  // Private Owner-Only Student & Farmer Financial Profiles (Strictly Separated & Cleared on Logout!)
  studentOpeningBalance: 0,
  studentMoneyTransactions: [],
  studentMoneyBudgets: [],
  farmerOpeningBalance: 0,
  farmerMoneyTransactions: [],
  farmerMoneyBudgets: [],
  moneyLedgerScope: "", // "STUDENT" or "FARMER" (resolved against allowed financial profiles)
  moneyRequestedUnauthorizedProfile: "",
  moneyMigrationInfo: null,
  moneyFilter: "ALL",
  moneyFormType: "EXPENSE",
  quizAttempts: [],

  // Farmer Financial Support & Rights Module State (Private records cleared on logout!)
  farmerFinance: createInitialFarmerFinanceState(),

  // Women Farmer Zone, Learning Centre, YouTube Library, Discovery Queue & Nearby/SHG State (Phase 6 + Phase 4 + Phase 5)
  womenVideos: [],
  womenLearningResources: [],
  womenSchemeDiscoveryQueue: [],
  nearbyServiceListings: [],
  shgDirectoryListings: [],
  myPendingNearbyListings: [],
  myPendingShgListings: [],
  directoryAuditLogs: [],
  womenFarmer: createInitialWomenFarmerState(),
  womenCms: createInitialWomenCmsState(),
  womenNearby: createInitialWomenNearbyState(),

  // Agriculture Education Hub & Phase 3 CMS State (Notes, Videos, MCQs, Mock Tests, PYQs, Syllabus, Resources & Bookmarks)
  universitySyllabi: [],
  discoveredStudyResources: [],
  mockTests: [],
  studyBookmarks: loadGuestBookmarks(),
  edu: createInitialEduState(),
  eduCms: createInitialEduCmsState(),

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
  communityCircle: "ALL",
  careerCategory: "ALL",
  professorSearch: "",
  adminSubTab: "edu-cms",

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
  waitingServiceWorker: null,
  userRequestedSwUpdate: false
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

function openingBalanceKey(uid, profileType) {
  const profile = normalizeProfileType(profileType) || "student";
  return `gjv_opening_bal_${uid}_${profile}`;
}

function loadOpeningBalanceForUid(uid, profileType) {
  if (!uid) return 0;
  const val = parseFloat(localStorage.getItem(openingBalanceKey(uid, profileType)));
  return Number.isFinite(val) ? val : 0;
}

function getActiveFinancialProfileFromState() {
  return resolveActiveFinancialProfile(state.moneyLedgerScope, state.userProfile);
}

function syncUserFinancialProfiles(user, profile) {
  if (!user?.uid) return;
  const allowed = getAllowedFinancialProfiles(profile);
  state.studentOpeningBalance = allowed.includes("student")
    ? loadOpeningBalanceForUid(user.uid, "student")
    : 0;
  state.farmerOpeningBalance = allowed.includes("farmer")
    ? loadOpeningBalanceForUid(user.uid, "farmer")
    : 0;

  const resolved = resolveActiveFinancialProfile(state.moneyLedgerScope, profile);
  state.moneyLedgerScope = profileTypeToLedgerScope(resolved.activeProfile);
  if (!resolved.deniedRequestedProfile) {
    state.moneyRequestedUnauthorizedProfile = "";
  }

  firebaseService.subscribeFinancialProfiles({
    uid: user.uid,
    userProfile: profile,
    onUpdate: handleCollectionUpdate
  });

  firebaseService.migrateLegacyMoneyRecords(user.uid, profile).then((info) => {
    if (info && (info.migratedStudentTx > 0 || info.migratedFarmerTx > 0 || info.migratedBudgets > 0)) {
      state.moneyMigrationInfo = info;
      if (state.route === "money") scheduleActiveViewRender();
    }
  }).catch(() => {});
}

function clearPrivateStateOnLogout() {
  const wasAdmin = state.isAdmin || state.isSuperAdmin;
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

  // Strictly purge ALL private Student & Farmer financial & consultation state from memory
  state.studentOpeningBalance = 0;
  state.studentMoneyTransactions = [];
  state.studentMoneyBudgets = [];
  state.farmerOpeningBalance = 0;
  state.farmerMoneyTransactions = [];
  state.farmerMoneyBudgets = [];
  state.moneyLedgerScope = "";
  state.moneyRequestedUnauthorizedProfile = "";
  state.moneyMigrationInfo = null;
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
  state.agricultureSchemeHistory = [];
  state.studyBookmarks = loadGuestBookmarks();
  state.myPendingNearbyListings = [];
  state.myPendingShgListings = [];
  state.directoryAuditLogs = [];
  clearFarmerFinancePrivateState(state);
  clearWomenFarmerTransientState(state);

  // Purge stale private snapshot signatures so signing back in always hydrates cleanly
  if (wasAdmin) {
    collectionSignatures.clear();
  } else {
    for (const sigKey of Array.from(collectionSignatures.keys())) {
      if (
        sigKey === "userProfile" ||
        sigKey === "farmerQueries" ||
        sigKey === "studentMoneyTransactions" ||
        sigKey === "studentMoneyBudgets" ||
        sigKey === "studentOpeningBalance" ||
        sigKey === "farmerMoneyTransactions" ||
        sigKey === "farmerMoneyBudgets" ||
        sigKey === "farmerOpeningBalance" ||
        sigKey === "quizAttempts" ||
        sigKey === "studyBookmarks" ||
        sigKey === "myPendingNearbyListings" ||
        sigKey === "myPendingShgListings" ||
        sigKey === "directoryAuditLogs" ||
        sigKey === "studentDoubtThreads" ||
        sigKey === "professorDoubtThreads" ||
        sigKey.startsWith("ff:") ||
        sigKey.startsWith("owner")
      ) {
        collectionSignatures.delete(sigKey);
      }
    }
  }
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
// RENDER SHELL & ACTIVE VIEW (Stable, Diff-Aware, Coalesced — ZERO Blinking)
// ----------------------------------------------------------------------------
const ROUTE_DATA_DEPS = {
  home: new Set([
    "appSettings", "studyMaterials", "announcements", "meetings",
    "professors", "studentDoubtThreads", "professorDoubtThreads", "userProfile",
    "agricultureSchemes", "communityPosts", "careerOpportunities"
  ]),
  "student-zone": new Set([
    "studyMaterials", "quizzes", "mockTests", "universitySyllabi", "discoveredStudyResources",
    "careerOpportunities", "meetings", "communityPosts", "professors",
    "studentDoubtThreads", "professorDoubtThreads"
  ]),
  "farmer-zone": new Set([
    "firestoreMarketPrices", "agricultureSchemes", "meetings", "communityPosts", "professors"
  ]),
  "women-farmer": new Set([
    "agricultureSchemes", "communityPosts", "meetings",
    "womenVideos", "womenLearningResources",
    "nearbyServiceListings", "shgDirectoryListings",
    "myPendingNearbyListings", "myPendingShgListings"
  ]),
  "skill-zone": new Set([
    "studyMaterials", "quizzes", "mockTests", "careerOpportunities", "meetings", "communityPosts", "professors"
  ]),
  weather: new Set([]),
  market: new Set(["firestoreMarketPrices"]),
  marketplace: new Set([]),
  student: new Set([
    "studyMaterials", "quizzes", "mockTests", "quizAttempts",
    "universitySyllabi", "discoveredStudyResources", "studyBookmarks", "womenVideos"
  ]),
  farmer: new Set(["appSettings", "farmerQueries"]),
  "farmer-finance": new Set(["firestoreMarketPrices", "agricultureSchemes"]),
  tools: new Set([]),
  ai: new Set(["appSettings", "studyMaterials"]),
  community: new Set(["communityPosts", "careerOpportunities"]),
  "career-guidance": new Set(["professors", "studentDoubtThreads", "professorDoubtThreads"]),
  "farmer-advisor": new Set(["professors", "studentDoubtThreads", "professorDoubtThreads"]),
  professor: new Set(["professors", "professorDoubtThreads", "studentDoubtThreads"]),
  meeting: new Set(["meetings"]),
  money: new Set([
    "studentMoneyTransactions", "studentMoneyBudgets", "studentOpeningBalance",
    "farmerMoneyTransactions", "farmerMoneyBudgets", "farmerOpeningBalance",
    "userProfile"
  ]),
  doubt: new Set(["studentDoubtThreads", "professorDoubtThreads", "activeDoubtMessages"]),
  admin: new Set([
    "appSettings", "studyMaterials", "quizzes", "mockTests", "universitySyllabi", "discoveredStudyResources",
    "announcements", "careerOpportunities", "farmerQueries", "professors", "firestoreMarketPrices",
    "agricultureSchemes", "agricultureSchemeHistory", "communityPosts",
    "womenVideos", "womenLearningResources", "womenSchemeDiscoveryQueue",
    "nearbyServiceListings", "shgDirectoryListings", "directoryAuditLogs"
  ]),
  owner: new Set([
    "appSettings", "ownerUsers", "ownerAdmins", "ownerActivities",
    "ownerExamStats", "ownerAiLogs", "ownerErrorLogs", "ownerContentReports", "ownerAuditLogs"
  ])
};

const renderTracker = {
  lastRenderedRoute: "",
  lastRenderedHtml: "",
  lastHomeStructureKey: "",
  lastSyncPillState: null,
  lastHeaderAuthKey: "",
  lastDrawerAuthKey: "",
  scheduledTimer: null
};

function getHomeStructureKey() {
  return [
    state.user?.uid || "GUEST",
    Boolean(state.facultyIdentity?.isAuthorizedProfessor),
    Boolean(state.isAdmin),
    state.lang
  ].join("|");
}

function scheduleActiveViewRender() {
  if (renderTracker.scheduledTimer !== null) return;
  renderTracker.scheduledTimer = setTimeout(() => {
    renderTracker.scheduledTimer = null;
    renderActiveView({ fromLiveUpdate: true });
  }, 32);
}

function renderShellChrome() {
  const dict = I18N[state.lang] || I18N.en;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] && el.textContent !== dict[key]) el.textContent = dict[key];
  });

  const langBtn = document.getElementById("langToggleBtn");
  const nextLangLabel = state.lang === "en" ? "বাংলা" : "EN";
  if (langBtn && langBtn.textContent !== nextLangLabel) langBtn.textContent = nextLangLabel;

  // Sync status pill (mutate ONLY when connection state changes)
  const syncPill = document.getElementById("syncStatusPill");
  if (syncPill && renderTracker.lastSyncPillState !== state.cloudConnected) {
    renderTracker.lastSyncPillState = state.cloudConnected;
    if (state.cloudConnected) {
      syncPill.className = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#14532D] border border-[#BBF7D0] shrink-0";
      syncPill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span> Live Cloud`;
    } else {
      syncPill.className = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#15803D] border border-[#BBF7D0] shrink-0";
      syncPill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span> Public`;
    }
  }

  // Auth button in header (mutate ONLY when label/action changes)
  const authBtn = document.getElementById("headerAuthBtn");
  if (authBtn) {
    const label = state.user
      ? (state.userProfile?.displayName || state.user.displayName || state.user.phoneNumber || state.user.email || "Account").split(" ")[0]
      : dict.signIn;
    const action = state.user ? "open-profile" : "open-auth";
    const key = `${label}|${action}`;
    if (renderTracker.lastHeaderAuthKey !== key) {
      renderTracker.lastHeaderAuthKey = key;
      authBtn.textContent = label;
      authBtn.dataset.action = action;
    }
  }

  // Badges for Meetings & Consultations
  const upcomingCount = state.meetings.filter((m) => m.published !== false && isUpcomingMeeting(m)).length;
  const upcomingText = upcomingCount > 0 ? String(upcomingCount) : "";
  document.querySelectorAll("[data-badge='meetings']").forEach((el) => {
    if (el.textContent !== upcomingText) el.textContent = upcomingText;
    el.classList.toggle("hidden", upcomingCount === 0);
  });
  const doubtsText = state.totalUnreadDoubts > 0 ? (state.totalUnreadDoubts > 99 ? "99+" : String(state.totalUnreadDoubts)) : "";
  document.querySelectorAll("[data-badge='doubts']").forEach((el) => {
    if (el.textContent !== doubtsText) el.textContent = doubtsText;
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

  // Active nav highlighting (mutate ONLY when className actually changes)
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    const isBottom = btn.classList.contains("bottom-nav-item");
    const isRail = btn.classList.contains("rail-nav-item");
    const isDrawer = btn.classList.contains("drawer-nav-item");
    const navTarget = btn.dataset.nav;
    const active = navTarget === state.route ||
      (isBottom && state.route === "student-zone" && navTarget === "student") ||
      (isBottom && state.route === "farmer-zone" && navTarget === "farmer");

    let nextClass = "";
    if (isBottom) {
      nextClass = active
        ? "bottom-nav-item flex flex-col items-center justify-center gap-0.5 min-h-[48px] rounded-xl text-[10px] font-extrabold bg-[#DCFCE7] text-[#14532D] transition-colors"
        : "bottom-nav-item flex flex-col items-center justify-center gap-0.5 min-h-[48px] rounded-xl text-[10px] font-semibold text-[#475569] hover:text-[#14532D] transition-colors";
    } else if (isRail || isDrawer) {
      nextClass = `${isRail ? "rail-nav-item" : "drawer-nav-item"} w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-all ${
        active
          ? "bg-gradient-to-r from-[#14532D] to-[#15803D] text-white font-extrabold shadow-sm"
          : "text-[#0F172A] hover:bg-[#ECFDF5] hover:text-[#14532D] font-semibold"
      }`;
    }
    if (nextClass && btn.className !== nextClass) {
      btn.className = nextClass;
    }
  });

  // Drawer user header (mutate ONLY when changed)
  const drawerName = document.getElementById("drawerUserName");
  const drawerSub = document.getElementById("drawerUserSub");
  const drawerAuthAction = document.getElementById("drawerAuthAction");
  if (drawerName && drawerSub && drawerAuthAction) {
    const nextName = state.user ? (state.userProfile?.displayName || state.user.displayName || "Guru Ji Member") : "Guest Visitor";
    const nextSub = state.user ? (state.user.phoneNumber || state.user.email || state.user.uid) : "Public access active • Sign in with Google for private tools";
    const nextActionText = state.user ? dict.signOut : "Continue with Google";
    const nextAction = state.user ? "sign-out" : "open-auth";
    const drawerKey = `${nextName}|${nextSub}|${nextActionText}|${nextAction}`;
    if (renderTracker.lastDrawerAuthKey !== drawerKey) {
      renderTracker.lastDrawerAuthKey = drawerKey;
      drawerName.textContent = nextName;
      drawerSub.textContent = nextSub;
      drawerAuthAction.textContent = nextActionText;
      drawerAuthAction.dataset.action = nextAction;
      drawerAuthAction.className = state.user
        ? "w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold transition-colors"
        : "w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#14532D] to-[#15803D] hover:opacity-95 text-white text-xs font-extrabold shadow-sm transition-opacity";
    }
  }
}

function renderSubpageBackBar(route, lastZone) {
  if (route === "home" || PRIMARY_ZONE_ROUTES.has(route)) return "";
  const backIcon = `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>`;
  const zoneLabelMap = {
    "student-zone": "Back to Student Zone",
    "farmer-zone": "Back to Farmer Zone",
    "women-farmer": "Back to Women Farmer Zone",
    "skill-zone": "Back to Skill Zone"
  };
  const zoneLabel = zoneLabelMap[lastZone] || "";
  const safeLastZone = zoneLabel ? lastZone : "";
  return `
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2">
        ${safeLastZone ? `
          <button data-nav="${safeLastZone}" type="button" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#ECFDF5] border border-[#D9EAE0] text-[#14532D] text-xs font-extrabold shadow-sm transition-colors">
            ${backIcon}
            <span>${zoneLabel}</span>
          </button>
        ` : ""}
        <button data-nav="home" type="button" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl ${safeLastZone ? "bg-[#ECFDF5] hover:bg-[#DCFCE7] border border-[#BBF7D0]" : "bg-white hover:bg-[#ECFDF5] border border-[#D9EAE0] shadow-sm"} text-[#14532D] text-xs font-extrabold transition-colors">
          ${safeLastZone ? "" : backIcon}
          <span>${safeLastZone ? "Home" : "Back to Home"}</span>
        </button>
      </div>
    </div>
  `;
}

function renderActiveView({ fromLiveUpdate = false } = {}) {
  const root = document.getElementById("appMainContent");
  if (!root) return;

  if (renderTracker.scheduledTimer !== null) {
    clearTimeout(renderTracker.scheduledTimer);
    renderTracker.scheduledTimer = null;
  }

  const sameRoute = renderTracker.lastRenderedRoute === state.route;

  // STABLE IN-PLACE HOME DASHBOARD PATCHING:
  // When Home Dashboard is already mounted with the same user/role structure,
  // update only changed live counters/notices/labels in place — NEVER replace root.innerHTML!
  if (state.route === "home" && sameRoute) {
    const nextHomeKey = getHomeStructureKey();
    if (renderTracker.lastHomeStructureKey === nextHomeKey && patchHomeDashboardInPlace(root, state)) {
      renderShellChrome();
      return;
    }
  }

  let html = "";
  switch (state.route) {
    case "home": html = renderHomeView(state); break;
    case "student-zone": html = renderStudentZoneView(state); break;
    case "farmer-zone": html = renderFarmerZoneView(state); break;
    case "women-farmer": html = renderWomenFarmerZoneView(state); break;
    case "skill-zone": html = renderSkillZoneView(state); break;
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

  html = renderSubpageBackBar(state.route, state.lastZone) + html;

  // Strip entrance fade-from-zero animation on same-route or live updates so DOM updates never flash white
  if (sameRoute || fromLiveUpdate) {
    html = html.replace(/\banimate-fade-up\b/g, "");
  }

  // Skip redundant DOM replacement if the rendered HTML is identical
  if (sameRoute && html === renderTracker.lastRenderedHtml) {
    renderShellChrome();
    syncWomenNearbyLeafletMap(state);
    return;
  }

  root.innerHTML = html;
  renderTracker.lastRenderedRoute = state.route;
  renderTracker.lastRenderedHtml = html;
  if (state.route === "home") {
    renderTracker.lastHomeStructureKey = getHomeStructureKey();
  }
  renderShellChrome();

  // Mount/refresh interactive Leaflet.js + OpenStreetMap map when Map View is visible
  syncWomenNearbyLeafletMap(state);

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
  if (cleanRoute === "home") {
    state.lastZone = "";
  } else if (PRIMARY_ZONE_ROUTES.has(cleanRoute)) {
    state.lastZone = cleanRoute;
  }
  state.route = cleanRoute;
  if (updateHash && typeof window !== "undefined") {
    const nextHash = cleanRoute === "home" ? "" : `#${cleanRoute}`;
    if (window.location.hash !== nextHash) {
      history.pushState({ route: cleanRoute, lastZone: state.lastZone }, "", nextHash || window.location.pathname);
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
  const allMaterials = mergeStudyMaterials(state.studyMaterials || [], state.isAdmin);
  const mat = allMaterials.find((m) => m.id === materialId);
  if (!mat) return;
  const bn = (state.edu?.lang === "BN") || (!state.edu?.lang && state.lang === "bn");
  const title = bn && mat.titleBn ? mat.titleBn : mat.title;
  const summary = bn && mat.summaryBn ? mat.summaryBn : mat.summary;
  const mainBody = (bn && mat.contentTextBn ? mat.contentTextBn : mat.contentText)
    || "Open the linked official source or PDF resource below to view full study material.";
  const metaParts = [
    `Semester ${mat.semester}`,
    bn ? (mat.subjectLabelBn || mat.subject) : (mat.subjectLabelEn || mat.subject),
    mat.topic || "",
    mat.category,
    mat.lastUpdatedDate ? `Updated: ${mat.lastUpdatedDate}` : ""
  ].filter(Boolean);
  const footerLines = [
    mat.sourceName ? `\n\nSource: ${mat.sourceName}` : "",
    mat.referenceCitation ? `\nReference: ${mat.referenceCitation}` : "",
    mat.sourceUrl ? `\nOfficial Reference URL: ${mat.sourceUrl}` : ""
  ].join("");

  document.getElementById("readerTitle").textContent = title;
  document.getElementById("readerMeta").textContent = metaParts.join(" • ");
  document.getElementById("readerSummary").textContent = summary;
  document.getElementById("readerContent").textContent = `${mainBody}${footerLines}`;
  const link = document.getElementById("readerPdfBtn");
  const href = safeUrl(mat.resourceUrl || mat.sourceUrl);
  if (href) {
    link.href = href;
    link.classList.remove("hidden");
  } else {
    link.classList.add("hidden");
  }
  document.getElementById("readerModal")?.classList.remove("hidden");
  recordContinueLearning(state, mat);
}

function closeReaderModal() {
  document.getElementById("readerModal")?.classList.add("hidden");
}

function redirectAfterSignIn(profile) {
  if (state.route !== "home") return;
  if (state.facultyIdentity?.isAuthorizedProfessor) {
    navigateTo("professor");
  } else if (profile?.role === "FARMER") {
    navigateTo("farmer-zone");
  } else if (profile?.role === "STUDENT") {
    navigateTo("student-zone");
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
// FIREBASE LIVE PUBLIC & AUTH SUBSCRIPTIONS (Deduplicated & Route-Scoped)
// ----------------------------------------------------------------------------
const collectionSignatures = new Map();
let lastProcessedAuthUid = "__UNSET__";
let authHandlingSeq = 0;

function computeCollectionSignature(data) {
  if (data === null || data === undefined) return `prim:${String(data)}`;
  if (typeof data !== "object") return `prim:${String(data)}`;
  try {
    return `json:${JSON.stringify(data)}`;
  } catch (_) {
    if (Array.isArray(data)) {
      return `arr:${data.length}|${data.map((item) => item?.id || String(item)).join(",")}`;
    }
    return `obj:${Object.keys(data).length}`;
  }
}

function handleCollectionUpdate(key, data, isLivePublic = false) {
  const prevCloud = state.cloudConnected;
  if (isLivePublic) state.cloudConnected = true;

  let nextVal;
  if (key === "studyMaterials") {
    nextVal = data.length > 0 ? data : (state.isAdmin ? [] : [...FALLBACK_STUDY_MATERIALS]);
  } else if (key === "quizzes") {
    nextVal = data.length > 0 ? data : (state.isAdmin ? [] : [...FALLBACK_QUIZZES]);
  } else if (key === "careerOpportunities") {
    nextVal = data.length > 0 ? data : (state.isAdmin ? [] : [...FALLBACK_CAREERS]);
  } else if (key === "announcements") {
    nextVal = data.length > 0 ? data : [...FALLBACK_ANNOUNCEMENTS];
  } else if (key === "studentOpeningBalance") {
    nextVal = Number(data) || 0;
    if (state.user) localStorage.setItem(openingBalanceKey(state.user.uid, "student"), String(nextVal));
  } else if (key === "farmerOpeningBalance") {
    nextVal = Number(data) || 0;
    if (state.user) localStorage.setItem(openingBalanceKey(state.user.uid, "farmer"), String(nextVal));
  } else {
    nextVal = data;
  }

  const sig = computeCollectionSignature(nextVal);
  const dataChanged = collectionSignatures.get(key) !== sig;
  const cloudChanged = prevCloud !== state.cloudConnected;

  if (!dataChanged && !cloudChanged) return;

  collectionSignatures.set(key, sig);
  state[key] = nextVal;

  const routeDeps = ROUTE_DATA_DEPS[state.route];
  if ((routeDeps && routeDeps.has(key)) || (cloudChanged && state.route === "home")) {
    scheduleActiveViewRender();
  } else if (cloudChanged || key === "meetings") {
    renderShellChrome();
  }
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
  const incomingUid = user?.uid || null;
  const seq = ++authHandlingSeq;
  state.authInitializing = false;

  // Guard against duplicate auth events for the exact same signed-out or signed-in identity
  if (incomingUid === lastProcessedAuthUid) {
    if (user) state.user = user;
    setAuthLoadingOverlay(false);
    return;
  }

  if (!user) {
    const wasSignedIn = lastProcessedAuthUid !== "__UNSET__" && lastProcessedAuthUid !== null;
    lastProcessedAuthUid = null;
    setAuthLoadingOverlay(false);
    farmerFinanceService.clearSubs();
    firebaseService.unsubscribePrivate();
    clearPrivateStateOnLogout();
    state.justSignedInFromAuth = false;

    // Only re-subscribe public collections if scope actually changed (guarded inside subscribePublicCollections)
    firebaseService.subscribePublicCollections({
      isAdmin: false,
      isSuperAdmin: false,
      isAuthorizedMeetingHost: false,
      onUpdate: handleCollectionUpdate
    });

    // If initial guest boot (never signed in), Home Dashboard is already cleanly rendered; only update chrome
    if (wasSignedIn) {
      renderActiveView();
    } else {
      renderShellChrome();
    }
    return;
  }

  lastProcessedAuthUid = incomingUid;
  state.user = user;
  const [roles, profileResult] = await Promise.all([
    firebaseService.resolveUserRoles(user),
    firebaseService.ensureGoogleUserProfile(user, state.lang.toUpperCase())
  ]);

  // Discard stale async completion if another auth transition happened in the meantime
  if (seq !== authHandlingSeq) return;

  state.isAdmin = roles.isAdmin;
  state.isSuperAdmin = roles.isSuperAdmin;
  state.facultyIdentity = roles.facultyIdentity;
  state.cloudConnected = true;

  const activeProfile = profileResult.profile;
  if (activeProfile) {
    state.userProfile = activeProfile;
    collectionSignatures.set("userProfile", computeCollectionSignature(activeProfile));
  }

  firebaseService.subscribeUserProfile(user.uid, (profile) => {
    const nextSig = computeCollectionSignature(profile);
    if (collectionSignatures.get("userProfile") === nextSig) return;
    collectionSignatures.set("userProfile", nextSig);
    state.userProfile = profile;
    syncUserFinancialProfiles(user, profile);
    if (profile?.language) {
      const nextLang = profile.language === "BN" ? "bn" : "en";
      if (state.lang !== nextLang) {
        state.lang = nextLang;
        localStorage.setItem("gjv_lang", state.lang);
      }
    }
    renderShellChrome();
    if (state.route === "home" || state.route === "money") scheduleActiveViewRender();
  });

  firebaseService.subscribeEcosystemCollections({
    isAdmin: state.isAdmin,
    isSuperAdmin: state.isSuperAdmin,
    isAuthorizedMeetingHost: state.isAdmin || state.facultyIdentity.canHostMeetings,
    uid: user.uid,
    onUpdate: handleCollectionUpdate
  });

  syncUserFinancialProfiles(user, activeProfile);

  farmerFinanceService.subscribeFarmerFinance(user.uid, (key, list) => {
    const sigKey = `ff:${key}`;
    const nextSig = computeCollectionSignature(list);
    if (collectionSignatures.get(sigKey) === nextSig) return;
    collectionSignatures.set(sigKey, nextSig);
    state.farmerFinance[key] = list;
    if (state.route === "farmer-finance") scheduleActiveViewRender();
  });

  firebaseService.subscribeDoubtThreads({
    uid: user.uid,
    facultyIdentity: state.facultyIdentity,
    onStudentThreads: (threads) => {
      const nextSig = computeCollectionSignature(threads);
      if (collectionSignatures.get("studentDoubtThreads") === nextSig) return;
      collectionSignatures.set("studentDoubtThreads", nextSig);
      state.studentDoubtThreads = threads;
      recomputeUnreadDoubts();
      if (["career-guidance", "farmer-advisor", "doubt", "home"].includes(state.route)) scheduleActiveViewRender();
      else renderShellChrome();
    },
    onProfessorThreads: (threads) => {
      const nextSig = computeCollectionSignature(threads);
      if (collectionSignatures.get("professorDoubtThreads") === nextSig) return;
      collectionSignatures.set("professorDoubtThreads", nextSig);
      state.professorDoubtThreads = threads;
      recomputeUnreadDoubts();
      if (["professor", "career-guidance", "doubt", "home"].includes(state.route)) scheduleActiveViewRender();
      else renderShellChrome();
    }
  });

  if (state.isSuperAdmin) {
    firebaseService.subscribeOwnerTelemetry(true, (key, data) => {
      const nextSig = computeCollectionSignature(data);
      if (collectionSignatures.get(key) === nextSig) return;
      collectionSignatures.set(key, nextSig);
      state[key] = data;
      if (state.route === "owner" || state.route === "admin") scheduleActiveViewRender();
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
    if (e.target.id === "asCancelEdit") {
      document.getElementById("adminSchemeForm")?.reset();
      document.getElementById("asEditCloudId").value = "";
      document.getElementById("asSlug").value = "";
      document.getElementById("asFormTitle").textContent = "Add / Update Agriculture Govt Scheme";
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
      "[data-comm-sub]", "[data-comm-topic]", "[data-comm-circle]", "[data-career-cat]", "[data-upvote-post]", "[data-report-post]", "[data-edit-post]", "[data-del-post]",
      "[data-money-scope]", "[data-money-type]", "[data-money-filter]", "[data-edit-tx]", "[data-del-tx]", "[data-edit-goal]", "[data-del-goal]",
      "[data-copy-meeting-url]", "[data-share-meeting]", "[data-edit-meeting]", "[data-del-meeting]",
      "[data-start-career-prof]", "[data-open-student-thread]", "[data-open-prof-thread]", "[data-prof-filter]", "[data-pick-fa-topic]", "[data-del-doubt-msg]", "[data-retry-email]",
      "[data-admin-sub]", "[data-edit-mat]", "[data-del-mat]", "[data-edit-quiz]", "[data-del-quiz]", "[data-edit-notice]", "[data-del-notice]",
      "[data-edit-mp]", "[data-del-mp]", "[data-edit-career]", "[data-del-career]", "[data-edit-prof]", "[data-del-prof]",
      "[data-approve-prof]", "[data-reject-prof]",
      "[data-mod-post]", "[data-del-admin]", "[data-resolve-report]", "[data-resolve-error]"
    ].join(", ");

    const target = e.target.closest(selector);
    if (!target) return;

    // Navigation (supports deep-link entry from all 4 primary Zones into shared/existing modules)
    if (target.dataset.nav) {
      if (target.dataset.fromZone) {
        state.lastZone = target.dataset.fromZone;
      } else if (!PRIMARY_ZONE_ROUTES.has(target.dataset.nav)) {
        state.lastZone = "";
      }
      if (target.dataset.openStudentSub) {
        state.studentSubTab = target.dataset.openStudentSub;
      }
      if (target.dataset.openStudentCat) {
        state.studentCategory = target.dataset.openStudentCat;
      }
      if (target.dataset.openFfSub && state.farmerFinance) {
        state.farmerFinance.subTab = target.dataset.openFfSub;
        state.farmerFinance.selectedSchemeId = "";
      }
      if (target.dataset.openMoneyScope) {
        const resolved = resolveActiveFinancialProfile(target.dataset.openMoneyScope, state.userProfile);
        state.moneyLedgerScope = profileTypeToLedgerScope(resolved.activeProfile);
        state.moneyRequestedUnauthorizedProfile = resolved.deniedRequestedProfile;
      } else if (target.dataset.nav === "money") {
        const resolved = resolveActiveFinancialProfile(state.moneyLedgerScope, state.userProfile);
        state.moneyLedgerScope = profileTypeToLedgerScope(resolved.activeProfile);
        state.moneyRequestedUnauthorizedProfile = "";
      }
      if (target.dataset.openCommSub) {
        state.communitySubTab = target.dataset.openCommSub;
      }
      if (target.dataset.openAdminSub) {
        state.adminSubTab = target.dataset.openAdminSub;
      }
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
          state.userRequestedSwUpdate = true;
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
          const edu = state.edu || {};
          const publishedTests = (state.mockTests || []).filter((t) => t.published !== false);
          const activeTest = edu.activeMockTestId
            ? publishedTests.find((t) => t.id === edu.activeMockTestId) || null
            : null;
          const mode = activeTest
            ? (activeTest.testType === "MOCK_TEST" ? "MOCK_TEST" : "PRACTICE")
            : (edu.quizMode || "PRACTICE");
          const savedMcqIds = new Set(
            (state.studyBookmarks || []).filter((b) => b.itemType === "MCQ").map((b) => b.itemId)
          );
          const allPublishedQuizzes = mergeQuizQuestions(state.quizzes || [], false);
          const activeQuizzes = activeTest
            ? resolveMockTestQuestions(activeTest, allPublishedQuizzes)
            : filterQuizQuestions(
              allPublishedQuizzes,
              {
                semester: state.studentSemester || 0,
                subjectKey: edu.quizSubject || "ALL",
                examCategory: edu.quizExam || "ALL",
                questionType: mode === "PYQ_SET" ? "OFFICIAL_PYQ" : (edu.quizType || "ALL"),
                difficulty: edu.quizDifficulty || "ALL",
                search: edu.quizSearch || "",
                savedOnly: Boolean(edu.quizSavedOnly)
              },
              savedMcqIds
            );
          let score = 0;
          activeQuizzes.forEach((q) => {
            if (state.quizAnswers[q.id] !== undefined && Number(state.quizAnswers[q.id]) === Number(q.correctIndex)) score++;
          });
          state.quizSubmitted = true;
          if (state.user && activeQuizzes.length > 0) {
            await firebaseService.recordQuizAttempt(
              state.user.uid,
              (activeTest && activeTest.semester > 0) ? activeTest.semester : (state.studentSemester || 1),
              score,
              activeQuizzes.length,
              {
                mode,
                examCategory: activeTest ? activeTest.examCategory : (edu.quizExam || "ALL"),
                subjectKey: activeTest ? activeTest.subjectKey : (edu.quizSubject || "ALL")
              }
            ).catch(() => {});
          }
          showToast(`${activeTest ? activeTest.title : "Exam"} submitted! Score: ${score}/${activeQuizzes.length}`);
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
          const { activeProfile } = getActiveFinancialProfileFromState();
          const val = Math.max(0, parseFloat(document.getElementById("openingBalanceInput")?.value) || 0);
          try {
            await firebaseService.saveOpeningBalance(state.user.uid, activeProfile, val);
            if (activeProfile === "farmer") state.farmerOpeningBalance = val;
            else state.studentOpeningBalance = val;
            localStorage.setItem(openingBalanceKey(state.user.uid, activeProfile), String(val));
            showToast(`${activeProfile === "farmer" ? "Farmer" : "Student"} opening balance saved privately.`);
            renderActiveView();
          } catch (err) {
            showToast(err.message || "Failed to save opening balance.", true);
          }
          return;
        }
        case "enable-dual-financial-profile": {
          if (!state.user) return;
          const targetProfile = normalizeProfileType(target.dataset.targetProfile) || "farmer";
          try {
            const updatedProfiles = await firebaseService.updateFinancialProfiles(state.user.uid, ["student", "farmer"]);
            state.userProfile = { ...(state.userProfile || {}), financialProfiles: updatedProfiles };
            state.moneyLedgerScope = profileTypeToLedgerScope(targetProfile);
            state.moneyRequestedUnauthorizedProfile = "";
            syncUserFinancialProfiles(state.user, state.userProfile);
            showToast("Separate Student & Farmer financial profiles enabled! Records stay 100% isolated.");
            renderActiveView();
          } catch (err) {
            showToast(err.message || "Could not enable separate financial profile.", true);
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
    if (target.dataset.commCircle) { state.communityCircle = target.dataset.commCircle; renderActiveView(); return; }
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

    // Money & Farm Manager (Strictly Separated Student & Farmer Financial Profiles)
    if (target.dataset.moneyScope) {
      const resolved = resolveActiveFinancialProfile(target.dataset.moneyScope, state.userProfile);
      state.moneyLedgerScope = profileTypeToLedgerScope(resolved.activeProfile);
      state.moneyRequestedUnauthorizedProfile = resolved.deniedRequestedProfile;
      state.moneyFilter = "ALL";
      renderActiveView();
      return;
    }
    if (target.dataset.moneyType) { state.moneyFormType = target.dataset.moneyType; renderActiveView(); return; }
    if (target.dataset.moneyFilter) { state.moneyFilter = target.dataset.moneyFilter; renderActiveView(); return; }
    if (target.dataset.editTx) {
      const { activeProfile } = getActiveFinancialProfileFromState();
      const txList = activeProfile === "farmer" ? state.farmerMoneyTransactions : state.studentMoneyTransactions;
      const tx = txList.find((x) => x.id === target.dataset.editTx);
      if (tx) {
        state.moneyFormType = tx.type === "INCOME" ? "INCOME" : "EXPENSE";
        state.moneyLedgerScope = profileTypeToLedgerScope(activeProfile);
        renderActiveView();
        document.getElementById("moneyEditId").value = tx.id;
        document.getElementById("moneyTitle").value = tx.title || "";
        document.getElementById("moneyAmount").value = String(tx.amount || "");
        document.getElementById("moneyDate").value = tx.dateLabel || new Date().toISOString().slice(0, 10);
        const catSel = document.getElementById("moneyCategory");
        if (catSel) catSel.value = tx.category || (activeProfile === "farmer" ? "OTHER_FARM" : "OTHER");
        const sw = document.getElementById("moneySharedWith");
        if (sw) sw.value = activeProfile === "student" ? (tx.sharedWith || "") : "";
        const ct = document.getElementById("moneyCropTag");
        if (ct) ct.value = activeProfile === "farmer" ? (tx.cropTag || "") : "";
        document.getElementById("moneyNote").value = tx.note || "";
        document.getElementById("moneyTxFormHeading").textContent = activeProfile === "farmer" ? "Edit Farmer Entry" : "Edit Student Entry";
        document.getElementById("cancelMoneyEditBtn")?.classList.remove("hidden");
        document.getElementById("moneyTxForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    if (target.dataset.delTx) {
      if (!state.user || !confirm("Delete this financial transaction?")) return;
      const { activeProfile } = getActiveFinancialProfileFromState();
      try {
        await firebaseService.deleteMoneyTransaction(state.user.uid, activeProfile, target.dataset.delTx);
        showToast("Transaction deleted.");
      } catch (err) {
        showToast(err.message || "Delete failed.", true);
      }
      return;
    }
    if (target.dataset.editGoal) {
      const { activeProfile } = getActiveFinancialProfileFromState();
      const goalList = activeProfile === "farmer" ? state.farmerMoneyBudgets : state.studentMoneyBudgets;
      const g = goalList.find((x) => x.id === target.dataset.editGoal);
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
      const { activeProfile } = getActiveFinancialProfileFromState();
      try {
        await firebaseService.deleteFinancialGoal(state.user.uid, activeProfile, target.dataset.delGoal);
        showToast("Budget/goal deleted.");
      } catch (err) {
        showToast(err.message || "Delete failed.", true);
      }
      return;
    }

    // Meetings
    if (target.dataset.copyMeetingUrl) {
      const meetUrl = safeUrl(target.dataset.copyMeetingUrl);
      if (!meetUrl) { showToast("Invalid meeting URL.", true); return; }
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(meetUrl);
        } else {
          const ta = document.createElement("textarea");
          ta.value = meetUrl;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        showToast("Google Meet link copied!");
      } catch (_) {
        showToast("Unable to copy automatically. Long-press the Join button to copy.", true);
      }
      return;
    }
    if (target.dataset.shareMeeting) {
      const meetUrl = safeUrl(target.dataset.shareMeeting);
      const title = target.dataset.shareMeetingTitle || "Guru Ji Vision Live Session";
      const time = target.dataset.shareMeetingTime || "";
      if (!meetUrl) { showToast("Invalid meeting URL.", true); return; }
      const shareText = `${title}${time ? ` (${time})` : ""} — Join Google Meet: ${meetUrl}`;
      try {
        if (navigator.share) {
          await navigator.share({ title, text: shareText, url: meetUrl });
          showToast("Meeting shared!");
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareText);
          showToast("Meeting invite copied to clipboard!");
        } else {
          showToast("Copy the link from the Join button to share.");
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          showToast("Could not open share menu. Try Copy Link instead.", true);
        }
      }
      return;
    }
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
        const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
        setVal("amEditId", m.id);
        setVal("amFileName", m.fileName || "");
        setVal("amFileType", m.fileType || "");
        setVal("amTitle", m.title || "");
        setVal("amTitleBn", m.titleBn || "");
        setVal("amSemester", String(m.semester || 1));
        setVal("amCategory", m.category || "NOTES_PDF");
        setVal("amSubjectKey", m.subjectKey || resolveSubjectKey(m.subject, m.title));
        setVal("amSubject", m.subject || "");
        setVal("amTopic", m.topic || "");
        setVal("amLanguage", m.language || "EN");
        setVal("amUrl", m.resourceUrl || "");
        setVal("amSourceName", m.sourceName || "");
        setVal("amSourceUrl", m.sourceUrl || "");
        setVal("amReference", m.referenceCitation || "");
        setVal("amLastUpdated", m.lastUpdatedDate || "");
        setVal("amOrigin", m.contentOrigin || "VERIFIED_FACULTY");
        setVal("amSummary", m.summary || "");
        setVal("amContent", m.contentText || "");
        const metaEl = document.getElementById("amUploadMeta");
        if (metaEl && m.fileName) metaEl.textContent = `Attached: ${m.fileName} (${m.fileType || "DOC"})`;
        const pubEl = document.getElementById("amPublished");
        if (pubEl) pubEl.checked = m.published !== false;
        const aiEl = document.getElementById("amVerifiedAi");
        if (aiEl) aiEl.checked = m.verifiedForAi !== false;
        const dlEl = document.getElementById("amDownloadOk");
        if (dlEl) dlEl.checked = Boolean(m.downloadPermitted);
        document.getElementById("amFormTitle").textContent = "Edit Agriculture Note / Document";
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
        const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
        setVal("aqEditId", q.id);
        setVal("aqTitle", q.title || "");
        setVal("aqSem", String(q.semester || 1));
        setVal("aqSubjectKey", q.subjectKey || resolveSubjectKey(q.subject, q.title));
        setVal("aqSubject", q.subject || "");
        setVal("aqTopic", q.topic || "");
        setVal("aqQuestionType", q.questionType || "PRACTICE");
        setVal("aqDifficulty", q.difficulty || "MEDIUM");
        setVal("aqExamCategory", q.examCategory || "BSC_SEMESTER");
        setVal("aqExamYear", q.examYear || "");
        setVal("aqSourcePaper", q.sourcePaper || "");
        setVal("aqSourceUrl", q.sourceUrl || "");
        setVal("aqQuestion", q.questionText || "");
        [0, 1, 2, 3].forEach((i) => {
          setVal(`aqOpt${i}`, q.options?.[i] || "");
        });
        setVal("aqCorrect", String(q.correctIndex ?? 0));
        setVal("aqExplanation", q.explanation || "");
        const pubEl = document.getElementById("aqPublished");
        if (pubEl) pubEl.checked = q.published !== false;
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
    if (target.dataset.editScheme) {
      const merged = mergeAgricultureSchemes(state.agricultureSchemes || [], true);
      const s = merged.find((x) => x.id === target.dataset.editScheme);
      if (s) {
        const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ""; };
        setVal("asEditCloudId", s.cloudId || "");
        setVal("asSlug", s.id || "");
        setVal("asName", s.name || "");
        setVal("asNameBn", s.nameBn || "");
        setVal("asCategory", s.category || "OTHER_AGRI");
        setVal("asLevel", s.govtLevel || "CENTRAL");
        setVal("asState", s.applicableState || "All India");
        setVal("asStatus", s.status || "ACTIVE");
        setVal("asRegion", s.applicableRegion || "");
        setVal("asRegionBn", s.applicableRegionBn || "");
        setVal("asDistricts", Array.isArray(s.applicableDistricts) ? s.applicableDistricts.join(", ") : "");
        setVal("asPurpose", s.purpose || "");
        setVal("asPurposeBn", s.purposeBn || "");
        setVal("asBenefits", s.benefits || "");
        setVal("asBenefitsBn", s.benefitsBn || "");
        setVal("asEligCat", s.eligibility?.eligibleCategories || "");
        setVal("asEligCatBn", s.eligibility?.eligibleCategoriesBn || "");
        setVal("asEligLand", s.eligibility?.landholding || "");
        setVal("asEligLandBn", s.eligibility?.landholdingBn || "");
        setVal("asEligTenant", s.eligibility?.tenantFarmers || "");
        setVal("asEligTenantBn", s.eligibility?.tenantFarmersBn || "");
        setVal("asEligWomen", s.eligibility?.womenFarmers || "");
        setVal("asEligWomenBn", s.eligibility?.womenFarmersBn || "");
        setVal("asEligAge", s.eligibility?.ageLimit || "");
        setVal("asEligAgeBn", s.eligibility?.ageLimitBn || "");
        setVal("asEligIncome", s.eligibility?.incomeLimit || "");
        setVal("asEligIncomeBn", s.eligibility?.incomeLimitBn || "");
        setVal("asEligRes", s.eligibility?.residency || "");
        setVal("asEligResBn", s.eligibility?.residencyBn || "");
        setVal("asWhoCan", Array.isArray(s.whoCanApply) ? s.whoCanApply.join("\n") : "");
        setVal("asWhoCanBn", Array.isArray(s.whoCanApplyBn) ? s.whoCanApplyBn.join("\n") : "");
        setVal("asWhoCannot", Array.isArray(s.whoCannotApply) ? s.whoCannotApply.join("\n") : "");
        setVal("asWhoCannotBn", Array.isArray(s.whoCannotApplyBn) ? s.whoCannotApplyBn.join("\n") : "");
        setVal(
          "asDocs",
          Array.isArray(s.requiredDocuments)
            ? s.requiredDocuments.map((d) => `${d.en || ""} | ${d.bn || ""} | ${d.mandatory === false ? "optional" : "mandatory"}`).join("\n")
            : ""
        );
        setVal("asOnline", s.applicationProcess || "");
        setVal("asOnlineBn", s.applicationProcessBn || "");
        setVal("asPortalUrl", s.officialPortalUrl || "");
        setVal("asOffline", s.offlineProcess || "");
        setVal("asOfflineBn", s.offlineProcessBn || "");
        setVal("asDept", s.department || "");
        setVal("asDeptBn", s.departmentBn || "");
        setVal("asHelpline", s.helpline || "");
        setVal("asHelplineBn", s.helplineBn || "");
        setVal("asHelplineTel", s.helplineTel || "");
        setVal("asVerifiedDate", s.lastVerifiedDate || new Date().toISOString().slice(0, 10));
        setVal("asDeadline", s.deadline || "");
        setVal("asDeadlineBn", s.deadlineBn || "");
        setVal("asSourceUrl", s.officialSourceUrl || s.officialPortalUrl || "");
        setVal("asSourceName", s.officialSourceName || "");
        setVal("asUpdateNote", s.lastUpdateNote || "");
        const pubEl = document.getElementById("asPublished");
        if (pubEl) pubEl.checked = s.published !== false;
        const womEl = document.getElementById("asWomenEligible");
        if (womEl) womEl.checked = s.womenFarmerEligible !== false;
        const titleEl = document.getElementById("asFormTitle");
        if (titleEl) titleEl.textContent = `Edit Scheme: ${s.name}`;
        document.getElementById("asCancelEdit")?.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (target.dataset.toggleSchemePub && state.user && state.isAdmin) {
      const merged = mergeAgricultureSchemes(state.agricultureSchemes || [], true);
      const s = merged.find((x) => x.id === target.dataset.toggleSchemePub);
      if (s) {
        const nextPub = s.published === false;
        try {
          await firebaseService.toggleAgricultureSchemePublishAsAdmin(state.user.uid, state.user.email || "", s, nextPub);
          showToast(nextPub ? "Scheme published to farmers!" : "Scheme unpublished from public view.");
        } catch (err) { showToast(err.message || "Publish toggle failed.", true); }
      }
      return;
    }
    if (target.dataset.markSchemeOutdated && state.user && state.isAdmin) {
      const merged = mergeAgricultureSchemes(state.agricultureSchemes || [], true);
      const s = merged.find((x) => x.id === target.dataset.markSchemeOutdated);
      if (s) {
        if (!confirm(`Mark "${s.name}" as OUTDATED so farmers see an unverified warning until re-verified?`)) return;
        try {
          await firebaseService.markAgricultureSchemeStatusAsAdmin(
            state.user.uid,
            state.user.email || "",
            s,
            "OUTDATED",
            "Marked outdated by Admin pending official re-verification."
          );
          showToast("Scheme marked as OUTDATED (unverified warning now shown to farmers).");
        } catch (err) { showToast(err.message || "Status update failed.", true); }
      }
      return;
    }
    if (target.dataset.delScheme && state.user && state.isAdmin) {
      const sName = target.dataset.delSchemeName || "this scheme";
      if (!confirm(`Delete cloud record for "${sName}"?`)) return;
      try {
        await firebaseService.deleteAgricultureSchemeAsAdmin(state.user.uid, state.user.email || "", target.dataset.delScheme, sName);
        showToast("Cloud scheme record removed.");
      } catch (err) { showToast(err.message || "Delete failed.", true); }
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
      const file = e.target.files[0];
      const check = validateStudyDocumentFile(file);
      if (!check.ok) {
        showToast(check.error, true);
        e.target.value = "";
        return;
      }
      try {
        showToast(`Uploading ${check.fileType} document to Firebase Storage...`);
        const url = await firebaseService.uploadPdfToStorage(file);
        const urlInput = document.getElementById("amUrl");
        if (urlInput) urlInput.value = url;
        const nameEl = document.getElementById("amFileName");
        if (nameEl) nameEl.value = check.safeName;
        const typeEl = document.getElementById("amFileType");
        if (typeEl) typeEl.value = check.fileType;
        const metaEl = document.getElementById("amUploadMeta");
        if (metaEl) metaEl.textContent = `Uploaded: ${check.safeName} (${check.fileType})`;
        showToast(`${check.fileType} uploaded! Cloud URL attached automatically.`);
      } catch (err) {
        showToast(err.message || "Storage upload failed. Paste a verified document URL instead.", true);
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

      // Private Money Transaction (Strictly Isolated Student vs Farmer Profile)
      if (form.id === "moneyTxForm" && state.user) {
        await withBusySubmit(form, async () => {
          const editId = document.getElementById("moneyEditId")?.value || "";
          const { activeProfile } = getActiveFinancialProfileFromState();
          await firebaseService.saveMoneyTransaction(
            state.user.uid,
            activeProfile,
            {
              title: document.getElementById("moneyTitle").value,
              amount: document.getElementById("moneyAmount").value,
              type: state.moneyFormType,
              category: document.getElementById("moneyCategory").value,
              dateLabel: document.getElementById("moneyDate").value,
              sharedWith: activeProfile === "student" ? (document.getElementById("moneySharedWith")?.value || "") : "",
              cropTag: activeProfile === "farmer" ? (document.getElementById("moneyCropTag")?.value || "") : "",
              note: document.getElementById("moneyNote").value
            },
            editId
          );
          form.reset();
          document.getElementById("moneyEditId").value = "";
          showToast(
            editId
              ? `${activeProfile === "farmer" ? "Farmer" : "Student"} financial entry updated!`
              : `Saved privately to your ${activeProfile === "farmer" ? "Farmer" : "Student"} Financial Profile.`
          );
        });
        return;
      }

      // Private Financial Goal (Strictly Isolated Student vs Farmer Profile)
      if (form.id === "moneyGoalForm" && state.user) {
        await withBusySubmit(form, async () => {
          const editId = document.getElementById("goalEditId")?.value || "";
          const { activeProfile } = getActiveFinancialProfileFromState();
          await firebaseService.saveFinancialGoal(
            state.user.uid,
            activeProfile,
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
          showToast(
            editId
              ? `${activeProfile === "farmer" ? "Farmer" : "Student"} budget / goal updated!`
              : `Saved to your ${activeProfile === "farmer" ? "Farmer" : "Student"} Financial Profile!`
          );
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
              titleBn: document.getElementById("amTitleBn")?.value || "",
              semester: document.getElementById("amSemester").value,
              category: document.getElementById("amCategory").value,
              subjectKey: document.getElementById("amSubjectKey")?.value || resolveSubjectKey(document.getElementById("amSubject").value, document.getElementById("amTitle").value),
              subject: document.getElementById("amSubject").value,
              topic: document.getElementById("amTopic")?.value || "",
              language: document.getElementById("amLanguage")?.value || "EN",
              fileName: document.getElementById("amFileName")?.value || "",
              fileType: document.getElementById("amFileType")?.value || "",
              resourceUrl: document.getElementById("amUrl").value,
              sourceName: document.getElementById("amSourceName")?.value || "",
              sourceUrl: document.getElementById("amSourceUrl")?.value || "",
              referenceCitation: document.getElementById("amReference")?.value || "",
              lastUpdatedDate: document.getElementById("amLastUpdated")?.value || new Date().toISOString().slice(0, 10),
              contentOrigin: document.getElementById("amOrigin")?.value || "VERIFIED_FACULTY",
              downloadPermitted: Boolean(document.getElementById("amDownloadOk")?.checked),
              summary: document.getElementById("amSummary").value,
              contentText: document.getElementById("amContent").value,
              published: document.getElementById("amPublished").checked,
              verifiedForAi: document.getElementById("amVerifiedAi").checked
            },
            editId
          );
          form.reset();
          document.getElementById("amEditId").value = "";
          const fnEl = document.getElementById("amFileName");
          if (fnEl) fnEl.value = "";
          const ftEl = document.getElementById("amFileType");
          if (ftEl) ftEl.value = "";
          const metaEl = document.getElementById("amUploadMeta");
          if (metaEl) metaEl.textContent = "Uploaded files attach their cloud URL automatically.";
          showToast(editId ? "Agriculture note updated live!" : "Agriculture note saved live to Firestore!");
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
              subjectKey: document.getElementById("aqSubjectKey")?.value || resolveSubjectKey(document.getElementById("aqSubject").value, document.getElementById("aqTitle").value),
              subject: document.getElementById("aqSubject").value,
              topic: document.getElementById("aqTopic")?.value || "",
              questionType: document.getElementById("aqQuestionType")?.value || "PRACTICE",
              difficulty: document.getElementById("aqDifficulty")?.value || "MEDIUM",
              examCategory: document.getElementById("aqExamCategory")?.value || "BSC_SEMESTER",
              examYear: document.getElementById("aqExamYear")?.value || "",
              sourcePaper: document.getElementById("aqSourcePaper")?.value || "",
              sourceUrl: document.getElementById("aqSourceUrl")?.value || "",
              questionText: document.getElementById("aqQuestion").value,
              options: [0, 1, 2, 3].map((i) => document.getElementById(`aqOpt${i}`).value),
              correctIndex: document.getElementById("aqCorrect").value,
              explanation: document.getElementById("aqExplanation").value,
              published: document.getElementById("aqPublished") ? document.getElementById("aqPublished").checked : true
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

      // Admin Agriculture Government Scheme (Create & Edit + History Audit Log)
      if (form.id === "adminSchemeForm" && state.user && state.isAdmin) {
        await withBusySubmit(form, async () => {
          const val = (id) => document.getElementById(id)?.value || "";
          const splitLines = (raw) => String(raw || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
          const parseDocs = (raw) => splitLines(raw).map((line) => {
            const parts = line.split("|").map((p) => p.trim());
            const en = parts[0] || "";
            const bn = parts[1] || en;
            const mandRaw = (parts[2] || "mandatory").toLowerCase();
            return { en, bn, mandatory: !["optional", "false", "no", "if applicable"].includes(mandRaw) };
          }).filter((d) => d.en || d.bn);

          const editCloudId = val("asEditCloudId");
          const districts = val("asDistricts").split(",").map((d) => d.trim()).filter(Boolean);
          await firebaseService.saveAgricultureSchemeAsAdmin(
            state.user.uid,
            state.user.email || "",
            {
              schemeSlug: val("asSlug") || val("asName"),
              name: val("asName"),
              nameBn: val("asNameBn"),
              category: val("asCategory"),
              govtLevel: val("asLevel"),
              applicableState: val("asState"),
              applicableRegion: val("asRegion") || val("asState"),
              applicableRegionBn: val("asRegionBn"),
              applicableDistricts: districts,
              purpose: val("asPurpose"),
              purposeBn: val("asPurposeBn"),
              benefits: val("asBenefits"),
              benefitsBn: val("asBenefitsBn"),
              eligibleCategories: val("asEligCat"),
              eligibleCategoriesBn: val("asEligCatBn"),
              landholding: val("asEligLand"),
              landholdingBn: val("asEligLandBn"),
              tenantFarmers: val("asEligTenant"),
              tenantFarmersBn: val("asEligTenantBn"),
              womenFarmers: val("asEligWomen"),
              womenFarmersBn: val("asEligWomenBn"),
              ageLimit: val("asEligAge"),
              ageLimitBn: val("asEligAgeBn"),
              incomeLimit: val("asEligIncome"),
              incomeLimitBn: val("asEligIncomeBn"),
              residency: val("asEligRes"),
              residencyBn: val("asEligResBn"),
              whoCanApply: splitLines(val("asWhoCan")),
              whoCanApplyBn: splitLines(val("asWhoCanBn")),
              whoCannotApply: splitLines(val("asWhoCannot")),
              whoCannotApplyBn: splitLines(val("asWhoCannotBn")),
              requiredDocuments: parseDocs(val("asDocs")),
              applicationProcess: val("asOnline"),
              applicationProcessBn: val("asOnlineBn"),
              officialPortalUrl: val("asPortalUrl"),
              offlineProcess: val("asOffline"),
              offlineProcessBn: val("asOfflineBn"),
              department: val("asDept"),
              departmentBn: val("asDeptBn"),
              helpline: val("asHelpline"),
              helplineBn: val("asHelplineBn"),
              helplineTel: val("asHelplineTel"),
              deadline: val("asDeadline"),
              deadlineBn: val("asDeadlineBn"),
              status: val("asStatus"),
              lastVerifiedDate: val("asVerifiedDate"),
              officialSourceUrl: val("asSourceUrl"),
              officialSourceName: val("asSourceName"),
              lastUpdateNote: val("asUpdateNote"),
              womenFarmerEligible: document.getElementById("asWomenEligible")?.checked !== false,
              published: document.getElementById("asPublished")?.checked !== false
            },
            editCloudId
          );
          form.reset();
          document.getElementById("asEditCloudId").value = "";
          document.getElementById("asSlug").value = "";
          document.getElementById("asFormTitle").textContent = "Add / Update Agriculture Govt Scheme";
          document.getElementById("asCancelEdit")?.classList.add("hidden");
          showToast(editCloudId ? "Government scheme updated live & logged to history!" : "Government scheme saved live & logged to history!");
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

  // Browser Back/Forward (popstate) & Hash deep link listeners
  const syncRouteFromLocation = (popState) => {
    const h = (window.location.hash || "").replace(/^#/, "");
    const targetRoute = (h && VALID_ROUTES.has(h)) ? h : (popState?.route && VALID_ROUTES.has(popState.route) ? popState.route : "home");
    if (popState && typeof popState.lastZone === "string") {
      state.lastZone = popState.lastZone;
    }
    if (targetRoute !== state.route) {
      navigateTo(targetRoute, false);
    }
  };
  window.addEventListener("popstate", (e) => syncRouteFromLocation(e.state));
  window.addEventListener("hashchange", () => syncRouteFromLocation(null));

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
bindWomenFarmerEvents({
  state,
  renderActiveView,
  showToast,
  withBusySubmit,
  openAuthModal,
  navigateTo
});
bindAgriEducationEvents({
  state,
  renderActiveView,
  showToast,
  withBusySubmit,
  openAuthModal
});
bindEduCmsEvents({
  state,
  renderActiveView,
  showToast,
  withBusySubmit
});
bindWomenCmsEvents({
  state,
  renderActiveView,
  showToast,
  withBusySubmit
});
bindWomenNearbyEvents({
  state,
  renderActiveView,
  showToast,
  withBusySubmit,
  openAuthModal
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
      let swReloading = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (state.userRequestedSwUpdate && !swReloading) {
          swReloading = true;
          window.location.reload();
        }
      });
    } catch (_) {}
  });
}
