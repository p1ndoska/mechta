import { useEffect, useState } from 'react';
import { api } from './api.js';

const empty = { title: '', description: '', price: '', priceFrom: false };
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

  function reset() {
    setForm(empty);
    setEditId(null);
    setPhoto(null);
    setPreview(null);
    setFileKey((k) => k + 1);
  }

  function edit(room) {
    setForm({ title: room.title, description: room.description, price: String(room.price), priceFrom: room.priceFrom });
    setEditId(room.id);
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
    setBusy(false);
    if (error) {
      setMessage({ ok: false, text: error });
    } else {
      setMessage({ ok: true, text: editId ? `Номер «${form.title}» сохранён` : `Номер «${form.title}» добавлен` });
      reset();
    }
    load();
  }

  async function move(room, direction) {
    const res = await api(`/rooms/${room.id}/move`, { direction });
    if (res.ok) setRooms(res.data);
  }

  async function remove(room) {
    if (!window.confirm(`Удалить номер «${room.title}»?`)) return;
    const res = await api(`/rooms/${room.id}`, undefined, 'DELETE');
    if (res.ok) {
      if (editId === room.id) reset();
      setMessage({ ok: true, text: `Номер «${room.title}» удалён` });
      load();
    } else {
      setMessage({ ok: false, text: res.data?.error || 'Не удалось удалить номер' });
    }
  }

  return (
    <section className="admin__section">
      <p className="admin__muted">Карточки показываются на сайте в блоке «Часто выбирают» в этом порядке.</p>
      {rooms.length > 0 ? (
        <ul className="admin__users">
          {rooms.map((room, i) => (
            <li key={room.id} className="admin__user admin__room">
              {room.photoUrl ? (
                <img className="admin__room-photo" src={room.photoUrl} alt="" />
              ) : (
                <span className="admin__room-photo" />
              )}
              <span className="admin__room-info">
                <span>{room.title}</span>
                <span className="admin__muted">{formatPrice(room)}</span>
              </span>
              <span className="admin__room-actions">
                <button className="admin__icon" type="button" onClick={() => move(room, 'up')} disabled={i === 0} aria-label="Выше">
                  ↑
                </button>
                <button
                  className="admin__icon"
                  type="button"
                  onClick={() => move(room, 'down')}
                  disabled={i === rooms.length - 1}
                  aria-label="Ниже"
                >
                  ↓
                </button>
                <button className="admin__link" type="button" onClick={() => edit(room)}>
                  Изменить
                </button>
                <button className="admin__link" type="button" onClick={() => remove(room)}>
                  Удалить
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin__muted">Номеров пока нет. Пока их нет, блок на сайте не показывается.</p>
      )}

      <form className="admin__room-form" onSubmit={save}>
        <h2 className="admin__subtitle">{editId ? 'Изменить номер' : 'Добавить номер'}</h2>
        <div className="admin__room-photo-field">
          {preview ? <img className="admin__room-preview" src={preview} alt="" /> : <span className="admin__room-preview" />}
          <label className="admin__field">
            Фото
            <input key={fileKey} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} />
          </label>
        </div>
        <label className="admin__field">
          Название
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} required />
        </label>
        <label className="admin__field">
          Описание
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={500}
            rows={3}
          />
        </label>
        <div className="admin__room-price">
          <label className="admin__field">
            Цена, BYN
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </label>
          <label className="admin__check">
            <input
              type="checkbox"
              checked={form.priceFrom}
              onChange={(e) => setForm({ ...form, priceFrom: e.target.checked })}
            />
            Писать «от» перед ценой
          </label>
        </div>
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
