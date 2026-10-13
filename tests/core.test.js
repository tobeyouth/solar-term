import test from 'node:test';
import assert from 'node:assert/strict';
import { terms } from '../src/data.js';
import {
  getYearTerms,
  currentTerm,
  chinaDate,
  shuffledTiles,
  swapTiles,
  isSolved,
  loadProgress,
  recordActivity,
} from '../src/core.js';

test('the complete cycle contains 24 unique terms, each with three valid questions', () => {
  assert.equal(terms.length, 24);
  assert.equal(new Set(terms.map((t) => t.id)).size, 24);
  for (const [index, term] of terms.entries()) {
    assert.equal(term.longitude, (315 + index * 15) % 360);
    assert.equal(term.season, Math.floor(index / 6));
    assert.equal(term.questions.length, 3);
    assert.ok(term.description.length > 45);
    for (const q of term.questions) {
      assert.equal(q.options.length, 3);
      assert.ok(q.answer >= 0 && q.answer < 3);
      assert.ok(q.explanation.length > 10);
    }
  }
});

test('solar dates agree with the 2026 Hong Kong Observatory calendar', () => {
  const dates = getYearTerms(2026);
  const expected = [
    '02-04',
    '02-18',
    '03-05',
    '03-20',
    '04-05',
    '04-20',
    '05-05',
    '05-21',
    '06-05',
    '06-21',
    '07-07',
    '07-23',
    '08-07',
    '08-23',
    '09-07',
    '09-23',
    '10-08',
    '10-23',
    '11-07',
    '11-22',
    '12-07',
    '12-22',
    '01-05',
    '01-20',
  ];
  for (const [index, term] of terms.entries()) {
    assert.equal(
      chinaDate(dates.find((t) => t.id === term.id).at),
      `2026-${expected[index]}`,
      term.name,
    );
  }
});

test('current term respects exact boundaries and the winter year rollover', () => {
  assert.equal(currentTerm(new Date('2026-01-01T00:00:00Z')).id, 'dongzhi');
  const at = getYearTerms(2026).find((t) => t.id === 'lichun').at;
  assert.equal(currentTerm(new Date(at.getTime() - 1)).id, 'dahan');
  assert.equal(currentTerm(at).id, 'lichun');
});

test('picture puzzle always starts unsolved and exchanges are immutable', () => {
  for (const random of [() => 0, () => 0.9999, Math.random]) {
    const tiles = shuffledTiles(9, random);
    assert.equal(isSolved(tiles), false);
    assert.deepEqual(
      [...tiles].sort((a, b) => a - b),
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
    );
  }
  const before = [1, 0, 2, 3, 4, 5, 6, 7, 8];
  assert.equal(isSolved(swapTiles(before, 0, 1)), true);
  assert.deepEqual(before, [1, 0, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(swapTiles(before, -1, 1), before);
});

test('progress tolerates unavailable storage and malformed saved data', () => {
  assert.deepEqual(
    loadProgress({
      getItem() {
        throw Error('blocked');
      },
    }),
    {},
  );
  for (const text of [
    'oops',
    'null',
    '[]',
    '{"invented":{"quiz":true}}',
    '{"lichun":{"quiz":"yes","puzzle":false}}',
  ]) {
    assert.deepEqual(loadProgress({ getItem: () => text }), {});
  }
  assert.deepEqual(loadProgress({ getItem: () => '{"lichun":{"quiz":true,"puzzle":false}}' }), {
    lichun: { quiz: true, puzzle: false },
  });
});

test('a term earns its seal after both activities, replay cannot erase progress', () => {
  const first = recordActivity({}, 'lichun', 'quiz');
  assert.deepEqual(first.lichun, { quiz: true, puzzle: false });
  const second = recordActivity(first, 'lichun', 'puzzle');
  assert.deepEqual(second.lichun, { quiz: true, puzzle: true });
  assert.deepEqual(recordActivity(second, 'lichun', 'quiz'), second);
  assert.deepEqual(recordActivity(second, 'unknown', 'quiz'), second);
});
