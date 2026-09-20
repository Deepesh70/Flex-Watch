/**
 * Centralized Client Environment Configuration
 * Reads Vite environment variables (import.meta.env) with REACT_APP_* fallbacks.
 */

const meta = typeof import.meta !== 'undefined' ? (import.meta.env || {}) : {};

export const CLERK_PUBLISHABLE_KEY =
  meta.VITE_CLERK_PUBLISHABLE_KEY ||
  meta.REACT_APP_CLERK_PUBLISHABLE_KEY ||
  '';

export const BACKEND_URL =
  meta.VITE_BACKEND_URL ||
  meta.REACT_APP_BACKEND_URL ||
  '';

export const TMDB_API_KEY =
  meta.VITE_API_KEY ||
  meta.REACT_APP_API_KEY ||
  '';
