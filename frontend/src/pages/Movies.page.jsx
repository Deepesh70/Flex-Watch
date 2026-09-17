import React, { useEffect, useState, useContext, useMemo } from 'react';
import DefaultlayoutHOC from '../layouts/Default.layout';
import Poster from '../components/poster/Poster.component';
import tmdbService from '../services/tmdb';
import { MovieContext } from '../components/context/Movies.context';
import { PosterSliderSkeleton } from '../components/common/LoadingSkeleton';
import {
  FaFilter,
  FaSortAmountDown,
  FaStar,
  FaTh,
  FaList,
  FaPlay,
  FaBookmark,
  FaCheck,
  FaUndo,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const GENRES = [
  { id: 'all', name: 'All Genres' },
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 878, name: 'Sci-Fi' },
  { id: 18, name: 'Drama' },
  { id: 35, name: 'Comedy' },
  { id: 27, name: 'Horror' },
  { id: 16, name: 'Animation' },
  { id: 80, name: 'Crime' },
  { id: 53, name: 'Thriller' },
];

const SORT_OPTIONS = [
  { id: 'popular', name: 'Most Popular' },
  { id: 'rating-desc', name: 'Highest Rated' },
  { id: 'newest', name: 'Newest Releases' },
  { id: 'title-asc', name: 'Title (A to Z)' },
];

const MoviesPage = () => {
  const { openTrailer, toggleMyList, isInMyList } = useContext(MovieContext);
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [minRating, setMinRating] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [visibleCount, setVisibleCount] = useState(18);

  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const [popular, topRated, upcoming, trending, nowPlaying] = await Promise.all([
          tmdbService.getPopular(),
          tmdbService.getTopRated(),
          tmdbService.getUpcoming(),
          tmdbService.getTrending(),
          tmdbService.getNowPlaying(),
        ]);

        // Combine and deduplicate
        const combined = [
          ...(popular || []),
          ...(topRated || []),
          ...(upcoming || []),
          ...(trending || []),
          ...(nowPlaying || []),
        ];

        const unique = combined.filter(
          (movie, index, self) => index === self.findIndex((m) => m.id === movie.id)
        );

        if (isMounted) {
          setAllMovies(unique);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching movies catalog:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter & Sort Logic
  const filteredAndSortedMovies = useMemo(() => {
    let result = [...allMovies];

    // Filter by Genre
    if (selectedGenre !== 'all') {
      const genreId = Number(selectedGenre);
      result = result.filter(
        (m) =>
          m.genre_ids?.includes(genreId) ||
          m.genres?.some((g) => g.id === genreId || g.name.toLowerCase() === selectedGenre)
      );
    }

    // Filter by Min Rating
    if (minRating > 0) {
      result = result.filter((m) => (m.vote_average || 0) >= minRating);
    }

    // Sorting
    if (selectedSort === 'rating-desc') {
      result.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    } else if (selectedSort === 'newest') {
      result.sort(
        (a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0)
      );
    } else if (selectedSort === 'title-asc') {
      result.sort((a, b) =>
        (a.title || a.original_title || '').localeCompare(b.title || b.original_title || '')
      );
    } else {
      // Default: popularity / vote count
      result.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
    }

    return result;
  }, [allMovies, selectedGenre, minRating, selectedSort]);

  const displayedMovies = filteredAndSortedMovies.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSortedMovies.length;

  const resetFilters = () => {
    setSelectedGenre('all');
    setSelectedSort('popular');
    setMinRating(0);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="mb-8 bg-gradient-to-r from-dark-800 via-dark-800 to-dark-700 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <span className="bg-accent-gold text-dark-900 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">
            Cinematic Library
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-2 tracking-tight">
            Movies Catalog & Discover
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
            Browse our extensive collection of blockbuster movies, timeless classics, and indie gems. Filter by genre, rating, and sort according to your preference.
          </p>
        </div>
      </div>

      {/* Control Bar: Filters & Sorter */}
      <div className="bg-dark-800/90 rounded-2xl border border-white/10 p-4 sm:p-5 mb-8 shadow-xl space-y-4">
        {/* Top Controls Row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Genre Selection Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mr-1 flex-shrink-0">
              <FaFilter className="text-accent-gold w-3 h-3" />
              Genre:
            </span>
            {GENRES.map((genre) => (
              <button
                key={genre.id}
                onClick={() => {
                  setSelectedGenre(genre.id);
                  setVisibleCount(18);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedGenre === genre.id
                    ? 'bg-accent-gold text-dark-900 border-accent-gold font-bold shadow-md shadow-accent-gold/20'
                    : 'bg-dark-700 text-gray-300 border-white/10 hover:border-accent-gold/40 hover:text-white'
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>

          {/* Right Controls: Sort & View Mode */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <FaSortAmountDown className="text-accent-gold w-3.5 h-3.5" />
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="bg-dark-700 text-white text-xs font-medium border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:border-accent-gold/50 cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-dark-800 text-white">
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-dark-700 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-accent-gold text-dark-900'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <FaTh className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-accent-gold text-dark-900'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="List View"
              >
                <FaList className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Filter Row: Rating Filter & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Minimum Rating:</span>
            {[0, 7.0, 8.0, 8.5].map((val) => (
              <button
                key={val}
                onClick={() => setMinRating(val)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  minRating === val
                    ? 'bg-amber-500/20 text-accent-gold border-accent-gold font-bold'
                    : 'bg-dark-700 text-gray-400 border-white/5 hover:text-white'
                }`}
              >
                {val === 0 ? 'All' : `${val}+ ★`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>
              Showing <strong className="text-white">{displayedMovies.length}</strong> of{' '}
              <strong className="text-white">{filteredAndSortedMovies.length}</strong> titles
            </span>
            {(selectedGenre !== 'all' || minRating > 0 || selectedSort !== 'popular') && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-accent-gold hover:underline font-semibold ml-2"
              >
                <FaUndo className="w-2.5 h-2.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Movies Content Display */}
      {loading ? (
        <PosterSliderSkeleton count={12} />
      ) : displayedMovies.length > 0 ? (
        viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {displayedMovies.map((movie) => (
              <Poster {...movie} key={movie.id} />
            ))}
          </div>
        ) : (
          /* Detailed List View */
          <div className="space-y-4">
            {displayedMovies.map((movie) => {
              const isSaved = isInMyList ? isInMyList(movie.id) : false;
              const poster = movie.poster_path
                ? (movie.poster_path.startsWith('http')
                  ? movie.poster_path
                  : `https://image.tmdb.org/t/p/w300${movie.poster_path}`)
                : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80';

              return (
                <div
                  key={movie.id}
                  className="bg-dark-800/80 rounded-2xl border border-white/10 p-4 flex flex-col sm:flex-row gap-5 hover:border-accent-gold/40 transition-all shadow-md group"
                >
                  <Link
                    to={`/movie/${movie.id}`}
                    className="w-full sm:w-28 h-40 flex-shrink-0 rounded-xl overflow-hidden bg-dark-700"
                  >
                    <img
                      src={poster}
                      alt={movie.title || movie.original_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </Link>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/movie/${movie.id}`}>
                          <h3 className="text-lg font-bold text-white group-hover:text-accent-gold transition-colors">
                            {movie.title || movie.original_title}
                          </h3>
                        </Link>
                        {movie.vote_average ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-accent-gold bg-black/60 px-2.5 py-1 rounded-lg border border-white/10">
                            <FaStar className="w-3 h-3" />
                            {Number(movie.vote_average).toFixed(1)}
                          </span>
                        ) : null}
                      </div>

                      <p className="text-xs text-gray-400 mt-1">
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}{' '}
                        • 4K Ultra HD
                      </p>

                      <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 mt-2 leading-relaxed">
                        {movie.overview || 'No synopsis available for this title.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-3 mt-2 border-t border-white/5">
                      <button
                        onClick={() => openTrailer && openTrailer(movie)}
                        className="inline-flex items-center gap-1.5 bg-accent-gold hover:bg-accent-goldHover text-dark-900 text-xs font-bold px-4 py-2 rounded-lg transition-all"
                      >
                        <FaPlay className="w-2.5 h-2.5" />
                        <span>Watch Trailer</span>
                      </button>

                      <Link
                        to={`/movie/${movie.id}`}
                        className="inline-flex items-center text-xs font-semibold text-gray-300 hover:text-white px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                      >
                        Details & Tickets
                      </Link>

                      <button
                        onClick={() => toggleMyList && toggleMyList(movie)}
                        className={`p-2 rounded-lg border transition-colors ${
                          isSaved
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                        }`}
                        title={isSaved ? 'In My Watchlist' : 'Add to Watchlist'}
                      >
                        {isSaved ? <FaCheck className="w-3 h-3" /> : <FaBookmark className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-dark-800/40 rounded-3xl border border-white/5 p-8">
          <p className="text-gray-300 text-base font-semibold mb-2">
            No movies match your selected filters
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mb-6">
            Try adjusting the genre filter, sorting, or lowering the minimum rating requirement.
          </p>
          <button
            onClick={resetFilters}
            className="bg-accent-gold hover:bg-accent-goldHover text-dark-900 font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !loading && (
        <div className="text-center mt-12">
          <button
            onClick={() => setVisibleCount((prev) => prev + 12)}
            className="bg-dark-800 hover:bg-dark-700 text-accent-gold hover:text-accent-goldHover font-bold text-sm px-8 py-3 rounded-2xl border border-accent-gold/30 hover:border-accent-gold/60 transition-all shadow-xl hover:scale-105"
          >
            Load More Movies ({filteredAndSortedMovies.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};

export default DefaultlayoutHOC(MoviesPage);
