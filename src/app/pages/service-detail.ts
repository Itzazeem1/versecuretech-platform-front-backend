import { Component, OnInit, signal, afterNextRender, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, ParamMap } from '@angular/router';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import { PaymentService, PaymentMethod, PaymentStatus } from '../services/payment.service';
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
    image: ''
  },
  'app-development': {
    id: 'app-development',
    title: 'App Development',
    subtitle: 'Native & Cross-Platform Mobile Apps',
    description: 'Transform your ideas into powerful mobile experiences. We develop native and cross-platform applications for iOS and Android that are intuitive, scalable, and designed to engage your audience on the go.',
    features: ['iOS & Android Development', 'React Native & Flutter', 'UI/UX Mobile Design', 'App Store Optimization (ASO)', 'Backend Integration'],
    icon: 'smartphone',
    image: ''
  },
  'cyber-security': {
    id: 'cyber-security',
    title: 'Cyber Security',
    subtitle: 'Military-Grade Digital Protection',
    description: 'Bulletproof your digital assets with our comprehensive cyber security services. We identify vulnerabilities, implement secure architectures, and provide ongoing monitoring to protect your business from evolving threats.',
    features: ['Penetration Testing', 'Security Audits', 'Data Encryption', 'Incident Response', 'Compliance Consulting'],
    icon: 'security',
    image: ''
  },
  'seo-optimization': {
    id: 'seo-optimization',
    title: 'SEO Optimization',
    subtitle: 'Data-Driven Search Dominance',
    description: 'Dominate search rankings and drive organic traffic with our data-driven SEO strategies. We combine technical excellence, content optimization, and authoritative link building to ensure your brand is found by the right audience.',
    features: ['Technical SEO Audits', 'Keyword Research & Strategy', 'On-Page Optimization', 'Content Marketing', 'Local SEO'],
    icon: 'trending_up',
    image: ''
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
              
              <div class="mt-16 flex gap-4">
                <button (click)="openPaymentModal()" class="tesla-btn inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] font-bold tracking-widest uppercase text-sm hover:bg-[var(--accent-main)] transition-colors">
                  Start Project <span class="material-icons">east</span>
                </button>
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

        <!-- Payment Modal -->
        @if (showPaymentModal()) {
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div class="w-full max-w-md glass-panel p-8 rounded-[2rem] border border-[var(--text-primary)]/10 relative overflow-hidden">
              <button (click)="closePaymentModal()" class="absolute top-6 right-6 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                <span class="material-icons">close</span>
              </button>
              
              <h2 class="text-2xl font-display font-medium mb-2">Complete Payment</h2>
              <p class="text-[var(--text-muted)] text-sm mb-8">Select your preferred local payment method.</p>
              
              @if (paymentStatus() === 'idle') {
                <div class="space-y-4">
                  <button (click)="processPayment('jazzcash')" class="w-full p-4 rounded-xl border border-[var(--text-primary)]/10 hover:border-[var(--accent-main)] hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-between group">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold">JC</div>
                      <div class="text-left">
                        <div class="font-medium text-[var(--text-primary)]">JazzCash</div>
                        <div class="text-xs text-[var(--text-muted)]">Pay via mobile wallet</div>
                      </div>
                    </div>
                    <span class="material-icons text-[var(--text-muted)] group-hover:text-[var(--accent-main)] transition-colors">chevron_right</span>
                  </button>

                  <button (click)="processPayment('easypaisa')" class="w-full p-4 rounded-xl border border-[var(--text-primary)]/10 hover:border-[var(--accent-main)] hover:bg-[var(--bg-secondary)] transition-all flex items-center justify-between group">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold">EP</div>
                      <div class="text-left">
                        <div class="font-medium text-[var(--text-primary)]">Easypaisa</div>
                        <div class="text-xs text-[var(--text-muted)]">Pay via mobile wallet</div>
                      </div>
                    </div>
                    <span class="material-icons text-[var(--text-muted)] group-hover:text-[var(--accent-main)] transition-colors">chevron_right</span>
                  </button>
                </div>
              } @else if (paymentStatus() === 'processing') {
                <div class="flex flex-col items-center justify-center py-12">
                  <div class="w-16 h-16 border-4 border-[var(--text-primary)]/10 border-t-[var(--accent-main)] rounded-full animate-spin mb-6"></div>
                  <p class="text-[var(--text-primary)] font-medium animate-pulse">Processing Payment...</p>
                  <p class="text-[var(--text-muted)] text-sm mt-2">Please check your mobile device.</p>
                </div>
              } @else if (paymentStatus() === 'success') {
                <div class="flex flex-col items-center justify-center py-8 text-center">
                  <div class="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                    <span class="material-icons text-4xl text-green-400">check_circle</span>
                  </div>
                  <h3 class="text-2xl font-display font-medium mb-2 text-green-400">Payment Successful!</h3>
                  <p class="text-[var(--text-muted)] mb-8">Your project has been initiated. We will contact you shortly.</p>
                  <button (click)="closePaymentModal()" class="tesla-btn w-full py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] font-bold tracking-widest uppercase text-xs hover:bg-[var(--accent-main)] transition-colors">
                    Continue
                  </button>
                </div>
              } @else if (paymentStatus() === 'failed') {
                <div class="flex flex-col items-center justify-center py-8 text-center">
                  <div class="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                    <span class="material-icons text-4xl text-red-400">error_outline</span>
                  </div>
                  <h3 class="text-2xl font-display font-medium mb-2 text-red-400">Payment Failed</h3>
                  <p class="text-[var(--text-muted)] mb-8">The transaction was declined or timed out. Please try again.</p>
                  <button (click)="retryPayment()" class="tesla-btn w-full py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] font-bold tracking-widest uppercase text-xs hover:bg-[var(--accent-main)] transition-colors">
                    Retry Payment
                  </button>
                </div>
              }
            </div>
          </div>
        }
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
  showPaymentModal = signal(false);
  paymentStatus = signal<PaymentStatus>('idle');

  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);
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

  openPaymentModal() {
    this.showPaymentModal.set(true);
    this.paymentStatus.set('idle');
  }

  closePaymentModal() {
    this.showPaymentModal.set(false);
    this.paymentStatus.set('idle');
  }

  retryPayment() {
    this.paymentStatus.set('idle');
  }

  async processPayment(method: PaymentMethod) {
    this.paymentStatus.set('processing');

    try {
      const response = await this.paymentService.processPayment({
        method,
        amount: 50000, // Example amount
        orderId: `ORD-${Date.now()}`
      });

      if (response.success) {
        this.paymentStatus.set('success');
      } else {
        this.paymentStatus.set('failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      this.paymentStatus.set('failed');
    }
  }

  ngOnDestroy() {
    if (this.ctx) {
      this.ctx.revert();
    }
  }
}
