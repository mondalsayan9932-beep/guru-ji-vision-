// ============================================================================
// GURU JI VISION — INTERACTIVE LEAFLET.JS + OPENSTREETMAP MAP CONTROLLER
// ============================================================================
// - Renders interactive OpenStreetMap maps using Leaflet.js (100% free, zero
//   paid Google Maps / Google Places API keys required).
// - Displays verified Shops (green markers) and verified SHGs (magenta markers)
//   plus optional user GPS / PIN area centroid.
// - Respects OpenStreetMap Tile Usage Policy: proper © OpenStreetMap
//   attribution, maxZoom capped at 18, single reusable instance teardown to
//   avoid duplicate tile requests.
// - Graceful fallback if offline or Leaflet CDN fails to load.
// - Strict XSS escaping on every marker popup field.
// ============================================================================

import { escapeHtml, safeUrl } from "./calculators.js";
import {
  NEARBY_SERVICE_CATEGORY_MAP,
  buildDirectionsUrl,
  filterNearbyListings,
  filterShgListings,
  getSurroundingPinSuggestions,
  getVerificationBadgeMeta,
  isValidIndiaCoordinate,
  validatePinCode
} from "./women-nearby-data.js";

let activeLeafletMap = null;
let activeMapContainerId = "";

export function destroyWomenNearbyLeafletMap() {
  if (activeLeafletMap) {
    try { activeLeafletMap.remove(); } catch (_) {}
    activeLeafletMap = null;
    activeMapContainerId = "";
  }
}

function buildMarkerPopupHtml(item, { isShg = false, bn = false, originCoords = null } = {}) {
  const title = isShg
    ? (bn && item.shgNameBn ? item.shgNameBn : item.shgName)
    : (bn && item.nameBn ? item.nameBn : item.name);
  const badge = getVerificationBadgeMeta(item.verificationStatus);
  const catMeta = isShg
    ? { en: "Self Help Group (SHG)", bn: "স্বনির্ভর গোষ্ঠী (SHG)" }
    : (NEARBY_SERVICE_CATEGORY_MAP[item.category] || { en: item.category, bn: item.category });
  const dirUrl = safeUrl(buildDirectionsUrl(item, originCoords));
  const locLine = isShg
    ? [item.village || item.area, item.gramPanchayat ? `GP: ${item.gramPanchayat}` : "", item.block ? `Block: ${item.block}` : "", item.district, item.pinCode].filter(Boolean).join(", ")
    : [item.address, item.district, item.pinCode].filter(Boolean).join(", ");
  const verifiedPhone = item.verificationStatus === "ADMIN_VERIFIED"
    ? (isShg ? item.contactPhone : item.phone)
    : (item.phone || "");

  const distLine = item.distanceKm !== null && item.distanceKm !== undefined
    ? `<div style="margin-top:4px;font-size:11px;font-weight:700;color:#14532D;">📏 ~${escapeHtml(String(item.distanceKm))} km (${item.distanceBasis === "GPS" ? (bn ? "GPS থেকে" : "from GPS") : (bn ? "পিন কেন্দ্র থেকে" : "from PIN center")})</div>`
    : "";

  const dirHtml = dirUrl
    ? `<a href="${escapeHtml(dirUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:6px;padding:5px 10px;border-radius:8px;background:#14532D;color:#fff;font-size:11px;font-weight:700;text-decoration:none;">🧭 ${bn ? "OpenStreetMap দিকনির্দেশ ↗" : "OSM Directions ↗"}</a>`
    : `<div style="margin-top:5px;font-size:10px;color:#64748B;">${bn ? "রুট অনুপলব্ধ (যাচাইকৃত স্থানাঙ্ক নেই)" : "Route unavailable (coordinates not verified)"}</div>`;

  return `
    <div style="min-width:190px;max-width:250px;font-family:inherit;line-height:1.35;">
      <div style="font-size:10px;font-weight:800;color:${isShg ? "#86198F" : "#14532D"};margin-bottom:2px;">
        ${escapeHtml(bn ? catMeta.bn : catMeta.en)} • ${escapeHtml(bn ? badge.bn : badge.en)}
      </div>
      <div style="font-size:13px;font-weight:800;color:#132219;">${escapeHtml(title || "")}</div>
      <div style="font-size:11px;color:#334155;margin-top:3px;">📍 ${escapeHtml(locLine)}</div>
      ${verifiedPhone ? `<div style="font-size:11px;font-weight:700;color:#14532D;margin-top:3px;">📞 ${escapeHtml(verifiedPhone)}</div>` : ""}
      ${distLine}
      ${dirHtml}
    </div>
  `;
}

/**
 * Mounts or updates the interactive Leaflet.js OpenStreetMap view whenever
 * Nearby Services or SHG Search is rendered in MAP mode.
 */
export function syncWomenNearbyLeafletMap(state) {
  if (typeof document === "undefined") return;
  const container = document.querySelector("[data-wf-leaflet-map]");
  if (!container) {
    destroyWomenNearbyLeafletMap();
    return;
  }

  const L = typeof window !== "undefined" ? window.L : null;
  if (!L || typeof L.map !== "function") {
    // Graceful fallback already rendered inside container (OSM static embed / offline message)
    return;
  }

  const mode = container.dataset.wfLeafletMap; // "nearby" | "shg"
  const bn = (state.womenFarmer?.lang || (state.lang === "bn" ? "BN" : "EN")) === "BN";
  const nb = state.womenNearby || {};
  const apiRes = nb.apiResult || null;
  const gpsCoords = nb.gpsCoords || null;
  const pinCenterCoords = apiRes?.pinCode === nb.activePin ? apiRes?.centerCoords : null;
  const originCoords = gpsCoords && isValidIndiaCoordinate(gpsCoords.lat, gpsCoords.lng)
    ? gpsCoords
    : (pinCenterCoords && isValidIndiaCoordinate(pinCenterCoords.lat, pinCenterCoords.lng) ? pinCenterCoords : null);

  let shopMarkers = [];
  let shgMarkers = [];
  let focusId = "";

  if (mode === "nearby") {
    const activePin = nb.activePin || "";
    const resolvedDistrict = apiRes?.pinCode === activePin ? (apiRes?.postal?.district || "") : "";
    const verifiedShops = (state.nearbyServiceListings || []).filter((x) => x.verificationStatus === "ADMIN_VERIFIED" && x.published);
    const surroundingPins = activePin ? getSurroundingPinSuggestions(activePin, verifiedShops, resolvedDistrict) : [];
    const filtered = filterNearbyListings({
      verifiedListings: state.nearbyServiceListings || [],
      liveDirectoryListings: apiRes?.pinCode === activePin ? (apiRes.liveListings || []) : [],
      myPendingListings: [],
      pinCode: activePin,
      surroundingPins,
      district: resolvedDistrict,
      category: nb.category || "ALL",
      search: nb.search || "",
      userCoords: gpsCoords,
      pinCenterCoords
    });
    shopMarkers = filtered.allResults.filter((x) => isValidIndiaCoordinate(x.lat, x.lng));
    // Also show verified SHGs with coordinates in the same PIN/district so both verified Shops & SHGs appear on map!
    const shgFiltered = filterShgListings({
      verifiedShgs: state.shgDirectoryListings || [],
      pinCode: activePin,
      surroundingPins,
      district: "ALL",
      userCoords: gpsCoords
    });
    shgMarkers = shgFiltered.allShgs.filter((x) => isValidIndiaCoordinate(x.lat, x.lng));
    focusId = nb.selectedMapId || "";
  } else {
    const validPin = validatePinCode(nb.shgPin || "");
    const verifiedShgs = (state.shgDirectoryListings || []).filter((x) => x.verificationStatus === "ADMIN_VERIFIED" && x.published);
    const surroundingPins = validPin.valid ? getSurroundingPinSuggestions(validPin.pin, verifiedShgs, nb.shgDistrict !== "ALL" ? nb.shgDistrict : "") : [];
    const shgFiltered = filterShgListings({
      verifiedShgs: state.shgDirectoryListings || [],
      pinCode: validPin.valid ? validPin.pin : "",
      surroundingPins,
      district: nb.shgDistrict || "ALL",
      block: nb.shgBlock || "",
      village: nb.shgVillage || "",
      search: nb.shgSearch || "",
      userCoords: gpsCoords
    });
    shgMarkers = shgFiltered.allShgs.filter((x) => isValidIndiaCoordinate(x.lat, x.lng));
    focusId = nb.selectedShgMapId || "";
  }

  destroyWomenNearbyLeafletMap();
  container.innerHTML = "";

  // Determine initial center (focused marker -> first marker -> PIN centroid -> GPS -> West Bengal default center)
  const focusedItem = [...shopMarkers, ...shgMarkers].find((x) => x.id === focusId) || null;
  let centerLat = 22.9868; // West Bengal geographic center
  let centerLng = 87.8550;
  let zoom = 7;

  if (focusedItem) {
    centerLat = Number(focusedItem.lat);
    centerLng = Number(focusedItem.lng);
    zoom = 15;
  } else if (shopMarkers.length || shgMarkers.length) {
    const first = shopMarkers[0] || shgMarkers[0];
    centerLat = Number(first.lat);
    centerLng = Number(first.lng);
    zoom = 13;
  } else if (originCoords) {
    centerLat = Number(originCoords.lat);
    centerLng = Number(originCoords.lng);
    zoom = 13;
  }

  try {
    const map = L.map(container, {
      center: [centerLat, centerLng],
      zoom,
      maxZoom: 18,
      scrollWheelZoom: false
    });
    activeLeafletMap = map;
    activeMapContainerId = container.id || mode;

    // Official OpenStreetMap tile layer respecting OSM Tile Usage Policy
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);

    const boundsPoints = [];

    if (gpsCoords && isValidIndiaCoordinate(gpsCoords.lat, gpsCoords.lng)) {
      L.circleMarker([Number(gpsCoords.lat), Number(gpsCoords.lng)], {
        radius: 8,
        color: "#1D4ED8",
        fillColor: "#3B82F6",
        fillOpacity: 0.9,
        weight: 2
      })
        .addTo(map)
        .bindPopup(`<strong>${bn ? "আপনার GPS অবস্থান" : "Your Optional GPS Location"}</strong>`);
      boundsPoints.push([Number(gpsCoords.lat), Number(gpsCoords.lng)]);
    } else if (pinCenterCoords && isValidIndiaCoordinate(pinCenterCoords.lat, pinCenterCoords.lng) && mode === "nearby") {
      L.circleMarker([Number(pinCenterCoords.lat), Number(pinCenterCoords.lng)], {
        radius: 7,
        color: "#0F766E",
        fillColor: "#14B8A6",
        fillOpacity: 0.7,
        weight: 2
      })
        .addTo(map)
        .bindPopup(`<strong>${bn ? "পিন এলাকা কেন্দ্র" : "PIN Area Centre"} (${escapeHtml(nb.activePin || "")})</strong>`);
      boundsPoints.push([Number(pinCenterCoords.lat), Number(pinCenterCoords.lng)]);
    }

    for (const shop of shopMarkers) {
      const lat = Number(shop.lat);
      const lng = Number(shop.lng);
      const isVerified = shop.verificationStatus === "ADMIN_VERIFIED";
      const m = L.circleMarker([lat, lng], {
        radius: isVerified ? 9 : 7,
        color: isVerified ? "#14532D" : "#0369A1",
        fillColor: isVerified ? "#22C55E" : "#38BDF8",
        fillOpacity: 0.9,
        weight: 2
      })
        .addTo(map)
        .bindPopup(buildMarkerPopupHtml(shop, { isShg: false, bn, originCoords }));
      if (shop.id === focusId) m.openPopup();
      boundsPoints.push([lat, lng]);
    }

    for (const shg of shgMarkers) {
      const lat = Number(shg.lat);
      const lng = Number(shg.lng);
      const m = L.circleMarker([lat, lng], {
        radius: 9,
        color: "#701A75",
        fillColor: "#D946EF",
        fillOpacity: 0.9,
        weight: 2
      })
        .addTo(map)
        .bindPopup(buildMarkerPopupHtml(shg, { isShg: true, bn, originCoords }));
      if (shg.id === focusId) m.openPopup();
      boundsPoints.push([lat, lng]);
    }

    if (!focusedItem && boundsPoints.length >= 2) {
      map.fitBounds(boundsPoints, { padding: [32, 32], maxZoom: 15 });
    }
    setTimeout(() => {
      try { map.invalidateSize(); } catch (_) {}
    }, 120);
  } catch (_) {
    destroyWomenNearbyLeafletMap();
  }
}
