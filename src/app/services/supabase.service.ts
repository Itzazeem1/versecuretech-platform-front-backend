import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface SiteContent {
  id: string;
  section: string;
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
  public isConnected = signal<boolean>(false);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.checkConnection();
  }

  // Quickly ping to see if db responds without crashing
  private async checkConnection() {
    try {
      const { data, error } = await this.supabase.from('settings').select('*').limit(1);
      if (!error) {
        this.isConnected.set(true);
      }
    } catch {
      this.isConnected.set(false);
    }
  }

  // 1. Auth Flow - Secured via Supabase OTP verification
  async requestOtp(email: string): Promise<boolean> {
    // Check our private admin map first
    const { data, error } = await this.supabase
      .from('admin_users')
      .select('email')
      .eq('email', email)
      .single();

    if (error || !data) return false;

    // Dispatch Supabase OTP to their actual inbox
    const { error: otpError } = await this.supabase.auth.signInWithOtp({ email });
    return !otpError;
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const { data, error } = await this.supabase.auth.verifyOtp({ 
      email, 
      token: otp, 
      type: 'email' 
    });

    if (error || !data.session) return false;

    this.isAdmin.set(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminSession', 'true');
    }
    return true;
  }

  logout() {
    this.isAdmin.set(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminSession');
    }
  }

  checkSession() {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('adminSession');
      if (session === 'true') {
        this.isAdmin.set(true);
      }
    }
  }

  // 2. Fetch Content
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
