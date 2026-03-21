import { Component, afterNextRender, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import gsap from 'gsap';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    
    <main class="min-h-screen pt-32 pb-20 relative overflow-hidden bg-[var(--bg-main)]">
      <div class="max-w-4xl mx-auto px-6 relative z-10">
        <h1 class="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter mb-12 policy-anim text-[var(--accent-main)]">
          Privacy Policy
        </h1>
        
        <div class="prose prose-invert prose-lg max-w-none policy-anim text-[var(--text-muted)] font-light">
          <p class="mb-8">Last updated: March 20, 2026</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">1. Introduction</h2>
          <p class="mb-6">At VersecureTech, we respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">2. The Data We Collect About You</h2>
          <p class="mb-6">Personal data, or personal information, means any information about an individual from which that person can be identified. We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
          <ul class="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
          </ul>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">3. How We Use Your Personal Data</h2>
          <p class="mb-6">We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          <ul class="list-disc pl-6 mb-6 space-y-2">
            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">4. Data Security</h2>
          <p class="mb-6">We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">5. Contact Us</h2>
          <p class="mb-6">If you have any questions about this privacy policy or our privacy practices, please contact us at <a href="mailto:privacy@versecuretech.com" class="text-[var(--accent-main)] hover:underline">privacy&#64;versecuretech.com</a>.</p>
        </div>
      </div>
    </main>
    
    <app-footer></app-footer>
  `
})
export class PrivacyPolicyComponent implements OnDestroy {
  private ctx!: gsap.Context;

  constructor() {
    afterNextRender(() => {
      this.ctx = gsap.context(() => {
        gsap.from('.policy-anim', {
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
