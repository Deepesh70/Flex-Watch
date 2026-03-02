import React, { useState, useEffect } from "react";
import HeroSlider from "react-slick";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaStar, FaPlay } from "react-icons/fa";
import { BiPlus } from "react-icons/bi";

const HeroCarousal = () => {
    const [images, setImages] = useState([]);
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const requestNowPlayingMovies = async () => {
            const getImages = await axios.get("/now_playing");
            setImages(getImages.data.results);
        };
        requestNowPlayingMovies();
    }, []);

    const settings = {
        arrows: false,
        dots: true,
        slidesToShow: 1,
        infinite: true,
        speed: 800,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4000,
        fade: true,
        cssEase: "cubic-bezier(0.7, 0, 0.3, 1)",
        beforeChange: (current, next) => setActiveSlide(next),
    };

    const renderStars = (rating) => {
        const stars = Math.round(rating / 2);
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                        key={star}
                        className={`w-4 h-4 ${star <= stars ? "star-filled" : "star-empty"}`}
                    />
                ))}
                <span className="text-gray-400 text-sm ml-2">
                    {rating?.toFixed(1)}/10
                </span>
            </div>
        );
    };

    const getGenreNames = (genreIds) => {
        const genreMap = {
            28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
            80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
            14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
            9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
            53: "Thriller", 10752: "War", 37: "Western"
        };
        return genreIds?.slice(0, 3).map(id => genreMap[id]).filter(Boolean) || [];
    };

    return (
        <div className="relative w-full" style={{ height: "90vh", minHeight: "500px" }}>
            <HeroSlider {...settings}>
                {images.slice(0, 6).map((image, index) => (
                    <div key={index}>
                        <div className="relative w-full" style={{ height: "90vh", minHeight: "500px" }}>
                            {/* Backdrop Image */}
                            <img
                                src={`https://image.tmdb.org/t/p/original${image.backdrop_path}`}
                                alt={image.original_title}
                                className="absolute inset-0 w-full h-full object-cover object-top"
                            />

                            {/* Gradient Overlays */}
                            <div className="hero-gradient-bottom absolute inset-0 z-10" />
                            <div className="hero-gradient-left absolute inset-0 z-10" />

                            {/* Content */}
                            <div className="absolute inset-0 z-20 flex items-center">
                                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                                    <div className={`max-w-xl transition-all duration-700 ${activeSlide === index ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                                        }`}>
                                        {/* Title */}
                                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 uppercase tracking-wide">
                                            {image.original_title}
                                        </h1>

                                        {/* Rating & Genre */}
                                        <div className="flex flex-wrap items-center gap-3 mb-4">
                                            {renderStars(image.vote_average)}
                                            <span className="text-gray-500">|</span>
                                            {getGenreNames(image.genre_ids).map((genre, i) => (
                                                <span key={i} className="text-xs font-medium text-gray-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                                                    {genre}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Overview */}
                                        <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6 line-clamp-3">
                                            {image.overview}
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-4">
                                            <Link
                                                to={`/movie/${image.id}`}
                                                className="flex items-center gap-2 bg-accent-gold hover:bg-accent-goldHover text-dark-900 font-bold px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg shadow-accent-gold/20"
                                            >
                                                <FaPlay className="w-3.5 h-3.5" />
                                                <span>Play</span>
                                            </Link>
                                            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 border border-white/10 hover:border-white/20">
                                                <BiPlus className="w-5 h-5" />
                                                <span>My List</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </HeroSlider>

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-900 to-transparent z-30 pointer-events-none" />
        </div>
    );
};

export default HeroCarousal;