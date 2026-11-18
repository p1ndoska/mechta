import { useEffect, useState } from 'react';

// Текст на выбранном языке, а если его нет — на русском
export const pick = (texts, lang) => texts[lang] || texts.ru;

const texts = {
  ru: { locale: 'ru-RU', title: 'Часто выбирают', from: 'от', more: 'Подробнее' },
  en: { locale: 'en-US', title: 'Popular rooms', from: 'from', more: 'More' },
  be: { locale: 'be-BY', title: 'Часта выбіраюць', from: 'ад', more: 'Падрабязней' },
};

const photo = 'aspect-[7/9] w-full rounded-lg bg-white/12 object-cover';

// Карточки добавляются в панели администратора, вкладка «Номера»
export default function Rooms({ lang }) {
  const [rooms, setRooms] = useState([]);
  const t = texts[lang];

  useEffect(() => {
    fetch('/api/rooms')
      .then((res) => (res.ok ? res.json() : []))
      .then(setRooms)
      .catch(() => {});
  }, []);

  if (rooms.length === 0) return null;

  return (
    <section className="bg-burgundy px-8 pt-16 pb-20 text-sand-light max-xl:px-5 max-xl:pt-10 max-xl:pb-12" id="rooms">
      <h2 className="mb-11 text-center text-title font-medium text-sand max-xl:mb-8 max-xl:text-[32px]">{t.title}</h2>
      <div className="mx-auto grid max-w-content grid-cols-3 gap-x-10 gap-y-14 max-xl:grid-cols-2 max-xl:gap-x-6 max-xl:gap-y-11 max-sm:max-w-[440px] max-sm:grid-cols-1">
        {rooms.map((room) => (
          <a key={room.id} className="group flex flex-col items-start" href={`/rooms/${room.id}`}>
            {room.photoUrl ? (
              <img className={photo} src={room.photoUrl} alt={pick(room.title, lang)} loading="lazy" />
            ) : (
              <div className={photo} />
            )}
            <h3 className="mt-6 text-[24px] font-semibold text-sand max-xl:text-[21px]">{pick(room.title, lang)}</h3>
            {pick(room.description, lang) && <p className="mt-3.5 line-clamp-4 text-[16px] leading-[1.6] text-sand-text">{pick(room.description, lang)}</p>}
            <p className="mt-auto pt-6 text-price font-semibold text-ivory max-xl:text-[30px]">
              {room.priceFrom && `${t.from} `}
              {room.price.toLocaleString(t.locale, { maximumFractionDigits: 2 })} BYN
            </p>
            <span className="mt-4 cursor-pointer rounded-full bg-olive px-7 py-[13px] text-[16px] font-semibold text-white group-hover:bg-olive-hover">
              {t.more} <span aria-hidden="true">→</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
