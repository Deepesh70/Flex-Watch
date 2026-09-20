const express = require('express');
const { tmdbService } = require('../services/tmdb.service');

const router = express.Router();

const sendWithCacheHeader = (res, result, maxAge = 120) => {
  res.setHeader('X-Cache-Source', result.source);
  res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
  return res.json(result.data);
};

router.get('/', async (req, res, next) => {
  try {
    const query = req.query.q || req.query.query || '';
    const result = await tmdbService.searchMovies(query);
    sendWithCacheHeader(res, result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
