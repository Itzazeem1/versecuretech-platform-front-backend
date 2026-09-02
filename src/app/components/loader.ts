import { Component, afterNextRender, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../services/store.service';

/**
 * Marks the app boot-ready after the HTML splash finishes (or immediately as fallback).
 * The visible splash lives only in index.html so it always completes.
 */
@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: '',
  styles: [`:host { display: none; }`]
})
export class LoaderComponent implements OnDestroy {
  private store = inject(StoreService);
  private onReady = () => this.markReady();
  private safetyTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterNextRender(() => {
      if (document.documentElement.classList.contains('app-ready')) {
        this.markReady();
        return;
      }

      window.addEventListener('vt-boot-ready', this.onReady, { once: true });

      // If HTML splash already closed, or never existed, unblock Angular now
      if (!document.getElementById('boot-splash')) {
        this.markReady();
      }

      this.safetyTimer = setTimeout(() => this.markReady(), 2000);
    });
  }

  private markReady() {
    document.documentElement.classList.add('app-ready');
    document.body.classList.add('app-ready');
    if (typeof (window as any).__finishBootSplash === 'function') {
      (window as any).__finishBootSplash();
    }
    this.store.markBootReady();
  }

  ngOnDestroy() {
    window.removeEventListener('vt-boot-ready', this.onReady);
    if (this.safetyTimer) clearTimeout(this.safetyTimer);
  }
}
