import { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Ratings from './components/Ratings.jsx';
import Rooms from './components/Rooms.jsx';
import About from './components/About.jsx';
import Advantages from './components/Advantages.jsx';
import Discounts from './components/Discounts.jsx';
import Booking from './components/Booking.jsx';
import RoomPage from './components/RoomPage.jsx';
import RoomsPage from './components/RoomsPage.jsx';
import Footer from './components/Footer.jsx';
import LegalPage from './components/LegalPage.jsx';
import CookieBanner from './components/CookieBanner.jsx';
import Admin from './admin/Admin.jsx';
import { canStore } from './consent.js';

const isAdmin = /^\/administrator(\/|$)/.test(window.location.pathname);
const roomId = window.location.pathname.match(/^\/rooms\/(\d+)\/?$/)?.[1];
const isRoomsPage = /^\/rooms\/?$/.test(window.location.pathname);
const legalPage = { '/personal-data': 'personal', '/privacy': 'privacy' }[window.location.pathname.replace(/\/$/, '')];
const languages = ['ru', 'en', 'be'];

export default function App() {
  if (isAdmin) return <Admin />;
  return <Site />;
}

function Site() {
  // Язык запоминается, только если посетитель принял cookie
  const [lang, setLang] = useState(() => {
    const saved = canStore() && localStorage.getItem('lang');
    return languages.includes(saved) ? saved : 'ru';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    if (canStore()) localStorage.setItem('lang', lang);
  }, [lang]);

  // Подвал прижат к низу экрана даже на коротких страницах
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1">
        <Page lang={lang} setLang={setLang} />
      </div>
      <Footer lang={lang} />
      <CookieBanner lang={lang} onAccept={() => localStorage.setItem('lang', lang)} />
    </div>
  );
}

function Page({ lang, setLang }) {
  if (roomId) {
    return (
      <main>
        <Header lang={lang} setLang={setLang} />
        <RoomPage id={roomId} lang={lang} />
      </main>
    );
  }

  if (legalPage) {
    return (
      <main>
        <Header lang={lang} setLang={setLang} />
        <LegalPage page={legalPage} lang={lang} />
      </main>
    );
  }

  if (isRoomsPage) {
    return (
      <main>
        <Header lang={lang} setLang={setLang} />
        <RoomsPage lang={lang} />
      </main>
    );
  }

  return (
    <main>
      <div className="flex min-h-dvh flex-col max-lg:min-h-0">
        <Header lang={lang} setLang={setLang} />
        <Hero lang={lang} />
      </div>
      <Ratings lang={lang} />
      <Rooms lang={lang} />
      <About lang={lang} />
      <Advantages lang={lang} />
      <Discounts lang={lang} />
      <Booking lang={lang} />
    </main>
  );
}
