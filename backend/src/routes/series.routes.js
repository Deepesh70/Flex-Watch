const express = require('express');
const { tmdbService } = require('../services/tmdb.service');

const router = express.Router();

const sendWithCacheHeader = (res, result, maxAge = 300) => {
  res.setHeader('X-Cache-Source', result.source);
  res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
  return res.json(result.data);
};

router.get('/popular', async (req, res, next) => {
  try {
    const result = await tmdbService.getSeriesPopular();
    sendWithCacheHeader(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/top-rated', async (req, res, next) => {
  try {
    const result = await tmdbService.getSeriesTopRated();
    sendWithCacheHeader(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/on-the-air', async (req, res, next) => {
  try {
    const result = await tmdbService.getOnTheAirTV();
    sendWithCacheHeader(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/trending', async (req, res, next) => {
  try {
    const timeWindow = req.query.window === 'day' ? 'day' : 'week';
    const result = await tmdbService.getTrendingTV(timeWindow);
    sendWithCacheHeader(res, result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
