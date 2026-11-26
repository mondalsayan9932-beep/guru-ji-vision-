// ============================================================================
// Guru Ji Vision — Strict Student & Farmer Financial Profile Isolation Utilities
// ============================================================================
// Enforces two completely separate financial profiles per authenticated UID:
//   - "student" -> users/{uid}/studentFinancialTransactions & studentFinancialBudgets
//   - "farmer"  -> users/{uid}/farmerFinancialTransactions  & farmerFinancialBudgets
// Includes safe, non-destructive classification & migration helpers for legacy
// records stored in users/{uid}/transactions and users/{uid}/budgets.
// ============================================================================

export const STUDENT_TRANSACTION_CATEGORIES = Object.freeze([
  "EDUCATION",
  "BOOKS_STATIONERY",
  "HOSTEL_RENT",
  "FOOD_MESS",
  "PERSONAL_EXPENSE",
  "TRAVEL_RECHARGE",
  "SHARED",
  "SAVINGS",
  "ALLOWANCE",
  "SCHOLARSHIP",
  "SAVINGS_RETURN",
  "OTHER"
]);

export const FARMER_TRANSACTION_CATEGORIES = Object.freeze([
  "CROP_EXPENSE",
  "SEEDS",
  "FERTILIZERS",
  "PESTICIDES",
  "LABOUR_COSTS",
  "IRRIGATION",
  "LAND_LEASE",
  "FARM_LOAN_REPAYMENT",
  "MACHINERY_TRANSPORT",
  "LIVESTOCK_DAIRY",
  "CROP_SALES",
  "FARM_LOAN_RECEIVED",
  "GOVT_SUBSIDY",
  "LAND_LEASE_INCOME",
  "OTHER_FARM",
  // Legacy farmer category keys preserved for zero-loss display & migration
  "SEEDS_FERTILIZER",
  "IRRIGATION_PESTICIDE",
  "LABOUR_MACHINERY",
  "HARVEST_SALE"
]);

const STUDENT_ONLY_LEGACY_CATS = new Set([
  "FOOD_MESS",
  "HOSTEL_RENT",
  "EDUCATION",
  "BOOKS_STATIONERY",
  "PERSONAL_EXPENSE",
  "SHARED",
  "SAVINGS",
  "ALLOWANCE",
  "SCHOLARSHIP",
  "SAVINGS_RETURN"
]);

const FARMER_ONLY_LEGACY_CATS = new Set([
  "CROP_EXPENSE",
  "SEEDS",
  "FERTILIZERS",
  "PESTICIDES",
  "LABOUR_COSTS",
  "IRRIGATION",
  "LAND_LEASE",
  "FARM_LOAN_REPAYMENT",
  "MACHINERY_TRANSPORT",
  "LIVESTOCK_DAIRY",
  "CROP_SALES",
  "FARM_LOAN_RECEIVED",
  "GOVT_SUBSIDY",
  "LAND_LEASE_INCOME",
  "OTHER_FARM",
  "SEEDS_FERTILIZER",
  "IRRIGATION_PESTICIDE",
  "LABOUR_MACHINERY",
  "HARVEST_SALE"
]);

const FARMER_KEYWORD_RE = /\b(seed|seeds|fertilizer|fertiliser|urea|dap|mop|npk|pesticide|fungicide|insecticide|herbicide|labour|labor|tractor|harvester|irrigation|pump|borewell|crop|paddy|wheat|potato|mustard|jute|harvest|mandi|lease|bigha|acre|kcc|kisan|pm-kisan|dairy|cattle|poultry|fishery|farm|বীজ|সার|কীটনাশক|শ্রমিক|সেচ|ফসল|ধান|আলু|জমি|লিজ|কৃষি)\b/i;

export function normalizeProfileType(raw) {
  const val = String(raw || "").trim().toLowerCase();
  if (val === "farmer") return "farmer";
  if (val === "student") return "student";
  return "";
}

export function profileTypeToLedgerScope(profileType) {
  return normalizeProfileType(profileType) === "farmer" ? "FARMER" : "STUDENT";
}

export function getTransactionCollectionName(profileType) {
  return normalizeProfileType(profileType) === "farmer"
    ? "farmerFinancialTransactions"
    : "studentFinancialTransactions";
}

export function getBudgetCollectionName(profileType) {
  return normalizeProfileType(profileType) === "farmer"
    ? "farmerFinancialBudgets"
    : "studentFinancialBudgets";
}

/**
 * Resolves which financial profiles this authenticated user is permitted to
 * access. Strictly mirrors Firestore Security Rules:
 *   - role STUDENT / PROFESSOR -> ["student"] (plus "farmer" only if explicitly enabled in financialProfiles)
 *   - role FARMER              -> ["farmer"]  (plus "student" only if explicitly enabled in financialProfiles)
 *   - dual-role users          -> ["student", "farmer"] (two strictly isolated profiles)
 */
export function getAllowedFinancialProfiles(userProfile) {
  const role = String(userProfile?.role || "STUDENT").toUpperCase();
  const allowed = new Set();

  if (role === "FARMER") {
    allowed.add("farmer");
  } else {
    allowed.add("student");
  }

  if (Array.isArray(userProfile?.financialProfiles)) {
    for (const entry of userProfile.financialProfiles) {
      const p = normalizeProfileType(entry);
      if (p) allowed.add(p);
    }
  }

  // Deterministic order: primary role first
  const primary = role === "FARMER" ? "farmer" : "student";
  const secondary = primary === "farmer" ? "student" : "farmer";
  return allowed.has(secondary) ? [primary, secondary] : [primary];
}

/**
 * Resolves the active profile type for Money Management while enforcing role boundaries.
 * Never returns a profile the user is not authorized to access.
 */
export function resolveActiveFinancialProfile(requestedScopeOrProfile, userProfile) {
  const allowed = getAllowedFinancialProfiles(userProfile);
  const requested = normalizeProfileType(requestedScopeOrProfile);

  if (requested && allowed.includes(requested)) {
    return {
      activeProfile: requested,
      allowedProfiles: allowed,
      deniedRequestedProfile: ""
    };
  }

  return {
    activeProfile: allowed[0],
    allowedProfiles: allowed,
    deniedRequestedProfile: requested && !allowed.includes(requested) ? requested : ""
  };
}

/**
 * Validates and normalizes a transaction category for the target financial profile.
 * Ensures Student records only ever store Student categories and Farmer records only store Farmer categories.
 */
export function normalizeCategoryForProfile(category, profileType, txType = "EXPENSE") {
  const profile = normalizeProfileType(profileType) || "student";
  const cat = String(category || "").trim().toUpperCase();

  if (profile === "farmer") {
    if (FARMER_TRANSACTION_CATEGORIES.includes(cat)) return cat;
    if (cat === "TRAVEL_RECHARGE") return "MACHINERY_TRANSPORT";
    if (cat === "HARVEST_SALE") return "CROP_SALES";
    return txType === "INCOME" ? "OTHER_FARM" : "OTHER_FARM";
  }

  if (STUDENT_TRANSACTION_CATEGORIES.includes(cat)) return cat;
  return "OTHER";
}

/**
 * Safely classifies a legacy transaction document from users/{uid}/transactions
 * into "student" or "farmer" without deleting or corrupting original data.
 */
export function classifyLegacyTransaction(tx, userRole = "STUDENT") {
  if (!tx || typeof tx !== "object") {
    return String(userRole || "").toUpperCase() === "FARMER" ? "farmer" : "student";
  }

  const explicitProfile = normalizeProfileType(tx.profileType);
  if (explicitProfile) return explicitProfile;

  const explicitScope = normalizeProfileType(tx.ledgerScope);
  if (explicitScope) return explicitScope;

  const cat = String(tx.category || "").trim().toUpperCase();
  if (FARMER_ONLY_LEGACY_CATS.has(cat)) return "farmer";
  if (STUDENT_ONLY_LEGACY_CATS.has(cat)) return "student";

  if (String(tx.cropTag || "").trim()) return "farmer";
  if (String(tx.sharedWith || "").trim()) return "student";

  const combinedText = `${tx.title || ""} ${tx.note || ""}`;
  if (FARMER_KEYWORD_RE.test(combinedText)) return "farmer";

  return String(userRole || "").toUpperCase() === "FARMER" ? "farmer" : "student";
}

/**
 * Safely classifies a legacy budget / opening balance document from users/{uid}/budgets
 * into "student" or "farmer".
 */
export function classifyLegacyBudget(budget, userRole = "STUDENT") {
  if (!budget || typeof budget !== "object") {
    return String(userRole || "").toUpperCase() === "FARMER" ? "farmer" : "student";
  }

  const explicitProfile = normalizeProfileType(budget.profileType || budget.ledgerScope);
  if (explicitProfile) return explicitProfile;

  if (budget.kind !== "OPENING_BALANCE" && budget.id !== "opening_balance") {
    if (FARMER_KEYWORD_RE.test(String(budget.name || ""))) return "farmer";
  }

  return String(userRole || "").toUpperCase() === "FARMER" ? "farmer" : "student";
}

/**
 * Builds a Firestore-rules-compliant transaction payload for the target isolated profile.
 */
export function buildScopedTransactionPayload({ uid, profileType, tx, createdAtValue, updatedAtValue, migratedFromLegacyId = "" }) {
  const profile = normalizeProfileType(profileType);
  if (!profile) throw new Error("A valid financial profileType ('student' or 'farmer') is required.");
  if (!uid || typeof uid !== "string") throw new Error("Authenticated userId is required.");

  const type = tx.type === "INCOME" ? "INCOME" : "EXPENSE";
  const payload = {
    userId: uid,
    profileType: profile,
    ledgerScope: profileTypeToLedgerScope(profile),
    title: String(tx.title || "").trim().slice(0, 100) || "Untitled Entry",
    amount: Math.max(0.01, Math.min(10000000, Number(tx.amount) || 0.01)),
    type,
    category: normalizeCategoryForProfile(tx.category, profile, type),
    note: String(tx.note || "").trim().slice(0, 300),
    dateLabel: String(tx.dateLabel || new Date().toISOString().slice(0, 10)).trim().slice(0, 30),
    updatedAt: updatedAtValue
  };

  if (profile === "student") {
    const shared = String(tx.sharedWith || "").trim().slice(0, 100);
    if (shared) payload.sharedWith = shared;
  } else {
    const cropTag = String(tx.cropTag || "").trim().slice(0, 60);
    if (cropTag) payload.cropTag = cropTag;
  }

  if (migratedFromLegacyId) {
    payload.migratedFromLegacyId = String(migratedFromLegacyId).slice(0, 128);
  }
  if (createdAtValue !== undefined) {
    payload.createdAt = createdAtValue;
  }

  return payload;
}

/**
 * Builds a Firestore-rules-compliant budget / opening balance payload for the target isolated profile.
 */
export function buildScopedBudgetPayload({ uid, profileType, goal, createdAtValue, updatedAtValue, migratedFromLegacyId = "" }) {
  const profile = normalizeProfileType(profileType);
  if (!profile) throw new Error("A valid financial profileType ('student' or 'farmer') is required.");
  if (!uid || typeof uid !== "string") throw new Error("Authenticated userId is required.");

  const kind = ["MONTHLY_BUDGET", "SAVINGS_GOAL", "OPENING_BALANCE"].includes(goal.kind)
    ? goal.kind
    : "MONTHLY_BUDGET";
  const minTarget = kind === "OPENING_BALANCE" ? 0 : 1;

  const payload = {
    userId: uid,
    profileType: profile,
    ledgerScope: profileTypeToLedgerScope(profile),
    name: String(goal.name || (kind === "OPENING_BALANCE" ? "Opening Balance" : "Budget")).trim().slice(0, 80),
    kind,
    targetAmount: Math.max(minTarget, Math.min(10000000, Number(goal.targetAmount) || 0)),
    savedAmount: Math.max(0, Math.min(10000000, Number(goal.savedAmount) || 0)),
    monthKey: String(goal.monthKey || (kind === "OPENING_BALANCE" ? "GLOBAL" : new Date().toISOString().slice(0, 7))).trim().slice(0, 20),
    updatedAt: updatedAtValue
  };

  if (migratedFromLegacyId) {
    payload.migratedFromLegacyId = String(migratedFromLegacyId).slice(0, 128);
  }
  if (createdAtValue !== undefined) {
    payload.createdAt = createdAtValue;
  }

  return payload;
}

/**
 * Computes strictly isolated summary metrics for a single financial profile.
 * Never mixes Student and Farmer records.
 */
export function computeProfileLedgerSummary(transactions = [], openingBalance = 0, expectedProfile = "") {
  const profile = normalizeProfileType(expectedProfile);
  const safeTxs = (transactions || []).filter((t) => {
    if (!profile) return true;
    const txProfile = normalizeProfileType(t?.profileType || t?.ledgerScope);
    return txProfile === profile;
  });

  const cleanOpening = Math.max(0, Number(openingBalance) || 0);
  const totalIncome = safeTxs
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalExpense = safeTxs
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const netProfitLoss = totalIncome - totalExpense;
  const netBalance = cleanOpening + netProfitLoss;

  return {
    transactions: safeTxs,
    openingBalance: cleanOpening,
    totalIncome,
    totalExpense,
    netProfitLoss,
    netBalance
  };
}
