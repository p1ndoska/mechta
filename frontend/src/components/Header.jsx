import { useState } from 'react';
import './Header.css';

const texts = {
  ru: {
    hotel: 'гостиница',
    name: 'МЕЧТА',
    org: ['Государственное предприятие', '«Белаэронавигация»', 'Брестский филиал'],
    nav: ['Главная', 'Номера', 'Контакты'],
    choose: 'К выбору!',
  },
  en: {
    hotel: 'hotel',
    name: 'MECHTA',
    org: ['State Enterprise', '«Belaeronavigatsia»', 'Brest Branch'],
    nav: ['Home', 'Rooms', 'Contacts'],
    choose: 'Choose!',
  },
};

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

export default function Header() {
  const [lang, setLang] = useState('ru');
  const [logoVisible, setLogoVisible] = useState(true);
  const t = texts[lang];

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

          {logoVisible && (
            <img
              className="header__logo"
              src="/images/logo/logo.png"
              alt=""
              onError={() => setLogoVisible(false)}
            />
          )}

          <span className="header__org">
            {t.org.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
        </a>

        <nav className="header__nav">
          {t.nav.map((label, i) => (
            <a key={navLinks[i]} href={navLinks[i]} className="header__link">
              {label}
            </a>
          ))}
          <a href="#rooms" className="header__choose">
            {t.choose}
          </a>
        </nav>
      </div>
    </header>
  );
}
