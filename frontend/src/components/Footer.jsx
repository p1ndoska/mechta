// Названия страниц защиты данных используются и как заголовки этих страниц
export const footerTexts = {
  ru: { home: 'Главная', contacts: 'Контакты', rooms: 'Номера', personal: 'Защита персональных данных', privacy: 'Политика конфиденциальности' },
  en: { home: 'Home', contacts: 'Contacts', rooms: 'Rooms', personal: 'Personal data protection', privacy: 'Privacy policy' },
  be: { home: 'Галоўная', contacts: 'Кантакты', rooms: 'Нумары', personal: 'Абарона персанальных даных', privacy: 'Палітыка канфідэнцыяльнасці' },
};

const links = [
  ['home', '/#home'],
  ['contacts', '/contacts'],
  ['rooms', '/rooms'],
  ['personal', '/personal-data'],
  ['privacy', '/privacy'],
];

export default function Footer({ lang }) {
  const t = footerTexts[lang];

  return (
    <footer className="bg-footer px-6 py-9 max-lg:py-7">
      <nav className="mx-auto flex max-w-content flex-wrap items-center justify-center gap-x-8 gap-y-3 max-sm:flex-col">
        {links.map(([key, href]) => (
          <a key={key} href={href} className="text-[14px] text-white hover:underline">
            {t[key]}
          </a>
        ))}
      </nav>
    </footer>
  );
}
