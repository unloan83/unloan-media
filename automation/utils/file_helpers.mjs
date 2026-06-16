import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";

export async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

export async function readOptional(filePath, fallback = "") {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

export async function writeText(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${String(content).trimEnd()}\n`, "utf8");
}

export async function appendJsonLine(filePath, payload) {
  await ensureDir(path.dirname(filePath));
  await appendFile(filePath, `${JSON.stringify(payload)}\n`, "utf8");
}

export function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

export function rowsToObjects(text) {
  const rows = parseCsv(text.replace(/^\uFEFF/u, ""));
  if (rows.length === 0) {
    return [];
  }
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values, rowIndex) => ({
    index: rowIndex + 1,
    ...Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? "").trim()])),
  }));
}

export async function readCsvObjects(filePath) {
  return rowsToObjects(await readOptional(filePath));
}

export function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/u.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(rows) {
  if (rows.length === 0) {
    return "";
  }
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
}

export function toNumber(value) {
  const number = Number.parseFloat(String(value ?? "0").replace(/,/g, ""));
  return Number.isFinite(number) ? number : 0;
}
