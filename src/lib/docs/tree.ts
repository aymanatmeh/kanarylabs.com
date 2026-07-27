/**
 * Turns a flat list of markdown files into the structures the docs UI needs:
 * page records, a grouped sidebar, and a flattened order for prev/next links.
 *
 * Conventions (mirrors the source repos):
 *   - `title` and `weight` come from YAML frontmatter; lower weights sort first.
 *   - `_index.md` describes its directory (a group) and never appears in a URL.
 *   - `navigation: false` hides a page from the sidebar but still builds it.
 */
import matter from "gray-matter";
import type { RawDoc } from "./source";

export interface DocPage {
  /** URL path relative to the package root, e.g. "basic-usage/recording". */
  slug: string;
  title: string;
  weight: number;
  /** Hidden from the sidebar, but still rendered and routable. */
  hidden: boolean;
  /** Directory this page belongs to ("" for top-level pages). */
  group: string;
  /** Source path relative to the docs dir, used to resolve relative links. */
  sourcePath: string;
  body: string;
  data: Record<string, unknown>;
}

export interface DocGroup {
  /** Directory name, e.g. "basic-usage". */
  id: string;
  title: string;
  weight: number;
  pages: DocPage[];
}

export interface DocTree {
  /** Package metadata from the root `_index.md`. */
  meta: { title?: string; slogan?: string; category?: string };
  /** Top-level pages (introduction, installation, …). */
  rootPages: DocPage[];
  groups: DocGroup[];
  /** All pages, including hidden ones, keyed by slug. */
  bySlug: Map<string, DocPage>;
  /** Sidebar order, used for prev/next. Excludes hidden pages. */
  ordered: DocPage[];
}

const INDEX_FILE = "_index.md";

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function titleFromFilename(name: string): string {
  const base = name.replace(/\.md$/, "").split("/").pop() ?? name;
  return base.replace(/[-_]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Sort by weight, then title, so ordering is stable and predictable. */
function byWeightThenTitle<T extends { weight: number; title: string }>(a: T, b: T): number {
  return a.weight - b.weight || a.title.localeCompare(b.title);
}

export function buildDocTree(docs: RawDoc[]): DocTree {
  const rootPages: DocPage[] = [];
  const groupMap = new Map<string, DocGroup>();
  let meta: DocTree["meta"] = {};

  for (const doc of docs) {
    const parsed = matter(doc.content);
    const data = parsed.data as Record<string, unknown>;
    const segments = doc.path.split("/");
    const filename = segments.pop() as string;
    const dir = segments.join("/");
    const isIndex = filename === INDEX_FILE;

    // Root `_index.md` carries package metadata, not a page.
    if (isIndex && dir === "") {
      meta = {
        title: typeof data.title === "string" ? data.title : undefined,
        slogan: typeof data.slogan === "string" ? data.slogan : undefined,
        category: typeof data.category === "string" ? data.category : undefined,
      };
      continue;
    }

    // A directory's `_index.md` defines the group heading, not a page.
    if (isIndex) {
      const existing = groupMap.get(dir);
      const group: DocGroup = {
        id: dir,
        title: typeof data.title === "string" ? data.title : titleFromFilename(dir),
        weight: toNumber(data.weight, 100),
        pages: existing?.pages ?? [],
      };
      groupMap.set(dir, group);
      continue;
    }

    const slug = doc.path.replace(/\.md$/, "");
    const page: DocPage = {
      slug,
      title: typeof data.title === "string" ? data.title : titleFromFilename(filename),
      weight: toNumber(data.weight, 100),
      hidden: data.navigation === false,
      group: dir,
      sourcePath: doc.path,
      body: parsed.content,
      data,
    };

    if (dir === "") {
      rootPages.push(page);
    } else {
      const group =
        groupMap.get(dir) ??
        ({ id: dir, title: titleFromFilename(dir), weight: 100, pages: [] } as DocGroup);
      group.pages.push(page);
      groupMap.set(dir, group);
    }
  }

  rootPages.sort(byWeightThenTitle);
  const groups = [...groupMap.values()].sort(byWeightThenTitle);
  for (const group of groups) group.pages.sort(byWeightThenTitle);

  const bySlug = new Map<string, DocPage>();
  for (const page of [...rootPages, ...groups.flatMap((g) => g.pages)]) {
    bySlug.set(page.slug, page);
  }

  const ordered = [
    ...rootPages.filter((p) => !p.hidden),
    ...groups.flatMap((g) => g.pages.filter((p) => !p.hidden)),
  ];

  return { meta, rootPages, groups, bySlug, ordered };
}
