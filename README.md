# PackWorkbench

Lingkungan kerja berbasis web untuk menyusun font bitmap, merakit rank badge, dan memvalidasi resource pack Minecraft Java Edition (`1.21.1` sampai `26.3`).

Seluruh pemrosesan berkas, kalkulasi hash, dan manipulasi piksel berjalan 100% secara lokal di peramban pengguna. Tidak ada data yang dikirim ke server luar.

---

## Apa Itu PackWorkbench?

Saat mengelola server Minecraft atau membuat custom resource pack, kreator sering menghadapi kendala teknis yang memakan waktu: struktur zip yang salah format, nilai `pack_format` yang tidak kompatibel dengan versi game, lambatnya menghitung SHA-1 untuk `server.properties`, serta rumitnya menyusun koordinat font bitmap dan rank badge.

PackWorkbench menyatukan solusi masalah tersebut dalam satu antarmuka desktop yang fungsional:
1. Memeriksa integritas arsip (.zip): Memvalidasi struktur folder, sintaks `pack.mcmeta`, path tekstur font, serta mendeteksi berkas sampah sistem operasi sebelum pack dibagikan ke publik atau dipasang ke server.
2. Menghitung SHA-1 secara streaming: Memproses hash 40-karakter melalui Web Worker per potongan 4 MiB agar browser tidak membeku, lengkap dengan generator baris `server.properties`.
3. Merakit rank badge & font glyph: Editor visual berlapis (*frame*, *icon*, teks mini, dan bayangan) untuk membuat badge pangkat server dengan alokasi otomatis karakter PUA (`U+E200+`) yang aman dari tabrakan HUD vanilla Bedrock.
4. Pratinjau langsung in-game: Mensimulasikan tampilan badge dan teks pada Chat, daftar TAB, dan Nametag karakter dalam berbagai skala GUI Minecraft (1–4).

---

## Fitur Utama

- **Studio Rank & Glyph**: Editor kanvas piksel dengan dukungan kuas pensil, penghapus, eyedropper, riwayat undo/redo, serta generator provider `space` negatif dan positif.
- **Validator 29 Aturan Teknis**: Evaluasi komprehensif aturan `Z01–Z12`, `M01–M10`, dan `F01–F10` yang disusun dari analisis bytecode `client.jar` resmi, mencakup era Java 1.21.1 (`34`) hingga format modern 26.3 (`[97, 1]`).
- **Ekspor Konfigurasi Siap Pakai**: Menghasilkan arsip `.zip` yang valid beserta cuplikan konfigurasi untuk LuckPerms, PlaceholderAPI, ItemsAdder, Oraxen, dan Nexo.
- **Nol Aset Berhak Cipta**: Seluruh ikon preset dan glif bawaan dibuat secara prosedural. Repositori ini tidak menyertakan aset vanilla Mojang.

---

## Teknologi dan Framework

Aplikasi web ini dibangun dengan stack modern yang dirancang untuk performa tinggi di peramban:

| Kategori | Teknologi | Peran dalam Aplikasi |
| :--- | :--- | :--- |
| **Framework Utama** | [Nuxt 4](https://nuxt.com/) | Kerangka kerja aplikasi web mode SPA statis (`ssr: false`) tanpa server runtime |
| **Antarmuka & Reaktivitas** | [Vue 3](https://vuejs.org/) & [Pinia](https://pinia.vuejs.org/) | Rendering komponen antarmuka reaktif dan manajemen state terpusat |
| **Styling & Token Desain** | [Tailwind CSS v4](https://tailwindcss.com/) | Utilitas desain bertema *Aseprite Retro Studio* dengan palet kontras tinggi |
| **Komponen UI Desktop** | [shadcn-vue](https://www.shadcn-vue.com/) & Reka UI | Primitif antarmuka aksesibel (panel resizable, tabs, dropdown, dialog) |
| **Ikonografi** | [Font Awesome 6 SVG](https://fontawesome.com/) | Sistem ikon antarmuka terstandar melalui `@fortawesome/vue-fontawesome` |
| **Tipografi** | Google Fonts API | Variable fonts `Onest` untuk teks UI dan `JetBrains Mono` tabular untuk metrik |
| **Logika Inti (Core Engine)** | TypeScript Murni | Mesin aturan di `src/core/` yang berjalan independen tanpa dependensi DOM |
| **Pemrosesan Biner & Hash** | `@noble/hashes` & `JSZip` | Streaming SHA-1 di Web Worker dan manipulasi arsip ZIP lokal di memori |
| **Pengujian Unit** | [Vitest](https://vitest.dev/) & `@pinia/testing` | Menjalankan 106 unit test otomatis untuk menjamin keandalan seluruh aturan |

---

## Menjalankan Proyek di Lokal

### Prasyarat
- [Node.js](https://nodejs.org/) versi 18 ke atas (teruji pada Node v26).
- Manajer paket `npm`.

### Perintah Pengembangan

```bash
# 1. Pasang seluruh dependensi proyek
npm install

# 2. Jalankan server pengembangan lokal
npm run dev

# 3. Jalankan pengujian unit otomatis
npm test

# 4. Validasi tipe data TypeScript
npm run typecheck

# 5. Bangun berkas statis produksi (.output/public/)
npm run generate

# 6. Pratinjau hasil build statis di lokal
npm run preview
```

---

## Pengembang (Author)

Dikembangkan oleh EnoughForYou  
GitHub: [@EnoughForYou](https://github.com/EnoughForYou)

---

## Lisensi

Proyek ini dirilis di bawah lisensi MIT. Silakan merujuk ke berkas [LICENSE](LICENSE) untuk ketentuan penggunaan dan distribusi perangkat lunak.
