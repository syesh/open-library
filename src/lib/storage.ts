import { FavoriteBook, ReadingProgress, ReaderSettings } from "@/types";
import { getSupabaseBrowserClient } from "./supabase/client";

const LOCAL_STORAGE_KEY = "openread_guest_data_v2";

interface GuestStorageData {
  favorites: FavoriteBook[];
  settings: ReaderSettings;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: "light",
  fontFamily: "serif",
  fontSize: 18,
  flowMode: "scrolled",
};

function getLocalData(): GuestStorageData {
  if (typeof window === "undefined") {
    return { favorites: [], settings: DEFAULT_SETTINGS };
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return { favorites: [], settings: DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      favorites: parsed.favorites || [],
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    };
  } catch {
    return { favorites: [], settings: DEFAULT_SETTINGS };
  }
}

function saveLocalData(data: GuestStorageData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save to localStorage:", e);
  }
}

// Check if current user is logged in via Supabase or local session
export async function getCurrentUser(): Promise<{ id: string; email: string } | null> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) return { id: user.id, email: user.email };
    } catch {
      // ignore
    }
  }

  // Fallback local session if Supabase is not connected
  if (typeof window !== "undefined") {
    const rawUser = localStorage.getItem("openread_user_session");
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        if (parsed && parsed.email) {
          return { id: parsed.id || `local_${parsed.email}`, email: parsed.email };
        }
      } catch {
        // ignore
      }
    }
  }
  return null;
}

export async function signInWithEmail(email: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { success: false, message: "Please enter a valid email address." };

  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: cleanEmail });
      if (!error) {
        return { success: true, message: `Magic login link sent to ${cleanEmail}!` };
      }
    } catch (err) {
      console.warn("Supabase auth error, using local session:", err);
    }
  }

  // Local user profile sign-in
  const user = { id: `user_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`, email: cleanEmail };
  if (typeof window !== "undefined") {
    localStorage.setItem("openread_user_session", JSON.stringify(user));
  }
  return { success: true, message: `Signed in successfully as ${cleanEmail}` };
}

export async function signOutUser(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem("openread_user_session");
  }
}

// --- FAVORITES (Available for both Guests and Logged-in Users) ---
export async function getFavorites(): Promise<FavoriteBook[]> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const user = await getCurrentUser();
      if (user) {
        const { data, error } = await supabase
          .from("favorites")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) return data as FavoriteBook[];
      }
    } catch (err) {
      console.warn("Supabase fetch favorites failed, falling back to local:", err);
    }
  }
  return getLocalData().favorites;
}

export async function toggleFavorite(book: FavoriteBook): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const user = await getCurrentUser();
      if (user) {
        const { data: existing } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("book_id", book.book_id)
          .maybeSingle();

        if (existing) {
          await supabase.from("favorites").delete().eq("id", existing.id);
          return false;
        } else {
          await supabase.from("favorites").insert({
            user_id: user.id,
            book_id: book.book_id,
            title: book.title,
            author: book.author,
            cover_url: book.cover_url,
          });
          return true;
        }
      }
    } catch (err) {
      console.warn("Supabase toggle favorite failed, falling back to local:", err);
    }
  }

  // Guest Mode Favorite storage
  const current = getLocalData();
  const index = current.favorites.findIndex((f) => f.book_id === book.book_id);
  let isNowFav = false;
  if (index >= 0) {
    current.favorites.splice(index, 1);
  } else {
    current.favorites.unshift({ ...book, created_at: new Date().toISOString() });
    isNowFav = true;
  }
  saveLocalData(current);
  return isNowFav;
}

export async function checkIsFavorite(bookId: number): Promise<boolean> {
  const favs = await getFavorites();
  return favs.some((f) => f.book_id === bookId);
}

// --- READING PROGRESS (ONLY saved if user is LOGGED IN) ---
export async function getBookProgress(bookId: number): Promise<ReadingProgress | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("reading_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .maybeSingle();
      if (!error && data) return data as ReadingProgress;
    } catch (err) {
      console.warn("Supabase fetch progress failed:", err);
    }
  }

  if (typeof window !== "undefined") {
    const key = `openread_progress_${user.id}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const map = JSON.parse(raw);
      return map[bookId] || null;
    }
  }
  return null;
}

export async function saveBookProgress(
  bookId: number,
  cfiLocation: string,
  progressPercent: number,
  finished?: boolean
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const roundedPercent = Math.round(progressPercent * 10) / 10;
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      await supabase.from("reading_progress").upsert(
        {
          user_id: user.id,
          book_id: bookId,
          cfi_location: cfiLocation,
          progress_percent: roundedPercent,
          finished: finished !== undefined ? finished : false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,book_id" }
      );
      return;
    } catch (err) {
      console.warn("Supabase save progress failed:", err);
    }
  }

  if (typeof window !== "undefined") {
    const key = `openread_progress_${user.id}`;
    const raw = localStorage.getItem(key);
    const map = raw ? JSON.parse(raw) : {};
    map[bookId] = {
      id: `${user.id}_${bookId}`,
      user_id: user.id,
      book_id: bookId,
      cfi_location: cfiLocation,
      progress_percent: roundedPercent,
      finished: finished !== undefined ? finished : false,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(map));
  }
}

export async function setBookFinishedState(bookId: number, finished: boolean): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const currentProgress = await getBookProgress(bookId);
  const cfi = currentProgress?.cfi_location || "";
  const pct = currentProgress?.progress_percent || 100;
  await saveBookProgress(bookId, cfi, pct, finished);
}

export async function getAllProgress(): Promise<Record<number, ReadingProgress>> {
  const user = await getCurrentUser();
  if (!user) return {};

  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("reading_progress")
        .select("*")
        .eq("user_id", user.id);
      if (!error && data) {
        const map: Record<number, ReadingProgress> = {};
        data.forEach((item) => {
          map[item.book_id] = item as ReadingProgress;
        });
        return map;
      }
    } catch (err) {
      console.warn("Supabase fetch all progress failed:", err);
    }
  }

  if (typeof window !== "undefined") {
    const key = `openread_progress_${user.id}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  }

  return {};
}

// --- READER SETTINGS (Preferences stored locally) ---
export function getStoredSettings(): ReaderSettings {
  return getLocalData().settings;
}

export function saveStoredSettings(settings: ReaderSettings): void {
  const current = getLocalData();
  current.settings = settings;
  saveLocalData(current);
}
