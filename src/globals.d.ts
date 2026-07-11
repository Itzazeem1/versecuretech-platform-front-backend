declare const GEMINI_API_KEY: string;

declare module '*.mjs' {
  export function normalizeConversationHistory(history?: any[], maxMessages?: number): any[];
  export function isPortfolioOrWebsiteRequest(prompt?: string): boolean;
  export function isUpgradeRequest(prompt?: string): boolean;
  export function isRepairRequest(prompt?: string): boolean;
  export function isProjectBuildRequest(prompt?: string): boolean;
  export function looksLikeProjectPayload(text?: string): boolean;
  export function extractHtmlFromText(text?: string): string | null;
  export function shouldForceProjectBuildFallback(prompt?: string, responseText?: string): boolean;
  export function shouldUsePremiumPortfolioFallback(prompt?: string, parsedFiles?: any[], existingFiles?: any[]): boolean;
  export function buildChatMessages(params: any): any[];
  export function buildPromptWithContext(params: any): string;
  export function buildForgeContextPayload(params: any): string;
  export function hasForbiddenPlaceholderContent(input?: any): boolean;
  export function validateForgeResponseContract(response?: any): { valid: boolean; warnings: string[]; hasProjectChanges: boolean };
  export function buildForgeRepairPrompt(params?: any): string;
  const value: any;
  export default value;
}
