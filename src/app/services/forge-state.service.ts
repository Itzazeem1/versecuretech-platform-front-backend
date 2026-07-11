import { Injectable, signal, effect } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface BuildReport {
  summary: string;
  changedFiles: string[];
  pages: string[];
  unresolvedLinks: Array<{ from: string; href: string; expectedPath: string }>;
  warnings: string[];
  qualityScore: number;
  timestamp: number;
}

export interface ProjectSnapshot {
  id: string;
  label: string;
  files: GeneratedFile[];
  selectedFilePath: string | null;
  report?: BuildReport;
  createdAt: number;
}

export type ForgeWorkflowPhase = 'architect' | 'research' | 'design' | 'generate' | 'validate' | 'repair' | 'optimize' | 'preview' | 'deploy';
export type ForgeWorkflowStatus = 'pending' | 'running' | 'completed' | 'warning' | 'failed';

export interface ForgeWorkflowStep {
  phase: ForgeWorkflowPhase;
  label: string;
  status: ForgeWorkflowStatus;
  confidence: number;
  startedAt?: number;
  finishedAt?: number;
  diagnostics: string[];
}

export interface ForgeWorkflowRun {
  id: string;
  prompt: string;
  status: ForgeWorkflowStatus;
  currentPhase: ForgeWorkflowPhase;
  startedAt: number;
  finishedAt?: number;
  summary: string;
  steps: ForgeWorkflowStep[];
}

export interface ForgeProjectState {
  framework: string;
  architecture: string;
  uiTheme: string;
  routes: string[];
  apiEndpoints: string[];
  dependencies: string[];
  databaseSchema: string[];
  aiSummary: string;
  systemPrompt: string;
  workspaceState: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  files: GeneratedFile[];
  updatedAt: number;
  project: ForgeProjectState;
  projectSummary: string;
  conversationSummary: string;
  pendingTasks: string[];
  completedTasks: string[];
  recentEdits: string[];
  openTabs: string[];
  selectedFilePath: string | null;
  pinned: boolean;
  createdAt: number;
  snapshots: ProjectSnapshot[];
  lastBuildReport: BuildReport | null;
  workflowRuns: ForgeWorkflowRun[];
  activeWorkflowRun: ForgeWorkflowRun | null;
}

@Injectable({
  providedIn: 'root'
})
export class ForgeStateService {
  readonly sessionId = signal<string>('');
  readonly credits = signal<number>(100);
  readonly chats = signal<ChatSession[]>([]);
  readonly activeChatId = signal<string>('');
  readonly messages = signal<ChatMessage[]>([]);
  readonly files = signal<GeneratedFile[]>([]);
  readonly selectedFile = signal<GeneratedFile | null>(null);
  readonly viewMode = signal<'code' | 'preview'>('code');
  readonly safeHtmlPreview = signal<SafeResourceUrl | null>(null);
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      this.schedulePersist();
    });
  }

  private schedulePersist() {
    if (typeof window === 'undefined' || !localStorage) return;
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
    }
    this.persistTimer = setTimeout(() => {
      const stateToSave = {
        chats: this.chats().map((chat) => ({
          ...chat,
          snapshots: (chat.snapshots ?? []).slice(0, 4)
        })),
        activeChatId: this.activeChatId()
      };
      localStorage.setItem('forge_saved_state', JSON.stringify(stateToSave));
    }, 250);
  }

  initSession() {
    if (typeof window === 'undefined' || !localStorage) return;
    
    let sid = localStorage.getItem('forge_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('forge_session_id', sid);
    }
    this.sessionId.set(sid);

    const savedState = localStorage.getItem('forge_saved_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.chats && Array.isArray(parsed.chats) && parsed.chats.length > 0) {
          this.chats.set(parsed.chats.map((chat: ChatSession) => this.normalizeSession(chat)));
          const activeId = parsed.activeChatId || parsed.chats[0]?.id;
          this.activeChatId.set(activeId);
          this.hydrateActiveChat();
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved forge state', e);
      }
    }

    this.createChat('New Chat');
  }

  private createEmptySession(title: string): ChatSession {
    return this.normalizeSession({
      id: 'chat_' + Math.random().toString(36).substring(2, 15),
      title,
      messages: [],
      files: [],
      updatedAt: Date.now(),
      project: {
        framework: 'web',
        architecture: 'single-page-app',
        uiTheme: 'dark modern',
        routes: [],
        apiEndpoints: [],
        dependencies: [],
        databaseSchema: [],
        aiSummary: 'A new project workspace has been created.',
        systemPrompt: 'Maintain project awareness and edit existing files intelligently.',
        workspaceState: 'initial'
      },
      projectSummary: 'A new project workspace has been created.',
      conversationSummary: 'Conversation started.',
      pendingTasks: [],
      completedTasks: [],
      recentEdits: [],
      openTabs: [],
      selectedFilePath: null,
      pinned: false,
      createdAt: Date.now(),
      snapshots: [],
      lastBuildReport: null,
      workflowRuns: [],
      activeWorkflowRun: null
    });
  }

  private normalizeSession(chat: ChatSession): ChatSession {
    const project = chat.project ?? {} as ForgeProjectState;
    return {
      ...chat,
      project: {
        framework: project.framework || 'web',
        architecture: project.architecture || 'single-page-app',
        uiTheme: project.uiTheme || 'dark modern',
        routes: project.routes || [],
        apiEndpoints: project.apiEndpoints || [],
        dependencies: project.dependencies || [],
        databaseSchema: project.databaseSchema || [],
        aiSummary: project.aiSummary || 'A new project workspace has been created.',
        systemPrompt: project.systemPrompt || 'Maintain project awareness and edit existing files intelligently.',
        workspaceState: project.workspaceState || 'initial'
      },
      messages: chat.messages ?? [],
      files: chat.files ?? [],
      pendingTasks: chat.pendingTasks ?? [],
      completedTasks: chat.completedTasks ?? [],
      recentEdits: chat.recentEdits ?? [],
      openTabs: chat.openTabs ?? [],
      snapshots: chat.snapshots ?? [],
      lastBuildReport: chat.lastBuildReport ?? null,
      workflowRuns: (chat.workflowRuns ?? []).slice(0, 8),
      activeWorkflowRun: chat.activeWorkflowRun ?? null,
      selectedFilePath: chat.selectedFilePath ?? chat.files?.[0]?.path ?? null,
      pinned: chat.pinned ?? false,
      createdAt: chat.createdAt ?? Date.now(),
      updatedAt: chat.updatedAt ?? Date.now()
    };
  }

  private hydrateActiveChat() {
    const activeChat = this.chats().find(chat => chat.id === this.activeChatId());
    if (!activeChat) {
      const firstChat = this.chats()[0];
      if (firstChat) {
        this.activeChatId.set(firstChat.id);
        this.hydrateActiveChat();
      }
      return;
    }

    this.messages.set(activeChat.messages);
    this.files.set(activeChat.files);
    const selectedPath = activeChat.selectedFilePath;
    const selected = activeChat.files.find((file) => file.path === selectedPath) ?? activeChat.files[0] ?? null;
    this.selectedFile.set(selected);
  }

  private persistActiveChat(changes: (chat: ChatSession) => ChatSession | void) {
    const chats = [...this.chats()];
    const index = chats.findIndex(chat => chat.id === this.activeChatId());
    if (index === -1) return;

    const activeChat = this.normalizeSession({ ...chats[index] });
    const result = changes(activeChat);
    const updatedChat = result ? result : activeChat;
    updatedChat.updatedAt = Date.now();
    if (!updatedChat.selectedFilePath && updatedChat.files[0]) {
      updatedChat.selectedFilePath = updatedChat.files[0].path;
    }
    chats[index] = updatedChat;
    this.chats.set(chats);
    this.messages.set(updatedChat.messages);
    this.files.set(updatedChat.files);
    const selectedPath = updatedChat.selectedFilePath;
    const selected = updatedChat.files.find((file) => file.path === selectedPath) ?? updatedChat.files.find((file) => file.path === this.selectedFile()?.path) ?? updatedChat.files[0] ?? null;
    this.selectedFile.set(selected);
  }

  currentChat(): ChatSession | undefined {
    return this.chats().find(chat => chat.id === this.activeChatId());
  }

  setCredits(amount: number) {
    this.credits.set(amount);
  }

  deductCredits(amount: number) {
    this.credits.update(c => c - amount);
  }

  addMessage(msg: ChatMessage) {
    this.persistActiveChat(chat => {
      chat.messages = [...chat.messages, msg];
      return chat;
    });
  }

  createChat(title = 'New Chat') {
    const newChat = this.createEmptySession(title);
    this.chats.update(chats => [newChat, ...chats]);
    this.activeChatId.set(newChat.id);
    this.messages.set(newChat.messages);
    this.files.set(newChat.files);
    this.selectedFile.set(null);
  }

  updateChatMetadata(chatId: string, updates: Partial<ChatSession>) {
    const chats = [...this.chats()];
    const index = chats.findIndex((chat) => chat.id === chatId);
    if (index === -1) return;
    chats[index] = { ...chats[index], ...updates, updatedAt: Date.now() };
    this.chats.set(chats);
    if (this.activeChatId() === chatId) {
      this.hydrateActiveChat();
    }
  }

  updateProjectMemory(updates: Partial<ForgeProjectState>) {
    this.persistActiveChat(chat => {
      chat.project = {
        ...chat.project,
        ...updates
      };
      if (updates.aiSummary) {
        chat.projectSummary = updates.aiSummary;
      }
      return chat;
    });
  }

  createSnapshot(label: string) {
    this.persistActiveChat(chat => {
      if (chat.files.length === 0) return chat;
      const snapshot: ProjectSnapshot = {
        id: 'snapshot_' + Math.random().toString(36).substring(2, 15),
        label,
        files: chat.files.map((file) => ({ ...file })),
        selectedFilePath: chat.selectedFilePath,
        report: chat.lastBuildReport ?? undefined,
        createdAt: Date.now()
      };
      chat.snapshots = [snapshot, ...(chat.snapshots ?? [])].slice(0, 4);
      return chat;
    });
  }

  rollbackSnapshot(snapshotId: string): boolean {
    const chat = this.currentChat();
    const snapshot = chat?.snapshots?.find((entry) => entry.id === snapshotId);
    if (!snapshot) return false;

    this.persistActiveChat(activeChat => {
      activeChat.files = snapshot.files.map((file) => ({ ...file }));
      activeChat.selectedFilePath = snapshot.selectedFilePath ?? snapshot.files[0]?.path ?? null;
      activeChat.lastBuildReport = {
        summary: `Rolled back to ${snapshot.label}`,
        changedFiles: snapshot.files.map((file) => file.path),
        pages: snapshot.files.filter((file) => file.path.endsWith('.html')).map((file) => file.path),
        unresolvedLinks: [],
        warnings: [],
        qualityScore: 100,
        timestamp: Date.now()
      };
      activeChat.recentEdits = [`Rolled back to ${snapshot.label}`, ...(activeChat.recentEdits ?? [])].slice(0, 12);
      return activeChat;
    });
    return true;
  }

  setBuildReport(report: BuildReport) {
    this.persistActiveChat(chat => {
      chat.lastBuildReport = report;
      chat.recentEdits = [
        report.summary,
        ...report.changedFiles.slice(0, 5).map((file) => `Updated ${file}`),
        ...(chat.recentEdits ?? [])
      ].slice(0, 12);
      chat.project.routes = report.pages;
      return chat;
    });
  }

  startWorkflowRun(prompt: string): ForgeWorkflowRun {
    const now = Date.now();
    const run: ForgeWorkflowRun = {
      id: 'workflow_' + Math.random().toString(36).substring(2, 15),
      prompt,
      status: 'running',
      currentPhase: 'architect',
      startedAt: now,
      summary: 'Forge is architecting the request.',
      steps: this.createWorkflowSteps()
    };

    run.steps[0] = {
      ...run.steps[0],
      status: 'running',
      confidence: 72,
      startedAt: now,
      diagnostics: ['Request received and project memory is being prepared.']
    };

    this.persistActiveChat(chat => {
      chat.activeWorkflowRun = run;
      chat.workflowRuns = [run, ...(chat.workflowRuns ?? [])].slice(0, 8);
      return chat;
    });

    return run;
  }

  updateWorkflowPhase(phase: ForgeWorkflowPhase, updates: Partial<ForgeWorkflowStep> & { summary?: string } = {}) {
    this.persistActiveChat(chat => {
      if (!chat.activeWorkflowRun) return chat;
      const now = Date.now();
      const steps = chat.activeWorkflowRun.steps.map((step) => {
        if (step.phase === phase) {
          return {
            ...step,
            ...updates,
            status: updates.status ?? 'running',
            confidence: updates.confidence ?? step.confidence,
            startedAt: step.startedAt ?? now,
            diagnostics: updates.diagnostics ?? step.diagnostics
          };
        }
        if (step.status === 'running' && step.phase !== phase) {
          return {
            ...step,
            status: 'completed' as ForgeWorkflowStatus,
            confidence: Math.max(step.confidence, 86),
            finishedAt: step.finishedAt ?? now
          };
        }
        return step;
      });
      const nextRun = {
        ...chat.activeWorkflowRun,
        currentPhase: phase,
        summary: updates.summary ?? chat.activeWorkflowRun.summary,
        steps
      };
      chat.activeWorkflowRun = nextRun;
      chat.workflowRuns = [nextRun, ...(chat.workflowRuns ?? []).filter((run) => run.id !== nextRun.id)].slice(0, 8);
      return chat;
    });
  }

  completeWorkflowRun(summary: string, status: ForgeWorkflowStatus = 'completed') {
    this.persistActiveChat(chat => {
      if (!chat.activeWorkflowRun) return chat;
      const now = Date.now();
      const nextRun: ForgeWorkflowRun = {
        ...chat.activeWorkflowRun,
        status,
        summary,
        finishedAt: now,
        steps: chat.activeWorkflowRun.steps.map((step) => ({
          ...step,
          status: step.status === 'failed' || step.status === 'warning' ? step.status : status === 'failed' ? 'warning' : 'completed',
          confidence: step.confidence || 88,
          finishedAt: step.finishedAt ?? now
        }))
      };
      chat.activeWorkflowRun = null;
      chat.workflowRuns = [nextRun, ...(chat.workflowRuns ?? []).filter((run) => run.id !== nextRun.id)].slice(0, 8);
      return chat;
    });
  }

  private createWorkflowSteps(): ForgeWorkflowStep[] {
    return [
      { phase: 'architect', label: 'Architect', status: 'pending', confidence: 0, diagnostics: [] },
      { phase: 'research', label: 'Research', status: 'pending', confidence: 0, diagnostics: [] },
      { phase: 'design', label: 'Design', status: 'pending', confidence: 0, diagnostics: [] },
      { phase: 'generate', label: 'Generate', status: 'pending', confidence: 0, diagnostics: [] },
      { phase: 'validate', label: 'Validate', status: 'pending', confidence: 0, diagnostics: [] },
      { phase: 'repair', label: 'Repair', status: 'pending', confidence: 0, diagnostics: [] },
      { phase: 'optimize', label: 'Optimize', status: 'pending', confidence: 0, diagnostics: [] },
      { phase: 'preview', label: 'Preview', status: 'pending', confidence: 0, diagnostics: [] },
      { phase: 'deploy', label: 'Deploy Readiness', status: 'pending', confidence: 0, diagnostics: [] }
    ];
  }

  switchChat(chatId: string) {
    if (this.activeChatId() === chatId) return;
    this.activeChatId.set(chatId);
    this.hydrateActiveChat();
  }

  duplicateChat(chatId: string) {
    const sourceChat = this.chats().find((chat) => chat.id === chatId);
    if (!sourceChat) return null;

    const duplicatedChat: ChatSession = {
      ...sourceChat,
      id: 'chat_' + Math.random().toString(36).substring(2, 15),
      title: `${sourceChat.title} Copy`,
      messages: [...sourceChat.messages],
      files: [...sourceChat.files],
      selectedFilePath: sourceChat.selectedFilePath,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false
    };

    this.chats.update((chats) => [duplicatedChat, ...chats]);
    this.activeChatId.set(duplicatedChat.id);
    this.messages.set(duplicatedChat.messages);
    this.files.set(duplicatedChat.files);
    this.selectedFile.set(duplicatedChat.files.find((file) => file.path === duplicatedChat.selectedFilePath) ?? duplicatedChat.files[0] ?? null);
    return duplicatedChat;
  }

  renameChat(chatId: string, title: string) {
    const chats = [...this.chats()];
    const index = chats.findIndex(chat => chat.id === chatId);
    if (index === -1) return;
    chats[index] = { ...chats[index], title, updatedAt: Date.now() };
    this.chats.set(chats);
  }

  deleteChat(chatId: string) {
    const remaining = this.chats().filter(chat => chat.id !== chatId);
    if (remaining.length === 0) {
      this.createChat('New Chat');
      return;
    }

    this.chats.set(remaining);
    if (this.activeChatId() === chatId) {
      const nextChat = remaining[0];
      this.activeChatId.set(nextChat.id);
      this.hydrateActiveChat();
    }
  }

  setFiles(files: GeneratedFile[]) {
    this.persistActiveChat(chat => {
      chat.files = files;
      chat.selectedFilePath = files[0]?.path ?? null;
      return chat;
    });
    if (files.length > 0) {
      this.selectedFile.set(files[0]);
    }
  }

  addFile(file: GeneratedFile) {
    this.persistActiveChat(chat => {
      chat.files = [...chat.files, file];
      return chat;
    });
    this.selectedFile.set(file);
    this.viewMode.set('code');
  }

  removeFile(path: string) {
    this.persistActiveChat(chat => {
      chat.files = chat.files.filter(f => f.path !== path);
      return chat;
    });
    if (this.selectedFile()?.path === path) {
      this.selectedFile.set(this.files()[0] ?? null);
    }
  }

  updateFileContent(path: string, content: string) {
    this.persistActiveChat(chat => {
      chat.files = chat.files.map(f => f.path === path ? { ...f, content } : f);
      return chat;
    });
    const currentSelected = this.selectedFile();
    if (currentSelected && currentSelected.path === path) {
      this.selectedFile.set({ ...currentSelected, content });
    }
  }

  selectFile(file: GeneratedFile) {
    this.selectedFile.set(file);
    this.persistActiveChat((chat) => {
      chat.selectedFilePath = file.path;
      return chat;
    });
  }

  setViewMode(mode: 'code' | 'preview') {
    this.viewMode.set(mode);
  }

  applyFileOperations(operations: Array<{ type: 'create' | 'update' | 'delete'; path: string; content?: string }>) {
    const nextFiles = [...this.files()];
    const byPath = new Map(nextFiles.map((file) => [file.path, file]));

    operations.forEach((operation) => {
      if (operation.type === 'delete') {
        byPath.delete(operation.path);
        return;
      }
      if (operation.type === 'create' || operation.type === 'update') {
        byPath.set(operation.path, { path: operation.path, content: operation.content ?? '' });
      }
    });

    const files = Array.from(byPath.values());
    this.setFiles(files);
  }

  setPreview(url: SafeResourceUrl | null) {
    this.safeHtmlPreview.set(url);
  }
}
