# Minecraft Java Edition 1.21.9 — Spesifikasi Resource Pack (Sumber Primer & Sekunder)

- **Status Rilis:** Rilis resmi pembaruan *The Copper Age* (baseline awal format minor, `2025-08-26`) `[VERIFIED: piston-meta.mojang.com & minecraft.wiki]`.
- **Runtime:** Java 21 `[VERIFIED: piston-meta.mojang.com]`.

---

## 1. `pack_format`, `min_format`/`max_format`, dan Format `pack.mcmeta`

- **`version.json` `pack_version`:**
  - Resource Pack: `{"resource_major": 69, "resource_minor": 0}` `[VERIFIED: 1.21.9/client.jar version.json]`.
  - Data Pack: `{"data_major": 88, "data_minor": 0}` `[VERIFIED: 1.21.9/client.jar version.json]`.
- **Awal Mula Era Minor Versioning:**
  - Sejak snapshot `25w31a` dan rilis penuh `1.21.9`, Mojang mengubah arsitektur parsing `pack.mcmeta` menjadi berbasis rentang `min_format` dan `max_format` `[VERIFIED: minecraft.wiki & 26.3/client.jar PackFormat]`.
  - Nilai format kini mengadopsi format desimal/array `[major, minor]` (misal `69.0` atau `[69, 0]`).

### Aturan Ketat `pack.mcmeta` Mulai `1.21.9`:
1. **Format Eksklusif `1.21.9+`:**
   - Wajib menyertakan kedua field `min_format` dan `max_format`.
   - `supported_formats` **DILARANG** untuk pack dengan `min_format.major > 64`. Jika disertakan, klien menolak memuat pack dengan pesan error `[VERIFIED: 26.3/client.jar PackFormat$IntermediaryFormat]`.
   - Field `pack_format` menjadi **opsional**; jika ditulis, nilainya harus berada di antara `min.major` dan `max.major`.
2. **Tipe Data JSON yang Valid:**
   - Hanya menerima integer non-negatif (`69`) atau array 2 elemen integer `[69, 0]`.
   - **Float JSON seperti `69.0` TIDAK VALID** dan akan ditolak oleh parser JSON Mojang (`ExtraCodecs.NON_NEGATIVE_INT`).

**Contoh `pack.mcmeta` standar untuk `1.21.9`:**
```json
{
  "pack": {
    "description": "Resource pack murni Minecraft 1.21.9",
    "min_format": [69, 0],
    "max_format": 69
  }
}
```

---

## 2. Fitur Baru Teks: Komponen `object` (`atlas` dan `player`)

Mulai `1.21.9`, Minecraft memperkenalkan tipe komponen teks baru berjenis `object`:
* Menyisipkan sprite dari atlas GUI/tekstur secara langsung ke dalam baris obrolan atau teks tanpa bergantung pada glyph font bitmap manual.
* Format komponen:
  ```json
  {"type": "object", "object": {"type": "atlas", "id": "minecraft:gui", "sprite": "minecraft:hud/heart/full"}}
  ```
* Mendukung rendering kepala/skin pemain secara inline:
  ```json
  {"type": "object", "object": {"type": "player", "player": "P0TAT0D0G"}}
  ```

---

## 3. Shader dan Atlas

- **Atlas:**
  - `mob_effects.json` dihapus dari direktori `atlases/` dan digabungkan ke dalam `gui.json` `[VERIFIED: 1.21.10/client.jar]`.
  - Sprite item (`item/`) masih berada di dalam `atlases/blocks.json` (belum dipisah ke `items.json`).
- **Core Shaders:**
  - Penghapusan file JSON deklarasi rendertype internal lama, menyisakan 69 file shader inti teroptimasi.
