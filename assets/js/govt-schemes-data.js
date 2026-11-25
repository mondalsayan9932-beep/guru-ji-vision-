// ============================================================================
// Guru Ji Vision — Agriculture Government Schemes & Farmer Benefits Data Engine
// Module: Agriculture Government Schemes & Farmer Benefits
// Bengali: কৃষি সরকারি প্রকল্প ও কৃষক সহায়তা কেন্দ্র
//
// Coverage Policy:
// - Verified official Central, West Bengal, selected State & District programmes.
// - Covers all 23 agricultural & allied categories.
// - ZERO invented scheme names, benefit amounts, deadlines, URLs, or helplines.
// - Explicit freshness & verification checker: never marks stale/unverified info
//   as currently verified.
// ============================================================================

export const SCHEMES_DIRECTORY_META = {
  moduleNameEn: "Agriculture Government Schemes & Farmer Benefits",
  moduleNameBn: "কৃষি সরকারি প্রকল্প ও কৃষক সহায়তা কেন্দ্র",
  lastDirectoryReviewDate: "2026-03-15",
  maxVerifiedAgeDays: 365,
  coverageNoticeEn:
    "This directory lists verified official Government of India, Government of West Bengal, district-level (ATMA/KVK), and selected State portal agricultural schemes. We do not claim complete coverage of every state or district scheme in India — for additional state schemes, check the official MyScheme (myscheme.gov.in) and National Portal of India (india.gov.in) links.",
  coverageNoticeBn:
    "এই কেন্দ্রে ভারত সরকার, পশ্চিমবঙ্গ সরকার, জেলা-স্তরের (ATMA/KVK) এবং নির্বাচিত কয়েকটি রাজ্যের যাচাইকৃত সরকারি কৃষি প্রকল্পের তথ্য দেওয়া হয়েছে। ভারতের সব রাজ্য ও জেলার প্রতিটি প্রকল্প এখানে সম্পূর্ণভাবে অন্তর্ভুক্ত বলে দাবি করা হয় না — অতিরিক্ত রাজ্য প্রকল্পের জন্য অফিশিয়াল MyScheme (myscheme.gov.in) এবং india.gov.in পোর্টাল দেখুন।",
  disclaimerEn:
    "Guru Ji Vision is an educational & farmer information platform. We do NOT process government applications, collect fees, or guarantee eligibility, approval, or financial benefits. Final decisions rest solely with the concerned Government Department or Bank.",
  disclaimerBn:
    "গুরুজি ভিশন একটি কৃষি শিক্ষা ও তথ্য প্ল্যাটফর্ম। আমরা কোনো সরকারি আবেদন গ্রহণ করি না, টাকা নিই না এবং কোনো প্রকল্পের অনুমোদন বা আর্থিক সুবিধার গ্যারান্টি দিই না। চূড়ান্ত সিদ্ধান্ত সম্পূর্ণভাবে সংশ্লিষ্ট সরকারি দপ্তর বা ব্যাংকের অধীন।"
};

// ----------------------------------------------------------------------------
// ALL 23 REQUIRED AGRICULTURAL SCHEME CATEGORIES (Bilingual EN + BN)
// ----------------------------------------------------------------------------
export const SCHEME_CATEGORIES = [
  { key: "FINANCIAL_ASSISTANCE", en: "Farmer Financial Assistance", bn: "কৃষক আর্থিক সহায়তা" },
  { key: "CROP_INSURANCE", en: "Crop Insurance", bn: "ফসল বীমা" },
  { key: "AGRI_LOANS_CREDIT", en: "Agricultural Loans and Credit", bn: "কৃষি ঋণ ও ক্রেডিট" },
  { key: "KCC", en: "Kisan Credit Card", bn: "কিষাণ ক্রেডিট কার্ড (KCC)" },
  { key: "IRRIGATION_WATER", en: "Irrigation and Water Conservation", bn: "সেচ ও জল সংরক্ষণ" },
  { key: "SOIL_HEALTH", en: "Soil Health and Soil Testing", bn: "মাটির স্বাস্থ্য ও মাটি পরীক্ষা" },
  { key: "SEEDS_FERTILIZERS", en: "Seeds and Fertilizers", bn: "বীজ ও সার সহায়তা" },
  { key: "AGRI_MACHINERY", en: "Agricultural Machinery", bn: "কৃষি যন্ত্রপাতি ভর্তুকি" },
  { key: "ORGANIC_NATURAL", en: "Organic and Natural Farming", bn: "জৈব ও প্রাকৃতিক চাষ" },
  { key: "HORTICULTURE", en: "Horticulture", bn: "উদ্যানপালন (ফল ও সবজি)" },
  { key: "FLORICULTURE", en: "Floriculture", bn: "ফুল চাষ উন্নয়ন" },
  { key: "DAIRY_FARMING", en: "Dairy Farming", bn: "দুগ্ধ চাষ ও গোপালন" },
  { key: "POULTRY_FARMING", en: "Poultry Farming", bn: "হাঁস-মুরগি পালন (পোল্ট্রি)" },
  { key: "FISHERIES_AQUACULTURE", en: "Fisheries and Aquaculture", bn: "মৎস্য চাষ ও জলজ কৃষি" },
  { key: "LIVESTOCK_DEV", en: "Livestock Development", bn: "পশুপালন ও প্রাণিসম্পদ উন্নয়ন" },
  { key: "WOMEN_FARMER", en: "Women Farmer Support", bn: "মহিলা কৃষক সহায়তা" },
  { key: "FPO", en: "Farmer Producer Organizations", bn: "কৃষক উৎপাদক সংস্থা (FPO)" },
  { key: "AGRI_MARKETING", en: "Agricultural Marketing", bn: "কৃষি বাজার ও বিপণন" },
  { key: "STORAGE_COLD_CHAIN", en: "Storage and Cold Chain", bn: "গুদাম ও কোল্ড স্টোরেজ" },
  { key: "TRAINING_SKILL", en: "Agricultural Training and Skill Development", bn: "কৃষি প্রশিক্ষণ ও দক্ষতা বৃদ্ধি" },
  { key: "AGRI_ENTREPRENEURSHIP", en: "Agricultural Entrepreneurship", bn: "কৃষি উদ্যোক্তা উন্নয়ন" },
  { key: "RURAL_LIVELIHOOD", en: "Rural Livelihood and Allied Programmes", bn: "গ্রামীণ জীবিকা ও আনুষঙ্গিক কৃষি" },
  { key: "OTHER_AGRI", en: "Other Relevant Agricultural Schemes", bn: "অন্যান্য কৃষি প্রকল্প" }
];

export const SCHEME_CATEGORY_MAP = Object.fromEntries(SCHEME_CATEGORIES.map((c) => [c.key, c]));

// Quick Filter Definitions covering every requested filter chip
export const SCHEME_QUICK_FILTERS = [
  { key: "ALL", en: "All Schemes", bn: "সব প্রকল্প" },
  { key: "CENTRAL", en: "Central Govt", bn: "কেন্দ্রীয় সরকার" },
  { key: "STATE", en: "State & District", bn: "রাজ্য ও জেলা" },
  { key: "WOMEN_FARMER", en: "Women Farmers", bn: "মহিলা কৃষক" },
  { key: "FINANCIAL_ASSISTANCE", en: "Financial Assistance", bn: "আর্থিক সহায়তা" },
  { key: "CROP_INSURANCE", en: "Crop Insurance", bn: "ফসল বীমা" },
  { key: "AGRI_CREDIT", en: "Agri Credit & KCC", bn: "কৃষি ঋণ ও KCC" },
  { key: "IRRIGATION", en: "Irrigation", bn: "সেচ ও জল" },
  { key: "MACHINERY", en: "Machinery", bn: "কৃষি যন্ত্রপাতি" },
  { key: "HORTICULTURE", en: "Horticulture & Floriculture", bn: "উদ্যান ও ফুল চাষ" },
  { key: "FISHERIES", en: "Fisheries", bn: "মৎস্য চাষ" },
  { key: "DAIRY_LIVESTOCK", en: "Dairy & Livestock", bn: "দুগ্ধ, পোল্ট্রি ও পশুপালন" },
  { key: "TRAINING_ENTREPRENEURSHIP", en: "Training & Entrepreneurship", bn: "প্রশিক্ষণ ও উদ্যোক্তা" }
];

export const SCHEME_STATUSES = [
  { key: "ACTIVE", en: "Active", bn: "চালু আছে" },
  { key: "SEASONAL", en: "Seasonal / Window-Based", bn: "মরসুম ভিত্তিক চালু" },
  { key: "UNVERIFIED", en: "Unverified", bn: "যাচাই বাকি" },
  { key: "OUTDATED", en: "Outdated — Needs Review", bn: "পুরনো তথ্য — যাচাই প্রয়োজন" },
  { key: "CLOSED", en: "Closed / Suspended", bn: "বন্ধ আছে" }
];

// ----------------------------------------------------------------------------
// VERIFIED OFFICIAL AGRICULTURAL SCHEMES (ALL 23 CATEGORIES COVERED)
// Every entry carries all 19 required fields in both English & simple Bengali.
// ----------------------------------------------------------------------------
export const VERIFIED_AGRICULTURE_SCHEMES = [
  {
    id: "pm-kisan",
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    nameBn: "পিএম-কিষাণ সম্মান নিধি (PM-KISAN)",
    category: "FINANCIAL_ASSISTANCE",
    secondaryCategories: ["WOMEN_FARMER"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & Union Territories of India",
    applicableRegionBn: "ভারতের সকল রাজ্য ও কেন্দ্রশাসিত অঞ্চল",
    applicableDistricts: [],
    purpose: "To supplement the financial needs of landholding farmer families in procuring agricultural inputs for proper crop health and yields.",
    purposeBn: "জমির মালিক কৃষক পরিবারগুলোকে বীজ, সার ও চাষাবাদের প্রয়োজনীয় উপকরণ কেনার জন্য সরাসরি আর্থিক সহায়তা দেওয়া।",
    benefits: "₹6,000 per year per eligible farmer family in three equal installments of ₹2,000 every four months, transferred directly via DBT to Aadhaar-seeded bank accounts.",
    benefitsBn: "যোগ্য কৃষক পরিবারকে বছরে ₹৬,০০০ টাকা (প্রতি ৪ মাস অন্তর ₹২,০০০ করে তিনটি কিস্তিতে) সরাসরি আধার-সংযুক্ত ব্যাংক অ্যাকাউন্টে পাঠানো হয়।",
    eligibility: {
      eligibleCategories: "All landholding farmer families (husband, wife, and minor children) owning cultivable land as per state/UT land records.",
      eligibleCategoriesBn: "রাজ্যের ভূমি রেকর্ড অনুযায়ী চাষযোগ্য জমির মালিক সকল কৃষক পরিবার (স্বামী, স্ত্রী ও নাবালক সন্তান)।",
      landholding: "Cultivable land must be recorded in the farmer's name in State/UT land records (RoR / Khatian / Parcha).",
      landholdingBn: "চাষযোগ্য জমি অবশ্যই আবেদনকারীর নামে রাজ্যের জমির রেকর্ডে (পর্চা / খতিয়ান) নথিভুক্ত থাকতে হবে।",
      tenantFarmers: "Not eligible unless cultivable land ownership is recorded in the applicant's name.",
      tenantFarmersBn: "শুধুমাত্র ভাগচাষী বা ভাড়াটে কৃষকরা নিজস্ব জমির রেকর্ড ছাড়া যোগ্য নন।",
      womenFarmers: "Fully eligible if cultivable land is recorded in the woman farmer's name (subject to one benefit per farmer family).",
      womenFarmersBn: "মহিলা কৃষকের নামে চাষযোগ্য জমি থাকলে সম্পূর্ণ যোগ্য (প্রতি পরিবারে একজন সুবিধা পান)।",
      ageLimit: "Adult landholder (18 years and above).",
      ageLimitBn: "প্রাপ্তবয়স্ক জমির মালিক (১৮ বছর বা তার বেশি)।",
      incomeLimit: "Income tax payers in the last assessment year are excluded.",
      incomeLimitBn: "গত অর্থবর্ষে আয়কর (Income Tax) প্রদানকারীরা যোগ্য নন।",
      residency: "Resident of India with valid State/UT land record seeding.",
      residencyBn: "ভারতের স্থায়ী বাসিন্দা এবং সংশ্লিষ্ট রাজ্যে জমির রেকর্ড থাকতে হবে।"
    },
    whoCanApply: [
      "Small, marginal, and other landholding farmer families with cultivable land in their name",
      "Women farmers holding cultivable land records",
      "Farmers who complete Aadhaar e-KYC and bank Aadhaar seeding"
    ],
    whoCanApplyBn: [
      "নিজ নামে চাষযোগ্য জমির পর্চা/খতিয়ান থাকা ক্ষুদ্র, প্রান্তিক ও সাধারণ কৃষক পরিবার",
      "নিজ নামে জমির মালিক মহিলা কৃষক",
      "যাঁরা আধার e-KYC এবং ব্যাংকের সাথে আধার লিংক সম্পন্ন করেছেন"
    ],
    whoCannotApply: [
      "Institutional landholders",
      "Farmer families with any member who paid Income Tax in the last assessment year",
      "Serving or retired Central/State Government officers/employees (excluding Multi-Tasking Staff / Class IV / Group D) and pensioners drawing ₹10,000+ monthly pension",
      "Registered practicing doctors, engineers, lawyers, chartered accountants, and constitutional post holders"
    ],
    whoCannotApplyBn: [
      "প্রাতিষ্ঠানিক জমির মালিক",
      "পরিবারের কেউ গত অর্থবর্ষে আয়কর (Income Tax) দিয়ে থাকলে",
      "বর্তমান বা অবসরপ্রাপ্ত সরকারি অফিসার/কর্মচারী (গ্রুপ-ডি/এমটিএস বাদে) এবং মাসে ₹১০,০০০ বা বেশি পেনশনপ্রাপ্ত ব্যক্তি",
      "নিবন্ধিত ডাক্তার, ইঞ্জিনিয়ার, উকিল, চার্টার্ড অ্যাকাউন্ট্যান্ট এবং সাংবিধানিক পদাধিকারী"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card (e-KYC mandatory)", bn: "আধার কার্ড (e-KYC বাধ্যতামূলক)", mandatory: true },
      { en: "Land Ownership Record (RoR / Khatian / Parcha)", bn: "জমির মালিকানার নথি (পর্চা / খতিয়ান)", mandatory: true },
      { en: "Aadhaar-seeded Bank Account Passbook (DBT enabled)", bn: "আধার-সংযুক্ত ব্যাংকের পাসবই (DBT চালু থাকতে হবে)", mandatory: true },
      { en: "Active Mobile Number linked with Aadhaar", bn: "আধারের সাথে যুক্ত সচল মোবাইল নম্বর", mandatory: true }
    ],
    applicationProcess: "Visit pmkisan.gov.in → click 'New Farmer Registration' → enter Aadhaar & mobile OTP → fill land details and upload land record → complete Aadhaar e-KYC and wait for State/District nodal verification.",
    applicationProcessBn: "pmkisan.gov.in ওয়েবসাইটে যান → 'New Farmer Registration'-এ ক্লিক করুন → আধার ও মোবাইল OTP দিন → জমির তথ্য ও পর্চা আপলোড করুন → আধার e-KYC সম্পন্ন করে রাজ্য/ব্লক যাচাইয়ের জন্য অপেক্ষা করুন।",
    officialPortalUrl: "https://pmkisan.gov.in/",
    offlineProcess: "Visit your nearest Common Service Centre (CSC), Village Patwari/Revenue Officer, or Block Agriculture Office (ADA) with original Aadhaar, Bank Passbook, and Land Parcha for assisted registration and e-KYC.",
    offlineProcessBn: "আসল আধার কার্ড, ব্যাংকের পাসবই ও জমির পর্চা নিয়ে নিকটবর্তী তথ্যমিত্র কেন্দ্র (CSC) বা ব্লক কৃষি অফিসে (ADA) গিয়ে সরাসরি রেজিস্ট্রেশন ও e-KYC করান।",
    department: "Department of Agriculture & Farmers Welfare, Ministry of Agriculture & Farmers Welfare, Govt. of India",
    departmentBn: "কৃষি ও কৃষক কল্যাণ মন্ত্রক, ভারত সরকার",
    helpline: "155261 / 011-24300606 (PM-KISAN Helpline)",
    helplineBn: "১৫৫২৬১ / ০১১-২৪৩০০৬০৬ (পিএম-কিষাণ হেল্পলাইন)",
    helplineTel: "155261",
    deadline: "Open year-round for new registrations (installments released on 4-month government cycles)",
    deadlineBn: "সারা বছর নতুন আবেদন খোলা থাকে (প্রতি ৪ মাস অন্তর সরকারি কিস্তি দেওয়া হয়)",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://pmkisan.gov.in/",
    officialSourceName: "PM-KISAN Official Portal (Govt. of India)",
    published: true
  },
  {
    id: "krishak-bandhu-wb",
    name: "Krishak Bandhu (Natun) — Govt. of West Bengal",
    nameBn: "কৃষক বন্ধু (নতুন) — পশ্চিমবঙ্গ সরকার",
    category: "FINANCIAL_ASSISTANCE",
    secondaryCategories: ["WOMEN_FARMER"],
    womenFarmerEligible: true,
    govtLevel: "STATE",
    applicableState: "West Bengal",
    applicableRegion: "All 23 Districts of West Bengal",
    applicableRegionBn: "পশ্চিমবঙ্গের সকল ২৩টি জেলা",
    applicableDistricts: [],
    purpose: "To provide assured seasonal cultivation support for Kharif and Rabi crops along with social security death benefit to farmers in West Bengal.",
    purposeBn: "পশ্চিমবঙ্গের কৃষকদের খরিফ ও রবি চাষের জন্য নিশ্চিত আর্থিক সাহায্য এবং অকাল মৃত্যুতে পরিবারকে সামাজিক সুরক্ষা সহায়তা দেওয়া।",
    benefits: "Up to ₹10,000 per year (in two installments for Kharif & Rabi) for 1 acre or more cultivable land; proportionate assistance with minimum ₹4,000 per year for less than 1 acre. Plus ₹2,00,000 one-time death benefit for registered farmers aged 18–60.",
    benefitsBn: "১ একর বা তার বেশি চাষযোগ্য জমির জন্য বছরে ₹১০,০০০ টাকা (খরিফ ও রবি ২ কিস্তিতে); ১ একরের কম জমির জন্য আনুপাতিক হারে ন্যূনতম ₹৪,০০০ টাকা। এছাড়া ১৮–৬০ বছর বয়সী নথিভুক্ত কৃষকের মৃত্যুতে পরিবারকে এককালীন ₹২,০০,০০০ টাকা সহায়তা।",
    eligibility: {
      eligibleCategories: "Recorded raiyat landholders, Patta holders, Forest Patta holders, and recorded Bargadars (sharecroppers) in West Bengal.",
      eligibleCategoriesBn: "পশ্চিমবঙ্গের নথিভুক্ত জমির মালিক (রায়ত), পাট্টা প্রাপক, বন পাট্টা প্রাপক এবং নথিভুক্ত বর্গাদার।",
      landholding: "Valid West Bengal land record (RoR / Parcha / Patta / Bargadar record) in the applicant's name.",
      landholdingBn: "আবেদনকারীর নামে পশ্চিমবঙ্গের বৈধ জমির পর্চা, পাট্টা বা বর্গা রেকর্ড থাকতে হবে।",
      tenantFarmers: "Recorded Bargadars (sharecroppers) are officially eligible. Unrecorded oral tenants are not covered under land-record criteria.",
      tenantFarmersBn: "নথিভুক্ত বর্গাদাররা (ভাগচাষী) সরকারিভাবে যোগ্য। অনথিভুক্ত মৌখিক ভাড়াটে কৃষকরা যোগ্য নন।",
      womenFarmers: "Fully eligible if land RoR / Parcha / Patta or Bargadar record is in the woman's name.",
      womenFarmersBn: "মহিলার নামে জমির পর্চা, পাট্টা বা বর্গাদার নথি থাকলে সম্পূর্ণ যোগ্য।",
      ageLimit: "18 years and above (Death Benefit covers ages 18 to 60 years).",
      ageLimitBn: "১৮ বছর বা তার বেশি (মৃত্যুজনিত আর্থিক সহায়তার বয়সসীমা ১৮ থেকে ৬০ বছর)।",
      incomeLimit: "No separate income ceiling specified; governed by valid agricultural land/Bargadar record in West Bengal.",
      incomeLimitBn: "আলাদা আয়সীমা নির্ধারিত নেই; পশ্চিমবঙ্গের বৈধ কৃষি জমির রেকর্ডই মূল শর্ত।",
      residency: "Permanent resident / recorded cultivator of West Bengal.",
      residencyBn: "পশ্চিমবঙ্গের স্থায়ী বাসিন্দা ও নথিভুক্ত কৃষক।"
    },
    whoCanApply: [
      "Farmers with valid West Bengal RoR / Parcha / Khatian",
      "Recorded Bargadars (sharecroppers) and Patta / Forest Patta holders in West Bengal",
      "Women landholders and Bargadars in West Bengal"
    ],
    whoCanApplyBn: [
      "পশ্চিমবঙ্গের বৈধ জমির পর্চা বা খতিয়ানধারী কৃষক",
      "নথিভুক্ত বর্গাদার, পাট্টা ও বন-পাট্টা প্রাপক কৃষক",
      "জমির মালিক বা বর্গাদার মহিলা কৃষক"
    ],
    whoCannotApply: [
      "Persons without cultivable land record / Bargadar record in West Bengal",
      "Farmers residing outside West Bengal"
    ],
    whoCannotApplyBn: [
      "পশ্চিমবঙ্গে বৈধ চাষযোগ্য জমির পর্চা বা বর্গাদার নথি না থাকলে",
      "পশ্চিমবঙ্গের বাইরের রাজ্যের বাসিন্দা"
    ],
    requiredDocuments: [
      { en: "Voter ID Card (EPIC)", bn: "ভোটার কার্ড (EPIC)", mandatory: true },
      { en: "Aadhaar Card", bn: "আধার কার্ড", mandatory: true },
      { en: "Latest Land Record (RoR / Parcha / Patta / Bargadar Certificate)", bn: "সাম্প্রতিক জমির পর্চা / পাট্টা / বর্গাদার শংসাপত্র", mandatory: true },
      { en: "Aadhaar-linked Bank Account Passbook Copy", bn: "আধার-সংযুক্ত ব্যাংকের পাসবইয়ের কপি", mandatory: true },
      { en: "Passport-size Photograph & Active Mobile Number", bn: "পাসপোর্ট সাইজ ছবি ও সচল মোবাইল নম্বর", mandatory: true }
    ],
    applicationProcess: "Status check is available online at krishakbandhu.net ('নথিভুক্ত কৃষকের তথ্য' / Voter ID or Aadhaar search). New applications are submitted offline at Duare Sarkar camps or Block ADA offices.",
    applicationProcessBn: "নতুন আবেদন সরাসরি দুয়ারে সরকার ক্যাম্প বা ব্লক কৃষি দপ্তরে (ADA Office) জমা দিতে হয়। আবেদনের স্ট্যাটাস ও টাকার খবর krishakbandhu.net পোর্টালে ভোটার বা আধার নম্বর দিয়ে দেখা যায়।",
    officialPortalUrl: "https://krishakbandhu.net/",
    offlineProcess: "Collect the free Krishak Bandhu form at your nearest Duare Sarkar camp or Block Assistant Director of Agriculture (ADA) office, attach self-attested copies of required documents, and obtain an acknowledgement slip.",
    offlineProcessBn: "নিকটবর্তী দুয়ারে সরকার ক্যাম্প বা ব্লক কৃষি আধিকারিকের (ADA) অফিস থেকে বিনামূল্যে ফর্ম সংগ্রহ করে প্রয়োজনীয় কাগজের জেরক্সসহ জমা দিন এবং রশিদ নিন।",
    department: "Department of Agriculture, Government of West Bengal",
    departmentBn: "কৃষি দপ্তর, পশ্চিমবঙ্গ সরকার",
    helpline: "Contact Block ADA Office / WB Agriculture Portal (Matir Katha)",
    helplineBn: "ব্লক কৃষি অফিস (ADA) / মাটির কথা পোর্টালে যোগাযোগ করুন",
    helplineTel: "",
    deadline: "Open via Block ADA offices and periodic Duare Sarkar camps",
    deadlineBn: "ব্লক কৃষি অফিস ও দুয়ারে সরকার ক্যাম্প চলাকালীন আবেদন করা যায়",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://krishakbandhu.net/",
    officialSourceName: "Krishak Bandhu Official Portal (Govt. of West Bengal)",
    published: true
  },
  {
    id: "pmfby",
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    nameBn: "প্রধানমন্ত্রী ফসল বীমা যোজনা (PMFBY)",
    category: "CROP_INSURANCE",
    secondaryCategories: ["WOMEN_FARMER"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "Participating States",
    applicableRegion: "Participating States & UTs (Note: West Bengal runs Bangla Shasya Bima separately)",
    applicableRegionBn: "অংশগ্রহণকারী রাজ্যসমূহ (বিঃদ্রঃ পশ্চিমবঙ্গে আলাদা 'বাংলা শস্য বীমা' চালু আছে)",
    applicableDistricts: [],
    purpose: "To provide comprehensive financial protection to farmers against crop loss or damage arising from unforeseen natural calamities, pests, and diseases.",
    purposeBn: "খরা, বন্যা, শিলাবৃষ্টি, ঝড় বা রোগপোকার কারণে ফসলের ক্ষতি হলে কৃষকদের আর্থিক সুরক্ষা দেওয়া।",
    benefits: "Subsidized crop insurance with capped farmer premium (maximum 2% for Kharif crops, 1.5% for Rabi crops, and 5% for annual commercial/horticultural crops); remaining actuarial premium is subsidized by Central and State Governments.",
    benefitsBn: "খুবই কম প্রিমিয়ামে ফসল বীমা — খরিফ ফসলে সর্বোচ্চ ২%, রবি ফসলে ১.৫% এবং বাণিজ্যিক/উদ্যান ফসলে ৫% প্রিমিয়াম কৃষককে দিতে হয়; বাকি প্রিমিয়াম কেন্দ্র ও রাজ্য সরকার বহন করে।",
    eligibility: {
      eligibleCategories: "All farmers growing notified crops in notified areas of PMFBY-participating states/UTs.",
      eligibleCategoriesBn: "PMFBY-অংশগ্রহণকারী রাজ্যের বিজ্ঞাপিত এলাকায় নির্ধারিত ফসল চাষ করা সকল কৃষক।",
      landholding: "Both owner-cultivators and tenant/sharecropper farmers with valid land or lease/sowing proof.",
      landholdingBn: "নিজস্ব জমির মালিক এবং বৈধ লিজ/ভাগচাষের প্রমাণসহ কৃষক উভয়েই যোগ্য।",
      tenantFarmers: "Officially eligible with valid land lease agreement or state-recognized sharecropping / sowing certificate.",
      tenantFarmersBn: "বৈধ লিজ চুক্তি বা ভাগচাষ/বপনের শংসাপত্র থাকলে ভাগচাষীরা সরকারিভাবে যোগ্য।",
      womenFarmers: "Fully eligible on equal terms.",
      womenFarmersBn: "মহিলা কৃষকরা সমানভাবে যোগ্য।",
      ageLimit: "No upper age limit for cultivating farmers.",
      ageLimitBn: "কোনো নির্দিষ্ট বয়সের ঊর্ধ্বসীমা নেই।",
      incomeLimit: "No income ceiling.",
      incomeLimitBn: "কোনো আয়সীমা নেই।",
      residency: "Cultivating notified crops in a PMFBY-implementing State/UT.",
      residencyBn: "PMFBY চালু থাকা রাজ্যে নির্ধারিত ফসল চাষ করতে হবে।"
    },
    whoCanApply: [
      "Loanee (KCC) and Non-Loanee farmers growing notified crops in participating states",
      "Tenant farmers and sharecroppers holding valid lease/cultivation proof",
      "Women farmers cultivating notified crops"
    ],
    whoCanApplyBn: [
      "অংশগ্রহণকারী রাজ্যে নির্ধারিত ফসল চাষ করা ঋণগ্রহীতা (KCC) ও অ-ঋণগ্রহীতা কৃষক",
      "বৈধ লিজ বা চাষের প্রমাণপত্র থাকা ভাগচাষী ও ভাড়াটে কৃষক",
      "নির্ধারিত ফসল চাষ করা মহিলা কৃষক"
    ],
    whoCannotApply: [
      "Farmers cultivating non-notified crops or in states not implementing PMFBY (e.g., West Bengal farmers enroll under Bangla Shasya Bima instead)",
      "Applications submitted after the official seasonal cut-off date"
    ],
    whoCannotApplyBn: [
      "PMFBY চালু নেই এমন রাজ্যের কৃষক (যেমন পশ্চিমবঙ্গের কৃষকদের বাংলা শস্য বীমায় আবেদন করতে হয়)",
      "মরসুমের নির্ধারিত শেষ তারিখের পরে আবেদন করলে"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card", bn: "আধার কার্ড", mandatory: true },
      { en: "Bank Account Passbook / Cancelled Cheque", bn: "ব্যাংকের পাসবই বা ক্যানসেলড চেক", mandatory: true },
      { en: "Land Ownership Record (RoR / Khasra) OR Valid Lease Agreement", bn: "জমির পর্চা/খতিয়ান অথবা বৈধ লিজ চুক্তি", mandatory: true },
      { en: "Crop Sowing Certificate (as required by State)", bn: "ফসল বপনের শংসাপত্র (রাজ্যের নিয়ম অনুযায়ী)", mandatory: false, noteEn: "Required in notified areas for non-loanee verification", noteBn: "রাজ্যের নির্দেশ অনুযায়ী প্রযোজ্য ক্ষেত্রে" }
    ],
    applicationProcess: "Apply online on pmfby.gov.in ('Farmer Corner') or via the Crop Insurance Mobile App before the seasonal cut-off date. Upload land/sowing details and pay the subsidized farmer premium online.",
    applicationProcessBn: "মরসুমের শেষ তারিখের আগে pmfby.gov.in পোর্টালের 'Farmer Corner' বা Crop Insurance অ্যাপে গিয়ে জমির তথ্য দিয়ে অনলাইনে প্রিমিয়াম জমা দিন।",
    officialPortalUrl: "https://pmfby.gov.in/",
    offlineProcess: "Visit your nearest Common Service Centre (CSC), bank branch (for KCC holders), PACS, or authorized insurance intermediary before the Kharif/Rabi enrollment deadline.",
    offlineProcessBn: "খরিফ বা রবি মরসুমের শেষ তারিখের আগে নিকটবর্তী CSC কেন্দ্র, আপনার ব্যাংক শাখা, সমবায় সমিতি বা অনুমোদিত বীমা প্রতিনিধির কাছে নথিভুক্ত করুন।",
    department: "Department of Agriculture & Farmers Welfare, Govt. of India",
    departmentBn: "কৃষি ও কৃষক কল্যাণ দপ্তর, ভারত সরকার",
    helpline: "14447 (Krishi Rakshak Portal & Helpline)",
    helplineBn: "১৪৪৪৭ (কৃষি রক্ষক ফসল বীমা হেল্পলাইন)",
    helplineTel: "14447",
    deadline: "Seasonal Kharif & Rabi cut-off dates notified by each State Government on pmfby.gov.in",
    deadlineBn: "প্রতিটি রাজ্যের খরিফ ও রবি মরসুমের নির্ধারিত শেষ তারিখ pmfby.gov.in-এ প্রকাশিত হয়",
    status: "SEASONAL",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://pmfby.gov.in/",
    officialSourceName: "PMFBY Official Portal (Govt. of India)",
    published: true
  },
  {
    id: "bangla-shasya-bima",
    name: "Bangla Shasya Bima (BSB) — Govt. of West Bengal",
    nameBn: "বাংলা শস্য বীমা (BSB) — পশ্চিমবঙ্গ সরকার",
    category: "CROP_INSURANCE",
    secondaryCategories: ["WOMEN_FARMER"],
    womenFarmerEligible: true,
    govtLevel: "STATE",
    applicableState: "West Bengal",
    applicableRegion: "All Notified Blocks & Gram Panchayats of West Bengal",
    applicableRegionBn: "পশ্চিমবঙ্গের সকল বিজ্ঞাপিত ব্লক ও গ্রাম পঞ্চায়েত",
    applicableDistricts: [],
    purpose: "To protect West Bengal farmers from financial distress due to crop loss caused by natural calamities such as floods, droughts, cyclones, or localized disasters.",
    purposeBn: "বন্যা, খরা, ঘূর্ণিঝড় বা প্রাকৃতিক দুর্যোগে ফসলের ক্ষতি হলে পশ্চিমবঙ্গের কৃষকদের বীমা ক্ষতিপূরণ দেওয়া।",
    benefits: "The Government of West Bengal pays 100% of the farmer's crop insurance premium for notified foodgrain and oilseed crops (zero premium cost to farmer for notified food crops); subsidized terms apply for notified commercial crops like potato/sugarcane.",
    benefitsBn: "নির্ধারিত খাদ্যশস্য ও তৈলবীজ ফসলের সম্পূর্ণ বীমা প্রিমিয়াম পশ্চিমবঙ্গ সরকার বহন করে — কৃষককে কোনো টাকা দিতে হয় না (আলু ও আখের মতো বাণিজ্যিক ফসলে সরকারি ভর্তুকিযুক্ত প্রিমিয়াম)।",
    eligibility: {
      eligibleCategories: "All farmers cultivating notified Kharif or Rabi crops in notified Gram Panchayats/Blocks of West Bengal.",
      eligibleCategoriesBn: "পশ্চিমবঙ্গের বিজ্ঞাপিত গ্রাম পঞ্চায়েত/ব্লকে নির্ধারিত খরিফ বা রবি ফসল চাষ করা সকল কৃষক।",
      landholding: "Owner-cultivators, Bargadars, and tenant farmers with verified sowing declaration.",
      landholdingBn: "জমির মালিক, বর্গাদার এবং বপন যাচাইকৃত ভাগচাষী কৃষক।",
      tenantFarmers: "Officially eligible with sowing declaration certified by local agricultural officials / authorized signatories.",
      tenantFarmersBn: "স্থানীয় কৃষি দপ্তর বা অনুমোদিত আধিকারিকের স্বাক্ষরিত চাষের ঘোষণাপত্র থাকলে ভাগচাষীরা সম্পূর্ণ যোগ্য।",
      womenFarmers: "Fully eligible.",
      womenFarmersBn: "মহিলা কৃষকরা সম্পূর্ণ যোগ্য।",
      ageLimit: "Adult cultivating farmers (18+).",
      ageLimitBn: "প্রাপ্তবয়স্ক কৃষক (১৮ বছর বা তার বেশি)।",
      incomeLimit: "No income ceiling.",
      incomeLimitBn: "কোনো আয়সীমা নেই।",
      residency: "Cultivating notified crops in West Bengal.",
      residencyBn: "পশ্চিমবঙ্গে নির্ধারিত ফসল চাষ করতে হবে।"
    },
    whoCanApply: [
      "All West Bengal farmers cultivating notified crops (Paddy, Maize, Mustard, Wheat, Potato, Pulses, etc.)",
      "Recorded Bargadars and verified sharecroppers/tenant cultivators",
      "Women farmers in West Bengal"
    ],
    whoCanApplyBn: [
      "পশ্চিমবঙ্গে ধান, ভুট্টা, সরিষা, গম, আলু, ডাল ইত্যাদি নির্ধারিত ফসল চাষ করা সকল কৃষক",
      "নথিভুক্ত বর্গাদার ও যাচাইকৃত ভাগচাষী কৃষক",
      "পশ্চিমবঙ্গের মহিলা কৃষক"
    ],
    whoCannotApply: [
      "Farmers outside West Bengal",
      "Farmers applying after the seasonal enrollment cut-off date"
    ],
    whoCannotApplyBn: [
      "পশ্চিমবঙ্গের বাইরের কৃষক",
      "মরসুমের নথিভুক্তিকরণের শেষ তারিখের পরে আবেদন করলে"
    ],
    requiredDocuments: [
      { en: "Voter ID Card & Aadhaar Card", bn: "ভোটার কার্ড ও আধার কার্ড", mandatory: true },
      { en: "Bank Passbook First Page Copy", bn: "ব্যাংকের পাসবইয়ের প্রথম পাতার কপি", mandatory: true },
      { en: "Land Record (Parcha / Khatian) OR Bargadar / Cultivation Certificate", bn: "জমির পর্চা / খতিয়ান অথবা বর্গাদার / চাষের শংসাপত্র", mandatory: true },
      { en: "Crop Sowing Declaration certified by authorized official", bn: "অনুমোদিত আধিকারিকের স্বাক্ষরিত ফসল রোপণের ঘোষণাপত্র", mandatory: true }
    ],
    applicationProcess: "Check seasonal notifications, policy details, and claim status online at banglashasyabima.net. Enrollment is completed through Block ADA offices, Duare Sarkar camps, or authorized insurance camps.",
    applicationProcessBn: "banglashasyabima.net পোর্টালে ভোটার কার্ড দিয়ে বীমার তথ্য ও স্ট্যাটাস দেখা যায়। নাম নথিভুক্তি ব্লক কৃষি দপ্তর (ADA) ও দুয়ারে সরকার ক্যাম্পে সম্পূর্ণ বিনামূল্যে করা হয়।",
    officialPortalUrl: "https://banglashasyabima.net/",
    offlineProcess: "Submit the free Bangla Shasya Bima enrollment form with required documents at your Block Agriculture Office (ADA), Gram Panchayat camp, Duare Sarkar camp, or authorized insurance representative before the cut-off date.",
    offlineProcessBn: "শেষ তারিখের আগে ব্লক কৃষি অফিস (ADA), গ্রাম পঞ্চায়েত বা দুয়ারে সরকার ক্যাম্পে বিনামূল্যে বাংলা শস্য বীমার ফর্ম ও নথি জমা দিন।",
    department: "Department of Agriculture, Government of West Bengal",
    departmentBn: "কৃষি দপ্তর, পশ্চিমবঙ্গ সরকার",
    helpline: "Contact Block ADA Office / Official BSB Portal",
    helplineBn: "ব্লক কৃষি অফিস (ADA) বা বাংলা শস্য বীমা পোর্টালে যোগাযোগ করুন",
    helplineTel: "",
    deadline: "Seasonal Kharif & Rabi enrollment cut-off dates announced by WB Dept. of Agriculture",
    deadlineBn: "প্রতি খরিফ ও রবি মরসুমে পশ্চিমবঙ্গ কৃষি দপ্তর থেকে শেষ তারিখ ঘোষণা করা হয়",
    status: "SEASONAL",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://banglashasyabima.net/",
    officialSourceName: "Bangla Shasya Bima Official Portal (Govt. of West Bengal)",
    published: true
  },
  {
    id: "kcc-miss",
    name: "Kisan Credit Card (KCC) & Modified Interest Subvention Scheme",
    nameBn: "কিষাণ ক্রেডিট কার্ড (KCC) ও স্বল্প সুদে কৃষি ঋণ",
    category: "KCC",
    secondaryCategories: ["AGRI_LOANS_CREDIT", "DAIRY_FARMING", "FISHERIES_AQUACULTURE", "WOMEN_FARMER"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & UTs through Commercial Banks, RRBs & Cooperative Banks",
    applicableRegionBn: "ভারতের সকল রাজ্যের সরকারি ব্যাংক, গ্রামীণ ব্যাংক ও সমবায় ব্যাংক",
    applicableDistricts: [],
    purpose: "To provide timely, affordable institutional credit to farmers for crop production, post-harvest needs, and working capital for animal husbandry and fisheries.",
    purposeBn: "চাষাবাদের খরচ, ফসল তোলার পরবর্তী ব্যয় এবং পশুপালন ও মৎস্য চাষের জন্য সরকারি ব্যাংক থেকে সহজ শর্তে ও কম সুদে ঋণ দেওয়া।",
    benefits: "Short-term agricultural credit limit up to ₹3 lakh at subsidized interest rate under RBI/GoI Modified Interest Subvention Scheme (effective rate can be as low as 4% per annum for prompt repayment as notified by GoI/RBI). Also extended to Animal Husbandry & Fisheries farmers (separate sub-limit norms apply).",
    benefitsBn: "সরকারি নিয়ম অনুযায়ী ₹৩ লক্ষ টাকা পর্যন্ত স্বল্পমেয়াদী কৃষি ঋণে সরকারি সুদ ভর্তুকি (সময়মতো ঋণ শোধ করলে কার্যকর সুদের হার বছরে ৪% পর্যন্ত কমে আসে)। পশুপালন ও মৎস্য চাষীরাও KCC সুবিধা পান।",
    eligibility: {
      eligibleCategories: "Owner-cultivators, tenant farmers, oral lessees, sharecroppers, SHGs/JLGs of farmers, plus Animal Husbandry & Fisheries farmers.",
      eligibleCategoriesBn: "নিজস্ব জমির কৃষক, বর্গাদার, ভাগচাষী, লিজ কৃষক, স্বনির্ভর গোষ্ঠী (SHG/JLG), পশুপালন ও মৎস্য চাষী।",
      landholding: "Land ownership OR valid tenancy/sharecropping proof OR active dairy/poultry/fisheries unit.",
      landholdingBn: "জমির পর্চা অথবা ভাগচাষ/লিজের প্রমাণ অথবা চালু দুগ্ধ/মৎস্য/পোল্ট্রি খামার।",
      tenantFarmers: "Officially eligible as per RBI KCC Master Directions (subject to bank KYC and local cultivation verification / JLG norms).",
      tenantFarmersBn: "রিজার্ভ ব্যাংকের KCC নির্দেশিকা অনুযায়ী ভাগচাষী ও লিজ কৃষকরা যোগ্য (ব্যাংকের যাচাইকরণ সাপেক্ষে)।",
      womenFarmers: "Fully eligible individually or through Women Self-Help Groups (SHGs) / Joint Liability Groups (JLGs).",
      womenFarmersBn: "মহিলা কৃষকরা ব্যক্তিগতভাবে বা স্বনির্ভর গোষ্ঠীর (SHG/JLG) মাধ্যমে সম্পূর্ণ যোগ্য।",
      ageLimit: "18 to 75 years (co-borrower usually required by banks for senior applicants above 60).",
      ageLimitBn: "১৮ থেকে ৭৫ বছর (৬০ বছরের বেশি বয়সে ব্যাংকের নিয়মে সহ-আবেদনকারী লাগতে পারে)।",
      incomeLimit: "No fixed income limit; sanctioned based on Scale of Finance and bank appraisal.",
      incomeLimitBn: "কোনো নির্দিষ্ট আয়সীমা নেই; ফসলের খরচ ও ব্যাংকের মূল্যায়ন অনুযায়ী ঋণের সীমা ঠিক হয়।",
      residency: "Resident of India within the service area of the lending bank branch.",
      residencyBn: "ঋণদানকারী ব্যাংক শাখার পরিষেবা এলাকার স্থায়ী বাসিন্দা।"
    },
    whoCanApply: [
      "Individual and joint owner-cultivator farmers",
      "Tenant farmers, oral lessees, sharecroppers & Joint Liability Groups (JLGs)",
      "Dairy, poultry, livestock, and fisheries farmers"
    ],
    whoCanApplyBn: [
      "একক বা যৌথ জমির মালিক কৃষক",
      "ভাগচাষী, বর্গাদার, লিজ কৃষক ও যৌথ দায়বদ্ধতা গোষ্ঠী (JLG)",
      "দুগ্ধ, পোল্ট্রি, পশুপালন ও মৎস্য চাষী"
    ],
    whoCannotApply: [
      "Willful bank loan defaulters as per bank credit appraisal norms",
      "Applicants unable to complete mandatory KYC verification"
    ],
    whoCannotApplyBn: [
      "ইচ্ছাকৃত ব্যাংক ঋণখেলাপি (ব্যাংকের নিয়ম অনুযায়ী)",
      "বাধ্যতামূলক KYC যাচাই সম্পূর্ণ না করলে"
    ],
    requiredDocuments: [
      { en: "Filled KCC Application Form (Bank / PM-KISAN KCC form)", bn: "পূরণ করা KCC আবেদনপত্র", mandatory: true },
      { en: "Identity & Address Proof (Aadhaar Card / Voter ID)", bn: "পরিচয়পত্র ও ঠিকানার প্রমাণ (আধার / ভোটার কার্ড)", mandatory: true },
      { en: "Land Ownership Record OR Lease / Sharecropping / Allied Activity Proof", bn: "জমির পর্চা অথবা ভাগচাষ / পশুপালন / মৎস্য চাষের প্রমাণ", mandatory: true },
      { en: "Passport-size Photographs & Bank Passbook", bn: "পাসপোর্ট সাইজ ছবি ও ব্যাংকের পাসবই", mandatory: true }
    ],
    applicationProcess: "Apply online via the official JanSamarth portal (jansamarth.in) under Agricultural Infrastructure / KCC credit schemes or via your bank's official website.",
    applicationProcessBn: "অফিশিয়াল জনসমর্থ পোর্টালে (jansamarth.in) অথবা আপনার সরকারি/সমবায় ব্যাংকের ওয়েবসাইট বা CSC কেন্দ্রের মাধ্যমে অনলাইনে আবেদন করুন।",
    officialPortalUrl: "https://www.jansamarth.in/",
    offlineProcess: "Visit your nearest Commercial Bank, Regional Rural Bank (RRB), or Cooperative Bank branch with KYC, land/cultivation proof, and photographs to submit the simplified KCC form.",
    offlineProcessBn: "আধার, ভোটার, ছবি ও জমির/চাষের প্রমাণপত্র নিয়ে নিকটবর্তী সরকারি ব্যাংক, গ্রামীণ ব্যাংক বা সমবায় ব্যাংকে গিয়ে সহজ KCC ফর্ম জমা দিন।",
    department: "Department of Agriculture & Farmers Welfare / Dept. of Financial Services / RBI & NABARD",
    departmentBn: "কৃষি মন্ত্রক, অর্থ মন্ত্রক, আরবিআই (RBI) ও নাবার্ড (NABARD)",
    helpline: "1800-180-1551 (Kisan Call Centre) / Local Bank Branch",
    helplineBn: "১৮০০-১৮০-১৫৫১ (কিষাণ কল সেন্টার) / স্থানীয় ব্যাংক শাখা",
    helplineTel: "18001801551",
    deadline: "Open year-round across participating banks",
    deadlineBn: "সারা বছর ব্যাংকের মাধ্যমে আবেদন করা যায়",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://www.jansamarth.in/",
    officialSourceName: "JanSamarth National Credit Portal & RBI/NABARD Guidelines",
    published: true
  },
  {
    id: "aif-credit-storage",
    name: "Agriculture Infrastructure Fund (AIF)",
    nameBn: "কৃষি পরিকাঠামো তহবিল (AIF — গুদাম ও কৃষি ঋণ ভর্তুকি)",
    category: "AGRI_LOANS_CREDIT",
    secondaryCategories: ["STORAGE_COLD_CHAIN", "FPO", "AGRI_ENTREPRENEURSHIP"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & Union Territories of India",
    applicableRegionBn: "ভারতের সকল রাজ্য ও কেন্দ্রশাসিত অঞ্চল",
    applicableDistricts: [],
    purpose: "To mobilize medium-to-long-term debt financing for viable post-harvest management infrastructure and community farming assets.",
    purposeBn: "ফসল তোলার পর সংরক্ষণের গুদাম, কোল্ড স্টোরেজ, গ্রেডিং ইউনিট, প্রাথমিক প্রক্রিয়াকরণ এবং যৌথ কৃষি পরিকাঠামো তৈরির জন্য ভর্তুকিযুক্ত দীর্ঘমেয়াদী ঋণ দেওয়া।",
    benefits: "3% per annum interest subvention on loans up to ₹2 crore for up to 7 years, plus Credit Guarantee coverage under CGTMSE for loans up to ₹2 crore (can be converged with other Central/State subsidies).",
    benefitsBn: "₹২ কোটি টাকা পর্যন্ত প্রকল্প ঋণে সর্বোচ্চ ৭ বছরের জন্য বছরে ৩% সুদ ভর্তুকি এবং CGTMSE-এর মাধ্যমে ঋণের গ্যারান্টি সুরক্ষা।",
    eligibility: {
      eligibleCategories: "Farmers, FPOs, PACS, Marketing Cooperatives, SHGs, Joint Liability Groups, Agri-entrepreneurs, Startups, and State Agencies.",
      eligibleCategoriesBn: "কৃষক, এফপিও (FPO), সমবায় সমিতি (PACS), স্বনির্ভর গোষ্ঠী (SHG), কৃষি উদ্যোক্তা ও স্টার্টআপ।",
      landholding: "Owned land or valid registered lease agreement for the proposed project site.",
      landholdingBn: "প্রকল্পের জন্য নিজস্ব জমি অথবা বৈধ রেজিস্টার্ড লিজ চুক্তি থাকতে হবে।",
      tenantFarmers: "Eligible with valid registered lease agreement for the infrastructure site or via FPO/SHG.",
      tenantFarmersBn: "প্রকল্পের জায়গার বৈধ রেজিস্টার্ড লিজ থাকলে অথবা FPO/SHG-র মাধ্যমে যোগ্য।",
      womenFarmers: "Fully eligible individually or through Women SHGs/FPOs.",
      womenFarmersBn: "মহিলা কৃষক ও মহিলা স্বনির্ভর গোষ্ঠী সম্পূর্ণ যোগ্য।",
      ageLimit: "18 years and above for individual applicants.",
      ageLimitBn: "ব্যক্তিগত আবেদনকারীর বয়স ১৮ বছর বা তার বেশি।",
      incomeLimit: "No income limit; project financial viability is assessed by the lending bank.",
      incomeLimitBn: "নির্দিষ্ট আয়সীমা নেই; ব্যাংক প্রকল্পের বাণিজ্যিক গ্রহণযোগ্যতা যাচাই করে।",
      residency: "Project located in India.",
      residencyBn: "প্রকল্পটি ভারতের মধ্যে অবস্থিত হতে হবে।"
    },
    whoCanApply: [
      "Individual farmers setting up warehouses, grading/sorting units, cold rooms, or primary processing units",
      "FPOs, PACS, Self-Help Groups (SHGs), and Joint Liability Groups",
      "Agri-entrepreneurs and rural startups"
    ],
    whoCanApplyBn: [
      "গুদাম, কোল্ড রুম, সর্টিং/গ্রেডিং বা প্রাথমিক প্রক্রিয়াকরণ ইউনিট গড়তে ইচ্ছুক কৃষক",
      "কৃষক উৎপাদক সংস্থা (FPO), সমবায় সমিতি (PACS) ও স্বনির্ভর গোষ্ঠী (SHG)",
      "কৃষি উদ্যোক্তা ও গ্রামীণ স্টার্টআপ"
    ],
    whoCannotApply: [
      "Non-agricultural commercial real estate projects",
      "Loan defaulters ineligible under bank lending rules"
    ],
    whoCannotApplyBn: [
      "অ-কৃষি বাণিজ্যিক প্রকল্প",
      "ব্যাংকের নিয়ম অনুযায়ী ঋণখেলাপি আবেদনকারী"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card & PAN Card", bn: "আধার কার্ড ও প্যান কার্ড", mandatory: true },
      { en: "Detailed Project Report (DPR) for the proposed agri-infrastructure", bn: "প্রকল্পের বিস্তারিত রিপোর্ট (DPR)", mandatory: true },
      { en: "Land Ownership Record OR Registered Lease Agreement", bn: "জমির দলিল/পর্চা অথবা রেজিস্টার্ড লিজ চুক্তি", mandatory: true },
      { en: "Bank Account Statement & KYC Documents", bn: "ব্যাংক স্টেটমেন্ট ও KYC নথি", mandatory: true },
      { en: "FPO / SHG / Cooperative Registration Certificate (if applying as a group)", bn: "FPO / SHG / সমবায়ের রেজিস্ট্রেশন সার্টিফিকেট (প্রযোজ্য ক্ষেত্রে)", mandatory: false }
    ],
    applicationProcess: "Register on agriinfra.dac.gov.in → submit project details & DPR → application is verified and routed to your chosen lending bank for loan appraisal and sanction.",
    applicationProcessBn: "agriinfra.dac.gov.in পোর্টালে রেজিস্ট্রেশন করুন → প্রকল্পের তথ্য ও DPR আপলোড করুন → যাচাইয়ের পর আপনার নির্বাচিত ব্যাংক ঋণ অনুমোদন প্রক্রিয়া সম্পন্ন করবে।",
    officialPortalUrl: "https://agriinfra.dac.gov.in/",
    offlineProcess: "Consult your nearest Bank Agricultural Officer, NABARD District Development Manager (DDM), or Block ADA office for DPR preparation guidance before online submission.",
    offlineProcessBn: "অনলাইনে জমা দেওয়ার আগে প্রজেক্ট রিপোর্ট (DPR) তৈরির সহায়তার জন্য নিকটবর্তী ব্যাংকের কৃষি অফিসার, নাবার্ড (DDM) বা ব্লক কৃষি অফিসে যোগাযোগ করুন।",
    department: "Department of Agriculture & Farmers Welfare, Govt. of India",
    departmentBn: "কৃষি ও কৃষক কল্যাণ দপ্তর, ভারত সরকার",
    helpline: "1800-180-1551 / AIF Portal Helpdesk",
    helplineBn: "১৮০০-১৮০-১৫৫১ / AIF পোর্টাল হেল্পডেস্ক",
    helplineTel: "18001801551",
    deadline: "Operational through FY 2032-33 as per official AIF portal guidelines",
    deadlineBn: "অফিশিয়াল AIF পোর্টাল অনুযায়ী প্রকল্পটি চালু আছে",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://agriinfra.dac.gov.in/",
    officialSourceName: "Agriculture Infrastructure Fund Official Portal (DA&FW)",
    published: true
  },
  {
    id: "pmksy-pdmc",
    name: "PMKSY — Per Drop More Crop (Micro Irrigation Scheme)",
    nameBn: "প্রধানমন্ত্রী কৃষি সিঞ্চাই যোজনা — ড্রিপ ও স্প্রিংকলার সেচ ভর্তুকি",
    category: "IRRIGATION_WATER",
    secondaryCategories: ["HORTICULTURE", "WOMEN_FARMER"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & UTs (Implemented via State Agriculture / Horticulture Departments)",
    applicableRegionBn: "ভারতের সকল রাজ্য (রাজ্য কৃষি ও উদ্যানপালন দপ্তরের মাধ্যমে রূপায়িত)",
    applicableDistricts: [],
    purpose: "To enhance water use efficiency at the farm level through micro-irrigation technologies like Drip and Sprinkler irrigation systems.",
    purposeBn: "ড্রিপ (বিন্দু সেচ) ও স্প্রিংকলার সেচ ব্যবস্থার মাধ্যমে কম জলে বেশি ফসল উৎপাদন ও সেচের খরচ কমানো।",
    benefits: "Financial assistance / subsidy (55% for Small & Marginal farmers and 45% for Other farmers as per central guidelines; some states offer additional top-up subsidy) for installing Drip and Sprinkler micro-irrigation systems up to 5 hectares per beneficiary.",
    benefitsBn: "ক্ষুদ্র ও প্রান্তিক কৃষকদের জন্য ৫৫% এবং অন্যান্য কৃষকদের জন্য ৪৫% পর্যন্ত কেন্দ্রীয় ভর্তুকি (কিছু রাজ্য অতিরিক্ত ভর্তুকি দেয়) — সর্বোচ্চ ৫ হেক্টর জমিতে ড্রিপ ও স্প্রিংকলার সেচ বসানোর জন্য।",
    eligibility: {
      eligibleCategories: "All cultivating farmers across India with an assured water source on their farmland.",
      eligibleCategoriesBn: "জমিতে সেচের জলের উৎস থাকা ভারতের সকল কৃষক।",
      landholding: "Owned land or valid long-term lease agreement (as accepted by the respective State nodal agency).",
      landholdingBn: "নিজস্ব জমি বা রাজ্যের নিয়ম অনুযায়ী বৈধ দীর্ঘমেয়াদী লিজ চুক্তি।",
      tenantFarmers: "Eligible where permitted by State implementing guidelines with valid lease documentation.",
      tenantFarmersBn: "রাজ্যের নির্দেশিকা অনুযায়ী বৈধ লিজ চুক্তি থাকলে প্রযোজ্য।",
      womenFarmers: "Fully eligible; priority/targeted allocation for Women, SC & ST farmers under scheme guidelines.",
      womenFarmersBn: "মহিলা, তফসিলি জাতি ও উপজাতি কৃষকদের অগ্রাধিকার দেওয়া হয়।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "No separate income ceiling.",
      incomeLimitBn: "আলাদা আয়সীমা নেই।",
      residency: "Resident farmer of the implementing State/UT.",
      residencyBn: "সংশ্লিষ্ট রাজ্যের কৃষক।"
    },
    whoCanApply: [
      "Small, marginal, and other farmers with a farm water source (well, borewell, pond, canal)",
      "Horticulture, vegetable, sugarcane, and field-crop growers adopting drip/sprinkler irrigation",
      "Women farmers and SC/ST farmers"
    ],
    whoCanApplyBn: [
      "জমিতে পুকুর, নলকূপ বা জলের উৎস থাকা ক্ষুদ্র, প্রান্তিক ও সাধারণ কৃষক",
      "ফল, সবজি, ফুল বা মাঠ ফসলে ড্রিপ ও স্প্রিংকলার সেচ বসাতে ইচ্ছুক কৃষক",
      "মহিলা ও তফসিলি জাতি/উপজাতি কৃষক"
    ],
    whoCannotApply: [
      "Plots that have already availed micro-irrigation subsidy within the state's lock-in period",
      "Land without any feasible water source"
    ],
    whoCannotApplyBn: [
      "নির্দিষ্ট সময়সীমার মধ্যে আগে একই জমিতে সেচ ভর্তুকি নেওয়া থাকলে",
      "জমিতে জলের কোনো উৎস না থাকলে"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card", bn: "আধার কার্ড", mandatory: true },
      { en: "Land Ownership Record (Parcha / RoR) or accepted Lease Document", bn: "জমির পর্চা / খতিয়ান বা বৈধ লিজ নথি", mandatory: true },
      { en: "Bank Account Passbook (Aadhaar linked)", bn: "আধার-সংযুক্ত ব্যাংকের পাসবই", mandatory: true },
      { en: "Caste Certificate (if applying under SC/ST category)", bn: "জাতিগত শংসাপত্র (SC/ST হলে প্রযোজ্য)", mandatory: false },
      { en: "Quotation / Site Plan from State-empanelled Micro-Irrigation Supplier", bn: "অনুমোদিত ড্রিপ/স্প্রিংকলার সংস্থার কোটেশন ও নকশা", mandatory: true }
    ],
    applicationProcess: "Apply through your State Agriculture/Horticulture DBT portal (e.g., Matir Katha / Bangla Krishi Sech Yojana in West Bengal) or view national guidelines on pmksy.gov.in.",
    applicationProcessBn: "রাজ্যের কৃষি বা উদ্যানপালন দপ্তরের পোর্টালের (পশ্চিমবঙ্গে বাংলা কৃষি সেচ যোজনা / মাটির কথা) মাধ্যমে অথবা pmksy.gov.in-এ বিস্তারিত নির্দেশিকা দেখে আবেদন করুন।",
    officialPortalUrl: "https://pmksy.gov.in/",
    offlineProcess: "Visit your Block Agriculture Office (ADA) or District Horticulture Officer to get the list of empanelled micro-irrigation vendors and submit your application.",
    offlineProcessBn: "ব্লক কৃষি অফিস (ADA) বা জেলা উদ্যানপালন অফিসে গিয়ে অনুমোদিত সংস্থার তালিকা নিন এবং আবেদনপত্র জমা দিন।",
    department: "Department of Agriculture & Farmers Welfare, Govt. of India (with State Agriculture Depts.)",
    departmentBn: "কৃষি ও কৃষক কল্যাণ দপ্তর, ভারত সরকার ও রাজ্য কৃষি দপ্তর",
    helpline: "1800-180-1551 (Kisan Call Centre)",
    helplineBn: "১৮০০-১৮০-১৫৫১ (কিষাণ কল সেন্টার)",
    helplineTel: "18001801551",
    deadline: "State-wise annual target windows; check your State Agriculture/Horticulture portal",
    deadlineBn: "প্রতি বছর রাজ্যের নির্ধারিত লক্ষ্যমাত্রা অনুযায়ী আবেদন নেওয়া হয়",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://pmksy.gov.in/",
    officialSourceName: "PMKSY Official Portal (Govt. of India)",
    published: true
  },
  {
    id: "pm-kusum-solar",
    name: "PM-KUSUM (Solar Agriculture Pumps & Feeder Solarization)",
    nameBn: "পিএম-কুসুম (PM-KUSUM — সৌরশক্তি চালিত কৃষি সেচ পাম্প)",
    category: "IRRIGATION_WATER",
    secondaryCategories: ["OTHER_AGRI", "AGRI_MACHINERY"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "Participating States & UTs via State Renewable Energy / Agriculture Agencies",
    applicableRegionBn: "অংশগ্রহণকারী রাজ্যগুলোর সৌরশক্তি ও কৃষি দপ্তরের মাধ্যমে",
    applicableDistricts: [],
    purpose: "To provide energy security to farmers and reduce diesel/electricity irrigation costs by installing standalone solar agriculture pumps and solarizing existing grid pumps.",
    purposeBn: "ডিজেল ও বিদ্যুতের সেচ খরচ কমাতে কৃষকদের জন্য সৌরশক্তি চালিত সেচ পাম্প বসানো ও গ্রিড পাম্প সোলারাইজ করা।",
    benefits: "Central Financial Assistance (CFA) of 30% (up to 50% in North-Eastern, Hilly States & Island UTs) plus State subsidy (typically 30% or more) for installing standalone solar water pumps (Component B) or solarizing grid pumps (Component C).",
    benefitsBn: "সৌর সেচ পাম্প বসানোর জন্য কেন্দ্র সরকারের ৩০% ভর্তুকি (পাহাড়ি ও উত্তর-পূর্ব রাজ্যে ৫০% পর্যন্ত) এবং রাজ্য সরকারের অতিরিক্ত ভর্তুকি (সাধারণত ৩০% বা তার বেশি)।",
    eligibility: {
      eligibleCategories: "Individual farmers, groups of farmers, cooperatives, panchayats, FPOs, and Water User Associations (WUAs).",
      eligibleCategoriesBn: "ব্যক্তিগত কৃষক, কৃষক গোষ্ঠী, সমবায় সমিতি, FPO ও জল ব্যবহারকারী সমিতি।",
      landholding: "Valid agricultural land record with water source.",
      landholdingBn: "জলের উৎসসহ বৈধ চাষযোগ্য জমির রেকর্ড থাকতে হবে।",
      tenantFarmers: "Subject to State Nodal Agency rules.",
      tenantFarmersBn: "রাজ্য নোডাল এজেন্সির নিয়ম অনুযায়ী প্রযোজ্য।",
      womenFarmers: "Fully eligible.",
      womenFarmersBn: "মহিলা কৃষকরা সম্পূর্ণ যোগ্য।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "No fixed income limit; small & marginal farmers prioritized.",
      incomeLimitBn: "নির্দিষ্ট আয়সীমা নেই; ক্ষুদ্র ও প্রান্তিক কৃষকদের অগ্রাধিকার দেওয়া হয়।",
      residency: "Resident farmer of a state with active PM-KUSUM tender/portal.",
      residencyBn: "PM-KUSUM চালু থাকা রাজ্যের কৃষক।"
    },
    whoCanApply: [
      "Farmers currently using diesel irrigation pumps or off-grid farmland",
      "FPOs, Cooperatives, and Water User Associations",
      "Farmers with grid-connected agricultural pumps (under Component C)"
    ],
    whoCanApplyBn: [
      "ডিজেল পাম্প ব্যবহারকারী বা বিদ্যুৎ-বিহীন জমির কৃষক",
      "FPO, সমবায় সমিতি ও কৃষক গোষ্ঠী",
      "বিদ্যুৎ চালিত পাম্প সৌরশক্তিতে রূপান্তর করতে ইচ্ছুক কৃষক"
    ],
    whoCannotApply: [
      "Beware of fake PM-KUSUM websites — never pay registration money to unofficial portals"
    ],
    whoCannotApplyBn: [
      "ভুয়ো PM-KUSUM ওয়েবসাইট থেকে সাবধান — শুধুমাত্র সরকারি রাজ্য নোডাল পোর্টালেই আবেদন করুন"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card", bn: "আধার কার্ড", mandatory: true },
      { en: "Land Ownership Document (RoR / Parcha)", bn: "জমির পর্চা / খতিয়ান", mandatory: true },
      { en: "Bank Account Passbook", bn: "ব্যাংকের পাসবই", mandatory: true },
      { en: "Passport-size Photograph & Mobile Number", bn: "ছবি ও সচল মোবাইল নম্বর", mandatory: true }
    ],
    applicationProcess: "Verify your official State Implementing Agency link strictly through pmkusum.mnre.gov.in (Ministry of New & Renewable Energy) and submit your application only on the authorized State portal.",
    applicationProcessBn: "pmkusum.mnre.gov.in (ভারত সরকারের অফিশিয়াল ওয়েবসাইট) থেকে আপনার রাজ্যের অনুমোদিত সংস্থার পোর্টাল যাচাই করে তবেই আবেদন করুন।",
    officialPortalUrl: "https://pmkusum.mnre.gov.in/",
    offlineProcess: "Visit your District Agriculture Office or State Renewable Energy Development Agency (e.g., WBREDA / WBSEDCL in West Bengal) for official state solar pump schedules.",
    offlineProcessBn: "জেলা কৃষি অফিস বা রাজ্য নবীকরণযোগ্য শক্তি দপ্তরে (পশ্চিমবঙ্গে WBREDA / কৃষি দপ্তর) যোগাযোগ করে সরকারি সৌর পাম্পের আবেদন সম্পর্কে জানুন।",
    department: "Ministry of New and Renewable Energy (MNRE), Govt. of India",
    departmentBn: "নতুন ও নবীকরণযোগ্য শক্তি মন্ত্রক (MNRE), ভারত সরকার",
    helpline: "1800-180-3333 (MNRE Toll-Free Helpline)",
    helplineBn: "১৮০০-১৮০-৩৩৩৩ (MNRE টোল-ফ্রি হেল্পলাইন)",
    helplineTel: "18001803333",
    deadline: "State-wise allocation windows listed on pmkusum.mnre.gov.in",
    deadlineBn: "রাজ্যভিত্তিক আবেদন সময়সূচি অফিশিয়াল পোর্টালে প্রকাশিত হয়",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://pmkusum.mnre.gov.in/",
    officialSourceName: "PM-KUSUM Official Portal (MNRE, Govt. of India)",
    published: true
  },
  {
    id: "wb-jalatirtha-district",
    name: "Jalatirtha & WB Micro-Irrigation Water Conservation Programme (Dryland Districts)",
    nameBn: "জলতীর্থ ও পশ্চিমবঙ্গ ক্ষুদ্র সেচ প্রকল্প (শুষ্ক জেলা বিশেষ কর্মসূচি)",
    category: "IRRIGATION_WATER",
    secondaryCategories: ["RURAL_LIVELIHOOD"],
    womenFarmerEligible: true,
    govtLevel: "DISTRICT",
    applicableState: "West Bengal",
    applicableRegion: "Dryland / Western Districts of West Bengal (Bankura, Purulia, Paschim Medinipur, Jhargram, Birbhum, Paschim Bardhaman)",
    applicableRegionBn: "পশ্চিমবঙ্গের পশ্চিমাঞ্চলীয় শুষ্ক জেলা — বাঁকুড়া, পুরুলিয়া, পশ্চিম মেদিনীপুর, ঝাড়গ্রাম, বীরভূম ও পশ্চিম বর্ধমান",
    applicableDistricts: ["Bankura", "Purulia", "Paschim Medinipur", "Jhargram", "Birbhum", "Paschim Bardhaman"],
    purpose: "District-focused water harvesting, check dams, and minor irrigation structures to conserve rainwater and expand multi-crop cultivation in drought-prone western districts of West Bengal.",
    purposeBn: "পশ্চিমবঙ্গের খরাপ্রবণ পশ্চিমাঞ্চলীয় জেলাগুলোতে চেক ড্যাম, জলধারা সংরক্ষণ ও ক্ষুদ্র সেচ প্রকল্পের মাধ্যমে চাষের জমিতে জল পৌঁছে দেওয়া।",
    benefits: "Publicly funded check dams, rainwater harvesting structures, and community minor irrigation channels managed with local beneficiary committees / Water User Associations.",
    benefitsBn: "সরকারি খরচে চেক ড্যাম, জলাধার ও ক্ষুদ্র সেচ নালা নির্মাণ যাতে খরাপ্রবণ এলাকায় একাধিক ফসল চাষ সম্ভব হয়।",
    eligibility: {
      eligibleCategories: "Farming communities, Water User Associations (WUAs), and Gram Panchayats in the notified dryland districts of West Bengal.",
      eligibleCategoriesBn: "পশ্চিমবঙ্গের নির্দিষ্ট শুষ্ক জেলাগুলোর কৃষক সমবায়, জল ব্যবহারকারী সমিতি ও গ্রাম পঞ্চায়েত।",
      landholding: "Community/command-area benefit for local farmers in the project watershed.",
      landholdingBn: "প্রকল্প এলাকার স্থানীয় চাষীদের যৌথ উপকারিতার ভিত্তিতে রূপায়িত।",
      tenantFarmers: "Local cultivators within the irrigation command area benefit jointly.",
      tenantFarmersBn: "সেচ এলাকার মধ্যে থাকা ভাগচাষী ও স্থানীয় কৃষকরাও উপকৃত হন।",
      womenFarmers: "Women farmers & SHGs participate in Water User Associations.",
      womenFarmersBn: "মহিলা কৃষক ও স্বনির্ভর গোষ্ঠী জল ব্যবহারকারী সমিতিতে যুক্ত হতে পারেন।",
      ageLimit: "Adult village farmers / WUA members.",
      ageLimitBn: "প্রাপ্তবয়স্ক স্থানীয় কৃষক।",
      incomeLimit: "No income ceiling; targeted at drought-prone blocks.",
      incomeLimitBn: "আয়সীমা নেই; খরাপ্রবণ ব্লকগুলোকে অগ্রাধিকার দেওয়া হয়।",
      residency: "Notified blocks of Bankura, Purulia, Paschim Medinipur, Jhargram, Birbhum, or Paschim Bardhaman.",
      residencyBn: "বাঁকুড়া, পুরুলিয়া, পশ্চিম মেদিনীপুর, ঝাড়গ্রাম, বীরভূম বা পশ্চিম বর্ধমান জেলার কৃষক।"
    },
    whoCanApply: [
      "Farmer groups and Water User Associations in notified dryland blocks of West Bengal",
      "Gram Panchayats proposing local check dam / water harvesting sites"
    ],
    whoCanApplyBn: [
      "পশ্চিমবঙ্গের শুষ্ক জেলার কৃষক গোষ্ঠী ও জল ব্যবহারকারী সমিতি",
      "স্থানীয় চেক ড্যাম বা জল সংরক্ষণের প্রস্তাবকারী গ্রাম পঞ্চায়েত"
    ],
    whoCannotApply: [
      "Individual private non-agricultural water projects outside notified blocks"
    ],
    whoCannotApplyBn: [
      "নির্দিষ্ট শুষ্ক ব্লকের বাইরে ব্যক্তিগত অ-কৃষি প্রকল্প"
    ],
    requiredDocuments: [
      { en: "Group / Gram Panchayat Resolution & Site Proposal", bn: "কৃষক গোষ্ঠী / গ্রাম পঞ্চায়েতের প্রস্তাবপত্র", mandatory: true },
      { en: "Beneficiary Farmer List with Aadhaar / Voter ID", bn: "উপভোক্তা কৃষকদের তালিকা ও আধার/ভোটার পরিচয়পত্র", mandatory: true },
      { en: "Command Area Mouza Map / Land Details", bn: "প্রকল্প এলাকার মৌজা ম্যাপ ও জমির তথ্য", mandatory: true }
    ],
    applicationProcess: "Proposals are processed through the Block Development Officer (BDO), Block Agriculture Office (ADA), and District Water Resources Investigation & Development (WRIDD) office.",
    applicationProcessBn: "ব্লক উন্নয়ন আধিকারিক (BDO), ব্লক কৃষি অফিস (ADA) এবং জেলা জলসম্পদ অনুসন্ধান ও উন্নয়ন দপ্তরের (WRIDD) মাধ্যমে প্রস্তাব জমা দেওয়া হয়।",
    officialPortalUrl: "https://wbwridd.gov.in/",
    offlineProcess: "Submit a community minor irrigation / check dam request through your Gram Panchayat and Block Agriculture / WRIDD office.",
    offlineProcessBn: "গ্রাম পঞ্চায়েত ও ব্লক কৃষি / জলসম্পদ উন্নয়ন অফিসে যৌথ কৃষক প্রস্তাবপত্র জমা দিন।",
    department: "Water Resources Investigation & Development Dept. (WRIDD) & Dept. of Agriculture, Govt. of West Bengal",
    departmentBn: "জলসম্পদ অনুসন্ধান ও উন্নয়ন দপ্তর (WRIDD) ও কৃষি দপ্তর, পশ্চিমবঙ্গ সরকার",
    helpline: "District WRIDD Office / Block ADA Office",
    helplineBn: "জেলা WRIDD অফিস / ব্লক কৃষি দপ্তর (ADA)",
    helplineTel: "",
    deadline: "District annual action plan cycle",
    deadlineBn: "জেলা বার্ষিক কর্মপরিকল্পনা অনুযায়ী",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://wbwridd.gov.in/",
    officialSourceName: "WB Water Resources Investigation & Development Dept. (wbwridd.gov.in)",
    published: true
  },
  {
    id: "soil-health-card",
    name: "Soil Health Card (SHC) Scheme — Govt. of India",
    nameBn: "মৃত্তিকা স্বাস্থ্য কার্ড (Soil Health Card) — বিনামূল্যে মাটি পরীক্ষা",
    category: "SOIL_HEALTH",
    secondaryCategories: ["SEEDS_FERTILIZERS", "ORGANIC_NATURAL"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & UTs across India",
    applicableRegionBn: "ভারতের সকল রাজ্য ও জেলা",
    applicableDistricts: [],
    purpose: "To test farm soil nutrient status (12 parameters including N, P, K, pH, EC, Organic Carbon & micronutrients) and give farmers crop-wise fertilizer recommendations.",
    purposeBn: "জমির মাটির ১২টি পুষ্টিগুণ পরীক্ষা করে কোন ফসলে কতটুকু সার লাগবে তার সঠিক রিপোর্ট কার্ড দেওয়া, যাতে সারের অপচয় কমে ও ফলন বাড়ে।",
    benefits: "Free/subsidized laboratory soil testing and a printed/digital Soil Health Card with exact organic & chemical fertilizer dosages for major crops.",
    benefitsBn: "সরকারি ল্যাবরেটরিতে মাটি পরীক্ষা ও ফসল অনুযায়ী জৈব ও রাসায়নিক সারের সঠিক মাত্রাসহ মৃত্তিকা স্বাস্থ্য কার্ড।",
    eligibility: {
      eligibleCategories: "All farmers across India.",
      eligibleCategoriesBn: "ভারতের সকল কৃষক।",
      landholding: "Any cultivable agricultural plot (no minimum or maximum area restriction).",
      landholdingBn: "যেকোনো পরিমাণ চাষযোগ্য জমি।",
      tenantFarmers: "Eligible — tenant farmers and sharecroppers can submit soil samples from cultivated plots.",
      tenantFarmersBn: "ভাগচাষী ও লিজ কৃষকরাও চাষ করা জমির মাটি পরীক্ষা করাতে পারেন।",
      womenFarmers: "Fully eligible.",
      womenFarmersBn: "মহিলা কৃষকরা সম্পূর্ণ যোগ্য।",
      ageLimit: "No age restriction.",
      ageLimitBn: "বয়সের কোনো বাধা নেই।",
      incomeLimit: "No income restriction.",
      incomeLimitBn: "কোনো আয়সীমা নেই।",
      residency: "Resident farmer in any State/UT of India.",
      residencyBn: "ভারতের যেকোনো রাজ্যের কৃষক।"
    },
    whoCanApply: [
      "Every farmer wanting to know exact NPK, pH, and micronutrient levels of their soil",
      "Tenant farmers, sharecroppers, and women farmers"
    ],
    whoCanApplyBn: [
      "জমির মাটির গুণাগুণ ও সঠিক সারের পরিমাণ জানতে ইচ্ছুক যেকোনো কৃষক",
      "ভাগচাষী, বর্গাদার ও মহিলা কৃষক"
    ],
    whoCannotApply: [
      "Non-agricultural / commercial construction soil testing"
    ],
    whoCannotApplyBn: [
      "অ-কৃষি বা বাড়ি নির্মাণের মাটি পরীক্ষা এই প্রকল্পের আওতায় নয়"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card & Mobile Number", bn: "আধার কার্ড ও মোবাইল নম্বর", mandatory: true },
      { en: "Basic Plot / Mouza / Khasra Reference", bn: "জমির মৌজা / দাগের সাধারণ তথ্য", mandatory: true },
      { en: "Properly collected Soil Sample (from 15 cm depth across field)", bn: "সঠিক নিয়মে সংগৃহীত জমির মাটির নমুনা", mandatory: true }
    ],
    applicationProcess: "Track and print your issued Soil Health Card online at soilhealth.dac.gov.in using your State, District, Village, and Farmer Name / Sample ID.",
    applicationProcessBn: "soilhealth.dac.gov.in পোর্টালে রাজ্য, জেলা ও গ্রামের নাম দিয়ে আপনার মাটি পরীক্ষার রিপোর্ট (Soil Health Card) অনলাইনে ডাউনলোড ও প্রিন্ট করতে পারবেন।",
    officialPortalUrl: "https://soilhealth.dac.gov.in/",
    offlineProcess: "Submit a 500g composite soil sample to your Block Agriculture Office (ADA), District Soil Testing Lab, or nearest Krishi Vigyan Kendra (KVK).",
    offlineProcessBn: "জমির বিভিন্ন অংশ থেকে মিশিয়ে প্রায় ৫০০ গ্রাম মাটির নমুনা নিয়ে ব্লক কৃষি অফিস (ADA), জেলা মাটি পরীক্ষাগার বা কৃষি বিজ্ঞান কেন্দ্রে (KVK) জমা দিন।",
    department: "Department of Agriculture & Farmers Welfare, Govt. of India",
    departmentBn: "কৃষি ও কৃষক কল্যাণ দপ্তর, ভারত সরকার",
    helpline: "1800-180-1551 (Kisan Call Centre)",
    helplineBn: "১৮০০-১৮০-১৫৫১ (কিষাণ কল সেন্টার)",
    helplineTel: "18001801551",
    deadline: "Open year-round (best done after harvest and before next sowing)",
    deadlineBn: "সারা বছর খোলা থাকে (ফসল কাটার পর ও নতুন বীজ বপনের আগে মাটি পরীক্ষা করা সবচেয়ে ভালো)",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://soilhealth.dac.gov.in/",
    officialSourceName: "Soil Health Card Official Portal (DA&FW)",
    published: true
  },
  {
    id: "smsp-nfsm-seeds",
    name: "Sub-Mission on Seed & Planting Material (SMSP) & NFSM Seed Minikit",
    nameBn: "উন্নত বীজ ও সার সহায়তা (SMSP এবং NFSM বীজ মিনিকিট প্রকল্প)",
    category: "SEEDS_FERTILIZERS",
    secondaryCategories: ["OTHER_AGRI"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & UTs via State Agriculture Departments & Seed Corporations",
    applicableRegionBn: "সকল রাজ্য ও জেলা (রাজ্য কৃষি দপ্তর ও বীজ নিগমের মাধ্যমে)",
    applicableDistricts: [],
    purpose: "To ensure availability of certified high-yielding, climate-resilient seeds, seed minikits, and balanced nutrient inputs (bio-fertilizers & micronutrients) to farmers.",
    purposeBn: "কৃষকদের কাছে উন্নত মানের সার্টিফায়েড বীজ, বিনামূল্যে বা ভর্তুকিযুক্ত বীজ মিনিকিট এবং সুষম জৈব ও অণুখাদ্য সার পৌঁছে দেওয়া।",
    benefits: "Subsidized certified seeds, free seasonal seed minikits for pulses/oilseeds/nutri-cereals (subject to state/block allotment), and support for Seed Village Programmes and micronutrient demonstrations.",
    benefitsBn: "ভর্তুকিযুক্ত সার্টিফায়েড বীজ, ডাল-তৈলবীজ-ধানের বিনামূল্যে বীজ মিনিকিট (ব্লকের বরাদ্দ সাপেক্ষে) এবং অণুখাদ্য ও জৈব সার সহায়তা।",
    eligibility: {
      eligibleCategories: "All farmers, especially small, marginal, SC/ST, and women farmers in notified districts.",
      eligibleCategoriesBn: "সকল কৃষক — বিশেষত ক্ষুদ্র, প্রান্তিক, SC/ST ও মহিলা কৃষক।",
      landholding: "Cultivable land suitable for the notified seasonal crop.",
      landholdingBn: "নির্ধারিত মরসুমী ফসল চাষের উপযোগী জমি।",
      tenantFarmers: "Eligible through Block ADA verification / Farmer ID.",
      tenantFarmersBn: "ব্লক কৃষি দপ্তরের যাচাইয়ের মাধ্যমে ভাগচাষীরাও বীজ মিনিকিট পেতে পারেন।",
      womenFarmers: "Prioritized in seasonal minikit and Seed Village distribution.",
      womenFarmersBn: "মহিলা কৃষকদের বীজ মিনিকিট বণ্টনে অগ্রাধিকার দেওয়া হয়।",
      ageLimit: "Adult cultivating farmers.",
      ageLimitBn: "প্রাপ্তবয়স্ক কৃষক।",
      incomeLimit: "No fixed income ceiling.",
      incomeLimitBn: "আলাদা আয়সীমা নেই।",
      residency: "Resident farmer of the implementing Block/District.",
      residencyBn: "সংশ্লিষ্ট ব্লক ও জেলার কৃষক।"
    },
    whoCanApply: [
      "Small, marginal, and general farmers cultivating paddy, pulses, oilseeds, wheat, or millets",
      "Women farmers and SC/ST farmers",
      "Farmers participating in Seed Village / Cluster Demonstrations"
    ],
    whoCanApplyBn: [
      "ধান, ডাল, সরিষা, গম বা মিলেট চাষ করা ক্ষুদ্র, প্রান্তিক ও সাধারণ কৃষক",
      "মহিলা এবং তফসিলি জাতি/উপজাতি কৃষক",
      "বীজ গ্রাম বা প্রদর্শনী ক্ষেত্র কর্মসূচিতে অংশগ্রহণকারী কৃষক"
    ],
    whoCannotApply: [
      "Commercial seed resellers misusing subsidized farmer minikits"
    ],
    whoCannotApplyBn: [
      "ভর্তুকিযুক্ত বীজ বাণিজ্যিকভাবে পুনরায় বিক্রি করা সম্পূর্ণ নিষিদ্ধ"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card / Voter ID", bn: "আধার কার্ড বা ভোটার কার্ড", mandatory: true },
      { en: "Land Record (Parcha) or Krishak Bandhu / Farmer Registration ID", bn: "জমির পর্চা বা কৃষক রেজিস্ট্রেশন আইডি", mandatory: true },
      { en: "Active Mobile Number", bn: "সচল মোবাইল নম্বর", mandatory: true }
    ],
    applicationProcess: "Verify certified seed dealers, varieties, and SATHI seed traceability on seednet.gov.in; register for seasonal minikits via your State Agriculture portal or Block ADA office.",
    applicationProcessBn: "seednet.gov.in পোর্টালে অনুমোদিত উন্নত বীজের তথ্য দেখুন এবং মরসুমী বীজ মিনিকিটের জন্য ব্লক কৃষি অফিস (ADA) বা রাজ্য কৃষি পোর্টালে নাম লেখান।",
    officialPortalUrl: "https://seednet.gov.in/",
    offlineProcess: "Contact your Gram Panchayat Krishi Prayukti Sahayak (KPS) or Block Agriculture Office (ADA) before Kharif and Rabi sowing seasons.",
    offlineProcessBn: "খরিফ ও রবি চাষের আগে আপনার এলাকার কৃষি প্রযুক্তি সহায়ক (KPS) বা ব্লক কৃষি অফিসে (ADA) যোগাযোগ করুন।",
    department: "Department of Agriculture & Farmers Welfare, Govt. of India (with State Agriculture Depts.)",
    departmentBn: "কৃষি ও কৃষক কল্যাণ দপ্তর, ভারত সরকার ও রাজ্য কৃষি দপ্তর",
    helpline: "1800-180-1551 (Kisan Call Centre)",
    helplineBn: "১৮০০-১৮০-১৫৫১ (কিষাণ কল সেন্টার)",
    helplineTel: "18001801551",
    deadline: "Before Kharif (May–July) & Rabi (Oct–Dec) sowing windows as notified by Block ADA",
    deadlineBn: "খরিফ ও রবি বীজ বপনের আগে ব্লক কৃষি দপ্তরের বিজ্ঞপ্তি অনুযায়ী",
    status: "SEASONAL",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://seednet.gov.in/",
    officialSourceName: "SeedNet India Official Portal (DA&FW)",
    published: true
  },
  {
    id: "smam-machinery",
    name: "Sub-Mission on Agricultural Mechanization (SMAM)",
    nameBn: "কৃষি যন্ত্রপাতি ভর্তুকি প্রকল্প (SMAM — কেন্দ্রীয় সরকার)",
    category: "AGRI_MACHINERY",
    secondaryCategories: ["WOMEN_FARMER", "FPO"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & UTs across India",
    applicableRegionBn: "ভারতের সকল রাজ্য ও কেন্দ্রশাসিত অঞ্চল",
    applicableDistricts: [],
    purpose: "To increase farm mechanization among small and marginal farmers and promote Custom Hiring Centres (CHCs) and Farm Machinery Banks.",
    purposeBn: "ক্ষুদ্র ও প্রান্তিক কৃষকদের জন্য আধুনিক কৃষি যন্ত্রপাতি (পাওয়ার টিলার, রোটাভেটর, থ্রেশার, স্প্রেয়ার, হারভেস্টার) সুলভ করা এবং কাস্টম হায়ারিং সেন্টার গড়ে তোলা।",
    benefits: "Financial assistance / subsidy generally 40% to 50% (higher for SC/ST, Small/Marginal, Women & North-East farmers as per machine ceiling) on approved farm machines, and up to 40%–80% support for Custom Hiring Centres / Farm Machinery Banks run by farmer groups/FPOs.",
    benefitsBn: "অনুমোদিত কৃষি যন্ত্রপাতি কেনার জন্য সাধারণত ৪০% থেকে ৫০% ভর্তুকি (ক্ষুদ্র, প্রান্তিক, SC/ST ও মহিলা কৃষকদের জন্য বাড়তি সুবিধা) এবং কৃষক গোষ্ঠীর কাস্টম হায়ারিং সেন্টারের জন্য বড় ভর্তুকি সহায়তা।",
    eligibility: {
      eligibleCategories: "Individual farmers, Women farmers, SC/ST farmers, FPOs, Cooperatives, and SHGs.",
      eligibleCategoriesBn: "ব্যক্তিগত কৃষক, মহিলা কৃষক, SC/ST কৃষক, FPO, সমবায় সমিতি ও স্বনির্ভর গোষ্ঠী।",
      landholding: "Valid land record (RoR / Parcha) for individual machinery purchase.",
      landholdingBn: "ব্যক্তিগত যন্ত্রপাতি ভর্তুকির জন্য বৈধ জমির রেকর্ড থাকতে হবে।",
      tenantFarmers: "Can rent subsidized machinery through Village Farm Machinery Banks / Custom Hiring Centres.",
      tenantFarmersBn: "ভাগচাষী কৃষকরা গ্রামের ফার্ম মেশিনারি ব্যাংক / কাস্টম হায়ারিং সেন্টার থেকে কম ভাড়ায় যন্ত্র ব্যবহার করতে পারেন।",
      womenFarmers: "Eligible for higher subsidy slab (up to 50% subject to machine-wise ceiling).",
      womenFarmersBn: "মহিলা কৃষকরা উচ্চতর ভর্তুকির (সর্বোচ্চ ৫০% সীমা পর্যন্ত) সুবিধা পান।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "No fixed income ceiling.",
      incomeLimitBn: "কোনো নির্দিষ্ট আয়সীমা নেই।",
      residency: "Resident of the implementing State/UT.",
      residencyBn: "সংশ্লিষ্ট রাজ্যের স্থায়ী বাসিন্দা।"
    },
    whoCanApply: [
      "Individual farmers buying power tillers, sprayers, seed drills, rotavators, or reapers",
      "Women farmers and SC/ST farmers (higher subsidy slab)",
      "FPOs, Cooperatives, and SHGs establishing Custom Hiring Centres"
    ],
    whoCanApplyBn: [
      "পাওয়ার টিলার, স্প্রেয়ার, রোটাভেটর বা ধান কাটার মেশিন কিনতে ইচ্ছুক কৃষক",
      "মহিলা ও তফসিলি জাতি/উপজাতি কৃষক",
      "কাস্টম হায়ারিং সেন্টার গড়তে ইচ্ছুক FPO ও সমবায় গোষ্ঠী"
    ],
    whoCannotApply: [
      "Purchasing machines from non-approved/untested dealers outside state guidelines"
    ],
    whoCannotApplyBn: [
      "অননুমোদিত ডিলার বা সরকারি তালিকাভুক্ত নয় এমন যন্ত্রের ক্ষেত্রে ভর্তুকি মেলে না"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card", bn: "আধার কার্ড", mandatory: true },
      { en: "Land Ownership Record (RoR / Parcha)", bn: "জমির পর্চা / খতিয়ান", mandatory: true },
      { en: "Bank Passbook Copy (Aadhaar seeded)", bn: "আধার-সংযুক্ত ব্যাংকের পাসবই", mandatory: true },
      { en: "Passport-size Photograph", bn: "পাসপোর্ট সাইজ ছবি", mandatory: true },
      { en: "Caste Certificate (for SC/ST higher subsidy)", bn: "জাতিগত শংসাপত্র (SC/ST হলে)", mandatory: false },
      { en: "Approved Machine Quotation / Invoice after sanction", bn: "অনুমোদিত ডিলারের কোটেশন ও বিল", mandatory: true }
    ],
    applicationProcess: "Register online on agrimachinery.nic.in (or your State DBT machinery portal such as Matir Katha in West Bengal) → choose approved machine → receive sanction order → purchase and upload invoice for DBT subsidy.",
    applicationProcessBn: "agrimachinery.nic.in অথবা আপনার রাজ্যের কৃষি যন্ত্রপাতি পোর্টালে (পশ্চিমবঙ্গে মাটির কথা) অনলাইনে আবেদন করুন → অনুমোদন পত্র পেলে অনুমোদিত ডিলার থেকে যন্ত্র কিনে বিল আপলোড করলে ভর্তুকি ব্যাংকে আসে।",
    officialPortalUrl: "https://agrimachinery.nic.in/",
    offlineProcess: "Seek guidance at your Block Agriculture Office (ADA) or CSC centre to check state-approved machines and open application dates.",
    offlineProcessBn: "অনুমোদিত যন্ত্রের তালিকা ও আবেদনের তারিখ জানতে ব্লক কৃষি অফিস (ADA) বা তথ্যমিত্র কেন্দ্রে (CSC) যোগাযোগ করুন।",
    department: "Department of Agriculture & Farmers Welfare, Govt. of India",
    departmentBn: "কৃষি ও কৃষক কল্যাণ দপ্তর, ভারত সরকার",
    helpline: "1800-180-1551 (Kisan Call Centre)",
    helplineBn: "১৮০০-১৮০-১৫৫১ (কিষাণ কল সেন্টার)",
    helplineTel: "18001801551",
    deadline: "State-wise annual online application windows",
    deadlineBn: "প্রতি অর্থবর্ষে রাজ্য ভিত্তিক নির্দিষ্ট সময়ে অনলাইন আবেদন খোলে",
    status: "SEASONAL",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://agrimachinery.nic.in/",
    officialSourceName: "SMAM Official Portal (agrimachinery.nic.in)",
    published: true
  },
  {
    id: "wb-fssm-matirkatha",
    name: "West Bengal FSSM (Financial Support Scheme for Farm Mechanization — Matir Katha)",
    nameBn: "পশ্চিমবঙ্গ কৃষি যন্ত্রপাতি ভর্তুকি (FSSM — মাটির কথা পোর্টাল)",
    category: "AGRI_MACHINERY",
    secondaryCategories: ["SEEDS_FERTILIZERS", "TRAINING_SKILL"],
    womenFarmerEligible: true,
    govtLevel: "STATE",
    applicableState: "West Bengal",
    applicableRegion: "All 23 Districts of West Bengal",
    applicableRegionBn: "পশ্চিমবঙ্গের সকল ২৩টি জেলা",
    applicableDistricts: [],
    purpose: "West Bengal's flagship farm mechanization subsidy scheme providing financial assistance for buying modern farm implements and establishing Custom Hiring Centres.",
    purposeBn: "পশ্চিমবঙ্গের কৃষকদের পাওয়ার টিলার, পাওয়ার স্প্রেয়ার, পাম্প সেট, থ্রেশার ও অন্যান্য আধুনিক কৃষি যন্ত্রপাতি কেনার জন্য রাজ্য সরকারি ভর্তুকি।",
    benefits: "Direct bank subsidy for small farm implements (OTA-SFI), power-operated machines (FSSM), and Custom Hiring Centres (CHC) as per West Bengal Dept. of Agriculture annual norms.",
    benefitsBn: "ক্ষুদ্র কৃষি যন্ত্রপাতি (OTA-SFI), যন্ত্রচালিত মেশিন (FSSM) এবং কাস্টম হায়ারিং সেন্টার (CHC) স্থাপনের জন্য সরাসরি ব্যাংক অ্যাকাউন্টে রাজ্য সরকারি ভর্তুকি।",
    eligibility: {
      eligibleCategories: "Farmers, SHGs, FPOs, and Registered Agricultural Cooperatives in West Bengal.",
      eligibleCategoriesBn: "পশ্চিমবঙ্গের নথিভুক্ত কৃষক, স্বনির্ভর গোষ্ঠী (SHG), FPO ও সমবায় সমিতি।",
      landholding: "Valid West Bengal land record / Krishak Bandhu ID.",
      landholdingBn: "পশ্চিমবঙ্গের বৈধ জমির পর্চা বা কৃষক বন্ধু আইডি।",
      tenantFarmers: "Bargadars with valid West Bengal records are eligible as per scheme norms.",
      tenantFarmersBn: "বৈধ নথিযুক্ত বর্গাদার কৃষকরা নিয়ম অনুযায়ী যোগ্য।",
      womenFarmers: "Fully eligible (individually or via Women SHGs).",
      womenFarmersBn: "মহিলা কৃষক ও মহিলা স্বনির্ভর গোষ্ঠী সম্পূর্ণ যোগ্য।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "No fixed income limit.",
      incomeLimitBn: "নির্দিষ্ট আয়সীমা নেই।",
      residency: "Permanent resident farmer of West Bengal.",
      residencyBn: "পশ্চিমবঙ্গের স্থায়ী কৃষক।"
    },
    whoCanApply: [
      "Individual West Bengal farmers with valid land record / Krishak Bandhu ID",
      "Women farmers, SHGs, FPOs, and Cooperative societies in West Bengal"
    ],
    whoCanApplyBn: [
      "জমির পর্চা বা কৃষক বন্ধু আইডি থাকা পশ্চিমবঙ্গের কৃষক",
      "পশ্চিমবঙ্গের মহিলা কৃষক, স্বনির্ভর গোষ্ঠী (SHG), FPO ও সমবায় সমিতি"
    ],
    whoCannotApply: [
      "Farmers outside West Bengal",
      "Purchasing machinery before receiving formal online sanction/selection"
    ],
    whoCannotApplyBn: [
      "পশ্চিমবঙ্গের বাইরের কৃষক",
      "সরকারি অনুমোদন পাওয়ার আগে যন্ত্র কিনে ফেললে ভর্তুকি প্রযোজ্য নয়"
    ],
    requiredDocuments: [
      { en: "Voter ID & Aadhaar Card", bn: "ভোটার কার্ড ও আধার কার্ড", mandatory: true },
      { en: "Land Record (Parcha) / Krishak Bandhu ID", bn: "জমির পর্চা / কৃষক বন্ধু আইডি", mandatory: true },
      { en: "Bank Passbook Copy", bn: "ব্যাংকের পাসবইয়ের কপি", mandatory: true },
      { en: "Empanelled Supplier Quotation (selected on portal)", bn: "পোর্টালে তালিকাভুক্ত ডিলারের কোটেশন", mandatory: true }
    ],
    applicationProcess: "Apply online via matirkatha.net during open FSSM application windows → print acknowledgement → submit verification copy at Block ADA office → purchase from approved dealer after sanction.",
    applicationProcessBn: "আবেদন চালু হলে matirkatha.net পোর্টালে অনলাইনে ফর্ম পূরণ করুন → প্রিন্টআউট ও নথি ব্লক কৃষি অফিসে (ADA) জমা দিন → অনুমোদন মিললে তালিকাভুক্ত ডিলার থেকে যন্ত্র কিনুন।",
    officialPortalUrl: "https://matirkatha.net/",
    offlineProcess: "Visit your Block Agriculture Office (ADA) or Bangla Sahayata Kendra (BSK) for free online form filling assistance.",
    offlineProcessBn: "বিনামূল্যে অনলাইন আবেদন সহায়তার জন্য নিকটবর্তী বাংলা সহায়তা কেন্দ্র (BSK) বা ব্লক কৃষি অফিসে (ADA) যান।",
    department: "Department of Agriculture, Government of West Bengal",
    departmentBn: "কৃষি দপ্তর, পশ্চিমবঙ্গ সরকার",
    helpline: "Block Agriculture Office (ADA) / BSK / Matir Katha Portal",
    helplineBn: "ব্লক কৃষি অফিস (ADA) / বাংলা সহায়তা কেন্দ্র (BSK)",
    helplineTel: "",
    deadline: "Announced annually on matirkatha.net by WB Dept. of Agriculture",
    deadlineBn: "প্রতি বছর matirkatha.net পোর্টালে আবেদনের তারিখ ঘোষণা করা হয়",
    status: "SEASONAL",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://matirkatha.net/",
    officialSourceName: "Matir Katha Official Portal (Govt. of West Bengal)",
    published: true
  },
  {
    id: "pkvy-natural-farming",
    name: "Paramparagat Krishi Vikas Yojana (PKVY) & Natural Farming Support",
    nameBn: "পরম্পরাগত কৃষি বিকাশ যোজনা (PKVY — জৈব ও প্রাকৃতিক চাষ)",
    category: "ORGANIC_NATURAL",
    secondaryCategories: ["SOIL_HEALTH", "TRAINING_SKILL"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & UTs (Cluster-Based Organic & Natural Farming)",
    applicableRegionBn: "ভারতের সকল রাজ্য (ক্লাস্টার ভিত্তিক জৈব ও প্রাকৃতিক চাষ)",
    applicableDistricts: [],
    purpose: "To promote chemical-free organic and natural farming through farmer clusters, PGS-India certification, soil health restoration, and organic market linkage.",
    purposeBn: "রাসায়নিকমুক্ত জৈব ও প্রাকৃতিক চাষকে উৎসাহিত করা, কৃষক ক্লাস্টারের মাধ্যমে PGS-India জৈব সার্টিফিকেশন এবং জৈব ফসলের বাজার সংযোগ তৈরি করা।",
    benefits: "Cluster-based financial assistance per hectare over 3 years for organic inputs (vermicompost, bio-fertilizers, botanical extracts), PGS-India certification, farmer training, and packaging/marketing support (subject to State cluster allocation).",
    benefitsBn: "৩ বছর মেয়াদে প্রতি হেক্টরে জৈব সার/উপকরণ (ভার্মি কম্পোস্ট, জীবাণু সার), বিনামূল্যে PGS-India জৈব সার্টিফিকেশন, প্রশিক্ষণ ও বিপণন সহায়তা (রাজ্যের ক্লাস্টার বরাদ্দ সাপেক্ষে)।",
    eligibility: {
      eligibleCategories: "Groups/clusters of farmers (typically 20+ farmers forming a 20-hectare cluster) adopting chemical-free organic or natural farming.",
      eligibleCategoriesBn: "জৈব বা প্রাকৃতিক চাষে আগ্রহী কৃষকদের দল বা ক্লাস্টার (সাধারণত ২০ বা তার বেশি কৃষকের দল)।",
      landholding: "Up to 2 hectares per farmer eligible for direct input assistance under cluster guidelines.",
      landholdingBn: "নির্দেশিকা অনুযায়ী প্রতি কৃষকের সর্বোচ্চ ২ হেক্টর জমির জন্য জৈব উপকরণ সহায়তা।",
      tenantFarmers: "Eligible as part of a recognized village organic cluster with local ADA/agency verification.",
      tenantFarmersBn: "গ্রামের অনুমোদিত জৈব চাষ ক্লাস্টারের সদস্য হিসেবে ভাগচাষীরাও যুক্ত হতে পারেন।",
      womenFarmers: "Fully eligible; Women SHG organic clusters are strongly encouraged.",
      womenFarmersBn: "মহিলা কৃষক ও মহিলা স্বনির্ভর গোষ্ঠীর জৈব ক্লাস্টারকে বিশেষ উৎসাহ দেওয়া হয়।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "No fixed income limit.",
      incomeLimitBn: "নির্দিষ্ট আয়সীমা নেই।",
      residency: "Farming within an approved PKVY / Natural Farming cluster.",
      residencyBn: "অনুমোদিত PKVY / প্রাকৃতিক চাষ ক্লাস্টার এলাকার কৃষক।"
    },
    whoCanApply: [
      "Farmer groups/clusters transitioning to organic or natural farming",
      "Women SHGs, FPOs, and village cooperatives adopting chemical-free farming"
    ],
    whoCanApplyBn: [
      "জৈব বা প্রাকৃতিক চাষে আগ্রহী কৃষক গোষ্ঠী বা ক্লাস্টার",
      "মহিলা স্বনির্ভর গোষ্ঠী (SHG), FPO ও সমবায় সমিতি"
    ],
    whoCannotApply: [
      "Farms continuing synthetic chemical fertilizer/pesticide use on the enrolled organic plot"
    ],
    whoCannotApplyBn: [
      "নথিভুক্ত জৈব জমিতে রাসায়নিক সার বা কীটনাশক ব্যবহার চালিয়ে গেলে যোগ্য নন"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card & Bank Passbook", bn: "আধার কার্ড ও ব্যাংকের পাসবই", mandatory: true },
      { en: "Land / Cultivation Details for the Organic Plot", bn: "জৈব চাষের জমির তথ্য / পর্চা", mandatory: true },
      { en: "Cluster / Group Formation Pledge under PGS-India", bn: "PGS-India ক্লাস্টার সদস্যপদ ও অঙ্গীকারপত্র", mandatory: true }
    ],
    applicationProcess: "Enroll through your State Agriculture Department / Regional Council on pgsindia-ncof.gov.in to form or join a certified organic cluster.",
    applicationProcessBn: "ব্লক কৃষি অফিস (ADA) বা আঞ্চলিক সংস্থার মাধ্যমে pgsindia-ncof.gov.in পোর্টালে জৈব ক্লাস্টার হিসেবে নাম নথিভুক্ত করুন।",
    officialPortalUrl: "https://pgsindia-ncof.gov.in/",
    offlineProcess: "Contact your Block Agriculture Office (ADA) or Krishi Vigyan Kendra (KVK) to join active PKVY / Natural Farming clusters in your block.",
    offlineProcessBn: "আপনার ব্লকে চালু জৈব চাষ ক্লাস্টারে যোগ দিতে ব্লক কৃষি অফিস (ADA) বা কৃষি বিজ্ঞান কেন্দ্রে (KVK) যোগাযোগ করুন।",
    department: "Department of Agriculture & Farmers Welfare (NCOF), Govt. of India",
    departmentBn: "কৃষি ও কৃষক কল্যাণ দপ্তর (জাতীয় জৈব কৃষি কেন্দ্র), ভারত সরকার",
    helpline: "1800-180-1551 (Kisan Call Centre)",
    helplineBn: "১৮০০-১৮০-১৫৫১ (কিষাণ কল সেন্টার)",
    helplineTel: "18001801551",
    deadline: "State annual cluster enrollment cycle",
    deadlineBn: "রাজ্যের বার্ষিক ক্লাস্টার নির্বাচন অনুযায়ী",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://pgsindia-ncof.gov.in/",
    officialSourceName: "PGS-India / PKVY Official Portal (DA&FW)",
    published: true
  },
  {
    id: "midh-horticulture",
    name: "Mission for Integrated Development of Horticulture (MIDH)",
    nameBn: "সমন্বিত উদ্যানপালন উন্নয়ন মিশন (MIDH — ফল, সবজি ও বাগান চাষ)",
    category: "HORTICULTURE",
    secondaryCategories: ["STORAGE_COLD_CHAIN", "IRRIGATION_WATER"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & UTs via State Horticulture Missions",
    applicableRegionBn: "ভারতের সকল রাজ্য (রাজ্য উদ্যানপালন মিশনের মাধ্যমে)",
    applicableDistricts: [],
    purpose: "Holistic growth of the horticulture sector covering fruits, vegetables, spices, mushrooms, beekeeping, nurseries, protected cultivation (polyhouses/shade-nets), and post-harvest cold storage.",
    purposeBn: "ফল, সবজি, মশলা, মাশরুম, মৌমাছি পালন, নার্সারি, পলিহাউস/শেড-নেট চাষ এবং ফল-সবজি সংরক্ষণের পরিকাঠামো উন্নয়নে সরকারি সহায়তা।",
    benefits: "Cost-norm based subsidies (typically 40% to 50% depending on component & region) for new orchards, hybrid vegetable cultivation, polyhouse/shade-net houses, mushroom units, beekeeping boxes, pack houses, and cold rooms.",
    benefitsBn: "নতুন ফলের বাগান, হাইব্রিড সবজি, পলিহাউস/শেড-নেট, মাশরুম চাষ, মৌমাছি পালনের বাক্স, প্যাক হাউস ও কোল্ড স্টোরেজের জন্য নির্ধারিত খরচের ওপর সাধারণত ৪০%–৫০% সরকারি ভর্তুকি।",
    eligibility: {
      eligibleCategories: "Individual farmers, Women farmers, FPOs, SHGs, cooperatives, and horticulture entrepreneurs.",
      eligibleCategoriesBn: "ব্যক্তিগত কৃষক, মহিলা কৃষক, FPO, স্বনির্ভর গোষ্ঠী ও উদ্যানপালন উদ্যোক্তা।",
      landholding: "Cultivable land owned or held on valid long-term lease (as required for orchards/protected structures).",
      landholdingBn: "বাগান বা পলিহাউসের জন্য নিজস্ব জমি অথবা বৈধ দীর্ঘমেয়াদী লিজ চুক্তি।",
      tenantFarmers: "Eligible with valid registered lease agreement for the required project tenure.",
      tenantFarmersBn: "বৈধ রেজিস্টার্ড লিজ চুক্তি থাকলে প্রযোজ্য ক্ষেত্রে যোগ্য।",
      womenFarmers: "Fully eligible; special outreach to women SHGs for mushroom, nursery & kitchen-garden units.",
      womenFarmersBn: "মহিলা কৃষক ও স্বনির্ভর গোষ্ঠী মাশরুম, নার্সারি ও সবজি চাষে বিশেষ উৎসাহ পান।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "No fixed income limit.",
      incomeLimitBn: "আলাদা আয়সীমা নেই।",
      residency: "Resident of the implementing State/District.",
      residencyBn: "সংশ্লিষ্ট রাজ্য ও জেলার বাসিন্দা।"
    },
    whoCanApply: [
      "Fruit orchard, vegetable, spice, and mushroom growers",
      "Farmers installing polyhouses, shade-net houses, plastic mulching, or beekeeping units",
      "FPOs and Women SHGs establishing horticulture nurseries or pack houses"
    ],
    whoCanApplyBn: [
      "ফল, সবজি, মশলা ও মাশরুম চাষী",
      "পলিহাউস, শেড-নেট, মালচিং বা মৌমাছি পালন শুরু করতে ইচ্ছুক কৃষক",
      "নার্সারি বা প্যাক হাউস গড়তে ইচ্ছুক FPO ও মহিলা স্বনির্ভর গোষ্ঠী"
    ],
    whoCannotApply: [
      "Projects started without prior approval/sanction where pre-inspection is required"
    ],
    whoCannotApplyBn: [
      "পূর্বানুমতি ও যাচাই ছাড়াই কাজ শুরু করলে ভর্তুকি অনুমোদিত হয় না"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card & Bank Passbook", bn: "আধার কার্ড ও ব্যাংকের পাসবই", mandatory: true },
      { en: "Land Ownership Record (Parcha / RoR) or Registered Lease", bn: "জমির পর্চা বা রেজিস্টার্ড লিজ নথি", mandatory: true },
      { en: "Passport-size Photograph", bn: "পাসপোর্ট সাইজ ছবি", mandatory: true },
      { en: "Project Proposal / Cost Estimate (for Polyhouse / Cold Room / Nursery)", bn: "প্রকল্প রিপোর্ট ও খরচের হিসাব (পলিহাউস / নার্সারি / কোল্ড রুমের জন্য)", mandatory: false }
    ],
    applicationProcess: "Review component norms on midh.gov.in and submit applications through your State Horticulture Mission portal or District Horticulture Office.",
    applicationProcessBn: "midh.gov.in পোর্টালে প্রকল্পের নিয়মাবলি দেখুন এবং আপনার রাজ্যের উদ্যানপালন দপ্তরের পোর্টাল বা জেলা উদ্যানপালন অফিসে আবেদন করুন।",
    officialPortalUrl: "https://midh.gov.in/",
    offlineProcess: "Visit your District Horticulture Officer (DHO) or Block Horticulture Development Officer with land papers and Aadhaar to apply under current annual targets.",
    offlineProcessBn: "জমির নথি ও আধার নিয়ে জেলা বা ব্লক উদ্যানপালন আধিকারিকের (Horticulture Office) কাছে সরাসরি আবেদন করুন।",
    department: "Department of Agriculture & Farmers Welfare (Horticulture Division) & State Horticulture Missions",
    departmentBn: "উদ্যানপালন বিভাগ, কৃষি মন্ত্রক (ভারত সরকার) ও রাজ্য উদ্যানপালন মিশন",
    helpline: "1800-180-1551 (Kisan Call Centre)",
    helplineBn: "১৮০০-১৮০-১৫৫১ (কিষাণ কল সেন্টার)",
    helplineTel: "18001801551",
    deadline: "State Horticulture annual action plan windows",
    deadlineBn: "রাজ্য উদ্যানপালন দপ্তরের বার্ষিক বরাদ্দ অনুযায়ী",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://midh.gov.in/",
    officialSourceName: "MIDH Official Portal (midh.gov.in)",
    published: true
  },
  {
    id: "midh-floriculture-wb",
    name: "Floriculture Development Programme (Under MIDH & State Horticulture Mission)",
    nameBn: "ফুল চাষ উন্নয়ন প্রকল্প (MIDH ও রাজ্য উদ্যানপালন মিশন)",
    category: "FLORICULTURE",
    secondaryCategories: ["HORTICULTURE", "WOMEN_FARMER"],
    womenFarmerEligible: true,
    govtLevel: "STATE",
    applicableState: "West Bengal",
    applicableRegion: "West Bengal (Major flower belts: Purba Medinipur, Paschim Medinipur, Howrah, Nadia, North 24 Parganas & other districts) & MIDH States",
    applicableRegionBn: "পশ্চিমবঙ্গের সকল জেলা (বিশেষত পূর্ব ও পশ্চিম মেদিনীপুর, হাওড়া, নদীয়া, উত্তর ২৪ পরগনা) ও অন্যান্য MIDH রাজ্য",
    applicableDistricts: ["Purba Medinipur", "Paschim Medinipur", "Howrah", "Nadia", "North 24 Parganas", "South 24 Parganas", "Hooghly", "Darjeeling", "Kalimpong"],
    purpose: "To support commercial cultivation of loose flowers (marigold, jasmine), cut flowers (rose, gerbera, gladiolus, tuberose), bulbous flowers, and protected flower greenhouses.",
    purposeBn: "গাঁদা, রজনীগন্ধা, গোলাপ, জারবেরা, গ্লাডিওলাস ও অন্যান্য বাণিজ্যিক ফুল চাষে চারা, কন্দ ও পলিহাউস/শেড-নেট সহায়তার মাধ্যমে ফুল চাষীদের আয় বাড়ানো।",
    benefits: "Area-expansion subsidies per hectare for cut flowers, bulbous flowers (like Gladiolus/Tuberose), loose flowers, plus protected cultivation (polyhouse/shade-net) support under MIDH/State Horticulture norms.",
    benefitsBn: "খোলা ফুল, কাট ফ্লাওয়ার ও কন্দজাতীয় ফুল (যেমন গ্লাডিওলাস, রজনীগন্ধা) চাষের এলাকা বৃদ্ধি এবং পলিহাউস/শেড-নেট নির্মাণে MIDH ও রাজ্য উদ্যানপালন দপ্তরের নির্ধারিত ভর্তুকি।",
    eligibility: {
      eligibleCategories: "Small, marginal, and commercial flower growers, Women SHGs, and floriculture cooperatives.",
      eligibleCategoriesBn: "ক্ষুদ্র, প্রান্তিক ও বাণিজ্যিক ফুল চাষী, মহিলা স্বনির্ভর গোষ্ঠী ও ফুল চাষ সমবায়।",
      landholding: "Cultivable land suitable for floriculture (typically up to 2 hectares per beneficiary under MIDH area-expansion norms).",
      landholdingBn: "ফুল চাষের উপযোগী জমি (MIDH নিয়ম অনুযায়ী সাধারণত সর্বোচ্চ ২ হেক্টর পর্যন্ত ভর্তুকি)।",
      tenantFarmers: "Eligible with valid lease documentation where accepted by District Horticulture Office.",
      tenantFarmersBn: "জেলা উদ্যানপালন দপ্তরের নিয়ম অনুযায়ী বৈধ লিজ নথি থাকলে প্রযোজ্য।",
      womenFarmers: "Fully eligible; widely adopted by women flower-farming groups.",
      womenFarmersBn: "মহিলা ফুল চাষী ও স্বনির্ভর গোষ্ঠী সম্পূর্ণ যোগ্য।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "No fixed income limit.",
      incomeLimitBn: "আলাদা আয়সীমা নেই।",
      residency: "Resident farmer of the implementing District/State.",
      residencyBn: "সংশ্লিষ্ট জেলা ও রাজ্যের কৃষক।"
    },
    whoCanApply: [
      "Marigold, tuberose, gladiolus, rose, chrysanthemum, and orchid/gerbera growers",
      "Farmers installing shade-nets or polyhouses for high-value cut flowers",
      "Women farmers and Floriculture FPOs"
    ],
    whoCanApplyBn: [
      "গাঁদা, রজনীগন্ধা, গ্লাডিওলাস, গোলাপ, চন্দ্রমল্লিকা ও জারবেরা ফুল চাষী",
      "উন্নত ফুল চাষের জন্য শেড-নেট বা পলিহাউস করতে ইচ্ছুক কৃষক",
      "মহিলা কৃষক ও ফুল চাষী গোষ্ঠী"
    ],
    whoCannotApply: [
      "Non-commercial home ornamental pots (scheme is for agricultural/commercial floriculture)"
    ],
    whoCannotApplyBn: [
      "বাড়ির ছাদে শখের টবের ফুল নয় — বাণিজ্যিক ও কৃষি ফুল চাষের জন্য এই প্রকল্প"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card & Voter ID", bn: "আধার কার্ড ও ভোটার কার্ড", mandatory: true },
      { en: "Land Ownership Record (Parcha / RoR)", bn: "জমির পর্চা / খতিয়ান", mandatory: true },
      { en: "Bank Account Passbook", bn: "ব্যাংকের পাসবই", mandatory: true },
      { en: "Planting Material / Structure Quotation (where required)", bn: "চারা/কন্দ বা শেড-নেট নির্মাণের কোটেশন (প্রযোজ্য ক্ষেত্রে)", mandatory: false }
    ],
    applicationProcess: "Apply through your District Horticulture Office (Food Processing Industries & Horticulture Dept., West Bengal) or view MIDH floriculture cost norms on midh.gov.in.",
    applicationProcessBn: "জেলা উদ্যানপালন আধিকারিকের (FPI & Horticulture Dept.) অফিসে আবেদন করুন এবং midh.gov.in-এ ফুল চাষ ভর্তুকির কেন্দ্রীয় নিয়মাবলি দেখুন।",
    officialPortalUrl: "https://wbfpih.gov.in/",
    offlineProcess: "Visit your District Horticulture Officer (DHO) with Aadhaar, Land Parcha, and Bank Passbook to apply for annual floriculture area-expansion & protected-cultivation targets.",
    offlineProcessBn: "আধার, জমির পর্চা ও ব্যাংকের পাসবই নিয়ে জেলা উদ্যানপালন অফিসে (DHO) গিয়ে বার্ষিক ফুল চাষ প্রকল্পে আবেদন করুন।",
    department: "Dept. of Food Processing Industries & Horticulture (WB) & MIDH (Govt. of India)",
    departmentBn: "খাদ্য প্রক্রিয়াকরণ শিল্প ও উদ্যানপালন দপ্তর (পশ্চিমবঙ্গ) এবং MIDH (ভারত সরকার)",
    helpline: "District Horticulture Office / 1800-180-1551",
    helplineBn: "জেলা উদ্যানপালন অফিস / ১৮০০-১৮০-১৫৫১",
    helplineTel: "18001801551",
    deadline: "Annual district horticulture allocation windows",
    deadlineBn: "জেলা উদ্যানপালন দপ্তরের বার্ষিক বরাদ্দ অনুযায়ী",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://midh.gov.in/",
    officialSourceName: "MIDH & WB Dept. of FPI & Horticulture",
    published: true
  },
  {
    id: "npdd-dairy",
    name: "National Programme for Dairy Development (NPDD) & Dairy Cooperatives Support",
    nameBn: "জাতীয় দুগ্ধ উন্নয়ন কর্মসূচি (NPDD — দুগ্ধ চাষ ও সমবায় সহায়তা)",
    category: "DAIRY_FARMING",
    secondaryCategories: ["LIVESTOCK_DEV", "WOMEN_FARMER"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & UTs via State Milk Federations & Dairy Cooperatives",
    applicableRegionBn: "ভারতের সকল রাজ্য (রাজ্য দুগ্ধ ফেডারেশন ও দুগ্ধ সমবায়ের মাধ্যমে)",
    applicableDistricts: [],
    purpose: "To strengthen quality milk testing, chilling infrastructure, dairy cooperative societies, and increase milk procurement & farmer dairy income.",
    purposeBn: "দুগ্ধ সমবায়, দুধ পরীক্ষাগার, মিল্ক চিলিং ইউনিট ও দুগ্ধ প্রক্রিয়াকরণ পরিকাঠামো গড়ে তুলে গোপালক ও দুগ্ধ চাষীদের আয় বাড়ানো।",
    benefits: "Grant-in-aid support for Village Dairy Cooperative Societies (milk analyzers, bulk milk coolers, milking equipment, training) and concessional credit linkage for dairy infrastructure through State Implementing Agencies.",
    benefitsBn: "গ্রামীণ দুগ্ধ সমবায় সমিতির জন্য দুধ পরীক্ষার যন্ত্র, বাল্ক মিল্ক কুলার, প্রশিক্ষণ এবং দুগ্ধ পরিকাঠামোয় সরকারি অনুদান ও সহজ ঋণ সহায়তা।",
    eligibility: {
      eligibleCategories: "Dairy farmers organized into Village Dairy Cooperative Societies (DCS), Milk Producer Companies (MPCs), and State Milk Federations.",
      eligibleCategoriesBn: "গ্রামীণ দুগ্ধ সমবায় সমিতি (DCS), মিল্ক প্রোডিউসার কোম্পানি ও দুগ্ধ চাষী গোষ্ঠী।",
      landholding: "Landless dairy farmers are also eligible as members of Village Dairy Cooperatives.",
      landholdingBn: "ভূমিহীন দুগ্ধ চাষীরাও গ্রামীণ দুগ্ধ সমবায়ের সদস্য হিসেবে উপকৃত হতে পারেন।",
      tenantFarmers: "Fully eligible as dairy cooperative members.",
      tenantFarmersBn: "ভাগচাষী ও ভূমিহীন পশুপালকরাও সমবায়ের মাধ্যমে যোগ্য।",
      womenFarmers: "Strongly prioritized — women-led dairy cooperatives receive focused institutional support.",
      womenFarmersBn: "মহিলা পরিচালিত দুগ্ধ সমবায় সমিতিগুলোকে বিশেষ অগ্রাধিকার দেওয়া হয়।",
      ageLimit: "18 years and above for cooperative membership.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "No fixed income limit.",
      incomeLimitBn: "আলাদা আয়সীমা নেই।",
      residency: "Resident dairy farmer within a participating milk union / state federation area.",
      residencyBn: "সংশ্লিষ্ট দুগ্ধ সমবায় / রাজ্য ফেডারেশন এলাকার বাসিন্দা।"
    },
    whoCanApply: [
      "Dairy farmers joining or forming Village Dairy Cooperative Societies",
      "Women dairy farmers and Women SHG milk societies",
      "State Milk Federations and Milk Producer Companies"
    ],
    whoCanApplyBn: [
      "গ্রামীণ দুগ্ধ সমবায় সমিতির সদস্য বা নতুন সমিতি গড়তে ইচ্ছুক দুগ্ধ চাষী",
      "মহিলা দুগ্ধ চাষী ও মহিলা দুগ্ধ সমবায়",
      "মিল্ক প্রোডিউসার কোম্পানি ও জেলা দুগ্ধ সংঘ"
    ],
    whoCannotApply: [
      "Unregistered private intermediaries outside cooperative/eligible implementing structures"
    ],
    whoCannotApplyBn: [
      "অননুমোদিত মধ্যস্বত্বভোগী এই প্রকল্পের আওতায় নয়"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card & Bank Account Passbook", bn: "আধার কার্ড ও ব্যাংকের পাসবই", mandatory: true },
      { en: "Dairy Cooperative Society Registration / Membership Record", bn: "দুগ্ধ সমবায় সমিতির রেজিস্ট্রেশন বা সদস্যপদ নথি", mandatory: true },
      { en: "Livestock / Cattle Tagging (Pashu Aadhaar / Bharat Pashudhan) where applicable", bn: "গরু-মহিষের পশু আধার ট্যাগিং (প্রযোজ্য ক্ষেত্রে)", mandatory: false }
    ],
    applicationProcess: "View official NPDD guidelines on dahd.nic.in and apply through your District Milk Union / State Milk Federation (e.g., Benmilk in West Bengal) or Block Animal Resources Development (ARD) office.",
    applicationProcessBn: "dahd.nic.in-এ বিস্তারিত নির্দেশিকা দেখুন এবং জেলা দুগ্ধ সংঘ বা ব্লক প্রাণিসম্পদ বিকাশ দপ্তরের (BLDO / ARD Office) মাধ্যমে আবেদন করুন।",
    officialPortalUrl: "https://dahd.nic.in/",
    offlineProcess: "Contact your Block Livestock Development Officer (BLDO) or District Cooperative Milk Producers' Union to enroll your village dairy group.",
    offlineProcessBn: "ব্লক প্রাণিসম্পদ বিকাশ আধিকারিকের (BLDO) অফিস বা জেলা দুগ্ধ সমবায় ইউনিয়নে যোগাযোগ করুন।",
    department: "Department of Animal Husbandry and Dairying (DAHD), Ministry of Fisheries, Animal Husbandry & Dairying",
    departmentBn: "পশুপালন ও দুগ্ধ দপ্তর (DAHD), ভারত সরকার",
    helpline: "1800-180-1551 / Local BLDO Office",
    helplineBn: "১৮০০-১৮০-১৫৫১ / ব্লক প্রাণিসম্পদ অফিস (BLDO)",
    helplineTel: "18001801551",
    deadline: "Ongoing via State Implementing Agencies",
    deadlineBn: "রাজ্য প্রাণিসম্পদ ও দুগ্ধ সংস্থার মাধ্যমে সারা বছর চালু",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://dahd.nic.in/",
    officialSourceName: "Department of Animal Husbandry & Dairying (dahd.nic.in)",
    published: true
  },
  {
    id: "nlm-poultry",
    name: "National Livestock Mission (NLM) — Rural Poultry Entrepreneurship",
    nameBn: "জাতীয় প্রাণিসম্পদ মিশন (NLM — গ্রামীণ পোল্ট্রি ও হাঁস-মুরগি পালন)",
    category: "POULTRY_FARMING",
    secondaryCategories: ["LIVESTOCK_DEV", "AGRI_ENTREPRENEURSHIP", "WOMEN_FARMER"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & UTs across India",
    applicableRegionBn: "ভারতের সকল রাজ্য ও কেন্দ্রশাসিত অঞ্চল",
    applicableDistricts: [],
    purpose: "To generate rural employment and increase egg/meat production by providing capital subsidy for low-input rural poultry breeding farms, hatcheries, and brooder units.",
    purposeBn: "গ্রামীণ পোল্ট্রি ফার্ম, হ্যাচারি ও দেশি মুরগি পালন খামার স্থাপনের জন্য মূলধন ভর্তুকি দিয়ে গ্রামীণ কর্মসংস্থান ও আয় বাড়ানো।",
    benefits: "50% capital subsidy (up to ₹25 lakh ceiling for eligible rural poultry parent farm / hatchery units) as per official NLM guidelines, released directly upon verification and bank loan/self-finance tie-up.",
    benefitsBn: "অফিশিয়াল NLM নির্দেশিকা অনুযায়ী গ্রামীণ পোল্ট্রি ব্রিডিং ফার্ম ও হ্যাচারি ইউনিটের জন্য ৫০% মূলধন ভর্তুকি (নির্ধারিত সীমা সর্বোচ্চ ₹২৫ লক্ষ টাকা পর্যন্ত)।",
    eligibility: {
      eligibleCategories: "Individuals, Farmers, SHGs, FPOs, FCOs, Joint Liability Groups (JLGs), and Section 8 companies.",
      eligibleCategoriesBn: "ব্যক্তিগত কৃষক, গ্রামীণ উদ্যোক্তা, স্বনির্ভর গোষ্ঠী (SHG), FPO ও সমবায় সমিতি।",
      landholding: "Own land OR valid leased land suitable for poultry shed/hatchery construction.",
      landholdingBn: "পোল্ট্রি খামারের জন্য নিজস্ব জমি অথবা বৈধ লিজ জমি থাকতে হবে।",
      tenantFarmers: "Eligible with valid registered lease agreement for the farm site.",
      tenantFarmersBn: "খামারের জমির বৈধ লিজ চুক্তি থাকলে যোগ্য।",
      womenFarmers: "Fully eligible individually or through Women SHGs.",
      womenFarmersBn: "মহিলা কৃষক ও স্বনির্ভর গোষ্ঠী সম্পূর্ণ যোগ্য।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "No fixed income ceiling; applicant must arrange balance project cost (bank loan or self-finance).",
      incomeLimitBn: "আলাদা আয়সীমা নেই; বাকি মূলধন ব্যাংক ঋণ বা নিজস্ব তহবিল থেকে দেখাতে হয়।",
      residency: "Resident of India.",
      residencyBn: "ভারতের স্থায়ী বাসিন্দা।"
    },
    whoCanApply: [
      "Rural youth, farmers, and women entrepreneurs starting rural poultry breeding/hatchery units",
      "SHGs, FPOs, JLGs, and Livestock Cooperatives",
      "Applicants with basic poultry training/experience"
    ],
    whoCanApplyBn: [
      "গ্রামীণ পোল্ট্রি ফার্ম বা হ্যাচারি শুরু করতে ইচ্ছুক কৃষক, যুবক ও মহিলা উদ্যোক্তা",
      "স্বনির্ভর গোষ্ঠী (SHG), FPO ও পশুপালন সমবায়",
      "পোল্ট্রি পালনে প্রশিক্ষণ বা অভিজ্ঞতাসম্পন্ন আবেদনকারী"
    ],
    whoCannotApply: [
      "Commercial broiler contract farming outside eligible low-input rural poultry breeding/hatchery criteria"
    ],
    whoCannotApplyBn: [
      "NLM-এর নির্দিষ্ট গ্রামীণ ব্রিডিং/হ্যাচারি মানদণ্ডের বাইরের বাণিজ্যিক চুক্তি খামার এই ভর্তুকির আওতায় নয়"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card & PAN Card", bn: "আধার কার্ড ও প্যান কার্ড", mandatory: true },
      { en: "Detailed Project Report (DPR) for Poultry Unit", bn: "পোল্ট্রি খামারের বিস্তারিত প্রজেক্ট রিপোর্ট (DPR)", mandatory: true },
      { en: "Land Ownership Document OR Registered Lease Agreement", bn: "জমির পর্চা অথবা রেজিস্টার্ড লিজ চুক্তি", mandatory: true },
      { en: "Bank Account Details & Loan Sanction / Self-Finance Proof", bn: "ব্যাংক অ্যাকাউন্ট ও ঋণ অনুমোদন / তহবিলের প্রমাণ", mandatory: true },
      { en: "Training / Experience Certificate in Poultry (if available)", bn: "পোল্ট্রি প্রশিক্ষণ বা অভিজ্ঞতার শংসাপত্র (থাকলে)", mandatory: false }
    ],
    applicationProcess: "Apply online directly on the official NLM Udyamimitra portal (nlm.udyamimitra.in) → upload DPR & land/KYC documents → State Implementing Agency screens & forwards to bank/DAHD for approval.",
    applicationProcessBn: "nlm.udyamimitra.in পোর্টালে অনলাইনে রেজিস্ট্রেশন করে DPR ও প্রয়োজনীয় নথি আপলোড করুন → রাজ্য প্রাণিসম্পদ দপ্তরের যাচাইয়ের পর ব্যাংক ও কেন্দ্রীয় অনুমোদন সম্পন্ন হয়।",
    officialPortalUrl: "https://nlm.udyamimitra.in/",
    offlineProcess: "Consult your Block Livestock Development Officer (BLDO) or District Deputy Director (ARD) for DPR guidance and local state backyard chick distribution schemes.",
    offlineProcessBn: "DPR তৈরিতে সাহায্য এবং রাজ্যের ক্ষুদ্র হাঁস-মুরগি ছানা বণ্টন প্রকল্পের জন্য ব্লক প্রাণিসম্পদ অফিসে (BLDO) যোগাযোগ করুন।",
    department: "Department of Animal Husbandry and Dairying (DAHD), Govt. of India",
    departmentBn: "পশুপালন ও দুগ্ধ দপ্তর (DAHD), ভারত সরকার",
    helpline: "NLM Portal Helpdesk (nlm.udyamimitra.in) / Local BLDO Office",
    helplineBn: "NLM পোর্টাল হেল্পডেস্ক / স্থানীয় BLDO অফিস",
    helplineTel: "",
    deadline: "Open year-round on nlm.udyamimitra.in (subject to annual budget availability)",
    deadlineBn: "সারা বছর nlm.udyamimitra.in পোর্টালে আবেদন খোলা থাকে",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://nlm.udyamimitra.in/",
    officialSourceName: "National Livestock Mission Portal (DAHD)",
    published: true
  },
  {
    id: "pmmsy-fisheries",
    name: "Pradhan Mantri Matsya Sampada Yojana (PMMSY)",
    nameBn: "প্রধানমন্ত্রী মৎস্য সম্পদা যোজনা (PMMSY — মৎস্য চাষ সহায়তা)",
    category: "FISHERIES_AQUACULTURE",
    secondaryCategories: ["WOMEN_FARMER", "AGRI_ENTREPRENEURSHIP", "STORAGE_COLD_CHAIN"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & UTs (Inland, Freshwater, Brackishwater & Marine Fisheries)",
    applicableRegionBn: "ভারতের সকল রাজ্য ও জেলা (মিষ্টি জল, নোনা জল ও সামুদ্রিক মৎস্য চাষ)",
    applicableDistricts: [],
    purpose: "To bring a Blue Revolution through sustainable development of fisheries, pond excavation, biofloc/RAS aquaculture, fish hatcheries, feed mills, ice plants, and fish transport.",
    purposeBn: "পুকুর খনন, বায়োফ্লক/RAS আধুনিক মাছ চাষ, মাছের হ্যাচারি, ফিশ ফিড মিল, বরফ কল ও মাছ পরিবহনের জন্য ভর্তুকি দিয়ে মৎস্য চাষীদের আয় বৃদ্ধি।",
    benefits: "Beneficiary-oriented subsidy of 40% of project cost for General category and 60% of project cost for SC, ST, and Women beneficiaries across approved aquaculture & post-harvest components.",
    benefitsBn: "অনুমোদিত মৎস্য চাষ প্রকল্পে সাধারণ শ্রেণির জন্য ৪০% এবং মহিলা, তফসিলি জাতি (SC) ও উপজাতি (ST) মৎস্য চাষীদের জন্য ৬০% পর্যন্ত সরকারি ভর্তুকি।",
    eligibility: {
      eligibleCategories: "Fishers, fish farmers, fish workers, Fisheries Cooperatives, FFPOs, SHGs, JLGs, and fisheries entrepreneurs.",
      eligibleCategoriesBn: "মৎস্যজীবী, মৎস্য চাষী, মৎস্য সমবায় সমিতি, FFPO, স্বনির্ভর গোষ্ঠী ও মৎস্য উদ্যোক্তা।",
      landholding: "Own pond/land OR valid registered lease (typically minimum 7 years lease for pond construction/infrastructure as per state norms).",
      landholdingBn: "নিজস্ব পুকুর/জমি অথবা বৈধ রেজিস্টার্ড লিজ চুক্তি (রাজ্যের নিয়ম অনুযায়ী নির্দিষ্ট মেয়াদের)।",
      tenantFarmers: "Eligible with valid registered pond/land lease agreement.",
      tenantFarmersBn: "পুকুর বা জমির বৈধ রেজিস্টার্ড লিজ চুক্তি থাকলে যোগ্য।",
      womenFarmers: "Special priority — eligible for higher 60% subsidy ceiling!",
      womenFarmersBn: "মহিলা মৎস্য চাষীরা সর্বোচ্চ ৬০% পর্যন্ত উচ্চতর ভর্তুকি পান।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "No fixed income ceiling.",
      incomeLimitBn: "কোনো নির্দিষ্ট আয়সীমা নেই।",
      residency: "Resident of the implementing State/District.",
      residencyBn: "সংশ্লিষ্ট রাজ্য ও জেলার স্থায়ী বাসিন্দা।"
    },
    whoCanApply: [
      "Freshwater & brackishwater fish farmers building ponds, biofloc, cages, or RAS units",
      "Women fishers and SC/ST fish farmers (60% subsidy category)",
      "Fisheries Cooperatives, SHGs, and Fish Farmer Producer Organizations (FFPOs)"
    ],
    whoCanApplyBn: [
      "নতুন পুকুর, বায়োফ্লক, খাঁচা বা আধুনিক মাছ চাষ করতে ইচ্ছুক মৎস্য চাষী",
      "মহিলা ও SC/ST মৎস্য চাষী (৬০% ভর্তুকি শ্রেণি)",
      "মৎস্য সমবায় সমিতি, স্বনির্ভর গোষ্ঠী ও FFPO"
    ],
    whoCannotApply: [
      "Projects without valid pond/land ownership or minimum required lease tenure"
    ],
    whoCannotApplyBn: [
      "জমি বা পুকুরের বৈধ মালিকানা বা নির্দিষ্ট মেয়াদের লিজ নথি না থাকলে"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card & Bank Passbook", bn: "আধার কার্ড ও ব্যাংকের পাসবই", mandatory: true },
      { en: "Land / Pond Ownership Record OR Registered Lease Agreement", bn: "পুকুর/জমির পর্চা অথবা রেজিস্টার্ড লিজ চুক্তি", mandatory: true },
      { en: "Detailed Project Report (DPR) for Selected PMMSY Activity", bn: "নির্বাচিত মৎস্য প্রকল্পের প্রজেক্ট রিপোর্ট (DPR)", mandatory: true },
      { en: "Caste Certificate (for SC/ST 60% subsidy)", bn: "জাতিগত শংসাপত্র (SC/ST হলে)", mandatory: false },
      { en: "Fisheries Registration / Cooperative Certificate (if applicable)", bn: "মৎস্যজীবী পরিচয়পত্র বা সমবায় নথি (প্রযোজ্য ক্ষেত্রে)", mandatory: false }
    ],
    applicationProcess: "Review official PMMSY components on pmmsy.dof.gov.in and submit your project proposal through your State Fisheries Department portal or District Fisheries Officer (ADF / FEO).",
    applicationProcessBn: "pmmsy.dof.gov.in পোর্টালে প্রকল্পের তালিকা দেখুন এবং রাজ্য মৎস্য দপ্তর বা ব্লক মৎস্য সম্প্রসারণ আধিকারিকের (FEO) মাধ্যমে আবেদন জমা দিন।",
    officialPortalUrl: "https://pmmsy.dof.gov.in/",
    offlineProcess: "Visit your Block Fishery Extension Officer (FEO) or Assistant Director of Fisheries (ADF) office with pond/land papers and Aadhaar to apply under annual district PMMSY targets.",
    offlineProcessBn: "পুকুর/জমির নথি ও আধার নিয়ে ব্লক মৎস্য দপ্তর (FEO) বা জেলা মৎস্য আধিকারিকের (ADF) অফিসে সরাসরি যোগাযোগ করুন।",
    department: "Department of Fisheries, Ministry of Fisheries, Animal Husbandry & Dairying, Govt. of India",
    departmentBn: "মৎস্য দপ্তর, ভারত সরকার ও রাজ্য মৎস্য দপ্তর",
    helpline: "1800-425-1660 (NFDB / Fisheries Helpline) / Block FEO",
    helplineBn: "১৮০০-৪২৫-১৬৬০ (মৎস্য হেল্পলাইন) / ব্লক মৎস্য অফিস (FEO)",
    helplineTel: "18004251660",
    deadline: "State annual PMMSY action plan submission windows",
    deadlineBn: "প্রতি বছর জেলা মৎস্য দপ্তরের নির্ধারিত সময় অনুযায়ী",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://pmmsy.dof.gov.in/",
    officialSourceName: "PMMSY Official Portal (Department of Fisheries)",
    published: true
  },
  {
    id: "nlm-livestock-ahidf",
    name: "National Livestock Mission (Goat, Sheep, Pig & Fodder) & Rashtriya Gokul Mission",
    nameBn: "পশুপালন উন্নয়ন — ছাগল, ভেড়া, শূকর, পশুখাদ্য ও গবাদি পশু উন্নয়ন (NLM ও RGM)",
    category: "LIVESTOCK_DEV",
    secondaryCategories: ["DAIRY_FARMING", "AGRI_ENTREPRENEURSHIP"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & UTs across India",
    applicableRegionBn: "ভারতের সকল রাজ্য ও কেন্দ্রশাসিত অঞ্চল",
    applicableDistricts: [],
    purpose: "To boost rural livestock productivity through breed improvement (Rashtriya Gokul Mission), goat/sheep/piggery breeding farms, fodder seed/silage units, and veterinary support.",
    purposeBn: "উন্নত জাতের গবাদি পশু উন্নয়ন, ছাগল-ভেড়া-শূকর খামার, সবুজ পশুখাদ্য/সাইলেজ উৎপাদন এবং পশুপালকদের আয় বাড়ানো।",
    benefits: "50% capital subsidy under NLM for eligible goat/sheep breeding farms (up to ₹50 lakh ceiling), piggery farms (up to ₹30 lakh), and fodder/silage units (up to ₹50 lakh), plus free/subsidized Artificial Insemination under Rashtriya Gokul Mission.",
    benefitsBn: "NLM-এর অধীনে ছাগল/ভেড়া খামার (সর্বোচ্চ ₹৫০ লক্ষ পর্যন্ত), শূকর খামার (সর্বোচ্চ ₹৩০ লক্ষ) ও পশুখাদ্য/সাইলেজ ইউনিটে ৫০% মূলধন ভর্তুকি এবং রাষ্ট্রীয় গোকুল মিশনে উন্নত কৃত্রিম প্রজনন পরিষেবা।",
    eligibility: {
      eligibleCategories: "Individuals, Livestock Farmers, SHGs, FPOs, Cooperatives, and JLGs.",
      eligibleCategoriesBn: "ব্যক্তিগত পশুপালক, কৃষক, স্বনির্ভর গোষ্ঠী (SHG), FPO ও সমবায় সমিতি।",
      landholding: "Owned or leased land required for commercial breeding farms/fodder units; landless livestock keepers can avail veterinary & AI services.",
      landholdingBn: "খামার ও পশুখাদ্য ইউনিটের জন্য নিজস্ব বা লিজ জমি; ভূমিহীন পশুপালকরাও বিনামূল্যে কৃত্রিম প্রজনন ও পশুচিকিৎসা পরিষেবা পান।",
      tenantFarmers: "Eligible with valid registered lease agreement for breeding farm units.",
      tenantFarmersBn: "বৈধ লিজ চুক্তি থাকলে খামার ইউনিটের জন্য যোগ্য।",
      womenFarmers: "Fully eligible; goatry & dairy are major livelihoods for rural women farmers.",
      womenFarmersBn: "মহিলা পশুপালক ও স্বনির্ভর গোষ্ঠী সম্পূর্ণ যোগ্য।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "No fixed income limit.",
      incomeLimitBn: "আলাদা আয়সীমা নেই।",
      residency: "Resident of India.",
      residencyBn: "ভারতের স্থায়ী বাসিন্দা।"
    },
    whoCanApply: [
      "Farmers and rural entrepreneurs starting goat, sheep, piggery, or fodder/silage units",
      "Cattle & buffalo rearers seeking Rashtriya Gokul Mission breed improvement",
      "Women SHGs and Livestock Cooperatives"
    ],
    whoCanApplyBn: [
      "ছাগল, ভেড়া, শূকর বা পশুখাদ্য/সাইলেজ ইউনিট করতে ইচ্ছুক কৃষক ও উদ্যোক্তা",
      "উন্নত জাতের গবাদি পশু পালনে আগ্রহী কৃষক",
      "মহিলা স্বনির্ভর গোষ্ঠী ও পশুপালন সমবায়"
    ],
    whoCannotApply: [
      "Projects without bank loan tie-up or verified self-finance arrangement for remaining capital"
    ],
    whoCannotApplyBn: [
      "বাকি মূলধনের জন্য ব্যাংক ঋণ বা নিজস্ব তহবিলের প্রমাণ না থাকলে বড় খামার ভর্তুকি অনুমোদিত হয় না"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card & PAN Card", bn: "আধার কার্ড ও প্যান কার্ড", mandatory: true },
      { en: "Detailed Project Report (DPR) for Livestock / Fodder Unit", bn: "খামারের বিস্তারিত প্রজেক্ট রিপোর্ট (DPR)", mandatory: true },
      { en: "Land Ownership OR Registered Lease Document", bn: "জমির পর্চা অথবা রেজিস্টার্ড লিজ চুক্তি", mandatory: true },
      { en: "Bank Account & Credit / Finance Proof", bn: "ব্যাংক অ্যাকাউন্ট ও অর্থায়নের নথি", mandatory: true }
    ],
    applicationProcess: "Apply online at nlm.udyamimitra.in for NLM breeding/fodder subsidies or ahidf.udyamimitra.in for livestock processing/feed plants. For village veterinary & breed services, contact your Block BLDO office.",
    applicationProcessBn: "বড় খামার ভর্তুকির জন্য nlm.udyamimitra.in পোর্টালে অনলাইনে আবেদন করুন। সাধারণ পশুচিকিৎসা ও কৃত্রিম প্রজননের জন্য ব্লক প্রাণিসম্পদ অফিসে (BLDO) যোগাযোগ করুন।",
    officialPortalUrl: "https://nlm.udyamimitra.in/",
    offlineProcess: "Visit your Block Livestock Development Officer (BLDO) or District Animal Resources Development (ARD) office.",
    offlineProcessBn: "ব্লক প্রাণিসম্পদ বিকাশ আধিকারিকের (BLDO) অফিসে সরাসরি যোগাযোগ করুন।",
    department: "Department of Animal Husbandry and Dairying (DAHD), Govt. of India",
    departmentBn: "পশুপালন ও দুগ্ধ দপ্তর (DAHD), ভারত সরকার",
    helpline: "1800-180-1551 / Local BLDO Office",
    helplineBn: "১৮০০-১৮০-১৫৫১ / স্থানীয় BLDO অফিস",
    helplineTel: "18001801551",
    deadline: "Open year-round on official NLM portal",
    deadlineBn: "সারা বছর অফিশিয়াল NLM পোর্টালে আবেদন খোলা থাকে",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://dahd.nic.in/",
    officialSourceName: "DAHD & NLM Official Portals",
    published: true
  },
  {
    id: "mksp-day-nrlm",
    name: "Mahila Kisan Sashaktikaran Pariyojana (MKSP) & DAY-NRLM (Anandadhara WB)",
    nameBn: "মহিলা কিষাণ সশক্তিকরণ পরিযোজনা (MKSP) ও স্বনির্ভর গোষ্ঠী সহায়তা (DAY-NRLM / আনন্দধারা)",
    category: "WOMEN_FARMER",
    secondaryCategories: ["RURAL_LIVELIHOOD", "ORGANIC_NATURAL", "TRAINING_SKILL"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All Rural Blocks across India (Implemented as Anandadhara / WBSRLM in West Bengal)",
    applicableRegionBn: "ভারতের সকল গ্রামীণ ব্লক (পশ্চিমবঙ্গে 'আনন্দধারা / WBSRLM' হিসেবে রূপায়িত)",
    applicableDistricts: [],
    purpose: "To empower women farmers by enhancing their participation, sustainable agro-ecological skills, livestock/kitchen-garden livelihoods, and low-cost SHG financial inclusion.",
    purposeBn: "গ্রামীণ মহিলা কৃষকদের টেকসই চাষাবাদ প্রশিক্ষণ, পুষ্টি বাগান, পশুপালন, বীজ ব্যাংক এবং স্বনির্ভর গোষ্ঠীর (SHG) মাধ্যমে কম সুদে ব্যাংক ঋণ দিয়ে স্বনির্ভর করা।",
    benefits: "Community Resource Person (Krishi Sakhi / Pashu Sakhi) handholding, sustainable farming & livestock training, revolving fund & community investment fund through SHGs, and interest-subvented SHG bank credit.",
    benefitsBn: "কৃষি সখী ও পশু সখীর মাধ্যমে চাষাবাদ ও পশুপালন প্রশিক্ষণ, স্বনির্ভর গোষ্ঠীর (SHG) রিভলভিং ফান্ড, কমিউনিটি ইনভেস্টমেন্ট ফান্ড এবং স্বল্প সুদে ব্যাংক ঋণ সহায়তা।",
    eligibility: {
      eligibleCategories: "Rural women farmers and women from rural households mobilized into Self-Help Groups (SHGs) under State Rural Livelihood Missions.",
      eligibleCategoriesBn: "রাজ্য গ্রামীণ জীবিকা মিশনের (পশ্চিমবঙ্গে আনন্দধারা) অধীনে স্বনির্ভর গোষ্ঠীর (SHG) সদস্য গ্রামীণ মহিলা কৃষক।",
      landholding: "Landless, marginal, and smallholding rural women farmers are ALL eligible.",
      landholdingBn: "ভূমিহীন, প্রান্তিক ও ক্ষুদ্র জমির সকল গ্রামীণ মহিলা কৃষক যোগ্য।",
      tenantFarmers: "Fully eligible — landless and tenant women cultivators are specifically prioritized.",
      tenantFarmersBn: "ভূমিহীন ও ভাগচাষী মহিলা কৃষকদের বিশেষ অগ্রাধিকার দেওয়া হয়।",
      womenFarmers: "Exclusively dedicated to empowering Women Farmers and Women SHGs.",
      womenFarmersBn: "এটি বিশেষভাবে মহিলা কৃষক ও মহিলা স্বনির্ভর গোষ্ঠীর জন্য তৈরি।",
      ageLimit: "18 years and above (adult women SHG members).",
      ageLimitBn: "১৮ বছর বা তার বেশি বয়সী মহিলা স্বনির্ভর গোষ্ঠীর সদস্য।",
      incomeLimit: "Targeted primarily at rural poor & vulnerable households identified through participatory rural assessment / SECC.",
      incomeLimitBn: "মূলত গ্রামীণ দরিদ্র ও প্রান্তিক পরিবারের মহিলাদের জন্য।",
      residency: "Rural resident of a Gram Panchayat covered under SRLM.",
      residencyBn: "গ্রাম পঞ্চায়েত এলাকার স্থায়ী বাসিন্দা।"
    },
    whoCanApply: [
      "Rural women engaged in farming, kitchen gardening, seed saving, goatry, poultry, or dairy",
      "Women Self-Help Groups (SHGs) under Anandadhara (WB) or any State Rural Livelihood Mission",
      "Landless women agricultural workers"
    ],
    whoCanApplyBn: [
      "চাষাবাদ, পুষ্টি বাগান, পশুপালন, হাঁস-মুরগি বা দুগ্ধ চাষে যুক্ত গ্রামীণ মহিলা",
      "আনন্দধারা (পশ্চিমবঙ্গ) বা যেকোনো রাজ্যের স্বনির্ভর গোষ্ঠীর (SHG) সদস্য",
      "ভূমিহীন মহিলা কৃষি শ্রমিক"
    ],
    whoCannotApply: [
      "Male applicants (this programme is dedicated to rural women SHGs under DAY-NRLM)"
    ],
    whoCannotApplyBn: [
      "এটি শুধুমাত্র গ্রামীণ মহিলা ও মহিলা স্বনির্ভর গোষ্ঠীর (SHG) জন্য নির্ধারিত প্রকল্প"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card & Voter ID", bn: "আধার কার্ড ও ভোটার কার্ড", mandatory: true },
      { en: "SHG Membership Passbook / Resolution", bn: "স্বনির্ভর গোষ্ঠীর (SHG) সদস্যপদ নথি / পাসবই", mandatory: true },
      { en: "Personal or SHG Bank Account Passbook", bn: "ব্যক্তিগত বা স্বনির্ভর গোষ্ঠীর ব্যাংকের পাসবই", mandatory: true }
    ],
    applicationProcess: "Official guidelines and SHG tracking are published on aajeevika.gov.in. Women farmers enroll locally via their Gram Panchayat SHG Sangha / Block Mission Management Unit (BMMU).",
    applicationProcessBn: "aajeevika.gov.in পোর্টালে প্রকল্পের তথ্য দেখুন এবং গ্রাম পঞ্চায়েতের স্বনির্ভর গোষ্ঠী সংঘ বা ব্লক আনন্দধারা (BMMU) অফিসের মাধ্যমে যুক্ত হন।",
    officialPortalUrl: "https://aajeevika.gov.in/",
    offlineProcess: "Contact your Gram Panchayat Women SHG Sangha / Sangha Samabay or Block Mission Management Unit (BMMU / Anandadhara Office at BDO).",
    offlineProcessBn: "আপনার গ্রাম পঞ্চায়েতের মহিলা স্বনির্ভর গোষ্ঠী সংঘ বা বিডিও অফিসে অবস্থিত ব্লক আনন্দধারা (BMMU) দপ্তরে যোগাযোগ করুন।",
    department: "Ministry of Rural Development (DAY-NRLM), Govt. of India & State Rural Livelihood Missions",
    departmentBn: "গ্রামীণ উন্নয়ন মন্ত্রক (DAY-NRLM), ভারত সরকার ও রাজ্য গ্রামীণ জীবিকা মিশন",
    helpline: "1800-180-1551 / Block SRLM (BMMU) Office",
    helplineBn: "১৮০০-১৮০-১৫৫১ / ব্লক আনন্দধারা (BMMU) অফিস",
    helplineTel: "18001801551",
    deadline: "Continuous enrollment via local SHG Sanghas & BMMU",
    deadlineBn: "সারা বছর স্থানীয় স্বনির্ভর গোষ্ঠী সংঘের মাধ্যমে যুক্ত হওয়া যায়",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://aajeevika.gov.in/",
    officialSourceName: "DAY-NRLM / Aajeevika Official Portal (MoRD)",
    published: true
  },
  {
    id: "namo-drone-didi",
    name: "Namo Drone Didi — Women SHG Agricultural Drone Scheme",
    nameBn: "নমো ড্রোন দিদি — মহিলা স্বনির্ভর গোষ্ঠীর কৃষি ড্রোন প্রকল্প",
    category: "WOMEN_FARMER",
    secondaryCategories: ["AGRI_MACHINERY", "AGRI_ENTREPRENEURSHIP", "RURAL_LIVELIHOOD"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "Selected Women SHG Clusters across India",
    applicableRegionBn: "ভারতের নির্বাচিত মহিলা স্বনির্ভর গোষ্ঠী ক্লাস্টারসমূহ",
    applicableDistricts: [],
    purpose: "To equip selected Women Self-Help Groups (SHGs) with agricultural drones so they can offer nano-fertilizer and pesticide spraying services to farmers as a sustainable rural business.",
    purposeBn: "নির্বাচিত মহিলা স্বনির্ভর গোষ্ঠীগুলোকে (SHG) কৃষি ড্রোন ও পাইলট প্রশিক্ষণ দেওয়া, যাতে তারা কৃষকদের জমিতে স্প্রে পরিষেবা দিয়ে নিয়মিত আয় করতে পারে।",
    benefits: "Central Financial Assistance of 80% of the cost of the drone and accessories (up to a maximum of ₹8 lakh) to selected Women SHGs, plus certified drone pilot training for a qualified SHG member.",
    benefitsBn: "নির্বাচিত মহিলা স্বনির্ভর গোষ্ঠীকে (SHG) কৃষি ড্রোন ও আনুষঙ্গিক যন্ত্রাংশের খরচের ৮০% (সর্বোচ্চ ₹৮ লক্ষ টাকা পর্যন্ত) কেন্দ্রীয় ভর্তুকি এবং একজন মহিলা সদস্যকে বিনামূল্যে ড্রোন পাইলট প্রশিক্ষণ।",
    eligibility: {
      eligibleCategories: "Selected Women Self-Help Groups (SHGs) under DAY-NRLM in identified agricultural clusters.",
      eligibleCategoriesBn: "DAY-NRLM-এর অধীনে চিহ্নিত কৃষি ক্লাস্টারের নির্বাচিত মহিলা স্বনির্ভর গোষ্ঠী (SHG)।",
      landholding: "No personal land ownership required for SHG members.",
      landholdingBn: "নিজস্ব জমির মালিকানা বাধ্যতামূলক নয়।",
      tenantFarmers: "Women from tenant/landless households in eligible SHGs can participate.",
      tenantFarmersBn: "যোগ্য SHG-র ভূমিহীন ও ভাগচাষী পরিবারের মহিলারাও অংশ নিতে পারেন।",
      womenFarmers: "Exclusively for Women SHGs (drone pilot must be a woman SHG member aged 18+).",
      womenFarmersBn: "সম্পূর্ণভাবে মহিলা স্বনির্ভর গোষ্ঠীর জন্য নির্ধারিত (ড্রোন পাইলট ১৮+ বছর বয়সী মহিলা সদস্য)।",
      ageLimit: "18 years and above for designated Woman Drone Pilot.",
      ageLimitBn: "ড্রোন পাইলট প্রশিক্ষণের জন্য বয়স ১৮ বছর বা তার বেশি।",
      incomeLimit: "SHG must meet DAY-NRLM cluster eligibility norms.",
      incomeLimitBn: "DAY-NRLM ক্লাস্টারের যোগ্যতা মানদণ্ড পূরণ করতে হবে।",
      residency: "Rural area in an identified agriculture cluster.",
      residencyBn: "নির্বাচিত গ্রামীণ কৃষি ক্লাস্টার এলাকার বাসিন্দা।"
    },
    whoCanApply: [
      "Active Women SHGs under DAY-NRLM selected in identified fertilizer/agriculture clusters",
      "Women SHG members willing to undergo certified agricultural drone pilot training"
    ],
    whoCanApplyBn: [
      "চিহ্নিত কৃষি ক্লাস্টারের সক্রিয় মহিলা স্বনির্ভর গোষ্ঠী (SHG)",
      "কৃষি ড্রোন পাইলট প্রশিক্ষণ নিতে আগ্রহী মহিলা SHG সদস্য"
    ],
    whoCannotApply: [
      "Individual applicants not belonging to a selected DAY-NRLM Women SHG"
    ],
    whoCannotApplyBn: [
      "নির্বাচিত মহিলা স্বনির্ভর গোষ্ঠীর (SHG) বাইরে একক ব্যক্তি সরাসরি আবেদন করতে পারবেন না"
    ],
    requiredDocuments: [
      { en: "SHG Registration & Bank Account Details under DAY-NRLM", bn: "DAY-NRLM স্বনির্ভর গোষ্ঠীর নথি ও ব্যাংকের পাসবই", mandatory: true },
      { en: "Aadhaar Card & Age/Education Proof of Nominated Woman Pilot", bn: "মনোনীত মহিলা ড্রোন পাইলটের আধার কার্ড ও বয়স/শিক্ষার প্রমাণ", mandatory: true },
      { en: "State SRLM / Lead Fertilizer Company Cluster Selection Confirmation", bn: "রাজ্য SRLM / ক্লাস্টার নির্বাচনের অনুমোদনপত্র", mandatory: true }
    ],
    applicationProcess: "SHG selection is coordinated through State Rural Livelihood Missions (SRLM), Lead Fertilizer Companies (LFCs), and the Department of Agriculture & Farmers Welfare.",
    applicationProcessBn: "রাজ্য গ্রামীণ জীবিকা মিশন (SRLM / আনন্দধারা) এবং জেলা কৃষি দপ্তরের মাধ্যমে যোগ্য মহিলা স্বনির্ভর গোষ্ঠী নির্বাচন করা হয়।",
    officialPortalUrl: "https://agricoop.nic.in/",
    offlineProcess: "Inquire at your Block SRLM (BMMU / Anandadhara) office or District Agriculture Office about Namo Drone Didi cluster selection in your district.",
    offlineProcessBn: "আপনার জেলায় নমো ড্রোন দিদি ক্লাস্টার নির্বাচন সম্পর্কে জানতে ব্লক আনন্দধারা (BMMU) বা জেলা কৃষি অফিসে যোগাযোগ করুন।",
    department: "Department of Agriculture & Farmers Welfare & Ministry of Rural Development, Govt. of India",
    departmentBn: "কৃষি ও কৃষক কল্যাণ দপ্তর ও গ্রামীণ উন্নয়ন মন্ত্রক, ভারত সরকার",
    helpline: "1800-180-1551 / State SRLM Office",
    helplineBn: "১৮০০-১৮০-১৫৫১ / রাজ্য SRLM অফিস",
    helplineTel: "18001801551",
    deadline: "Implemented in phased clusters (2024–2026) as notified by DA&FW",
    deadlineBn: "সরকারি নির্দেশিকা অনুযায়ী পর্যায়ক্রমে ক্লাস্টার ভিত্তিক নির্বাচন হয়",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://agricoop.nic.in/",
    officialSourceName: "Department of Agriculture & Farmers Welfare (agricoop.nic.in)",
    published: true
  },
  {
    id: "fpo-10000",
    name: "Formation & Promotion of 10,000 Farmer Producer Organizations (FPOs)",
    nameBn: "কৃষক উৎপাদক সংস্থা (FPO) গঠন ও সহায়তা প্রকল্প",
    category: "FPO",
    secondaryCategories: ["AGRI_MARKETING", "AGRI_ENTREPRENEURSHIP"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & UTs (Implemented via SFAC, NABARD & NCDC)",
    applicableRegionBn: "ভারতের সকল রাজ্য ও জেলা (SFAC, NABARD এবং NCDC-এর মাধ্যমে)",
    applicableDistricts: [],
    purpose: "To aggregate small and marginal farmers into collective business enterprises (FPOs) for bulk input purchasing, shared machinery, value addition, and better crop prices.",
    purposeBn: "ক্ষুদ্র ও প্রান্তিক কৃষকদের একত্রিত করে কৃষক উৎপাদক সংস্থা (FPO) গঠন করা, যাতে কম দামে সার-বীজ কেনা এবং ফসলের ন্যায্য বাজারদর পাওয়া যায়।",
    benefits: "Handholding support for 5 years via Cluster-Based Business Organizations (CBBOs), financial management support up to ₹18 lakh per FPO over 3 years, matching Equity Grant up to ₹15 lakh per FPO, and Credit Guarantee facility up to ₹2 crore project loan.",
    benefitsBn: "৫ বছরের বিশেষজ্ঞ সহায়তা, ৩ বছরে FPO পরিচালনার জন্য সর্বোচ্চ ₹১৮ লক্ষ টাকা আর্থিক সাহায্য, সর্বোচ্চ ₹১৫ লক্ষ টাকা ম্যাচিং ইকুইটি গ্রান্ট এবং ₹২ কোটি টাকা পর্যন্ত ঋণে ক্রেডিট গ্যারান্টি।",
    eligibility: {
      eligibleCategories: "Groups of farmers registering as a Farmer Producer Company (Companies Act) or Cooperative Society — minimum 300 farmer members in plain areas and 100 in hilly/North-East areas.",
      eligibleCategoriesBn: "সমতল এলাকায় ন্যূনতম ৩০০ জন এবং পাহাড়ি এলাকায় ন্যূনতম ১০০ জন কৃষক নিয়ে গঠিত নথিভুক্ত FPO / সমবায়।",
      landholding: "Primarily small and marginal farmers (at least 50% small/marginal/landless tenant farmers encouraged).",
      landholdingBn: "মূলত ক্ষুদ্র, প্রান্তিক ও ভূমিহীন ভাগচাষী কৃষকদের নিয়ে গঠিত।",
      tenantFarmers: "Fully eligible to become FPO farmer-shareholders.",
      tenantFarmersBn: "ভাগচাষী ও লিজ কৃষকরাও FPO-র শেয়ারহোল্ডার সদস্য হতে পারেন।",
      womenFarmers: "Fully eligible; women-exclusive FPOs are strongly promoted.",
      womenFarmersBn: "মহিলা কৃষকদের আলাদা FPO গঠনে বিশেষ উৎসাহ দেওয়া হয়।",
      ageLimit: "18 years and above for FPO members/directors.",
      ageLimitBn: "সদস্য ও পরিচালকদের বয়স ১৮ বছর বা তার বেশি।",
      incomeLimit: "No fixed income ceiling.",
      incomeLimitBn: "নির্দিষ্ট আয়সীমা নেই।",
      residency: "Farmers residing in the same block / contiguous agricultural cluster.",
      residencyBn: "একই ব্লক বা সংলগ্ন কৃষি এলাকার কৃষক।"
    },
    whoCanApply: [
      "Registered Farmer Producer Companies & Cooperatives formed under SFAC / NABARD / NCDC",
      "Small, marginal, tenant, and women farmers joining a local FPO"
    ],
    whoCanApplyBn: [
      "SFAC / NABARD / NCDC-এর মাধ্যমে গঠিত কৃষক উৎপাদক সংস্থা (FPO)",
      "স্থানীয় FPO-তে যোগ দিতে ইচ্ছুক ক্ষুদ্র, প্রান্তিক, ভাগচাষী ও মহিলা কৃষক"
    ],
    whoCannotApply: [
      "Individual private traders or non-farmer commercial entities"
    ],
    whoCannotApplyBn: [
      "ব্যক্তিগত ব্যবসায়ী বা অ-কৃষি বাণিজ্যিক সংস্থা FPO সুবিধা পায় না"
    ],
    requiredDocuments: [
      { en: "FPO Incorporation / Cooperative Registration Certificate", bn: "FPO নিবন্ধন / সমবায় সার্টিফিকেট", mandatory: true },
      { en: "Farmer Shareholder Register with Aadhaar & Land/Cultivation Details", bn: "কৃষক সদস্যদের তালিকা, আধার ও চাষের বিবরণ", mandatory: true },
      { en: "FPO Bank Account, PAN & Board Resolution", bn: "FPO-র ব্যাংক অ্যাকাউন্ট, প্যান ও বোর্ড রেজোলিউশন", mandatory: true }
    ],
    applicationProcess: "Access FPO registration guidelines, Equity Grant & Credit Guarantee details on sfacindia.com or nabard.org and coordinate with your district CBBO / NABARD DDM.",
    applicationProcessBn: "sfacindia.com অথবা nabard.org পোর্টালে FPO নির্দেশিকা দেখুন এবং জেলা নাবার্ড আধিকারিক (DDM) বা ব্লক কৃষি দপ্তরের (ADA) সাথে যোগাযোগ করুন।",
    officialPortalUrl: "https://sfacindia.com/",
    offlineProcess: "Contact your District NABARD DDM, Block Agriculture Office (ADA), or KVK to connect with an empanelled CBBO in your district.",
    offlineProcessBn: "জেলা নাবার্ড অফিস (DDM), ব্লক কৃষি অফিস (ADA) বা কৃষি বিজ্ঞান কেন্দ্রে (KVK) যোগাযোগ করে আপনার এলাকার অনুমোদিত CBBO-র সাহায্য নিন।",
    department: "Department of Agriculture & Farmers Welfare (SFAC / NABARD / NCDC), Govt. of India",
    departmentBn: "কৃষি মন্ত্রক (SFAC / NABARD / NCDC), ভারত সরকার",
    helpline: "1800-180-1551 / District NABARD Office",
    helplineBn: "১৮০০-১৮০-১৫৫১ / জেলা নাবার্ড (NABARD) অফিস",
    helplineTel: "18001801551",
    deadline: "Ongoing under DA&FW FPO promotion guidelines",
    deadlineBn: "সরকারি নির্দেশিকা অনুযায়ী চলমান",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://sfacindia.com/",
    officialSourceName: "Small Farmers' Agribusiness Consortium (sfacindia.com)",
    published: true
  },
  {
    id: "enam-marketing",
    name: "e-NAM (National Agriculture Market — Online Crop Trading Portal)",
    nameBn: "ই-ন্যাম (e-NAM — জাতীয় অনলাইন কৃষি বাজার ও ন্যায্য বিক্রয় পোর্টাল)",
    category: "AGRI_MARKETING",
    secondaryCategories: ["FPO"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "Participating States",
    applicableRegion: "Integrated APMC Mandis across Participating States & UTs (including West Bengal integrated mandis)",
    applicableRegionBn: "ভারতের অংশগ্রহণকারী রাজ্যগুলোর যুক্ত APMC মান্ডি (পশ্চিমবঙ্গের যুক্ত মান্ডিসহ)",
    applicableDistricts: [],
    purpose: "To create a unified national electronic market linking existing APMC mandis so farmers receive transparent price discovery, electronic assaying, and direct online payment.",
    purposeBn: "দেশের কৃষি মান্ডিগুলোকে একসাথে অনলাইনে যুক্ত করে কৃষকদের স্বচ্ছ নিলাম, সঠিক ওজন-মান যাচাই এবং সরাসরি ব্যাংক অ্যাকাউন্টে ফসলের ন্যায্য দাম পাইয়ে দেওয়া।",
    benefits: "Free farmer registration, transparent online bidding across buyers/traders, quality assaying at integrated mandis, and direct online settlement to farmer bank accounts.",
    benefitsBn: "বিনামূল্যে কৃষক রেজিস্ট্রেশন, একাধিক ক্রেতার মধ্যে স্বচ্ছ অনলাইন নিলাম, মান্ডিতে ফসলের গুণমান পরীক্ষা এবং সরাসরি ব্যাংক অ্যাকাউন্টে বিক্রির টাকা।",
    eligibility: {
      eligibleCategories: "All farmers, FPOs, and agricultural producers selling crops at e-NAM integrated mandis.",
      eligibleCategoriesBn: "e-NAM যুক্ত মান্ডিতে ফসল বিক্রি করতে ইচ্ছুক সকল কৃষক ও FPO।",
      landholding: "No land size restriction.",
      landholdingBn: "জমির পরিমাণের কোনো বাধ্যবাধকতা নেই।",
      tenantFarmers: "Fully eligible — any cultivating farmer can register free of cost.",
      tenantFarmersBn: "ভাগচাষী ও লিজ কৃষকরাও সম্পূর্ণ বিনামূল্যে রেজিস্ট্রেশন করতে পারেন।",
      womenFarmers: "Fully eligible.",
      womenFarmersBn: "মহিলা কৃষকরা সম্পূর্ণ যোগ্য।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "No income ceiling.",
      incomeLimitBn: "কোনো আয়সীমা নেই।",
      residency: "Resident of India.",
      residencyBn: "ভারতের বাসিন্দা।"
    },
    whoCanApply: [
      "Any farmer selling produce at an e-NAM integrated APMC mandi",
      "FPOs selling aggregated crop lots online across states",
      "Tenant farmers and women farmers"
    ],
    whoCanApplyBn: [
      "e-NAM যুক্ত মান্ডিতে ফসল বিক্রি করতে ইচ্ছুক যেকোনো কৃষক",
      "একসাথে ফসল বিক্রি করতে ইচ্ছুক FPO",
      "ভাগচাষী ও মহিলা কৃষক"
    ],
    whoCannotApply: [
      "Direct online mandi bidding requires bringing or registering lots with an e-NAM integrated mandi / FPO trading module"
    ],
    whoCannotApplyBn: [
      "অনলাইন নিলামের জন্য নিকটবর্তী e-NAM যুক্ত মান্ডি বা FPO-র মাধ্যমে ফসল নথিভুক্ত করতে হয়"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card or Government Photo ID", bn: "আধার কার্ড বা সরকারি পরিচয়পত্র", mandatory: true },
      { en: "Bank Account Passbook / IFSC Code (for direct payment)", bn: "ব্যাংকের পাসবই ও IFSC কোড (সরাসরি পেমেন্টের জন্য)", mandatory: true },
      { en: "Active Mobile Number", bn: "সচল মোবাইল নম্বর", mandatory: true }
    ],
    applicationProcess: "Register free online at enam.gov.in ('Registration' → 'Farmer') or via the e-NAM Mobile App by entering your state, nearest e-NAM mandi, ID, and bank details.",
    applicationProcessBn: "enam.gov.in পোর্টালে বা e-NAM মোবাইল অ্যাপে গিয়ে 'Farmer Registration'-এ ক্লিক করে রাজ্য, নিকটবর্তী মান্ডি, পরিচয়পত্র ও ব্যাংকের তথ্য দিয়ে বিনামূল্যে রেজিস্ট্রেশন করুন।",
    officialPortalUrl: "https://enam.gov.in/",
    offlineProcess: "Visit the gate registration desk of your nearest e-NAM integrated APMC / Krishak Bazar mandi with Aadhaar and Bank Passbook for instant free enrollment.",
    offlineProcessBn: "আধার ও ব্যাংকের পাসবই নিয়ে নিকটবর্তী e-NAM যুক্ত কৃষি মান্ডি বা কৃষক বাজারের রেজিস্ট্রেশন ডেস্কে গিয়ে তাৎক্ষণিক নাম লেখান।",
    department: "Small Farmers' Agribusiness Consortium (SFAC), Dept. of Agriculture & Farmers Welfare",
    departmentBn: "SFAC, কৃষি ও কৃষক কল্যাণ দপ্তর, ভারত সরকার",
    helpline: "1800-270-0224 (e-NAM Toll-Free Helpline)",
    helplineBn: "১৮০০-২৭০-০২২৪ (e-NAM টোল-ফ্রি হেল্পলাইন)",
    helplineTel: "18002700224",
    deadline: "Open year-round",
    deadlineBn: "সারা বছর খোলা থাকে",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://enam.gov.in/",
    officialSourceName: "e-NAM Official Portal (enam.gov.in)",
    published: true
  },
  {
    id: "ami-storage-coldchain",
    name: "Agricultural Marketing Infrastructure (AMI — Rural Godowns & Storage)",
    nameBn: "কৃষি বিপণন পরিকাঠামো (AMI — গ্রামীণ গুদাম ও ফসল সংরক্ষণ ভর্তুকি)",
    category: "STORAGE_COLD_CHAIN",
    secondaryCategories: ["AGRI_MARKETING", "FPO"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & UTs via NABARD & Lending Banks",
    applicableRegionBn: "ভারতের সকল রাজ্য (NABARD এবং ব্যাংকের মাধ্যমে)",
    applicableDistricts: [],
    purpose: "To build scientific rural storage godowns, sorting/grading units, and agricultural marketing infrastructure so farmers can store produce safely and avoid distress harvest-time selling.",
    purposeBn: "গ্রামীণ গুদাম ও ফসল সংরক্ষণ পরিকাঠামো গড়ে তোলা যাতে কৃষকরা ফসল কাটার পর কম দামে বিক্রি করতে বাধ্য না হন এবং সঠিক সময়ে ভালো দাম পান।",
    benefits: "Back-ended capital investment subsidy of 25% (for general plain areas) and 33.33% (for Women farmers, SC/ST, FPOs, Cooperatives, and North-East/Hilly areas) on eligible storage/marketing projects linked with institutional term loans via NABARD.",
    benefitsBn: "ব্যাংক ঋণের সাথে যুক্ত গ্রামীণ গুদাম ও সংরক্ষণ প্রকল্পে সাধারণ শ্রেণির জন্য ২৫% এবং মহিলা কৃষক, SC/ST, FPO ও সমবায়ের জন্য ৩৩.৩৩% পর্যন্ত ব্যাক-এন্ডেড মূলধন ভর্তুকি।",
    eligibility: {
      eligibleCategories: "Individuals, Farmers, Groups of Farmers, FPOs, SHGs, PACS, Cooperatives, and Agri-entrepreneurs.",
      eligibleCategoriesBn: "কৃষক, কৃষক গোষ্ঠী, FPO, স্বনির্ভর গোষ্ঠী, সমবায় সমিতি ও কৃষি উদ্যোক্তা।",
      landholding: "Own land OR valid registered lease for the godown/storage site.",
      landholdingBn: "গুদাম নির্মাণের জন্য নিজস্ব জমি অথবা বৈধ রেজিস্টার্ড লিজ চুক্তি।",
      tenantFarmers: "Eligible with valid registered lease for the project site.",
      tenantFarmersBn: "প্রকল্পের জায়গার বৈধ লিজ চুক্তি থাকলে যোগ্য।",
      womenFarmers: "Prioritized — eligible for higher 33.33% subsidy rate!",
      womenFarmersBn: "মহিলা কৃষকরা উচ্চতর ৩৩.৩৩% ভর্তুকির সুবিধা পান।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "No income ceiling; subject to bank term-loan appraisal.",
      incomeLimitBn: "আয়সীমা নেই; ব্যাংকের প্রকল্প মূল্যায়ন সাপেক্ষে।",
      residency: "Project located in India meeting scientific storage specifications.",
      residencyBn: "ভারতের মধ্যে সরকারি বৈজ্ঞানিক মানদণ্ড অনুযায়ী গুদাম নির্মাণ।"
    },
    whoCanApply: [
      "Farmers and FPOs building rural scientific godowns or grading/packing units",
      "Women entrepreneurs and SC/ST applicants (33.33% subsidy slab)",
      "Cooperatives and PACS upgrading storage capacity"
    ],
    whoCanApplyBn: [
      "গ্রামীণ গুদাম বা গ্রেডিং/প্যাকিং ইউনিট গড়তে ইচ্ছুক কৃষক ও FPO",
      "মহিলা উদ্যোক্তা ও SC/ST আবেদনকারী (৩৩.৩৩% ভর্তুকি)",
      "সমবায় সমিতি ও PACS"
    ],
    whoCannotApply: [
      "Self-financed projects without an eligible bank term loan (AMI subsidy is credit-linked)"
    ],
    whoCannotApplyBn: [
      "ব্যাংক ঋণ ছাড়া নিজস্ব খরচে করা প্রকল্পে ক্রেডিট-লিংকড AMI ভর্তুকি প্রযোজ্য নয়"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card & PAN Card", bn: "আধার কার্ড ও প্যান কার্ড", mandatory: true },
      { en: "Detailed Project Report (DPR) & Scientific Storage Blueprint", bn: "বিস্তারিত প্রজেক্ট রিপোর্ট (DPR) ও গুদামের নকশা", mandatory: true },
      { en: "Land Ownership Record OR Registered Lease Deed", bn: "জমির দলিল অথবা রেজিস্টার্ড লিজ দলিল", mandatory: true },
      { en: "Caste Certificate (for SC/ST 33.33% subsidy)", bn: "জাতিগত শংসাপত্র (SC/ST হলে)", mandatory: false },
      { en: "Bank Term Loan Sanction Letter", bn: "ব্যাংকের ঋণ অনুমোদন পত্র", mandatory: true }
    ],
    applicationProcess: "Submit your storage DPR to a Commercial Bank / RRB / Cooperative Bank. Upon term-loan sanction, the bank uploads the subsidy claim on the NABARD ENSURE portal (nabard.org).",
    applicationProcessBn: "গুদামের প্রজেক্ট রিপোর্ট (DPR) সরকারি/গ্রামীণ/সমবায় ব্যাংকে জমা দিন। ঋণ অনুমোদিত হলে ব্যাংক NABARD-এর পোর্টালের মাধ্যমে আপনার ভর্তুকির আবেদন পাঠাবে।",
    officialPortalUrl: "https://www.nabard.org/",
    offlineProcess: "Discuss project norms with your Bank Branch Manager or District NABARD DDM before starting construction.",
    offlineProcessBn: "নির্মাণ শুরু করার আগে আপনার ব্যাংক ম্যানেজার বা জেলা নাবার্ড আধিকারিকের (DDM) সাথে বিস্তারিত আলোচনা করুন।",
    department: "Department of Agriculture & Farmers Welfare (DMI) & NABARD",
    departmentBn: "কৃষি বিপণন দপ্তর (ভারত সরকার) ও নাবার্ড (NABARD)",
    helpline: "1800-180-1551 / District NABARD Office",
    helplineBn: "১৮০০-১৮০-১৫৫১ / জেলা নাবার্ড অফিস",
    helplineTel: "18001801551",
    deadline: "Check active AMI window status on nabard.org / agmarknet.gov.in",
    deadlineBn: "নাবার্ড পোর্টালে (nabard.org) বর্তমান বরাদ্দ ও সময়সীমা যাচাই করুন",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://www.nabard.org/",
    officialSourceName: "NABARD & AMI Sub-Scheme Guidelines (DA&FW)",
    published: true
  },
  {
    id: "atma-kvk-training",
    name: "ATMA (Agricultural Technology Management Agency) & KVK District Farmer Training",
    nameBn: "আত্মা (ATMA) ও কৃষি বিজ্ঞান কেন্দ্র (KVK) — জেলা কৃষি প্রশিক্ষণ কর্মসূচি",
    category: "TRAINING_SKILL",
    secondaryCategories: ["RURAL_LIVELIHOOD", "WOMEN_FARMER"],
    womenFarmerEligible: true,
    govtLevel: "DISTRICT",
    applicableState: "All India",
    applicableRegion: "District-Level Implementation across All Districts of India (ATMA & KVKs)",
    applicableRegionBn: "ভারতের প্রতিটি জেলায় জেলা-স্তরে রূপায়িত (জেলা ATMA ও KVK)",
    applicableDistricts: [],
    purpose: "District-level decentralized agricultural extension providing free practical training, Farm Schools, field demonstrations, exposure visits, and Farmer Interest Group (FIG) capacity building.",
    purposeBn: "জেলা ও ব্লক স্তরে কৃষকদের বিনামূল্যে হাতে-কলমে আধুনিক চাষাবাদ প্রশিক্ষণ, ফসল প্রদর্শনী, কৃষি ভ্রমণ এবং নতুন প্রযুক্তি শেখানো।",
    benefits: "Free residential/non-residential farmer skill trainings, exposure visits to model farms & universities, Farm School demonstrations, and Kisan Melas organized in every district.",
    benefitsBn: "বিনামূল্যে আধুনিক চাষাবাদ ও পশুপালন প্রশিক্ষণ, আদর্শ খামার ও কৃষি বিশ্ববিদ্যালয় পরিদর্শন, প্রদর্শনী ক্ষেত্র এবং জেলা কৃষি মেলায় অংশগ্রহণের সুযোগ।",
    eligibility: {
      eligibleCategories: "All practicing farmers, rural youth, women farmers, and Farmer Interest Groups (FIGs) in the district.",
      eligibleCategoriesBn: "জেলার সকল কৃষক, গ্রামীণ যুবক-যুবতী, মহিলা কৃষক ও কৃষক গোষ্ঠী।",
      landholding: "No minimum land requirement; landless agricultural youth and women can attend trainings.",
      landholdingBn: "জমির কোনো ন্যূনতম সীমা নেই; ভূমিহীন গ্রামীণ যুবক ও মহিলারাও প্রশিক্ষণ নিতে পারেন।",
      tenantFarmers: "Fully eligible.",
      tenantFarmersBn: "ভাগচাষী ও লিজ কৃষকরা সম্পূর্ণ যোগ্য।",
      womenFarmers: "Minimum 30% beneficiary allocation earmarked for Women Farmers under ATMA guidelines.",
      womenFarmersBn: "ATMA নির্দেশিকা অনুযায়ী কমপক্ষে ৩০% সুবিধা মহিলা কৃষকদের জন্য সংরক্ষিত।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "No income ceiling.",
      incomeLimitBn: "কোনো আয়সীমা নেই।",
      residency: "Resident of the respective District / Block.",
      residencyBn: "সংশ্লিষ্ট জেলা ও ব্লকের বাসিন্দা।"
    },
    whoCanApply: [
      "Farmers wanting practical training in IPM, mushroom, fisheries, beekeeping, nursery, or organic farming",
      "Women farmers (30% dedicated representation)",
      "Rural youth & Farmer Interest Groups (FIGs)"
    ],
    whoCanApplyBn: [
      "আধুনিক চাষ, রোগপোকা দমন, মাশরুম, মৎস্য, মৌমাছি পালন বা জৈব চাষে প্রশিক্ষণ নিতে ইচ্ছুক কৃষক",
      "মহিলা কৃষক (৩০% সংরক্ষিত অংশগ্রহণ)",
      "গ্রামীণ যুবক-যুবতী ও কৃষক গোষ্ঠী"
    ],
    whoCannotApply: [
      "Non-residents applying to another district's localized block training batch"
    ],
    whoCannotApplyBn: [
      "অন্য জেলার স্থানীয় ব্লক প্রশিক্ষণে বাইরের জেলার বাসিন্দা অগ্রাধিকার পান না"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card or Voter ID", bn: "আধার কার্ড বা ভোটার কার্ড", mandatory: true },
      { en: "Mobile Number & Basic Farming Profile", bn: "মোবাইল নম্বর ও চাষাবাদের সাধারণ তথ্য", mandatory: true }
    ],
    applicationProcess: "View district ATMA/extension information on extensionreforms.dacnet.nic.in or kvk.icar.gov.in, and register your name at your Block Technology Manager (BTM) / ATMA / KVK desk.",
    applicationProcessBn: "kvk.icar.gov.in-এ আপনার জেলার কৃষি বিজ্ঞান কেন্দ্র খুঁজুন এবং ব্লক কৃষি অফিসের Block Technology Manager (BTM / ATMA) বা KVK-তে নাম লেখান।",
    officialPortalUrl: "https://kvk.icar.gov.in/",
    offlineProcess: "Visit your Block Agriculture Office (ask for BTM/ATM — ATMA Cell) or your District Krishi Vigyan Kendra (KVK) to enroll in upcoming free training calendars.",
    offlineProcessBn: "ব্লক কৃষি অফিসের ATMA সেল (BTM/ATM) অথবা জেলা কৃষি বিজ্ঞান কেন্দ্রে (KVK) গিয়ে পরবর্তী বিনামূল্যে প্রশিক্ষণের তালিকায় নাম নথিভুক্ত করুন।",
    department: "Dept. of Agriculture & Farmers Welfare (ATMA) & ICAR Krishi Vigyan Kendras",
    departmentBn: "জেলা ATMA সেল, কৃষি দপ্তর এবং ICAR কৃষি বিজ্ঞান কেন্দ্র (KVK)",
    helpline: "1800-180-1551 / District KVK / Block ATMA Cell",
    helplineBn: "১৮০০-১৮০-১৫৫১ / জেলা KVK / ব্লক ATMA অফিস",
    helplineTel: "18001801551",
    deadline: "Monthly / seasonal training batches throughout the year",
    deadlineBn: "সারা বছর মাসিক ও মরসুমী প্রশিক্ষণ ব্যাচ চলে",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://kvk.icar.gov.in/",
    officialSourceName: "ICAR KVK Portal & DA&FW ATMA Extension Guidelines",
    published: true
  },
  {
    id: "acabc-entrepreneurship",
    name: "Agri-Clinics & Agri-Business Centres (ACABC) Scheme",
    nameBn: "এগ্রি-ক্লিনিক ও এগ্রি-বিজনেস সেন্টার (ACABC — কৃষি উদ্যোক্তা প্রকল্প)",
    category: "AGRI_ENTREPRENEURSHIP",
    secondaryCategories: ["TRAINING_SKILL", "AGRI_LOANS_CREDIT"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & UTs across India (Managed by MANAGE & NABARD)",
    applicableRegionBn: "ভারতের সকল রাজ্য ও কেন্দ্রশাসিত অঞ্চল (MANAGE ও NABARD পরিচালিত)",
    applicableDistricts: [],
    purpose: "To empower agriculture graduates, diploma holders, and rural agri-qualified youth to establish self-employed Agri-Clinics, soil labs, nurseries, dairy/fisheries ventures, and agri-input businesses.",
    purposeBn: "কৃষি স্নাতক (B.Sc Agri), ডিপ্লোমা ও কৃষি শিক্ষিত যুবক-যুবতীদের নিজস্ব এগ্রি-ক্লিনিক, মাটি পরীক্ষাগার, নার্সারি, বীজ-সার কেন্দ্র বা কৃষি ব্যবসা শুরু করতে বিনামূল্যে প্রশিক্ষণ ও ঋণে ভর্তুকি দেওয়া।",
    benefits: "Free 45-day residential entrepreneurship training through MANAGE-accredited institutes, followed by credit-linked composite subsidy of 36% (General) and 44% (Women, SC/ST & North-East/Hill candidates) on bank-sanctioned agri-venture projects up to ₹20 lakh (individual) or ₹100 lakh (group of 5).",
    benefitsBn: "বিনামূল্যে ৪৫ দিনের আবাসিক ব্যবসা প্রশিক্ষণ এবং তার পর ব্যাংক ঋণে সাধারণ শ্রেণির জন্য ৩৬% এবং মহিলা ও SC/ST উদ্যোক্তাদের জন্য ৪৪% পর্যন্ত মূলধন ভর্তুকি (ব্যক্তিগত প্রকল্পে সর্বোচ্চ ₹২০ লক্ষ ও ৫ জনের দলে ₹১ কোটি পর্যন্ত সীমা)।",
    eligibility: {
      eligibleCategories: "Graduates in Agriculture/Allied subjects (B.Sc Agri, Horticulture, Veterinary, Fisheries, Dairy, Forestry), Diploma/Post-Graduate Diploma in Agriculture, or Intermediate (10+2) with Agriculture / Science with relevant agri courses as per MANAGE norms.",
      eligibleCategoriesBn: "কৃষি ও আনুষঙ্গিক বিষয়ে স্নাতক (B.Sc Agriculture, উদ্যানপালন, পশুচিকিৎসা, মৎস্য), কৃষি ডিপ্লোমা বা অনুমোদিত কৃষি কোর্স করা যুবক-যুবতী।",
      landholding: "Own or leased premises for setting up the agri-business venture.",
      landholdingBn: "কৃষি ব্যবসার জন্য নিজস্ব বা ভাড়া/লিজ নেওয়া জায়গা।",
      tenantFarmers: "Eligible if meeting educational qualification criteria.",
      tenantFarmersBn: "শিক্ষাগত যোগ্যতা থাকলে সম্পূর্ণ যোগ্য।",
      womenFarmers: "Special priority — eligible for higher 44% subsidy rate!",
      womenFarmersBn: "মহিলা উদ্যোক্তারা উচ্চতর ৪৪% ভর্তুকির সুবিধা পান।",
      ageLimit: "18 to 60 years.",
      ageLimitBn: "১৮ থেকে ৬০ বছর।",
      incomeLimit: "No fixed income limit.",
      incomeLimitBn: "নির্দিষ্ট আয়সীমা নেই।",
      residency: "Resident of India.",
      residencyBn: "ভারতের স্থায়ী বাসিন্দা।"
    },
    whoCanApply: [
      "B.Sc (Hons.) Agriculture & Allied Science graduates and final-year passouts",
      "Agriculture Diploma holders & eligible 10+2 Agriculture candidates",
      "Women and SC/ST agri-entrepreneurs (44% subsidy slab)"
    ],
    whoCanApplyBn: [
      "B.Sc (Hons.) Agriculture ও আনুষঙ্গিক কৃষি বিষয়ের স্নাতক ছাত্র-ছাত্রী",
      "কৃষি ডিপ্লোমা ও যোগ্য উচ্চমাধ্যমিক (কৃষি) উত্তীর্ণ যুবক-যুবতী",
      "মহিলা ও SC/ST কৃষি উদ্যোক্তা (৪৪% ভর্তুকি)"
    ],
    whoCannotApply: [
      "Applicants without the notified agriculture/allied educational qualifications",
      "Ventures started without completing mandatory 45-day ACABC training"
    ],
    whoCannotApplyBn: [
      "নির্ধারিত কৃষি শিক্ষাগত যোগ্যতা না থাকলে",
      "বাধ্যতামূলক ৪৫ দিনের ACABC প্রশিক্ষণ সম্পূর্ণ না করলে"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card & PAN Card", bn: "আধার কার্ড ও প্যান কার্ড", mandatory: true },
      { en: "Agriculture Degree / Diploma / Eligible Qualification Certificate", bn: "কৃষি ডিগ্রি / ডিপ্লোমা / শিক্ষাগত যোগ্যতার সার্টিফিকেট", mandatory: true },
      { en: "Caste Certificate (for SC/ST 44% subsidy)", bn: "জাতিগত শংসাপত্র (SC/ST হলে)", mandatory: false },
      { en: "Bank Account & Detailed Project Report (prepared during training)", bn: "ব্যাংক অ্যাকাউন্ট ও প্রজেক্ট রিপোর্ট (প্রশিক্ষণ চলাকালীন তৈরি হয়)", mandatory: true }
    ],
    applicationProcess: "Apply online at agriclinics.net → select your nearest Nodal Training Institute (NTI) → attend 45-day free training & prepare DPR → submit DPR to bank for credit-linked NABARD subsidy.",
    applicationProcessBn: "agriclinics.net পোর্টালে অনলাইনে আবেদন করুন → নিকটবর্তী Nodal Training Institute (NTI)-তে ৪৫ দিনের বিনামূল্যে প্রশিক্ষণ নিন → DPR তৈরি করে ব্যাংকে জমা দিলে নাবার্ড ভর্তুকি প্রক্রিয়া শুরু হয়।",
    officialPortalUrl: "https://www.agriclinics.net/",
    offlineProcess: "Contact your nearest State Agricultural University (e.g., BCKV / UBKV in West Bengal) or MANAGE-accredited Nodal Training Institute listed on agriclinics.net.",
    offlineProcessBn: "agriclinics.net-এ তালিকাভুক্ত আপনার নিকটবর্তী কৃষি বিশ্ববিদ্যালয় বা অনুমোদিত ট্রেনিং ইনস্টিটিউটে যোগাযোগ করুন।",
    department: "MANAGE (National Institute of Agricultural Extension Management), DA&FW & NABARD",
    departmentBn: "MANAGE, কৃষি মন্ত্রক (ভারত সরকার) ও নাবার্ড (NABARD)",
    helpline: "1800-425-1556 (ACABC Toll-Free Helpline)",
    helplineBn: "১৮০০-৪২৫-১৫৫৬ (ACABC টোল-ফ্রি হেল্পলাইন)",
    helplineTel: "18004251556",
    deadline: "Rolling training batches throughout the year on agriclinics.net",
    deadlineBn: "সারা বছর বিভিন্ন ব্যাচে অনলাইন আবেদন চলে",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://www.agriclinics.net/",
    officialSourceName: "ACABC Official Portal (MANAGE / DA&FW)",
    published: true
  },
  {
    id: "mgnrega-rural-livelihood",
    name: "MGNREGA Agricultural & Rural Livelihood Works (Farm Ponds, Land Development & Plantations)",
    nameBn: "গ্রামীণ জীবিকা ও কৃষি সম্পদ নির্মাণ (পুকুর খনন, জমি উন্নয়ন ও বৃক্ষরোপণ — MoRD)",
    category: "RURAL_LIVELIHOOD",
    secondaryCategories: ["IRRIGATION_WATER", "WOMEN_FARMER"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All Rural Gram Panchayats across India (subject to State operational funding)",
    applicableRegionBn: "ভারতের সকল গ্রামীণ পঞ্চায়েত (রাজ্যের কার্যকর বরাদ্দ সাপেক্ষে)",
    applicableDistricts: [],
    purpose: "To strengthen rural livelihood security while creating durable individual and community agricultural assets like farm ponds, vermicompost pits, cattle/poultry sheds, land levelling, and plantations.",
    purposeBn: "গ্রামীণ পরিবারের কর্মসংস্থান নিশ্চিত করার পাশাপাশি খেতপুকুর খনন, ভার্মি কম্পোস্ট পিট, গবাদি পশুর শেড, জমি সমতলকরণ ও বৃক্ষরোপণের মতো স্থায়ী কৃষি সম্পদ তৈরি করা।",
    benefits: "Guaranteed rural wage employment norms plus individual farm-asset works (farm pond, goat/cattle shed, horticulture plantation, compost pit) on eligible marginal/SC/ST/BPL/small-farmer lands through Gram Sabha approval.",
    benefitsBn: "গ্রামসভার অনুমোদনের মাধ্যমে যোগ্য ক্ষুদ্র, প্রান্তিক, SC/ST ও গ্রামীণ পরিবারের জমিতে খেতপুকুর, গোয়ালঘর/ছাগলের শেড, কম্পোস্ট পিট ও ফলের বাগান তৈরিতে সরকারি সহায়তা।",
    eligibility: {
      eligibleCategories: "Rural households holding a valid Job Card; individual farm asset works prioritize SC/ST, BPL, Women-headed households, and Small/Marginal farmers.",
      eligibleCategoriesBn: "বৈধ জব কার্ডধারী গ্রামীণ পরিবার; ব্যক্তিগত কৃষি সম্পদ কাজে SC/ST, মহিলা-প্রধান পরিবার ও ক্ষুদ্র/প্রান্তিক কৃষকরা অগ্রাধিকার পান।",
      landholding: "Individual farm-asset works apply to eligible small/marginal/priority-category landholders; wage works require no land.",
      landholdingBn: "ব্যক্তিগত খেতপুকুর বা শেডের জন্য নির্দিষ্ট জমির নথি লাগে; সাধারণ কাজের জন্য জমি লাগে না।",
      tenantFarmers: "Eligible for rural household employment with Job Card.",
      tenantFarmersBn: "জব কার্ড থাকলে ভাগচাষী ও ভূমিহীন পরিবারও যোগ্য।",
      womenFarmers: "At least one-third participation reserved for women; women-headed households prioritized for farm assets.",
      womenFarmersBn: "কমপক্ষে এক-তৃতীয়াংশ অংশগ্রহণ মহিলাদের জন্য সংরক্ষিত; মহিলা-প্রধান পরিবার অগ্রাধিকার পায়।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "Targeted at rural households volunteering for manual work / priority marginal categories.",
      incomeLimitBn: "গ্রামীণ শ্রমজীবী ও প্রান্তিক পরিবার।",
      residency: "Local resident of the Gram Panchayat.",
      residencyBn: "সংশ্লিষ্ট গ্রাম পঞ্চায়েতের স্থায়ী বাসিন্দা।"
    },
    whoCanApply: [
      "Rural farming households with valid Gram Panchayat Job Cards",
      "Small, marginal, SC/ST, and women-headed households requesting farm ponds, compost pits, or cattle sheds via Gram Sabha"
    ],
    whoCanApplyBn: [
      "গ্রাম পঞ্চায়েতের বৈধ জব কার্ড থাকা গ্রামীণ কৃষক পরিবার",
      "গ্রামসভার মাধ্যমে খেতপুকুর, কম্পোস্ট পিট বা গবাদি পশুর শেড করতে ইচ্ছুক ক্ষুদ্র, প্রান্তিক ও মহিলা-প্রধান পরিবার"
    ],
    whoCannotApply: [
      "Urban residents outside Gram Panchayat jurisdictions"
    ],
    whoCannotApplyBn: [
      "পৌরসভা বা শহরের বাসিন্দারা এই গ্রামীণ প্রকল্পের আওতায় নন"
    ],
    requiredDocuments: [
      { en: "Rural Job Card (issued by Gram Panchayat)", bn: "গ্রাম পঞ্চায়েতের জব কার্ড", mandatory: true },
      { en: "Aadhaar Card & Bank/Post Office Passbook", bn: "আধার কার্ড ও ব্যাংক/পোস্ট অফিসের পাসবই", mandatory: true },
      { en: "Land Record (for individual Farm Pond / Shed / Plantation work)", bn: "জমির পর্চা (ব্যক্তিগত খেতপুকুর / শেড কাজের জন্য)", mandatory: false }
    ],
    applicationProcess: "View official guidelines and work status at nrega.nic.in; submit work or farm-asset proposals at your Gram Sabha / Gram Panchayat office.",
    applicationProcessBn: "nrega.nic.in পোর্টালে তথ্য দেখুন এবং গ্রামসভা বা গ্রাম পঞ্চায়েত অফিসে খেতপুকুর/কম্পোস্ট পিট/শেডের কাজের প্রস্তাব জমা দিন।",
    officialPortalUrl: "https://nrega.nic.in/",
    offlineProcess: "Apply at your Gram Panchayat office or Gram Sabha meeting with your Job Card, Aadhaar, and (for farm assets) land record.",
    offlineProcessBn: "জব কার্ড ও আধার কার্ড নিয়ে আপনার গ্রাম পঞ্চায়েত অফিসে বা গ্রামসভায় আবেদন করুন।",
    department: "Ministry of Rural Development (MoRD), Govt. of India",
    departmentBn: "গ্রামীণ উন্নয়ন মন্ত্রক (MoRD), ভারত সরকার",
    helpline: "Gram Panchayat / BDO Office / State Helpline on nrega.nic.in",
    helplineBn: "গ্রাম পঞ্চায়েত / বিডিও (BDO) অফিস",
    helplineTel: "",
    deadline: "Gram Sabha annual shelf-of-projects planning cycle",
    deadlineBn: "গ্রামসভার বার্ষিক কর্মপরিকল্পনা অনুযায়ী",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://nrega.nic.in/",
    officialSourceName: "Ministry of Rural Development Official Portal (nrega.nic.in)",
    published: true
  },
  {
    id: "pm-kmy-pension",
    name: "PM-KMY (Pradhan Mantri Kisan Maandhan Yojana — Farmer Old-Age Pension)",
    nameBn: "প্রধানমন্ত্রী কিষাণ মানধন যোজনা (PM-KMY — ৬০ বছর পর কৃষক পেনশন)",
    category: "OTHER_AGRI",
    secondaryCategories: ["FINANCIAL_ASSISTANCE", "WOMEN_FARMER"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All States & UTs across India",
    applicableRegionBn: "ভারতের সকল রাজ্য ও কেন্দ্রশাসিত অঞ্চল",
    applicableDistricts: [],
    purpose: "Voluntary and contributory social security pension scheme for Small and Marginal Farmers (SMF) to provide assured monthly income in old age.",
    purposeBn: "ক্ষুদ্র ও প্রান্তিক কৃষকদের বার্ধক্যকালীন নিরাপত্তার জন্য স্বেচ্ছামূলক সরকারি পেনশন প্রকল্প।",
    benefits: "Assured monthly pension of ₹3,000 per month upon attaining age 60. Farmers contribute ₹55 to ₹200/month (depending on entry age 18–40), and the Government of India contributes an equal matching amount. PM-KISAN beneficiaries can opt to pay directly from their PM-KISAN benefit.",
    benefitsBn: "৬০ বছর বয়স পূর্ণ হলে প্রতি মাসে নিশ্চিত ₹৩,০০০ টাকা পেনশন। ১৮–৪০ বছর বয়সে যোগ দিলে মাসে ₹৫৫ থেকে ₹২০০ টাকা জমা দিতে হয় এবং ভারত সরকার সমপরিমাণ টাকা যোগ করে।",
    eligibility: {
      eligibleCategories: "Small and Marginal Farmers (SMF) across India.",
      eligibleCategoriesBn: "ভারতের ক্ষুদ্র ও প্রান্তিক কৃষক।",
      landholding: "Cultivable landholding up to 2 hectares as per State/UT land records.",
      landholdingBn: "রাজ্যের ভূমি রেকর্ড অনুযায়ী সর্বোচ্চ ২ হেক্টর (প্রায় ৫ একর) পর্যন্ত চাষযোগ্য জমি।",
      tenantFarmers: "Requires cultivable landholding record up to 2 hectares.",
      tenantFarmersBn: "সর্বোচ্চ ২ হেক্টর পর্যন্ত চাষযোগ্য জমির রেকর্ড প্রয়োজন।",
      womenFarmers: "Fully eligible (spouses can also enroll separately if meeting criteria).",
      womenFarmersBn: "যোগ্য মহিলা কৃষকরাও সম্পূর্ণ আলাদাভাবে পেনশন প্রকল্পে যুক্ত হতে পারেন।",
      ageLimit: "Entry age strictly 18 to 40 years.",
      ageLimitBn: "যোগদানের বয়সসীমা ১৮ থেকে ৪০ বছর।",
      incomeLimit: "Income tax payers and beneficiaries of NPS/ESIC/EPFO/PM-SYM are excluded.",
      incomeLimitBn: "আয়করদাতা এবং NPS/ESIC/EPFO/PM-SYM পেনশনভোগীরা যোগ্য নন।",
      residency: "Resident of India.",
      residencyBn: "ভারতের স্থায়ী বাসিন্দা।"
    },
    whoCanApply: [
      "Small and marginal farmers aged 18–40 years owning up to 2 hectares of cultivable land",
      "Women small & marginal farmers aged 18–40 years"
    ],
    whoCanApplyBn: [
      "১৮ থেকে ৪০ বছর বয়সী ক্ষুদ্র ও প্রান্তিক কৃষক (সর্বোচ্চ ২ হেক্টর জমি)",
      "যোগ্য ১৮–৪০ বছর বয়সী মহিলা কৃষক"
    ],
    whoCannotApply: [
      "Farmers older than 40 years or owning more than 2 hectares of cultivable land",
      "Income tax payers or members of EPFO / ESIC / NPS / PM-SYM"
    ],
    whoCannotApplyBn: [
      "৪০ বছরের বেশি বয়সী বা ২ হেক্টরের বেশি জমির মালিক",
      "আয়করদাতা অথবা EPFO / ESIC / NPS / PM-SYM সদস্য"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card", bn: "আধার কার্ড", mandatory: true },
      { en: "Savings Bank Account Passbook / IFSC (for auto-debit mandate)", bn: "ব্যাংকের পাসবই ও IFSC কোড", mandatory: true },
      { en: "Land Record (up to 2 hectares) / PM-KISAN Reference", bn: "জমির পর্চা (সর্বোচ্চ ২ হেক্টর) বা পিএম-কিষাণ তথ্য", mandatory: true },
      { en: "Active Mobile Number", bn: "সচল মোবাইল নম্বর", mandatory: true }
    ],
    applicationProcess: "Self-enroll online at maandhan.in ('Click Here to Apply Now') using Aadhaar & mobile OTP, or enroll through your nearest CSC centre.",
    applicationProcessBn: "maandhan.in পোর্টালে আধার ও মোবাইল OTP দিয়ে নিজেই অনলাইনে আবেদন করুন অথবা নিকটবর্তী তথ্যমিত্র কেন্দ্রে (CSC) গিয়ে নাম নথিভুক্ত করুন।",
    officialPortalUrl: "https://maandhan.in/",
    offlineProcess: "Visit your nearest Common Service Centre (CSC) with Aadhaar and Bank Passbook; enrollment is completely free for the farmer (government bears the CSC enrollment fee).",
    offlineProcessBn: "আধার ও ব্যাংকের পাসবই নিয়ে নিকটবর্তী তথ্যমিত্র কেন্দ্রে (CSC) যান — নাম নথিভুক্তি কৃষকের জন্য সম্পূর্ণ বিনামূল্যে।",
    department: "Department of Agriculture & Farmers Welfare (administered via LIC), Govt. of India",
    departmentBn: "কৃষি ও কৃষক কল্যাণ দপ্তর (LIC পরিচালিত), ভারত সরকার",
    helpline: "1800-267-6888 (Maandhan Toll-Free Helpline)",
    helplineBn: "১৮০০-২৬৭-৬৮৮৮ (মানধন টোল-ফ্রি হেল্পলাইন)",
    helplineTel: "18002676888",
    deadline: "Open year-round for eligible farmers aged 18–40",
    deadlineBn: "১৮–৪০ বছর বয়সী যোগ্য কৃষকদের জন্য সারা বছর খোলা",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://maandhan.in/",
    officialSourceName: "PM-KMY Official Portal (maandhan.in)",
    published: true
  },
  {
    id: "odisha-cm-kisan",
    name: "CM-KISAN (Odisha Farmer & Landless Agricultural Household Assistance)",
    nameBn: "সিএম-কিষাণ (ওড়িশা রাজ্য কৃষক ও ভূমিহীন কৃষি পরিবার সহায়তা)",
    category: "FINANCIAL_ASSISTANCE",
    secondaryCategories: ["RURAL_LIVELIHOOD", "WOMEN_FARMER"],
    womenFarmerEligible: true,
    govtLevel: "STATE",
    applicableState: "Odisha",
    applicableRegion: "All 30 Districts of Odisha",
    applicableRegionBn: "ওড়িশা রাজ্যের সকল ৩০টি জেলা",
    applicableDistricts: [],
    purpose: "State-level financial assistance by the Government of Odisha to support small/marginal farmers and landless agricultural households with cultivation and livelihood inputs.",
    purposeBn: "ওড়িশা সরকারের রাজ্য প্রকল্প — ক্ষুদ্র, প্রান্তিক ও ভূমিহীন কৃষি পরিবারগুলোকে চাষাবাদ ও জীবিকার জন্য সরাসরি আর্থিক সহায়তা দেওয়া।",
    benefits: "Direct Benefit Transfer (DBT) financial assistance for eligible small & marginal farmers (seasonal installments) and livelihood support for landless agricultural households as per Odisha Govt. norms.",
    benefitsBn: "ওড়িশা সরকারের নিয়ম অনুযায়ী যোগ্য ক্ষুদ্র ও প্রান্তিক কৃষকদের মরসুমী আর্থিক সহায়তা এবং ভূমিহীন কৃষি পরিবারকে জীবিকা সহায়তা সরাসরি ব্যাংক অ্যাকাউন্টে দেওয়া হয়।",
    eligibility: {
      eligibleCategories: "Small farmers, marginal farmers, and landless agricultural households residing in Odisha.",
      eligibleCategoriesBn: "ওড়িশার ক্ষুদ্র ও প্রান্তিক কৃষক এবং ভূমিহীন কৃষি পরিবার।",
      landholding: "Small/marginal landholding OR landless rural agricultural household.",
      landholdingBn: "ক্ষুদ্র/প্রান্তিক জমি অথবা ভূমিহীন কৃষি পরিবার উভয়েই অন্তর্ভুক্ত।",
      tenantFarmers: "Landless agricultural households / sharecroppers are specifically covered under the landless category.",
      tenantFarmersBn: "ভূমিহীন ভাগচাষী ও কৃষি শ্রমিক পরিবার এই প্রকল্পে অন্তর্ভুক্ত।",
      womenFarmers: "Fully eligible.",
      womenFarmersBn: "মহিলা কৃষকরা সম্পূর্ণ যোগ্য।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "Government employees and income tax payers are excluded.",
      incomeLimitBn: "সরকারি কর্মচারী ও আয়করদাতারা অন্তর্ভুক্ত নন।",
      residency: "Permanent resident of Odisha.",
      residencyBn: "ওড়িশা রাজ্যের স্থায়ী বাসিন্দা।"
    },
    whoCanApply: [
      "Small and marginal farmers of Odisha",
      "Landless agricultural households of Odisha"
    ],
    whoCanApplyBn: [
      "ওড়িশার ক্ষুদ্র ও প্রান্তিক কৃষক",
      "ওড়িশার ভূমিহীন কৃষি পরিবার"
    ],
    whoCannotApply: [
      "Residents outside Odisha",
      "Income tax payers and government employees"
    ],
    whoCannotApplyBn: [
      "ওড়িশার বাইরের রাজ্যের বাসিন্দা",
      "আয়করদাতা ও সরকারি কর্মচারী"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card", bn: "আধার কার্ড", mandatory: true },
      { en: "Aadhaar-seeded Bank Account Passbook", bn: "আধার-সংযুক্ত ব্যাংকের পাসবই", mandatory: true },
      { en: "Odisha Land Record (RoR) for Small/Marginal category", bn: "ওড়িশার জমির রেকর্ড (ক্ষুদ্র/প্রান্তিক শ্রেণির জন্য)", mandatory: false }
    ],
    applicationProcess: "Apply and track status online via the official Odisha CM-KISAN portal (cmkisan.odisha.gov.in) or through Mo Seba Kendra / Block Agriculture Office.",
    applicationProcessBn: "cmkisan.odisha.gov.in পোর্টালে অনলাইনে আবেদন ও স্ট্যাটাস দেখুন অথবা ওড়িশার মো সেবা কেন্দ্র / ব্লক কৃষি অফিসে যোগাযোগ করুন।",
    officialPortalUrl: "https://cmkisan.odisha.gov.in/",
    offlineProcess: "Visit your nearest Mo Seba Kendra or Block Agriculture Officer (BAO) in Odisha.",
    offlineProcessBn: "ওড়িশার নিকটবর্তী মো সেবা কেন্দ্র বা ব্লক কৃষি অফিসে (BAO) যোগাযোগ করুন।",
    department: "Department of Agriculture & Farmers' Empowerment, Government of Odisha",
    departmentBn: "কৃষি ও কৃষক ক্ষমতায়ন দপ্তর, ওড়িশা সরকার",
    helpline: "1800-180-1551 / Official CM-KISAN Portal",
    helplineBn: "১৮০০-১৮০-১৫৫১ / অফিশিয়াল CM-KISAN পোর্টাল",
    helplineTel: "18001801551",
    deadline: "Check active registration window on cmkisan.odisha.gov.in",
    deadlineBn: "cmkisan.odisha.gov.in পোর্টালে আবেদনের সময়সূচি দেখুন",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://cmkisan.odisha.gov.in/",
    officialSourceName: "CM-KISAN Official Portal (Govt. of Odisha)",
    published: true
  },
  {
    id: "mahadbt-maharashtra",
    name: "MahaDBT Farmer Schemes Portal — Govt. of Maharashtra",
    nameBn: "মহা-ডিবিটি (MahaDBT) — মহারাষ্ট্র রাজ্য সমন্বিত কৃষি প্রকল্প পোর্টাল",
    category: "OTHER_AGRI",
    secondaryCategories: ["IRRIGATION_WATER", "AGRI_MACHINERY", "HORTICULTURE", "SEEDS_FERTILIZERS"],
    womenFarmerEligible: true,
    govtLevel: "STATE",
    applicableState: "Maharashtra",
    applicableRegion: "All 36 Districts of Maharashtra",
    applicableRegionBn: "মহারাষ্ট্র রাজ্যের সকল ৩৬টি জেলা",
    applicableDistricts: [],
    purpose: "Single unified Direct Benefit Transfer (DBT) portal by the Government of Maharashtra for agricultural mechanization, micro-irrigation, horticulture, farm ponds, seeds, and crop protection subsidies.",
    purposeBn: "মহারাষ্ট্র সরকারের একক অনলাইন পোর্টাল — কৃষি যন্ত্রপাতি, ড্রিপ সেচ, উদ্যানপালন, খেতপুকুর এবং বীজ ভর্তুকির জন্য সরাসরি আবেদন।",
    benefits: "One-stop online lottery/selection and DBT bank subsidy across Maharashtra's state and centrally-sponsored farmer subsidy schemes.",
    benefitsBn: "একই পোর্টাল থেকে মহারাষ্ট্রের বিভিন্ন কৃষি ভর্তুকি প্রকল্পে আবেদন এবং সরাসরি ব্যাংক অ্যাকাউন্টে ভর্তুকি।",
    eligibility: {
      eligibleCategories: "Cultivating farmers holding valid Maharashtra 7/12 (Satbara) and 8-A land records.",
      eligibleCategoriesBn: "মহারাষ্ট্রের বৈধ ৭/১২ (সাতবারা) ও ৮-এ জমির রেকর্ড থাকা কৃষক।",
      landholding: "Valid Maharashtra 7/12 & 8-A extract.",
      landholdingBn: "মহারাষ্ট্রের বৈধ ৭/১২ ও ৮-এ জমির নথি।",
      tenantFarmers: "Depends on specific sub-scheme rules on MahaDBT.",
      tenantFarmersBn: "নির্দিষ্ট উপ-প্রকল্পের নিয়ম অনুযায়ী প্রযোজ্য।",
      womenFarmers: "Fully eligible.",
      womenFarmersBn: "মহিলা কৃষকরা সম্পূর্ণ যোগ্য।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "Varies by selected sub-scheme.",
      incomeLimitBn: "নির্বাচিত উপ-প্রকল্প অনুযায়ী।",
      residency: "Farmer in Maharashtra.",
      residencyBn: "মহারাষ্ট্র রাজ্যের কৃষক।"
    },
    whoCanApply: [
      "Farmers in Maharashtra with 7/12 land records and Aadhaar-linked bank accounts"
    ],
    whoCanApplyBn: [
      "৭/১২ জমির নথি ও আধার-সংযুক্ত ব্যাংক অ্যাকাউন্ট থাকা মহারাষ্ট্রের কৃষক"
    ],
    whoCannotApply: [
      "Farmers residing outside Maharashtra"
    ],
    whoCannotApplyBn: [
      "মহারাষ্ট্রের বাইরের রাজ্যের কৃষক"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card", bn: "আধার কার্ড", mandatory: true },
      { en: "Maharashtra 7/12 & 8-A Land Extracts", bn: "মহারাষ্ট্রের ৭/১২ ও ৮-এ জমির নথি", mandatory: true },
      { en: "Aadhaar-seeded Bank Account Passbook", bn: "আধার-সংযুক্ত ব্যাংকের পাসবই", mandatory: true },
      { en: "Caste Certificate (if applying under SC/ST quota)", bn: "জাতিগত শংসাপত্র (SC/ST হলে)", mandatory: false }
    ],
    applicationProcess: "Register with Aadhaar on mahadbt.maharashtra.gov.in/Farmer → complete farm profile → select desired scheme (Irrigation / Machinery / Horticulture) → submit application.",
    applicationProcessBn: "mahadbt.maharashtra.gov.in/Farmer পোর্টালে আধার দিয়ে প্রোফাইল তৈরি করে সেচ, যন্ত্রপাতি বা উদ্যানপালন প্রকল্পে আবেদন করুন।",
    officialPortalUrl: "https://mahadbt.maharashtra.gov.in/Farmer/Login/Login",
    offlineProcess: "Visit your nearest Aaple Sarkar Seva Kendra / CSC or Taluka Agriculture Officer in Maharashtra.",
    offlineProcessBn: "মহারাষ্ট্রের নিকটবর্তী আপলে সরকার সেবা কেন্দ্র / CSC বা তালুকা কৃষি অফিসে যোগাযোগ করুন।",
    department: "Department of Agriculture, Government of Maharashtra",
    departmentBn: "কৃষি দপ্তর, মহারাষ্ট্র সরকার",
    helpline: "MahaDBT Portal Helpdesk / Taluka Agriculture Office",
    helplineBn: "MahaDBT পোর্টাল হেল্পডেস্ক / তালুকা কৃষি অফিস",
    helplineTel: "",
    deadline: "Open year-round for farmer registration & periodic selection draws",
    deadlineBn: "সারা বছর রেজিস্ট্রেশন ও পর্যায়ক্রমে নির্বাচন চলে",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://mahadbt.maharashtra.gov.in/Farmer/Login/Login",
    officialSourceName: "MahaDBT Farmer Portal (Govt. of Maharashtra)",
    published: true
  },
  {
    id: "bihar-dbt-agri",
    name: "DBT Agriculture Bihar — Unified State Farmer Schemes Portal",
    nameBn: "ডিবিটি এগ্রিকালচার বিহার — বিহার রাজ্য সমন্বিত কৃষক প্রকল্প পোর্টাল",
    category: "OTHER_AGRI",
    secondaryCategories: ["SEEDS_FERTILIZERS", "AGRI_MACHINERY", "IRRIGATION_WATER"],
    womenFarmerEligible: true,
    govtLevel: "STATE",
    applicableState: "Bihar",
    applicableRegion: "All 38 Districts of Bihar",
    applicableRegionBn: "বিহার রাজ্যের সকল ৩৮টি জেলা",
    applicableDistricts: [],
    purpose: "Official Government of Bihar Direct Benefit Transfer portal for Farmer Registration, Diesel Subsidy, Seed Subsidy, Agricultural Machinery (Krishi Yantrikaran), and Horticulture grants.",
    purposeBn: "বিহার সরকারের অফিশিয়াল পোর্টাল — কৃষক রেজিস্ট্রেশন, ডিজেল ভর্তুকি, বীজ ভর্তুকি, কৃষি যন্ত্রপাতি ও উদ্যানপালন সহায়তার জন্য।",
    benefits: "Single Bihar Farmer Registration Number enabling direct online applications and bank subsidies across Bihar state agriculture schemes.",
    benefitsBn: "একটি বিহার কৃষক রেজিস্ট্রেশন নম্বরের মাধ্যমে বিহারের সমস্ত সরকারি কৃষি ভর্তুকি প্রকল্পে সরাসরি আবেদন ও ব্যাংক পেমেন্ট।",
    eligibility: {
      eligibleCategories: "Cultivating farmers (both landholders and eligible non-ryot cultivators for select schemes like diesel/seed) in Bihar.",
      eligibleCategoriesBn: "বিহারের জমির মালিক এবং নির্দিষ্ট প্রকল্পে (যেমন ডিজেল/বীজ) যোগ্য ভাগচাষী কৃষক।",
      landholding: "Land Possession Certificate (LPC) / Jamabandi receipt for landholder schemes; self-declaration for non-ryot where notified.",
      landholdingBn: "জমির রশিদ/LPC (জমির মালিকদের জন্য); নির্দিষ্ট প্রকল্পে ভাগচাষীর ঘোষণাপত্র।",
      tenantFarmers: "Eligible in notified schemes such as Diesel/Seed subsidy with Ward/Kisan Salahkar verification.",
      tenantFarmersBn: "ডিজেল ও বীজের মতো নির্দিষ্ট প্রকল্পে ভাগচাষীরাও যাচাই সাপেক্ষে যোগ্য।",
      womenFarmers: "Fully eligible.",
      womenFarmersBn: "মহিলা কৃষকরা সম্পূর্ণ যোগ্য।",
      ageLimit: "18 years and above.",
      ageLimitBn: "১৮ বছর বা তার বেশি।",
      incomeLimit: "No fixed income ceiling.",
      incomeLimitBn: "আলাদা আয়সীমা নেই।",
      residency: "Resident farmer of Bihar.",
      residencyBn: "বিহার রাজ্যের স্থায়ী কৃষক।"
    },
    whoCanApply: [
      "Farmers registered on DBT Agriculture Bihar portal across all 38 districts"
    ],
    whoCanApplyBn: [
      "বিহারের ৩৮টি জেলার DBT Agriculture পোর্টালে নিবন্ধিত কৃষক"
    ],
    whoCannotApply: [
      "Farmers residing outside Bihar"
    ],
    whoCannotApplyBn: [
      "বিহারের বাইরের রাজ্যের কৃষক"
    ],
    requiredDocuments: [
      { en: "Aadhaar Card & Active Mobile Number", bn: "আধার কার্ড ও সচল মোবাইল নম্বর", mandatory: true },
      { en: "Aadhaar-linked Bank Account Passbook", bn: "আধার-সংযুক্ত ব্যাংকের পাসবই", mandatory: true },
      { en: "Land Receipt / LPC (for Ryot / Landholder schemes)", bn: "জমির রশিদ / LPC (জমির মালিকদের জন্য)", mandatory: false }
    ],
    applicationProcess: "Complete Farmer Registration on dbtagriculture.bihar.gov.in using Aadhaar OTP → use your 13-digit Farmer Registration ID to apply for open state subsidy schemes.",
    applicationProcessBn: "dbtagriculture.bihar.gov.in পোর্টালে আধার OTP দিয়ে কৃষক রেজিস্ট্রেশন করুন এবং ১৩ সংখ্যার আইডি দিয়ে চালু রাজ্য প্রকল্পে আবেদন করুন।",
    officialPortalUrl: "https://dbtagriculture.bihar.gov.in/",
    offlineProcess: "Get assisted registration at your nearest Vasudha Kendra (CSC) or through your Panchayat Kisan Salahkar in Bihar.",
    offlineProcessBn: "বিহারের নিকটবর্তী বসুধা কেন্দ্র (CSC) বা পঞ্চায়েতের কিষাণ সলাহকারের মাধ্যমে আবেদন করুন।",
    department: "Department of Agriculture, Government of Bihar",
    departmentBn: "কৃষি দপ্তর, বিহার সরকার",
    helpline: "1800-180-1551 / Bihar Agriculture Portal",
    helplineBn: "১৮০০-১৮০-১৫৫১ / বিহার কৃষি পোর্টাল",
    helplineTel: "18001801551",
    deadline: "Farmer registration open year-round; sub-scheme deadlines vary by season",
    deadlineBn: "কৃষক রেজিস্ট্রেশন সারা বছর খোলা থাকে; উপ-প্রকল্পের সময়সীমা মরসুম অনুযায়ী",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://dbtagriculture.bihar.gov.in/",
    officialSourceName: "DBT Agriculture Bihar Official Portal",
    published: true
  },
  {
    id: "myscheme-national-portal",
    name: "MyScheme — Official Government of India All-State Agriculture Scheme Finder",
    nameBn: "মাই-স্কিম (MyScheme) — ভারত সরকারের সকল রাজ্যের কৃষি প্রকল্প খোঁজার অফিশিয়াল পোর্টাল",
    category: "OTHER_AGRI",
    secondaryCategories: ["FINANCIAL_ASSISTANCE", "WOMEN_FARMER", "TRAINING_SKILL"],
    womenFarmerEligible: true,
    govtLevel: "CENTRAL",
    applicableState: "All India",
    applicableRegion: "All 28 States & 8 Union Territories of India (Official National Directory)",
    applicableRegionBn: "ভারতের সকল ২৮টি রাজ্য ও ৮টি কেন্দ্রশাসিত অঞ্চল (অফিশিয়াল জাতীয় ডিরেক্টরি)",
    applicableDistricts: [],
    purpose: "Official Government of India (MeitY / National e-Governance Division) platform helping citizens and farmers check eligibility for Central and State schemes across all 28 States & 8 UTs.",
    purposeBn: "ভারত সরকারের অফিশিয়াল প্ল্যাটফর্ম — যেখানে দেশের যেকোনো রাজ্য ও কেন্দ্রশাসিত অঞ্চলের কৃষকরা নিজেদের যোগ্যতা অনুযায়ী সরকারি প্রকল্প খুঁজতে পারেন।",
    benefits: "Free official eligibility checker, verified Central & State scheme repository across agriculture, rural development, animal husbandry, and social welfare.",
    benefitsBn: "সম্পূর্ণ বিনামূল্যে সরকারি যোগ্যতা যাচাইকারী এবং কৃষি, পশুপালন, মৎস্য ও গ্রামীণ উন্নয়নের কেন্দ্রীয় ও রাজ্য প্রকল্পের অফিশিয়াল তথ্যভাণ্ডার।",
    eligibility: {
      eligibleCategories: "All Indian farmers, students, women, and rural citizens.",
      eligibleCategoriesBn: "ভারতের সকল কৃষক, মহিলা ও গ্রামীণ নাগরিক।",
      landholding: "No restriction — covers landholding and landless schemes.",
      landholdingBn: "কোনো বাধা নেই — জমির মালিক ও ভূমিহীন সবার জন্য প্রকল্প রয়েছে।",
      tenantFarmers: "Includes state & central schemes for tenant and landless workers.",
      tenantFarmersBn: "ভাগচাষী ও ভূমিহীন কৃষকদের উপযোগী প্রকল্পও এখানে খোঁজা যায়।",
      womenFarmers: "Includes dedicated women farmer & livelihood filter.",
      womenFarmersBn: "মহিলা কৃষকদের জন্য আলাদা ফিল্টার রয়েছে।",
      ageLimit: "All ages.",
      ageLimitBn: "সকল বয়সের জন্য।",
      incomeLimit: "Varies by individual scheme.",
      incomeLimitBn: "নির্দিষ্ট প্রকল্প অনুযায়ী।",
      residency: "Any State or Union Territory of India.",
      residencyBn: "ভারতের যেকোনো রাজ্য বা কেন্দ্রশাসিত অঞ্চল।"
    },
    whoCanApply: [
      "Farmers from any Indian State or UT looking for additional verified state-specific agricultural schemes"
    ],
    whoCanApplyBn: [
      "নিজের রাজ্যের অতিরিক্ত যাচাইকৃত সরকারি কৃষি প্রকল্প খুঁজতে ইচ্ছুক যেকোনো রাজ্যের কৃষক"
    ],
    whoCannotApply: [
      "MyScheme is an official discovery & eligibility portal — actual applications redirect to the respective department's portal"
    ],
    whoCannotApplyBn: [
      "এটি প্রকল্প খোঁজার অফিশিয়াল পোর্টাল — আবেদন করার জন্য সংশ্লিষ্ট দপ্তরের পোর্টালে যেতে হয়"
    ],
    requiredDocuments: [
      { en: "No documents required just to check eligibility on MyScheme", bn: "যোগ্যতা যাচাই করার জন্য কোনো কাগজপত্র লাগে না", mandatory: false }
    ],
    applicationProcess: "Visit myscheme.gov.in → select 'Agriculture, Rural & Environment' category → choose your State/UT to discover additional state-specific official schemes.",
    applicationProcessBn: "myscheme.gov.in ওয়েবসাইটে যান → 'Agriculture, Rural & Environment' বিভাগ বেছে নিন → আপনার রাজ্য নির্বাচন করে অতিরিক্ত সরকারি প্রকল্প দেখুন।",
    officialPortalUrl: "https://www.myscheme.gov.in/search/category/Agriculture,Rural%20&%20Environment",
    offlineProcess: "Visit your nearest Common Service Centre (CSC) for assisted discovery of state-specific schemes.",
    offlineProcessBn: "নিকটবর্তী তথ্যমিত্র কেন্দ্রে (CSC) গিয়েও রাজ্যের বিশেষ প্রকল্প সম্পর্কে জানতে পারবেন।",
    department: "National e-Governance Division (MeitY), Government of India",
    departmentBn: "জাতীয় ই-গভর্ন্যান্স বিভাগ (MeitY), ভারত সরকার",
    helpline: "1800-180-1551 / india.gov.in",
    helplineBn: "১৮০০-১৮০-১৫৫১ / india.gov.in",
    helplineTel: "18001801551",
    deadline: "Open 24x7 year-round",
    deadlineBn: "সারা বছর ২৪ ঘণ্টা খোলা থাকে",
    status: "ACTIVE",
    lastVerifiedDate: "2026-03-15",
    officialSourceUrl: "https://www.myscheme.gov.in/",
    officialSourceName: "MyScheme Official National Portal (Govt. of India)",
    published: true
  }
];

// ----------------------------------------------------------------------------
// VERIFICATION & FRESHNESS GUARD (NEVER SHOW OUTDATED AS CURRENTLY VERIFIED)
// ----------------------------------------------------------------------------
export function evaluateSchemeVerification(scheme, nowMs = Date.now()) {
  const status = String(scheme?.status || "UNVERIFIED").toUpperCase();
  const dateStr = String(scheme?.lastVerifiedDate || "").trim();
  const parsed = dateStr ? Date.parse(dateStr) : NaN;
  const ageDays = Number.isFinite(parsed)
    ? Math.floor((nowMs - parsed) / (1000 * 60 * 60 * 24))
    : null;

  if (status === "CLOSED") {
    return {
      isVerifiedCurrent: false,
      code: "CLOSED",
      en: "Closed / Suspended",
      bn: "বন্ধ আছে",
      badgeClass: "bg-slate-200 text-slate-800 border-slate-300"
    };
  }
  if (status === "OUTDATED" || (ageDays !== null && ageDays > SCHEMES_DIRECTORY_META.maxVerifiedAgeDays)) {
    return {
      isVerifiedCurrent: false,
      code: "OUTDATED",
      en: "Outdated — Verify on Official Portal",
      bn: "পুরনো তথ্য — অফিশিয়াল পোর্টালে যাচাই করুন",
      badgeClass: "bg-rose-100 text-rose-900 border-rose-300"
    };
  }
  if (status === "UNVERIFIED" || !dateStr || !Number.isFinite(parsed)) {
    return {
      isVerifiedCurrent: false,
      code: "UNVERIFIED",
      en: "Unverified — Check Official Source",
      bn: "যাচাই বাকি — সরকারি সূত্র দেখুন",
      badgeClass: "bg-amber-100 text-amber-950 border-amber-300"
    };
  }
  if (status === "SEASONAL") {
    return {
      isVerifiedCurrent: true,
      code: "SEASONAL",
      en: `Seasonal • Verified ${dateStr}`,
      bn: `মরসুম ভিত্তিক • যাচাই: ${dateStr}`,
      badgeClass: "bg-sky-100 text-sky-900 border-sky-200"
    };
  }
  return {
    isVerifiedCurrent: true,
    code: "VERIFIED",
    en: `Verified ${dateStr}`,
    bn: `যাচাইকৃত: ${dateStr}`,
    badgeClass: "bg-[#DCFCE7] text-[#14532D] border-[#BBF7D0]"
  };
}

// ----------------------------------------------------------------------------
// MERGE BASELINE VERIFIED SCHEMES WITH LIVE FIRESTORE ADMIN UPDATES
// ----------------------------------------------------------------------------
export function normalizeCloudScheme(doc) {
  const reqDocs = Array.isArray(doc.requiredDocuments)
    ? doc.requiredDocuments.map((d) =>
        typeof d === "string"
          ? { en: d, bn: d, mandatory: true }
          : { en: d.en || d.bn || "", bn: d.bn || d.en || "", mandatory: d.mandatory !== false, noteEn: d.noteEn || "", noteBn: d.noteBn || "" }
      ).filter((d) => d.en || d.bn)
    : [];

  return {
    id: doc.schemeSlug || doc.id,
    cloudId: doc.id,
    fromCloud: true,
    name: doc.name || "",
    nameBn: doc.nameBn || doc.name || "",
    category: SCHEME_CATEGORY_MAP[doc.category] ? doc.category : "OTHER_AGRI",
    secondaryCategories: Array.isArray(doc.secondaryCategories) ? doc.secondaryCategories : [],
    womenFarmerEligible: doc.womenFarmerEligible !== false,
    govtLevel: ["CENTRAL", "STATE", "DISTRICT"].includes(doc.govtLevel) ? doc.govtLevel : "CENTRAL",
    applicableState: doc.applicableState || "All India",
    applicableRegion: doc.applicableRegion || doc.applicableState || "All India",
    applicableRegionBn: doc.applicableRegionBn || doc.applicableRegion || doc.applicableState || "ভারতবর্ষ",
    applicableDistricts: Array.isArray(doc.applicableDistricts) ? doc.applicableDistricts : [],
    purpose: doc.purpose || "",
    purposeBn: doc.purposeBn || doc.purpose || "",
    benefits: doc.benefits || "",
    benefitsBn: doc.benefitsBn || doc.benefits || "",
    eligibility: {
      eligibleCategories: doc.eligibleCategories || "",
      eligibleCategoriesBn: doc.eligibleCategoriesBn || doc.eligibleCategories || "",
      landholding: doc.landholding || "",
      landholdingBn: doc.landholdingBn || doc.landholding || "",
      tenantFarmers: doc.tenantFarmers || "",
      tenantFarmersBn: doc.tenantFarmersBn || doc.tenantFarmers || "",
      womenFarmers: doc.womenFarmers || "",
      womenFarmersBn: doc.womenFarmersBn || doc.womenFarmers || "",
      ageLimit: doc.ageLimit || "",
      ageLimitBn: doc.ageLimitBn || doc.ageLimit || "",
      incomeLimit: doc.incomeLimit || "",
      incomeLimitBn: doc.incomeLimitBn || doc.incomeLimit || "",
      residency: doc.residency || "",
      residencyBn: doc.residencyBn || doc.residency || ""
    },
    whoCanApply: Array.isArray(doc.whoCanApply) ? doc.whoCanApply : [],
    whoCanApplyBn: Array.isArray(doc.whoCanApplyBn) ? doc.whoCanApplyBn : (Array.isArray(doc.whoCanApply) ? doc.whoCanApply : []),
    whoCannotApply: Array.isArray(doc.whoCannotApply) ? doc.whoCannotApply : [],
    whoCannotApplyBn: Array.isArray(doc.whoCannotApplyBn) ? doc.whoCannotApplyBn : (Array.isArray(doc.whoCannotApply) ? doc.whoCannotApply : []),
    requiredDocuments: reqDocs,
    applicationProcess: doc.applicationProcess || "",
    applicationProcessBn: doc.applicationProcessBn || doc.applicationProcess || "",
    officialPortalUrl: doc.officialPortalUrl || "",
    offlineProcess: doc.offlineProcess || "",
    offlineProcessBn: doc.offlineProcessBn || doc.offlineProcess || "",
    department: doc.department || "",
    departmentBn: doc.departmentBn || doc.department || "",
    helpline: doc.helpline || "Contact local Agriculture Office",
    helplineBn: doc.helplineBn || doc.helpline || "স্থানীয় কৃষি দপ্তরে যোগাযোগ করুন",
    helplineTel: doc.helplineTel || "",
    deadline: doc.deadline || "",
    deadlineBn: doc.deadlineBn || doc.deadline || "",
    status: doc.status || "UNVERIFIED",
    lastVerifiedDate: doc.lastVerifiedDate || "",
    officialSourceUrl: doc.officialSourceUrl || doc.officialPortalUrl || "",
    officialSourceName: doc.officialSourceName || doc.department || "Official Government Source",
    lastUpdateNote: doc.lastUpdateNote || "",
    published: doc.published !== false,
    updatedAtMs: doc.updatedAtMs || 0
  };
}

export function mergeAgricultureSchemes(cloudSchemes = [], includeUnpublished = false) {
  const byId = new Map();
  VERIFIED_AGRICULTURE_SCHEMES.forEach((s) => {
    byId.set(s.id, { ...s, fromCloud: false, cloudId: "" });
  });

  (cloudSchemes || []).forEach((raw) => {
    const norm = normalizeCloudScheme(raw);
    const prev = byId.get(norm.id);
    if (prev) {
      const mergedElig = { ...prev.eligibility };
      for (const [k, v] of Object.entries(norm.eligibility || {})) {
        if (v) mergedElig[k] = v;
      }
      byId.set(norm.id, {
        ...prev,
        ...norm,
        eligibility: mergedElig,
        whoCanApply: norm.whoCanApply.length > 0 ? norm.whoCanApply : prev.whoCanApply,
        whoCanApplyBn: norm.whoCanApplyBn.length > 0 ? norm.whoCanApplyBn : prev.whoCanApplyBn,
        whoCannotApply: norm.whoCannotApply.length > 0 ? norm.whoCannotApply : prev.whoCannotApply,
        whoCannotApplyBn: norm.whoCannotApplyBn.length > 0 ? norm.whoCannotApplyBn : prev.whoCannotApplyBn,
        requiredDocuments: norm.requiredDocuments.length > 0 ? norm.requiredDocuments : prev.requiredDocuments,
        applicationProcess: norm.applicationProcess || prev.applicationProcess,
        applicationProcessBn: norm.applicationProcessBn || prev.applicationProcessBn,
        offlineProcess: norm.offlineProcess || prev.offlineProcess,
        offlineProcessBn: norm.offlineProcessBn || prev.offlineProcessBn,
        deadline: norm.deadline || prev.deadline,
        deadlineBn: norm.deadlineBn || prev.deadlineBn
      });
    } else {
      byId.set(norm.id, norm);
    }
  });

  return Array.from(byId.values()).filter((s) => includeUnpublished || s.published !== false);
}

// ----------------------------------------------------------------------------
// SEARCH & MULTI-FACET FILTER ENGINE (BILINGUAL EN + BN)
// ----------------------------------------------------------------------------
export function filterAgricultureSchemes(schemes, {
  search = "",
  stateFilter = "ALL",
  districtFilter = "ALL",
  categoryFilter = "ALL",
  quickFilter = "ALL"
} = {}) {
  const q = String(search || "").trim().toLowerCase();
  const st = String(stateFilter || "ALL");
  const dist = String(districtFilter || "ALL");
  const cat = String(categoryFilter || "ALL");
  const qf = String(quickFilter || "ALL");

  return (schemes || []).filter((s) => {
    // 1. State filter (All India / Participating States schemes remain visible when a specific state is selected, plus exact state matches!)
    if (st !== "ALL") {
      const appSt = String(s.applicableState || "").toLowerCase();
      const targetSt = st.toLowerCase();
      const isCentralAll = appSt === "all india" || appSt === "participating states";
      const matchesExactState = appSt === targetSt;
      if (!isCentralAll && !matchesExactState) return false;
      // Special factual rule: West Bengal uses Bangla Shasya Bima instead of PMFBY, still keep PMFBY visible with honest note or filter cleanly
    }

    // 2. District filter (if scheme restricts applicableDistricts, check match; All-district schemes remain applicable!)
    if (dist !== "ALL" && Array.isArray(s.applicableDistricts) && s.applicableDistricts.length > 0) {
      const hasDist = s.applicableDistricts.some((d) => d.toLowerCase() === dist.toLowerCase());
      if (!hasDist) return false;
    }

    // 3. Category dropdown filter (all 23 categories)
    if (cat !== "ALL") {
      const sec = Array.isArray(s.secondaryCategories) ? s.secondaryCategories : [];
      if (s.category !== cat && !sec.includes(cat)) return false;
    }

    // 4. Quick filter pills
    if (qf !== "ALL") {
      const sec = Array.isArray(s.secondaryCategories) ? s.secondaryCategories : [];
      const hasCat = (k) => s.category === k || sec.includes(k);
      if (qf === "CENTRAL" && s.govtLevel !== "CENTRAL") return false;
      if (qf === "STATE" && s.govtLevel !== "STATE" && s.govtLevel !== "DISTRICT") return false;
      if (qf === "WOMEN_FARMER" && !hasCat("WOMEN_FARMER") && !s.womenFarmerEligible) return false;
      if (qf === "FINANCIAL_ASSISTANCE" && !hasCat("FINANCIAL_ASSISTANCE")) return false;
      if (qf === "CROP_INSURANCE" && !hasCat("CROP_INSURANCE")) return false;
      if (qf === "AGRI_CREDIT" && !hasCat("AGRI_LOANS_CREDIT") && !hasCat("KCC")) return false;
      if (qf === "IRRIGATION" && !hasCat("IRRIGATION_WATER")) return false;
      if (qf === "MACHINERY" && !hasCat("AGRI_MACHINERY")) return false;
      if (qf === "HORTICULTURE" && !hasCat("HORTICULTURE") && !hasCat("FLORICULTURE")) return false;
      if (qf === "FISHERIES" && !hasCat("FISHERIES_AQUACULTURE")) return false;
      if (qf === "DAIRY_LIVESTOCK" && !hasCat("DAIRY_FARMING") && !hasCat("POULTRY_FARMING") && !hasCat("LIVESTOCK_DEV")) return false;
      if (qf === "TRAINING_ENTREPRENEURSHIP" && !hasCat("TRAINING_SKILL") && !hasCat("AGRI_ENTREPRENEURSHIP")) return false;
    }

    // 5. Bilingual search (English + Bengali)
    if (q) {
      const catMeta = SCHEME_CATEGORY_MAP[s.category];
      const hay = [
        s.name,
        s.nameBn,
        catMeta?.en,
        catMeta?.bn,
        s.applicableState,
        s.applicableRegion,
        s.applicableRegionBn,
        ...(s.applicableDistricts || []),
        s.purpose,
        s.purposeBn,
        s.benefits,
        s.benefitsBn,
        s.department,
        s.departmentBn,
        s.helpline,
        s.helplineBn
      ].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });
}
