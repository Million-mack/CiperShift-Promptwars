import { detectPII } from './detector.js';

/**
 * Parses RFC 4180 CSV text while recording exact raw character offsets for every cell.
 * Preserves quoted fields, commas inside quotes, escaped quotes (""), and multiline fields.
 */
export function parseCSVWithSpans(csvText) {
  const rows = [];
  let currentRow = [];
  let i = 0;
  const len = csvText.length;

  while (i <= len) {
    if (i === len) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      break;
    }

    const isQuoted = csvText[i] === '"';
    const rawStart = i;

    if (isQuoted) {
      i += 1; // skip opening quote
      const contentStart = i;
      let value = '';
      // Map each unescaped char index -> raw char index in csvText
      const charIndexMap = [];

      while (i < len) {
        const ch = csvText[i];
        if (ch === '"') {
          if (i + 1 < len && csvText[i + 1] === '"') {
            charIndexMap.push(i);
            value += '"';
            i += 2;
          } else {
            i += 1; // closing quote
            break;
          }
        } else {
          charIndexMap.push(i);
          value += ch;
          i += 1;
        }
      }

      // Advance through any trailing spaces before delimiter/newline (defensive)
      while (i < len && csvText[i] !== ',' && csvText[i] !== '\n' && csvText[i] !== '\r') {
        i += 1;
      }

      currentRow.push({
        value,
        isQuoted: true,
        rawStart,
        contentStart,
        rawEnd: i,
        charIndexMap,
      });
    } else {
      let value = '';
      const charIndexMap = [];
      while (i < len && csvText[i] !== ',' && csvText[i] !== '\n' && csvText[i] !== '\r') {
        charIndexMap.push(i);
        value += csvText[i];
        i += 1;
      }

      currentRow.push({
        value,
        isQuoted: false,
        rawStart,
        contentStart: rawStart,
        rawEnd: i,
        charIndexMap,
      });
    }

    if (i < len && csvText[i] === ',') {
      i += 1;
      // Handle trailing comma at EOF or EOL by continuing loop to capture empty trailing cell
      if (i === len) {
        currentRow.push({
          value: '',
          isQuoted: false,
          rawStart: i,
          contentStart: i,
          rawEnd: i,
          charIndexMap: [],
        });
        rows.push(currentRow);
        break;
      }
      continue;
    }

    if (i < len && csvText[i] === '\r') {
      i += 1;
      if (i < len && csvText[i] === '\n') {
        i += 1;
      }
      rows.push(currentRow);
      currentRow = [];
      continue;
    }

    if (i < len && csvText[i] === '\n') {
      i += 1;
      rows.push(currentRow);
      currentRow = [];
      continue;
    }
  }

  return rows;
}

/**
 * Detects PII inside each parsed CSV cell independently so commas/quotes/newlines
 * never create cross-column false positives, and maps matches back to exact offsets
 * in the original CSV string.
 */
export function detectPIIInCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    return { entities: [], meta: { rowCount: 0, columnCount: 0 } };
  }

  const rows = parseCSVWithSpans(csvText);
  const allEntities = [];
  let entityCounter = 0;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (!cell.value) continue;

      const cellDetections = detectPII(cell.value);
      for (const det of cellDetections) {
        const globalStart = cell.charIndexMap[det.start];
        const globalLastChar = cell.charIndexMap[det.end - 1];
        if (globalStart === undefined || globalLastChar === undefined) continue;

        entityCounter += 1;
        allEntities.push({
          ...det,
          id: `pii_${entityCounter}`,
          start: globalStart,
          end: globalLastChar + 1,
          rowIndex: r,
          colIndex: c,
        });
      }
    }
  }

  allEntities.sort((a, b) => a.start - b.start);

  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return {
    entities: allEntities,
    meta: {
      rowCount: rows.length,
      columnCount,
    },
  };
}
