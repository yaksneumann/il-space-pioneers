import { Component, signal, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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
  
  private authService = inject(AuthService);
  private router = inject(Router);

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
    }
  }

  startApplication(): void {
    this.router.navigate(['/register']);
  }

  editApplication(): void {
    this.router.navigate(['/register']);
  }

  viewApplication(): void {
    const user = this.authService.getCurrentUser();
    if (user?.email) {
      this.router.navigate(['/candidate'], { queryParams: { email: user.email } });
    }
  }

  newApplication(): void {
    this.authService.clearApplicationData();
    this.authService.logout();
    this.router.navigate(['/register']);
  }
}