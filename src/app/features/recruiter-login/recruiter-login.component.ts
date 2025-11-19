import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-recruiter-login',
  imports: [FormsModule],
  templateUrl: './recruiter-login.component.html',
  styleUrl: './recruiter-login.component.scss'
})
export class RecruiterLoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  protected isLoading = signal(false);
  protected errorMessage = signal('');
  protected credentials = {
    email: '',
    password: ''
  };

  isFormValid(): boolean {
    return this.credentials.email.length > 0 && 
           this.credentials.password.length > 0;
  }

  async onSubmit(): Promise<void> {
    if (!this.isFormValid() || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const success = await this.authService.loginRecruiter(
      this.credentials.email,
      this.credentials.password
    );

    if (success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage.set('Invalid credentials. Please try again.');
    }
    
    this.isLoading.set(false);
  }

  goToRegistration(): void {
    this.router.navigate(['/register']);
  }
}