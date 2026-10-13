import sharp from 'sharp';
import { mkdir, access } from 'node:fs/promises';
import { terms } from '../src/data.js';

await mkdir('src/assets/terms', { recursive: true });
await mkdir('src/assets/avatars', { recursive: true });
for (const term of terms) {
  const source = `output/imagegen/${term.id}.png`;
  await access(source);
  await sharp(source)
    .resize(1440, 960, { fit: 'cover' })
    .webp({ quality: 80, effort: 6 })
    .toFile(`src/assets/terms/${term.id}.webp`);
  // Preserve the detailed right-hand subject when preparing the small portrait.
  await sharp(source)
    .resize(480, 480, { fit: 'cover', position: sharp.strategy.attention })
    .webp({ quality: 82, effort: 6 })
    .toFile(`src/assets/avatars/${term.id}.webp`);
  console.log(`${term.name}: landscape and avatar prepared`);
}
