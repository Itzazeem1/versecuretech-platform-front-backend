// load-env.js
// Loads .env variables before running angular CLI commands.
// Usage: node load-env.js serve | build | ...
const { execSync } = require('child_process');
const path = require('path');

// Load .env file into process.env
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const args = process.argv.slice(2);
let cmd = `ng ${args.join(' ')}`;

// Automatically inject the GEMINI_API_KEY from .env into the Angular build
if (process.env.GEMINI_API_KEY) {
  cmd += ` --define="GEMINI_API_KEY='${process.env.GEMINI_API_KEY}'"`;
}

console.log(`[load-env] Running: ${cmd}`);
console.log(`[load-env] GEMINI_API_KEY loaded: ${process.env.GEMINI_API_KEY ? 'YES ✓' : 'NO ✗'}`);

execSync(cmd, {
  stdio: 'inherit',
  env: process.env,
});
