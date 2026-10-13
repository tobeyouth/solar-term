import { readFile, readdir, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { terms } from '../src/data.js';

const html = await readFile('dist/index.html', 'utf8');
assert.deepEqual(
  await readdir('dist'),
  ['index.html'],
  'The deliverable must be one self-contained HTML',
);
assert.ok(!/<script\b[^>]*\bsrc\s*=/i.test(html), 'No external JavaScript');
assert.ok(
  !/<link\b[^>]*\brel=["'](?:stylesheet|modulepreload)/i.test(html),
  'No external CSS or module dependencies',
);
assert.ok(!/url\(["']?(?:https?:|\/src\/)/i.test(html), 'No remote or source-directory CSS assets');
assert.ok(
  (html.match(/data:image\/webp;base64,/g) || []).length >= 48,
  '24 landscapes and 24 avatars must be embedded',
);
for (const term of terms) {
  assert.ok(html.includes(term.name), `${term.name} text is missing`);
  for (const folder of ['terms', 'avatars'])
    assert.ok(
      (await stat(`src/assets/${folder}/${term.id}.webp`)).size > 1000,
      `${term.id} artwork is missing`,
    );
}
console.log(
  `Single-file offline build verified: ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MiB, 24 terms, 48 embedded images.`,
);
