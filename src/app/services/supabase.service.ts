import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

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
  private readonly platformId = inject(PLATFORM_ID);
  private authListenerInitialized = false;
  public isAdmin = signal<boolean>(false);
  public isConnected = signal<boolean>(false);
  public authError = signal<string>('');

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.checkConnection();
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

  // 1. Auth Flow - Secured via Supabase Auth
  async loginWithEmail(email: string, password: string): Promise<{error: unknown}> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session) {
      this.isAdmin.set(true);
    }
    return { error };
  }

  async loginWithGoogle(): Promise<{ error: unknown }> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: this.getAuthRedirectUrl(),
      },
    });
    return { error };
  }

  async loginWithGithub(): Promise<{ error: unknown }> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: this.getAuthRedirectUrl(),
      },
    });
    return { error };
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.isAdmin.set(false);
  }

  async checkSession() {
    await this.processOAuthRedirectIfNeeded();
    const { data: { session } } = await this.supabase.auth.getSession();
    this.isAdmin.set(!!session);
    this.initAuthListener();
  }

  async getOAuthErrorFromUrl(): Promise<string | null> {
    if (!isPlatformBrowser(this.platformId)) return null;
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
    const errorDescription =
      url.searchParams.get('error_description') ||
      hashParams.get('error_description') ||
      url.searchParams.get('error') ||
      hashParams.get('error');
    if (!errorDescription) return null;
    return decodeURIComponent(errorDescription.replace(/\+/g, ' '));
  }

  consumeAuthError(): string {
    const err = this.authError();
    if (err) this.authError.set('');
    return err;
  }

  private initAuthListener() {
    if (this.authListenerInitialized) return;

    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        this.isAdmin.set(!!session);
      } else if (event === 'SIGNED_OUT') {
        this.isAdmin.set(false);
      }
    });

    this.authListenerInitialized = true;
  }

  private getAuthRedirectUrl(): string | undefined {
    if (!isPlatformBrowser(this.platformId)) return undefined;
    return `${window.location.origin}/admin`;
  }

  private async processOAuthRedirectIfNeeded() {
    if (!isPlatformBrowser(this.platformId)) return;
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
    const code = url.searchParams.get('code');
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    try {
      if (code) {
        const { error } = await this.supabase.auth.exchangeCodeForSession(code);
        if (error) {
          this.authError.set(error.message);
        }
      } else if (accessToken && refreshToken) {
        const { error } = await this.supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          this.authError.set(error.message);
        }
      }
    } catch (e) {
      this.authError.set((e as Error).message || 'Authentication callback failed.');
    }

    // Clean OAuth params from URL after callback processing.
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('error');
    url.searchParams.delete('error_code');
    url.searchParams.delete('error_description');
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
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
