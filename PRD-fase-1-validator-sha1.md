# PRD Fase 1 — Pack Validator & SHA-1 (Resource Pack Java)

Status: DRAFT untuk disetujui pemilik proyek. Agen tidak boleh mulai mengkode sebelum ada persetujuan eksplisit.
Sumber kebenaran teknis: `docs/knowledge/`. Dokumen ini tidak boleh bertentangan dengan folder itu; jika bertentangan, `docs/knowledge/` menang dan konflik dilaporkan.

---

## 1. Tujuan

Alat web satu halaman, berjalan 100% di browser, yang menerima `.zip` resource pack Java lalu:

1. Memvalidasi struktur zip dan `pack.mcmeta` terhadap versi Java target.
2. Menghitung SHA-1 file final dan menghasilkan snippet `server.properties`.

Fase ini adalah fondasi: logika profil versi dan validator dipakai ulang oleh fase 2 (font/rank) dan fase 3 (GUI/item).

## 2. Di luar cakupan (JANGAN dibuat di fase ini)

- Font/glyph/rank studio, preview chat/TAB/GUI (fase 2)
- DeluxeMenus builder, CustomModelData/item definition generator (fase 3)
- Konverter Java → Bedrock (fase 4)
- Backend, akun pengguna, upload ke server, hosting direct link
- Pemeriksaan isi font JSON, model JSON, tekstur (hanya struktur zip dan `pack.mcmeta`)
- Menyertakan aset vanilla Mojang dalam bentuk apa pun

## 3. Keputusan yang sudah dikunci

| Hal | Keputusan |
| :-- | :-- |
| Arsitektur | Browser-only. File pengguna tidak pernah di-upload ke server. |
| Versi target | 6 profil: `1.21.1`, `1.21.10`, `1.21.11`, `26.1.2`, `26.2`, `26.3` |
| Output validasi | Satu laporan per versi target yang dipilih (bukan satu zip universal) |
| Platform | Java Edition saja |

Usulan (belum dikunci, boleh diubah pemilik): Vite + React + TypeScript + Tailwind, `JSZip` untuk membaca zip, Vitest untuk tes. Bahasa UI default Indonesia.

## 4. Profil Versi

Nilai dari `version.json` tiap `client.jar` resmi (lihat `docs/knowledge/00-ringkasan-perbedaan-versi.md`).

| Versi | Resource format | Gaya `pack.mcmeta` |
| :-- | :-- | :-- |
| 1.21.1 | `34` | legacy: `pack_format` (+ `supported_formats` opsional) |
| 1.21.10 | `[69, 0]` | `min_format` / `max_format` |
| 1.21.11 | `[75, 0]` | `min_format` / `max_format` |
| 26.1.2 | `[84, 0]` | `min_format` / `max_format` |
| 26.2 | `[88, 0]` | `min_format` / `max_format` |
| 26.3 | `[97, 1]` | `min_format` / `max_format` |

Profil disimpan sebagai data (satu file `versions.ts`), bukan di-hardcode di logika validator, supaya versi baru cukup menambah satu baris.

## 5. Aturan Validasi

Tiap aturan punya ID, tingkat (`ERROR` / `WARN` / `INFO`), pesan, dan petunjuk perbaikan. Semua pesan berbahasa Indonesia.

### 5.1 Struktur zip

| ID | Tingkat | Aturan |
| :-- | :-- | :-- |
| Z01 | ERROR | `pack.mcmeta` harus ada di root arsip |
| Z02 | ERROR | Jika `pack.mcmeta` hanya ada di dalam satu folder induk (kesalahan kompresi paling umum), laporkan folder itu dan cara memperbaikinya |
| Z03 | ERROR | Berkas bukan zip valid / korup |
| Z04 | WARN | Tidak ada folder `assets/` |
| Z05 | WARN | Ada `__MACOSX/`, `.DS_Store`, `Thumbs.db`, atau `desktop.ini` |
| Z06 | WARN | Path berisi huruf besar, spasi, atau karakter di luar `a-z 0-9 / . _ -` di bawah `assets/` (tidak valid sebagai resource location) |
| Z07 | WARN | Dua path berbeda hanya pada huruf besar/kecil |
| Z08 | WARN | Ukuran > 250 MiB (batas pack server; rujuk `docs/knowledge`) |
| Z09 | INFO | `pack.png` tidak ada |

### 5.2 `pack.mcmeta`

| ID | Tingkat | Aturan |
| :-- | :-- | :-- |
| M01 | ERROR | JSON tidak valid atau objek `pack` tidak ada |
| M02 | ERROR | `min_format` / `max_format` berisi float (mis. `69.0`). Hanya integer atau array `[major, minor]` integer |
| M03 | ERROR | `min_format` dan `max_format` harus sama-sama ada atau sama-sama tidak ada |
| M04 | ERROR | Target ≥ 1.21.10 dan pack memakai `supported_formats` dengan `min_format.major > 64` |
| M05 | ERROR | Target ≥ 1.21.10 dan hanya ada `pack_format` > 64 tanpa `min_format`/`max_format` |
| M06 | ERROR | Target di luar rentang `min_format`..`max_format` (integer pada `min` = `[major, 0]`, integer pada `max` = `[major, tak hingga]`) |
| M07 | ERROR | Target 1.21.1: `pack_format` tidak ada, atau tidak sama dengan `34` dan tidak tercakup `supported_formats` |
| M08 | WARN | Pack mencakup lintas era (`min.major ≤ 64` dan `max.major ≥ 65`) tetapi `pack_format` atau `supported_formats` tidak ada |
| M09 | INFO | `description` kosong atau tidak ada |
| M10 | INFO | Auto-deteksi: format yang dideklarasikan pack dan versi target mana saja yang cocok |

Catatan implementasi: aturan M02–M08 bersumber dari codec `PackFormat` di jar 26.3. Validasi terhadap `1.21.10` dan `1.21.11` WAJIB dikonfirmasi dengan memuat pack nyata di klien tiap versi (lihat bagian 9).

## 6. SHA-1

- Hitung SHA-1 byte-per-byte dari berkas zip yang dijatuhkan pengguna, tanpa mengubahnya.
- Tampilkan 40 karakter heksadesimal huruf kecil, dengan tombol salin.
- Berkas besar (hingga 250 MiB) tidak boleh membekukan tab: hitung di Web Worker dan tampilkan progres. `crypto.subtle.digest` butuh seluruh isi di memori dan hanya jalan di secure context (HTTPS atau `localhost`); jika memori jadi masalah, pakai pustaka hash streaming. Putuskan di tahap desain teknis, catat alasannya.
- Peringatan tetap di UI: hash harus dihitung dari zip FINAL; mengubah satu byte berarti hash lama tidak berlaku.

### Snippet `server.properties`

Hasilkan blok berikut dengan placeholder URL, nilai hash terisi otomatis:

```
resource-pack=<URL direct download>
resource-pack-sha1=<hash>
require-resource-pack=true
```

Kunci tambahan (`resource-pack-prompt`, `resource-pack-id`, dsb.) hanya boleh ditambahkan setelah agen mencocokkannya dengan `docs/knowledge` untuk versi yang dipilih. Jangan menambah kunci dari ingatan.

## 7. UI

- Satu halaman. Area drag-and-drop, pemilih versi target (default: auto-deteksi dari `pack.mcmeta`, bisa diganti manual).
- Hasil: ringkasan jumlah ERROR/WARN/INFO, lalu daftar temuan (ID, pesan, petunjuk perbaikan), dapat difilter per tingkat.
- Kartu SHA-1 dan snippet dengan tombol salin.
- Pernyataan privasi singkat: "File diproses di browser Anda dan tidak diunggah."
- Tanpa halaman marketing, tanpa hero, tanpa gradien/glow generik, tanpa ilustrasi dekoratif. Fungsional, rapat, terbaca. Responsif sampai lebar ponsel.
- Dapat diakses: urutan tab logis, kontras cukup, status tidak hanya lewat warna.

## 8. Struktur Kode (usulan)

```
src/
  core/            # logika murni, tanpa React, tanpa DOM
    versions.ts    # profil versi (data)
    zipReader.ts
    mcmeta.ts      # parse + normalisasi format
    rules/         # satu file per kelompok aturan (Z, M)
    report.ts
  workers/sha1.worker.ts
  ui/
tests/
  fixtures/        # zip kecil sintetis, TANPA aset vanilla
```

`core/` harus bisa dijalankan di Node (untuk tes) tanpa browser.

## 9. Pengujian & Kriteria Selesai

Tes otomatis (Vitest) dengan fixture sintetis, minimal satu kasus per aturan di bagian 5, plus:

1. Pack valid untuk tiap 6 target → nol ERROR.
2. `pack.mcmeta` terbungkus folder induk → Z02.
3. `min_format: 69.0` → M02.
4. `supported_formats` pada pack ≥ 1.21.10 → M04.
5. `pack_format: 75` sendirian, target 1.21.11 → M05.
6. `min_format` tanpa `max_format` → M03.
7. Pack lintas era lengkap (`pack_format` + `supported_formats` + `min`/`max`) → valid untuk 1.21.1 dan 1.21.10.
8. SHA-1 sebuah fixture sama dengan hasil `sha1sum` pada berkas yang sama.

Uji manual di klien nyata (dilakukan pemilik, bukan agen): muat satu pack valid dan satu pack invalid di klien `1.21.1`, `1.21.10`, `1.21.11`, `26.3`. Catat apakah klien menerima/menolak sesuai prediksi validator. Selisih apa pun dicatat di `docs/knowledge/99-pertanyaan-terbuka.md` dan aturan terkait diperbaiki sebelum fase 1 dinyatakan selesai.

Fase 1 selesai jika: semua tes hijau, uji manual cocok untuk 4 versi di atas, tidak ada aset vanilla di repo, dan README memuat cara menjalankan serta menambah profil versi.

## 10. Risiko

| Risiko | Mitigasi |
| :-- | :-- |
| Aturan `pack.mcmeta` diverifikasi dari satu jar (26.3) | Uji manual klien 1.21.10 dan 1.21.11 sebelum selesai |
| Tingkah laku minor format (mis. `max_format: [97, 0]` vs target `97.1`) belum teruji di klien | Jadikan kasus uji manual; tandai M06 sebagai "perlu konfirmasi" sampai teruji |
| Berkas besar membuat tab macet | Web Worker + progres, uji dengan zip ≥ 200 MiB |
| Versi Minecraft baru merilis format berbeda | Profil versi berbasis data; tambah baris, jalankan tes |

## 11. Keputusan Terbuka untuk Pemilik

1. Setujui atau ganti stack usulan.
2. Bahasa UI: Indonesia saja, atau Indonesia + Inggris.
3. Hosting situs (statis, mis. GitHub Pages / Cloudflare Pages) ditentukan belakangan; tidak memengaruhi fase ini selama browser-only.
