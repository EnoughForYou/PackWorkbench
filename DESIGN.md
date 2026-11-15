# Design System — Pack Workbench (Nuxt + shadcn-vue)

Sistem visual aktual aplikasi web Pack Workbench (`/` Beranda, `/studio` IDE Studio & Validator, `/about` Dokumentasi).

## Palet Warna (Obsidian Surface & Burnt Orange Accent)

| Token / Peran | Nilai | Kegunaan |
| :--- | :--- | :--- |
| Canvas dasar (`--background`) | `#0b0b0e` | Latar Beranda, About, rel alat kiri, dan top bar Studio |
| Permukaan panel (`--card`) | `#111115` | Panel samping `#0e0e12`, kartu showcase Beranda, tabel matriks |
| Permukaan elevasi (`--accent` / `--muted`) | `#1d1d25` / `#16161c` | Baris list terpilih, hover kontrol, input IDE (`#14141a`) |
| Garis batas (`--border`) | `#202028` | Pemisah hairline 1px antar-panel (`ResizableHandle`, header, tabel) |
| Teks utama (`--foreground`) | `#f4f4f6` | Judul, label aktif, metrik kanvas, keluaran kode JSON/SHA-1 |
| Teks sekunder (`--muted-foreground`) | `#9b9ba6` | Label key-value inspektor, keterangan aturan, footer |
| Aksen utama (`--primary`) | `#ff5e2c` | CTA utama, penanda aktif tab/list (`border-l-2`), slider/switch |
| Teks di atas aksen (`--primary-foreground`) | `#110a07` | Teks kontras tinggi di atas tombol berisi `#ff5e2c` |

Warna semantik (`#ef4444` merah, `#f59e0b` amber, `#22c55e` hijau, `#38bdf8` biru) khusus untuk keparahan aturan (`ERROR`, `WARN`, `INFO`), `actualGlyphWidth` di kanvas piksel, serta penanda `[UNVERIFIED]`.

## Tipografi (Google Fonts API — `nuxt.config.ts`)

- **UI & Judul (`--font-sans`):** `Onest` (`400`, `500`, `600`, `700`), tracking judul `-0.028em`, `text-wrap: balance`.
- **Kode & Data (`--font-mono`):** `JetBrains Mono` (`400`, `500`, `600`, `700`), `font-variant-numeric: tabular-nums` pada codepoint `U+E200+`, koordinat `(x, y)`, float cursor runs, dan hash SHA-1.

## Tata Letak & Komponen (`shadcn-vue` + `shadcn-nuxt`)

- **Beranda (`app/pages/index.vue`):** `SiteNavbar` (tepat 3 rute: `Beranda`, `Studio`, `About`), Hero asimetris dengan frame workbench interaktif hidup (`PixelPreviewCanvas` + tab JSON Provider), rincian 2 modul sejajar hairline, `Table` Matriks Versi `1.21.1–26.3`, Roadmap ringkas, dan `SiteFooter`.
- **Studio (`app/pages/studio.vue`):** Tata letak `studio.vue` 100vh desktop dengan `ResizablePanelGroup` (desktop `lg+`) dan alur vertikal responsif di seluler:
  - Mode **Rank & Glyph (`StudioWorkspace.vue`):** `ToolDockRail.vue` (`ToggleGroup` + `DropdownMenu` palet), `RankExplorerSidebar.vue` (`ScrollArea` flat borderless list), `CenterStageCanvas.vue` (kapsul `Kanvas | Split JSON | In-Game Besar` + status bar 28px + tooltip `[UNVERIFIED]`), dan `InspectorPanel.vue` (viewport live preview `Chat/TAB/Nametag` di kanan atas + tab `Properti` / `Layer` / `Validasi` berbasis `Select`, `Slider`, `Switch`, `Checkbox`, `Collapsible`, `Progress`).
  - Mode **Validator ZIP & SHA-1 (`ValidatorWorkspace.vue`):** Panel kiri kontrol (`UploadDropzone`, `TargetVersionSelector` `Select`, `Progress` SHA-1 Web Worker, `Switch` konfigurasi `server.properties`) dan panggung kanan audit aturan `Z01–Z09` / `M01–M10`.
- **About (`app/pages/about.vue`):** Dokumentasi acuan teknis `docs/knowledge/`, privasi `ssr: false` lokal peramban, dan `Table` stack teknologi.
