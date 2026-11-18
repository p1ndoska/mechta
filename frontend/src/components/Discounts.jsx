import { useEffect, useState } from 'react';
import { pick } from './Rooms.jsx';

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
    <section className="bg-white px-8 pt-2 pb-18 text-ink max-xl:px-5 max-xl:pt-0 max-xl:pb-14" id="discounts">
      <h2 className="mb-8 text-center text-title font-semibold text-ink-heading max-xl:mb-6 max-xl:text-title-sm">{pick(title, lang)}</h2>
      <ul className="mx-auto flex max-w-content flex-wrap justify-center gap-6 max-xl:gap-4">
        {items.map((item) => (
          <li key={item.id} className="flex min-h-[150px] w-[220px] flex-col items-center gap-2.5 rounded-md border border-card-line px-5 pt-7 pb-6 text-center shadow-card max-xl:min-h-[130px] max-xl:w-[calc(50%-8px)] max-xl:px-3.5 max-xl:pt-[22px] max-xl:pb-[18px]">
            <span className="text-price font-semibold text-ink-heading max-xl:text-[28px]">{item.value}</span>
            <span className="text-[15px] leading-[1.45] text-ink-muted">{pick(item.text, lang)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
