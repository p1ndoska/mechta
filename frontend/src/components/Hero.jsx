
const texts = {
  ru: {
    title: 'Гостиница «Мечта» — место, где мечты сбываются',
    text: 'Уют, спокойствие и удобное расположение рядом с аэропортом Брест. Идеальный выбор для путешественников и гостей города.',
    button: 'Выбрать номер для проживания!',
  },
  en: {
    title: 'Hotel «Mechta» — where dreams come true',
    text: 'Comfort, peace and a convenient location next to Brest Airport. The perfect choice for travellers and city guests.',
    button: 'Choose a room!',
  },
  be: {
    title: 'Гасцініца «Мечта» — месца, дзе мары збываюцца',
    text: 'Утульнасць, спакой і зручнае размяшчэнне побач з аэрапортам Брэст. Ідэальны выбар для падарожнікаў і гасцей горада.',
    button: 'Выбраць нумар для пражывання!',
  },
};

export default function Hero({ lang }) {
  const t = texts[lang];

  return (
    <section
      className="relative flex flex-1 items-center justify-center bg-photo-fallback bg-(image:--image-hero) bg-cover bg-center bg-no-repeat px-6 py-15 text-center before:absolute before:inset-0 before:bg-hero-tint before:backdrop-brightness-[0.58] before:backdrop-saturate-[0.55] max-lg:min-h-[max(75vw,500px)] max-lg:flex-none max-lg:px-4 max-lg:py-6"
      id="home"
    >
      <div className="relative max-w-header">
        <h1 className="mb-5 text-[length:clamp(24px,2.4vw,40px)] leading-[1.2] font-medium text-cream max-lg:mb-3 max-lg:text-[length:clamp(18px,4.6vw,26px)]">
          {t.title}
        </h1>
        <p className="mx-auto mb-8 max-w-[560px] text-[length:clamp(12px,1vw,15px)] leading-[1.6] text-cream-text max-lg:mb-4 max-lg:text-[13px] max-lg:leading-[1.5]">
          {t.text}
        </p>
        <a
          href="#rooms"
          className="inline-block rounded-full bg-olive px-[26px] py-2.5 text-[length:clamp(12px,0.9vw,14px)] font-semibold text-white transition-colors duration-200 hover:bg-olive-hover max-lg:px-5 max-lg:py-[9px] max-lg:text-[13px]"
        >
          {t.button}
        </a>
      </div>
    </section>
  );
}
