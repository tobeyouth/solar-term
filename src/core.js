import { SearchSunLongitude } from 'astronomy-engine';
import { terms } from './data.js';

const yearCache = new Map();
export const chinaDate = (date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

export function getYearTerms(year) {
  if (!Number.isInteger(year) || year < 1900 || year > 2100)
    throw new RangeError('Year must be between 1900 and 2100');
  if (!yearCache.has(year)) {
    const start = new Date(Date.UTC(year, 0, 1));
    yearCache.set(
      year,
      terms
        .map((term) => ({ ...term, at: SearchSunLongitude(term.longitude, start, 366).date }))
        .sort((a, b) => a.at - b.at),
    );
  }
  return yearCache.get(year);
}

export function currentTerm(date = new Date()) {
  const year = Number(chinaDate(date).slice(0, 4));
  const found = getYearTerms(year)
    .filter((term) => term.at <= date)
    .at(-1);
  return found || getYearTerms(year - 1).at(-1);
}

export function shuffledTiles(count = 9, random = Math.random) {
  const tiles = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  if (isSolved(tiles) && count > 1) [tiles[0], tiles[1]] = [tiles[1], tiles[0]];
  return tiles;
}

export function swapTiles(tiles, a, b) {
  const next = [...tiles];
  if ([a, b].every((i) => Number.isInteger(i) && i >= 0 && i < tiles.length))
    [next[a], next[b]] = [next[b], next[a]];
  return next;
}
export const isSolved = (tiles) => tiles.every((tile, index) => tile === index);
export const PROGRESS_KEY = 'suishi.progress.v1';

export function loadProgress(storage) {
  try {
    const saved = JSON.parse(storage.getItem(PROGRESS_KEY));
    if (!saved || Array.isArray(saved) || typeof saved !== 'object') return {};
    return Object.fromEntries(
      terms
        .filter(
          (t) =>
            saved[t.id] &&
            typeof saved[t.id].quiz === 'boolean' &&
            typeof saved[t.id].puzzle === 'boolean',
        )
        .map((t) => [t.id, { quiz: saved[t.id].quiz, puzzle: saved[t.id].puzzle }]),
    );
  } catch {
    return {};
  }
}

export function recordActivity(progress, id, activity) {
  if (!terms.some((t) => t.id === id) || !['quiz', 'puzzle'].includes(activity)) return progress;
  return { ...progress, [id]: { quiz: false, puzzle: false, ...progress[id], [activity]: true } };
}
