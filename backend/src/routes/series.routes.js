const express = require('express');
const { tmdbService } = require('../services/tmdb.service');

const router = express.Router();

router.get('/popular', async (req, res, next) => {
  try {
    const result = await tmdbService.getSeriesPopular();
    res.setHeader('X-Cache-Source', result.source);
    res.json(result.data);
  } catch (err) {
    next(err);
  }
});

router.get('/top-rated', async (req, res, next) => {
  try {
    const result = await tmdbService.getSeriesTopRated();
    res.setHeader('X-Cache-Source', result.source);
    res.json(result.data);
  } catch (err) {
    next(err);
  }
});

router.get('/on-the-air', async (req, res, next) => {
  try {
    const result = await tmdbService.getOnTheAirTV();
    res.setHeader('X-Cache-Source', result.source);
    res.json(result.data);
  } catch (err) {
    next(err);
  }
});

router.get('/trending', async (req, res, next) => {
  try {
    const timeWindow = req.query.window === 'day' ? 'day' : 'week';
    const result = await tmdbService.getTrendingTV(timeWindow);
    res.setHeader('X-Cache-Source', result.source);
    res.json(result.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
