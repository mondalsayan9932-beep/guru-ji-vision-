// ============================================================================
// Guru Ji Vision — Private & Interactive Module Renderers
// 1. Strictly Private Student Money Manager (Owner-Only + Opening Balance + Charts + PDF)
// 2. Meeting Zone (Upcoming/Past 60m grace + Google Meet + Host CRUD)
// 3. Doubt Zone / Ask Your Professor (All 9 Advisors + 1-on-1 Private Chat + Images)
// ============================================================================

import { MONEY_EXPENSE_CATEGORIES, MONEY_INCOME_CATEGORIES } from "./config.js";
import {
  buildDoubtChatId,
  escapeHtml,
  formatInr,
  formatTimeShort,
  isUpcomingMeeting,
  safeUrl
} from "./calculators.js";

// ----------------------------------------------------------------------------
// 1. STRICTLY PRIVATE STUDENT MONEY MANAGER
// ----------------------------------------------------------------------------
export function renderMoneyManagerView(state) {
  if (!state.user) {
    return `
      <div class="max-w-lg mx-auto gv-card p-6 sm:p-8 text-center space-y-4 animate-fade-up">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-[#D8F3DC] text-[#14532D] flex items-center justify-center text-2xl">🔒</div>
        <h2 class="font-display text-2xl font-bold text-[#14532D]">Private Student Money Manager</h2>
        <p class="text-sm text-[#496052] leading-relaxed">
          Your Money Manager is <strong>100% private</strong>. Only your authenticated account can read or edit your Opening Balance, Income, Daily Expenses, Mess Ledger, and Savings Goals. Even Professors and Admins cannot access your financial records.
        </p>
        <button data-action="open-auth" class="w-full py-3 rounded-2xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">
          Sign In to Access Your Private Ledger
        </button>
      </div>
    `;
  }

  const txs = state.moneyTransactions || [];
  const goals = state.moneyBudgets || [];
  const openingBalance = Number(state.openingBalance) || 0;
  const totalIncome = txs.filter((t) => t.type === "INCOME").reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalExpense = txs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const netBalance = openingBalance + totalIncome - totalExpense;

  const filterMode = state.moneyFilter || "ALL";
  const visibleTxs = txs.filter((t) => {
    if (filterMode === "INCOME") return t.type === "INCOME";
    if (filterMode === "EXPENSE") return t.type === "EXPENSE";
    if (filterMode === "SHARED") return t.category === "SHARED" || Boolean(t.sharedWith);
    return true;
  });

  // Expense category breakdown
  const catTotals = {};
  txs.filter((t) => t.type === "EXPENSE").forEach((t) => {
    catTotals[t.category] = (catTotals[t.category] || 0) + (Number(t.amount) || 0);
  });
  const catRows = Object.entries(catTotals)
    .map(([k, v]) => ({
      key: k,
      label: MONEY_EXPENSE_CATEGORIES.find((c) => c.id === k)?.labelEn || k,
      amount: v,
      pct: totalExpense > 0 ? Math.round((v * 100) / totalExpense) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  // Monthly report summary
  const monthMap = {};
  txs.forEach((t) => {
    const mk = String(t.dateLabel || "").length >= 7 ? String(t.dateLabel).slice(0, 7) : "Current";
    if (!monthMap[mk]) monthMap[mk] = { month: mk, income: 0, expense: 0 };
    if (t.type === "INCOME") monthMap[mk].income += Number(t.amount) || 0;
    else monthMap[mk].expense += Number(t.amount) || 0;
  });
  const monthlyRows = Object.values(monthMap).sort((a, b) => b.month.localeCompare(a.month));

  const txType = state.moneyFormType || "EXPENSE";
  const catsForForm = txType === "INCOME" ? MONEY_INCOME_CATEGORIES : MONEY_EXPENSE_CATEGORIES;

  return `
    <div class="space-y-5 animate-fade-up">
      <!-- Privacy Header -->
      <div class="gv-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#14532D] text-[11px] font-extrabold mb-1">
            🔒 Strictly Owner-Only (UID Isolated • Hidden from Admin &amp; Professors)
          </div>
          <h2 class="font-display text-xl sm:text-2xl font-bold text-[#14532D]">Student Money Manager (₹ INR)</h2>
          <p class="text-xs text-[#496052]">Formula: Balance = Opening Balance + Total Income − Total Expenses</p>
        </div>
        <div class="flex flex-wrap gap-2 no-print">
          <button data-action="export-money-pdf" class="px-4 py-2.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-extrabold">
            📄 Print / Save PDF Report
          </button>
        </div>
      </div>

      <!-- KPI Cards + Opening Balance Control -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="gv-card p-4">
          <div class="text-[11px] font-bold uppercase text-[#496052]">Opening Balance</div>
          <div class="text-lg sm:text-xl font-extrabold text-[#132219] mt-1">${formatInr(openingBalance)}</div>
          <div class="flex gap-1.5 mt-2 no-print">
            <input id="openingBalanceInput" type="number" step="100" value="${openingBalance}" class="w-full px-2.5 py-1.5 rounded-lg border border-[#CDE0D3] text-xs font-bold" />
            <button data-action="save-opening-balance" class="px-2.5 py-1.5 rounded-lg bg-[#14532D] text-white text-[11px] font-bold">Set</button>
          </div>
        </div>
        <div class="gv-card p-4">
          <div class="text-[11px] font-bold uppercase text-emerald-700">Total Income</div>
          <div class="text-lg sm:text-xl font-extrabold text-emerald-800 mt-1">${formatInr(totalIncome)}</div>
          <div class="text-[11px] text-[#496052] mt-1">Home, Scholarship &amp; Part-time</div>
        </div>
        <div class="gv-card p-4">
          <div class="text-[11px] font-bold uppercase text-rose-700">Total Expenses</div>
          <div class="text-lg sm:text-xl font-extrabold text-rose-700 mt-1">${formatInr(totalExpense)}</div>
          <div class="text-[11px] text-[#496052] mt-1">Mess, Rent, Fees &amp; Daily</div>
        </div>
        <div class="rounded-3xl bg-gradient-to-br from-[#14532D] to-[#1E7E45] text-white p-4 shadow-sm">
          <div class="text-[11px] font-bold uppercase text-emerald-100">Net Balance</div>
          <div class="text-xl sm:text-2xl font-extrabold mt-1">${formatInr(netBalance)}</div>
          <div class="text-[11px] text-emerald-100 mt-1">${netBalance >= 0 ? "Healthy balance" : "Over budget"}</div>
        </div>
      </div>

      <!-- Main Grid: Add Transaction + History -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Add / Edit Form -->
        <form id="moneyTxForm" class="lg:col-span-5 gv-card p-5 space-y-3 h-fit no-print">
          <div class="flex items-center justify-between">
            <h3 id="moneyTxFormHeading" class="text-base font-extrabold text-[#14532D]">Add Income / Expense</h3>
            <button id="cancelMoneyEditBtn" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
          </div>
          <input id="moneyEditId" type="hidden" value="" />

          <div class="grid grid-cols-2 gap-2">
            <button type="button" data-money-type="EXPENSE" class="py-2.5 rounded-xl text-xs font-extrabold border ${
              txType === "EXPENSE" ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-700 border-[#CDE0D3]"
            }">- Expense</button>
            <button type="button" data-money-type="INCOME" class="py-2.5 rounded-xl text-xs font-extrabold border ${
              txType === "INCOME" ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-slate-700 border-[#CDE0D3]"
            }">+ Income</button>
          </div>

          <label class="block">
            <span class="text-xs font-bold">Title *</span>
            <input id="moneyTitle" type="text" required maxlength="100" placeholder="e.g. Hostel Mess Bill, Home Transfer" class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
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
              ${catsForForm.map((c) => `<option value="${c.id}">${escapeHtml(c.labelEn)}</option>`).join("")}
            </select>
          </label>

          <label class="block">
            <span class="text-xs font-bold">Shared / Mess Roommate Ledger (Optional)</span>
            <input id="moneySharedWith" type="text" maxlength="100" placeholder="e.g. Split with Rahul &amp; Sourav" class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
          </label>

          <label class="block">
            <span class="text-xs font-bold">Note (Optional)</span>
            <input id="moneyNote" type="text" maxlength="300" placeholder="Details..." class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
          </label>

          <button type="submit" class="w-full py-3 rounded-2xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">Save Private Entry</button>
        </form>

        <!-- Transaction Ledger -->
        <div class="lg:col-span-7 gv-card p-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-base font-extrabold text-[#14532D]">Transaction History (${visibleTxs.length})</h3>
            <div class="flex flex-wrap gap-1.5 no-print">
              ${[["ALL", "All"], ["EXPENSE", "Expenses"], ["INCOME", "Income"], ["SHARED", "Mess/Shared"]].map(([k, l]) => `
                <button data-money-filter="${k}" class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${
                  filterMode === k ? "bg-[#14532D] text-white" : "bg-[#EDF4EE] text-[#14532D]"
                }">${l}</button>
              `).join("")}
            </div>
          </div>

          ${visibleTxs.length === 0 ? `
            <p class="text-sm text-[#496052] py-6 text-center">No entries yet. Record your first income or daily expense.</p>
          ` : `
            <div class="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              ${visibleTxs.map((tx) => {
                const isInc = tx.type === "INCOME";
                const catLabel = [...MONEY_EXPENSE_CATEGORIES, ...MONEY_INCOME_CATEGORIES].find((c) => c.id === tx.category)?.labelEn || tx.category;
                return `
                  <div class="rounded-2xl border border-[#CDE0D3] p-3.5 flex items-center justify-between gap-3 bg-[#F7F9F5]">
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-1.5">
                        <span class="font-bold text-sm text-[#132219] truncate">${escapeHtml(tx.title)}</span>
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-[#CDE0D3] text-[#496052]">${escapeHtml(catLabel)}</span>
                      </div>
                      <div class="text-[11px] text-[#496052] mt-0.5">
                        ${escapeHtml(tx.dateLabel)}${tx.sharedWith ? ` • 🤝 ${escapeHtml(tx.sharedWith)}` : ""}${tx.note ? ` • ${escapeHtml(tx.note)}` : ""}
                      </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="text-sm font-extrabold ${isInc ? "text-emerald-700" : "text-rose-700"}">${isInc ? "+" : "-"}${formatInr(tx.amount)}</span>
                      <button data-del-tx="${escapeHtml(tx.id)}" class="no-print px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold">✕</button>
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
        <!-- Category Spending Chart & Monthly Summary -->
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

        <!-- Monthly Budgets & Savings Goals -->
        <div class="gv-card p-5 space-y-4">
          <h3 class="text-base font-extrabold text-[#14532D]">Monthly Budgets &amp; Savings Goals</h3>
          <form id="moneyGoalForm" class="grid grid-cols-2 gap-2.5 no-print">
            <input id="goalName" type="text" required maxlength="80" placeholder="Goal / Budget Name" class="col-span-2 px-3.5 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
            <select id="goalKind" class="px-3 py-2 rounded-xl border border-[#CDE0D3] bg-white text-xs font-bold">
              <option value="MONTHLY_BUDGET">Monthly Budget Limit</option>
              <option value="SAVINGS_GOAL">Savings Goal</option>
            </select>
            <input id="goalMonth" type="month" value="${new Date().toISOString().slice(0, 7)}" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs" />
            <input id="goalTarget" type="number" required min="1" placeholder="Target ₹" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs font-bold" />
            <input id="goalSaved" type="number" min="0" value="0" placeholder="Saved / Used ₹" class="px-3 py-2 rounded-xl border border-[#CDE0D3] text-xs font-bold" />
            <button type="submit" class="col-span-2 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">Add Budget / Goal</button>
          </form>

          <div class="space-y-2.5">
            ${goals.length === 0 ? `<p class="text-xs text-[#496052]">No monthly budgets or savings goals yet.</p>` : goals.map((g) => {
              const pct = Math.min(100, Math.round(((Number(g.savedAmount) || 0) * 100) / Math.max(1, Number(g.targetAmount) || 1)));
              return `
                <div class="rounded-2xl bg-[#F7F9F5] border border-[#CDE0D3] p-3.5 space-y-1.5">
                  <div class="flex items-center justify-between gap-2">
                    <div>
                      <span class="font-bold text-xs text-[#132219]">${escapeHtml(g.name)}</span>
                      <span class="ml-1.5 px-2 py-0.5 rounded bg-emerald-100 text-[#14532D] text-[10px] font-bold">${g.kind === "SAVINGS_GOAL" ? "Savings" : "Budget"} • ${escapeHtml(g.monthKey)}</span>
                    </div>
                    <button data-del-goal="${escapeHtml(g.id)}" class="no-print text-rose-600 text-xs font-bold">✕</button>
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
          <p class="text-xs sm:text-sm text-[#496052]">Join live online lectures, doubt-clearing classes, and faculty mentoring sessions.</p>
        </div>
        ${!state.user ? `<button data-action="open-auth" class="px-4 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">Sign In for Live Meetings</button>` : ""}
      </div>

      ${canHost ? `
        <form id="meetingForm" class="gv-card p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h3 id="meetingFormHeading" class="text-base font-extrabold text-[#14532D]">Schedule Google Meet Session (Host Controls)</h3>
            <button id="cancelMeetingEditBtn" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
          </div>
          <input id="meetingEditId" type="hidden" value="" />
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
          <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="gv-btn flex-1 text-center py-2.5 px-4 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
            📹 Join Google Meet ↗
          </a>
        ` : ""}
        ${canManage ? `
          <button data-edit-meeting="${escapeHtml(m.id)}" class="px-3 py-2.5 rounded-xl bg-[#EDF4EE] text-[#14532D] text-xs font-bold">Edit</button>
          <button data-del-meeting="${escapeHtml(m.id)}" class="px-3 py-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">Delete</button>
        ` : ""}
      </div>
    </article>
  `;
}

// ----------------------------------------------------------------------------
// 3. DOUBT ZONE / ASK YOUR PROFESSOR (All 9 Advisors + 1-on-1 Private Chat)
// ----------------------------------------------------------------------------
export function renderDoubtZoneView(state) {
  const isProf = state.facultyIdentity?.isAuthorizedProfessor;
  const activeChat = state.activeDoubtChat; // { chatId, professor, studentId, studentName, studentSemester, asProfessor }

  if (activeChat) {
    return renderDoubtChatRoom(state, activeChat);
  }

  const q = (state.professorSearch || "").trim().toLowerCase();
  const filteredProfs = state.professors.filter((p) => {
    if (!q) return true;
    return `${p.name} ${p.subject} ${p.specialization} ${p.department}`.toLowerCase().includes(q);
  });

  const sub = state.doubtSubTab || (isProf ? "inbox" : "advisors");

  return `
    <div class="space-y-4 animate-fade-up">
      <div class="gv-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="font-display text-xl sm:text-2xl font-bold text-[#14532D]">Doubt Zone — Ask Your Professor</h2>
          <p class="text-xs sm:text-sm text-[#496052]">Strictly private 1-on-1 messaging with our 9 official faculty &amp; lab advisors (text + photo attachments).</p>
        </div>
        ${isProf ? `
          <div class="flex gap-1.5 bg-[#EDF4EE] p-1 rounded-xl">
            <button data-doubt-sub="inbox" class="px-3.5 py-2 rounded-lg text-xs font-extrabold ${sub === "inbox" ? "bg-[#14532D] text-white" : "text-[#14532D]"}">
              Professor Inbox (${state.professorDoubtThreads.length})
            </button>
            <button data-doubt-sub="advisors" class="px-3.5 py-2 rounded-lg text-xs font-extrabold ${sub === "advisors" ? "bg-[#14532D] text-white" : "text-[#14532D]"}">
              All 9 Advisors
            </button>
          </div>
        ` : ""}
      </div>

      ${sub === "inbox" && isProf ? `
        <div class="space-y-3">
          <div class="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-[#14532D]">
            Signed in as Authorized Faculty: ${escapeHtml(state.facultyIdentity.professorName)} — Showing private student threads assigned strictly to you.
          </div>
          ${state.professorDoubtThreads.length === 0 ? `
            <div class="gv-card p-8 text-center text-sm text-[#496052]">No student doubt threads assigned to you yet.</div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              ${state.professorDoubtThreads.map((th) => `
                <button data-open-prof-thread="${escapeHtml(th.id)}" class="text-left gv-card p-4 hover:shadow-md transition-shadow flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-extrabold text-sm text-[#14532D] truncate">${escapeHtml(th.studentName)}</span>
                      <span class="px-2 py-0.5 rounded bg-[#EDF4EE] text-[#14532D] text-[10px] font-bold">Sem ${escapeHtml(th.studentSemester)}</span>
                    </div>
                    <p class="text-xs text-[#496052] truncate mt-1">${escapeHtml(th.lastMessagePreview)}</p>
                  </div>
                  ${th.unreadForProfessor > 0 ? `<span class="px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-extrabold shrink-0">${th.unreadForProfessor}</span>` : `<span class="text-xs font-bold text-[#1E7E45] shrink-0">Reply →</span>`}
                </button>
              `).join("")}
            </div>
          `}
        </div>
      ` : `
        <div class="gv-card p-3.5">
          <input id="professorSearchInput" type="search" value="${escapeHtml(state.professorSearch || "")}" placeholder="Filter advisors by name, Agronomy, Genetics, Soil Science, Pathology, IPR, Lab..." class="w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filteredProfs.map((prof) => {
            const myThread = state.user ? state.studentDoubtThreads.find((t) => t.professorId === prof.id) : null;
            const unread = myThread?.unreadForStudent || 0;
            return `
              <article class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div class="space-y-1.5">
                  <div class="flex items-start justify-between gap-2">
                    <div class="w-11 h-11 rounded-2xl bg-[#D8F3DC] text-[#14532D] font-extrabold text-sm flex items-center justify-center shrink-0">
                      ${escapeHtml(prof.name.replace(/^Dr\.\s*/i, "").slice(0, 2).toUpperCase())}
                    </div>
                    ${unread > 0 ? `<span class="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-extrabold">${unread} new</span>` : `<span class="px-2 py-0.5 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[10px] font-bold">#${prof.displayOrder || ""}</span>`}
                  </div>
                  <h3 class="text-base font-extrabold text-[#14532D] pt-1">${escapeHtml(prof.name)}</h3>
                  <p class="text-xs font-bold text-[#1E7E45]">${escapeHtml(prof.designation)}${prof.qualification ? ` • ${escapeHtml(prof.qualification)}` : ""}</p>
                  <p class="text-xs text-[#496052]">${escapeHtml(prof.department)}${prof.subject ? ` • ${escapeHtml(prof.subject)}` : ""}</p>
                  <div class="rounded-xl bg-[#F1F7F2] border border-[#CDE0D3] p-2.5 text-xs font-semibold text-[#132219]">
                    ${escapeHtml(prof.specialization)}
                  </div>
                </div>
                <button data-start-doubt-prof="${escapeHtml(prof.id)}" class="w-full py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold transition-colors">
                  ${myThread ? "Open Private Chat →" : "Ask Doubt Privately →"}
                </button>
              </article>
            `;
          }).join("")}
        </div>
      `}
    </div>
  `;
}

function renderDoubtChatRoom(state, chat) {
  const messages = state.activeDoubtMessages || [];
  return `
    <div class="gv-card overflow-hidden flex flex-col h-[calc(100vh-11rem)] sm:h-[75vh] animate-fade-up">
      <!-- Chat Header -->
      <div class="px-4 py-3.5 bg-[#14532D] text-white flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <button data-action="close-doubt-chat" class="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold shrink-0">← Back</button>
          <div class="min-w-0">
            <h3 class="text-sm sm:text-base font-extrabold truncate">${escapeHtml(chat.asProfessor ? chat.studentName : chat.professor.name)}</h3>
            <p class="text-[11px] text-emerald-100 truncate">
              ${chat.asProfessor ? `Semester ${chat.studentSemester} • Private Student Doubt` : escapeHtml(chat.professor.specialization)}
            </p>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded-full bg-white/15 text-[10px] font-bold shrink-0">🔒 1-on-1 Private</span>
      </div>

      <!-- Messages Stream -->
      <div id="doubtMessagesContainer" class="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F7F9F5] chat-scroll">
        ${messages.length === 0 ? `
          <div class="text-center py-10 text-xs sm:text-sm text-[#496052]">
            Start your private conversation below. Only you and ${escapeHtml(chat.asProfessor ? chat.studentName : chat.professor.name)} can read these messages.
          </div>
        ` : messages.map((m) => {
          const isMine = state.user && m.senderId === state.user.uid;
          return `
            <div class="flex ${isMine ? "justify-end" : "justify-start"}">
              <div class="max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-sm space-y-1.5 ${
                isMine ? "bg-[#14532D] text-white rounded-br-sm" : "bg-white border border-[#CDE0D3] text-[#132219] rounded-bl-sm"
              }">
                <div class="text-[10px] font-bold ${isMine ? "text-emerald-200" : "text-[#1E7E45]"}">${escapeHtml(m.senderName)}</div>
                ${m.hasImage && m.imageBase64 ? `
                  <img src="data:image/jpeg;base64,${escapeHtml(m.imageBase64)}" alt="Doubt attachment" class="rounded-xl max-h-56 w-auto object-contain border border-white/20" />
                ` : ""}
                ${m.text ? `<p class="text-xs sm:text-sm whitespace-pre-line leading-relaxed">${escapeHtml(m.text)}</p>` : ""}
                <div class="flex items-center justify-end gap-2 text-[10px] ${isMine ? "text-emerald-200/90" : "text-slate-400"}">
                  <span>${formatTimeShort(m.createdAtMs)}</span>
                  ${isMine ? `<span>${m.readByRecipient ? "✓✓" : "✓"}</span>` : ""}
                  ${isMine ? `<button data-del-doubt-msg="${escapeHtml(m.id)}" class="hover:underline ml-1">Delete</button>` : ""}
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
          <button data-action="clear-doubt-image" class="text-xs font-bold text-rose-600">Remove</button>
        </div>
      ` : ""}

      <!-- Message Composer -->
      <form id="doubtComposerForm" class="p-3 bg-white border-t border-[#CDE0D3] flex items-center gap-2">
        <label class="cursor-pointer w-11 h-11 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] flex items-center justify-center shrink-0" title="Attach image">
          <span>📷</span>
          <input id="doubtImageFile" type="file" accept="image/*" class="hidden" />
        </label>
        <input id="doubtMessageInput" type="text" maxlength="2000" placeholder="Type your academic doubt..." class="flex-1 px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E7E45]" />
        <button type="submit" class="px-4 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs sm:text-sm font-extrabold shrink-0">Send</button>
      </form>
    </div>
  `;
}
