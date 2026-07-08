interface LogoProps {
  /** Height utility for the mark, e.g. "size-7". Wordmark scales with text size. */
  className?: string;
  showWordmark?: boolean;
}

/**
 * KanaryLabs mark — a minimal geometric canary (crest + head + beak).
 * Single-accent silhouette so it reads cleanly in light and dark mode;
 * the eye is a cutout matching the page background.
 */
export function KanaryMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      {/* crest — pokes above the head */}
      <path d="M8.5 10.5 L11.4 2.6 L15.2 9.8 Z" className="fill-canary-400" />
      {/* beak — points right, base tucked under the head */}
      <path d="M19.5 14.6 L30.5 18.4 L19.5 22.2 Z" className="fill-canary-500" />
      {/* head / body */}
      <circle cx="13.4" cy="18" r="9" className="fill-canary-400" />
      {/* eye — cut to the page background */}
      <circle cx="16.2" cy="15.4" r="1.55" className="fill-white dark:fill-neutral-950" />
    </svg>
  );
}

export function Logo({ className = "size-7", showWordmark = true }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-x-2.5">
      <KanaryMark className={className} />
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
          Kanary<span className="text-canary-600 dark:text-canary-400">Labs</span>
        </span>
      )}
    </span>
  );
}

export default Logo;
