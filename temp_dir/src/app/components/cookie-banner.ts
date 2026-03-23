import { Component, PLATFORM_ID, inject, signal, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!hasResponded()) {
      <div 
        class="fixed bottom-0 left-0 w-full p-6 z-[100] transform translate-y-0 opacity-100 transition-all duration-500 glass-panel border-t border-[var(--text-primary)]/10"
        style="backdrop-filter: blur(20px); background: rgba(7, 11, 20, 0.85);"
      >
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex-1">
            <h3 class="text-[var(--text-primary)] font-display font-bold text-xl mb-2 flex items-center gap-2">
              <span class="material-icons text-[var(--accent-main)]">cookie</span>
              System Cookies Validated
            </h3>
            <p class="text-[var(--text-muted)] text-sm max-w-2xl font-light">
              We utilize essential cookies to ensure peak performance of this cinematic engine. 
              Accept for the optimal interactive experience, or decline non-essential tracking.
            </p>
          </div>
          <div class="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
            <button 
              (click)="decline()" 
              class="flex-1 md:flex-none px-6 py-3 rounded-full border border-[var(--text-primary)]/20 text-[var(--text-muted)] font-mono text-sm hover:bg-[var(--text-primary)]/5 transition-colors"
            >
              DECLINE
            </button>
            <button 
              (click)="accept()" 
              class="flex-1 md:flex-none px-6 py-3 rounded-full bg-[var(--accent-main)] text-[var(--text-primary)] font-mono text-sm shadow-[0_0_20px_rgba(138,108,255,0.4)] hover:bg-[var(--accent-main)] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all font-bold"
            >
              ACCEPT ALL
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class CookieBannerComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  hasResponded = signal(true); // Default true for SSR

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const consent = localStorage.getItem('vt_cookie_consent');
      if (!consent) {
        this.hasResponded.set(false);
      }
    }
  }

  accept() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('vt_cookie_consent', 'accepted');
      this.hasResponded.set(true);
    }
  }

  decline() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('vt_cookie_consent', 'declined');
      this.hasResponded.set(true);
    }
  }
}
