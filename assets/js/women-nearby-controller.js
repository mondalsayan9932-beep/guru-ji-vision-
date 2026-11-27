// ============================================================================
// GURU JI VISION — WOMEN FARMER NEARBY SERVICES & SHG CONTROLLER (FREE APIs)
// ============================================================================
// Manages:
// 1. GPS-independent 6-digit PIN Code search via Netlify Function with direct
//    India Post API fallback (https://api.postalpincode.in/pincode/{PIN}) so
//    PIN lookup works everywhere without GOOGLE_PLACES_API_KEY.
// 2. Optional GPS helper (gracefully handles disabled/denied GPS).
// 3. List View / Leaflet.js OpenStreetMap Map View toggling for Shops & SHGs.
// 4. SHG Search by PIN Code, District, Block, Village & Keyword.
// 5. Community submission (strictly private PENDING_REVIEW until Admin approves).
// 6. Admin verification, approval, publishing/unpublishing, editing & audit log.
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
    // SHG Search state (PIN, District, Block, Village & Keyword + List/Map View)
    shgPin: "",
    shgDistrict: "ALL",
    shgBlock: "",
    shgVillage: "",
    shgSearch: "",
    shgViewMode: "LIST", // "LIST" | "MAP"
    selectedShgMapId: "",
    showShgSubmitForm: false
  };
}

/**
 * Direct client-side India Post fallback when running in static preview where
 * Netlify Functions are unavailable. Never fabricates PIN details.
 */
async function lookupIndiaPostDirectFallback(pin) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(pin)}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    if (!res.ok) {
      return {
        ok: true,
        pinCode: pin,
        postalFound: false,
        postalNotFound: false,
        postalError: `India Post HTTP ${res.status}`,
        postal: null,
        liveListings: []
      };
    }
    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;
    if (!first || first.Status !== "Success" || !Array.isArray(first.PostOffice) || !first.PostOffice.length) {
      return {
        ok: true,
        pinCode: pin,
        postalFound: false,
        postalNotFound: true,
        postalError: String(first?.Message || "PIN Code not found in India Post directory."),
        postal: null,
        liveListings: []
      };
    }
    const offices = first.PostOffice.slice(0, 12);
    const primary = offices[0];
    const stateName = String(primary.State || "").trim();
    return {
      ok: true,
      pinCode: pin,
      isWestBengal: stateName.toLowerCase().includes("west bengal"),
      postalFound: true,
      postalNotFound: false,
      postalError: "",
      postal: {
        pinCode: pin,
        state: stateName,
        district: String(primary.District || "").trim(),
        block: String(primary.Block || primary.Taluk || "").trim(),
        division: String(primary.Division || "").trim(),
        postOffices: offices.map((po) => String(po.Name || "").trim()).filter(Boolean)
      },
      centerCoords: null,
      liveListings: [],
      apiInfo: {
        googlePlacesConfigured: false,
        activePublicProvider: "India Post PIN API + OpenStreetMap + Admin-Verified Directory",
        setupHint: "Running 100% on free services (India Post PIN API + OpenStreetMap + Admin-Verified Directory). No GOOGLE_PLACES_API_KEY is required."
      }
    };
  } catch (err) {
    return {
      ok: true,
      pinCode: pin,
      postalFound: false,
      postalNotFound: false,
      postalError: err?.message || "India Post API unreachable",
      postal: null,
      liveListings: []
    };
  } finally {
    clearTimeout(timer);
  }
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
      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const data = await res.json();
        if (data?.ok) {
          nb.apiResult = data;
        } else {
          nb.apiResult = await lookupIndiaPostDirectFallback(check.pin);
        }
      } else {
        nb.apiResult = await lookupIndiaPostDirectFallback(check.pin);
      }
    } catch {
      nb.apiResult = await lookupIndiaPostDirectFallback(check.pin);
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
      "[data-wf-shg-view], [data-wf-focus-shg-map], " +
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

    // 1. Quick PIN / Same-District PIN click
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

    // 2. List / Map View toggle & Focus marker on Map (Nearby Services & SHG Search)
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
    if (target.dataset.wfShgView) {
      nb.shgViewMode = target.dataset.wfShgView === "MAP" ? "MAP" : "LIST";
      renderActiveView();
      return;
    }
    if (target.dataset.wfFocusShgMap) {
      nb.selectedShgMapId = target.dataset.wfFocusShgMap;
      nb.shgViewMode = "MAP";
      renderActiveView();
      document.querySelector('[data-wf-shg-map="1"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          nb.gpsStatus = `Optional GPS active (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}) — reliable distances shown where verified coordinates exist.`;
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

    // 6. Admin Nearby Services Verification / Edit / Delete (with Audit Trail)
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
      const item = (state.nearbyServiceListings || []).find((x) => x.id === id);
      const status = target.dataset.status || "ADMIN_VERIFIED";
      const pub = target.dataset.pub === "1";
      try {
        await firebaseService.verifyNearbyServiceListing(state.user.uid, id, {
          verificationStatus: status,
          published: pub,
          actorName: state.userProfile?.displayName || "Admin",
          entityName: item?.name || id,
          pinCode: item?.pinCode || ""
        });
        showToast(status === "ADMIN_VERIFIED" ? (pub ? "Listing approved & published!" : "Listing unpublished.") : `Listing marked ${status}.`);
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
      const id = target.dataset.wcmsDelNearby;
      const item = (state.nearbyServiceListings || []).find((x) => x.id === id);
      try {
        await firebaseService.deleteNearbyServiceListing(id, {
          adminUid: state.user.uid,
          actorName: state.userProfile?.displayName || "Admin",
          entityName: item?.name || id,
          pinCode: item?.pinCode || ""
        });
        showToast("Listing deleted.");
      } catch (err) {
        showToast(err.message || "Unable to delete listing.", true);
      }
      return;
    }

    // 7. Admin SHG Directory Verification / Edit / Delete (with Audit Trail)
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
      const shg = (state.shgDirectoryListings || []).find((x) => x.id === id);
      const status = target.dataset.status || "ADMIN_VERIFIED";
      const pub = target.dataset.pub === "1";
      try {
        await firebaseService.verifyShgDirectoryListing(state.user.uid, id, {
          verificationStatus: status,
          published: pub,
          actorName: state.userProfile?.displayName || "Admin",
          entityName: shg?.shgName || id,
          pinCode: shg?.pinCode || ""
        });
        showToast(status === "ADMIN_VERIFIED" ? (pub ? "SHG approved & published!" : "SHG unpublished.") : `SHG marked ${status}.`);
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
      setV("awsVillage", shg.village || shg.area);
      setV("awsGramPanchayat", shg.gramPanchayat || "");
      setV("awsBlock", shg.block || "");
      setV("awsDistrict", shg.district);
      setV("awsAddress", shg.address);
      setV("awsPin", shg.pinCode);
      setV("awsLat", shg.lat ?? "");
      setV("awsLng", shg.lng ?? "");
      setV("awsContactName", shg.contactName);
      setV("awsContactPhone", shg.contactPhone);
      setV("awsActivities", (shg.activities || []).join(", "));
      setV("awsServices", [...(shg.products || []), ...(shg.services || [])].join(", "));
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
      const id = target.dataset.wcmsDelShg;
      const shg = (state.shgDirectoryListings || []).find((x) => x.id === id);
      try {
        await firebaseService.deleteShgDirectoryListing(id, {
          adminUid: state.user.uid,
          actorName: state.userProfile?.displayName || "Admin",
          entityName: shg?.shgName || id,
          pinCode: shg?.pinCode || ""
        });
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
    if (e.target.id === "wfShgBlockInput") {
      const s = e.target.selectionStart, en = e.target.selectionEnd;
      nb.shgBlock = e.target.value;
      renderSearchPreservingFocus("wfShgBlockInput", s, en);
      return;
    }
    if (e.target.id === "wfShgVillageInput") {
      const s = e.target.selectionStart, en = e.target.selectionEnd;
      nb.shgVillage = e.target.value;
      renderSearchPreservingFocus("wfShgVillageInput", s, en);
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

    // Community Nearby Business Submission (Strictly Private PENDING_REVIEW until Admin approves)
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
          showToast("Submitted! Your listing stays private until approved & published by an Admin.");
          renderActiveView();
        } catch (err) {
          showToast(err.message || "Unable to submit listing.", true);
        }
      });
      return;
    }

    // Community SHG Submission (Strictly Private PENDING_REVIEW until Admin approves)
    if (form.id === "wfShgSubmitForm") {
      e.preventDefault();
      if (!state.user) { openAuthModal(); return; }
      await withBusySubmit(form, async () => {
        try {
          const villageVal = document.getElementById("wfShgVillage")?.value || "";
          const blockVal = document.getElementById("wfShgBlock")?.value || "";
          await firebaseService.saveShgDirectoryListing(
            state.user.uid,
            state.userProfile?.displayName || state.user.displayName || "Contributor",
            {
              shgName: document.getElementById("wfShgName")?.value,
              shgNameBn: document.getElementById("wfShgNameBn")?.value,
              area: villageVal || blockVal,
              village: villageVal,
              gramPanchayat: document.getElementById("wfShgGramPanchayat")?.value,
              block: blockVal,
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
          showToast("SHG submitted! It stays private until verified & published by an Admin.");
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
          const villageVal = document.getElementById("awsVillage")?.value || "";
          const blockVal = document.getElementById("awsBlock")?.value || "";
          await firebaseService.saveShgDirectoryListing(
            state.user.uid,
            state.userProfile?.displayName || "Admin",
            {
              shgName: document.getElementById("awsName")?.value,
              shgNameBn: document.getElementById("awsNameBn")?.value,
              area: villageVal || blockVal,
              village: villageVal,
              gramPanchayat: document.getElementById("awsGramPanchayat")?.value,
              block: blockVal,
              district: document.getElementById("awsDistrict")?.value,
              state: "West Bengal",
              address: document.getElementById("awsAddress")?.value,
              pinCode: document.getElementById("awsPin")?.value,
              lat: document.getElementById("awsLat")?.value,
              lng: document.getElementById("awsLng")?.value,
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
