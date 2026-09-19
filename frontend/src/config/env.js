/**
 * Centralized Client Environment Configuration
 * Reads Vite (import.meta.env) and legacy CRA (process.env) variables with fallbacks.
 */

export const CLERK_PUBLISHABLE_KEY =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY ||
     import.meta.env?.REACT_APP_CLERK_PUBLISHABLE_KEY ||
     import.meta.env?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)) ||
  (typeof process !== 'undefined' &&
    (process.env?.VITE_CLERK_PUBLISHABLE_KEY ||
     process.env?.REACT_APP_CLERK_PUBLISHABLE_KEY ||
     process.env?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)) ||
  '';

export const BACKEND_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_BACKEND_URL || import.meta.env?.REACT_APP_BACKEND_URL)) ||
  (typeof process !== 'undefined' &&
    (process.env?.VITE_BACKEND_URL || process.env?.REACT_APP_BACKEND_URL)) ||
  '';

export const TMDB_API_KEY =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_API_KEY || import.meta.env?.REACT_APP_API_KEY)) ||
  (typeof process !== 'undefined' &&
    (process.env?.VITE_API_KEY || process.env?.REACT_APP_API_KEY)) ||
  '';
