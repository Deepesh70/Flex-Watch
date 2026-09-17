const express = require('express');
const { tmdbService } = require('../services/tmdb.service');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const query = req.query.q || req.query.query || '';
    const result = await tmdbService.searchMovies(query);
    res.setHeader('X-Cache-Source', result.source);
    res.json(result.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
