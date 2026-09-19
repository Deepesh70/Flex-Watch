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

import { CLERK_PUBLISHABLE_KEY } from './config/env';

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
  const isClerkConfigured = Boolean(CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY.startsWith('pk_'));

  if (isClerkConfigured) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <AppContent />
      </ClerkProvider>
    );
  }

  // Graceful Demo / Showcase Mode
  return <AppContent />;
}

export default App;
