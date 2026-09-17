import tmdbService from '../services/tmdb';

describe('TMDB Service', () => {
  const originalEnv = process.env.REACT_APP_API_KEY;

  beforeAll(() => {
    process.env.REACT_APP_API_KEY = 'test_api_key';
  });

  afterAll(() => {
    process.env.REACT_APP_API_KEY = originalEnv;
  });

  test('getNowPlaying queries TMDB endpoint', async () => {
    const movies = await tmdbService.getNowPlaying();
    expect(Array.isArray(movies)).toBe(true);
  });

  test('getPopular queries TMDB endpoint', async () => {
    const movies = await tmdbService.getPopular();
    expect(Array.isArray(movies)).toBe(true);
  });

  test('getTopRated queries TMDB endpoint', async () => {
    const movies = await tmdbService.getTopRated();
    expect(Array.isArray(movies)).toBe(true);
  });

  test('searchMovies handles search queries', async () => {
    const results = await tmdbService.searchMovies('Dune');
    expect(Array.isArray(results)).toBe(true);
  });

  test('searchMovies returns empty array for empty query', async () => {
    const results = await tmdbService.searchMovies('');
    expect(results).toEqual([]);
  });

  test('getMovieDetails returns movie object for id', async () => {
    const movie = await tmdbService.getMovieDetails(101);
    expect(movie).toBeDefined();
  });

  test('getMovieCredits returns cast array', async () => {
    const credits = await tmdbService.getMovieCredits(101);
    expect(credits).toHaveProperty('cast');
    expect(Array.isArray(credits.cast)).toBe(true);
  });

  test('getMovieVideos returns video results array', async () => {
    const videos = await tmdbService.getMovieVideos(101);
    expect(Array.isArray(videos)).toBe(true);
  });
});
