import { useEffect, useState } from 'react';
import { CONSENT_EVENT, canStore } from '../consent.js';

const icons = {
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  email: 'M2 5h20v14H2zm2 2v.5l8 5 8-5V7l-8 5z',
  pin: 'M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7m0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5',
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 fill-burgundy" aria-hidden="true">
      <path d={icons[name]} />
    </svg>
  );
}

// Карта Яндекса ставит свои cookie, поэтому она загружается после «Принять» или по кнопке
function Map({ coords, text, button }) {
  const [show, setShow] = useState(canStore);

  useEffect(() => {
    const onConsent = (e) => e.detail === 'accepted' && setShow(true);
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  const [lat, lon] = coords.split(',').map((part) => part.trim());
  const point = `${lon},${lat}`;

  return (
    <div className="rounded-xl bg-map-card p-4 max-sm:p-3">
      {show ? (
        <iframe
          className="block aspect-4/3 w-full border-0"
          src={`https://yandex.ru/map-widget/v1/?ll=${point}&z=15&pt=${point},pm2rdm`}
          title="Яндекс Карты"
          loading="lazy"
          allowFullScreen
        />
      ) : (
        <div className="flex aspect-4/3 flex-col items-center justify-center gap-4 px-4 text-center text-[14px] text-ink">
          <p>{text}</p>
          <button
            type="button"
            className="cursor-pointer rounded-full bg-olive px-6 py-2.5 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-olive-hover"
            onClick={() => setShow(true)}
          >
            {button}
          </button>
        </div>
      )}
    </div>
  );
}

// Надписи меняются в панели администратора, вкладка «Тексты сайта»
// Шапка, фото и блок «Связаться» вместе занимают высоту экрана; под шапкой фото — 2 части, зелёный блок — 3
export default function ContactsPage({ lang, header }) {
  const [texts, setTexts] = useState(null);

  useEffect(() => {
    fetch('/api/texts')
      .then((res) => (res.ok ? res.json() : null))
      .then(setTexts)
      .catch(() => {});
  }, []);

  if (!texts) return header;
  const t = (key) => texts[key]?.[lang] || texts[key]?.ru || '';

  const items = [
    ['phone', 'phone', `tel:${t('contacts.phone').replace(/[^\d+]/g, '')}`],
    ['email', 'email', `mailto:${t('contacts.email')}`],
    ['address', 'pin'],
    ['coords', 'pin'],
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      {header}
      <section className="relative flex flex-[2] flex-col items-center justify-center bg-forest bg-(image:--image-contacts) bg-cover bg-center bg-no-repeat px-6 py-12 text-center min-h-[200px] before:absolute before:inset-0 before:bg-contacts-tint before:backdrop-brightness-[0.75] max-lg:px-4 max-lg:py-9">
        <h1 className="relative mb-3 text-[length:clamp(28px,2.6vw,40px)] leading-[1.2] font-medium text-cream">{t('contacts.title')}</h1>
        <p className="relative text-[13px] text-cream-text">{t('contacts.subtitle')}</p>
      </section>

      <section className="flex flex-[3] items-center bg-olive px-6 py-14 max-lg:px-4 max-lg:py-10">
        <div className="mx-auto grid w-full max-w-[880px] grid-cols-[1fr_minmax(0,420px)] items-start gap-16 max-lg:grid-cols-1 max-lg:gap-8">
          <div>
            <h2 className="mb-6 text-[30px] leading-[1.2] font-medium text-cream max-lg:text-[26px]">{t('contacts.heading')}</h2>
            <dl className="flex flex-col gap-5 text-[14px] text-cream-text">
              {items.map(([key, icon, href]) => (
                <div key={key}>
                  <dt className="mb-1.5 flex items-center gap-1.5 font-semibold text-white">
                    <Icon name={icon} />
                    {t(`contacts.${key}.label`)}
                  </dt>
                  <dd>{href ? <a href={href} className="hover:underline">{t(`contacts.${key}`)}</a> : t(`contacts.${key}`)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <Map coords={t('contacts.coords')} text={t('contacts.map.text')} button={t('contacts.map.button')} />
        </div>
      </section>
    </div>
  );
}
