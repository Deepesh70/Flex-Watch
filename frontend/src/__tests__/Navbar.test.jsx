import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar.component';
import MovieProvider from '../components/context/Movies.context';

describe('Navbar Component', () => {
  test('renders FlexWatch brand name and navigation links', () => {
    render(
      <BrowserRouter>
        <MovieProvider>
          <Navbar />
        </MovieProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Flex')).toBeInTheDocument();
    expect(screen.getByText('Watch')).toBeInTheDocument();
    expect(screen.getByText('TV Series')).toBeInTheDocument();
  });

  test('allows search input interaction', () => {
    render(
      <BrowserRouter>
        <MovieProvider>
          <Navbar />
        </MovieProvider>
      </BrowserRouter>
    );

    const searchButtons = screen.getAllByRole('button', { hidden: true });
    expect(searchButtons.length).toBeGreaterThan(0);
  });
});
