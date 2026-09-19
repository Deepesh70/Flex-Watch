import React, { useState, useEffect, useContext, useRef } from 'react';
import HeroSlider from 'react-slick';
import { Link } from 'react-router-dom';
import {
  FaStar,
  FaPlay,
  FaCheck,
  FaPlus,
  FaVolumeMute,
  FaVolumeUp,
  FaImage,
  FaVideo,
} from 'react-icons/fa';
import { MovieContext } from '../context/Movies.context';
import tmdbService from '../../services/tmdb';
import { HeroSkeleton } from '../common/LoadingSkeleton';
import { getMovieUrl } from '../../utils/slug';


const YOUTUBE_ORIGIN = 'https://www.youtube.com';

// Detect if user has a slow connection or low-end device
const isLowResourceEnvironment = () => {
  if (typeof navigator === 'undefined') return false;

  const conn =
    navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn) {
    if (conn.saveData) return true;
    if (
      conn.effectiveType === 'slow-2g' ||
      conn.effectiveType === '2g' ||
      conn.effectiveType === '3g'
    ) {
      return true;
    }
  }

  if (navigator.deviceMemory && navigator.deviceMemory < 4) return true;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return true;

  return false;
};

const HeroCarousal = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [videoKeys, setVideoKeys] = useState({}); // { [movieId]: videoKey }
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoDisabledByUser, setVideoDisabledByUser] = useState(false);
  const isLowRes = useRef(isLowResourceEnvironment());
  const activeIframeRef = useRef(null);

  const sliderRef = useRef(null);
  const { openTrailer, toggleMyList, isInMyList } = useContext(MovieContext);

  // Fetch Hero Carousel Movies from TMDB
  useEffect(() => {
    let isMounted = true;
    const fetchMovies = async () => {
      try {
        const results = await tmdbService.getNowPlaying();
        if (isMounted) {
          setMovies(results || []);
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to load hero carousel movies', e);
        if (isMounted) setLoading(false);
      }
    };
    fetchMovies();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Trailer Video for active slide if device/network allows
  useEffect(() => {
    if (!movies.length || isLowRes.current || videoDisabledByUser) {
      setIsVideoPlaying(false);
      return;
    }

    const currentMovie = movies[activeSlide];
    if (!currentMovie || !currentMovie.id) return;

    let isMounted = true;
    setIsVideoPlaying(false);

    const loadTrailer = async () => {
      // If already cached
      if (videoKeys[currentMovie.id] !== undefined) {
        if (videoKeys[currentMovie.id] && isMounted) {
          // Delay video start slightly for butter-smooth slide transitions
          setTimeout(() => {
            if (isMounted) setIsVideoPlaying(true);
          }, 1600);
        }
        return;
      }

      try {
        const videos = await tmdbService.getMovieVideos(currentMovie.id);
        const bestTrailer =
          videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
          videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
          videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser') ||
          videos.find((v) => v.site === 'YouTube');

        const key = bestTrailer ? bestTrailer.key : null;
        if (isMounted) {
          setVideoKeys((prev) => ({ ...prev, [currentMovie.id]: key }));
          if (key) {
            setTimeout(() => {
              if (isMounted) setIsVideoPlaying(true);
            }, 1600);
          }
        }
      } catch (err) {
        if (isMounted) {
          setVideoKeys((prev) => ({ ...prev, [currentMovie.id]: null }));
          setIsVideoPlaying(false);
        }
      }
    };

    loadTrailer();

    return () => {
      isMounted = false;
    };
  }, [activeSlide, movies, videoDisabledByUser, videoKeys]);

  // Listen to YouTube player END event (0) to automatically transition to next movie
  useEffect(() => {
    if (isVideoPlaying && activeIframeRef.current?.contentWindow) {
      try {
        activeIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'listening' }),
          YOUTUBE_ORIGIN
        );
      } catch {
        // Cross-origin message safety
      }
    }

    const handleYouTubeMessage = (event) => {
      if (event.origin !== YOUTUBE_ORIGIN) {
        return;
      }
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        // YouTube iframe API onStateChange event === 0 means ENDED
        if (
          (data?.event === 'onStateChange' && data?.info === 0) ||
          (data?.event === 'infoDelivery' && data?.info?.playerState === 0)
        ) {
          if (sliderRef.current) {
            sliderRef.current.slickNext();
          }
        }
      } catch {
        // non-json postMessage event
      }
    };

    window.addEventListener('message', handleYouTubeMessage);
    return () => {
      window.removeEventListener('message', handleYouTubeMessage);
    };
  }, [activeSlide, movies, videoDisabledByUser, videoKeys, isVideoPlaying]);

  if (loading) {
    return <HeroSkeleton />;
  }

  if (!movies.length) {
    return null;
  }

  const currentMovie = movies[activeSlide];
  const activeVideoKey = currentMovie ? videoKeys[currentMovie.id] : null;

  // Auto transition speed: If video is playing, slider will advance when video completes.
  // If video is not playing (slow net/poster only), slide auto advances after 8s.
  const settings = {
    arrows: false,
    dots: true,
    slidesToShow: 1,
    infinite: movies.length > 1,
    speed: 700,
    slidesToScroll: 1,
    autoplay: !isVideoPlaying,
    autoplaySpeed: 8000,
    fade: true,
    pauseOnHover: true,
    beforeChange: (current, next) => {
      setIsVideoPlaying(false);
      setActiveSlide(next);
    },
  };

  const getGenreLabels = (movie) => {
    if (movie.genres && movie.genres.length) {
      return movie.genres.slice(0, 3).map((g) => g.name);
    }
    const genreMap = {
      28: 'Action',
      12: 'Adventure',
      16: 'Animation',
      35: 'Comedy',
      80: 'Crime',
      99: 'Documentary',
      18: 'Drama',
      10751: 'Family',
      14: 'Fantasy',
      36: 'History',
      27: 'Horror',
      10402: 'Music',
      9648: 'Mystery',
      10749: 'Romance',
      878: 'Sci-Fi',
      53: 'Thriller',
      10752: 'War',
    };
    return (
      movie.genre_ids?.slice(0, 3).map((id) => genreMap[id]).filter(Boolean) || [
        'Featured',
      ]
    );
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-black select-none"
      style={{ height: '85vh', minHeight: '540px' }}
    >
      <HeroSlider ref={sliderRef} {...settings}>
        {movies.slice(0, 6).map((movie, index) => {
          const isSaved = isInMyList ? isInMyList(movie.id) : false;
          const backdrop = movie.backdrop_path
            ? movie.backdrop_path.startsWith('http')
              ? movie.backdrop_path
              : `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
            : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80';

          const isCurrentActive = activeSlide === index;
          const shouldShowVideo =
            isCurrentActive &&
            isVideoPlaying &&
            activeVideoKey &&
            !videoDisabledByUser &&
            !isLowRes.current;

          return (
            <div key={movie.id || index}>
              <div
                className="relative w-full overflow-hidden bg-black"
                style={{ height: '85vh', minHeight: '540px' }}
              >
                {/* 1. High Definition Backdrop Poster (Always loaded smoothly as baseline) */}
                <img
                  src={backdrop}
                  alt={movie.title || movie.original_title}
                  className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000 ${
                    shouldShowVideo ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                  }`}
                />

                {/* 2. Embedded Video Trailer (Plays automatically in background on high-speed connection) */}
                {shouldShowVideo && (
                  <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 animate-fade-in">
                    <iframe
                      ref={activeIframeRef}
                      title={`${movie.title} Trailer Stream`}
                      src={`https://www.youtube.com/embed/${activeVideoKey}?autoplay=1&mute=${
                        isMuted ? '1' : '0'
                      }&controls=0&modestbranding=1&rel=0&loop=0&enablejsapi=1&iv_load_policy=3&playsinline=1&origin=${
                        typeof window !== 'undefined' ? window.location.origin : ''
                      }`}
                      className="absolute top-1/2 left-1/2 w-[125vw] h-[125vh] -translate-x-1/2 -translate-y-1/2 border-0 scale-125 object-cover"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Cinematic Vignettes & Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-dark-900 via-dark-900/75 to-transparent z-10 pointer-events-none" />

                {/* Content Details Layer */}
                <div className="absolute inset-0 z-20 flex items-center">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div
                      className={`max-w-2xl transition-all duration-700 ${
                        activeSlide === index
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-6'
                      }`}
                    >
                      {/* Live Trailer / Teaser Indicator Badge */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {shouldShowVideo ? (
                          <span className="inline-flex items-center gap-1.5 bg-red-600 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            Official Preview
                          </span>
                        ) : (
                          <span className="bg-accent-gold text-dark-900 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Featured
                          </span>
                        )}

                        {getGenreLabels(movie).map((genre, i) => (
                          <span
                            key={i}
                            className="text-xs font-medium text-gray-300 bg-dark-800/80 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-sm"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>

                      {/* Title */}
                      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-3 uppercase tracking-tight drop-shadow-xl">
                        {movie.title || movie.original_title}
                      </h1>

                      {/* Rating & Metadata Bar */}
                      <div className="flex items-center gap-3 text-sm text-gray-300 mb-4">
                        <div className="flex items-center gap-1.5 bg-black/70 px-2.5 py-1 rounded-lg border border-white/10 shadow">
                          <FaStar className="text-accent-gold w-4 h-4" />
                          <span className="text-accent-gold font-bold">
                            {Number(movie.vote_average || 0).toFixed(1)}
                          </span>
                          <span className="text-gray-400 text-xs">/ 10</span>
                        </div>

                        {movie.release_date && (
                          <span className="text-gray-300 font-medium">
                            {new Date(movie.release_date).getFullYear()}
                          </span>
                        )}

                        <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-gray-300 border border-white/10 font-semibold">
                          4K UHD
                        </span>

                        {isLowRes.current && (
                          <span className="text-[11px] text-gray-400 italic">
                            (Lite Mode)
                          </span>
                        )}
                      </div>

                      {/* Synopsis */}
                      <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed mb-6 line-clamp-3 max-w-xl drop-shadow">
                        {movie.overview}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => openTrailer && openTrailer(movie)}
                          className="flex items-center gap-2 bg-accent-gold hover:bg-accent-goldHover text-dark-900 font-extrabold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-accent-gold/25"
                        >
                          <FaPlay className="w-3.5 h-3.5" />
                          <span>Watch Trailer</span>
                        </button>

                        <Link
                          to={getMovieUrl(movie)}
                          state={{ movieId: movie.id }}
                          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 border border-white/10 backdrop-blur-md"
                        >
                          <span>More Info</span>
                        </Link>


                        <button
                          onClick={() => toggleMyList && toggleMyList(movie)}
                          aria-label={isSaved ? 'In My List' : 'Add to My List'}
                          className={`p-3.5 rounded-xl border transition-all duration-200 ${
                            isSaved
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                          }`}
                        >
                          {isSaved ? (
                            <FaCheck className="w-4 h-4" />
                          ) : (
                            <FaPlus className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </HeroSlider>

      {/* Floating Ambient Controls: Audio Mute / Unmute & Trailer Mode Toggle */}
      <div className="absolute bottom-10 right-6 sm:right-12 z-30 flex items-center gap-2">
        {isVideoPlaying && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex items-center gap-1.5 bg-dark-800/80 hover:bg-dark-700 text-white p-2.5 sm:px-3 sm:py-2 rounded-full border border-white/10 backdrop-blur-md text-xs font-semibold shadow-xl transition-all hover:scale-105"
            title={isMuted ? 'Unmute Preview Audio' : 'Mute Preview Audio'}
          >
            {isMuted ? (
              <FaVolumeMute className="w-4 h-4 text-gray-400" />
            ) : (
              <FaVolumeUp className="w-4 h-4 text-accent-gold" />
            )}
            <span className="hidden sm:inline text-[11px]">
              {isMuted ? 'Muted' : 'Sound On'}
            </span>
          </button>
        )}

        {/* Video Mode Toggle for User Choice */}
        <button
          onClick={() => {
            setVideoDisabledByUser(!videoDisabledByUser);
            setIsVideoPlaying(false);
          }}
          className="flex items-center gap-1.5 bg-dark-800/80 hover:bg-dark-700 text-white p-2.5 sm:px-3 sm:py-2 rounded-full border border-white/10 backdrop-blur-md text-xs font-semibold shadow-xl transition-all hover:scale-105"
          title={
            videoDisabledByUser
              ? 'Enable Live Video Previews'
              : 'Switch to Poster Backdrop Mode'
          }
        >
          {videoDisabledByUser ? (
            <>
              <FaVideo className="w-3.5 h-3.5 text-accent-gold" />
              <span className="hidden sm:inline text-[11px]">Play Video</span>
            </>
          ) : (
            <>
              <FaImage className="w-3.5 h-3.5 text-gray-400" />
              <span className="hidden sm:inline text-[11px]">Poster Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom Gradient for seamless integration */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-dark-900 to-transparent z-30 pointer-events-none" />
    </div>
  );
};

export default HeroCarousal;