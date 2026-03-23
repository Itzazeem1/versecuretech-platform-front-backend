const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\azeem\\Downloads\\versecuretech\\src';

const replacements = {
  '--color-royal-bg': '--bg-main',
  '--color-royal-dark': '--bg-secondary',
  '--color-royal-accent': '--accent-main',
  '--color-royal-accent-glow': '--accent-glow',
  '--color-royal-secondary': '--accent-main', // any leftover
  '--color-text-primary': '--text-primary',
  '--color-text-muted': '--text-muted'
};

function walkDir(d) {
  const files = fs.readdirSync(d);
  files.forEach(file => {
    const fullPath = path.join(d, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.css') || fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [k, v] of Object.entries(replacements)) {
        if (content.includes(k)) {
          content = content.split(k).join(v);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated ' + fullPath);
      }
    }
  });
}
walkDir(dir);
