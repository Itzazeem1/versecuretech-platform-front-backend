import { Component, ElementRef, afterNextRender, viewChild, signal, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import { ThreeBackgroundComponent } from '../components/three-bg';
import { TranslatePipe } from '../pipes/translate.pipe';
import { StoreService } from '../services/store.service';
import { SupabaseService } from '../services/supabase.service';
import { ActivatedRoute } from '@angular/router';
import gsap from 'gsap';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, HeaderComponent, FooterComponent, ThreeBackgroundComponent, FormsModule, TranslatePipe],
  template: `
    <app-three-bg></app-three-bg>
    <app-header></app-header>
    
    <main class="relative z-10 pt-40 pb-32 min-h-screen text-[var(--text-primary)]">
      <div class="max-w-6xl mx-auto px-6">
        
        <!-- Hero Section -->
        <div class="mb-24 md:mb-40" #heroSection>
          <h1 class="huge-text font-display font-bold leading-tight tracking-tight mb-8">
            <div class="overflow-hidden"><span class="block hero-line pb-2">{{ 'CONTACT.HERO_LINE1' | translate }}</span></div>
            <div class="overflow-hidden"><span class="block hero-line pb-2">{{ 'CONTACT.HERO_LINE2' | translate }}</span></div>
          </h1>
          <p class="subtitle-text hero-fade">
            {{ 'CONTACT.HERO_SUBTITLE' | translate }}
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">
          
          <!-- Contact Info (Asymmetric spacing) -->
          <div class="lg:col-span-4 flex flex-col justify-start mt-8" #contactInfo>
            <div class="space-y-16">
              <div class="info-block">
                <h4 class="text-xs uppercase tracking-widest font-mono text-[var(--text-muted)] mb-4 font-semibold">{{ 'CONTACT.TRANSMISSION' | translate }}</h4>
                <a href="mailto:hello@versecuretech.com" class="text-xl md:text-2xl font-light hover:text-[var(--accent-main)] transition-colors duration-300 relative group inline-block">
                  hello&#64;versecuretech.com
                  <span class="absolute -bottom-2 left-0 w-0 h-[1px] bg-[var(--accent-main)] transition-all duration-300 group-hover:w-full opacity-50"></span>
                </a>
              </div>
              
            </div>
          </div>
          
          <!-- Contact Form (Glassmorphism & Glow) -->
          <div class="lg:col-span-7 lg:col-start-6" #contactForm>
            <div class="glass-panel p-10 md:p-16 rounded-[2rem] border border-[var(--text-primary)]/5 relative overflow-hidden glow-hover">
              <div class="absolute -top-32 -right-32 w-96 h-96 bg-[var(--accent-main)] rounded-full blur-[140px] opacity-10 pointer-events-none"></div>
              
              <h3 class="text-3xl md:text-4xl font-display font-medium mb-12">{{ 'CONTACT.INITIATE_PROTOCOL' | translate }}</h3>
              
              @if (submitStatus() === 'success') {
                <div class="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center relative z-10 flex flex-col items-center">
                  <span class="material-icons text-[var(--accent-main)] mb-4 text-4xl opacity-80">check</span>
                  <p class="text-[var(--text-muted)] text-lg mb-6">{{ 'CONTACT.SUCCESS_MSG' | translate }}</p>
                  <button (click)="submitStatus.set('idle')" class="tesla-btn px-8 py-3 rounded-full border border-[var(--text-primary)]/20 hover:bg-[var(--text-primary)] hover:text-[var(--bg-main)] transition-colors font-mono text-xs uppercase tracking-widest">{{ 'CONTACT.ACKNOWLEDGE' | translate }}</button>
                </div>
              } @else {
                <form (submit)="submitContact($event)" class="relative z-10 flex flex-col gap-8" novalidate>
                  <p class="text-[var(--text-muted)] text-xs font-mono tracking-wide -mt-4 mb-2">
                    <span class="text-[var(--accent-main)]">*</span> {{ 'CONTACT.REQUIRED_HINT' | translate }}
                  </p>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div class="flex flex-col gap-2 relative">
                        <label for="firstName" class="font-mono text-[var(--text-muted)] text-xs uppercase tracking-widest">
                          {{ 'CONTACT.ID_FIRST' | translate }} <span class="text-[var(--accent-main)]" aria-hidden="true">*</span>
                        </label>
                        <input id="firstName" type="text" name="firstName" required autocomplete="given-name"
                          [class.border-red-400/60]="showErrors() && fieldErrors()['firstName']"
                          class="w-full bg-[var(--text-primary)]/5 border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)]/50 transition-colors">
                        @if (showErrors() && fieldErrors()['firstName']) {
                          <span class="text-red-400 text-[11px] font-mono">{{ 'CONTACT.FIELD_REQUIRED' | translate }}</span>
                        }
                     </div>
                     <div class="flex flex-col gap-2 relative">
                        <label for="lastName" class="font-mono text-[var(--text-muted)] text-xs uppercase tracking-widest">
                          {{ 'CONTACT.ID_LAST' | translate }} <span class="text-[var(--accent-main)]" aria-hidden="true">*</span>
                        </label>
                        <input id="lastName" type="text" name="lastName" required autocomplete="family-name"
                          [class.border-red-400/60]="showErrors() && fieldErrors()['lastName']"
                          class="w-full bg-[var(--text-primary)]/5 border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)]/50 transition-colors">
                        @if (showErrors() && fieldErrors()['lastName']) {
                          <span class="text-red-400 text-[11px] font-mono">{{ 'CONTACT.FIELD_REQUIRED' | translate }}</span>
                        }
                     </div>
                  </div>
                  
                  <div class="flex flex-col gap-2 relative">
                     <label for="email" class="font-mono text-[var(--text-muted)] text-xs uppercase tracking-widest">
                       {{ 'CONTACT.RETURN_ADDR' | translate }} <span class="text-[var(--accent-main)]" aria-hidden="true">*</span>
                     </label>
                     <input id="email" type="email" name="email" required autocomplete="email"
                       [class.border-red-400/60]="showErrors() && fieldErrors()['email']"
                       class="w-full bg-[var(--text-primary)]/5 border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)]/50 transition-colors">
                     @if (showErrors() && fieldErrors()['email']) {
                       <span class="text-red-400 text-[11px] font-mono">{{ fieldErrors()['email'] === 'invalid' ? ('CONTACT.EMAIL_INVALID' | translate) : ('CONTACT.FIELD_REQUIRED' | translate) }}</span>
                     }
                  </div>
                  
                  <div class="flex flex-col gap-2 relative">
                     <label for="service" class="font-mono text-[var(--text-muted)] text-xs uppercase tracking-widest">
                       {{ 'CONTACT.SERVICE_REQUIRED' | translate }} <span class="text-[var(--accent-main)]" aria-hidden="true">*</span>
                     </label>
                     <select id="service" name="service" required [value]="preselectedService()"
                       [class.border-red-400/60]="showErrors() && fieldErrors()['service']"
                       class="w-full bg-[var(--text-primary)]/5 border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)]/50 transition-colors appearance-none">
                        <option value="" disabled [selected]="!preselectedService()" class="text-gray-500">{{ 'CONTACT.SELECT_SERVICE' | translate }}</option>
                        <option value="Web Development" class="bg-[#0a0a0a]">{{ 'WORK.WEB_DEV' | translate }}</option>
                        <option value="App Development" class="bg-[#0a0a0a]">{{ 'WORK.APP_DEV' | translate }}</option>
                        <option value="Cyber Security" class="bg-[#0a0a0a]">{{ 'WORK.CYBER_SECURITY' | translate }}</option>
                        <option value="SEO Optimization" class="bg-[#0a0a0a]">{{ 'FOOTER.SEO_OPTIMIZATION' | translate }}</option>
                        <option value="Other" class="bg-[#0a0a0a]">Other</option>
                     </select>
                     @if (showErrors() && fieldErrors()['service']) {
                       <span class="text-red-400 text-[11px] font-mono">{{ 'CONTACT.FIELD_REQUIRED' | translate }}</span>
                     }
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div class="flex flex-col gap-2 relative">
                         <label for="company" class="font-mono text-[var(--text-muted)] text-xs uppercase tracking-widest">{{ 'CONTACT.COMPANY' | translate }}</label>
                         <input id="company" type="text" name="company" autocomplete="organization" class="w-full bg-[var(--text-primary)]/5 border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)]/50 transition-colors">
                      </div>
                      <div class="flex flex-col gap-2 relative">
                         <label for="preferredTime" class="font-mono text-[var(--text-muted)] text-xs uppercase tracking-widest">{{ 'CONTACT.TIME' | translate }}</label>
                         <input id="preferredTime" type="text" name="preferredTime" placeholder="e.g. Afternoon, 2PM" class="w-full bg-[var(--text-primary)]/5 border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)]/50 transition-colors">
                      </div>
                  </div>

                  <div class="flex flex-col gap-2 relative">
                     <label for="message" class="font-mono text-[var(--text-muted)] text-xs uppercase tracking-widest">
                       {{ 'CONTACT.MESSAGE' | translate }} <span class="text-[var(--accent-main)]" aria-hidden="true">*</span>
                     </label>
                     <textarea id="message" name="message" rows="4" required
                       [class.border-red-400/60]="showErrors() && fieldErrors()['message']"
                       class="w-full bg-[var(--text-primary)]/5 border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)]/50 transition-colors resize-none"></textarea>
                     @if (showErrors() && fieldErrors()['message']) {
                       <span class="text-red-400 text-[11px] font-mono">{{ 'CONTACT.FIELD_REQUIRED' | translate }}</span>
                     }
                  </div>
                  
                  @if (submitStatus() === 'error') {
                    <p class="text-red-400 text-sm font-light">{{ 'CONTACT.ERROR_MSG' | translate }}</p>
                  }
                  @if (showErrors() && hasFieldErrors()) {
                    <p class="text-red-400 text-sm font-light">{{ 'CONTACT.VALIDATION_MSG' | translate }}</p>
                  }

                  <button type="submit" [disabled]="submitStatus() === 'loading'" class="tesla-btn mt-6 self-start px-12 py-5 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] font-bold text-sm uppercase tracking-widest flex items-center gap-4 group disabled:opacity-50">
                    <span>
                      {{ submitStatus() === 'loading' ? ('CONTACT.ENCRYPTING' | translate) : ('CONTACT.TRANSMIT' | translate) }}
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
  preselectedService = signal<string>('');
  showErrors = signal(false);
  fieldErrors = signal<Record<string, string>>({});

  private ctx!: gsap.Context;
  public store = inject(StoreService);
  public supabase = inject(SupabaseService);
  private route = inject(ActivatedRoute);

  constructor() {
    // Check for pre-selected service from query params
    const serviceParam = this.route.snapshot.queryParamMap.get('service');
    if (serviceParam) {
      this.preselectedService.set(serviceParam);
    }

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

  hasFieldErrors(): boolean {
    return Object.keys(this.fieldErrors()).length > 0;
  }

  private validateForm(form: HTMLFormElement): Record<string, string> {
    const errors: Record<string, string> = {};
    const firstName = ((form.elements.namedItem('firstName') as HTMLInputElement)?.value || '').trim();
    const lastName = ((form.elements.namedItem('lastName') as HTMLInputElement)?.value || '').trim();
    const email = ((form.elements.namedItem('email') as HTMLInputElement)?.value || '').trim();
    const service = ((form.elements.namedItem('service') as HTMLSelectElement)?.value || '').trim();
    const message = ((form.elements.namedItem('message') as HTMLTextAreaElement)?.value || '').trim();

    if (!firstName) errors['firstName'] = 'required';
    if (!lastName) errors['lastName'] = 'required';
    if (!email) {
      errors['email'] = 'required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors['email'] = 'invalid';
    }
    if (!service) errors['service'] = 'required';
    if (!message) errors['message'] = 'required';

    return errors;
  }

  async submitContact(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    const errors = this.validateForm(form);
    this.fieldErrors.set(errors);
    this.showErrors.set(true);

    if (Object.keys(errors).length > 0) {
      const firstInvalid = form.querySelector(
        `[name="${Object.keys(errors)[0]}"]`
      ) as HTMLElement | null;
      firstInvalid?.focus();
      return;
    }

    this.submitStatus.set('loading');

    const formData = {
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value.trim(),
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem('email') as HTMLInputElement).value.trim(),
      service: (form.elements.namedItem('service') as HTMLSelectElement).value.trim(),
      company: (form.elements.namedItem('company') as HTMLInputElement).value.trim(),
      preferredTime: (form.elements.namedItem('preferredTime') as HTMLInputElement).value.trim(),
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value.trim()
    };

    const success = await this.supabase.saveContact(formData);

    if (success) {
      this.submitStatus.set('success');
      this.showErrors.set(false);
      this.fieldErrors.set({});
      form.reset();
    } else {
      this.submitStatus.set('error');
    }
  }
}
