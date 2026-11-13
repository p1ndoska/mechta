import { useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';

export default function App() {
  const [lang, setLang] = useState('ru');

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
