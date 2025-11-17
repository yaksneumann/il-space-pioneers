export interface Candidate {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  age: number;
  city: string;
  hobbies: string;
  motivation: string; 
  profileImage?: {
    file?: File;
    url?: string;
    filename?: string;
  };
  resume?: {
    file?: File;
    url?: string;
    filename?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
  canEdit?: boolean; 
  submissionIp?: string;
}

export interface CandidateFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  age: number;
  city: string;
  hobbies: string;
  motivation: string;
  profileImage?: File;
  resume?: File;
}

export interface CandidateStats {
  totalCandidates: number;
  totalVisits: number;
  conversionRate: number;
  ageBreakdown: AgeGroup[];
  cityDistribution: CityStats[];
  averageAge: number;
}

export interface AgeGroup {
  range: string;
  count: number;
  percentage: number;
}

export interface CityStats {
  city: string;
  count: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface VisitorData {
  sessionId: string;
  visitedAt: Date;
  hasRegistered: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}