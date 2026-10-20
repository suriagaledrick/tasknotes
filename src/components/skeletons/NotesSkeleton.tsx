"use client";

import React from "react";

export default function NotesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse select-none pb-12">
      {/* Header bar skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-7 w-36 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-3.5 w-64 bg-gray-100 dark:bg-gray-800/60 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-60 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-9 w-9 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>

      {/* Take a note input box skeleton */}
      <div className="max-w-xl mx-auto h-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs" />

      {/* Pinned notes row skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3 shadow-xs"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-3/5 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-3 w-4/5 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-3 w-2/3 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-3 w-10 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Other notes grid skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3 shadow-xs"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-3 w-3/4 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                <div className="h-3 w-14 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-3 w-8 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
