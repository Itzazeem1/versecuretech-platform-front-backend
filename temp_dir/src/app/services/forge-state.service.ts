import { Injectable, signal } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class ForgeStateService {
  readonly sessionId = signal<string>('');
  readonly credits = signal<number>(100);
  readonly messages = signal<ChatMessage[]>([]);
  readonly files = signal<GeneratedFile[]>([]);
  readonly selectedFile = signal<GeneratedFile | null>(null);
  readonly viewMode = signal<'code' | 'preview'>('code');
  readonly safeHtmlPreview = signal<SafeResourceUrl | null>(null);

  initSession() {
    let sid = localStorage.getItem('forge_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('forge_session_id', sid);
    }
    this.sessionId.set(sid);
  }

  setCredits(amount: number) {
    this.credits.set(amount);
  }

  deductCredits(amount: number) {
    this.credits.update(c => c - amount);
  }

  addMessage(msg: ChatMessage) {
    this.messages.update(m => [...m, msg]);
  }

  setFiles(files: GeneratedFile[]) {
    this.files.set(files);
    if (files.length > 0) {
      this.selectedFile.set(files[0]);
    }
  }

  addFile(file: GeneratedFile) {
    this.files.update(f => [...f, file]);
    this.selectedFile.set(file);
    this.viewMode.set('code');
  }

  updateFileContent(path: string, content: string) {
    this.files.update(files => 
      files.map(f => f.path === path ? { ...f, content } : f)
    );
    const currentSelected = this.selectedFile();
    if (currentSelected && currentSelected.path === path) {
      this.selectedFile.set({ ...currentSelected, content });
    }
  }

  selectFile(file: GeneratedFile) {
    this.selectedFile.set(file);
  }

  setViewMode(mode: 'code' | 'preview') {
    this.viewMode.set(mode);
  }

  setPreview(url: SafeResourceUrl | null) {
    this.safeHtmlPreview.set(url);
  }
}
