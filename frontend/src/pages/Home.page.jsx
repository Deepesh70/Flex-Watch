import React, { useEffect, useState, useContext } from 'react';
import DefaultlayoutHOC from '../layouts/Default.layout';
import HeroCarousal from '../components/HeroCarousal/HeroCarousal.component';
import PosterSlider from '../components/PostSlider/PostSlider.component';
import CategoryFilter from '../components/CategoryFilter/CategoryFilter.component';
import FeaturedMovie from '../components/FeaturedMovie/FeaturedMovie.component';
import Poster from '../components/poster/Poster.component';
import { MovieContext } from '../components/context/Movies.context';
import tmdbService from '../services/tmdb';
import { PosterSliderSkeleton } from '../components/common/LoadingSkeleton';
import { FaFilm, FaInfoCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import { TMDB_API_KEY } from '../config/env';

const HomePage = () => {
  const { search, myList } = useContext(MovieContext);
  const [searchResults, setSearchResults] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [activeCategory, setActiveCategory] = useState('popular');
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const hasApiKey = Boolean(TMDB_API_KEY);

  // Load all movie categories using tmdbService
  useEffect(() => {
    let isMounted = true;
    const loadAllMovies = async () => {
      setLoading(true);
      try {
        const [popular, topRated, upcoming, trending, nowPlaying] = await Promise.all([
          tmdbService.getPopular(),
          tmdbService.getTopRated(),
          tmdbService.getUpcoming(),
          tmdbService.getTrending(),
          tmdbService.getNowPlaying(),
        ]);

        if (isMounted) {
          setPopularMovies(popular || []);
          setTopRatedMovies(topRated || []);
          setUpcomingMovies(upcoming || []);
          setTrendingMovies(trending || []);
          setNowPlayingMovies(nowPlaying || []);
          setFilteredMovies(popular || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching home page movie sections from TMDB:', err);
        if (isMounted) setLoading(false);
      }
    };

    loadAllMovies();
    return () => {
      isMounted = false;
    };
  }, []);

  // Category Filter Logic
  useEffect(() => {
    if (activeCategory === 'popular') {
      setFilteredMovies(popularMovies);
    } else {
      const allMovies = [
        ...popularMovies,
        ...topRatedMovies,
        ...nowPlayingMovies,
        ...trendingMovies,
        ...upcomingMovies,
      ];
      const genreFiltered = allMovies
        .filter((m) => m.genre_ids?.includes(Number(activeCategory)))
        .filter((movie, index, self) => index === self.findIndex((m) => m.id === movie.id));
      setFilteredMovies(genreFiltered);
    }
  }, [activeCategory, popularMovies, topRatedMovies, nowPlayingMovies, trendingMovies, upcomingMovies]);

  // Search execution
  useEffect(() => {
    let isMounted = true;
    if (search && search.trim()) {
      const execSearch = async () => {
        try {
          const results = await tmdbService.searchMovies(search);
          if (isMounted) setSearchResults(results || []);
        } catch (err) {
          if (isMounted) setSearchResults([]);
        }
      };
      execSearch();
    } else {
      setSearchResults([]);
    }
    return () => {
      isMounted = false;
    };
  }, [search]);

  // Search Results View
  if (search && search.trim()) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Search Results for <span className="text-accent-gold">"{search}"</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Found {searchResults.length} matching titles from TMDB
            </p>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {searchResults.map((movie) => (
                <Poster {...movie} key={movie.id} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-dark-800/50 rounded-2xl border border-white/5 p-8">
              <FaFilm className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-300 text-base font-bold mb-1">Nothing to show</p>
              <p className="text-gray-500 text-sm">No TMDB movies found matching "{search}".</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const hasAnyMovies =
    popularMovies.length > 0 ||
    topRatedMovies.length > 0 ||
    upcomingMovies.length > 0 ||
    nowPlayingMovies.length > 0;

  // Spotlights
  const featuredMovie1 =
    popularMovies.find((m) => m.backdrop_path && m.vote_average >= 7) || popularMovies[0];
  const featuredMovie2 =
    topRatedMovies.find((m) => m.backdrop_path && m.id !== featuredMovie1?.id) || topRatedMovies[0];

  return (
    <div className="min-h-screen">
      {/* Hero Carousel */}
      <HeroCarousal />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Category Pills Filter */}
        {hasAnyMovies && (
          <div className="mb-8">
            <CategoryFilter
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>
        )}

        {/* If loading */}
        {loading && (
          <div className="space-y-12 mb-12">
            <PosterSliderSkeleton count={6} />
            <PosterSliderSkeleton count={6} />
          </div>
        )}

        {/* Empty state if TMDB key is missing or no movies returned */}
        {!loading && !hasAnyMovies && (
          <div className="text-center py-20 bg-dark-800/60 rounded-3xl border border-white/10 p-8 my-8 max-w-2xl mx-auto shadow-2xl">
            <div className="w-16 h-16 bg-accent-gold/10 text-accent-gold rounded-full flex items-center justify-center mx-auto mb-4 border border-accent-gold/20">
              <FaFilm className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Nothing to show right now</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              {hasApiKey
                ? 'No movies are currently returned by the TMDB API for this region.'
                : 'To display live movies directly from TMDB with zero dummy data, configure your TMDB API Key in the .env file.'}
            </p>
            {!hasApiKey && (
              <div className="inline-flex items-center gap-2 bg-dark-700 text-gray-300 text-xs px-4 py-2.5 rounded-xl border border-white/10 mb-6 font-mono">
                <FaInfoCircle className="text-accent-gold w-4 h-4" />
                <span>REACT_APP_API_KEY=your_tmdb_api_key</span>
              </div>
            )}
            <div>
              <Link
                to="/movies"
                className="inline-block bg-accent-gold hover:bg-accent-goldHover text-dark-900 font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-lg"
              >
                Browse Movies Catalog
              </Link>
            </div>
          </div>
        )}

        {/* 1. Filtered / Trending Genre Section (Directly below category pills) */}
        {!loading && filteredMovies.length > 0 && (
          <section className="mb-12">
            <PosterSlider
              key={`genre-slider-${activeCategory}`}
              title={activeCategory === 'popular' ? 'Trending Hits' : 'Genre Selection'}
              subtitle="Curated picks from TMDB"
              posters={filteredMovies}
              isDark={true}
            />
          </section>
        )}

        {/* 2. My Watchlist Section (Placed below Genre Selection) */}
        {myList && myList.length > 0 && (
          <section className="mb-12">
            <PosterSlider
              title="My Watchlist"
              subtitle={`${myList.length} saved for later`}
              posters={myList}
              isDark={true}
            />
          </section>
        )}

        {/* 3. Spotlight Featured 1 */}
        {featuredMovie1 && !loading && (
          <section className="mb-14">
            <FeaturedMovie movie={featuredMovie1} />
          </section>
        )}

        {/* 4. Top Rated Masterpieces */}
        {!loading && topRatedMovies.length > 0 && (
          <section className="mb-12">
            <PosterSlider
              title="Top Rated Masterpieces"
              subtitle="Critically acclaimed movies from TMDB"
              posters={topRatedMovies}
              isDark={true}
            />
          </section>
        )}

        {/* 5. Upcoming Movies */}
        {!loading && upcomingMovies.length > 0 && (
          <section className="mb-12">
            <PosterSlider
              title="Coming Soon to Theaters"
              subtitle="Upcoming cinematic releases from TMDB"
              posters={upcomingMovies}
              isDark={true}
            />
          </section>
        )}

        {/* 6. Spotlight Featured 2 */}
        {featuredMovie2 && !loading && (
          <section className="mb-14">
            <FeaturedMovie movie={featuredMovie2} />
          </section>
        )}

        {/* 7. Now Playing in Theaters */}
        {!loading && nowPlayingMovies.length > 0 && (
          <section className="mb-12">
            <PosterSlider
              title="Now Playing in Theaters"
              subtitle="Currently showing in theaters according to TMDB"
              posters={nowPlayingMovies}
              isDark={true}
            />
          </section>
        )}
      </div>
    </div>
  );
};

export default DefaultlayoutHOC(HomePage);
