import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  telemetry: false,
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', 'shadcn-nuxt'],
  pinia: {
    storesDirs: ['./app/stores/**', './stores/**'],
  },
  css: [
    '@fontsource-variable/onest/index.css',
    '@fontsource-variable/jetbrains-mono/index.css',
    '@fortawesome/fontawesome-svg-core/styles.css',
    '~/assets/css/tailwind.css',
  ],
  alias: {
    '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
    '@workers': fileURLToPath(new URL('./src/workers', import.meta.url)),
  },
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },
  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      title: 'Pack Workbench — Studio & Validator Resource Pack Minecraft Java',
      meta: [
        { name: 'color-scheme', content: 'dark' },
        {
          name: 'description',
          content:
            'Validasi arsip .zip dan pack.mcmeta Minecraft Java Edition 1.21.1–26.3, hitung SHA-1 server.properties, serta susun font bitmap U+E200+ dan rank badge di browser.',
        },
        { name: 'generator', content: 'Nuxt, Tailwind CSS, shadcn-vue, Reka UI, Radix UI' },
        { name: 'ui-framework', content: 'shadcn-vue, Reka UI, Radix UI' },
        { name: 'reka-ui', content: '2.11.0' },
        { name: 'radix-ui', content: 'reka-ui-2.11.0' },
        { name: 'shadcn-ui', content: 'shadcn-vue-2.9.0' },
      ],
      link: [],
      style: [
        {
          id: 'critical-theme-tokens',
          innerHTML:
            ':root{--background:#1e1f29;--foreground:#f0f1f5;--panel:#262736;--card:#262736;--elevated:#303244;--border:#3c3f54;--primary:#9b73be;--destructive:#e05252;--destructive-foreground:#ffffff;--radix-accordion-content-height:auto}html,body{background-color:#1e1f29!important;color:#f0f1f5!important;margin:0}',
        },
      ],
    },
  },
  experimental: {
    defaults: {
      nuxtLink: {
        prefetchOn: {
          interaction: true,
          visibility: false,
        },
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
    worker: {
      format: 'es',
    },
    build: {
      rollupOptions: {
        output: {
          chunkFileNames: '[name]-[hash].js',
          entryFileNames: '[name]-[hash].js',
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('@fortawesome')) {
                return 'vendor-fontawesome';
              }
              if (id.includes('jszip')) {
                return 'vendor-jszip';
              }
              if (
                id.includes('reka-ui') ||
                id.includes('radix-vue') ||
                id.includes('class-variance-authority') ||
                id.includes('clsx') ||
                id.includes('tailwind-merge')
              ) {
                return 'vendor-ui';
              }
              if (id.includes('vue') || id.includes('pinia') || id.includes('@vueuse')) {
                return 'vendor-vue';
              }
            }
          },
        },
      },
    },
  },
  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: {
        allowImportingTsExtensions: true,
        noUncheckedIndexedAccess: true,
        noFallthroughCasesInSwitch: true,
      },
    },
    appTsConfig: {
      include: ['../src/core/**/*.ts', '../src/workers/**/*.ts'],
    },
  },
});
