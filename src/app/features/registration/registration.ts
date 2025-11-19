import { Component, OnInit, inject, ChangeDetectorRef, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
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
  currentStep = signal(1);
  isSubmitting = signal(false);
  isSubmitted = signal(false);
  mode = signal<'new' | 'edit' | 'view'>('new');
  candidateData = signal<Candidate | null>(null);
  
  isEditMode = computed(() => this.mode() === 'edit');
  isViewMode = computed(() => this.mode() === 'view');
  daysLeft = computed(() => {
    const candidate = this.candidateData();
    if (!candidate) return 30;
    const appStatus = this.authService.getApplicationStatus(candidate.email);
    return appStatus?.daysLeft ?? 30;
  });
  formProgress = computed(() => {
    const totalFields = Object.keys(this.registrationForm?.controls || {}).length;
    if (totalFields === 0) return 0;
    const validFields = Object.values(this.registrationForm.controls)
      .filter(control => control.valid).length;
    return Math.round((validFields / totalFields) * 100);
  });
  
  firstName!: AbstractControl;
  lastName!: AbstractControl;
  email!: AbstractControl;
  phoneNumber!: AbstractControl;
  age!: AbstractControl;
  city!: AbstractControl;
  hobbies!: AbstractControl;
  motivation!: AbstractControl;
  
  editTimeRemaining = '';
  candidateToken: string | null = null;
  selectedImage?: File;
  imagePreview?: string;
  imageError?: string;
  profileImageFilename?: string;
  selectedResume?: File;
  resumeError?: string;
  formError?: string;

  ngOnInit(): void {
    this.scrollToTop();
    this.initializeForm();
    this.checkEditMode();
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

    this.email.valueChanges.subscribe(() => {
      if (this.formError) {
        this.clearFormError();
        if (this.email.hasError('duplicate')) {
          this.email.setErrors(this.email.hasError('required') || this.email.hasError('email') 
            ? { required: this.email.hasError('required'), email: this.email.hasError('email') } 
            : null);
        }
      }
    });
  }

  private async checkEditMode(): Promise<void> {
    const queryEmail = this.route.snapshot.queryParams['email'];
    const queryId = this.route.snapshot.queryParams['id'];
    const mode = this.route.snapshot.queryParams['mode'];
    
    if (queryEmail && queryId && (mode === 'edit' || mode === 'view')) {
      try {
        const candidate = this.getCandidateByIdFromLocalStorage(queryId);
        
        if (candidate) {
          this.mode.set(mode as 'edit' | 'view');
          this.candidateData.set(candidate);
          this.populateFormWithCandidateData(candidate);
          
          if (this.isViewMode()) {
            this.registrationForm.disable();
          }
          
          this.authService.setCandidateIdentity(queryEmail);
          return;
        }
      } catch (error) {
        console.error('Error loading candidate for edit from query param:', error);
      }
    }
    
    if (queryEmail && !queryId) {
      try {
        const candidate = this.getCandidateByEmailFromLocalStorage(queryEmail);
        
        if (candidate) {
          this.mode.set('edit');
          this.candidateData.set(candidate);
          this.populateFormWithCandidateData(candidate);
          
          this.authService.setCandidateIdentity(queryEmail);
          
          const appStatus = this.authService.getApplicationStatus(queryEmail);
          if (appStatus && !appStatus.canEdit) {
            this.router.navigate(['/candidate'], { queryParams: { email: queryEmail } });
            return;
          }
          return;
        }
      } catch (error) {
        console.error('Error loading candidate for edit from query param:', error);
      }
    }

    this.mode.set('new');
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
      this.profileImageFilename = candidate.profileImage.filename;
    }
    
    if (candidate.resume?.filename) {
      this.selectedResume = new File([''], candidate.resume.filename, { type: 'application/pdf' });
    }
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
    if ((this.isViewMode() || this.isStepValid(this.currentStep())) && this.currentStep() < 3) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
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
    this.profileImageFilename = file.name;
    this.createImagePreview(file);
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
      try {
        this.cdr.detectChanges();
      } catch (err) {
      }
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

  async onSubmit(): Promise<void> {
    if (this.registrationForm.invalid || this.isSubmitting() || this.isViewMode()) {
      return;
    }

    const emailValue = this.registrationForm.get('email')?.value?.trim();
    if (emailValue && this.mode() === 'new') {
      if (this.authService.hasExistingApplication(emailValue)) {
        this.showDuplicateEmailError(emailValue);
        return;
      }
    }

    this.isSubmitting.set(true);

    try {
      const profileImageData = await this.convertFileToBase64(this.selectedImage);
      const resumeData = await this.convertFileToBase64(this.selectedResume);

      const formData: CandidateFormData = {
        ...this.registrationForm.value,
        profileImage: this.selectedImage,
        resume: this.selectedResume
      };

      const result = this.submitCandidateToLocalStorage(formData, profileImageData, resumeData);

      if (result) {
        this.isSubmitted.set(true);
        this.authService.saveApplication(result);
        this.editTimeRemaining = this.authService.getEditTimeRemaining(result.email);
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      this.formError = 'An error occurred while submitting your application. Please try again.';
    } finally {
      this.isSubmitting.set(false);
      try {
        this.cdr.detectChanges();
      } catch (err) {
      }
    }
  }

  private showDuplicateEmailError(email: string): void {
    this.formError = `An application already exists for the email address "${email}". Each email address can only be used for one application. Please use a different email address.`;
    
    this.scrollToTop();
    
    const emailControl = this.registrationForm.get('email');
    if (emailControl) {
      emailControl.setErrors({ 'duplicate': true });
      emailControl.markAsTouched();
    }
  }

  clearFormError(): void {
    this.formError = undefined;
  }

  private convertFileToBase64(file?: File): Promise<string | undefined> {
    if (!file) return Promise.resolve(undefined);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private scrollToTop(): void {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  submitAnotherApplication(): void {
    this.resetFormToNew();
    
    this.router.navigate(['/register']).then(() => {
      this.ngOnInit();
    });
  }

  private resetFormToNew(): void {
    this.mode.set('new');
    this.candidateData.set(null);
    this.currentStep.set(1);
    this.isSubmitting.set(false);
    this.isSubmitted.set(false);
    
    this.registrationForm.reset();
    this.registrationForm.enable();
    
    this.selectedImage = undefined;
    this.imagePreview = undefined;
    this.imageError = undefined;
    this.profileImageFilename = undefined;
    this.selectedResume = undefined;
    this.resumeError = undefined;
    this.formError = undefined;
    this.editTimeRemaining = '';
    this.candidateToken = null;
  }

  navigateToApplications(): void {
    this.router.navigate(['/applications']);
  }

  private getCandidateByEmailFromLocalStorage(email: string): Candidate | null {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!stored) return null;
      
      const candidates: Candidate[] = JSON.parse(stored);
      const found = candidates.filter(c => c.email === email);
      
      if (found.length === 0) return null;
      
      const sorted = found.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      
      const mostRecent = sorted[0];
      return {
        ...mostRecent,
        createdAt: mostRecent.createdAt ? new Date(mostRecent.createdAt) : undefined,
        updatedAt: mostRecent.updatedAt ? new Date(mostRecent.updatedAt) : undefined
      };
    } catch (error) {
      console.warn('Error loading candidate from localStorage:', error);
      return null;
    }
  }

  private getCandidateByIdFromLocalStorage(id: string): Candidate | null {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!stored) return null;
      
      const candidates: Candidate[] = JSON.parse(stored);
      const found = candidates.find(c => c.id === id);
      
      if (!found) return null;
      
      return {
        ...found,
        createdAt: found.createdAt ? new Date(found.createdAt) : undefined,
        updatedAt: found.updatedAt ? new Date(found.updatedAt) : undefined
      };
    } catch (error) {
      console.warn('Error loading candidate by ID from localStorage:', error);
      return null;
    }
  }

  private submitCandidateToLocalStorage(formData: CandidateFormData, profileImageData?: string, resumeData?: string): Candidate {
    const existingCandidate = this.candidateData();
    const newCandidate: Candidate = {
      id: existingCandidate?.id || 'submitted-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11),
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
        url: profileImageData || 'mock-url-' + Date.now()
      } : existingCandidate?.profileImage,
      resume: formData.resume ? {
        filename: formData.resume.name,
        url: resumeData || 'mock-resume-url-' + Date.now()
      } : existingCandidate?.resume,
      createdAt: existingCandidate?.createdAt || new Date(),
      updatedAt: new Date(),
      canEdit: true
    };
    
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      const existingCandidates: Candidate[] = stored ? JSON.parse(stored) : [];
      
      let filteredCandidates = existingCandidates;
      if (this.isEditMode() && existingCandidate) {
        filteredCandidates = existingCandidates.filter(c => c.id !== existingCandidate.id);
      }
      
      const updatedCandidates = [newCandidate, ...filteredCandidates];
      
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(updatedCandidates));
      
      return newCandidate;
    } catch (error) {
      console.error('Error saving candidate to localStorage:', error);
      throw error;
    }
  }
}
