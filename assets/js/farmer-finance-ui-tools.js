// ============================================================================
// Guru Ji Vision — Farmer Financial Support & Rights UI (Phase 2, 3 & 4 Views)
// 1. Income & Expense Manager (11 Agri Categories + Custom Categories)
// 2. Profit & Loss Calculator (Crop-wise, Season-wise, Land-wise + Alerts)
// 3. Government Schemes & Financial Assistance (Official Verified Sources)
// 4. Farmer Rights & Complaint Support (Dispute Log + Official Helplines)
// 5. Financial Reports & Documents Vault (Upload, Filter, PDF/CSV & Audit Trail)
// ============================================================================

import { buildWhatsAppDirectUrl, escapeHtml, formatDateShort, formatInr, safeUrl } from "./calculators.js";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  DEFAULT_EXPENSE_CATEGORIES,
  DOCUMENT_TYPES,
  FARM_SEASONS,
  GOVERNMENT_SCHEMES,
  OFFICIAL_GRIEVANCE_CONTACTS,
  computeProfitAndLoss,
  loadFormDraft
} from "./farmer-finance-data.js";

// ----------------------------------------------------------------------------
// 1. FARMER INCOME & EXPENSE MANAGER
// ----------------------------------------------------------------------------
export function renderExpensesSection(state, expenses, leases, documents) {
  const uid = state.user?.uid;
  const draft = loadFormDraft(uid, "expense");
  const d = draft?.data || {};
  const today = new Date().toISOString().slice(0, 10);
  const selectedCat = state.farmerFinance?.expenseFormCategory || d.category || "SEEDS";
  const filterCat = state.farmerFinance?.expenseFilterCategory || "ALL";

  const filtered = filterCat === "ALL"
    ? expenses
    : expenses.filter((e) => e.category === filterCat || (e.customCategory && e.customCategory === filterCat));

  const totalFiltered = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  // Category breakdown
  const catTotals = new Map();
  expenses.forEach((e) => {
    const label = e.category === "CUSTOM" ? (e.customCategory || "Custom") : e.category;
    catTotals.set(label, (catTotals.get(label) || 0) + (Number(e.amount) || 0));
  });
  const sortedCats = Array.from(catTotals.entries()).sort((a, b) => b[1] - a[1]);

  return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <!-- Add Expense Form -->
      <section class="lg:col-span-5 gv-card p-5 space-y-4">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h2 class="text-base font-extrabold text-[#14532D]">Add Farming Expense</h2>
            <p class="text-xs text-[#475569]">কৃষি খরচের হিসাব লিখুন (11 Standard + Custom Categories)</p>
          </div>
          <button data-ff-action="save-draft" data-draft-form="ffExpenseForm" data-draft-key="expense" type="button" class="px-2.5 py-1.5 rounded-lg bg-[#ECFDF5] border border-[#BBF7D0] text-[11px] font-extrabold text-[#14532D]">
            Save Draft
          </button>
        </div>

        <form id="ffExpenseForm" class="space-y-3">
          <div>
            <label class="block text-xs font-bold text-[#334155] mb-1">Expense Category (খরচের ধরন) *</label>
            <select id="ffExpenseCategorySelect" name="category" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white">
              ${DEFAULT_EXPENSE_CATEGORIES.map((c) => `<option value="${c.key}" ${selectedCat === c.key ? "selected" : ""}>${escapeHtml(c.label)}</option>`).join("")}
              <option value="CUSTOM" ${selectedCat === "CUSTOM" ? "selected" : ""}>+ Custom Expense Category (নিজস্ব ধরন)</option>
            </select>
          </div>

          <div id="ffCustomCategoryWrap" class="${selectedCat === "CUSTOM" ? "" : "hidden"}">
            <label class="block text-xs font-bold text-[#334155] mb-1">Custom Category Name *</label>
            <input name="customCategory" value="${escapeHtml(d.customCategory || "")}" placeholder="e.g. Cold Storage Rent, Tarpaulin, Soil Testing" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-[#334155] mb-1">Amount (টাকা ₹) *</label>
              <input name="amount" type="number" step="0.01" min="0.01" required value="${escapeHtml(d.amount || "")}" placeholder="e.g. 1850" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
            </div>
            <div>
              <label class="block text-xs font-bold text-[#334155] mb-1">Date (তারিখ) *</label>
              <input name="expenseDate" type="date" required value="${escapeHtml(d.expenseDate || today)}" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-[#334155] mb-1">Description (বিবরণ) *</label>
            <input name="description" required value="${escapeHtml(d.description || "")}" placeholder="e.g. 2 bags DAP + 1 bag Urea from local dealer" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-[#334155] mb-1">Related Crop (ফসল)</label>
              <input name="cropName" value="${escapeHtml(d.cropName || "")}" placeholder="e.g. Paddy, Potato" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
            </div>
            <div>
              <label class="block text-xs font-bold text-[#334155] mb-1">Season (মরসুম)</label>
              <select name="season" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white">
                ${FARM_SEASONS.map((s) => `<option value="${s.key}" ${(d.season || "KHARIF") === s.key ? "selected" : ""}>${escapeHtml(s.label)}</option>`).join("")}
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-[#334155] mb-1">Linked Land / Lease Plot (Optional)</label>
            <input name="landLabel" list="ffExpenseLandList" value="${escapeHtml(d.landLabel || "")}" placeholder="Own Land or Lease Name" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
            <datalist id="ffExpenseLandList">
              <option value="Own Land"></option>
              ${leases.map((l) => `<option value="${escapeHtml(`${l.landownerName} (${l.village})`)}"></option>`).join("")}
            </datalist>
          </div>

          <div>
            <label class="block text-xs font-bold text-[#334155] mb-1">Attach Bill / Receipt Photo or PDF (Optional)</label>
            <input name="expenseReceiptFile" type="file" accept="image/*,application/pdf" class="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-[#ECFDF5] file:text-[#14532D] file:font-bold" />
          </div>

          <button type="submit" class="gv-btn w-full py-3 rounded-xl bg-gradient-to-r from-[#14532D] to-[#15803D] text-white text-sm font-extrabold shadow-sm">
            Save Farming Expense
          </button>
        </form>
      </section>

      <!-- Expense Ledger & Category Breakdown -->
      <section class="lg:col-span-7 space-y-4">
        <div class="gv-card p-4 sm:p-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-base font-extrabold text-[#14532D]">Recorded Farming Expenses (${filtered.length})</h2>
              <p class="text-xs text-[#475569]">Total shown: <strong class="text-[#14532D]">${escapeHtml(formatInr(totalFiltered))}</strong></p>
            </div>
            <div class="flex flex-wrap gap-2">
              <select id="ffExpenseFilterCat" class="rounded-xl border border-[#D9EAE0] bg-[#F8FAFC] px-3 py-2 text-xs font-bold text-[#14532D]">
                <option value="ALL">All Categories</option>
                ${DEFAULT_EXPENSE_CATEGORIES.map((c) => `<option value="${c.key}" ${filterCat === c.key ? "selected" : ""}>${escapeHtml(c.label)}</option>`).join("")}
                <option value="CUSTOM" ${filterCat === "CUSTOM" ? "selected" : ""}>Custom Categories</option>
              </select>
              <button data-ff-action="export-expenses-csv" type="button" class="px-3 py-2 rounded-xl bg-white border border-[#D9EAE0] text-xs font-extrabold text-[#14532D] hover:bg-[#ECFDF5]">Export CSV</button>
            </div>
          </div>

          ${sortedCats.length > 0 ? `
            <div class="flex flex-wrap gap-1.5">
              ${sortedCats.slice(0, 8).map(([cat, val]) => `
                <span class="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#BBF7D0] text-[11px] font-bold text-[#14532D]">
                  ${escapeHtml(cat)}: ${escapeHtml(formatInr(val))}
                </span>
              `).join("")}
            </div>
          ` : ""}
        </div>

        ${filtered.length === 0 ? `
          <div class="gv-card p-8 text-center space-y-2">
            <div class="text-sm font-extrabold text-[#14532D]">No Expenses Found</div>
            <p class="text-xs text-[#64748B]">Start recording seeds, fertilizers, labour, irrigation, or land rent expenses so your Profit &amp; Loss Calculator stays accurate.</p>
          </div>
        ` : `
          <div class="space-y-2.5">
            ${filtered.map((ex) => {
              const linkedDoc = ex.receiptDocumentId ? documents.find((doc) => doc.id === ex.receiptDocumentId) : null;
              return `
                <div class="gv-card p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                  <div class="space-y-0.5 min-w-0">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span class="px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] text-[10px] font-extrabold">${escapeHtml(ex.category === "CUSTOM" ? (ex.customCategory || "CUSTOM") : ex.category)}</span>
                      <span class="text-xs font-extrabold text-[#0F172A]">${escapeHtml(ex.description)}</span>
                    </div>
                    <div class="text-[11px] text-[#64748B]">
                      ${escapeHtml(ex.expenseDate)} ${ex.cropName ? `• Crop: ${escapeHtml(ex.cropName)}` : ""} ${ex.season ? `• ${escapeHtml(ex.season)}` : ""} ${ex.landLabel ? `• ${escapeHtml(ex.landLabel)}` : ""}
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    ${linkedDoc ? `<button data-ff-view-doc="${escapeHtml(linkedDoc.id)}" type="button" class="px-2 py-1 rounded-lg bg-[#ECFDF5] border border-[#BBF7D0] text-[10px] font-bold text-[#14532D]">📎 Receipt</button>` : ""}
                    <span class="text-sm font-extrabold text-[#14532D]">${escapeHtml(formatInr(ex.amount))}</span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </section>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 2. PROFIT & LOSS CALCULATOR
// ----------------------------------------------------------------------------
export function renderProfitLossSection(state, sales, expenses, leases) {
  const ff = state.farmerFinance || {};
  const filterCrop = ff.pnlCrop || "ALL";
  const filterSeason = ff.pnlSeason || "ALL";
  const filterLand = ff.pnlLand || "ALL";
  const includeLeaseRent = Boolean(ff.pnlIncludeLease);

  const uniqueCrops = Array.from(new Set([
    ...sales.map((s) => s.cropName).filter(Boolean),
    ...expenses.map((e) => e.cropName).filter(Boolean)
  ]));
  const uniqueLands = Array.from(new Set([
    ...sales.map((s) => s.landLabel).filter(Boolean),
    ...expenses.map((e) => e.landLabel).filter(Boolean)
  ]));

  const pnl = computeProfitAndLoss({
    sales,
    expenses,
    leases,
    filterCrop,
    filterSeason,
    filterLand,
    includeLeaseRent
  });

  const renderBreakdownTable = (title, rows) => `
    <div class="gv-card p-4 space-y-2.5">
      <h3 class="text-sm font-extrabold text-[#14532D]">${escapeHtml(title)}</h3>
      ${rows.length === 0 ? `<p class="text-xs text-[#64748B]">No records available yet.</p>` : `
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#ECFDF5] text-[#14532D]">
              <tr>
                <th class="px-3 py-2 font-extrabold">Group</th>
                <th class="px-3 py-2 font-extrabold text-right">Sale Revenue</th>
                <th class="px-3 py-2 font-extrabold text-right">Prod. Cost</th>
                <th class="px-3 py-2 font-extrabold text-right">Est. Profit / Loss</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              ${rows.map((r) => `
                <tr>
                  <td class="px-3 py-2 font-bold text-[#0F172A]">
                    ${escapeHtml(r.label)}
                    ${r.incomplete ? `<span class="ml-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-extrabold">Incomplete Expenses</span>` : ""}
                  </td>
                  <td class="px-3 py-2 text-right font-semibold">${escapeHtml(formatInr(r.revenue))}</td>
                  <td class="px-3 py-2 text-right font-semibold">${escapeHtml(formatInr(r.cost))}</td>
                  <td class="px-3 py-2 text-right font-extrabold ${r.net >= 0 ? "text-[#14532D]" : "text-rose-700"}">${r.net >= 0 ? "+" : ""}${escapeHtml(formatInr(r.net))}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  return `
    <div class="space-y-5">
      <!-- Formula & Filters -->
      <section class="gv-card p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-extrabold text-[#14532D]">Agricultural Profit &amp; Loss Calculator</h2>
            <p class="text-xs text-[#475569]">Formula: <strong>Net Farming Profit/Loss = Total Crop Sale Revenue − Total Production Cost</strong></p>
          </div>
          <button data-ff-action="print-full-pdf" type="button" class="px-3.5 py-2 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">Print P&amp;L PDF Report</button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-[#475569] mb-1">Filter by Crop (ফসল)</label>
            <select id="ffPnlCrop" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white font-semibold">
              <option value="ALL">All Crops</option>
              ${uniqueCrops.map((c) => `<option value="${escapeHtml(c)}" ${filterCrop === c ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-[#475569] mb-1">Filter by Season (মরসুম)</label>
            <select id="ffPnlSeason" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white font-semibold">
              <option value="ALL">All Seasons</option>
              ${FARM_SEASONS.map((s) => `<option value="${s.key}" ${filterSeason === s.key ? "selected" : ""}>${escapeHtml(s.label)}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-[#475569] mb-1">Filter by Land Plot (জমি)</label>
            <select id="ffPnlLand" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white font-semibold">
              <option value="ALL">All Land Plots</option>
              ${uniqueLands.map((l) => `<option value="${escapeHtml(l)}" ${filterLand === l ? "selected" : ""}>${escapeHtml(l)}</option>`).join("")}
            </select>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="rounded-2xl bg-[#ECFDF5] border border-[#BBF7D0] p-4">
            <div class="text-[11px] font-extrabold uppercase text-[#15803D]">Total Agricultural Income (Sales)</div>
            <div class="text-2xl font-extrabold text-[#14532D] mt-1">${escapeHtml(formatInr(pnl.totalRevenue))}</div>
            <div class="text-[11px] text-[#475569] mt-0.5">${pnl.salesCount} sale transactions (net of mandi costs)</div>
          </div>
          <div class="rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] p-4">
            <div class="text-[11px] font-extrabold uppercase text-[#475569]">Total Production Cost</div>
            <div class="text-2xl font-extrabold text-[#0F172A] mt-1">${escapeHtml(formatInr(pnl.totalProductionCost))}</div>
            <div class="text-[11px] text-[#475569] mt-0.5">${pnl.expenseCount} recorded farming expenses</div>
          </div>
          <div class="rounded-2xl ${pnl.netProfitLoss >= 0 ? "bg-gradient-to-br from-[#14532D] to-[#15803D] text-white" : "bg-rose-700 text-white"} p-4 shadow-sm">
            <div class="text-[11px] font-extrabold uppercase opacity-90">Estimated Net Profit / Loss</div>
            <div class="text-2xl font-extrabold mt-1">${pnl.netProfitLoss >= 0 ? "+" : ""}${escapeHtml(formatInr(pnl.netProfitLoss))}</div>
            <div class="text-[11px] opacity-90 mt-0.5">${pnl.netProfitLoss >= 0 ? "Estimated Surplus (লাভ)" : "Estimated Deficit (ক্ষতি)"}</div>
          </div>
        </div>

        <!-- Incomplete Expense Records Warning -->
        ${pnl.incompleteWarnings.length > 0 ? `
          <div class="rounded-2xl bg-amber-50 border border-amber-300 p-3.5 text-xs text-amber-950 space-y-1">
            <div class="font-extrabold">⚠️ Incomplete Expense Records Detected (অসম্পূর্ণ খরচের সতর্কতা)</div>
            ${pnl.incompleteWarnings.map((w) => `<p>• ${escapeHtml(w)}</p>`).join("")}
          </div>
        ` : ""}
      </section>

      <!-- Breakdown Tables -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        ${renderBreakdownTable("Crop-Wise Profit & Loss", pnl.byCrop)}
        ${renderBreakdownTable("Season-Wise Profit & Loss", pnl.bySeason)}
        ${renderBreakdownTable("Land-Wise Profit & Loss", pnl.byLand)}
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 3. GOVERNMENT SCHEMES & FINANCIAL ASSISTANCE
// ----------------------------------------------------------------------------
export function renderSchemesSection(state) {
  const scope = state.farmerFinance?.schemeFilter || "ALL";
  const list = scope === "ALL" ? GOVERNMENT_SCHEMES : GOVERNMENT_SCHEMES.filter((s) => s.scope === scope);

  return `
    <div class="space-y-4">
      <section class="gv-card p-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-extrabold text-[#14532D]">Government Schemes &amp; Financial Assistance</h2>
            <p class="text-xs text-[#475569]">সরকারি কৃষি প্রকল্প, ঋণ ও বীমা সহায়তা — verified official portals for Central &amp; West Bengal schemes</p>
          </div>
          <div class="flex gap-1.5">
            ${[
              ["ALL", "All Schemes"],
              ["CENTRAL", "Central Govt"],
              ["WEST_BENGAL", "West Bengal"]
            ].map(([k, lbl]) => `
              <button data-ff-scheme-filter="${k}" type="button" class="px-3 py-1.5 rounded-xl text-xs font-extrabold border ${scope === k ? "bg-[#14532D] text-white border-[#14532D]" : "bg-[#F8FAFC] text-[#14532D] border-[#D9EAE0]"}">${lbl}</button>
            `).join("")}
          </div>
        </div>

        <div class="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-950">
          <strong>Important Notice:</strong> Guru Ji Vision provides verified official information links only. We do <strong>not</strong> process government applications or promise eligibility, approval, or payment. Always apply only through official government portals, CSC centres, or Block Agriculture Offices (ADA).
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        ${list.map((sc) => `
          <article class="gv-card p-5 flex flex-col justify-between gap-3.5">
            <div class="space-y-2.5">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${sc.scope === "WEST_BENGAL" ? "bg-emerald-100 text-emerald-900" : "bg-[#DCFCE7] text-[#14532D]"}">
                    ${sc.scope === "WEST_BENGAL" ? "West Bengal State Scheme" : "Central Govt Scheme"}
                  </span>
                  <h3 class="text-sm sm:text-base font-extrabold text-[#14532D] mt-1">${escapeHtml(sc.name)}</h3>
                  <div class="text-xs font-semibold text-[#15803D]">${escapeHtml(sc.nameBn)}</div>
                </div>
                <span class="text-[10px] font-bold text-[#64748B] shrink-0">Verified: ${escapeHtml(sc.verifiedDate)}</span>
              </div>

              <p class="text-xs text-[#334155] leading-relaxed"><strong>Purpose:</strong> ${escapeHtml(sc.purpose)}</p>
              <p class="text-xs text-[#475569] leading-relaxed"><strong>Eligibility:</strong> ${escapeHtml(sc.eligibility)}</p>

              <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 space-y-1">
                <div class="text-[11px] font-extrabold text-[#14532D]">Required Documents:</div>
                <ul class="list-disc pl-4 text-xs text-[#475569] space-y-0.5">
                  ${sc.documents.map((doc) => `<li>${escapeHtml(doc)}</li>`).join("")}
                </ul>
              </div>

              <p class="text-xs text-[#475569] leading-relaxed"><strong>Application Process:</strong> ${escapeHtml(sc.applicationProcess)}</p>
            </div>

            <div class="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
              <span class="text-[11px] font-bold text-[#475569]">Helpline: ${escapeHtml(sc.helpline)}</span>
              <a href="${escapeHtml(safeUrl(sc.officialUrl))}" target="_blank" rel="noopener noreferrer" class="gv-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#15803D] text-white text-xs font-extrabold shadow-sm">
                Official Website ↗
              </a>
            </div>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 4. FARMER RIGHTS & COMPLAINT SUPPORT
// ----------------------------------------------------------------------------
export function renderRightsSection(state, complaints, documents) {
  const isSignedIn = Boolean(state.user);
  const uid = state.user?.uid;
  const draft = isSignedIn ? loadFormDraft(uid, "complaint") : null;
  const d = draft?.data || {};
  const today = new Date().toISOString().slice(0, 10);
  const settings = state.appSettings || {};
  const waHelpUrl = buildWhatsAppDirectUrl(
    settings.whatsappNumber,
    "Namaskar Guru Ji Vision Support, I need guidance regarding a Farmer Financial Support / Rights issue."
  );

  return `
    <div class="space-y-5">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Submit Complaint / Issue Form -->
        <section class="lg:col-span-6 gv-card p-5 space-y-4">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h2 class="text-base font-extrabold text-[#14532D]">Record Farmer Rights Issue / Complaint</h2>
              <p class="text-xs text-[#475569]">কৃষক অধিকার ও অভিযোগ নথিভুক্ত করুন (Stored securely with supporting proof)</p>
            </div>
            ${isSignedIn ? `
              <button data-ff-action="save-draft" data-draft-form="ffComplaintForm" data-draft-key="complaint" type="button" class="px-2.5 py-1.5 rounded-lg bg-[#ECFDF5] border border-[#BBF7D0] text-[11px] font-extrabold text-[#14532D]">Save Draft</button>
            ` : ""}
          </div>

          <div class="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-950 leading-relaxed">
            <strong>Honest Support Notice:</strong> Issues logged here are stored securely in your private Guru Ji Vision record so you maintain timestamped evidence. An official government or legal support team is <strong>not directly connected</strong> — stored complaints remain marked as <strong>Submitted (Not Yet Officially Reviewed)</strong>. For urgent legal or official action, use the official portals and toll-free helplines listed alongside.
          </div>

          ${isSignedIn ? `
            <form id="ffComplaintForm" class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Issue Category (সমস্যার ধরন) *</label>
                <select name="category" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white">
                  ${COMPLAINT_CATEGORIES.map((c) => `<option value="${c.key}" ${(d.category || "") === c.key ? "selected" : ""}>${escapeHtml(c.label)}</option>`).join("")}
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-[#334155] mb-1">Relevant Date *</label>
                  <input name="incidentDate" type="date" required value="${escapeHtml(d.incidentDate || today)}" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#334155] mb-1">Contact Preference</label>
                  <select name="contactPreference" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white">
                    <option value="IN_APP_ONLY">In-App Record Only</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="PHONE">Phone Call</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Contact Number / Email (Optional)</label>
                <input name="contactValue" value="${escapeHtml(d.contactValue || state.userProfile?.phoneNumber || state.user?.email || "")}" placeholder="Phone or email for follow-up" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
              </div>

              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Detailed Description (সমস্যার বিস্তারিত বিবরণ) *</label>
                <textarea name="description" rows="4" required minlength="10" placeholder="Include dates, names, amounts, and what happened clearly..." class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-sm bg-white">${escapeHtml(d.description || "")}</textarea>
              </div>

              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Attach Supporting Document / Photo (Optional)</label>
                <input name="complaintFile" type="file" accept="image/*,application/pdf" class="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-[#ECFDF5] file:text-[#14532D] file:font-bold" />
              </div>

              <button type="submit" class="gv-btn w-full py-3 rounded-xl bg-gradient-to-r from-[#14532D] to-[#15803D] text-white text-sm font-extrabold shadow-sm">
                Submit &amp; Store Issue Record
              </button>
            </form>
          ` : `
            <div class="rounded-2xl bg-[#ECFDF5] border border-[#BBF7D0] p-4 text-center space-y-2.5">
              <p class="text-xs text-[#14532D] font-bold">Sign in with Google to save private complaint records and attach supporting photos/PDFs.</p>
              <button data-action="open-auth" type="button" class="px-5 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">Continue with Google</button>
            </div>
          `}
        </section>

        <!-- Official Grievance Helplines & WhatsApp Support -->
        <section class="lg:col-span-6 space-y-3.5">
          <div class="gv-card p-5 space-y-3">
            <h2 class="text-base font-extrabold text-[#14532D]">Official Government Grievance &amp; Legal Aid Contacts</h2>
            <p class="text-xs text-[#475569]">Direct official helplines for crop insurance, bank/loan disputes, free legal aid, and agricultural schemes.</p>
            <div class="space-y-2.5">
              ${OFFICIAL_GRIEVANCE_CONTACTS.map((c) => `
                <div class="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div class="min-w-0 max-w-md">
                    <div class="text-xs font-extrabold text-[#14532D]">${escapeHtml(c.title)} <span class="text-[#15803D] font-semibold">(${escapeHtml(c.titleBn)})</span></div>
                    <p class="text-[11px] text-[#475569] mt-0.5">${escapeHtml(c.desc)}</p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="px-2.5 py-1 rounded-lg bg-[#DCFCE7] text-[#14532D] text-[11px] font-extrabold">${escapeHtml(c.contact)}</span>
                    <a href="${escapeHtml(safeUrl(c.url))}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg bg-[#14532D] text-white text-[11px] font-extrabold">Open ↗</a>
                  </div>
                </div>
              `).join("")}
            </div>

            ${waHelpUrl ? `
              <div class="pt-2 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                <span class="text-xs font-bold text-[#14532D]">Need guidance using these financial tools?</span>
                <a href="${escapeHtml(waHelpUrl)}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-extrabold">
                  WhatsApp Support Desk ↗
                </a>
              </div>
            ` : ""}
          </div>

          <!-- Submitted Complaints List -->
          ${isSignedIn ? `
            <div class="gv-card p-5 space-y-3">
              <h3 class="text-sm font-extrabold text-[#14532D]">My Stored Complaint Records (${complaints.length})</h3>
              ${complaints.length === 0 ? `<p class="text-xs text-[#64748B]">No issues recorded yet.</p>` : complaints.map((cmp) => {
                const stMeta = COMPLAINT_STATUSES.find((s) => s.key === cmp.status) || COMPLAINT_STATUSES[0];
                const catMeta = COMPLAINT_CATEGORIES.find((c) => c.key === cmp.category);
                const linkedDocs = documents.filter((doc) => doc.relatedEntityId === cmp.id || (cmp.supportingDocumentIds || []).includes(doc.id));
                return `
                  <div class="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 space-y-2">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <span class="text-xs font-extrabold text-[#14532D]">${escapeHtml(catMeta ? catMeta.label : cmp.category)}</span>
                      <span class="px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${stMeta.badge}">${escapeHtml(stMeta.label)}</span>
                    </div>
                    <p class="text-xs text-[#334155] leading-relaxed">${escapeHtml(cmp.description)}</p>
                    <div class="text-[11px] text-[#64748B]">Incident Date: ${escapeHtml(cmp.incidentDate || "—")} • Pref: ${escapeHtml(cmp.contactPreference || "IN_APP_ONLY")}</div>
                    <div class="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[10px] font-semibold text-amber-950">
                      ${escapeHtml(cmp.supportNote || cmp.reviewDisclaimer || "Stored securely in your record; not yet reviewed by an official support team.")}
                    </div>
                    ${linkedDocs.length ? `
                      <div class="flex flex-wrap gap-1.5">
                        ${linkedDocs.map((doc) => `<button data-ff-view-doc="${escapeHtml(doc.id)}" type="button" class="px-2 py-1 rounded-lg bg-[#ECFDF5] border border-[#BBF7D0] text-[10px] font-bold text-[#14532D]">📎 ${escapeHtml(doc.title)}</button>`).join("")}
                      </div>
                    ` : ""}
                  </div>
                `;
              }).join("")}
            </div>
          ` : ""}
        </section>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 5. FINANCIAL REPORTS, DOCUMENT MANAGEMENT VAULT & AUDIT TRAIL
// ----------------------------------------------------------------------------
export function renderReportsDocumentsSection(state, leases, loans, loanTx, sales, expenses, complaints, documents, auditLogs) {
  const ff = state.farmerFinance || {};
  const q = String(ff.docSearch || "").trim().toLowerCase();
  const dateFrom = ff.reportDateFrom || "";
  const dateTo = ff.reportDateTo || "";
  const today = new Date().toISOString().slice(0, 10);

  const filteredDocs = documents.filter((doc) => {
    if (q) {
      const hay = `${doc.title || ""} ${doc.docType || ""} ${doc.fileName || ""} ${doc.notes || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (dateFrom && doc.docDate && doc.docDate < dateFrom) return false;
    if (dateTo && doc.docDate && doc.docDate > dateTo) return false;
    return true;
  });

  return `
    <div class="space-y-5">
      <!-- Reports & Exports Center -->
      <section class="gv-card p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-extrabold text-[#14532D]">Download Financial Reports (PDF &amp; CSV)</h2>
            <p class="text-xs text-[#475569]">Filter by date range, print a formatted PDF summary, or export clean CSV spreadsheets.</p>
          </div>
          <div class="flex flex-wrap gap-2 items-center">
            <input id="ffReportDateFrom" type="date" value="${escapeHtml(dateFrom)}" class="rounded-xl border border-[#CBD5E1] px-2.5 py-1.5 text-xs bg-white" title="From Date" />
            <span class="text-xs text-[#64748B] font-bold">to</span>
            <input id="ffReportDateTo" type="date" value="${escapeHtml(dateTo)}" class="rounded-xl border border-[#CBD5E1] px-2.5 py-1.5 text-xs bg-white" title="To Date" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button data-ff-action="print-full-pdf" type="button" class="gv-btn p-3.5 rounded-2xl bg-gradient-to-r from-[#14532D] to-[#15803D] text-white text-left">
            <div class="text-xs font-extrabold">Complete Financial PDF</div>
            <div class="text-[11px] text-[#DCFCE7] mt-0.5">Leases, Loans, Sales, Expenses &amp; P&amp;L</div>
          </button>
          <button data-ff-action="print-lease-pdf" type="button" class="gv-btn p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-left hover:bg-[#DCFCE7]">
            <div class="text-xs font-extrabold">Land Lease Summary PDF</div>
            <div class="text-[11px] text-[#15803D] mt-0.5">${leases.length} lease agreements</div>
          </button>
          <button data-ff-action="export-all-csv" type="button" class="gv-btn p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] text-left hover:bg-[#DCFCE7]">
            <div class="text-xs font-extrabold">Export All Ledgers (CSV)</div>
            <div class="text-[11px] text-[#15803D] mt-0.5">Leases, Loans, Sales &amp; Expenses</div>
          </button>
          <button data-ff-action="export-audit-csv" type="button" class="gv-btn p-3.5 rounded-2xl bg-white border border-[#D9EAE0] text-[#14532D] text-left hover:bg-[#ECFDF5]">
            <div class="text-xs font-extrabold">Export Audit Trail CSV</div>
            <div class="text-[11px] text-[#475569] mt-0.5">${auditLogs.length} immutable change logs</div>
          </button>
        </div>
      </section>

      <!-- Document Upload & Private Vault -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section class="lg:col-span-5 gv-card p-5 space-y-4">
          <div>
            <h3 class="text-base font-extrabold text-[#14532D]">Upload Financial Document / Receipt</h3>
            <p class="text-xs text-[#475569]">Store lease PDFs, loan passbooks, payment receipts &amp; crop sale bills privately (owner-only).</p>
          </div>
          <form id="ffUploadDocForm" class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-[#334155] mb-1">Document Title *</label>
              <input name="title" required placeholder="e.g. Boro Lease Agreement 2026 / KCC Passbook" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Document Type</label>
                <select name="docType" class="w-full rounded-xl border border-[#CBD5E1] px-2.5 py-2 text-xs bg-white">
                  ${DOCUMENT_TYPES.map((t) => `<option value="${t.key}">${escapeHtml(t.label)}</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Document Date</label>
                <input name="docDate" type="date" value="${today}" class="w-full rounded-xl border border-[#CBD5E1] px-2.5 py-2 text-xs bg-white" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-[#334155] mb-1">Notes (Optional)</label>
              <input name="notes" placeholder="Receipt number, witness name, or remark" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
            </div>
            <div>
              <label class="block text-xs font-bold text-[#334155] mb-1">Choose Photo or PDF (Max 5 MB) *</label>
              <input name="docFile" type="file" required accept="image/*,application/pdf" class="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-[#ECFDF5] file:text-[#14532D] file:font-bold" />
            </div>
            <button type="submit" class="gv-btn w-full py-3 rounded-xl bg-gradient-to-r from-[#14532D] to-[#15803D] text-white text-sm font-extrabold shadow-sm">
              Upload to Private Vault
            </button>
          </form>
        </section>

        <section class="lg:col-span-7 space-y-4">
          <div class="gv-card p-5 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-sm sm:text-base font-extrabold text-[#14532D]">Private Document Vault (${filteredDocs.length})</h3>
              <input id="ffDocSearch" type="search" value="${escapeHtml(ff.docSearch || "")}" placeholder="Search title, type, note..." class="rounded-xl border border-[#CBD5E1] px-3 py-1.5 text-xs bg-white w-48 sm:w-56" />
            </div>
            ${filteredDocs.length === 0 ? `
              <p class="text-xs text-[#64748B] py-4 text-center">No uploaded documents match your filter yet.</p>
            ` : `
              <div class="space-y-2">
                ${filteredDocs.map((doc) => `
                  <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 flex flex-wrap items-center justify-between gap-2">
                    <div class="min-w-0">
                      <div class="text-xs font-extrabold text-[#0F172A] truncate">${escapeHtml(doc.title)}</div>
                      <div class="text-[11px] text-[#64748B]">
                        ${escapeHtml(doc.docType)} • ${escapeHtml(doc.docDate || "")} • ${Math.max(1, Math.round((doc.fileSizeBytes || 0) / 1024))} KB • User Upload (Not Legally Verified)
                      </div>
                    </div>
                    <button data-ff-view-doc="${escapeHtml(doc.id)}" type="button" class="px-3 py-1.5 rounded-lg bg-[#14532D] text-white text-xs font-extrabold shrink-0">View / Open</button>
                  </div>
                `).join("")}
              </div>
            `}
          </div>

          <!-- Immutable Financial Audit Trail -->
          <div class="gv-card p-5 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-sm font-extrabold text-[#14532D]">Immutable Financial Audit Trail (${auditLogs.length})</h3>
              <span class="text-[10px] font-bold text-[#15803D] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full">Append-Only History</span>
            </div>
            ${auditLogs.length === 0 ? `
              <p class="text-xs text-[#64748B]">Changes to your leases, loans, repayments, sales, expenses, and documents are logged automatically here.</p>
            ` : `
              <div class="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                ${auditLogs.slice(0, 25).map((log) => `
                  <div class="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span class="px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#14532D] text-[10px] font-extrabold mr-1.5">${escapeHtml(log.action)}</span>
                      <span class="text-[#334155]">${escapeHtml(log.summary)}</span>
                    </div>
                    <span class="text-[10px] text-[#64748B] shrink-0">${escapeHtml(formatDateShort(log.createdAtMs))}</span>
                  </div>
                `).join("")}
              </div>
            `}
          </div>
        </section>
      </div>
    </div>
  `;
}
