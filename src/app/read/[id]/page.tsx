"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ePub, { Book, Rendition, NavItem } from "epubjs";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Settings,
  List,
  Heart,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  ScrollText,
  BookOpen,
  User,
  Sparkles,
  Type,
  Sun,
  Moon,
  Compass,
} from "lucide-react";
import { GutendexBook, ReaderSettings, ReaderTheme, ReaderFont, ReaderFlowMode } from "@/types";
import {
  getBookProgress,
  saveBookProgress,
  setBookFinishedState,
  getStoredSettings,
  saveStoredSettings,
  checkIsFavorite,
  toggleFavorite,
  getCurrentUser,
} from "@/lib/storage";

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookIdStr = Array.isArray(params.id) ? params.id[0] : params.id;
  const bookId = parseInt(bookIdStr || "0", 10);

  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);

  const [bookMeta, setBookMeta] = useState<GutendexBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  // Mode Preference Selector State (Remembers choice; only prompts on 1st visit)
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [initialModeChosen, setInitialModeChosen] = useState(false);

  // Reader state
  const [progressPercent, setProgressPercent] = useState(0);
  const [, setCurrentCfi] = useState<string | null>(null);
  const [chapterTitle, setChapterTitle] = useState<string>("");
  const [toc, setToc] = useState<NavItem[]>([]);
  const [showTocModal, setShowTocModal] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [isFav, setIsFav] = useState(false);

  // Finished Prompt Modal State
  const [showFinishedPrompt, setShowFinishedPrompt] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);

  // Settings with strict typography boundaries
  const [settings, setSettings] = useState<ReaderSettings>({
    theme: "light",
    fontFamily: "serif",
    fontSize: 18,
    flowMode: "scrolled",
  });

  // Check auth user & initial settings (Always prompts for reading experience on visit)
  useEffect(() => {
    const loadedSettings = getStoredSettings();

    // Check if user has already saved a reading mode preference
    let savedFlowPref: ReaderFlowMode | null = null;
    if (typeof window !== "undefined") {
      savedFlowPref = localStorage.getItem("openread_reader_flow_pref") as ReaderFlowMode | null;
    }

    if (savedFlowPref && (savedFlowPref === "scrolled" || savedFlowPref === "paginated")) {
      loadedSettings.flowMode = savedFlowPref;
    }

    setSettings(loadedSettings);
    setShowModeSelector(true);
    setInitialModeChosen(false);

    getCurrentUser().then((user) => {
      setIsGuest(!user);
    });

    if (bookId) {
      checkIsFavorite(bookId).then(setIsFav);
      getBookProgress(bookId).then((prog) => {
        if (prog?.finished) setIsFinished(true);
      });
    }
  }, [bookId]);

  // Fetch book metadata
  useEffect(() => {
    if (!bookId) return;
    let isMounted = true;
    async function loadMeta() {
      try {
        const res = await fetch(`https://gutendex.com/books/${bookId}`);
        if (!res.ok) throw new Error("Failed to load book metadata.");
        const data: GutendexBook = await res.json();
        if (isMounted) setBookMeta(data);
      } catch (err: unknown) {
        if (isMounted) setError(err instanceof Error ? err.message : "Error loading book metadata.");
      }
    }
    loadMeta();
    return () => {
      isMounted = false;
    };
  }, [bookId]);

  const getEpubProxyUrl = useCallback((meta: GutendexBook) => {
    const rawUrl =
      meta.formats["application/epub+zip"] ||
      meta.formats["application/epub+zip; charset=utf-8"] ||
      meta.formats["application/x-mobipocket-ebook"];

    if (!rawUrl) return null;
    return `/api/proxy-epub?url=${encodeURIComponent(rawUrl)}`;
  }, []);

  const applyRenditionStyles = useCallback(
    (rendition: Rendition, newSettings: ReaderSettings) => {
      let fontCss = "Merriweather, Georgia, serif";
      if (newSettings.fontFamily === "sans") {
        fontCss = "Inter, system-ui, sans-serif";
      } else if (newSettings.fontFamily === "mono") {
        fontCss = "'JetBrains Mono', monospace";
      }

      // Strict font sizing boundaries (14px to 24px)
      const clampedFontSize = Math.min(24, Math.max(14, newSettings.fontSize));
      const isScrolled = newSettings.flowMode === "scrolled";
      const bodyOverflow = isScrolled ? "visible !important" : "hidden !important";
      const bodyHeight = isScrolled ? "auto !important" : "100% !important";

      rendition.themes.font(fontCss);
      rendition.themes.fontSize(`${clampedFontSize}px`);

      rendition.themes.register("light", {
        body: {
          background: "#FAF9F6 !important",
          color: "#1A1C1A !important",
          "line-height": "1.8 !important",
          padding: "24px 28px !important",
          margin: "0 auto !important",
          "max-width": "680px !important",
          "overflow-wrap": "break-word !important",
          "overflow-y": bodyOverflow,
          height: bodyHeight,
        },
        p: { "line-height": "1.8 !important", "margin-bottom": "1.25em !important" },
      });

      rendition.themes.register("sepia", {
        body: {
          background: "#F4ECD8 !important",
          color: "#5B4636 !important",
          "line-height": "1.8 !important",
          padding: "24px 28px !important",
          margin: "0 auto !important",
          "max-width": "680px !important",
          "overflow-wrap": "break-word !important",
          "overflow-y": bodyOverflow,
          height: bodyHeight,
        },
        p: { "line-height": "1.8 !important", "margin-bottom": "1.25em !important" },
      });

      rendition.themes.register("dark", {
        body: {
          background: "#121212 !important",
          color: "#E0E0E0 !important",
          "line-height": "1.8 !important",
          padding: "24px 28px !important",
          margin: "0 auto !important",
          "max-width": "680px !important",
          "overflow-wrap": "break-word !important",
          "overflow-y": bodyOverflow,
          height: bodyHeight,
        },
        p: { "line-height": "1.8 !important", "margin-bottom": "1.25em !important" },
      });

      rendition.themes.select(newSettings.theme);
    },
    []
  );

  // Initialize EPUB Engine once user mode preference is confirmed
  useEffect(() => {
    if (!bookMeta || !viewerRef.current || !initialModeChosen) return;

    let isSubscribed = true;

    async function initReader() {
      try {
        setLoading(true);
        setError(null);

        // Always clean up existing viewer container DOM to prevent duplicate layers
        if (viewerRef.current) {
          viewerRef.current.innerHTML = "";
        }

        const proxyUrl = getEpubProxyUrl(bookMeta!);
        if (!proxyUrl) {
          throw new Error("This ebook does not have a downloadable EPUB format available.");
        }

        const res = await fetch(proxyUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch EPUB binary file (${res.status}).`);
        }

        const arrayBuffer = await res.arrayBuffer();
        if (!isSubscribed) return;

        const book = ePub(arrayBuffer);
        bookRef.current = book;

        if (!viewerRef.current) return;

        const isScrolled = settings.flowMode === "scrolled";
        const flowOption = isScrolled ? "scrolled-doc" : "paginated";

        const rendition = book.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          spread: "none",
          flow: flowOption,
          manager: isScrolled ? "continuous" : "default",
        });
        renditionRef.current = rendition;

        // Inject dynamic style overrides into EPUB iframe documents for smooth scrolling
        rendition.hooks.content.register((contents: { document?: Document }) => {
          if (!contents || !contents.document) return;
          const doc = contents.document;
          const style = doc.createElement("style");
          if (isScrolled) {
            style.innerHTML = `
              html, body {
                overflow-y: visible !important;
                height: auto !important;
                -webkit-overflow-scrolling: touch !important;
              }
            `;
          } else {
            style.innerHTML = `
              html, body {
                overflow: hidden !important;
              }
            `;
          }
          doc.head.appendChild(style);
        });

        applyRenditionStyles(rendition, settings);

        // Restore saved progress (if logged in)
        const saved = await getBookProgress(bookId);
        if (!isSubscribed) return;
        const startLoc = saved?.cfi_location || undefined;

        await rendition.display(startLoc);
        if (isSubscribed) setLoading(false);

        // Generate Locations for 100% accurate percentage mapping
        book.ready.then(() => {
          return book.locations.generate(1000);
        }).then(() => {
          if (isSubscribed && rendition.location) {
            const loc = rendition.currentLocation() as unknown as { start?: { cfi?: string } };
            if (loc?.start?.cfi) {
              const pct = Math.round(book.locations.percentageFromCfi(loc.start.cfi) * 100);
              setProgressPercent(pct);
            }
          }
        });

        // Load TOC
        book.loaded.navigation.then((nav) => {
          if (isSubscribed && nav.toc) {
            setToc(nav.toc);
          }
        });

        // Relocation listener
        rendition.on("relocated", (location: { start?: { cfi?: string; percentage?: number; href?: string } }) => {
          if (!isSubscribed) return;
          const cfi = location?.start?.cfi;

          let pct = 0;
          if (book.locations && book.locations.length() > 0 && cfi) {
            pct = Math.round(book.locations.percentageFromCfi(cfi) * 100);
          } else {
            pct = Math.round((location?.start?.percentage || 0) * 100);
          }

          if (cfi) {
            setCurrentCfi(cfi);
            setProgressPercent(pct);

            // Save progress ONLY if user is logged in
            saveBookProgress(bookId, cfi, pct);

            // Check if user reached end (>= 90%) and hasn't answered finished prompt yet
            if (pct >= 90 && !isFinished && !promptDismissed) {
              setShowFinishedPrompt(true);
            }

            // Update Chapter Title
            if (book.navigation && location?.start?.href) {
              const currentChapter = book.navigation.get(location.start.href);
              if (currentChapter && currentChapter.label) {
                setChapterTitle(currentChapter.label.trim());
              }
            }
          }
        });
      } catch (err: unknown) {
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : "Failed to render ebook engine.");
          setLoading(false);
        }
      }
    }

    initReader();

    return () => {
      isSubscribed = false;
      try {
        if (renditionRef.current) renditionRef.current.destroy();
        if (bookRef.current) bookRef.current.destroy();
      } catch (e) {
        console.warn("Cleanup error:", e);
      }
    };
  }, [bookMeta, bookId, settings.flowMode, initialModeChosen, getEpubProxyUrl, applyRenditionStyles]);

  // Debounced Window Resize
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (renditionRef.current) {
          const location = renditionRef.current.currentLocation() as unknown as { start?: { cfi?: string } };
          const currentCfiLoc = location?.start?.cfi;
          (renditionRef.current as unknown as { resize: () => void }).resize();
          if (currentCfiLoc) {
            renditionRef.current.display(currentCfiLoc);
          }
        }
      }, 250);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        renditionRef.current?.prev();
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        renditionRef.current?.next();
      } else if (e.key === "Escape") {
        setShowSettingsDrawer(false);
        setShowTocModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleModeChoice = (chosenMode: ReaderFlowMode) => {
    const updated = { ...settings, flowMode: chosenMode };
    setSettings(updated);
    saveStoredSettings(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("openread_reader_flow_pref", chosenMode);
    }
    setShowModeSelector(false);
    setInitialModeChosen(true);
  };

  // Settings Handlers
  const handleThemeChange = (newTheme: ReaderTheme) => {
    const updated = { ...settings, theme: newTheme };
    setSettings(updated);
    saveStoredSettings(updated);
    if (renditionRef.current) applyRenditionStyles(renditionRef.current, updated);
  };

  const handleFontFamilyChange = (newFont: ReaderFont) => {
    const updated = { ...settings, fontFamily: newFont };
    setSettings(updated);
    saveStoredSettings(updated);
    if (renditionRef.current) applyRenditionStyles(renditionRef.current, updated);
  };

  const handleFlowModeChange = (newMode: ReaderFlowMode) => {
    const updated = { ...settings, flowMode: newMode };
    setSettings(updated);
    saveStoredSettings(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("openread_reader_flow_pref", newMode);
    }
  };

  const handleFontSizeChange = (delta: number) => {
    // Strict font size bounds: 14px to 24px
    const newSize = Math.min(24, Math.max(14, settings.fontSize + delta));
    const updated = { ...settings, fontSize: newSize };
    setSettings(updated);
    saveStoredSettings(updated);
    if (renditionRef.current) applyRenditionStyles(renditionRef.current, updated);
  };

  const handleFavoriteClick = async () => {
    if (!bookMeta) return;
    const authorName =
      bookMeta.authors && bookMeta.authors.length > 0
        ? bookMeta.authors.map((a) => a.name.split(",").reverse().join(" ").trim()).join(", ")
        : "Unknown Author";

    const coverUrl =
      bookMeta.formats["image/jpeg"] ||
      `https://via.placeholder.com/300x450/1a2b3c/ffffff?text=${encodeURIComponent(bookMeta.title.slice(0, 30))}`;

    const nowFav = await toggleFavorite({
      book_id: bookId,
      title: bookMeta.title,
      author: authorName,
      cover_url: coverUrl,
    });
    setIsFav(nowFav);
  };

  const handleMarkAsFinished = async (answerYes: boolean) => {
    setShowFinishedPrompt(false);
    setPromptDismissed(true);
    if (answerYes) {
      setIsFinished(true);
      await setBookFinishedState(bookId, true);
    }
  };

  const getBgClass = () => {
    if (settings.theme === "sepia") return "bg-[#F4ECD8] text-[#5B4636]";
    if (settings.theme === "dark") return "bg-[#121212] text-[#E0E0E0]";
    return "bg-[#FAF9F6] text-[#1A1C1A]";
  };

  return (
    <div className={`relative flex h-screen w-screen flex-col overflow-hidden transition-colors ${getBgClass()}`}>
      {/* Mode Selector Modal - Prompted EVERY time user opens a book */}
      {showModeSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl text-gray-900 border border-gray-100 my-auto">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-container)] text-white mb-3 shadow-md">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl font-bold">Choose Reading Experience</h3>
              <p className="mt-1 text-xs text-gray-500 max-w-xs mx-auto">
                How would you like to read this book? (You can also change this anytime in settings):
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => handleModeChoice("scrolled")}
                className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all group shadow-xs ${
                  settings.flowMode === "scrolled"
                    ? "border-[var(--color-primary-container)] bg-sky-50/70 font-semibold"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-container)] text-white shadow-xs group-hover:scale-105 transition-transform">
                  <ScrollText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-gray-900">
                    Continuous Vertical Scroll {settings.flowMode === "scrolled" && "(Last Used)"}
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">Scroll smoothly down through chapters like a webpage.</p>
                </div>
              </button>

              <button
                onClick={() => handleModeChoice("paginated")}
                className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all group shadow-xs ${
                  settings.flowMode === "paginated"
                    ? "border-[var(--color-primary-container)] bg-sky-50/70 font-semibold"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 shadow-xs group-hover:scale-105 transition-transform">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-gray-900">
                    Book Page Cards {settings.flowMode === "paginated" && "(Last Used)"}
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">Flip page-by-page horizontally like a physical book.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Fixed Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-black/10">
        <div
          className="h-full bg-[var(--color-primary-container)] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Reader Header */}
      <header className="z-30 flex items-center justify-between border-b border-black/10 px-4 py-2.5 backdrop-blur-xs flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 rounded-md p-1.5 hover:bg-black/5 transition-colors text-sm font-medium"
            title="Back to Catalog"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {bookMeta && (
            <div className="max-w-[180px] sm:max-w-xs md:max-w-md truncate">
              <h1 className="font-serif text-xs font-bold sm:text-sm truncate">
                {bookMeta.title}
              </h1>
              {chapterTitle && (
                <p className="text-[11px] opacity-70 truncate font-sans">
                  {chapterTitle}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {isGuest && (
            <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
              <User className="h-3 w-3" />
              Guest Mode
            </span>
          )}

          {isFinished ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
              <CheckCircle2 className="h-3 w-3" />
              Finished
            </span>
          ) : (
            <span className="text-xs font-mono font-medium opacity-80 mr-1">
              {progressPercent}%
            </span>
          )}

          <button
            onClick={handleFavoriteClick}
            title={isFav ? "Remove from Favorites" : "Add to Favorites"}
            className={`rounded-md p-2 transition-colors ${
              isFav ? "text-rose-500 fill-rose-500" : "hover:bg-black/5"
            }`}
          >
            <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
          </button>

          {toc.length > 0 && (
            <button
              onClick={() => setShowTocModal(true)}
              className="rounded-md p-2 hover:bg-black/5 transition-colors"
              title="Table of Contents"
            >
              <List className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="rounded-md p-2 hover:bg-black/5 transition-colors"
            title="Appearance Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main EPUB Reader Stage */}
      <main className="relative flex-1 w-full overflow-hidden flex items-center justify-center">
        {loading && initialModeChosen && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[var(--color-paper)]">
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-[var(--color-primary-container)]" />
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-500 animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-serif text-sm font-bold text-[var(--color-ink)]">
                Preparing {bookMeta?.title || "Ebook"}...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="z-20 max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-900 shadow-md">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
            <h3 className="font-bold text-sm">Failed to Load EPUB</h3>
            <p className="mt-1 text-xs text-red-700">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 rounded-md bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              Return to Catalog
            </button>
          </div>
        )}

        {/* Side Hotspots for Paginated Mode */}
        {!loading && !error && settings.flowMode === "paginated" && (
          <>
            <button
              onClick={() => renditionRef.current?.prev()}
              className="absolute left-0 top-0 bottom-0 z-10 w-12 sm:w-16 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-r from-black/10 to-transparent"
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft className="h-8 w-8 text-black/60" />
            </button>

            <button
              onClick={() => renditionRef.current?.next()}
              className="absolute right-0 top-0 bottom-0 z-10 w-12 sm:w-16 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-l from-black/10 to-transparent"
              title="Next Page (Right Arrow)"
            >
              <ChevronRight className="h-8 w-8 text-black/60" />
            </button>
          </>
        )}

        {/* Ebook Canvas Element with Smooth Vertical Scrolling Support */}
        <div
          ref={viewerRef}
          className={`h-full w-full max-w-[720px] mx-auto px-4 sm:px-8 py-6 transition-all ${
            settings.flowMode === "scrolled"
              ? "overflow-y-auto touch-pan-y"
              : "overflow-hidden"
          }`}
        />
      </main>

      {/* "Did you read this book?" Confirmation Prompt Modal */}
      {showFinishedPrompt && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm rounded-xl border border-emerald-200 bg-white p-5 shadow-2xl text-gray-900 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 flex-shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-gray-900">Finished Reading?</h4>
              <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                You’ve reached the end of <strong>{bookMeta?.title}</strong>! Did you complete reading this book?
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleMarkAsFinished(true)}
                  className="rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  Yes, Mark as Finished
                </button>
                <button
                  onClick={() => handleMarkAsFinished(false)}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Not Yet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Polish Appearance Settings Drawer */}
      {showSettingsDrawer && (
        <div className="absolute bottom-4 right-4 sm:right-6 z-40 w-80 rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-serif text-sm font-bold text-gray-900">Appearance & Controls</h3>
            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-4 text-xs">
            {/* Reading Mode Toggle */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Reading Layout Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleFlowModeChange("scrolled")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border-2 p-2.5 font-medium transition-all ${
                    settings.flowMode === "scrolled"
                      ? "border-[var(--color-primary-container)] bg-sky-50 text-[var(--color-primary-container)] font-bold shadow-xs"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ScrollText className="h-4 w-4" />
                  <span>Vertical Scroll</span>
                </button>

                <button
                  onClick={() => handleFlowModeChange("paginated")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border-2 p-2.5 font-medium transition-all ${
                    settings.flowMode === "paginated"
                      ? "border-[var(--color-primary-container)] bg-sky-50 text-[var(--color-primary-container)] font-bold shadow-xs"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Page Cards</span>
                </button>
              </div>
            </div>

            {/* Theme Picker */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Color Mode</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleThemeChange("light")}
                  className={`flex items-center justify-center gap-1 rounded-lg border-2 p-2 font-medium transition-all ${
                    settings.theme === "light"
                      ? "border-[var(--color-primary-container)] bg-[#FAF9F6] text-black font-bold shadow-xs"
                      : "border-gray-200 bg-[#FAF9F6] text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>Paper</span>
                </button>

                <button
                  onClick={() => handleThemeChange("sepia")}
                  className={`flex items-center justify-center gap-1 rounded-lg border-2 p-2 font-medium transition-all ${
                    settings.theme === "sepia"
                      ? "border-[var(--color-primary-container)] bg-[#F4ECD8] text-[#5B4636] font-bold shadow-xs"
                      : "border-gray-200 bg-[#F4ECD8] text-[#5B4636] hover:border-gray-300"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Sepia</span>
                </button>

                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`flex items-center justify-center gap-1 rounded-lg border-2 p-2 font-medium transition-all ${
                    settings.theme === "dark"
                      ? "border-sky-400 bg-[#121212] text-white font-bold shadow-xs"
                      : "border-gray-700 bg-[#121212] text-gray-300 hover:border-gray-600"
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span>Night</span>
                </button>
              </div>
            </div>

            {/* Font Family Picker */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Typography</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleFontFamilyChange("serif")}
                  className={`rounded-lg border-2 p-2 text-center font-serif transition-all ${
                    settings.fontFamily === "serif"
                      ? "border-[var(--color-primary-container)] bg-gray-100 font-bold text-gray-900"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Serif
                </button>

                <button
                  onClick={() => handleFontFamilyChange("sans")}
                  className={`rounded-lg border-2 p-2 text-center font-sans transition-all ${
                    settings.fontFamily === "sans"
                      ? "border-[var(--color-primary-container)] bg-gray-100 font-bold text-gray-900"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Sans
                </button>

                <button
                  onClick={() => handleFontFamilyChange("mono")}
                  className={`rounded-lg border-2 p-2 text-center font-mono transition-all ${
                    settings.fontFamily === "mono"
                      ? "border-[var(--color-primary-container)] bg-gray-100 font-bold text-gray-900"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Mono
                </button>
              </div>
            </div>

            {/* Font Size Scaling Controls with Bounded Range (14px - 24px) */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Text Size (14px - 24px)</label>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-2 bg-gray-50">
                <button
                  onClick={() => handleFontSizeChange(-1)}
                  disabled={settings.fontSize <= 14}
                  className="flex items-center justify-center h-8 w-12 rounded-md bg-white font-bold text-gray-800 shadow-xs hover:bg-gray-100 disabled:opacity-30"
                >
                  <Type className="h-3 w-3" />
                  <span className="text-[10px] ml-0.5">-</span>
                </button>

                <span className="font-mono text-xs font-bold text-gray-800">
                  {settings.fontSize}px
                </span>

                <button
                  onClick={() => handleFontSizeChange(1)}
                  disabled={settings.fontSize >= 24}
                  className="flex items-center justify-center h-8 w-12 rounded-md bg-white font-bold text-gray-800 shadow-xs hover:bg-gray-100 disabled:opacity-30"
                >
                  <Type className="h-4 w-4" />
                  <span className="text-[10px] ml-0.5">+</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table of Contents Modal */}
      {showTocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md max-h-[80vh] flex flex-col rounded-xl bg-white text-gray-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-serif text-base font-bold">Table of Contents</h3>
              <button
                onClick={() => setShowTocModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-1">
              {toc.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (renditionRef.current && item.href) {
                      renditionRef.current.display(item.href);
                      setShowTocModal(false);
                    }
                  }}
                  className="w-full text-left rounded-md px-3 py-2 text-xs font-serif hover:bg-gray-100 transition-colors truncate"
                >
                  {item.label ? item.label.trim() : `Chapter ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
