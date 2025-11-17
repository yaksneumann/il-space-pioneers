import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { Candidate, CandidateFormData, CandidateStats } from '../models/candidate.model';
import { environment } from '@env';
@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly supabase: SupabaseClient;
  private readonly candidatesSubject = new BehaviorSubject<Candidate[]>([]);
  private readonly statsSubject = new BehaviorSubject<CandidateStats | null>(null);
  private readonly EDIT_DEADLINE_DAYS = 3;
  private readonly MS_PER_DAY = 24 * 60 * 60 * 1000;
  private readonly LOCAL_STORAGE_KEY = 'mockCandidates';

  candidates$ = this.candidatesSubject.asObservable();
  stats$ = this.statsSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.key);
    this.initializeMockData();
    const stored = this.loadCandidatesFromLocalStorage();
    if (stored.length) {
      this.candidatesSubject.next(stored);
    }
  }

  private initializeMockData(): void {
    const mockStats: CandidateStats = {
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
    this.statsSubject.next(mockStats);
    const existing = localStorage.getItem(this.LOCAL_STORAGE_KEY);
    if (!existing) {
      const candidates = this.generateMockCandidates();
      this.saveCandidatesToLocalStorage(candidates);
      this.candidatesSubject.next(candidates);
    }
  }

  async submitCandidate(formData: CandidateFormData): Promise<Candidate | null> {
    const mockCandidate: Candidate = {
      id: 'submitted-' + Date.now(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      age: formData.age,
      city: formData.city,
      hobbies: formData.hobbies,
      motivation: formData.motivation,
      profileImage: formData.profileImage ? {
        filename: formData.profileImage.name,
        url: 'mock-url-' + Date.now()
      } : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      canEdit: true
    };
    
    const existingCandidates = this.loadCandidatesFromLocalStorage();
    
    const filteredCandidates = existingCandidates.filter(c => c.email !== mockCandidate.email);
    
    const newList = [mockCandidate, ...filteredCandidates];
    
    this.saveCandidatesToLocalStorage(newList);
    this.candidatesSubject.next(newList);
    
    const currentStats = this.statsSubject.value;
    if (currentStats) {
      currentStats.totalCandidates += 1;
      this.statsSubject.next({...currentStats});
    }

    return mockCandidate;
  }

  async getCandidateByEmail(email: string): Promise<Candidate | null> {
    const stored = this.loadCandidatesFromLocalStorage();
    const found = stored.find(c => c.email === email);
    if (found) {
      return found;
    }

    const mockCandidates = this.generateMockCandidates();
    return mockCandidates.find(c => c.email === email) || null;
  }

  async getAllCandidates(): Promise<Candidate[]> {
    const stored = this.loadCandidatesFromLocalStorage();
    return stored.length ? stored : this.generateMockCandidates();
  }

  async getStatistics(): Promise<CandidateStats | null> {
    return this.statsSubject.value;
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
      const submissionDate = new Date(baseDate - data.daysAgo * this.MS_PER_DAY);
      
      const profileImages = [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=400&h=400&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
        null,
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
      ];
      
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
        profileImage: profileImages[index] ? {
          filename: `profile_${index + 1}.jpg`,
          url: profileImages[index]
        } : undefined,
        createdAt: submissionDate,
        updatedAt: submissionDate,
        canEdit: data.daysAgo <= this.EDIT_DEADLINE_DAYS
      };
    });
  }

  private saveCandidatesToLocalStorage(candidates: Candidate[]): void {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(candidates));
    } catch (e) {
      console.warn('Failed to save candidates to localStorage', e);
    }
  }

  private loadCandidatesFromLocalStorage(): Candidate[] {
    try {
      const storedData = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!storedData) return [];
      const parsed = JSON.parse(storedData) as Candidate[];
      
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
}
