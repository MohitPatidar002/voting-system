import type { SchemeCategory } from "../types";

/**
 * Reference data for a Gram Panchayat in Madhya Pradesh.
 *
 * This drives admin dropdowns and can be used to seed the `schemes` collection
 * so a new village starts with the real central + MP-state schemes pre-loaded
 * instead of an empty screen. Names are kept bilingual-friendly (English +
 * Hindi) because villagers know these schemes by their Hindi names.
 */

export interface SchemeTemplate {
  name: string;
  nameHi: string;
  department: string;
  category: SchemeCategory;
  description: string;
  benefits: string;
  eligibility: string;
  requiredDocuments: string[];
  externalUrl?: string;
  acceptsInAppApplication: boolean;
}

// Funding that actually reaches an MP Gram Panchayat — use these as the
// `fundingSource` on development projects and as budget receipt heads.
export const FUNDING_SOURCES: string[] = [
  "15th Finance Commission - Tied Grant",
  "15th Finance Commission - Untied Grant",
  "State Finance Commission Grant",
  "MGNREGA (Mahatma Gandhi NREGA)",
  "Panch Parmeshwar Yojana (MP)",
  "Swachh Bharat Mission (Gramin)",
  "Pradhan Mantri Awas Yojana (Gramin)",
  "Jal Jeevan Mission",
  "Mukhyamantri Gram Sadak Yojana",
  "Own Revenue (Property / Water Tax)",
  "MLA / MP Local Area Development Fund",
];

// Common works a panchayat builds — use as development project `type`.
export const PROJECT_TYPES: string[] = [
  "CC Road / Khadanja",
  "Drainage (Nali)",
  "Hand Pump / Tube Well",
  "Water Tank / Tap Connection",
  "Anganwadi Building",
  "School Building / Repair",
  "Panchayat Bhavan / Community Hall",
  "Street Lights",
  "Toilets (Individual / Community)",
  "Pond / Stop Dam (Talab)",
  "Culvert / Bridge (Pulia)",
  "Cremation Ground (Muktidham)",
];

// Roles in a village directory, in display priority order (Sarpanch first).
export const DESIGNATIONS: { value: string; labelHi: string }[] = [
  { value: "Sarpanch", labelHi: "सरपंच" },
  { value: "Upsarpanch", labelHi: "उपसरपंच" },
  { value: "Sachiv (Secretary)", labelHi: "सचिव" },
  { value: "Ward Panch", labelHi: "वार्ड पंच" },
  { value: "Rojgar Sahayak", labelHi: "रोजगार सहायक" },
  { value: "Patwari", labelHi: "पटवारी" },
  { value: "ASHA Worker", labelHi: "आशा कार्यकर्ता" },
  { value: "Anganwadi Worker", labelHi: "आंगनवाड़ी कार्यकर्ता" },
  { value: "School Teacher", labelHi: "शिक्षक" },
  { value: "Kotwar", labelHi: "कोटवार" },
  { value: "Other", labelHi: "अन्य" },
];

// Standard budget heads for the transparency ledger.
export const BUDGET_HEADS: string[] = [
  ...FUNDING_SOURCES,
  "Salaries & Honorarium",
  "Office / Administrative Expenses",
  "Electricity & Water Charges",
  "Repairs & Maintenance",
];

// Catalogue of central + MP-state welfare schemes villagers commonly apply for.
export const SCHEME_CATALOGUE: SchemeTemplate[] = [
  {
    name: "Pradhan Mantri Awas Yojana (Gramin)",
    nameHi: "प्रधानमंत्री आवास योजना (ग्रामीण)",
    department: "Ministry of Rural Development",
    category: "housing",
    description:
      "Financial assistance to build a pucca house for eligible families without one.",
    benefits: "₹1.20 lakh assistance (plus MGNREGA labour and toilet support).",
    eligibility:
      "Houseless / kutcha-house families as per SECC list; not already benefited under a housing scheme.",
    requiredDocuments: ["Aadhaar Card", "Job Card (MGNREGA)", "Bank Passbook", "SECC reference"],
    externalUrl: "https://pmayg.nic.in/",
    acceptsInAppApplication: true,
  },
  {
    name: "PM Kisan Samman Nidhi",
    nameHi: "पीएम किसान सम्मान निधि",
    department: "Ministry of Agriculture",
    category: "agriculture",
    description: "Income support to land-holding farmer families.",
    benefits: "₹6,000 per year in three installments, direct to bank account.",
    eligibility: "Small and marginal land-holding farmer families (with exclusions).",
    requiredDocuments: ["Aadhaar Card", "Land Records (Khasra/Khatauni)", "Bank Passbook"],
    externalUrl: "https://pmkisan.gov.in/",
    acceptsInAppApplication: true,
  },
  {
    name: "Ayushman Bharat (PM-JAY)",
    nameHi: "आयुष्मान भारत (पीएम-जय)",
    department: "National Health Authority",
    category: "health",
    description: "Health insurance cover for secondary and tertiary hospitalisation.",
    benefits: "Up to ₹5 lakh per family per year of cashless treatment.",
    eligibility: "Families identified under SECC / state criteria.",
    requiredDocuments: ["Aadhaar Card", "Ration Card", "Family ID / Samagra ID"],
    externalUrl: "https://pmjay.gov.in/",
    acceptsInAppApplication: true,
  },
  {
    name: "Ladli Behna Yojana",
    nameHi: "लाडली बहना योजना",
    department: "Govt. of Madhya Pradesh",
    category: "women",
    description: "Monthly financial assistance to eligible women of the state.",
    benefits: "Monthly assistance credited to the woman's bank account.",
    eligibility: "Women residents of MP within the prescribed age and income limits.",
    requiredDocuments: ["Samagra ID", "Aadhaar Card", "Bank Passbook (Aadhaar-linked)"],
    acceptsInAppApplication: true,
  },
  {
    name: "Samajik Suraksha Pension (Old Age / Widow / Disability)",
    nameHi: "सामाजिक सुरक्षा पेंशन (वृद्धा / विधवा / दिव्यांग)",
    department: "Govt. of Madhya Pradesh - Social Justice",
    category: "pension",
    description: "Monthly social-security pension for elderly, widows and persons with disability.",
    benefits: "Monthly pension as per the applicable category.",
    eligibility: "BPL elderly (60+), widows, or persons with 40%+ disability.",
    requiredDocuments: ["Samagra ID", "Aadhaar Card", "Age / Widow / Disability Certificate", "Bank Passbook"],
    acceptsInAppApplication: true,
  },
  {
    name: "Mukhyamantri Jan Kalyan (Sambal) Yojana",
    nameHi: "मुख्यमंत्री जन कल्याण (संबल) योजना",
    department: "Govt. of Madhya Pradesh - Labour",
    category: "employment",
    description: "Welfare benefits for unorganised-sector workers and their families.",
    benefits: "Maternity, accident, and funeral assistance; education support.",
    eligibility: "Registered unorganised-sector workers of MP.",
    requiredDocuments: ["Samagra ID", "Aadhaar Card", "Bank Passbook"],
    acceptsInAppApplication: true,
  },
  {
    name: "Pradhan Mantri Ujjwala Yojana",
    nameHi: "प्रधानमंत्री उज्ज्वला योजना",
    department: "Ministry of Petroleum",
    category: "utility",
    description: "Free LPG connection to women of eligible households.",
    benefits: "Deposit-free LPG connection with first refill and stove support.",
    eligibility: "Adult women of eligible BPL / priority households without an LPG connection.",
    requiredDocuments: ["Aadhaar Card", "Ration Card", "Bank Passbook"],
    externalUrl: "https://www.pmuy.gov.in/",
    acceptsInAppApplication: true,
  },
  {
    name: "Post-Matric Scholarship (SC/ST/OBC)",
    nameHi: "पोस्ट-मैट्रिक छात्रवृत्ति",
    department: "Govt. of Madhya Pradesh - Education",
    category: "education",
    description: "Scholarship for students of reserved categories pursuing higher studies.",
    benefits: "Tuition and maintenance assistance.",
    eligibility: "SC/ST/OBC students meeting income and course criteria.",
    requiredDocuments: ["Caste Certificate", "Income Certificate", "Marksheet", "Bank Passbook", "Samagra ID"],
    acceptsInAppApplication: false,
  },
];
