import { resolve } from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Public origin used for canonical URLs, Open Graph tags, robots.txt and sitemap.xml.
// Override at build time: VITE_SITE_URL=https://your-domain.com npm run build
const DEFAULT_SITE_URL = 'https://acadence.pages.dev';
const PAGES = ['index', 'privacy', 'terms', '404'] as const;
const INDEXED = [
  { path: '/', priority: '1.0' },
  { path: '/privacy', priority: '0.3' },
  { path: '/terms', priority: '0.3' },
];

function seo(siteUrl: string): Plugin {
  return {
    name: 'acadence-seo',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source:
          '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          INDEXED.map(
            (p) => `  <url><loc>${siteUrl}${p.path}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`,
          ).join('\n') +
          '\n</urlset>\n',
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = (env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
  return {
    plugins: [react(), seo(siteUrl)],
    build: {
      rollupOptions: {
        input: Object.fromEntries(PAGES.map((p) => [p, resolve(import.meta.dirname, `${p}.html`)])),
      },
    },
  };
});
