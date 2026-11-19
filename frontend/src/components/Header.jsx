import { useEffect, useState } from 'react';

const texts = {
  ru: {
    hotel: 'гостиница',
    name: 'МЕЧТА',
    org: ['Государственное предприятие', '«Белаэронавигация»', 'Брестский филиал'],
    nav: ['Главная', 'Номера', 'Контакты'],
    choose: 'К выбору!',
    menu: 'Меню',
  },
  en: {
    hotel: 'hotel',
    name: 'MECHTA',
    org: ['State Enterprise', '«Belaeronavigatsia»', 'Brest Branch'],
    nav: ['Home', 'Rooms', 'Contacts'],
    choose: 'Choose!',
    menu: 'Menu',
  },
  be: {
    hotel: 'гасцініца',
    name: 'МЕЧТА',
    org: ['Дзяржаўнае прадпрыемства', '«Белаэранавігацыя»', 'Брэсцкі філіял'],
    nav: ['Галоўная', 'Нумары', 'Кантакты'],
    choose: 'Да выбару!',
    menu: 'Меню',
  },
};

// Порядок переключения языков по кругу
const languages = ['ru', 'en', 'be'];

const switchTitle = {
  ru: 'Сменить язык',
  en: 'Change language',
  be: 'Змяніць мову',
};

// Поменяйте число после замены логотипа, чтобы браузер не показывал старый
const LOGO_VERSION = 2;

const navLinks = ['/#home', '/#rooms', '/contacts'];

const burgerLine = 'block h-0.5 rounded-[1px] bg-navy transition-[translate,rotate,opacity] duration-200';

export default function Header({ lang, setLang }) {
  const t = texts[lang];
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const nextLang = languages[(languages.indexOf(lang) + 1) % languages.length];

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    const onResize = () => window.innerWidth > 800 && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

  return (
    <header className="relative border-b border-line bg-white">
      <div className="mx-auto box-content flex max-w-header items-center justify-between gap-6 px-6 py-[26px] max-lg:gap-3 max-lg:p-4 max-xs:gap-2 max-xs:p-3">
        <a href="/#home" className="mr-auto flex items-center gap-[18px] max-lg:min-w-0 max-lg:gap-2.5 max-xs:gap-2">
          <span className="flex flex-col items-center leading-none text-text">
            <span className="text-[11px] tracking-[0.5px] max-lg:text-[9px]">{t.hotel}</span>
            <span className="text-[20px] tracking-[0.5px] max-lg:text-[16px]">{t.name}</span>
          </span>

          <img className="h-[68px] w-auto max-lg:h-12 max-xs:h-10" src={`/images/logo/logo.png?v=${LOGO_VERSION}`} alt="" />

          <span className="flex flex-col text-[14px] leading-[1.2] text-brown max-lg:text-[11px] max-xs:text-[10px]">
            {t.org.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
        </a>

        <nav id="header-nav" className={`flex items-center gap-[30px] max-lg:absolute max-lg:inset-x-0 max-lg:top-full max-lg:z-10 max-lg:flex-col max-lg:gap-[18px] max-lg:border-b max-lg:border-line max-lg:bg-white max-lg:px-4 max-lg:pt-5 max-lg:pb-6 max-lg:shadow-menu ${menuOpen ? 'max-lg:flex' : 'max-lg:hidden'}`}>
          {t.nav.map((label, i) => (
            <a key={navLinks[i]} href={navLinks[i]} className="text-[16px] text-text-dark hover:text-accent" onClick={closeMenu}>
              {label}
            </a>
          ))}
          <a href="/#rooms" className="rounded-full border-[1.5px] border-navy px-[22px] py-[9px] text-[16px] font-semibold text-navy transition-colors duration-200 hover:bg-navy hover:text-white" onClick={closeMenu}>
            {t.choose}
          </a>
          <button
            type="button"
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm border border-olive-light bg-olive p-0 text-[14px] font-bold text-white transition-colors duration-200 hover:bg-olive-hover max-xs:size-9 max-xs:text-[13px]"
            title={switchTitle[lang]}
            aria-label={`${switchTitle[lang]}: ${nextLang.toUpperCase()}`}
            onClick={() => setLang(nextLang)}
          >
            <span key={lang} className="animate-lang-in">
              {lang.toUpperCase()}
            </span>
          </button>
        </nav>

        <button
          type="button"
          className="hidden size-10 shrink-0 cursor-pointer flex-col justify-center gap-[5px] rounded-lg border-0 bg-transparent px-2 py-0 max-lg:flex max-xs:w-9 max-xs:px-1.5"
          aria-label={t.menu}
          aria-expanded={menuOpen}
          aria-controls="header-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className={`${burgerLine} ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
          <span className={`${burgerLine} ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`${burgerLine} ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
        </button>
      </div>
    </header>
  );
}
