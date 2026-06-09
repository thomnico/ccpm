import type { Frontmatter } from './types';

export function parseFrontmatter(body: string): {
  frontmatter: Frontmatter;
  content: string;
} {
  const match = body.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content: body };

  const frontmatter: Frontmatter = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    const sep = line.indexOf(':');
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    const raw = line.slice(sep + 1).trim();
    if (!key) continue;

    if (raw === 'true') {
      frontmatter[key] = true;
    } else if (raw === 'false') {
      frontmatter[key] = false;
    } else if (raw !== '' && !isNaN(Number(raw))) {
      frontmatter[key] = Number(raw);
    } else if (raw.includes(',')) {
      frontmatter[key] = raw.split(',').map((s) => s.trim());
    } else {
      frontmatter[key] = raw;
    }
  }

  return { frontmatter, content: match[2] };
}

export function extractPrdReference(body: string): number | null {
  const match = body.match(/PRD:\s*#(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}
