/**
 * Utility functions for creating SEO and human-friendly movie URL slugs.
 */

/**
 * Converts any string into a clean, URL-safe slug.
 * e.g. "Spider-Man: Across the Spider-Verse (2023)" -> "spider-man-across-the-spider-verse"
 */
export const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^\w\s-]/g, ' ') // convert symbols, dots, punctuation to spaces
    .trim()
    .replace(/[\s_-]+/g, '-') // convert spaces and underscores to dashes
    .replace(/^-+|-+$/g, ''); // strip leading/trailing dashes

};

/**
 * Generates a movie route URL using the movie title instead of its numeric ID.
 * Falls back to ID if title is unavailable.
 *
 * @param {Object} movie
 * @returns {string} URL path e.g. "/movie/moana-2"
 */
export const getMovieUrl = (movie) => {
  if (!movie) return '/';
  const title = movie.title || movie.original_title || movie.name || '';
  const slug = slugify(title);
  return slug ? `/movie/${slug}` : `/movie/${movie.id || ''}`;
};

export default { slugify, getMovieUrl };
