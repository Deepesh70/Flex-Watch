import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaFilm } from 'react-icons/fa';

const Footer = () => {
    const movieLinks = ["Action", "Comedy", "Drama", "Horror", "Romance", "Fantasy", "Animation", "Thriller"];
    const seriesLinks = ["Reality Shows", "Classic Shows", "Comedy", "Sci-Fi", "Documentary", "Crime"];
    const supportLinks = ["Manage Account", "Privacy Policy", "Help Center", "Terms of Use", "Contact Us"];

    return (
        <footer className="bg-dark-800 border-t border-white/5">
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <FaFilm className="text-accent-gold w-6 h-6" />
                            <span className="text-accent-gold text-xl font-extrabold">Movie</span>
                            <span className="text-white text-xl font-light">love</span>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            Your ultimate destination for movies, TV shows, and entertainment.
                            Stream the latest and greatest content.
                        </p>
                        {/* Social Icons */}
                        <div className="flex items-center gap-3">
                            {[FaFacebookF, FaTwitter, FaInstagram, FaYoutube].map((Icon, idx) => (
                                <a
                                    key={idx}
                                    href="#"
                                    className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-accent-gold hover:border-accent-gold/30 hover:bg-accent-gold/10 transition-all duration-200"
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Movies Column */}
                    <div>
                        <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                            Movies
                        </h4>
                        <ul className="space-y-2.5">
                            {movieLinks.map((link) => (
                                <li key={link}>
                                    <a href="#" className="text-gray-500 hover:text-accent-gold text-sm transition-colors duration-200">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Series Column */}
                    <div>
                        <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                            Series
                        </h4>
                        <ul className="space-y-2.5">
                            {seriesLinks.map((link) => (
                                <li key={link}>
                                    <a href="#" className="text-gray-500 hover:text-accent-gold text-sm transition-colors duration-200">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Column */}
                    <div>
                        <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                            Support
                        </h4>
                        <ul className="space-y-2.5">
                            {supportLinks.map((link) => (
                                <li key={link}>
                                    <a href="#" className="text-gray-500 hover:text-accent-gold text-sm transition-colors duration-200">
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-3">
                    <p className="text-gray-600 text-xs">
                        © 2025 Movie Love. All Rights Reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">Privacy</a>
                        <a href="#" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">Terms</a>
                        <a href="#" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;