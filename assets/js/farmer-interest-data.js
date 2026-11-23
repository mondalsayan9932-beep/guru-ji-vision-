// ============================================================================
// Guru Ji Vision — Agricultural Bank vs Private Lender Interest Rate Data & Math
// HONESTY & TRANSPARENCY RULES:
//   1. Bank rates below are MANUALLY VERIFIED PUBLISHED REFERENCE RATES from
//      official Indian bank portals, RBI Master Directions, and Govt. of India
//      Modified Interest Subvention Scheme (MISS) circulars — NOT real-time API
//      feeds. The UI must always disclose this clearly and show lastVerifiedIso.
//   2. Private lender / landowner rates are STRICTLY user-entered contract data.
//   3. All comparison calculations use identical principal & duration and compute
//      true Effective Annual Borrowing Cost (EABC / APR %) rather than equating
//      monthly/annual or simple/compound nominal figures.
//   4. Awareness alerts are strictly neutral & educational — NEVER accusing any
//      lender of fraud or illegality.
// ============================================================================

export const BANK_INTEREST_RATE_META = {
  dataNature: "PUBLISHED_MANUALLY_VERIFIED_REFERENCE",
  liveApiConnected: false,
  lastVerifiedIso: "2026-03-15",
  lastVerifiedLabel: "15 Mar 2026",
  staleThresholdDays: 90,
  methodologyNote:
    "Published reference rates are compiled manually from official Indian bank product pages, RBI Master Directions on KCC / Interest Subvention, and NABARD guidelines. Live automated bank rate API integration is not currently connected. Confirm current branch rates, MCLR/EBLR resets, and processing fees directly with the bank before applying."
};

export const BANK_CATEGORIES = [
  { key: "ALL", label: "All Institutions" },
  { key: "PSU_BANK", label: "Public Sector Banks" },
  { key: "RRB", label: "Regional Rural Banks (RRBs)" },
  { key: "COOPERATIVE", label: "Cooperative Banks / PACS" }
];

export const VERIFIED_BANK_AGRI_RATES = [
  {
    id: "sbi_kcc_crop",
    bankName: "State Bank of India (SBI)",
    shortName: "SBI KCC",
    category: "PSU_BANK",
    categoryLabel: "Public Sector Bank",
    loanType: "Kisan Credit Card (KCC) — Short-Term Crop Loan",
    publishedRateLabel: "7.00% p.a. (up to ₹3 Lakh under MISS; 4.00% effective with 3% Prompt Repayment Incentive)",
    standardRateAnnualPercent: 7.0,
    aboveCapRateAnnualPercent: 9.75,
    subventionEligible: true,
    subsidizedRatePercent: 4.0,
    subventionCapInr: 300000,
    compoundingPerYear: 2,
    loanLimit: "Up to ₹3,00,000 under Modified Interest Subvention Scheme (MISS); higher limits subject to scale of finance & security norms",
    eligibility: "Individual/joint owner-cultivators, tenant farmers, oral lessees & sharecroppers (subject to bank/state land record & KYC norms), SHGs / JLGs.",
    subventionDetail: "Under Govt. of India MISS, short-term crop loans up to ₹3,00,000 carry 7% p.a. interest, with an additional 3% Prompt Repayment Incentive (PRI) reducing effective interest to 4% p.a. on timely repayment.",
    repaymentConditions: "Linked to harvest & marketing cycle (typically within 12 months for seasonal crop loans); prompt repayment required before due date to receive 3% PRI.",
    sourceName: "SBI Agri KCC Official Portal & RBI Master Direction on MISS",
    sourceUrl: "https://sbi.co.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card",
    lastVerifiedAt: "2026-03-15"
  },
  {
    id: "sbi_agri_term",
    bankName: "State Bank of India (SBI)",
    shortName: "SBI Agri Term Loan",
    category: "PSU_BANK",
    categoryLabel: "Public Sector Bank",
    loanType: "Agricultural Term Loan (Farm Mechanisation / Minor Irrigation)",
    publishedRateLabel: "9.85% – 11.40% p.a. (MCLR/EBLR linked reference; 10.50% midpoint used for estimate)",
    standardRateAnnualPercent: 10.5,
    aboveCapRateAnnualPercent: 10.5,
    subventionEligible: false,
    subsidizedRatePercent: 10.5,
    subventionCapInr: 0,
    compoundingPerYear: 4,
    loanLimit: "Based on project cost, tractor/equipment quotation, or irrigation unit cost (margin norms apply)",
    eligibility: "Farmers with cultivable land or approved allied agricultural activity meeting SBI credit appraisal and collateral/margin criteria.",
    subventionDetail: "General agricultural term loans do not receive standard 3% MISS crop-loan subvention; check Agriculture Infrastructure Fund (AIF) 3% subvention separately for eligible post-harvest projects.",
    repaymentConditions: "3 to 7 years (half-yearly or annual installments aligned with harvest cashflows; moratorium as sanctioned).",
    sourceName: "SBI Agricultural Banking & Interest Rates Portal",
    sourceUrl: "https://sbi.co.in/web/agri-rural/agriculture-banking",
    lastVerifiedAt: "2026-03-15"
  },
  {
    id: "pnb_kcc",
    bankName: "Punjab National Bank (PNB)",
    shortName: "PNB KCC",
    category: "PSU_BANK",
    categoryLabel: "Public Sector Bank",
    loanType: "PNB Kisan Credit Card (Short-Term Crop & Allied Loan)",
    publishedRateLabel: "7.00% p.a. (up to ₹3 Lakh under MISS; 4.00% effective with 3% PRI)",
    standardRateAnnualPercent: 7.0,
    aboveCapRateAnnualPercent: 9.9,
    subventionEligible: true,
    subsidizedRatePercent: 4.0,
    subventionCapInr: 300000,
    compoundingPerYear: 2,
    loanLimit: "Up to ₹3,00,000 eligible for MISS (sub-limit up to ₹2,00,000 for animal husbandry/fisheries under MISS); higher limits per scale of finance.",
    eligibility: "Cultivating farmers, tenant farmers, sharecroppers, and allied dairy/fishery farmers meeting PNB KYC and land/activity documentation.",
    subventionDetail: "7% p.a. base rate up to ₹3 Lakh; 3% Prompt Repayment Incentive reduces effective rate to 4% p.a. for timely repayment.",
    repaymentConditions: "Annual/seasonal harvest-linked repayment; card validity typically 5 years with annual review.",
    sourceName: "PNB Agriculture Credit — Kisan Credit Card",
    sourceUrl: "https://www.pnbindia.in/agriculture-credit-schemes.html",
    lastVerifiedAt: "2026-03-15"
  },
  {
    id: "bob_bkcc",
    bankName: "Bank of Baroda (BoB)",
    shortName: "BoB BKCC",
    category: "PSU_BANK",
    categoryLabel: "Public Sector Bank",
    loanType: "Baroda Kisan Credit Card (BKCC)",
    publishedRateLabel: "7.00% p.a. (up to ₹3 Lakh under MISS; 4.00% effective with 3% PRI)",
    standardRateAnnualPercent: 7.0,
    aboveCapRateAnnualPercent: 9.8,
    subventionEligible: true,
    subsidizedRatePercent: 4.0,
    subventionCapInr: 300000,
    compoundingPerYear: 2,
    loanLimit: "Up to ₹3,00,000 under MISS; collateral-free crop loan limit as per RBI guidelines (up to ₹2,00,000 per RBI circular).",
    eligibility: "All eligible farmers, joint borrowers, tenant farmers, and JLG/SHG members engaged in crop cultivation or allied activities.",
    subventionDetail: "Eligible for Govt. of India Modified Interest Subvention Scheme (7% p.a., effectively 4% p.a. with 3% PRI on prompt repayment).",
    repaymentConditions: "Repayable after harvest/marketing period as fixed by branch; annual review and renewal.",
    sourceName: "Bank of Baroda Rural & Agri Banking — BKCC",
    sourceUrl: "https://www.bankofbaroda.in/personal-banking/loans/rural-and-agri/baroda-kisan-credit-card",
    lastVerifiedAt: "2026-03-15"
  },
  {
    id: "canara_kcc",
    bankName: "Canara Bank",
    shortName: "Canara KCC",
    category: "PSU_BANK",
    categoryLabel: "Public Sector Bank",
    loanType: "Canara Kisan Credit Card (Crop Production & Allied Credit)",
    publishedRateLabel: "7.00% p.a. (up to ₹3 Lakh under MISS; 4.00% effective with 3% PRI)",
    standardRateAnnualPercent: 7.0,
    aboveCapRateAnnualPercent: 9.85,
    subventionEligible: true,
    subsidizedRatePercent: 4.0,
    subventionCapInr: 300000,
    compoundingPerYear: 2,
    loanLimit: "Up to ₹3,00,000 under MISS; above ₹3 Lakh linked to bank's MCLR/RLLR slab.",
    eligibility: "Owner-cultivators, tenant farmers, oral lessees & sharecroppers, and allied sector farmers per RBI KCC scheme norms.",
    subventionDetail: "7% p.a. up to ₹3 Lakh with 3% additional prompt repayment incentive (4% effective rate) subject to timely repayment.",
    repaymentConditions: "Short-term seasonal crop drawals repayable within 12 months (or crop duration up to 18 months for long-duration crops).",
    sourceName: "Canara Bank Agriculture Loans — Kisan Credit Card",
    sourceUrl: "https://canarabank.com/pages/Kisan-Credit-Card",
    lastVerifiedAt: "2026-03-15"
  },
  {
    id: "rrb_kcc",
    bankName: "Regional Rural Banks (RRBs — e.g. BGVB / PBGB)",
    shortName: "RRB KCC",
    category: "RRB",
    categoryLabel: "Regional Rural Bank (NABARD Supervised)",
    loanType: "RRB Kisan Credit Card (Short-Term Crop Loan)",
    publishedRateLabel: "7.00% p.a. (up to ₹3 Lakh under MISS; 4.00% effective with 3% PRI)",
    standardRateAnnualPercent: 7.0,
    aboveCapRateAnnualPercent: 10.25,
    subventionEligible: true,
    subsidizedRatePercent: 4.0,
    subventionCapInr: 300000,
    compoundingPerYear: 2,
    loanLimit: "Up to ₹3,00,000 under MISS; above ₹3 Lakh as per respective RRB Board-approved agricultural slab.",
    eligibility: "Rural farmers, small & marginal farmers, tenant cultivators, and SHG/JLG members in the RRB's notified operational districts.",
    subventionDetail: "Covered under Govt. of India / NABARD Modified Interest Subvention Scheme (7% base, 4% effective with 3% prompt repayment incentive).",
    repaymentConditions: "Harvest-aligned seasonal repayment; timely repayment before due date is mandatory for 3% PRI credit.",
    sourceName: "NABARD Refinance & KCC Guidelines / RBI MISS Circular",
    sourceUrl: "https://www.nabard.org/content.aspx?id=572",
    lastVerifiedAt: "2026-03-15"
  },
  {
    id: "coop_kcc",
    bankName: "State & District Cooperative Banks / PACS (e.g. WBSCB)",
    shortName: "Cooperative KCC",
    category: "COOPERATIVE",
    categoryLabel: "Cooperative Bank / PACS",
    loanType: "Cooperative Short-Term Crop Loan / KCC via PACS",
    publishedRateLabel: "7.00% p.a. (up to ₹3 Lakh under MISS; 4.00% effective with 3% PRI; select state subventions may further lower rate)",
    standardRateAnnualPercent: 7.0,
    aboveCapRateAnnualPercent: 10.5,
    subventionEligible: true,
    subsidizedRatePercent: 4.0,
    subventionCapInr: 300000,
    compoundingPerYear: 2,
    loanLimit: "Up to ₹3,00,000 under central MISS via DCCB/PACS (some states also provide additional state-level interest incentives for prompt payers — verify at local PACS).",
    eligibility: "Registered member farmers of Primary Agricultural Credit Societies (PACS) / District Central Cooperative Banks with verified crop/land declaration.",
    subventionDetail: "Central 7% base rate + 3% Prompt Repayment Incentive (4% effective). Additional state-specific cooperative subvention varies by state policy and fiscal year.",
    repaymentConditions: "Kharif/Rabi crop-season due dates fixed by DCCB/PACS; prompt repayment preserves subsidy eligibility.",
    sourceName: "RBI Master Direction on MISS & NABARD Cooperative Credit Portal",
    sourceUrl: "https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx",
    lastVerifiedAt: "2026-03-15"
  }
];

export const NEUTRAL_AWARENESS_ALERT_TEXT =
  "Your entered private loan has a higher estimated borrowing cost than the selected bank loan option. Consider checking your eligibility for agricultural credit before making a borrowing decision.";

/**
 * Evaluates whether the manually verified bank reference table is older than
 * the staleness threshold (default 90 days) so users are explicitly alerted.
 */
export function getRateFreshnessStatus(nowDate = new Date()) {
  const verifiedMs = Date.parse(BANK_INTEREST_RATE_META.lastVerifiedIso);
  if (!Number.isFinite(verifiedMs)) {
    return { isStale: true, ageDays: null, label: "Verification date unavailable — confirm directly with bank." };
  }
  const ageDays = Math.max(0, Math.floor((nowDate.getTime() - verifiedMs) / 86400000));
  const isStale = ageDays > BANK_INTEREST_RATE_META.staleThresholdDays;
  return {
    isStale,
    ageDays,
    label: isStale
      ? `Published reference rates were last verified ${ageDays} days ago (${BANK_INTEREST_RATE_META.lastVerifiedLabel}). Check official bank websites for any recent RBI/MCLR revisions.`
      : `Manually verified published reference rates (last checked ${BANK_INTEREST_RATE_META.lastVerifiedLabel} — not a live real-time bank API feed).`
  };
}

/**
 * Computes periodic installment count & label for a given duration & schedule.
 */
function resolveSchedulePeriods(durationMonths, schedule) {
  const months = Math.max(1, Number(durationMonths) || 12);
  switch (schedule) {
    case "MONTHLY":
      return { periods: months, periodsPerYear: 12, label: "Est. Monthly Payment" };
    case "QUARTERLY":
      return { periods: Math.max(1, Math.ceil(months / 3)), periodsPerYear: 4, label: "Est. Quarterly Payment" };
    case "YEARLY":
      return { periods: Math.max(1, Math.ceil(months / 12)), periodsPerYear: 1, label: "Est. Yearly Payment" };
    case "LUMP_SUM":
    default:
      return { periods: 1, periodsPerYear: 12 / months, label: "Est. Maturity Lump-Sum" };
  }
}

/**
 * Computes interest & true Effective Annual Borrowing Cost (EABC / APR %)
 * for a single loan structure over identical principal & duration.
 *
 * Methodology:
 * - Converts monthly nominal rates explicitly to annual nominal (rate * 12)
 *   for simple interest, or compounds monthly for compound interest.
 * - For amortizing schedules (MONTHLY/QUARTERLY/YEARLY) with compound interest,
 *   computes standard declining-balance EMI/installment totals when compound,
 *   or flat/simple schedule totals when simple, plus upfront/additional fees.
 * - True Effective Annual Borrowing Cost (EABC %):
 *     ((TotalRepayment / Principal) ^ (1 / years) - 1) * 100
 *   so fees, monthly vs annual quoting, and compounding are reflected honestly
 *   on one apples-to-apples annualized basis.
 */
function calculateLoanStructure({
  principal,
  nominalRatePercent,
  ratePeriod = "ANNUAL",
  interestMethod = "SIMPLE",
  compoundingPerYear = 1,
  durationMonths = 12,
  additionalFees = 0,
  repaymentSchedule = "LUMP_SUM",
  amountRepaid = 0
}) {
  const P = Math.max(1, Number(principal) || 0);
  const rawRate = Math.max(0, Number(nominalRatePercent) || 0);
  const months = Math.max(1, Number(durationMonths) || 12);
  const years = months / 12;
  const fees = Math.max(0, Number(additionalFees) || 0);
  const repaid = Math.max(0, Number(amountRepaid) || 0);

  // Explicit annual nominal equivalent
  const annualNominalPercent = ratePeriod === "MONTHLY" ? rawRate * 12 : rawRate;
  const annualNominalDec = annualNominalPercent / 100;

  const sched = resolveSchedulePeriods(months, repaymentSchedule);
  let totalInterest = 0;

  if (interestMethod === "COMPOUND") {
    const n = ratePeriod === "MONTHLY"
      ? 12
      : ([1, 2, 4, 12].includes(Number(compoundingPerYear)) ? Number(compoundingPerYear) : 1);

    if (repaymentSchedule === "LUMP_SUM") {
      // Standard compound growth on lump sum maturity: P * ((1 + r/n)^(n*t) - 1)
      totalInterest = P * (Math.pow(1 + annualNominalDec / n, n * years) - 1);
    } else {
      // Effective rate per repayment period derived from compounding frequency n
      const effectiveAnnualDec = Math.pow(1 + annualNominalDec / n, n) - 1;
      const periodRate = Math.pow(1 + effectiveAnnualDec, 1 / sched.periodsPerYear) - 1;
      if (periodRate <= 0) {
        totalInterest = 0;
      } else {
        const k = sched.periods;
        const pmt = P * (periodRate * Math.pow(1 + periodRate, k)) / (Math.pow(1 + periodRate, k) - 1);
        totalInterest = Math.max(0, pmt * k - P);
      }
    }
  } else {
    // Simple Interest: P * annualNominalDec * years (note: 2%/month => 24%/year * years)
    totalInterest = P * annualNominalDec * years;
  }

  const totalBorrowingCost = totalInterest + fees;
  const totalRepayment = P + totalBorrowingCost;
  const remainingAfterRepaid = Math.max(0, totalRepayment - repaid);
  const periodicPayment = totalRepayment / sched.periods;
  const monthlyEquivalent = totalRepayment / months;
  const yearlyEquivalent = totalRepayment / Math.max(years, 1 / 12);

  // Annualized Effective Borrowing Cost (EABC %) combining interest + fees + compounding
  const ratio = totalRepayment / P;
  const effectiveAnnualCostPercent =
    ratio <= 1 ? 0 : (Math.pow(ratio, 1 / years) - 1) * 100;

  return {
    principal: Math.round(P),
    annualNominalPercent: Number(annualNominalPercent.toFixed(2)),
    totalInterest: Math.round(totalInterest),
    totalFees: Math.round(fees),
    totalBorrowingCost: Math.round(totalBorrowingCost),
    totalRepayment: Math.round(totalRepayment),
    amountRepaid: Math.round(repaid),
    remainingAfterRepaid: Math.round(remainingAfterRepaid),
    periodicPayment: Math.round(periodicPayment),
    periodicLabel: sched.label,
    monthlyEquivalent: Math.round(monthlyEquivalent),
    yearlyEquivalent: Math.round(yearlyEquivalent),
    effectiveAnnualCostPercent: Number(effectiveAnnualCostPercent.toFixed(2))
  };
}

/**
 * Compares a selected verified Indian bank agricultural loan product against
 * a user-entered private lender / landowner loan on IDENTICAL principal & duration.
 */
export function computeBankVsPrivateComparison(input = {}) {
  const bankProduct =
    VERIFIED_BANK_AGRI_RATES.find((b) => b.id === input.bankProductId) || VERIFIED_BANK_AGRI_RATES[0];

  const principal = Math.max(1000, Math.min(100000000, Number(input.principalAmount) || 50000));
  const durationMonths = Math.max(1, Math.min(360, parseInt(input.durationMonths, 10) || 12));
  const repaymentSchedule = ["MONTHLY", "QUARTERLY", "YEARLY", "LUMP_SUM"].includes(input.repaymentSchedule)
    ? input.repaymentSchedule
    : "LUMP_SUM";
  const applySubvention = Boolean(input.applySubvention && bankProduct.subventionEligible);

  // Bank loan calculation:
  // If MISS subvention applies and principal exceeds ₹3,00,000 cap, split accurately:
  // first ₹3,00,000 at 4% (or 7% without PRI) and remainder at above-cap published rate.
  const subventionCap = bankProduct.subventionCapInr || 0;
  let bankCalc;
  let bankEffectiveRateNote = "";

  if (subventionCap > 0 && principal > subventionCap) {
    const capRate = applySubvention ? bankProduct.subsidizedRatePercent : bankProduct.standardRateAnnualPercent;
    const excessRate = bankProduct.aboveCapRateAnnualPercent || bankProduct.standardRateAnnualPercent;
    const part1 = calculateLoanStructure({
      principal: subventionCap,
      nominalRatePercent: capRate,
      ratePeriod: "ANNUAL",
      interestMethod: "COMPOUND",
      compoundingPerYear: bankProduct.compoundingPerYear || 2,
      durationMonths,
      additionalFees: 0,
      repaymentSchedule,
      amountRepaid: 0
    });
    const part2 = calculateLoanStructure({
      principal: principal - subventionCap,
      nominalRatePercent: excessRate,
      ratePeriod: "ANNUAL",
      interestMethod: "COMPOUND",
      compoundingPerYear: bankProduct.compoundingPerYear || 2,
      durationMonths,
      additionalFees: 0,
      repaymentSchedule,
      amountRepaid: 0
    });
    const totalInterest = part1.totalInterest + part2.totalInterest;
    const totalRepayment = principal + totalInterest;
    const years = durationMonths / 12;
    const sched = resolveSchedulePeriods(durationMonths, repaymentSchedule);
    const eabc = totalRepayment <= principal ? 0 : (Math.pow(totalRepayment / principal, 1 / years) - 1) * 100;

    bankCalc = {
      principal: Math.round(principal),
      annualNominalPercent: Number(((subventionCap * capRate + (principal - subventionCap) * excessRate) / principal).toFixed(2)),
      totalInterest: Math.round(totalInterest),
      totalFees: 0,
      totalBorrowingCost: Math.round(totalInterest),
      totalRepayment: Math.round(totalRepayment),
      amountRepaid: 0,
      remainingAfterRepaid: Math.round(totalRepayment),
      periodicPayment: Math.round(totalRepayment / sched.periods),
      periodicLabel: sched.label,
      monthlyEquivalent: Math.round(totalRepayment / durationMonths),
      yearlyEquivalent: Math.round(totalRepayment / Math.max(years, 1 / 12)),
      effectiveAnnualCostPercent: Number(eabc.toFixed(2))
    };
    bankEffectiveRateNote = `Tiered: First ₹3,00,000 @ ${capRate}% p.a. (${applySubvention ? "with 3% PRI" : "standard MISS"}) + remaining ₹${(principal - subventionCap).toLocaleString("en-IN")} @ ${excessRate}% p.a.`;
  } else {
    const appliedBankRate = applySubvention
      ? bankProduct.subsidizedRatePercent
      : bankProduct.standardRateAnnualPercent;
    bankCalc = calculateLoanStructure({
      principal,
      nominalRatePercent: appliedBankRate,
      ratePeriod: "ANNUAL",
      interestMethod: "COMPOUND",
      compoundingPerYear: bankProduct.compoundingPerYear || 2,
      durationMonths,
      additionalFees: 0,
      repaymentSchedule,
      amountRepaid: 0
    });
    bankEffectiveRateNote = applySubvention
      ? `${appliedBankRate}% p.a. effective (7% KCC minus 3% Prompt Repayment Incentive up to ₹3 Lakh)`
      : `${appliedBankRate}% p.a. published reference rate (${bankProduct.compoundingPerYear === 4 ? "quarterly" : "half-yearly"} rest estimate)`;
  }

  // User-entered private lender / landowner loan calculation
  const privateRateRaw = Math.max(0, Math.min(200, Number(input.privateInterestRate) || 0));
  const privateRatePeriod = input.privateRatePeriod === "ANNUAL" ? "ANNUAL" : "MONTHLY";
  const privateInterestMethod = input.privateInterestMethod === "COMPOUND" ? "COMPOUND" : "SIMPLE";
  const privateCompoundingPerYear = [1, 2, 4, 12].includes(Number(input.privateCompoundingPerYear))
    ? Number(input.privateCompoundingPerYear)
    : 12;
  const privateFees = Math.max(0, Math.min(10000000, Number(input.additionalFees) || 0));
  const privateRepaid = Math.max(0, Math.min(100000000, Number(input.amountAlreadyRepaid) || 0));

  const privateCalc = calculateLoanStructure({
    principal,
    nominalRatePercent: privateRateRaw,
    ratePeriod: privateRatePeriod,
    interestMethod: privateInterestMethod,
    compoundingPerYear: privateCompoundingPerYear,
    durationMonths,
    additionalFees: privateFees,
    repaymentSchedule,
    amountRepaid: privateRepaid
  });

  const interestCostDiff = privateCalc.totalBorrowingCost - bankCalc.totalBorrowingCost;
  const eabcDiffPercent = Number(
    (privateCalc.effectiveAnnualCostPercent - bankCalc.effectiveAnnualCostPercent).toFixed(2)
  );
  const showAwarenessAlert =
    privateCalc.totalBorrowingCost > bankCalc.totalBorrowingCost ||
    privateCalc.effectiveAnnualCostPercent > bankCalc.effectiveAnnualCostPercent;

  return {
    bankProduct,
    principal,
    durationMonths,
    repaymentSchedule,
    applySubvention,
    bankEffectiveRateNote,
    privateRateSummary: `${privateRateRaw}% ${privateRatePeriod === "MONTHLY" ? "per month" : "per year"} (${privateInterestMethod === "COMPOUND" ? `Compound ${privateCompoundingPerYear}x/yr` : "Simple"})`,
    bank: bankCalc,
    privateLoan: privateCalc,
    interestCostDiff: Math.round(interestCostDiff),
    eabcDiffPercent,
    showAwarenessAlert,
    awarenessAlertText: showAwarenessAlert ? NEUTRAL_AWARENESS_ALERT_TEXT : ""
  };
}
