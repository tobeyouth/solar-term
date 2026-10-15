import { translate } from './language.js';

// Keep source text per DOM node so switching language never rebuilds game state or focus.
export function createLocalizer(state) {
  let nextNoteId = 0;
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const decorative =
    '.brand-seal, .vertical-seal, .outline-seal, .stamp, .result-seal, .small-number';
  const ignored = `${decorative}, .language-switch, .text-language-toggle, .text-translation, script, style, svg`;
  const sourceText = (node) => {
    const previous = textSources.get(node);
    return previous && node.nodeValue === previous.output ? previous.source : node.nodeValue;
  };
  const originalText = (element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let text = '';
    while (walker.nextNode()) {
      if (!walker.currentNode.parentElement.closest('.text-language-toggle, .text-translation'))
        text += sourceText(walker.currentNode);
    }
    return text.trim();
  };

  function apply(root, scope) {
    for (const element of root.querySelectorAll('p, h1, h2, h3, h4, .quiz-option-label')) {
      if (element.dataset.languageKey || element.closest(ignored)) continue;
      if (element.closest('button, a') && !element.matches('.quiz-option-label')) continue;
      const source = originalText(element);
      if (!/[\u3400-\u9fff]/.test(source) || translate(source, 'en') === source) continue;
      // The content and location distinguish repeated text in separate parts of a page.
      const key = `${element.closest('dialog') ? 'sources' : scope}:${element.tagName}:${element.parentElement.className.split(' ')[0]}:${element.className}:${source}`;
      element.dataset.languageKey = key;
      const control = document.createElement('button');
      control.type = 'button';
      control.className = 'text-language-toggle';
      control.dataset.localLanguage = key;
      const note = document.createElement('span');
      note.className = 'text-translation';
      note.id = `suishi-translation-${++nextNoteId}`;
      note.hidden = true;
      control.setAttribute('aria-controls', note.id);
      if (element.matches('.quiz-option-label')) element.closest('button').after(control);
      else element.append(control);
      element.append(note);
    }

    for (const element of root.querySelectorAll('[data-language-key]')) {
      element.lang = state.global === 'en' ? 'en' : 'zh-CN';
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest(ignored)) continue;
      const source = sourceText(node);
      const output = translate(source, state.global);
      if (output !== node.nodeValue) node.nodeValue = output;
      textSources.set(node, { source, output });
    }
    for (const element of root.querySelectorAll('[title], [aria-label], [placeholder], [alt]')) {
      if (element.closest('.language-switch, .text-language-toggle')) continue;
      let records = attributeSources.get(element);
      if (!records) {
        records = new Map();
        attributeSources.set(element, records);
      }
      for (const name of ['title', 'aria-label', 'placeholder', 'alt']) {
        if (!element.hasAttribute(name)) continue;
        const value = element.getAttribute(name);
        const previous = records.get(name);
        const source = previous && previous.output === value ? previous.source : value;
        const output = translate(source, state.global);
        element.setAttribute(name, output);
        records.set(name, { source, output });
      }
    }
    for (const control of root.querySelectorAll('[data-local-language]')) {
      const english = state.global === 'en';
      const expanded = state.isTranslationVisible(control.dataset.localLanguage);
      const note = document.getElementById(control.getAttribute('aria-controls'));
      const source = originalText(note.parentElement);
      note.lang = english ? 'zh-CN' : 'en';
      note.hidden = !expanded;
      note.textContent = expanded ? translate(source, english ? 'zh' : 'en') : '';
      control.dataset.label = expanded ? (english ? 'Hide' : '收起') : english ? '中' : 'EN';
      const label = english
        ? expanded
          ? 'Hide Chinese translation'
          : 'Show Chinese translation'
        : expanded
          ? '收起英文译文'
          : '显示英文译文';
      control.setAttribute('aria-label', label);
      control.setAttribute('aria-expanded', String(expanded));
      control.title = label;
      control.lang = english ? 'en' : 'zh-CN';
    }
    for (const control of root.querySelectorAll('[data-language]')) {
      control.setAttribute('aria-pressed', String(control.dataset.language === state.global));
    }
  }
  return { apply };
}
