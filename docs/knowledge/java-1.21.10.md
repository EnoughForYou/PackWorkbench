# Minecraft Java Edition 1.21.10 — Spesifikasi Resource Pack (Sumber Primer)

- **Status Rilis:** Rilis resmi (`2025-10-07T09:17:23+00:00`, build `2025-10-07T09:14:11+00:00`), hotfix pasca `1.21.9` (*The Copper Age*) `[VERIFIED: piston-meta.mojang.com & 1.21.10/client.jar version.json]`.
- **Runtime:** Java 21 `[VERIFIED: piston-meta.mojang.com 1.21.10.json]`.

---

## 1. `pack_format`, `min_format`/`max_format`, dan Format `pack.mcmeta`
- **`version.json` `pack_version`:** `{"resource_major": 69, "resource_minor": 0, "data_major": 88, "data_minor": 0}` `[VERIFIED: 1.21.10/client.jar version.json]`.
- **Aturan `pack.mcmeta` (`1.21.9+`):**
  - `min_format` dan `max_format` wajib berpasangan; menerima integer (`69`) atau array `[69, 0]` (bukan float `69.0`) `[VERIFIED: 1.21.10/client.jar azp & 26.3/client.jar PackFormat]`.
  - `supported_formats` **dilarang** saat `min_format.major > 64` `[VERIFIED: 1.21.10/client.jar azp$a & 26.3/client.jar PackFormat$IntermediaryFormat]`.
  - `pack_format` sendirian **ditolak** untuk nilai `> 64` (opsional jika `min_format`/`max_format` sudah ada) `[VERIFIED: 1.21.10/client.jar azp$a & 26.3/client.jar PackFormat$IntermediaryFormat]`.

**Contoh `pack.mcmeta` valid untuk `1.21.10`:**
```json
{
  "pack": {
    "description": "Resource Pack 1.21.10",
    "min_format": [69, 0],
    "max_format": 69
  }
}
```
`[VERIFIED: 1.21.10/client.jar version.json & 26.3/client.jar PackFormat]`

---

## 2. Struktur Folder `assets/minecraft/` (Perubahan dari `1.21.1` → `1.21.10`)
Subdirektori tingkat atas di `1.21.10/client.jar`:
`atlases`, `blockstates`, `equipment`, `font`, `items`, `lang`, `models`, `particles`, `post_effect`, `shaders`, `texts`, `textures`, `waypoint_style` `[VERIFIED: 1.21.10/client.jar]`.
- **Baru vs `1.21.1`:** `items/` (`1488` file), `equipment/` (`44` file), `post_effect/`, dan `waypoint_style/` `[VERIFIED: 1.21.10/client.jar]`.
- **`atlases/` (`14` file):** `mob_effects.json` sudah dihapus sejak `1.21.9` (digabung ke `gui.json`), sedangkan `blocks.json` masih memuat direktori `item/` dan `trims/items/*_trim` `[VERIFIED: 1.21.9/client.jar & 1.21.10/client.jar]`.
- **`shaders/core/`:** Turun dari `166` (`1.21.1`) → `69` file (setelah konsolidasi `1.21.4` dan penghapusan file `.json` shader di `1.21.9`) `[VERIFIED: 1.21.4/client.jar, 1.21.9/client.jar, 1.21.10/client.jar]`.
- **Diff `1.21.9` → `1.21.10`:** Nol perbedaan pada `font/`, `atlases/`, `shaders/core/`, `textures/`, dan `generic_54.png` `[VERIFIED: 1.21.9/client.jar & 1.21.10/client.jar]`.

---

## 3. Sistem Item (`CustomModelData`, Item Component, `/give`)
- `models/item/*.json` (`1258` file) memiliki `overrides = 0`; seluruh pemetaan varian item berpindah ke `assets/<ns>/items/*.json` (`1488` file) `[VERIFIED: 1.21.10/client.jar & https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-4]`.
- `CustomModelData` berupa komponen objek 4-list (`floats`, `flags`, `strings`, `colors`), atau memakai komponen `minecraft:item_model` `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-4]`.
- **Perintah `/give`:**
  ```mcfunction
  /give @p minecraft:diamond_sword[minecraft:item_model="mypack:emerald_sword"]
  /give @p minecraft:diamond_sword[minecraft:custom_model_data={floats:[1.0]}]
  /give @p minecraft:stick[minecraft:custom_model_data={strings:["bat_mace"]}]
  ```
  `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-4]`

---

## 4. Font & `object` Text Component
- 7 file font JSON vanilla di `1.21.10/client.jar` identik dengan `1.21.1` `[VERIFIED: 1.21.10/client.jar]`.
- **Baru (dari `1.21.9`):** **`object` text component** (`"type": "object"`): `"atlas"` (`atlas`, `sprite`) dan `"player"` (`player`, `hat`), dirender sebagai kotak `8×8` `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-9]`.

---

## 5. GUI / Menu & DeluxeMenus
- `generic_54.png`: `256×256`, identik dengan `1.21.1` `[VERIFIED: 1.21.10/client.jar]`.
- DeluxeMenus untuk `1.21.4+`: gunakan `model_data_component` (`strings`, `floats`, `flags`, `colors`) atau `item_model` (`model_data` berstatus deprecated) `[VERIFIED: https://wiki.helpch.at/helpchat-plugins/deluxemenus/options-and-configurations/item]`.

---

## 6. Ikon, Rank Badge, & Emoji (Chat / TAB / Nametag)
- Dapat memakai font `bitmap` PUA + `space` + LuckPerms prefix, atau `object` text component `8×8` (khusus Java `1.21.9+`; butuh fallback Geyser untuk Bedrock) `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-9]` `[VERIFIED: https://luckperms.net/wiki/Meta-Commands]` `[VERIFIED: https://geysermc.org/]`.

---

## 7. Hosting & Deployment (`server.properties`)
- Parameter `server.properties`, batas `250 MiB`, dan caching SHA-1 tetap berlaku `[VERIFIED: 26.3/client.jar DownloadedPackSource$4 & DedicatedServerProperties]`.

---

## 8. Deprecated, Dihapus, atau Breaking Change (`1.21.10` vs `1.21.1`)
- `overrides` pada `models/item/*.json` dihapus (item tanpa migrasi ke `items/*.json` rusak/ungu-hitam) `[VERIFIED: 1.21.10/client.jar & https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-4]`.
- `supported_formats` dilarang pada `min_format > 64`; `pack_format` tunggal `> 64` ditolak `[VERIFIED: 26.3/client.jar PackFormat$IntermediaryFormat]`.
- `models/equipment/` tidak ada (pindah ke `equipment/`); `broken_elytra` berganti menjadi `elytra_broken`; `mob_effects` atlas dilebur ke `gui.json` `[VERIFIED: 1.21.4/client.jar & 1.21.9/client.jar]`.
