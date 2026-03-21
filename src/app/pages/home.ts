import { Component, afterNextRender, ChangeDetectionStrategy, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import { ThreeBackgroundComponent } from '../components/three-bg';
import { RouterLink } from '@angular/router';
import { StoreService } from '../services/store.service';
import { SupabaseService } from '../services/supabase.service';
import gsap from 'gsap';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, HeaderComponent, FooterComponent, ThreeBackgroundComponent, RouterLink],
  template: `
    <app-three-bg></app-three-bg>
    <app-header></app-header>
    
    <main class="relative z-10 w-full overflow-hidden text-[var(--text-primary)]">
      
      <!-- 1. Hero Section -->
      <section class="h-screen w-full flex flex-col justify-center items-center relative" data-scene="intro">
        <div class="max-w-5xl mx-auto px-6 text-center">
          <h1 class="huge-text font-display font-bold tracking-tight mb-8">
            {{ pageData()?.heroTitle || 'We build systems that scale.' }}
          </h1>
          <p class="subtitle-text max-w-2xl mx-auto">
            {{ pageData()?.heroSubtitle || 'Transform ideas into impactful digital solutions. Bridge vision and execution.' }}
          </p>
        </div>
      </section>

      <!-- 2. Asymmetric Philosophy Section -->
      <section class="section py-32 w-full relative" data-scene="active">
        <div class="max-w-6xl mx-auto px-6">
          <div class="flex flex-col md:flex-row gap-16 md:gap-32 items-center">
            
            <div class="w-full md:w-5/12 ml-auto md:offset-y-12">
              <h2 class="text-4xl md:text-5xl font-display font-medium mb-8 leading-tight">
                {{ pageData()?.philosophyTitle || 'Bridge vision and execution.' }}
              </h2>
              <p class="text-[var(--text-muted)] text-lg font-light leading-relaxed mb-10 whitespace-pre-line">
                {{ pageData()?.philosophyBody || 'We construct scalable, high-performance web architecture that eliminates friction. No clutter, no unnecessary noise. Just confident engineering designed for the highest level of interaction.' }}
              </p>
              
              <button routerLink="/about" class="tesla-btn glass px-8 py-4 rounded-full flex items-center gap-4 group hover:bg-[var(--accent-main)] hover:text-black transition-colors border border-[var(--text-primary)]/10">
                <span class="font-medium tracking-wide">Explore Architecture</span>
                <span class="material-icons group-hover:translate-x-1 transition-transform">east</span>
              </button>
            </div>

            <div class="w-full md:w-6/12 relative">
              <div class="glass-panel rounded-[2rem] p-2 h-[500px] flex items-center justify-center glow-hover border border-[var(--text-primary)]/5 relative overflow-hidden">
                <div class="absolute inset-0 bg-[url('/assets/images/abstract_violet_glass_1774035496290.png')] bg-cover bg-center opacity-70 hover:opacity-100 transition-opacity duration-1000 transform hover:scale-105 pointer-events-none"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)] via-transparent to-transparent opacity-80 pointer-events-none"></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- 3. Services / Stack (Asymmetric, irregular grid) -->
      <section class="section py-32 w-full" data-scene="interaction">
        <div class="max-w-7xl mx-auto px-6">
          <div class="mb-24 md:w-1/2">
            <h2 class="text-4xl md:text-6xl font-display font-medium mb-6">
               {{ pageData()?.servicesTitle || 'Build scalable, meaningful systems.' }}
            </h2>
            <p class="subtitle-text">
               {{ pageData()?.servicesSubtitle || 'Military-grade protection, rapid deployment pipelines, and semantic architectures.' }}
            </p>
          </div>

          <div class="flex flex-col gap-12 md:gap-24 relative">
             @for (svc of pageData()?.servicesList; track $index) {
                <!-- Alternate alignment automatically -->
                <div class="flex flex-col md:flex-row gap-8 items-end w-full" [class.md:flex-row-reverse]="$index % 2 !== 0" [class.md:offset-y-12]="$index % 2 !== 0">
                  <div class="w-full md:w-1/3 text-sm text-[var(--accent-main)] font-mono tracking-widest uppercase mb-4 md:mb-0" [class.text-left]="$index % 2 !== 0" [class.md:text-right]="$index % 2 !== 0">
                    {{ svc.category }}
                  </div>
                  <div class="w-full md:w-2/3 glass-panel p-10 md:p-14 rounded-[2rem] glow-hover border border-[var(--text-primary)]/5 relative overflow-hidden group">
                    <div class="absolute inset-0 bg-[url('/assets/images/cyber_abstract_nodes_1774035517012.png')] bg-cover bg-center opacity-0 group-hover:opacity-10 transition-opacity duration-700 mix-blend-screen pointer-events-none"></div>
                    <h3 class="text-3xl font-display font-medium mb-4 relative z-10">{{ svc.title }}</h3>
                    <p class="text-[var(--text-muted)] font-light leading-relaxed relative z-10">{{ svc.description }}</p>
                  </div>
                </div>
             } @empty {
                <!-- Beautiful fallback if DB array is empty during connection lag -->
                <div class="w-full text-center py-20 text-[var(--text-muted)] font-mono text-sm tracking-widest uppercase animate-pulse">
                   Establishing secure tunnel to Services Grid...
                </div>
             }
          </div>
        </div>
      </section>

      <!-- 4. CTA (Tesla Scale Hover) -->
      <section class="section min-h-[70vh] w-full flex items-center justify-center">
        <div class="text-center px-6">
          <h2 class="text-5xl md:text-8xl font-display font-medium mb-12 tracking-tight">Initiate.</h2>
          <button routerLink="/contact" class="tesla-btn relative px-12 py-6 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] font-bold tracking-widest uppercase text-lg inline-flex items-center justify-center overflow-hidden transition-colors hover:bg-[var(--accent-main)]">
             <span class="relative z-10">Start the Engine</span>
          </button>
        </div>
      </section>

    </main>
    <app-footer></app-footer>
  `
})
export class HomeComponent implements OnInit, OnDestroy {
  private ctx!: gsap.Context;
  public store = inject(StoreService);
  private supabase = inject(SupabaseService);

  public pageData = signal<any>(null);

  constructor() {
    afterNextRender(async () => {
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      this.initGSAP(ScrollTrigger);
    });
  }

  ngOnInit() {
    this.store.setSceneState('intro');
    this.fetchData();
    // Realtime UI updates when editing in the Supabase Admin section
    this.supabase.subscribeToContent(() => {
      this.fetchData();
    });
  }

  async fetchData() {
    const data = await this.supabase.getContent('home');
    if (data) {
      this.pageData.set(data);
    }
  }

  private initGSAP(ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger) {
    this.ctx = gsap.context(() => {

      const speed = this.store.animationSpeed();

      // Product-Style Scroll Experience (Navigating a product, not scrolling a page)
      const sections = gsap.utils.toArray('.section');

      sections.forEach((section: any) => {
        gsap.from(section, {
          opacity: 0,
          y: 80,
          duration: 1 / speed,
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            scrub: true
          }
        });
      });

      // Track scenes for the Store Service glow adjustments
      sections.forEach((section: any) => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top center',
          onEnter: () => {
            const state = section.getAttribute('data-scene');
            if (state) this.store.setSceneState(state as any);
          },
          onEnterBack: () => {
            const state = section.getAttribute('data-scene');
            if (state) this.store.setSceneState(state as any);
          }
        });
      });

      // Tesla Feel Hover Interactions
      const buttons = document.querySelectorAll('.tesla-btn');
      buttons.forEach((btn: any) => {
        btn.addEventListener('mouseenter', () => {
          gsap.to(btn, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out",
            boxShadow: "0 0 30px rgba(108,140,255,0.6)"
          });
        });

        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
            boxShadow: "none"
          });
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
