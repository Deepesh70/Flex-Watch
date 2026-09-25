const path = require('path');
const fs = require('fs');
const { tmdbService } = require('./tmdb.service');
const { logger } = require('../middlewares/logger');
const { env } = require('../config/env');

let recommendationsMap = null;

// Lazy load recommendations map on first call
function loadRecommendations() {
  if (recommendationsMap) return recommendationsMap;

  const jsonPath = path.resolve(__dirname, '../../data/recommendations.json');
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

function findInDataset(map, movieTitle, movieId) {
  if (movieId !== undefined && movieId !== null) {
    const idKey = String(movieId);
    const exactById = map[idKey];
    if (exactById?.length > 0) {
      return exactById;
    }
  }

  if (!movieTitle) return null;

  const exact = map[movieTitle];
  if (exact?.length > 0) {
    return exact;
  }

  const lower = movieTitle.trim().toLowerCase();
  const matchedKey = Object.keys(map).find((k) => k.toLowerCase() === lower);
  return matchedKey && map[matchedKey]?.length > 0 ? map[matchedKey] : null;
}

async function fetchTmdbFallback(movieId) {
  if (!movieId || !env.TMDB_API_KEY) return null;

  try {
    const { data: similar } = await tmdbService.getSimilarMovies(movieId);
    return (similar || []).slice(0, 8).map((m) => ({
      title: m.title || m.original_title,
      similarity_score: m.vote_average ? (m.vote_average / 10).toFixed(2) : '0.75',
      id: m.id,
      poster_path: m.poster_path,
      vote_average: m.vote_average,
    }));
  } catch (err) {
    logger.warn({ err: err.message, movieId }, 'Could not fetch similar movies fallback');
    return null;
  }
}

const recommendationService = {
  getRecommendationsForMovie: async (movieTitle, movieId) => {
    const map = loadRecommendations();

    const datasetRecs = findInDataset(map, movieTitle, movieId);
    if (datasetRecs) {
      return {
        source: 'ml_dataset',
        recommendations: datasetRecs,
      };
    }

    const fallbackRecs = await fetchTmdbFallback(movieId);
    if (fallbackRecs) {
      return {
        source: 'tmdb_fallback',
        recommendations: fallbackRecs,
      };
    }

    return {
      source: 'none',
      recommendations: [],
    };
  },
};

module.exports = { recommendationService };
