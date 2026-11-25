// ============================================================================
// Guru Ji Vision — Farmer Financial Support & Rights: Pure Calculations,
// Official Government Schemes, Verified MSP Reference Data & Export Helpers
// ZERO fabricated market prices; clear distinction between estimates & legal proof
// ============================================================================

import { escapeHtml, formatInr } from "./calculators.js";

export const LEASE_AREA_UNITS = [
  { key: "BIGHA_WB", label: "Bigha (বিঘা — WB ~0.33 Acre)" },
  { key: "KATHA_WB", label: "Katha (কাঠা — WB)" },
  { key: "DECIMAL", label: "Decimal / Shatak (শতক)" },
  { key: "ACRE", label: "Acre (একর)" },
  { key: "HECTARE", label: "Hectare (হেক্টর)" }
];

export const PAYMENT_FREQUENCIES = [
  { key: "ONE_TIME", label: "One-Time / Lump Sum (এককালীন)" },
  { key: "SEASONAL", label: "Per Crop Season (মরসুম ভিত্তিক)" },
  { key: "MONTHLY", label: "Monthly (মাসিক)" },
  { key: "QUARTERLY", label: "Quarterly (ত্রৈমাসিক)" },
  { key: "HALF_YEARLY", label: "Half-Yearly (ষাণ্মাসিক)" },
  { key: "ANNUAL", label: "Annual (বার্ষিক)" },
  { key: "AT_HARVEST", label: "At Harvest (ফসল কাটার পর)" },
  { key: "IRREGULAR", label: "Irregular / Flexible (অনিয়মিত)" }
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  { key: "SEEDS", label: "Seeds (বীজ)" },
  { key: "FERTILIZERS", label: "Fertilizers (সার)" },
  { key: "PESTICIDES", label: "Pesticides & Fungicides (কীটনাশক)" },
  { key: "LABOUR", label: "Labour (শ্রমিক মজুরি)" },
  { key: "IRRIGATION", label: "Irrigation (সেচ)" },
  { key: "MACHINERY", label: "Machinery & Tractor (যন্ত্রপাতি ও ট্র্যাক্টর)" },
  { key: "FUEL", label: "Fuel / Diesel (জ্বালানি)" },
  { key: "LAND_LEASE", label: "Land Lease / Rent (জমির ভাড়া / লিজ)" },
  { key: "TRANSPORTATION", label: "Transportation (পরিবহন)" },
  { key: "ELECTRICITY", label: "Electricity (বিদ্যুৎ)" },
  { key: "OTHER", label: "Other Expenses (অন্যান্য খরচ)" }
];

export const FARM_SEASONS = [
  { key: "KHARIF", label: "Kharif / Aman (খরিফ / আমন)" },
  { key: "RABI", label: "Rabi (রবি)" },
  { key: "BORO_ZAID", label: "Boro / Zaid / Summer (বোরো / গ্রীষ্মকালীন)" },
  { key: "ANNUAL", label: "Annual / Perennial (বার্ষিক)" }
];

export const COMPLAINT_CATEGORIES = [
  { key: "LAND_LEASE_DISPUTE", label: "Land Lease Dispute (জমি লিজ সংক্রান্ত বিবাদ)" },
  { key: "UNCLEAR_RENTAL_AGREEMENT", label: "Unclear Rental Agreement (অস্পষ্ট ভাড়া চুক্তি)" },
  { key: "LOAN_REPAYMENT_DISAGREEMENT", label: "Loan Repayment Disagreement (ঋণ পরিশোধ নিয়ে মতবিরোধ)" },
  { key: "INTEREST_CALCULATION_DISPUTE", label: "Interest Calculation Dispute (সুদের হিসাব নিয়ে বিবাদ)" },
  { key: "CROP_PAYMENT_DELAY", label: "Crop Payment Delay (ফসল বিক্রির টাকা বকেয়া)" },
  { key: "CROP_SELLING_DISPUTE", label: "Crop Selling Dispute (ফসল বিক্রয় ও ওজন সংক্রান্ত বিবাদ)" },
  { key: "GOVT_SCHEME_ISSUE", label: "Government Scheme Application Problem (সরকারি প্রকল্পে আবেদন সমস্যা)" }
];

export const COMPLAINT_STATUSES = [
  { key: "SUBMITTED", label: "Submitted", badge: "bg-sky-100 text-sky-900 border-sky-200" },
  { key: "UNDER_REVIEW", label: "Under Review", badge: "bg-amber-100 text-amber-950 border-amber-200" },
  { key: "ADDITIONAL_INFO_REQUIRED", label: "Additional Info Required", badge: "bg-orange-100 text-orange-950 border-orange-200" },
  { key: "RESOLVED", label: "Resolved", badge: "bg-emerald-100 text-emerald-900 border-emerald-200" },
  { key: "CLOSED", label: "Closed", badge: "bg-slate-200 text-slate-800 border-slate-300" }
];

export const DOCUMENT_TYPES = [
  { key: "LEASE_AGREEMENT", label: "Lease Agreement (জমির লিজ চুক্তি)" },
  { key: "PAYMENT_RECEIPT", label: "Payment Receipt (পেমেন্ট রশিদ)" },
  { key: "LOAN_DOCUMENT", label: "Loan Document (ঋণের নথি)" },
  { key: "CROP_SALE_RECEIPT", label: "Crop Sale Receipt (ফসল বিক্রির রশিদ)" },
  { key: "EXPENSE_BILL", label: "Expense Bill (খরচের বিল)" },
  { key: "COMPLAINT_EVIDENCE", label: "Complaint Evidence (অভিযোগের প্রমাণ)" },
  { key: "SCHEME_DOCUMENT", label: "Scheme Application Doc (প্রকল্পের নথি)" }
];

// ----------------------------------------------------------------------------
// OFFICIAL GOVERNMENT MSP REFERENCE TABLE (CACP / Dept. of Agriculture, GoI)
// Clearly distinguished from market prices & procurement eligibility
// ----------------------------------------------------------------------------
export const OFFICIAL_MSP_REFERENCE = {
  lastVerifiedDate: "2025-03-01",
  sourceName: "Commission for Agricultural Costs and Prices (CACP) / Dept. of Agriculture & Farmers Welfare, Govt. of India",
  sourceUrl: "https://cacp.dacnet.nic.in/",
  procurementNote: "MSP (Minimum Support Price) is announced by the Government of India for notified crops and applies ONLY to government procurement agencies subject to Fair Average Quality (FAQ) standards and state registration. Open market / local trader prices may differ from MSP.",
  crops: [
    { crop: "Paddy (Common)", cropBn: "ধান (সাধারণ)", season: "Kharif 2024-25", mspPerQuintal: 2300, aliases: ["paddy", "rice", "dhan", "ধান"] },
    { crop: "Paddy (Grade A)", cropBn: "ধান (গ্রেড এ)", season: "Kharif 2024-25", mspPerQuintal: 2320, aliases: ["paddy grade a", "rice grade a"] },
    { crop: "Maize", cropBn: "ভুট্টা", season: "Kharif 2024-25", mspPerQuintal: 2225, aliases: ["maize", "corn", "ভুট্টা"] },
    { crop: "Arhar / Tur", cropBn: "অড়হর ডাল", season: "Kharif 2024-25", mspPerQuintal: 7550, aliases: ["arhar", "tur", "pigeon pea"] },
    { crop: "Moong", cropBn: "মুগ ডাল", season: "Kharif 2024-25", mspPerQuintal: 8682, aliases: ["moong", "green gram", "মুগ"] },
    { crop: "Urad", cropBn: "বিউলি / মাসকলাই", season: "Kharif 2024-25", mspPerQuintal: 7400, aliases: ["urad", "black gram"] },
    { crop: "Groundnut", cropBn: "চিনাবাদাম", season: "Kharif 2024-25", mspPerQuintal: 6783, aliases: ["groundnut", "peanut", "বাদাম"] },
    { crop: "Sesamum (Til)", cropBn: "তিল", season: "Kharif 2024-25", mspPerQuintal: 9267, aliases: ["sesamum", "sesame", "til", "তিল"] },
    { crop: "Jute (TDN-3)", cropBn: "পাট", season: "2024-25", mspPerQuintal: 5335, aliases: ["jute", "পাট"] },
    { crop: "Wheat", cropBn: "গম", season: "Rabi 2025-26", mspPerQuintal: 2425, aliases: ["wheat", "গম"] },
    { crop: "Rapeseed & Mustard", cropBn: "সরিষা", season: "Rabi 2025-26", mspPerQuintal: 5950, aliases: ["mustard", "rapeseed", "সরিষা"] },
    { crop: "Gram (Chana)", cropBn: "ছোলা", season: "Rabi 2025-26", mspPerQuintal: 5650, aliases: ["gram", "chana", "ছোলা"] },
    { crop: "Lentil (Masur)", cropBn: "মসুর ডাল", season: "Rabi 2025-26", mspPerQuintal: 6700, aliases: ["lentil", "masur", "মসুর"] },
    { crop: "Barley", cropBn: "যব", season: "Rabi 2025-26", mspPerQuintal: 1980, aliases: ["barley", "যব"] }
  ]
};

// ----------------------------------------------------------------------------
// VERIFIED GOVERNMENT SCHEMES & FINANCIAL ASSISTANCE DIRECTORY
// ----------------------------------------------------------------------------
export const GOVERNMENT_SCHEMES = [
  {
    id: "pm-kisan",
    scope: "CENTRAL",
    category: "Income Support • আয় সহায়তা",
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    nameBn: "পিএম-কিষাণ সম্মান নিধি (বছরে ₹৬,০০০ সরাসরি ব্যাংকে)",
    purpose: "Direct income support of ₹6,000 per year (in three equal ₹2,000 installments) transferred directly to Aadhaar-seeded bank accounts of eligible landholding farmer families.",
    purposeBn: "যোগ্য জমির মালিক কৃষক পরিবারকে বছরে ₹৬,০০০ টাকা (প্রতি কিস্তিতে ₹২,০০০ করে বছরে ৩ বার) সরাসরি আধার-সংযুক্ত ব্যাংক অ্যাকাউন্টে দেওয়া হয়।",
    eligibility: "Small, marginal, and eligible landholding farmer families as per state land records, subject to statutory exclusion criteria (e.g., income taxpayers, institutional landholders, serving/retired higher-grade govt employees are excluded).",
    eligibilityBn: "রাজ্য ভূমি রেকর্ড অনুযায়ী যোগ্য জমির মালিক কৃষক পরিবার (আয়করদাতা ও উচ্চপদস্থ সরকারি কর্মচারীরা অন্তর্ভুক্ত নন)।",
    documents: ["Aadhaar Card (e-KYC mandatory) — আধার কার্ড", "Land Ownership Records (RoR / Khatian / Parcha) — জমির পর্চা / খতিয়ান", "Aadhaar-seeded Bank Account Passbook — ব্যাংকের পাসবই", "Active Mobile Number — সচল মোবাইল নম্বর"],
    applicationProcess: "Apply online via the official PM-KISAN portal (New Farmer Registration) or visit your nearest Common Service Centre (CSC) / State Agriculture Nodal Officer. Complete Aadhaar e-KYC and land seeding verification.",
    howToApplyBn: "অফিশিয়াল pmkisan.gov.in পোর্টালে বা নিকটবর্তী তথ্যমিত্র কেন্দ্র (CSC) / ব্লক কৃষি অফিসে গিয়ে নতুন রেজিস্ট্রেশন ও আধার e-KYC সম্পন্ন করুন।",
    officialUrl: "https://pmkisan.gov.in/",
    helpline: "155261 / 011-24300606",
    verifiedDate: "2025-03-01"
  },
  {
    id: "krishak-bandhu-wb",
    scope: "WEST_BENGAL",
    category: "WB Income & Life Support • পশ্চিমবঙ্গ সহায়তা",
    name: "Krishak Bandhu (Natun) — Govt. of West Bengal",
    nameBn: "কৃষক বন্ধু (নতুন) — বছরে ₹৪,০০০ থেকে ₹১০,০০০ সহায়তা",
    purpose: "Assured financial assistance for Kharif and Rabi cultivation (up to ₹10,000/year for 1 acre or more; proportionate with minimum ₹4,000/year for smaller holdings) plus ₹2,00,000 social security death benefit for eligible farmers aged 18–60.",
    purposeBn: "খরিফ ও রবি চাষের জন্য বছরে ₹৪,০০০ থেকে ₹১০,০০০ টাকা পর্যন্ত আর্থিক সাহায্য এবং ১৮–৬০ বছর বয়সী কৃষকদের জন্য ₹২,০০,০০০ টাকার সামাজিক সুরক্ষা সহায়তা।",
    eligibility: "Recorded landholders and recorded Bargadars (sharecroppers) in West Bengal holding valid RoR/Parcha/Patta/Forest Patta.",
    eligibilityBn: "পশ্চিমবঙ্গের বৈধ জমির পর্চা, পাট্টা, ফরেস্ট পাট্টা বা নথিভুক্ত বর্গাদার কৃষকরা আবেদন করতে পারবেন।",
    documents: ["Voter ID (EPIC) & Aadhaar Card — ভোটার ও আধার কার্ড", "Latest Land RoR / Parcha / Bargadar Certificate — জমির পর্চা বা বর্গাদার নথি", "Active Bank Account Passbook (linked with Aadhaar) — ব্যাংকের পাসবই", "Passport-size Photo & Mobile Number — ছবি ও মোবাইল নম্বর"],
    applicationProcess: "Submit application offline at the nearest Duare Sarkar camp or Block Assistant Director of Agriculture (ADA) office. Check application & payment status online on the official portal.",
    howToApplyBn: "নিকটবর্তী দুয়ারে সরকার ক্যাম্প বা ব্লক কৃষি দপ্তরে (ADA Office) আবেদনপত্র জমা দিন। অফিশিয়াল পোর্টালে ভোটার/আধার নম্বর দিয়ে স্ট্যাটাস দেখুন।",
    officialUrl: "https://krishakbandhu.net/",
    helpline: "WB Agriculture Dept / Block ADA Office",
    verifiedDate: "2025-03-01"
  },
  {
    id: "kcc",
    scope: "CENTRAL",
    category: "Low-Interest Crop Credit • স্বল্প সুদে কৃষি ঋণ",
    name: "Kisan Credit Card (KCC) Scheme",
    nameBn: "কিষাণ ক্রেডিট কার্ড (KCC) — সরকারি ব্যাংকে কম সুদে ঋণ",
    purpose: "Timely and affordable institutional short-term credit for crop cultivation, post-harvest expenses, working capital for allied activities (dairy, fisheries), and interest subvention benefits for prompt repayment as notified by RBI/NABARD.",
    purposeBn: "বীজ, সার, চাষের খরচ, পশুপালন ও মৎস্য চাষের জন্য সরকারি/সমবায় ব্যাংক থেকে সহজ শর্তে ও কম সুদে কৃষি ঋণ (সময়মতো শোধ করলে সরকারি সুদ ভর্তুকি)।",
    eligibility: "Individual/joint owner-cultivators, tenant farmers, oral lessees, sharecroppers, and Self-Help Groups (SHGs) / Joint Liability Groups (JLGs) of farmers subject to bank KYC and appraisal.",
    eligibilityBn: "নিজস্ব জমির কৃষক, বর্গাদার, ভাগচাষী, লিজ কৃষক এবং স্বনির্ভর গোষ্ঠী (SHG/JLG) ব্যাংকের নিয়ম অনুযায়ী আবেদন করতে পারবেন।",
    documents: ["Application Form (Bank / PM-KISAN KCC form) — KCC আবেদনপত্র", "Identity & Address Proof (Aadhaar / Voter ID) — আধার / ভোটার কার্ড", "Land Records / Lease or Sharecropping Proof — জমির পর্চা বা ভাগচাষের প্রমাণ", "Passport-size Photographs & Bank Passbook — ছবি ও ব্যাংকের পাসবই"],
    applicationProcess: "Submit KCC application at any Commercial Bank, Regional Rural Bank (RRB), Cooperative Bank, or through JanSamarth / CSC portals. Bank verifies land/cultivation proof and sanctions credit limit.",
    howToApplyBn: "নিকটবর্তী সরকারি ব্যাংক, গ্রামীণ ব্যাংক, সমবায় ব্যাংক অথবা জনসমর্থ (JanSamarth) / CSC কেন্দ্রের মাধ্যমে KCC আবেদন জমা দিন।",
    officialUrl: "https://www.jansamarth.in/",
    helpline: "1800-180-1551 / Local Lead Bank",
    verifiedDate: "2025-03-01"
  },
  {
    id: "bangla-shasya-bima",
    scope: "WEST_BENGAL",
    category: "WB Crop Insurance • বিনামূল্যে ফসল বীমা",
    name: "Bangla Shasya Bima (BSB) — Govt. of West Bengal",
    nameBn: "বাংলা শস্য বীমা (BSB) — ফসলের ক্ষতির বীমা সুরক্ষা",
    purpose: "State-sponsored crop insurance scheme in West Bengal where the state government pays the entire farmer premium share for notified foodgrains and oilseeds (and subsidized premium for commercial crops like potato/sugarcane).",
    purposeBn: "প্রাকৃতিক দুর্যোগে ফসলের ক্ষতি হলে বীমা সহায়তা। পশ্চিমবঙ্গ সরকার নির্ধারিত খাদ্যশস্য ও তৈলবীজের সম্পূর্ণ প্রিমিয়াম বহন করে।",
    eligibility: "All farmers (owner-cultivators and sharecroppers/lessees with sowing verification) cultivating notified crops in notified gram panchayats/blocks of West Bengal.",
    eligibilityBn: "পশ্চিমবঙ্গের নির্ধারিত ব্লকে চাষ করা জমির মালিক এবং বর্গাদার/ভাগচাষী সকল কৃষক নথিভুক্ত হতে পারবেন।",
    documents: ["Voter ID & Aadhaar Card — ভোটার ও আধার কার্ড", "Land Record (Parcha / Khatian) or Cultivation Certificate — জমির পর্চা বা চাষের শংসাপত্র", "Bank Passbook Copy — ব্যাংকের পাসবইয়ের কপি", "Crop Sowing Declaration verified by local agricultural staff — ফসল রোপণের ঘোষণাপত্র"],
    applicationProcess: "Enroll free of cost (for notified food crops) during Kharif/Rabi enrollment drives at Block ADA offices, Duare Sarkar camps, or authorized insurance representatives before the cut-off date.",
    howToApplyBn: "খরিফ বা রবি মরসুমে নির্ধারিত শেষ তারিখের আগে ব্লক কৃষি দপ্তর (ADA), দুয়ারে সরকার ক্যাম্প বা অনুমোদিত বীমা প্রতিনিধির কাছে নাম নথিভুক্ত করুন।",
    officialUrl: "https://banglashasyabima.net/",
    helpline: "Block ADA Office / BSB Official Portal",
    verifiedDate: "2025-03-01"
  },
  {
    id: "pmfby",
    scope: "CENTRAL",
    category: "National Crop Insurance • জাতীয় ফসল বীমা",
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    nameBn: "প্রধানমন্ত্রী ফসল বীমা যোজনা (PMFBY)",
    purpose: "Comprehensive crop insurance covering yield losses from non-preventable natural risks (drought, flood, hailstorm, cyclone, pests/diseases) from pre-sowing to post-harvest stages.",
    purposeBn: "খরা, বন্যা, শিলাবৃষ্টি, ঘূর্ণিঝড় বা রোগপোকার কারণে ফসলের ক্ষতি হলে বীমা সুরক্ষা (কেন্দ্রীয় ফসল বীমা প্রকল্প)।",
    eligibility: "All farmers including sharecroppers and tenant farmers growing notified crops in notified areas of participating states. (Note: West Bengal operates its own state crop insurance scheme, Bangla Shasya Bima.)",
    eligibilityBn: "অংশগ্রহণকারী রাজ্যের সকল কৃষক ও ভাগচাষী (পশ্চিমবঙ্গে রাজ্য সরকারের 'বাংলা শস্য বীমা' চালু রয়েছে)।",
    documents: ["Aadhaar Card — আধার কার্ড", "Bank Passbook / Cancelled Cheque — ব্যাংকের পাসবই", "Land Record (RoR) or Valid Land Lease/Sharecropping Agreement — জমির নথি বা লিজ চুক্তি", "Sowing Certificate (where applicable) — ফসল বপনের শংসাপত্র"],
    applicationProcess: "Enroll before the seasonal cut-off date via the PMFBY portal, CSC centre, Crop Insurance App, or through your lending bank (for KCC loanee farmers).",
    howToApplyBn: "মরসুমের শেষ তারিখের আগে pmfby.gov.in পোর্টাল, CSC কেন্দ্র, Crop Insurance অ্যাপ অথবা আপনার ব্যাংকের মাধ্যমে নথিভুক্ত করুন।",
    officialUrl: "https://pmfby.gov.in/",
    helpline: "14447 (Krishi Rakshak Portal & Helpline)",
    verifiedDate: "2025-03-01"
  },
  {
    id: "matir-katha-wb",
    scope: "WEST_BENGAL",
    category: "WB Machinery & Seed Subsidy • যন্ত্রপাতি ও বীজ ভর্তুকি",
    name: "Matir Katha & WB Agricultural Subsidies (FSSM / Farm Machinery)",
    nameBn: "মাটির কথা ও পশ্চিমবঙ্গ কৃষি যন্ত্রপাতি ভর্তুকি (FSSM)",
    purpose: "Official portal of the Department of Agriculture, Government of West Bengal providing Financial Support Scheme for Farm Mechanization (FSSM), Custom Hiring Centres, seed minikits, soil health cards, and farmer advisories.",
    purposeBn: "পশ্চিমবঙ্গ কৃষি দপ্তরের অফিশিয়াল পোর্টাল — পাওয়ার টিলার, স্প্রেয়ার, ধান কাটার মেশিন ইত্যাদি কৃষি যন্ত্রপাতিতে ভর্তুকি (FSSM), বীজ মিনিকিট ও কৃষি পরামর্শ।",
    eligibility: "Farmers, Farmer Producer Organizations (FPOs), and agricultural cooperatives registered in West Bengal meeting scheme-specific norms.",
    eligibilityBn: "পশ্চিমবঙ্গের নথিভুক্ত কৃষক, কৃষক সমবায় এবং এফপিও (FPO) নির্ধারিত নিয়ম অনুযায়ী আবেদন করতে পারবেন।",
    documents: ["Aadhaar & Voter ID — আধার ও ভোটার কার্ড", "Land Records / Krishak Bandhu ID — জমির পর্চা বা কৃষক বন্ধু আইডি", "Bank Passbook — ব্যাংকের পাসবই", "Quotation from empanelled machinery supplier (for FSSM) — অনুমোদিত ডিলারের কোটেশন"],
    applicationProcess: "Apply online via the Matir Katha portal during open application windows or seek assistance at your Block Agriculture Office (ADA).",
    howToApplyBn: "আবেদন চালু হলে matirkatha.net পোর্টালে অনলাইনে অথবা ব্লক কৃষি দপ্তরে (ADA Office) যোগাযোগ করে আবেদন করুন।",
    officialUrl: "https://matirkatha.net/",
    helpline: "Block Agriculture Office (ADA) / KVK",
    verifiedDate: "2025-03-01"
  },
  {
    id: "soil-health-card",
    scope: "CENTRAL",
    category: "Free Soil Testing • মাটি পরীক্ষা সহায়তা",
    name: "Soil Health Card Scheme — Govt. of India",
    nameBn: "মৃত্তিকা স্বাস্থ্য কার্ড প্রকল্প (বিনামূল্যে মাটি পরীক্ষা)",
    purpose: "Provides farmers with a crop-wise Soil Health Card showing soil nutrient status (N, P, K, pH, micronutrients) and exact fertilizer recommendations to reduce excess chemical cost and improve yield.",
    purposeBn: "জমির মাটি পরীক্ষা করে কোন সার কতটুকু লাগবে তার সঠিক রিপোর্ট কার্ড দেওয়া হয়, ফলে সারের খরচ কমে এবং ফসলের ফলন বাড়ে।",
    eligibility: "All farmers across India can submit soil samples from their farmland through local Agriculture Offices, Krishi Vigyan Kendras (KVKs), or State Soil Testing Laboratories.",
    eligibilityBn: "ভারতের যেকোনো কৃষক নিজের জমির মাটির নমুনা পরীক্ষা করিয়ে মৃত্তিকা স্বাস্থ্য কার্ড পেতে পারেন।",
    documents: ["Aadhaar Card & Mobile Number — আধার কার্ড ও মোবাইল নম্বর", "Basic Plot / Mouza Details — জমির মৌজা / খতিয়ানের তথ্য", "Clean Soil Sample collected as per ADA/KVK guide — জমির মাটির নমুনা"],
    applicationProcess: "Contact your Block Agriculture Office (ADA) or nearest Krishi Vigyan Kendra (KVK) to submit a soil sample, or view/download your issued card on the official Soil Health Card portal.",
    howToApplyBn: "ব্লক কৃষি অফিস (ADA) বা কৃষি বিজ্ঞান কেন্দ্রে (KVK) মাটির নমুনা জমা দিন এবং soilhealth.dac.gov.in পোর্টাল থেকে রিপোর্ট ডাউনলোড করুন।",
    officialUrl: "https://soilhealth.dac.gov.in/",
    helpline: "1800-180-1551 (Kisan Call Centre)",
    verifiedDate: "2025-03-01"
  },
  {
    id: "mahila-kisan-mksp",
    scope: "CENTRAL",
    category: "Women Farmer & SHG Support • মহিলা কৃষক সহায়তা",
    name: "Mahila Kisan (MKSP) & DAY-NRLM SHG Livelihood Support",
    nameBn: "মহিলা কিষাণ ও স্বনির্ভর গোষ্ঠী (SHG) কৃষি সহায়তা",
    purpose: "Official Ministry of Rural Development programme empowering women farmers and rural Self-Help Groups (SHGs) through sustainable agriculture training, livestock/kitchen-garden support, seed banks, and low-interest SHG bank linkage.",
    purposeBn: "গ্রামীণ মহিলা কৃষক ও স্বনির্ভর গোষ্ঠীগুলোকে (SHG) টেকসই চাষাবাদ প্রশিক্ষণ, পশুপালন, বীজ ব্যাংক ও সহজ শর্তে ব্যাংক ঋণ সহায়তা।",
    eligibility: "Women farmers and rural households organized into verified Self-Help Groups (SHGs) under State Rural Livelihood Missions (e.g., Anandadhara / WBSRLM in West Bengal).",
    eligibilityBn: "রাজ্য গ্রামীণ জীবিকা মিশনের (পশ্চিমবঙ্গে আনন্দধারা / WBSRLM) অধীনে নথিভুক্ত মহিলা স্বনির্ভর গোষ্ঠীর (SHG) সদস্যরা।",
    documents: ["Aadhaar Card & SHG Membership Record — আধার কার্ড ও স্বনির্ভর গোষ্ঠীর নথি", "SHG / Personal Bank Account Passbook — ব্যাংকের পাসবই", "Rural Household KYC verified at Block SRLM — ব্লক SRLM যাচাইকরণ"],
    applicationProcess: "Contact your Gram Panchayat SHG Sangha / Block Mission Management Unit (BMMU / Anandadhara Office) or view official guidelines on the DAY-NRLM portal.",
    howToApplyBn: "গ্রাম পঞ্চায়েতের স্বনির্ভর গোষ্ঠী সংঘ বা ব্লক আনন্দধারা (BMMU/SRLM) অফিসে যোগাযোগ করুন।",
    officialUrl: "https://aajeevika.gov.in/",
    helpline: "1800-180-1551 / Block SRLM Office",
    verifiedDate: "2025-03-01"
  },
  {
    id: "aif-smam",
    scope: "CENTRAL",
    category: "Storage & Machinery • গুদাম ও যন্ত্রপাতি সহায়তা",
    name: "Agriculture Infrastructure Fund (AIF) & SMAM Machinery Subsidy",
    nameBn: "কৃষি পরিকাঠামো তহবিল (AIF) ও যন্ত্রপাতি ভর্তুকি",
    purpose: "Medium-to-long-term debt financing with 3% interest subvention and credit guarantee support for post-harvest infrastructure (warehouses, cold storage, sorting/grading units, primary processing) plus SMAM farm mechanization subsidies.",
    purposeBn: "ফসল সংরক্ষণের গুদাম, কোল্ড স্টোরেজ, গ্রেডিং ইউনিট ও কৃষি যন্ত্রপাতির জন্য ৩% সুদ ভর্তুকি ও সরকারি সহায়তা।",
    eligibility: "Farmers, FPOs, PACS, agri-entrepreneurs, and SHGs with viable project proposals.",
    eligibilityBn: "কৃষক, এফপিও (FPO), সমবায় সমিতি (PACS) ও স্বনির্ভর গোষ্ঠী প্রকল্প রিপোর্টসহ আবেদন করতে পারবেন।",
    documents: ["Aadhaar / PAN — আধার / প্যান কার্ড", "Detailed Project Report (DPR) — প্রকল্পের বিবরণ", "Land Ownership or Registered Lease Document — জমির দলিল বা রেজিস্টার্ড লিজ", "Bank Statement & KYC — ব্যাংক নথি"],
    applicationProcess: "Register and submit your project proposal online on the official AIF or SMAM portal for bank appraisal and verification.",
    howToApplyBn: "agriinfra.dac.gov.in পোর্টালে অনলাইনে রেজিস্ট্রেশন করে আপনার প্রকল্পের প্রস্তাব ও ব্যাংকের তথ্য জমা দিন।",
    officialUrl: "https://agriinfra.dac.gov.in/",
    helpline: "Official AIF / Dept. of Agriculture Portal",
    verifiedDate: "2025-03-01"
  }
];

export const OFFICIAL_GRIEVANCE_CONTACTS = [
  {
    title: "Kisan Call Centre (Govt. of India)",
    titleBn: "কিষাণ কল সেন্টার (বিনামূল্যে বাংলায় কথা বলুন)",
    contact: "1800-180-1551",
    tel: "18001801551",
    desc: "Free 24x7 agricultural advice & scheme guidance in Bengali, Hindi & English from any phone.",
    descBn: "যেকোনো ফোন থেকে সম্পূর্ণ বিনামূল্যে বাংলা, হিন্দি বা ইংরেজিতে চাষাবাদ ও সরকারি প্রকল্পের তথ্য জানুন।",
    url: "https://dackkms.gov.in/"
  },
  {
    title: "PMFBY Krishi Rakshak Helpline",
    titleBn: "ফসল বীমা সহায়তা হেল্পলাইন",
    contact: "14447",
    tel: "14447",
    desc: "Report crop insurance claim delays, crop loss intimation, or PMFBY enrollment issues.",
    descBn: "ফসল বীমার নাম নথিভুক্তি, ফসল ক্ষতির খবর জানানো বা ক্লেম সংক্রান্ত সাহায্যের জন্য কল করুন।",
    url: "https://pmfby.gov.in/"
  },
  {
    title: "West Bengal Agriculture Dept (Matir Katha)",
    titleBn: "পশ্চিমবঙ্গ কৃষি দপ্তর (মাটির কথা)",
    contact: "Block ADA / Portal",
    tel: "",
    desc: "State schemes (Krishak Bandhu, Bangla Shasya Bima, FSSM) and local block agricultural support.",
    descBn: "কৃষক বন্ধু, বাংলা শস্য বীমা ও কৃষি যন্ত্রপাতি ভর্তুকির জন্য মাটির কথা পোর্টাল ও ব্লক ADA অফিস।",
    url: "https://matirkatha.net/"
  },
  {
    title: "NALSA — Free Legal Aid Helpline",
    titleBn: "বিনামূল্যে আইনি সহায়তা (NALSA)",
    contact: "15100",
    tel: "15100",
    desc: "Free legal advice and District Legal Services Authority (DLSA) assistance for farmers in need.",
    descBn: "জমি বা অন্যান্য আইনি সমস্যায় জেলা আইনি পরিষেবা কর্তৃপক্ষের (DLSA) বিনামূল্যে আইনি সাহায্য।",
    url: "https://nalsa.gov.in/"
  },
  {
    title: "RBI Complaint Management System (CMS)",
    titleBn: "ব্যাংক সংক্রান্ত আরবিআই (RBI) সহায়তা",
    contact: "14448 / Online Portal",
    tel: "14448",
    desc: "Lodge complaints against regulated banks or NBFCs for KCC/loan issues or unfair bank charges.",
    descBn: "ব্যাংক বা KCC ঋণ সংক্রান্ত কোনো সমস্যা বা অভিযোগ থাকলে আরবিআই পোর্টালে জানান।",
    url: "https://cms.rbi.org.in/"
  },
  {
    title: "CPGRAMS — Public Grievance Portal",
    titleBn: "কেন্দ্রীয় সরকারি অভিযোগ পোর্টাল",
    contact: "Online Portal",
    tel: "",
    desc: "File official grievances regarding central agricultural schemes (PM-KISAN, KCC, procurement, public sector banks).",
    descBn: "পিএম-কিষাণ বা কেন্দ্রীয় সরকারি প্রকল্পের কোনো সমস্যা হলে অনলাইনে সরকারি অভিযোগ জমা দিন।",
    url: "https://pgportal.gov.in/"
  }
];

// ----------------------------------------------------------------------------
// PURE FINANCIAL CALCULATION ENGINE
// ----------------------------------------------------------------------------
export function daysBetweenDates(dateA, dateB) {
  const a = Date.parse(dateA);
  const b = Date.parse(dateB);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function computeLeaseSummary(lease) {
  const isCropSharing = lease.leaseType === "CROP_SHARING";
  const totalLease = Math.max(0, Number(lease.totalLeaseAmount) || 0);
  const advancePaid = Math.max(0, Number(lease.advancePayment) || 0);
  const payments = Array.isArray(lease.paymentHistory) ? lease.paymentHistory : [];
  const loggedPaymentsTotal = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalPaid = advancePaid + loggedPaymentsTotal;
  const remainingPayment = isCropSharing ? 0 : Math.max(0, totalLease - totalPaid);

  const todayIso = new Date().toISOString().slice(0, 10);
  const daysToEnd = lease.endDate ? daysBetweenDates(todayIso, lease.endDate) : null;
  let renewalStatus = "ACTIVE";
  let renewalLabel = "Active Lease";
  if (daysToEnd !== null) {
    if (daysToEnd < 0) {
      renewalStatus = "EXPIRED";
      renewalLabel = `Ended ${Math.abs(daysToEnd)}d ago`;
    } else if (daysToEnd <= 45) {
      renewalStatus = "DUE_SOON";
      renewalLabel = daysToEnd === 0 ? "Ends Today" : `Renewal in ${daysToEnd} days`;
    } else {
      renewalLabel = `${daysToEnd} days remaining`;
    }
  }

  return {
    isCropSharing,
    totalLease,
    advancePaid,
    loggedPaymentsTotal,
    totalPaid,
    remainingPayment,
    daysToEnd,
    renewalStatus,
    renewalLabel
  };
}

export function computeLoanSummary(loan, allTransactions = []) {
  const principal = Math.max(0, Number(loan.principalAmount) || 0);
  const annualRate = Math.max(0, Number(loan.interestRatePercent) || 0);
  const method = loan.interestMethod === "COMPOUND" ? "COMPOUND" : "SIMPLE";
  const compoundFreq = Math.max(1, Number(loan.compoundingFrequencyPerYear) || 1);
  const tenureMonths = Math.max(1, Number(loan.repaymentPeriodMonths) || 12);

  const loanTx = (allTransactions || [])
    .filter((tx) => tx.loanId === loan.id)
    .sort((a, b) => String(a.paymentDate || "").localeCompare(String(b.paymentDate || "")));

  const totalRepaid = loanTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const recordedPrincipalRepaid = loanTx.reduce((s, t) => s + (Number(t.principalPortion) || 0), 0);
  const recordedInterestRepaid = loanTx.reduce((s, t) => s + (Number(t.interestPortion) || 0), 0);

  // Elapsed time in years from loanDate to today (or tenure if loanDate missing)
  const todayIso = new Date().toISOString().slice(0, 10);
  const elapsedDaysRaw = loan.loanDate ? daysBetweenDates(loan.loanDate, todayIso) : null;
  const elapsedDays = elapsedDaysRaw !== null ? Math.max(0, elapsedDaysRaw) : 0;
  const elapsedYears = elapsedDays / 365;
  const fullTermYears = tenureMonths / 12;

  const r = annualRate / 100;
  let accruedInterestEstimate = 0;
  let fullTermInterestEstimate = 0;

  if (method === "COMPOUND") {
    accruedInterestEstimate = principal * (Math.pow(1 + r / compoundFreq, compoundFreq * elapsedYears) - 1);
    fullTermInterestEstimate = principal * (Math.pow(1 + r / compoundFreq, compoundFreq * fullTermYears) - 1);
  } else {
    accruedInterestEstimate = principal * r * elapsedYears;
    fullTermInterestEstimate = principal * r * fullTermYears;
  }

  accruedInterestEstimate = Math.max(0, Math.round(accruedInterestEstimate));
  fullTermInterestEstimate = Math.max(0, Math.round(fullTermInterestEstimate));

  // Principal outstanding: if user split repayments into principal/interest, apply recordedPrincipalRepaid;
  // otherwise allocate repayments toward accrued interest first, then principal (standard simple heuristic).
  let principalOutstanding = principal;
  if (recordedPrincipalRepaid > 0 || recordedInterestRepaid > 0) {
    principalOutstanding = Math.max(0, Math.round(principal - recordedPrincipalRepaid));
  } else {
    const excessAfterInterest = Math.max(0, totalRepaid - accruedInterestEstimate);
    principalOutstanding = Math.max(0, Math.round(principal - excessAfterInterest));
  }

  const totalEstimatedPayableToDate = Math.round(principal + accruedInterestEstimate);
  const remainingEstimatedAmount = Math.max(0, Math.round(totalEstimatedPayableToDate - totalRepaid));
  const totalEstimatedRepaymentFullTerm = Math.round(principal + fullTermInterestEstimate);

  // Debt comparison
  const farmerOwnBalance = loan.farmerCalculatedBalance !== undefined && loan.farmerCalculatedBalance !== "" && loan.farmerCalculatedBalance !== null
    ? Number(loan.farmerCalculatedBalance)
    : remainingEstimatedAmount;
  const lenderClaimed = loan.lenderClaimedAmount !== undefined && loan.lenderClaimedAmount !== "" && loan.lenderClaimedAmount !== null
    ? Number(loan.lenderClaimedAmount)
    : null;
  const claimDifference = lenderClaimed !== null && Number.isFinite(lenderClaimed)
    ? Math.round(lenderClaimed - farmerOwnBalance)
    : null;

  const daysUntilDue = loan.nextDueDate ? daysBetweenDates(todayIso, loan.nextDueDate) : null;

  return {
    principal,
    annualRate,
    method,
    tenureMonths,
    elapsedDays,
    loanTx,
    repaymentCount: loanTx.length,
    totalRepaid: Math.round(totalRepaid),
    principalOutstanding,
    accruedInterestEstimate,
    fullTermInterestEstimate,
    remainingEstimatedAmount,
    totalEstimatedRepaymentFullTerm,
    farmerOwnBalance: Math.round(Number.isFinite(farmerOwnBalance) ? farmerOwnBalance : remainingEstimatedAmount),
    lenderClaimed: lenderClaimed !== null && Number.isFinite(lenderClaimed) ? Math.round(lenderClaimed) : null,
    claimDifference,
    daysUntilDue
  };
}

export function normalizePricePerQuintal(price, unit) {
  const p = Number(price) || 0;
  if (unit === "KG") return p * 100;
  if (unit === "TON") return p / 10;
  return p; // QUINTAL default
}

export function findOfficialMspForCrop(cropName) {
  const q = String(cropName || "").trim().toLowerCase();
  if (!q) return null;
  return OFFICIAL_MSP_REFERENCE.crops.find((item) =>
    item.crop.toLowerCase().includes(q) ||
    item.aliases.some((al) => q.includes(al) || al.includes(q))
  ) || null;
}

export function findVerifiedMarketReferenceForCrop(cropName, mandiRecords = [], firestorePrices = []) {
  const q = String(cropName || "").trim().toLowerCase();
  if (!q) return null;

  const all = [
    ...(firestorePrices || []).filter((r) => r.published !== false).map((r) => ({
      cropName: r.cropName,
      marketName: `${r.marketName}, ${r.district}`,
      modalPrice: Number(r.modalPrice) || 0,
      unit: r.unit || "₹ / Quintal",
      reportDate: r.reportDate || "",
      sourceName: r.sourceName || "Admin Verified Mandi Record"
    })),
    ...(mandiRecords || []).map((r) => ({
      cropName: r.commodity || r.cropName,
      marketName: `${r.market || r.marketName || ""}${r.district ? `, ${r.district}` : ""}`,
      modalPrice: Number(r.modalPrice) || 0,
      unit: r.unit || "₹ / Quintal",
      reportDate: r.arrivalDate || r.reportDate || "",
      sourceName: r.source || "Official AGMARKNET (data.gov.in)"
    }))
  ];

  return all.find((item) => {
    const n = String(item.cropName || "").toLowerCase();
    return n && (n.includes(q) || q.includes(n));
  }) || null;
}

export function computeCropSaleSummary(sale, mandiRecords = [], firestorePrices = []) {
  const qtyHarvested = Math.max(0, Number(sale.quantityHarvested) || 0);
  const qtySold = Math.max(0, Number(sale.quantitySold) || 0);
  const pricePerUnit = Math.max(0, Number(sale.sellingPricePerUnit) || 0);
  const unit = sale.priceUnit || "QUINTAL";

  const grossAmount = Math.round(qtySold * pricePerUnit);
  const transport = Math.max(0, Number(sale.transportCost) || 0);
  const commission = Math.max(0, Number(sale.marketCommission) || 0);
  const otherExp = Math.max(0, Number(sale.otherExpenses) || 0);
  const totalSellingCosts = Math.round(transport + commission + otherExp);
  const netRealizable = Math.max(0, grossAmount - totalSellingCosts);
  const received = Math.max(0, Number(sale.totalAmountReceived) || 0);
  const pendingDue = Math.max(0, netRealizable - received);

  const farmerPricePerQuintal = Math.round(normalizePricePerQuintal(pricePerUnit, unit));
  const mspMatch = findOfficialMspForCrop(sale.cropName);
  const marketMatch = findVerifiedMarketReferenceForCrop(sale.cropName, mandiRecords, firestorePrices);

  const mspDiff = mspMatch ? farmerPricePerQuintal - mspMatch.mspPerQuintal : null;
  const marketDiff = marketMatch && marketMatch.modalPrice > 0
    ? farmerPricePerQuintal - Math.round(marketMatch.modalPrice)
    : null;

  return {
    qtyHarvested,
    qtySold,
    unit,
    pricePerUnit,
    grossAmount,
    totalSellingCosts,
    netRealizable,
    received,
    pendingDue,
    farmerPricePerQuintal,
    mspMatch,
    mspDiff,
    marketMatch,
    marketDiff
  };
}

export function computeProfitAndLoss({
  sales = [],
  expenses = [],
  leases = [],
  filterCrop = "ALL",
  filterSeason = "ALL",
  filterLand = "ALL",
  includeLeaseRent = false
}) {
  const activeSales = sales.filter((s) => s.status !== "ARCHIVED");
  const activeExpenses = expenses.filter((e) => e.status !== "ARCHIVED");
  const activeLeases = leases.filter((l) => l.status !== "ARCHIVED");

  const matchFilters = (item) => {
    if (filterCrop !== "ALL" && String(item.cropName || "").toLowerCase() !== filterCrop.toLowerCase()) return false;
    if (filterSeason !== "ALL" && String(item.season || "") !== filterSeason) return false;
    if (filterLand !== "ALL" && String(item.landLabel || item.leaseId || "") !== filterLand) return false;
    return true;
  };

  const filteredSales = activeSales.filter(matchFilters);
  const filteredExpenses = activeExpenses.filter(matchFilters);

  const totalRevenue = filteredSales.reduce((sum, s) => {
    const gross = (Number(s.quantitySold) || 0) * (Number(s.sellingPricePerUnit) || 0);
    const costs = (Number(s.transportCost) || 0) + (Number(s.marketCommission) || 0) + (Number(s.otherExpenses) || 0);
    return sum + Math.max(0, gross - costs);
  }, 0);

  const expenseSum = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Optionally add fixed lease rent not already logged under LAND_LEASE expenses
  const hasLeaseExpenseLogged = filteredExpenses.some((e) => e.category === "LAND_LEASE");
  let unloggedLeaseCost = 0;
  if (includeLeaseRent && !hasLeaseExpenseLogged) {
    unloggedLeaseCost = activeLeases
      .filter((l) => l.leaseType === "FIXED_RENT" && (filterLand === "ALL" || l.id === filterLand))
      .reduce((sum, l) => sum + (Number(l.totalLeaseAmount) || 0), 0);
  }

  const totalProductionCost = Math.round(expenseSum + unloggedLeaseCost);
  const netProfitLoss = Math.round(totalRevenue - totalProductionCost);

  // Incomplete expense records detection (transparent guidance!)
  const loggedCategorySet = new Set(filteredExpenses.map((e) => e.category));
  const coreCategories = ["SEEDS", "FERTILIZERS", "LABOUR"];
  const missingCoreCategories = coreCategories.filter((c) => !loggedCategorySet.has(c));
  const incompleteWarnings = [];
  if (filteredSales.length > 0 && filteredExpenses.length === 0) {
    incompleteWarnings.push("No farming expenses are recorded for this selection yet. Net figure shows revenue only — NOT actual profit.");
  } else if (filteredSales.length > 0 && missingCoreCategories.length > 0) {
    incompleteWarnings.push(`Some core input expenses (${missingCoreCategories.join(", ")}) are not recorded yet. Actual profit may be lower once all costs are entered.`);
  }
  if (filteredExpenses.length > 0 && filteredSales.length === 0) {
    incompleteWarnings.push("Expenses are logged, but no crop sale revenue is recorded yet for this filter.");
  }

  // Groupings: Crop-wise, Season-wise, Land-wise
  const buildBreakdown = (keyFn) => {
    const map = new Map();
    const touch = (k) => {
      const label = k || "General / Unassigned";
      if (!map.has(label)) map.set(label, { label, revenue: 0, cost: 0, salesCount: 0, expenseCount: 0 });
      return map.get(label);
    };
    activeSales.forEach((s) => {
      const row = touch(keyFn(s));
      const gross = (Number(s.quantitySold) || 0) * (Number(s.sellingPricePerUnit) || 0);
      const costs = (Number(s.transportCost) || 0) + (Number(s.marketCommission) || 0) + (Number(s.otherExpenses) || 0);
      row.revenue += Math.max(0, gross - costs);
      row.salesCount += 1;
    });
    activeExpenses.forEach((e) => {
      const row = touch(keyFn(e));
      row.cost += Number(e.amount) || 0;
      row.expenseCount += 1;
    });
    return Array.from(map.values()).map((r) => ({
      ...r,
      revenue: Math.round(r.revenue),
      cost: Math.round(r.cost),
      net: Math.round(r.revenue - r.cost),
      incomplete: r.salesCount > 0 && r.expenseCount === 0
    })).sort((a, b) => b.revenue - a.revenue);
  };

  return {
    totalRevenue: Math.round(totalRevenue),
    totalProductionCost,
    expenseSum: Math.round(expenseSum),
    unloggedLeaseCost: Math.round(unloggedLeaseCost),
    netProfitLoss,
    salesCount: filteredSales.length,
    expenseCount: filteredExpenses.length,
    incompleteWarnings,
    byCrop: buildBreakdown((item) => item.cropName?.trim() || "General Crop"),
    bySeason: buildBreakdown((item) => item.season || "Unassigned Season"),
    byLand: buildBreakdown((item) => item.landLabel?.trim() || "General / Own Land")
  };
}

// ----------------------------------------------------------------------------
// LOCAL DRAFT AUTO-SAVE (Protects Farmers During Network Interruptions)
// ----------------------------------------------------------------------------
function draftStorageKey(uid, formKey) {
  return `gjv_ff_draft_${uid || "guest"}_${formKey}`;
}

export function saveFormDraft(uid, formKey, data) {
  try {
    localStorage.setItem(draftStorageKey(uid, formKey), JSON.stringify({
      savedAt: Date.now(),
      data
    }));
    return true;
  } catch (_) {
    return false;
  }
}

export function loadFormDraft(uid, formKey) {
  try {
    const raw = localStorage.getItem(draftStorageKey(uid, formKey));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

export function clearFormDraft(uid, formKey) {
  try {
    localStorage.removeItem(draftStorageKey(uid, formKey));
  } catch (_) {}
}

// ----------------------------------------------------------------------------
// CSV & PRINTABLE PDF REPORT GENERATORS
// ----------------------------------------------------------------------------
function csvCell(val) {
  const s = String(val ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export function triggerCsvDownload(filename, headers, rows) {
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map((r) => r.map(csvCell).join(","))
  ];
  // UTF-8 BOM ensures Bengali text opens cleanly in Excel & Google Sheets
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function openPrintablePdfReport({
  title,
  farmerName,
  villageDistrict,
  dateFrom,
  dateTo,
  leases = [],
  loans = [],
  loanTransactions = [],
  sales = [],
  expenses = [],
  complaints = []
}) {
  const pnl = computeProfitAndLoss({ sales, expenses, leases });
  const generatedOn = new Date().toLocaleString("en-IN");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)} — Guru Ji Vision</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 24px; line-height: 1.45; }
    h1 { color: #14532D; margin: 0 0 4px; font-size: 22px; }
    h2 { color: #14532D; border-bottom: 2px solid #DCFCE7; padding-bottom: 4px; margin-top: 22px; font-size: 15px; }
    .meta { font-size: 12px; color: #475569; margin-bottom: 14px; }
    .notice { background: #FEFCE8; border: 1px solid #FDE047; padding: 10px 12px; border-radius: 8px; font-size: 11px; color: #713F12; margin-bottom: 16px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .kpi { border: 1px solid #CBD5E1; border-radius: 8px; padding: 10px; background: #F8FAFC; }
    .kpi-label { font-size: 10px; text-transform: uppercase; color: #475569; font-weight: 700; }
    .kpi-val { font-size: 16px; font-weight: 800; color: #14532D; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
    th, td { border: 1px solid #CBD5E1; padding: 6px 8px; text-align: left; }
    th { background: #ECFDF5; color: #14532D; font-weight: 700; }
    @media print { .no-print { display: none; } body { margin: 10px; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:14px;">
    <button onclick="window.print()" style="background:#14532D;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-weight:700;cursor:pointer;">Print / Save as PDF</button>
    <button onclick="window.close()" style="margin-left:8px;background:#E2E8F0;color:#0F172A;border:none;padding:10px 14px;border-radius:8px;font-weight:700;cursor:pointer;">Close</button>
  </div>
  <h1>Guru Ji Vision — ${escapeHtml(title)}</h1>
  <div class="meta">
    <strong>Farmer:</strong> ${escapeHtml(farmerName || "Registered Farmer")}
    ${villageDistrict ? ` • <strong>Location:</strong> ${escapeHtml(villageDistrict)}` : ""}
    • <strong>Date Filter:</strong> ${escapeHtml(dateFrom || "All")} to ${escapeHtml(dateTo || "Present")}
    • <strong>Generated:</strong> ${escapeHtml(generatedOn)}
  </div>
  <div class="notice">
    <strong>Important Disclaimer:</strong> This report summarizes personal financial records entered by the farmer inside Guru Ji Vision. Interest amounts are app-calculated estimates and user-entered lease/loan/sale entries are NOT automatically legally verified or lender-confirmed.
  </div>

  <div class="kpis">
    <div class="kpi"><div class="kpi-label">Active Land Leases</div><div class="kpi-val">${leases.length}</div></div>
    <div class="kpi"><div class="kpi-label">Active Loans</div><div class="kpi-val">${loans.length}</div></div>
    <div class="kpi"><div class="kpi-label">Crop Sale Revenue</div><div class="kpi-val">${escapeHtml(formatInr(pnl.totalRevenue))}</div></div>
    <div class="kpi"><div class="kpi-label">Est. Net Profit / Loss</div><div class="kpi-val">${escapeHtml(formatInr(pnl.netProfitLoss))}</div></div>
  </div>

  ${leases.length ? `
    <h2>1. Land &amp; Lease Records (${leases.length})</h2>
    <table>
      <thead><tr><th>Landowner</th><th>Location &amp; Area</th><th>Type</th><th>Period</th><th>Total / Share</th><th>Paid</th><th>Remaining</th><th>Verification</th></tr></thead>
      <tbody>
        ${leases.map((l) => {
          const s = computeLeaseSummary(l);
          return `<tr>
            <td>${escapeHtml(l.landownerName)}</td>
            <td>${escapeHtml([l.village, l.block, l.district].filter(Boolean).join(", "))} (${escapeHtml(l.landArea)} ${escapeHtml(l.areaUnit)})</td>
            <td>${l.leaseType === "CROP_SHARING" ? "Crop Sharing" : "Fixed Rent"}</td>
            <td>${escapeHtml(l.startDate)} to ${escapeHtml(l.endDate)}</td>
            <td>${l.leaseType === "CROP_SHARING" ? `${escapeHtml(l.farmerSharePercent)}% Farmer / ${escapeHtml(l.landownerSharePercent)}% Owner` : escapeHtml(formatInr(s.totalLease))}</td>
            <td>${escapeHtml(formatInr(s.totalPaid))}</td>
            <td>${escapeHtml(formatInr(s.remainingPayment))}</td>
            <td>User-entered (Not legally verified)</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  ` : ""}

  ${loans.length ? `
    <h2>2. Loan &amp; Debt Records (${loans.length})</h2>
    <table>
      <thead><tr><th>Lender</th><th>Date &amp; Purpose</th><th>Principal</th><th>Rate &amp; Method</th><th>Repaid</th><th>Est. Interest</th><th>App Est. Remaining</th><th>Lender Claimed</th></tr></thead>
      <tbody>
        ${loans.map((ln) => {
          const s = computeLoanSummary(ln, loanTransactions);
          return `<tr>
            <td>${escapeHtml(ln.lenderName)}</td>
            <td>${escapeHtml(ln.loanDate)} • ${escapeHtml(ln.purpose)}</td>
            <td>${escapeHtml(formatInr(s.principal))}</td>
            <td>${escapeHtml(s.annualRate)}% (${escapeHtml(s.method)})</td>
            <td>${escapeHtml(formatInr(s.totalRepaid))} (${s.repaymentCount} pmts)</td>
            <td>${escapeHtml(formatInr(s.accruedInterestEstimate))}</td>
            <td>${escapeHtml(formatInr(s.remainingEstimatedAmount))}</td>
            <td>${s.lenderClaimed !== null ? escapeHtml(formatInr(s.lenderClaimed)) : "Not entered"}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  ` : ""}

  ${sales.length ? `
    <h2>3. Crop Sale Records (${sales.length})</h2>
    <table>
      <thead><tr><th>Date</th><th>Crop &amp; Variety</th><th>Qty Sold</th><th>Rate</th><th>Buyer</th><th>Gross</th><th>Costs</th><th>Received</th><th>Status</th></tr></thead>
      <tbody>
        ${sales.map((sl) => {
          const s = computeCropSaleSummary(sl);
          return `<tr>
            <td>${escapeHtml(sl.sellingDate)}</td>
            <td>${escapeHtml(sl.cropName)} ${sl.cropVariety ? `(${escapeHtml(sl.cropVariety)})` : ""}</td>
            <td>${escapeHtml(s.qtySold)} ${escapeHtml(s.unit)}</td>
            <td>${escapeHtml(formatInr(s.pricePerUnit))}/${escapeHtml(s.unit)}</td>
            <td>${escapeHtml(sl.buyerName)}</td>
            <td>${escapeHtml(formatInr(s.grossAmount))}</td>
            <td>${escapeHtml(formatInr(s.totalSellingCosts))}</td>
            <td>${escapeHtml(formatInr(s.received))}</td>
            <td>${escapeHtml(sl.paymentStatus)}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>
  ` : ""}

  ${expenses.length ? `
    <h2>4. Farming Expenses (${expenses.length}) — Total: ${escapeHtml(formatInr(pnl.expenseSum))}</h2>
    <table>
      <thead><tr><th>Date</th><th>Category</th><th>Crop / Season</th><th>Description</th><th>Amount</th></tr></thead>
      <tbody>
        ${expenses.map((ex) => `<tr>
          <td>${escapeHtml(ex.expenseDate)}</td>
          <td>${escapeHtml(ex.customCategory || ex.category)}</td>
          <td>${escapeHtml([ex.cropName, ex.season].filter(Boolean).join(" • ") || "General")}</td>
          <td>${escapeHtml(ex.description)}</td>
          <td>${escapeHtml(formatInr(ex.amount))}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  ` : ""}

  ${complaints.length ? `
    <h2>5. Recorded Farmer Rights / Support Issues (${complaints.length})</h2>
    <table>
      <thead><tr><th>Date</th><th>Category</th><th>Status</th><th>Description</th></tr></thead>
      <tbody>
        ${complaints.map((c) => `<tr>
          <td>${escapeHtml(c.incidentDate || "")}</td>
          <td>${escapeHtml(c.category)}</td>
          <td>${escapeHtml(c.status)}</td>
          <td>${escapeHtml(c.description)}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  ` : ""}
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
