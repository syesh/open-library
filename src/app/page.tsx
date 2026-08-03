"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Sparkles, AlertCircle, RefreshCw, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import BookCard from "@/components/BookCard";
import { GutendexBook, GutendexResponse } from "@/types";

const CATEGORIES = [
  { id: "all", label: "All Classics", query: "" },
  { id: "fiction", label: "Fiction", query: "topic=fiction" },
  { id: "philosophy", label: "Philosophy", query: "topic=philosophy" },
  { id: "history", label: "History", query: "topic=history" },
  { id: "science", label: "Science", query: "topic=science" },
  { id: "poetry", label: "Poetry", query: "topic=poetry" },
];

const DAILY_FEATURED_CLASSICS = [
  {
    id: 1342,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    description: "A timeless masterpiece of romantic friction, wit, and social hierarchy in 19th-century England.",
    coverUrl: "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg",
    readTime: "7 hrs read",
  },
  {
    id: 84,
    title: "Frankenstein",
    author: "Mary Wollstonecraft Shelley",
    description: "The foundational gothic science fiction novel exploring creation, monsterhood, and ambition.",
    coverUrl: "https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg",
    readTime: "5.5 hrs read",
  },
  {
    id: 2701,
    title: "Moby Dick; Or, The Whale",
    author: "Herman Melville",
    description: "An epic nautical journey of obsession, fate, and the relentless pursuit of the white whale.",
    coverUrl: "https://www.gutenberg.org/cache/epub/2701/pg2701.cover.medium.jpg",
    readTime: "14 hrs read",
  },
  {
    id: 1661,
    title: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    description: "Twelve iconic detective mysteries featuring the legendary detective Sherlock Holmes and Dr. Watson.",
    coverUrl: "https://www.gutenberg.org/cache/epub/1661/pg1661.cover.medium.jpg",
    readTime: "6 hrs read",
  },
  {
    id: 11,
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    description: "A whimsical journey down the rabbit hole into a surreal realm of mad hatters and Cheshire cats.",
    coverUrl: "https://www.gutenberg.org/cache/epub/11/pg11.cover.medium.jpg",
    readTime: "2.5 hrs read",
  },
  {
    id: 345,
    title: "Dracula",
    author: "Bram Stoker",
    description: "The classic epistolary horror novel that introduced Count Dracula to modern dark fantasy.",
    coverUrl: "https://www.gutenberg.org/cache/epub/345/pg345.cover.medium.jpg",
    readTime: "10 hrs read",
  },
  {
    id: 98,
    title: "A Tale of Two Cities",
    author: "Charles Dickens",
    description: "'It was the best of times, it was the worst of times' — a sweeping drama set during the French Revolution.",
    coverUrl: "https://www.gutenberg.org/cache/epub/98/pg98.cover.medium.jpg",
    readTime: "9 hrs read",
  },
];

function getBookOfTheDay() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return DAILY_FEATURED_CLASSICS[dayOfYear % DAILY_FEATURED_CLASSICS.length];
}

const apiResponseCache = new Map<string, GutendexResponse>();

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.get("search") || "";
  const topicParam = searchParams.get("topic") || "";

  const [books, setBooks] = useState<GutendexBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const bookOfTheDay = getBookOfTheDay();

  const fetchBooks = useCallback(
    async (targetPage: number, isPrefetch = false) => {
      let url = `https://gutendex.com/books/?page=${targetPage}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      } else if (topicParam) {
        url += `&topic=${encodeURIComponent(topicParam)}`;
      }

      if (apiResponseCache.has(url)) {
        const cachedData = apiResponseCache.get(url)!;
        if (!isPrefetch) {
          setBooks(cachedData.results || []);
          setHasNext(!!cachedData.next);
          setHasPrev(!!cachedData.previous);
          setLoading(false);
        }
        return;
      }

      if (!isPrefetch) {
        setLoading(true);
        setError(null);
      }

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch book catalog.");

        const data: GutendexResponse = await res.json();
        apiResponseCache.set(url, data);

        if (!isPrefetch) {
          setBooks(data.results || []);
          setHasNext(!!data.next);
          setHasPrev(!!data.previous);
        }
      } catch (err: unknown) {
        if (!isPrefetch) {
          console.error(err);
          setError(err instanceof Error ? err.message : "Error loading catalog.");
        }
      } finally {
        if (!isPrefetch) {
          setLoading(false);
        }
      }
    },
    [search, topicParam]
  );

  useEffect(() => {
    fetchBooks(page, false);
    fetchBooks(page + 1, true);
  }, [fetchBooks, page]);

  const handleCategorySelect = (cat: typeof CATEGORIES[number]) => {
    setPage(1);
    if (cat.query) {
      router.push(`/?${cat.query}`);
    } else {
      router.push("/");
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 320, behavior: "smooth" });
    }
  };

  const displayedBooks = books.slice(0, 15);

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Pinned Book of the Day Hero Section */}
        {!search && page === 1 && (
          <div className="relative mb-10 overflow-hidden rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-primary-container)] p-6 text-white shadow-md sm:p-8">
            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl text-center md:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky-200 backdrop-blur-md">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Book of the Day</span>
                  <span className="opacity-40">•</span>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{bookOfTheDay.readTime}</span>
                </div>

                <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                  {bookOfTheDay.title}
                </h1>
                <p className="font-sans text-xs font-medium text-gray-300">
                  By {bookOfTheDay.author}
                </p>
                <p className="font-sans text-sm text-gray-200 leading-relaxed max-w-xl mx-auto md:mx-0">
                  {bookOfTheDay.description}
                </p>

                <div className="pt-2 flex items-center justify-center md:justify-start gap-3">
                  <Link
                    href={`/read/${bookOfTheDay.id}`}
                    className="flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-xs font-bold text-[var(--color-primary-scholarly)] shadow-md hover:bg-gray-100 transition-colors"
                  >
                    <BookOpen className="h-4 w-4" />
                    Read Book of the Day
                  </Link>
                </div>
              </div>

              <div className="relative h-44 w-32 flex-shrink-0 overflow-hidden rounded-md border border-white/20 shadow-xl bg-black/20">
                <Image
                  src={bookOfTheDay.coverUrl}
                  alt={bookOfTheDay.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>
        )}

        {/* Clean Production Section Header & Category Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)]">
              {search
                ? `Search Results for "${search}"`
                : topicParam
                ? `${topicParam.charAt(0).toUpperCase() + topicParam.slice(1)} Classics`
                : "Public Domain Catalog"}
            </h2>
          </div>

          {/* Category Filter Tabs */}
          {!search && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
              {CATEGORIES.map((cat) => {
                const isActive =
                  (!topicParam && cat.id === "all") || topicParam === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat)}
                    className={`whitespace-nowrap rounded-md px-3.5 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[var(--color-primary-container)] text-white shadow-xs"
                        : "bg-white text-[var(--color-ink-muted)] border border-[var(--color-outline-variant)] hover:bg-[var(--color-paper-container-low)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Skeleton Grid for Catalog Loading State */}
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-6">
            {Array.from({ length: 15 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse rounded-lg border border-gray-200 bg-white p-3 space-y-3"
              >
                <div className="aspect-[2/3] w-full rounded bg-gray-200" />
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="my-12 flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
            <h3 className="text-base font-semibold text-red-800">Failed to Load Catalog</h3>
            <p className="mt-1 text-xs text-red-600 max-w-md">{error}</p>
            <button
              onClick={() => fetchBooks(page)}
              className="mt-4 flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </button>
          </div>
        )}

        {/* Empty Search Results State */}
        {!loading && !error && displayedBooks.length === 0 && (
          <div className="my-16 flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-outline-soft)] bg-white p-12 text-center">
            <BookOpen className="h-12 w-12 text-[var(--color-ink-muted)] mb-3 opacity-40" />
            <h3 className="text-lg font-serif font-bold text-[var(--color-ink)]">No Books Found</h3>
            <p className="mt-1 text-xs text-[var(--color-ink-muted)] max-w-sm">
              We couldn’t find any public domain ebooks matching your search criteria.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 rounded-md bg-[var(--color-primary-scholarly)] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c233c]"
            >
              Clear Search & Filters
            </button>
          </div>
        )}

        {/* Clean Responsive Book Grid */}
        {!loading && !error && displayedBooks.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-6">
              {displayedBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>

            {/* Persistent Pagination Bar */}
            <div className="mt-12 flex items-center justify-between border-t border-[var(--color-outline-variant)] pt-8 pb-4">
              <button
                disabled={!hasPrev || page <= 1}
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                className="flex items-center gap-1.5 rounded-full border border-[var(--color-outline-variant)] bg-white px-5 py-2.5 text-xs font-bold text-[var(--color-ink)] shadow-xs hover:border-[var(--color-primary-container)] hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous Page</span>
              </button>

              <span className="rounded-full bg-[var(--color-paper-container)] px-4 py-1.5 font-serif text-xs font-bold text-[var(--color-primary-scholarly)] border border-[var(--color-outline-variant)] shadow-2xs">
                Page {page}
              </span>

              <button
                disabled={!hasNext}
                onClick={() => handlePageChange(page + 1)}
                className="flex items-center gap-1.5 rounded-full border border-[var(--color-outline-variant)] bg-white px-5 py-2.5 text-xs font-bold text-[var(--color-ink)] shadow-xs hover:border-[var(--color-primary-container)] hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <span>Next Page</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-sans text-gray-500">Loading catalog...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
