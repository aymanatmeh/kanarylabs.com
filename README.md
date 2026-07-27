# KanaryLabs

One-page marketing site for **Kanary Labs, LLC** — a Wyoming holding company
building and operating a portfolio of apps, web apps, SaaS, AI tools, and
digital services.

Built with [Astro](https://astro.build) + [React](https://react.dev) islands and
[Tailwind CSS v4](https://tailwindcss.com). Ships as a fully static site.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
```

## Build

```sh
npm run build    # outputs to ./dist
npm run preview  # preview the production build locally
```

## Deploy to Cloudflare (Workers Static Assets)

Live at **https://kanarylabs.ayman-atmeh.workers.dev/** — Worker `kanarylabs` on
the `ayman.atmeh@gmail.com` account (`6c6d05ee939be8c3e4799e2a0a570658`).

Hosting is configured in [`wrangler.jsonc`](wrangler.jsonc) (project name,
account, and `assets.directory` → `./dist`).

One-time login (must be that account):

```sh
npx wrangler login
npx wrangler whoami   # confirm 6c6d05ee939be8c3e4799e2a0a570658 is listed
```

Then deploy with the bundled script (builds + `wrangler deploy`):

```sh
npm run deploy
```

`deploy.sh` verifies you're logged into the correct account before deploying, so
it can't accidentally publish elsewhere. Because it's a Worker (not just static
Pages), you can later add backend code (e.g. a contact-form API route) to the
same project.

## Documentation system

`/docs` renders the documentation for Kanary Labs open-source packages. Each
package **keeps its docs in its own repository** — nothing is copied into this
repo. At build time the docs are fetched, parsed, and rendered as static pages.

### Registering a new package

Add one entry to [`src/config/packages.ts`](src/config/packages.ts):

```ts
{
  name: "My Package",
  slug: "my-package",            // → /docs/my-package
  description: "One-line summary for the /docs landing page.",
  category: "Laravel",
  repo: "Kanary-Labs/my-package",
  docsDir: "docs",
  versions: [{ label: "Latest", ref: "main" }],
  localPath: "/abs/path/to/checkout",  // optional, dev only
}
```

Routes, navigation, prev/next links, the landing page, and the search index are
all derived from that entry — there is nothing else to wire up.

### How docs are authored

In the package repo, under `docsDir`:

- Every page is markdown with `title` and `weight` frontmatter; lower weights
  sort first.
- A directory becomes a sidebar group; its `_index.md` supplies the group title
  and weight.
- The root `_index.md` holds package metadata (`title`, `slogan`, `category`).
- `navigation: false` keeps a page routable but hides it from the sidebar.
- `_index.md` never appears in a URL — `docs/basic-usage/recording.md` becomes
  `/docs/<slug>/basic-usage/recording`.

Relative links and images resolve against the source document. Links that point
outside the docs directory fall back to the file on GitHub.

### Sources, caching, and failures

| Situation | Behaviour |
| --- | --- |
| `localPath` exists, not CI | Reads from disk, so unpublished edits show up immediately |
| Otherwise | Fetches from GitHub, cached in `.docs-cache/` for 30 minutes |
| `DOCS_SOURCE=remote` | Forces GitHub even when a local checkout exists |
| `GITHUB_TOKEN` set | Used for the API (higher rate limits / private repos) |
| Source unreachable | Build fails with the package, repo, ref, and directory checked |
| Broken internal link | Warns in dev, **fails the production build** |

### Versioned docs

`versions` is a list, and the sidebar already renders a selector. Today each
package ships a single `main` entry labelled "Latest"; adding Git tags later is
a registry change only.

### Search

[Pagefind](https://pagefind.app) indexes the built HTML (`npm run build` runs it
automatically) and the index is designed to span multiple packages — results
show the package and section. Search only works against a built site, so use
`npm run preview` rather than `npm run dev` to try it.

### Tests

```sh
npm test
```

Covers document loading, ordering, hidden navigation, URL generation, link
resolution, and broken-link detection.

## Editing content

- **Ventures, pillars, and contact email** — top of [`src/pages/index.astro`](src/pages/index.astro).
- **Logo** — [`src/components/Logo.tsx`](src/components/Logo.tsx) (favicon: [`public/favicon.svg`](public/favicon.svg)).
- **Company / legal details** — footer in [`src/pages/index.astro`](src/pages/index.astro).
- **Colors & fonts** — [`src/styles/global.css`](src/styles/global.css).

Dark mode follows the visitor's OS setting automatically.
