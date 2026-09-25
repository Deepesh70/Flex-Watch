import React, { useState, createContext, useEffect } from 'react';
import tmdbService, { watchlistService } from '../../services/tmdb';

export const MovieContext = createContext();

const MovieProvider = ({ children }) => {
  const [movie, setMovie] = useState({
    id: 0,
    original_title: '',
    title: '',
    overview: '',
    backdrop_path: '',
    poster_path: '',
    vote_average: 0,
    genres: [],
    runtime: 0,
  });

  const [search, setSearch] = useState('');
  const [myList, setMyList] = useState(() => {
    try {
      const saved = localStorage.getItem('flexwatch_mylist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTrailer, setActiveTrailer] = useState(null); // { ...movie, videoKey, loading } or null

function normalizeServerItem(item) {
  return {
    id: item.tmdbId,
    title: item.title,
    overview: item.overview,
    poster_path: item.posterPath,
    backdrop_path: item.backdropPath,
    vote_average: item.voteAverage,
    release_date: item.releaseDate,
    media_type: item.mediaType,
  };
}

function mergeWatchlists(serverItems, localItems) {
  const formatted = serverItems.map(normalizeServerItem);
  const combined = [...formatted];
  for (const item of localItems) {
    if (!combined.some((c) => c.id === item.id)) {
      combined.push(item);
    }
  }
  return combined;
}

// Sync with Backend Watchlist on mount
  useEffect(() => {
    let isMounted = true;
    const loadBackendWatchlist = async () => {
      try {
        const serverItems = await watchlistService.getWatchlist();
        if (serverItems?.length > 0 && isMounted) {
          setMyList((prev) => mergeWatchlists(serverItems, prev));
        }
      } catch (err) {
        console.warn('Could not sync with backend watchlist:', err.message);
      }
    };

    loadBackendWatchlist();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save to LocalStorage as offline fallback
  useEffect(() => {
    try {
      localStorage.setItem('flexwatch_mylist', JSON.stringify(myList));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [myList]);

  const toggleMyList = async (movieItem) => {
    if (!movieItem || !movieItem.id) return;
    const exists = myList.some((m) => m.id === movieItem.id);

    // Optimistic UI update
    setMyList((prev) => {
      if (exists) {
        return prev.filter((m) => m.id !== movieItem.id);
      }
      return [...prev, movieItem];
    });

    // Background server persistence
    try {
      if (exists) {
        await watchlistService.removeFromWatchlist(movieItem.id, movieItem.media_type || 'movie');
      } else {
        await watchlistService.addToWatchlist(movieItem);
      }
    } catch (e) {
      console.warn('Watchlist sync error:', e.message);
    }
  };

  const isInMyList = (movieId) => {
    return myList.some((m) => m.id === movieId);
  };

  // Dynamically fetch the official movie trailer from TMDB videos
  const openTrailer = async (movieItem) => {
    if (!movieItem) return;

    // Open modal immediately with loading state
    setActiveTrailer({
      ...movieItem,
      videoKey: null,
      loading: true,
    });

    try {
      if (movieItem.id) {
        const videos = await tmdbService.getMovieVideos(movieItem.id);
        // Priority: Official YouTube Trailer > YouTube Trailer > YouTube Teaser > Any YouTube Clip
        const trailer =
          videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
          videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
          videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser') ||
          videos.find((v) => v.site === 'YouTube' && v.type === 'Clip') ||
          videos.find((v) => v.site === 'YouTube');

        setActiveTrailer({
          ...movieItem,
          videoKey: trailer ? trailer.key : null,
          loading: false,
        });
      } else {
        setActiveTrailer({
          ...movieItem,
          videoKey: null,
          loading: false,
        });
      }
    } catch (err) {
      console.error('Error fetching trailer videos from TMDB:', err);
      setActiveTrailer({
        ...movieItem,
        videoKey: null,
        loading: false,
      });
    }
  };

  const closeTrailer = () => setActiveTrailer(null);

  return (
    <MovieContext.Provider
      value={{
        movie,
        setMovie,
        search,
        setSearch,
        myList,
        toggleMyList,
        isInMyList,
        activeTrailer,
        openTrailer,
        closeTrailer,
      }}
    >
      {children}
    </MovieContext.Provider>
  );
};

export default MovieProvider;