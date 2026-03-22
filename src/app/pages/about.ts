import { Component, afterNextRender, OnDestroy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import { ThreeBackgroundComponent } from '../components/three-bg';
import { RouterLink } from '@angular/router';
import { StoreService } from '../services/store.service';
import { SupabaseService } from '../services/supabase.service';
import gsap from 'gsap';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, ThreeBackgroundComponent, RouterLink],
  template: `
    <app-three-bg></app-three-bg>
    <app-header></app-header>
    
    <main class="relative z-10 min-h-screen pt-40 pb-20 overflow-hidden text-[var(--text-primary)]">
      
      <!-- Hero Section -->
      <section class="max-w-7xl mx-auto px-6 mb-32 md:mb-48 scene-anim">
        <h1 class="huge-text font-display font-bold mb-8 tracking-tight">
          {{ pageData()?.heroTitle || 'We engineer the baseline.' }}
        </h1>
        <div class="flex justify-start md:offset-y-12">
          <p class="subtitle-text max-w-2xl">
            {{ pageData()?.heroSubtitle || 'A collective of digital architects and technology purists dedicated to building the future of the web with zero compromise on aesthetics or security.' }}
          </p>
        </div>
      </section>

      <!-- Minimal Stats Section -->
      <section class="max-w-7xl mx-auto px-6 mb-32 md:mb-48 scene-anim">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 border-t border-[var(--text-primary)]/5 py-16">
          <div class="col-span-1">
            <h4 class="text-6xl font-display font-medium mb-4">50<span class="text-[var(--accent-main)]">+</span></h4>
            <p class="text-[var(--text-muted)] font-mono uppercase tracking-widest text-xs">Architectures Shipped</p>
          </div>
          <div class="col-span-1 border-t md:border-t-0 md:border-l border-[var(--text-primary)]/5 pt-8 md:pt-0 md:pl-12">
            <h4 class="text-6xl font-display font-medium mb-4">99<span class="text-[var(--accent-main)]">%</span></h4>
            <p class="text-[var(--text-muted)] font-mono uppercase tracking-widest text-xs">Retention Rate</p>
          </div>
          <div class="col-span-1 border-t md:border-t-0 md:border-l border-[var(--text-primary)]/5 pt-8 md:pt-0 md:pl-12">
            <h4 class="text-6xl font-display font-medium mb-4">24<span class="text-[var(--accent-main)]">/7</span></h4>
            <p class="text-[var(--text-muted)] font-mono uppercase tracking-widest text-xs">Operations</p>
          </div>
          <div class="col-span-1 border-t md:border-t-0 md:border-l border-[var(--text-primary)]/5 pt-8 md:pt-0 md:pl-12">
            <h4 class="text-6xl font-display font-medium mb-4">Top<span class="text-[var(--accent-main)]">1%</span></h4>
            <p class="text-[var(--text-muted)] font-mono uppercase tracking-widest text-xs">Engineering Output</p>
          </div>
        </div>
      </section>

      <!-- Philosophy (Dynamic Brand Identity from Supabase) -->
      <section class="max-w-7xl mx-auto px-6 mb-32 md:mb-48">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-32">
          <div class="lg:col-span-5 scene-anim">
            <h2 class="text-4xl md:text-5xl font-display font-medium leading-tight">
              {{ pageData()?.title || 'Design is how it works.' }}
            </h2>
          </div>
          
          <div class="lg:col-span-6 lg:col-start-7 space-y-16">
            <div class="scene-anim">
              <h3 class="text-xl font-bold mb-6 text-[var(--accent-main)] uppercase tracking-widest font-mono text-sm">Philosophy</h3>
              <p class="text-[var(--text-muted)] text-xl font-light leading-relaxed">
                {{ pageData()?.content || 'We believe that beautiful interfaces are meaningless without flawless underlying mechanics. Every pixel we place serves a structural purpose. Every line of code is optimized strictly for raw performance.' }}
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Minimalist CTA -->
      <section class="max-w-4xl mx-auto px-6 text-center mt-32 md:mt-48 mb-20 scene-anim">
         <h2 class="text-3xl md:text-5xl font-display font-medium mb-10">Start the dialogue.</h2>
         <a routerLink="/contact" class="tesla-btn inline-flex items-center gap-4 px-10 py-5 rounded-full border border-[var(--text-primary)]/20 bg-[var(--text-primary)] text-[var(--bg-main)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)] transition-colors font-bold tracking-widest uppercase text-sm">
            Contact Us
         </a>
      </section>
      
    </main>
    
    <app-footer></app-footer>
  `
})
export class AboutComponent implements OnInit, OnDestroy {
  private ctx!: gsap.Context;
  public store = inject(StoreService);
  private supabase = inject(SupabaseService);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public pageData = signal<any>(null);

  ngOnInit() {
    this.fetchData();
    // Real-time synchronization
    this.supabase.subscribeToContent(() => {
      this.fetchData();
    });
  }

  async fetchData() {
    const data = await this.supabase.getContent('about');
    if (data) {
      this.pageData.set(data);
    }
  }

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

      gsap.set('.scene-anim', { y: 80, opacity: 0 });

      const sections = gsap.utils.toArray('.scene-anim');
      sections.forEach((section: unknown) => {
        gsap.to(section as gsap.DOMTarget, {
          opacity: 1,
          y: 0,
          duration: 1.2 / speed,
          scrollTrigger: {
            trigger: section as gsap.DOMTarget,
            start: "top 85%",
            scrub: true
          }
        });
      });

      const buttons = document.querySelectorAll('.tesla-btn');
      buttons.forEach((btn: Element) => {
        btn.addEventListener('mouseenter', () => gsap.to(btn, { scale: 1.05, duration: 0.3, ease: 'power2.out', boxShadow: '0 0 30px rgba(108,140,255,0.4)' }));
        btn.addEventListener('mouseleave', () => gsap.to(btn, { scale: 1, duration: 0.3, ease: 'power2.out', boxShadow: 'none' }));
      });
    });
  }

  ngOnDestroy() {
    if (this.ctx) this.ctx.revert();
  }
}
