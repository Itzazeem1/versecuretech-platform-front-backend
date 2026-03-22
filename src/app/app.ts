import {ChangeDetectionStrategy, Component, afterNextRender, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {LoaderComponent} from './components/loader';
import {CookieBannerComponent} from './components/cookie-banner';
import {CommonModule, isPlatformBrowser} from '@angular/common';
import Lenis from 'lenis';
import { SupabaseService } from './services/supabase.service';
import { PLATFORM_ID } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, CookieBannerComponent, CommonModule],
  host: {
    '(document:mousemove)': 'onMouseMove($event)'
  },
  template: `
    <app-loader></app-loader>
    <router-outlet />
    <app-cookie-banner></app-cookie-banner>
    
    <!-- Custom Cursor -->
    <div class="custom-cursor hidden md:block" [style.left.px]="cursorX()" [style.top.px]="cursorY()" [class.hovering]="isHovering()"></div>
    <div class="custom-cursor-dot hidden md:block" [style.left.px]="cursorX()" [style.top.px]="cursorY()"></div>
  `,
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  private lenis?: Lenis;
  private supabase = inject(SupabaseService);
  private platformId = inject(PLATFORM_ID);
  private mouseOverListener?: (e: Event) => void;
  
  cursorX = signal(-100);
  cursorY = signal(-100);
  isHovering = signal(false);

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      this.lenis = new Lenis({
        autoRaf: true,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      
      // Setup hover listeners for custom cursor
      this.setupCursorListeners();
    });
  }

  ngOnInit() {
    this.supabase.checkSession();
  }

  onMouseMove(e: MouseEvent) {
    this.cursorX.set(e.clientX);
    this.cursorY.set(e.clientY);
  }

  private setupCursorListeners() {
    this.mouseOverListener = (e: Event) => {
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
    };

    document.addEventListener('mouseover', this.mouseOverListener);
  }

  ngOnDestroy() {
    if (this.mouseOverListener && isPlatformBrowser(this.platformId)) {
      document.removeEventListener('mouseover', this.mouseOverListener);
    }
    if (this.lenis) {
      this.lenis.destroy();
    }
  }
}
