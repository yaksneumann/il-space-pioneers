import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactForm } from '../../core/models/candidate.model';

@Component({
  selector: 'app-contact',
  imports: [FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit {
  formData: ContactForm = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  isSubmitting = signal(false);
  isSubmitted = signal(false);

  subjectOptions = [
    { value: '', label: 'Select a subject...' },
    { value: 'application', label: 'Application Support' },
    { value: 'technical', label: 'Technical Questions' },
    { value: 'partnership', label: 'Partnership Opportunities' },
    { value: 'media', label: 'Media Inquiries' },
    { value: 'general', label: 'General Information' },
    { value: 'other', label: 'Other' }
  ];

  ngOnInit(): void {
    this.scrollToTop();
  }

  private scrollToTop(): void {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      this.isSubmitting.set(true);
      
      setTimeout(() => {
        this.isSubmitting.set(false);
        this.isSubmitted.set(true);
      }, 500);
    }
  }

  closeSuccessMessage(): void {
    this.isSubmitted.set(false);
    this.resetForm();
  }

  isFormValid(): boolean {
    return !!(this.formData.name && 
              this.formData.email && 
              this.formData.subject && 
              this.formData.message);
  }

  resetForm(): void {
    this.formData = {
      name: '',
      email: '',
      subject: '',
      message: ''
    };
    this.isSubmitted.set(false);
    this.isSubmitting.set(false);
  }
}