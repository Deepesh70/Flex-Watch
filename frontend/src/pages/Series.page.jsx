import React, { useEffect, useState, useContext, useMemo } from 'react';
import DefaultlayoutHOC from '../layouts/Default.layout';
import Poster from '../components/poster/Poster.component';
import tmdbService from '../services/tmdb';
import { MovieContext } from '../components/context/Movies.context';
import { PosterSliderSkeleton } from '../components/common/LoadingSkeleton';
import {
  FaSortAmountDown,
  FaStar,
  FaTh,
  FaList,
  FaPlay,
  FaBookmark,
  FaCheck,
  FaUndo,
  FaTv,
} from 'react-icons/fa';

const TV_GENRES = [
  { id: 'all', name: 'All Genres' },
  { id: 18, name: 'Drama' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10759, name: 'Action & Adventure' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 9648, name: 'Mystery' },
  { id: 16, name: 'Animation' },
  { id: 99, name: 'Documentary' },
];

const SORT_OPTIONS = [
  { id: 'popular', name: 'Most Popular' },
  { id: 'rating-desc', name: 'Highest Rated' },
  { id: 'newest', name: 'Airing / Recent' },
  { id: 'title-asc', name: 'Title (A to Z)' },
];

const SeriesPage = () => {
  const { openTrailer, toggleMyList, isInMyList } = useContext(MovieContext);
  const [allSeries, setAllSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [minRating, setMinRating] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [visibleCount, setVisibleCount] = useState(18);

  useEffect(() => {
    let isMounted = true;
    const fetchTVCatalog = async () => {
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const [popular, topRated, onTheAir, trending] = await Promise.all([
          tmdbService.getPopularTV(),
          tmdbService.getTopRatedTV(),
          tmdbService.getOnTheAirTV(),
          tmdbService.getTrendingTV(),
        ]);

        // Normalize TV show object keys for standard Poster component
        const normalizeTV = (items) =>
          (items || []).map((tv) => ({
            ...tv,
            title: tv.name || tv.original_name,
            original_title: tv.original_name || tv.name,
            release_date: tv.first_air_date,
          }));

        const combined = [
          ...normalizeTV(popular),
          ...normalizeTV(topRated),
          ...normalizeTV(onTheAir),
          ...normalizeTV(trending),
        ];

        const unique = combined.filter(
          (show, index, self) => index === self.findIndex((s) => s.id === show.id)
        );

        if (isMounted) {
          setAllSeries(unique);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching TV series catalog:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchTVCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter & Sort Logic
  const filteredAndSortedSeries = useMemo(() => {
    let result = [...allSeries];

    // Filter by Genre
    if (selectedGenre !== 'all') {
      result = result.filter((s) => s.genre_ids?.includes(Number(selectedGenre)));
    }

    // Filter by Min Rating
    if (minRating > 0) {
      result = result.filter((s) => Number(s.vote_average || 0) >= minRating);
    }

    // Sorting
    switch (selectedSort) {
      case 'rating-desc':
        result.sort((a, b) => Number(b.vote_average || 0) - Number(a.vote_average || 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0));
        break;
      case 'title-asc':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'popular':
      default:
        result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
    }

    return result;
  }, [allSeries, selectedGenre, selectedSort, minRating]);

  const visibleSeries = filteredAndSortedSeries.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSortedSeries.length;

  const resetFilters = () => {
    setSelectedGenre('all');
    setSelectedSort('popular');
    setMinRating(0);
    setVisibleCount(18);
  };

  const isFiltered = selectedGenre !== 'all' || selectedSort !== 'popular' || minRating > 0;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="mb-8 text-center sm:text-left bg-gradient-to-r from-accent-gold/10 via-dark-800 to-dark-800 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-accent-gold text-dark-900 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              TV Shows & Series
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {allSeries.length} Series Indexed via TMDB
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-2">
            TV Series Catalog & Episodes
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
            Binge-watch acclaimed drama series, anime, mystery sagas, and sci-fi franchises in 4K resolution.
          </p>
        </div>
      </div>

      {/* Control Bar: Genre Chips */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {TV_GENRES.map((genre) => {
            const count =
              genre.id === 'all'
                ? allSeries.length
                : allSeries.filter((s) => s.genre_ids?.includes(Number(genre.id))).length;

            const isSelected = selectedGenre === String(genre.id);

            return (
              <button
                key={genre.id}
                onClick={() => {
                  setSelectedGenre(String(genre.id));
                  setVisibleCount(18);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-accent-gold text-dark-900 border-accent-gold font-bold shadow-md shadow-accent-gold/20'
                    : 'bg-dark-700 text-gray-300 border-white/10 hover:border-accent-gold/40 hover:text-white'
                }`}
              >
                <span>{genre.name}</span>
                <span className={`ml-1.5 text-[11px] ${isSelected ? 'text-dark-900/80 font-bold' : 'text-gray-500'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Row: Sort, Min Rating, View Toggle, Reset */}
        <div className="bg-dark-800/80 rounded-2xl border border-white/10 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Selector */}
            <div className="flex items-center gap-2 bg-dark-700 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <FaSortAmountDown className="text-accent-gold w-3.5 h-3.5" />
              <span className="text-gray-400">Sort:</span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-dark-800 text-white">
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Rating Selector */}
            <div className="flex items-center gap-2 bg-dark-700 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <FaStar className="text-accent-gold w-3.5 h-3.5" />
              <span className="text-gray-400">Rating:</span>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value={0} className="bg-dark-800 text-white">
                  All Ratings
                </option>
                <option value={7} className="bg-dark-800 text-white">
                  7.0+ Rated
                </option>
                <option value={8} className="bg-dark-800 text-white">
                  8.0+ Masterpieces
                </option>
                <option value={8.5} className="bg-dark-800 text-white">
                  8.5+ Top Tier
                </option>
              </select>
            </div>

            {/* Reset Button */}
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs text-accent-gold hover:text-accent-goldHover transition-colors px-2 py-1"
              >
                <FaUndo className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* View Mode Toggle & Results Count */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Showing <strong className="text-white">{visibleSeries.length}</strong> of{' '}
              <strong className="text-accent-gold">{filteredAndSortedSeries.length}</strong> series
            </span>

            <div className="flex items-center bg-dark-700 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-accent-gold text-dark-900 shadow'
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
                    ? 'bg-accent-gold text-dark-900 shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Detailed List View"
              >
                <FaList className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6">
          <PosterSliderSkeleton count={6} />
          <PosterSliderSkeleton count={6} />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAndSortedSeries.length === 0 && (
        <div className="text-center py-20 bg-dark-800/60 rounded-3xl border border-white/10 p-8 shadow-2xl">
          <FaTv className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-1">No TV Series match your filters</h3>
          <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
            Try adjusting your genre selection or minimum rating threshold to explore more television series.
          </p>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-2 bg-accent-gold hover:bg-accent-goldHover text-dark-900 font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md"
          >
            <FaUndo className="w-3 h-3" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}

      {/* Grid View */}
      {!loading && viewMode === 'grid' && visibleSeries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 animate-fade-in">
          {visibleSeries.map((series) => (
            <Poster {...series} key={series.id} />
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && visibleSeries.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          {visibleSeries.map((series) => {
            const isSaved = isInMyList ? isInMyList(series.id) : false;
            const poster = series.poster_path
              ? (series.poster_path.startsWith('http')
                ? series.poster_path
                : `https://image.tmdb.org/t/p/w300${series.poster_path}`)
              : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80';

            return (
              <div
                key={series.id}
                className="bg-dark-800/90 rounded-2xl border border-white/10 p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 hover:border-accent-gold/40 transition-all shadow-lg group"
              >
                <div className="w-24 h-36 flex-shrink-0 rounded-xl overflow-hidden bg-dark-700 border border-white/10">
                  <img
                    src={poster}
                    alt={series.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-accent-gold transition-colors truncate">
                      {series.title}
                    </h3>
                    {series.release_date && (
                      <span className="text-xs text-gray-500 font-medium">
                        ({new Date(series.release_date).getFullYear()})
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-400 mb-2">
                    {series.vote_average ? (
                      <span className="flex items-center gap-1 text-accent-gold font-bold">
                        <FaStar className="w-3 h-3" />
                        {Number(series.vote_average).toFixed(1)} / 10
                      </span>
                    ) : null}
                    <span>•</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded text-[11px] text-gray-300">
                      TV Series
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">HD / 4K</span>
                  </div>

                  <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 mb-4 leading-relaxed">
                    {series.overview || 'No synopsis available for this TV series.'}
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <button
                      onClick={() => openTrailer && openTrailer(series)}
                      className="inline-flex items-center gap-1.5 bg-accent-gold hover:bg-accent-goldHover text-dark-900 text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-md"
                    >
                      <FaPlay className="w-3 h-3" />
                      <span>Watch Trailer</span>
                    </button>

                    <button
                      onClick={() => toggleMyList && toggleMyList(series)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border transition-colors ${
                        isSaved
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                      }`}
                    >
                      {isSaved ? <FaCheck className="w-3 h-3" /> : <FaBookmark className="w-3 h-3" />}
                      <span>{isSaved ? 'In Watchlist' : 'Add to List'}</span>
                    </button>

                    {series.id && (
                      <a
                        href={`https://www.themoviedb.org/tv/${series.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white px-3 py-2"
                      >
                        <span>TMDB Info</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Pagination */}
      {!loading && hasMore && (
        <div className="text-center mt-12">
          <button
            onClick={() => setVisibleCount((prev) => prev + 18)}
            className="inline-flex items-center gap-2 bg-dark-700 hover:bg-dark-600 text-white font-bold text-xs sm:text-sm px-8 py-3 rounded-2xl border border-white/10 hover:border-accent-gold/40 transition-all shadow-xl hover:scale-105"
          >
            <span>Load More Series</span>
            <span className="text-accent-gold text-xs">
              ({filteredAndSortedSeries.length - visibleCount} remaining)
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DefaultlayoutHOC(SeriesPage);
