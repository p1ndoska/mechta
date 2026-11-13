require('dotenv').config();
const app = require('./app');
const { ensureDefaultAdmin } = require('./admin/auth');

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Backend: http://localhost:${PORT}`);
});

ensureDefaultAdmin().catch((err) => console.error('Админ по умолчанию не создан:', err.message));
