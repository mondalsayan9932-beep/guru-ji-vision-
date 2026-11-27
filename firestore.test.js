const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { test, before, after, beforeEach } = require("node:test");
const fs = require("node:fs");

let testEnv;
const PROJECT_ID = process.env.GCP_PROJECT || "demo-no-project";
const STUDENT_UID = "student_alice_101";
const FARMER_UID = "farmer_rahul_202";
const ADMIN_UID = "super_admin_999";
const STAFF_UID = "staff_admin_303";
const ADMIN_EMAIL = "mondalsayan9932@gmail.com";

const [emulatorHost, emulatorPortStr] = (
  process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085"
).split(":");
const emulatorPort = parseInt(emulatorPortStr, 10);

function pastTime(msAgo = 2000) {
  return new Date(Date.now() - msAgo);
}

before(async () => {
  const rules = fs.readFileSync("./firestore.rules", "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: emulatorHost,
      port: emulatorPort,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

test("Unauthenticated users can read intended public collections but are strictly blocked from private collections and all writes", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(db.collection("studyMaterials").where("published", "==", true).get());
  await assertSucceeds(db.collection("communityPosts").where("status", "==", "ACTIVE").get());
  await assertSucceeds(db.collection("marketPrices").where("published", "==", true).get());
  await assertSucceeds(db.collection("appSettings").doc("global").get());

  // Private & sensitive collections MUST remain strictly blocked
  await assertFails(db.collection("users").doc(STUDENT_UID).get());
  await assertFails(db.collection("users").doc(STUDENT_UID).collection("transactions").get());
  await assertFails(db.collection("users").doc(STUDENT_UID).collection("budgets").get());
  await assertFails(db.collection("farmerQueries").where("userId", "==", FARMER_UID).get());
  await assertFails(db.collection("doubtChats").where("studentId", "==", STUDENT_UID).get());
  await assertFails(db.collection("admins").get());
  await assertFails(db.collection("studyMaterials").where("published", "==", false).get());
});

test("User profile: owner create/read/update succeeds; PII & role escalation blocked", async () => {
  const studentDb = testEnv.authenticatedContext(STUDENT_UID, {
    email: "alice@agri.edu.in",
    email_verified: true,
  }).firestore();
  const farmerDb = testEnv.authenticatedContext(FARMER_UID, {
    email: "rahul@farm.in",
    email_verified: true,
  }).firestore();
  const ts = pastTime(5000);

  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).set({
      userId: STUDENT_UID,
      displayName: "Alice Sen",
      email: "alice@agri.edu.in",
      role: "STUDENT",
      institutionOrVillage: "BCKV Nadia",
      district: "Nadia",
      semester: 3,
      language: "EN",
      photoUrl: "https://lh3.googleusercontent.com/a/alice-avatar",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Farmer registration with valid FARMER role succeeds
  await assertSucceeds(
    farmerDb.collection("users").doc(FARMER_UID).set({
      userId: FARMER_UID,
      displayName: "Rahul Das",
      email: "rahul@farm.in",
      role: "FARMER",
      institutionOrVillage: "Memari",
      district: "Purba Bardhaman",
      semester: 0,
      language: "BN",
      photoUrl: "https://lh3.googleusercontent.com/a/rahul-avatar",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Owner can read & partially update profile
  await assertSucceeds(studentDb.collection("users").doc(STUDENT_UID).get());
  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).update({
      semester: 4,
      language: "BN",
      updatedAt: pastTime(1000),
    })
  );

  // PII Blanket Test: Farmer cannot read Student's profile or list users
  await assertFails(farmerDb.collection("users").doc(STUDENT_UID).get());
  await assertFails(farmerDb.collection("users").get());

  // Role Escalation Test: Public users can NEVER register or promote themselves as ADMIN or FOUNDER
  await assertFails(
    testEnv.authenticatedContext("rogue_user_1").firestore().collection("users").doc("rogue_user_1").set({
      userId: "rogue_user_1",
      displayName: "Hacker",
      email: "rogue@farm.in",
      role: "ADMIN",
      institutionOrVillage: "Village",
      district: "Hooghly",
      semester: 0,
      language: "EN",
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertFails(
    testEnv.authenticatedContext("rogue_user_2").firestore().collection("users").doc("rogue_user_2").set({
      userId: "rogue_user_2",
      displayName: "Fake Founder",
      email: "fakefounder@farm.in",
      role: "FOUNDER",
      institutionOrVillage: "Village",
      district: "Hooghly",
      semester: 0,
      language: "EN",
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertFails(
    studentDb.collection("users").doc(STUDENT_UID).update({
      isVerified: true,
      updatedAt: pastTime(500),
    })
  );
  // Future timestamp rejected
  await assertFails(
    studentDb.collection("users").doc(STUDENT_UID).update({
      district: "Bardhaman",
      updatedAt: new Date(Date.now() + 60000),
    })
  );
});

test("Student Money Manager: strictly private to owning student (even admin denied)", async () => {
  const studentDb = testEnv.authenticatedContext(STUDENT_UID).firestore();
  const farmerDb = testEnv.authenticatedContext(FARMER_UID).firestore();
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, {
    email: ADMIN_EMAIL,
    email_verified: true,
  }).firestore();
  const ts = pastTime(5000);

  // Create transaction matching Kotlin MoneyRepository payload (no @DocumentId 'id')
  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).collection("transactions").doc("tx_1").set({
      title: "Hostel Mess Bill",
      amount: 2400.0,
      type: "EXPENSE",
      category: "FOOD_MESS",
      note: "Monthly mess fees",
      dateLabel: "2026-11-20",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Create with optional sharedWith omitted vs provided
  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).collection("transactions").doc("tx_2").set({
      title: "Shared Lab Kit",
      amount: 450.0,
      type: "EXPENSE",
      category: "SHARED",
      note: "Split with roommate",
      dateLabel: "2026-11-20",
      sharedWith: "Rohan",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Add personal INCOME record
  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).collection("transactions").doc("tx_income").set({
      title: "ICAR Scholarship Stipend",
      amount: 5000.0,
      type: "INCOME",
      category: "SCHOLARSHIP",
      note: "Monthly stipend credit",
      dateLabel: "2026-11-01",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // List own transactions succeeds
  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).collection("transactions").get()
  );

  // Edit personal EXPENSE and INCOME records preserving createdAt succeeds
  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).collection("transactions").doc("tx_1").update({
      title: "Hostel Mess Bill (Revised)",
      amount: 2500.0,
      note: "Added evening tea",
      updatedAt: pastTime(1000),
    })
  );
  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).collection("transactions").doc("tx_income").update({
      title: "ICAR Merit Scholarship",
      amount: 5500.0,
      updatedAt: pastTime(900),
    })
  );

  // Delete own personal record succeeds
  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).collection("transactions").doc("tx_2").delete()
  );

  // Extra @DocumentId 'id' field rejected
  await assertFails(
    studentDb.collection("users").doc(STUDENT_UID).collection("transactions").doc("tx_3").set({
      id: "tx_3",
      title: "Bad Doc",
      amount: 100.0,
      type: "EXPENSE",
      category: "OTHER",
      note: "",
      dateLabel: "2026-11-20",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Cross-user, Staff, and Founder/Owner access ALL DENIED for private student finances
  await assertFails(
    farmerDb.collection("users").doc(STUDENT_UID).collection("transactions").get()
  );
  await assertFails(
    farmerDb.collection("users").doc(STUDENT_UID).collection("transactions").doc("tx_1").update({
      amount: 1.0,
      updatedAt: pastTime(500),
    })
  );
  await assertFails(
    farmerDb.collection("users").doc(STUDENT_UID).collection("transactions").doc("tx_1").delete()
  );
  await assertFails(
    adminDb.collection("users").doc(STUDENT_UID).collection("transactions").get()
  );
  await assertFails(
    adminDb.collection("users").doc(STUDENT_UID).collection("transactions").doc("tx_1").get()
  );
  await assertFails(
    adminDb.collection("users").doc(STUDENT_UID).collection("transactions").doc("tx_1").delete()
  );

  // Budget & Savings Goal: owner create, edit, delete succeed; Founder & other users denied
  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).collection("budgets").doc("goal_1").set({
      name: "November Budget",
      kind: "MONTHLY_BUDGET",
      targetAmount: 8000.0,
      savedAmount: 1500.0,
      monthKey: "2026-11",
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).collection("budgets").doc("goal_1").update({
      targetAmount: 8500.0,
      savedAmount: 2000.0,
      updatedAt: pastTime(800),
    })
  );
  await assertFails(
    farmerDb.collection("users").doc(STUDENT_UID).collection("budgets").doc("goal_1").get()
  );
  await assertFails(
    adminDb.collection("users").doc(STUDENT_UID).collection("budgets").get()
  );
  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).collection("budgets").doc("goal_1").delete()
  );
});

test("Farmer Queries: owner isolation, filtered list, admin reply, and RESOLVED terminal lock", async () => {
  const farmerDb = testEnv.authenticatedContext(FARMER_UID).firestore();
  const studentDb = testEnv.authenticatedContext(STUDENT_UID).firestore();
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, {
    email: ADMIN_EMAIL,
    email_verified: true,
  }).firestore();
  const ts = pastTime(5000);

  await assertSucceeds(
    farmerDb.collection("farmerQueries").doc("q_1").set({
      userId: FARMER_UID,
      farmerName: "Rahul Das",
      cropName: "Aman Paddy",
      category: "DISEASE",
      description: "Brown diamond-shaped lesions appearing on paddy leaves after rain.",
      district: "Purba Bardhaman",
      hasImage: true,
      imageSummary: "Suspected rice blast lesions on leaf blades.",
      status: "OPEN",
      adminReply: "",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Farmer filtered query succeeds; unfiltered query fails
  await assertSucceeds(
    farmerDb.collection("farmerQueries").where("userId", "==", FARMER_UID).get()
  );
  await assertFails(farmerDb.collection("farmerQueries").get());

  // Other user cannot read or tamper with farmer's private query
  await assertFails(studentDb.collection("farmerQueries").doc("q_1").get());
  await assertFails(
    studentDb.collection("farmerQueries").where("userId", "==", FARMER_UID).get()
  );

  // Farmer can edit while OPEN
  await assertSucceeds(
    farmerDb.collection("farmerQueries").doc("q_1").update({
      description: "Updated: lesions spreading rapidly across lower leaves.",
      updatedAt: pastTime(2000),
    })
  );

  // Admin can list all queries and resolve with expert reply
  await assertSucceeds(adminDb.collection("farmerQueries").get());
  await assertSucceeds(
    adminDb.collection("farmerQueries").doc("q_1").update({
      status: "RESOLVED",
      adminReply: "Apply Tricyclazole 75% WP as per KVK dosage after consulting local AO.",
      updatedAt: pastTime(1000),
    })
  );

  // Terminal State Locking: Farmer can no longer edit once RESOLVED
  await assertFails(
    farmerDb.collection("farmerQueries").doc("q_1").update({
      description: "Trying to edit after resolution",
      updatedAt: pastTime(500),
    })
  );
});

test("Email Spoofing Test & Admin Content Management (Study, Quizzes, Careers, Settings)", async () => {
  const spoofedAdminDb = testEnv.authenticatedContext("spoof_uid", {
    email: ADMIN_EMAIL,
    email_verified: false, // Unverified spoof!
  }).firestore();
  const realAdminDb = testEnv.authenticatedContext(ADMIN_UID, {
    email: ADMIN_EMAIL,
    email_verified: true,
  }).firestore();
  const studentDb = testEnv.authenticatedContext(STUDENT_UID).firestore();
  const ts = pastTime(4000);

  const studyPayload = {
    title: "Fundamentals of Agronomy - Sem 1 Notes",
    semester: 1,
    subject: "Agronomy",
    category: "NOTES_PDF",
    summary: "Complete ICAR syllabus notes on tillage, soil tilth, and crop geometry.",
    resourceUrl: "https://icar.org.in",
    published: true,
    createdBy: "spoof_uid",
    createdAt: ts,
    updatedAt: ts,
  };

  // Unverified spoof email MUST be rejected
  await assertFails(spoofedAdminDb.collection("studyMaterials").doc("m_1").set(studyPayload));

  // Real verified Super Admin succeeds
  await assertSucceeds(
    realAdminDb.collection("studyMaterials").doc("m_1").set({
      ...studyPayload,
      createdBy: ADMIN_UID,
    })
  );

  // Student can query published materials, cannot query unfiltered or write
  await assertSucceeds(
    studentDb.collection("studyMaterials").where("published", "==", true).get()
  );
  await assertFails(studentDb.collection("studyMaterials").get());
  await assertFails(
    studentDb.collection("studyMaterials").doc("m_2").set({
      ...studyPayload,
      createdBy: STUDENT_UID,
    })
  );

  // Admin manages global settings and staff roles
  await assertSucceeds(
    realAdminDb.collection("appSettings").doc("global").set({
      whatsappNumber: "+919876543210",
      supportEmail: "support@gurujivision.in",
      aboutText: "Guru Ji Vision empowers Indian agriculture students and farmers.",
      heroHeadline: "Smart Agriculture & Education Ecosystem",
      updatedAt: ts,
    })
  );
  await assertSucceeds(studentDb.collection("appSettings").doc("global").get());
  await assertFails(
    studentDb.collection("appSettings").doc("global").update({
      whatsappNumber: "+910000000000",
      updatedAt: pastTime(500),
    })
  );

  // Super Admin adds staff admin who then gains admin write access
  await assertSucceeds(
    realAdminDb.collection("admins").doc(STAFF_UID).set({
      email: "staff@gurujivision.in",
      roleTitle: "Content Moderator",
      addedBy: ADMIN_UID,
      createdAt: ts,
    })
  );
  const staffDb = testEnv.authenticatedContext(STAFF_UID).firestore();
  await assertSucceeds(
    staffDb.collection("announcements").doc("ann_1").set({
      title: "ICAR JRF Mock Test Open",
      message: "Attempt Semester 4 Agronomy MCQ set before Friday.",
      audience: "STUDENTS",
      active: true,
      createdBy: STAFF_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );
});

test("Community Posts: creation, +1 helpful upvote, and admin moderation", async () => {
  const studentDb = testEnv.authenticatedContext(STUDENT_UID).firestore();
  const farmerDb = testEnv.authenticatedContext(FARMER_UID).firestore();
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, {
    email: ADMIN_EMAIL,
    email_verified: true,
  }).firestore();
  const ts = pastTime(4000);

  await assertSucceeds(
    studentDb.collection("communityPosts").doc("post_1").set({
      authorId: STUDENT_UID,
      authorName: "Alice Sen",
      collegeGroup: "BCKV Nadia",
      topic: "DOUBT",
      title: "Difference between SRI and conventional paddy transplanting?",
      body: "Can someone explain exact spacing and water schedule in SRI method?",
      helpfulCount: 0,
      status: "ACTIVE",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Active filtered query succeeds
  await assertSucceeds(
    farmerDb.collection("communityPosts").where("status", "==", "ACTIVE").get()
  );

  // Another user can upvote helpfulCount by +1 only
  await assertSucceeds(
    farmerDb.collection("communityPosts").doc("post_1").update({
      helpfulCount: 1,
      updatedAt: pastTime(1500),
    })
  );
  // Jumping by +5 fails
  await assertFails(
    farmerDb.collection("communityPosts").doc("post_1").update({
      helpfulCount: 6,
      updatedAt: pastTime(1000),
    })
  );

  // Admin can moderate post to HIDDEN
  await assertSucceeds(
    adminDb.collection("communityPosts").doc("post_1").update({
      status: "HIDDEN",
      updatedAt: pastTime(500),
    })
  );
});

test("Owner Monitoring Telemetry: AI usage, activity, examStats, errorLogs & contentReports strictly owner-scoped", async () => {
  const studentDb = testEnv.authenticatedContext(STUDENT_UID, {
    email: "alice@agri.edu.in",
    email_verified: true,
  }).firestore();
  const staffDb = testEnv.authenticatedContext(STAFF_UID, {
    email: "staff@gurujivision.in",
    email_verified: true,
  }).firestore();
  const ownerDb = testEnv.authenticatedContext(ADMIN_UID, {
    email: ADMIN_EMAIL,
    email_verified: true,
  }).firestore();
  const ts = pastTime(4000);

  // Add staff admin first as Super Admin
  await assertSucceeds(
    ownerDb.collection("admins").doc(STAFF_UID).set({
      email: "staff@gurujivision.in",
      roleTitle: "Moderator",
      addedBy: ADMIN_UID,
      createdAt: ts,
    })
  );

  // Staff admin CANNOT escalate by adding another admin (Super Admin only)
  await assertFails(
    staffDb.collection("admins").doc("rogue_uid").set({
      email: "rogue@bad.com",
      roleTitle: "Admin",
      addedBy: STAFF_UID,
      createdAt: ts,
    })
  );

  // Student logs real AI usage, activity event, exam stat, error log, and content report
  await assertSucceeds(
    studentDb.collection("aiUsageLogs").doc("ai_1").set({
      userId: STUDENT_UID,
      modelName: "gemini-3.8-flash",
      feature: "AI_CHAT",
      language: "BN",
      promptTokens: 120,
      outputTokens: 340,
      latencyMs: 1450,
      success: true,
      hasImage: false,
      createdAt: ts,
    })
  );
  await assertSucceeds(
    studentDb.collection("activityEvents").doc("ev_1").set({
      userId: STUDENT_UID,
      userRole: "STUDENT",
      eventType: "STUDY_VIEW",
      module: "STUDENT",
      detail: "Opened Sem 1 Agronomy Notes",
      createdAt: ts,
    })
  );
  await assertSucceeds(
    studentDb.collection("examStats").doc("ex_1").set({
      userId: STUDENT_UID,
      semester: 1,
      score: 3,
      totalQuestions: 3,
      percentage: 100,
      createdAt: ts,
    })
  );
  await assertSucceeds(
    studentDb.collection("errorLogs").doc("err_1").set({
      userId: STUDENT_UID,
      source: "AI_LOGIC",
      severity: "WARNING",
      module: "AI_ASSISTANT",
      message: "Request timed out after 60 seconds.",
      resolved: false,
      createdAt: ts,
    })
  );
  await assertSucceeds(
    studentDb.collection("contentReports").doc("rep_1").set({
      reporterId: STUDENT_UID,
      reporterName: "Alice Sen",
      targetType: "COMMUNITY_POST",
      targetId: "post_1",
      targetTitle: "Spam post",
      reason: "Off-topic advertisement",
      status: "PENDING",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Non-owner (Student AND Staff) CANNOT list owner-only telemetry (aiUsageLogs, activityEvents, errorLogs)
  await assertFails(studentDb.collection("aiUsageLogs").get());
  await assertFails(staffDb.collection("aiUsageLogs").get());
  await assertFails(studentDb.collection("activityEvents").get());
  await assertFails(staffDb.collection("activityEvents").get());
  await assertFails(studentDb.collection("errorLogs").get());
  await assertFails(staffDb.collection("errorLogs").get());

  // Platform Owner (Super Admin) CAN read all monitoring streams and resolve alerts/reports
  await assertSucceeds(ownerDb.collection("aiUsageLogs").get());
  await assertSucceeds(ownerDb.collection("activityEvents").get());
  await assertSucceeds(ownerDb.collection("examStats").get());
  await assertSucceeds(ownerDb.collection("errorLogs").get());
  await assertSucceeds(ownerDb.collection("contentReports").get());

  await assertSucceeds(
    ownerDb.collection("errorLogs").doc("err_1").update({ resolved: true })
  );
  await assertSucceeds(
    ownerDb.collection("contentReports").doc("rep_1").update({
      status: "ACTION_TAKEN",
      updatedAt: pastTime(1000),
    })
  );

  // Owner updates module feature flags and exact WhatsApp Group Invite URL on appSettings/global
  await assertSucceeds(
    ownerDb.collection("appSettings").doc("global").set({
      whatsappNumber: "+919000000000",
      whatsappGroupInviteUrl: "https://chat.whatsapp.com/FUtzkunI4u097tdsa1dIxl?s=cl&p=a&iam=2",
      supportEmail: ADMIN_EMAIL,
      aboutText: "Guru Ji Vision Ecosystem",
      heroHeadline: "Empowering Indian Agriculture",
      studentModuleEnabled: true,
      moneyManagerEnabled: true,
      farmerModuleEnabled: true,
      toolsModuleEnabled: true,
      aiAssistantEnabled: false,
      careerModuleEnabled: true,
      communityModuleEnabled: true,
      maintenanceBanner: "Scheduled AI upgrade in progress",
      updatedAt: pastTime(500),
    })
  );

  // Staff admin CANNOT mutate Founder-only appSettings/global or list /users
  await assertFails(
    staffDb.collection("appSettings").doc("global").update({
      aiAssistantEnabled: true,
      updatedAt: pastTime(300),
    })
  );
  await assertFails(staffDb.collection("users").get());
});

test("Founder Custom Claims & Immutable Admin Audit Logs strictly enforced", async () => {
  const founderClaimDb = testEnv.authenticatedContext("founder_claim_uid", {
    email: "founder-claim@gurujivision.in",
    email_verified: true,
    founder: true,
    role: "FOUNDER",
  }).firestore();
  const studentDb = testEnv.authenticatedContext(STUDENT_UID, {
    email: "alice@agri.edu.in",
    email_verified: true,
  }).firestore();
  const farmerDb = testEnv.authenticatedContext(FARMER_UID, {
    email: "rahul@farm.in",
    email_verified: true,
  }).firestore();
  const ts = pastTime(3000);

  // Founder with server-side custom claim can create & read audit logs
  await assertSucceeds(
    founderClaimDb.collection("adminAuditLogs").doc("audit_1").set({
      actorUid: "founder_claim_uid",
      actorEmail: "founder-claim@gurujivision.in",
      action: "SETTINGS_UPDATED",
      targetType: "APP_SETTINGS",
      targetId: "global",
      summary: "Updated WhatsApp Group Invite URL and module flags",
      createdAt: ts,
    })
  );
  await assertSucceeds(founderClaimDb.collection("adminAuditLogs").get());

  // Audit logs are strictly IMMUTABLE (even Founder cannot edit or delete)
  await assertFails(
    founderClaimDb.collection("adminAuditLogs").doc("audit_1").update({
      summary: "Tampered log",
    })
  );
  await assertFails(
    founderClaimDb.collection("adminAuditLogs").doc("audit_1").delete()
  );

  // Ordinary Students and Farmers are completely blocked from reading or writing audit logs
  await assertFails(studentDb.collection("adminAuditLogs").get());
  await assertFails(farmerDb.collection("adminAuditLogs").get());
  await assertFails(
    studentDb.collection("adminAuditLogs").doc("audit_fake").set({
      actorUid: STUDENT_UID,
      actorEmail: "alice@agri.edu.in",
      action: "FAKE",
      targetType: "NONE",
      targetId: "x",
      summary: "Student trying to write audit log",
      createdAt: ts,
    })
  );
});

test("Meeting Zone: authorized professors & Founder can create/edit/delete meetings; students are read-only", async () => {
  const studentDb = testEnv.authenticatedContext(STUDENT_UID, {
    email: "alice@agri.edu.in",
    email_verified: true,
  }).firestore();
  const prof1Db = testEnv.authenticatedContext("prof_uid_anulina", {
    email: "anuman.lin@gmail.com",
    email_verified: true,
  }).firestore();
  const prof2Db = testEnv.authenticatedContext("prof_uid_sudip", {
    email: "sudipbhattacharya234@gmail.com",
    email_verified: true,
  }).firestore();
  const ownerDb = testEnv.authenticatedContext(ADMIN_UID, {
    email: ADMIN_EMAIL,
    email_verified: true,
  }).firestore();
  const ts = pastTime(4000);

  const meetingPayload = {
    title: "Plant Tissue Culture Live Workshop",
    subject: "Botany",
    description: "Micropropagation protocols, MS media preparation, and Q&A.",
    meetUrl: "https://meet.google.com/abc-defg-hij",
    scheduledDate: "2026-12-01",
    scheduledTime: "04:00 PM",
    scheduledAtEpochMs: Date.now() + 86400000,
    hostName: "Dr. Anulina Manna",
    hostUid: "prof_uid_anulina",
    notifyStudents: true,
    published: true,
    createdAt: ts,
    updatedAt: ts,
  };

  // Student CANNOT create a meeting
  await assertFails(
    studentDb.collection("meetings").doc("meet_bad").set({
      ...meetingPayload,
      hostUid: STUDENT_UID,
    })
  );

  // Non-Google-Meet URL is rejected
  await assertFails(
    prof1Db.collection("meetings").doc("meet_bad_url").set({
      ...meetingPayload,
      meetUrl: "https://evil.example.com/fake-meet",
    })
  );

  // Authorized professor CAN create a valid Google Meet session and broadcast a student notice
  await assertSucceeds(prof1Db.collection("meetings").doc("meet_1").set(meetingPayload));
  await assertSucceeds(
    prof1Db.collection("announcements").doc("meet_notice_1").set({
      title: "Upcoming Live Class: Plant Tissue Culture Live Workshop",
      message: "Join Dr. Anulina Manna on 2026-12-01 at 04:00 PM via Meeting Zone.",
      audience: "STUDENTS",
      active: true,
      createdBy: "prof_uid_anulina",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Student CAN read published meetings with aligned filter, CANNOT edit or delete
  await assertSucceeds(studentDb.collection("meetings").where("published", "==", true).get());
  await assertFails(
    studentDb.collection("meetings").doc("meet_1").update({
      title: "Hacked title",
      updatedAt: pastTime(500),
    })
  );
  await assertFails(studentDb.collection("meetings").doc("meet_1").delete());

  // Another professor CANNOT edit or delete Dr. Anulina's meeting
  await assertFails(
    prof2Db.collection("meetings").doc("meet_1").update({
      title: "Hijacked by another prof",
      updatedAt: pastTime(500),
    })
  );
  await assertFails(prof2Db.collection("meetings").doc("meet_1").delete());

  // Original host professor CAN edit their meeting
  await assertSucceeds(
    prof1Db.collection("meetings").doc("meet_1").update({
      scheduledTime: "05:00 PM",
      updatedAt: pastTime(500),
    })
  );

  // Founder / Owner CAN edit & delete any meeting
  await assertSucceeds(
    ownerDb.collection("meetings").doc("meet_1").update({
      title: "Plant Tissue Culture Live Workshop (Updated)",
      updatedAt: pastTime(300),
    })
  );
  await assertSucceeds(ownerDb.collection("meetings").doc("meet_1").delete());
});

test("Doubt Zone: strict 1-on-1 student-professor privacy (other students, other professors & Admin ALL denied)", async () => {
  const student1Uid = STUDENT_UID;
  const student2Uid = "student_bob_404";
  const prof1Uid = "prof_uid_anulina";
  const prof2Uid = "prof_uid_sudip";
  const profMonirulUid = "prof_uid_monirul";

  const student1Db = testEnv.authenticatedContext(student1Uid, {
    email: "alice@agri.edu.in",
    email_verified: true,
  }).firestore();
  const student2Db = testEnv.authenticatedContext(student2Uid, {
    email: "bob@agri.edu.in",
    email_verified: true,
  }).firestore();
  const prof1Db = testEnv.authenticatedContext(prof1Uid, {
    email: "anuman.lin@gmail.com",
    email_verified: true,
  }).firestore();
  const prof2Db = testEnv.authenticatedContext(prof2Uid, {
    email: "sudipbhattacharya234@gmail.com",
    email_verified: true,
  }).firestore();
  const profMonirulDb = testEnv.authenticatedContext(profMonirulUid, {
    email: "monirul.personal@gmail.com",
    email_verified: true,
  }).firestore();
  const ownerDb = testEnv.authenticatedContext(ADMIN_UID, {
    email: ADMIN_EMAIL,
    email_verified: true,
  }).firestore();
  const ts = pastTime(5000);

  // Founder manages Professor profiles & links Dr. Monirul Haque via professorAccounts
  await assertSucceeds(
    ownerDb.collection("professors").doc("prof_monirul_haque").set({
      name: "Dr. Monirul Haque",
      designation: "Assistant Professor",
      qualification: "",
      subject: "",
      department: "Biological Sciences",
      email: "",
      specialization: "Agricultural Extension and Rural Development Related Advisor",
      avatarUrl: "",
      authorizedUid: profMonirulUid,
      canHostMeetings: true,
      active: true,
      displayOrder: 5,
      updatedAt: ts,
    })
  );
  await assertSucceeds(
    ownerDb.collection("professorAccounts").doc(profMonirulUid).set({
      professorId: "prof_monirul_haque",
      email: "monirul.personal@gmail.com",
      canHostMeetings: true,
      active: true,
      addedBy: ADMIN_UID,
      createdAt: ts,
    })
  );

  // Student cannot tamper with professor directory
  await assertFails(
    student1Db.collection("professors").doc("prof_monirul_haque").update({
      name: "Tampered Prof",
      updatedAt: pastTime(1000),
    })
  );
  // Student can read active professor directory
  await assertSucceeds(student1Db.collection("professors").where("active", "==", true).get());

  // Student 1 starts a private chat thread with Dr. Anulina Manna
  const chatId = `prof_anulina_manna__${student1Uid}`;
  await assertSucceeds(
    student1Db.collection("doubtChats").doc(chatId).set({
      studentId: student1Uid,
      studentName: "Alice Sen",
      studentSemester: 3,
      professorId: "prof_anulina_manna",
      professorName: "Dr. Anulina Manna",
      professorEmail: "anuman.lin@gmail.com",
      professorUid: "",
      lastMessagePreview: "Ma'am, how to avoid callus browning in explants?",
      lastSenderRole: "STUDENT",
      unreadForStudent: 0,
      unreadForProfessor: 1,
      studentLastReadAt: ts,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Student 1 sends a text + image message
  await assertSucceeds(
    student1Db.collection("doubtChats").doc(chatId).collection("messages").doc("msg_1").set({
      studentId: student1Uid,
      professorId: "prof_anulina_manna",
      professorEmail: "anuman.lin@gmail.com",
      professorUid: "",
      senderId: student1Uid,
      senderName: "Alice Sen",
      senderRole: "STUDENT",
      text: "Ma'am, how to avoid callus browning in explants?",
      hasImage: true,
      imageBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      readByRecipient: false,
      createdAt: ts,
    })
  );

  // Student 1 can list their own chats & messages
  await assertSucceeds(student1Db.collection("doubtChats").where("studentId", "==", student1Uid).get());
  await assertSucceeds(
    student1Db.collection("doubtChats").doc(chatId).collection("messages").where("studentId", "==", student1Uid).get()
  );

  // Student 2 CANNOT read Student 1's chat room or messages
  await assertFails(student2Db.collection("doubtChats").doc(chatId).get());
  await assertFails(
    student2Db.collection("doubtChats").doc(chatId).collection("messages").doc("msg_1").get()
  );
  await assertFails(student2Db.collection("doubtChats").where("studentId", "==", student1Uid).get());

  // Unassigned Professor 2 (Dr. Sudip) CANNOT read Dr. Anulina's private chat
  await assertFails(prof2Db.collection("doubtChats").doc(chatId).get());
  await assertFails(
    prof2Db.collection("doubtChats").doc(chatId).collection("messages").doc("msg_1").get()
  );

  // CRITICAL: Founder / Admin CANNOT read private student-professor conversations or messages!
  await assertFails(ownerDb.collection("doubtChats").doc(chatId).get());
  await assertFails(ownerDb.collection("doubtChats").get());
  await assertFails(
    ownerDb.collection("doubtChats").doc(chatId).collection("messages").doc("msg_1").get()
  );

  // Assigned Professor 1 (Dr. Anulina Manna) CAN list assigned chats, read messages, mark read, and reply
  await assertSucceeds(
    prof1Db.collection("doubtChats").where("professorEmail", "==", "anuman.lin@gmail.com").get()
  );
  await assertSucceeds(
    prof1Db.collection("doubtChats").doc(chatId).collection("messages").where("professorEmail", "==", "anuman.lin@gmail.com").get()
  );
  await assertSucceeds(
    prof1Db.collection("doubtChats").doc(chatId).collection("messages").doc("msg_1").update({
      readByRecipient: true,
    })
  );
  await assertSucceeds(
    prof1Db.collection("doubtChats").doc(chatId).collection("messages").doc("msg_2").set({
      studentId: student1Uid,
      professorId: "prof_anulina_manna",
      professorEmail: "anuman.lin@gmail.com",
      professorUid: prof1Uid,
      senderId: prof1Uid,
      senderName: "Dr. Anulina Manna",
      senderRole: "PROFESSOR",
      text: "Add 100 mg/L ascorbic acid or activated charcoal to the MS medium.",
      hasImage: false,
      readByRecipient: false,
      createdAt: pastTime(2000),
    })
  );

  // Student 1 CANNOT edit or delete Professor 1's reply message
  await assertFails(
    student1Db.collection("doubtChats").doc(chatId).collection("messages").doc("msg_2").update({
      text: "Altered professor reply",
    })
  );
  await assertFails(
    student1Db.collection("doubtChats").doc(chatId).collection("messages").doc("msg_2").delete()
  );
  // Student 1 CAN mark Professor 1's reply as read
  await assertSucceeds(
    student1Db.collection("doubtChats").doc(chatId).collection("messages").doc("msg_2").update({
      readByRecipient: true,
    })
  );

  // Linked Professor without pre-seeded email (Dr. Monirul Haque) can access his own student chats & host meetings
  const monirulChatId = `prof_monirul_haque__${student1Uid}`;
  await assertSucceeds(
    student1Db.collection("doubtChats").doc(monirulChatId).set({
      studentId: student1Uid,
      studentName: "Alice Sen",
      studentSemester: 3,
      professorId: "prof_monirul_haque",
      professorName: "Dr. Monirul Haque",
      professorEmail: "",
      professorUid: profMonirulUid,
      lastMessagePreview: "Sir, can you share KVK extension survey methodology?",
      lastSenderRole: "STUDENT",
      unreadForStudent: 0,
      unreadForProfessor: 1,
      studentLastReadAt: ts,
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertSucceeds(
    profMonirulDb.collection("doubtChats").where("professorId", "==", "prof_monirul_haque").get()
  );
  await assertSucceeds(
    profMonirulDb.collection("meetings").doc("meet_monirul").set({
      title: "Rural Extension Field Survey Briefing",
      subject: "Agricultural Extension",
      description: "PRA techniques and farmer interview checklist.",
      meetUrl: "https://meet.google.com/xyz-mnop-qrs",
      scheduledDate: "2026-12-03",
      scheduledTime: "11:00 AM",
      scheduledAtEpochMs: Date.now() + 172800000,
      hostName: "Dr. Monirul Haque",
      hostUid: profMonirulUid,
      notifyStudents: true,
      published: true,
      createdAt: ts,
      updatedAt: ts,
    })
  );
});

test("AI Guru Free-Tier Settings & Verified Knowledge Base Rules", async () => {
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, {
    email: ADMIN_EMAIL,
    email_verified: true,
  }).firestore();
  const studentDb = testEnv.authenticatedContext(STUDENT_UID).firestore();
  const ts = pastTime(2000);

  // Admin can publish StudyMaterial with rich AI Knowledge Base contentText & verifiedForAi flag
  await assertSucceeds(
    adminDb.collection("studyMaterials").doc("kb_soil_science").set({
      title: "Soil Science Unit 2 — Cation Exchange Capacity & Buffering",
      semester: 1,
      subject: "Soil Science",
      category: "NOTES_PDF",
      summary: "Verified Guru Ji Vision lecture notes on clay minerals, humus CEC, and soil pH buffering.",
      contentText: "Cation Exchange Capacity (CEC) measures the total capacity of a soil to hold exchangeable cations (Ca2+, Mg2+, K+, Na+, H+, Al3+) in cmol(+)/kg. Montmorillonite has high CEC (80–150) while Kaolinite has low CEC (3–15).",
      verifiedForAi: true,
      resourceUrl: "https://icar.org.in",
      published: true,
      createdBy: ADMIN_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Student CANNOT publish or tamper with Knowledge Base materials
  await assertFails(
    studentDb.collection("studyMaterials").doc("kb_fake").set({
      title: "Injected Material",
      semester: 1,
      subject: "Botany",
      category: "NOTES_PDF",
      summary: "Unauthorized material injection attempt",
      contentText: "Injected prompt override",
      verifiedForAi: true,
      resourceUrl: "",
      published: true,
      createdBy: STUDENT_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Admin can save valid FREE-TIER AI Guru settings in appSettings/global
  await assertSucceeds(
    adminDb.collection("appSettings").doc("global").set({
      whatsappNumber: "+919000000000",
      supportEmail: "mondalsayan9932@gmail.com",
      aboutText: "Guru Ji Vision Agriculture & Education Ecosystem.",
      heroHeadline: "Empowering Indian Agriculture & B.Sc Agri Scholars",
      aiAssistantEnabled: true,
      aiModelName: "gemini-3.8-flash",
      aiFreeSearchEnabled: true,
      aiDailyLimitPerUser: 25,
      aiPaidServicesApproved: false,
      updatedAt: ts,
    })
  );

  // Paid / billing-required Gemini model (e.g. gemini-4-argon) MUST be rejected by Firestore rules!
  await assertFails(
    adminDb.collection("appSettings").doc("global").set({
      whatsappNumber: "+919000000000",
      supportEmail: "mondalsayan9932@gmail.com",
      aboutText: "Guru Ji Vision Agriculture & Education Ecosystem.",
      heroHeadline: "Empowering Indian Agriculture & B.Sc Agri Scholars",
      aiAssistantEnabled: true,
      aiModelName: "gemini-4-argon",
      aiFreeSearchEnabled: true,
      aiDailyLimitPerUser: 25,
      aiPaidServicesApproved: false,
      updatedAt: ts,
    })
  );

  // Out-of-bounds daily usage limit (e.g. 9999) MUST be rejected
  await assertFails(
    adminDb.collection("appSettings").doc("global").set({
      whatsappNumber: "+919000000000",
      supportEmail: "mondalsayan9932@gmail.com",
      aboutText: "Guru Ji Vision Agriculture & Education Ecosystem.",
      heroHeadline: "Empowering Indian Agriculture & B.Sc Agri Scholars",
      aiAssistantEnabled: true,
      aiModelName: "gemini-3.5-flash-lite",
      aiFreeSearchEnabled: true,
      aiDailyLimitPerUser: 9999,
      aiPaidServicesApproved: false,
      updatedAt: ts,
    })
  );

  // Student CANNOT modify AI Guru settings
  await assertFails(
    studentDb.collection("appSettings").doc("global").update({
      aiDailyLimitPerUser: 200,
      updatedAt: pastTime(500),
    })
  );
});

test("Farmer Personal Farm Management & Opening Balance: Owner-only CRUD without Admin approval; Admin & other users blocked", async () => {
  const farmerDb = testEnv.authenticatedContext(FARMER_UID, { email: "rahul@farm.in", email_verified: true }).firestore();
  const studentDb = testEnv.authenticatedContext(STUDENT_UID, { email: "alice@agri.edu.in", email_verified: true }).firestore();
  const superAdminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
  const ts = pastTime(5000);

  const txRef = farmerDb.collection("users").doc(FARMER_UID).collection("transactions").doc("farm_tx_1");
  await assertSucceeds(
    txRef.set({
      title: "Aman Paddy Seeds & DAP",
      amount: 3450,
      type: "EXPENSE",
      category: "SEEDS_FERTILIZER",
      ledgerScope: "FARMER",
      cropTag: "Aman Paddy",
      note: "2 bigha basal application",
      dateLabel: "2026-11-20",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  await assertSucceeds(txRef.update({ amount: 3600, updatedAt: pastTime(1000) }));

  await assertSucceeds(
    farmerDb.collection("users").doc(FARMER_UID).collection("budgets").doc("opening_balance").set({
      name: "Opening Balance",
      kind: "OPENING_BALANCE",
      targetAmount: 15000,
      savedAmount: 15000,
      monthKey: "GLOBAL",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // STRICT PRIVACY: Student AND even Super Admin CANNOT read or edit Farmer's private financial records
  await assertFails(studentDb.collection("users").doc(FARMER_UID).collection("transactions").doc("farm_tx_1").get());
  await assertFails(superAdminDb.collection("users").doc(FARMER_UID).collection("transactions").doc("farm_tx_1").get());
  await assertFails(superAdminDb.collection("users").doc(FARMER_UID).collection("budgets").doc("opening_balance").get());

  await assertSucceeds(txRef.delete());
});

test("Verified Crop Market Prices (marketPrices): Publicly readable when published, Admin-only writes", async () => {
  const publicDb = testEnv.unauthenticatedContext().firestore();
  const studentDb = testEnv.authenticatedContext(STUDENT_UID, { email: "alice@agri.edu.in", email_verified: true }).firestore();
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
  const ts = pastTime(3000);

  await assertSucceeds(
    adminDb.collection("marketPrices").doc("mp_paddy_memari").set({
      cropName: "Paddy (Common)",
      cropNameBn: "ধান (সাধারণ)",
      state: "West Bengal",
      district: "Purba Bardhaman",
      marketName: "Memari Mandi",
      unit: "₹ / Quintal",
      minPrice: 2150,
      maxPrice: 2380,
      modalPrice: 2290,
      reportDate: "2026-11-22",
      sourceName: "AGMARKNET / WB Agri Marketing Board",
      sourceUrl: "https://agmarknet.gov.in/",
      published: true,
      createdBy: ADMIN_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  await assertSucceeds(publicDb.collection("marketPrices").doc("mp_paddy_memari").get());
  await assertFails(
    studentDb.collection("marketPrices").doc("mp_paddy_memari").update({
      modalPrice: 9999,
      updatedAt: pastTime(500),
    })
  );
});

test("Farmer Advisor Expert thread (__farmer) & emailDeliveryStatus tracking work cleanly and stay isolated from Admin", async () => {
  const farmerDb = testEnv.authenticatedContext(FARMER_UID, { email: "rahul@farm.in", email_verified: true }).firestore();
  const profDb = testEnv.authenticatedContext("prof_patar_uid", { email: "subhaspatar@gmail.com", email_verified: true }).firestore();
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
  const ts = pastTime(4000);
  const chatId = `prof_subhas_patar__${FARMER_UID}__farmer`;

  await assertSucceeds(
    farmerDb.collection("doubtChats").doc(chatId).set({
      studentId: FARMER_UID,
      studentName: "Rahul Das",
      studentSemester: 0,
      professorId: "prof_subhas_patar",
      professorName: "Dr. Subhas Patar",
      professorEmail: "subhaspatar@gmail.com",
      professorUid: "",
      serviceType: "FARMER_ADVISOR",
      questionTitle: "Rice Leaf Blast Spots",
      questionCategory: "CROP_DISEASE",
      emailDeliveryStatus: "PENDING",
      lastMessagePreview: "Spindle shaped spots on paddy leaves",
      lastSenderRole: "STUDENT",
      unreadForStudent: 0,
      unreadForProfessor: 1,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  const msgRef = farmerDb.collection("doubtChats").doc(chatId).collection("messages").doc("msg_1");
  await assertSucceeds(
    msgRef.set({
      studentId: FARMER_UID,
      professorId: "prof_subhas_patar",
      professorEmail: "subhaspatar@gmail.com",
      professorUid: "",
      senderId: FARMER_UID,
      senderName: "Rahul Das",
      senderRole: "STUDENT",
      questionTitle: "Rice Leaf Blast Spots",
      questionCategory: "CROP_DISEASE",
      emailDeliveryStatus: "PENDING",
      text: "Spindle shaped spots on paddy leaves",
      hasImage: false,
      readByRecipient: false,
      createdAt: ts,
    })
  );

  await assertSucceeds(msgRef.update({ emailDeliveryStatus: "SENT" }));
  await assertFails(msgRef.update({ text: "Tampered text" }));
  await assertSucceeds(profDb.collection("doubtChats").doc(chatId).get());
  await assertSucceeds(profDb.collection("doubtChats").doc(chatId).collection("messages").doc("msg_1").get());
  await assertFails(adminDb.collection("doubtChats").doc(chatId).get());
});

test("Professor Role Security: self-granting PROFESSOR or APPROVED is blocked; PENDING request + Founder approval succeed", async () => {
  const applicantUid = "prof_applicant_777";
  const applicantDb = testEnv.authenticatedContext(applicantUid, {
    email: "newprof@agri.edu.in",
    email_verified: true,
  }).firestore();
  const ownerDb = testEnv.authenticatedContext(ADMIN_UID, {
    email: ADMIN_EMAIL,
    email_verified: true,
  }).firestore();
  const ts = pastTime(5000);

  // Applicant CANNOT directly create a profile with role=PROFESSOR
  await assertFails(
    applicantDb.collection("users").doc(applicantUid).set({
      userId: applicantUid,
      displayName: "Dr. New Applicant",
      email: "newprof@agri.edu.in",
      role: "PROFESSOR",
      institutionOrVillage: "BCKV",
      district: "Nadia",
      semester: 0,
      language: "EN",
      requestedRole: "PROFESSOR",
      professorApprovalStatus: "PENDING",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Applicant CANNOT self-approve professorApprovalStatus=APPROVED
  await assertFails(
    applicantDb.collection("users").doc(applicantUid).set({
      userId: applicantUid,
      displayName: "Dr. New Applicant",
      email: "newprof@agri.edu.in",
      role: "STUDENT",
      institutionOrVillage: "BCKV",
      district: "Nadia",
      semester: 0,
      language: "EN",
      requestedRole: "PROFESSOR",
      professorApprovalStatus: "APPROVED",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Applicant CAN submit a safe PENDING professor verification request (base role stays STUDENT)
  await assertSucceeds(
    applicantDb.collection("users").doc(applicantUid).set({
      userId: applicantUid,
      displayName: "Dr. New Applicant",
      email: "newprof@agri.edu.in",
      phoneNumber: "+919876543210",
      role: "STUDENT",
      requestedRole: "PROFESSOR",
      professorApprovalStatus: "PENDING",
      institutionOrVillage: "BCKV Mohanpur",
      department: "Agronomy",
      subjectSpecialization: "Weed Science & Cropping Systems",
      district: "Nadia",
      state: "West Bengal",
      semester: 0,
      language: "EN",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Applicant CANNOT escalate themselves on update either
  await assertFails(
    applicantDb.collection("users").doc(applicantUid).update({
      role: "PROFESSOR",
      professorApprovalStatus: "APPROVED",
      updatedAt: pastTime(1000),
    })
  );

  // Founder (Super Admin) CAN approve the professor request
  await assertSucceeds(
    ownerDb.collection("users").doc(applicantUid).update({
      role: "PROFESSOR",
      professorApprovalStatus: "APPROVED",
      updatedAt: pastTime(500),
    })
  );
});

test("Farmer Financial Support & Rights: owner CRUD succeeds across all 8 collections; other farmers, guests & unauthorized admins are strictly blocked", async () => {
  const farmerADb = testEnv.authenticatedContext(FARMER_UID, {
    email: "rahul@farm.in",
    email_verified: true,
  }).firestore();
  const farmerBDb = testEnv.authenticatedContext(STUDENT_UID, {
    email: "otherfarmer@farm.in",
    email_verified: true,
  }).firestore();
  const guestDb = testEnv.unauthenticatedContext().firestore();
  const superAdminDb = testEnv.authenticatedContext(ADMIN_UID, {
    email: ADMIN_EMAIL,
    email_verified: true,
  }).firestore();

  const ts = pastTime(5000);

  // 1. Land Lease (Fixed Rent)
  await assertSucceeds(
    farmerADb.collection("farmer_land_leases").doc("lease_1").set({
      farmerUid: FARMER_UID,
      landownerName: "Subhash Mondal",
      landownerContact: "9830011223",
      village: "Memari",
      block: "Memari-I",
      district: "Purba Bardhaman",
      state: "West Bengal",
      landArea: 2.5,
      areaUnit: "BIGHA_WB",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      leaseType: "FIXED_RENT",
      totalLeaseAmount: 24000,
      advancePayment: 6000,
      paymentFrequency: "SEASONAL",
      farmerSharePercent: 100,
      landownerSharePercent: 0,
      cropShareNote: "",
      isVerbalAgreement: false,
      verbalNotes: "Two witnesses present",
      legalVerificationStatus: "UNVERIFIED_USER_RECORD",
      paymentHistory: [],
      status: "ACTIVE",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // 2. Loan Record + Debt Comparison
  await assertSucceeds(
    farmerADb.collection("farmer_loan_records").doc("loan_1").set({
      farmerUid: FARMER_UID,
      lenderName: "WB State Cooperative Bank",
      lenderType: "COOPERATIVE",
      principalAmount: 50000,
      loanDate: "2026-01-15",
      purpose: "Boro paddy cultivation",
      interestRatePercent: 7,
      interestMethod: "SIMPLE",
      compoundingFrequencyPerYear: 1,
      repaymentPeriodMonths: 12,
      installmentFrequency: "SEASONAL",
      scheduleType: "PARTIAL_FLEXIBLE",
      nextDueDate: "2026-07-15",
      notes: "KCC crop loan",
      status: "ACTIVE",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Owner updates debt comparison
  await assertSucceeds(
    farmerADb.collection("farmer_loan_records").doc("loan_1").update({
      farmerCalculatedBalance: 42000,
      lenderClaimedAmount: 45500,
      discrepancyNotes: "Receipt #14 not yet posted in statement",
      updatedAt: pastTime(1000),
    })
  );

  // 3. Immutable Loan Repayment Transaction
  await assertSucceeds(
    farmerADb.collection("farmer_loan_transactions").doc("tx_1").set({
      farmerUid: FARMER_UID,
      loanId: "loan_1",
      lenderName: "WB State Cooperative Bank",
      amount: 10000,
      principalPortion: 8000,
      interestPortion: 2000,
      paymentDate: "2026-04-01",
      paymentType: "PARTIAL",
      paymentMode: "BANK_UPI",
      receiptRef: "RCPT-14",
      note: "Partial installment paid",
      status: "RECORDED",
      createdAt: ts,
    })
  );

  // 4. Crop Sale Record
  await assertSucceeds(
    farmerADb.collection("farmer_crop_sales").doc("sale_1").set({
      farmerUid: FARMER_UID,
      cropName: "Paddy",
      cropVariety: "Swarna",
      season: "KHARIF",
      landLabel: "Subhash Mondal (Memari)",
      harvestDate: "2026-11-01",
      sellingDate: "2026-11-10",
      quantityHarvested: 25,
      quantitySold: 20,
      priceUnit: "QUINTAL",
      sellingPricePerUnit: 2250,
      buyerName: "Memari Kisan Mandi",
      marketLocation: "Memari",
      transportCost: 800,
      marketCommission: 400,
      otherExpenses: 200,
      totalAmountReceived: 43600,
      paymentStatus: "PAID",
      notes: "Weighed digitally",
      status: "ACTIVE",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // 5. Farming Expense
  await assertSucceeds(
    farmerADb.collection("farmer_expenses").doc("exp_1").set({
      farmerUid: FARMER_UID,
      category: "FERTILIZERS",
      customCategory: "",
      amount: 3400,
      expenseDate: "2026-07-20",
      description: "2 bags DAP + 1 bag Urea",
      cropName: "Paddy",
      season: "KHARIF",
      landLabel: "Subhash Mondal (Memari)",
      receiptDocumentId: "",
      status: "ACTIVE",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // 6. Private Document
  await assertSucceeds(
    farmerADb.collection("farmer_documents").doc("doc_1").set({
      farmerUid: FARMER_UID,
      title: "Lease Agreement Photo",
      docType: "LEASE_AGREEMENT",
      fileName: "lease.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: 54000,
      relatedEntityType: "LAND_LEASE",
      relatedEntityId: "lease_1",
      docDate: "2026-01-01",
      notes: "Signed copy",
      storageMode: "FIRESTORE_INLINE_PRIVATE",
      storagePath: "",
      downloadUrl: "",
      inlineDataUrl: "data:image/jpeg;base64,AAAA",
      legalVerificationStatus: "UNVERIFIED_USER_UPLOAD",
      status: "ACTIVE",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // 7. Complaint Record
  await assertSucceeds(
    farmerADb.collection("farmer_complaints").doc("cmp_1").set({
      farmerUid: FARMER_UID,
      category: "CROP_PAYMENT_DELAY",
      description: "Buyer delayed balance payment of Rs 5000 by 30 days after delivery.",
      incidentDate: "2026-11-12",
      contactPreference: "WHATSAPP",
      contactValue: "+919830011223",
      supportingDocumentIds: ["doc_1"],
      status: "SUBMITTED",
      supportNote: "",
      reviewDisclaimer: "Stored in your private record; not yet reviewed by an official support team or legal authority.",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // 8. Immutable Audit Log
  await assertSucceeds(
    farmerADb.collection("farmer_finance_audit_logs").doc("log_1").set({
      farmerUid: FARMER_UID,
      entityType: "LOAN_REPAYMENT",
      entityId: "tx_1",
      action: "REPAYMENT_RECORDED",
      summary: "Recorded partial loan repayment of Rs 10000.",
      createdAt: ts,
    })
  );

  // --- SECURITY ISOLATION CHECKS ---
  // Owner can read own records
  await assertSucceeds(farmerADb.collection("farmer_land_leases").doc("lease_1").get());
  await assertSucceeds(farmerADb.collection("farmer_loan_records").doc("loan_1").get());
  await assertSucceeds(farmerADb.collection("farmer_documents").doc("doc_1").get());

  // Other Farmer B & Guests are strictly DENIED reading or listing Farmer A's private records
  for (const [col, id] of [
    ["farmer_land_leases", "lease_1"],
    ["farmer_loan_records", "loan_1"],
    ["farmer_loan_transactions", "tx_1"],
    ["farmer_crop_sales", "sale_1"],
    ["farmer_expenses", "exp_1"],
    ["farmer_documents", "doc_1"],
    ["farmer_complaints", "cmp_1"],
    ["farmer_finance_audit_logs", "log_1"],
  ]) {
    await assertFails(farmerBDb.collection(col).doc(id).get());
    await assertFails(guestDb.collection(col).doc(id).get());
  }

  // Super Admin CANNOT read private farmer leases, loans, sales, expenses, or private vault documents
  await assertFails(superAdminDb.collection("farmer_land_leases").doc("lease_1").get());
  await assertFails(superAdminDb.collection("farmer_loan_records").doc("loan_1").get());
  await assertFails(superAdminDb.collection("farmer_documents").doc("doc_1").get());

  // Farmer CANNOT tamper with ownership (farmerUid), hard-delete records, or alter immutable loan tx / audit logs
  await assertFails(
    farmerADb.collection("farmer_land_leases").doc("lease_1").update({
      farmerUid: STUDENT_UID,
      updatedAt: pastTime(500),
    })
  );
  await assertFails(farmerADb.collection("farmer_land_leases").doc("lease_1").delete());
  await assertFails(
    farmerADb.collection("farmer_loan_transactions").doc("tx_1").update({ amount: 99999 })
  );
  await assertFails(farmerADb.collection("farmer_loan_transactions").doc("tx_1").delete());
  await assertFails(
    farmerADb.collection("farmer_finance_audit_logs").doc("log_1").update({ action: "TAMPERED" })
  );

  // Farmer CANNOT self-approve complaint status; Verified Admin CAN update complaint status & supportNote
  await assertFails(
    farmerADb.collection("farmer_complaints").doc("cmp_1").update({
      status: "RESOLVED",
      updatedAt: pastTime(500),
    })
  );
  await assertSucceeds(
    superAdminDb.collection("farmer_complaints").doc("cmp_1").update({
      status: "UNDER_REVIEW",
      supportNote: "Shared official Block ADA & NALSA contact guidance.",
      updatedAt: pastTime(400),
    })
  );
});

test("Farmer Bank vs Private Interest Comparisons: strictly owner-only create/read, immutable, blocked for other farmers, guests & Super Admin", async () => {
  const farmerADb = testEnv.authenticatedContext(FARMER_UID, { email: "rahul@farm.in", email_verified: true }).firestore();
  const farmerBDb = testEnv.authenticatedContext("farmer_b_888", { email: "b@farm.in", email_verified: true }).firestore();
  const guestDb = testEnv.unauthenticatedContext().firestore();
  const superAdminDb = testEnv.authenticatedContext(ADMIN_UID, { email: ADMIN_EMAIL, email_verified: true }).firestore();
  const ts = pastTime(3000);

  const validComp = {
    farmerUid: FARMER_UID,
    bankProductId: "sbi_kcc_crop",
    bankName: "State Bank of India (SBI)",
    bankLoanType: "Kisan Credit Card (KCC) — Short-Term Crop Loan",
    applySubvention: true,
    privateLenderName: "Local Mahajan",
    principalAmount: 50000,
    durationMonths: 12,
    privateInterestRate: 3,
    privateRatePeriod: "MONTHLY",
    privateInterestMethod: "SIMPLE",
    privateCompoundingPerYear: 12,
    repaymentSchedule: "LUMP_SUM",
    additionalFees: 500,
    amountAlreadyRepaid: 5000,
    bankTotalInterest: 2020,
    bankTotalRepayment: 52020,
    bankEffectiveAnnualCostPercent: 4.04,
    privateTotalBorrowingCost: 18500,
    privateTotalRepayment: 68500,
    privateEffectiveAnnualCostPercent: 37.0,
    interestCostDifference: 16480,
    bankRateVerifiedDate: "2026-03-15",
    notes: "Kharif season loan comparison",
    createdAt: ts,
  };

  // Owner can save and read own private comparison
  await assertSucceeds(farmerADb.collection("farmer_interest_comparisons").doc("comp_1").set(validComp));
  await assertSucceeds(farmerADb.collection("farmer_interest_comparisons").doc("comp_1").get());
  await assertSucceeds(farmerADb.collection("farmer_interest_comparisons").where("farmerUid", "==", FARMER_UID).get());

  // Cross-farmer spoofing create blocked
  await assertFails(
    farmerBDb.collection("farmer_interest_comparisons").doc("comp_spoof").set({
      ...validComp,
      farmerUid: FARMER_UID,
    })
  );

  // Other Farmer B, Guests, and even Super Admin are strictly DENIED reading or listing
  await assertFails(farmerBDb.collection("farmer_interest_comparisons").doc("comp_1").get());
  await assertFails(farmerBDb.collection("farmer_interest_comparisons").where("farmerUid", "==", FARMER_UID).get());
  await assertFails(guestDb.collection("farmer_interest_comparisons").doc("comp_1").get());
  await assertFails(superAdminDb.collection("farmer_interest_comparisons").doc("comp_1").get());
  await assertFails(superAdminDb.collection("farmer_interest_comparisons").get());

  // Saved comparison records are immutable (no update/delete)
  await assertFails(farmerADb.collection("farmer_interest_comparisons").doc("comp_1").update({ privateInterestRate: 1 }));
  await assertFails(farmerADb.collection("farmer_interest_comparisons").doc("comp_1").delete());
});

test("Strictly Isolated Student & Farmer Financial Profiles: Role-gated collections, category enforcement, dual-role isolation & cross-profile blocking", async () => {
  const DUAL_UID = "dual_role_user_707";
  const studentDb = testEnv.authenticatedContext(STUDENT_UID, {
    email: "alice@agri.edu.in",
    email_verified: true,
  }).firestore();
  const farmerDb = testEnv.authenticatedContext(FARMER_UID, {
    email: "rahul@farm.in",
    email_verified: true,
  }).firestore();
  const dualDb = testEnv.authenticatedContext(DUAL_UID, {
    email: "dual@agri.in",
    email_verified: true,
  }).firestore();
  const superAdminDb = testEnv.authenticatedContext(ADMIN_UID, {
    email: ADMIN_EMAIL,
    email_verified: true,
  }).firestore();
  const guestDb = testEnv.unauthenticatedContext().firestore();
  const ts = pastTime(5000);

  // 1. Seed user profile documents for Student-only, Farmer-only, and Dual-role accounts
  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).set({
      userId: STUDENT_UID,
      displayName: "Alice Sen",
      email: "alice@agri.edu.in",
      role: "STUDENT",
      institutionOrVillage: "BCKV Nadia",
      district: "Nadia",
      semester: 4,
      language: "EN",
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertSucceeds(
    farmerDb.collection("users").doc(FARMER_UID).set({
      userId: FARMER_UID,
      displayName: "Rahul Das",
      email: "rahul@farm.in",
      role: "FARMER",
      institutionOrVillage: "Memari",
      district: "Purba Bardhaman",
      semester: 0,
      language: "BN",
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertSucceeds(
    dualDb.collection("users").doc(DUAL_UID).set({
      userId: DUAL_UID,
      displayName: "Suman Roy",
      email: "dual@agri.in",
      role: "STUDENT",
      financialProfiles: ["student", "farmer"],
      institutionOrVillage: "UBKV Cooch Behar",
      district: "Cooch Behar",
      semester: 6,
      language: "BN",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // 2. Student-only account CAN create/read/update/delete Student financial records
  const studentTxRef = studentDb.collection("users").doc(STUDENT_UID).collection("studentFinancialTransactions").doc("stx_1");
  await assertSucceeds(
    studentTxRef.set({
      userId: STUDENT_UID,
      profileType: "student",
      ledgerScope: "STUDENT",
      title: "Agronomy Textbook & Lab Manual",
      amount: 850,
      type: "EXPENSE",
      category: "BOOKS_STATIONERY",
      note: "Semester 4 reference books",
      dateLabel: "2026-11-24",
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).collection("studentFinancialTransactions")
      .where("userId", "==", STUDENT_UID)
      .where("profileType", "==", "student")
      .get()
  );
  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).collection("studentFinancialBudgets").doc("opening_balance").set({
      userId: STUDENT_UID,
      profileType: "student",
      ledgerScope: "STUDENT",
      name: "Opening Balance",
      kind: "OPENING_BALANCE",
      targetAmount: 6000,
      savedAmount: 6000,
      monthKey: "GLOBAL",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Student CANNOT write Farmer categories into Student collection
  await assertFails(
    studentDb.collection("users").doc(STUDENT_UID).collection("studentFinancialTransactions").doc("stx_bad_cat").set({
      userId: STUDENT_UID,
      profileType: "student",
      ledgerScope: "STUDENT",
      title: "Paddy Seeds",
      amount: 1200,
      type: "EXPENSE",
      category: "SEEDS",
      note: "Wrong profile category",
      dateLabel: "2026-11-24",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Student CANNOT mutate profileType or userId on update
  await assertFails(
    studentTxRef.update({
      profileType: "farmer",
      ledgerScope: "FARMER",
      updatedAt: pastTime(500),
    })
  );

  // CRITICAL ISOLATION: Student-only account CANNOT read or write Farmer financial collections!
  await assertFails(
    studentDb.collection("users").doc(STUDENT_UID).collection("farmerFinancialTransactions").get()
  );
  await assertFails(
    studentDb.collection("users").doc(STUDENT_UID).collection("farmerFinancialBudgets").get()
  );
  await assertFails(
    studentDb.collection("users").doc(STUDENT_UID).collection("farmerFinancialTransactions").doc("ftx_unauth").set({
      userId: STUDENT_UID,
      profileType: "farmer",
      ledgerScope: "FARMER",
      title: "Unauthorized Farm Entry",
      amount: 500,
      type: "EXPENSE",
      category: "SEEDS",
      note: "",
      dateLabel: "2026-11-24",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // 3. Farmer-only account CAN create/read/update/delete Farmer financial records
  const farmerTxRef = farmerDb.collection("users").doc(FARMER_UID).collection("farmerFinancialTransactions").doc("ftx_1");
  await assertSucceeds(
    farmerTxRef.set({
      userId: FARMER_UID,
      profileType: "farmer",
      ledgerScope: "FARMER",
      title: "Boro Paddy Certified Seeds & Urea",
      amount: 4200,
      type: "EXPENSE",
      category: "SEEDS",
      cropTag: "Boro Paddy",
      note: "2.5 bigha plot",
      dateLabel: "2026-11-24",
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertSucceeds(
    farmerDb.collection("users").doc(FARMER_UID).collection("farmerFinancialTransactions").doc("ftx_sale").set({
      userId: FARMER_UID,
      profileType: "farmer",
      ledgerScope: "FARMER",
      title: "Memari Mandi Paddy Sale",
      amount: 28500,
      type: "INCOME",
      category: "CROP_SALES",
      cropTag: "Aman Paddy",
      note: "Sold 12 quintals",
      dateLabel: "2026-11-25",
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertSucceeds(
    farmerDb.collection("users").doc(FARMER_UID).collection("farmerFinancialBudgets").doc("opening_balance").set({
      userId: FARMER_UID,
      profileType: "farmer",
      ledgerScope: "FARMER",
      name: "Opening Balance",
      kind: "OPENING_BALANCE",
      targetAmount: 18000,
      savedAmount: 18000,
      monthKey: "GLOBAL",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Farmer CANNOT write Student categories into Farmer collection
  await assertFails(
    farmerDb.collection("users").doc(FARMER_UID).collection("farmerFinancialTransactions").doc("ftx_bad_cat").set({
      userId: FARMER_UID,
      profileType: "farmer",
      ledgerScope: "FARMER",
      title: "Hostel Rent",
      amount: 3000,
      type: "EXPENSE",
      category: "HOSTEL_RENT",
      note: "Wrong profile category",
      dateLabel: "2026-11-24",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // CRITICAL ISOLATION: Farmer-only account CANNOT read or write Student financial collections!
  await assertFails(
    farmerDb.collection("users").doc(FARMER_UID).collection("studentFinancialTransactions").get()
  );
  await assertFails(
    farmerDb.collection("users").doc(FARMER_UID).collection("studentFinancialBudgets").get()
  );
  await assertFails(
    farmerDb.collection("users").doc(FARMER_UID).collection("studentFinancialTransactions").doc("stx_unauth").set({
      userId: FARMER_UID,
      profileType: "student",
      ledgerScope: "STUDENT",
      title: "Unauthorized Student Entry",
      amount: 400,
      type: "EXPENSE",
      category: "EDUCATION",
      note: "",
      dateLabel: "2026-11-24",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // 4. Dual-role user maintains TWO strictly isolated financial profiles
  await assertSucceeds(
    dualDb.collection("users").doc(DUAL_UID).collection("studentFinancialTransactions").doc("dual_stx_1").set({
      userId: DUAL_UID,
      profileType: "student",
      ledgerScope: "STUDENT",
      title: "Hostel Mess Fee",
      amount: 2600,
      type: "EXPENSE",
      category: "HOSTEL_RENT",
      note: "November hostel bill",
      dateLabel: "2026-11-20",
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertSucceeds(
    dualDb.collection("users").doc(DUAL_UID).collection("farmerFinancialTransactions").doc("dual_ftx_1").set({
      userId: DUAL_UID,
      profileType: "farmer",
      ledgerScope: "FARMER",
      title: "Potato Land Lease",
      amount: 12000,
      type: "EXPENSE",
      category: "LAND_LEASE",
      cropTag: "Potato",
      note: "Rabi lease advance",
      dateLabel: "2026-11-21",
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertSucceeds(
    dualDb.collection("users").doc(DUAL_UID).collection("studentFinancialBudgets").doc("opening_balance").set({
      userId: DUAL_UID,
      profileType: "student",
      ledgerScope: "STUDENT",
      name: "Opening Balance",
      kind: "OPENING_BALANCE",
      targetAmount: 4500,
      savedAmount: 4500,
      monthKey: "GLOBAL",
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertSucceeds(
    dualDb.collection("users").doc(DUAL_UID).collection("farmerFinancialBudgets").doc("opening_balance").set({
      userId: DUAL_UID,
      profileType: "farmer",
      ledgerScope: "FARMER",
      name: "Opening Balance",
      kind: "OPENING_BALANCE",
      targetAmount: 35000,
      savedAmount: 35000,
      monthKey: "GLOBAL",
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // 5. Cross-user, Guest, and Super Admin access strictly DENIED on all isolated financial collections
  await assertFails(farmerDb.collection("users").doc(STUDENT_UID).collection("studentFinancialTransactions").get());
  await assertFails(studentDb.collection("users").doc(FARMER_UID).collection("farmerFinancialTransactions").get());
  await assertFails(superAdminDb.collection("users").doc(STUDENT_UID).collection("studentFinancialTransactions").get());
  await assertFails(superAdminDb.collection("users").doc(FARMER_UID).collection("farmerFinancialTransactions").get());
  await assertFails(guestDb.collection("users").doc(STUDENT_UID).collection("studentFinancialTransactions").get());
  await assertFails(guestDb.collection("users").doc(FARMER_UID).collection("farmerFinancialBudgets").get());

  // Valid owner update & delete succeed
  await assertSucceeds(studentTxRef.update({ amount: 900, updatedAt: pastTime(600) }));
  await assertSucceeds(farmerTxRef.update({ amount: 4350, updatedAt: pastTime(600) }));
  await assertSucceeds(studentTxRef.delete());
  await assertSucceeds(farmerTxRef.delete());
});

test("Phase 3 Student Zone Education CMS: Admin CRUD & publish/unpublish across Notes, Videos, Official PYQs, Mock Tests, Syllabi, 7-Category Resources; non-admin writes & draft reads denied", async () => {
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, {
    email: ADMIN_EMAIL,
    email_verified: true,
  }).firestore();
  const studentDb = testEnv.authenticatedContext(STUDENT_UID, {
    email: "alice@agri.edu.in",
    email_verified: true,
  }).firestore();
  const guestDb = testEnv.unauthenticatedContext().firestore();
  const ts = pastTime(3000);

  // 1. Admin creates YouTube Video Lecture (published) & Draft Video Lecture
  await assertSucceeds(
    adminDb.collection("studyMaterials").doc("video_agronomy_1").set({
      title: "Conservation Agriculture & Zero Tillage",
      titleBn: "সংরক্ষণ কৃষি ও জিরো টিলেজ",
      semester: 2,
      subject: "Agronomy",
      subjectKey: "AGRONOMY",
      topic: "Tillage",
      category: "VIDEO_LECTURE",
      language: "BILINGUAL",
      summary: "Verified ICAR lecture explaining residue management and zero tillage in rice-wheat systems.",
      contentText: "",
      resourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeVideoId: "dQw4w9WgXcQ",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      sourceName: "ICAR eCourses Official",
      sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      lastUpdatedDate: "2026-11-26",
      contentOrigin: "CURATED_REFERENCE",
      downloadPermitted: false,
      verifiedForAi: false,
      published: true,
      createdBy: ADMIN_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // 2. Admin creates Official PYQ Paper with Answer Key URL (initially draft, then published)
  const pyqRef = adminDb.collection("studyMaterials").doc("pyq_icar_jrf_2024");
  await assertSucceeds(
    pyqRef.set({
      title: "ICAR AIEEA PG Agronomy 2024 Official Question Paper",
      semester: 8,
      subject: "Agronomy",
      subjectKey: "AGRONOMY",
      topic: "ICAR_JRF 2024",
      category: "PYQ",
      examCategory: "ICAR_JRF",
      examYear: "2024",
      pyqOrigin: "OFFICIAL_PYQ",
      summary: "Official NTA ICAR AIEEA PG Agronomy paper with official final answer key.",
      contentText: "",
      resourceUrl: "https://nta.ac.in/Download/ExamPaper/ICAR2024.pdf",
      answerKeyUrl: "https://nta.ac.in/Download/AnswerKey/ICAR2024Key.pdf",
      sourceName: "NTA / ICAR",
      sourceUrl: "https://icar.nta.ac.in",
      lastUpdatedDate: "2026-11-26",
      contentOrigin: "OFFICIAL_PUBLICATION",
      downloadPermitted: true,
      verifiedForAi: false,
      published: false,
      createdBy: ADMIN_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Draft PYQ is NOT readable by Student or Guest
  await assertFails(studentDb.collection("studyMaterials").doc("pyq_icar_jrf_2024").get());
  await assertFails(guestDb.collection("studyMaterials").doc("pyq_icar_jrf_2024").get());

  // Admin publishes PYQ in one click -> Student & Guest can now read it
  await assertSucceeds(pyqRef.update({ published: true, updatedAt: pastTime(1000) }));
  await assertSucceeds(studentDb.collection("studyMaterials").doc("pyq_icar_jrf_2024").get());
  await assertSucceeds(guestDb.collection("studyMaterials").doc("pyq_icar_jrf_2024").get());

  // 3. Admin creates Practice Test & Mock Test (/mockTests)
  const testRef = adminDb.collection("mockTests").doc("mock_icar_jrf_1");
  await assertSucceeds(
    testRef.set({
      title: "ICAR JRF Agronomy Full Mock Test #1",
      testType: "MOCK_TEST",
      examCategory: "ICAR_JRF",
      subjectKey: "AGRONOMY",
      semester: 0,
      difficulty: "ALL",
      durationMinutes: 60,
      description: "Covers tillage, irrigation, nutrient management, and weed science.",
      onlyOfficialPyq: false,
      published: false,
      createdBy: ADMIN_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Unpublished Mock Test is hidden from Student & Guest
  await assertFails(studentDb.collection("mockTests").doc("mock_icar_jrf_1").get());
  await assertFails(guestDb.collection("mockTests").doc("mock_icar_jrf_1").get());

  // Student CANNOT create, update, or delete Mock Tests
  await assertFails(
    studentDb.collection("mockTests").doc("student_fake_test").set({
      title: "Fake Test",
      testType: "PRACTICE_TEST",
      examCategory: "ALL",
      subjectKey: "ALL",
      semester: 1,
      difficulty: "ALL",
      durationMinutes: 15,
      description: "Unauthorized",
      onlyOfficialPyq: false,
      published: true,
      createdBy: STUDENT_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Admin publishes Mock Test -> Student & Guest can read; Student still cannot edit/delete
  await assertSucceeds(testRef.update({ published: true, updatedAt: pastTime(900) }));
  await assertSucceeds(studentDb.collection("mockTests").where("published", "==", true).get());
  await assertSucceeds(guestDb.collection("mockTests").where("published", "==", true).get());
  await assertFails(studentDb.collection("mockTests").doc("mock_icar_jrf_1").update({ title: "Hacked", updatedAt: pastTime(500) }));
  await assertFails(studentDb.collection("mockTests").doc("mock_icar_jrf_1").delete());

  // 4. Admin creates University Syllabus with academicSession
  await assertSucceeds(
    adminDb.collection("syllabi").doc("bckv_sem1_2025").set({
      university: "Bidhan Chandra Krishi Viswavidyalaya",
      universityShort: "BCKV",
      academicSession: "2025-26",
      course: "B.Sc. (Hons.) Agriculture",
      semester: 1,
      subject: "Fundamentals of Agronomy",
      subjectKey: "AGRONOMY",
      topics: ["Agronomy and its scope", "Tillage and tilth", "Crop nutrition"],
      publicationYear: "2025",
      sourceUrl: "https://www.bckv.edu.in/",
      pdfUrl: "https://www.bckv.edu.in/syllabus.pdf",
      downloadPermitted: true,
      published: true,
      createdBy: ADMIN_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertSucceeds(studentDb.collection("syllabi").doc("bckv_sem1_2025").get());

  // 5. Admin creates Learning Resources across new Phase 3 categories (YOUTUBE_PLAYLIST, BOOK_REFERENCE, OFFICIAL_NOTIFICATION)
  const resRef = adminDb.collection("discoveredStudyResources").doc("res_icar_playlist_1");
  await assertSucceeds(
    resRef.set({
      title: "ICAR Soil Science Official Lecture Playlist",
      sourceWebsite: "ICAR Official Channel",
      publicationDate: "2026-11-25",
      subjectKey: "SOIL_SCIENCE",
      topic: "Soil Physics & Chemistry",
      category: "YOUTUBE_PLAYLIST",
      language: "EN",
      resourceOrigin: "OFFICIAL_ICAR",
      sourceUrl: "https://www.youtube.com/playlist?list=PL1234567890ABCDEF",
      discoveryMethod: "ADMIN_SUBMITTED",
      reviewStatus: "PENDING_REVIEW",
      summary: "Verified playlist of ICAR soil science lectures.",
      dedupeKey: "https://www.youtube.com/playlist?list=pl1234567890abcdef|icar soil science",
      reviewedBy: ADMIN_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Pending Review item is strictly blocked from Students & Guests
  await assertFails(studentDb.collection("discoveredStudyResources").doc("res_icar_playlist_1").get());
  await assertFails(guestDb.collection("discoveredStudyResources").doc("res_icar_playlist_1").get());

  // Admin approves -> now readable by Students
  await assertSucceeds(resRef.update({ reviewStatus: "APPROVED_PUBLISHED", updatedAt: pastTime(800) }));
  await assertSucceeds(studentDb.collection("discoveredStudyResources").doc("res_icar_playlist_1").get());

  // 6. Student can save private VIDEO and RESOURCE bookmarks under users/{uid}/studyBookmarks
  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).collection("studyBookmarks").doc("VIDEO__video_agronomy_1").set({
      itemType: "VIDEO",
      itemId: "video_agronomy_1",
      title: "Conservation Agriculture & Zero Tillage",
      subject: "Agronomy",
      semester: 2,
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertSucceeds(
    studentDb.collection("users").doc(STUDENT_UID).collection("studyBookmarks").doc("RESOURCE__res_icar_playlist_1").set({
      itemType: "RESOURCE",
      itemId: "res_icar_playlist_1",
      title: "ICAR Soil Science Official Lecture Playlist",
      subject: "Soil Science",
      semester: 0,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Admin can delete Mock Test and Video when authorized
  await assertSucceeds(testRef.delete());
  await assertSucceeds(adminDb.collection("studyMaterials").doc("video_agronomy_1").delete());
});

test("Phase 4 Women Farmer Zone: YouTube Learning Library, Learning Centre & Scheme Discovery Review Queue Rules", async () => {
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, {
    email: ADMIN_EMAIL,
    email_verified: true,
  }).firestore();
  const studentDb = testEnv.authenticatedContext(STUDENT_UID, {
    email: "student@agri.edu.in",
    email_verified: true,
  }).firestore();
  const farmerDb = testEnv.authenticatedContext(FARMER_UID, {
    email: "farmer@wb.in",
    email_verified: true,
  }).firestore();
  const guestDb = testEnv.unauthenticatedContext().firestore();
  const ts = pastTime(4000);

  // 1. /womenVideos — Admin creates reference video St_38fwwE1M as DRAFT (published: false)
  const vidRef = adminDb.collection("womenVideos").doc("wf_ref_st38fwwe1m");
  await assertSucceeds(
    vidRef.set({
      title: "Women Farmer Training & Modern Agriculture Reference",
      titleBn: "নারী কৃষক প্রশিক্ষণ ও আধুনিক কৃষি রেফারেন্স",
      description: "Curated training video for Women Farmers and Students.",
      descriptionBn: "নারী কৃষক ও শিক্ষার্থীদের জন্য যাচাইকৃত ভিডিও।",
      category: "WOMEN_FARMER_TRAINING",
      language: "BILINGUAL",
      youtubeUrl: "https://youtu.be/St_38fwwE1M?si=GtlQBXUWONw_vCkN",
      videoId: "St_38fwwE1M",
      thumbnailUrl: "https://i.ytimg.com/vi/St_38fwwE1M/hqdefault.jpg",
      sourceName: "Curated Reference Video (YouTube)",
      audience: "BOTH",
      lastVerifiedDate: "2026-03-25",
      published: false,
      createdBy: ADMIN_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Draft video MUST be invisible to Guests, Students & Farmers
  await assertFails(guestDb.collection("womenVideos").doc("wf_ref_st38fwwe1m").get());
  await assertFails(studentDb.collection("womenVideos").doc("wf_ref_st38fwwe1m").get());
  await assertFails(farmerDb.collection("womenVideos").doc("wf_ref_st38fwwe1m").get());

  // Admin publishes -> now readable by Women Farmers, Students & Guests
  await assertSucceeds(vidRef.update({ published: true, updatedAt: pastTime(2000) }));
  await assertSucceeds(guestDb.collection("womenVideos").doc("wf_ref_st38fwwe1m").get());
  await assertSucceeds(studentDb.collection("womenVideos").doc("wf_ref_st38fwwe1m").get());
  await assertSucceeds(farmerDb.collection("womenVideos").doc("wf_ref_st38fwwe1m").get());

  // Non-Admin CANNOT create, modify, or delete videos
  await assertFails(
    farmerDb.collection("womenVideos").doc("wf_unauth_vid").set({
      title: "Unauthorized Video",
      category: "HORTICULTURE",
      language: "BN",
      youtubeUrl: "https://youtu.be/St_38fwwE1M",
      videoId: "St_38fwwE1M",
      audience: "BOTH",
      published: true,
      createdBy: FARMER_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertFails(farmerDb.collection("womenVideos").doc("wf_ref_st38fwwe1m").update({ published: false, updatedAt: pastTime(1000) }));
  await assertFails(studentDb.collection("womenVideos").doc("wf_ref_st38fwwe1m").delete());

  // Malicious non-YouTube URL or invalid category MUST be rejected even for Admin
  await assertFails(
    adminDb.collection("womenVideos").doc("wf_bad_url").set({
      title: "Bad URL Test",
      category: "HORTICULTURE",
      language: "EN",
      youtubeUrl: "https://evil.example.com/watch?v=St_38fwwE1M",
      videoId: "St_38fwwE1M",
      audience: "BOTH",
      published: true,
      createdBy: ADMIN_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );
  await assertFails(
    adminDb.collection("womenVideos").doc("wf_bad_cat").set({
      title: "Bad Category Test",
      category: "RANDOM_INVALID_CAT",
      language: "EN",
      youtubeUrl: "https://youtu.be/St_38fwwE1M",
      videoId: "St_38fwwE1M",
      audience: "BOTH",
      published: true,
      createdBy: ADMIN_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // 2. /womenLearningResources — Admin creates bilingual Learning Centre guide as draft -> publish
  const learnRef = adminDb.collection("womenLearningResources").doc("wf_learn_wb_shg");
  await assertSucceeds(
    learnRef.set({
      pillar: "ENTREPRENEURSHIP_GUIDANCE",
      title: "West Bengal Anandadhara SHG Food Processing Guide",
      titleBn: "পশ্চিমবঙ্গ আনন্দধারা SHG খাদ্য প্রক্রিয়াকরণ নির্দেশিকা",
      summary: "Verified steps for women SHGs to apply for PMFME Seed Capital through WBSRLM.",
      summaryBn: "WBSRLM-এর মাধ্যমে নারী SHG সদস্যদের PMFME সিড ক্যাপিটাল আবেদনের নিয়ম।",
      keyPointsEn: ["Register with village Sangha", "Complete Panchasutra grading"],
      keyPointsBn: ["গ্রামের সংঘে যুক্ত হন", "পঞ্চসূত্র গ্রেডিং সম্পন্ন করুন"],
      officialSourceName: "WBSRLM Anandadhara & PMFME MoFPI",
      officialSourceUrl: "https://pmfme.mofpi.gov.in/",
      lastVerifiedDate: "2026-03-25",
      published: false,
      createdBy: ADMIN_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  await assertFails(guestDb.collection("womenLearningResources").doc("wf_learn_wb_shg").get());
  await assertSucceeds(learnRef.update({ published: true, updatedAt: pastTime(1500) }));
  await assertSucceeds(guestDb.collection("womenLearningResources").doc("wf_learn_wb_shg").get());
  await assertFails(farmerDb.collection("womenLearningResources").doc("wf_learn_wb_shg").delete());

  // Invalid pillar or non-HTTPS source URL MUST fail
  await assertFails(
    adminDb.collection("womenLearningResources").doc("wf_learn_bad").set({
      pillar: "INVALID_PILLAR",
      title: "Invalid Pillar",
      summary: "Should fail schema validation",
      officialSourceName: "Test",
      officialSourceUrl: "https://pmfme.mofpi.gov.in/",
      lastVerifiedDate: "2026-03-25",
      published: true,
      createdBy: ADMIN_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // 3. /womenSchemeDiscoveryQueue — Discovered official scheme MUST enter PENDING_REVIEW before publication
  const qRef = adminDb.collection("womenSchemeDiscoveryQueue").doc("wf_disc_pib_1");
  await assertSucceeds(
    qRef.set({
      title: "Cabinet approves expansion of Women SHG Agri Drone & Horticulture Cluster Support",
      sourceName: "PIB — Ministry of Agriculture & Farmers Welfare (Govt. of India)",
      officialSourceUrl: "https://pib.gov.in/PressReleasePage.aspx?PRID=2026001",
      publicationDate: "2026-03-25",
      suggestedCategory: "WOMEN_FARMER",
      suggestedGovtLevel: "CENTRAL",
      suggestedState: "All India",
      womenRelevanceTag: "WOMEN_FOCUSED",
      discoveryMethod: "RSS_FEED",
      reviewStatus: "PENDING_REVIEW",
      dedupeKey: "https://pib.gov.in/pressreleasepage.aspx?prid=2026001",
      summary: "Official PIB release queued for Admin verification.",
      reviewedBy: ADMIN_UID,
      createdAt: ts,
      updatedAt: ts,
    })
  );

  // Pending discovery items MUST be invisible to public/non-admins
  await assertFails(guestDb.collection("womenSchemeDiscoveryQueue").doc("wf_disc_pib_1").get());
  await assertFails(farmerDb.collection("womenSchemeDiscoveryQueue").doc("wf_disc_pib_1").get());
  await assertFails(farmerDb.collection("womenSchemeDiscoveryQueue").doc("wf_disc_pib_1").update({ reviewStatus: "APPROVED_PUBLISHED", updatedAt: pastTime(1000) }));

  // Admin approves -> readable; Admin can clean up all 3 collections
  await assertSucceeds(qRef.update({ reviewStatus: "APPROVED_PUBLISHED", updatedAt: pastTime(900) }));
  await assertSucceeds(guestDb.collection("womenSchemeDiscoveryQueue").doc("wf_disc_pib_1").get());

  await assertSucceeds(vidRef.delete());
  await assertSucceeds(learnRef.delete());
  await assertSucceeds(qRef.delete());
});








