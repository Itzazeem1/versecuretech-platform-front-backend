import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../components/header';
import { ForgeStateService } from '../services/forge-state.service';
import { SupabaseService } from '../services/supabase.service';
<<<<<<< HEAD
=======
import { Router } from '@angular/router';
>>>>>>> ddbbcba (Refactor Forge AI access, update Supabase service, and finalize email branding)

@Component({
  selector: 'app-forge',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  template: `
    <div class="flex flex-col h-screen bg-[#0a0a0a] text-[#ededed] font-sans overflow-hidden selection:bg-[#333]">
      <app-header></app-header>
      
      <div class="flex flex-1 pt-20 overflow-hidden border-t border-[#222]">
        <!-- Left Panel: Chat -->
        <aside class="w-full md:w-[380px] flex-shrink-0 flex flex-col border-r border-[#222] bg-[#0f0f0f] z-10 transition-transform duration-300 absolute md:relative h-full"
               [ngClass]="isChatOpen() ? 'translate-x-0' : '-translate-x-full md:translate-x-0'">
          <header class="h-12 flex items-center justify-between px-4 border-b border-[#222]">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-white rounded-full"></div>
              <span class="font-medium text-[13px] tracking-wide">Forge Terminal</span>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2 text-[11px] font-mono text-[#888]">
                <span>CREDITS:</span>
                <span class="text-white">{{ state.credits() }}</span>
              </div>
              <button class="md:hidden text-[#888] hover:text-white" (click)="isChatOpen.set(false)">✕</button>
            </div>
          </header>
          
          <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-[#333]">
            @if (state.messages().length === 0) {
              <div class="flex flex-col items-start justify-center h-full opacity-60">
                <span class="font-mono text-[11px] uppercase tracking-widest text-[#888] mb-2">// SYSTEM READY</span>
                <p class="text-[13px] leading-relaxed">Enter system parameters or describe the application architecture you wish to compile.</p>
              </div>
            }
            
            @for (msg of state.messages(); track $index) {
              <div class="flex flex-col gap-1.5 border-b border-[#222] pb-4 last:border-0">
                <span class="text-[10px] font-mono uppercase tracking-wider" [ngClass]="msg.role === 'user' ? 'text-[#888]' : 'text-white'">
                  {{ msg.role === 'user' ? 'USER_INPUT' : 'FORGE_OUTPUT' }}
                </span>
                <div class="text-[13px] leading-relaxed whitespace-pre-wrap" [ngClass]="msg.role === 'user' ? 'text-[#ccc]' : 'text-[#ededed]'">
                  {{ msg.text }}
                </div>
              </div>
            }
            
            @if (loading()) {
              <div class="flex flex-col gap-1.5">
                <span class="text-[10px] font-mono uppercase tracking-wider text-white">FORGE_OUTPUT</span>
                <div class="text-[13px] font-mono text-[#888] animate-pulse">
                  [ processing request... ]
                </div>
              </div>
            }
            
            @if (error()) {
              <div class="p-3 bg-[#1a0f0f] border border-[#4a1f1f] text-[#ff6b6b] text-[12px] font-mono mt-2">
                ERR: {{ error() }}
              </div>
            }
          </div>
          
          <div class="p-4 bg-[#0a0a0a] border-t border-[#222]">
            <!-- File Upload Section -->
            <div class="mb-3">
              <div class="flex items-center gap-2 mb-2">
                <button 
                  (click)="fileInput?.click()"
                  class="text-[10px] font-mono uppercase text-[#888] hover:text-white transition-colors">
                  📎 Attach Files
                </button>
                <input 
                  type="file" 
                  #fileInput
                  (change)="onFileSelect($event)"
                  multiple
                  accept="image/*,.js,.ts,.jsx,.tsx,.css,.scss,.html,.json,.xml,.yaml,.yml,.md,.txt,.py,.java,.cpp,.c,.h,.php,.rb,.go,.rs,.swift,.kt,.sql,.sh,.bat,.ps1"
                  class="hidden">
                >
                @if (uploadedFiles().length > 0) {
                  <span class="text-[10px] font-mono text-[#666]">
                    {{ uploadedFiles().length }} file(s) selected
                  </span>
                  <button 
                    (click)="clearFiles()"
                    class="text-[10px] font-mono uppercase text-[#ff6b6b] hover:text-[#ff8787] ml-2">
                    Clear
                  </button>
                }
              </div>
              @if (uploadedFiles().length > 0) {
                <div class="flex flex-wrap gap-2 mb-2">
                  @for (file of uploadedFiles(); track file.name) {
                    <div class="flex items-center gap-1 bg-[#1a1a1a] px-2 py-1 rounded text-[10px] font-mono">
                      <span class="text-[#888]">{{ file.type.startsWith('image/') ? '🖼️' : '📄' }}</span>
                      <span class="text-[#ccc] truncate max-w-[100px]">{{ file.name }}</span>
                      <span class="text-[#666]">({{ formatFileSize(file.size) }})</span>
                      <button 
                        (click)="removeFile(file)"
                        class="text-[#ff6b6b] hover:text-[#ff8787] ml-1">
                        ✕
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
            
            <div class="relative flex flex-col bg-[#0f0f0f] border border-[#333] focus-within:border-[#666] transition-colors">
              <textarea 
                [(ngModel)]="prompt" 
                (keydown.enter)="handleEnter($event)"
                rows="3" 
                class="w-full bg-transparent p-3 text-[13px] text-[#ededed] placeholder-[#555] focus:outline-none resize-none font-mono"
                placeholder="> enter command or upload files above..."></textarea>
              <div class="flex justify-between items-center px-3 py-2 border-t border-[#222] bg-[#0a0a0a]">
                <div class="flex gap-3 text-[10px] font-mono text-[#666]">
                  <span>PRO: 10CR</span>
                  <span>FLASH: 2CR</span>
                </div>
                <button 
                  (click)="generateWebsite()" 
                  [disabled]="loading() || !prompt().trim()"
                  class="text-[10px] font-mono uppercase tracking-widest text-white hover:text-[#aaa] transition-colors disabled:opacity-30">
                  Execute ↵
                </button>
              </div>
            </div>
          </div>
        </aside>

        <!-- Middle Panel: File Explorer -->
        <aside class="w-full md:w-[240px] flex-shrink-0 flex flex-col border-r border-[#222] bg-[#0a0a0a] transition-transform duration-300 absolute md:relative h-full z-20"
               [ngClass]="isExplorerOpen() ? 'translate-x-0' : '-translate-x-full md:translate-x-0'">
          <div class="h-12 flex items-center justify-between px-4 border-b border-[#222]">
            <span class="text-[10px] font-mono tracking-widest text-[#888] uppercase">Workspace</span>
            <div class="flex items-center gap-2">
              <button (click)="createNewFile()" class="text-[#888] hover:text-white text-[10px] font-mono uppercase" title="New File">+ File</button>
              <button (click)="downloadZip()" class="text-[#888] hover:text-white text-[10px] font-mono uppercase" title="Download ZIP">↓ ZIP</button>
              <button class="md:hidden text-[#888] hover:text-white ml-2" (click)="isExplorerOpen.set(false)">✕</button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto py-2">
            @if (state.files().length === 0) {
              <div class="text-[11px] font-mono text-[#555] px-4 py-2">
                [ empty directory ]
              </div>
            }
            <div class="flex flex-col">
              @for (file of state.files(); track file.path) {
                <button 
                  (click)="state.selectFile(file); state.setViewMode('code')"
                  class="w-full text-left px-4 py-1.5 text-[12px] font-mono flex items-center gap-2 hover:bg-[#111] transition-colors"
                  [ngClass]="state.selectedFile()?.path === file.path && state.viewMode() === 'code' ? 'bg-[#1a1a1a] text-white border-l-2 border-white' : 'text-[#888] border-l-2 border-transparent'">
                  <span class="truncate">{{ file.path }}</span>
                </button>
              }
            </div>
          </div>
          
          <!-- Sync to Cloud Button -->
          <div class="p-4 border-t border-[#222] bg-[#0f0f0f]">
            <button 
              (click)="saveToCloud()" 
              [disabled]="state.files().length === 0 || saving()"
              class="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest transition-colors border border-[#333] hover:border-[#666] disabled:opacity-30 disabled:hover:border-[#333]"
              [ngClass]="saving() ? 'text-[#888]' : 'text-white'">
              @if (saving()) {
                <span class="animate-pulse">[ SYNCING... ]</span>
              } @else {
                <span>[ SYNC TO CLOUD ]</span>
              }
            </button>
            @if (successMessage()) {
              <div class="mt-2 text-[10px] font-mono text-[#4ade80] text-center">
                {{ successMessage() }}
              </div>
            }
          </div>
        </aside>

        <!-- Right Panel: Editor / Preview -->
        <main class="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] relative">
          <!-- Mobile Header Toggles -->
          <div class="md:hidden h-12 flex items-center justify-between px-4 border-b border-[#222] bg-[#0f0f0f]">
            <button (click)="isChatOpen.set(true)" class="text-[11px] font-mono uppercase text-[#888] hover:text-white">Terminal</button>
            <span class="text-[11px] font-mono text-white">{{ state.selectedFile()?.path || 'No File' }}</span>
            <button (click)="isExplorerOpen.set(true)" class="text-[11px] font-mono uppercase text-[#888] hover:text-white">Files</button>
          </div>

          <!-- Tabs -->
          <div class="h-12 flex border-b border-[#222] bg-[#0f0f0f] justify-between items-center pr-4">
            <div class="flex h-full">
              @if (state.selectedFile()) {
                <button 
                  (click)="state.setViewMode('code')"
                  class="px-6 flex items-center justify-center border-r border-[#222] transition-colors min-w-[120px]"
                  [ngClass]="state.viewMode() === 'code' ? 'bg-[#0a0a0a] text-white' : 'text-[#666] hover:text-[#aaa]'">
                  <span class="text-[11px] font-mono uppercase tracking-wider">Source</span>
                </button>
              }
              <button 
                (click)="state.setViewMode('preview'); updatePreview()"
                class="px-6 flex items-center justify-center border-r border-[#222] transition-colors min-w-[120px]"
                [ngClass]="state.viewMode() === 'preview' ? 'bg-[#0a0a0a] text-white' : 'text-[#666] hover:text-[#aaa]'">
                <span class="text-[11px] font-mono uppercase tracking-wider">Preview</span>
              </button>
            </div>
            @if (state.viewMode() === 'code' && state.selectedFile()) {
              <button (click)="copyCode()" class="text-[10px] font-mono uppercase tracking-widest text-[#888] hover:text-white transition-colors border border-[#333] px-3 py-1">
                {{ copyText() }}
              </button>
            }
          </div>
          
          <!-- Content Area -->
          <div class="flex-1 relative bg-[#0a0a0a]">
            @if (state.viewMode() === 'code') {
              @if (state.selectedFile()) {
                <div class="absolute inset-0 flex flex-col">
                  <textarea 
                    [ngModel]="state.selectedFile()?.content"
                    (ngModelChange)="onFileContentChange($event)"
                    spellcheck="false"
                    class="flex-1 w-full bg-transparent p-6 text-[13px] font-mono leading-relaxed text-[#ccc] focus:outline-none resize-none scrollbar-thin scrollbar-thumb-[#333] whitespace-pre"
                  ></textarea>
                </div>
              } @else {
                <div class="absolute inset-0 flex items-center justify-center text-[#444] font-mono text-[11px] uppercase tracking-widest">
                  No file selected
                </div>
              }
            } @else {
              @if (state.safeHtmlPreview()) {
                <div class="absolute inset-0 bg-white">
                  <iframe 
                    [src]="state.safeHtmlPreview()" 
                    class="w-full h-full border-none" 
                    sandbox="allow-scripts allow-same-origin">
                  </iframe>
                </div>
              } @else {
                <div class="absolute inset-0 flex items-center justify-center text-[#444] font-mono text-[11px] uppercase tracking-widest">
                  No preview available
                </div>
              }
            }
          </div>
        </main>
      </div>
    </div>
  `
})
export class ForgeComponent implements OnInit {
  prompt = signal('');
  loading = signal(false);
  error = signal('');
  saving = signal(false);
  successMessage = signal('');
  isChatOpen = signal(false);
  isExplorerOpen = signal(false);
  copyText = signal('Copy');
  uploadedFiles = signal<File[]>([]);
  fileInput: HTMLInputElement | null = null;
  
  state = inject(ForgeStateService);
  public supabase = inject(SupabaseService);
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);
  private router = inject(Router);

  ngOnInit() {
    // Restrict access
    if (!this.supabase.hasForgeAccess()) {
      this.router.navigate(['/portal']);
      return;
    }

    this.state.initSession();

    // Fetch credits securely from backend
    this.http.get<{credits: number}>(`/api/forge/credits?sessionId=${this.state.sessionId()}`)
      .subscribe({
        next: (res) => this.state.setCredits(res.credits),
        error: (err) => console.error('Failed to load credits', err)
      });
  }

  handleEnter(event: Event) {
    const e = event as KeyboardEvent;
    if (!e.shiftKey) {
      e.preventDefault();
      this.generateWebsite();
    }
  }

  createNewFile() {
    const fileName = prompt('Enter file name (e.g., script.js, style.css):');
    if (fileName) {
      this.state.addFile({ path: fileName, content: '' });
    }
  }

  downloadZip() {
    alert('Coming soon!');
  }

  copyCode() {
    const content = this.state.selectedFile()?.content;
    if (content) {
      navigator.clipboard.writeText(content).then(() => {
        this.copyText.set('Copied!');
        setTimeout(() => this.copyText.set('Copy'), 2000);
      });
    }
  }

  onFileContentChange(newContent: string) {
    const currentFile = this.state.selectedFile();
    if (currentFile) {
      this.state.updateFileContent(currentFile.path, newContent);
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    const currentFiles = this.uploadedFiles();
    
    files.forEach(file => {
      if (!currentFiles.some(f => f.name === file.name)) {
        currentFiles.push(file);
      }
    });
    
    this.uploadedFiles.set(currentFiles);
  }

  clearFiles() {
    this.uploadedFiles.set([]);
  }

  removeFile(fileToRemove: File) {
    const currentFiles = this.uploadedFiles().filter(f => f !== fileToRemove);
    this.uploadedFiles.set(currentFiles);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  updatePreview() {
    const files = this.state.files();
    const htmlFile = files.find(f => f.path.endsWith('index.html'));
    const cssFile = files.find(f => f.path.endsWith('.css'));
    const jsFile = files.find(f => (f.path.endsWith('.ts') || f.path.endsWith('.js')) && !f.path.includes('server'));
    
    if (htmlFile) {
      let combinedHtml = htmlFile.content;
      if (cssFile) {
        combinedHtml = combinedHtml.replace('</head>', `<style>${cssFile.content}</style></head>`);
      }
      if (jsFile) {
        combinedHtml = combinedHtml.replace('</body>', `<script>${jsFile.content}</script></body>`);
      }
      const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(combinedHtml)}`;
      this.state.setPreview(this.sanitizer.bypassSecurityTrustResourceUrl(dataUri));
    }
  }

  async saveToCloud() {
    if (this.state.files().length === 0) return;
    
    this.saving.set(true);
    this.error.set('');
    this.successMessage.set('');

    try {
      const htmlFile = this.state.files().find(f => f.path.endsWith('index.html'));
      if (!htmlFile) throw new Error('No HTML file found to publish.');

      const success = await this.supabase.saveProject(this.state.sessionId(), { 
        html: htmlFile.content, 
        files: this.state.files(),
        sessionId: this.state.sessionId()
      });
      
      if (success) {
        this.successMessage.set('SYNC COMPLETE');
        setTimeout(() => this.successMessage.set(''), 3000);
      } else {
        this.error.set('Failed to sync to cloud. Are you logged in?');
      }
    } catch (err: unknown) {
      this.error.set((err as Error).message || 'An error occurred while syncing.');
    } finally {
      this.saving.set(false);
    }
  }

  async generateWebsite() {
    const userPrompt = this.prompt().trim();
    if (!userPrompt && this.uploadedFiles().length === 0) return;
    
    if (this.state.credits() < 2) {
      this.error.set('Insufficient credits. You need at least 2 credits to use Flash.');
      return;
    }

    // Create file context for the AI
    let fileContext = '';
    if (this.uploadedFiles().length > 0) {
      fileContext = '\n\nATTACHED FILES:\n';
      for (const file of this.uploadedFiles()) {
        fileContext += `\n- ${file.name} (${file.type}, ${this.formatFileSize(file.size)})\n`;
        if (file.type.startsWith('image/')) {
          fileContext += '[IMAGE FILE - Please analyze this image]\n';
        } else {
          fileContext += '[CODE FILE - Please review this code]\n';
        }
      }
    }

    const fullPrompt = userPrompt + fileContext;
    this.state.addMessage({ role: 'user', text: userPrompt + (this.uploadedFiles().length > 0 ? `\n\n📎 ${this.uploadedFiles().length} file(s) attached` : '') });
    this.prompt.set('');
    this.loading.set(true);
    this.error.set('');

    try {
      const customKey = localStorage.getItem('custom_gemini_key');
      
      const formData = new FormData();
      formData.append('sessionId', this.state.sessionId());
      formData.append('prompt', fullPrompt);
      
      if (customKey) {
        formData.append('apiKey', customKey);
      }
      
      // Add uploaded files to FormData
      for (const file of this.uploadedFiles()) {
        formData.append('files', file);
      }
      
      this.http.post<{success: boolean, text: string, remainingCredits: number, usedModel: string, error?: string}>('/api/forge/generate', formData).subscribe({
        next: (response) => {
          this.loading.set(false);
          
          if (!response.success) {
            this.error.set(response.error || 'Failed to generate website.');
            return;
          }

          this.state.setCredits(response.remainingCredits);

          let jsonStr = response.text.trim();
          if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
          } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
          }

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed) {
              if (parsed.files && Array.isArray(parsed.files) && parsed.files.length > 0) {
                this.state.setFiles(parsed.files);
                this.updatePreview();
                this.state.setViewMode('preview');
                
                const msgText = parsed.message || `I've generated the project files using Gemini ${response.usedModel}. You can view the code in the explorer and check the live preview.`;
                this.state.addMessage({ role: 'model', text: msgText });
              } else if (parsed.message) {
                this.state.addMessage({ role: 'model', text: parsed.message });
              } else {
                 throw new Error('Invalid JSON structure returned by AI.');
              }
            } else {
              throw new Error('Invalid JSON structure returned by AI.');
            }
          } catch (parseError: unknown) {
            console.error('Failed to parse AI response:', response.text, parseError);
            this.error.set('Failed to parse the generated code. Please try again.');
            this.state.addMessage({ role: 'model', text: 'Sorry, I encountered an error formatting the files. Please try again.' });
          }
        },
        error: (err) => {
          this.loading.set(false);
          console.error('Generation error:', err);
          this.error.set(err.error?.error || 'Failed to generate website. Please try again.');
        }
      });
      
    } catch (err: unknown) {
      this.loading.set(false);
      console.error('Generation error:', err);
      this.error.set((err as Error).message || 'Failed to generate website. Please try again.');
    }
  }
}
