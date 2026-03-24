// load-env.js
// Loads .env variables before running angular CLI commands.
// Usage: node load-env.js serve | build | ...
const { execSync } = require('child_process');
const path = require('path');

// Load .env file into process.env
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const args = process.argv.slice(2);
const cmd = `ng ${args.join(' ')}`;

console.log(`[load-env] Running: ${cmd}`);
console.log(`[load-env] GEMINI_API_KEY loaded: ${process.env.GEMINI_API_KEY ? 'YES ✓' : 'NO ✗'}`);

execSync(cmd, {
  stdio: 'inherit',
  env: process.env,
});
