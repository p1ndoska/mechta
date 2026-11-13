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
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await api('/login', { login, password });
    setBusy(false);
    if (res.ok) onLogin(res.data.login);
    else setError(res.data?.error || 'Не удалось войти');
  }

  return (
    <form className="admin__card" onSubmit={submit}>
      <h1 className="admin__title">Вход в панель администратора</h1>
      <label className="admin__field">
        Логин
        <input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" autoFocus required />
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
      <h2 className="admin__subtitle">Смена пароля</h2>
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

function UsersSection({ currentLogin }) {
  const [users, setUsers] = useState([]);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
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
    const res = await api('/users', { login, password });
    if (res.ok) {
      setLogin('');
      setPassword('');
      setMessage({ ok: true, text: `Пользователь ${res.data.login} добавлен` });
      load();
    } else {
      setMessage({ ok: false, text: res.data?.error || 'Не удалось добавить пользователя' });
    }
  }

  async function remove(user) {
    if (!window.confirm(`Удалить пользователя ${user.login}?`)) return;
    const res = await api(`/users/${user.id}`, undefined, 'DELETE');
    if (res.ok) {
      setMessage({ ok: true, text: `Пользователь ${user.login} удалён` });
      load();
    } else {
      setMessage({ ok: false, text: res.data?.error || 'Не удалось удалить пользователя' });
    }
  }

  return (
    <section className="admin__section">
      <h2 className="admin__subtitle">Пользователи</h2>
      <ul className="admin__users">
        {users.map((user) => (
          <li key={user.id} className="admin__user">
            <span>{user.login}</span>
            <span className="admin__muted">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
            {user.login === currentLogin ? (
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
          Логин
          <input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="off" required />
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
        <button className="admin__button" type="submit">
          Добавить
        </button>
      </form>
      {message && <p className={message.ok ? 'admin__success' : 'admin__error'}>{message.text}</p>}
    </section>
  );
}

export default function Admin() {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    document.title = 'Панель администратора — гостиница «Мечта»';
    api('/me').then((res) => {
      if (res.ok) setState({ status: 'in', login: res.data.login });
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
      {state.status === 'out' && <LoginForm onLogin={(login) => setState({ status: 'in', login })} />}
      {state.status === 'in' && (
        <div className="admin__card admin__card--wide">
          <div className="admin__top">
            <h1 className="admin__title">Панель администратора</h1>
            <span className="admin__muted">{state.login}</span>
            <button className="admin__link" type="button" onClick={logout}>
              Выйти
            </button>
          </div>
          <p>Вы вошли в панель администратора гостиницы «Мечта».</p>
          <UsersSection currentLogin={state.login} />
          <PasswordForm />
        </div>
      )}
    </div>
  );
}
