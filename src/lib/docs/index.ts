/**
 * Build-time entry point for the docs system.
 *
 * `loadPackageDocs()` resolves a package's markdown, builds its navigation,
 * and renders every page. Results are memoised per build so the landing page,
 * the package index, and each article don't re-fetch or re-render.
 */
import { packages, type PackageEntry } from "../../config/packages";
import { loadRawDocs } from "./source";
import { buildDocTree, type DocPage, type DocTree } from "./tree";
import { renderDoc, type Heading } from "./render";

export type { DocPage, DocGroup, DocTree } from "./tree";
export type { Heading } from "./render";

export interface RenderedPage {
  page: DocPage;
  html: string;
  headings: Heading[];
  prev?: { slug: string; title: string };
  next?: { slug: string; title: string };
}

export interface PackageDocs {
  pkg: PackageEntry;
  ref: string;
  versionLabel: string;
  tree: DocTree;
  baseUrl: string;
  rendered: Map<string, RenderedPage>;
}

const cache = new Map<string, Promise<PackageDocs>>();

function docsBaseUrl(slug: string): string {
  return `/docs/${slug}`;
}

async function build(pkg: PackageEntry, ref: string, versionLabel: string): Promise<PackageDocs> {
  const raw = await loadRawDocs(pkg, ref);
  const tree = buildDocTree(raw);
  const baseUrl = docsBaseUrl(pkg.slug);

  const knownSlugs = new Set(tree.bySlug.keys());
  const groupEntry = new Map<string, string>();
  for (const group of tree.groups) {
    const first = group.pages.find((p) => !p.hidden) ?? group.pages[0];
    if (first) groupEntry.set(group.id, first.slug);
  }

  const rendered = new Map<string, RenderedPage>();
  const allBroken: string[] = [];

  for (const page of tree.bySlug.values()) {
    const result = await renderDoc({
      page,
      baseUrl,
      knownSlugs,
      groupEntry,
      repo: pkg.repo,
      ref,
      docsDir: pkg.docsDir,
    });

    if (result.brokenLinks.length > 0) {
      allBroken.push(...result.brokenLinks.map((l) => `${page.sourcePath} → ${l}`));
    }

    const index = tree.ordered.findIndex((p) => p.slug === page.slug);
    const prev = index > 0 ? tree.ordered[index - 1] : undefined;
    const next = index >= 0 && index < tree.ordered.length - 1 ? tree.ordered[index + 1] : undefined;

    rendered.set(page.slug, {
      page,
      html: result.html,
      headings: result.headings,
      prev: prev && { slug: prev.slug, title: prev.title },
      next: next && { slug: next.slug, title: next.title },
    });
  }

  if (allBroken.length > 0) {
    const message =
      `Broken internal documentation links in "${pkg.name}":\n` +
      allBroken.map((l) => `  - ${l}`).join("\n");
    // Broken links fail the production build, but shouldn't block dev.
    if (import.meta.env?.PROD) throw new Error(message);
    console.warn(`\n[docs] ${message}\n`);
  }

  return { pkg, ref, versionLabel, tree, baseUrl, rendered };
}

export function loadPackageDocs(pkg: PackageEntry, ref?: string): Promise<PackageDocs> {
  const version = ref
    ? (pkg.versions.find((v) => v.ref === ref) ?? pkg.versions[0])
    : pkg.versions[0];
  if (!version) {
    throw new Error(`Package "${pkg.slug}" has no versions configured in src/config/packages.ts.`);
  }

  const key = `${pkg.slug}@${version.ref}`;
  let entry = cache.get(key);
  if (!entry) {
    entry = build(pkg, version.ref, version.label);
    cache.set(key, entry);
  }
  return entry;
}

/** Every package's docs, for the /docs landing page. */
export function loadAllPackageDocs(): Promise<PackageDocs[]> {
  return Promise.all(packages.map((pkg) => loadPackageDocs(pkg)));
}
