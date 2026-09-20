const express = require('express');
const { z } = require('zod');
const { prisma } = require('../db/prisma');
const { optionalAuth, getEffectiveUser } = require('../middlewares/auth');

const router = express.Router();

const watchlistItemSchema = z.object({
  tmdbId: z.coerce.number().int().positive(),
  mediaType: z.enum(['movie', 'tv']).default('movie'),
  title: z.string().min(1),
  overview: z.string().optional(),
  posterPath: z.string().nullable().optional(),
  backdropPath: z.string().nullable().optional(),
  voteAverage: z.coerce.number().optional().default(0),
  releaseDate: z.string().nullable().optional(),
});

// 1. GET Watchlist
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const user = await getEffectiveUser(req);
    const items = await prisma.watchlistItem.findMany({
      where: { userId: user.id },
      orderBy: { addedAt: 'desc' },
    });

    res.json(items);
  } catch (err) {
    next(err);
  }
});

// 2. POST to Watchlist
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const parse = watchlistItemSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        title: 'Validation Error',
        detail: 'Invalid watchlist payload',
        errors: parse.error.format(),
      });
    }

    const user = await getEffectiveUser(req);
    const data = parse.data;

    const item = await prisma.watchlistItem.upsert({
      where: {
        userId_tmdbId_mediaType: {
          userId: user.id,
          tmdbId: data.tmdbId,
          mediaType: data.mediaType,
        },
      },
      update: {
        title: data.title,
        overview: data.overview,
        posterPath: data.posterPath,
        backdropPath: data.backdropPath,
        voteAverage: data.voteAverage,
        releaseDate: data.releaseDate,
      },
      create: {
        userId: user.id,
        tmdbId: data.tmdbId,
        mediaType: data.mediaType,
        title: data.title,
        overview: data.overview,
        posterPath: data.posterPath,
        backdropPath: data.backdropPath,
        voteAverage: data.voteAverage,
        releaseDate: data.releaseDate,
      },
    });

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// 3. DELETE from Watchlist
router.delete('/:tmdbId', optionalAuth, async (req, res, next) => {
  try {
    const tmdbId = parseInt(req.params.tmdbId, 10);
    const mediaType = req.query.mediaType || 'movie';
    const user = await getEffectiveUser(req);

    await prisma.watchlistItem.deleteMany({
      where: {
        userId: user.id,
        tmdbId,
        mediaType,
      },
    });

    res.status(200).json({ success: true, tmdbId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
