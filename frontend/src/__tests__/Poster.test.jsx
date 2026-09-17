import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Poster from '../components/poster/Poster.component';
import MovieProvider from '../components/context/Movies.context';

describe('Poster Component', () => {
  const sampleMovie = {
    id: 999,
    title: 'Inception Test',
    poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    vote_average: 8.8,
    release_date: '2010-07-16',
  };

  test('renders movie title, year and rating', () => {
    render(
      <BrowserRouter>
        <MovieProvider>
          <Poster {...sampleMovie} />
        </MovieProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Inception Test')).toBeInTheDocument();
    expect(screen.getByText('2010')).toBeInTheDocument();
    expect(screen.getByText('8.8')).toBeInTheDocument();
  });
});
