import { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Ratings from './components/Ratings.jsx';
import Admin from './admin/Admin.jsx';

const isAdmin = /^\/administrator(\/|$)/.test(window.location.pathname);

export default function App() {
  if (isAdmin) return <Admin />;
  return <Site />;
}

function Site() {
  const [lang, setLang] = useState('ru');

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <>
      <main>
        <div className="first-screen">
          <Header lang={lang} setLang={setLang} />
          <Hero lang={lang} />
        </div>
        <Ratings lang={lang} />
      </main>
    </>
  );
}
