import React, { useContext } from 'react';
import { FaStar, FaPlay, FaInfoCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { MovieContext } from '../context/Movies.context';

const FeaturedMovie = ({ movie }) => {
  const { openTrailer } = useContext(MovieContext);
  if (!movie) return null;

  const backdrop = movie.backdrop_path
    ? (movie.backdrop_path.startsWith('http')
      ? movie.backdrop_path
      : `https://image.tmdb.org/t/p/original${movie.backdrop_path}`)
    : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80';

  const stars = Math.round((movie.vote_average || 0) / 2);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-dark-800" style={{ minHeight: '420px' }}>
      {/* Backdrop Image */}
      <img
        src={backdrop}
        alt={movie.title || movie.original_title}
        className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-700 hover:scale-100"
      />

      {/* Modern Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark-900 via-dark-900/90 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/30 to-transparent z-10" />

      {/* Content */}
      <div className="relative z-20 flex items-center h-full p-8 md:p-12 lg:p-16">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-gold/15 border border-accent-gold/30 text-accent-gold text-xs font-bold uppercase tracking-wider mb-4">
            <span>Spotlight Recommendation</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3 uppercase tracking-tight">
            {movie.title || movie.original_title}
          </h2>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`w-4 h-4 ${star <= stars ? 'text-accent-gold' : 'text-gray-600'}`}
                />
              ))}
            </div>
            <span className="text-accent-gold font-bold text-sm">
              {Number(movie.vote_average || 0).toFixed(1)}/10
            </span>
            {movie.vote_count && (
              <span className="text-gray-400 text-xs">
                ({movie.vote_count.toLocaleString()} ratings)
              </span>
            )}
          </div>

          {/* Overview */}
          <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6 line-clamp-3">
            {movie.overview}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => openTrailer && openTrailer(movie)}
              className="inline-flex items-center gap-2 bg-accent-gold hover:bg-accent-goldHover text-dark-900 font-extrabold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-accent-gold/20"
            >
              <FaPlay className="w-3.5 h-3.5" />
              <span>Watch Trailer</span>
            </button>
            <Link
              to={`/movie/${movie.id}`}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 border border-white/10"
            >
              <FaInfoCircle className="w-4 h-4" />
              <span>More Details</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedMovie;
