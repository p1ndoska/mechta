import { useCallback, useEffect, useState } from 'react';
import { pick } from './Rooms.jsx';
import BookingForm from './BookingForm.jsx';

const texts = {
  ru: { locale: 'ru-RU', title: 'Номера для проживания', hotel: 'гостиница «Мечта»', from: 'от', book: 'Забронировать', more: 'Подробнее', loading: 'Загрузка…', empty: 'Номера пока не добавлены' },
  en: { locale: 'en-US', title: 'Rooms', hotel: 'Mechta Hotel', from: 'from', book: 'Book', more: 'More', loading: 'Loading…', empty: 'No rooms yet' },
  be: { locale: 'be-BY', title: 'Нумары для пражывання', hotel: 'гасцініца «Мечта»', from: 'ад', book: 'Забраніраваць', more: 'Падрабязней', loading: 'Загрузка…', empty: 'Нумары пакуль не дададзены' },
};

const button = 'inline-block rounded-full px-6 py-2.5 text-[14px] font-semibold text-white transition-colors duration-200';
const note = 'text-center text-[16px] text-ink-muted';

// Все номера из панели администратора, вкладка «Номера»
export default function RoomsPage({ lang }) {
  const [rooms, setRooms] = useState(null);
  const [booking, setBooking] = useState(null);
  const closeBooking = useCallback(() => setBooking(null), []);
  const t = texts[lang];

  useEffect(() => {
    fetch('/api/rooms')
      .then((res) => (res.ok ? res.json() : []))
      .then(setRooms)
      .catch(() => setRooms([]));
  }, []);

  useEffect(() => {
    document.title = `${t.title} — ${t.hotel}`;
  }, [t]);

  return (
    <section className="bg-white px-10 pt-16 pb-20 max-xl:px-5 max-xl:pt-10 max-xl:pb-12">
      <h1 className="mb-14 text-center text-[28px] font-semibold text-pine max-xl:mb-8 max-xl:text-[24px]">{t.title}</h1>
      {rooms === null && <p className={note}>{t.loading}</p>}
      {rooms?.length === 0 && <p className={note}>{t.empty}</p>}
      <div className="mx-auto flex max-w-[1840px] flex-col gap-10 max-xl:gap-6">
        {rooms?.map((room) => (
          <article
            key={room.id}
            className="grid grid-cols-[minmax(0,47fr)_minmax(0,53fr)] overflow-hidden rounded-lg border-6 border-cream bg-white max-xl:grid-cols-1 max-xl:border-4"
          >
            <div className="flex items-center justify-center px-10 py-12 max-xl:order-last max-xl:px-5 max-xl:py-7">
              <div className="w-full max-w-[340px]">
                <h2 className="text-[19px] font-semibold text-indigo">{pick(room.title, lang)}</h2>
                {pick(room.description, lang) && (
                  <p className="mt-3 line-clamp-5 text-[13px] leading-[1.6] text-ink-muted">{pick(room.description, lang)}</p>
                )}
                <p className="mt-4 text-[24px] font-medium text-ink">
                  {room.priceFrom && `${t.from} `}
                  {room.price.toLocaleString(t.locale, { maximumFractionDigits: 2 })} BYN
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button className={`${button} cursor-pointer bg-forest hover:bg-forest-hover`} type="button" onClick={() => setBooking(room.id)}>
                    {t.book}
                  </button>
                  <a className={`${button} bg-room-accent hover:bg-room-accent-hover`} href={`/rooms/${room.id}`}>
                    {t.more} <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>
            {room.photoUrl ? (
              <img className="aspect-[4/3] h-full w-full rounded-md object-cover" src={room.photoUrl} alt={pick(room.title, lang)} loading="lazy" />
            ) : (
              <div className="aspect-[4/3] h-full w-full rounded-md bg-photo-fallback" />
            )}
          </article>
        ))}
      </div>
      {booking && <BookingForm lang={lang} roomId={booking} onClose={closeBooking} />}
    </section>
  );
}
