const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\azeem\\Downloads\\versecuretech\\src';

function walkDir(d) {
  const files = fs.readdirSync(d);
  files.forEach(file => {
    const fullPath = path.join(d, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      // Eradicate Generic Whites
      content = content.replace(/text-white/g, 'text-[var(--text-primary)]');
      content = content.replace(/bg-white/g, 'bg-[var(--text-primary)]');
      content = content.replace(/border-white/g, 'border-[var(--text-primary)]');
      
      // Eradicate Generic Grays
      content = content.replace(/text-gray-\d{3}/g, 'text-[var(--text-muted)]');
      content = content.replace(/bg-gray-\d{3}/g, 'bg-[var(--bg-secondary)]');
      content = content.replace(/border-gray-\d{3}/g, 'border-[var(--text-muted)]');
      
      // Eradicate Generic Blacks (that usually mean background)
      content = content.replace(/bg-black/g, 'bg-[var(--bg-main)]');
      content = content.replace(/text-black/g, 'text-[var(--bg-main)]');
      
      // Replace old custom globals
      content = content.replace(/box-glow/g, 'glow');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Purged generic colors in ' + fullPath);
      }
    }
  });
}

walkDir(dir);
