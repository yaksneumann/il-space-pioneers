import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Candidate, CandidateStats } from '../../core/models/candidate.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly HOURS_PER_DAY = 24;
  private readonly MS_PER_HOUR = 60 * 60 * 1000;

  candidates: Candidate[] = [];
  stats: CandidateStats | null = null;
  isLoading = true;
  searchTerm = '';
  sortBy: 'name' | 'date' | 'age' | 'city' = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private async loadDashboardData(): Promise<void> {
    try {
      this.stats = this.generateMockStats();
      this.candidates = this.generateMockCandidates();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.stats = null;
      this.candidates = [];
    } finally {
      this.isLoading = false;
    }
  }

  private generateMockStats(): CandidateStats {
    return {
      totalCandidates: 5,
      totalVisits: 150,
      conversionRate: 15,
      averageAge: 29,
      ageBreakdown: [
        { range: '18-25', count: 1, percentage: 20 },
        { range: '26-35', count: 4, percentage: 80 }
      ],
      cityDistribution: [
        { city: 'Tel Aviv', count: 1 },
        { city: 'Jerusalem', count: 1 },
        { city: 'Haifa', count: 1 },
        { city: 'Beer Sheva', count: 1 },
        { city: 'Eilat', count: 1 }
      ]
    };
  }

  private generateMockCandidates(): Candidate[] {
    const baseDate = Date.now();
    const mockCandidatesData = [
      { firstName: 'David', lastName: 'Cohen', email: 'david.cohen@example.com', phoneNumber: '+972-50-123-4567', age: 28, city: 'Tel Aviv', hobbies: 'Astronomy, rock climbing, photography', motivation: 'I have always dreamed of seeing Earth from space.', daysAgo: 2 },
      { firstName: 'Sarah', lastName: 'Levi', email: 'sarah.levi@example.com', phoneNumber: '+972-50-234-5678', age: 32, city: 'Jerusalem', hobbies: 'Physics, hiking, chess', motivation: 'Space exploration represents the pinnacle of human achievement.', daysAgo: 1 },
      { firstName: 'Michael', lastName: 'Goldberg', email: 'michael.goldberg@example.com', phoneNumber: '+972-50-345-6789', age: 26, city: 'Haifa', hobbies: 'Engineering, robotics, martial arts', motivation: 'I want to contribute to building humanity future in space.', daysAgo: 3 },
      { firstName: 'Rachel', lastName: 'Ben-David', email: 'rachel.bendavid@example.com', phoneNumber: '+972-50-456-7890', age: 30, city: 'Beer Sheva', hobbies: 'Medicine, yoga, painting', motivation: 'Space medicine is the future of healthcare innovation.', daysAgo: 4 },
      { firstName: 'Yaron', lastName: 'Katz', email: 'yaron.katz@example.com', phoneNumber: '+972-50-567-8901', age: 35, city: 'Eilat', hobbies: 'Astrophotography, diving, programming', motivation: 'Combining my love for technology and space exploration.', daysAgo: 5 }
    ];

    return mockCandidatesData.map((data, index) => {
      const submissionDate = new Date(baseDate - data.daysAgo * this.HOURS_PER_DAY * this.MS_PER_HOUR);
      return {
        id: `mock-${index + 1}`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        age: data.age,
        city: data.city,
        hobbies: data.hobbies,
        motivation: data.motivation,
        createdAt: submissionDate,
        updatedAt: submissionDate,
        canEdit: data.daysAgo <= 3
      };
    });
  }

  get filteredCandidates(): Candidate[] {
    let filtered = [...this.candidates];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(candidate => 
        this.getFullName(candidate).toLowerCase().includes(term) ||
        candidate.email.toLowerCase().includes(term) ||
        candidate.city.toLowerCase().includes(term) ||
        candidate.phoneNumber.includes(term)
      );
    }

    return this.sortCandidates(filtered);
  }

  private sortCandidates(candidates: Candidate[]): Candidate[] {
    return candidates.sort((a, b) => {
      const comparison = this.getComparisonValue(a, b);
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  private getComparisonValue(a: Candidate, b: Candidate): number {
    switch (this.sortBy) {
      case 'name':
        return this.getFullName(a).localeCompare(this.getFullName(b));
      case 'date':
        return new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
      case 'age':
        return a.age - b.age;
      case 'city':
        return a.city.localeCompare(b.city);
      default:
        return 0;
    }
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
  }

  setSorting(field: 'name' | 'date' | 'age' | 'city'): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'desc';
    }
  }

  viewCandidate(candidate: Candidate): void {
    this.router.navigate(['/candidate'], { 
      queryParams: { email: candidate.email } 
    });
  }

  getFullName(candidate: Candidate): string {
    return `${candidate.firstName} ${candidate.lastName}`;
  }

  getTimeSinceSubmission(candidate: Candidate): string {
    if (!candidate.createdAt) return 'Unknown';
    
    const diffInHours = Math.floor(
      (Date.now() - new Date(candidate.createdAt).getTime()) / this.MS_PER_HOUR
    );
    
    return diffInHours < this.HOURS_PER_DAY 
      ? `${diffInHours}h ago` 
      : `${Math.floor(diffInHours / this.HOURS_PER_DAY)}d ago`;
  }
}
