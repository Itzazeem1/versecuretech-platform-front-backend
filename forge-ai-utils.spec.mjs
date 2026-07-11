import { describe, it, expect } from 'vitest';
import { normalizeConversationHistory, buildChatMessages, buildPromptWithContext, buildForgeContextPayload, isPortfolioOrWebsiteRequest, isProjectBuildRequest, isRepairRequest, looksLikeProjectPayload, extractHtmlFromText, shouldForceProjectBuildFallback, shouldUsePremiumPortfolioFallback, validateForgeResponseContract, hasForbiddenPlaceholderContent, buildForgeRepairPrompt } from './forge-ai-utils.mjs';

describe('forge ai utils', () => {
  it('normalizes and trims chat history', () => {
    const history = [
      { role: 'USER', text: '   hello there  ' },
      { role: 'assistant', text: 'Hi there!' },
      { role: 'user', text: 'Make it faster' }
    ];

    const result = normalizeConversationHistory(history, 2);

    expect(result).toEqual([
      { role: 'assistant', text: 'Hi there!' },
      { role: 'user', text: 'Make it faster' }
    ]);
  });

  it('uses provider-specific message roles', () => {
    const messages = buildChatMessages({
      history: [{ role: 'user', text: 'Hello' }],
      prompt: 'Build me a landing page',
      systemInstruction: 'You are Forge AI',
      provider: 'xai'
    });

    expect(messages[0]).toEqual({ role: 'developer', content: 'You are Forge AI' });
    expect(messages[1]).toEqual({ role: 'user', content: 'Hello' });
    expect(messages[2]).toEqual({ role: 'user', content: 'Build me a landing page' });
  });

  it('builds a prompt that preserves the current workspace context', () => {
    const prompt = buildPromptWithContext({
      prompt: 'Make this more advanced',
      workspaceFiles: [{ path: 'index.html', content: '<html>hello</html>' }],
      attachedFiles: [{ name: 'design.png', type: 'image/png' }]
    });

    expect(prompt).toContain('CURRENT WORKSPACE FILES');
    expect(prompt).toContain('Make this more advanced');
    expect(prompt).toContain('ATTACHED FILES');
    expect(prompt).toContain('update the existing project in place');
  });

  it('builds a rich context payload for persistent project memory', () => {
    const payload = buildForgeContextPayload({
      prompt: 'Make the navbar glassmorphic',
      systemPrompt: 'You are Forge AI',
      projectSummary: 'Landing page project with dark theme',
      conversationSummary: 'Previously built hero and pricing sections',
      recentMessages: [{ role: 'user', text: 'Build me a landing page' }, { role: 'model', text: 'Done' }],
      workspaceFiles: [{ path: 'index.html', content: '<html></html>' }],
      currentFileTree: ['src'],
      selectedFile: { path: 'index.html', content: '<html></html>' },
      pendingTasks: ['Apply glassmorphic navbar'],
      recentEdits: ['Added hero section'],
      openTabs: ['index.html'],
      currentUserPrompt: 'Make the navbar glassmorphic'
    });

    expect(payload).toContain('SYSTEM PROMPT');
    expect(payload).toContain('Forge AI');
    expect(payload).toContain('PROJECT SUMMARY');
    expect(payload).toContain('Landing page project');
    expect(payload).toContain('CURRENT USER PROMPT');
    expect(payload).toContain('glassmorphic');
  });

  it('detects explicit portfolio requests without mistaking other site requests for portfolios', () => {
    expect(isPortfolioOrWebsiteRequest('make me a portfolio')).toBe(true);
    expect(isPortfolioOrWebsiteRequest('build me a personal portfolio')).toBe(true);
    expect(isPortfolioOrWebsiteRequest('build me a sports site')).toBe(false);
    expect(isPortfolioOrWebsiteRequest('build me a landing page')).toBe(false);
    expect(isPortfolioOrWebsiteRequest('hello there')).toBe(false);
  });

  it('detects broader project build and enhancement requests', () => {
    expect(isProjectBuildRequest('build me a sports site')).toBe(true);
    expect(isProjectBuildRequest('create a landing page for my agency')).toBe(true);
    expect(isProjectBuildRequest('make it more advanced')).toBe(true);
    expect(isProjectBuildRequest('check again the preview is blank')).toBe(true);
    expect(isProjectBuildRequest('hello there')).toBe(false);
  });

  it('detects repair and preview debugging requests', () => {
    expect(isRepairRequest('check again nothing shows')).toBe(true);
    expect(isRepairRequest('fix the html not working')).toBe(true);
    expect(isRepairRequest('the page goes blank')).toBe(true);
    expect(isRepairRequest('make the hero more premium')).toBe(false);
  });

  it('forces a project fallback for upgrade-style replies that contain code or html', () => {
    expect(shouldForceProjectBuildFallback('make it more advanced', '{"message":"Here is the upgraded site\\n<!DOCTYPE html>..."}')).toBe(true);
    expect(shouldForceProjectBuildFallback('make it more advanced', 'just chatting')).toBe(true);
    expect(shouldForceProjectBuildFallback('make it more advanced', 'Here is the upgraded version of your site')).toBe(true);
    expect(shouldForceProjectBuildFallback('hello there', 'just chatting')).toBe(false);
  });

  it('detects code-like payloads and extracts html documents from chat replies', () => {
    expect(looksLikeProjectPayload('Here is the site\n<!DOCTYPE html><html><body></body></html>')).toBe(true);
    expect(looksLikeProjectPayload('```ts\nconst value = 1;\n```')).toBe(true);
    expect(looksLikeProjectPayload('const site = `<html></html>`;')).toBe(true);
    expect(looksLikeProjectPayload('Sure, I can help with that.')).toBe(false);
    expect(extractHtmlFromText('```html\n<!DOCTYPE html><html><body>Hi</body></html>\n```')).toContain('<html');
    expect(extractHtmlFromText('Here is the result\n<!DOCTYPE html><html><body>Hi')).toContain('<html');
  });

  it('does not swap a sports-site upgrade into a portfolio fallback', () => {
    expect(shouldUsePremiumPortfolioFallback('make it more advanced', [], [{ path: 'index.html', content: '<html><body>sports site</body></html>' }])).toBe(false);
    expect(shouldUsePremiumPortfolioFallback('make me a sports site more advanced', [], [{ path: 'index.html', content: '<html><body>sports site</body></html>' }])).toBe(false);
    expect(shouldUsePremiumPortfolioFallback('build me a portfolio', [], [])).toBe(true);
  });

  it('validates Forge response contracts without dependencies', () => {
    const valid = validateForgeResponseContract({
      message: 'Built',
      files: [{ path: 'index.html', content: '<html><body>Launch ready</body></html>' }]
    });
    const invalid = validateForgeResponseContract({
      files: [{ path: 'readme.md', content: 'TODO placeholder' }]
    });

    expect(valid.valid).toBe(true);
    expect(valid.hasProjectChanges).toBe(true);
    expect(invalid.valid).toBe(false);
    expect(invalid.warnings.join(' ')).toContain('placeholder');
  });

  it('detects forbidden placeholder content', () => {
    expect(hasForbiddenPlaceholderContent('Coming soon placeholder page')).toBe(true);
    expect(hasForbiddenPlaceholderContent({ files: [{ content: 'Launch-ready original copy' }] })).toBe(false);
  });

  it('builds targeted repair prompts from diagnostics', () => {
    const prompt = buildForgeRepairPrompt({
      prompt: 'fix the blank page',
      diagnostics: ['Broken link from index.html to about.html'],
      files: [{ path: 'index.html' }, { path: 'about.html' }]
    });

    expect(prompt).toContain('FORGE TARGETED REPAIR BRIEF');
    expect(prompt).toContain('Broken link');
    expect(prompt).toContain('Repair only the affected files');
  });
});
