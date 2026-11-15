# Ekosistem Plugin Pack: ItemsAdder, Oraxen, Nexo, & Struktur Bundle Kreator

Dokumen ini merangkum temuan empiris langsung dari arsip contoh nyata di folder lokal `data/` (`Jeqo-Icon-Pack-2.zip` dan `Maximo - Better prefixes and tags Vol 1 (2).zip`) serta dokumentasi resmi plugin **ItemsAdder**, **Oraxen**, dan **Nexo**.

*(Larangan keras `AGENTS.md §4`: seluruh `.png`, model JSON komersial, dan aset dalam `data/` hanya dipakai sebagai bahan referensi analisis dan TIDAK boleh disalin atau disematkan ke kode aplikasi, fixture tes, maupun hasil build web.)*

---

## 1. Perbandingan Struktur Folder & Konfigurasi 4 Target Ekosistem

| Aspek | Vanilla Resource Pack (Langsung / `Nexo external_packs`) | **ItemsAdder** (`Maximo` & `Jeqo` + Docs) | **Oraxen** (`Maximo` & `Jeqo` + Docs) | **Nexo** (`docs.nexomc.com`) |
| :--- | :--- | :--- | :--- | :--- |
| **Jalur Root Aset** | `pack.mcmeta` + `assets/<ns>/...` di root `.zip` `[VERIFIED: client.jar]` | `ItemsAdder/data/items_packs/<ns>/<file>.yml` + `ItemsAdder/data/resource_pack/assets/<ns>/...` *(atau `contents/<ns>/configs/` & `resourcepack/assets/` di struktur baru)* `[VERIFIED: data/*.zip]` `[SECONDARY: itemsadder.com]` | `Oraxen/items/*.yml`, `Oraxen/glyphs/*.yml`, `Oraxen/pack/models/...`, `Oraxen/pack/textures/...` *(tanpa wrapper `assets/<ns>/`)* `[VERIFIED: data/*.zip]` `[VERIFIED: oraxen.com]` | `plugins/Nexo/items/*.yml`, `glyphs/*.yml`, `pack/assets/<ns>/...`, plus **`pack/external_packs/`** untuk menaruh `.zip` vanilla agar digabung otomatis `[VERIFIED: nexomc.com]` |
| **Konfig Glyph / Rank** | `assets/<ns>/font/*.json` (`BitmapProvider`: `file`, `ascent`, `height`, `chars`) `[VERIFIED: client.jar]` | Blok `font_images:` dengan `path: "<subdir>/<file>.png"` (relatif `textures/`), `scale_ratio` (`≈ height`), `y_position` (`≈ ascent`), `symbol`, `permission`, `show_in_gui` `[VERIFIED: data/Maximo imc.yml]` | File `glyphs/*.yml` dengan `texture: <subdir>/<file>` (**tanpa `.png`**, relatif `pack/textures/`), `ascent`, `height`, `chat.placeholders`, `chat.permission` `[VERIFIED: data/Maximo imc_ranks.yml]` | File `glyphs/*.yml` dengan `texture: <ns>:<path>` / `font` / `ascent` / `height` / `chat.placeholders` (`<glyph:id>`, `<shift:N>`, `%nexo_<id>%`) `[VERIFIED: nexomc.com]` |
| **Konfig Custom Item / Icon** | `overrides` (`1.21.1`) atau `assets/<ns>/items/*.json` (`1.21.4+`) `[VERIFIED: client.jar]` | `items.<id>.resource`: `{ material: PAPER, generate: false, model_path: icon_pack_2/<name> }` `[VERIFIED: data/Jeqo]` | `<id>`: `material: PAPER`, `Pack: { generate_model: false, model: jeqo/icon_pack_2/<name> }` `[VERIFIED: data/Jeqo]` | `items/*.yml` dengan `Pack.model: <ns>:item/<name>` + `settings.yml` `prefer_item_models: true` (`1.21.4+`) `[VERIFIED: nexomc.com]` |
| **Aturan Vertikal Font** | `ascent <= height` wajib `[VERIFIED: 26.3/client.jar]` | `y_position <= scale_ratio` wajib (ItemsAdder) `[VERIFIED: itemsadder.com]` | `ascent <= height` wajib `[VERIFIED: oraxen.com]` | `ascent <= height` wajib `[VERIFIED: nexomc.com]` |
| **Perintah Server Muat Ulang** | Taruh ke `resourcepacks/` atau host HTTPS `server.properties` `[VERIFIED: client.jar]` | `/iareload` lalu `/iazip` `[VERIFIED: data/Maximo README.txt]` | `/o reload all` `[VERIFIED: data/Maximo README.txt]` | `/nexo reload` lalu `/nexo pack` `[VERIFIED: nexomc.com]` |

---

## 2. Fakta Empiris dari `data/Jeqo-Icon-Pack-2.zip`

Diperiksa langsung dalam memori (`JSZip`, total `685` entri):
1. **Bentuk Arsip Bundle Multi-Plugin (Bukan Direct Resource Pack):**
   - Root arsip berada di dalam subfolder pembungkus `Jeqo - Icon Pack 2/` yang memecah distribusi menjadi:
     - `Colors/<Aqua|Blue|Green|Orange|Pink|Purple|Red>/icon_pack_2/*.png` (`473` file tekstur PNG `16×16` piksel + `ICON LIST.png` `300×600`).
     - `Plugins/ItemsAdder/` (`items_packs/jeqo/icon_pack_2.yml` + `data/resource_pack/assets/jeqo/models/` + `textures/`).
     - `Plugins/Oraxen/` (`items/jeqo_icon_pack_2.yml` + `pack/models/jeqo/` + `pack/textures/jeqo/`).
     - `Plugins/DeluxeMenus/` (`gui_menus/icon_pack_2_page_1..3.yml`) memakai **`nbt_int: CustomModelData:100050`** *(sintaks lama pra-1.21.4)* dan `Chest Commands/`.
     - `Ready-to-Go Resource Pack/Icon Pack 2 by Jeqo/`: paket vanilla lengkap dengan `pack.mcmeta` (`"pack_format": 8`) dan `assets/minecraft/models/item/paper.json` berisi `"overrides"` `custom_model_data: 100000+`.
2. **Implikasi Validator & Migrasi Versi Modern:**
   - Jika arsip induk `Jeqo-Icon-Pack-2.zip` diunggah mentah ke Validator Fase 1 tanpa pembongkaran, ia memicu `Z01` (`pack.mcmeta` tidak ada di root) dan `Z02` (folder pembungkus). Namun jika subfolder `Ready-to-Go Resource Pack/Icon Pack 2 by Jeqo/` diekstrak menjadi `.zip`, isinya valid untuk format lama (`pack_format: 8`) tetapi butuh pembaruan `overrides` → `assets/<ns>/items/*.json` serta `pack.mcmeta` `min_format`/`max_format` bila dipakai pada target `1.21.4+` / `1.21.11+` / `26.3` (`[VERIFIED: docs/knowledge/item-model.md]`).
   - Pack ikon ini **tidak** memiliki `font/*.json`; seluruh ikon GUI dimodelkan via item `PAPER` 16×16 (berlaku untuk cakupan Fase 3 `CustomModelData` / `DeluxeMenus`, bukan Fase 2 font glyph).

---

## 3. Fakta Empiris dari `data/Maximo - Better prefixes and tags Vol 1 (2).zip`

Diperiksa langsung dalam memori (`JSZip`, bundle rank badge, tag NPC, dan item rarity):
1. **Isi Bundle Multi-Format:**
   - `ItemsAdder IMC/`: `data/items_packs/imc/imc.yml` berisi **`136` definisi `font_images`** + tekstur PNG di `data/resource_pack/assets/imc/textures/{imc_rank,imc_npc,imc_item}/`.
   - `Oraxen IMC/`: 3 file YAML (`glyphs/imc_items.yml`, `glyphs/imc_npc.yml`, `glyphs/imc_ranks.yml`) + tekstur di `pack/textures/{imc_rank,imc_npc,imc_item}/`.
   - **Vanilla Pack Bersarang:** `ᴍᴀxɪᴍᴏ - ʙᴇᴛᴛᴇʀ ᴘʀᴇꜰɪxᴇꜱ ᴀɴᴅ ᴛᴀɢꜱ [ ᴠᴀɴɪʟʟᴀ ᴛᴇx. ᴘᴀᴄᴋ ].zip` berisi `pack.mcmeta` (`pack_format: 9`), `assets/minecraft/font/default.json` (**`139` bitmap provider**), dan tekstur badge PNG.
2. **Konvensi Tekstur & Oversampling Rank Badge 2×:**
   - Seluruh sprite rank tag bertinggi **exact `20 px`** (misal `42×20`, `66×20`, `90×20`, `114×20`, `138×20`), lalu dipetakan di font sebagai `height: 10` (`scale_ratio: 10` di ItemsAdder) dan `ascent: 8` (`y_position: 8`).
   - Sesuai formula bytecode Mojang (`scale = height / cellH = 10 / 20 = 0.5`, `oversample = 2.0`), tekstur 20px dirender tajam setinggi 10 piksel logis di layar (`[VERIFIED: data/Maximo & 26.3/client.jar BitmapProvider$Definition]`).
3. **Anomali & Kesalahan Nyata yang Ditemukan di Vanilla Pack Bersarang:**
   - **3 tekstur hilang (`missing textures`):** `default.json` mereferensikan `default/chat/lord_tag.png`, `required/null.png`, dan `default/chat/heart.png` yang **tidak ada** di dalam `assets/minecraft/textures/` arsip vanilla-nya.
   - **Dummy glyph Oraxen bocor ke vanilla JSON:** entri `"file": "required/null.png"` memakai `ascent: -32768`, `height: -66`. Nilai `height` negatif (`-66`) merupakan artefak placeholder plugin yang bermasalah pada renderer vanilla ketat `[VERIFIED: data/Maximo default.json; perilaku exact height < 0 di runtime 26.3/client.jar masih UNVERIFIED]`.
   - **Rentang Codepoint Berisiko Bentrok Non-PUA:**
     - Pada `default.json` vanilla Maximo: menggunakan blok **Yi Syllables / Radicals (`U+A413–U+A4B8`, karakter seperti `ꐻ`, `ꑤ`, `꒑`)**, bukan Private Use Area (`U+E000–U+F8FF`).
     - Pada `ItemsAdder imc.yml`: memakai **CJK Compatibility Ideographs (`U+F9A7–U+FA2D`, seperti `鶴`)** yang juga berada di luar PUA standar dan dapat berbenturan dengan fon CJK klien pemain.

---

## 4. Ringkasan Kapan Pack Ditaruh di Mana

- **Server murni tanpa plugin pack manager (atau masuk ke `Nexo/pack/external_packs/`):** wajib berupa `.zip` vanilla dengan `pack.mcmeta` dan `assets/` langsung di **root arsip** (contoh: isi dalam `Ready-to-Go Resource Pack/.../` atau `.zip` bersarang di `Maximo`, BUKAN arsip bundle induk).
- **ItemsAdder:** folder isi `ItemsAdder/data/...` (atau struktur modern `contents/<namespace>/`) disalin ke `plugins/ItemsAdder/`, lalu jalankan `/iareload` & `/iazip` (ItemsAdder yang membangkitkan resource pack & alokasi font-image final).
- **Oraxen:** folder `Oraxen/{items,glyphs,pack}/` disalin ke `plugins/Oraxen/`, lalu jalankan `/o reload all`.
- **Nexo:** mendukung konfigurasi asli `items/` & `glyphs/` + `pack/assets/` **serta** menerima `.zip` resource pack vanilla langsung ke `plugins/Nexo/pack/external_packs/` sebelum `/nexo reload` & `/nexo pack`.
