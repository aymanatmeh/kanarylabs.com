import { describe, expect, it } from "vitest";
import { buildDocTree } from "./tree";
import { renderDoc } from "./render";
import type { RawDoc } from "./source";

const doc = (path: string, frontmatter: string, body = "Body text."): RawDoc => ({
  path,
  content: `---\n${frontmatter}\n---\n\n${body}\n`,
});

const fixture: RawDoc[] = [
  doc("_index.md", "title: AI Observatory\nslogan: Observe everything\ncategory: Laravel"),
  doc("introduction.md", "title: Introduction\nweight: 1"),
  doc("installation-setup.md", "title: Installation\nweight: 2"),
  doc("internal-notes.md", "title: Internal\nweight: 3\nnavigation: false"),
  doc("basic-usage/_index.md", "title: Basic usage\nweight: 10"),
  doc("basic-usage/recording-your-first-trace.md", "title: Recording a trace\nweight: 1"),
  doc("basic-usage/exploring-the-dashboard.md", "title: Exploring the dashboard\nweight: 2"),
  doc("reference/_index.md", "title: Reference\nweight: 20"),
  doc("reference/configuration.md", "title: Configuration\nweight: 1"),
];

describe("buildDocTree", () => {
  const tree = buildDocTree(fixture);

  it("reads package metadata from the root _index.md", () => {
    expect(tree.meta).toEqual({
      title: "AI Observatory",
      slogan: "Observe everything",
      category: "Laravel",
    });
  });

  it("excludes _index.md from page slugs", () => {
    expect([...tree.bySlug.keys()]).not.toContain("_index");
    expect([...tree.bySlug.keys()]).not.toContain("basic-usage/_index");
  });

  it("derives slugs from the document path", () => {
    expect(tree.bySlug.has("introduction")).toBe(true);
    expect(tree.bySlug.has("basic-usage/recording-your-first-trace")).toBe(true);
  });

  it("orders groups and pages by weight", () => {
    expect(tree.groups.map((g) => g.id)).toEqual(["basic-usage", "reference"]);
    expect(tree.groups[0]!.pages.map((p) => p.title)).toEqual([
      "Recording a trace",
      "Exploring the dashboard",
    ]);
    expect(tree.rootPages.map((p) => p.title)).toEqual(["Introduction", "Installation", "Internal"]);
  });

  it("titles groups from their _index.md", () => {
    expect(tree.groups.map((g) => g.title)).toEqual(["Basic usage", "Reference"]);
  });

  it("keeps navigation:false pages routable but out of the sidebar order", () => {
    expect(tree.bySlug.has("internal-notes")).toBe(true);
    expect(tree.bySlug.get("internal-notes")!.hidden).toBe(true);
    expect(tree.ordered.map((p) => p.slug)).not.toContain("internal-notes");
  });

  it("flattens root pages before groups for prev/next", () => {
    expect(tree.ordered.map((p) => p.slug)).toEqual([
      "introduction",
      "installation-setup",
      "basic-usage/recording-your-first-trace",
      "basic-usage/exploring-the-dashboard",
      "reference/configuration",
    ]);
  });

  it("falls back to a humanised filename when title is missing", () => {
    const [page] = buildDocTree([doc("some-page.md", "weight: 1")]).rootPages;
    expect(page!.title).toBe("Some page");
  });
});

describe("renderDoc", () => {
  const tree = buildDocTree(fixture);
  const knownSlugs = new Set(tree.bySlug.keys());
  const groupEntry = new Map([["basic-usage", "basic-usage/recording-your-first-trace"]]);

  const render = (path: string, body: string) =>
    renderDoc({
      page: { ...tree.bySlug.get("introduction")!, sourcePath: path, body },
      baseUrl: "/docs/laravel-ai-observatory",
      knownSlugs,
      groupEntry,
      repo: "Kanary-Labs/laravel-ai-observer",
      ref: "main",
      docsDir: "docs",
    });

  it("rewrites sibling markdown links to docs URLs", async () => {
    const { html, brokenLinks } = await render("introduction.md", "[Install](installation-setup.md)");
    expect(html).toContain('href="/docs/laravel-ai-observatory/installation-setup"');
    expect(brokenLinks).toEqual([]);
  });

  it("resolves relative links from nested pages", async () => {
    const { html } = await render(
      "basic-usage/recording-your-first-trace.md",
      "[Config](../reference/configuration.md)",
    );
    expect(html).toContain('href="/docs/laravel-ai-observatory/reference/configuration"');
  });

  it("preserves hash fragments", async () => {
    const { html } = await render("introduction.md", "[Opts](reference/configuration.md#options)");
    expect(html).toContain('href="/docs/laravel-ai-observatory/reference/configuration#options"');
  });

  it("points a group _index link at the group's first page", async () => {
    const { html } = await render("introduction.md", "[Basics](basic-usage/_index.md)");
    expect(html).toContain(
      'href="/docs/laravel-ai-observatory/basic-usage/recording-your-first-trace"',
    );
  });

  it("sends links outside the docs directory to GitHub", async () => {
    const { html, brokenLinks } = await render("changelog.md", "[Changelog](../CHANGELOG.md)");
    expect(html).toContain(
      'href="https://github.com/Kanary-Labs/laravel-ai-observer/blob/main/CHANGELOG.md"',
    );
    expect(brokenLinks).toEqual([]);
  });

  it("reports internal links that do not resolve", async () => {
    const { brokenLinks } = await render("introduction.md", "[Nope](does-not-exist.md)");
    expect(brokenLinks).toEqual(["does-not-exist.md"]);
  });

  it("leaves external links alone and opens them in a new tab", async () => {
    const { html } = await render("introduction.md", "[Laravel](https://laravel.com)");
    expect(html).toContain('href="https://laravel.com"');
    expect(html).toContain('target="_blank"');
  });

  it("resolves relative images against the raw repo", async () => {
    const { html } = await render("introduction.md", "![Shot](images/dashboard.png)");
    expect(html).toContain(
      'src="https://raw.githubusercontent.com/Kanary-Labs/laravel-ai-observer/main/docs/images/dashboard.png"',
    );
  });

  it("collects headings for the table of contents", async () => {
    const { headings } = await render("introduction.md", "## First\n\n### Nested\n");
    expect(headings).toEqual([
      { depth: 2, slug: "first", text: "First" },
      { depth: 3, slug: "nested", text: "Nested" },
    ]);
  });

  it("highlights fenced code blocks", async () => {
    const { html } = await render("introduction.md", "```php\n$a = 1;\n```");
    expect(html).toContain("<pre");
    expect(html).toContain("shiki");
  });

  it("supports GitHub-flavoured tables", async () => {
    const { html } = await render("introduction.md", "| A | B |\n| - | - |\n| 1 | 2 |");
    expect(html).toContain("<table>");
  });

  it("strips unsafe markup", async () => {
    const { html } = await render("introduction.md", 'Hi <script>alert("x")</script>');
    expect(html).not.toContain("<script>");
  });
});
