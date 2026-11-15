Panduan Arsitektur Teknis: Penyelarasan & Deployment Resource Pack Cross-Platform (Java & Bedrock)

1. Fundamen Arsitektur Resource Pack Cross-Platform (Java vs. Bedrock)

Penyelarasan arsitektur visual antara Minecraft Java Edition dan Bedrock Edition merupakan aspek strategis dalam pengoperasian jaringan server cross-play bertaraf enterprise berbasis perantara GeyserMC. Dalam ekosistem ini, penerapan prinsip pemisahan tanggung jawab (separation of concerns) antara aset visual klien (Resource Pack) dan logika server (Behavior Pack) memegang peranan krusial. Resource Pack berfungsi mengisolasi pemrosesan rendering visual dan pemutaran audio secara eksklusif di sisi klien tanpa membebani main loop thread server. Sebaliknya, Behavior Pack memproses data skrip, ticking logic, dan status mekanis gameplay di sisi server. Pembagian kerja yang tegas ini menjamin efisiensi latensi jaringan, meminimalkan penggunaan bandwidth, mencegah de-sinkronisasi status paket data, serta menjaga stabilitas performa server saat melayani konkurensi pemain dari berbagai platform.

Struktur arsitektur antara Java Edition dan Bedrock Edition memiliki perbedaan fundamental dalam pengelolaan aset visual, seperti yang terinci pada tabel komparatif berikut:

Komponen/Fitur	Java Edition Architecture	Bedrock Edition Architecture
Struktur Direktori Aset	Menggunakan nama subdirektori tunggal di bawah assets/minecraft/textures/ seperti block, item, font, models, dan particle.	Menggunakan nomenklatur jamak di bawah textures/ seperti blocks, items, font, models, particle, serta direktori khusus persona_thumbnails.
Format Metadata Pack	Menggunakan format file .mcmeta (seperti pack.mcmeta pada akar arsip zip paket).	Menggunakan file berstruktur JSON .json (seperti manifest.json pada akar paket dan flipbook_textures.json).
Pemrosesan Animasi	Frame animasi tekstur didefinisikan secara individual via file teks .mcmeta yang berpasangan langsung dengan file aset gambar.	Seluruh definisi frame dan laju animasi tekstur blok digabungkan secara terpusat dalam satu arsip file flipbook_textures.json.
Transparansi & Emisi	Menggunakan format .png standar dengan saluran alfa (alpha channel) langsung pada piksel gambar raster.	Mengutamakan format Targa (.tga) 24/32-bit dengan alpha channel mask (putih = padat, hitam = transparan, abu-abu = dye color). Format .png digunakan untuk item icon.

Dalam ekosistem add-on Bedrock Edition, Resource Pack (RP/klien) mengontrol seluruh elemen presentasi grafis dan audio yang mencakup tekstur raster, sampel suara, geometri model 3D, pengontrol animasi (animation controllers), serta sistem partikel (particle emitters). Di sisi lain, Behavior Pack (BP/server) mengontrol logika eksekusi server yang mencakup perilaku entitas (entity behaviors), resep pengerjaan (crafting recipes), tabel jarahan (loot tables), dan skrip fungsi (custom functions).

Komunikasi antar-paket ini diwujudkan melalui mekanisme referensi silang ID entitas (runtime identifiers). Sebagai contoh, pada entitas kustom, pendaftaran membutuhkan dua berkas spesifikasi utama: file definisi entitas pada RP yang mengonfigurasikan tampilan visual entitas (pemetaan UV map, geometri model .geo.json, dan tekstur), serta file definisi entitas pada BP yang menetapkan logika perilaku entitas (komponen AI, atribut kesehatan, dan event triggers). Kedua paket ini saling terikat secara kriptografis dan terintegrasi secara fungsional agar status logika server dapat dirender secara akurat oleh mesin grafis klien.

Pemahaman mendasar atas perbedaan struktur arsitektural ini menjadi fondasi utama dalam menjalankan prosedur rekayasa dan konversi aset visual secara teknis pada bab berikutnya.

2. Metodologi Konversi dan Rekayasa Aset Visual (Java ke Bedrock)

Proses konversi resource pack dari Java Edition ke Bedrock Edition memerlukan pemetaan ulang direktori (file mapping) dan transformasi format gambar raster yang presisi. Ketidaksesuaian struktur direktori, kesenjangan skala peta UV, atau nomenklatur file yang tidak valid akan menyebabkan kegagalan pemuatan tekstur (missing texture fallback) dan bug rendering visual pada klien Bedrock.

Pemetaan Direktori & Nomenklatur File

Konversi struktur folder dan penamaan file aset dari Java Edition ke Bedrock Edition wajib mengikuti aturan pemetaan standar berikut:

* Pemetaan Subdirektori Direktori textures:
  * Subdirektori block (Java) diubah menjadi blocks (Bedrock).
  * Subdirektori item (Java) diubah menjadi items (Bedrock).
  * Subdirektori lainnya seperti colormap, entity, environment, gui, map, misc, models, painting, dan particle mempertahankan nama struktur yang setara.
* Pemetaan Ulang Nama File Aset (Sample File Renaming):
  * block_iron.png \rightarrow iron_block.png
  * wither_rose.png \rightarrow flower_wither_rose.png
  * beehive_end.png \rightarrow beehive_top.png
  * honeycomb_block.png \rightarrow honeycomb.png
  * honey_block_bottom.png \rightarrow honey_bottom.png
  * honey_block_side.png \rightarrow honey_side.png
  * honey_block_top.png \rightarrow honey_top.png

Penanganan Alpha Channel & UV Mapping

Pemrosesan gambar raster pada Bedrock Edition memiliki ketentuan khusus terkait penanganan transparansi, pencahayaan emisi, dan pewarnaan dinamik:

1. Penggunaan Format TGA & Alpha Channel Mask: Format Targa (.tga) 32-bit dengan alpha channel merupakan format yang wajib digunakan pada blok dan entitas yang memiliki transparansi kompleks atau efek pencahayaan emisi (emissive lighting).
  * Mask Transparansi: Piksel putih (#FFFFFF) menentukan area padat (solid), dan piksel hitam (#000000) menentukan area transparan penuh.
  * Mask Emisi: Blok atau entitas yang mendukung efek menyala dalam gelap (seperti mata spider, enderman, atau phantom) menggunakan alpha channel mask untuk menentukan intensitas emisi. Catatan arsitektural: fitur transparansi dan emisi bersifat saling pilah (mutually exclusive) pada saluran alfa yang sama.
  * Mask Dye Color: Untuk item atau entitas yang mendukung pewarnaan dinamik (seperti leather armor atau fireworks charge), piksel abu-abu pada saluran alfa menandakan area yang diwarnai oleh sistem dyeing server.
2. Konsolidasi Tekstur ke UV Map: Java Edition sering kali memisahkan file tekstur untuk setiap muka kubus/entitas. Bedrock Edition mengharuskan konsolidasi tekstur-tekstur individual tersebut ke dalam satu lembar peta UV (UV Map atlas). Sebagai contoh, aset pig_saddle.png pada Bedrock memuat keseluruhan tata letak peta UV tubuh babi secara utuh, bukan sekadar tekstur pelana terisolasi.
3. Aset Varian Warna Eksplisit: Fitur Java yang mewarnai tekstur secara terprogram (procedural coloring via kode, seperti spawn egg dan botol ramuan) mengharuskan arsitek di Bedrock untuk menyediakan file tekstur gambar individual secara eksplisit untuk setiap variasi varian warna.

Animasi Tekstur & Custom Font System

* Transformasi Animasi (Flipbook): Java Edition mendefinisikan animasi tekstur melalui file .mcmeta individual di samping file gambar. Bedrock Edition menyatukan seluruh instruksi animasi tekstur blok ke dalam satu file konfigurasi terpusat bernama flipbook_textures.json.

[
  {
    "flipbook_texture": "textures/blocks/custom_animated_block",
    "atlas_tile": "custom_animated_block",
    "ticks_per_frame": 2
  }
]


* Arsitektur Custom Font & Glyph Unicode (Java & Bedrock): Pengaturan font kustom pada Java Edition menggunakan struktur JSON (seperti default.json) di bawah assets/<namespace>/font/. File ini mendukung provider types:
  * bitmap: Membaca karakter glyph dari atlas gambar PNG.
  * space: Mendefinisikan lebar spasi kustom yang mendukung nilai negatif (negative space padding) serta pergeseran posisi tingkat sub-GUI-scale.

{
  "providers": [
    {
      "type": "bitmap",
      "file": "minecraft:font/glyph_E8.png",
      "ascent": 7,
      "height": 8,
      "chars": [
        "\uE820"
      ]
    },
    {
      "type": "space",
      "advances": {
        "\u200B": -8,
        "\u200C": -0.5,
        "\u200D": -0.25
      }
    }
  ]
}


Analisis Rekayasa Sub-GUI Scale Positioning: Pada GUI Scale 1, 1 piksel font berbanding lurus dengan 1 piksel layar. Namun pada GUI Scale tinggi (Scale 3 atau lebih), penyesuaian posisi piksel dapat mengalami pemicuan pembulatan grid (pixel grid rounding artifacts). Penggunaan nilai desimal mengambang (floating-point advances) seperti -0.5 atau -0.25 pada provider space memungkinkan koreksi presisi penempatan tekstur GUI/HUD kustom, sehingga mencegah keretakan piksel (pixel gaps) terlepas dari tingkat perbesaran antarmuka pemain.

Prosedur Rekayasa Rank Badge pada Bedrock Edition (Workflow KasaiSora):

1. Extrak file .mcpack paket Bedrock (ubah ekstensi menjadi .zip lalu lakukan ekstraksi).
2. Navigasikan ke subdirektori /font/ dan buka file atlas glyph glyph_E8.png menggunakan perangkat lunak grafis raster (Photoshop atau Photopea).
3. Gunakan alat Rectangle Selection berukuran tepat 1 piksel untuk mengukur dan menyelaraskan grafis rank badge kustom secara sempurna di antara entri rank yang sudah ada (misalnya di antara batas ikon admin dan mod). Langkah ini krusial untuk menjamin tidak ada pembatasan piksel yang tumpang tindih (pixel bleeding).
4. Simpan dan perbarui file glyph_E8.png pada folder /font/.
5. Gunakan alat pemetaan glyph Unicode (glyph mapping tool) untuk menentukan nilai hex karakter (misalnya 0xE820 / \uE820) yang merepresentasikan koordinat piksel badge kustom tersebut untuk dipanggil pada plugin chat server.

Setelah seluruh file aset visual selesai dikonversi dan direkayasa, langkah selanjutnya adalah pengemasan paket dan pengkonfigurasian mekanisme validasi kriptografi untuk deployment server.

3. Konfigurasi Deployment Server Java & Validasi Keamanan SHA-1

Deployment Resource Pack di Java Edition mengandalkan protokol unduhan langsung HTTP/HTTPS yang divalidasi menggunakan kualifikasi hash kriptografi SHA-1. Validasi ini memastikan integritas data file yang diunduh oleh klien serta memicu pembersihan cache lokal klien ketika terjadi perubahan pada isi paket resource.

Prosedur Hosting, Konfigurasi Web Server, & Kalkulasi Hash SHA-1

1. Ketentuan Pengemasan Zip: File paket resource wajib dikompresi dalam format .zip. File pack.mcmeta wajib berada di akar direktori zip, bukan terbungkus di dalam subfolder tambahan.
2. Penyediaan Direct Download Link & Header MIME Type: URL yang dikonfigurasi wajib mengarah langsung ke file .zip (direct download link). Apabila di-host menggunakan web server publik (Nginx/Apache), web server wajib mengonfigurasikan MIME type application/zip pada header respons HTTP Content-Type. Tanpa header MIME type yang tepat, klien Java Edition dapat membatalkan pengunduhan dan memicu kesalahan "Failed to download resource pack".
3. Manipulasi Parameter URL Storage Awan: Jika menggunakan penyimpanan awan seperti Dropbox:
  * Ganti parameter bawaan dl=0 di akhir URL menjadi ?dl=1 atau ?direct (contoh: https://www.dropbox.com/s/xyz/pack.zip?dl=1).
  * Apabila URL telah memiliki parameter query string lain, gunakan imbuhan &dl=1 di bagian akhir string URL.
4. Kalkulasi Hash SHA-1: Hash SHA-1 dihitung berdasarkan file .zip final. Eksekusi kalkulasi dilakukan melalui perintah terminal sesuai sistem operasi:

# Linux / macOS (Terminal)
sha1sum pack.zip

# Windows (PowerShell)
Get-FileHash pack.zip -Algorithm SHA1


Parameterisasi server.properties

Integrasi resource pack pada server Java dilakukan dengan mengonfigurasi file server.properties sebagai berikut:

resource-pack=https://namaserver.com/pack.zip
resource-pack-sha1=eb4be3d7fce290bb220abc9966f14d1f882fdbd3
require-resource-pack=true
resource-pack-prompt={"text":"Server ini menggunakan tekstur kustom resmi. Harap setujui untuk masuk.","color":"gold"}


Penjelasan fungsi setiap parameter konfigurasi:

1. resource-pack: Menentukan URL unduhan langsung file .zip resource pack yang di-host di web server publik.
2. resource-pack-sha1: Menampung string nilai hash SHA-1 dari file zip. Parameter ini menjadi acuan klien untuk mendeteksi pembaruan file; jika nilai SHA-1 berubah, klien otomatis mengunduh versi terbaru.
3. require-resource-pack: Mengatur kebijakan penegakan pengunduhan. Jika diset true, pemain yang menolak mengunduh resource pack akan otomatis dikeluarkan (kick) dari server.
4. resource-pack-prompt: Menentukan pesan berbentuk JSON yang muncul pada dialog konfirmasi di layar klien saat proses koneksi.

Pengesahan sistem pengiriman paket Java ini menjadi acuan dasar sebelum mengintegrasikannya dengan infrastruktur ekosistem Bedrock, baik pada server dedicated native maupun arsitektur hibrida Java-Bedrock.

4. Deployment Native Bedrock Server & Integration Layer (GeyserMC / Floodgate)

Penanganan resource pack pada ekosistem Bedrock terbagi menjadi dua arsitektur utama: penginstalan langsung pada Bedrock Dedicated Server (BDS) native, dan integrasi melalui translation layer GeyserMC/Floodgate pada server hibrida Java-Bedrock.

Optimasi Geometri & Performa Klien Mobile Bedrock

Sebelum melakukan deployment ke ekosistem Bedrock, arsitek jaringan wajib mempertimbangkan batasan perangkat keras klien seluler (Android/iOS). Penggunaan model 3D kustom dengan jumlah poligon tinggi (high polygon counts) dan atlas tekstur berukuran di atas 2048x2048 piksel dapat memicu render lag, penurunan FPS yang drastis, hingga pemutusan koneksi (crash) pada perangkat seluler. Disarankan untuk membatasi jumlah poligon per model di bawah 500 kubus/geometri dan mengoptimalkan atlas tekstur pada ukuran maksimum 1024x1024 piksel.

Tahapan Deployment Native Bedrock Dedicated Server (BDS)

Untuk mengesahkan resource pack pada server native Bedrock Dedicated Server, ikuti alur kerja berikut:

1. Pengemasan Paket: Ubah ekstensi file dari .mcpack menjadi .zip, lalu ekstrak folder tersebut ke dalam direktori /resource_packs/ yang terletak di akar direktori server BDS.
2. Verifikasi Manifes Internal: Buka file manifest.json di dalam paket tersebut dan catat atribut nilai header.uuid serta version.

{
  "format_version": 2,
  "header": {
    "name": "Custom Server Pack",
    "uuid": "c3e51ef1-0300-464a-ba3b-2dc393b89ff9",
    "version": [1, 0, 0]
  }
}


1. Pendaftaran pada World: Masuk ke direktori dunia server di /worlds/<Nama World>/ dan buat atau edit file bernama world_resource_packs.json dengan menyusun skema JSON berikut:

[
  {
    "pack_id": "c3e51ef1-0300-464a-ba3b-2dc393b89ff9",
    "version": [1, 0, 0]
  }
]


1. Penegakan pada server.properties BDS: Atur parameter texturepack-required=true untuk memaksakan penggunaan paket pada pemain, dan aktifkan content-log-file-enabled=true untuk mengumpulkan catatan debug saat terjadi kesalahan pemuatan aset visual.

Integration Layer: GeyserMC Pipelining & Tooling Automasi

Pada server Java yang menerima koneksi pemain Bedrock melalui plugin GeyserMC, pengiriman paket Bedrock ditangani secara internal oleh Geyser.

* Pemasangan Paket Bedrock: File .mcpack atau .zip diletakkan di direktori plugins/Geyser-Spigot/packs/ (atau /packs/ pada Geyser Standalone).
* Otomatisasi Konversi via Tooling Bridge (java2bedrock):
  1. Host paket Java di penyimpanan awan dan dapatkan tautan langsung (akhiri URL dengan &dl=1).
  2. Eksekusi alur konversi java2bedrock (Kas-tle tool).
  3. Tempatkan paket Bedrock hasil konversi di folder Geyser/packs/.
  4. Salin file pemetaan geyser_mappings.json hasil konversi ke folder Geyser/custom_mappings/.
  5. Pasang GeyserOptionalPack di Geyser untuk menyelaraskan rendering model 3D dan animasi item Java ke klien Bedrock.
* Registrasi Hash Tekstur Player Head / Skulls: Klien Bedrock tidak memuat tekstur Player Head Java secara dinamis tanpa registrasi pra-koneksi. String hash wajib diekstraksi dari URL tekstur Mojang dan didaftarkan pada entri skin-hashes di konfigurasi Geyser.

Contoh Ekstraksi Hash Tekstur Kepala Mojang: Dari URL resmi Mojang: http://textures.minecraft.net/texture/14e424b1676feec3a3f8ebade9e7d6a6f71f7756a869f36f7df0fc182d436e Ambil string hash identifikasi unik: 14e424b1676feec3a3f8ebade9e7d6a6f71f7756a869f36f7df0fc182d436e lalu daftarkan ke konfigurasi skin-hashes Geyser.

Penyusunan lapisan integrasi ini memastikan aset visual dapat dirender secara konsisten di kedua platform, yang kemudian disinergikan dengan plugin tingkat lanjut untuk mengontrol sistem GUI dan Rank server.

5. Integrasi GUI/Rank System dan Prosedur Troubleshooting Operations

Resource pack yang terdeploy disinergikan dengan plugin server (seperti LuckPerms, DeluxeMenus, LPC, TAB, dan Phoenix Crates) untuk menyajikan antarmuka pengguna kustom (Custom GUI) serta ikon Rank dalam bentuk presentasi visual grafis yang konsisten antara pemain Java dan Bedrock.

Integrasi CustomModelData & Glyph System

1. Skema CustomModelData pada Item Java

Untuk menerapkan tekstur atau model kustom pada item tanpa merusak visual item dasar vanilla, gunakan fitur overrides/predicates pada file model JSON item Java (misalnya assets/minecraft/models/item/diamond_sword.json):

{
  "parent": "item/handheld",
  "textures": {
    "layer0": "item/diamond_sword"
  },
  "overrides": [
    {
      "predicate": { "custom_model_data": 1 },
      "model": "custom/weapons/emerald_sword"
    }
  ]
}


Eksekusi pembagian item kustom di dalam server menggunakan NBT tag data injection:

/give minecraft:diamond_sword{CustomModelData:1}


2. Konfigurasi DeluxeMenus (Custom Model Data & Glyph Titles)

Plugin DeluxeMenus memanfaatkan gabungan nilai custom_model_data dan simbol glyph Unicode pada header judul GUI untuk merender menu kustom yang kaya visual:

menu_title: '&#FFFFFF\uE001'
open_command: custommenu
size: 27
items:
  'emerald_sword_button':
    material: DIAMOND_SWORD
    data: 0
    slot: 13
    priority: 1
    custom_model_data: 1
    display_name: '&aEmerald Sword'
    lore:
      - '&7Klik untuk membeli senjata kustom.'
    left_click_commands:
      - '[console] give %player_name% diamond_sword{CustomModelData:1} 1'
      - '[close]'


3. Pemetaan Karakter Unicode untuk System Rank/Badge

Ikon Rank dipetakan menggunakan karakter Unicode khusus (seperti \uE820) yang merujuk pada atlas glyph_E8.png. Karakter ini dimasukkan sebagai prefix grup pada LuckPerms, lalu dirender ke sistem chat dan TAB-list via LPC dan TAB plugin:

/lp group admin meta setprefix 100 "\uE820 "
/lp user <nama_pemain> parent set admin


4. Penanganan Bedrock Forms pada GeyserMC (Phoenix Crates & Menus)

Klien Bedrock tidak memiliki fitur interaksi klik-kanan atau shift-click yang intuitif pada peti Java. Plugin modern mengonversikan antarmuka peti Java menjadi Form Native Bedrock melalui aktifasi bedrock.forms=true pada file config.yml:

bedrock:
  forms: true
  input-modes: []
  allow-opt-out: true
  resize-chest-menus: true
  icons:
    enabled: true
    fallback-url: ""
    head-url: "https://mc-heads.net/head/%texture%"


Fitur ini mentransformasikan peti Java secara otomatis menjadi tombol-tombol interaktif pada layar Bedrock (Form Pratinjau Hadiah, Form Konfirmasi, dan Form Reroll).

Matriks Troubleshooting Operations Server

Tabel berikut berfungsi sebagai panduan diagnosa dan penanganan masalah (troubleshooting) operasional bagi administrator server ketika menghadapi kendala deployment resource pack:

Gejala Masalah / Error	Akar Penyebab (Root Cause)	Platform Terdampak	Langkah Resolusi Arsitektural
"Failed to download resource pack"	URL konfigurasi bukan direct link, latensi tinggi, atau web server tidak mengirimkan header MIME type application/zip.	Java	Sesuaikan parameter URL storage awan (?dl=1/&dl=1). Pastikan Nginx/Apache mengonfigurasikan header Content-Type: application/zip.
Tekstur tidak terbarui pada client pemain lama	String hash SHA-1 pada server.properties tidak diperbarui pasca edit zip, memicu penggunaan cache usang.	Java	Hitung ulang nilai SHA-1 menggunakan sha1sum atau Get-FileHash, lalu perbarui nilai parameter resource-pack-sha1.
Pack terunduh tetapi aset visual tidak muncul	Berkas pack.mcmeta (Java) atau manifest.json (Bedrock) terbungkus di dalam subfolder ganda akibat kesalahan kompresi.	Java & Bedrock	Rekayasa ulang kompresi zip tepat dari dalam direktori paket resource, memastikan pack.mcmeta atau manifest.json berada di akar (root) arsip.
Glyph/Font kustom muncul sebagai karakter kotak []	Kesalahan sintaks Unicode (hilang awalan \u), konflik namespace default.json, atau penyelarasan piksel atlas yang salah.	Java & Bedrock	Perbaiki sintaks JSON ke format \uXXXX, isolasi namespace font kustom (hindari menimpa default.json jika berkonflik), dan validasi jalur aset PNG.

Penerapan standar operasional prosedur yang disiplin terhadap pembuatan aset, validasi hash kriptografi, dan konfigurasi skrip perantara ini menjamin ketersediaan tinggi (high availability) serta konsistensi pengalaman visual cross-platform di seluruh jaringan server Minecraft.
