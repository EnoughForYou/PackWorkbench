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

## 3. Sistem Desain & Visual Tokens (`ui-styling`)

Desain antarmuka menerapkan standar **`ui-styling`** (kombinasi semantic token shadcn/ui, utilitas Tailwind CSS v4, dan filosofi studio visual). Palet *AI-slop Obsidian* yang pekat mati dan melelahkan mata telah sepenuhnya digantikan oleh arsitektur **"Aseprite Retro Studio"** (Opsi A) yang mengedepankan tangga elevasi nyata (*surface elevation steps*) dan kenyamanan visual bagi kreator pixel art.

### 3.1 Palet Warna "Aseprite Retro Studio" (Semantic Tokens)

| Token Semantik | CSS Variable (HSL) | Nilai Hex | Peruntukan & Karakter |
| :--- | :--- | :--- | :--- |
| **`--background`** | `236 15% 14%` | `#1e1f29` | **Canvas Workspace**: Slate charcoal terkalibrasi, dasar kerja kanvas piksel yang ramah mata |
| **`--card` / `--panel`** | `236 17% 18%` | `#262736` | **Panel Surface**: Permukaan panel kerja (Explorer, Inspector, Toolbar, Statusbar) |
| **`--popover` / `--elevated`** | `236 17% 23%` | `#303244` | **Elevated Surface**: Floating card, modal dialog, popover dropdown, dan drawer aktif |
| **`--border` / `--input`** | `233 16% 28%` | `#3c3f54` | **Divider & Border**: Garis batas struktural 1px yang bersih, membagi panel secara taktis |
| **`--muted`** | `236 17% 20%` | `#2b2c3d` | **Muted Base**: Background input form, track slider, inactive tool container |
| **`--foreground`** | `228 17% 95%` | `#f0f1f5` | **Primary Text**: Off-white sejuk dengan kontras tajam (WCAG AAA) terhadap panel |
| **`--muted-foreground`** | `232 15% 67%` | `#9da0b8` | **Secondary Text**: Keterangan metrik, shortcut key hint, placeholder |
| **`--primary` (Button/Accent)** | `272 36% 60%` | `#9b73be` | **Amethyst Lavender**: Warna tombol utama, kursor aktif, indikator seleksi, dan brand accent |
| **`--primary-foreground`** | `230 18% 7%` | `#0e0f14` | **Primary Button Text**: Teks kontras tinggi pekat berbobot tebal di atas `#9b73be` |
| **`--destructive`** | `0 70% 60%` | `#e05252` | **Destructive / Error**: Pesan error validator, tombol hapus layer / reset |
| **`--warning`** | `38 92% 50%` | `#f59e0b` | **Warning / Caution**: Peringatan validator, status `[UNVERIFIED]` |
| **`--success`** | `142 71% 45%` | `#22c55e` | **Success / Pass**: Indikator audit lolos, SHA-1 streaming selesai |
| **`--ring`** | `272 36% 60%` | `#9b73be` | **Focus Ring**: Indikator aksesibilitas fokus keyboard (`:focus-visible`) |

### 3.2 Tipografi & Variable Fonts (Google Fonts API)

Antarmuka menerapkan aturan ketat: **Dilarang menggunakan system font default (`system-ui`, `sans-serif`, `Arial`, `Segoe UI`, `Roboto`)**. Seluruh lapisan antarmuka wajib menerapkan **Variable Fonts berspesifikasi tinggi** yang dimuat secara resmi melalui **Google Fonts API** (`https://fonts.googleapis.com` dengan optimasi `preconnect`):

1. **Primary UI Variable Font (`Onest`)**:
   - **Sumber**: Google Fonts API (`family=Onest:wght@300..800`).
   - **Karakter**: Humanist-geometric hybrid modern dengan proporsi vertikal seimbang, ketajaman rendering ekstrem pada ukuran mikro 11–13px di panel desktop padat, dan legibilitas tinggi tanpa memakan ruang horizontal berlebihan.
   - **Spesifikasi Bobot**: Regular (`300`/`400`) untuk teks keterangan, Medium (`500`) untuk label form dan tab, Semibold/Bold (`600`/`700`) untuk tombol aksi `#9b73be` dan judul section.
2. **Technical, Metrics & Code Variable Font (`JetBrains Mono`)**:
   - **Sumber**: Google Fonts API (`family=JetBrains+Mono:wght@400..800`).
   - **Karakter**: Monospace teknis yang dirancang khusus untuk kenyamanan membaca kode, koordinat piksel, codepoint Unicode `U+E200+`, metrik advance/ascent, dan JSON.
   - **OpenType Feature Settings**: Wajib mengaktifkan `font-feature-settings: "tnum" 1, "zero" 1` (angka tabular selebar tetap dan nol bercoret) untuk menjamin metrik dan angka koordinat tidak pernah bergetar saat diperbarui.
3. **Global Rendering Flags**:
   - `-webkit-font-smoothing: antialiased`
   - `-moz-osx-font-smoothing: grayscale`
   - `text-rendering: optimizeLegibility`

### 3.3 Spesifikasi Tombol (Button System)
Karakteristik: **Minimalis, tegas, high-contrast, compact padding, font weight 600–700, border radius pill (`rounded-full`)**.

1. **Primary Action Button (Export Pack / Generate / Confirm)**:
   - **Background**: `#9b73be` (Muted Amethyst Lavender)
   - **Hover State**: `#a882cb` (Lighter lavender tint)
   - **Active State**: `#8c62b0` (Deep amethyst)
   - **Text**: `#0e0f14` (Deep charcoal contrast, font-weight 700)
   - **Border Radius**: Full / Pill (`rounded-full`)
   - **Border**: Tanpa border eksternal (flat minimal)
   - **Shadow**: Minimal flat (tanpa gradient berlebihan)
   - **Padding**: Compact (`px-3.5 py-1.5` teks 12px)
2. **Brand & Selected State Button (Active Tools / Filter Selected)**:
   - **Background**: `#9b73be` dengan teks `#0e0f14` atau pill border `#9b73be` pada background `#303244`
   - **Indicator**: Outline aktif / selection glow lembut (`ring-1 ring-[#9b73be]/50`)
3. **Workspace Surface Button (Standard Actions / Secondary)**:
   - **Background**: `#303244`, border 1px `#3c3f54`
   - **Text**: `#f0f1f5`, hover background `#383b50`
   - **Border Radius**: Full / Pill (`rounded-full`) atau `rounded-md`
4. **Destructive Button (Delete / Remove Layer / Reset)**:
   - **Background**: `#e05252` atau outline merah pada surface
   - **Text**: `#ffffff`, hover background `#c94040`

### 3.4 Prinsip Design Engineering & Interface Polish (`make-interfaces-feel-better`)

Untuk memastikan Pack Workbench terasa seperti software kreatif kelas atas (bukan web template kasar), seluruh komponen dan interaksi wajib mematuhi standar desain rekayasa berikut:

1. **Tipografi & Angka Tabular (`tabular-nums`)**:
   - Seluruh teks angka dinamis — koordinat kursor `(X, Y)`, dimensi kanvas `36 × 10 px`, metrik `Advance`, `Ascent`, `Height`, persentase komputasi SHA-1 streaming, dan hitungan temuan validator — **wajib** menggunakan `font-variant-numeric: tabular-nums` (`tabular-nums` di Tailwind). Hal ini mengeliminasi *layout shift* / getaran teks saat kursor digerakkan melintasi kanvas.
   - Menggunakan `text-wrap: balance` pada judul dialog, modal, dan section header.
   - Menggunakan `text-wrap: pretty` pada teks deskripsi error/warning validator untuk mencegah kata menggantung sendirian (*orphan words*).
   - Menambahkan `-webkit-font-smoothing: antialiased` pada root layout untuk ketajaman teks maksimal.

2. **Permukaan Konsentris & Struktur Border (`Surfaces & Radii`)**:
   - **Concentric Border Radius**: Setiap elemen bersarang wajib mematuhi rumus `outerRadius = innerRadius + padding`. Radius kartu di dalam panel atau tombol di dalam container tidak boleh berukuran sama sembarangan agar sudut tidak terlihat terjepit (*pinched*).
   - **Borders for Structure, Layered Shadows for Elevation**: Garis batas struktural 1px (`#3c3f54`) dikhususkan untuk partisi layout, divider panel, dan pemisah toolbar. Kedalaman mengambang (popover, modal, dropdown) dibangun dengan layered transparent shadow halus (`box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35)`), bukan sekadar menebalkan border.
   - **Image Outlines**: Seluruh preview sprite PNG, thumbnail badge, dan kanvas pratinjau diberi outline tipis 1px ber-opacity rendah (`rgba(255, 255, 255, 0.08)` atau `oklch(1 0 0 / 0.1)`). Ini mencegah piksel sprite yang gelap membaur kotor ke dalam permukaan panel `#262736`.
   - **Optical Alignment Over Geometric Centering**: Ikon di dalam tombol, segitiga preview/play, dan chevron expander diatur perataan optisnya secara manual, bukan hanya mengandalkan `justify-center items-center` geometris kaku.

3. **Mikro-Interaksi & Tactile Feedback (`Scale on Press`)**:
   - **Scale on Press (`scale(0.96)`)**: Seluruh tombol interaktif, tool dock icons, dan tab trigger mendapatkan umpan balik fisik saat ditekan (`active:scale-[0.96] transition-transform duration-100 ease-out`). Dilarang memakai skala di bawah `0.95` agar tidak berlebihan (*cartoonish*).
   - **Minimum Hit Area Desktop (>= 40×40px)**: Meskipun ukuran visual ikon rail alat berukuran ringkas (18–20px), area klik interaktif diperluas dengan padding atau pseudo-element minimal 40×40px untuk mencegah klik meleset saat desainer bekerja cepat. Antar-hit area tidak boleh saling tumpang tindih.

4. **Sistem Ikon: Font Awesome (Larangan Mutlak Lucide / Lucide React)**:
   - **Aturan Ketat**: Dilarang keras menggunakan `Lucide React` (maupun ketergantungan paket Lucide). Seluruh ikon antarmuka wajib bersumber dari **Font Awesome** (Font Awesome 6 SVG via `@fortawesome/vue-fontawesome` / SVG symbol system).
   - **Karakter & Konsistensi**: Seluruh kontrol alat (`fa-arrow-pointer`, `fa-pencil`, `fa-eraser`, `fa-eye-dropper`, `fa-palette`, `fa-magnifying-glass-plus`), panel layer (`fa-layer-group`, `fa-eye`, `fa-eye-slash`, `fa-lock`, `fa-trash-can`), status audit (`fa-circle-check`, `fa-triangle-exclamation`, `fa-circle-xmark`), dan tombol ekspor (`fa-file-zipper`) distandarkan dengan glif Font Awesome.
   - **One SVG recolored via `currentColor`**: Seluruh ikon menggunakan SVG tunggal dengan pewarnaan dinamis via CSS (`currentColor`), bukan memuat berkas SVG ganda untuk state hover/active. Varian regular/line untuk status default; varian solid/fill untuk menandai state aktif/terpilih.
   - **Optical Alignment & Weight**: Bobot visual ikon diselaraskan optis dengan teks font Onest pendampingnya (1.5px optical stroke untuk teks regular, solid fill untuk semibold/bold).
   - **Contextual Icon Animations**: Transisi toggle ikon (seperti visibilitas mata layer, kunci layer, atau copy-check) dianimasikan halus dengan `opacity` (0→1), `scale` (0.25→1), dan `blur` (4px→0px) menggunakan `cubic-bezier(0.2, 0, 0, 1)`.

5. **Motion Restraint & Ketegasan Transisi**:
   - **Motion Restraint**: Dilarang memasang animasi pada interaksi berfrekuensi tinggi (melukis kanvas piksel, hover kursor koordinat kanvas). Umpan balik kanvas harus 100% instan (0ms latency).
   - **Never `transition: all`**: Dilarang keras menulis `transition: all`. Selalu tentukan properti transisi secara spesifik (`transition-colors`, `transition-transform`, `transition-opacity`).
   - **Interruptible Transitions**: Semua transisi interaksi tombol dan hover dapat diinterupsi seketika saat kursor berpindah cepat. Durasi keluar (*exit transition*) dibuat lebih cepat dan lembut daripada durasi masuk (`duration-100 ease-out`).

---

## 4. Struktur Workspace Studio

Studio mengadopsi struktur panel terintegrasi desktop-grade:

```
+-----------------------------------------------------------------------------------------+
| TOP: Menu Bar + Project Toolbar (Namespace, Versi, Force Unicode, Undo/Redo, Export)   |
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
  - Force Unicode toggle.
  - Tombol Undo (`Ctrl+Z`) dan Redo (`Ctrl+Y`).
  - Tombol Utama: **Export Pack** (Pill `#9b73be` Amethyst Lavender tegas berteks kontras).

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
     - "New Rank Badge", "Export Pack ZIP", "Switch to TAB Preview", "Run Validator Audit", "Toggle Pixel Grid".
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
| **Tipografi** | Google Fonts API (`Onest` & `JetBrains Mono` Variable Fonts) | Terpasang | Variable fonts spesifik tinggi (`wght@300..800`), zero system-font fallback, OpenType tabular numbers. |
| **Ikon Sistem** | Font Awesome 6 (`@fortawesome/vue-fontawesome`) | **Ditetapkan** | Menggantikan Lucide secara mutlak; library ikon SVG terstandar industri dengan dukungan penuh Vue 3. |
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
7. **Interface Feel & Polish Terverifikasi (`make-interfaces-feel-better`)**:
   - Seluruh angka metrik dan koordinat dinamis memakai `tabular-nums` tanpa getaran layout shift.
   - Tombol dan kontrol aksi memiliki tactile feedback `active:scale-[0.96]`.
   - Hit area kontrol desktop minimal 40×40px.
   - Radius sudut elemen bersarang mematuhi aturan konsentris (`outerRadius = innerRadius + padding`).
   - Nol pemakaian `transition: all` (selalu spesifik `transition-colors`, `transition-transform`).
   - Pratinjau sprite memiliki outline 1px ber-opacity rendah agar tidak kabur ke permukaan panel.
