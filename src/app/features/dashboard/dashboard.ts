import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Candidate, CandidateStats } from '../../core/models/candidate.model';
// import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  // private readonly supabaseService = inject(SupabaseService);
  private readonly HOURS_PER_DAY = 24;
  private readonly MS_PER_HOUR = 60 * 60 * 1000;
  private readonly LOCAL_STORAGE_KEY = 'mockCandidates';

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
      this.candidates = this.loadCandidatesFromLocalStorage();
      
      if (this.candidates.length === 0) {
        this.candidates = this.generateMockCandidates();
        this.saveCandidatesToLocalStorage(this.candidates);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.stats = null;
      this.candidates = [];
    } finally {
      this.isLoading = false;
    }
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

  private generateMockStats(): CandidateStats {
    return {
      totalCandidates: 10,
      totalVisits: 285,
      conversionRate: 18,
      averageAge: 30,
      ageBreakdown: [
        { range: '18-25', count: 3, percentage: 30 },
        { range: '26-35', count: 5, percentage: 50 },
        { range: '36-45', count: 2, percentage: 20 }
      ],
      cityDistribution: [
        { city: 'Tel Aviv', count: 3 },
        { city: 'Jerusalem', count: 2 },
        { city: 'Haifa', count: 2 },
        { city: 'Beer Sheva', count: 1 },
        { city: 'Eilat', count: 1 },
        { city: 'Netanya', count: 1 }
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
      { firstName: 'Yaron', lastName: 'Katz', email: 'yaron.katz@example.com', phoneNumber: '+972-50-567-8901', age: 35, city: 'Eilat', hobbies: 'Astrophotography, diving, programming', motivation: 'Combining my love for technology and space exploration.', daysAgo: 5 },
      { firstName: 'Tamar', lastName: 'Rosen', email: 'tamar.rosen@example.com', phoneNumber: '+972-50-678-9012', age: 24, city: 'Tel Aviv', hobbies: 'Geology, rock climbing, music', motivation: 'To study planetary geology and contribute to Mars colonization.', daysAgo: 6 },
      { firstName: 'Avi', lastName: 'Shapira', email: 'avi.shapira@example.com', phoneNumber: '+972-50-789-0123', age: 29, city: 'Haifa', hobbies: 'Aviation, flight simulation, mechanics', motivation: 'As a pilot, I want to take the next step into space flight.', daysAgo: 7 },
      { firstName: 'Maya', lastName: 'Klein', email: 'maya.klein@example.com', phoneNumber: '+972-50-890-1234', age: 33, city: 'Jerusalem', hobbies: 'Biology, research, swimming', motivation: 'Studying life in extreme environments fascinates me.', daysAgo: 8 },
      { firstName: 'Eran', lastName: 'Mizrahi', email: 'eran.mizrahi@example.com', phoneNumber: '+972-50-901-2345', age: 27, city: 'Netanya', hobbies: 'Computer science, gaming, cycling', motivation: 'I want to develop software for space missions.', daysAgo: 9 },
      { firstName: 'Noa', lastName: 'Tal', email: 'noa.tal@example.com', phoneNumber: '+972-50-012-3456', age: 31, city: 'Tel Aviv', hobbies: 'Psychology, meditation, running', motivation: 'Understanding human psychology in isolation is crucial for long-term space missions.', daysAgo: 10 }
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

  private loadCandidatesFromLocalStorage(): Candidate[] {
    try {
      const raw = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Candidate[];
      
      return parsed.map(candidate => ({
        ...candidate,
        createdAt: candidate.createdAt ? new Date(candidate.createdAt) : undefined,
        updatedAt: candidate.updatedAt ? new Date(candidate.updatedAt) : undefined
      }));
    } catch (e) {
      console.warn('Failed to load candidates from localStorage', e);
      return [];
    }
  }

  private saveCandidatesToLocalStorage(candidates: Candidate[]): void {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(candidates));
    } catch (e) {
      console.warn('Failed to save candidates to localStorage', e);
    }
  }
}
