import { Component, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import gsap from 'gsap';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    
    <div class="min-h-screen pt-32 pb-20 px-8 relative z-10">
      <div class="max-w-7xl mx-auto">
        
        <div class="text-center mb-20 pricing-intro opacity-0 translate-y-8">
          <span class="text-xs font-mono tracking-widest uppercase text-[var(--accent-main)] mb-4 block">Forge AI</span>
          <h1 class="text-5xl md:text-7xl font-display font-medium tracking-tight mb-6">
            Intelligence at <br />
            <span class="text-[var(--text-muted)]">your fingertips.</span>
          </h1>
          <p class="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Unlock the full potential of Forge AI. Choose the plan that fits your engineering and security needs.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto pricing-cards opacity-0 translate-y-8">
          
          <!-- Basic Plan -->
          <div class="glass-panel p-10 rounded-[2rem] border border-[var(--text-primary)]/10 flex flex-col relative overflow-hidden group hover:border-[var(--text-primary)]/30 transition-all duration-500">
            <div class="mb-8">
              <h3 class="text-2xl font-display font-medium mb-2">Basic</h3>
              <p class="text-sm text-[var(--text-muted)]">Perfect for exploring our public services.</p>
            </div>
            <div class="mb-8">
              <span class="text-5xl font-display font-medium">$0</span>
            </div>
            
            <ul class="space-y-4 mb-10 flex-1">
              <li class="flex items-center gap-3 text-sm">
                <span class="material-icons text-[16px] text-green-400">check_circle</span>
                Public Service Access
              </li>
              <li class="flex items-center gap-3 text-sm">
                <span class="material-icons text-[16px] text-green-400">check_circle</span>
                Standard Support
              </li>
              <li class="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                <span class="material-icons text-[16px]">remove_circle_outline</span>
                No Forge AI Access
              </li>
            </ul>
            
            <a routerLink="/login" class="w-full py-4 rounded-xl border border-[var(--text-primary)]/20 text-center font-bold text-xs uppercase tracking-widest hover:bg-[var(--text-primary)]/5 transition-colors">
              Get Started
            </a>
          </div>

          <!-- Forge AI Plan (Featured) -->
          <div class="glass-panel p-10 rounded-[2rem] border border-[var(--accent-main)] relative overflow-hidden group transform md:-translate-y-4 shadow-[0_20px_40px_rgba(var(--accent-main-rgb),0.2)]">
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-main)] to-transparent opacity-50"></div>
            <div class="absolute top-4 right-4 bg-[var(--accent-main)]/10 text-[var(--accent-main)] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-[var(--accent-main)]/20">
              Most Popular
            </div>
            
            <div class="mb-8">
              <h3 class="text-2xl font-display font-medium mb-2">Forge AI Bundle</h3>
              <p class="text-sm text-[var(--text-muted)]">Next-gen AI engineering environment.</p>
            </div>
            <div class="mb-8">
              <span class="text-5xl font-display font-medium">$9.99</span>
              <span class="text-[var(--text-muted)]">/one-time</span>
            </div>
            
            <ul class="space-y-4 mb-10 flex-1">
              <li class="flex items-center gap-3 text-sm">
                <span class="material-icons text-[16px] text-green-400">check_circle</span>
                Lifetime Forge AI Access
              </li>
              <li class="flex items-center gap-3 text-sm">
                <span class="material-icons text-[16px] text-green-400">check_circle</span>
                Advanced AI Code Generation
              </li>
              <li class="flex items-center gap-3 text-sm">
                <span class="material-icons text-[16px] text-green-400">check_circle</span>
                Engineering Architecture Tools
              </li>
              <li class="flex items-center gap-3 text-sm">
                <span class="material-icons text-[16px] text-green-400">check_circle</span>
                Zero Monthly Subscription
              </li>
            </ul>
            
            <a routerLink="/login" class="w-full py-4 rounded-xl bg-[var(--text-primary)] text-[var(--bg-main)] text-center font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform inline-block">
              Buy Lifetime Access
            </a>
          </div>

          <!-- Enterprise Plan -->
          <div class="glass-panel p-10 rounded-[2rem] border border-[var(--text-primary)]/10 flex flex-col relative overflow-hidden group hover:border-[var(--text-primary)]/30 transition-all duration-500 opacity-80">
            <div class="absolute top-4 right-4 bg-[var(--text-primary)]/10 text-[var(--text-primary)] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-[var(--text-primary)]/20">
              Coming Soon
            </div>
            <div class="mb-8">
              <h3 class="text-2xl font-display font-medium mb-2">Enterprise</h3>
              <p class="text-sm text-[var(--text-muted)]">Custom solutions for large organizations.</p>
            </div>
            <div class="mb-8">
              <span class="text-5xl font-display font-medium">Custom</span>
            </div>
            
            <ul class="space-y-4 mb-10 flex-1">
              <li class="flex items-center gap-3 text-sm">
                <span class="material-icons text-[16px] text-[var(--text-muted)]">check_circle</span>
                Everything in Pro
              </li>
              <li class="flex items-center gap-3 text-sm">
                <span class="material-icons text-[16px] text-[var(--text-muted)]">check_circle</span>
                Dedicated Account Manager
              </li>
              <li class="flex items-center gap-3 text-sm">
                <span class="material-icons text-[16px] text-[var(--text-muted)]">check_circle</span>
                Custom API Integrations
              </li>
              <li class="flex items-center gap-3 text-sm">
                <span class="material-icons text-[16px] text-[var(--text-muted)]">check_circle</span>
                Enterprise-grade security & compliance
              </li>
              <li class="flex items-center gap-3 text-sm">
                <span class="material-icons text-[16px] text-[var(--text-muted)]">check_circle</span>
                SLA guarantees
              </li>
            </ul>
            
            <button disabled class="w-full py-4 rounded-xl border border-[var(--text-primary)]/20 text-center font-bold text-xs uppercase tracking-widest bg-[var(--text-primary)]/5 text-[var(--text-muted)] cursor-not-allowed">
              Coming Soon
            </button>
          </div>

        </div>
        
      </div>
    </div>
    
    <app-footer></app-footer>
  `
})
export class PricingComponent {
  constructor() {
    afterNextRender(() => {
      gsap.to('.pricing-intro', { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
      gsap.to('.pricing-cards', { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 });
    });
  }
}
