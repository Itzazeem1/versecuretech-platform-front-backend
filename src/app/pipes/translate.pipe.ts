import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Make it impure to react to language changes
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(key: string, params?: Record<string, string>): string {
    // Access the signal to track dependencies
    this.translationService.currentLanguage();
    return this.translationService.translate(key, params);
  }
}
