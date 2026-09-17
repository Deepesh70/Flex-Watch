import React from 'react';

const CategoryFilter = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: 'popular', name: 'Trending All', icon: '🔥' },
    { id: 28, name: 'Action', icon: '💥' },
    { id: 12, name: 'Adventure', icon: '🗺️' },
    { id: 878, name: 'Sci-Fi', icon: '🚀' },
    { id: 18, name: 'Drama', icon: '🎭' },
    { id: 35, name: 'Comedy', icon: '😂' },
    { id: 27, name: 'Horror', icon: '👻' },
    { id: 16, name: 'Animation', icon: '🎨' },
  ];

  return (
    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-hide px-1">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap border transition-all duration-200 ${
              isActive
                ? 'bg-accent-gold text-dark-900 border-accent-gold font-bold shadow-lg shadow-accent-gold/20 scale-105'
                : 'bg-dark-800/80 text-gray-300 border-white/10 hover:border-accent-gold/50 hover:text-white hover:bg-dark-700'
            }`}
          >
            <span className="text-sm">{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
