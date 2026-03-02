import { React, useEffect, useState, useContext } from "react";
import axios from "axios";
import DefaultlayoutHOC from "../layouts/Default.layout";
import HeroCarousal from "../components/HeroCarousal/HeroCarousal.component";
import PosterSlider from "../components/PostSlider/PostSlider.component";
import CategoryFilter from "../components/CategoryFilter/CategoryFilter.component";
import FeaturedMovie from "../components/FeaturedMovie/FeaturedMovie.component";
import { MovieContext } from "../components/context/Movies.context";

const HomePage = () => {
  const { search } = useContext(MovieContext);
  const [searchResults, setSearchResults] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [activeCategory, setActiveCategory] = useState("popular");
  const [filteredMovies, setFilteredMovies] = useState([]);

  // Fetch Popular Movies
  useEffect(() => {
    const requestPopularMovies = async () => {
      const res = await axios.get(`/popular`);
      setPopularMovies(res.data.results);
    };
    requestPopularMovies();
  }, []);

  // Fetch Top Rated Movies
  useEffect(() => {
    const requestTopRatedMovies = async () => {
      const res = await axios.get(`/top_rated`);
      setTopRatedMovies(res.data.results);
    };
    requestTopRatedMovies();
  }, []);

  // Fetch Upcoming Movies
  useEffect(() => {
    const requestUpcomingMovies = async () => {
      const res = await axios.get(`/upcoming`);
      setUpcomingMovies(res.data.results);
    };
    requestUpcomingMovies();
  }, []);

  // Fetch Trending Movies (weekly)
  useEffect(() => {
    const requestTrendingMovies = async () => {
      try {
        const res = await axios.get(
          `https://api.themoviedb.org/3/trending/movie/week`,
          { params: { api_key: process.env.REACT_APP_API_KEY } }
        );
        setTrendingMovies(res.data.results);
      } catch (err) {
        console.error("Trending API failed", err);
      }
    };
    requestTrendingMovies();
  }, []);

  // Fetch Now Playing
  useEffect(() => {
    const requestNowPlaying = async () => {
      const res = await axios.get(`/now_playing`);
      setNowPlayingMovies(res.data.results);
    };
    requestNowPlaying();
  }, []);

  // Category Filter Logic
  useEffect(() => {
    if (activeCategory === "popular") {
      setFilteredMovies(popularMovies);
    } else {
      const genreFiltered = [...popularMovies, ...topRatedMovies, ...nowPlayingMovies]
        .filter(m => m.genre_ids?.includes(activeCategory))
        .filter((movie, index, self) =>
          index === self.findIndex(m => m.id === movie.id)
        );
      setFilteredMovies(genreFiltered);
    }
  }, [activeCategory, popularMovies, topRatedMovies, nowPlayingMovies]);

  // Search
  useEffect(() => {
    if (search) {
      const requestSearchMovies = async () => {
        try {
          const res = await axios.get(
            `https://api.themoviedb.org/3/search/movie`,
            { params: { query: search } }
          );
          setSearchResults(res.data.results);
        } catch (error) {
          console.error("Search API failed", error);
        }
      };
      requestSearchMovies();
    }
  }, [search]);

  // Search Results View
  if (search) {
    return (
      <div className="min-h-screen pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PosterSlider
            title={`Search Results for "${search}"`}
            subtitle={`${searchResults.length} results found`}
            posters={searchResults}
            isDark={true}
          />
        </div>
      </div>
    );
  }

  // Featured movie — pick the first popular movie with a good backdrop
  const featuredMovie1 = popularMovies.find(m => m.backdrop_path && m.vote_average > 6) || popularMovies[0];
  const featuredMovie2 = trendingMovies.find(m => m.backdrop_path && m.id !== featuredMovie1?.id) || trendingMovies[1];

  return (
    <div className="min-h-screen">
      {/* Hero Carousel */}
      <HeroCarousal />

      {/* Category Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-40 mb-10">
        <CategoryFilter
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* Most Viewed / Filtered Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <PosterSlider
          title={activeCategory === "popular" ? "Most Viewed" : "Filtered Results"}
          subtitle="Top picks for you"
          posters={filteredMovies}
          isDark={true}
        />
      </section>

      {/* Featured Movie Spotlight 1 */}
      {featuredMovie1 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <FeaturedMovie movie={featuredMovie1} />
        </section>
      )}

      {/* Most Popular */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <PosterSlider
          title="Most Popular"
          subtitle="Trending this week"
          posters={trendingMovies}
          isDark={true}
        />
      </section>

      {/* Top Rated */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <PosterSlider
          title="Top Rated"
          subtitle="Highest rated movies of all time"
          posters={topRatedMovies}
          isDark={true}
        />
      </section>

      {/* Featured Movie Spotlight 2 */}
      {featuredMovie2 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
            Popular TV Series
          </h2>
          <FeaturedMovie movie={featuredMovie2} />
        </section>
      )}

      {/* Upcoming Movies */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <PosterSlider
          title="Coming Soon"
          subtitle="Don't miss these upcoming releases"
          posters={upcomingMovies}
          isDark={true}
        />
      </section>

      {/* Now Playing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <PosterSlider
          title="Now Playing"
          subtitle="Currently in theaters"
          posters={nowPlayingMovies}
          isDark={true}
        />
      </section>
    </div>
  );
};

export default DefaultlayoutHOC(HomePage);
