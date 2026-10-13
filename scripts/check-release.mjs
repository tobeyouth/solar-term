import { readFile, readdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';

const root = new URL('../release/', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
assert.ok(Buffer.byteLength(html) < 10 * 1024, 'Online HTML should stay below 10 KiB');
assert.match(html, /<script[^>]+type="module"[^>]+src="\.\/assets\//);
assert.match(html, /rel="modulepreload"/, 'ESM dependencies should preload in parallel');
assert.ok(!html.includes('/src/main.js'), 'Never publish the Vite development entry');
for (const [, reference] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  assert.ok(
    reference.startsWith('./assets/'),
    `Asset must work under a repository subpath: ${reference}`,
  );
  await stat(new URL(reference, root));
}
const assets = await readdir(new URL('assets/', root));
assert.equal(assets.filter((name) => name.endsWith('.webp')).length, 48);
assert.ok(
  assets.filter((name) => name.endsWith('.js')).length >= 2,
  'Split ESM chunks are required',
);
assert.ok(
  assets.some((name) => name.endsWith('.css')),
  'CSS must be a separate asset',
);
let codeBytes = 0;
for (const name of assets.filter((name) => /\.(js|css)$/.test(name))) {
  const source = await readFile(new URL(`assets/${name}`, root), 'utf8');
  assert.ok(!source.includes('data:image/'), `Images must not be embedded in ${name}`);
  codeBytes += Buffer.byteLength(source);
}
assert.ok(codeBytes < 400 * 1024, 'JS and CSS should remain under 400 KiB total');
console.log(
  `Online build verified: ${Buffer.byteLength(html)} B HTML, ${(codeBytes / 1024).toFixed(1)} KiB JS/CSS, 48 separate images.`,
);
