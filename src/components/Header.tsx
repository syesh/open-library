"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Search, BookmarkCheck, User, X, Sparkles, LogOut, CheckCircle2 } from "lucide-react";
import { getCurrentUser, signInWithEmail, signOutUser } from "@/lib/storage";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [debouncedValue, setDebouncedValue] = useState(searchTerm);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [inputEmail, setInputEmail] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    getCurrentUser().then((usr) => {
      setUserEmail(usr?.email || null);
    });
  }, []);

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

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;
    setAuthLoading(true);
    setAuthMessage(null);

    const res = await signInWithEmail(inputEmail);
    setAuthLoading(false);
    setAuthMessage(res.message);

    if (res.success) {
      const usr = await getCurrentUser();
      setUserEmail(usr?.email || inputEmail.trim());
      setTimeout(() => {
        setShowAuthModal(false);
        setAuthMessage(null);
        setInputEmail("");
        window.location.reload();
      }, 600);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUserEmail(null);
    setShowAuthModal(false);
    window.location.reload();
  };

  return (
    <>
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

            {/* User Profile / Sign In Button */}
            {userEmail ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 rounded-md bg-sky-50 border border-sky-200 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-scholarly)] hover:bg-sky-100 transition-all truncate max-w-[140px] sm:max-w-none"
                title={`Signed in as ${userEmail}`}
              >
                <User className="h-3.5 w-3.5 text-sky-600" />
                <span className="truncate">{userEmail.split("@")[0]}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 rounded-md bg-[var(--color-primary-scholarly)] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0c233c] transition-all"
              >
                <User className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Auth Modal using React Portal directly onto document.body */}
      {showAuthModal &&
        mounted &&
        createPortal(
          <div
            onClick={() => setShowAuthModal(false)}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 text-left my-auto text-gray-900"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
                title="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-[var(--color-primary-scholarly)]">
                <Sparkles className="h-6 w-6 text-sky-600" />
              </div>

              {userEmail ? (
                <div className="text-center">
                  <h3 className="text-lg font-bold font-serif text-gray-900">Signed In</h3>
                  <p className="mt-1 text-xs text-gray-600">
                    Your reading progress & library are active for:
                  </p>
                  <p className="mt-2 text-sm font-semibold font-mono text-[var(--color-primary-scholarly)] bg-sky-50 py-1.5 px-3 rounded-lg border border-sky-200 inline-block">
                    {userEmail}
                  </p>

                  <button
                    onClick={handleSignOut}
                    className="mt-6 flex items-center justify-center gap-2 w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out Account</span>
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-bold font-serif text-gray-900 text-center">
                    Sign In to Open Read
                  </h3>
                  <p className="mt-1 text-xs text-gray-600 text-center leading-relaxed">
                    Enter your email to enable reading progress tracking and cloud sync across your devices.
                  </p>

                  <form onSubmit={handleSignInSubmit} className="mt-5 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                        placeholder="reader@example.com"
                        className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-900 focus:border-[var(--color-primary-container)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-container)]"
                      />
                    </div>

                    {authMessage && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 p-2.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>{authMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full rounded-xl bg-[var(--color-primary-scholarly)] py-2.5 text-xs font-bold text-white hover:bg-[#0c233c] transition-colors shadow-xs disabled:opacity-50"
                    >
                      {authLoading ? "Signing In..." : "Continue with Email"}
                    </button>
                  </form>

                  <div className="mt-4 rounded-xl bg-amber-50 p-3 border border-amber-200 text-left">
                    <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
                      💡 <strong>Guest Mode Active:</strong> You can browse catalog and save favorites without signing in!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
