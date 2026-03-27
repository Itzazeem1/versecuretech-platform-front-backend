import { Component, signal, inject, OnInit, ElementRef, viewChild, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../components/header';
import { ForgeStateService } from '../services/forge-state.service';
import { SupabaseService } from '../services/supabase.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

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
                  (click)="triggerFileInput()"
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
            </div>

            <div class="relative">
              <textarea 
                [(ngModel)]="prompt" 
                (keydown)="handleEnter($event)"
                placeholder="Describe what you want to build..." 
                class="w-full bg-[#111] border border-[#222] rounded-lg p-3 pt-4 pb-12 text-[14px] text-white focus:outline-none focus:border-white/30 resize-none min-h-[100px] scrollbar-none transition-all duration-300 placeholder:text-[#555]"
                [disabled]="loading()">
              </textarea>
              <div class="absolute bottom-3 right-3 flex items-center gap-2">
                <button 
                  (click)="generateWebsite()" 
                  [disabled]="loading() || (!prompt().trim() && uploadedFiles().length === 0)"
                  class="bg-white text-black px-4 py-1.5 rounded-full text-[12px] font-bold hover:bg-[#88c4ff] disabled:opacity-30 disabled:hover:bg-white transition-all duration-300 tracking-tighter shadow-[0_0_15px_rgba(255,255,255,0.1)] active:scale-95 disabled:active:scale-100 uppercase">
                  {{ loading() ? 'Compiling...' : 'Forge' }}
                </button>
              </div>
            </div>
            <div class="mt-2 text-[10px] font-mono text-[#444] text-center uppercase tracking-widest">
              Gemini Flash 1.5 // Multi-File Architecture
            </div>
          </div>
        </aside>

        <!-- Main Content: Editor & Preview -->
        <main class="flex-1 flex flex-col bg-[#050505] relative overflow-hidden">
          <header class="h-12 flex items-center justify-between px-6 border-b border-[#222] bg-[#0f0f0f]/80 backdrop-blur-md">
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-1">
                <button 
                  (click)="state.setViewMode('code')"
                  class="px-4 h-12 flex items-center border-b-2 transition-all duration-300 text-[11px] font-mono uppercase tracking-widest"
                  [ngClass]="state.viewMode() === 'code' ? 'border-white text-white' : 'border-transparent text-[#666] hover:text-[#bbb]'">
                  Source_Code
                </button>
                <button 
                  (click)="state.setViewMode('preview')"
                  class="px-4 h-12 flex items-center border-b-2 transition-all duration-300 text-[11px] font-mono uppercase tracking-widest"
                  [ngClass]="state.viewMode() === 'preview' ? 'border-white text-white' : 'border-transparent text-[#666] hover:text-[#bbb]'">
                  Live_Preview
                </button>
              </div>
            </div>
            
            <div class="flex items-center gap-4">
              @if (saving()) {
                 <div class="text-[10px] font-mono text-[#888] animate-pulse tracking-widest">PUBLISHING...</div>
              }
              @if (successMessage()) {
                 <div class="text-[10px] font-mono text-[#4ade80] tracking-widest">{{ successMessage() }}</div>
              }
              <button 
                (click)="saveToCloud()"
                [disabled]="saving()"
                class="text-[11px] font-mono text-white/50 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-wide">
                <span>☁️ Sync_Cloud</span>
              </button>
              <button 
                (click)="copyCode()"
                class="text-[11px] font-mono text-white/50 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-wide">
                <span>{{ copyText() }}</span>
              </button>
            </div>
          </header>

          <div class="flex-1 relative">
            @if (state.viewMode() === 'code') {
              <!-- Explorer Sidebar -->
              <div class="absolute left-0 top-0 bottom-0 w-64 bg-[#0a0a0a] border-r border-[#222] flex flex-col z-20 transition-transform duration-300"
                   [ngClass]="isExplorerOpen() ? 'translate-x-0' : '-translate-x-full'">
                <div class="p-4 border-b border-[#222] flex items-center justify-between">
                  <span class="text-[11px] font-mono uppercase text-[#888] tracking-widest">Project Files</span>
                  <button (click)="createNewFile()" class="text-[#888] hover:text-white text-lg">+</button>
                </div>
                <div class="flex-1 overflow-y-auto">
                  @for (file of state.files(); track file.path) {
                    <div 
                      (click)="state.selectFile(file)"
                      class="flex items-center justify-between px-4 py-2 hover:bg-white/5 cursor-pointer group"
                      [ngClass]="state.selectedFile()?.path === file.path ? 'bg-white/10 text-white' : 'text-[#888]'">
                      <div class="flex items-center gap-2">
                        <span class="text-[12px] font-mono">{{ file.path }}</span>
                      </div>
                      <button (click)="state.removeFile(file.path); $event.stopPropagation()" 
                              class="opacity-0 group-hover:opacity-100 text-[#ff6b6b] hover:scale-125 transition-all">✕</button>
                    </div>
                  }
                </div>
              </div>
              
              <!-- Explorer Toggle -->
              <button 
                (click)="isExplorerOpen.set(!isExplorerOpen())"
                class="absolute left-0 top-1/2 -translate-y-1/2 bg-[#222] text-[#888] p-1 rounded-r-md z-30 hover:text-white transition-colors">
                {{ isExplorerOpen() ? '◀' : '▶' }}
              </button>

              @if (state.selectedFile()) {
                <div class="absolute inset-0 p-6 overflow-hidden">
                  <textarea 
                    [ngModel]="state.selectedFile()?.content"
                    (ngModelChange)="onFileContentChange($event)"
                    spellcheck="false"
                    class="w-full h-full bg-transparent text-[#ededed] font-mono text-[13px] leading-relaxed border-none focus:outline-none resize-none scrollbar-thin scrollbar-thumb-[#222] selection:bg-white/10">
                  </textarea>
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
  
  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  
  state = inject(ForgeStateService);
  public supabase = inject(SupabaseService);
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);


  private router = inject(Router);

  constructor() {
    afterNextRender(async () => {
      // Logic for client-side only can go here if needed
    });
  }

  ngOnInit() {
    // Restrict access
    if (!this.supabase.hasForgeAccess()) {
      this.router.navigate(['/portal']);
      return;
    }

    this.state.initSession();

    // Fetch credits securely from Supabase (Serverless)
    this.supabase.getForgeCredits().then(credits => {
      this.state.setCredits(credits);
    });
  }

  triggerFileInput() {
    this.fileInput()?.nativeElement.click();
  }

  handleEnter(event: Event) {
    const e = event as KeyboardEvent;
    // Only intercept when the user actually hits "Enter" (and not holding Shift for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!this.loading() && (this.prompt().trim() || this.uploadedFiles().length > 0)) {
        this.generateWebsite();
      }
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
      const response = await fetch('/api/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: fullPrompt }] }] 
        })
      });

      if (!response.ok) throw new Error('AI Service failed');
      const data = await response.json();
      
      if (data.candidates && data.candidates[0].content?.parts?.[0]?.text) {
        const textOutput = data.candidates[0].content.parts[0].text;
        
        // Extract files from JSON if present
        const jsonMatch = textOutput.match(/\{[\s\S]*"files"[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const projectData = JSON.parse(jsonMatch[0]);
            if (projectData.files) {
              this.state.setFiles(projectData.files);
              this.state.addMessage({ role: 'model', text: projectData.message || "Project architecture compiled." });
              this.updatePreview();
              this.state.setViewMode('preview');
            }
          } catch (e) {
            this.state.addMessage({ role: 'model', text: textOutput });
          }
        } else {
          this.state.addMessage({ role: 'model', text: textOutput });
        }
      } else if (data.error) {
          throw new Error(data.error.message || 'AI Engine rejected request.');
      } else {
          console.error('Unexpected AI Structure:', data);
          this.state.addMessage({ role: 'model', text: "Compilation stalled. No output received from the engine core." });
      }

      this.loading.set(false);
      
      // Deduct credits locally and sync to Supabase
      this.state.deductCredits(2);
      this.supabase.deductForgeCredits(2);

    } catch (err: any) {
      console.error('Forge AI error:', err);
      this.loading.set(false);
      this.error.set(err.message || 'An error occurred during generation.');
    } finally {
      this.loading.set(false);
    }
  }
}
