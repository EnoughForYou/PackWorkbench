import { computed, ref, shallowRef, watch } from 'vue';
import { defineStore, acceptHMRUpdate } from 'pinia';
import {
  buildFontResourcePack,
  buildPluginDistributionZip,
  type BuiltFontPackResult,
} from '@core/font/packBuilder.ts';
import { decodePngRgba } from '@core/font/pngCodec.ts';
import {
  RANK_PRESET_TEMPLATES,
  createInitialFontProject,
  createRankBitmapEntry,
  createSpaceEntry,
  createUploadedPngEntry,
} from '@core/font/presets.ts';
import { evaluateFontProject } from '@core/font/rules/fontRules.ts';
import type {
  DecodedRgbaImage,
  FontProject,
  FontProjectEntry,
  FontValidationResult,
  PaintEditMap,
  PreviewContext,
} from '@core/font/types.ts';
import {
  buildValidationReportFromInspection,
  validateResourcePackZip,
} from '@core/report.ts';
import { computeSha1ChunkedHex } from '@core/sha1Stream.ts';
import type { TargetVersionId, ValidationReport } from '@core/types.ts';
import { extractNestedZipEntry } from '@core/zipReader.ts';
import type {
  Sha1WorkerRequest,
  Sha1WorkerResponse,
} from '@workers/sha1.worker.ts';

export type StudioMode = 'font' | 'validator';
export type CanvasTool = 'select' | 'pencil' | 'eraser' | 'eyedropper';
export type CenterStageMode = 'canvas' | 'preview' | 'split';
export type InspectorTab = 'properties' | 'layers' | 'validate';
export type ComposerSubTab = 'text' | 'icon' | 'frame';
export type StudioQuickAction = 'open' | 'new-rank' | 'import-png' | 'new-space';
export type PreviewBackdropMode = 'world' | 'solid' | 'custom';

export interface Sha1ProgressState {
  readonly status: 'idle' | 'hashing' | 'done' | 'error';
  readonly ratio: number;
  readonly bytesRead: number;
  readonly totalBytes: number;
  readonly sha1Hex: string | null;
  readonly errorMessage?: string;
}

export interface RecentProjectItem {
  readonly name: string;
  readonly savedAt: number;
  readonly entryCount: number;
  readonly data?: string;
}

export const AUTOSAVE_STORAGE_KEY = 'pack-workbench-autosave';
export const RECENT_STORAGE_KEY = 'pack-workbench-recent';

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return typeof window.localStorage !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function serializeFontProject(project: FontProject): string {
  return JSON.stringify(project, (_key, value) => {
    if (value instanceof Uint8Array) {
      return { __type: 'Uint8Array', bytes: Array.from(value) };
    }
    return value;
  });
}

export function deserializeFontProject(raw: string): FontProject | null {
  try {
    const parsed = JSON.parse(raw, (_key, value) => {
      if (
        value &&
        typeof value === 'object' &&
        value.__type === 'Uint8Array' &&
        Array.isArray(value.bytes)
      ) {
        return new Uint8Array(value.bytes);
      }
      return value;
    });
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.entries) &&
      typeof parsed.targetVersion === 'string'
    ) {
      return parsed as FontProject;
    }
    return null;
  } catch {
    return null;
  }
}

interface PaintUndoRecord {
  readonly entryId: string;
  readonly previousPaintEdits: PaintEditMap;
}

const INITIAL_SHA1_STATE: Sha1ProgressState = {
  status: 'idle',
  ratio: 0,
  bytesRead: 0,
  totalBytes: 0,
  sha1Hex: null,
};

const INITIAL_VALIDATION: FontValidationResult = {
  findings: [],
  errors: 0,
  warns: 0,
  infos: 0,
  metricsByEntryId: {},
  decodeErrorsByEntryId: {},
};

export const STORAGE_KEY_INSPECTOR_COLLAPSED = 'pack-workbench-inspector-collapsed';

function getStoredInspectorCollapsed(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  try {
    return localStorage.getItem(STORAGE_KEY_INSPECTOR_COLLAPSED) === 'true';
  } catch {
    return false;
  }
}

export const useWorkbenchStore = defineStore('workbench', () => {
  // Active workspace mode inside /studio
  const studioMode = ref<StudioMode>('font');

  // Phase 2 Font/Rank Studio project state
  const fontProject = ref<FontProject>(createInitialFontProject());
  const selectedStudioEntryId = ref<string>(
    fontProject.value.entries[0]?.id ?? '',
  );
  const activeTool = ref<CanvasTool>('select');
  const brushColor = ref<string>('#9b73be');
  const showGrid = ref<boolean>(true);
  const pixelGrid = computed({
    get: () => showGrid.value,
    set: (val: boolean) => {
      showGrid.value = val;
    },
  });
  const stageMode = ref<CenterStageMode>('canvas');
  const zoom = ref<number>(12);
  const inspectorTab = ref<InspectorTab>('properties');
  const inspectorCollapsed = ref<boolean>(getStoredInspectorCollapsed());
  const composerSubTab = ref<ComposerSubTab>('text');
  const previewBackdropMode = ref<PreviewBackdropMode>('world');
  const customBackdropUrl = ref<string | null>(null);

  const decodedUploads = shallowRef<Map<string, DecodedRgbaImage>>(new Map());
  const validation = shallowRef<FontValidationResult>(INITIAL_VALIDATION);
  const undoStack = ref<readonly PaintUndoRecord[]>([]);
  const redoStack = ref<readonly PaintUndoRecord[]>([]);
  const copiedColorToast = ref<{ readonly hex: string; readonly ok: boolean } | null>(null);
  let copyColorTimer: number | null = null;

  const isExporting = ref<boolean>(false);
  const isExportingPluginBundle = ref<boolean>(false);
  const exportSha1State = ref<Sha1ProgressState>(INITIAL_SHA1_STATE);
  const lastBuiltPack = shallowRef<BuiltFontPackResult | null>(null);

  // Phase 1 Pack Validator state
  const activeFile = shallowRef<File | null>(null);
  const selectedVersion = ref<TargetVersionId>(fontProject.value.targetVersion);
  const isValidating = ref<boolean>(false);
  const report = shallowRef<ValidationReport | null>(null);
  const sha1State = ref<Sha1ProgressState>(INITIAL_SHA1_STATE);

  // Dedicated SHA-1 Web Worker handles (validator + export)
  let validatorWorker: Worker | null = null;
  let exportWorker: Worker | null = null;
  let validatorJobId = 0;
  let exportJobId = 0;
  let fontEvalSequence = 0;

  const selectedEntry = computed(
    () =>
      fontProject.value.entries.find((e) => e.id === selectedStudioEntryId.value) ??
      fontProject.value.entries[0],
  );

  // Map-based memoization cache for uploaded PNG decoding: avoids redundant decoding on stroke edits
  interface CachedPngDecode {
    readonly bytes: Uint8Array;
    readonly image: DecodedRgbaImage;
  }
  const pngDecodeCache = new Map<string, CachedPngDecode>();

  // Asynchronous PNG decoding with Map-based memoization + F01-F10 validation watcher
  watch(
    fontProject,
    (proj) => {
      const seq = ++fontEvalSequence;
      void (async () => {
        const nextMap = new Map<string, DecodedRgbaImage>();
        const activeUploadIds = new Set<string>();

        for (const entry of proj.entries) {
          if (
            entry.kind === 'bitmap' &&
            entry.sourceMode === 'uploaded-png' &&
            entry.uploadedPngBytes
          ) {
            activeUploadIds.add(entry.id);
            const cached = pngDecodeCache.get(entry.id);
            if (cached && cached.bytes === entry.uploadedPngBytes) {
              nextMap.set(entry.id, cached.image);
            } else {
              const res = await decodePngRgba(entry.uploadedPngBytes);
              if (res.ok) {
                pngDecodeCache.set(entry.id, {
                  bytes: entry.uploadedPngBytes,
                  image: res.image,
                });
                nextMap.set(entry.id, res.image);
              }
            }
          }
        }

        // Clean up evicted entries from memo cache
        for (const id of pngDecodeCache.keys()) {
          if (!activeUploadIds.has(id)) {
            pngDecodeCache.delete(id);
          }
        }

        if (seq !== fontEvalSequence) return;
        decodedUploads.value = nextMap;

        const valResult = await evaluateFontProject(proj, {
          predecodedUploads: nextMap,
        });
        if (seq === fontEvalSequence) {
          validation.value = valResult;
        }
      })();
    },
    { immediate: true },
  );

  function initWorkers(): () => void {
    if (typeof Worker === 'undefined') {
      return () => {};
    }

    if (!validatorWorker) {
      validatorWorker = new Worker(
        new URL('../../src/workers/sha1.worker.ts', import.meta.url),
        { type: 'module' },
      );
      validatorWorker.addEventListener(
        'message',
        (event: MessageEvent<Sha1WorkerResponse>) => {
          const msg = event.data;
          if (!msg || msg.jobId !== validatorJobId) return;
          if (msg.type === 'progress') {
            sha1State.value = {
              ...sha1State.value,
              status: 'hashing',
              ratio: msg.ratio,
              bytesRead: msg.bytesRead,
              totalBytes: msg.totalBytes,
            };
          } else if (msg.type === 'done') {
            sha1State.value = {
              ...sha1State.value,
              status: 'done',
              ratio: 1,
              bytesRead: sha1State.value.totalBytes,
              sha1Hex: msg.sha1Hex,
            };
          } else if (msg.type === 'error') {
            sha1State.value = {
              ...sha1State.value,
              status: 'error',
              sha1Hex: null,
              errorMessage: msg.message,
            };
          }
        },
      );
    }

    if (!exportWorker) {
      exportWorker = new Worker(
        new URL('../../src/workers/sha1.worker.ts', import.meta.url),
        { type: 'module' },
      );
      exportWorker.addEventListener(
        'message',
        (event: MessageEvent<Sha1WorkerResponse>) => {
          const msg = event.data;
          if (!msg || msg.jobId !== exportJobId) return;
          if (msg.type === 'progress') {
            exportSha1State.value = {
              ...exportSha1State.value,
              status: 'hashing',
              ratio: msg.ratio,
              bytesRead: msg.bytesRead,
              totalBytes: msg.totalBytes,
            };
          } else if (msg.type === 'done') {
            exportSha1State.value = {
              ...exportSha1State.value,
              status: 'done',
              ratio: 1,
              bytesRead: exportSha1State.value.totalBytes,
              sha1Hex: msg.sha1Hex,
            };
          } else if (msg.type === 'error') {
            exportSha1State.value = {
              ...exportSha1State.value,
              status: 'error',
              errorMessage: msg.message,
            };
          }
        },
      );
    }

    return () => {
      validatorWorker?.terminate();
      validatorWorker = null;
      exportWorker?.terminate();
      exportWorker = null;
    };
  }

  function handleVersionChange(nextVersion: TargetVersionId): void {
    selectedVersion.value = nextVersion;
    fontProject.value = { ...fontProject.value, targetVersion: nextVersion };
    if (report.value) {
      report.value = buildValidationReportFromInspection(
        report.value.zipInspection,
        nextVersion,
      );
    }
  }

  function handleFileSelected(file: File): void {
    const jobId = ++validatorJobId;
    activeFile.value = file;
    isValidating.value = true;
    sha1State.value = {
      status: 'hashing',
      ratio: 0,
      bytesRead: 0,
      totalBytes: file.size,
      sha1Hex: null,
    };

    if (validatorWorker) {
      const request: Sha1WorkerRequest = { type: 'hash', jobId, file };
      validatorWorker.postMessage(request);
    }

    void (async () => {
      try {
        const buffer = await file.arrayBuffer();
        if (jobId !== validatorJobId) return;

        const rawReport = await validateResourcePackZip({
          fileName: file.name,
          fileSizeBytes: file.size,
          data: buffer,
        });
        if (jobId !== validatorJobId) return;

        const currentChoice = selectedVersion.value;
        const nextReport =
          rawReport.autoDetectedTarget !== null
            ? rawReport
            : currentChoice === rawReport.targetVersion
              ? rawReport
              : buildValidationReportFromInspection(
                  rawReport.zipInspection,
                  currentChoice,
                );

        selectedVersion.value = nextReport.targetVersion;
        fontProject.value = {
          ...fontProject.value,
          targetVersion: nextReport.targetVersion,
        };
        report.value = nextReport;

        if (!validatorWorker) {
          const sha1Hex = computeSha1ChunkedHex(
            new Uint8Array(buffer),
            undefined,
            (ratio) => {
              if (jobId === validatorJobId) {
                sha1State.value = {
                  status: 'hashing',
                  ratio,
                  bytesRead: Math.round(ratio * file.size),
                  totalBytes: file.size,
                  sha1Hex: null,
                };
              }
            },
          );
          if (jobId === validatorJobId) {
            sha1State.value = {
              status: 'done',
              ratio: 1,
              bytesRead: file.size,
              totalBytes: file.size,
              sha1Hex,
            };
          }
        }
      } catch (err) {
        if (jobId !== validatorJobId) return;
        const detail = err instanceof Error ? err.message : String(err);
        report.value = buildValidationReportFromInspection(
          {
            validZip: false,
            parseError: detail,
            fileName: file.name,
            fileSizeBytes: file.size,
            entries: [],
            hasRootMcmeta: false,
            wrapperFolder: null,
            packPrefix: '',
            mcmetaRawText: null,
            pluginBundle: {
              ecosystems: [],
              nestedZipPaths: [],
              itemsAdderPaths: [],
              oraxenPaths: [],
              nexoPaths: [],
            },
            fontAudit: {
              fontJsonFiles: [],
              missingTextures: [],
              negativeHeightProviders: [],
              nonPuaChars: [],
            },
          },
          selectedVersion.value,
        );
        if (!validatorWorker) {
          sha1State.value = {
            ...sha1State.value,
            status: 'error',
            errorMessage: detail,
          };
        }
      } finally {
        if (jobId === validatorJobId) {
          isValidating.value = false;
        }
      }
    })();
  }

  function updateProject(updater: (prev: FontProject) => FontProject): void {
    fontProject.value = updater(fontProject.value);
  }

  function updateEntry(
    entryId: string,
    updater: (prev: FontProjectEntry) => FontProjectEntry,
  ): void {
    fontProject.value = {
      ...fontProject.value,
      entries: fontProject.value.entries.map((item) =>
        item.id === entryId ? updater(item) : item,
      ),
    };
  }

  function paintPixels(
    entryId: string,
    updates: Readonly<Record<string, string | null>>,
    pushHistory: boolean,
  ): void {
    if (pushHistory) {
      const target = fontProject.value.entries.find((e) => e.id === entryId);
      if (target && target.kind === 'bitmap') {
        undoStack.value = [
          ...undoStack.value.slice(-29),
          { entryId, previousPaintEdits: target.paintEdits },
        ];
        redoStack.value = [];
      }
    }
    fontProject.value = {
      ...fontProject.value,
      entries: fontProject.value.entries.map((item) =>
        item.id === entryId && item.kind === 'bitmap'
          ? { ...item, paintEdits: { ...item.paintEdits, ...updates } }
          : item,
      ),
    };
  }

  function undoPaint(): void {
    if (undoStack.value.length === 0) return;
    const last = undoStack.value[undoStack.value.length - 1]!;
    undoStack.value = undoStack.value.slice(0, -1);
    const currentTarget = fontProject.value.entries.find((e) => e.id === last.entryId);
    if (currentTarget && currentTarget.kind === 'bitmap') {
      redoStack.value = [
        ...redoStack.value.slice(-29),
        { entryId: last.entryId, previousPaintEdits: currentTarget.paintEdits },
      ];
    }
    fontProject.value = {
      ...fontProject.value,
      entries: fontProject.value.entries.map((item) =>
        item.id === last.entryId && item.kind === 'bitmap'
          ? { ...item, paintEdits: last.previousPaintEdits }
          : item,
      ),
    };
  }

  function redoPaint(): void {
    if (redoStack.value.length === 0) return;
    const next = redoStack.value[redoStack.value.length - 1]!;
    redoStack.value = redoStack.value.slice(0, -1);
    const currentTarget = fontProject.value.entries.find((e) => e.id === next.entryId);
    if (currentTarget && currentTarget.kind === 'bitmap') {
      undoStack.value = [
        ...undoStack.value.slice(-29),
        { entryId: next.entryId, previousPaintEdits: currentTarget.paintEdits },
      ];
    }
    fontProject.value = {
      ...fontProject.value,
      entries: fontProject.value.entries.map((item) =>
        item.id === next.entryId && item.kind === 'bitmap'
          ? { ...item, paintEdits: next.previousPaintEdits }
          : item,
      ),
    };
  }

  function copyColorHex(rawHex: string): void {
    const clean = rawHex.trim().startsWith('#')
      ? rawHex.trim().toUpperCase()
      : `#${rawHex.trim().toUpperCase()}`;

    void (async () => {
      let ok = false;
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        try {
          await navigator.clipboard.writeText(clean);
          ok = true;
        } catch {
          ok = false;
        }
      }
      if (!ok && typeof document !== 'undefined') {
        const ta = document.createElement('textarea');
        ta.value = clean;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        ta.style.pointerEvents = 'none';
        document.body.appendChild(ta);
        ta.select();
        try {
          ok = document.execCommand('copy');
        } catch {
          ok = false;
        } finally {
          document.body.removeChild(ta);
        }
      }

      copiedColorToast.value = { hex: clean, ok };
      if (typeof window !== 'undefined') {
        if (copyColorTimer !== null) {
          window.clearTimeout(copyColorTimer);
        }
        copyColorTimer = window.setTimeout(() => {
          copiedColorToast.value = null;
        }, 1800);
      }
    })();
  }

  function addRank(): void {
    const current = fontProject.value;
    const idx = current.entries.length + 1;
    const id = `rank-${Date.now()}-${idx}`;
    const newEntry = createRankBitmapEntry(current.entries, {
      id,
      label: `RANK${idx}`,
      namespace: current.namespace,
      slug: `rank_${idx}`,
      composer: { text: `RANK${idx}` },
    });
    fontProject.value = {
      ...current,
      entries: [...current.entries, newEntry],
    };
    selectedStudioEntryId.value = id;
    inspectorTab.value = 'properties';
  }

  function addRankFromTemplate(templateId: string): void {
    const tpl = RANK_PRESET_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) {
      addRank();
      return;
    }
    const current = fontProject.value;
    const suffix = current.entries.length + 1;
    const id = `rank-${tpl.id}-${Date.now()}`;
    const slugCount = current.entries.filter((e) =>
      e.kind === 'bitmap' && e.fileRef.includes(`rank_${tpl.slug}`),
    ).length;
    const slug = slugCount > 0 ? `${tpl.slug}_${suffix}` : tpl.slug;
    const newEntry = createRankBitmapEntry(current.entries, {
      id,
      label: tpl.label,
      namespace: current.namespace,
      slug,
      composer: tpl.composer,
      height: tpl.height ?? 9,
      ascent: tpl.ascent ?? 8,
    });
    fontProject.value = {
      ...current,
      entries: [...current.entries, newEntry],
    };
    selectedStudioEntryId.value = id;
    inspectorTab.value = 'properties';
  }

  function splitEntryToIconAndRank(entryId: string): void {
    const current = fontProject.value;
    const target = current.entries.find((e) => e.id === entryId);
    if (!target || target.kind !== 'bitmap' || target.sourceMode !== 'composer') {
      return;
    }
    if (target.composer.iconId === 'none') return;

    const baseSlug = target.label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'rank';
    const stamp = Date.now();
    const iconId = `${target.id}-icon-${stamp}`;
    const rankId = `${target.id}-text-${stamp}`;
    const iconNoFrame = target.composer.splitIconFrame === 'none';
    const gapAfterIcon = Math.max(0, target.composer.iconGap - 1);

    const iconEntry = createRankBitmapEntry(current.entries, {
      id: iconId,
      label: `${target.label} Icon`,
      namespace: current.namespace,
      slug: `${baseSlug}_icon_${stamp}`,
      height: target.height,
      ascent: target.ascent,
      spaceLeft: target.spaceLeft,
      spaceRight: gapAfterIcon,
      composer: {
        ...target.composer,
        text: '',
        badgeLayout: 'unified',
        frameStyle: iconNoFrame ? 'none' : target.composer.frameStyle,
        frameColor: target.composer.splitIconFrameColor ?? target.composer.frameColor,
        frameBorderColor:
          target.composer.splitIconBorderColor ?? target.composer.frameBorderColor,
      },
    });
    const iconOnlyEntry = {
      ...iconEntry,
      layerOrder: target.layerOrder ? [...target.layerOrder] : iconEntry.layerOrder,
      layerStyles: target.layerStyles ? { ...target.layerStyles } : iconEntry.layerStyles,
      layerVisibility: {
        ...target.layerVisibility,
        frame: iconNoFrame ? false : target.layerVisibility.frame,
        text: false,
        icon: true,
      },
    };

    const rankTextEntry = createRankBitmapEntry(
      [...current.entries, iconOnlyEntry],
      {
        id: rankId,
        label: `${target.label} Rank`,
        namespace: current.namespace,
        slug: `${baseSlug}_label_${stamp}`,
        height: target.height,
        ascent: target.ascent,
        spaceLeft: 0,
        spaceRight: target.spaceRight,
        composer: {
          ...target.composer,
          iconId: 'none',
          badgeLayout: 'unified',
        },
      },
    );
    const textOnlyEntry = {
      ...rankTextEntry,
      layerOrder: target.layerOrder ? [...target.layerOrder] : rankTextEntry.layerOrder,
      layerStyles: target.layerStyles ? { ...target.layerStyles } : rankTextEntry.layerStyles,
      layerVisibility: {
        ...target.layerVisibility,
        icon: false,
        text: true,
      },
    };

    const nextEntries = [...current.entries, iconOnlyEntry, textOnlyEntry];
    const hasOriginalInSeq = current.prefixSequenceIds.includes(target.id);
    const nextSequence = hasOriginalInSeq
      ? current.prefixSequenceIds.flatMap((id) =>
          id === target.id ? [iconOnlyEntry.id, textOnlyEntry.id] : [id],
        )
      : [...current.prefixSequenceIds, iconOnlyEntry.id, textOnlyEntry.id];

    fontProject.value = {
      ...current,
      entries: nextEntries,
      prefixSequenceIds: nextSequence,
    };
    selectedStudioEntryId.value = iconOnlyEntry.id;
  }

  function setSoloPrefixEntry(entryId: string): void {
    const exists = fontProject.value.entries.some((e) => e.id === entryId);
    if (!exists) return;
    fontProject.value = {
      ...fontProject.value,
      prefixSequenceIds: [entryId],
    };
  }

  function addSpace(): void {
    const current = fontProject.value;
    const idx = current.entries.length + 1;
    const id = `space-${Date.now()}-${idx}`;
    const newEntry = createSpaceEntry(current.entries, {
      id,
      label: 'Space -2px',
      advance: -2,
    });
    fontProject.value = {
      ...current,
      entries: [...current.entries, newEntry],
    };
    selectedStudioEntryId.value = id;
    inspectorTab.value = 'properties';
  }

  function uploadPngFile(file: File): void {
    void (async () => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const current = fontProject.value;
      const id = `png-${Date.now()}`;
      const label = file.name.replace(/\.png$/i, '') || 'Sprite';
      const newEntry = createUploadedPngEntry(current.entries, {
        id,
        label,
        namespace: current.namespace,
        fileName: file.name,
        bytes,
      });
      fontProject.value = {
        ...current,
        entries: [...current.entries, newEntry],
      };
      selectedStudioEntryId.value = id;
      inspectorTab.value = 'properties';
    })();
  }

  function replaceEntryPng(entryId: string, file: File): void {
    void (async () => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      undoStack.value = undoStack.value.filter((rec) => rec.entryId !== entryId);
      fontProject.value = {
        ...fontProject.value,
        entries: fontProject.value.entries.map((item) =>
          item.id === entryId && item.kind === 'bitmap'
            ? {
                ...item,
                sourceMode: 'uploaded-png',
                uploadedPngBytes: bytes,
                uploadedPngFileName: file.name,
                paintEdits: {},
              }
            : item,
        ),
      };
    })();
  }

  function removeEntry(id: string): void {
    const nextEntries = fontProject.value.entries.filter((e) => e.id !== id);
    if (selectedStudioEntryId.value === id && nextEntries[0]) {
      selectedStudioEntryId.value = nextEntries[0].id;
    }
    undoStack.value = undoStack.value.filter((rec) => rec.entryId !== id);
    fontProject.value = {
      ...fontProject.value,
      entries: nextEntries,
      prefixSequenceIds: fontProject.value.prefixSequenceIds.filter((s) => s !== id),
    };
  }

  function togglePrefixEntry(id: string): void {
    const current = fontProject.value;
    const exists = current.prefixSequenceIds.includes(id);
    fontProject.value = {
      ...current,
      prefixSequenceIds: exists
        ? current.prefixSequenceIds.filter((s) => s !== id)
        : [...current.prefixSequenceIds, id],
    };
  }

  function setGuiScale(scale: 1 | 2 | 3 | 4): void {
    fontProject.value = { ...fontProject.value, guiScale: scale };
  }

  function toggleForceUnicode(): void {
    fontProject.value = {
      ...fontProject.value,
      forceUnicode: !fontProject.value.forceUnicode,
    };
  }

  function setPreviewContext(ctx: PreviewContext): void {
    fontProject.value = { ...fontProject.value, previewContext: ctx };
  }

  function setSampleChatText(text: string): void {
    fontProject.value = { ...fontProject.value, sampleChatText: text };
  }

  function setPreviewBackdropMode(mode: PreviewBackdropMode): void {
    if (mode === 'custom' && !customBackdropUrl.value) {
      previewBackdropMode.value = 'world';
      return;
    }
    previewBackdropMode.value = mode;
  }

  function setCustomBackdropFile(file: File): void {
    if (typeof URL === 'undefined') return;
    if (customBackdropUrl.value) {
      URL.revokeObjectURL(customBackdropUrl.value);
    }
    customBackdropUrl.value = URL.createObjectURL(file);
    previewBackdropMode.value = 'custom';
  }

  function clearCustomBackdropFile(): void {
    if (typeof URL !== 'undefined' && customBackdropUrl.value) {
      URL.revokeObjectURL(customBackdropUrl.value);
    }
    customBackdropUrl.value = null;
    if (previewBackdropMode.value === 'custom') {
      previewBackdropMode.value = 'world';
    }
  }

  function triggerZipBrowserDownload(bytes: Uint8Array, fileName: string): Blob {
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const blob = new Blob([copy], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return blob;
  }

  function inspectNestedZip(nestedPath: string): void {
    const parentFile = activeFile.value;
    if (!parentFile) return;

    void (async () => {
      const parentBytes = await parentFile.arrayBuffer();
      const extracted = await extractNestedZipEntry(parentBytes, nestedPath);
      if (!extracted) return;

      const copy = new Uint8Array(extracted.byteLength);
      copy.set(extracted);
      const baseName = nestedPath.split('/').pop() || 'nested-pack.zip';
      const innerFile = new File([copy], baseName, { type: 'application/zip' });
      handleFileSelected(innerFile);
    })();
  }

  function exportAndDownload(): void {
    if (validation.value.errors > 0) {
      inspectorTab.value = 'validate';
      return;
    }

    void (async () => {
      isExporting.value = true;
      inspectorTab.value = 'validate';
      try {
        const built = await buildFontResourcePack(fontProject.value);
        lastBuiltPack.value = built;

        const jobId = ++exportJobId;
        const zipCopy = new Uint8Array(built.zipBytes.byteLength);
        zipCopy.set(built.zipBytes);
        const zipBuffer = zipCopy.buffer;

        if (exportWorker) {
          exportSha1State.value = {
            status: 'hashing',
            ratio: 0,
            bytesRead: 0,
            totalBytes: zipBuffer.byteLength,
            sha1Hex: null,
          };
          exportWorker.postMessage(
            {
              type: 'hash-buffer',
              jobId,
              buffer: zipBuffer,
            } satisfies Sha1WorkerRequest,
            [zipBuffer as ArrayBuffer],
          );
        } else {
          exportSha1State.value = {
            status: 'done',
            ratio: 1,
            bytesRead: built.zipBytes.byteLength,
            totalBytes: built.zipBytes.byteLength,
            sha1Hex: built.sha1Hex,
          };
        }

        if (
          built.fontValidation.errors === 0 &&
          built.zipValidation.summary.errors === 0
        ) {
          triggerZipBrowserDownload(built.zipBytes, built.fileName);
        }
      } finally {
        isExporting.value = false;
      }
    })();
  }

  function exportPluginBundleAndDownload(): void {
    if (validation.value.errors > 0) {
      inspectorTab.value = 'validate';
      return;
    }

    void (async () => {
      isExportingPluginBundle.value = true;
      inspectorTab.value = 'validate';
      try {
        const bundle = await buildPluginDistributionZip(fontProject.value);
        triggerZipBrowserDownload(bundle.zipBytes, bundle.fileName);
      } finally {
        isExportingPluginBundle.value = false;
      }
    })();
  }

  const recentProjects = ref<readonly RecentProjectItem[]>([]);
  let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

  function loadRecentProjectsFromStorage(): RecentProjectItem[] {
    const storage = getLocalStorage();
    if (!storage) return [];
    try {
      const raw = storage.getItem(RECENT_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 5);
      }
      return [];
    } catch {
      return [];
    }
  }

  function saveProjectToStorage(): void {
    const storage = getLocalStorage();
    if (!storage) return;
    if (fontProject.value.entries.length === 0) return;

    try {
      const serialized = serializeFontProject(fontProject.value);
      storage.setItem(AUTOSAVE_STORAGE_KEY, serialized);

      const baseName = fontProject.value.packDescription?.trim()
        ? fontProject.value.packDescription.trim()
        : (fontProject.value.namespace ? `${fontProject.value.namespace}.zip` : 'MyPack.zip');
      const projectName = baseName.endsWith('.zip') ? baseName : `${baseName}.zip`;

      const newRecent: RecentProjectItem = {
        name: projectName,
        savedAt: Date.now(),
        entryCount: fontProject.value.entries.length,
        data: serialized,
      };

      const currentRecent = loadRecentProjectsFromStorage();
      const filtered = currentRecent.filter((p) => p.name !== newRecent.name);
      const updatedRecent = [newRecent, ...filtered].slice(0, 5);

      storage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updatedRecent));
      recentProjects.value = updatedRecent;
    } catch (err) {
      console.warn('Gagal menyimpan otomatis ke localStorage:', err);
    }
  }

  function debouncedAutosave(): void {
    const storage = getLocalStorage();
    if (!storage) return;
    if (fontProject.value.entries.length === 0) return;

    if (autosaveTimer !== null) {
      clearTimeout(autosaveTimer);
    }

    autosaveTimer = setTimeout(() => {
      saveProjectToStorage();
      autosaveTimer = null;
    }, 30000);
  }

  function restoreAutosave(): boolean {
    const storage = getLocalStorage();
    if (!storage) return false;
    try {
      const raw = storage.getItem(AUTOSAVE_STORAGE_KEY);
      if (!raw) return false;
      const restored = deserializeFontProject(raw);
      if (restored && Array.isArray(restored.entries) && restored.entries.length > 0) {
        fontProject.value = restored;
        selectedStudioEntryId.value = restored.entries[0]?.id ?? '';
        return true;
      }
    } catch (e) {
      console.warn('Gagal memulihkan proyek dari localStorage:', e);
    }
    return false;
  }

  function loadRecentProject(item: RecentProjectItem): void {
    if (item.data) {
      const parsed = deserializeFontProject(item.data);
      if (parsed && Array.isArray(parsed.entries) && parsed.entries.length > 0) {
        fontProject.value = parsed;
        selectedStudioEntryId.value = parsed.entries[0]?.id ?? '';
        saveProjectToStorage();
        return;
      }
    }
    restoreAutosave();
  }

  function closeProject(): void {
    if (autosaveTimer !== null) {
      clearTimeout(autosaveTimer);
      autosaveTimer = null;
    }
    fontProject.value = {
      ...fontProject.value,
      entries: [],
      prefixSequenceIds: [],
    };
    selectedStudioEntryId.value = '';
    const storage = getLocalStorage();
    if (storage) {
      storage.removeItem(AUTOSAVE_STORAGE_KEY);
    }
  }

  function createNewProject(namespace = 'mypack'): void {
    const initial = createInitialFontProject();
    const firstTpl = RANK_PRESET_TEMPLATES[0]!;
    const rankEntry = createRankBitmapEntry([], {
      id: `rank-${firstTpl.id}-${Date.now()}`,
      label: firstTpl.label,
      namespace,
      slug: firstTpl.slug,
      composer: firstTpl.composer,
    });
    fontProject.value = {
      ...initial,
      namespace,
      entries: [rankEntry],
      prefixSequenceIds: [rankEntry.id],
    };
    selectedStudioEntryId.value = rankEntry.id;
    inspectorTab.value = 'properties';
    saveProjectToStorage();
  }

  // Restore autosave and load recent projects on store initialization (if in browser)
  const initialStorage = getLocalStorage();
  if (initialStorage) {
    recentProjects.value = loadRecentProjectsFromStorage();
    restoreAutosave();
  }

  // Watch fontProject to trigger debounced autosave (30s)
  watch(
    () => fontProject.value,
    () => {
      debouncedAutosave();
    },
    { deep: true },
  );

  // Sinkronisasi status inspectorCollapsed ke localStorage browser
  watch(inspectorCollapsed, (val) => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_INSPECTOR_COLLAPSED, String(val));
      } catch {
        // Abaikan pembatasan kuota atau sandbox localStorage pada mode peramban privat
      }
    }
  });

  function toggleInspectorCollapsed(): void {
    inspectorCollapsed.value = !inspectorCollapsed.value;
  }

  function setInspectorCollapsed(val: boolean): void {
    inspectorCollapsed.value = val;
  }

  return {
    studioMode,
    fontProject,
    selectedStudioEntryId,
    selectedEntry,
    activeTool,
    brushColor,
    showGrid,
    pixelGrid,
    stageMode,
    zoom,
    inspectorTab,
    inspectorCollapsed,
    toggleInspectorCollapsed,
    setInspectorCollapsed,
    composerSubTab,
    previewBackdropMode,
    customBackdropUrl,
    decodedUploads,
    validation,
    undoStack,
    redoStack,
    copiedColorToast,
    isExporting,
    isExportingPluginBundle,
    exportSha1State,
    lastBuiltPack,
    activeFile,
    selectedVersion,
    isValidating,
    report,
    sha1State,
    recentProjects,
    saveProjectToStorage,
    restoreAutosave,
    loadRecentProject,
    closeProject,
    createNewProject,
    debouncedAutosave,
    initWorkers,
    handleVersionChange,
    handleFileSelected,
    inspectNestedZip,
    updateProject,
    updateEntry,
    paintPixels,
    undoPaint,
    redoPaint,
    copyColorHex,
    addRank,
    addRankFromTemplate,
    splitEntryToIconAndRank,
    addSpace,
    uploadPngFile,
    replaceEntryPng,
    removeEntry,
    togglePrefixEntry,
    setSoloPrefixEntry,
    setGuiScale,
    toggleForceUnicode,
    setPreviewContext,
    setSampleChatText,
    setPreviewBackdropMode,
    setCustomBackdropFile,
    clearCustomBackdropFile,
    exportAndDownload,
    exportPluginBundleAndDownload,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWorkbenchStore, import.meta.hot));
}
