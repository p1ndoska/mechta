import { useEffect, useState } from 'react';
import { pick } from './Rooms.jsx';
import './RoomPage.css';

const texts = {
  ru: { locale: 'ru-RU', back: 'Все номера', from: 'от', photos: 'Фотографии', hotel: 'гостиница «Мечта»', notFound: 'Номер не найден', loading: 'Загрузка…' },
  en: { locale: 'en-US', back: 'All rooms', from: 'from', photos: 'Photos', hotel: 'Mechta Hotel', notFound: 'Room not found', loading: 'Loading…' },
  be: { locale: 'be-BY', back: 'Усе нумары', from: 'ад', photos: 'Фотаздымкі', hotel: 'гасцініца «Мечта»', notFound: 'Нумар не знойдзены', loading: 'Загрузка…' },
};

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
    <div className="lightbox" role="dialog" aria-modal="true" onClick={close}>
      <img className="lightbox__img" src={photos[index]} alt="" onClick={(e) => e.stopPropagation()} />
      <button className="lightbox__close" type="button" onClick={close} aria-label="Закрыть">
        ×
      </button>
      {photos.length > 1 && (
        <>
          <button
            className="lightbox__nav lightbox__nav--prev"
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
            className="lightbox__nav lightbox__nav--next"
            type="button"
            aria-label="Следующее фото"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
          >
            ›
          </button>
          <span className="lightbox__count">
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
    <section className="room-page">
      <div className="room-page__inner">
        <a className="room-page__back" href="/#rooms">
          ← {t.back}
        </a>
        {room === undefined && <p className="room-page__text">{t.loading}</p>}
        {room === null && <h1 className="room-page__title">{t.notFound}</h1>}
        {room && (
          <>
            <div className="room-page__main">
              {room.photoUrl && (
                <button className="room-page__photo-button" type="button" onClick={() => setOpen(0)}>
                  <img className="room-page__photo" src={room.photoUrl} alt={pick(room.title, lang)} />
                </button>
              )}
              <div className="room-page__info">
                <h1 className="room-page__title">{pick(room.title, lang)}</h1>
                <p className="room-page__price">
                  {room.priceFrom && `${t.from} `}
                  {room.price.toLocaleString(t.locale, { maximumFractionDigits: 2 })} BYN
                </p>
                {pick(room.description, lang) && <p className="room-page__text">{pick(room.description, lang)}</p>}
              </div>
            </div>
            {room.photos.length > 0 && (
              <>
                <h2 className="room-page__subtitle">{t.photos}</h2>
                <div className="room-page__gallery">
                  {room.photos.map((photo, i) => (
                    <button
                      key={photo.id}
                      className="room-page__photo-button"
                      type="button"
                      onClick={() => setOpen(i + (room.photoUrl ? 1 : 0))}
                    >
                      <img className="room-page__thumb" src={photo.url} alt="" loading="lazy" />
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
