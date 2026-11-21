# Design System: Pack Workbench (Nuxt + shadcn-vue)

Sistem visual aplikasi web Pack Workbench (`/` Beranda, `/studio` Studio & Validator, `/about` Dokumentasi).

## 1. Filosofi & Karakter

- **Desktop-Only Creative Workstation**: Ditujukan khusus untuk layar kerja desktop (lebar minimum 1280px). Tidak menyediakan layout ponsel atau adaptasi tablet.
- **Karakter Studio Retro**: Mengadopsi estetika workstation kreatif (Aseprite, pixel editors) dengan tangga elevasi permukaan yang jelas dan bebas dari elemen dekoratif atau gradien pemasaran generik.
- **Interaksi Taktis**: Respon visual instan (0ms) untuk tindakan kanvas piksel, tactile feedback saat tombol ditekan (`active:scale-[0.96]`), dan garis batas hairline 1px yang membagi panel secara terstruktur.

## 2. Palet Warna ("Aseprite Retro Studio")

Token warna semantik terdefinisi di `app/assets/css/tailwind.css` dan dipetakan ke variabel CSS:

| Token / Variabel | Nilai Hex | Peruntukan |
| :--- | :--- | :--- |
| Canvas dasar (`--background`) | `#1e1f29` | Area kanvas kerja, latar Beranda, dan baris atas Studio |
| Permukaan panel (`--card`, `--panel`) | `#262736` | Permukaan panel samping (Explorer, Inspector), toolbar, kartu konten |
| Permukaan elevasi (`--popover`, `--elevated`) | `#303244` | Dropdown, popover palet warna, floating dialog |
| Garis batas (`--border`, `--input`) | `#3c3f54` | Garis pembagi 1px antar-panel, border input, pemisah tabel |
| Latar muted (`--muted`) | `#2b2c3d` | Latar input form tidak aktif, track progress, background badge netral |
| Teks utama (`--foreground`) | `#f0f1f5` | Judul, teks label aktif, koordinat piksel, metrik glyph |
| Teks sekunder (`--muted-foreground`) | `#9da0b8` | Keterangan metrik, hint shortcut keyboard, teks bantuan |
| Aksen utama (`--primary`) | `#9b73be` | Tombol aksi utama (Amethyst Lavender), indikator aktif, selection border |
| Teks di atas aksen (`--primary-foreground`) | `#0e0f14` | Teks kontras tinggi pekat di atas tombol aksi `#9b73be` |

### Warna Semantik Status
- **Error / Destruktif (`--destructive`)**: `#e05252` (temuan `ERROR` validator, tombol hapus layer).
- **Warning / Unverified (`--warning`)**: `#f59e0b` (temuan `WARN` validator, label status `[UNVERIFIED]`).
- **Success / Pass (`--success`)**: `#22c55e` (arsip valid `0 ERROR`, kalkulasi SHA-1 selesai).
- **Info**: `#38bdf8` (panduan informasi, penanda lebar glyph di status bar).

## 3. Tipografi (Google Fonts API)

Dilarang menggunakan font sistem default. Seluruh teks menggunakan Variable Fonts yang dimuat melalui Google Fonts API:

1. **UI & Judul (`--font-sans`)**: `Onest` (bobot `300` sampai `800`).
   - Proporsi seimbang, tajam pada ukuran mikro (11–13px) di panel desktop padat.
   - Digunakan untuk label form, judul modul, teks tombol, dan navigasi.
2. **Kode & Metrik (`--font-mono`)**: `JetBrains Mono` (bobot `400` sampai `800`).
   - Diatur dengan `font-variant-numeric: tabular-nums` (`tabular-nums` di Tailwind).
   - Wajib digunakan pada seluruh angka koordinat `(X, Y)`, dimensi kanvas, codepoint Unicode `U+E200+`, metrik advance/ascent, dan hash SHA-1 agar tidak menimbulkan pergeseran tata letak saat diperbarui.

## 4. Sistem Ikonografi

- **Ikon**: Font Awesome 6 SVG melalui `@fortawesome/vue-fontawesome`.
- **Ketentuan**: Dilarang menggunakan paket Lucide atau Lucide React.
- **Pewarnaan**: Seluruh ikon menggunakan SVG tunggal dengan pewarnaan `currentColor` agar selaras secara dinamis dengan warna teks induknya.

## 5. Tata Letak Halaman

1. **Beranda (`app/pages/index.vue`)**:
   - `SiteNavbar`: Tiga tautan rute utama (`Beranda`, `Studio`, `About`).
   - Showcase Hero: Menampilkan aksi langsung dan frame kanvas mini interaktif.
   - Rincian Modul: Modul 01 (Rank Studio) dan Modul 02 (Validator ZIP & SHA-1).
   - Matriks Versi: Tabel acuan format `pack.mcmeta` untuk versi `1.21.1` hingga `26.3`.
   - Roadmap Pengembangan: Ringkasan status fase aktif dan fase berikutnya.
   - `SiteFooter`: Penegasan pemrosesan lokal di peramban tanpa analitik.
2. **Studio (`app/pages/studio.vue`)**:
   - Layout desktop 100vh tanpa scroll jendela utama.
   - Terbagi menjadi dua ruang kerja melalui `store.studioMode`:
     - **Mode Rank & Glyph (`StudioWorkspace.vue`)**: Tool Dock vertikal kiri (44px), Rank Explorer sidebar, Center Stage kanvas piksel (pan, zoom, grid, in-game preview), dan Inspector panel kanan (properti metrik, layer stack, audit F01–F10, ekspor pack).
     - **Mode Validator ZIP & SHA-1 (`ValidatorWorkspace.vue`)**: Dropzone arsip, pemilihan target versi, progress bar streaming SHA-1 Web Worker, dan panel temuan aturan Z01–Z09 / M01–M10.
3. **About (`app/pages/about.vue`)**:
   - Dokumentasi acuan teknis dari `docs/knowledge/`.
   - Verifikasi primer dan penjelasan penanda `[UNVERIFIED]`.
   - Tabel spesifikasi teknologi pendukung.
