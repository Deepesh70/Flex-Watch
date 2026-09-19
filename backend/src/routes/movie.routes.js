const express = require('express');
const { tmdbService } = require('../services/tmdb.service');
const { recommendationService } = require('../services/recommendation.service');
const { logger } = require('../middlewares/logger');

const router = express.Router();

// Helper to set cache headers
const sendWithCacheHeader = (res, result) => {
  res.setHeader('X-Cache-Source', result.source);
  res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes browser cache
  return res.json(result.data);
};

// 1. Movies Catalog
router.get('/now-playing', async (req, res, next) => {
  try {
    const result = await tmdbService.getNowPlaying();
    sendWithCacheHeader(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/popular', async (req, res, next) => {
  try {
    const result = await tmdbService.getPopular();
    sendWithCacheHeader(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/top-rated', async (req, res, next) => {
  try {
    const result = await tmdbService.getTopRated();
    sendWithCacheHeader(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/upcoming', async (req, res, next) => {
  try {
    const result = await tmdbService.getUpcoming();
    sendWithCacheHeader(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/trending', async (req, res, next) => {
  try {
    const timeWindow = req.query.window === 'day' ? 'day' : 'week';
    const result = await tmdbService.getTrending(timeWindow);
    sendWithCacheHeader(res, result);
  } catch (err) {
    next(err);
  }
});

// 2. Movie Identifier Resolver (Supports both numeric IDs and title slugs e.g. "moana-2")

router.param('id', async (req, res, next, id) => {
  // 1. If already numeric, proceed directly
  if (/^\d+$/.test(id)) {
    return next();
  }

  try {
    // 2. If slug ends with an ID (e.g. "moana-2-1108427"), extract it
    const trailingIdMatch = id.match(/-(\d+)$/);
    if (trailingIdMatch) {
      req.params.id = trailingIdMatch[1];
      return next();
    }

    // 3. Otherwise, resolve slug title by searching catalog
    const searchQuery = id.replace(/[-_]+/g, ' ').trim();
    const searchResult = await tmdbService.searchMovies(searchQuery);
    const matched = searchResult.data && searchResult.data[0];
    if (!matched) {
      return res.status(404).json({
        title: 'Not Found',
        detail: `Movie matching "${id}" not found.`,
      });
    }

    req.params.id = String(matched.id);
    next();
  } catch (err) {
    next(err);
  }
});

// 3. Movie Specific Endpoints
router.get('/:id', async (req, res, next) => {

  try {
    const { id } = req.params;
    const result = await tmdbService.getMovieDetails(id);
    if (!result.data) {
      return res.status(404).json({ title: 'Not Found', detail: `Movie ${id} not found` });
    }
    sendWithCacheHeader(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/credits', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await tmdbService.getMovieCredits(id);
    sendWithCacheHeader(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/videos', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await tmdbService.getMovieVideos(id);
    sendWithCacheHeader(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/similar', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await tmdbService.getSimilarMovies(id);
    sendWithCacheHeader(res, result);
  } catch (err) {
    next(err);
  }
});

// 3. Dynamic ML Recommendation endpoint (Title + Id fallback)
router.get('/:id/recommendations', async (req, res, next) => {
  try {
    const { id } = req.params;
    const title = req.query.title || '';
    const result = await recommendationService.getRecommendationsForMovie(title, Number(id));
    res.setHeader('X-Recommendation-Source', result.source);
    res.json(result.recommendations);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
