/**
 * Markdown → sanitized HTML for docs pages.
 *
 * Handles the things that matter when the source lives in another repo:
 *   - relative links/images resolve against the source document
 *   - links outside the docs dir fall back to the file on GitHub
 *   - internal links that point nowhere are reported so the build can fail
 */
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { toString as hastToString } from "hast-util-to-string";
import type { Element, Root } from "hast";
import type { DocPage } from "./tree";

export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

export interface RenderResult {
  html: string;
  headings: Heading[];
  /** Internal links that don't resolve to a known page. */
  brokenLinks: string[];
}

export interface RenderContext {
  /** Page being rendered (its path anchors relative links). */
  page: DocPage;
  /** URL prefix for this package's docs, e.g. "/docs/laravel-ai-observatory". */
  baseUrl: string;
  /** Every valid page slug in the package, for link validation. */
  knownSlugs: Set<string>;
  /** Maps a group directory to the slug of its first page. */
  groupEntry: Map<string, string>;
  /** owner/repo, for links that escape the docs directory. */
  repo: string;
  ref: string;
  docsDir: string;
}

/** Resolve "a/b/../c" style paths without touching the filesystem. */
function normalizePath(input: string): string {
  const out: string[] = [];
  for (const part of input.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
}

/** True when the href points somewhere other than this document set. */
function isExternal(href: string): boolean {
  return /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href) || href.startsWith("/");
}

function escapesDocsDir(from: string, href: string): boolean {
  const dir = from.includes("/") ? from.slice(0, from.lastIndexOf("/")) : "";
  const joined = (dir ? `${dir}/` : "") + href;
  let depth = 0;
  for (const part of joined.split("/")) {
    if (part === ".." ) depth--;
    else if (part && part !== ".") depth++;
    if (depth < 0) return true;
  }
  return false;
}

function githubBlobUrl(ctx: RenderContext, from: string, href: string): string {
  const dir = from.includes("/") ? from.slice(0, from.lastIndexOf("/")) : "";
  const full = normalizePath(`${ctx.docsDir}/${dir ? `${dir}/` : ""}${href}`);
  return `https://github.com/${ctx.repo}/blob/${ctx.ref}/${full}`;
}

function githubRawUrl(ctx: RenderContext, from: string, href: string): string {
  const dir = from.includes("/") ? from.slice(0, from.lastIndexOf("/")) : "";
  const full = normalizePath(`${ctx.docsDir}/${dir ? `${dir}/` : ""}${href}`);
  return `https://raw.githubusercontent.com/${ctx.repo}/${ctx.ref}/${full}`;
}

/** Rewrites relative links/images and collects ones that don't resolve. */
function rehypeDocLinks(ctx: RenderContext, broken: string[]) {
  const from = ctx.page.sourcePath;
  const dir = from.includes("/") ? from.slice(0, from.lastIndexOf("/")) : "";

  return () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "a") {
        const href = node.properties?.href;
        if (typeof href !== "string" || !href) return;

        if (href.startsWith("#")) return; // same-page anchor

        if (isExternal(href)) {
          if (/^https?:/i.test(href)) {
            node.properties!.target = "_blank";
            node.properties!.rel = "noopener noreferrer";
          }
          return;
        }

        const [pathPart, hash] = href.split("#");
        if (!pathPart) return;

        // Links to files outside the docs dir live on GitHub.
        if (escapesDocsDir(from, pathPart)) {
          node.properties!.href = githubBlobUrl(ctx, from, pathPart);
          node.properties!.target = "_blank";
          node.properties!.rel = "noopener noreferrer";
          return;
        }

        // Non-markdown assets also resolve to the repo.
        if (!pathPart.endsWith(".md")) {
          node.properties!.href = githubRawUrl(ctx, from, pathPart);
          return;
        }

        let slug = normalizePath(`${dir ? `${dir}/` : ""}${pathPart}`).replace(/\.md$/, "");
        // A link to a group's _index.md goes to that group's first page.
        if (slug.endsWith("/_index")) {
          const groupId = slug.slice(0, -"/_index".length);
          slug = ctx.groupEntry.get(groupId) ?? groupId;
        } else if (slug === "_index") {
          node.properties!.href = ctx.baseUrl;
          return;
        }

        if (!ctx.knownSlugs.has(slug)) {
          broken.push(href);
          return;
        }
        node.properties!.href = `${ctx.baseUrl}/${slug}${hash ? `#${hash}` : ""}`;
        return;
      }

      if (node.tagName === "img") {
        const src = node.properties?.src;
        if (typeof src !== "string" || !src || isExternal(src)) return;
        node.properties!.src = githubRawUrl(ctx, from, src);
        node.properties!.loading = "lazy";
      }
    });
  };
}

function rehypeCollectHeadings(headings: Heading[]) {
  return () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      const match = /^h([2-4])$/.exec(node.tagName);
      if (!match) return;
      const id = node.properties?.id;
      if (typeof id !== "string") return;
      headings.push({
        depth: Number(match[1]),
        slug: id,
        text: hastToString(node).replace(/^#\s*/, "").trim(),
      });
    });
  };
}

// Sanitize, but keep what the docs UI needs: language classes for
// highlighting, heading ids/anchors, and GFM table alignment.
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-./]],
    pre: [...(defaultSchema.attributes?.pre ?? []), "className"],
    span: [...(defaultSchema.attributes?.span ?? []), "className"],
    div: [...(defaultSchema.attributes?.div ?? []), "className"],
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel", "className", "ariaHidden", "tabIndex"],
    h1: [...(defaultSchema.attributes?.h1 ?? []), "id"],
    h2: [...(defaultSchema.attributes?.h2 ?? []), "id"],
    h3: [...(defaultSchema.attributes?.h3 ?? []), "id"],
    h4: [...(defaultSchema.attributes?.h4 ?? []), "id"],
    h5: [...(defaultSchema.attributes?.h5 ?? []), "id"],
    h6: [...(defaultSchema.attributes?.h6 ?? []), "id"],
    td: [...(defaultSchema.attributes?.td ?? []), "style"],
    th: [...(defaultSchema.attributes?.th ?? []), "style"],
  },
};

export async function renderDoc(ctx: RenderContext): Promise<RenderResult> {
  const headings: Heading[] = [];
  const brokenLinks: string[] = [];

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    // Sanitize before highlighting so Shiki's own markup survives.
    .use(rehypeSanitize, schema)
    .use(rehypeSlug)
    // Collect before autolinking so the "#" anchor doesn't leak into TOC text.
    .use(rehypeCollectHeadings(headings))
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: { className: "heading-anchor", ariaHidden: "true", tabIndex: -1 },
      content: { type: "text", value: "#" },
    })
    .use(rehypeDocLinks(ctx, brokenLinks))
    .use(rehypeShiki, {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(ctx.page.body);

  return { html: String(file), headings, brokenLinks };
}
