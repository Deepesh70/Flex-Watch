import React from "react";

const CategoryFilter = ({ activeCategory, onCategoryChange }) => {
    const categories = [
        { id: "popular", name: "Popular", icon: "🔥" },
        { id: 28, name: "Action", icon: "💥" },
        { id: 35, name: "Comedy", icon: "😂" },
        { id: 18, name: "Drama", icon: "🎭" },
        { id: 12, name: "Adventure", icon: "🗺️" },
        { id: 878, name: "Sci-Fi", icon: "🚀" },
        { id: 27, name: "Horror", icon: "👻" },
    ];

    return (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => onCategoryChange(cat.id)}
                    className={`category-pill flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all duration-200 ${activeCategory === cat.id
                            ? "active bg-accent-gold/20 text-accent-gold border-accent-gold"
                            : "bg-white/5 text-gray-400 border-white/10 hover:text-accent-gold hover:border-accent-gold/30"
                        }`}
                >
                    <span className="text-base">{cat.icon}</span>
                    <span>{cat.name}</span>
                </button>
            ))}
        </div>
    );
};

export default CategoryFilter;
