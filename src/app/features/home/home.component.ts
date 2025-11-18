import { Component, signal, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApplicationStatus } from '../../core/models/candidate.model';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  applicationStatus = signal<ApplicationStatus | null>(null);
  hasExistingApplication = signal<boolean>(false);
  hasMultipleApplications = signal<boolean>(false);
  candidateEmail = signal<string | null>(null);
  
  authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.scrollToTop();
    
    if (this.authService.isRecruiter()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.checkApplicationStatus();
  }

  private scrollToTop(): void {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
  }

  private checkApplicationStatus(): void {
    const user = this.authService.getCurrentUser();
    if (user?.role === 'candidate') {
      const status = this.authService.getApplicationStatus(user.email);
      this.applicationStatus.set(status);
      this.hasExistingApplication.set(true);
      this.candidateEmail.set(user.email);
      this.checkForMultipleApplications(user.email);
      return;
    }

    this.checkForExistingApplication();
  }

  private checkForMultipleApplications(email: string): void {
    try {
      const stored = localStorage.getItem('mockCandidates');
      if (stored) {
        const candidates = JSON.parse(stored);
        const userApplications = candidates.filter((c: any) => c.email === email);
        this.hasMultipleApplications.set(userApplications.length > 1);
      }
    } catch (error) {
      console.error('Error checking for multiple applications:', error);
    }
  }

  private checkForExistingApplication(): void {
    try {
      const stored = localStorage.getItem('il_space_pioneers_application');
      if (stored) {
        const application = JSON.parse(stored);
        const daysPassed = Math.floor((Date.now() - application.submissionDate) / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, 3 - daysPassed);
        
        this.hasExistingApplication.set(true);
        this.candidateEmail.set(application.email);
        this.applicationStatus.set({
          canEdit: daysLeft > 0,
          daysLeft: daysLeft
        });
        
        this.checkForMultipleApplications(application.email);
        this.authService.setCandidateIdentity(application.email);
      }
    } catch (error) {
      console.error('Error checking for existing application:', error);
    }
  }

  startApplication(): void {
    this.router.navigate(['/register']);
  }

  addApplication(): void {
    const email = this.candidateEmail();
    if (email) {
      this.router.navigate(['/register'], { queryParams: { email: email, mode: 'new' } });
    } else {
      this.router.navigate(['/register']);
    }
  }

  newApplication(): void {
    this.authService.clearApplicationData();
    if (!this.authService.isRecruiter()) {
      this.authService.logout();
    }
    this.router.navigate(['/register']);
  }

  manageApplications(): void {
    this.router.navigate(['/applications']);
  }
}