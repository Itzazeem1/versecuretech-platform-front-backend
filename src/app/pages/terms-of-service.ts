import { Component, afterNextRender, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import { TranslatePipe } from '../pipes/translate.pipe';
import gsap from 'gsap';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, TranslatePipe],
  template: `
    <app-header></app-header>
    
    <main class="min-h-screen pt-32 pb-20 relative overflow-hidden bg-[var(--bg-main)]">
      <div class="max-w-4xl mx-auto px-6 relative z-10">
        <h1 class="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter mb-12 terms-anim text-[var(--accent-main)]">
          {{ 'FOOTER.TERMS_OF_SERVICE' | translate }}
        </h1>
        
        <div class="prose prose-invert prose-lg max-w-none terms-anim text-[var(--text-muted)] font-light">
          <p class="mb-8">{{ 'POLICY.TERMS.UPDATED' | translate }}</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">{{ 'POLICY.TERMS.H1' | translate }}</h2>
          <p class="mb-6">{{ 'POLICY.TERMS.P1' | translate }}</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">{{ 'POLICY.TERMS.H2' | translate }}</h2>
          <p class="mb-6">{{ 'POLICY.TERMS.P2' | translate }}</p>
          <ul class="list-disc pl-6 mb-6 space-y-2">
            <li>{{ 'POLICY.TERMS.LI1' | translate }}</li>
            <li>{{ 'POLICY.TERMS.LI2' | translate }}</li>
            <li>{{ 'POLICY.TERMS.LI3' | translate }}</li>
            <li>{{ 'POLICY.TERMS.LI4' | translate }}</li>
            <li>{{ 'POLICY.TERMS.LI5' | translate }}</li>
          </ul>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">{{ 'POLICY.TERMS.H3' | translate }}</h2>
          <p class="mb-6">{{ 'POLICY.TERMS.P3' | translate }}</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">{{ 'POLICY.TERMS.H4' | translate }}</h2>
          <p class="mb-6">{{ 'POLICY.TERMS.P4' | translate }}</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">{{ 'POLICY.TERMS.H5' | translate }}</h2>
          <p class="mb-6">{{ 'POLICY.TERMS.P5' | translate }}</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">{{ 'POLICY.TERMS.H6' | translate }}</h2>
          <p class="mb-6">{{ 'POLICY.TERMS.P6' | translate }}</p>
        </div>
      </div>
    </main>
    
    <app-footer></app-footer>
  `
})
export class TermsOfServiceComponent implements OnDestroy {
  private ctx!: gsap.Context;

  constructor() {
    afterNextRender(() => {
      this.ctx = gsap.context(() => {
        gsap.from('.terms-anim', {
          y: 30,
          opacity: 0,
          duration: 1,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.2
        });
      });
    });
  }

  ngOnDestroy() {
    if (this.ctx) {
      this.ctx.revert();
    }
  }
}
