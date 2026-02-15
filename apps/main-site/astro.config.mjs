// @ts-check

import netlify from '@astrojs/netlify';
import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: netlify(),
  integrations: [svelte()],
  image: {
    domains: ['kaxxtklysaqixmtiogse.supabase.co'],
  },
  i18n: {
    defaultLocale: 'fi',
    locales: ['fi', 'sv', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  devToolbar: {
    enabled: false,
  },
});
