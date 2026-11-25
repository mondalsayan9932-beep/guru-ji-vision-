// ============================================================================
// Guru Ji Vision — Farmer Financial Support & Rights UI (Core & 3 Main Pillars)
// 1. Dashboard Overview (8 Equal Cards + 3 Pillars Banner)
// 2. Pillar 1: Land & Lease Transparency (Fixed Rent & Crop Sharing)
// 3. Pillar 2: Loan & Debt Management (Simple/Compound Interest + Debt Comparison)
// 4. Pillar 3: Fair Crop Market & Selling (Sales + MSP + Verified Mandi + Compare)
// ============================================================================

import { escapeHtml, formatDateShort, formatInr, safeUrl } from "./calculators.js";
import {
  GOVERNMENT_SCHEMES,
  LEASE_AREA_UNITS,
  OFFICIAL_GRIEVANCE_CONTACTS,
  OFFICIAL_MSP_REFERENCE,
  PAYMENT_FREQUENCIES,
  FARM_SEASONS,
  computeCropSaleSummary,
  computeLeaseSummary,
  computeLoanSummary,
  computeProfitAndLoss,
  loadFormDraft
} from "./farmer-finance-data.js";
import {
  renderSchemesSection,
  renderSimplifiedHelplinesSection
} from "./farmer-finance-ui-tools.js";

const FF_ICONS = {
  lease: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>`,
  loan: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
  interest: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  market: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`,
  expense: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>`,
  pnl: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="8" x2="10" y1="11" y2="11"/><line x1="14" x2="16" y1="11" y2="11"/><line x1="8" x2="10" y1="15" y2="15"/><line x1="14" x2="16" y1="15" y2="15"/></svg>`,
  scheme: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>`,
  rights: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  docs: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`
};

// Phase 4: Simplified Farmer-Friendly Navigation
// Only essential Government Schemes & Official Helplines are shown in visible navigation.
// All existing Firestore collections and backend records remain 100% preserved untouched.
const SUB_TABS = [
  { key: "schemes", label: "Government Schemes • সরকারি প্রকল্প", icon: FF_ICONS.scheme },
  { key: "helplines", label: "Official Helplines & Help • হেল্পলাইন ও সহায়তা", icon: FF_ICONS.rights }
];

export function renderAuthGateCard(title, subtitle) {
  return `
    <div class="gv-card p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto my-4">
      <div class="w-14 h-14 mx-auto rounded-2xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D] flex items-center justify-center">
        ${FF_ICONS.rights}
      </div>
      <div class="space-y-1.5">
        <h3 class="font-display text-lg sm:text-xl font-bold text-[#14532D]">${escapeHtml(title)}</h3>
        <p class="text-xs sm:text-sm text-[#475569] leading-relaxed">${escapeHtml(subtitle)}</p>
      </div>
      <button data-action="open-auth" type="button" class="gv-btn inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#14532D] to-[#15803D] text-white text-sm font-extrabold shadow-md">
        Continue with Google
      </button>
    </div>
  `;
}

export function renderFarmerFinanceView(state) {
  const ff = state.farmerFinance || {};
  const rawTab = ff.subTab || "schemes";
  const activeTab = (rawTab === "helplines" || rawTab === "rights") ? "helplines" : "schemes";

  const bodyHtml = activeTab === "helplines"
    ? renderSimplifiedHelplinesSection(state)
    : renderSchemesSection(state);

  return `
    <div data-farmer-finance-simplified="true" class="ff-scope space-y-5">
      <!-- ==================== SIMPLIFIED FARMER-FRIENDLY HERO HEADER ==================== -->
      <section class="ff-hero-card rounded-3xl p-5 sm:p-7">
        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="space-y-2 max-w-3xl">
            <div class="flex flex-wrap items-center gap-2">
              <span class="ff-hero-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide">
                <span class="w-2 h-2 rounded-full bg-[#34D399]"></span>
                Farmer Financial Support • কৃষক আর্থিক সহায়তা
              </span>
              <span class="ff-hero-badge inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold">
                Free Public Guide • কোনো লগইন ছাড়াই দেখুন
              </span>
            </div>
            <h1 class="ff-hero-heading font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Government Schemes &amp; Financial Assistance
            </h1>
            <p class="text-sm sm:text-base font-bold text-[#DCFCE7]">
              সরকারি কৃষি প্রকল্প, ফসল বীমা ও কৃষক সহায়তা কেন্দ্র
            </p>
            <p class="ff-hero-desc text-xs sm:text-sm leading-relaxed">
              Simple, verified guides for Central &amp; West Bengal agricultural schemes, required documents, step-by-step application help, and toll-free farmer helplines.
            </p>
          </div>
          <div class="grid grid-cols-3 lg:grid-cols-1 gap-2 shrink-0">
            <div class="ff-hero-kpi rounded-2xl px-3.5 py-2.5">
              <div class="ff-hero-label text-[10px] uppercase tracking-wider font-bold">Verified Schemes</div>
              <div class="ff-hero-value text-sm sm:text-base font-extrabold mt-0.5">${GOVERNMENT_SCHEMES.length} Govt Portals</div>
            </div>
            <div class="ff-hero-kpi rounded-2xl px-3.5 py-2.5">
              <div class="ff-hero-label text-[10px] uppercase tracking-wider font-bold">Helplines</div>
              <div class="ff-hero-value text-sm sm:text-base font-extrabold mt-0.5">${OFFICIAL_GRIEVANCE_CONTACTS.length} Official Desks</div>
            </div>
            <div class="ff-hero-kpi rounded-2xl px-3.5 py-2.5">
              <div class="ff-hero-label text-[10px] uppercase tracking-wider font-bold">Toll-Free Call</div>
              <div class="ff-hero-value text-sm sm:text-base font-extrabold mt-0.5">1800-180-1551</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== SIMPLE 2-DESTINATION SWITCHER ==================== -->
      <div class="flex flex-wrap items-center gap-2">
        ${SUB_TABS.map((t) => `
          <button data-ff-tab="${t.key}" type="button" class="min-h-[48px] inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold border transition-all ${
            activeTab === t.key
              ? "bg-[#064E3B] text-white border-[#064E3B] shadow-sm"
              : "bg-white text-[#064E3B] border-[#CBD5E1] hover:bg-[#ECFDF5]"
          }">
            <span class="shrink-0">${t.icon}</span>
            <span>${escapeHtml(t.label)}</span>
          </button>
        `).join("")}
      </div>

      <!-- ==================== ACTIVE SECTION CONTENT ==================== -->
      ${bodyHtml}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// OVERVIEW DASHBOARD (3 EQUAL PILLARS + 8 CARDS)
// ----------------------------------------------------------------------------
function renderOverviewSection({
  state,
  leases,
  loans,
  loanTx,
  sales,
  expenses,
  complaints,
  documents,
  totalLeaseDue,
  renewalAlerts,
  totalLoanEstRem,
  pnl
}) {
  const isSignedIn = Boolean(state.user);

  const cards = [
    {
      tab: "leases",
      pillar: "Pillar 1 • Equal Priority",
      title: "Land & Lease Management",
      titleBn: "জমি ও লিজ ব্যবস্থাপনা",
      desc: "Record Fixed Rent or Crop Sharing leases, track advance & remaining rent, renewal dates, unverified verbal notes & receipts.",
      stat: isSignedIn ? `${leases.length} leases • Due ${formatInr(totalLeaseDue)}` : "Fixed Rent & Crop Sharing",
      icon: FF_ICONS.lease,
      highlight: true
    },
    {
      tab: "loans",
      pillar: "Pillar 2 • Equal Priority",
      title: "Loan & Debt Management",
      titleBn: "ঋণ ও কিস্তি হিসাব",
      desc: "Simple & Compound interest estimates, partial/irregular repayments, and side-by-side Farmer vs Lender Claim comparison.",
      stat: isSignedIn ? `${loans.length} loans • Est. ${formatInr(totalLoanEstRem)}` : "Interest & Debt Comparison",
      icon: FF_ICONS.loan,
      highlight: true
    },
    {
      tab: "interest-compare",
      pillar: "Bank vs Private",
      title: "Live Interest Rate Comparison",
      titleBn: "ব্যাংক বনাম ব্যক্তিগত ঋণ সুদের তুলনা",
      desc: "Compare verified Indian Bank / KCC / RRB / Cooperative rates against private lender loans using Effective Annual Cost (EABC %).",
      stat: `${(state.farmerFinance?.interestComparisons || []).length > 0 ? `${state.farmerFinance.interestComparisons.length} saved • ` : ""}7 Verified Bank Options`,
      icon: FF_ICONS.interest,
      highlight: true
    },
    {
      tab: "market-sales",
      pillar: "Pillar 3 • Equal Priority",
      title: "Crop Market & Selling",
      titleBn: "ফসল বিক্রয় ও বাজারদর",
      desc: "Log crop sales, transport & mandi commissions; compare selling rate against verified AGMARKNET prices & Govt MSP.",
      stat: isSignedIn ? `${sales.length} sales • ${formatInr(pnl.totalRevenue)}` : "MSP & Verified Mandi Compare",
      icon: FF_ICONS.market,
      highlight: true
    },
    {
      tab: "expenses",
      pillar: "Farm Ledger",
      title: "Income & Expense Manager",
      titleBn: "কৃষি আয় ও ব্যয় খাতা",
      desc: "Track seeds, fertilizers, pesticides, labour, irrigation, machinery, fuel, lease, transport, electricity & custom categories.",
      stat: isSignedIn ? `${expenses.length} entries • ${formatInr(pnl.expenseSum)}` : "11+ Agri Expense Categories",
      icon: FF_ICONS.expense
    },
    {
      tab: "profit-loss",
      pillar: "Analytics",
      title: "Profit & Loss Calculator",
      titleBn: "লাভ ও ক্ষতি ক্যালকুলেটর",
      desc: "Automatic crop-wise, season-wise & land-wise Net Farming Profit/Loss with incomplete-expense record warnings.",
      stat: isSignedIn ? `Est. Net: ${formatInr(pnl.netProfitLoss)}` : "Crop, Season & Land P&L",
      icon: FF_ICONS.pnl
    },
    {
      tab: "schemes",
      pillar: "Govt Support",
      title: "Government Schemes & Assistance",
      titleBn: "সরকারি প্রকল্প ও ভর্তুকি",
      desc: "Verified guidance & official portals for PM-KISAN, KCC, PMFBY, Krishak Bandhu, Bangla Shasya Bima & WB subsidies.",
      stat: "7 Official Verified Portals",
      icon: FF_ICONS.scheme
    },
    {
      tab: "rights",
      pillar: "Rights & Help",
      title: "Farmer Rights & Complaint Support",
      titleBn: "কৃষক অধিকার ও অভিযোগ সহায়তা",
      desc: "Log lease, loan, crop payment, or scheme disputes with proof, track status & access official helplines (1800-180-1551, NALSA, RBI).",
      stat: isSignedIn ? `${complaints.length} recorded issues` : "Dispute Log & Official Helplines",
      icon: FF_ICONS.rights
    },
    {
      tab: "reports",
      pillar: "Vault & Export",
      title: "Financial Reports & Documents",
      titleBn: "রিপোর্ট ও নথিপত্র সংরক্ষণ",
      desc: "Upload PDF agreements & receipts privately, search by date, generate printable PDF summaries & export CSV records.",
      stat: isSignedIn ? `${documents.length} uploaded docs` : "PDF Reports & CSV Export",
      icon: FF_ICONS.docs
    }
  ];

  return `
    <div class="space-y-5">
      <!-- 3 Equal-Importance Pillars Strip -->
      <section class="gv-card p-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-base font-extrabold text-[#14532D]">Three Core Pillars of Farmer Financial Protection</h2>
            <p class="text-xs text-[#475569]">Equal focus on Land Lease clarity, transparent Loan math, and Fair Crop Selling records.</p>
          </div>
          ${!isSignedIn ? `
            <button data-action="open-auth" type="button" class="px-3.5 py-2 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">
              Sign In to Save Records
            </button>
          ` : ""}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button data-ff-tab="leases" type="button" class="text-left rounded-2xl bg-[#ECFDF5] hover:bg-[#DCFCE7] border border-[#BBF7D0] p-4 transition-colors space-y-1.5">
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-[#15803D]">Pillar 1 • জমি ও লিজ স্বচ্ছতা</div>
            <div class="text-sm font-extrabold text-[#14532D]">Land &amp; Lease Transparency</div>
            <p class="text-xs text-[#475569]">Fixed Rent &amp; Crop Sharing logs, payment history, renewal countdowns &amp; agreement proofs.</p>
          </button>
          <button data-ff-tab="loans" type="button" class="text-left rounded-2xl bg-[#ECFDF5] hover:bg-[#DCFCE7] border border-[#BBF7D0] p-4 transition-colors space-y-1.5">
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-[#15803D]">Pillar 2 • ঋণ ও সুদ ব্যবস্থাপনা</div>
            <div class="text-sm font-extrabold text-[#14532D]">Loan &amp; Debt Management</div>
            <p class="text-xs text-[#475569]">Simple/Compound interest estimates, partial repayments &amp; Farmer vs Lender Claim comparison.</p>
          </button>
          <button data-ff-tab="market-sales" type="button" class="text-left rounded-2xl bg-[#ECFDF5] hover:bg-[#DCFCE7] border border-[#BBF7D0] p-4 transition-colors space-y-1.5">
            <div class="text-[10px] font-extrabold uppercase tracking-wider text-[#15803D]">Pillar 3 • ন্যায্য বাজার ও বিক্রয়</div>
            <div class="text-sm font-extrabold text-[#14532D]">Fair Crop Market &amp; Selling</div>
            <p class="text-xs text-[#475569]">Crop sale bills, mandi deductions, official MSP reference &amp; AGMARKNET market comparison.</p>
          </button>
        </div>
      </section>

      <!-- 8 Module Dashboard Cards -->
      <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        ${cards.map((c) => `
          <button data-ff-tab="${c.tab}" type="button" class="gv-module-card group text-left p-5 flex flex-col justify-between gap-3 ${c.highlight ? "ring-1 ring-[#22C55E]/50 bg-gradient-to-br from-[#ECFDF5]/60 to-white" : ""}">
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-2">
                <span class="w-11 h-11 rounded-2xl gv-icon-box flex items-center justify-center shrink-0">${c.icon}</span>
                <span class="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#14532D] text-[10px] font-extrabold">${escapeHtml(c.pillar)}</span>
              </div>
              <div>
                <h3 class="text-sm font-extrabold text-[#0F172A] group-hover:text-[#14532D]">${escapeHtml(c.title)}</h3>
                <div class="text-[11px] font-semibold text-[#15803D]">${escapeHtml(c.titleBn)}</div>
                <p class="text-xs text-[#475569] leading-relaxed mt-1.5">${escapeHtml(c.desc)}</p>
              </div>
            </div>
            <div class="pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
              <span class="text-[11px] font-extrabold text-[#14532D] truncate">${escapeHtml(c.stat)}</span>
              <span class="text-xs font-extrabold text-[#15803D]">Open →</span>
            </div>
          </button>
        `).join("")}
      </section>

      <!-- Transparency & Legal Honesty Notice -->
      <div class="rounded-2xl bg-[#FEFCE8] border border-[#FDE047] px-4 py-3 text-xs text-[#713F12] leading-relaxed">
        <strong>Transparency Notice (গুরুত্বপূর্ণ তথ্য):</strong> Records and documents entered in Guru Ji Vision are personal financial logs stored securely in your private account. They are <strong>not automatically legally verified</strong>, interest numbers are calculated estimates (distinct from lender statements), and government scheme approval depends strictly on official government authorities.
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// PILLAR 1: LAND & LEASE TRANSPARENCY
// ----------------------------------------------------------------------------
function renderLandLeaseSection(state, leases, documents) {
  const uid = state.user?.uid;
  const draft = loadFormDraft(uid, "lease");
  const d = draft?.data || {};
  const leaseType = state.farmerFinance?.leaseFormType || d.leaseType || "FIXED_RENT";
  const today = new Date().toISOString().slice(0, 10);

  return `
    <div class="space-y-5">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Registration Form -->
        <section class="lg:col-span-5 gv-card p-5 space-y-4">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h2 class="text-base font-extrabold text-[#14532D]">Register Land Lease Agreement</h2>
              <p class="text-xs text-[#475569]">জমির লিজ / ভাড়া চুক্তি নথিভুক্ত করুন (Fixed Rent or Crop Sharing)</p>
            </div>
            <button data-ff-action="save-draft" data-draft-form="ffLeaseForm" data-draft-key="lease" type="button" class="px-2.5 py-1.5 rounded-lg bg-[#ECFDF5] border border-[#BBF7D0] text-[11px] font-extrabold text-[#14532D]">
              Save Draft
            </button>
          </div>

          ${draft ? `
            <div class="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-950 flex items-center justify-between gap-2">
              <span>Saved draft found (${formatDateShort(draft.savedAt)}).</span>
              <button data-ff-action="clear-draft" data-draft-key="lease" type="button" class="underline font-bold">Discard</button>
            </div>
          ` : ""}

          <form id="ffLeaseForm" class="space-y-3">
            <!-- Lease Type Toggle -->
            <div>
              <label class="block text-xs font-extrabold text-[#14532D] mb-1">Lease Type (চুক্তির ধরন) *</label>
              <div class="grid grid-cols-2 gap-2">
                <button data-ff-lease-type="FIXED_RENT" type="button" class="py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-colors ${leaseType === "FIXED_RENT" ? "bg-[#14532D] text-white border-[#14532D]" : "bg-[#F8FAFC] text-[#14532D] border-[#D9EAE0]"}">
                  Fixed Rent (নগদ ভাড়া)
                </button>
                <button data-ff-lease-type="CROP_SHARING" type="button" class="py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-colors ${leaseType === "CROP_SHARING" ? "bg-[#14532D] text-white border-[#14532D]" : "bg-[#F8FAFC] text-[#14532D] border-[#D9EAE0]"}">
                  Crop Sharing (ভাগচাষ)
                </button>
              </div>
              <input type="hidden" name="leaseType" value="${escapeHtml(leaseType)}" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Landowner Name (জমির মালিকের নাম) *</label>
                <input name="landownerName" required value="${escapeHtml(d.landownerName || "")}" placeholder="e.g. Subhash Mondal" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Owner Contact (Optional)</label>
                <input name="landownerContact" value="${escapeHtml(d.landownerContact || "")}" placeholder="Phone / Note" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Village (গ্রাম) *</label>
                <input name="village" required value="${escapeHtml(d.village || "")}" placeholder="Village name" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Block (ব্লক)</label>
                <input name="block" value="${escapeHtml(d.block || "")}" placeholder="Block" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">District (জেলা) *</label>
                <input name="district" required value="${escapeHtml(d.district || state.userProfile?.district || "")}" placeholder="District" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">State (রাজ্য)</label>
                <input name="state" value="${escapeHtml(d.state || state.userProfile?.state || "West Bengal")}" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Land Area (জমির পরিমাণ) *</label>
                <input name="landArea" type="number" step="0.01" min="0.01" required value="${escapeHtml(d.landArea || "")}" placeholder="e.g. 2.5" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Measurement Unit</label>
                <select name="areaUnit" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white">
                  ${LEASE_AREA_UNITS.map((u) => `<option value="${u.key}" ${(d.areaUnit || "BIGHA_WB") === u.key ? "selected" : ""}>${escapeHtml(u.label)}</option>`).join("")}
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Lease Start Date *</label>
                <input name="startDate" type="date" required value="${escapeHtml(d.startDate || today)}" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Lease End / Renewal Date *</label>
                <input name="endDate" type="date" required value="${escapeHtml(d.endDate || "")}" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
              </div>
            </div>

            ${leaseType === "FIXED_RENT" ? `
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-[#334155] mb-1">Total Lease Amount (₹) *</label>
                  <input name="totalLeaseAmount" type="number" min="0" step="1" required value="${escapeHtml(d.totalLeaseAmount || "")}" placeholder="e.g. 24000" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#334155] mb-1">Advance Paid (₹)</label>
                  <input name="advancePayment" type="number" min="0" step="1" value="${escapeHtml(d.advancePayment || "0")}" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Payment Frequency</label>
                <select name="paymentFrequency" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white">
                  ${PAYMENT_FREQUENCIES.map((f) => `<option value="${f.key}" ${(d.paymentFrequency || "SEASONAL") === f.key ? "selected" : ""}>${escapeHtml(f.label)}</option>`).join("")}
                </select>
              </div>
            ` : `
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-[#334155] mb-1">Farmer Share (%) *</label>
                  <input name="farmerSharePercent" type="number" min="0" max="100" required value="${escapeHtml(d.farmerSharePercent || "60")}" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#334155] mb-1">Landowner Share (%) *</label>
                  <input name="landownerSharePercent" type="number" min="0" max="100" required value="${escapeHtml(d.landownerSharePercent || "40")}" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Crop Sharing Terms (e.g. quantity/quintal or input cost split)</label>
                <input name="cropShareNote" value="${escapeHtml(d.cropShareNote || "")}" placeholder="e.g. 60% farmer, seed & fertilizer split 50-50" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
              </div>
            `}

            <label class="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-2.5 cursor-pointer">
              <input name="isVerbalAgreement" type="checkbox" ${d.isVerbalAgreement ? "checked" : ""} class="mt-0.5 rounded" />
              <span class="text-xs text-amber-950 font-semibold">This is a verbal agreement (মৌখিক চুক্তি) — clearly marked as <strong>Unverified Verbal Note</strong>.</span>
            </label>

            <div>
              <label class="block text-xs font-bold text-[#334155] mb-1">Agreement / Verbal Notes</label>
              <textarea name="verbalNotes" rows="2" placeholder="Witness names, irrigation terms, or verbal commitments..." class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-sm bg-white">${escapeHtml(d.verbalNotes || "")}</textarea>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#334155] mb-1">Attach Lease Photo / PDF (Optional)</label>
              <input name="leaseFile" type="file" accept="image/*,application/pdf" class="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-[#ECFDF5] file:text-[#14532D] file:font-bold" />
              <p class="text-[11px] text-[#64748B] mt-1">Uploaded agreements are stored in your private vault and are NOT automatically treated as legally verified.</p>
            </div>

            <button type="submit" class="gv-btn w-full py-3 rounded-xl bg-gradient-to-r from-[#14532D] to-[#15803D] text-white text-sm font-extrabold shadow-sm">
              Save Land Lease Record
            </button>
          </form>
        </section>

        <!-- Saved Leases List -->
        <section class="lg:col-span-7 space-y-3.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-base font-extrabold text-[#14532D]">My Land &amp; Lease Records (${leases.length})</h2>
              <p class="text-xs text-[#475569]">Track rent balance, crop sharing terms, renewal reminders &amp; payment receipts</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button data-ff-action="export-leases-csv" type="button" class="px-3 py-2 rounded-xl bg-white border border-[#D9EAE0] text-xs font-extrabold text-[#14532D] hover:bg-[#ECFDF5]">Export CSV</button>
              <button data-ff-action="print-lease-pdf" type="button" class="px-3 py-2 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">Lease Summary PDF</button>
            </div>
          </div>

          ${leases.length === 0 ? `
            <div class="gv-card p-8 text-center space-y-2">
              <div class="text-sm font-extrabold text-[#14532D]">No Land Lease Records Yet</div>
              <p class="text-xs text-[#64748B]">Register your Fixed Rent or Crop Sharing agreement using the form to track payments, renewal dates, and receipts transparently.</p>
            </div>
          ` : leases.map((lease) => {
            const s = computeLeaseSummary(lease);
            const linkedDocs = documents.filter((doc) => doc.relatedEntityId === lease.id);
            const renewalBadgeClass = s.renewalStatus === "EXPIRED"
              ? "bg-rose-100 text-rose-900 border-rose-200"
              : (s.renewalStatus === "DUE_SOON" ? "bg-amber-100 text-amber-950 border-amber-200" : "bg-[#DCFCE7] text-[#14532D] border-[#BBF7D0]");
            return `
              <article class="gv-card p-4 sm:p-5 space-y-3">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div class="flex flex-wrap items-center gap-1.5">
                      <h3 class="text-sm sm:text-base font-extrabold text-[#14532D]">${escapeHtml(lease.landownerName)}</h3>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#ECFDF5] border border-[#BBF7D0] text-[#14532D]">
                        ${s.isCropSharing ? "Crop Sharing (ভাগচাষ)" : "Fixed Rent (নগদ ভাড়া)"}
                      </span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${renewalBadgeClass}">${escapeHtml(s.renewalLabel)}</span>
                    </div>
                    <div class="text-xs text-[#475569] mt-0.5">
                      ${escapeHtml([lease.village, lease.block, lease.district, lease.state].filter(Boolean).join(", "))} • <strong>${escapeHtml(lease.landArea)} ${escapeHtml(lease.areaUnit)}</strong>
                      ${lease.landownerContact ? ` • Contact: ${escapeHtml(lease.landownerContact)}` : ""}
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">
                    User Record • Not Legally Verified
                  </span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2.5">
                    <div class="text-[10px] font-bold text-[#64748B]">Period</div>
                    <div class="font-extrabold text-[#0F172A] mt-0.5">${escapeHtml(lease.startDate)} → ${escapeHtml(lease.endDate)}</div>
                  </div>
                  ${s.isCropSharing ? `
                    <div class="rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] p-2.5">
                      <div class="text-[10px] font-bold text-[#15803D]">Crop Share Split</div>
                      <div class="font-extrabold text-[#14532D] mt-0.5">${escapeHtml(lease.farmerSharePercent)}% Farmer / ${escapeHtml(lease.landownerSharePercent)}% Owner</div>
                    </div>
                    <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 col-span-2">
                      <div class="text-[10px] font-bold text-[#64748B]">Sharing Terms</div>
                      <div class="font-semibold text-[#334155] mt-0.5">${escapeHtml(lease.cropShareNote || "As agreed")}</div>
                    </div>
                  ` : `
                    <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2.5">
                      <div class="text-[10px] font-bold text-[#64748B]">Total Rent</div>
                      <div class="font-extrabold text-[#0F172A] mt-0.5">${escapeHtml(formatInr(s.totalLease))}</div>
                    </div>
                    <div class="rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] p-2.5">
                      <div class="text-[10px] font-bold text-[#15803D]">Paid (Adv + Logs)</div>
                      <div class="font-extrabold text-[#14532D] mt-0.5">${escapeHtml(formatInr(s.totalPaid))}</div>
                    </div>
                    <div class="rounded-xl ${s.remainingPayment > 0 ? "bg-amber-50 border-amber-200" : "bg-[#ECFDF5] border-[#BBF7D0]"} border p-2.5">
                      <div class="text-[10px] font-bold text-[#64748B]">Remaining Due</div>
                      <div class="font-extrabold ${s.remainingPayment > 0 ? "text-amber-950" : "text-[#14532D]"} mt-0.5">${escapeHtml(formatInr(s.remainingPayment))}</div>
                    </div>
                  `}
                </div>

                ${lease.isVerbalAgreement || lease.verbalNotes ? `
                  <div class="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-950">
                    ${lease.isVerbalAgreement ? `<span class="inline-block px-2 py-0.5 mr-1.5 rounded bg-amber-200 text-[10px] font-extrabold">UNVERIFIED VERBAL AGREEMENT</span>` : ""}
                    <span>${escapeHtml(lease.verbalNotes || "Recorded as verbal agreement without written deed.")}</span>
                  </div>
                ` : ""}

                <!-- Payment History -->
                ${Array.isArray(lease.paymentHistory) && lease.paymentHistory.length > 0 ? `
                  <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 space-y-1.5">
                    <div class="text-[11px] font-extrabold text-[#14532D]">Logged Lease Payments (${lease.paymentHistory.length})</div>
                    <div class="space-y-1">
                      ${lease.paymentHistory.slice(-5).reverse().map((p) => `
                        <div class="flex items-center justify-between text-xs border-b border-[#E2E8F0] last:border-0 pb-1">
                          <span><strong>${escapeHtml(p.paymentDate)}</strong> • ${escapeHtml(p.mode || "CASH")} ${p.note ? `— ${escapeHtml(p.note)}` : ""}</span>
                          <span class="font-extrabold text-[#14532D]">${escapeHtml(formatInr(p.amount))}</span>
                        </div>
                      `).join("")}
                    </div>
                  </div>
                ` : ""}

                <!-- Linked Docs -->
                ${linkedDocs.length > 0 ? `
                  <div class="flex flex-wrap gap-1.5">
                    ${linkedDocs.map((doc) => `
                      <button data-ff-view-doc="${escapeHtml(doc.id)}" type="button" class="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#BBF7D0] text-[11px] font-bold text-[#14532D] hover:bg-[#DCFCE7]">
                        📎 ${escapeHtml(doc.title)}
                      </button>
                    `).join("")}
                  </div>
                ` : ""}

                <!-- Inline Add Lease Payment + Receipt Form -->
                <details class="rounded-xl bg-[#F8FAFC] border border-[#D9EAE0] p-3">
                  <summary class="text-xs font-extrabold text-[#14532D] cursor-pointer">+ Record Rent Payment / Upload Payment Receipt</summary>
                  <form class="ff-lease-payment-form grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3" data-lease-id="${escapeHtml(lease.id)}">
                    <input name="amount" type="number" min="1" required placeholder="Amount Paid (₹)" class="rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
                    <input name="paymentDate" type="date" required value="${today}" class="rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
                    <select name="mode" class="rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white">
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI / Bank Transfer</option>
                      <option value="CROP_KIND">Crop Share / In-Kind</option>
                    </select>
                    <input name="note" placeholder="Receipt No. or Note" class="rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
                    <input name="receiptFile" type="file" accept="image/*,application/pdf" class="sm:col-span-2 text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#DCFCE7] file:text-[#14532D] file:font-bold" />
                    <button type="submit" class="sm:col-span-2 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">Save Lease Payment</button>
                  </form>
                </details>
              </article>
            `;
          }).join("")}
        </section>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// PILLAR 2: LOAN & DEBT MANAGEMENT (WITH DEBT COMPARISON SYSTEM)
// ----------------------------------------------------------------------------
function renderLoanDebtSection(state, loans, loanTx, documents) {
  const uid = state.user?.uid;
  const draft = loadFormDraft(uid, "loan");
  const d = draft?.data || {};
  const today = new Date().toISOString().slice(0, 10);

  return `
    <div class="space-y-5">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Loan Registration Form -->
        <section class="lg:col-span-5 gv-card p-5 space-y-4">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h2 class="text-base font-extrabold text-[#14532D]">Register Agricultural Loan</h2>
              <p class="text-xs text-[#475569]">ঋণের বিবরণ নথিভুক্ত করুন (Simple / Compound Interest &amp; Repayments)</p>
            </div>
            <button data-ff-action="save-draft" data-draft-form="ffLoanForm" data-draft-key="loan" type="button" class="px-2.5 py-1.5 rounded-lg bg-[#ECFDF5] border border-[#BBF7D0] text-[11px] font-extrabold text-[#14532D]">
              Save Draft
            </button>
          </div>

          <div class="rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] p-3 text-[11px] text-[#14532D] space-y-1">
            <div class="font-extrabold">Simple Interest vs Compound Interest (সহজ ব্যাখ্যা):</div>
            <p><strong>Simple Interest (সরল সুদ):</strong> Interest calculated only on original principal: <code>Principal × Rate% × Years</code>.</p>
            <p><strong>Compound Interest (চক্রবৃদ্ধি সুদ):</strong> Interest added to principal periodically so future interest grows on both principal and past interest.</p>
          </div>

          <form id="ffLoanForm" class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Lender Name (ঋণদাতার নাম) *</label>
                <input name="lenderName" required value="${escapeHtml(d.lenderName || "")}" placeholder="Bank / Cooperative / Person" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Lender Type</label>
                <select name="lenderType" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white">
                  <option value="BANK_KCC" ${(d.lenderType || "") === "BANK_KCC" ? "selected" : ""}>Bank / KCC</option>
                  <option value="COOPERATIVE" ${(d.lenderType || "") === "COOPERATIVE" ? "selected" : ""}>Cooperative / PACS</option>
                  <option value="SHG_MFI" ${(d.lenderType || "") === "SHG_MFI" ? "selected" : ""}>SHG / Microfinance</option>
                  <option value="PRIVATE_LENDER" ${(d.lenderType || "") === "PRIVATE_LENDER" ? "selected" : ""}>Private Lender (মহাজন)</option>
                  <option value="RELATIVE_OTHER" ${(d.lenderType || "") === "RELATIVE_OTHER" ? "selected" : ""}>Relative / Other</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Principal Amount (আসল ₹) *</label>
                <input name="principalAmount" type="number" min="1" required value="${escapeHtml(d.principalAmount || "")}" placeholder="e.g. 50000" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Loan Date (তারিখ) *</label>
                <input name="loanDate" type="date" required value="${escapeHtml(d.loanDate || today)}" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#334155] mb-1">Loan Purpose (ঋণের উদ্দেশ্য) *</label>
              <input name="purpose" required value="${escapeHtml(d.purpose || "")}" placeholder="e.g. Boro paddy cultivation, pump set, seeds" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Annual Interest Rate (% / yr) *</label>
                <input name="interestRatePercent" type="number" step="0.1" min="0" max="120" required value="${escapeHtml(d.interestRatePercent || "7")}" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Interest Method</label>
                <select name="interestMethod" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white">
                  <option value="SIMPLE" ${(d.interestMethod || "SIMPLE") === "SIMPLE" ? "selected" : ""}>Simple Interest (সরল সুদ)</option>
                  <option value="COMPOUND" ${d.interestMethod === "COMPOUND" ? "selected" : ""}>Compound Interest (চক্রবৃদ্ধি)</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-[11px] font-bold text-[#334155] mb-1">Period (Months)</label>
                <input name="repaymentPeriodMonths" type="number" min="1" max="600" value="${escapeHtml(d.repaymentPeriodMonths || "12")}" class="w-full rounded-xl border border-[#CBD5E1] px-2.5 py-2 text-xs bg-white" />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-[#334155] mb-1">Compounding/Yr</label>
                <select name="compoundingFrequencyPerYear" class="w-full rounded-xl border border-[#CBD5E1] px-2 py-2 text-xs bg-white">
                  <option value="1">Yearly (1x)</option>
                  <option value="2">Half-Yr (2x)</option>
                  <option value="4">Quarterly (4x)</option>
                  <option value="12">Monthly (12x)</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-bold text-[#334155] mb-1">Schedule Type</label>
                <select name="scheduleType" class="w-full rounded-xl border border-[#CBD5E1] px-2 py-2 text-xs bg-white">
                  <option value="FIXED">Fixed</option>
                  <option value="PARTIAL_FLEXIBLE">Partial</option>
                  <option value="IRREGULAR">Irregular</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Installment Frequency</label>
                <select name="installmentFrequency" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white">
                  ${PAYMENT_FREQUENCIES.map((f) => `<option value="${f.key}" ${(d.installmentFrequency || "MONTHLY") === f.key ? "selected" : ""}>${escapeHtml(f.label)}</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Next Due Date</label>
                <input name="nextDueDate" type="date" value="${escapeHtml(d.nextDueDate || "")}" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#334155] mb-1">Attach Loan Agreement / Passbook Photo/PDF (Optional)</label>
              <input name="loanFile" type="file" accept="image/*,application/pdf" class="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-[#ECFDF5] file:text-[#14532D] file:font-bold" />
            </div>

            <button type="submit" class="gv-btn w-full py-3 rounded-xl bg-gradient-to-r from-[#14532D] to-[#15803D] text-white text-sm font-extrabold shadow-sm">
              Save Loan Record
            </button>
          </form>
        </section>

        <!-- Registered Loans, Auto Calculations, Partial Repayments & Debt Comparison -->
        <section class="lg:col-span-7 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-base font-extrabold text-[#14532D]">Active Loans, Repayments &amp; Debt Comparison (${loans.length})</h2>
              <p class="text-xs text-[#475569]">App-calculated estimates are clearly separated from lender-claimed figures.</p>
            </div>
            <button data-ff-action="export-loans-csv" type="button" class="px-3 py-2 rounded-xl bg-white border border-[#D9EAE0] text-xs font-extrabold text-[#14532D] hover:bg-[#ECFDF5]">Export Loans CSV</button>
          </div>

          ${loans.length === 0 ? `
            <div class="gv-card p-8 text-center space-y-2">
              <div class="text-sm font-extrabold text-[#14532D]">No Loans Registered Yet</div>
              <p class="text-xs text-[#64748B]">Add your KCC, bank, cooperative, or private loan to track interest, log every partial repayment with receipts, and verify lender balance claims.</p>
            </div>
          ` : loans.map((loan) => {
            const s = computeLoanSummary(loan, loanTx);
            const linkedDocs = documents.filter((doc) => doc.relatedEntityId === loan.id);
            return `
              <article class="gv-card p-4 sm:p-5 space-y-3.5">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div class="flex flex-wrap items-center gap-1.5">
                      <h3 class="text-sm sm:text-base font-extrabold text-[#14532D]">${escapeHtml(loan.lenderName)}</h3>
                      <span class="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#14532D] text-[10px] font-extrabold">${escapeHtml(s.annualRate)}% ${escapeHtml(s.method)}</span>
                      <span class="px-2 py-0.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] text-[10px] font-bold">${escapeHtml(loan.scheduleType || "FIXED")}</span>
                    </div>
                    <div class="text-xs text-[#475569] mt-0.5">
                      ${escapeHtml(loan.purpose)} • Date: ${escapeHtml(loan.loanDate)} • Term: ${escapeHtml(s.tenureMonths)} mo
                      ${loan.nextDueDate ? ` • Next Due: <strong>${escapeHtml(loan.nextDueDate)}</strong>` : ""}
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200 text-[10px] font-extrabold text-sky-900">App Estimate (Not Lender-Confirmed)</span>
                </div>

                <!-- Automatic Calculation Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2.5">
                    <div class="text-[10px] font-bold text-[#64748B]">Original Principal</div>
                    <div class="font-extrabold text-[#0F172A] mt-0.5">${escapeHtml(formatInr(s.principal))}</div>
                  </div>
                  <div class="rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] p-2.5">
                    <div class="text-[10px] font-bold text-[#15803D]">Total Repaid (${s.repaymentCount})</div>
                    <div class="font-extrabold text-[#14532D] mt-0.5">${escapeHtml(formatInr(s.totalRepaid))}</div>
                  </div>
                  <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2.5">
                    <div class="text-[10px] font-bold text-[#64748B]">Est. Principal Outstanding</div>
                    <div class="font-extrabold text-[#0F172A] mt-0.5">${escapeHtml(formatInr(s.principalOutstanding))}</div>
                  </div>
                  <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2.5">
                    <div class="text-[10px] font-bold text-[#64748B]">Est. Interest Accrued (${s.elapsedDays}d)</div>
                    <div class="font-extrabold text-[#0F172A] mt-0.5">${escapeHtml(formatInr(s.accruedInterestEstimate))}</div>
                  </div>
                  <div class="rounded-xl bg-amber-50 border border-amber-200 p-2.5">
                    <div class="text-[10px] font-bold text-amber-900">Est. Remaining Today</div>
                    <div class="font-extrabold text-amber-950 mt-0.5">${escapeHtml(formatInr(s.remainingEstimatedAmount))}</div>
                  </div>
                  <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2.5">
                    <div class="text-[10px] font-bold text-[#64748B]">Full-Term Est. Total</div>
                    <div class="font-extrabold text-[#0F172A] mt-0.5">${escapeHtml(formatInr(s.totalEstimatedRepaymentFullTerm))}</div>
                  </div>
                </div>

                <!-- Debt Comparison Box (Side-by-Side) -->
                <div class="rounded-2xl bg-[#F8FAFC] border border-[#D9EAE0] p-3.5 space-y-2.5">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="text-xs font-extrabold text-[#14532D]">Debt Comparison System (কৃষকের হিসাব বনাম ঋণদাতার দাবি)</div>
                    <span class="text-[10px] font-semibold text-[#64748B]">Neither figure is automatically declared legally correct</span>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div class="rounded-xl bg-white border border-[#D9EAE0] p-2.5">
                      <div class="text-[10px] font-bold text-[#15803D]">Farmer's Calculated Balance</div>
                      <div class="text-sm font-extrabold text-[#14532D] mt-0.5">${escapeHtml(formatInr(s.farmerOwnBalance))}</div>
                    </div>
                    <div class="rounded-xl bg-white border border-[#D9EAE0] p-2.5">
                      <div class="text-[10px] font-bold text-[#475569]">Amount Claimed by Lender</div>
                      <div class="text-sm font-extrabold text-[#0F172A] mt-0.5">${s.lenderClaimed !== null ? escapeHtml(formatInr(s.lenderClaimed)) : "Not entered yet"}</div>
                    </div>
                    <div class="rounded-xl ${s.claimDifference !== null && s.claimDifference !== 0 ? "bg-amber-50 border-amber-300" : "bg-[#ECFDF5] border-[#BBF7D0]"} border p-2.5">
                      <div class="text-[10px] font-bold text-[#64748B]">Difference (Claim − Farmer)</div>
                      <div class="text-sm font-extrabold ${s.claimDifference !== null && s.claimDifference > 0 ? "text-rose-700" : "text-[#14532D]"} mt-0.5">
                        ${s.claimDifference !== null ? `${s.claimDifference >= 0 ? "+" : ""}${escapeHtml(formatInr(s.claimDifference))}` : "—"}
                      </div>
                    </div>
                  </div>
                  ${loan.discrepancyNotes ? `<p class="text-[11px] text-[#475569]"><strong>Notes:</strong> ${escapeHtml(loan.discrepancyNotes)}</p>` : ""}

                  <details class="pt-1">
                    <summary class="text-[11px] font-extrabold text-[#15803D] cursor-pointer">Update Side-by-Side Debt Comparison &amp; Attach Proof</summary>
                    <form class="ff-loan-compare-form grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2" data-loan-id="${escapeHtml(loan.id)}">
                      <div>
                        <label class="block text-[10px] font-bold text-[#475569] mb-0.5">Your Calculated Balance (₹)</label>
                        <input name="farmerCalculatedBalance" type="number" min="0" required value="${escapeHtml(s.farmerOwnBalance)}" class="w-full rounded-lg border border-[#CBD5E1] px-2.5 py-1.5 text-xs bg-white" />
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-[#475569] mb-0.5">Lender Claimed Amount (₹)</label>
                        <input name="lenderClaimedAmount" type="number" min="0" required value="${escapeHtml(s.lenderClaimed ?? "")}" placeholder="Enter claimed balance" class="w-full rounded-lg border border-[#CBD5E1] px-2.5 py-1.5 text-xs bg-white" />
                      </div>
                      <input name="discrepancyNotes" value="${escapeHtml(loan.discrepancyNotes || "")}" placeholder="Supporting notes (e.g. missing receipt #12, rate mismatch)" class="sm:col-span-2 rounded-lg border border-[#CBD5E1] px-2.5 py-1.5 text-xs bg-white" />
                      <input name="proofFile" type="file" accept="image/*,application/pdf" class="sm:col-span-2 text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-[#DCFCE7] file:text-[#14532D] file:font-bold" />
                      <button type="submit" class="sm:col-span-2 py-2 rounded-lg bg-[#14532D] text-white text-xs font-extrabold">Save Comparison</button>
                    </form>
                  </details>
                </div>

                <!-- Immutable Repayment History -->
                ${s.loanTx.length > 0 ? `
                  <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 space-y-1">
                    <div class="text-[11px] font-extrabold text-[#14532D]">Preserved Repayment History (${s.loanTx.length})</div>
                    ${s.loanTx.slice(-6).reverse().map((tx) => `
                      <div class="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-[#E2E8F0] last:border-0 pb-1">
                        <span><strong>${escapeHtml(tx.paymentDate)}</strong> • ${escapeHtml(tx.paymentType)} (${escapeHtml(tx.paymentMode)}) ${tx.note ? `— ${escapeHtml(tx.note)}` : ""}</span>
                        <span class="font-extrabold text-[#14532D]">${escapeHtml(formatInr(tx.amount))}</span>
                      </div>
                    `).join("")}
                  </div>
                ` : ""}

                ${linkedDocs.length > 0 ? `
                  <div class="flex flex-wrap gap-1.5">
                    ${linkedDocs.map((doc) => `
                      <button data-ff-view-doc="${escapeHtml(doc.id)}" type="button" class="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#BBF7D0] text-[11px] font-bold text-[#14532D]">
                        📎 ${escapeHtml(doc.title)}
                      </button>
                    `).join("")}
                  </div>
                ` : ""}

                <!-- Record Partial / Full / Irregular Repayment -->
                <details class="rounded-xl bg-[#ECFDF5]/60 border border-[#BBF7D0] p-3">
                  <summary class="text-xs font-extrabold text-[#14532D] cursor-pointer">+ Record Loan Repayment (Partial / Installment / Irregular)</summary>
                  <form class="ff-loan-repay-form grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3" data-loan-id="${escapeHtml(loan.id)}">
                    <input name="amount" type="number" min="1" required placeholder="Total Paid Amount (₹) *" class="rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
                    <input name="paymentDate" type="date" required value="${today}" class="rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
                    <select name="paymentType" class="rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white">
                      <option value="PARTIAL">Partial Repayment</option>
                      <option value="INSTALLMENT">Scheduled Installment</option>
                      <option value="IRREGULAR">Irregular Repayment</option>
                      <option value="FULL_SETTLEMENT">Full Settlement</option>
                    </select>
                    <select name="paymentMode" class="rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white">
                      <option value="CASH">Cash</option>
                      <option value="BANK_UPI">Bank / UPI</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                    <input name="principalPortion" type="number" min="0" placeholder="Principal Portion ₹ (optional)" class="rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
                    <input name="interestPortion" type="number" min="0" placeholder="Interest Portion ₹ (optional)" class="rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
                    <input name="nextDueDate" type="date" value="${escapeHtml(loan.nextDueDate || "")}" class="rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" title="Updated Next Due Date" />
                    <input name="note" placeholder="Receipt number / notes" class="rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
                    <input name="receiptFile" type="file" accept="image/*,application/pdf" class="sm:col-span-2 text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#DCFCE7] file:text-[#14532D] file:font-bold" />
                    <button type="submit" class="sm:col-span-2 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">Save Repayment (Preserved Permanently)</button>
                  </form>
                </details>
              </article>
            `;
          }).join("")}
        </section>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// PILLAR 3: FAIR CROP MARKET & SELLING (SALES + MSP + VERIFIED MANDI + COMPARE)
// ----------------------------------------------------------------------------
function renderCropMarketSalesSection(state, sales, leases) {
  const isSignedIn = Boolean(state.user);
  const uid = state.user?.uid;
  const draft = isSignedIn ? loadFormDraft(uid, "sale") : null;
  const d = draft?.data || {};
  const today = new Date().toISOString().slice(0, 10);
  const mandiRecords = state.mandiApiRecords || [];
  const firestorePrices = (state.firestoreMarketPrices || []).filter((p) => p.published !== false);

  return `
    <div class="space-y-5">
      <!-- Part A: Crop Sale Records & Selling Comparison -->
      ${isSignedIn ? `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <section class="lg:col-span-5 gv-card p-5 space-y-4">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h2 class="text-base font-extrabold text-[#14532D]">Record Crop Sale Transaction</h2>
                <p class="text-xs text-[#475569]">ফসল বিক্রির হিসাব ও বাজারদর তুলনা</p>
              </div>
              <button data-ff-action="save-draft" data-draft-form="ffCropSaleForm" data-draft-key="sale" type="button" class="px-2.5 py-1.5 rounded-lg bg-[#ECFDF5] border border-[#BBF7D0] text-[11px] font-extrabold text-[#14532D]">
                Save Draft
              </button>
            </div>

            <form id="ffCropSaleForm" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-[#334155] mb-1">Crop Name (ফসল) *</label>
                  <input name="cropName" required value="${escapeHtml(d.cropName || "")}" placeholder="e.g. Paddy, Potato, Mustard" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#334155] mb-1">Variety (জাত)</label>
                  <input name="cropVariety" value="${escapeHtml(d.cropVariety || "")}" placeholder="e.g. Swarna, Jyoti" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2.5 text-sm bg-white" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-[#334155] mb-1">Season</label>
                  <select name="season" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white">
                    ${FARM_SEASONS.map((s) => `<option value="${s.key}" ${(d.season || "KHARIF") === s.key ? "selected" : ""}>${escapeHtml(s.label)}</option>`).join("")}
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#334155] mb-1">Land Plot / Lease (Optional)</label>
                  <input name="landLabel" list="ffLandPlotList" value="${escapeHtml(d.landLabel || "")}" placeholder="Own Land / Lease Name" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
                  <datalist id="ffLandPlotList">
                    <option value="Own Land"></option>
                    ${leases.map((l) => `<option value="${escapeHtml(`${l.landownerName} (${l.village})`)}"></option>`).join("")}
                  </datalist>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-[#334155] mb-1">Harvest Date</label>
                  <input name="harvestDate" type="date" value="${escapeHtml(d.harvestDate || "")}" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#334155] mb-1">Selling Date *</label>
                  <input name="sellingDate" type="date" required value="${escapeHtml(d.sellingDate || today)}" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white" />
                </div>
              </div>

              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-[11px] font-bold text-[#334155] mb-1">Qty Harvested</label>
                  <input name="quantityHarvested" type="number" step="0.01" min="0" value="${escapeHtml(d.quantityHarvested || "")}" placeholder="e.g. 25" class="w-full rounded-xl border border-[#CBD5E1] px-2.5 py-2 text-xs bg-white" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-[#334155] mb-1">Qty Sold *</label>
                  <input name="quantitySold" type="number" step="0.01" min="0.01" required value="${escapeHtml(d.quantitySold || "")}" placeholder="e.g. 20" class="w-full rounded-xl border border-[#CBD5E1] px-2.5 py-2 text-xs bg-white" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-[#334155] mb-1">Unit</label>
                  <select name="priceUnit" class="w-full rounded-xl border border-[#CBD5E1] px-2 py-2 text-xs bg-white">
                    <option value="QUINTAL" ${(d.priceUnit || "QUINTAL") === "QUINTAL" ? "selected" : ""}>Quintal (100kg)</option>
                    <option value="KG" ${d.priceUnit === "KG" ? "selected" : ""}>Kg</option>
                    <option value="TON" ${d.priceUnit === "TON" ? "selected" : ""}>Metric Ton</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-[#334155] mb-1">Selling Price / Unit (₹) *</label>
                  <input name="sellingPricePerUnit" type="number" step="0.01" min="0.01" required value="${escapeHtml(d.sellingPricePerUnit || "")}" placeholder="e.g. 2250" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-sm bg-white" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#334155] mb-1">Buyer / Mandi Name *</label>
                  <input name="buyerName" required value="${escapeHtml(d.buyerName || "")}" placeholder="Trader / Kisan Mandi" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-sm bg-white" />
                </div>
              </div>

              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-[11px] font-bold text-[#334155] mb-1">Transport (₹)</label>
                  <input name="transportCost" type="number" min="0" value="${escapeHtml(d.transportCost || "0")}" class="w-full rounded-xl border border-[#CBD5E1] px-2.5 py-2 text-xs bg-white" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-[#334155] mb-1">Commission (₹)</label>
                  <input name="marketCommission" type="number" min="0" value="${escapeHtml(d.marketCommission || "0")}" class="w-full rounded-xl border border-[#CBD5E1] px-2.5 py-2 text-xs bg-white" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-[#334155] mb-1">Other Cost (₹)</label>
                  <input name="otherExpenses" type="number" min="0" value="${escapeHtml(d.otherExpenses || "0")}" class="w-full rounded-xl border border-[#CBD5E1] px-2.5 py-2 text-xs bg-white" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-[#334155] mb-1">Total Received (₹) *</label>
                  <input name="totalAmountReceived" type="number" min="0" required value="${escapeHtml(d.totalAmountReceived || "")}" placeholder="Actual cash/bank received" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-sm bg-white" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-[#334155] mb-1">Payment Status</label>
                  <select name="paymentStatus" class="w-full rounded-xl border border-[#CBD5E1] px-3 py-2 text-xs bg-white">
                    <option value="PAID">Paid in Full</option>
                    <option value="PARTIAL">Partially Paid</option>
                    <option value="PENDING">Payment Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-[#334155] mb-1">Attach Sale Bill / Mandi Receipt (Optional)</label>
                <input name="saleReceiptFile" type="file" accept="image/*,application/pdf" class="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-[#ECFDF5] file:text-[#14532D] file:font-bold" />
              </div>

              <button type="submit" class="gv-btn w-full py-3 rounded-xl bg-gradient-to-r from-[#14532D] to-[#15803D] text-white text-sm font-extrabold shadow-sm">
                Save Crop Sale Record
              </button>
            </form>
          </section>

          <!-- Recorded Crop Sales with MSP & Market Reference Comparison -->
          <section class="lg:col-span-7 space-y-3.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="text-base font-extrabold text-[#14532D]">My Crop Sales &amp; Reference Comparison (${sales.length})</h2>
                <p class="text-xs text-[#475569]">Neutral price comparison against available market rates &amp; official Govt MSP</p>
              </div>
              <button data-ff-action="export-sales-csv" type="button" class="px-3 py-2 rounded-xl bg-white border border-[#D9EAE0] text-xs font-extrabold text-[#14532D] hover:bg-[#ECFDF5]">Export Sales CSV</button>
            </div>

            ${sales.length === 0 ? `
              <div class="gv-card p-8 text-center space-y-2">
                <div class="text-sm font-extrabold text-[#14532D]">No Crop Sales Recorded Yet</div>
                <p class="text-xs text-[#64748B]">Log your harvest sales to calculate net realization after transport &amp; mandi charges, and compare against official MSP and mandi references.</p>
              </div>
            ` : sales.map((sale) => {
              const s = computeCropSaleSummary(sale, mandiRecords, firestorePrices);
              return `
                <article class="gv-card p-4 space-y-3">
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div class="flex flex-wrap items-center gap-1.5">
                        <h3 class="text-sm font-extrabold text-[#14532D]">${escapeHtml(sale.cropName)} ${sale.cropVariety ? `(${escapeHtml(sale.cropVariety)})` : ""}</h3>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${sale.paymentStatus === "PAID" ? "bg-[#DCFCE7] text-[#14532D]" : "bg-amber-100 text-amber-950"}">${escapeHtml(sale.paymentStatus)}</span>
                      </div>
                      <div class="text-xs text-[#475569]">
                        Buyer: <strong>${escapeHtml(sale.buyerName)}</strong> • Sold ${escapeHtml(s.qtySold)} ${escapeHtml(s.unit)} on ${escapeHtml(sale.sellingDate)}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm font-extrabold text-[#14532D]">${escapeHtml(formatInr(s.pricePerUnit))} / ${escapeHtml(s.unit)}</div>
                      <div class="text-[11px] text-[#64748B]">≈ ${escapeHtml(formatInr(s.farmerPricePerQuintal))}/Quintal</div>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2"><div class="text-[10px] text-[#64748B]">Gross Value</div><div class="font-extrabold">${escapeHtml(formatInr(s.grossAmount))}</div></div>
                    <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-2"><div class="text-[10px] text-[#64748B]">Selling Costs</div><div class="font-extrabold">${escapeHtml(formatInr(s.totalSellingCosts))}</div></div>
                    <div class="rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] p-2"><div class="text-[10px] text-[#15803D]">Received</div><div class="font-extrabold text-[#14532D]">${escapeHtml(formatInr(s.received))}</div></div>
                    <div class="rounded-xl ${s.pendingDue > 0 ? "bg-amber-50 border-amber-200" : "bg-[#F8FAFC] border-[#E2E8F0]"} border p-2"><div class="text-[10px] text-[#64748B]">Net Pending</div><div class="font-extrabold">${escapeHtml(formatInr(s.pendingDue))}</div></div>
                  </div>

                  <!-- Neutral Selling Price Comparison -->
                  <div class="rounded-xl bg-[#F8FAFC] border border-[#D9EAE0] p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <div class="text-[10px] font-extrabold uppercase text-[#15803D]">Govt MSP Comparison (Informational)</div>
                      ${s.mspMatch ? `
                        <div class="font-bold text-[#0F172A] mt-0.5">MSP: ${escapeHtml(formatInr(s.mspMatch.mspPerQuintal))}/q (${escapeHtml(s.mspMatch.season)})</div>
                        <div class="text-[11px] text-[#475569]">Difference vs MSP: <strong>${s.mspDiff >= 0 ? "+" : ""}${escapeHtml(formatInr(s.mspDiff))}/q</strong> (Open-market sale; MSP applies only to notified govt procurement)</div>
                      ` : `<div class="text-[11px] text-[#64748B] mt-0.5">No central MSP notified for "${escapeHtml(sale.cropName)}".</div>`}
                    </div>
                    <div>
                      <div class="text-[10px] font-extrabold uppercase text-[#15803D]">Verified Market Reference</div>
                      ${s.marketMatch ? `
                        <div class="font-bold text-[#0F172A] mt-0.5">${escapeHtml(formatInr(s.marketMatch.modalPrice))}/q (${escapeHtml(s.marketMatch.marketName)})</div>
                        <div class="text-[11px] text-[#475569]">Difference: <strong>${s.marketDiff >= 0 ? "+" : ""}${escapeHtml(formatInr(s.marketDiff))}/q</strong> • Date: ${escapeHtml(s.marketMatch.reportDate || "Verified")}</div>
                      ` : `<div class="text-[11px] text-[#64748B] mt-0.5">No verified mandi rate loaded for this crop yet. Refresh official mandi prices below.</div>`}
                    </div>
                  </div>
                </article>
              `;
            }).join("")}
          </section>
        </div>
      ` : renderAuthGateCard("Sign In to Log Your Personal Crop Sales", "Sign in with Google to save crop sale bills, calculate selling costs, and compare your rates privately. Public MSP & verified market reference tables are available below.")}

      <!-- Part B: Separate Market Price Information Sections -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- 1. Official Govt MSP Section -->
        <section class="gv-card p-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="text-sm sm:text-base font-extrabold text-[#14532D]">Government Minimum Support Price (MSP)</h3>
              <p class="text-[11px] text-[#475569]">Source: ${escapeHtml(OFFICIAL_MSP_REFERENCE.sourceName)} • Verified: ${escapeHtml(OFFICIAL_MSP_REFERENCE.lastVerifiedDate)}</p>
            </div>
            <a href="${escapeHtml(safeUrl(OFFICIAL_MSP_REFERENCE.sourceUrl))}" target="_blank" rel="noopener noreferrer" class="text-xs font-extrabold text-[#15803D] underline">CACP Portal ↗</a>
          </div>
          <div class="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-950">
            ${escapeHtml(OFFICIAL_MSP_REFERENCE.procurementNote)}
          </div>
          <div class="overflow-x-auto max-h-72 overflow-y-auto border border-[#E2E8F0] rounded-xl">
            <table class="w-full text-left text-xs">
              <thead class="bg-[#ECFDF5] text-[#14532D] sticky top-0">
                <tr><th class="px-3 py-2 font-extrabold">Crop</th><th class="px-3 py-2 font-extrabold">Season</th><th class="px-3 py-2 font-extrabold text-right">MSP (₹/Quintal)</th></tr>
              </thead>
              <tbody class="divide-y divide-[#E2E8F0]">
                ${OFFICIAL_MSP_REFERENCE.crops.map((c) => `
                  <tr class="hover:bg-[#F8FAFC]">
                    <td class="px-3 py-2 font-bold text-[#0F172A]">${escapeHtml(c.crop)} <span class="text-[#64748B] font-normal">(${escapeHtml(c.cropBn)})</span></td>
                    <td class="px-3 py-2 text-[#475569]">${escapeHtml(c.season)}</td>
                    <td class="px-3 py-2 font-extrabold text-[#14532D] text-right">${escapeHtml(formatInr(c.mspPerQuintal))}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </section>

        <!-- 2. Live Agricultural Mandi Prices & Local / Historical Records -->
        <section class="gv-card p-5 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 class="text-sm sm:text-base font-extrabold text-[#14532D]">Verified Agricultural Mandi &amp; Local Prices</h3>
              <p class="text-[11px] text-[#475569]">Official AGMARKNET (data.gov.in) + Admin-verified local mandi records</p>
            </div>
            <div class="flex gap-2">
              <button data-action="refresh-mandi" type="button" class="px-3 py-1.5 rounded-lg bg-[#ECFDF5] border border-[#BBF7D0] text-xs font-extrabold text-[#14532D]">
                ${state.mandiLoading ? "Refreshing..." : "Refresh Live Rates"}
              </button>
              <button data-nav="market" type="button" class="px-3 py-1.5 rounded-lg bg-[#14532D] text-white text-xs font-extrabold">Full Mandi View →</button>
            </div>
          </div>

          ${(mandiRecords.length === 0 && firestorePrices.length === 0) ? `
            <div class="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-xs text-[#475569] space-y-1.5">
              <div class="font-extrabold text-[#0F172A]">Live Market Data Currently Unavailable</div>
              <p>${escapeHtml(state.mandiStatusMessage || "Tap 'Refresh Live Rates' to query the official AGMARKNET serverless proxy, or check the full Crop Market Price page for official Agmarknet/e-NAM links. Guru Ji Vision never invents fake mandi prices.")}</p>
            </div>
          ` : `
            <div class="overflow-x-auto max-h-72 overflow-y-auto border border-[#E2E8F0] rounded-xl">
              <table class="w-full text-left text-xs">
                <thead class="bg-[#ECFDF5] text-[#14532D] sticky top-0">
                  <tr><th class="px-3 py-2 font-extrabold">Commodity</th><th class="px-3 py-2 font-extrabold">Market &amp; Source</th><th class="px-3 py-2 font-extrabold text-right">Modal Price</th><th class="px-3 py-2 font-extrabold">Date</th></tr>
                </thead>
                <tbody class="divide-y divide-[#E2E8F0]">
                  ${[...firestorePrices.slice(0, 15).map((r) => ({
                    crop: r.cropName,
                    market: `${r.marketName}, ${r.district}`,
                    source: r.sourceName,
                    modal: r.modalPrice,
                    unit: r.unit || "₹/Quintal",
                    date: r.reportDate
                  })), ...mandiRecords.slice(0, 20).map((r) => ({
                    crop: r.commodity || r.cropName,
                    market: `${r.market || r.marketName}, ${r.district || ""}`,
                    source: r.source || "AGMARKNET",
                    modal: r.modalPrice,
                    unit: r.unit || "₹/Quintal",
                    date: r.arrivalDate || r.reportDate
                  }))].map((row) => `
                    <tr class="hover:bg-[#F8FAFC]">
                      <td class="px-3 py-2 font-bold text-[#0F172A]">${escapeHtml(row.crop)}</td>
                      <td class="px-3 py-2 text-[#475569]"><div>${escapeHtml(row.market)}</div><div class="text-[10px] text-[#15803D]">${escapeHtml(row.source)}</div></td>
                      <td class="px-3 py-2 font-extrabold text-[#14532D] text-right">${escapeHtml(formatInr(row.modal))} <span class="text-[10px] font-normal">${escapeHtml(row.unit)}</span></td>
                      <td class="px-3 py-2 text-[11px] text-[#64748B]">${escapeHtml(row.date || "Verified")}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          `}

          <!-- Farmer's Own Historical Price Records -->
          ${sales.length > 0 ? `
            <div class="pt-2 border-t border-[#E2E8F0]">
              <div class="text-xs font-extrabold text-[#14532D] mb-1.5">Your Historical Selling Prices (Local Record)</div>
              <div class="flex flex-wrap gap-1.5">
                ${sales.slice(0, 8).map((sl) => `
                  <span class="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#BBF7D0] text-[11px] font-bold text-[#14532D]">
                    ${escapeHtml(sl.cropName)}: ${escapeHtml(formatInr(sl.sellingPricePerUnit))}/${escapeHtml(sl.priceUnit)} (${escapeHtml(sl.sellingDate)})
                  </span>
                `).join("")}
              </div>
            </div>
          ` : ""}
        </section>
      </div>
    </div>
  `;
}
