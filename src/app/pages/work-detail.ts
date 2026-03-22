import { Component, OnInit, signal, afterNextRender, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, ParamMap } from '@angular/router';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import gsap from 'gsap';

interface WorkData {
  id: string;
  title: string;
  client: string;
  category: string;
  year: string;
  description: string;
}

const WORKS: Record<string, WorkData> = {
  'project-alpha': {
    id: 'project-alpha',
    title: 'Project Alpha',
    client: 'FinTech Global',
    category: 'Web Development',
    year: '2025',
    description: 'A complete digital transformation bridging latency constraints with a consumer-focused interface. We architected a scalable, high-performance web application operating securely at 60 frames per second.'
  },
  'nexus-security': {
    id: 'nexus-security',
    title: 'Nexus Security',
    client: 'Nexus Corp',
    category: 'Cyber Security',
    year: '2024',
    description: 'A zero-trust environment implementation. We mapped all architectural weak points and reconstructed the traffic layers from the ground up, ensuring impenetrable infrastructure.'
  },
  'quantum-app': {
    id: 'quantum-app',
    title: 'Quantum App',
    client: 'Quantum Startups',
    category: 'App Development',
    year: '2025',
    description: 'A cross-platform mobile application operating without friction. Fluid animations, edge compute integration, and absolute offline resilience under a unified codebase.'
  }
};

@Component({
  selector: 'app-work-detail',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterLink],
  template: `
    <app-header></app-header>
    
    <main class="min-h-screen pt-40 pb-20 relative overflow-hidden text-[var(--text-primary)]">
      @if (work()) {
        <div class="max-w-6xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          
          <div class="mb-8 inline-flex items-center gap-4 text-[var(--text-muted)] font-mono text-sm uppercase tracking-widest work-anim">
            <span>{{ work()?.category }}</span>
            <span class="w-1 h-1 bg-[var(--accent-main)] rounded-full"></span>
            <span>{{ work()?.year }}</span>
          </div>
          
          <h1 class="huge-text font-display font-bold uppercase tracking-tighter mb-16 work-anim">
            {{ work()?.title }}
          </h1>
          
          <!-- Abstract Component Replacement for Images -->
          <div class="w-full h-[30vh] md:h-[40vh] relative mb-20 overflow-hidden work-anim glass-panel rounded-[2rem] glow-hover border border-[var(--text-primary)]/5 flex items-center justify-center">
             <div class="absolute inset-0 opacity-10 blur-[80px] bg-gradient-to-r from-[var(--accent-main)] to-transparent pointer-events-none"></div>
             <p class="font-mono text-[var(--text-muted)] opacity-50 text-sm tracking-[0.5em] uppercase">Visual Abstraction. No Clutter.</p>
          </div>
          
          <!-- Details Grid -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-16 mb-32 w-full text-left">
            <div class="md:col-span-4 work-anim md:offset-y-12">
              <div class="border-t border-[var(--text-primary)]/5 pt-6 mb-8">
                <h3 class="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Client Profile</h3>
                <p class="text-2xl font-display font-medium">{{ work()?.client }}</p>
              </div>
              <div class="border-t border-[var(--text-primary)]/5 pt-6 mb-8">
                <h3 class="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Vertical</h3>
                <p class="text-2xl font-display font-medium">{{ work()?.category }}</p>
              </div>
            </div>
            
            <div class="md:col-span-7 md:col-start-6 work-anim">
              <h2 class="text-3xl font-display font-medium mb-8 text-[var(--text-muted)]">Operational Challenge</h2>
              <p class="text-xl leading-relaxed font-light">
                {{ work()?.description }}
              </p>
            </div>
          </div>
          
          <!-- Abstract Grid Fillers -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 work-anim w-full">
            <div class="h-[400px] glass-panel rounded-[2rem] border border-[var(--text-primary)]/5 relative overflow-hidden flex items-center justify-center">
               <div class="absolute inset-x-0 bottom-0 h-1/2 opacity-5 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
               <span class="material-icons opacity-20 text-6xl">architecture</span>
            </div>
            <div class="h-[400px] glass-panel rounded-[2rem] border border-[var(--text-primary)]/5 relative overflow-hidden flex items-center justify-center md:offset-y-12">
               <div class="absolute inset-y-0 right-0 w-1/2 opacity-5 bg-gradient-to-l from-[var(--accent-main)] to-transparent pointer-events-none"></div>
               <span class="material-icons opacity-20 text-6xl">insights</span>
            </div>
          </div>
          
          <div class="mt-32 md:mt-48 text-center work-anim">
            <h2 class="text-3xl md:text-5xl font-display font-medium mb-8">Initialize deployment.</h2>
            <a routerLink="/contact" class="tesla-btn inline-flex items-center gap-4 px-10 py-5 rounded-full border border-[var(--text-primary)]/20 bg-[var(--text-primary)] text-[var(--bg-main)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)] transition-colors font-bold tracking-widest uppercase text-sm">
              Commence Engineering
            </a>
          </div>
        </div>
      } @else {
        <div class="max-w-6xl mx-auto px-6 relative z-10 flex flex-col items-center justify-center min-h-[50vh]">
          <h1 class="text-4xl font-display font-bold mb-4">Fragment Missing</h1>
          <a routerLink="/work" class="tesla-btn text-xs uppercase tracking-widest border-b border-[var(--accent-main)] pb-1">Return to Matrix</a>
        </div>
      }
    </main>
    
    <app-footer></app-footer>
  `
})
export class WorkDetailComponent implements OnInit, OnDestroy {
  work = signal<WorkData | null>(null);

  private route = inject(ActivatedRoute);
  private ctx!: gsap.Context;

  constructor() {
    afterNextRender(() => {
      this.ctx = gsap.context(() => {
        gsap.from('.work-anim', {
          y: 80,
          opacity: 0,
          duration: 1.2,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.1
        });

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
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params: ParamMap) => {
      const id = params.get('id');
      if (id && WORKS[id]) {
        this.work.set(WORKS[id]);
      } else {
        this.work.set(null);
      }
    });
  }

  ngOnDestroy() {
    if (this.ctx) {
      this.ctx.revert();
    }
  }
}
