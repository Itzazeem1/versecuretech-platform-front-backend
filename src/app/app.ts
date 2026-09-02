import {ChangeDetectionStrategy, Component, afterNextRender, OnDestroy, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {LoaderComponent} from './components/loader';
import {CookieBannerComponent} from './components/cookie-banner';
import {CommonModule} from '@angular/common';
import Lenis from 'lenis';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, CookieBannerComponent, CommonModule],
  host: {
    '(document:mousemove)': 'onMouseMove($event)'
  },
  template: `
    <app-loader></app-loader>
    <div class="app-shell">
      <router-outlet />
    </div>
    <app-cookie-banner></app-cookie-banner>
    
    <!-- Custom Cursor -->
    <div class="custom-cursor hidden md:block" [style.left.px]="cursorX()" [style.top.px]="cursorY()" [class.hovering]="isHovering()"></div>
    <div class="custom-cursor-dot hidden md:block" [style.left.px]="cursorX()" [style.top.px]="cursorY()"></div>
  `,
  styleUrl: './app.css',
})
export class App implements OnDestroy {
  private lenis?: Lenis;
  
  cursorX = signal(-100);
  cursorY = signal(-100);
  isHovering = signal(false);

  private cursorEnabled = false;

  constructor() {
    afterNextRender(() => {
      const isTouchOrMobile =
        window.matchMedia('(max-width: 1023px)').matches ||
        window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Smooth scroll is desktop-only — Lenis costs a continuous rAF on every page
      if (!isTouchOrMobile) {
        this.lenis = new Lenis({
          autoRaf: true,
          duration: 1.05,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
        this.cursorEnabled = true;
        this.setupCursorListeners();
      }
    });
  }

  onMouseMove(e: MouseEvent) {
    if (!this.cursorEnabled) return;
    this.cursorX.set(e.clientX);
    this.cursorY.set(e.clientY);
  }

  private setupCursorListeners() {
    document.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'a' || 
          target.tagName.toLowerCase() === 'button' || 
          target.closest('a') || 
          target.closest('button') ||
          target.classList.contains('cursor-pointer')) {
        this.isHovering.set(true);
      } else {
        this.isHovering.set(false);
      }
    });
  }

  ngOnDestroy() {
    if (this.lenis) {
      this.lenis.destroy();
    }
  }
}
