import { useEffect, useState } from 'react';

export default function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'error' }));
  }, []);

  return (
    <main>
      <h1>Mechta</h1>
      <p>API: {health ? health.status : 'загрузка...'}</p>
    </main>
  );
}
