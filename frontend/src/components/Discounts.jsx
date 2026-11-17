import { useEffect, useState } from 'react';
import { pick } from './Rooms.jsx';
import './Discounts.css';

// Карточки добавляются в панели администратора, вкладка «Скидки»
export default function Discounts({ lang }) {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState(null);

  useEffect(() => {
    fetch('/api/discounts')
      .then((res) => (res.ok ? res.json() : []))
      .then(setItems)
      .catch(() => {});
    fetch('/api/texts')
      .then((res) => (res.ok ? res.json() : null))
      .then((texts) => setTitle(texts?.['discounts.title'] ?? null))
      .catch(() => {});
  }, []);

  if (!items.length || !title) return null;

  return (
    <section className="discounts" id="discounts">
      <h2 className="discounts__title">{pick(title, lang)}</h2>
      <ul className="discounts__list">
        {items.map((item) => (
          <li key={item.id} className="discounts__card">
            <span className="discounts__value">{item.value}</span>
            <span className="discounts__text">{pick(item.text, lang)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
