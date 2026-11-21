<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  faCheck,
  faCircleInfo,
  faLightbulb,
  faRotate,
  faServer,
  faTerminal,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { generateServerPropertiesSnippet } from '@core/report.ts';
import CopyButton from '@/components/shared/CopyButton.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

interface Props {
  readonly sha1Hex: string | null;
  readonly activeFileName: string | null;
}

const props = defineProps<Props>();

function generateRandomUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return '00000000-0000-4000-8000-000000000000';
}

const downloadUrl = ref('');
const requirePack = ref(true);
const includeId = ref(false);
const resourcePackId = ref(generateRandomUuid());
const includePrompt = ref(false);
const resourcePackPrompt = ref(
  '{"text":"Please install the server resource pack for the best experience."}',
);

const PROMPT_PRESETS = {
  standard: '{"text":"Please install the server resource pack for the best experience."}',
  immersive: '{"text":"Server ini menggunakan tekstur dan audio khusus untuk pengalaman bermain terbaik."}',
  custom: '{"text":"Paket resource resmi diperlukan untuk memuat tekstur dan fitur kustom server."}',
} as const;

function setPromptPreset(key: keyof typeof PROMPT_PRESETS): void {
  resourcePackPrompt.value = PROMPT_PRESETS[key];
}

const effectiveSha1 = computed(
  () => props.sha1Hex ?? '<awaiting_40_char_sha1_hex>',
);

const snippetText = computed(() =>
  generateServerPropertiesSnippet({
    downloadUrl: downloadUrl.value,
    sha1Hex: effectiveSha1.value,
    requireResourcePack: requirePack.value,
    includeResourcePackId: includeId.value,
    resourcePackId: resourcePackId.value,
    includeResourcePackPrompt: includePrompt.value,
    resourcePackPrompt: resourcePackPrompt.value,
  }),
);

interface ParsedSnippetLine {
  readonly id: number;
  readonly type: 'comment' | 'kv' | 'blank';
  readonly key?: string;
  readonly val?: string;
  readonly raw: string;
}

const parsedSnippetLines = computed<readonly ParsedSnippetLine[]>(() => {
  return snippetText.value.split('\n').map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return { id: index, type: 'blank', raw: line };
    }
    if (trimmed.startsWith('#')) {
      return { id: index, type: 'comment', raw: line };
    }
    const eqIdx = line.indexOf('=');
    if (eqIdx !== -1) {
      return {
        id: index,
        type: 'kv',
        key: line.slice(0, eqIdx),
        val: line.slice(eqIdx + 1),
        raw: line,
      };
    }
    return { id: index, type: 'blank', raw: line };
  });
});
</script>

<template>
  <ScrollArea class="h-full bg-background">
    <div class="space-y-6 p-6 max-w-7xl mx-auto">
      <!-- Section Header -->
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <FontAwesomeIcon :icon="faServer" aria-hidden="true" class="h-4 w-4 text-primary" />
          <h2 class="text-base font-semibold text-foreground tracking-tight">
            Konfigurasi server.properties
          </h2>
        </div>
        <p class="text-xs text-muted-foreground leading-relaxed">
          Gunakan baris konfigurasi ini di server Minecraft Java agar pemain dapat mengunduh dan menerapkan resource pack secara otomatis saat terhubung.
        </p>
      </div>

      <!-- Main 2-Column Grid -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <!-- Left Column: Form Settings (7 cols on lg) -->
        <div class="space-y-5 lg:col-span-7">
          <!-- Direct Download URL Input -->
          <div class="space-y-2 rounded-lg border border-border bg-card p-4">
            <Label for="cfg-download-url" class="text-xs font-semibold text-foreground">
              Tautan Unduhan Langsung (<code>resource-pack</code>)
            </Label>
            <Input
              id="cfg-download-url"
              v-model="downloadUrl"
              type="url"
              placeholder="https://cdn.serverkamu.com/packs/resourcepack.zip"
              class="h-9 border-border bg-background px-3 font-mono text-xs focus:ring-primary/60"
            />
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              Tautan harus berupa direct download yang langsung mengirimkan berkas .zip tanpa halaman konfirmasi atau captcha.
            </p>
          </div>

          <!-- SHA-1 Sync Card -->
          <div class="space-y-2 rounded-lg border border-border bg-card p-4">
            <div class="flex items-center justify-between">
              <Label class="text-xs font-semibold text-foreground">
                Digest SHA-1 (<code>resource-pack-sha1</code>)
              </Label>
              <span
                v-if="sha1Hex"
                class="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-400"
              >
                <FontAwesomeIcon :icon="faCheck" class="h-2.5 w-2.5" />
                Otomatis dari {{ activeFileName ?? 'berkas aktif' }}
              </span>
              <span
                v-else
                class="font-mono text-[11px] text-muted-foreground"
              >
                Menggunakan placeholder
              </span>
            </div>

            <div class="flex items-center gap-2">
              <code
                id="cfg-sha1-readout"
                class="flex-1 truncate rounded border border-border/70 bg-background px-3 py-2 font-mono text-xs font-semibold text-primary select-all tabular-nums"
              >
                {{ effectiveSha1 }}
              </code>
              <CopyButton
                v-if="sha1Hex"
                compact
                target-id="cfg-sha1-readout"
                :text-to-copy="sha1Hex"
                label="Salin SHA-1"
                aria-label="Salin digest SHA-1"
                class="shrink-0 active:scale-[0.96] transition-transform duration-100 ease-out"
              />
            </div>

            <p v-if="!sha1Hex" class="text-[11px] text-muted-foreground">
              Nilai SHA-1 akan terisi otomatis begitu Anda memilih atau menjatuhkan berkas .zip di panel sebelah kiri.
            </p>
          </div>

          <!-- Toggle: require-resource-pack -->
          <div class="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4">
            <div class="space-y-1">
              <Label for="cfg-require-pack" class="cursor-pointer text-xs font-semibold text-foreground">
                Wajibkan Resource Pack (<code>require-resource-pack</code>)
              </Label>
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                Pemain yang menolak mengunduh paket akan otomatis dikeluarkan (kick) dari server.
              </p>
            </div>
            <Switch id="cfg-require-pack" v-model="requirePack" class="mt-0.5" />
          </div>

          <!-- Toggle & Input: resource-pack-id -->
          <div class="space-y-3 rounded-lg border border-border bg-card p-4">
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-1">
                <Label for="cfg-include-id" class="cursor-pointer text-xs font-semibold text-foreground">
                  Gunakan UUID Khusus (<code>resource-pack-id</code>)
                </Label>
                <p class="text-[11px] text-muted-foreground leading-relaxed">
                  Fitur Minecraft 1.20.3+ untuk identifikasi unik paket dan pembaruan berkas di sisi klien.
                </p>
              </div>
              <Switch id="cfg-include-id" v-model="includeId" class="mt-0.5" />
            </div>

            <div v-if="includeId" class="space-y-2 pt-2 border-t border-border/50">
              <Label for="cfg-id-val" class="text-[11px] text-muted-foreground">
                Nilai UUID (Versi 4)
              </Label>
              <div class="flex items-center gap-2">
                <Input
                  id="cfg-id-val"
                  v-model="resourcePackId"
                  type="text"
                  class="h-9 min-w-0 flex-1 border-border bg-background px-3 font-mono text-xs focus:ring-primary/60"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Buat UUID acak baru"
                  aria-label="Buat UUID acak baru"
                  class="h-9 w-9 shrink-0 active:scale-[0.96] transition-transform duration-100 ease-out"
                  @click="resourcePackId = generateRandomUuid()"
                >
                  <FontAwesomeIcon :icon="faRotate" class="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Toggle & Input: resource-pack-prompt -->
          <div class="space-y-3 rounded-lg border border-border bg-card p-4">
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-1">
                <Label for="cfg-include-prompt" class="cursor-pointer text-xs font-semibold text-foreground">
                  Pesan Konfirmasi di Game (<code>resource-pack-prompt</code>)
                </Label>
                <p class="text-[11px] text-muted-foreground leading-relaxed">
                  Tampilkan pesan teks kustom di layar konfirmasi saat pemain pertama kali bergabung.
                </p>
              </div>
              <Switch id="cfg-include-prompt" v-model="includePrompt" class="mt-0.5" />
            </div>

            <div v-if="includePrompt" class="space-y-2.5 pt-2 border-t border-border/50">
              <Label for="cfg-prompt-val" class="text-[11px] text-muted-foreground">
                Format Komponen Teks JSON
              </Label>
              <Input
                id="cfg-prompt-val"
                v-model="resourcePackPrompt"
                type="text"
                class="h-9 border-border bg-background px-3 font-mono text-xs focus:ring-primary/60"
              />
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[11px] text-muted-foreground">Pilihan Cepat:</span>
                <button
                  type="button"
                  class="rounded border border-border bg-muted/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  @click="setPromptPreset('standard')"
                >
                  Standar
                </button>
                <button
                  type="button"
                  class="rounded border border-border bg-muted/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  @click="setPromptPreset('immersive')"
                >
                  Imersif
                </button>
                <button
                  type="button"
                  class="rounded border border-border bg-muted/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  @click="setPromptPreset('custom')"
                >
                  Bahasa Indonesia
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Terminal Preview & Guide (5 cols on lg) -->
        <div class="space-y-5 lg:col-span-5">
          <!-- Terminal Snippet Box -->
          <div class="overflow-hidden rounded-lg border border-border bg-[#14151e] shadow-md">
            <!-- Terminal Header -->
            <div class="flex items-center justify-between border-b border-border/70 bg-[#1c1d28] px-4 py-2.5">
              <div class="flex items-center gap-2">
                <FontAwesomeIcon :icon="faTerminal" aria-hidden="true" class="h-3.5 w-3.5 text-primary" />
                <span class="font-mono text-xs font-semibold text-foreground">server.properties</span>
              </div>
              <CopyButton
                compact
                target-id="full-snippet-code"
                :text-to-copy="snippetText"
                label="Salin Cuplikan"
                aria-label="Salin konfigurasi server.properties"
                class="active:scale-[0.96] transition-transform duration-100 ease-out"
              />
            </div>

            <!-- Terminal Code Body -->
            <pre
              id="full-snippet-code"
              role="region"
              aria-label="Cuplikan kode server.properties"
              tabindex="0"
              class="overflow-x-auto p-4 font-mono text-xs leading-relaxed select-all focus-visible:outline-2 focus-visible:outline-primary"
            ><div v-for="line in parsedSnippetLines" :key="line.id" class="flex flex-wrap"><template v-if="line.type === 'comment'"><span class="italic text-muted-foreground/60">{{ line.raw }}</span></template><template v-else-if="line.type === 'kv'"><span class="font-medium text-[#9da0b8]">{{ line.key }}</span><span class="font-bold text-primary/80">=</span><span class="font-semibold text-[#f0f1f5]">{{ line.val }}</span></template><template v-else><span>{{ line.raw }}</span></template></div></pre>
          </div>

          <!-- Quick Setup Guide Card -->
          <div class="space-y-3 rounded-lg border border-border bg-card p-4">
            <div class="flex items-center gap-2">
              <FontAwesomeIcon :icon="faLightbulb" class="h-3.5 w-3.5 text-amber-400" />
              <h3 class="text-xs font-semibold text-foreground">
                Panduan Penerapan di Server
              </h3>
            </div>

            <ol class="space-y-2 text-xs text-muted-foreground list-decimal list-inside leading-relaxed">
              <li>
                Klik tombol <strong class="text-foreground">Salin Cuplikan</strong> pada kotak terminal di atas.
              </li>
              <li>
                Buka berkas <code class="rounded bg-muted px-1.5 py-0.5 text-foreground font-mono">server.properties</code> di folder utama server Minecraft Anda.
              </li>
              <li>
                Tempelkan baris konfigurasi, simpan perubahan berkas, lalu restart server Anda.
              </li>
            </ol>
          </div>

          <!-- Technical Notes Card -->
          <div class="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-4 text-[11px] text-muted-foreground leading-relaxed">
            <div class="flex items-center gap-1.5 font-semibold text-foreground">
              <FontAwesomeIcon :icon="faCircleInfo" class="h-3 w-3 text-primary" />
              <span>Catatan Teknis</span>
            </div>
            <ul class="space-y-1 list-disc list-inside">
              <li>Digest SHA-1 harus terdiri dari tepat 40 karakter heksadesimal huruf kecil (lowercase).</li>
              <li>Minecraft secara otomatis meng-cache berkas berdasarkan hash SHA-1 sehingga pemain tidak perlu mengunduh ulang berkas yang sama.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </ScrollArea>
</template>
