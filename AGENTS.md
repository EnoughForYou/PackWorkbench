# AGENTS.md: Tools Minecraft Resourcepack

Aturan kerja untuk agen. Baca seluruhnya sebelum menyentuh apa pun.

## 1. Urutan baca wajib

1. `docs/knowledge/00-ringkasan-perbedaan-versi.md`
2. `docs/knowledge/99-pertanyaan-terbuka.md`
3. PRD master proyek (`PRD.md`)
4. Berkas `docs/knowledge/` lain yang relevan dengan tugas

Folder `docs/` di luar `knowledge/` (dokumen briefing lama dan Panduan Arsitektur Teknis) sudah terbukti sebagian usang. Jangan dijadikan sumber fakta.

## 2. Sumber kebenaran

- Fakta teknis Minecraft hanya boleh berasal dari `docs/knowledge/`.
- Jika sebuah fakta tidak ada di sana, atau ditandai `[UNVERIFIED]` / `[SECONDARY]`, jangan menebak dan jangan menulisnya sebagai pasti di kode, UI, atau pesan validator. Berhenti dan tanyakan, atau implementasikan sebagai peringatan dengan label belum terverifikasi.
- Jika kode atau dokumen bertentangan dengan `docs/knowledge/`, laporkan konfliknya. Jangan diam-diam memilih salah satu.
- Jika menemukan fakta baru lewat pengujian, tambahkan ke `docs/knowledge/` dengan sumbernya; jangan hanya mengubah kode.

## 3. Lingkup

- Kerjakan hanya fase yang disetujui. Item di luar cakupan pada PRD dilarang, termasuk yang beralasan sekalian saja.
- Tidak ada backend, upload berkas pengguna, akun, atau analitik kecuali PRD menyebutkannya.
- Jangan menambah dependensi tanpa alasan tertulis (apa, kenapa, ukuran, alternatif). Prioritaskan dependensi yang kecil dan terawat.

## 4. Larangan keras

- Jangan menyalin, menyematkan, atau menyertakan aset vanilla Mojang (tekstur, font, shader, jar) ke repo, fixture, build, atau situs. Fixture tes harus sintetis.
- Jangan commit `client.jar`, `client_mappings`, output `javap`, atau berkas scratch riset. Pastikan `.gitignore` mencakupnya.
- Jangan mengirim berkas pengguna ke jaringan apa pun. Pemrosesan hanya di browser.
- Jangan menulis pesan validator dari ingatan. Setiap aturan harus punya ID dan mengacu ke bagian di `docs/knowledge/`.

## 5. Standar kode dan penulisan

- TypeScript strict. Tidak ada `any` tanpa komentar alasan.
- `src/core/` murni (tanpa framework/DOM), bisa dijalankan mandiri di Node.
- Data versi (`versions.ts`) dipisah dari logika pemrosesan.
- Setiap aturan validator punya tes: kasus lolos dan kasus gagal.
- Standar penulisan (berdasarkan skill `avoid-ai-writing`):
  - Pesan pengguna berbahasa Indonesia, spesifik, dengan petunjuk perbaikan. Hindari kalimat umum ("terjadi kesalahan").
  - Bebas dari klise percakapan AI: hilangkan salam basa-basi ("Tentu!", "Tentu saja!"), pujian palsu ("Pertanyaan bagus!"), dan penutup robotik ("Semoga membantu!").
  - Penulisan lugas: gunakan tanda baca standar (titik, koma, titik dua), hindari penumpukan tanda pisah em-dash (`—`), dan hindari penebalan kata berlebih di tengah kalimat.
- UI: fungsional dan rapat desktop-grade. Mengikuti token visual `DESIGN.md` ("Aseprite Retro Studio"), ikon Font Awesome 6 SVG, dan bebas dari halaman pemasaran atau dekorasi tanpa fungsi.

## 6. Kapan harus berhenti dan bertanya

- Spesifikasi PRD ambigu atau saling bertentangan.
- Fakta yang dibutuhkan berstatus `[UNVERIFIED]`.
- Perlu dependensi baru, atau perubahan di luar lingkup fase.
- Hasil tes otomatis tidak cocok dengan `docs/knowledge/`.
- Sebelum menghapus atau menimpa berkas yang bukan buatan Anda sendiri.

## 7. Cara melapor

Setelah setiap tugas laporkan: apa yang diubah, tes apa yang dijalankan beserta hasilnya, apa yang tidak dikerjakan, dan sisa pertanyaan terbuka. Jangan mengklaim selesai tanpa menjalankan tes. Jangan mengklaim sesuatu sudah diverifikasi kecuali benar-benar diuji.

## 8. Definisi selesai

Tes unit hijau (seluruh tes Vitest lolos), tanpa aset vanilla di repo, README memperbarui cara menjalankan, dan `docs/knowledge/99-pertanyaan-terbuka.md` mencerminkan sisa ketidakpastian.
