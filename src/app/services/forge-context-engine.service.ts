import { Injectable } from '@angular/core';
import { ChatMessage, ChatSession, ForgeStateService, GeneratedFile } from './forge-state.service';

export interface ForgeRequestContext {
  systemPrompt: string;
  projectSummary: string;
  projectBrief: string;
  conversationSummary: string;
  recentMessages: ChatMessage[];
  workspaceFiles: GeneratedFile[];
  currentFileTree: string[];
  selectedFile: GeneratedFile | null;
  pendingTasks: string[];
  recentEdits: string[];
  repairHistory: string[];
  workflowSummary: string;
  openTabs: string[];
  currentUserPrompt: string;
}

export interface FileOperation {
  type: 'create' | 'update' | 'delete';
  path: string;
  content?: string;
}

export interface ForgeAiResponse {
  message?: string;
  files?: GeneratedFile[];
  operations?: FileOperation[];
  routes?: Array<{ path: string; title?: string } | string>;
  warnings?: string[];
  projectSummary?: string;
  conversationSummary?: string;
  pendingTasks?: string[];
  completedTasks?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ForgeContextEngineService {
  constructor(private readonly state: ForgeStateService) {}

  buildRequestContext(prompt: string, attachedFiles: Array<{ name: string; type: string }> = []): ForgeRequestContext {
    const activeChat = this.state.currentChat();
    const workspaceFiles = (activeChat?.files ?? this.state.files()) || [];
    const selectedFile = this.resolveSelectedFile(activeChat, workspaceFiles);

    const recentMessages = (activeChat?.messages ?? []).slice(-10);
    const currentFileTree = this.extractFileTree(workspaceFiles);

    return {
      systemPrompt: activeChat?.project.systemPrompt || this.defaultSystemPrompt(),
      projectSummary: activeChat?.project.aiSummary || activeChat?.projectSummary || this.describeProject(activeChat),
      projectBrief: this.buildProjectBrief(activeChat, workspaceFiles),
      conversationSummary: activeChat?.conversationSummary || this.summarizeConversation(recentMessages),
      recentMessages,
      workspaceFiles,
      currentFileTree,
      selectedFile,
      pendingTasks: activeChat?.pendingTasks ?? [],
      recentEdits: activeChat?.recentEdits ?? [],
      repairHistory: (activeChat?.recentEdits ?? []).filter((edit) => /repair|doctor|rollback|missing|broken|warning|issue/i.test(edit)).slice(0, 8),
      workflowSummary: this.summarizeWorkflow(activeChat),
      openTabs: activeChat?.openTabs ?? [],
      currentUserPrompt: prompt
    };
  }

  compressConversationIfNeeded(chat: ChatSession | undefined): string {
    if (!chat) return '';
    const recentMessages = chat.messages.slice(-10);
    if (chat.messages.length <= 14) {
      return chat.conversationSummary || this.summarizeConversation(recentMessages);
    }

    const summary = this.summarizeConversation(chat.messages);
    this.state.updateChatMetadata(chat.id, {
      conversationSummary: summary,
      recentEdits: [...(chat.recentEdits ?? []).slice(-6), `Compressed ${chat.messages.length} messages into project memory`]
    });
    return summary;
  }

  applyResponse(response: ForgeAiResponse): void {
    if (response.operations?.length) {
      this.state.applyFileOperations(response.operations);
    } else if (response.files?.length) {
      this.state.applyFileOperations(response.files.map((file) => ({ type: 'update', path: file.path, content: file.content })));
    }

    if (response.projectSummary) {
      this.state.updateChatMetadata(this.state.activeChatId(), { projectSummary: response.projectSummary });
      this.state.updateProjectMemory({ aiSummary: response.projectSummary });
    }

    if (response.conversationSummary) {
      this.state.updateChatMetadata(this.state.activeChatId(), { conversationSummary: response.conversationSummary });
    }

    if (response.pendingTasks?.length) {
      this.state.updateChatMetadata(this.state.activeChatId(), { pendingTasks: response.pendingTasks });
    }

    if (response.completedTasks?.length) {
      this.state.updateChatMetadata(this.state.activeChatId(), { completedTasks: response.completedTasks });
    }

    if (response.routes?.length) {
      const routes = response.routes
        .map((route) => typeof route === 'string' ? route : route?.path)
        .filter((route): route is string => typeof route === 'string' && route.trim().length > 0);
      if (routes.length) {
        this.state.updateProjectMemory({ routes });
      }
    }
  }

  private defaultSystemPrompt(): string {
    return [
      'You are Forge AI, an autonomous product builder for modern web applications.',
      'Maintain persistent project memory across the conversation.',
      'Track brand goals, audience, routes, style language, previous mistakes, and repair history.',
      'Before editing, understand the current project architecture, files, and recent changes.',
      'Prefer targeted updates to existing files over regenerating entire projects.',
      'When a user asks for a feature, component, or website, create or update the relevant files directly.',
      'Return structured JSON with either a message only or a message plus file operations and summaries.'
    ].join(' ');
  }

  private describeProject(chat: ChatSession | undefined): string {
    if (!chat) return 'A new workspace is being prepared.';
    const project = chat.project;
    return [
      `Framework: ${project.framework || 'undetermined'}`,
      `Architecture: ${project.architecture || 'custom'}`,
      `Theme: ${project.uiTheme || 'modern dark'}`,
      `Routes: ${project.routes?.join(', ') || 'none yet'}`
    ].join(' | ');
  }

  private buildProjectBrief(chat: ChatSession | undefined, files: GeneratedFile[]): string {
    if (!chat) return 'No active project brief yet.';
    const htmlPages = files.filter((file) => file.path.endsWith('.html')).map((file) => file.path);
    return [
      `Project: ${chat.projectSummary || chat.project.aiSummary || 'New Forge project'}`,
      `Design language: ${chat.project.uiTheme || 'modern premium'}`,
      `Architecture: ${chat.project.architecture || 'static multi-page web app'}`,
      `Known pages: ${(chat.project.routes?.length ? chat.project.routes : htmlPages).join(', ') || 'none yet'}`,
      `Pending tasks: ${(chat.pendingTasks ?? []).slice(0, 5).join('; ') || 'none'}`,
      `Completed tasks: ${(chat.completedTasks ?? []).slice(0, 5).join('; ') || 'none'}`,
      `Recent edits: ${(chat.recentEdits ?? []).slice(0, 6).join('; ') || 'none'}`
    ].join('\n');
  }

  private summarizeWorkflow(chat: ChatSession | undefined): string {
    const latestRun = chat?.activeWorkflowRun ?? chat?.workflowRuns?.[0];
    if (!latestRun) return 'No workflow runs have completed yet.';
    const completedSteps = latestRun.steps
      .filter((step) => step.status === 'completed' || step.status === 'warning' || step.status === 'failed')
      .map((step) => `${step.label}: ${step.status}`);
    return `${latestRun.summary} ${completedSteps.join(' | ')}`.trim();
  }

  private summarizeConversation(messages: ChatMessage[]): string {
    const meaningful = messages.filter((message) => message.text?.trim()).slice(-8);
    const bullets = meaningful.map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.text.replace(/\s+/g, ' ').slice(0, 140)}`);
    return bullets.length ? `Conversation highlights: ${bullets.join(' | ')}` : 'Conversation started.';
  }

  private extractFileTree(files: GeneratedFile[]): string[] {
    const folders = new Set<string>();
    files.forEach((file) => {
      const parts = file.path.split('/');
      if (parts.length > 1) {
        for (let index = 1; index < parts.length; index += 1) {
          folders.add(parts.slice(0, index).join('/'));
        }
      }
    });
    return Array.from(folders).sort();
  }

  private resolveSelectedFile(chat: ChatSession | undefined, workspaceFiles: GeneratedFile[]): GeneratedFile | null {
    if (!chat) return workspaceFiles[0] ?? null;
    const selectedPath = chat.selectedFilePath;
    if (selectedPath) {
      return workspaceFiles.find((file) => file.path === selectedPath) ?? workspaceFiles[0] ?? null;
    }
    return workspaceFiles[0] ?? null;
  }
}
