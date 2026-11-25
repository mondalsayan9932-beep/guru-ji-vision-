// ============================================================================
// Guru Ji Vision — Public & Educational Module Renderers
// Home, Student Hub (Notes/Syllabus/MCQ), Farmer Help, Agri Tools,
// AI Guru Knowledge Base, and Career & Student Community
// ============================================================================

import {
  AREA_UNITS,
  CAREER_CATEGORIES,
  COMMUNITY_TOPICS,
  CROP_PRESETS,
  GREEN_HEAVEN_CONFIG,
  ICAR_SYLLABUS,
  STUDY_CATEGORIES
} from "./config.js";
import {
  buildWhatsAppDirectUrl,
  calculateFertilizer,
  calculateSeedRate,
  escapeHtml,
  formatDateShort,
  isUpcomingMeeting,
  safeUrl
} from "./calculators.js";
import {
  SCHEME_CATEGORIES,
  mergeAgricultureSchemes
} from "./govt-schemes-data.js";
import {
  mergeQuizQuestions,
  mergeStudyMaterials,
  mergeSyllabi
} from "./agri-education-data.js";
import { renderAgriEducationView } from "./agri-education-ui.js";

const GREEN_HEAVEN_LOGO_SVG = `
  <span class="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#14532D] to-[#15803D] text-[#DCFCE7] shadow-sm shrink-0" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 20a10 10 0 0 0 10-10 25.9 25.9 0 0 0-1.04-7.281 1 1 0 0 0-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0 0 11 20"></path>
      <path d="M2 21a5 5 0 0 1 2.911-4.544C7.613 15.212 8.351 15.24 11 13"></path>
    </svg>
  </span>
`;

// Lightweight Unified Smart Agriculture Line Icons (Zero external library overhead)
const AGRI_ICONS = {
  weather: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>`,
  market: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`,
  marketplace: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  student: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  career: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  advisor: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>`,
  money: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  farmer: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 22V8m0 0C12 4 9 2 6 2c0 3 2 6 6 6Zm0 0c0-4 3-6 6-6 0 3-2 6-6 6ZM7 14c-2 0-4 1.5-4 4 3 0 5-1 5-4Zm10 0c2 0 4 1.5 4 4-3 0-5-1-5-4Z"/></svg>`,
  tools: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="8" x2="8.01" y1="11" y2="11"/><line x1="12" x2="12.01" y1="11" y2="11"/><line x1="16" x2="16.01" y1="11" y2="11"/><line x1="8" x2="8.01" y1="15" y2="15"/><line x1="12" x2="12.01" y1="15" y2="15"/><line x1="16" x2="16.01" y1="15" y2="15"/></svg>`,
  ai: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>`,
  community: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  meeting: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>`,
  professor: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  bell: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  message: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`,
  chevron: `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>`,
  back: `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>`,
  notes: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
  quiz: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  syllabus: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>`,
  pyq: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  resources: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  scheme: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>`,
  rights: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  briefcase: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`
};

// Lightweight Precision Agriculture Landscape Background Illustration (Inline SVG — 0 network requests)
const SMART_FARMING_HERO_ART = `
  <svg class="absolute inset-0 w-full h-full pointer-events-none select-none opacity-90" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <radialGradient id="gvHeroGlow" cx="85%" cy="18%" r="48%">
        <stop offset="0%" stop-color="#22C55E" stop-opacity="0.34"/>
        <stop offset="55%" stop-color="#15803D" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#14532D" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="gvFieldWave1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#22C55E" stop-opacity="0.10"/>
        <stop offset="50%" stop-color="#DCFCE7" stop-opacity="0.16"/>
        <stop offset="100%" stop-color="#22C55E" stop-opacity="0.06"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="420" fill="url(#gvHeroGlow)"/>
    <!-- Subtle terraced smart-farming crop field contours -->
    <path d="M0 335 C 240 275, 480 375, 760 305 C 940 260, 1080 280, 1200 250 L 1200 420 L 0 420 Z" fill="url(#gvFieldWave1)"/>
    <path d="M0 370 C 290 325, 560 405, 860 340 C 1020 306, 1120 320, 1200 300 L 1200 420 L 0 420 Z" fill="#22C55E" fill-opacity="0.09"/>
    <path d="M-20 315 C 250 255, 500 355, 780 285 C 950 242, 1090 258, 1220 228" fill="none" stroke="#DCFCE7" stroke-opacity="0.18" stroke-width="1.5" stroke-dasharray="6 8"/>
    <!-- Precision Agriculture Telemetry Nodes & Signal Arcs -->
    <g stroke="#DCFCE7" stroke-opacity="0.22" fill="none">
      <circle cx="980" cy="110" r="34" stroke-width="1.2"/>
      <circle cx="980" cy="110" r="64" stroke-width="1" stroke-dasharray="4 6"/>
      <circle cx="980" cy="110" r="96" stroke-width="0.9" stroke-dasharray="2 8"/>
      <line x1="980" y1="110" x2="860" y2="195" stroke-width="1" stroke-dasharray="3 5"/>
      <line x1="980" y1="110" x2="1095" y2="180" stroke-width="1" stroke-dasharray="3 5"/>
    </g>
    <g fill="#22C55E" fill-opacity="0.7">
      <circle cx="980" cy="110" r="4.5"/>
      <circle cx="860" cy="195" r="3.5"/>
      <circle cx="1095" cy="180" r="3.5"/>
    </g>
  </svg>
`;

function renderGreenHeavenCompactCard() {
  const gh = GREEN_HEAVEN_CONFIG;
  return `
    <div class="rounded-3xl border border-[#BBF7D0] bg-gradient-to-r from-[#ECFDF5] via-white to-[#F0FDF4] p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-start gap-3.5 min-w-0">
        ${GREEN_HEAVEN_LOGO_SVG}
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm sm:text-base font-extrabold text-[#14532D]">${escapeHtml(gh.sectionTitle)}</span>
            <span class="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#14532D] text-[10px] font-extrabold uppercase tracking-wide">Open Access • No Login Needed</span>
          </div>
          <p class="text-xs sm:text-sm text-[#475569] mt-0.5">
            Shop verified Indoor, Flowering, Outdoor &amp; Succulent plants, Gladiolus bulbs, and organic Vermi Compost directly on Green Heaven.
          </p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <a href="${escapeHtml(gh.baseUrl)}" target="_blank" rel="noopener noreferrer" class="gv-btn inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#14532D] to-[#15803D] hover:opacity-95 text-white text-xs sm:text-sm font-extrabold shadow-sm transition-opacity">
          <span>Shop Now ↗</span>
        </a>
        <button data-nav="marketplace" type="button" class="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#ECFDF5] border border-[#D9EAE0] text-[#14532D] text-xs font-extrabold transition-colors">
          View Categories
        </button>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 1. HOME DASHBOARD — TWO-ZONE SMART AGRICULTURE ENTRY (STUDENT & FARMER ZONES)
// ----------------------------------------------------------------------------
export function renderHomeView(state) {
  const settings = state.appSettings;
  const publicMaterials = state.studyMaterials.filter((m) => m.published !== false);
  const activeNotices = state.announcements.filter((a) => a.active !== false);
  const upcomingMeetings = state.meetings.filter((m) => m.published !== false && isUpcomingMeeting(m));
  const waDirect = buildWhatsAppDirectUrl(settings.whatsappNumber, "Namaskar Guru Ji Vision Team, I need help regarding agriculture / B.Sc Agriculture.");
  const waGroup = safeUrl(settings.whatsappGroupInviteUrl);
  const isProf = state.facultyIdentity?.isAuthorizedProfessor;
  const unreadDoubts = state.totalUnreadDoubts || 0;

  const userDisplayName = state.userProfile?.displayName || state.user?.displayName || state.user?.email?.split("@")[0] || "Scholar";
  const userPhoto = safeUrl(state.userProfile?.photoUrl || state.user?.photoURL || "");
  const userRoleLabel = isProf
    ? "Verified Professor"
    : (state.userProfile?.role === "FARMER" ? "Farmer" : (state.isAdmin ? "Admin" : "Student"));
  const userSubMeta = state.userProfile?.institutionOrVillage || state.userProfile?.district || state.user?.email || "";

  return `
    <div data-home-dashboard="true" class="space-y-6">
      <div data-home-slot="maintenance-banner" class="${settings.maintenanceBanner ? "" : "hidden"}">
        ${settings.maintenanceBanner ? `
          <div class="rounded-2xl bg-amber-50 border border-amber-300 px-4 py-3 text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2.5 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <span data-home-slot="maintenance-text">${escapeHtml(settings.maintenanceBanner)}</span>
          </div>
        ` : ""}
      </div>

      <!-- ==================== SMART AGRICULTURE HERO HEADER ==================== -->
      <section class="relative overflow-hidden rounded-3xl gv-hero-agritech text-white">
        <div class="absolute inset-0 gv-hero-grid pointer-events-none"></div>
        ${SMART_FARMING_HERO_ART}

        <div class="relative z-10 p-5 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-4 max-w-2xl">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/12 border border-white/20 backdrop-blur-sm text-[11px] font-bold text-[#DCFCE7]">
                <span class="w-2 h-2 rounded-full bg-[#22C55E] shadow-[0_0_8px_#22C55E]"></span>
                <span data-home-slot="cloud-status">${state.cloudConnected ? "Live Smart Agri Cloud Connected" : "Smart Agriculture • Open Public Access"}</span>
              </span>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 text-[11px] font-bold text-[#DCFCE7]">
                Smart Agriculture Technology Platform
              </span>
            </div>

            ${state.user ? `
              <div class="inline-flex items-center gap-3 rounded-2xl bg-white/12 border border-white/20 backdrop-blur-sm px-3.5 py-2.5 max-w-full">
                ${userPhoto
                  ? `<img src="${escapeHtml(userPhoto)}" alt="${escapeHtml(userDisplayName)}" class="w-9 h-9 rounded-xl object-cover ring-2 ring-[#22C55E]/70 shrink-0" />`
                  : `<div class="w-9 h-9 rounded-xl bg-[#22C55E]/25 border border-[#DCFCE7]/30 text-white font-extrabold text-sm flex items-center justify-center shrink-0">${escapeHtml(userDisplayName.charAt(0).toUpperCase())}</div>`
                }
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span data-home-slot="user-name" class="text-xs sm:text-sm font-extrabold text-white truncate">Welcome, ${escapeHtml(userDisplayName)}</span>
                    <span data-home-slot="user-role" class="px-2 py-0.5 rounded-full bg-[#22C55E]/25 text-[#DCFCE7] text-[10px] font-extrabold">${escapeHtml(userRoleLabel)}</span>
                  </div>
                  <div data-home-slot="user-sub" class="text-[11px] text-[#DCFCE7]/85 truncate ${userSubMeta ? "" : "hidden"}">${escapeHtml(userSubMeta)}</div>
                </div>
                <button data-action="open-profile" type="button" class="ml-1 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-[11px] font-extrabold text-white shrink-0 transition-colors">
                  Profile
                </button>
              </div>
            ` : ""}

            <div class="space-y-2">
              <h2 data-home-slot="hero-headline" class="font-display text-2xl sm:text-4xl font-bold leading-tight tracking-tight text-white">
                ${escapeHtml(settings.heroHeadline)}
              </h2>
              <p data-home-slot="about-text" class="text-sm sm:text-base text-[#DCFCE7]/90 leading-relaxed max-w-xl">
                ${escapeHtml(settings.aboutText)}
              </p>
            </div>

            <div class="flex flex-wrap gap-2.5 pt-1">
              ${!state.user ? `
                <button data-action="open-auth" type="button" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#052E16] text-xs sm:text-sm font-extrabold shadow-md transition-colors">
                  <span>Continue with Google</span>
                </button>
              ` : `
                <button data-action="open-profile" type="button" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/14 hover:bg-white/24 border border-white/25 text-white text-xs sm:text-sm font-bold backdrop-blur-sm transition-colors">
                  <span>My Account &amp; Role</span>
                </button>
              `}
              ${isProf ? `
                <button data-nav="professor" type="button" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#ECFDF5] text-[#14532D] text-xs sm:text-sm font-extrabold shadow-md transition-colors">
                  ${AGRI_ICONS.professor}
                  <span>Professor Dashboard</span>
                </button>
              ` : ""}
              ${state.isAdmin ? `
                <button data-nav="admin" type="button" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/14 hover:bg-white/24 border border-white/25 text-white text-xs sm:text-sm font-bold backdrop-blur-sm transition-colors">
                  <span>Admin Panel</span>
                </button>
              ` : ""}
              ${state.isSuperAdmin ? `
                <button data-nav="owner" type="button" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#052E16] text-xs sm:text-sm font-extrabold shadow-sm transition-colors">
                  <span>Owner Control</span>
                </button>
              ` : ""}
            </div>
          </div>

          <!-- Compact Live Platform Counters -->
          <div class="grid grid-cols-3 lg:grid-cols-2 gap-2.5 sm:gap-3 shrink-0 lg:w-72">
            <div class="rounded-2xl bg-white/10 border border-white/18 backdrop-blur-md p-3.5 text-center lg:text-left">
              <div class="text-[10px] font-bold uppercase tracking-wider text-[#DCFCE7]/80">Resources</div>
              <div data-home-slot="stat-materials" class="text-xl sm:text-2xl font-extrabold text-white mt-0.5">${publicMaterials.length}</div>
              <div class="text-[11px] text-[#DCFCE7]/85">Notes &amp; PDFs</div>
            </div>
            <div class="rounded-2xl bg-white/10 border border-white/18 backdrop-blur-md p-3.5 text-center lg:text-left">
              <div class="text-[10px] font-bold uppercase tracking-wider text-[#DCFCE7]/80">Experts</div>
              <div data-home-slot="stat-professors" class="text-xl sm:text-2xl font-extrabold text-[#86EFAC] mt-0.5">${state.professors.length}</div>
              <div class="text-[11px] text-[#DCFCE7]/85">Faculty Advisors</div>
            </div>
            <div class="rounded-2xl bg-white/10 border border-white/18 backdrop-blur-md p-3.5 text-center lg:text-left">
              <div class="text-[10px] font-bold uppercase tracking-wider text-[#DCFCE7]/80">Updates</div>
              <div data-home-slot="stat-notices" class="text-xl sm:text-2xl font-extrabold text-white mt-0.5">${activeNotices.length}</div>
              <div class="text-[11px] text-[#DCFCE7]/85">Active Notices</div>
            </div>
            <div class="hidden lg:block rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 backdrop-blur-md p-3.5 text-left">
              <div class="text-[10px] font-bold uppercase tracking-wider text-[#DCFCE7]/85">Live Sessions</div>
              <div data-home-slot="stat-meetings" class="text-xl sm:text-2xl font-extrabold text-[#DCFCE7] mt-0.5">${upcomingMeetings.length}</div>
              <div class="text-[11px] text-[#DCFCE7]/85">Scheduled Meets</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ==================== PRIMARY TWO-ZONE DASHBOARD CARDS ==================== -->
      <section class="space-y-4">
        <div class="px-1">
          <h3 class="text-lg sm:text-xl font-extrabold text-[#14532D] tracking-tight">Choose Your Zone</h3>
          <p class="text-xs sm:text-sm text-[#475569]">Select Student Zone or Farmer Zone to access organized tools, learning resources, and shared community services.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- CARD 1: STUDENT ZONE -->
          <button data-nav="student-zone" type="button" class="group text-left rounded-3xl bg-white border-2 border-[#D9EAE0] hover:border-[#15803D] shadow-[0_8px_28px_-12px_rgba(20,83,45,0.18)] hover:shadow-[0_14px_34px_-12px_rgba(20,83,45,0.28)] overflow-hidden transition-all duration-200 flex flex-col justify-between">
            <div class="h-2 w-full bg-gradient-to-r from-[#14532D] via-[#15803D] to-[#22C55E]"></div>
            <div class="p-6 sm:p-7 space-y-5 flex-1 flex flex-col justify-between w-full">
              <div class="space-y-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#14532D] to-[#15803D] text-white flex items-center justify-center shadow-md shrink-0">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                  </div>
                  <div class="flex flex-wrap items-center justify-end gap-1.5">
                    <span data-home-slot="student-unread-badge" class="${unreadDoubts > 0 ? "" : "hidden "}px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold">${unreadDoubts > 0 ? `${unreadDoubts} unread` : ""}</span>
                    <span class="px-3 py-1 rounded-full bg-[#DCFCE7] text-[#14532D] text-[11px] font-extrabold">B.Sc Agriculture</span>
                  </div>
                </div>

                <div class="space-y-1.5">
                  <h4 class="font-display text-xl sm:text-2xl font-bold text-[#14532D] group-hover:text-[#15803D] transition-colors">
                    Student Zone | শিক্ষার্থী জোন
                  </h4>
                  <p class="text-sm text-[#475569] leading-relaxed">
                    Everything an Agriculture Student Needs in One Place.
                  </p>
                </div>

                <div class="flex flex-wrap gap-1.5 pt-1">
                  <span class="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#D9EAE0] text-[#14532D] text-[11px] font-bold">Study Notes</span>
                  <span class="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#D9EAE0] text-[#14532D] text-[11px] font-bold">MCQs &amp; PYQs</span>
                  <span class="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#D9EAE0] text-[#14532D] text-[11px] font-bold">ICAR Syllabus</span>
                  <span class="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#D9EAE0] text-[#14532D] text-[11px] font-bold">Career Guidance</span>
                  <span class="px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] text-[11px] font-bold">+ 5 Shared Modules</span>
                </div>
              </div>

              <div class="pt-4 border-t border-[#E2E8F0] flex items-center justify-between gap-2 w-full">
                <span data-home-slot="student-zone-meta" class="text-xs font-bold text-[#15803D]">${publicMaterials.length} Notes &amp; Study Resources Ready</span>
                <span class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#15803D] text-white text-xs font-extrabold shadow-sm group-hover:translate-x-0.5 transition-transform">
                  <span>Open Student Zone</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          </button>

          <!-- CARD 2: FARMER ZONE -->
          <button data-nav="farmer-zone" type="button" class="group text-left rounded-3xl bg-white border-2 border-[#D9EAE0] hover:border-[#15803D] shadow-[0_8px_28px_-12px_rgba(20,83,45,0.18)] hover:shadow-[0_14px_34px_-12px_rgba(20,83,45,0.28)] overflow-hidden transition-all duration-200 flex flex-col justify-between">
            <div class="h-2 w-full bg-gradient-to-r from-[#15803D] via-[#16A34A] to-[#22C55E]"></div>
            <div class="p-6 sm:p-7 space-y-5 flex-1 flex flex-col justify-between w-full">
              <div class="space-y-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#15803D] to-[#22C55E] text-white flex items-center justify-center shadow-md shrink-0">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 22V8m0 0C12 4 9 2 6 2c0 3 2 6 6 6Zm0 0c0-4 3-6 6-6 0 3-2 6-6 6ZM7 14c-2 0-4 1.5-4 4 3 0 5-1 5-4Zm10 0c2 0 4 1.5 4 4-3 0-5-1-5-4Z"/>
                    </svg>
                  </div>
                  <span class="px-3 py-1 rounded-full bg-[#DCFCE7] text-[#14532D] text-[11px] font-extrabold">Smart Farming</span>
                </div>

                <div class="space-y-1.5">
                  <h4 class="font-display text-xl sm:text-2xl font-bold text-[#14532D] group-hover:text-[#15803D] transition-colors">
                    Farmer Zone | কৃষক জোন
                  </h4>
                  <p class="text-sm text-[#475569] leading-relaxed">
                    Smart Agriculture, Farming Resources and Farmer Support.
                  </p>
                </div>

                <div class="flex flex-wrap gap-1.5 pt-1">
                  <span class="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#D9EAE0] text-[#14532D] text-[11px] font-bold">Mandi Price (বাজারদর)</span>
                  <span class="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#D9EAE0] text-[#14532D] text-[11px] font-bold">Weather Forecast</span>
                  <span class="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#D9EAE0] text-[#14532D] text-[11px] font-bold">Crop Disease &amp; Advisory</span>
                  <span class="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#D9EAE0] text-[#14532D] text-[11px] font-bold">Govt Schemes (সরকারি প্রকল্প)</span>
                  <span class="px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] text-[11px] font-bold">+ 5 Shared Modules</span>
                </div>
              </div>

              <div class="pt-4 border-t border-[#E2E8F0] flex items-center justify-between gap-2 w-full">
                <span data-home-slot="farmer-zone-meta" class="text-xs font-bold text-[#15803D]">28 States &amp; 8 UTs Mandi Directory + Expert Support</span>
                <span class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#15803D] text-white text-xs font-extrabold shadow-sm group-hover:translate-x-0.5 transition-transform">
                  <span>Open Farmer Zone</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          </button>
        </div>
      </section>

      <!-- ==================== ACTIVE NOTICES & UPDATES ==================== -->
      <div data-home-slot="notices-wrap" class="${activeNotices.length > 0 ? "" : "hidden"}">
        ${renderHomeNoticesMarkup(activeNotices)}
      </div>

      <!-- ==================== DIRECT WHATSAPP HELPLINE ==================== -->
      <section class="gv-card-tinted p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-start gap-3.5 min-w-0">
          <span class="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#15803D] to-[#22C55E] text-white flex items-center justify-center shadow-sm shrink-0">
            ${AGRI_ICONS.message}
          </span>
          <div>
            <h3 class="text-sm sm:text-base font-extrabold text-[#14532D]">Direct WhatsApp Helpline &amp; Official Community</h3>
            <p class="text-xs sm:text-sm text-[#475569] mt-0.5">Need quick help with crop problems, study materials, or account guidance? Message us directly on WhatsApp.</p>
          </div>
        </div>
        <div data-home-slot="wa-actions" class="flex flex-wrap gap-2.5 shrink-0">
          ${renderHomeWhatsAppMarkup(waDirect, waGroup, settings.whatsappNumber)}
        </div>
      </section>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// SHARED ZONE LIST ROW & COMMON MODULES HELPER (ZERO DUPLICATE MODULES)
// ----------------------------------------------------------------------------
function renderZoneListRow(item) {
  const extraAttrs = Object.entries(item.attrs || {})
    .map(([k, v]) => ` ${k}="${escapeHtml(String(v))}"`)
    .join("");
  return `
    <button data-nav="${escapeHtml(item.route)}"${extraAttrs} type="button" class="w-full group text-left rounded-2xl bg-white hover:bg-[#ECFDF5]/60 border border-[#D9EAE0] hover:border-[#15803D] p-4 sm:p-4.5 shadow-[0_2px_10px_-6px_rgba(20,83,45,0.12)] transition-colors flex items-center justify-between gap-3.5 min-h-[72px]">
      <div class="flex items-center gap-3.5 min-w-0">
        <span class="w-11 h-11 rounded-2xl ${item.featured ? "bg-gradient-to-br from-[#14532D] to-[#15803D] text-white shadow-sm" : "gv-icon-box"} flex items-center justify-center shrink-0">
          ${item.icon}
        </span>
        <div class="min-w-0 space-y-0.5">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm sm:text-base font-extrabold text-[#0F172A] group-hover:text-[#14532D] transition-colors">${escapeHtml(item.title)}</span>
            ${item.badge ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${item.badgeClass || "bg-[#DCFCE7] text-[#14532D]"}">${escapeHtml(item.badge)}</span>` : ""}
          </div>
          <p class="text-xs sm:text-[13px] text-[#475569] leading-relaxed">${escapeHtml(item.subtitle)}</p>
        </div>
      </div>
      <span class="w-8 h-8 rounded-xl bg-[#F8FAFC] group-hover:bg-[#DCFCE7] border border-[#E2E8F0] group-hover:border-[#BBF7D0] text-[#475569] group-hover:text-[#14532D] flex items-center justify-center shrink-0 transition-colors">
        ${AGRI_ICONS.chevron}
      </span>
    </button>
  `;
}

function renderSharedCommonModulesSection(state, zoneKey) {
  const upcomingMeetings = state.meetings.filter((m) => m.published !== false && isUpcomingMeeting(m)).length;
  const activePosts = state.communityPosts.filter((p) => p.status === "ACTIVE").length;
  const isFarmerZone = zoneKey === "farmer-zone";

  const commonItems = [
    {
      route: "meeting",
      title: "Meeting (Meeting Zone)",
      subtitle: upcomingMeetings > 0
        ? `${upcomingMeetings} upcoming Google Meet live sessions & workshops`
        : "Join live Google Meet classes, agricultural webinars & recorded sessions",
      icon: AGRI_ICONS.meeting,
      badge: upcomingMeetings > 0 ? `${upcomingMeetings} Upcoming` : "Live Meet",
      attrs: { "data-from-zone": zoneKey }
    },
    {
      route: "money",
      title: "Money Management (₹)",
      subtitle: isFarmerZone
        ? "100% private Farmer & Student income, expense & budget ledger synced to your Google account"
        : "100% private Student & Farmer income, expense, hostel & budget ledger synced to your Google account",
      icon: AGRI_ICONS.money,
      badge: "Private Vault",
      attrs: { "data-from-zone": zoneKey, "data-open-money-scope": isFarmerZone ? "FARMER" : "STUDENT" }
    },
    {
      route: "community",
      title: "Community",
      subtitle: activePosts > 0
        ? `Junior Student • Senior Student • International • Farmer Community (${activePosts} active discussions)`
        : "Junior Student Community • Senior Student Community • International Community • Farmer Talk",
      icon: AGRI_ICONS.community,
      badge: "4 Circles",
      attrs: { "data-from-zone": zoneKey, "data-open-comm-sub": "forum" }
    },
    {
      route: "ai",
      title: "AI Guru Knowledge Base",
      subtitle: "Instant search across verified B.Sc Agriculture notes, ICAR crop disease guides & free references",
      icon: AGRI_ICONS.ai,
      badge: "Source Cited",
      attrs: { "data-from-zone": zoneKey }
    },
    {
      route: "marketplace",
      title: "Green Heaven Store",
      subtitle: "Official Agricultural Marketplace — Indoor, Flowering, Outdoor plants, Gladiolus bulbs & Vermi Compost",
      icon: AGRI_ICONS.marketplace,
      badge: "Official Store",
      featured: true,
      attrs: { "data-from-zone": zoneKey }
    }
  ];

  return `
    <section class="space-y-3">
      <div class="flex flex-wrap items-end justify-between gap-2 px-1">
        <div>
          <h3 class="text-base sm:text-lg font-extrabold text-[#14532D] tracking-tight">Shared Platform Modules</h3>
          <p class="text-xs text-[#475569]">Unified services shared seamlessly across Student Zone and Farmer Zone with the same live Firebase data.</p>
        </div>
        <span class="px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#D9EAE0] text-[11px] font-bold text-[#15803D]">5 Shared Services</span>
      </div>
      <div class="space-y-2.5">
        ${commonItems.map(renderZoneListRow).join("")}
      </div>
    </section>
  `;
}

// ----------------------------------------------------------------------------
// 1B. DEDICATED STUDENT ZONE DASHBOARD (route: "student-zone")
// ----------------------------------------------------------------------------
export function renderStudentZoneView(state) {
  const publicMaterials = mergeStudyMaterials(state.studyMaterials || [], false);
  const notesCount = publicMaterials.filter((m) => m.category === "NOTES_PDF").length;
  const pyqCount = publicMaterials.filter((m) => m.category === "PYQ").length;
  const practicalCount = publicMaterials.filter((m) => m.category === "PRACTICAL" || m.category === "VIDEO_LECTURE").length;
  const quizCount = mergeQuizQuestions(state.quizzes || [], false).length;
  const syllabusCount = mergeSyllabi(state.universitySyllabi || [], false).length;
  const careerCount = state.careerOpportunities.filter((c) => c.published !== false).length;
  const unreadDoubts = state.totalUnreadDoubts || 0;
  const isProf = state.facultyIdentity?.isAuthorizedProfessor;

  const studentItems = [
    {
      route: "student",
      title: "Student Academic Dashboard",
      subtitle: `Complete B.Sc (Hons.) Agriculture portal — all ${publicMaterials.length} published notes, syllabus, practicals & MCQs (Semesters 1–8)`,
      icon: AGRI_ICONS.student,
      badge: `${publicMaterials.length} Resources`,
      featured: true,
      attrs: { "data-from-zone": "student-zone", "data-open-student-sub": "materials", "data-open-student-cat": "ALL" }
    },
    {
      route: "student",
      title: "Agriculture Study Notes",
      subtitle: `Semester-wise B.Sc Agriculture notes, PDFs, formulas & verified chapter summaries (${notesCount} notes)`,
      icon: AGRI_ICONS.notes,
      badge: "Notes & PDFs",
      attrs: { "data-from-zone": "student-zone", "data-open-student-sub": "materials", "data-open-student-cat": "NOTES_PDF" }
    },
    {
      route: "student",
      title: "Agriculture MCQ and Question Bank",
      subtitle: `Interactive online B.Sc Agriculture MCQ practice with instant scoring, explanations & attempt history (${quizCount} questions)`,
      icon: AGRI_ICONS.quiz,
      badge: `${quizCount} MCQs`,
      attrs: { "data-from-zone": "student-zone", "data-open-student-sub": "quiz" }
    },
    {
      route: "student",
      title: "Agriculture Syllabus",
      subtitle: `ICAR 5th Deans' Committee (Sem 1–8) + University-wise official B.Sc. Agriculture syllabi (${syllabusCount} curriculum entries)`,
      icon: AGRI_ICONS.syllabus,
      badge: `${syllabusCount} Syllabi`,
      attrs: { "data-from-zone": "student-zone", "data-open-student-sub": "syllabus" }
    },
    {
      route: "student",
      title: "Previous Year Questions",
      subtitle: `Solved university PYQ papers and exam question banks across agriculture subjects (${pyqCount} papers)`,
      icon: AGRI_ICONS.pyq,
      badge: "PYQ Bank",
      attrs: { "data-from-zone": "student-zone", "data-open-student-sub": "materials", "data-open-student-cat": "PYQ" }
    },
    {
      route: "student",
      title: "Study Resources (Practicals & Lectures)",
      subtitle: `Laboratory practical manuals, field identification guides & video lecture links (${practicalCount} resources)`,
      icon: AGRI_ICONS.resources,
      badge: "Practicals",
      attrs: { "data-from-zone": "student-zone", "data-open-student-sub": "materials", "data-open-student-cat": "PRACTICAL" }
    },
    {
      route: "career-guidance",
      title: "Student Career Guidance & Faculty Advisors",
      subtitle: "1-on-1 mentorship for M.Sc, ICAR JRF/SRF, IBPS AFO, NABARD & academic doubts with 9 verified faculty advisors",
      icon: AGRI_ICONS.career,
      badge: unreadDoubts > 0 ? `${unreadDoubts} New` : "9 Advisors",
      badgeClass: unreadDoubts > 0 ? "bg-rose-600 text-white" : "bg-[#DCFCE7] text-[#14532D]",
      attrs: { "data-from-zone": "student-zone" }
    },
    {
      route: "community",
      title: "Agri Jobs, Internships & Scholarships",
      subtitle: `Track Government Agriculture Jobs, ICAR scholarships, RAWE internships & competitive exams (${careerCount} active listings)`,
      icon: AGRI_ICONS.briefcase,
      badge: `${careerCount} Active`,
      attrs: { "data-from-zone": "student-zone", "data-open-comm-sub": "careers" }
    },
    {
      route: "tools",
      title: "Student Agri Learning Calculators",
      subtitle: "Practice ICAR NPK fertilizer dosing (DAP/SSP/Urea/MOP), seed rate & plant population calculations",
      icon: AGRI_ICONS.tools,
      badge: "ICAR Tools",
      attrs: { "data-from-zone": "student-zone" }
    }
  ];

  if (isProf) {
    studentItems.unshift({
      route: "professor",
      title: "Professor Dashboard (Faculty Desk)",
      subtitle: `Respond to assigned student & farmer consultations (${state.professorDoubtThreads.length} threads) and host meetings`,
      icon: AGRI_ICONS.professor,
      badge: "Verified Faculty",
      featured: true,
      attrs: { "data-from-zone": "student-zone" }
    });
  }

  return `
    <div data-zone-dashboard="student-zone" class="space-y-6">
      <!-- Top Back Navigation -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <button data-nav="home" type="button" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#ECFDF5] border border-[#D9EAE0] text-[#14532D] text-xs sm:text-sm font-extrabold shadow-sm transition-colors">
          ${AGRI_ICONS.back}
          <span>Back to Home</span>
        </button>
        <button data-nav="farmer-zone" type="button" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ECFDF5] hover:bg-[#DCFCE7] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold transition-colors">
          <span>Switch to Farmer Zone</span>
          <span>→</span>
        </button>
      </div>

      <!-- Student Zone Header Card -->
      <section class="relative overflow-hidden rounded-3xl gv-hero-agritech text-white p-5 sm:p-7">
        <div class="absolute inset-0 gv-hero-grid pointer-events-none"></div>
        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center shrink-0">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div class="space-y-1">
              <span class="inline-block px-2.5 py-0.5 rounded-full bg-[#22C55E]/25 border border-[#22C55E]/40 text-[#DCFCE7] text-[10px] font-extrabold uppercase tracking-wider">Agricultural Education Hub</span>
              <h2 class="font-display text-2xl sm:text-3xl font-bold leading-tight">Student Zone | শিক্ষার্থী জোন</h2>
              <p class="text-xs sm:text-sm text-[#DCFCE7]/90">Everything an Agriculture Student Needs in One Place.</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 shrink-0">
            <span class="px-3 py-1.5 rounded-xl bg-white/12 border border-white/20 text-xs font-bold text-[#DCFCE7]">${publicMaterials.length} Notes</span>
            <span class="px-3 py-1.5 rounded-xl bg-white/12 border border-white/20 text-xs font-bold text-[#DCFCE7]">${quizCount} MCQs</span>
            <span class="px-3 py-1.5 rounded-xl bg-white/12 border border-white/20 text-xs font-bold text-[#DCFCE7]">${state.professors.length} Advisors</span>
          </div>
        </div>
      </section>

      <!-- Student-Specific Modules Vertical List -->
      <section class="space-y-3">
        <div class="flex flex-wrap items-end justify-between gap-2 px-1">
          <div>
            <h3 class="text-base sm:text-lg font-extrabold text-[#14532D] tracking-tight">Student Academic &amp; Career Modules</h3>
            <p class="text-xs text-[#475569]">Notes, MCQs, ICAR Syllabus, PYQs, Practicals, Career Mentorship &amp; Agri Calculators</p>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#D9EAE0] text-[11px] font-bold text-[#15803D]">${studentItems.length} Modules</span>
        </div>
        <div class="space-y-2.5">
          ${studentItems.map(renderZoneListRow).join("")}
        </div>
      </section>

      <!-- 5 Shared Common Features -->
      ${renderSharedCommonModulesSection(state, "student-zone")}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 1C. DEDICATED FARMER ZONE DASHBOARD (route: "farmer-zone")
// ----------------------------------------------------------------------------
export function renderFarmerZoneView(state) {
  const marketCount = (state.mandiApiRecords?.length || 0) + (state.firestoreMarketPrices?.filter((r) => r.published !== false).length || 0);

  const farmerItems = [
    {
      route: "market",
      title: "Mandi Price – ফসলের বাজারদর",
      subtitle: marketCount > 0
        ? `${marketCount} live & verified mandi rates loaded • All 28 Indian States & 8 UTs APMC Directory`
        : "Live official AGMARKNET crop rates & cascading State → District → APMC Mandi directory across India",
      icon: AGRI_ICONS.market,
      badge: "28 States + 8 UTs",
      featured: true,
      attrs: { "data-from-zone": "farmer-zone" }
    },
    {
      route: "weather",
      title: "Weather Report & Forecasting (আবহাওয়া পূর্বাভাস)",
      subtitle: "Real-time hourly & 7-day village/PIN-code weather forecasts with rain, spray & irrigation alerts",
      icon: AGRI_ICONS.weather,
      badge: "Live Forecast",
      attrs: { "data-from-zone": "farmer-zone" }
    },
    {
      route: "farmer",
      title: "Crop Information, Disease & Pest Management",
      subtitle: "ICAR crop production guides (Paddy, Wheat, Potato, Mustard, Tomato, Jute), disease/pest IPM & crop photo query desk",
      icon: AGRI_ICONS.farmer,
      badge: "ICAR IPM Guide",
      attrs: { "data-from-zone": "farmer-zone" }
    },
    {
      route: "farmer-advisor",
      title: "Agriculture Advisory (Farmer Advisor Expert)",
      subtitle: "কৃষক পরামর্শ বিশেষজ্ঞ • Private 1-on-1 crop consultation with 9 verified agricultural experts & photo upload",
      icon: AGRI_ICONS.advisor,
      badge: `${state.professors.length} Experts`,
      attrs: { "data-from-zone": "farmer-zone" }
    },
    {
      route: "tools",
      title: "Farming Resources & Precision Calculators",
      subtitle: "Calculate exact DAP/SSP/Urea/MOP fertilizer doses, seed rates & plant population for Hectare, Acre & Bigha",
      icon: AGRI_ICONS.tools,
      badge: "NPK & Seed",
      attrs: { "data-from-zone": "farmer-zone" }
    },
    {
      route: "farmer-finance",
      title: "Agriculture Government Schemes & Farmer Benefits (কৃষি সরকারি প্রকল্প ও কৃষক সহায়তা কেন্দ্র)",
      subtitle: `Bilingual (বাংলা & English) verified Central, West Bengal, State & District schemes across all ${SCHEME_CATEGORIES.length} categories — eligibility, document checklists & official portals`,
      icon: AGRI_ICONS.scheme,
      badge: `${mergeAgricultureSchemes(state.agricultureSchemes || [], false).length} Schemes • ${SCHEME_CATEGORIES.length} Categories`,
      featured: true,
      attrs: { "data-from-zone": "farmer-zone", "data-open-ff-sub": "schemes" }
    },
    {
      route: "women-farmer",
      title: "Women Farmer Zone | নারী কৃষক সহায়তা কেন্দ্র",
      subtitle: "Women farmer schemes, training, SHG & women-led FPOs, horticulture, dairy, fisheries, rights, helplines & bilingual discussion board",
      icon: AGRI_ICONS.community,
      badge: "15 Areas • Discussion Board",
      featured: true,
      attrs: { "data-from-zone": "farmer-zone" }
    },
    {
      route: "farmer-finance",
      title: "Farmer Helplines & Application Help (কৃষক হেল্পলাইন ও সহায়তা)",
      subtitle: "Toll-free Kisan Call Centre (1800-180-1551 in Bengali), Crop Insurance 14447, Block ADA / Duare Sarkar guidance & free legal aid",
      icon: AGRI_ICONS.rights,
      badge: "Toll-Free Help",
      attrs: { "data-from-zone": "farmer-zone", "data-open-ff-sub": "helplines" }
    }
  ];

  return `
    <div data-zone-dashboard="farmer-zone" class="space-y-6">
      <!-- Top Back Navigation -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <button data-nav="home" type="button" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-[#ECFDF5] border border-[#D9EAE0] text-[#14532D] text-xs sm:text-sm font-extrabold shadow-sm transition-colors">
          ${AGRI_ICONS.back}
          <span>Back to Home</span>
        </button>
        <button data-nav="student-zone" type="button" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ECFDF5] hover:bg-[#DCFCE7] border border-[#BBF7D0] text-[#14532D] text-xs font-extrabold transition-colors">
          <span>Switch to Student Zone</span>
          <span>→</span>
        </button>
      </div>

      <!-- Farmer Zone Header Card -->
      <section class="relative overflow-hidden rounded-3xl gv-hero-agritech text-white p-5 sm:p-7">
        <div class="absolute inset-0 gv-hero-grid pointer-events-none"></div>
        <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center shrink-0">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 22V8m0 0C12 4 9 2 6 2c0 3 2 6 6 6Zm0 0c0-4 3-6 6-6 0 3-2 6-6 6ZM7 14c-2 0-4 1.5-4 4 3 0 5-1 5-4Zm10 0c2 0 4 1.5 4 4-3 0-5-1-5-4Z"/>
              </svg>
            </div>
            <div class="space-y-1">
              <span class="inline-block px-2.5 py-0.5 rounded-full bg-[#22C55E]/25 border border-[#22C55E]/40 text-[#DCFCE7] text-[10px] font-extrabold uppercase tracking-wider">Smart Farming &amp; Kisan Support</span>
              <h2 class="font-display text-2xl sm:text-3xl font-bold leading-tight">Farmer Zone | কৃষক জোন</h2>
              <p class="text-xs sm:text-sm text-[#DCFCE7]/90">Smart Agriculture, Farming Resources and Farmer Support.</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 shrink-0">
            <span class="px-3 py-1.5 rounded-xl bg-white/12 border border-white/20 text-xs font-bold text-[#DCFCE7]">Live Mandi Rates</span>
            <span class="px-3 py-1.5 rounded-xl bg-white/12 border border-white/20 text-xs font-bold text-[#DCFCE7]">7-Day Weather</span>
            <span class="px-3 py-1.5 rounded-xl bg-white/12 border border-white/20 text-xs font-bold text-[#DCFCE7]">Govt Schemes</span>
          </div>
        </div>
      </section>

      <!-- Farmer-Specific Modules Vertical List -->
      <section class="space-y-3">
        <div class="flex flex-wrap items-end justify-between gap-2 px-1">
          <div>
            <h3 class="text-base sm:text-lg font-extrabold text-[#14532D] tracking-tight">Smart Farming, Advisory &amp; Government Support</h3>
            <p class="text-xs text-[#475569]">Mandi Prices, Weather Alerts, Crop Disease IPM, Expert Advisory, Govt Schemes &amp; Toll-Free Farmer Helplines</p>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#D9EAE0] text-[11px] font-bold text-[#15803D]">${farmerItems.length} Services</span>
        </div>
        <div class="space-y-2.5">
          ${farmerItems.map(renderZoneListRow).join("")}
        </div>
      </section>

      <!-- 5 Shared Common Features -->
      ${renderSharedCommonModulesSection(state, "farmer-zone")}
    </div>
  `;
}

function renderHomeNoticesMarkup(activeNotices) {
  if (!activeNotices.length) return "";
  return `
    <section class="gv-card p-5 space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-sm font-extrabold uppercase tracking-wider text-[#14532D] flex items-center gap-2">
          <span class="w-8 h-8 rounded-xl gv-icon-box inline-flex items-center justify-center">${AGRI_ICONS.bell}</span>
          <span>Latest Notices &amp; Updates</span>
        </h3>
        <span class="px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#D9EAE0] text-xs font-bold text-[#15803D]">${activeNotices.length} active</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        ${activeNotices.slice(0, 3).map((n) => `
          <div class="rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#BBF7D0] p-4 transition-colors space-y-1.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#DCFCE7] text-[#14532D]">${escapeHtml(n.audience || "ALL")}</span>
            </div>
            <div class="font-bold text-sm text-[#0F172A] leading-snug">${escapeHtml(n.title)}</div>
            <p class="text-xs text-[#475569] leading-relaxed">${escapeHtml(n.message)}</p>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderHomeWhatsAppMarkup(waDirect, waGroup, whatsappNumber) {
  return `
    ${waDirect ? `
      <a href="${escapeHtml(waDirect)}" target="_blank" rel="noopener noreferrer" class="gv-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-colors">
        <span>WhatsApp Help (${escapeHtml(whatsappNumber)})</span>
      </a>
    ` : ""}
    ${waGroup ? `
      <a href="${escapeHtml(waGroup)}" target="_blank" rel="noopener noreferrer" class="gv-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0F3D22] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-colors">
        <span>Join Official Group</span>
      </a>
    ` : ""}
  `;
}

// Surgical in-place Home Dashboard updater — preserves existing DOM nodes during live Firestore updates (ZERO flicker/blink)
export function patchHomeDashboardInPlace(root, state) {
  const dash = root?.querySelector?.("[data-home-dashboard='true']");
  if (!dash) return false;

  const setText = (slot, nextText) => {
    const el = dash.querySelector(`[data-home-slot='${slot}']`);
    if (el && el.textContent !== nextText) el.textContent = nextText;
  };

  const settings = state.appSettings;
  const publicMaterials = state.studyMaterials.filter((m) => m.published !== false);
  const activeNotices = state.announcements.filter((a) => a.active !== false);
  const upcomingMeetings = state.meetings.filter((m) => m.published !== false && isUpcomingMeeting(m));
  const isProf = state.facultyIdentity?.isAuthorizedProfessor;
  const unreadDoubts = state.totalUnreadDoubts || 0;

  // Maintenance banner
  const maintWrap = dash.querySelector("[data-home-slot='maintenance-banner']");
  if (maintWrap) {
    const hasBanner = Boolean(settings.maintenanceBanner);
    maintWrap.classList.toggle("hidden", !hasBanner);
    if (hasBanner) {
      const maintText = maintWrap.querySelector("[data-home-slot='maintenance-text']");
      if (maintText) {
        if (maintText.textContent !== settings.maintenanceBanner) maintText.textContent = settings.maintenanceBanner;
      } else {
        maintWrap.innerHTML = `
          <div class="rounded-2xl bg-amber-50 border border-amber-300 px-4 py-3 text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2.5 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <span data-home-slot="maintenance-text">${escapeHtml(settings.maintenanceBanner)}</span>
          </div>
        `;
      }
    }
  }

  // Cloud status & hero copy
  setText("cloud-status", state.cloudConnected ? "Live Smart Agri Cloud Connected" : "Smart Agriculture • Open Public Access");
  setText("hero-headline", String(settings.heroHeadline || ""));
  setText("about-text", String(settings.aboutText || ""));

  // Signed-in user identity bar text
  if (state.user) {
    const userDisplayName = state.userProfile?.displayName || state.user?.displayName || state.user?.email?.split("@")[0] || "Scholar";
    const userRoleLabel = isProf
      ? "Verified Professor"
      : (state.userProfile?.role === "FARMER" ? "Farmer" : (state.isAdmin ? "Admin" : "Student"));
    const userSubMeta = state.userProfile?.institutionOrVillage || state.userProfile?.district || state.user?.email || "";
    setText("user-name", `Welcome, ${userDisplayName}`);
    setText("user-role", userRoleLabel);
    const subEl = dash.querySelector("[data-home-slot='user-sub']");
    if (subEl) {
      if (subEl.textContent !== userSubMeta) subEl.textContent = userSubMeta;
      subEl.classList.toggle("hidden", !userSubMeta);
    }
  }

  // Hero stat counters & Zone card metadata
  setText("stat-materials", String(publicMaterials.length));
  setText("stat-professors", String(state.professors.length));
  setText("stat-notices", String(activeNotices.length));
  setText("stat-meetings", String(upcomingMeetings.length));
  setText("student-zone-meta", `${publicMaterials.length} Notes & Study Resources Ready`);

  const unreadBadge = dash.querySelector("[data-home-slot='student-unread-badge']");
  if (unreadBadge) {
    const nextBadge = unreadDoubts > 0 ? `${unreadDoubts} unread` : "";
    if (unreadBadge.textContent !== nextBadge) unreadBadge.textContent = nextBadge;
    unreadBadge.classList.toggle("hidden", !nextBadge);
  }

  // Notices block — replace ONLY if its content actually changed
  const noticesWrap = dash.querySelector("[data-home-slot='notices-wrap']");
  if (noticesWrap) {
    const nextNoticesHtml = renderHomeNoticesMarkup(activeNotices);
    const nextKey = activeNotices.slice(0, 3).map((n) => `${n.id}|${n.audience}|${n.title}|${n.message}`).join("||") + `#${activeNotices.length}`;
    if (noticesWrap.dataset.noticesKey !== nextKey) {
      noticesWrap.dataset.noticesKey = nextKey;
      noticesWrap.innerHTML = nextNoticesHtml;
    }
    noticesWrap.classList.toggle("hidden", activeNotices.length === 0);
  }

  // WhatsApp links — replace ONLY if settings actually changed
  const waWrap = dash.querySelector("[data-home-slot='wa-actions']");
  if (waWrap) {
    const waKey = `${settings.whatsappNumber || ""}|${settings.whatsappGroupInviteUrl || ""}`;
    if (waWrap.dataset.waKey !== waKey) {
      waWrap.dataset.waKey = waKey;
      const waDirect = buildWhatsAppDirectUrl(settings.whatsappNumber, "Namaskar Guru Ji Vision Team, I need help regarding agriculture / B.Sc Agriculture.");
      const waGroup = safeUrl(settings.whatsappGroupInviteUrl);
      waWrap.innerHTML = renderHomeWhatsAppMarkup(waDirect, waGroup, settings.whatsappNumber);
    }
  }

  return true;
}

// ----------------------------------------------------------------------------
// 2. STUDENT SECTION (Upgraded Phase 7 Agriculture Education Hub)
// ----------------------------------------------------------------------------
export function renderStudentView(state) {
  return `
    <div class="space-y-4 animate-fade-up">
      ${renderAgriEducationView(state)}
      ${renderGreenHeavenCompactCard()}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 3. FARMER HELP SECTION & CROP KNOWLEDGE BASE
// ----------------------------------------------------------------------------
export function renderFarmerView(state) {
  const settings = state.appSettings;
  const waDirect = buildWhatsAppDirectUrl(settings.whatsappNumber, "Namaskar Guru Ji Vision, I am a farmer seeking crop guidance.");
  const waGroup = safeUrl(settings.whatsappGroupInviteUrl);

  return `
    <div class="space-y-5 animate-fade-up">
      <!-- Top Farmer Support Banner with Configurable WhatsApp & Quick Links -->
      <div class="rounded-3xl bg-gradient-to-br from-[#14532D] to-[#1E7E45] text-white p-5 sm:p-6 shadow-md space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1.5">
            <h2 class="font-display text-2xl font-bold">Farmer Help Desk &amp; Crop Advisory (কৃষক সহায়তা)</h2>
            <p class="text-xs sm:text-sm text-emerald-100 max-w-2xl">
              Access live weather alerts, crop market prices (বাজারদর), expert consultation, ICAR crop guides, private farm accounts, and direct WhatsApp help.
            </p>
          </div>
          <div class="flex flex-wrap gap-2.5 shrink-0">
            ${waDirect ? `
              <a href="${escapeHtml(waDirect)}" target="_blank" rel="noopener noreferrer" class="gv-btn inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#25D366] hover:bg-[#1FB857] text-[#052E16] text-xs sm:text-sm font-extrabold shadow-sm">
                <span>💬 Direct WhatsApp (${escapeHtml(settings.whatsappNumber)})</span>
              </a>
            ` : ""}
            ${waGroup ? `
              <a href="${escapeHtml(waGroup)}" target="_blank" rel="noopener noreferrer" class="gv-btn inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#0C3B20] text-xs sm:text-sm font-extrabold shadow-sm">
                <span>Official WhatsApp Group</span>
              </a>
            ` : ""}
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-white/15">
          <button data-nav="weather" class="px-3 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold text-left">⛅ আবহাওয়া / Weather</button>
          <button data-nav="market" class="px-3 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold text-left">📊 বাজারদর / Mandi Price</button>
          <button data-nav="marketplace" class="px-3 py-2.5 rounded-xl bg-amber-400/95 hover:bg-amber-300 text-[#0C3B20] text-xs font-extrabold text-left">🌿 Green Heaven Store</button>
          <button data-nav="farmer-advisor" class="px-3 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold text-left">👨‍🌾 বিশেষজ্ঞ পরামর্শ</button>
          <button data-nav="money" class="px-3 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold text-left">🔒 কৃষি আয়-ব্যয় হিসাব</button>
        </div>
      </div>

      ${renderGreenHeavenCompactCard()}

      <!-- Crop Production, Disease & IPM Knowledge Base (All 6 Original Crops) -->
      <div class="space-y-3">
        <h3 class="text-base font-extrabold text-[#14532D] px-1">Crop Production, Disease &amp; Pest Management Guide</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${CROP_PRESETS.map((crop) => `
            <article class="gv-card p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div class="space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h4 class="text-base font-extrabold text-[#14532D]">${escapeHtml(crop.nameEn)}</h4>
                    <p class="text-xs font-semibold text-[#1E7E45]">${escapeHtml(crop.nameBn)}</p>
                  </div>
                  <span class="px-2 py-1 rounded-lg bg-amber-100 text-amber-900 text-[10px] font-bold shrink-0">NPK ${crop.npkPerHa.n}:${crop.npkPerHa.p}:${crop.npkPerHa.k}</span>
                </div>
                <div class="text-xs text-[#496052] space-y-1">
                  <p><strong>Season:</strong> ${escapeHtml(crop.season)}</p>
                  <p><strong>Soil pH:</strong> ${escapeHtml(crop.soilPh)}</p>
                  <p><strong>Seed Rate:</strong> ${escapeHtml(crop.seedRateKgPerHa)}</p>
                  <p><strong>Diseases:</strong> ${escapeHtml(crop.majorDiseases.join(", "))}</p>
                  <p><strong>Pests:</strong> ${escapeHtml(crop.majorPests.join(", "))}</p>
                </div>
                <div class="rounded-xl bg-[#F1F7F2] border border-[#CDE0D3] p-2.5 text-xs text-[#132219] leading-relaxed">
                  <strong>IPM Guidance:</strong> ${escapeHtml(crop.ipmGuidance)}
                </div>
              </div>
              <button data-load-crop-tool="${escapeHtml(crop.id)}" class="w-full py-2.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-extrabold transition-colors">
                Open in Fertilizer &amp; Seed Calculator →
              </button>
            </article>
          `).join("")}
        </div>
      </div>

      <!-- Submit / Edit Private Farmer Crop Query -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div class="lg:col-span-5 gv-card p-5 space-y-3.5">
          <div class="flex items-center justify-between gap-2">
            <h3 id="fqFormHeading" class="text-base font-extrabold text-[#14532D]">Submit Crop Issue Query</h3>
            <button id="fqCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
          </div>
          ${!state.user ? `
            <p class="text-xs sm:text-sm text-[#496052]">Sign in with your Google Account to submit private crop queries, upload crop photos, and receive replies from Guru Ji Vision experts.</p>
            <button data-action="open-auth" class="w-full py-3 rounded-xl bg-[#14532D] text-white text-sm font-extrabold">Continue with Google to Submit Query</button>
          ` : `
            <form id="farmerQueryForm" class="space-y-3">
              <input id="fqEditId" type="hidden" value="" />
              <label class="block">
                <span class="text-xs font-bold text-[#132219]">Crop Name / ফসলের নাম *</span>
                <input id="fqCrop" type="text" required maxlength="80" placeholder="e.g. Paddy (Swarna), Potato / আলু" class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
              </label>
              <div class="grid grid-cols-2 gap-2.5">
                <label class="block">
                  <span class="text-xs font-bold text-[#132219]">Issue Category</span>
                  <select id="fqCategory" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm">
                    <option value="DISEASE">Disease / রোগ</option>
                    <option value="PEST">Insect / পোকামাকড়</option>
                    <option value="FERTILIZER">Fertilizer / সার</option>
                    <option value="SOIL">Soil Health / মাটি</option>
                    <option value="WEATHER">Weather / আবহাওয়া</option>
                    <option value="OTHER">Other / অন্যান্য</option>
                  </select>
                </label>
                <label class="block">
                  <span class="text-xs font-bold text-[#132219]">District / জেলা</span>
                  <input id="fqDistrict" type="text" maxlength="80" value="${escapeHtml(state.userProfile?.district || "")}" placeholder="e.g. Purba Bardhaman" class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
                </label>
              </div>
              <label class="block">
                <span class="text-xs font-bold text-[#132219]">Describe Crop Symptoms / সমস্যার বিবরণ *</span>
                <textarea id="fqDesc" rows="3" required minlength="5" maxlength="1000" placeholder="Describe leaf spots, yellowing, insect damage, crop age..." class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm"></textarea>
              </label>
              <div class="space-y-2">
                <label class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-extrabold cursor-pointer">
                  <span>📷 Upload Crop Photo (Optional)</span>
                  <input id="fqImageFile" type="file" accept="image/*" class="hidden" />
                </label>
                ${state.pendingFarmerQueryImageBase64 ? `
                  <div class="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2">
                    <div class="flex items-center gap-2">
                      <img src="data:image/jpeg;base64,${escapeHtml(state.pendingFarmerQueryImageBase64)}" alt="Crop preview" class="w-12 h-12 rounded-lg object-cover border" />
                      <span class="text-xs font-bold text-[#14532D]">Crop photo ready</span>
                    </div>
                    <button type="button" data-action="clear-fq-image" class="text-xs font-bold text-rose-600 px-2">Remove</button>
                  </div>
                ` : ""}
              </div>
              <button type="submit" class="w-full py-3 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">Save Farmer Query</button>
            </form>
          `}
        </div>

        <div class="lg:col-span-7 gv-card p-5 space-y-3">
          <h3 class="text-base font-extrabold text-[#14532D]">Your Submitted Queries (${state.farmerQueries.length})</h3>
          ${state.farmerQueries.length === 0 ? `
            <p class="text-sm text-[#496052]">No submitted queries yet. You can also ask our experts directly in <strong>Farmer Advisor Expert</strong>.</p>
          ` : `
            <div class="space-y-3 max-h-[500px] overflow-y-auto">
              ${state.farmerQueries.map((fq) => {
                const canOwnerEdit = state.user && fq.userId === state.user.uid && fq.status === "OPEN";
                return `
                  <div class="rounded-2xl border border-[#CDE0D3] bg-[#F7F9F5] p-3.5 space-y-2">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <span class="font-extrabold text-sm text-[#14532D]">${escapeHtml(fq.cropName)} (${escapeHtml(fq.category)})${fq.district ? ` • ${escapeHtml(fq.district)}` : ""}</span>
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        fq.status === "RESOLVED" ? "bg-emerald-100 text-emerald-900" : fq.status === "IN_REVIEW" ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-800"
                      }">${escapeHtml(fq.status)}</span>
                    </div>
                    ${fq.hasImage && fq.imageBase64 ? `
                      <img src="data:image/jpeg;base64,${escapeHtml(fq.imageBase64)}" alt="Submitted crop photo" class="rounded-xl max-h-44 w-auto object-contain border border-[#CDE0D3]" />
                    ` : ""}
                    <p class="text-xs sm:text-sm text-[#132219] whitespace-pre-line">${escapeHtml(fq.description)}</p>
                    ${fq.adminReply ? `
                      <div class="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-950">
                        <strong>Expert Reply:</strong> ${escapeHtml(fq.adminReply)}
                      </div>
                    ` : ""}
                    ${canOwnerEdit ? `
                      <div class="flex gap-2 pt-1">
                        <button type="button" data-edit-fq="${escapeHtml(fq.id)}" class="px-3 py-1.5 rounded-lg bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-bold">Edit</button>
                        <button type="button" data-del-fq="${escapeHtml(fq.id)}" class="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold">Delete</button>
                      </div>
                    ` : ""}
                  </div>
                `;
              }).join("")}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 4. AGRICULTURE TOOLS (Real ICAR NPK + SSP + Seed Rate + Plant Population)
// ----------------------------------------------------------------------------
export function renderToolsView(state) {
  const f = state.fertInput;
  const fRes = calculateFertilizer(f);
  const s = state.seedInput;
  const sRes = calculateSeedRate(s);

  return `
    <div class="space-y-5 animate-fade-up">
      <div class="gv-card p-4 sm:p-5 space-y-3">
        <div>
          <h2 class="font-display text-xl sm:text-2xl font-bold text-[#14532D]">ICAR Agriculture Calculators</h2>
          <p class="text-xs sm:text-sm text-[#496052]">Real agronomic calculations for Hectare, Acre, and West Bengal Bigha. Tap a crop preset to auto-fill standard doses:</p>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${CROP_PRESETS.map((c) => `
            <button data-apply-crop-preset="${escapeHtml(c.id)}" class="px-3 py-1.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-bold transition-colors">
              🌱 ${escapeHtml(c.nameEn.split(" (")[0])}
            </button>
          `).join("")}
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- NPK Fertilizer Calculator (Route 1: DAP + Urea + MOP, Route 2: SSP + Urea + MOP) -->
        <div class="gv-card p-5 space-y-4">
          <h3 class="text-base font-extrabold text-[#14532D]">1. NPK Fertilizer Calculator (ICAR Standard)</h3>
          <div class="grid grid-cols-2 gap-2.5">
            <label class="block">
              <span class="text-xs font-bold text-[#132219]">Field Area</span>
              <input id="toolFertArea" type="number" min="0.05" step="0.1" value="${f.areaValue}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" />
            </label>
            <label class="block">
              <span class="text-xs font-bold text-[#132219]">Area Unit</span>
              <select id="toolFertUnit" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm font-semibold">
                ${Object.values(AREA_UNITS).map((u) => `<option value="${u.id}" ${f.unitKey === u.id ? "selected" : ""}>${escapeHtml(u.labelEn)}</option>`).join("")}
              </select>
            </label>
          </div>
          <div class="grid grid-cols-3 gap-2.5">
            <label class="block"><span class="text-xs font-bold">N (kg/ha)</span><input id="toolFertN" type="number" min="0" value="${f.nPerHa}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" /></label>
            <label class="block"><span class="text-xs font-bold">P₂O₅ (kg/ha)</span><input id="toolFertP" type="number" min="0" value="${f.pPerHa}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" /></label>
            <label class="block"><span class="text-xs font-bold">K₂O (kg/ha)</span><input id="toolFertK" type="number" min="0" value="${f.kPerHa}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" /></label>
          </div>

          <div class="rounded-2xl bg-[#EDF4EE] p-3.5 space-y-2">
            <div class="text-xs font-extrabold text-[#14532D]">Option A: DAP (18-46-0) + Urea (46% N) + MOP (60% K₂O)</div>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="bg-white rounded-xl p-2.5 border border-[#CDE0D3]">
                <div class="text-[10px] font-bold text-amber-800">DAP</div>
                <div class="text-base font-extrabold text-[#132219]">${fRes.dapKg.toFixed(1)} kg</div>
                <div class="text-[10px] text-[#496052]">${(fRes.dapKg / 50).toFixed(2)} bags</div>
              </div>
              <div class="bg-white rounded-xl p-2.5 border border-[#CDE0D3]">
                <div class="text-[10px] font-bold text-emerald-800">UREA</div>
                <div class="text-base font-extrabold text-[#132219]">${fRes.ureaKg.toFixed(1)} kg</div>
                <div class="text-[10px] text-[#496052]">${(fRes.ureaKg / 45).toFixed(2)} bags</div>
              </div>
              <div class="bg-white rounded-xl p-2.5 border border-[#CDE0D3]">
                <div class="text-[10px] font-bold text-sky-800">MOP</div>
                <div class="text-base font-extrabold text-[#132219]">${fRes.mopKg.toFixed(1)} kg</div>
                <div class="text-[10px] text-[#496052]">${(fRes.mopKg / 50).toFixed(2)} bags</div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl bg-[#FFFBEB] border border-amber-200 p-3.5 space-y-1.5 text-xs">
            <div class="font-extrabold text-amber-950">Option B (Sulphur-rich SSP Route): SSP (16% P₂O₅) + Urea + MOP</div>
            <p class="text-amber-900">
              SSP: <strong>${fRes.sspAlternativeKg.toFixed(1)} kg</strong> (${(fRes.sspAlternativeKg / 50).toFixed(2)} bags) •
              Urea: <strong>${fRes.ureaWithSspKg.toFixed(1)} kg</strong> •
              MOP: <strong>${fRes.mopKg.toFixed(1)} kg</strong>
            </p>
            <p class="text-[11px] text-amber-800">Computed for ${fRes.areaHa.toFixed(3)} ha | Nutrient Target: N ${fRes.targetN.toFixed(1)} kg, P₂O₅ ${fRes.targetP.toFixed(1)} kg, K₂O ${fRes.targetK.toFixed(1)} kg</p>
          </div>
        </div>

        <!-- Seed Rate & Plant Population Calculator -->
        <div class="gv-card p-5 space-y-4">
          <h3 class="text-base font-extrabold text-[#14532D]">2. Seed Rate &amp; Plant Population Calculator</h3>
          <div class="grid grid-cols-2 gap-2.5">
            <label class="block">
              <span class="text-xs font-bold">Area</span>
              <input id="toolSeedArea" type="number" min="0.05" step="0.1" value="${s.areaValue}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" />
            </label>
            <label class="block">
              <span class="text-xs font-bold">Unit</span>
              <select id="toolSeedUnit" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm font-semibold">
                ${Object.values(AREA_UNITS).map((u) => `<option value="${u.id}" ${s.unitKey === u.id ? "selected" : ""}>${escapeHtml(u.labelEn)}</option>`).join("")}
              </select>
            </label>
            <label class="block"><span class="text-xs font-bold">Row Spacing (cm)</span><input id="toolSeedRow" type="number" min="1" value="${s.rowSpacingCm}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" /></label>
            <label class="block"><span class="text-xs font-bold">Plant Spacing (cm)</span><input id="toolSeedPlant" type="number" min="1" value="${s.plantSpacingCm}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" /></label>
            <label class="block"><span class="text-xs font-bold">1000-Seed Test Wt (g)</span><input id="toolSeedTestWt" type="number" min="0.5" step="0.5" value="${s.testWeightGramsPer1000}" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" /></label>
            <div class="grid grid-cols-2 gap-2">
              <label class="block"><span class="text-xs font-bold">Germ %</span><input id="toolSeedGerm" type="number" min="1" max="100" value="${s.germinationPercent}" class="mt-1 w-full px-2.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" /></label>
              <label class="block"><span class="text-xs font-bold">Purity %</span><input id="toolSeedPurity" type="number" min="1" max="100" value="${s.purityPercent}" class="mt-1 w-full px-2.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm font-semibold" /></label>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2.5 pt-2">
            <div class="rounded-2xl bg-[#EDF4EE] border border-[#CDE0D3] p-3 text-center">
              <div class="text-[10px] font-bold text-[#14532D]">AREA (m²)</div>
              <div class="text-base sm:text-lg font-extrabold text-[#132219] mt-0.5">${Math.round(sRes.areaSqM).toLocaleString("en-IN")}</div>
            </div>
            <div class="rounded-2xl bg-[#EDF4EE] border border-[#CDE0D3] p-3 text-center">
              <div class="text-[10px] font-bold text-[#14532D]">PLANTS</div>
              <div class="text-base sm:text-lg font-extrabold text-[#132219] mt-0.5">${sRes.totalPlants.toLocaleString("en-IN")}</div>
            </div>
            <div class="rounded-2xl bg-[#FFFBEB] border border-amber-200 p-3 text-center">
              <div class="text-[10px] font-bold text-amber-800">SEED NEEDED</div>
              <div class="text-base sm:text-lg font-extrabold text-amber-950 mt-0.5">${sRes.seedRateKg.toFixed(2)} kg</div>
            </div>
          </div>
        </div>
      </div>

      ${renderGreenHeavenCompactCard()}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 4B. AGRICULTURAL MARKETPLACE – GREEN HEAVEN (Official Connected Storefront)
// ----------------------------------------------------------------------------
export function renderMarketplaceView() {
  const gh = GREEN_HEAVEN_CONFIG;

  return `
    <div class="space-y-5 animate-fade-up">
      <!-- Green Heaven Branded Hero -->
      <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0C3B20] via-[#14532D] to-[#1E7E45] text-white p-5 sm:p-7 shadow-lg">
        <div class="absolute -right-12 -bottom-12 w-56 h-56 rounded-full bg-emerald-300/15 blur-2xl pointer-events-none"></div>
        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div class="space-y-3 max-w-2xl">
            <div class="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/15 text-xs font-bold text-emerald-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M11 20a10 10 0 0 0 10-10 25.9 25.9 0 0 0-1.04-7.281 1 1 0 0 0-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0 0 11 20"></path>
                <path d="M2 21a5 5 0 0 1 2.911-4.544C7.613 15.212 8.351 15.24 11 13"></path>
              </svg>
              <span>GREEN HEAVEN • OFFICIAL CONNECTED MARKETPLACE</span>
            </div>
            <h2 class="font-display text-2xl sm:text-3xl font-bold leading-tight">${escapeHtml(gh.sectionTitle)}</h2>
            <p class="text-xs sm:text-sm text-emerald-100 font-semibold">${escapeHtml(gh.sectionTitleBn)} — ${escapeHtml(gh.tagline)}</p>
            <p class="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Open to all students, farmers, and visitors with zero Guru Ji Vision login required. Tapping any button below opens the official Green Heaven store directly so your cart, products, and checkout work smoothly on Android phones, tablets, and desktops.
            </p>
            <div class="flex flex-wrap gap-2.5 pt-1">
              <a href="${escapeHtml(gh.baseUrl)}" target="_blank" rel="noopener noreferrer" class="gv-btn inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#0C3B20] text-xs sm:text-sm font-extrabold shadow-md transition-colors">
                <span>🌿 Shop Now — Green Heaven ↗</span>
              </a>
              <a href="${escapeHtml(gh.shopUrl)}" target="_blank" rel="noopener noreferrer" class="gv-btn inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs sm:text-sm font-bold transition-colors">
                <span>Browse All Products ↗</span>
              </a>
              <a href="${escapeHtml(gh.careGuideUrl)}" target="_blank" rel="noopener noreferrer" class="gv-btn inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs sm:text-sm font-bold transition-colors">
                <span>💧 Plant Care Guide ↗</span>
              </a>
              <a href="${escapeHtml(gh.cartUrl)}" target="_blank" rel="noopener noreferrer" class="gv-btn inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs sm:text-sm font-bold transition-colors">
                <span>🛒 View Cart ↗</span>
              </a>
            </div>
          </div>

          <div class="rounded-2xl bg-white/10 border border-white/20 p-4 space-y-2 lg:w-72 shrink-0">
            <div class="text-xs font-extrabold uppercase tracking-wider text-amber-300">Official Store Address</div>
            <div class="text-xs sm:text-sm font-bold break-all text-white">green-heaven-a.netlify.app</div>
            <ul class="text-[11px] text-emerald-100 space-y-1 pt-1">
              <li>✓ Publicly accessible — no login needed</li>
              <li>✓ Independent cart, account &amp; checkout</li>
              <li>✓ Local delivery &amp; plant care support</li>
              <li>✓ Easy return to Guru Ji Vision anytime</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Verified Available Categories on Green Heaven -->
      <section class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2 px-1">
          <div>
            <h3 class="text-base sm:text-lg font-extrabold text-[#14532D]">Verified Categories Available on Green Heaven</h3>
            <p class="text-xs text-[#496052]">Direct links to active Green Heaven store sections. Live stock and prices always load directly on Green Heaven.</p>
          </div>
          <a href="${escapeHtml(gh.shopUrl)}" target="_blank" rel="noopener noreferrer" class="text-xs font-extrabold text-[#1E7E45] hover:underline">
            Open Full Catalog ↗
          </a>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${gh.verifiedCategories.map((cat) => `
            <a href="${escapeHtml(cat.url)}" target="_blank" rel="noopener noreferrer" class="group rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-3 transition-all hover:shadow-md ${cat.accent}">
              <div class="space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2.5">
                    <span class="text-2xl leading-none">${cat.icon}</span>
                    <div>
                      <h4 class="text-sm sm:text-base font-extrabold text-[#132219] group-hover:text-[#14532D]">${escapeHtml(cat.name)}</h4>
                      <div class="text-[11px] font-semibold text-[#1E7E45]">${escapeHtml(cat.nameBn)}</div>
                    </div>
                  </div>
                  <span class="text-xs font-extrabold text-[#14532D] opacity-75 group-hover:opacity-100">↗</span>
                </div>
                <p class="text-xs text-[#496052] leading-relaxed">${escapeHtml(cat.description)}</p>
              </div>
              <div class="inline-flex items-center justify-between pt-2 border-t border-black/5 text-xs font-extrabold text-[#14532D]">
                <span>Open on Green Heaven</span>
                <span>Shop Now →</span>
              </div>
            </a>
          `).join("")}
        </div>
      </section>

      <!-- Transparency & Quick Return to Guru Ji Vision -->
      <section class="gv-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1 max-w-2xl">
          <h3 class="text-sm sm:text-base font-extrabold text-[#14532D]">Seamless Experience Across Both Platforms</h3>
          <p class="text-xs sm:text-sm text-[#496052] leading-relaxed">
            Green Heaven opens in a dedicated browser tab so its shopping cart, login, and checkout remain 100% independent and secure on Android phones, tablets, and computers. Use your phone&apos;s Back button or browser tab bar to return to Guru Ji Vision at any time.
          </p>
        </div>
        <div class="flex flex-wrap gap-2 shrink-0">
          <button data-nav="home" type="button" class="px-3.5 py-2.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-extrabold">← Home Dashboard</button>
          <button data-nav="weather" type="button" class="px-3.5 py-2.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-extrabold">⛅ Weather</button>
          <button data-nav="farmer" type="button" class="px-3.5 py-2.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-extrabold">🌾 Farmer Help</button>
        </div>
      </section>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 5. AI GURU KNOWLEDGE BASE & FREE ENCYCLOPEDIA SEARCH
// ----------------------------------------------------------------------------
export function renderAiGuruView(state) {
  const history = state.aiHistory || [];
  return `
    <div class="space-y-4 animate-fade-up">
      <div class="gv-card p-5 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="font-display text-xl sm:text-2xl font-bold text-[#14532D]">AI Guru Knowledge Base</h2>
            <p class="text-xs sm:text-sm text-[#496052]">Searches verified Guru Ji Vision B.Sc Agriculture notes, ICAR crop disease guides, and free Wikipedia references with source links.</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-[#14532D]">100% Free • Source Cited</span>
        </div>

        <form id="aiGuruForm" class="flex flex-col sm:flex-row gap-2 pt-2">
          <input id="aiGuruInput" type="text" required placeholder="Ask about Rice Blast, Gypsum sodic soil, CRI stage wheat, Mendelian 9:7 ratio..." class="flex-1 px-4 py-3 rounded-2xl border border-[#CDE0D3] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E7E45]" />
          <button type="submit" ${state.aiBusy ? "disabled" : ""} class="px-5 py-3 rounded-2xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold shrink-0">
            ${state.aiBusy ? "Searching..." : "Search Knowledge Base"}
          </button>
        </form>

        <div class="flex flex-wrap gap-1.5 pt-1">
          ${["Reclamation of sodic soil", "Rice Blast symptoms", "Wheat CRI stage", "Mendelian ratios"].map((prompt) => `
            <button type="button" data-ai-prompt="${escapeHtml(prompt)}" class="px-3 py-1.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-bold">${escapeHtml(prompt)}</button>
          `).join("")}
        </div>
      </div>

      <div class="space-y-3">
        ${history.length === 0 ? `
          <div class="gv-card-tinted p-6 text-center text-sm text-[#496052]">
            Ask any B.Sc Agriculture or farming question above to retrieve verified notes from Guru Ji Vision Knowledge Base + Free Wikipedia references.
          </div>
        ` : history.map((entry) => `
          <div class="gv-card p-5 space-y-3">
            <div class="text-sm font-extrabold text-[#14532D]">Q: ${escapeHtml(entry.question)}</div>
            <div class="text-sm text-[#132219] whitespace-pre-line leading-relaxed">${escapeHtml(entry.answer)}</div>
            ${entry.sources?.length ? `
              <div class="pt-2 border-t border-emerald-100 space-y-1.5">
                <div class="text-[11px] font-bold uppercase tracking-wider text-[#496052]">Sources</div>
                <div class="flex flex-wrap gap-2">
                  ${entry.sources.map((src) => {
                    const href = safeUrl(src.url);
                    return href
                      ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-bold">${src.kind === "KNOWLEDGE_BASE" ? "📚" : "🌐"} ${escapeHtml(src.title)} ↗</a>`
                      : `<span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EDF4EE] text-[#14532D] text-xs font-bold">📚 ${escapeHtml(src.title)}</span>`;
                  }).join("")}
                </div>
              </div>
            ` : ""}
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// 6. CAREER OPPORTUNITIES & SHARED COMMUNITY (Junior / Senior / Intl / Farmer)
// ----------------------------------------------------------------------------
const COMMUNITY_CIRCLES = [
  { key: "ALL", label: "All Communities", groupValue: "" },
  { key: "JUNIOR", label: "Junior Student Community", groupValue: "Junior Student Community" },
  { key: "SENIOR", label: "Senior Student Community", groupValue: "Senior Student Community" },
  { key: "INTERNATIONAL", label: "International Community", groupValue: "International Community" },
  { key: "FARMER", label: "Farmer Community", groupValue: "Farmer Community" }
];

function matchesCommunityCircle(post, circleKey) {
  if (!circleKey || circleKey === "ALL") return true;
  const grp = String(post.collegeGroup || "").toLowerCase();
  if (circleKey === "JUNIOR") return grp.includes("junior");
  if (circleKey === "SENIOR") return grp.includes("senior");
  if (circleKey === "INTERNATIONAL") return grp.includes("international") || grp.includes("global");
  if (circleKey === "FARMER") return post.topic === "FARM_TALK" || grp.includes("farmer") || grp.includes("krishak") || grp.includes("kisan");
  return true;
}

export function renderCommunityView(state) {
  const sub = state.communitySubTab || "forum";
  const activeCircle = state.communityCircle || "ALL";
  const posts = state.communityPosts.filter((p) =>
    p.status === "ACTIVE" &&
    p.board !== "WOMEN_FARMER" &&
    (state.communityTopic === "ALL" || p.topic === state.communityTopic) &&
    matchesCommunityCircle(p, activeCircle)
  );
  const careers = state.careerOpportunities.filter((c) =>
    c.published !== false && (state.careerCategory === "ALL" || c.category === state.careerCategory)
  );
  const defaultGroupValue =
    COMMUNITY_CIRCLES.find((c) => c.key === activeCircle && c.groupValue)?.groupValue ||
    state.userProfile?.institutionOrVillage ||
    "Junior Student Community";

  return `
    <div class="space-y-4">
      <div class="gv-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="font-display text-xl sm:text-2xl font-bold text-[#14532D]">Community &amp; Agri Careers</h2>
          <p class="text-xs sm:text-sm text-[#496052]">Junior Student, Senior Student, International &amp; Farmer discussion circles plus AFO/ICAR jobs &amp; scholarships.</p>
        </div>
        <div class="flex gap-1.5 bg-[#EDF4EE] p-1 rounded-xl">
          <button data-comm-sub="forum" class="px-4 py-2 rounded-lg text-xs font-extrabold ${sub === "forum" ? "bg-[#14532D] text-white" : "text-[#14532D]"}">Discussion Forum (${posts.length})</button>
          <button data-comm-sub="careers" class="px-4 py-2 rounded-lg text-xs font-extrabold ${sub === "careers" ? "bg-[#14532D] text-white" : "text-[#14532D]"}">Jobs &amp; Internships (${careers.length})</button>
        </div>
      </div>

      ${sub === "forum" ? `
        <!-- Community Circles Bar (Shared across Student Zone & Farmer Zone) -->
        <div class="gv-card p-3.5 space-y-2">
          <div class="text-[11px] font-extrabold uppercase tracking-wider text-[#15803D] px-1">Community Circles</div>
          <div class="flex flex-wrap gap-1.5">
            ${COMMUNITY_CIRCLES.map((c) => `
              <button data-comm-circle="${c.key}" type="button" class="px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors ${
                activeCircle === c.key
                  ? "bg-gradient-to-r from-[#14532D] to-[#15803D] text-white shadow-sm"
                  : "bg-[#ECFDF5] hover:bg-[#DCFCE7] border border-[#D9EAE0] text-[#14532D]"
              }">${escapeHtml(c.label)}</button>
            `).join("")}
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div class="lg:col-span-4 gv-card p-5 space-y-3 h-fit">
            <div class="flex items-center justify-between gap-2">
              <h3 id="cpFormHeading" class="text-base font-extrabold text-[#14532D]">Start a Discussion / Ask Doubt</h3>
              <button id="cpCancelEdit" type="button" class="hidden text-xs font-bold text-rose-600">Cancel Edit</button>
            </div>
            ${!state.user ? `
              <p class="text-xs text-[#496052]">Sign in to publish posts, share college notes, or mark helpful answers.</p>
              <button data-action="open-auth" class="w-full py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-extrabold">Sign In to Post</button>
            ` : `
              <form id="communityPostForm" class="space-y-3">
                <input id="cpEditId" type="hidden" value="" />
                <label class="block">
                  <span class="text-xs font-bold">Topic</span>
                  <select id="cpTopic" class="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#CDE0D3] bg-white text-sm">
                    <option value="DOUBT" ${activeCircle !== "FARMER" ? "selected" : ""}>Ask a Doubt</option>
                    <option value="NOTES_SHARE">Notes &amp; Resource Share</option>
                    <option value="EXAM_PREP">Exam Prep</option>
                    <option value="FARM_TALK" ${activeCircle === "FARMER" ? "selected" : ""}>Farm Talk (Farmer Community)</option>
                  </select>
                </label>
                <label class="block">
                  <span class="text-xs font-bold">Community Circle / College Group *</span>
                  <input id="cpGroup" type="text" required maxlength="100" list="communityCircleSuggestions" value="${escapeHtml(defaultGroupValue)}" class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
                  <datalist id="communityCircleSuggestions">
                    <option value="Junior Student Community"></option>
                    <option value="Senior Student Community"></option>
                    <option value="International Community"></option>
                    <option value="Farmer Community"></option>
                  </datalist>
                </label>
                <label class="block">
                  <span class="text-xs font-bold">Title *</span>
                  <input id="cpTitle" type="text" required minlength="3" maxlength="140" placeholder="Short headline..." class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm" />
                </label>
                <label class="block">
                  <span class="text-xs font-bold">Message *</span>
                  <textarea id="cpBody" rows="3" required minlength="5" maxlength="1500" placeholder="Share your question or resource details (never share personal financial info here)..." class="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-[#CDE0D3] text-sm"></textarea>
                </label>
                <button type="submit" class="w-full py-3 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-sm font-extrabold">Publish Post</button>
              </form>
            `}
          </div>

          <div class="lg:col-span-8 space-y-3">
            <div class="flex flex-wrap gap-1.5">
              ${Object.entries(COMMUNITY_TOPICS).map(([k, v]) => `
                <button data-comm-topic="${k}" class="px-3 py-1.5 rounded-xl text-xs font-bold ${
                  state.communityTopic === k ? "bg-[#14532D] text-white" : "bg-white border border-[#CDE0D3] text-[#14532D]"
                }">${escapeHtml(v.en)}</button>
              `).join("")}
            </div>

            ${posts.length === 0 ? `
              <div class="gv-card p-8 text-center text-sm text-[#496052]">No community posts in this circle/topic yet. Start the first conversation!</div>
            ` : posts.map((p) => `
              <article class="gv-card p-4 sm:p-5 space-y-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="px-2.5 py-0.5 rounded-lg bg-[#EDF4EE] text-[#14532D] text-[11px] font-bold">${escapeHtml(COMMUNITY_TOPICS[p.topic]?.en || p.topic)}</span>
                    <span class="text-xs font-bold text-[#1E7E45]">${escapeHtml(p.collegeGroup)}</span>
                  </div>
                  <span class="text-[11px] text-[#496052]">By ${escapeHtml(p.authorName)} • ${formatDateShort(p.updatedAtMs)}</span>
                </div>
                <h4 class="text-base font-extrabold text-[#132219]">${escapeHtml(p.title)}</h4>
                <p class="text-sm text-[#496052] whitespace-pre-line leading-relaxed">${escapeHtml(p.body)}</p>
                <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-50">
                  <button data-upvote-post="${escapeHtml(p.id)}" data-upvote-count="${Number(p.helpfulCount) || 0}" class="px-3 py-1.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-bold">
                    👍 Helpful (${Number(p.helpfulCount) || 0})
                  </button>
                  ${state.user && state.user.uid !== p.authorId ? `
                    <button data-report-post="${escapeHtml(p.id)}" class="px-3 py-1.5 rounded-xl text-slate-500 hover:text-rose-700 text-xs font-bold">Report</button>
                  ` : ""}
                  <div class="ml-auto flex gap-1.5">
                    ${state.user && state.user.uid === p.authorId ? `
                      <button data-edit-post="${escapeHtml(p.id)}" class="px-3 py-1.5 rounded-xl bg-[#EDF4EE] hover:bg-[#D8F3DC] text-[#14532D] text-xs font-bold">Edit</button>
                    ` : ""}
                    ${state.user && (state.user.uid === p.authorId || state.isAdmin) ? `
                      <button data-del-post="${escapeHtml(p.id)}" class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold">Delete</button>
                    ` : ""}
                  </div>
                </div>
              </article>
            `).join("")}
          </div>
        </div>
      ` : `
        <div class="space-y-3">
          <div class="flex flex-wrap gap-1.5">
            ${Object.entries(CAREER_CATEGORIES).map(([k, v]) => `
              <button data-career-cat="${k}" class="px-3 py-1.5 rounded-xl text-xs font-bold ${
                state.careerCategory === k ? "bg-[#14532D] text-white" : "bg-white border border-[#CDE0D3] text-[#14532D]"
              }">${escapeHtml(v.en)}</button>
            `).join("")}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${careers.map((c) => {
              const url = safeUrl(c.applyUrl);
              return `
                <article class="gv-card p-5 flex flex-col justify-between gap-3">
                  <div class="space-y-2">
                    <span class="inline-block px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-[11px] font-bold">${escapeHtml(CAREER_CATEGORIES[c.category]?.en || c.category)}</span>
                    <h4 class="text-base font-extrabold text-[#14532D]">${escapeHtml(c.title)}</h4>
                    <p class="text-xs font-bold text-[#1E7E45]">${escapeHtml(c.organization)}</p>
                    <p class="text-xs text-[#496052]"><strong>Eligibility:</strong> ${escapeHtml(c.eligibility)}</p>
                    <p class="text-xs text-[#496052]"><strong>Deadline:</strong> ${escapeHtml(c.deadline)}</p>
                    <p class="text-xs sm:text-sm text-[#132219] leading-relaxed">${escapeHtml(c.description)}</p>
                  </div>
                  ${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="gv-btn w-full text-center py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0C3B20] text-white text-xs font-extrabold">Apply / Official Portal ↗</a>` : ""}
                </article>
              `;
            }).join("")}
          </div>
        </div>
      `}
    </div>
  `;
}
