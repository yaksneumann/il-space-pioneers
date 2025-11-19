import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@env';
import { UserProfile, CandidateApplication, CandidateData } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly EDIT_DURATION_DAYS = 3;
  private readonly MS_PER_DAY = 24 * 60 * 60 * 1000;
  private readonly STORAGE_KEYS = {
    applications: 'il_space_pioneers_application',
    user: 'il_space_pioneers_user'
  } as const;

  private router = inject(Router);
  private currentUser = signal<UserProfile | null>(null);
  
  isAuthenticated = signal(false);
  userRole = signal<'recruiter' | 'candidate' | null>(null);

  constructor() {
    this.loadUserFromStorage();
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  private loadUserFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.user);
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
      localStorage.setItem(this.STORAGE_KEYS.user, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.STORAGE_KEYS.user);
    }
  }

  loginRecruiter(email: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email.trim() === environment.auth.recruiterEmail && 
            password.trim() === environment.auth.recruiterPassword) {
          
          const user: UserProfile = {
            id: 'recruiter',
            email: email.trim(),
            role: 'recruiter',
            loginTime: Date.now()
          };
          
          this.setCurrentUser(user);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 500);
    });
  }

  setCandidateIdentity(email: string): void {
    const user: UserProfile = {
      id: 'candidate',
      email: email.trim(),
      role: 'candidate',
      loginTime: Date.now()
    };
    
    this.setCurrentUser(user);
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEYS.user);
    this.setCurrentUser(null);
    this.router.navigate(['/']);
  }

  isRecruiter(): boolean {
    return this.userRole() === 'recruiter';
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUser();
  }

  hasExistingApplication(email: string): boolean {
    if (!this.isValidEmail(email)) {
      return false;
    }
    
    try {
      const applications = this.getAllApplications();
      return applications.some(app => app.email.toLowerCase() === email.toLowerCase().trim());
    } catch (error) {
      console.error('Error checking for existing application:', error);
      return false;
    }
  }

  saveApplication(candidateData: CandidateData): void {
    try {
      const applicationId = candidateData.id || `app-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      const applicationData: CandidateApplication = {
        id: applicationId,
        email: candidateData.email,
        submissionDate: Date.now(),
        canEdit: true,
        daysLeft: this.EDIT_DURATION_DAYS
      };

      const existingApplications = this.getAllApplications();
      
      const updatedApplications = existingApplications.filter((app: CandidateApplication) => app.id !== applicationId);
      updatedApplications.push(applicationData);

      localStorage.setItem(this.STORAGE_KEYS.applications, JSON.stringify(updatedApplications));
      this.setCandidateIdentity(candidateData.email);
    } catch (error) {
      console.error('Error saving application:', error);
    }
  }

  private getAllApplications(): CandidateApplication[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.applications);
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
      const daysLeft = Math.max(0, this.EDIT_DURATION_DAYS - daysPassed);
      
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

  getEditTimeRemaining(email?: string): string {
    const appStatus = this.getApplicationStatus(email);
    if (!appStatus || !appStatus.canEdit) return '';

    const msPerHour = this.MS_PER_DAY / 24;
    const msPerMinute = msPerHour / 60;
    const elapsed = Date.now() - appStatus.submissionDate;
    const totalEditTime = this.EDIT_DURATION_DAYS * this.MS_PER_DAY;
    const remaining = totalEditTime - elapsed;

    if (remaining <= 0) return 'Expired';

    const days = Math.floor(remaining / this.MS_PER_DAY);
    const hours = Math.floor((remaining % this.MS_PER_DAY) / msPerHour);
    const minutes = Math.floor((remaining % msPerHour) / msPerMinute);

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  }
}