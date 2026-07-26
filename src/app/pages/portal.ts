import { Component, inject, afterNextRender, effect, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { PortalService, PortalTicket } from '../services/portal.service';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import { TranslatePipe } from '../pipes/translate.pipe';
import gsap from 'gsap';

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, TranslatePipe],
  template: `
    <app-header></app-header>

    <div class="min-h-screen pt-32 pb-20 px-6 md:px-8 relative z-10">
      <div class="max-w-7xl mx-auto">
        @if (!supabase.isLoggedIn()) {
          <div class="text-center py-20">
            <span class="material-icons text-6xl text-[var(--accent-main)] mb-6 animate-pulse">lock</span>
            <h2 class="text-3xl font-display font-medium mb-4">{{ 'PORTAL.SUBTITLE' | translate }}</h2>
            <p class="text-[var(--text-muted)] mb-8">{{ 'PORTAL.SUBTITLE_DESC' | translate }}</p>
            <button (click)="goToLogin()" class="px-8 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] font-bold text-sm uppercase tracking-widest hover:scale-105 transition-transform">
              {{ 'PORTAL.SIGN_IN' | translate }}
            </button>
          </div>
        } @else {
          <div class="portal-dashboard opacity-0 translate-y-8">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
              <div>
                <h2 class="text-4xl font-display font-medium mb-2">
                  {{ isFirstVisit() ? ('PORTAL.WELCOME_FIRST' | translate) : ('PORTAL.WELCOME_BACK' | translate) }}
                </h2>
                @if (isFirstVisit()) {
                  <p class="text-[var(--text-muted)] text-sm mb-3 max-w-xl">{{ 'PORTAL.WELCOME_FIRST_DESC' | translate }}</p>
                }
                <p class="text-[var(--text-muted)] text-sm font-mono flex items-center gap-2">
                  <span class="material-icons text-[16px] text-green-400">verified_user</span>
                  {{ supabase.currentUser()?.email }}
                </p>
              </div>
              <button (click)="logout()" class="px-6 py-2 rounded-full border border-[var(--text-primary)]/20 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-all text-xs uppercase tracking-widest font-mono">
                {{ 'PORTAL.SIGN_OUT' | translate }}
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <!-- Forge AI -->
              <div class="glass-panel p-7 rounded-[2rem] border border-[var(--accent-main)] relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-main)] to-transparent opacity-50"></div>
                <div class="w-11 h-11 rounded-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/5 flex items-center justify-center text-[var(--accent-main)] mb-5">
                  <span class="material-icons">terminal</span>
                </div>
                <h3 class="text-xl font-display font-medium mb-2">{{ 'PORTAL.FORGE_TITLE' | translate }}</h3>
                <p class="text-sm text-[var(--text-muted)] mb-5">{{ 'PORTAL.FORGE_DESC' | translate }}</p>
                @if (supabase.hasForgeAccess()) {
                  <button (click)="goToForge()" class="text-xs font-mono uppercase tracking-widest hover:text-[var(--accent-main)] flex items-center gap-1">
                    {{ 'PORTAL.LAUNCH_AI' | translate }} <span class="material-icons text-[14px]">arrow_forward</span>
                  </button>
                } @else {
                  <button (click)="router.navigate(['/contact'])" class="text-[10px] py-2 px-4 rounded-lg bg-[var(--text-primary)] text-[var(--bg-main)] font-bold uppercase tracking-widest">
                    {{ 'PORTAL.BUY_ACCESS' | translate }}
                  </button>
                }
              </div>

              <!-- Project Tracking (replaces Priority Support card; projects live inside) -->
              <div class="glass-panel p-7 rounded-[2rem] border border-[var(--text-primary)]/10 flex flex-col">
                <div class="flex items-start justify-between gap-3 mb-4">
                  <div class="flex items-start gap-4">
                    <div class="w-11 h-11 rounded-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/5 flex items-center justify-center text-[var(--accent-main)] shrink-0">
                      <span class="material-icons">rocket_launch</span>
                    </div>
                    <div>
                      <h3 class="text-xl font-display font-medium mb-1">{{ 'PORTAL.PROJECT_TRACKING' | translate }}</h3>
                      <p class="text-sm text-[var(--text-muted)]">{{ 'PORTAL.PROJECT_TRACKING_DESC' | translate }}</p>
                    </div>
                  </div>
                  <button type="button" (click)="toggleProjects()" class="text-xs font-mono uppercase tracking-widest hover:text-[var(--accent-main)] flex items-center gap-1 shrink-0 relative">
                    @if (portal.hasNewProjects()) {
                      <span class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--accent-main)]"></span>
                    }
                    {{ projectsOpen() ? ('PORTAL.HIDE_PROJECTS' | translate) : ('PORTAL.VIEW_PROJECTS' | translate) }}
                    <span class="material-icons text-[14px]">{{ projectsOpen() ? 'expand_less' : 'arrow_forward' }}</span>
                  </button>
                </div>
                <div class="mt-auto pt-4 border-t border-[var(--text-primary)]/10">
                  <span class="text-xs font-mono text-[var(--accent-main)] uppercase tracking-widest">
                    {{ portal.projects().length }} {{ 'PORTAL.ACTIVE_COUNT' | translate }}
                  </span>
                </div>

                @if (projectsOpen()) {
                  <div class="mt-6 space-y-4 max-h-[28rem] overflow-y-auto custom-scrollbar pr-1">
                    @if (portal.loading() && !portal.projects().length) {
                      <p class="text-sm text-[var(--text-muted)] font-mono uppercase tracking-widest">{{ 'PORTAL.LOADING' | translate }}</p>
                    } @else if (!portal.projects().length) {
                      <p class="text-sm text-[var(--text-muted)] leading-relaxed">{{ 'PORTAL.NO_PROJECTS' | translate }}</p>
                    } @else {
                      @for (project of portal.projects(); track project.id) {
                        <article class="rounded-2xl border border-[var(--text-primary)]/10 bg-white/[0.03] p-5">
                          <div class="flex items-start justify-between gap-3 mb-3">
                            <h4 class="text-base font-display font-medium">{{ project.title }}</h4>
                            <span class="text-[10px] uppercase tracking-widest font-mono px-2.5 py-1 rounded-full border shrink-0" [ngClass]="statusClass(project.status)">
                              {{ statusLabel(project.status) }}
                            </span>
                          </div>
                          <div class="mb-3">
                            <div class="flex justify-between text-[10px] uppercase tracking-widest font-mono text-[var(--text-muted)] mb-2">
                              <span>{{ 'PORTAL.PROGRESS' | translate }}</span>
                              <span>{{ project.progress || 0 }}%</span>
                            </div>
                            <div class="h-1.5 rounded-full bg-[var(--text-primary)]/10 overflow-hidden">
                              <div class="h-full bg-[var(--accent-main)] transition-all duration-500" [style.width.%]="project.progress || 0"></div>
                            </div>
                          </div>
                          @if (project.notes) {
                            <p class="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">{{ project.notes }}</p>
                          }
                          @if (project.updatedAt) {
                            <p class="mt-3 text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">{{ formatDate(project.updatedAt) }}</p>
                          }
                        </article>
                      }
                    }
                  </div>
                }
              </div>
            </div>

            <!-- Tickets only below -->
            <section>
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 class="text-2xl font-display font-medium">{{ 'PORTAL.YOUR_TICKETS' | translate }}</h3>
                @if (portal.canUseTickets()) {
                  <button (click)="showTicketForm.set(true)" class="self-start px-5 py-2 rounded-full border border-[var(--text-primary)]/20 text-xs uppercase tracking-widest font-mono hover:border-[var(--accent-main)] hover:text-[var(--accent-main)] transition-colors">
                    {{ 'PORTAL.OPEN_TICKET' | translate }}
                  </button>
                }
              </div>

              @if (!portal.canUseTickets()) {
                <div class="glass-panel rounded-[2rem] border border-[var(--text-primary)]/10 p-8 md:p-10 text-center">
                  <span class="material-icons text-4xl text-[var(--text-muted)] mb-4">lock</span>
                  <h4 class="text-lg font-display font-medium mb-3">{{ 'PORTAL.TICKETS_LOCKED_TITLE' | translate }}</h4>
                  <p class="text-sm text-[var(--text-muted)] max-w-xl mx-auto mb-6">{{ 'PORTAL.TICKETS_LOCKED_DESC' | translate }}</p>
                  <button (click)="router.navigate(['/contact'])" class="px-6 py-3 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] text-xs font-bold uppercase tracking-widest">
                    {{ 'PORTAL.GO_TO_CONTACT' | translate }}
                  </button>
                </div>
              } @else {
              @if (showTicketForm()) {
                <div class="glass-panel rounded-[2rem] border border-[var(--accent-main)]/30 p-6 md:p-8 mb-8">
                  <h4 class="text-lg font-display font-medium mb-6">{{ 'PORTAL.NEW_TICKET' | translate }}</h4>
                  <div class="grid grid-cols-1 gap-4">
                    <input type="text" [(ngModel)]="ticketSubject" [placeholder]="'PORTAL.TICKET_SUBJECT' | translate" class="w-full bg-transparent border border-[var(--text-primary)]/20 rounded-xl px-4 py-3 text-sm focus:border-[var(--accent-main)] outline-none" />
                    <select [(ngModel)]="ticketPriority" class="w-full bg-[#0a0a0a] border border-[var(--text-primary)]/20 rounded-xl px-4 py-3 text-xs uppercase tracking-widest outline-none">
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <textarea rows="4" [(ngModel)]="ticketMessage" [placeholder]="'PORTAL.TICKET_MESSAGE' | translate" class="w-full bg-transparent border border-[var(--text-primary)]/20 rounded-xl px-4 py-3 text-sm outline-none resize-y"></textarea>
                    <div class="flex flex-wrap gap-3">
                      <button (click)="submitTicket()" [disabled]="ticketSubmitting()" class="px-6 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-main)] text-xs font-bold uppercase tracking-widest disabled:opacity-40">
                        {{ ticketSubmitting() ? ('PORTAL.SENDING' | translate) : ('PORTAL.SUBMIT_TICKET' | translate) }}
                      </button>
                      <button (click)="showTicketForm.set(false)" class="px-6 py-3 rounded-xl border border-[var(--text-primary)]/20 text-xs uppercase tracking-widest">{{ 'PORTAL.CANCEL' | translate }}</button>
                    </div>
                    @if (ticketMsg()) {
                      <p class="text-xs" [class.text-green-400]="ticketOk()" [class.text-red-400]="!ticketOk()">{{ ticketMsg() }}</p>
                    }
                  </div>
                </div>
              }

              @if (!portal.tickets().length) {
                <div class="glass-panel rounded-[2rem] border border-dashed border-[var(--text-primary)]/15 p-10 text-sm text-[var(--text-muted)] text-center">
                  {{ 'PORTAL.NO_TICKETS' | translate }}
                </div>
              } @else {
                <div class="space-y-5">
                  @for (ticket of portal.tickets(); track ticket.id) {
                    <article class="glass-panel rounded-[2rem] border border-[var(--text-primary)]/10 p-6">
                      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h4 class="text-base font-display font-medium">{{ ticket.subject }}</h4>
                        <div class="flex gap-2 text-[10px] uppercase tracking-widest font-mono">
                          <span class="px-2.5 py-1 rounded-full border" [ngClass]="statusClass(ticket.status)">{{ ticket.status }}</span>
                          <span class="px-2.5 py-1 rounded-full border border-[var(--accent-main)]/30 text-[var(--accent-main)]">{{ ticket.priority }}</span>
                        </div>
                      </div>

                      <div class="space-y-3 mb-5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                        @for (msg of ticket.messages || []; track msg.id) {
                          <div class="rounded-xl border px-4 py-3" [class.border-green-400/20]="msg.authorRole === 'admin'" [class.bg-green-400/5]="msg.authorRole === 'admin'" [class.border-white/10]="msg.authorRole !== 'admin'" [class.bg-white/5]="msg.authorRole !== 'admin'">
                            <div class="flex justify-between gap-3 mb-1">
                              <span class="text-[10px] uppercase tracking-widest font-mono" [class.text-green-400]="msg.authorRole === 'admin'" [class.text-[var(--text-muted)]]="msg.authorRole !== 'admin'">
                                {{ msg.authorRole === 'admin' ? ('PORTAL.TEAM_REPLY' | translate) : ('PORTAL.YOU' | translate) }}
                              </span>
                              <span class="text-[10px] font-mono text-[var(--text-muted)]">{{ formatDate(msg.createdAt) }}</span>
                            </div>
                            <p class="text-sm whitespace-pre-wrap">{{ msg.body }}</p>
                          </div>
                        }
                      </div>

                      @if (ticket.attachments?.length) {
                        <div class="flex flex-wrap gap-2 mb-4">
                          @for (file of ticket.attachments; track file.id) {
                            <a [href]="file.url" target="_blank" rel="noopener" class="text-[10px] uppercase tracking-widest font-mono px-3 py-1.5 rounded-full border border-[var(--text-primary)]/20 hover:border-[var(--accent-main)]">
                              {{ file.fileName }}
                            </a>
                          }
                        </div>
                      }

                      <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-start">
                        <textarea rows="2" [ngModel]="replyDraft(ticket.id)" (ngModelChange)="setReplyDraft(ticket.id, $event)" [placeholder]="'PORTAL.WRITE_REPLY' | translate" class="w-full bg-transparent border border-[var(--text-primary)]/20 rounded-xl px-4 py-3 text-sm outline-none resize-y"></textarea>
                        <label class="px-4 py-3 rounded-xl border border-[var(--text-primary)]/20 text-[10px] uppercase tracking-widest font-mono cursor-pointer hover:border-[var(--accent-main)] text-center">
                          {{ 'PORTAL.ATTACH' | translate }}
                          <input type="file" class="hidden" (change)="onAttach(ticket, $event)" />
                        </label>
                        <button (click)="sendReply(ticket)" [disabled]="replyBusy() === ticket.id" class="px-4 py-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-main)] text-[10px] font-bold uppercase tracking-widest disabled:opacity-40">
                          {{ 'PORTAL.SEND_REPLY' | translate }}
                        </button>
                      </div>
                    </article>
                  }
                </div>
              }
              }
            </section>
          </div>
        }
      </div>
    </div>

    <app-footer></app-footer>
  `
})
export class PortalComponent implements OnDestroy {
  public supabase = inject(SupabaseService);
  public portal = inject(PortalService);
  public router = inject(Router);

  showTicketForm = signal(false);
  projectsOpen = signal(true);
  isFirstVisit = signal(false);
  ticketSubmitting = signal(false);
  ticketMsg = signal('');
  ticketOk = signal(false);
  replyBusy = signal('');
  replyDrafts = signal<Record<string, string>>({});

  ticketSubject = '';
  ticketMessage = '';
  ticketPriority = 'normal';
  private welcomeResolved = false;

  constructor() {
    afterNextRender(async () => {
      await this.supabase.checkSession();
      if (this.supabase.passwordRecoveryMode() || sessionStorage.getItem('auth_recovery') === '1') {
        this.router.navigateByUrl('/login?reset=1');
        return;
      }
      if (this.supabase.isLoggedIn()) {
        this.animateDashboard();
        this.detectFirstVisit();
        this.portal.connectRealtime();
        await this.portal.refresh();
      }
    });

    effect(() => {
      if (this.supabase.passwordRecoveryMode()) {
        this.router.navigateByUrl('/login?reset=1');
        return;
      }
      if (this.supabase.isLoggedIn()) {
        setTimeout(() => this.animateDashboard(), 50);
        this.detectFirstVisit();
        this.portal.connectRealtime();
        void this.portal.refresh();
      }
    });
  }

  private welcomeKey(): string {
    const id = this.supabase.currentUser()?.id || this.supabase.currentUser()?.email || 'guest';
    return `portal_welcomed_${id}`;
  }

  private detectFirstVisit() {
    if (this.welcomeResolved || typeof localStorage === 'undefined') return;
    this.welcomeResolved = true;
    const key = this.welcomeKey();
    const seen = localStorage.getItem(key) === '1';
    this.isFirstVisit.set(!seen);
    if (!seen) {
      localStorage.setItem(key, '1');
    }
  }

  toggleProjects() {
    const next = !this.projectsOpen();
    this.projectsOpen.set(next);
    if (next) this.portal.markProjectsSeen();
  }

  ngOnDestroy() {
    this.portal.disconnectRealtime();
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      queued: 'Queued',
      in_progress: 'In Progress',
      review: 'Review',
      done: 'Done',
      open: 'Open',
      resolved: 'Resolved',
      closed: 'Closed'
    };
    return map[status] || status;
  }

  statusClass(status: string): string {
    if (status === 'done' || status === 'resolved') return 'border-green-400/40 text-green-400 bg-green-400/10';
    if (status === 'in_progress' || status === 'review') return 'border-cyan-300/40 text-cyan-300 bg-cyan-300/10';
    if (status === 'closed') return 'border-white/20 text-[var(--text-muted)]';
    if (status === 'urgent' || status === 'open') return 'border-amber-300/40 text-amber-200 bg-amber-300/10';
    return 'border-[var(--text-primary)]/20 text-[var(--text-muted)]';
  }

  formatDate(value?: string): string {
    if (!value) return '';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  replyDraft(id: string): string {
    return this.replyDrafts()[id] || '';
  }

  setReplyDraft(id: string, value: string) {
    this.replyDrafts.set({ ...this.replyDrafts(), [id]: value });
  }

  async submitTicket() {
    if (!this.ticketSubject.trim() || !this.ticketMessage.trim()) {
      this.ticketOk.set(false);
      this.ticketMsg.set('Subject and message are required.');
      return;
    }
    this.ticketSubmitting.set(true);
    this.ticketMsg.set('');
    try {
      await this.portal.createTicket({
        subject: this.ticketSubject.trim(),
        message: this.ticketMessage.trim(),
        priority: this.ticketPriority
      });
      this.ticketOk.set(true);
      this.ticketMsg.set('Ticket submitted. Our team was notified.');
      this.ticketSubject = '';
      this.ticketMessage = '';
      this.ticketPriority = 'normal';
      this.showTicketForm.set(false);
    } catch (error) {
      this.ticketOk.set(false);
      this.ticketMsg.set((error as Error).message || 'Failed to submit ticket');
    } finally {
      this.ticketSubmitting.set(false);
    }
  }

  async sendReply(ticket: PortalTicket) {
    const body = this.replyDraft(ticket.id).trim();
    if (!body) return;
    this.replyBusy.set(ticket.id);
    try {
      await this.portal.replyToTicket(ticket.id, body);
      this.setReplyDraft(ticket.id, '');
    } catch (error) {
      this.ticketOk.set(false);
      this.ticketMsg.set((error as Error).message || 'Reply failed');
    } finally {
      this.replyBusy.set('');
    }
  }

  async onAttach(ticket: PortalTicket, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.replyBusy.set(ticket.id);
    try {
      await this.portal.uploadAttachment(ticket.id, file);
    } catch (error) {
      this.ticketOk.set(false);
      this.ticketMsg.set((error as Error).message || 'Upload failed');
    } finally {
      this.replyBusy.set('');
      input.value = '';
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToForge() {
    this.router.navigate(['/forge']);
  }

  async logout() {
    this.portal.disconnectRealtime();
    await this.supabase.logout();
    this.router.navigate(['/login']);
  }

  private animateDashboard() {
    gsap.to('.portal-dashboard', { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
  }
}
