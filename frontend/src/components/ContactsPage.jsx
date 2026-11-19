import { useEffect, useState } from 'react';
import { CONSENT_EVENT, canStore } from '../consent.js';

const icons = {
  phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z',
  email: 'M2 5h20v14H2zm2 2v.5l8 5 8-5V7l-8 5z',
  pin: 'M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7m0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5',
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px] shrink-0 fill-burgundy max-lg:size-4" aria-hidden="true">
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
    <div className="rounded-2xl bg-map-card p-5 max-sm:p-3">
      {show ? (
        <iframe
          className="block h-[clamp(320px,calc(100dvh-400px),680px)] w-full rounded-lg border-0 max-lg:aspect-4/3 max-lg:h-auto"
          src={`https://yandex.ru/map-widget/v1/?ll=${point}&z=15&pt=${point},pm2rdm`}
          title="Яндекс Карты"
          loading="lazy"
          allowFullScreen
        />
      ) : (
        <div className="flex h-[clamp(320px,calc(100dvh-400px),680px)] flex-col items-center justify-center max-lg:aspect-4/3 max-lg:h-auto gap-4 px-4 text-center text-[16px] text-ink">
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
      <section className="relative flex flex-[2] flex-col items-center justify-center bg-forest bg-(image:--image-contacts) bg-cover bg-center bg-no-repeat px-6 py-8 text-center min-h-[160px] max-lg:min-h-[200px] before:absolute before:inset-0 before:bg-contacts-tint before:backdrop-brightness-[0.75] max-lg:px-4 max-lg:py-9">
        <h1 className="relative mb-3 text-[length:clamp(30px,3.2vw,48px)] leading-[1.2] font-medium text-cream">{t('contacts.title')}</h1>
        <p className="relative text-[16px] text-cream-text max-lg:text-[15px]">{t('contacts.subtitle')}</p>
      </section>

      <section className="flex flex-[3] items-center bg-olive px-6 py-8 max-lg:px-4 max-lg:py-10">
        <div className="mx-auto grid w-full max-w-content grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-12 max-xl:gap-8 max-lg:grid-cols-1 max-lg:gap-8">
          <div>
            <h2 className="mb-8 text-title leading-[1.2] font-medium text-cream max-lg:mb-6 max-lg:text-title-sm">{t('contacts.heading')}</h2>
            <dl className="flex flex-col gap-6 text-[18px] text-cream-text max-lg:gap-5 max-lg:text-[16px]">
              {items.map(([key, icon, href]) => (
                <div key={key}>
                  <dt className="mb-1.5 flex items-center gap-2 font-semibold text-white">
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
