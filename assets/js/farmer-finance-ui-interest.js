// ============================================================================
// Guru Ji Vision — Live Interest Rate Comparison UI
// Bank Agricultural Loans (Published Verified Reference) vs Private Lender Loan
// Strictly honest labeling, full light/dark high contrast, mobile-first layout.
// ============================================================================

import { escapeHtml, formatDateShort, formatInr, safeUrl } from "./calculators.js";
import {
  BANK_CATEGORIES,
  BANK_INTEREST_RATE_META,
  VERIFIED_BANK_AGRI_RATES,
  computeBankVsPrivateComparison,
  getRateFreshnessStatus
} from "./farmer-interest-data.js";

export function renderInterestCompareSection(state) {
  const ff = state.farmerFinance || {};
  const isSignedIn = Boolean(state.user);
  const bankCat = ff.interestBankCategory || "ALL";
  const savedComparisons = ff.interestComparisons || [];

  const inp = {
    bankProductId: ff.interestInput?.bankProductId || VERIFIED_BANK_AGRI_RATES[0].id,
    applySubvention: ff.interestInput?.applySubvention !== false,
    lenderName: ff.interestInput?.lenderName || "",
    principalAmount: ff.interestInput?.principalAmount ?? 50000,
    privateInterestRate: ff.interestInput?.privateInterestRate ?? 3,
    privateRatePeriod: ff.interestInput?.privateRatePeriod || "MONTHLY",
    privateInterestMethod: ff.interestInput?.privateInterestMethod || "SIMPLE",
    privateCompoundingPerYear: ff.interestInput?.privateCompoundingPerYear ?? 12,
    durationMonths: ff.interestInput?.durationMonths ?? 12,
    additionalFees: ff.interestInput?.additionalFees ?? 0,
    repaymentSchedule: ff.interestInput?.repaymentSchedule || "LUMP_SUM",
    amountAlreadyRepaid: ff.interestInput?.amountAlreadyRepaid ?? 0,
    notes: ff.interestInput?.notes || ""
  };

  const cmp = computeBankVsPrivateComparison(inp);
  const freshness = getRateFreshnessStatus();
  const visibleBanks =
    bankCat === "ALL"
      ? VERIFIED_BANK_AGRI_RATES
      : VERIFIED_BANK_AGRI_RATES.filter((b) => b.category === bankCat);

  const bankHigherCost = cmp.interestCostDiff < 0;
  const privateHigherCost = cmp.interestCostDiff > 0;

  return `
    <div class="space-y-5">
      <!-- ==================== HONESTY & DATA SOURCE BANNER ==================== -->
      <section class="rounded-2xl border ${freshness.isStale ? "bg-amber-50 border-amber-300 text-amber-950" : "bg-[#ECFDF5] border-[#A7F3D0] text-[#064E3B]"} p-4 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#064E3B] text-white">
              Published Reference Rates — Not Live Bank API
            </span>
            <span class="text-xs font-extrabold">
              Last Verified: ${escapeHtml(BANK_INTEREST_RATE_META.lastVerifiedLabel)}
            </span>
          </div>
          <span class="text-[11px] font-bold">
            Live Automated Bank Rate Feed: Not Connected
          </span>
        </div>
        <p class="text-xs leading-relaxed">
          ${escapeHtml(freshness.label)} ${escapeHtml(BANK_INTEREST_RATE_META.methodologyNote)}
        </p>
      </section>

      <!-- ==================== SMART INTEREST COMPARISON CALCULATOR ==================== -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Left: Private Lender / Landowner Entry + Bank Selector -->
        <section class="lg:col-span-5 gv-card p-5 space-y-4">
          <div class="space-y-1">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-base font-extrabold text-[#064E3B]">Bank vs Private Loan Calculator</h2>
              <span class="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-950 text-[10px] font-extrabold">
                User-Entered Contract Info
              </span>
            </div>
            <p class="text-xs text-[#334155]">
              Compare verified published agricultural bank rates against your private lender / landowner loan terms on identical principal &amp; duration.
            </p>
          </div>

          <div class="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-950 font-semibold">
            Private loan entries below represent <strong>user-entered contract information, not publicly verified live market rates</strong>.
          </div>

          <form id="ffInterestCompareForm" class="space-y-3">
            <!-- Bank Product Choice -->
            <div class="rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] p-3 space-y-2">
              <label for="ffIcBankProduct" class="block text-xs font-extrabold text-[#064E3B]">
                1. Select Agricultural Bank Loan Option *
              </label>
              <select id="ffIcBankProduct" name="bankProductId" class="ff-ic-field w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-xs sm:text-sm bg-white text-[#0F172A] font-semibold">
                ${VERIFIED_BANK_AGRI_RATES.map((b) => `
                  <option value="${escapeHtml(b.id)}" ${inp.bankProductId === b.id ? "selected" : ""}>
                    ${escapeHtml(b.shortName)} — ${escapeHtml(b.loanType)} (${b.standardRateAnnualPercent}% p.a.)
                  </option>
                `).join("")}
              </select>
              ${cmp.bankProduct.subventionEligible ? `
                <label class="flex items-start gap-2 cursor-pointer pt-1">
                  <input id="ffIcSubvention" name="applySubvention" type="checkbox" ${inp.applySubvention ? "checked" : ""} class="ff-ic-field mt-0.5 rounded" />
                  <span class="text-[11px] font-bold text-[#064E3B] leading-snug">
                    Include Govt. 3% Prompt Repayment Incentive (4% effective up to ₹3,00,000 under MISS)
                  </span>
                </label>
              ` : `
                <div class="text-[11px] text-[#334155] font-semibold">
                  Standard MISS 3% crop-loan subvention does not apply to this term-loan product.
                </div>
              `}
            </div>

            <!-- Private Lender Details -->
            <div class="space-y-3 pt-1">
              <div class="text-xs font-extrabold text-[#064E3B]">2. Enter Private Lender / Landowner Loan Terms</div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="ffIcLenderName" class="block text-xs font-bold text-[#334155] mb-1">Private Lender / Landowner Name</label>
                  <input id="ffIcLenderName" name="lenderName" value="${escapeHtml(inp.lenderName)}" placeholder="e.g. Local Mahajan / Landowner" class="ff-ic-field w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white text-[#0F172A]" />
                </div>
                <div>
                  <label for="ffIcPrincipal" class="block text-xs font-bold text-[#334155] mb-1">Loan Principal Amount (₹) *</label>
                  <input id="ffIcPrincipal" name="principalAmount" type="number" min="1000" max="100000000" step="500" required value="${escapeHtml(inp.principalAmount)}" class="ff-ic-field w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white text-[#0F172A]" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="ffIcRate" class="block text-xs font-bold text-[#334155] mb-1">Private Interest Rate (%) *</label>
                  <input id="ffIcRate" name="privateInterestRate" type="number" min="0" max="200" step="0.1" required value="${escapeHtml(inp.privateInterestRate)}" class="ff-ic-field w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white text-[#0F172A]" />
                </div>
                <div>
                  <label for="ffIcRatePeriod" class="block text-xs font-bold text-[#334155] mb-1">Rate Basis (Monthly / Annual) *</label>
                  <select id="ffIcRatePeriod" name="privateRatePeriod" class="ff-ic-field w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white text-[#0F172A] font-semibold">
                    <option value="MONTHLY" ${inp.privateRatePeriod === "MONTHLY" ? "selected" : ""}>% Per Month (মাসিক সুদ)</option>
                    <option value="ANNUAL" ${inp.privateRatePeriod === "ANNUAL" ? "selected" : ""}>% Per Year (বার্ষিক সুদ)</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="ffIcMethod" class="block text-xs font-bold text-[#334155] mb-1">Interest Type *</label>
                  <select id="ffIcMethod" name="privateInterestMethod" class="ff-ic-field w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white text-[#0F172A] font-semibold">
                    <option value="SIMPLE" ${inp.privateInterestMethod === "SIMPLE" ? "selected" : ""}>Simple Interest (সরল সুদ)</option>
                    <option value="COMPOUND" ${inp.privateInterestMethod === "COMPOUND" ? "selected" : ""}>Compound Interest (চক্রবৃদ্ধি)</option>
                  </select>
                </div>
                <div>
                  <label for="ffIcCompFreq" class="block text-xs font-bold text-[#334155] mb-1">Compounding Frequency</label>
                  <select id="ffIcCompFreq" name="privateCompoundingPerYear" ${inp.privateInterestMethod !== "COMPOUND" ? "disabled" : ""} class="ff-ic-field w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white text-[#0F172A] font-semibold disabled:opacity-60">
                    <option value="12" ${Number(inp.privateCompoundingPerYear) === 12 ? "selected" : ""}>Monthly (12x/yr)</option>
                    <option value="4" ${Number(inp.privateCompoundingPerYear) === 4 ? "selected" : ""}>Quarterly (4x/yr)</option>
                    <option value="2" ${Number(inp.privateCompoundingPerYear) === 2 ? "selected" : ""}>Half-Yearly (2x/yr)</option>
                    <option value="1" ${Number(inp.privateCompoundingPerYear) === 1 ? "selected" : ""}>Yearly (1x/yr)</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="ffIcDuration" class="block text-xs font-bold text-[#334155] mb-1">Loan Duration (Months) *</label>
                  <input id="ffIcDuration" name="durationMonths" type="number" min="1" max="360" step="1" required value="${escapeHtml(inp.durationMonths)}" class="ff-ic-field w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white text-[#0F172A]" />
                </div>
                <div>
                  <label for="ffIcSchedule" class="block text-xs font-bold text-[#334155] mb-1">Repayment Schedule</label>
                  <select id="ffIcSchedule" name="repaymentSchedule" class="ff-ic-field w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white text-[#0F172A] font-semibold">
                    <option value="LUMP_SUM" ${inp.repaymentSchedule === "LUMP_SUM" ? "selected" : ""}>Harvest Lump-Sum (End of Term)</option>
                    <option value="MONTHLY" ${inp.repaymentSchedule === "MONTHLY" ? "selected" : ""}>Monthly Installments</option>
                    <option value="QUARTERLY" ${inp.repaymentSchedule === "QUARTERLY" ? "selected" : ""}>Quarterly Installments</option>
                    <option value="YEARLY" ${inp.repaymentSchedule === "YEARLY" ? "selected" : ""}>Yearly Installments</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="ffIcFees" class="block text-xs font-bold text-[#334155] mb-1">Additional Fees / Charges (₹)</label>
                  <input id="ffIcFees" name="additionalFees" type="number" min="0" step="100" value="${escapeHtml(inp.additionalFees)}" class="ff-ic-field w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white text-[#0F172A]" />
                </div>
                <div>
                  <label for="ffIcRepaid" class="block text-xs font-bold text-[#334155] mb-1">Amount Already Repaid (₹)</label>
                  <input id="ffIcRepaid" name="amountAlreadyRepaid" type="number" min="0" step="100" value="${escapeHtml(inp.amountAlreadyRepaid)}" class="ff-ic-field w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white text-[#0F172A]" />
                </div>
              </div>

              <div>
                <label for="ffIcNotes" class="block text-xs font-bold text-[#334155] mb-1">Contract Note (Optional)</label>
                <input id="ffIcNotes" name="notes" value="${escapeHtml(inp.notes)}" placeholder="e.g. Verbal crop-season loan against paddy harvest" class="ff-ic-field w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white text-[#0F172A]" />
              </div>

              <button type="submit" class="gv-btn w-full py-3 rounded-xl bg-[#064E3B] hover:bg-[#065F46] text-white text-sm font-extrabold shadow-sm">
                ${isSignedIn ? "Save Comparison Privately to My Vault" : "Sign In with Google to Save Comparison"}
              </button>
            </div>
          </form>
        </section>

        <!-- Right: Live Side-by-Side Comparison Results + Neutral Awareness Alert -->
        <section class="lg:col-span-7 space-y-4">
          <div class="gv-card p-5 space-y-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 class="text-base sm:text-lg font-extrabold text-[#064E3B]">
                  Side-by-Side Borrowing Cost Comparison
                </h2>
                <p class="text-xs text-[#334155]">
                  Identical Principal: <strong>${escapeHtml(formatInr(cmp.principal))}</strong> • Duration: <strong>${escapeHtml(cmp.durationMonths)} months</strong> • Schedule: <strong>${escapeHtml(cmp.repaymentSchedule.replace("_", " "))}</strong>
                </p>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-extrabold ${privateHigherCost ? "bg-amber-100 text-amber-950 border border-amber-300" : "bg-[#DCFCE7] text-[#064E3B] border border-[#86EFAC]"}">
                ${privateHigherCost
                  ? `Private Costs +${escapeHtml(formatInr(cmp.interestCostDiff))} More`
                  : (bankHigherCost ? `Bank Costs +${escapeHtml(formatInr(Math.abs(cmp.interestCostDiff)))} More` : "Equal Estimated Cost")}
              </span>
            </div>

            <!-- Educational Financial Awareness Alert (Neutral — Never Accusatory) -->
            ${cmp.showAwarenessAlert ? `
              <div role="status" class="rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 text-amber-950 space-y-1.5">
                <div class="text-xs font-extrabold uppercase tracking-wide text-amber-900">
                  Financial Awareness Notice (আর্থিক সচেতনতা বার্তা)
                </div>
                <p class="text-xs sm:text-sm font-semibold leading-relaxed">
                  ${escapeHtml(cmp.awarenessAlertText)}
                </p>
              </div>
            ` : ""}

            <!-- Two-Column Side-by-Side Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <!-- Bank Card -->
              <div class="rounded-2xl bg-[#ECFDF5] border border-[#86EFAC] p-4 space-y-3">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="text-[10px] font-extrabold uppercase tracking-wider text-[#047857]">Published Bank Reference</div>
                    <h3 class="text-sm font-extrabold text-[#064E3B]">${escapeHtml(cmp.bankProduct.shortName)}</h3>
                    <div class="text-[11px] text-[#334155] font-medium">${escapeHtml(cmp.bankEffectiveRateNote)}</div>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="text-[10px] font-bold text-[#047857]">Effective Annual Cost</div>
                    <div class="text-lg font-extrabold text-[#064E3B]">${escapeHtml(cmp.bank.effectiveAnnualCostPercent)}%</div>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="rounded-xl bg-white border border-[#BBF7D0] p-2.5">
                    <div class="text-[10px] font-bold text-[#475569]">Total Interest</div>
                    <div class="font-extrabold text-[#064E3B] mt-0.5">${escapeHtml(formatInr(cmp.bank.totalInterest))}</div>
                  </div>
                  <div class="rounded-xl bg-white border border-[#BBF7D0] p-2.5">
                    <div class="text-[10px] font-bold text-[#475569]">Total Repayment</div>
                    <div class="font-extrabold text-[#0F172A] mt-0.5">${escapeHtml(formatInr(cmp.bank.totalRepayment))}</div>
                  </div>
                  <div class="rounded-xl bg-white border border-[#BBF7D0] p-2.5">
                    <div class="text-[10px] font-bold text-[#475569]">${escapeHtml(cmp.bank.periodicLabel)}</div>
                    <div class="font-extrabold text-[#0F172A] mt-0.5">${escapeHtml(formatInr(cmp.bank.periodicPayment))}</div>
                  </div>
                  <div class="rounded-xl bg-white border border-[#BBF7D0] p-2.5">
                    <div class="text-[10px] font-bold text-[#475569]">Avg Monthly / Yearly</div>
                    <div class="font-extrabold text-[#0F172A] mt-0.5">${escapeHtml(formatInr(cmp.bank.monthlyEquivalent))}/m</div>
                  </div>
                </div>
              </div>

              <!-- Private Lender Card -->
              <div class="rounded-2xl bg-[#FFFBEB] border border-[#FCD34D] p-4 space-y-3">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="text-[10px] font-extrabold uppercase tracking-wider text-[#92400E]">User-Entered Private Loan</div>
                    <h3 class="text-sm font-extrabold text-[#78350F]">${escapeHtml(inp.lenderName || "Private Lender / Landowner")}</h3>
                    <div class="text-[11px] text-[#78350F] font-medium">${escapeHtml(cmp.privateRateSummary)}${cmp.privateLoan.totalFees > 0 ? ` + ${formatInr(cmp.privateLoan.totalFees)} fees` : ""}</div>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="text-[10px] font-bold text-[#92400E]">Effective Annual Cost</div>
                    <div class="text-lg font-extrabold text-[#78350F]">${escapeHtml(cmp.privateLoan.effectiveAnnualCostPercent)}%</div>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="rounded-xl bg-white border border-amber-200 p-2.5">
                    <div class="text-[10px] font-bold text-[#475569]">Interest + Fees</div>
                    <div class="font-extrabold text-[#92400E] mt-0.5">${escapeHtml(formatInr(cmp.privateLoan.totalBorrowingCost))}</div>
                  </div>
                  <div class="rounded-xl bg-white border border-amber-200 p-2.5">
                    <div class="text-[10px] font-bold text-[#475569]">Total Repayment</div>
                    <div class="font-extrabold text-[#0F172A] mt-0.5">${escapeHtml(formatInr(cmp.privateLoan.totalRepayment))}</div>
                  </div>
                  <div class="rounded-xl bg-white border border-amber-200 p-2.5">
                    <div class="text-[10px] font-bold text-[#475569]">${escapeHtml(cmp.privateLoan.periodicLabel)}</div>
                    <div class="font-extrabold text-[#0F172A] mt-0.5">${escapeHtml(formatInr(cmp.privateLoan.periodicPayment))}</div>
                  </div>
                  <div class="rounded-xl bg-white border border-amber-200 p-2.5">
                    <div class="text-[10px] font-bold text-[#475569]">Est. Remaining After Repaid</div>
                    <div class="font-extrabold text-[#0F172A] mt-0.5">${escapeHtml(formatInr(cmp.privateLoan.remainingAfterRepaid))}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Difference Summary Strip -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div class="rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] p-3">
                <div class="text-[10px] font-bold uppercase text-[#475569]">Total Cost Difference</div>
                <div class="text-base font-extrabold ${privateHigherCost ? "text-[#B45309]" : "text-[#064E3B]"} mt-0.5">
                  ${cmp.interestCostDiff >= 0 ? "+" : "-"}${escapeHtml(formatInr(Math.abs(cmp.interestCostDiff)))}
                </div>
                <div class="text-[11px] text-[#475569]">Private minus Bank total cost</div>
              </div>
              <div class="rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] p-3">
                <div class="text-[10px] font-bold uppercase text-[#475569]">Annual Cost Rate Gap (EABC)</div>
                <div class="text-base font-extrabold ${cmp.eabcDiffPercent > 0 ? "text-[#B45309]" : "text-[#064E3B]"} mt-0.5">
                  ${cmp.eabcDiffPercent >= 0 ? "+" : ""}${escapeHtml(cmp.eabcDiffPercent)}% / yr
                </div>
                <div class="text-[11px] text-[#475569]">${cmp.privateLoan.effectiveAnnualCostPercent}% vs ${cmp.bank.effectiveAnnualCostPercent}%</div>
              </div>
              <div class="rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] p-3">
                <div class="text-[10px] font-bold uppercase text-[#475569]">Annualized Private Nominal</div>
                <div class="text-base font-extrabold text-[#0F172A] mt-0.5">${escapeHtml(cmp.privateLoan.annualNominalPercent)}% p.a.</div>
                <div class="text-[11px] text-[#475569]">${inp.privateRatePeriod === "MONTHLY" ? `${inp.privateInterestRate}%/mo × 12 months` : "Entered as annual rate"}</div>
              </div>
            </div>

            <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-[11px] text-[#334155] leading-relaxed">
              <strong>Calculation Transparency:</strong> Effective Annual Borrowing Cost (EABC %) converts monthly vs annual rates, simple vs compound interest, additional fees, and repayment schedule into a single comparable annualized percentage: <code>((Total Repayment ÷ Principal) ^ (12 ÷ Months) − 1) × 100</code>. These are educational estimates; actual bank sanctions depend on branch MCLR/EBLR, documentation, and timely repayment.
            </div>
          </div>

          <!-- Saved Private Comparisons (Authenticated Farmer Only) -->
          <div class="gv-card p-5 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 class="text-sm sm:text-base font-extrabold text-[#064E3B]">
                  My Saved Interest Comparisons (${isSignedIn ? savedComparisons.length : 0})
                </h3>
                <p class="text-xs text-[#475569]">Stored privately in your Google-authenticated Firebase account only.</p>
              </div>
              ${isSignedIn && savedComparisons.length > 0 ? `
                <button data-ff-action="export-interest-csv" type="button" class="px-3 py-1.5 rounded-xl bg-white border border-[#CBD5E1] text-xs font-extrabold text-[#064E3B] hover:bg-[#ECFDF5]">
                  Export CSV
                </button>
              ` : ""}
            </div>

            ${!isSignedIn ? `
              <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 flex flex-wrap items-center justify-between gap-3">
                <p class="text-xs text-[#334155]">You can use the comparison calculator freely without signing in. Sign in with Google only if you want to save comparisons privately in your cloud vault.</p>
                <button data-action="open-auth" type="button" class="px-3.5 py-2 rounded-xl bg-[#064E3B] text-white text-xs font-extrabold shrink-0">Sign In with Google</button>
              </div>
            ` : savedComparisons.length === 0 ? `
              <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-xs text-[#475569]">
                No saved comparisons yet. Enter a private loan on the left and click <strong>Save Comparison Privately</strong> to keep a timestamped private record.
              </div>
            ` : `
              <div class="space-y-2.5">
                ${savedComparisons.slice(0, 10).map((item) => `
                  <article class="rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] p-3.5 space-y-1.5">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div class="text-xs sm:text-sm font-extrabold text-[#064E3B]">
                        ${escapeHtml(item.bankName)} vs ${escapeHtml(item.privateLenderName || "Private Lender")}
                      </div>
                      <span class="text-[11px] font-bold text-[#475569]">${escapeHtml(formatDateShort(item.createdAtMs || Date.now()))}</span>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div><span class="text-[#475569]">Principal:</span> <strong>${escapeHtml(formatInr(item.principalAmount))}</strong></div>
                      <div><span class="text-[#475569]">Duration:</span> <strong>${escapeHtml(item.durationMonths)}m</strong></div>
                      <div><span class="text-[#475569]">Bank EABC:</span> <strong class="text-[#064E3B]">${escapeHtml(item.bankEffectiveAnnualCostPercent)}%</strong></div>
                      <div><span class="text-[#475569]">Private EABC:</span> <strong class="text-[#92400E]">${escapeHtml(item.privateEffectiveAnnualCostPercent)}%</strong></div>
                    </div>
                    <div class="text-[11px] text-[#334155]">
                      Est. Cost Difference: <strong>${item.interestCostDifference >= 0 ? "+" : "-"}${escapeHtml(formatInr(Math.abs(item.interestCostDifference || 0)))}</strong>
                      ${item.notes ? ` • Note: ${escapeHtml(item.notes)}` : ""}
                    </div>
                  </article>
                `).join("")}
              </div>
            `}
          </div>
        </section>
      </div>

      <!-- ==================== VERIFIED BANK AGRICULTURAL LOAN DATABASE ==================== -->
      <section class="gv-card p-5 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-base sm:text-lg font-extrabold text-[#064E3B]">
              Verified Agricultural Bank Loan &amp; KCC Reference Rates (${visibleBanks.length})
            </h2>
            <p class="text-xs text-[#334155]">
              Published Indian PSU Bank, RRB, and Cooperative Bank KCC/agricultural credit terms with official portals &amp; verification dates.
            </p>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${BANK_CATEGORIES.map((c) => `
              <button data-ff-bank-cat="${c.key}" type="button" class="px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-colors ${
                bankCat === c.key
                  ? "bg-[#064E3B] text-white border-[#064E3B]"
                  : "bg-white text-[#064E3B] border-[#CBD5E1] hover:bg-[#ECFDF5]"
              }">
                ${escapeHtml(c.label)}
              </button>
            `).join("")}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${visibleBanks.map((bank) => {
            const href = safeUrl(bank.sourceUrl);
            const selected = inp.bankProductId === bank.id;
            return `
              <article class="rounded-2xl border ${selected ? "border-[#047857] ring-1 ring-[#10B981]/50 bg-[#ECFDF5]/50" : "border-[#CBD5E1] bg-white"} p-4 space-y-2.5 flex flex-col justify-between">
                <div class="space-y-2">
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span class="inline-block px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#064E3B] text-[10px] font-extrabold">
                        ${escapeHtml(bank.categoryLabel)}
                      </span>
                      <h3 class="text-sm sm:text-base font-extrabold text-[#0F172A] mt-1">${escapeHtml(bank.bankName)}</h3>
                      <div class="text-xs font-bold text-[#047857]">${escapeHtml(bank.loanType)}</div>
                    </div>
                    <button data-ff-select-bank="${escapeHtml(bank.id)}" type="button" class="px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold ${
                      selected
                        ? "bg-[#064E3B] text-white"
                        : "bg-[#ECFDF5] text-[#064E3B] border border-[#A7F3D0] hover:bg-[#DCFCE7]"
                    }">
                      ${selected ? "Selected ✓" : "Compare This"}
                    </button>
                  </div>

                  <div class="rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-2 text-xs text-[#064E3B]">
                    <strong>Published Rate:</strong> ${escapeHtml(bank.publishedRateLabel)}
                  </div>

                  <div class="space-y-1 text-xs text-[#334155] leading-relaxed">
                    <div><strong class="text-[#0F172A]">Loan Limit:</strong> ${escapeHtml(bank.loanLimit)}</div>
                    <div><strong class="text-[#0F172A]">Eligibility:</strong> ${escapeHtml(bank.eligibility)}</div>
                    <div><strong class="text-[#0F172A]">Govt. Subvention:</strong> ${escapeHtml(bank.subventionDetail)}</div>
                    <div><strong class="text-[#0F172A]">Repayment Terms:</strong> ${escapeHtml(bank.repaymentConditions)}</div>
                  </div>
                </div>

                <div class="pt-2.5 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#475569]">
                  <span>Verified: <strong class="text-[#0F172A]">${escapeHtml(bank.lastVerifiedAt)}</strong></span>
                  ${href ? `
                    <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="font-extrabold text-[#047857] hover:underline">
                      ${escapeHtml(bank.sourceName)} ↗
                    </a>
                  ` : `<span>${escapeHtml(bank.sourceName)}</span>`}
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </section>
    </div>
  `;
}
