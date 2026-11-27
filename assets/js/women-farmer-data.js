// ============================================================================
// GURU JI VISION — WOMEN FARMER ZONE DATA & SCHEME INTEGRATION (PHASE 6)
// ============================================================================
// Module: Women Farmer Zone | নারী কৃষক সহায়তা কেন্দ্র
// IMPORTANT:
// - Reuses Phase 5's verified agriculture scheme database directly (NO duplication).
// - Accurately distinguishes officially women-dedicated schemes from general
//   agricultural schemes for which women farmers are eligible or receive priority.
// - Never falsely describes a general scheme as women-exclusive.
// - Never invents unverified local event dates or institutional claims.
// ============================================================================

import {
  mergeAgricultureSchemes,
  filterAgricultureSchemes
} from "./govt-schemes-data.js";

// Schemes whose official Central/State government rules specifically dedicate
// eligibility to women farmers / women Self Help Groups (SHGs).
export const OFFICIALLY_WOMEN_DEDICATED_SCHEME_IDS = new Set([
  "mksp-day-nrlm",
  "wb-anandadhara-wbsrlm",
  "namo-drone-didi"
]);

// General schemes that are open to eligible farmers regardless of gender,
// where official guidelines explicitly provide enhanced subsidy/priority for women.
export const WOMEN_PRIORITY_ENHANCED_SCHEME_IDS = new Set([
  "pmmsy-fisheries", // Up to 60% subsidy for women/SC/ST vs 40% general
  "smam-machinery", // Higher assistance brackets for women/SC/ST/small farmers
  "pmfme-micro-food-processing", // Dedicated Seed Capital for Women SHG members
  "fpo-10000" // Special encouragement for women-led FPOs under the 10,000 FPO scheme
]);

// International Recognition Banner (Verified UNGA Resolution A/RES/78/279 & FAO)
export const INTERNATIONAL_WOMEN_FARMER_BANNER = Object.freeze({
  badgeEn: "International Year of the Woman Farmer (2026) • UN & FAO",
  badgeBn: "আন্তর্জাতিক নারী কৃষক বর্ষ (২০২৬) • জাতিসংঘ ও FAO",
  titleEn: "Recognizing Women Farmers & Agri-Leaders Around the World",
  titleBn: "কৃষি ও খাদ্য নিরাপত্তায় নারী কৃষকদের অবদানের আন্তর্জাতিক স্বীকৃতি",
  bodyEn: "The United Nations General Assembly (Resolution A/RES/78/279) declared 2026 as the International Year of the Woman Farmer, led by the Food and Agriculture Organization (FAO), to spotlight women's vital contributions across crop farming, dairy, fisheries, horticulture, and rural food systems.",
  bodyBn: "জাতিসংঘের সাধারণ পরিষদ (প্রস্তাব A/RES/78/279) ২০২৬ সালকে 'আন্তর্জাতিক নারী কৃষক বর্ষ' হিসেবে ঘোষণা করেছে (FAO-র নেতৃত্বে), যাতে ফসল চাষ, পশুপালন, মৎস্য, উদ্যানপালন ও খাদ্য নিরাপত্তায় নারী কৃষকদের গুরুত্বপূর্ণ ভূমিকা বিশ্বজুড়ে সম্মানিত হয়।",
  noteEn: "Informational reference only — please verify local government workshops or state programmes directly on official portals.",
  noteBn: "তথ্যমূলক বার্তা — স্থানীয় সরকারি প্রশিক্ষণ বা কর্মসূচির তারিখ সরাসরি সরকারি পোর্টালে যাচাই করুন।",
  officialUrl: "https://www.fao.org/",
  officialLabelEn: "FAO Official Portal",
  officialLabelBn: "FAO সরকারি পোর্টাল"
});

// ----------------------------------------------------------------------------
// ALL 11 WOMEN FARMER DISCUSSION CATEGORIES (Bilingual EN + Simple BN)
// ----------------------------------------------------------------------------
export const WOMEN_DISCUSSION_CATEGORIES = [
  { key: "ALL", en: "All Topics", bn: "সব বিষয়" },
  { key: "CROP_CULTIVATION", en: "Crop Cultivation", bn: "ফসল চাষ" },
  { key: "DISEASE_PEST", en: "Crop Disease & Pest Problems", bn: "রোগ ও পোকা সমস্যা" },
  { key: "GOVT_SCHEMES", en: "Government Schemes", bn: "সরকারি প্রকল্প" },
  { key: "WOMEN_RIGHTS", en: "Women Farmer Rights", bn: "নারী কৃষক অধিকার" },
  { key: "AGRI_TRAINING", en: "Agricultural Training", bn: "কৃষি প্রশিক্ষণ" },
  { key: "AGRI_BUSINESS", en: "Agricultural Business", bn: "কৃষি ব্যবসা ও উদ্যোগ" },
  { key: "HORTICULTURE", en: "Horticulture", bn: "উদ্যানপালন (ফল-সবজি-ফুল)" },
  { key: "DAIRY_LIVESTOCK", en: "Dairy & Livestock", bn: "দুগ্ধ ও পশুপালন" },
  { key: "FISHERIES", en: "Fisheries", bn: "মৎস্য চাষ" },
  { key: "SUCCESS_STORIES", en: "Success Stories", bn: "সাফল্যের গল্প" },
  { key: "GENERAL", en: "General Discussion", bn: "সাধারণ আলোচনা" }
];

export const WOMEN_DISCUSSION_POST_CATEGORIES = WOMEN_DISCUSSION_CATEGORIES.filter((c) => c.key !== "ALL");

export function getDiscussionCategoryMeta(key) {
  return WOMEN_DISCUSSION_CATEGORIES.find((c) => c.key === key) || WOMEN_DISCUSSION_CATEGORIES[WOMEN_DISCUSSION_CATEGORIES.length - 1];
}

// ----------------------------------------------------------------------------
// ALL 15 WOMEN FARMER ZONE DASHBOARD RESOURCE CARDS (Bilingual EN + Simple BN)
// ----------------------------------------------------------------------------
export const WOMEN_FARMER_DASHBOARD_AREAS = [
  {
    id: "women_schemes",
    group: "SCHEMES_AND_BENEFITS",
    en: "Women Farmer Government Schemes",
    bn: "নারী কৃষকদের সরকারি প্রকল্প",
    descEn: "Verified women-dedicated schemes (MKSP / DAY-NRLM, Namo Drone Didi) plus general Central & State schemes open to women farmers.",
    descBn: "নারী কৃষকদের জন্য নির্ধারিত সরকারি প্রকল্প (MKSP, নমো ড্রোন দিদি) এবং নারীদের জন্য উন্মুক্ত কেন্দ্রীয় ও রাজ্য প্রকল্প।",
    badgeEn: "Verified Schemes",
    badgeBn: "যাচাইকৃত প্রকল্প",
    actionType: "wf-schemes",
    actionValue: "WOMEN_DEDICATED"
  },
  {
    id: "farmer_benefits",
    group: "SCHEMES_AND_BENEFITS",
    en: "Farmer Benefits & Assistance",
    bn: "কৃষক সহায়তা ও ভাতা",
    descEn: "Income support (PM-KISAN, Krishak Bandhu), crop insurance (PMFBY, Bangla Shasya Bima) & input subsidies for eligible women farmers.",
    descBn: "আর্থিক সহায়তা (পিএম-কিষাণ, কৃষক বন্ধু), ফসল বীমা (বাংলা শস্য বীমা, PMFBY) ও কৃষি ভর্তুকির তথ্য।",
    badgeEn: "Income & Insurance",
    badgeBn: "ভাতা ও বীমা",
    actionType: "wf-schemes",
    actionValue: "ALL"
  },
  {
    id: "agri_training",
    group: "SKILLS_AND_ENTERPRISE",
    en: "Agricultural Training",
    bn: "কৃষি ও দক্ষতা প্রশিক্ষণ",
    descEn: "KVK / ATMA free farmer field schools, Krishi Sakhi training, soil testing, mushroom & nursery workshops.",
    descBn: "কেভিকে (KVK) ও আত্মা (ATMA) বিনামূল্যে কৃষি প্রশিক্ষণ, কৃষি সখী প্রশিক্ষণ, মাটি পরীক্ষা ও নার্সারি শিক্ষা।",
    badgeEn: "KVK & ATMA",
    badgeBn: "বিনামূল্যে প্রশিক্ষণ",
    actionType: "wf-discussion",
    actionValue: "AGRI_TRAINING"
  },
  {
    id: "women_fpo",
    group: "SKILLS_AND_ENTERPRISE",
    en: "Women-led FPO Information",
    bn: "নারী পরিচালিত FPO (কৃষক উৎপাদক সংস্থা)",
    descEn: "How women farmers form Farmer Producer Organizations (FPOs) for bulk seed purchase, grading, branding & fair market prices.",
    descBn: "নারী কৃষকদের সমবায় ও FPO গঠনের নিয়ম, যৌথভাবে বীজ-সার ক্রয় ও ফসলের ন্যায্য বাজারদর পাওয়ার উপায়।",
    badgeEn: "Collective Power",
    badgeBn: "সম্মিলিত উদ্যোগ",
    actionType: "wf-rights",
    actionValue: "fpo"
  },
  {
    id: "agri_entrepreneurship",
    group: "SKILLS_AND_ENTERPRISE",
    en: "Agricultural Entrepreneurship",
    bn: "কৃষি উদ্যোক্তা উন্নয়ন",
    descEn: "Food processing (PMFME), seed production, organic compost, honeybee keeping, floriculture & rural agri-startups.",
    descBn: "খাদ্য প্রক্রিয়াকরণ (PMFME), বীজ উৎপাদন, জৈব সার, মৌমাছি পালন, ফুল চাষ ও গ্রামীণ কৃষি উদ্যোগ।",
    badgeEn: "Agri-Startups",
    badgeBn: "নতুন ব্যবসা",
    actionType: "wf-discussion",
    actionValue: "AGRI_BUSINESS"
  },
  {
    id: "credit_finance",
    group: "SCHEMES_AND_BENEFITS",
    en: "Credit & Financial Assistance",
    bn: "কৃষি ঋণ ও আর্থিক সহায়তা",
    descEn: "Kisan Credit Card (KCC) with interest subvention, SHG bank linkage loans, and low-interest working capital for women farmers.",
    descBn: "কিষাণ ক্রেডিট কার্ড (KCC), স্বনির্ভর গোষ্ঠী (SHG) ব্যাংক ঋণ এবং কম সুদে কৃষি ঋণের সঠিক তথ্য।",
    badgeEn: "KCC & SHG Credit",
    badgeBn: "কম সুদে ঋণ",
    actionType: "wf-scheme-cat",
    actionValue: "AGRI_LOANS_CREDIT"
  },
  {
    id: "shg_livelihood",
    group: "SKILLS_AND_ENTERPRISE",
    en: "SHG & Livelihood Programmes",
    bn: "স্বনির্ভর গোষ্ঠী (SHG) ও জীবিকা প্রকল্প",
    descEn: "DAY-NRLM, Mahila Kisan Sashaktikaran Pariyojana (MKSP), West Bengal Anandadhara & Lakhpati Didi livelihood pathways.",
    descBn: "DAY-NRLM, মহিলা কিষাণ সশক্তিকরণ প্রকল্প (MKSP), পশ্চিমবঙ্গ আনন্দধারা ও স্বনির্ভর গোষ্ঠীর জীবিকা সহায়তা।",
    badgeEn: "SHG & Anandadhara",
    badgeBn: "স্বনির্ভর গোষ্ঠী",
    actionType: "wf-scheme-detail",
    actionValue: "wb-anandadhara-wbsrlm"
  },
  {
    id: "crop_cultivation",
    group: "FARMING_SECTORS",
    en: "Crop Cultivation Resources",
    bn: "ফসল চাষ ও আধুনিক পদ্ধতি",
    descEn: "ICAR crop guides (Paddy, Wheat, Potato, Mustard, Vegetables), disease/pest IPM & NPK fertilizer calculator.",
    descBn: "ধান, গম, আলু, সরিষা ও সবজি চাষের আধুনিক নিয়ম, রোগ-পোকা দমন এবং সার পরিমাপক।",
    badgeEn: "Crop Guides",
    badgeBn: "চাষের নিয়ম",
    actionType: "route",
    actionValue: "farmer"
  },
  {
    id: "horticulture",
    group: "FARMING_SECTORS",
    en: "Horticulture",
    bn: "উদ্যানপালন (ফল, সবজি, ফুল ও মসলা)",
    descEn: "MIDH subsidies for protected cultivation, kitchen gardens, fruit orchards, nursery raising & post-harvest cold storage.",
    descBn: "ফল বাগান, সবজি চাষ, ফুল চাষ, নার্সারি ও পলিহাউসের জন্য MIDH প্রকল্প ও চাষের আলোচনা।",
    badgeEn: "MIDH & Nurseries",
    badgeBn: "উদ্যানপালন",
    actionType: "wf-scheme-cat",
    actionValue: "HORTICULTURE"
  },
  {
    id: "dairy_livestock",
    group: "FARMING_SECTORS",
    en: "Dairy & Livestock",
    bn: "দুগ্ধ ও পশুপালন",
    descEn: "KCC for Animal Husbandry, National Livestock Mission (poultry/goat/piggery), dairy cooperatives & livestock insurance.",
    descBn: "গবাদি পশু, হাঁস-মুরগি, ছাগল পালন, দুগ্ধ সমবায়, পশু KCC ঋণ ও NLM ভর্তুকির তথ্য।",
    badgeEn: "Dairy & Poultry",
    badgeBn: "পশুপালন",
    actionType: "wf-scheme-cat",
    actionValue: "DAIRY_FARMING"
  },
  {
    id: "fisheries",
    group: "FARMING_SECTORS",
    en: "Fisheries",
    bn: "মৎস্য চাষ ও জলসম্পদ",
    descEn: "PMMSY (up to 60% subsidy for women beneficiaries under official rules), pond aquaculture, ornamental fish & fisherwomen KCC.",
    descBn: "PMMSY প্রকল্পে নারী মৎস্যচাষিদের জন্য সরকারি নিয়মে ৬০% পর্যন্ত ভর্তুকি, পুকুর মাছ চাষ ও মৎস্য KCC।",
    badgeEn: "PMMSY • 60% Women Subsidy",
    badgeBn: "মৎস্য ভর্তুকি",
    actionType: "wf-scheme-cat",
    actionValue: "FISHERIES_AQUACULTURE"
  },
  {
    id: "agri_business",
    group: "SKILLS_AND_ENTERPRISE",
    en: "Agricultural Business Guidance",
    bn: "কৃষি ব্যবসা ও বিপণন সহায়তা",
    descEn: "Direct mandi price tracking (AGMARKNET), grading, packaging, FSSAI registration basics & selling through e-NAM.",
    descBn: "সরাসরি মান্ডি বাজারদর জানা, ফসল বাছাই-প্যাকেজিং, FSSAI নথি ও e-NAM অনলাইন বিক্রয় নির্দেশিকা।",
    badgeEn: "Market & e-NAM",
    badgeBn: "বাজার ও বিপণন",
    actionType: "wf-rights",
    actionValue: "business"
  },
  {
    id: "women_rights",
    group: "RIGHTS_AND_COMMUNITY",
    en: "Women Farmer Rights",
    bn: "নারী কৃষকদের অধিকার ও সচেতনতা",
    descEn: "Equal access to agricultural schemes, land inheritance awareness (Hindu Succession Amendment Act 2005), joint patta & equal wages.",
    descBn: "সরকারি প্রকল্পে সমান অধিকার, জমির উত্তরাধিকার আইন, যৌথ পাট্টা, সমান মজুরি ও বিনামূল্যে আইনি সহায়তা।",
    badgeEn: "Know Your Rights",
    badgeBn: "অধিকার সচেতনতা",
    actionType: "wf-rights",
    actionValue: "rights"
  },
  {
    id: "official_helplines",
    group: "RIGHTS_AND_COMMUNITY",
    en: "Official Helplines & Grievance Information",
    bn: "সরকারি হেল্পলাইন ও অভিযোগ নিষ্পত্তি",
    descEn: "Kisan Call Centre (1800-180-1551), Women Helpline (181), NALSA Free Legal Aid (15100), NCW & Block ADA office support.",
    descBn: "কিষাণ কল সেন্টার (১৮০০-১৮০-১৫৫১), নারী হেল্পলাইন (১৮১), বিনামূল্যে আইনি সহায়তা (১৫১০০) ও ব্লক কৃষি অফিস।",
    badgeEn: "Toll-Free Helplines",
    badgeBn: "টোল-ফ্রি হেল্পলাইন",
    actionType: "wf-rights",
    actionValue: "helplines"
  },
  {
    id: "success_stories",
    group: "RIGHTS_AND_COMMUNITY",
    en: "Success Stories",
    bn: "নারী কৃষকদের সাফল্যের গল্প",
    descEn: "Read & share inspiring real farming journeys, SHG achievements, organic gardening wins & agri-business milestones on the board.",
    descBn: "নারী কৃষকদের বাস্তব সাফল্যের গল্প, স্বনির্ভর গোষ্ঠীর অভিজ্ঞতা ও অনুপ্রেরণামূলক উদ্যোগ পড়ুন ও শেয়ার করুন।",
    badgeEn: "Community Stories",
    badgeBn: "অনুপ্রেরণা",
    actionType: "wf-discussion",
    actionValue: "SUCCESS_STORIES"
  }
];

// ----------------------------------------------------------------------------
// VERIFIED RIGHTS, FPO/BUSINESS GUIDANCE & OFFICIAL HELPLINES
// ----------------------------------------------------------------------------
export const WOMEN_FARMER_RIGHTS_INFO = [
  {
    id: "right-schemes",
    titleEn: "Equal Access to General & Women-Focused Schemes",
    titleBn: "সাধারণ ও নারী-কেন্দ্রিক সব কৃষি প্রকল্পে সমান অধিকার",
    bodyEn: "Women farmers who own land, cultivate family land, or work through Self Help Groups (SHGs) / Joint Liability Groups (JLGs) are eligible for major Central & State schemes — including PM-KISAN (landholders), KCC (including dairy/fisheries), PMFBY, PMMSY (higher women subsidy), MIDH, and DAY-NRLM / MKSP.",
    bodyBn: "জমির মালিক, ভাগচাষি (রাজ্য নিয়ম অনুযায়ী) বা স্বনির্ভর গোষ্ঠীর (SHG) সদস্য নারী কৃষকরা কেন্দ্রীয় ও রাজ্য সরকারের প্রধান কৃষি প্রকল্পে আবেদন করতে পারেন — যেমন পিএম-কিষাণ, KCC (পশুপালন ও মৎস্য সহ), ফসল বীমা, PMMSY (নারীদের জন্য বেশি ভর্তুকি) এবং MKSP / আনন্দধারা।"
  },
  {
    id: "right-land",
    titleEn: "Land Rights & Inheritance Awareness",
    titleBn: "জমির মালিকানা ও উত্তরাধিকার সচেতনতা",
    bodyEn: "Under Indian law (such as the Hindu Succession Amendment Act, 2005 for applicable families) and applicable personal/state land laws, daughters and women have recognized property rights. Many states also encourage joint land titles (Joint Patta) or stamp-duty concessions when land is registered in a woman's name. Verify state rules at your local BL&LRO / Tehsil office.",
    bodyBn: "ভারতীয় আইন (প্রযোজ্য ক্ষেত্রে হিন্দু উত্তরাধিকার সংশোধনী আইন ২০০৫ ও সংশ্লিষ্ট রাজ্য ভূমি আইন) অনুযায়ী নারীদের সম্পত্তির উত্তরাধিকার স্বীকৃত। অনেক রাজ্যে নারীদের নামে জমি নথিভুক্তি বা যৌথ পাট্টায় উৎসাহ ও স্ট্যাম্প ডিউটি ছাড় দেওয়া হয়। সঠিক তথ্যের জন্য স্থানীয় BL&LRO / ভূমি অফিসে যোগাযোগ করুন।"
  },
  {
    id: "right-wages",
    titleEn: "Equal Remuneration & Workplace Dignity",
    titleBn: "সমান মজুরি ও নিরাপদ কর্মপরিবেশের অধিকার",
    bodyEn: "Women agricultural workers have the legal right to equal wages for work of equal nature (Code on Wages / Equal Remuneration principles) and safe working conditions. Free legal assistance is available through District Legal Services Authorities (NALSA Helpline 15100).",
    bodyBn: "সমান কাজের জন্য সমান মজুরি ও নিরাপদ কর্মপরিবেশ নারী কৃষিশ্রমিকদের আইনি অধিকার। কোনো বৈষম্য বা আইনি সমস্যায় জেলা আইনি সহায়তা কেন্দ্র (NALSA হেল্পলাইন ১৫১০০)-এ বিনামূল্যে পরামর্শ পাওয়া যায়।"
  },
  {
    id: "right-fpo-business",
    titleEn: "Women-Led FPOs, SHG Grading & Agri-Business Guidance",
    titleBn: "নারী পরিচালিত FPO, স্বনির্ভর গোষ্ঠী ও কৃষি ব্যবসা নির্দেশিকা",
    bodyEn: "1) Form or join a village SHG under DAY-NRLM / Anandadhara. 2) Pool produce with neighboring women farmers into a Women-Led FPO (supported under the 10,000 FPO Scheme through NABARD / SFAC / NCDC). 3) Apply for PMFME for micro food processing (pickles, spices, dal milling, dairy). 4) Track daily APMC Mandi rates in Guru Ji Vision before selling.",
    bodyBn: "১) DAY-NRLM বা আনন্দধারার অধীনে গ্রামের স্বনির্ভর গোষ্ঠীতে যুক্ত হন। ২) একাধিক নারী কৃষক একত্রিত হয়ে NABARD / SFAC-এর সহায়তায় নারী পরিচালিত FPO গঠন করতে পারেন। ৩) আচার, মসলা, ডাল বা দুগ্ধ প্রক্রিয়াকরণের জন্য PMFME প্রকল্পে আবেদন করুন। ৪) ফসল বিক্রির আগে গুরু জি ভিশনের মান্ডি বাজারদর দেখে ন্যায্য দাম যাচাই করুন।"
  }
];

export const WOMEN_OFFICIAL_HELPLINES = [
  {
    nameEn: "Kisan Call Centre (Govt. of India — Toll Free, Bengali & Local Languages)",
    nameBn: "কিষাণ কল সেন্টার (ভারত সরকার — টোল ফ্রি, বাংলা ও আঞ্চলিক ভাষা)",
    number: "1800-180-1551",
    tel: "18001801551",
    url: "https://mkisan.gov.in/",
    descEn: "Daily 6 AM – 10 PM agricultural advice on crops, pests, schemes & training.",
    descBn: "প্রতিদিন সকাল ৬টা থেকে রাত ১০টা — ফসল, রোগ-পোকা, প্রকল্প ও প্রশিক্ষণের বিনামূল্যে পরামর্শ।"
  },
  {
    nameEn: "Women Helpline (All-India Emergency & Support)",
    nameBn: "সর্বভারতীয় নারী হেল্পলাইন (জরুরি ও আইনি সহায়তা)",
    number: "181",
    tel: "181",
    url: "https://wcd.gov.in/",
    descEn: "24×7 helpline for women seeking safety, grievance redressal, or referral to One Stop Centres.",
    descBn: "২৪ ঘণ্টা জরুরি সহায়তা, অভিযোগ নিষ্পত্তি ও ওয়ান স্টপ সেন্টারে যোগাযোগের হেল্পলাইন।"
  },
  {
    nameEn: "NALSA Free Legal Aid Helpline (Women Eligible Regardless of Income)",
    nameBn: "NALSA বিনামূল্যে আইনি সহায়তা হেল্পলাইন (নারীদের জন্য সম্পূর্ণ বিনামূল্যে)",
    number: "15100",
    tel: "15100",
    url: "https://nalsa.gov.in/",
    descEn: "Under Section 12 of the Legal Services Authorities Act, all women are entitled to free legal aid for land, wage, or family disputes.",
    descBn: "আইন অনুযায়ী সকল নারী জমি, মজুরি বা পারিবারিক বিষয়ে বিনামূল্যে আইনি পরামর্শ ও সহায়তা পাওয়ার অধিকারী।"
  },
  {
    nameEn: "National Commission for Women (NCW) Helpline",
    nameBn: "জাতীয় মহিলা কমিশন (NCW) হেল্পলাইন",
    number: "7827170170",
    tel: "7827170170",
    url: "https://ncw.nic.in/",
    descEn: "24×7 helpline & online grievance registration portal for women's rights and complaints.",
    descBn: "নারী অধিকার সুরক্ষা ও অনলাইন অভিযোগ নথিভুক্ত করার সরকারি পোর্টাল ও হেল্পলাইন।"
  },
  {
    nameEn: "PMFBY Crop Insurance Helpline",
    nameBn: "প্রধানমন্ত্রী ফসল বীমা (PMFBY) হেল্পলাইন",
    number: "14447",
    tel: "14447",
    url: "https://pmfby.gov.in/",
    descEn: "Report crop loss within 72 hours and check crop insurance claim status.",
    descBn: "প্রাকৃতিক দুর্যোগে ফসলের ক্ষতি হলে ৭২ ঘণ্টার মধ্যে জানাতে ও বীমার অবস্থা জানতে কল করুন।"
  },
  {
    nameEn: "DAY-NRLM / MKSP & West Bengal Anandadhara Official Portals",
    nameBn: "DAY-NRLM / MKSP ও পশ্চিমবঙ্গ আনন্দধারা সরকারি পোর্টাল",
    number: "Online Portal",
    tel: "",
    url: "https://aajeevika.gov.in/",
    descEn: "Verify Women SHG membership, Krishi Sakhi programmes, and rural livelihood support.",
    descBn: "স্বনির্ভর গোষ্ঠী, কৃষি সখী ও মহিলা কিষাণ প্রকল্পের সরকারি তথ্য যাচাই করুন।"
  }
];

// ----------------------------------------------------------------------------
// SCHEME INTEGRATION HELPERS (REUSES PHASE 5 — ZERO DUPLICATION)
// ----------------------------------------------------------------------------

/**
 * Classifies each verified scheme from Phase 5's single source of truth so we
 * NEVER falsely label a general scheme as women-exclusive.
 */
export function getWomenSchemeClassification(scheme) {
  if (!scheme) return { eligible: false, tier: "NOT_APPLICABLE" };
  const id = String(scheme.id || "");
  if (OFFICIALLY_WOMEN_DEDICATED_SCHEME_IDS.has(id)) {
    return {
      eligible: true,
      tier: "WOMEN_DEDICATED",
      badgeEn: "Women-Focused / Dedicated Scheme",
      badgeBn: "নারী কৃষক বিশেষ প্রকল্প",
      badgeClass: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300"
    };
  }
  if (WOMEN_PRIORITY_ENHANCED_SCHEME_IDS.has(id)) {
    return {
      eligible: true,
      tier: "GENERAL_WOMEN_PRIORITY",
      badgeEn: "General Scheme • Higher Women Priority/Subsidy",
      badgeBn: "সাধারণ প্রকল্প • নারীদের অগ্রাধিকার/বেশি ভর্তুকি",
      badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300"
    };
  }
  if (scheme.womenFarmerEligible === true) {
    return {
      eligible: true,
      tier: "GENERAL_WOMEN_ELIGIBLE",
      badgeEn: "General Scheme • Women Farmers Eligible",
      badgeBn: "সাধারণ কৃষি প্রকল্প • নারী কৃষকরা আবেদনযোগ্য",
      badgeClass: "bg-sky-100 text-sky-900 border-sky-300"
    };
  }
  return { eligible: false, tier: "NOT_APPLICABLE" };
}

function scoreWomenSchemePriority(scheme, classification) {
  const st = String(scheme?.applicableState || "").toLowerCase();
  const isWB = st.includes("west bengal");
  const isCentral = scheme?.govtLevel === "CENTRAL" || st.includes("all india");
  let score = 0;
  if (isWB) score += 40; // West Bengal Government priority
  if (classification.tier === "WOMEN_DEDICATED") score += 35;
  else if (classification.tier === "GENERAL_WOMEN_PRIORITY") score += 20;
  if (isCentral) score += 15; // Applicable Central Government priority
  return score;
}

/**
 * Returns women-eligible schemes directly from Phase 5's merged database
 * without duplicating any scheme records, prioritizing West Bengal & applicable
 * Central Government schemes cleanly.
 * @param {Array} cloudSchemes - state.agricultureSchemes
 * @param {Object} filters - { mode: 'ALL'|'WB_PRIORITY'|'CENTRAL_ONLY'|'WOMEN_DEDICATED'|'GENERAL_ELIGIBLE', stateName, category, search }
 */
export function getWomenFarmerSchemes(cloudSchemes = [], filters = {}) {
  const mode = filters.mode || "ALL";
  const allPublicSchemes = mergeAgricultureSchemes(cloudSchemes, false);

  const effectiveState =
    mode === "WB_PRIORITY" && (!filters.stateName || filters.stateName === "ALL")
      ? "West Bengal"
      : (filters.stateName || "ALL");

  // Apply Phase 5's verified state/category/search filter first (zero duplicated logic!)
  const preFiltered = filterAgricultureSchemes(allPublicSchemes, {
    stateName: effectiveState,
    category: filters.category || "ALL",
    search: filters.search || "",
    womenOnly: true
  });

  return preFiltered
    .map((scheme) => ({
      scheme,
      classification: getWomenSchemeClassification(scheme)
    }))
    .filter(({ scheme, classification }) => {
      if (!classification.eligible) return false;
      if (mode === "WOMEN_DEDICATED") return classification.tier === "WOMEN_DEDICATED";
      if (mode === "GENERAL_ELIGIBLE") return classification.tier !== "WOMEN_DEDICATED";
      if (mode === "CENTRAL_ONLY") return scheme.govtLevel === "CENTRAL";
      if (mode === "WB_PRIORITY") {
        const st = String(scheme.applicableState || "").toLowerCase();
        return st.includes("west bengal") || scheme.govtLevel === "CENTRAL";
      }
      return true;
    })
    .sort((a, b) => scoreWomenSchemePriority(b.scheme, b.classification) - scoreWomenSchemePriority(a.scheme, a.classification));
}

// ----------------------------------------------------------------------------
// DISCUSSION FILTERING & THREADED COMMENT HELPERS
// ----------------------------------------------------------------------------

/**
 * Filters Women Farmer Discussion Board posts from the unified /communityPosts
 * collection without altering or translating user-written content.
 */
export function filterWomenDiscussions(communityPosts = [], filters = {}, isAdmin = false) {
  const category = filters.category || "ALL";
  const query = String(filters.search || "").trim().toLowerCase();

  return (Array.isArray(communityPosts) ? communityPosts : [])
    .filter((p) => {
      if (!p) return false;
      if (p.board !== "WOMEN_FARMER") return false;
      if (!isAdmin && p.status !== "ACTIVE") return false;
      if (category !== "ALL" && (p.category || "GENERAL") !== category) return false;
      if (!query) return true;

      const catMeta = getDiscussionCategoryMeta(p.category || "GENERAL");
      const haystack = [
        p.title,
        p.body,
        p.authorName,
        p.district,
        p.collegeGroup,
        catMeta.en,
        catMeta.bn
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => (Number(b.createdAtMs) || 0) - (Number(a.createdAtMs) || 0));
}

/**
 * Organizes flat comments under a post into top-level comments and nested replies
 * while preserving original user text untouched.
 */
export function buildCommentThreads(comments = [], isAdmin = false, currentUid = "") {
  const visible = (Array.isArray(comments) ? comments : []).filter((c) =>
    c && (c.status === "ACTIVE" || isAdmin || (currentUid && c.authorId === currentUid))
  );
  const sorted = [...visible].sort((a, b) => (Number(a.createdAtMs) || 0) - (Number(b.createdAtMs) || 0));
  const byId = new Map(sorted.map((c) => [c.id, c]));
  const roots = [];
  const repliesByParent = new Map();

  for (const c of sorted) {
    const pid = String(c.parentCommentId || "").trim();
    if (pid && byId.has(pid) && pid !== c.id) {
      if (!repliesByParent.has(pid)) repliesByParent.set(pid, []);
      repliesByParent.get(pid).push(c);
    } else {
      roots.push(c);
    }
  }

  return roots.map((root) => ({
    comment: root,
    replies: repliesByParent.get(root.id) || []
  }));
}
