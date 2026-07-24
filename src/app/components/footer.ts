import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    <footer class="relative bg-[var(--bg-secondary)] py-20 overflow-hidden border-t border-[var(--text-primary)]/5">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent-main-glow),transparent_70%)] opacity-20"></div>
      
      <div class="max-w-7xl mx-auto px-6 relative z-10">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div class="col-span-1 md:col-span-2">
            <h2 class="text-4xl font-display font-bold text-[var(--text-primary)] mb-6">{{ 'FOOTER.TITLE' | translate }} <br><span class="text-[var(--accent-main)]">{{ 'FOOTER.TITLE_HIGHLIGHT' | translate }}</span></h2>
            <p class="text-[var(--text-muted)] max-w-sm mb-8">{{ 'FOOTER.DESCRIPTION' | translate }}</p>
            <a href="mailto:hello@versecuretech.com" class="inline-flex items-center gap-2 text-[var(--text-primary)] font-medium hover:text-[var(--accent-main)] transition-colors">
              <span class="material-icons">email</span> hello&#64;versecuretech.com
            </a>
          </div>
          
          <div>
            <h3 class="text-lg font-display font-semibold text-[var(--text-primary)] mb-6">{{ 'FOOTER.SERVICES' | translate }}</h3>
            <ul class="space-y-4 text-[var(--text-muted)]">
              <li><a routerLink="/services/cyber-security" class="hover:text-[var(--text-primary)] transition-colors">{{ 'FOOTER.CYBER_SECURITY' | translate }}</a></li>
              <li><a routerLink="/services/web-development" class="hover:text-[var(--text-primary)] transition-colors">{{ 'FOOTER.WEB_DEVELOPMENT' | translate }}</a></li>
              <li><a routerLink="/services/app-development" class="hover:text-[var(--text-primary)] transition-colors">{{ 'FOOTER.APP_DEVELOPMENT' | translate }}</a></li>
              <li><a routerLink="/services/seo-optimization" class="hover:text-[var(--text-primary)] transition-colors">{{ 'FOOTER.SEO_OPTIMIZATION' | translate }}</a></li>
            </ul>
          </div>
          
          <div>
            <h3 class="text-lg font-display font-semibold text-[var(--text-primary)] mb-6">{{ 'FOOTER.CONNECT' | translate }}</h3>
            <ul class="space-y-4 text-[var(--text-muted)]">
              <li><a href="https://www.instagram.com/hello.versecure?igsh=M2Ewajc3ZWdzOXZn" target="_blank" rel="noopener noreferrer" class="hover:text-[var(--text-primary)] transition-colors">{{ 'FOOTER.INSTAGRAM' | translate }}</a></li>
              <li><a routerLink="/portal" class="hover:text-[var(--accent-main)] transition-colors">{{ 'FOOTER.CLIENT_PORTAL' | translate }}</a></li>
            </ul>
          </div>
        </div>
        
        <div class="mt-20 pt-8 border-t border-[var(--text-primary)]/10 flex flex-col md:flex-row justify-between items-center text-sm text-[var(--text-muted)]">
          <p>&copy; {{ year }} VersecureTech. {{ 'FOOTER.COPYRIGHT' | translate }}</p>
          <div class="flex flex-wrap gap-4 md:gap-6 mt-4 md:mt-0 justify-center">
            <a routerLink="/privacy-policy" class="hover:text-[var(--text-primary)] transition-colors">{{ 'FOOTER.PRIVACY_POLICY' | translate }}</a>
            <a routerLink="/terms-of-service" class="hover:text-[var(--text-primary)] transition-colors">{{ 'FOOTER.TERMS_OF_SERVICE' | translate }}</a>
            <a routerLink="/cookies-policy" class="hover:text-[var(--text-primary)] transition-colors">{{ 'FOOTER.COOKIES_POLICY' | translate }}</a>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  year = new Date().getFullYear();
}
