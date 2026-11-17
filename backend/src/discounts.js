const express = require('express');
const prisma = require('./prisma');
const { swapped } = require('./rooms');

const ORDER = [{ sortOrder: 'asc' }, { id: 'asc' }];

function toJson(d) {
  return { id: d.id, value: d.value, text: { ru: d.textRu, en: d.textEn, be: d.textBe } };
}

async function list() {
  return (await prisma.discount.findMany({ orderBy: ORDER })).map(toJson);
}

function parseDiscount(body) {
  const { value, text } = body ?? {};
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 20) {
    return { error: 'Скидка: от 1 до 20 символов, например «5%»' };
  }
  const data = { value: value.trim() };
  for (const [lang, suffix] of [['ru', 'Ru'], ['en', 'En'], ['be', 'Be']]) {
    const t = text?.[lang] ?? '';
    if (typeof t !== 'string' || t.trim().length > 200) return { error: 'Описание: не длиннее 200 символов' };
    data[`text${suffix}`] = t.trim();
  }
  if (!data.textRu) return { error: 'Описание на русском не может быть пустым' };
  return { data };
}

const publicRouter = express.Router();

publicRouter.get('/', async (req, res) => {
  res.json(await list());
});

// Карточками скидок управляют все пользователи панели (администратор и редактор)
function adminRouter(requireAdmin) {
  const router = express.Router();
  router.use(requireAdmin);

  router.get('/', async (req, res) => {
    res.json(await list());
  });

  router.post('/', async (req, res) => {
    const { data, error } = parseDiscount(req.body);
    if (error) return res.status(400).json({ error });
    const last = await prisma.discount.aggregate({ _max: { sortOrder: true } });
    await prisma.discount.create({ data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
    res.status(201).json(await list());
  });

  router.put('/:id', async (req, res) => {
    const { data, error } = parseDiscount(req.body);
    if (error) return res.status(400).json({ error });
    const { count } = await prisma.discount.updateMany({ where: { id: Number(req.params.id) || 0 }, data });
    if (!count) return res.status(404).json({ error: 'Скидка не найдена' });
    res.json(await list());
  });

  router.post('/:id/move', async (req, res) => {
    const items = await prisma.discount.findMany({ select: { id: true }, orderBy: ORDER });
    const index = items.findIndex((item) => item.id === Number(req.params.id));
    if (index < 0) return res.status(404).json({ error: 'Скидка не найдена' });
    const order = swapped(items, index, req.body?.direction);
    if (order) {
      await prisma.$transaction(
        order.map((item, i) => prisma.discount.update({ where: { id: item.id }, data: { sortOrder: i + 1 } }))
      );
    }
    res.json(await list());
  });

  router.delete('/:id', async (req, res) => {
    const { count } = await prisma.discount.deleteMany({ where: { id: Number(req.params.id) || 0 } });
    if (!count) return res.status(404).json({ error: 'Скидка не найдена' });
    res.json(await list());
  });

  return router;
}

module.exports = { publicRouter, adminRouter };
