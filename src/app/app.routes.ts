import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home').then(m => m.HomeComponent)
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services').then(m => m.ServicesComponent)
  },
  {
    path: 'services/:id',
    loadComponent: () => import('./pages/service-detail').then(m => m.ServiceDetailComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about').then(m => m.AboutComponent)
  },
  {
    path: 'work',
    loadComponent: () => import('./pages/work').then(m => m.WorkComponent)
  },
  {
    path: 'work/:id',
    loadComponent: () => import('./pages/work-detail').then(m => m.WorkDetailComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact').then(m => m.ContactComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin').then(m => m.AdminComponent)
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./pages/privacy-policy').then(m => m.PrivacyPolicyComponent)
  },
  {
    path: 'terms-of-service',
    loadComponent: () => import('./pages/terms-of-service').then(m => m.TermsOfServiceComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
