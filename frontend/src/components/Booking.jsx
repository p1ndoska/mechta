import { useEffect, useState } from 'react';

// Надписи меняются в панели администратора, вкладка «Тексты сайта»
export default function Booking({ lang }) {
  const [texts, setTexts] = useState(null);

  useEffect(() => {
    fetch('/api/texts')
      .then((res) => (res.ok ? res.json() : null))
      .then(setTexts)
      .catch(() => {});
  }, []);

  if (!texts) return null;
  const t = (key) => texts[key]?.[lang] || texts[key]?.ru || '';

  return (
    <section
      className="relative flex min-h-[300px] items-center justify-center bg-dusk bg-(image:--image-booking) bg-cover bg-center bg-no-repeat px-6 py-12 text-center before:absolute before:inset-0 before:bg-booking-tint before:backdrop-brightness-[0.6] before:backdrop-saturate-[0.6] max-lg:min-h-[260px] max-lg:px-4 max-lg:py-9"
      id="booking"
    >
      <div className="relative max-w-[900px]">
        <h2 className="mb-3.5 text-[length:clamp(24px,2.4vw,40px)] leading-[1.2] font-medium text-cream max-lg:mb-2.5 max-lg:text-[length:clamp(20px,5vw,26px)]">
          {t('booking.title')}
        </h2>
        <p className="mx-auto mb-7 max-w-[620px] text-[length:clamp(12px,1vw,15px)] leading-[1.6] text-cream-text max-lg:mb-[18px] max-lg:text-[13px] max-lg:leading-[1.5]">
          {t('booking.text')}
        </p>
        <a
          href="/rooms"
          className="inline-block rounded-full bg-button-light px-[26px] py-2.5 text-[length:clamp(12px,0.9vw,14px)] font-semibold text-espresso transition-colors duration-200 hover:bg-button-light-hover max-lg:px-5 max-lg:py-[9px] max-lg:text-[13px]"
        >
          {t('booking.button')}
        </a>
      </div>
    </section>
  );
}
