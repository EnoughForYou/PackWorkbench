# Pack Workbench — Minecraft Java Resource Pack Studio & Validator

Dokumen spesifikasi komprehensif mengenai **Pack Workbench**: visi produk, masalah yang diselesaikan, arsitektur teknologi (*tech-stack*), komposisi UI/UX, sistem desain, serta peta jalan (*roadmap*) pengembangan.

---

## 1. Ringkasan Eksekutif & Visi Proyek

### 1.1 Apa itu Pack Workbench?
**Pack Workbench** adalah aplikasi web utilitas profesional berbasis peramban (*100% browser-only*) yang dirancang khusus untuk **kreator resource pack** dan **administrator server Minecraft Java Edition** (Paper, Purpur, Spigot, Fabric). 

Aplikasi ini menggabungkan dua lingkungan kerja utama:
1. **Validator & Auditor Resource Pack**: Memeriksa integritas arsip `.zip` dan kepatuhan sintaks metadata `pack.mcmeta` terhadap profil versi Minecraft Java (dari `1.21.1` hingga rilis modern `26.3`), mendeteksi bundle plugin, memverifikasi ketiadaan tekstur font, serta menghitung hash SHA-1 streaming untuk konfigurasi `server.properties`.
2. **Rank & Font Glyph Studio**: Lingkungan perancangan visual untuk menyusun badge pangkat (*rank badge*), font bitmap kustom, spasi negatif (*negative space font*), alokasi karakter Unicode PUA (*Private Use Area*) yang aman, serta simulasi pratinjau tampilan *in-game* (Chat, TAB list, Nametag) pada berbagai tingkat GUI Scale (1–4) tanpa memerlukan klien Minecraft yang menyala.

---

### 1.2 Masalah Nyata yang Diselesaikan

| Masalah yang Sering Dihadapi | Solusi di Pack Workbench |
| :--- | :--- |
| **Fragmentasi format metadata Mojang**<br>Mojang mengubah format `pack.mcmeta` dari bilangan tunggal `pack_format: 34` (`1.21.1`), beralih ke rentang `min_format` / `max_format` array `[major, minor]` (`1.21.10+`), melarang literal float (`84.0`), melarang `supported_formats > 64`, dan menggunakan format minor `[97, 1]` di `26.3`. Pack yang salah format ditolak atau dianggap usang oleh klien. | **Validator Presisi Bytecode (M01–M10)**<br>Memvalidasi struktur JSON secara ketat berdasarkan hasil dekompilasi kelas `PackFormat$IntermediaryFormat` Mojang langsung. Memberikan koreksi spesifik dan memperbaiki format secara otomatis saat ekspor. |
| **Server resource pack ditolak / crash**<br>Arsip ZIP terbungkus folder ganda, terdapat berkas sampah OS (`__MACOSX`, `.DS_Store`), nama path melanggar `ResourceLocation` (huruf kapital, spasi), ukuran melebihi batas unduhan server 250 MiB, atau file korup. | **Inspeksi Struktur ZIP Mendalam (Z01–Z12)**<br>Mendeteksi folder wrapper, sampah OS, path ilegal, duplikasi case-insensitive, bundle plugin tak sengaja terarsip (`Z10`), berkas font merujuk tekstur yang hilang (`Z11`), dan artefak tinggi glyph ilegal (`Z12`). |
| **Perhitungan SHA-1 manual yang merepotkan**<br>Admin server harus mengunggah file ke web pihak ketiga atau membuka terminal CLI untuk menghitung hash SHA-1 40-karakter untuk diisikan ke `server.properties`. | **Web Worker SHA-1 Streaming**<br>Menghitung hash SHA-1 secara lokal di browser per pecahan 4 MiB tanpa membekukan antarmuka, langsung menghasilkan baris konfigurasi siap salin (`resource-pack-sha1=` dan `resource-pack=`). |
| **Bentrok karakter Unicode PUA**<br>Banyak kreator menggunakan slot `\uE000`–`\uE1FF` yang tanpa disadari bertabrakan dengan karakter bawaan controller HUD Bedrock Edition (GeyserMC) atau tertimpa oleh font lain. | **Alokator PUA Cerdas (`U+E200+`)**<br>Mengotomatiskan alokasi codepoint mulai dari `U+E200` ke atas (menghindari zona risiko Bedrock), memantau bentrok karakter internal, dan menyediakan konfigurasi padding otomatis. |
| **Ketergantungan pada uji coba in-game berulang**<br>Setiap kali mengedit badge, kreator harus me-reload pack di game (`F3+T`), mengetik pesan di chat, dan mengubah GUI scale manual untuk melihat apakah ada celah piksel (*pixel seam*) atau teks kepanjangan. | **Simulasi Multi-GUI Scale & Kursor Float**<br>Pratinjau langsung di peramban yang meniru rendering engine teks Minecraft (`BakedSheetGlyph` dan kursor `float` mentah) pada GUI Scale 1, 2, 3, dan 4 untuk Chat (dengan cek batas 256 karakter MC-236960), TAB List, dan Nametag. |
| **Integrasi plugin server yang berbelit**<br>Harus merangkai string PlaceholderAPI, LuckPerms prefix, konfigurasi YAML Oraxen, ItemsAdder, dan Nexo secara manual dari awal. | **Generator Cuplikan Multi-Target**<br>Sekali klik mengekspor konfigurasi siap pakai untuk LuckPerms, PlaceholderAPI, `/tellraw`, TAB plugin, serta YAML bundle untuk Nexo, Oraxen, dan ItemsAdder. |

---

### 1.3 Nilai Inti & Filosofi Desain

1. **100% Client-Side Execution (Privasi & Kecepatan)**  
   Semua file `.zip`, gambar PNG, dan teks diproses seutuhnya di memori browser pengguna melalui JavaScript/WebAssembly/Web Worker. Tidak ada backend server, tidak ada penyimpanan berkas pengguna di cloud, tidak ada pelacakan analitik invasif, dan dapat dijalankan secara offline.
2. **Integritas Sumber Kebenaran (Ground Truth)**  
   Aturan tidak dibuat berdasarkan asumsi atau artikel komunitas usang. Seluruh logika validasi dan rendering bersumber langsung dari verifikasi primer dekompilasi bytecode `client.jar` Mojang resmi (`docs/knowledge/`). Setiap aturan memiliki ID unik (`Z01–Z12`, `M01–M10`, `F01–F10`) dan rujukan dokumen pembuktian.
3. **Nol Aset Vanilla Mojang (Zero Vanilla Assets)**  
   Demi kepatuhan lisensi dan kebersihan distribusi, repositori dan hasil ekspor sama sekali tidak menyertakan aset hak cipta Mojang (`default.png`, font bawaan jar, dll.). Ikon geometris (perisai, mahkota, bintang, pedang), frame, dan font mini (`3×5`, `5×5`) dihasilkan secara sintetis prosedural murni (*pixel-art procedural synthesis*).
4. **Fungsional, Rapat, & Presisi Teknis**  
   Antarmuka berfokus pada efisiensi kerja tinggi layaknya IDE profesional: tanpa teks pemasaran berlebihan, tanpa gradien dekoratif murahan, dengan kontras warna terkalibrasi, feedback instan, dan navigasi keyboard yang mulus.

---

## 2. Arsitektur & Tech-Stack

Arsitektur aplikasi dipisahkan secara tegas antara **Core Engine murni** (tanpa dependensi UI) dan **Presentation Layer** modern.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PRESENTATION & UI LAYER (Nuxt 4 SPA)                 │
│  ┌──────────────────────┬──────────────────────┬────────────────────┐  │
│  │   Beranda (Index)    │   Studio Workbench   │  Dokumentasi/About │  │
│  │    (Command Hub)     │   (Rank & Validator) │   (Knowledge Base) │  │
│  └──────────────────────┴──────────────────────┴────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Component Library: shadcn-vue + Reka UI + Tailwind CSS v4        │  │
│  │ State Management: Pinia Store (@pinia/nuxt)                      │  │
│  │ Icons: @lucide/vue | Fonts: Google Fonts (Onest & JetBrains Mono)│  │
│  └──────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│                       BACKGROUND WORKER LAYER                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ src/workers/sha1.worker.ts (Web Worker: @noble/hashes per 4 MiB) │  │
│  └──────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│              CORE DOMAIN ENGINE (src/core/ — Pure TypeScript)          │
│  ┌───────────────────┬───────────────────┬──────────────────────────┐  │
│  │ versions.ts       │ mcmeta.ts         │ zipReader.ts             │  │
│  │ (Matriks Versi)   │ (Parser Codec)    │ (Ekstraksi Arsip JSZip)  │  │
│  ├───────────────────┼───────────────────┼──────────────────────────┤  │
│  │ rules/zipRules.ts │ rules/mcmetaRules │ rules/fontRules.ts       │  │
│  │ (Aturan Z01–Z12)  │ (Aturan M01–M10)  │ (Aturan F01–F10)         │  │
│  ├───────────────────┼───────────────────┼──────────────────────────┤  │
│  │ pngCodec.ts       │ pixelSynth.ts     │ bitmapMetrics.ts         │  │
│  │ (Native Streams)  │ (Sintesis Layer)  │ (Simulasi Matriks GPU)   │  │
│  ├───────────────────┼───────────────────┼──────────────────────────┤  │
│  │ puaAllocator.ts   │ packBuilder.ts    │ report.ts / sha1Stream   │  │
│  │ (Manajemen PUA)   │ (Perakit ZIP/JSON)│ (Format Hasil Validasi)  │  │
│  └───────────────────┴───────────────────┴──────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Rincian Pustaka & Komponen Teknologi

| Bagian | Teknologi / Pustaka | Versi | Peran & Alasan Pemilihan |
| :--- | :--- | :--- | :--- |
| **Framework Utama** | **Nuxt 4** | `^4.6.4` | Berjalan dalam mode SPA statis (`ssr: false`, `nuxt generate`), menghasilkan artefak statis tanpa server backend Node.js. |
| **UI Framework** | **Vue 3** | `^3.5.45` | Reaktivitas terperinci (*fine-grained reactivity*) dengan Composition API dan TypeScript penuh. |
| **State Management** | **Pinia** | `^4.1.0` | Pengelolaan status global proyek (kanvas rank, riwayat undo/redo, status validasi, profil versi terpilih). |
| **Desain & Styling** | **Tailwind CSS v4** | `^4.1.0` | Mesin CSS generasi baru berbasis `@tailwindcss/vite` untuk build ultra-cepat dan styling atomic. |
| **Sistem Komponen** | **shadcn-vue** / **Reka UI** | `^2.11.0` | Komponen antarmuka headless yang dapat disesuaikan penuh: `ResizablePanelGroup`, `Tabs`, `ToggleGroup`, `DropdownMenu`, `Select`, `Dialog`, `Tooltip`, `Slider`, `Switch`. |
| **Ikonografi** | **Lucide Vue** | `^1.72.0` | Ikon SVG berbobot ringan, konsisten, dan ekspresif. |
| **Tipografi** | **Google Fonts API** | — | `Onest` (antarmuka modern, keterbacaan tinggi) + `JetBrains Mono` (angka tabular untuk data teknis, hex, JSON, dan koordinat). |
| **Manipulasi ZIP** | **JSZip** | `^3.10.1` | Membaca struktur ZIP di memori dan mengemas resource pack baru langsung di browser. |
| **Kriptografi SHA-1** | **@noble/hashes** | `^1.8.0` | Implementasi hashing SHA-1 streaming yang sangat cepat dan ringan, dipanggil di Web Worker per chunk 4 MiB. |
| **Codec PNG Murni** | **Web Native Streams** | Native | Menggunakan `CompressionStream('deflate')` dan `DecompressionStream('deflate')` bawaan peramban modern untuk encode/decode PNG RGBA tanpa dependensi pihak ketiga. |
| **Testing Engine** | **Vitest** | `^3.1.0` | Runner pengujian otomatis unit test (67 test suite hijau) yang berjalan di lingkungan Node tanpa browser headless. |
| **Type Checking** | **TypeScript & vue-tsc** | `^5.8.0` | Validasi tipe data ketat (*strict mode*), `noUncheckedIndexedAccess: true`, memastikan zero runtime type error. |

---

## 3. Komposisi UI/UX & Desain Visual

Desain visual Pack Workbench mengusung estetika **Dark Obsidian Studio** dengan aksen **Burnt Orange**, terinspirasi dari standar perkakas profesional industri game (*Blender*, *Figma*, *IntelliJ*).

### 3.1 Token Warna & Hirarki Visual

| Token / Elemen | Nilai Hex | Peran Antarmuka |
| :--- | :--- | :--- |
| **Canvas Background** | `#0b0b0e` | Latar belakang dasar aplikasi (gelap pekat, nyaman di mata). |
| **Panel Surface** | `#111115` | Permukaan panel kerja (sidebar, panggung tengah, inspektor). |
| **Elevated Surface** | `#16161c` / `#1d1d25` | Kartu elevasi, input field, baris list terpilih, dan hover kontrol. |
| **Border Hairline** | `#202028` | Garis batas tipis 1px pemisah panel (*resizable divider*, header, pemisah grup). |
| **Primary Accent** | `#ff5e2c` | Tombol aksi utama (CTA), indikator tab aktif, penanda fokus, slider fill. |
| **Accent Foreground** | `#110a07` | Warna teks kontras di atas elemen berlatar burnt orange. |
| **Primary Text** | `#f4f4f6` | Teks judul, label penting, nilai metrik, dan keluaran kode. |
| **Muted Text** | `#9b9ba6` | Label keterangan, placeholder, deskripsi aturan, dan metadata. |
| **Status: ERROR** | `#ef4444` | Indikator pelanggaran fatal yang membatalkan ekspor atau ditolak klien. |
| **Status: PERINGATAN** | `#f59e0b` | Indikator kejanggalan format yang berisiko tapi masih dimuat game. |
| **Status: LOLOS / AMAN**| `#22c55e` | Status keberhasilan validasi, kompatibilitas penuh, atau slot PUA aman. |
| **Status: UNVERIFIED** | `#38bdf8` | Penanda transparan untuk fitur/metrik yang belum diverifikasi di klien nyata. |

---

### 3.2 Tipografi & Perilaku Teks

- **Sans-Serif (`Onest`)**: Digunakan untuk elemen antarmuka, tombol, judul section, navigasi, dan dialog. Memiliki proporsi huruf yang seimbang dan tracking rapat (`tracking-tight`) untuk nuansa modern dan kokoh.
- **Monospace (`JetBrains Mono`)**: Diterapkan secara ketat pada semua angka, koordinat piksel `(x, y)`, codepoint Unicode (`U+E200`), token JSON, hash SHA-1, dan cuplikan perintah konsol dengan fitur `font-variant-numeric: tabular-nums` agar lebar karakter seragam dan tidak berguncang saat nilai berubah.

---

### 3.3 Struktur Navigasi & Arsitektur Halaman

Aplikasi menggunakan struktur navigasi ramping dengan **tiga rute utama** pada navbar:

```
[Pack Workbench Logo]      [Beranda]    [Studio]    [About]         [Target: 26.3 ▼]
```

#### 1. Halaman Beranda (`/`) — Command Hub
Dirancang sebagai gerbang kerja cepat dan etalase fungsional:
- **Hero Asimetris**: Dilengkapi *Interactive Workbench Preview* hidup yang menampilkan rank badge sintetis orisinal (`ADMIN`, `VIP`, `MOD`) dengan kanvas interaktif dan tab kode JSON provider.
- **Jalur Akses Cepat**: Dua tombol jalur langsung: *Buka Studio Rank* atau *Jatuhkan ZIP ke Validator*.
- **Matriks Kompatibilitas Versi**: Tabel komprehensif yang membandingkan parameter teknis antar-versi (`1.21.1`, `1.21.10`, `1.21.11`, `26.1.2`, `26.2`, `26.3`) meliputi: format pack, penanganan CustomModelData, arsitektur atlas, dan variasi core shader.
- **Peta Jalan Modul**: Menampilkan status fase aktif dan fase mendatang.

#### 2. Halaman Studio (`/studio`) — Workspace Utama
Halaman kerja 100vh tanpa scrollbar luar pada desktop (memakai pembagi panel fleksibel `ResizablePanelGroup`), mendukung alur vertikal yang nyaman di layar ponsel/tablet:

##### A. Sub-Mode: Rank & Glyph Studio
- **Tool Dock Rail (Sisi Kiri Sempit)**:
  - Tombol alat: *Select / Inspect* (V), *Pensil Piksel* (B), *Penghapus* (E), *Paint Bucket*.
  - Palet warna cepat (16 warna tema chat Minecraft standar + color picker kustom).
  - Kontrol Zoom kanvas (100% hingga 1600%) dan toggle grid piksel.
- **Rank Explorer Sidebar (Panel Kiri)**:
  - Daftar rank badge yang sedang dibuat dalam proyek (misal: `ADMIN`, `VIP`, `MOD`, `OWNER`).
  - Menampilkan badge codepoint Unicode aktif (`U+E200`, `U+E201`, dst.) dan status validitas.
  - Tombol *+ Tambah Rank Baru* dan *Import Sprite Sheet PNG*.
- **Center Stage Canvas (Area Tengah)**:
  - Kanvas penyuntingan piksel resolusi tinggi dengan feedback kursor interaktif.
  - Switcher tampilan atas: *Kanvas Piksel*, *Split View (Kanvas + JSON)*, dan *Pratinjau Layar Penuh*.
  - Status bar bawah (28px): Menampilkan koordinat kursor, ukuran sel (`cellW × cellH`), `actualGlyphWidth`, `ascent`, dan label `[UNVERIFIED]` pada simulasi rasterisasi.
- **Inspector Panel (Panel Kanan)**:
  - **Live In-Game Viewport (Kanan Atas)**: Pratinjau waktu nyata yang merender teks Minecraft dengan tekstur gelap khas menu game, mendukung pengujian pada **Chat** (dengan deteksi limit 256 karakter), **TAB list baris nama**, dan **Player Nametag floating**. Dilengkapi tombol pengalih **GUI Scale 1, 2, 3, dan 4**.
  - **Tab Properti**: Pengaturan teks badge, pilihan font miniatur (`3×5` ultra-compact atau `5×5` standar), tipe frame (Pill, Outline, Ribbon, Flat), padding horizontal/vertikal, serta pengaturan offset `ascent`/`height`.
  - **Tab Layer**: Manajemen layer tumpuk (*Frame*, *Icon*, *Text*, *Shadow*, *Manual Paint*) dengan kemampuan toggle visibilitas dan opasitas.
  - **Tab Validasi & Ekspor**: Menampilkan hasil audit instan aturan `F01–F10`, generator snippet teks (LuckPerms, TAB, /tellraw), dan tombol ekspor `.zip` langsung.

##### B. Sub-Mode: Validator ZIP & SHA-1
- **Panel Input & Target (Kiri)**:
  - Dropzone drag-and-drop file `.zip` resource pack.
  - Selector profil versi target Java (`1.21.1` sampai `26.3`).
  - Bar progres komputasi hash SHA-1 streaming.
  - Opsi toggle pembentukan cuplikan `server.properties` (`require-resource-pack`, prompt, dsb.).
- **Panel Audit & Hasil (Kanan)**:
  - Ringkasan status keseluruhan: Jumlah `ERROR`, `PERINGATAN`, dan `INFO`.
  - Daftar temuan terstruktur: Tiap temuan menampilkan ID aturan (misal `Z01`, `M03`), badge tingkat keparahan, penjelasan akar masalah, dan langkah perbaikan teknis dalam bahasa Indonesia.
  - Kotak salin cuplikan `server.properties` dan hash SHA-1 40-karakter.

#### 3. Halaman About / Dokumentasi (`/about`)
- Dokumentasi acuan teknis berdasar audit `docs/knowledge/`.
- Penjelasan detail mengenai keamanan data (100% lokal peramban).
- Rincian tabel teknologi yang digunakan.

---

## 4. Matriks Validasi & Aturan Teknis

Setiap aturan dalam sistem validasi memiliki kodefikasi baku:

### 4.1 Aturan Struktur ZIP (`Z01`–`Z12`)

| ID | Level | Deskripsi Aturan | Referensi Sumber |
| :---: | :---: | :--- | :--- |
| **Z01** | `ERROR` | `pack.mcmeta` wajib berada di root direktori arsip ZIP. | Standar Resource Pack Vanilla |
| **Z02** | `ERROR` | `pack.mcmeta` terdeteksi di dalam subfolder induk (kesalahan umum zip folder). | Analisis struktur kompresi |
| **Z03** | `ERROR` | Berkas ZIP korup atau bukan arsip ZIP yang valid. | Header `PK\x03\x04` |
| **Z04** | `WARN` | Folder `assets/` tidak ditemukan di dalam arsip. | Standar Resource Pack Vanilla |
| **Z05** | `WARN` | Terdapat berkas sampah sistem operasi (`__MACOSX`, `.DS_Store`, `Thumbs.db`, `desktop.ini`). | Pembersihan file OS |
| **Z06** | `WARN` | Nama file atau folder di bawah `assets/` memuat huruf kapital, spasi, atau karakter non-`ResourceLocation` (`[a-z0-9_.-]`). | Vanilla `ResourceLocation` validation |
| **Z07** | `WARN` | Dua file berbeda hanya pada kapitalisasi nama (berbahaya di sistem case-insensitive). | Kompatibilitas Windows/Linux |
| **Z08** | `WARN` | Ukuran total arsip melebihi 250 MiB (batas mutlak `DownloadedPackSource` server vanilla). | `DownloadedPackSource$4.class` |
| **Z09** | `INFO` | Ikon `pack.png` tidak ditemukan di root arsip (game akan memakai ikon default). | Standar Resource Pack |
| **Z10** | `WARN` | Terdeteksi file konfigurasi plugin server (`itemsadder`, `oraxen`, `nexo`) atau ZIP bersarang di dalam pack. | Pemisahan client-pack vs plugin data |
| **Z11** | `WARN` | Berkas `font/*.json` merujuk path tekstur yang tidak ada di dalam folder `textures/`. | Audit integritas font |
| **Z12** | `WARN` | Entri provider font memiliki nilai `height <= 0` atau memetakan karakter ke area non-PUA yang berisiko. | Runtime safe glyph check |

### 4.2 Aturan Metadata `pack.mcmeta` (`M01`–`M10`)

| ID | Level | Deskripsi Aturan | Referensi Sumber |
| :---: | :---: | :--- | :--- |
| **M01** | `ERROR` | Berkas `pack.mcmeta` tidak berformat JSON valid. | JSON Parser Codec |
| **M02** | `ERROR` | Objek root tidak memiliki properti `"pack"`. | `PackFormat.class` |
| **M03** | `ERROR` | Nilai `pack_format` / `min_format` / `max_format` mengandung angka float (misal `84.0` atau `97.1`), wajib integer atau array integer `[major, minor]`. | `ExtraCodecs.NON_NEGATIVE_INT` |
| **M04** | `ERROR` | Pasangan `min_format` dan `max_format` tidak lengkap (salah satu hilang). | `PackFormat$IntermediaryFormat` |
| **M05** | `ERROR` | Pada profil `1.21.10+` (`major > 64`), `supported_formats` dilarang digunakan. | `PackFormat.java` (`lastPreMinorVersion = 64`) |
| **M06** | `ERROR` | Mode legacy (`pack_format` tunggal) digunakan untuk versi dengan format di atas 64. | Codec Mojang modern |
| **M07** | `ERROR` | Pack lintas era (`min <= 64` dan `max >= 65`) tidak menyertakan `supported_formats` atau `pack_format` legacy. | Kompatibilitas lintas era Mojang |
| **M08** | `ERROR` | Format yang dideklarasikan tidak mencakup versi target yang dipilih. | `PackCompatibility.forVersion` |
| **M09** | `WARN` | Properti `description` tidak ditemukan di dalam objek `pack`. | Standar tampilan GUI pack |
| **M10** | `INFO` | Format metadata sudah sepenuhnya valid dan optimal untuk versi target. | Evaluasi profil versi |

### 4.3 Aturan Font & Rank Badge (`F01`–`F10`)

| ID | Level | Deskripsi Aturan | Referensi Sumber |
| :---: | :---: | :--- | :--- |
| **F01** | `ERROR` | Codepoint karakter kosong atau tidak valid. | Unicode Standard |
| **F02** | `WARN` | Codepoint berada di rentang `U+E000`–`U+E1FF` (zona bentrok HUD & kontroler Bedrock/Geyser). | `bedrock-geyser.md` |
| **F03** | `ERROR` | Terjadi tabrakan (*collision*) codepoint ganda pada font provider yang sama. | `BitmapProvider.class` |
| **F04** | `WARN` | Dimensi gambar PNG bukan kelipatan integer atau melebihi rasio wajar. | Rasio aspek sprite sheet |
| **F05** | `WARN` | Nilai `ascent` lebih besar daripada nilai `height`. | `BitmapProvider$Definition` |
| **F06** | `INFO` | Nilai advance pada provider `space` bernilai negatif atau melebihi `32.0` (*fishy advance*). | `FontSet.hasFishyAdvance` |
| **F07** | `WARN` | Panjang teks rank badge berisiko menyebabkan pesan chat melebihi batas 256 karakter (`MC-236960`). | Standar protokol Chat packet |
| **F08** | `WARN` | Karakter menggunakan representasi surrogate pair yang tidak seragam. | Unicode UTF-16 vs Codepoint |
| **F09** | `INFO` | Format font memanfaatkan fitur objek modern (`"type": "object"`, `1.21.9+`). | Format font modern Java |
| **F10** | `INFO` | Konfigurasi layer dan metrik font telah terverifikasi aman untuk diekspor. | Pack Builder verification |

---

## 5. Profil Versi Minecraft Java yang Didukung

Aplikasi mengisolasi konfigurasi versi dalam `src/core/versions.ts` sehingga penambahan versi baru di masa mendatang tidak merusak logika validasi.

| Versi Java | Status Rilis | Resource Format (`version.json`) | Gaya Metadata `pack.mcmeta` | Catatan Arsitektur Penting |
| :--- | :--- | :---: | :---: | :--- |
| **1.21.1** | Rilis Resmi | `34` | Legacy: `pack_format: 34` | Java 21, `CustomModelData` berupa int tunggal, 14 atlas (`item/` di dalam `blocks.json`). |
| **1.21.10** | Rilis Resmi | `[69, 0]` | Rentang: `min_format` / `max_format` | Era baru `pack_format`, `supported_formats` dilarang jika format > 64, model 4-list. |
| **1.21.11** | Rilis Resmi | `[75, 0]` | Rentang: `min_format` / `max_format` | Pemisahan atlas: `atlases/items.json` dan `celestials.json` resmi terpisah. |
| **26.1.2** | Rilis Resmi | `[84, 0]` | Rentang: `min_format` / `max_format` | Java 25, beralih ke un-obfuscated jar, penambahan renderer `end_cube`. |
| **26.2** | Rilis Resmi | `[88, 0]` | Rentang: `min_format` / `max_format` | Atlas disederhanakan (14 atlas, penghapusan `beds.json` & `signs.json`). |
| **26.3** | Rilis Resmi | `[97, 1]` | Rentang: `min_format: [97, 1]` | Format minor pertama bernilai `1`, relokasi palet trim ke `textures/palettes/trim/`. |

---

## 6. Peta Jalan Pengembangan (*Roadmap*)

```
┌────────────────────────────────────────────────────────────────────────┐
│ [FASE 1] — CORE VALIDATOR & SHA-1 STREAMING               [SELESAI ✅]  │
│ - Parser pack.mcmeta & aturan M01–M10                                  │
│ - Pembaca struktur ZIP & aturan Z01–Z09, Z10–Z12                       │
│ - Web Worker SHA-1 Streaming (4 MiB chunks) & snippet server.properties │
├────────────────────────────────────────────────────────────────────────┤
│ [FASE 2] — STUDIO FONT, RANK BADGE, & NEGATIVE SPACE      [SELESAI ✅]  │
│ - Komposer layer rank prosedural (Frame, Icon, Text 3x5/5x5, Shadow)    │
│ - Editor kanvas piksel (Pensil, Penghapus, Paint Fill, Undo/Redo)       │
│ - Alokator Unicode PUA aman (U+E200+) & Provider Space                 │
│ - Live In-Game Preview (Chat, TAB, Nametag) pada GUI Scale 1–4         │
│ - Pengecekan aturan F01–F10 & Ekspor ZIP multi-plugin (LP/TAB/Nexo)    │
├────────────────────────────────────────────────────────────────────────┤
│ [FASE 3] — DELUXEMENUS BUILDER & CUSTOM MODEL DATA        [TERKUNCI 🔒] │
│ - Builder GUI Menu Interaktif (Chest Container 176×222 px)             │
│ - Generator Item Model JSON modern (assets/<ns>/items/*.json)          │
│ - Manajemen komponen CustomModelData 4-list (floats, flags, strings)   │
├────────────────────────────────────────────────────────────────────────┤
│ [FASE 4] — KONVERTER RESOURCE PACK JAVA KE BEDROCK        [TERKUNCI 🔒] │
│ - Konversi otomatis atlas tekstur & font bitmap ke Bedrock glyph_XX    │
│ - Integrasi mapping GeyserMC / Floodgate                               │
│ - Dual-pack exporter (Java .zip + Bedrock .mcpack)                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Cara Menjalankan & Menguji Proyek

### 7.1 Kebutuhan Lingkungan
- Node.js: `>= 18.3.0` (Direkomendasikan Node.js 20 LTS atau 22+).
- Paket Manajer: `npm`.

### 7.2 Perintah Operasional

```bash
# 1. Menginstal dependensi proyek
npm install

# 2. Menjalankan server pengembangan lokal (Nuxt 4 Vite)
npm run dev

# 3. Menjalankan seluruh rangkaian tes otomatis (Vitest)
npm test

# 4. Melakukan audit tipe TypeScript ketat
npm run typecheck

# 5. Membangun build produksi statis (100% Client-Side SPA)
npm run generate

# 6. Menjalankan pratinjau hasil build statis secara lokal
npm run preview
```

---

## 8. Ringkasan Batasan & Larangan Keras

Sesuai ketetapan pada `AGENTS.md` dan `PRODUCT.md`:
- **Dilarang keras menyertakan aset vanilla Mojang** dalam bentuk file mentah, fixture, build, maupun commit repository.
- **Dilarang mengunggah berkas pengguna ke server jaringan manapun**. Semua operasi parsing, decoding PNG, komputasi SHA-1, dan pembentukan ZIP harus tetap berada di peramban pengguna.
- **Dilarang mengarang fakta teknis Minecraft**. Semua fakta wajib mengacu pada pembuktian primer di `docs/knowledge/`. Fakta yang belum diuji di klien game asli wajib mempertahankan label `[UNVERIFIED]`.
