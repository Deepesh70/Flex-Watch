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

// 2. Movie Specific Endpoints
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
