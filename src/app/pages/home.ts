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
      <section class="hero-section h-screen w-full flex flex-col justify-center items-center relative" data-scene="intro">
        <div class="hero-content max-w-5xl mx-auto px-6 text-center">
          <h1 class="huge-text font-display font-bold tracking-tight mb-8">
            {{ pageData()?.heroTitle || 'We build systems that scale.' }}
          </h1>
          <p class="subtitle-text max-w-2xl mx-auto">
            {{ pageData()?.heroSubtitle || 'Transform ideas into impactful digital solutions. Bridge vision and execution.' }}
          </p>
        </div>
      </section>

      <!-- 2. Asymmetric Philosophy Section -->
      <section class="philosophy-section section py-32 w-full relative" data-scene="active">
        <div class="max-w-6xl mx-auto px-6">
          <div class="flex flex-col md:flex-row gap-16 md:gap-32 items-center">
            
            <div class="philosophy-text w-full md:w-5/12 ml-auto md:offset-y-12">
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

            <div class="philosophy-image w-full md:w-6/12 relative">
              <div class="glass-panel rounded-[2rem] p-2 h-[500px] flex items-center justify-center glow-hover border border-[var(--text-primary)]/5 relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop" alt="Vision and Execution" class="absolute inset-0 w-full h-full object-cover rounded-[1.8rem] opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700" referrerpolicy="no-referrer" />
                <div class="absolute inset-0 bg-gradient-to-br from-[var(--accent-main)]/20 via-transparent to-[var(--accent-main)]/10 opacity-70 hover:opacity-100 transition-opacity duration-1000 transform hover:scale-105 pointer-events-none"></div>
                <div class="absolute inset-0 bg-gradient-to-tr from-[var(--bg-main)] via-transparent to-transparent opacity-80 pointer-events-none"></div>
                <div class="absolute w-64 h-64 bg-[var(--accent-main)]/30 blur-[100px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
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
                <div class="service-item flex flex-col md:flex-row gap-8 items-end w-full" [class.md:flex-row-reverse]="$index % 2 !== 0" [class.md:offset-y-12]="$index % 2 !== 0">
                  <div class="w-full md:w-1/3 text-sm text-[var(--accent-main)] font-mono tracking-widest uppercase mb-4 md:mb-0" [class.text-left]="$index % 2 !== 0" [class.md:text-right]="$index % 2 !== 0">
                    {{ svc.category }}
                  </div>
                  <div class="w-full md:w-2/3 glass-panel p-10 md:p-14 rounded-[2rem] glow-hover border border-[var(--text-primary)]/5 relative overflow-hidden group">
                    <div class="absolute inset-0 bg-gradient-to-r from-[var(--accent-main)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                    <div class="absolute -top-20 -right-20 w-64 h-64 bg-[var(--accent-main)]/20 blur-[120px] rounded-full pointer-events-none"></div>
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // 1. Hero Cinematic Fade
      gsap.to('.hero-content', {
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        },
        y: 150,
        opacity: 0,
        scale: 0.9,
        ease: 'none'
      });

      // 2. Lando-style Pinned Section (Philosophy)
      const philosophyTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.philosophy-section',
          start: 'top top',
          end: '+=1500',
          scrub: true,
          pin: true,
          anticipatePin: 1
        }
      });

      philosophyTl
        .from('.philosophy-text', { opacity: 0, y: 100, duration: 1 })
        .from('.philosophy-image', { opacity: 0, scale: 0.8, x: 100, duration: 1 }, '<')
        .to('.philosophy-text', { opacity: 0, y: -100, duration: 1 }, '+=1')
        .to('.philosophy-image', { opacity: 0, scale: 1.2, x: -100, duration: 1 }, '<');

      // 3. Services Staggered Reveal
      const services = gsap.utils.toArray('.service-item');
      services.forEach((service: unknown, i: number) => {
        gsap.from(service as gsap.DOMTarget, {
          scrollTrigger: {
            trigger: service as gsap.DOMTarget,
            start: 'top 80%',
            end: 'bottom 20%',
            scrub: 1
          },
          x: i % 2 === 0 ? -100 : 100,
          opacity: 0,
          duration: 1 / speed
        });
      });

      // Track scenes for the Store Service glow adjustments
      const sections = gsap.utils.toArray('.section');
      sections.forEach((section: unknown) => {
        const el = section as Element;
        ScrollTrigger.create({
          trigger: el,
          start: 'top center',
          onEnter: () => {
            const state = el.getAttribute('data-scene');
            if (state) this.store.setSceneState(state as 'loading' | 'intro' | 'active' | 'interaction');
          },
          onEnterBack: () => {
            const state = el.getAttribute('data-scene');
            if (state) this.store.setSceneState(state as 'loading' | 'intro' | 'active' | 'interaction');
          }
        });
      });

      // Tesla Feel Hover Interactions
      const buttons = document.querySelectorAll('.tesla-btn');
      buttons.forEach((btn: Element) => {
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
