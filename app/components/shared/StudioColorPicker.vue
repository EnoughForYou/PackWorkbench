<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import iroPackage from '@jaames/iro';
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
} from 'reka-ui';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCheck, faCopy } from '@fortawesome/free-solid-svg-icons';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';

// Interop for CJS / ESM bundlers
const iro: any = (iroPackage as any).default || iroPackage;

interface Props {
  readonly modelValue?: string;
  readonly defaultValue?: string;
  readonly disabled?: boolean;
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
  readonly sideOffset?: number;
  readonly align?: 'start' | 'center' | 'end';
  readonly triggerClass?: string;
  readonly contentClass?: string;
  readonly ariaLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  defaultValue: '#9b73be',
  disabled: false,
  side: 'right',
  sideOffset: 6,
  align: 'center',
  triggerClass: '',
  contentClass: '',
  ariaLabel: 'Pilih warna',
});

const emits = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
}>();

const MINECRAFT_SWATCHES = [
  { hex: '#ffffff', label: 'Putih (Vanilla)' },
  { hex: '#9b73be', label: 'Ungu Studio (Aksen)' },
  { hex: '#f59e0b', label: 'Emas (VIP)' },
  { hex: '#22c55e', label: 'Zamrud (Member)' },
  { hex: '#38bdf8', label: 'Berlian (MVP)' },
  { hex: '#ef4444', label: 'Merah (Admin)' },
  { hex: '#1e1f29', label: 'Obsidian (Dark Canvas)' },
  { hex: '#a855f7', label: 'Amethyst (Mythic)' },
  { hex: '#f97316', label: 'Oranye (Hero)' },
  { hex: '#10b981', label: 'Mint / Mod' },
  { hex: '#64748b', label: 'Batu / Netral' },
  { hex: '#000000', label: 'Hitam Pekat' },
] as const;

const isOpen = ref(false);
const pickerContainerRef = ref<HTMLDivElement | null>(null);
let pickerInstance: any = null;
let isInternalSync = false;

const internalColor = computed<string>({
  get: () => props.modelValue ?? props.defaultValue,
  set: (val: string) => {
    emits('update:modelValue', val);
    emits('change', val);
  },
});

const hexInputValue = ref<string>(internalColor.value.toUpperCase());
const copied = ref<boolean>(false);
let copyResetTimer: number | null = null;

function initPicker(el: HTMLDivElement): void {
  if (typeof window === 'undefined') return;
  el.innerHTML = '';

  try {
    const ColorPickerCtor = iro.ColorPicker || iro;
    pickerInstance = new ColorPickerCtor(el, {
      width: 216,
      boxHeight: 110,
      sliderMargin: 10,
      borderWidth: 1,
      borderColor: '#3c3f54',
      handleRadius: 7,
      color: internalColor.value,
      layout: [
        {
          component: iro.ui.Box,
          options: {
            boxHeight: 110,
          },
        },
        {
          component: iro.ui.Slider,
          options: {
            sliderType: 'hue',
            sliderShape: 'bar',
          },
        },
      ],
    });

    pickerInstance.on('color:change', (color: any) => {
      if (isInternalSync) return;
      const hex = String(color.hexString || '').toLowerCase();
      if (!hex) return;
      isInternalSync = true;
      internalColor.value = hex;
      hexInputValue.value = hex.toUpperCase();
      isInternalSync = false;
    });
  } catch (err) {
    // Graceful fallback if DOM or canvas is unavailable in SSR/headless
    console.warn('[StudioColorPicker] Gagal menginisialisasi @jaames/iro:', err);
  }
}

function destroyPicker(): void {
  pickerInstance = null;
}

watch(pickerContainerRef, (el) => {
  if (el) {
    void nextTick(() => {
      if (pickerContainerRef.value === el) {
        initPicker(el);
      }
    });
  } else {
    destroyPicker();
  }
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal || isInternalSync) return;
    hexInputValue.value = newVal.toUpperCase();
    if (pickerInstance && pickerInstance.color) {
      isInternalSync = true;
      try {
        pickerInstance.color.hexString = newVal;
      } catch {
        // Abaikan format hex parsial
      } finally {
        isInternalSync = false;
      }
    }
  },
);

function selectSwatch(hex: string): void {
  isInternalSync = true;
  internalColor.value = hex.toLowerCase();
  hexInputValue.value = hex.toUpperCase();
  if (pickerInstance && pickerInstance.color) {
    try {
      pickerInstance.color.hexString = hex;
    } catch {
      // Abaikan jika picker tidak mendukung
    }
  }
  isInternalSync = false;
}

function handleHexInput(e: Event): void {
  const target = e.target as HTMLInputElement;
  let val = target.value.trim();
  if (val && !val.startsWith('#')) {
    val = '#' + val;
  }
  hexInputValue.value = val.toUpperCase();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)) {
    isInternalSync = true;
    const normalized = val.length === 4
      ? `#${val[1]}${val[1]}${val[2]}${val[2]}${val[3]}${val[3]}`.toLowerCase()
      : val.toLowerCase();
    internalColor.value = normalized;
    if (pickerInstance && pickerInstance.color) {
      try {
        pickerInstance.color.hexString = normalized;
      } catch {
        //
      }
    }
    isInternalSync = false;
  }
}

async function copyHex(): Promise<void> {
  const hex = internalColor.value.toUpperCase();
  let ok = false;
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(hex);
      ok = true;
    } catch {
      ok = false;
    }
  }
  if (!ok && typeof document !== 'undefined') {
    const ta = document.createElement('textarea');
    ta.value = hex;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
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

  if (ok) {
    copied.value = true;
    if (copyResetTimer !== null) clearTimeout(copyResetTimer);
    copyResetTimer = window.setTimeout(() => {
      copied.value = false;
    }, 1500);
  }
}

onBeforeUnmount(() => {
  if (copyResetTimer !== null) {
    clearTimeout(copyResetTimer);
  }
  destroyPicker();
});
</script>

<template>
  <PopoverRoot v-model:open="isOpen">
    <PopoverTrigger as-child :disabled="props.disabled">
      <slot name="trigger" :color="internalColor" :open="isOpen">
        <slot :color="internalColor" :open="isOpen">
          <button
            type="button"
            :disabled="props.disabled"
            :class="cn('group relative h-7 w-7 cursor-pointer rounded-md border border-white/20 shadow-xs transition-[transform,border-color] duration-100 ease-out hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40', props.triggerClass)"
            :aria-label="props.ariaLabel"
          >
            <span
              aria-hidden="true"
              class="block h-full w-full rounded-[5px] shadow-inner"
              :style="{ backgroundColor: internalColor }"
            />
          </button>
        </slot>
      </slot>
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent
        :side="props.side"
        :side-offset="props.sideOffset"
        :align="props.align"
        :class="cn(
          'z-50 w-[240px] rounded-lg border border-border bg-card p-3 shadow-2xl outline-none select-none text-foreground',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          props.contentClass
        )"
      >
        <!-- Header: Title and Preview Chip -->
        <div class="mb-2 flex items-center justify-between border-b border-border pb-1.5">
          <span class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pemilih Warna
          </span>
          <div class="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              class="h-3.5 w-3.5 rounded-[3px] border border-white/30 shadow-xs"
              :style="{ backgroundColor: internalColor }"
            />
            <span class="font-mono text-[10px] font-medium tabular-nums text-foreground">
              {{ internalColor.toUpperCase() }}
            </span>
          </div>
        </div>

        <!-- iro.js ColorPicker mount container (SV Box + Hue Bar) -->
        <div
          ref="pickerContainerRef"
          class="flex items-center justify-center py-1"
        />

        <!-- Hex input and Copy button -->
        <div class="mt-2 flex items-center gap-1.5 border-t border-border pt-2">
          <div class="relative flex-1">
            <input
              type="text"
              maxlength="7"
              :value="hexInputValue"
              aria-label="Nilai warna format heksadesimal"
              class="h-7 w-full rounded border border-border bg-muted/70 px-2 font-mono text-[11px] font-semibold uppercase text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-2 focus-visible:outline-primary tabular-nums"
              @input="handleHexInput"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Salin nilai heksadesimal"
            class="h-7 px-2 font-mono text-[10px] gap-1 transition-[background-color,color,transform] active:scale-95"
            @click="copyHex"
          >
            <FontAwesomeIcon
              :icon="copied ? faCheck : faCopy"
              :class="copied ? 'text-emerald-400' : 'text-muted-foreground'"
              class="h-3 w-3"
            />
            <span>{{ copied ? 'Tersalin' : 'Salin' }}</span>
          </Button>
        </div>

        <!-- Quick Minecraft & Rank Swatches -->
        <div class="mt-2.5 space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              Minecraft &amp; Rank
            </span>
            <span class="font-mono text-[9px] text-muted-foreground/60 tabular-nums">
              12 Warna
            </span>
          </div>
          <div class="grid grid-cols-6 gap-1.5">
            <button
              v-for="swatch in MINECRAFT_SWATCHES"
              :key="swatch.hex"
              type="button"
              :title="`${swatch.label} (${swatch.hex.toUpperCase()})`"
              :aria-label="`Pilih ${swatch.label} ${swatch.hex.toUpperCase()}`"
              :style="{ backgroundColor: swatch.hex }"
              :class="[
                'h-5 w-full cursor-pointer rounded-[3px] border transition-transform hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-primary',
                internalColor.toLowerCase() === swatch.hex.toLowerCase()
                  ? 'border-white ring-2 ring-primary scale-105'
                  : 'border-white/20',
              ]"
              @click="selectSwatch(swatch.hex)"
            />
          </div>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style scoped>
:deep(.IroColorPicker) {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
}
:deep(.IroHandle) {
  cursor: grab;
}
:deep(.IroHandle--isActive) {
  cursor: grabbing;
}
</style>
