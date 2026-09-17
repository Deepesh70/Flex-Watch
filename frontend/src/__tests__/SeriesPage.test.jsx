import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SeriesPage from '../pages/Series.page';
import MovieProvider from '../components/context/Movies.context';

describe('SeriesPage Component', () => {
  test('renders TV Series Catalog header and genre controls', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <MovieProvider>
            <SeriesPage />
          </MovieProvider>
        </BrowserRouter>
      );
    });

    expect(screen.getByText('TV Series Catalog & Episodes')).toBeInTheDocument();
    expect(screen.getByText('All Genres')).toBeInTheDocument();
    expect(screen.getByText('Sci-Fi & Fantasy')).toBeInTheDocument();
    expect(screen.getByText('Action & Adventure')).toBeInTheDocument();
  });
});
