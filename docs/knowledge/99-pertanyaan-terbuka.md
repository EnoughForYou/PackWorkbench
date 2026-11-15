# Pertanyaan Terbuka & Hal yang Masih Belum Terverifikasi (Pasca-Putaran 2)

Setelah verifikasi putaran 2 langsung terhadap `piston-meta.mojang.com`, `client.jar` (`1.21.1`, `1.21.4`, `1.21.9`, `1.21.10`, `1.21.11`, `26.1.2`, `26.2`, `26.3`), dan bytecode Mojang, sebagian besar celah di putaran 1 sudah terjawab tuntas (`pack_version` 26.x termasuk `26.3 = [97, 1]`, codec `pack.mcmeta` integer/array, pemisahan atlas `items.json` di `1.21.11`, tabrakan codepoint font di `1.21.11`, codec bebas `SpaceProvider`, ukuran `ContainerScreen` `176×222`, dan batas `250 MiB`).

Daftar di bawah ini adalah **sisa hal yang benar-benar belum terverifikasi** dan perlu diuji/dicek langsung (termasuk uji klien/server nyata) sebelum membangun fitur terkait:

---

## 1. Uji Visual Wajib di Klien Minecraft Asli (Tidak Bisa Dari Dokumen Saja)
1. **Kalibrasi Screenshot GUI Scale 1–4 pada Klien Java Asli (`1.21.1` / `1.21.11` / `26.3`):**
   - Dari bytecode `26.3/client.jar` terbukti bahwa `Window.calculateScale` menghitung skala integer dan `Font$PreparedTextBuilder` + `BakedSheetGlyph` mengirim koordinat `float` mentah ke GPU (bukan dibulatkan di CPU). Namun hasil rasterisasi aktual di layar (kapan *pixel seam* muncul/hilang pada kombinasi resolusi 1080p/1440p, `guiScale` 1–4, dan *Force Unicode Font*, serta pengaruh video setting **Texture Filtering** RGSS/Anisotropic `1.21.11+`) harus dikalibrasi dengan **screenshot klien nyata** `[UNVERIFIED]`.
2. **Uji Langsung Perilaku GeyserMC / Floodgate / Bedrock di Server Uji Nyata:**
   - Memverifikasi di server uji nyata: tampilan `glyph_E2+` di Bedrock vs Java, konversi `DeluxeMenus` → Cumulus Forms, serta bagaimana GeyserMC versi terbaru mem-fallback `object` text component (`1.21.9+`) dan relokasi armor trim `26.3` `[UNVERIFIED]`.

---

## 2. Kompatibilitas Ekosistem Plugin & Add-On
3. **Status Build Stabil DeluxeMenus, LuckPerms, TAB, & GeyserMC pada Server `26.1.2`, `26.2`, dan `26.3`:**
   - Belum diaudit langsung dari halaman rilis/CI plugin apakah `DeluxeMenus` (`model_data_component`, `item_model`), `LuckPerms`, `TAB`, dan `GeyserMC` sudah merilis dukungan penuh untuk server `26.2` dan `26.3` `[UNVERIFIED]`.
4. **Dukungan Parser GeyserMC `packs/` terhadap `manifest.json` `format_version: 3`:**
   - `wiki.bedrock.dev` (`[SECONDARY]`) merekomendasikan `format_version: 3` (SemVer string + `metadata.authors`), sementara `learn.microsoft.com` mencontohkan `format_version: 2`. Perlu diuji apakah GeyserMC `packs/` menerima `format_version: 3` tanpa error `[UNVERIFIED]`.
5. **Dukungan `ttf` Provider & Fitur Terbaru Plugin Server (Nova, Oraxen, Nexo, ItemsAdder):**
   - Struktur YAML/pack untuk `ItemsAdder` (`font_images`), `Oraxen` (`glyphs/*.yml`), dan `Nexo` (`glyphs/*.yml` + `pack/external_packs/`) telah didokumentasikan di `docs/knowledge/plugin-itemsadder-oraxen-nexo.md`. Namun dukungan `ttf` di build terbaru serta pengujian muat langsung hasil ekspor `Pack Workbench` di dalam `Nexo/pack/external_packs/`, `ItemsAdder`, dan `Oraxen` pada server `26.1.2–26.3` belum diuji langsung `[UNVERIFIED]`.
   - Perilaku runtime klien `26.3` terhadap entri `BitmapProvider` dengan `height` negatif (misal artefak `height: -66`, `ascent: -32768` pada pack pihak ketiga) belum diuji langsung di game `[UNVERIFIED]`.

---

## 3. Batas Teknis & Spesifikasi Sekunder yang Belum Dikonfirmasi Primer
6. **Batas Eksak Tinggi Glyph (`height`) dan Panjang String pada Chat / TAB / Nametag / Judul Inventory di Paper Modern:**
   - Batas chat input `256` karakter terkonfirmasi (`MC-236960`), namun batas panjang aman `menu_title` di `DeluxeMenus` (Paper Adventure component) serta tinggi maksimum `height` glyph di chat/TAB sebelum terpotong atau menabrak baris lain perlu diuji langsung `[UNVERIFIED]`.
7. **Karakter Unicode Non-BMP (`> U+FFFF`) pada Java Font JSON & Batas Halaman Bedrock `glyph_XX.png`:**
   - Di Java `BitmapProvider$Definition`, `String.codePoints()` mendukung codepoint penuh; namun perilaku *surrogate pairs* vs UTF-8 mentah lintas editor/plugin serta apakah Bedrock `glyph_XX.png` hanya terbatas pada halaman BMP `00`–`FF` (`U+0000`–`U+FFFF`) masih perlu verifikasi `[UNVERIFIED]`.
8. **Batas Kuantitatif Mobile Bedrock (`< 500` kubus / atlas maks `1024×1024`):**
   - Wiki GeyserMC hanya menyebut secara kualitatif bahwa poligon tinggi dan resolusi seperti `2048×2048` menyebabkan OOM/lag di mobile; angka batas spesifik dari `docs/` lama belum terkonfirmasi sebagai batas keras mesin `[UNVERIFIED]`.
9. **Komponen `/give` & Item Models pada Patch `26.2` / `26.3`:**
   - `CustomModelData` record (`floats, flags, strings, colors`) terkonfirmasi identik hingga `26.3/client.jar`; namun audit menyeluruh seluruh entri baru `assets/minecraft/items/*.json` di `26.2` dan `26.3` (misal properti kondisi/selektor baru jika ada selain `end_cube`) belum diaudit kelas-per-kelas `[UNVERIFIED]`.

10. **Uji Muat Klien Langsung & Server Resource Pack Live (`Fase 1`):**
    - Validasi logika `pack.mcmeta`, batas `250 MiB`, dan `server.properties` sudah diverifikasi terhadap bytecode `1.21.1`, `1.21.10`, `1.21.11`, dan `26.3` (`client.jar`), namun pengujian end-to-end memuat pack sintetis dan unduhan HTTPS + `resource-pack-sha1` di klien game asli tetap berstatus `[UNVERIFIED]` hingga dijalankan manual oleh pemilik.
11. **Uji Muat Font, Rank Badge, & Negative Space di Klien Nyata (`Fase 2`):**
    - Komposisi PNG RGBA sintetis, metrik `BitmapProvider$Definition` / `SpaceProvider$Definition`, aturan `F01`–`F10`, serta ekspor `.zip` lintas 6 profil versi sudah terverifikasi via unit test Vitest, namun pemuatan file `.zip` hasil Studio langsung pada klien `1.21.1`, `1.21.10`, `1.21.11`, `26.3` serta uji snippet LuckPerms/TAB di server nyata tetap berstatus `[UNVERIFIED]` hingga diuji manual oleh pemilik.
