import type { TargetVersionId } from '../../types.ts';
import { computeBitmapMetrics } from '../bitmapMetrics.ts';
import { decodePngRgba } from '../pngCodec.ts';
import {
  formatCodepointHex,
  isBedrockReservedPua,
  isPrivateUseCodepoint,
  resolveProjectPrefixString,
} from '../puaAllocator.ts';
import { resolveBitmapEntryRaster } from '../pixelSynth.ts';
import type {
  BitmapFontEntry,
  BitmapGlyphMetrics,
  DecodedRgbaImage,
  FontFinding,
  FontProject,
  FontValidationResult,
  ObjectComponentConfig,
  SpaceFontEntry,
} from '../types.ts';

const VALID_NS_RE = /^[a-z0-9_.-]+$/;
const VALID_PATH_RE = /^[a-z0-9/._-]+$/;

export interface ParsedIdentifierRef {
  readonly valid: boolean;
  readonly namespace: string;
  readonly path: string;
  readonly hasDoubleTexturesPrefix: boolean;
  readonly endsWithPng: boolean;
  readonly expectedZipTexturePath: string | null;
}

export function parseTextureIdentifier(fileRef: string): ParsedIdentifierRef {
  const trimmed = fileRef.trim();
  const colonIdx = trimmed.indexOf(':');
  const namespace = colonIdx === -1 ? 'minecraft' : trimmed.slice(0, colonIdx);
  const path = colonIdx === -1 ? trimmed : trimmed.slice(colonIdx + 1);
  const validSyntax =
    trimmed.length > 0 &&
    !trimmed.includes(' ') &&
    (colonIdx === -1 || trimmed.indexOf(':', colonIdx + 1) === -1) &&
    VALID_NS_RE.test(namespace) &&
    path.length > 0 &&
    !path.startsWith('/') &&
    !path.endsWith('/') &&
    !path.includes('//') &&
    VALID_PATH_RE.test(path);

  const hasDoubleTexturesPrefix = path.startsWith('textures/');
  const endsWithPng = path.endsWith('.png');
  const expectedZipTexturePath = validSyntax
    ? `assets/${namespace}/textures/${path}`
    : null;

  return {
    valid: validSyntax && endsWithPng && !hasDoubleTexturesPrefix,
    namespace,
    path,
    hasDoubleTexturesPrefix,
    endsWithPng,
    expectedZipTexturePath,
  };
}

/**
 * Pure validator for Bedrock Edition 16x16 glyph_XX.png grids (F10).
 * Deferred in Java-only UI export (Q3) and exposed as pure core rule for unit tests & Phase 4.
 * Reference: docs/knowledge/bedrock-geyser.md §2 [SECONDARY]
 */
export function evaluateBedrockGlyphGridRule(
  image: DecodedRgbaImage,
  entryId?: string,
): FontFinding[] {
  const findings: FontFinding[] = [];
  if (image.width % 16 !== 0 || image.height % 16 !== 0) {
    findings.push({
      id: 'F10',
      severity: 'ERROR',
      entryId,
      title: 'Dimensi sheet glyph Bedrock bukan kelipatan 16 [SECONDARY]',
      message: `Ukuran gambar ${image.width}×${image.height} px tidak habis dibagi 16×16 sel yang disyaratkan Bedrock glyph_XX.png.`,
      fixHint:
        'Ubah ukuran kanvas PNG agar lebar dan tingginya kelipatan 16 (misalnya 256×256 px untuk sel 16×16).',
      docRef: 'docs/knowledge/bedrock-geyser.md §2',
    });
    return findings;
  }

  const cellW = image.width / 16;
  const cellH = image.height / 16;
  let hasOpaqueBackgroundCorners = false;
  let touchesCellBoundary = false;

  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 16; col++) {
      let cellHasPixel = false;
      let cellAllOpaque = true;
      let touchesRightOrBottom = false;

      for (let y = 0; y < cellH; y++) {
        for (let x = 0; x < cellW; x++) {
          const px = col * cellW + x;
          const py = row * cellH + y;
          const alpha = image.rgba[(py * image.width + px) * 4 + 3]!;
          if (alpha !== 0) {
            cellHasPixel = true;
            if (x === cellW - 1 || y === cellH - 1) {
              touchesRightOrBottom = true;
            }
          } else {
            cellAllOpaque = false;
          }
        }
      }

      if (cellHasPixel && cellAllOpaque) {
        hasOpaqueBackgroundCorners = true;
      }
      if (cellHasPixel && touchesRightOrBottom) {
        touchesCellBoundary = true;
      }
    }
  }

  if (hasOpaqueBackgroundCorners || touchesCellBoundary) {
    const reasons: string[] = [];
    if (hasOpaqueBackgroundCorners) {
      reasons.push('terdapat sel tanpa latar transparan penuh (alpha = 0)');
    }
    if (touchesCellBoundary) {
      reasons.push('piksel menyentuh tepi kanan/bawah sel');
    }
    findings.push({
      id: 'F10',
      severity: 'WARN',
      entryId,
      title: 'Risiko pixel bleeding pada sheet glyph Bedrock [SECONDARY]',
      message: `Pemeriksaan grid Bedrock mendeteksi ${reasons.join(' dan ')}.`,
      fixHint:
        'Pastikan latar belakang tiap sel transparan (alpha = 0) dan sisakan minimal 1 px jarak aman di tepi sel untuk mencegah pixel bleeding.',
      docRef: 'docs/knowledge/bedrock-geyser.md §2',
    });
  }

  return findings;
}

export function evaluateObjectComponentRules(
  objectConfig: ObjectComponentConfig,
  targetVersion: TargetVersionId,
): FontFinding[] {
  if (!objectConfig.enabled) {
    return [];
  }

  const findings: FontFinding[] = [];
  if (targetVersion === '1.21.1') {
    findings.push({
      id: 'O01',
      severity: 'ERROR',
      field: 'objectComponent',
      title: 'Komponen teks "object" belum didukung pada target 1.21.1',
      message:
        'Text component {"type": "object"} baru ditambahkan di Minecraft Java Edition 1.21.9 sehingga gagal dimuat di 1.21.1.',
      fixHint:
        'Nonaktifkan generator "type": "object" dan gunakan provider bitmap PUA, atau naikkan target versi ke 1.21.10+.',
      docRef: 'docs/knowledge/java-1.21.1.md §4 & docs/knowledge/java-1.21.10.md §4',
    });
    return findings;
  }

  if (
    objectConfig.mode === 'atlas' &&
    targetVersion !== '1.21.10'
  ) {
    const atlas = objectConfig.atlas.trim();
    const sprite = objectConfig.sprite.trim();
    const spritePath = sprite.includes(':')
      ? sprite.slice(sprite.indexOf(':') + 1)
      : sprite;
    if (atlas === 'minecraft:blocks' && spritePath.startsWith('item/')) {
      findings.push({
        id: 'O02',
        severity: 'WARN',
        field: 'objectComponent',
        title: `Pemisahan atlas 1.21.11+: sprite "${sprite}" tidak lagi di minecraft:blocks`,
        message: `Mulai 1.21.11 hingga ${targetVersion}, sprite item/ dipindahkan dari atlases/blocks.json ke atlases/items.json.`,
        fixHint: 'Ubah nilai atlas menjadi "minecraft:items" untuk sprite item.',
        docRef: 'docs/knowledge/java-1.21.11.md §2 & §6',
      });
    } else if (atlas === 'minecraft:items' && spritePath.startsWith('block/')) {
      findings.push({
        id: 'O02',
        severity: 'WARN',
        field: 'objectComponent',
        title: `Sprite blok "${sprite}" umumnya berada di atlas minecraft:blocks`,
        message: `Target ${targetVersion} memisahkan atlas item (minecraft:items) dan atlas blok (minecraft:blocks).`,
        fixHint:
          'Gunakan "minecraft:blocks" untuk tekstur di folder textures/block/.',
        docRef: 'docs/knowledge/java-1.21.11.md §2 & §6',
      });
    }
  }

  return findings;
}

export interface EvaluateFontProjectOptions {
  /** Override decoded PNG map in synchronous/pre-decoded contexts. */
  readonly predecodedUploads?: ReadonlyMap<string, DecodedRgbaImage>;
  /** Explicit set of available texture ZIP paths (used when verifying external pack refs for F06). */
  readonly availableTexturePaths?: ReadonlySet<string>;
  /** Optional command/prefix string length override for F08 checks. */
  readonly generatedCommandString?: string;
  /** Opt-in Bedrock 16x16 sheet check (F10). */
  readonly checkBedrockGrid?: boolean;
}

/**
 * Pure asynchronous validator for FontProject rules F01–F10 + optional object component check.
 * Works identically in Node (Vitest) and browser.
 */
export async function evaluateFontProject(
  project: FontProject,
  options: EvaluateFontProjectOptions = {},
): Promise<FontValidationResult> {
  const findings: FontFinding[] = [];
  const metricsByEntryId: Record<string, BitmapGlyphMetrics> = {};
  const decodeErrorsByEntryId: Record<string, string> = {};

  // Track global codepoint ownership for F04 (inter-provider) and F05 (PUA / Bedrock collisions)
  const codepointOwners = new Map<
    number,
    Array<{ readonly entryId: string; readonly label: string; readonly kind: string }>
  >();
  // Track resolved ZIP texture paths to catch overwriting duplicate fileRefs
  const texturePathOwners = new Map<string, BitmapFontEntry[]>();

  let hasHeightAboveEight = false;

  // Validate pack namespace & fontName for ResourceLocation safety (related to F06 / Z06)
  if (!VALID_NS_RE.test(project.namespace)) {
    findings.push({
      id: 'F06',
      severity: 'ERROR',
      field: 'namespace',
      title: 'Namespace pack tidak memenuhi aturan ResourceLocation',
      message: `Namespace "${project.namespace}" harus hanya berisi huruf kecil a-z, angka 0-9, underscore (_), titik (.), atau tanda hubung (-).`,
      fixHint: 'Ubah namespace menjadi huruf kecil tanpa spasi, misalnya "mypack".',
      docRef: 'docs/knowledge/font-dan-glyph.md §1A',
    });
  }
  if (
    project.fontName.length === 0 ||
    project.fontName.startsWith('/') ||
    project.fontName.endsWith('/') ||
    !VALID_PATH_RE.test(project.fontName)
  ) {
    findings.push({
      id: 'F06',
      severity: 'ERROR',
      field: 'fontName',
      title: 'Nama file font tidak valid untuk ResourceLocation',
      message: `Nama font "${project.fontName}" mengandung karakter terlarang atau kosong.`,
      fixHint: 'Gunakan nama huruf kecil seperti "default" atau "ranks/badges".',
      docRef: 'docs/knowledge/font-dan-glyph.md §1A',
    });
  }

  for (const entry of project.entries) {
    if (entry.kind === 'bitmap') {
      await evaluateBitmapEntry(
        entry,
        project,
        options,
        findings,
        metricsByEntryId,
        decodeErrorsByEntryId,
        codepointOwners,
        texturePathOwners,
      );
      if (entry.height > 8) {
        hasHeightAboveEight = true;
      }
    } else {
      evaluateSpaceEntry(entry, findings, codepointOwners);
    }
  }

  // F06 (duplicate target PNG path across multiple bitmap entries -> WARN)
  for (const [texPath, owners] of texturePathOwners.entries()) {
    if (owners.length > 1) {
      const firstBytes = owners[0]?.uploadedPngBytes;
      const isIdenticalUpload =
        firstBytes !== undefined &&
        owners.every(
          (o) =>
            o.sourceMode === 'uploaded-png' &&
            o.uploadedPngBytes === firstBytes &&
            Object.keys(o.paintEdits).length === 0,
        );
      if (isIdenticalUpload) continue;

      const ownerLabels = owners.map((o) => o.label).join(', ');
      findings.push({
        id: 'F06',
        severity: 'WARN',
        entryId: owners[1]?.id,
        field: 'fileRef',
        title: `Path tekstur "${texPath}" dipakai oleh ${owners.length} entri`,
        message: `Entri (${ownerLabels}) sama-sama menulis ke "${texPath}". Saat ekspor ZIP, berkas PNG entri terakhir akan menimpa entri sebelumnya.`,
        fixHint:
          'Gunakan nama file berbeda pada field "file" tiap entri (atau gabungkan sprite ke satu grid chars yang sama).',
        docRef: 'docs/knowledge/font-dan-glyph.md §1A',
      });
    }
  }

  // F04 (inter-provider duplicate codepoints -> INFO)
  for (const [cp, owners] of codepointOwners.entries()) {
    if (owners.length > 1) {
      const ownerLabels = owners.map((o) => o.label).join(' → ');
      findings.push({
        id: 'F04',
        severity: 'INFO',
        entryId: owners[1]?.entryId,
        title: `Codepoint ${formatCodepointHex(cp)} didefinisikan lebih dari satu provider`,
        message: `Urutan provider "${ownerLabels}" sama-sama memakai ${formatCodepointHex(cp)}. Di Java Edition (FontSet.activeProviders), provider paling awal akan menang diam-diam tanpa log vanilla.`,
        fixHint:
          'Ubah salah satu entri ke codepoint PUA unik (U+E200+) agar tidak saling menimpa secara diam-diam.',
        docRef: 'docs/knowledge/font-dan-glyph.md §2 & docs/knowledge/java-1.21.11.md §4',
      });
    }
  }

  // F05 (PUA / Bedrock / ASCII collision checks)
  for (const [cp, owners] of codepointOwners.entries()) {
    const primaryOwner = owners[0]!;
    if (isBedrockReservedPua(cp)) {
      findings.push({
        id: 'F05',
        severity: 'WARN',
        entryId: primaryOwner.entryId,
        title: `Codepoint ${formatCodepointHex(cp)} masuk zona tabrakan Bedrock HUD [SECONDARY]`,
        message: `Rentang U+E000–U+E1FF (${formatCodepointHex(cp)} pada "${primaryOwner.label}") dipakai kontroler & HUD vanilla Bedrock (glyph_E0/E1) pada server GeyserMC.`,
        fixHint:
          'Pindahkan codepoint ke zona aman U+E200–U+F8FF menggunakan alokator otomatis agar aman di Java maupun Geyser.',
        docRef: 'docs/knowledge/bedrock-geyser.md §2 & docs/knowledge/font-dan-glyph.md §2',
      });
    } else if (!isPrivateUseCodepoint(cp)) {
      findings.push({
        id: 'F05',
        severity: 'WARN',
        entryId: primaryOwner.entryId,
        title: `Codepoint ${formatCodepointHex(cp)} menimpa karakter teks umum/ASCII`,
        message: `Entri "${primaryOwner.label}" memakai ${formatCodepointHex(cp)} ("${String.fromCodePoint(cp)}") di luar Private Use Area, sehingga huruf atau simbol normal akan terganti di game.`,
        fixHint:
          'Gunakan codepoint Private Use Area mulai U+E200 ke atas supaya teks chat biasa tidak rusak.',
        docRef: 'docs/knowledge/font-dan-glyph.md §2',
      });
    }
  }

  // F08 (Chat / LuckPerms command length > 256 chars)
  const commandSample =
    options.generatedCommandString ??
    buildSampleLuckPermsCommand(project);
  const commandCpLen = Array.from(commandSample).length;
  const chatSampleCpLen = Array.from(project.sampleChatText).length;
  if (commandCpLen > 256 || chatSampleCpLen > 256) {
    const worstLen = Math.max(commandCpLen, chatSampleCpLen);
    findings.push({
      id: 'F08',
      severity: 'WARN',
      field: 'commandLength',
      title: `Panjang teks/perintah (${worstLen} karakter) melewati batas chat 256`,
      message: `Kotak chat Minecraft Java membatasi input hingga 256 karakter (MC-236960). Perintah atau preview sepanjang ${worstLen} karakter akan terpotong jika diketik dari klien.`,
      fixHint:
        'Jalankan perintah LuckPerms melalui konsol server, gunakan MiniMessage/file grup, atau persingkat rangkaian karakter prefix.',
      docRef: 'docs/knowledge/font-dan-glyph.md §4',
    });
  }

  // F09 (height > 8 in Chat / TAB / Nametag -> INFO [UNVERIFIED])
  if (hasHeightAboveEight) {
    findings.push({
      id: 'F09',
      severity: 'INFO',
      field: 'height',
      title: `Glyph ber-height > 8 pada konteks ${project.previewContext} [UNVERIFIED]`,
      message: `Terdapat provider bitmap dengan height > 8 px pada pratinjau ${project.previewContext}. Batas maksimum tinggi sebelum teks Chat/TAB/Nametag terpotong atau menabrak baris lain di klien & Paper modern berstatus [UNVERIFIED].`,
      fixHint:
        'Uji langsung resource pack di klien target (1.21.1–26.3) dan server Paper untuk memastikan tidak menabrak baris di atas/bawahnya.',
      docRef:
        'docs/knowledge/font-dan-glyph.md §4 & docs/knowledge/99-pertanyaan-terbuka.md #6',
    });
  }

  // Optional object text component checks (1.21.9+)
  findings.push(
    ...evaluateObjectComponentRules(
      project.objectComponent,
      project.targetVersion,
    ),
  );

  let errors = 0;
  let warns = 0;
  let infos = 0;
  for (const f of findings) {
    if (f.severity === 'ERROR') errors++;
    else if (f.severity === 'WARN') warns++;
    else infos++;
  }

  return {
    findings,
    errors,
    warns,
    infos,
    metricsByEntryId,
    decodeErrorsByEntryId,
  };
}

async function evaluateBitmapEntry(
  entry: BitmapFontEntry,
  _project: FontProject,
  options: EvaluateFontProjectOptions,
  findings: FontFinding[],
  metricsByEntryId: Record<string, BitmapGlyphMetrics>,
  decodeErrorsByEntryId: Record<string, string>,
  codepointOwners: Map<
    number,
    Array<{ readonly entryId: string; readonly label: string; readonly kind: string }>
  >,
  texturePathOwners: Map<string, BitmapFontEntry[]>,
): Promise<void> {
  // F01: ascent <= height & valid positive integer height
  if (!Number.isInteger(entry.height) || entry.height <= 0) {
    findings.push({
      id: 'F01',
      severity: 'ERROR',
      entryId: entry.id,
      field: 'height',
      title: `Nilai height pada "${entry.label}" harus integer positif`,
      message: `height bernilai ${entry.height}. Minecraft mengharuskan height berupa bilangan bulat >= 1.`,
      fixHint: 'Atur height ke bilangan bulat positif seperti 8 atau 9.',
      docRef: 'docs/knowledge/font-dan-glyph.md §1A',
    });
  }
  if (!Number.isInteger(entry.ascent)) {
    findings.push({
      id: 'F01',
      severity: 'ERROR',
      entryId: entry.id,
      field: 'ascent',
      title: `Nilai ascent pada "${entry.label}" harus bilangan bulat`,
      message: `ascent bernilai ${entry.ascent}. Codec BitmapProvider$Definition menerima integer untuk ascent.`,
      fixHint: 'Ubah ascent ke angka bulat (misalnya 7 atau 8).',
      docRef: 'docs/knowledge/font-dan-glyph.md §1A',
    });
  } else if (Number.isInteger(entry.height) && entry.ascent > entry.height) {
    findings.push({
      id: 'F01',
      severity: 'ERROR',
      entryId: entry.id,
      field: 'ascent',
      title: `ascent (${entry.ascent}) melebihi height (${entry.height}) pada "${entry.label}"`,
      message: `Mojang BitmapProvider$Definition menolak tegas provider dengan ascent > height (DataResult.error).`,
      fixHint: `Turunkan nilai ascent menjadi <= ${entry.height}, atau naikkan height minimal menjadi ${entry.ascent}.`,
      docRef: 'docs/knowledge/font-dan-glyph.md §1A',
    });
  }

  // F02: chars grid uniformity using Unicode codepoints (Array.from)
  const rows = entry.chars.length;
  const firstRowCps = rows > 0 ? Array.from(entry.chars[0]!) : [];
  const cols = firstRowCps.length;
  let validCharsGrid = true;

  if (rows === 0 || cols === 0) {
    validCharsGrid = false;
    findings.push({
      id: 'F02',
      severity: 'ERROR',
      entryId: entry.id,
      field: 'chars',
      title: `Kisi chars pada "${entry.label}" kosong`,
      message:
        rows === 0
          ? 'Array "chars" tidak boleh kosong.'
          : 'Baris pertama "chars" tidak boleh kosong.',
      fixHint: 'Isi minimal satu karakter/codepoint pada array chars (misalnya ["\\uE200"]).',
      docRef: 'docs/knowledge/font-dan-glyph.md §1A',
    });
  } else {
    const mismatchedRows: number[] = [];
    for (let r = 1; r < rows; r++) {
      const rowLen = Array.from(entry.chars[r]!).length;
      if (rowLen !== cols) {
        mismatchedRows.push(r + 1);
      }
    }
    if (mismatchedRows.length > 0) {
      validCharsGrid = false;
      findings.push({
        id: 'F02',
        severity: 'ERROR',
        entryId: entry.id,
        field: 'chars',
        title: `Jumlah codepoint per baris chars tidak seragam pada "${entry.label}"`,
        message: `Baris 1 memiliki ${cols} codepoint, tetapi baris ${mismatchedRows.join(', ')} berbeda panjang (BitmapProvider$Definition.validateDimensions gagal).`,
        fixHint:
          'Samakan jumlah karakter Unicode di setiap baris chars (gunakan \\u0000 untuk sel kosong).',
        docRef:
          'docs/knowledge/font-dan-glyph.md §1A & docs/knowledge/99-pertanyaan-terbuka.md #7',
      });
    }
  }

  // F04 (intra-provider duplicate check) & register global owners
  const seenWithinEntry = new Set<number>();
  const intraDuplicates = new Set<number>();
  for (const row of entry.chars) {
    for (const ch of Array.from(row)) {
      const cp = ch.codePointAt(0) ?? 0;
      if (cp === 0) continue; // \u0000 is the empty glyph slot sentinel in Mojang BitmapProvider
      if (seenWithinEntry.has(cp)) {
        intraDuplicates.add(cp);
      } else {
        seenWithinEntry.add(cp);
        const list = codepointOwners.get(cp);
        const owner = { entryId: entry.id, label: entry.label, kind: 'bitmap' };
        if (list) list.push(owner);
        else codepointOwners.set(cp, [owner]);
      }
    }
  }
  if (intraDuplicates.size > 0) {
    const dupHexes = Array.from(intraDuplicates).map(formatCodepointHex).join(', ');
    findings.push({
      id: 'F04',
      severity: 'WARN',
      entryId: entry.id,
      field: 'chars',
      title: `Codepoint ganda di dalam provider "${entry.label}"`,
      message: `Codepoint ${dupHexes} muncul lebih dari satu kali pada grid chars yang sama. BitmapProvider.load akan menimpa glyph sebelumnya dan mencatat log peringatan.`,
      fixHint: 'Ganti sel duplikat dengan codepoint PUA lain atau \\u0000 jika kosong.',
      docRef: 'docs/knowledge/font-dan-glyph.md §2',
    });
  }

  // F06: Identifier syntax, double textures/ prefix, .png suffix, texture presence
  const parsedRef = parseTextureIdentifier(entry.fileRef);
  if (!parsedRef.valid) {
    const reasons: string[] = [];
    if (parsedRef.hasDoubleTexturesPrefix) {
      reasons.push(
        'mengandung awalan "textures/" ganda (Minecraft otomatis menambahkan prefix "textures/")',
      );
    }
    if (!parsedRef.endsWithPng) {
      reasons.push('tidak berakhiran ".png"');
    }
    if (!parsedRef.expectedZipTexturePath) {
      reasons.push(
        'melanggar pola Identifier (<namespace>:<path> hanya a-z 0-9 _ . - /)',
      );
    }
    findings.push({
      id: 'F06',
      severity: 'ERROR',
      entryId: entry.id,
      field: 'fileRef',
      title: `Field "file" pada "${entry.label}" tidak valid`,
      message: `Nilai "${entry.fileRef}" ${reasons.join(' dan ')}.`,
      fixHint:
        'Gunakan format "<namespace>:font/<nama_file>.png" tanpa awalan "textures/", huruf kecil saja.',
      docRef: 'docs/knowledge/font-dan-glyph.md §1A',
    });
  } else {
    if (parsedRef.expectedZipTexturePath) {
      const owners = texturePathOwners.get(parsedRef.expectedZipTexturePath);
      if (owners) owners.push(entry);
      else texturePathOwners.set(parsedRef.expectedZipTexturePath, [entry]);
    }
    if (
      options.availableTexturePaths &&
      parsedRef.expectedZipTexturePath &&
      !options.availableTexturePaths.has(parsedRef.expectedZipTexturePath)
    ) {
      findings.push({
        id: 'F06',
        severity: 'ERROR',
        entryId: entry.id,
        field: 'fileRef',
        title: `Berkas tekstur tidak ditemukan untuk "${entry.label}"`,
        message: `Field file merujuk ke "${parsedRef.expectedZipTexturePath}", tetapi berkas tersebut tidak ada di arsip paket.`,
        fixHint: `Pastikan gambar PNG tersimpan di ${parsedRef.expectedZipTexturePath} atau ubah field file.`,
        docRef: 'docs/knowledge/font-dan-glyph.md §1A',
      });
    }
  }

  // F03: PNG decode + divisibility check against cols/rows
  let decodedImage: DecodedRgbaImage | null = null;
  if (entry.sourceMode === 'uploaded-png') {
    const pre = options.predecodedUploads?.get(entry.id);
    if (pre) {
      decodedImage = pre;
    } else if (!entry.uploadedPngBytes || entry.uploadedPngBytes.byteLength === 0) {
      const errMsg = 'Belum ada berkas PNG yang diunggah untuk entri ini.';
      decodeErrorsByEntryId[entry.id] = errMsg;
      findings.push({
        id: 'F03',
        severity: 'ERROR',
        entryId: entry.id,
        field: 'uploadedPngBytes',
        title: `Gambar PNG belum tersedia untuk "${entry.label}"`,
        message: errMsg,
        fixHint: 'Unggah berkas .png yang valid atau ubah mode entri ke Rank Composer.',
        docRef: 'docs/knowledge/font-dan-glyph.md §1A',
      });
    } else {
      const res = await decodePngRgba(entry.uploadedPngBytes);
      if (!res.ok) {
        decodeErrorsByEntryId[entry.id] = res.error;
        findings.push({
          id: 'F03',
          severity: 'ERROR',
          entryId: entry.id,
          field: 'uploadedPngBytes',
          title: `Berkas PNG "${entry.uploadedPngFileName ?? entry.label}" rusak atau tidak valid`,
          message: res.error,
          fixHint:
            'Ekspor ulang gambar sebagai PNG standar (RGBA/RGB/Indexed 8-bit) tanpa korupsi chunk.',
          docRef: 'docs/knowledge/font-dan-glyph.md §1A',
        });
      } else {
        decodedImage = res.image;
      }
    }
  } else {
    const synth = resolveBitmapEntryRaster(entry);
    if (synth) {
      decodedImage = {
        width: synth.width,
        height: synth.height,
        rgba: synth.rgba,
        hasAlphaChannel: true,
        colorType: 6,
        bitDepth: 8,
        interlace: 0,
      };
    }
  }

  if (decodedImage) {
    // Apply paintEdits if uploaded PNG was touched with Pixel Brush
    const finalRaster =
      entry.sourceMode === 'uploaded-png'
        ? resolveBitmapEntryRaster(entry, decodedImage)!
        : {
            width: decodedImage.width,
            height: decodedImage.height,
            rgba: decodedImage.rgba,
          };

    if (validCharsGrid) {
      const remW = finalRaster.width % cols;
      const remH = finalRaster.height % rows;
      if (remW !== 0 || remH !== 0) {
        const msg = `Dimensi gambar ${finalRaster.width}×${finalRaster.height} px tidak habis dibagi kisi chars ${cols} kolom × ${rows} baris.`;
        decodeErrorsByEntryId[entry.id] = msg;
        findings.push({
          id: 'F03',
          severity: 'ERROR',
          entryId: entry.id,
          field: 'chars',
          title: `Dimensi PNG tidak kelipatan kisi chars pada "${entry.label}"`,
          message: msg,
          fixHint: `Sesuaikan jumlah kolom/baris chars agar menjadi pembagi dari ${finalRaster.width}×${finalRaster.height} (misal ${cols}×${rows} sel berukuran integer).`,
          docRef: 'docs/knowledge/font-dan-glyph.md §1A',
        });
      } else {
        const metrics = computeBitmapMetrics({
          imageWidth: finalRaster.width,
          imageHeight: finalRaster.height,
          rgba: finalRaster.rgba,
          chars: entry.chars,
          height: entry.height,
          ascent: entry.ascent,
          luminanceOnly:
            entry.sourceMode === 'uploaded-png' &&
            decodedImage.colorType === 0 &&
            !decodedImage.hasAlphaChannel,
        });
        if (metrics) {
          metricsByEntryId[entry.id] = metrics;
        }
      }
    }

    if (options.checkBedrockGrid) {
      findings.push(
        ...evaluateBedrockGlyphGridRule(
          {
            ...decodedImage,
            rgba: finalRaster.rgba,
          },
          entry.id,
        ),
      );
    }
  }

  // Also check entry's spaceLeft/spaceRight for F07 validity & fishy note
  if (entry.sourceMode === 'composer') {
    if (
      !Number.isFinite(entry.spaceLeft) ||
      !Number.isFinite(entry.spaceRight)
    ) {
      findings.push({
        id: 'F07',
        severity: 'ERROR',
        entryId: entry.id,
        field: 'spaceLeft',
        title: `Nilai padding space pada "${entry.label}" tidak valid`,
        message: `Space Kiri/Kanan harus berupa bilangan berhingga (float).`,
        fixHint: 'Masukkan angka seperti 0, -1, atau -0.5 pada Space Kiri/Kanan.',
        docRef: 'docs/knowledge/font-dan-glyph.md §1B',
      });
    } else if (
      (entry.spaceLeft !== 0 &&
        (entry.spaceLeft < 0 || entry.spaceLeft > 32)) ||
      (entry.spaceRight !== 0 &&
        (entry.spaceRight < 0 || entry.spaceRight > 32))
    ) {
      const values: number[] = [];
      if (entry.spaceLeft < 0 || entry.spaceLeft > 32) values.push(entry.spaceLeft);
      if (entry.spaceRight < 0 || entry.spaceRight > 32) values.push(entry.spaceRight);
      findings.push({
        id: 'F07',
        severity: 'INFO',
        entryId: entry.id,
        field: 'spaceLeft',
        title: `Advance space padding (${values.join(', ')}) tergolong fishy di nonFishyGlyphs`,
        message: `Padding spasi (${values.join(', ')}) pada "${entry.label}" sah di codec SpaceProvider (anyGlyphs), tetapi akan dilewati saat render mode nonFishyGlyphs seperti teks acak &k (FontSet.hasFishyAdvance).`,
        fixHint:
          'Abaikan untuk badge/prefix statis biasa; hindari memakai glyph ini di dalam format obfuscated &k.',
        docRef: 'docs/knowledge/font-dan-glyph.md §1B',
      });
    }
  }
}

function evaluateSpaceEntry(
  entry: SpaceFontEntry,
  findings: FontFinding[],
  codepointOwners: Map<
    number,
    Array<{ readonly entryId: string; readonly label: string; readonly kind: string }>
  >,
): void {
  const cps = Array.from(entry.char);
  if (cps.length !== 1) {
    findings.push({
      id: 'F02',
      severity: 'ERROR',
      entryId: entry.id,
      field: 'char',
      title: `Kunci karakter pada space "${entry.label}" harus tepat 1 codepoint`,
      message: `Entri space memiliki ${cps.length} codepoint, padahal SpaceProvider$Definition memetakan 1 codepoint ke 1 float.`,
      fixHint: 'Isi tepat satu karakter Unicode PUA (misalnya \\uE2F0).',
      docRef: 'docs/knowledge/font-dan-glyph.md §1B',
    });
  } else {
    const cp = cps[0]!.codePointAt(0)!;
    const list = codepointOwners.get(cp);
    const owner = { entryId: entry.id, label: entry.label, kind: 'space' };
    if (list) list.push(owner);
    else codepointOwners.set(cp, [owner]);
  }

  if (!Number.isFinite(entry.advance)) {
    findings.push({
      id: 'F07',
      severity: 'ERROR',
      entryId: entry.id,
      field: 'advance',
      title: `Nilai advance pada "${entry.label}" bukan bilangan valid`,
      message: `Advance bernilai ${String(entry.advance)}. SpaceProvider$Definition menerima bilangan float berhingga.`,
      fixHint: 'Masukkan angka float seperti -1, -4, atau 0.5.',
      docRef: 'docs/knowledge/font-dan-glyph.md §1B',
    });
    return;
  }

  if (entry.advance < 0 || entry.advance > 32) {
    findings.push({
      id: 'F07',
      severity: 'INFO',
      entryId: entry.id,
      field: 'advance',
      title: `Advance space ${entry.advance} pada "${entry.label}" dilewati mode nonFishyGlyphs`,
      message: `Codec SpaceProvider menerima float bebas termasuk ${entry.advance} (sah pada render normal anyGlyphs), namun FontSet.hasFishyAdvance menganggap advance < 0 atau > 32 sebagai fishy pada teks obfuscated &k.`,
      fixHint:
        'Tidak perlu diubah untuk negative space rank/GUI normal; pastikan glyph tidak dipakai bersama kode warna &k.',
      docRef: 'docs/knowledge/font-dan-glyph.md §1B',
    });
  }
}

export function buildSampleLuckPermsCommand(project: FontProject): string {
  const prefixChars = resolveProjectPrefixString(project);
  const group = project.luckPermsGroup.trim() || 'default';
  const weight = Number.isInteger(project.luckPermsWeight)
    ? project.luckPermsWeight
    : 100;
  return `/lp group ${group} meta setprefix ${weight} "${prefixChars}"`;
}
