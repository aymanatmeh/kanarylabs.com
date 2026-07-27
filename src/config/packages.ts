/**
 * Kanary Labs open-source package registry.
 *
 * Adding a package to the docs site = adding one entry here. Everything else
 * (routes, navigation, search index, landing page) is derived at build time.
 *
 * Docs are read from each package's own repository — never copied into this
 * repo. See `src/lib/docs/source.ts` for how sources are resolved.
 */

export interface PackageVersion {
  /** Label shown in the version selector. */
  label: string;
  /** Git ref (branch or tag) the docs are read from. */
  ref: string;
}

export interface PackageEntry {
  /** Display name. */
  name: string;
  /** URL segment: /docs/<slug> */
  slug: string;
  /** One-line summary for the /docs landing page. */
  description: string;
  /** Grouping label on the landing page. */
  category: string;
  /** owner/repo on GitHub. */
  repo: string;
  /** Directory in the repo holding the markdown docs. */
  docsDir: string;
  /**
   * Versions offered in the selector. The first entry is the default.
   * Today this is just the default branch; Git tags can be appended later
   * without touching anything else.
   */
  versions: PackageVersion[];
  /**
   * Optional absolute path to a local checkout. When present (and the
   * directory exists) it is preferred over fetching from GitHub, so docs can
   * be previewed while they are still being written. Ignored in CI.
   */
  localPath?: string;
}

export const packages: PackageEntry[] = [
  {
    name: "Laravel AI Observatory",
    slug: "laravel-ai-observatory",
    description:
      "Local observability and debugging for the Laravel AI SDK — record, inspect, and understand every AI operation your app performs.",
    category: "Laravel",
    repo: "Kanary-Labs/laravel-ai-observer",
    docsDir: "docs",
    versions: [{ label: "Latest", ref: "main" }],
    localPath:
      "/Users/ayman/conductor/workspaces/laravel-ai-observer/montpellier-v1",
  },
];

export function findPackage(slug: string): PackageEntry | undefined {
  return packages.find((p) => p.slug === slug);
}
