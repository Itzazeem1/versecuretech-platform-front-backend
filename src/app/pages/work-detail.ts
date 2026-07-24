import { Component, OnInit, signal, afterNextRender, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, ParamMap } from '@angular/router';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import { TranslatePipe } from '../pipes/translate.pipe';
import gsap from 'gsap';

interface WorkData {
  id: string;
  titleKey: string;
  client: string;
  categoryKey: string;
  year: string;
  descriptionKey: string;
}

const WORKS: Record<string, WorkData> = {
  'project-alpha': {
    id: 'project-alpha',
    titleKey: 'WORK_DETAIL.ALPHA_TITLE',
    client: 'FinTech Global',
    categoryKey: 'WORK.WEB_DEV',
    year: '2025',
    descriptionKey: 'WORK_DETAIL.ALPHA_DESC'
  },
  'nexus-security': {
    id: 'nexus-security',
    titleKey: 'WORK_DETAIL.NEXUS_TITLE',
    client: 'Nexus Corp',
    categoryKey: 'WORK.CYBER_SECURITY',
    year: '2024',
    descriptionKey: 'WORK_DETAIL.NEXUS_DESC'
  },
  'quantum-app': {
    id: 'quantum-app',
    titleKey: 'WORK_DETAIL.QUANTUM_TITLE',
    client: 'Quantum Startups',
    categoryKey: 'WORK.APP_DEV',
    year: '2025',
    descriptionKey: 'WORK_DETAIL.QUANTUM_DESC'
  }
};

@Component({
  selector: 'app-work-detail',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterLink, TranslatePipe],
  template: `
    <app-header></app-header>
    
    <main class="min-h-screen pt-40 pb-20 relative overflow-hidden text-[var(--text-primary)]">
      @if (work()) {
        <div class="max-w-6xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          
          <div class="mb-8 inline-flex items-center gap-4 text-[var(--text-muted)] font-mono text-sm uppercase tracking-widest work-anim">
            <span>{{ (work()?.categoryKey || '') | translate }}</span>
            <span class="w-1 h-1 bg-[var(--accent-main)] rounded-full"></span>
            <span>{{ work()?.year }}</span>
          </div>
          
          <h1 class="huge-text font-display font-bold uppercase tracking-tighter mb-16 work-anim">
            {{ (work()?.titleKey || '') | translate }}
          </h1>
          
          <!-- Project Hero Image -->
          <div class="w-full h-[40vh] md:h-[60vh] relative mb-20 overflow-hidden work-anim glass-panel rounded-[2rem] glow-hover border border-[var(--text-primary)]/5 flex items-center justify-center">
             <img [src]="'/assets/images/' + work()?.id + '.png'" 
                  [alt]="(work()?.titleKey || '') | translate"
                  loading="lazy"
                  decoding="async"
                  class="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700">
             <div class="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)] via-transparent to-transparent opacity-60"></div>
          </div>
          
          <!-- Details Grid -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-16 mb-32 w-full text-left">
            <div class="md:col-span-4 work-anim md:offset-y-12">
              <div class="border-t border-[var(--text-primary)]/5 pt-6 mb-8">
                <h3 class="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">{{ 'WORK_DETAIL.CLIENT_PROFILE' | translate }}</h3>
                <p class="text-2xl font-display font-medium">{{ work()?.client }}</p>
              </div>
              <div class="border-t border-[var(--text-primary)]/5 pt-6 mb-8">
                <h3 class="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">{{ 'WORK_DETAIL.VERTICAL' | translate }}</h3>
                <p class="text-2xl font-display font-medium">{{ (work()?.categoryKey || '') | translate }}</p>
              </div>
            </div>
            
            <div class="md:col-span-7 md:col-start-6 work-anim">
              <h2 class="text-3xl font-display font-medium mb-8 text-[var(--text-muted)]">{{ 'WORK_DETAIL.CHALLENGE' | translate }}</h2>
              <p class="text-xl leading-relaxed font-light">
                {{ (work()?.descriptionKey || '') | translate }}
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
            <h2 class="text-3xl md:text-5xl font-display font-medium mb-8">{{ 'WORK_DETAIL.INITIATE_DEPLOYMENT' | translate }}</h2>
            <a routerLink="/contact" class="tesla-btn inline-flex items-center gap-4 px-10 py-5 rounded-full border border-[var(--text-primary)]/20 bg-[var(--text-primary)] text-[var(--bg-main)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)] transition-colors font-bold tracking-widest uppercase text-sm">
              {{ 'WORK_DETAIL.COMMENCE_ENG' | translate }}
            </a>
          </div>
        </div>
      } @else {
        <div class="max-w-6xl mx-auto px-6 relative z-10 flex flex-col items-center justify-center min-h-[50vh]">
          <h1 class="text-4xl font-display font-bold mb-4">{{ 'WORK_DETAIL.FRAGMENT_MISSING' | translate }}</h1>
          <a routerLink="/work" class="tesla-btn text-xs uppercase tracking-widest border-b border-[var(--accent-main)] pb-1">{{ 'WORK_DETAIL.RETURN_TO_MATRIX' | translate }}</a>
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
