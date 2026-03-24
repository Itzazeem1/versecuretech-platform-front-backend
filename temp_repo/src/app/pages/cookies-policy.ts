import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';

@Component({
  selector: 'app-cookies-policy',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    
    <main class="min-h-screen pt-32 pb-20 relative overflow-hidden bg-[var(--bg-main)]">
      <div class="max-w-4xl mx-auto px-6 relative z-10">
        <h1 class="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter mb-12 text-[var(--accent-main)]">
          Cookies Policy
        </h1>
        
        <div class="prose prose-invert prose-lg max-w-none text-[var(--text-muted)] font-light">
          <p class="mb-8">Last updated: March 23, 2026</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">1. What Are Cookies?</h2>
          <p class="mb-6">Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site. Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your personal computer or mobile device when you go offline, while session cookies are deleted as soon as you close your web browser.</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">2. How We Use Cookies</h2>
          <p class="mb-6">We use cookies for several reasons, including:</p>
          <ul class="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility. You may disable these by changing your browser settings, but this may affect how the website functions.</li>
            <li><strong>Performance and Analytics Cookies:</strong> These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous.</li>
            <li><strong>Functionality Cookies:</strong> These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.</li>
            <li><strong>Targeting Cookies:</strong> These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.</li>
          </ul>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">3. Managing Cookies</h2>
          <p class="mb-6">You can control and manage cookies in various ways. Please keep in mind that removing or blocking cookies can negatively impact your user experience and parts of our website may no longer be fully accessible.</p>
          <p class="mb-6">Most browsers allow you to view, manage, delete and block cookies for a website. Be aware that if you delete all cookies then any preferences you have set will be lost, including the ability to opt-out from cookies as this function itself requires placement of an opt-out cookie on your device.</p>
          
          <h2 class="text-2xl font-display font-bold text-[var(--text-primary)] mt-12 mb-6">4. Changes to this Policy</h2>
          <p class="mb-6">We may update this Cookies Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookies Policy regularly to stay informed about our use of cookies and related technologies.</p>
        </div>
      </div>
    </main>
    
    <app-footer></app-footer>
  `
})
export class CookiesPolicyComponent {}
