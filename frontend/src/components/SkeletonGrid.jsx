import React from "react";

export default function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid 
      grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 
      gap-6"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden bg-white shadow animate-pulse"
        >
          {/* Banner */}
          <div className="h-32 w-full bg-gray-200"></div>

          {/* Content */}
          <div className="p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3 mt-3"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
