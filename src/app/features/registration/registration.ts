import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
// import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { Candidate, CandidateFormData } from '../../core/models/candidate.model';

@Component({
  selector: 'app-registration',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './registration.html',
  styleUrl: './registration.scss',
})
export class RegistrationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  // private readonly supabaseService = inject(SupabaseService);
  private readonly authService = inject(AuthService);
  private readonly LOCAL_STORAGE_KEY = 'mockCandidates';

  private static readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  private static readonly MAX_RESUME_SIZE = 10 * 1024 * 1024;
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  private static readonly ALLOWED_RESUME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  registrationForm!: FormGroup;
  currentStep = 1;
  isSubmitting = false;
  isSubmitted = false;
  isEditMode = false;
  
  firstName!: AbstractControl;
  lastName!: AbstractControl;
  email!: AbstractControl;
  phoneNumber!: AbstractControl;
  age!: AbstractControl;
  city!: AbstractControl;
  hobbies!: AbstractControl;
  motivation!: AbstractControl;
  
  daysLeft = 30;
  editTimeRemaining = '';
  candidateToken: string | null = null;
  
  selectedImage?: File;
  imagePreview?: string;
  imageError?: string;
  selectedResume?: File;
  resumeError?: string;

  ngOnInit(): void {
    this.scrollToTop();
    this.initializeForm();
    setTimeout(() => {
      this.checkEditMode();
    }, 100);
  }

  private initializeForm(): void {
    this.registrationForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      age: ['', [Validators.required, Validators.min(18), Validators.max(65)]],
      city: ['', [Validators.required]],
      hobbies: ['', [Validators.required, Validators.maxLength(500)]],
      motivation: ['', [Validators.required, Validators.maxLength(1000)]]
    });

    this.firstName = this.registrationForm.get('firstName')!;
    this.lastName = this.registrationForm.get('lastName')!;
    this.email = this.registrationForm.get('email')!;
    this.phoneNumber = this.registrationForm.get('phoneNumber')!;
    this.age = this.registrationForm.get('age')!;
    this.city = this.registrationForm.get('city')!;
    this.hobbies = this.registrationForm.get('hobbies')!;
    this.motivation = this.registrationForm.get('motivation')!;
  }

  private async checkEditMode(): Promise<void> {
    const queryEmail = this.route.snapshot.queryParams['email'];
    
    if (queryEmail) {
      try {
        const candidate = this.getCandidateByEmailFromLocalStorage(queryEmail);
        
        if (candidate) {
          this.isEditMode = true;
          this.populateFormWithCandidateData(candidate);
          
          this.authService.setCandidateIdentity(queryEmail);
          
          const appStatus = this.authService.getApplicationStatus(queryEmail);
          if (appStatus) {
            this.daysLeft = appStatus.daysLeft;
            if (!appStatus.canEdit) {
              this.router.navigate(['/candidate'], { queryParams: { email: queryEmail } });
              return;
            }
          }
          return;
        }
      } catch (error) {
        console.error('Error loading candidate for edit from query param:', error);
      }
    }

    const urlToken = this.authService.getTokenFromUrl();
    if (urlToken) {
      localStorage.setItem('iisa_candidate_token', urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const token = this.authService.getCandidateToken();
    if (token) {
      this.isEditMode = true;
      this.candidateToken = btoa(JSON.stringify(token));
      this.editTimeRemaining = this.authService.getEditTimeRemaining();
      
      try {
        const candidate = this.getCandidateByEmailFromLocalStorage(token.email);
        if (candidate) {
          this.populateFormWithCandidateData(candidate);
        }
      } catch (error) {
        console.error('Error loading candidate for edit:', error);
      }
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.role === 'candidate') {
      const appStatus = this.authService.getApplicationStatus(currentUser.email);
      
      if (appStatus) {
        this.isEditMode = true;
        this.daysLeft = appStatus.daysLeft;
        
        if (appStatus.canEdit) {
          try {
            const candidate = this.getCandidateByEmailFromLocalStorage(currentUser.email);
            if (candidate) {
              this.populateFormWithCandidateData(candidate);
            }
          } catch (error) {
            console.error('Error loading candidate for edit:', error);
          }
        } else {
          this.router.navigate(['/candidate'], { queryParams: { email: currentUser.email } });
        }
      }
    }
  }

  private populateFormWithCandidateData(candidate: Candidate): void {
    this.registrationForm.patchValue({
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phoneNumber: candidate.phoneNumber,
      age: candidate.age,
      city: candidate.city,
      hobbies: candidate.hobbies,
      motivation: candidate.motivation
    });

    if (candidate.profileImage?.url) {
      this.imagePreview = candidate.profileImage.url;
    }
  }

  get formProgress(): number {
    const totalFields = Object.keys(this.registrationForm.controls).length;
    const validFields = Object.values(this.registrationForm.controls)
      .filter(control => control.valid).length;
    return Math.round((validFields / totalFields) * 100);
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return !!(this.firstName.valid && 
               this.lastName.valid &&
               this.email.valid && 
               this.phoneNumber.valid && 
               this.age.valid && 
               this.city.valid);
      case 2:
        return !!(this.hobbies.valid && this.motivation.valid);
      case 3:
        return true;
      default:
        return false;
    }
  }

  nextStep(): void {
    if (this.isStepValid(this.currentStep) && this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onImageSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.processSelectedImage(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processSelectedImage(files[0]);
    }
  }

  private processSelectedImage(file: File): void {
    this.imageError = undefined;

    if (!RegistrationComponent.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.imageError = 'Please select a JPEG or PNG image';
      return;
    }

    if (file.size > RegistrationComponent.MAX_IMAGE_SIZE) {
      this.imageError = 'Image must be smaller than 5MB';
      return;
    }

    this.selectedImage = file;
    this.createImagePreview(file);
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  onResumeSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.processSelectedResume(file);
    }
  }

  onResumeDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onResumeDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onResumeDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processSelectedResume(files[0]);
    }
  }

  private processSelectedResume(file: File): void {
    this.resumeError = undefined;
    
    if (!RegistrationComponent.ALLOWED_RESUME_TYPES.includes(file.type)) {
      this.resumeError = 'Please select a PDF, DOC, or DOCX file';
      return;
    }

    if (file.size > RegistrationComponent.MAX_RESUME_SIZE) {
      this.resumeError = 'Resume must be smaller than 10MB';
      return;
    }

    this.selectedResume = file;
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const base = 1024;
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(base));
    const size = (bytes / Math.pow(base, unitIndex)).toFixed(2);
    
    return `${parseFloat(size)} ${units[unitIndex]}`;
  }

  async onSubmit(): Promise<void> {
    if (this.registrationForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    try {
      const formData: CandidateFormData = {
        ...this.registrationForm.value,
        profileImage: this.selectedImage,
        resume: this.selectedResume
      };

      const result = this.submitCandidateToLocalStorage(formData);

      if (result) {
        this.isSubmitted = true;
        this.authService.saveApplication(result);
        this.candidateToken = this.authService.generateCandidateToken(result.id!, result.email);
        this.editTimeRemaining = this.authService.getEditTimeRemaining();
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private scrollToTop(): void {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  clearForm(): void {
    if (confirm('Are you sure you want to clear your application? This action cannot be undone. This will permanently delete your application data.')) {
      const currentUser = this.authService.getCurrentUser();
      const userEmail = currentUser?.email || this.registrationForm.get('email')?.value;
      
      this.registrationForm.reset();
      this.currentStep = 1;
      this.isSubmitted = false;
      this.isEditMode = false;
      this.candidateToken = null;
      this.editTimeRemaining = '';
      this.selectedImage = undefined;
      this.imagePreview = undefined;
      this.imageError = undefined;
      this.selectedResume = undefined;
      this.resumeError = undefined;
      
      this.authService.clearCandidateToken();
      this.authService.clearApplicationData();
      this.authService.logout();
      
      if (userEmail) {
        this.removeCandidateFromStorage(userEmail);
      }
      
      this.scrollToTop();
    }
  }

  private removeCandidateFromStorage(email: string): void {
    try {
      const candidatesKey = 'mockCandidates';
      const stored = localStorage.getItem(candidatesKey);
      if (stored) {
        const candidates = JSON.parse(stored);
        const filteredCandidates = candidates.filter((c: any) => c.email !== email);
        localStorage.setItem(candidatesKey, JSON.stringify(filteredCandidates));
      }
    } catch (error) {
      console.warn('Error removing candidate from localStorage:', error);
    }
  }

  private getCandidateByEmailFromLocalStorage(email: string): Candidate | null {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!stored) return null;
      
      const candidates: Candidate[] = JSON.parse(stored);
      const found = candidates.find(c => c.email === email);
      
      if (found) {
        return {
          ...found,
          createdAt: found.createdAt ? new Date(found.createdAt) : undefined,
          updatedAt: found.updatedAt ? new Date(found.updatedAt) : undefined
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Error loading candidate from localStorage:', error);
      return null;
    }
  }

  private submitCandidateToLocalStorage(formData: CandidateFormData): Candidate {
    const newCandidate: Candidate = {
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
    
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      const existingCandidates: Candidate[] = stored ? JSON.parse(stored) : [];
      
      const filteredCandidates = existingCandidates.filter(c => c.email !== newCandidate.email);
      
      const updatedCandidates = [newCandidate, ...filteredCandidates];
      
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(updatedCandidates));
      
      return newCandidate;
    } catch (error) {
      console.error('Error saving candidate to localStorage:', error);
      throw error;
    }
  }
}
