import { useEffect, useState } from 'react';
import { api } from './api.js';
import { messageClass, ui } from './ui.js';

const LANGS = [
  ['ru', 'Русский'],
  ['en', 'English'],
  ['be', 'Беларуская'],
];
const noText = { ru: '', en: '', be: '' };
const empty = { title: noText, description: noText, price: '', priceFrom: false, amenities: [] };
const MAX_SIDE = 1600;

// Уменьшаем фото в браузере до 1600 px по большей стороне, чтобы не грузить в базу снимки по 5–10 МБ
async function preparePhoto(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
}

function formatPrice(room) {
  return `${room.priceFrom ? 'от ' : ''}${room.price.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} BYN`;
}

export default function RoomsSection() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [extras, setExtras] = useState([]);

  async function load() {
    const res = await api('/rooms');
    if (res.ok) setRooms(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!photo) return undefined;
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function clearExtras() {
    extras.forEach((extra) => URL.revokeObjectURL(extra.url));
    setExtras([]);
  }

  function reset() {
    clearExtras();
    setPhotos([]);
    setForm(empty);
    setEditId(null);
    setPhoto(null);
    setPreview(null);
    setFileKey((k) => k + 1);
  }

  function edit(room) {
    setForm({
      title: { ...room.title },
      description: { ...room.description },
      price: String(room.price),
      priceFrom: room.priceFrom,
      amenities: room.amenities.map((item) => ({ ...item })),
    });
    setEditId(room.id);
    clearExtras();
    setPhotos(room.photos || []);
    setPhoto(null);
    setPreview(room.photoUrl);
    setFileKey((k) => k + 1);
    setMessage(null);
  }

  async function choosePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setPhoto(await preparePhoto(file));
    } catch {
      setMessage({ ok: false, text: 'Не удалось открыть фото. Выберите JPEG, PNG или WebP' });
      setFileKey((k) => k + 1);
    }
  }

  async function chooseExtras(e) {
    const files = [...e.target.files];
    e.target.value = '';
    const added = [];
    for (const file of files) {
      try {
        const blob = await preparePhoto(file);
        added.push({ blob, url: URL.createObjectURL(blob) });
      } catch {
        setMessage({ ok: false, text: `Не удалось открыть ${file.name}. Выберите JPEG, PNG или WebP` });
      }
    }
    setExtras((list) => [...list, ...added]);
  }

  function dropExtra(extra) {
    URL.revokeObjectURL(extra.url);
    setExtras((list) => list.filter((item) => item !== extra));
  }

  function setAmenities(amenities) {
    setForm((f) => ({ ...f, amenities }));
  }

  function changeAmenity(index, lang, value) {
    setAmenities(form.amenities.map((item, i) => (i === index ? { ...item, [lang]: value } : item)));
  }

  function moveAmenity(index, direction) {
    const target = index + direction;
    const list = [...form.amenities];
    [list[index], list[target]] = [list[target], list[index]];
    setAmenities(list);
  }

  async function movePhoto(item, direction) {
    const res = await api(`/rooms/${editId}/photos/${item.id}/move`, { direction });
    if (res.ok) setPhotos(res.data);
  }

  async function removePhoto(item) {
    if (!window.confirm('Удалить это фото?')) return;
    const res = await api(`/rooms/${editId}/photos/${item.id}`, undefined, 'DELETE');
    if (res.ok) setPhotos(res.data);
  }

  async function save(e) {
    e.preventDefault();
    if (!editId && !photo) {
      setMessage({ ok: false, text: 'Выберите фото номера' });
      return;
    }
    setBusy(true);
    const body = { ...form, price: Number(form.price) };
    const res = editId ? await api(`/rooms/${editId}`, body, 'PUT') : await api('/rooms', body);
    let error = res.ok ? null : res.data?.error || 'Не удалось сохранить номер';
    if (res.ok && photo) {
      const up = await api(`/rooms/${res.data.id}/photo`, photo, 'PUT');
      if (!up.ok) error = up.data?.error || 'Номер сохранён, но фото не загрузилось';
    }
    if (res.ok) {
      for (const extra of extras) {
        const up = await api(`/rooms/${res.data.id}/photos`, extra.blob);
        if (!up.ok) error = up.data?.error || 'Номер сохранён, но не все дополнительные фото загрузились';
      }
    }
    setBusy(false);
    if (error) {
      setMessage({ ok: false, text: error });
    } else {
      setMessage({ ok: true, text: editId ? `Номер «${form.title.ru}» сохранён` : `Номер «${form.title.ru}» добавлен` });
      reset();
    }
    load();
  }

  async function move(room, direction) {
    const res = await api(`/rooms/${room.id}/move`, { direction });
    if (res.ok) setRooms(res.data);
  }

  async function remove(room) {
    if (!window.confirm(`Удалить номер «${room.title.ru}»?`)) return;
    const res = await api(`/rooms/${room.id}`, undefined, 'DELETE');
    if (res.ok) {
      if (editId === room.id) reset();
      setMessage({ ok: true, text: `Номер «${room.title.ru}» удалён` });
      load();
    } else {
      setMessage({ ok: false, text: res.data?.error || 'Не удалось удалить номер' });
    }
  }

  return (
    <section className={ui.section}>
      <p className={ui.muted}>Карточки показываются на сайте в блоке «Часто выбирают» в этом порядке.</p>
      {rooms.length > 0 ? (
        <ul className={ui.list}>
          {rooms.map((room, i) => (
            <li key={room.id} className={`${ui.row} items-center`}>
              {room.photoUrl ? (
                <img className={ui.roomPhoto} src={room.photoUrl} alt="" />
              ) : (
                <span className={ui.roomPhoto} />
              )}
              <span className={ui.roomInfo}>
                <span>{room.title.ru}</span>
                <span className={ui.muted}>{formatPrice(room)}</span>
              </span>
              <span className={ui.roomActions}>
                <button className={ui.icon} type="button" onClick={() => move(room, 'up')} disabled={i === 0} aria-label="Выше">
                  ↑
                </button>
                <button
                  className={ui.icon}
                  type="button"
                  onClick={() => move(room, 'down')}
                  disabled={i === rooms.length - 1}
                  aria-label="Ниже"
                >
                  ↓
                </button>
                <button className={ui.link} type="button" onClick={() => edit(room)}>
                  Изменить
                </button>
                <button className={ui.link} type="button" onClick={() => remove(room)}>
                  Удалить
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={ui.muted}>Номеров пока нет. Пока их нет, блок на сайте не показывается.</p>
      )}

      <form className={ui.form} onSubmit={save}>
        <h2 className={ui.subtitle}>{editId ? 'Изменить номер' : 'Добавить номер'}</h2>
        <div className={ui.photoField}>
          {preview ? <img className={ui.preview} src={preview} alt="" /> : <span className={ui.preview} />}
          <label className={ui.field}>
            Фото
            <input className={ui.file} key={fileKey} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} />
          </label>
        </div>
        <div className={ui.field}>
          Дополнительные фото (для страницы номера)
          {(photos.length > 0 || extras.length > 0) && (
            <div className={ui.extras}>
              {photos.map((item, i) => (
                <span key={item.id} className={ui.extra}>
                  <img className={ui.extraImg} src={item.url} alt="" />
                  <span className={ui.extraActions}>
                    <button className={ui.icon} type="button" onClick={() => movePhoto(item, 'up')} disabled={i === 0} aria-label="Раньше">
                      ←
                    </button>
                    <button
                      className={ui.icon}
                      type="button"
                      onClick={() => movePhoto(item, 'down')}
                      disabled={i === photos.length - 1}
                      aria-label="Позже"
                    >
                      →
                    </button>
                    <button className={ui.icon} type="button" onClick={() => removePhoto(item)} aria-label="Удалить фото">
                      ×
                    </button>
                  </span>
                </span>
              ))}
              {extras.map((extra) => (
                <span key={extra.url} className={ui.extra}>
                  <img className={ui.extraImgNew} src={extra.url} alt="" />
                  <span className={ui.extraActions}>
                    <span className={ui.muted}>новое</span>
                    <button className={ui.icon} type="button" onClick={() => dropExtra(extra)} aria-label="Убрать фото">
                      ×
                    </button>
                  </span>
                </span>
              ))}
            </div>
          )}
          <input className={ui.file} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseExtras} />
          {extras.length > 0 && <span className={ui.muted}>Новые фото загрузятся после нажатия «{editId ? 'Сохранить' : 'Добавить'}»</span>}
        </div>
        {LANGS.map(([lang, name]) => (
          <fieldset key={lang} className={ui.lang}>
            <legend className={ui.legend}>{name}</legend>
            <label className={ui.field}>
              Название
              <input
                className={ui.input}
                value={form.title[lang]}
                onChange={(e) => setForm({ ...form, title: { ...form.title, [lang]: e.target.value } })}
                maxLength={100}
                required
              />
            </label>
            <label className={ui.field}>
              Описание
              <textarea
                className={ui.textarea}
                value={form.description[lang]}
                onChange={(e) => setForm({ ...form, description: { ...form.description, [lang]: e.target.value } })}
                maxLength={3000}
                rows={4}
              />
            </label>
          </fieldset>
        ))}
        <div className={ui.field}>
          Удобства (для страницы номера, блок «Удобства для комфортного пребывания»)
          {form.amenities.length > 0 && (
            <div className={ui.amenities}>
              {form.amenities.map((item, i) => (
                <div key={i} className={ui.amenityRow}>
                  {LANGS.map(([lang, name]) => (
                    <input
                      key={lang}
                      className={ui.input}
                      value={item[lang]}
                      onChange={(e) => changeAmenity(i, lang, e.target.value)}
                      placeholder={name}
                      aria-label={`Удобство ${i + 1}: ${name}`}
                      maxLength={100}
                      required={lang === 'ru'}
                    />
                  ))}
                  <span className={ui.amenityActions}>
                    <button className={ui.icon} type="button" onClick={() => moveAmenity(i, -1)} disabled={i === 0} aria-label="Выше">
                      ↑
                    </button>
                    <button
                      className={ui.icon}
                      type="button"
                      onClick={() => moveAmenity(i, 1)}
                      disabled={i === form.amenities.length - 1}
                      aria-label="Ниже"
                    >
                      ↓
                    </button>
                    <button
                      className={ui.icon}
                      type="button"
                      onClick={() => setAmenities(form.amenities.filter((_, j) => j !== i))}
                      aria-label="Удалить удобство"
                    >
                      ×
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
          <button className={`${ui.link} self-start`} type="button" onClick={() => setAmenities([...form.amenities, { ...noText }])}>
            + Добавить удобство
          </button>
          <span className={ui.muted}>Если английское или белорусское название не заполнено, показывается русское.</span>
        </div>
        <div className={ui.priceRow}>
          <label className={`${ui.field} w-40`}>
            Цена, BYN
            <input
              className={ui.input}
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </label>
          <label className={ui.check}>
            <input
              type="checkbox"
              checked={form.priceFrom}
              onChange={(e) => setForm({ ...form, priceFrom: e.target.checked })}
            />
            Писать «от» перед ценой
          </label>
        </div>
        {message && <p className={messageClass(message)}>{message.text}</p>}
        <div className={ui.buttons}>
          <button className={ui.button} type="submit" disabled={busy}>
            {editId ? 'Сохранить' : 'Добавить'}
          </button>
          {editId && (
            <button className={ui.link} type="button" onClick={reset}>
              Отмена
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
