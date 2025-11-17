import { Routes } from '@angular/router';
import { RecruiterGuard } from './core/guards/auth.guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Space Pioneers | Join the Mission'
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent),
    title: 'About IISA | Space Pioneers'
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent),
    title: 'Contact Us | Space Pioneers'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/recruiter-login/recruiter-login.component').then(m => m.RecruiterLoginComponent),
    title: 'Recruiter Login | Space Pioneers'
  },
  {
    path: 'applications',
    loadComponent: () => import('./features/applications-manager/applications-manager.component').then(m => m.ApplicationsManagerComponent),
    title: 'My Applications | Space Pioneers'
  },
  {
    path: 'register',
    loadComponent: () => import('./features/registration/registration').then(m => m.RegistrationComponent),
    title: 'Apply for Space Mission | Space Pioneers'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
    title: 'Mission Control Dashboard | Space Pioneers',
    canActivate: [RecruiterGuard]
  },
  {
    path: 'candidate',
    loadComponent: () => import('./features/candidate-view/candidate-view').then(m => m.CandidateViewComponent),
    title: 'Candidate Details | Space Pioneers'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
