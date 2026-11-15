import type { Finding, ZipInspection } from '../types.ts';
import { MAX_SERVER_PACK_BYTES } from '../versions.ts';

const VALID_RESOURCE_PATH_RE = /^[a-z0-9/._-]+$/;
const JUNK_BASENAMES = new Set(['.ds_store', 'thumbs.db', 'desktop.ini']);

function formatMiB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2);
}

function isJunkEntry(path: string): boolean {
  const normalized = path.replace(/\/+$/, '');
  if (!normalized) return false;
  const segments = normalized.split('/');
  if (segments.some((seg) => seg === '__MACOSX')) {
    return true;
  }
  const base = (segments[segments.length - 1] ?? '').toLowerCase();
  return JUNK_BASENAMES.has(base);
}

function isMacOsMetadata(path: string): boolean {
  return path.split('/').some((seg) => seg === '__MACOSX');
}

/**
 * Evaluates structural ZIP rules Z01–Z09.
 * Pure logic; references docs/knowledge/ for version/size facts.
 */
export function evaluateZipRules(inspection: ZipInspection): Finding[] {
  const findings: Finding[] = [];

  if (!inspection.validZip) {
    findings.push({
      id: 'Z03',
      severity: 'ERROR',
      title: 'Berkas bukan arsip ZIP yang valid atau korup',
      message: `Berkas "${inspection.fileName}" gagal dibaca sebagai arsip ZIP (${inspection.parseError ?? 'struktur arsip tidak valid'}).`,
      fixHint:
        'Pastikan berkas dikompresi dalam format standar .zip (bukan .rar, .7z, atau hasil rename ekstensi) lalu ekspor ulang.',
      docRef: 'docs/knowledge/00-ringkasan-perbedaan-versi.md',
    });

    if (inspection.fileSizeBytes > MAX_SERVER_PACK_BYTES) {
      findings.push(createSizeWarning(inspection.fileSizeBytes));
    }
    return findings;
  }

  // Z01 / Z02: pack.mcmeta location
  if (!inspection.hasRootMcmeta) {
    if (inspection.wrapperFolder !== null) {
      findings.push({
        id: 'Z02',
        severity: 'ERROR',
        title: 'Resource pack terbungkus di dalam folder induk',
        message: `Berkas pack.mcmeta ditemukan di dalam folder "${inspection.wrapperFolder}/", bukan di root arsip ZIP. Minecraft tidak akan mengenali pack ini.`,
        fixHint: `Buka folder "${inspection.wrapperFolder}/", pilih isi di dalamnya (pack.mcmeta, assets/, dan pack.png jika ada), lalu zip langsung isi tersebut—jangan men-zip folder pembungkusnya.`,
        docRef: 'docs/knowledge/java-1.21.1.md §2',
        paths: [`${inspection.wrapperFolder}/pack.mcmeta`],
      });
    } else {
      const nestedMcmetas = inspection.entries
        .filter(
          (e) =>
            !e.dir &&
            !isMacOsMetadata(e.path) &&
            (e.path === 'pack.mcmeta' || e.path.endsWith('/pack.mcmeta')),
        )
        .map((e) => e.path);

      findings.push({
        id: 'Z01',
        severity: 'ERROR',
        title: 'pack.mcmeta tidak ditemukan di root arsip',
        message:
          nestedMcmetas.length > 1
            ? `Berkas pack.mcmeta tidak ada di root ZIP dan ditemukan beberapa salinan di subfolder (${nestedMcmetas.join(', ')}).`
            : 'Berkas pack.mcmeta tidak ditemukan di root arsip ZIP.',
        fixHint:
          'Tambahkan berkas pack.mcmeta yang valid tepat di tingkat paling atas (root) arsip ZIP bersama folder assets/.',
        docRef: 'docs/knowledge/00-ringkasan-perbedaan-versi.md §2',
        paths: nestedMcmetas.length > 0 ? nestedMcmetas : undefined,
      });
    }
  }

  // Z04: assets/ directory check (evaluated under packPrefix so Z02 doesn't double-confuse)
  const assetsPrefix = `${inspection.packPrefix}assets/`;
  const hasAssetsDir = inspection.entries.some(
    (entry) =>
      entry.path === assetsPrefix ||
      entry.path === `${inspection.packPrefix}assets` ||
      entry.path.startsWith(assetsPrefix),
  );
  if (!hasAssetsDir) {
    findings.push({
      id: 'Z04',
      severity: 'WARN',
      title: 'Folder assets/ tidak ditemukan',
      message: `Arsip tidak memiliki folder "${assetsPrefix}". Pack tanpa folder assets/ tidak memuat tekstur, font, model, atau suara kustom apa pun.`,
      fixHint:
        'Buat folder assets/<namespace>/ (misalnya assets/minecraft/textures/) di root resource pack jika Anda berniat mengubah aset game.',
      docRef: 'docs/knowledge/java-1.21.1.md §2',
    });
  }

  // Z05: Junk OS metadata files (prefer file entries; fall back to junk directories if empty)
  const junkFilePaths = inspection.entries
    .filter((e) => !e.dir && isJunkEntry(e.path))
    .map((e) => e.path);
  const junkDirPaths =
    junkFilePaths.length === 0
      ? inspection.entries
          .filter((e) => e.dir && isJunkEntry(e.path))
          .map((e) => e.path)
      : [];
  const junkPaths = [...junkFilePaths, ...junkDirPaths];
  if (junkPaths.length > 0) {
    findings.push({
      id: 'Z05',
      severity: 'WARN',
      title: 'Berkas sampah sistem operasi terdeteksi',
      message: `Ditemukan ${junkPaths.length} entri metadata OS (__MACOSX, .DS_Store, Thumbs.db, atau desktop.ini) yang memperbesar ukuran ZIP dan berisiko mengganggu alat build lain.`,
      fixHint:
        'Hapus __MACOSX/, .DS_Store, Thumbs.db, dan desktop.ini sebelum membuat ZIP (mis. di macOS gunakan opsi zip -x "*.DS_Store" -x "__MACOSX/*").',
      docRef: 'docs/knowledge/java-1.21.1.md §2',
      paths: junkPaths.slice(0, 20),
    });
  }

  // Z06: Invalid ResourceLocation path characters under assets/
  const invalidResourcePaths = inspection.entries
    .filter((entry) => !entry.dir && entry.path.startsWith(assetsPrefix))
    .filter((entry) => {
      const relative = entry.path.slice(assetsPrefix.length);
      return relative.length > 0 && !VALID_RESOURCE_PATH_RE.test(relative);
    })
    .map((entry) => entry.path);

  if (invalidResourcePaths.length > 0) {
    findings.push({
      id: 'Z06',
      severity: 'WARN',
      title: 'Nama path di bawah assets/ melanggar aturan karakter Minecraft',
      message: `Ditemukan ${invalidResourcePaths.length} path di dalam assets/ yang mengandung huruf kapital, spasi, atau karakter di luar a-z, 0-9, /, ., _, -. Minecraft menolak ResourceLocation berhuruf besar atau berspasi.`,
      fixHint:
        'Ubah semua nama folder dan berkas di bawah assets/ menjadi huruf kecil saja, ganti spasi dengan underscore (_) atau tanda hubung (-).',
      docRef: 'docs/knowledge/java-1.21.1.md §2',
      paths: invalidResourcePaths.slice(0, 25),
    });
  }

  // Z07: Case collisions
  const caseGroups = new Map<string, string[]>();
  for (const entry of inspection.entries) {
    if (entry.dir || isMacOsMetadata(entry.path)) continue;
    const key = entry.path.toLowerCase();
    const list = caseGroups.get(key);
    if (list) {
      list.push(entry.path);
    } else {
      caseGroups.set(key, [entry.path]);
    }
  }
  const collisions: string[] = [];
  for (const group of caseGroups.values()) {
    if (group.length > 1) {
      collisions.push(group.join(' ↔ '));
    }
  }
  if (collisions.length > 0) {
    findings.push({
      id: 'Z07',
      severity: 'WARN',
      title: 'Konflik nama path yang hanya berbeda huruf besar/kecil',
      message: `Ditemukan ${collisions.length} pasang berkas yang identik jika huruf besar/kecil diabaikan. Saat diekstrak di Windows/macOS, salah satu berkas akan menimpa yang lain.`,
      fixHint:
        'Hapus berkas duplikat dan seragamkan seluruh penamaan path menggunakan huruf kecil saja.',
      docRef: 'docs/knowledge/java-1.21.1.md §2',
      paths: collisions.slice(0, 20),
    });
  }

  // Z08: Size > 250 MiB
  if (inspection.fileSizeBytes > MAX_SERVER_PACK_BYTES) {
    findings.push(createSizeWarning(inspection.fileSizeBytes));
  }

  // Z09: pack.png missing
  const expectedPackPng = `${inspection.packPrefix}pack.png`;
  const hasPackPng = inspection.entries.some(
    (entry) => !entry.dir && entry.path === expectedPackPng,
  );
  if (!hasPackPng) {
    findings.push({
      id: 'Z09',
      severity: 'INFO',
      title: 'pack.png tidak ditemukan (opsional)',
      message:
        'Arsip tidak menyertakan gambar ikon pack.png di root. Minecraft tetap dapat memuat pack menggunakan ikon bawaan.',
      fixHint:
        'Opsional: tambahkan berkas PNG persegi (disarankan 128×128 px) bernama pack.png di root arsip agar tampil di daftar Resource Packs.',
      docRef: 'docs/knowledge/java-1.21.1.md §2',
    });
  }

  // Z10: Multi-plugin server bundle detection (ItemsAdder / Oraxen / Nexo / nested vanilla ZIPs)
  const { ecosystems, nestedZipPaths } = inspection.pluginBundle;
  if (!inspection.hasRootMcmeta && (ecosystems.length > 0 || nestedZipPaths.length > 0)) {
    const ecosystemLabels = ecosystems.map((eco) =>
      eco === 'itemsadder'
        ? 'ItemsAdder'
        : eco === 'oraxen'
          ? 'Oraxen'
          : 'Nexo',
    );
    const detectedParts: string[] = [];
    if (ecosystemLabels.length > 0) {
      detectedParts.push(`konfigurasi plugin (${ecosystemLabels.join(', ')})`);
    }
    if (nestedZipPaths.length > 0) {
      detectedParts.push(`${nestedZipPaths.length} arsip .zip bersarang`);
    }

    const fixSteps: string[] = [];
    if (nestedZipPaths.length > 0 || inspection.wrapperFolder !== null) {
      fixSteps.push(
        'Untuk Minecraft vanilla atau plugins/Nexo/pack/external_packs/, pakai isi subfolder/ZIP vanilla yang memiliki pack.mcmeta langsung di root lalu jalankan /nexo reload & /nexo pack.',
      );
    }
    if (ecosystems.includes('itemsadder')) {
      fixSteps.push(
        'Untuk ItemsAdder, salin isi folder ItemsAdder (data/items_packs & data/resource_pack) ke plugins/ItemsAdder/ lalu jalankan /iareload & /iazip.',
      );
    }
    if (ecosystems.includes('oraxen')) {
      fixSteps.push(
        'Untuk Oraxen, salin folder items/, glyphs/, dan pack/ ke plugins/Oraxen/ lalu jalankan /o reload all.',
      );
    }
    if (ecosystems.includes('nexo')) {
      fixSteps.push(
        'Untuk Nexo, salin items/, glyphs/, dan pack/assets/ ke plugins/Nexo/ lalu jalankan /nexo reload & /nexo pack.',
      );
    }

    const samplePaths = [
      ...inspection.pluginBundle.itemsAdderPaths.slice(0, 3),
      ...inspection.pluginBundle.oraxenPaths.slice(0, 3),
      ...inspection.pluginBundle.nexoPaths.slice(0, 3),
      ...nestedZipPaths.slice(0, 3),
    ];

    findings.push({
      id: 'Z10',
      severity: 'INFO',
      title: 'Terdeteksi bundle resource pack untuk plugin server (ItemsAdder / Oraxen / Nexo)',
      message: `Arsip ini bukan resource pack vanilla langsung melainkan bundle distribusi kreator yang memuat ${detectedParts.join(' dan ')}.`,
      fixHint: fixSteps.join(' '),
      docRef: 'docs/knowledge/plugin-itemsadder-oraxen-nexo.md §1–§4',
      paths: samplePaths.length > 0 ? samplePaths : undefined,
    });
  }

  // Z11: Missing textures referenced inside assets/<ns>/font/*.json
  if (inspection.fontAudit.missingTextures.length > 0) {
    findings.push({
      id: 'Z11',
      severity: 'ERROR',
      title: 'Tekstur PNG yang dirujuk di font JSON tidak ditemukan di dalam ZIP',
      message: `Ditemukan ${inspection.fontAudit.missingTextures.length} entri BitmapProvider di font/*.json yang merujuk tekstur yang tidak ada di folder textures/.`,
      fixHint:
        'Tambahkan file PNG yang hilang di assets/<namespace>/textures/<path> atau hapus entri provider yatim dari font/*.json.',
      docRef:
        'docs/knowledge/font-dan-glyph.md §1A & docs/knowledge/plugin-itemsadder-oraxen-nexo.md §3',
      paths: inspection.fontAudit.missingTextures.slice(0, 20),
    });
  }

  // Z12: Negative height artifact or non-PUA CJK/Yi codepoint collision risk in font/*.json
  if (
    inspection.fontAudit.negativeHeightProviders.length > 0 ||
    inspection.fontAudit.nonPuaChars.length > 0
  ) {
    const reasons: string[] = [];
    if (inspection.fontAudit.negativeHeightProviders.length > 0) {
      reasons.push(
        `${inspection.fontAudit.negativeHeightProviders.length} provider memakai height <= 0 / ascent ekstrem negatif (artefak placeholder plugin)`,
      );
    }
    if (inspection.fontAudit.nonPuaChars.length > 0) {
      reasons.push(
        `${inspection.fontAudit.nonPuaChars.length} glyph memakai aksara Yi/CJK non-PUA alih-alih Private Use Area U+E200–U+F8FF`,
      );
    }
    findings.push({
      id: 'Z12',
      severity: 'WARN',
      title: 'Anomali provider font atau pemakaian codepoint non-PUA di font/*.json',
      message: `Inspeksi font/*.json menemukan ${reasons.join(' serta ')}.`,
      fixHint:
        'Ganti dummy provider ber-height negatif dengan karakter normal atau space provider, dan pindahkan codepoint badge ke rentang PUA aman U+E200–U+F8FF.',
      docRef:
        'docs/knowledge/font-dan-glyph.md §2 & docs/knowledge/plugin-itemsadder-oraxen-nexo.md §3',
      paths: [
        ...inspection.fontAudit.negativeHeightProviders.slice(0, 10),
        ...inspection.fontAudit.nonPuaChars.slice(0, 10),
      ],
    });
  }

  return findings;
}

function createSizeWarning(fileSizeBytes: number): Finding {
  return {
    id: 'Z08',
    severity: 'WARN',
    title: 'Ukuran arsip melebihi batas 250 MiB untuk server resource pack',
    message: `Ukuran berkas ZIP adalah ${formatMiB(fileSizeBytes)} MiB (${fileSizeBytes.toLocaleString('id-ID')} byte), melebihi batas unduhan klien Minecraft sebesar 250 MiB (262.144.000 byte).`,
    fixHint:
      'Klien yang mengunduh server resource pack > 250 MiB akan menolaknya otomatis. Kompres tekstur PNG/audio OGG atau pecah aset opsional menjadi pack terpisah.',
    docRef: 'docs/knowledge/java-1.21.1.md §7 & docs/knowledge/java-26.3.md §7',
  };
}
