"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Heart, CheckCircle2, BookmarkCheck, Cloud, User, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import { FavoriteBook, GutendexBook } from "@/types";
import { getFavorites, getAllProgress, toggleFavorite, getCurrentUser } from "@/lib/storage";

interface CurrentlyReadingItem {
  bookId: number;
  title: string;
  author: string;
  coverUrl: string;
  progressPercent: number;
  updatedAt: string;
}

function LibraryContent() {
  const [activeTab, setActiveTab] = useState<"favorites" | "reading" | "finished">("favorites");
  const [favorites, setFavorites] = useState<FavoriteBook[]>([]);
  const [readingItems, setReadingItems] = useState<CurrentlyReadingItem[]>([]);
  const [finishedItems, setFinishedItems] = useState<CurrentlyReadingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const loadLibraryData = async () => {
    setLoading(true);

    const user = await getCurrentUser();
    setUserEmail(user?.email || null);

    // Load Favorites (Available for both Guests and Logged-in users)
    const favs = await getFavorites();
    setFavorites(favs);

    // Load Reading Progress ONLY if user is logged in
    if (user) {
      const allProgressMap = await getAllProgress();
      const progressBookIds = Object.keys(allProgressMap).map(Number);

      if (progressBookIds.length > 0) {
        try {
          const items: CurrentlyReadingItem[] = [];
          const finished: CurrentlyReadingItem[] = [];

          await Promise.all(
            progressBookIds.map(async (bId) => {
              const prog = allProgressMap[bId];
              try {
                const res = await fetch(`https://gutendex.com/books/${bId}`);
                if (res.ok) {
                  const bookMeta: GutendexBook = await res.json();
                  const authorName =
                    bookMeta.authors && bookMeta.authors.length > 0
                      ? bookMeta.authors.map((a) => a.name.split(",").reverse().join(" ").trim()).join(", ")
                      : "Unknown Author";

                  const coverUrl =
                    bookMeta.formats["image/jpeg"] ||
                    `https://via.placeholder.com/300x450/1a2b3c/ffffff?text=${encodeURIComponent(
                      bookMeta.title.slice(0, 30)
                    )}`;

                  const item: CurrentlyReadingItem = {
                    bookId: bId,
                    title: bookMeta.title,
                    author: authorName,
                    coverUrl,
                    progressPercent: prog.progress_percent || 0,
                    updatedAt: prog.updated_at || new Date().toISOString(),
                  };

                  if (prog.finished || item.progressPercent >= 95) {
                    finished.push(item);
                  } else {
                    items.push(item);
                  }
                }
              } catch (err) {
                console.warn(`Failed to fetch metadata for book ${bId}:`, err);
              }
            })
          );

          setReadingItems(items);
          setFinishedItems(finished);
        } catch (err) {
          console.error("Error loading progress items:", err);
        }
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadLibraryData();
  }, []);

  const handleRemoveFavorite = async (fav: FavoriteBook) => {
    await toggleFavorite(fav);
    setFavorites((prev) => prev.filter((f) => f.book_id !== fav.book_id));
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Sync Mode Status Banner */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-[var(--color-outline-variant)] bg-white p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-paper-container)] text-[var(--color-primary-scholarly)]">
              {userEmail ? <Cloud className="h-5 w-5" /> : <User className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold">
                {userEmail ? "Cloud Account Synced" : "Guest Mode Active"}
              </h3>
              <p className="text-xs text-[var(--color-ink-muted)]">
                {userEmail
                  ? `Your reading progress & favorites are synced to ${userEmail}`
                  : "Favorites are saved locally. Sign in to enable reading progress tracking & multi-device sync."}
              </p>
            </div>
          </div>

          {!userEmail && (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
              Guest (Favorites Only)
            </span>
          )}
        </div>

        {/* Header Tabs */}
        <div className="flex items-center gap-2 border-b border-[var(--color-outline-variant)] pb-4 mb-8">
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "favorites"
                ? "bg-[var(--color-primary-container)] text-white shadow-xs"
                : "text-[var(--color-ink-muted)] hover:bg-gray-100"
            }`}
          >
            <Heart className="h-4 w-4" />
            <span>Favorites ({favorites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("reading")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "reading"
                ? "bg-[var(--color-primary-container)] text-white shadow-xs"
                : "text-[var(--color-ink-muted)] hover:bg-gray-100"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Currently Reading ({readingItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("finished")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "finished"
                ? "bg-[var(--color-primary-container)] text-white shadow-xs"
                : "text-[var(--color-ink-muted)] hover:bg-gray-100"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Finished ({finishedItems.length})</span>
          </button>
        </div>

        {/* Skeleton Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse rounded-lg border border-gray-200 bg-white p-4 space-y-3"
              >
                <div className="h-24 rounded bg-gray-200" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Tab 1: Favorites */}
        {!loading && activeTab === "favorites" && (
          <div>
            {favorites.length === 0 ? (
              <div className="my-16 text-center rounded-lg border border-dashed border-[var(--color-outline-soft)] bg-white p-12">
                <BookmarkCheck className="mx-auto h-12 w-12 text-gray-400 mb-3 opacity-50" />
                <h3 className="font-serif text-lg font-bold">No Favorites Yet</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Click the heart icon on any book card to bookmark your favorite public domain classics.
                </p>
                <Link
                  href="/"
                  className="mt-4 inline-block rounded-md bg-[var(--color-primary-scholarly)] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c233c]"
                >
                  Browse Ebooks
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((fav) => (
                  <div
                    key={fav.book_id}
                    className="flex overflow-hidden rounded-lg border border-[var(--color-outline-variant)] bg-white p-4 shadow-xs hover:border-[var(--color-outline-soft)] transition-all"
                  >
                    <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                      <Image
                        src={fav.cover_url}
                        alt={fav.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col justify-between">
                      <div>
                        <h4 className="font-serif text-sm font-bold text-gray-900 line-clamp-1">
                          {fav.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{fav.author}</p>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <Link
                          href={`/read/${fav.book_id}`}
                          className="flex-1 rounded bg-[var(--color-primary-container)] py-1.5 text-center text-xs font-bold text-white hover:bg-[#0c233c] transition-colors"
                        >
                          Read Ebook
                        </Link>
                        <button
                          onClick={() => handleRemoveFavorite(fav)}
                          title="Remove Favorite"
                          className="rounded border border-gray-200 p-1.5 text-gray-400 hover:border-red-200 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Currently Reading */}
        {!loading && activeTab === "reading" && (
          <div>
            {!userEmail ? (
              <div className="my-16 text-center rounded-lg border border-amber-200 bg-amber-50/50 p-12">
                <User className="mx-auto h-12 w-12 text-amber-600 mb-3 opacity-80" />
                <h3 className="font-serif text-lg font-bold text-amber-900">Sign In to Track Progress</h3>
                <p className="text-xs text-amber-800 mt-1 max-w-sm mx-auto leading-relaxed">
                  Reading progress tracking and completion statuses are saved when signed in. Favorites are available in Guest Mode.
                </p>
              </div>
            ) : readingItems.length === 0 ? (
              <div className="my-16 text-center rounded-lg border border-dashed border-[var(--color-outline-soft)] bg-white p-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-3 opacity-50" />
                <h3 className="font-serif text-lg font-bold">No Active Books</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Pick a book from the catalog to begin reading. Your reading percentage & CFI location will update automatically.
                </p>
                <Link
                  href="/"
                  className="mt-4 inline-block rounded-md bg-[var(--color-primary-scholarly)] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c233c]"
                >
                  Explore Catalog
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {readingItems.map((item) => (
                  <div
                    key={item.bookId}
                    className="flex overflow-hidden rounded-lg border border-[var(--color-outline-variant)] bg-white p-4 shadow-xs hover:border-[var(--color-outline-soft)] transition-all"
                  >
                    <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                      <Image
                        src={item.coverUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col justify-between">
                      <div>
                        <h4 className="font-serif text-sm font-bold text-gray-900 line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.author}</p>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] text-gray-600 font-semibold mb-1">
                          <span>Progress</span>
                          <span>{item.progressPercent}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full bg-[var(--color-primary-container)] transition-all"
                            style={{ width: `${item.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <Link
                        href={`/read/${item.bookId}`}
                        className="mt-3 inline-flex items-center justify-center gap-1 rounded bg-[var(--color-paper-container)] py-1.5 text-xs font-bold text-[var(--color-primary-scholarly)] hover:bg-[var(--color-primary-container)] hover:text-white transition-colors"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Resume Reading</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Finished Books */}
        {!loading && activeTab === "finished" && (
          <div>
            {!userEmail ? (
              <div className="my-16 text-center rounded-lg border border-amber-200 bg-amber-50/50 p-12">
                <CheckCircle2 className="mx-auto h-12 w-12 text-amber-600 mb-3 opacity-80" />
                <h3 className="font-serif text-lg font-bold text-amber-900">Sign In to View Completed Ebooks</h3>
                <p className="text-xs text-amber-800 mt-1 max-w-sm mx-auto leading-relaxed">
                  Books you mark as finished are saved to your account library.
                </p>
              </div>
            ) : finishedItems.length === 0 ? (
              <div className="my-16 text-center rounded-lg border border-dashed border-[var(--color-outline-soft)] bg-white p-12">
                <CheckCircle2 className="mx-auto h-12 w-12 text-gray-400 mb-3 opacity-50" />
                <h3 className="font-serif text-lg font-bold">No Completed Ebooks</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Books will automatically appear here once you mark them as finished upon reaching the end.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {finishedItems.map((item) => (
                  <div
                    key={item.bookId}
                    className="flex overflow-hidden rounded-lg border border-[var(--color-outline-variant)] bg-white p-4 shadow-xs"
                  >
                    <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                      <Image
                        src={item.coverUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="ml-4 flex flex-1 flex-col justify-between">
                      <div>
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 mb-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Finished
                        </div>
                        <h4 className="font-serif text-sm font-bold text-gray-900 line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.author}</p>
                      </div>

                      <Link
                        href={`/read/${item.bookId}`}
                        className="mt-3 rounded border border-gray-200 py-1.5 text-center text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Re-read Ebook
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-sans text-gray-500">Loading library...</div>}>
      <LibraryContent />
    </Suspense>
  );
}
