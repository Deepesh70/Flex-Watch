import React from 'react';
import { FaTimes, FaPlay, FaExclamationCircle } from 'react-icons/fa';

export const TrailerModal = ({ isOpen, onClose, activeTrailer }) => {
  if (!isOpen) return null;

  const movieTitle =
    activeTrailer?.title || activeTrailer?.original_title || 'Movie Trailer';
  const videoKey = activeTrailer?.videoKey;
  const loading = activeTrailer?.loading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-dark-800 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-dark-700/80">
          <div className="flex items-center gap-2">
            <FaPlay className="text-accent-gold w-4 h-4" />
            <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-md">
              Official Trailer: {movieTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Trailer Modal"
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Box */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <div className="w-10 h-10 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Retrieving Official TMDB Trailer...</p>
            </div>
          ) : videoKey ? (
            <iframe
              title={`${movieTitle} Trailer`}
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="p-8 text-center max-w-md">
              <FaExclamationCircle className="w-12 h-12 text-accent-gold/60 mx-auto mb-3" />
              <h4 className="text-white font-bold text-base mb-1">
                No TMDB Video Stream Available
              </h4>
              <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                An official trailer stream has not been indexed for <span className="text-white">"{movieTitle}"</span> on TMDB.
              </p>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                  movieTitle + ' official trailer'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-accent-gold hover:bg-accent-goldHover text-dark-900 text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-md hover:scale-105"
              >
                <FaPlay className="w-3 h-3" />
                <span>Search Trailer on YouTube</span>
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-dark-800 flex items-center justify-between border-t border-white/5">
          <span className="text-[11px] text-gray-500">
            Powered by TMDB Videos & YouTube Embed
          </span>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
