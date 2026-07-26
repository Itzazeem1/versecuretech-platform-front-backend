import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

console.log('[SupabaseService] File loaded into browser context');

export interface SiteContent {
  id: string;
  section: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
}

export interface AdminUser {
  id: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private authPopup: Window | null = null;
  public isAdmin = signal<boolean>(false);
  public isLoggedIn = signal<boolean>(false);
  public currentUser = signal<User | null>(null);
  public isConnected = signal<boolean>(false);
  public hasForgeAccess = signal<boolean>(false);
  public isDeveloperAccount = signal<boolean>(false);
  /** True while user arrived via password-recovery email link */
  public passwordRecoveryMode = signal<boolean>(false);
  private authListenersReady = false;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.checkConnection();
    if (environment.tempAdminBypass) {
      this.applyTempAdminBypass('constructor');
    }
  }

  /** TEMP unlock — remove by setting environment.tempAdminBypass = false */
  applyTempAdminBypass(reason = 'manual') {
    if (!environment.tempAdminBypass) return;
    console.warn(`[Supabase Auth] TEMP ADMIN BYPASS ACTIVE (${reason}) — turn off environment.tempAdminBypass when done`);
    this.isAdmin.set(true);
    this.isLoggedIn.set(true);
    this.hasForgeAccess.set(true);
    this.isDeveloperAccount.set(true);
  }

  get tempAdminBypassEnabled() {
    return !!environment.tempAdminBypass;
  }

  get tempAdminEmail() {
    return (environment as { tempAdminEmail?: string }).tempAdminEmail || 'azeem.makhdum6@gmail.com';
  }

  // Quickly ping to see if db responds without crashing
  private async checkConnection() {
    try {
      const { error } = await this.supabase.from('settings').select('*').limit(1);
      if (!error) {
        this.isConnected.set(true);
      }
    } catch {
      this.isConnected.set(false);
    }
  }

  private checkAdminStatus(user: User | null) {
    if (!user) {
      if (environment.tempAdminBypass) {
        this.applyTempAdminBypass('no-session');
        this.currentUser.set(null);
        return;
      }
      this.isAdmin.set(false);
      this.isLoggedIn.set(false);
      this.hasForgeAccess.set(false);
      this.isDeveloperAccount.set(false);
      this.currentUser.set(null);
      return;
    }
    this.isLoggedIn.set(true);
    this.currentUser.set(user);
    
    const email = user.email?.toLowerCase() || '';
    const adminEmails = ['azeem.makhdum6@gmail.com', 'abbas585@gmail.com'];

    console.log(`[Supabase Auth] Identifying user: ${email}`);

    // 1. Determine Admin Status
    const isSystemAdmin = adminEmails.includes(email) || !!environment.tempAdminBypass;
    this.isAdmin.set(isSystemAdmin);
    
    // 2. Determine Forge Access
    const hasAccess = isSystemAdmin;
    this.hasForgeAccess.set(hasAccess);
    this.isDeveloperAccount.set(isSystemAdmin);
    this.refreshForgeAccess(email);

    console.log(`[Supabase Auth] Admin: ${isSystemAdmin}, Forge Access: ${hasAccess}`);
  }

  async refreshForgeAccess(email = this.currentUser()?.email || '') {
    const normalizedEmail = email.toLowerCase();
    if (!normalizedEmail) return;
    try {
      const response = await fetch(`/api/forge/access?email=${encodeURIComponent(normalizedEmail)}`);
      if (!response.ok) return;
      const data = await response.json();
      this.hasForgeAccess.set(!!data.hasAccess);
      this.isDeveloperAccount.set(!!data.isDeveloper);
    } catch (error) {
      console.warn('Forge access refresh failed', error);
    }
  }

  // 1. Auth Flow - Secured via Supabase Auth
  async loginWithEmail(email: string, password: string): Promise<{error: unknown}> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: `${email}`.trim().toLowerCase(),
      password
    });
    if (error) {
      console.error('[Supabase Auth] signInWithPassword failed:', error.message, error);
    }
    if (!error && data.session) {
      this.checkAdminStatus(data.session.user);
    }
    return { error };
  }

  async signUpWithEmail(email: string, password: string): Promise<{error: unknown}> {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (!error && data.session) {
      this.checkAdminStatus(data.session.user);
    }
    return { error };
  }

  async loginWithGoogle(redirectTo?: string): Promise<void> {
    const fallback = window.location.origin + window.location.pathname;
    await this.supabase.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { redirectTo: redirectTo || fallback } 
    });
  }

  async loginWithGithub(redirectTo?: string): Promise<void> {
    const fallback = window.location.origin + window.location.pathname;
    await this.supabase.auth.signInWithOAuth({ 
      provider: 'github', 
      options: { redirectTo: redirectTo || fallback } 
    });
  }

  async updatePassword(newPassword: string): Promise<{error: unknown}> {
    const { error } = await this.supabase.auth.updateUser({ password: newPassword });
    return { error };
  }

  async sendPasswordReset(email: string): Promise<{error: unknown}> {
    // Local dev must use localhost — otherwise Supabase falls back to the live Site URL
    const origin = environment.production
      ? window.location.origin
      : 'http://localhost:4200';
    const redirectTo = `${origin}/login?reset=1`;
    console.log('[Supabase Auth] password reset redirectTo =', redirectTo);
    const { error } = await this.supabase.auth.resetPasswordForEmail(`${email}`.trim().toLowerCase(), {
      redirectTo
    });
    return { error };
  }

  clearPasswordRecoveryMode() {
    this.passwordRecoveryMode.set(false);
    try {
      sessionStorage.removeItem('auth_recovery');
    } catch {
      // ignore
    }
  }

  private detectPasswordRecoveryFromUrl(): boolean {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
    const fromUrl =
      params.get('reset') === '1' ||
      params.get('type') === 'recovery' ||
      hashParams.get('type') === 'recovery' ||
      (window.location.hash || '').includes('type=recovery');
    if (fromUrl) {
      try {
        sessionStorage.setItem('auth_recovery', '1');
      } catch {
        // ignore
      }
      this.passwordRecoveryMode.set(true);
      return true;
    }
    try {
      if (sessionStorage.getItem('auth_recovery') === '1') {
        this.passwordRecoveryMode.set(true);
        return true;
      }
    } catch {
      // ignore
    }
    return this.passwordRecoveryMode();
  }

  async getAccessToken(): Promise<string> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session?.access_token || '';
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.clearPasswordRecoveryMode();
    this.checkAdminStatus(null);
  }

  async checkSession() {
    console.log('[Supabase Auth] checkSession() invoked');
    this.detectPasswordRecoveryFromUrl();

    const { data: { session } } = await this.supabase.auth.getSession();
    if (session) {
      console.log('[Supabase Auth] Session found:', session.user.email);
      this.checkAdminStatus(session.user);
    } else {
      console.log('[Supabase Auth] No session found');
      this.checkAdminStatus(null);
    }

    if (this.authListenersReady) return;
    this.authListenersReady = true;

    if (typeof window !== 'undefined') {
      window.addEventListener('message', async (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'SUPABASE_AUTH_SIGNED_IN') {
          console.log('[Supabase Auth] Message received: SIGNED_IN');
          const { data: { session: newSession } } = await this.supabase.auth.getSession();
          this.checkAdminStatus(newSession?.user ?? null);
          if (this.authPopup && !this.authPopup.closed) {
            this.authPopup.close();
            this.authPopup = null;
          }
        }
      });
    }

    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[Supabase Auth] event: ${event}`);
      if (event === 'PASSWORD_RECOVERY') {
        this.passwordRecoveryMode.set(true);
        try {
          sessionStorage.setItem('auth_recovery', '1');
        } catch {
          // ignore
        }
      }
      if (session) {
        this.checkAdminStatus(session.user);
      } else {
        this.checkAdminStatus(null);
      }
    });
  }

  // 2. Fetch Content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getContent(section: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('site_content')
      .select('content')
      .eq('section', section)
      .single();
    
    if (error || !data) return null;
    return data.content;
  }

  // 3. Save Content (Admin)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveContent(section: string, payload: any): Promise<boolean> {
    if (!this.isAdmin()) return false;
    
    // Upsert equivalent if we have id, but we'll try update first, then insert if fail
    const { data: existing } = await this.supabase
      .from('site_content')
      .select('id')
      .eq('section', section)
      .single();

    if (existing) {
       const { error } = await this.supabase.from('site_content').update({ content: payload }).eq('section', section);
       return !error;
    } else {
       const { error } = await this.supabase.from('site_content').insert({ section, content: payload });
       return !error;
    }
  }

  // Save Forge Project (User)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveProject(projectId: string, payload: any): Promise<boolean> {
    if (!this.isLoggedIn() || !this.currentUser()) return false;
    
    const userId = this.currentUser()!.id;
    
    // Check if project exists
    const { data: existing } = await this.supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (existing) {
       const { error } = await this.supabase.from('projects').update({ content: payload, updated_at: new Date().toISOString() }).eq('id', projectId).eq('user_id', userId);
       return !error;
    } else {
       const { error } = await this.supabase.from('projects').insert({ id: projectId, user_id: userId, content: payload });
       return !error;
    }
  }

  // Save Contact Submission (Serverless)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveContact(payload: any): Promise<boolean> {
    const { error } = await this.supabase.from('contacts').insert({
      first_name: payload.firstName,
      last_name: payload.lastName,
      email: payload.email,
      service: payload.service,
      company: payload.company,
      preferred_time: payload.preferredTime,
      message: payload.message,
      created_at: new Date().toISOString()
    });
    if (error) {
       console.error('Supabase contact insert failed:', error);
       alert('Supabase Error: ' + error.message);
    } else {
       // Send Custom Branded Email via our new lightweight Node Backend!
       try {
         await fetch("/api/contact", {
            method: "POST",
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                service: payload.service,
                company: payload.company,
                message: payload.message
            })
         });
       } catch (e) {
         console.error('Email forward failed, but DB saved.', e);
       }
    }
    return !error;
  }

  // Credit Management (Serverless)
  async getForgeCredits(): Promise<number> {
    if (this.isDeveloperAccount()) return 999999;
    if (!this.currentUser()) return 100; // Default for guests
    
    const { data, error } = await this.supabase
      .from('profiles')
      .select('credits')
      .eq('id', this.currentUser()!.id)
      .single();
    
    if (error || !data) return 100;
    return data.credits;
  }

  async deductForgeCredits(amount: number): Promise<boolean> {
    if (this.isDeveloperAccount()) return true;
    if (!this.currentUser()) return true; // Don't persist for guests
    
    const current = await this.getForgeCredits();
    const { error } = await this.supabase
      .from('profiles')
      .update({ credits: Math.max(0, current - amount) })
      .eq('id', this.currentUser()!.id);
    
    return !error;
  }

  // Subscribe to changes (Real-time sync)
  subscribeToContent(callback: () => void) {
    return this.supabase
      .channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, () => {
        callback();
      })
      .subscribe();
  }
}
