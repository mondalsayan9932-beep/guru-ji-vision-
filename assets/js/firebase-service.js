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
  DEFAULT_APP_SETTINGS,
  WHATSAPP_OTP_ENDPOINT
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
    this.phoneConfirmationResult = null;
    this.activeUnsubs = new Map();
  }

  async init(onAuthCallback) {
    try {
      const [appMod, authMod, fsMod, storageMod] = await Promise.all([
        import(`${FB_CDN}/firebase-app.js`),
        import(`${FB_CDN}/firebase-auth.js`),
        import(`${FB_CDN}/firebase-firestore.js`),
        import(`${FB_CDN}/firebase-storage.js`)
      ]);

      this.app = appMod.initializeApp(FIREBASE_CONFIG);
      this.auth = authMod.getAuth(this.app);
      this.db = fsMod.getFirestore(this.app, FIRESTORE_DATABASE_ID);
      this.storage = storageMod.getStorage(this.app);
      this.mods = { appMod, authMod, fsMod, storageMod };
      this.ready = true;

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
  // AUTHENTICATION: WhatsApp OTP Backend Hook + Real Firebase Phone Auth +
  // Optional Google / Email Sign-In (NO fake OTPs, NO hardcoded secrets)
  // --------------------------------------------------------------------------
  hasWhatsAppOtpBackend() {
    return Boolean(WHATSAPP_OTP_ENDPOINT && WHATSAPP_OTP_ENDPOINT.startsWith("https://"));
  }

  async requestWhatsAppOtp(phoneE164) {
    if (!this.hasWhatsAppOtpBackend()) {
      return {
        ok: false,
        needsBackend: true,
        error: "WhatsApp Business OTP backend endpoint is not yet configured on this site. Use Real Firebase SMS Phone OTP below or deploy a Cloud Function for official WhatsApp Business Cloud API."
      };
    }
    try {
      const res = await fetch(`${WHATSAPP_OTP_ENDPOINT.replace(/\/$/, "")}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneE164, channel: "whatsapp" })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send WhatsApp OTP.");
      return { ok: true, sessionId: data.sessionId || "" };
    } catch (err) {
      return { ok: false, error: err.message || "WhatsApp OTP delivery failed." };
    }
  }

  async verifyWhatsAppOtp(phoneE164, code, sessionId = "") {
    if (!this.hasWhatsAppOtpBackend() || !this.ready) {
      return { ok: false, error: "WhatsApp OTP backend is not configured." };
    }
    try {
      const res = await fetch(`${WHATSAPP_OTP_ENDPOINT.replace(/\/$/, "")}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneE164, code, sessionId })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.customToken) {
        throw new Error(data.error || "Invalid or expired OTP.");
      }
      const cred = await this.mods.authMod.signInWithCustomToken(this.auth, data.customToken);
      return { ok: true, user: cred.user };
    } catch (err) {
      return { ok: false, error: err.message || "OTP verification failed." };
    }
  }

  async sendFirebaseSmsOtp(phoneE164, recaptchaContainerId) {
    if (!this.ready) return { ok: false, error: "Firebase Auth is offline." };
    try {
      const { RecaptchaVerifier, signInWithPhoneNumber } = this.mods.authMod;
      if (this.recaptchaVerifier) {
        try { this.recaptchaVerifier.clear(); } catch (_) {}
      }
      this.recaptchaVerifier = new RecaptchaVerifier(this.auth, recaptchaContainerId, {
        size: "invisible"
      });
      this.phoneConfirmationResult = await signInWithPhoneNumber(this.auth, phoneE164, this.recaptchaVerifier);
      return { ok: true };
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/operation-not-allowed") {
        return { ok: false, error: "Enable 'Phone' sign-in provider in Firebase Console → Authentication → Sign-in method first." };
      }
      if (code === "auth/unauthorized-domain") {
        return { ok: false, error: "Add your Netlify domain in Firebase Console → Authentication → Settings → Authorized domains." };
      }
      return { ok: false, error: err?.message || "Failed to send SMS OTP." };
    }
  }

  async verifyFirebaseSmsOtp(code) {
    if (!this.phoneConfirmationResult) {
      return { ok: false, error: "Request an OTP first." };
    }
    try {
      const cred = await this.phoneConfirmationResult.confirm(String(code).trim());
      this.phoneConfirmationResult = null;
      return { ok: true, user: cred.user };
    } catch (err) {
      return { ok: false, error: "Invalid or expired verification code." };
    }
  }

  async signInWithGoogle() {
    if (!this.ready) return { ok: false, error: "Firebase is offline." };
    try {
      const { GoogleAuthProvider, signInWithPopup } = this.mods.authMod;
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const res = await signInWithPopup(this.auth, provider);
      return { ok: true, user: res.user };
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/unauthorized-domain") {
        return { ok: false, error: "Add this Netlify domain under Firebase Console → Authentication → Settings → Authorized domains." };
      }
      if (code === "auth/popup-closed-by-user") {
        return { ok: false, error: "Sign-in cancelled." };
      }
      return { ok: false, error: err?.message || "Google Sign-In failed." };
    }
  }

  async signInWithEmail(email, password) {
    if (!this.ready) return { ok: false, error: "Firebase is offline." };
    try {
      const cred = await this.mods.authMod.signInWithEmailAndPassword(this.auth, email.trim(), password);
      return { ok: true, user: cred.user };
    } catch (err) {
      return { ok: false, error: err?.message || "Email sign-in failed." };
    }
  }

  async registerWithEmail(email, password, displayName) {
    if (!this.ready) return { ok: false, error: "Firebase is offline." };
    try {
      const cred = await this.mods.authMod.createUserWithEmailAndPassword(this.auth, email.trim(), password);
      if (displayName) {
        await this.mods.authMod.updateProfile(cred.user, { displayName: displayName.trim().slice(0, 80) });
      }
      return { ok: true, user: cred.user };
    } catch (err) {
      return { ok: false, error: err?.message || "Email registration failed." };
    }
  }

  async signOutUser() {
    this.unsubscribeAll();
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

  unsubscribeAll() {
    for (const unsub of this.activeUnsubs.values()) {
      try { unsub(); } catch (_) {}
    }
    this.activeUnsubs.clear();
  }

  // --------------------------------------------------------------------------
  // 1. USER PROFILE (/users/{uid})
  // --------------------------------------------------------------------------
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

  async saveUserProfile(user, profileData, isExisting) {
    if (!this.ready || !user) throw new Error("Sign in required.");
    const { doc, setDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const ref = doc(this.db, "users", user.uid);

    // Schema requires email string 3..120; preserve real email if present or generate phone-scoped address
    const fallbackEmail = user.phoneNumber
      ? `${user.phoneNumber.replace(/[^\d]/g, "")}@phone.gurujivision.app`
      : `${user.uid.slice(0, 12)}@user.gurujivision.app`;
    const email = (profileData.email || user.email || fallbackEmail).trim().slice(0, 120);
    const displayName = (profileData.displayName || user.displayName || "Scholar").trim().slice(0, 80) || "Scholar";
    const role = profileData.role === "FARMER" ? "FARMER" : "STUDENT";
    const semester = Math.min(8, Math.max(0, parseInt(profileData.semester, 10) || 1));
    const language = profileData.language === "BN" ? "BN" : "EN";

    if (isExisting) {
      await updateDoc(ref, {
        displayName,
        role,
        institutionOrVillage: String(profileData.institutionOrVillage || "").trim().slice(0, 120),
        district: String(profileData.district || "").trim().slice(0, 80),
        semester,
        language,
        photoUrl: String(profileData.photoUrl || user.photoURL || "").slice(0, 500),
        lastActiveAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(ref, {
        userId: user.uid,
        displayName,
        email,
        role,
        institutionOrVillage: String(profileData.institutionOrVillage || "").trim().slice(0, 120),
        district: String(profileData.district || "").trim().slice(0, 80),
        semester,
        language,
        photoUrl: String(profileData.photoUrl || user.photoURL || "").slice(0, 500),
        lastActiveAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  }

  // --------------------------------------------------------------------------
  // 2. PUBLIC / AUTHENTICATED COLLECTIONS LISTENERS
  // --------------------------------------------------------------------------
  subscribeEcosystemCollections({ isAdmin, isSuperAdmin, isAuthorizedMeetingHost, uid, onUpdate }) {
    if (!this.ready || !uid) return;
    const { collection, doc, query, where, limit, onSnapshot } = this.mods.fsMod;

    // Study Materials
    const matQ = isAdmin
      ? query(collection(this.db, "studyMaterials"), limit(200))
      : query(collection(this.db, "studyMaterials"), where("published", "==", true), limit(200));
    this.setSub("studyMaterials", onSnapshot(matQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt), fromCloud: true }))
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onUpdate("studyMaterials", list);
    }, () => {}));

    // Quizzes
    const quizQ = isAdmin
      ? query(collection(this.db, "quizzes"), limit(200))
      : query(collection(this.db, "quizzes"), where("published", "==", true), limit(200));
    this.setSub("quizzes", onSnapshot(quizQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt) }));
      onUpdate("quizzes", list);
    }, () => {}));

    // Career Opportunities
    const carQ = isAdmin
      ? query(collection(this.db, "careerOpportunities"), limit(150))
      : query(collection(this.db, "careerOpportunities"), where("published", "==", true), limit(150));
    this.setSub("careerOpportunities", onSnapshot(carQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt) }))
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onUpdate("careerOpportunities", list);
    }, () => {}));

    // Community Posts
    const postQ = isAdmin
      ? query(collection(this.db, "communityPosts"), limit(150))
      : query(collection(this.db, "communityPosts"), where("status", "==", "ACTIVE"), limit(150));
    this.setSub("communityPosts", onSnapshot(postQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt) }))
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onUpdate("communityPosts", list);
    }, () => {}));

    // Announcements
    const annQ = isAdmin
      ? query(collection(this.db, "announcements"), limit(100))
      : query(collection(this.db, "announcements"), where("active", "==", true), limit(100));
    this.setSub("announcements", onSnapshot(annQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt), fromCloud: true }))
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onUpdate("announcements", list);
    }, () => {}));

    // Farmer Queries (own queries or all for Admin)
    const fqQ = isAdmin
      ? query(collection(this.db, "farmerQueries"), limit(150))
      : query(collection(this.db, "farmerQueries"), where("userId", "==", uid), limit(100));
    this.setSub("farmerQueries", onSnapshot(fqQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt) }))
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onUpdate("farmerQueries", list);
    }, () => {}));

    // Meetings
    const meetQ = isAuthorizedMeetingHost
      ? query(collection(this.db, "meetings"), limit(120))
      : query(collection(this.db, "meetings"), where("published", "==", true), limit(120));
    this.setSub("meetings", onSnapshot(meetQ, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.scheduledAtEpochMs || 0) - (b.scheduledAtEpochMs || 0));
      onUpdate("meetings", list);
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
      onUpdate("professors", merged);
    }, () => {}));

    // App Settings (/appSettings/global)
    this.setSub("appSettings", onSnapshot(doc(this.db, "appSettings", "global"), (snap) => {
      if (snap.exists()) {
        onUpdate("appSettings", { ...DEFAULT_APP_SETTINGS, ...snap.data() });
      }
    }, () => {}));

    // PRIVATE OWNER-ONLY: Student Money Manager (/users/{uid}/transactions & /budgets)
    // Strictly scoped ONLY to request.auth.uid — NEVER queried for any other student!
    this.setSub("moneyTransactions", onSnapshot(query(collection(this.db, "users", uid, "transactions"), limit(300)), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAtMs: getTimestampMs(d.data().createdAt) }))
        .sort((a, b) => (b.dateLabel || "").localeCompare(a.dateLabel || "") || b.createdAtMs - a.createdAtMs);
      onUpdate("moneyTransactions", list);
    }, () => {}));

    this.setSub("moneyBudgets", onSnapshot(query(collection(this.db, "users", uid, "budgets"), limit(100)), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onUpdate("moneyBudgets", list);
    }, () => {}));

    // PRIVATE OWNER-ONLY: Quiz Attempts
    this.setSub("quizAttempts", onSnapshot(query(collection(this.db, "users", uid, "quizAttempts"), limit(100)), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAtMs: getTimestampMs(d.data().createdAt) }))
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      onUpdate("quizAttempts", list);
    }, () => {}));
  }

  // --------------------------------------------------------------------------
  // 3. PRIVATE STUDENT MONEY MANAGER CRUD (Owner-ONLY)
  // --------------------------------------------------------------------------
  async saveMoneyTransaction(uid, tx, editId = "") {
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = this.mods.fsMod;
    const base = {
      title: String(tx.title || "").trim().slice(0, 100),
      amount: Math.max(0.01, Math.min(10000000, Number(tx.amount) || 0)),
      type: tx.type === "INCOME" ? "INCOME" : "EXPENSE",
      category: tx.category || "OTHER",
      note: String(tx.note || "").trim().slice(0, 300),
      dateLabel: String(tx.dateLabel || new Date().toISOString().slice(0, 10)).trim().slice(0, 30),
      updatedAt: serverTimestamp()
    };
    const shared = String(tx.sharedWith || "").trim().slice(0, 100);
    if (shared) base.sharedWith = shared;

    if (editId) {
      await updateDoc(doc(this.db, "users", uid, "transactions", editId), base);
    } else {
      await addDoc(collection(this.db, "users", uid, "transactions"), { ...base, createdAt: serverTimestamp() });
    }
  }

  async deleteMoneyTransaction(uid, txId) {
    const { doc, deleteDoc } = this.mods.fsMod;
    await deleteDoc(doc(this.db, "users", uid, "transactions", txId));
  }

  async saveFinancialGoal(uid, goal, editId = "") {
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
  // 5. FARMER QUERIES (/farmerQueries)
  // --------------------------------------------------------------------------
  async createFarmerQuery(uid, farmerName, data) {
    const { collection, addDoc, serverTimestamp } = this.mods.fsMod;
    await addDoc(collection(this.db, "farmerQueries"), {
      userId: uid,
      farmerName: String(farmerName || "Farmer").trim().slice(0, 80),
      cropName: String(data.cropName || "").trim().slice(0, 80),
      category: ["DISEASE", "PEST", "FERTILIZER", "SOIL", "WEATHER", "OTHER"].includes(data.category) ? data.category : "DISEASE",
      description: String(data.description || "").trim().slice(0, 1000),
      district: String(data.district || "").trim().slice(0, 80),
      hasImage: Boolean(data.hasImage),
      imageSummary: String(data.imageSummary || "").trim().slice(0, 400),
      status: "OPEN",
      adminReply: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
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
  async createCommunityPost(uid, authorName, data) {
    const { collection, addDoc, serverTimestamp } = this.mods.fsMod;
    await addDoc(collection(this.db, "communityPosts"), {
      authorId: uid,
      authorName: String(authorName || "Student").trim().slice(0, 80),
      collegeGroup: String(data.collegeGroup || "General Agriculture").trim().slice(0, 100),
      topic: ["DOUBT", "NOTES_SHARE", "EXAM_PREP", "FARM_TALK"].includes(data.topic) ? data.topic : "DOUBT",
      title: String(data.title || "").trim().slice(0, 140),
      body: String(data.body || "").trim().slice(0, 1500),
      helpfulCount: 0,
      status: "ACTIVE",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
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

  async sendDoubtMessage({ uid, professor, studentId, studentName, studentSemester, senderRole, senderName, text, imageBase64 = "" }) {
    const { doc, collection, getDoc, writeBatch, serverTimestamp } = this.mods.fsMod;
    const chatId = buildDoubtChatId(professor.id, studentId);
    const cleanText = String(text || "").trim().slice(0, 2000);
    const hasImg = Boolean(imageBase64);
    if (!cleanText && !hasImg) throw new Error("Type a doubt or attach an image.");

    const threadRef = doc(this.db, "doubtChats", chatId);
    let existing = null;
    try {
      const snap = await getDoc(threadRef);
      if (snap.exists()) existing = snap.data();
    } catch (_) {}

    const preview = cleanText ? cleanText.slice(0, 180) : "[Photo attachment]";
    const profEmailLower = String(existing?.professorEmail ?? professor.email ?? "").trim().toLowerCase().slice(0, 120);
    const effectiveProfUid =
      senderRole === "PROFESSOR"
        ? uid
        : (existing?.professorUid || professor.authorizedUid || "").trim().slice(0, 128);

    const batch = writeBatch(this.db);
    if (!existing) {
      if (senderRole !== "STUDENT" || studentId !== uid) {
        throw new Error("Only the student can initiate a new private doubt thread.");
      }
      batch.set(threadRef, {
        studentId: uid,
        studentName: String(studentName || "Student").trim().slice(0, 80) || "Student",
        studentSemester: Math.min(8, Math.max(0, parseInt(studentSemester, 10) || 1)),
        professorId: professor.id,
        professorName: String(professor.name || "Professor").slice(0, 100),
        professorEmail: profEmailLower,
        professorUid: effectiveProfUid,
        lastMessagePreview: preview,
        lastSenderRole: "STUDENT",
        unreadForStudent: 0,
        unreadForProfessor: 1,
        studentLastReadAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      const nextUnreadStudent = senderRole === "PROFESSOR" ? (existing.unreadForStudent || 0) + 1 : 0;
      const nextUnreadProf = senderRole === "STUDENT" ? (existing.unreadForProfessor || 0) + 1 : 0;
      if (senderRole === "STUDENT") {
        batch.update(threadRef, {
          studentName: String(studentName || existing.studentName || "Student").trim().slice(0, 80),
          studentSemester: Math.min(8, Math.max(0, parseInt(studentSemester, 10) || 1)),
          lastMessagePreview: preview,
          lastSenderRole: "STUDENT",
          unreadForStudent: nextUnreadStudent,
          unreadForProfessor: nextUnreadProf,
          studentLastReadAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        batch.update(threadRef, {
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

    const msgRef = doc(collection(this.db, "doubtChats", chatId, "messages"));
    const msgPayload = {
      studentId: existing?.studentId || studentId,
      professorId: existing?.professorId || professor.id,
      professorEmail: profEmailLower,
      professorUid: effectiveProfUid,
      senderId: uid,
      senderName: String(senderName || (senderRole === "PROFESSOR" ? professor.name : "Student")).trim().slice(0, 80),
      senderRole,
      text: cleanText,
      hasImage: hasImg,
      readByRecipient: false,
      createdAt: serverTimestamp()
    };
    if (hasImg) msgPayload.imageBase64 = imageBase64;
    batch.set(msgRef, msgPayload);
    await batch.commit();
    return chatId;
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
