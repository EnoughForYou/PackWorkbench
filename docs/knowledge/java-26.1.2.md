# Minecraft Java Edition 26.1.2 — Spesifikasi Resource Pack (Sumber Primer)

- **Status Rilis:** Rilis resmi (`2026-04-09T10:12:23+00:00`, build `2026-04-09T10:11:03+00:00`) — hotfix untuk seri `26.1` (*Tiny Takeover*, dirilis `2026-03-24T12:11:04+00:00`) `[VERIFIED: piston-meta.mojang.com & 26.1.2/client.jar version.json]`.
- **Runtime:** Java 25, arsip executable **un-obfuscated** (`client_mappings` tidak lagi diperlukan/disertakan di manifest) `[VERIFIED: piston-meta.mojang.com 26.1.2.json]`.

---

## 1. `pack_format`, `min_format`/`max_format`, dan Format `pack.mcmeta`
- **`version.json` `pack_version`:** `{"resource_major": 84, "resource_minor": 0, "data_major": 101, "data_minor": 1}` `[VERIFIED: 26.1.2/client.jar version.json]`.
- **Aturan `pack.mcmeta`:** Wajib menggunakan `min_format` dan `max_format` (integer `84` atau array `[84, 0]`), tanpa `supported_formats` `[VERIFIED: 26.1.2/client.jar & 26.3/client.jar PackFormat]`.

**Contoh `pack.mcmeta` valid untuk `26.1.2`:**
```json
{
  "pack": {
    "description": "Resource Pack 26.1.2",
    "min_format": [84, 0],
    "max_format": 84
  }
}
```
`[VERIFIED: 26.1.2/client.jar version.json & 26.3/client.jar PackFormat]`

---

## 2. Struktur Folder `assets/minecraft/` (Perubahan dari `1.21.11` → `26.1.2`)
- **`atlases/` (`16` file):** Perubahan pada `banner_patterns.json`, `shield_patterns.json` (menghapus `entity/banner_base` & `entity/shield_base`), dan `blocks.json` (`entity/enchanting_table_book` dipindah ke `entity/enchantment/enchanting_table_book`) `[VERIFIED: 26.1.2/client.jar]`.
- **`textures/entity/`:** Banyak file tunggal entitas (misal `armadillo.png`, `bat.png`, `blaze.png`, `dolphin.png`, `guardian.png`, `minecart.png`, `phantom.png`, `phantom_eyes.png`, `spider_eyes.png`, `trident.png`, `wandering_trader.png`, `witch.png`, dll.) dipindahkan menjadi direktori terstruktur (seperti `entity/bat/`, `entity/dolphin/`, `entity/enchantment/`, `entity/phantom/`, dll.) terkait perombakan tekstur/model baby mob di `26.1` `[VERIFIED: 26.1.2/client.jar & https://www.minecraft.net/en-us/article/minecraft-java-edition-26-1]`.
- **`gui/demo_background.png`:** Dihapus dari `26.1.2/client.jar` `[VERIFIED: 26.1.2/client.jar]`.
- **World Resource Pack:** `resources.zip` bawaan world berpindah ke subdirektori `resourcepacks/` dalam folder world `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-26-1]`.
- **`shaders/core/` (`69` file vs `75` di `1.21.11`):**
  - Ditambahkan: `item.fsh`, `item.vsh` `[VERIFIED: 26.1.2/client.jar]`.
  - Dihapus: `rendertype_entity_alpha.fsh/.vsh`, `rendertype_entity_decal.fsh/.vsh`, `rendertype_item_entity_translucent_cull.fsh/.vsh`, `rendertype_translucent_moving_block.fsh/.vsh` `[VERIFIED: 26.1.2/client.jar]`.

---

## 3. Sistem Item (`CustomModelData`, Item Component, `/give`)
- `items/*.json` (`1506` file), `models/item/*.json` (`1284` file, `overrides = 0`), `equipment/` (`46` file) `[VERIFIED: 26.1.2/client.jar]`.
- **`CustomModelData` di `26.1.2/client.jar`:** Record 4-list identik `(List<Float> floats, List<Boolean> flags, List<String> strings, List<Integer> colors)` `[VERIFIED: 26.1.2/client.jar CustomModelData]`.
- **Model Spesial Baru:** `minecraft:end_cube` (`EndCubeSpecialRenderer$Unbaked`) ditambahkan pada registry `SpecialModelRenderers` `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-26-1-pre-release-3]` `[VERIFIED: 26.3/client.jar SpecialModelRenderers]`.
- **Perintah `/give`:** Tetap memakai sintaks komponen `1.21.4+`:
  ```mcfunction
  /give @p minecraft:diamond_sword[minecraft:item_model="mypack:emerald_sword"]
  /give @p minecraft:diamond_sword[minecraft:custom_model_data={floats:[1.0]}]
  ```
  `[VERIFIED: 26.1.2/client.jar CustomModelData & https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-4]`

---

## 4. Font (`bitmap`, `space`, `ttf`, `unihex`, GUI Scale 1–4)
- 7 file font JSON vanilla di `26.1.2/client.jar` identik dengan `1.21.1` `[VERIFIED: 26.1.2/client.jar]`.
- Teks UI dan item UI dipisah memakai lightmap putih `1×1` untuk mencegah *color bleeding* dunia `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-26-1]`.
- Penyesuaian struktur komponen teks `minecraft:nbt` dan `minecraft:selector` `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-26-1-pre-release-3]`.

---

## 5. GUI / Menu & DeluxeMenus
- `generic_54.png`: `256×256` identik `[VERIFIED: 26.1.2/client.jar]`.
- `26.1.2` memperbaiki bug UI tooltip (layar *Report Player*) dan exploit Spectator PvP `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-26-1-2]`.
- Status rilis build stabil DeluxeMenus di `26.1.2`: `[UNVERIFIED]`.

---

## 6. Ikon, Rank Badge, & Emoji (Chat / TAB / Nametag)
- Menggunakan font `bitmap`/`space` PUA atau `object` text component (`1.21.9+`) + LuckPerms prefix `[VERIFIED: https://luckperms.net/wiki/Meta-Commands]`.
- Kompatibilitas plugin TAB/LPC di `26.1.2`: `[UNVERIFIED]`.

---

## 7. Hosting & Deployment (`server.properties`)
- Parameter `server.properties`, batas `250 MiB`, dan SHA-1 caching tetap sama `[VERIFIED: 26.3/client.jar DownloadedPackSource$4 & DedicatedServerProperties]`.

---

## 8. Deprecated, Dihapus, atau Breaking Change (`26.1.2`)
- **Shader Item & Entity:** `rendertype_item_entity_translucent_cull`, `rendertype_entity_alpha`, `rendertype_entity_decal`, dan `rendertype_translucent_moving_block` dihapus; item dirender lewat `core/item` `[VERIFIED: 26.1.2/client.jar]`.
- **Relokasi Tekstur Entitas & Atlas:** Banyak tekstur entitas tunggal pindah ke subdirektori khusus dan `banner_base`/`shield_base` dihapus dari atlas `[VERIFIED: 26.1.2/client.jar]`.
- **Java 25 & Un-obfuscated:** Berdampak pada tooling mod/server, namun format JSON resource pack tetap sama `[VERIFIED: piston-meta.mojang.com 26.1.2.json]`.
