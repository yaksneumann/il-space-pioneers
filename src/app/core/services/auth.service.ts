import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  email: string;
  submissionDate: number;
  canEdit: boolean;
  daysLeft: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'iisa_candidate_token';
  private readonly USER_KEY = 'il_space_pioneers_user';
  private readonly APPLICATION_KEY = 'il_space_pioneers_application';
  private readonly TOKEN_DURATION_DAYS = 3;

  private router = inject(Router);
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  
  currentUser$ = this.currentUserSubject.asObservable();
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
    this.currentUserSubject.next(user);
    this.isAuthenticated.set(!!user);
    this.userRole.set(user?.role || null);
    
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.USER_KEY);
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
    this.setCurrentUser(null);
    this.router.navigate(['/']);
  }

  isRecruiter(): boolean {
    return this.userRole() === 'recruiter';
  }

  isCandidate(): boolean {
    return this.userRole() === 'candidate';
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  saveApplication(candidateData: any): void {
    try {
      const applicationData: CandidateApplication = {
        email: candidateData.email,
        submissionDate: Date.now(),
        canEdit: true,
        daysLeft: this.TOKEN_DURATION_DAYS
      };

      localStorage.setItem(this.APPLICATION_KEY, JSON.stringify(applicationData));
      this.setCandidateIdentity(candidateData.email);
    } catch (error) {
      console.error('Error saving application:', error);
    }
  }

  getApplicationStatus(email?: string): CandidateApplication | null {
    try {
      const stored = localStorage.getItem(this.APPLICATION_KEY);
      if (!stored) return null;

      const application: CandidateApplication = JSON.parse(stored);
      
      if (email && application.email !== email) {
        return null;
      }

      const daysPassed = Math.floor((Date.now() - application.submissionDate) / (1000 * 60 * 60 * 24));
      const daysLeft = Math.max(0, this.TOKEN_DURATION_DAYS - daysPassed);
      
      return {
        ...application,
        canEdit: daysLeft > 0,
        daysLeft: daysLeft
      };
    } catch (error) {
      console.error('Error getting application status:', error);
      return null;
    }
  }

  hasApplied(email?: string): boolean {
    return this.getApplicationStatus(email) !== null;
  }

  clearApplicationData(): void {
    localStorage.removeItem(this.APPLICATION_KEY);
  }

  generateCandidateToken(candidateId: string, email: string): string {
    const token: AuthToken = {
      candidateId,
      email,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.TOKEN_DURATION_DAYS * 24 * 60 * 60 * 1000)
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

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

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