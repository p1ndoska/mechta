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
};

// Поменяйте число после замены логотипа, чтобы браузер не показывал старый
const LOGO_VERSION = 2;

const navLinks = ['#home', '#rooms', '#contacts'];

function FlagGB() {
  return (
    <svg viewBox="0 0 60 30" width="16" height="10" aria-hidden="true">
      <clipPath id="gb-clip">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#gb-clip)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

function FlagRU() {
  return (
    <svg viewBox="0 0 9 6" width="16" height="10" aria-hidden="true">
      <rect width="9" height="2" y="0" fill="#fff" />
      <rect width="9" height="2" y="2" fill="#0039A6" />
      <rect width="9" height="2" y="4" fill="#D52B1E" />
    </svg>
  );
}

export default function Header({ lang, setLang }) {
  const t = texts[lang];
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

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
      <div className="header__lang">
        <button
          type="button"
          className={`header__lang-btn${lang === 'en' ? ' is-active' : ''}`}
          onClick={() => setLang('en')}
        >
          <FlagGB /> EN
        </button>
        <button
          type="button"
          className={`header__lang-btn${lang === 'ru' ? ' is-active' : ''}`}
          onClick={() => setLang('ru')}
        >
          <FlagRU /> RU
        </button>
      </div>

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

        <nav id="header-nav" className={`header__nav${menuOpen ? ' is-open' : ''}`}>
          {t.nav.map((label, i) => (
            <a key={navLinks[i]} href={navLinks[i]} className="header__link" onClick={closeMenu}>
              {label}
            </a>
          ))}
          <a href="#rooms" className="header__choose" onClick={closeMenu}>
            {t.choose}
          </a>
        </nav>
      </div>
    </header>
  );
}
