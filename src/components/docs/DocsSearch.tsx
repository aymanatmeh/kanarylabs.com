import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Result {
  url: string;
  title: string;
  excerpt: string;
  pkg?: string;
  section?: string;
}

/** Pagefind is generated at build time, so it only exists in a built site. */
async function loadPagefind(): Promise<any | null> {
  try {
    // Vite must not try to resolve this at build time.
    return await import(/* @vite-ignore */ `${import.meta.env.BASE_URL}pagefind/pagefind.js`);
  } catch {
    return null;
  }
}

export default function DocsSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [ready, setReady] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pagefind = useRef<any>(null);
  const input = useRef<HTMLInputElement>(null);

  // The dialog is portalled to <body>; `document` only exists after mount.
  useEffect(() => setMounted(true), []);

  // Open with ⌘K / Ctrl+K, close with Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      if (!pagefind.current) {
        pagefind.current = await loadPagefind();
        if (!pagefind.current) {
          setReady(false);
          return;
        }
      }
      const search = await pagefind.current.search(query);
      const data = await Promise.all(search.results.slice(0, 8).map((r: any) => r.data()));
      if (cancelled) return;
      setResults(
        data.map((d: any) => ({
          url: d.url.replace(/index\.html$/, ""),
          title: d.meta?.title ?? "Untitled",
          excerpt: d.excerpt ?? "",
          pkg: d.meta?.package,
          section: d.meta?.section,
        })),
      );
    };

    const timer = setTimeout(run, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-x-2 rounded-lg bg-neutral-950/5 px-3 py-2 text-base text-neutral-500 hover:bg-neutral-950/10 sm:text-sm dark:bg-white/10 dark:text-neutral-400 dark:hover:bg-white/15"
      >
        <svg viewBox="0 0 20 20" fill="none" strokeWidth={1.75} className="size-4 stroke-current">
          <circle cx="9" cy="9" r="6" />
          <path d="M13.5 13.5L17 17" strokeLinecap="round" />
        </svg>
        Search docs
        <kbd className="ml-auto font-mono text-xs max-sm:hidden">⌘K</kbd>
      </button>

      {/* Portalled to <body>: the sidebar is `sticky`, which creates a stacking
          context that would trap the dialog beneath the article's content. */}
      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-999 flex items-start justify-center p-4 pt-[10vh]">
          <div
            className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search documentation"
            className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl inset-ring inset-ring-neutral-950/10 dark:bg-neutral-900 dark:shadow-none dark:inset-ring-white/10"
          >
            <div className="flex items-center gap-x-3 border-b border-neutral-950/5 px-4 dark:border-white/10">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                strokeWidth={1.75}
                className="size-5 shrink-0 stroke-neutral-400"
              >
                <circle cx="9" cy="9" r="6" />
                <path d="M13.5 13.5L17 17" strokeLinecap="round" />
              </svg>
              <input
                ref={input}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documentation…"
                className="w-full bg-transparent py-4 text-base text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white"
              />
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {!ready && (
                <p className="px-4 py-6 text-base text-neutral-500 dark:text-neutral-400">
                  Search is available in the built site — run <code>npm run build</code>.
                </p>
              )}

              {ready && query && results.length === 0 && (
                <p className="px-4 py-6 text-base text-neutral-500 dark:text-neutral-400">
                  No results for “{query}”.
                </p>
              )}

              <ul role="list">
                {results.map((r) => (
                  <li key={r.url}>
                    <a
                      href={r.url}
                      className="flex flex-col gap-y-1 border-b border-neutral-950/5 px-4 py-3 hover:bg-neutral-950/5 dark:border-white/5 dark:hover:bg-white/5"
                    >
                      <span className="flex items-center gap-x-2 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                        {r.pkg}
                        {r.section && <span>› {r.section}</span>}
                      </span>
                      <span className="text-base font-semibold text-neutral-900 dark:text-white">
                        {r.title}
                      </span>
                      <span
                        className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400"
                        dangerouslySetInnerHTML={{ __html: r.excerpt }}
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
