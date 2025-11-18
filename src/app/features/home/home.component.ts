import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.scrollToTop();
    
    if (this.authService.isRecruiter()) {
      this.router.navigate(['/dashboard']);
      return;
    }
  }

  private scrollToTop(): void {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  getApplicationCount(): number {
    try {
      const stored = localStorage.getItem('mockCandidates');
      if (stored) {
        const candidates = JSON.parse(stored);
        return candidates.length;
      }
    } catch (error) {
      console.error('Error checking applications:', error);
    }
    return 0;
  }

  startApplication(): void {
    this.router.navigate(['/register']);
  }

  manageApplications(): void {
    this.router.navigate(['/applications']);
  }
}