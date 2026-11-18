import { useEffect, useState } from 'react';
import { getConsent, setConsent } from '../consent.js';

const button = 'cursor-pointer rounded-full px-6 py-2.5 text-[14px] font-semibold transition-colors duration-200 max-sm:flex-1';

// Надписи меняются в панели администратора, вкладка «Тексты сайта»
export default function CookieBanner({ lang, onAccept }) {
  const [open, setOpen] = useState(() => getConsent() === null);
  const [texts, setTexts] = useState(null);

  useEffect(() => {
    if (!open) return;
    fetch('/api/texts')
      .then((res) => (res.ok ? res.json() : null))
      .then(setTexts)
      .catch(() => {});
  }, [open]);

  if (!open || !texts) return null;
  const t = (key) => texts[key]?.[lang] || texts[key]?.ru || '';

  const choose = (value) => {
    setConsent(value);
    if (value === 'accepted') onAccept();
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-[960px] items-center gap-6 rounded-lg border border-line bg-white px-6 py-4 shadow-menu max-lg:flex-col max-lg:items-stretch max-lg:gap-3.5 max-sm:inset-x-2 max-sm:bottom-2 max-sm:px-4"
      role="dialog"
      aria-live="polite"
      aria-label="Cookie"
    >
      <p className="flex-1 text-[14px] leading-[1.5] text-ink">{t('cookies.text')}</p>
      <div className="flex shrink-0 gap-2.5">
        <button type="button" className={`${button} border border-line bg-white text-ink hover:bg-admin-bg`} onClick={() => choose('rejected')}>
          {t('cookies.reject')}
        </button>
        <button type="button" className={`${button} border border-olive bg-olive text-white hover:bg-olive-hover`} onClick={() => choose('accepted')}>
          {t('cookies.accept')}
        </button>
      </div>
    </div>
  );
}
