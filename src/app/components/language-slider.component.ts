import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../services/translation.service';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-language-slider',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="language-slider">
      <button
        type="button"
        (click)="toggleDropdown()"
        class="language-btn flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-mono text-stone-300"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-label]="'LANGUAGE.SELECT' | translate">
        <span>{{ translationService.getCurrentLanguage() | uppercase }}</span>
        <svg class="w-4 h-4 transition-transform" [class.rotate-180]="isOpen()" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      @if (isOpen()) {
        <div class="language-dropdown absolute top-full right-0 mt-2 bg-[#0C0A09] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 min-w-[150px]" role="listbox">
          @for (lang of translationService.getSupportedLanguages(); track lang) {
            <button
              type="button"
              role="option"
              (click)="selectLanguage(lang)"
              class="w-full px-4 py-2 text-left text-sm font-mono transition-colors hover:bg-white/10 text-stone-300"
              [class.bg-white/10]="lang === translationService.getCurrentLanguage()"
              [attr.aria-selected]="lang === translationService.getCurrentLanguage()">
              {{ translationService.getLanguageName(lang) }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .language-slider {
      position: relative;
    }

    .language-dropdown {
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .rotate-180 {
      transform: rotate(180deg);
    }
  `]
})
export class LanguageSliderComponent {
  public translationService = inject(TranslationService);
  private host = inject(ElementRef<HTMLElement>);
  public isOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isOpen()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen()) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown() {
    this.isOpen.update((open) => !open);
  }

  async selectLanguage(lang: string) {
    await this.translationService.loadLanguage(lang);
    this.isOpen.set(false);
  }
}
