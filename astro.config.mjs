import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build
// Static output deploys directly to Cloudflare Pages:
//   Build command:      npm run build
//   Build output dir:   dist
export default defineConfig({
  site: 'https://kanarylabs.com',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
