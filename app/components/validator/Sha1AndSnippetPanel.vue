<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  faCheck,
  faRotate,
  faTerminal,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { generateServerPropertiesSnippet } from '@core/report.ts';
import type { Sha1ProgressState } from '@/stores/workbenchStore';
import CopyButton from '@/components/shared/CopyButton.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

interface Props {
  readonly sha1State: Sha1ProgressState;
}

const props = defineProps<Props>();

function generateRandomUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return '00000000-0000-4000-8000-000000000000';
}

function formatMiB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(2);
}

const downloadUrl = ref('');
const requirePack = ref(true);
const includeId = ref(false);
const resourcePackId = ref(generateRandomUuid());
const includePrompt = ref(false);
const resourcePackPrompt = ref(
  '{"text":"Please install the server resource pack for the best experience."}',
);

const progressPercent = computed(() => Math.round(props.sha1State.ratio * 100));

const snippetText = computed(() =>
  generateServerPropertiesSnippet({
    downloadUrl: downloadUrl.value,
    sha1Hex: props.sha1State.sha1Hex ?? '<awaiting_40_char_sha1_hex>',
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
  <section aria-labelledby="sha1-section-heading" class="space-y-4">
    <!-- Section 3: SHA-1 Progress & Readout -->
    <div class="space-y-2.5">
      <div class="flex items-center justify-between gap-2">
        <h2
          id="sha1-section-heading"
          class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          3. Hash SHA-1 (Web Worker)
        </h2>
        <span class="font-mono text-[10px] text-muted-foreground tabular-nums">
          <template v-if="sha1State.status === 'idle'">Menunggu .zip</template>
          <template v-else-if="sha1State.status === 'hashing'">
            {{ progressPercent }}% · {{ formatMiB(sha1State.bytesRead) }} MiB
          </template>
          <template v-else-if="sha1State.status === 'done'">
            100% · {{ formatMiB(sha1State.totalBytes) }} MiB
          </template>
          <template v-else>Gagal</template>
        </span>
      </div>

      <Progress
        :model-value="sha1State.status === 'idle' ? 0 : progressPercent"
        class="h-1.5"
      />

      <span role="status" aria-live="polite" class="sr-only">
        {{
          sha1State.status === 'done'
            ? 'Penghitungan SHA-1 selesai.'
            : sha1State.status === 'error'
              ? `Penghitungan SHA-1 gagal: ${sha1State.errorMessage ?? ''}`
              : ''
        }}
      </span>

      <div
        v-if="sha1State.status === 'error'"
        class="rounded-md border border-destructive/40 bg-destructive/15 p-2.5 text-xs text-destructive"
      >
        Kesalahan SHA-1 Worker: {{ sha1State.errorMessage }}
      </div>

      <!-- Prominent SHA-1 Readout Card -->
      <div class="space-y-2 rounded-lg border border-border bg-background/80 p-3">
        <div class="flex items-center justify-between text-[10px] font-mono font-medium text-muted-foreground">
          <span>DIGEST SHA-1 (40 KARAKTER HEX)</span>
          <span
            v-if="sha1State.status === 'done' && sha1State.sha1Hex"
            class="inline-flex items-center gap-1 font-semibold text-emerald-400"
          >
            <FontAwesomeIcon :icon="faCheck" class="h-2.5 w-2.5" />
            Terverifikasi
          </span>
        </div>
        <div class="flex items-center justify-between gap-3">
          <code
            id="sha1-digest"
            class="min-w-0 flex-1 break-all font-mono text-sm font-semibold tracking-wider text-primary select-all tabular-nums"
          >
            {{ sha1State.sha1Hex ?? '—' }}
          </code>
          <CopyButton
            v-if="sha1State.sha1Hex"
            compact
            target-id="sha1-digest"
            :text-to-copy="sha1State.sha1Hex"
            label="Salin SHA-1"
            aria-label="Salin digest SHA-1 40 karakter ke papan klip"
            class="shrink-0 active:scale-[0.96] transition-transform duration-100 ease-out"
          />
        </div>
      </div>
    </div>

    <Separator />

    <!-- Section 4: server.properties Builder -->
    <div class="space-y-3.5">
      <div class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        4. Konfigurasi server.properties
      </div>

      <!-- URL unduhan -->
      <div class="space-y-1.5">
        <Label for="rp-url-input" class="text-xs font-normal text-muted-foreground">
          URL Unduhan Langsung (<code>resource-pack</code>)
        </Label>
        <Input
          id="rp-url-input"
          v-model="downloadUrl"
          type="url"
          placeholder="https://cdn.example.com/packs/my-pack.zip"
          class="h-10 min-h-[40px] border-border bg-input/40 px-3 font-mono text-xs focus:ring-primary/60"
        />
      </div>

      <!-- Wajibkan pack switch -->
      <div class="flex items-center justify-between gap-2 py-1">
        <Label for="rp-require-switch" class="cursor-pointer text-xs font-normal text-secondary-foreground">
          Wajibkan pack (<code>require-resource-pack=true</code>)
        </Label>
        <Switch id="rp-require-switch" v-model="requirePack" />
      </div>

      <!-- Advanced properties: id & prompt -->
      <div class="space-y-3 border-t border-border/60 pt-3">
        <div class="flex items-center justify-between gap-2">
          <Label for="rp-include-id-switch" class="cursor-pointer text-xs font-normal text-secondary-foreground">
            Sertakan <code>resource-pack-id</code> (Minecraft 1.20.3+)
          </Label>
          <Switch id="rp-include-id-switch" v-model="includeId" />
        </div>

        <div v-if="includeId" class="flex items-center gap-2">
          <Label for="rp-id-input" class="sr-only">Nilai UUID untuk resource-pack-id</Label>
          <Input
            id="rp-id-input"
            v-model="resourcePackId"
            type="text"
            class="h-10 min-h-[40px] min-w-0 flex-1 border-border bg-input/40 px-3 font-mono text-xs focus:ring-primary/60"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Buat UUID acak baru"
            class="h-10 w-10 min-h-[40px] min-w-[40px] shrink-0 rounded-md active:scale-[0.96] transition-transform duration-100 ease-out"
            @click="resourcePackId = generateRandomUuid()"
          >
            <FontAwesomeIcon :icon="faRotate" aria-hidden="true" class="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>

        <div class="flex items-center justify-between gap-2">
          <Label for="rp-include-prompt-switch" class="cursor-pointer text-xs font-normal text-secondary-foreground">
            Sertakan <code>resource-pack-prompt</code> (JSON Text)
          </Label>
          <Switch id="rp-include-prompt-switch" v-model="includePrompt" />
        </div>

        <div v-if="includePrompt">
          <Label for="rp-prompt-input" class="sr-only">
            Komponen JSON Text untuk resource-pack-prompt
          </Label>
          <Input
            id="rp-prompt-input"
            v-model="resourcePackPrompt"
            type="text"
            class="h-10 min-h-[40px] border-border bg-input/40 px-3 font-mono text-xs focus:ring-primary/60"
          />
        </div>
      </div>

      <!-- server.properties Terminal Snippet Box with Syntax Clarity -->
      <div class="space-y-2 border-t border-border/60 pt-3">
        <div class="overflow-hidden rounded-lg border border-border bg-[#14151e] shadow-md">
          <!-- Terminal Header Bar -->
          <div class="flex items-center justify-between border-b border-border/70 bg-[#1c1d28] px-3.5 py-2">
            <div class="flex items-center gap-2.5">
              <div class="flex items-center gap-1.5" aria-hidden="true">
                <span class="h-2.5 w-2.5 rounded-full bg-[#e05252]/80"></span>
                <span class="h-2.5 w-2.5 rounded-full bg-[#f59e0b]/80"></span>
                <span class="h-2.5 w-2.5 rounded-full bg-[#22c55e]/80"></span>
              </div>
              <div class="ml-1 flex items-center gap-1.5 font-mono text-xs font-semibold text-muted-foreground">
                <FontAwesomeIcon :icon="faTerminal" aria-hidden="true" class="h-3 w-3 text-muted-foreground/70" />
                <span>server.properties</span>
              </div>
            </div>
            <CopyButton
              compact
              target-id="snippet-code"
              :text-to-copy="snippetText"
              label="Salin Cuplikan"
              aria-label="Salin konfigurasi server.properties ke papan klip"
              class="active:scale-[0.96] transition-transform duration-100 ease-out"
            />
          </div>

          <!-- Terminal Body with Syntax Clarity -->
          <pre
            id="snippet-code"
            role="region"
            aria-label="Cuplikan kode server.properties"
            tabindex="0"
            class="overflow-x-auto p-3.5 font-mono text-xs leading-relaxed select-all focus-visible:outline-2 focus-visible:outline-primary"
          ><div v-for="line in parsedSnippetLines" :key="line.id" class="flex flex-wrap"><template v-if="line.type === 'comment'"><span class="italic text-muted-foreground/60">{{ line.raw }}</span></template><template v-else-if="line.type === 'kv'"><span class="font-medium text-[#9da0b8]">{{ line.key }}</span><span class="font-bold text-primary/80">=</span><span class="font-semibold text-[#f0f1f5]">{{ line.val }}</span></template><template v-else><span>{{ line.raw }}</span></template></div></pre>
        </div>
      </div>
    </div>
  </section>
</template>
