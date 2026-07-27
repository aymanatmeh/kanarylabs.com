import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import ThemeToggle from "./ThemeToggle";

interface NavLink {
  href: string;
  label: string;
  children?: { href: string; label: string; description: string }[];
}

const LINKS: NavLink[] = [
  { href: "/services", label: "Services" },
  {
    href: "/#open-source",
    label: "Open source",
    children: [
      {
        href: "/#open-source",
        label: "Packages",
        description: "What we build and maintain in the open.",
      },
      {
        href: "/docs",
        label: "Documentation",
        description: "Guides and reference for every package.",
      },
    ],
  },
  { href: "/#ventures", label: "Ventures" },
  { href: "/#contact", label: "Contact" },
];

function Dropdown({ link }: { link: NavLink }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-x-1 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
      >
        {link.label}
        <svg
          viewBox="0 0 16 16"
          fill="none"
          strokeWidth={1.75}
          aria-hidden="true"
          className={`size-3.5 stroke-current ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-1/2 z-50 mt-3 w-72 -translate-x-1/2 rounded-2xl bg-white p-2 shadow-lg inset-ring inset-ring-neutral-950/5 dark:bg-neutral-900 dark:shadow-none dark:inset-ring-white/10">
          <ul role="list">
            {link.children!.map((child) => (
              <li key={child.href + child.label}>
                <a
                  href={child.href}
                  onClick={() => setOpen(false)}
                  className="flex flex-col gap-y-0.5 rounded-xl p-3 hover:bg-neutral-950/5 dark:hover:bg-white/5"
                >
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {child.label}
                  </span>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {child.description}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

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
                <li key={link.label}>
                  {link.children ? (
                    <Dropdown link={link} />
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <a
              href="/#contact"
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
            <span
              className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
              aria-hidden="true"
            />
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
              <li key={link.label}>
                {link.children ? (
                  <>
                    <p className="px-3 pt-3 pb-1 text-sm font-semibold text-neutral-900 dark:text-white">
                      {link.label}
                    </p>
                    <ul role="list">
                      {link.children.map((child) => (
                        <li key={child.href + child.label}>
                          <a
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className="block rounded-lg px-3 py-2.5 pl-6 text-base font-medium text-neutral-700 hover:bg-neutral-950/5 dark:text-neutral-200 dark:hover:bg-white/5"
                          >
                            {child.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-base font-medium text-neutral-700 hover:bg-neutral-950/5 dark:text-neutral-200 dark:hover:bg-white/5"
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
