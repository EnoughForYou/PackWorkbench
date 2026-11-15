<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import type { RgbaRaster } from '@core/font/pixelSynth.ts';

interface Props {
  readonly raster: RgbaRaster | null;
  readonly zoom?: number;
  readonly className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  zoom: 2,
  className: '',
});

const canvasRef = ref<HTMLCanvasElement | null>(null);

watchEffect(() => {
  const canvas = canvasRef.value;
  const raster = props.raster;
  if (!canvas || !raster) return;
  canvas.width = raster.width;
  canvas.height = raster.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const imgData = new ImageData(
    new Uint8ClampedArray(raster.rgba),
    raster.width,
    raster.height,
  );
  ctx.putImageData(imgData, 0, 0);
});
</script>

<template>
  <canvas
    v-if="props.raster"
    ref="canvasRef"
    role="img"
    :style="{
      width: `${props.raster.width * props.zoom}px`,
      height: `${props.raster.height * props.zoom}px`,
    }"
    :class="['pixelated-canvas block shrink-0', props.className]"
  />
</template>
