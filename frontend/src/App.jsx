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
import Admin from './admin/Admin.jsx';

const isAdmin = /^\/administrator(\/|$)/.test(window.location.pathname);
const roomId = window.location.pathname.match(/^\/rooms\/(\d+)\/?$/)?.[1];
const languages = ['ru', 'en', 'be'];

export default function App() {
  if (isAdmin) return <Admin />;
  return <Site />;
}

function Site() {
  // Язык запоминается, чтобы не сбрасываться при переходе на страницу номера и обратно
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('lang');
    return languages.includes(saved) ? saved : 'ru';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('lang', lang);
  }, [lang]);

  if (roomId) {
    return (
      <main>
        <Header lang={lang} setLang={setLang} />
        <RoomPage id={roomId} lang={lang} />
      </main>
    );
  }

  return (
    <>
      <main>
        <div className="first-screen">
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
    </>
  );
}
