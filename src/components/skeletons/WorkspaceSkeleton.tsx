"use client";

import React from "react";

export default function WorkspaceSkeleton() {
  return (
    <div className="flex flex-col h-[100dvh] w-full bg-gray-50 dark:bg-gray-950 overflow-hidden select-none animate-pulse">
      {/* Top Navbar Skeleton */}
      <header className="flex items-center justify-between h-14 px-3 md:px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0 z-30">
        {/* Brand Logo & Nav Links */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-5 w-24 rounded-md bg-gray-200 dark:bg-gray-800" />
          </div>

          <div className="hidden sm:flex items-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 w-20 rounded-lg bg-gray-100 dark:bg-gray-800/80" />
            ))}
          </div>
        </div>

        {/* Search Bar Placeholder */}
        <div className="hidden sm:flex flex-1 max-w-md mx-4">
          <div className="h-8 w-full rounded-xl bg-gray-100 dark:bg-gray-800/90" />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800" />
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
        </div>
      </header>

      {/* Main Workspace Body Skeleton */}
      <main className="flex-1 flex overflow-hidden">
        {/* ========================================================= */}
        {/* DESKTOP SKELETON: 3-Pane Side-by-Side Workstation         */}
        {/* ========================================================= */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          {/* PANE 1: Notes Sidebar Skeleton */}
          <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full shrink-0 p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded-md" />
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-800 rounded-md" />
            </div>

            {/* Quick scratchpad placeholder */}
            <div className="h-9 w-full bg-gray-100 dark:bg-gray-800/80 rounded-xl" />

            {/* Note Cards Stack */}
            <div className="space-y-2.5 flex-1 overflow-hidden pt-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 w-3/5 bg-gray-200 dark:bg-gray-700 rounded-md" />
                    <div className="h-3.5 w-3.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  </div>
                  <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="h-2.5 w-4/5 bg-gray-100 dark:bg-gray-800 rounded" />
                  <div className="pt-1 flex justify-between items-center">
                    <div className="h-2 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
                    <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PANE 2: Center Kanban Board Canvas Skeleton */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950 md:bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:md:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]">
            {/* Board Header Bar */}
            <div className="h-12 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-28 rounded-lg bg-gray-200 dark:bg-gray-800" />
                <div className="h-7 w-24 rounded-lg bg-gray-100 dark:bg-gray-800/80" />
                <div className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-gray-800/80" />
              </div>
              <div className="h-6 w-36 rounded-full bg-gray-100 dark:bg-gray-800/80" />
            </div>

            {/* Columns Area */}
            <div className="flex-1 p-4 flex items-start gap-4 overflow-hidden">
              {[1, 2, 3].map((col) => (
                <div
                  key={col}
                  className="w-72 shrink-0 bg-gray-100/90 dark:bg-gray-900/90 rounded-2xl p-3 border border-gray-200/90 dark:border-gray-800 flex flex-col space-y-3"
                >
                  <div className="flex items-center justify-between px-1">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-md" />
                    <div className="h-4 w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  </div>

                  <div className="space-y-2.5">
                    {[1, 2].map((card) => (
                      <div
                        key={card}
                        className="bg-white dark:bg-gray-800/95 rounded-xl p-3.5 border border-gray-200/90 dark:border-gray-700/80 space-y-2.5 shadow-xs"
                      >
                        <div className="flex gap-1.5">
                          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                          <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
                        </div>
                        <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-2.5 w-3/5 bg-gray-100 dark:bg-gray-800 rounded" />
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex justify-between">
                          <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
                          <div className="h-3 w-4 bg-gray-100 dark:bg-gray-800 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="h-8 w-full bg-gray-200/60 dark:bg-gray-800/60 rounded-xl" />
                </div>
              ))}
            </div>
          </div>

          {/* PANE 3: Calendar Sidebar Skeleton */}
          <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-full shrink-0 p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-md" />
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-800 rounded-md" />
            </div>

            {/* Mini Month Grid Header */}
            <div className="flex items-center justify-between py-1">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-6 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>

            {/* Grid Days Skeleton */}
            <div className="grid grid-cols-7 gap-1 pb-3 border-b border-gray-100 dark:border-gray-800">
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} className="h-7 w-full rounded-md bg-gray-100 dark:bg-gray-800/60" />
              ))}
            </div>

            {/* Selected Day Agenda Items */}
            <div className="space-y-2 flex-1 pt-1">
              <div className="h-3 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between"
                >
                  <div className="space-y-1 w-3/5">
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-2 w-3/4 bg-gray-100 dark:bg-gray-800 rounded" />
                  </div>
                  <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MOBILE SKELETON: Unified Command Center Feed              */}
        {/* ========================================================= */}
        <div className="md:hidden flex-1 p-3.5 space-y-4 overflow-hidden">
          {/* Daily Briefing Title */}
          <div className="flex items-center justify-between pb-1">
            <div className="space-y-1">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded-md" />
              <div className="h-3 w-44 bg-gray-100 dark:bg-gray-800/60 rounded" />
            </div>
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
          </div>

          {/* Agenda Card Skeleton */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-3.5 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between"
                >
                  <div className="space-y-1 w-3/5">
                    <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-2 w-1/2 bg-gray-100 dark:bg-gray-800 rounded" />
                  </div>
                  <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Board Snapshot Skeleton */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-3.5 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
            <div className="flex gap-2 overflow-hidden">
              {[1, 2].map((col) => (
                <div
                  key={col}
                  className="w-56 shrink-0 bg-gray-100/90 dark:bg-gray-800/70 rounded-xl p-2.5 space-y-2 border border-gray-200 dark:border-gray-700/70"
                >
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-16 w-full bg-white dark:bg-gray-800 rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Notes Snapshot Skeleton */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-3.5 border border-gray-200 dark:border-gray-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
            <div className="h-14 w-full bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700" />
            <div className="grid grid-cols-2 gap-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-800" />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar Skeleton */}
      <nav className="sm:hidden flex items-center justify-around h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0 z-40">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center justify-center gap-1">
            <div className="w-5 h-5 rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="w-8 h-2 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        ))}
      </nav>
    </div>
  );
}
