import { useEffect, useState } from 'react';
import './Ratings.css';

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
    <svg className="ratings__star" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="ratings-star" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe17a" />
          <stop offset="1" stopColor="#f5b301" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
        fill="url(#ratings-star)"
        stroke="#e0a100"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
    <section className="ratings">
      <div className="ratings__inner">
        <a className="ratings__item" href={data.yandex.url} target="_blank" rel="noreferrer">
          <span className="ratings__value">
            {format(data.yandex.rating)} <Star />
          </span>
          <span className="ratings__caption">
            {t.rating} <span className="ratings__source">{t.yandex}</span>
          </span>
        </a>

        <a className="ratings__item" href={data.google.url} target="_blank" rel="noreferrer">
          <span className="ratings__value">
            {format(data.google.rating)} <Star />
          </span>
          <span className="ratings__caption">
            {t.rating} <span className="ratings__source">{t.google}</span>
          </span>
        </a>

        <div className="ratings__item">
          <span className="ratings__value ratings__value--small">{t.ratings(roundDown(totalRatings))}</span>
          <span className="ratings__caption">{t.reviews(roundDown(data.yandex.reviews))}</span>
        </div>
      </div>
    </section>
  );
}
