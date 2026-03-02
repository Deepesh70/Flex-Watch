import React from "react";
import { FaStar, FaPlay } from "react-icons/fa";
import { Link } from "react-router-dom";

const FeaturedMovie = ({ movie }) => {
    if (!movie) return null;

    const renderStars = (rating) => {
        const stars = Math.round(rating / 2);
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                        key={star}
                        className={`w-5 h-5 ${star <= stars ? "star-filled" : "star-empty"}`}
                    />
                ))}
                <span className="text-gray-400 text-sm ml-2">
                    {movie.vote_average?.toFixed(1)}/10
                </span>
                <span className="text-gray-500 text-sm ml-1">
                    ({movie.vote_count?.toLocaleString()} votes)
                </span>
            </div>
        );
    };

    return (
        <div className="relative w-full overflow-hidden rounded-2xl" style={{ height: "500px" }}>
            {/* Backdrop Image */}
            <img
                src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                alt={movie.title}
                className="absolute inset-0 w-full h-full object-cover object-center"
            />

            {/* Gradient Overlay */}
            <div className="featured-gradient absolute inset-0 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent z-10" />

            {/* Content */}
            <div className="absolute inset-0 z-20 flex items-center">
                <div className="px-8 md:px-16 max-w-2xl">
                    {/* Title */}
                    <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4 uppercase">
                        {movie.title}
                    </h2>

                    {/* Rating */}
                    <div className="mb-4">
                        {renderStars(movie.vote_average)}
                    </div>

                    {/* Release Date */}
                    <p className="text-accent-gold text-sm font-medium mb-3">
                        Released: {movie.release_date}
                    </p>

                    {/* Overview */}
                    <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6 line-clamp-4">
                        {movie.overview}
                    </p>

                    {/* Action Button */}
                    <Link
                        to={`/movie/${movie.id}`}
                        className="inline-flex items-center gap-2 bg-accent-gold hover:bg-accent-goldHover text-dark-900 font-bold px-8 py-3 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg shadow-accent-gold/20"
                    >
                        <FaPlay className="w-3.5 h-3.5" />
                        <span>Watch Now</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FeaturedMovie;
