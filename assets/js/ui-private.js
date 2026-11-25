// ============================================================================
// Guru Ji Vision — Private & Interactive Module Renderers
// 1. Strictly Private Student Money Manager & Farmer Personal Farm Ledger
//    (Owner-Only, Cloud-Synced Opening Balance, ZERO Admin Approval, Edit/Delete)
// 2. Meeting Zone (Upcoming/Past 60m grace + Google Meet + Host CRUD)
// 3. Student Career Guidance (Renamed from Doubt Zone — Students -> Professors)
// 4. Farmer Advisor Expert (Dedicated Farmer -> Agricultural Expert Service)
// 5. Professor Dashboard (Assigned Student & Farmer Consultations + Email Status)
// ============================================================================

import {
  CAREER_GUIDANCE_TOPICS,
  FARMER_ADVISOR_TOPICS,
  FARMER_EXPENSE_CATEGORIES,
  FARMER_INCOME_CATEGORIES,
  MONEY_EXPENSE_CATEGORIES,
  MONEY_INCOME_CATEGORIES
} from "./config.js";
import {
  escapeHtml,
  formatDateShort,
  formatInr,
  formatTimeShort,
  isUpcomingMeeting,
  safeUrl
} from "./calculators.js";

function renderEmailStatusBadge(status, errorText = "") {
  if (!status) return "";
  const map = {
    SENT: { cls: "bg-emerald-100 text-emerald-900", label: "✓ Email Sent" },
    PENDING: { cls: "bg-sky-100 text-sky-900", label: "⏳ Email Sending" },
    FAILED: { cls: "bg-rose-100 text-rose-800", label: "⚠️ Email Failed" },
    NOT_CONFIGURED: { cls: "bg-amber-100 text-amber-900", label: "ℹ️ Saved In-App (Email Pending Setup)" }
  };
  const meta = map[status] || map.PENDING;
  return `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${meta.cls}" title="${escapeHtml(errorText || meta.label)}">${meta.label}</span>`;
}

// ----------------------------------------------------------------------------
// 1. STRICTLY PRIVATE MONEY MANAGER (STUDENT LEDGER + FARMER FARM LEDGER)
// ----------------------------------------------------------------------------
export function renderMoneyManagerView(state) {
  if (!state.user) {
    return `
      <div class="max-w-lg mx-auto gv-card p-6 sm:p-8 text-center space-y-4 animate-fade-up">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-[#D8F3DC] text-[#14532D] flex items-center justify-center text-2xl">🔒</div>
        <h2 class="font-display text-2xl font-bold text-[#14532D]">Private Money &amp; Farm Account Manager</h2>
        <p class="text-sm text-[#496052] leading-relaxed">
          Manage your <strong>Student Money Manager (ছাত্র হিসাব)</strong> or <strong>Farmer Personal Farm Ledger (কৃষি আয়-ব্যয়)</strong> with <strong>100% privacy and ZERO Admin approval</strong>.
          Only your own authenticated account can view, add, edit, or delete your Opening Balance, Income, Expenses, and Goals. Even Admins and Professors cannot see your financial records.
        </p>
        <button data-action="open-auth" class="w-full py-3 rounded-2xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">
          Sign In to Open Your Private Ledger
        </button>
      </div>
    `;
  }

  const scope = state.moneyLedgerScope || (state.userProfile?.role === "FARMER" ? "FARMER" : "STUDENT");
  const isFarmerLedger = scope === "FARMER";

  const allTxs = state.moneyTransactions || [];
  const scopedTxs = allTxs.filter((t) => {
    const txScope = t.ledgerScope || "STUDENT";
    return txScope === scope;
  });

  const goals = state.moneyBudgets || [];
  const openingBalance = Number(state.openingBalance) || 0;
  const totalIncome = scopedTxs.filter((t) => t.type === "INCOME").reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalExpense = scopedTxs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const netBalance = openingBalance + totalIncome - totalExpense;

  const filterMode = state.moneyFilter || "ALL";
  const visibleTxs = scopedTxs.filter((t) => {
    if (filterMode === "INCOME") return t.type === "INCOME";
    if (filterMode === "EXPENSE") return t.type === "EXPENSE";
    if (filterMode === "SHARED") return t.category === "SHARED" || Boolean(t.sharedWith) || Boolean(t.cropTag);
    return true;
  });

  const allCats = [
    ...MONEY_EXPENSE_CATEGORIES,
    ...MONEY_INCOME_CATEGORIES,
    ...FARMER_EXPENSE_CATEGORIES,
    ...FARMER_INCOME_CATEGORIES
  ];

  // Expense category breakdown
  const catTotals = {};
  scopedTxs.filter((t) => t.type === "EXPENSE").forEach((t) => {
    catTotals[t.category] = (catTotals[t.category] || 0) + (Number(t.amount) || 0);
  });
  const catRows = Object.entries(catTotals)
    .map(([k, v]) => ({
      key: k,
      label: allCats.find((c) => c.id === k)?.labelEn || k,
      amount: v,
      pct: totalExpense > 0 ? Math.round((v * 100) / totalExpense) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  // Monthly report summary
  const monthMap = {};
  scopedTxs.forEach((t) => {
    const mk = String(t.dateLabel || "").length >= 7 ? String(t.dateLabel).slice(0, 7) : "Current";
    if (!monthMap[mk]) monthMap[mk] = { month: mk, income: 0, expense: 0 };
    if (t.type === "INCOME") monthMap[mk].income += Number(t.amount) || 0;
    else monthMap[mk].expense += Number(t.amount) || 0;
  });
  const monthlyRows = Object.values(monthMap).sort((a, b) => b.month.localeCompare(a.month));

  const txType = state.moneyFormType || "EXPENSE";
  const catsForForm = isFarmerLedger
    ? (txType === "INCOME" ? FARMER_INCOME_CATEGORIES : FARMER_EXPENSE_CATEGORIES)
    : (txType === "INCOME" ? MONEY_INCOME_CATEGORIES : MONEY_EXPENSE_CATEGORIES);

  return `
    <div class="space-y-5 animate-fade-up">
      <!-- Privacy Header + Student / Farmer Ledger Switcher -->
      <div class="gv-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#14532D] text-[11px] font-extrabold mb-1">
            🔒 100% Owner-Only • Direct Save (No Admin Approval Needed • Hidden from Admin &amp; Professors)
          </div>
          <h2 class="font-display text-xl sm:text-2xl font-bold text-[#14532D]">
            ${isFarmerLedger ? "Farmer Personal Farm Ledger (কৃষি আয়-ব্যয়)" : "Student Money Manager (ছাত্র আয়-ব্যয় হিসাব)"}
          </h2>
          <p class="text-xs text-[#496052]">Formula: Net Balance = Opening Balance + Total Income − Total Expenses • Instant Cloud Sync</p>
        </div>

        <div class="flex flex-wrap items-center gap-2 no-print">
          <div class="flex gap-1 bg-[#EDF4EE] p-1 rounded-xl">
            <button type="button" data-money-scope="STUDENT" class="px-3 py-2 rounded-lg text-xs font-extrabold ${!isFarmerLedger ? "bg-[#14532D] text-white shadow-sm" : "text-[#14532D]"}">
              🎓 Student Ledger
            </button>
            <button type="button" data-money-scope="FARMER" class="px-3 py-2 rounded-lg text-xs font-extrabold ${isFarmerLedger ? "bg-[#14532D] text-white shadow-sm" : "text-[#14532D]"}">
              🌾 Farmer Ledger (কৃষি)
            </button>
          </div>
          <button data-action="export-money-pdf" class="px-3.5 py-2.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-extrabold">
            📄 Print / PDF
          </button>
        </div>
      </div>

      <!-- KPI Cards + Cloud-Synced Opening Balance Control -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="gv-card p-4">
          <div class="text-[11px] font-bold uppercase text-[#496052]">Opening Balance</div>
          <div class="text-lg sm:text-xl font-extrabold text-[#132219] mt-1">${formatInr(openingBalance)}</div>
          <div class="flex gap-1.5 mt-2 no-print">
            <input id="openingBalanceInput" type="number" min="0" step="100" value="${openingBalance}" class="w-full px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs font-bold" />
            <button data-action="save-opening-balance" type="button" class="px-3 py-1.5 rounded-lg bg-[#14532D] hover:bg-[#0C3B20] text-white text-[11px] font-bold">Save</button>
          </div>
        </div>
        <div class="gv-card p-4">
          <div class="text-[11px] font-bold uppercase text-emerald-700">${isFarmerLedger ? "Total Farm Income / আয়" : "Total Income"}</div>
          <div class="text-lg sm:text-xl font-extrabold text-emerald-800 mt-1">${formatInr(totalIncome)}</div>
          <div class="text-[11px] text-[#496052] mt-1">${isFarmerLedger ? "Crop sales, dairy &amp; subsidy" : "Allowance, scholarship &amp; work"}</div>
        </div>
        <div class="gv-card p-4">
          <div class="text-[11px] font-bold uppercase text-rose-700">${isFarmerLedger ? "Total Farm Cost / খরচ" : "Total Expenses"}</div>
          <div class="text-lg sm:text-xl font-extrabold text-rose-700 mt-1">${formatInr(totalExpense)}</div>
          <div class="text-[11px] text-[#496052] mt-1">${isFarmerLedger ? "Seeds, fertilizer, labour &amp; water" : "Mess, rent, books &amp; daily"}</div>
        </div>
        <div class="rounded-3xl bg-gradient-to-br from-[#14532D] to-[#1E7E45] text-white p-4 shadow-sm">
          <div class="text-[11px] font-bold uppercase text-emerald-100">${isFarmerLedger ? "Net Farm Balance" : "Net Balance"}</div>
          <div class="text-xl sm:text-2xl font-extrabold mt-1">${formatInr(netBalance)}</div>
          <div class="text-[11px] text-emerald-100 mt-1">${netBalance >= 0 ? "Positive balance" : "Over budget"}</div>
        </div>
      </div>

      <!-- Main Grid: Add/Edit Transaction + History -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <form id="moneyTxForm" class="lg:col-span-5 gv-card p-5 space-y-3 h-fit no-print">
          <div class="flex items-center justify-between">
            <h3 id="moneyTxFormHeading" class="text-base font-extrabold text-[#14532D]">
              ${isFarmerLedger ? "Add Farm Income / Expense" : "Add Income / Expense"}
            </h3>
            <button id="cancelMoneyEditBtn" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
          </div>
          <input id="moneyEditId" type="hidden" value="" />

          <div class="grid grid-cols-2 gap-2">
            <button type="button" data-money-type="EXPENSE" class="py-2.5 rounded-xl text-xs font-extrabold border ${
              txType === "EXPENSE" ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-700 border-[#CDE0D3]"
            }">- Expense / খরচ</button>
            <button type="button" data-money-type="INCOME" class="py-2.5 rounded-xl text-xs font-extrabold border ${
              txType === "INCOME" ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-slate-700 border-[#CDE0D3]"
            }">+ Income / আয়</button>
          </div>

          <label class="block">
            <span class="text-xs font-bold">Title / বিবরণ *</span>
            <input id="moneyTitle" type="text" required maxlength="100" placeholder="${isFarmerLedger ? "e.g. DAP 2 Bags, Paddy Harvest Sale" : "e.g. Hostel Mess Bill, Home Transfer"}" class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
          </label>

          <div class="grid grid-cols-2 gap-2.5">
            <label class="block">
              <span class="text-xs font-bold">Amount (₹) *</span>
              <input id="moneyAmount" type="number" required min="1" step="0.01" placeholder="500" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-bold" />
            </label>
            <label class="block">
              <span class="text-xs font-bold">Date *</span>
              <input id="moneyDate" type="date" required value="${new Date().toISOString().slice(0, 10)}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
            </label>
          </div>

          <label class="block">
            <span class="text-xs font-bold">Category</span>
            <select id="moneyCategory" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm">
              ${catsForForm.map((c) => `<option value="${c.id}">${escapeHtml(c.labelEn)} (${escapeHtml(c.labelBn)})</option>`).join("")}
            </select>
          </label>

          ${isFarmerLedger ? `
            <label class="block">
              <span class="text-xs font-bold">Crop / Season Tag (Optional / ফসলের নাম)</span>
              <input id="moneyCropTag" type="text" maxlength="60" placeholder="e.g. Aman Paddy, Rabi Potato, Mustard" class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
            </label>
            <input id="moneySharedWith" type="hidden" value="" />
          ` : `
            <label class="block">
              <span class="text-xs font-bold">Shared / Mess Roommate Ledger (Optional)</span>
              <input id="moneySharedWith" type="text" maxlength="100" placeholder="e.g. Split with Rahul &amp; Sourav" class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
            </label>
            <input id="moneyCropTag" type="hidden" value="" />
          `}

          <label class="block">
            <span class="text-xs font-bold">Note (Optional)</span>
            <input id="moneyNote" type="text" maxlength="300" placeholder="Additional details..." class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
          </label>

          <button type="submit" class="w-full py-3 rounded-2xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">Save Private Entry</button>
        </form>

        <!-- Transaction Ledger -->
        <div class="lg:col-span-7 gv-card p-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-base font-extrabold text-[#14532D]">Transaction History (${visibleTxs.length})</h3>
            <div class="flex flex-wrap gap-1.5 no-print">
              ${[["ALL", "All"], ["EXPENSE", "Expenses"], ["INCOME", "Income"], ["SHARED", isFarmerLedger ? "By Crop" : "Mess/Shared"]].map(([k, l]) => `
                <button type="button" data-money-filter="${k}" class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${
                  filterMode === k ? "bg-[#14532D] text-white" : "bg-[#EDF4EE] text-[#14532D]"
                }">${l}</button>
              `).join("")}
            </div>
          </div>

          ${visibleTxs.length === 0 ? `
            <p class="text-sm text-[#496052] py-6 text-center">No entries in your ${isFarmerLedger ? "Farmer" : "Student"} ledger yet. Add your first income or expense on the left.</p>
          ` : `
            <div class="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              ${visibleTxs.map((tx) => {
                const isInc = tx.type === "INCOME";
                const catLabel = allCats.find((c) => c.id === tx.category)?.labelEn || tx.category;
                return `
                  <div class="rounded-2xl border border-[#CDE0D3] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#F7F9F5]">
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-1.5">
                        <span class="font-bold text-sm text-[#132219] break-words">${escapeHtml(tx.title)}</span>
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-[#CDE0D3] text-[#496052]">${escapeHtml(catLabel)}</span>
                        ${tx.cropTag ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900">🌱 ${escapeHtml(tx.cropTag)}</span>` : ""}
                      </div>
                      <div class="text-[11px] text-[#496052] mt-0.5">
                        ${escapeHtml(tx.dateLabel)}${tx.sharedWith ? ` • 🤝 ${escapeHtml(tx.sharedWith)}` : ""}${tx.note ? ` • ${escapeHtml(tx.note)}` : ""}
                      </div>
                    </div>
                    <div class="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      <span class="text-sm font-extrabold ${isInc ? "text-emerald-700" : "text-rose-700"}">${isInc ? "+" : "-"}${formatInr(tx.amount)}</span>
                      <div class="flex gap-1 no-print">
                        <button type="button" data-edit-tx="${escapeHtml(tx.id)}" class="px-2.5 py-1.5 rounded-lg bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-[11px] font-bold">Edit</button>
                        <button type="button" data-del-tx="${escapeHtml(tx.id)}" class="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold">Delete</button>
                      </div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          `}
        </div>
      </div>

      <!-- Charts, Monthly Report & Savings Goals -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="gv-card p-5 space-y-4">
          <h3 class="text-base font-extrabold text-[#14532D]">Spending Breakdown &amp; Monthly Report</h3>
          ${catRows.length === 0 ? `<p class="text-xs text-[#496052]">Add expenses to see visual category breakdown.</p>` : `
            <div class="space-y-2.5">
              ${catRows.map((row) => `
                <div class="space-y-1">
                  <div class="flex justify-between text-xs font-bold">
                    <span>${escapeHtml(row.label)}</span>
                    <span>${formatInr(row.amount)} (${row.pct}%)</span>
                  </div>
                  <div class="w-full h-2.5 rounded-full bg-[#EDF4EE] overflow-hidden">
                    <div class="h-full rounded-full bg-[#1E7E45]" style="width:${Math.max(4, row.pct)}%"></div>
                  </div>
                </div>
              `).join("")}
            </div>
          `}

          ${monthlyRows.length > 0 ? `
            <div class="pt-3 border-t border-emerald-100">
              <div class="text-xs font-extrabold text-[#14532D] mb-2">Monthly Summary</div>
              <div class="overflow-x-auto">
                <table class="w-full text-xs text-left">
                  <thead class="text-[#496052] border-b border-[#CDE0D3]">
                    <tr><th class="py-1.5">Month</th><th class="py-1.5">Income</th><th class="py-1.5">Expense</th><th class="py-1.5">Net</th></tr>
                  </thead>
                  <tbody>
                    ${monthlyRows.map((m) => `
                      <tr class="border-b border-emerald-50">
                        <td class="py-2 font-bold">${escapeHtml(m.month)}</td>
                        <td class="py-2 text-emerald-700 font-semibold">${formatInr(m.income)}</td>
                        <td class="py-2 text-rose-700 font-semibold">${formatInr(m.expense)}</td>
                        <td class="py-2 font-extrabold">${formatInr(m.income - m.expense)}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ""}
        </div>

        <!-- Monthly Budgets & Savings Goals (Full Add / Edit / Delete) -->
        <div class="gv-card p-5 space-y-4">
          <div class="flex items-center justify-between gap-2">
            <h3 id="goalFormHeading" class="text-base font-extrabold text-[#14532D]">Monthly Budgets &amp; Savings Goals</h3>
            <button id="cancelGoalEditBtn" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
          </div>
          <form id="moneyGoalForm" class="grid grid-cols-2 gap-2.5 no-print">
            <input id="goalEditId" type="hidden" value="" />
            <input id="goalName" type="text" required maxlength="80" placeholder="Goal / Budget Name (e.g. Seed Budget, Exam Fee)" class="col-span-2 px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-xs" />
            <select id="goalKind" class="px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
              <option value="MONTHLY_BUDGET">Monthly Budget Limit</option>
              <option value="SAVINGS_GOAL">Savings Goal</option>
            </select>
            <input id="goalMonth" type="month" value="${new Date().toISOString().slice(0, 7)}" class="px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-xs" />
            <input id="goalTarget" type="number" required min="1" placeholder="Target ₹" class="px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-xs font-bold" />
            <input id="goalSaved" type="number" min="0" value="0" placeholder="Saved / Used ₹" class="px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-xs font-bold" />
            <button type="submit" class="col-span-2 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">Save Budget / Goal</button>
          </form>

          <div class="space-y-2.5">
            ${goals.length === 0 ? `<p class="text-xs text-[#496052]">No monthly budgets or savings goals yet.</p>` : goals.map((g) => {
              const pct = Math.min(100, Math.round(((Number(g.savedAmount) || 0) * 100) / Math.max(1, Number(g.targetAmount) || 1)));
              return `
                <div class="rounded-2xl bg-[#F7F9F5] border border-[#CDE0D3] p-3.5 space-y-1.5">
                  <div class="flex items-center justify-between gap-2">
                    <div class="min-w-0">
                      <span class="font-bold text-xs text-[#132219]">${escapeHtml(g.name)}</span>
                      <span class="ml-1.5 px-2 py-0.5 rounded bg-emerald-100 text-[#14532D] text-[10px] font-bold">${g.kind === "SAVINGS_GOAL" ? "Savings" : "Budget"} • ${escapeHtml(g.monthKey)}</span>
                    </div>
                    <div class="flex gap-1.5 no-print shrink-0">
                      <button type="button" data-edit-goal="${escapeHtml(g.id)}" class="px-2 py-1 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-bold">Edit</button>
                      <button type="button" data-del-goal="${escapeHtml(g.id)}" class="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold">Delete</button>
                    </div>
                  </div>
                  <div class="flex justify-between text-[11px] font-bold text-[#496052]">
                    <span>${formatInr(g.savedAmount)} of ${formatInr(g.targetAmount)}</span>
                    <span>${pct}%</span>
                  </div>
                  <div class="w-full h-2 rounded-full bg-[#EDF4EE] overflow-hidden">
                    <div class="h-full rounded-full ${g.kind === "SAVINGS_GOAL" ? "bg-emerald-600" : "bg-amber-500"}" style="width:${pct}%"></div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 2. MEETING ZONE (Upcoming vs Past Google Meet Sessions)
// ----------------------------------------------------------------------------
export function renderMeetingZoneView(state) {
  const canHost = state.isAdmin || state.facultyIdentity?.canHostMeetings;
  const now = Date.now();
  const visible = state.meetings.filter((m) => m.published !== false || canHost);
  const upcoming = visible.filter((m) => isUpcomingMeeting(m, now));
  const past = visible.filter((m) => !isUpcomingMeeting(m, now)).reverse();

  return `
    <div class="space-y-5 animate-fade-up">
      <div class="gv-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="font-display text-xl sm:text-2xl font-bold text-[#14532D]">Meeting Zone (Google Meet)</h2>
          <p class="text-xs sm:text-sm text-[#496052]">Join live online lectures, career counseling classes, and faculty mentoring sessions.</p>
        </div>
        ${!state.user ? `<button data-action="open-auth" class="px-4 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">Sign In for Host Tools</button>` : ""}
      </div>

      ${canHost ? `
        <form id="meetingForm" class="gv-card p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h3 id="meetingFormHeading" class="text-base font-extrabold text-[#14532D]">Schedule Google Meet Session (Host Controls)</h3>
            <button id="cancelMeetingEditBtn" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
          </div>
          <input id="meetingEditId" type="hidden" value="" />
          <p class="text-[11px] text-[#496052] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2">
            Create your live room on <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" class="font-extrabold text-[#14532D] underline">meet.google.com ↗</a> and paste the official <code>https://meet.google.com/...</code> link below. (Automatic Google Calendar/Meet room provisioning is not connected.)
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input id="meetTitle" type="text" required minlength="2" maxlength="150" placeholder="Meeting Title *" class="px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
            <input id="meetSubject" type="text" required minlength="2" maxlength="80" placeholder="Subject / Topic *" class="px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
            <input id="meetUrl" type="url" required placeholder="https://meet.google.com/xxx-xxxx-xxx *" class="sm:col-span-2 px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
            <input id="meetDate" type="date" required value="${new Date().toISOString().slice(0, 10)}" class="px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
            <input id="meetTime" type="text" required value="06:00 PM" placeholder="06:00 PM" class="px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
            <textarea id="meetDesc" rows="2" maxlength="1000" placeholder="Agenda / Instructions..." class="sm:col-span-2 px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm"></textarea>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <label class="flex items-center gap-2 text-xs font-bold text-[#132219]">
              <input id="meetNotify" type="checkbox" checked class="accent-[#14532D]" /> Publish notice to Students
            </label>
            <button type="submit" class="px-5 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">Save &amp; Publish Meeting</button>
          </div>
        </form>
      ` : ""}

      <div class="space-y-3">
        <h3 class="text-base font-extrabold text-[#14532D] px-1">Upcoming &amp; Live Sessions (${upcoming.length})</h3>
        ${upcoming.length === 0 ? `
          <div class="gv-card p-6 text-center text-sm text-[#496052]">No upcoming Google Meet sessions scheduled right now.</div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${upcoming.map((m) => renderMeetingCard(m, canHost, state.user?.uid, state.isSuperAdmin, true)).join("")}
          </div>
        `}
      </div>

      ${past.length > 0 ? `
        <div class="space-y-3">
          <h3 class="text-sm font-extrabold text-[#496052] px-1">Past Sessions (${past.length})</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 opacity-80">
            ${past.slice(0, 8).map((m) => renderMeetingCard(m, canHost, state.user?.uid, state.isSuperAdmin, false)).join("")}
          </div>
        </div>
      ` : ""}
    </div>
  `;
}

function renderMeetingCard(m, canHost, uid, isSuperAdmin, isUpcoming) {
  const url = safeUrl(m.meetUrl);
  const canManage = canHost && (isSuperAdmin || m.hostUid === uid);
  return `
    <article class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-3">
      <div class="space-y-1.5">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${isUpcoming ? "bg-emerald-100 text-[#14532D]" : "bg-slate-100 text-slate-600"}">
            ${isUpcoming ? "● Upcoming / Live" : "Completed"} • ${escapeHtml(m.subject)}
          </span>
          <span class="text-xs font-bold text-[#1E7E45]">📅 ${escapeHtml(m.scheduledDate)} • ${escapeHtml(m.scheduledTime)}</span>
        </div>
        <h4 class="text-base font-extrabold text-[#132219]">${escapeHtml(m.title)}</h4>
        <p class="text-xs font-semibold text-[#496052]">Host: ${escapeHtml(m.hostName)}</p>
        ${m.description ? `<p class="text-xs sm:text-sm text-[#496052] leading-relaxed">${escapeHtml(m.description)}</p>` : ""}
      </div>
      <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-50">
        ${url ? `
          <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="gv-btn flex-1 min-w-[150px] text-center py-2.5 px-4 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
            📹 Join Google Meet ↗
          </a>
          <button type="button" data-copy-meeting-url="${escapeHtml(url)}" class="px-3 py-2.5 min-h-[40px] rounded-xl bg-[#ECFDF5] hover:bg-[#DCFCE7] border border-[#BBF7D0] text-[#14532D] text-xs font-bold" aria-label="Copy Google Meet link">Copy Link</button>
          <button type="button" data-share-meeting="${escapeHtml(url)}" data-share-meeting-title="${escapeHtml(m.title)}" data-share-meeting-time="${escapeHtml(`${m.scheduledDate} ${m.scheduledTime}`)}" class="px-3 py-2.5 min-h-[40px] rounded-xl bg-[#F8FAFC] hover:bg-[#ECFDF5] border border-[#CDE0D3] text-[#14532D] text-xs font-bold" aria-label="Share Google Meet link">Share</button>
        ` : ""}
        ${canManage ? `
          <button type="button" data-edit-meeting="${escapeHtml(m.id)}" class="px-3 py-2.5 min-h-[40px] rounded-xl bg-[#EDF4EE] text-[#14532D] text-xs font-bold">Edit</button>
          <button type="button" data-del-meeting="${escapeHtml(m.id)}" class="px-3 py-2.5 min-h-[40px] rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">Delete</button>
        ` : ""}
      </div>
    </article>
  `;
}

// ----------------------------------------------------------------------------
// 3. STUDENT CAREER GUIDANCE (Renamed from Doubt Zone — Exclusively for Students)
// ----------------------------------------------------------------------------
export function renderCareerGuidanceView(state) {
  if (state.activeDoubtChat) {
    return renderConsultationChatRoom(state, state.activeDoubtChat);
  }

  const q = (state.professorSearch || "").trim().toLowerCase();
  const filteredProfs = state.professors.filter((p) => {
    if (!q) return true;
    return `${p.name} ${p.subject} ${p.specialization} ${p.department}`.toLowerCase().includes(q);
  });

  const myCareerThreads = (state.studentDoubtThreads || []).filter((t) => (t.serviceType || "STUDENT_CAREER") !== "FARMER_ADVISOR");
  const selectedProfId = state.selectedCareerProfId || filteredProfs[0]?.id || "";

  return `
    <div class="space-y-5 animate-fade-up">
      <!-- Hero -->
      <div class="rounded-3xl bg-gradient-to-br from-[#0C3B20] via-[#14532D] to-[#1E7E45] text-white p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold text-emerald-100">
            🧭 Exclusively for Students • Direct Faculty Consultation
          </div>
          <h2 class="font-display text-xl sm:text-2xl font-bold">Student Career Guidance</h2>
          <p class="text-xs sm:text-sm text-emerald-100 max-w-2xl">
            Ask our professors about M.Sc. admissions, ICAR JRF/SRF, Govt Exams (IBPS AFO, ADA, NABARD), research projects, IPR, internships, and B.Sc. Agriculture subjects.
          </p>
        </div>
        <div class="flex flex-wrap gap-2 shrink-0">
          ${state.facultyIdentity?.isAuthorizedProfessor ? `
            <button data-nav="professor" class="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0C3B20] text-xs font-extrabold">
              👨‍🏫 Open Professor Dashboard
            </button>
          ` : ""}
          <button data-nav="farmer-advisor" class="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold">
            Farmer? Go to Farmer Advisor →
          </button>
        </div>
      </div>

      <!-- Structured Career Question Submission + Student Q&A History -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div class="lg:col-span-6 gv-card p-5 space-y-3.5">
          <h3 class="text-base font-extrabold text-[#14532D]">Submit a Career / Academic Question</h3>
          ${!state.user ? `
            <p class="text-xs sm:text-sm text-[#496052]">Sign in to submit private questions to professors, attach images/documents, track email notification status, and view your full Q&amp;A history.</p>
            <button data-action="open-auth" class="w-full py-3 rounded-xl bg-[#14532D] text-white text-sm font-extrabold">Sign In to Ask Professor</button>
          ` : `
            <form id="careerGuidanceForm" class="space-y-3">
              <label class="block">
                <span class="text-xs font-bold text-[#132219]">Select Professor / Advisor *</span>
                <select id="cgProfSelect" required class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm font-semibold">
                  ${state.professors.map((p) => `
                    <option value="${escapeHtml(p.id)}" ${p.id === selectedProfId ? "selected" : ""}>
                      ${escapeHtml(p.name)} — ${escapeHtml(p.specialization)} ${p.email ? "(Direct Email Enabled)" : "(In-App Reply)"}
                    </option>
                  `).join("")}
                </select>
              </label>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label class="block">
                  <span class="text-xs font-bold text-[#132219]">Guidance Topic *</span>
                  <select id="cgCategory" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
                    ${CAREER_GUIDANCE_TOPICS.map((t) => `<option value="${t.id}">${escapeHtml(t.labelEn)}</option>`).join("")}
                  </select>
                </label>
                <label class="block">
                  <span class="text-xs font-bold text-[#132219]">Question Title *</span>
                  <input id="cgTitle" type="text" required minlength="3" maxlength="140" placeholder="e.g. M.Sc Agronomy JRF Booklist" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
                </label>
              </div>

              <label class="block">
                <span class="text-xs font-bold text-[#132219]">Your Question *</span>
                <textarea id="cgMessage" rows="3" required minlength="5" maxlength="2000" placeholder="Describe your career goal, semester, exam target, or subject doubt..." class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm"></textarea>
              </label>

              <div class="rounded-xl bg-[#F7F9F5] border border-[#CDE0D3] p-3 space-y-2">
                <label class="flex items-center gap-2 text-xs font-bold text-[#132219]">
                  <input id="cgContactConsent" type="checkbox" class="accent-[#14532D]" />
                  Optional: Share my phone/email with the assigned professor for reply
                </label>
                <input id="cgContactInfo" type="text" maxlength="80" value="${escapeHtml(state.user.phoneNumber || (state.user.email && !state.user.email.endsWith(".gurujivision.app") ? state.user.email : ""))}" placeholder="Optional phone or email (only shared if checked)" class="w-full px-3 py-2 rounded-lg border border-[#CDE0D3] bg-white text-xs" />
              </div>

              <div class="flex flex-wrap items-center justify-between gap-2">
                <label class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-extrabold cursor-pointer">
                  <span>📎 Attach Photo / Screenshot</span>
                  <input id="cgImageFile" type="file" accept="image/*" class="hidden" />
                </label>
                ${state.pendingCareerImageBase64 ? `
                  <div class="flex items-center gap-2">
                    <img src="data:image/jpeg;base64,${escapeHtml(state.pendingCareerImageBase64)}" alt="Attachment" class="w-10 h-10 rounded-lg object-cover border" />
                    <button type="button" data-action="clear-career-image" class="text-xs font-bold text-rose-600">Remove</button>
                  </div>
                ` : ""}
              </div>

              <button type="submit" class="w-full py-3 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">
                Send Career Question to Professor
              </button>
            </form>
          `}
        </div>

        <!-- My Career Guidance History -->
        <div class="lg:col-span-6 gv-card p-5 space-y-3">
          <h3 class="text-base font-extrabold text-[#14532D]">Your Career Q&amp;A History (${myCareerThreads.length})</h3>
          ${myCareerThreads.length === 0 ? `
            <p class="text-xs sm:text-sm text-[#496052]">You haven't started a career consultation yet. Submit a question on the left or pick an advisor below.</p>
          ` : `
            <div class="space-y-2.5 max-h-[460px] overflow-y-auto">
              ${myCareerThreads.map((th) => `
                <button type="button" data-open-student-thread="${escapeHtml(th.id)}" class="w-full text-left rounded-2xl border border-[#CDE0D3] bg-[#F7F9F5] hover:bg-[#EDF4EE] p-3.5 space-y-1.5 transition-colors">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="font-extrabold text-sm text-[#14532D]">${escapeHtml(th.professorName)}</span>
                    <div class="flex items-center gap-1.5">
                      ${renderEmailStatusBadge(th.emailDeliveryStatus, th.emailDeliveryError)}
                      ${th.unreadForStudent > 0 ? `<span class="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold">${th.unreadForStudent} new</span>` : ""}
                    </div>
                  </div>
                  ${th.questionTitle ? `<div class="text-xs font-bold text-[#1E7E45]">${escapeHtml(th.questionTitle)}</div>` : ""}
                  <p class="text-xs text-[#496052] truncate">${escapeHtml(th.lastMessagePreview)}</p>
                  <div class="text-[10px] text-[#496052]">Updated ${formatDateShort(th.updatedAtMs)} • Tap to open conversation →</div>
                </button>
              `).join("")}
            </div>
          `}
        </div>
      </div>

      <!-- Faculty & Advisor Directory (NEVER exposing private Gmail publicly) -->
      <div class="space-y-3">
        <div class="gv-card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h3 class="text-sm font-extrabold text-[#14532D] px-1">Select a Professor by Subject / Expertise (${filteredProfs.length})</h3>
          <input id="professorSearchInput" type="search" value="${escapeHtml(state.professorSearch || "")}" placeholder="Filter by Agronomy, Genetics, Soil, Pathology, IPR, Lab..." class="sm:w-80 px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs sm:text-sm" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filteredProfs.map((prof) => {
            const myThread = state.user ? myCareerThreads.find((t) => t.professorId === prof.id) : null;
            const unread = myThread?.unreadForStudent || 0;
            const hasEmail = Boolean(prof.email && prof.email.trim());
            return `
              <article class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div class="space-y-1.5">
                  <div class="flex items-start justify-between gap-2">
                    <div class="w-11 h-11 rounded-2xl bg-[#D8F3DC] text-[#14532D] font-extrabold text-sm flex items-center justify-center shrink-0">
                      ${escapeHtml(prof.name.replace(/^Dr\.\s*/i, "").slice(0, 2).toUpperCase())}
                    </div>
                    <div class="flex flex-col items-end gap-1">
                      ${unread > 0 ? `<span class="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold">${unread} new</span>` : ""}
                      <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold ${hasEmail ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-600"}">
                        ${hasEmail ? "📧 Direct Email Enabled" : "💬 In-App Reply"}
                      </span>
                    </div>
                  </div>
                  <h4 class="text-base font-extrabold text-[#14532D] pt-1">${escapeHtml(prof.name)}</h4>
                  <p class="text-xs font-bold text-[#1E7E45]">${escapeHtml(prof.designation)}${prof.qualification ? ` • ${escapeHtml(prof.qualification)}` : ""}</p>
                  <p class="text-xs text-[#496052]">${escapeHtml(prof.department)}${prof.subject ? ` • ${escapeHtml(prof.subject)}` : ""}</p>
                  <div class="rounded-xl bg-[#F1F7F2] border border-[#CDE0D3] p-2.5 text-xs font-semibold text-[#132219]">
                    ${escapeHtml(prof.specialization)}
                  </div>
                </div>
                <button type="button" data-start-career-prof="${escapeHtml(prof.id)}" class="w-full py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold transition-colors">
                  ${myThread ? "Open Career Chat →" : "Ask Career Question →"}
                </button>
              </article>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 4. FARMER ADVISOR EXPERT (Dedicated Service for Farmers — কৃষক পরামর্শ বিশেষজ্ঞ)
// ----------------------------------------------------------------------------
export function renderFarmerAdvisorView(state) {
  if (state.activeDoubtChat) {
    return renderConsultationChatRoom(state, state.activeDoubtChat);
  }

  const myFarmerThreads = (state.studentDoubtThreads || []).filter((t) => t.serviceType === "FARMER_ADVISOR");
  const selectedProfId = state.selectedFarmerProfId || state.professors[2]?.id || state.professors[0]?.id || "";

  return `
    <div class="space-y-5 animate-fade-up">
      <!-- Farmer-Friendly Bilingual Header -->
      <div class="rounded-3xl bg-gradient-to-br from-[#14532D] via-[#1E7E45] to-[#2F855A] text-white p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold text-amber-200">
            👨‍🌾 Exclusively for Farmers • কৃষকদের জন্য বিশেষজ্ঞ পরামর্শ
          </div>
          <h2 class="font-display text-xl sm:text-2xl font-bold">Farmer Advisor Expert (কৃষক পরামর্শ বিশেষজ্ঞ)</h2>
          <p class="text-xs sm:text-sm text-emerald-100 max-w-2xl">
            Ask agricultural professors directly about crop production, leaf diseases, pests, fertilizers, irrigation, seeds, and crop protection. Upload field/crop photos for accurate diagnosis.
          </p>
        </div>
        <div class="flex flex-wrap gap-2 shrink-0">
          <button data-nav="weather" class="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0C3B20] text-xs font-extrabold">⛅ আবহাওয়া</button>
          <button data-nav="market" class="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold">📊 বাজারদর</button>
        </div>
      </div>

      <!-- Topic Quick Chips -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        ${FARMER_ADVISOR_TOPICS.map((t) => `
          <button type="button" data-pick-fa-topic="${t.id}" class="p-3 rounded-2xl border text-left transition-colors ${
            state.selectedFarmerTopic === t.id ? "bg-[#14532D] text-white border-[#14532D]" : "bg-white border-[#CDE0D3] text-[#14532D] hover:bg-[#EDF4EE]"
          }">
            <div class="text-xs font-extrabold leading-snug">${escapeHtml(t.labelBn)}</div>
            <div class="text-[10px] opacity-80 mt-0.5">${escapeHtml(t.labelEn)}</div>
          </button>
        `).join("")}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Ask Farmer Expert Form -->
        <div class="lg:col-span-6 gv-card p-5 space-y-3.5">
          <h3 class="text-base font-extrabold text-[#14532D]">ফসলের সমস্যা বা প্রশ্ন পাঠান / Ask an Agri Expert</h3>
          ${!state.user ? `
            <p class="text-xs sm:text-sm text-[#496052]">Sign in with your Google Account to send crop photos and questions directly to agricultural experts.</p>
            <button data-action="open-auth" class="w-full py-3 rounded-xl bg-[#14532D] text-white text-sm font-extrabold">লগইন করুন / Continue with Google</button>
          ` : `
            <form id="farmerAdvisorForm" class="space-y-3">
              <label class="block">
                <span class="text-xs font-bold text-[#132219]">বিশেষজ্ঞ নির্বাচন করুন / Select Expert *</span>
                <select id="faProfSelect" required class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm font-semibold">
                  ${state.professors.map((p) => `
                    <option value="${escapeHtml(p.id)}" ${p.id === selectedProfId ? "selected" : ""}>
                      ${escapeHtml(p.name)} — ${escapeHtml(p.specialization)} ${p.email ? "(Direct Email Enabled)" : "(In-App Reply)"}
                    </option>
                  `).join("")}
                </select>
              </label>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label class="block">
                  <span class="text-xs font-bold text-[#132219]">বিষয় / Problem Category</span>
                  <select id="faCategory" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
                    ${FARMER_ADVISOR_TOPICS.map((t) => `<option value="${t.id}" ${state.selectedFarmerTopic === t.id ? "selected" : ""}>${escapeHtml(t.labelBn)} (${escapeHtml(t.labelEn)})</option>`).join("")}
                  </select>
                </label>
                <label class="block">
                  <span class="text-xs font-bold text-[#132219]">ফসলের নাম / Crop &amp; Title *</span>
                  <input id="faTitle" type="text" required minlength="2" maxlength="140" placeholder="যেমন: আমন ধানে পাতা পোড়া / Potato Late Blight" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
                </label>
              </div>

              <label class="block">
                <span class="text-xs font-bold text-[#132219]">বিস্তারিত বিবরণ / Describe Crop Problem *</span>
                <textarea id="faMessage" rows="3" required minlength="5" maxlength="2000" placeholder="ফসলের বয়স, পাতার দাগ, পোকার আক্রমণ, সার বা সেচের বিবরণ লিখুন..." class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm"></textarea>
              </label>

              <div class="rounded-xl bg-[#F7F9F5] border border-[#CDE0D3] p-3 space-y-2">
                <label class="flex items-center gap-2 text-xs font-bold text-[#132219]">
                  <input id="faContactConsent" type="checkbox" class="accent-[#14532D]" />
                  Optional: Share my mobile/village contact with the assigned expert
                </label>
                <input id="faContactInfo" type="text" maxlength="80" value="${escapeHtml(state.user.phoneNumber || state.userProfile?.district || "")}" placeholder="Mobile / Village (optional)" class="w-full px-3 py-2 rounded-lg border border-[#CDE0D3] bg-white text-xs" />
              </div>

              <div class="flex flex-wrap items-center justify-between gap-2">
                <label class="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-extrabold cursor-pointer">
                  <span>📷 ফসলের ছবি আপলোড করুন / Upload Crop Photo</span>
                  <input id="faImageFile" type="file" accept="image/*" class="hidden" />
                </label>
                ${state.pendingFarmerAdvisorImageBase64 ? `
                  <div class="flex items-center gap-2">
                    <img src="data:image/jpeg;base64,${escapeHtml(state.pendingFarmerAdvisorImageBase64)}" alt="Crop photo preview" class="w-12 h-12 rounded-lg object-cover border" />
                    <button type="button" data-action="clear-fa-image" class="text-xs font-bold text-rose-600">Remove</button>
                  </div>
                ` : ""}
              </div>

              <button type="submit" class="w-full py-3 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">
                বিশেষজ্ঞের কাছে প্রশ্ন পাঠান / Send to Expert
              </button>
            </form>
          `}
        </div>

        <!-- Farmer Q&A History -->
        <div class="lg:col-span-6 gv-card p-5 space-y-3">
          <h3 class="text-base font-extrabold text-[#14532D]">আপনার পূর্বের পরামর্শ / Your Consultation History (${myFarmerThreads.length})</h3>
          ${myFarmerThreads.length === 0 ? `
            <p class="text-xs sm:text-sm text-[#496052]">এখনও কোনো পরামর্শ চাওয়া হয়নি। বাম দিকের ফর্ম পূরণ করে ফসলের ছবি ও প্রশ্ন পাঠান।</p>
          ` : `
            <div class="space-y-2.5 max-h-[460px] overflow-y-auto">
              ${myFarmerThreads.map((th) => `
                <button type="button" data-open-student-thread="${escapeHtml(th.id)}" class="w-full text-left rounded-2xl border border-[#CDE0D3] bg-[#F7F9F5] hover:bg-[#EDF4EE] p-3.5 space-y-1.5 transition-colors">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="font-extrabold text-sm text-[#14532D]">${escapeHtml(th.professorName)}</span>
                    <div class="flex items-center gap-1.5">
                      ${renderEmailStatusBadge(th.emailDeliveryStatus, th.emailDeliveryError)}
                      ${th.unreadForStudent > 0 ? `<span class="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold">${th.unreadForStudent} new</span>` : ""}
                    </div>
                  </div>
                  ${th.questionTitle ? `<div class="text-xs font-bold text-[#1E7E45]">🌾 ${escapeHtml(th.questionTitle)}</div>` : ""}
                  <p class="text-xs text-[#496052] truncate">${escapeHtml(th.lastMessagePreview)}</p>
                  <div class="text-[10px] text-[#496052]">Updated ${formatDateShort(th.updatedAtMs)} • Tap to view reply →</div>
                </button>
              `).join("")}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 5. PROFESSOR DASHBOARD (Assigned Student Career Guidance & Farmer Advisor Inbox)
// ----------------------------------------------------------------------------
export function renderProfessorDashboardView(state) {
  if (state.activeDoubtChat) {
    return renderConsultationChatRoom(state, state.activeDoubtChat);
  }

  const isProf = state.facultyIdentity?.isAuthorizedProfessor;
  if (!state.user || !isProf) {
    return `
      <div class="max-w-lg mx-auto gv-card p-6 sm:p-8 text-center space-y-4 animate-fade-up">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-indigo-100 text-indigo-900 flex items-center justify-center text-2xl">👨‍🏫</div>
        <h2 class="font-display text-2xl font-bold text-[#14532D]">Professor &amp; Expert Dashboard</h2>
        <p class="text-sm text-[#496052] leading-relaxed">
          Sign in with your authorized faculty Google account (configured in the Guru Ji Vision Faculty Directory) to view assigned Student Career Guidance and Farmer Advisor questions, track email notifications, and reply directly.
        </p>
        ${!state.user ? `
          <button data-action="open-auth" class="w-full py-3 rounded-2xl bg-[#14532D] text-white text-sm font-extrabold">Sign In as Authorized Professor</button>
        ` : `
          <div class="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-bold text-amber-950">
            Signed in as ${escapeHtml(state.user.email || state.user.phoneNumber || state.user.uid)} — This account is not linked to a Professor profile.
          </div>
        `}
      </div>
    `;
  }

  const allThreads = state.professorDoubtThreads || [];
  const filter = state.profInboxFilter || "ALL";
  const studentThreads = allThreads.filter((t) => (t.serviceType || "STUDENT_CAREER") !== "FARMER_ADVISOR");
  const farmerThreads = allThreads.filter((t) => t.serviceType === "FARMER_ADVISOR");
  const visible = filter === "STUDENT" ? studentThreads : filter === "FARMER" ? farmerThreads : allThreads;

  return `
    <div class="space-y-5 animate-fade-up">
      <div class="gv-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#14532D] text-[11px] font-extrabold mb-1">
            ✓ Verified Faculty Account
          </div>
          <h2 class="font-display text-xl sm:text-2xl font-bold text-[#14532D]">Professor Dashboard — ${escapeHtml(state.facultyIdentity.professorName)}</h2>
          <p class="text-xs text-[#496052]">Showing private Student Career Guidance and Farmer Advisor Expert questions assigned strictly to you.</p>
        </div>
        <div class="flex flex-wrap gap-1.5 bg-[#EDF4EE] p-1 rounded-xl">
          <button type="button" data-prof-filter="ALL" class="px-3 py-2 rounded-lg text-xs font-extrabold ${filter === "ALL" ? "bg-[#14532D] text-white" : "text-[#14532D]"}">All (${allThreads.length})</button>
          <button type="button" data-prof-filter="STUDENT" class="px-3 py-2 rounded-lg text-xs font-extrabold ${filter === "STUDENT" ? "bg-[#14532D] text-white" : "text-[#14532D]"}">🎓 Student Career (${studentThreads.length})</button>
          <button type="button" data-prof-filter="FARMER" class="px-3 py-2 rounded-lg text-xs font-extrabold ${filter === "FARMER" ? "bg-[#14532D] text-white" : "text-[#14532D]"}">🌾 Farmer Advisor (${farmerThreads.length})</button>
        </div>
      </div>

      ${visible.length === 0 ? `
        <div class="gv-card p-8 text-center text-sm text-[#496052]">No consultations in this category assigned to you yet.</div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${visible.map((th) => {
            const isFarmer = th.serviceType === "FARMER_ADVISOR";
            return `
              <button type="button" data-open-prof-thread="${escapeHtml(th.id)}" class="text-left gv-card p-4 sm:p-5 hover:shadow-md transition-shadow space-y-2">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${isFarmer ? "bg-amber-100 text-amber-950" : "bg-indigo-100 text-indigo-900"}">
                      ${isFarmer ? "🌾 Farmer Advisor" : `🎓 Student Career • Sem ${escapeHtml(th.studentSemester || 1)}`}
                    </span>
                    <span class="font-extrabold text-sm text-[#14532D] truncate">${escapeHtml(th.studentName)}</span>
                  </div>
                  ${th.unreadForProfessor > 0 ? `<span class="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-extrabold shrink-0">${th.unreadForProfessor} new</span>` : `<span class="text-xs font-bold text-[#1E7E45] shrink-0">Reply →</span>`}
                </div>
                ${th.questionTitle ? `<div class="text-xs font-extrabold text-[#132219]">${escapeHtml(th.questionTitle)}</div>` : ""}
                <p class="text-xs text-[#496052] line-clamp-2">${escapeHtml(th.lastMessagePreview)}</p>
                <div class="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-[#496052]">
                  <span>${th.contactInfo ? `📞 ${escapeHtml(th.contactInfo)} • ` : ""}Updated ${formatDateShort(th.updatedAtMs)}</span>
                  ${renderEmailStatusBadge(th.emailDeliveryStatus, th.emailDeliveryError)}
                </div>
              </button>
            `;
          }).join("")}
        </div>
      `}
    </div>
  `;
}

// Compatibility fallback alias for legacy "doubt" route
export function renderDoubtZoneView(state) {
  if (state.facultyIdentity?.isAuthorizedProfessor) {
    return renderProfessorDashboardView(state);
  }
  return renderCareerGuidanceView(state);
}

// ----------------------------------------------------------------------------
// SHARED 1-ON-1 PRIVATE CONSULTATION ROOM (Career Guidance / Farmer Advisor / Prof)
// ----------------------------------------------------------------------------
function renderConsultationChatRoom(state, chat) {
  const messages = state.activeDoubtMessages || [];
  const isFarmer = chat.serviceType === "FARMER_ADVISOR";
  const hasConfiguredEmail = Boolean(chat.professor?.email && chat.professor.email.trim());

  return `
    <div class="gv-card overflow-hidden flex flex-col h-[calc(100vh-10.5rem)] sm:h-[76vh] animate-fade-up">
      <!-- Chat Header -->
      <div class="px-4 py-3.5 bg-[#14532D] text-white flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <button type="button" data-action="close-doubt-chat" class="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold shrink-0">← Back</button>
          <div class="min-w-0">
            <h3 class="text-sm sm:text-base font-extrabold truncate">${escapeHtml(chat.asProfessor ? chat.studentName : chat.professor.name)}</h3>
            <p class="text-[11px] text-emerald-100 truncate">
              ${isFarmer ? "🌾 Farmer Advisor Expert" : "🧭 Student Career Guidance"}${chat.questionTitle ? ` • ${escapeHtml(chat.questionTitle)}` : ""}
            </p>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-bold shrink-0">🔒 1-on-1 Private</span>
      </div>

      <!-- Messages Stream -->
      <div id="doubtMessagesContainer" class="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F7F9F5] chat-scroll">
        ${messages.length === 0 ? `
          <div class="text-center py-10 text-xs sm:text-sm text-[#496052]">
            Start your private consultation below. Only you and ${escapeHtml(chat.asProfessor ? chat.studentName : chat.professor.name)} can view this conversation.
          </div>
        ` : messages.map((m) => {
          const isMine = state.user && m.senderId === state.user.uid;
          const canRetry = isMine && !chat.asProfessor && hasConfiguredEmail && (m.emailDeliveryStatus === "FAILED" || m.emailDeliveryStatus === "NOT_CONFIGURED");
          return `
            <div class="flex ${isMine ? "justify-end" : "justify-start"}">
              <div class="max-w-[88%] sm:max-w-[72%] rounded-2xl px-3.5 py-2.5 shadow-sm space-y-1.5 ${
                isMine ? "bg-[#14532D] text-white rounded-br-sm" : "bg-white border border-[#CDE0D3] text-[#132219] rounded-bl-sm"
              }">
                <div class="flex items-center justify-between gap-2 text-[10px] font-bold ${isMine ? "text-emerald-200" : "text-[#1E7E45]"}">
                  <span>${escapeHtml(m.senderName)}</span>
                  ${m.questionCategory ? `<span class="opacity-80">${escapeHtml(m.questionCategory)}</span>` : ""}
                </div>
                ${m.questionTitle ? `<div class="text-xs font-extrabold ${isMine ? "text-amber-300" : "text-[#14532D]"}">${escapeHtml(m.questionTitle)}</div>` : ""}
                ${m.hasImage && m.imageBase64 ? `
                  <img src="data:image/jpeg;base64,${escapeHtml(m.imageBase64)}" alt="Consultation attachment" class="rounded-xl max-h-56 w-auto object-contain border border-white/20" />
                ` : ""}
                ${m.text ? `<p class="text-xs sm:text-sm whitespace-pre-line leading-relaxed break-words">${escapeHtml(m.text)}</p>` : ""}
                <div class="flex flex-wrap items-center justify-end gap-2 text-[10px] ${isMine ? "text-emerald-200/90" : "text-slate-400"}">
                  ${m.emailDeliveryStatus ? renderEmailStatusBadge(m.emailDeliveryStatus, m.emailDeliveryError) : ""}
                  ${canRetry ? `<button type="button" data-retry-email="${escapeHtml(m.id)}" class="px-2 py-0.5 rounded bg-amber-300 text-[#0C3B20] font-extrabold hover:bg-amber-200">Retry Email</button>` : ""}
                  <span>${formatTimeShort(m.createdAtMs)}</span>
                  ${isMine ? `<span>${m.readByRecipient ? "✓✓" : "✓"}</span>` : ""}
                  ${isMine ? `<button type="button" data-del-doubt-msg="${escapeHtml(m.id)}" class="hover:underline ml-1">Delete</button>` : ""}
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <!-- Pending Image Preview -->
      ${state.pendingDoubtImageBase64 ? `
        <div class="px-4 py-2 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <img src="data:image/jpeg;base64,${escapeHtml(state.pendingDoubtImageBase64)}" alt="Preview" class="w-10 h-10 rounded-lg object-cover border" />
            <span class="text-xs font-bold text-[#14532D]">Photo attached (compressed)</span>
          </div>
          <button type="button" data-action="clear-doubt-image" class="text-xs font-bold text-rose-600">Remove</button>
        </div>
      ` : ""}

      <!-- Keyboard-Safe Mobile Composer -->
      <form id="doubtComposerForm" class="p-3 bg-white border-t border-[#CDE0D3] flex items-center gap-2">
        <label class="cursor-pointer w-11 h-11 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] flex items-center justify-center shrink-0" title="Attach image">
          <span>📷</span>
          <input id="doubtImageFile" type="file" accept="image/*" class="hidden" />
        </label>
        <input id="doubtMessageInput" type="text" maxlength="2000" placeholder="${isFarmer ? "আপনার ফসলের প্রশ্ন বা উত্তর লিখুন..." : "Type your career question or reply..."}" class="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E7E45]" />
        <button type="submit" class="px-4 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs sm:text-sm font-extrabold shrink-0">Send</button>
      </form>
    </div>
  `;
}
