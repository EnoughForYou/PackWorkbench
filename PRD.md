# PRD — Pack Workbench: Desktop-Only Creative Suite for Minecraft Java Resource Pack

Status: **DISETUJUI / MASTER PRD**. Menggantikan seluruh dokumen PRD Fase 1 dan Fase 2 sebelumnya.  
Sumber kebenaran teknis mutlak: `docs/knowledge/` (`00-ringkasan-perbedaan-versi.md`, `font-dan-glyph.md`, `gui-menu.md`, `item-model.md`, `bedrock-geyser.md`, `plugin-itemsadder-oraxen-nexo.md`, `99-pertanyaan-terbuka.md`, serta `java-*.md`). Jika timbul kontradiksi teknis, `docs/knowledge/` selalu menjadi acuan tertinggi.

---

## 1. Identitas Produk & Filosofi Arsitektur

### 1.1 Definisi Produk
**Pack Workbench** adalah *Desktop-Only, Browser-Based Minecraft Java Resource Pack Development Suite*. Alat ini menyatukan studio pembuatan rank badge / font bitmap dan sistem audit validator pack ke dalam satu perangkat lunak kreatif profesional yang berjalan 100% di browser pengguna tanpa perantara backend.

### 1.2 Pilar Utama
1. **100% Client-Side Execution**:
   - Seluruh pemrosesan berkas (ekstraksi ZIP, parsing JSON, rasterisasi piksel, hashing SHA-1, dan penyusunan arsip) dijalankan secara lokal di browser via Web APIs dan Web Workers.
   - Tidak ada server backend, tidak ada unggahan berkas ke jaringan, tidak ada sistem akun, dan tidak ada analitik atau pelacak eksternal. Privasi pengguna terjamin mutlak.
2. **Desktop-Only Architecture**:
   - Antarmuka dirancang dan dioptimalkan secara ketat untuk resolusi desktop (layar kerja minimum lebar 1280px).
   - Seluruh ketentuan responsivitas ponsel dan tablet **DIHAPUS**. Tidak ada layout mobile, hamburger menu sempit, atau adaptasi tablet. Ruang layar dimaksimalkan untuk kepadatan informasi, panel multi-kolom, tool dock, dan canvas presisi tinggi.
3. **Karakter Software Kreatif Profesional**:
   - Bukan dashboard web komersial atau landing page marketing dengan card dekoratif, glow generik, dan gradient yang tidak perlu.
   - Mengusung karakter *desktop creative workstation* yang fungsional, padat, dan taktis menyerupai Aseprite, Digital Audio Workstation (DAW), atau IDE modern.
4. **Target Audiens**:
   - Kreator resource pack Minecraft Java Edition, desainer pixel art UI server, serta administrator / developer server Minecraft (Paper, Purpur, Spigot, Velocity yang mengelola plugin LuckPerms, TAB, ItemsAdder, Oraxen, Nexo).

---

## 2. Arah Desain & Referensi Interaksi

Perancangan antarmuka dan interaksi Pack Workbench berakar pada tiga referensi utama:

### 2.1 Aseprite — Interaction & Pixel Editing Reference
- **Toolbar & Shortcuts**: Rail alat vertikal di sisi kiri dengan shortcut keyboard standar industri (`V` Select/Move, `B` Brush/Pencil, `E` Eraser, `I` Eyedropper, `G` Paint Bucket).
- **Pixel-Perfect Canvas**: Raster grid akurat dengan panduan koordinat real-time `(X, Y)` dan navigasi pan & zoom (1× hingga 32×).
- **Layer Stack Management**: Struktur layer komposer (Paint, Text, Shadow, Icon, Frame) dengan drag-and-drop reordering, toggle visibilitas, pengaturan opacity, dan pergeseran offset koordinat.
- **Color Picker & Palette**: Palet warna hex cepat dengan riwayat warna aktif dan eyedropper kanvas.

### 2.2 PacksMC — Workspace & Asset Explorer Reference
- **Asset / Rank Explorer**: Panel navigasi hierarki pohon di sisi kiri untuk berpindah cepat antar-rank badge, sprite bitmap, dan entri space.
- **Inspector Panel**: Penyetelan mendalam untuk metrik glyph, advance, ascent, height, dan style komposer.
- **Minecraft Live Preview**: Pratinjau kontekstual in-game yang akurat (Chat box, TAB list, dan F5 Nametag) yang langsung memperbarui tampilan saat layer diubah.

### 2.3 Xqedii UltimateUI — Presentation Reference
- **Presentasi Visual Minecraft Otentik**: Presisi tata letak glyph, simulasi jarak spasi negatif, drop shadow font Minecraft Java Edition, dan integrasi komponen teks chat.

---

## 3. Sistem Desain & Visual Tokens

### 3.1 Palet Warna "Dark Obsidian Studio"
| Token | Nilai Hex | Peruntukan |
| :--- | :--- | :--- |
| **Canvas Background** | `#0b0b0e` | Latar belakang area kerja kanvas piksel |
| **Panel Surface** | `#111115` | Permukaan panel utama (Explorer, Inspector, Topbar, Statusbar) |
| **Elevated Surface** | `#16161c` | Kartu entri, popover dropdown, modal, dialog, dan header |
| **Border / Divider** | `#202028` | Garis pemisah panel, border input, dan pemisah kolom |
| **Primary Accent** | `#ff5e2c` | Identitas brand (Burnt Orange), tab/tool terpilih, outline aktif, selection bounding box |
| **Primary Text** | `#f4f4f6` | Teks utama, judul, dan label aktif |
| **Muted Text** | `#8a8a98` | Keterangan sekunder, shortcut label, placeholder |
| **Destructive / Error** | `#ef4444` | Pesan error validator, tombol hapus, aksi berbahaya |
| **Warning / Caution** | `#f59e0b` | Peringatan validator, catatan `[UNVERIFIED]`, notice teknis |
| **Success / Valid** | `#22c55e` | Status validasi lolos, indikator koneksi worker |

### 3.2 Tipografi
- **UI Font**: `Onest`, sans-serif modern, geometris, netral, sangat mudah dibaca pada ukuran 11–13px antarmuka desktop padat.
- **Technical & Code Font**: `JetBrains Mono`, monospace untuk nilai metrik, koordinat `(x, y)`, codepoint Unicode `U+E200+`, JSON preview, aturan validator, dan cuplikan config `server.properties`.

### 3.3 Spesifikasi Tombol (Button System)
Karakteristik: **Minimalis, tegas, high-contrast, compact padding, font weight 600–700, border radius pill (full rounded)**.

1. **Primary Action Button (Export Pack / Generate / Confirm)**:
   - **Background**: Lime Green (`#22c55e` / `#16a34a`)
   - **Text**: Hitam pekat (`#0b0b0e`), font weight 700
   - **Border Radius**: Full / Pill (`rounded-full`)
   - **Border**: Tidak ada border
   - **Shadow**: Minimal atau flat
   - **Padding**: Compact (`px-3.5 py-1.5` teks 12px)
2. **Brand & Selected State Button (Active Tools / Filter Selected)**:
   - **Background**: Burnt Orange (`#ff5e2c`)
   - **Text**: Putih / Off-white (`#ffffff`), font weight 600
   - **Border Radius**: Pill / Rounded 6px–full
3. **Workspace Surface Button (Standard Actions / Secondary)**:
   - **Background**: `#16161c`, border `#202028`
   - **Text**: `#f4f4f6`, hover background `#202028`
4. **Destructive Button (Delete / Remove Layer / Reset)**:
   - **Background**: `#ef4444` atau outline merah
   - **Text**: `#ffffff`

---

## 4. Struktur Workspace Studio

Studio mengadopsi struktur panel terintegrasi desktop-grade:

```
+-----------------------------------------------------------------------------------------+
| TOP: Menu Bar + Project Toolbar (Namespace, Versi, GUI Scale, Undo/Redo, Export Pack)  |
+---------+--------------------+------------------------------------+---------------------+
| LEFT    | LEFT PANEL         | CENTER STAGE                       | RIGHT PANEL         |
| RAIL    | Rank & Asset       | Pixel Canvas / Live Preview        | Inspector / Layers  |
| Tool    | Explorer           | Split View                         | Validate & Deploy   |
| Dock    |                    |                                    |                     |
|         | - Ranks (ADMIN,    | - Pixel Canvas (Zoom, Pan, Grid)   | [Properties Tab]    |
| [Select]|   VIP, MOD, etc.)  | - Chat Preview                     | [Layers Tab]        |
| [Pencil]| - Bitmap Sprites   | - TAB List Preview                 | [Validate/Audit Tab]|
| [Eraser]| - Spaces           | - 3rd Person Nametag Preview       | [Deploy & YAML Tab] |
| [Picker]| - [+ Rank] [+ PNG] | - Split Screen (Canvas + Preview)  |                     |
+---------+--------------------+------------------------------------+---------------------+
| BOTTOM: Status Bar (Hover Coord, Canvas Size, Advance, Ascent, Target Version, Memory)   |
+-----------------------------------------------------------------------------------------+
```

### 4.1 Top: Menu Bar & Project Toolbar
- **Menu Bar**: Menu dropdown tingkat atas (`File`, `Edit`, `View`, `Workspace`, `Help`) yang mendukung shortcut keyboard.
- **Project Toolbar**:
  - Input Namespace resource pack (validasi regex `[a-z0-9_.-]+`).
  - Target Version Dropdown (`1.21.1`, `1.21.10`, `1.21.11`, `26.1.2`, `26.2`, `26.3`).
  - GUI Scale Toggle (`1×`, `2×`, `3×`, `4×`) dan Force Unicode toggle.
  - Tombol Undo (`Ctrl+Z`) dan Redo (`Ctrl+Y`).
  - Tombol Utama: **Export Pack** (Pill Lime Green tegas berteks hitam).

### 4.2 Left Rail: Tool Dock
Rail vertikal ramping selebar 44px menampung alat interaksi kanvas:
- **Select / Move (`V`)**: Memilih layer atau menggeser elemen.
- **Pencil / Pixel Brush (`B`)**: Menggambar piksel tunggal pada layer Paint aktif.
- **Eraser (`E`)**: Menghapus piksel pada layer Paint aktif.
- **Eyedropper (`I`)**: Mengambil warna hex dari piksel kanvas mana pun.
- **Color Picker Swatch**: Kotak warna aktif dengan popover palet hex cepat.
- **Zoom Fit / Reset (`Ctrl+0` / `Ctrl+1`)**.

### 4.3 Left Panel: Rank & Asset Explorer
- Pohon entri proyek yang rapi:
  - Bagian **Ranks**: ADMIN, VIP, MOD, CRYSTAL, ACE, GLORIOUS, CONQUEROR, serta rank custom buatan pengguna.
  - Bagian **Bitmap Sprites**: Gambar PNG yang diunggah pengguna atau sprite sheet terpisah.
  - Bagian **Spaces**: Karakter negative space dan offset advance.
- Tombol aksi cepat: `+ Rank` (dari preset atau kosong), `+ PNG`, dan `+ Space`.
- Pengaturan urutan prefix sequence (reorder prefix glyph yang tampil dalam cuplikan chat).

### 4.4 Center Stage: Pixel Canvas & Live Preview Viewport
- **Mode Kanvas**:
  - Render raster piksel presisi integer (tanpa interpolasi blur, `image-rendering: pixelated`).
  - Checkerboard background dengan kontras lembut.
  - Dynamic Canvas Width (Auto mengikuti panjang teks atau Fixed sesuai preferensi).
  - Navigasi interaktif: Pan (`Space + Drag` atau `Middle Mouse Click`), Zoom (`Wheel` dari 1× hingga 32×), Fit to Viewport.
- **Mode Live In-Game Preview**:
  - **Chat Scene**: Latar belakang terrain rumput sudut rendah, kotak chat semi-transparan `rgba(0,0,0,0.5)`, rendering badge ukuran proporsional (~72% tinggi chat bar), nama pemain kustom, dan pesan teks.
  - **TAB List Scene**: Hamparan daftar tab in-game berisi 5+ pemain lengkap dengan avatar kepala mini, rank badge aktual, nama bergradien/warna, serta indikator ping hijau.
  - **Third Person (Nametag F5) Scene**: Model avatar piksel orisinal menghadap depan di bawah langit cerah, nametag pill mengambang tepat 7 piksel di atas kepala pemain menampilkan rank badge dan nama.
- **Split View**: Membagi layar secara horizontal atau vertikal sehingga perubahan piksel di kanvas langsung terlihat di preview in-game seketika.

### 4.5 Right Panel: Multi-Tab Inspector & Layer Stack
- **Tab Properties**:
  - Height & Ascent (integer, dengan validasi `ascent <= height`).
  - Spacing Left / Right (advance compensation).
  - Codepoint Unicode (alokasi otomatis mulai `U+E200+` untuk mencegah tabrakan).
  - Frame Style: `outline`, `solid`, `bevel` (3D Tag), `pill`, `ribbon`, `none`.
  - Gradient font selection, drop shadow balancing (top/bottom equal 2px offset).
- **Tab Layers**:
  - Daftar tumpukan layer: **Paint**, **Text**, **Text & Icon Shadow**, **Icon**, **Frame / Background**.
  - Drag-and-drop reordering menggunakan HTML5 native drag dengan visual indicator (orange drop line).
  - Tombol panah fallback (`↑` / `↓`).
  - Accordion drawer tiap layer: collapsed by default, dapat dibuka untuk mengatur offset X/Y, opacity, warna spesifik, dan copy hex.
- **Tab Validate & Audit**:
  - Evaluasi seketika aturan `F01–F10` (font), `Z01–Z09` (zip structure), dan `M01–M10` (mcmeta).
  - Tampilan visual error, warning, dan info disertai petunjuk perbaikan.
- **Tab Deploy & YAML**:
  - Generator otomatis cuplikan konfigurasi:
    - Perintah LuckPerms (`/lp group <group> meta setprefix <weight> "<prefix>"`).
    - Format TAB plugin (`TAB/config.yml` atau `groups.yml`).
    - Format ItemsAdder / Oraxen / Nexo font definition YAML.
    - Cuplikan `server.properties` (`resource-pack=` dan `resource-pack-sha1=`).

### 4.6 Bottom: Status Bar
- Menampilkan status teknis padat:
  - Koordinat kursor: `X: 14, Y: 8`
  - Dimensi kanvas: `36 × 10 px`
  - Metrik glyph: `Advance: 37 | Ascent: 8 | Height: 9`
  - Target versi aktif: `Java 1.21.1 (Format 34)`
  - Status Autosave: `IndexedDB Synced` (dengan timestamp)
  - Status Validasi: `0 ERROR • 0 WARNING`

---

## 5. Fitur Tingkat Lanjut Studio

1. **Resizable & Dockable Panels**:
   - Panel Explorer kiri dan Inspector kanan dapat digeser lebarnya dengan resizable splitter (`reka-ui`).
   - Lebar panel dan visibilitasnya disimpan otomatis ke storage lokal (*Workspace Persistence*).
2. **Workspace Presets**:
   - `Default`: Layout studio lengkap 3-panel seimbang.
   - `Compact`: Explorer diminimalkan, fokus penuh pada kanvas piksel dan layer.
   - `Preview Focus`: Area preview in-game diperbesar untuk pengujian estetika in-game.
3. **Context Menu (Right-Click)**:
   - Klik kanan pada entri explorer: Duplicate, Rename, Split to Icon & Text, Delete, Copy Codepoint.
   - Klik kanan pada layer: Toggle Visibility, Duplicate Layer, Reset Offsets, Copy Layer Color.
   - Klik kanan pada kanvas: Invert Color, Clear Edits, Center Sprite.
4. **Command Palette (`Ctrl + K` / `Cmd + K`)**:
   - Dialog pencarian cepat untuk menjalankan aksi studio tanpa menyentuh mouse:
     - "New Rank Badge", "Export Pack ZIP", "Switch to TAB Preview", "Set GUI Scale 3x", "Run Validator Audit", "Toggle Pixel Grid".
5. **Shortcut Keyboard Terstandar**:
   - `Ctrl + Z`: Undo tindakan melukis piksel.
   - `Ctrl + Y` / `Ctrl + Shift + Z`: Redo tindakan melukis piksel.
   - `Ctrl + S`: Trigger penyimpanan manual ke IndexedDB + notifikasi toast.
   - `Ctrl + E`: Buka dialog Export Pack.
   - `Space + Drag`: Pan kanvas piksel.
   - `B`, `E`, `I`, `V`: Pemilihan alat rail kiri.
6. **Project Persistence & Crash Recovery (IndexedDB + Zod)**:
   - Proyek disimpan secara reaktif ke IndexedDB via library `idb` setiap kali terjadi mutasi state di Pinia store.
   - Skema proyek divalidasi dengan `zod` untuk mencegah data korup saat pemulihan.
   - Jika tab browser tidak sengaja tertutup atau mengalami crash, sesi kerja terakhir akan otomatis dipulihkan secara instan tanpa kehilangan data.
7. **UI State Consistency (Zero Data Loss)**:
   - Berpindah antara mode `Studio Rank & Glyph` dan mode `Validator ZIP & SHA-1` tidak me-reset data yang sedang diedit. Store Pinia menjaga state proyek tetap utuh sepanjang siklus hidup aplikasi.

---

## 6. Fondasi Validasi Teknis & Aturan Minecraft

Semua aturan di bawah ini berasal dari verifikasi bytecode `client.jar` dan spesifikasi resmi `docs/knowledge/`:

### 6.1 Profil 6 Versi Target Java
| Target Versi | Resource Format | Format pack.mcmeta | Karakteristik Font & Shader |
| :--- | :--- | :--- | :--- |
| **1.21.1** | `34` | Legacy: `pack_format: 34` | Format klasik; tolak komponen `object` text |
| **1.21.10** | `[69, 0]` | Modern: `min_format` / `max_format` | Dukung `object` component (`atlas` / `player`) |
| **1.21.11** | `[75, 0]` | Modern: `min_format` / `max_format` | Atlas terpisah `minecraft:items` vs `minecraft:blocks` |
| **26.1.2** | `[84, 0]` | Modern: `min_format` / `max_format` | Validasi rentang format modern |
| **26.2** | `[88, 0]` | Modern: `min_format` / `max_format` | Validasi rentang format modern |
| **26.3** | `[97, 1]` | Modern: `min_format` / `max_format` | Format minor versioning aktif |

### 6.2 Aturan Validasi ZIP (`Z01–Z09`)
- **Z01**: Deteksi arsip kosong atau korup.
- **Z02**: Validasi letak berkas wajib (`pack.mcmeta` harus tepat di root ZIP, bukan di subfolder).
- **Z03**: Larangan path traversal (`../`) dan zip bomb.
- **Z04**: Deteksi berkas sampah sistem operasi (`__MACOSX`, `.DS_Store`, `Thumbs.db`, `desktop.ini`).
- **Z05**: Validasi penamaan direktori `assets/<namespace>/`.
- **Z06**: Validasi penamaan berkas `ResourceLocation` (hanya `[a-z0-9_.-]`, dilarang huruf kapital dan spasi).
- **Z07**: Deteksi file tanpa ekstensi atau ekstensi tidak didukung di folder aset.
- **Z08**: Integritas CRC32 berkas dalam arsip.
- **Z09**: Peringatan batas ukuran arsip untuk distribusi server (`250 MiB` batas server.properties).

### 6.3 Aturan Validasi pack.mcmeta (`M01–M10`)
- **M01**: Validitas sintaks JSON (bukan berkas teks sembarang).
- **M02**: Keberadaan blok objek `"pack"` wajib.
- **M03**: Validasi format field versi sesuai target (`pack_format` vs `[min, max]`).
- **M04**: Validasi field `"description"` (string atau JSON text component).
- **M05**: Validasi `supported_formats` jika menggunakan format legacy.
- **M06**: Deteksi format usang atau masa depan di luar rentang versi target.
- **M07**: Validasi struktur blok `"overlays"` jika pack mendukung multi-versi.
- **M08**: Larangan properti usang atau ilegal di root `pack.mcmeta`.
- **M09**: Kesesuaian rentang `min_format <= max_format`.
- **M10**: Validasi tipe data ketat pada seluruh pasangan kunci-nilai.

### 6.4 Aturan Validasi Font, Glyph, & Rank (`F01–F10`)
- **F01**: Validitas JSON struktur file font (`assets/<ns>/font/*.json`) dengan array `"providers"`.
- **F02**: Validasi provider `bitmap`: keberadaan `file`, nilai `height` (default 8 jika absen), dan `ascent`.
- **F03**: Validasi konsistensi `ascent <= height`.
- **F04**: Validasi dimensi gambar PNG terhadap kisi `chars` (lebar harus kelipatan kolom karakter Unicode asli).
- **F05**: Peringatan alokasi codepoint zona konflik Bedrock (`U+E000–U+E1FF`); rekomendasi safe zone Java (`U+E200+`).
- **F06**: Deteksi tabrakan codepoint ganda dalam satu font definition.
- **F07**: Validasi provider `space`: advances map dengan nilai float valid.
- **F08**: Evaluasi komponen `"type": "object"` (atlas/player): ditolak pada Java 1.21.1 (`ERROR`), diizinkan pada 1.21.9+.
- **F09**: Pada target 1.21.11+, atlas blok dan item wajib merujuk `minecraft:blocks` dan `minecraft:items` secara spesifik.
- **F10**: Simulasi batas panjang teks chat 256 karakter (`MC-236960`).

### 6.5 Larangan Mutlak Aset Vanilla Mojang (AGENTS.md §4)
- **Dilarang keras**: Menyalin, menyematkan, atau menyertakan aset vanilla Mojang (`default.png`, `ascii.png`, tekstur item/blok, shader, atau `client.jar`) ke dalam repositori, build statis, fixture tes, maupun output ZIP hasil ekspor.
- Seluruh ikon preset (36 icon), font mini (3×5 / 5×5), dan latar belakang pratinjau wajib dihasilkan secara **sintetis prosedural murni** lewat kode TypeScript (`pixelSynth.ts`, `presets.ts`).

---

## 7. Keputusan Teknologi & Dependensi

| Kategori | Paket / Teknologi | Status | Alasan Pemilihan |
| :--- | :--- | :--- | :--- |
| **Framework Utama** | Nuxt 4 (`ssr: false`) + Vue 3 | Terpasang | Arsitektur SPA statis berkinerja tinggi, auto-imports terstruktur. |
| **Bahasa & Typing** | TypeScript (Strict) | Terpasang | Keamanan tipe data penuh; modul `src/core/` murni tanpa DOM. |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) | Terpasang | Utility engine modern, CSS custom properties dinamis. |
| **Komponen Headless** | `shadcn-vue` + `reka-ui` | Terpasang | Primitif UI desktop aksesibel (Resizable, Dialog, Tooltip, Dropdown). |
| **State Management** | Pinia 4 (`@pinia/nuxt`) | Terpasang | Reaktif, modular, terintegrasi HMR, state presisten antar-rute. |
| **Local Storage & Autosave** | `idb` (IndexedDB Wrapper) | **Ditetapkan** | Penyimpanan lokal tanpa batas kuota 5MB localStorage untuk proyek & aset. |
| **Interaksi & Utilitas** | `@vueuse/core` | Terpasang | Utilitas interaksi kanvas, roving focus, event listener window. |
| **Notifikasi Toast** | `vue-sonner` | **Ditetapkan** | Toast minimalis high-contrast untuk konfirmasi ekspor dan autosave. |
| **Validasi Skema** | `zod` | **Ditetapkan** | Validasi skema runtime untuk import/export proyek dan pemulihan IndexedDB. |
| **Pengujian Unit** | `vitest` | Terpasang | Pengujian cepat modul murni `src/core/` dan store logic (67+ tes lulus). |
| **Pengujian E2E Desktop** | `@playwright/test` | **Ditetapkan** | Pengujian interaksi browser desktop (drag-and-drop layer, kanvas zoom/pan). |

---

## 8. Definisi Selesai (Definition of Done)

Sebuah implementasi fitur dinyatakan selesai apabila:
1. **Desktop-Only**: Seluruh antarmuka berjalan sempurna pada resolusi desktop (>=1280px); tidak ada sisa artefak CSS layout mobile/tablet.
2. **Uji Otomatis Hijau**: 100% tes unit Vitest lulus tanpa error atau peringatan (termasuk validasi aturan `Z01-Z09`, `M01-M10`, `F01-F10`, dan Pinia store integration).
3. **TypeScript Strict & Typecheck Clean**: `npm run typecheck` menghasilkan 0 error.
4. **Build Statis Bersih**: `npm run generate` sukses menghasilkan bundle `.output/public` tanpa kegagalan.
5. **Zero Vanilla Mojang Assets**: Repositori dan berkas output bebas dari aset berhak cipta Mojang.
6. **Persistence Terverifikasi**: Proyek tersimpan secara aman di IndexedDB dan dapat dipulihkan seketika setelah halaman di-refresh.
