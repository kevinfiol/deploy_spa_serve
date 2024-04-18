import { walk, existsSync } from 'https://deno.land/std@0.223.0/fs/mod.ts';
import { resolve, globToRegExp, join } from 'https://deno.land/std@0.223.0/path/mod.ts';
import { serveFile } from "https://deno.land/std@0.223.0/http/file_server.ts";

const FALLBACK = Deno.env.get('SPA_FALLBACK') || '';
const SPA_GLOBS = Deno.env.get('SPA_GLOBS') || '';
const IGNORE_GLOBS = Deno.env.get('IGNORE_GLOBS') || '';

const FILES = new Map<string, string>();
const ROOT = resolve('.');
const DEFAULT_IGNORES = [
  '**/.git/**/*',
  '**/.git',
  '**/.env',
  '**/.gitignore',
  '**/.DS_Store',
  '**/node_modules',
  '**/node_modules/**/*'
];

const IGNORE_PATTERNS = DEFAULT_IGNORES.concat(IGNORE_GLOBS ? IGNORE_GLOBS.split(',') : []).map((glob) => globToRegExp(glob));
const SPA_PATTERNS = SPA_GLOBS ? SPA_GLOBS.split(',').map((glob) => globToRegExp(glob)) : [];

const normalize = (path = '') => {
  return path.replace(/\\/g, '/').normalize();
};

/**
 * @param {string} path
 * @param {RegExp[]} patterns
 */
const checkPatterns = (path, patterns) => {
  for (const pattern of patterns)
    if (pattern.test(path)) return true;

  return false;
};

const routeToSPA = (pathname = '') => {
  // check if the path has a filetype-like path (has a `.`)
  const end = pathname.split('/').pop();
  if (end && end.indexOf('.') > 0) {
    return checkPatterns(pathname, SPA_PATTERNS);
  }

  return true;
};

const rootPattern = new RegExp(`^(${ROOT.replace(/\\/g, '\\\\')})(.+)`); // escape backslashes

for await (const file of walk(ROOT)) {
  if (checkPatterns(file.path, IGNORE_PATTERNS)) continue;

  const match = file.path.match(rootPattern);
  if (match === null) continue;

  // normalize relative file path (\\css\\main.css -> /css/main.css)
  const filePath = normalize(match[2]);

  if (file.isFile) {
    FILES.set(filePath, file.path);
    if (filePath === '/index.html') FILES.set('/', file.path);
  } else if (file.isDirectory) {
    // check if an index.html exists
    const indexPath = join(file.path, 'index.html');

    if (existsSync(indexPath)) {
      FILES.set(filePath, indexPath);
      FILES.set(filePath + '/', indexPath);
    }
  }
}

Deno.serve((req) => {
  const pathname = new URL(req.url).pathname;
  const filepath = FILES.get(pathname) || (
    FALLBACK && routeToSPA(pathname)
      ? FILES.get(FALLBACK)
      : undefined
  );

  if (filepath) return serveFile(req, filepath);

  return new Response("404: Not Found", {
    status: 404,
  });
});
