import './About.css';

const texts = {
  ru: {
    title: 'Простота, уют и гостеприимство',
    text: 'Гостиница «Мечта» — это 76 уютных номеров в берёзовой роще, всего в 10 км от Бреста и 5 минутах от аэропорта. Идеальное место для тех, кто ценит тишину, свежий воздух и доступные цены. Из каждого номера есть выход на индивидуальный балкон. А атриум с дизайнерскими люстрами, просторный холл с шестиметровым потолком и открытая мансарда с видом на рощу создают неповторимую атмосферу уюта и простора. 49 мест, 76 номеров, домашняя атмосфера и внимательное отношение к каждому гостю — здесь сбываются мечты об отдыхе.',
    alt: 'Атриум гостиницы «Мечта»',
  },
  en: {
    title: 'Simplicity, comfort and hospitality',
    text: 'Mechta Hotel offers 76 cosy rooms in a birch grove, just 10 km from Brest and 5 minutes from the airport. It is the perfect place for those who value quiet, fresh air and affordable prices. Every room has its own balcony. The atrium with designer chandeliers, the spacious lobby with a six-metre ceiling and the open attic overlooking the grove create a unique atmosphere of comfort and space. 49 places, 76 rooms, a homely atmosphere and attention to every guest — this is where dreams of a good rest come true.',
    alt: 'Atrium of Mechta Hotel',
  },
  be: {
    title: 'Прастата, утульнасць і гасціннасць',
    text: 'Гасцініца «Мечта» — гэта 76 утульных нумароў у бярозавым гаі, усяго ў 10 км ад Брэста і 5 хвілінах ад аэрапорта. Ідэальнае месца для тых, хто цэніць цішыню, свежае паветра і даступныя цэны. З кожнага нумара ёсць выхад на індывідуальны балкон. А атрыум з дызайнерскімі люстрамі, прасторная зала з шасціметровай столлю і адкрытая мансарда з выглядам на гай ствараюць непаўторную атмасферу ўтульнасці і прастору. 49 месцаў, 76 нумароў, хатняя атмасфера і ўважлівыя адносіны да кожнага госця — тут збываюцца мары пра адпачынак.',
    alt: 'Атрыум гасцініцы «Мечта»',
  },
};

export default function About({ lang }) {
  const t = texts[lang];
  return (
    <section className="about" id="about">
      <div className="about__inner">
        <div className="about__content">
          <h2 className="about__title">{t.title}</h2>
          <p className="about__text">{t.text}</p>
        </div>
        <img className="about__photo" src="/images/about/atrium.jpg" alt={t.alt} loading="lazy" />
      </div>
    </section>
  );
}
