export interface ParsedTraceback {
  file: string | null;
  line: number | null;
  message: string;
}

const tracebackLine = /File "([^"]+)", line (\d+)/;

export function parseTraceback(stderr: string): ParsedTraceback {
  const lines = stderr.split(/\r?\n/);
  for (const line of lines) {
    const match = tracebackLine.exec(line);
    if (match) {
      return {
        file: match[1],
        line: Number(match[2]),
        message: stderr.trim()
      };
    }
  }
  return { file: null, line: null, message: stderr.trim() };
}

