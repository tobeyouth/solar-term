import {
  createIcons,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Check,
  X,
  BookOpen,
  Puzzle,
  Award,
  Download,
  Search,
  Shuffle,
  Eye,
  RotateCcw,
  Leaf,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Sun,
} from 'lucide';
import { terms, seasons, sources } from './data.js';
import {
  currentTerm,
  getYearTerms,
  chinaDate,
  shuffledTiles,
  swapTiles,
  isSolved,
  loadProgress,
  recordActivity,
  PROGRESS_KEY,
} from './core.js';
import './style.css';

const icons = {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Check,
  X,
  BookOpen,
  Puzzle,
  Award,
  Download,
  Search,
  Shuffle,
  Eye,
  RotateCcw,
  Leaf,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Sun,
};
const imageModules = import.meta.glob('./assets/terms/*.webp', {
  eager: true,
  query: '?inline',
  import: 'default',
});
const avatars = import.meta.glob('./assets/avatars/*.webp', {
  eager: true,
  query: '?inline',
  import: 'default',
});
const image = (id) => imageModules[`./assets/terms/${id}.webp`] || '';
const avatar = (id) => avatars[`./assets/avatars/${id}.webp`] || image(id);
const icon = (name, extra = '') =>
  `<i data-lucide="${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}" ${extra}></i>`;
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const two = (value) => String(value).padStart(2, '0');
const app = document.querySelector('#app');
const modal = document.querySelector('#modal');
const year = Math.min(2099, Math.max(1901, Number(chinaDate(new Date()).slice(0, 4))));
const now = currentTerm(
  new Date(Math.min(Date.UTC(2099, 11, 31), Math.max(Date.UTC(1901, 0, 1), Date.now()))),
);
let selected =
  terms.find((t) => t.id === location.hash.slice(1)) || terms.find((t) => t.id === now.id);
let view = 'home';
let seasonFilter = selected.season;
let search = '';
let tab = 'read';
let storage;
try {
  storage = window.localStorage;
} catch {
  /* Progress still works in memory when file storage is blocked. */
}
let progress = loadProgress(storage);
let quiz = { index: 0, answers: [], done: false };
let puzzle = { tiles: shuffledTiles(), selected: null, moves: 0, peek: false };
let toastTimer;
let lastFocus;

const sealed = (term) => progress[term.id]?.quiz && progress[term.id]?.puzzle;
const sealCount = () => terms.filter(sealed).length;
const dateLabel = (term) => {
  const dated = getYearTerms(year).find((t) => t.id === term.id);
  const date = chinaDate(dated.at);
  return `${date.slice(5, 7)}.${date.slice(8, 10)}`;
};
const longDate = (term) => `${year} 年 ${dateLabel(term).replace('.', ' 月 ')} 日`;
const refreshIcons = () =>
  createIcons({ icons, attrs: { 'stroke-width': 1.5, 'aria-hidden': 'true' } });

function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
}

function saveActivity(activity) {
  const hadSeal = sealed(selected);
  progress = recordActivity(progress, selected.id, activity);
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    notify('此浏览器无法保存进度，本次游玩仍可继续。');
  }
  if (!hadSeal && sealed(selected)) notify(`已收集「${selected.name}」印记`);
  updateCounts();
}

function updateCounts() {
  document.querySelectorAll('[data-seal-count]').forEach((node) => {
    node.textContent = two(sealCount());
  });
  document
    .querySelectorAll('[data-term]')
    .forEach((node) =>
      node.classList.toggle('is-sealed', sealed(terms.find((t) => t.id === node.dataset.term))),
    );
  const status = document.querySelector('.activity-progress');
  if (status)
    status.innerHTML = sealed(selected)
      ? `${icon('Award')} 印记已藏`
      : `${Number(!!progress[selected.id]?.quiz) + Number(!!progress[selected.id]?.puzzle)} / 2`;
  for (const activity of ['quiz', 'puzzle']) {
    const button = document.querySelector(`#tab-${activity}`);
    if (button && progress[selected.id]?.[activity] && !button.querySelector('[data-completed]'))
      button.insertAdjacentHTML('beforeend', `<span data-completed>${icon('Check')}</span>`);
  }
  refreshIcons();
}

function render() {
  const season = seasons[selected.season];
  document.documentElement.style.setProperty('--season', season.color);
  document.title = `${view === 'home' ? selected.name : view === 'atlas' ? '节气图鉴' : '我的印记'} · 岁时`;
  app.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="#${now.id}" data-action="today" aria-label="岁时，回到当下节气"><span class="brand-seal">岁<br>时</span><span class="brand-word">岁时<span>二十四节气</span></span></a>
        <nav aria-label="主导航">
          ${[
            ['home', '漫游四季'],
            ['atlas', '节气图鉴'],
            ['collection', '我的印记'],
          ]
            .map(
              ([id, name]) =>
                `<button class="nav-link ${view === id ? 'active' : ''}" data-view="${id}" ${view === id ? 'aria-current="page"' : ''}>${name}${id === 'collection' ? `<span class="nav-count" data-seal-count>${two(sealCount())}</span>` : ''}</button>`,
            )
            .join('')}
        </nav>
        <button class="today-button" data-action="today">${icon('Sun')}<span>此刻 · ${now.name}</span></button>
      </div>
    </header>
    <main id="main" tabindex="-1">${view === 'home' ? renderHome() : view === 'atlas' ? renderAtlas() : renderCollection()}</main>
    <footer class="site-footer"><a href="#${now.id}" data-action="today" class="footer-brand">岁时<span>顺时而行，与自然相逢</span></a><span class="footer-cycle">春生 · 夏长 · 秋收 · 冬藏</span><button class="text-button" data-action="sources">资料与创作 ${icon('ArrowUpRight')}</button></footer>`;
  refreshIcons();
}

function renderHome() {
  const season = seasons[selected.season];
  return `
    <section class="hero season-${selected.season}" aria-labelledby="hero-title">
      ${image(selected.id) ? `<img class="hero-art" src="${image(selected.id)}" alt="${selected.name}山水插画：${selected.motifs.join('、')}" fetchpriority="high">` : ''}
      <div class="hero-inner">
        <div class="hero-copy">
          <div class="eyebrow"><span class="tiny-line"></span>${season.title} · 第 ${['一', '二', '三', '四', '五', '六'][selected.index % 6]} 节气 <span class="hero-number">${two(selected.index + 1)} / 24</span></div>
          <div class="hero-name"><h1 id="hero-title">${selected.name}</h1><span class="vertical-seal">${season.title}</span></div>
          <div class="pinyin">${selected.pinyin}</div>
          <p class="hero-tagline">${selected.tagline}</p>
          <div class="hero-date">${icon('CalendarDays')}<span>${longDate(selected)}</span><span class="date-note">交节</span></div>
          <button class="primary-button" data-action="explore">走进${selected.name}${icon('ArrowRight')}</button>
        </div>
        <div class="hero-aside"><span>二十四节气</span><span>一岁一相逢</span></div>
        <div class="hero-controls"><span>${season.english} <b>${two(selected.index + 1)}</b></span><button class="icon-button" data-action="previous" aria-label="上一个节气" title="上一个节气">${icon('ArrowLeft')}</button><button class="icon-button" data-action="next" aria-label="下一个节气" title="下一个节气">${icon('ArrowRight')}</button></div>
      </div>
    </section>
    <section class="season-section content-width" aria-labelledby="season-heading">
      <div class="section-heading"><div><div class="eyebrow">四时 · 有序</div><h2 id="season-heading">把日子，过成四季</h2></div><div class="season-tabs" role="group" aria-label="选择季节">${renderSeasonButtons(false)}</div></div>
      <div class="term-strip">${terms
        .filter((t) => t.season === seasonFilter)
        .map(renderTermCard)
        .join('')}</div>
    </section>
    <section class="detail-section" id="detail" aria-labelledby="detail-title">
      <div class="content-width">
        <div class="detail-heading"><div class="detail-title-wrap"><span class="outline-seal">${selected.name}</span><div><div class="eyebrow">节气手札 · ${two(selected.index + 1)}</div><h2 id="detail-title">${selected.name}，${seasons[selected.season].verse}</h2></div></div><button class="icon-button download-button" data-action="download" title="保存节气明信片" aria-label="保存节气明信片">${icon('Download')}</button></div>
        <div class="activity-tabs" role="tablist" aria-label="节气内容">
          ${[
            ['read', 'BookOpen', '读时令'],
            ['quiz', 'Leaf', '问时令'],
            ['puzzle', 'Puzzle', '拼山河'],
          ]
            .map(
              ([id, ic, label]) =>
                `<button role="tab" id="tab-${id}" aria-controls="activity" aria-selected="${tab === id}" tabindex="${tab === id ? 0 : -1}" class="activity-tab ${tab === id ? 'active' : ''}" data-tab="${id}">${icon(ic)}${label}${progress[selected.id]?.[id] ? `<span data-completed>${icon('Check')}</span>` : ''}</button>`,
            )
            .join('')}
          <span class="activity-progress">${sealed(selected) ? `${icon('Award')} 印记已藏` : `${Number(!!progress[selected.id]?.quiz) + Number(!!progress[selected.id]?.puzzle)} / 2`}</span>
        </div>
        <div id="activity" role="tabpanel" aria-labelledby="tab-${tab}" tabindex="0">${renderActivity()}</div>
      </div>
    </section>`;
}

function renderSeasonButtons(all = true) {
  return `${all ? `<button data-season="all" aria-pressed="${seasonFilter === 'all'}" class="${seasonFilter === 'all' ? 'active' : ''}">全部</button>` : ''}${seasons.map((s, i) => `<button data-season="${i}" aria-pressed="${seasonFilter === i}" class="${seasonFilter === i ? 'active' : ''}"><span class="season-dot" style="--dot:${s.color}"></span>${s.title}</button>`).join('')}`;
}

function renderTermCard(term) {
  return `<button class="term-card ${selected.id === term.id ? 'selected' : ''} ${sealed(term) ? 'is-sealed' : ''}" data-term="${term.id}" ${selected.id === term.id ? 'aria-current="true"' : ''} aria-label="${term.name}，${dateLabel(term)}，${sealed(term) ? '印记已收集' : '查看节气'}"><div class="term-image">${avatar(term.id) ? `<img src="${avatar(term.id)}" alt="${term.motifs.join('、')}" loading="lazy">` : ''}<span class="card-number">${two(term.index + 1)}</span><span class="card-seal" title="印记已收集">${icon('Check')}</span></div><div class="term-caption"><h3>${term.name}</h3><span>${dateLabel(term)}</span></div><span class="term-subtitle">${term.motifs.slice(0, 2).join(' · ')}</span></button>`;
}

function renderActivity() {
  if (tab === 'quiz') return renderQuiz();
  if (tab === 'puzzle') return renderPuzzle();
  const source = sources[selected.source];
  return `<div class="reading-grid"><article class="reading-main"><div class="eyebrow">天地之间</div><h3>${selected.tagline}</h3><p class="description">${selected.description}</p><div class="reading-facts"><span>太阳黄经 <b>${selected.longitude}°</b></span><span>通常在 <b>${selected.range}</b></span></div><p class="small-note">交节日期按北京时间（UTC+8）计算。物候与习俗因地区而异。</p><a class="source-link" href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title}${icon('ExternalLink')}</a></article><aside class="reading-aside"><div class="custom-block"><span class="small-number">壹</span><div><span class="eyebrow">人间有味</span><h3>${selected.custom}</h3><p>${selected.customDescription}</p></div></div><div class="custom-block"><span class="small-number">贰</span><div><span class="eyebrow">今日小事</span><h3>向自然，借一点闲</h3><p>${selected.observation}</p></div></div><button class="text-button" data-tab="quiz">赴一场节气小考 ${icon('ArrowRight')}</button></aside></div>`;
}

function renderQuiz() {
  if (quiz.done) {
    const score = quiz.answers.filter((a, i) => a === selected.questions[i].answer).length;
    return `<div class="result-panel"><span class="result-seal ${score === 3 ? 'success' : ''}">${score === 3 ? '知时' : '再读'}</span><div class="eyebrow">${selected.name} · 问时令</div><h3>${score === 3 ? '这份时令，你已读懂' : '再与时令，熟悉一点'}</h3><p>答对 ${score} / 3 题${score === 3 ? ' · 问时令已完成' : ''}</p><div class="result-actions"><button class="${score === 3 ? 'secondary-button' : 'primary-button'}" data-action="retry-quiz">${icon('RotateCcw')}再答一次</button>${score === 3 ? `<button class="primary-button" data-tab="puzzle">去拼山河 ${icon('ArrowRight')}</button>` : ''}</div></div>`;
  }
  const question = selected.questions[quiz.index];
  const answer = quiz.answers[quiz.index];
  const answered = answer !== undefined;
  return `<div class="quiz-layout"><div class="quiz-intro"><div class="eyebrow">草木有问 · ${selected.name}</div><h3>你知时节几许？</h3><div class="quiz-counter"><b>${two(quiz.index + 1)}</b><span>/ 03</span></div><div class="quiz-dots">${selected.questions.map((_, i) => `<span class="${i <= quiz.index ? 'filled' : ''}"></span>`).join('')}</div></div><div class="quiz-question"><h4 tabindex="-1">${question.question}</h4><div class="quiz-options">${question.options.map((option, i) => `<button class="quiz-option ${answered && i === question.answer ? 'correct' : ''} ${answered && i === answer && i !== question.answer ? 'incorrect' : ''}" data-answer="${i}" ${answered ? 'disabled' : ''}><span class="option-letter">${['A', 'B', 'C'][i]}</span><span>${option}</span>${answered && i === question.answer ? icon('Check') : answered && i === answer ? icon('X') : ''}</button>`).join('')}</div><div class="answer-feedback" role="status">${answered ? `<strong>${answer === question.answer ? '答对了' : `再记住一点：答案是 ${['A', 'B', 'C'][question.answer]}`}</strong><p>${question.explanation}</p>` : ''}</div><button class="primary-button next-question" data-action="next-question" ${answered ? '' : 'disabled'}>${quiz.index === 2 ? '查看结果' : '下一题'}${icon('ArrowRight')}</button></div></div>`;
}

function renderPuzzle() {
  const done = isSolved(puzzle.tiles);
  return `<div class="puzzle-layout"><div class="puzzle-intro"><div class="eyebrow">九片风景 · ${selected.name}</div><h3>${done ? '山河，归于完整' : '拼一幅时节山河'}</h3><p>${selected.tagline}</p><div class="puzzle-preview">${image(selected.id) ? `<img src="${image(selected.id)}" alt="${selected.name}拼图完整参考图">` : ''}</div><div class="puzzle-stats"><span>落子 <b>${two(puzzle.moves)}</b></span><span>${done ? '已完成' : `${puzzle.tiles.filter((v, i) => v === i).length} / 9 归位`}</span></div><div class="puzzle-tools"><button class="icon-button" data-action="shuffle-puzzle" title="重新打乱" aria-label="重新打乱">${icon('Shuffle')}</button><button class="icon-button ${puzzle.peek ? 'active' : ''}" data-action="peek" aria-label="查看完整原图" aria-pressed="${puzzle.peek}" title="查看完整原图">${icon('Eye')}</button>${done ? `<span class="completed-label">${icon('CheckCircle2')}拼山河已完成</span>` : ''}</div></div><div class="puzzle-board ${done ? 'solved' : ''}" role="group" aria-label="${selected.name}九宫拼图，选择两块交换位置">${puzzle.peek ? `<img class="puzzle-peek" src="${image(selected.id)}" alt="${selected.name}完整原图">` : ''}${puzzle.tiles.map((tile, i) => `<button class="puzzle-tile ${puzzle.selected === i ? 'picked' : ''}" style="background-image:url('${image(selected.id)}');background-position:${(tile % 3) * 50}% ${Math.floor(tile / 3) * 50}%" data-tile="${i}" aria-label="位置 ${i + 1}，图块 ${tile + 1}${tile === i ? '，已归位' : ''}" aria-pressed="${puzzle.selected === i}" title="选择两块交换位置" ${done || puzzle.peek ? 'disabled' : ''}><span>${tile + 1}</span></button>`).join('')}</div></div>`;
}

function renderAtlas() {
  return `<section class="content-width atlas-section"><div class="page-title"><div class="eyebrow">一岁光景 · 二十四相逢</div><h1>节气图鉴</h1><p>顺着草木与山河，走过春夏秋冬。</p></div><div class="atlas-toolbar"><div class="season-tabs" role="group" aria-label="筛选季节">${renderSeasonButtons()}</div><label class="search-field">${icon('Search')}<input type="search" id="term-search" placeholder="寻一个节气" aria-label="搜索节气名称、物候或习俗" value="${esc(search)}"></label></div><div id="atlas-results">${renderAtlasResults()}</div></section>`;
}

function renderAtlasResults() {
  const filtered = terms.filter(
    (t) =>
      (seasonFilter === 'all' || t.season === seasonFilter) &&
      `${t.name}${t.pinyin}${t.motifs.join('')}${t.custom}${t.description}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  return filtered.length
    ? `<div class="atlas-grid">${filtered.map(renderTermCard).join('')}</div><p class="result-count">${filtered.length} / 24 节气 · ${year} 年</p>`
    : `<div class="empty-state">${icon('Search')}<h2>还未寻到这份时令</h2><button class="secondary-button" data-action="clear-search">查看全部节气</button></div>`;
}

function renderCollection() {
  return `<section class="content-width collection-section"><div class="collection-title"><div class="page-title"><div class="eyebrow">走过山河 · 留下印记</div><h1>我的岁时集</h1><p>${sealCount() === 24 ? '二十四番相逢，一整年的风景。' : '与每一份时令，慢慢相识。'}</p></div><div class="collection-counter"><b data-seal-count>${two(sealCount())}</b><span>/ 24<br>节气印记</span></div></div><div class="collection-progress" role="progressbar" aria-valuenow="${sealCount()}" aria-valuemin="0" aria-valuemax="24" aria-label="已收集节气印记"><span style="width:${(sealCount() / 24) * 100}%"></span></div>${seasons
    .map(
      (season, index) =>
        `<section class="seal-season"><h2 style="color:${season.color}">${season.title}<small>${season.english}</small></h2><div class="seal-grid">${terms
          .filter((t) => t.season === index)
          .map(
            (t) =>
              `<button class="seal-item ${sealed(t) ? 'earned' : ''}" data-term="${t.id}" aria-label="${t.name}，${sealed(t) ? '已收集印记' : `${Number(!!progress[t.id]?.quiz) + Number(!!progress[t.id]?.puzzle)} 项互动已完成`}"><span class="stamp">${t.name}</span><span class="seal-status">${sealed(t) ? '已藏' : `${Number(!!progress[t.id]?.quiz) + Number(!!progress[t.id]?.puzzle)} / 2`}</span><span class="seal-mini-status">问时令 ${progress[t.id]?.quiz ? '✓' : '○'} · 拼山河 ${progress[t.id]?.puzzle ? '✓' : '○'}</span></button>`,
          )
          .join('')}</div></section>`,
    )
    .join('')}</section>`;
}

function renderActivityOnly() {
  document.querySelector('#activity').innerHTML = renderActivity();
  refreshIcons();
}

function selectTerm(id, scroll = true) {
  const term = terms.find((t) => t.id === id);
  if (!term) return;
  selected = term;
  view = 'home';
  seasonFilter = term.season;
  tab = 'read';
  quiz = { index: 0, answers: [], done: false };
  puzzle = { tiles: shuffledTiles(), selected: null, moves: 0, peek: false };
  try {
    history.replaceState(null, '', `#${id}`);
  } catch {
    /* Some local-file browsers restrict History. */
  }
  render();
  if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
}

function switchTab(next) {
  tab = next;
  document.querySelectorAll('[role="tab"]').forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  document.querySelector('#activity').setAttribute('aria-labelledby', `tab-${tab}`);
  renderActivityOnly();
}

function showSources() {
  lastFocus = document.activeElement;
  modal.innerHTML = `<div class="modal-top"><div><span class="eyebrow">岁时 · 编者记</span><h2 id="modal-title">资料与创作</h2></div><button class="icon-button" data-action="close-modal" aria-label="关闭" title="关闭">${icon('X')}</button></div><p>二十四节气依太阳在黄道上的位置划分，每相隔 15° 为一个节气。文字参考以下公开资料重新编写，物候与习俗保留地域差异。</p><p>交节时刻由 Astronomy Engine 在本地计算，日期统一使用北京时间（UTC+8），按日展示；2026 年日期已与香港天文台年历核对。插画为 AI 辅助创作的时令意象，不代表所有地区的实景。</p><div class="source-list">${sources.map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer"><span><b>${s.title}</b><small>${s.note}</small></span>${icon('ArrowUpRight')}</a>`).join('')}</div><p class="small-note">阅读与游玩均可离线完成。外部资料链接需要网络。游玩记录保存在当前浏览器；移动 HTML 文件或更换浏览器后，记录可能不会随之迁移。</p>`;
  refreshIcons();
  modal.showModal();
}

async function downloadPostcard() {
  if (!image(selected.id)) {
    notify('插画尚未载入。');
    return;
  }
  const term = selected;
  const button = document.querySelector('[data-action="download"]');
  button.disabled = true;
  try {
    const art = new Image();
    art.src = image(term.id);
    await art.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1500;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f9faf7';
    ctx.fillRect(0, 0, 1200, 1500);
    ctx.drawImage(art, 0, 0, 1200, 800);
    ctx.fillStyle = '#263e34';
    ctx.font = '104px "Songti SC", SimSun, serif';
    ctx.fillText(term.name, 90, 970);
    ctx.fillStyle = '#69766c';
    ctx.font = '26px serif';
    ctx.fillText(`${term.pinyin}   /   ${longDate(term)}`, 94, 1028);
    ctx.fillStyle = '#344c40';
    ctx.font = '36px "Songti SC", serif';
    ctx.fillText(term.tagline, 94, 1115);
    ctx.fillStyle = '#59635d';
    ctx.font = '25px "Songti SC", serif';
    const chars = [...term.description];
    for (let offset = 0, line = 0; offset < chars.length; line += 1) {
      let end = Math.min(offset + 38, chars.length);
      while (/^[，。！？；：、）》」』】]$/.test(chars[end] || '')) end += 1;
      ctx.fillText(chars.slice(offset, end).join(''), 94, 1188 + line * 42);
      offset = end;
    }
    ctx.strokeStyle = '#bdc8bf';
    ctx.beginPath();
    ctx.moveTo(94, 1380);
    ctx.lineTo(1106, 1380);
    ctx.stroke();
    ctx.fillStyle = '#ab4d3b';
    ctx.font = '28px "Songti SC", serif';
    ctx.fillText('岁时 · 二十四节气', 94, 1436);
    ctx.fillStyle = '#68726a';
    ctx.font = '22px serif';
    ctx.fillText(`${two(term.index + 1)} / 24`, 1012, 1436);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Export failed');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `岁时-${term.name}-${year}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    notify(`「${term.name}」明信片已生成`);
  } catch {
    notify('明信片未能保存，请重试。');
  } finally {
    button.disabled = false;
  }
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('button, a[data-action]');
  if (!button || button.disabled) return;
  if (button.dataset.view) {
    view = button.dataset.view;
    if (view === 'atlas') seasonFilter = 'all';
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else if (button.dataset.term) selectTerm(button.dataset.term);
  else if (button.dataset.season !== undefined) {
    seasonFilter = button.dataset.season === 'all' ? 'all' : Number(button.dataset.season);
    const scroll = window.scrollY;
    render();
    window.scrollTo({ top: scroll, behavior: 'instant' });
    document.querySelector(`[data-season="${seasonFilter}"]`)?.focus({ preventScroll: true });
  } else if (button.dataset.tab) switchTab(button.dataset.tab);
  else if (button.dataset.answer !== undefined && quiz.answers[quiz.index] === undefined) {
    quiz.answers[quiz.index] = Number(button.dataset.answer);
    renderActivityOnly();
    document.querySelector('[data-action="next-question"]').focus({ preventScroll: true });
  } else if (button.dataset.tile !== undefined) {
    const tile = Number(button.dataset.tile);
    if (puzzle.selected === null) puzzle.selected = tile;
    else if (puzzle.selected === tile) puzzle.selected = null;
    else {
      puzzle.tiles = swapTiles(puzzle.tiles, puzzle.selected, tile);
      puzzle.moves += 1;
      puzzle.selected = null;
      if (isSolved(puzzle.tiles)) saveActivity('puzzle');
    }
    renderActivityOnly();
    document.querySelector(`[data-tile="${tile}"]`)?.focus({ preventScroll: true });
  } else {
    const action = button.dataset.action;
    if (action === 'today') {
      event.preventDefault();
      selectTerm(now.id);
    }
    if (action === 'explore') {
      document.querySelector('#detail').scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    }
    if (action === 'next' || action === 'previous')
      selectTerm(terms[(selected.index + (action === 'next' ? 1 : 23)) % 24].id);
    if (action === 'next-question') {
      if (quiz.answers[quiz.index] === undefined) return;
      if (quiz.index < 2) quiz.index += 1;
      else {
        quiz.done = true;
        if (quiz.answers.every((a, i) => a === selected.questions[i].answer)) saveActivity('quiz');
      }
      renderActivityOnly();
      document.querySelector('.quiz-question h4')?.focus({ preventScroll: true });
    }
    if (action === 'retry-quiz') {
      quiz = { index: 0, answers: [], done: false };
      renderActivityOnly();
    }
    if (action === 'shuffle-puzzle') {
      puzzle = { tiles: shuffledTiles(), selected: null, moves: 0, peek: false };
      renderActivityOnly();
    }
    if (action === 'peek') {
      puzzle.peek = !puzzle.peek;
      renderActivityOnly();
      document.querySelector('[data-action="peek"]').focus({ preventScroll: true });
    }
    if (action === 'sources') showSources();
    if (action === 'close-modal') modal.close();
    if (action === 'download') downloadPostcard();
    if (action === 'clear-search') {
      search = '';
      seasonFilter = 'all';
      render();
      document.querySelector('#term-search').focus();
    }
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'term-search') {
    search = event.target.value;
    document.querySelector('#atlas-results').innerHTML = renderAtlasResults();
    refreshIcons();
  }
});

document.addEventListener('keydown', (event) => {
  if (
    event.target.matches('[role="tab"]') &&
    ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
  ) {
    event.preventDefault();
    const tabs = ['read', 'quiz', 'puzzle'];
    const next =
      event.key === 'Home'
        ? 'read'
        : event.key === 'End'
          ? 'puzzle'
          : tabs[(tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : 2)) % 3];
    switchTab(next);
    document.querySelector(`#tab-${next}`).focus();
  }
});
modal.addEventListener('close', () => lastFocus?.focus());
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    const rect = modal.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      modal.close();
  }
});
window.addEventListener('hashchange', () => {
  if (terms.some((t) => t.id === location.hash.slice(1))) selectTerm(location.hash.slice(1));
});
render();
