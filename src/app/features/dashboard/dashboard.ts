import { Component, OnInit, inject, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import * as L from 'leaflet';
import { Candidate, CandidateStats } from '../../core/models/candidate.model';

interface CityLocation {
  city: string;
  lat: number;
  lng: number;
  count: number;
  candidates: Candidate[];
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('ageChartCanvas', { static: false }) ageChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;
  
  private readonly router = inject(Router);
  private readonly HOURS_PER_DAY = 24;
  private readonly MS_PER_HOUR = 60 * 60 * 1000;
  private readonly LOCAL_STORAGE_KEY = 'mockCandidates';

  candidates: Candidate[] = [];
  stats: CandidateStats | null = null;
  isLoading = true;
  searchTerm = '';
  sortBy: 'name' | 'date' | 'age' | 'city' = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';
  private ageChart: Chart | null = null;
  private map: L.Map | null = null;

  constructor() {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    if (this.candidates.length > 0) {
      if (this.ageChartCanvas?.nativeElement) {
        this.createAgeChart();
      }
      if (this.mapContainer?.nativeElement) {
        this.createMap();
      }
    }
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
      this.createVisualizationsIfReady();
    }
  }

  private createVisualizationsIfReady(): void {
    if (this.candidates.length > 0) {
      if (this.ageChartCanvas?.nativeElement) {
        this.createAgeChart();
      }
      if (this.mapContainer?.nativeElement) {
        this.createMap();
      }
    }
  }

  private createAgeChart(): void {
    if (!this.ageChartCanvas?.nativeElement) return;

    const ageData = this.getAgeBreakdownData();
    const ctx = this.ageChartCanvas.nativeElement.getContext('2d');
    
    if (!ctx) return;

    if (this.ageChart) {
      this.ageChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels: ageData.map(item => item.range),
        datasets: [{
          label: 'Candidates',
          data: ageData.map(item => item.count),
          backgroundColor: [
            'rgba(74, 144, 226, 0.9)',
            'rgba(0, 200, 255, 0.9)',
            'rgba(255, 140, 0, 0.9)',
            'rgba(255, 65, 108, 0.9)',
            'rgba(46, 204, 113, 0.9)',
            'rgba(230, 126, 34, 0.9)',
            'rgba(155, 89, 182, 0.9)'
          ],
          borderColor: [
            'rgba(74, 144, 226, 1)',
            'rgba(0, 200, 255, 1)',
            'rgba(255, 140, 0, 1)',
            'rgba(255, 65, 108, 1)',
            'rgba(46, 204, 113, 1)',
            'rgba(230, 126, 34, 1)',
            'rgba(155, 89, 182, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            titleColor: '#FFFFFF',
            bodyColor: '#E1E5E9',
            borderColor: '#4A90E2',
            borderWidth: 1,
            titleFont: {
              family: "'Exo 2', sans-serif",
              size: 14,
              weight: 600
            },
            bodyFont: {
              family: "'Exo 2', sans-serif",
              size: 12
            },
            callbacks: {
              label: (context) => {
                const percentage = ageData[context.dataIndex].percentage;
                return `${context.parsed.y} candidates (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#E1E5E9',
              font: {
                family: "'Exo 2', sans-serif",
                size: 12
              }
            },
            border: {
              color: 'rgba(74, 144, 226, 0.3)'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(74, 144, 226, 0.1)'
            },
            ticks: {
              color: '#E1E5E9',
              font: {
                family: "'Exo 2', sans-serif",
                size: 12
              },
              stepSize: 1
            },
            border: {
              color: 'rgba(74, 144, 226, 0.3)'
            }
          }
        }
      }
    };

    this.ageChart = new Chart(ctx, config);
  }

  private createMap(): void {
    if (!this.mapContainer?.nativeElement) return;

    this.map = L.map(this.mapContainer.nativeElement).setView([31.5, 34.75], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    const cityData = this.getCityLocationData();
    this.addCityMarkers(cityData);
  }

  private getCityLocationData(): CityLocation[] {
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      'Tel Aviv': { lat: 32.0853, lng: 34.7818 },
      'Jerusalem': { lat: 31.7683, lng: 35.2137 },
      'Haifa': { lat: 32.7940, lng: 34.9896 },
      'Beer Sheva': { lat: 31.2518, lng: 34.7915 },
      'Eilat': { lat: 29.5577, lng: 34.9519 },
      'Netanya': { lat: 32.3215, lng: 34.8532 },
      'Ashdod': { lat: 31.7904, lng: 34.6496 },
      'Rishon LeZion': { lat: 31.9730, lng: 34.7925 },
      'Petah Tikva': { lat: 32.0853, lng: 34.8878 },
      'Nazareth': { lat: 32.7022, lng: 35.3035 }
    };

    const cityGroups: Record<string, Candidate[]> = {};
    this.candidates.forEach(candidate => {
      const city = candidate.city;
      if (!cityGroups[city]) {
        cityGroups[city] = [];
      }
      cityGroups[city].push(candidate);
    });

    return Object.entries(cityGroups).map(([city, candidates]) => {
      const coords = cityCoordinates[city] || { lat: 31.5, lng: 34.75 };
      return {
        city,
        lat: coords.lat,
        lng: coords.lng,
        count: candidates.length,
        candidates
      };
    });
  }

  private addCityMarkers(cityData: CityLocation[]): void {
    if (!this.map) return;

    cityData.forEach(cityInfo => {
      const markerHtml = `
        <div style="
          background: #4A90E2;
          color: white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          border: 2px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        ">${cityInfo.count}</div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 10px 0; color: #4A90E2;">${cityInfo.city}</h3>
          <p style="margin: 0 0 10px 0; font-weight: bold;">${cityInfo.count} candidate${cityInfo.count > 1 ? 's' : ''}</p>
          <div style="max-height: 150px; overflow-y: auto;">
            ${cityInfo.candidates.map(candidate => `
              <div style="padding: 5px 0; border-bottom: 1px solid #eee;">
                <strong>${candidate.firstName} ${candidate.lastName}</strong><br>
                <small>Age: ${candidate.age} | ${candidate.email}</small>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      L.marker([cityInfo.lat, cityInfo.lng], { icon: customIcon })
        .bindPopup(popupContent)
        .addTo(this.map!);
    });
  }

  private getAgeBreakdownData(): { range: string; count: number; percentage: number }[] {
    const ranges = [
      { min: 18, max: 24, range: '18-24' },
      { min: 25, max: 29, range: '25-29' },
      { min: 30, max: 34, range: '30-34' },
      { min: 35, max: 39, range: '35-39' },
      { min: 40, max: 44, range: '40-44' },
      { min: 45, max: 49, range: '45-49' },
      { min: 50, max: 100, range: '50+' }
    ];

    const total = this.candidates.length;
    
    return ranges.map(range => {
      const count = this.candidates.filter(candidate => 
        candidate.age >= range.min && candidate.age <= range.max
      ).length;
      
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      
      return {
        range: range.range,
        count,
        percentage
      };
    }).filter(item => item.count > 0);
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

  private saveCandidatesToLocalStorage(candidates: Candidate[]): void {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(candidates));
    } catch (e) {
      console.warn('Failed to save candidates to localStorage', e);
    }
  }
}
