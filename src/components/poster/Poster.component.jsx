import React from 'react'
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";

const Poster = (props) => {
  const year = props.release_date ? new Date(props.release_date).getFullYear() : "";
  const rating = props.vote_average ? props.vote_average.toFixed(1) : "";

  return (
    <Link to={`/movie/${props.id}`}>
      <div className="movie-card flex flex-col items-start gap-2 px-2 group cursor-pointer">
        <div className="relative w-full overflow-hidden rounded-xl bg-dark-600">
          {props.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w500${props.poster_path}`}
              alt={props.title}
              className="w-full h-56 md:h-72 lg:h-80 object-cover rounded-xl transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-56 md:h-72 lg:h-80 shimmer rounded-xl" />
          )}

          {/* Rating Badge */}
          {rating && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-accent-gold text-xs font-bold px-2 py-1 rounded-lg">
              <FaStar className="w-3 h-3" />
              <span>{rating}</span>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-end p-3">
            <span className="text-accent-gold text-xs font-semibold">View Details →</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-200 group-hover:text-accent-gold transition-colors duration-200 line-clamp-1 w-full">
          {props.title}
        </h3>

        {/* Year & Info */}
        {year && (
          <p className="text-xs text-gray-500 -mt-1">
            {year}
          </p>
        )}
      </div>
    </Link>
  )
}

export default Poster