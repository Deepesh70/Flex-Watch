import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from '../pages/Profile.page';
import MovieProvider from '../components/context/Movies.context';

describe('ProfilePage Component', () => {
  test('renders user profile details and membership status', () => {
    render(
      <BrowserRouter>
        <MovieProvider>
          <ProfilePage />
        </MovieProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
    expect(screen.getByText('alex.morgan@example.com')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  test('renders tabs for Watchlist and Preferences', () => {
    render(
      <BrowserRouter>
        <MovieProvider>
          <ProfilePage />
        </MovieProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/My Watchlist/i)).toBeInTheDocument();
    expect(screen.getByText('Preferences & Settings')).toBeInTheDocument();
  });
});
