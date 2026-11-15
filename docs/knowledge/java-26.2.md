# Minecraft Java Edition 26.2 — Spesifikasi Resource Pack (Sumber Primer)

- **Status Rilis:** Rilis resmi (`2026-06-16T12:03:33+00:00`, build `2026-06-16T12:01:27+00:00`) — drop *Chaos Cubed* `[VERIFIED: piston-meta.mojang.com & 26.2/client.jar version.json]`.
- **Runtime:** Java 25, un-obfuscated `[VERIFIED: piston-meta.mojang.com 26.2.json]`.

---

## 1. `pack_format`, `min_format`/`max_format`, dan Format `pack.mcmeta`
- **`version.json` `pack_version`:** `{"resource_major": 88, "resource_minor": 0, "data_major": 107, "data_minor": 1}` `[VERIFIED: 26.2/client.jar version.json]`.
- **Aturan `pack.mcmeta`:** Wajib memakai `min_format` dan `max_format` (`88` atau `[88, 0]`), tanpa `supported_formats` `[VERIFIED: 26.2/client.jar version.json & 26.3/client.jar PackFormat]`.

**Contoh `pack.mcmeta` valid untuk `26.2`:**
```json
{
  "pack": {
    "description": "Resource Pack 26.2 (Chaos Cubed)",
    "min_format": [88, 0],
    "max_format": 88
  }
}
```
`[VERIFIED: 26.2/client.jar version.json & 26.3/client.jar PackFormat]`

---

## 2. Struktur Folder `assets/minecraft/` (Perubahan dari `26.1.2` → `26.2`)
- **`atlases/` (`14` file vs `16` di `26.1.2`):** **`beds.json` dan `signs.json` DIHAPUS** `[VERIFIED: 26.2/client.jar]`.
- **`textures/` (Breaking Relokasi Bed, Sign, & Pillar):**
  - `entity/bed/` dan `entity/signs/` **dihapus**! Tekstur bed dan sign dipindahkan ke `textures/block/` (misal `block/oak_sign.png`, `block/oak_hanging_sign.png`, `block/red_bed_head_up.png`, `block/bed_down.png`, dll.) serta `textures/gui/signs/` `[VERIFIED: 26.2/client.jar]`.
  - `block/purpur_pillar.png` dan `block/quartz_pillar.png` diganti/dipindah ke `block/purpur_pillar_side.png` dan `block/quartz_pillar_side.png` `[VERIFIED: 26.2/client.jar]`.
  - Aset konten baru: blok **Cinnabar**, **Sulfur**, **Sulfur Spikes**, **Potent Sulfur**, entitas **Sulfur Cube** (`entity/sulfur_cube/`), item `music_disc_bounce.png`, `sulfur_cube_bucket.png`, `sulfur_cube_spawn_egg.png`, serta partikel geyser & gas (`particle/geyser_*`, `noxious_gas_*`, `sulfur_cube_goo.png`) `[VERIFIED: 26.2/client.jar]`.
- **Bahasa (`lang/`):** Ditambahkan 5 bahasa baru (Swiss French, Chuvash, Gallo, Uzbek, Võro) `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-26-2]`.
- **`shaders/core/` (`61` file vs `69` di `26.1.2`):**
  - Ditambahkan: `text.fsh`, `text.vsh`, `text_background.fsh`, `text_background.vsh` `[VERIFIED: 26.2/client.jar]`.
  - Dihapus (12 file): `rendertype_text.fsh/.vsh`, `rendertype_text_background.fsh/.vsh`, `rendertype_text_background_see_through.fsh/.vsh`, `rendertype_text_intensity.fsh/.vsh`, `rendertype_text_intensity_see_through.fsh/.vsh`, `rendertype_text_see_through.fsh/.vsh` `[VERIFIED: 26.2/client.jar]`.

---

## 3. Sistem Item (`CustomModelData`, Item Component, `/give`)
- `items/*.json` naik menjadi `1537` file; `models/item/*.json` menjadi `1271` file (`overrides = 0`), `equipment/` tetap `46` file `[VERIFIED: 26.2/client.jar]`.
- **`CustomModelData`:** Record 4-list identik `(floats, flags, strings, colors)` `[VERIFIED: 26.2/client.jar CustomModelData]`.
- Perintah `/give` tetap memakai sintaks item components `1.21.4+` (`[minecraft:item_model="..."]` / `[minecraft:custom_model_data={...}]`) `[VERIFIED: 26.2/client.jar CustomModelData]`.

---

## 4. Font (`bitmap`, `space`, `ttf`, `unihex`, GUI Scale 1–4)
- 7 file font JSON vanilla di `26.2/client.jar` identik dengan `1.21.1` `[VERIFIED: 26.2/client.jar]`.
- Namun karena seluruh shader `rendertype_text*` digantikan `text.fsh/.vsh` & `text_background.fsh/.vsh`, pack yang memakai core shader teks (seperti shader shadow/animasi teks kustom) **wajib ditulis ulang** `[VERIFIED: 26.2/client.jar]`.

---

## 5. GUI / Menu & DeluxeMenus
- `generic_54.png` identik (`256×256`) `[VERIFIED: 26.2/client.jar]`.
- UI menambahkan tombol/layar **Friends List** (Title Screen & Pause Menu) serta notifikasi toast teman `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-26-2]`.
- Dukungan build DeluxeMenus pada server `26.2`: `[UNVERIFIED]`.

---

## 6. Ikon, Rank Badge, & Emoji (Chat / TAB / Nametag)
- Tetap memakai font `bitmap`/`space` atau `object` text component (`1.21.9+`); dukungan plugin LuckPerms/TAB/LPC di `26.2`: `[UNVERIFIED]`.

---

## 7. Hosting & Deployment (`server.properties`)
- Parameter `server.properties`, batas `250 MiB`, dan SHA-1 caching tidak berubah `[VERIFIED: 26.3/client.jar DownloadedPackSource$4]`.

---

## 8. Deprecated, Dihapus, atau Breaking Change (`26.2`)
- **Penghapusan Atlas `beds.json` & `signs.json` + Relokasi Tekstur:** Semua tekstur `entity/bed/*` dan `entity/signs/*` pindah ke `block/*` dan `gui/signs/*` `[VERIFIED: 26.2/client.jar]`.
- **Rename Tekstur Pillar:** `block/purpur_pillar.png` → `purpur_pillar_side.png` dan `block/quartz_pillar.png` → `quartz_pillar_side.png` `[VERIFIED: 26.2/client.jar]`.
- **Perombakan Core Shader Teks:** 12 file `rendertype_text*` dihapus dan dikonsolidasikan ke `text.fsh/.vsh` dan `text_background.fsh/.vsh` `[VERIFIED: 26.2/client.jar]`.
- **Update Vulkan Pipeline:** Pembaruan eksperimental Vulkan backend `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-26-2]`.
