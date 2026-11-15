# Sistem Font, Glyph Unicode, Negative Space, & Rank Badge (Sumber Primer)

Dokumen ini disusun ulang berdasarkan verifikasi langsung terhadap JSON font vanilla (`1.21.1`–`26.3/client.jar`) dan bytecode `BitmapProvider`, `SpaceProvider`, `TrueTypeGlyphProviderDefinition`, `UnihexProvider`, `ProviderReferenceDefinition`, `FontSet`, `FontManager`, `Font$PreparedTextBuilder`, `BakedSheetGlyph`, `FontTexture`, `GlyphBitmap`, dan `Window` di `26.3/client.jar` serta `1.21.1`/`1.21.11/client.jar`.

---

## 1. Struktur & Codec Provider Font Java (`assets/<namespace>/font/*.json`)

File font vanilla di seluruh versi `1.21.1`–`26.3` (`alt.json`, `default.json`, `illageralt.json`, `uniform.json`, `include/default.json`, `include/space.json`, `include/unifont.json`) **tidak mengalami perubahan format** `[VERIFIED: 1.21.1–26.3/client.jar]`.

### A. `bitmap` (`BitmapProvider$Definition`)
- **`file`** (`Identifier`, wajib): dimuat dengan prefix `"textures/"` (`textures/<path>`) `[VERIFIED: 26.3/client.jar BitmapProvider$Definition]`.
- **`height`** (`int`, opsional, default `8`): tinggi render dalam satuan piksel logis GUI `[VERIFIED: 26.3/client.jar BitmapProvider$Definition]`.
- **`ascent`** (`int`, wajib): posisi baseline atas glyph; **`ascent` wajib `<= height`** (jika `ascent > height` → `DataResult.error`) `[VERIFIED: 26.3/client.jar BitmapProvider$Definition]`.
- **`chars`** (`CODEPOINT_GRID_CODEC`, wajib): array string tidak boleh kosong, baris pertama tidak boleh kosong, dan **seluruh baris wajib berjumlah codepoint sama** `[VERIFIED: 26.3/client.jar BitmapProvider$Definition.validateDimensions]`.
- **Perhitungan Dimensi & Advance (`BitmapProvider$Definition.load` & `GlyphBitmap`):**
  - `cellW = imageWidth / chars[0].length` (pembagian integer) `[VERIFIED: 26.3/client.jar BitmapProvider$Definition]`.
  - `cellH = imageHeight / chars.length` (pembagian integer) `[VERIFIED: 26.3/client.jar BitmapProvider$Definition]`.
  - `scale = (float) height / (float) cellH` (`oversample = 1.0f / scale`) `[VERIFIED: 26.3/client.jar BitmapProvider$Definition & Glyph$1]`.
  - `actualGlyphWidth` = kolom paling kanan yang masih memiliki piksel ber-alpha/luminance non-nol (`getLuminanceOrAlpha(x, y) != 0`) `[VERIFIED: 26.3/client.jar BitmapProvider$Definition.getActualGlyphWidth]`.
  - `advance = (int) (0.5d + (double)(actualGlyphWidth * scale)) + 1` (selalu menjadi integer + 1 px spasi antar karakter) `[VERIFIED: 26.3/client.jar BitmapProvider$Definition.load]`.
  - Posisi vertikal render relatif baseline: `top = 7.0f - ascent`, `bottom = top + height` `[VERIFIED: 26.3/client.jar GlyphBitmap]`.

### B. `space` (`SpaceProvider$Definition`)
- **`advances`**: `Codec.unboundedMap(ExtraCodecs.CODEPOINT, Codec.FLOAT)` `[VERIFIED: 1.21.1/client.jar ezo$a & 26.3/client.jar SpaceProvider$Definition]`.
- **Koreksi Penting:** Codec menerima **semua nilai `float`** (bukan hanya `-1..1` seperti klaim sekunder sebelumnya). Contoh: `-8`, `-0.5`, `-200.25`, `4` semuanya sah di codec `[VERIFIED: 26.3/client.jar SpaceProvider$Definition]`.
- **Aturan `hasFishyAdvance` di `FontSet`:** `FontSet.hasFishyAdvance` menganggap `advance < 0.0f || advance > 32.0f` sebagai *fishy*. Pada pemanggilan font mode `nonFishyGlyphs` (`source(true)`, misalnya *obfuscated/random glyph* atau filter anti-spoof tertentu), provider yang menghasilkan advance `< 0` atau `> 32` dilewati `[VERIFIED: 26.3/client.jar FontSet.hasFishyAdvance & computeGlyphInfo]`. Sedangkan `anyGlyphs` (`source(false)`) tetap merender negative space / advance `> 32` `[VERIFIED: 26.3/client.jar FontSet.computeGlyphInfo]`.

### C. `ttf` (`TrueTypeGlyphProviderDefinition`)
Field codec: `file` (`Identifier`, wajib, dimuat di bawah `font/`), `size` (`float`, opsional), `oversample` (`float`, opsional), `shift` (`Shift`, opsional), `skip` (`String` atau `List<String>`, opsional) `[VERIFIED: 26.3/client.jar TrueTypeGlyphProviderDefinition]`.
*(Klaim bahwa plugin pihak ketiga tertentu seperti Nova tidak mendukung `ttf`: `[SECONDARY / UNVERIFIED]`.)*

### D. `unihex` (`UnihexProvider$Definition`)
Field codec: `hex_file` (`Identifier`, wajib), `size_overrides` (`List<OverrideRange>`, opsional) `[VERIFIED: 26.3/client.jar UnihexProvider$Definition]`.

### E. `reference` (`ProviderReferenceDefinition`) & `filter`
- **`reference`**: field `id` (`Identifier`, wajib) untuk mereferensikan font lain (misal `minecraft:include/space`) `[VERIFIED: 26.3/client.jar ProviderReferenceDefinition]`.
- **`filter`**: diterapkan pada `FontSet.selectProviders` lewat `FontOption.Filter` (contoh di `default.json` vanilla: `"filter": {"uniform": false}`) `[VERIFIED: 26.3/client.jar default.json & FontSet]`.

---

## 2. Tabrakan Codepoint (Hasil Audit Bytecode `1.21.11` & `26.3`)

- **Dalam 1 `BitmapProvider` yang sama:** Jika codepoint yang sama muncul lebih dari sekali di `chars` PNG yang sama, `BitmapProvider.load` mencetak log peringatan `Codepoint '{}' declared multiple times in {}` dan menimpa entri sebelumnya di `CodepointMap` milik provider tersebut `[VERIFIED: 26.3/client.jar BitmapProvider$Definition.load]`.
- **Antar-provider atau antar-pack bertumpuk:** `FontSet.computeGlyphInfo` dan `selectProviders` melakukan iterasi berurutan pada `activeProviders` dan **berhenti pada provider pertama yang mengembalikan glyph non-null** (`anyGlyphs`) tanpa mencetak peringatan tabrakan di vanilla (`1.21.11` maupun `26.3`) `[VERIFIED: 1.21.11/client.jar gnr & 26.3/client.jar FontSet]`.
- **Kompatibilitas Cross-Play Bedrock:** Hindari `U+E000`–`U+E0FF` (`glyph_E0.png`) dan `U+E100`–`U+E1FF` (`glyph_E1.png`) karena dipakai controller & HUD vanilla Bedrock; gunakan `U+E200`–`U+F8FF` `[SECONDARY: https://wiki.bedrock.dev/text/custom-emojis]` `[SECONDARY: https://wiki.bedrock.dev/text/emojis]`.

---

## 3. Perilaku Koordinat Font & GUI Scale 1–4 (Hasil Audit Bytecode)

Berdasarkan bytecode `Window.calculateScale`, `Font$PreparedTextBuilder`, `FontTexture`, dan `BakedSheetGlyph` di `26.3/client.jar`:
1. **Perhitungan Skala GUI (`Window.calculateScale(int guiScaleOption, boolean forceUnicode)`):**
   - Mulai `scale = 1`; naikkan `scale++` selama `scale != guiScaleOption`, `scale < framebufferWidth`, `scale < framebufferHeight`, `framebufferWidth / (scale + 1) >= 320`, dan `framebufferHeight / (scale + 1) >= 240`.
   - Jika `forceUnicode && scale % 2 != 0`, naikkan `scale++` (dipaksa genap) `[VERIFIED: 26.3/client.jar Window.calculateScale]`.
2. **Akumulasi & Vertex Rendering (`Font$PreparedTextBuilder` & `BakedSheetGlyph`):**
   - `PreparedTextBuilder` menyimpan kursor `float x, float y` tanpa pembulatan; tiap karakter menambahkan `this.x += glyphInfo.getAdvance(isBold)` dalam **float mentah** `[VERIFIED: 26.3/client.jar Font$PreparedTextBuilder.accept]`.
   - `BakedSheetGlyph.render(...)` menghitung `x0 = x + left`, `x1 = x + right`, `y0 = y + up`, `y1 = y + down` dalam **float mentah** dan mengirim langsung ke `VertexConsumer.addVertex` (tanpa `Math.round`/`floor`) `[VERIFIED: 26.3/client.jar BakedSheetGlyph.render]`.
   - Pembulatan integer (`Mth.floor` / `Mth.ceil`) hanya dilakukan pada `PreparedTextBuilder.bounds()` untuk kotak *scissor/hover* layar, bukan koordinat quad GPU `[VERIFIED: 26.3/client.jar Font$PreparedTextBuilder.bounds]`.
   - `FontTexture.add(...)` menggunakan atlas dinamis `256×256` dengan inset UV `0.01f / 256.0f` untuk mencegah *texture bleeding* antar-glyph di sheet `[VERIFIED: 26.3/client.jar FontTexture.add]`.
3. **Kesimpulan Celah Piksel di GUI Scale 1–4:**
   - Celah 1 piksel bukan disebabkan oleh "skala ganjil vs genap" semata, melainkan terjadi ketika **koordinat `float` atau `advance` pecahan** diproyeksikan oleh matriks skala GPU ke piksel fisik layar yang tidak tepat berhimpit di batas piksel rasterizer `[VERIFIED: 26.3/client.jar BakedSheetGlyph.render]` *(kalibrasi tepat preview web harus diuji dengan screenshot klien asli pada Scale 1–4)*.

---

## 4. Rank Badge, Ikon, & Emoji di Chat / TAB / Nametag
- **Batas Input Chat Vanilla:** `256` karakter `[VERIFIED: https://bugs.mojang.com/browse/MC-236960]`.
- **LuckPerms Prefix & PlaceholderAPI:** `/lp group <grup> meta setprefix <weight> "<prefix>"`, dipanggil via `%luckperms_prefix%` `[VERIFIED: https://luckperms.net/wiki/Meta-Commands]` `[VERIFIED: https://wiki.placeholderapi.com/]`.
- **Alternatif `object` Text Component (`1.21.9+`):** `"type": "object"` (`"atlas"` atau `"player"`) merender sprite `8×8` langsung di teks tanpa memakai codepoint PUA `[VERIFIED: https://www.minecraft.net/en-us/article/minecraft-java-edition-1-21-9]`.
- **Batas tinggi (`height`) aman di Chat/TAB/Nametag sebelum tumpang tindih/terpotong:** `[UNVERIFIED — perlu uji visual klien & server]`.
