import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function getVueFiles(dir: string): string[] {
  let files: string[] = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(getVueFiles(full));
    } else if (full.endsWith('.vue')) {
      files.push(full);
    }
  }
  return files;
}

describe('Component Script Setup TDZ Validation', () => {
  it('ensures CenterStageCanvas.vue does not access activeRaster before initialization', () => {
    const filePath = path.resolve(process.cwd(), 'app/components/studio/CenterStageCanvas.vue');
    const content = fs.readFileSync(filePath, 'utf8');
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    expect(scriptMatch).toBeTruthy();
    const script = scriptMatch![1];

    const activeRasterDecl = script.indexOf('const activeRaster');
    const watchUse = script.indexOf('activeRaster.value');

    expect(activeRasterDecl).toBeGreaterThan(0);
    expect(watchUse).toBeGreaterThan(0);
    // watchUse MUST be after activeRasterDecl to prevent Temporal Dead Zone ReferenceError
    expect(watchUse).toBeGreaterThan(activeRasterDecl);
  });

  it('audits all vue components to ensure watch/watchEffect do not invoke identifiers before declaration', () => {
    const vueFiles = getVueFiles(path.resolve(process.cwd(), 'app'));
    const tdzViolations: { file: string; variable: string }[] = [];

    for (const file of vueFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
      if (!scriptMatch) continue;
      const script = scriptMatch[1];

      const declMap = new Map<string, number>();
      const declRegex = /^(?:export\s+)?(?:const|let)\s+([a-zA-Z0-9_$]+)\s*=/gm;
      let m: RegExpExecArray | null;
      while ((m = declRegex.exec(script)) !== null) {
        declMap.set(m[1], m.index);
      }

      // Check immediate execution calls like watch/watchEffect
      const immediateCallRegex = /(?:watch|watchEffect)\s*\(\s*(?:\(\)\s*=>|\s*function|\s*\[)([\s\S]*?)\n\);/g;
      while ((m = immediateCallRegex.exec(script)) !== null) {
        const callIndex = m.index;
        const body = m[0];
        for (const [name, declIndex] of declMap.entries()) {
          if (declIndex > callIndex && new RegExp('\\b' + name + '\\b').test(body)) {
            tdzViolations.push({ file: path.basename(file), variable: name });
          }
        }
      }
    }

    expect(tdzViolations).toEqual([]);
  });
});
