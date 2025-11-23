export interface CsvParseOptions {
  delimiter?: string;
  header?: boolean;
  skipEmptyLines?: boolean;
}

export interface CsvParseResult {
  data: string[][];
  errors: Array<{ message: string; row?: number }>;
}

function detectDelimiter(content: string, provided?: string): string {
  if (provided && provided.length > 0) {
    return provided;
  }

  const hasTabs = content.includes("\t");
  const commaCount = (content.match(/,/g) || []).length;
  const tabCount = (content.match(/\t/g) || []).length;

  if (hasTabs && tabCount >= commaCount) {
    return "\t";
  }

  return ",";
}

function parseLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

export function parseCSV(
  content: string,
  options: CsvParseOptions = {},
): CsvParseResult {
  const delimiter = detectDelimiter(content, options.delimiter);
  const lines = content.split(/\r?\n/);
  const rows: string[][] = [];
  const errors: Array<{ message: string; row?: number }> = [];

  lines.forEach((line, index) => {
    if (options.skipEmptyLines && line.trim() === "") {
      return;
    }

    const parsed = parseLine(line, delimiter);

    if (!options.header || index > 0) {
      rows.push(parsed);
    } else if (options.header) {
      rows.push(parsed);
    }
  });

  return { data: rows, errors };
}

const Papa = {
  parse: parseCSV,
};

export default Papa;
