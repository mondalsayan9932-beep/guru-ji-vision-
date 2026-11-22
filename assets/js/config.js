// ============================================================================
// Guru Ji Vision — Authoritative Configuration, Seed Directory & Reference Data
// Migrated 1:1 from com.aistudio.gurujivision.v2prod Android codebase
// ============================================================================

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDw01fgwsEdK0AIy8pHwVTy60axkrho2TQ",
  authDomain: "guru-ji-vision.firebaseapp.com",
  projectId: "guru-ji-vision",
  storageBucket: "guru-ji-vision.firebasestorage.app",
  messagingSenderId: "725784257884",
  appId: "1:725784257884:web:2fdb95a1d60b13aa5e8d99",
  measurementId: "G-HQLCQGPN43"
};

export const FIRESTORE_DATABASE_ID = "ai-studio-android-gurujivi-641f324c-f73f-4600-a445-e4253ef6fa80";
export const FOUNDER_EMAIL = "mondalsayan9932@gmail.com";

// Optional server-side WhatsApp Business OTP Cloud Function endpoint.
// NEVER put WhatsApp Business API secrets or access tokens in frontend JS.
// Configure window.GJV_WHATSAPP_OTP_ENDPOINT = "https://<region>-guru-ji-vision.cloudfunctions.net/whatsappOtp"
// once your official Meta WhatsApp Cloud API / Twilio Verify backend is deployed.
export const WHATSAPP_OTP_ENDPOINT = (typeof window !== "undefined" && window.GJV_WHATSAPP_OTP_ENDPOINT) || "";

export const DEFAULT_APP_SETTINGS = {
  whatsappNumber: "+919000000000",
  whatsappGroupInviteUrl: "https://chat.whatsapp.com/FUtzkunI4u097tdsa1dIxl?s=cl&p=a&iam=2",
  supportEmail: "mondalsayan9932@gmail.com",
  aboutText: "Guru Ji Vision is an Indian Agriculture & Education Ecosystem supporting B.Sc Agriculture students, farmers, and educators.",
  heroHeadline: "Empowering Indian Agriculture & B.Sc Agri Scholars",
  studentModuleEnabled: true,
  moneyManagerEnabled: true,
  farmerModuleEnabled: true,
  toolsModuleEnabled: true,
  aiAssistantEnabled: true,
  careerModuleEnabled: true,
  communityModuleEnabled: true,
  meetingZoneEnabled: true,
  doubtZoneEnabled: true,
  aiModelName: "gemini-3.8-flash",
  aiFreeSearchEnabled: true,
  aiDailyLimitPerUser: 25,
  aiPaidServicesApproved: false,
  maintenanceBanner: ""
};

// Authoritative 9-member Guru Ji Vision Faculty & Advisor Directory
// Migrated verbatim from ProfessorDirectorySeed.kt (including 9th advisor: Biswanath Sardar)
export const OFFICIAL_FACULTY = [
  {
    id: "prof_anulina_manna",
    name: "Dr. Anulina Manna",
    designation: "Assistant Professor",
    qualification: "M.Sc., PhD",
    subject: "Botany",
    department: "Biological Science",
    email: "anuman.lin@gmail.com",
    specialization: "Tissue Culture and Biological Related Advisor",
    avatarUrl: "",
    authorizedUid: "",
    canHostMeetings: true,
    active: true,
    displayOrder: 1
  },
  {
    id: "prof_sudip_bhattacharya",
    name: "Dr. Sudip Bhattacharya",
    designation: "Assistant Professor",
    qualification: "M.Sc., PhD",
    subject: "Agriculture",
    department: "Biological Science",
    email: "sudipbhattacharya234@gmail.com",
    specialization: "Genetics Related Advisor",
    avatarUrl: "",
    authorizedUid: "",
    canHostMeetings: true,
    active: true,
    displayOrder: 2
  },
  {
    id: "prof_pratonu_bandyopadhyay",
    name: "Dr. Pratonu Bandyopadhyay",
    designation: "Assistant Professor",
    qualification: "M.Sc., PhD",
    subject: "Agriculture",
    department: "Biological Science",
    email: "pratonu31@gmail.com",
    specialization: "Agronomy Related Advisor",
    avatarUrl: "",
    authorizedUid: "",
    canHostMeetings: true,
    active: true,
    displayOrder: 3
  },
  {
    id: "prof_subhas_patar",
    name: "Dr. Subhas Patar",
    designation: "Assistant Professor",
    qualification: "M.Sc., PhD",
    subject: "Agriculture",
    department: "Biological Science",
    email: "subhaspatar@gmail.com",
    specialization: "Plant Pathology and Entomology Related Advisor",
    avatarUrl: "",
    authorizedUid: "",
    canHostMeetings: true,
    active: true,
    displayOrder: 4
  },
  {
    id: "prof_monirul_haque",
    name: "Dr. Monirul Haque",
    designation: "Assistant Professor",
    qualification: "",
    subject: "",
    department: "Biological Sciences",
    email: "",
    specialization: "Agricultural Extension and Rural Development Related Advisor",
    avatarUrl: "",
    authorizedUid: "",
    canHostMeetings: true,
    active: true,
    displayOrder: 5
  },
  {
    id: "prof_soumyajyoti_das",
    name: "Dr. Soumyajyoti Das",
    designation: "Assistant Professor",
    qualification: "M.Sc., PhD",
    subject: "Agriculture",
    department: "Biological Science",
    email: "soumyasjd@gmail.com",
    specialization: "Intellectual Property Rights (IPR) Related Advisor",
    avatarUrl: "",
    authorizedUid: "",
    canHostMeetings: true,
    active: true,
    displayOrder: 6
  },
  {
    id: "prof_shrabanti_maity",
    name: "Dr. Shrabanti Maity",
    designation: "Assistant Professor",
    qualification: "M.Sc., PhD",
    subject: "Agriculture",
    department: "Biological Science",
    email: "",
    specialization: "Agronomy Related Sub-Advisor",
    avatarUrl: "",
    authorizedUid: "",
    canHostMeetings: true,
    active: true,
    displayOrder: 7
  },
  {
    id: "prof_anirban_bhowmik",
    name: "Dr. Anirban Bhowmik",
    designation: "Assistant Professor",
    qualification: "M.Sc., PhD",
    subject: "Agriculture",
    department: "Biological Science",
    email: "bhowmik.anirban1@gmail.com",
    specialization: "Soil Science Related Advisor",
    avatarUrl: "",
    authorizedUid: "",
    canHostMeetings: true,
    active: true,
    displayOrder: 8
  },
  {
    id: "prof_biswanath_sardar",
    name: "Biswanath Sardar",
    designation: "Technical Assistant",
    qualification: "B.Sc.",
    subject: "Agriculture",
    department: "Biological Science",
    email: "sardarbiswanath8597@gmail.com",
    specialization: "Agricultural Laboratory Management Related Advisor",
    avatarUrl: "",
    authorizedUid: "",
    canHostMeetings: true,
    active: true,
    displayOrder: 9
  }
];

export const KNOWN_FACULTY_EMAILS = new Set(
  OFFICIAL_FACULTY.map((f) => f.email.trim().toLowerCase()).filter(Boolean)
);

// Exact 6 Crop Presets from AgriReferenceData.kt
export const CROP_PRESETS = [
  {
    id: "paddy",
    nameEn: "Paddy / Rice (Aman & Boro)",
    nameBn: "ধান (আমন ও বোরো)",
    season: "Kharif (Jun–Nov) & Boro (Dec–May)",
    soilPh: "5.5 – 6.5 (Clayey loam)",
    npkPerHa: { n: 120, p: 60, k: 60 },
    spacingCm: { row: 20, plant: 15 },
    seedRateKgPerHa: "30–40 kg/ha (Transplanted), 5–6 kg/ha (SRI)",
    majorDiseases: ["Rice Blast (Magnaporthe oryzae)", "Bacterial Leaf Blight (BLB)", "Sheath Blight"],
    majorPests: ["Yellow Stem Borer", "Brown Plant Hopper (BPH)", "Leaf Folder"],
    ipmGuidance: "Use resistant varieties, balanced nitrogen split doses, pheromone traps (5/ha) for Stem Borer, and alternate wetting & drying to curb BPH. Consult local KVK before spraying."
  },
  {
    id: "wheat",
    nameEn: "Wheat",
    nameBn: "গম",
    season: "Rabi (Nov–Mar)",
    soilPh: "6.0 – 7.5 (Well-drained loam)",
    npkPerHa: { n: 120, p: 60, k: 40 },
    spacingCm: { row: 22.5, plant: 5 },
    seedRateKgPerHa: "100 kg/ha (Timely), 125 kg/ha (Late)",
    majorDiseases: ["Yellow & Brown Rust", "Loose Smut", "Karnal Bunt"],
    majorPests: ["Aphids", "Termites", "Pink Stem Borer"],
    ipmGuidance: "Irrigate critically at CRI stage (21 DAS). Treat seeds with Trichoderma or recommended fungicide prior to sowing; avoid late heavy nitrogen top-dressing."
  },
  {
    id: "potato",
    nameEn: "Potato",
    nameBn: "আলু",
    season: "Rabi (Oct–Feb)",
    soilPh: "5.2 – 6.4 (Sandy loam)",
    npkPerHa: { n: 180, p: 100, k: 120 },
    spacingCm: { row: 60, plant: 20 },
    seedRateKgPerHa: "2000–2500 kg/ha seed tubers",
    majorDiseases: ["Late Blight (Phytophthora infestans)", "Early Blight", "Black Scurf"],
    majorPests: ["Potato Tuber Moth", "Aphids (Virus vector)", "Cutworm"],
    ipmGuidance: "Use certified disease-free seed tubers, earth up properly at 30 DAP, monitor fog/cool humid spells for Late Blight preventive sprays per State Agriculture Dept advisory."
  },
  {
    id: "mustard",
    nameEn: "Mustard / Rapeseed",
    nameBn: "সরিষা",
    season: "Rabi (Oct–Feb)",
    soilPh: "6.0 – 7.5 (Light loam)",
    npkPerHa: { n: 80, p: 40, k: 40 },
    spacingCm: { row: 30, plant: 10 },
    seedRateKgPerHa: "4–5 kg/ha",
    majorDiseases: ["Alternaria Blight", "White Rust", "Downy Mildew"],
    majorPests: ["Mustard Aphid (Lipaphis erysimi)", "Painted Bug", "Sawfly"],
    ipmGuidance: "Timely October sowing escapes peak aphid build-up. Install yellow sticky traps, apply 20 kg Sulphur/ha for oil content, and conserve ladybird beetles."
  },
  {
    id: "tomato",
    nameEn: "Tomato",
    nameBn: "টমেটো",
    season: "Rabi & Kharif (Year-round)",
    soilPh: "6.0 – 7.0 (Fertile loam)",
    npkPerHa: { n: 120, p: 80, k: 80 },
    spacingCm: { row: 60, plant: 45 },
    seedRateKgPerHa: "350–400 g/ha (Open), 150 g/ha (Hybrid)",
    majorDiseases: ["Tomato Leaf Curl Virus (ToLCV)", "Early Blight", "Bacterial Wilt"],
    majorPests: ["Fruit Borer (Helicoverpa)", "Whitefly", "Leaf Miner"],
    ipmGuidance: "Raise seedlings under 40-mesh insect-proof nylon net, plant marigold as a trap crop (1:16 rows) for Fruit Borer, and use neem oil (Azadirachtin) for whiteflies."
  },
  {
    id: "jute",
    nameEn: "Jute",
    nameBn: "পাট",
    season: "Pre-Kharif (Mar–Jul)",
    soilPh: "5.8 – 7.0 (Alluvial loam)",
    npkPerHa: { n: 60, p: 30, k: 30 },
    spacingCm: { row: 25, plant: 7 },
    seedRateKgPerHa: "5–6 kg/ha (Tossa / Corchorus olitorius)",
    majorDiseases: ["Stem Rot (Macrophomina)", "Root Rot", "Anthracnose"],
    majorPests: ["Jute Semilooper", "Bihar Hairy Caterpillar", "Yellow Mite"],
    ipmGuidance: "Ensure good drainage to prevent stem rot, hand-pick early egg masses of hairy caterpillar, and use improved microbial retting (CRIJAF Sona) for golden fibre grade."
  }
];

export const AREA_UNITS = {
  HECTARE: { id: "HECTARE", labelEn: "Hectare (ha)", labelBn: "হেক্টর (ha)", hectaresPerUnit: 1.0 },
  ACRE: { id: "ACRE", labelEn: "Acre", labelBn: "একর", hectaresPerUnit: 0.404686 },
  BIGHA: { id: "BIGHA", labelEn: "Bigha (WB / 0.1338 ha)", labelBn: "বিঘা (পশ্চিমবঙ্গ)", hectaresPerUnit: 0.13378 }
};

export const MONEY_EXPENSE_CATEGORIES = [
  { id: "FOOD_MESS", labelEn: "Food & Mess", labelBn: "খাবার ও মেস" },
  { id: "HOSTEL_RENT", labelEn: "Hostel & Rent", labelBn: "হোস্টেল ও ভাড়া" },
  { id: "EDUCATION", labelEn: "College Fees & Books", labelBn: "কলেজ ফি ও বই" },
  { id: "TRAVEL_RECHARGE", labelEn: "Travel & Recharge", labelBn: "যাতায়াত ও রিচার্জ" },
  { id: "SHARED", labelEn: "Mess / Shared Expense", labelBn: "শেয়ার্ড মেস হিসাব" },
  { id: "SAVINGS", labelEn: "Savings Deposit", labelBn: "সঞ্চয়" },
  { id: "OTHER", labelEn: "Personal / Other", labelBn: "ব্যক্তিগত / অন্যান্য" }
];

export const MONEY_INCOME_CATEGORIES = [
  { id: "ALLOWANCE", labelEn: "Home Allowance", labelBn: "বাড়ি থেকে প্রাপ্ত" },
  { id: "SCHOLARSHIP", labelEn: "Scholarship", labelBn: "স্কলারশিপ" },
  { id: "OTHER", labelEn: "Part-time / Other Income", labelBn: "পার্ট-টাইম / অন্যান্য আয়" }
];

export const FARMER_EXPENSE_CATEGORIES = [
  { id: "SEEDS_FERTILIZER", labelEn: "Seeds & Fertilizers", labelBn: "বীজ ও সার" },
  { id: "IRRIGATION_PESTICIDE", labelEn: "Irrigation & Pesticides", labelBn: "সেচ ও কীটনাশক" },
  { id: "LABOUR_MACHINERY", labelEn: "Labour & Tractor/Machinery", labelBn: "শ্রমিক ও যন্ত্রপাতি" },
  { id: "LIVESTOCK_DAIRY", labelEn: "Livestock & Dairy Feed", labelBn: "পশুপালন ও খাদ্য" },
  { id: "TRAVEL_RECHARGE", labelEn: "Transport & Mandi Freight", labelBn: "পরিবহন ও বাজার ভাড়া" },
  { id: "OTHER", labelEn: "Other Farm Cost", labelBn: "অন্যান্য কৃষি খরচ" }
];

export const FARMER_INCOME_CATEGORIES = [
  { id: "HARVEST_SALE", labelEn: "Crop / Harvest Sale", labelBn: "ফসল বিক্রি আয়" },
  { id: "LIVESTOCK_DAIRY", labelEn: "Milk / Poultry / Fish Sale", labelBn: "দুধ / মাছ / পশু বিক্রি" },
  { id: "GOVT_SUBSIDY", labelEn: "Govt Scheme / PM-KISAN / Subsidy", labelBn: "সরকারি ভর্তুকি / অনুদান" },
  { id: "OTHER", labelEn: "Other Farm Income", labelBn: "অন্যান্য আয়" }
];

export const CAREER_GUIDANCE_TOPICS = [
  { id: "HIGHER_EDUCATION", labelEn: "M.Sc. / Higher Education & Universities", labelBn: "এম.এসসি ও উচ্চশিক্ষা" },
  { id: "ICAR_JRF", labelEn: "ICAR AIEEA / JRF / SRF / NET Preparation", labelBn: "আইসিএআর / জেআরএফ প্রস্তুতি" },
  { id: "GOVT_EXAMS", labelEn: "Govt Exams (IBPS AFO, ADA, NABARD, WBPSC)", labelBn: "সরকারি কৃষি চাকরি পরীক্ষা" },
  { id: "RESEARCH", labelEn: "Research Projects, Lab & IPR Guidance", labelBn: "গবেষণা ও ল্যাব গাইডেন্স" },
  { id: "INTERNSHIP_CAREER", labelEn: "Internships, RAWE, ELP & Agri Careers", labelBn: "ইন্টার্নশিপ ও কৃষি ক্যারিয়ার" },
  { id: "ACADEMIC_SUBJECT", labelEn: "B.Sc. Agriculture Subject Clarification", labelBn: "পাঠ্যবিষয় সংক্রান্ত প্রশ্ন" }
];

export const FARMER_ADVISOR_TOPICS = [
  { id: "CROP_PRODUCTION", labelEn: "Crop Production", labelBn: "ফসল উৎপাদন" },
  { id: "DISEASE_PEST", labelEn: "Crop Diseases & Pest Control", labelBn: "রোগ ও পোকামাকড় দমন" },
  { id: "FERTILIZER_NUTRIENT", labelEn: "Fertilizer & Soil Nutrients", labelBn: "সার ও মাটির পুষ্টি" },
  { id: "IRRIGATION_WATER", labelEn: "Irrigation & Water Management", labelBn: "সেচ ও জল ব্যবস্থাপনা" },
  { id: "SEED_SOWING", labelEn: "Seed Selection & Sowing", labelBn: "বীজ নির্বাচন ও বপন" },
  { id: "CROP_PROTECTION_TECH", labelEn: "Crop Protection & Agri Technology", labelBn: "ফসল সুরক্ষা ও আধুনিক প্রযুক্তি" }
];

export const CROP_NAME_BN_MAP = {
  rice: "ধান / চাল",
  paddy: "ধান",
  wheat: "গম",
  potato: "আলু",
  onion: "পেঁয়াজ",
  tomato: "টমেটো",
  mustard: "সরিষা",
  brinjal: "বেগুন",
  cabbage: "বাঁধাকপি",
  cauliflower: "ফুলকপি",
  jute: "পাট",
  chilli: "লঙ্কা",
  "green chilli": "কাঁচা লঙ্কা",
  banana: "কলা",
  maize: "ভুট্টা",
  ginger: "আদা",
  garlic: "রসুন",
  pumpkin: "কুমড়ো",
  cucumber: "শসা",
  "pointed gourd": "পটল",
  "bitter gourd": "করলা",
  bhindi: "ঢেঁড়স",
  "ladies finger": "ঢেঁড়স",
  lentil: "মসুর ডাল",
  masur: "মসুর ডাল",
  gram: "ছোলা",
  groundnut: "চিনাবাদাম",
  sesamum: "তিল",
  sugarcane: "আখ",
  mango: "আম",
  apple: "আপেল"
};

export const QUICK_WEATHER_LOCATIONS = [
  { name: "Purba Bardhaman", admin1: "West Bengal", country: "India", latitude: 23.2324, longitude: 87.8615 },
  { name: "Krishnanagar (Nadia)", admin1: "West Bengal", country: "India", latitude: 23.4013, longitude: 88.5019 },
  { name: "Hooghly (Chinsurah)", admin1: "West Bengal", country: "India", latitude: 22.8956, longitude: 88.4025 },
  { name: "Kolkata", admin1: "West Bengal", country: "India", latitude: 22.5726, longitude: 88.3639 },
  { name: "Medinipur", admin1: "West Bengal", country: "India", latitude: 22.4257, longitude: 87.3199 },
  { name: "Berhampore (Murshidabad)", admin1: "West Bengal", country: "India", latitude: 24.0983, longitude: 88.2494 },
  { name: "Bankura", admin1: "West Bengal", country: "India", latitude: 23.2313, longitude: 87.0784 },
  { name: "Siliguri (Darjeeling)", admin1: "West Bengal", country: "India", latitude: 26.7271, longitude: 88.3953 }
];

export const STUDY_CATEGORIES = {
  ALL: { en: "All", bn: "সব", badge: "bg-slate-100 text-slate-700" },
  NOTES_PDF: { en: "Notes & PDFs", bn: "নোটস ও পিডিএফ", badge: "bg-emerald-100 text-emerald-900" },
  PYQ: { en: "PYQ Papers", bn: "বিগত প্রশ্নপত্র", badge: "bg-amber-100 text-amber-900" },
  PRACTICAL: { en: "Practical", bn: "প্র্যাক্টিক্যাল", badge: "bg-sky-100 text-sky-900" },
  VIDEO_LECTURE: { en: "Video Lectures", bn: "ভিডিও লেকচার", badge: "bg-purple-100 text-purple-900" }
};

export const CAREER_CATEGORIES = {
  ALL: { en: "All", bn: "সব" },
  GOVT_JOB: { en: "Govt Jobs", bn: "সরকারি চাকরি" },
  PRIVATE_JOB: { en: "Private Jobs", bn: "বেসরকারি চাকরি" },
  SCHOLARSHIP: { en: "Scholarships", bn: "স্কলারশিপ" },
  INTERNSHIP: { en: "Internships", bn: "ইন্টার্নশিপ" },
  COMPETITIVE_EXAM: { en: "Competitive Exams", bn: "প্রতিযোগিতামূলক পরীক্ষা" }
};

export const COMMUNITY_TOPICS = {
  ALL: { en: "All Topics", bn: "সব বিষয়" },
  DOUBT: { en: "Ask a Doubt", bn: "প্রশ্ন জিজ্ঞাসা" },
  NOTES_SHARE: { en: "Notes Share", bn: "নোটস শেয়ার" },
  EXAM_PREP: { en: "Exam Prep", bn: "পরীক্ষার প্রস্তুতি" },
  FARM_TALK: { en: "Farm Talk", bn: "কৃষি আলোচনা" }
};

// ICAR 5th Deans' Committee B.Sc (Hons.) Agriculture Semester Syllabus Overview
export const ICAR_SYLLABUS = {
  1: ["Fundamentals of Agronomy", "Fundamentals of Soil Science", "Fundamentals of Horticulture", "Fundamentals of Plant Biochemistry & Biotechnology", "Comprehension & Communication Skills in English", "Rural Sociology & Educational Psychology"],
  2: ["Fundamentals of Genetics", "Agricultural Microbiology", "Soil and Water Conservation Engineering", "Fundamentals of Crop Physiology", "Fundamentals of Agricultural Economics", "Fundamentals of Plant Pathology", "Fundamentals of Entomology"],
  3: ["Crop Production Technology - I (Kharif Crops)", "Fundamentals of Plant Breeding", "Agricultural Finance and Co-operation", "Agri-Informatics", "Farm Machinery and Power", "Production Technology for Vegetables and Spices"],
  4: ["Crop Production Technology - II (Rabi Crops)", "Production Technology for Ornamental Crops, MAP & Landscaping", "Renewable Energy and Green Technology", "Problematic Soils and their Management", "Production Technology for Fruit & Plantation Crops", "Principles of Seed Technology"],
  5: ["Principles of Integrated Pest and Disease Management", "Manures, Fertilizers and Soil Fertility Management", "Pests of Crops and Stored Grain and their Management", "Diseases of Field & Horticultural Crops - I", "Crop Improvement - I (Kharif Crops)", "Entrepreneurship Development & Business Communication"],
  6: ["Rainfed Agriculture & Watershed Management", "Protected Cultivation and Secondary Agriculture", "Diseases of Field & Horticultural Crops - II", "Post-harvest Management & Value Addition of Fruits & Vegetables", "Management of Beneficial Insects", "Crop Improvement - II (Rabi Crops)", "Principles of Organic Farming"],
  7: ["RAWE (Rural Agricultural Work Experience)", "Agro-Industrial Attachment (AIA)", "Village Attachment & KVK Field Training"],
  8: ["ELP (Experiential Learning Programme) — Module I & II", "Agri-Business Project Work & Seminar"]
};

// Safe starter fallback content shown ONLY when visitor is offline or unauthenticated
// (NEVER claimed as live Firestore sync!)
export const FALLBACK_STUDY_MATERIALS = [
  {
    id: "fallback-agr-101",
    title: "Fundamentals of Agronomy — Tillage, Crop Geometry & Weed Management",
    semester: 1,
    subject: "Agronomy (AGR-101)",
    category: "NOTES_PDF",
    summary: "ICAR 5th Deans' Committee notes covering primary/secondary tillage, tilth, plant density, critical weed competition period, and herbicide classification.",
    contentText: "1. TILLAGE & TILTH\n• Primary Tillage: Deep opening of soil using MB plough, disc plough, or subsoiler to break hardpan.\n• Secondary Tillage: Harrowing, planking, and leveling to prepare a fine seedbed.\n• Zero Tillage: Direct drilling of wheat after paddy saves 25–30% fuel and advances sowing by 10–15 days.\n\n2. WEED MANAGEMENT\n• Critical Period of Crop-Weed Competition: First 1/3rd to 1/2 of crop life cycle (e.g., 15–45 DAS in direct-seeded rice).\n• Pre-emergence Herbicides: Pendimethalin, Pretilachlor, Atrazine.\n• Post-emergence Herbicides: 2,4-D, Bispyribac-sodium, Sulfosulfuron.\n\n3. EXAM FORMULA\n• Cropping Intensity (%) = (Gross Cropped Area / Net Sown Area) × 100.",
    verifiedForAi: true,
    resourceUrl: "https://ecourses.icar.gov.in/",
    published: true,
    fromFallback: true
  },
  {
    id: "fallback-ssac-101",
    title: "Fundamentals of Soil Science — Clay Minerals, Soil pH & CEC",
    semester: 1,
    subject: "Soil Science (SSAC-101)",
    category: "NOTES_PDF",
    summary: "Revision notes on 1:1 Kaolinite vs 2:1 Montmorillonite silicate clays, Cation Exchange Capacity (CEC), and reclamation of acidic, saline, and sodic soils.",
    contentText: "1. SILICATE CLAY MINERALS & CEC (cmol(p+)/kg)\n• Kaolinite (1:1 non-expanding): CEC 3–15\n• Illite (2:1 non-expanding): CEC 15–40\n• Montmorillonite (2:1 expanding): CEC 80–120\n• Humus (Organic colloid): CEC 150–300\n\n2. PROBLEM SOILS & RECLAMATION\n• Acid Soil (pH < 6.5): Agricultural Lime (CaCO3) or Dolomite.\n• Saline Soil (EC > 4 dS/m, ESP < 15, pH < 8.5): Leaching with good water + drainage.\n• Sodic / Alkali Soil (EC < 4 dS/m, ESP > 15, pH > 8.5): Apply Gypsum (CaSO4·2H2O) + leaching.",
    verifiedForAi: true,
    resourceUrl: "https://ecourses.icar.gov.in/",
    published: true,
    fromFallback: true
  },
  {
    id: "fallback-path-201",
    title: "Plant Pathology Practical — Rice & Wheat Disease Identification Manual",
    semester: 2,
    subject: "Plant Pathology (PATH-201)",
    category: "PRACTICAL",
    summary: "Field identification guide for Rice Blast, Brown Spot, BLB, and Wheat Rusts (Black, Brown, Yellow) with causal organisms, symptoms, and IPM sprays.",
    contentText: "1. Rice Blast (Magnaporthe oryzae): Spindle-shaped spots with grey centre & brown margin; neck blast causes chaffy grains. Control: Tricyclazole 75 WP.\n2. Brown Spot (Bipolaris oryzae): Sesame-seed brown spots; caused 1943 Bengal Famine. Correct K/Zn deficiency.\n3. Bacterial Leaf Blight (Xanthomonas oryzae pv. oryzae): Wavy yellow leaf margins; positive bacterial ooze test.\n4. Wheat Rusts: Black/Stem (Puccinia graminis tritici), Brown/Leaf (P. triticina), Yellow/Stripe (P. striiformis).",
    verifiedForAi: true,
    resourceUrl: "https://ecourses.icar.gov.in/",
    published: true,
    fromFallback: true
  },
  {
    id: "fallback-gen-201",
    title: "Fundamentals of Genetics — Mendelian Ratios, Epistasis & Linkage",
    semester: 2,
    subject: "Genetics (GEN-201)",
    category: "NOTES_PDF",
    summary: "High-yield exam sheet on dihybrid modifications (9:7, 12:3:1, 15:1, 9:3:4), chromosomal aberrations, crossing over, and heterosis.",
    contentText: "MODIFIED DIHYBRID RATIOS (EXAM FAVORITES)\n• Complementary gene action: 9:7\n• Supplementary / Recessive epistasis: 9:3:4\n• Dominant epistasis: 12:3:1\n• Duplicate dominant genes: 15:1\n• Inhibitory gene action: 13:3\n• Polymeric / Additive gene action: 9:6:1\n\nLINKAGE & CROSSING OVER\n• Coupling vs Repulsion phase discovered by Bateson & Punnett (Sweet Pea).\n• 1% recombination = 1 centiMorgan (cM) map unit.",
    verifiedForAi: true,
    resourceUrl: "https://ecourses.icar.gov.in/",
    published: true,
    fromFallback: true
  },
  {
    id: "fallback-ent-401",
    title: "Integrated Pest Management (IPM) — PYQ Solved Bank",
    semester: 4,
    subject: "Agricultural Entomology (ENT-401)",
    category: "PYQ",
    summary: "University previous year questions covering EIL vs ETL, Trichogramma parasitoids, HaNPV, pheromone traps, and safe insecticide handling.",
    contentText: "Q1. Differentiate EIL and ETL.\n• EIL (Economic Injury Level): Lowest pest density causing economic damage.\n• ETL (Economic Threshold Level): Pest density at which control must start before EIL is reached.\n\nQ2. Bio-Control Agents:\n• Trichogramma spp. — Egg parasitoid (stem borers, bollworms).\n• Chrysoperla carnea — Predator of aphids & whiteflies.\n• HaNPV — Virus for Helicoverpa armigera.",
    verifiedForAi: true,
    resourceUrl: "https://ecourses.icar.gov.in/",
    published: true,
    fromFallback: true
  },
  {
    id: "fallback-econ-501",
    title: "Agricultural Economics — Law of Diminishing Returns & Farm Costs",
    semester: 5,
    subject: "Agricultural Economics (ECON-501)",
    category: "VIDEO_LECTURE",
    summary: "Three zones of classical production function, Elasticity of Production (Ep), MVP = MIC rule, and CACP Cost A1, B2, C2 concepts for MSP.",
    contentText: "THREE ZONES OF PRODUCTION FUNCTION\n• Zone I (Irrational): Ep > 1, MPP > APP.\n• Zone II (Rational Zone): 0 <= Ep <= 1, optimum where MVP = MIC.\n• Zone III (Irrational): Ep < 0, MPP negative.\n\nCACP COST CONCEPTS\n• Cost A1: Direct paid-out costs.\n• Cost B2: A1 + rental value of owned land + interest on fixed capital.\n• Cost C2: B2 + imputed value of family labour.",
    verifiedForAi: true,
    resourceUrl: "https://ecourses.icar.gov.in/",
    published: true,
    fromFallback: true
  }
];

export const FALLBACK_QUIZZES = [
  {
    id: "fallback-q1",
    title: "Critical Irrigation Stage in Wheat",
    semester: 1,
    subject: "Agronomy",
    questionText: "Which is the most critical stage for irrigation in Wheat (Triticum aestivum)?",
    options: ["Crown Root Initiation (CRI — 21 DAS)", "Milk Stage", "Flowering Stage", "Dough Stage"],
    correctIndex: 0,
    explanation: "CRI stage (around 20–25 DAS) is the most critical irrigation stage in wheat; moisture stress here severely reduces tillering and yield.",
    published: true
  },
  {
    id: "fallback-q2",
    title: "Reclamation of Sodic Soil",
    semester: 1,
    subject: "Soil Science",
    questionText: "Which amendment is standardly recommended for reclaiming Sodic (Alkali) soils (pH > 8.5, ESP > 15)?",
    options: ["Agricultural Lime (CaCO3)", "Gypsum (CaSO4·2H2O)", "Urea", "Single Super Phosphate"],
    correctIndex: 1,
    explanation: "Gypsum supplies soluble Ca2+ ions that displace excess exchangeable Na+ from clay colloids, which is then leached out.",
    published: true
  },
  {
    id: "fallback-q3",
    title: "Bengal Famine Causal Pathogen",
    semester: 2,
    subject: "Plant Pathology",
    questionText: "The historic 1943 Bengal Famine was associated with Brown Spot of Rice caused by:",
    options: ["Magnaporthe oryzae", "Bipolaris oryzae (Helminthosporium oryzae)", "Xanthomonas oryzae", "Puccinia graminis"],
    correctIndex: 1,
    explanation: "Bipolaris oryzae (syn. Helminthosporium oryzae) causes Brown Spot of Rice, responsible for the devastating 1943 Bengal Famine.",
    published: true
  },
  {
    id: "fallback-q4",
    title: "Nitrogen Content in DAP",
    semester: 1,
    subject: "Soil Fertility",
    questionText: "What is the exact nutrient grade (% N and % P2O5) of Di-Ammonium Phosphate (DAP)?",
    options: ["46% N, 0% P2O5", "18% N, 46% P2O5", "12% N, 32% P2O5", "20% N, 20% P2O5"],
    correctIndex: 1,
    explanation: "Standard DAP contains 18% Nitrogen (N) and 46% Phosphorus (P2O5).",
    published: true
  },
  {
    id: "fallback-q5",
    title: "Complementary Gene Ratio",
    semester: 2,
    subject: "Genetics",
    questionText: "In Mendelian epistasis, what phenotypic ratio represents complementary gene action?",
    options: ["12:3:1", "9:3:4", "9:7", "15:1"],
    correctIndex: 2,
    explanation: "Complementary gene interaction modifies the classic 9:3:3:1 dihybrid ratio to 9:7 (discovered in Lathyrus odoratus).",
    published: true
  }
];

export const FALLBACK_CAREERS = [
  {
    id: "fallback-car-1",
    title: "IBPS SO — Agriculture Field Officer (AFO)",
    organization: "IBPS / Public Sector Banks",
    category: "COMPETITIVE_EXAM",
    eligibility: "4-year Degree in B.Sc (Hons.) Agriculture / Horticulture / Forestry / Agri Engg",
    deadline: "Annual Cycle (Aug–Nov)",
    description: "Premier national banking officer examination for Agriculture graduates offering Officer Scale-I postings across Indian public sector banks.",
    applyUrl: "https://www.ibps.in/",
    published: true
  },
  {
    id: "fallback-car-2",
    title: "ICAR AIEEA (PG) & JRF Fellowship",
    organization: "ICAR / NTA",
    category: "SCHOLARSHIP",
    eligibility: "B.Sc (Hons.) Agriculture final year or graduates",
    deadline: "Annual Cycle (May–Jun)",
    description: "National entrance exam for M.Sc Agriculture admissions across SAUs and Deemed Universities with ICAR Junior Research Fellowship.",
    applyUrl: "https://exams.nta.ac.in/",
    published: true
  },
  {
    id: "fallback-car-3",
    title: "Assistant Director of Agriculture (ADA / WBPSC)",
    organization: "State Public Service Commission",
    category: "GOVT_JOB",
    eligibility: "B.Sc (Hons.) Agriculture from a recognized university",
    deadline: "Check Official Gazette",
    description: "State gazetted agriculture officer role leading block-level extension, seed quality, soil health, and farmer welfare programmes.",
    applyUrl: "https://psc.wb.gov.in/",
    published: true
  }
];

export const FALLBACK_ANNOUNCEMENTS = [
  {
    id: "fallback-ann-1",
    title: "Welcome to Guru Ji Vision Web Ecosystem",
    message: "Read published B.Sc Agriculture notes, ICAR syllabus, practice MCQs, crop disease guides, and practical calculators instantly. Sign in via WhatsApp/Phone or Email to unlock Private Money Manager, 1-on-1 Professor Doubt Zone, Meetings & Live Cloud Sync.",
    audience: "ALL",
    active: true,
    updatedAtMs: Date.now() - 3600000 * 3
  }
];

// Bilingual EN / BN UI Labels (migrated from L10n.kt + expanded for Weather, Market, Career & Farmer Advisor)
export const I18N = {
  en: {
    brand: "Guru Ji Vision",
    tagline: "Students • Farmers • Professors Ecosystem",
    navHome: "Home",
    navStudent: "Student",
    navWeather: "Weather",
    navMarket: "Mandi Price",
    navFarmer: "Farmer",
    navTools: "Tools",
    navAi: "AI Guru",
    navCommunity: "Community",
    navMoney: "Money & Farm",
    navMeeting: "Meetings",
    navCareerGuidance: "Student Career Guidance",
    navFarmerAdvisor: "Farmer Advisor Expert",
    navProfessorDash: "Professor Dashboard",
    navAdmin: "Admin Panel",
    navOwner: "Owner Center",
    signIn: "Sign In",
    signOut: "Sign Out",
    installApp: "Install App"
  },
  bn: {
    brand: "গুরু জি ভিশন",
    tagline: "ছাত্র • কৃষক • অধ্যাপক সমন্বিত কৃষি প্ল্যাটফর্ম",
    navHome: "হোম",
    navStudent: "ছাত্র পোর্টাল",
    navWeather: "আবহাওয়া",
    navMarket: "বাজারদর",
    navFarmer: "কৃষক সহায়তা",
    navTools: "কৃষি টুলস",
    navAi: "এআই গুরু",
    navCommunity: "কমিউনিটি",
    navMoney: "আয়-ব্যয় হিসাব",
    navMeeting: "মিটিং জোন",
    navCareerGuidance: "ছাত্র ক্যারিয়ার গাইডেন্স",
    navFarmerAdvisor: "কৃষক পরামর্শ বিশেষজ্ঞ",
    navProfessorDash: "অধ্যাপক ড্যাশবোর্ড",
    navAdmin: "অ্যাডমিন প্যানেল",
    navOwner: "ওনার সেন্টার",
    signIn: "লগইন",
    signOut: "লগআউট",
    installApp: "অ্যাপ ইনস্টল"
  }
};
