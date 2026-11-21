# Resource Pack Workbench

Aplikasi web untuk memvalidasi struktur resource pack Minecraft Java Edition (`1.21.1` sampai `26.3`), menghitung hash SHA-1, dan menyusun font bitmap serta rank badge langsung di peramban tanpa koneksi server backend.

## Fitur Utama

- **Validator Arsip & Metadata**: Memeriksa kelengkapan file dalam `.zip`, penempatan `pack.mcmeta`, format versi (`pack_format` tunggal maupun array `min_format`/`max_format`), integritas path tekstur font, serta membersihkan berkas sampah sistem operasi.
- **Generator SHA-1**: Menghitung hash 40-karakter secara streaming melalui Web Worker agar browser tetap responsif saat memproses berkas besar, lengkap dengan konfigurasi `server.properties`.
- **Studio Font & Rank Badge**: Editor visual untuk menyusun rank badge multi-layer (latar, ikon piksel, teks font mini, bayangan), penataan negative space, serta alokasi otomatis karakter PUA pada rentang `U+E200+`.
- **Pratinjau Antarmuka Game**: Simulasi rendering teks dan badge pada tampilan Chat, TAB list, dan Nametag dengan berbagai skala GUI.
- **Ekspor Format Server**: Menghasilkan arsip `.zip` siap pakai beserta cuplikan konfigurasi untuk LuckPerms, PlaceholderAPI, ItemsAdder, Oraxen, dan Nexo.

## Menjalankan Proyek

Pastikan Node.js (versi 18 ke atas) dan npm sudah terpasang.

```bash
# Pasang dependensi
npm install

# Jalankan server pengembangan
npm run dev

# Jalankan rangkaian tes unit
npm test

# Periksa tipe TypeScript
npm run typecheck

# Build situs statis
npm run generate
```

## Privasi dan Batasan

- Seluruh pemrosesan berkas ZIP, gambar PNG, dan perhitungan hash berlangsung secara lokal di memori peramban klien. Tidak ada data yang diunggah ke server luar.
- Proyek ini tidak menyertakan maupun mendistribusikan aset resmi dari instalasi vanilla game. Seluruh glif dan tekstur bawaan dibuat secara prosedural.

## Lisensi

Proyek ini dirilis di bawah lisensi MIT. Lihat berkas [LICENSE](LICENSE) untuk rincian lengkap.
