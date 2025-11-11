import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { Candidate } from '../../core/models/candidate.model';

@Component({
  selector: 'app-candidate-view',
  imports: [CommonModule, RouterModule],
  templateUrl: './candidate-view.html',
  styleUrl: './candidate-view.scss',
})
export class CandidateViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly EDIT_DEADLINE_DAYS = 3;
  private readonly MS_PER_DAY = 24 * 60 * 60 * 1000;

  candidate: Candidate | null = null;
  isLoading = true;
  error: string | null = null;
  canEdit = false;
  daysLeft = 0;
  allCandidates: Candidate[] = [];
  currentIndex = 0;

  ngOnInit(): void {
    this.route.queryParams.subscribe(() => {
      this.loadCandidate();
    });
  }

  private async loadCandidate(): Promise<void> {
    const email = this.route.snapshot.queryParams['email'];
    
    if (!email) {
      this.router.navigate(['/']);
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      this.allCandidates = await this.supabaseService.getAllCandidates();
      this.currentIndex = this.allCandidates.findIndex(c => c.email === email);
      
      if (this.currentIndex >= 0) {
        this.candidate = this.allCandidates[this.currentIndex];
        this.canEdit = this.candidate.canEdit || false;
        this.calculateDaysLeft();
      } else {
        this.error = 'Application not found';
      }
    } catch (error) {
      console.error('Error loading candidate:', error);
      this.error = 'Failed to load application: ' + (error as Error).message;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private calculateDaysLeft(): void {
    if (!this.candidate?.createdAt) return;
    
    const createdDate = new Date(this.candidate.createdAt);
    const now = new Date();
    const editDeadline = this.EDIT_DEADLINE_DAYS * this.MS_PER_DAY;
    const diffTime = editDeadline - (now.getTime() - createdDate.getTime());
    
    this.daysLeft = Math.max(0, Math.ceil(diffTime / this.MS_PER_DAY));
  }

  editApplication(): void {
    if (this.candidate && this.canEdit) {
      this.router.navigate(['/register'], { 
        queryParams: { email: this.candidate.email } 
      });
    }
  }

  goToPrevious(): void {
    if (this.hasPrevious()) {
      const prevCandidate = this.allCandidates[this.currentIndex - 1];
      this.navigateToCandidate(prevCandidate.email);
    }
  }

  goToNext(): void {
    if (this.hasNext()) {
      const nextCandidate = this.allCandidates[this.currentIndex + 1];
      this.navigateToCandidate(nextCandidate.email);
    }
  }

  private navigateToCandidate(email: string): void {
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/candidate'], {
        queryParams: { email: email }
      });
    });
  }

  hasPrevious(): boolean {
    return this.currentIndex > 0;
  }

  hasNext(): boolean {
    return this.currentIndex < this.allCandidates.length - 1;
  }

  getCurrentPosition(): string {
    if (this.allCandidates.length === 0) return '';
    return `${this.currentIndex + 1} of ${this.allCandidates.length}`;
  }

  isRecruiter(): boolean {
    return this.authService.isRecruiter();
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}