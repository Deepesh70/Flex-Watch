import { describe, it, expect } from 'vitest';
import { slugify, getMovieUrl } from '../utils/slug';

describe('Slug Utility', () => {
  it('converts standard title into lowercased hyphenated slug', () => {
    expect(slugify('Moana 2')).toBe('moana-2');
    expect(slugify('Dune: Part Two')).toBe('dune-part-two');
    expect(slugify('Spider-Man: Across the Spider-Verse')).toBe('spider-man-across-the-spider-verse');
  });

  it('handles titles with symbols, accents, and special characters', () => {
    expect(slugify('Amélie')).toBe('amelie');
    expect(slugify('Fast & Furious 9: The Fast Saga')).toBe('fast-furious-9-the-fast-saga');
    expect(slugify('WALL·E')).toBe('wall-e');
  });

  it('handles empty, null, or undefined values gracefully', () => {
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
  });

  it('getMovieUrl returns clean slug-based URL path', () => {
    expect(getMovieUrl({ id: 1108427, title: 'Moana 2' })).toBe('/movie/moana-2');
    expect(getMovieUrl({ id: 693134, original_title: 'Dune: Part Two' })).toBe('/movie/dune-part-two');
  });

  it('getMovieUrl falls back to numeric ID if title is unavailable', () => {
    expect(getMovieUrl({ id: 999 })).toBe('/movie/999');
    expect(getMovieUrl(null)).toBe('/');
  });
});
