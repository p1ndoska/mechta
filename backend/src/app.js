const express = require('express');
const cors = require('cors');
const prisma = require('./prisma');
const { getRatings } = require('./ratings');
const adminRoutes = require('./admin/routes');
const rooms = require('./rooms');
const texts = require('./texts');
const discounts = require('./discounts');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: err.message });
  }
});

app.get('/api/ratings', async (req, res) => {
  res.json(await getRatings());
});

app.use('/api/rooms', rooms.publicRouter);
app.use('/api/texts', texts.publicRouter);
app.use('/api/discounts', discounts.publicRouter);
app.use('/api/admin', adminRoutes);

module.exports = app;
