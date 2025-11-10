import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-recruiter-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './recruiter-login.component.html',
  styleUrl: './recruiter-login.component.scss'
})
export class RecruiterLoginComponent {
  credentials = {
    email: '',
    password: ''
  };

  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  isFormValid(): boolean {
    return this.credentials.email.length > 0 && 
           this.credentials.password.length > 0;
  }

  async onSubmit(): Promise<void> {
    if (!this.isFormValid() || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const success = await this.authService.loginRecruiter(
        this.credentials.email,
        this.credentials.password
      );

      if (success) {
        // Redirect to dashboard
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage.set('Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.errorMessage.set('An error occurred. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  goToRegistration(): void {
    this.router.navigate(['/register']);
  }
}