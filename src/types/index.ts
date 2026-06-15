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
  role: 'admin' | 'superadmin';
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
