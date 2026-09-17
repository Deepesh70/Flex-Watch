import React, { useEffect, useState, useContext } from 'react';
import MovielayoutHOC from '../layouts/Movie.layout';
import { useParams, Link } from 'react-router-dom';
import { MovieContext } from '../components/context/Movies.context';
import { FaStar, FaFilm, FaArrowLeft } from 'react-icons/fa';
import PostSlider from '../components/PostSlider/PostSlider.component';
import MovieHero from '../components/MovieHero/MovieHero';
import tmdbService from '../services/tmdb';
import { MovieDetailSkeleton } from '../components/common/LoadingSkeleton';

const MoviePage = () => {
  const { id } = useParams();
  const { movie, setMovie } = useContext(MovieContext);
  const [cast, setCast] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch movie data, cast, similar & recommendations strictly from TMDB
  useEffect(() => {
    let isMounted = true;
    const fetchMovieData = async () => {
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const movieData = await tmdbService.getMovieDetails(id);
        const [creditsData, similarData, recsData] = await Promise.all([
          tmdbService.getMovieCredits(id),
          tmdbService.getSimilarMovies(id),
          tmdbService.getRecommendations(id, movieData?.title),
        ]);

        if (isMounted) {
          setMovie(movieData || null);
          setCast(creditsData?.cast ? creditsData.cast.slice(0, 10) : []);
          setSimilarMovies(similarData || []);
          setRecommendedMovies(recsData || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching movie details page data from TMDB:', err);
        if (isMounted) {
          setMovie(null);
          setLoading(false);
        }
      }
    };

    fetchMovieData();
    return () => {
      isMounted = false;
    };
  }, [id, setMovie]);

  if (loading) {
    return <MovieDetailSkeleton />;
  }

  // If TMDB does not find the movie or API key is not configured
  if (!movie) {
    return (
      <div className="bg-dark-900 min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="bg-dark-800/80 rounded-3xl border border-white/10 p-10 shadow-2xl">
          <div className="w-16 h-16 bg-accent-gold/10 text-accent-gold rounded-full flex items-center justify-center mx-auto mb-4 border border-accent-gold/20">
            <FaFilm className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Nothing to show</h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
            We couldn't find details for movie ID <span className="text-accent-gold font-mono">"{id}"</span> in TMDB.
          </p>
          <Link
            to="/movies"
            className="inline-flex items-center gap-2 bg-accent-gold hover:bg-accent-goldHover text-dark-900 font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-lg"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Movies Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-900 min-h-screen pb-16">
      {/* Movie Hero Section */}
      <MovieHero />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* About the movie Card */}
        <div className="bg-dark-800/80 rounded-2xl border border-white/10 p-6 md:p-8 mb-10 shadow-xl">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-accent-gold rounded-full inline-block" />
            About the Movie
          </h2>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base mb-6">
            {movie.overview || 'No synopsis available for this title on TMDB.'}
          </p>

          {/* Quick Metrics from TMDB */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/5 pt-6">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block">IMDb Rating</span>
              <span className="text-sm font-bold text-accent-gold flex items-center gap-1 mt-1">
                <FaStar className="w-3.5 h-3.5" />
                {Number(movie.vote_average || 0).toFixed(1)} / 10
              </span>
            </div>
            {movie.runtime ? (
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider block">Duration</span>
                <span className="text-sm font-bold text-white mt-1 block">
                  {movie.runtime} min
                </span>
              </div>
            ) : null}
            {movie.release_date ? (
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider block">Release Date</span>
                <span className="text-sm font-bold text-white mt-1 block">
                  {movie.release_date}
                </span>
              </div>
            ) : null}
            {movie.vote_count ? (
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider block">Total Votes</span>
                <span className="text-sm font-bold text-gray-300 mt-1 block">
                  {Number(movie.vote_count).toLocaleString()}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Cast & Crew Carousel */}
        {cast && cast.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-accent-gold rounded-full inline-block" />
              Cast & Crew
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {cast.map((actor) => (
                <div
                  key={actor.id}
                  className="bg-dark-800/60 rounded-2xl border border-white/5 p-3 text-center group hover:border-accent-gold/40 transition-all shadow-md"
                >
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-3 border-2 border-white/10 group-hover:border-accent-gold transition-colors">
                    <img
                      src={
                        actor.profile_path
                          ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={actor.name}
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="text-white text-xs font-semibold truncate group-hover:text-accent-gold transition-colors">
                    {actor.name}
                  </h4>
                  <p className="text-gray-500 text-[11px] truncate mt-0.5">
                    {actor.character || 'Cast Member'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interested & Similar Movies */}
        {similarMovies.length > 0 && (
          <section className="mb-12">
            <PostSlider
              title="More Like This"
              subtitle="Similar titles from TMDB"
              posters={similarMovies}
              isDark={true}
            />
          </section>
        )}

        {/* TMDB Recommendations */}
        {recommendedMovies.length > 0 && (
          <section className="mb-12">
            <PostSlider
              title="Recommended For You"
              subtitle="Viewers who watched this also enjoyed (TMDB)"
              posters={recommendedMovies}
              isDark={true}
            />
          </section>
        )}
      </div>
    </div>
  );
};

export default MovielayoutHOC(MoviePage);
