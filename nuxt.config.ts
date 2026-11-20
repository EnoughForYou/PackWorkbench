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
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..800&family=Onest:wght@300..800&display=swap',
        },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    worker: {
      format: 'es',
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
