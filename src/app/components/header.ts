import { Component, inject, signal, afterNextRender, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <!-- Top Header Navigation (Instantly Visible & Premium) -->
    <header class="fixed top-0 left-0 w-full z-[100] transition-all duration-300 pointer-events-auto" 
            [class.glass]="scrolled()" 
            [class.border-b]="scrolled()"
            [class.border-[var(--text-primary)]_10]="scrolled()"
            [class.py-4]="scrolled()" 
            [class.py-8]="!scrolled()">
      <div class="max-w-7xl mx-auto px-8 flex justify-between items-center relative">
        
        <!-- Logo -->
        <a routerLink="/" class="text-3xl font-display font-medium tracking-tight text-[var(--text-primary)] flex items-center gap-2 relative z-50">
          Versecure<span class="text-[var(--accent-main)]">.</span>
        </a>
        
        <!-- Desktop Nav -->
        <nav class="hidden md:flex gap-10 items-center h-full relative z-50">
          
          <!-- Services Dropdown Group -->
          <div class="relative group h-full flex items-center" 
               (mouseenter)="dropdownOpen.set(true)" 
               (mouseleave)="dropdownOpen.set(false)">
            
            <a routerLink="/services" routerLinkActive="text-[var(--text-primary)]"
               class="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center gap-1">
              Services <span class="material-icons text-[16px] transition-transform duration-300 group-hover:text-[var(--accent-main)]" [class.rotate-180]="dropdownOpen()">expand_more</span>
            </a>
            
            <!-- Apple/Lando Dropdown Menu -->
            <div class="absolute top-[120%] left-1/2 -translate-x-1/2 w-72 glass p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-400 transform translate-y-4 group-hover:translate-y-0 shadow-[0_20px_40px_rgba(0,0,0,0.4)] rounded-2xl">
               <div class="flex flex-col gap-2">
                 <a routerLink="/services/web-development" class="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--accent-main)]/10 border border-transparent hover:border-[var(--accent-main)]/20 transition-all group/item">
                   <div class="w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/5 flex items-center justify-center text-[var(--accent-main)] transition-colors glow">
                      <span class="material-icons text-[18px]">code</span>
                   </div>
                   <div class="flex flex-col">
                     <span class="text-sm font-bold text-[var(--text-primary)] group-hover/item:text-[var(--accent-main)] transition-colors">Engineering</span>
                     <span class="text-xs text-[var(--text-muted)] font-light mt-0.5">Performance & Scale</span>
                   </div>
                 </a>
                 <a routerLink="/services/cyber-security" class="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--accent-main)]/10 border border-transparent hover:border-[var(--accent-main)]/20 transition-all group/item">
                   <div class="w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/5 flex items-center justify-center text-[var(--accent-main)] transition-colors glow">
                      <span class="material-icons text-[18px]">security</span>
                   </div>
                   <div class="flex flex-col">
                     <span class="text-sm font-bold text-[var(--text-primary)] group-hover/item:text-[var(--accent-main)] transition-colors">Protection</span>
                     <span class="text-xs text-[var(--text-muted)] font-light mt-0.5">Absolute Security</span>
                   </div>
                 </a>
                 <a routerLink="/services/seo-optimization" class="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--accent-main)]/10 border border-transparent hover:border-[var(--accent-main)]/20 transition-all group/item">
                   <div class="w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/5 flex items-center justify-center text-[var(--accent-main)] transition-colors glow">
                      <span class="material-icons text-[18px]">trending_up</span>
                   </div>
                   <div class="flex flex-col">
                     <span class="text-sm font-bold text-[var(--text-primary)] group-hover/item:text-[var(--accent-main)] transition-colors">Growth</span>
                     <span class="text-xs text-[var(--text-muted)] font-light mt-0.5">SEO & Conversions</span>
                   </div>
                 </a>
               </div>
            </div>
          </div>
          
          <a routerLink="/about" routerLinkActive="text-[var(--text-primary)]" class="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent-main)] transition-colors">About</a>
          <a routerLink="/work" routerLinkActive="text-[var(--text-primary)]" class="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent-main)] transition-colors">Work</a>
          
          @if (supabase.isAdmin()) {
            <a routerLink="/admin" class="text-xs font-mono tracking-widest uppercase text-green-400 hover:text-green-300 transition-colors">
              Admin Active
            </a>
            <button type="button" (click)="logout()" class="px-5 py-2 text-xs tracking-widest uppercase font-bold text-[var(--text-primary)] border border-[var(--text-primary)]/20 rounded-full hover:border-[var(--accent-main)] hover:text-[var(--accent-main)] transition-all">
              Logout
            </button>
          } @else {
            <a routerLink="/admin" class="text-xs font-mono tracking-widest uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              Admin Login
            </a>
          }

          <a routerLink="/contact" class="inline-flex items-center justify-center px-8 py-3 text-xs tracking-widest uppercase font-bold text-[var(--bg-main)] bg-[var(--text-primary)] rounded-full hover:scale-105 hover:bg-[var(--text-primary)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all">
             Initialize
          </a>
        </nav>
        
        <!-- Mobile Toggle -->
        <button class="md:hidden text-[var(--text-primary)] relative z-50" (click)="toggleMenu()">
          <span class="material-icons text-3xl">{{ menuOpen() ? 'close' : 'menu' }}</span>
        </button>
      </div>
      
      <!-- Mobile Menu (Full Screen takeover) -->
      @if (menuOpen()) {
        <div class="md:hidden fixed inset-0 w-full h-screen bg-[var(--bg-main)]/95 backdrop-blur-2xl z-40 p-8 flex flex-col justify-center gap-8">
          <div class="flex flex-col gap-8">
            <span class="text-xs font-mono tracking-widest uppercase text-[var(--text-muted)]">Matrix Navigation</span>
            <a routerLink="/" class="text-4xl font-display font-medium text-[var(--text-primary)]" (click)="toggleMenu()">Home</a>
            <a routerLink="/services" class="text-4xl font-display font-medium text-[var(--text-primary)]" (click)="toggleMenu()">Services</a>
            <a routerLink="/about" class="text-4xl font-display font-medium text-[var(--text-primary)]" (click)="toggleMenu()">About</a>
            <a routerLink="/work" class="text-4xl font-display font-medium text-[var(--text-primary)]" (click)="toggleMenu()">Work</a>
            <a routerLink="/admin" class="text-4xl font-display font-medium text-[var(--text-primary)]" (click)="toggleMenu()">Admin</a>
            <a routerLink="/contact" class="text-4xl font-display font-medium text-[var(--accent-main)] mt-4" (click)="toggleMenu()">Initialize Contact</a>
            @if (supabase.isAdmin()) {
              <button type="button" (click)="logout()" class="text-left text-lg font-mono tracking-widest uppercase text-red-300 mt-2">Logout</button>
            }
          </div>
        </div>
      }
    </header>
  `,
  styles: []
})
export class HeaderComponent implements OnDestroy {
  scrolled = signal(false);
  menuOpen = signal(false);
  dropdownOpen = signal(false);
  supabase = inject(SupabaseService);
  
  private scrollListener?: () => void;

  constructor() {
    afterNextRender(() => {
      this.scrollListener = () => {
        this.scrolled.set(window.scrollY > 50);
      };
      // Passive scroll listener for max performance
      window.addEventListener('scroll', this.scrollListener, { passive: true });
    });
  }
  
  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  async logout() {
    await this.supabase.logout();
    this.menuOpen.set(false);
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined' && this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }
}
