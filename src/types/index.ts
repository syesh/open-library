export interface GutendexAuthor {
  name: string;
  birth_year?: number | null;
  death_year?: number | null;
}

export interface GutendexBook {
  id: number;
  title: string;
  authors: GutendexAuthor[];
  translators?: GutendexAuthor[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  copyright: boolean | null;
  media_type: string;
  formats: Record<string, string>;
  download_count: number;
}

export interface GutendexResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: GutendexBook[];
}

export interface FavoriteBook {
  id?: string;
  user_id?: string;
  book_id: number;
  title: string;
  author: string;
  cover_url: string;
  created_at?: string;
}

export interface ReadingProgress {
  id?: string;
  user_id?: string;
  book_id: number;
  cfi_location: string;
  progress_percent: number;
  finished?: boolean;
  updated_at?: string;
}

export type ReaderTheme = "light" | "sepia" | "dark";
export type ReaderFont = "serif" | "sans" | "mono";
export type ReaderFlowMode = "scrolled" | "paginated";

export interface ReaderSettings {
  theme: ReaderTheme;
  fontFamily: ReaderFont;
  fontSize: number; // 14 to 26 (default 18)
  flowMode: ReaderFlowMode; // "scrolled" (vertical scroll) vs "paginated" (card pages)
}
