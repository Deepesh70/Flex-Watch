import React from 'react';
import Slider from 'react-slick';
import Poster from '../poster/Poster.component';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';

const NextArrow = (props) => {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      aria-label="Next slide"
      className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-dark-800/90 text-white hover:text-accent-gold border border-white/10 hover:border-accent-gold/40 backdrop-blur-md shadow-xl transition-all hover:scale-110 -mr-3"
    >
      <BiChevronRight className="w-6 h-6" />
    </button>
  );
};

const PrevArrow = (props) => {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      aria-label="Previous slide"
      className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-dark-800/90 text-white hover:text-accent-gold border border-white/10 hover:border-accent-gold/40 backdrop-blur-md shadow-xl transition-all hover:scale-110 -ml-3"
    >
      <BiChevronLeft className="w-6 h-6" />
    </button>
  );
};

const PostSlider = (props) => {
  const { posters = [], title, subtitle, isDark = true, onSeeAll } = props;

  if (!Array.isArray(posters) || posters.length === 0) {
    return null;
  }

  const settings = {
    infinite: posters.length > 6,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 2,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 5,
          slidesToScroll: 2,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 2,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="mb-10 relative">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-4 px-1">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-5 bg-accent-gold rounded-full inline-block" />
            {title}
          </h3>
          {subtitle && <p className="text-xs md:text-sm text-gray-400 mt-1 pl-3.5">{subtitle}</p>}
        </div>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-accent-gold text-xs md:text-sm font-semibold hover:text-accent-goldHover transition-colors flex items-center gap-1 hover:underline"
          >
            <span>Explore All</span>
            <BiChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* When few items (<= 5), render in standard small-card CSS grid rather than stretching full screen */}
      {posters.length <= 5 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 px-1">
          {posters.map((movie, index) => (
            <Poster
              {...movie}
              isDark={isDark}
              key={movie.id ? `movie-${movie.id}` : `idx-${index}`}
            />
          ))}
        </div>
      ) : (
        /* Slider Container for > 5 items */
        <div className="w-full relative px-1">
          <Slider
            key={`${title}-${posters.length}-${posters.map((p) => p.id).slice(0, 4).join('-')}`}
            {...settings}
          >
            {posters.map((movie, index) => (
              <Poster
                {...movie}
                isDark={isDark}
                key={movie.id ? `movie-${movie.id}` : `idx-${index}`}
              />
            ))}
          </Slider>
        </div>
      )}
    </div>
  );
};

export default PostSlider;