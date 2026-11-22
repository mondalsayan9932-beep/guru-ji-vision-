// ============================================================================
// Guru Ji Vision — Farmer Financial Support & Rights Controller
// Handles all user interactions, validation, duplicate guards, draft auto-save,
// secure file uploads, CSV/PDF reports & document viewing cleanly.
// ============================================================================

import { farmerFinanceService } from "./farmer-finance-service.js";
import {
  clearFormDraft,
  computeLeaseSummary,
  computeLoanSummary,
  computeCropSaleSummary,
  openPrintablePdfReport,
  saveFormDraft,
  triggerCsvDownload
} from "./farmer-finance-data.js";
import { escapeHtml, safeUrl } from "./calculators.js";

export function createInitialFarmerFinanceState() {
  return {
    subTab: "overview",
    leaseFormType: "FIXED_RENT",
    expenseFormCategory: "SEEDS",
    expenseFilterCategory: "ALL",
    pnlCrop: "ALL",
    pnlSeason: "ALL",
    pnlLand: "ALL",
    pnlIncludeLease: false,
    schemeFilter: "ALL",
    docSearch: "",
    reportDateFrom: "",
    reportDateTo: "",
    // Private owner-only cloud collections (strictly cleared on logout)
    leases: [],
    loans: [],
    loanTransactions: [],
    cropSales: [],
    expenses: [],
    complaints: [],
    documents: [],
    auditLogs: []
  };
}

export function clearFarmerFinancePrivateState(state) {
  farmerFinanceService.clearSubs();
  if (!state.farmerFinance) {
    state.farmerFinance = createInitialFarmerFinanceState();
    return;
  }
  state.farmerFinance.leases = [];
  state.farmerFinance.loans = [];
  state.farmerFinance.loanTransactions = [];
  state.farmerFinance.cropSales = [];
  state.farmerFinance.expenses = [];
  state.farmerFinance.complaints = [];
  state.farmerFinance.documents = [];
  state.farmerFinance.auditLogs = [];
}

function filterByDateRange(items, dateField, from, to) {
  return (items || []).filter((item) => {
    const val = String(item[dateField] || "");
    if (!val) return true;
    if (from && val < from) return false;
    if (to && val > to) return false;
    return true;
  });
}

function serializeFormData(form) {
  const fd = new FormData(form);
  const obj = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") obj[k] = v;
  }
  form.querySelectorAll("input[type='checkbox']").forEach((cb) => {
    obj[cb.name] = cb.checked;
  });
  return obj;
}

function openDocumentPreview(docRecord, showToast) {
  if (!docRecord) {
    showToast("Document record not found.", true);
    return;
  }
  const url = safeUrl(docRecord.downloadUrl);
  const inline = String(docRecord.inlineDataUrl || "");
  const isImage = (docRecord.mimeType || "").startsWith("image/") || inline.startsWith("data:image/");

  const modal = document.getElementById("readerModal");
  const titleEl = document.getElementById("readerModalTitle");
  const metaEl = document.getElementById("readerModalMeta");
  const bodyEl = document.getElementById("readerModalBody");
  const linkEl = document.getElementById("readerExternalLink");

  if (modal && titleEl && metaEl && bodyEl && linkEl) {
    titleEl.textContent = docRecord.title || "Private Financial Document";
    metaEl.textContent = `${docRecord.docType || "DOCUMENT"} • ${docRecord.docDate || ""} • Private Owner-Only Vault (User Upload — Not Legally Verified)`;
    if (isImage && (url || inline)) {
      bodyEl.innerHTML = `<div class="space-y-3">
        <img src="${escapeHtml(url || inline)}" alt="${escapeHtml(docRecord.title || "Document")}" class="max-w-full rounded-xl border border-[#E2E8F0] mx-auto" />
        ${docRecord.notes ? `<p class="text-xs text-[#475569]"><strong>Notes:</strong> ${escapeHtml(docRecord.notes)}</p>` : ""}
      </div>`;
    } else if (url || inline.startsWith("data:application/pdf;base64,")) {
      bodyEl.innerHTML = `<div class="space-y-3">
        <iframe src="${escapeHtml(url || inline)}" class="w-full h-[65vh] rounded-xl border border-[#E2E8F0]" title="PDF Preview"></iframe>
        ${docRecord.notes ? `<p class="text-xs text-[#475569]"><strong>Notes:</strong> ${escapeHtml(docRecord.notes)}</p>` : ""}
      </div>`;
    } else {
      bodyEl.innerHTML = `<p class="text-xs text-rose-700">Unable to preview this file format in-browser.</p>`;
    }
    if (url) {
      linkEl.href = url;
      linkEl.textContent = "Open / Download File ↗";
      linkEl.classList.remove("hidden");
    } else if (inline) {
      linkEl.href = inline;
      linkEl.setAttribute("download", docRecord.fileName || "farmer-document");
      linkEl.textContent = "Download File";
      linkEl.classList.remove("hidden");
    } else {
      linkEl.classList.add("hidden");
    }
    modal.classList.remove("hidden");
    return;
  }

  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    showToast("Document preview unavailable.", true);
  }
}

export function bindFarmerFinanceEvents({ state, renderActiveView, showToast, withBusySubmit, openAuthModal, loadOfficialMandiData }) {
  // Click delegation
  document.addEventListener("click", (e) => {
    const tabBtn = e.target.closest("[data-ff-tab]");
    if (tabBtn) {
      const nextTab = tabBtn.dataset.ffTab;
      state.farmerFinance.subTab = nextTab;
      if (state.route !== "farmer-finance") {
        state.route = "farmer-finance";
      }
      renderActiveView();
      if (nextTab === "market-sales" && !state.mandiFetchedOnce && typeof loadOfficialMandiData === "function") {
        loadOfficialMandiData(false);
      }
      return;
    }

    const leaseTypeBtn = e.target.closest("[data-ff-lease-type]");
    if (leaseTypeBtn) {
      state.farmerFinance.leaseFormType = leaseTypeBtn.dataset.ffLeaseType === "CROP_SHARING" ? "CROP_SHARING" : "FIXED_RENT";
      renderActiveView();
      return;
    }

    const schemeFilterBtn = e.target.closest("[data-ff-scheme-filter]");
    if (schemeFilterBtn) {
      state.farmerFinance.schemeFilter = schemeFilterBtn.dataset.ffSchemeFilter || "ALL";
      renderActiveView();
      return;
    }

    const viewDocBtn = e.target.closest("[data-ff-view-doc]");
    if (viewDocBtn) {
      const docId = viewDocBtn.dataset.ffViewDoc;
      const docRec = (state.farmerFinance?.documents || []).find((d) => d.id === docId);
      openDocumentPreview(docRec, showToast);
      return;
    }

    const actionBtn = e.target.closest("[data-ff-action]");
    if (!actionBtn) return;
    const action = actionBtn.dataset.ffAction;
    const ff = state.farmerFinance;

    if (action === "save-draft") {
      const formEl = document.getElementById(actionBtn.dataset.draftForm);
      const key = actionBtn.dataset.draftKey;
      if (formEl && key) {
        saveFormDraft(state.user?.uid, key, serializeFormData(formEl));
        showToast("Draft saved safely on your device! You can continue anytime.");
      }
      return;
    }

    if (action === "clear-draft") {
      clearFormDraft(state.user?.uid, actionBtn.dataset.draftKey);
      renderActiveView();
      showToast("Saved draft cleared.");
      return;
    }

    // Exports & Printable PDF Reports
    const leases = filterByDateRange((ff.leases || []).filter((l) => l.status !== "ARCHIVED"), "startDate", ff.reportDateFrom, ff.reportDateTo);
    const loans = filterByDateRange((ff.loans || []).filter((l) => l.status !== "ARCHIVED"), "loanDate", ff.reportDateFrom, ff.reportDateTo);
    const loanTx = filterByDateRange(ff.loanTransactions || [], "paymentDate", ff.reportDateFrom, ff.reportDateTo);
    const sales = filterByDateRange((ff.cropSales || []).filter((s) => s.status !== "ARCHIVED"), "sellingDate", ff.reportDateFrom, ff.reportDateTo);
    const expenses = filterByDateRange((ff.expenses || []).filter((ex) => ex.status !== "ARCHIVED"), "expenseDate", ff.reportDateFrom, ff.reportDateTo);
    const complaints = ff.complaints || [];

    if (action === "print-full-pdf" || action === "print-lease-pdf") {
      const ok = openPrintablePdfReport({
        title: action === "print-lease-pdf" ? "Land & Lease Summary Report" : "Complete Farmer Financial Summary",
        farmerName: state.userProfile?.displayName || state.user?.displayName || "Farmer",
        villageDistrict: [state.userProfile?.institutionOrVillage, state.userProfile?.district].filter(Boolean).join(", "),
        dateFrom: ff.reportDateFrom,
        dateTo: ff.reportDateTo,
        leases,
        loans: action === "print-lease-pdf" ? [] : loans,
        loanTransactions: action === "print-lease-pdf" ? [] : loanTx,
        sales: action === "print-lease-pdf" ? [] : sales,
        expenses: action === "print-lease-pdf" ? [] : expenses,
        complaints: action === "print-lease-pdf" ? [] : complaints
      });
      if (!ok) showToast("Please allow pop-ups in your browser to open the printable PDF summary.", true);
      return;
    }

    if (action === "export-leases-csv") {
      triggerCsvDownload(
        "guruji-vision-land-leases.csv",
        ["Landowner", "Contact", "Village", "Block", "District", "State", "Area", "Unit", "Type", "Start Date", "End Date", "Total Rent", "Total Paid", "Remaining", "Verbal Agreement", "Verification Status"],
        leases.map((l) => {
          const s = computeLeaseSummary(l);
          return [l.landownerName, l.landownerContact, l.village, l.block, l.district, l.state, l.landArea, l.areaUnit, l.leaseType, l.startDate, l.endDate, s.totalLease, s.totalPaid, s.remainingPayment, l.isVerbalAgreement ? "Yes (Unverified)" : "No", "User Record (Not Legally Verified)"];
        })
      );
      showToast("Land leases CSV downloaded.");
      return;
    }

    if (action === "export-loans-csv") {
      triggerCsvDownload(
        "guruji-vision-loans.csv",
        ["Lender", "Type", "Date", "Purpose", "Principal", "Rate %", "Method", "Repaid", "App Est. Interest", "App Est. Remaining", "Farmer Calc Balance", "Lender Claimed", "Difference"],
        loans.map((ln) => {
          const s = computeLoanSummary(ln, ff.loanTransactions || []);
          return [ln.lenderName, ln.lenderType, ln.loanDate, ln.purpose, s.principal, s.annualRate, s.method, s.totalRepaid, s.accruedInterestEstimate, s.remainingEstimatedAmount, s.farmerOwnBalance, s.lenderClaimed ?? "", s.claimDifference ?? ""];
        })
      );
      showToast("Loans CSV downloaded.");
      return;
    }

    if (action === "export-sales-csv") {
      triggerCsvDownload(
        "guruji-vision-crop-sales.csv",
        ["Selling Date", "Crop", "Variety", "Season", "Land Plot", "Qty Sold", "Unit", "Price/Unit", "Buyer", "Gross", "Selling Costs", "Received", "Pending", "Payment Status"],
        sales.map((sl) => {
          const s = computeCropSaleSummary(sl);
          return [sl.sellingDate, sl.cropName, sl.cropVariety, sl.season, sl.landLabel, s.qtySold, s.unit, s.pricePerUnit, sl.buyerName, s.grossAmount, s.totalSellingCosts, s.received, s.pendingDue, sl.paymentStatus];
        })
      );
      showToast("Crop sales CSV downloaded.");
      return;
    }

    if (action === "export-expenses-csv") {
      triggerCsvDownload(
        "guruji-vision-farm-expenses.csv",
        ["Date", "Category", "Crop", "Season", "Land Plot", "Description", "Amount"],
        expenses.map((ex) => [ex.expenseDate, ex.category === "CUSTOM" ? ex.customCategory : ex.category, ex.cropName, ex.season, ex.landLabel, ex.description, ex.amount])
      );
      showToast("Farming expenses CSV downloaded.");
      return;
    }

    if (action === "export-audit-csv") {
      triggerCsvDownload(
        "guruji-vision-finance-audit-trail.csv",
        ["Entity Type", "Action", "Summary", "Recorded Date"],
        (ff.auditLogs || []).map((a) => [a.entityType, a.action, a.summary, a.createdAtMs ? new Date(a.createdAtMs).toISOString() : ""])
      );
      showToast("Audit trail CSV downloaded.");
      return;
    }

    if (action === "export-all-csv") {
      triggerCsvDownload(
        "guruji-vision-all-farmer-records.csv",
        ["Record Type", "Date", "Party / Crop / Category", "Amount / Principal", "Details"],
        [
          ...leases.map((l) => ["LAND_LEASE", l.startDate, l.landownerName, l.totalLeaseAmount, `${l.leaseType} • ${l.landArea} ${l.areaUnit} • ${l.village}`]),
          ...loans.map((ln) => ["LOAN", ln.loanDate, ln.lenderName, ln.principalAmount, `${ln.interestRatePercent}% ${ln.interestMethod} • ${ln.purpose}`]),
          ...loanTx.map((tx) => ["LOAN_REPAYMENT", tx.paymentDate, tx.lenderName, tx.amount, `${tx.paymentType} (${tx.paymentMode})`]),
          ...sales.map((sl) => ["CROP_SALE", sl.sellingDate, sl.cropName, sl.totalAmountReceived, `${sl.quantitySold} ${sl.priceUnit} @ ₹${sl.sellingPricePerUnit} to ${sl.buyerName}`]),
          ...expenses.map((ex) => ["EXPENSE", ex.expenseDate, ex.category === "CUSTOM" ? ex.customCategory : ex.category, ex.amount, `${ex.description} (${ex.cropName || "General"})`])
        ]
      );
      showToast("Combined farmer financial ledger CSV downloaded.");
    }
  });

  // Input / Change delegation for filters & category toggles
  document.addEventListener("change", (e) => {
    const id = e.target?.id;
    if (!id) return;
    const ff = state.farmerFinance;

    if (id === "ffExpenseCategorySelect") {
      ff.expenseFormCategory = e.target.value;
      const wrap = document.getElementById("ffCustomCategoryWrap");
      if (wrap) wrap.classList.toggle("hidden", e.target.value !== "CUSTOM");
      return;
    }
    if (id === "ffExpenseFilterCat") { ff.expenseFilterCategory = e.target.value; renderActiveView(); return; }
    if (id === "ffPnlCrop") { ff.pnlCrop = e.target.value; renderActiveView(); return; }
    if (id === "ffPnlSeason") { ff.pnlSeason = e.target.value; renderActiveView(); return; }
    if (id === "ffPnlLand") { ff.pnlLand = e.target.value; renderActiveView(); return; }
    if (id === "ffReportDateFrom") { ff.reportDateFrom = e.target.value; renderActiveView(); return; }
    if (id === "ffReportDateTo") { ff.reportDateTo = e.target.value; renderActiveView(); return; }
  });

  document.addEventListener("input", (e) => {
    if (e.target?.id === "ffDocSearch") {
      state.farmerFinance.docSearch = e.target.value;
      renderActiveView();
    }
  });

  // Form submit delegation
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (!form) return;

    const isFarmerFinanceForm =
      ["ffLeaseForm", "ffLoanForm", "ffCropSaleForm", "ffExpenseForm", "ffComplaintForm", "ffUploadDocForm"].includes(form.id) ||
      form.classList.contains("ff-lease-payment-form") ||
      form.classList.contains("ff-loan-repay-form") ||
      form.classList.contains("ff-loan-compare-form");

    if (!isFarmerFinanceForm) return;
    e.preventDefault();

    if (!state.user) {
      showToast("Please sign in with Google to save private farmer financial records.", true);
      openAuthModal();
      return;
    }

    const uid = state.user.uid;
    const ff = state.farmerFinance;

    try {
      // 1. Save Land Lease
      if (form.id === "ffLeaseForm") {
        await withBusySubmit(form, async () => {
          const data = serializeFormData(form);
          const duplicate = (ff.leases || []).find(
            (l) => l.status !== "ARCHIVED" &&
              l.landownerName.toLowerCase() === String(data.landownerName || "").trim().toLowerCase() &&
              l.startDate === data.startDate &&
              String(l.landArea) === String(data.landArea)
          );
          if (duplicate && !window.confirm("A similar lease record with the same landowner, area, and start date already exists. Save anyway?")) {
            return;
          }

          const leaseId = await farmerFinanceService.saveLandLease(uid, data);
          const fileInput = form.querySelector("input[name='leaseFile']");
          if (fileInput?.files?.[0]) {
            await farmerFinanceService.uploadFarmerDocument(uid, {
              file: fileInput.files[0],
              title: `Lease Agreement — ${data.landownerName}`,
              docType: "LEASE_AGREEMENT",
              relatedEntityType: "LAND_LEASE",
              relatedEntityId: leaseId,
              docDate: data.startDate
            });
          }
          clearFormDraft(uid, "lease");
          form.reset();
          showToast("Land lease record saved securely to your private vault!");
        });
        return;
      }

      // 1B. Record Lease Payment
      if (form.classList.contains("ff-lease-payment-form")) {
        await withBusySubmit(form, async () => {
          const leaseId = form.dataset.leaseId;
          const lease = (ff.leases || []).find((l) => l.id === leaseId);
          if (!lease) throw new Error("Lease record not found.");
          const data = serializeFormData(form);
          await farmerFinanceService.addLeasePayment(uid, lease, data);
          const fileInput = form.querySelector("input[name='receiptFile']");
          if (fileInput?.files?.[0]) {
            await farmerFinanceService.uploadFarmerDocument(uid, {
              file: fileInput.files[0],
              title: `Lease Payment Receipt — ${lease.landownerName} (₹${data.amount})`,
              docType: "PAYMENT_RECEIPT",
              relatedEntityType: "LAND_LEASE",
              relatedEntityId: leaseId,
              docDate: data.paymentDate
            });
          }
          form.reset();
          showToast("Lease payment recorded!");
        });
        return;
      }

      // 2. Save Loan Record
      if (form.id === "ffLoanForm") {
        await withBusySubmit(form, async () => {
          const data = serializeFormData(form);
          const duplicate = (ff.loans || []).find(
            (ln) => ln.status !== "ARCHIVED" &&
              ln.lenderName.toLowerCase() === String(data.lenderName || "").trim().toLowerCase() &&
              ln.loanDate === data.loanDate &&
              Number(ln.principalAmount) === Number(data.principalAmount)
          );
          if (duplicate && !window.confirm("A loan with the same lender, date, and principal amount already exists. Save anyway?")) {
            return;
          }
          const loanId = await farmerFinanceService.saveLoanRecord(uid, data);
          const fileInput = form.querySelector("input[name='loanFile']");
          if (fileInput?.files?.[0]) {
            await farmerFinanceService.uploadFarmerDocument(uid, {
              file: fileInput.files[0],
              title: `Loan Document — ${data.lenderName}`,
              docType: "LOAN_DOCUMENT",
              relatedEntityType: "LOAN",
              relatedEntityId: loanId,
              docDate: data.loanDate
            });
          }
          clearFormDraft(uid, "loan");
          form.reset();
          showToast("Loan record saved! Estimates updated automatically.");
        });
        return;
      }

      // 2B. Record Loan Repayment (Immutable History)
      if (form.classList.contains("ff-loan-repay-form")) {
        await withBusySubmit(form, async () => {
          const loanId = form.dataset.loanId;
          const loan = (ff.loans || []).find((ln) => ln.id === loanId);
          if (!loan) throw new Error("Loan record not found.");
          const data = serializeFormData(form);
          await farmerFinanceService.addLoanRepayment(uid, loan, data);
          const fileInput = form.querySelector("input[name='receiptFile']");
          if (fileInput?.files?.[0]) {
            await farmerFinanceService.uploadFarmerDocument(uid, {
              file: fileInput.files[0],
              title: `Loan Repayment Receipt — ${loan.lenderName} (₹${data.amount})`,
              docType: "PAYMENT_RECEIPT",
              relatedEntityType: "LOAN",
              relatedEntityId: loanId,
              docDate: data.paymentDate
            });
          }
          form.reset();
          showToast("Repayment recorded permanently in your loan history!");
        });
        return;
      }

      // 2C. Update Side-by-Side Debt Comparison
      if (form.classList.contains("ff-loan-compare-form")) {
        await withBusySubmit(form, async () => {
          const loanId = form.dataset.loanId;
          const loan = (ff.loans || []).find((ln) => ln.id === loanId);
          const data = serializeFormData(form);
          await farmerFinanceService.updateLoanDebtComparison(uid, loanId, {
            ...data,
            lenderName: loan?.lenderName || ""
          });
          const fileInput = form.querySelector("input[name='proofFile']");
          if (fileInput?.files?.[0]) {
            await farmerFinanceService.uploadFarmerDocument(uid, {
              file: fileInput.files[0],
              title: `Debt Comparison Proof — ${loan?.lenderName || "Loan"}`,
              docType: "LOAN_DOCUMENT",
              relatedEntityType: "LOAN",
              relatedEntityId: loanId
            });
          }
          showToast("Debt comparison saved side-by-side!");
        });
        return;
      }

      // 3. Save Crop Sale Record
      if (form.id === "ffCropSaleForm") {
        await withBusySubmit(form, async () => {
          const data = serializeFormData(form);
          const saleId = await farmerFinanceService.saveCropSale(uid, data);
          const fileInput = form.querySelector("input[name='saleReceiptFile']");
          if (fileInput?.files?.[0]) {
            await farmerFinanceService.uploadFarmerDocument(uid, {
              file: fileInput.files[0],
              title: `Crop Sale Receipt — ${data.cropName} (${data.buyerName})`,
              docType: "CROP_SALE_RECEIPT",
              relatedEntityType: "CROP_SALE",
              relatedEntityId: saleId,
              docDate: data.sellingDate
            });
          }
          clearFormDraft(uid, "sale");
          form.reset();
          showToast("Crop sale record saved & compared against reference prices!");
        });
        return;
      }

      // 4. Save Farming Expense
      if (form.id === "ffExpenseForm") {
        await withBusySubmit(form, async () => {
          const data = serializeFormData(form);
          const fileInput = form.querySelector("input[name='expenseReceiptFile']");
          let receiptDocId = "";
          if (fileInput?.files?.[0]) {
            const uploaded = await farmerFinanceService.uploadFarmerDocument(uid, {
              file: fileInput.files[0],
              title: `Expense Bill — ${data.customCategory || data.category} (₹${data.amount})`,
              docType: "EXPENSE_BILL",
              relatedEntityType: "EXPENSE",
              docDate: data.expenseDate
            });
            receiptDocId = uploaded.id;
          }
          await farmerFinanceService.saveFarmExpense(uid, { ...data, receiptDocumentId: receiptDocId });
          clearFormDraft(uid, "expense");
          form.reset();
          ff.expenseFormCategory = "SEEDS";
          showToast("Farming expense recorded!");
        });
        return;
      }

      // 5. Submit Farmer Rights / Complaint Issue
      if (form.id === "ffComplaintForm") {
        await withBusySubmit(form, async () => {
          const data = serializeFormData(form);
          const fileInput = form.querySelector("input[name='complaintFile']");
          const docIds = [];
          if (fileInput?.files?.[0]) {
            const uploaded = await farmerFinanceService.uploadFarmerDocument(uid, {
              file: fileInput.files[0],
              title: `Complaint Evidence — ${data.category}`,
              docType: "COMPLAINT_EVIDENCE",
              relatedEntityType: "COMPLAINT",
              docDate: data.incidentDate
            });
            docIds.push(uploaded.id);
          }
          await farmerFinanceService.submitComplaint(uid, { ...data, supportingDocumentIds: docIds });
          clearFormDraft(uid, "complaint");
          form.reset();
          showToast("Issue stored securely in your private record (marked Submitted — Not Yet Officially Reviewed).");
        });
        return;
      }

      // 6. Upload Private Financial Document
      if (form.id === "ffUploadDocForm") {
        await withBusySubmit(form, async () => {
          const data = serializeFormData(form);
          const fileInput = form.querySelector("input[name='docFile']");
          if (!fileInput?.files?.[0]) throw new Error("Please select a photo or PDF file.");
          await farmerFinanceService.uploadFarmerDocument(uid, {
            file: fileInput.files[0],
            title: data.title,
            docType: data.docType,
            docDate: data.docDate,
            notes: data.notes
          });
          form.reset();
          showToast("Document uploaded to your private owner-only vault!");
        });
      }
    } catch (err) {
      console.error("Farmer Finance operation failed:", err);
      showToast(err?.message || "Could not save record. You can tap 'Save Draft' so your data is never lost.", true);
    }
  });
}
