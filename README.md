# Resource Pack Workbench — Minecraft Java Edition (Fase 1 & Fase 2)

Aplikasi web ini memvalidasi struktur `.zip` serta `pack.mcmeta`, menghitung hash SHA-1, dan merakit font bitmap, rank badge, ikon piksel sintetis, maupun *negative space* untuk Minecraft Java Edition (`1.21.1` – `26.3`). Semua berkas tetap berada di browser Anda. Tidak ada unggahan ke server luar.

---

## Cakupan Fitur

### Beranda (Command Hub)
Halaman awal menyajikan tiga jalur cepat. Anda dapat menjatuhkan `.zip` ke Validator Fase 1, membuka Studio Fase 2 (`Buat Rank Badge`, `Import PNG`, `Negative Space`), atau mengganti target versi aktif dari `1.21.1` sampai `26.3`.

### Fase 1: Validator Resource Pack & SHA-1
Arsip korup langsung ditolak (`Z03`). Pemeriksa turut menelusuri letak `pack.mcmeta` pada root (`Z01`), folder pembungkus (`Z02`), sampah OS (`__MACOSX`, `.DS_Store`, `Thumbs.db`, `desktop.ini`), path non-`ResourceLocation`, bentrok kapitalisasi huruf, ukuran melewati `250 MiB`, ketiadaan `assets/` serta `pack.png`, **deteksi bundle plugin `ItemsAdder`/`Oraxen`/`Nexo` dan arsip `.zip` bersarang (`Z10`)**, serta audit file `font/*.json` terhadap tekstur hilang (`Z11`) dan artefak `height <= 0` / aksara non-PUA (`Z12`). Aturan metadata (`M01`–`M10`) mencakup `1.21.1` (`34`), `1.21.10` (`[69, 0]`), `1.21.11` (`[75, 0]`), `26.1.2` (`[84, 0]`), `26.2` (`[88, 0]`), dan `26.3` (`[97, 1]`). Literal float seperti `69.0` gagal seketika. Pasangan `min_format`/`max_format` timpang, `supported_formats` di atas `64`, serta pack lintas era belum lengkap ikut ditahan.

Web Worker memproses SHA-1 40 digit hex per potongan `File.slice()` 4 MiB supaya tab tetap responsif, lalu menghasilkan cuplikan `server.properties`.

### Fase 2: Studio Font, Rank Badge, & Negative Space
Komposer Rank menyusun badge berlapis dari aset prosedural mandiri: `Frame`, `Icon` geometris sintetis, `Text` piksel `3×5` maupun `5×5`, `Shadow`, serta kuas `Pensil` dan `Penghapus` lengkap dengan `Undo`. Import `.png` tunggal dan sprite sheet `N×M` tersedia. PUA dimulai dari `U+E200` agar menjauhi slot kontroler/HUD Bedrock `U+E000–U+E1FF` (`[SECONDARY]`). Provider `space` menerima nilai `float` bebas, baik negatif ataupun melebihi `32.0`.

Panel metrik menghitung `cellW`, `cellH`, `scale`, `actualGlyphWidth`, `advance`, hingga `top` menurut bytecode `BitmapProvider$Definition`, lalu pratinjau menyimulasikan kursor `float` mentah pada `Chat`, `TAB`, maupun `Nametag` di GUI Scale `1–4`. Rasterisasi klien asli masih `[UNVERIFIED]`. Sebelum ekspor, pemeriksa mengecek `F01`–`F10` beserta komponen opsional `"type": "object"` (`1.21.9+`). Arsip `.zip` Java Edition hasil ekspor otomatis lolos inspeksi Fase 1 (`0 ERROR`, kompatibel untuk `resourcepacks/` maupun `plugins/Nexo/pack/external_packs/`), lengkap dengan cuplikan `LuckPerms`, `PlaceholderAPI`, `/tellraw`, YAML **`ItemsAdder` / `Oraxen` / `Nexo`**, serta opsi unduh bundle plugin multi-target.

---

## Cara Menjalankan

Pastikan Node.js (`>= 18.3.0`, teruji pada `v26.10.0`) dan npm sudah tersedia.

```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan server pengembangan (browser)
npm run dev

# 3. Jalankan tes otomatis (Vitest di Node)
npm test

# 4. Pemeriksaan tipe TypeScript strict
npm run typecheck

# 5. Generate build statis browser-only (.output/public/) dan pratinjau lokal
npm run generate
npm run preview
```

---

## Arsitektur Berkas

Logika inti di `src/core/` memakai TypeScript murni tanpa React atau DOM sehingga seluruh aturan dapat diuji langsung di Node.

| Jalur | Peran Utama |
| :--- | :--- |
| `src/core/versions.ts` | Tabel profil versi (`1.21.1`–`26.3`) dan konstanta dari `docs/knowledge/` |
| `src/core/mcmeta.ts` & `src/core/zipReader.ts` | Parser `pack.mcmeta` penjaga token angka dan pembaca arsip ZIP |
| `src/core/rules/zipRules.ts` & `mcmetaRules.ts` | Evaluasi aturan struktur ZIP (`Z01`–`Z09`) dan metadata (`M01`–`M10`) |
| `src/core/report.ts` & `sha1Stream.ts` | Penggabung laporan validasi, snippet `server.properties`, dan SHA-1 streaming |
| `src/core/font/pngCodec.ts` | Decoder/encoder PNG RGBA murni berbasis `DecompressionStream`/`CompressionStream` |
| `src/core/font/pixelSynth.ts` | Font mini `3×5`/`5×5`, ikon piksel geometris sintetis, dan komposer layer rank |
| `src/core/font/bitmapMetrics.ts` | Rumus `BitmapProvider$Definition`, `Window.calculateScale`, & kursor `float` |
| `src/core/font/puaAllocator.ts` | Alokasi codepoint aman `U+E200+`, pengikat padding prefix, & deteksi zona bentrok |
| `src/core/font/rules/fontRules.ts` | Evaluasi aturan `F01`–`F10` dan validasi komponen `object` (`1.21.9+`) |
| `src/core/font/packBuilder.ts` | Perakitan `pack.mcmeta`, `font/*.json`, PNG, `.zip`, dan snippet plugin |
| `src/workers/sha1.worker.ts` | Web Worker streaming SHA-1 bertahap per 4 MiB |
| `nuxt.config.ts` & `app/` | Konfigurasi Nuxt 4 (`ssr: false`), layout (`default`, `studio`), rute (`index`, `studio`, `about`) |
| `app/stores/` & `app/composables/` | Pinia store proyek/validator (`@pinia/nuxt`) dan helper render pratinjau in-game |
| `app/components/` | Komponen antarmuka `shadcn-vue` + Tailwind v4 (`studio/`, `validator/`, `layout/`, `ui/`) |
| `tests/` | Fixture sintetis dan unit test Vitest tanpa aset vanilla Mojang |

---

## Menambah Profil Versi Minecraft Baru

1. Pastikan nilai `pack_version.resource_major` dan `resource_minor` berasal dari `version.json` di `client.jar` resmi serta aturan `PackFormat`, lalu catat faktanya di `docs/knowledge/`.
2. Daftarkan ID versi di `TargetVersionId` (`src/core/types.ts`) dan sisipkan baris profil ke `VERSION_PROFILES` (`src/core/versions.ts`) lengkap dengan rujukan `docRef`.
3. Perbarui `mcmetaRules.ts` atau `fontRules.ts` bila codec baru menambah aturan.
4. Tambah kasus uji lolos dan gagal pada `tests/mcmetaRules.test.ts`, `tests/fontRules.test.ts`, serta `tests/packBuilder.test.ts`, lalu jalankan `npm test` dan `npm run typecheck`.

---

## Alasan Pemilihan Dependensi

Fase 2 nihil paket pihak ketiga tambahan. Codec PNG murni (`src/core/font/pngCodec.ts`) bertumpu pada `DecompressionStream('deflate')` beserta `CompressionStream('deflate')` bawaan Node 18+ maupun peramban modern.

Pustaka `@noble/hashes` (`1.8.0`) menghitung SHA-1 per potongan di Web Worker supaya memori tetap hemat saat membaca ZIP ratusan MiB, sementara `jszip` (`3.10.1`) membongkar ataupun mengemas `.zip` secara portabel di Node dan peramban. Antarmuka memakai **Nuxt 4** (`ssr: false`, tanpa server runtime/API backend), **Vue 3** (`3.5`), **Pinia** (`@pinia/nuxt`), komponen **`shadcn-vue`** (`shadcn-nuxt`, `reka-ui`, `@lucide/vue`, `clsx`, `tailwind-merge`, `class-variance-authority`, `cn`), dan Google Fonts API (`Onest` + `JetBrains Mono`). Perkakas `nuxt`, `vue-tsc`, `typescript`, `tailwindcss`, `@tailwindcss/vite`, dan `vitest` hanya aktif selama pengembangan serta pengujian.
