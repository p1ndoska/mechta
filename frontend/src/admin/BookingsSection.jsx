import { useEffect, useState } from 'react';
import { api } from './api.js';
import { messageClass, ui } from './ui.js';

const date = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('ru-RU');

// Заявки из формы «Забронировать», новые сверху
export default function BookingsSection() {
  const [items, setItems] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api('/bookings').then((res) => setItems(res.ok ? res.data : []));
  }, []);

  async function toggle(item) {
    const res = await api(`/bookings/${item.id}`, { done: !item.done }, 'PUT');
    if (res.ok) setItems(res.data);
  }

  async function remove(item) {
    if (!window.confirm(`Удалить заявку ${item.firstName} ${item.lastName}?`)) return;
    const res = await api(`/bookings/${item.id}`, undefined, 'DELETE');
    if (res.ok) {
      setItems(res.data);
      setMessage({ ok: true, text: 'Заявка удалена' });
    } else {
      setMessage({ ok: false, text: res.data?.error || 'Не удалось удалить заявку' });
    }
  }

  if (items === null) return <p className={ui.muted}>Загрузка…</p>;

  return (
    <section className={ui.section}>
      {items.length === 0 ? (
        <p className={ui.muted}>Заявок пока нет</p>
      ) : (
        <ul className={ui.list}>
          {items.map((item) => (
            <li key={item.id} className={`${ui.booking} ${item.done ? ui.bookingDone : ''}`}>
              <div className={ui.bookingTop}>
                <b>
                  {item.firstName} {item.lastName}
                </b>
                <span className={ui.muted}>{new Date(item.createdAt).toLocaleString('ru-RU')}</span>
                {item.done && <span className={ui.success}>обработана</span>}
              </div>
              <span>
                <a className={ui.link} href={`mailto:${item.email}`}>
                  {item.email}
                </a>
                {item.phone && (
                  <>
                    {' · '}
                    <a className={ui.link} href={`tel:${item.phone.replace(/[^\d+]/g, '')}`}>
                      {item.phone}
                    </a>
                  </>
                )}
              </span>
              <span>
                {item.roomTitle}
                {item.tariff && ` · тариф ${item.tariff}`}
              </span>
              <span>
                {date(item.checkIn)} — {date(item.checkOut)}
              </span>
              {item.wishes && <span className="whitespace-pre-line text-admin-muted">{item.wishes}</span>}
              <div className={`${ui.buttons} mt-1`}>
                <button className={`${ui.link} text-[14px]`} type="button" onClick={() => toggle(item)}>
                  {item.done ? 'Вернуть в новые' : 'Отметить обработанной'}
                </button>
                <button className={`${ui.link} text-[14px]`} type="button" onClick={() => remove(item)}>
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {message && <p className={messageClass(message)}>{message.text}</p>}
    </section>
  );
}
