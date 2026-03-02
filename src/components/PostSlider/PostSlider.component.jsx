import React from "react";
import Slider from "react-slick";
import Poster from "../poster/Poster.component";

const PostSlider = (props) => {
    const { posters, title, subtitle, isDark } = props;

    const settings = {
        infinite: false,
        speed: 500,
        slidesToShow: 6,
        slidesToScroll: 3,
        responsive: [
            {
                breakpoint: 1280,
                settings: {
                    slidesToShow: 5,
                    slidesToScroll: 3,
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
                    slidesToScroll: 2,
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
        <div className="mb-4">
            {/* Section Header */}
            <div className="flex items-end justify-between mb-6 px-1">
                <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
                <button className="text-accent-gold text-sm font-medium hover:text-accent-goldHover transition-colors flex items-center gap-1">
                    See All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Slider */}
            <div className="w-full">
                <Slider {...settings}>
                    {posters.map((each, index) => (
                        <Poster {...each} isDark={isDark} key={index} />
                    ))}
                </Slider>
            </div>
        </div>
    );
};

export default PostSlider;