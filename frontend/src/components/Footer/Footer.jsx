import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaFilm, FaCheck } from 'react-icons/fa';

const Footer = () => {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');

  const movieGenres = ['Action', 'Sci-Fi', 'Drama', 'Adventure', 'Comedy', 'Horror', 'Animation', 'Thriller'];
  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Movies', path: '/movies' },
    { name: 'TV Series', path: '/series' },
  ];
  const legalLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Preferences', 'Help Center'];

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-dark-900 border-t border-white/5 mt-16">
      {/* Newsletter Bar */}
      <div className="border-b border-white/5 bg-dark-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-white font-bold text-base sm:text-lg">
                Stay updated with the latest releases & premieres
              </h4>
              <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                Get curated weekly movie recommendations directly in your inbox.
              </p>
            </div>
            {subscribed ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                <FaCheck className="w-4 h-4" />
                <span>Thank you for subscribing!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  required
                  className="bg-dark-700 border border-white/10 text-white text-xs sm:text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-accent-gold/60 placeholder-gray-500 w-full sm:w-64"
                />
                <button
                  type="submit"
                  className="bg-accent-gold hover:bg-accent-goldHover text-dark-900 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shadow-md flex-shrink-0"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-gold flex items-center justify-center text-dark-900 shadow">
                <FaFilm className="w-4 h-4" />
              </div>
              <div className="flex items-baseline">
                <span className="text-accent-gold text-xl font-black">Flex</span>
                <span className="text-white text-xl font-bold">Watch</span>
              </div>
            </Link>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
              Your ultimate cinematic platform for high-definition streaming, premier ticketing, and AI-powered recommendations.
            </p>
            <div className="flex items-center gap-2.5 pt-2">
              {[FaFacebookF, FaTwitter, FaInstagram, FaYoutube].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#root"
                  aria-label="Social Link"
                  className="w-8 h-8 rounded-lg bg-dark-800 border border-white/10 flex items-center justify-center text-gray-400 hover:text-accent-gold hover:border-accent-gold/40 transition-all"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Navigation
            </h5>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-accent-gold text-xs sm:text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Genres */}
          <div>
            <h5 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Explore Genres
            </h5>
            <div className="grid grid-cols-2 gap-2">
              {movieGenres.map((genre) => (
                <Link
                  key={genre}
                  to="/"
                  className="text-gray-400 hover:text-accent-gold text-xs transition-colors"
                >
                  {genre}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal / Support */}
          <div>
            <h5 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Support & Legal
            </h5>
            <ul className="space-y-2.5">
              {legalLinks.map((item) => (
                <li key={item}>
                  <a
                    href="#root"
                    className="text-gray-400 hover:text-accent-gold text-xs sm:text-sm transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} FlexWatch Entertainment Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <span className="text-accent-gold">♥</span> for movie lovers worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;