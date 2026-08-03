"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Search, BookmarkCheck, User, X, Sparkles } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [debouncedValue, setDebouncedValue] = useState(searchTerm);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Handle debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (pathname === "/") {
      const current = searchParams.get("search") || "";
      if (debouncedValue !== current) {
        if (debouncedValue.trim()) {
          router.push(`/?search=${encodeURIComponent(debouncedValue.trim())}`);
        } else {
          router.push("/");
        }
      }
    }
  }, [debouncedValue, pathname, router, searchParams]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-outline-variant)] bg-[var(--color-paper)]/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-serif tracking-tight text-[var(--color-primary-scholarly)] hover:opacity-90 transition-opacity"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary-container)] text-white shadow-xs">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="hidden text-xl font-bold sm:inline-block">Open Read</span>
        </Link>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search 70,000+ classics by title or author..."
              className="w-full rounded-md border border-[var(--color-outline-variant)] bg-white pl-9 pr-8 py-2 text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] transition-all focus:border-[var(--color-primary-container)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-container)]"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  if (pathname === "/") router.push("/");
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Action Links */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/library"
            className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/library"
                ? "bg-[var(--color-paper-container)] text-[var(--color-primary-scholarly)] font-semibold"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-paper-container-low)] hover:text-[var(--color-ink)]"
            }`}
          >
            <BookmarkCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Library</span>
          </Link>

          {/* Sign In Trigger Button */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 rounded-md bg-[var(--color-primary-scholarly)] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0c233c] transition-all"
          >
            <User className="h-4 w-4" />
            <span>Sign In</span>
          </button>
        </nav>
      </div>

      {/* Auth Coming Soon Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-[var(--color-primary-scholarly)]">
              <Sparkles className="h-6 w-6 text-sky-600" />
            </div>

            <h3 className="text-lg font-bold font-serif text-gray-900">
              Authentication Coming Soon!
            </h3>

            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              We are working hard on bringing full multi-device cloud sync and user accounts.
            </p>

            <div className="mt-4 rounded-xl bg-amber-50 p-3 border border-amber-200 text-left">
              <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
                💡 <strong>Guest Mode Active:</strong> You can read any ebook freely and save your favorite books locally in your browser right now!
              </p>
            </div>

            <button
              onClick={() => setShowAuthModal(false)}
              className="mt-5 w-full rounded-xl bg-[var(--color-primary-scholarly)] py-2.5 text-xs font-bold text-white hover:bg-[#0c233c] transition-colors"
            >
              Got It, Continue Reading
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
