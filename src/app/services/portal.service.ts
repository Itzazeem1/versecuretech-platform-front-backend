import { Injectable, inject, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { SupabaseService } from './supabase.service';

export interface PortalProject {
  id: string;
  clientEmail: string;
  title: string;
  status: string;
  progress: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PortalMessage {
  id: string;
  authorEmail: string;
  authorRole: 'client' | 'admin' | string;
  body: string;
  createdAt?: string;
}

export interface PortalAttachment {
  id: string;
  fileName: string;
  mimeType?: string;
  byteSize?: number;
  url: string;
  uploadedBy?: string;
  messageId?: string | null;
  createdAt?: string;
}

export interface PortalTicket {
  id: string;
  clientEmail: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  adminReply?: string;
  messages?: PortalMessage[];
  attachments?: PortalAttachment[];
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class PortalService {
  private supabase = inject(SupabaseService);
  private socket?: Socket;

  projects = signal<PortalProject[]>([]);
  tickets = signal<PortalTicket[]>([]);
  canUseTickets = signal(false);
  hasNewProjects = signal(false);
  loading = signal(false);
  lastError = signal('');

  private email(): string {
    return (this.supabase.currentUser()?.email || '').toLowerCase();
  }

  private seenKey(): string {
    return `portal_seen_projects_${this.email() || 'guest'}`;
  }

  private async authHeaders(json = true): Promise<Record<string, string>> {
    const token = await this.supabase.getAccessToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (json) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private updateNewProjectBadge(projects: PortalProject[]) {
    if (typeof localStorage === 'undefined') return;
    const ids = projects.map((p) => p.id).sort();
    const key = this.seenKey();
    const prev = localStorage.getItem(key);
    if (!prev) {
      this.hasNewProjects.set(ids.length > 0);
      return;
    }
    try {
      const seen: string[] = JSON.parse(prev);
      const unseen = ids.filter((id) => !seen.includes(id));
      this.hasNewProjects.set(unseen.length > 0);
    } catch {
      this.hasNewProjects.set(ids.length > 0);
    }
  }

  markProjectsSeen() {
    if (typeof localStorage === 'undefined') return;
    const ids = this.projects().map((p) => p.id).sort();
    localStorage.setItem(this.seenKey(), JSON.stringify(ids));
    this.hasNewProjects.set(false);
  }

  connectRealtime() {
    if (typeof window === 'undefined' || this.socket) return;
    this.socket = io({ transports: ['websocket', 'polling'] });
    this.socket.on('connect', () => {
      const email = this.email();
      if (email) this.socket?.emit('portal:join', email);
    });
    this.socket.on('portal:update', () => {
      void this.refresh();
    });
  }

  disconnectRealtime() {
    this.socket?.disconnect();
    this.socket = undefined;
  }

  async refresh() {
    const email = this.email();
    if (!email) return;
    this.loading.set(true);
    this.lastError.set('');
    try {
      const headers = await this.authHeaders();
      const [projectsRes, ticketsRes] = await Promise.all([
        fetch(`/api/portal/projects?email=${encodeURIComponent(email)}`, { headers }),
        fetch(`/api/portal/tickets?email=${encodeURIComponent(email)}`, { headers })
      ]);
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        const projects = Array.isArray(data.projects) ? data.projects : [];
        this.projects.set(projects);
        this.updateNewProjectBadge(projects);
        if (typeof data.canUseTickets === 'boolean') this.canUseTickets.set(data.canUseTickets);
      } else if (projectsRes.status === 401) {
        this.lastError.set('Session expired. Please sign in again.');
      }
      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        this.tickets.set(Array.isArray(data.tickets) ? data.tickets : []);
        if (typeof data.canUseTickets === 'boolean') this.canUseTickets.set(data.canUseTickets);
      }
    } catch (error) {
      this.lastError.set((error as Error).message || 'Failed to load portal data');
    } finally {
      this.loading.set(false);
    }
  }

  async createTicket(input: { subject: string; message: string; priority: string }) {
    const email = this.email();
    const response = await fetch('/api/portal/tickets', {
      method: 'POST',
      headers: await this.authHeaders(),
      body: JSON.stringify({ email, ...input })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 403) {
        this.canUseTickets.set(false);
        await this.refresh();
      }
      throw new Error(data.error || 'Failed to create ticket');
    }
    if (typeof data.canUseTickets === 'boolean') this.canUseTickets.set(data.canUseTickets);
    if (Array.isArray(data.tickets)) this.tickets.set(data.tickets);
    else await this.refresh();
    return data.ticket as PortalTicket;
  }

  async replyToTicket(ticketId: string, body: string) {
    const email = this.email();
    const response = await fetch(`/api/portal/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: await this.authHeaders(),
      body: JSON.stringify({ email, body })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 403) {
        this.canUseTickets.set(false);
        await this.refresh();
      }
      throw new Error(data.error || 'Failed to send reply');
    }
    if (Array.isArray(data.tickets)) this.tickets.set(data.tickets);
    else await this.refresh();
    return data.ticket as PortalTicket;
  }

  async uploadAttachment(ticketId: string, file: File) {
    const email = this.email();
    const form = new FormData();
    form.append('email', email);
    form.append('file', file);
    const headers = await this.authHeaders(false);
    delete headers['Content-Type'];
    const response = await fetch(`/api/portal/tickets/${ticketId}/attachments`, {
      method: 'POST',
      headers,
      body: form
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    if (Array.isArray(data.tickets)) this.tickets.set(data.tickets);
    else await this.refresh();
    return data;
  }
}
