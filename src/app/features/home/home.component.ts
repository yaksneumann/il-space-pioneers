import { Component, signal, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';

interface ApplicationStatus {
  canEdit: boolean;
  daysLeft: number;
}

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  applicationStatus = signal<ApplicationStatus | null>(null);
  hasExistingApplication = signal<boolean>(false);
  candidateEmail = signal<string | null>(null);
  
  private authService = inject(AuthService);
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);

  ngOnInit(): void {
    this.scrollToTop();
    this.checkApplicationStatus();
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  private checkApplicationStatus(): void {
    const user = this.authService.getCurrentUser();
    if (user?.role === 'candidate') {
      const status = this.authService.getApplicationStatus(user.email);
      this.applicationStatus.set(status);
      this.hasExistingApplication.set(true);
      this.candidateEmail.set(user.email);
      return;
    }

    this.checkForExistingApplication();
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
        
        this.authService.setCandidateIdentity(application.email);
      }
    } catch (error) {
      console.error('Error checking for existing application:', error);
    }
  }

  startApplication(): void {
    this.router.navigate(['/register']);
  }

  editApplication(): void {
    const email = this.candidateEmail();
    if (email) {
      this.router.navigate(['/register'], { queryParams: { email: email } });
    } else {
      this.router.navigate(['/register']);
    }
  }

  viewApplication(): void {
    const email = this.candidateEmail();
    if (email) {
      this.router.navigate(['/candidate'], { queryParams: { email: email } });
    } else {
      const user = this.authService.getCurrentUser();
      if (user?.email) {
        this.router.navigate(['/candidate'], { queryParams: { email: user.email } });
      }
    }
  }

  newApplication(): void {
    this.authService.clearApplicationData();
    this.authService.logout();
    this.router.navigate(['/register']);
  }
}