// ============================================================================
// Guru Ji Vision — Genuine Weather Forecasting & Crop Market Price Modules
// 1. Weather Report & Forecasting: Real Open-Meteo Forecast & Geocoding API +
//    India 6-Digit PIN Lookup (postalpincode.in). ZERO fake weather data.
// 2. Crop Market Price – ফসলের বাজারদর: Official Govt. of India AGMARKNET API
//    via /.netlify/functions/mandi-prices + Admin-verified Firestore records.
//    ZERO fabricated market prices; always displays reporting date & source.
// ============================================================================

import { CROP_NAME_BN_MAP, QUICK_WEATHER_LOCATIONS } from "./config.js";
import { escapeHtml, formatInr, safeUrl } from "./calculators.js";

// ----------------------------------------------------------------------------
// WMO WEATHER CODE TRANSLATIONS (English + Bengali)
// ----------------------------------------------------------------------------
const WMO_CODES = {
  0: { icon: "☀️", en: "Clear Sky", bn: "পরিষ্কার আকাশ" },
  1: { icon: "🌤️", en: "Mainly Clear", bn: "প্রায় পরিষ্কার" },
  2: { icon: "⛅", en: "Partly Cloudy", bn: "আংশিক মেঘলা" },
  3: { icon: "☁️", en: "Overcast", bn: "ঘন মেঘলা" },
  45: { icon: "🌫️", en: "Fog", bn: "কুয়াশা" },
  48: { icon: "🌫️", en: "Depositing Rime Fog", bn: "ঘন কুয়াশা" },
  51: { icon: "🌦️", en: "Light Drizzle", bn: "হালকা গুঁড়ি গুঁড়ি বৃষ্টি" },
  53: { icon: "🌦️", en: "Moderate Drizzle", bn: "মাঝারি গুঁড়ি বৃষ্টি" },
  55: { icon: "🌧️", en: "Dense Drizzle", bn: "ঘন গুঁড়ি বৃষ্টি" },
  61: { icon: "🌧️", en: "Slight Rain", bn: "হালকা বৃষ্টি" },
  63: { icon: "🌧️", en: "Moderate Rain", bn: "মাঝারি বৃষ্টি" },
  65: { icon: "⛈️", en: "Heavy Rain", bn: "ভারী বৃষ্টি" },
  71: { icon: "🌨️", en: "Light Snow", bn: "হালকা তুষারপাত" },
  80: { icon: "🌦️", en: "Rain Showers", bn: "বিক্ষিপ্ত বৃষ্টি" },
  81: { icon: "🌧️", en: "Moderate Showers", bn: "মাঝারি বর্ষণ" },
  82: { icon: "⛈️", en: "Violent Rain Showers", bn: "প্রবল বৃষ্টিপাত" },
  95: { icon: "⛈️", en: "Thunderstorm", bn: "বজ্রবিদ্যুৎ-সহ বৃষ্টি" },
  96: { icon: "⛈️", en: "Thunderstorm with Hail", bn: "শিলাবৃষ্টি ও ঝড়" },
  99: { icon: "⛈️", en: "Severe Thunderstorm with Hail", bn: "তীব্র ঝড় ও শিলাবৃষ্টি" }
};

function decodeWmo(code) {
  return WMO_CODES[Number(code)] || { icon: "🌤️", en: `Weather Code ${code}`, bn: "আবহাওয়া আপডেট" };
}

function windCompass(deg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round(((Number(deg) || 0) % 360) / 45) % 8;
  return dirs[idx];
}

function formatClockTime(isoStr) {
  if (!isoStr) return "—";
  const parts = String(isoStr).split("T");
  if (parts.length < 2) return isoStr;
  const [hStr, mStr] = parts[1].split(":");
  let h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return parts[1];
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr} ${suffix}`;
}

function formatDayLabel(dateStr, idx) {
  if (idx === 0) return "Today / আজ";
  if (idx === 1) return "Tomorrow / আগামীকাল";
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  } catch (_) {
    return dateStr;
  }
}

export function getCropBengaliName(cropName, explicitBn = "") {
  if (explicitBn && explicitBn.trim()) return explicitBn.trim();
  const lower = String(cropName || "").trim().toLowerCase();
  for (const [k, v] of Object.entries(CROP_NAME_BN_MAP)) {
    if (lower.includes(k)) return v;
  }
  return "";
}

// ----------------------------------------------------------------------------
// 1. REAL WEATHER API SERVICE (Open-Meteo + India Postal PIN Support)
// ----------------------------------------------------------------------------
export async function searchWeatherLocations(rawQuery) {
  const q = String(rawQuery || "").trim();
  if (!q) return { ok: false, results: [], error: "Enter a village, town, district, or 6-digit PIN code." };

  try {
    // Support 6-digit Indian PIN code lookup via official India Postal API -> Open-Meteo Geocoding
    if (/^\d{6}$/.test(q)) {
      const pinRes = await fetch(`https://api.postalpincode.in/pincode/${q}`);
      if (!pinRes.ok) throw new Error("PIN code lookup service temporarily unavailable.");
      const pinData = await pinRes.json();
      const postOffice = pinData?.[0]?.PostOffice?.[0];
      if (!postOffice) {
        return { ok: false, results: [], error: `No Indian locality found for PIN code ${q}. Try entering your nearest town or district name.` };
      }
      const searchNames = [
        `${postOffice.Block || postOffice.Name}, ${postOffice.District}`,
        postOffice.District,
        postOffice.Division
      ].filter(Boolean);

      for (const name of searchNames) {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en&format=json`);
        const geo = await geoRes.json().catch(() => ({}));
        if (geo?.results?.length) {
          return {
            ok: true,
            results: geo.results.map((r) => ({
              name: `${postOffice.Name} (${q}) — ${r.name}`,
              admin1: r.admin1 || postOffice.State || "",
              country: r.country || "India",
              latitude: r.latitude,
              longitude: r.longitude
            }))
          };
        }
      }
      return { ok: false, results: [], error: `Found ${postOffice.Name} (${postOffice.District}), but coordinates could not be resolved. Search "${postOffice.District}" directly.` };
    }

    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`);
    if (!res.ok) throw new Error(`Location search failed (HTTP ${res.status}).`);
    const data = await res.json();
    const list = (data?.results || []).map((r) => ({
      name: r.name,
      admin1: r.admin1 || "",
      country: r.country || "",
      latitude: r.latitude,
      longitude: r.longitude
    }));
    if (!list.length) {
      return { ok: false, results: [], error: `No location matched "${q}". Try your nearest block town, district, or 6-digit Indian PIN code.` };
    }
    return { ok: true, results: list };
  } catch (err) {
    return { ok: false, results: [], error: err?.message || "Unable to search locations. Check your internet connection." };
  }
}

export async function fetchWeatherByLocation(loc) {
  if (!loc || !Number.isFinite(Number(loc.latitude)) || !Number.isFinite(Number(loc.longitude))) {
    return { ok: false, error: "Invalid geographic coordinates." };
  }
  const lat = Number(loc.latitude).toFixed(4);
  const lon = Number(loc.longitude).toFixed(4);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m` +
    `&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max` +
    `&timezone=auto&forecast_days=7`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather service returned HTTP ${res.status}`);
    const data = await res.json();
    if (!data?.current || !data?.daily) throw new Error("Incomplete weather data received from API.");

    // Build next 24 hours slice starting from current local hour
    const nowTimePrefix = String(data.current.time || "").slice(0, 13);
    const hourlyTimes = data.hourly?.time || [];
    let startIdx = hourlyTimes.findIndex((t) => String(t).slice(0, 13) >= nowTimePrefix);
    if (startIdx < 0) startIdx = 0;

    const hourly = [];
    for (let i = startIdx; i < Math.min(hourlyTimes.length, startIdx + 24); i++) {
      hourly.push({
        time: hourlyTimes[i],
        temp: data.hourly.temperature_2m?.[i],
        humidity: data.hourly.relative_humidity_2m?.[i],
        rainProb: data.hourly.precipitation_probability?.[i] ?? 0,
        precipMm: data.hourly.precipitation?.[i] ?? 0,
        windKmh: data.hourly.wind_speed_10m?.[i] ?? 0,
        code: data.hourly.weather_code?.[i] ?? 0
      });
    }

    const daily = (data.daily.time || []).map((date, i) => ({
      date,
      code: data.daily.weather_code?.[i] ?? 0,
      maxTemp: data.daily.temperature_2m_max?.[i],
      minTemp: data.daily.temperature_2m_min?.[i],
      sunrise: data.daily.sunrise?.[i],
      sunset: data.daily.sunset?.[i],
      rainSumMm: data.daily.precipitation_sum?.[i] ?? 0,
      rainProbMax: data.daily.precipitation_probability_max?.[i] ?? 0,
      windMaxKmh: data.daily.wind_speed_10m_max?.[i] ?? 0
    }));

    return {
      ok: true,
      data: {
        location: {
          name: loc.name || `${lat}, ${lon}`,
          admin1: loc.admin1 || "",
          country: loc.country || "",
          latitude: Number(lat),
          longitude: Number(lon)
        },
        timezone: data.timezone || "Asia/Kolkata",
        current: {
          time: data.current.time,
          temp: data.current.temperature_2m,
          feelsLike: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m,
          precipMm: data.current.precipitation ?? 0,
          rainMm: data.current.rain ?? 0,
          cloudCover: data.current.cloud_cover ?? 0,
          windSpeed: data.current.wind_speed_10m ?? 0,
          windDir: data.current.wind_direction_10m ?? 0,
          code: data.current.weather_code ?? 0
        },
        hourly,
        daily,
        fetchedAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
        sourceName: "Open-Meteo Official Weather API (ECMWF / GFS / WMO)"
      }
    };
  } catch (err) {
    return {
      ok: false,
      error: err?.message || "Weather API is currently unavailable. Please check your internet connection and retry."
    };
  }
}

function buildAgriAdvisories(w) {
  const alerts = [];
  const today = w.daily?.[0] || {};
  const next3RainMm = (w.daily || []).slice(0, 3).reduce((s, d) => s + (Number(d.rainSumMm) || 0), 0);
  const maxTemp = Number(today.maxTemp ?? w.current.temp ?? 0);
  const rainProb = Number(today.rainProbMax ?? 0);
  const rainMm = Number(today.rainSumMm ?? 0);
  const wind = Number(w.current.windSpeed ?? 0);
  const maxWind = Number(today.windMaxKmh ?? wind);

  // Heavy rainfall alert
  if (rainMm >= 25 || rainProb >= 75) {
    alerts.push({
      level: "danger",
      icon: "⛈️",
      title: "Heavy Rainfall Alert / ভারী বৃষ্টির সতর্কতা",
      text: `Expected rainfall today: ${rainMm.toFixed(1)} mm (${rainProb}% probability). Ensure field drainage channels are clear, postpone harvesting/threshing, and avoid fertilizer or pesticide spraying.`
    });
  } else if (rainProb >= 45 || next3RainMm >= 10) {
    alerts.push({
      level: "info",
      icon: "💧",
      title: "Rain Forecast & Irrigation Planning / সেচ পরিকল্পনা",
      text: `Rain probability today is ${rainProb}% (${next3RainMm.toFixed(1)} mm projected over 3 days). Delay light irrigation where soil moisture is adequate and avoid spraying right before showers.`
    });
  } else {
    alerts.push({
      level: "good",
      icon: "🌱",
      title: "Irrigation & Field Operations / সেচ ও চাষের পরামর্শ",
      text: `Low rainfall expected today (${rainProb}%, ${rainMm.toFixed(1)} mm). Suitable window for scheduled irrigation (morning/evening), intercultural weeding, and harvesting.`
    });
  }

  // Extreme heat warning
  if (maxTemp >= 38) {
    alerts.push({
      level: "danger",
      icon: "🔥",
      title: "Extreme Heat Warning / তীব্র তাপপ্রবাহ সতর্কতা",
      text: `Peak temperature may reach ${maxTemp.toFixed(1)}°C. Irrigate light & frequently in evening hours, mulch vegetable beds, and provide shade/cool water for livestock.`
    });
  }

  // Wind spraying warning
  if (wind >= 15 || maxWind >= 20) {
    alerts.push({
      level: "warning",
      icon: "💨",
      title: "Wind Warning for Spraying / স্প্রে করার জন্য বাতাসের সতর্কতা",
      text: `Current wind ${wind.toFixed(1)} km/h (gusts up to ${maxWind.toFixed(1)} km/h). Avoid pesticide/herbicide spraying during high winds to prevent chemical drift; spray early morning when wind < 10 km/h.`
    });
  } else {
    alerts.push({
      level: "good",
      icon: "🍃",
      title: "Spraying Wind Condition / স্প্রে-এর অনুকূল বাতাস",
      text: `Current wind speed is calm (${wind.toFixed(1)} km/h ${windCompass(w.current.windDir)}). Favorable for early morning or late afternoon spraying if rain probability is low.`
    });
  }

  return alerts;
}

export function renderWeatherView(state) {
  const w = state.weatherData;
  const loading = state.weatherLoading;
  const err = state.weatherError;
  const searchResults = state.weatherSearchResults || [];

  return `
    <div class="space-y-5 animate-fade-up">
      <!-- Header & Location Search -->
      <div class="gv-card p-4 sm:p-5 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="font-display text-xl sm:text-2xl font-bold text-[#14532D]">Weather Report &amp; Forecasting</h2>
            <p class="text-xs sm:text-sm text-[#496052]">আবহাওয়ার পূর্বাভাস ও কৃষি পরামর্শ • Real-time 7-day forecast for farmers &amp; students</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button data-action="weather-gps" type="button" ${loading ? "disabled" : ""} class="px-3.5 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">
              📍 Use My Location
            </button>
            ${w ? `
              <button data-action="weather-refresh" type="button" ${loading ? "disabled" : ""} class="px-3.5 py-2.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-extrabold">
                🔄 Refresh
              </button>
            ` : ""}
          </div>
        </div>

        <form id="weatherSearchForm" class="flex flex-col sm:flex-row gap-2">
          <input id="weatherLocationQuery" type="text" value="${escapeHtml(state.weatherQuery || "")}" placeholder="Search village, town, district or 6-digit Indian PIN code (e.g. Memari, 713146, Nadia)..." class="flex-1 px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E7E45]" />
          <button type="submit" ${loading ? "disabled" : ""} class="px-5 py-2.5 rounded-xl bg-[#1E7E45] hover:bg-[#14532D] text-white text-xs sm:text-sm font-extrabold shrink-0">
            ${loading ? "Loading..." : "Search Weather"}
          </button>
        </form>

        <!-- Quick Agricultural District Buttons -->
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          ${QUICK_WEATHER_LOCATIONS.map((loc, idx) => `
            <button type="button" data-weather-quick="${idx}" class="shrink-0 px-3 py-1.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-bold">
              ${escapeHtml(loc.name)}
            </button>
          `).join("")}
        </div>

        ${searchResults.length > 0 ? `
          <div class="rounded-2xl bg-[#F7F9F5] border border-[#CDE0D3] p-3 space-y-2">
            <div class="text-xs font-extrabold text-[#14532D]">Select your location / আপনার এলাকা নির্বাচন করুন:</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${searchResults.map((r, idx) => `
                <button type="button" data-weather-pick="${idx}" class="text-left px-3 py-2.5 rounded-xl bg-white hover:bg-[#D8F3DC] border border-[#CDE0D3] text-xs font-bold text-[#132219]">
                  📍 ${escapeHtml(r.name)}${r.admin1 ? `, ${escapeHtml(r.admin1)}` : ""}${r.country ? ` (${escapeHtml(r.country)})` : ""}
                </button>
              `).join("")}
            </div>
          </div>
        ` : ""}
      </div>

      ${err ? `
        <div class="rounded-2xl bg-rose-50 border border-rose-200 p-4 sm:p-5 space-y-2">
          <div class="text-sm font-extrabold text-rose-900">⚠️ Live Weather Unavailable</div>
          <p class="text-xs sm:text-sm text-rose-800">${escapeHtml(err)}</p>
          <p class="text-[11px] text-rose-700">Guru Ji Vision never displays fake weather numbers when the live API cannot be reached.</p>
        </div>
      ` : ""}

      ${loading && !w ? `
        <div class="gv-card p-8 text-center space-y-2">
          <div class="text-2xl animate-pulse">🌤️</div>
          <div class="text-sm font-bold text-[#14532D]">Fetching live weather report &amp; 7-day forecast...</div>
        </div>
      ` : ""}

      ${w ? renderWeatherDataCards(w) : ""}
    </div>
  `;
}

function renderWeatherDataCards(w) {
  const cur = w.current;
  const today = w.daily?.[0] || {};
  const cond = decodeWmo(cur.code);
  const advisories = buildAgriAdvisories(w);

  return `
    <!-- Current Weather Hero -->
    <div class="rounded-3xl bg-gradient-to-br from-[#0C3B20] via-[#14532D] to-[#1E7E45] text-white p-5 sm:p-6 shadow-lg space-y-5">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="text-xs font-bold uppercase tracking-wider text-emerald-200">
            📍 ${escapeHtml(w.location.name)}${w.location.admin1 ? `, ${escapeHtml(w.location.admin1)}` : ""}
          </div>
          <div class="flex items-center gap-3">
            <span class="text-4xl sm:text-5xl">${cond.icon}</span>
            <div>
              <div class="text-3xl sm:text-5xl font-extrabold leading-none">${Math.round(cur.temp)}°C</div>
              <div class="text-xs sm:text-sm font-semibold text-emerald-100 mt-1">${escapeHtml(cond.en)} • ${escapeHtml(cond.bn)}</div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div class="rounded-2xl bg-white/10 border border-white/15 p-3">
            <div class="text-emerald-200 text-[10px] font-bold">MIN / MAX</div>
            <div class="text-sm sm:text-base font-extrabold mt-0.5">${Math.round(today.minTemp ?? cur.temp)}° / ${Math.round(today.maxTemp ?? cur.temp)}°C</div>
          </div>
          <div class="rounded-2xl bg-white/10 border border-white/15 p-3">
            <div class="text-emerald-200 text-[10px] font-bold">RAIN CHANCE / বৃষ্টি</div>
            <div class="text-sm sm:text-base font-extrabold mt-0.5">${today.rainProbMax ?? 0}% (${(today.rainSumMm ?? 0).toFixed(1)} mm)</div>
          </div>
          <div class="rounded-2xl bg-white/10 border border-white/15 p-3">
            <div class="text-emerald-200 text-[10px] font-bold">HUMIDITY / আর্দ্রতা</div>
            <div class="text-sm sm:text-base font-extrabold mt-0.5">${cur.humidity}%</div>
          </div>
          <div class="rounded-2xl bg-white/10 border border-white/15 p-3">
            <div class="text-emerald-200 text-[10px] font-bold">WIND / বাতাস</div>
            <div class="text-sm sm:text-base font-extrabold mt-0.5">${cur.windSpeed} km/h ${windCompass(cur.windDir)}</div>
          </div>
          <div class="rounded-2xl bg-white/10 border border-white/15 p-3">
            <div class="text-emerald-200 text-[10px] font-bold">CLOUDS / মেঘ</div>
            <div class="text-sm sm:text-base font-extrabold mt-0.5">${cur.cloudCover}%</div>
          </div>
          <div class="rounded-2xl bg-white/10 border border-white/15 p-3">
            <div class="text-emerald-200 text-[10px] font-bold">SUNRISE / SUNSET</div>
            <div class="text-xs sm:text-sm font-extrabold mt-0.5">🌅 ${formatClockTime(today.sunrise)} • 🌇 ${formatClockTime(today.sunset)}</div>
          </div>
        </div>
      </div>

      <div class="pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-100/90">
        <span>Data Source: <strong>${escapeHtml(w.sourceName)}</strong></span>
        <span>Last Updated: <strong>${escapeHtml(w.fetchedAt)}</strong></span>
      </div>
    </div>

    <!-- Farmer Agricultural Advisories & Alerts -->
    <div class="gv-card p-4 sm:p-5 space-y-3">
      <h3 class="text-base font-extrabold text-[#14532D]">🌾 Farmer Weather Advisory &amp; Alerts (কৃষি আবহাওয়া সতর্কতা)</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${advisories.map((a) => {
          const style = a.level === "danger"
            ? "bg-rose-50 border-rose-200 text-rose-950"
            : a.level === "warning"
            ? "bg-amber-50 border-amber-200 text-amber-950"
            : a.level === "info"
            ? "bg-sky-50 border-sky-200 text-sky-950"
            : "bg-emerald-50 border-emerald-200 text-emerald-950";
          return `
            <div class="rounded-2xl border p-3.5 space-y-1 ${style}">
              <div class="text-xs sm:text-sm font-extrabold">${a.icon} ${escapeHtml(a.title)}</div>
              <p class="text-xs leading-relaxed opacity-95">${escapeHtml(a.text)}</p>
            </div>
          `;
        }).join("")}
      </div>
    </div>

    <!-- Hourly Forecast (Next 24 Hours) -->
    <div class="gv-card p-4 sm:p-5 space-y-3">
      <h3 class="text-base font-extrabold text-[#14532D]">🕒 Hourly Weather Forecast (Next 24 Hours / ঘণ্টাভিত্তিক পূর্বাভাস)</h3>
      <div class="flex gap-2.5 overflow-x-auto pb-2">
        ${(w.hourly || []).map((h) => {
          const hc = decodeWmo(h.code);
          return `
            <div class="shrink-0 w-24 rounded-2xl bg-[#F7F9F5] border border-[#CDE0D3] p-3 text-center space-y-1">
              <div class="text-[11px] font-bold text-[#496052]">${formatClockTime(h.time)}</div>
              <div class="text-xl">${hc.icon}</div>
              <div class="text-sm font-extrabold text-[#132219]">${Math.round(h.temp)}°C</div>
              <div class="text-[10px] font-bold text-sky-700">💧 ${h.rainProb}%</div>
              <div class="text-[10px] text-[#496052]">💨 ${Math.round(h.windKmh)} km/h</div>
            </div>
          `;
        }).join("")}
      </div>
    </div>

    <!-- 7-Day Weather Forecast -->
    <div class="gv-card p-4 sm:p-5 space-y-3">
      <h3 class="text-base font-extrabold text-[#14532D]">📅 7-Day Weather Forecast (৭ দিনের পূর্বাভাস)</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
        ${(w.daily || []).map((d, idx) => {
          const dc = decodeWmo(d.code);
          return `
            <div class="rounded-2xl border ${idx === 0 ? "bg-[#EDF4EE] border-[#14532D]/40" : "bg-[#F7F9F5] border-[#CDE0D3]"} p-3 flex sm:flex-col items-center justify-between sm:text-center gap-2">
              <div class="text-xs font-extrabold text-[#14532D] min-w-[92px] sm:min-w-0">${escapeHtml(formatDayLabel(d.date, idx))}</div>
              <div class="text-2xl">${dc.icon}</div>
              <div class="text-[11px] text-[#496052] hidden sm:block line-clamp-1">${escapeHtml(dc.en)}</div>
              <div class="text-xs sm:text-sm font-extrabold text-[#132219]">${Math.round(d.minTemp)}° / ${Math.round(d.maxTemp)}°C</div>
              <div class="text-[11px] font-bold text-sky-700">💧 ${d.rainProbMax}% • ${Number(d.rainSumMm).toFixed(1)}mm</div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 2. CROP MARKET PRICE – ফসলের বাজারদর (Official AGMARKNET + Admin Verified)
// ----------------------------------------------------------------------------
export async function fetchOfficialMandiPrices({ state = "", district = "", commodity = "", market = "" } = {}) {
  try {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (district) params.set("district", district);
    if (commodity) params.set("commodity", commodity);
    if (market) params.set("market", market);
    params.set("limit", "80");

    const res = await fetch(`/.netlify/functions/mandi-prices?${params.toString()}`);
    if (!res.ok) {
      return { ok: false, configured: false, records: [], error: `Market API proxy unavailable (HTTP ${res.status}).` };
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return { ok: false, configured: false, records: [], error: "Live AGMARKNET serverless proxy activates on Netlify deployment when DATA_GOV_API_KEY is configured." };
    }
    return await res.json();
  } catch (_) {
    return {
      ok: false,
      configured: false,
      records: [],
      error: "Official AGMARKNET serverless proxy is not reachable in this preview. Deploy on Netlify with DATA_GOV_API_KEY or publish verified rates via Admin Studio."
    };
  }
}

export function renderMarketPriceView(state) {
  const apiRecords = state.mandiApiRecords || [];
  const adminRecords = (state.firestoreMarketPrices || []).filter((r) => r.published !== false);
  const allRecords = [...apiRecords, ...adminRecords];

  const qCrop = (state.marketSearchCrop || "").trim().toLowerCase();
  const fState = state.marketFilterState || "ALL";
  const fDistrict = state.marketFilterDistrict || "ALL";
  const fMarket = state.marketFilterMandi || "ALL";

  const states = [...new Set(allRecords.map((r) => r.state).filter(Boolean))].sort();
  const districts = [...new Set(allRecords.filter((r) => fState === "ALL" || r.state === fState).map((r) => r.district).filter(Boolean))].sort();
  const markets = [...new Set(allRecords.filter((r) => (fState === "ALL" || r.state === fState) && (fDistrict === "ALL" || r.district === fDistrict)).map((r) => r.marketName).filter(Boolean))].sort();

  const filtered = allRecords.filter((r) => {
    if (fState !== "ALL" && r.state !== fState) return false;
    if (fDistrict !== "ALL" && r.district !== fDistrict) return false;
    if (fMarket !== "ALL" && r.marketName !== fMarket) return false;
    if (qCrop) {
      const bn = getCropBengaliName(r.cropName, r.cropNameBn);
      const hay = `${r.cropName} ${bn} ${r.variety || ""} ${r.marketName} ${r.district} ${r.state}`.toLowerCase();
      if (!hay.includes(qCrop)) return false;
    }
    return true;
  });

  // Same-Crop, Same-Unit Market Price Comparison
  const compGroups = new Map();
  filtered.forEach((r) => {
    const key = `${String(r.cropName).toLowerCase()}||${String(r.unit || "₹ / Quintal").toLowerCase()}`;
    if (!compGroups.has(key)) compGroups.set(key, []);
    compGroups.get(key).push(r);
  });
  const comparisons = [];
  for (const [, rows] of compGroups.entries()) {
    const uniqueMkts = new Set(rows.map((r) => `${r.marketName}-${r.district}`));
    if (uniqueMkts.size >= 2) {
      const sorted = [...rows].sort((a, b) => (Number(b.modalPrice) || 0) - (Number(a.modalPrice) || 0));
      comparisons.push({
        cropName: sorted[0].cropName,
        cropNameBn: getCropBengaliName(sorted[0].cropName, sorted[0].cropNameBn),
        unit: sorted[0].unit || "₹ / Quintal",
        best: sorted[0],
        lowest: sorted[sorted.length - 1],
        rows: sorted.slice(0, 4)
      });
    }
  }

  return `
    <div class="space-y-5 animate-fade-up">
      <!-- Header -->
      <div class="rounded-3xl bg-gradient-to-br from-[#14532D] to-[#1E7E45] text-white p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold text-emerald-100">
            🌾 Verified Market Transparency • Zero Fabricated Rates
          </div>
          <h2 class="font-display text-xl sm:text-2xl font-bold">Crop Market Price – ফসলের বাজারদর</h2>
          <p class="text-xs sm:text-sm text-emerald-100">Compare genuine mandi minimum, maximum &amp; modal prices with official source and reporting dates.</p>
        </div>
        <div class="flex flex-wrap gap-2 shrink-0">
          <button data-action="refresh-mandi" type="button" ${state.mandiLoading ? "disabled" : ""} class="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0C3B20] text-xs font-extrabold">
            ${state.mandiLoading ? "Syncing..." : "🔄 Refresh Live AGMARKNET"}
          </button>
          <a href="https://agmarknet.gov.in/" target="_blank" rel="noopener noreferrer" class="gv-btn inline-flex items-center px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold">
            Official AGMARKNET ↗
          </a>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="gv-card p-4 space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <input id="marketCropSearch" type="search" value="${escapeHtml(state.marketSearchCrop || "")}" placeholder="Search crop (Rice/ধান, Potato/আলু, Onion, Mustard)..." class="px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
          <select id="marketStateSelect" class="px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm font-semibold">
            <option value="ALL">All States (${states.length})</option>
            ${states.map((s) => `<option value="${escapeHtml(s)}" ${fState === s ? "selected" : ""}>${escapeHtml(s)}</option>`).join("")}
          </select>
          <select id="marketDistrictSelect" class="px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm font-semibold">
            <option value="ALL">All Districts (${districts.length})</option>
            ${districts.map((d) => `<option value="${escapeHtml(d)}" ${fDistrict === d ? "selected" : ""}>${escapeHtml(d)}</option>`).join("")}
          </select>
          <select id="marketMandiSelect" class="px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm font-semibold">
            <option value="ALL">All Mandis / Markets (${markets.length})</option>
            ${markets.map((m) => `<option value="${escapeHtml(m)}" ${fMarket === m ? "selected" : ""}>${escapeHtml(m)}</option>`).join("")}
          </select>
        </div>

        <div class="flex flex-wrap gap-1.5">
          ${["Paddy", "Rice", "Wheat", "Potato", "Onion", "Tomato", "Mustard", "Brinjal", "Jute"].map((crop) => {
            const bn = getCropBengaliName(crop);
            return `
              <button type="button" data-market-quick-crop="${escapeHtml(crop)}" class="px-3 py-1.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-bold">
                ${escapeHtml(crop)}${bn ? ` (${escapeHtml(bn)})` : ""}
              </button>
            `;
          }).join("")}
          ${qCrop ? `<button type="button" data-market-quick-crop="" class="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold">Clear</button>` : ""}
        </div>
      </div>

      ${state.mandiStatusMessage ? `
        <div class="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-950 space-y-1.5">
          <div class="font-extrabold">ℹ️ Official Data Source Status</div>
          <p>${escapeHtml(state.mandiStatusMessage)}</p>
          <div class="flex flex-wrap gap-2 pt-1">
            <a href="https://agmarknet.gov.in/" target="_blank" rel="noopener noreferrer" class="underline font-bold text-[#14532D]">Open Govt. AGMARKNET Portal ↗</a>
            <a href="https://sufalbangla.in/" target="_blank" rel="noopener noreferrer" class="underline font-bold text-[#14532D]">West Bengal Sufal Bangla Daily Rates ↗</a>
          </div>
        </div>
      ` : ""}

      <!-- Same-Crop Market Price Comparison -->
      ${comparisons.length > 0 ? `
        <div class="gv-card p-4 sm:p-5 space-y-3">
          <div>
            <h3 class="text-base font-extrabold text-[#14532D]">📊 Market Price Comparison (কোন বাজারে বেশি দাম?)</h3>
            <p class="text-xs text-[#496052]">Comparing same crop &amp; unit across available markets so farmers can spot better prices.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${comparisons.slice(0, 6).map((c) => {
              const diff = (Number(c.best.modalPrice) || 0) - (Number(c.lowest.modalPrice) || 0);
              return `
                <div class="rounded-2xl bg-[#F7F9F5] border border-[#CDE0D3] p-4 space-y-2">
                  <div class="flex items-center justify-between gap-2">
                    <div class="font-extrabold text-sm text-[#14532D]">
                      ${escapeHtml(c.cropName)} ${c.cropNameBn ? `<span class="text-[#1E7E45]">(${escapeHtml(c.cropNameBn)})</span>` : ""}
                    </div>
                    <span class="px-2 py-0.5 rounded-lg bg-emerald-100 text-[#14532D] text-[10px] font-extrabold">${escapeHtml(c.unit)}</span>
                  </div>
                  <div class="space-y-1.5">
                    ${c.rows.map((r, i) => `
                      <div class="flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded-xl ${i === 0 ? "bg-emerald-100/80 font-extrabold text-[#0C3B20]" : "bg-white border border-emerald-50"}">
                        <span class="truncate">${i === 0 ? "🏆 " : ""}${escapeHtml(r.marketName)}, ${escapeHtml(r.district)} <span class="text-[10px] opacity-75">(${escapeHtml(r.reportDate)})</span></span>
                        <span class="shrink-0">${formatInr(r.modalPrice)}</span>
                      </div>
                    `).join("")}
                  </div>
                  ${diff > 0 ? `<div class="text-[11px] font-bold text-[#1E7E45]">Potential difference: +${formatInr(diff)} higher at ${escapeHtml(c.best.marketName)}</div>` : ""}
                </div>
              `;
            }).join("")}
          </div>
        </div>
      ` : ""}

      <!-- Market Price Cards (Mobile-first) -->
      ${filtered.length === 0 ? `
        <div class="gv-card p-6 sm:p-8 text-center space-y-3">
          <div class="text-3xl">🌾</div>
          <h3 class="text-base font-extrabold text-[#14532D]">No Verified Mandi Prices Loaded Yet</h3>
          <p class="text-xs sm:text-sm text-[#496052] max-w-xl mx-auto leading-relaxed">
            Guru Ji Vision strictly refuses to show invented or fake crop prices.
            To display live daily rates automatically, add a free Government of India <strong>DATA_GOV_API_KEY</strong> (from data.gov.in) in Netlify Environment Variables, or publish verified local mandi bulletins from the <strong>Admin Studio → Market Prices</strong> tab.
          </p>
          <div class="flex flex-wrap justify-center gap-2 pt-1">
            <a href="https://agmarknet.gov.in/" target="_blank" rel="noopener noreferrer" class="gv-btn px-4 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">Check Official AGMARKNET ↗</a>
            <a href="https://sufalbangla.in/" target="_blank" rel="noopener noreferrer" class="gv-btn px-4 py-2.5 rounded-xl bg-[#EDF4EE] text-[#14532D] text-xs font-extrabold">WB Sufal Bangla Rates ↗</a>
          </div>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${filtered.map((r) => {
            const bn = getCropBengaliName(r.cropName, r.cropNameBn);
            const srcHref = safeUrl(r.sourceUrl);
            return `
              <article class="gv-card p-4 sm:p-5 space-y-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <h4 class="text-base font-extrabold text-[#14532D] truncate">${escapeHtml(r.cropName)}</h4>
                    ${bn ? `<div class="text-xs font-bold text-[#1E7E45]">${escapeHtml(bn)}</div>` : ""}
                    ${r.variety ? `<div class="text-[11px] text-[#496052]">Variety: ${escapeHtml(r.variety)}</div>` : ""}
                  </div>
                  <span class="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 text-[10px] font-extrabold shrink-0">${escapeHtml(r.unit || "₹ / Quintal")}</span>
                </div>

                <div class="grid grid-cols-3 gap-2 text-center">
                  <div class="rounded-xl bg-[#F7F9F5] border border-[#CDE0D3] p-2">
                    <div class="text-[10px] font-bold text-[#496052]">MIN / সর্বনিম্ন</div>
                    <div class="text-xs sm:text-sm font-extrabold text-[#132219]">${formatInr(r.minPrice)}</div>
                  </div>
                  <div class="rounded-xl bg-[#D8F3DC] border border-[#14532D]/30 p-2">
                    <div class="text-[10px] font-extrabold text-[#14532D]">MODAL / গড়</div>
                    <div class="text-sm sm:text-base font-extrabold text-[#0C3B20]">${formatInr(r.modalPrice)}</div>
                  </div>
                  <div class="rounded-xl bg-[#F7F9F5] border border-[#CDE0D3] p-2">
                    <div class="text-[10px] font-bold text-[#496052]">MAX / সর্বোচ্চ</div>
                    <div class="text-xs sm:text-sm font-extrabold text-[#132219]">${formatInr(r.maxPrice)}</div>
                  </div>
                </div>

                <div class="text-xs text-[#496052] space-y-1 pt-2 border-t border-emerald-50">
                  <div><strong>Market / বাজার:</strong> ${escapeHtml(r.marketName)}, ${escapeHtml(r.district)}, ${escapeHtml(r.state)}</div>
                  <div><strong>Report Date / তারিখ:</strong> <span class="font-bold text-[#132219]">${escapeHtml(r.reportDate)}</span></div>
                  <div class="flex items-center justify-between gap-2 text-[11px]">
                    <span class="truncate"><strong>Source:</strong> ${escapeHtml(r.sourceName)}</span>
                    ${srcHref ? `<a href="${escapeHtml(srcHref)}" target="_blank" rel="noopener noreferrer" class="text-[#1E7E45] font-bold hover:underline shrink-0">Verify ↗</a>` : ""}
                  </div>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      `}
    </div>
  `;
}
