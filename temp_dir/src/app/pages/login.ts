import { Component, signal, inject, afterNextRender, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { HeaderComponent } from '../components/header';
import { FooterComponent } from '../components/footer';
import gsap from 'gsap';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    
    <div class="min-h-screen pt-32 pb-20 px-8 flex items-center justify-center relative z-10">
      
      <div class="w-full max-w-md login-anim opacity-0">
        <div class="glass-panel p-10 rounded-[2rem] border border-[var(--text-primary)]/10 relative overflow-hidden">
          
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-main)] to-transparent opacity-50"></div>
          
          <div class="text-center mb-10">
            <span class="material-icons text-4xl text-[var(--accent-main)] mb-4">account_circle</span>
            <h1 class="text-3xl font-display font-medium mb-2">Client Portal</h1>
            <p class="text-sm text-[var(--text-muted)]">Sign in to access exclusive perks and track your projects.</p>
          </div>

          <form (submit)="loginWithEmail($event)" class="space-y-6 relative z-10">
            <div>
              <label for="email" class="block text-xs uppercase tracking-widest font-mono text-[var(--text-muted)] mb-2">Email Address</label>
              <input id="email" type="email" [ngModel]="email()" (ngModelChange)="email.set($event)" name="email" required class="w-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)] transition-colors" placeholder="client@company.com">
            </div>
            
            <div>
              <label for="password" class="block text-xs uppercase tracking-widest font-mono text-[var(--text-muted)] mb-2">Password</label>
              <input id="password" type="password" [ngModel]="password()" (ngModelChange)="password.set($event)" name="password" required class="w-full bg-[var(--bg-secondary)] border border-[var(--text-primary)]/10 rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-main)] transition-colors" placeholder="••••••••">
            </div>

            <button type="submit" [disabled]="loading() || !email() || !password()" class="w-full py-4 rounded-xl bg-[var(--text-primary)] text-[var(--bg-main)] font-bold text-sm uppercase tracking-widest hover:bg-[var(--accent-main)] transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
              @if (loading()) {
                <span class="material-icons animate-spin text-[18px]">refresh</span> Authenticating...
              } @else {
                Sign In
              }
            </button>

            @if (error()) {
              <p class="text-red-400 text-sm mt-2 text-center font-light">{{ error() }}</p>
            }
          </form>

          <div class="mt-8 pt-8 border-t border-[var(--text-primary)]/10 relative z-10">
            <p class="text-xs text-center text-[var(--text-muted)] uppercase tracking-widest font-mono mb-4">Or continue with</p>
            <div class="grid grid-cols-2 gap-4">
              <button (click)="loginWithGoogle()" class="flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--text-primary)]/20 hover:bg-[var(--text-primary)]/5 transition-colors text-sm font-medium">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" class="w-5 h-5">
                Google
              </button>
              <button (click)="loginWithGithub()" class="flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--text-primary)]/20 hover:bg-[var(--text-primary)]/5 transition-colors text-sm font-medium">
                <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" class="w-5 h-5 invert">
                GitHub
              </button>
            </div>
          </div>
          
          <div class="mt-8 text-center relative z-10">
            <p class="text-xs text-[var(--text-muted)]">Don't have an account? <button (click)="signUp()" class="text-[var(--accent-main)] hover:underline">Sign up</button></p>
          </div>
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
  
  public supabase = inject(SupabaseService);
  private router = inject(Router);

  constructor() {
    afterNextRender(() => {
      this.supabase.checkSession();
      gsap.to('.login-anim', { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
      
      // If already logged in, redirect to portal
      if (this.supabase.isLoggedIn()) {
        this.router.navigate(['/portal']);
      }
    });

    effect(() => {
      if (this.supabase.isLoggedIn()) {
        this.router.navigate(['/portal']);
      }
    });
  }

  async loginWithEmail(e: Event) {
    e.preventDefault();
    if (!this.email() || !this.password()) return;
    
    this.loading.set(true);
    this.error.set('');
    
    const { error } = await this.supabase.loginWithEmail(this.email(), this.password());
    
    this.loading.set(false);
    
    if (error) {
      this.error.set('Invalid credentials. Please try again.');
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
