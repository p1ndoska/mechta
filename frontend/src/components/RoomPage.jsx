import { useEffect, useState } from 'react';
import { pick } from './Rooms.jsx';

const texts = {
  ru: { locale: 'ru-RU', back: 'Все номера', from: 'от', photos: 'Фотографии', hotel: 'гостиница «Мечта»', notFound: 'Номер не найден', loading: 'Загрузка…' },
  en: { locale: 'en-US', back: 'All rooms', from: 'from', photos: 'Photos', hotel: 'Mechta Hotel', notFound: 'Room not found', loading: 'Loading…' },
  be: { locale: 'be-BY', back: 'Усе нумары', from: 'ад', photos: 'Фотаздымкі', hotel: 'гасцініца «Мечта»', notFound: 'Нумар не знойдзены', loading: 'Загрузка…' },
};

const title = 'text-title font-medium text-sand max-xl:text-[32px]';
const text = 'mt-6 text-[17px] leading-[1.7] whitespace-pre-line text-sand-text';
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
    <section className="box-content min-h-[70vh] bg-burgundy px-8 pt-10 pb-20 text-sand-light max-xl:px-5 max-xl:pt-7 max-xl:pb-14">
      <div className="mx-auto max-w-content">
        <a className="mb-7 inline-block text-[16px] text-sand hover:underline" href="/rooms">
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
                <p className="mt-[18px] text-price font-semibold text-ivory max-xl:text-[28px]">
                  {room.priceFrom && `${t.from} `}
                  {room.price.toLocaleString(t.locale, { maximumFractionDigits: 2 })} BYN
                </p>
                {pick(room.description, lang) && <p className={text}>{pick(room.description, lang)}</p>}
              </div>
            </div>
            {room.photos.length > 0 && (
              <>
                <h2 className="mt-14 mb-6 text-[28px] font-medium text-sand max-xl:mt-10">{t.photos}</h2>
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
