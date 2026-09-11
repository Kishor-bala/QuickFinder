const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const rootEnvPath = path.join(rootDir, '.env');

// Load root .env and inject into the environment for all child processes.
// This is the single source of truth — no sub-app .env files needed.
if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
  console.log('\x1b[32m%s\x1b[0m', `✅ Loaded .env from: ${rootEnvPath}`);
} else {
  console.error('\x1b[31m%s\x1b[0m', `❌ ERROR: .env file not found at ${rootEnvPath}`);
  console.error('\x1b[33m%s\x1b[0m', '   Copy .env.example → .env and fill in your values.');
  process.exit(1);
}

console.log('\x1b[36m%s\x1b[0m', '================================================');
console.log('\x1b[36m%s\x1b[0m', '🚀 QUICK FINDER ENTERPRISE MONOREPO DEV RUNNER');
console.log('\x1b[36m%s\x1b[0m', '================================================');

const apiDir = path.join(rootDir, 'apps', 'api');
const webDir = path.join(rootDir, 'apps', 'web');

function runService(name, command, args, cwd, colorCode) {
  const child = spawn(command, args, {
    cwd,
    shell: true,
    stdio: 'pipe',
    // Pass the full process.env (which now includes root .env vars) to all children
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  const prefix = `\x1b[${colorCode}m[${name}]\x1b[0m `;

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) process.stdout.write(prefix + line + '\n');
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) process.stderr.write(prefix + line + '\n');
    });
  });

  child.on('close', (code) => {
    console.log(prefix + `Process exited with code ${code}`);
  });

  return child;
}

const apiProcess = runService('API', 'npm', ['run', 'dev'], apiDir, '34'); // Blue
const webProcess = runService('WEB', 'npm', ['run', 'dev'], webDir, '35'); // Magenta

function shutdown() {
  console.log('\n\x1b[33mGracefully shutting down all services...\x1b[0m');
  apiProcess.kill();
  webProcess.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
