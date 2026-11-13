import { useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';

export default function App() {
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
      </main>
    </>
  );
}
