# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Nuxt 4 (`ssr: false`, 100% browser-only static SPA via `nuxt generate`) + Vue 3 + TypeScript strict + Tailwind CSS v4 (`@tailwindcss/vite`) + Pinia (`@pinia/nuxt`) + `shadcn-vue` (`shadcn-nuxt`) + Google Fonts API (UI Layer); `src/core/` tetap TypeScript murni tanpa dependensi DOM/framework.

## Users

Pembuat resource pack Minecraft Java Edition serta admin/developer server Minecraft (Paper/Purpur/Spigot dengan plugin LuckPerms, PlaceholderAPI, dan TAB) yang menyiapkan pack `.zip`, hash `server.properties`, font bitmap `U+E200+`, dan rank badge sebelum diterapkan ke server.

## Product Purpose

Alat bantu browser-only untuk:
1. Memvalidasi arsip `.zip` dan `pack.mcmeta` Minecraft Java Edition (`1.21.1` hingga `26.3`) terhadap aturan `Z01–Z09` dan `M01–M10`, lalu menghitung hash SHA-1 40-karakter dan cuplikan `server.properties`.
2. Menyusun font `bitmap`, `space`, rank badge berlapis (`Frame`, `Icon`, `Text`, `Shadow`, `Paint`), dan rangkaian prefix `U+E200+` dengan pratinjau GUI Scale `1–4` (`Chat`, `TAB`, `Nametag`), aturan `F01–F10`, serta ekspor `.zip` Java Edition siap pakai.

## Positioning

Aturan format dan metrik dihitung dari perilaku aktual codec `PackFormat`, `BitmapProvider$Definition`, `SpaceProvider$Definition`, `Window.calculateScale`, dan `FontSet` hasil verifikasi bytecode `client.jar` dalam `docs/knowledge/`. Semua berkas diproses 100% lokal di browser tanpa unggahan jaringan, tanpa akun, dan tanpa menyertakan aset vanilla Mojang.

## Operating Context

Desktop-Only Creative Suite (resolusi kerja target >= 1280px). Tidak mendukung dan tidak menyediakan layout ponsel atau tablet. Seluruh pemrosesan dilakukan 100% secara lokal di browser klien (Client-Side Execution) tanpa jaringan backend, tanpa akun, dan tanpa telemetri. Digunakan oleh kreator resource pack dan administrator server Minecraft Java Edition untuk menyusun font bitmap, rank badge berlapis, spasi negatif, serta memvalidasi arsip ZIP dan pack.mcmeta secara presisi.

## Capabilities and Constraints

- Arsitektur 100% browser-only; Worker SHA-1 streaming menjaga tab tetap responsif untuk arsip besar hingga batas server `250 MiB`.
- `src/core/` harus tetap TypeScript murni dan lolos seluruh 48 unit test Vitest.
- Struktur navigasi & rute (`A2`): Navbar hanya memuat 3 tautan utama (`Beranda`, `Studio`, `About`); Beranda (`/`) berisi informasi, pratinjau interaktif Studio & Validator, matriks versi, roadmap, dan footer; `/studio` terpisah dan memuat mode `Studio Rank & Glyph` serta `Validator ZIP & SHA-1`; `/about` memuat informasi cakupan, teknologi, privasi, dan rujukan teknis.
- Cakupan ekspor saat ini khusus Minecraft Java Edition (`1.21.1`, `1.21.10`, `1.21.11`, `26.1.2`, `26.2`, `26.3`). Fitur Fase 3 (DeluxeMenus/CustomModelData) dan Fase 4 (konverter Java ke Bedrock) ditampilkan sebagai roadmap terkunci dan belum diaktifkan.
- Fakta yang masih `[UNVERIFIED]` (uji klien Minecraft nyata untuk rasterisasi GUI Scale `1–4` & Texture Filtering `1.21.11+`) wajib mempertahankan label `[UNVERIFIED]` di UI.
- Larangan keras: zero aset vanilla Mojang (`default.png`, `ascii.png`, tekstur/shader `client.jar`) di repo atau output ekspor; seluruh ikon & glyph pratinjau bersifat sintetis prosedural.

## Brand Commitments

- Bahasa antarmuka: Bahasa Inggris untuk `/studio` (lingkungan kerja kreatif terstandar) dan Bahasa Indonesia untuk dokumentasi/informasi teknis.
- Karakter Desain: Software kreatif profesional (Aseprite, PacksMC, Xqedii UltimateUI), bukan dashboard website generik.
- Palet "Aseprite Retro Studio" (`ui-styling`): Canvas background `#1e1f29`, Panel surface `#262736`, Elevated surface `#303244`, Border `#3c3f54`, Primary accent & button `#9b73be` (Amethyst Lavender).
- Tipografi: `Onest` untuk UI dan `JetBrains Mono` untuk metrik/kode.
- Sistem Tombol High-Contrast (`ui-styling`):
  - **Amethyst Lavender** (`#9b73be` pill, teks `#0e0f14` bold): Aksi utama (Export Pack, Generate, Confirm).
  - **Aseprite Elevated** (`#303244`, border `#3c3f54`): Tombol sekunder / surface.
  - **Red** (`#e05252`): Aksi destruktif (Delete / Reset).

## Evidence on Hand

- `docs/knowledge/00-ringkasan-perbedaan-versi.md`, `docs/knowledge/font-dan-glyph.md`, `docs/knowledge/bedrock-geyser.md`, `docs/knowledge/99-pertanyaan-terbuka.md`: verifikasi primer `piston-meta.mojang.com` dan `client.jar`.
- `src/core/` & `tests/*.test.ts`: 67 tes Vitest terkonfirmasi hijau untuk codec PNG, metrik bitmap, alokasi PUA, `fontRules` (`F01–F10`), `zipRules` (`Z01–Z09`, `Z10–Z12`), `mcmetaRules` (`M01–M10`), `packBuilder`, `sha1Stream`, dan `workbenchStore`.
- Pratinjau visual rank badge sintetis orisinal dari `src/core/font/pixelSynth.ts`. Belum ada testimoni pengguna, angka adopsi, atau tangkapan layar klien game live.

## Product Principles

1. Transparansi sumber kebenaran: setiap temuan validator dan simulasi metrik mencantumkan ID aturan, rujukan `docs/knowledge/`, dan status `[UNVERIFIED]` bila belum diuji di klien asli.
2. Ruang kerja bebas gangguan: Beranda menjelaskan dan memamerkan alat secara terstruktur, sedangkan `/studio` langsung masuk ke lingkungan kerja tanpa chrome pemasaran.
3. Desktop Workstation Ergonomics: seluruh panel, tool dock, kanvas piksel, inspektor, dan status bar dioptimalkan untuk efisiensi keyboard dan mouse di layar desktop tanpa kompromi tata letak mobile.

## Accessibility & Inclusion

- Skip link di urutan fokus pertama, fokus terlihat jelas (`:focus-visible`), `aria-current="page"` pada navigasi aktif, dan `roving tabindex` pada toolbar/tablist Studio.
- Kontras teks >= 4.5:1 untuk teks isi dan >= 3:1 untuk teks besar serta indikator aktif (WCAG 1.4.1 tidak mengandalkan warna saja).
- Menghormati `prefers-reduced-motion: reduce` dan `forced-colors: active`.
