import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaPlus, FaCheck, FaPlay } from 'react-icons/fa';
import { MovieContext } from '../context/Movies.context';

const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';

const Poster = (props) => {
  const { toggleMyList, isInMyList, openTrailer } = useContext(MovieContext);
  const [hasError, setHasError] = useState(false);

  // Compute poster image URL directly from props
  const rawPoster = props.poster_path;
  const posterUrl = rawPoster
    ? rawPoster.startsWith('http')
      ? rawPoster
      : `https://image.tmdb.org/t/p/w500${rawPoster}`
    : FALLBACK_POSTER;

  // Reset error state whenever movie ID or poster_path prop changes
  useEffect(() => {
    setHasError(false);
  }, [props.id, props.poster_path]);

  const year = props.release_date ? new Date(props.release_date).getFullYear() : '';
  const rating = props.vote_average ? Number(props.vote_average).toFixed(1) : '';
  const isSaved = isInMyList ? isInMyList(props.id) : false;

  return (
    <div className="movie-card flex flex-col items-start gap-2 px-1.5 py-2 group w-full max-w-[220px]">
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded-xl bg-dark-700 border border-white/5 shadow-lg group-hover:border-accent-gold/40 transition-all duration-300">
        <Link to={`/movie/${props.id}`} className="block w-full h-full">
          <img
            key={props.id ? `poster-${props.id}` : posterUrl}
            src={hasError ? FALLBACK_POSTER : posterUrl}
            alt={props.title || props.original_title || 'Movie Poster'}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Rating Badge */}
        {rating && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/75 backdrop-blur-md text-accent-gold text-xs font-bold px-2 py-1 rounded-lg border border-white/10 shadow-md">
            <FaStar className="w-3 h-3" />
            <span>{rating}</span>
          </div>
        )}

        {/* Quick actions overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/95 via-dark-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex flex-col justify-end p-3 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => openTrailer && openTrailer(props)}
              title="Watch Trailer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-accent-gold hover:bg-accent-goldHover text-dark-900 font-bold text-xs py-2 rounded-lg transition-all shadow-md"
            >
              <FaPlay className="w-2.5 h-2.5" />
              <span>Trailer</span>
            </button>
            <button
              onClick={() => toggleMyList && toggleMyList(props)}
              title={isSaved ? 'Remove from List' : 'Add to List'}
              className={`p-2 rounded-lg transition-colors border ${
                isSaved
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              {isSaved ? <FaCheck className="w-3 h-3" /> : <FaPlus className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Title & Info */}
      <Link to={`/movie/${props.id}`} className="w-full">
        <h3 className="text-sm font-semibold text-gray-200 group-hover:text-accent-gold transition-colors duration-200 line-clamp-1 w-full text-left">
          {props.title || props.original_title || 'Untitled Movie'}
        </h3>
        {year && (
          <p className="text-xs text-gray-500 mt-0.5 text-left">
            {year}
          </p>
        )}
      </Link>
    </div>
  );
};

export default Poster;