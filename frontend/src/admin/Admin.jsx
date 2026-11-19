import { useEffect, useState } from 'react';
import { api, refresh, setAccessToken } from './api.js';
import { messageClass, ui } from './ui.js';
import RoomsSection from './RoomsSection.jsx';
import TextsSection from './TextsSection.jsx';
import DiscountsSection from './DiscountsSection.jsx';
import BookingsSection from './BookingsSection.jsx';


function LoginForm({ onLogin }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await api('/login', { name, password });
    setBusy(false);
    if (res.ok) {
      setAccessToken(res.data.accessToken);
      onLogin(res.data);
    }
    else setError(res.data?.error || 'Не удалось войти');
  }

  return (
    <form className={ui.card} onSubmit={submit}>
      <h1 className={ui.title}>Вход в панель администратора</h1>
      <label className={ui.field}>
        Имя
        <input className={ui.input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" autoFocus required />
      </label>
      <label className={ui.field}>
        Пароль
        <input
          className={ui.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {error && <p className={ui.error}>{error}</p>}
      <button className={ui.button} type="submit" disabled={busy}>
        Войти
      </button>
    </form>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [message, setMessage] = useState(null);

  async function submit(e) {
    e.preventDefault();
    const res = await api('/password', { currentPassword, newPassword });
    if (res.ok) {
      setCurrent('');
      setNew('');
      setMessage({ ok: true, text: 'Пароль изменён' });
    } else {
      setMessage({ ok: false, text: res.data?.error || 'Не удалось изменить пароль' });
    }
  }

  return (
    <form className={ui.section} onSubmit={submit}>
      <label className={ui.field}>
        Текущий пароль
        <input
          className={ui.input}
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <label className={ui.field}>
        Новый пароль
        <input
          className={ui.input}
          type="password"
          value={newPassword}
          onChange={(e) => setNew(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      {message && <p className={messageClass(message)}>{message.text}</p>}
      <button className={ui.button} type="submit">
        Сменить пароль
      </button>
    </form>
  );
}

const roles = {
  ADMIN: 'Администратор',
  EDITOR: 'Редактор',
};

function UsersSection({ currentName }) {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('EDITOR');
  const [message, setMessage] = useState(null);

  async function load() {
    const res = await api('/users');
    if (res.ok) setUsers(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    const res = await api('/users', { name, password, role });
    if (res.ok) {
      setName('');
      setPassword('');
      setRole('EDITOR');
      setMessage({ ok: true, text: `Пользователь ${res.data.name} добавлен` });
      load();
    } else {
      setMessage({ ok: false, text: res.data?.error || 'Не удалось добавить пользователя' });
    }
  }

  async function remove(user) {
    if (!window.confirm(`Удалить пользователя ${user.name}?`)) return;
    const res = await api(`/users/${user.id}`, undefined, 'DELETE');
    if (res.ok) {
      setMessage({ ok: true, text: `Пользователь ${user.name} удалён` });
      load();
    } else {
      setMessage({ ok: false, text: res.data?.error || 'Не удалось удалить пользователя' });
    }
  }

  return (
    <section className={ui.section}>
      <ul className={ui.list}>
        {users.map((user) => (
          <li key={user.id} className={`${ui.row} items-baseline`}>
            <span>{user.name}</span>
            <span className={ui.muted}>{roles[user.role]}</span>
            <span className={ui.muted}>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
            {user.name === currentName ? (
              <span className={`${ui.muted} ml-auto`}>это вы</span>
            ) : (
              <button className={`${ui.link} ml-auto text-[14px]`} type="button" onClick={() => remove(user)}>
                Удалить
              </button>
            )}
          </li>
        ))}
      </ul>
      <form className={ui.inlineForm} onSubmit={add}>
        <label className={ui.field}>
          Имя
          <input className={ui.input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" required />
        </label>
        <label className={ui.field}>
          Пароль
          <input
            className={ui.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className={ui.field}>
          Роль
          <select className={ui.input} value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.entries(roles).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button className={ui.button} type="submit">
          Добавить
        </button>
      </form>
      {message && <p className={messageClass(message)}>{message.text}</p>}
    </section>
  );
}

const tabs = [
  { id: 'bookings', label: 'Заявки' },
  { id: 'rooms', label: 'Номера' },
  { id: 'discounts', label: 'Скидки' },
  { id: 'texts', label: 'Тексты сайта' },
  { id: 'users', label: 'Пользователи', adminOnly: true },
  { id: 'password', label: 'Смена пароля' },
];

function Tabs({ state }) {
  const available = tabs.filter((tab) => !tab.adminOnly || state.role === 'ADMIN');
  const fromHash = () => {
    const id = window.location.hash.slice(1);
    return available.some((tab) => tab.id === id) ? id : available[0].id;
  };
  const [active, setActive] = useState(fromHash);

  useEffect(() => {
    const onHash = () => setActive(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  });

  function open(id) {
    setActive(id);
    window.history.replaceState(null, '', `#${id}`);
  }

  return (
    <>
      <div className={ui.tabs} role="tablist">
        {available.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`${ui.tab} ${tab.id === active ? ui.tabActive : ui.tabIdle}`}
            type="button"
            role="tab"
            aria-selected={tab.id === active}
            aria-controls={`panel-${tab.id}`}
            onClick={() => open(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div id={`panel-${active}`} role="tabpanel" aria-labelledby={`tab-${active}`}>
        {active === 'bookings' && <BookingsSection />}
        {active === 'rooms' && <RoomsSection />}
        {active === 'discounts' && <DiscountsSection />}
        {active === 'texts' && <TextsSection />}
        {active === 'users' && <UsersSection currentName={state.name} />}
        {active === 'password' && <PasswordForm />}
      </div>
    </>
  );
}

export default function Admin() {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    document.title = 'Панель администратора — гостиница «Мечта»';
    refresh().then((res) => {
      if (res.ok) setState({ status: 'in', name: res.data.name, role: res.data.role });
      else if (res.status === 403) setState({ status: 'forbidden' });
      else setState({ status: 'out' });
    });
  }, []);

  async function logout() {
    await api('/logout', {});
    setAccessToken(null);
    setState({ status: 'out' });
  }

  return (
    <div className={ui.page}>
      {state.status === 'loading' && <p className={ui.muted}>Загрузка…</p>}
      {state.status === 'forbidden' && (
        <div className={ui.card}>
          <h1 className={ui.title}>403</h1>
          <p>Доступ запрещён</p>
        </div>
      )}
      {state.status === 'out' && <LoginForm onLogin={(user) => setState({ status: 'in', name: user.name, role: user.role })} />}
      {state.status === 'in' && (
        <div className={ui.cardWide}>
          <div className={ui.top}>
            <h1 className={`${ui.title} max-md:basis-full`}>Панель администратора</h1>
            <span className={`${ui.muted} ml-auto max-md:ml-0`}>
              {state.name} · {roles[state.role]}
            </span>
            <button className={`${ui.link} max-md:ml-auto`} type="button" onClick={logout}>
              Выйти
            </button>
          </div>
          <Tabs state={state} />
        </div>
      )}
    </div>
  );
}
