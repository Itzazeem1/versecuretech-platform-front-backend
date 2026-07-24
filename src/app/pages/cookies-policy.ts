import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-cookies-policy',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, TranslatePipe],
  template: `
    <app-header></app-header>
    
    <main class="min-h-screen pt-32 pb-20 relative overflow-hidden bg-[var(--bg-main)]">
      <div class="max-w-4xl mx-auto px-6 relative z-10">
        <h1 class="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter mb-12 text-[var(--accent-main)]">
          {{ 'FOOTER.COOKIES_POLICY' | translate }}
        </h1>
        
        <div class="prose prose-invert prose-lg max-w-none text-[var(--text-muted)] font-light">
          <p class="mb-8">{{ 'POLICY.COOKIES.UPDATED' | translate }}</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">{{ 'POLICY.COOKIES.H1' | translate }}</h2>
          <p class="mb-6">{{ 'POLICY.COOKIES.P1' | translate }}</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">{{ 'POLICY.COOKIES.H2' | translate }}</h2>
          <p class="mb-6">{{ 'POLICY.COOKIES.P2' | translate }}</p>
          <ul class="list-disc pl-6 mb-6 space-y-2">
            <li>{{ 'POLICY.COOKIES.LI1' | translate }}</li>
            <li>{{ 'POLICY.COOKIES.LI2' | translate }}</li>
            <li>{{ 'POLICY.COOKIES.LI3' | translate }}</li>
            <li>{{ 'POLICY.COOKIES.LI4' | translate }}</li>
          </ul>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">{{ 'POLICY.COOKIES.H3' | translate }}</h2>
          <p class="mb-6">{{ 'POLICY.COOKIES.P3' | translate }}</p>
          <p class="mb-6">{{ 'POLICY.COOKIES.P3B' | translate }}</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">{{ 'POLICY.COOKIES.H4' | translate }}</h2>
          <p class="mb-6">{{ 'POLICY.COOKIES.P4' | translate }}</p>
        </div>
      </div>
    </main>
    
    <app-footer></app-footer>
  `
})
export class CookiesPolicyComponent {}
