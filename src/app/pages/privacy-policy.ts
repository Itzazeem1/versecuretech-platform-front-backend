import { Component, afterNextRender, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import { TranslatePipe } from '../pipes/translate.pipe';
import gsap from 'gsap';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, TranslatePipe],
  template: `
    <app-header></app-header>
    
    <main class="min-h-screen pt-32 pb-20 relative overflow-hidden bg-[var(--bg-main)]">
      <div class="max-w-4xl mx-auto px-6 relative z-10">
        <h1 class="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter mb-12 policy-anim text-[var(--accent-main)]">
          {{ 'FOOTER.PRIVACY_POLICY' | translate }}
        </h1>
        
        <div class="prose prose-invert prose-lg max-w-none policy-anim text-[var(--text-muted)] font-light">
          <p class="mb-8">{{ 'POLICY.PRIVACY.UPDATED' | translate }}</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">{{ 'POLICY.PRIVACY.H1' | translate }}</h2>
          <p class="mb-6">{{ 'POLICY.PRIVACY.P1' | translate }}</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">{{ 'POLICY.PRIVACY.H2' | translate }}</h2>
          <p class="mb-6">{{ 'POLICY.PRIVACY.P2' | translate }}</p>
          <ul class="list-disc pl-6 mb-6 space-y-2">
            <li>{{ 'POLICY.PRIVACY.LI1' | translate }}</li>
            <li>{{ 'POLICY.PRIVACY.LI2' | translate }}</li>
            <li>{{ 'POLICY.PRIVACY.LI3' | translate }}</li>
          </ul>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">{{ 'POLICY.PRIVACY.H3' | translate }}</h2>
          <p class="mb-6">{{ 'POLICY.PRIVACY.P3' | translate }}</p>
          <ul class="list-disc pl-6 mb-6 space-y-2">
            <li>{{ 'POLICY.PRIVACY.LI4' | translate }}</li>
            <li>{{ 'POLICY.PRIVACY.LI5' | translate }}</li>
            <li>{{ 'POLICY.PRIVACY.LI6' | translate }}</li>
          </ul>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">{{ 'POLICY.PRIVACY.H4' | translate }}</h2>
          <p class="mb-6">{{ 'POLICY.PRIVACY.P4' | translate }}</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">{{ 'POLICY.PRIVACY.H5' | translate }}</h2>
          <p class="mb-6">{{ 'POLICY.PRIVACY.P5' | translate }} <a href="mailto:privacy@versecuretech.com" class="text-[var(--accent-main)] hover:underline">privacy&#64;versecuretech.com</a>.</p>
        </div>
      </div>
    </main>
    
    <app-footer></app-footer>
  `
})
export class PrivacyPolicyComponent implements OnDestroy {
  private ctx!: gsap.Context;

  constructor() {
    afterNextRender(() => {
      this.ctx = gsap.context(() => {
        gsap.from('.policy-anim', {
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
