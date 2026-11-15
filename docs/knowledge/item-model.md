# Sistem Item Model, `CustomModelData`, Item Component, & `/give` (Sumber Primer)

Dokumen ini membedah evolusi sistem model dan komponen item Java Edition berdasarkan `1.21.1/client.jar`, `1.21.4/client.jar`, `1.21.10/client.jar`, `1.21.11/client.jar`, `26.1.2/client.jar`, `26.2/client.jar`, `26.3/client.jar`, serta dokumentasi resmi Mojang & DeluxeMenus.

---

## 1. Perbandingan Tiga Era Sistem Item Java

| Aspek | Era NBT (`≤ 1.20.4`) *(Usang)* | Era Komponen Integer (`1.20.5 – 1.21.3`, termasuk `1.21.1`) | Era Item Model Definitions (`1.21.4+`: `1.21.10`, `1.21.11`, `26.1.2`, `26.2`, `26.3`) |
| :--- | :--- | :--- | :--- |
| **Definisi di Resource Pack** | `overrides` di `models/item/*.json` | `overrides` di `models/item/*.json` (`38` file vanilla di `1.21.1/client.jar`) `[VERIFIED: 1.21.1/client.jar]` | **`assets/<ns>/items/*.json`** (`1385` file di `1.21.4` → `1658` di `26.3`; `overrides = 0` di `models/item/`) `[VERIFIED: 1.21.4–26.3/client.jar]` |
| **Struktur `CustomModelData`** | NBT `{CustomModelData:1}` | Record `CustomModelData(int value)` via `Codec.INT` `[VERIFIED: 1.21.1/client.jar cxi]` | Record `CustomModelData(List<Float> floats, List<Boolean> flags, List<String> strings, List<Integer> colors)` `[VERIFIED: 26.1.2–26.3/client.jar CustomModelData]` |
| **Tipe ItemModel (`ItemModels`)** | Tidak ada | Tidak ada | `empty`, `model`, `range_dispatch`, `special` (termasuk `end_cube` di `26.1+`), `composite`, `bundle/selected_item`, `select`, `condition` `[VERIFIED: 26.3/client.jar ItemModels & SpecialModelRenderers]` |
| **Key di DeluxeMenus** | `nbt_string` / `model_data` | `model_data: <int>` `[VERIFIED: https://wiki.helpch.at/helpchat-plugins/deluxemenus/options-and-configurations/item]` | `model_data_component` (`1.21.4+`) atau `item_model` (`1.21.2+`); `model_data` berstatus *deprecated* `[VERIFIED: https://wiki.helpch.at/helpchat-plugins/deluxemenus/options-and-configurations/item]` |

---

## 2. Implementasi untuk `1.21.1` (Format `34`)
1. Model item vanilla (`assets/minecraft/models/item/diamond_sword.json`) memakai array `"overrides"` dengan `"predicate": { "custom_model_data": 1 }` `[VERIFIED: 1.21.1/client.jar]`.
2. Perintah `/give` wajib memakai **item component integer**:
   ```mcfunction
   /give @p minecraft:diamond_sword[minecraft:custom_model_data=1]
   ```
   `[VERIFIED: 1.21.1/client.jar cxi]` *(Sintaks NBT `{CustomModelData:1}` di `docs/` lama tidak berlaku di `1.21.1`.)*

---

## 3. Implementasi untuk `1.21.10`, `1.21.11`, `26.1.2`, `26.2`, `26.3` (`1.21.4+`)

### Opsi A: Langsung via `minecraft:item_model`
1. `assets/mypack/items/emerald_sword.json`:
   ```json
   {
     "model": {
       "type": "minecraft:model",
       "model": "mypack:item/emerald_sword"
     }
   }
   ```
2. Perintah `/give`:
   ```mcfunction
   /give @p minecraft:diamond_sword[minecraft:item_model="mypack:emerald_sword"]
   ```
   `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-4]` `[VERIFIED: 26.3/client.jar ItemModels]`

### Opsi B: Multi-Varian String (`minecraft:select`) & Numerik (`minecraft:range_dispatch`)
- **String:** `custom_model_data={strings:["emerald_sword"]}` → cocok dengan `"type": "minecraft:select"`, `"property": "minecraft:custom_model_data"` `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-4]`.
- **Numerik:** `custom_model_data={floats:[1.0]}` → cocok dengan `"type": "minecraft:range_dispatch"`, `"property": "minecraft:custom_model_data"` `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-4]`.

---

## 4. Perubahan Atlas & Equipment Pasca-`1.21.4` (Terverifikasi dari Jar)
- **Equipment (`1.21.4+`):** `assets/minecraft/equipment/` menggantikan layout pra-1.21.4 (`26` file di `1.21.4` → `46` di `26.1.2`–`26.3`), dan `item/broken_elytra.png` diganti menjadi `item/elytra_broken.png` `[VERIFIED: 1.21.4/client.jar & 26.1.2/client.jar]`.
- **Pemisahan Atlas Item (`1.21.11+`):** `atlases/items.json` baru muncul di `1.21.11/client.jar`; sumber `directory: "item"` dan `trims/items/*_trim` dipindah keluar dari `atlases/blocks.json` `[VERIFIED: 1.21.11/client.jar]`.
- **Special Model `end_cube` (`26.1+`):** Ditambahkan di `SpecialModelRenderers` (`"end_cube"`) `[VERIFIED: 26.3/client.jar SpecialModelRenderers]` `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-26-1-pre-release-3]`.
- **Armor Trim Relokasi (`26.3`):** `atlases/armor_trims.json` dihapus, dan `atlases/items.json` merujuk `palette_key: "minecraft:trim_base"` serta `minecraft:trim/<material>` (`textures/palettes/trim_base.png` & `textures/palettes/trim/*.png`) `[VERIFIED: 26.3/client.jar]`.
