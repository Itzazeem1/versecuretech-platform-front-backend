import { Component, OnInit, signal, afterNextRender, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, ParamMap } from '@angular/router';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import { TranslatePipe } from '../pipes/translate.pipe';
import gsap from 'gsap';

interface ServiceData {
  id: string;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  featureKeys: string[];
  icon: string;
  image: string;
}

const SERVICES: Record<string, ServiceData> = {
  'web-development': {
    id: 'web-development',
    titleKey: 'SERVICES_DATA.WEB_DEV_TITLE',
    subtitleKey: 'SERVICES_DATA.WEB_DEV_SUBTITLE',
    descriptionKey: 'SERVICES_DATA.WEB_DEV_DESC',
    featureKeys: ['SERVICES_DATA.WEB_DEV_F1', 'SERVICES_DATA.WEB_DEV_F2', 'SERVICES_DATA.WEB_DEV_F3', 'SERVICES_DATA.WEB_DEV_F4', 'SERVICES_DATA.WEB_DEV_F5'],
    icon: 'code',
    image: ''
  },
  'app-development': {
    id: 'app-development',
    titleKey: 'SERVICES_DATA.APP_DEV_TITLE',
    subtitleKey: 'SERVICES_DATA.APP_DEV_SUBTITLE',
    descriptionKey: 'SERVICES_DATA.APP_DEV_DESC',
    featureKeys: ['SERVICES_DATA.APP_DEV_F1', 'SERVICES_DATA.APP_DEV_F2', 'SERVICES_DATA.APP_DEV_F3', 'SERVICES_DATA.APP_DEV_F4', 'SERVICES_DATA.APP_DEV_F5'],
    icon: 'smartphone',
    image: ''
  },
  'cyber-security': {
    id: 'cyber-security',
    titleKey: 'SERVICES_DATA.CYBER_SEC_TITLE',
    subtitleKey: 'SERVICES_DATA.CYBER_SEC_SUBTITLE',
    descriptionKey: 'SERVICES_DATA.CYBER_SEC_DESC',
    featureKeys: ['SERVICES_DATA.CYBER_SEC_F1', 'SERVICES_DATA.CYBER_SEC_F2', 'SERVICES_DATA.CYBER_SEC_F3', 'SERVICES_DATA.CYBER_SEC_F4', 'SERVICES_DATA.CYBER_SEC_F5'],
    icon: 'security',
    image: ''
  },
  'seo-optimization': {
    id: 'seo-optimization',
    titleKey: 'SERVICES_DATA.SEO_OPT_TITLE',
    subtitleKey: 'SERVICES_DATA.SEO_OPT_SUBTITLE',
    descriptionKey: 'SERVICES_DATA.SEO_OPT_DESC',
    featureKeys: ['SERVICES_DATA.SEO_OPT_F1', 'SERVICES_DATA.SEO_OPT_F2', 'SERVICES_DATA.SEO_OPT_F3', 'SERVICES_DATA.SEO_OPT_F4', 'SERVICES_DATA.SEO_OPT_F5'],
    icon: 'trending_up',
    image: ''
  }
};

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterLink, TranslatePipe],
  template: `
    <app-header></app-header>
    
    <main class="min-h-screen pt-40 pb-20 relative overflow-hidden text-[var(--text-primary)]">
      @if (service()) {
        
        <div class="max-w-6xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <div class="mb-8 inline-flex items-center justify-center gap-3 text-[var(--text-muted)] font-mono text-sm tracking-[0.2em] uppercase service-anim">
            <span class="material-icons opacity-70">{{ service()?.icon }}</span>
            <span>{{ 'SERVICE_DETAIL.SUBTITLE_TAG' | translate }}</span>
          </div>
          
          <h1 class="huge-text font-display font-bold tracking-tight mb-8 service-anim">
            {{ (service()?.titleKey || '') | translate }}
          </h1>
          
          <p class="subtitle-text mb-20 max-w-3xl service-anim">
            {{ (service()?.subtitleKey || '') | translate }}
          </p>
          
          <!-- Asymmetric Detail layout without images -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-16 mt-12 w-full text-left">
            <div class="md:col-span-5 md:offset-y-12 service-anim">
              <h2 class="text-3xl font-display font-medium mb-6">{{ 'SERVICE_DETAIL.OVERVIEW' | translate }}</h2>
              <p class="text-[var(--text-muted)] text-lg leading-relaxed font-light">
                {{ (service()?.descriptionKey || '') | translate }}
              </p>
              
              <div class="mt-16 flex gap-4">
                <a [routerLink]="['/contact']" [queryParams]="{ service: (service()?.titleKey || '') | translate }" class="tesla-btn inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] font-bold tracking-widest uppercase text-sm hover:bg-[var(--accent-main)] transition-colors">
                  {{ 'SERVICE_DETAIL.START_PROJECT' | translate }} <span class="material-icons">east</span>
                </a>
              </div>
            </div>
            
            <div class="md:col-span-6 md:col-start-7 service-anim">
              <div class="glass-panel p-10 md:p-16 rounded-[2rem] glow-hover">
                <h2 class="text-2xl font-display font-medium mb-10 text-[var(--accent-main)]">{{ 'SERVICE_DETAIL.KEY_CAPABILITIES' | translate }}</h2>
                <ul class="space-y-6">
                  @for (featureKey of service()?.featureKeys; track featureKey) {
                    <li class="flex items-start gap-4 text-[var(--text-muted)] text-lg border-b border-[var(--text-primary)]/5 pb-6">
                      <span class="material-icons text-[var(--accent-main)] mt-1 opacity-70">noise_control_off</span>
                      <span class="font-light">{{ featureKey | translate }}</span>
                    </li>
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center justify-center min-h-[50vh]">
          <h1 class="text-4xl font-display font-bold mb-4">{{ 'SERVICE_DETAIL.NOT_FOUND' | translate }}</h1>
          <a routerLink="/services" class="text-[var(--accent-main)] hover:text-[var(--text-primary)] transition-colors tracking-widest uppercase text-sm">{{ 'SERVICE_DETAIL.BACK_TO_ARRAY' | translate }}</a>
        </div>
      }
    </main>
    
    <app-footer></app-footer>
  `
})
export class ServiceDetailComponent implements OnInit, OnDestroy {
  service = signal<ServiceData | null>(null);

  private route = inject(ActivatedRoute);
  private ctx!: gsap.Context;

  constructor() {
    afterNextRender(() => {
      this.ctx = gsap.context(() => {
        gsap.from('.service-anim', {
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
            gsap.to(btn, { scale: 1.05, duration: 0.3, ease: 'power2.out', boxShadow: '0 0 30px rgba(108,140,255,0.6)' });
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
      if (id && SERVICES[id]) {
        this.service.set(SERVICES[id]);
      } else {
        this.service.set(null);
      }
    });
  }

  ngOnDestroy() {
    if (this.ctx) {
      this.ctx.revert();
    }
  }
}
