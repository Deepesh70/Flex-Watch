import React, { useContext } from 'react';
import { MovieContext } from '../context/Movies.context';
import { FaStar, FaPlay, FaBookmark, FaCheck, FaExternalLinkAlt } from 'react-icons/fa';

const MovieInfo = ({ movie }) => {
  const { openTrailer, toggleMyList, isInMyList } = useContext(MovieContext);

  if (!movie) return null;

  const genres =
    movie.genres?.map((g) => g.name).join(', ') ||
    (movie.genre_ids ? 'Action, Adventure' : 'Cinema');

  const isSaved = isInMyList ? isInMyList(movie.id) : false;

  const spokenLanguages =
    movie.spoken_languages?.map((l) => l.english_name || l.name).join(', ') ||
    (movie.original_language ? movie.original_language.toUpperCase() : 'English');

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {/* Title */}
      <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight drop-shadow-md">
        {movie.title || movie.original_title}
      </h1>

      {movie.tagline && (
        <p className="text-accent-gold text-sm sm:text-base font-medium italic -mt-2">
          "{movie.tagline}"
        </p>
      )}

      {/* Meta Bar */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
        {movie.vote_average ? (
          <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-lg border border-white/10 text-accent-gold font-bold">
            <FaStar className="w-4 h-4" />
            <span>{Number(movie.vote_average).toFixed(1)}</span>
            <span className="text-gray-400 text-xs font-normal">/ 10</span>
          </div>
        ) : null}

        {movie.runtime ? (
          <span className="bg-white/10 px-2.5 py-1 rounded-lg text-xs font-medium text-white border border-white/10">
            {movie.runtime} min
          </span>
        ) : null}

        {movie.status && (
          <span className="bg-white/10 px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-400 border border-white/10">
            {movie.status}
          </span>
        )}

        {movie.release_date && (
          <span className="text-gray-400 text-xs">
            {new Date(movie.release_date).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>

      {/* Genres & Languages */}
      <div className="text-xs sm:text-sm text-gray-300 space-y-1">
        {genres && (
          <p>
            <span className="text-gray-500 font-medium">Genres: </span>
            <span className="text-white font-medium">{genres}</span>
          </p>
        )}
        <p>
          <span className="text-gray-500 font-medium">Languages: </span>
          <span className="text-gray-300">{spokenLanguages}</span>
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={() => openTrailer && openTrailer(movie)}
          className="inline-flex items-center justify-center gap-2 bg-accent-gold hover:bg-accent-goldHover text-dark-900 font-extrabold px-6 py-3 rounded-xl transition-all shadow-lg shadow-accent-gold/20 hover:scale-105"
        >
          <FaPlay className="w-3.5 h-3.5" />
          <span>Watch Official Trailer</span>
        </button>

        <button
          onClick={() => toggleMyList && toggleMyList(movie)}
          className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl border font-semibold text-xs sm:text-sm transition-colors ${
            isSaved
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
          }`}
        >
          {isSaved ? <FaCheck className="w-4 h-4" /> : <FaBookmark className="w-4 h-4" />}
          <span>{isSaved ? 'In Watchlist' : 'Add to Watchlist'}</span>
        </button>

        {movie.id && (
          <a
            href={`https://www.themoviedb.org/movie/${movie.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white px-4 py-3 rounded-xl border border-white/10 text-xs font-semibold transition-colors"
          >
            <span>TMDB Page</span>
            <FaExternalLinkAlt className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};

export default MovieInfo;