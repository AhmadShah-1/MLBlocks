export interface ImportExtraction {
  imports: string[];
  body: string;
}

const importRegex = /^\s*(import\s.+|from\s.+\s+import\s.+)$/;

export function extractImports(code: string): ImportExtraction {
  const lines = code.split(/\r?\n/);
  const imports: string[] = [];
  const bodyLines: string[] = [];
  for (const line of lines) {
    if (importRegex.test(line)) {
      imports.push(line.trim());
    } else {
      bodyLines.push(line);
    }
  }
  return { imports, body: bodyLines.join("\n") };
}

export function dedupeImports(imports: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const imp of imports) {
    if (!seen.has(imp)) {
      seen.add(imp);
      unique.push(imp);
    }
  }
  return unique;
}

