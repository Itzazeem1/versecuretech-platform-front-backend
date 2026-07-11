export function normalizeConversationHistory(history = [], maxMessages = 12) {
  const normalized = (Array.isArray(history) ? history : [])
    .map((msg) => ({
      role: typeof msg?.role === 'string' ? msg.role.toLowerCase() : 'assistant',
      text: typeof msg?.text === 'string' ? msg.text.trim() : ''
    }))
    .filter((msg) => msg.text && (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'model'));

  return normalized.slice(-maxMessages);
}

export function isPortfolioOrWebsiteRequest(prompt = '') {
  const normalized = `${prompt || ''}`.toLowerCase();
  return /(portfolio|personal website|personal site|developer portfolio|creative portfolio|showcase site|resume site|portfolio site|online portfolio|my portfolio|web portfolio)/i.test(normalized);
}

export function isUpgradeRequest(prompt = '') {
  return /(advanced|upgrade|improve|redesign|premium|modernize|more advanced|more polished|better|enhance|revamp|rework|elevate|world class|production ready|make it|make this)/i.test(prompt || '');
}

export function isRepairRequest(prompt = '') {
  return /(check again|check it|fix it|repair|debug|not working|broken|blank|white|black|issue|bug|bugs|nothing shows|preview|html not working|links? not working|page not working)/i.test(prompt || '');
}

export function isProjectBuildRequest(prompt = '') {
  const normalized = `${prompt || ''}`.toLowerCase();
  const hasBuildVerb = /(build|create|make|generate|design|develop|code|craft|launch|turn|convert)/i.test(normalized);
  const hasProjectNoun = /(site|website|web app|app|landing page|page|portfolio|dashboard|store|shop|blog|saas|startup|agency|restaurant|sports|fitness|real estate|ecommerce|e-commerce)/i.test(normalized);

  return isPortfolioOrWebsiteRequest(normalized) || isUpgradeRequest(normalized) || isRepairRequest(normalized) || (hasBuildVerb && hasProjectNoun);
}

export function looksLikeProjectPayload(text = '') {
  const normalized = `${text || ''}`;
  return /```[\w-]*|<!doctype html|<html[\s>]|<head[\s>]|<body[\s>]|<main[\s>]|<div[\s>]|<section[\s>]|<script[\s>]|<style[\s>]|<\/[a-z][^>]*>|\{"files"|\{"operations"|"path"\s*:|^\s*(import|export|const|let|var|function|class)\s+/im.test(normalized);
}

export function extractHtmlFromText(text = '') {
  const normalized = `${text || ''}`.trim();
  const fencedMatch = normalized.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    const fenced = fencedMatch[1].trim();
    if (/<html[\s\S]*<\/html>/i.test(fenced)) {
      return fenced.match(/<html[\s\S]*<\/html>/i)?.[0] ?? fenced;
    }
    if (/<!doctype html[\s\S]*/i.test(fenced)) {
      return fenced;
    }
  }

  const htmlDocument = normalized.match(/<!doctype html[\s\S]*?<\/html>/i)
    ?? normalized.match(/<html[\s\S]*?<\/html>/i);
  if (htmlDocument?.[0]) return htmlDocument[0];

  const partialHtml = normalized.match(/<!doctype html[\s\S]*/i)
    ?? normalized.match(/<html[\s\S]*/i);
  return partialHtml?.[0] ?? null;
}

export function shouldForceProjectBuildFallback(prompt = '', responseText = '') {
  const normalizedPrompt = `${prompt || ''}`.toLowerCase();
  const isPortfolioLike = isPortfolioOrWebsiteRequest(normalizedPrompt);
  const isExplicitNewProjectRequest = /(new project|start from scratch|brand new|fresh project|create a new website|create a new app|build a new site|build a new app)/i.test(normalizedPrompt);
  const isUpgradeLike = isUpgradeRequest(normalizedPrompt);
  const looksLikePayload = looksLikeProjectPayload(responseText);

  if (isExplicitNewProjectRequest) return true;
  if (isPortfolioLike && !isUpgradeLike && !looksLikePayload) {
    return false;
  }
  if (!isUpgradeLike) return false;
  return true;
}

export function shouldUsePremiumPortfolioFallback(prompt = '', parsedFiles = [], existingFiles = []) {
  const normalizedPrompt = `${prompt || ''}`.toLowerCase();
  const isPortfolioRequest = isPortfolioOrWebsiteRequest(normalizedPrompt);
  const isUpgradeLike = isUpgradeRequest(normalizedPrompt);

  if (isPortfolioRequest) return true;
  if (isUpgradeLike) return false;
  return false;
}

export function buildChatMessages({ history, prompt, systemInstruction, provider }) {
  const normalizedHistory = normalizeConversationHistory(history, 12);
  const messages = [];

  if (provider === 'xai') {
    messages.push({ role: 'developer', content: systemInstruction });
  } else {
    messages.push({ role: 'system', content: systemInstruction });
  }

  for (const msg of normalizedHistory) {
    const mappedRole = msg.role === 'user' ? 'user' : 'assistant';
    messages.push({ role: mappedRole, content: msg.text });
  }

  if (prompt) {
    messages.push({ role: 'user', content: prompt });
  }

  return messages;
}

export function buildForgeContextPayload({
  prompt,
  systemPrompt = '',
  projectSummary = '',
  conversationSummary = '',
  recentMessages = [],
  workspaceFiles = [],
  currentFileTree = [],
  selectedFile = null,
  pendingTasks = [],
  recentEdits = [],
  openTabs = [],
  currentUserPrompt = ''
} = {}) {
  const normalizedPrompt = `${prompt || currentUserPrompt || ''}`.trim();
  const parts = [];

  if (systemPrompt) {
    parts.push(`SYSTEM PROMPT:\n${systemPrompt}`);
  }

  if (projectSummary) {
    parts.push(`PROJECT SUMMARY:\n${projectSummary}`);
  }

  if (conversationSummary) {
    parts.push(`CONVERSATION SUMMARY:\n${conversationSummary}`);
  }

  if (recentMessages.length > 0) {
    const recentMessagesBlock = recentMessages
      .slice(-8)
      .map((msg) => `${msg?.role === 'user' ? 'USER' : 'ASSISTANT'}: ${typeof msg?.text === 'string' ? msg.text : ''}`)
      .join('\n');
    parts.push(`RECENT MESSAGES:\n${recentMessagesBlock}`);
  }

  if (workspaceFiles.length > 0) {
    const workspaceSnippet = workspaceFiles
      .slice(0, 8)
      .map((file) => {
        const content = typeof file?.content === 'string' ? file.content : '';
        const preview = content.length > 2400 ? `${content.slice(0, 2400)}\n...[trimmed]` : content;
        return `FILE: ${file?.path || 'unknown'}\n${preview}`;
      })
      .join('\n\n');

    parts.push(`CURRENT WORKSPACE FILES:\n${workspaceSnippet}`);
  }

  if (currentFileTree.length > 0) {
    parts.push(`CURRENT FILE TREE:\n${currentFileTree.join('\n')}`);
  }

  if (selectedFile?.path) {
    parts.push(`CURRENT SELECTED FILE:\n${selectedFile.path}`);
  }

  if (pendingTasks.length > 0) {
    parts.push(`PENDING TASKS:\n${pendingTasks.join('\n')}`);
  }

  if (recentEdits.length > 0) {
    parts.push(`RECENT EDITS:\n${recentEdits.slice(-6).join('\n')}`);
  }

  if (openTabs.length > 0) {
    parts.push(`OPEN TABS:\n${openTabs.join('\n')}`);
  }

  if (normalizedPrompt) {
    parts.push(`CURRENT USER PROMPT:\n${normalizedPrompt}`);
  }

  parts.push(`IMPORTANT: Keep the project memory intact. Preserve existing architecture and update files in place unless the user explicitly requests a full reset or brand new project.
Return only valid JSON for project work. Include files or operations plus routes and warnings. For multi-page sites, every internal navigation link must resolve to a generated HTML file such as index.html, about.html, services.html, or contact.html. Do not claim a site is multi-page unless those page files exist. Never generate placeholder, TODO, coming soon, empty, or stub pages.
Quality bar: produce premium builder-grade output with cohesive design tokens, responsive states, meaningful copy, accessible markup, SEO basics, strong spacing, and polished interactions.`);

  return parts.join('\n\n');
}

export function hasForbiddenPlaceholderContent(input = '') {
  const text = typeof input === 'string'
    ? input
    : JSON.stringify(input ?? '');
  return /\b(lorem ipsum|placeholder|coming soon|todo|fixme|replace this|sample text|stub page|empty page)\b/i.test(text);
}

export function validateForgeResponseContract(response = {}) {
  const warnings = [];
  const files = Array.isArray(response?.files) ? response.files : [];
  const operations = Array.isArray(response?.operations) ? response.operations : [];
  const hasFiles = files.length > 0 && files.every((file) => typeof file?.path === 'string' && typeof file?.content === 'string');
  const hasOperations = operations.length > 0 && operations.every((operation) => (
    ['create', 'update', 'delete'].includes(operation?.type)
    && typeof operation?.path === 'string'
    && (operation.type === 'delete' || typeof operation?.content === 'string')
  ));
  const hasProjectChanges = hasFiles || hasOperations;

  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    warnings.push('Response must be a JSON object.');
  }
  if (!hasProjectChanges && typeof response?.message !== 'string') {
    warnings.push('Response should include a user-facing message or project file changes.');
  }
  if (hasForbiddenPlaceholderContent(response)) {
    warnings.push('Response contains placeholder or temporary content.');
  }
  if (hasFiles && !files.some((file) => file.path.endsWith('.html'))) {
    warnings.push('Project responses should include at least one HTML page.');
  }

  return {
    valid: warnings.length === 0,
    warnings,
    hasProjectChanges
  };
}

export function buildForgeRepairPrompt({ prompt = '', diagnostics = [], files = [] } = {}) {
  const issueList = (Array.isArray(diagnostics) ? diagnostics : [])
    .filter(Boolean)
    .slice(0, 12)
    .map((issue) => `- ${issue}`)
    .join('\n');
  const fileList = (Array.isArray(files) ? files : [])
    .slice(0, 12)
    .map((file) => `- ${file?.path || 'unknown'}`)
    .join('\n');

  return [
    'FORGE TARGETED REPAIR BRIEF',
    prompt ? `Original request: ${prompt}` : '',
    issueList ? `Diagnostics:\n${issueList}` : 'Diagnostics: No blocking diagnostics were provided.',
    fileList ? `Affected workspace files:\n${fileList}` : '',
    'Repair only the affected files. Preserve the existing design language, routes, imports, and architecture. Do not create placeholders, TODO pages, coming-soon pages, or generic replacement projects. Return valid Forge JSON with operations or files.'
  ].filter(Boolean).join('\n\n');
}

export function buildPromptWithContext({ prompt, workspaceFiles = [], attachedFiles = [] }) {
  const parts = [];

  if (prompt) {
    parts.push(`USER REQUEST:\n${prompt}`);
  }

  if (workspaceFiles.length > 0) {
    const workspaceSnippet = workspaceFiles
      .slice(0, 8)
      .map((file) => {
        const content = typeof file?.content === 'string' ? file.content : '';
        const preview = content.length > 2400 ? `${content.slice(0, 2400)}\n...[trimmed]` : content;
        return `FILE: ${file?.path || 'unknown'}\n${preview}`;
      })
      .join('\n\n');

    parts.push(`CURRENT WORKSPACE FILES:\n${workspaceSnippet}`);
  }

  if (attachedFiles.length > 0) {
    const attachedSnippet = attachedFiles
      .map((file) => `ATTACHED FILE: ${file?.name || 'unknown'} (${file?.type || 'unknown'})`)
      .join('\n');
    parts.push(`ATTACHED FILES:\n${attachedSnippet}`);
  }

  const isPortfolioRequest = isPortfolioOrWebsiteRequest(prompt);
  const isUpgradeRequest = /(advanced|upgrade|improve|redesign|premium|modernize|more advanced|more polished|better|make it|make this)/i.test(prompt || '');

  parts.push(`IMPORTANT: ${isPortfolioRequest ? 'This is a portfolio or website creation request. Generate a polished, complete multi-section or multi-page project and treat it as a real build rather than a conversational reply.' : isUpgradeRequest ? 'This is an upgrade or enhancement request. update the existing project in place, preserve the existing structure, and return structured project changes or file operations. Do not answer with a chat-only explanation or a generic starter page.' : 'If the request is to improve, redesign, expand, or make the current project more advanced, update the existing project in place. Preserve the existing structure and make the result clearly more polished, advanced, and production-ready. Do not return a generic starter page unless the user explicitly asks for a brand new project.'}
Project JSON contract: include files or operations, routes, warnings, projectSummary, conversationSummary, pendingTasks, and completedTasks. For multi-page sites, every nav link must point to an included complete HTML file. Use static paths like index.html, about.html, services.html, pricing.html, contact.html. Never create placeholder, TODO, coming soon, empty, or stub pages.
Quality bar: output should feel like a premium AI builder result, not a basic template. Use cohesive design tokens, real content, responsive states, accessibility, SEO basics, and visible upgrades for enhancement requests.`);

  return parts.join('\n\n');
}
