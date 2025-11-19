export interface UserProfile {
  id: string;
  email: string;
  role: 'recruiter' | 'candidate';
  loginTime: number;
}

export interface CandidateApplication {
  id: string;
  email: string;
  submissionDate: number;
  canEdit: boolean;
  daysLeft: number;
}

export interface CandidateData {
  id?: string;
  email: string;
  [key: string]: any;
}