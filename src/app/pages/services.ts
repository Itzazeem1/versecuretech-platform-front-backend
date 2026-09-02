import { Component, afterNextRender, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import { ThreeBackgroundComponent } from '../components/three-bg';
import { RouterLink } from '@angular/router';
import { StoreService } from '../services/store.service';
import { TranslatePipe } from '../pipes/translate.pipe';
import gsap from 'gsap';

@Component({
  selector: 'app-services',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, HeaderComponent, FooterComponent, ThreeBackgroundComponent, RouterLink, TranslatePipe],
  template: `
    <app-three-bg></app-three-bg>
    <app-header></app-header>
    
    <main class="relative z-10 min-h-screen pt-40 pb-20 text-[var(--text-primary)]">
      
      <!-- Hero Section -->
      <section class="max-w-6xl mx-auto px-6 mb-32 md:mb-48 scene-anim relative overflow-hidden rounded-[3rem] py-24 border border-[var(--text-primary)]/5">
        <img src="/assets/images/services-bg.png" alt="Services Background" 
             loading="lazy"
             decoding="async"
             class="absolute inset-0 w-full h-full object-cover opacity-50 transition-opacity duration-1000">
        <div class="absolute inset-0 bg-gradient-to-r from-[var(--bg-main)] via-transparent to-transparent"></div>
        <div class="relative z-10 p-8 md:p-12">
          <h1 class="huge-text font-display font-bold tracking-tight mb-8">
            {{ 'SERVICES.TITLE' | translate }}
          </h1>
          <p class="subtitle-text max-w-2xl">
            {{ 'SERVICES.SUBTITLE' | translate }}
          </p>
        </div>
      </section>

      <!-- Services List (Asymmetric + Image-Free) -->
      <section class="max-w-6xl mx-auto px-6 w-full flex flex-col gap-24 md:gap-40">
        
        <!-- Service 1 -->
        <div class="flex flex-col md:flex-row gap-12 w-full items-start scene-anim">
          <div class="w-full md:w-1/3">
            <span class="text-[var(--text-muted)] font-mono text-sm tracking-widest uppercase mb-4 block">{{ 'SERVICES.ENGINEERING' | translate }}</span>
            <h2 class="text-4xl md:text-5xl font-display font-medium mb-6">{{ 'SERVICES.WEB_APP_DEV' | translate }}</h2>
          </div>
          <div class="w-full md:w-2/3 md:offset-y-12">
            <div class="glass-panel p-10 md:p-14 rounded-[2rem] glow-hover relative overflow-hidden">
               <div class="w-64 h-64 absolute -top-10 -right-10 bg-[var(--accent-main)] blur-[100px] opacity-10 pointer-events-none"></div>
               <p class="text-[var(--text-muted)] text-xl font-light leading-relaxed mb-10 relative z-10">
                 {{ 'SERVICES.WEB_APP_DESC' | translate }}
               </p>
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 font-mono text-sm text-[var(--text-primary)] opacity-80 relative z-10">
                 <div class="py-2 border-b border-[var(--text-primary)]/5 py-4">{{ 'SERVICES.CUSTOM_ARCHITECTURES' | translate }}</div>
                 <div class="py-2 border-b border-[var(--text-primary)]/5 py-4">{{ 'SERVICES.IOS_ANDROID' | translate }}</div>
                 <div class="py-2 border-b border-[var(--text-primary)]/5 py-4">{{ 'SERVICES.PERFORMANCE_OPT' | translate }}</div>
                 <div class="py-2 border-b border-[var(--text-primary)]/5 py-4">{{ 'SERVICES.SYSTEM_INTEGRATION' | translate }}</div>
               </div>
               <a routerLink="/services/web-development" class="tesla-btn inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] font-bold tracking-widest uppercase text-xs relative z-10">
                 {{ 'SERVICES.EXPLORE_STACK' | translate }} <span class="material-icons text-sm">east</span>
               </a>
            </div>
          </div>
        </div>

        <!-- Service 2 -->
        <div class="flex flex-col md:flex-row-reverse gap-12 w-full items-start scene-anim">
          <div class="w-full md:w-1/3 text-left md:text-right">
            <span class="text-[var(--text-muted)] font-mono text-sm tracking-widest uppercase mb-4 block">{{ 'SERVICES.PROTECTION' | translate }}</span>
            <h2 class="text-4xl md:text-5xl font-display font-medium mb-6">{{ 'SERVICES.CYBER_SEC' | translate }}</h2>
          </div>
          <div class="w-full md:w-2/3 text-left">
            <div class="glass-panel p-10 md:p-14 rounded-[2rem] glow-hover relative overflow-hidden">
               <div class="w-64 h-64 absolute -bottom-10 -left-10 bg-[var(--accent-main)] blur-[100px] opacity-10 pointer-events-none"></div>
               <p class="text-[var(--text-muted)] text-xl font-light leading-relaxed mb-10 relative z-10">
                 {{ 'SERVICES.CYBER_SEC_DESC' | translate }}
               </p>
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 font-mono text-sm text-[var(--text-primary)] opacity-80 relative z-10">
                 <div class="py-2 border-b border-[var(--text-primary)]/5 py-4">{{ 'SERVICES.PENETRATION_TESTING' | translate }}</div>
                 <div class="py-2 border-b border-[var(--text-primary)]/5 py-4">{{ 'SERVICES.SECURITY_AUDITS' | translate }}</div>
                 <div class="py-2 border-b border-[var(--text-primary)]/5 py-4">{{ 'SERVICES.INCIDENT_RESPONSE' | translate }}</div>
                 <div class="py-2 border-b border-[var(--text-primary)]/5 py-4">{{ 'SERVICES.ZERO_TRUST' | translate }}</div>
               </div>
               <a routerLink="/services/cyber-security" class="tesla-btn inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] font-bold tracking-widest uppercase text-xs relative z-10">
                 {{ 'SERVICES.EXPLORE_SECURITY' | translate }} <span class="material-icons text-sm">east</span>
               </a>
            </div>
          </div>
        </div>

        <!-- Service 3 -->
        <div class="flex flex-col md:flex-row gap-12 w-full items-start scene-anim">
          <div class="w-full md:w-1/3">
            <span class="text-[var(--text-muted)] font-mono text-sm tracking-widest uppercase mb-4 block">{{ 'SERVICES.GROWTH' | translate }}</span>
            <h2 class="text-4xl md:text-5xl font-display font-medium mb-6">{{ 'SERVICES.SEO_OPT' | translate }}</h2>
          </div>
          <div class="w-full md:w-2/3 md:offset-y-12">
            <div class="glass-panel p-10 md:p-14 rounded-[2rem] glow-hover relative overflow-hidden">
               <div class="w-64 h-64 absolute top-1/2 right-1/2 bg-[var(--accent-main)] blur-[120px] opacity-10 pointer-events-none"></div>
               <p class="text-[var(--text-muted)] text-xl font-light leading-relaxed mb-10 relative z-10">
                 {{ 'SERVICES.SEO_OPT_DESC' | translate }}
               </p>
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 font-mono text-sm text-[var(--text-primary)] opacity-80 relative z-10">
                 <div class="py-2 border-b border-[var(--text-primary)]/5 py-4">{{ 'SERVICES.TECHNICAL_SEO' | translate }}</div>
                 <div class="py-2 border-b border-[var(--text-primary)]/5 py-4">{{ 'SERVICES.SEMANTIC_MARKUP' | translate }}</div>
                 <div class="py-2 border-b border-[var(--text-primary)]/5 py-4">{{ 'SERVICES.CORE_WEB_VITALS' | translate }}</div>
                 <div class="py-2 border-b border-[var(--text-primary)]/5 py-4">{{ 'SERVICES.CONVERSION_ARCHITECTURE' | translate }}</div>
               </div>
               <a routerLink="/services/seo-optimization" class="tesla-btn inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] font-bold tracking-widest uppercase text-xs relative z-10">
                 {{ 'SERVICES.EXPLORE_GROWTH' | translate }} <span class="material-icons text-sm">east</span>
               </a>
            </div>
          </div>
        </div>

      </section>
      
      <!-- Minimalist CTA -->
      <section class="max-w-4xl mx-auto px-6 text-center mt-32 md:mt-48 mb-20 scene-anim">
         <h2 class="text-3xl md:text-5xl font-display font-medium mb-10">{{ 'SERVICES.CTA_TITLE' | translate }}</h2>
         <a routerLink="/contact" class="tesla-btn inline-flex items-center gap-4 px-10 py-5 rounded-full border border-[var(--text-primary)]/20 hover:bg-[var(--text-primary)] hover:text-[var(--bg-main)] transition-colors font-bold tracking-widest uppercase text-sm">
            {{ 'SERVICES.CTA_BUTTON' | translate }}
         </a>
      </section>
      
    </main>
    
    <app-footer></app-footer>
  `
})
export class ServicesComponent implements OnDestroy {
  private ctx!: gsap.Context;
  public store = inject(StoreService);

  constructor() {
    afterNextRender(async () => {
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      this.initGSAP();
    });
  }

  private initGSAP() {
    this.ctx = gsap.context(() => {
      const speed = this.store.animationSpeed();

      const sections = gsap.utils.toArray('.scene-anim');
      sections.forEach((section: unknown) => {
        gsap.from(section as gsap.DOMTarget, {
          opacity: 0,
          y: 48,
          duration: 0.9 / speed,
          ease: 'power2.out',
          immediateRender: false,
          scrollTrigger: {
            trigger: section as gsap.DOMTarget,
            start: 'top 88%',
            toggleActions: 'play none none none'
          }
        });
      });

      // Hover Glow Physics
      const buttons = document.querySelectorAll('.tesla-btn');
      buttons.forEach((btn: Element) => {
        btn.addEventListener('mouseenter', () => {
          gsap.to(btn, { scale: 1.05, duration: 0.3, ease: 'power2.out', boxShadow: '0 0 30px rgba(108,140,255,0.4)' });
        });
        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, { scale: 1, duration: 0.3, ease: 'power2.out', boxShadow: 'none' });
        });
      });
    });
  }

  ngOnDestroy() {
    if (this.ctx) this.ctx.revert();
  }
}
