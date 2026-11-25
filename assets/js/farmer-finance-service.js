// ============================================================================
// Guru Ji Vision — Farmer Financial Support & Rights Firestore & Storage Layer
// Reuses the single existing Firebase App / Auth / Firestore / Storage instance
// from firebaseService. NEVER initializes a second Firebase app.
// Strictly owner-scoped via authenticated Firebase UID (farmerUid).
// ============================================================================

import { firebaseService } from "./firebase-service.js";
import { compressImageFileToBase64, getTimestampMs } from "./calculators.js";

class FarmerFinanceService {
  constructor() {
    this.unsubs = new Map();
    this.subscribedUid = null;
  }

  get ready() {
    return Boolean(firebaseService.ready && firebaseService.db && firebaseService.mods);
  }

  setSub(key, unsub) {
    const prev = this.unsubs.get(key);
    if (typeof prev === "function") {
      try { prev(); } catch (_) {}
    }
    if (typeof unsub === "function") {
      this.unsubs.set(key, unsub);
    } else {
      this.unsubs.delete(key);
    }
  }

  clearSubs() {
    for (const unsub of this.unsubs.values()) {
      try { unsub(); } catch (_) {}
    }
    this.unsubs.clear();
    this.subscribedUid = null;
  }

  // --------------------------------------------------------------------------
  // REAL-TIME OWNER-SCOPED SUBSCRIPTIONS
  // --------------------------------------------------------------------------
  subscribeFarmerFinance(uid, onUpdate) {
    if (!this.ready || !uid) {
      this.clearSubs();
      return;
    }
    if (this.subscribedUid === uid && this.unsubs.size > 0) return;
    this.clearSubs();
    this.subscribedUid = uid;
    const { collection, query, where, limit, onSnapshot } = firebaseService.mods.fsMod;
    const db = firebaseService.db;

    const specs = [
      ["leases", "farmer_land_leases", 150],
      ["loans", "farmer_loan_records", 150],
      ["loanTransactions", "farmer_loan_transactions", 400],
      ["cropSales", "farmer_crop_sales", 300],
      ["expenses", "farmer_expenses", 500],
      ["complaints", "farmer_complaints", 150],
      ["documents", "farmer_documents", 250],
      ["auditLogs", "farmer_finance_audit_logs", 200],
      ["interestComparisons", "farmer_interest_comparisons", 100]
    ];

    specs.forEach(([stateKey, colName, lim]) => {
      const q = query(collection(db, colName), where("farmerUid", "==", uid), limit(lim));
      this.setSub(
        stateKey,
        onSnapshot(
          q,
          (snap) => {
            const list = snap.docs
              .map((d) => ({
                id: d.id,
                ...d.data(),
                createdAtMs: getTimestampMs(d.data().createdAt),
                updatedAtMs: getTimestampMs(d.data().updatedAt || d.data().createdAt)
              }))
              .sort((a, b) => (b.updatedAtMs || b.createdAtMs) - (a.updatedAtMs || a.createdAtMs));
            onUpdate(stateKey, list);
          },
          (err) => {
            console.warn(`Farmer Finance listener warning (${colName}):`, err?.code || err?.message);
          }
        )
      );
    });
  }

  // --------------------------------------------------------------------------
  // IMMUTABLE AUDIT TRAIL WRITER (Append-Only)
  // --------------------------------------------------------------------------
  async recordAuditLog(uid, { entityType, entityId = "", action, summary }) {
    if (!this.ready || !uid) return;
    try {
      const { collection, addDoc, serverTimestamp } = firebaseService.mods.fsMod;
      await addDoc(collection(firebaseService.db, "farmer_finance_audit_logs"), {
        farmerUid: uid,
        entityType: String(entityType || "RECORD").slice(0, 40),
        entityId: String(entityId || "").slice(0, 128),
        action: String(action || "CREATED").slice(0, 40),
        summary: String(summary || "Financial record updated").trim().slice(0, 260),
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Audit log write skipped:", err?.message);
    }
  }

  // --------------------------------------------------------------------------
  // 1. LAND & LEASE TRANSPARENCY CRUD
  // --------------------------------------------------------------------------
  async saveLandLease(uid, data, editId = "") {
    if (!this.ready || !uid) throw new Error("Please sign in with Google to save land lease records.");
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = firebaseService.mods.fsMod;
    const db = firebaseService.db;

    const leaseType = data.leaseType === "CROP_SHARING" ? "CROP_SHARING" : "FIXED_RENT";
    const totalLeaseAmount = leaseType === "FIXED_RENT" ? Math.max(0, Math.min(100000000, Number(data.totalLeaseAmount) || 0)) : 0;
    const advancePayment = Math.max(0, Math.min(100000000, Number(data.advancePayment) || 0));
    const farmerSharePercent = leaseType === "CROP_SHARING" ? Math.max(0, Math.min(100, Number(data.farmerSharePercent) || 50)) : 100;
    const landownerSharePercent = leaseType === "CROP_SHARING" ? Math.max(0, Math.min(100, Number(data.landownerSharePercent) || (100 - farmerSharePercent))) : 0;

    const base = {
      landownerName: String(data.landownerName || "").trim().slice(0, 100),
      landownerContact: String(data.landownerContact || "").trim().slice(0, 60),
      village: String(data.village || "").trim().slice(0, 80),
      block: String(data.block || "").trim().slice(0, 80),
      district: String(data.district || "").trim().slice(0, 80),
      state: String(data.state || "West Bengal").trim().slice(0, 60),
      landArea: Math.max(0.01, Math.min(100000, Number(data.landArea) || 0.01)),
      areaUnit: String(data.areaUnit || "BIGHA_WB").slice(0, 24),
      startDate: String(data.startDate || "").trim().slice(0, 20),
      endDate: String(data.endDate || "").trim().slice(0, 20),
      leaseType,
      totalLeaseAmount,
      advancePayment,
      paymentFrequency: String(data.paymentFrequency || "SEASONAL").slice(0, 24),
      farmerSharePercent,
      landownerSharePercent,
      cropShareNote: String(data.cropShareNote || "").trim().slice(0, 250),
      isVerbalAgreement: Boolean(data.isVerbalAgreement),
      verbalNotes: String(data.verbalNotes || "").trim().slice(0, 600),
      legalVerificationStatus: "UNVERIFIED_USER_RECORD",
      status: data.status === "ARCHIVED" ? "ARCHIVED" : (data.status === "COMPLETED" ? "COMPLETED" : "ACTIVE"),
      updatedAt: serverTimestamp()
    };

    if (!base.landownerName || base.landownerName.length < 2) {
      throw new Error("Please enter the landowner name (at least 2 characters).");
    }
    if (!base.startDate || !base.endDate) {
      throw new Error("Please provide both lease start date and end date.");
    }

    if (editId) {
      await updateDoc(doc(db, "farmer_land_leases", editId), base);
      await this.recordAuditLog(uid, {
        entityType: "LAND_LEASE",
        entityId: editId,
        action: "UPDATED",
        summary: `Updated ${leaseType} lease with ${base.landownerName} (${base.landArea} ${base.areaUnit}).`
      });
      return editId;
    } else {
      const ref = await addDoc(collection(db, "farmer_land_leases"), {
        ...base,
        farmerUid: uid,
        paymentHistory: [],
        createdAt: serverTimestamp()
      });
      await this.recordAuditLog(uid, {
        entityType: "LAND_LEASE",
        entityId: ref.id,
        action: "CREATED",
        summary: `Registered ${leaseType} lease with ${base.landownerName} (${base.landArea} ${base.areaUnit}, ₹${totalLeaseAmount}).`
      });
      return ref.id;
    }
  }

  async addLeasePayment(uid, lease, payment) {
    if (!this.ready || !uid || !lease?.id) throw new Error("Please sign in to record a lease payment.");
    const { doc, updateDoc, serverTimestamp } = firebaseService.mods.fsMod;
    const amt = Math.max(1, Math.min(100000000, Number(payment.amount) || 0));
    const entry = {
      id: `lp_${Date.now()}`,
      amount: amt,
      paymentDate: String(payment.paymentDate || new Date().toISOString().slice(0, 10)).slice(0, 20),
      mode: String(payment.mode || "CASH").slice(0, 30),
      note: String(payment.note || "").trim().slice(0, 200),
      recordedAtIso: new Date().toISOString().slice(0, 19)
    };
    const nextHistory = [...(Array.isArray(lease.paymentHistory) ? lease.paymentHistory : []), entry].slice(-100);
    await updateDoc(doc(firebaseService.db, "farmer_land_leases", lease.id), {
      paymentHistory: nextHistory,
      updatedAt: serverTimestamp()
    });
    await this.recordAuditLog(uid, {
      entityType: "LAND_LEASE",
      entityId: lease.id,
      action: "PAYMENT_LOGGED",
      summary: `Recorded lease payment of ₹${amt} to ${lease.landownerName} on ${entry.paymentDate}.`
    });
  }

  async archiveLandLease(uid, leaseId, landownerName) {
    if (!this.ready || !uid || !leaseId) throw new Error("Sign in required.");
    const { doc, updateDoc, serverTimestamp } = firebaseService.mods.fsMod;
    await updateDoc(doc(firebaseService.db, "farmer_land_leases", leaseId), {
      status: "ARCHIVED",
      updatedAt: serverTimestamp()
    });
    await this.recordAuditLog(uid, {
      entityType: "LAND_LEASE",
      entityId: leaseId,
      action: "ARCHIVED",
      summary: `Archived land lease record for ${landownerName || leaseId} (preserved in history).`
    });
  }

  // --------------------------------------------------------------------------
  // 2. LOAN & DEBT MANAGEMENT CRUD (Immutable Repayments + Debt Comparison)
  // --------------------------------------------------------------------------
  async saveLoanRecord(uid, data, editId = "") {
    if (!this.ready || !uid) throw new Error("Please sign in with Google to save loan records.");
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = firebaseService.mods.fsMod;
    const db = firebaseService.db;

    const principalAmount = Math.max(1, Math.min(100000000, Number(data.principalAmount) || 0));
    const interestRatePercent = Math.max(0, Math.min(120, Number(data.interestRatePercent) || 0));
    const repaymentPeriodMonths = Math.max(1, Math.min(600, parseInt(data.repaymentPeriodMonths, 10) || 12));
    const interestMethod = data.interestMethod === "COMPOUND" ? "COMPOUND" : "SIMPLE";
    const compoundingFrequencyPerYear = interestMethod === "COMPOUND"
      ? ([1, 2, 4, 12].includes(Number(data.compoundingFrequencyPerYear)) ? Number(data.compoundingFrequencyPerYear) : 1)
      : 1;

    const base = {
      lenderName: String(data.lenderName || "").trim().slice(0, 100),
      lenderType: ["BANK_KCC", "COOPERATIVE", "SHG_MFI", "PRIVATE_LENDER", "RELATIVE_OTHER"].includes(data.lenderType)
        ? data.lenderType
        : "BANK_KCC",
      principalAmount,
      loanDate: String(data.loanDate || "").trim().slice(0, 20),
      purpose: String(data.purpose || "").trim().slice(0, 160),
      interestRatePercent,
      interestMethod,
      compoundingFrequencyPerYear,
      repaymentPeriodMonths,
      installmentFrequency: String(data.installmentFrequency || "MONTHLY").slice(0, 24),
      scheduleType: ["FIXED", "IRREGULAR", "PARTIAL_FLEXIBLE"].includes(data.scheduleType) ? data.scheduleType : "FIXED",
      nextDueDate: String(data.nextDueDate || "").trim().slice(0, 20),
      notes: String(data.notes || "").trim().slice(0, 500),
      status: ["ACTIVE", "CLOSED", "DISPUTED", "ARCHIVED"].includes(data.status) ? data.status : "ACTIVE",
      updatedAt: serverTimestamp()
    };

    if (data.farmerCalculatedBalance !== "" && data.farmerCalculatedBalance !== undefined && data.farmerCalculatedBalance !== null) {
      base.farmerCalculatedBalance = Math.max(0, Math.min(500000000, Number(data.farmerCalculatedBalance) || 0));
    }
    if (data.lenderClaimedAmount !== "" && data.lenderClaimedAmount !== undefined && data.lenderClaimedAmount !== null) {
      base.lenderClaimedAmount = Math.max(0, Math.min(500000000, Number(data.lenderClaimedAmount) || 0));
    }
    if (data.discrepancyNotes) {
      base.discrepancyNotes = String(data.discrepancyNotes).trim().slice(0, 500);
    }

    if (!base.lenderName || base.lenderName.length < 2) {
      throw new Error("Please enter the lender name (bank, cooperative, or person).");
    }
    if (!base.loanDate) {
      throw new Error("Please select the loan start date.");
    }

    if (editId) {
      await updateDoc(doc(db, "farmer_loan_records", editId), base);
      await this.recordAuditLog(uid, {
        entityType: "LOAN",
        entityId: editId,
        action: "UPDATED",
        summary: `Updated loan record with ${base.lenderName} (Principal ₹${principalAmount}, ${interestRatePercent}% ${interestMethod}).`
      });
      return editId;
    } else {
      const ref = await addDoc(collection(db, "farmer_loan_records"), {
        ...base,
        farmerUid: uid,
        createdAt: serverTimestamp()
      });
      await this.recordAuditLog(uid, {
        entityType: "LOAN",
        entityId: ref.id,
        action: "CREATED",
        summary: `Registered loan of ₹${principalAmount} from ${base.lenderName} at ${interestRatePercent}% (${interestMethod}).`
      });
      return ref.id;
    }
  }

  async updateLoanDebtComparison(uid, loanId, { farmerCalculatedBalance, lenderClaimedAmount, discrepancyNotes, lenderName }) {
    if (!this.ready || !uid || !loanId) throw new Error("Sign in required.");
    const { doc, updateDoc, serverTimestamp } = firebaseService.mods.fsMod;
    const fBal = Math.max(0, Math.min(500000000, Number(farmerCalculatedBalance) || 0));
    const lClaim = Math.max(0, Math.min(500000000, Number(lenderClaimedAmount) || 0));
    await updateDoc(doc(firebaseService.db, "farmer_loan_records", loanId), {
      farmerCalculatedBalance: fBal,
      lenderClaimedAmount: lClaim,
      discrepancyNotes: String(discrepancyNotes || "").trim().slice(0, 500),
      updatedAt: serverTimestamp()
    });
    await this.recordAuditLog(uid, {
      entityType: "LOAN_COMPARISON",
      entityId: loanId,
      action: "COMPARISON_UPDATED",
      summary: `Debt comparison updated for ${lenderName || loanId}: Farmer Est ₹${fBal} vs Lender Claimed ₹${lClaim}.`
    });
  }

  async addLoanRepayment(uid, loan, tx) {
    if (!this.ready || !uid || !loan?.id) throw new Error("Sign in required to record loan repayment.");
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = firebaseService.mods.fsMod;
    const db = firebaseService.db;

    const amount = Math.max(1, Math.min(100000000, Number(tx.amount) || 0));
    const principalPortion = Math.max(0, Math.min(amount, Number(tx.principalPortion) || 0));
    const interestPortion = Math.max(0, Math.min(amount, Number(tx.interestPortion) || 0));
    const paymentDate = String(tx.paymentDate || new Date().toISOString().slice(0, 10)).slice(0, 20);
    const paymentType = ["INSTALLMENT", "PARTIAL", "IRREGULAR", "FULL_SETTLEMENT"].includes(tx.paymentType)
      ? tx.paymentType
      : "PARTIAL";

    const ref = await addDoc(collection(db, "farmer_loan_transactions"), {
      farmerUid: uid,
      loanId: loan.id,
      lenderName: String(loan.lenderName || "").slice(0, 100),
      amount,
      principalPortion,
      interestPortion,
      paymentDate,
      paymentType,
      paymentMode: String(tx.paymentMode || "CASH").slice(0, 30),
      receiptRef: String(tx.receiptRef || "").trim().slice(0, 120),
      note: String(tx.note || "").trim().slice(0, 300),
      status: "RECORDED",
      createdAt: serverTimestamp()
    });

    if (tx.nextDueDate) {
      await updateDoc(doc(db, "farmer_loan_records", loan.id), {
        nextDueDate: String(tx.nextDueDate).slice(0, 20),
        updatedAt: serverTimestamp()
      });
    }

    await this.recordAuditLog(uid, {
      entityType: "LOAN_REPAYMENT",
      entityId: ref.id,
      action: "REPAYMENT_RECORDED",
      summary: `Recorded ${paymentType} loan repayment of ₹${amount} to ${loan.lenderName} on ${paymentDate}.`
    });
    return ref.id;
  }

  // --------------------------------------------------------------------------
  // 3. FAIR CROP MARKET & SELLING CRUD
  // --------------------------------------------------------------------------
  async saveCropSale(uid, data, editId = "") {
    if (!this.ready || !uid) throw new Error("Please sign in with Google to save crop sale records.");
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = firebaseService.mods.fsMod;
    const db = firebaseService.db;

    const quantityHarvested = Math.max(0, Math.min(1000000, Number(data.quantityHarvested) || 0));
    const quantitySold = Math.max(0.01, Math.min(1000000, Number(data.quantitySold) || 0));
    const sellingPricePerUnit = Math.max(0.01, Math.min(10000000, Number(data.sellingPricePerUnit) || 0));
    const transportCost = Math.max(0, Math.min(10000000, Number(data.transportCost) || 0));
    const marketCommission = Math.max(0, Math.min(10000000, Number(data.marketCommission) || 0));
    const otherExpenses = Math.max(0, Math.min(10000000, Number(data.otherExpenses) || 0));
    const totalAmountReceived = Math.max(0, Math.min(500000000, Number(data.totalAmountReceived) || 0));

    const base = {
      cropName: String(data.cropName || "").trim().slice(0, 80),
      cropVariety: String(data.cropVariety || "").trim().slice(0, 80),
      season: ["KHARIF", "RABI", "BORO_ZAID", "ANNUAL"].includes(data.season) ? data.season : "KHARIF",
      landLabel: String(data.landLabel || "").trim().slice(0, 100),
      harvestDate: String(data.harvestDate || "").trim().slice(0, 20),
      sellingDate: String(data.sellingDate || new Date().toISOString().slice(0, 10)).trim().slice(0, 20),
      quantityHarvested,
      quantitySold,
      priceUnit: ["QUINTAL", "KG", "TON"].includes(data.priceUnit) ? data.priceUnit : "QUINTAL",
      sellingPricePerUnit,
      buyerName: String(data.buyerName || "").trim().slice(0, 100),
      marketLocation: String(data.marketLocation || "").trim().slice(0, 100),
      transportCost,
      marketCommission,
      otherExpenses,
      totalAmountReceived,
      paymentStatus: ["PAID", "PARTIAL", "PENDING"].includes(data.paymentStatus) ? data.paymentStatus : "PAID",
      notes: String(data.notes || "").trim().slice(0, 400),
      status: data.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
      updatedAt: serverTimestamp()
    };

    if (!base.cropName || base.cropName.length < 2) {
      throw new Error("Please enter the crop name.");
    }
    if (!base.buyerName || base.buyerName.length < 2) {
      throw new Error("Please enter the buyer or mandi trader name.");
    }

    if (editId) {
      await updateDoc(doc(db, "farmer_crop_sales", editId), base);
      await this.recordAuditLog(uid, {
        entityType: "CROP_SALE",
        entityId: editId,
        action: "UPDATED",
        summary: `Updated sale of ${quantitySold} ${base.priceUnit} ${base.cropName} to ${base.buyerName} (₹${sellingPricePerUnit}/${base.priceUnit}).`
      });
      return editId;
    } else {
      const ref = await addDoc(collection(db, "farmer_crop_sales"), {
        ...base,
        farmerUid: uid,
        createdAt: serverTimestamp()
      });
      await this.recordAuditLog(uid, {
        entityType: "CROP_SALE",
        entityId: ref.id,
        action: "CREATED",
        summary: `Logged sale of ${quantitySold} ${base.priceUnit} ${base.cropName} to ${base.buyerName} @ ₹${sellingPricePerUnit}/${base.priceUnit}.`
      });
      return ref.id;
    }
  }

  // --------------------------------------------------------------------------
  // 4. FARMER INCOME & EXPENSE MANAGER CRUD
  // --------------------------------------------------------------------------
  async saveFarmExpense(uid, data, editId = "") {
    if (!this.ready || !uid) throw new Error("Please sign in with Google to save farming expenses.");
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = firebaseService.mods.fsMod;
    const db = firebaseService.db;

    const amount = Math.max(0.01, Math.min(100000000, Number(data.amount) || 0));
    const allowedCats = [
      "SEEDS", "FERTILIZERS", "PESTICIDES", "LABOUR", "IRRIGATION",
      "MACHINERY", "FUEL", "LAND_LEASE", "TRANSPORTATION", "ELECTRICITY", "OTHER", "CUSTOM"
    ];
    const category = allowedCats.includes(data.category) ? data.category : "OTHER";
    const customCategory = category === "CUSTOM" ? String(data.customCategory || "Custom Expense").trim().slice(0, 60) : "";

    const base = {
      category,
      customCategory,
      amount,
      expenseDate: String(data.expenseDate || new Date().toISOString().slice(0, 10)).trim().slice(0, 20),
      description: String(data.description || "").trim().slice(0, 300),
      cropName: String(data.cropName || "").trim().slice(0, 80),
      season: ["KHARIF", "RABI", "BORO_ZAID", "ANNUAL"].includes(data.season) ? data.season : "KHARIF",
      landLabel: String(data.landLabel || "").trim().slice(0, 100),
      receiptDocumentId: String(data.receiptDocumentId || "").trim().slice(0, 128),
      status: data.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
      updatedAt: serverTimestamp()
    };

    if (!base.description || base.description.length < 2) {
      throw new Error("Please enter a short description for this farming expense.");
    }

    if (editId) {
      await updateDoc(doc(db, "farmer_expenses", editId), base);
      await this.recordAuditLog(uid, {
        entityType: "EXPENSE",
        entityId: editId,
        action: "UPDATED",
        summary: `Updated expense ₹${amount} (${customCategory || category}) for ${base.cropName || "General"}.`
      });
      return editId;
    } else {
      const ref = await addDoc(collection(db, "farmer_expenses"), {
        ...base,
        farmerUid: uid,
        createdAt: serverTimestamp()
      });
      await this.recordAuditLog(uid, {
        entityType: "EXPENSE",
        entityId: ref.id,
        action: "CREATED",
        summary: `Recorded farming expense ₹${amount} (${customCategory || category}) — ${base.description.slice(0, 60)}.`
      });
      return ref.id;
    }
  }

  // --------------------------------------------------------------------------
  // 5. FARMER RIGHTS & COMPLAINT SUPPORT CRUD
  // --------------------------------------------------------------------------
  async submitComplaint(uid, data) {
    if (!this.ready || !uid) throw new Error("Please sign in with Google to submit and store a farmer support issue.");
    const { collection, addDoc, serverTimestamp } = firebaseService.mods.fsMod;

    const allowedCats = [
      "LAND_LEASE_DISPUTE", "UNCLEAR_RENTAL_AGREEMENT", "LOAN_REPAYMENT_DISAGREEMENT",
      "INTEREST_CALCULATION_DISPUTE", "CROP_PAYMENT_DELAY", "CROP_SELLING_DISPUTE", "GOVT_SCHEME_ISSUE"
    ];
    const category = allowedCats.includes(data.category) ? data.category : "LAND_LEASE_DISPUTE";
    const description = String(data.description || "").trim().slice(0, 1500);
    if (description.length < 10) {
      throw new Error("Please describe your issue clearly (at least 10 characters).");
    }

    const ref = await addDoc(collection(firebaseService.db, "farmer_complaints"), {
      farmerUid: uid,
      category,
      description,
      incidentDate: String(data.incidentDate || new Date().toISOString().slice(0, 10)).slice(0, 20),
      contactPreference: ["WHATSAPP", "PHONE", "EMAIL", "IN_APP_ONLY"].includes(data.contactPreference)
        ? data.contactPreference
        : "IN_APP_ONLY",
      contactValue: String(data.contactValue || "").trim().slice(0, 80),
      supportingDocumentIds: Array.isArray(data.supportingDocumentIds) ? data.supportingDocumentIds.slice(0, 10) : [],
      status: "SUBMITTED",
      supportNote: "",
      reviewDisclaimer: "Stored in your private record; not yet reviewed by an official support team or legal authority.",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await this.recordAuditLog(uid, {
      entityType: "COMPLAINT",
      entityId: ref.id,
      action: "SUBMITTED",
      summary: `Submitted farmer rights issue (${category}) dated ${data.incidentDate || "today"}.`
    });
    return ref.id;
  }

  // --------------------------------------------------------------------------
  // 6. DOCUMENT UPLOAD & PRIVATE VAULT (Storage + Safe Small-File Fallback)
  // --------------------------------------------------------------------------
  async uploadFarmerDocument(uid, { file, title, docType, relatedEntityType = "GENERAL", relatedEntityId = "", docDate = "", notes = "" }) {
    if (!this.ready || !uid) throw new Error("Please sign in with Google to upload private financial documents.");
    if (!file) throw new Error("Please choose a photo or PDF file first.");

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isImage && !isPdf) {
      throw new Error("Only photographs (JPG, PNG, WebP) and PDF documents are supported.");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File size exceeds 5 MB limit. Please choose a smaller photo or compressed PDF.");
    }

    let storagePath = "";
    let downloadUrl = "";
    let inlineDataUrl = "";
    let storageMode = "FIREBASE_STORAGE";

    // Attempt Firebase Storage upload first (owner-scoped path)
    if (firebaseService.storage && firebaseService.mods.storageMod) {
      try {
        const { ref, uploadBytes, getDownloadURL } = firebaseService.mods.storageMod;
        const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80)}`;
        storagePath = `farmer_documents/${uid}/${safeName}`;
        const storageRef = ref(firebaseService.storage, storagePath);
        await uploadBytes(storageRef, file, { contentType: file.type || (isPdf ? "application/pdf" : "image/jpeg") });
        downloadUrl = await getDownloadURL(storageRef);
      } catch (storageErr) {
        console.warn("Firebase Storage upload fallback triggered:", storageErr?.code || storageErr?.message);
        storagePath = "";
        downloadUrl = "";
      }
    }

    // Safe resilient fallback for receipt photos (compressed JPEG <= 320KB) or small PDFs (<= 220KB)
    if (!downloadUrl) {
      if (isImage) {
        const b64 = await compressImageFileToBase64(file);
        inlineDataUrl = `data:image/jpeg;base64,${b64}`;
        storageMode = "FIRESTORE_INLINE_PRIVATE";
      } else if (isPdf && file.size <= 220 * 1024) {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("Could not read PDF file."));
          reader.onload = () => resolve(String(reader.result || ""));
          reader.readAsDataURL(file);
        });
        if (dataUrl.length <= 340000) {
          inlineDataUrl = dataUrl;
          storageMode = "FIRESTORE_INLINE_PRIVATE";
        } else {
          throw new Error("PDF is too large for inline private vault without Firebase Storage enabled. Compress the PDF under 200 KB or enable Firebase Storage rules.");
        }
      } else {
        throw new Error("Firebase Storage is not accepting uploads for files > 220 KB right now. Please compress the PDF under 200 KB or upload a photo of the document.");
      }
    }

    const { collection, addDoc, serverTimestamp } = firebaseService.mods.fsMod;
    const allowedDocTypes = [
      "LEASE_AGREEMENT", "PAYMENT_RECEIPT", "LOAN_DOCUMENT",
      "CROP_SALE_RECEIPT", "EXPENSE_BILL", "COMPLAINT_EVIDENCE", "SCHEME_DOCUMENT"
    ];
    const cleanType = allowedDocTypes.includes(docType) ? docType : "PAYMENT_RECEIPT";
    const cleanTitle = String(title || file.name || "Financial Document").trim().slice(0, 120);

    const docRef = await addDoc(collection(firebaseService.db, "farmer_documents"), {
      farmerUid: uid,
      title: cleanTitle,
      docType: cleanType,
      fileName: String(file.name || "document").slice(0, 120),
      mimeType: String(file.type || (isPdf ? "application/pdf" : "image/jpeg")).slice(0, 60),
      fileSizeBytes: Math.max(1, Number(file.size) || 1),
      relatedEntityType: String(relatedEntityType || "GENERAL").slice(0, 40),
      relatedEntityId: String(relatedEntityId || "").slice(0, 128),
      docDate: String(docDate || new Date().toISOString().slice(0, 10)).slice(0, 20),
      notes: String(notes || "").trim().slice(0, 300),
      storageMode,
      storagePath: storagePath.slice(0, 300),
      downloadUrl: downloadUrl.slice(0, 600),
      inlineDataUrl,
      legalVerificationStatus: "UNVERIFIED_USER_UPLOAD",
      status: "ACTIVE",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await this.recordAuditLog(uid, {
      entityType: "DOCUMENT",
      entityId: docRef.id,
      action: "UPLOADED",
      summary: `Uploaded ${cleanType}: ${cleanTitle} (${Math.round(file.size / 1024)} KB).`
    });

    return { id: docRef.id, title: cleanTitle, downloadUrl, inlineDataUrl };
  }

  // --------------------------------------------------------------------------
  // 7. PRIVATE BANK VS PRIVATE LENDER INTEREST RATE COMPARISONS
  // --------------------------------------------------------------------------
  async saveInterestComparison(uid, data) {
    if (!this.ready || !uid) throw new Error("Please sign in with Google to save interest rate comparisons privately.");
    const { collection, addDoc, serverTimestamp } = firebaseService.mods.fsMod;

    const principalAmount = Math.max(1000, Math.min(100000000, Number(data.principalAmount) || 0));
    const durationMonths = Math.max(1, Math.min(360, parseInt(data.durationMonths, 10) || 12));
    const privateInterestRate = Math.max(0, Math.min(200, Number(data.privateInterestRate) || 0));
    const additionalFees = Math.max(0, Math.min(10000000, Number(data.additionalFees) || 0));
    const amountAlreadyRepaid = Math.max(0, Math.min(100000000, Number(data.amountAlreadyRepaid) || 0));

    const payload = {
      farmerUid: uid,
      bankProductId: String(data.bankProductId || "sbi_kcc_crop").slice(0, 60),
      bankName: String(data.bankName || "Agricultural Bank").trim().slice(0, 120),
      bankLoanType: String(data.bankLoanType || "KCC").trim().slice(0, 140),
      applySubvention: Boolean(data.applySubvention),
      privateLenderName: String(data.privateLenderName || "Private Lender / Landowner").trim().slice(0, 100),
      principalAmount,
      durationMonths,
      privateInterestRate,
      privateRatePeriod: data.privateRatePeriod === "ANNUAL" ? "ANNUAL" : "MONTHLY",
      privateInterestMethod: data.privateInterestMethod === "COMPOUND" ? "COMPOUND" : "SIMPLE",
      privateCompoundingPerYear: [1, 2, 4, 12].includes(Number(data.privateCompoundingPerYear)) ? Number(data.privateCompoundingPerYear) : 12,
      repaymentSchedule: ["MONTHLY", "QUARTERLY", "YEARLY", "LUMP_SUM"].includes(data.repaymentSchedule) ? data.repaymentSchedule : "LUMP_SUM",
      additionalFees,
      amountAlreadyRepaid,
      bankTotalInterest: Math.max(0, Math.min(500000000, Number(data.bankTotalInterest) || 0)),
      bankTotalRepayment: Math.max(0, Math.min(600000000, Number(data.bankTotalRepayment) || 0)),
      bankEffectiveAnnualCostPercent: Math.max(0, Math.min(1000, Number(data.bankEffectiveAnnualCostPercent) || 0)),
      privateTotalBorrowingCost: Math.max(0, Math.min(500000000, Number(data.privateTotalBorrowingCost) || 0)),
      privateTotalRepayment: Math.max(0, Math.min(600000000, Number(data.privateTotalRepayment) || 0)),
      privateEffectiveAnnualCostPercent: Math.max(0, Math.min(10000, Number(data.privateEffectiveAnnualCostPercent) || 0)),
      interestCostDifference: Math.max(-500000000, Math.min(500000000, Number(data.interestCostDifference) || 0)),
      bankRateVerifiedDate: String(data.bankRateVerifiedDate || "2026-03-15").slice(0, 20),
      notes: String(data.notes || "").trim().slice(0, 300),
      createdAt: serverTimestamp()
    };

    const ref = await addDoc(collection(firebaseService.db, "farmer_interest_comparisons"), payload);
    await this.recordAuditLog(uid, {
      entityType: "INTEREST_COMPARISON",
      entityId: ref.id,
      action: "SAVED",
      summary: `Saved Bank vs Private comparison: ${payload.bankName} (${payload.bankEffectiveAnnualCostPercent}% EABC) vs ${payload.privateLenderName} (${payload.privateEffectiveAnnualCostPercent}% EABC) on ₹${principalAmount}.`
    });
    return ref.id;
  }
}

export const farmerFinanceService = new FarmerFinanceService();
