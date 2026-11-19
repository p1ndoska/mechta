import { useEffect, useState } from 'react';
import { footerTexts } from './Footer.jsx';

// Разметка по строкам текста: «Политика …» — заголовок документа, «ГЛАВА N» и строка заглавными — заголовок главы,
// короткая строка «1. …» без точки в конце — заголовок раздела,
// ненумерованная строка с «;» в конце или со строчной буквы после «:» — пункт списка
const isUpper = (line) => /\p{L}/u.test(line) && line === line.toUpperCase();
const isListItem = (line, prev) => !/^\d/.test(line) && (line.endsWith(';') || (/^\p{Ll}/u.test(line) && /[:;]$/.test(prev ?? '')));

function blocks(text) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^ГЛАВА \d+$/i.test(line)) {
      const name = lines[i + 1] && isUpper(lines[i + 1]) ? lines[++i] : '';
      result.push({ type: 'chapter', text: line, name });
    } else if (/^Политика\s/.test(line) && line.length < 120 && !/[.;:]$/.test(line)) {
      result.push({ type: 'title', text: line });
    } else if (/^\d+(\.\d+)*\.\s/.test(line) && line.length < 160 && !/[.;]$/.test(line)) {
      result.push({ type: 'section', text: line });
    } else if (isListItem(line, lines[i - 1])) {
      result.push({ type: 'item', text: line });
    } else {
      result.push({ type: 'text', text: line });
    }
  }
  return result;
}

function Block({ type, text, name }) {
  if (type === 'title') return <h2 className="mt-14 mb-2 text-[22px] leading-snug font-semibold text-pine first:mt-0 max-xl:text-[20px]">{text}</h2>;
  if (type === 'chapter')
    return (
      <h3 className="mt-9 mb-1 text-center leading-snug text-[16px] font-semibold text-indigo">
        {text}
        {name && <span className="mt-1 block">{name}</span>}
      </h3>
    );
  if (type === 'section') return <h3 className="mt-7 mb-1 text-[17px] leading-snug first:mt-0 font-semibold text-indigo">{text}</h3>;
  if (type === 'item') return <p className="mt-1 pl-5 before:-ml-4 before:inline-block before:w-4 before:content-['•']">{text}</p>;
  return <p className="mt-3">{text}</p>;
}

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
        {text && (
          <div className="text-[16px] leading-[1.7] break-words text-ink max-xl:text-[15px]">
            {blocks(text[lang] || text.ru).map((block, i) => (
              <Block key={i} {...block} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
