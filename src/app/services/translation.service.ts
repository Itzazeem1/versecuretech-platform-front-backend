import { Injectable, inject, signal, computed, ApplicationRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface TranslationData {
  [key: string]: string | TranslationData;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private http = inject(HttpClient);
  private appRef = inject(ApplicationRef);
  
  private translations = signal<TranslationData>({});
  private currentLang = signal('en');
  private readonly SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'ar', 'it'];

  constructor() {
    this.loadLanguage(this.detectLanguage());
  }

  private detectLanguage(): string {
    if (typeof localStorage !== 'undefined') {
      const savedLang = localStorage.getItem('preferredLanguage');
      if (savedLang && this.SUPPORTED_LANGUAGES.includes(savedLang)) {
        return savedLang;
      }
    }
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang && this.SUPPORTED_LANGUAGES.includes(browserLang)) {
        return browserLang;
      }
    }
    return 'en';
  }

  async loadLanguage(lang: string): Promise<void> {
    if (!this.SUPPORTED_LANGUAGES.includes(lang)) {
      lang = 'en';
    }

    try {
      const data = await firstValueFrom(
        this.http.get<TranslationData>(`/assets/i18n/${lang}.json`)
      );
      this.translations.set(data);
      this.currentLang.set(lang);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('preferredLanguage', lang);
      }

      // Handle RTL for Arabic
      if (typeof document !== 'undefined') {
        if (lang === 'ar') {
          document.documentElement.dir = 'rtl';
          document.documentElement.lang = 'ar';
        } else {
          document.documentElement.dir = 'ltr';
          document.documentElement.lang = lang;
        }
      }

      // Force Angular to run change detection across all components
      setTimeout(() => {
        try {
          this.appRef.tick();
        } catch (e) {
          // ignore if tick already in progress
        }
      }, 0);
    } catch (error) {
      console.error(`Failed to load translations for ${lang}:`, error);
      // Fallback to English if loading fails
      if (lang !== 'en') {
        this.loadLanguage('en');
      }
    }
  }

  translate(key: string, params?: Record<string, string>): string {
    const keys = key.split('.');
    let value: any = this.translations();

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters if provided
    if (params) {
      return Object.entries(params).reduce(
        (str, [param, replacement]) => str.replace(new RegExp(`{{${param}}}`, 'g'), replacement),
        value
      );
    }

    return value;
  }

  // Expose a computed signal that changes when language changes
  readonly currentLanguage = computed(() => this.currentLang());

  getCurrentLanguage(): string {
    return this.currentLang();
  }

  getSupportedLanguages(): string[] {
    return this.SUPPORTED_LANGUAGES;
  }

  getLanguageName(code: string): string {
    const names: Record<string, string> = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      ar: 'العربية',
      it: 'Italiano'
    };
    return names[code] || code;
  }
}
