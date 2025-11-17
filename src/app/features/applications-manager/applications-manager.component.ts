import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Candidate } from '../../core/models/candidate.model';

@Component({
  selector: 'app-applications-manager',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './applications-manager.component.html',
  styleUrl: './applications-manager.component.scss'
})
export class ApplicationsManagerComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly LOCAL_STORAGE_KEY = 'mockCandidates';

  userEmail = '';
  applications: Candidate[] = [];
  isLoading = false;
  emailError = '';

  ngOnInit(): void {
    const queryEmail = this.route.snapshot.queryParams['email'];
    
    if (queryEmail) {
      this.userEmail = queryEmail;
      this.loadApplicationsByEmail(this.userEmail);
    } else {
      this.loadAllApplications();
    }
  }

  onEmailChange(): void {
    this.emailError = '';
    if (this.userEmail && this.isValidEmail(this.userEmail)) {
      this.loadApplicationsByEmail(this.userEmail);
    } else if (!this.userEmail || this.userEmail.trim() === '') {
      this.loadAllApplications();
    } else {
      this.applications = [];
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  loadApplicationsByEmail(email: string): void {
    if (!this.isValidEmail(email)) {
      this.emailError = 'Please enter a valid email address';
      this.applications = [];
      return;
    }

    this.isLoading = true;
    this.emailError = '';

    try {
      this.applications = this.getCandidatesByEmailFromLocalStorage(email);
    } catch (error) {
      console.error('Error loading applications:', error);
      this.emailError = 'Error loading applications';
    } finally {
      this.isLoading = false;
    }
  }

  loadAllApplications(): void {
    this.isLoading = true;
    this.emailError = '';

    try {
      this.applications = this.getAllApplicationsFromLocalStorage();
    } catch (error) {
      console.error('Error loading all applications:', error);
      this.emailError = 'Error loading applications';
    } finally {
      this.isLoading = false;
    }
  }

  createNewApplication(): void {
    this.router.navigate(['/register'], { 
      queryParams: { email: this.userEmail, mode: 'new' }
    });
  }

  viewApplication(application: Candidate): void {
    this.router.navigate(['/register'], { 
      queryParams: { 
        email: application.email, 
        id: application.id,
        mode: this.canEditApplication(application) ? 'edit' : 'view'
      }
    });
  }

  deleteApplication(application: Candidate): void {
    const confirmMessage = `Are you sure you want to delete the application for "${application.firstName} ${application.lastName}"? This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      try {
        this.removeCandidateFromStorage(application.id!);
        this.loadApplicationsByEmail(this.userEmail);
      } catch (error) {
        console.error('Error deleting application:', error);
        alert('Error deleting application. Please try again.');
      }
    }
  }

  canEditApplication(application: Candidate): boolean {
    if (!application.createdAt) return false;
    
    const now = new Date();
    const created = new Date(application.createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = diffMs / (24 * 60 * 60 * 1000);
    
    return diffDays <= 3;
  }

  getApplicationAge(application: Candidate): string {
    if (!application.createdAt) return 'Unknown';
    
    const now = new Date();
    const created = new Date(application.createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return 'Less than an hour ago';
    }
  }

  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  getDuplicateInfo(applications: Candidate[]): string {
    if (applications.length <= 1) return '';
    
    const groups = applications.reduce((acc, app) => {
      const key = `${app.firstName}-${app.lastName}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(app);
      return acc;
    }, {} as Record<string, Candidate[]>);
    
    const duplicateGroups = Object.values(groups).filter(group => group.length > 1);
    
    if (duplicateGroups.length > 0) {
      const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.length, 0);
      return `Found ${totalDuplicates} applications with similar names. Consider if you need multiple applications.`;
    }
    
    return '';
  }

  private getCandidatesByEmailFromLocalStorage(email: string): Candidate[] {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!stored) return [];
      
      const candidates: Candidate[] = JSON.parse(stored);
      const found = candidates.filter(c => c.email === email);
      
      return found.map(candidate => ({
        ...candidate,
        createdAt: candidate.createdAt ? new Date(candidate.createdAt) : undefined,
        updatedAt: candidate.updatedAt ? new Date(candidate.updatedAt) : undefined
      })).sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.warn('Error loading candidates from localStorage:', error);
      return [];
    }
  }

  private getAllApplicationsFromLocalStorage(): Candidate[] {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!stored) return [];
      
      const candidates: Candidate[] = JSON.parse(stored);
      
      const realApplications = candidates.filter(candidate => {
        const isDummy = (
          candidate.email?.toLowerCase().includes('test@') ||
          candidate.email?.toLowerCase().includes('dummy@') ||
          candidate.email?.toLowerCase().includes('example@') ||
          candidate.firstName?.toLowerCase() === 'test' ||
          candidate.firstName?.toLowerCase() === 'dummy' ||
          candidate.lastName?.toLowerCase() === 'test' ||
          candidate.lastName?.toLowerCase() === 'user' ||
          candidate.id?.startsWith('demo-') ||
          candidate.id?.startsWith('test-')
        );
        return !isDummy;
      });
      
      return realApplications.map(candidate => ({
        ...candidate,
        createdAt: candidate.createdAt ? new Date(candidate.createdAt) : undefined,
        updatedAt: candidate.updatedAt ? new Date(candidate.updatedAt) : undefined
      })).sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.warn('Error loading all candidates from localStorage:', error);
      return [];
    }
  }

  private removeCandidateFromStorage(id: string): void {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (stored) {
        const candidates = JSON.parse(stored);
        const filteredCandidates = candidates.filter((c: any) => c.id !== id);
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(filteredCandidates));
      }
    } catch (error) {
      console.warn('Error removing candidate from localStorage:', error);
      throw error;
    }
  }
}