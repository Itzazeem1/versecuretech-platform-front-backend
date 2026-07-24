import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-oauth-buttons',
  standalone: true,
  template: `
    <div class="flex gap-4" [class.grid]="layout() === 'grid'" [class.grid-cols-2]="layout() === 'grid'">
      <button
        type="button"
        (click)="googleClick.emit()"
        class="flex-1 py-3 rounded-xl border border-[var(--text-primary)]/20 hover:bg-[var(--text-primary)]/5 transition-colors flex justify-center items-center gap-2.5 text-sm font-medium">
        <!-- Inline Google mark (no external CDN) -->
        <svg class="w-5 h-5 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.5 7.1l.1.1 6.2 5.2C36.9 41.6 44 36 44 24c0-1.3-.1-2.5-.4-3.5z"/>
        </svg>
        <span [class.text-xs]="compact()" [class.font-bold]="compact()" [class.tracking-wider]="compact()">Google</span>
      </button>

      <button
        type="button"
        (click)="githubClick.emit()"
        class="flex-1 py-3 rounded-xl border border-[var(--text-primary)]/20 hover:bg-[var(--text-primary)]/5 transition-colors flex justify-center items-center gap-2.5 text-sm font-medium">
        <svg class="w-5 h-5 shrink-0 fill-current text-[var(--text-primary)]" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.63-1.37-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 7.5c.85 0 1.71.12 2.51.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .26.18.59.69.48A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"/>
        </svg>
        <span [class.text-xs]="compact()" [class.font-bold]="compact()" [class.tracking-wider]="compact()">GitHub</span>
      </button>
    </div>
  `
})
export class OauthButtonsComponent {
  layout = input<'flex' | 'grid'>('flex');
  compact = input(false);
  googleClick = output<void>();
  githubClick = output<void>();
}
