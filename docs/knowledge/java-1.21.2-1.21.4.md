# Minecraft Java Edition 1.21.2 – 1.21.4 — Spesifikasi Resource Pack (Sumber Primer & Sekunder)

- **Status Rilis:**
  - `1.21.2` / `1.21.3`: Rilis resmi *Bundles of Bravery* (`2024-10-22`) `[VERIFIED: minecraft.wiki]`.
  - `1.21.4`: Rilis resmi *The Garden Awakens* (`2024-12-03`) `[VERIFIED: minecraft.wiki & 1.21.4/client.jar]`.
- **Runtime:** Java 21 `[VERIFIED: piston-meta.mojang.com]`.

---

## 1. `pack_format`, `min_format`/`max_format`, dan Format `pack.mcmeta`

- **`version.json` `pack_version`:**
  - `1.21.2` – `1.21.3`: `{"resource": 42, "data": 57}` `[VERIFIED: minecraft.wiki]`.
  - `1.21.4`: `{"resource": 46, "data": 61}` `[VERIFIED: 1.21.4/client.jar version.json]`.
- **Format Metadata:** Masih menggunakan format legacy tunggal integer `pack_format`. Field `min_format` dan `max_format` **belum ada** (baru hadir di `1.21.9`).
- **Contoh `pack.mcmeta` valid:**
  ```json
  {
    "pack": {
      "pack_format": 46,
      "supported_formats": [42, 46],
      "description": "Resource Pack untuk 1.21.2 - 1.21.4"
    }
  }
  ```

---

## 2. Perubahan Masif Sistem Model Item (`assets/<ns>/items/*.json`)

Versi `1.21.4` (format `46`) membawa perombakan paling fundamental pada sistem model item Minecraft Java sejak versi 1.8:

1. **Pengenalan Folder `assets/<namespace>/items/*.json`:**
   - Di `1.21.1`, model item ditautkan melalui `assets/<namespace>/models/item/*.json` dengan mekanisme array `"overrides"`.
   - Di `1.21.4`, setiap item mereferensikan file definisi model baru di `assets/<namespace>/items/<item_name>.json`.
   - Mekanisme `"overrides"` di `models/item/*.json` dinyatakan **deprecated** dan tidak lagi digunakan oleh item vanilla.
2. **Tipe-Tipe Model Item Baru di `items/*.json`:**
   - `"minecraft:model"`: Menunjuk ke model 3D blok/item tradisional di `models/`.
   - `"minecraft:composite"`: Menggabungkan beberapa model secara bertumpuk.
   - `"minecraft:condition"`: Menampilkan model berdasarkan boolean condition (misal `has_component`, `using_item`).
   - `"minecraft:select"`: Memilih model berdasarkan properti item (pengganti utama overrides predicate lama).
   - `"minecraft:range_dispatch"`: Memilih model berdasarkan nilai numerik (kerusakan, waktu cooldown, atau custom model data).

---

## 3. Komponen `CustomModelData` (Transisi dari Integer ke 4-List)

- **`1.21.1` – `1.21.3`:** Komponen `minecraft:custom_model_data` hanya berupa bilangan bulat tunggal:
  ```mcfunction
  /give @p diamond_sword[custom_model_data=5]
  ```
- **`1.21.4`:** Komponen `CustomModelData` dirombak menjadi struktur 4-list:
  ```mcfunction
  /give @p diamond_sword[custom_model_data={floats:[1.5],flags:[true],strings:["custom_sword"],colors:[16711680]}]
  ```
  *(Catatan: Sintaks lama `custom_model_data=5` tetap diterima klien `1.21.4` sebagai fallback yang mengisi elemen pertama list floats)* `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-4]`.
- **Integrasi Plugin Menu (DeluxeMenus):**
  - Pada `1.21.4+`, opsi konfigurasi `model_data` pada DeluxeMenus digantikan oleh `model_data_component` dan `item_model` `[VERIFIED: https://wiki.helpch.at/helpchat-plugins/deluxemenus/options-and-configurations/item]`.

---

## 4. Font, Glyphs, dan Shaders

- **Font JSON Vanilla:** Struktur font bitmap (`type: "bitmap"`), space (`type: "space"`), dan unifont tetap kompatibel penuh tanpa perubahan skema.
- **Konsolidasi Shader (`shaders/core/`):**
  - Mulai `1.21.4`, Mojang mulai merapikan dan mengonsolidasikan shader internal dari 166 file (di `1.21.1`) menuju sistem shader yang lebih terstruktur.

---

## 5. Ringkasan Kompatibilitas untuk Author Resource Pack

* Jika membuat pack untuk **`1.21.2`–`1.21.3`**: Gunakan `"pack_format": 42`.
* Jika membuat pack untuk **`1.21.4`**: Gunakan `"pack_format": 46`.
* Untuk pack kustom model item di `1.21.4`, **wajib** menyertakan file `items/*.json` alih-alih hanya mengandalkan `"overrides"` di `models/item/*.json`.
