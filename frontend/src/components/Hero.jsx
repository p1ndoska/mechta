import './Hero.css';

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
    <section className="hero" id="home">
      <div className="hero__content">
        <h1 className="hero__title">{t.title}</h1>
        <p className="hero__text">{t.text}</p>
        <a href="#rooms" className="hero__button">
          {t.button}
        </a>
      </div>
    </section>
  );
}
