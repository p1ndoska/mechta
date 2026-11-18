import { useEffect, useState } from 'react';
import './Booking.css';

// Надписи меняются в панели администратора, вкладка «Тексты сайта»
export default function Booking({ lang }) {
  const [texts, setTexts] = useState(null);

  useEffect(() => {
    fetch('/api/texts')
      .then((res) => (res.ok ? res.json() : null))
      .then(setTexts)
      .catch(() => {});
  }, []);

  if (!texts) return null;
  const t = (key) => texts[key]?.[lang] || texts[key]?.ru || '';

  return (
    <section className="booking" id="booking">
      <div className="booking__content">
        <h2 className="booking__title">{t('booking.title')}</h2>
        <p className="booking__text">{t('booking.text')}</p>
        <a href="#rooms" className="booking__button">
          {t('booking.button')}
        </a>
      </div>
    </section>
  );
}
