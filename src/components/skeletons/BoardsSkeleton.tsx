"use client";

import React from "react";

export default function BoardsSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-[calc(100dvh-7rem)] sm:h-[calc(100dvh-6rem)] animate-pulse select-none">
      {/* Board Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gray-200 dark:bg-gray-800 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded-md" />
            <div className="h-3 w-56 bg-gray-100 dark:bg-gray-800/60 rounded" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-8 w-28 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-8 w-24 bg-gray-100 dark:bg-gray-800/80 rounded-xl" />
          <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800/80 rounded-xl" />
        </div>
      </div>

      {/* Board Columns Skeleton */}
      <div className="flex-1 overflow-x-auto pb-6 flex items-start gap-4">
        {[1, 2, 3, 4].map((col) => (
          <div
            key={col}
            className="w-[85vw] sm:w-80 shrink-0 bg-gray-100/80 dark:bg-gray-900/70 rounded-2xl p-3 border border-gray-200/80 dark:border-gray-800 flex flex-col space-y-3"
          >
            <div className="flex items-center justify-between px-2 py-1">
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded-md" />
              <div className="h-4 w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>

            <div className="space-y-2.5 flex-1">
              {[1, 2, 3].map((card) => (
                <div
                  key={card}
                  className="bg-white dark:bg-gray-800/95 rounded-xl p-3.5 border border-gray-200/90 dark:border-gray-700/80 space-y-2.5 shadow-xs"
                >
                  <div className="flex gap-1.5">
                    <div className="h-3.5 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3.5 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
                  </div>
                  <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex justify-between">
                    <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
                    <div className="h-3 w-4 bg-gray-100 dark:bg-gray-800 rounded" />
                  </div>
                </div>
              ))}
            </div>

            <div className="h-9 w-full bg-gray-200/70 dark:bg-gray-800/70 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
