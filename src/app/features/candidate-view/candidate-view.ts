import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
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
  private readonly EDIT_DEADLINE_DAYS = 3;
  private readonly MS_PER_DAY = 24 * 60 * 60 * 1000;

  candidate: Candidate | null = null;
  isLoading = true;
  error: string | null = null;
  canEdit = false;
  daysLeft = 0;

  ngOnInit(): void {
    this.loadCandidate();
  }

  private async loadCandidate(): Promise<void> {
    const email = this.route.snapshot.queryParams['email'];
    
    if (!email) {
      this.error = 'No email provided';
      this.isLoading = false;
      return;
    }

    try {
      this.candidate = await this.supabaseService.getCandidateByEmail(email);
      
      if (this.candidate) {
        this.canEdit = this.candidate.canEdit || false;
        this.calculateDaysLeft();
      } else {
        this.error = 'Application not found';
      }
    } catch (error) {
      console.error('Error loading candidate:', error);
      this.error = 'Failed to load application';
    } finally {
      this.isLoading = false;
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

  newApplication(): void {
    this.router.navigate(['/register']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}