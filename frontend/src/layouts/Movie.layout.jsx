import React from 'react';
import MovieNavbar from '../components/Navbar/MovieNavbar.component';
import BaseLayout from './BaseLayout';

export const MovieLayout = ({ children }) => (
  <BaseLayout navbar={<MovieNavbar />} mainClassName="pt-16">
    {children}
  </BaseLayout>
);

const MovielayoutHOC = (Component) => {
  const WithMovieLayout = (props) => (
    <MovieLayout>
      <Component {...props} />
    </MovieLayout>
  );
  return WithMovieLayout;
};

export default MovielayoutHOC;