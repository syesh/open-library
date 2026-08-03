"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, BookOpen, Download } from "lucide-react";
import { GutendexBook, FavoriteBook } from "@/types";
import { checkIsFavorite, toggleFavorite } from "@/lib/storage";

interface BookCardProps {
  book: GutendexBook;
  onFavoriteToggle?: (isFav: boolean) => void;
}

export default function BookCard({ book, onFavoriteToggle }: BookCardProps) {
  const [isFav, setIsFav] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const coverUrl =
    book.formats["image/jpeg"] ||
    `https://via.placeholder.com/300x450/1a2b3c/ffffff?text=${encodeURIComponent(
      book.title.slice(0, 30)
    )}`;

  const authorName =
    book.authors && book.authors.length > 0
      ? book.authors.map((a) => a.name.split(",").reverse().join(" ").trim()).join(", ")
      : "Unknown Author";

  useEffect(() => {
    checkIsFavorite(book.id).then(setIsFav);
  }, [book.id]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const favItem: FavoriteBook = {
      book_id: book.id,
      title: book.title,
      author: authorName,
      cover_url: coverUrl,
    };

    const nowFav = await toggleFavorite(favItem);
    setIsFav(nowFav);
    if (onFavoriteToggle) onFavoriteToggle(nowFav);
  };

  return (
    <div
      className="group relative flex flex-col justify-between overflow-hidden rounded-md border border-[var(--color-outline-variant)] bg-white p-3 transition-all hover:border-[var(--color-outline-soft)] hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cover Image Container with Zero-CLS Skeleton */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xs bg-[var(--color-paper-container-low)]">
        {/* Pulsing Skeleton Placeholder while loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gray-200 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-gray-300 opacity-60" />
          </div>
        )}

        <Image
          src={coverUrl}
          alt={book.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          onLoad={() => setImageLoaded(true)}
          className={`object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          unoptimized
        />

        {/* Favorite Overlay Button */}
        <button
          onClick={handleFavoriteClick}
          title={isFav ? "Remove from Favorites" : "Add to Favorites"}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/40 backdrop-blur-md transition-all ${
            isFav
              ? "bg-rose-500 text-white shadow-sm"
              : "bg-black/30 text-white hover:bg-black/50"
          }`}
        >
          <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
        </button>

        {/* Hover Quick Read Overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Link
            href={`/read/${book.id}`}
            className="flex items-center gap-1.5 rounded-md bg-[var(--color-paper)] px-4 py-2 text-xs font-semibold text-[var(--color-ink)] shadow-md hover:bg-white transition-colors"
          >
            <BookOpen className="h-4 w-4 text-[var(--color-primary-container)]" />
            <span>Read Now</span>
          </Link>
        </div>
      </div>

      {/* Book Metadata */}
      <div className="mt-3 flex flex-col flex-1 justify-between gap-2">
        <div>
          <h3
            title={book.title}
            className="font-serif text-sm font-bold leading-snug text-[var(--color-ink)] line-clamp-2"
          >
            {book.title}
          </h3>
          <p className="mt-1 font-sans text-xs font-medium text-[var(--color-ink-muted)] line-clamp-1">
            {authorName}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-paper-container-low)] text-[11px] text-[var(--color-ink-muted)]">
          <span className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            {book.download_count.toLocaleString()}
          </span>
          <Link
            href={`/read/${book.id}`}
            className="font-semibold text-[var(--color-secondary-blue)] hover:underline"
          >
            Open EPUB →
          </Link>
        </div>
      </div>
    </div>
  );
}
