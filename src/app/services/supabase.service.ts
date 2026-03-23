import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
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
  public isAdmin = signal<boolean>(false);
  public isLoggedIn = signal<boolean>(false);
  public currentUser = signal<User | null>(null);
  public isConnected = signal<boolean>(false);

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

  private checkAdminStatus(user: User | null) {
    if (!user) {
      this.isAdmin.set(false);
      this.isLoggedIn.set(false);
      this.currentUser.set(null);
      return;
    }
    this.isLoggedIn.set(true);
    this.currentUser.set(user);
    // Secure the admin panel to the specific admin emails
    if (user.email === 'azeem.makhdum6@gmail.com' || user.email === 'abbas585@gmail.com') {
      this.isAdmin.set(true);
    } else {
      this.isAdmin.set(false);
    }
  }

  // 1. Auth Flow - Secured via Supabase Auth
  async loginWithEmail(email: string, password: string): Promise<{error: unknown}> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
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
    await this.supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo || window.location.origin + '/portal' } });
  }

  async loginWithGithub(redirectTo?: string): Promise<void> {
    await this.supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: redirectTo || window.location.origin + '/portal' } });
  }

  async updatePassword(newPassword: string): Promise<{error: unknown}> {
    const { error } = await this.supabase.auth.updateUser({ password: newPassword });
    return { error };
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.checkAdminStatus(null);
  }

  async checkSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session) {
      this.checkAdminStatus(session.user);
    } else {
      this.checkAdminStatus(null);
    }
    
    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        this.checkAdminStatus(session.user);
      } else if (event === 'SIGNED_OUT') {
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
