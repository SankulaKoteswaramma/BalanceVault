export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'ACCOUNT_HOLDER';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export type OnboardingStatus =
  | 'REGISTERED'
  | 'PROFILE_INCOMPLETE'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type AccountStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

export type AccountType = 'CHECKING' | 'SAVINGS';

export interface UserProfile {
  id: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth?: string | null;
  address?: string | null;
  nationalIdMasked?: string | null;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  profile?: UserProfile | null;
  onboardingStatus?: OnboardingStatus | null;
}

export interface Account {
  id: string;
  accountNumber: string;
  userId: string;
  accountType: AccountType;
  status: AccountStatus;
  currency: string;
  balance: string | number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    profile?: { fullName: string } | null;
  };
}

export interface OnboardingApplication {
  id: string;
  userId: string;
  status: OnboardingStatus;
  submittedData?: {
    employmentStatus?: string;
    annualIncome?: string;
    sourceOfFunds?: string;
    maskedId?: string;
  } | null;
  reviewerId?: string | null;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    profile?: UserProfile | null;
  };
}

export interface AuditLog {
  id: string;
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  targetEntity: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  correlationId?: string | null;
  outcome: 'SUCCESS' | 'FAILURE';
  createdAt: string;
  actor?: {
    id: string;
    email: string;
    role: Role;
  } | null;
}
