import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { GoogleGenAI } from '@google/genai';
import emailjs from '@emailjs/browser';
import { SupabaseService } from '../services/supabase.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ai-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-black text-white flex flex-col font-sans">
      <!-- Header -->
      <header class="border-b border-white/10 p-4 flex justify-between items-center bg-zinc-950">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold">AI</div>
          <h1 class="text-xl font-medium tracking-tight">Horizon AI Builder</h1>
        </div>
        <div class="flex gap-3">
          <button routerLink="/admin" class="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Back to Admin</button>
          <button (click)="saveToSupabase()" [disabled]="!generatedHtml() || saving()" class="px-4 py-2 text-sm bg-white text-black font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50">
            {{ saving() ? 'Saving...' : 'Publish to Live Site' }}
          </button>
        </div>
      </header>

      <!-- Main Workspace -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar Controls -->
        <aside class="w-80 border-r border-white/10 bg-zinc-950 p-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h2 class="text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">Generate Website</h2>
            <p class="text-xs text-zinc-500 mb-4">Describe the website you want to build. The AI will generate a fully functional page with Tailwind CSS and Vanilla JS.</p>
            
            <textarea 
              [(ngModel)]="prompt" 
              rows="6" 
              class="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="e.g., A modern portfolio for a photographer with a dark theme, a working image carousel, and a contact form..."></textarea>
          </div>

          <button 
            (click)="generateWebsite()" 
            [disabled]="loading() || !prompt()"
            class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
            @if (loading()) {
              <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Generating...
            } @else {
              Generate Magic
            }
          </button>

          @if (error()) {
            <div class="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {{ error() }}
            </div>
          }
          @if (successMessage()) {
            <div class="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              {{ successMessage() }}
            </div>
          }
        </aside>

        <!-- Preview Area -->
        <main class="flex-1 bg-zinc-900 relative p-4 flex flex-col">
          <div class="bg-zinc-800 rounded-t-lg border-t border-l border-r border-white/10 p-2 flex items-center gap-2">
            <div class="flex gap-1.5 ml-2">
              <div class="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div class="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div class="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div class="mx-auto bg-zinc-900 text-zinc-500 text-xs px-24 py-1 rounded-md font-mono">
              Live Preview
            </div>
          </div>
          
          <div class="flex-1 bg-white rounded-b-lg overflow-hidden border-b border-l border-r border-white/10 relative">
            @if (!generatedHtml()) {
              <div class="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50">
                <svg class="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <p>Your generated website will appear here.</p>
              </div>
            } @else {
              <iframe 
                [src]="safeHtmlPreview()" 
                class="w-full h-full border-none" 
                sandbox="allow-scripts allow-same-origin">
              </iframe>
            }
          </div>
        </main>
      </div>
    </div>
  `
})
export class AiBuilderComponent {
  prompt = signal('');
  loading = signal(false);
  saving = signal(false);
  error = signal('');
  successMessage = signal('');
  
  generatedHtml = signal('');
  safeHtmlPreview = signal<SafeResourceUrl | null>(null);

  private sanitizer = inject(DomSanitizer);
  private supabase = inject(SupabaseService);

  async generateWebsite() {
    if (!this.prompt()) return;
    
    this.loading.set(true);
    this.error.set('');
    this.successMessage.set('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env['GEMINI_API_KEY'] || 'YOUR_GEMINI_API_KEY' });
      
      const systemInstruction = `You are an expert frontend developer and UI/UX designer.
        Your task is to generate a complete, single-file HTML document based on the user's request.
        
        CRITICAL REQUIREMENTS:
        1. Output MUST be a SINGLE HTML file containing everything.
        2. Include Tailwind CSS via CDN: <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
        3. Include any necessary Google Fonts.
        4. Include functional Vanilla JavaScript inside a <script> tag at the end of the <body> for interactivity (sliders, toggles, modals, etc.).
        5. DO NOT use React, Angular, or Vue. Only raw HTML, Tailwind classes, and Vanilla JS.
        6. DO NOT wrap the output in markdown code blocks. Output ONLY the raw HTML string starting with <!DOCTYPE html>.
        7. Ensure the design is modern, responsive, and accessible.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: this.prompt(),
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      let htmlContent = response.text || '';
      
      // Clean up markdown if the model accidentally includes it
      if (htmlContent.startsWith('```html')) {
        htmlContent = htmlContent.replace(/^```html\n/, '').replace(/\n```$/, '');
      } else if (htmlContent.startsWith('```')) {
        htmlContent = htmlContent.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      this.generatedHtml.set(htmlContent);
      
      // Use data URI for the iframe source to allow scripts to run properly
      const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
      this.safeHtmlPreview.set(this.sanitizer.bypassSecurityTrustResourceUrl(dataUri));
      
    } catch (err: unknown) {
      console.error('Generation error:', err);
      const errorMessage = (err as Error).message || 'Failed to generate website. Please try again.';
      this.error.set(errorMessage);
      
      // Trigger EmailJS alert if it's an API Key or Quota issue
      const errStr = errorMessage.toLowerCase();
      if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('403') || errStr.includes('permission_denied') || errStr.includes('api_key_invalid')) {
        this.sendApiKeyAlertEmail(errorMessage);
      }
    } finally {
      this.loading.set(false);
    }
  }

  private async sendApiKeyAlertEmail(errorDetails: string) {
    try {
      // TODO: Replace these with your actual EmailJS credentials from https://dashboard.emailjs.com/
      const serviceID = 'YOUR_SERVICE_ID';
      const templateID = 'YOUR_TEMPLATE_ID';
      const publicKey = 'YOUR_PUBLIC_KEY';

      const templateParams = {
        to_email: 'azeem6.makhdum@gmail.com',
        subject: 'URGENT: Gemini API Key Exhausted/Invalid',
        message: `Your Gemini API key has run out of quota or is invalid. Please generate a new one and update your .env file.\n\nError Details:\n${errorDetails}`
      };

      await emailjs.send(serviceID, templateID, templateParams, {
        publicKey: publicKey,
      });
      console.log('API Key exhaustion alert email sent successfully!');
    } catch (emailErr) {
      console.error('Failed to send API key alert email:', emailErr);
    }
  }

  async saveToSupabase() {
    if (!this.generatedHtml()) return;
    
    this.saving.set(true);
    this.error.set('');
    this.successMessage.set('');

    try {
      // Save the generated HTML to Supabase under a specific section, e.g., 'ai_generated_page'
      const success = await this.supabase.saveContent('ai_generated_page', { html: this.generatedHtml() });
      
      if (success) {
        this.successMessage.set('Successfully published to database!');
        setTimeout(() => this.successMessage.set(''), 3000);
      } else {
        this.error.set('Failed to save to database. Are you logged in as Admin?');
      }
    } catch {
      this.error.set('An error occurred while saving.');
    } finally {
      this.saving.set(false);
    }
  }
}
