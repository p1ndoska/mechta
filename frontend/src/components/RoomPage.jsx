import { useEffect, useState } from 'react';
import { pick } from './Rooms.jsx';

const texts = {
  ru: { locale: 'ru-RU', back: 'Все номера', from: 'от', photos: 'Фотографии', amenities: 'Удобства для комфортного пребывания:', tariffs: 'Тарифы', book: 'Забронировать', hotel: 'гостиница «Мечта»', notFound: 'Номер не найден', loading: 'Загрузка…' },
  en: { locale: 'en-US', back: 'All rooms', from: 'from', photos: 'Photos', amenities: 'Amenities for a comfortable stay:', tariffs: 'Rates', book: 'Book', hotel: 'Mechta Hotel', notFound: 'Room not found', loading: 'Loading…' },
  be: { locale: 'be-BY', back: 'Усе нумары', from: 'ад', photos: 'Фотаздымкі', amenities: 'Выгоды для камфортнага пражывання:', tariffs: 'Тарыфы', book: 'Забраніраваць', hotel: 'гасцініца «Мечта»', notFound: 'Нумар не знойдзены', loading: 'Загрузка…' },
};

const subtitle = 'mt-14 mb-6 text-[28px] font-medium text-burgundy max-xl:mt-10';
const title = 'text-title font-medium text-burgundy max-xl:text-[32px]';
const text = 'mt-6 text-[17px] leading-[1.7] whitespace-pre-line text-ink-muted';
const photoButton = 'group block w-full cursor-zoom-in border-0 bg-transparent p-0';
const lightboxNav =
  'absolute top-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-4 text-[56px] leading-none text-white max-xl:top-auto max-xl:bottom-0 max-xl:translate-y-0';

function Lightbox({ photos, index, setIndex }) {
  const close = () => setIndex(null);
  const step = (d) => setIndex((index + d + photos.length) % photos.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setIndex(null);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + photos.length) % photos.length);
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [photos.length, setIndex]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/88" role="dialog" aria-modal="true" onClick={close}>
      <img
        className="max-h-[calc(100vh-100px)] max-w-[calc(100vw-140px)] rounded-sm object-contain max-xl:max-h-[calc(100vh-120px)] max-xl:max-w-[100vw] max-xl:rounded-none" src={photos[index]} alt="" onClick={(e) => e.stopPropagation()} />
      <button className="absolute top-3.5 right-5 cursor-pointer border-0 bg-transparent text-[44px] leading-none text-white" type="button" onClick={close} aria-label="Закрыть">
        ×
      </button>
      {photos.length > 1 && (
        <>
          <button
            className={`${lightboxNav} left-2`}
            type="button"
            aria-label="Предыдущее фото"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
          >
            ‹
          </button>
          <button
            className={`${lightboxNav} right-2`}
            type="button"
            aria-label="Следующее фото"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
          >
            ›
          </button>
          <span className="absolute bottom-[18px] text-[15px] text-lightbox-text">
            {index + 1} / {photos.length}
          </span>
        </>
      )}
    </div>
  );
}

export default function RoomPage({ id, lang }) {
  const [room, setRoom] = useState(undefined);
  const [open, setOpen] = useState(null);
  const t = texts[lang];

  useEffect(() => {
    fetch(`/api/rooms/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setRoom)
      .catch(() => setRoom(null));
  }, [id]);

  useEffect(() => {
    if (room) document.title = `${pick(room.title, lang)} — ${t.hotel}`;
  }, [room, t]);

  const gallery = room ? [room.photoUrl, ...room.photos.map((photo) => photo.url)].filter(Boolean) : [];

  return (
    <section className="box-content min-h-[70vh] border-t border-card-line bg-white px-8 pt-10 pb-20 text-ink max-xl:px-5 max-xl:pt-7 max-xl:pb-14">
      <div className="mx-auto max-w-content">
        <a className="mb-7 inline-block text-[16px] text-burgundy hover:underline" href="/rooms">
          ← {t.back}
        </a>
        {room === undefined && <p className={text}>{t.loading}</p>}
        {room === null && <h1 className={title}>{t.notFound}</h1>}
        {room && (
          <>
            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start gap-12 max-xl:grid-cols-1 max-xl:gap-6">
              {room.photoUrl && (
                <button className={photoButton} type="button" onClick={() => setOpen(0)}>
                  <img className="block aspect-[4/3] w-full rounded-lg object-cover" src={room.photoUrl} alt={pick(room.title, lang)} />
                </button>
              )}
              <div>
                <h1 className={title}>{pick(room.title, lang)}</h1>
                <p className="mt-[18px] text-price font-semibold text-ink max-xl:text-[28px]">
                  {room.priceFrom && `${t.from} `}
                  {room.price.toLocaleString(t.locale, { maximumFractionDigits: 2 })} BYN
                </p>
                {pick(room.description, lang) && <p className={text}>{pick(room.description, lang)}</p>}
              </div>
            </div>
            {room.amenities.length > 0 && (
              <>
                <h2 className={subtitle}>{t.amenities}</h2>
                <ul className="list-disc columns-4 gap-x-10 pl-5 text-[17px] text-ink marker:text-burgundy max-xl:columns-2 max-sm:columns-1">
                  {room.amenities.map((item, i) => (
                    <li key={i} className="mb-2.5 break-inside-avoid">
                      {pick(item, lang)}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {room.tariffs.length > 0 && (
              <>
                <h2 className={subtitle}>{t.tariffs}</h2>
                <ul className="flex flex-wrap justify-center gap-5 max-sm:gap-3">
                  {room.tariffs.map((item, i) => (
                    <li
                      key={i}
                      className="flex w-[220px] flex-col items-center rounded-md border border-tariff-line bg-white px-5 pt-8 pb-6 text-center shadow-card max-sm:w-full"
                    >
                      <p className="text-[34px] leading-none font-semibold text-tariff-price">
                        {item.price.toLocaleString(t.locale, { maximumFractionDigits: 2 })} BYN
                      </p>
                      <div className="flex-1">
                        <h3 className="mt-4 text-[16px] font-semibold text-ink">{pick(item.name, lang)}</h3>
                        {pick(item.description, lang) && (
                          <p className="mt-2 text-[14px] leading-[1.5] text-ink-muted">{pick(item.description, lang)}</p>
                        )}
                      </div>
                      <a
                        className="mt-5 inline-block rounded-full bg-forest px-6 py-2.5 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-forest-hover"
                        href="/contacts"
                      >
                        {t.book}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {room.photos.length > 0 && (
              <>
                <h2 className={subtitle}>{t.photos}</h2>
                <div className="grid grid-cols-4 gap-4 max-xl:grid-cols-2 max-xl:gap-2.5">
                  {room.photos.map((photo, i) => (
                    <button
                      key={photo.id}
                      className={photoButton}
                      type="button"
                      onClick={() => setOpen(i + (room.photoUrl ? 1 : 0))}
                    >
                      <img className="block aspect-[4/3] w-full rounded-md object-cover transition-opacity duration-150 group-hover:opacity-85" src={photo.url} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
      {open !== null && <Lightbox photos={gallery} index={open} setIndex={setOpen} />}
    </section>
  );
}
