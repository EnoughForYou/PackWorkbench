# Minecraft Java Edition 1.21.11 — Spesifikasi Resource Pack (Sumber Primer)

- **Status Rilis:** Rilis resmi (`2025-12-09T12:23:30+00:00`, build `2025-12-09T12:20:42+00:00`) — update *Mounts of Mayhem* `[VERIFIED: piston-meta.mojang.com & 1.21.11/client.jar version.json]`.
- **Runtime:** Java 21 `[VERIFIED: piston-meta.mojang.com 1.21.11.json]`.

---

## 1. `pack_format`, `min_format`/`max_format`, dan Format `pack.mcmeta`
- **`version.json` `pack_version`:** `{"resource_major": 75, "resource_minor": 0, "data_major": 94, "data_minor": 1}` `[VERIFIED: 1.21.11/client.jar version.json]`.
- **Aturan `pack.mcmeta`:** Wajib memakai `min_format` dan `max_format` (integer `75` atau `[75, 0]`), tanpa `supported_formats`; validasi bytecode identik dengan `26.3` `[VERIFIED: 1.21.11/client.jar azz$a & 26.3/client.jar PackFormat]`.

**Contoh `pack.mcmeta` valid untuk `1.21.11`:**
```json
{
  "pack": {
    "description": "Resource Pack 1.21.11 (Mounts of Mayhem)",
    "min_format": [75, 0],
    "max_format": 75
  }
}
```
`[VERIFIED: 1.21.11/client.jar version.json & 26.3/client.jar PackFormat]`

---

## 2. Struktur Folder `assets/minecraft/` (Perubahan dari `1.21.10` → `1.21.11`)
- **Pemisahan Atlas `atlases/items.json` & `atlases/celestials.json` (`16` atlas total):**
  - `1.21.11/client.jar` **pertama kali menambahkan `atlases/items.json` dan `atlases/celestials.json`** `[VERIFIED: 1.21.11/client.jar]`.
  - Di `atlases/blocks.json`, entri `{"type": "minecraft:directory", "prefix": "item/", "source": "item"}` serta `paletted_permutations` untuk `trims/items/*_trim` **dihapus dan dipindahkan** ke `atlases/items.json` `[VERIFIED: 1.21.11/client.jar]`.
  - Tekstur `environment/sun.png`, `moon_phases.png`, dan `end_flash.png` dipindahkan ke `environment/celestial/` `[VERIFIED: 1.21.11/client.jar]`.
- **Penambahan Aset Konten Baru:** `entity/nautilus`, seri spear (`wooden_spear` s/d `netherite_spear` + `*_in_hand.png`), `nautilus_armor`, `netherite_horse_armor`, dan `.mcmeta` blok-blok daun/bunga/kaca `[VERIFIED: 1.21.11/client.jar]`.
- **`shaders/core/` (`75` file vs `69` di `1.21.10`):** Penambahan `animate_sprite.vsh`, `animate_sprite_blit.fsh`, `animate_sprite_interpolate.fsh`, `block.fsh`, `block.vsh`, dan `debug_point.vsh` `[VERIFIED: 1.21.11/client.jar]`.

---

## 3. Sistem Item (`CustomModelData`, Item Component, `/give`)
- `items/*.json` bertambah menjadi `1505` file; `models/item/*.json` menjadi `1283` file (`overrides = 0`) `[VERIFIED: 1.21.11/client.jar]`.
- Karena `atlases/items.json` kini terpisah dari `atlases/blocks.json`, model blok tidak dapat langsung memakai sprite dari `textures/item/` tanpa deklarasi sumber atlas di `blocks.json` atau menyalinnya ke `textures/block/` `[VERIFIED: 1.21.11/client.jar atlases/blocks.json & atlases/items.json]`.
- Komponen `custom_model_data` 4-list, `item_model`, dan sintaks `/give` tetap sama seperti `1.21.10` `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-4]`.
- Penambahan video setting **Texture Filtering** (*None*, *RGSS*, *Anisotropic*) serta sistem Environment Attributes `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-1-21-11-pre-release-1]`.

---

## 4. Font & Validasi Tabrakan Codepoint (Koreksi Penting)
- 7 file font JSON vanilla di `1.21.11/client.jar` identik dengan `1.21.10` `[VERIFIED: 1.21.11/client.jar]`.
- **Hasil Audit Bytecode `1.21.11/client.jar` (`FontManager` `gnp` & `FontSet` `gnr`):**
  - Klaim di Putaran 1 bahwa "tabrakan codepoint di 1.21.11+ tidak lagi diselesaikan diam-diam / ditandai validator" adalah **SALAH untuk mesin vanilla**. Di `1.21.11/client.jar`, `FontSet` tetap memakai urutan `activeProviders` (provider lebih awal menang diam-diam, kecuali `nonFishyGlyphs` melewati `advance < 0 || advance > 32.0f`), dan tidak ada logger tabrakan lintas pack di `FontManager`/`FontSet` `[VERIFIED: 1.21.11/client.jar gnp/gnr]`.

---

## 5. GUI / Menu & DeluxeMenus
- `generic_54.png` identik (`256×256`) `[VERIFIED: 1.21.11/client.jar]`.
- DeluxeMenus memakai `model_data_component` atau `item_model` `[VERIFIED: https://wiki.helpch.at/helpchat-plugins/deluxemenus/options-and-configurations/item]`.

---

## 6. Ikon, Rank Badge, & Emoji (Chat / TAB / Nametag)
- Tetap menggunakan font `bitmap`/`space` atau `object` text component (`atlas` harus merujuk `minecraft:items` vs `minecraft:blocks` secara tepat setelah pemisahan atlas) `[VERIFIED: 1.21.11/client.jar atlases/items.json & https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-9]`.

---

## 7. Hosting & Deployment (`server.properties`)
- Sama seperti `1.21.10`: `server.properties`, batas `250 MiB`, dan cache SHA-1 `[VERIFIED: 26.3/client.jar DownloadedPackSource$4]`.

---

## 8. Deprecated, Dihapus, atau Breaking Change (`1.21.11`)
- **Pemisahan `atlases/blocks.json` vs `atlases/items.json`:** Memecah asumsi pack lama yang mengandalkan tekstur `item/` di dalam atlas blok `[VERIFIED: 1.21.11/client.jar]`.
- **Relokasi Celestial Textures:** `environment/sun.png`, `moon_phases.png`, dan `end_flash.png` pindah ke `environment/celestial/` `[VERIFIED: 1.21.11/client.jar]`.
- **Penambahan shader baru:** `animate_sprite.*`, `block.*`, `debug_point.vsh` di `shaders/core/` `[VERIFIED: 1.21.11/client.jar]`.
