import React from "react";

export default function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-[24px] border border-[#e7dbcf] bg-[rgba(255,252,247,0.95)] shadow-[0_22px_50px_-34px_rgba(35,26,16,0.28)] dark:border-slate-800 dark:bg-slate-900/90"
        >
          {/* Banner */}
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800"></div>

          {/* Content */}
          <div className="space-y-4 p-5">
            <div className="h-4 w-3/4 rounded-full bg-slate-200 dark:bg-slate-800"></div>
            <div className="h-3 w-1/2 rounded-full bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex gap-2">
              <div className="h-8 w-24 rounded-full bg-slate-200 dark:bg-slate-800"></div>
              <div className="h-8 w-20 rounded-full bg-slate-200 dark:bg-slate-800"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
