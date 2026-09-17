import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// 1. Dedicated Backend API client (Proxy + Persistence)
export const backendClient = axios.create({
  baseURL: `${BACKEND_URL}/api/v1`,
  timeout: 10000,
});

// 2. Direct TMDB fallback client (if backend proxy is unreachable)
export const tmdbFallbackClient = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 8000,
});

// Helper that prefers backend proxy first, then falls back to direct TMDB
async function fetchWithFallback(backendPath, tmdbPath, fallbackTransform = (data) => data?.results || [], fallbackParams = {}) {
  try {
    const res = await backendClient.get(backendPath);
    if (res?.data) {
      return res.data;
    }
  } catch (backendErr) {
    try {
      const res = await tmdbFallbackClient.get(tmdbPath, { params: fallbackParams });
      return fallbackTransform(res?.data);
    } catch (tmdbErr) {
      console.error(`Fallback TMDB error for ${tmdbPath}:`, tmdbErr.message);
    }
  }
  return fallbackTransform(null);
}

export const tmdbService = {
  // --- Movies Endpoints ---
  getNowPlaying: async () => {
    return fetchWithFallback('/movies/now-playing', '/movie/now_playing');
  },

  getPopular: async () => {
    return fetchWithFallback('/movies/popular', '/movie/popular');
  },

  getTopRated: async () => {
    return fetchWithFallback('/movies/top-rated', '/movie/top_rated');
  },

  getUpcoming: async () => {
    return fetchWithFallback('/movies/upcoming', '/movie/upcoming');
  },

  getTrending: async (timeWindow = 'week') => {
    return fetchWithFallback(`/movies/trending?window=${timeWindow}`, `/trending/movie/${timeWindow}`);
  },

  getMovieDetails: async (id) => {
    if (!id) return null;
    return fetchWithFallback(`/movies/${id}`, `/movie/${id}`, (data) => data || null);
  },

  getMovieCredits: async (id) => {
    if (!id) return { cast: [], crew: [] };
    return fetchWithFallback(`/movies/${id}/credits`, `/movie/${id}/credits`, (data) => data || { cast: [], crew: [] });
  },

  getMovieVideos: async (id) => {
    if (!id) return [];
    return fetchWithFallback(`/movies/${id}/videos`, `/movie/${id}/videos`);
  },

  getSimilarMovies: async (id) => {
    if (!id) return [];
    return fetchWithFallback(`/movies/${id}/similar`, `/movie/${id}/similar`);
  },

  getRecommendations: async (id, title = '') => {
    if (!id) return [];
    try {
      const res = await backendClient.get(`/movies/${id}/recommendations`, {
        params: { title },
      });
      return res?.data || [];
    } catch {
      // Fallback to TMDB recommendations endpoint
      try {
        const res = await tmdbFallbackClient.get(`/movie/${id}/recommendations`);
        return res?.data?.results || [];
      } catch {
        return [];
      }
    }
  },

  searchMovies: async (query) => {
    if (!query || !query.trim()) return [];
    const cleanQuery = query.trim();
    return fetchWithFallback(
      `/search?q=${encodeURIComponent(cleanQuery)}`,
      '/search/movie',
      (data) => data?.results || [],
      { query: cleanQuery }
    );
  },

  // --- TV Series Endpoints ---
  getPopularTV: async () => {
    return fetchWithFallback('/series/popular', '/tv/popular');
  },

  getTopRatedTV: async () => {
    return fetchWithFallback('/series/top-rated', '/tv/top_rated');
  },

  getOnTheAirTV: async () => {
    return fetchWithFallback('/series/on-the-air', '/tv/on_the_air');
  },

  getTrendingTV: async () => {
    return fetchWithFallback('/series/trending', '/trending/tv/week');
  },

  getTVDetails: async (id) => {
    if (!id) return null;
    return fetchWithFallback(`/series/${id}`, `/tv/${id}`, (data) => data || null);
  },

  getTVCredits: async (id) => {
    if (!id) return { cast: [], crew: [] };
    return fetchWithFallback(`/series/${id}/credits`, `/tv/${id}/credits`, (data) => data || { cast: [], crew: [] });
  },

  getTVVideos: async (id) => {
    if (!id) return [];
    return fetchWithFallback(`/series/${id}/videos`, `/tv/${id}/videos`);
  },

  searchTV: async (query) => {
    if (!query || !query.trim()) return [];
    const clean = query.trim();
    return fetchWithFallback(
      `/search/tv?q=${encodeURIComponent(clean)}`,
      '/search/tv',
      (data) => data?.results || [],
      { query: clean }
    );
  },
};

// --- Watchlist Service (Persisted to Database) ---
export const watchlistService = {
  getWatchlist: async (token) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await backendClient.get('/watchlist', { headers });
      return res?.data || [];
    } catch (e) {
      console.warn('Backend watchlist fetch failed, falling back to local storage', e.message);
      return null;
    }
  },

  addToWatchlist: async (movieItem, token) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await backendClient.post('/watchlist', {
        tmdbId: movieItem.id,
        mediaType: movieItem.media_type || 'movie',
        title: movieItem.title || movieItem.original_title || movieItem.name || 'Untitled',
        overview: movieItem.overview || '',
        posterPath: movieItem.poster_path || '',
        backdropPath: movieItem.backdrop_path || '',
        voteAverage: Number(movieItem.vote_average || 0),
        releaseDate: movieItem.release_date || movieItem.first_air_date || '',
      }, { headers });
      return res.data;
    } catch (e) {
      console.warn('Backend watchlist add failed:', e.message);
      return null;
    }
  },

  removeFromWatchlist: async (tmdbId, mediaType = 'movie', token) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await backendClient.delete(`/watchlist/${tmdbId}?mediaType=${mediaType}`, { headers });
      return res.data;
    } catch (e) {
      console.warn('Backend watchlist delete failed:', e.message);
      return null;
    }
  },
};

export default tmdbService;
