import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { Candidate, CandidateFormData, CandidateStats } from '../models/candidate.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly supabase: SupabaseClient;
  private readonly candidatesSubject = new BehaviorSubject<Candidate[]>([]);
  private readonly statsSubject = new BehaviorSubject<CandidateStats | null>(null);
  private readonly EDIT_DEADLINE_DAYS = 3;
  private readonly MS_PER_DAY = 24 * 60 * 60 * 1000;

  candidates$ = this.candidatesSubject.asObservable();
  stats$ = this.statsSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.key);
    this.initializeMockData();
  }

  private initializeMockData(): void {
    const mockStats: CandidateStats = {
      totalCandidates: 5,
      totalVisits: 150,
      conversionRate: 28,
      ageBreakdown: [
        { range: '18-25', count: 1, percentage: 20 },
        { range: '26-35', count: 3, percentage: 60 },
        { range: '36-45', count: 1, percentage: 20 }
      ],
      cityDistribution: [
        { city: 'Tel Aviv', count: 1 },
        { city: 'Jerusalem', count: 1 },
        { city: 'Haifa', count: 1 },
        { city: 'Beersheba', count: 1 },
        { city: 'Netanya', count: 1 }
      ],
      averageAge: 30
    };
    this.statsSubject.next(mockStats);
  }

  async submitCandidate(formData: CandidateFormData): Promise<Candidate | null> {
    const mockCandidate: Candidate = {
      id: 'mock-' + Date.now(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      age: formData.age,
      city: formData.city,
      hobbies: formData.hobbies,
      motivation: formData.motivation,
      profileImage: formData.profileImage ? {
        file: formData.profileImage,
        filename: formData.profileImage.name,
        url: 'mock-url'
      } : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      canEdit: true
    };
    
    const currentStats = this.statsSubject.value;
    if (currentStats) {
      currentStats.totalCandidates += 1;
      this.statsSubject.next({...currentStats});
    }
    
    return mockCandidate;
  }

  async getCandidateByEmail(email: string): Promise<Candidate | null> {
    const mockCandidates = this.generateMockCandidates();
    return mockCandidates.find(c => c.email === email) || null;
  }

  async getAllCandidates(): Promise<Candidate[]> {
    return this.generateMockCandidates();
  }

  async getStatistics(): Promise<CandidateStats | null> {
    return this.statsSubject.value;
  }

  private generateMockCandidates(): Candidate[] {
    const baseDate = Date.now();
    const mockCandidatesData = [
      { firstName: 'David', lastName: 'Cohen', email: 'david.cohen@example.com', phoneNumber: '+972-50-123-4567', age: 28, city: 'Tel Aviv', hobbies: 'Astronomy, rock climbing, photography', motivation: 'I have always dreamed of seeing Earth from space and being part of groundbreaking Israeli space exploration.', daysAgo: 2 },
      { firstName: 'Sarah', lastName: 'Levi', email: 'sarah.levi@example.com', phoneNumber: '+972-54-987-6543', age: 32, city: 'Jerusalem', hobbies: 'Pilot training, hiking, technology', motivation: 'As a pilot, I bring aviation experience and a deep understanding of Israeli skies. Space is the next frontier.', daysAgo: 5 },
      { firstName: 'Yossi', lastName: 'Goldberg', email: 'yossi.goldberg@example.com', phoneNumber: '+972-52-555-0123', age: 25, city: 'Haifa', hobbies: 'Engineering, swimming, chess', motivation: 'My engineering background in aerospace systems makes me an ideal candidate for this historic mission.', daysAgo: 1 },
      { firstName: 'Michal', lastName: 'Rosenberg', email: 'michal.rosenberg@example.com', phoneNumber: '+972-53-777-8888', age: 29, city: 'Beersheba', hobbies: 'Physics research, marathon running, chess', motivation: 'My research in astrophysics and deep space phenomena makes me uniquely qualified for this mission.', daysAgo: 3 },
      { firstName: 'Avi', lastName: 'Shapiro', email: 'avi.shapiro@example.com', phoneNumber: '+972-52-999-1111', age: 35, city: 'Netanya', hobbies: 'Flight simulation, scuba diving, electronics', motivation: 'Former IAF pilot with extensive experience in high-stress environments and advanced navigation systems.', daysAgo: 7 }
    ];

    return mockCandidatesData.map((data, index) => {
      const submissionDate = new Date(baseDate - data.daysAgo * this.MS_PER_DAY);
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
        canEdit: data.daysAgo <= this.EDIT_DEADLINE_DAYS
      };
    });
  }
}
