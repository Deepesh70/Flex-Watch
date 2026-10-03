const { prisma } = require('./prisma');
const { logger } = require('../middlewares/logger');

const THEATERS_DATA = [
  {
    name: 'PVR IMAX - Orion Mall',
    city: 'Bengaluru',
    screens: [
      { name: 'Screen 1 (IMAX Laser)', format: 'IMAX', totalSeats: 56 },
      { name: 'Screen 2 (Dolby Atmos)', format: 'Dolby Atmos', totalSeats: 56 },
    ],
  },
  {
    name: 'INOX Megaplex - Phoenix Marketcity',
    city: 'Mumbai',
    screens: [
      { name: 'Screen 1 (Insignia VIP)', format: 'VIP Recliners', totalSeats: 56 },
      { name: 'Screen 2 (Dolby 7.1)', format: '2D', totalSeats: 56 },
    ],
  },
  {
    name: 'Cinepolis - DLF Avenue',
    city: 'Delhi NCR',
    screens: [
      { name: 'Macro XE 4K', format: 'Dolby Atmos', totalSeats: 56 },
      { name: 'Cinema 2', format: '2D', totalSeats: 56 },
    ],
  },
];

async function seedTheatersAndShows(movieId = 1108427, movieTitle = 'Moana 2') {
  try {
    // 1. Check if theaters already exist
    const count = await prisma.theater.count();
    let theaters = [];

    if (count === 0) {
      for (const t of THEATERS_DATA) {
        const created = await prisma.theater.create({
          data: {
            name: t.name,
            city: t.city,
            screens: {
              create: t.screens,
            },
          },
          include: { screens: true },
        });
        theaters.push(created);
      }
      logger.info({ count: theaters.length }, 'Seeded default cinema theaters and screens');
    } else {
      theaters = await prisma.theater.findMany({ include: { screens: true } });
    }

    // 2. Check if shows exist for this movieId
    const existingShows = await prisma.show.count({
      where: { movieId: Number(movieId) },
    });

    if (existingShows === 0 && theaters.length > 0) {
      const times = [
        { hour: 13, minute: 30, price: 10.0 },
        { hour: 16, minute: 45, price: 12.0 },
        { hour: 19, minute: 30, price: 15.0 },
        { hour: 22, minute: 15, price: 10.0 },
      ];

      for (const theater of theaters) {
        for (const screen of theater.screens) {
          // Schedule shows for today, tomorrow, and day after
          for (let offset = 0; offset <= 2; offset++) {
            for (const t of times) {
              const start = new Date();
              start.setDate(start.getDate() + offset);
              start.setHours(t.hour, t.minute, 0, 0);

              const end = new Date(start);
              end.setHours(end.getHours() + 2, end.getMinutes() + 30);

              await prisma.show.create({
                data: {
                  screenId: screen.id,
                  movieId: Number(movieId),
                  movieTitle,
                  startTime: start,
                  basePrice: screen.format === 'IMAX' ? t.price + 3.0 : t.price,
                },
              });
            }
          }
        }
      }
      logger.info({ movieId, movieTitle }, 'Generated relational show schedules across theaters');
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Theater auto-seed skipped or failed');
  }
}

module.exports = { seedTheatersAndShows, THEATERS_DATA };
