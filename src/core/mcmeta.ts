export type JsonNode =
  | { readonly kind: 'null' }
  | { readonly kind: 'boolean'; readonly value: boolean }
  | { readonly kind: 'string'; readonly value: string }
  | {
      readonly kind: 'number';
      readonly value: number;
      readonly raw: string;
      readonly isFloatLiteral: boolean;
    }
  | { readonly kind: 'array'; readonly items: readonly JsonNode[] }
  | { readonly kind: 'object'; readonly props: ReadonlyMap<string, JsonNode> };

export type McmetaParseResult =
  | {
      readonly ok: true;
      readonly root: JsonNode;
    }
  | {
      readonly ok: false;
      readonly errorMessage: string;
      readonly hasUtf8Bom: boolean;
    };

/**
 * Parses JSON text after validating syntax with native JSON.parse while preserving
 * exact numeric literals (so floats like 69.0 are distinguished from integer 69).
 *
 * Reference: docs/knowledge/00-ringkasan-perbedaan-versi.md §2
 */
export function parseJsonPreserveNumberTokens(rawText: string): McmetaParseResult {
  const hasUtf8Bom = rawText.charCodeAt(0) === 0xfeff;
  if (hasUtf8Bom) {
    return {
      ok: false,
      hasUtf8Bom: true,
      errorMessage:
        'Berkas diawali karakter UTF-8 BOM (\\uFEFF) yang membuat parser JSON gagal.',
    };
  }

  try {
    JSON.parse(rawText);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      hasUtf8Bom: false,
      errorMessage: detail,
    };
  }

  const root = new JsonAstScanner(rawText).parseRoot();
  return { ok: true, root };
}

class JsonAstScanner {
  private pos = 0;

  constructor(private readonly src: string) {}

  parseRoot(): JsonNode {
    this.skipWhitespace();
    return this.parseValue();
  }

  private skipWhitespace(): void {
    while (this.pos < this.src.length) {
      const code = this.src.charCodeAt(this.pos);
      if (code === 0x20 || code === 0x09 || code === 0x0a || code === 0x0d) {
        this.pos++;
      } else {
        break;
      }
    }
  }

  private parseValue(): JsonNode {
    this.skipWhitespace();
    const ch = this.src[this.pos];
    if (ch === '{') return this.parseObject();
    if (ch === '[') return this.parseArray();
    if (ch === '"') return { kind: 'string', value: this.parseString() };
    if (ch === 't') {
      this.pos += 4;
      return { kind: 'boolean', value: true };
    }
    if (ch === 'f') {
      this.pos += 5;
      return { kind: 'boolean', value: false };
    }
    if (ch === 'n') {
      this.pos += 4;
      return { kind: 'null' };
    }
    return this.parseNumber();
  }

  private parseObject(): JsonNode {
    const props = new Map<string, JsonNode>();
    this.pos++; // '{'
    this.skipWhitespace();
    if (this.src[this.pos] === '}') {
      this.pos++;
      return { kind: 'object', props };
    }
    while (this.pos < this.src.length) {
      this.skipWhitespace();
      const key = this.parseString();
      this.skipWhitespace();
      this.pos++; // ':'
      const value = this.parseValue();
      props.set(key, value);
      this.skipWhitespace();
      if (this.src[this.pos] === ',') {
        this.pos++;
        continue;
      }
      if (this.src[this.pos] === '}') {
        this.pos++;
        break;
      }
      break;
    }
    return { kind: 'object', props };
  }

  private parseArray(): JsonNode {
    const items: JsonNode[] = [];
    this.pos++; // '['
    this.skipWhitespace();
    if (this.src[this.pos] === ']') {
      this.pos++;
      return { kind: 'array', items };
    }
    while (this.pos < this.src.length) {
      items.push(this.parseValue());
      this.skipWhitespace();
      if (this.src[this.pos] === ',') {
        this.pos++;
        continue;
      }
      if (this.src[this.pos] === ']') {
        this.pos++;
        break;
      }
      break;
    }
    return { kind: 'array', items };
  }

  private parseString(): string {
    const start = this.pos;
    this.pos++; // opening quote
    while (this.pos < this.src.length) {
      const ch = this.src[this.pos];
      if (ch === '\\') {
        this.pos += this.src[this.pos + 1] === 'u' ? 6 : 2;
      } else if (ch === '"') {
        this.pos++;
        break;
      } else {
        this.pos++;
      }
    }
    return JSON.parse(this.src.slice(start, this.pos)) as string;
  }

  private parseNumber(): JsonNode {
    const start = this.pos;
    while (this.pos < this.src.length) {
      const ch = this.src[this.pos] ?? '';
      if (
        (ch >= '0' && ch <= '9') ||
        ch === '-' ||
        ch === '+' ||
        ch === '.' ||
        ch === 'e' ||
        ch === 'E'
      ) {
        this.pos++;
      } else {
        break;
      }
    }
    const raw = this.src.slice(start, this.pos);
    const value = Number(raw);
    const isFloatLiteral =
      raw.includes('.') || raw.includes('e') || raw.includes('E');
    return { kind: 'number', value, raw, isFloatLiteral };
  }
}
