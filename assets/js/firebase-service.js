// ============================================================================
// Guru Ji Vision — Firebase v10 Modular CDN Data & Authentication Layer
// Preserves exact Firestore collections, field schemas, and security rules
// from com.aistudio.gurujivision.v2prod (ZERO weakening of firestore.rules)
// ============================================================================

import {
  FIREBASE_CONFIG,
  FIRESTORE_DATABASE_ID,
  FOUNDER_EMAIL,
  OFFICIAL_FACULTY,
  KNOWN_FACULTY_EMAILS,
  DEFAULT_APP_SETTINGS
} from "./config.js";
import { buildDoubtChatId, getTimestampMs, isValidGoogleMeetUrl, parseMeetingEpochMs } from "./calculators.js";
import {
  buildScopedBudgetPayload,
  buildScopedTransactionPayload,
  classifyLegacyBudget,
  classifyLegacyTransaction,
  getAllowedFinancialProfiles,
  getBudgetCollectionName,
  getTransactionCollectionName,
  normalizeProfileType
} from "./money-profile-utils.js";

const FB_CDN = "https://www.gstatic.com/firebasejs/10.14.1";

const REDIRECT_PENDING_KEY = "gjv_google_redirect_pending";
const REDIRECT_PENDING_TTL_MS = 5 * 60 * 1000;

class FirebaseService {
  constructor() {
    this.ready = false;
    this.app = null;
    this.auth = null;
    this.db = null;
    this.storage = null;
    this.mods = null;
    this.authInFlight = false;
    this.redirectHandled = false;
    this.lastRedirectReturnedEmpty = false;
    this.activeUnsubs = new Map();
    this.initPromise = null;
    this.authUnsub = null;
    this.publicSubScopeKey = null;
    this.privateSubKey = null;
    this.financialProfileSubKey = null;
    this.migratedFinancialScopeKeys = new Set();
    this.profileSubUid = null;
    this.doubtSubKey = null;
    this.ownerTelemetrySubscribed = false;
  }

  getEffectiveFirebaseConfig() {
    const cfg = { ...FIREBASE_CONFIG };
    if (
      typeof window !== "undefined" &&
      window.GJV_USE_SAME_ORIGIN_AUTH_DOMAIN === true &&
      window.location?.protocol === "https:" &&
      window.location?.hostname
    ) {
      cfg.authDomain = window.location.hostname;
    }
    return cfg;
  }

  isMobileOrStandaloneBrowser() {
    if (typeof window === "undefined" || typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
    const isStandalone =
      Boolean(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      Boolean(navigator.standalone);
    return isMobileUa || isStandalone;
  }

  markRedirectPending() {
    try {
      sessionStorage.setItem(REDIRECT_PENDING_KEY, String(Date.now()));
    } catch (_) {}
  }

  clearRedirectPending() {
    try {
      sessionStorage.removeItem(REDIRECT_PENDING_KEY);
    } catch (_) {}
  }

  hasPendingRedirect() {
    try {
      const raw = sessionStorage.getItem(REDIRECT_PENDING_KEY);
      if (!raw) return false;
      const ts = Number(raw);
      if (!Number.isFinite(ts) || Date.now() - ts > REDIRECT_PENDING_TTL_MS) {
        sessionStorage.removeItem(REDIRECT_PENDING_KEY);
        return false;
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  async init(onAuthCallback, onPublicUpdate, onRedirectOutcome) {
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = (async () => {
      try {
        const [appMod, authMod, fsMod, storageMod] = await Promise.all([
          import(`${FB_CDN}/firebase-app.js`),
          import(`${FB_CDN}/firebase-auth.js`),
          import(`${FB_CDN}/firebase-firestore.js`),
          import(`${FB_CDN}/firebase-storage.js`)
        ]);

        // Initialize Firebase strictly once — never create a second app instance
        const effectiveConfig = this.getEffectiveFirebaseConfig();
        this.app = appMod.getApps().length > 0 ? appMod.getApp() : appMod.initializeApp(effectiveConfig);
        this.auth = authMod.getAuth(this.app);
        this.db = fsMod.getFirestore(this.app, FIRESTORE_DATABASE_ID);
        this.storage = storageMod.getStorage(this.app);
        this.mods = { appMod, authMod, fsMod, storageMod };
        this.ready = true;

        // Persist authenticated session reliably across page refreshes & mobile tabs
        try {
          await authMod.setPersistence(this.auth, authMod.browserLocalPersistence);
        } catch (persistErr) {
          console.warn("Auth persistence fallback:", persistErr);
        }

        // Immediately subscribe to public collections so visitors see live updates without login
        if (onPublicUpdate) {
          this.subscribePublicCollections({ isAdmin: false, isSuperAdmin: false, isAuthorizedMeetingHost: false, onUpdate: onPublicUpdate });
        }

        // Process Google Sign-In redirect result strictly ONCE during app initialization
        if (!this.redirectHandled) {
          this.redirectHandled = true;
          const wasRedirectPending = this.hasPendingRedirect();
          this.clearRedirectPending();

          try {
            const redirectRes = await authMod.getRedirectResult(this.auth);
            if (redirectRes?.user) {
              this.lastRedirectReturnedEmpty = false;
              if (onRedirectOutcome) {
                onRedirectOutcome({ ok: true, user: redirectRes.user, fromRedirect: true });
              }
            } else if (wasRedirectPending && !this.auth.currentUser) {
              // Browser blocked third-party redirect storage (e.g. strict mobile/Safari cookie blocking)
              this.lastRedirectReturnedEmpty = true;
              if (onRedirectOutcome) {
                onRedirectOutcome({
                  ok: false,
                  redirectEmpty: true,
                  error: "Your browser blocked login cookies during full-page redirect. Tap 'Continue with Google' again to sign in via direct Google popup."
                });
              }
            }
          } catch (redirectErr) {
            if (onRedirectOutcome) {
              onRedirectOutcome({
                ok: false,
                code: redirectErr?.code || "",
                error: this.formatAuthError(redirectErr)
              });
            }
          }
        }

        // Attach strictly ONE onAuthStateChanged listener for the lifetime of the app
        if (typeof this.authUnsub === "function") {
          try { this.authUnsub(); } catch (_) {}
        }
        this.authUnsub = authMod.onAuthStateChanged(this.auth, async (user) => {
          if (onAuthCallback) await onAuthCallback(user);
        });
        return true;
      } catch (err) {
        console.warn("Firebase CDN unavailable; running in offline/fallback mode.", err);
        this.ready = false;
        if (onAuthCallback) await onAuthCallback(null);
        return false;
      }
    })();
    return this.initPromise;
  }

  // --------------------------------------------------------------------------
  // GOOGLE-ONLY AUTHENTICATION (Desktop Popup + Mobile Redirect + Safe Linking)
  // --------------------------------------------------------------------------
  formatAuthError(err) {
    const code = err?.code || "";
    if (code === "auth/unauthorized-domain") {
      const host = typeof window !== "undefined" ? window.location.hostname : "this domain";
      return `The domain "${host}" is not yet listed in Firebase Console → Authentication → Settings → Authorized domains. Add it in Firebase Console to enable Google Sign-In.`;
    }
    if (code === "auth/popup-blocked") {
      return "Your browser blocked the Google Sign-In popup. Switching to full-page Google Sign-In...";
    }
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      return "Google Sign-In was closed before finishing. Tap 'Continue with Google' to try again, or use the full-page redirect option below.";
    }
    if (code === "auth/network-request-failed") {
      return "Network connection error. Please check your internet connection and try again.";
    }
    if (code === "auth/account-exists-with-different-credential") {
      return "An account already exists with this email under another sign-in method. Please sign in with your existing account to link Google safely.";
    }
    if (code === "auth/credential-already-in-use") {
      return "This Google Account is already linked to another Guru Ji Vision account. Sign out and continue with that Google Account directly to preserve its data.";
    }
    if (code === "auth/provider-already-linked") {
      return "Your Google Account is already linked to this Guru Ji Vision profile.";
    }
    if (code === "auth/operation-not-allowed") {
      return "Google Sign-In is not enabled in Firebase Console → Authentication → Sign-in method → Google.";
    }
    if (code === "auth/too-many-requests") {
      return "Too many sign-in attempts from this device. Please wait a moment and try again.";
    }
    if (code === "auth/web-storage-unsupported") {
      return "Browser cookies or storage are disabled. Please enable cookies for this site and try again.";
    }
    return err?.message || "Google Sign-In could not be completed. Please try again.";
  }

  async signInWithGoogle({ forceMethod = "" } = {}) {
    if (!this.ready) {
      return { ok: false, error: "Firebase Authentication is currently offline. Please check your internet connection." };
    }
    if (this.authInFlight) {
      return { ok: false, inFlight: true, error: "Google Sign-In is already in progress. Please wait..." };
    }

    this.authInFlight = true;
    try {
      const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = this.mods.authMod;
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      // On Android Chrome, mobile browsers, and installed PWAs, prefer signInWithRedirect()
      // to prevent popup blocking & accidental popup closure.
      // If a previous redirect returned empty due to strict third-party cookie blocking, fall back to popup.
      const shouldUseRedirect =
        forceMethod === "redirect" ||
        (forceMethod !== "popup" && this.isMobileOrStandaloneBrowser() && !this.lastRedirectReturnedEmpty);

      if (shouldUseRedirect) {
        this.markRedirectPending();
        await signInWithRedirect(this.auth, provider);
        return { ok: true, redirecting: true };
      }

      // Desktop browsers (or popup fallback)
      try {
        const res = await signInWithPopup(this.auth, provider);
        this.lastRedirectReturnedEmpty = false;
        return { ok: true, user: res.user };
      } catch (popupErr) {
        const code = popupErr?.code || "";
        // Automatic safe redirect fallback for browser popup limitations
        if (
          code === "auth/popup-blocked" ||
          code === "auth/operation-not-supported-in-this-environment" ||
          code === "auth/web-storage-unsupported" ||
          code === "auth/internal-error"
        ) {
          this.markRedirectPending();
          await signInWithRedirect(this.auth, provider);
          return { ok: true, redirecting: true };
        }
        const offerRedirectFallback =
          code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";
        return {
          ok: false,
          code,
          offerRedirectFallback,
          error: this.formatAuthError(popupErr)
        };
      }
    } catch (err) {
      this.clearRedirectPending();
      return { ok: false, code: err?.code || "", error: this.formatAuthError(err) };
    } finally {
      this.authInFlight = false;
    }
  }

  // Safe migration helper: allows any legacy non-Google session to link Google to the same UID
  async linkGoogleAccount() {
    if (!this.ready || !this.auth.currentUser) {
      return { ok: false, error: "Sign in first to link your Google Account." };
    }
    if (this.authInFlight) {
      return { ok: false, inFlight: true, error: "Request already in progress." };
    }

    this.authInFlight = true;
    try {
      const { GoogleAuthProvider, linkWithPopup, linkWithRedirect } = this.mods.authMod;
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      if (this.isMobileOrStandaloneBrowser() && !this.lastRedirectReturnedEmpty) {
        this.markRedirectPending();
        await linkWithRedirect(this.auth.currentUser, provider);
        return { ok: true, redirecting: true };
      }

      try {
        const res = await linkWithPopup(this.auth.currentUser, provider);
        return { ok: true, user: res.user };
      } catch (err) {
        const code = err?.code || "";
        if (
          code === "auth/popup-blocked" ||
          code === "auth/operation-not-supported-in-this-environment" ||
          code === "auth/web-storage-unsupported"
        ) {
          this.markRedirectPending();
          await linkWithRedirect(this.auth.currentUser, provider);
          return { ok: true, redirecting: true };
        }
        return { ok: false, code, error: this.formatAuthError(err) };
      }
    } catch (err) {
      this.clearRedirectPending();
      return { ok: false, code: err?.code || "", error: this.formatAuthError(err) };
    } finally {
      this.authInFlight = false;
    }
  }

  async signOutUser() {
    this.unsubscribePrivate();
    this.clearRedirectPending();
    this.lastRedirectReturnedEmpty = false;
    if (this.ready && this.auth.currentUser) {
      await this.mods.authMod.signOut(this.auth);
    }
  }

  // --------------------------------------------------------------------------
  // ROLE VERIFICATION (Strictly server/token/Firestore backed — zero hardcoded pass)
  // --------------------------------------------------------------------------
  async resolveUserRoles(user) {
    if (!user || !this.ready) {
      return {
        isSuperAdmin: false,
        isAdmin: false,
        facultyIdentity: { isAuthorizedProfessor: false, canHostMeetings: false, professorId: "", professorName: "", matchedByEmail: "", matchedByAccountLink: false }
      };
    }

    const emailLower = (user.email || "").trim().toLowerCase();
    const isVerifiedEmail = Boolean(user.emailVerified && emailLower);
    let idTokenClaims = {};
    try {
      const tokenRes = await user.getIdTokenResult();
      idTokenClaims = tokenRes?.claims || {};
    } catch (_) {}

    const isSuperAdmin =
      (isVerifiedEmail && emailLower === FOUNDER_EMAIL) ||
      idTokenClaims.founder === true ||
      idTokenClaims.role === "FOUNDER";

    let isAdmin = isSuperAdmin;
    if (!isAdmin) {
      try {
        const snap = await this.mods.fsMod.getDoc(this.mods.fsMod.doc(this.db, "admins", user.uid));
        isAdmin = snap.exists();
      } catch (_) {}
    }

    // Check professor identity via /professorAccounts/{uid} OR verified known faculty email
    let facultyIdentity = {
      isAuthorizedProfessor: false,
      canHostMeetings: isAdmin,
      professorId: "",
      professorName: "",
      matchedByEmail: "",
      matchedByAccountLink: false
    };

    try {
      const profAccSnap = await this.mods.fsMod.getDoc(this.mods.fsMod.doc(this.db, "professorAccounts", user.uid));
      if (profAccSnap.exists()) {
        const d = profAccSnap.data();
        if (d.active && d.professorId) {
          const matched = OFFICIAL_FACULTY.find((p) => p.id === d.professorId);
          facultyIdentity = {
            isAuthorizedProfessor: true,
            canHostMeetings: Boolean(d.canHostMeetings) || isAdmin,
            professorId: d.professorId,
            professorName: matched?.name || user.displayName || "Professor",
            matchedByEmail: isVerifiedEmail ? emailLower : "",
            matchedByAccountLink: true
          };
        }
      }
    } catch (_) {}

    if (!facultyIdentity.isAuthorizedProfessor && isVerifiedEmail && KNOWN_FACULTY_EMAILS.has(emailLower)) {
      const matched = OFFICIAL_FACULTY.find((p) => p.email.toLowerCase() === emailLower);
      if (matched) {
        facultyIdentity = {
          isAuthorizedProfessor: true,
          canHostMeetings: Boolean(matched.canHostMeetings) || isAdmin,
          professorId: matched.id,
          professorName: matched.name,
          matchedByEmail: emailLower,
          matchedByAccountLink: false
        };
      }
    }

    return { isSuperAdmin, isAdmin, facultyIdentity };
  }

  // --------------------------------------------------------------------------
  // SUBSCRIPTION MANAGER
  // --------------------------------------------------------------------------
  setSub(key, unsub) {
    const prev = this.activeUnsubs.get(key);
    if (typeof prev === "function") {
      try { prev(); } catch (_) {}
    }
    if (typeof unsub === "function") {
      this.activeUnsubs.set(key, unsub);
    } else {
      this.activeUnsubs.delete(key);
    }
  }

  unsubscribePrivate() {
    const publicKeys = new Set([
      "studyMaterials", "quizzes", "careerOpportunities", "communityPosts",
      "announcements", "meetings", "professors", "appSettings", "firestoreMarketPrices",
      "agricultureSchemes", "universitySyllabi", "discoveredStudyResources"
    ]);
    for (const [key, unsub] of this.activeUnsubs.entries()) {
      if (!publicKeys.has(key)) {
        try { unsub(); } catch (_) {}
        this.activeUnsubs.delete(key);
      }
    }
    this.privateSubKey = null;
    this.financialProfileSubKey = null;
    this.migratedFinancialScopeKeys.clear();
    this.profileSubUid = null;
    this.doubtSubKey = null;
    this.ownerTelemetrySubscribed = false;
  }

  unsubscribeAll() {
    for (const unsub of this.activeUnsubs.values()) {
      try { unsub(); } catch (_) {}
    }
    this.activeUnsubs.clear();
    this.publicSubScopeKey = null;
    this.privateSubKey = null;
    this.financialProfileSubKey = null;
    this.migratedFinancialScopeKeys.clear();
    this.profileSubUid = null;
    this.doubtSubKey = null;
    this.ownerTelemetrySubscribed = false;
  }

  getActiveSubscriptionStats() {
    return {
      count: this.activeUnsubs.size,
      keys: Array.from(this.activeUnsubs.keys()),
      publicSubScopeKey: this.publicSubScopeKey,
      privateSubKey: this.privateSubKey,
      hasAuthListener: typeof this.authUnsub === "function"
    };
  }

  // --------------------------------------------------------------------------
  // 1. USER PROFILE (/users/{uid}) — Preserves existing fields & anti-escalation
  // --------------------------------------------------------------------------
  async getUserProfileOnce(uid) {
    if (!this.ready || !uid) return null;
    try {
      const snap = await this.mods.fsMod.getDoc(this.mods.fsMod.doc(this.db, "users", uid));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (_) {
      return null;
    }
  }

  // Zero-Friction Automatic Google Profile Provisioning:
  // - Returning users: returns existing Firestore profile UNTOUCHED (never overwrites role or saved data).
  // - First-time Google users: creates a safe basic profile immediately so they enter the app in one click.
  async ensureGoogleUserProfile(user, defaultLanguage = "EN") {
    if (!this.ready || !user) return { profile: null, isNewUser: false };
    const existing = await this.getUserProfileOnce(user.uid);
    if (existing) {
      return { profile: existing, isNewUser: false };
    }

    const { doc, setDoc, serverTimestamp } = this.mods.fsMod;
    const email = (user.email || `${user.uid.slice(0, 12)}@user.gurujivision.app`).trim().slice(0, 120);
    const displayName = (user.displayName || (user.email ? user.email.split("@")[0] : "Scholar")).trim().slice(0, 80) || "Scholar";
    const language = defaultLanguage === "BN" ? "BN" : "EN";

    const newProfile = {
      userId: user.uid,
      displayName,
      email,
      phoneNumber: String(user.phoneNumber || "").trim().slice(0, 25),
      role: "STUDENT",
      requestedRole: "STUDENT",
      professorApprovalStatus: "NONE",
      institutionOrVillage: "",
      district: "",
      state: "",
      department: "",
      subjectSpecialization: "",
      semester: 1,
      language,
      photoUrl: String(user.photoURL || "").slice(0, 500),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp()
    };

    try {
      await setDoc(doc(this.db, "users", user.uid), newProfile);
      return { profile: { id: user.uid, ...newProfile }, isNewUser: true };
    } catch (err) {
      console.warn("Auto-creating initial Google user profile failed:", err);
      return { profile: null, isNewUser: true };
    }
  }

  subscribeUserProfile(uid, onData) {
    if (!this.ready || !uid) return;
    if (this.profileSubUid === uid && this.activeUnsubs.has("userProfile")) return;
    this.profileSubUid = uid;
    const { doc, onSnapshot } = this.mods.fsMod;
    const unsub = onSnapshot(
      doc(this.db, "users", uid),
      (snap) => onData(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      () => onData(null)
    );
    this.setSub("userProfile", unsub);
  }

  async saveUserProfile(user, profileData, existingProfile = null) {
    if (!this.ready || !user) throw new Error("Sign in required.");
    const { doc, setDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const ref = doc(this.db, "users", user.uid);
    const isExisting = Boolean(existingProfile);

    // Schema requires email string 3..120; preserve real email if present or generate phone-scoped address
    const fallbackEmail = user.phoneNumber
      ? `${user.phoneNumber.replace(/[^\d]/g, "")}@phone.gurujivision.app`
      : `${user.uid.slice(0, 12)}@user.gurujivision.app`;
    const email = (profileData.email || user.email || existingProfile?.email || fallbackEmail).trim().slice(0, 120);
    const displayName = (profileData.displayName || user.displayName || existingProfile?.displayName || "Scholar").trim().slice(0, 80) || "Scholar";

    // STRICT PROFESSOR ROLE SECURITY:
    // Non-admin users can register as STUDENT or FARMER directly.
    // Selecting PROFESSOR submits a PENDING verification request; base role stays STUDENT unless already APPROVED by Admin.
    const selectedRole = String(profileData.requestedRole || profileData.role || "STUDENT").toUpperCase();
    const isAlreadyApprovedProf = existingProfile?.role === "PROFESSOR" && existingProfile?.professorApprovalStatus === "APPROVED";

    let safeRole = "STUDENT";
    let requestedRole = "STUDENT";
    let professorApprovalStatus = existingProfile?.professorApprovalStatus || "NONE";

    if (selectedRole === "FARMER") {
      safeRole = "FARMER";
      requestedRole = "FARMER";
      if (!isAlreadyApprovedProf) professorApprovalStatus = "NONE";
    } else if (selectedRole === "PROFESSOR") {
      safeRole = isAlreadyApprovedProf ? "PROFESSOR" : "STUDENT";
      requestedRole = "PROFESSOR";
      professorApprovalStatus = isAlreadyApprovedProf ? "APPROVED" : "PENDING";
    } else {
      safeRole = "STUDENT";
      requestedRole = "STUDENT";
      if (!isAlreadyApprovedProf) professorApprovalStatus = "NONE";
    }

    const semester = safeRole === "STUDENT"
      ? Math.min(8, Math.max(0, parseInt(profileData.semester, 10) || 1))
      : 0;
    const language = profileData.language === "BN" ? "BN" : "EN";
    const phoneNumber = String(user.phoneNumber || profileData.phoneNumber || existingProfile?.phoneNumber || "").trim().slice(0, 25);

    const payload = {
      displayName,
      email,
      phoneNumber,
      role: safeRole,
      requestedRole,
      professorApprovalStatus,
      institutionOrVillage: String(profileData.institutionOrVillage || "").trim().slice(0, 120),
      district: String(profileData.district || "").trim().slice(0, 80),
      state: String(profileData.state || "").trim().slice(0, 80),
      department: String(profileData.department || "").trim().slice(0, 100),
      subjectSpecialization: String(profileData.subjectSpecialization || "").trim().slice(0, 160),
      semester,
      language,
      photoUrl: String(profileData.photoUrl || user.photoURL || existingProfile?.photoUrl || "").slice(0, 500),
      lastActiveAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (isExisting) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, {
        userId: user.uid,
        ...payload,
        createdAt: serverTimestamp()
      });
    }
  }

  // --------------------------------------------------------------------------
  // 2. PUBLIC COLLECTIONS LISTENERS (Runs immediately even BEFORE login!)
  // --------------------------------------------------------------------------
  subscribePublicCollections({ isAdmin = false, isSuperAdmin = false, isAuthorizedMeetingHost = false, onUpdate }) {
    if (!this.ready || !onUpdate) return;
    const scopeKey = `${Boolean(isAdmin)}|${Boolean(isSuperAdmin)}|${Boolean(isAuthorizedMeetingHost)}`;
    const requiredPublicKeys = [
      "studyMaterials", "quizzes", "careerOpportunities", "communityPosts",
      "announcements", "meetings", "professors", "firestoreMarketPrices", "agricultureSchemes",
      "universitySyllabi", "discoveredStudyResources", "appSettings"
    ];
    // Prevent duplicate tear-down and re-subscription when the public query scope has not changed
    if (this.publicSubScopeKey === scopeKey && requiredPublicKeys.every((k) => this.activeUnsubs.has(k))) {
      return;
    }
    this.publicSubScopeKey = scopeKey;
    const { collection, doc, query, where, limit, onSnapshot } = this.mods.fsMod;

    // Study Materials
    const matQ = isAdmin
      ? query(collection(this.db, "studyMaterials"), limit(200))
      : query(collection(this.db, "studyMaterials"), where("published", "==", true), limit(200));
    this.setSub("studyMaterials", onSnapshot(matQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt), fromCloud: true }))
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onUpdate("studyMaterials", list, true);
    }, () => {}));

    // Quizzes
    const quizQ = isAdmin
      ? query(collection(this.db, "quizzes"), limit(200))
      : query(collection(this.db, "quizzes"), where("published", "==", true), limit(200));
    this.setSub("quizzes", onSnapshot(quizQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt) }));
      onUpdate("quizzes", list, true);
    }, () => {}));

    // Career Opportunities
    const carQ = isAdmin
      ? query(collection(this.db, "careerOpportunities"), limit(150))
      : query(collection(this.db, "careerOpportunities"), where("published", "==", true), limit(150));
    this.setSub("careerOpportunities", onSnapshot(carQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt) }))
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onUpdate("careerOpportunities", list, true);
    }, () => {}));

    // Community Posts
    const postQ = isAdmin
      ? query(collection(this.db, "communityPosts"), limit(150))
      : query(collection(this.db, "communityPosts"), where("status", "==", "ACTIVE"), limit(150));
    this.setSub("communityPosts", onSnapshot(postQ, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAtMs: getTimestampMs(d.data().createdAt || d.data().updatedAt),
        updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt)
      })).sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onUpdate("communityPosts", list, true);
    }, () => {}));

    // Announcements
    const annQ = isAdmin
      ? query(collection(this.db, "announcements"), limit(100))
      : query(collection(this.db, "announcements"), where("active", "==", true), limit(100));
    this.setSub("announcements", onSnapshot(annQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt), fromCloud: true }))
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onUpdate("announcements", list, true);
    }, () => {}));

    // Meetings
    const meetQ = isAuthorizedMeetingHost
      ? query(collection(this.db, "meetings"), limit(120))
      : query(collection(this.db, "meetings"), where("published", "==", true), limit(120));
    this.setSub("meetings", onSnapshot(meetQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.scheduledAtEpochMs || 0) - (b.scheduledAtEpochMs || 0));
      onUpdate("meetings", list, true);
    }, () => {}));

    // Professors Directory (merged with authoritative 9 faculty)
    const profQ = isSuperAdmin
      ? query(collection(this.db, "professors"), limit(100))
      : query(collection(this.db, "professors"), where("active", "==", true), limit(100));
    this.setSub("professors", onSnapshot(profQ, (snap) => {
      const map = new Map();
      OFFICIAL_FACULTY.forEach((p) => map.set(p.id, { ...p }));
      snap.docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
      const merged = Array.from(map.values())
        .filter((p) => isSuperAdmin || p.active !== false)
        .sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
      onUpdate("professors", merged, true);
    }, () => {}));

    // Verified Market Prices (Admin-curated & published)
    const mpQ = isAdmin
      ? query(collection(this.db, "marketPrices"), limit(200))
      : query(collection(this.db, "marketPrices"), where("published", "==", true), limit(200));
    this.setSub("firestoreMarketPrices", onSnapshot(mpQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt) }))
        .sort((a, b) => String(b.reportDate || "").localeCompare(String(a.reportDate || "")) || b.updatedAtMs - a.updatedAtMs);
      onUpdate("firestoreMarketPrices", list, true);
    }, () => {}));

    // Agriculture Government Schemes (Admin-managed overrides & additions; public reads published == true only)
    const schemeQ = isAdmin
      ? query(collection(this.db, "agricultureSchemes"), limit(200))
      : query(collection(this.db, "agricultureSchemes"), where("published", "==", true), limit(200));
    this.setSub("agricultureSchemes", onSnapshot(schemeQ, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt)
      })).sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onUpdate("agricultureSchemes", list, true);
    }, () => {}));

    // Agriculture Scheme Update History (Admin-only append-only audit log)
    if (isAdmin) {
      const histQ = query(collection(this.db, "agricultureSchemeHistory"), limit(100));
      this.setSub("agricultureSchemeHistory", onSnapshot(histQ, (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAtMs: getTimestampMs(d.data().createdAt)
        })).sort((a, b) => b.createdAtMs - a.createdAtMs);
        onUpdate("agricultureSchemeHistory", list, true);
      }, () => {}));
    } else {
      const prevHistUnsub = this.activeUnsubs.get("agricultureSchemeHistory");
      if (prevHistUnsub) {
        try { prevHistUnsub(); } catch (_) {}
        this.activeUnsubs.delete("agricultureSchemeHistory");
      }
      onUpdate("agricultureSchemeHistory", [], true);
    }

    // Phase 7: University-Wise Official Syllabi (/syllabi)
    const sylQ = isAdmin
      ? query(collection(this.db, "syllabi"), limit(200))
      : query(collection(this.db, "syllabi"), where("published", "==", true), limit(200));
    this.setSub("universitySyllabi", onSnapshot(sylQ, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt)
      })).sort((a, b) => (Number(a.semester) || 0) - (Number(b.semester) || 0) || b.updatedAtMs - a.updatedAtMs);
      onUpdate("universitySyllabi", list, true);
    }, () => {}));

    // Phase 7: Automatically Discovered & Admin-Reviewed Study Resources (/discoveredStudyResources)
    const discQ = isAdmin
      ? query(collection(this.db, "discoveredStudyResources"), limit(200))
      : query(collection(this.db, "discoveredStudyResources"), where("reviewStatus", "==", "APPROVED_PUBLISHED"), limit(150));
    this.setSub("discoveredStudyResources", onSnapshot(discQ, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt)
      })).sort((a, b) => String(b.publicationDate || "").localeCompare(String(a.publicationDate || "")) || b.updatedAtMs - a.updatedAtMs);
      onUpdate("discoveredStudyResources", list, true);
    }, () => {}));

    // App Settings (/appSettings/global — public read for WhatsApp Helpline & Notices)
    this.setSub("appSettings", onSnapshot(doc(this.db, "appSettings", "global"), (snap) => {
      if (snap.exists()) {
        onUpdate("appSettings", { ...DEFAULT_APP_SETTINGS, ...snap.data() }, true);
      }
    }, () => {}));
  }

  // --------------------------------------------------------------------------
  // 2B. AUTHENTICATED & PRIVATE OWNER-ONLY COLLECTIONS LISTENERS
  // --------------------------------------------------------------------------
  subscribeEcosystemCollections({ isAdmin, isSuperAdmin, isAuthorizedMeetingHost, uid, onUpdate }) {
    if (!this.ready || !uid) return;
    const { collection, query, where, limit, onSnapshot } = this.mods.fsMod;

    // Upgrade public subscriptions ONLY if role scope actually changed
    this.subscribePublicCollections({ isAdmin, isSuperAdmin, isAuthorizedMeetingHost, onUpdate });

    const privKey = `${uid}|${Boolean(isAdmin)}`;
    const requiredPrivateKeys = ["farmerQueries", "quizAttempts", "studyBookmarks"];
    if (this.privateSubKey === privKey && requiredPrivateKeys.every((k) => this.activeUnsubs.has(k))) {
      return;
    }
    this.privateSubKey = privKey;

    // Farmer Queries (own queries or all for Admin)
    const fqQ = isAdmin
      ? query(collection(this.db, "farmerQueries"), limit(150))
      : query(collection(this.db, "farmerQueries"), where("userId", "==", uid), limit(100));
    this.setSub("farmerQueries", onSnapshot(fqQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt) }))
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onUpdate("farmerQueries", list);
    }, () => {}));

    // PRIVATE OWNER-ONLY: Quiz Attempts
    this.setSub("quizAttempts", onSnapshot(query(collection(this.db, "users", uid, "quizAttempts"), limit(100)), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAtMs: getTimestampMs(d.data().createdAt) }))
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      onUpdate("quizAttempts", list);
    }, () => {}));

    // PRIVATE OWNER-ONLY: Study Bookmarks & Continue Learning Progress (Phase 7)
    this.setSub("studyBookmarks", onSnapshot(query(collection(this.db, "users", uid, "studyBookmarks"), limit(200)), (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt)
      })).sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onUpdate("studyBookmarks", list);
    }, () => {}));
  }

  // --------------------------------------------------------------------------
  // 2C. STRICTLY ISOLATED STUDENT & FARMER FINANCIAL PROFILE SUBSCRIPTIONS
  // Enforced at query, subcollection, and Firestore Security Rules layers!
  // --------------------------------------------------------------------------
  subscribeFinancialProfiles({ uid, userProfile, onUpdate }) {
    if (!this.ready || !uid) return;
    const { collection, query, where, limit, onSnapshot } = this.mods.fsMod;
    const allowedProfiles = getAllowedFinancialProfiles(userProfile);
    const hasStudent = allowedProfiles.includes("student");
    const hasFarmer = allowedProfiles.includes("farmer");
    const scopeKey = `${uid}|${allowedProfiles.slice().sort().join(",")}`;

    const expectedKeys = [
      ...(hasStudent ? ["studentMoneyTransactions", "studentMoneyBudgets"] : []),
      ...(hasFarmer ? ["farmerMoneyTransactions", "farmerMoneyBudgets"] : [])
    ];
    if (this.financialProfileSubKey === scopeKey && expectedKeys.every((k) => this.activeUnsubs.has(k))) {
      return;
    }
    this.financialProfileSubKey = scopeKey;

    // 1. STUDENT FINANCIAL PROFILE (Subscribed ONLY if user has Student / Dual access)
    if (hasStudent) {
      const studentTxQ = query(
        collection(this.db, "users", uid, "studentFinancialTransactions"),
        where("userId", "==", uid),
        where("profileType", "==", "student"),
        limit(400)
      );
      this.setSub("studentMoneyTransactions", onSnapshot(studentTxQ, (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data(), createdAtMs: getTimestampMs(d.data().createdAt) }))
          .filter((d) => d.userId === uid && d.profileType === "student")
          .sort((a, b) => (b.dateLabel || "").localeCompare(a.dateLabel || "") || b.createdAtMs - a.createdAtMs);
        onUpdate("studentMoneyTransactions", list);
      }, () => {}));

      const studentBudgetsQ = query(
        collection(this.db, "users", uid, "studentFinancialBudgets"),
        where("userId", "==", uid),
        where("profileType", "==", "student"),
        limit(100)
      );
      this.setSub("studentMoneyBudgets", onSnapshot(studentBudgetsQ, (snap) => {
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => d.userId === uid && d.profileType === "student");
        const openingDoc = all.find((d) => d.kind === "OPENING_BALANCE" || d.id === "opening_balance");
        const goals = all.filter((d) => d.kind !== "OPENING_BALANCE" && d.id !== "opening_balance");
        onUpdate("studentMoneyBudgets", goals);
        if (openingDoc) {
          onUpdate("studentOpeningBalance", Number(openingDoc.targetAmount) || 0);
        }
      }, () => {}));
    } else {
      this.setSub("studentMoneyTransactions", null);
      this.setSub("studentMoneyBudgets", null);
      onUpdate("studentMoneyTransactions", []);
      onUpdate("studentMoneyBudgets", []);
      onUpdate("studentOpeningBalance", 0);
    }

    // 2. FARMER FINANCIAL PROFILE (Subscribed ONLY if user has Farmer / Dual access)
    if (hasFarmer) {
      const farmerTxQ = query(
        collection(this.db, "users", uid, "farmerFinancialTransactions"),
        where("userId", "==", uid),
        where("profileType", "==", "farmer"),
        limit(400)
      );
      this.setSub("farmerMoneyTransactions", onSnapshot(farmerTxQ, (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data(), createdAtMs: getTimestampMs(d.data().createdAt) }))
          .filter((d) => d.userId === uid && d.profileType === "farmer")
          .sort((a, b) => (b.dateLabel || "").localeCompare(a.dateLabel || "") || b.createdAtMs - a.createdAtMs);
        onUpdate("farmerMoneyTransactions", list);
      }, () => {}));

      const farmerBudgetsQ = query(
        collection(this.db, "users", uid, "farmerFinancialBudgets"),
        where("userId", "==", uid),
        where("profileType", "==", "farmer"),
        limit(100)
      );
      this.setSub("farmerMoneyBudgets", onSnapshot(farmerBudgetsQ, (snap) => {
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => d.userId === uid && d.profileType === "farmer");
        const openingDoc = all.find((d) => d.kind === "OPENING_BALANCE" || d.id === "opening_balance");
        const goals = all.filter((d) => d.kind !== "OPENING_BALANCE" && d.id !== "opening_balance");
        onUpdate("farmerMoneyBudgets", goals);
        if (openingDoc) {
          onUpdate("farmerOpeningBalance", Number(openingDoc.targetAmount) || 0);
        }
      }, () => {}));
    } else {
      this.setSub("farmerMoneyTransactions", null);
      this.setSub("farmerMoneyBudgets", null);
      onUpdate("farmerMoneyTransactions", []);
      onUpdate("farmerMoneyBudgets", []);
      onUpdate("farmerOpeningBalance", 0);
    }
  }

  // Safe, idempotent, non-destructive classification & migration of legacy
  // users/{uid}/transactions and users/{uid}/budgets into isolated Student / Farmer profiles.
  // NEVER deletes or modifies legacy documents!
  async migrateLegacyMoneyRecords(uid, userProfile) {
    if (!this.ready || !uid) return null;
    const allowedProfiles = getAllowedFinancialProfiles(userProfile);
    const scopeKey = `${uid}|${allowedProfiles.slice().sort().join(",")}`;
    if (this.migratedFinancialScopeKeys.has(scopeKey)) return null;
    this.migratedFinancialScopeKeys.add(scopeKey);

    const { collection, doc, getDoc, getDocs, setDoc, query, limit, serverTimestamp } = this.mods.fsMod;
    const result = {
      migratedStudentTx: 0,
      migratedFarmerTx: 0,
      migratedBudgets: 0,
      otherProfileLegacyCount: 0
    };

    try {
      const legacyTxSnap = await getDocs(query(collection(this.db, "users", uid, "transactions"), limit(400)));
      for (const d of legacyTxSnap.docs) {
        const raw = d.data();
        const targetProfile = classifyLegacyTransaction(raw, userProfile?.role);
        if (!allowedProfiles.includes(targetProfile)) {
          result.otherProfileLegacyCount += 1;
          continue;
        }
        const targetCol = getTransactionCollectionName(targetProfile);
        const migratedId = `legacy_${d.id}`.slice(0, 128);
        const targetRef = doc(this.db, "users", uid, targetCol, migratedId);
        const existingSnap = await getDoc(targetRef);
        if (existingSnap.exists()) continue;

        const payload = buildScopedTransactionPayload({
          uid,
          profileType: targetProfile,
          tx: raw,
          createdAtValue: raw.createdAt || serverTimestamp(),
          updatedAtValue: raw.updatedAt || serverTimestamp(),
          migratedFromLegacyId: d.id
        });
        await setDoc(targetRef, payload);
        if (targetProfile === "farmer") result.migratedFarmerTx += 1;
        else result.migratedStudentTx += 1;
      }

      const legacyBudgetSnap = await getDocs(query(collection(this.db, "users", uid, "budgets"), limit(100)));
      for (const d of legacyBudgetSnap.docs) {
        const raw = d.data();
        const targetProfile = classifyLegacyBudget({ id: d.id, ...raw }, userProfile?.role);
        if (!allowedProfiles.includes(targetProfile)) {
          result.otherProfileLegacyCount += 1;
          continue;
        }
        const targetCol = getBudgetCollectionName(targetProfile);
        const isOpening = raw.kind === "OPENING_BALANCE" || d.id === "opening_balance";
        const migratedId = isOpening ? "opening_balance" : `legacy_${d.id}`.slice(0, 128);
        const targetRef = doc(this.db, "users", uid, targetCol, migratedId);
        const existingSnap = await getDoc(targetRef);
        if (existingSnap.exists()) continue;

        const payload = buildScopedBudgetPayload({
          uid,
          profileType: targetProfile,
          goal: raw,
          createdAtValue: raw.createdAt || serverTimestamp(),
          updatedAtValue: raw.updatedAt || serverTimestamp(),
          migratedFromLegacyId: d.id
        });
        await setDoc(targetRef, payload);
        result.migratedBudgets += 1;
      }
    } catch (_) {
      // Allow retry if a transient network error occurred
      this.migratedFinancialScopeKeys.delete(scopeKey);
    }

    return result;
  }

  async updateFinancialProfiles(uid, profiles) {
    if (!this.ready || !uid) throw new Error("Sign in required.");
    const { doc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const clean = Array.from(new Set((profiles || []).map((p) => normalizeProfileType(p)).filter(Boolean))).slice(0, 2);
    if (clean.length === 0) throw new Error("At least one financial profile is required.");
    await updateDoc(doc(this.db, "users", uid), {
      financialProfiles: clean,
      updatedAt: serverTimestamp()
    });
    return clean;
  }

  // --------------------------------------------------------------------------
  // 3. PRIVATE STUDENT & FARMER FINANCIAL PROFILE CRUD (Strictly Isolated)
  // --------------------------------------------------------------------------
  async saveMoneyTransaction(uid, profileType, tx, editId = "") {
    if (!this.ready || !uid) throw new Error("Sign in required to save personal financial entries.");
    const profile = normalizeProfileType(profileType);
    if (!profile) throw new Error("A valid financial profile ('student' or 'farmer') is required.");
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const colName = getTransactionCollectionName(profile);

    if (editId) {
      const fullPayload = buildScopedTransactionPayload({
        uid,
        profileType: profile,
        tx,
        updatedAtValue: serverTimestamp()
      });
      // Omit immutable ownership & profile fields on updateDoc (enforced by firestore.rules)
      const { userId: _u, profileType: _p, ledgerScope: _l, migratedFromLegacyId: _m, ...mutableFields } = fullPayload;
      await updateDoc(doc(this.db, "users", uid, colName, editId), mutableFields);
    } else {
      const createPayload = buildScopedTransactionPayload({
        uid,
        profileType: profile,
        tx,
        createdAtValue: serverTimestamp(),
        updatedAtValue: serverTimestamp()
      });
      await addDoc(collection(this.db, "users", uid, colName), createPayload);
    }
  }

  async deleteMoneyTransaction(uid, profileType, txId) {
    if (!this.ready || !uid) throw new Error("Sign in required.");
    const profile = normalizeProfileType(profileType);
    if (!profile) throw new Error("A valid financial profile ('student' or 'farmer') is required.");
    const { doc, deleteDoc } = this.mods.fsMod;
    await deleteDoc(doc(this.db, "users", uid, getTransactionCollectionName(profile), txId));
  }

  async saveOpeningBalance(uid, profileType, amount) {
    if (!this.ready || !uid) throw new Error("Sign in required.");
    const profile = normalizeProfileType(profileType);
    if (!profile) throw new Error("A valid financial profile ('student' or 'farmer') is required.");
    const { doc, getDoc, setDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const cleanAmt = Math.max(0, Math.min(10000000, Number(amount) || 0));
    const colName = getBudgetCollectionName(profile);
    const ref = doc(this.db, "users", uid, colName, "opening_balance");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        name: "Opening Balance",
        kind: "OPENING_BALANCE",
        targetAmount: cleanAmt,
        savedAmount: cleanAmt,
        monthKey: "GLOBAL",
        updatedAt: serverTimestamp()
      });
    } else {
      const createPayload = buildScopedBudgetPayload({
        uid,
        profileType: profile,
        goal: {
          name: "Opening Balance",
          kind: "OPENING_BALANCE",
          targetAmount: cleanAmt,
          savedAmount: cleanAmt,
          monthKey: "GLOBAL"
        },
        createdAtValue: serverTimestamp(),
        updatedAtValue: serverTimestamp()
      });
      await setDoc(ref, createPayload);
    }
  }

  async saveFinancialGoal(uid, profileType, goal, editId = "") {
    if (!this.ready || !uid) throw new Error("Sign in required.");
    const profile = normalizeProfileType(profileType);
    if (!profile) throw new Error("A valid financial profile ('student' or 'farmer') is required.");
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const colName = getBudgetCollectionName(profile);

    if (editId) {
      const fullPayload = buildScopedBudgetPayload({
        uid,
        profileType: profile,
        goal,
        updatedAtValue: serverTimestamp()
      });
      const { userId: _u, profileType: _p, ledgerScope: _l, migratedFromLegacyId: _m, ...mutableFields } = fullPayload;
      await updateDoc(doc(this.db, "users", uid, colName, editId), mutableFields);
    } else {
      const createPayload = buildScopedBudgetPayload({
        uid,
        profileType: profile,
        goal,
        createdAtValue: serverTimestamp(),
        updatedAtValue: serverTimestamp()
      });
      await addDoc(collection(this.db, "users", uid, colName), createPayload);
    }
  }

  async deleteFinancialGoal(uid, profileType, goalId) {
    if (!this.ready || !uid) throw new Error("Sign in required.");
    const profile = normalizeProfileType(profileType);
    if (!profile) throw new Error("A valid financial profile ('student' or 'farmer') is required.");
    const { doc, deleteDoc } = this.mods.fsMod;
    await deleteDoc(doc(this.db, "users", uid, getBudgetCollectionName(profile), goalId));
  }

  // --------------------------------------------------------------------------
  // 4. QUIZ ATTEMPT + EXAM STATS
  // --------------------------------------------------------------------------
  async recordQuizAttempt(uid, semester, score, totalQuestions, meta = {}) {
    const { collection, addDoc, serverTimestamp } = this.mods.fsMod;
    const sem = Math.min(8, Math.max(1, parseInt(semester, 10) || 1));
    const total = Math.max(1, Math.min(200, parseInt(totalQuestions, 10) || 1));
    const sc = Math.min(total, Math.max(0, parseInt(score, 10) || 0));
    const pct = Math.round((sc * 100) / total);

    const attemptPayload = {
      semester: sem,
      score: sc,
      totalQuestions: total,
      createdAt: serverTimestamp()
    };
    const validModes = ["PRACTICE", "MOCK_TEST", "PYQ_SET"];
    if (meta.mode && validModes.includes(meta.mode)) {
      attemptPayload.mode = meta.mode;
    }
    const validExams = [
      "ALL", "BSC_SEMESTER", "ICAR_ENTRANCE", "ICAR_JRF", "CUET_PG", "IBPS_AFO", "NABARD", "STATE_AO", "OTHER_COMPETITIVE"
    ];
    if (meta.examCategory && validExams.includes(meta.examCategory)) {
      attemptPayload.examCategory = meta.examCategory;
    }
    if (meta.subjectKey && typeof meta.subjectKey === "string") {
      attemptPayload.subjectKey = meta.subjectKey.trim().slice(0, 40);
    }

    await addDoc(collection(this.db, "users", uid, "quizAttempts"), attemptPayload);
    await addDoc(collection(this.db, "examStats"), {
      userId: uid,
      semester: sem,
      score: sc,
      totalQuestions: total,
      percentage: pct,
      createdAt: serverTimestamp()
    }).catch(() => {});
  }

  // --------------------------------------------------------------------------
  // 5. FARMER QUERIES (/farmerQueries — Full Create / Edit / Delete + Photo)
  // --------------------------------------------------------------------------
  async createFarmerQuery(uid, farmerName, data, editId = "") {
    if (!this.ready || !uid) throw new Error("Sign in required.");
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const payload = {
      cropName: String(data.cropName || "").trim().slice(0, 80),
      category: ["DISEASE", "PEST", "FERTILIZER", "SOIL", "WEATHER", "OTHER"].includes(data.category) ? data.category : "DISEASE",
      description: String(data.description || "").trim().slice(0, 1000),
      district: String(data.district || "").trim().slice(0, 80),
      hasImage: Boolean(data.imageBase64 || data.hasImage),
      imageSummary: String(data.imageSummary || (data.imageBase64 ? "Crop photograph uploaded" : "")).trim().slice(0, 400),
      updatedAt: serverTimestamp()
    };
    if (data.imageBase64) payload.imageBase64 = data.imageBase64;

    if (editId) {
      await updateDoc(doc(this.db, "farmerQueries", editId), payload);
    } else {
      await addDoc(collection(this.db, "farmerQueries"), {
        ...payload,
        userId: uid,
        farmerName: String(farmerName || "Farmer").trim().slice(0, 80),
        status: "OPEN",
        adminReply: "",
        createdAt: serverTimestamp()
      });
    }
  }

  async deleteFarmerQuery(queryId) {
    await this.mods.fsMod.deleteDoc(this.mods.fsMod.doc(this.db, "farmerQueries", queryId));
  }

  async replyFarmerQueryAsAdmin(queryId, status, adminReply) {
    const { doc, updateDoc, serverTimestamp } = this.mods.fsMod;
    await updateDoc(doc(this.db, "farmerQueries", queryId), {
      status: ["OPEN", "IN_REVIEW", "RESOLVED"].includes(status) ? status : "RESOLVED",
      adminReply: String(adminReply || "").trim().slice(0, 1000),
      updatedAt: serverTimestamp()
    });
  }

  // --------------------------------------------------------------------------
  // 6. COMMUNITY POSTS & REPORTS (/communityPosts, /contentReports)
  // --------------------------------------------------------------------------
  async saveCommunityPost(uid, authorName, data, editId = "") {
    if (!this.ready || !uid) throw new Error("Sign in required.");
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const validCategories = [
      "GENERAL", "CROP_CULTIVATION", "DISEASE_PEST", "GOVT_SCHEMES",
      "WOMEN_RIGHTS", "AGRI_TRAINING", "AGRI_BUSINESS", "HORTICULTURE",
      "DAIRY_LIVESTOCK", "FISHERIES", "SUCCESS_STORIES"
    ];
    const base = {
      collegeGroup: String(data.collegeGroup || "General Agriculture").trim().slice(0, 100),
      topic: ["DOUBT", "NOTES_SHARE", "EXAM_PREP", "FARM_TALK"].includes(data.topic) ? data.topic : "DOUBT",
      title: String(data.title || "").trim().slice(0, 140),
      body: String(data.body || "").trim().slice(0, 1500),
      updatedAt: serverTimestamp()
    };
    if (data.category && validCategories.includes(data.category)) {
      base.category = data.category;
    }
    if (typeof data.district === "string") {
      base.district = data.district.trim().slice(0, 80);
    }

    if (editId) {
      await updateDoc(doc(this.db, "communityPosts", editId), base);
    } else {
      const createPayload = {
        ...base,
        authorId: uid,
        authorName: String(authorName || "Member").trim().slice(0, 80),
        helpfulCount: 0,
        status: "ACTIVE",
        createdAt: serverTimestamp()
      };
      if (data.board === "WOMEN_FARMER" || data.board === "GENERAL") {
        createPayload.board = data.board;
      }
      if (data.board === "WOMEN_FARMER") {
        createPayload.commentCount = 0;
        if (!createPayload.category) createPayload.category = "GENERAL";
      }
      await addDoc(collection(this.db, "communityPosts"), createPayload);
    }
  }

  async createCommunityPost(uid, authorName, data) {
    return this.saveCommunityPost(uid, authorName, data, "");
  }

  async upvoteCommunityPost(postId, currentCount) {
    const { doc, updateDoc, serverTimestamp } = this.mods.fsMod;
    await updateDoc(doc(this.db, "communityPosts", postId), {
      helpfulCount: (Number(currentCount) || 0) + 1,
      updatedAt: serverTimestamp()
    });
  }

  async moderateCommunityPost(postId, status) {
    const { doc, updateDoc, serverTimestamp } = this.mods.fsMod;
    await updateDoc(doc(this.db, "communityPosts", postId), {
      status: status === "HIDDEN" ? "HIDDEN" : "ACTIVE",
      updatedAt: serverTimestamp()
    });
  }

  async deleteCommunityPost(postId) {
    const { doc, deleteDoc } = this.mods.fsMod;
    await deleteDoc(doc(this.db, "communityPosts", postId));
  }

  // Threaded Comments & Replies (/communityPosts/{postId}/comments)
  subscribePostComments(postId, isAdmin, onData) {
    if (!this.ready || !postId || !onData) return;
    const subKey = `postComments:${postId}`;
    const { collection, query, where, limit, onSnapshot } = this.mods.fsMod;
    const colRef = collection(this.db, "communityPosts", postId, "comments");
    const q = isAdmin
      ? query(colRef, limit(200))
      : query(colRef, where("status", "==", "ACTIVE"), limit(200));
    this.setSub(subKey, onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAtMs: getTimestampMs(d.data().createdAt || d.data().updatedAt),
        updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt)
      })).sort((a, b) => a.createdAtMs - b.createdAtMs);
      onData(list);
    }, () => {}));
  }

  unsubscribePostComments(postId) {
    const subKey = `postComments:${postId}`;
    const unsub = this.activeUnsubs.get(subKey);
    if (typeof unsub === "function") {
      try { unsub(); } catch (_) {}
      this.activeUnsubs.delete(subKey);
    }
  }

  async savePostComment(postId, uid, authorName, data, editCommentId = "") {
    if (!this.ready || !uid) throw new Error("Sign in required.");
    if (!postId) throw new Error("Invalid discussion post.");
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const cleanBody = String(data.body || "").trim().slice(0, 1000);
    if (!cleanBody) throw new Error("Comment cannot be empty.");

    if (editCommentId) {
      await updateDoc(doc(this.db, "communityPosts", postId, "comments", editCommentId), {
        body: cleanBody,
        updatedAt: serverTimestamp()
      });
    } else {
      const payload = {
        postId: String(postId).trim().slice(0, 128),
        authorId: uid,
        authorName: String(authorName || "Member").trim().slice(0, 80),
        body: cleanBody,
        status: "ACTIVE",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const parentId = String(data.parentCommentId || "").trim().slice(0, 128);
      if (parentId) {
        payload.parentCommentId = parentId;
      }
      await addDoc(collection(this.db, "communityPosts", postId, "comments"), payload);
    }
  }

  async deletePostComment(postId, commentId) {
    if (!this.ready || !postId || !commentId) throw new Error("Invalid comment.");
    const { doc, deleteDoc } = this.mods.fsMod;
    await deleteDoc(doc(this.db, "communityPosts", postId, "comments", commentId));
  }

  async moderatePostComment(postId, commentId, status) {
    if (!this.ready || !postId || !commentId) throw new Error("Invalid comment.");
    const { doc, updateDoc, serverTimestamp } = this.mods.fsMod;
    await updateDoc(doc(this.db, "communityPosts", postId, "comments", commentId), {
      status: status === "HIDDEN" ? "HIDDEN" : "ACTIVE",
      updatedAt: serverTimestamp()
    });
  }

  // Per-User Likes / Reactions (/communityPosts/{postId}/likes/{uid})
  subscribePostLikes(postId, onData) {
    if (!this.ready || !postId || !onData) return;
    const subKey = `postLikes:${postId}`;
    if (this.activeUnsubs.has(subKey)) return;
    const { collection, query, limit, onSnapshot } = this.mods.fsMod;
    const q = query(collection(this.db, "communityPosts", postId, "likes"), limit(500));
    this.setSub(subKey, onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(list);
    }, () => {}));
  }

  unsubscribePostLikes(postId) {
    const subKey = `postLikes:${postId}`;
    const unsub = this.activeUnsubs.get(subKey);
    if (typeof unsub === "function") {
      try { unsub(); } catch (_) {}
      this.activeUnsubs.delete(subKey);
    }
  }

  async togglePostLike(postId, uid, isCurrentlyLiked, reaction = "SUPPORT") {
    if (!this.ready || !uid) throw new Error("Sign in required.");
    if (!postId) throw new Error("Invalid discussion post.");
    const { doc, setDoc, deleteDoc, serverTimestamp } = this.mods.fsMod;
    const likeRef = doc(this.db, "communityPosts", postId, "likes", uid);
    if (isCurrentlyLiked) {
      await deleteDoc(likeRef);
    } else {
      await setDoc(likeRef, {
        userId: uid,
        reaction: ["LIKE", "HELPFUL", "SUPPORT"].includes(reaction) ? reaction : "SUPPORT",
        createdAt: serverTimestamp()
      });
    }
  }

  async reportCommunityPost(uid, reporterName, post, reason) {
    const { collection, addDoc, serverTimestamp } = this.mods.fsMod;
    await addDoc(collection(this.db, "contentReports"), {
      reporterId: uid,
      reporterName: String(reporterName || "User").trim().slice(0, 80),
      targetType: "COMMUNITY_POST",
      targetId: post.id,
      targetTitle: String(post.title || "Post").slice(0, 140),
      reason: String(reason || "Inappropriate content").trim().slice(0, 300),
      status: "PENDING",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  async reportCommunityComment(uid, reporterName, postId, comment, reason) {
    const { collection, addDoc, serverTimestamp } = this.mods.fsMod;
    await addDoc(collection(this.db, "contentReports"), {
      reporterId: uid,
      reporterName: String(reporterName || "User").trim().slice(0, 80),
      targetType: "COMMUNITY_COMMENT",
      targetId: `${String(postId || "").slice(0, 60)}/${String(comment?.id || "").slice(0, 60)}`,
      targetTitle: String(comment?.body || "Comment").slice(0, 140),
      reason: String(reason || "Inappropriate comment").trim().slice(0, 300),
      status: "PENDING",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  // --------------------------------------------------------------------------
  // 7. MEETING ZONE (/meetings)
  // --------------------------------------------------------------------------
  async saveMeeting(uid, hostName, data, editId = "") {
    if (!isValidGoogleMeetUrl(data.meetUrl)) {
      throw new Error("Enter a valid Google Meet URL starting with https://meet.google.com/...");
    }
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const epochMs = parseMeetingEpochMs(data.scheduledDate, data.scheduledTime);
    const base = {
      title: String(data.title || "").trim().slice(0, 150),
      subject: String(data.subject || "").trim().slice(0, 80),
      description: String(data.description || "").trim().slice(0, 1000),
      meetUrl: String(data.meetUrl || "").trim().slice(0, 300),
      scheduledDate: String(data.scheduledDate || "").trim().slice(0, 20),
      scheduledTime: String(data.scheduledTime || "").trim().slice(0, 20),
      scheduledAtEpochMs: epochMs,
      hostName: String(data.hostName || hostName || "Faculty").trim().slice(0, 80),
      notifyStudents: Boolean(data.notifyStudents),
      published: data.published !== false,
      updatedAt: serverTimestamp()
    };
    if (editId) {
      await updateDoc(doc(this.db, "meetings", editId), base);
    } else {
      await addDoc(collection(this.db, "meetings"), { ...base, hostUid: uid, createdAt: serverTimestamp() });
      if (base.notifyStudents) {
        await addDoc(collection(this.db, "announcements"), {
          title: `Live Meeting: ${base.title}`.slice(0, 120),
          message: `${base.subject} session with ${base.hostName} on ${base.scheduledDate} at ${base.scheduledTime}. Open Meeting Zone to join via Google Meet.`.slice(0, 500),
          audience: "STUDENTS",
          active: true,
          createdBy: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }).catch(() => {});
      }
    }
  }

  async deleteMeeting(meetingId) {
    const { doc, deleteDoc } = this.mods.fsMod;
    await deleteDoc(doc(this.db, "meetings", meetingId));
  }

  // --------------------------------------------------------------------------
  // 8. DOUBT ZONE PRIVATE 1-ON-1 CHAT (/doubtChats/{professorId}__{studentId})
  // Strictly isolated to concerned Student & Assigned Professor ONLY
  // --------------------------------------------------------------------------
  subscribeDoubtThreads({ uid, facultyIdentity, onStudentThreads, onProfessorThreads }) {
    if (!this.ready || !uid) return;
    const doubtKey = `${uid}|${Boolean(facultyIdentity?.isAuthorizedProfessor)}|${facultyIdentity?.professorId || ""}|${facultyIdentity?.matchedByEmail || ""}`;
    if (this.doubtSubKey === doubtKey && this.activeUnsubs.has("studentDoubtThreads")) {
      return;
    }
    this.doubtSubKey = doubtKey;
    const { collection, query, where, limit, onSnapshot } = this.mods.fsMod;

    // Student's own threads
    this.setSub("studentDoubtThreads", onSnapshot(
      query(collection(this.db, "doubtChats"), where("studentId", "==", uid), limit(100)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAtMs: getTimestampMs(d.data().updatedAt) }))
          .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
        onStudentThreads(list);
      },
      () => onStudentThreads([])
    ));

    // Professor's assigned threads
    if (facultyIdentity?.isAuthorizedProfessor) {
      let profQ = null;
      if (facultyIdentity.matchedByAccountLink && facultyIdentity.professorId) {
        profQ = query(collection(this.db, "doubtChats"), where("professorId", "==", facultyIdentity.professorId), limit(200));
      } else if (facultyIdentity.matchedByEmail) {
        profQ = query(collection(this.db, "doubtChats"), where("professorEmail", "==", facultyIdentity.matchedByEmail), limit(200));
      }
      if (profQ) {
        this.setSub("professorDoubtThreads", onSnapshot(profQ, (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAtMs: getTimestampMs(d.data().updatedAt) }))
            .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
          onProfessorThreads(list);
        }, () => onProfessorThreads([])));
      }
    } else {
      this.setSub("professorDoubtThreads", null);
      onProfessorThreads([]);
    }
  }

  subscribeDoubtMessages({ chatId, asProfessor, facultyIdentity, studentId, uid, onMessages }) {
    if (!this.ready || !chatId || !uid) return;
    const { collection, query, where, limit, onSnapshot } = this.mods.fsMod;
    const ref = collection(this.db, "doubtChats", chatId, "messages");
    let q;
    if (asProfessor) {
      if (facultyIdentity?.matchedByAccountLink && facultyIdentity.professorId) {
        q = query(ref, where("professorId", "==", facultyIdentity.professorId), limit(250));
      } else if (facultyIdentity?.matchedByEmail) {
        q = query(ref, where("professorEmail", "==", facultyIdentity.matchedByEmail), limit(250));
      } else {
        q = query(ref, where("professorUid", "==", uid), limit(250));
      }
    } else {
      q = query(ref, where("studentId", "==", studentId), limit(250));
    }

    this.setSub("activeDoubtMessages", onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAtMs: getTimestampMs(d.data().createdAt) || Date.now() }))
        .sort((a, b) => a.createdAtMs - b.createdAtMs);
      onMessages(list);
    }, () => onMessages([])));
  }

  async sendDoubtMessage({
    uid,
    professor,
    studentId,
    studentName,
    studentSemester,
    senderRole,
    senderName,
    text,
    imageBase64 = "",
    serviceType = "STUDENT_CAREER",
    questionTitle = "",
    questionCategory = "",
    contactInfo = "",
    chatIdOverride = ""
  }) {
    if (!this.ready || !uid) throw new Error("Sign in required.");
    const { doc, collection, getDoc, setDoc, updateDoc, addDoc, serverTimestamp } = this.mods.fsMod;
    const isFarmerService = serviceType === "FARMER_ADVISOR";
    const chatId = chatIdOverride || (isFarmerService
      ? `${buildDoubtChatId(professor.id, studentId)}__farmer`
      : buildDoubtChatId(professor.id, studentId));

    const cleanText = String(text || "").trim().slice(0, 2000);
    const cleanTitle = String(questionTitle || "").trim().slice(0, 140);
    const cleanCat = String(questionCategory || "").trim().slice(0, 60);
    const cleanContact = String(contactInfo || "").trim().slice(0, 80);
    const hasImg = Boolean(imageBase64);
    if (!cleanText && !hasImg) throw new Error("Type a question or attach an image.");

    const threadRef = doc(this.db, "doubtChats", chatId);
    let existing = null;
    try {
      const snap = await getDoc(threadRef);
      if (snap.exists()) existing = snap.data();
    } catch (_) {}

    const previewSource = cleanTitle ? `${cleanTitle}: ${cleanText}` : cleanText;
    const preview = previewSource ? previewSource.slice(0, 180) : "[Photo attachment]";
    const profEmailLower = String(existing?.professorEmail ?? professor.email ?? "").trim().toLowerCase().slice(0, 120);
    const effectiveProfUid =
      senderRole === "PROFESSOR"
        ? uid
        : (existing?.professorUid || professor.authorizedUid || "").trim().slice(0, 128);
    const initialEmailStatus = senderRole === "STUDENT"
      ? (profEmailLower ? "PENDING" : "NOT_CONFIGURED")
      : undefined;

    // Step 1: Create or update parent thread FIRST (prevents Firestore rules exists() race on first message!)
    if (!existing) {
      if (senderRole !== "STUDENT" || studentId !== uid) {
        throw new Error("Only the student or farmer can start a new consultation thread.");
      }
      const threadPayload = {
        studentId: uid,
        studentName: String(studentName || (isFarmerService ? "Farmer" : "Student")).trim().slice(0, 80) || "User",
        studentSemester: isFarmerService ? 0 : Math.min(8, Math.max(0, parseInt(studentSemester, 10) || 1)),
        professorId: professor.id,
        professorName: String(professor.name || "Professor").slice(0, 100),
        professorEmail: profEmailLower,
        professorUid: effectiveProfUid,
        serviceType: isFarmerService ? "FARMER_ADVISOR" : "STUDENT_CAREER",
        lastMessagePreview: preview,
        lastSenderRole: "STUDENT",
        unreadForStudent: 0,
        unreadForProfessor: 1,
        studentLastReadAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      if (cleanTitle) threadPayload.questionTitle = cleanTitle;
      if (cleanCat) threadPayload.questionCategory = cleanCat;
      if (cleanContact) threadPayload.contactInfo = cleanContact;
      if (initialEmailStatus) threadPayload.emailDeliveryStatus = initialEmailStatus;
      await setDoc(threadRef, threadPayload);
    } else {
      const nextUnreadStudent = senderRole === "PROFESSOR" ? (existing.unreadForStudent || 0) + 1 : 0;
      const nextUnreadProf = senderRole === "STUDENT" ? (existing.unreadForProfessor || 0) + 1 : 0;
      if (senderRole === "STUDENT") {
        const updatePayload = {
          studentName: String(studentName || existing.studentName || "User").trim().slice(0, 80),
          studentSemester: isFarmerService ? 0 : Math.min(8, Math.max(0, parseInt(studentSemester, 10) || existing.studentSemester || 1)),
          lastMessagePreview: preview,
          lastSenderRole: "STUDENT",
          unreadForStudent: nextUnreadStudent,
          unreadForProfessor: nextUnreadProf,
          studentLastReadAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        if (cleanTitle) updatePayload.questionTitle = cleanTitle;
        if (cleanCat) updatePayload.questionCategory = cleanCat;
        if (cleanContact) updatePayload.contactInfo = cleanContact;
        if (initialEmailStatus) updatePayload.emailDeliveryStatus = initialEmailStatus;
        await updateDoc(threadRef, updatePayload);
      } else {
        await updateDoc(threadRef, {
          professorName: String(professor.name || existing.professorName || "Professor").slice(0, 100),
          professorUid: effectiveProfUid,
          lastMessagePreview: preview,
          lastSenderRole: "PROFESSOR",
          unreadForStudent: nextUnreadStudent,
          unreadForProfessor: nextUnreadProf,
          professorLastReadAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    // Step 2: Persist message inside /doubtChats/{chatId}/messages
    const msgPayload = {
      studentId: existing?.studentId || studentId,
      professorId: existing?.professorId || professor.id,
      professorEmail: profEmailLower,
      professorUid: effectiveProfUid,
      senderId: uid,
      senderName: String(senderName || (senderRole === "PROFESSOR" ? professor.name : "User")).trim().slice(0, 80),
      senderRole,
      text: cleanText,
      hasImage: hasImg,
      readByRecipient: false,
      createdAt: serverTimestamp()
    };
    if (hasImg) msgPayload.imageBase64 = imageBase64;
    if (cleanTitle) msgPayload.questionTitle = cleanTitle;
    if (cleanCat) msgPayload.questionCategory = cleanCat;
    if (initialEmailStatus) msgPayload.emailDeliveryStatus = initialEmailStatus;

    const createdRef = await addDoc(collection(this.db, "doubtChats", chatId, "messages"), msgPayload);
    return { chatId, messageId: createdRef.id, hasConfiguredProfessorEmail: Boolean(profEmailLower) };
  }

  async triggerProfessorEmailDelivery({
    chatId,
    messageId,
    professorId,
    serviceType,
    senderName,
    contactInfo = "",
    questionTitle = "",
    questionCategory = "",
    questionText = "",
    hasAttachment = false
  }) {
    if (!this.ready || !this.auth?.currentUser) {
      return { ok: false, status: "FAILED", error: "User not signed in." };
    }
    const { doc, updateDoc, serverTimestamp } = this.mods.fsMod;
    let status = "FAILED";
    let errText = "";

    try {
      const idToken = await this.auth.currentUser.getIdToken();
      const res = await fetch("/.netlify/functions/send-professor-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          chatId,
          messageId,
          professorId,
          serviceType,
          senderName,
          contactInfo,
          questionTitle,
          questionCategory,
          questionText,
          hasAttachment,
          siteUrl: typeof window !== "undefined" ? window.location.origin : ""
        })
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        status = "NOT_CONFIGURED";
        errText = "Server email function runs on Netlify deployment once RESEND_API_KEY or BREVO_API_KEY is added.";
      } else {
        const data = await res.json();
        status = ["SENT", "FAILED", "NOT_CONFIGURED", "PENDING"].includes(data?.status) ? data.status : (data?.ok ? "SENT" : "FAILED");
        errText = String(data?.error || "").slice(0, 240);
      }
    } catch (err) {
      status = "FAILED";
      errText = String(err?.message || "Network error delivering email.").slice(0, 240);
    }

    // Record honest delivery status on message & thread in Firestore
    await updateDoc(doc(this.db, "doubtChats", chatId, "messages", messageId), {
      emailDeliveryStatus: status,
      emailDeliveryError: errText
    }).catch(() => {});

    await updateDoc(doc(this.db, "doubtChats", chatId), {
      emailDeliveryStatus: status,
      emailDeliveryError: errText,
      emailDeliveryMessageId: messageId,
      updatedAt: serverTimestamp()
    }).catch(() => {});

    return { ok: status === "SENT", status, error: errText };
  }

  async markDoubtConversationRead(uid, thread, messages, asProfessor) {
    if (!this.ready || !uid || !thread?.id) return;
    const { doc, updateDoc, writeBatch, serverTimestamp } = this.mods.fsMod;
    try {
      const threadRef = doc(this.db, "doubtChats", thread.id);
      const needsClear = asProfessor ? (thread.unreadForProfessor || 0) > 0 : (thread.unreadForStudent || 0) > 0;
      if (needsClear) {
        await updateDoc(threadRef, asProfessor
          ? { unreadForProfessor: 0, professorLastReadAt: serverTimestamp(), updatedAt: serverTimestamp() }
          : { unreadForStudent: 0, studentLastReadAt: serverTimestamp(), updatedAt: serverTimestamp() });
      }
      const unread = (messages || []).filter((m) => !m.readByRecipient && m.senderId !== uid && m.id);
      if (unread.length > 0) {
        const batch = writeBatch(this.db);
        unread.slice(0, 40).forEach((m) => {
          batch.update(doc(this.db, "doubtChats", thread.id, "messages", m.id), { readByRecipient: true });
        });
        await batch.commit();
      }
    } catch (_) {}
  }

  async deleteOwnDoubtMessage(chatId, messageId) {
    const { doc, deleteDoc } = this.mods.fsMod;
    await deleteDoc(doc(this.db, "doubtChats", chatId, "messages", messageId));
  }

  // --------------------------------------------------------------------------
  // 9. ADMIN CONTENT & CONFIGURATION CRUD
  // --------------------------------------------------------------------------
  async saveStudyMaterial(uid, data, editId = "") {
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const validSubjects = [
      "AGRONOMY", "SOIL_SCIENCE", "GENETICS_BREEDING", "PLANT_PATHOLOGY", "ENTOMOLOGY",
      "HORTICULTURE", "AGRI_ECONOMICS", "AGRI_EXTENSION", "SEED_SCIENCE", "PLANT_PHYSIOLOGY",
      "AGRI_ENGINEERING", "ANIMAL_HUSBANDRY", "OTHER"
    ];
    const validOrigins = ["OFFICIAL_PUBLICATION", "VERIFIED_FACULTY", "CURATED_REFERENCE", "AI_PRACTICE"];
    const base = {
      title: String(data.title || "").trim().slice(0, 150),
      semester: Math.min(8, Math.max(1, parseInt(data.semester, 10) || 1)),
      subject: String(data.subject || "").trim().slice(0, 80),
      category: ["NOTES_PDF", "VIDEO_LECTURE", "PYQ", "PRACTICAL"].includes(data.category) ? data.category : "NOTES_PDF",
      summary: String(data.summary || "").trim().slice(0, 1000),
      contentText: String(data.contentText || "").trim().slice(0, 12000),
      verifiedForAi: data.verifiedForAi !== false,
      resourceUrl: String(data.resourceUrl || "").trim().slice(0, 400),
      published: data.published !== false,
      updatedAt: serverTimestamp()
    };
    if (typeof data.titleBn === "string" && data.titleBn.trim()) base.titleBn = data.titleBn.trim().slice(0, 180);
    if (data.subjectKey && validSubjects.includes(data.subjectKey)) base.subjectKey = data.subjectKey;
    if (typeof data.topic === "string" && data.topic.trim()) base.topic = data.topic.trim().slice(0, 120);
    if (typeof data.summaryBn === "string" && data.summaryBn.trim()) base.summaryBn = data.summaryBn.trim().slice(0, 1000);
    if (typeof data.contentTextBn === "string" && data.contentTextBn.trim()) base.contentTextBn = data.contentTextBn.trim().slice(0, 12000);
    if (typeof data.sourceName === "string" && data.sourceName.trim()) base.sourceName = data.sourceName.trim().slice(0, 140);
    if (typeof data.sourceUrl === "string" && data.sourceUrl.trim()) base.sourceUrl = data.sourceUrl.trim().slice(0, 400);
    if (typeof data.referenceCitation === "string" && data.referenceCitation.trim()) base.referenceCitation = data.referenceCitation.trim().slice(0, 300);
    if (typeof data.lastUpdatedDate === "string" && data.lastUpdatedDate.trim()) base.lastUpdatedDate = data.lastUpdatedDate.trim().slice(0, 30);
    if (typeof data.downloadPermitted === "boolean") base.downloadPermitted = data.downloadPermitted;
    if (data.contentOrigin && validOrigins.includes(data.contentOrigin)) base.contentOrigin = data.contentOrigin;
    if (Array.isArray(data.examTags) && data.examTags.length) base.examTags = data.examTags.slice(0, 10);

    if (editId) {
      await updateDoc(doc(this.db, "studyMaterials", editId), base);
    } else {
      await addDoc(collection(this.db, "studyMaterials"), { ...base, createdBy: uid, createdAt: serverTimestamp() });
    }
  }

  async deleteStudyMaterial(id) {
    await this.mods.fsMod.deleteDoc(this.mods.fsMod.doc(this.db, "studyMaterials", id));
  }

  async saveQuizQuestion(uid, data, editId = "") {
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const options = (data.options || []).map((o) => String(o || "").trim().slice(0, 160));
    if (options.length !== 4 || options.some((o) => !o)) throw new Error("All 4 MCQ options are required.");
    const validSubjects = [
      "AGRONOMY", "SOIL_SCIENCE", "GENETICS_BREEDING", "PLANT_PATHOLOGY", "ENTOMOLOGY",
      "HORTICULTURE", "AGRI_ECONOMICS", "AGRI_EXTENSION", "SEED_SCIENCE", "PLANT_PHYSIOLOGY",
      "AGRI_ENGINEERING", "ANIMAL_HUSBANDRY", "OTHER"
    ];
    const validTypes = ["OFFICIAL_PYQ", "VERIFIED_PUBLISHED", "PRACTICE", "AI_GENERATED"];
    const validDiffs = ["EASY", "MEDIUM", "HARD"];
    const validExams = [
      "BSC_SEMESTER", "ICAR_ENTRANCE", "ICAR_JRF", "CUET_PG", "IBPS_AFO", "NABARD", "STATE_AO", "OTHER_COMPETITIVE"
    ];
    const base = {
      title: String(data.title || "").trim().slice(0, 120),
      semester: Math.min(8, Math.max(1, parseInt(data.semester, 10) || 1)),
      subject: String(data.subject || "").trim().slice(0, 80),
      questionText: String(data.questionText || "").trim().slice(0, 500),
      options,
      correctIndex: Math.min(3, Math.max(0, parseInt(data.correctIndex, 10) || 0)),
      explanation: String(data.explanation || "").trim().slice(0, 500),
      published: data.published !== false,
      updatedAt: serverTimestamp()
    };
    if (data.subjectKey && validSubjects.includes(data.subjectKey)) base.subjectKey = data.subjectKey;
    if (typeof data.topic === "string" && data.topic.trim()) base.topic = data.topic.trim().slice(0, 120);
    if (typeof data.questionTextBn === "string" && data.questionTextBn.trim()) base.questionTextBn = data.questionTextBn.trim().slice(0, 500);
    if (typeof data.explanationBn === "string" && data.explanationBn.trim()) base.explanationBn = data.explanationBn.trim().slice(0, 500);
    if (data.questionType && validTypes.includes(data.questionType)) base.questionType = data.questionType;
    if (data.difficulty && validDiffs.includes(data.difficulty)) base.difficulty = data.difficulty;
    if (data.examCategory && validExams.includes(data.examCategory)) base.examCategory = data.examCategory;
    if (typeof data.examYear === "string" && data.examYear.trim()) base.examYear = data.examYear.trim().slice(0, 20);
    if (typeof data.sourcePaper === "string" && data.sourcePaper.trim()) base.sourcePaper = data.sourcePaper.trim().slice(0, 160);
    if (typeof data.sourceUrl === "string" && data.sourceUrl.trim()) base.sourceUrl = data.sourceUrl.trim().slice(0, 400);

    if (editId) {
      await updateDoc(doc(this.db, "quizzes", editId), base);
    } else {
      await addDoc(collection(this.db, "quizzes"), { ...base, createdBy: uid, createdAt: serverTimestamp() });
    }
  }

  async deleteQuizQuestion(id) {
    await this.mods.fsMod.deleteDoc(this.mods.fsMod.doc(this.db, "quizzes", id));
  }

  async saveCareerOpportunity(uid, data, editId = "") {
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const base = {
      title: String(data.title || "").trim().slice(0, 150),
      organization: String(data.organization || "").trim().slice(0, 120),
      category: ["GOVT_JOB", "PRIVATE_JOB", "SCHOLARSHIP", "INTERNSHIP", "COMPETITIVE_EXAM"].includes(data.category) ? data.category : "GOVT_JOB",
      eligibility: String(data.eligibility || "").trim().slice(0, 200),
      deadline: String(data.deadline || "").trim().slice(0, 40),
      description: String(data.description || "").trim().slice(0, 1000),
      applyUrl: String(data.applyUrl || "").trim().slice(0, 400),
      published: data.published !== false,
      updatedAt: serverTimestamp()
    };
    if (editId) {
      await updateDoc(doc(this.db, "careerOpportunities", editId), base);
    } else {
      await addDoc(collection(this.db, "careerOpportunities"), { ...base, createdBy: uid, createdAt: serverTimestamp() });
    }
  }

  async deleteCareerOpportunity(id) {
    await this.mods.fsMod.deleteDoc(this.mods.fsMod.doc(this.db, "careerOpportunities", id));
  }

  async saveAnnouncement(uid, data, editId = "") {
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const base = {
      title: String(data.title || "").trim().slice(0, 120),
      message: String(data.message || "").trim().slice(0, 500),
      audience: ["ALL", "STUDENTS", "FARMERS"].includes(data.audience) ? data.audience : "ALL",
      active: data.active !== false,
      updatedAt: serverTimestamp()
    };
    if (editId) {
      await updateDoc(doc(this.db, "announcements", editId), base);
    } else {
      await addDoc(collection(this.db, "announcements"), { ...base, createdBy: uid, createdAt: serverTimestamp() });
    }
  }

  async deleteAnnouncement(id) {
    await this.mods.fsMod.deleteDoc(this.mods.fsMod.doc(this.db, "announcements", id));
  }

  async saveProfessorAsAdmin(adminUid, prof) {
    const { doc, setDoc, serverTimestamp } = this.mods.fsMod;
    const id = String(prof.id || "").trim() || ("prof_" + String(prof.name || "faculty").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40));
    const cleanEmail = String(prof.email || "").trim().toLowerCase().slice(0, 120);
    const cleanUid = String(prof.authorizedUid || "").trim().slice(0, 128);

    await setDoc(doc(this.db, "professors", id), {
      name: String(prof.name || "").trim().slice(0, 100),
      designation: String(prof.designation || "Assistant Professor").trim().slice(0, 100),
      qualification: String(prof.qualification || "").trim().slice(0, 100),
      subject: String(prof.subject || "").trim().slice(0, 80),
      department: String(prof.department || "Biological Science").trim().slice(0, 100),
      email: cleanEmail,
      specialization: String(prof.specialization || "").trim().slice(0, 200),
      avatarUrl: String(prof.avatarUrl || "").trim().slice(0, 500),
      authorizedUid: cleanUid,
      canHostMeetings: prof.canHostMeetings !== false,
      active: prof.active !== false,
      displayOrder: Math.min(100, Math.max(0, parseInt(prof.displayOrder, 10) || 10)),
      updatedAt: serverTimestamp()
    });

    if (cleanUid) {
      await setDoc(doc(this.db, "professorAccounts", cleanUid), {
        professorId: id,
        email: cleanEmail,
        canHostMeetings: prof.canHostMeetings !== false,
        active: prof.active !== false,
        addedBy: adminUid,
        createdAt: serverTimestamp()
      });
    }
  }

  async syncOfficialFacultyToFirestore() {
    const { doc, writeBatch, serverTimestamp } = this.mods.fsMod;
    const batch = writeBatch(this.db);
    OFFICIAL_FACULTY.forEach((p) => {
      batch.set(doc(this.db, "professors", p.id), {
        name: p.name,
        designation: p.designation,
        qualification: p.qualification,
        subject: p.subject,
        department: p.department,
        email: p.email.toLowerCase(),
        specialization: p.specialization,
        avatarUrl: p.avatarUrl,
        authorizedUid: p.authorizedUid,
        canHostMeetings: p.canHostMeetings,
        active: p.active,
        displayOrder: p.displayOrder,
        updatedAt: serverTimestamp()
      });
    });
    await batch.commit();
  }

  async saveAppSettings(settings) {
    const { doc, setDoc, serverTimestamp } = this.mods.fsMod;
    await setDoc(doc(this.db, "appSettings", "global"), {
      whatsappNumber: String(settings.whatsappNumber || "+919000000000").trim().slice(0, 25),
      whatsappGroupInviteUrl: String(settings.whatsappGroupInviteUrl || "").trim().slice(0, 300),
      supportEmail: String(settings.supportEmail || FOUNDER_EMAIL).trim().slice(0, 120),
      aboutText: String(settings.aboutText || DEFAULT_APP_SETTINGS.aboutText).trim().slice(0, 1000),
      heroHeadline: String(settings.heroHeadline || DEFAULT_APP_SETTINGS.heroHeadline).trim().slice(0, 140),
      studentModuleEnabled: settings.studentModuleEnabled !== false,
      moneyManagerEnabled: settings.moneyManagerEnabled !== false,
      farmerModuleEnabled: settings.farmerModuleEnabled !== false,
      toolsModuleEnabled: settings.toolsModuleEnabled !== false,
      aiAssistantEnabled: settings.aiAssistantEnabled !== false,
      careerModuleEnabled: settings.careerModuleEnabled !== false,
      communityModuleEnabled: settings.communityModuleEnabled !== false,
      meetingZoneEnabled: settings.meetingZoneEnabled !== false,
      doubtZoneEnabled: settings.doubtZoneEnabled !== false,
      aiModelName: settings.aiModelName === "gemini-3.5-flash-lite" ? "gemini-3.5-flash-lite" : "gemini-3.8-flash",
      aiFreeSearchEnabled: settings.aiFreeSearchEnabled !== false,
      aiDailyLimitPerUser: Math.min(200, Math.max(1, parseInt(settings.aiDailyLimitPerUser, 10) || 25)),
      aiPaidServicesApproved: Boolean(settings.aiPaidServicesApproved),
      maintenanceBanner: String(settings.maintenanceBanner || "").trim().slice(0, 300),
      updatedAt: serverTimestamp()
    });
  }

  async addAdminRole(founderUid, targetUid, email, roleTitle) {
    const { doc, setDoc, serverTimestamp } = this.mods.fsMod;
    await setDoc(doc(this.db, "admins", targetUid.trim()), {
      email: email.trim().toLowerCase().slice(0, 120),
      roleTitle: (roleTitle || "Admin").trim().slice(0, 60),
      addedBy: founderUid,
      createdAt: serverTimestamp()
    });
  }

  async removeAdminRole(targetUid) {
    await this.mods.fsMod.deleteDoc(this.mods.fsMod.doc(this.db, "admins", targetUid));
  }

  // Verified Market Prices CRUD (Admin-only writes, publicly readable)
  async saveMarketPriceAsAdmin(uid, data, editId = "") {
    if (!this.ready || !uid) throw new Error("Admin sign-in required.");
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const minP = Math.max(0, Number(data.minPrice) || 0);
    const maxP = Math.max(minP, Number(data.maxPrice) || minP);
    const modalP = Math.max(0, Number(data.modalPrice) || Math.round((minP + maxP) / 2));
    const base = {
      cropName: String(data.cropName || "").trim().slice(0, 80),
      cropNameBn: String(data.cropNameBn || "").trim().slice(0, 80),
      state: String(data.state || "West Bengal").trim().slice(0, 60),
      district: String(data.district || "").trim().slice(0, 80),
      marketName: String(data.marketName || "").trim().slice(0, 100),
      unit: String(data.unit || "₹ / Quintal").trim().slice(0, 40),
      minPrice: minP,
      maxPrice: maxP,
      modalPrice: modalP,
      reportDate: String(data.reportDate || new Date().toISOString().slice(0, 10)).trim().slice(0, 30),
      sourceName: String(data.sourceName || "").trim().slice(0, 120),
      sourceUrl: String(data.sourceUrl || "").trim().slice(0, 400),
      published: data.published !== false,
      updatedAt: serverTimestamp()
    };
    if (editId) {
      await updateDoc(doc(this.db, "marketPrices", editId), base);
    } else {
      await addDoc(collection(this.db, "marketPrices"), { ...base, createdBy: uid, createdAt: serverTimestamp() });
    }
  }

  async deleteMarketPriceAsAdmin(id) {
    await this.mods.fsMod.deleteDoc(this.mods.fsMod.doc(this.db, "marketPrices", id));
  }

  // --------------------------------------------------------------------------
  // PHASE 5: AGRICULTURE GOVERNMENT SCHEMES ADMIN MANAGEMENT + UPDATE HISTORY
  // --------------------------------------------------------------------------
  _validateSchemeHttpUrl(rawUrl, required = false, label = "URL") {
    const cleaned = String(rawUrl || "").trim().slice(0, 400);
    if (!cleaned) {
      if (required) throw new Error(`${label} is required and must start with https:// or http://.`);
      return "";
    }
    if (!/^https?:\/\//i.test(cleaned)) {
      throw new Error(`${label} must start with https:// or http://.`);
    }
    return cleaned;
  }

  _buildAgricultureSchemePayload(data) {
    const cleanList = (arr, maxItems = 20, maxLen = 220) =>
      (Array.isArray(arr) ? arr : [])
        .map((x) => String(x || "").trim().slice(0, maxLen))
        .filter(Boolean)
        .slice(0, maxItems);

    const cleanDocs = (docs) =>
      (Array.isArray(docs) ? docs : [])
        .map((d) => {
          if (typeof d === "string") {
            const s = d.trim().slice(0, 200);
            return s ? { en: s, bn: s, mandatory: true } : null;
          }
          const en = String(d?.en || "").trim().slice(0, 200);
          const bn = String(d?.bn || en).trim().slice(0, 220);
          if (!en && !bn) return null;
          return { en: en || bn, bn: bn || en, mandatory: d?.mandatory !== false };
        })
        .filter(Boolean)
        .slice(0, 20);

    const name = String(data.name || "").trim().slice(0, 200);
    if (name.length < 2) throw new Error("Scheme Name (English) must be at least 2 characters.");

    const rawSlug = String(data.schemeSlug || data.id || name)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    const schemeSlug = rawSlug.length >= 2 ? rawSlug : `scheme-${Date.now()}`;

    const officialSourceUrl = this._validateSchemeHttpUrl(
      data.officialSourceUrl || data.officialPortalUrl,
      true,
      "Official Source URL"
    );
    const officialPortalUrl = this._validateSchemeHttpUrl(data.officialPortalUrl, false, "Official Application Portal URL");

    const purpose = String(data.purpose || "").trim().slice(0, 1200);
    const benefits = String(data.benefits || "").trim().slice(0, 1500);
    const department = String(data.department || "").trim().slice(0, 200);
    if (purpose.length < 2) throw new Error("Scheme Purpose is required.");
    if (benefits.length < 2) throw new Error("Scheme Benefits are required.");
    if (department.length < 2) throw new Error("Relevant Government Department is required.");

    const validLevels = ["CENTRAL", "STATE", "DISTRICT"];
    const validStatuses = ["ACTIVE", "SEASONAL", "UNVERIFIED", "OUTDATED", "CLOSED"];
    const elig = data.eligibility || {};

    return {
      schemeSlug,
      name,
      nameBn: String(data.nameBn || "").trim().slice(0, 220),
      category: String(data.category || "OTHER_AGRI").trim(),
      secondaryCategories: cleanList(data.secondaryCategories, 5, 40),
      womenFarmerEligible: data.womenFarmerEligible !== false,
      govtLevel: validLevels.includes(data.govtLevel) ? data.govtLevel : "CENTRAL",
      applicableState: String(data.applicableState || "All India").trim().slice(0, 80) || "All India",
      applicableRegion: String(data.applicableRegion || data.applicableState || "All India").trim().slice(0, 220),
      applicableRegionBn: String(data.applicableRegionBn || "").trim().slice(0, 240),
      applicableDistricts: cleanList(data.applicableDistricts, 60, 80),
      purpose,
      purposeBn: String(data.purposeBn || "").trim().slice(0, 1400),
      benefits,
      benefitsBn: String(data.benefitsBn || "").trim().slice(0, 1700),
      eligibleCategories: String(data.eligibleCategories ?? elig.eligibleCategories ?? "").trim().slice(0, 600),
      eligibleCategoriesBn: String(data.eligibleCategoriesBn ?? elig.eligibleCategoriesBn ?? "").trim().slice(0, 700),
      landholding: String(data.landholding ?? elig.landholding ?? "").trim().slice(0, 500),
      landholdingBn: String(data.landholdingBn ?? elig.landholdingBn ?? "").trim().slice(0, 600),
      tenantFarmers: String(data.tenantFarmers ?? elig.tenantFarmers ?? "").trim().slice(0, 500),
      tenantFarmersBn: String(data.tenantFarmersBn ?? elig.tenantFarmersBn ?? "").trim().slice(0, 600),
      womenFarmers: String(data.womenFarmers ?? elig.womenFarmers ?? "").trim().slice(0, 500),
      womenFarmersBn: String(data.womenFarmersBn ?? elig.womenFarmersBn ?? "").trim().slice(0, 600),
      ageLimit: String(data.ageLimit ?? elig.ageLimit ?? "").trim().slice(0, 240),
      ageLimitBn: String(data.ageLimitBn ?? elig.ageLimitBn ?? "").trim().slice(0, 260),
      incomeLimit: String(data.incomeLimit ?? elig.incomeLimit ?? "").trim().slice(0, 400),
      incomeLimitBn: String(data.incomeLimitBn ?? elig.incomeLimitBn ?? "").trim().slice(0, 450),
      residency: String(data.residency ?? elig.residency ?? "").trim().slice(0, 400),
      residencyBn: String(data.residencyBn ?? elig.residencyBn ?? "").trim().slice(0, 450),
      whoCanApply: cleanList(data.whoCanApply, 20, 240),
      whoCanApplyBn: cleanList(data.whoCanApplyBn, 20, 260),
      whoCannotApply: cleanList(data.whoCannotApply, 20, 240),
      whoCannotApplyBn: cleanList(data.whoCannotApplyBn, 20, 260),
      requiredDocuments: cleanDocs(data.requiredDocuments),
      applicationProcess: String(data.applicationProcess || "").trim().slice(0, 1500),
      applicationProcessBn: String(data.applicationProcessBn || "").trim().slice(0, 1700),
      officialPortalUrl,
      offlineProcess: String(data.offlineProcess || "").trim().slice(0, 1200),
      offlineProcessBn: String(data.offlineProcessBn || "").trim().slice(0, 1400),
      department,
      departmentBn: String(data.departmentBn || "").trim().slice(0, 220),
      helpline: String(data.helpline || "").trim().slice(0, 180),
      helplineBn: String(data.helplineBn || "").trim().slice(0, 200),
      helplineTel: String(data.helplineTel || "").replace(/[^0-9+]/g, "").slice(0, 30),
      deadline: String(data.deadline || "").trim().slice(0, 240),
      deadlineBn: String(data.deadlineBn || "").trim().slice(0, 260),
      status: validStatuses.includes(data.status) ? data.status : "UNVERIFIED",
      lastVerifiedDate: String(data.lastVerifiedDate || "").trim().slice(0, 30),
      officialSourceUrl,
      officialSourceName: String(data.officialSourceName || department).trim().slice(0, 180) || "Official Government Source",
      lastUpdateNote: String(data.lastUpdateNote || "").trim().slice(0, 400),
      published: data.published !== false
    };
  }

  async _logAgricultureSchemeHistory(uid, actorEmail, {
    schemeId,
    schemeName,
    action,
    statusAfter,
    lastVerifiedDate = "",
    officialSourceUrl = "",
    summary = ""
  }) {
    const { collection, addDoc, serverTimestamp } = this.mods.fsMod;
    try {
      await addDoc(collection(this.db, "agricultureSchemeHistory"), {
        schemeId: String(schemeId || "unknown").slice(0, 128),
        schemeName: String(schemeName || "Scheme").slice(0, 200),
        action,
        statusAfter,
        lastVerifiedDate: String(lastVerifiedDate || "").slice(0, 30),
        officialSourceUrl: /^https?:\/\//i.test(String(officialSourceUrl || "")) ? String(officialSourceUrl).slice(0, 400) : "",
        summary: String(summary || `${action} on ${schemeName}`).slice(0, 400),
        actorUid: uid,
        actorEmail: String(actorEmail || "").trim().toLowerCase().slice(0, 120),
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Scheme history log failed:", err);
    }
  }

  async saveAgricultureSchemeAsAdmin(uid, actorEmail, data, editCloudId = "") {
    if (!this.ready || !uid) throw new Error("Admin sign-in required.");
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const base = this._buildAgricultureSchemePayload(data);
    let targetId = editCloudId;
    if (editCloudId) {
      await updateDoc(doc(this.db, "agricultureSchemes", editCloudId), {
        ...base,
        updatedAt: serverTimestamp()
      });
    } else {
      const ref = await addDoc(collection(this.db, "agricultureSchemes"), {
        ...base,
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      targetId = ref.id;
    }

    await this._logAgricultureSchemeHistory(uid, actorEmail, {
      schemeId: targetId,
      schemeName: base.name,
      action: editCloudId ? "UPDATE" : "CREATE",
      statusAfter: base.status,
      lastVerifiedDate: base.lastVerifiedDate,
      officialSourceUrl: base.officialSourceUrl,
      summary: base.lastUpdateNote || (editCloudId ? `Updated scheme details (${base.status})` : `Created scheme (${base.status})`)
    });
    return targetId;
  }

  async toggleAgricultureSchemePublishAsAdmin(uid, actorEmail, scheme, nextPublished) {
    if (!this.ready || !uid || !scheme) throw new Error("Admin sign-in required.");
    const { doc, updateDoc, serverTimestamp } = this.mods.fsMod;
    if (scheme.cloudId) {
      await updateDoc(doc(this.db, "agricultureSchemes", scheme.cloudId), {
        published: Boolean(nextPublished),
        updatedAt: serverTimestamp()
      });
      await this._logAgricultureSchemeHistory(uid, actorEmail, {
        schemeId: scheme.cloudId,
        schemeName: scheme.name,
        action: nextPublished ? "PUBLISH" : "UNPUBLISH",
        statusAfter: scheme.status || "ACTIVE",
        lastVerifiedDate: scheme.lastVerifiedDate || "",
        officialSourceUrl: scheme.officialSourceUrl || "",
        summary: nextPublished ? "Published scheme to farmers" : "Unpublished scheme from public view"
      });
      return scheme.cloudId;
    }
    // Baseline scheme not yet in Firestore: create a cloud override document with the requested publish state
    return this.saveAgricultureSchemeAsAdmin(uid, actorEmail, {
      ...scheme,
      schemeSlug: scheme.id,
      published: Boolean(nextPublished),
      lastUpdateNote: nextPublished ? "Published via Admin Control Studio" : "Unpublished via Admin Control Studio"
    }, "");
  }

  async markAgricultureSchemeStatusAsAdmin(uid, actorEmail, scheme, nextStatus, note = "") {
    if (!this.ready || !uid || !scheme) throw new Error("Admin sign-in required.");
    const { doc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const action = nextStatus === "OUTDATED" ? "MARK_OUTDATED" : "STATUS_CHANGE";
    const summary = note || `Changed scheme status to ${nextStatus}`;
    if (scheme.cloudId) {
      await updateDoc(doc(this.db, "agricultureSchemes", scheme.cloudId), {
        status: nextStatus,
        lastUpdateNote: summary.slice(0, 400),
        updatedAt: serverTimestamp()
      });
      await this._logAgricultureSchemeHistory(uid, actorEmail, {
        schemeId: scheme.cloudId,
        schemeName: scheme.name,
        action,
        statusAfter: nextStatus,
        lastVerifiedDate: scheme.lastVerifiedDate || "",
        officialSourceUrl: scheme.officialSourceUrl || "",
        summary
      });
      return scheme.cloudId;
    }
    return this.saveAgricultureSchemeAsAdmin(uid, actorEmail, {
      ...scheme,
      schemeSlug: scheme.id,
      status: nextStatus,
      lastUpdateNote: summary
    }, "");
  }

  async deleteAgricultureSchemeAsAdmin(uid, actorEmail, cloudId, schemeName = "Scheme") {
    if (!this.ready || !uid || !cloudId) throw new Error("Admin sign-in and Cloud Scheme ID required.");
    await this.mods.fsMod.deleteDoc(this.mods.fsMod.doc(this.db, "agricultureSchemes", cloudId));
    await this._logAgricultureSchemeHistory(uid, actorEmail, {
      schemeId: cloudId,
      schemeName,
      action: "DELETE",
      statusAfter: "DELETED",
      lastVerifiedDate: "",
      officialSourceUrl: "",
      summary: `Removed cloud scheme entry (${schemeName})`
    });
  }

  async deleteProfessorAsAdmin(id) {
    await this.mods.fsMod.deleteDoc(this.mods.fsMod.doc(this.db, "professors", id));
  }

  // Super Admin Approval for Pending Professor Role Requests
  async approveProfessorRequest(adminUid, applicantUser) {
    if (!this.ready || !adminUid || !applicantUser?.id) throw new Error("Super Admin sign-in required.");
    const { doc, setDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const targetUid = applicantUser.id;
    const profId = `prof_${targetUid.slice(0, 24).replace(/[^a-zA-Z0-9_]/g, "_")}`;
    const cleanEmail = (applicantUser.email || "").endsWith(".gurujivision.app")
      ? ""
      : String(applicantUser.email || "").trim().toLowerCase().slice(0, 120);

    await updateDoc(doc(this.db, "users", targetUid), {
      role: "PROFESSOR",
      professorApprovalStatus: "APPROVED",
      updatedAt: serverTimestamp()
    });

    await setDoc(doc(this.db, "professorAccounts", targetUid), {
      professorId: profId,
      email: cleanEmail,
      canHostMeetings: true,
      active: true,
      addedBy: adminUid,
      createdAt: serverTimestamp()
    });

    await setDoc(doc(this.db, "professors", profId), {
      name: String(applicantUser.displayName || "Professor").trim().slice(0, 100),
      designation: "Faculty Advisor",
      qualification: "",
      subject: String(applicantUser.subjectSpecialization || "Agriculture").trim().slice(0, 80),
      department: String(applicantUser.department || applicantUser.institutionOrVillage || "Agricultural Sciences").trim().slice(0, 100),
      email: cleanEmail,
      specialization: String(applicantUser.subjectSpecialization || "Agricultural Guidance & Research").trim().slice(0, 200),
      avatarUrl: String(applicantUser.photoUrl || "").slice(0, 500),
      authorizedUid: targetUid,
      canHostMeetings: true,
      active: true,
      displayOrder: 20,
      updatedAt: serverTimestamp()
    });
  }

  async rejectProfessorRequest(targetUid) {
    if (!this.ready || !targetUid) throw new Error("Super Admin sign-in required.");
    const { doc, updateDoc, serverTimestamp } = this.mods.fsMod;
    await updateDoc(doc(this.db, "users", targetUid), {
      professorApprovalStatus: "REJECTED",
      updatedAt: serverTimestamp()
    });
  }

  // Firebase Storage Upload (for Admin PDF uploads)
  async uploadPdfToStorage(file) {
    if (!this.ready || !this.storage) throw new Error("Firebase Storage unavailable.");
    const { ref, uploadBytes, getDownloadURL } = this.mods.storageMod;
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storageRef = ref(this.storage, `study_materials/${safeName}`);
    await uploadBytes(storageRef, file, { contentType: file.type || "application/pdf" });
    return getDownloadURL(storageRef);
  }

  // --------------------------------------------------------------------------
  // 10. OWNER CONTROL CENTER TELEMETRY (Founder-Only, NEVER private finances)
  // --------------------------------------------------------------------------
  subscribeOwnerTelemetry(isSuperAdmin, onUpdate) {
    if (!this.ready || !isSuperAdmin) return;
    if (this.ownerTelemetrySubscribed && this.activeUnsubs.has("ownerUsers")) return;
    this.ownerTelemetrySubscribed = true;
    const { collection, query, limit, onSnapshot } = this.mods.fsMod;

    const specs = [
      ["ownerUsers", "users", 250],
      ["ownerAdmins", "admins", 100],
      ["ownerActivities", "activityEvents", 200],
      ["ownerExamStats", "examStats", 200],
      ["ownerAiLogs", "aiUsageLogs", 200],
      ["ownerErrorLogs", "errorLogs", 100],
      ["ownerContentReports", "contentReports", 100],
      ["ownerAuditLogs", "adminAuditLogs", 100]
    ];

    specs.forEach(([stateKey, colName, lim]) => {
      this.setSub(stateKey, onSnapshot(query(collection(this.db, colName), limit(lim)), (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAtMs: getTimestampMs(d.data().createdAt) }))
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        onUpdate(stateKey, list);
      }, () => {}));
    });
  }

  async resolveErrorLog(id) {
    await this.mods.fsMod.updateDoc(this.mods.fsMod.doc(this.db, "errorLogs", id), { resolved: true });
  }

  async updateContentReportStatus(id, status) {
    const { doc, updateDoc, serverTimestamp } = this.mods.fsMod;
    await updateDoc(doc(this.db, "contentReports", id), { status, updatedAt: serverTimestamp() });
  }

  // --------------------------------------------------------------------------
  // 11. PHASE 7: STUDY BOOKMARKS, UNIVERSITY SYLLABI & DISCOVERED RESOURCES
  // --------------------------------------------------------------------------
  async saveStudyBookmark(uid, item) {
    if (!this.ready || !uid) throw new Error("Sign in required to save bookmarks.");
    const { doc, setDoc, serverTimestamp } = this.mods.fsMod;
    const itemType = ["NOTE", "MCQ", "SYLLABUS", "PROGRESS"].includes(item.itemType) ? item.itemType : "NOTE";
    const itemId = String(item.itemId || "").trim().slice(0, 140);
    if (!itemId) throw new Error("Missing bookmark item ID.");
    const docId = String(item.id || `${itemType}__${itemId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80)}`).slice(0, 120);
    await setDoc(doc(this.db, "users", uid, "studyBookmarks", docId), {
      itemType,
      itemId,
      title: String(item.title || "Saved Item").trim().slice(0, 180),
      subject: String(item.subject || "Agriculture").trim().slice(0, 100),
      semester: Math.min(8, Math.max(0, parseInt(item.semester, 10) || 0)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  async deleteStudyBookmark(uid, bookmarkDocId) {
    if (!this.ready || !uid || !bookmarkDocId) return;
    await this.mods.fsMod.deleteDoc(this.mods.fsMod.doc(this.db, "users", uid, "studyBookmarks", bookmarkDocId));
  }

  async saveUniversitySyllabus(uid, data, editId = "") {
    if (!this.ready || !uid) throw new Error("Admin sign-in required.");
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const validSubjects = [
      "AGRONOMY", "SOIL_SCIENCE", "GENETICS_BREEDING", "PLANT_PATHOLOGY", "ENTOMOLOGY",
      "HORTICULTURE", "AGRI_ECONOMICS", "AGRI_EXTENSION", "SEED_SCIENCE", "PLANT_PHYSIOLOGY",
      "AGRI_ENGINEERING", "ANIMAL_HUSBANDRY", "OTHER"
    ];
    const topics = Array.isArray(data.topics)
      ? data.topics.map((t) => String(t || "").trim()).filter(Boolean).slice(0, 40)
      : [];
    const base = {
      university: String(data.university || "").trim().slice(0, 160),
      universityShort: String(data.universityShort || "").trim().slice(0, 60),
      course: String(data.course || "B.Sc. (Hons.) Agriculture").trim().slice(0, 120),
      semester: Math.min(8, Math.max(1, parseInt(data.semester, 10) || 1)),
      subject: String(data.subject || "").trim().slice(0, 140),
      subjectKey: validSubjects.includes(data.subjectKey) ? data.subjectKey : "OTHER",
      topics,
      publicationYear: String(data.publicationYear || new Date().getFullYear()).trim().slice(0, 60),
      sourceUrl: String(data.sourceUrl || "").trim().slice(0, 400),
      pdfUrl: String(data.pdfUrl || "").trim().slice(0, 400),
      downloadPermitted: Boolean(data.downloadPermitted),
      published: data.published !== false,
      updatedAt: serverTimestamp()
    };
    if (editId) {
      await updateDoc(doc(this.db, "syllabi", editId), base);
    } else {
      await addDoc(collection(this.db, "syllabi"), { ...base, createdBy: uid, createdAt: serverTimestamp() });
    }
  }

  async deleteUniversitySyllabus(id) {
    if (!this.ready || !id) return;
    await this.mods.fsMod.deleteDoc(this.mods.fsMod.doc(this.db, "syllabi", id));
  }

  async saveDiscoveredStudyResource(uid, data, editId = "") {
    if (!this.ready || !uid) throw new Error("Admin sign-in required.");
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const validSubjects = [
      "AGRONOMY", "SOIL_SCIENCE", "GENETICS_BREEDING", "PLANT_PATHOLOGY", "ENTOMOLOGY",
      "HORTICULTURE", "AGRI_ECONOMICS", "AGRI_EXTENSION", "SEED_SCIENCE", "PLANT_PHYSIOLOGY",
      "AGRI_ENGINEERING", "ANIMAL_HUSBANDRY", "OTHER"
    ];
    const validCats = ["NOTES_PDF", "PYQ", "PRACTICAL", "SYLLABUS", "EXAM_NOTIFICATION"];
    const validMethods = ["RSS_FEED", "PUBLIC_API", "ADMIN_SUBMITTED"];
    const validStatuses = ["PENDING_REVIEW", "APPROVED_PUBLISHED", "REJECTED"];

    const sourceUrl = String(data.sourceUrl || "").trim().slice(0, 400);
    const title = String(data.title || "").trim().slice(0, 150);
    const dedupeKey = String(data.dedupeKey || `${sourceUrl.toLowerCase()}|${title.toLowerCase()}`).trim().slice(0, 240);

    const editableFields = {
      title,
      sourceWebsite: String(data.sourceWebsite || "Official Source").trim().slice(0, 140),
      publicationDate: String(data.publicationDate || new Date().toISOString().slice(0, 10)).trim().slice(0, 30),
      subjectKey: validSubjects.includes(data.subjectKey) ? data.subjectKey : "OTHER",
      topic: String(data.topic || "General Agriculture").trim().slice(0, 120),
      category: validCats.includes(data.category) ? data.category : "NOTES_PDF",
      sourceUrl,
      reviewStatus: validStatuses.includes(data.reviewStatus) ? data.reviewStatus : "PENDING_REVIEW",
      summary: String(data.summary || "").trim().slice(0, 500),
      reviewedBy: uid,
      updatedAt: serverTimestamp()
    };

    if (editId) {
      await updateDoc(doc(this.db, "discoveredStudyResources", editId), editableFields);
    } else {
      await addDoc(collection(this.db, "discoveredStudyResources"), {
        ...editableFields,
        dedupeKey,
        discoveryMethod: validMethods.includes(data.discoveryMethod) ? data.discoveryMethod : "ADMIN_SUBMITTED",
        createdAt: serverTimestamp()
      });
    }
  }

  async updateDiscoveredStudyResourceStatus(uid, id, reviewStatus) {
    if (!this.ready || !uid || !id) throw new Error("Admin sign-in required.");
    const { doc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const status = ["PENDING_REVIEW", "APPROVED_PUBLISHED", "REJECTED"].includes(reviewStatus) ? reviewStatus : "PENDING_REVIEW";
    await updateDoc(doc(this.db, "discoveredStudyResources", id), {
      reviewStatus: status,
      reviewedBy: uid,
      updatedAt: serverTimestamp()
    });
  }

  async deleteDiscoveredStudyResource(id) {
    if (!this.ready || !id) return;
    await this.mods.fsMod.deleteDoc(this.mods.fsMod.doc(this.db, "discoveredStudyResources", id));
  }
}

export const firebaseService = new FirebaseService();
