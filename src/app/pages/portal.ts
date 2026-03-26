import { Component, inject, afterNextRender, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import gsap from 'gsap';

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    
    <div class="min-h-screen pt-32 pb-20 px-8 relative z-10">
      <div class="max-w-7xl mx-auto">
        
        @if (!supabase.isLoggedIn()) {
          <div class="text-center py-20">
            <span class="material-icons text-6xl text-[var(--accent-main)] mb-6 animate-pulse">lock</span>
            <h2 class="text-3xl font-display font-medium mb-4">Access Restricted</h2>
            <p class="text-[var(--text-muted)] mb-8">Please sign in to access the client portal.</p>
            <button (click)="goToLogin()" class="px-8 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] font-bold text-sm uppercase tracking-widest hover:scale-105 transition-transform">
              Sign In
            </button>
          </div>
        } @else {
          <div class="portal-dashboard opacity-0 translate-y-8">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
              <div>
                <h2 class="text-4xl font-display font-medium mb-2">Welcome Back</h2>
                <p class="text-[var(--text-muted)] text-sm font-mono flex items-center gap-2">
                  <span class="material-icons text-[16px] text-green-400">verified_user</span> 
                  {{ supabase.currentUser()?.email }}
                </p>
              </div>
              <button (click)="logout()" class="px-6 py-2 rounded-full border border-[var(--text-primary)]/20 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-all text-xs uppercase tracking-widest font-mono">
                Sign Out
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <!-- Forge AI Perk -->
              <div class="glass-panel p-8 rounded-[2rem] border border-[var(--accent-main)] hover:shadow-[0_0_40px_rgba(var(--accent-main-rgb),0.2)] transition-all group relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-main)] to-transparent opacity-50"></div>
                <div class="w-12 h-12 rounded-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/5 flex items-center justify-center text-[var(--accent-main)] mb-6 group-hover:scale-110 transition-transform glow">
                  <span class="material-icons">terminal</span>
                </div>
                <h3 class="text-xl font-display font-medium mb-3">Forge AI</h3>
                <p class="text-sm text-[var(--text-muted)]">Access our next-generation AI developer environment for code generation, UI building, and engineering architecture.</p>
                
                <div class="mt-6 pt-6 border-t border-[var(--text-primary)]/10 flex justify-between items-center">
                  @if (supabase.hasForgeAccess()) {
                    <button (click)="goToForge()" class="text-xs font-mono text-[var(--text-primary)] hover:text-[var(--accent-main)] uppercase tracking-widest transition-colors flex items-center gap-1">
                      Launch AI <span class="material-icons text-[14px]">arrow_forward</span>
                    </button>
                    <span class="text-[10px] uppercase tracking-widest text-green-400 border border-green-400/30 px-2 py-1 rounded-full bg-green-400/10">Authorized Access</span>
                  } @else {
                    <div class="flex flex-col gap-4 w-full">
                      <div class="flex justify-between items-center">
                        <span class="text-lg font-display font-medium text-[var(--text-primary)]">$9.99 <span class="text-[10px] text-[var(--text-muted)] uppercase tracking-tighter">One-time</span></span>
                        <span class="text-[10px] uppercase tracking-widest text-[var(--accent-main)] border border-[var(--accent-main)]/30 px-2 py-1 rounded-full bg-[var(--accent-main)]/10">Access Required</span>
                      </div>
                      <div class="flex gap-2">
                        <button (click)="router.navigate(['/contact'])" class="flex-1 text-[10px] py-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-main)] font-bold uppercase tracking-widest hover:scale-105 transition-transform">Buy Access</button>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Perk 1 -->
              <div class="glass-panel p-8 rounded-[2rem] border border-[var(--text-primary)]/10 hover:border-[var(--accent-main)]/50 transition-colors group">
                <div class="w-12 h-12 rounded-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/5 flex items-center justify-center text-[var(--accent-main)] mb-6 group-hover:scale-110 transition-transform">
                  <span class="material-icons">rocket_launch</span>
                </div>
                <h3 class="text-xl font-display font-medium mb-3">Project Tracking</h3>
                <p class="text-sm text-[var(--text-muted)]">View real-time updates on your active development sprints and milestones.</p>
                <div class="mt-6 pt-6 border-t border-[var(--text-primary)]/10">
                  <span class="text-xs font-mono text-[var(--accent-main)] uppercase tracking-widest">0 Active Projects</span>
                </div>
              </div>

              <!-- Perk 2 -->
              <div class="glass-panel p-8 rounded-[2rem] border border-[var(--text-primary)]/10 hover:border-[var(--accent-main)]/50 transition-colors group">
                <div class="w-12 h-12 rounded-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/5 flex items-center justify-center text-[var(--accent-main)] mb-6 group-hover:scale-110 transition-transform">
                  <span class="material-icons">support_agent</span>
                </div>
                <h3 class="text-xl font-display font-medium mb-3">Priority Support</h3>
                <p class="text-sm text-[var(--text-muted)]">As a registered client, your support tickets are automatically routed to our senior engineering team.</p>
                <div class="mt-6 pt-6 border-t border-[var(--text-primary)]/10">
                  <button class="text-xs font-mono text-[var(--text-primary)] hover:text-[var(--accent-main)] uppercase tracking-widest transition-colors flex items-center gap-1">
                    Open Ticket <span class="material-icons text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
        
      </div>
    </div>
    
    <app-footer></app-footer>
  `
})
export class PortalComponent {
  public supabase = inject(SupabaseService);
  public router = inject(Router);

  constructor() {
    afterNextRender(() => {
      this.supabase.checkSession();
      if (this.supabase.isLoggedIn()) {
        this.animateDashboard();
      }
    });

    effect(() => {
      if (this.supabase.isLoggedIn()) {
        // Use setTimeout to ensure DOM is updated before animating
        setTimeout(() => this.animateDashboard(), 50);
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToForge() {
    this.router.navigate(['/forge']);
  }

  async logout() {
    await this.supabase.logout();
    this.router.navigate(['/login']);
  }

  private animateDashboard() {
    gsap.to('.portal-dashboard', { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
  }
}
