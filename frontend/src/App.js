import React from 'react';
import './App.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/Home.page';
import MoviesPage from './pages/Movies.page';
import SeriesPage from './pages/Series.page';
import MoviePage from './pages/Movie.page';
import ProfilePage from './pages/Profile.page';
import MovieProvider from './components/context/Movies.context';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ClerkProvider } from '@clerk/clerk-react';

const CLERK_PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

function AppContent() {
  return (
    <ErrorBoundary>
      <MovieProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/series" element={<SeriesPage />} />
          <Route path="/movie/:id" element={<MoviePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Legacy redirect */}
          <Route path="/plays" element={<Navigate to="/series" replace />} />
          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MovieProvider>
    </ErrorBoundary>
  );
}

function App() {
  if (!CLERK_PUBLISHABLE_KEY || !CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
    console.error('Missing or invalid REACT_APP_CLERK_PUBLISHABLE_KEY.');
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-dark-800 border border-red-500/40 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-red-400 mb-2">Configuration Error</h2>
          <p className="text-sm text-gray-300">
            Missing required Clerk publishable key. Please define{' '}
            <code className="bg-black/50 text-accent-gold px-1.5 py-0.5 rounded font-mono text-xs">
              REACT_APP_CLERK_PUBLISHABLE_KEY
            </code>{' '}
            in your environment configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <AppContent />
    </ClerkProvider>
  );
}

export default App;
