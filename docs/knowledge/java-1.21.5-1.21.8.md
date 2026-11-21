# Minecraft Java Edition 1.21.5 – 1.21.8 — Spesifikasi Resource Pack (Sumber Primer & Sekunder)

- **Status Rilis:**
  - `1.21.5`: Rilis resmi minor maintenance (`2025-03-25`) `[VERIFIED: minecraft.wiki]`.
  - `1.21.6`: Rilis resmi minor feature adjustments (`2025-05-13`) `[VERIFIED: minecraft.wiki]`.
  - `1.21.7` / `1.21.8`: Rilis resmi akhir era format tunggal (`2025-07-08`) `[VERIFIED: minecraft.wiki]`.
- **Runtime:** Java 21 `[VERIFIED: piston-meta.mojang.com]`.

---

## 1. `pack_format`, `min_format`/`max_format`, dan Format `pack.mcmeta`

- **`version.json` `pack_version`:**
  - `1.21.5`: `{"resource": 55, "data": 71}` `[VERIFIED: minecraft.wiki]`.
  - `1.21.6`: `{"resource": 63, "data": 80}` `[VERIFIED: minecraft.wiki]`.
  - `1.21.7` – `1.21.8`: `{"resource": 64, "data": 81}` `[VERIFIED: minecraft.wiki]`.
- **Signifikansi Format `64`:**
  - Angka **`64`** ditetapkan oleh Mojang sebagai **`lastPreMinorVersion`** untuk `CLIENT_RESOURCES` di dalam kode sumber `PackFormat.java` (`net.minecraft.server.packs.metadata.pack.PackFormat`) `[VERIFIED: 26.3/client.jar PackFormat]`.
  - Format `64` (Minecraft `1.21.7` dan `1.21.8`) adalah **versi terakhir** yang mengizinkan deklarasi format tunggal integer `pack_format` tanpa `min_format`/`max_format`.
  - Semua pack yang hanya mendeklarasikan `"pack_format": 65` ke atas (tanpa rentang) akan ditolak oleh validator klien modern `[VERIFIED: 26.3/client.jar PackFormat$IntermediaryFormat]`.
- **Contoh `pack.mcmeta` valid:**
  ```json
  {
    "pack": {
      "pack_format": 64,
      "supported_formats": [55, 64],
      "description": "Resource Pack untuk 1.21.5 - 1.21.8"
    }
  }
  ```

---

## 2. Struktur Folder & Aset

- **Sistem Model Item:** Melanjutkan standar `assets/<ns>/items/*.json` yang dimatangkan sejak `1.21.4`.
- **Atlases:**
  - `atlases/blocks.json` masih memuat tekstur sprite item (`item/`).
  - `atlases/items.json` **belum ada** (baru dipisahkan pada `1.21.11`).
- **Font & Glyph:**
  - Tetap menggunakan format `bitmap`, `space`, dan `ttf` standar vanilla.
  - Komponen teks `object` (`atlas`/`player`) belum didukung pada era ini.

---

## 3. Aturan Validasi untuk Perkakas Validator

1. Jika pack menargetkan versi antara `1.21.5` hingga `1.21.8`:
   - Nilai integer `pack_format` harus berada di antara `55` dan `64`.
   - `min_format` dan `max_format` tidak digunakan untuk rilis ini secara eksklusif.
2. Jika pack dibuat untuk lintas versi (misal mendukung `1.21.8` dan `1.21.10`):
   - Wajib menyertakan `pack_format: 64` (untuk klien legacy) dan rentang `min_format` / `max_format` (untuk klien `1.21.9+`).
