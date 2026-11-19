import { useEffect, useState } from 'react';

// Показываются, пока не пришёл ответ /api/ratings или если backend недоступен
const fallback = {
  yandex: { rating: 5.0, ratings: 255, reviews: 123, url: 'https://yandex.by/maps/org/mechta/229717143366/' },
  google: { rating: 4.6, ratings: 56, url: 'https://www.google.com/maps?cid=12536176007490512282&hl=ru' },
};

const texts = {
  ru: {
    locale: 'ru-RU',
    rating: 'По рейтингу',
    yandex: 'Яндекс Карты',
    google: 'Google Maps',
    ratings: (n) => `>${n} оценок`,
    reviews: (n) => `и более ${n} отзывов`,
  },
  en: {
    locale: 'en-US',
    rating: 'Rating on',
    yandex: 'Yandex Maps',
    google: 'Google Maps',
    ratings: (n) => `>${n} ratings`,
    reviews: (n) => `and over ${n} reviews`,
  },
  be: {
    locale: 'be-BY',
    rating: 'Па рэйтынгу',
    yandex: 'Яндекс Карты',
    google: 'Google Maps',
    ratings: (n) => `>${n} ацэнак`,
    reviews: (n) => `і больш за ${n} водгукаў`,
  },
};

// 311 -> 300, 56 -> 50
function roundDown(n) {
  const step = n >= 100 ? 100 : 10;
  return Math.max(Math.floor(n / step) * step, 0);
}

function Star() {
  return (
    <svg className="size-[26px] fill-rating-star" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 17.27l4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.72 3.67-3.18c.67-.58.31-1.68-.57-1.75l-4.83-.41-1.89-4.46c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18-1.1 4.72c-.2.86.73 1.54 1.49 1.08l4.15-2.5z" />
    </svg>
  );
}

const item =
  'group flex flex-col items-center justify-center gap-2 px-4 py-1.5 text-center not-first:border-l not-first:border-white/18 max-md:px-0 max-md:py-3.5 max-md:not-first:border-t max-md:not-first:border-l-0';
const value = 'inline-flex items-center gap-1.5 font-semibold leading-none';
const caption = 'max-w-40 text-[12px] leading-[1.5] text-cream-text';
const source = 'text-gold group-hover:underline';

export default function Ratings({ lang }) {
  const [data, setData] = useState(fallback);
  const t = texts[lang];

  useEffect(() => {
    fetch('/api/ratings')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
      .then(setData)
      .catch(() => {});
  }, []);

  const format = (n) => n.toLocaleString(t.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const totalRatings = data.yandex.ratings + data.google.ratings;

  return (
    <section className="bg-olive text-white">
      <div className="mx-auto box-content grid max-w-content grid-cols-3 px-6 py-[18px] max-md:grid-cols-1 max-md:py-2">
        <a className={item} href={data.yandex.url} target="_blank" rel="noreferrer">
          <span className={`${value} text-[26px]`}>
            {format(data.yandex.rating)} <Star />
          </span>
          <span className={caption}>
            {t.rating} <span className={source}>{t.yandex}</span>
          </span>
        </a>

        <a className={item} href={data.google.url} target="_blank" rel="noreferrer">
          <span className={`${value} text-[26px]`}>
            {format(data.google.rating)} <Star />
          </span>
          <span className={caption}>
            {t.rating} <span className={source}>{t.google}</span>
          </span>
        </a>

        <div className={item}>
          <span className={`${value} text-[20px]`}>{t.ratings(roundDown(totalRatings))}</span>
          <span className={caption}>{t.reviews(roundDown(data.yandex.reviews))}</span>
        </div>
      </div>
    </section>
  );
}
