# Ringkasan Perbedaan Versi Minecraft Java (Verifikasi Sumber Primer) & Koreksi Klaim

Dokumen ini disusun ulang berdasarkan **verifikasi sumber primer langsung** dari `version_manifest_v2.json` (`piston-meta.mojang.com`), inspeksi langsung `client.jar`, `version.json`, aset `assets/minecraft/`, bytecode kelas Mojang, serta dokumentasi teknis resmi Minecraft Wiki untuk seluruh spektrum versi mulai dari `1.21.1` hingga `26.3`.

---

## 1. Status Rilis & Matriks `pack_format` Lengkap (1.21.1 – 26.3)

| Versi Java | Nama Update / Karakteristik | Status Rilis | Runtime | Resource Pack Format | Data Pack Format | Skema `pack.mcmeta` Wajib |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1.21 – 1.21.1** | Hotfix *Tricky Trials* | Rilis `[VERIFIED: piston-meta.mojang.com]` | Java 21 | `34` `[VERIFIED: 1.21.1/client.jar]` | `48` | Legacy integer (`pack_format: 34`), `supported_formats` opsional |
| **1.21.2 – 1.21.3** | *Bundles of Bravery* | Rilis `[VERIFIED: minecraft.wiki]` | Java 21 | `42` `[VERIFIED: minecraft.wiki]` | `57` | Legacy integer (`pack_format: 42`), mulai transisi definisi `item_model` |
| **1.21.4** | *The Garden Awakens* | Rilis `[VERIFIED: minecraft.wiki]` | Java 21 | `46` `[VERIFIED: 1.21.4/client.jar]` | `61` | Legacy integer (`pack_format: 46`), perombakan item (`items/*.json`), `overrides` deprecated, 4-list `CustomModelData` |
| **1.21.5** | Minor Maintenance | Rilis `[VERIFIED: minecraft.wiki]` | Java 21 | `55` `[VERIFIED: minecraft.wiki]` | `71` | Legacy integer (`pack_format: 55`) |
| **1.21.6** | Minor Feature Adjustments | Rilis `[VERIFIED: minecraft.wiki]` | Java 21 | `63` `[VERIFIED: minecraft.wiki]` | `80` | Legacy integer (`pack_format: 63`) |
| **1.21.7 – 1.21.8** | Akhir Era Format Tunggal (*Pre-Minor*) | Rilis `[VERIFIED: minecraft.wiki]` | Java 21 | `64` `[VERIFIED: minecraft.wiki]` | `81` | Legacy integer (`pack_format: 64`). Ini adalah batas `lastPreMinorVersion` (format tertinggi tanpa minor) |
| **1.21.9 – 1.21.10** | Hotfix *The Copper Age* (Era Minor Dimulai) | Rilis `[VERIFIED: piston-meta.mojang.com]` | Java 21 | `69.0` (`[69, 0]`) `[VERIFIED: 1.21.10/client.jar]` | `88.0` (`[88, 0]`) | Wajib `min_format` & `max_format`, dilarang `supported_formats` |
| **1.21.11** | *Mounts of Mayhem* | Rilis `[VERIFIED: piston-meta.mojang.com]` | Java 21 | `75.0` (`[75, 0]`) `[VERIFIED: 1.21.11/client.jar]` | `94.1` (`[94, 1]`) | Wajib `min_format` & `max_format`; pemisahan atlas `items.json` & `celestials.json` |
| **26.1 – 26.1.2** | Hotfix *Tiny Takeover* | Rilis `[VERIFIED: piston-meta.mojang.com]` | Java 25 | `84.0` (`[84, 0]`) `[VERIFIED: 26.1.2/client.jar]` | `101.1` (`[101, 1]`) | Wajib `min_format` & `max_format`; migrasi runtime Java 25, jar un-obfuscated |
| **26.2** | *Chaos Cubed* | Rilis `[VERIFIED: piston-meta.mojang.com]` | Java 25 | `88.0` (`[88, 0]`) `[VERIFIED: 26.2/client.jar]` | `107.1` (`[107, 1]`) | Wajib `min_format` & `max_format`; konsolidasi atlas (`beds.json`, `signs.json` dilepas) |
| **26.3** | *Wilderness Bound* | Rilis `[VERIFIED: piston-meta.mojang.com]` | Java 25 | `97.1` (`[97, 1]`) `[VERIFIED: 26.3/client.jar]` | `121.0` (`[121, 0]`) | Wajib `min_format` & `max_format` (minor non-nol pertama); relokasi armor trim ke `textures/palettes/trim/` |

*(Catatan runtime dari manifest: `1.21.1`–`1.21.11` berjalan pada Java 21 dan mendistribusikan `client_mappings`; mulai `26.1.2`–`26.3` berjalan pada Java 25 dan sepenuhnya un-obfuscated `[VERIFIED: piston-meta.mojang.com]`.)*

---

## 2. Aturan Persis `pack.mcmeta` (Hasil Uji Bytecode `PackFormat.java`)

Berdasarkan `net.minecraft.server.packs.metadata.pack.PackFormat` dan `PackFormat$IntermediaryFormat` di `26.3/client.jar` `[VERIFIED: 26.3/client.jar PackFormat]`:
- **Tipe JSON `min_format` dan `max_format`:** Menggunakan `ExtraCodecs.compactListCodec(ExtraCodecs.NON_NEGATIVE_INT, ExtraCodecs.NON_NEGATIVE_INT.listOf(1, 256))`. Artinya **hanya menerima integer non-negatif** (misal `88`, `97`) **atau array integer `[major, minor]`** (misal `[97, 1]`, `[69, 0]`).
  - Integer tunggal pada `min_format` ditafsirkan `[major, 0]`; pada `max_format` ditafsirkan `[major, Integer.MAX_VALUE]` (`major.*`).
  - **Float JSON seperti `84.0` atau `97.1` TIDAK VALID** di codec Mojang (ditolak oleh `ExtraCodecs.NON_NEGATIVE_INT`).
- **Batas Era Minor (`lastPreMinorVersion`):**
  - `CLIENT_RESOURCES` (Resource Pack) = **`64`** (1.21.8 ke bawah).
  - `SERVER_DATA` (Data Pack) = **`81`**.
- **Aturan Kombinasi Field (`PackFormat$IntermediaryFormat.validate`):**
  1. `min_format` dan `max_format` **harus sama-sama ada atau sama-sama tidak ada** (`min.isPresent() != max.isPresent()` menghasilkan error).
  2. Jika `min_format.major > 64` (semua pack murni `1.21.9+` seperti `1.21.10`, `1.21.11`, `26.1.2`, `26.2`, `26.3`):
     - `supported_formats` **DILARANG** (jika ada → `DataResult.error`).
     - `pack_format` opsional; jika ditulis, harus `>= 15` dan berada di antara `min.major` dan `max.major`.
  3. Jika `min_format` dan `max_format` tidak ada (mode legacy), `pack_format` tunggal (atau `supported_formats`) **tidak boleh melebihi `64`**. Artinya menulis `{"pack": {"pack_format": 75, ...}}` atau `"pack_format": 84` sendirian **GAGAL validasi di klien modern** `[VERIFIED: 26.3/client.jar PackFormat$IntermediaryFormat]`.
  4. Jika pack lintas era (`min_format.major <= 64` dan `max_format.major >= 65`), `supported_formats` dan `pack_format` sama-sama **wajib** disertakan untuk menjangkau klien pra-`1.21.9` `[VERIFIED: 26.3/client.jar PackFormat$IntermediaryFormat]`.

---

## 3. Matriks Perbandingan Versi × Fitur (Sumber Primer `client.jar`)

| Fitur / Aspek | `1.21.1` | `1.21.10` | `1.21.11` | `26.1.2` | `26.2` | `26.3` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`pack.mcmeta` valid** | `pack_format: 34` (`supported_formats` opsional) `[VERIFIED: 1.21.1/client.jar atf]` | `min_format` & `max_format` (`69` / `[69, 0]`); tanpa `supported_formats` `[VERIFIED: 1.21.10/client.jar & 26.3/client.jar PackFormat]` | `min_format` & `max_format` (`75` / `[75, 0]`) `[VERIFIED: 1.21.11/client.jar version.json]` | `min_format` & `max_format` (`84` / `[84, 0]`) `[VERIFIED: 26.1.2/client.jar version.json]` | `min_format` & `max_format` (`88` / `[88, 0]`) `[VERIFIED: 26.2/client.jar version.json]` | `min_format` & `max_format` (`[97, 1]`) `[VERIFIED: 26.3/client.jar version.json]` |
| **Definisi Item & Model** | `items/*.json = 0`; `models/item/*.json = 1754` (`overrides = 38`); `equipment = 0` `[VERIFIED: 1.21.1/client.jar]` | `items/*.json = 1488`; `models/item/*.json = 1258` (`overrides = 0`); `equipment = 44` `[VERIFIED: 1.21.10/client.jar]` | `items/*.json = 1505`; `models/item/*.json = 1283` (`overrides = 0`) `[VERIFIED: 1.21.11/client.jar]` | `items/*.json = 1506`; `models/item/*.json = 1284`; `equipment = 46`; tipe `end_cube` `[VERIFIED: 26.1.2/client.jar & 26.3/client.jar SpecialModelRenderers]` | `items/*.json = 1537`; `models/item/*.json = 1271`; `equipment = 46` `[VERIFIED: 26.2/client.jar]` | `items/*.json = 1658`; `models/item/*.json = 1309`; `equipment = 46` `[VERIFIED: 26.3/client.jar]` |
| **Komponen `CustomModelData`** | Record `int` tunggal `[VERIFIED: 1.21.1/client.jar cxi]` | 4-list `(floats, flags, strings, colors)` `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-4]` | Sama (`4-list`) `[VERIFIED: 26.1.2/client.jar CustomModelData]` | 4-list `(floats, flags, strings, colors)` `[VERIFIED: 26.1.2/client.jar CustomModelData]` | 4-list `(floats, flags, strings, colors)` `[VERIFIED: 26.2/client.jar CustomModelData]` | 4-list `(floats, flags, strings, colors)` `[VERIFIED: 26.3/client.jar CustomModelData]` |
| **Atlases (`atlases/*.json`)** | `14` atlas (`item/` ada di `blocks.json`) `[VERIFIED: 1.21.1/client.jar]` | `14` atlas (`mob_effects.json` dihapus di `1.21.9` & masuk `gui.json`; `item/` masih di `blocks.json`) `[VERIFIED: 1.21.10/client.jar]` | **`16` atlas**: **muncul `items.json` & `celestials.json`**; `item/` & trim item dikeluarkan dari `blocks.json` `[VERIFIED: 1.21.11/client.jar]` | `16` atlas (refaktor path `enchantment/enchanting_table_book`, banner & shield pattern) `[VERIFIED: 26.1.2/client.jar]` | **`14` atlas**: `beds.json` & `signs.json` dihapus (pindah ke `block/` & `gui/signs/`) `[VERIFIED: 26.2/client.jar]` | **`13` atlas**: `armor_trims.json` dihapus; `items.json` pakai `trim_base` & `trim/*` `[VERIFIED: 26.3/client.jar]` |
| **Font JSON Vanilla** | 7 file (`alt`, `default`, `illageralt`, `uniform`, `include/*`) `[VERIFIED: 1.21.1/client.jar]` | **Identik** dengan `1.21.1` `[VERIFIED: 1.21.10/client.jar]` | **Identik** dengan `1.21.1` `[VERIFIED: 1.21.11/client.jar]` | **Identik** dengan `1.21.1` `[VERIFIED: 26.1.2/client.jar]` | **Identik** dengan `1.21.1` `[VERIFIED: 26.2/client.jar]` | **Identik** dengan `1.21.1` `[VERIFIED: 26.3/client.jar]` |
| **Core Shaders (`shaders/core/`)** | `166` file `[VERIFIED: 1.21.1/client.jar]` | `69` file (setelah konsolidasi `1.21.4` & penghapusan `.json` rendertype di `1.21.9`) `[VERIFIED: 1.21.10/client.jar]` | `75` file (+`animate_sprite.*`, `block.*`, `debug_point.vsh`) `[VERIFIED: 1.21.11/client.jar]` | `69` file (+`item.fsh/.vsh`; -`rendertype_item_entity_translucent_cull.*`, dll.) `[VERIFIED: 26.1.2/client.jar]` | `61` file (+`text.*`, `text_background.*`; -`rendertype_text*`) `[VERIFIED: 26.2/client.jar]` | `63` file (+OIT `blit_depth.fsh`, `integrate_depth.fsh`, `oit_*`, `clouds.*`, `world_border.*`; -`text_background.*`) `[VERIFIED: 26.3/client.jar]` |
| **`generic_54.png`** | `256×256` (`sha1: c4bf2bd6a108...`) `[VERIFIED: 1.21.1/client.jar]` | Identik byte-per-byte `[VERIFIED: 1.21.10/client.jar]` | Identik byte-per-byte `[VERIFIED: 1.21.11/client.jar]` | Identik byte-per-byte `[VERIFIED: 26.1.2/client.jar]` | Identik byte-per-byte `[VERIFIED: 26.2/client.jar]` | Identik byte-per-byte (`176px` lebar, `114+rows*18` tinggi, judul `8,6`) `[VERIFIED: 26.3/client.jar ContainerScreen]` |
| **Armor Trim Palettes** | `textures/trims/color_palettes/` (`15` PNG) `[VERIFIED: 1.21.1/client.jar]` | `textures/trims/color_palettes/` (`17` PNG) `[VERIFIED: 1.21.10/client.jar]` | Sama (`17` PNG) `[VERIFIED: 1.21.11/client.jar]` | Sama (`17` PNG) `[VERIFIED: 26.1.2/client.jar]` | Sama (`17` PNG) `[VERIFIED: 26.2/client.jar]` | Pindah ke `textures/palettes/trim/` & `textures/palettes/trim_base.png` `[VERIFIED: 26.3/client.jar]` |

---

## 4. Tabel Audit Klaim Lama (Putaran 1 & `docs/` Lama) → Hasil Verifikasi Sumber Primer

| Klaim Lama | Status Verifikasi | Fakta Primer dari Jar / Sumber Resmi |
| :--- | :--- | :--- |
| `/give ...{CustomModelData:1}` (NBT) & `overrides` berlaku universal | **SALAH / USANG** | Sejak `1.20.5` pakai item component (`[minecraft:custom_model_data=1]` di `1.21.1`), dan sejak `1.21.4` `overrides` diganti `assets/<ns>/items/*.json` + komponen 4-list `[VERIFIED: 1.21.1/client.jar cxi & https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-4]`. |
| DeluxeMenus memakai `custom_model_data: 1` | **SALAH** | Key DeluxeMenus adalah `model_data` (kini deprecated utk `1.21.4+`), diganti `model_data_component` (`1.21.4+`) dan `item_model` (`1.21.2+`) `[VERIFIED: https://wiki.helpch.at/helpchat-plugins/deluxemenus/options-and-configurations/item]`. |
| Tabrakan codepoint di `1.21.11+` ditandai validator vanilla / tidak lagi diam-diam | **SALAH** | Di `1.21.11/client.jar` (`FontSet`/`FontManager`), **provider aktif lebih awal menang diam-diam** (tanpa log tabrakan lintas pack/provider). Log duplikat vanilla hanya terjadi jika 1 codepoint muncul 2× dalam PNG `BitmapProvider` yang sama `[VERIFIED: 1.21.11/client.jar gnp/gnr & 26.3/client.jar BitmapProvider]`. |
| Atlas `items.json` dipisah pada `1.21.11` | **BENAR** | `1.21.10/client.jar` masih memiliki `item/` di `atlases/blocks.json` tanpa `items.json`. `atlases/items.json` & `celestials.json` baru muncul di `1.21.11/client.jar` `[VERIFIED: 1.21.10/client.jar & 1.21.11/client.jar]`. |
| Provider `space` hanya menerima pecahan antara `-1` dan `1` | **SALAH** | `SpaceProvider$Definition` di `1.21.1` (`ezo$a`) hingga `26.3` memakai `Codec.FLOAT` tanpa batas `-1..1`. Namun `FontSet.hasFishyAdvance` menganggap `advance < 0 || advance > 32.0f` sebagai *fishy* di mode `nonFishyGlyphs` `[VERIFIED: 1.21.1/client.jar ezo$a & 26.3/client.jar SpaceProvider/FontSet]`. |
| GUI Scale genap rapi, ganjil celah piksel karena rumus scale ganjil | **BERUBAH / TIDAK AKURAT** | `Window.calculateScale` menghitung integer `scale >= 1`. `Font$PreparedTextBuilder` & `BakedSheetGlyph` mengirim koordinat **float mentah** tanpa pembulatan ke GPU. Celah piksel terjadi akibat advance/koordinat pecahan relatif terhadap grid piksel GPU saat dikalikan `guiScale`, bukan sekadar ganjil/genap `[VERIFIED: 26.3/client.jar Window/Font$PreparedTextBuilder/BakedSheetGlyph]`. |
| `pack.mcmeta` menerima float seperti `84.0` atau `97.1` | **SALAH** | `PackFormat.fullCodec` hanya menerima `NON_NEGATIVE_INT` atau array integer `[major, minor]` `[VERIFIED: 26.3/client.jar PackFormat]`. |
| Panel chest vanilla `176px` lebar, `222px` tinggi (6 baris), judul `x=8, y=6` | **BENAR** | Terbukti di `AbstractContainerScreen` (`titleLabelX=8`, `titleLabelY=6`) dan `ContainerScreen` (`imageWidth=176`, `imageHeight=114 + rows * 18` = `222`) `[VERIFIED: 26.3/client.jar AbstractContainerScreen/ContainerScreen]`. |
| Batas pack server `250 MiB` & cache berdasarkan SHA-1 | **BENAR** | `DownloadedPackSource$4` menetapkan `MAX_PACK_SIZE_BYTES = 262144000` (`250 × 1024 × 1024`) dan `HttpUtil.downloadFile` mengecek cache berdasarkan `HashCode` SHA-1 `[VERIFIED: 26.3/client.jar DownloadedPackSource$4 & HttpUtil]`. |
| `26.3` memakai format `97.1` (minor `1`) | **BENAR** | `26.3/client.jar` `version.json` mencantumkan `resource_major: 97, resource_minor: 1` (sehingga `min_format: [97, 1]` atau `97`) `[VERIFIED: 26.3/client.jar version.json]`. |
| `\uE000`–`\uE00E` aman untuk Bedrock & `GeyserOptionalPack` | **SALAH / USANG** | `U+E000`–`U+E1FF` dipakai controller/HUD vanilla Bedrock (`glyph_E0`/`E1`); `GeyserOptionalPack` diganti `GeyserIntegratedPack` & mapping v1 deprecated ke v2 `[VERIFIED: https://geysermc.org/crp/wiki/other/geyserintegratedpack/]` `[VERIFIED: https://geysermc.org/wiki/geyser/custom-items/]` `[SECONDARY: https://wiki.bedrock.dev/text/custom-emojis]`. |


---

## 4. Verifikasi Bytecode Tambahan (Implementasi Fase 1)
- **`1.21.1` `server.properties` & batas ukuran:** `1.21.1/client.jar` (`DedicatedServerProperties` obfuscated: `apo`, `DownloadedPackSource$4` obfuscated: `gtc$4`) mendukung `resource-pack-id`, `resource-pack`, `resource-pack-sha1`, `require-resource-pack`, `resource-pack-prompt`, dan batas unduhan `250 MiB` (`262144000` bytes) `[VERIFIED: 1.21.1/client.jar apo & gtc$4]`.
- **`1.21.1` `Pack.a(String, atf)` (`atm.a`):** Bila `pack_format` berada di luar rentang `supported_formats`, `1.21.1` mencatat warning dan mengabaikan `supported_formats` (hanya memakai `pack_format`) `[VERIFIED: 1.21.1/client.jar atm.a]`.
- **`1.21.10` & `1.21.11` `PackFormat$IntermediaryFormat`:** Bytecode validasi (`azp$a` di `1.21.10`, `azz$a` di `1.21.11`, `lastPreMinorVersion = 64` untuk client resource pack) identik dengan `26.3/client.jar` `[VERIFIED: 1.21.10/client.jar azp$a, 1.21.11/client.jar azz$a, 26.3/client.jar]`.
- **`PackCompatibility.forVersion` (`26.3/client.jar`):** Mengecek `maxInclusive.compareTo(clientFormat) < 0` (`TOO_OLD`) dan `clientFormat.compareTo(minInclusive) < 0` (`TOO_NEW`). Karena `max_format: 97` diekspansi menjadi `[97, 2147483647]`, ia `COMPATIBLE` di `26.3` (`[97, 1]`), sedangkan `max_format: [97, 0]` menjadi `TOO_OLD` `[VERIFIED: 26.3/client.jar PackCompatibility.forVersion & PackFormat$IntermediaryFormat]`.
