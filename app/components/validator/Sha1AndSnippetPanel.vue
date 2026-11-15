<script setup lang="ts">
import { computed, ref } from 'vue';
import { RefreshCw } from '@lucide/vue';
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
</script>

<template>
  <section aria-labelledby="sha1-section-heading" class="space-y-4">
    <!-- SHA-1 Progress & Readout -->
    <div class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <h2
          id="sha1-section-heading"
          class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          3. SHA-1 Hash (Worker)
        </h2>
        <span class="font-mono text-[10px] text-muted-foreground tabular-nums">
          <template v-if="sha1State.status === 'idle'">Waiting for .zip</template>
          <template v-else-if="sha1State.status === 'hashing'">
            {{ progressPercent }}% · {{ formatMiB(sha1State.bytesRead) }} MiB
          </template>
          <template v-else-if="sha1State.status === 'done'">
            100% · {{ formatMiB(sha1State.totalBytes) }} MiB
          </template>
          <template v-else>Failed</template>
        </span>
      </div>

      <Progress
        :model-value="sha1State.status === 'idle' ? 0 : progressPercent"
        class="h-1.5"
      />

      <span role="status" aria-live="polite" class="sr-only">
        {{
          sha1State.status === 'done'
            ? 'SHA-1 calculation finished.'
            : sha1State.status === 'error'
              ? `SHA-1 calculation failed: ${sha1State.errorMessage ?? ''}`
              : ''
        }}
      </span>

      <p v-if="sha1State.status === 'error'" class="text-[11px] text-red-300">
        SHA-1 Worker error: {{ sha1State.errorMessage }}
      </p>

      <div class="flex items-center justify-between gap-2 bg-[#070709] px-2.5 py-2">
        <code
          id="sha1-digest"
          class="min-w-0 flex-1 break-all font-mono text-[11px] font-semibold text-[#ff8f6b] tabular-nums"
        >
          {{ sha1State.sha1Hex ?? '—' }}
        </code>
        <CopyButton
          v-if="sha1State.sha1Hex"
          compact
          target-id="sha1-digest"
          :text-to-copy="sha1State.sha1Hex"
          label="SHA-1"
          aria-label="Copy 40-character SHA-1 digest to clipboard"
        />
      </div>
    </div>

    <Separator />

    <!-- server.properties Builder -->
    <div class="space-y-3">
      <p class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        4. server.properties Configuration
      </p>

      <div class="space-y-1">
        <Label for="rp-url-input" class="text-[11px] font-normal text-muted-foreground">
          Direct download URL (<code>resource-pack</code>)
        </Label>
        <Input
          id="rp-url-input"
          v-model="downloadUrl"
          type="url"
          placeholder="https://cdn.example.com/packs/my-pack.zip"
          class="h-8 bg-[#14141a] px-2.5 font-mono text-xs"
        />
      </div>

      <div class="flex items-center justify-between gap-2">
        <Label for="rp-require-switch" class="cursor-pointer text-[11px] font-normal text-secondary-foreground">
          Required (<code>require-resource-pack=true</code>)
        </Label>
        <Switch id="rp-require-switch" v-model="requirePack" />
      </div>

      <div class="space-y-2 border-t border-border/60 pt-2.5">
        <div class="flex items-center justify-between gap-2">
          <Label for="rp-include-id-switch" class="cursor-pointer text-[11px] font-normal text-secondary-foreground">
            Include <code>resource-pack-id</code> (1.20.3+)
          </Label>
          <Switch id="rp-include-id-switch" v-model="includeId" />
        </div>

        <div v-if="includeId" class="flex items-center gap-1.5">
          <Label for="rp-id-input" class="sr-only">UUID value for resource-pack-id</Label>
          <Input
            id="rp-id-input"
            v-model="resourcePackId"
            type="text"
            class="h-7 min-w-0 flex-1 bg-[#14141a] px-2 font-mono text-[11px]"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Generate new random UUID"
            class="h-7 w-7 shrink-0"
            @click="resourcePackId = generateRandomUuid()"
          >
            <RefreshCw aria-hidden="true" class="h-3 w-3" />
          </Button>
        </div>

        <div class="flex items-center justify-between gap-2">
          <Label for="rp-include-prompt-switch" class="cursor-pointer text-[11px] font-normal text-secondary-foreground">
            Include <code>resource-pack-prompt</code>
          </Label>
          <Switch id="rp-include-prompt-switch" v-model="includePrompt" />
        </div>

        <div v-if="includePrompt">
          <Label for="rp-prompt-input" class="sr-only">
            JSON Text Component for resource-pack-prompt
          </Label>
          <Input
            id="rp-prompt-input"
            v-model="resourcePackPrompt"
            type="text"
            class="h-7 bg-[#14141a] px-2 font-mono text-[11px]"
          />
        </div>
      </div>

      <div class="space-y-1.5 border-t border-border/60 pt-2.5">
        <div class="flex items-center justify-between gap-2">
          <h3 id="snippet-heading" class="text-[11px] font-medium text-muted-foreground">
            <code>server.properties</code> Snippet
          </h3>
          <CopyButton
            compact
            target-id="snippet-code"
            :text-to-copy="snippetText"
            label="Copy"
            aria-label="Copy server.properties snippet to clipboard"
          />
        </div>

        <pre
          role="region"
          aria-labelledby="snippet-heading"
          tabindex="0"
          class="overflow-x-auto bg-[#070709] p-2.5 font-mono text-[11px] leading-relaxed text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        ><code id="snippet-code">{{ snippetText }}</code></pre>
      </div>
    </div>
  </section>
</template>
