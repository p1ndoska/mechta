import { useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';

export default function App() {
  const [lang, setLang] = useState('ru');

  return (
    <>
      <Header lang={lang} setLang={setLang} />
      <main>
        <Hero lang={lang} />
      </main>
    </>
  );
}
