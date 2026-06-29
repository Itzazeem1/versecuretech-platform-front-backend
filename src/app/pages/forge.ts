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
    <div class="flex flex-col h-screen bg-[#09090b] text-[#e4e4e7] font-sans overflow-hidden selection:bg-white/10">
      <app-header></app-header>
      
      <!-- IDE Main Workspace Container -->
      <div class="flex flex-1 pt-20 overflow-hidden">
        
        <!-- leftmost: Activity Bar -->
        <div class="w-14 bg-[#09090b] border-r border-white/5 flex flex-col items-center py-4 justify-between select-none z-30 shrink-0">
          <div class="flex flex-col gap-4 w-full items-center">
            <!-- Explorer Tab Button -->
            <button 
              (click)="toggleTab('explorer')"
              class="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200"
              [ngClass]="activeTab() === 'explorer' && sidebarExpanded() ? 'bg-white/5 text-white border border-white/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'"
              title="File Explorer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0A2.25 2.25 0 002.25 15v4.5a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V15a2.25 2.25 0 00-2.25-2.25m-19.5 0h19.5M9.75 9.75V4.5a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 012.25 2.25v5.25m-7.5 0h7.5"></path>
              </svg>
            </button>
            
            <!-- Chat / Terminal Tab Button -->
            <button 
              (click)="toggleTab('chat')"
              class="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200"
              [ngClass]="activeTab() === 'chat' && sidebarExpanded() ? 'bg-white/5 text-white border border-white/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'"
              title="Forge AI Terminal">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 18a5.969 5.969 0 01-.774-3.68A8.048 8.048 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"></path>
              </svg>
            </button>
          </div>
          <div class="text-zinc-600 font-mono text-[10px]">v1.2</div>
        </div>

        <!-- Sidebar Panel Drawer -->
        <aside 
          class="bg-[#0c0c0e] border-r border-white/5 flex flex-col z-20 h-full overflow-hidden transition-all duration-300 shrink-0"
          [ngClass]="sidebarExpanded() ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none'">
          
          <!-- Explorer Tab Content -->
          @if (activeTab() === 'explorer') {
            <div class="flex-1 flex flex-col h-full overflow-hidden">
              <header class="h-12 flex items-center justify-between px-4 border-b border-white/5 shrink-0 bg-[#09090b]/50">
                <span class="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">WORKSPACE Explorer</span>
                <div class="flex items-center gap-1.5">
                  <button 
                    (click)="createNewFile()" 
                    class="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-mono text-zinc-300 uppercase transition-all duration-150 active:scale-95">
                    + New
                  </button>
                  <button 
                    (click)="downloadZip()" 
                    class="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-mono text-zinc-300 uppercase transition-all duration-150 active:scale-95" 
                    title="Download project as ZIP">
                    ZIP
                  </button>
                </div>
              </header>

              <div class="flex-1 overflow-y-auto py-3 px-2">
                @if (state.files().length === 0) {
                  <div class="text-[11px] font-mono text-zinc-600 p-4 border border-dashed border-white/5 rounded text-center">
                    [ No files in workspace ]
                  </div>
                }
                
                <div class="flex flex-col gap-1">
                  @for (file of state.files(); track file.path) {
                    <div 
                      (click)="state.selectFile(file)"
                      class="w-full flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 select-none group border"
                      [ngClass]="state.selectedFile()?.path === file.path ? 'bg-white/5 border-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.02)]' : 'border-transparent text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200'">
                      
                      <div class="flex items-center gap-2.5 min-w-0">
                        <!-- File type badge -->
                        <span 
                          class="w-1.5 h-1.5 rounded-full shrink-0" 
                          [ngClass]="getFileIconClass(file.path)">
                        </span>
                        <span class="text-[12px] font-mono truncate leading-none">{{ file.path }}</span>
                        <span class="text-[9px] font-mono text-zinc-600 uppercase ml-1 shrink-0">{{ getFileTypeLabel(file.path) }}</span>
                      </div>
                      
                      <button 
                        (click)="state.removeFile(file.path); $event.stopPropagation()" 
                        class="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all p-1 hover:bg-white/5 rounded duration-150">
                        ✕
                      </button>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Chat / Forge AI Panel Content -->
          @if (activeTab() === 'chat') {
            <div class="flex-1 flex flex-col h-full overflow-hidden">
              <header class="h-12 flex items-center justify-between px-4 border-b border-white/5 shrink-0 bg-[#09090b]/50">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span class="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">Forge AI Terminal</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-[10px] font-mono text-zinc-500">CREDITS:</span>
                  <span class="text-[11px] font-mono text-white font-bold bg-white/5 px-2 py-0.5 border border-white/10 rounded">{{ state.credits() }}</span>
                </div>
              </header>

              <!-- Chat logs (Terminal style) -->
              <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/5">
                @if (state.messages().length === 0) {
                  <div class="flex flex-col items-center justify-center h-full opacity-60 text-center py-10 px-4">
                    <svg class="w-8 h-8 text-zinc-500 mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 3-3 3m6-3h6m-18 8.25h16.5c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H3.75A1.125 1.125 0 002.625 5.625v12.75c0 .621.504 1.125 1.125 1.125z"></path>
                    </svg>
                    <span class="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-1">// SYSTEM SECURE & READY</span>
                    <p class="text-[12px] leading-relaxed text-zinc-500">Provide architecture specifications to compile live web apps.</p>
                  </div>
                }

                @for (msg of state.messages(); track $index) {
                  <div class="flex flex-col gap-1 bg-[#101014] p-3 rounded-lg border border-white/5">
                    <div class="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1.5">
                      <span class="text-[9px] font-mono uppercase tracking-wider font-semibold" 
                        [ngClass]="msg.role === 'user' ? 'text-zinc-500' : 'text-emerald-400'">
                        {{ msg.role === 'user' ? 'COMMAND_INPUT' : 'COMPILER_OUTPUT' }}
                      </span>
                      <span class="text-[9px] font-mono text-zinc-600">t+{{ $index + 1 }}</span>
                    </div>
                    <div class="text-[12px] leading-relaxed font-mono whitespace-pre-wrap text-zinc-300">
                      {{ msg.text }}
                    </div>
                  </div>
                }

                @if (loading()) {
                  <div class="flex flex-col gap-1 bg-[#101014] p-3 rounded-lg border border-white/5 animate-pulse">
                    <span class="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">// COMPILING APPLICATION</span>
                    <div class="text-[12px] font-mono text-zinc-500">
                      [ building file tree, parsing code structures... ]
                    </div>
                  </div>
                }

                @if (error()) {
                  <div class="p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-[11px] font-mono rounded">
                    ERR: {{ error() }}
                  </div>
                }
              </div>

              <!-- Chat Input Console -->
              <div class="p-4 bg-[#09090b] border-t border-white/5 shrink-0 flex flex-col gap-3">
                <!-- Selected attachments preview -->
                @if (uploadedFiles().length > 0) {
                  <div class="flex flex-wrap gap-1.5 items-center">
                    @for (file of uploadedFiles(); track file.name) {
                      <div class="bg-white/5 border border-white/10 px-2 py-0.5 rounded flex items-center gap-1.5 text-[9px] font-mono text-zinc-400">
                        <span class="truncate max-w-[120px]">{{ file.name }}</span>
                        <button (click)="removeFile(file)" class="text-zinc-600 hover:text-red-400">✕</button>
                      </div>
                    }
                  </div>
                }

                <div class="relative bg-zinc-950 border border-white/5 rounded-xl focus-within:border-zinc-700 transition-colors overflow-hidden">
                  <textarea 
                    [(ngModel)]="prompt" 
                    (keydown)="handleEnter($event)"
                    placeholder="Type command / build instructions..." 
                    class="w-full bg-transparent p-3.5 pb-12 text-[13px] text-zinc-200 focus:outline-none resize-none min-h-[90px] scrollbar-none font-mono placeholder:text-zinc-600"
                    [disabled]="loading()">
                  </textarea>
                  
                  <div class="absolute bottom-2.5 left-3 flex items-center gap-2">
                    <button 
                      (click)="triggerFileInput()"
                      class="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-md transition-colors"
                      title="Attach assets / files">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"></path>
                      </svg>
                    </button>
                    <input 
                      type="file" 
                      #fileInput
                      (change)="onFileSelect($event)"
                      multiple
                      accept="image/*,.js,.ts,.jsx,.tsx,.css,.scss,.html,.json,.xml,.yaml,.yml,.md,.txt"
                      class="hidden">
                  </div>

                  <div class="absolute bottom-2.5 right-2.5">
                    <button 
                      (click)="generateWebsite()" 
                      [disabled]="loading() || (!prompt().trim() && uploadedFiles().length === 0)"
                      class="bg-white text-zinc-950 hover:bg-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600 px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 font-mono flex items-center gap-1 shadow-lg active:scale-95 disabled:active:scale-100 uppercase">
                      <span>{{ loading() ? 'COMPILING' : 'EXECUTE ↵' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }


        </aside>

        <!-- Main Workspace Area: Code & Preview -->
        <main class="flex-1 flex flex-col bg-[#050507] min-w-0 relative overflow-hidden select-none">
          
          <!-- Editor Header Tab bar & Mode toggles -->
          <header class="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md shrink-0">
            <!-- Active tabs list -->
            <div class="flex items-center gap-1.5 min-w-0 flex-1 h-full select-none">
              @if (state.selectedFile()) {
                <div class="flex items-center px-4 h-full border-r border-white/5 bg-[#0c0c0e] text-zinc-200 text-[12px] font-mono font-medium gap-2 border-b-2 border-white select-none">
                  <span class="w-1.5 h-1.5 rounded-full" [ngClass]="getFileIconClass(state.selectedFile()?.path || '')"></span>
                  <span class="truncate">{{ state.selectedFile()?.path }}</span>
                </div>
              } @else {
                <div class="px-4 text-zinc-600 text-[11px] font-mono uppercase tracking-wider select-none">// No active file</div>
              }
            </div>

            <!-- Editor Action Controls -->
            <div class="flex items-center gap-3 select-none shrink-0">
              <!-- Sync Cloud -->
              <button 
                (click)="saveToCloud()"
                [disabled]="saving() || state.files().length === 0"
                class="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 rounded-md text-[10px] font-mono text-zinc-300 flex items-center gap-1.5 tracking-wide transition-all active:scale-95 uppercase">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"></path>
                </svg>
                <span>{{ saving() ? 'Syncing...' : 'Sync Cloud' }}</span>
              </button>
              
              <!-- Copy Code -->
              @if (state.selectedFile() && layoutMode() !== 'preview') {
                <button 
                  (click)="copyCode()"
                  class="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[10px] font-mono text-zinc-300 flex items-center gap-1.5 tracking-wide transition-all active:scale-95 uppercase">
                  <span>{{ copyText() }}</span>
                </button>
              }

              <!-- View Layout Mode Selectors -->
              <div class="flex items-center border border-white/10 rounded-lg p-0.5 bg-[#09090b]">
                <button 
                  (click)="layoutMode.set('code')"
                  class="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all select-none"
                  [ngClass]="layoutMode() === 'code' ? 'bg-white/10 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'">
                  Code
                </button>
                <button 
                  (click)="layoutMode.set('split')"
                  class="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all select-none"
                  [ngClass]="layoutMode() === 'split' ? 'bg-white/10 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'">
                  Split
                </button>
                <button 
                  (click)="layoutMode.set('preview'); updatePreview()"
                  class="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all select-none"
                  [ngClass]="layoutMode() === 'preview' ? 'bg-white/10 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'">
                  Preview
                </button>
              </div>
            </div>
          </header>

          <!-- Workspace Code Canvas / Sandbox split container -->
          <div class="flex-1 flex overflow-hidden">
            
            <!-- Code Editor Side (visible in 'code' or 'split' layout) -->
            @if (layoutMode() === 'code' || layoutMode() === 'split') {
              <div class="flex-1 flex overflow-hidden relative border-r border-white/5 h-full bg-[#050507]">
                @if (state.selectedFile()) {
                  <div class="flex-1 flex overflow-hidden relative">
                    <!-- Line Numbers Gutter -->
                    <div 
                      id="line-numbers-gutter" 
                      class="w-11 shrink-0 py-6 font-mono text-[12px] text-zinc-700 bg-[#070709] border-r border-white/5 text-right pr-3 select-none overflow-hidden text-zinc-600/60 leading-[1.6]">
                      @for (ln of getLineNumbers(); track ln) {
                        <div>{{ ln }}</div>
                      }
                    </div>
                    <!-- Editor Text Canvas -->
                    <textarea 
                      [ngModel]="state.selectedFile()?.content"
                      (ngModelChange)="onFileContentChange($event)"
                      (scroll)="onScroll($event)"
                      spellcheck="false"
                      class="flex-1 h-full bg-transparent p-6 pt-6 text-[12px] font-mono leading-[1.6] text-zinc-300 focus:outline-none resize-none overflow-y-auto whitespace-pre selection:bg-white/15 select-text scrollbar-thin scrollbar-thumb-white/5">
                    </textarea>
                  </div>
                } @else {
                  <div class="flex-1 flex flex-col items-center justify-center text-zinc-600 font-mono text-[11px] uppercase tracking-widest bg-[#050507]">
                    <span class="mb-1">// Workspace Empty</span>
                    <span>No active file selected</span>
                  </div>
                }
              </div>
            }

            <!-- Live Browser Preview Side (visible in 'preview' or 'split' layout) -->
            @if (layoutMode() === 'preview' || layoutMode() === 'split') {
              <div class="flex-1 h-full bg-zinc-950 flex flex-col overflow-hidden relative">
                @if (state.safeHtmlPreview()) {
                  <div class="flex-1 bg-white relative">
                    <iframe 
                      [src]="state.safeHtmlPreview()" 
                      class="w-full h-full border-none" 
                      sandbox="allow-scripts allow-same-origin">
                    </iframe>
                  </div>
                } @else {
                  <div class="flex-1 flex flex-col items-center justify-center text-zinc-600 font-mono text-[11px] uppercase tracking-widest bg-zinc-950">
                    <span class="mb-1">// Preview Offline</span>
                    <span>No output preview generated</span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Bottom Status Bar -->
          <footer class="h-6 bg-[#09090b] border-t border-white/5 flex items-center justify-between px-3 text-[10px] font-mono text-zinc-500 select-none z-30 shrink-0">
            <div class="flex items-center gap-4">
              <!-- Branch -->
              <div class="flex items-center gap-1 text-emerald-500 font-medium">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"></path>
                </svg>
                <span>main</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Server online</span>
              </div>
            </div>

            <div class="flex items-center gap-4">
              @if (state.selectedFile() && (layoutMode() === 'code' || layoutMode() === 'split')) {
                <div class="text-zinc-600">Ln {{ getLineNumbers().length }}</div>
              }
              <!-- Forge AI Brand Badge -->
              <div class="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded px-2 py-0.5">
                <svg class="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L4.09 12.25A1 1 0 005 14h7l-1 8 8.91-10.25A1 1 0 0019 10h-7l1-8z"/>
                </svg>
                <span class="text-[10px] font-mono font-semibold text-zinc-300 tracking-wide">FORGE AI</span>
              </div>
              <div class="text-zinc-500 font-mono text-[10px]">VersecureTech</div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  `
})
export class ForgeComponent implements OnInit {
  activeTab = signal<'explorer' | 'chat'>('chat');
  sidebarExpanded = signal(true);
  layoutMode = signal<'split' | 'code' | 'preview'>('split');

  /** 
   * Toggles sidebar: if same tab clicked → collapse/expand; 
   * if different tab clicked → always open and switch.
   * Must read current state BEFORE mutating activeTab.
   */
  toggleTab(tab: 'explorer' | 'chat') {
    const isSameTab = this.activeTab() === tab;
    if (isSameTab) {
      this.sidebarExpanded.set(!this.sidebarExpanded());
    } else {
      this.activeTab.set(tab);
      this.sidebarExpanded.set(true);
    }
  }


  getLineNumbers(): number[] {
    const content = this.state.selectedFile()?.content || '';
    const linesCount = content.split('\n').length;
    return Array.from({ length: linesCount }, (_, i) => i + 1);
  }

  onScroll(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    const lineNumbers = document.getElementById('line-numbers-gutter');
    if (lineNumbers) {
      lineNumbers.scrollTop = textarea.scrollTop;
    }
  }

  getFileIconClass(path: string): string {
    if (path.endsWith('.html')) return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]';
    if (path.endsWith('.css')) return 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]';
    if (path.endsWith('.js') || path.endsWith('.ts')) return 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]';
    return 'bg-zinc-500';
  }

  getFileTypeLabel(path: string): string {
    if (path.endsWith('.html')) return 'HTML';
    if (path.endsWith('.css')) return 'CSS';
    if (path.endsWith('.js')) return 'JS';
    if (path.endsWith('.ts')) return 'TS';
    return 'TXT';
  }

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

      // Support both OpenAI/xAI/Groq style (choices) and Gemini style (candidates)
      let textOutput: string | undefined;
      if (data.choices && data.choices[0]?.message?.content) {
        textOutput = data.choices[0].message.content;
      } else if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        textOutput = data.candidates[0].content.parts[0].text;
      } else if (data.error) {
        throw new Error(data.error.message || 'AI Engine rejected request.');
      }

      if (textOutput) {
        let cleanedText = textOutput.trim();
        // Remove markdown wrappers if the model returned them
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const parseAndApply = (raw: string) => {
          const parsed = JSON.parse(raw);
          if (parsed.files && Array.isArray(parsed.files) && parsed.files.length > 0) {
            this.state.setFiles(parsed.files);
            this.updatePreview();
            // Switch IDE to split view so user sees code + live preview
            this.layoutMode.set('split');
            this.state.addMessage({ role: 'model', text: parsed.message || "✅ Project compiled. Live preview is ready." });
          } else if (parsed.message) {
            this.state.addMessage({ role: 'model', text: parsed.message });
          } else {
            this.state.addMessage({ role: 'model', text: textOutput! });
          }
        };

        try {
          parseAndApply(cleanedText);
        } catch (e) {
          // Try regex fallback to extract JSON block
          const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parseAndApply(jsonMatch[0]);
            } catch {
              this.state.addMessage({ role: 'model', text: textOutput });
            }
          } else {
            this.state.addMessage({ role: 'model', text: textOutput });
          }
        }
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
