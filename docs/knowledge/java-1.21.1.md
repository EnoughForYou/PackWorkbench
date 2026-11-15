# Minecraft Java Edition 1.21.1 — Spesifikasi Resource Pack (Sumber Primer)

- **Status Rilis:** Rilis resmi (`2024-08-08T12:24:45+00:00`, build `2024-08-08T12:21:55+00:00`) `[VERIFIED: piston-meta.mojang.com & 1.21.1/client.jar version.json]`.
- **Runtime:** Java 21 `[VERIFIED: piston-meta.mojang.com 1.21.1.json]`.

---

## 1. `pack_format`, `min_format`/`max_format`, dan Format `pack.mcmeta`
- **`version.json` `pack_version`:** `{"resource": 34, "data": 48}` `[VERIFIED: 1.21.1/client.jar version.json]`.
- **Field `PackMetadataSection` (`atf`):** `record PackMetadataSection(Component description, int packFormat, Optional<InclusiveRange<Integer>> supportedFormats)` `[VERIFIED: 1.21.1/client.jar atf]`.
- **`min_format` / `max_format`:** **Belum ada** di `1.21.1` (baru diperkenalkan di `1.21.9`) `[VERIFIED: 1.21.1/client.jar atf & https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-9]`.

**Contoh `pack.mcmeta` valid untuk `1.21.1`:**
```json
{
  "pack": {
    "pack_format": 34,
    "supported_formats": [34, 34],
    "description": "Resource Pack 1.21.1"
  }
}
```
`[VERIFIED: 1.21.1/client.jar atf]`

---

## 2. Struktur Folder `assets/minecraft/`
Daftar subdirektori tingkat atas di `1.21.1/client.jar` `[VERIFIED: 1.21.1/client.jar]`:
`atlases`, `blockstates`, `font`, `lang`, `models`, `particles`, `shaders`, `texts`, `textures`.
- **`items/`:** Belum ada (`0` file).
- **`equipment/`:** Belum ada (`0` file).
- **`atlases/`:** `14` file (`armor_trims.json`, `banner_patterns.json`, `beds.json`, `blocks.json`, `chests.json`, `decorated_pot.json`, `gui.json`, `map_decorations.json`, `mob_effects.json`, `paintings.json`, `particles.json`, `shield_patterns.json`, `shulker_boxes.json`, `signs.json`); sprite `item/` berada di dalam `blocks.json` `[VERIFIED: 1.21.1/client.jar]`.
- **`shaders/core/`:** `166` file `[VERIFIED: 1.21.1/client.jar]`.

---

## 3. Sistem Item (`CustomModelData`, Item Component, `/give`)
- **Mekanisme Model:** `models/item/*.json` (`1754` file) masih menggunakan `"overrides"` + `"predicate"` (`38` file vanilla memakai `overrides` di `1.21.1/client.jar`) `[VERIFIED: 1.21.1/client.jar]`.
- **Komponen `CustomModelData` (`cxi`):** `record CustomModelData(int value)` menggunakan `Codec.INT` tunggal `[VERIFIED: 1.21.1/client.jar cxi]`.
- **Perintah `/give` yang valid di `1.21.1`:**
  ```mcfunction
  /give @p minecraft:diamond_sword[minecraft:custom_model_data=1]
  ```
  *(Sintaks NBT lama `{CustomModelData:1}` sudah digantikan item components sejak `1.20.5`)* `[VERIFIED: 1.21.1/client.jar cxi & https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-4]`.

---

## 4. Font (`bitmap`, `space`, `ttf`, `unihex`, `reference`, GUI Scale 1–4)
- **File font vanilla (`1.21.1/client.jar`):** `alt.json`, `default.json`, `illageralt.json`, `uniform.json`, `include/default.json`, `include/space.json`, `include/unifont.json` `[VERIFIED: 1.21.1/client.jar]`.
- **Contoh `include/space.json` asli di `1.21.1/client.jar`:**
  `{"providers": [{"type": "space", "advances": {" ": 4, "\u200c": 0}}]}` `[VERIFIED: 1.21.1/client.jar]`.
- **Codec `SpaceProvider$Definition` (`ezo$a`):** `Codec.unboundedMap(..., Codec.FLOAT)` — menerima angka `float` apa pun (bukan terbatas `-1..1`) `[VERIFIED: 1.21.1/client.jar ezo$a]`.
- **Aturan `bitmap`:** `ascent <= height` wajib; semua baris `chars` wajib sama panjang `[VERIFIED: https://bugs.mojang.com/browse/MC-275466]` `[SECONDARY: https://minecraft.fandom.com/wiki/Resource_pack]`.
- **`object` text component (`atlas`/`player`):** Belum ada di `1.21.1` (baru hadir di `1.21.9`) `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-9]`.

---

## 5. GUI / Menu & DeluxeMenus
- **`textures/gui/container/generic_54.png`:** `256×256` piksel `[VERIFIED: 1.21.1/client.jar]`.
- **DeluxeMenus:** Gunakan `model_data: <integer>` untuk `1.21.1` (`item_model` butuh `1.21.2+` dan `model_data_component` butuh `1.21.4+`) `[VERIFIED: https://wiki.helpch.at/helpchat-plugins/deluxemenus/options-and-configurations/item]`.

---

## 6. Ikon, Rank Badge, & Emoji (Chat / TAB / Nametag)
- Memakai glyph `bitmap` PUA + `space` di `assets/<ns>/font/*.json` dan prefix LuckPerms (`/lp group <grup> meta setprefix <weight> "<prefix>"`) `[VERIFIED: https://luckperms.net/wiki/Meta-Commands]`.
- Batas input chat kotak chat Java: `256` karakter `[VERIFIED: https://bugs.mojang.com/browse/MC-236960]`.

---

## 7. Hosting & Deployment (`server.properties`)
- Properti server standar: `resource-pack-id`, `resource-pack`, `resource-pack-sha1`, `require-resource-pack`, `resource-pack-prompt` (`resource-pack-hash` deprecated) `[VERIFIED: 1.21.1/client.jar DedicatedServerProperties (obfuscated: apo)]`.
- Batas ukuran klien & SHA-1 cache: `250 MiB` (`262144000` bytes) dan caching hash SHA-1 `[VERIFIED: 1.21.1/client.jar DownloadedPackSource$4 (obfuscated: gtc$4)]`.
- Catatan kompatibilitas `Pack.a(String, atf)` (`atm.a` di `1.21.1/client.jar`): jika `pack_format` berada di luar rentang `supported_formats`, game mencatat peringatan `"Pack {} declared support for versions {} but declared main format is {}, defaulting to {}"` dan mengabaikan `supported_formats` (kembali memakai `pack_format` saja) `[VERIFIED: 1.21.1/client.jar atm.a]`.

---

## 8. Deprecated, Dihapus, atau Breaking Change (`1.21.1`)
- Terhadap era `≤ 1.20.4`, format komponen item `CustomModelData` sudah menjadi `[minecraft:custom_model_data=<int>]` (NBT `{CustomModelData:1}` tidak berlaku) `[VERIFIED: 1.21.1/client.jar cxi]`.
- Tidak ada breaking change asset besar antara `1.21` → `1.21.1` (patch hotfix server) `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-4]`.
