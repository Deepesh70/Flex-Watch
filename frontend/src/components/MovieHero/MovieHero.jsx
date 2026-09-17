import React, { useContext } from 'react';
import { MovieContext } from '../context/Movies.context';
import MovieInfo from './MovieInfo';

const MovieHero = () => {
  const { movie } = useContext(MovieContext);

  if (!movie || !movie.id) return null;

  const backdrop = movie.backdrop_path
    ? (movie.backdrop_path.startsWith('http')
      ? movie.backdrop_path
      : `https://image.tmdb.org/t/p/original${movie.backdrop_path}`)
    : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80';

  const poster = movie.poster_path
    ? (movie.poster_path.startsWith('http')
      ? movie.poster_path
      : `https://image.tmdb.org/t/p/w500${movie.poster_path}`)
    : backdrop;

  return (
    <div className="relative w-full overflow-hidden bg-dark-900">
      {/* Mobile Layout */}
      <div className="lg:hidden w-full">
        <div className="relative w-full aspect-video">
          <img
            src={backdrop}
            alt={movie.title || movie.original_title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent" />
        </div>
        <div className="px-4 py-4 -mt-16 relative z-10">
          <MovieInfo movie={movie} />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="relative hidden w-full lg:block" style={{ height: '520px' }}>
        {/* Background Backdrop Image */}
        <img
          src={backdrop}
          alt={movie.title || movie.original_title}
          className="absolute inset-0 w-full h-full object-cover object-top"
        />

        {/* Sophisticated Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900 via-dark-900/85 to-dark-900/40 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-black/50 z-10" />

        {/* Content Container */}
        <div className="relative z-20 max-w-7xl mx-auto h-full px-8 flex items-center gap-10">
          {/* Poster Card */}
          <div className="w-64 h-96 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-dark-800">
            <img
              src={poster}
              alt={movie.title || movie.original_title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Movie Details Info */}
          <div className="flex-1">
            <MovieInfo movie={movie} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieHero;