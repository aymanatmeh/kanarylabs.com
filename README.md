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

## Editing content

- **Ventures, pillars, and contact email** — top of [`src/pages/index.astro`](src/pages/index.astro).
- **Logo** — [`src/components/Logo.tsx`](src/components/Logo.tsx) (favicon: [`public/favicon.svg`](public/favicon.svg)).
- **Company / legal details** — footer in [`src/pages/index.astro`](src/pages/index.astro).
- **Colors & fonts** — [`src/styles/global.css`](src/styles/global.css).

Dark mode follows the visitor's OS setting automatically.
