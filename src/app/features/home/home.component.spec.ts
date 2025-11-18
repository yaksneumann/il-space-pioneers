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
      'isRecruiter'
    ]);
    
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

  describe('Recruiter Navigation', () => {
    it('should redirect recruiters to dashboard on init', () => {
      mockAuthService.isRecruiter.and.returnValue(true);
      
      component.ngOnInit();
      
      expect(mockAuthService.isRecruiter).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should not redirect non-recruiters', () => {
      mockAuthService.isRecruiter.and.returnValue(false);
      
      component.ngOnInit();
      
      expect(mockAuthService.isRecruiter).toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Application Count', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should return 0 when no applications exist', () => {
      const count = component.getApplicationCount();
      expect(count).toBe(0);
    });

    it('should return correct count when applications exist', () => {
      const mockCandidates = [
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' }
      ];
      localStorage.setItem('mockCandidates', JSON.stringify(mockCandidates));
      
      const count = component.getApplicationCount();
      expect(count).toBe(2);
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate to registration when startApplication is called', () => {
      component.startApplication();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/register']);
    });

    it('should navigate to applications when manageApplications is called', () => {
      component.manageApplications();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/applications']);
    });
  });

  describe('Template Rendering', () => {
    it('should display apply button', () => {
      mockAuthService.isRecruiter.and.returnValue(false);
      
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const applyButton = compiled.querySelector('.cta-button');
      
      expect(applyButton).toBeTruthy();
      expect(applyButton?.textContent).toContain('Apply Now');
    });

    it('should display manage applications button when applications exist', () => {
      mockAuthService.isRecruiter.and.returnValue(false);
      const mockCandidates = [{ id: '1', firstName: 'Test', lastName: 'User' }];
      localStorage.setItem('mockCandidates', JSON.stringify(mockCandidates));
      
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const manageButton = compiled.querySelector('.cosmic-button.secondary');
      
      expect(manageButton).toBeTruthy();
      expect(manageButton?.textContent).toContain('Manage My Applications');
    });

    it('should not display manage applications button when no applications exist', () => {
      mockAuthService.isRecruiter.and.returnValue(false);
      localStorage.clear();
      
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const manageButton = compiled.querySelector('.cosmic-button.secondary');
      
      expect(manageButton).toBeFalsy();
    });
  });
});