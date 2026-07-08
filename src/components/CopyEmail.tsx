import { useState } from "react";

export default function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(email);
      ok = true;
    } catch {
      // Fallback for insecure contexts / older browsers.
      try {
        const ta = document.createElement("textarea");
        ta.value = email;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Email copied" : `Copy email ${email}`}
      className={`inline-flex min-w-56 items-center justify-center gap-x-2 rounded-full py-2 pr-3 pl-3.5 font-mono text-sm inset-ring hover:bg-neutral-950/5 dark:hover:bg-white/5 ${
        copied
          ? "text-green-600 inset-ring-green-600/30 dark:text-green-400 dark:inset-ring-green-400/30"
          : "text-neutral-700 inset-ring-neutral-950/15 dark:text-neutral-200 dark:inset-ring-white/15"
      }`}
    >
      {copied ? (
        <>
          <span>Copied!</span>
          <svg viewBox="0 0 20 20" fill="none" strokeWidth={2} className="size-4 stroke-current">
            <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </>
      ) : (
        <>
          <span>{email}</span>
          <svg viewBox="0 0 20 20" fill="none" strokeWidth={1.75} className="size-4 stroke-current opacity-60">
            <rect x="7" y="7" width="9" height="9" rx="2" />
            <path d="M4 13V5a2 2 0 012-2h7" strokeLinecap="round" />
          </svg>
        </>
      )}
    </button>
  );
}
