#!/usr/bin/env bun

import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import sirv from 'sirv';
import { createServer } from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse args
const args = process.argv.slice(2);
let port = 5173;
let repo = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) port = parseInt(args[i + 1], 10);
  if (args[i] === '--repo' && args[i + 1]) repo = args[i + 1];
}

// Auto-detect repo from git remote
if (!repo) {
  try {
    const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
    const match = remote.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (match) repo = `${match[1]}/${match[2]}`;
  } catch {}
}

// Serve dist/ with GitHub OAuth proxy
const distPath = resolve(__dirname, '..', 'dist');
const sirvHandler = sirv(distPath, { single: true });

async function proxyToGitHub(req, res) {
  const ghPath = req.url.slice('/api/github'.length);
  const ghUrl = `https://github.com${ghPath}`;

  // Collect request body
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString();

  try {
    const ghRes = await fetch(ghUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: req.method === 'POST' ? body : undefined,
    });

    const data = await ghRes.text();
    res.writeHead(ghRes.status, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

const server = createServer((req, res) => {
  if (req.url.startsWith('/api/github/')) {
    proxyToGitHub(req, res);
  } else {
    sirvHandler(req, res);
  }
});

server.listen(port, () => {
  const url = `http://localhost:${port}${repo ? `#/?repo=${repo}` : ''}`;
  console.log(`\n  CCPM Dashboard running at ${url}\n`);
  // Open browser
  import('opener').then((mod) => mod.default(url)).catch(() => {});
});
