import { useEffect, useState } from 'react';

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
    <section className="bg-white px-8 pt-16 pb-18 text-ink max-xl:px-5 max-xl:pt-12 max-xl:pb-14" id="advantages">
      <h2 className="mb-11 text-center text-title font-semibold text-ink-heading max-xl:mb-8 max-xl:text-title-sm">{t('advantages.title')}</h2>
      <ul className="mx-auto grid max-w-content grid-cols-3 gap-x-12 gap-y-10 max-xl:grid-cols-2 max-xl:gap-x-8 max-xl:gap-y-7 max-sm:grid-cols-1">
        {items.map(([id, icon]) => (
          <li key={id} className="flex items-start gap-4">
            <img className="size-10 flex-none object-contain" src={`${ICONS}/${icon}`} alt="" />
            <span>
              <span className="block text-[18px] font-semibold text-ink">{t(`advantages.${id}.title`)}</span>
              <span className="mt-1.5 block text-[16px] leading-[1.5] text-ink-muted">{t(`advantages.${id}.text`)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
