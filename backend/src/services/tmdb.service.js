const crypto = require('crypto');
const axios = require('axios');
const { env } = require('../config/env');
const { cacheService } = require('./cache.service');
const { logger } = require('../middlewares/logger');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const apiClient = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 8000,
});

apiClient.interceptors.request.use((config) => {
  if (env.TMDB_API_KEY) {
    config.params = {
      api_key: env.TMDB_API_KEY,
      ...config.params,
    };
  }
  return config;
});

/**
 * Execute an upstream call with exponential backoff for 5xx errors
 */
async function fetchWithRetry(url, params = {}, maxRetries = 3) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const response = await apiClient.get(url, { params });
      return response.data;
    } catch (err) {
      attempt++;
      const isNetworkError = !err.response || ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED'].includes(err.code);
      const is5xx = err.response && err.response.status >= 500;
      const isTransient = isNetworkError || is5xx;

      if (attempt > maxRetries || !isTransient) {
        logger.error({ url, status: err.response?.status, code: err.code, error: err.message }, 'TMDB API request failed');
        throw err;
      }
      const jitter = crypto.randomInt(0, 100);
      const backoffMs = Math.min(2000, 150 * Math.pow(2, attempt)) + jitter;
      logger.warn({ attempt, backoffMs, url, code: err.code, error: err.message }, 'Retrying TMDB request after transient failure');
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}

const tmdbService = {
  getNowPlaying: async () => {
    const key = 'tmdb:movies:now_playing';
    return cacheService.fetchOrCompute(key, async () => {
      const res = await fetchWithRetry('/movie/now_playing');
      return res?.results || [];
    }, 1800); // 30 mins
  },

  getPopular: async () => {
    const key = 'tmdb:movies:popular';
    return cacheService.fetchOrCompute(key, async () => {
      const res = await fetchWithRetry('/movie/popular');
      return res?.results || [];
    }, 3600); // 1 hour
  },

  getTopRated: async () => {
    const key = 'tmdb:movies:top_rated';
    return cacheService.fetchOrCompute(key, async () => {
      const res = await fetchWithRetry('/movie/top_rated');
      return res?.results || [];
    }, 7200); // 2 hours
  },

  getUpcoming: async () => {
    const key = 'tmdb:movies:upcoming';
    return cacheService.fetchOrCompute(key, async () => {
      const res = await fetchWithRetry('/movie/upcoming');
      return res?.results || [];
    }, 3600);
  },

  getTrending: async (timeWindow = 'week') => {
    const key = `tmdb:movies:trending:${timeWindow}`;
    return cacheService.fetchOrCompute(key, async () => {
      const res = await fetchWithRetry(`/trending/movie/${timeWindow}`);
      return res?.results || [];
    }, 1800);
  },

  getMovieDetails: async (id) => {
    const key = `tmdb:movie:${id}:details`;
    return cacheService.fetchOrCompute(key, async () => {
      return await fetchWithRetry(`/movie/${id}`);
    }, 86400); // 24 hours
  },

  getMovieCredits: async (id) => {
    const key = `tmdb:movie:${id}:credits`;
    return cacheService.fetchOrCompute(key, async () => {
      const res = await fetchWithRetry(`/movie/${id}/credits`);
      return res || { cast: [], crew: [] };
    }, 86400);
  },

  getMovieVideos: async (id) => {
    const key = `tmdb:movie:${id}:videos`;
    return cacheService.fetchOrCompute(key, async () => {
      const res = await fetchWithRetry(`/movie/${id}/videos`);
      return res?.results || [];
    }, 86400);
  },

  getSimilarMovies: async (id) => {
    const key = `tmdb:movie:${id}:similar`;
    return cacheService.fetchOrCompute(key, async () => {
      const res = await fetchWithRetry(`/movie/${id}/similar`);
      return res?.results || [];
    }, 43200); // 12 hours
  },

  searchMovies: async (query) => {
    if (!query || !query.trim()) return { data: [], source: 'empty' };
    const cleanQuery = query.trim().toLowerCase();
    const key = `tmdb:search:${cleanQuery}`;
    return cacheService.fetchOrCompute(key, async () => {
      const res = await fetchWithRetry('/search/movie', { query: cleanQuery });
      return res?.results || [];
    }, 600); // 10 minutes
  },

  getSeriesPopular: async () => {
    const key = 'tmdb:tv:popular';
    return cacheService.fetchOrCompute(key, async () => {
      const res = await fetchWithRetry('/tv/popular');
      return res?.results || [];
    }, 3600);
  },

  getSeriesTopRated: async () => {
    const key = 'tmdb:tv:top_rated';
    return cacheService.fetchOrCompute(key, async () => {
      const res = await fetchWithRetry('/tv/top_rated');
      return res?.results || [];
    }, 7200);
  },

  getOnTheAirTV: async () => {
    const key = 'tmdb:tv:on_the_air';
    return cacheService.fetchOrCompute(key, async () => {
      const res = await fetchWithRetry('/tv/on_the_air');
      return res?.results || [];
    }, 3600);
  },

  getTrendingTV: async (timeWindow = 'week') => {
    const key = `tmdb:tv:trending:${timeWindow}`;
    return cacheService.fetchOrCompute(key, async () => {
      const res = await fetchWithRetry(`/trending/tv/${timeWindow}`);
      return res?.results || [];
    }, 1800);
  },
};

module.exports = { tmdbService };
