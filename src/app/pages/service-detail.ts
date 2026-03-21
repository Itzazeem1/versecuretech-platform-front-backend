import { Component, OnInit, signal, afterNextRender, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, ParamMap } from '@angular/router';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import gsap from 'gsap';

interface ServiceData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: string;
  image: string;
}

const SERVICES: Record<string, ServiceData> = {
  'web-development': {
    id: 'web-development',
    title: 'Web Development',
    subtitle: 'High-Performance Web Applications',
    description: 'We build cinematic, high-performance web applications using modern frameworks like Angular, React, and Next.js. Our focus is on pixel-perfect design, robust engineering, and seamless user experiences that convert visitors into customers.',
    features: ['Custom Web Applications', 'E-commerce Solutions', 'Progressive Web Apps (PWA)', 'API Development & Integration', 'Performance Optimization'],
    icon: 'code',
    image: 'https://picsum.photos/seed/webdev/1920/1080?grayscale&blur=2'
  },
  'app-development': {
    id: 'app-development',
    title: 'App Development',
    subtitle: 'Native & Cross-Platform Mobile Apps',
    description: 'Transform your ideas into powerful mobile experiences. We develop native and cross-platform applications for iOS and Android that are intuitive, scalable, and designed to engage your audience on the go.',
    features: ['iOS & Android Development', 'React Native & Flutter', 'UI/UX Mobile Design', 'App Store Optimization (ASO)', 'Backend Integration'],
    icon: 'smartphone',
    image: 'https://picsum.photos/seed/appdev/1920/1080?grayscale&blur=2'
  },
  'cyber-security': {
    id: 'cyber-security',
    title: 'Cyber Security',
    subtitle: 'Military-Grade Digital Protection',
    description: 'Bulletproof your digital assets with our comprehensive cyber security services. We identify vulnerabilities, implement secure architectures, and provide ongoing monitoring to protect your business from evolving threats.',
    features: ['Penetration Testing', 'Security Audits', 'Data Encryption', 'Incident Response', 'Compliance Consulting'],
    icon: 'security',
    image: 'https://picsum.photos/seed/cyber/1920/1080?grayscale&blur=2'
  },
  'seo-optimization': {
    id: 'seo-optimization',
    title: 'SEO Optimization',
    subtitle: 'Data-Driven Search Dominance',
    description: 'Dominate search rankings and drive organic traffic with our data-driven SEO strategies. We combine technical excellence, content optimization, and authoritative link building to ensure your brand is found by the right audience.',
    features: ['Technical SEO Audits', 'Keyword Research & Strategy', 'On-Page Optimization', 'Content Marketing', 'Local SEO'],
    icon: 'trending_up',
    image: 'https://picsum.photos/seed/seo/1920/1080?grayscale&blur=2'
  }
};

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterLink],
  template: `
    <app-header></app-header>
    
    <main class="min-h-screen pt-40 pb-20 relative overflow-hidden text-[var(--text-primary)]">
      @if (service()) {
        
        <div class="max-w-6xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <div class="mb-8 inline-flex items-center justify-center gap-3 text-[var(--text-muted)] font-mono text-sm tracking-[0.2em] uppercase service-anim">
            <span class="material-icons opacity-70">{{ service()?.icon }}</span>
            <span>01 / Service Intelligence</span>
          </div>
          
          <h1 class="huge-text font-display font-bold tracking-tight mb-8 service-anim">
            {{ service()?.title }}
          </h1>
          
          <p class="subtitle-text mb-20 max-w-3xl service-anim">
            {{ service()?.subtitle }}
          </p>
          
          <!-- Asymmetric Detail layout without images -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-16 mt-12 w-full text-left">
            <div class="md:col-span-5 md:offset-y-12 service-anim">
              <h2 class="text-3xl font-display font-medium mb-6">Overview</h2>
              <p class="text-[var(--text-muted)] text-lg leading-relaxed font-light">
                {{ service()?.description }}
              </p>
              
              <div class="mt-16">
                <a routerLink="/contact" class="tesla-btn inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] font-bold tracking-widest uppercase text-sm">
                  Start Project <span class="material-icons">east</span>
                </a>
              </div>
            </div>
            
            <div class="md:col-span-6 md:col-start-7 service-anim">
              <div class="glass-panel p-10 md:p-16 rounded-[2rem] glow-hover">
                <h2 class="text-2xl font-display font-medium mb-10 text-[var(--accent-main)]">Key Capabilities</h2>
                <ul class="space-y-6">
                  @for (feature of service()?.features; track feature) {
                    <li class="flex items-start gap-4 text-[var(--text-muted)] text-lg border-b border-[var(--text-primary)]/5 pb-6">
                      <span class="material-icons text-[var(--accent-main)] mt-1 opacity-70">noise_control_off</span>
                      <span class="font-light">{{ feature }}</span>
                    </li>
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center justify-center min-h-[50vh]">
          <h1 class="text-4xl font-display font-bold mb-4">Service Not Found</h1>
          <a routerLink="/services" class="text-[var(--accent-main)] hover:text-[var(--text-primary)] transition-colors tracking-widest uppercase text-sm">Back to Array</a>
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
        buttons.forEach((btn: any) => {
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
