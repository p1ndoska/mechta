import { useEffect, useState } from 'react';
import './Advantages.css';

const ICONS = '/images/photos';
const items = [
  ['airport', 'hugeicons_plane.png'],
  ['parking', 'parking.png'],
  ['wifi', 'proicons_wi-fi.png'],
  ['green', 'green-zone.png'],
  ['balcony', 'balcony.png'],
  ['cafe', 'tools.png'],
];

// Надписи меняются в панели администратора, вкладка «Тексты сайта»
export default function Advantages({ lang }) {
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
    <section className="advantages" id="advantages">
      <h2 className="advantages__title">{t('advantages.title')}</h2>
      <ul className="advantages__grid">
        {items.map(([id, icon]) => (
          <li key={id} className="advantages__item">
            <img className="advantages__icon" src={`${ICONS}/${icon}`} alt="" />
            <span>
              <span className="advantages__name">{t(`advantages.${id}.title`)}</span>
              <span className="advantages__text">{t(`advantages.${id}.text`)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
