import { useEffect, useState } from 'react';
import './Rooms.css';

const texts = {
  ru: { locale: 'ru-RU', title: 'Часто выбирают', from: 'от', more: 'Подробнее' },
  en: { locale: 'en-US', title: 'Popular rooms', from: 'from', more: 'More' },
  be: { locale: 'be-BY', title: 'Часта выбіраюць', from: 'ад', more: 'Падрабязней' },
};

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
    <section className="rooms" id="rooms">
      <h2 className="rooms__title">{t.title}</h2>
      <div className="rooms__grid">
        {rooms.map((room) => (
          <a key={room.id} className="rooms__card" href={`/rooms/${room.id}`}>
            {room.photoUrl ? (
              <img className="rooms__photo" src={room.photoUrl} alt={room.title} loading="lazy" />
            ) : (
              <div className="rooms__photo" />
            )}
            <h3 className="rooms__name">{room.title}</h3>
            {room.description && <p className="rooms__text">{room.description}</p>}
            <p className="rooms__price">
              {room.priceFrom && `${t.from} `}
              {room.price.toLocaleString(t.locale, { maximumFractionDigits: 2 })} BYN
            </p>
            <span className="rooms__more">
              {t.more} <span aria-hidden="true">→</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
