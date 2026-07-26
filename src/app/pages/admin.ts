import { Component, signal, inject, afterNextRender, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StoreService } from '../services/store.service';
import { SupabaseService } from '../services/supabase.service';
import { ForgeStateService } from '../services/forge-state.service';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import { ThreeBackgroundComponent } from '../components/three-bg';
import { OauthButtonsComponent } from '../components/oauth-buttons';
import { TranslatePipe } from '../pipes/translate.pipe';
import { environment } from '../../environments/environment';
import gsap from 'gsap';

interface ForgeSeat {
  email: string;
  role: 'developer' | 'client';
  plan: string | null;
  credits: number;
  purchases?: number;
  label: string;
  revocable: boolean;
  isAdmin?: boolean;
}

interface PortalProjectRow {
  id: string;
  clientEmail: string;
  title: string;
  status: string;
  progress: number;
  notes?: string;
}

interface PortalTicketRow {
  id: string;
  clientEmail: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  adminReply?: string;
  messages?: Array<{ id: string; authorEmail: string; authorRole: string; body: string; createdAt?: string }>;
  attachments?: Array<{ id: string; fileName: string; url: string }>;
  updatedAt?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, FooterComponent, ThreeBackgroundComponent, OauthButtonsComponent, TranslatePipe],
  template: `
    <app-three-bg></app-three-bg>
    <app-header></app-header>
    
    <div class="min-h-screen pt-40 pb-20 text-[var(--text-primary)] flex flex-col items-center justify-center p-6 relative z-10">

      @if (supabase.tempAdminBypassEnabled) {
        <div class="w-full max-w-7xl mb-6 px-4 py-3 rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-200 text-xs font-mono uppercase tracking-widest text-center">
          TEMP ADMIN BYPASS ON — tell the agent “restore security” when you’re done
        </div>
      }

      <div class="w-full max-w-7xl mb-6 px-4 py-3 rounded-xl border text-xs font-mono uppercase tracking-widest text-center"
           [class.border-amber-400/40]="!isProduction"
           [class.bg-amber-400/10]="!isProduction"
           [class.text-amber-200]="!isProduction"
           [class.border-green-400/30]="isProduction"
           [class.bg-green-400/10]="isProduction"
           [class.text-green-300]="isProduction">
        {{ isProduction ? 'LIVE SITE ADMIN — changes affect www users' : 'LOCAL ADMIN — changes stay on this machine only' }}
      </div>
      
      @if (!supabase.isAdmin()) {
        <div class="w-full max-w-md glass-panel p-10 rounded-[2rem] border border-[var(--text-primary)]/10 relative overflow-hidden glow-hover">
          <div class="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-main)] rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
          
          <div class="text-center mb-10 relative z-10">
            <h1 class="text-3xl font-display font-medium mb-2">{{ 'ADMIN.GATEWAY_TITLE' | translate }}</h1>
            <p class="text-[var(--text-muted)] text-sm">{{ 'ADMIN.GATEWAY_SUBTITLE' | translate }}</p>
          </div>

          @if (supabase.isLoggedIn() && !supabase.isAdmin()) {
            <div class="text-center py-8 relative z-10">
              <span class="material-icons text-5xl text-red-500 mb-4">gavel</span>
              <h2 class="text-xl font-bold mb-2">{{ 'ADMIN.ACCESS_DENIED' | translate }}</h2>
              <p class="text-sm text-[var(--text-muted)] mb-6">{{ 'ADMIN.ACCESS_DENIED_DESC' | translate }}</p>
              <button (click)="logout()" class="w-full py-3 rounded-xl border border-[var(--text-primary)]/20 hover:bg-[var(--text-primary)]/10 transition-colors text-xs font-bold uppercase tracking-widest">
                {{ 'ADMIN.SIGN_OUT' | translate }}
              </button>
            </div>
          } @else {
            <form (ngSubmit)="loginWithEmail()" class="relative z-10 flex flex-col gap-6">
              <div>
                <label for="admin-email" class="block text-xs uppercase tracking-widest font-mono text-[var(--text-muted)] mb-2">{{ 'ADMIN.ADMIN_EMAIL' | translate }}</label>
                <input id="admin-email" type="email" [ngModel]="email()" (ngModelChange)="email.set($event)" name="email" required class="w-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)] transition-colors" placeholder="Admin email">
              </div>
              <div>
                <label for="admin-password" class="block text-xs uppercase tracking-widest font-mono text-[var(--text-muted)] mb-2">{{ 'ADMIN.PASSWORD' | translate }}</label>
                <input id="admin-password" type="password" [ngModel]="password()" (ngModelChange)="password.set($event)" name="password" required class="w-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)] transition-colors" placeholder="••••••••">
              </div>
              
              <button type="submit" [disabled]="loading()" class="w-full py-4 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] font-bold tracking-widest uppercase text-xs hover:bg-[var(--accent-main)] transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                {{ loading() ? ('ADMIN.AUTHENTICATING' | translate) : ('ADMIN.SIGN_IN_EMAIL' | translate) }}
              </button>
              
              <div class="flex items-center gap-4 my-2">
                <div class="h-px bg-[var(--text-primary)]/10 flex-1"></div>
                <span class="text-xs text-[var(--text-muted)] uppercase tracking-widest">{{ 'ADMIN.OR' | translate }}</span>
                <div class="h-px bg-[var(--text-primary)]/10 flex-1"></div>
              </div>

              <app-oauth-buttons [compact]="true" (googleClick)="loginWithGoogle()" (githubClick)="loginWithGithub()" />

              @if (error()) {
                <p class="text-red-400 text-sm mt-2 text-center font-light">{{ error() }}</p>
              }
            </form>
          }
        </div>
      } @else {
        <!-- Dashboard -->
        <div class="w-full max-w-7xl relative z-10 admin-dashboard-anim">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <h2 class="text-4xl font-display font-medium mb-2">{{ 'ADMIN.COMMAND_CENTER' | translate }}</h2>
              <p class="text-[var(--text-muted)] text-sm font-mono flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 
                {{ supabase.isConnected() ? ('ADMIN.CONNECTED' | translate) : ('ADMIN.CONNECTING' | translate) }}
              </p>
            </div>
            <button (click)="logout()" class="px-6 py-2 rounded-full border border-[var(--text-primary)]/20 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-all text-xs uppercase tracking-widest font-mono">
              {{ 'ADMIN.DISCONNECT' | translate }}
            </button>
          </div>

          @if (supabase.tempAdminBypassEnabled) {
            <div class="glass-panel p-8 rounded-[2rem] border border-amber-400/30 mb-8">
              <h3 class="font-medium text-xl mb-2">Reset password (Supabase email link)</h3>
              <p class="text-sm text-[var(--text-muted)] mb-6">
                This unlocks the panel without login. To fix email/password sign-in, send a reset link, or sign in with Google then use Security Settings → Update Password below.
              </p>
              <div class="flex flex-col sm:flex-row gap-3">
                <input type="email" [ngModel]="email()" (ngModelChange)="email.set($event)" class="flex-1 bg-transparent border border-[var(--text-primary)]/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-300" placeholder="your@email.com" />
                <button type="button" (click)="sendPasswordReset()" [disabled]="updatingPassword() || !email()" class="px-6 py-3 rounded-xl bg-amber-400/20 border border-amber-400/40 text-xs font-bold uppercase tracking-widest hover:bg-amber-400/30 disabled:opacity-50 shrink-0">
                  {{ updatingPassword() ? 'Sending…' : 'Send reset email' }}
                </button>
              </div>
              <p class="text-[11px] text-[var(--text-muted)] mt-4 leading-relaxed">
                Reset links go to <span class="text-amber-200">http://localhost:4200/login</span>.
                In Supabase → Authentication → URL Configuration, add that URL under Redirect URLs
                (otherwise the email will open the live site).
              </p>
              @if (passwordMsg()) {
                <p class="text-sm mt-4" [class.text-green-400]="passwordSuccess()" [class.text-red-400]="!passwordSuccess()">{{ passwordMsg() }}</p>
              }
            </div>
          }
          
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <!-- Left Panel: Graphic Content Form CMS -->
            <div class="lg:col-span-8 flex flex-col gap-8">
              <div class="glass-panel p-8 rounded-[2rem] border border-[var(--text-primary)]/10 flex flex-col h-full overflow-hidden">
                <div class="flex items-center justify-between mb-10 border-b border-[var(--text-primary)]/5 pb-6">
                  <div class="flex items-center gap-3">
                    <span class="material-icons text-[var(--accent-main)]">web</span>
                    <h3 class="font-medium text-xl">Graphical Page Builder</h3>
                  </div>
                  
                  <select [ngModel]="selectedSection()" (ngModelChange)="loadSection($event)" class="bg-[var(--bg-secondary)] border border-[var(--text-primary)]/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent-main)] text-[var(--text-primary)]">
                    <option value="home">Home Page</option>
                    <option value="about">About Page</option>
                  </select>
                </div>
                
                <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  
                  @if (selectedSection() === 'home') {
                    <!-- Home Form Fields -->
                     <div class="space-y-8">
                       <!-- Hero Group -->
                       <div class="bg-[var(--bg-main)]/50 p-6 rounded-2xl border border-[var(--text-primary)]/5">
                          <h4 class="text-[var(--accent-main)] text-sm font-bold uppercase tracking-widest mb-4">Hero Configuration</h4>
                          <div class="space-y-4">
                             <div>
                               <label for="hero-title" class="block text-xs text-[var(--text-muted)] mb-2">Primary Title</label>
                               <input id="hero-title" type="text" [(ngModel)]="pageData().heroTitle" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-2xl font-display focus:border-[var(--accent-main)] outline-none" />
                             </div>
                             <div>
                               <label for="hero-subtitle" class="block text-xs text-[var(--text-muted)] mb-2">Subtitle Tagline</label>
                               <input id="hero-subtitle" type="text" [(ngModel)]="pageData().heroSubtitle" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-sm focus:border-[var(--accent-main)] outline-none" />
                             </div>
                          </div>
                       </div>

                       <!-- Philosophy Group -->
                       <div class="bg-[var(--bg-main)]/50 p-6 rounded-2xl border border-[var(--text-primary)]/5">
                          <h4 class="text-[var(--accent-main)] text-sm font-bold uppercase tracking-widest mb-4">Philosophy Section</h4>
                          <div class="space-y-4">
                             <div>
                               <label for="philosophy-title" class="block text-xs text-[var(--text-muted)] mb-2">Philosophy Title</label>
                               <input id="philosophy-title" type="text" [(ngModel)]="pageData().philosophyTitle" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-xl font-display focus:border-[var(--accent-main)] outline-none" />
                             </div>
                             <div>
                               <label for="philosophy-body" class="block text-xs text-[var(--text-muted)] mb-2">Philosophy Body</label>
                               <textarea id="philosophy-body" [(ngModel)]="pageData().philosophyBody" class="w-full bg-transparent border border-[var(--text-primary)]/20 rounded-lg p-4 py-2 text-sm focus:border-[var(--accent-main)] outline-none min-h-[120px] resize-none"></textarea>
                             </div>
                          </div>
                       </div>

                       <!-- Services Header Group -->
                       <div class="bg-[var(--bg-main)]/50 p-6 rounded-2xl border border-[var(--text-primary)]/5">
                          <h4 class="text-[var(--accent-main)] text-sm font-bold uppercase tracking-widest mb-4">Services Header</h4>
                          <div class="space-y-4">
                             <div>
                               <label for="services-title" class="block text-xs text-[var(--text-muted)] mb-2">Services Title</label>
                               <input id="services-title" type="text" [(ngModel)]="pageData().servicesTitle" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-xl font-display focus:border-[var(--accent-main)] outline-none" />
                             </div>
                             <div>
                               <label for="services-subtitle" class="block text-xs text-[var(--text-muted)] mb-2">Services Subtitle</label>
                               <input id="services-subtitle" type="text" [(ngModel)]="pageData().servicesSubtitle" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-sm focus:border-[var(--accent-main)] outline-none" />
                             </div>
                          </div>
                       </div>

                       <!-- Dynamic Services Grid Array -->
                       <div class="bg-[var(--bg-main)]/50 p-6 rounded-2xl border border-[var(--text-primary)]/5">
                          <div class="flex justify-between items-center mb-6">
                            <h4 class="text-[var(--accent-main)] text-sm font-bold uppercase tracking-widest">Services Grid Integration</h4>
                            <button (click)="addServiceItem()" class="px-4 py-2 bg-[var(--text-primary)]/10 rounded-full hover:bg-[var(--text-primary)] hover:text-black transition-colors text-xs font-bold">+ Attach Service</button>
                          </div>
                          
                          <div class="space-y-6">
                            @for (svc of pageData().servicesList; track $index) {
                              <div class="relative bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--text-primary)]/10 group">
                                <button (click)="removeServiceItem($index)" class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500/20 text-red-500 border border-red-500/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span class="material-icons text-[16px]">close</span>
                                </button>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                     <label [for]="'svc-title-' + $index" class="block text-xs text-[var(--text-muted)] mb-2">Service Header ({{ $index + 1 }})</label>
                                     <input [id]="'svc-title-' + $index" type="text" [(ngModel)]="svc.title" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-xl font-display focus:border-[var(--accent-main)] outline-none" />
                                  </div>
                                  <div>
                                    <label [for]="'svc-category-' + $index" class="block text-xs text-[var(--text-muted)] mb-2">Category Badge</label>
                                    <input [id]="'svc-category-' + $index" type="text" [(ngModel)]="svc.category" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-sm focus:border-[var(--accent-main)] outline-none uppercase font-mono tracking-widest text-[var(--accent-main)]" />
                                  </div>
                                  <div class="md:col-span-2">
                                     <label [for]="'svc-desc-' + $index" class="block text-xs text-[var(--text-muted)] mb-2">Detailed Description</label>
                                     <textarea [id]="'svc-desc-' + $index" [(ngModel)]="svc.description" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-sm focus:border-[var(--accent-main)] outline-none min-h-[80px] resize-none"></textarea>
                                  </div>
                                </div>
                              </div>
                            } @empty {
                              <p class="text-sm text-[var(--text-muted)] text-center py-4">No services mapped yet. Click "Attach Service" to begin.</p>
                            }
                          </div>
                       </div>
                     </div>
                  } @else if (selectedSection() === 'about') {
                    <!-- About Form Fields -->
                    <div class="space-y-8">
                       <div class="bg-[var(--bg-main)]/50 p-6 rounded-2xl border border-[var(--text-primary)]/5">
                          <h4 class="text-[var(--accent-main)] text-sm font-bold uppercase tracking-widest mb-4">Hero Configuration</h4>
                          <div class="space-y-4">
                             <div>
                               <label for="about-hero-title" class="block text-xs text-[var(--text-muted)] mb-2">Hero Title</label>
                               <input id="about-hero-title" type="text" [(ngModel)]="pageData().heroTitle" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-2xl font-display focus:border-[var(--accent-main)] outline-none" />
                             </div>
                             <div>
                               <label for="about-hero-subtitle" class="block text-xs text-[var(--text-muted)] mb-2">Hero Subtitle</label>
                               <input id="about-hero-subtitle" type="text" [(ngModel)]="pageData().heroSubtitle" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-sm focus:border-[var(--accent-main)] outline-none" />
                             </div>
                          </div>
                       </div>

                       <div class="bg-[var(--bg-main)]/50 p-6 rounded-2xl border border-[var(--text-primary)]/5">
                          <h4 class="text-[var(--accent-main)] text-sm font-bold uppercase tracking-widest mb-4">Core Philosophy Header</h4>
                          <div class="space-y-4">
                             <div>
                               <label for="about-title" class="block text-xs text-[var(--text-muted)] mb-2">Title</label>
                               <input id="about-title" type="text" [(ngModel)]="pageData().title" class="w-full bg-transparent border-b border-[var(--text-primary)]/20 py-2 text-2xl font-display focus:border-[var(--accent-main)] outline-none" />
                             </div>
                             <div>
                               <label for="about-content" class="block text-xs text-[var(--text-muted)] mb-2">Brand Identity Paragraph</label>
                               <textarea id="about-content" [(ngModel)]="pageData().content" class="w-full bg-transparent border border-[var(--text-primary)]/20 rounded-lg p-4 py-2 text-sm focus:border-[var(--accent-main)] outline-none min-h-[300px] resize-none"></textarea>
                             </div>
                          </div>
                       </div>
                    </div>
                  }
                  
                </div>
                
                <div class="flex items-center justify-between mt-8 pt-6 border-t border-[var(--text-primary)]/5">
                  <span class="text-xs text-[var(--text-muted)]"><span class="material-icons text-[14px] align-text-bottom text-green-400">cloud_done</span> Live sync to DB enabled</span>
                  <button (click)="saveContent()" [disabled]="saving()" class="tesla-btn px-10 py-4 rounded-full bg-[var(--accent-main)] text-[var(--bg-main)] font-bold text-sm uppercase tracking-widest inline-flex items-center gap-3 disabled:opacity-50">
                    <span class="material-icons text-[18px]">{{ saveSuccess() ? 'check' : 'cloud_upload' }}</span>
                    {{ saving() ? 'Syncing Pipeline...' : (saveSuccess() ? 'Sync Complete' : 'Deploy Configuration') }}
                  </button>
                </div>
              </div>

              <!-- Client Projects -->
              <div class="glass-panel p-8 md:p-10 rounded-[2rem] border border-[var(--text-primary)]/10">
                <div class="flex items-center gap-3 mb-6">
                  <span class="material-icons text-[var(--accent-main)]">rocket_launch</span>
                  <div>
                    <h3 class="font-medium text-xl">Client Projects</h3>
                    <p class="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-mono">Assign a project to unlock portal tickets for that client</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <input type="email" [ngModel]="projectFormEmail()" (ngModelChange)="projectFormEmail.set($event)" placeholder="client@email.com" class="w-full bg-transparent border border-[var(--text-primary)]/20 rounded-2xl px-5 py-3 text-sm focus:border-[var(--accent-main)] outline-none" />
                  <input type="text" [ngModel]="projectFormTitle()" (ngModelChange)="projectFormTitle.set($event)" placeholder="Project title" class="w-full bg-transparent border border-[var(--text-primary)]/20 rounded-2xl px-5 py-3 text-sm focus:border-[var(--accent-main)] outline-none" />
                  <select [ngModel]="projectFormStatus()" (ngModelChange)="projectFormStatus.set($event)" class="w-full bg-[#0a0a0a] border border-[var(--text-primary)]/20 rounded-2xl px-5 py-3 text-xs uppercase tracking-widest outline-none">
                    <option value="queued">Queued</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                  <input type="number" min="0" max="100" [ngModel]="projectFormProgress()" (ngModelChange)="projectFormProgress.set(+$event || 0)" placeholder="Progress %" class="w-full bg-transparent border border-[var(--text-primary)]/20 rounded-2xl px-5 py-3 text-sm focus:border-[var(--accent-main)] outline-none" />
                  <textarea rows="3" [ngModel]="projectFormNotes()" (ngModelChange)="projectFormNotes.set($event)" placeholder="Notes visible to client" class="md:col-span-2 w-full bg-transparent border border-[var(--text-primary)]/20 rounded-2xl px-5 py-3 text-sm focus:border-[var(--accent-main)] outline-none resize-y"></textarea>
                </div>
                <div class="flex flex-wrap gap-3 mb-8">
                  <button (click)="savePortalProject()" [disabled]="portalSaving()" class="px-6 py-3 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-main)] text-xs font-bold uppercase tracking-widest disabled:opacity-40">
                    {{ projectFormId() ? 'Update Project' : 'Create Project' }}
                  </button>
                  @if (projectFormId()) {
                    <button (click)="resetProjectForm()" class="px-6 py-3 rounded-2xl border border-[var(--text-primary)]/20 text-xs uppercase tracking-widest">Cancel Edit</button>
                  }
                </div>
                @if (portalProjectsMsg()) {
                  <p class="text-xs text-cyan-200 mb-4">{{ portalProjectsMsg() }}</p>
                }
                <div class="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  @for (project of portalProjects(); track project.id) {
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                      <div class="min-w-0">
                        <div class="text-sm truncate">{{ project.title }}</div>
                        <div class="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-mono">{{ project.clientEmail }} · {{ project.status }} · {{ project.progress }}%</div>
                      </div>
                      <div class="flex gap-3 shrink-0">
                        <button (click)="editPortalProject(project)" class="text-[10px] uppercase tracking-widest text-cyan-300">Edit</button>
                        <button (click)="deletePortalProject(project.id)" class="text-[10px] uppercase tracking-widest text-red-300">Delete</button>
                      </div>
                    </div>
                  } @empty {
                    <p class="text-xs text-[var(--text-muted)] text-center py-6">No client projects yet.</p>
                  }
                </div>
              </div>

              <!-- Support Tickets -->
              <div class="glass-panel p-8 md:p-10 rounded-[2rem] border border-[var(--text-primary)]/10">
                <div class="flex items-center gap-3 mb-6">
                  <span class="material-icons text-[var(--accent-main)]">support_agent</span>
                  <div>
                    <h3 class="font-medium text-xl">Priority Support</h3>
                    <p class="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-mono">Thread replies · filters · attachments</p>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  <input type="search" [ngModel]="ticketSearch()" (ngModelChange)="ticketSearch.set($event); loadPortalAdminData()" placeholder="Search email or subject" class="w-full bg-transparent border border-[var(--text-primary)]/20 rounded-2xl px-5 py-3 text-sm outline-none focus:border-[var(--accent-main)]" />
                  <select [ngModel]="ticketFilter()" (ngModelChange)="ticketFilter.set($event); loadPortalAdminData()" class="w-full bg-[#0a0a0a] border border-[var(--text-primary)]/20 rounded-2xl px-5 py-3 text-xs uppercase tracking-widest outline-none">
                    <option value="">All statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                @if (portalTicketsMsg()) {
                  <p class="text-xs text-cyan-200 mb-4">{{ portalTicketsMsg() }}</p>
                }
                <div class="space-y-4 max-h-[36rem] overflow-y-auto custom-scrollbar">
                  @for (ticket of portalTickets(); track ticket.id) {
                    <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
                      <div class="flex flex-wrap justify-between gap-2">
                        <div>
                          <div class="text-sm font-medium">{{ ticket.subject }}</div>
                          <div class="text-[10px] uppercase tracking-widest font-mono text-[var(--text-muted)]">{{ ticket.clientEmail }} · {{ ticket.priority }} · {{ ticket.updatedAt ? (ticket.updatedAt | date:'short') : '' }}</div>
                        </div>
                        <select [ngModel]="ticket.status" (ngModelChange)="updateTicketStatus(ticket.id, $event)" class="bg-[#0a0a0a] border border-[var(--text-primary)]/20 rounded-xl px-3 py-2 text-[10px] uppercase tracking-widest outline-none">
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <div class="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        @for (msg of ticket.messages || []; track msg.id) {
                          <div class="rounded-xl border px-3 py-2" [class.border-cyan-300/20]="msg.authorRole === 'admin'" [class.bg-cyan-300/5]="msg.authorRole === 'admin'" [class.border-white/10]="msg.authorRole !== 'admin'">
                            <div class="text-[9px] uppercase tracking-widest font-mono text-[var(--text-muted)] mb-1">{{ msg.authorRole }} · {{ msg.authorEmail }}</div>
                            <p class="text-sm whitespace-pre-wrap">{{ msg.body }}</p>
                          </div>
                        } @empty {
                          <p class="text-sm text-[var(--text-muted)] whitespace-pre-wrap">{{ ticket.message }}</p>
                        }
                      </div>

                      @if (ticket.attachments?.length) {
                        <div class="flex flex-wrap gap-2">
                          @for (file of ticket.attachments; track file.id) {
                            <a [href]="file.url" target="_blank" rel="noopener" class="text-[10px] uppercase tracking-widest font-mono px-3 py-1 rounded-full border border-white/15 hover:border-cyan-300">{{ file.fileName }}</a>
                          }
                        </div>
                      }

                      <textarea rows="2" [ngModel]="ticketReplyDraft(ticket.id)" (ngModelChange)="setTicketReplyDraft(ticket.id, $event)" placeholder="Team reply (emails the client)" class="w-full bg-transparent border border-[var(--text-primary)]/20 rounded-xl px-4 py-3 text-sm outline-none resize-y"></textarea>
                      <div class="flex flex-wrap gap-3">
                        <button (click)="saveTicketReply(ticket.id)" class="px-4 py-2 rounded-xl border border-[var(--text-primary)]/20 text-[10px] uppercase tracking-widest hover:border-[var(--accent-main)]">Send Reply</button>
                        <label class="px-4 py-2 rounded-xl border border-[var(--text-primary)]/20 text-[10px] uppercase tracking-widest cursor-pointer hover:border-cyan-300">
                          Attach file
                          <input type="file" class="hidden" (change)="uploadTicketAttachment(ticket.id, $event)" />
                        </label>
                      </div>
                    </div>
                  } @empty {
                    <p class="text-xs text-[var(--text-muted)] text-center py-6">No support tickets yet.</p>
                  }
                </div>
              </div>
            </div>

            <!-- Right Panel: Visual Control & Settings -->
            <div class="lg:col-span-4 flex flex-col gap-8">
              
              <!-- Cinematic Engine -->
              <div class="glass-panel p-8 rounded-[2rem] border border-[var(--text-primary)]/10">
                <div class="flex items-center gap-3 mb-8">
                  <span class="material-icons text-[var(--accent-main)]">tune</span>
                  <h3 class="font-medium text-xl">Visual Engine</h3>
                </div>
                
                <div class="space-y-8">
                  <div>
                    <div class="flex justify-between text-xs font-mono tracking-widest uppercase mb-4 text-[var(--text-muted)]">
                      <span>Engine Speed</span>
                      <span class="text-[var(--text-primary)]">{{ store.animationSpeed() | number:'1.1-1' }}x</span>
                    </div>
                    <input type="range" min="0.1" max="3" step="0.1" [ngModel]="store.animationSpeed()" (ngModelChange)="updateVisuals('speed', $event)" class="w-full accent-[var(--accent-main)]">
                  </div>

                  <div>
                    <div class="flex justify-between text-xs font-mono tracking-widest uppercase mb-4 text-[var(--text-muted)]">
                      <span>Glow Bloom</span>
                      <span class="text-[var(--text-primary)]">{{ store.glowIntensity() | number:'1.1-1' }}</span>
                    </div>
                    <input type="range" min="0" max="2" step="0.1" [ngModel]="store.glowIntensity()" (ngModelChange)="updateVisuals('glow', $event)" class="w-full accent-[var(--accent-main)]">
                  </div>

                  <div class="flex justify-between items-center py-4 border-t border-[var(--text-primary)]/10">
                    <span class="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">Immersive Shaders</span>
                    <button (click)="toggleFeature('3d')" class="w-12 h-6 rounded-full relative transition-colors duration-300" [class.bg-[var(--accent-main)]]="store.enable3D()" [class.bg-[var(--bg-secondary)]]="!store.enable3D()">
                      <span class="absolute top-1 left-1 w-4 h-4 bg-[var(--text-primary)] rounded-full transition-transform duration-300" [class.translate-x-6]="store.enable3D()"></span>
                    </button>
                  </div>

                  <div class="flex justify-between items-center py-4 border-t border-[var(--text-primary)]/10">
                    <span class="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">Motion Physics</span>
                    <button (click)="toggleFeature('anim')" class="w-12 h-6 rounded-full relative transition-colors duration-300" [class.bg-[var(--accent-main)]]="store.enableAnimations()" [class.bg-[var(--bg-secondary)]]="!store.enableAnimations()">
                      <span class="absolute top-1 left-1 w-4 h-4 bg-[var(--text-primary)] rounded-full transition-transform duration-300" [class.translate-x-6]="store.enableAnimations()"></span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Media Status Widget -->
              <div class="glass-panel p-6 rounded-[2rem] border border-[var(--text-primary)]/10 text-center flex justify-center items-center flex-col min-h-[200px] relative overflow-hidden">
                <div class="absolute inset-0 bg-[url('/assets/images/abstract_violet_glass_1774035496290.png')] bg-cover bg-center opacity-20 pointer-events-none mix-blend-screen"></div>
                <span class="material-icons text-4xl text-green-400 mb-4 relative z-10">photo_library</span>
                <p class="text-xs text-[var(--text-muted)] uppercase font-mono tracking-widest relative z-10 block mb-2">Media Assets Deployed</p>
                <p class="text-[10px] text-[var(--text-primary)] relative z-10 opacity-70">Awwwards 3D Renders Online</p>
              </div>

              <!-- Forge AI Access Control -->
              <div class="glass-panel p-8 md:p-10 rounded-[2rem] border border-cyan-400/20">
                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                  <div class="flex items-start gap-4">
                    <span class="material-icons text-cyan-300 text-2xl mt-0.5">auto_awesome</span>
                    <div class="space-y-1.5">
                      <h3 class="font-medium text-xl tracking-tight">Forge AI Access</h3>
                      <p class="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-mono leading-relaxed">Grant or revoke builder seats</p>
                    </div>
                  </div>
                  <a routerLink="/pricing" class="self-start text-[10px] uppercase tracking-widest font-mono text-cyan-300 hover:text-cyan-100 border border-cyan-300/30 rounded-full px-4 py-2 shrink-0">
                    Pricing plans
                  </a>
                </div>

                <div class="flex flex-col gap-5 mb-8">
                  <div class="flex flex-col gap-2">
                    <label class="text-[10px] uppercase tracking-widest font-mono text-[var(--text-muted)]">Client email</label>
                    <input
                      type="email"
                      [ngModel]="forgeAccessEmail()"
                      (ngModelChange)="forgeAccessEmail.set($event)"
                      class="w-full bg-transparent border border-[var(--text-primary)]/20 rounded-2xl px-5 py-3.5 text-sm focus:border-cyan-300 outline-none"
                      placeholder="client@email.com" />
                  </div>

                  <div class="grid grid-cols-1 gap-5">
                    <div class="flex flex-col gap-2">
                      <label class="text-[10px] uppercase tracking-widest font-mono text-[var(--text-muted)]">Access plan</label>
                      <select
                        [ngModel]="forgeAccessPlan()"
                        (ngModelChange)="onForgePlanChange($event)"
                        class="w-full bg-[#0a0a0a] border border-[var(--text-primary)]/20 rounded-2xl px-5 py-3.5 text-xs uppercase tracking-widest focus:border-cyan-300 outline-none">
                        <option value="forge_bundle">Forge Bundle — 100 credits</option>
                        <option value="enterprise">Enterprise (custom) — 500+ credits</option>
                        <option value="developer">Developer — admin panel + unlimited</option>
                      </select>
                    </div>

                    <div class="flex flex-col gap-2">
                      <label class="text-[10px] uppercase tracking-widest font-mono text-[var(--text-muted)]">Credits pack</label>
                      @if (forgeAccessPlan() !== 'developer') {
                        <input
                          type="number"
                          min="1"
                          [ngModel]="forgeAccessCredits()"
                          (ngModelChange)="forgeAccessCredits.set(+$event || packDefaultForPlan())"
                          class="w-full bg-transparent border border-[var(--text-primary)]/20 rounded-2xl px-5 py-3.5 text-sm focus:border-cyan-300 outline-none"
                          [attr.placeholder]="forgeAccessPlan() === 'enterprise' ? 'Credits (default 500)' : 'Credits (default 100)'" />
                      } @else {
                        <div class="flex items-center px-5 py-3.5 rounded-2xl border border-white/10 text-[10px] uppercase tracking-widest text-[var(--text-muted)] min-h-[52px]">
                          Unlimited credits
                        </div>
                      }
                    </div>
                  </div>

                  @if (forgeAccessPlan() === 'forge_bundle') {
                    <p class="text-[11px] text-[var(--text-muted)] leading-relaxed px-1">
                      Manual grant for <a routerLink="/pricing" class="text-cyan-300 hover:underline">Forge AI Bundle ($9.99)</a>.
                      Granting the same email again <strong class="text-[var(--text-primary)] font-medium">refills</strong> by adding another 100-credit pack.
                    </p>
                  } @else if (forgeAccessPlan() === 'enterprise') {
                    <p class="text-[11px] text-[var(--text-muted)] leading-relaxed px-1">
                      Manual grant for <a routerLink="/pricing" class="text-cyan-300 hover:underline">Enterprise (custom)</a> — more credits than Forge Bundle.
                      Re-granting the same email also refills by adding another pack.
                    </p>
                  } @else if (forgeAccessPlan() === 'developer') {
                    <p class="text-[11px] text-[var(--text-muted)] leading-relaxed px-1">
                      Grants <strong class="text-[var(--text-primary)] font-medium">Admin panel access</strong> plus Forge AI with unlimited credits.
                    </p>
                  }

                  <button
                    (click)="grantForgeAccess()"
                    [disabled]="forgeAccessLoading() || !forgeAccessEmail().trim()"
                    class="w-full mt-1 py-4 rounded-2xl bg-cyan-300 text-black text-xs font-bold uppercase tracking-widest disabled:opacity-40">
                    {{ grantButtonLabel() }}
                  </button>
                </div>

                <div class="border-t border-white/10 pt-6">
                  <p class="text-[10px] uppercase tracking-widest font-mono text-[var(--text-muted)] mb-4">Active seats</p>
                  <div class="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    @for (seat of forgeAccessSeats(); track seat.email) {
                      <div class="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                        <div class="min-w-0 space-y-1">
                          <div class="truncate text-sm text-[var(--text-primary)]">{{ seat.email }}</div>
                          <div class="text-[9px] uppercase tracking-widest leading-relaxed" [ngClass]="seat.role === 'developer' ? 'text-cyan-300' : 'text-[var(--text-muted)]'">
                            {{ seat.label }}
                          </div>
                        </div>
                        @if (seat.revocable) {
                          <button (click)="revokeForgeAccess(seat.email)" class="text-[10px] uppercase tracking-widest text-red-300 hover:text-red-200 shrink-0 px-2 py-1">Revoke</button>
                        }
                      </div>
                    } @empty {
                      <p class="text-xs text-[var(--text-muted)] text-center py-8">No Forge seats loaded yet.</p>
                    }
                  </div>
                </div>

                @if (forgeAccessMsg()) {
                  <p class="mt-6 text-xs text-center text-cyan-200 leading-relaxed">{{ forgeAccessMsg() }}</p>
                }
              </div>

              <!-- Security Settings -->
              <div class="glass-panel p-8 rounded-[2rem] border border-[var(--text-primary)]/10">
                <div class="flex items-center gap-3 mb-6">
                  <span class="material-icons text-[var(--accent-main)]">security</span>
                  <h3 class="font-medium text-xl">Security Settings</h3>
                </div>
                <div class="space-y-4">
                  <div>
                    <label for="new-password" class="block text-xs text-[var(--text-muted)] mb-2">Update Password</label>
                    <input id="new-password" type="password" [ngModel]="newPassword()" (ngModelChange)="newPassword.set($event)" class="w-full bg-transparent border border-[var(--text-primary)]/20 rounded-lg px-4 py-3 text-sm focus:border-[var(--accent-main)] outline-none" placeholder="Enter new password" />
                  </div>
                  <button (click)="updatePassword()" [disabled]="!newPassword() || updatingPassword()" class="w-full py-3 rounded-xl border border-[var(--text-primary)]/20 hover:bg-[var(--text-primary)]/10 transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50">
                    {{ updatingPassword() ? 'Updating...' : 'Save New Password' }}
                  </button>
                  @if (passwordMsg()) {
                    <p class="text-xs text-center mt-2" [class.text-green-400]="passwordSuccess()" [class.text-red-400]="!passwordSuccess()">{{ passwordMsg() }}</p>
                  }
                </div>
              </div>

            </div>
          </div>
        </div>
      }
    </div>

    @if (confirmOpen()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm" (click)="closeConfirm()">
        <div class="glass-panel w-full max-w-md rounded-[2rem] border border-[var(--text-primary)]/15 p-8 relative" (click)="$event.stopPropagation()">
          <h3 class="text-xl font-display font-medium mb-3">{{ confirmTitle() }}</h3>
          <p class="text-sm text-[var(--text-muted)] leading-relaxed mb-8 whitespace-pre-line">{{ confirmBody() }}</p>
          <div class="flex flex-wrap gap-3 justify-end">
            <button type="button" (click)="closeConfirm()" class="px-5 py-3 rounded-xl border border-[var(--text-primary)]/20 text-xs uppercase tracking-widest font-mono hover:border-[var(--text-primary)]/40">
              Cancel
            </button>
            <button type="button" (click)="acceptConfirm()" class="px-5 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-main)] text-xs font-bold uppercase tracking-widest">
              Confirm
            </button>
          </div>
        </div>
      </div>
    }
    
    <app-footer></app-footer>
  `
})
export class AdminComponent {
  isProduction = !!environment.production;
  email = signal('');
  password = signal('');
  loading = signal(false);
  saving = signal(false);
  saveSuccess = signal(false);
  error = signal('');
  
  newPassword = signal('');
  updatingPassword = signal(false);
  passwordMsg = signal('');
  passwordSuccess = signal(false);
  forgeAccessEmail = signal('');
  forgeAccessPlan = signal<'forge_bundle' | 'enterprise' | 'developer'>('forge_bundle');
  forgeAccessCredits = signal(100);
  forgeAccessSeats = signal<ForgeSeat[]>([]);
  forgeAccessMsg = signal('');
  forgeAccessLoading = signal(false);

  portalProjects = signal<PortalProjectRow[]>([]);
  portalTickets = signal<PortalTicketRow[]>([]);
  portalSaving = signal(false);
  portalProjectsMsg = signal('');
  portalTicketsMsg = signal('');
  projectFormId = signal('');
  projectFormEmail = signal('');
  projectFormTitle = signal('');
  projectFormStatus = signal('queued');
  projectFormProgress = signal(0);
  projectFormNotes = signal('');
  ticketReplyDrafts = signal<Record<string, string>>({});
  ticketFilter = signal('');
  ticketSearch = signal('');
  confirmOpen = signal(false);
  confirmTitle = signal('');
  confirmBody = signal('');
  confirmKind = signal<'create-project' | 'delete-project' | null>(null);
  pendingDeleteId = signal('');

  selectedSection = signal('home');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pageData = signal<any>({});

  public store = inject(StoreService);
  public supabase = inject(SupabaseService);
  private forgeState = inject(ForgeStateService);
  private http = inject(HttpClient);

  private defaultBrandIdentity = "At the core of our software house lies a simple yet powerful purpose: to transform ideas into impactful digital solutions that drive growth, efficiency, and innovation. Our platform exists to bridge the gap between vision and execution—empowering businesses, startups, and individuals to bring their concepts to life through technology that is not only functional, but meaningful. We are committed to delivering high-quality software solutions tailored to the unique needs of each client. Whether it’s building scalable web applications, crafting intuitive mobile experiences, or developing robust backend systems, our goal is to create products that solve real-world problems and deliver long-term value. We don’t just build software—we build systems that enhance productivity, elevate user experience, and create opportunities for success in a rapidly evolving digital landscape. Our approach is rooted in creativity, precision, and collaboration. We believe that great products are born from a deep understanding of user needs combined with technical excellence. That’s why we focus on clean design, efficient performance, and reliable architecture in every project we undertake. Transparency, trust, and continuous improvement are at the heart of everything we do. This platform serves as a gateway to our expertise, showcasing our capabilities, our work, and our commitment to innovation. It is a space where ideas are nurtured, challenges are solved, and digital transformation becomes achievable. Our mission is not just to deliver software—but to empower our clients to grow, compete, and thrive in the modern world.";

  constructor() {
    if (this.supabase.tempAdminBypassEnabled) {
      this.email.set(this.supabase.tempAdminEmail);
      this.supabase.applyTempAdminBypass('admin-page');
    }

    afterNextRender(() => {
      this.supabase.checkSession();
      if (this.supabase.tempAdminBypassEnabled) {
        this.supabase.applyTempAdminBypass('admin-after-render');
      }
      if (this.supabase.isAdmin()) {
        this.loadSection(this.selectedSection());
        this.loadForgeAccessList();
        this.loadPortalAdminData();
        this.animateDashboard();
      }

      const buttons = document.querySelectorAll('.tesla-btn');
      buttons.forEach((btn: Element) => {
        btn.addEventListener('mouseenter', () => gsap.to(btn, { scale: 1.05, duration: 0.3, ease: 'power2.out', boxShadow: '0 0 30px rgba(108,140,255,0.4)' }));
        btn.addEventListener('mouseleave', () => gsap.to(btn, { scale: 1, duration: 0.3, ease: 'power2.out', boxShadow: 'none' }));
      });
    });

    effect(() => {
      if (this.supabase.isAdmin()) {
        this.loadSection(this.selectedSection());
        this.loadForgeAccessList();
        this.loadPortalAdminData();
      }
    });
  }

  async loginWithEmail() {
    if (!this.email() || !this.password()) return;
    this.loading.set(true);
    this.error.set('');
    
    const { error } = await this.supabase.loginWithEmail(this.email(), this.password());
    if (!error) {
      this.forgeState.initSession();
      // Automatic credit boost for admins
      this.http.post('/api/admin/upgrade-session', { 
        sessionId: this.forgeState.sessionId(), 
        email: this.email() 
      }).subscribe({
        next: (res: any) => this.forgeState.setCredits(res.credits),
        error: (err) => console.warn('Admin Forge boost failed', err)
      });
      setTimeout(() => this.animateDashboard(), 100);
      this.loadForgeAccessList();
    } else {
      const msg = (error as { message?: string })?.message || 'Access Denied: Invalid credentials.';
      console.error('[Admin Login]', error);
      this.error.set(msg);
    }
    this.loading.set(false);
  }

  private adminEmail(): string {
    return this.supabase.currentUser()?.email
      || this.email()
      || (this.supabase.tempAdminBypassEnabled ? this.supabase.tempAdminEmail : '');
  }

  private async authHeaders(json = true): Promise<Record<string, string>> {
    const token = await this.supabase.getAccessToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (json) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  async sendPasswordReset() {
    const target = (this.email() || this.supabase.tempAdminEmail).trim();
    if (!target) return;
    this.updatingPassword.set(true);
    this.passwordMsg.set('');
    const { error } = await this.supabase.sendPasswordReset(target);
    if (error) {
      this.passwordSuccess.set(false);
      this.passwordMsg.set((error as { message?: string }).message || 'Failed to send reset email.');
    } else {
      this.passwordSuccess.set(true);
      this.passwordMsg.set(`Reset email sent to ${target}. Check inbox/spam.`);
    }
    this.updatingPassword.set(false);
  }

  async updatePassword() {
    if (!this.newPassword()) return;
    this.updatingPassword.set(true);
    this.passwordMsg.set('');
    
    const { error } = await this.supabase.updatePassword(this.newPassword());
    
    if (error) {
      this.passwordSuccess.set(false);
      this.passwordMsg.set((error as { message?: string }).message || 'Failed to update password. Sign in with Google first, then try again.');
    } else {
      this.passwordSuccess.set(true);
      this.passwordMsg.set('Password updated successfully!');
      this.newPassword.set('');
    }
    
    this.updatingPassword.set(false);
    setTimeout(() => this.passwordMsg.set(''), 4000);
  }

  async loadForgeAccessList() {
    if (!this.supabase.isAdmin()) return;
    this.forgeAccessLoading.set(true);
    this.forgeAccessMsg.set('');
    try {
      const admin = this.adminEmail();
      if (!admin) {
        this.forgeAccessMsg.set('Admin email missing — re-login to admin.');
        return;
      }
      const response = await fetch(`/api/admin/forge-access?adminEmail=${encodeURIComponent(admin)}`, {
        headers: await this.authHeaders()
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Could not load seats (${response.status}). Is the backend running?`);
      }
      const seats = Array.isArray(data.seats) ? data.seats : [];
      this.forgeAccessSeats.set(seats);
      if (!seats.length && Array.isArray(data.allowedEmails) && data.allowedEmails.length) {
        // Fallback for older API shapes
        this.forgeAccessSeats.set(
          data.allowedEmails.map((email: string) => ({
            email,
            role: 'client' as const,
            plan: 'forge_bundle',
            credits: 100,
            label: `Access · ${email}`,
            revocable: email !== 'azeem.makhdum6@gmail.com' && email !== 'abbas585@gmail.com'
          }))
        );
      }
    } catch (error: any) {
      console.warn('Forge access list failed', error);
      this.forgeAccessMsg.set(error.message || 'Failed to load Forge seats — start backend with npm start');
    } finally {
      this.forgeAccessLoading.set(false);
    }
  }

  async loadPortalAdminData() {
    if (!this.supabase.isAdmin()) return;
    const admin = this.adminEmail();
    if (!admin) return;
    try {
      const params = new URLSearchParams({ adminEmail: admin });
      if (this.ticketFilter()) params.set('status', this.ticketFilter());
      if (this.ticketSearch().trim()) params.set('q', this.ticketSearch().trim());
      const headers = await this.authHeaders();
      const [projectsRes, ticketsRes] = await Promise.all([
        fetch(`/api/admin/portal/projects?adminEmail=${encodeURIComponent(admin)}`, { headers }),
        fetch(`/api/admin/portal/tickets?${params.toString()}`, { headers })
      ]);
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        this.portalProjects.set(Array.isArray(data.projects) ? data.projects : []);
      }
      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        const tickets = Array.isArray(data.tickets) ? data.tickets : [];
        this.portalTickets.set(tickets);
        const drafts: Record<string, string> = { ...this.ticketReplyDrafts() };
        for (const ticket of tickets) {
          if (drafts[ticket.id] == null) drafts[ticket.id] = '';
        }
        this.ticketReplyDrafts.set(drafts);
      }
    } catch (error) {
      console.warn('Portal admin data load failed', error);
    }
  }

  resetProjectForm() {
    this.projectFormId.set('');
    this.projectFormEmail.set('');
    this.projectFormTitle.set('');
    this.projectFormStatus.set('queued');
    this.projectFormProgress.set(0);
    this.projectFormNotes.set('');
  }

  editPortalProject(project: PortalProjectRow) {
    this.projectFormId.set(project.id);
    this.projectFormEmail.set(project.clientEmail);
    this.projectFormTitle.set(project.title);
    this.projectFormStatus.set(project.status || 'queued');
    this.projectFormProgress.set(project.progress || 0);
    this.projectFormNotes.set(project.notes || '');
  }

  async savePortalProject() {
    const admin = this.adminEmail();
    if (!admin) {
      this.portalProjectsMsg.set('Admin email missing — re-login.');
      return;
    }
    if (!this.projectFormId()) {
      this.openConfirm(
        'Create client project?',
        `Create project for ${this.projectFormEmail().trim()}?\n\nThis unlocks their portal tickets and emails them.`,
        'create-project'
      );
      return;
    }
    await this.executeSavePortalProject();
  }

  private openConfirm(title: string, body: string, kind: 'create-project' | 'delete-project') {
    this.confirmTitle.set(title);
    this.confirmBody.set(body);
    this.confirmKind.set(kind);
    this.confirmOpen.set(true);
  }

  closeConfirm() {
    this.confirmOpen.set(false);
    this.confirmKind.set(null);
    this.pendingDeleteId.set('');
  }

  async acceptConfirm() {
    const kind = this.confirmKind();
    this.confirmOpen.set(false);
    if (kind === 'create-project') {
      this.confirmKind.set(null);
      await this.executeSavePortalProject();
      return;
    }
    if (kind === 'delete-project') {
      const id = this.pendingDeleteId();
      this.confirmKind.set(null);
      this.pendingDeleteId.set('');
      await this.executeDeletePortalProject(id);
    }
  }

  private async executeSavePortalProject() {
    const admin = this.adminEmail();
    if (!admin) {
      this.portalProjectsMsg.set('Admin email missing — re-login.');
      return;
    }
    this.portalSaving.set(true);
    this.portalProjectsMsg.set('');
    try {
      const response = await fetch('/api/admin/portal/projects', {
        method: 'POST',
        headers: await this.authHeaders(),
        body: JSON.stringify({
          adminEmail: admin,
          id: this.projectFormId() || undefined,
          clientEmail: this.projectFormEmail().trim(),
          title: this.projectFormTitle().trim(),
          status: this.projectFormStatus(),
          progress: this.projectFormProgress(),
          notes: this.projectFormNotes()
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to save project');
      this.portalProjects.set(Array.isArray(data.projects) ? data.projects : []);
      this.portalProjectsMsg.set(this.projectFormId() ? 'Project updated.' : 'Project created.');
      this.resetProjectForm();
    } catch (error: any) {
      this.portalProjectsMsg.set(error.message || 'Failed to save project');
    } finally {
      this.portalSaving.set(false);
      setTimeout(() => this.portalProjectsMsg.set(''), 4000);
    }
  }

  async deletePortalProject(id: string) {
    const admin = this.adminEmail();
    if (!admin || !id) return;
    this.pendingDeleteId.set(id);
    this.openConfirm(
      'Delete project?',
      'Delete this client project? They may lose ticket access if it was their only project.',
      'delete-project'
    );
  }

  private async executeDeletePortalProject(id: string) {
    const admin = this.adminEmail();
    if (!admin || !id) return;
    try {
      const response = await fetch('/api/admin/portal/projects/delete', {
        method: 'POST',
        headers: await this.authHeaders(),
        body: JSON.stringify({ adminEmail: admin, id })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to delete');
      this.portalProjects.set(Array.isArray(data.projects) ? data.projects : []);
      if (this.projectFormId() === id) this.resetProjectForm();
      this.portalProjectsMsg.set('Project deleted.');
    } catch (error: any) {
      this.portalProjectsMsg.set(error.message || 'Failed to delete project');
    } finally {
      setTimeout(() => this.portalProjectsMsg.set(''), 4000);
    }
  }

  ticketReplyDraft(id: string): string {
    return this.ticketReplyDrafts()[id] || '';
  }

  setTicketReplyDraft(id: string, value: string) {
    this.ticketReplyDrafts.set({ ...this.ticketReplyDrafts(), [id]: value });
  }

  async updateTicketStatus(id: string, status: string) {
    await this.patchTicket(id, { status });
  }

  async saveTicketReply(id: string) {
    await this.patchTicket(id, {
      adminReply: this.ticketReplyDraft(id),
      status: this.portalTickets().find((t) => t.id === id)?.status
    });
    this.setTicketReplyDraft(id, '');
  }

  async uploadTicketAttachment(id: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const admin = this.adminEmail();
    if (!file || !admin || !id) return;
    this.portalTicketsMsg.set('');
    try {
      const form = new FormData();
      form.append('adminEmail', admin);
      form.append('file', file);
      const headers = await this.authHeaders(false);
      delete (headers as any)['Content-Type'];
      const response = await fetch(`/api/admin/portal/tickets/${id}/attachments`, {
        method: 'POST',
        headers,
        body: form
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Upload failed');
      if (Array.isArray(data.tickets)) this.portalTickets.set(data.tickets);
      else await this.loadPortalAdminData();
      this.portalTicketsMsg.set('Attachment uploaded.');
    } catch (error: any) {
      this.portalTicketsMsg.set(error.message || 'Upload failed');
    } finally {
      input.value = '';
      setTimeout(() => this.portalTicketsMsg.set(''), 4000);
    }
  }

  private async patchTicket(id: string, patch: { status?: string; adminReply?: string }) {
    const admin = this.adminEmail();
    if (!admin || !id) return;
    this.portalTicketsMsg.set('');
    try {
      const response = await fetch('/api/admin/portal/tickets', {
        method: 'POST',
        headers: await this.authHeaders(),
        body: JSON.stringify({
          adminEmail: admin,
          id,
          status: patch.status,
          adminReply: patch.adminReply
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to update ticket');
      const tickets = Array.isArray(data.tickets) ? data.tickets : [];
      this.portalTickets.set(tickets);
      if (data.ticket) {
        this.setTicketReplyDraft(data.ticket.id, data.ticket.adminReply || '');
      }
      this.portalTicketsMsg.set('Ticket updated.');
    } catch (error: any) {
      this.portalTicketsMsg.set(error.message || 'Failed to update ticket');
    } finally {
      setTimeout(() => this.portalTicketsMsg.set(''), 4000);
    }
  }

  packDefaultForPlan(plan = this.forgeAccessPlan()): number {
    if (plan === 'enterprise') return 500;
    if (plan === 'developer') return 999999;
    return 100;
  }

  onForgePlanChange(plan: 'forge_bundle' | 'enterprise' | 'developer') {
    this.forgeAccessPlan.set(plan);
    if (plan !== 'developer') {
      this.forgeAccessCredits.set(this.packDefaultForPlan(plan));
    }
  }

  grantButtonLabel(): string {
    const plan = this.forgeAccessPlan();
    if (plan === 'developer') return 'Grant Admin / Developer Access';
    if (plan === 'enterprise') return 'Grant / Refill Enterprise Credits';
    return 'Grant / Refill Forge Bundle Credits';
  }

  async grantForgeAccess() {
    const email = this.forgeAccessEmail().trim().toLowerCase();
    if (!email) {
      this.forgeAccessMsg.set('Enter a client email first.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.forgeAccessMsg.set('Enter a valid email address.');
      return;
    }
    const admin = this.adminEmail();
    if (!admin) {
      this.forgeAccessMsg.set('Admin email missing — re-login to admin.');
      return;
    }

    this.forgeAccessLoading.set(true);
    this.forgeAccessMsg.set('');
    const plan = this.forgeAccessPlan();
    const role = plan === 'developer' ? 'developer' : 'client';
    try {
      const response = await fetch('/api/admin/forge-access/grant', {
        method: 'POST',
        headers: await this.authHeaders(),
        body: JSON.stringify({
          adminEmail: admin,
          email,
          role,
          plan: plan === 'developer' ? undefined : plan,
          credits: plan === 'developer' ? undefined : this.forgeAccessCredits()
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Grant failed (${response.status}). Is the backend running on port 4000?`);
      }
      this.forgeAccessSeats.set(data.seats || []);
      this.forgeAccessEmail.set('');
      const grant = data.grant || {};
      if (role === 'developer') {
        this.forgeAccessMsg.set(`Admin panel + unlimited Forge access granted to ${email}`);
      } else if (grant.refilled) {
        this.forgeAccessMsg.set(
          `Credits refilled for ${email}: +${grant.added} → balance ${grant.credits} (${grant.purchases} packs · ${grant.plan})`
        );
      } else {
        this.forgeAccessMsg.set(
          `${grant.plan === 'enterprise' ? 'Enterprise' : 'Forge Bundle'} access granted to ${email} with ${grant.credits} credits`
        );
      }
    } catch (error: any) {
      this.forgeAccessMsg.set(error.message || 'Failed to grant Forge access');
    } finally {
      this.forgeAccessLoading.set(false);
      setTimeout(() => {
        if (this.forgeAccessMsg().includes('granted') || this.forgeAccessMsg().includes('refilled')) {
          this.forgeAccessMsg.set('');
        }
      }, 6000);
    }
  }

  async revokeForgeAccess(email: string) {
    this.forgeAccessLoading.set(true);
    this.forgeAccessMsg.set('');
    try {
      const response = await fetch('/api/admin/forge-access/revoke', {
        method: 'POST',
        headers: await this.authHeaders(),
        body: JSON.stringify({ adminEmail: this.adminEmail(), email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to revoke access');
      this.forgeAccessSeats.set(data.seats || []);
      this.forgeAccessMsg.set(`Forge access revoked for ${email}`);
    } catch (error: any) {
      this.forgeAccessMsg.set(error.message || 'Failed to revoke Forge access');
    } finally {
      this.forgeAccessLoading.set(false);
      setTimeout(() => this.forgeAccessMsg.set(''), 3500);
    }
  }

  async loginWithGoogle() {
    await this.supabase.loginWithGoogle();
  }

  async loginWithGithub() {
    await this.supabase.loginWithGithub();
  }

  logout() {
    this.supabase.logout();
    this.email.set('');
    this.password.set('');
  }

  async loadSection(section: string) {
    this.selectedSection.set(section);
    let data = await this.supabase.getContent(section);
    
    if (!data) {
      // Setup Defaults for Graphic UI
      if (section === 'about') {
         data = { title: "Brand Identity", content: this.defaultBrandIdentity };
      } else if (section === 'home') {
         data = {
           heroTitle: "We build systems that scale.",
           heroSubtitle: "Transform ideas into impactful digital solutions. Bridge vision and execution.",
           servicesList: [
             { category: "01 / Cyber Security", title: "Uncompromising Defense", description: "Secure infrastructure design and penetration testing that fortifies your digital presence." },
             { category: "02 / Engineering", title: "Future-Proof Stacks", description: "We orchestrate clean codebases utilizing optimal rendering paths ensuring flawless 60 FPS." }
           ]
         };
      }
    } else {
      // Ensure specific arrays exist even on old payloads
      if (section === 'home' && !data.servicesList) data.servicesList = [];
    }
    
    // Create new object reference for Angular signals to trigger deeply
    this.pageData.set(JSON.parse(JSON.stringify(data)));
  }

  // Graphical Array Controls
  addServiceItem() {
    const p = this.pageData();
    p.servicesList.push({ category: "0X / Custom Header", title: "New Service Architecture", description: "Describe the new technical offering here." });
    this.pageData.set({...p});
  }

  removeServiceItem(index: number) {
    const p = this.pageData();
    p.servicesList.splice(index, 1);
    this.pageData.set({...p});
  }

  async saveContent() {
    this.saving.set(true);
    try {
      const payload = this.pageData();
      const success = await this.supabase.saveContent(this.selectedSection(), payload);
      if (success) {
         this.saveSuccess.set(true);
         setTimeout(() => this.saveSuccess.set(false), 2000);
      } else {
         this.error.set('Failed to save to Supabase. Check network or keys.');
         setTimeout(() => this.error.set(''), 4000);
      }
    } catch (e) {
      console.error(e);
      this.error.set('Network instability detected.');
      setTimeout(() => this.error.set(''), 4000);
    }
    this.saving.set(false);
  }

  async updateVisuals(type: 'speed' | 'glow', val: number) {
    if (type === 'speed') this.store.setAnimationSpeed(val);
    if (type === 'glow') this.store.setGlowIntensity(val);
    await this.supabase.saveContent(`settings_${type}`, { value: val });
  }

  async toggleFeature(type: '3d' | 'anim') {
    if (type === '3d') {
      this.store.toggle3D();
      await this.supabase.saveContent('settings_3d', { value: this.store.enable3D() });
    }
    if (type === 'anim') {
      this.store.toggleAnimations();
      await this.supabase.saveContent('settings_anim', { value: this.store.enableAnimations() });
    }
  }

  private animateDashboard() {
    gsap.from('.admin-dashboard-anim', { y: 50, opacity: 0, duration: 0.8, ease: 'power3.out' });
  }
}
