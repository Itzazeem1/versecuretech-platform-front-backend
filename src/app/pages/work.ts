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
        <div class="flex flex-col md:flex-row justify-between items-start gap-12">
          <p class="subtitle-text max-w-2xl">
            A selective exhibition of our structural engineering and high-performance capabilities. Driven by over 8 years of staff-level expertise in complex system design and digital longevity.
          </p>
          <div class="flex flex-col items-start md:items-end gap-2 text-right">
            <span class="text-[var(--accent-main)] font-mono text-xs tracking-widest uppercase">Expertise-Led</span>
            <span class="text-2xl font-display font-light">Staff Engineer Directed</span>
            <p class="text-[var(--text-muted)] text-sm max-w-[200px] mt-2 md:text-right">Architecting RAG and Vector Search enabled solutions for a competitive edge.</p>
          </div>
        </div>
      </section>

      <!-- Expertise: Strategic Foundations -->
      <section class="max-w-7xl mx-auto px-6 mb-48 overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div class="expertise-card p-10 rounded-3xl border border-[var(--text-primary)]/5 bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.04] transition-all duration-500 scene-anim">
            <div class="text-[var(--accent-main)] mb-6"><span class="material-icons text-4xl">cloud_queue</span></div>
            <h3 class="text-xl font-display font-semibold mb-4">Web Development</h3>
            <p class="text-[var(--text-muted)] text-sm leading-relaxed mb-6">Scalable & High-Performance backend systems and seamless enterprise-grade interfaces.</p>
            <ul class="text-[10px] uppercase tracking-widest font-mono text-[var(--text-muted)] space-y-2">
              <li>• Microservices (Node/Python)</li>
              <li>• PostgreSQL & MongoDB Opt</li>
              <li>• Enterprise Portals</li>
            </ul>
          </div>

          <div class="expertise-card p-10 rounded-3xl border border-[var(--text-primary)]/5 bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.04] transition-all duration-500 scene-anim">
            <div class="text-[var(--accent-main)] mb-6"><span class="material-icons text-4xl">devices</span></div>
            <h3 class="text-xl font-display font-semibold mb-4">App Development</h3>
            <p class="text-[var(--text-muted)] text-sm leading-relaxed mb-6">Cross-platform innovation from conceptualization to native-performing deployment.</p>
            <ul class="text-[10px] uppercase tracking-widest font-mono text-[var(--text-muted)] space-y-2">
              <li>• FinTech & Trade Systems</li>
              <li>• AI/LLM Integration</li>
              <li>• Performance Tuning</li>
            </ul>
          </div>

          <div class="expertise-card p-10 rounded-3xl border border-[var(--text-primary)]/5 bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.04] transition-all duration-500 scene-anim">
            <div class="text-[var(--accent-main)] mb-6"><span class="material-icons text-4xl">security</span></div>
            <h3 class="text-xl font-display font-semibold mb-4">Cyber Security</h3>
            <p class="text-[var(--text-muted)] text-sm leading-relaxed mb-6">Data protection as a baseline. Security audits and deep vulnerability assessments.</p>
            <ul class="text-[10px] uppercase tracking-widest font-mono text-[var(--text-muted)] space-y-2">
              <li>• End-to-End Encryption</li>
              <li>• Advanced RBAC Design</li>
              <li>• Architectural Patching</li>
            </ul>
          </div>

          <div class="expertise-card p-10 rounded-3xl border border-[var(--text-primary)]/5 bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.04] transition-all duration-500 scene-anim">
            <div class="text-[var(--accent-main)] mb-6"><span class="material-icons text-4xl">trending_up</span></div>
            <h3 class="text-xl font-display font-semibold mb-4">SEO & Growth</h3>
            <p class="text-[var(--text-muted)] text-sm leading-relaxed mb-6">Bridging technical SEO with actionable content strategy for maximum visibility.</p>
            <ul class="text-[10px] uppercase tracking-widest font-mono text-[var(--text-muted)] space-y-2">
              <li>• Core Web Vitals Opt</li>
              <li>• Search Intent Alignment</li>
              <li>• Continuous Monitoring</li>
            </ul>
          </div>

        </div>
      </section>

      <!-- Key Case Studies -->
      <section class="max-w-6xl mx-auto px-6 w-full flex flex-col gap-32 md:gap-40 mb-32">
        
        <!-- Case Study 1: Stay.ai -->
        <div class="flex flex-col md:flex-row gap-12 w-full items-start scene-anim cursor-pointer group" (click)="goToUrl('https://stay.ai/')">
          <div class="w-full md:w-1/3">
            <span class="text-[var(--text-muted)] font-mono text-sm tracking-widest uppercase mb-4 block">01 / Subscription Growth Core</span>
            <h2 class="text-4xl md:text-5xl font-display font-medium mb-6 transition-colors group-hover:text-[#ff41b4]">Stay.ai</h2>
          </div>
          <div class="w-full md:w-2/3 md:offset-y-12">
            <div class="glass-panel p-10 md:p-14 rounded-[2rem] glow-hover relative overflow-hidden h-96 flex flex-col justify-between border border-[var(--text-primary)]/5 transition-colors group-hover:border-[#ff41b4]/30">
               <img src="/assets/images/stay-ai.png" alt="Stay.ai" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity duration-700">
               <div class="w-96 h-96 absolute -top-10 -right-10 bg-[#ff41b4] blur-[100px] opacity-10 pointer-events-none group-hover:opacity-30 transition-opacity duration-1000"></div>
               
               <p class="text-[var(--text-muted)] text-xl font-light leading-relaxed mb-10 relative z-10 max-w-lg">
                 Architected high-performance subscription commerce interfaces integrated with advanced AI-driven retention engines and Shopify enterprise ecosystems.
               </p>
               
               <div class="flex justify-between items-end relative z-10">
                 <div class="flex gap-4">
                   <div class="py-2 border-b border-[var(--text-primary)]/5 uppercase tracking-widest text-[10px] font-mono">Commerce AI</div>
                   <div class="py-2 border-b border-[var(--text-primary)]/5 uppercase tracking-widest text-[10px] font-mono">Retention Engine</div>
                 </div>
                 <span class="material-icons opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 transition-all duration-500 text-[#ff41b4]">east</span>
               </div>
            </div>
          </div>
        </div>

        <!-- Case Study 2: Core Direction -->
        <div class="flex flex-col md:flex-row-reverse gap-12 w-full items-start scene-anim cursor-pointer group" (click)="goToUrl('https://coredirection.com/')">
          <div class="w-full md:w-1/3 text-left md:text-right">
            <span class="text-[var(--text-muted)] font-mono text-sm tracking-widest uppercase mb-4 block">02 / Wellness Tech Ecosystem</span>
            <h2 class="text-4xl md:text-5xl font-display font-medium mb-6 transition-colors group-hover:text-[#3b82f6]">Core Direction</h2>
          </div>
          <div class="w-full md:w-2/3 md:-offset-y-12">
            <div class="glass-panel p-10 md:p-14 rounded-[2rem] glow-hover relative overflow-hidden h-96 flex flex-col justify-between border border-[var(--text-primary)]/5 transition-colors group-hover:border-[#3b82f6]/30">
               <img src="/assets/images/core-direction.png" alt="Core Direction" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity duration-700">
               <div class="w-96 h-96 absolute -bottom-10 -left-10 bg-[#3b82f6] blur-[100px] opacity-10 pointer-events-none group-hover:opacity-30 transition-opacity duration-1000"></div>
               
               <p class="text-[var(--text-muted)] text-xl font-light leading-relaxed mb-10 relative z-10 max-w-lg">
                 Engineered a cinematic global wellness platform, aggregating diverse fitness activities and tracking health engagement for massive community and corporate userbases.
               </p>

               <div class="flex justify-between items-end relative z-10">
                 <div class="flex gap-4">
                   <div class="py-2 border-b border-[var(--text-primary)]/5 uppercase tracking-widest text-[10px] font-mono">Global Platform</div>
                   <div class="py-2 border-b border-[var(--text-primary)]/5 uppercase tracking-widest text-[10px] font-mono">Health Tracking</div>
                 </div>
                 <span class="material-icons opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 transition-all duration-500 text-[#3b82f6]">east</span>
               </div>
            </div>
          </div>
        </div>

        <!-- Case Study 3: Climb Credit -->
        <div class="flex flex-col md:flex-row gap-12 w-full items-start scene-anim cursor-pointer group" (click)="goToUrl('https://climbcredit.com/students')">
          <div class="w-full md:w-1/3">
            <span class="text-[var(--text-muted)] font-mono text-sm tracking-widest uppercase mb-4 block">03 / Financial Mobility Matrix</span>
            <h2 class="text-4xl md:text-5xl font-display font-medium mb-6 transition-colors group-hover:text-[#f59e0b]">Climb Credit</h2>
          </div>
          <div class="w-full md:w-2/3 md:offset-y-12">
            <div class="glass-panel p-10 md:p-14 rounded-[2rem] glow-hover relative overflow-hidden h-96 flex flex-col justify-between border border-[var(--text-primary)]/5 transition-colors group-hover:border-[#f59e0b]/30">
               <img src="/assets/images/climb-credit.png" alt="Climb Credit" class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity duration-700">
               <div class="w-[800px] h-32 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f59e0b] blur-[80px] opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-1000"></div>
               
               <p class="text-[var(--text-muted)] text-xl font-light leading-relaxed mb-10 relative z-10 max-w-lg">
                 Developed secure, high-trust lending infrastructures for academic financing, optimizing loan origination and payout flows for thousands of students and vocational schools.
               </p>
               
               <div class="flex justify-between items-end relative z-10">
                 <div class="flex gap-4">
                   <div class="py-2 border-b border-[var(--text-primary)]/5 uppercase tracking-widest text-[10px] font-mono">Financial Infrastructure</div>
                   <div class="py-2 border-b border-[var(--text-primary)]/5 uppercase tracking-widest text-[10px] font-mono">Fast-Lending</div>
                 </div>
                 <span class="material-icons opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 transition-all duration-500 text-[#f59e0b]">east</span>
               </div>
            </div>
          </div>
        </div>

      </section>

      <!-- Minimalist CTA -->
      <section class="max-w-4xl mx-auto px-6 text-center mt-32 md:mt-48 mb-20 scene-anim">
         <h2 class="text-3xl md:text-5xl font-display font-medium mb-10">Partner with Engineering Elite.</h2>
         <a routerLink="/contact" class="tesla-btn inline-flex items-center gap-4 px-10 py-5 rounded-full border border-[var(--text-primary)]/20 bg-[var(--text-primary)] text-[var(--bg-main)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)] transition-colors font-bold tracking-widest uppercase text-sm">
            Initiate Engagement Matrix
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
      this.initGSAP();
    });
  }

  private initGSAP() {
    this.ctx = gsap.context(() => {
      const speed = this.store.animationSpeed();

      const sections = gsap.utils.toArray('.scene-anim');
      sections.forEach((section: unknown) => {
        gsap.from(section as gsap.DOMTarget, {
          opacity: 0,
          y: 80,
          duration: 1.2 / speed,
          scrollTrigger: {
            trigger: section as gsap.DOMTarget,
            start: "top 85%",
            scrub: true
          }
        });
      });

      const buttons = document.querySelectorAll('.tesla-btn');
      buttons.forEach((btn: Element) => {
        btn.addEventListener('mouseenter', () => {
          gsap.to(btn, { scale: 1.05, duration: 0.3, ease: 'power2.out', boxShadow: '0 0 30px rgba(108,140,255,0.4)' });
        });
        btn.addEventListener('mouseleave', () => {
          gsap.to(btn, { scale: 1, duration: 0.3, ease: 'power2.out', boxShadow: 'none' });
        });
      });
    });
  }

  goToUrl(url: string) {
    window.open(url, '_blank');
  }

  ngOnDestroy() {
    if (this.ctx) this.ctx.revert();
  }
}
