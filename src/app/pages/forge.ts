import { Component, signal, inject, OnInit, ElementRef, viewChild, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../components/header';
import { TranslatePipe } from '../pipes/translate.pipe';
import { TranslationService } from '../services/translation.service';
import { ForgeStateService } from '../services/forge-state.service';
import { ForgeContextEngineService } from '../services/forge-context-engine.service';
import { SupabaseService } from '../services/supabase.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { BuildReport, ForgeWorkflowPhase, ForgeWorkflowStep, GeneratedFile } from '../services/forge-state.service';
import * as forgeAiUtils from '../../../forge-ai-utils.mjs';

interface RouteValidationResult {
  pages: string[];
  unresolvedLinks: Array<{ from: string; href: string; expectedPath: string }>;
  warnings: string[];
}

@Component({
  selector: 'app-forge',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, TranslatePipe],
  template: `
    <ng-container>
    <div class="forge-surface relative flex flex-col h-[100dvh] md:h-screen text-[#F5F5F4] font-sans selection:bg-amber-400/20 overflow-hidden">
      <app-header></app-header>
      
      <!-- IDE Main Workspace Container -->
      <div class="forge-workspace flex flex-1 pt-16 md:pt-20 overflow-hidden relative min-h-0 flex-col md:flex-row">
        
        <!-- leftmost: Activity Bar (horizontal strip on mobile) -->
        <div class="forge-panel mx-2 mt-2 md:m-3 md:mr-0 h-12 md:h-auto w-auto md:w-16 rounded-2xl md:rounded-[1.5rem] flex flex-row md:flex-col items-center px-3 md:px-0 py-0 md:py-5 justify-between md:justify-between select-none z-30 shrink-0">
          <div class="flex flex-row md:flex-col gap-3 md:gap-4 w-full items-center justify-center md:justify-start">
            <!-- Explorer Tab Button -->
            <button 
              (click)="toggleTab('explorer')"
              class="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200"
              [ngClass]="activeTab() === 'explorer' && sidebarExpanded() ? 'bg-gradient-to-br from-amber-600/25 to-stone-300/10 text-white border border-amber-400/25 shadow-lg shadow-amber-950/30' : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'"
              [attr.title]="'FORGE.FILE_EXPLORER' | translate">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0A2.25 2.25 0 002.25 15v4.5a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V15a2.25 2.25 0 00-2.25-2.25m-19.5 0h19.5M9.75 9.75V4.5a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 012.25 2.25v5.25m-7.5 0h7.5"></path>
              </svg>
            </button>
            
            <!-- Forge Studio Tab Button -->
            <button 
              (click)="toggleTab('chat')"
              class="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200"
              [ngClass]="activeTab() === 'chat' && sidebarExpanded() ? 'bg-gradient-to-br from-amber-600/25 to-stone-300/10 text-white border border-amber-400/25 shadow-lg shadow-amber-950/30' : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'"
              [attr.title]="'FORGE.STUDIO' | translate">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 18a5.969 5.969 0 01-.774-3.68A8.048 8.048 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"></path>
              </svg>
            </button>

            <!-- Chat Sessions Button -->
            <button 
              (click)="toggleTab('sessions')"
              class="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200"
              [ngClass]="activeTab() === 'sessions' && sidebarExpanded() ? 'bg-gradient-to-br from-amber-600/25 to-stone-300/10 text-white border border-amber-400/25 shadow-lg shadow-amber-950/30' : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'"
              [attr.title]="'FORGE.CHAT_SESSIONS' | translate">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 9h8m-8 4h6m9 4a2 2 0 01-2 2H5l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v12z"></path>
              </svg>
            </button>
          </div>
          <div class="hidden md:block text-amber-100/80 font-mono text-[10px] rotate-[-90deg] mb-6 tracking-[0.34em]">{{ 'FORGE.STUDIO_LABEL' | translate }}</div>
        </div>

        <!-- Sidebar Panel Drawer -->
        <aside 
          class="forge-panel mx-2 my-2 md:my-3 md:ml-3 rounded-2xl md:rounded-[1.75rem] flex flex-col z-20 min-h-0 flex-1 md:flex-none md:h-[calc(100%-1.5rem)] overflow-hidden transition-all duration-300 shrink-0"
          [ngClass]="sidebarExpanded() ? 'w-auto md:w-[360px] opacity-100' : 'w-0 opacity-0 pointer-events-none'">
          
          <!-- Sessions Tab Content -->
          @if (activeTab() === 'sessions') {
            <div class="flex-1 flex flex-col h-full overflow-hidden">
              <header class="h-14 flex items-center justify-between px-5 border-b border-white/10 shrink-0 bg-white/[0.02]">
                <span class="text-[11px] font-mono tracking-widest text-stone-400 uppercase font-semibold">{{ 'FORGE.CHAT_SESSIONS' | translate }}</span>
                <button 
                  (click)="createNewChat()" 
                  class="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-mono text-stone-300 uppercase transition-all duration-150 active:scale-95">
                  {{ 'FORGE.NEW_CHAT' | translate }}
                </button>
              </header>

              <div class="flex-1 overflow-y-auto py-3 px-2 space-y-2">
                <div class="px-1 pb-2">
                  <input
                    type="search"
                    [(ngModel)]="chatSearch"
                    [placeholder]="'FORGE.SEARCH_CHATS' | translate"
                    class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-mono text-stone-200 outline-none placeholder:text-stone-600"
                  />
                </div>

                @if (getVisibleChats().length === 0) {
                  <div class="text-[11px] font-mono text-stone-600 p-4 border border-dashed border-white/5 rounded text-center">
                    {{ 'FORGE.NO_CHATS' | translate }}
                  </div>
                }

                @for (chat of getVisibleChats(); track chat.id) {
                  <div 
                    (click)="switchChat(chat.id)"
                    class="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 select-none border"
                    [ngClass]="chat.id === state.activeChatId() ? 'bg-white/5 border-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.02)]' : 'border-transparent text-stone-400 hover:bg-white/[0.02] hover:text-stone-200'">
                    <div class="min-w-0">
                      <div class="text-[12px] font-mono truncate leading-none">{{ chat.title }}</div>
                      <div class="text-[9px] text-stone-500 font-mono mt-1">{{ chat.messages.length }} {{ 'FORGE.MESSAGES' | translate }} · {{ formatDate(chat.updatedAt) }}</div>
                      @if (chat.pinned) {
                        <div class="text-[9px] text-amber-400 font-mono mt-1">{{ 'FORGE.PINNED' | translate }}</div>
                      }
                    </div>
                    <div class="flex items-center gap-1">
                      <button (click)="togglePin(chat.id, $event)" class="text-stone-500 hover:text-amber-400 rounded p-1" [attr.title]="'FORGE.PIN_CHAT' | translate">📌</button>
                      <button (click)="duplicateChat(chat.id, $event)" class="text-stone-500 hover:text-white rounded p-1" [attr.title]="'FORGE.DUPLICATE_CHAT' | translate">⧉</button>
                      <button (click)="renameChat(chat.id, $event)" class="text-stone-500 hover:text-white rounded p-1" [attr.title]="'FORGE.RENAME_CHAT' | translate">✎</button>
                      <button 
                        (click)="deleteChat(chat.id, $event)"
                        class="text-stone-500 hover:text-red-400 transition-colors rounded p-1"
                        [attr.title]="'FORGE.DELETE_CHAT' | translate">
                        ✕
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Explorer Tab Content -->
          @if (activeTab() === 'explorer') {
            <div class="flex-1 flex flex-col h-full overflow-hidden">
              <header class="h-14 flex items-center justify-between px-5 border-b border-white/10 shrink-0 bg-white/[0.02]">
                <span class="text-[11px] font-mono tracking-widest text-stone-400 uppercase font-semibold">{{ 'FORGE.PROJECT_FILES' | translate }}</span>
                <div class="flex items-center gap-1.5">
                  <button 
                    (click)="createNewFile()" 
                    class="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-mono text-stone-300 uppercase transition-all duration-150 active:scale-95">
                    {{ 'FORGE.NEW_FILE' | translate }}
                  </button>
                  <button 
                    (click)="downloadZip()" 
                    class="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-mono text-stone-300 uppercase transition-all duration-150 active:scale-95" 
                    [attr.title]="'FORGE.DOWNLOAD_ZIP' | translate">
                    ZIP
                  </button>
                </div>
              </header>

              <div class="flex-1 overflow-y-auto py-3 px-2">
                @if (state.files().length === 0) {
                  <div class="text-[11px] font-mono text-stone-600 p-4 border border-dashed border-white/5 rounded text-center">
                    {{ 'FORGE.NO_FILES' | translate }}
                  </div>
                }
                
                <div class="flex flex-col gap-1">
                  @for (file of state.files(); track file.path) {
                    <div 
                      (click)="state.selectFile(file)"
                      class="w-full flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 select-none group border"
                      [ngClass]="state.selectedFile()?.path === file.path ? 'bg-white/5 border-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.02)]' : 'border-transparent text-stone-400 hover:bg-white/[0.02] hover:text-stone-200'">
                      
                      <div class="flex items-center gap-2.5 min-w-0">
                        <!-- File type badge -->
                        <span 
                          class="w-1.5 h-1.5 rounded-full shrink-0" 
                          [ngClass]="getFileIconClass(file.path)">
                        </span>
                        <span class="text-[12px] font-mono truncate leading-none">{{ file.path }}</span>
                        <span class="text-[9px] font-mono text-stone-600 uppercase ml-1 shrink-0">{{ getFileTypeLabel(file.path) }}</span>
                      </div>
                      
                      <button 
                        (click)="state.removeFile(file.path); $event.stopPropagation()" 
                        class="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-red-400 transition-all p-1 hover:bg-white/5 rounded duration-150">
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
              <header class="min-h-16 flex items-center justify-between gap-3 px-5 border-b border-white/10 shrink-0 bg-white/[0.02]">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_18px_rgba(52,211,153,0.8)]"></div>
                    <span class="text-[11px] font-mono tracking-widest text-stone-300 uppercase font-semibold">{{ 'FORGE.FORGE_AI' | translate }}</span>
                  </div>
                  <div class="mt-1 truncate text-[11px] text-stone-500">{{ state.currentChat()?.title || ('FORGE.ACTIVE_CHAT' | translate) }}</div>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-[10px] font-mono text-stone-500">{{ 'FORGE.CREDITS' | translate }}</span>
                  <span class="text-[11px] font-mono text-white font-bold bg-white/5 px-2 py-0.5 border border-white/10 rounded-full">{{ supabase.isDeveloperAccount() ? ('FORGE.UNLIMITED' | translate) : state.credits() }}</span>
                </div>
              </header>

              <!-- Chat timeline -->
              <div #chatTimeline class="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/5">
                @if (state.messages().length === 0) {
                  <div class="mx-auto flex max-w-[280px] flex-col items-center justify-center h-full text-center py-10 px-4">
                    <div class="mb-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20">
                    <svg class="w-8 h-8 text-amber-200" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 3-3 3m6-3h6m-18 8.25h16.5c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H3.75A1.125 1.125 0 002.625 5.625v12.75c0 .621.504 1.125 1.125 1.125z"></path>
                    </svg>
                    </div>
                    <span class="font-mono text-[10px] uppercase tracking-widest text-amber-100 mb-1">{{ 'FORGE.READY_TO_CREATE' | translate }}</span>
                    <p class="text-[12px] leading-relaxed text-stone-500">{{ 'FORGE.READY_HINT' | translate }}</p>
                  </div>
                }

                @for (msg of state.messages(); track $index) {
                  <div
                    class="forge-message flex flex-col gap-1 rounded-2xl border p-4"
                    [ngClass]="msg.role === 'user' ? 'ml-8 border-amber-200/15 bg-amber-300/[0.055]' : 'mr-8 border-white/10 bg-white/[0.035]'">
                    <div class="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1.5">
                      <span class="text-[9px] font-mono uppercase tracking-wider font-semibold" 
                        [ngClass]="msg.role === 'user' ? 'text-amber-100' : 'text-stone-200'">
                        {{ msg.role === 'user' ? ('FORGE.YOU' | translate) : ('FORGE.FORGE_NAME' | translate) }}
                      </span>
                      <span class="text-[9px] font-mono text-stone-600">t+{{ $index + 1 }}</span>
                    </div>
                    <div class="text-[12px] leading-relaxed font-mono whitespace-pre-wrap text-stone-300">
                      {{ msg.text }}
                    </div>
                  </div>
                }

                @if (state.currentChat()?.lastBuildReport; as report) {
                  <div class="forge-message rounded-2xl border border-amber-400/15 bg-gradient-to-br from-amber-700/[0.085] via-white/[0.035] to-stone-300/[0.045] p-4 text-[11px] text-stone-300 shadow-2xl shadow-black/20">
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <div class="text-[10px] font-mono uppercase tracking-[0.24em] text-amber-100">{{ 'FORGE.QUALITY_INTEL' | translate }}</div>
                        <div class="mt-1 text-sm font-medium text-white">{{ report.summary }}</div>
                      </div>
                      <div class="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">{{ report.qualityScore }}/100</div>
                    </div>
                    <div class="mt-4 grid grid-cols-3 gap-2">
                      <div class="rounded-xl bg-black/20 p-3"><div class="text-[9px] uppercase tracking-widest text-stone-500">{{ 'FORGE.PAGES' | translate }}</div><div class="mt-1 truncate text-white">{{ report.pages.length || 0 }}</div></div>
                      <div class="rounded-xl bg-black/20 p-3"><div class="text-[9px] uppercase tracking-widest text-stone-500">{{ 'FORGE.CHANGED' | translate }}</div><div class="mt-1 truncate text-white">{{ report.changedFiles.length || 0 }}</div></div>
                      <div class="rounded-xl bg-black/20 p-3"><div class="text-[9px] uppercase tracking-widest text-stone-500">{{ 'FORGE.ISSUES' | translate }}</div><div class="mt-1 truncate text-white">{{ report.unresolvedLinks.length + report.warnings.length }}</div></div>
                    </div>
                    @if (report.warnings.length > 0 || report.unresolvedLinks.length > 0) {
                      <div class="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-amber-100">
                        {{ getReportIssueSummary(report) }}
                      </div>
                    }
                    @if ((state.currentChat()?.snapshots?.length || 0) > 0) {
                      <button
                        (click)="rollbackLatestSnapshot()"
                        class="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-stone-200 hover:bg-white/[0.08]">
                        {{ 'FORGE.ROLLBACK' | translate }}
                      </button>
                    }
                  </div>
                }

                @if (loading()) {
                  <div class="forge-message flex flex-col gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 animate-pulse">
                    <span class="text-[9px] font-mono uppercase tracking-wider text-emerald-300 font-semibold">{{ 'FORGE.BUILDING' | translate }}</span>
                    <div class="text-[12px] font-mono text-stone-300">
                      {{ builderStatus() }}
                    </div>
                    <div class="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div class="h-full w-2/3 rounded-full bg-gradient-to-r from-amber-700 via-amber-400 to-stone-100"></div>
                    </div>
                  </div>
                }

                @if (error()) {
                  <div class="p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-[11px] font-mono rounded">
                    {{ error() }}
                  </div>
                }
              </div>

              <!-- Chat Input Console -->
              <div (wheel)="forwardComposerWheel($event)" class="forge-composer p-3 md:p-5 bg-black/30 border-t border-white/10 shrink-0 flex flex-col gap-2 md:gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-5">
                <div class="flex flex-nowrap md:flex-wrap gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
                  @for (action of quickActions; track action.prompt) {
                    <button
                      type="button"
                      (click)="applyQuickAction(action.prompt)"
                      class="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-left text-[10px] font-mono text-stone-300 hover:border-amber-300/40 hover:bg-amber-300/10 hover:text-amber-100 transition-colors">
                      {{ action.labelKey | translate }}
                    </button>
                  }
                </div>

                <!-- Selected attachments preview -->
                @if (uploadedFiles().length > 0) {
                  <div class="flex flex-wrap gap-1.5 items-center">
                    @for (file of uploadedFiles(); track file.name) {
                      <div class="bg-white/5 border border-white/10 px-2 py-0.5 rounded flex items-center gap-1.5 text-[9px] font-mono text-stone-400">
                        <span class="truncate max-w-[120px]">{{ file.name }}</span>
                        <button (click)="removeFile(file)" class="text-stone-600 hover:text-red-400">✕</button>
                      </div>
                    }
                  </div>
                }

                <div class="relative bg-black/40 border border-white/10 rounded-2xl focus-within:border-amber-300/50 transition-colors overflow-hidden shadow-2xl shadow-black/20">
                  <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"></div>
                  <textarea 
                    [(ngModel)]="prompt" 
                    (keydown)="handleEnter($event)"
                    [placeholder]="'FORGE.PROMPT_PLACEHOLDER' | translate" 
                    class="forge-prompt w-full bg-transparent p-3 md:p-4 pb-12 md:pb-14 text-[13px] text-stone-200 focus:outline-none resize-none min-h-[72px] md:min-h-[110px] max-h-[28vh] md:max-h-none scrollbar-none font-mono placeholder:text-stone-600"
                    [disabled]="loading()">
                  </textarea>
                  
                  <div class="absolute bottom-2.5 left-3 flex items-center gap-2">
                    <button 
                      (click)="triggerFileInput()"
                      class="p-1.5 text-stone-500 hover:text-stone-300 hover:bg-white/5 rounded-md transition-colors"
                      [attr.title]="'FORGE.ATTACH' | translate">
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
                    class="forge-button-glow text-stone-950 hover:brightness-110 disabled:bg-stone-900 disabled:text-stone-600 px-4 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 font-mono flex items-center gap-1 active:scale-95 disabled:active:scale-100 uppercase">
                      <span>{{ loading() ? ('FORGE.BUILDING_BTN' | translate) : ('FORGE.BUILD' | translate) }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }


        </aside>

        <!-- Main Workspace Area: Code & Preview (desktop/tablet only — mobile uses chat/sidebar) -->
        <main class="forge-panel m-3 flex-1 flex-col min-w-0 relative overflow-hidden select-none rounded-[1.75rem] hidden md:flex">
          
          <!-- Editor Header Tab bar & Mode toggles -->
          <header class="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-[#0C0A09]/80 backdrop-blur-md shrink-0">
            <!-- Active tabs list -->
            <div class="flex items-center min-w-0 flex-1 h-full select-none overflow-x-auto overflow-y-hidden flex-nowrap scrollbar-none gap-0.5">
              @if (state.files().length > 0) {
                @for (file of state.files(); track file.path) {
                  <div 
                    (click)="state.selectFile(file)"
                    class="flex items-center px-4 h-full border-r border-white/5 cursor-pointer text-[12px] font-mono font-medium gap-2 select-none shrink-0 transition-all duration-150"
                    [ngClass]="state.selectedFile()?.path === file.path ? 'bg-[#1C1C1E] text-white border-b-2 border-amber-400' : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.02]'">
                    <span class="w-1.5 h-1.5 rounded-full shrink-0" [ngClass]="getFileIconClass(file.path)"></span>
                    <span class="truncate max-w-[140px]">{{ file.path }}</span>
                    <button 
                      (click)="state.removeFile(file.path); $event.stopPropagation()"
                      class="ml-1 opacity-60 hover:opacity-100 text-stone-400 hover:text-red-400 p-0.5 rounded transition-all text-[10px]"
                      [attr.title]="'FORGE.CLOSE_FILE' | translate">
                      ✕
                    </button>
                  </div>
                }
              } @else {
                <div class="px-4 text-stone-400 text-[11px] font-mono uppercase tracking-wider select-none">{{ 'FORGE.NO_ACTIVE_FILE' | translate }}</div>
              }
            </div>

            <!-- Editor Action Controls -->
            <div class="flex items-center gap-3 select-none shrink-0">
              <!-- Copy Code -->
              @if (state.selectedFile() && layoutMode() !== 'preview') {
                <button 
                  (click)="copyCode()"
                  class="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[10px] font-mono text-stone-300 flex items-center gap-1.5 tracking-wide transition-all active:scale-95 uppercase">
                  <span>{{ copyText() }}</span>
                </button>
              }

              <!-- View Layout Mode Selectors -->
              <div class="flex items-center border border-white/10 rounded-lg p-0.5 bg-[#0C0A09]">
                <button 
                  (click)="layoutMode.set('code')"
                  class="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all select-none"
                  [ngClass]="layoutMode() === 'code' ? 'bg-white/10 text-white font-bold' : 'text-stone-500 hover:text-stone-300'">
                  {{ 'FORGE.CODE' | translate }}
                </button>
                <button 
                  (click)="layoutMode.set('split')"
                  class="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all select-none"
                  [ngClass]="layoutMode() === 'split' ? 'bg-white/10 text-white font-bold' : 'text-stone-500 hover:text-stone-300'">
                  {{ 'FORGE.SPLIT' | translate }}
                </button>
                <button 
                  (click)="layoutMode.set('preview'); updatePreview()"
                  class="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all select-none"
                  [ngClass]="layoutMode() === 'preview' ? 'bg-white/10 text-white font-bold' : 'text-stone-500 hover:text-stone-300'">
                  {{ 'FORGE.PREVIEW' | translate }}
                </button>
              </div>
            </div>
          </header>

          <!-- Forge Mission Control -->
          <section class="border-b border-white/5 bg-transparent px-4 py-3 relative overflow-hidden">
            <div class="forge-subtle-grid pointer-events-none absolute inset-0 opacity-50"></div>
            <div class="relative grid gap-4 rounded-[1.5rem] border border-white/10 bg-black/25 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div class="min-w-0">
                <div class="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.26em] text-amber-100">
                  <span class="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]"></span>
                  {{ 'FORGE.COMMAND' | translate }}
                </div>
                <h1 class="mt-3 truncate text-2xl font-semibold tracking-tight text-white">{{ 'FORGE.COMMAND_TITLE' | translate }}</h1>
                <div class="mt-1 truncate text-sm text-stone-400">{{ builderStatus() }}</div>
                <div class="mt-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-stone-500">
                  <span class="h-1.5 w-1.5 rounded-full bg-amber-300"></span>
                  {{ getActiveWorkflowLabel() }}
                </div>
              </div>
              <div class="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                <div class="grid grid-cols-3 gap-2">
                  <div class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 min-w-[92px]">
                    <div class="text-[9px] font-mono uppercase tracking-widest text-stone-500">{{ 'FORGE.QUALITY' | translate }}</div>
                    <div class="mt-1 text-lg font-semibold text-white">{{ state.currentChat()?.lastBuildReport?.qualityScore || 0 }}<span class="text-xs text-stone-500">/100</span></div>
                  </div>
                  <div class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 min-w-[92px]">
                    <div class="text-[9px] font-mono uppercase tracking-widest text-stone-500">{{ 'FORGE.PAGES' | translate }}</div>
                    <div class="mt-1 text-lg font-semibold text-white">{{ htmlPageCount() }}</div>
                  </div>
                  <div class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 min-w-[92px]">
                    <div class="text-[9px] font-mono uppercase tracking-widest text-stone-500">{{ 'FORGE.FILES' | translate }}</div>
                    <div class="mt-1 text-lg font-semibold text-white">{{ state.files().length }}</div>
                  </div>
                </div>
                <div class="flex rounded-full border border-white/10 bg-black/30 p-1 shadow-inner shadow-black/30">
                  @for (device of previewDevices; track device.id) {
                    <button
                      (click)="previewDevice.set(device.id)"
                      class="rounded-full px-3 py-1 text-[10px] font-mono uppercase transition-colors"
                      [ngClass]="previewDevice() === device.id ? 'bg-gradient-to-r from-amber-600 to-amber-400 text-stone-950' : 'text-stone-500 hover:text-white'">
                      {{ device.label }}
                    </button>
                  }
                </div>
                <button type="button" (click)="showIntelligencePanel.set(!showIntelligencePanel())" class="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-stone-400 hover:text-blue-400">
                  {{ showIntelligencePanel() ? ('FORGE.HIDE_DETAILS' | translate) : ('FORGE.DETAILS' | translate) }}
                </button>
              </div>
            </div>
            @if (showIntelligencePanel()) {
              <div class="relative mt-3 grid gap-3 lg:grid-cols-3">
                <div class="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <div class="text-[9px] font-mono uppercase tracking-widest text-amber-100">{{ 'FORGE.AI_TIMELINE' | translate }}</div>
                  <div class="mt-2 flex flex-col gap-1.5">
                    @for (step of getWorkflowSteps().slice(0, 5); track step.phase) {
                      <div class="flex items-center justify-between gap-2 text-[10px]">
                        <span class="truncate text-stone-300">{{ step.label }}</span>
                        <span class="rounded-full border border-white/10 px-2 py-0.5 font-mono uppercase"
                          [ngClass]="step.status === 'completed' ? 'text-emerald-200 bg-emerald-300/10' : step.status === 'running' ? 'text-amber-100 bg-amber-300/10' : step.status === 'failed' ? 'text-red-200 bg-red-300/10' : 'text-stone-500 bg-white/[0.03]'">
                          {{ step.status }}
                        </span>
                      </div>
                    }
                    @if (getWorkflowSteps().length === 0) {
                      <span class="text-[11px] text-stone-500">{{ 'FORGE.NO_RUN' | translate }}</span>
                    }
                  </div>
                </div>
                <div class="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <div class="text-[9px] font-mono uppercase tracking-widest text-stone-200">{{ 'FORGE.PROJECT_BRIEF' | translate }}</div>
                  <div class="mt-2 line-clamp-4 text-[11px] leading-relaxed text-stone-400">{{ state.currentChat()?.projectSummary || state.currentChat()?.project?.aiSummary || ('FORGE.BRIEF_WAITING' | translate) }}</div>
                </div>
                <div class="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <div class="text-[9px] font-mono uppercase tracking-widest text-amber-100">{{ 'FORGE.READINESS' | translate }}</div>
                  <div class="mt-2 text-[11px] leading-relaxed text-stone-400">{{ getDeployReadinessSummary() }}</div>
                </div>
              </div>
            }
          </section>

          <!-- Workspace Code Canvas / Sandbox split container -->
          <div class="flex-1 flex overflow-hidden">
            
            <!-- Code Editor Side (visible in 'code' or 'split' layout) -->
            @if (layoutMode() === 'code' || layoutMode() === 'split') {
              <div class="flex-1 flex overflow-hidden relative border-r border-white/5 h-full bg-[#0C0A09]/80">
                @if (state.selectedFile()) {
                  <div class="flex-1 flex overflow-hidden relative">
                    <!-- Line Numbers Gutter -->
                    <div 
                      id="line-numbers-gutter" 
                      class="w-11 shrink-0 py-6 font-mono text-[12px] text-stone-700 bg-[#1C1917] border-r border-white/5 text-right pr-3 select-none overflow-hidden text-stone-600/60 leading-[1.6]">
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
                      class="flex-1 h-full bg-transparent p-6 pt-6 text-[12px] font-mono leading-[1.6] text-stone-300 focus:outline-none resize-none overflow-y-auto whitespace-pre selection:bg-white/15 select-text scrollbar-thin scrollbar-thumb-white/5">
                    </textarea>
                  </div>
                } @else {
                  <div class="flex-1 flex flex-col items-center justify-center text-stone-600 font-mono text-[11px] uppercase tracking-widest bg-[#0C0A09]/80">
                    <span class="mb-1">{{ 'FORGE.NO_FILE_SELECTED' | translate }}</span>
                    <span>{{ 'FORGE.CHOOSE_FILE' | translate }}</span>
                  </div>
                }
              </div>
            }

            <!-- Live Browser Preview Side (visible in 'preview' or 'split' layout) -->
            @if (layoutMode() === 'preview' || layoutMode() === 'split') {
              <div class="flex-1 h-full bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,162,158,0.10),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(52,211,153,0.06),transparent_24%),#0C0A09] flex flex-col overflow-hidden relative">
                @if (state.safeHtmlPreview()) {
                  <div class="pointer-events-none absolute left-5 top-5 z-10 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-stone-300 backdrop-blur-xl">
                    {{ 'FORGE.LIVE_CANVAS' | translate }}
                  </div>
                  <div class="pointer-events-none absolute right-5 top-5 z-10 rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-amber-100 backdrop-blur-xl">
                    {{ previewDevice() }}
                  </div>
                  <div class="absolute inset-x-5 bottom-5 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/45 px-3 py-2 text-[10px] font-mono text-stone-300 backdrop-blur-xl">
                    <div class="flex min-w-0 items-center gap-2">
                      <span class="rounded-full bg-amber-300/10 px-2 py-1 text-amber-100">{{ previewPagePath() || 'index.html' }}</span>
                      <span class="hidden text-stone-500 sm:inline">{{ getReportIssueCount() }} issue(s)</span>
                    </div>
                    <div class="flex items-center gap-1 overflow-x-auto">
                      @for (page of getPreviewPages().slice(0, 4); track page) {
                        <button type="button" (click)="navigatePreviewTo(page)" class="rounded-full border border-white/10 px-2 py-1 hover:border-amber-200/30 hover:text-amber-100"
                          [ngClass]="previewPagePath() === page ? 'bg-amber-300/15 text-amber-100' : 'bg-white/[0.04] text-stone-400'">
                          {{ page }}
                        </button>
                      }
                      <button type="button" (click)="updatePreview()" class="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-stone-300 hover:text-blue-400">{{ 'FORGE.REFRESH' | translate }}</button>
                    </div>
                  </div>
                  <div class="flex-1 relative flex items-center justify-center p-6">
                    <iframe 
                      [src]="state.safeHtmlPreview()" 
                      class="forge-preview-frame h-full border-none bg-white rounded-2xl transition-all duration-300" 
                      [ngClass]="getPreviewFrameClass()"
                      sandbox="allow-scripts allow-same-origin">
                    </iframe>
                  </div>
                } @else {
                  <div class="flex-1 flex flex-col items-center justify-center text-stone-500 font-mono text-[11px] uppercase tracking-widest">
                    <div class="mb-4 rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-5 text-center shadow-2xl shadow-black/30">
                      <span class="block text-amber-100">{{ 'FORGE.PREVIEW_WAITING' | translate }}</span>
                      <span class="mt-1 block text-stone-500">{{ 'FORGE.PREVIEW_HINT' | translate }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Bottom Status Bar -->
          <footer class="h-6 bg-[#0C0A09] border-t border-white/5 flex items-center justify-between px-3 text-[10px] font-mono text-stone-500 select-none z-30 shrink-0">
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
                <span>{{ 'FORGE.SERVER_ONLINE' | translate }}</span>
              </div>
            </div>

            <div class="flex items-center gap-4">
              @if (state.selectedFile() && (layoutMode() === 'code' || layoutMode() === 'split')) {
                <div class="text-stone-600">Ln {{ getLineNumbers().length }}</div>
              }
              <!-- Forge AI Brand Badge -->
              <div class="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded px-2 py-0.5">
                <svg class="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L4.09 12.25A1 1 0 005 14h7l-1 8 8.91-10.25A1 1 0 0019 10h-7l1-8z"/>
                </svg>
                <span class="text-[10px] font-mono font-semibold text-stone-300 tracking-wide">FORGE AI</span>
              </div>
              <div class="text-stone-500 font-mono text-[10px]">VersecureTech</div>
            </div>
          </footer>
        </main>
      </div>
    </div>

    <!-- Advanced Modal System — outside forge-surface to escape backdrop-filter containment -->
    @if (modalState().isOpen) {
      <div
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md select-none"
        style="position:fixed;top:0;left:0;right:0;bottom:0;">
        <div style="background:rgba(17,17,22,0.95);border:1px solid rgba(255,255,255,0.10);border-radius:2rem;max-width:26rem;width:calc(100% - 2rem);padding:1.5rem;display:flex;flex-direction:column;gap:1rem;box-shadow:0 35px 120px rgba(0,0,0,0.85);position:relative;overflow:hidden;">

          <div style="position:absolute;inset-inline:0;top:0;height:1px;background:linear-gradient(to right, transparent, rgba(99,102,241,0.5), transparent);"></div>

          <div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:0.75rem;border-bottom:1px solid rgba(255,255,255,0.05);">
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span style="font-size:11px;font-family:monospace;letter-spacing:0.16em;color:#818CF8;text-transform:uppercase;font-weight:700;">{{ modalState().title }}</span>
              <span style="font-size:10px;color:#8F9CAE;font-family:monospace;">
                @if (modalState().type === 'create_file') { {{ 'FORGE.MODAL_CREATE_FILE' | translate }} }
                @else if (modalState().type === 'create_chat') { {{ 'FORGE.MODAL_CREATE_CHAT' | translate }} }
                @else if (modalState().type === 'rename_chat') { {{ 'FORGE.MODAL_RENAME_CHAT' | translate }} }
                @else if (modalState().type === 'delete_chat') { {{ 'FORGE.MODAL_DELETE_CHAT' | translate }} }
              </span>
            </div>
            <button (click)="closeModal()" style="color:#8F9CAE;background:none;border:none;cursor:pointer;font-size:14px;padding:4px;line-height:1;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#8F9CAE'">✕</button>
          </div>

          @if (modalState().type === 'delete_chat') {
            <div style="color:#FCA5A5;font-size:11px;font-family:monospace;line-height:1.6;display:flex;gap:10px;align-items:flex-start;background:rgba(127,29,29,0.15);border:1px solid rgba(239,68,68,0.15);border-radius:12px;padding:12px;">
              <span style="font-size:16px;line-height:1;">⚠️</span>
              <span>{{ 'FORGE.DELETE_CONFIRM' | translate }}</span>
            </div>
          } @else {
            <div style="display:flex;align-items:center;gap:10px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:4px 14px;">
              @if (modalState().type === 'create_file') {
                <svg style="width:16px;height:16px;color:#8F9CAE;flex-shrink:0;" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                </svg>
              } @else {
                <svg style="width:16px;height:16px;color:#8F9CAE;flex-shrink:0;" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>
                </svg>
              }
              <input
                type="text"
                [(ngModel)]="modalInputValue"
                [placeholder]="modalState().placeholder || ''"
                (keyup.enter)="confirmModal()"
                style="width:100%;background:transparent;padding:10px 0;font-size:11px;font-family:monospace;color:#fff;outline:none;border:none;"
              />
            </div>
          }

          <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:6px;">
            <button (click)="closeModal()" style="padding:8px 18px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);border-radius:10px;font-size:10px;font-family:monospace;color:#8F9CAE;cursor:pointer;text-transform:uppercase;letter-spacing:0.1em;">
              {{ 'FORGE.CANCEL' | translate }}
            </button>
            <button (click)="confirmModal()" class="forge-button-glow" style="padding:8px 20px;border-radius:10px;font-size:10px;font-family:monospace;font-weight:700;color:#070709;cursor:pointer;text-transform:uppercase;letter-spacing:0.1em;border:none;display:flex;align-items:center;gap:6px;">
              @if (modalState().type === 'delete_chat') { <span>🗑 {{ modalState().confirmLabel }}</span> }
              @else if (modalState().type === 'rename_chat') { <span>✎ {{ modalState().confirmLabel }}</span> }
              @else { <span>+ {{ modalState().confirmLabel }}</span> }
            </button>
          </div>

        </div>
      </div>
    }
    </ng-container>
  `,
  styles: [`
    :host {
      --forge-border: rgba(99, 102, 241, 0.08);
      --forge-accent: #6366F1;
      --forge-accent-soft: #06B6D4;
      --forge-blue: #3B82F6;
      --forge-text: #FFFFFF;
      --forge-muted: #8F9CAE;
      --forge-bg-deep: #070709;
      --forge-bg-surface: #111116;
    }

    :host .forge-surface {
      isolation: isolate;
      background:
        radial-gradient(circle at 12% 10%, rgba(99, 102, 241, 0.15), transparent 28%),
        radial-gradient(circle at 84% 16%, rgba(143, 156, 174, 0.06), transparent 30%),
        radial-gradient(circle at 70% 92%, rgba(6, 182, 212, 0.08), transparent 28%),
        linear-gradient(135deg, #070709 0%, #111116 48%, #070709 100%);
    }

    :host .forge-surface::before {
      content: "";
      pointer-events: none;
      position: absolute;
      inset: -20%;
      z-index: 0;
      background:
        conic-gradient(from 120deg at 50% 50%, transparent 0deg, rgba(99, 102, 241, 0.10) 52deg, transparent 116deg, rgba(143, 156, 174, 0.04) 182deg, transparent 260deg, rgba(6, 182, 212, 0.06) 314deg, transparent 360deg);
      filter: blur(48px);
      opacity: 0.92;
      transform: translate3d(0,0,0);
    }

    :host .forge-surface > * {
      position: relative;
      z-index: 1;
    }

    /* Keep site nav above the IDE workspace (workspace is a later sibling and was capturing clicks). */
    :host .forge-surface > app-header {
      z-index: 100;
      pointer-events: auto;
    }

    :host .forge-workspace {
      z-index: 1;
      pointer-events: auto;
    }

    :host .forge-panel {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01)),
        linear-gradient(135deg, rgba(99, 102, 241, 0.04), rgba(143, 156, 174, 0.01) 52%, rgba(15, 14, 38, 0.45));
      border: 1px solid var(--forge-border);
      box-shadow:
        0 30px 100px rgba(0,0,0,0.55),
        0 0 0 1px rgba(99, 102, 241, 0.03),
        inset 0 1px 0 rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(22px);
    }

    :host .forge-button-glow {
      background: linear-gradient(135deg, var(--forge-accent), var(--forge-accent-soft));
      box-shadow: 0 16px 42px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.35);
    }

    :host .forge-message {
      box-shadow: 0 18px 52px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.04);
      backdrop-filter: blur(18px);
    }

    :host .forge-preview-frame {
      box-shadow:
        0 34px 130px rgba(0,0,0,0.6),
        0 0 0 1px rgba(255, 255, 255, 0.08),
        0 0 80px rgba(99, 102, 241, 0.08);
    }

    :host .forge-surface aside header,
    :host .forge-surface main > header,
    :host .forge-surface footer {
      background: linear-gradient(90deg, rgba(255,255,255,0.070), rgba(255,255,255,0.020)) !important;
      border-color: rgba(255,255,255,0.095) !important;
    }

    :host .forge-surface textarea {
      color: var(--forge-text);
      caret-color: var(--forge-accent);
    }

    :host .forge-surface button {
      border-radius: 999px;
    }

    :host .forge-surface button:not(:disabled) {
      transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease, filter 160ms ease;
    }

    :host .forge-surface button:not(:disabled):hover {
      transform: translateY(-1px);
    }

    :host #line-numbers-gutter {
      background: rgba(12, 10, 9, 0.82) !important;
      border-color: rgba(245,245,244,0.07) !important;
    }

    :host .forge-subtle-grid {
      background-image:
        linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
      background-size: 42px 42px;
      mask-image: radial-gradient(circle at center, black, transparent 75%);
    }

    :host .scrollbar-none::-webkit-scrollbar {
      display: none;
    }
    :host .scrollbar-none {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    /* Mobile-only: keep IDE usable inside the visible viewport without changing desktop layout */
    @media (max-width: 767px) {
      :host {
        display: block;
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100dvh;
        max-height: 100dvh;
        overflow: hidden;
        z-index: 40;
      }

      :host .forge-surface {
        height: 100%;
        max-height: 100%;
        overscroll-behavior: none;
      }

      :host .forge-surface::before {
        inset: 0;
        filter: blur(24px);
        opacity: 0.55;
      }

      :host .forge-workspace {
        min-height: 0;
        flex: 1 1 auto;
      }

      :host .forge-panel {
        backdrop-filter: blur(10px);
      }

      :host aside.forge-panel {
        min-height: 0;
        max-height: 100%;
      }

      :host .forge-composer {
        max-height: 42dvh;
        overflow-y: auto;
        overscroll-behavior: contain;
      }

      :host .forge-prompt {
        min-height: 72px !important;
      }
    }
  `]
})
export class ForgeComponent implements OnInit {
  modalState = signal<{
    isOpen: boolean;
    type: 'create_file' | 'create_chat' | 'rename_chat' | 'delete_chat';
    title: string;
    placeholder?: string;
    defaultValue?: string;
    chatId?: string;
    confirmLabel: string;
  }>({
    isOpen: false,
    type: 'create_file',
    title: '',
    confirmLabel: ''
  });
  modalInputValue = '';

  activeTab = signal<'explorer' | 'chat' | 'sessions'>('chat');
  sidebarExpanded = signal(true);
  layoutMode = signal<'split' | 'code' | 'preview'>('split');
  previewDevice = signal<'desktop' | 'tablet' | 'mobile'>('desktop');
  previewPagePath = signal<string>('');
  showIntelligencePanel = signal(false);
  readonly previewDevices = [
    { id: 'desktop' as const, label: 'Desktop' },
    { id: 'tablet' as const, label: 'Tablet' },
    { id: 'mobile' as const, label: 'Mobile' }
  ];
  readonly quickActions = [
    { labelKey: 'FORGE.QA_PREMIUM', prompt: 'Make this project dramatically more premium, polished, responsive, and launch-ready.' },
    { labelKey: 'FORGE.QA_FIX', prompt: 'Check again, debug the project, repair broken HTML, preview, navigation, and missing pages.' },
    { labelKey: 'FORGE.QA_PAGE', prompt: 'Add a complete new page with matching navigation, responsive design, and shared styling.' },
    { labelKey: 'FORGE.QA_MOBILE', prompt: 'Improve the mobile and tablet experience with responsive spacing, navigation, and layout polish.' },
    { labelKey: 'FORGE.QA_RESEARCH', prompt: 'Research current design trends for this type of website and apply the best ideas to this project.' }
  ];
  readonly builderSteps = ['Plan architecture', 'Generate files', 'Validate routes', 'Repair gaps', 'Score quality'];

  /** 
   * Toggles sidebar: if same tab clicked → collapse/expand; 
   * if different tab clicked → always open and switch.
   * Must read current state BEFORE mutating activeTab.
   */
  toggleTab(tab: 'explorer' | 'chat' | 'sessions') {
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

  htmlPageCount(): number {
    return this.state.files().filter((file) => file.path.endsWith('.html')).length;
  }

  getPreviewPages(): string[] {
    return this.state.files()
      .filter((file) => file.path.endsWith('.html'))
      .map((file) => this.normalizePreviewPath(file.path))
      .sort();
  }

  navigatePreviewTo(path: string) {
    this.previewPagePath.set(this.normalizePreviewPath(path));
    this.layoutMode.set('preview');
    this.updatePreview();
  }

  getReportIssueCount(): number {
    const report = this.state.currentChat()?.lastBuildReport;
    return report ? report.unresolvedLinks.length + report.warnings.length : 0;
  }

  getDeployReadinessSummary(): string {
    const report = this.state.currentChat()?.lastBuildReport;
    if (!report) return 'Waiting for the first validated build.';
    if (report.qualityScore >= 88 && this.getReportIssueCount() === 0) return 'Launch candidate. No blocking issues detected.';
    if (report.qualityScore >= 72) return 'Promising build. Review tracked issues before launch.';
    return 'Needs another optimization pass before launch.';
  }

  getWorkflowSteps(): ForgeWorkflowStep[] {
    const chat = this.state.currentChat();
    return chat?.activeWorkflowRun?.steps ?? chat?.workflowRuns?.[0]?.steps ?? [];
  }

  getActiveWorkflowLabel(): string {
    const runningStep = this.getWorkflowSteps().find((step) => step.status === 'running');
    if (runningStep) return `${runningStep.label} in progress`;
    const latestStep = [...this.getWorkflowSteps()].reverse().find((step) => step.status === 'completed');
    return latestStep ? `${latestStep.label} completed` : 'Ready when you are';
  }

  getPreviewFrameClass(): string {
    if (this.previewDevice() === 'mobile') return 'w-[390px] max-w-full';
    if (this.previewDevice() === 'tablet') return 'w-[820px] max-w-full';
    return 'w-full';
  }

  getReportIssueSummary(report: BuildReport): string {
    if (report.unresolvedLinks.length > 0) {
      const examples = report.unresolvedLinks.slice(0, 3).map((link) => link.href).join(', ');
      return `Missing linked pages detected: ${examples}. Forge did not create placeholders; ask it to generate the real pages.`;
    }
    return report.warnings.slice(0, 2).join(' ');
  }

  applyQuickAction(promptText: string) {
    const current = this.prompt().trim();
    this.prompt.set(current ? `${current}\n\n${promptText}` : promptText);
  }

  private setWorkflowPhase(phase: ForgeWorkflowPhase, summary: string, diagnostics: string[] = [], confidence = 82) {
    this.builderStatus.set(summary);
    this.state.updateWorkflowPhase(phase, {
      summary,
      confidence,
      diagnostics: diagnostics.length ? diagnostics : [summary]
    });
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
    return 'bg-stone-500';
  }

  getFileTypeLabel(path: string): string {
    if (path.endsWith('.html')) return 'HTML';
    if (path.endsWith('.css')) return 'CSS';
    if (path.endsWith('.js')) return 'JS';
    if (path.endsWith('.ts')) return 'TS';
    return 'TXT';
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  prompt = signal('');
  chatSearch = signal('');
  loading = signal(false);
  builderStatus = signal('Ready to build');
  error = signal('');
  saving = signal(false);
  successMessage = signal('');
  isChatOpen = signal(false);
  isExplorerOpen = signal(false);
  copyText = signal('Copy');
  uploadedFiles = signal<File[]>([]);

  private t(key: string): string {
    return this.translation.translate(key);
  }

  private resetReadyStatus() {
    this.builderStatus.set(this.t('FORGE.READY_TO_BUILD'));
  }
  
  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  chatTimeline = viewChild<ElementRef<HTMLDivElement>>('chatTimeline');
  
  state = inject(ForgeStateService);
  contextEngine = inject(ForgeContextEngineService);
  public supabase = inject(SupabaseService);
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);
  private translation = inject(TranslationService);
  private router = inject(Router);

  constructor() {
    afterNextRender(async () => {
      // Logic for client-side only can go here if needed
    });
  }

  ngOnInit() {
    this.resetReadyStatus();
    this.copyText.set(this.t('FORGE.COPY'));
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

  forwardComposerWheel(event: WheelEvent) {
    const timeline = this.chatTimeline()?.nativeElement;
    if (!timeline || event.deltaY === 0) return;
    const canScrollUp = timeline.scrollTop > 0;
    const canScrollDown = timeline.scrollTop + timeline.clientHeight < timeline.scrollHeight - 1;
    if ((event.deltaY < 0 && canScrollUp) || (event.deltaY > 0 && canScrollDown)) {
      timeline.scrollTop += event.deltaY;
      event.preventDefault();
    }
  }

  createNewFile() {
    this.modalInputValue = '';
    this.modalState.set({
      isOpen: true,
      type: 'create_file',
      title: 'Create New File',
      placeholder: 'Enter file name (e.g., script.js, styles.css):',
      confirmLabel: 'Create'
    });
  }

  createNewChat() {
    this.modalInputValue = 'New Chat';
    this.modalState.set({
      isOpen: true,
      type: 'create_chat',
      title: 'Create New Chat',
      placeholder: 'Enter chat title:',
      confirmLabel: 'Create'
    });
  }

  getVisibleChats() {
    const search = this.chatSearch().trim().toLowerCase();
    const chats = this.state.chats();
    if (!search) return chats;
    return chats.filter((chat) => {
      const haystack = `${chat.title} ${chat.projectSummary} ${chat.conversationSummary}`.toLowerCase();
      return haystack.includes(search);
    });
  }

  switchChat(chatId: string) {
    this.state.switchChat(chatId);
    this.activeTab.set('chat');
  }

  renameChat(chatId: string, event: Event) {
    event.stopPropagation();
    const currentChat = this.state.chats().find((chat) => chat.id === chatId);
    const title = currentChat?.title || 'Chat';
    this.modalInputValue = title;
    this.modalState.set({
      isOpen: true,
      type: 'rename_chat',
      title: 'Rename Chat',
      placeholder: 'Enter new chat title:',
      confirmLabel: 'Rename',
      chatId: chatId
    });
  }

  duplicateChat(chatId: string, event: Event) {
    event.stopPropagation();
    const duplicate = this.state.duplicateChat(chatId);
    if (duplicate) {
      this.activeTab.set('chat');
      this.chatSearch.set('');
    }
  }

  togglePin(chatId: string, event: Event) {
    event.stopPropagation();
    const chat = this.state.chats().find((entry) => entry.id === chatId);
    if (chat) {
      this.state.updateChatMetadata(chatId, { pinned: !chat.pinned });
    }
  }

  deleteChat(chatId: string, event: Event) {
    event.stopPropagation();
    this.modalState.set({
      isOpen: true,
      type: 'delete_chat',
      title: 'Delete Chat Session',
      confirmLabel: 'Delete',
      chatId: chatId
    });
  }

  closeModal() {
    this.modalState.set({ ...this.modalState(), isOpen: false });
  }

  confirmModal() {
    const state = this.modalState();
    const val = this.modalInputValue.trim();

    if (state.type === 'create_file') {
      if (val) {
        this.state.addFile({ path: val, content: '' });
      }
    } else if (state.type === 'create_chat') {
      const title = val || 'New Chat';
      this.state.createChat(title);
      this.chatSearch.set('');
      this.activeTab.set('chat');
    } else if (state.type === 'rename_chat') {
      if (val && state.chatId) {
        this.state.updateChatMetadata(state.chatId, { title: val });
      }
    } else if (state.type === 'delete_chat') {
      if (state.chatId) {
        this.state.deleteChat(state.chatId);
      }
    }

    this.closeModal();
  }

  downloadZip() {
    const files = this.state.files();
    if (files.length === 0) {
      this.error.set('No files to export yet. Generate a project first.');
      return;
    }

    const blob = this.createZipBlob(files);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.slugifyFileName(this.state.currentChat()?.title || 'forge-project')}.zip`;
    link.click();
    URL.revokeObjectURL(url);
    this.successMessage.set('Exported project ZIP');
    setTimeout(() => this.successMessage.set(''), 2500);
  }

  private slugifyFileName(value: string): string {
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return slug || 'forge-project';
  }

  private createZipBlob(files: GeneratedFile[]): Blob {
    const encoder = new TextEncoder();
    const localParts: Uint8Array[] = [];
    const centralParts: Uint8Array[] = [];
    let offset = 0;

    for (const file of files) {
      const name = this.normalizePreviewPath(file.path);
      const nameBytes = encoder.encode(name);
      const contentBytes = encoder.encode(file.content || '');
      const crc = this.crc32(contentBytes);
      const { dosTime, dosDate } = this.getZipDateTime();

      const localHeader = new Uint8Array(30 + nameBytes.length);
      const localView = new DataView(localHeader.buffer);
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0, true);
      localView.setUint16(8, 0, true);
      localView.setUint16(10, dosTime, true);
      localView.setUint16(12, dosDate, true);
      localView.setUint32(14, crc, true);
      localView.setUint32(18, contentBytes.length, true);
      localView.setUint32(22, contentBytes.length, true);
      localView.setUint16(26, nameBytes.length, true);
      localView.setUint16(28, 0, true);
      localHeader.set(nameBytes, 30);

      localParts.push(localHeader, contentBytes);

      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const centralView = new DataView(centralHeader.buffer);
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint16(12, dosTime, true);
      centralView.setUint16(14, dosDate, true);
      centralView.setUint32(16, crc, true);
      centralView.setUint32(20, contentBytes.length, true);
      centralView.setUint32(24, contentBytes.length, true);
      centralView.setUint16(28, nameBytes.length, true);
      centralView.setUint16(30, 0, true);
      centralView.setUint16(32, 0, true);
      centralView.setUint16(34, 0, true);
      centralView.setUint16(36, 0, true);
      centralView.setUint32(38, 0, true);
      centralView.setUint32(42, offset, true);
      centralHeader.set(nameBytes, 46);
      centralParts.push(centralHeader);

      offset += localHeader.length + contentBytes.length;
    }

    const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
    const endHeader = new Uint8Array(22);
    const endView = new DataView(endHeader.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(8, files.length, true);
    endView.setUint16(10, files.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, offset, true);

    const blobParts = [...localParts, ...centralParts, endHeader].map((part) => this.toArrayBuffer(part));
    return new Blob(blobParts, { type: 'application/zip' });
  }

  private toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    return buffer;
  }

  private getZipDateTime(): { dosTime: number; dosDate: number } {
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    return { dosTime, dosDate };
  }

  private crc32(data: Uint8Array): number {
    let crc = 0xffffffff;
    for (const byte of data) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  copyCode() {
    const content = this.state.selectedFile()?.content;
    if (content) {
      navigator.clipboard.writeText(content).then(() => {
        this.copyText.set(this.t('FORGE.COPIED'));
        setTimeout(() => this.copyText.set(this.t('FORGE.COPY')), 2000);
      }).catch(() => {
        this.error.set('Clipboard access was blocked.');
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

  private isUpgradeRequest(prompt: string): boolean {
    return forgeAiUtils.isUpgradeRequest(prompt);
  }

  private isPortfolioRequest(prompt: string): boolean {
    return forgeAiUtils.isPortfolioOrWebsiteRequest(prompt);
  }

  private isProjectBuildRequest(prompt: string): boolean {
    return forgeAiUtils.isProjectBuildRequest(prompt);
  }

  private isRepairRequest(prompt: string): boolean {
    return forgeAiUtils.isRepairRequest(prompt);
  }

  private shouldUsePremiumFallback(parsedFiles: GeneratedFile[] | undefined, request: string, existingFiles: GeneratedFile[]): boolean {
    return forgeAiUtils.shouldUsePremiumPortfolioFallback(request, parsedFiles, existingFiles);
  }

  private looksLikeProjectPayload(text: string): boolean {
    return forgeAiUtils.looksLikeProjectPayload(text);
  }

  private safeModelMessage(message: string | undefined, fallback: string): string {
    const text = typeof message === 'string' ? message.trim() : '';
    if (!text || this.looksLikeProjectPayload(text)) {
      return fallback;
    }
    return text;
  }

  private safeChatFallback(rawText: string | undefined): string {
    const text = typeof rawText === 'string' ? rawText.trim() : '';
    if (!text || this.looksLikeProjectPayload(text)) {
      return 'I had trouble applying that update, but I blocked raw code from being shown in chat.';
    }

    return text.length > 500 ? `${text.slice(0, 500)}...` : text;
  }

  private mergeHtmlIntoProject(existingFiles: GeneratedFile[], html: string): GeneratedFile[] {
    const htmlFile = existingFiles.find((file) => file.path.endsWith('index.html') || file.path.endsWith('.html'));
    const path = htmlFile?.path || 'index.html';
    const others = existingFiles.filter((file) => file.path !== path);
    return [{ path, content: html }, ...others];
  }

  private enhanceExistingProject(existingFiles: GeneratedFile[]): GeneratedFile[] {
    if (existingFiles.length === 0) {
      return this.buildPremiumPortfolioFallback(existingFiles);
    }

    return existingFiles.map((file) => {
      if (!file.path.endsWith('.html')) {
        return file;
      }

      let content = file.content || '';

      if (!content.includes('tailwindcss')) {
        content = content.replace('</head>', '  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>\n</head>');
      }

      if (!content.includes('backdrop-filter')) {
        const premiumStyles = `
  <style>
    :root { color-scheme: dark; }
    body { font-family: Inter, system-ui, sans-serif; background: #050816; color: #e2e8f0; }
    .glass { background: rgba(255,255,255,0.06); backdrop-filter: blur(18px); }
    .fade-in { animation: fadeIn 700ms ease both; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  </style>`;
        content = content.replace('</head>', `${premiumStyles}\n</head>`);
      }

      if (!content.includes('class="fade-in"')) {
        content = content.replace(/<section/gi, '<section class="fade-in"');
      }

      if (!content.includes('class="glass')) {
        content = content.replace(/<nav/gi, '<nav class="glass sticky top-0 z-20 border-b border-white/10"');
      }

      if (!content.includes('data-forge-premium-upgrade')) {
        const premiumUpgrade = `
  <section data-forge-premium-upgrade class="fade-in mx-auto my-16 max-w-7xl rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-fuchsia-400/10 to-white/5 p-8 text-slate-100 shadow-2xl shadow-cyan-950/20">
    <div class="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <div class="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-sm text-amber-100">Premium upgrade applied</div>
        <h2 class="mt-4 text-4xl font-semibold tracking-tight">A sharper, richer experience built for launch.</h2>
        <p class="mt-4 text-lg leading-8 text-slate-300">Forge enhanced the project with stronger visual hierarchy, premium glass styling, responsive content blocks, and clearer conversion paths.</p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        ${['Conversion-ready sections','Responsive polish','Stronger visual system','Launch-quality details'].map((item) => `<div class="glass rounded-2xl border border-white/10 p-5"><div class="text-lg font-semibold">${item}</div><p class="mt-2 text-sm leading-6 text-slate-400">Designed to make the generated site feel more complete and production-ready.</p></div>`).join('')}
      </div>
    </div>
  </section>`;

        content = content.includes('</main>')
          ? content.replace('</main>', `${premiumUpgrade}\n</main>`)
          : content.replace('</body>', `${premiumUpgrade}\n</body>`);
      }

      return { ...file, content };
    });
  }

  private resolveProjectFilesFromResponse(userPrompt: string, rawContent: string): GeneratedFile[] {
    const extractedHtml = forgeAiUtils.extractHtmlFromText(rawContent);
    const existingFiles = this.state.files();

    if (extractedHtml) {
      return this.mergeHtmlIntoProject(existingFiles, extractedHtml);
    }

    if (this.shouldUsePremiumFallback(undefined, userPrompt, existingFiles)) {
      return this.buildPremiumPortfolioFallback(existingFiles);
    }

    if (existingFiles.length > 0) {
      return this.enhanceExistingProject(existingFiles);
    }

    return this.buildGenericProjectFallback(userPrompt);
  }

  private applyProjectFromMalformedResponse(userPrompt: string, rawContent: string, successMessage: string): void {
    const filesToApply = this.resolveProjectFilesFromResponse(userPrompt, rawContent);
    const hasUsableHtml = filesToApply.some((file) => file.path.endsWith('.html') && (file.content || '').includes('<html'));

    if (!hasUsableHtml) {
      throw new Error('Generated files were incomplete.');
    }

    this.applyValidatedFiles(filesToApply, {}, successMessage);
  }

  private buildGenericProjectFallback(prompt: string): GeneratedFile[] {
    const normalized = prompt.trim().replace(/\s+/g, ' ');
    const title = normalized
      ? normalized.replace(/^(build|create|make|generate|design)\s+(me\s+)?(a|an)?\s*/i, '').slice(0, 48)
      : 'Premium Web Experience';
    const displayTitle = title.charAt(0).toUpperCase() + title.slice(1);
    const safeTitle = displayTitle.replace(/[<>"']/g, '');
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
  <style>
    :root { color-scheme: dark; }
    body { font-family: Inter, system-ui, sans-serif; }
    .glass { background: rgba(255,255,255,0.07); backdrop-filter: blur(18px); }
    .fade-in { animation: fadeIn 700ms ease both; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body class="min-h-screen bg-[#050816] text-slate-100">
  <main class="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-6 py-12 lg:px-10">
    <nav class="glass flex items-center justify-between rounded-full border border-white/10 px-5 py-3">
      <div class="text-sm font-semibold uppercase tracking-[0.28em] text-white">${safeTitle}</div>
      <a href="#contact" class="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950">Start now</a>
    </nav>

    <section class="fade-in grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr]">
      <div class="space-y-6">
        <div class="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-amber-200">Premium launch-ready interface</div>
        <h1 class="max-w-4xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">${safeTitle}</h1>
        <p class="max-w-2xl text-lg leading-8 text-slate-400">A polished, responsive, production-ready starting point recovered automatically when the AI response could not be applied cleanly.</p>
        <div class="flex flex-wrap gap-3">
          <a href="#features" class="rounded-full bg-amber-300 px-5 py-3 font-medium text-slate-950">Explore features</a>
          <a href="#contact" class="rounded-full border border-white/15 px-5 py-3 font-medium text-white">Contact us</a>
        </div>
      </div>
      <div class="glass rounded-[2rem] border border-white/10 p-6 shadow-2xl shadow-cyan-950/20">
        <div class="grid gap-4">
          <div class="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            <div class="text-sm uppercase tracking-[0.22em] text-slate-400">Experience Score</div>
            <div class="mt-3 text-5xl font-semibold">98%</div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl border border-white/10 bg-white/5 p-4"><div class="text-2xl font-semibold">Fast</div><div class="mt-1 text-sm text-slate-400">Optimized layout</div></div>
            <div class="rounded-2xl border border-white/10 bg-white/5 p-4"><div class="text-2xl font-semibold">Sharp</div><div class="mt-1 text-sm text-slate-400">Premium visuals</div></div>
          </div>
        </div>
      </div>
    </section>

    <section id="features" class="grid gap-5 md:grid-cols-3">
      ${['Responsive design', 'Clear conversion flow', 'Modern visual system'].map((item) => `<article class="glass rounded-3xl border border-white/10 p-6"><h2 class="text-xl font-semibold">${item}</h2><p class="mt-3 text-sm leading-7 text-slate-400">Built to feel polished, trustworthy, and ready to extend.</p></article>`).join('')}
    </section>

    <section id="contact" class="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-8">
      <h2 class="text-3xl font-semibold">Ready for the next iteration.</h2>
      <p class="mt-3 max-w-2xl text-slate-300">Ask Forge AI to customize colors, copy, sections, animations, or content and it will update this project in place.</p>
    </section>
  </main>
</body>
</html>`;

    return [
      { path: 'index.html', content: html },
      { path: 'styles.css', content: ':root{color-scheme:dark;} body{background:#050816;}' },
      { path: 'script.js', content: 'document.documentElement.style.scrollBehavior = "smooth";' }
    ];
  }

  private buildPremiumPortfolioFallback(existingFiles: GeneratedFile[]): GeneratedFile[] {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Alex Rivera • Premium Portfolio</title>
  <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
  <style>
    :root { color-scheme: dark; }
    body { font-family: Inter, system-ui, sans-serif; }
    .glass { background: rgba(255,255,255,0.06); backdrop-filter: blur(18px); }
    .fade-in { animation: fadeIn 700ms ease both; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body class="min-h-screen bg-[#050816] text-slate-100 selection:bg-fuchsia-500/40">
  <nav class="sticky top-0 z-20 border-b border-white/10 bg-[#050816]/80 backdrop-blur-xl">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
      <div class="text-lg font-semibold tracking-[0.24em] uppercase">Alex Rivera</div>
      <div class="hidden gap-6 text-sm text-slate-300 md:flex">
        <a href="#about" class="hover:text-white">About</a>
        <a href="#work" class="hover:text-white">Work</a>
        <a href="#skills" class="hover:text-white">Skills</a>
        <a href="#contact" class="hover:text-white">Contact</a>
      </div>
    </div>
  </nav>

  <main class="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 lg:px-10 lg:py-24">
    <section class="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
      <div class="fade-in space-y-6">
        <div class="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-sm text-fuchsia-200">Available for select freelance projects</div>
        <h1 class="max-w-3xl text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">Designing premium digital experiences with strategy and code.</h1>
        <p class="max-w-2xl text-lg text-slate-400">I build polished portfolios, product experiences, and thoughtful interfaces that feel premium from the first scroll.</p>
        <div class="flex flex-wrap gap-3">
          <a href="#work" class="rounded-full bg-white px-5 py-3 font-medium text-slate-950">View work</a>
          <a href="#contact" class="rounded-full border border-white/15 px-5 py-3 font-medium text-slate-200">Let's talk</a>
        </div>
      </div>
      <div class="fade-in glass rounded-3xl border border-white/10 p-6 shadow-2xl shadow-fuchsia-950/20">
        <div class="grid gap-4">
          <div class="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div class="text-sm uppercase tracking-[0.22em] text-slate-400">Featured launch</div>
            <div class="mt-3 text-2xl font-semibold">Linear AI Studio</div>
            <div class="mt-2 text-sm text-slate-400">A premium interface system for AI-native product teams.</div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl border border-white/10 bg-slate-950/70 p-4"><div class="text-3xl font-semibold">120+</div><div class="mt-1 text-sm text-slate-400">Projects shipped</div></div>
            <div class="rounded-2xl border border-white/10 bg-slate-950/70 p-4"><div class="text-3xl font-semibold">4.9/5</div><div class="mt-1 text-sm text-slate-400">Client satisfaction</div></div>
          </div>
        </div>
      </div>
    </section>

    <section id="about" class="grid gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 lg:grid-cols-[0.8fr_1.2fr]">
      <div>
        <div class="text-sm uppercase tracking-[0.24em] text-fuchsia-300">About</div>
        <h2 class="mt-3 text-3xl font-semibold">Crafting products that feel effortless and memorable.</h2>
      </div>
      <div class="text-lg leading-8 text-slate-400">I blend product strategy, visual systems, and modern frontend engineering to create experiences that feel elevated, fast, and intuitive for the people using them.</div>
    </section>

    <section id="work" class="grid gap-5 lg:grid-cols-3">
      ${['Linear AI Studio','Stripe Intelligence','Vercel Studio'].map((title, i) => `<article class="fade-in rounded-[1.5rem] border border-white/10 bg-white/5 p-6"><div class="text-sm text-slate-400">0${i + 1}</div><h3 class="mt-3 text-2xl font-semibold">${title}</h3><p class="mt-3 text-sm leading-7 text-slate-400">High-end digital products with strong storytelling, motion, and product clarity.</p></article>`).join('')}
    </section>

    <section id="skills" class="grid gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 lg:grid-cols-[0.85fr_1.15fr]">
      <div>
        <div class="text-sm uppercase tracking-[0.24em] text-fuchsia-300">Skills</div>
        <h2 class="mt-3 text-3xl font-semibold">A multidisciplinary toolkit built for modern product teams.</h2>
      </div>
      <div class="flex flex-wrap gap-3">
        ${['Figma','React','Tailwind','Motion','TypeScript','Product Strategy'].map((skill) => `<span class="rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-slate-300">${skill}</span>`).join('')}
      </div>
    </section>

    <section id="contact" class="rounded-[2rem] border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 to-indigo-500/10 p-8">
      <div class="max-w-2xl">
        <div class="text-sm uppercase tracking-[0.24em] text-fuchsia-300">Contact</div>
        <h2 class="mt-3 text-3xl font-semibold">Let's create something bold and memorable.</h2>
        <p class="mt-3 text-lg text-slate-300">If you want a premium website or product experience, I’d love to help shape it.</p>
        <a href="mailto:hello@alexrivera.com" class="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-medium text-slate-950">hello@alexrivera.com</a>
      </div>
    </section>
  </main>
</body>
</html>`;

    return [
      { path: 'index.html', content: html },
      { path: 'styles.css', content: `:root{color-scheme:dark;} body{background:#050816;}` },
      { path: 'script.js', content: `document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', () => document.documentElement.scrollIntoView({ behavior: 'smooth' })));` }
    ];
  }

  updatePreview() {
    const files = this.state.files();
    const htmlFiles = files.filter((file) => file.path.endsWith('.html'));
    const requestedPath = this.previewPagePath();
    const entryFile = requestedPath
      ? htmlFiles.find((file) => this.normalizePreviewPath(file.path) === requestedPath) ?? this.resolvePreviewEntryFile(htmlFiles)
      : this.resolvePreviewEntryFile(htmlFiles);

    if (!entryFile) {
      this.state.setPreview(null);
      return;
    }

    const pages = htmlFiles.reduce<Record<string, string>>((acc, file) => {
      const normalizedPath = this.normalizePreviewPath(file.path);
      acc[normalizedPath] = this.inlinePreviewAssets(file.content || '', file.path, files);
      return acc;
    }, {});

    const entryPath = this.normalizePreviewPath(entryFile.path);
    this.previewPagePath.set(entryPath);
    const previewHtml = this.buildPreviewShell(pages, entryPath);
    const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(previewHtml)}`;
    this.state.setPreview(this.sanitizer.bypassSecurityTrustResourceUrl(dataUri));
  }

  private resolvePreviewEntryFile(htmlFiles: GeneratedFile[]): GeneratedFile | undefined {
    return htmlFiles.find((file) => this.normalizePreviewPath(file.path) === 'index.html')
      ?? htmlFiles.find((file) => this.normalizePreviewPath(file.path).endsWith('/index.html'))
      ?? htmlFiles[0];
  }

  private normalizePreviewPath(path: string): string {
    return (path || 'index.html')
      .replace(/\\/g, '/')
      .replace(/^\.?\//, '')
      .replace(/^\/+/, '')
      .split('#')[0]
      .split('?')[0]
      .trim() || 'index.html';
  }

  private resolvePreviewAssetPath(rawPath: string, fromPath: string): string {
    const cleanPath = this.normalizePreviewPath(rawPath);
    if (/^(https?:|mailto:|tel:|data:|blob:|#)/i.test(rawPath)) {
      return rawPath;
    }
    if (rawPath.startsWith('/')) {
      return cleanPath;
    }

    const baseParts = this.normalizePreviewPath(fromPath).split('/');
    baseParts.pop();
    const combined = [...baseParts, cleanPath].filter(Boolean);
    const resolved: string[] = [];

    for (const part of combined) {
      if (part === '..') {
        resolved.pop();
      } else if (part !== '.') {
        resolved.push(part);
      }
    }

    return resolved.join('/') || cleanPath;
  }

  private inlinePreviewAssets(html: string, fromPath: string, files: GeneratedFile[]): string {
    const filesByPath = new Map(files.map((file) => [this.normalizePreviewPath(file.path), file.content || '']));
    let result = html;

    result = result.replace(/<link\b([^>]*?)href=["']([^"']+\.css)["']([^>]*)>/gi, (match, before, href, after) => {
      const assetPath = this.resolvePreviewAssetPath(href, fromPath);
      const content = filesByPath.get(assetPath);
      return content ? `<style data-forge-asset="${assetPath}">${content}</style>` : match;
    });

    result = result.replace(/<script\b([^>]*?)src=["']([^"']+\.(?:js|ts))["']([^>]*)>\s*<\/script>/gi, (match, before, src, after) => {
      const assetPath = this.resolvePreviewAssetPath(src, fromPath);
      const content = filesByPath.get(assetPath);
      return content ? `<script data-forge-asset="${assetPath}">${this.escapeClosingScript(content)}</script>` : match;
    });

    const globalCss = files.find((file) => file.path.endsWith('.css') && !result.includes(`data-forge-asset="${this.normalizePreviewPath(file.path)}"`));
    const globalJs = files.find((file) => (file.path.endsWith('.js') || file.path.endsWith('.ts')) && !file.path.includes('server') && !result.includes(`data-forge-asset="${this.normalizePreviewPath(file.path)}"`));

    if (globalCss?.content && result.includes('</head>')) {
      result = result.replace('</head>', `<style data-forge-global-css>${globalCss.content}</style></head>`);
    }
    if (globalJs?.content && result.includes('</body>')) {
      result = result.replace('</body>', `<script data-forge-global-js>${this.escapeClosingScript(globalJs.content)}</script></body>`);
    }

    return result;
  }

  private buildPreviewShell(pages: Record<string, string>, entryPath: string): string {
    const serializedPages = this.escapeClosingScript(JSON.stringify(pages));
    const runtime = `
<script>
(function () {
  var pages = ${serializedPages};
  var currentPath = ${JSON.stringify(entryPath)};
  var runtimeTag = document.currentScript ? document.currentScript.outerHTML : '';

  function normalize(path) {
    if (!path) return 'index.html';
    var cleaned = String(path).replace(/^https?:\\/\\/[^/]+/i, '').replace(/^\\.?\\//, '').replace(/^\\/+/, '').split('#')[0].split('?')[0] || 'index.html';
    return cleaned;
  }

  function resolveRelative(path) {
    if (!path) return currentPath;
    if (path.charAt(0) === '/' || path.charAt(0) === '#') return normalize(path);
    var base = currentPath.split('/');
    base.pop();
    var parts = base.concat(String(path).split('#')[0].split('?')[0].split('/'));
    var resolved = [];
    for (var i = 0; i < parts.length; i += 1) {
      if (!parts[i] || parts[i] === '.') continue;
      if (parts[i] === '..') {
        resolved.pop();
      } else {
        resolved.push(parts[i]);
      }
    }
    return resolved.join('/') || 'index.html';
  }

  function candidates(path) {
    var clean = normalize(path);
    var withoutSlash = clean.replace(/\\/$/, '');
    var withoutHtml = withoutSlash.replace(/\\.html$/i, '');
    return [clean, withoutSlash, withoutSlash + '.html', withoutSlash + '/index.html', withoutHtml + '.html', withoutHtml + '/index.html', 'pages/' + withoutHtml + '.html'];
  }

  function resolve(path) {
    var list = candidates(path);
    for (var i = 0; i < list.length; i += 1) {
      if (pages[list[i]]) return list[i];
    }
    return null;
  }

  function render(path, hash) {
    var resolved = resolve(resolveRelative(path));
    if (!resolved) return false;
    currentPath = resolved;
    document.open();
    document.write(injectRuntime(pages[resolved]));
    document.close();
    if (hash) {
      setTimeout(function () {
        var target = findHashTarget(hash);
        if (target) target.scrollIntoView();
      }, 0);
    }
    return true;
  }

  function findHashTarget(hash) {
    if (!hash || hash === '#') return null;
    var id = hash.slice(1);
    try {
      return document.querySelector(hash) || document.getElementById(id);
    } catch (error) {
      return document.getElementById(id);
    }
  }

  function isExternalHref(href) {
    return /^(https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(href || '');
  }

  function patchLinks() {
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i += 1) {
      var link = links[i];
      var href = link.getAttribute('data-forge-href') || link.getAttribute('href') || '';
      if (!href || isExternalHref(href) || href.charAt(0) === '#') continue;
      link.setAttribute('data-forge-href', href);
      link.setAttribute('href', '#');
      link.removeAttribute('target');
    }
  }

  function showMissingPage(path) {
    var notice = document.createElement('div');
    notice.setAttribute('data-forge-preview-notice', 'true');
    notice.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;max-width:calc(100% - 32px);padding:12px 16px;border-radius:14px;background:#09090b;color:#f4f4f5;border:1px solid rgba(255,255,255,.16);box-shadow:0 20px 60px rgba(0,0,0,.35);font:13px system-ui,sans-serif;text-align:center;';
    notice.textContent = 'Forge preview could not find "' + path + '" in the generated files, so it kept you on this page instead of going blank.';
    var oldNotice = document.querySelector('[data-forge-preview-notice]');
    if (oldNotice) oldNotice.remove();
    document.body.appendChild(notice);
    setTimeout(function () {
      if (notice.parentNode) notice.parentNode.removeChild(notice);
    }, 4200);
  }

  function injectRuntime(html) {
    var source = String(html);
    if (!runtimeTag) return source;
    return /<\\/body>/i.test(source) ? source.replace(/<\\/body>/i, runtimeTag + '</body>') : source + runtimeTag;
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('data-forge-href') || link.getAttribute('href') || '';
    if (!href || isExternalHref(href)) return;
    if (href.charAt(0) === '#' && findHashTarget(href)) return;
    var hash = href.indexOf('#') >= 0 ? href.slice(href.indexOf('#')) : '';
    var path = href.split('#')[0] || currentPath;
    event.preventDefault();
    if (render(path, hash)) {
      return;
    }
    showMissingPage(path);
  }, true);

  patchLinks();
  setTimeout(patchLinks, 0);
  window.__forgeNavigate = render;
}());
</script>`;

    const page = pages[entryPath] ?? Object.values(pages)[0] ?? '<!DOCTYPE html><html><body></body></html>';
    return page.includes('</body>')
      ? page.replace('</body>', `${runtime}</body>`)
      : `${page}${runtime}`;
  }

  private escapeClosingScript(content: string): string {
    return content.replace(/<\/script/gi, '<\\/script');
  }

  private isExternalPreviewHref(href: string): boolean {
    return /^(https?:|mailto:|tel:|data:|blob:|javascript:)/i.test(href || '');
  }

  private getRouteCandidates(rawPath: string): string[] {
    const clean = this.normalizePreviewPath(rawPath);
    const withoutSlash = clean.replace(/\/$/, '');
    const withoutHtml = withoutSlash.replace(/\.html$/i, '');
    return Array.from(new Set([
      clean,
      withoutSlash,
      `${withoutSlash}.html`,
      `${withoutSlash}/index.html`,
      `${withoutHtml}.html`,
      `${withoutHtml}/index.html`,
      `pages/${withoutHtml}.html`
    ].filter(Boolean)));
  }

  private resolvePreviewPagePath(href: string, fromPath: string, pagePaths: Set<string>): { resolved: string | null; expectedPath: string } {
    const pathOnly = href.split('#')[0].split('?')[0];
    const resolvedRelative = this.resolvePreviewAssetPath(pathOnly || fromPath, fromPath);
    const candidates = this.getRouteCandidates(resolvedRelative);
    const resolved = candidates.find((candidate) => pagePaths.has(candidate)) ?? null;
    const expectedPath = candidates.find((candidate) => candidate.endsWith('.html')) ?? `${resolvedRelative.replace(/\/$/, '')}.html`;
    return { resolved, expectedPath };
  }

  private validateProjectRoutes(files: GeneratedFile[]): RouteValidationResult {
    const htmlFiles = files.filter((file) => file.path.endsWith('.html'));
    const pagePaths = new Set(htmlFiles.map((file) => this.normalizePreviewPath(file.path)));
    const unresolvedLinks: RouteValidationResult['unresolvedLinks'] = [];
    const warnings: string[] = [];

    if (htmlFiles.length === 0) {
      return {
        pages: [],
        unresolvedLinks: [],
        warnings: ['No HTML pages were generated. Forge added a recovery page where possible.']
      };
    }

    for (const file of htmlFiles) {
      const from = this.normalizePreviewPath(file.path);
      const content = file.content || '';
      const linkPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
      let match: RegExpExecArray | null;

      while ((match = linkPattern.exec(content)) !== null) {
        const href = (match[1] || '').trim();
        if (!href || href === '#' || href.startsWith('#') || this.isExternalPreviewHref(href)) continue;

        const { resolved, expectedPath } = this.resolvePreviewPagePath(href, from, pagePaths);
        if (!resolved) {
          unresolvedLinks.push({ from, href, expectedPath });
        }
      }
    }

    const uniqueUnresolved = Array.from(
      new Map(unresolvedLinks.map((link) => [`${link.from}:${link.href}`, link])).values()
    );

    if (!pagePaths.has('index.html')) {
      warnings.push('No root index.html was found. Forge will preview the first HTML file, but export may need an index.html entry page.');
    }

    warnings.push(...this.detectProjectQualityWarnings(files));

    return {
      pages: Array.from(pagePaths).sort(),
      unresolvedLinks: uniqueUnresolved,
      warnings
    };
  }

  private detectProjectQualityWarnings(files: GeneratedFile[]): string[] {
    const warnings: string[] = [];
    const htmlFiles = files.filter((file) => file.path.endsWith('.html'));
    const allContent = files.map((file) => file.content || '').join('\n');

    if (/\b(lorem ipsum|placeholder|coming soon|todo|replace this|sample text)\b/i.test(allContent)) {
      warnings.push('Placeholder or temporary copy detected. Replace it with launch-ready content.');
    }

    if (htmlFiles.length > 0 && !htmlFiles.some((file) => /<meta\s+name=["']viewport["']/i.test(file.content || ''))) {
      warnings.push('Missing responsive viewport metadata.');
    }

    if (htmlFiles.length > 0 && !htmlFiles.every((file) => /<title>[\s\S]{4,}<\/title>/i.test(file.content || ''))) {
      warnings.push('One or more HTML pages are missing strong title metadata.');
    }

    if (htmlFiles.length > 0 && !htmlFiles.some((file) => /<meta\s+name=["']description["']/i.test(file.content || ''))) {
      warnings.push('Missing SEO description metadata.');
    }

    const imagesWithoutAlt = htmlFiles.some((file) => /<img\b(?![^>]*\salt=)/i.test(file.content || ''));
    if (imagesWithoutAlt) {
      warnings.push('Images without alt text detected.');
    }

    const formsWithoutLabels = htmlFiles.some((file) => /<form\b/i.test(file.content || '') && !/<label\b|aria-label=|aria-labelledby=/i.test(file.content || ''));
    if (formsWithoutLabels) {
      warnings.push('Forms need accessible labels or aria labels.');
    }

    const emptySections = htmlFiles.some((file) => /<(section|main|article)\b[^>]*>\s*<\/\1>/i.test(file.content || ''));
    if (emptySections) {
      warnings.push('Empty layout sections detected.');
    }

    if (htmlFiles.length > 1 && !htmlFiles.every((file) => /<nav\b|role=["']navigation["']/i.test(file.content || ''))) {
      warnings.push('Multi-page projects should include consistent navigation on every page.');
    }

    return Array.from(new Set(warnings)).slice(0, 10);
  }

  private addMissingRoutePlaceholders(files: GeneratedFile[], validation: RouteValidationResult): GeneratedFile[] {
    return files;
  }

  private getRepairDiagnostics(userPrompt: string): string[] {
    if (!this.isRepairRequest(userPrompt) || this.state.files().length === 0) {
      return [];
    }
    const validation = this.validateProjectRoutes(this.state.files());
    const routeIssues = validation.unresolvedLinks.map((link) => `Broken link from ${link.from} to ${link.href}; expected ${link.expectedPath}.`);
    return [...routeIssues, ...validation.warnings].slice(0, 12);
  }

  private diffFilePaths(before: GeneratedFile[], after: GeneratedFile[]): string[] {
    const beforeMap = new Map(before.map((file) => [file.path, file.content]));
    return after
      .filter((file) => beforeMap.get(file.path) !== file.content)
      .map((file) => file.path);
  }

  private buildReport(summary: string, before: GeneratedFile[], after: GeneratedFile[], validation: RouteValidationResult, extraWarnings: string[] = []): BuildReport {
    const qualityScore = this.calculateQualityScore(after, validation, extraWarnings);
    return {
      summary,
      changedFiles: this.diffFilePaths(before, after),
      pages: validation.pages,
      unresolvedLinks: validation.unresolvedLinks,
      warnings: [...validation.warnings, ...extraWarnings],
      qualityScore,
      timestamp: Date.now()
    };
  }

  private calculateQualityScore(files: GeneratedFile[], validation: RouteValidationResult, warnings: string[]): number {
    const htmlFiles = files.filter((file) => file.path.endsWith('.html'));
    const cssWeight = files.some((file) => file.path.endsWith('.css')) ? 8 : 0;
    const scriptWeight = files.some((file) => file.path.endsWith('.js') || file.path.endsWith('.ts')) ? 5 : 0;
    const pageWeight = Math.min(htmlFiles.length * 12, 36);
    const contentWeight = Math.min(Math.floor(files.reduce((total, file) => total + (file.content || '').length, 0) / 1200), 24);
    const seoWeight = htmlFiles.some((file) => /<title>|meta name=["']description/i.test(file.content || '')) ? 10 : 0;
    const responsiveWeight = htmlFiles.some((file) => /viewport|sm:|md:|lg:|@media/i.test(file.content || '')) ? 10 : 0;
    const accessibilityWeight = htmlFiles.some((file) => /aria-|alt=|<label\b/i.test(file.content || '')) ? 7 : 0;
    const issuePenalty = Math.min(validation.unresolvedLinks.length * 12 + warnings.length * 5, 42);
    return Math.max(30, Math.min(100, 25 + pageWeight + contentWeight + cssWeight + scriptWeight + seoWeight + responsiveWeight + accessibilityWeight - issuePenalty));
  }

  private getResponseWarnings(response: Record<string, any>): string[] {
    const warnings = Array.isArray(response['warnings']) ? response['warnings'].filter((warning) => typeof warning === 'string') : [];
    const routes = Array.isArray(response['routes']) ? response['routes'] : [];
    const files = this.state.files();
    const pagePaths = new Set(files.filter((file) => file.path.endsWith('.html')).map((file) => this.normalizePreviewPath(file.path)));
    const missingDeclaredRoutes = routes
      .map((route) => typeof route === 'string' ? route : route?.path)
      .filter((path) => typeof path === 'string' && !this.getRouteCandidates(path).some((candidate) => pagePaths.has(candidate)));

    if (missingDeclaredRoutes.length > 0) {
      warnings.push(`AI declared route(s) without matching files: ${missingDeclaredRoutes.join(', ')}`);
    }

    return warnings;
  }

  private applyValidatedFiles(files: GeneratedFile[], response: Record<string, any>, successSummary: string): void {
    const before = this.state.files().map((file) => ({ ...file }));
    this.state.createSnapshot('Before AI update');

    this.setWorkflowPhase('validate', 'Running route, content, accessibility, and readiness checks', [
      `${files.length} file(s) received from Forge AI.`
    ], 88);
    const initialValidation = this.validateProjectRoutes(files);
    const filesToApply = this.addMissingRoutePlaceholders(files, initialValidation);
    const finalValidation = this.validateProjectRoutes(filesToApply);
    const placeholderWarnings = initialValidation.unresolvedLinks.length > 0
      ? [`Forge found ${initialValidation.unresolvedLinks.length} missing internal route(s). No placeholder files were added; ask Forge to generate real pages for those routes.`]
      : [];

    this.contextEngine.applyResponse({
      files: filesToApply,
      message: response['message'],
      projectSummary: response['projectSummary'],
      conversationSummary: response['conversationSummary'],
      pendingTasks: response['pendingTasks'],
      completedTasks: response['completedTasks']
    });
    const report = this.buildReport(successSummary, before, filesToApply, finalValidation, [...placeholderWarnings, ...this.getResponseWarnings(response)]);
    this.state.setBuildReport(report);
    if (report.unresolvedLinks.length > 0 || report.warnings.length > 0) {
      this.setWorkflowPhase('repair', 'Repair opportunities detected and captured for the next targeted pass', report.warnings.slice(0, 3), 72);
    } else {
      this.setWorkflowPhase('repair', 'No blocking repair issues detected', ['Routes and generated pages passed first-pass validation.'], 92);
    }
    this.setWorkflowPhase('optimize', 'Scoring production readiness and preserving project memory', [
      `Quality Intelligence score: ${report.qualityScore}/100`
    ], report.qualityScore);
    this.updatePreview();
    this.setWorkflowPhase('preview', 'Live preview updated with the latest generated project', [
      `${report.pages.length} page(s) available in the preview router.`
    ], 92);
    this.setWorkflowPhase('deploy', 'Deployment readiness report prepared', [
      `${report.changedFiles.length} changed file(s), ${report.warnings.length + report.unresolvedLinks.length} issue(s).`
    ], report.qualityScore);
    this.layoutMode.set('split');
    this.state.addMessage({ role: 'model', text: this.safeModelMessage(response['message'], successSummary) });
  }

  private applyValidatedOperations(response: Record<string, any>, successSummary: string): void {
    const before = this.state.files().map((file) => ({ ...file }));
    this.state.createSnapshot('Before AI update');

    this.setWorkflowPhase('validate', 'Applying operations and validating project integrity', [
      `${response['operations']?.length || 0} file operation(s) received.`
    ], 86);
    this.contextEngine.applyResponse(response);
    const afterOperations = this.state.files();
    const initialValidation = this.validateProjectRoutes(afterOperations);
    const filesToApply = this.addMissingRoutePlaceholders(afterOperations, initialValidation);
    const finalValidation = this.validateProjectRoutes(filesToApply);
    const placeholderWarnings = initialValidation.unresolvedLinks.length > 0
      ? [`Forge found ${initialValidation.unresolvedLinks.length} missing internal route(s). No placeholder files were added; ask Forge to generate real pages for those routes.`]
      : [];

    if (filesToApply.length !== afterOperations.length) {
      this.state.setFiles(filesToApply);
    }

    const report = this.buildReport(successSummary, before, filesToApply, finalValidation, [...placeholderWarnings, ...this.getResponseWarnings(response)]);
    this.state.setBuildReport(report);
    if (report.unresolvedLinks.length > 0 || report.warnings.length > 0) {
      this.setWorkflowPhase('repair', 'Repair opportunities detected and captured for the next targeted pass', report.warnings.slice(0, 3), 72);
    } else {
      this.setWorkflowPhase('repair', 'No blocking repair issues detected', ['Operations preserved route integrity.'], 92);
    }
    this.setWorkflowPhase('optimize', 'Scoring production readiness and preserving project memory', [
      `Quality Intelligence score: ${report.qualityScore}/100`
    ], report.qualityScore);
    this.updatePreview();
    this.setWorkflowPhase('preview', 'Live preview updated with the latest operations', [
      `${report.pages.length} page(s) available in the preview router.`
    ], 92);
    this.setWorkflowPhase('deploy', 'Deployment readiness report prepared', [
      `${report.changedFiles.length} changed file(s), ${report.warnings.length + report.unresolvedLinks.length} issue(s).`
    ], report.qualityScore);
    this.layoutMode.set('split');
    this.state.addMessage({ role: 'model', text: this.safeModelMessage(response['message'], successSummary) });
  }

  rollbackLatestSnapshot() {
    const latestSnapshot = this.state.currentChat()?.snapshots?.[0];
    if (!latestSnapshot) {
      this.error.set('No rollback snapshot is available yet.');
      return;
    }
    if (this.state.rollbackSnapshot(latestSnapshot.id)) {
      this.updatePreview();
      this.layoutMode.set('split');
      this.state.addMessage({ role: 'model', text: `↩ Rolled back to ${latestSnapshot.label}.` });
    }
  }

  private runForgeDoctor(userPrompt: string, userMessageText: string): boolean {
    const existingFiles = this.state.files();
    if (!this.isRepairRequest(userPrompt) || existingFiles.length === 0) {
      return false;
    }

    this.state.addMessage({ role: 'user', text: userMessageText });
    this.prompt.set('');
    this.loading.set(true);
    this.builderStatus.set('running local diagnostics, validating routes, repairing preview');
    this.error.set('');

    try {
      const before = existingFiles.map((file) => ({ ...file }));
      this.state.createSnapshot('Before Forge Doctor');
      const initialValidation = this.validateProjectRoutes(existingFiles);
      const repairedFiles = this.addMissingRoutePlaceholders(existingFiles, initialValidation);
      const finalValidation = this.validateProjectRoutes(repairedFiles);
      const warnings = initialValidation.unresolvedLinks.length > 0
        ? [`Forge Doctor found ${initialValidation.unresolvedLinks.length} missing route(s). No placeholder files were added; ask Forge to generate real pages for those routes.`]
        : ['Forge Doctor checked routes, preview assets, and page structure.'];

      if (repairedFiles.length !== existingFiles.length) {
        this.state.setFiles(repairedFiles);
      }

      const report = this.buildReport('Forge Doctor completed a project health check.', before, repairedFiles, finalValidation, warnings);
      this.state.setBuildReport(report);
      this.updatePreview();
      this.layoutMode.set('split');
      this.state.addMessage({
        role: 'model',
        text: `Forge Doctor completed. Quality ${report.qualityScore}/100. ${report.warnings.join(' ')}`
      });
    } finally {
      this.loading.set(false);
      this.resetReadyStatus();
    }

    return true;
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
    const userMessageText = userPrompt + (this.uploadedFiles().length > 0 ? `\n\n📎 ${this.uploadedFiles().length} file(s) attached` : '');

    // --- Casual / conversational message guard ---
    // If the message is just a greeting, question, or small talk, handle it locally.
    const casualPattern = /^(hi+|hello+|hey+|yo+|sup|howdy|hiya|greetings|good\s*(morning|afternoon|evening|day)|what'?s up|wassup|how are you|how r u|how're you|thanks?|thank\s*you|ty+|cool+|nice+|ok+|okay+|sure+|great+|got it|got it thanks|lol|haha|what can you do|what do you do|who are you|what are you|tell me about (yourself|you)|are you (ai|an ai|a bot)|help me|can you help|what is forge|what's forge|what is this|hello forge|hi forge)\s*[?.!]*$/i;
    if (casualPattern.test(userPrompt) && this.uploadedFiles().length === 0) {
      const casualReplies: Record<string, string> = {
        greet: "Hey! I'm Forge AI — your autonomous web builder. Describe a website, app, or feature and I'll build it for you instantly. What are we creating today?",
        thanks: "You're welcome! Ready to build something great? Just describe what you need.",
        what: "I'm Forge AI, an autonomous product builder. Tell me what kind of website or web app you want — I'll architect, generate, and preview it in real time.",
        help: "Of course! Just describe the site or feature you want to build and I'll get to work. For example: \"Build me a SaaS landing page for a cybersecurity startup.\"",
      };
      const lower = userPrompt.toLowerCase();
      let reply = casualReplies['greet'];
      if (/thank/.test(lower)) reply = casualReplies['thanks'];
      else if (/what|who|tell|forge|ai|bot/.test(lower)) reply = casualReplies['what'];
      else if (/help/.test(lower)) reply = casualReplies['help'];

      this.state.addMessage({ role: 'user', text: userPrompt });
      this.state.addMessage({ role: 'model', text: reply });
      this.prompt.set('');
      return;
    }
    // --- End casual guard ---

    const repairDiagnostics = this.getRepairDiagnostics(userPrompt);

    if (repairDiagnostics.length === 0 && this.runForgeDoctor(userPrompt, userMessageText)) {
      return;
    }
    
    if (!this.supabase.isDeveloperAccount() && this.state.credits() < 2) {
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

    const workspaceFilesContext = this.state.files()
      .slice(0, 8)
      .map((file) => `FILE: ${file.path}\n${(file.content || '').slice(0, 2400)}`)
      .join('\n\n');

    const fullPrompt = [
      `USER REQUEST:\n${userPrompt}${fileContext}`,
      workspaceFilesContext ? `CURRENT WORKSPACE FILES:\n${workspaceFilesContext}` : '',
      repairDiagnostics.length ? forgeAiUtils.buildForgeRepairPrompt({ prompt: userPrompt, diagnostics: repairDiagnostics, files: this.state.files() }) : '',
      `IMPORTANT: If this request is to improve, redesign, expand, or make the current project more advanced, update the existing project in place and make it visibly more polished, premium, and production-ready. Do not return a generic starter page unless the user explicitly asks for a brand new project.
Quality bar: output should feel comparable to premium AI builders. Use a cohesive design system, strong spacing, polished typography, responsive mobile/tablet/desktop states, real copy, accessible markup, SEO basics, meaningful sections, and complete navigation. For advanced requests, make obvious visible improvements across layout, content depth, interactions, and polish.
Return only valid JSON. If you build or update a project, include files or operations, routes, warnings, projectSummary, conversationSummary, pendingTasks, and completedTasks. For multi-page sites, every internal navigation link must resolve to an included HTML file. Use static route files like index.html, about.html, services.html, pricing.html, contact.html.`
    ].filter(Boolean).join('\n\n');

    const priorMessages = this.state.messages();
    const attachedFiles = Array.from(this.uploadedFiles()).map((file) => ({ name: file.name, type: file.type }));
    this.contextEngine.compressConversationIfNeeded(this.state.currentChat());
    const context = this.contextEngine.buildRequestContext(userPrompt, attachedFiles);

    this.state.addMessage({ role: 'user', text: userMessageText });
    this.state.startWorkflowRun(userPrompt || 'Attached-file build request');
    const currentTitle = this.state.currentChat()?.title?.trim() || 'New Chat';
    const isDefault = currentTitle === 'New Chat' || !currentTitle;
    if (isDefault && priorMessages.length === 0) {
      this.state.updateChatMetadata(this.state.activeChatId(), { title: this.generateChatTitle(userPrompt) });
    }
    this.prompt.set('');
    this.loading.set(true);
    this.setWorkflowPhase('architect', 'Architecting request against current project memory', [
      `${this.state.files().length} workspace files available`,
      `${priorMessages.length} prior messages in context`
    ], 78);
    this.error.set('');

    try {
      this.setWorkflowPhase('research', 'Checking whether live research or competitor context is needed', [
        /research|internet|web|latest|current|trends?|competitors?|inspiration|benchmark/i.test(userPrompt)
          ? 'Research intent detected; backend will enrich the prompt.'
          : 'No explicit research intent; continuing with project memory.'
      ], 80);
      this.setWorkflowPhase('design', 'Preparing design and architecture instructions', [
        'Forge will preserve existing files and apply targeted changes.'
      ], 84);
      if (repairDiagnostics.length > 0) {
        this.setWorkflowPhase('repair', 'Forge Doctor found actionable issues and prepared a targeted repair brief', repairDiagnostics.slice(0, 4), 76);
      }
      this.setWorkflowPhase('generate', 'Calling Forge AI with project context', [
        'Sending prompt, prior messages, file tree, selected file, and workspace files.'
      ], 82);
      const response = await fetch('/api/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: this.supabase.currentUser()?.email || '',
          prompt: fullPrompt,
          history: priorMessages,
          workspaceFiles: this.state.files().map((file) => ({ path: file.path, content: file.content || '' })),
          attachedFiles,
          context: {
            systemPrompt: context.systemPrompt,
            projectSummary: context.projectSummary,
            projectBrief: context.projectBrief,
            conversationSummary: context.conversationSummary,
            recentMessages: context.recentMessages,
            currentFileTree: context.currentFileTree,
            selectedFile: context.selectedFile ? { path: context.selectedFile.path, content: context.selectedFile.content } : null,
            pendingTasks: context.pendingTasks,
            recentEdits: context.recentEdits,
            repairHistory: context.repairHistory,
            workflowSummary: context.workflowSummary,
            openTabs: context.openTabs
          }
        })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || 'AI Service failed');
      }
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
        this.setWorkflowPhase('validate', 'Parsing generated files and validating project', [
          'Checking JSON contract, project files, routes, and preview readiness.'
        ], 86);
        let cleanedText = textOutput.trim();
        // Remove markdown wrappers if the model returned them
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const parseAndApply = (raw: string) => {
          const parsed = JSON.parse(raw);
          const shouldTreatAsProject = this.isProjectBuildRequest(userPrompt)
            || forgeAiUtils.shouldForceProjectBuildFallback(userPrompt, raw)
            || this.looksLikeProjectPayload(raw);

          if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((file) => file?.path && typeof file?.content === 'string')) {
            const hasPreviewHtml = parsed.some((file) => file.path.endsWith('.html') && (file.content || '').includes('<html'));
            if (shouldTreatAsProject && !hasPreviewHtml) {
              this.applyProjectFromMalformedResponse(userPrompt, raw, '✅ I’ve recovered the project response and opened it in preview.');
            } else {
              this.applyValidatedFiles(parsed, {}, '✅ Project compiled. Live preview is ready.');
            }
          } else if (parsed.operations && Array.isArray(parsed.operations) && parsed.operations.length > 0) {
            this.applyValidatedOperations(parsed, '✅ Project updated in place.');
          } else if (parsed.files && Array.isArray(parsed.files) && parsed.files.length > 0) {
            const shouldFallback = this.shouldUsePremiumFallback(parsed.files, userPrompt, this.state.files());
            const filesToApply = shouldFallback ? this.buildPremiumPortfolioFallback(this.state.files()) : parsed.files;

            const hasUsableHtml = filesToApply.some((file: GeneratedFile) => file.path.endsWith('.html') && (file.content || '').includes('<html'));
            if (!hasUsableHtml) {
              throw new Error('Generated files were incomplete.');
            }

            this.applyValidatedFiles(filesToApply, parsed, '✅ Project compiled. Live preview is ready.');
          } else if (parsed.html || parsed.code || parsed.content) {
            this.applyProjectFromMalformedResponse(
              userPrompt,
              `${parsed.html || parsed.code || parsed.content}`,
              '✅ I’ve recovered the generated project and opened it in preview.'
            );
          } else if (parsed.message) {
            const messageText = typeof parsed.message === 'string' ? parsed.message : '';
            const shouldRecoverProject = forgeAiUtils.shouldForceProjectBuildFallback(userPrompt, messageText)
              || this.looksLikeProjectPayload(messageText)
              || shouldTreatAsProject;

            if (shouldRecoverProject) {
              this.applyProjectFromMalformedResponse(
                userPrompt,
                messageText,
                '✅ I’ve applied your upgrade to the project. Check the live preview.'
              );
            } else {
              this.state.addMessage({ role: 'model', text: messageText || 'I can help with that.' });
            }
          } else {
            if (shouldTreatAsProject) {
              this.applyProjectFromMalformedResponse(
                userPrompt,
                raw,
                '✅ I’ve recovered the project response and opened it in preview.'
              );
            } else {
              this.state.addMessage({ role: 'model', text: 'I’m set up to build projects, not just chat about them.' });
            }
          }
        };

        try {
          parseAndApply(cleanedText);
        } catch (e) {
          const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parseAndApply(jsonMatch[0]);
            } catch {
              if (this.isProjectBuildRequest(userPrompt) || forgeAiUtils.shouldForceProjectBuildFallback(userPrompt, textOutput) || this.looksLikeProjectPayload(textOutput)) {
                this.applyProjectFromMalformedResponse(
                  userPrompt,
                  textOutput,
                  '✅ I’ve applied your upgrade to the project. Check the live preview.'
                );
              } else {
                this.state.addMessage({ role: 'model', text: 'I had trouble applying that update. Try rephrasing your request.' });
              }
            }
          } else if (this.isProjectBuildRequest(userPrompt) || forgeAiUtils.shouldForceProjectBuildFallback(userPrompt, textOutput) || this.looksLikeProjectPayload(textOutput)) {
            this.applyProjectFromMalformedResponse(
              userPrompt,
              textOutput,
              '✅ I’ve applied your upgrade to the project. Check the live preview.'
            );
          } else {
            this.state.addMessage({ role: 'model', text: this.safeChatFallback(textOutput) });
          }
        }
      } else {
        console.error('Unexpected AI Structure:', data);
        this.state.addMessage({ role: 'model', text: "Compilation stalled. No output received from the engine core." });
      }

      this.loading.set(false);
      this.resetReadyStatus();
      this.state.completeWorkflowRun('Forge completed the creation workflow.');
      
      // Deduct credits locally and sync to Supabase
      if (!this.supabase.isDeveloperAccount()) {
        this.state.deductCredits(2);
        this.supabase.deductForgeCredits(2);
      }

    } catch (err: any) {
      console.error('Forge AI error:', err);
      this.loading.set(false);
      this.resetReadyStatus();
      this.state.completeWorkflowRun(err.message || 'Forge workflow failed.', 'failed');
      this.error.set(err.message || 'An error occurred during generation.');
    } finally {
      this.loading.set(false);
      this.resetReadyStatus();
    }
  }

  private generateChatTitle(prompt: string): string {
    const sanitized = prompt.trim().replace(/\s+/g, ' ');
    if (!sanitized) return 'New Chat';
    return sanitized.length > 32 ? `${sanitized.slice(0, 29)}...` : sanitized;
  }
}
