import { useEffect, useState } from 'react';
import { api } from './api.js';
import { messageClass, ui } from './ui.js';

const GROUPS = {
  advantages: 'Блок «Наши преимущества»',
  discounts: 'Блок «Скидки»',
  booking: 'Блок «Готовы к путешествию?»',
  cookies: 'Плашка о cookie',
  legal: 'Страницы из подвала сайта',
};

const LANGS = [
  ['ru', 'RU'],
  ['en', 'EN'],
  ['be', 'BE'],
];

export default function TextsSection() {
  const [texts, setTexts] = useState(null);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/texts').then((res) => res.ok && setTexts(res.data));
  }, []);

  function change(key, lang, value) {
    setTexts(texts.map((item) => (item.key === key ? { ...item, [lang]: value } : item)));
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const body = Object.fromEntries(texts.map(({ key, ru, en, be }) => [key, { ru, en, be }]));
    const res = await api('/texts', body, 'PUT');
    setBusy(false);
    if (res.ok) {
      setTexts(res.data);
      setMessage({ ok: true, text: 'Надписи сохранены' });
    } else {
      setMessage({ ok: false, text: res.data?.error || 'Не удалось сохранить' });
    }
  }

  if (!texts) return <p className={ui.muted}>Загрузка…</p>;

  return (
    <section className={ui.section}>
      <form className={ui.form} onSubmit={save}>
        <p className={ui.muted}>Если поле EN или BE пустое, на сайте покажется русский текст.</p>
        {texts.map((item, i) => {
          const group = item.key.split('.')[0];
          const groupStart = i === 0 || texts[i - 1].key.split('.')[0] !== group;
          return [
            groupStart && <h2 key={group} className={ui.subtitle}>{GROUPS[group]}</h2>,
          <fieldset key={item.key} className={ui.lang}>
            <legend className={ui.legend}>{item.label}</legend>
            {LANGS.map(([lang, name]) => (
              <label key={lang} className={ui.textRow}>
                <span className={ui.textRowLabel}>{name}</span>
                {item.long ? (
                  <textarea
                    className={`${ui.textRowInput} resize-y`}
                    rows={10}
                    value={item[lang]}
                    onChange={(e) => change(item.key, lang, e.target.value)}
                    maxLength={100000}
                    required={lang === 'ru'}
                  />
                ) : (
                  <input
                    className={ui.textRowInput}
                    value={item[lang]}
                    onChange={(e) => change(item.key, lang, e.target.value)}
                    maxLength={300}
                    required={lang === 'ru'}
                  />
                )}
              </label>
            ))}
          </fieldset>,
          ];
        })}
        {message && <p className={messageClass(message)}>{message.text}</p>}
        <div className={ui.buttons}>
          <button className={ui.button} type="submit" disabled={busy}>
            Сохранить
          </button>
        </div>
      </form>
    </section>
  );
}
