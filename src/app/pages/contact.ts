import { Component, ElementRef, afterNextRender, viewChild, signal, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import { ThreeBackgroundComponent } from '../components/three-bg';
import { StoreService } from '../services/store.service';
import gsap from 'gsap';

@Component({
  selector: 'app-contact',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, HeaderComponent, FooterComponent, ThreeBackgroundComponent],
  template: `
    <app-three-bg></app-three-bg>
    <app-header></app-header>
    
    <main class="relative z-10 pt-40 pb-32 min-h-screen text-[var(--text-primary)]">
      <div class="max-w-6xl mx-auto px-6">
        
        <!-- Hero Section -->
        <div class="mb-24 md:mb-40" #heroSection>
          <h1 class="huge-text font-display font-bold leading-tight tracking-tight mb-8">
            <div class="overflow-hidden"><span class="block hero-line pb-2">Establish</span></div>
            <div class="overflow-hidden"><span class="block hero-line pb-2">Connection.</span></div>
          </h1>
          <p class="subtitle-text hero-fade">
            We operate seamlessly alongside ambitious organizations to deploy uncompromising digital experiences. 
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">
          
          <!-- Contact Info (Asymmetric spacing) -->
          <div class="lg:col-span-4 flex flex-col justify-start mt-8" #contactInfo>
            <div class="space-y-16">
              <div class="info-block">
                <h4 class="text-xs uppercase tracking-widest font-mono text-[var(--text-muted)] mb-4 font-semibold">Transmission</h4>
                <a href="mailto:hello.versecure@gmail.com" class="text-xl md:text-2xl font-light hover:text-[var(--accent-main)] transition-colors duration-300 relative group inline-block">
                  hello.versecure&#64;gmail.com
                  <span class="absolute -bottom-2 left-0 w-0 h-[1px] bg-[var(--accent-main)] transition-all duration-300 group-hover:w-full opacity-50"></span>
                </a>
              </div>
              
              <div class="info-block">
                <h4 class="text-xs uppercase tracking-widest font-mono text-[var(--text-muted)] mb-4 font-semibold">Coordinates</h4>
                <p class="text-xl md:text-2xl font-light leading-relaxed">
                  Innovation Complex<br/>
                  Sector 4<br/>
                  San Francisco, CA
                </p>
              </div>
            </div>
          </div>
          
          <!-- Contact Form (Glassmorphism & Glow) -->
          <div class="lg:col-span-7 lg:col-start-6" #contactForm>
            <div class="glass-panel p-10 md:p-16 rounded-[2rem] border border-[var(--text-primary)]/5 relative overflow-hidden glow-hover">
              <div class="absolute -top-32 -right-32 w-96 h-96 bg-[var(--accent-main)] rounded-full blur-[140px] opacity-10 pointer-events-none"></div>
              
              <h3 class="text-3xl md:text-4xl font-display font-medium mb-12">Initialize Protocol</h3>
              
              @if (submitStatus() === 'success') {
                <div class="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center relative z-10 flex flex-col items-center">
                  <span class="material-icons text-[var(--accent-main)] mb-4 text-4xl opacity-80">check</span>
                  <p class="text-[var(--text-muted)] text-lg mb-6">Transmission received. We will respond momentarily.</p>
                  <button (click)="submitStatus.set('idle')" class="tesla-btn px-8 py-3 rounded-full border border-[var(--text-primary)]/20 hover:bg-[var(--text-primary)] hover:text-[var(--bg-main)] transition-colors font-mono text-xs uppercase tracking-widest">Acknowledge</button>
                </div>
              } @else {
                    <form (submit)="submitContact($event)" class="relative z-10 flex flex-col gap-8">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div class="flex flex-col gap-2 relative">
                        <label for="firstName" class="font-mono text-[var(--text-muted)] text-xs uppercase tracking-widest">Identifier [First]</label>
                        <input id="firstName" type="text" name="firstName" required class="w-full bg-[var(--text-primary)]/5 border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)]/50 transition-colors">
                     </div>
                     <div class="flex flex-col gap-2 relative">
                        <label for="lastName" class="font-mono text-[var(--text-muted)] text-xs uppercase tracking-widest">Identifier [Last]</label>
                        <input id="lastName" type="text" name="lastName" required class="w-full bg-[var(--text-primary)]/5 border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)]/50 transition-colors">
                     </div>
                  </div>
                  
                  <div class="flex flex-col gap-2 relative">
                     <label for="email" class="font-mono text-[var(--text-muted)] text-xs uppercase tracking-widest">Return Address [Email]</label>
                     <input id="email" type="email" name="email" required class="w-full bg-[var(--text-primary)]/5 border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)]/50 transition-colors">
                  </div>
                  
                  <div class="flex flex-col gap-2 relative">
                     <label for="service" class="font-mono text-[var(--text-muted)] text-xs uppercase tracking-widest">Service Required</label>
                     <select id="service" name="service" required class="w-full bg-[var(--text-primary)]/5 border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)]/50 transition-colors appearance-none">
                        <option value="" disabled selected class="text-gray-500">Select a service...</option>
                        <option value="Web Architecture" class="bg-[#0a0a0a]">Web Architecture</option>
                        <option value="System Integration" class="bg-[#0a0a0a]">System Integration</option>
                        <option value="Security Audit" class="bg-[#0a0a0a]">Security Audit</option>
                        <option value="Other" class="bg-[#0a0a0a]">Other</option>
                     </select>
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div class="flex flex-col gap-2 relative">
                         <label for="company" class="font-mono text-[var(--text-muted)] text-xs uppercase tracking-widest">Company [Organization]</label>
                         <input id="company" type="text" name="company" class="w-full bg-[var(--text-primary)]/5 border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)]/50 transition-colors">
                      </div>
                      <div class="flex flex-col gap-2 relative">
                         <label for="preferredTime" class="font-mono text-[var(--text-muted)] text-xs uppercase tracking-widest">Preferred Transmission Time</label>
                         <input id="preferredTime" type="text" name="preferredTime" placeholder="e.g. Afternoon, 2PM" class="w-full bg-[var(--text-primary)]/5 border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)]/50 transition-colors">
                      </div>
                  </div>

                  <div class="flex flex-col gap-2 relative">
                     <label for="message" class="font-mono text-[var(--text-muted)] text-xs uppercase tracking-widest">Payload [Message]</label>
                     <textarea id="message" name="message" rows="4" required class="w-full bg-[var(--text-primary)]/5 border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)]/50 transition-colors resize-none"></textarea>
                  </div>
                  
                  @if (submitStatus() === 'error') {
                    <p class="text-red-400 text-sm font-light">Transmission failed. Verify connection.</p>
                  }

                  <button type="submit" [disabled]="submitStatus() === 'loading'" class="tesla-btn mt-6 self-start px-12 py-5 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] font-bold text-sm uppercase tracking-widest flex items-center gap-4 group disabled:opacity-50">
                    <span>
                      {{ submitStatus() === 'loading' ? 'Encrypting...' : 'Transmit' }}
                    </span>
                    @if (submitStatus() !== 'loading') {
                      <span class="material-icons text-sm group-hover:translate-x-1 transition-transform">east</span>
                    }
                  </button>
                </form>
              }
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <app-footer></app-footer>
  `
})
export class ContactComponent implements OnDestroy {
  heroSection = viewChild<ElementRef>('heroSection');
  contactInfo = viewChild<ElementRef>('contactInfo');
  contactForm = viewChild<ElementRef>('contactForm');
  
  submitStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');

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
      
      const heroEl = this.heroSection()?.nativeElement;
      const infoEl = this.contactInfo()?.nativeElement;
      const formEl = this.contactForm()?.nativeElement;

      if (heroEl) {
        const lines = heroEl.querySelectorAll('.hero-line');
        const fade = heroEl.querySelector('.hero-fade');

        gsap.from(lines, {
          y: 100,
          opacity: 0,
          duration: 1.2 / speed,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.2
        });

        gsap.from(fade, {
          opacity: 0,
          y: 30,
          duration: 1 / speed,
          ease: 'power3.out',
          delay: 0.6 / speed
        });
      }

      if (infoEl) {
        gsap.from(infoEl.querySelectorAll('.info-block'), {
          y: 80,
          opacity: 0,
          duration: 1.2 / speed,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: infoEl, start: 'top 85%' }
        });
      }

      if (formEl) {
        gsap.from(formEl, {
          y: 80,
          opacity: 0,
          duration: 1.2 / speed,
          ease: 'power3.out',
          scrollTrigger: { trigger: formEl, start: 'top 85%' }
        });
      }

      // Tesla btn
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

  async submitContact(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    
    this.submitStatus.set('loading');
    
    try {
      const firstName = (form.elements.namedItem('firstName') as HTMLInputElement).value;
      const lastName = (form.elements.namedItem('lastName') as HTMLInputElement).value;
      const email = (form.elements.namedItem('email') as HTMLInputElement).value;
      const service = (form.elements.namedItem('service') as HTMLSelectElement).value;
      const company = (form.elements.namedItem('company') as HTMLInputElement).value;
      const preferredTime = (form.elements.namedItem('preferredTime') as HTMLInputElement).value;
      const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          service,
          company,
          preferredTime,
          message
        })
      });

      if (!response.ok) throw new Error('Backend transmission failed');

      this.submitStatus.set('success');
      form.reset();
    } catch (error) {
      console.error('Contact Error:', error);
      this.submitStatus.set('error');
    }
  }
}
