# Sistem GUI, Container Menu, Title Glyph, & Batasan DeluxeMenus (Sumber Primer)

Dokumen ini memuat ukuran/koordinat pasti GUI Chest dari bytecode vanilla `AbstractContainerScreen` & `ContainerScreen` (`26.3/client.jar`), struktur `generic_54.png`, serta dokumentasi resmi plugin **DeluxeMenus** & **GeyserMC**.

---

## 1. Tekstur & Koordinat Container Vanilla (Terverifikasi dari Jar)

- **Lokasi & Resolusi `generic_54.png`:** `assets/minecraft/textures/gui/container/generic_54.png` berukuran **`256×256` piksel**, dan file-nya **identik byte-per-byte** (`sha1: c4bf2bd6a108...`) dari `1.21.1` hingga `26.3` `[VERIFIED: 1.21.1–26.3/client.jar]`.
- **Geometri `AbstractContainerScreen` & `ContainerScreen`:**
  - `imageWidth` = **`176` piksel** `[VERIFIED: 26.3/client.jar ContainerScreen]`.
  - `imageHeight` = **`114 + containerRows * 18` piksel** (untuk 6 baris / 54 slot = **`222` piksel**; untuk 3 baris / 27 slot = **`168` piksel**) `[VERIFIED: 26.3/client.jar ContainerScreen]`.
  - Posisi judul container (`titleLabelX`, `titleLabelY`): **`x = 8` piksel, `y = 6` piksel** dari pojok kiri-atas panel (`leftPos, topPos`) `[VERIFIED: 26.3/client.jar AbstractContainerScreen]`.
  - Posisi label inventory pemain: `inventoryLabelX = 8`, `inventoryLabelY = imageHeight - 94` `[VERIFIED: 26.3/client.jar AbstractContainerScreen & ContainerScreen]`.
  - Cara blitting dari `generic_54.png` (`256×256`):
    - Bagian atas (peti): blit lebar `176`, tinggi `containerRows * 18 + 17` dari `(u=0, v=0)` `[VERIFIED: 26.3/client.jar ContainerScreen.extractBackground]`.
    - Bagian bawah (inventory pemain): blit lebar `176`, tinggi `96` dari `(u=0, v=126)` tepat di bawah bagian atas `[VERIFIED: 26.3/client.jar ContainerScreen.extractBackground]`.
- **Nine-Slice & Lightmap UI:**
  - Elemen UI modular berada di `textures/gui/sprites/` dengan dukungan nine-slicing (`GuiSpriteScaling$NineSlice`) `[VERIFIED: 26.3/client.jar GuiGraphicsExtractor]`.
  - Sejak `26.1`, teks & item UI memakai lightmap putih `1×1` terpisah dari pencahayaan dunia `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-26-1]`.

---

## 2. Title Glyph & Negative Space di Menu

1. Gambar latar GUI kustom dipetakan via `bitmap` di `assets/<ns>/font/*.json`.
2. Di `menu_title`, karakter `space` negatif menggeser kursor dari `titleLabelX = 8` agar latar GUI menumpuk di atas panel `176px` `[VERIFIED: 26.3/client.jar AbstractContainerScreen & SpaceProvider]`.
3. Warna teks judul biasanya disetel putih (`&f` / `&#FFFFFF`) karena warna teks di renderer font Java mengalikan warna glyph bitmap `[SECONDARY: https://bestmcserverlist.net/tools/gui]`.
4. Slot kosong di atas tombol gambar sering diisi `material: AIR` `[SECONDARY: https://bestmcserverlist.net/tools/gui]`.

---

## 3. Spesifikasi & Batasan Resmi DeluxeMenus (`wiki.helpch.at`)

Berdasarkan dokumentasi resmi **DeluxeMenus** `[VERIFIED: https://wiki.helpch.at/helpchat-plugins/deluxemenus]`:
- **`menu_title`**: Mendukung legacy color (`&a`), Hex (`&#aaFF00`), glyph Unicode, dan PlaceholderAPI `[VERIFIED: https://wiki.helpch.at/helpchat-plugins/deluxemenus/files]`.
  - *Batas panjang judul:* Batas klasik Spigot/Bukkit `32` karakter pada packet inventory lama `[SECONDARY: https://www.spigotmc.org/threads/ignore-title-length-limit-in-inventory.409718/]`; di Paper modern berbasis Adventure component batas itu lebih longgar namun batas pasti di DeluxeMenus `1.21.11`–`26.3` belum teruji `[UNVERIFIED]`.
- **`size`**: Kelipatan `9`, dari `9` sampai `54` (default `54`) `[VERIFIED: https://wiki.helpch.at/helpchat-plugins/deluxemenus/files]`.
- **`slot` / `slots`**: Indeks `0`–`53` `[VERIFIED: https://wiki.helpch.at/helpchat-plugins/deluxemenus/files]`.
- **Opsi Model Item:**
  - `nbt_tags`: *deprecated* `[VERIFIED: https://wiki.helpch.at/helpchat-plugins/deluxemenus/options-and-configurations/item]`.
  - `model_data`: *deprecated* sejak `1.21.4+` (pakai untuk `1.21.1`) `[VERIFIED: https://wiki.helpch.at/helpchat-plugins/deluxemenus/options-and-configurations/item]`.
  - `model_data_component`: untuk `1.21.4+` (`strings`, `floats`, `flags`, `colors`) `[VERIFIED: https://wiki.helpch.at/helpchat-plugins/deluxemenus/options-and-configurations/item]`.
  - `item_model`: untuk `1.21.2+` (`item_model: mypack:emerald_sword`) `[VERIFIED: https://wiki.helpch.at/helpchat-plugins/deluxemenus/options-and-configurations/item]`.
- **Kompatibilitas build DeluxeMenus di `26.1.2`–`26.3`:** `[UNVERIFIED]`.

---

## 4. Chest Menu Java vs Bedrock (GeyserMC / Floodgate)

- Bedrock hanya mendukung peti **3 baris (`27`)** dan **6 baris (`54`)**; menu 1, 2, 4, 5 baris tidak bisa dipetakan 1:1 dan latar negative space Java tidak kompatibel dengan mesin teks Bedrock `[VERIFIED: https://geysermc.org/cs/wiki/geyser/forms/]` `[VERIFIED: https://geysermc.org/wiki/geyser/custom-content/]`.
- Untuk klien Bedrock, konversi ke **Cumulus Forms** (via Floodgate) merupakan jalur yang direkomendasikan `[VERIFIED: https://geysermc.org/cs/wiki/geyser/forms/]`.
