import { useState } from "react";
import { Logo } from "./Logo";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { href: "#build", label: "What we build" },
  { href: "#ventures", label: "Ventures" },
  { href: "#contact", label: "Contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-950/5 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-neutral-950/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-x-6 px-6 py-4 lg:px-8">
        <a href="/" aria-label="Homepage" className="shrink-0">
          <Logo className="size-7" />
        </a>

        <div className="flex items-center gap-x-3">
          <div className="flex items-center gap-x-8 max-lg:hidden">
            <ul role="list" className="flex items-center gap-x-8">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="#contact"
              className="rounded-full px-3.5 py-2 text-sm font-medium text-neutral-900 inset-ring inset-ring-neutral-950/15 hover:bg-neutral-950/5 dark:text-white dark:inset-ring-white/15 dark:hover:bg-white/5"
            >
              Get in touch
            </a>
          </div>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="relative -mr-2 rounded-md p-2 text-neutral-700 hover:bg-neutral-950/5 lg:hidden dark:text-neutral-300 dark:hover:bg-white/5"
          >
            <span className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden" aria-hidden="true" />
            {open ? (
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} className="size-6 stroke-current">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} className="size-6 stroke-current">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-neutral-950/5 lg:hidden dark:border-white/10">
          <ul role="list" className="mx-auto flex max-w-6xl flex-col gap-y-1 px-6 py-4">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-base font-medium text-neutral-700 hover:bg-neutral-950/5 dark:text-neutral-200 dark:hover:bg-white/5"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
