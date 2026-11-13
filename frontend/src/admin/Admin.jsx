import { useEffect, useState } from 'react';
import './Admin.css';

async function api(path, body, method) {
  const res = await fetch(`/api/admin${path}`, {
    method: method || (body ? 'POST' : 'GET'),
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

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
    if (res.ok) onLogin(res.data);
    else setError(res.data?.error || 'Не удалось войти');
  }

  return (
    <form className="admin__card" onSubmit={submit}>
      <h1 className="admin__title">Вход в панель администратора</h1>
      <label className="admin__field">
        Имя
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" autoFocus required />
      </label>
      <label className="admin__field">
        Пароль
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {error && <p className="admin__error">{error}</p>}
      <button className="admin__button" type="submit" disabled={busy}>
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
    <form className="admin__section" onSubmit={submit}>
      <label className="admin__field">
        Текущий пароль
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      <label className="admin__field">
        Новый пароль
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNew(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      {message && <p className={message.ok ? 'admin__success' : 'admin__error'}>{message.text}</p>}
      <button className="admin__button" type="submit">
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
    <section className="admin__section">
      <ul className="admin__users">
        {users.map((user) => (
          <li key={user.id} className="admin__user">
            <span>{user.name}</span>
            <span className="admin__muted">{roles[user.role]}</span>
            <span className="admin__muted">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
            {user.name === currentName ? (
              <span className="admin__muted admin__user-action">это вы</span>
            ) : (
              <button className="admin__link admin__user-action" type="button" onClick={() => remove(user)}>
                Удалить
              </button>
            )}
          </li>
        ))}
      </ul>
      <form className="admin__inline-form" onSubmit={add}>
        <label className="admin__field">
          Имя
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" required />
        </label>
        <label className="admin__field">
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="admin__field">
          Роль
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.entries(roles).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button className="admin__button" type="submit">
          Добавить
        </button>
      </form>
      {message && <p className={message.ok ? 'admin__success' : 'admin__error'}>{message.text}</p>}
    </section>
  );
}

const tabs = [
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
      <div className="admin__tabs" role="tablist">
        {available.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`admin__tab${tab.id === active ? ' admin__tab--active' : ''}`}
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
    api('/me').then((res) => {
      if (res.ok) setState({ status: 'in', ...res.data });
      else if (res.status === 403) setState({ status: 'forbidden' });
      else setState({ status: 'out' });
    });
  }, []);

  async function logout() {
    await api('/logout', {});
    setState({ status: 'out' });
  }

  return (
    <div className="admin">
      {state.status === 'loading' && <p className="admin__muted">Загрузка…</p>}
      {state.status === 'forbidden' && (
        <div className="admin__card">
          <h1 className="admin__title">403</h1>
          <p>Доступ запрещён</p>
        </div>
      )}
      {state.status === 'out' && <LoginForm onLogin={(user) => setState({ status: 'in', ...user })} />}
      {state.status === 'in' && (
        <div className="admin__card admin__card--wide">
          <div className="admin__top">
            <h1 className="admin__title">Панель администратора</h1>
            <span className="admin__muted">
              {state.name} · {roles[state.role]}
            </span>
            <button className="admin__link" type="button" onClick={logout}>
              Выйти
            </button>
          </div>
          <Tabs state={state} />
        </div>
      )}
    </div>
  );
}
