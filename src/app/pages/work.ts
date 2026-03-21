import { Component, afterNextRender, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import { ThreeBackgroundComponent } from '../components/three-bg';
import { RouterLink } from '@angular/router';
import { StoreService } from '../services/store.service';
import gsap from 'gsap';

@Component({
  selector: 'app-work',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, HeaderComponent, FooterComponent, ThreeBackgroundComponent, RouterLink],
  template: `
    <app-three-bg></app-three-bg>
    <app-header></app-header>
    
    <main class="relative z-10 min-h-screen pt-40 pb-20 overflow-hidden text-[var(--text-primary)]">
      
      <!-- Hero Section -->
      <section class="max-w-7xl mx-auto px-6 mb-32 md:mb-48 scene-anim">
        <h1 class="huge-text font-display font-bold tracking-tight mb-8">
          The Proof.
        </h1>
        <div class="flex justify-start md:offset-y-12">
          <p class="subtitle-text max-w-2xl">
            A selective exhibition of our structural engineering and high-performance capabilities. We don't just build interfaces; we architect digital longevity.
          </p>
        </div>
      </section>

      <!-- Asymmetrical Vertical Work List (No Images) -->
      <section class="max-w-6xl mx-auto px-6 w-full flex flex-col gap-32 md:gap-40 mb-32">
        
        <!-- Project 1 -->
        <div class="flex flex-col md:flex-row gap-12 w-full items-start scene-anim cursor-pointer group" routerLink="/work/project-alpha">
          <div class="w-full md:w-1/3">
            <span class="text-[var(--text-muted)] font-mono text-sm tracking-widest uppercase mb-4 block">01 / FinTech Identity</span>
            <h2 class="text-4xl md:text-5xl font-display font-medium mb-6 transition-colors group-hover:text-[var(--accent-main)]">Project Alpha</h2>
          </div>
          <div class="w-full md:w-2/3 md:offset-y-12">
            <div class="glass-panel p-10 md:p-14 rounded-[2rem] glow-hover relative overflow-hidden h-80 flex flex-col justify-between border border-[var(--text-primary)]/5 transition-colors group-hover:border-[var(--accent-main)]/30">
               <div class="w-96 h-96 absolute -top-10 -right-10 bg-[var(--accent-main)] blur-[100px] opacity-10 pointer-events-none group-hover:opacity-30 transition-opacity duration-1000"></div>
               
               <p class="text-[var(--text-muted)] text-xl font-light leading-relaxed mb-10 relative z-10 max-w-lg">
                 Complete digital transformation bridging high-frequency trading latency with an elegant, consumer-focused structural interface.
               </p>
               
               <div class="flex justify-between items-end relative z-10">
                 <div class="flex gap-4">
                   <div class="py-2 border-b border-[var(--text-primary)]/5 uppercase tracking-widest text-xs font-mono">Web Architecture</div>
                   <div class="py-2 border-b border-[var(--text-primary)]/5 uppercase tracking-widest text-xs font-mono">Security</div>
                 </div>
                 <span class="material-icons opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 transition-all duration-500 text-[var(--accent-main)]">east</span>
               </div>
            </div>
          </div>
        </div>

        <!-- Project 2 (Offset intentionally) -->
        <div class="flex flex-col md:flex-row-reverse gap-12 w-full items-start scene-anim cursor-pointer group" routerLink="/work/nexus-security">
          <div class="w-full md:w-1/3 text-left md:text-right">
            <span class="text-[var(--text-muted)] font-mono text-sm tracking-widest uppercase mb-4 block">02 / Enterprise Defense</span>
            <h2 class="text-4xl md:text-5xl font-display font-medium mb-6 transition-colors group-hover:text-[var(--accent-main)]">Nexus Security</h2>
          </div>
          <div class="w-full md:w-2/3 md:-offset-y-12">
            <div class="glass-panel p-10 md:p-14 rounded-[2rem] glow-hover relative overflow-hidden h-80 flex flex-col justify-between border border-[var(--text-primary)]/5 transition-colors group-hover:border-[var(--accent-main)]/30">
               <div class="w-96 h-96 absolute -bottom-10 -left-10 bg-[var(--accent-main)] blur-[100px] opacity-10 pointer-events-none group-hover:opacity-30 transition-opacity duration-1000"></div>
               
               <p class="text-[var(--text-muted)] text-xl font-light leading-relaxed mb-10 relative z-10 max-w-lg">
                 Zero-trust implementation and penetration resistance architecture resulting in zero successful breaches post-deployment.
               </p>

               <div class="flex justify-between items-end relative z-10">
                 <div class="flex gap-4">
                   <div class="py-2 border-b border-[var(--text-primary)]/5 uppercase tracking-widest text-xs font-mono">Cyber Security</div>
                   <div class="py-2 border-b border-[var(--text-primary)]/5 uppercase tracking-widest text-xs font-mono">Auditing</div>
                 </div>
                 <span class="material-icons opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 transition-all duration-500 text-[var(--accent-main)]">east</span>
               </div>
            </div>
          </div>
        </div>

        <!-- Project 3 -->
        <div class="flex flex-col md:flex-row gap-12 w-full items-start scene-anim cursor-pointer group" routerLink="/work/quantum-app">
          <div class="w-full md:w-1/3">
            <span class="text-[var(--text-muted)] font-mono text-sm tracking-widest uppercase mb-4 block">03 / Edge Compute</span>
            <h2 class="text-4xl md:text-5xl font-display font-medium mb-6 transition-colors group-hover:text-[var(--text-primary)]">Quantum App</h2>
          </div>
          <div class="w-full md:w-2/3 md:offset-y-12">
            <div class="glass-panel p-10 md:p-14 rounded-[2rem] glow-hover relative overflow-hidden h-80 flex flex-col justify-between border border-[var(--text-primary)]/5 transition-colors group-hover:border-[var(--text-primary)]/30">
               <div class="w-[800px] h-32 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--text-primary)] blur-[80px] opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-1000"></div>
               
               <p class="text-[var(--text-muted)] text-xl font-light leading-relaxed mb-10 relative z-10 max-w-lg">
                 A high-velocity mobile client bridging consumer interfaces with advanced mathematical compute matrices. Fast, weightless, precise.
               </p>
               
               <div class="flex justify-between items-end relative z-10">
                 <div class="flex gap-4">
                   <div class="py-2 border-b border-[var(--text-primary)]/5 uppercase tracking-widest text-xs font-mono">App Development</div>
                   <div class="py-2 border-b border-[var(--text-primary)]/5 uppercase tracking-widest text-xs font-mono">Performance Opt</div>
                 </div>
                 <span class="material-icons opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 transition-all duration-500 text-[var(--text-primary)]">east</span>
               </div>
            </div>
          </div>
        </div>

      </section>

      <!-- Minimalist CTA -->
      <section class="max-w-4xl mx-auto px-6 text-center mt-32 md:mt-48 mb-20 scene-anim">
         <h2 class="text-3xl md:text-5xl font-display font-medium mb-10">Add your project to the array.</h2>
         <a routerLink="/contact" class="tesla-btn inline-flex items-center gap-4 px-10 py-5 rounded-full border border-[var(--text-primary)]/20 bg-[var(--text-primary)] text-[var(--bg-main)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)] transition-colors font-bold tracking-widest uppercase text-sm">
            Initiate Engagement
         </a>
      </section>
      
    </main>
    
    <app-footer></app-footer>
  `
})
export class WorkComponent implements OnDestroy {
  private ctx!: gsap.Context;
  public store = inject(StoreService);

  constructor() {
    afterNextRender(async () => {
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      this.initGSAP(ScrollTrigger);
    });
  }

  private initGSAP(ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger) {
    this.ctx = gsap.context(() => {
      const speed = this.store.animationSpeed();

      const sections = gsap.utils.toArray('.scene-anim');
      sections.forEach((section: any) => {
        gsap.from(section, {
          opacity: 0,
          y: 80,
          duration: 1.2 / speed,
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            scrub: true
          }
        });
      });

      const buttons = document.querySelectorAll('.tesla-btn');
      buttons.forEach((btn: any) => {
        btn.addEventListener('mouseenter', () => {
          gsap.to(btn, { scale: 1.05, duration: 0.3, ease: 'power2.out', boxShadow: '0 0 30px rgba(108,140,255,0.4)' });
        });
        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, { scale: 1, duration: 0.3, ease: 'power2.out', boxShadow: 'none' });
        });
      });
    });
  }

  ngOnDestroy() {
    if (this.ctx) this.ctx.revert();
  }
}
