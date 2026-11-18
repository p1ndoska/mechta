import { useEffect, useState } from 'react';
import { api } from './api.js';

const GROUPS = {
  advantages: 'Блок «Наши преимущества»',
  discounts: 'Блок «Скидки»',
  booking: 'Блок «Готовы к путешествию?»',
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

  if (!texts) return <p className="admin__muted">Загрузка…</p>;

  return (
    <section className="admin__section">
      <form className="admin__room-form" onSubmit={save}>
        <p className="admin__muted">Если поле EN или BE пустое, на сайте покажется русский текст.</p>
        {texts.map((item, i) => {
          const group = item.key.split('.')[0];
          const groupStart = i === 0 || texts[i - 1].key.split('.')[0] !== group;
          return [
            groupStart && <h2 key={group} className="admin__subtitle">{GROUPS[group]}</h2>,
          <fieldset key={item.key} className="admin__lang">
            <legend>{item.label}</legend>
            {LANGS.map(([lang, name]) => (
              <label key={lang} className="admin__text-row">
                <span>{name}</span>
                <input
                  value={item[lang]}
                  onChange={(e) => change(item.key, lang, e.target.value)}
                  maxLength={300}
                  required={lang === 'ru'}
                />
              </label>
            ))}
          </fieldset>,
          ];
        })}
        {message && <p className={message.ok ? 'admin__success' : 'admin__error'}>{message.text}</p>}
        <div className="admin__room-buttons">
          <button className="admin__button" type="submit" disabled={busy}>
            Сохранить
          </button>
        </div>
      </form>
    </section>
  );
}
