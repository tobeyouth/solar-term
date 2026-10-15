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

test('local language overrides are independent; global selection unifies every block', () => {
  const state = createLanguageState();
  assert.equal(state.global, 'zh');
  state.toggle('lichun.description');
  assert.equal(state.languageFor('lichun.description'), 'en');
  assert.equal(state.languageFor('lichun.custom'), 'zh');
  state.setGlobal('en');
  state.toggle('lichun.custom');
  assert.equal(state.languageFor('lichun.description'), 'en');
  assert.equal(state.languageFor('lichun.custom'), 'zh');
  state.setGlobal('en');
  assert.equal(state.languageFor('lichun.custom'), 'en');
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
  assert.equal(restored.languageFor('hanlu.description'), 'zh');
  for (const malformed of ['oops', 'null', '[]', '{"global":"fr","overrides":{"a":"bad"}}']) {
    value = malformed;
    assert.equal(createLanguageState(storage).languageFor('a'), 'zh');
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
  assert.equal(blocked.languageFor('a'), 'zh');
});
