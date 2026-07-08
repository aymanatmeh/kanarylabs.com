import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

/** Resolve + apply a theme to <html>: toggles `.dark` and `color-scheme`. */
function apply(theme: Theme) {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && systemDark);
  const el = document.documentElement;
  el.classList.toggle("dark", dark);
  el.style.colorScheme = dark ? "dark" : "light";
}

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  // Sync with the value the no-flash script already applied, and keep
  // "system" live when the OS preference changes.
  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme | null) ?? "system";
    setTheme(stored);
    setMounted(true);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const current = (localStorage.getItem("theme") as Theme | null) ?? "system";
      if (current === "system") apply("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const choose = (value: Theme) => {
    setTheme(value);
    localStorage.setItem("theme", value);
    apply(value);
  };

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex items-center gap-x-0.5 rounded-full bg-neutral-950/5 p-1 dark:bg-white/10"
    >
      {OPTIONS.map((opt) => {
        const active = mounted && theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => choose(opt.value)}
            aria-label={opt.label}
            aria-pressed={active}
            className={`flex size-7 items-center justify-center rounded-full ${
              active
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white dark:shadow-none"
                : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            {opt.value === "light" && (
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} className="size-4 stroke-current">
                <circle cx="12" cy="12" r="4" />
                <path
                  d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4l1.4-1.4M18 6l1.4-1.4"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {opt.value === "dark" && (
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} className="size-4 stroke-current">
                <path d="M20 13.5A7.5 7.5 0 1110.5 4 6 6 0 0020 13.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {opt.value === "system" && (
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} className="size-4 stroke-current">
                <rect x="3" y="4.5" width="18" height="12" rx="2" />
                <path d="M9 20.5h6M12 16.5v4" strokeLinecap="round" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
