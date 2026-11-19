import { useEffect, useState } from 'react';
import { pick } from './Rooms.jsx';

const texts = {
  ru: {
    title: 'Бронирование номера',
    firstName: 'Имя',
    firstNameHint: 'Введите имя',
    lastName: 'Фамилия',
    lastNameHint: 'Введите фамилию',
    email: 'Email',
    emailHint: 'Введите email',
    phone: 'Номер телефона',
    phoneHint: 'Введите номер телефона для обратной связи',
    room: 'Категория',
    roomHint: 'Выберите категорию из списка',
    tariff: 'Тариф',
    checkIn: 'Дата заезда',
    checkOut: 'Дата выезда',
    checkOutHint: 'Можно продлить по факту проживания',
    wishes: 'Ваши пожелания',
    consent: 'Я согласен(на) на обработку персональных данных в соответствии с',
    consentLink: 'политикой',
    send: 'Отправить заявку',
    sending: 'Отправка…',
    close: 'Закрыть',
    done: 'Спасибо! Заявка отправлена, мы свяжемся с вами для подтверждения.',
    errors: {
      name: 'Укажите имя и фамилию',
      email: 'Проверьте email',
      phone: 'Проверьте номер телефона',
      room: 'Выберите категорию',
      tariff: 'Не удалось определить тариф',
      checkIn: 'Проверьте дату заезда',
      checkOut: 'Дата выезда должна быть позже даты заезда',
      wishes: 'Пожелания: не длиннее 1000 символов',
      consent: 'Нужно согласие на обработку персональных данных',
      tooMany: 'Слишком много заявок, попробуйте позже',
      failed: 'Не удалось отправить заявку, попробуйте позже',
    },
  },
  en: {
    title: 'Room booking',
    firstName: 'First name',
    firstNameHint: 'Enter your first name',
    lastName: 'Last name',
    lastNameHint: 'Enter your last name',
    email: 'Email',
    emailHint: 'Enter your email',
    phone: 'Phone number',
    phoneHint: 'Enter a phone number for contact',
    room: 'Category',
    roomHint: 'Choose a category from the list',
    tariff: 'Rate',
    checkIn: 'Check-in date',
    checkOut: 'Check-out date',
    checkOutHint: 'You can extend your stay on site',
    wishes: 'Your wishes',
    consent: 'I agree to the processing of my personal data in accordance with the',
    consentLink: 'policy',
    send: 'Send request',
    sending: 'Sending…',
    close: 'Close',
    done: 'Thank you! Your request has been sent, we will contact you to confirm.',
    errors: {
      name: 'Enter your first and last name',
      email: 'Check your email',
      phone: 'Check your phone number',
      room: 'Choose a category',
      tariff: 'Could not determine the rate',
      checkIn: 'Check the check-in date',
      checkOut: 'Check-out must be after check-in',
      wishes: 'Wishes: up to 1000 characters',
      consent: 'Consent to personal data processing is required',
      tooMany: 'Too many requests, please try later',
      failed: 'Could not send the request, please try later',
    },
  },
  be: {
    title: 'Браніраванне нумара',
    firstName: 'Імя',
    firstNameHint: 'Увядзіце імя',
    lastName: 'Прозвішча',
    lastNameHint: 'Увядзіце прозвішча',
    email: 'Email',
    emailHint: 'Увядзіце email',
    phone: 'Нумар тэлефона',
    phoneHint: 'Увядзіце нумар тэлефона для зваротнай сувязі',
    room: 'Катэгорыя',
    roomHint: 'Выберыце катэгорыю са спіса',
    tariff: 'Тарыф',
    checkIn: 'Дата заезду',
    checkOut: 'Дата выезду',
    checkOutHint: 'Можна падоўжыць па факце пражывання',
    wishes: 'Вашы пажаданні',
    consent: 'Я згодны(на) на апрацоўку персанальных даных у адпаведнасці з',
    consentLink: 'палітыкай',
    send: 'Адправіць заяўку',
    sending: 'Адпраўка…',
    close: 'Закрыць',
    done: 'Дзякуй! Заяўка адпраўлена, мы звяжамся з вамі для пацвярджэння.',
    errors: {
      name: 'Пакажыце імя і прозвішча',
      email: 'Праверце email',
      phone: 'Праверце нумар тэлефона',
      room: 'Выберыце катэгорыю',
      tariff: 'Не атрымалася вызначыць тарыф',
      checkIn: 'Праверце дату заезду',
      checkOut: 'Дата выезду павінна быць пазней за дату заезду',
      wishes: 'Пажаданні: не даўжэй за 1000 сімвалаў',
      consent: 'Патрэбна згода на апрацоўку персанальных даных',
      tooMany: 'Занадта шмат заявак, паспрабуйце пазней',
      failed: 'Не атрымалася адправіць заяўку, паспрабуйце пазней',
    },
  },
};

const input =
  'w-full rounded-md border border-form-line bg-white px-4 py-2.5 text-[15px] font-normal text-ink placeholder:text-form-placeholder focus:border-room-accent focus:outline-none';
const label = 'flex min-w-0 flex-col gap-2 text-[14px] font-semibold text-ink';
const button =
  'cursor-pointer rounded-full bg-forest px-7 py-3 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-forest-hover disabled:cursor-default disabled:opacity-60';

// Локальная дата ГГГГ-ММ-ДД со сдвигом в днях
function isoDate(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nextDay(value) {
  const d = new Date(`${value}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function Label({ text, required }) {
  return (
    <span>
      {text}
      {required && <span className="ml-1 text-required">*</span>}
    </span>
  );
}

// Окно «Забронировать»: заявка сохраняется в панели администратора, вкладка «Заявки»
export default function BookingForm({ lang, roomId, tariff, onClose }) {
  const t = texts[lang];
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roomId: roomId ? String(roomId) : '',
    checkIn: '',
    checkOut: '',
    wishes: '',
    consent: false,
  });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch('/api/rooms')
      .then((res) => (res.ok ? res.json() : []))
      .then(setRooms)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const room = rooms.find((r) => String(r.id) === form.roomId);
  const tariffName = tariff && room?.id === roomId ? `${tariff.price} BYN — ${pick(tariff.name, lang)}` : '';

  async function submit(e) {
    e.preventDefault();
    setStatus('sending');
    const body = {
      ...form,
      roomId: Number(form.roomId),
      tariff: tariff && room?.id === roomId ? `${tariff.price} BYN — ${tariff.name.ru}` : '',
    };
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      setStatus(res.ok ? 'done' : { error: t.errors[data?.error] || t.errors.failed });
    } catch {
      setStatus({ error: t.errors.failed });
    }
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto bg-modal-backdrop px-4 py-10 max-sm:px-2 max-sm:py-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
      onClick={onClose}
    >
      <div className="relative w-full max-w-[760px] rounded-lg bg-white px-10 pt-8 pb-9 text-left shadow-card max-sm:px-5 max-sm:pt-6" onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute top-3 right-4 cursor-pointer border-0 bg-transparent text-[32px] leading-none text-ink-muted hover:text-ink"
          type="button"
          onClick={onClose}
          aria-label={t.close}
        >
          ×
        </button>
        <h2 id="booking-title" className="mb-6 pr-8 text-[24px] font-semibold text-room-accent">
          {t.title}
        </h2>
        {status === 'done' ? (
          <>
            <p className="text-[16px] leading-[1.6] text-ink">{t.done}</p>
            <button className={`${button} mt-6`} type="button" onClick={onClose}>
              {t.close}
            </button>
          </>
        ) : (
          <form className="flex flex-col gap-5" onSubmit={submit}>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <label className={label}>
                <Label text={t.firstName} required />
                <input className={input} value={form.firstName} onChange={set('firstName')} placeholder={t.firstNameHint} autoComplete="given-name" maxLength={60} required />
              </label>
              <label className={label}>
                <Label text={t.lastName} required />
                <input className={input} value={form.lastName} onChange={set('lastName')} placeholder={t.lastNameHint} autoComplete="family-name" maxLength={60} required />
              </label>
            </div>
            <label className={label}>
              <Label text={t.email} required />
              <input className={input} type="email" value={form.email} onChange={set('email')} placeholder={t.emailHint} autoComplete="email" maxLength={120} required />
            </label>
            <label className={label}>
              <Label text={t.phone} />
              <input className={input} type="tel" value={form.phone} onChange={set('phone')} placeholder={t.phoneHint} autoComplete="tel" maxLength={30} />
            </label>
            <label className={label}>
              <Label text={t.room} required />
              <select className={`${input} py-3 ${form.roomId ? '' : 'text-form-placeholder'}`} value={form.roomId} onChange={set('roomId')} required>
                <option value="" disabled>
                  {t.roomHint}
                </option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id} className="text-ink">
                    {pick(r.title, lang)}
                  </option>
                ))}
              </select>
            </label>
            {tariffName && (
              <p className="-mt-2 text-[14px] text-ink-muted">
                {t.tariff}: {tariffName}
              </p>
            )}
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <label className={label}>
                <Label text={t.checkIn} required />
                <input className={input} type="date" value={form.checkIn} onChange={set('checkIn')} min={isoDate()} required />
              </label>
              <label className={label}>
                <Label text={t.checkOut} required />
                <input
                  className={input}
                  type="date"
                  value={form.checkOut}
                  onChange={set('checkOut')}
                  min={form.checkIn ? nextDay(form.checkIn) : isoDate(1)}
                  required
                />
                <span className="text-[13px] font-normal text-form-placeholder">{t.checkOutHint}</span>
              </label>
            </div>
            <label className={label}>
              <Label text={t.wishes} />
              <textarea className={`${input} min-h-[90px] resize-y`} value={form.wishes} onChange={set('wishes')} maxLength={1000} rows={3} />
            </label>
            <label className="flex items-start gap-2.5 text-[14px] leading-[1.5] text-ink-muted">
              <input className="mt-1 size-4 shrink-0 accent-forest" type="checkbox" checked={form.consent} onChange={set('consent')} required />
              <span>
                {t.consent}{' '}
                <a className="text-room-accent underline" href="/personal-data" target="_blank" rel="noreferrer">
                  {t.consentLink}
                </a>
                <span className="ml-1 text-required">*</span>
              </span>
            </label>
            {status?.error && <p className="text-[14px] text-error">{status.error}</p>}
            <div>
              <button className={button} type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? t.sending : t.send}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
