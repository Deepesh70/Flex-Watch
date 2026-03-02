import React, { useContext, useState, useEffect } from "react";
import { BiSearch } from "react-icons/bi";
import { FaUserCircle } from "react-icons/fa";
import { MovieContext } from "../context/Movies.context";
import { Link } from "react-router-dom";

const Navbar = () => {
    const { search, setSearch } = useContext(MovieContext);
    const [scrolled, setScrolled] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "TV Shows", path: "/" },
        { name: "Movies", path: "/" },
        { name: "Upcoming", path: "/" },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                    ? "bg-dark-800/95 backdrop-blur-md shadow-lg shadow-black/30"
                    : "bg-gradient-to-b from-black/70 via-black/30 to-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-accent-gold text-xl md:text-2xl font-extrabold tracking-tight">
                            Movie
                        </span>
                        <span className="text-white text-xl md:text-2xl font-light tracking-tight">
                            love
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className="text-gray-300 hover:text-accent-gold px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg hover:bg-white/5"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className={`flex items-center transition-all duration-300 ${searchOpen ? "w-48 lg:w-64" : "w-8"
                            }`}>
                            {searchOpen && (
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search movies..."
                                    className="w-full bg-white/10 border border-white/10 text-white text-sm px-3 py-1.5 rounded-l-lg focus:outline-none focus:border-accent-gold/50 placeholder-gray-500"
                                    autoFocus
                                    onBlur={() => {
                                        if (!search) setSearchOpen(false);
                                    }}
                                />
                            )}
                            <button
                                onClick={() => setSearchOpen(!searchOpen)}
                                className={`text-gray-300 hover:text-accent-gold transition-colors p-2 ${searchOpen ? "bg-white/10 rounded-r-lg" : "rounded-lg"
                                    }`}
                            >
                                <BiSearch className="w-5 h-5" />
                            </button>
                        </div>

                        {/* User Icon */}
                        <button className="text-gray-300 hover:text-accent-gold transition-colors p-1">
                            <FaUserCircle className="w-7 h-7" />
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden text-gray-300 hover:text-white p-1"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-dark-800/95 backdrop-blur-md border-t border-white/5 animate-fade-in">
                    <div className="px-4 py-3 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className="block text-gray-300 hover:text-accent-gold px-3 py-2.5 text-base font-medium rounded-lg hover:bg-white/5 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        {/* Mobile Search */}
                        <div className="pt-2">
                            <div className="flex items-center bg-white/10 rounded-lg px-3 py-2 border border-white/10">
                                <BiSearch className="text-gray-400 mr-2" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search movies..."
                                    className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;