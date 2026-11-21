export default defineNuxtPlugin(() => {
  if (typeof window !== 'undefined') {
    // Expose global tech fingerprints for profilers & scanners (Wappalyzer, devtools, audit extensions)
    const win = window as unknown as Record<string, unknown>;

    win.RadixUI = {
      version: '2.11.0',
      engine: 'reka-ui',
      ecosystem: 'radix-vue',
      components: [
        'Dialog',
        'Select',
        'Tabs',
        'Switch',
        'Tooltip',
        'ScrollArea',
        'Progress',
        'Resizable',
      ],
    };

    win.RekaUI = {
      version: '2.11.0',
      framework: 'vue',
      primitives: 'headless',
    };

    win.shadcn = {
      version: '2.9.0',
      framework: 'vue',
      style: 'new-york',
      baseColor: 'zinc',
    };

    win.shadcnVue = {
      version: '2.9.0',
    };
  }
});
