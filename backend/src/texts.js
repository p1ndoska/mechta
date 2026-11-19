const fs = require('fs');
const path = require('path');
const express = require('express');
const prisma = require('./prisma');

// Надписи на сайте, которые меняются в панели администратора.
// Здесь значения по умолчанию; изменённые хранятся в таблице SiteText.
// Длинные тексты страниц по умолчанию лежат в папке legal.
const legal = (name) => fs.readFileSync(path.join(__dirname, 'legal', name), 'utf8').trim();

const DEFAULTS = [
  ['advantages.title', 'Заголовок блока', 'Наши преимущества', 'Our advantages', 'Нашы перавагі'],
  ['advantages.airport.title', 'Аэропорт — заголовок', 'Близость аэропорта', 'Close to the airport', 'Блізкасць аэрапорта'],
  ['advantages.airport.text', 'Аэропорт — текст', 'Всего 5 минут пешей прогулки до аэропорта', 'Only a 5-minute walk to the airport', 'Усяго 5 хвілін пешшу да аэрапорта'],
  ['advantages.parking.title', 'Парковка — заголовок', 'Бесплатная парковка', 'Free parking', 'Бясплатная паркоўка'],
  ['advantages.parking.text', 'Парковка — текст', 'Просторная парковка на территории отеля', 'Spacious parking on the hotel grounds', 'Прасторная паркоўка на тэрыторыі гатэля'],
  ['advantages.wifi.title', 'Wi-Fi — заголовок', 'Бесплатный Wi-Fi', 'Free Wi-Fi', 'Бясплатны Wi-Fi'],
  ['advantages.wifi.text', 'Wi-Fi — текст', 'Высокоскоростной интернет на всей территории', 'High-speed internet throughout the grounds', 'Хуткасны інтэрнэт на ўсёй тэрыторыі'],
  ['advantages.green.title', 'Зелёная зона — заголовок', 'Зелёная зона', 'Green area', 'Зялёная зона'],
  ['advantages.green.text', 'Зелёная зона — текст', 'Озеленённая территория, тишина и свежий воздух', 'Green grounds, quiet and fresh air', 'Азялененая тэрыторыя, цішыня і свежае паветра'],
  ['advantages.balcony.title', 'Балкон — заголовок', 'Балкон в каждом номере', 'A balcony in every room', 'Балкон у кожным нумары'],
  ['advantages.balcony.text', 'Балкон — текст', 'Балкон в номере любой категории', 'Rooms of every category have a balcony', 'Балкон у нумары любой катэгорыі'],
  ['advantages.cafe.title', 'Кафе — заголовок', 'Обеды в кафе', 'Lunch at the cafe', 'Абеды ў кавярні'],
  ['advantages.cafe.text', 'Кафе — текст', 'Комплексные обеды от 6 BYN в кафе "Полёт"', 'Set lunches from 6 BYN at the "Polyot" cafe', 'Комплексныя абеды ад 6 BYN у кавярні "Палёт"'],
  ['discounts.title', 'Заголовок блока', 'Скидки', 'Discounts', 'Зніжкі'],
  ['booking.title', 'Заголовок', 'Готовы к путешествию?', 'Ready to travel?', 'Гатовыя да падарожжа?'],
  ['booking.text', 'Текст', 'Забронируйте номер прямо сейчас и наслаждайтесь комфортом по доступной цене.', 'Book a room right now and enjoy comfort at an affordable price.', 'Забраніруйце нумар проста зараз і атрымлівайце асалоду ад камфорту па даступнай цане.'],
  ['booking.button', 'Кнопка', 'Выбрать гостиничный номер!', 'Choose a hotel room!', 'Выбраць гасцінічны нумар!'],
  ['cookies.text', 'Текст', 'Мы используем файлы cookie, чтобы сайт работал удобнее: например, запоминаем выбранный язык. Вы можете принять или отклонить необязательные cookie.', 'We use cookies to make the site more convenient, for example to remember your language. You can accept or decline optional cookies.', 'Мы выкарыстоўваем файлы cookie, каб сайтам было зручней карыстацца: напрыклад, запамінаем абраную мову. Вы можаце прыняць або адхіліць неабавязковыя cookie.'],
  ['cookies.accept', 'Кнопка «Принять»', 'Принять', 'Accept', 'Прыняць'],
  ['cookies.reject', 'Кнопка «Отклонить»', 'Отклонить', 'Decline', 'Адхіліць'],
  ['legal.personal', 'Защита персональных данных', legal('personal-data.txt'), '', '', true],
  ['legal.privacy', 'Политика конфиденциальности', legal('privacy.txt'), '', '', true],
].map(([key, label, ru, en, be, long = false]) => ({ key, label, ru, en, be, long }));
const BY_KEY = new Map(DEFAULTS.map((item) => [item.key, item]));
// Длинные тексты (страницы) — до 100000 символов, обычные надписи — до 300
const maxLength = (key) => (BY_KEY.get(key).long ? 100000 : 300);

async function allTexts() {
  const saved = new Map((await prisma.siteText.findMany()).map((row) => [row.key, row]));
  return DEFAULTS.map((item) => {
    const row = saved.get(item.key);
    return row ? { ...item, ru: row.ru, en: row.en, be: row.be } : item;
  });
}

const publicRouter = express.Router();

// { "advantages.title": { ru, en, be }, ... }
publicRouter.get('/', async (req, res) => {
  const texts = await allTexts();
  res.json(Object.fromEntries(texts.map(({ key, ru, en, be }) => [key, { ru, en, be }])));
});

function adminRouter(requireAdmin) {
  const router = express.Router();
  router.use(requireAdmin);

  router.get('/', async (req, res) => {
    res.json(await allTexts());
  });

  // Тело: { "advantages.title": { ru, en, be }, ... }
  router.put('/', async (req, res) => {
    const body = req.body ?? {};
    const rows = [];
    for (const [key, value] of Object.entries(body)) {
      if (!BY_KEY.has(key)) return res.status(400).json({ error: `Неизвестная надпись: ${key}` });
      const row = { key };
      for (const lang of ['ru', 'en', 'be']) {
        const text = value?.[lang];
        if (typeof text !== 'string' || text.length > maxLength(key)) {
          return res.status(400).json({ error: `Надпись: не длиннее ${maxLength(key)} символов` });
        }
        row[lang] = text.trim();
      }
      if (!row.ru) return res.status(400).json({ error: 'Русский текст надписи не может быть пустым' });
      rows.push(row);
    }
    await prisma.$transaction(
      rows.map(({ key, ...data }) => prisma.siteText.upsert({ where: { key }, create: { key, ...data }, update: data }))
    );
    res.json(await allTexts());
  });

  return router;
}

module.exports = { publicRouter, adminRouter };
