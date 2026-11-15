# PRD Fase 2 — Generator Font, Rank Badge, Ikon, & Negative Space

Status: DISETUJUI. Pilihan Q1–Q4 sudah terkunci (`implementation_plan.md`).  
Sumber kebenaran teknis adalah `docs/knowledge/` (`font-dan-glyph.md`, `bedrock-geyser.md`, `00-ringkasan-perbedaan-versi.md`, `99-pertanyaan-terbuka.md`, serta `java-*.md`). Jika terjadi konflik, `docs/knowledge/` selalu menang.

---

## 1. Tujuan

Alat web ini memadukan **Command Hub** ringkas (peluncur Validator Fase 1 dan Studio Fase 2) dengan editor **Rank & Glyph Studio** untuk Resource Pack Minecraft Java Edition. Di dalamnya tersedia penyusun provider `bitmap` dan `space`, komposer layer rank badge, serta sapuan piksel dasar (`Pensil`/`Penghapus`). Validator `F01`–`F10` memeriksa aturan sebelum ekspor. Simulasi GUI Scale `1–4` membantu peninjauan tata letak. Jika nol `ERROR`, arsip `.zip` final langsung terbungkus dan lolos validator Fase 1 beserta SHA-1 serta snippet plugin.

Fase ini memakai ulang fondasi Fase 1: tabel profil `src/core/versions.ts`, validator `zipRules.ts` dan `mcmetaRules.ts`, serta worker `src/workers/sha1.worker.ts`. Semua data diproses di browser.

---

## 2. Di luar cakupan (JANGAN dibuat di fase ini)

- Builder GUI DeluxeMenus, preview kontainer chest `176×222`, dan definisi item (`CustomModelData` / `items/*.json`) masuk ke Fase 3.
- Konverter model 3D, item, shader, serta Cumulus Forms Java ke Bedrock ditunda ke Fase 4, begitu pula ekspor dual-pack Bedrock karena Fase 2 dikunci pada Java Edition saja (`Q3`). Peringatan bentrok `U+E000–U+E1FF` tetap menyala.
- Backend, akun pengguna, dan analitik tidak dibuat.
- Aset vanilla Mojang (`default.png`, `ascii.png`, tekstur item, `client.jar`) serta paket ikon berhak cipta dilarang masuk ke repo atau ekspor. Ikon preset dan font mini `3×5` atau `5×5` dibuat prosedural di kode proyek.
- Editor tekstur penuh di luar cakupan. Fase 2 berfokus pada komposer layer rank badge (`Frame`, `Icon`, `Text`, `Shadow`), alat piksel dasar (`Pensil`/`Penghapus`), serta import `.png`.

---

## 3. Keputusan Dasar dan Jalur Terbuka

| Aspek | Ketetapan Terkunci |
| :--- | :--- |
| Arsitektur | Browser-only; gambar PNG pengguna tidak keluar ke jaringan. |
| Versi target | Enam profil Fase 1: `1.21.1`, `1.21.10`, `1.21.11`, `26.1.2`, `26.2`, `26.3` |
| Struktur `pack.mcmeta` | Dihasilkan otomatis sesuai profil terpilih (`pack_format: 34` atau `min_format`/`max_format`) |
| Bahasa UI default | Indonesia |
| Landing & Navigasi (`Q1`) | **Command Hub Utilitas** (dropzone cepat Validator Fase 1 + kartu Studio Fase 2 + matriks versi) terhubung ke **Studio 3-Panel**. |
| Kemampuan Editor (`Q2`) | **Rank & Layer Composer** (`Frame`, `Icon` sintetis / PNG, `Text` piksel mini, `Shadow`, `space`) + **Pixel Brush Dasar (`Pensil`, `Penghapus`)**. |
| Target Ekspor & Komponen (`Q3`) | **Java Edition saja + Peringatan Bedrock (`U+E000–U+E1FF`)**; sertakan builder opsional `"type": "object"` (`1.21.9+`); PNG codec murni tanpa dependensi luar. |
| Alur Target UI (`Q4`) | **`ui-taste` image-first → 1:1** (target visual dibuat dan ditinjau sebelum kode TSX ditulis). |

Seluruh keputusan pada Bagian 12 telah disetujui pemilik sehingga implementasi siap dijalankan.

---

## 4. Alur Builder Font, Rank Badge, dan Negative Space

### 4.1 Konfigurasi paket dan namespace

Pengguna memilih satu target versi Java, mengisi namespace valid (`a-z`, `0-9`, `_`, `.`, `-`), lalu menentukan nama berkas font (`assets/<ns>/font/default.json` atau kustom). Penamaan aset hasil rakitan otomatis mematuhi `ResourceLocation` agar terhindar dari peringatan `Z06`.

### 4.2 Penyusun provider `bitmap`, `space`, dan PUA

#### Provider `bitmap` (`BitmapProvider$Definition`)
Pengguna mengunggah gambar `.png` (badge `1×1` maupun sprite sheet `N kolom × M baris`), lalu menyetel `height` (integer opsional, default `8`), `ascent` (integer wajib `<= height`), dan kisi `chars`. Panjang tiap baris `chars` dihitung menurut jumlah codepoint Unicode (`String.codePoints()`), bukan unit UTF-16, supaya karakter non-BMP tidak terhitung ganda (`99-pertanyaan-terbuka.md #7`). Mesin kemudian membaca dimensi gambar serta memindai kolom piksel paling kanan dengan alpha atau luminance non-nol untuk menentukan `actualGlyphWidth`.

#### Alokasi codepoint PUA aman
Alokator otomatis memulai pengisian dari `U+E200` ke atas agar tidak menimpa zona `U+E000–U+E1FF` milik HUD dan kontroler Bedrock (`[SECONDARY: bedrock-geyser.md §2]`). Pengguna tetap bisa mengisi codepoint manual. Mesin langsung memantau tabrakan.

#### Provider `space` (`SpaceProvider$Definition`)
Pengguna memasukkan pemetaan karakter-ke-`advance` dalam tipe `float` bebas (misalnya `-8`, `-0.5`, `-200.25`, atau `4`). Sesuai `SpaceProvider$Definition` di jar `1.21.1` sampai `26.3`, codec menerima semua bilangan `float` tanpa batas `-1..1`. Nilai negatif atau di atas `32.0` tetap sah. Sistem hanya memberi catatan info karena mode `nonFishyGlyphs` melewatinya (`font-dan-glyph.md §1B`).

#### Komposer Rank Badge Berlapis & Pixel Brush Dasar
Selain mengimpor `.png` eksternal, pengguna dapat merakit rank badge di Studio dari tumpukan layer sintetis murni (`Frame`, `Icon` matriks piksel orisinal buatan proyek, `Text` memakai font piksel mini `3×5` / `5×5` orisinal, `Shadow`, serta layer piksel kustom yang diedit dengan **Pensil** dan **Penghapus**). Hasil komposisi langsung dirender menjadi raster PNG RGBA lewat modul `pixelSynth.ts` dan `pngCodec.ts` tanpa bergantung pada aset vanilla Mojang maupun DOM.

#### Opsional `object` text component (`1.21.9+`)
Untuk target `1.21.10`–`26.3`, panel snippet menyertakan pembuat komponen `"type": "object"` (`"atlas"` atau `"player"`) berukuran `8×8` tanpa PUA. Jika pengguna memilih target `1.21.1`, validator menolak pemakaian komponen `object` (`ERROR`). Pada target `1.21.11+`, panel memberi petunjuk pemisahan atlas agar sprite item merujuk `minecraft:items` sementara sprite blok merujuk `minecraft:blocks` (`java-1.21.11.md §2 & §6`).

### 4.3 Penyusun rank badge dan snippet

Pengguna merangkai urutan glyph dan karakter `space` negatif, misalnya untuk menumpuk latar pita bersama ikon pangkat lalu menarik kursor kembali. Alat ini menyusun tiga format siap salin:

- Perintah LuckPerms: `/lp group <grup> meta setprefix <weight> "<prefix>"` (`font-dan-glyph.md §4`)
- PlaceholderAPI `%luckperms_prefix%` beserta rujukan font `<ns>:<nama_font>`
- Komponen JSON `/tellraw` (plus bentuk `"type": "object"` bila `Q3` aktif)

---

## 5. Aturan Validasi Font dan Prefix (`F01`–`F10`)

Setiap aturan memakai ID tetap, tingkat keparahan (`ERROR`, `WARN`, `INFO`), pesan berbahasa Indonesia, petunjuk perbaikan konkret, dan rujukan ke `docs/knowledge/`. Fakta dari sumber komunitas atau yang belum diuji pada klien nyata wajib mempertahankan label `[SECONDARY]` atau `[UNVERIFIED]`.

| ID | Tingkat | Kondisi yang Diperiksa | Rujukan `docs/knowledge/` |
| :--- | :--- | :--- | :--- |
| `F01` | `ERROR` | `ascent > height` pada provider `bitmap` (ditolak langsung oleh `DataResult.error`) | `font-dan-glyph.md §1A` |
| `F02` | `ERROR` | Array `chars` kosong, baris pertama kosong, atau jumlah codepoint per baris tidak seragam (`validateDimensions`) | `font-dan-glyph.md §1A` |
| `F03` | `ERROR` | Berkas bukan PNG valid, gagal didekode, atau `width`/`height` tidak habis dibagi jumlah kolom/baris `chars` | `font-dan-glyph.md §1A` |
| `F04` | `WARN` / `INFO` | `WARN` jika codepoint muncul ganda dalam satu `bitmap` yang sama (menimpa entri lama disertai log vanilla); `INFO` bila duplikat terjadi antar-provider (`FontSet.activeProviders` mengambil yang lebih awal secara diam-diam) | `font-dan-glyph.md §2` & `java-1.21.11.md §4` |
| `F05` | `WARN` | Codepoint menimpa ASCII/rentang umum, atau menyentuh zona `U+E000–U+E1FF` milik kontroler/HUD Bedrock `[SECONDARY]` | `font-dan-glyph.md §2` & `bedrock-geyser.md §2` |
| `F06` | `ERROR` | Field `file` melanggar sintaks `Identifier` (`<ns>:<path>` dengan `[a-z0-9_.-]` dan `[a-z0-9/._-]`), tidak berakhiran `.png`, keliru menambahkan awalan `textures/` ganda, atau berkasnya absen di `assets/<ns>/textures/<path>` | `font-dan-glyph.md §1A` |
| `F07` | `INFO` | Entri `space.advances` bernilai `< 0.0` atau `> 32.0`: sah pada render normal (`anyGlyphs`), namun dilewati pada mode `nonFishyGlyphs` seperti teks acak `&k` (`FontSet.hasFishyAdvance`) | `font-dan-glyph.md §1B` |
| `F08` | `WARN` | Panjang string perintah atau teks hasil melampaui batas kotak chat vanilla `256` karakter (`MC-236960`) | `font-dan-glyph.md §4` |
| `F09` | `INFO` | `height > 8` dipakai pada konteks Chat, TAB, atau Nametag — berstatus **`[UNVERIFIED]`** karena batas maksimum tinggi sebelum baris terpotong atau bertumpuk belum diuji di klien & Paper modern | `font-dan-glyph.md §4` & `99-pertanyaan-terbuka.md #6` |
| `F10` | `ERROR` / `WARN` | *(Ditunda ekspornya di UI karena Fase 2 Java-only; tersedia sebagai fungsi uji murni di `fontRules.ts`)* `ERROR` bila lebar/tinggi sheet bukan kelipatan `16`; `WARN` bila latar tidak transparan penuh (`alpha = 0`) atau piksel menyentuh batas sel (**`[SECONDARY]`**) | `bedrock-geyser.md §2` |

*(Catatan opsional `Q3`: bila generator `"type": "object"` diikutkan, validator menolak pemakaiannya di target `1.21.1` yang belum mendukung fitur `1.21.9`, sekaligus mengingatkan pemisahan atlas `minecraft:items` vs `minecraft:blocks` untuk `1.21.11+`.)*

---

## 6. Rumus Preview Canvas dan Kebijakan GUI Scale `1–4`

Preview menghitung metrik glyph dari bytecode `BitmapProvider$Definition`, `GlyphBitmap`, `SpaceProvider$Definition`, `Window.calculateScale`, `Font$PreparedTextBuilder`, dan `BakedSheetGlyph` (`font-dan-glyph.md §1A & §3`):

```text
cellW   = Math.floor(imageWidth / cols)
cellH   = Math.floor(imageHeight / rows)
scale   = height / cellH
advance = Math.floor(0.5 + actualGlyphWidth * scale) + 1
top     = 7 - ascent
bottom  = top + height
```

Kursor `x` memakai `float` mentah. Nilainya terus bertambah lewat `x += glyphAdvance` tanpa pembulatan `Math.round` atau `Math.floor`, sama seperti `PreparedTextBuilder` dan `BakedSheetGlyph.render`. Tersedia kontrol GUI Scale `1` sampai `4`. Aktifkan sakelar **Force Unicode** untuk memaksa skala ganjil naik ke genap sesuai `Window.calculateScale`.

Status pratinjau masih berupa estimasi posisi. Peringatan wajib tampil di sebelah preview: simulasi GUI Scale `1–4` adalah **indikasi koordinat `float` dari bytecode, bukan jaminan bebas celah piksel GPU ataupun replikasi *Texture Filtering* `1.21.11+`**, karena hasil rasterisasi layar nyata tetap `[UNVERIFIED]` sebelum kalibrasi screenshot klien (`99-pertanyaan-terbuka.md #1`).

---

## 7. Ekspor Paket dan Integrasi Validator Fase 1

Saat unduhan dipicu, `packBuilder.ts` menyusun `pack.mcmeta` sesuai versi pilihan di `VERSION_PROFILES`, menulis `assets/<ns>/font/<nama>.json`, dan menyimpan seluruh tekstur `.png` di `assets/<ns>/textures/...`. Hasil ekspor Java langsung melewati `validateResourcePackZip` serta `src/workers/sha1.worker.ts` sehingga pengguna memperoleh status `0 ERROR`, hash SHA-1 40 karakter hex, dan snippet `server.properties`.

Sesuai keputusan pemilik (`Q3`: Java Edition saja), Fase 2 hanya mengekspor bundel Java Edition dan menunda pembuatan bundel Bedrock `.mcpack` ke Fase 4. Meski begitu, antarmuka tetap menampilkan catatan kompatibilitas bila proyek memakai `space` negatif, komponen `object`, atau codepoint `U+E000–U+E1FF` (`bedrock-geyser.md §2 & §5`).

---

## 8. Kontrak UI dan State Fase 2 (`ui-taste`)

### 8.1 Authority visual dan aksesibilitas

Fase 2 memakai jalur **Expand** dari shell Fase 1 (`bg-stone-950`, permukaan kartu `bg-stone-900`, aksen tunggal `emerald-*`, warna status `red`/`amber`/`sky` khusus temuan, nol gradien, nol glow, nol emoji chrome). Tata letaknya mengikuti arsitektur **Command Hub** plus ruang kerja editor tiga panel dengan alur **image-first → 1:1** (`Q4`). Target visual straight-on untuk halaman beranda dan layar studio dibuat terlebih dahulu sebelum penulisan TSX. Hasil render lalu dibandingkan pada ukuran piksel yang sama. Teks isi, label bantu, dan placeholder wajib mempertahankan rasio kontras minimum `4.5:1` (`stone-400` ke atas pada `stone-900`/`stone-950`), disertai ring `focus-visible` emerald `2px` pada kontrol interaktif.

### 8.2 Peta wilayah kerja

| Wilayah | Isi dan Peran Utama |
| :--- | :--- |
| Landing Hub & Header Bar (`48px`) | Gerbang ringkas berisi dropzone cepat Validator Fase 1, kartu peluncur Studio Fase 2, matriks versi `1.21.1`–`26.3`, switcher mode (`Beranda \| Validator \| Studio`), pemilih versi target, dan tombol `Ekspor ZIP`. |
| Panel Kiri (`Explorer`) | Rail alat piksel (`Pilih`, `Pensil`, `Penghapus`) plus daftar `Ranks / Glyphs / Space` dengan thumbnail mini, lencana `U+E2xx`, status konflik `F04`/`F05`, dan tombol tambah entri atau unggah PNG. |
| Panggung Tengah (`Center Stage`) | Switcher mode (`Canvas \| Preview In-Game \| JSON Split`), kontrol `GUI Scale 1–4` + *Force Unicode*, kanvas piksel `image-rendering: pixelated` di atas pola checkerboard gelap, overlay sel `cols × rows` & `actualGlyphWidth`, penguji string prefix (`Chat`, `TAB`, `Nametag`), plus banner `[UNVERIFIED]`. |
| Inspektor Kanan (`Inspector`) | Panel bertab **`Properti`** (`Frame`, `Icon` orisinal, `Text` piksel mini, `height`, `ascent`, `space` kiri/kanan, `chars`/PUA), **`Layer`** (tumpukan `Frame`, `Icon`, `Text`, `Shadow`, `Paint` plus kontrol visibilitas), dan **`Validasi & Ekspor`** (`F01`–`F09` & cek `object` 1.21.9+, snippet LuckPerms/PlaceholderAPI/`/tellraw`, hasil validator Fase 1, serta tombol unduh `.zip` + SHA-1). |

### 8.3 Daftar state antarmuka

| State | Kondisi Pemicu | Perilaku Antarmuka |
| :--- | :--- | :--- |
| `empty` | Belum ada sprite maupun entri `space` | Menampilkan panduan langkah awal mengunggah PNG kustom tanpa memuat aset vanilla. |
| `invalid-png` | Berkas bukan PNG atau dimensi tidak habis dibagi `chars` (`F03`) | Menolak entri rusak secara terarah dan menyebut ukuran kisi yang valid. |
| `validation-error` | Ditemukan minimal satu `ERROR` (`F01`, `F02`, `F03`, `F06`) | Menyorot kartu temuan beserta field penyebab sebelum ekspor dijalankan. |
| `conflict-warn` | Nol `ERROR`, ada `WARN`/`INFO` (`F04`, `F05`, `F07`–`F10`) | Tetap mengizinkan ekspor setelah menampilkan catatan risiko secara terbuka. |
| `ready-export` | Semua pemeriksaan lulus tanpa `ERROR` | Tombol unduh `.zip` aktif penuh dan siap menghasilkan arsip. |
| `exporting` | Proses perakitan ZIP dan Worker SHA-1 berjalan | Menampilkan `<progress>` streaming tanpa membekukan tab browser. |

---

## 9. Struktur Kode (Usulan)

```text
src/
  core/
    versions.ts                 # dipakai ulang dari Fase 1
    report.ts                   # dipakai ulang untuk validasi ZIP ekspor
    font/
      types.ts                  # tipe provider bitmap, space, rank layers, temuan F01-F10
      pngCodec.ts               # reader/writer PNG RGBA murni Node/Browser (DecompressionStream/CompressionStream)
      pixelSynth.ts             # font piksel mini orisinal, ikon matriks sintetis, komposisi layer rank
      bitmapMetrics.ts          # hitung cellW, cellH, scale, actualGlyphWidth, advance, top
      puaAllocator.ts           # alokasi U+E200+ & deteksi zona bentrok
      rules/
        fontRules.ts            # aturan murni F01-F10 + validasi object component 1.21.9+
      packBuilder.ts            # rakit font JSON, pack.mcmeta, dan ZIP via JSZip
  ui/
    LandingHub.tsx              # halaman pembuka Command Hub Utilitas
    studio/                     # komponen 3-Pane IDE Studio Fase 2 (tanpa logika validator)
tests/
  pngCodec.test.ts              # uji encoder/decoder PNG lintas filter & kompresi deflate
  bitmapMetrics.test.ts         # uji rumus metrik & sintesis layer rank
  fontRules.test.ts             # uji lolos & gagal F01-F10 beserta validasi object component
  packBuilder.test.ts           # round-trip ekspor ZIP lolos validator Fase 1
  helpers/
    syntheticPng.ts             # generator PNG RGBA sintetis di memori (tanpa aset Mojang)
```

Aturan inti wajib berjalan di Node tanpa impor Node-only statis yang memutus bundel Vite. Modul `src/core/font/` tetap murni TypeScript tanpa React atau DOM. Sebaliknya, `src/ui/` tidak menyimpan logika validator. `pngCodec.ts` memakai `DecompressionStream('deflate')` dan `CompressionStream('deflate')` bawaan Node 18+ dan browser modern sehingga nol dependensi luar ditambahkan.

---

## 10. Pengujian dan Kriteria Selesai

### 10.1 Tes otomatis (Vitest + PNG sintetis)

Setiap aturan `F01`–`F10` wajib memiliki minimal satu kasus lolos dan satu kasus gagal memakai PNG RGBA sintetis programatik:

1. Nilai `cellW`, `cellH`, `scale`, `actualGlyphWidth`, `advance`, dan `top` cocok tepat dengan rumus `BitmapProvider$Definition`.
2. Tabrakan codepoint di dalam satu PNG memicu `WARN` `F04`, sedangkan duplikasi antar-provider memicu `INFO` `F04`.
3. Nilai `space` negatif maupun desimal (`-8`, `-0.5`, `40`) lulus tanpa `ERROR`; angka `< 0` atau `> 32.0` hanya memicu `INFO` `F07`.
4. Arsip `.zip` hasil ekspor di semua enam profil versi (`1.21.1` hingga `26.3`) langsung lolos validator Fase 1 (`0 ERROR`), dengan SHA-1 identik terhadap `sha1Stream.ts`.

### 10.2 Uji manual wajib di klien nyata (dilakukan pemilik)

Uji klien nyata dilakukan pemilik sebelum Fase 2 ditutup. Langkah ini menutup celah `[UNVERIFIED]` pada `docs/knowledge/99-pertanyaan-terbuka.md`. Muat paket uji pada klien `1.21.1`, `1.21.10`, `1.21.11`, dan `26.3` untuk mengamati GUI Scale `1` sampai `4` (termasuk *Force Unicode* dan *Texture Filtering* `1.21.11+`), lalu catat kemunculan celah piksel (`#1`). Uji juga glyph ber-`height > 8` (misalnya `12` atau `16` px) di Chat, TAB, dan Nametag Paper untuk mencatat batas tinggi aman (`#6`). Catat setiap selisih ke dokumentasi proyek; pengujian bundel Bedrock GeyserMC ditunda sampai Fase 4.

---

## 11. Risiko dan Mitigasi

| Risiko | Mitigasi |
| :--- | :--- |
| Preview browser terlihat rapat tetapi klien memunculkan celah 1 px pada skala tertentu | Rumus memakai float mentah bytecode disertai disclaimer `[UNVERIFIED]` hingga uji screenshot klien selesai |
| Pembacaan `actualGlyphWidth` pada PNG ber-filter (Sub/Up/Average/Paeth) atau interlaced meleset di Node | Gunakan decoder PNG lengkap dengan uji filter di Vitest, atau ajukan pustaka kecil teraudit |
| Pemakaian codepoint `U+E000–U+E1FF` bentrok di server Geyser/Bedrock | Alokator default dimulai dari `U+E200`, ditambah peringatan `F05` bila rentang tersebut dipilih |
| Perubahan shader teks pada `26.2` dan `26.3` | Format pack mengikuti `versions.ts` Fase 1; catatan shader teks sudah terdokumentasi di `docs/knowledge/` |

---

## 12. Keputusan Terkunci (Disetujui Pemilik)

Keempat pilihan desain berikut telah diputuskan pemilik untuk Fase 2:

1. **Bentuk Landing (`Q1` — Agent decides):** **Command Hub Utilitas** tanpa halaman marketing. Halaman ini memuat dropzone cepat Validator Fase 1, kartu Studio Fase 2, matriks versi `1.21.1`–`26.3`, serta slot fase berikutnya.
2. **Kemampuan Editor (`Q2` — Agent decides):** **Rank & Layer Composer** (`Frame`, `Icon` sintetis atau PNG, `Text` piksel mini, `Shadow`, `space`) beserta alat **Pensil**, **Penghapus**, dan tampilan **Split JSON**.
3. **Target Ekspor & Komponen (`Q3` — "Java Edition dlu"):** Ekspor dibatasi ke Java Edition saja dengan peringatan Bedrock (`U+E000–U+E1FF`). Dual Export ditunda ke Fase 4. Builder opsional `"type": "object"` (`1.21.9+`) dan PNG codec `DecompressionStream`/`CompressionStream` tanpa dependensi luar ikut disertakan.
4. **Target Visual (`Q4` — "Oke"):** Alur **`ui-taste` image-first → 1:1** dijalankan lebih dulu untuk Command Hub dan layar studio sebelum kode TSX ditulis.
