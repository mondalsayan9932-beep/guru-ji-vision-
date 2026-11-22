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

class FirebaseService {
  constructor() {
    this.ready = false;
    this.app = null;
    this.auth = null;
    this.db = null;
    this.storage = null;
    this.mods = null;
    this.recaptchaVerifier = null;
    this.linkRecaptchaVerifier = null;
    this.phoneConfirmationResult = null;
    this.phoneLinkConfirmationResult = null;
    this.authInFlight = false;
    this.activeUnsubs = new Map();
  }

  async init(onAuthCallback, onPublicUpdate, onRedirectOutcome) {
    try {
      const [appMod, authMod, fsMod, storageMod] = await Promise.all([
        import(`${FB_CDN}/firebase-app.js`),
        import(`${FB_CDN}/firebase-auth.js`),
        import(`${FB_CDN}/firebase-firestore.js`),
        import(`${FB_CDN}/firebase-storage.js`)
      ]);

      // Initialize Firebase strictly once
      this.app = appMod.getApps().length > 0 ? appMod.getApp() : appMod.initializeApp(FIREBASE_CONFIG);
      this.auth = authMod.getAuth(this.app);
      this.db = fsMod.getFirestore(this.app, FIRESTORE_DATABASE_ID);
      this.storage = storageMod.getStorage(this.app);
      this.mods = { appMod, authMod, fsMod, storageMod };
      this.ready = true;

      // Persist authenticated session cleanly across page refreshes & mobile tabs
      try {
        await authMod.setPersistence(this.auth, authMod.browserLocalPersistence);
      } catch (persistErr) {
        console.warn("Auth persistence fallback:", persistErr);
      }

      // Immediately subscribe to public collections so visitors see live updates without login
      if (onPublicUpdate) {
        this.subscribePublicCollections({ isAdmin: false, isSuperAdmin: false, isAuthorizedMeetingHost: false, onUpdate: onPublicUpdate });
      }

      // Handle Google Sign-In / Account Linking redirect results on return
      try {
        const redirectRes = await authMod.getRedirectResult(this.auth);
        if (redirectRes?.user && onRedirectOutcome) {
          onRedirectOutcome({ ok: true, user: redirectRes.user, fromRedirect: true });
        }
      } catch (redirectErr) {
        if (onRedirectOutcome) {
          onRedirectOutcome({ ok: false, error: this.formatAuthError(redirectErr, "google") });
        }
      }

      authMod.onAuthStateChanged(this.auth, async (user) => {
        if (onAuthCallback) await onAuthCallback(user);
      });
      return true;
    } catch (err) {
      console.warn("Firebase CDN unavailable; running in offline/fallback mode.", err);
      this.ready = false;
      if (onAuthCallback) await onAuthCallback(null);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // AUTHENTICATION: Primary Google Sign-In (Popup + Redirect Fallback) +
  // Real Firebase Phone SMS OTP + Secure Account Linking
  // --------------------------------------------------------------------------
  formatAuthError(err, channel = "auth") {
    const code = err?.code || "";
    if (code === "auth/unauthorized-domain") {
      return "This website domain is not yet authorized in Firebase Console → Authentication → Settings → Authorized domains. Please add this Netlify domain in Firebase Console.";
    }
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      return "Google Sign-In window was closed before completing. Tap 'Continue with Google (Gmail)' to try again.";
    }
    if (code === "auth/network-request-failed") {
      return "Network connection error. Check your internet connection and try again.";
    }
    if (code === "auth/account-exists-with-different-credential") {
      return "An account already exists with this email under another sign-in method. Sign in with your original method first, then link accounts in Profile.";
    }
    if (code === "auth/credential-already-in-use") {
      return "This mobile number or Google account is already linked to a different Guru Ji Vision account. Sign out and sign in with that credential instead to preserve its data.";
    }
    if (code === "auth/provider-already-linked") {
      return "This sign-in method is already linked to your Guru Ji Vision account.";
    }
    if (code === "auth/operation-not-allowed") {
      return channel === "phone"
        ? "Mobile SMS sign-in is not currently enabled in Firebase Console (Authentication → Sign-in method → Phone). Please use 'Continue with Google (Gmail)' above."
        : "Google Sign-In is not yet enabled in Firebase Console → Authentication → Sign-in method.";
    }
    if (code === "auth/quota-exceeded" || code === "auth/billing-not-enabled") {
      return "SMS OTP quota or Firebase billing limit has been reached for phone verification right now. Please use 'Continue with Google (Gmail)' above for instant sign-in.";
    }
    if (code === "auth/too-many-requests") {
      return "Too many OTP or login attempts from this device. Please wait a few minutes or sign in immediately with 'Continue with Google (Gmail)'.";
    }
    if (code === "auth/invalid-phone-number") {
      return "Please enter a valid mobile number (e.g., 10-digit Indian mobile number starting with 6–9).";
    }
    if (code === "auth/captcha-check-failed" || code === "auth/missing-client-identifier") {
      return "Security verification (reCAPTCHA) failed. Please refresh and try again, or use 'Continue with Google (Gmail)'.";
    }
    if (code === "auth/invalid-verification-code") {
      return "Incorrect 6-digit OTP code. Please check the SMS and enter the exact code.";
    }
    if (code === "auth/code-expired" || code === "auth/session-expired") {
      return "This OTP has expired. Please tap 'Resend OTP' to receive a new code.";
    }
    return err?.message || "Authentication failed. Please try again.";
  }

  validateMobileNumber(countryCode, rawNumber) {
    const cc = String(countryCode || "+91").trim();
    const digits = String(rawNumber || "").replace(/[^\d]/g, "");
    if (!/^\+\d{1,4}$/.test(cc)) {
      return { ok: false, error: "Select a valid country code (e.g. +91)." };
    }
    if (cc === "+91") {
      if (!/^[6-9]\d{9}$/.test(digits)) {
        return { ok: false, error: "Enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)." };
      }
    } else if (digits.length < 7 || digits.length > 15) {
      return { ok: false, error: "Enter a valid mobile number (7–15 digits)." };
    }
    return { ok: true, e164: `${cc}${digits}`, digits };
  }

  resetRecaptcha(target = "login") {
    const isLink = target === "link";
    const verifier = isLink ? this.linkRecaptchaVerifier : this.recaptchaVerifier;
    const containerId = isLink ? "link-recaptcha-container" : "recaptcha-container";
    if (verifier) {
      try { verifier.clear(); } catch (_) {}
      if (isLink) this.linkRecaptchaVerifier = null;
      else this.recaptchaVerifier = null;
    }
    if (typeof document !== "undefined") {
      const el = document.getElementById(containerId);
      if (el) el.innerHTML = "";
    }
  }

  async prepareInvisibleRecaptcha(containerId, target = "login", onExpired = null) {
    const { RecaptchaVerifier } = this.mods.authMod;
    // Always clear any stale verifier instance cleanly to avoid duplicate render errors
    this.resetRecaptcha(target);
    const verifier = new RecaptchaVerifier(this.auth, containerId, {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        this.resetRecaptcha(target);
        if (typeof onExpired === "function") onExpired();
      }
    });
    if (target === "link") this.linkRecaptchaVerifier = verifier;
    else this.recaptchaVerifier = verifier;
    await verifier.render();
    return verifier;
  }

  async signInWithGoogle() {
    if (!this.ready) return { ok: false, error: "Firebase Authentication is currently offline. Please check your internet connection." };
    if (this.authInFlight) return { ok: false, inFlight: true, error: "Sign-in is already in progress. Please wait..." };

    this.authInFlight = true;
    try {
      const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = this.mods.authMod;
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      try {
        const res = await signInWithPopup(this.auth, provider);
        return { ok: true, user: res.user };
      } catch (popupErr) {
        const code = popupErr?.code || "";
        // Automatic reliable redirect fallback when popups are blocked or unsupported (e.g. Android WebViews / strict browsers)
        if (
          code === "auth/popup-blocked" ||
          code === "auth/operation-not-supported-in-this-environment" ||
          code === "auth/web-storage-unsupported"
        ) {
          await signInWithRedirect(this.auth, provider);
          return { ok: true, redirecting: true };
        }
        return { ok: false, code, error: this.formatAuthError(popupErr, "google") };
      }
    } finally {
      this.authInFlight = false;
    }
  }

  async sendFirebaseSmsOtp(countryCode, rawNumber, recaptchaContainerId = "recaptcha-container", onExpired = null) {
    if (!this.ready) return { ok: false, error: "Firebase Authentication is currently offline." };
    if (this.authInFlight) return { ok: false, inFlight: true, error: "Please wait for the current request to finish." };

    const check = this.validateMobileNumber(countryCode, rawNumber);
    if (!check.ok) return check;

    this.authInFlight = true;
    try {
      const { signInWithPhoneNumber } = this.mods.authMod;
      const verifier = await this.prepareInvisibleRecaptcha(recaptchaContainerId, "login", onExpired);
      this.phoneConfirmationResult = await signInWithPhoneNumber(this.auth, check.e164, verifier);
      return { ok: true, phoneE164: check.e164 };
    } catch (err) {
      this.resetRecaptcha("login");
      return { ok: false, code: err?.code || "", error: this.formatAuthError(err, "phone") };
    } finally {
      this.authInFlight = false;
    }
  }

  async verifyFirebaseSmsOtp(code) {
    if (!this.phoneConfirmationResult) {
      return { ok: false, error: "Please request an SMS OTP first." };
    }
    const cleanCode = String(code || "").replace(/[^\d]/g, "");
    if (cleanCode.length !== 6) {
      return { ok: false, error: "Enter the 6-digit OTP code sent to your mobile number." };
    }
    if (this.authInFlight) return { ok: false, inFlight: true, error: "Verifying OTP..." };

    this.authInFlight = true;
    try {
      const cred = await this.phoneConfirmationResult.confirm(cleanCode);
      this.phoneConfirmationResult = null;
      this.resetRecaptcha("login");
      return { ok: true, user: cred.user };
    } catch (err) {
      return { ok: false, code: err?.code || "", error: this.formatAuthError(err, "phone") };
    } finally {
      this.authInFlight = false;
    }
  }

  // Secure Account Linking: Link Google to Phone account OR Link Mobile OTP to Google account (same UID!)
  async linkGoogleAccount() {
    if (!this.ready || !this.auth.currentUser) return { ok: false, error: "Sign in first to link your Google account." };
    if (this.authInFlight) return { ok: false, inFlight: true, error: "Request already in progress." };

    this.authInFlight = true;
    try {
      const { GoogleAuthProvider, linkWithPopup, linkWithRedirect } = this.mods.authMod;
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      try {
        const res = await linkWithPopup(this.auth.currentUser, provider);
        return { ok: true, user: res.user };
      } catch (err) {
        if (err?.code === "auth/popup-blocked" || err?.code === "auth/operation-not-supported-in-this-environment") {
          await linkWithRedirect(this.auth.currentUser, provider);
          return { ok: true, redirecting: true };
        }
        return { ok: false, code: err?.code || "", error: this.formatAuthError(err, "google") };
      }
    } finally {
      this.authInFlight = false;
    }
  }

  async sendPhoneLinkOtp(countryCode, rawNumber, recaptchaContainerId = "link-recaptcha-container", onExpired = null) {
    if (!this.ready || !this.auth.currentUser) return { ok: false, error: "Sign in first to link a mobile number." };
    if (this.authInFlight) return { ok: false, inFlight: true, error: "Request already in progress." };

    const check = this.validateMobileNumber(countryCode, rawNumber);
    if (!check.ok) return check;

    this.authInFlight = true;
    try {
      const { linkWithPhoneNumber } = this.mods.authMod;
      const verifier = await this.prepareInvisibleRecaptcha(recaptchaContainerId, "link", onExpired);
      this.phoneLinkConfirmationResult = await linkWithPhoneNumber(this.auth.currentUser, check.e164, verifier);
      return { ok: true, phoneE164: check.e164 };
    } catch (err) {
      this.resetRecaptcha("link");
      return { ok: false, code: err?.code || "", error: this.formatAuthError(err, "phone") };
    } finally {
      this.authInFlight = false;
    }
  }

  async confirmPhoneLinkOtp(code) {
    if (!this.phoneLinkConfirmationResult) {
      return { ok: false, error: "Request a verification OTP first." };
    }
    const cleanCode = String(code || "").replace(/[^\d]/g, "");
    if (cleanCode.length !== 6) {
      return { ok: false, error: "Enter the 6-digit OTP code." };
    }
    this.authInFlight = true;
    try {
      const res = await this.phoneLinkConfirmationResult.confirm(cleanCode);
      this.phoneLinkConfirmationResult = null;
      this.resetRecaptcha("link");
      return { ok: true, user: res.user };
    } catch (err) {
      return { ok: false, code: err?.code || "", error: this.formatAuthError(err, "phone") };
    } finally {
      this.authInFlight = false;
    }
  }

  async signOutUser() {
    this.unsubscribePrivate();
    this.phoneConfirmationResult = null;
    this.phoneLinkConfirmationResult = null;
    this.resetRecaptcha("login");
    this.resetRecaptcha("link");
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
  }

  unsubscribeAll() {
    for (const unsub of this.activeUnsubs.values()) {
      try { unsub(); } catch (_) {}
    }
    this.activeUnsubs.clear();
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

  subscribeUserProfile(uid, onData) {
    if (!this.ready || !uid) return;
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

    // Upgrade public subscriptions if user is Admin / SuperAdmin / Host
    this.subscribePublicCollections({ isAdmin, isSuperAdmin, isAuthorizedMeetingHost, onUpdate });

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
