export interface Household {
  id: string;
  representativeName: string;
  mobileNumber: string;
  address: string;
  isActive: boolean;
  registrationDate: Date;
  updatedAt: Date;
}

export interface Admin {
  id: string;
  mobileNumber: string;
  role: 'admin' | 'superadmin' | 'reviewer';
}

export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'open' | 'closed' | 'archived';
  type: 'yes_no' | 'multiple_choice';
  options: PollOption[];
  allowMultiple?: boolean;
  totalVotes: number;
  results?: Record<string, number>;
  hasVoted?: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface Vote {
  id: string;
  pollId: string;
  householdId: string;
  optionId?: string; // Legacy
  optionIds?: string[]; // New for multi-select
  createdAt: Date;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'meeting' | 'emergency' | 'update' | 'general';
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface PhoneChangeRequest {
  id: string;
  householdId: string;
  oldMobileNumber: string;
  newMobileNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
}

export interface Complaint {
  id: string;
  householdId?: string; // Secret, hidden from public/reviewer
  title: string;
  description: string;
  images: string[];
  status: 'under_review' | 'approved' | 'rejected' | 'in_progress' | 'resolved' | 'unresolvable';
  adminResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Gram Panchayat governance modules
// ---------------------------------------------------------------------------

export type SchemeCategory =
  | 'housing'
  | 'agriculture'
  | 'health'
  | 'women'
  | 'pension'
  | 'education'
  | 'employment'
  | 'utility'
  | 'other';

export interface Scheme {
  id: string;
  name: string;          // bilingual-friendly display name
  nameHi?: string;       // Hindi name (optional)
  department: string;    // sponsoring level/department
  category: SchemeCategory;
  description: string;
  benefits: string;
  eligibility: string;
  requiredDocuments: string[];
  applicationStartDate: Date;
  applicationEndDate: Date | null; // null = ongoing / no deadline
  isActive: boolean;
  externalUrl?: string;
  acceptsInAppApplication: boolean; // can villagers apply via this platform?
  createdAt: Date;
  createdBy: string;
}

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'forwarded';

export interface SchemeApplication {
  id: string;
  schemeId: string;
  schemeName: string;
  householdId: string;   // applicant — PRIVATE, only owner + reviewers
  applicantName: string;
  mobileNumber: string;
  notes?: string;
  documents: string[];   // PRIVATE storage paths (never public URLs)
  status: ApplicationStatus;
  reviewerNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'stalled';

export interface DevelopmentProject {
  id: string;
  name: string;
  type: string;          // road, drainage, water, building, etc.
  description: string;
  contractor?: string;
  budgetAllocated: number;
  budgetSpent: number;
  fundingSource: string; // e.g. 15th Finance Commission, MGNREGA
  startDate: Date;
  expectedCompletion: Date | null;
  status: ProjectStatus;
  progressPercent: number;
  images: string[];      // PUBLIC progress photos
  createdAt: Date;
  createdBy: string;
}

export interface BudgetEntry {
  id: string;
  financialYear: string;              // "2025-2026"
  head: string;                       // budget head / funding source
  category: 'receipt' | 'expenditure';
  amount: number;
  description?: string;
  date: Date;
  createdAt: Date;
  createdBy: string;
}

export interface DirectoryMember {
  id: string;
  name: string;
  designation: string;   // Sarpanch, Upsarpanch, Sachiv, Ward Panch, ASHA, etc.
  ward?: string;
  mobileNumber?: string;
  tenure?: string;       // e.g. "2022-2027"
  photoUrl?: string;     // optional public photo
  order: number;         // sort priority (lower = higher up)
  createdAt: Date;
  createdBy: string;
}

export type MeetingStatus = 'scheduled' | 'completed';

export interface Meeting {
  id: string;
  title: string;
  date: Date;
  status: MeetingStatus;
  agenda: string;
  decisions?: string;        // resolutions / decisions taken
  attendanceCount?: number;
  nextSteps?: string;
  createdAt: Date;
  createdBy: string;
}

export type BroadcastType = 'scheme' | 'notice' | 'poll' | 'project' | 'meeting' | 'general';

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  type: BroadcastType;
  link?: string;
  createdAt: Date;
  createdBy: string;
}
