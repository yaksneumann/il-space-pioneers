import { Component, OnInit } from '@angular/core';
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

  isSubmitting = false;
  isSubmitted = false;

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
      this.isSubmitting = true;
      
      setTimeout(() => {
        this.isSubmitting = false;
        this.isSubmitted = true;
        
        setTimeout(() => {
          this.resetForm();
        }, 3000);
      }, 1500);
    }
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
    this.isSubmitted = false;
    this.isSubmitting = false;
  }
}