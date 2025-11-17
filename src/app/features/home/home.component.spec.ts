import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HomeComponent } from './home.component';
import { AuthService } from '../../core/services/auth.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isRecruiter',
      'isCandidate',
      'getApplicationStatus',
      'getCurrentUser',
      'logout',
      'clearApplicationData',
      'isAuthenticated'
    ], {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(() => false)
    });
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('User Authentication Status', () => {
    it('should show recruiter navigation when user is recruiter', () => {
      mockAuthService.isRecruiter.and.returnValue(true);
      mockAuthService.isCandidate.and.returnValue(false);
      
      fixture.detectChanges();
      
      expect(mockAuthService.isRecruiter).toHaveBeenCalled();
      expect(mockAuthService.isCandidate).toHaveBeenCalled();
    });

    it('should show candidate navigation when user is candidate', () => {
      mockAuthService.isRecruiter.and.returnValue(false);
      mockAuthService.isCandidate.and.returnValue(true);
      
      fixture.detectChanges();
      
      expect(mockAuthService.isRecruiter).toHaveBeenCalled();
      expect(mockAuthService.isCandidate).toHaveBeenCalled();
    });

    it('should show guest navigation when user is neither recruiter nor candidate', () => {
      mockAuthService.isRecruiter.and.returnValue(false);
      mockAuthService.isCandidate.and.returnValue(false);
      
      fixture.detectChanges();
      
      expect(mockAuthService.isRecruiter).toHaveBeenCalled();
      expect(mockAuthService.isCandidate).toHaveBeenCalled();
    });
  });

  describe('Application Status', () => {
    it('should check application status on init', () => {
      const mockUser = { email: 'test@example.com', role: 'candidate' as const, id: '1', loginTime: Date.now() };
      const mockStatus = {
        id: 'test-app-1',
        email: 'test@example.com',
        submissionDate: Date.now(),
        canEdit: true,
        daysLeft: 2
      };
      
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAuthService.getApplicationStatus.and.returnValue(mockStatus);
      
      component.ngOnInit();
      
      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
      expect(component.applicationStatus()).toEqual(mockStatus);
    });

    it('should not set application status for non-candidate users', () => {
      const mockUser = { email: 'recruiter@example.com', role: 'recruiter' as const, id: '1', loginTime: Date.now() };
      
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      
      component.ngOnInit();
      
      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
      expect(component.applicationStatus()).toBeNull();
    });
  });

  describe('Navigation', () => {
    it('should navigate to registration when startApplication is called', () => {
      component.startApplication();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/register']);
    });

    it('should navigate to registration when addApplication is called', () => {
      const testEmail = 'test@example.com';
      component.candidateEmail.set(testEmail);
      
      component.addApplication();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/register'], { queryParams: { email: testEmail, mode: 'new' } });
    });

    it('should navigate to applications manager when manageApplications is called', () => {
      const testEmail = 'test@example.com';
      component.candidateEmail.set(testEmail);
      
      component.manageApplications();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/applications'], { queryParams: { email: testEmail } });
    });
  });

  describe('Authentication Actions', () => {
    it('should clear application data and logout when newApplication is called', () => {
      component.newApplication();
      
      expect(mockAuthService.clearApplicationData).toHaveBeenCalled();
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/register']);
    });
  });

  describe('Template Rendering', () => {
    it('should display application status when user is candidate', () => {
      mockAuthService.isCandidate.and.returnValue(true);
      const mockUser = { email: 'test@example.com', role: 'candidate' as const, id: '1', loginTime: Date.now() };
      const mockStatus = {
        id: 'test-app-2',
        email: 'test@example.com',
        submissionDate: Date.now(),
        canEdit: true,
        daysLeft: 2
      };
      
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAuthService.getApplicationStatus.and.returnValue(mockStatus);
      
      component.ngOnInit();
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const statusCard = compiled.querySelector('.status-card');
      
      expect(statusCard).toBeTruthy();
    });

    it('should display apply button when user has not applied', () => {
      mockAuthService.getCurrentUser.and.returnValue(null);
      
      component.ngOnInit();
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const applyButton = compiled.querySelector('.cta-button');
      
      expect(applyButton).toBeTruthy();
    });
  });

  describe('Mission Cards', () => {
    it('should display all mission cards', () => {
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const missionCards = compiled.querySelectorAll('.mission-card');
      
      expect(missionCards.length).toBe(3);
    });

    it('should display correct mission card content', () => {
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const firstCard = compiled.querySelector('.mission-card');
      
      expect(firstCard?.textContent).toContain('Exploration');
    });
  });

  describe('Requirements Section', () => {
    it('should display all requirement items', () => {
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const requirementItems = compiled.querySelectorAll('.requirement-item');
      
      expect(requirementItems.length).toBe(4);
    });

    it('should display requirement titles correctly', () => {
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const firstReqTitle = compiled.querySelector('.req-title');
      
      expect(firstReqTitle?.textContent).toContain('Physical Fitness');
    });
  });
});