import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MoviesPage from '../pages/Movies.page';
import MovieProvider from '../components/context/Movies.context';

describe('MoviesPage Component', () => {
  test('renders Movies Catalog header and filter controls', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MovieProvider>
            <MoviesPage />
          </MovieProvider>
        </BrowserRouter>
      );
    });

    expect(screen.getByText('Movies Catalog & Discover')).toBeInTheDocument();
    expect(screen.getByText('All Genres')).toBeInTheDocument();
    expect(screen.getAllByText('Action').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sci-Fi').length).toBeGreaterThan(0);
  });
});
