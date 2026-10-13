import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { terms } from '../src/data.js';

await mkdir('output/review', { recursive: true });
const composites = [];
for (const term of terms) {
  const x = (term.index % 6) * 256;
  const y = Math.floor(term.index / 6) * 199;
  const picture = await sharp(`output/imagegen/${term.id}.png`).resize(256, 171).png().toBuffer();
  composites.push({ input: picture, left: x, top: y });
  const label = Buffer.from(
    `<svg width="256" height="28"><rect width="256" height="28" fill="#fafbf8"/><text x="12" y="19" font-family="sans-serif" font-size="12" fill="#344c40">${String(term.index + 1).padStart(2, '0')} ${term.id}</text></svg>`,
  );
  composites.push({ input: label, left: x, top: y + 171 });
}
await sharp({ create: { width: 1536, height: 796, channels: 3, background: '#fafbf8' } })
  .composite(composites)
  .webp({ quality: 90 })
  .toFile('output/review/artwork-24.webp');
