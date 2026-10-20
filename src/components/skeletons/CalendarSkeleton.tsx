"use client";

import React from "react";

export default function CalendarSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-pulse select-none">
      {/* Header bar skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gray-200 dark:bg-gray-800 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded-md" />
            <div className="h-3 w-72 bg-gray-100 dark:bg-gray-800/60 rounded" />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="h-9 w-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-9 w-28 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-9 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-900 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800" />
            <div className="space-y-1">
              <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
              <div className="h-5 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Month Calendar Grid Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Month Toolbar */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/60">
          <div className="h-5 w-36 bg-gray-200 dark:bg-gray-800 rounded-md" />
          <div className="flex gap-1.5">
            <div className="h-7 w-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            <div className="h-7 w-7 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            <div className="h-7 w-7 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 py-2.5 bg-gray-100/60 dark:bg-gray-800 text-center">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-3 w-8 bg-gray-300 dark:bg-gray-700 mx-auto rounded" />
          ))}
        </div>

        {/* 5 Weeks of Day Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-200 dark:divide-gray-800">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[58px] sm:min-h-[110px] p-2 flex flex-col justify-between bg-white dark:bg-gray-900"
            >
              <div className="flex justify-between items-center">
                <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800/60 hidden sm:block" />
              </div>
              <div className="space-y-1 hidden sm:block pt-2">
                {i % 3 === 0 && <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800/80" />}
                {i % 4 === 0 && <div className="h-4 w-4/5 rounded bg-gray-100 dark:bg-gray-800/60" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
