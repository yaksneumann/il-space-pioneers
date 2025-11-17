import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env';
export interface AuthToken {
  candidateId: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
}

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'iisa_candidate_token';
  private readonly USER_KEY = 'il_space_pioneers_user';
  private readonly APPLICATION_KEY = 'il_space_pioneers_application';
  private readonly TOKEN_DURATION_DAYS = 3;
  private readonly MS_PER_DAY = 24 * 60 * 60 * 1000;
  private readonly MS_PER_HOUR = 60 * 60 * 1000;
  private readonly MS_PER_MINUTE = 60 * 1000;

  private router = inject(Router);
  private currentUser = signal<UserProfile | null>(null);
  
  isAuthenticated = signal(false);
  userRole = signal<'recruiter' | 'candidate' | null>(null);

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      if (stored) {
        const user: UserProfile = JSON.parse(stored);
        this.setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      this.logout();
    }
  }

  private setCurrentUser(user: UserProfile | null): void {
    this.currentUser.set(user);
    this.isAuthenticated.set(!!user);
    this.userRole.set(user?.role || null);
    
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  loginRecruiter(email: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email === environment.auth.recruiterEmail && 
            password === environment.auth.recruiterPassword) {
          
          const user: UserProfile = {
            id: 'recruiter-1',
            email: email,
            role: 'recruiter',
            loginTime: Date.now()
          };
          
          this.setCurrentUser(user);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 800);
    });
  }

  setCandidateIdentity(email: string): void {
    const user: UserProfile = {
      id: `candidate-${Date.now()}`,
      email: email,
      role: 'candidate',
      loginTime: Date.now()
    };
    
    this.setCurrentUser(user);
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.setCurrentUser(null);
    this.clearCandidateToken();
    this.router.navigate(['/']);
  }

  isRecruiter(): boolean {
    return this.userRole() === 'recruiter';
  }

  isCandidate(): boolean {
    return this.userRole() === 'candidate';
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUser();
  }

  getCurrentUserSignal() {
    return this.currentUser;
  }

  saveApplication(candidateData: CandidateData): void {
    try {
      const applicationId = candidateData.id || `app-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      const applicationData: CandidateApplication = {
        id: applicationId,
        email: candidateData.email,
        submissionDate: Date.now(),
        canEdit: true,
        daysLeft: this.TOKEN_DURATION_DAYS
      };

      const existingApplications = this.getAllApplications();
      
      const updatedApplications = existingApplications.filter((app: CandidateApplication) => app.id !== applicationId);
      updatedApplications.push(applicationData);

      localStorage.setItem(this.APPLICATION_KEY, JSON.stringify(updatedApplications));
      this.setCandidateIdentity(candidateData.email);
    } catch (error) {
      console.error('Error saving application:', error);
    }
  }

  getAllApplications(): CandidateApplication[] {
    try {
      const stored = localStorage.getItem(this.APPLICATION_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (parsed.email) {
        const legacyApp: CandidateApplication = {
          id: `legacy-${parsed.email}-${parsed.submissionDate}`,
          email: parsed.email,
          submissionDate: parsed.submissionDate,
          canEdit: parsed.canEdit,
          daysLeft: parsed.daysLeft
        };
        return [legacyApp];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting applications:', error);
      return [];
    }
  }

  getApplicationStatus(email?: string): CandidateApplication | null {
    try {
      const applications = this.getAllApplications();
      
      if (!email) return null;
      
      const userApplications = applications.filter(app => app.email === email);
      if (userApplications.length === 0) return null;
      
      const mostRecentApp = userApplications.sort((a, b) => b.submissionDate - a.submissionDate)[0];
      
      const daysPassed = Math.floor((Date.now() - mostRecentApp.submissionDate) / this.MS_PER_DAY);
      const daysLeft = Math.max(0, this.TOKEN_DURATION_DAYS - daysPassed);
      
      return {
        ...mostRecentApp,
        canEdit: daysLeft > 0,
        daysLeft: daysLeft
      };
    } catch (error) {
      console.error('Error getting application status:', error);
      return null;
    }
  }

  getApplicationsByEmail(email: string): CandidateApplication[] {
    return this.getAllApplications().filter(app => app.email === email);
  }

  hasApplied(email?: string): boolean {
    if (!email) return false;
    return this.getApplicationsByEmail(email).length > 0;
  }

  clearApplicationData(email?: string): void {
    if (email) {
      const allApplications = this.getAllApplications();
      const filteredApplications = allApplications.filter((app: CandidateApplication) => app.email !== email);
      localStorage.setItem(this.APPLICATION_KEY, JSON.stringify(filteredApplications));
    } else {
      localStorage.removeItem(this.APPLICATION_KEY);
    }
  }

  generateCandidateToken(candidateId: string, email: string): string {
    const token: AuthToken = {
      candidateId,
      email,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.TOKEN_DURATION_DAYS * this.MS_PER_DAY)
    };

    const tokenString = btoa(JSON.stringify(token));
    localStorage.setItem(this.TOKEN_KEY, tokenString);
    
    return tokenString;
  }

  getCandidateToken(): AuthToken | null {
    try {
      const tokenString = localStorage.getItem(this.TOKEN_KEY);
      if (!tokenString) return null;

      const token: AuthToken = JSON.parse(atob(tokenString));
      
      if (new Date() > new Date(token.expiresAt)) {
        this.clearCandidateToken();
        return null;
      }

      return token;
    } catch (error) {
      console.error('Invalid token format:', error);
      this.clearCandidateToken();
      return null;
    }
  }

  canCandidateEdit(email?: string): boolean {
    const appStatus = this.getApplicationStatus(email);
    if (appStatus) {
      return appStatus.canEdit;
    }
    
    const token = this.getCandidateToken();
    return token !== null;
  }

  getEditTimeRemaining(): string {
    const token = this.getCandidateToken();
    if (!token) return '';

    const now = new Date();
    const expiresAt = new Date(token.expiresAt);
    const diffMs = expiresAt.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expired';

    const days = Math.floor(diffMs / this.MS_PER_DAY);
    const hours = Math.floor((diffMs % this.MS_PER_DAY) / this.MS_PER_HOUR);
    const minutes = Math.floor((diffMs % this.MS_PER_HOUR) / this.MS_PER_MINUTE);

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }

  clearCandidateToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  generateCandidateUrl(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?token=${token}`;
  }

  getTokenFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
  }
}