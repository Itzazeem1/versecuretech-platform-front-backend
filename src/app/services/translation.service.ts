import { Injectable, inject, signal, computed, ApplicationRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface TranslationData {
  [key: string]: string | TranslationData;
}

/** Bump when i18n JSON keys change so browsers/CDNs don't keep stale files. */
const I18N_CACHE_VERSION = '20260726b';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private http = inject(HttpClient);
  private appRef = inject(ApplicationRef);

  private translations = signal<TranslationData>({});
  /** Increments on every successful load — translate pipe depends on this. */
  private catalogVersion = signal(0);
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
        this.http.get<TranslationData>(`/assets/i18n/${lang}.json?v=${I18N_CACHE_VERSION}`)
      );
      this.translations.set(data);
      this.catalogVersion.update((n) => n + 1);
      this.currentLang.set(lang);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('preferredLanguage', lang);
      }

      if (typeof document !== 'undefined') {
        if (lang === 'ar') {
          document.documentElement.dir = 'rtl';
          document.documentElement.lang = 'ar';
        } else {
          document.documentElement.dir = 'ltr';
          document.documentElement.lang = lang;
        }
      }

      setTimeout(() => {
        try {
          this.appRef.tick();
        } catch {
          // ignore if tick already in progress
        }
      }, 0);
    } catch (error) {
      console.error(`Failed to load translations for ${lang}:`, error);
      if (lang !== 'en') {
        this.loadLanguage('en');
      }
    }
  }

  translate(key: string, params?: Record<string, string>): string {
    this.catalogVersion();
    this.currentLang();

    // Avoid flashing raw keys like HOME.HERO_TITLE before the catalog loads
    if (this.catalogVersion() === 0) {
      return '';
    }

    const keys = key.split('.');
    let value: any = this.translations();

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    if (params) {
      return Object.entries(params).reduce(
        (str, [param, replacement]) => str.replace(new RegExp(`{{${param}}}`, 'g'), replacement),
        value
      );
    }

    return value;
  }

  readonly currentLanguage = computed(() => this.currentLang());
  readonly catalogRevision = computed(() => this.catalogVersion());

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
