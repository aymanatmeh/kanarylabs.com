/**
 * Resolves raw markdown for a package's docs at build time.
 *
 * Order of preference:
 *   1. A local checkout (`localPath` in the registry) — only outside CI, so
 *      docs can be previewed while they're still being written.
 *   2. The package's GitHub repository at the requested ref.
 *
 * GitHub responses are cached on disk so repeated dev builds don't re-fetch.
 * Any failure to resolve a configured source throws with a clear message —
 * a docs page silently disappearing is worse than a failed build.
 */
import fs from "node:fs";
import path from "node:path";
import type { PackageEntry } from "../../config/packages";

export interface RawDoc {
  /** Path relative to the package's docs dir, e.g. "basic-usage/_index.md". */
  path: string;
  content: string;
}

const CACHE_DIR = path.resolve(".docs-cache");
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

const isCI = process.env.CI === "true" || process.env.CI === "1";
/** Set DOCS_SOURCE=remote to force GitHub even when a local checkout exists. */
const forceRemote = process.env.DOCS_SOURCE === "remote";

/** GitHub rate-limits bursts, so downloads are throttled and retried. */
const MAX_CONCURRENCY = 6;
const MAX_RETRIES = 4;
const RETRY_BASE_MS = 300;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Like Promise.all(items.map(fn)) but with at most `limit` in flight. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]!);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

class DocsSourceError extends Error {
  constructor(pkg: PackageEntry, ref: string, detail: string) {
    super(
      `Could not load documentation for "${pkg.name}" (${pkg.repo}@${ref}).\n` +
        `  ${detail}\n` +
        `  Checked: ${pkg.repo}/${pkg.docsDir} at ref "${ref}".\n` +
        `  Fix the registry entry in src/config/packages.ts, or ensure the ref and docs directory exist.`,
    );
    this.name = "DocsSourceError";
  }
}

function readLocalDocs(dir: string): RawDoc[] {
  const docs: RawDoc[] = [];
  const walk = (current: string, prefix: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(abs, rel);
      else if (entry.name.endsWith(".md"))
        docs.push({ path: rel, content: fs.readFileSync(abs, "utf8") });
    }
  };
  walk(dir, "");
  return docs;
}

function cacheFile(pkg: PackageEntry, ref: string): string {
  return path.join(CACHE_DIR, `${pkg.slug}@${ref.replace(/\//g, "-")}.json`);
}

function readCache(pkg: PackageEntry, ref: string): RawDoc[] | null {
  const file = cacheFile(pkg, ref);
  try {
    const stat = fs.statSync(file);
    if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) return null;
    return JSON.parse(fs.readFileSync(file, "utf8")) as RawDoc[];
  } catch {
    return null;
  }
}

function writeCache(pkg: PackageEntry, ref: string, docs: RawDoc[]): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile(pkg, ref), JSON.stringify(docs), "utf8");
  } catch {
    /* cache is best-effort */
  }
}

async function fetchRemoteDocs(pkg: PackageEntry, ref: string): Promise<RawDoc[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "kanarylabs-docs-build",
  };
  // Optional: lifts rate limits and allows private repos.
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const treeUrl = `https://api.github.com/repos/${pkg.repo}/git/trees/${ref}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers });
  if (!treeRes.ok) {
    throw new DocsSourceError(
      pkg,
      ref,
      `GitHub tree request failed: ${treeRes.status} ${treeRes.statusText}.`,
    );
  }

  const tree = (await treeRes.json()) as {
    tree?: { path: string; type: string }[];
    truncated?: boolean;
  };
  if (tree.truncated) {
    throw new DocsSourceError(pkg, ref, "GitHub tree response was truncated (repo too large).");
  }

  const prefix = `${pkg.docsDir.replace(/\/$/, "")}/`;
  const files = (tree.tree ?? []).filter(
    (n) => n.type === "blob" && n.path.startsWith(prefix) && n.path.endsWith(".md"),
  );
  if (files.length === 0) {
    throw new DocsSourceError(pkg, ref, `No markdown files found under "${pkg.docsDir}".`);
  }

  const download = async (path: string): Promise<RawDoc> => {
    const rawUrl = `https://raw.githubusercontent.com/${pkg.repo}/${ref}/${path}`;
    let lastStatus = "";

    // raw.githubusercontent.com throttles bursts (429 / 503 Backend.max_conn),
    // so transient failures are retried with backoff before giving up.
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      let res: Response;
      try {
        res = await fetch(rawUrl, { headers: { "User-Agent": "kanarylabs-docs-build" } });
      } catch (err) {
        lastStatus = err instanceof Error ? err.message : String(err);
        await sleep(RETRY_BASE_MS * 2 ** attempt);
        continue;
      }

      if (res.ok) return { path: path.slice(prefix.length), content: await res.text() };

      lastStatus = `${res.status} ${res.statusText}`;
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable) break;
      await sleep(RETRY_BASE_MS * 2 ** attempt);
    }

    throw new DocsSourceError(pkg, ref, `Failed to download ${path}: ${lastStatus}.`);
  };

  return mapWithConcurrency(
    files.map((f) => f.path),
    MAX_CONCURRENCY,
    download,
  );
}

/** Returns every markdown file for a package at a given ref. */
export async function loadRawDocs(pkg: PackageEntry, ref: string): Promise<RawDoc[]> {
  if (!forceRemote && !isCI && pkg.localPath) {
    const dir = path.join(pkg.localPath, pkg.docsDir);
    if (fs.existsSync(dir)) {
      const docs = readLocalDocs(dir);
      if (docs.length === 0) {
        throw new DocsSourceError(pkg, ref, `Local docs directory "${dir}" contains no markdown.`);
      }
      return docs;
    }
  }

  const cached = readCache(pkg, ref);
  if (cached) return cached;

  const docs = await fetchRemoteDocs(pkg, ref);
  writeCache(pkg, ref, docs);
  return docs;
}
