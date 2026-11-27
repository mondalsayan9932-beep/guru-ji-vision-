// ============================================================================
// GURU JI VISION — ADMIN WOMEN FARMER CMS CONTROLLER (PHASE 4)
// ============================================================================
// Dedicated modular controller for Admin Control Studio -> Women Farmer CMS:
// 1. YouTube Learning Library CRUD (10 categories, strict YouTube validation)
// 2. Learning Centre Guides CRUD (7 pillars, official source + verified date)
// 3. Automatic Official Scheme Discovery (/.netlify/functions/discover-women-schemes)
//    & Firestore Admin Review Queue (PENDING_REVIEW -> Promote / Approve / Reject)
// 4. Quick jump to full bilingual Government Scheme editor
// ============================================================================

import { firebaseService } from "./firebase-service.js";
import { extractYouTubeInfo } from "./edu-cms-utils.js";
import { mergeAgricultureSchemes } from "./govt-schemes-data.js";
import {
  mergeWomenLearningResources,
  mergeWomenVideos
} from "./women-learning-data.js";

export function createInitialWomenCmsState() {
  return {
    section: "videos", // "videos" | "learning" | "discovery" | "schemes"
    discoveryQuery: "",
    discoveryLoading: false,
    discoveryStatusMsg: "",
    discoveryResults: [],
    sourceCapabilities: []
  };
}

export function bindWomenCmsEvents({
  state,
  renderActiveView,
  showToast,
  withBusySubmit
}) {
  const ensureCms = () => {
    if (!state.womenCms) state.womenCms = createInitialWomenCmsState();
    return state.womenCms;
  };

  // CLICK EVENTS
  document.addEventListener("click", async (e) => {
    const target = e.target.closest(
      "[data-wcms-section], [data-wcms-edit-video], [data-wcms-toggle-video], [data-wcms-del-video], " +
      "#awvCancelEdit, [data-wcms-edit-learning], [data-wcms-toggle-learning], [data-wcms-del-learning], " +
      "#awlCancelEdit, #wcmsRunDiscoveryBtn, [data-wcms-queue-candidate], [data-wcms-queue-status], " +
      "[data-wcms-del-queue], [data-wcms-promote-queue], [data-wcms-open-scheme-editor]"
    );
    if (!target) return;
    if (!state.user || !state.isAdmin) {
      showToast("Authorized Admin permissions required.", true);
      return;
    }
    const cms = ensureCms();

    // 1. Sub-section switcher
    if (target.dataset.wcmsSection) {
      cms.section = target.dataset.wcmsSection;
      renderActiveView();
      return;
    }

    // 2. YouTube Library: Edit / Clone / Publish / Unpublish / Delete
    if (target.id === "awvCancelEdit") {
      document.getElementById("adminWomenVideoForm")?.reset();
      const editEl = document.getElementById("awvEditId");
      if (editEl) editEl.value = "";
      const titleEl = document.getElementById("awvFormTitle");
      if (titleEl) titleEl.textContent = "Add Women Farmer YouTube Video";
      target.classList.add("hidden");
      return;
    }

    if (target.dataset.wcmsEditVideo) {
      const id = target.dataset.wcmsEditVideo;
      const allVideos = mergeWomenVideos(state.womenVideos || [], true);
      const vid = allVideos.find((v) => v.id === id);
      if (!vid) return;
      const setVal = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val ?? ""; };
      setVal("awvEditId", vid.fromCloud ? vid.id : "");
      setVal("awvUrl", vid.youtubeUrl || "");
      setVal("awvTitle", vid.title || "");
      setVal("awvTitleBn", vid.titleBn || "");
      setVal("awvCategory", vid.category || "WOMEN_FARMER_TRAINING");
      setVal("awvLanguage", vid.language || "BILINGUAL");
      setVal("awvAudience", vid.audience || "BOTH");
      setVal("awvVerifiedDate", vid.lastVerifiedDate || new Date().toISOString().slice(0, 10));
      setVal("awvSourceName", vid.sourceName || "");
      setVal("awvDesc", vid.description || "");
      setVal("awvDescBn", vid.descriptionBn || "");
      const pubEl = document.getElementById("awvPublished");
      if (pubEl) pubEl.checked = vid.published !== false;
      const titleEl = document.getElementById("awvFormTitle");
      if (titleEl) titleEl.textContent = vid.fromCloud ? "Edit YouTube Video" : "Clone & Customize Reference Video";
      document.getElementById("awvCancelEdit")?.classList.remove("hidden");
      document.getElementById("adminWomenVideoForm")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    if (target.dataset.wcmsToggleVideo) {
      const id = target.dataset.wcmsToggleVideo;
      const nextPub = target.dataset.nextPub === "1";
      try {
        await firebaseService.toggleWomenVideoPublished(id, nextPub);
        showToast(nextPub ? "Video published to Women Farmer Library!" : "Video moved to Draft / Unpublished.");
      } catch (err) {
        showToast(err.message || "Unable to update video status.", true);
      }
      return;
    }

    if (target.dataset.wcmsDelVideo) {
      if (!window.confirm("Delete this Women Farmer YouTube video permanently?")) return;
      try {
        await firebaseService.deleteWomenVideo(target.dataset.wcmsDelVideo);
        showToast("Video deleted.");
      } catch (err) {
        showToast(err.message || "Unable to delete video.", true);
      }
      return;
    }

    // 3. Learning Centre Guides: Edit / Clone / Publish / Unpublish / Delete
    if (target.id === "awlCancelEdit") {
      document.getElementById("adminWomenLearningForm")?.reset();
      const editEl = document.getElementById("awlEditId");
      if (editEl) editEl.value = "";
      const titleEl = document.getElementById("awlFormTitle");
      if (titleEl) titleEl.textContent = "Add Learning Centre Guide";
      target.classList.add("hidden");
      return;
    }

    if (target.dataset.wcmsEditLearning) {
      const id = target.dataset.wcmsEditLearning;
      const allGuides = mergeWomenLearningResources(state.womenLearningResources || [], true);
      const guide = allGuides.find((g) => g.id === id);
      if (!guide) return;
      const setVal = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val ?? ""; };
      setVal("awlEditId", guide.fromCloud ? guide.id : "");
      setVal("awlPillar", guide.pillar || "GOVT_SCHEME_GUIDANCE");
      setVal("awlTitle", guide.title || "");
      setVal("awlTitleBn", guide.titleBn || "");
      setVal("awlSummary", guide.summary || "");
      setVal("awlSummaryBn", guide.summaryBn || "");
      setVal("awlPointsEn", (guide.keyPointsEn || []).join("\n"));
      setVal("awlPointsBn", (guide.keyPointsBn || []).join("\n"));
      setVal("awlSourceName", guide.officialSourceName || "");
      setVal("awlSourceUrl", guide.officialSourceUrl || "");
      setVal("awlVerifiedDate", guide.lastVerifiedDate || new Date().toISOString().slice(0, 10));
      const pubEl = document.getElementById("awlPublished");
      if (pubEl) pubEl.checked = guide.published !== false;
      const titleEl = document.getElementById("awlFormTitle");
      if (titleEl) titleEl.textContent = guide.fromCloud ? "Edit Learning Guide" : "Clone & Customize Baseline Guide";
      document.getElementById("awlCancelEdit")?.classList.remove("hidden");
      document.getElementById("adminWomenLearningForm")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    if (target.dataset.wcmsToggleLearning) {
      const id = target.dataset.wcmsToggleLearning;
      const nextPub = target.dataset.nextPub === "1";
      try {
        await firebaseService.toggleWomenLearningResourcePublished(id, nextPub);
        showToast(nextPub ? "Learning guide published!" : "Learning guide moved to Draft.");
      } catch (err) {
        showToast(err.message || "Unable to update learning guide status.", true);
      }
      return;
    }

    if (target.dataset.wcmsDelLearning) {
      if (!window.confirm("Delete this Learning Centre guide permanently?")) return;
      try {
        await firebaseService.deleteWomenLearningResource(target.dataset.wcmsDelLearning);
        showToast("Learning guide deleted.");
      } catch (err) {
        showToast(err.message || "Unable to delete learning guide.", true);
      }
      return;
    }

    // 4. Automatic Official Scheme Discovery Scan
    if (target.id === "wcmsRunDiscoveryBtn") {
      const qVal = document.getElementById("wcmsDiscoverQuery")?.value?.trim() || "";
      cms.discoveryQuery = qVal;
      cms.discoveryLoading = true;
      cms.discoveryStatusMsg = "Scanning allowlisted official government RSS feeds...";
      renderActiveView();
      try {
        const endpoint = `/.netlify/functions/discover-women-schemes${qVal ? `?q=${encodeURIComponent(qVal)}` : ""}`;
        const res = await fetch(endpoint);
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || `Discovery returned HTTP ${res.status}`);
        }
        cms.discoveryResults = Array.isArray(data.discovered) ? data.discovered : [];
        cms.sourceCapabilities = Array.isArray(data.sourceCapabilities) ? data.sourceCapabilities : [];
        cms.discoveryStatusMsg = `Scan complete: ${cms.discoveryResults.length} official candidate(s) found. Review and send relevant items to Admin Review Queue before publishing.`;
      } catch (err) {
        cms.discoveryStatusMsg = `Automatic scan unavailable (${err.message || "offline"}). Use Manual Official Scheme Entry below.`;
      } finally {
        cms.discoveryLoading = false;
        renderActiveView();
      }
      return;
    }

    // 5. Queue Discovered Candidate -> Firestore PENDING_REVIEW
    if (target.dataset.wcmsQueueCandidate !== undefined) {
      const idx = parseInt(target.dataset.wcmsQueueCandidate, 10);
      const cand = (cms.discoveryResults || [])[idx];
      if (!cand) return;
      try {
        await firebaseService.saveDiscoveredWomenScheme(state.user.uid, {
          ...cand,
          reviewStatus: "PENDING_REVIEW"
        });
        showToast("Candidate queued as PENDING_REVIEW for Admin verification!");
        renderActiveView();
      } catch (err) {
        showToast(err.message || "Unable to queue discovered candidate.", true);
      }
      return;
    }

    // 6. Queue Status Update (Approve / Reject) or Delete
    if (target.dataset.wcmsQueueStatus) {
      const id = target.dataset.wcmsQueueStatus;
      const status = target.dataset.status || "PENDING_REVIEW";
      try {
        await firebaseService.updateDiscoveredWomenSchemeStatus(state.user.uid, id, status);
        showToast(`Discovery queue item marked as ${status}.`);
      } catch (err) {
        showToast(err.message || "Unable to update queue status.", true);
      }
      return;
    }

    if (target.dataset.wcmsDelQueue) {
      if (!window.confirm("Remove this item from the Discovery Review Queue?")) return;
      try {
        await firebaseService.deleteDiscoveredWomenScheme(target.dataset.wcmsDelQueue);
        showToast("Queue item removed.");
      } catch (err) {
        showToast(err.message || "Unable to delete queue item.", true);
      }
      return;
    }

    // 7. Promote Discovery Queue Item OR Open Scheme Editor in Admin -> Govt Schemes
    if (target.dataset.wcmsPromoteQueue) {
      const item = (state.womenSchemeDiscoveryQueue || []).find((q) => q.id === target.dataset.wcmsPromoteQueue);
      if (!item) return;
      state.adminSubTab = "schemes";
      renderActiveView();
      setTimeout(() => {
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ""; };
        setVal("asName", item.title || "");
        setVal("asCategory", item.suggestedCategory || "WOMEN_FARMER");
        setVal("asGovtLevel", item.suggestedGovtLevel || "CENTRAL");
        setVal("asState", item.suggestedState || "West Bengal");
        setVal("asPurpose", item.summary || "");
        setVal("asSourceUrl", item.officialSourceUrl || "");
        setVal("asPortalUrl", item.officialSourceUrl || "");
        setVal("asSourceName", item.sourceName || "");
        setVal("asLastVerified", new Date().toISOString().slice(0, 10));
        const womenChk = document.getElementById("asWomenEligible");
        if (womenChk) womenChk.checked = true;
        document.getElementById("adminSchemeForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
        showToast("Prefilled Scheme Form — verify all official benefits, eligibility & Bengali translation before saving.");
      }, 60);
      return;
    }

    if (target.dataset.wcmsOpenSchemeEditor) {
      const schemeId = target.dataset.wcmsOpenSchemeEditor;
      const allSchemes = mergeAgricultureSchemes(state.agricultureSchemes || [], true);
      const targetScheme = allSchemes.find((s) => s.id === schemeId);
      state.adminSubTab = "schemes";
      renderActiveView();
      if (targetScheme) {
        setTimeout(() => {
          const editBtn = document.querySelector(`[data-edit-scheme="${CSS.escape(targetScheme.cloudId || targetScheme.id)}"]`);
          if (editBtn) editBtn.click();
          else document.getElementById("adminSchemeForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 60);
      }
      return;
    }
  });

  // FORM SUBMISSIONS
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (!form) return;

    // Save Women Farmer YouTube Video
    if (form.id === "adminWomenVideoForm") {
      e.preventDefault();
      if (!state.user || !state.isAdmin) { showToast("Admin access required.", true); return; }
      const rawUrl = document.getElementById("awvUrl")?.value?.trim() || "";
      const yt = extractYouTubeInfo(rawUrl);
      if (!yt.ok) {
        showToast(yt.error || "Please enter a valid YouTube URL (youtube.com or youtu.be).", true);
        return;
      }
      const title = document.getElementById("awvTitle")?.value?.trim() || "";
      if (title.length < 2) { showToast("Please enter a valid English video title.", true); return; }

      await withBusySubmit(form, async () => {
        try {
          const editId = document.getElementById("awvEditId")?.value?.trim() || "";
          await firebaseService.saveWomenVideo(state.user.uid, {
            title,
            titleBn: document.getElementById("awvTitleBn")?.value?.trim() || "",
            description: document.getElementById("awvDesc")?.value?.trim() || "",
            descriptionBn: document.getElementById("awvDescBn")?.value?.trim() || "",
            category: document.getElementById("awvCategory")?.value || "WOMEN_FARMER_TRAINING",
            language: document.getElementById("awvLanguage")?.value || "BILINGUAL",
            audience: document.getElementById("awvAudience")?.value || "BOTH",
            youtubeUrl: yt.watchUrl,
            videoId: yt.videoId,
            thumbnailUrl: yt.thumbnailUrl,
            sourceName: document.getElementById("awvSourceName")?.value?.trim() || "Verified Agricultural Video",
            lastVerifiedDate: document.getElementById("awvVerifiedDate")?.value || new Date().toISOString().slice(0, 10),
            published: Boolean(document.getElementById("awvPublished")?.checked)
          }, editId);
          form.reset();
          const editEl = document.getElementById("awvEditId");
          if (editEl) editEl.value = "";
          document.getElementById("awvCancelEdit")?.classList.add("hidden");
          showToast(editId ? "YouTube video updated!" : "YouTube video saved to Women Farmer Library!");
        } catch (err) {
          showToast(err.message || "Unable to save YouTube video.", true);
        }
      });
      return;
    }

    // Save Women Farmer Learning Centre Guide
    if (form.id === "adminWomenLearningForm") {
      e.preventDefault();
      if (!state.user || !state.isAdmin) { showToast("Admin access required.", true); return; }
      const title = document.getElementById("awlTitle")?.value?.trim() || "";
      const summary = document.getElementById("awlSummary")?.value?.trim() || "";
      const sourceName = document.getElementById("awlSourceName")?.value?.trim() || "";
      const sourceUrl = document.getElementById("awlSourceUrl")?.value?.trim() || "";
      if (sourceUrl && !/^https:\/\//i.test(sourceUrl)) {
        showToast("Official Source URL must start with https://", true);
        return;
      }
      const splitLines = (raw) => String(raw || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).slice(0, 12);

      await withBusySubmit(form, async () => {
        try {
          const editId = document.getElementById("awlEditId")?.value?.trim() || "";
          await firebaseService.saveWomenLearningResource(state.user.uid, {
            pillar: document.getElementById("awlPillar")?.value || "GOVT_SCHEME_GUIDANCE",
            title,
            titleBn: document.getElementById("awlTitleBn")?.value?.trim() || "",
            summary,
            summaryBn: document.getElementById("awlSummaryBn")?.value?.trim() || "",
            keyPointsEn: splitLines(document.getElementById("awlPointsEn")?.value),
            keyPointsBn: splitLines(document.getElementById("awlPointsBn")?.value),
            officialSourceName: sourceName,
            officialSourceUrl: sourceUrl,
            lastVerifiedDate: document.getElementById("awlVerifiedDate")?.value || new Date().toISOString().slice(0, 10),
            published: Boolean(document.getElementById("awlPublished")?.checked)
          }, editId);
          form.reset();
          const editEl = document.getElementById("awlEditId");
          if (editEl) editEl.value = "";
          document.getElementById("awlCancelEdit")?.classList.add("hidden");
          showToast(editId ? "Learning guide updated!" : "Learning guide published to Women Farmer Learning Centre!");
        } catch (err) {
          showToast(err.message || "Unable to save learning guide.", true);
        }
      });
    }
  });
}
