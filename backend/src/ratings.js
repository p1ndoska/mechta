// Рейтинг гостиницы с Яндекс и Google Карт. Берётся со страниц карт и кэшируется,
// при ошибке отдаются последние известные значения.
const YANDEX_URL = 'https://yandex.by/maps/org/mechta/229717143366/';
// Официальный виджет отзывов Яндекса: в отличие от страницы карт, не просит капчу
const YANDEX_WIDGET_URL = 'https://yandex.ru/maps-reviews-widget/229717143366?comments';
const GOOGLE_PLACE_ID = '0x47210e4c68c52d35:0xadf971a8c83f259a';
const GOOGLE_CID = BigInt('0xadf971a8c83f259a').toString();
const GOOGLE_URL = `https://www.google.com/maps?cid=${GOOGLE_CID}&hl=ru`;

const CACHE_MS = 6 * 60 * 60 * 1000;
const RETRY_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 10000;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
  'Accept-Language': 'ru',
};

let cache = {
  yandex: { rating: 5.0, ratings: 255, reviews: 123, url: YANDEX_URL },
  google: { rating: 4.6, ratings: 56, url: GOOGLE_URL },
  updatedAt: null,
};
let nextUpdate = 0;
let pending = null;

async function getText(url) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
}

async function fetchYandex() {
  const html = await getText(YANDEX_WIDGET_URL);
  const rating = html.match(/mini-badge__stars-count">\s*(\d+[,.]\d+)/);
  const counts = html.match(/(\d+)\s+отзыв[а-я]*\s*•\s*(\d+)\s+оцен/);
  if (!rating || !counts) throw new Error('Яндекс: рейтинг не найден в виджете');
  return {
    rating: Number(rating[1].replace(',', '.')),
    ratings: Number(counts[2]),
    reviews: Number(counts[1]),
    url: YANDEX_URL,
  };
}

async function fetchGoogle() {
  const html = await getText(GOOGLE_URL);
  const link = html.match(/href="(\/maps\/preview\/place[^"]+)"/);
  if (!link) throw new Error('Google: не найдена ссылка на данные места');
  const data = await getText(`https://www.google.com${link[1].replace(/&amp;/g, '&')}`);
  const id = GOOGLE_PLACE_ID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`null,(\\d(?:\\.\\d+)?),(\\d+)\\],null,null,null,null,\\[null,null,[\\d.-]+,[\\d.-]+\\],"${id}"`);
  const m = data.match(re);
  if (!m) throw new Error('Google: рейтинг не найден в данных места');
  return { rating: Number(m[1]), ratings: Number(m[2]), url: GOOGLE_URL };
}

async function update() {
  const [yandex, google] = await Promise.allSettled([fetchYandex(), fetchGoogle()]);
  const next = { ...cache };
  let ok = true;
  for (const [key, r] of [['yandex', yandex], ['google', google]]) {
    if (r.status === 'fulfilled') next[key] = r.value;
    else {
      ok = false;
      console.warn('Рейтинг:', r.reason.message);
    }
  }
  if (ok) next.updatedAt = new Date().toISOString();
  cache = next;
  nextUpdate = Date.now() + (ok ? CACHE_MS : RETRY_MS);
}

async function getRatings() {
  if (Date.now() >= nextUpdate) {
    pending ??= update().finally(() => {
      pending = null;
    });
    // Первый запрос ждёт свежие данные, следующие получают кэш сразу
    if (!cache.updatedAt) await pending;
  }
  return cache;
}

module.exports = { getRatings };
