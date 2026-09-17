import React, { useContext, useState, useEffect, useRef } from 'react';
import { BiSearch, BiX, BiMenu } from 'react-icons/bi';
import { FaFilm, FaUserCircle, FaBookmark, FaStar } from 'react-icons/fa';
import { MovieContext } from '../context/Movies.context';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import tmdbService from '../../services/tmdb';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';

const CLERK_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

const Navbar = () => {
  const { search, setSearch, myList } = useContext(MovieContext);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  const isClerkActive = Boolean(CLERK_KEY && CLERK_KEY.startsWith('pk_'));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debounced live suggestions
  useEffect(() => {
    if (!search || search.trim().length < 2) {
      setLiveSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await tmdbService.searchMovies(search);
        setLiveSuggestions(results.slice(0, 5));
      } catch {
        setLiveSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Movies', path: '/movies' },
    { name: 'TV Series', path: '/series' },
  ];

  const handleSuggestionClick = (movieId) => {
    setSearch('');
    setSearchOpen(false);
    setLiveSuggestions([]);
    navigate(`/movie/${movieId}`);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-dark-900/95 backdrop-blur-md shadow-2xl border-b border-white/5 py-3'
          : 'bg-gradient-to-b from-dark-900/90 via-dark-900/40 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-accent-gold flex items-center justify-center text-dark-900 shadow-md group-hover:scale-105 transition-transform">
              <FaFilm className="w-5 h-5" />
            </div>
            <div className="flex items-baseline">
              <span className="text-accent-gold text-2xl font-black tracking-tight">Flex</span>
              <span className="text-white text-2xl font-bold tracking-tight">Watch</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-2 text-sm font-medium transition-all rounded-lg ${
                    isActive
                      ? 'text-accent-gold bg-accent-gold/10 font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Search */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input Container */}
            <div className="relative">
              <div
                className={`flex items-center transition-all duration-300 rounded-full border ${
                  searchOpen
                    ? 'w-48 sm:w-64 md:w-72 bg-dark-800 border-accent-gold/50 shadow-lg px-3 py-1.5'
                    : 'w-9 h-9 bg-dark-800/80 border-white/10 hover:border-accent-gold/40 justify-center'
                }`}
              >
                <BiSearch
                  onClick={() => {
                    setSearchOpen(true);
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }}
                  className={`w-5 h-5 cursor-pointer ${
                    searchOpen ? 'text-accent-gold' : 'text-gray-400 hover:text-white'
                  }`}
                />

                {searchOpen && (
                  <>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search movies, genres..."
                      className="w-full bg-transparent text-white text-xs sm:text-sm pl-2 focus:outline-none placeholder-gray-500"
                    />
                    {search && (
                      <button
                        onClick={() => {
                          setSearch('');
                          setLiveSuggestions([]);
                        }}
                        className="text-gray-400 hover:text-white p-0.5"
                      >
                        <BiX className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Live Search Suggestions Dropdown */}
              {searchOpen && liveSuggestions.length > 0 && (
                <div className="absolute right-0 top-12 w-72 sm:w-80 bg-dark-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50 animate-fade-in">
                  <div className="p-2 border-b border-white/5 bg-dark-700/50">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2">
                      Top Matches
                    </span>
                  </div>
                  <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                    {liveSuggestions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSuggestionClick(item.id)}
                        className="w-full flex items-center gap-3 p-2.5 hover:bg-white/5 transition-colors text-left"
                      >
                        <img
                          src={
                            item.poster_path
                              ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                              : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=100&q=80'
                          }
                          alt={item.title}
                          className="w-10 h-14 object-cover rounded-md bg-dark-700 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                            {item.title || item.original_title}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.vote_average ? (
                              <span className="flex items-center gap-1 text-[11px] text-accent-gold font-bold">
                                <FaStar className="w-2.5 h-2.5" />
                                {Number(item.vote_average).toFixed(1)}
                              </span>
                            ) : null}
                            {item.release_date && (
                              <span className="text-[11px] text-gray-400">
                                {new Date(item.release_date).getFullYear()}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* My List Icon */}
            <Link
              to="/profile"
              title="My Watchlist"
              className="relative p-2 rounded-xl bg-dark-800/80 border border-white/10 text-gray-300 hover:text-accent-gold hover:border-accent-gold/40 transition-colors"
            >
              <FaBookmark className="w-4 h-4" />
              {myList?.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-gold text-dark-900 text-[10px] font-black rounded-full flex items-center justify-center">
                  {myList.length}
                </span>
              )}
            </Link>

            {/* Clerk Auth Controls or Fallback Avatar */}
            {isClerkActive ? (
              <div className="flex items-center gap-2">
                <SignedIn>
                  <Link
                    to="/profile"
                    title="Profile & Account"
                    className="p-1 rounded-xl bg-dark-800 border border-white/10 flex items-center"
                  >
                    <UserButton afterSignOutUrl="/" />
                  </Link>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="bg-accent-gold hover:bg-accent-goldHover text-dark-900 font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-md hover:scale-105">
                      Sign In
                    </button>
                  </SignInButton>
                </SignedOut>
              </div>
            ) : (
              <Link
                to="/profile"
                title="My Profile & Account"
                className="p-1.5 rounded-xl bg-dark-800/80 border border-white/10 text-gray-300 hover:text-accent-gold hover:border-accent-gold/40 transition-colors"
              >
                <FaUserCircle className="w-6 h-6" />
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-dark-800 text-gray-300 hover:text-white border border-white/10"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <BiX className="w-6 h-6" /> : <BiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-dark-900/98 border-b border-white/10 px-4 py-4 space-y-2 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-accent-gold hover:bg-white/5"
            >
              {link.name}
            </Link>
          ))}
          <Link
            to="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-accent-gold hover:bg-white/5"
          >
            My Profile & VIP Pass
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;