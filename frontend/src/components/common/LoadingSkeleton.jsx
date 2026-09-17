import React from 'react';

export const HeroSkeleton = () => (
  <div className="relative w-full shimmer" style={{ height: '80vh', minHeight: '480px' }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
      <div className="max-w-xl space-y-4">
        <div className="h-10 bg-white/10 rounded-lg w-3/4 animate-pulse" />
        <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse" />
        <div className="h-20 bg-white/10 rounded-lg w-full animate-pulse" />
        <div className="flex gap-4 pt-2">
          <div className="h-11 w-32 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-11 w-32 bg-white/10 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

export const PosterSliderSkeleton = ({ count = 6 }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-4 px-1">
      <div className="h-7 w-48 bg-white/10 rounded-md animate-pulse" />
      <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex flex-col gap-2">
          <div className="w-full h-56 md:h-72 bg-dark-700 rounded-xl shimmer" />
          <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-white/10 rounded w-1/3 animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

export const MovieDetailSkeleton = () => (
  <div className="min-h-screen bg-dark-900 animate-pulse">
    <div className="w-full h-96 bg-dark-800 shimmer relative">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-end pb-12 gap-8">
        <div className="w-48 h-72 bg-dark-700 rounded-xl shimmer hidden md:block" />
        <div className="space-y-4 max-w-xl">
          <div className="h-10 bg-white/10 rounded-lg w-3/4" />
          <div className="h-4 bg-white/10 rounded w-1/2" />
          <div className="h-16 bg-white/10 rounded w-full" />
        </div>
      </div>
    </div>
  </div>
);
