// Согласие на cookie хранится в cookie cookie_consent на год: accepted или rejected.
// Без согласия сайт ничего не сохраняет в браузере, кроме самого выбора.
// Необходимые cookie (вход в панель администратора) работают всегда.
const NAME = 'cookie_consent';
const MAX_AGE = 365 * 24 * 60 * 60;
const OPTIONAL_STORAGE = ['lang'];

export const CONSENT_EVENT = 'cookie-consent';

export function getConsent() {
  const value = document.cookie.match(new RegExp(`(?:^|;\\s*)${NAME}=(accepted|rejected)`))?.[1];
  return value ?? null;
}

export const canStore = () => getConsent() === 'accepted';

function clearOptional() {
  OPTIONAL_STORAGE.forEach((key) => localStorage.removeItem(key));
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim();
    if (name && name !== NAME) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

export function setConsent(value) {
  document.cookie = `${NAME}=${value}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax`;
  if (value === 'rejected') clearOptional();
  // Сюда можно подписать счётчики (например, Яндекс Метрику), чтобы запускать их только после согласия
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}
