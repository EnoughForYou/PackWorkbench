<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCheck, faFont, faSearch } from '@fortawesome/free-solid-svg-icons';
import {
  CURATED_GOOGLE_FONTS,
  searchGoogleFonts,
  type FontFilterCategory,
  type GoogleFontCategory,
  type GoogleFontItem,
} from '@core/font/googleFonts.ts';
import type { GoogleFontConfig } from '@core/font/types.ts';
import { useFontRasterizer } from '@/composables/useFontRasterizer';

const props = withDefaults(
  defineProps<{
    modelValue?: GoogleFontConfig;
    previewText?: string;
  }>(),
  {
    modelValue: () => ({
      family: 'Press Start 2P',
      category: 'display',
      weight: 400,
      fontSizePx: 8,
      style: 'normal',
    }),
    previewText: 'VIP+ RANK',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: GoogleFontConfig): void;
  (e: 'select', font: GoogleFontItem): void;
}>();

const { ensureFontLoaded } = useFontRasterizer();

const searchQuery = ref('');
const selectedCategory = ref<FontFilterCategory>('all');

const categories: readonly { id: FontFilterCategory; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'pixel-retro', label: 'Pixel / Retro' },
  { id: 'sans-serif', label: 'Sans-Serif' },
  { id: 'monospace', label: 'Monospace' },
  { id: 'display', label: 'Display' },
  { id: 'serif', label: 'Serif' },
  { id: 'handwriting', label: 'Tulisan Tangan' },
];

const filteredFonts = computed(() =>
  searchGoogleFonts(searchQuery.value, selectedCategory.value),
);

const currentFontItem = computed<GoogleFontItem | undefined>(() => {
  const fam = props.modelValue.family.toLowerCase();
  return CURATED_GOOGLE_FONTS.find(
    (f: GoogleFontItem) => f.family.toLowerCase() === fam,
  );
});

const availableWeights = computed<readonly number[]>(() => {
  return currentFontItem.value?.weights ?? [400];
});

// Load the selected font CSS when config changes
watch(
  () => props.modelValue.family,
  (fam) => {
    if (fam) {
      void ensureFontLoaded(props.modelValue);
    }
  },
  { immediate: true },
);

function selectFont(item: GoogleFontItem): void {
  const defaultWeight = item.weights.includes(props.modelValue.weight)
    ? props.modelValue.weight
    : item.weights[0] ?? 400;

  const nextConfig: GoogleFontConfig = {
    ...props.modelValue,
    family: item.family,
    category: item.category,
    weight: defaultWeight,
  };

  emit('update:modelValue', nextConfig);
  emit('select', item);
  void ensureFontLoaded(nextConfig);
}

function updateWeight(weight: number): void {
  const nextConfig: GoogleFontConfig = {
    ...props.modelValue,
    weight,
  };
  emit('update:modelValue', nextConfig);
  void ensureFontLoaded(nextConfig);
}

function updateFontSize(sizePx: number): void {
  const clamped = Math.max(4, Math.min(64, Math.round(sizePx)));
  emit('update:modelValue', {
    ...props.modelValue,
    fontSizePx: clamped,
  });
}

function getCategoryBadgeLabel(cat: GoogleFontCategory, isPixel?: boolean): string {
  if (isPixel) return 'Piksel';
  switch (cat) {
    case 'sans-serif':
      return 'Sans';
    case 'monospace':
      return 'Mono';
    case 'display':
      return 'Display';
    case 'serif':
      return 'Serif';
    case 'handwriting':
      return 'Tangan';
    default:
      return cat;
  }
}
</script>

<template>
  <div
    class="flex flex-col gap-3 rounded-lg border border-[#3c3f54] bg-[#1e1f29] p-3 text-slate-100 shadow-md"
    data-testid="google-font-picker"
  >
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[#3c3f54] pb-2">
      <div class="flex items-center gap-2">
        <FontAwesomeIcon :icon="faFont" class="text-xs text-[#9b73be]" />
        <span class="text-xs font-semibold tracking-wide text-slate-200">
          Koleksi Google Fonts
        </span>
      </div>
      <span class="text-[10px] text-slate-400">
        {{ filteredFonts.length }} font tersedia
      </span>
    </div>

    <!-- Search Input -->
    <div class="relative">
      <FontAwesomeIcon
        :icon="faSearch"
        class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400"
      />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cari nama font..."
        class="h-8 w-full rounded border border-[#3c3f54] bg-[#262736] pl-8 pr-3 text-xs text-slate-100 placeholder-slate-400 transition-colors focus:border-[#9b73be] focus:outline-none focus:ring-1 focus:ring-[#9b73be]"
        aria-label="Cari font Google Fonts"
      />
    </div>

    <!-- Category Filter Tabs -->
    <div class="flex flex-wrap gap-1">
      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        class="rounded px-2 py-1 text-[11px] font-medium transition-colors"
        :class="[
          selectedCategory === cat.id
            ? 'bg-[#9b73be] text-white shadow-sm'
            : 'bg-[#262736] text-slate-300 hover:bg-[#3c3f54] hover:text-white',
        ]"
        @click="selectedCategory = cat.id"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- Weight & Size Controls -->
    <div class="grid grid-cols-2 gap-2 rounded border border-[#3c3f54] bg-[#262736] p-2">
      <!-- Weight Selector -->
      <div class="flex flex-col gap-1">
        <label for="font-weight-select" class="text-[10px] font-medium text-slate-300">
          Ketebalan
        </label>
        <select
          id="font-weight-select"
          :value="modelValue.weight"
          class="h-7 rounded border border-[#3c3f54] bg-[#1e1f29] px-2 text-xs text-slate-100 focus:border-[#9b73be] focus:outline-none"
          @change="updateWeight(Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="w in availableWeights" :key="w" :value="w">
            {{ w }} {{ w === 400 ? '(Reguler)' : w === 700 ? '(Tebal)' : '' }}
          </option>
        </select>
      </div>

      <!-- Size Selector -->
      <div class="flex flex-col gap-1">
        <label for="font-size-input" class="text-[10px] font-medium text-slate-300">
          Ukuran ({{ modelValue.fontSizePx }}px)
        </label>
        <input
          id="font-size-input"
          type="range"
          min="5"
          max="32"
          step="1"
          :value="modelValue.fontSizePx"
          class="h-7 accent-[#9b73be]"
          aria-label="Atur ukuran render huruf font"
          @input="updateFontSize(Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </div>

    <!-- Font List / Grid with Typography Preview Pills -->
    <div
      class="max-h-56 space-y-1.5 overflow-y-auto pr-1"
      role="listbox"
      aria-label="Daftar font Google Fonts"
    >
      <div
        v-if="filteredFonts.length === 0"
        class="py-6 text-center text-xs text-slate-400"
      >
        Tidak ada font yang cocok dengan pencarian "{{ searchQuery }}".
      </div>

      <button
        v-for="item in filteredFonts"
        :key="item.family"
        type="button"
        role="option"
        :aria-selected="modelValue.family.toLowerCase() === item.family.toLowerCase()"
        class="flex w-full items-center justify-between rounded border p-2 text-left transition-all"
        :class="[
          modelValue.family.toLowerCase() === item.family.toLowerCase()
            ? 'border-[#9b73be] bg-[#3c3f54]/60 ring-1 ring-[#9b73be]'
            : 'border-[#3c3f54] bg-[#262736] hover:border-slate-500 hover:bg-[#2c2d40]',
        ]"
        @click="selectFont(item)"
      >
        <div class="flex flex-col gap-0.5 overflow-hidden pr-2">
          <div class="flex items-center gap-1.5">
            <span class="truncate text-xs font-semibold text-slate-100">
              {{ item.family }}
            </span>
            <span
              class="rounded px-1.5 py-0.2 text-[9px] font-medium"
              :class="[
                item.isPixel
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-700 text-slate-300',
              ]"
            >
              {{ getCategoryBadgeLabel(item.category, item.isPixel) }}
            </span>
          </div>

          <span class="truncate text-[10px] text-slate-400">
            {{ item.description }}
          </span>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <!-- Typography Preview Pill -->
          <div
            class="flex items-center justify-center rounded border border-[#3c3f54] bg-[#1e1f29] px-2.5 py-1 text-[11px] font-normal tracking-wide text-[#9b73be]"
            :style="{
              fontFamily: `'${item.family}', sans-serif`,
              fontWeight: item.weights.includes(modelValue.weight)
                ? modelValue.weight
                : item.weights[0],
            }"
          >
            {{ item.previewText || previewText }}
          </div>

          <!-- Active check icon -->
          <div
            v-if="modelValue.family.toLowerCase() === item.family.toLowerCase()"
            class="flex h-4 w-4 items-center justify-center rounded-full bg-[#9b73be] text-[10px] text-white"
          >
            <FontAwesomeIcon :icon="faCheck" />
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
