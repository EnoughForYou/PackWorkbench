# AGENTS.md — Tools Minecraft Resourcepack

Aturan kerja untuk agen. Baca seluruhnya sebelum menyentuh apa pun.

## 1. Urutan baca wajib

1. `docs/knowledge/00-ringkasan-perbedaan-versi.md`
2. `docs/knowledge/99-pertanyaan-terbuka.md`
3. PRD master proyek (`PRD.md`)
4. File `docs/knowledge/` lain yang relevan dengan tugas

Folder `docs/` di luar `knowledge/` (dokumen briefing lama dan Panduan Arsitektur Teknis) SUDAH TERBUKTI sebagian usang. Jangan dijadikan sumber fakta.

## 2. Sumber kebenaran

- Fakta teknis Minecraft hanya boleh berasal dari `docs/knowledge/`.
- Jika sebuah fakta tidak ada di sana, atau ditandai `[UNVERIFIED]` / `[SECONDARY]`, JANGAN menebak dan jangan menulisnya sebagai pasti di kode, UI, atau pesan validator. Berhenti dan tanyakan, atau implementasikan sebagai peringatan dengan label "belum terverifikasi".
- Jika kode atau dokumen bertentangan dengan `docs/knowledge/`, laporkan konfliknya. Jangan diam-diam memilih salah satu.
- Jika menemukan fakta baru lewat pengujian, tambahkan ke `docs/knowledge/` dengan sumbernya; jangan hanya mengubah kode.

## 3. Lingkup

- Kerjakan HANYA fase yang disetujui. Item "di luar cakupan" pada PRD dilarang, termasuk yang "sekalian saja".
- Tidak ada backend, upload file pengguna, akun, atau analitik kecuali PRD menyebutkannya.
- Jangan menambah dependensi tanpa alasan tertulis (apa, kenapa, ukuran, alternatif). Prioritaskan dependensi yang kecil dan terawat.

## 4. Larangan keras

- Jangan menyalin, menyematkan, atau menyertakan aset vanilla Mojang (tekstur, font, shader, jar) ke repo, fixture, build, atau situs. Fixture tes harus sintetis.
- Jangan commit `client.jar`, `client_mappings`, output `javap`, atau berkas scratch riset. Pastikan `.gitignore` mencakupnya.
- Jangan mengirim berkas pengguna ke jaringan apa pun. Pemrosesan hanya di browser.
- Jangan menulis pesan validator dari ingatan. Setiap aturan harus punya ID dan mengacu ke bagian di `docs/knowledge/`.

## 5. Standar kode

- TypeScript strict. Tidak ada `any` tanpa komentar alasan.
- `src/core/` murni (tanpa React/DOM), bisa dijalankan di Node.
- Data versi (`versions.ts`) dipisah dari logika.
- Setiap aturan validator punya tes: kasus lolos dan kasus gagal.
- Pesan pengguna berbahasa Indonesia, spesifik, dengan petunjuk perbaikan. Hindari kalimat umum ("terjadi kesalahan").
- UI: fungsional dan rapat. Tanpa halaman marketing, tanpa gradien/glow generik, tanpa elemen dekoratif yang tidak melayani tugas.

## 6. Kapan harus berhenti dan bertanya

- Spesifikasi PRD ambigu atau saling bertentangan.
- Fakta yang dibutuhkan berstatus `[UNVERIFIED]`.
- Perlu dependensi baru, atau perubahan di luar lingkup fase.
- Hasil tes otomatis tidak cocok dengan `docs/knowledge/`.
- Sebelum menghapus atau menimpa berkas yang bukan buatan Anda sendiri.

## 7. Cara melapor

Setelah setiap tugas: apa yang diubah, tes apa yang dijalankan beserta hasilnya, apa yang TIDAK dikerjakan, dan pertanyaan terbuka. Jangan mengklaim "selesai" tanpa menjalankan tes. Jangan mengklaim sesuatu "sudah diverifikasi" kecuali benar-benar diuji.

## 8. Definisi selesai (umum)

Tes hijau, tanpa aset vanilla di repo, README memperbarui cara menjalankan, dan `docs/knowledge/99-pertanyaan-terbuka.md` mencerminkan sisa ketidakpastian.
