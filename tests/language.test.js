import test from 'node:test';
import assert from 'node:assert/strict';
import { terms } from '../src/data.js';
import { englishTerms } from '../src/data.en.js';
import { createLanguageState, translate } from '../src/language.js';

test('all 24 terms and all 72 questions have complete English content', () => {
  assert.equal(Object.keys(englishTerms).length, 24);
  for (const term of terms) {
    const en = englishTerms[term.id];
    for (const field of [
      'name',
      'tagline',
      'description',
      'custom',
      'customDescription',
      'observation',
    ]) {
      assert.ok(en[field]?.length > 0, `${term.id}.${field}`);
      assert.ok(!/[\u3400-\u9fff]/.test(en[field]), `${term.id}.${field} must be English`);
      assert.equal(translate(term[field], 'en'), en[field]);
    }
    assert.equal(en.motifs.length, term.motifs.length);
    assert.equal(en.questions.length, 3);
    en.questions.forEach((q, index) => {
      assert.equal(q.options.length, term.questions[index].options.length);
      assert.ok(q.question && q.explanation);
      assert.ok(q.options.every((option) => typeof option === 'string' && option.length));
      assert.equal(translate(term.questions[index].question, 'en'), q.question);
    });
  }
});

test('translation notes are independent; global selection closes open notes', () => {
  const state = createLanguageState();
  assert.equal(state.global, 'zh');
  state.toggle('lichun.description');
  assert.equal(state.isTranslationVisible('lichun.description'), true);
  assert.equal(state.isTranslationVisible('lichun.custom'), false);
  state.setGlobal('en');
  state.toggle('lichun.custom');
  assert.equal(state.isTranslationVisible('lichun.description'), false);
  assert.equal(state.isTranslationVisible('lichun.custom'), true);
  state.setGlobal('en');
  assert.equal(state.isTranslationVisible('lichun.custom'), false);
});

test('language preferences persist and tolerate blocked or malformed storage', () => {
  let value;
  const storage = {
    getItem: () => value,
    setItem: (_, next) => {
      value = next;
    },
  };
  const state = createLanguageState(storage);
  state.setGlobal('en');
  state.toggle('hanlu.description');
  const restored = createLanguageState(storage);
  assert.equal(restored.global, 'en');
  assert.equal(restored.isTranslationVisible('hanlu.description'), true);
  for (const malformed of ['oops', 'null', '[]', '{"global":"fr","overrides":{"a":"bad"}}']) {
    value = malformed;
    assert.equal(createLanguageState(storage).isTranslationVisible('a'), false);
  }
  const blocked = createLanguageState({
    getItem() {
      throw Error('blocked');
    },
    setItem() {
      throw Error('blocked');
    },
  });
  blocked.setGlobal('en');
  blocked.toggle('a');
  assert.equal(blocked.isTranslationVisible('a'), true);
});

test('old local language choices become open translation notes', () => {
  const state = createLanguageState({
    getItem: () => JSON.stringify({ global: 'en', overrides: { description: 'zh', custom: 'en' } }),
  });
  assert.equal(state.global, 'en');
  assert.equal(state.isTranslationVisible('description'), true);
  assert.equal(state.isTranslationVisible('custom'), false);
  state.toggle('description');
  assert.equal(state.isTranslationVisible('description'), false);
});
