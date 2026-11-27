// ============================================================================
// GURU JI VISION — WOMEN FARMER NEARBY SERVICES & SHG CONTROLLER (PHASE 5)
// ============================================================================
// Manages:
// 1. GPS-independent 6-digit PIN Code search via /.netlify/functions/nearby-services-lookup
// 2. Optional GPS helper (gracefully handles disabled/denied GPS without blocking)
// 3. List View / Map View switching & map marker focus
// 4. Surrounding PIN Code click-to-search
// 5. Contributor business & SHG submission (strictly PENDING_REVIEW)
// 6. Admin Nearby Services & SHG verification / CRUD in Women Farmer CMS
// ============================================================================

import { firebaseService } from "./firebase-service.js";
import { validatePinCode } from "./women-nearby-data.js";

export function createInitialWomenNearbyState() {
  return {
    pinInput: "",
    activePin: "",
    pinError: "",
    category: "ALL",
    search: "",
    viewMode: "LIST", // "LIST" | "MAP"
    selectedMapId: "",
    loading: false,
    apiResult: null,
    gpsCoords: null,
    gpsStatus: "",
    showSubmitForm: false,
    // SHG Search state
    shgPin: "",
    shgDistrict: "ALL",
    shgSearch: "",
    showShgSubmitForm: false
  };
}

export function bindWomenNearbyEvents({
  state,
  renderActiveView,
  showToast,
  withBusySubmit,
  openAuthModal
}) {
  const ensureNb = () => {
    if (!state.womenNearby) state.womenNearby = createInitialWomenNearbyState();
    return state.womenNearby;
  };

  const renderSearchPreservingFocus = (inputId, start, end) => {
    renderActiveView();
    const el = document.getElementById(inputId);
    if (el) {
      el.focus();
      if (typeof start === "number" && typeof end === "number") {
        try { el.setSelectionRange(start, end); } catch (_) {}
      }
    }
  };

  const runPinLookup = async (rawPin) => {
    const nb = ensureNb();
    const bn = (state.womenFarmer?.lang || (state.lang === "bn" ? "BN" : "EN")) === "BN";
    const check = validatePinCode(rawPin);
    nb.pinInput = String(rawPin || "").trim();
    if (!check.valid) {
      nb.pinError = bn ? check.errorBn : check.errorEn;
      nb.activePin = "";
      nb.apiResult = null;
      renderActiveView();
      return;
    }

    nb.pinError = "";
    nb.activePin = check.pin;
    nb.loading = true;
    nb.selectedMapId = "";
    renderActiveView();

    try {
      const res = await fetch(`/.netlify/functions/nearby-services-lookup?pin=${encodeURIComponent(check.pin)}`);
      const data = await res.json();
      if (res.ok && data?.ok) {
        nb.apiResult = data;
      } else {
        nb.apiResult = { ok: false, pinCode: check.pin, liveListings: [], error: data?.error || "" };
      }
    } catch {
      // Offline / local preview fallback: verified Firestore listings & surrounding PIN suggestions still work!
      nb.apiResult = { ok: false, pinCode: check.pin, liveListings: [] };
    } finally {
      nb.loading = false;
      renderActiveView();
    }
  };

  // CLICK EVENTS
  document.addEventListener("click", async (e) => {
    const target = e.target.closest(
      "[data-wf-quick-pin], [data-wf-nearby-clear-pin], [data-wf-nearby-view], " +
      "[data-wf-nearby-cat], [data-wf-focus-map], [data-wf-toggle-nearby-submit], " +
      "#wfNearbyUseGpsBtn, [data-wf-shg-quick-pin], [data-wf-toggle-shg-submit], " +
      "[data-open-wcms-section], [data-wcms-verify-nearby], [data-wcms-edit-nearby], " +
      "[data-wcms-del-nearby], #awnCancelEdit, [data-wcms-verify-shg], " +
      "[data-wcms-edit-shg], [data-wcms-del-shg], #awsCancelEdit"
    );
    if (!target) return;
    const nb = ensureNb();

    // Support direct Admin CMS section jump (e.g., nearby-admin / shg-admin)
    if (target.dataset.openWcmsSection) {
      if (state.womenCms) state.womenCms.section = target.dataset.openWcmsSection;
    }

    // 1. Quick PIN / Surrounding PIN click
    if (target.dataset.wfQuickPin) {
      await runPinLookup(target.dataset.wfQuickPin);
      return;
    }

    if (target.dataset.wfNearbyClearPin) {
      nb.pinInput = "";
      nb.activePin = "";
      nb.pinError = "";
      nb.apiResult = null;
      nb.selectedMapId = "";
      renderActiveView();
      return;
    }

    // 2. List / Map View toggle & Focus marker on Map
    if (target.dataset.wfNearbyView) {
      nb.viewMode = target.dataset.wfNearbyView === "MAP" ? "MAP" : "LIST";
      renderActiveView();
      return;
    }
    if (target.dataset.wfFocusMap) {
      nb.selectedMapId = target.dataset.wfFocusMap;
      nb.viewMode = "MAP";
      renderActiveView();
      document.querySelector('[data-wf-nearby-map="1"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // 3. Category filter
    if (target.dataset.wfNearbyCat) {
      nb.category = target.dataset.wfNearbyCat;
      renderActiveView();
      return;
    }

    // 4. Optional GPS button (strictly optional — never blocks PIN Code search!)
    if (target.id === "wfNearbyUseGpsBtn") {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        nb.gpsStatus = "GPS is unavailable on this browser/device. PIN Code search works fully without GPS.";
        renderActiveView();
        return;
      }
      nb.gpsStatus = "Checking optional GPS location...";
      renderActiveView();
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          nb.gpsCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          nb.gpsStatus = `Optional GPS active (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}) — reliable distances shown where shop coordinates exist.`;
          renderActiveView();
        },
        () => {
          nb.gpsCoords = null;
          nb.gpsStatus = "GPS disabled or permission denied — no problem! Enter your 6-digit PIN Code to search without GPS.";
          renderActiveView();
        },
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
      );
      return;
    }

    // 5. Toggle contributor forms
    if (target.dataset.wfToggleNearbySubmit) {
      nb.showSubmitForm = !nb.showSubmitForm;
      renderActiveView();
      return;
    }
    if (target.dataset.wfToggleShgSubmit) {
      nb.showShgSubmitForm = !nb.showShgSubmitForm;
      renderActiveView();
      return;
    }
    if (target.dataset.wfShgQuickPin) {
      nb.shgPin = target.dataset.wfShgQuickPin;
      renderActiveView();
      return;
    }

    // 6. Admin Nearby Services Verification / Edit / Delete
    if (target.id === "awnCancelEdit") {
      document.getElementById("adminNearbyForm")?.reset();
      const el = document.getElementById("awnEditId");
      if (el) el.value = "";
      target.classList.add("hidden");
      return;
    }
    if (target.dataset.wcmsVerifyNearby) {
      if (!state.isAdmin) { showToast("Admin permissions required.", true); return; }
      const id = target.dataset.wcmsVerifyNearby;
      const status = target.dataset.status || "ADMIN_VERIFIED";
      const pub = target.dataset.pub === "1";
      try {
        await firebaseService.verifyNearbyServiceListing(state.user.uid, id, { verificationStatus: status, published: pub });
        showToast(status === "ADMIN_VERIFIED" ? (pub ? "Listing verified & published!" : "Listing verified (unpublished draft).") : `Listing marked ${status}.`);
      } catch (err) {
        showToast(err.message || "Unable to update listing status.", true);
      }
      return;
    }
    if (target.dataset.wcmsEditNearby) {
      const item = (state.nearbyServiceListings || []).find((x) => x.id === target.dataset.wcmsEditNearby);
      if (!item) return;
      const setV = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ""; };
      setV("awnEditId", item.id);
      setV("awnName", item.name);
      setV("awnNameBn", item.nameBn);
      setV("awnCategory", item.category);
      setV("awnPin", item.pinCode);
      setV("awnAddress", item.address);
      setV("awnArea", item.area);
      setV("awnDistrict", item.district);
      setV("awnPhone", item.phone);
      setV("awnLat", item.lat ?? "");
      setV("awnLng", item.lng ?? "");
      setV("awnNotes", item.notes);
      const pubEl = document.getElementById("awnPublished");
      if (pubEl) pubEl.checked = item.published !== false;
      document.getElementById("awnCancelEdit")?.classList.remove("hidden");
      document.getElementById("adminNearbyForm")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    if (target.dataset.wcmsDelNearby) {
      if (!state.isAdmin) return;
      if (!window.confirm("Delete this Nearby Service listing permanently?")) return;
      try {
        await firebaseService.deleteNearbyServiceListing(target.dataset.wcmsDelNearby);
        showToast("Listing deleted.");
      } catch (err) {
        showToast(err.message || "Unable to delete listing.", true);
      }
      return;
    }

    // 7. Admin SHG Directory Verification / Edit / Delete
    if (target.id === "awsCancelEdit") {
      document.getElementById("adminShgForm")?.reset();
      const el = document.getElementById("awsEditId");
      if (el) el.value = "";
      target.classList.add("hidden");
      return;
    }
    if (target.dataset.wcmsVerifyShg) {
      if (!state.isAdmin) { showToast("Admin permissions required.", true); return; }
      const id = target.dataset.wcmsVerifyShg;
      const status = target.dataset.status || "ADMIN_VERIFIED";
      const pub = target.dataset.pub === "1";
      try {
        await firebaseService.verifyShgDirectoryListing(state.user.uid, id, { verificationStatus: status, published: pub });
        showToast(status === "ADMIN_VERIFIED" ? (pub ? "SHG verified & published!" : "SHG unpublished.") : `SHG marked ${status}.`);
      } catch (err) {
        showToast(err.message || "Unable to update SHG status.", true);
      }
      return;
    }
    if (target.dataset.wcmsEditShg) {
      const shg = (state.shgDirectoryListings || []).find((x) => x.id === target.dataset.wcmsEditShg);
      if (!shg) return;
      const setV = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ""; };
      setV("awsEditId", shg.id);
      setV("awsName", shg.shgName);
      setV("awsNameBn", shg.shgNameBn);
      setV("awsArea", shg.area);
      setV("awsDistrict", shg.district);
      setV("awsAddress", shg.address);
      setV("awsPin", shg.pinCode);
      setV("awsContactName", shg.contactName);
      setV("awsContactPhone", shg.contactPhone);
      setV("awsActivities", (shg.activities || []).join(", "));
      setV("awsServices", (shg.services || []).join(", "));
      setV("awsEnterprise", shg.entrepreneurshipInfo);
      setV("awsGovtSupport", shg.govtSupport);
      const pubEl = document.getElementById("awsPublished");
      if (pubEl) pubEl.checked = shg.published !== false;
      document.getElementById("awsCancelEdit")?.classList.remove("hidden");
      document.getElementById("adminShgForm")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    if (target.dataset.wcmsDelShg) {
      if (!state.isAdmin) return;
      if (!window.confirm("Delete this SHG listing permanently?")) return;
      try {
        await firebaseService.deleteShgDirectoryListing(target.dataset.wcmsDelShg);
        showToast("SHG listing deleted.");
      } catch (err) {
        showToast(err.message || "Unable to delete SHG listing.", true);
      }
    }
  });

  // INPUT & CHANGE EVENTS
  document.addEventListener("input", (e) => {
    const nb = ensureNb();
    if (e.target.id === "wfNearbyPinInput") {
      nb.pinInput = e.target.value;
      return;
    }
    if (e.target.id === "wfNearbySearch") {
      const s = e.target.selectionStart, en = e.target.selectionEnd;
      nb.search = e.target.value;
      renderSearchPreservingFocus("wfNearbySearch", s, en);
      return;
    }
    if (e.target.id === "wfShgPinInput") {
      const s = e.target.selectionStart, en = e.target.selectionEnd;
      nb.shgPin = e.target.value;
      renderSearchPreservingFocus("wfShgPinInput", s, en);
      return;
    }
    if (e.target.id === "wfShgSearchInput") {
      const s = e.target.selectionStart, en = e.target.selectionEnd;
      nb.shgSearch = e.target.value;
      renderSearchPreservingFocus("wfShgSearchInput", s, en);
    }
  });

  document.addEventListener("change", (e) => {
    const nb = ensureNb();
    if (e.target.id === "wfShgDistrict") {
      nb.shgDistrict = e.target.value || "ALL";
      renderActiveView();
    }
  });

  // FORM SUBMISSIONS
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (!form) return;
    const nb = ensureNb();

    if (form.id === "wfNearbyPinForm") {
      e.preventDefault();
      const raw = document.getElementById("wfNearbyPinInput")?.value || "";
      await runPinLookup(raw);
      return;
    }

    // Contributor Nearby Business Submission (Strictly PENDING_REVIEW unless Admin)
    if (form.id === "wfNearbySubmitForm") {
      e.preventDefault();
      if (!state.user) { openAuthModal(); return; }
      await withBusySubmit(form, async () => {
        try {
          await firebaseService.saveNearbyServiceListing(
            state.user.uid,
            state.userProfile?.displayName || state.user.displayName || "Contributor",
            {
              name: document.getElementById("wfNbName")?.value,
              nameBn: document.getElementById("wfNbNameBn")?.value,
              category: document.getElementById("wfNbCategory")?.value,
              pinCode: document.getElementById("wfNbPin")?.value,
              address: document.getElementById("wfNbAddress")?.value,
              area: document.getElementById("wfNbArea")?.value,
              district: document.getElementById("wfNbDistrict")?.value,
              state: "West Bengal",
              phone: document.getElementById("wfNbPhone")?.value,
              notes: document.getElementById("wfNbNotes")?.value
            },
            { isAdmin: false }
          );
          form.reset();
          nb.showSubmitForm = false;
          showToast("Submitted! Your local business listing will go live once verified by an Admin.");
          renderActiveView();
        } catch (err) {
          showToast(err.message || "Unable to submit listing.", true);
        }
      });
      return;
    }

    // Contributor SHG Submission (Strictly PENDING_REVIEW)
    if (form.id === "wfShgSubmitForm") {
      e.preventDefault();
      if (!state.user) { openAuthModal(); return; }
      await withBusySubmit(form, async () => {
        try {
          await firebaseService.saveShgDirectoryListing(
            state.user.uid,
            state.userProfile?.displayName || state.user.displayName || "Contributor",
            {
              shgName: document.getElementById("wfShgName")?.value,
              shgNameBn: document.getElementById("wfShgNameBn")?.value,
              area: document.getElementById("wfShgArea")?.value,
              district: document.getElementById("wfShgFormDistrict")?.value,
              state: "West Bengal",
              address: document.getElementById("wfShgAddress")?.value,
              pinCode: document.getElementById("wfShgPin")?.value,
              contactName: document.getElementById("wfShgContactName")?.value,
              contactPhone: document.getElementById("wfShgContactPhone")?.value,
              activities: document.getElementById("wfShgActivities")?.value,
              services: document.getElementById("wfShgServices")?.value,
              entrepreneurshipInfo: document.getElementById("wfShgEnterprise")?.value,
              govtSupport: document.getElementById("wfShgGovtSupport")?.value
            },
            { isAdmin: false }
          );
          form.reset();
          nb.showShgSubmitForm = false;
          showToast("SHG submitted! It will appear publicly after Admin verification.");
          renderActiveView();
        } catch (err) {
          showToast(err.message || "Unable to submit SHG.", true);
        }
      });
      return;
    }

    // Admin Verified Nearby Service Form
    if (form.id === "adminNearbyForm") {
      e.preventDefault();
      if (!state.user || !state.isAdmin) { showToast("Admin access required.", true); return; }
      await withBusySubmit(form, async () => {
        try {
          const editId = document.getElementById("awnEditId")?.value?.trim() || "";
          await firebaseService.saveNearbyServiceListing(
            state.user.uid,
            state.userProfile?.displayName || "Admin",
            {
              name: document.getElementById("awnName")?.value,
              nameBn: document.getElementById("awnNameBn")?.value,
              category: document.getElementById("awnCategory")?.value,
              pinCode: document.getElementById("awnPin")?.value,
              address: document.getElementById("awnAddress")?.value,
              area: document.getElementById("awnArea")?.value,
              district: document.getElementById("awnDistrict")?.value,
              state: "West Bengal",
              phone: document.getElementById("awnPhone")?.value,
              lat: document.getElementById("awnLat")?.value,
              lng: document.getElementById("awnLng")?.value,
              notes: document.getElementById("awnNotes")?.value,
              verificationStatus: "ADMIN_VERIFIED",
              published: Boolean(document.getElementById("awnPublished")?.checked)
            },
            { isAdmin: true, editId }
          );
          form.reset();
          const el = document.getElementById("awnEditId");
          if (el) el.value = "";
          document.getElementById("awnCancelEdit")?.classList.add("hidden");
          showToast(editId ? "Verified business updated!" : "Verified local business saved!");
        } catch (err) {
          showToast(err.message || "Unable to save verified business.", true);
        }
      });
      return;
    }

    // Admin Verified SHG Form
    if (form.id === "adminShgForm") {
      e.preventDefault();
      if (!state.user || !state.isAdmin) { showToast("Admin access required.", true); return; }
      await withBusySubmit(form, async () => {
        try {
          const editId = document.getElementById("awsEditId")?.value?.trim() || "";
          await firebaseService.saveShgDirectoryListing(
            state.user.uid,
            state.userProfile?.displayName || "Admin",
            {
              shgName: document.getElementById("awsName")?.value,
              shgNameBn: document.getElementById("awsNameBn")?.value,
              area: document.getElementById("awsArea")?.value,
              district: document.getElementById("awsDistrict")?.value,
              state: "West Bengal",
              address: document.getElementById("awsAddress")?.value,
              pinCode: document.getElementById("awsPin")?.value,
              contactName: document.getElementById("awsContactName")?.value,
              contactPhone: document.getElementById("awsContactPhone")?.value,
              activities: document.getElementById("awsActivities")?.value,
              services: document.getElementById("awsServices")?.value,
              entrepreneurshipInfo: document.getElementById("awsEnterprise")?.value,
              govtSupport: document.getElementById("awsGovtSupport")?.value,
              verificationStatus: "ADMIN_VERIFIED",
              published: Boolean(document.getElementById("awsPublished")?.checked)
            },
            { isAdmin: true, editId }
          );
          form.reset();
          const el = document.getElementById("awsEditId");
          if (el) el.value = "";
          document.getElementById("awsCancelEdit")?.classList.add("hidden");
          showToast(editId ? "SHG updated!" : "Verified SHG saved!");
        } catch (err) {
          showToast(err.message || "Unable to save SHG.", true);
        }
      });
    }
  });
}
