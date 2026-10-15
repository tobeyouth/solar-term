import { terms, sources, seasons } from './data.js';
import { englishTerms } from './data.en.js';

const dictionary = new Map();
const add = (zh, en) => dictionary.set(zh, en);
for (const term of terms) {
  const en = englishTerms[term.id];
  for (const field of [
    'name',
    'tagline',
    'description',
    'custom',
    'customDescription',
    'observation',
  ])
    add(term[field], en[field]);
  term.motifs.forEach((motif, i) => add(motif, en.motifs[i]));
  term.questions.forEach((question, i) => {
    add(question.question, en.questions[i].question);
    add(question.explanation, en.questions[i].explanation);
    question.options.forEach((option, j) => add(option, en.questions[i].options[j]));
  });
}

const sourceTranslations = [
  [
    'Hong Kong Observatory · The 24 Solar Terms',
    'Solar longitude, term sequence and the astronomy of equinoxes and solstices.',
  ],
  [
    'China Agricultural Museum · The 24 Solar Terms',
    'Term meanings, farming and seasonal observations.',
  ],
  [
    'China Meteorological Administration · Solar Terms and Weather',
    'Connections between temperature, rain, sunshine and seasonal life.',
  ],
  [
    'China Intangible Cultural Heritage · Solar Terms and Customs',
    'Seasonal festivals and regional traditions.',
  ],
  ['Hong Kong Observatory · 2026 Calendar', 'Reference for checking the 2026 solar-term dates.'],
  ['China Meteorological Administration · Grain Rain', 'Spring rainfall and grain sowing.'],
  [
    'China Meteorological News · Grain Full',
    'Filling wheat grains in the north and rising rivers in the south.',
  ],
  ['Chinese Museums Association · Grain in Ear', 'Harvesting and sowing awned crops.'],
  ['China Meteorological News · White Dew', 'Autumn coolness, dew and regional autumn rain.'],
  ['China Meteorological News · Cold Dew', 'Late-autumn scenery and winter wheat sowing.'],
  ['China Meteorological News · Frost’s Descent', 'Regional differences in first-frost dates.'],
  [
    'China Meteorological News · Major Snow',
    'The difference between a solar term and actual snowfall.',
  ],
  [
    'China Meteorological News · Minor Cold',
    'Comparing temperatures around Minor Cold and Major Cold.',
  ],
  [
    'China Intangible Cultural Heritage · Beginning of Spring',
    'Welcoming spring, encouraging farming and seasonal traditions.',
  ],
  [
    'China Intangible Cultural Heritage · Beginning of Summer',
    'Fresh foods, egg games and welcoming summer.',
  ],
  ['China Meteorological News · End of Heat', 'Retreating heat and regional differences.'],
  ['China Meteorological News · Minor Snow', 'Winter temperatures and changes in precipitation.'],
  [
    'China Meteorological News · Beginning of Autumn',
    'Lingering heat and the custom of “biting into autumn”.',
  ],
  [
    'China Intangible Cultural Heritage · Spring Equinox',
    'The meaning of the equinox and spring kites.',
  ],
  [
    'China Intangible Cultural Heritage · Major Heat',
    'Summer heat, thunderstorms and seasonal life.',
  ],
  [
    'China Intangible Cultural Heritage · Pure Brightness',
    'Qingming weather and seasonal observations.',
  ],
];
sources.forEach((source, i) => {
  add(source.title, sourceTranslations[i][0]);
  add(source.note, sourceTranslations[i][1]);
});

const ui = {
  岁时: 'Suishi',
  二十四节气: '24 Solar Terms',
  跳到内容: 'Skip to content',
  '岁时，回到当下节气': 'Suishi, return to the current solar term',
  主导航: 'Main navigation',
  漫游四季: 'Explore',
  节气图鉴: 'Solar Term Atlas',
  我的印记: 'My Seals',
  '顺时而行，与自然相逢': 'Follow the seasons. Meet the natural world.',
  资料与创作: 'Sources & Credits',
  春生: 'Spring',
  夏长: 'Summer',
  秋收: 'Autumn',
  冬藏: 'Winter',
  '风有信，花有期。': 'Breezes return, and flowers keep their promise.',
  '听蝉鸣，看荷开。': 'Listen to cicadas. Watch the lotuses open.',
  '山河晚，草木秋。': 'The hills grow quiet; the leaves turn to autumn.',
  '候雪落，盼春归。': 'Await the snow, and the return of spring.',
  交节: 'Begins',
  一岁一相逢: 'A yearly reunion',
  上一个节气: 'Previous solar term',
  下一个节气: 'Next solar term',
  '四时 · 有序': 'The rhythm of four seasons',
  '把日子，过成四季': 'Live with the seasons',
  选择季节: 'Choose a season',
  节气手札: 'Seasonal notes',
  保存节气明信片: 'Save a seasonal postcard',
  节气内容: 'Seasonal activities',
  读时令: 'Read',
  问时令: 'Quiz',
  拼山河: 'Puzzle',
  印记已藏: 'Seal collected',
  全部: 'All',
  印记已收集: 'Seal collected',
  查看节气: 'Explore this term',
  天地之间: 'Between earth and sky',
  太阳黄经: 'Solar longitude',
  通常在: 'Usually around',
  '交节日期按北京时间（UTC+8）计算。物候与习俗因地区而异。':
    'Dates use Beijing time (UTC+8). Seasonal signs and customs vary by region.',
  人间有味: 'Seasonal traditions',
  今日小事: 'A small observation',
  '向自然，借一点闲': 'Take a moment with nature',
  赴一场节气小考: 'Try the seasonal quiz',
  '这份时令，你已读懂': 'You know this season well',
  '再与时令，熟悉一点': 'Get to know the season a little better',
  再答一次: 'Try again',
  去拼山河: 'Try the puzzle',
  草木有问: 'Questions from nature',
  '你知时节几许？': 'How well do you know the season?',
  答对了: 'Correct',
  查看结果: 'See results',
  下一题: 'Next question',
  九片风景: 'Nine pieces of a landscape',
  '山河，归于完整': 'The landscape is complete',
  拼一幅时节山河: 'Piece together the season',
  落子: 'Moves',
  已完成: 'Complete',
  重新打乱: 'Shuffle again',
  查看完整原图: 'Show the full picture',
  拼山河已完成: 'Puzzle complete',
  选择两块交换位置: 'Select two tiles to swap',
  '一岁光景 · 二十四相逢': 'A year of light · 24 encounters',
  '顺着草木与山河，走过春夏秋冬。': 'Follow plants and landscapes through the four seasons.',
  筛选季节: 'Filter by season',
  寻一个节气: 'Find a solar term',
  '搜索节气名称、物候或习俗': 'Search terms, seasonal signs or customs',
  还未寻到这份时令: 'No matching solar term',
  查看全部节气: 'Show all solar terms',
  '走过山河 · 留下印记': 'Explore the seasons · Collect memories',
  我的岁时集: 'My Seasonal Collection',
  '二十四番相逢，一整年的风景。': 'Twenty-four encounters. A whole year of landscapes.',
  '与每一份时令，慢慢相识。': 'Get to know each season, one encounter at a time.',
  节气印记: 'Seasonal seals',
  已收集节气印记: 'Collected seasonal seals',
  已藏: 'Collected',
  已收集印记: 'Seal collected',
  '岁时 · 编者记': 'Suishi · Editor’s notes',
  关闭: 'Close',
  '二十四节气依太阳在黄道上的位置划分，每相隔 15° 为一个节气。文字参考以下公开资料重新编写，物候与习俗保留地域差异。':
    'The 24 solar terms divide the Sun’s path into intervals of 15°. These texts were written using the public sources below and preserve regional differences in seasonal observations and customs.',
  '交节时刻由 Astronomy Engine 在本地计算，日期统一使用北京时间（UTC+8），按日展示；2026 年日期已与香港天文台年历核对。插画为 AI 辅助创作的时令意象，不代表所有地区的实景。':
    'Astronomy Engine calculates solar-term moments locally. Dates are shown by day in Beijing time (UTC+8); the 2026 dates were checked against the Hong Kong Observatory calendar. The AI-assisted illustrations evoke the seasons rather than document scenery in every region.',
  '下载单文件离线版后，阅读与游玩不需要网络。外部资料链接需要网络。游玩记录保存在当前浏览器；移动 HTML 文件或更换浏览器后，记录可能不会随之迁移。':
    'The single-file offline edition works without a network connection. External source links need internet access. Progress is saved in this browser and may not follow you if you move the HTML file or change browsers.',
  '此浏览器无法保存进度，本次游玩仍可继续。':
    'This browser cannot save progress. You can keep playing in this session.',
  '插画尚未载入。': 'The illustration has not loaded yet.',
  '明信片未能保存，请重试。': 'The postcard could not be saved. Please try again.',
};
Object.entries(ui).forEach(([zh, en]) => add(zh, en));
for (const term of terms) {
  add(
    `${term.name}，${seasons[term.season].verse}`,
    `${englishTerms[term.id].name} — ${ui[seasons[term.season].verse]}`,
  );
}

function english(text) {
  if (dictionary.has(text)) return dictionary.get(text);
  if (!/[\u3400-\u9fff]/.test(text)) return text;
  let match;
  if ((match = text.match(/^(\d+) 年 (\d+) 月 (\d+) 日$/)))
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(+match[1], +match[2] - 1, +match[3])));
  if ((match = text.match(/^第 ([一二三四五六]) 节气$/)))
    return `Term ${'一二三四五六'.indexOf(match[1]) + 1}`;
  if ((match = text.match(/^此刻 · (.+)$/))) return `Now · ${english(match[1])}`;
  if ((match = text.match(/^走进(.+)$/))) return `Explore ${english(match[1])}`;
  if ((match = text.match(/^答对 (\d+) \/ 3 题(.*)$/)))
    return `${match[1]} / 3 correct${match[2] ? ' · Quiz complete' : ''}`;
  if ((match = text.match(/^再记住一点：答案是 ([ABC])$/)))
    return `Remember: the answer is ${match[1]}`;
  if ((match = text.match(/^(\d+) \/ 9 归位$/))) return `${match[1]} / 9 in place`;
  if ((match = text.match(/^(\d+) \/ 24 节气 · (\d+) 年$/)))
    return `${match[1]} / 24 terms · ${match[2]}`;
  if ((match = text.match(/^(\d+) 项互动已完成$/))) return `${match[1]} activities completed`;
  if ((match = text.match(/^位置 (\d+)，图块 (\d+)(，已归位)?$/)))
    return `Position ${match[1]}, tile ${match[2]}${match[3] ? ', in place' : ''}`;
  if ((match = text.match(/^(.+)九宫拼图，选择两块交换位置$/)))
    return `${english(match[1])} puzzle: select two tiles to swap`;
  if ((match = text.match(/^(.+)山水插画：(.+)$/)))
    return `${english(match[1])} landscape: ${english(match[2])}`;
  if ((match = text.match(/^(.+)(拼图完整参考图|完整原图)$/)))
    return `${english(match[1])}: full picture`;
  if ((match = text.match(/^已收集「(.+)」印记$/))) return `${english(match[1])} seal collected`;
  if ((match = text.match(/^「(.+)」明信片已生成$/)))
    return `${english(match[1])} postcard created`;
  if ((match = text.match(/^问时令 ([✓○]) · 拼山河 ([✓○])$/)))
    return `Quiz ${match[1]} · Puzzle ${match[2]}`;
  for (const [separator, replacement] of [
    [' · ', ' · '],
    ['，', ', '],
    ['、', ', '],
  ]) {
    if (text.includes(separator)) return text.split(separator).map(english).join(replacement);
  }
  return text;
}

export function translate(text, language = 'zh') {
  if (language !== 'en') return text;
  return text.replace(/\S(?:[\s\S]*\S)?/, (content) => english(content));
}

export const LANGUAGE_KEY = 'suishi.language.v1';
export function createLanguageState(storage) {
  let global = 'zh';
  let overrides = new Map();
  try {
    const saved = JSON.parse(storage?.getItem(LANGUAGE_KEY));
    if (saved?.global === 'zh' || saved?.global === 'en') {
      global = saved.global;
      if (
        saved.overrides &&
        typeof saved.overrides === 'object' &&
        !Array.isArray(saved.overrides)
      ) {
        overrides = new Map(
          Object.entries(saved.overrides).filter(([, value]) => value === 'zh' || value === 'en'),
        );
      }
    }
  } catch {
    /* Language switching remains available without storage. */
  }
  const save = () => {
    try {
      storage?.setItem(
        LANGUAGE_KEY,
        JSON.stringify({ global, overrides: Object.fromEntries(overrides) }),
      );
    } catch {
      /* Keep preferences in memory when storage is unavailable. */
    }
  };
  return {
    get global() {
      return global;
    },
    languageFor(key) {
      return overrides.get(key) || global;
    },
    setGlobal(language) {
      if (language !== 'zh' && language !== 'en') return;
      global = language;
      overrides.clear();
      save();
    },
    toggle(key) {
      const next = this.languageFor(key) === 'zh' ? 'en' : 'zh';
      if (next === global) overrides.delete(key);
      else overrides.set(key, next);
      save();
    },
  };
}
