const path = require('path');
const fs = require('fs');
const { tmdbService } = require('./tmdb.service');
const { logger } = require('../middlewares/logger');

let recommendationsMap = null;

// Lazy load recommendations map on first call
function loadRecommendations() {
  if (recommendationsMap) return recommendationsMap;

  const primaryPath = path.resolve(__dirname, '../../data/recommendations.json');
  const fallbackPath = path.resolve(__dirname, '../../../Recommendation_system/recommendations.json');
  const jsonPath = fs.existsSync(primaryPath) ? primaryPath : fallbackPath;
  try {
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf8');
      recommendationsMap = JSON.parse(raw);
      logger.info({ totalMovies: Object.keys(recommendationsMap).length }, 'Loaded ML recommendations dictionary on server');
    } else {
      recommendationsMap = {};
      logger.warn('recommendations.json not found on disk, fallback to TMDB recommendations');
    }
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to parse recommendations.json');
    recommendationsMap = {};
  }
  return recommendationsMap;
}

const recommendationService = {
  getRecommendationsForMovie: async (movieTitle, movieId) => {
    const map = loadRecommendations();

    // 1. Try ML dataset lookup by stable movie identifier first
    if (movieId !== undefined && movieId !== null) {
      const idKey = String(movieId);
      const exactById = map[idKey];
      if (exactById && Array.isArray(exactById) && exactById.length > 0) {
        return {
          source: 'ml_dataset',
          recommendations: exactById,
        };
      }
    }

    // 2. Try ML dataset exact or case-insensitive match by title
    if (movieTitle) {
      const exact = map[movieTitle];
      if (exact && Array.isArray(exact) && exact.length > 0) {
        return {
          source: 'ml_dataset',
          recommendations: exact,
        };
      }

      // Case-insensitive check
      const lower = movieTitle.trim().toLowerCase();
      const matchedKey = Object.keys(map).find((k) => k.toLowerCase() === lower);
      if (matchedKey && map[matchedKey]?.length > 0) {
        return {
          source: 'ml_dataset',
          recommendations: map[matchedKey],
        };
      }
    }

    // 2. Fallback to TMDB similar movies if not found in offline dataset
    if (movieId) {
      try {
        const { data: similar } = await tmdbService.getSimilarMovies(movieId);
        const formatted = (similar || []).slice(0, 8).map((m) => ({
          title: m.title || m.original_title,
          similarity_score: m.vote_average ? (m.vote_average / 10).toFixed(2) : '0.75',
          id: m.id,
          poster_path: m.poster_path,
          vote_average: m.vote_average,
        }));

        return {
          source: 'tmdb_fallback',
          recommendations: formatted,
        };
      } catch (err) {
        logger.warn({ err: err.message, movieId }, 'Could not fetch similar movies fallback');
      }
    }

    return {
      source: 'none',
      recommendations: [],
    };
  },
};

module.exports = { recommendationService };
