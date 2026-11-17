import { useEffect, useState } from 'react';
import { api } from './api.js';

const LANGS = [
  ['ru', 'RU'],
  ['en', 'EN'],
  ['be', 'BE'],
];
const EMPTY = { value: '', text: { ru: '', en: '', be: '' } };

export default function DiscountsSection() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/discounts').then((res) => res.ok && setItems(res.data));
  }, []);

  function reset() {
    setForm(EMPTY);
    setEditId(null);
  }

  function edit(item) {
    setForm({ value: item.value, text: { ...item.text } });
    setEditId(item.id);
    setMessage(null);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = editId ? await api(`/discounts/${editId}`, form, 'PUT') : await api('/discounts', form);
    setBusy(false);
    if (res.ok) {
      setItems(res.data);
      setMessage({ ok: true, text: editId ? 'Скидка сохранена' : 'Скидка добавлена' });
      reset();
    } else {
      setMessage({ ok: false, text: res.data?.error || 'Не удалось сохранить' });
    }
  }

  async function move(item, direction) {
    const res = await api(`/discounts/${item.id}/move`, { direction });
    if (res.ok) setItems(res.data);
  }

  async function remove(item) {
    if (!window.confirm(`Удалить скидку «${item.value} ${item.text.ru}»?`)) return;
    const res = await api(`/discounts/${item.id}`, undefined, 'DELETE');
    if (res.ok) {
      setItems(res.data);
      if (editId === item.id) reset();
      setMessage({ ok: true, text: 'Скидка удалена' });
    } else {
      setMessage({ ok: false, text: res.data?.error || 'Не удалось удалить' });
    }
  }

  return (
    <section className="admin__section">
      <p className="admin__muted">Карточки показываются на сайте в блоке «Скидки» в этом порядке.</p>
      {items.length > 0 ? (
        <ul className="admin__users">
          {items.map((item, i) => (
            <li key={item.id} className="admin__user admin__room">
              <span className="admin__room-info">
                <span>{item.value}</span>
                <span className="admin__muted">{item.text.ru}</span>
              </span>
              <span className="admin__room-actions">
                <button className="admin__icon" type="button" onClick={() => move(item, 'up')} disabled={i === 0} aria-label="Выше">
                  ↑
                </button>
                <button
                  className="admin__icon"
                  type="button"
                  onClick={() => move(item, 'down')}
                  disabled={i === items.length - 1}
                  aria-label="Ниже"
                >
                  ↓
                </button>
                <button className="admin__link" type="button" onClick={() => edit(item)}>
                  Изменить
                </button>
                <button className="admin__link" type="button" onClick={() => remove(item)}>
                  Удалить
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin__muted">Скидок пока нет. Пока их нет, блок на сайте не показывается.</p>
      )}

      <form className="admin__room-form" onSubmit={save}>
        <h2 className="admin__subtitle">{editId ? 'Изменить скидку' : 'Добавить скидку'}</h2>
        <label className="admin__text-row">
          <span className="admin__text-label">Скидка</span>
          <input
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder="5%"
            maxLength={20}
            required
          />
        </label>
        <fieldset className="admin__lang">
          <legend>Описание</legend>
          {LANGS.map(([lang, name]) => (
            <label key={lang} className="admin__text-row">
              <span>{name}</span>
              <input
                value={form.text[lang]}
                onChange={(e) => setForm({ ...form, text: { ...form.text, [lang]: e.target.value } })}
                maxLength={200}
                required={lang === 'ru'}
              />
            </label>
          ))}
        </fieldset>
        <p className="admin__muted">Если EN или BE пустые, на сайте покажется русский текст.</p>
        {message && <p className={message.ok ? 'admin__success' : 'admin__error'}>{message.text}</p>}
        <div className="admin__room-buttons">
          <button className="admin__button" type="submit" disabled={busy}>
            {editId ? 'Сохранить' : 'Добавить'}
          </button>
          {editId && (
            <button className="admin__link" type="button" onClick={reset}>
              Отмена
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
