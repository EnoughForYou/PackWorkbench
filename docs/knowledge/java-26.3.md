# Minecraft Java Edition 26.3 — Spesifikasi Resource Pack (Sumber Primer)

- **Status Rilis:** Rilis resmi (`2026-09-15T11:23:02+00:00`, build `2026-09-15T11:20:48+00:00`) — drop *Wilderness Bound* `[VERIFIED: piston-meta.mojang.com & 26.3/client.jar version.json]`.
- **Runtime:** Java 25, un-obfuscated `[VERIFIED: piston-meta.mojang.com 26.3.json]`.

---

## 1. `pack_format`, `min_format`/`max_format`, dan Format `pack.mcmeta`
- **`version.json` `pack_version`:** `{"resource_major": 97, "resource_minor": 1, "data_major": 121, "data_minor": 0}` `[VERIFIED: 26.3/client.jar version.json]`.
  - Terbukti resmi bahwa `26.3` menggunakan **minor `1`** (`[97, 1]`), sehingga konflik catatan komunitas `97` vs `97.1` terpecahkan `[VERIFIED: 26.3/client.jar version.json]`.
- **Aturan `pack.mcmeta`:** Wajib memakai `min_format` dan `max_format` (misal `[97, 1]` atau integer `97` pada `max_format` untuk mencakup `97.*`), **jangan** menulis float JSON `97.1` dan **jangan** menyertakan `supported_formats` `[VERIFIED: 26.3/client.jar PackFormat]`.

**Contoh `pack.mcmeta` valid untuk `26.3`:**
```json
{
  "pack": {
    "description": "Resource Pack 26.3 (Wilderness Bound)",
    "min_format": [97, 1],
    "max_format": 97
  }
}
```
`[VERIFIED: 26.3/client.jar version.json & PackFormat]`

---

## 2. Struktur Folder `assets/minecraft/` (Perubahan dari `26.2` → `26.3`)
- **`atlases/` (`13` file vs `14` di `26.2`):**
  - **`armor_trims.json` DIHAPUS** `[VERIFIED: 26.3/client.jar]`.
  - **`items.json` diperbarui:** `palette_key` berubah menjadi `"minecraft:trim_base"` dan permutations menjadi `"minecraft:trim/<material>"` `[VERIFIED: 26.3/client.jar atlases/items.json]`.
- **`textures/` (Relokasi Palette Armor Trim & Aset Baru):**
  - `textures/trims/color_palettes/` **dihapus** dan dipindahkan ke **`textures/palettes/trim/`** + **`textures/palettes/trim_base.png`** `[VERIFIED: 26.3/client.jar]`.
  - `item/filled_map_markings.png` dan `item/light.png` dihapus dari daftar `textures/` sebelumnya `[VERIFIED: 26.3/client.jar]`.
  - Aset baru: *Dappled Forest*, *Poplar* wood set (`poplar_log`, `poplar_planks`, `poplar_shelf`, `poplar_sign`, `poplar_boat`, dll.), `straw_bed.png`, `entity/cushion/` & 16 warna `*_cushion.png`, `shelf_mushroom_*`, `red_shrub.png`, 16 peta struktur baru (`*_map.png`), serta `block/destroy_oit_stage_0..9.png` `[VERIFIED: 26.3/client.jar]`.
- **`shaders/core/` (`63` file vs `61` di `26.2`):**
  - Ditambahkan: `blit_depth.fsh`, `integrate_depth.fsh`, `oit_composite.fsh`, `oit_depth_bounds_cull.fsh`, `clouds.fsh/.vsh`, `world_border.fsh/.vsh` `[VERIFIED: 26.3/client.jar]`.
  - Dihapus: `rendertype_clouds.fsh/.vsh`, `rendertype_world_border.fsh/.vsh`, `text_background.fsh/.vsh` `[VERIFIED: 26.3/client.jar]`.

---

## 3. Sistem Item (`CustomModelData`, Item Component, `/give`)
- `items/*.json` bertambah menjadi `1658` file; `models/item/*.json` menjadi `1309` file (`overrides = 0`), `equipment/` tetap `46` file `[VERIFIED: 26.3/client.jar]`.
- **`CustomModelData`:** Record 4-list identik `(floats, flags, strings, colors)` `[VERIFIED: 26.3/client.jar CustomModelData]`.
- Perintah `/give` tetap memakai sintaks item component `1.21.4+`:
  ```mcfunction
  /give @p minecraft:diamond_sword[minecraft:item_model="mypack:emerald_sword"]
  /give @p minecraft:diamond_sword[minecraft:custom_model_data={floats:[1.0]}]
  ```
  `[VERIFIED: 26.3/client.jar CustomModelData]`

---

## 4. Font (`bitmap`, `space`, `ttf`, `unihex`, GUI Scale 1–4)
- 7 file font JSON vanilla di `26.3/client.jar` masih identik dengan `1.21.1` `[VERIFIED: 26.3/client.jar]`.
- Namun di `shaders/core/`, **`text_background.fsh/.vsh` dihapus** (pack shader kustom yang menimpa background teks perlu menyesuaikan) `[VERIFIED: 26.3/client.jar]`.
- Bytecode renderer font di `26.3/client.jar` (`Window.calculateScale`, `Font$PreparedTextBuilder`, `BakedSheetGlyph`) memancarkan vertex **float mentah tanpa pembulatan** `[VERIFIED: 26.3/client.jar]`.

---

## 5. GUI / Menu & DeluxeMenus
- `generic_54.png` identik (`256×256`, `sha1: c4bf2bd6a108...`) dan koordinat `ContainerScreen` tetap `imageWidth=176`, `imageHeight=114 + rows*18`, `titleLabelX=8`, `titleLabelY=6` `[VERIFIED: 26.3/client.jar ContainerScreen]`.
- Status rilis build DeluxeMenus untuk server `26.3`: `[UNVERIFIED]`.

---

## 6. Ikon, Rank Badge, & Emoji (Chat / TAB / Nametag)
- Tetap menggunakan font `bitmap`/`space` atau `object` text component (`1.21.9+`); kompatibilitas plugin LuckPerms/TAB/LPC di `26.3`: `[UNVERIFIED]`.

---

## 7. Hosting & Deployment (`server.properties`)
- `DedicatedServerProperties` tetap membaca `resource-pack-id`, `resource-pack`, `resource-pack-sha1`, `require-resource-pack`, `resource-pack-prompt` (serta `resource-pack-hash` deprecated) `[VERIFIED: 26.3/client.jar DedicatedServerProperties]`.
- Klien `DownloadedPackSource$4` menetapkan batas `MAX_PACK_SIZE_BYTES = 262144000` (`250 MiB`) dan cache SHA-1 di `HttpUtil.downloadFile` `[VERIFIED: 26.3/client.jar DownloadedPackSource$4 & HttpUtil]`.

---

## 8. Deprecated, Dihapus, atau Breaking Change (`26.3`)
- **Penghapusan `atlases/armor_trims.json` & Relokasi Trim:** `textures/trims/color_palettes/` pindah ke `textures/palettes/trim/` + `textures/palettes/trim_base.png`, dan armor trim entitas dibuat *on-demand* `[VERIFIED: 26.3/client.jar & https://www.minecraft.net/en-us/article/minecraft-java-edition-26-3]`.
- **OIT & Penghapusan Core Shader:** Penambahan `blit_depth.fsh` / `oit_*`, penghapusan `rendertype_clouds.*`, `rendertype_world_border.*`, dan `text_background.*` `[VERIFIED: 26.3/client.jar]`.
- **Penghapusan `item/filled_map_markings.png` & `item/light.png`:** Pack yang meng-override item tersebut harus menyesuaikan `[VERIFIED: 26.3/client.jar]`.
