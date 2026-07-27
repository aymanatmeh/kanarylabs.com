import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import DocsSearch from "./DocsSearch";

export interface NavLink {
  slug: string;
  title: string;
  href: string;
}

export interface NavGroup {
  id: string;
  title: string;
  links: NavLink[];
}

interface Props {
  packageName: string;
  packageHref: string;
  rootLinks: NavLink[];
  groups: NavGroup[];
  currentSlug: string;
  versions: { label: string; ref: string }[];
  versionLabel: string;
}

function NavItem({ link, current }: { link: NavLink; current: boolean }) {
  return (
    <li>
      <a
        href={link.href}
        aria-current={current ? "page" : undefined}
        className={`-ml-px flex border-l py-1.5 pl-4 text-base sm:text-sm ${
          current
            ? "border-canary-500 text-neutral-900 dark:text-white"
            : "border-transparent text-neutral-600 hover:border-neutral-950/20 hover:text-neutral-900 dark:text-neutral-400 dark:hover:border-white/20 dark:hover:text-white"
        }`}
      >
        {link.title}
      </a>
    </li>
  );
}

export default function DocsSidebar({
  packageName,
  packageHref,
  rootLinks,
  groups,
  currentSlug,
  versions,
  versionLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // The drawer is portalled to <body>; `document` only exists after mount.
  useEffect(() => setMounted(true), []);

  // Close the drawer on Escape, and lock scroll while it's open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const nav = (
    <nav aria-label="Documentation" className="flex flex-col gap-y-8">
      <div>
        <a
          href={packageHref}
          className="text-base font-semibold text-neutral-900 dark:text-white"
        >
          {packageName}
        </a>
        <div className="mt-3 flex items-center gap-x-2">
          <label htmlFor="docs-version" className="sr-only">
            Version
          </label>
          <select
            id="docs-version"
            defaultValue={versionLabel}
            disabled={versions.length < 2}
            className="rounded-lg bg-neutral-950/5 px-2 py-1 text-sm text-neutral-700 disabled:opacity-70 dark:bg-white/10 dark:text-neutral-300"
          >
            {versions.map((v) => (
              <option key={v.ref} value={v.label}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DocsSearch />

      {rootLinks.length > 0 && (
        <ul role="list" className="border-l border-neutral-950/10 dark:border-white/10">
          {rootLinks.map((link) => (
            <NavItem key={link.slug} link={link} current={link.slug === currentSlug} />
          ))}
        </ul>
      )}

      {groups.map((group) => (
        <div key={group.id}>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{group.title}</h3>
          <ul role="list" className="mt-3 border-l border-neutral-950/10 dark:border-white/10">
            {group.links.map((link) => (
              <NavItem key={link.slug} link={link} current={link.slug === currentSlug} />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile: a button that opens the nav in a drawer. */}
      <div className="sticky top-16 z-30 -mx-6 border-b border-neutral-950/5 bg-white/90 px-6 py-3 backdrop-blur-md lg:hidden dark:border-white/10 dark:bg-neutral-950/90">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-x-2 text-base font-medium text-neutral-700 dark:text-neutral-300"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} className="size-5 stroke-current">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
          Documentation menu
        </button>
      </div>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-999 lg:hidden">
          <div
            className="absolute inset-0 bg-neutral-950/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-white p-6 dark:bg-neutral-950">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="relative -mr-2 rounded-md p-2 text-neutral-700 dark:text-neutral-300"
              >
                <span
                  className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
                  aria-hidden="true"
                />
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth={1.75}
                  className="size-6 stroke-current"
                >
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="mt-2">{nav}</div>
          </div>
        </div>,
          document.body,
        )}

      <div className="max-lg:hidden">{nav}</div>
    </>
  );
}
