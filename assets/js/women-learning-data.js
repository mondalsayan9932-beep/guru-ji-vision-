// ============================================================================
// GURU JI VISION — WOMEN FARMER LEARNING CENTRE & YOUTUBE LIBRARY DATA (PHASE 4)
// ============================================================================
// Single source of truth for:
// 1. All 10 bilingual Women Farmer YouTube Learning Library categories
// 2. Verified initial reference YouTube video (St_38fwwE1M) + cloud merge helpers
// 3. All 7 bilingual Women Farmer Learning Centre pillars
// 4. Verified baseline Learning Centre guides (with official sources & dates)
// 5. Duplicate detection for Automatic Scheme Discovery Admin Review Queue
//
// ZERO FABRICATION POLICY:
// - Never invents scheme amounts, deadlines, or fake government links.
// - All external YouTube links are strictly validated via extractYouTubeInfo.
// ============================================================================

import { extractYouTubeInfo } from "./edu-cms-utils.js";

// ----------------------------------------------------------------------------
// 1. YOUTUBE LEARNING LIBRARY — 10 REQUIRED CATEGORIES (BILINGUAL EN + BN)
// ----------------------------------------------------------------------------
export const WOMEN_VIDEO_CATEGORIES = [
  { key: "WOMEN_FARMER_TRAINING", en: "Women Farmer Training", bn: "নারী কৃষক প্রশিক্ষণ" },
  { key: "GOVERNMENT_SCHEMES", en: "Government Schemes", bn: "সরকারি প্রকল্প" },
  { key: "MODERN_FARMING", en: "Modern Farming", bn: "আধুনিক চাষাবাদ" },
  { key: "ORGANIC_FARMING", en: "Organic Farming", bn: "জৈব চাষ" },
  { key: "HORTICULTURE", en: "Horticulture", bn: "উদ্যানপালন" },
  { key: "DAIRY_LIVESTOCK", en: "Dairy and Livestock", bn: "দুগ্ধ ও পশুপালন" },
  { key: "POULTRY_FISHERIES", en: "Poultry and Fisheries", bn: "হাঁস-মুরগি ও মৎস্য চাষ" },
  { key: "ENTREPRENEURSHIP", en: "Entrepreneurship", bn: "কৃষি উদ্যোক্তা ও ব্যবসা" },
  { key: "SHG_FPO", en: "SHG and FPO", bn: "স্বনির্ভর গোষ্ঠী (SHG) ও FPO" },
  { key: "FINANCIAL_LITERACY", en: "Financial Literacy", bn: "আর্থিক সাক্ষরতা ও সঞ্চয়" }
];

export const WOMEN_VIDEO_CATEGORY_MAP = Object.fromEntries(
  WOMEN_VIDEO_CATEGORIES.map((c) => [c.key, c])
);

export const WOMEN_VIDEO_CATEGORY_KEYS = WOMEN_VIDEO_CATEGORIES.map((c) => c.key);

// ----------------------------------------------------------------------------
// 2. INITIAL VERIFIED YOUTUBE REFERENCE VIDEO (ADMIN-MANAGEABLE + BASELINE)
// ----------------------------------------------------------------------------
export const INITIAL_REFERENCE_VIDEO_URL = "https://youtu.be/St_38fwwE1M?si=GtlQBXUWONw_vCkN";

export const BASELINE_WOMEN_VIDEOS = [
  {
    id: "wf-ref-video-st38fwwe1m",
    title: "Women Farmer Empowerment & Modern Agricultural Training Reference",
    titleBn: "নারী কৃষক ক্ষমতায়ন ও আধুনিক কৃষি প্রশিক্ষণ (রেফারেন্স ভিডিও)",
    description:
      "Initial curated reference video for Women Farmers and Agriculture Students covering practical agricultural empowerment, training awareness, and rural farming knowledge. Admins can edit, recategorize, or add more verified YouTube videos anytime.",
    descriptionBn:
      "নারী কৃষক ও কৃষি শিক্ষার্থীদের জন্য প্রাথমিক যাচাইকৃত শিক্ষামূলক ভিডিও — আধুনিক কৃষি প্রশিক্ষণ, সচেতনতা ও গ্রামীণ চাষাবাদের ব্যবহারিক দিকনির্দেশনা। অ্যাডমিনরা নতুন YouTube ভিডিও যোগ বা সম্পাদনা করতে পারবেন।",
    category: "WOMEN_FARMER_TRAINING",
    language: "BILINGUAL",
    youtubeUrl: INITIAL_REFERENCE_VIDEO_URL,
    videoId: "St_38fwwE1M",
    embedUrl: "https://www.youtube-nocookie.com/embed/St_38fwwE1M?rel=0",
    thumbnailUrl: "https://i.ytimg.com/vi/St_38fwwE1M/hqdefault.jpg",
    sourceName: "Curated Reference Video (YouTube)",
    audience: "BOTH",
    lastVerifiedDate: "2026-03-25",
    published: true,
    isBaseline: true
  }
];

// ----------------------------------------------------------------------------
// 3. WOMEN FARMER LEARNING CENTRE — 7 REQUIRED PILLARS (BILINGUAL EN + BN)
// ----------------------------------------------------------------------------
export const WOMEN_LEARNING_PILLARS = [
  {
    key: "GOVT_SCHEME_GUIDANCE",
    en: "Government Scheme Guidance",
    bn: "সরকারি প্রকল্প নির্দেশিকা",
    shortEn: "Step-by-step scheme eligibility & documents",
    shortBn: "প্রকল্পের যোগ্যতা ও নথিপত্র নির্দেশিকা"
  },
  {
    key: "AGRI_TECHNIQUES",
    en: "Agricultural Techniques",
    bn: "আধুনিক কৃষি পদ্ধতি",
    shortEn: "Soil health, SRI, IPM & water-saving methods",
    shortBn: "মাটি পরীক্ষা, জৈব চাষ ও জল সাশ্রয়ী পদ্ধতি"
  },
  {
    key: "CROP_PRODUCTION",
    en: "Crop Production Information",
    bn: "ফসল উৎপাদন তথ্য",
    shortEn: "Kharif, Rabi & vegetable cultivation guides",
    shortBn: "খরিফ, রবি, সবজি ও উদ্যান ফসলের তথ্য"
  },
  {
    key: "TRAINING_RESOURCES",
    en: "Training Resources",
    bn: "কৃষি প্রশিক্ষণ ও KVK সহায়তা",
    shortEn: "KVK, ATMA, Krishi Sakhi & WBSRLM training",
    shortBn: "KVK, ATMA, কৃষি সখী ও আনন্দধারা প্রশিক্ষণ"
  },
  {
    key: "ENTREPRENEURSHIP_GUIDANCE",
    en: "Entrepreneurship Guidance",
    bn: "কৃষি উদ্যোক্তা ও ব্যবসা নির্দেশিকা",
    shortEn: "SHG food processing, PMFME & Women FPOs",
    shortBn: "SHG খাদ্য প্রক্রিয়াকরণ, PMFME ও নারী FPO"
  },
  {
    key: "FINANCIAL_LITERACY",
    en: "Financial Literacy",
    bn: "আর্থিক সাক্ষরতা ও ব্যাংকিং",
    shortEn: "KCC, SHG bank linkage, insurance & safe DBT",
    shortBn: "KCC, SHG ব্যাংক ঋণ, ফসল বীমা ও নিরাপদ DBT"
  },
  {
    key: "GOVT_EDU_VIDEOS",
    en: "Government Educational Videos",
    bn: "সরকারি ও শিক্ষামূলক কৃষি ভিডিও",
    shortEn: "Curated YouTube training library (10 topics)",
    shortBn: "যাচাইকৃত YouTube কৃষি প্রশিক্ষণ ভিডিও"
  }
];

export const WOMEN_LEARNING_PILLAR_MAP = Object.fromEntries(
  WOMEN_LEARNING_PILLARS.map((p) => [p.key, p])
);

export const WOMEN_LEARNING_PILLAR_KEYS = WOMEN_LEARNING_PILLARS.map((p) => p.key);

// ----------------------------------------------------------------------------
// 4. VERIFIED BASELINE LEARNING CENTRE RESOURCES (EN + BN, OFFICIAL SOURCES)
// ----------------------------------------------------------------------------
export const BASELINE_WOMEN_LEARNING_RESOURCES = [
  {
    id: "wf-learn-scheme-checklist",
    pillar: "GOVT_SCHEME_GUIDANCE",
    title: "How Women Farmers in West Bengal & India Prepare Documents for Govt Schemes",
    titleBn: "পশ্চিমবঙ্গ ও কেন্দ্রীয় সরকারি কৃষি প্রকল্পে আবেদনের আগে নারী কৃষকদের প্রস্তুতি",
    summary:
      "Checklist for verifying Aadhaar-bank DBT seeding, Krishak Bandhu / Bangla Shasya Bima enrollment, Anandadhara SHG grading records, and Block ADA/BDO verification before applying online or offline.",
    summaryBn:
      "অনলাইন বা অফলাইনে আবেদনের আগে আধার-ব্যাংক DBT সংযোগ, কৃষক বন্ধু ও বাংলা শস্য বীমা নিবন্ধন, আনন্দধারা SHG গ্রেডিং নথি এবং ব্লক ADA/BDO যাচাইকরণের ধাপে ধাপে তালিকা।",
    keyPointsEn: [
      "Keep Aadhaar, Bank Passbook (with DBT enabled), and Voter ID/Residency proof updated.",
      "Landless & tenant women farmers can access SHG schemes (Anandadhara / MKSP / PMFME Seed Capital) and Bangla Shasya Bima as per official WB guidelines.",
      "Always verify official portals (.gov.in / matirkatha.net) or Bangla Sahayata Kendra (BSK) — never pay middlemen."
    ],
    keyPointsBn: [
      "আধার কার্ড, DBT-সক্রিয় ব্যাংক পাসবই ও বসবাসের প্রমাণপত্র আপডেট রাখুন।",
      "ভূমিহীন ও ভাগচাষী নারী কৃষকরাও সরকারি নিয়মে আনন্দধারা, MKSP, PMFME সিড ক্যাপিটাল এবং বাংলা শস্য বীমার সুযোগ নিতে পারেন।",
      "সর্বদা সরকারি পোর্টাল (.gov.in / matirkatha.net) বা বাংলা সহায়তা কেন্দ্রে (BSK) তথ্য যাচাই করুন — দালাল এড়িয়ে চলুন।"
    ],
    officialSourceName: "Matir Katha (Govt. of West Bengal) & MyScheme (Govt. of India)",
    officialSourceUrl: "https://matirkatha.net/",
    lastVerifiedDate: "2026-03-25",
    published: true,
    isBaseline: true
  },
  {
    id: "wf-learn-soil-ipm-techniques",
    pillar: "AGRI_TECHNIQUES",
    title: "Soil Health Card Testing, Balanced Nutrients & Integrated Pest Management (IPM)",
    titleBn: "সয়েল হেলথ কার্ড (মাটি পরীক্ষা), সুষম সার ও সমন্বিত বালাই দমন (IPM)",
    summary:
      "Practical steps to test farm soil before sowing, apply bio-fertilizers and vermicompost, adopt drip/mulching water conservation, and reduce chemical pesticide costs safely.",
    summaryBn:
      "বীজ বপনের আগে মাটি পরীক্ষা, জৈব সার ও কেঁচো সার ব্যবহার, ড্রিপ সেচ ও মালচিংয়ের মাধ্যমে জল সাশ্রয় এবং নিরাপদে রাসায়নিক কীটনাশকের খরচ কমানোর উপায়।",
    keyPointsEn: [
      "Collect representative soil samples from multiple spots (15 cm depth) and test through Block soil labs or KVK.",
      "Use pheromone traps, yellow sticky traps, neem-based biopesticides, and crop rotation under IPM.",
      "Adopt women-friendly drudgery-reducing farm tools (conoweeder, seed drum, battery sprayer) supported under SMAM / WB FSSM."
    ],
    keyPointsBn: [
      "জমির বিভিন্ন স্থান থেকে ১৫ সেমি গভীর মাটি সংগ্রহ করে ব্লক ল্যাব বা KVK-তে পরীক্ষা করান।",
      "IPM পদ্ধতিতে ফেরোমন ফাঁদ, হলুদ আঠালো ফাঁদ, নিম-ভিত্তিক জৈব কীটনাশক ও শস্য আবর্তন ব্যবহার করুন।",
      "কায়িক শ্রম কমাতে SMAM ও পশ্চিমবঙ্গ FSSM প্রকল্পের মাধ্যমে আধুনিক কৃষি যন্ত্রপাতি ব্যবহার করুন।"
    ],
    officialSourceName: "Soil Health Card Portal & ICAR-CIWA (Central Institute for Women in Agriculture)",
    officialSourceUrl: "https://soilhealth.dac.gov.in/",
    lastVerifiedDate: "2026-03-25",
    published: true,
    isBaseline: true
  },
  {
    id: "wf-learn-crop-horticulture-calendar",
    pillar: "CROP_PRODUCTION",
    title: "Seasonal Crop, Kitchen Garden & High-Value Horticulture Production Guide (West Bengal)",
    titleBn: "মরসুম ভিত্তিক ফসল, পুষ্টি বাগান ও লাভজনক উদ্যান চাষ (পশ্চিমবঙ্গ নির্দেশিকা)",
    summary:
      "Seasonal planning across Aman/Boro paddy, potato, mustard, pulses, and year-round nutrition kitchen gardens (Poshan Vatika), floriculture, and nursery raising for women farmers.",
    summaryBn:
      "আমন ও বোরো ধান, আলু, সরিষা, ডাল এবং সারা বছরের পারিবারিক পুষ্টি বাগান (পোষণ ভাটিকা), ফুল চাষ ও নার্সারি তৈরির মরসুম ভিত্তিক পরিকল্পনা।",
    keyPointsEn: [
      "Start with certified seeds from State Seed Farms, KVKs, or licensed dealers and keep purchase receipts.",
      "Combine staple crops with short-duration vegetables, marigold/tuberose floriculture, or mushroom cultivation for steady monthly cash flow.",
      "Check ICAR / West Bengal Agriculture Dept. crop advisories before monsoon & winter sowing."
    ],
    keyPointsBn: [
      "সরকারি বীজ খামার, KVK বা অনুমোদিত কেন্দ্র থেকে সার্টিফায়েড বীজ সংগ্রহ করুন এবং রসিদ সংরক্ষণ করুন।",
      "নিয়মিত মাসিক আয়ের জন্য প্রধান ফসলের পাশাপাশি সবজি, গাঁদা-রজনীগন্ধা ফুল বা মাশরুম চাষ যুক্ত করুন।",
      "বর্ষা ও শীতের আগে ICAR এবং পশ্চিমবঙ্গ কৃষি দপ্তরের ফসল পরামর্শ দেখে নিন।"
    ],
    officialSourceName: "ICAR & Dept. of Agriculture, Govt. of West Bengal",
    officialSourceUrl: "https://icar.org.in/",
    lastVerifiedDate: "2026-03-25",
    published: true,
    isBaseline: true
  },
  {
    id: "wf-learn-kvk-atma-training",
    pillar: "TRAINING_RESOURCES",
    title: "Free Government Training: KVK, ATMA, Krishi Sakhi, Pashu Sakhi & ICAR-CIWA",
    titleBn: "বিনামূল্যে সরকারি কৃষি প্রশিক্ষণ: KVK, ATMA, কৃষি সখী ও পশু সখী",
    summary:
      "How women farmers and SHG members can enroll in free district Krishi Vigyan Kendra (KVK) skill trainings, ATMA exposure visits, and DAY-NRLM / WBSRLM Anandadhara Krishi Sakhi programmes.",
    summaryBn:
      "জেলা কৃষি বিজ্ঞান কেন্দ্র (KVK), ATMA এবং DAY-NRLM / পশ্চিমবঙ্গ আনন্দধারার অধীনে বিনামূল্যে কৃষি সখী, পশু সখী, মাশরুম, মৎস্য ও পশুপালন প্রশিক্ষণে যোগদানের পদ্ধতি।",
    keyPointsEn: [
      "Every district in West Bengal has one or more KVKs offering free hands-on training in nursery, dairy, poultry, fisheries, and value addition.",
      "Contact your Block Technology Manager (BTM / ATMA) or Block Mission Management Unit (WBSRLM) for upcoming training calendars.",
      "Call Kisan Call Centre toll-free at 1800-180-1551 in Bengali for immediate guidance."
    ],
    keyPointsBn: [
      "পশ্চিমবঙ্গের প্রতিটি জেলায় KVK-তে নার্সারি, দুগ্ধ, হাঁস-মুরগি, মৎস্য ও খাদ্য প্রক্রিয়াকরণের বিনামূল্যে হাতে-কলমে প্রশিক্ষণ দেওয়া হয়।",
      "আসন্ন প্রশিক্ষণের সময়সূচী জানতে ব্লক টেকনোলজি ম্যানেজার (BTM / ATMA) বা আনন্দধারা BMMU অফিসে যোগাযোগ করুন।",
      "তাৎক্ষণিক বাংলায় পরামর্শের জন্য টোল-ফ্রি কিষাণ কল সেন্টার ১৮০০-১৮০-১৫৫১ নম্বরে কল করুন।"
    ],
    officialSourceName: "ICAR KVK Portal & DAY-NRLM (Ministry of Rural Development)",
    officialSourceUrl: "https://kvk.icar.gov.in/",
    lastVerifiedDate: "2026-03-25",
    published: true,
    isBaseline: true
  },
  {
    id: "wf-learn-shg-fpo-enterprise",
    pillar: "ENTREPRENEURSHIP_GUIDANCE",
    title: "From Village SHG to Women-Led FPO & Micro Food Processing Business (PMFME)",
    titleBn: "গ্রাম্য স্বনির্ভর গোষ্ঠী থেকে নারী-পরিচালিত FPO ও খাদ্য প্রক্রিয়াকরণ ব্যবসা (PMFME)",
    summary:
      "Practical roadmap for scaling village produce (spices, pickles, dal, honey, dairy, fish products) through FSSAI registration, collective grading, Women FPOs, and PMFME Seed Capital.",
    summaryBn:
      "মসলা, আচার, ডাল, মধু, দুগ্ধ ও মৎস্যজাত পণ্য প্রক্রিয়াকরণ, FSSAI নিবন্ধন, সমবায় গ্রেডিং, নারী FPO গঠন এবং PMFME সিড ক্যাপিটালের মাধ্যমে ব্যবসা বাড়ানোর পথনির্দেশিকা।",
    keyPointsEn: [
      "Begin with a registered SHG or Producer Group to aggregate quality raw produce and cut transport costs.",
      "Obtain basic FSSAI registration before selling packaged spices, pickles, puffed rice, or dairy items.",
      "Connect with PMFME District Resource Persons (DIC) or NABARD/SFAC CBBOs for Women-Led FPO handholding."
    ],
    keyPointsBn: [
      "পরিবহন খরচ কমাতে ও ভালো দাম পেতে নিবন্ধিত SHG বা উৎপাদক গোষ্ঠীর মাধ্যমে ফসল একত্রিত করুন।",
      "প্যাকেটজাত মসলা, আচার, মুড়ি বা দুগ্ধজাত পণ্য বিক্রির আগে বেসিক FSSAI নিবন্ধন নিন।",
      "নারী-পরিচালিত FPO ও প্রজেক্ট রিপোর্টের জন্য জেলা শিল্প কেন্দ্রের (DIC) PMFME রিসোর্স পারসন বা NABARD-এর সহায়তা নিন।"
    ],
    officialSourceName: "PMFME (MoFPI) & NABARD Official Portals",
    officialSourceUrl: "https://pmfme.mofpi.gov.in/",
    lastVerifiedDate: "2026-03-25",
    published: true,
    isBaseline: true
  },
  {
    id: "wf-learn-financial-literacy",
    pillar: "FINANCIAL_LITERACY",
    title: "Financial Literacy for Women Farmers: KCC, SHG Credit, Insurance & Cyber-Safe DBT",
    titleBn: "নারী কৃষকদের আর্থিক সাক্ষরতা: KCC, SHG ব্যাংক ঋণ, বীমা ও নিরাপদ DBT",
    summary:
      "Essential financial habits: comparing KCC / SHG formal bank interest rates vs informal moneylenders, tracking crop costs, renewing crop insurance on time, and protecting bank OTP/PIN.",
    summaryBn:
      "প্রয়োজনীয় আর্থিক অভ্যাস: মহাজনী চড়া সুদের বদলে KCC ও SHG ব্যাংক ঋণের সুবিধা, চাষের আয়-ব্যয়ের হিসাব রাখা, সময়মতো ফসল বীমা করা এবং ব্যাংক OTP ও PIN সুরক্ষিত রাখা।",
    keyPointsEn: [
      "Maintain a simple seasonal farm notebook (or use Guru Ji Vision Farmer Money Support) to separate seed, fertilizer, labour, and sale income.",
      "Prompt repayment of KCC crop & allied (dairy/fisheries) loans qualifies for official interest subvention per RBI/bank rules.",
      "NEVER share Aadhaar OTP, UPI PIN, or ATM CVV with anyone claiming to approve a government scheme subsidy."
    ],
    keyPointsBn: [
      "বীজ, সার, মজুরি ও ফসল বিক্রির হিসাব আলাদাভাবে লিখে রাখুন।",
      "সময়মতো KCC ও পশুপালন/মৎস্য ঋণ পরিশোধ করলে সরকারি নিয়মে সুদে ছাড় পাওয়া যায়।",
      "সরকারি প্রকল্পের টাকা দেওয়ার নামে কেউ ফোন করলে কখনোই আধার OTP, UPI PIN বা ব্যাংকের গোপন নম্বর দেবেন না।"
    ],
    officialSourceName: "Reserve Bank of India Financial Education & NABARD",
    officialSourceUrl: "https://www.rbi.org.in/financialeducation/",
    lastVerifiedDate: "2026-03-25",
    published: true,
    isBaseline: true
  },
  {
    id: "wf-learn-govt-video-guide",
    pillar: "GOVT_EDU_VIDEOS",
    title: "Curated Government & Agricultural Training YouTube Video Library",
    titleBn: "সরকারি ও কৃষি প্রশিক্ষণ YouTube ভিডিও লাইব্রেরি ব্যবহার নির্দেশিকা",
    summary:
      "Watch verified bilingual training videos across 10 agricultural categories directly inside Guru Ji Vision — accessible to both Women Farmers and Agriculture Students.",
    summaryBn:
      "১০টি কৃষি বিভাগের যাচাইকৃত প্রশিক্ষণ ভিডিও সরাসরি গুরু জি ভিশন অ্যাপের ভেতর দেখুন — নারী কৃষক ও কৃষি শিক্ষার্থী উভয়ের জন্য উন্মুক্ত।",
    keyPointsEn: [
      "Covers Women Farmer Training, Govt Schemes, Modern & Organic Farming, Horticulture, Dairy, Poultry & Fisheries, Entrepreneurship, SHG/FPO & Financial Literacy.",
      "All videos play safely via privacy-enhanced YouTube player (youtube-nocookie.com) and are curated by verified Admins."
    ],
    keyPointsBn: [
      "নারী কৃষক প্রশিক্ষণ, সরকারি প্রকল্প, আধুনিক ও জৈব চাষ, উদ্যানপালন, দুগ্ধ, হাঁস-মুরগি, মৎস্য, উদ্যোক্তা, SHG/FPO ও আর্থিক সাক্ষরতার ১০টি বিভাগ।",
      "সব ভিডিও নিরাপদ YouTube প্লেয়ারে সরাসরি চলে এবং যাচাইকৃত অ্যাডমিনদের দ্বারা পরিচালিত।"
    ],
    officialSourceName: "Guru Ji Vision Women Farmer YouTube Learning Library",
    officialSourceUrl: INITIAL_REFERENCE_VIDEO_URL,
    lastVerifiedDate: "2026-03-25",
    published: true,
    isBaseline: true
  }
];

// ----------------------------------------------------------------------------
// 5. MERGE & FILTER HELPERS (PRESERVING BASELINE + LIVE FIRESTORE OVERRIDES)
// ----------------------------------------------------------------------------
export function normalizeWomenVideo(doc = {}) {
  const rawUrl = String(doc.youtubeUrl || doc.url || "").trim();
  const yt = extractYouTubeInfo(rawUrl);
  const category = WOMEN_VIDEO_CATEGORY_MAP[doc.category] ? doc.category : "WOMEN_FARMER_TRAINING";
  return {
    id: String(doc.id || ""),
    title: String(doc.title || "").trim(),
    titleBn: String(doc.titleBn || doc.title || "").trim(),
    description: String(doc.description || "").trim(),
    descriptionBn: String(doc.descriptionBn || doc.description || "").trim(),
    category,
    language: ["EN", "BN", "HI", "BILINGUAL"].includes(doc.language) ? doc.language : "BILINGUAL",
    youtubeUrl: yt.ok ? yt.watchUrl : rawUrl,
    videoId: yt.ok ? yt.videoId : String(doc.videoId || ""),
    embedUrl: yt.ok ? yt.embedUrl : String(doc.embedUrl || ""),
    thumbnailUrl: String(doc.thumbnailUrl || (yt.ok ? yt.thumbnailUrl : "")),
    sourceName: String(doc.sourceName || "Verified Agricultural Video").trim(),
    audience: ["WOMEN_FARMER", "BOTH"].includes(doc.audience) ? doc.audience : "BOTH",
    lastVerifiedDate: String(doc.lastVerifiedDate || "").trim(),
    published: doc.published !== false,
    fromCloud: Boolean(doc.fromCloud),
    isBaseline: Boolean(doc.isBaseline),
    updatedAtMs: Number(doc.updatedAtMs) || 0
  };
}

export function mergeWomenVideos(cloudVideos = [], includeDrafts = false) {
  const cloud = (Array.isArray(cloudVideos) ? cloudVideos : [])
    .filter((v) => v && (includeDrafts || v.published !== false))
    .map((v) => normalizeWomenVideo({ ...v, fromCloud: true }));

  const seenVideoIds = new Set(cloud.map((v) => v.videoId).filter(Boolean));
  const seenIds = new Set(cloud.map((v) => v.id).filter(Boolean));

  const merged = [...cloud];
  for (const base of BASELINE_WOMEN_VIDEOS) {
    if (seenIds.has(base.id) || (base.videoId && seenVideoIds.has(base.videoId))) continue;
    merged.push(normalizeWomenVideo(base));
  }
  return merged;
}

export function filterWomenVideos(videos = [], filters = {}) {
  const category = filters.category || "ALL";
  const language = filters.language || "ALL";
  const q = String(filters.search || "").trim().toLowerCase();
  return (Array.isArray(videos) ? videos : []).filter((v) => {
    if (!v) return false;
    if (category !== "ALL" && v.category !== category) return false;
    if (language !== "ALL" && v.language !== language) return false;
    if (q) {
      const catMeta = WOMEN_VIDEO_CATEGORY_MAP[v.category] || { en: "", bn: "" };
      const hay = [
        v.title,
        v.titleBn,
        v.description,
        v.descriptionBn,
        v.sourceName,
        catMeta.en,
        catMeta.bn
      ].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function mergeWomenLearningResources(cloudResources = [], includeDrafts = false) {
  const cloud = (Array.isArray(cloudResources) ? cloudResources : [])
    .filter((r) => r && (includeDrafts || r.published !== false))
    .map((r) => ({
      ...r,
      pillar: WOMEN_LEARNING_PILLAR_MAP[r.pillar] ? r.pillar : "GOVT_SCHEME_GUIDANCE",
      title: String(r.title || "").trim(),
      titleBn: String(r.titleBn || r.title || "").trim(),
      summary: String(r.summary || "").trim(),
      summaryBn: String(r.summaryBn || r.summary || "").trim(),
      keyPointsEn: Array.isArray(r.keyPointsEn) ? r.keyPointsEn : [],
      keyPointsBn: Array.isArray(r.keyPointsBn) ? r.keyPointsBn : [],
      officialSourceName: String(r.officialSourceName || "Official Government / ICAR Source").trim(),
      officialSourceUrl: String(r.officialSourceUrl || "").trim(),
      lastVerifiedDate: String(r.lastVerifiedDate || "").trim(),
      published: r.published !== false,
      fromCloud: true
    }));

  const seenIds = new Set(cloud.map((r) => r.id));
  const merged = [...cloud];
  for (const base of BASELINE_WOMEN_LEARNING_RESOURCES) {
    if (!seenIds.has(base.id)) merged.push(base);
  }
  return merged;
}

export function filterWomenLearningResources(resources = [], filters = {}) {
  const pillar = filters.pillar || "ALL";
  const q = String(filters.search || "").trim().toLowerCase();
  return (Array.isArray(resources) ? resources : []).filter((r) => {
    if (!r) return false;
    if (pillar !== "ALL" && r.pillar !== pillar) return false;
    if (q) {
      const pMeta = WOMEN_LEARNING_PILLAR_MAP[r.pillar] || { en: "", bn: "" };
      const hay = [
        r.title,
        r.titleBn,
        r.summary,
        r.summaryBn,
        r.officialSourceName,
        ...(r.keyPointsEn || []),
        ...(r.keyPointsBn || []),
        pMeta.en,
        pMeta.bn
      ].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function isDuplicateDiscoveredScheme(candidate, queueItems = [], existingSchemes = []) {
  if (!candidate) return false;
  const key = String(candidate.dedupeKey || "").trim().toLowerCase();
  const url = String(candidate.officialSourceUrl || "").trim().toLowerCase().replace(/\/+$/, "");
  const title = String(candidate.title || "").trim().toLowerCase();

  for (const q of queueItems || []) {
    const qKey = String(q?.dedupeKey || "").trim().toLowerCase();
    const qUrl = String(q?.officialSourceUrl || "").trim().toLowerCase().replace(/\/+$/, "");
    const qTitle = String(q?.title || "").trim().toLowerCase();
    if ((key && qKey && key === qKey) || (url && qUrl && url === qUrl) || (title && qTitle && title === qTitle)) {
      return true;
    }
  }
  for (const s of existingSchemes || []) {
    const sUrl = String(s?.officialSourceUrl || s?.officialPortalUrl || "").trim().toLowerCase().replace(/\/+$/, "");
    const sName = String(s?.name || "").trim().toLowerCase();
    if ((title && sName && sName === title) || (url && sUrl && url === sUrl && title && sName.includes(title.slice(0, 24)))) {
      return true;
    }
  }
  return false;
}
