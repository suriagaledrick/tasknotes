"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LogOut,
  StickyNote,
  Kanban,
  Calendar as CalendarIcon,
  Search,
  LayoutDashboard,
  Sun,
  Moon,
  Archive,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import GlobalSearchModal from "@/components/search/GlobalSearchModal";

export default function AppLayout({
  children,
  noPadding = false,
}: {
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/notes", label: "Notes", icon: StickyNote },
    { href: "/boards", label: "Boards", icon: Kanban },
    { href: "/calendar", label: "Calendar", icon: CalendarIcon },
    { href: "/archive", label: "Archive", icon: Archive },
    { href: "/trash", label: "Trash", icon: Trash2 },
  ];

  const mobileBottomNavLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/notes", label: "Notes", icon: StickyNote },
    { href: "/boards", label: "Boards", icon: Kanban },
    { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  ];

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors duration-200">
      {/* Top Navbar */}
      <header className="flex items-center justify-between h-14 px-3 md:px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0 z-30 transition-colors">
        {/* Left: Brand Logo & Navigation Links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/icon.svg"
              alt="Tasknotes"
              className="w-8 h-8 rounded-xl shadow-xs group-hover:scale-105 transition shrink-0"
            />
            <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
              Task<span className="text-blue-600 dark:text-blue-400">notes</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Global Search Bar (Tablet & Desktop) */}
        <div className="hidden sm:flex flex-1 max-w-md mx-4">
          <div
            onClick={() => setSearchOpen(true)}
            className="relative w-full flex items-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 px-3 py-1.5 rounded-xl cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition"
          >
            <Search className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 mr-2 shrink-0" />
            <span className="text-xs text-gray-400 dark:text-gray-400 flex-1 truncate">
              Search notes, tasks, boards...
            </span>
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-gray-400 dark:text-gray-400 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Search (Mobile), Theme Toggle & Account Menu */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile Search Icon Button */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="sm:hidden p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            title="Search notes, tasks, boards"
          >
            <Search className="w-4 h-4" />
          </button>
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            title={theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-gray-600" />
            )}
          </button>

          {/* Account Icon & Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-500 transition focus:outline-none cursor-pointer"
              title={user?.displayName || user?.email || "Account"}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-full font-bold text-xs shadow-xs">
                  {user?.email?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <>
                {/* Invisible Backdrop to close on click outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center gap-3 p-2 border-b border-gray-100 dark:border-gray-800 mb-2">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center rounded-full font-bold text-sm">
                        {user?.email?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="font-semibold text-xs text-gray-900 dark:text-white truncate">
                        {user?.displayName || "User"}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>

                  {/* Theme Switch Row in Dropdown */}
                  <div className="border-b border-gray-100 dark:border-gray-800 pb-2 mb-2">
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {theme === "dark" ? (
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Moon className="w-3.5 h-3.5 text-gray-500" />
                        )}
                        <span>Appearance</span>
                      </div>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 capitalize">
                        {theme}
                      </span>
                    </button>
                  </div>

                  {/* Archive & Trash Quick Access */}
                  <div className="border-b border-gray-100 dark:border-gray-800 pb-2 mb-2 space-y-1">
                    <Link
                      href="/archive"
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition ${
                        pathname === "/archive"
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5 text-gray-500" />
                      <span>Archive</span>
                    </Link>
                    <Link
                      href="/trash"
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                        pathname === "/trash"
                          ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        <span>Trash</span>
                      </div>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                        15d auto-delete
                      </span>
                    </Link>
                  </div>

                  {/* Mobile Navigation Links */}
                  <div className="sm:hidden border-b border-gray-100 dark:border-gray-800 pb-2 mb-2 space-y-1">
                    {mobileBottomNavLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setProfileDropdownOpen(false)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs ${
                          pathname === item.href
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <item.icon className="w-3.5 h-3.5 text-gray-500" />
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  {/* Log Out Button */}
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-950 flex flex-col ${
          noPadding ? "p-0" : "p-3 sm:p-4 md:p-6"
        }`}
      >
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden flex items-center justify-around h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0 z-40 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors">
        {mobileBottomNavLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition cursor-pointer ${
                isActive
                  ? "text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition ${
                  isActive ? "bg-blue-50 dark:bg-blue-950/60" : ""
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              </div>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}
