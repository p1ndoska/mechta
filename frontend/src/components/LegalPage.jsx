import { useEffect, useState } from 'react';
import { footerTexts } from './Footer.jsx';

const hotel = { ru: 'гостиница «Мечта»', en: 'Mechta Hotel', be: 'гасцініца «Мечта»' };

// Текст страниц меняется в панели администратора, вкладка «Тексты сайта»
export default function LegalPage({ page, lang }) {
  const [texts, setTexts] = useState(null);
  const title = footerTexts[lang][page];

  useEffect(() => {
    fetch('/api/texts')
      .then((res) => (res.ok ? res.json() : null))
      .then(setTexts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.title = `${title} — ${hotel[lang]}`;
  }, [title, lang]);

  const text = texts?.[`legal.${page}`];

  return (
    <section className="min-h-[60vh] bg-white px-10 pt-16 pb-20 max-xl:px-5 max-xl:pt-10 max-xl:pb-12">
      <div className="mx-auto max-w-[860px]">
        <h1 className="mb-8 text-[28px] font-semibold text-pine max-xl:text-[24px]">{title}</h1>
        {text && <p className="text-[16px] leading-[1.7] whitespace-pre-line text-ink">{text[lang] || text.ru}</p>}
      </div>
    </section>
  );
}
