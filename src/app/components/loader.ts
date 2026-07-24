import { Component, afterNextRender, ElementRef, viewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #loaderContainer class="loader-container">
      <div #logo class="loader-logo">VersecureTech</div>
      <div #progress class="loader-progress">
        <div #bar class="loader-bar"></div>
      </div>
    </div>
  `,
  styles: [`
    .loader-container {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background-color: var(--bg-main);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-primary);
    }
    .loader-logo {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      opacity: 0;
      transform: translateY(20px);
      margin-bottom: 2rem;
    }
    .loader-progress {
      width: 200px;
      height: 2px;
      background-color: rgba(255, 255, 255, 0.1);
      opacity: 0;
      overflow: hidden;
    }
    .loader-bar {
      width: 0%;
      height: 100%;
      background-color: var(--accent-main);
    }
  `]
})
export class LoaderComponent implements OnDestroy {
  loaderContainer = viewChild.required<ElementRef>('loaderContainer');
  logo = viewChild.required<ElementRef>('logo');
  progress = viewChild.required<ElementRef>('progress');
  bar = viewChild.required<ElementRef>('bar');

  private ctx!: gsap.Context;

  constructor() {
    afterNextRender(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.ctx = gsap.context(() => {
        const tl = gsap.timeline({
          onComplete: () => {
            const el = this.loaderContainer().nativeElement;
            el.style.display = 'none';
            el.style.pointerEvents = 'none';
          }
        });

        if (reduceMotion) {
          tl.to(this.loaderContainer().nativeElement, { opacity: 0, duration: 0.35 });
          return;
        }

        // Normal brand intro (~3.8s) — site itself stays fast underneath
        tl.to(this.logo().nativeElement, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out'
        })
        .to(this.progress().nativeElement, {
          opacity: 1,
          duration: 0.4
        }, '-=0.35')
        .to(this.bar().nativeElement, {
          width: '100%',
          duration: 2.0,
          ease: 'power2.inOut'
        })
        .to(this.loaderContainer().nativeElement, {
          yPercent: -100,
          duration: 0.85,
          ease: 'power4.inOut',
          delay: 0.25
        });
      });
    });
  }

  ngOnDestroy() {
    if (this.ctx) {
      this.ctx.revert();
    }
  }
}
