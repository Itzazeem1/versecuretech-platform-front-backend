import { Component, signal, inject, afterNextRender, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import { OauthButtonsComponent } from '../components/oauth-buttons';
import { TranslatePipe } from '../pipes/translate.pipe';
import gsap from 'gsap';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent, OauthButtonsComponent, TranslatePipe],
  template: `
    <app-header></app-header>
    
    <div class="min-h-screen pt-32 pb-20 px-8 flex items-center justify-center relative z-10">
      
      <div class="w-full max-w-md login-anim opacity-0">
        <div class="glass-panel p-10 rounded-[2rem] border border-[var(--text-primary)]/10 relative overflow-hidden">
          
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-main)] to-transparent opacity-50"></div>
          
          <div class="text-center mb-10">
            <span class="material-icons text-4xl text-[var(--accent-main)] mb-4">account_circle</span>
            <h1 class="text-3xl font-display font-medium mb-2">{{ showResetForm() ? 'Set a new password' : ('LOGIN.TITLE' | translate) }}</h1>
            <p class="text-sm text-[var(--text-muted)]">{{ showResetForm() ? 'Choose a new password for your account.' : ('LOGIN.SUBTITLE' | translate) }}</p>
          </div>

          @if (showResetForm()) {
            <form (submit)="saveNewPassword($event)" class="space-y-6 relative z-10">
              <div>
                <label for="new-password" class="block text-xs uppercase tracking-widest font-mono text-[var(--text-muted)] mb-2">New password</label>
                <input id="new-password" type="password" [ngModel]="password()" (ngModelChange)="password.set($event)" name="newPassword" required class="w-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)] transition-colors" placeholder="••••••••">
              </div>
              <button type="submit" [disabled]="loading() || !password()" class="w-full py-4 rounded-xl bg-[var(--text-primary)] text-[var(--bg-main)] font-bold text-sm uppercase tracking-widest hover:bg-[var(--accent-main)] transition-colors disabled:opacity-50">
                {{ loading() ? 'Saving…' : 'Save password' }}
              </button>
              @if (error()) {
                <p class="text-red-400 text-sm mt-2 text-center font-light">{{ error() }}</p>
              }
              @if (success()) {
                <p class="text-green-400 text-sm mt-2 text-center font-light">{{ success() }}</p>
              }
            </form>
          } @else {
          <form (submit)="loginWithEmail($event)" class="space-y-6 relative z-10">
            <div>
              <label for="email" class="block text-xs uppercase tracking-widest font-mono text-[var(--text-muted)] mb-2">{{ 'LOGIN.EMAIL_LABEL' | translate }}</label>
              <input id="email" type="email" [ngModel]="email()" (ngModelChange)="email.set($event)" name="email" required class="w-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)] transition-colors" placeholder="client@company.com">
            </div>
            
            <div>
              <label for="password" class="block text-xs uppercase tracking-widest font-mono text-[var(--text-muted)] mb-2">{{ 'LOGIN.PASSWORD_LABEL' | translate }}</label>
              <input id="password" type="password" [ngModel]="password()" (ngModelChange)="password.set($event)" name="password" required class="w-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)] transition-colors" placeholder="••••••••">
            </div>

            <button type="submit" [disabled]="loading() || !email() || !password()" class="w-full py-4 rounded-xl bg-[var(--text-primary)] text-[var(--bg-main)] font-bold text-sm uppercase tracking-widest hover:bg-[var(--accent-main)] transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
              @if (loading()) {
                <span class="material-icons animate-spin text-[18px]">refresh</span> {{ 'LOGIN.AUTHENTICATING' | translate }}
              } @else {
                {{ 'LOGIN.SIGN_IN' | translate }}
              }
            </button>

            @if (error()) {
              <p class="text-red-400 text-sm mt-2 text-center font-light">{{ error() }}</p>
            }
          </form>

          <div class="mt-8 pt-8 border-t border-[var(--text-primary)]/10 relative z-10">
            <p class="text-xs text-center text-[var(--text-muted)] uppercase tracking-widest font-mono mb-4">{{ 'LOGIN.OR_CONTINUE' | translate }}</p>
            <app-oauth-buttons layout="grid" (googleClick)="loginWithGoogle()" (githubClick)="loginWithGithub()" />
          </div>
          
          <div class="mt-8 text-center relative z-10">
            <p class="text-xs text-[var(--text-muted)]">{{ 'LOGIN.NO_ACCOUNT' | translate }} <button (click)="signUp()" class="text-[var(--accent-main)] hover:underline">{{ 'LOGIN.SIGN_UP' | translate }}</button></p>
          </div>
          }
        </div>
      </div>
    </div>
    
    <app-footer></app-footer>
  `
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal('');
  success = signal('');
  resetMode = signal(false);
  
  public supabase = inject(SupabaseService);
  private router = inject(Router);

  showResetForm() {
    return this.resetMode() || this.supabase.passwordRecoveryMode();
  }

  constructor() {
    afterNextRender(async () => {
      // Mark recovery ASAP so we never auto-bounce to portal
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash || '';
      const isReset =
        params.get('reset') === '1' ||
        params.get('type') === 'recovery' ||
        hash.includes('type=recovery') ||
        sessionStorage.getItem('auth_recovery') === '1';
      if (isReset) {
        this.resetMode.set(true);
        try { sessionStorage.setItem('auth_recovery', '1'); } catch { /* ignore */ }
      }

      await this.supabase.checkSession();
      if (this.supabase.passwordRecoveryMode()) {
        this.resetMode.set(true);
      }

      gsap.to('.login-anim', { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
      
      if (this.supabase.isLoggedIn() && !this.resetMode() && !this.supabase.passwordRecoveryMode()) {
        this.router.navigate(['/portal']);
      }
    });

    effect(() => {
      // Stay on set-password UI during recovery — do NOT send to portal
      if (this.resetMode() || this.supabase.passwordRecoveryMode()) return;
      if (this.supabase.isLoggedIn()) {
        this.router.navigate(['/portal']);
      }
    });
  }

  async saveNewPassword(e: Event) {
    e.preventDefault();
    if (!this.password()) return;
    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    const { error } = await this.supabase.updatePassword(this.password());
    this.loading.set(false);
    if (error) {
      this.error.set((error as { message?: string }).message || 'Could not update password.');
      return;
    }
    this.success.set('Password updated. Redirecting…');
    this.resetMode.set(false);
    this.supabase.clearPasswordRecoveryMode();
    this.password.set('');
    setTimeout(() => this.router.navigate(['/portal']), 800);
  }

  async loginWithEmail(e: Event) {
    e.preventDefault();
    if (!this.email() || !this.password()) return;
    
    this.loading.set(true);
    this.error.set('');
    
    const { error } = await this.supabase.loginWithEmail(this.email().trim(), this.password());
    
    this.loading.set(false);
    
    if (error) {
      const msg = (error as { message?: string })?.message || String(error);
      console.error('[Login]', error);
      this.error.set(msg || 'Invalid credentials. Please try again.');
    } else {
      this.router.navigate(['/portal']);
    }
  }

  async signUp() {
    if (!this.email() || !this.password()) {
      this.error.set('Please enter an email and password to sign up.');
      return;
    }
    
    this.loading.set(true);
    this.error.set('');
    
    const { error } = await this.supabase.signUpWithEmail(this.email(), this.password());
    
    this.loading.set(false);
    
    if (error) {
      this.error.set('Sign up failed. ' + (error instanceof Error ? error.message : String(error)));
    } else {
      this.router.navigate(['/portal']);
    }
  }

  async loginWithGoogle() {
    await this.supabase.loginWithGoogle();
  }

  async loginWithGithub() {
    await this.supabase.loginWithGithub();
  }
}
