import { translate } from './language.js';

// Keep source text per DOM node so switching language never rebuilds game state or focus.
export function createLocalizer(state) {
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const decorative =
    '.brand-seal, .vertical-seal, .outline-seal, .stamp, .result-seal, .small-number';
  const ignored = `${decorative}, .language-switch, .text-language-toggle, script, style, svg`;
  const sourceText = (node) => {
    const previous = textSources.get(node);
    return previous && node.nodeValue === previous.output ? previous.source : node.nodeValue;
  };
  const originalText = (element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let text = '';
    while (walker.nextNode()) {
      if (!walker.currentNode.parentElement.closest('.text-language-toggle'))
        text += sourceText(walker.currentNode);
    }
    return text.trim();
  };
  const languageOf = (element) => {
    const block = element.closest('[data-language-key]');
    return block ? state.languageFor(block.dataset.languageKey) : state.global;
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
      if (element.matches('.quiz-option-label')) element.closest('button').after(control);
      else element.append(control);
    }

    for (const element of root.querySelectorAll('[data-language-key]')) {
      element.lang = state.languageFor(element.dataset.languageKey) === 'en' ? 'en' : 'zh-CN';
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest(ignored)) continue;
      const source = sourceText(node);
      const output = translate(source, languageOf(node.parentElement));
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
        const output = translate(source, languageOf(element));
        element.setAttribute(name, output);
        records.set(name, { source, output });
      }
    }
    for (const control of root.querySelectorAll('[data-local-language]')) {
      const english = state.languageFor(control.dataset.localLanguage) === 'en';
      control.dataset.label = english ? '中' : 'EN';
      control.setAttribute(
        'aria-label',
        english ? 'Show this text in Chinese' : '仅将此段切换为英文',
      );
      control.title = english ? 'Only this text → 中文' : '仅此段 → English';
      control.lang = english ? 'zh-CN' : 'en';
    }
    for (const control of root.querySelectorAll('[data-language]')) {
      control.setAttribute('aria-pressed', String(control.dataset.language === state.global));
    }
  }
  return { apply };
}
