// ============================================================================
// GURU JI VISION — PHASE 6 SKILL ZONE DATA, TAXONOMY & PROGRESS ENGINE
// ============================================================================
// Comprehensive Skill Zone taxonomy, verified official training portal seeds,
// honest career preparation guides, role-based filtering & strict completion
// evaluation for Students, Farmers, Women Farmers, and all registered users.
//
// DATA INTEGRITY POLICY:
// - NEVER invent job vacancies, salaries, recruitment deadlines, or job offers.
// - Clearly distinguish VERIFIED_NOTIFICATION (official verified job/training
//   notice added by Admin) from CAREER_GUIDANCE (general preparation guidance).
// - NEVER mark a program completed or unlock a certificate unless ALL defined
//   completion conditions (every lesson in the program) are actually completed.
// ============================================================================

export const SKILL_CATEGORIES = [
  { key: "AGRI_SKILL_DEV", en: "Agriculture Skill Development", bn: "কৃষি দক্ষতা উন্নয়ন", badge: "bg-emerald-100 text-emerald-950 border-emerald-200" },
  { key: "COMPUTER_DIGITAL", en: "Computer and Digital Skills", bn: "কম্পিউটার ও ডিজিটাল দক্ষতা", badge: "bg-sky-100 text-sky-950 border-sky-200" },
  { key: "DIGITAL_AGRI_TECH", en: "Digital Agriculture and Agri-Tech", bn: "ডিজিটাল কৃষি ও অ্যাগ্রি-টেক", badge: "bg-teal-100 text-teal-950 border-teal-200" },
  { key: "ENTREPRENEURSHIP_BUSINESS", en: "Entrepreneurship and Business Skills", bn: "উদ্যোক্তা ও ব্যবসা দক্ষতা", badge: "bg-amber-100 text-amber-950 border-amber-200" },
  { key: "NURSERY_HORTICULTURE", en: "Nursery and Horticulture Training", bn: "নার্সারি ও উদ্যানপালন প্রশিক্ষণ", badge: "bg-lime-100 text-lime-950 border-lime-200" },
  { key: "ORGANIC_NATURAL_FARMING", en: "Organic and Natural Farming", bn: "জৈব ও প্রাকৃতিক কৃষি", badge: "bg-green-100 text-green-950 border-green-200" },
  { key: "DAIRY_LIVESTOCK", en: "Dairy and Livestock", bn: "দুগ্ধ ও পশুপালন", badge: "bg-orange-100 text-orange-950 border-orange-200" },
  { key: "POULTRY_FISHERIES", en: "Poultry and Fisheries", bn: "পোল্ট্রি ও মৎস্য চাষ", badge: "bg-cyan-100 text-cyan-950 border-cyan-200" },
  { key: "FOOD_PROCESSING_VALUE", en: "Food Processing and Value Addition", bn: "খাদ্য প্রক্রিয়াকরণ ও মূল্য সংযোজন", badge: "bg-rose-100 text-rose-950 border-rose-200" },
  { key: "COMMUNICATION_SOFT_SKILLS", en: "Communication and Soft Skills", bn: "যোগাযোগ ও সফট স্কিলস", badge: "bg-indigo-100 text-indigo-950 border-indigo-200" },
  { key: "FINANCIAL_LITERACY", en: "Financial Literacy", bn: "আর্থিক সাক্ষরতা", badge: "bg-yellow-100 text-yellow-950 border-yellow-200" },
  { key: "GOVT_TRAINING_PROGRAMS", en: "Government Training Programs", bn: "সরকারি প্রশিক্ষণ কর্মসূচি", badge: "bg-emerald-100 text-emerald-950 border-emerald-300" },
  { key: "INTERNSHIP_APPRENTICESHIP", en: "Internship and Apprenticeship", bn: "ইন্টার্নশিপ ও অ্যাপ্রেন্টিসশিপ", badge: "bg-purple-100 text-purple-950 border-purple-200" },
  { key: "JOB_PREPARATION", en: "Job Preparation", bn: "চাকরির প্রস্তুতি", badge: "bg-blue-100 text-blue-950 border-blue-200" },
  { key: "COMPETITIVE_EXAM_PREP", en: "Competitive Exam Preparation", bn: "প্রতিযোগিতামূলক পরীক্ষার প্রস্তুতি", badge: "bg-fuchsia-100 text-fuchsia-950 border-fuchsia-200" }
];

export const SKILL_CATEGORY_MAP = Object.fromEntries(SKILL_CATEGORIES.map((c) => [c.key, c]));
export const SKILL_CATEGORY_KEYS = SKILL_CATEGORIES.map((c) => c.key);

export const SKILL_AUDIENCE_ROLES = [
  { key: "ALL", en: "Everyone", bn: "সবার জন্য" },
  { key: "STUDENT", en: "Agriculture Students", bn: "কৃষি শিক্ষার্থী" },
  { key: "FARMER", en: "Farmers", bn: "কৃষক" },
  { key: "WOMEN_FARMER", en: "Women Farmers", bn: "নারী কৃষক" }
];

export const SKILL_AUDIENCE_MAP = Object.fromEntries(SKILL_AUDIENCE_ROLES.map((r) => [r.key, r]));

export const CAREER_PREP_CATEGORIES = [
  { key: "AGRI_JOB_PREP", en: "Agriculture Job Preparation", bn: "কৃষি চাকরির প্রস্তুতি" },
  { key: "GOVT_JOB_PREP", en: "Government Job Preparation", bn: "সরকারি চাকরির প্রস্তুতি" },
  { key: "PRIVATE_SECTOR", en: "Private-Sector Opportunities", bn: "বেসরকারি খাতের সুযোগ" },
  { key: "INTERNSHIP", en: "Internship Information", bn: "ইন্টার্নশিপ তথ্য" },
  { key: "APPRENTICESHIP", en: "Apprenticeship Information", bn: "অ্যাপ্রেন্টিসশিপ তথ্য" },
  { key: "INTERVIEW_PREP", en: "Interview Preparation", bn: "ইন্টারভিউ প্রস্তুতি" },
  { key: "RESUME_CAREER", en: "Resume & Career Guidance", bn: "রিজিউমে ও ক্যারিয়ার গাইডেন্স" },
  { key: "COMPETITIVE_EXAM", en: "Competitive Exam Resources", bn: "প্রতিযোগিতামূলক পরীক্ষার রিসোর্স" }
];

export const CAREER_PREP_CATEGORY_MAP = Object.fromEntries(CAREER_PREP_CATEGORIES.map((c) => [c.key, c]));
export const CAREER_PREP_CATEGORY_KEYS = CAREER_PREP_CATEGORIES.map((c) => c.key);

export const CAREER_RECORD_KINDS = {
  VERIFIED_NOTIFICATION: {
    key: "VERIFIED_NOTIFICATION",
    en: "Verified Official Notification",
    bn: "যাচাইকৃত অফিশিয়াল বিজ্ঞপ্তি",
    cls: "bg-emerald-100 text-emerald-950 border-emerald-300"
  },
  CAREER_GUIDANCE: {
    key: "CAREER_GUIDANCE",
    en: "Career Guidance & Preparation",
    bn: "ক্যারিয়ার গাইডেন্স ও প্রস্তুতি",
    cls: "bg-sky-100 text-sky-950 border-sky-300"
  }
};

// ----------------------------------------------------------------------------
// VERIFIED OFFICIAL GOVERNMENT & PUBLIC SKILL TRAINING PROGRAMS (SEED CATALOG)
// Every entry references an authentic public/government institution.
// Zero invented fees, zero fake promises, zero fabricated vacancies.
// ----------------------------------------------------------------------------
export const VERIFIED_SEED_SKILL_PROGRAMS = [
  {
    id: "seed_skill_asci_sidh",
    title: "Skill India Digital Hub — Agriculture Skill Council (ASCI) Courses",
    titleBn: "স্কিল ইন্ডিয়া ডিজিটাল হাব — কৃষি দক্ষতা কাউন্সিল (ASCI) প্রশিক্ষণ",
    category: "AGRI_SKILL_DEV",
    targetRoles: ["ALL", "STUDENT", "FARMER", "WOMEN_FARMER"],
    provider: "Ministry of Skill Development & Entrepreneurship (MSDE) / ASCI",
    description: "Official Government of India Skill India Digital Hub catalogue of NSQF-aligned agriculture job roles, field technician courses, and micro-credentials.",
    eligibility: "Open to Indian citizens; specific NSQF courses list minimum educational or farming experience requirements on the portal.",
    duration: "Self-paced / Short-term (varies by chosen course on portal)",
    verifiedFees: "Free for PMKVY / open online modules (verify specific course fee on official portal)",
    certificateDetails: "Official Skill India / NSDC digital certificate awarded by the training provider upon passing their assessment.",
    youtubeUrl: "",
    courseUrl: "https://www.skillindiadigital.gov.in/",
    pdfUrl: "",
    applicationUrl: "https://www.skillindiadigital.gov.in/courses",
    officialSourceUrl: "https://asci-india.com/",
    certificateUrl: "https://www.skillindiadigital.gov.in/",
    language: "BILINGUAL",
    published: true,
    verifiedOfficial: true,
    lastVerifiedDate: "2026-11-26",
    lessons: [
      { id: "l1", title: "Explore NSQF Agriculture Job Roles on ASCI & Skill India Digital Hub" },
      { id: "l2", title: "Verify Eligibility, Training Centre & Course Duration" },
      { id: "l3", title: "Complete Online Registration & Assessment Guidelines Review" }
    ]
  },
  {
    id: "seed_skill_pmgdisha_digital",
    title: "Computer Basics, Smartphone Literacy & Digital Public Services",
    titleBn: "কম্পিউটার বেসিক, স্মার্টফোন ও ডিজিটাল পরিষেবা প্রশিক্ষণ",
    category: "COMPUTER_DIGITAL",
    targetRoles: ["ALL", "STUDENT", "FARMER", "WOMEN_FARMER"],
    provider: "National Institute of Electronics & Information Technology (NIELIT) / Digital India",
    description: "Structured foundational digital literacy track covering computer essentials, Bangla/English typing, safe UPI payments, e-Governance portals, and online form submission.",
    eligibility: "Open to students, farmers, SHG members, and rural learners.",
    duration: "4 self-paced practical modules",
    verifiedFees: "Free open learning guidance (official NIELIT CCC exam fees apply only if registering on student.nielit.gov.in)",
    certificateDetails: "Official NIELIT CCC certificate available separately via NIELIT examination; Guru Ji Vision tracks learning completion only after all lessons are completed.",
    youtubeUrl: "",
    courseUrl: "https://student.nielit.gov.in/",
    pdfUrl: "",
    applicationUrl: "https://student.nielit.gov.in/",
    officialSourceUrl: "https://www.nielit.gov.in/",
    certificateUrl: "https://student.nielit.gov.in/",
    language: "BILINGUAL",
    published: true,
    verifiedOfficial: true,
    lastVerifiedDate: "2026-11-26",
    lessons: [
      { id: "l1", title: "Computer Hardware, File Management & Safe Internet Habits" },
      { id: "l2", title: "Document Creation (Word/PDF) & Spreadsheet Basics for Farm/Study Records" },
      { id: "l3", title: "Using Official Govt Portals (Digilocker, Bangla Sahayata Kendra, UMANG)" },
      { id: "l4", title: "Digital Payment Safety, OTP Protection & Fraud Prevention" }
    ]
  },
  {
    id: "seed_skill_digital_agri_swayam",
    title: "Digital Agriculture, GIS & Precision Farming Foundations (SWAYAM / ICAR)",
    titleBn: "ডিজিটাল কৃষি, GIS ও প্রিসিশন ফার্মিং ফাউন্ডেশন",
    category: "DIGITAL_AGRI_TECH",
    targetRoles: ["STUDENT", "FARMER"],
    provider: "SWAYAM / NPTEL / ICAR e-Courses",
    description: "Learn weather advisory interpretation, soil health card analytics, remote sensing basics, drone spraying regulations, and agri-advisory mobile applications.",
    eligibility: "Ideal for B.Sc. Agriculture students and progressive farmers.",
    duration: "4–12 weeks (depending on SWAYAM semester course)",
    verifiedFees: "Free online audit on SWAYAM (optional proctored exam fee notified by SWAYAM)",
    certificateDetails: "Official SWAYAM / NPTEL certificate issued by partner institution after passing proctored exam.",
    youtubeUrl: "",
    courseUrl: "https://swayam.gov.in/",
    pdfUrl: "",
    applicationUrl: "https://swayam.gov.in/",
    officialSourceUrl: "https://ecourses.icar.gov.in/",
    certificateUrl: "https://swayam.gov.in/",
    language: "EN",
    published: true,
    verifiedOfficial: true,
    lastVerifiedDate: "2026-11-26",
    lessons: [
      { id: "l1", title: "Interpreting Soil Health Cards & Balanced NPK Calculations" },
      { id: "l2", title: "Using IMD / Open Weather Forecasts for Sowing & Spraying Decisions" },
      { id: "l3", title: "Introduction to GIS Mapping, Crop Scouting & Drone Safety Rules" }
    ]
  },
  {
    id: "seed_skill_manage_acabc",
    title: "Agri-Clinics & Agri-Business Centres (ACABC) Entrepreneurship Training",
    titleBn: "অ্যাগ্রি-ক্লিনিক ও অ্যাগ্রি-বিজনেস সেন্টার (ACABC) উদ্যোক্তা প্রশিক্ষণ",
    category: "ENTREPRENEURSHIP_BUSINESS",
    targetRoles: ["STUDENT", "WOMEN_FARMER", "FARMER"],
    provider: "MANAGE (National Institute of Agricultural Extension Management), Govt. of India",
    description: "Flagship central residential/online training program helping agriculture graduates, diploma holders, and agri-entrepreneurs establish viable agri-ventures with bank-linked credit guidance.",
    eligibility: "Agriculture & allied graduates, diploma holders, or eligible candidates as specified on official ACABC portal.",
    duration: "45 days residential training (as per official MANAGE guidelines)",
    verifiedFees: "Free residential training funded by Ministry of Agriculture & Farmers Welfare for eligible selected candidates",
    certificateDetails: "Official MANAGE ACABC completion certificate issued by Nodal Training Institute upon completing training.",
    youtubeUrl: "",
    courseUrl: "https://www.agriclinics.net/",
    pdfUrl: "",
    applicationUrl: "https://www.agriclinics.net/",
    officialSourceUrl: "https://www.manage.gov.in/",
    certificateUrl: "https://www.agriclinics.net/",
    language: "BILINGUAL",
    published: true,
    verifiedOfficial: true,
    lastVerifiedDate: "2026-11-26",
    lessons: [
      { id: "l1", title: "Understand ACABC Eligibility & Nodal Training Institutes (NTIs)" },
      { id: "l2", title: "Draft a Detailed Project Report (DPR) for an Agri-Enterprise" },
      { id: "l3", title: "Review NABARD Subsidy & Bank Credit Linkage Process" }
    ]
  },
  {
    id: "seed_skill_nursery_horticulture",
    title: "Commercial Nursery Management, Grafting & Horticulture Skills",
    titleBn: "বাণিজ্যিক নার্সারি ব্যবস্থাপনা, কলম তৈরি ও উদ্যানপালন প্রশিক্ষণ",
    category: "NURSERY_HORTICULTURE",
    targetRoles: ["FARMER", "WOMEN_FARMER", "STUDENT"],
    provider: "National Horticulture Board (NHB) / ICAR-KVK West Bengal",
    description: "Practical nursery skills covering quality mother-plant selection, protray vegetable seedling production, budding/grafting, shade-net management, and nursery accreditation standards.",
    eligibility: "Farmers, rural youth, women SHGs, and horticulture learners.",
    duration: "3 structured practical lessons + KVK field training guide",
    verifiedFees: "Free public reference (verify KVK batch fees directly with district KVK)",
    certificateDetails: "District KVK issues training certificates for attended offline batches.",
    youtubeUrl: "",
    courseUrl: "https://nhb.gov.in/",
    pdfUrl: "",
    applicationUrl: "https://kvk.icar.gov.in/",
    officialSourceUrl: "https://nhb.gov.in/",
    certificateUrl: "",
    language: "BILINGUAL",
    published: true,
    verifiedOfficial: true,
    lastVerifiedDate: "2026-11-26",
    lessons: [
      { id: "l1", title: "Cocopeat & Protray Media Preparation for Disease-Free Seedlings" },
      { id: "l2", title: "Vegetative Propagation: Softwood Grafting, Layering & Hardening" },
      { id: "l3", title: "NHB Quality Nursery Standards & Local KVK Registration Steps" }
    ]
  },
  {
    id: "seed_skill_organic_natural",
    title: "Organic Farming, Vermicomposting & Natural Farming Practices (NCONF)",
    titleBn: "জৈব কৃষি, ভার্মিকম্পোস্ট ও প্রাকৃতিক কৃষি প্রশিক্ষণ",
    category: "ORGANIC_NATURAL_FARMING",
    targetRoles: ["FARMER", "WOMEN_FARMER", "STUDENT"],
    provider: "National Centre for Organic and Natural Farming (NCONF) / PKVY",
    description: "Hands-on curriculum on vermicompost bed setup, Jeevamrit/Beejamrit preparation, botanical pest management, soil organic carbon restoration, and PGS-India organic certification.",
    eligibility: "Open to all farmers, women SHGs, FPOs, and agriculture students.",
    duration: "4 practical modules",
    verifiedFees: "Free official training resources (PGS-India group certification guidelines available on official portal)",
    certificateDetails: "Official PGS-India organic farm certification is processed through Regional Councils; Guru Ji Vision tracks module completion.",
    youtubeUrl: "",
    courseUrl: "https://pgsindia-ncof.gov.in/",
    pdfUrl: "",
    applicationUrl: "https://naturalfarming.dac.gov.in/",
    officialSourceUrl: "https://nconf.dac.gov.in/",
    certificateUrl: "https://pgsindia-ncof.gov.in/",
    language: "BILINGUAL",
    published: true,
    verifiedOfficial: true,
    lastVerifiedDate: "2026-11-26",
    lessons: [
      { id: "l1", title: "Setting Up a Low-Cost Vermicompost Unit (Eisenia fetida)" },
      { id: "l2", title: "Preparing Bio-Inputs, Neem Extracts & Mulching Protocols" },
      { id: "l3", title: "Understanding PGS-India Participatory Organic Certification" }
    ]
  },
  {
    id: "seed_skill_dairy_livestock",
    title: "Scientific Dairy Farming, Balanced Ration & Clean Milk Production",
    titleBn: "বৈজ্ঞানিক দুগ্ধ চাষ, সুষম খাদ্য ও স্বাস্থ্যসম্মত দুধ উৎপাদন",
    category: "DAIRY_LIVESTOCK",
    targetRoles: ["FARMER", "WOMEN_FARMER"],
    provider: "National Dairy Development Board (NDDB) / DAHD",
    description: "Practical dairy & livestock care covering shed hygiene, balanced green/dry fodder rationing, mastitis prevention, vaccination calendar, and dairy cooperative linkage.",
    eligibility: "Dairy farmers, women livestock rearers, and rural entrepreneurs.",
    duration: "3 structured practical lessons",
    verifiedFees: "Free official reference guides via NDDB / DAHD portals",
    certificateDetails: "Offline hands-on training certificates are issued by State Livestock Development Boards / KVKs.",
    youtubeUrl: "",
    courseUrl: "https://www.nddb.coop/",
    pdfUrl: "",
    applicationUrl: "https://dahd.nic.in/",
    officialSourceUrl: "https://www.nddb.coop/",
    certificateUrl: "",
    language: "BILINGUAL",
    published: true,
    verifiedOfficial: true,
    lastVerifiedDate: "2026-11-26",
    lessons: [
      { id: "l1", title: "Cattle Shed Hygiene, Ventilation & Clean Milking Steps" },
      { id: "l2", title: "Balanced Ration Formulation, Azolla & Mineral Mixture Use" },
      { id: "l3", title: "Preventive Vaccination Schedule & Veterinary Helpline Access" }
    ]
  },
  {
    id: "seed_skill_poultry_fisheries",
    title: "Backyard Poultry & Composite Freshwater Fish Farming (NFDB / PMMSY)",
    titleBn: "বাড়ির আঙিনায় হাঁস-মুরগি ও মিশ্র মৎস্য চাষ প্রশিক্ষণ",
    category: "POULTRY_FISHERIES",
    targetRoles: ["FARMER", "WOMEN_FARMER", "STUDENT"],
    provider: "National Fisheries Development Board (NFDB) / ICAR-CIFA",
    description: "Foundational rural livelihood training on backyard poultry brooding & biosecurity, plus composite carp culture, pond liming, water quality testing, and PMMSY support awareness.",
    eligibility: "Farmers, fisherwomen, SHGs, and agri/fisheries students.",
    duration: "3 structured modules",
    verifiedFees: "Free official portal guidance (check NFDB/State Fisheries Dept for batch training)",
    certificateDetails: "Official training certificates issued by NFDB / State Fisheries Extension Centres for attended batches.",
    youtubeUrl: "",
    courseUrl: "https://nfdb.gov.in/",
    pdfUrl: "",
    applicationUrl: "https://pmmsy.dof.gov.in/",
    officialSourceUrl: "https://nfdb.gov.in/",
    certificateUrl: "",
    language: "BILINGUAL",
    published: true,
    verifiedOfficial: true,
    lastVerifiedDate: "2026-11-26",
    lessons: [
      { id: "l1", title: "Pond Preparation, Liming & Composite Carp Stocking Ratios" },
      { id: "l2", title: "Dissolved Oxygen, Feeding Schedule & Disease Prevention" },
      { id: "l3", title: "Backyard Poultry Chick Brooding, Biosecurity & Vaccination" }
    ]
  },
  {
    id: "seed_skill_food_processing_pmfme",
    title: "Food Processing, FSSAI Hygiene & Value Addition (PMFME / NIFTEM)",
    titleBn: "খাদ্য প্রক্রিয়াকরণ, FSSAI স্বাস্থ্যবিধি ও মূল্য সংযোজন (PMFME)",
    category: "FOOD_PROCESSING_VALUE",
    targetRoles: ["WOMEN_FARMER", "FARMER", "STUDENT"],
    provider: "Ministry of Food Processing Industries (MoFPI) — PMFME / NIFTEM",
    description: "Learn hygienic processing of spices, pickles, dehydrated vegetables, mushroom products, packaging, labelling, and FSSAI registration for rural & women-led micro food enterprises.",
    eligibility: "Women SHG members, FPOs, farmers, and aspiring food entrepreneurs.",
    duration: "3 practical lessons + official NIFTEM training guides",
    verifiedFees: "Free official PMFME capacity-building resources (verify DPR/FSSAI govt registration fee on official portals)",
    certificateDetails: "Official PMFME / FoSTaC training certificates provided by MoFPI/FSSAI authorized partners.",
    youtubeUrl: "",
    courseUrl: "https://pmfme.mofpi.gov.in/",
    pdfUrl: "",
    applicationUrl: "https://pmfme.mofpi.gov.in/",
    officialSourceUrl: "https://niftem.ac.in/",
    certificateUrl: "https://fostac.fssai.gov.in/",
    language: "BILINGUAL",
    published: true,
    verifiedOfficial: true,
    lastVerifiedDate: "2026-11-26",
    lessons: [
      { id: "l1", title: "Selecting High-Demand Local Agri Value-Added Products" },
      { id: "l2", title: "FSSAI Basic Hygiene, Food-Grade Packaging & Shelf-Life Labelling" },
      { id: "l3", title: "Exploring PMFME Seed Capital & Micro-Enterprise Support" }
    ]
  },
  {
    id: "seed_skill_comm_soft",
    title: "Professional Communication, Extension Presentation & Workplace Skills",
    titleBn: "পেশাদার যোগাযোগ, উপস্থাপনা ও কর্মক্ষেত্রের দক্ষতা",
    category: "COMMUNICATION_SOFT_SKILLS",
    targetRoles: ["STUDENT", "WOMEN_FARMER", "ALL"],
    provider: "SWAYAM / National Career Service (NCS) Soft Skills Guides",
    description: "Build confident spoken & written communication, farmer extension presentation skills, SHG/FPO meeting leadership, and professional workplace etiquette.",
    eligibility: "Open to all students, SHG leaders, and job seekers.",
    duration: "3 self-paced lessons",
    verifiedFees: "Free open learning module",
    certificateDetails: "Guru Ji Vision completion record unlocked after completing all 3 lessons.",
    youtubeUrl: "",
    courseUrl: "https://www.ncs.gov.in/",
    pdfUrl: "",
    applicationUrl: "https://www.ncs.gov.in/",
    officialSourceUrl: "https://swayam.gov.in/",
    certificateUrl: "",
    language: "BILINGUAL",
    published: true,
    verifiedOfficial: true,
    lastVerifiedDate: "2026-11-26",
    lessons: [
      { id: "l1", title: "Structured Self-Introduction & Clear Extension Communication" },
      { id: "l2", title: "Writing Formal Applications, Emails & Field Reports" },
      { id: "l3", title: "Group Leadership, Negotiation & Buyer Pitching for Farmers/SHGs" }
    ]
  },
  {
    id: "seed_skill_financial_literacy",
    title: "Rural Financial Literacy, KCC Banking & Farm Bookkeeping (RBI / NABARD)",
    titleBn: "গ্রামীণ আর্থিক সাক্ষরতা, KCC ব্যাংকিং ও খামারের হিসাবরক্ষণ",
    category: "FINANCIAL_LITERACY",
    targetRoles: ["FARMER", "WOMEN_FARMER", "STUDENT", "ALL"],
    provider: "Reserve Bank of India (RBI Financial Education) / NABARD",
    description: "Practical financial literacy covering formal bank accounts, Kisan Credit Card (KCC) interest subvention rules, SHG-Bank linkage bookkeeping, crop insurance claims, and avoiding predatory debt.",
    eligibility: "Open to all farmers, women SHG members, and students.",
    duration: "3 structured lessons",
    verifiedFees: "Free public financial literacy initiative",
    certificateDetails: "Guru Ji Vision completion record unlocked after all 3 lessons are completed.",
    youtubeUrl: "",
    courseUrl: "https://www.rbi.org.in/financialeducation/",
    pdfUrl: "",
    applicationUrl: "https://www.rbi.org.in/financialeducation/",
    officialSourceUrl: "https://www.nabard.org/",
    certificateUrl: "",
    language: "BILINGUAL",
    published: true,
    verifiedOfficial: true,
    lastVerifiedDate: "2026-11-26",
    lessons: [
      { id: "l1", title: "Understanding Formal Interest Rates, KCC & Subvention Terms" },
      { id: "l2", title: "Maintaining Seasonal Crop Cost, Revenue & SHG Cashbooks" },
      { id: "l3", title: "Digital Banking Safety, Crop Insurance Claim Documentation & Grievance Rights" }
    ]
  },
  {
    id: "seed_skill_rseti_govt",
    title: "RSETI & West Bengal Utkarsh Bangla Government Skill Training",
    titleBn: "RSETI ও পশ্চিমবঙ্গ উৎকর্ষ বাংলা সরকারি দক্ষতা প্রশিক্ষণ",
    category: "GOVT_TRAINING_PROGRAMS",
    targetRoles: ["ALL", "FARMER", "WOMEN_FARMER", "STUDENT"],
    provider: "Ministry of Rural Development (RSETI) & Govt. of West Bengal (PBSSD — Utkarsh Bangla)",
    description: "Official government-funded residential and short-term vocational skill training programs through Rural Self Employment Training Institutes (RSETIs) and West Bengal's Utkarsh Bangla portal.",
    eligibility: "Rural youth, women SHG members, farmers, and West Bengal residents per official scheme eligibility.",
    duration: "1–6 weeks (course-specific on official portal)",
    verifiedFees: "Free government-sponsored training for eligible candidates",
    certificateDetails: "Official RSETI / PBSSD Utkarsh Bangla certificate issued by the government training institute upon completion.",
    youtubeUrl: "",
    courseUrl: "https://pbssd.gov.in/",
    pdfUrl: "",
    applicationUrl: "https://pbssd.gov.in/",
    officialSourceUrl: "https://nirdpr.org.in/",
    certificateUrl: "https://pbssd.gov.in/",
    language: "BILINGUAL",
    published: true,
    verifiedOfficial: true,
    lastVerifiedDate: "2026-11-26",
    lessons: [
      { id: "l1", title: "Identify Your District RSETI or Utkarsh Bangla Training Centre" },
      { id: "l2", title: "Review Trade List (Agri, Dairy, Tailoring, Food Processing, Computer)" },
      { id: "l3", title: "Prepare Aadhaar, Age/Address Proof & Apply via Official Portal" }
    ]
  },
  {
    id: "seed_skill_naps_apprenticeship",
    title: "National Apprenticeship Promotion Scheme (NAPS) & RAWE Internship Guide",
    titleBn: "জাতীয় অ্যাপ্রেন্টিসশিপ স্কিম (NAPS) ও কৃষি ইন্টার্নশিপ গাইড",
    category: "INTERNSHIP_APPRENTICESHIP",
    targetRoles: ["STUDENT", "ALL"],
    provider: "Ministry of Skill Development & Entrepreneurship (NAPS) / ICAR",
    description: "Official step-by-step orientation to registering on the Government of India Apprenticeship Portal (NAPS), preparing for B.Sc. Agriculture RAWE/AIA internships, and verifying stipend rules.",
    eligibility: "ITI, diploma, B.Sc. Agriculture, and eligible graduate candidates.",
    duration: "3 onboarding lessons",
    verifiedFees: "Free registration on official Government portal (never pay third-party agents)",
    certificateDetails: "Official National Apprenticeship Certificate (NAC) issued upon completing a registered NAPS apprenticeship.",
    youtubeUrl: "",
    courseUrl: "https://www.apprenticeshipindia.gov.in/",
    pdfUrl: "",
    applicationUrl: "https://www.apprenticeshipindia.gov.in/",
    officialSourceUrl: "https://www.apprenticeshipindia.gov.in/",
    certificateUrl: "https://www.apprenticeshipindia.gov.in/",
    language: "BILINGUAL",
    published: true,
    verifiedOfficial: true,
    lastVerifiedDate: "2026-11-26",
    lessons: [
      { id: "l1", title: "Create & e-KYC Verify Your Candidate Profile on ApprenticeshipIndia.gov.in" },
      { id: "l2", title: "Search Verified Agriculture, Food & Rural Establishments Safely" },
      { id: "l3", title: "Prepare Academic Documents & RAWE Field Diary Portfolio" }
    ]
  },
  {
    id: "seed_skill_job_prep_ncs",
    title: "Agriculture Career & Job Readiness Track (NCS + Resume + Interview)",
    titleBn: "কৃষি চাকরি ও ক্যারিয়ার প্রস্তুতি ট্র্যাক",
    category: "JOB_PREPARATION",
    targetRoles: ["STUDENT", "ALL"],
    provider: "National Career Service (NCS — Ministry of Labour & Employment) & Guru Ji Vision",
    description: "End-to-end job readiness covering official NCS portal registration, building a factual agriculture CV/resume, technical interview preparation, and spotting fake job scams.",
    eligibility: "Agriculture graduates, diploma holders, and rural job seekers.",
    duration: "3 structured lessons",
    verifiedFees: "Free official NCS portal & learning track",
    certificateDetails: "Guru Ji Vision completion record unlocked after finishing all 3 lessons.",
    youtubeUrl: "",
    courseUrl: "https://www.ncs.gov.in/",
    pdfUrl: "",
    applicationUrl: "https://www.ncs.gov.in/",
    officialSourceUrl: "https://www.ncs.gov.in/",
    certificateUrl: "",
    language: "BILINGUAL",
    published: true,
    verifiedOfficial: true,
    lastVerifiedDate: "2026-11-26",
    lessons: [
      { id: "l1", title: "Build a Clean, Truthful Agriculture CV Highlighting Fieldwork & RAWE" },
      { id: "l2", title: "Register & Search Verified Employers on National Career Service (NCS)" },
      { id: "l3", title: "Practice Common Technical & HR Interview Questions for Agri Roles" }
    ]
  },
  {
    id: "seed_skill_competitive_exam_prep",
    title: "Competitive Agriculture Exam Roadmap (ICAR JRF/SRF, IBPS AFO, NABARD, WBPSC ADA)",
    titleBn: "প্রতিযোগিতামূলক কৃষি পরীক্ষার প্রস্তুতি (ICAR, IBPS AFO, NABARD, WBPSC)",
    category: "COMPETITIVE_EXAM_PREP",
    targetRoles: ["STUDENT"],
    provider: "ICAR / NTA / IBPS / NABARD / WBPSC Official Exam Portals (Guidance)",
    description: "Structured preparation methodology covering official syllabus mapping, standard textbooks, previous-year paper analysis, and weekly mock test discipline for Indian agriculture competitive exams.",
    eligibility: "B.Sc. / M.Sc. Agriculture & allied science students.",
    duration: "4 structured strategy modules",
    verifiedFees: "Free preparation roadmap (check official exam portals for official exam application fees when announced)",
    certificateDetails: "Guru Ji Vision study completion record unlocked once all 4 strategy lessons are completed.",
    youtubeUrl: "",
    courseUrl: "https://icar.nta.nic.in/",
    pdfUrl: "",
    applicationUrl: "https://www.ibps.in/",
    officialSourceUrl: "https://www.nabard.org/",
    certificateUrl: "",
    language: "BILINGUAL",
    published: true,
    verifiedOfficial: true,
    lastVerifiedDate: "2026-11-26",
    lessons: [
      { id: "l1", title: "Map Official Syllabus & Weightage Across Agronomy, Soil Science & Horticulture" },
      { id: "l2", title: "Master Prelims Aptitude + Mains Agriculture Core for IBPS AFO & NABARD" },
      { id: "l3", title: "Review Official ICAR JRF/SRF & State ADA/AO Notification Portals" },
      { id: "l4", title: "Weekly Timed Mock Test & Error-Log Revision Protocol" }
    ]
  }
];

// ----------------------------------------------------------------------------
// VERIFIED CAREER GUIDANCE & OFFICIAL PORTAL DIRECTORY (ZERO INVENTED VACANCIES)
// Notice: All seed items here are strictly CAREER_GUIDANCE. Live recruitment
// notifications are NEVER fabricated — they appear as VERIFIED_NOTIFICATION
// ONLY when verified and published by Admin in Firestore!
// ----------------------------------------------------------------------------
export const VERIFIED_SEED_CAREER_RESOURCES = [
  {
    id: "seed_career_ibps_afo_guide",
    title: "IBPS Specialist Officer (Agriculture Field Officer — AFO) Preparation Guide",
    titleBn: "IBPS অ্যাগ্রিকালচার ফিল্ড অফিসার (AFO) প্রস্তুতি গাইড",
    prepCategory: "AGRI_JOB_PREP",
    recordKind: "CAREER_GUIDANCE",
    targetRoles: ["STUDENT"],
    organization: "IBPS Official Portal (Preparation Guidance)",
    summary: "Role overview, Prelims + Mains (Professional Knowledge in Agriculture) syllabus checklist, and interview preparation strategy. Always check ibps.in for official yearly notifications and dates.",
    eligibility: "4-year Degree (Graduation) in Agriculture / Horticulture / Animal Husbandry / Fisheries / Dairy / Allied streams as per official IBPS notification.",
    officialSourceUrl: "https://www.ibps.in/",
    applicationUrl: "https://www.ibps.in/",
    youtubeUrl: "",
    pdfUrl: "",
    verifiedNote: "General preparation guide — check official IBPS portal for live vacancies, dates, and official rules.",
    published: true,
    lastVerifiedDate: "2026-11-26"
  },
  {
    id: "seed_career_wbpsc_nabard_govt",
    title: "Government Agriculture Jobs Roadmap (WBPSC ADA, State AO, NABARD, FCI, CWC)",
    titleBn: "সরকারি কৃষি চাকরি রোডম্যাপ (WBPSC ADA, NABARD, FCI)",
    prepCategory: "GOVT_JOB_PREP",
    recordKind: "CAREER_GUIDANCE",
    targetRoles: ["STUDENT", "ALL"],
    organization: "WBPSC / NABARD / Central Govt Official Portals",
    summary: "Verified list of official government recruitment portals where West Bengal and Central agriculture vacancies are officially published. Never rely on unverified social media job forwards.",
    eligibility: "Varies by post (check official gazette notification on respective commission website).",
    officialSourceUrl: "https://psc.wb.gov.in/",
    applicationUrl: "https://www.nabard.org/careers-notices1.aspx",
    youtubeUrl: "",
    pdfUrl: "",
    verifiedNote: "Guidance resource only — no active vacancy or deadline is claimed here.",
    published: true,
    lastVerifiedDate: "2026-11-26"
  },
  {
    id: "seed_career_private_agritech",
    title: "Private-Sector Agri-Input, Seed, Food Processing & Agri-Tech Career Pathways",
    titleBn: "বেসরকারি বীজ, খাদ্য প্রক্রিয়াকরণ ও অ্যাগ্রি-টেক ক্যারিয়ার গাইড",
    prepCategory: "PRIVATE_SECTOR",
    recordKind: "CAREER_GUIDANCE",
    targetRoles: ["STUDENT", "FARMER", "WOMEN_FARMER"],
    organization: "National Career Service (NCS) & Agri Industry Skill Tracks",
    summary: "Guidance on roles in seed quality testing, soil laboratories, farm advisory, dairy collection centres, cold-chain logistics, and FPO management via official National Career Service listings.",
    eligibility: "Agriculture graduates, diploma holders, and trained rural youth.",
    officialSourceUrl: "https://www.ncs.gov.in/",
    applicationUrl: "https://www.ncs.gov.in/",
    youtubeUrl: "",
    pdfUrl: "",
    verifiedNote: "Career guidance — search live verified employers directly on NCS.",
    published: true,
    lastVerifiedDate: "2026-11-26"
  },
  {
    id: "seed_career_rawe_internship",
    title: "Agriculture Internship Guide (ICAR RAWE, KVK Field Attachment & Research Labs)",
    titleBn: "কৃষি ইন্টার্নশিপ গাইড (RAWE, KVK ও গবেষণাগার)",
    prepCategory: "INTERNSHIP",
    recordKind: "CAREER_GUIDANCE",
    targetRoles: ["STUDENT"],
    organization: "ICAR / State Agricultural Universities (BCKV, UBKV) / KVK",
    summary: "How to prepare applications for Rural Agricultural Work Experience (RAWE), ICAR institute summer fellowships, and district Krishi Vigyan Kendra (KVK) field attachments.",
    eligibility: "Enrolled B.Sc. / M.Sc. Agriculture & allied students with university forwarding.",
    officialSourceUrl: "https://icar.org.in/",
    applicationUrl: "https://kvk.icar.gov.in/",
    youtubeUrl: "",
    pdfUrl: "",
    verifiedNote: "Guidance resource — verify current intake windows with your university or target institute.",
    published: true,
    lastVerifiedDate: "2026-11-26"
  },
  {
    id: "seed_career_naps_apprenticeship_guide",
    title: "Official Apprenticeship Information (NAPS & NATS Government Portals)",
    titleBn: "অফিশিয়াল অ্যাপ্রেন্টিসশিপ তথ্য (NAPS ও NATS সরকারি পোর্টাল)",
    prepCategory: "APPRENTICESHIP",
    recordKind: "CAREER_GUIDANCE",
    targetRoles: ["STUDENT", "ALL"],
    organization: "Govt. of India — NAPS (MSDE) & NATS (Ministry of Education)",
    summary: "How graduates, diploma holders, and skill trainees register legitimately for paid apprenticeships under the Apprentices Act via NAPS and NATS without middlemen.",
    eligibility: "Registered trainees / diploma / graduate candidates meeting portal age and qualification criteria.",
    officialSourceUrl: "https://www.apprenticeshipindia.gov.in/",
    applicationUrl: "https://nats.education.gov.in/",
    youtubeUrl: "",
    pdfUrl: "",
    verifiedNote: "Official government portal guidance — stipends and openings are displayed directly on NAPS/NATS.",
    published: true,
    lastVerifiedDate: "2026-11-26"
  },
  {
    id: "seed_career_interview_prep",
    title: "Agriculture Technical & Banking Interview Preparation Checklist",
    titleBn: "কৃষি ও ব্যাংকিং ইন্টারভিউ প্রস্তুতি চেকলিস্ট",
    prepCategory: "INTERVIEW_PREP",
    recordKind: "CAREER_GUIDANCE",
    targetRoles: ["STUDENT", "WOMEN_FARMER", "ALL"],
    organization: "Guru Ji Vision Career Mentorship Guide",
    summary: "Practical preparation checklist covering local crop calendar knowledge, West Bengal soil & scheme awareness, farm credit basics, confident body language, and honest answering.",
    eligibility: "All job, fellowship, and FPO/SHG leadership interview candidates.",
    officialSourceUrl: "https://www.ncs.gov.in/",
    applicationUrl: "",
    youtubeUrl: "",
    pdfUrl: "",
    verifiedNote: "General interview preparation guidance.",
    published: true,
    lastVerifiedDate: "2026-11-26"
  },
  {
    id: "seed_career_resume_guide",
    title: "ATS-Friendly Agriculture Resume & Portfolio Building Guide",
    titleBn: "কৃষি রিজিউমে ও ক্যারিয়ার পোর্টফোলিও গাইড",
    prepCategory: "RESUME_CAREER",
    recordKind: "CAREER_GUIDANCE",
    targetRoles: ["STUDENT", "ALL"],
    organization: "Guru Ji Vision Career Guidance",
    summary: "Structure a factual 1-page agriculture CV featuring degree/OGPA, RAWE & practical lab skills, soil/crop tools, KVK/ASCI certificates, and verified references — with zero exaggeration.",
    eligibility: "Students, fresh graduates, and skill trainees.",
    officialSourceUrl: "https://www.ncs.gov.in/",
    applicationUrl: "",
    youtubeUrl: "",
    pdfUrl: "",
    verifiedNote: "General resume and career documentation guidance.",
    published: true,
    lastVerifiedDate: "2026-11-26"
  },
  {
    id: "seed_career_competitive_exams",
    title: "Official Competitive Exam Portals (ICAR AIEEA PG/PhD, ASRB NET, GATE XL/AG)",
    titleBn: "প্রতিযোগিতামূলক পরীক্ষার অফিশিয়াল পোর্টালসমূহ",
    prepCategory: "COMPETITIVE_EXAM",
    recordKind: "CAREER_GUIDANCE",
    targetRoles: ["STUDENT"],
    organization: "NTA ICAR / ASRB / IIT GATE Official Portals",
    summary: "Direct links to official exam authorities for syllabus downloads, previous bulletins, and authentic exam schedules for higher studies and research careers in agriculture.",
    eligibility: "Graduates / Postgraduates in Agriculture & allied sciences per official information bulletin.",
    officialSourceUrl: "https://asrb.org.in/",
    applicationUrl: "https://icar.nta.nic.in/",
    youtubeUrl: "",
    pdfUrl: "",
    verifiedNote: "Official reference links — verify live exam dates exclusively on official bulletins.",
    published: true,
    lastVerifiedDate: "2026-11-26"
  }
];

// ----------------------------------------------------------------------------
// NORMALIZATION & MERGING HELPERS
// ----------------------------------------------------------------------------
export function normalizeLessons(rawLessons = []) {
  if (Array.isArray(rawLessons)) {
    return rawLessons
      .map((item, idx) => {
        if (typeof item === "string") {
          const title = item.trim().slice(0, 180);
          return title ? { id: `l${idx + 1}`, title } : null;
        }
        if (item && typeof item === "object") {
          const title = String(item.title || "").trim().slice(0, 180);
          const id = String(item.id || `l${idx + 1}`).trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || `l${idx + 1}`;
          return title ? { id, title } : null;
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 30);
  }
  if (typeof rawLessons === "string") {
    return rawLessons
      .split(/\r?\n/)
      .map((line, idx) => {
        const title = line.replace(/^[-*•\d.)\s]+/, "").trim().slice(0, 180);
        return title ? { id: `l${idx + 1}`, title } : null;
      })
      .filter(Boolean)
      .slice(0, 30);
  }
  return [];
}

export function normalizeTargetRoles(rawRoles = []) {
  const valid = new Set(["ALL", "STUDENT", "FARMER", "WOMEN_FARMER"]);
  const arr = (Array.isArray(rawRoles) ? rawRoles : [rawRoles])
    .map((r) => String(r || "").trim().toUpperCase())
    .filter((r) => valid.has(r));
  return arr.length ? Array.from(new Set(arr)) : ["ALL"];
}

export function mergeSkillPrograms(cloudList = [], includeDrafts = false) {
  const cloud = (Array.isArray(cloudList) ? cloudList : [])
    .filter((item) => item && (includeDrafts || item.published === true))
    .map((item) => ({
      ...item,
      category: SKILL_CATEGORY_MAP[item.category] ? item.category : "AGRI_SKILL_DEV",
      targetRoles: normalizeTargetRoles(item.targetRoles),
      lessons: normalizeLessons(item.lessons),
      fromCloud: true
    }));

  const cloudIds = new Set(cloud.map((c) => c.id));
  const seeds = VERIFIED_SEED_SKILL_PROGRAMS
    .filter((s) => !cloudIds.has(s.id))
    .map((s) => ({ ...s, fromCloud: false }));

  return [...cloud, ...seeds];
}

export function mergeSkillCareerResources(cloudList = [], legacyCareerOpportunities = [], includeDrafts = false) {
  const cloud = (Array.isArray(cloudList) ? cloudList : [])
    .filter((item) => item && (includeDrafts || item.published === true))
    .map((item) => ({
      ...item,
      prepCategory: CAREER_PREP_CATEGORY_MAP[item.prepCategory] ? item.prepCategory : "AGRI_JOB_PREP",
      recordKind: item.recordKind === "VERIFIED_NOTIFICATION" ? "VERIFIED_NOTIFICATION" : "CAREER_GUIDANCE",
      targetRoles: normalizeTargetRoles(item.targetRoles),
      fromCloud: true
    }));

  // Also include Admin-published verified entries from existing /careerOpportunities without duplicating
  const legacyMapCategory = (cat) => {
    switch (cat) {
      case "GOVT_JOB": return "GOVT_JOB_PREP";
      case "PRIVATE_JOB": return "PRIVATE_SECTOR";
      case "INTERNSHIP": return "INTERNSHIP";
      case "COMPETITIVE_EXAM": return "COMPETITIVE_EXAM";
      default: return "AGRI_JOB_PREP";
    }
  };
  const existingCareerItems = (Array.isArray(legacyCareerOpportunities) ? legacyCareerOpportunities : [])
    .filter((c) => c && c.published !== false && c.fromCloud !== false && c.id && !String(c.id).startsWith("fallback_"))
    .map((c) => ({
      id: `career_opp_${c.id}`,
      title: c.title || "",
      titleBn: "",
      prepCategory: legacyMapCategory(c.category),
      recordKind: "VERIFIED_NOTIFICATION",
      targetRoles: ["STUDENT", "ALL"],
      organization: c.organization || "Verified Organization",
      summary: c.description || "",
      eligibility: c.eligibility || "",
      deadline: c.deadline || "",
      officialSourceUrl: c.applyUrl || "",
      applicationUrl: c.applyUrl || "",
      youtubeUrl: "",
      pdfUrl: "",
      verifiedNote: "Admin-published listing from Guru Ji Vision Careers directory.",
      published: true,
      fromLegacyCareers: true
    }));

  const existingIds = new Set(cloud.map((c) => c.id));
  const seeds = VERIFIED_SEED_CAREER_RESOURCES
    .filter((s) => !existingIds.has(s.id))
    .map((s) => ({ ...s, fromCloud: false }));

  return [...cloud, ...existingCareerItems, ...seeds];
}

// ----------------------------------------------------------------------------
// ROLE-BASED & CATEGORY FILTERING
// ----------------------------------------------------------------------------
export function matchesAudienceRole(targetRoles = ["ALL"], selectedRole = "ALL") {
  if (!selectedRole || selectedRole === "ALL") return true;
  const roles = normalizeTargetRoles(targetRoles);
  return roles.includes("ALL") || roles.includes(selectedRole);
}

export function filterSkillPrograms(programs = [], {
  category = "ALL",
  audienceRole = "ALL",
  format = "ALL",
  search = ""
} = {}) {
  const q = String(search || "").trim().toLowerCase();
  return (Array.isArray(programs) ? programs : []).filter((p) => {
    if (!p) return false;
    if (category !== "ALL" && p.category !== category) return false;
    if (!matchesAudienceRole(p.targetRoles, audienceRole)) return false;
    if (format === "VIDEO" && !p.youtubeUrl) return false;
    if (format === "COURSE" && !p.courseUrl) return false;
    if (format === "PDF" && !p.pdfUrl) return false;
    if (format === "CERT" && !p.certificateDetails) return false;
    if (q) {
      const cat = SKILL_CATEGORY_MAP[p.category] || { en: "", bn: "" };
      const hay = [
        p.title, p.titleBn, p.provider, p.description, p.eligibility,
        p.verifiedFees, p.certificateDetails, cat.en, cat.bn,
        ...(p.lessons || []).map((l) => l.title)
      ].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function filterSkillCareerResources(resources = [], {
  prepCategory = "ALL",
  recordKind = "ALL",
  audienceRole = "ALL",
  search = ""
} = {}) {
  const q = String(search || "").trim().toLowerCase();
  return (Array.isArray(resources) ? resources : []).filter((r) => {
    if (!r) return false;
    if (prepCategory !== "ALL" && r.prepCategory !== prepCategory) return false;
    if (recordKind !== "ALL" && r.recordKind !== recordKind) return false;
    if (!matchesAudienceRole(r.targetRoles, audienceRole)) return false;
    if (q) {
      const cat = CAREER_PREP_CATEGORY_MAP[r.prepCategory] || { en: "", bn: "" };
      const hay = [
        r.title, r.titleBn, r.organization, r.summary, r.eligibility,
        r.verifiedNote, cat.en, cat.bn
      ].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// ----------------------------------------------------------------------------
// STRICT USER PROGRESS & COMPLETION EVALUATION ENGINE
// NEVER marks a course completed or unlocks a certificate unless ALL defined
// lessons in the program are verified completed!
// ----------------------------------------------------------------------------
export function evaluateProgramCompletion(program, rawCompletedLessonIds = []) {
  const lessons = normalizeLessons(program?.lessons || []);
  const validIds = new Set(lessons.map((l) => l.id));
  const completedUnique = Array.from(
    new Set(
      (Array.isArray(rawCompletedLessonIds) ? rawCompletedLessonIds : [])
        .map((id) => String(id || "").trim())
        .filter((id) => validIds.has(id))
    )
  );
  const totalLessons = lessons.length;
  const completedCount = completedUnique.length;
  const remainingCount = Math.max(0, totalLessons - completedCount);

  // Strict completion rule: must have at least 1 defined lesson AND every single lesson completed
  const isCompleted = totalLessons > 0 && completedCount === totalLessons;
  const progressPercent = totalLessons > 0
    ? (isCompleted ? 100 : Math.min(99, Math.round((completedCount / totalLessons) * 100)))
    : 0;

  return {
    totalLessons,
    completedCount,
    remainingCount,
    completedLessonIds: completedUnique,
    progressPercent,
    isCompleted,
    certificateUnlocked: isCompleted
  };
}

export function resolveDefaultAudienceFromProfile(userProfile) {
  const role = String(userProfile?.role || "").toUpperCase();
  if (role === "FARMER") return "FARMER";
  if (role === "WOMEN_FARMER") return "WOMEN_FARMER";
  if (role === "STUDENT") return "STUDENT";
  return "ALL";
}
