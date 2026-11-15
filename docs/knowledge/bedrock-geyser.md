# Ekosistem Bedrock Edition, GeyserMC, & Floodgate (Sumber Primer & Evaluasi Sekunder)

Dokumen ini memisahkan spesifikasi resmi Microsoft (`learn.microsoft.com`) dan wiki resmi GeyserMC (`geysermc.org`) dari konvensi/dokumentasi komunitas (`wiki.bedrock.dev` yang ditandai `[SECONDARY]`).

---

## 1. Format `manifest.json` Bedrock

- **`format_version: 2` (Standar resmi Microsoft Learn):** Menggunakan array versi `[1, 0, 0]`, `header` (`name`, `description`, `uuid`, `version`, `min_engine_version`), dan `modules` (`type: "resources"`, `uuid`, `version`) `[VERIFIED: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/addonsreference/packmanifest?view=minecraft-bedrock-stable]`.
- **`format_version: 3`:** Direkomendasikan oleh dokumentasi komunitas `wiki.bedrock.dev` (memakai string SemVer `"1.0.0"` + `metadata.authors`) `[SECONDARY: https://wiki.bedrock.dev/concepts/manifest]`. *(Dukungan parser `packs/` GeyserMC terhadap `format_version: 3` masih `[UNVERIFIED]`.)*
- `header.uuid` dan `modules[].uuid` wajib UUID v4 unik `[VERIFIED: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/addonsreference/packmanifest?view=minecraft-bedrock-stable]`.

---

## 2. Sistem Glyph Bedrock (`RP/font/glyph_XX.png`)

- Bedrock memetakan glyph secara struktural pada PNG grid **16 kolom × 16 baris** (`256` karakter per halaman) dengan rumus $\text{Unicode} = \text{Base} + (\text{Row} \times 16) + \text{Col}$ `[SECONDARY: https://wiki.bedrock.dev/text/custom-emojis]`.
- **Tabel Risiko Tabrakan Vanilla:**
  - `glyph_E0.png` (`U+E000`–`U+E0FF`): **TINGGI** — dipakai controller/mouse/UI prompts vanilla `[SECONDARY: https://wiki.bedrock.dev/text/emojis]`.
  - `glyph_E1.png` (`U+E100`–`U+E1FF`): **TINGGI** — dipakai HUD hearts, food shanks, armor, item tokens vanilla `[SECONDARY: https://wiki.bedrock.dev/text/emojis]`.
  - `glyph_E2.png`–`glyph_E8.png` (hingga `F8`): **Aman dari vanilla** (tetap berisiko bentrok jika dua pack pihak ketiga memilih halaman yang sama) `[SECONDARY: https://wiki.bedrock.dev/text/custom-emojis]`.
- **Aturan Kanvas & Anti *Pixel Bleeding*:** Dimensi lebar dan tinggi harus habis dibagi `16`, latar wajib transparan penuh (`alpha = 0`), dan piksel ikon tidak boleh menyentuh/meluber ke sel sebelah `[SECONDARY: https://wiki.bedrock.dev/text/custom-emojis]`.

---

## 3. `flipbook_textures.json`, `textures_list.json`, & `.tga`

- **`RP/textures/flipbook_textures.json`:** Berupa array objek JSON dengan field `atlas_tile` (key di `terrain_texture.json`), `flipbook_texture` (path strip vertikal tanpa `.png`), `ticks_per_frame` (`20 ticks = 1 detik`), serta field opsional `frames`, `blend_frames`, `replicate`, `atlas_index` `[VERIFIED: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/addonsreference/packmanifest?view=minecraft-bedrock-stable]` *(detail field lengkap dari `[SECONDARY: https://wiki.bedrock.dev/blocks/flipbook-textures]`)*.
- **`RP/textures/textures_list.json`:** Array daftar path tekstur untuk caching Render Dragon agar mencegah bug *asset-swapping* `[SECONDARY: https://wiki.bedrock.dev/concepts/textures-list]`.
- **`.tga` & Alpha Channel / Emissive / Tint / PBR:** Alpha channel dipakai untuk transparansi, alpha testing, mask emisi (`entity_emissive`), dan tint (`alpha_masked_tint`); PBR modern memakai `*.texture_set.json` `[SECONDARY: https://wiki.bedrock.dev/concepts/textures-list]`.

---

## 4. Batas Performa Mobile Bedrock (Android / iOS)

- GeyserMC memperingatkan secara resmi bahwa resolusi tekstur terlalu tinggi (seperti `2048×2048`) dan geometri 3D berpoligon tinggi menyebabkan *Out-Of-Memory (OOM) crash*, tekstur hitam/hilang, dan penurunan FPS pada klien mobile `[VERIFIED: https://geysermc.org/wiki/geyser/custom-items/]`.
- Angka batas keras kuantitatif dari dokumen `docs/` lama (`< 500` kubus, atlas maks `1024×1024 px`) tidak tercantum sebagai batas resmi di dokumentasi GeyserMC `[UNVERIFIED — hanya rule of thumb komunitas]`.

---

## 5. Pemetaan & Limitasi GeyserMC + Floodgate (`geysermc.org`)

- **`enable-custom-content: true`** di `config.yml` mengaktifkan custom items/blocks `[VERIFIED: https://geysermc.org/wiki/geyser/custom-content/]`.
- **`custom_mappings` Format v2 (`"format_version": 2`):** Wajib sejak Geyser API v2.9.3+ (format v1 sudah *deprecated*) `[VERIFIED: https://geysermc.org/wiki/geyser/custom-items/]`.
- **`GeyserIntegratedPack`:** Menggantikan nama lama `GeyserOptionalPack` `[VERIFIED: https://geysermc.org/crp/wiki/other/geyserintegratedpack/]`.
- **Tooling Konversi Kompleks:** **Kas-tle `java2bedrock.sh`** dan **GeyserMC `Rainbow`** (Fabric mod) `[VERIFIED: https://geysermc.org/wiki/other/rainbow/]` `[SECONDARY: https://github.com/Kas-tle/java2bedrock.sh]`.
- **`skin-hashes`:** Tekstur Player Head kustom harus didaftarkan terlebih dahulu agar tidak tampil sebagai Steve/Alex `[VERIFIED: https://geysermc.org/]`.

### Yang **TIDAK Bisa Dipetakan** ke Bedrock
1. Custom item varian vanilla secara otomatis tanpa definisi item unik Bedrock di `custom_mappings` + Bedrock RP `[VERIFIED: https://geysermc.org/wiki/geyser/custom-items/]`.
2. Negative space font & custom HUD/GUI overlay berbasis pergeseran font Java `[VERIFIED: https://geysermc.org/wiki/geyser/custom-content/]`.
3. Chest GUI ukuran non-standar (1, 2, 4, 5 baris) dan interaksi Shift-click/drag-click yang identik (pakai **Cumulus Forms** via Floodgate) `[VERIFIED: https://geysermc.org/cs/wiki/geyser/forms/]`.
4. Core shaders GLSL Java (`core/item`, `text.fsh`, `blit_depth.fsh`, dll.) `[VERIFIED: https://geysermc.org/wiki/geyser/custom-content/]`.
5. Tekstur player head dinamis yang belum terdaftar di `skin-hashes` `[VERIFIED: https://geysermc.org/]`.
6. Display entities & `object` text component (`1.21.9+`) tanpa bridge/fallback khusus `[VERIFIED: https://geysermc.org/wiki/other/rainbow/]` `[VERIFIED: https://geysermc.org/]`.
