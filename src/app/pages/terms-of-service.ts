import { Component, afterNextRender, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import gsap from 'gsap';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    
    <main class="min-h-screen pt-32 pb-20 relative overflow-hidden bg-[var(--bg-main)]">
      <div class="max-w-4xl mx-auto px-6 relative z-10">
        <h1 class="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter mb-12 terms-anim text-[var(--accent-main)]">
          Terms of Service
        </h1>
        
        <div class="prose prose-invert prose-lg max-w-none terms-anim text-[var(--text-muted)] font-light">
          <p class="mb-8">Last updated: March 20, 2026</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">1. Agreement to Terms</h2>
          <p class="mb-6">By accessing our website at VersecureTech, you agree to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">2. Use License</h2>
          <p class="mb-6">Permission is granted to temporarily download one copy of the materials (information or software) on VersecureTech's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
          <ul class="list-disc pl-6 mb-6 space-y-2">
            <li>modify or copy the materials;</li>
            <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
            <li>attempt to decompile or reverse engineer any software contained on VersecureTech's website;</li>
            <li>remove any copyright or other proprietary notations from the materials; or</li>
            <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
          </ul>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">3. Disclaimer</h2>
          <p class="mb-6">The materials on VersecureTech's website are provided on an 'as is' basis. VersecureTech makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">4. Limitations</h2>
          <p class="mb-6">In no event shall VersecureTech or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on VersecureTech's website, even if VersecureTech or a VersecureTech authorized representative has been notified orally or in writing of the possibility of such damage.</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">5. Revisions and Errata</h2>
          <p class="mb-6">The materials appearing on VersecureTech's website could include technical, typographical, or photographic errors. VersecureTech does not warrant that any of the materials on its website are accurate, complete or current. VersecureTech may make changes to the materials contained on its website at any time without notice.</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">6. Governing Law</h2>
          <p class="mb-6">These terms and conditions are governed by and construed in accordance with the laws of the State of California, United States, and you irrevocably submit to the exclusive jurisdiction of the courts located in San Francisco, California.</p>
        </div>
      </div>
    </main>
    
    <app-footer></app-footer>
  `
})
export class TermsOfServiceComponent implements OnDestroy {
  private ctx!: gsap.Context;

  constructor() {
    afterNextRender(() => {
      this.ctx = gsap.context(() => {
        gsap.from('.terms-anim', {
          y: 30,
          opacity: 0,
          duration: 1,
          stagger: 0.1,
          ease: 'power3.out',
          delay: 0.2
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
