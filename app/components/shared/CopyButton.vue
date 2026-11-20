<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCheck, faCopy } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';

interface Props {
  readonly targetId: string;
  readonly textToCopy: string;
  readonly label: string;
  readonly ariaLabel?: string;
  readonly compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
});

interface CommandEventLike extends Event {
  readonly command?: string;
  readonly source?: Element | null;
}

const wrapperRef = ref<HTMLDivElement | null>(null);
const copiedVisible = ref(false);
const liveStatus = ref('');
let lastAnnouncement = '';
let resetTimer: number | null = null;

async function writeClipboardText(value: string): Promise<boolean> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fallback ke execCommand
    }
  }

  if (typeof document === 'undefined') return false;

  const previousFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);
  textarea.select();

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  } finally {
    document.body.removeChild(textarea);
    previousFocus?.focus({ preventScroll: true });
  }
  return ok;
}

async function performCopy(): Promise<void> {
  const success = await writeClipboardText(props.textToCopy);
  const baseMessage = success
    ? `${props.label} copied to clipboard.`
    : 'Automatic copy failed. Select the text and copy manually with Ctrl+C.';

  const nextAnnouncement =
    lastAnnouncement === baseMessage ? `${baseMessage}\u00A0` : baseMessage;
  lastAnnouncement = nextAnnouncement;
  liveStatus.value = nextAnnouncement;
  copiedVisible.value = success;

  if (resetTimer !== null) {
    window.clearTimeout(resetTimer);
  }
  resetTimer = window.setTimeout(() => {
    copiedVisible.value = false;
  }, 2000);
}

let boundTarget: HTMLElement | null = null;

function onCommand(event: Event): void {
  const cmdEvent = event as CommandEventLike;
  const triggerEl = wrapperRef.value?.querySelector('button');
  if (cmdEvent.command === '--copy' && cmdEvent.source === triggerEl) {
    void performCopy();
  }
}

onMounted(() => {
  const el = document.getElementById(props.targetId);
  if (el && 'CommandEvent' in window) {
    boundTarget = el;
    el.addEventListener('command', onCommand);
  }
});

onBeforeUnmount(() => {
  if (resetTimer !== null) {
    window.clearTimeout(resetTimer);
  }
  boundTarget?.removeEventListener('command', onCommand);
});

function handleFallbackClick(): void {
  if (typeof window !== 'undefined' && 'CommandEvent' in window) {
    return;
  }
  void performCopy();
}
</script>

<template>
  <div ref="wrapperRef" class="relative inline-flex items-center gap-2">
    <Button
      variant="outline"
      size="sm"
      type="button"
      :aria-label="props.ariaLabel ?? props.label"
      command="--copy"
      :commandfor="props.targetId"
      :class="compact ? 'h-7 px-2 text-[11px]' : 'h-8 px-2.5 text-xs'"
      @click="handleFallbackClick"
    >
      <FontAwesomeIcon v-if="copiedVisible" :icon="faCheck" class="h-3.5 w-3.5 text-emerald-400" />
      <FontAwesomeIcon v-else :icon="faCopy" class="h-3.5 w-3.5 text-muted-foreground" />
      <span>{{ copiedVisible ? 'Copied' : props.label }}</span>
    </Button>

    <span role="status" aria-live="polite" class="sr-only">
      {{ liveStatus }}
    </span>
  </div>
</template>
