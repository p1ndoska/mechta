import { useEffect, useState } from 'react';
import './Header.css';

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

const navLinks = ['#home', '#rooms', '#contacts'];

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
    <header className="header">
      <div className="header__inner">
        <a href="#home" className="header__brand">
          <span className="header__hotel">
            <span className="header__hotel-small">{t.hotel}</span>
            <span className="header__hotel-name">{t.name}</span>
          </span>

          <img className="header__logo" src={`/images/logo/logo.png?v=${LOGO_VERSION}`} alt="" />

          <span className="header__org">
            {t.org.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
        </a>

        <nav id="header-nav" className={`header__nav${menuOpen ? ' is-open' : ''}`}>
          {t.nav.map((label, i) => (
            <a key={navLinks[i]} href={navLinks[i]} className="header__link" onClick={closeMenu}>
              {label}
            </a>
          ))}
          <a href="#rooms" className="header__choose" onClick={closeMenu}>
            {t.choose}
          </a>
          <button
            type="button"
            className="header__lang"
            title={switchTitle[lang]}
            aria-label={`${switchTitle[lang]}: ${nextLang.toUpperCase()}`}
            onClick={() => setLang(nextLang)}
          >
            <span key={lang} className="header__lang-code">
              {lang.toUpperCase()}
            </span>
          </button>
        </nav>

        <button
          type="button"
          className={`header__burger${menuOpen ? ' is-open' : ''}`}
          aria-label={t.menu}
          aria-expanded={menuOpen}
          aria-controls="header-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
