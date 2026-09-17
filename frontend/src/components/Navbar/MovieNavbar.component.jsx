import React, { useContext, useState } from 'react';
import { BiChevronLeft, BiShareAlt, BiCheck } from 'react-icons/bi';
import { FaFilm } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { MovieContext } from '../context/Movies.context';

const MovieNavbar = () => {
  const { movie } = useContext(MovieContext);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleShare = async () => {
    const shareData = {
      title: movie?.title || movie?.original_title || 'FlexWatch Movie',
      text: `Check out ${movie?.title || 'this movie'} on FlexWatch!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Clipboard copy failed', e);
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/90 backdrop-blur-md border-b border-white/10 py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Back button & FlexWatch Brand */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go Back"
            className="p-2 rounded-xl bg-dark-800 text-gray-300 hover:text-white hover:bg-dark-700 border border-white/10 transition-colors flex-shrink-0"
          >
            <BiChevronLeft className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-accent-gold flex items-center justify-center text-dark-900 shadow">
              <FaFilm className="w-4 h-4" />
            </div>
            <div className="hidden sm:flex items-baseline">
              <span className="text-accent-gold text-lg font-black">Flex</span>
              <span className="text-white text-lg font-bold">Watch</span>
            </div>
          </Link>

          {/* Breadcrumb / Title */}
          {movie && movie.original_title && (
            <div className="hidden md:flex items-center gap-2 border-l border-white/10 pl-4 text-xs text-gray-400 truncate">
              <Link to="/" className="hover:text-white transition-colors">Movies</Link>
              <span>/</span>
              <span className="text-white font-medium truncate max-w-xs">
                {movie.title || movie.original_title}
              </span>
            </div>
          )}
        </div>

        {/* Right: Share Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-300 hover:text-accent-gold border border-white/10 text-xs font-semibold transition-all"
          >
            {copied ? (
              <>
                <BiCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <BiShareAlt className="w-4 h-4" />
                <span>Share</span>
              </>
            )}
          </button>

          <Link
            to="/"
            className="px-3.5 py-1.5 rounded-xl bg-accent-gold hover:bg-accent-goldHover text-dark-900 text-xs font-bold transition-all shadow-md"
          >
            Browse
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default MovieNavbar;