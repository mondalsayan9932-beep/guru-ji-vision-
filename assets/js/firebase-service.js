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
      "announcements", "meetings", "professors", "appSettings", "firestoreMarketPrices"
    ]);
    for (const [key, unsub] of this.activeUnsubs.entries()) {
      if (!publicKeys.has(key)) {
        try { unsub(); } catch (_) {}
        this.activeUnsubs.delete(key);
      }
    }
    this.privateSubKey = null;
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
      "announcements", "meetings", "professors", "firestoreMarketPrices", "appSettings"
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
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt) }))
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
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
    const requiredPrivateKeys = ["farmerQueries", "moneyTransactions", "moneyBudgets", "quizAttempts"];
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

    // PRIVATE OWNER-ONLY: Student Money Manager & Farmer Farm Ledger
    // Strictly scoped ONLY to request.auth.uid — ZERO Admin approval, NEVER exposed to Admin/Professors!
    this.setSub("moneyTransactions", onSnapshot(query(collection(this.db, "users", uid, "transactions"), limit(400)), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAtMs: getTimestampMs(d.data().createdAt) }))
        .sort((a, b) => (b.dateLabel || "").localeCompare(a.dateLabel || "") || b.createdAtMs - a.createdAtMs);
      onUpdate("moneyTransactions", list);
    }, () => {}));

    this.setSub("moneyBudgets", onSnapshot(query(collection(this.db, "users", uid, "budgets"), limit(100)), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const openingDoc = all.find((d) => d.kind === "OPENING_BALANCE" || d.id === "opening_balance");
      const goals = all.filter((d) => d.kind !== "OPENING_BALANCE" && d.id !== "opening_balance");
      onUpdate("moneyBudgets", goals);
      if (openingDoc) {
        onUpdate("openingBalance", Number(openingDoc.targetAmount) || 0);
      }
    }, () => {}));

    // PRIVATE OWNER-ONLY: Quiz Attempts
    this.setSub("quizAttempts", onSnapshot(query(collection(this.db, "users", uid, "quizAttempts"), limit(100)), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAtMs: getTimestampMs(d.data().createdAt) }))
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      onUpdate("quizAttempts", list);
    }, () => {}));
  }

  // --------------------------------------------------------------------------
  // 3. PRIVATE STUDENT MONEY MANAGER & FARMER FARM LEDGER CRUD (Owner-ONLY, NO Admin Approval)
  // --------------------------------------------------------------------------
  async saveMoneyTransaction(uid, tx, editId = "") {
    if (!this.ready || !uid) throw new Error("Sign in required to save personal financial entries.");
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const base = {
      title: String(tx.title || "").trim().slice(0, 100),
      amount: Math.max(0.01, Math.min(10000000, Number(tx.amount) || 0)),
      type: tx.type === "INCOME" ? "INCOME" : "EXPENSE",
      category: tx.category || "OTHER",
      ledgerScope: tx.ledgerScope === "FARMER" ? "FARMER" : "STUDENT",
      note: String(tx.note || "").trim().slice(0, 300),
      dateLabel: String(tx.dateLabel || new Date().toISOString().slice(0, 10)).trim().slice(0, 30),
      updatedAt: serverTimestamp()
    };
    const shared = String(tx.sharedWith || "").trim().slice(0, 100);
    if (shared) base.sharedWith = shared;
    const cropTag = String(tx.cropTag || "").trim().slice(0, 60);
    if (cropTag) base.cropTag = cropTag;

    if (editId) {
      await updateDoc(doc(this.db, "users", uid, "transactions", editId), base);
    } else {
      await addDoc(collection(this.db, "users", uid, "transactions"), { ...base, createdAt: serverTimestamp() });
    }
  }

  async deleteMoneyTransaction(uid, txId) {
    if (!this.ready || !uid) throw new Error("Sign in required.");
    const { doc, deleteDoc } = this.mods.fsMod;
    await deleteDoc(doc(this.db, "users", uid, "transactions", txId));
  }

  async saveOpeningBalance(uid, amount) {
    if (!this.ready || !uid) throw new Error("Sign in required.");
    const { doc, getDoc, setDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const cleanAmt = Math.max(0, Math.min(10000000, Number(amount) || 0));
    const ref = doc(this.db, "users", uid, "budgets", "opening_balance");
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
      await setDoc(ref, {
        name: "Opening Balance",
        kind: "OPENING_BALANCE",
        targetAmount: cleanAmt,
        savedAmount: cleanAmt,
        monthKey: "GLOBAL",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }

  async saveFinancialGoal(uid, goal, editId = "") {
    if (!this.ready || !uid) throw new Error("Sign in required.");
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const base = {
      name: String(goal.name || "").trim().slice(0, 80),
      kind: goal.kind === "SAVINGS_GOAL" ? "SAVINGS_GOAL" : "MONTHLY_BUDGET",
      targetAmount: Math.max(1, Math.min(10000000, Number(goal.targetAmount) || 0)),
      savedAmount: Math.max(0, Math.min(10000000, Number(goal.savedAmount) || 0)),
      monthKey: String(goal.monthKey || new Date().toISOString().slice(0, 7)).trim().slice(0, 20),
      updatedAt: serverTimestamp()
    };
    if (editId) {
      await updateDoc(doc(this.db, "users", uid, "budgets", editId), base);
    } else {
      await addDoc(collection(this.db, "users", uid, "budgets"), { ...base, createdAt: serverTimestamp() });
    }
  }

  async deleteFinancialGoal(uid, goalId) {
    if (!this.ready || !uid) throw new Error("Sign in required.");
    const { doc, deleteDoc } = this.mods.fsMod;
    await deleteDoc(doc(this.db, "users", uid, "budgets", goalId));
  }

  // --------------------------------------------------------------------------
  // 4. QUIZ ATTEMPT + EXAM STATS
  // --------------------------------------------------------------------------
  async recordQuizAttempt(uid, semester, score, totalQuestions) {
    const { collection, addDoc, serverTimestamp } = this.mods.fsMod;
    const sem = Math.min(8, Math.max(1, parseInt(semester, 10) || 1));
    const total = Math.max(1, parseInt(totalQuestions, 10) || 1);
    const sc = Math.min(total, Math.max(0, parseInt(score, 10) || 0));
    const pct = Math.round((sc * 100) / total);

    await addDoc(collection(this.db, "users", uid, "quizAttempts"), {
      semester: sem,
      score: sc,
      totalQuestions: total,
      createdAt: serverTimestamp()
    });
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
    const base = {
      collegeGroup: String(data.collegeGroup || "General Agriculture").trim().slice(0, 100),
      topic: ["DOUBT", "NOTES_SHARE", "EXAM_PREP", "FARM_TALK"].includes(data.topic) ? data.topic : "DOUBT",
      title: String(data.title || "").trim().slice(0, 140),
      body: String(data.body || "").trim().slice(0, 1500),
      updatedAt: serverTimestamp()
    };
    if (editId) {
      await updateDoc(doc(this.db, "communityPosts", editId), base);
    } else {
      await addDoc(collection(this.db, "communityPosts"), {
        ...base,
        authorId: uid,
        authorName: String(authorName || "Student").trim().slice(0, 80),
        helpfulCount: 0,
        status: "ACTIVE",
        createdAt: serverTimestamp()
      });
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
}

export const firebaseService = new FirebaseService();
