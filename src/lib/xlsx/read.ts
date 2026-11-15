/**
 * Đọc file .xlsx tối giản, không phụ thuộc gói ngoài.
 * Đọc: workbook.xml (tên sheet), sharedStrings, inlineStr, số, bool, công thức (lấy giá trị cache).
 * Không đọc: định dạng, ngày (số serial được trả về dạng số), ô gộp.
 * Không bao giờ thực thi công thức/macro. File .xlsm/.xls cũ không được hỗ trợ.
 */
import { readZip, ZipError } from "./zip";

export type RawCell = string | number | boolean | null;

export interface ParsedSheet {
  name: string;
  /** rows[r][c], 0-based; ô trống = null. Hàng trống ở giữa vẫn giữ chỗ để số dòng khớp với Excel. */
  rows: RawCell[][];
}

export class XlsxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XlsxError";
  }
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodeXml(s: string): string {
  return s
    .replace(/&(?:#x([0-9a-fA-F]+)|#(\d+)|(amp|lt|gt|quot|apos));/g, (_m, hex: string, dec: string, name: string) => {
      if (name) return ENTITIES[name];
      const code = hex ? parseInt(hex, 16) : parseInt(dec, 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    })
    // Excel mã hóa ký tự điều khiển dạng _x000D_
    .replace(/_x([0-9A-Fa-f]{4})_/g, (_m, h: string) => String.fromCharCode(parseInt(h, 16)));
}

/** Gộp nội dung các thẻ <t> (bỏ qua phiên âm <rPh>). */
function textOf(xml: string): string {
  const cleaned = xml.replace(/<(?:\w+:)?rPh\b[\s\S]*?<\/(?:\w+:)?rPh>/g, "");
  let out = "";
  const re = /<(?:\w+:)?t\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:\w+:)?t>)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned))) out += m[1] ?? "";
  return decodeXml(out);
}

function attr(tag: string, name: string): string | undefined {
  const m = new RegExp(`\\b${name}="([^"]*)"`).exec(tag);
  return m ? decodeXml(m[1]) : undefined;
}

/** "AB12" -> { col: 27, row: 11 } (0-based) */
function parseRef(ref: string): { col: number; row: number } | null {
  const m = /^([A-Za-z]{1,3})(\d+)$/.exec(ref);
  if (!m) return null;
  let col = 0;
  for (const ch of m[1].toUpperCase()) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { col: col - 1, row: parseInt(m[2], 10) - 1 };
}

function parseSharedStrings(xml: string): string[] {
  const out: string[] = [];
  const re = /<(?:\w+:)?si\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:\w+:)?si>)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1] ? textOf(m[1]) : "");
  return out;
}

export interface ReadXlsxLimits {
  maxRows: number; // số dòng tối đa của mỗi sheet (kể cả dòng trống ở giữa)
  maxCols: number;
}
const DEFAULT_LIMITS: ReadXlsxLimits = { maxRows: 5000, maxCols: 60 };

function parseSheet(xml: string, shared: string[], limits: ReadXlsxLimits): RawCell[][] {
  const rows: RawCell[][] = [];
  const rowRe = /<(?:\w+:)?row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?row>)/g;
  let rm: RegExpExecArray | null;
  let autoRow = 0;
  while ((rm = rowRe.exec(xml))) {
    const rAttr = attr(rm[1], "r");
    const rowIdx = rAttr ? parseInt(rAttr, 10) - 1 : autoRow;
    autoRow = rowIdx + 1;
    if (rowIdx < 0) continue;
    if (rowIdx >= limits.maxRows) throw new XlsxError(`File có quá nhiều dòng (tối đa ${limits.maxRows} dòng).`);
    const body = rm[2];
    if (!body) continue;

    const cellRe = /<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g;
    let cm: RegExpExecArray | null;
    let autoCol = 0;
    while ((cm = cellRe.exec(body))) {
      const ref = attr(cm[1], "r");
      const pos = ref ? parseRef(ref) : null;
      const colIdx = pos ? pos.col : autoCol;
      autoCol = colIdx + 1;
      if (colIdx >= limits.maxCols) continue; // bỏ qua cột thừa phía xa bên phải
      const type = attr(cm[1], "t");
      const inner = cm[2] ?? "";

      let value: RawCell = null;
      if (type === "inlineStr") {
        value = textOf(inner);
      } else {
        const vm = /<(?:\w+:)?v\b[^>]*?>([\s\S]*?)<\/(?:\w+:)?v>/.exec(inner);
        const v = vm ? vm[1] : undefined;
        if (v !== undefined) {
          if (type === "s") value = shared[parseInt(v, 10)] ?? "";
          else if (type === "str") value = decodeXml(v);
          else if (type === "b") value = v.trim() === "1";
          else if (type === "e") value = null; // #N/A, #REF!... coi như trống
          else if (type === "d") value = decodeXml(v); // ISO date dạng chuỗi
          else {
            const n = Number(v);
            value = v.trim() !== "" && Number.isFinite(n) ? n : decodeXml(v);
          }
        }
      }
      if (value === null || value === "") continue;
      (rows[rowIdx] ??= [])[colIdx] = value;
    }
  }
  // Đảm bảo không có lỗ hổng "empty item" gây nhầm lẫn khi duyệt
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r) {
      rows[i] = [];
      continue;
    }
    for (let j = 0; j < r.length; j++) if (r[j] === undefined) r[j] = null;
  }
  return rows;
}

export function readWorkbook(buf: Buffer, limits: ReadXlsxLimits = DEFAULT_LIMITS): ParsedSheet[] {
  let files: Map<string, Buffer>;
  try {
    files = readZip(buf);
  } catch (e) {
    if (e instanceof ZipError) throw new XlsxError(`File không phải Excel (.xlsx) hợp lệ: ${e.message}`);
    throw e;
  }
  const wbXml = files.get("xl/workbook.xml");
  if (!wbXml || !files.has("[Content_Types].xml")) throw new XlsxError("File không phải Excel (.xlsx) hợp lệ.");

  const relsXml = files.get("xl/_rels/workbook.xml.rels")?.toString("utf8") ?? "";
  const relTarget = new Map<string, string>();
  for (const m of relsXml.matchAll(/<Relationship\b[^>]*?\/?>/g)) {
    const id = attr(m[0], "Id");
    const target = attr(m[0], "Target");
    if (id && target) {
      // Target có thể là "worksheets/sheet1.xml" hoặc tuyệt đối "/xl/worksheets/sheet1.xml"
      relTarget.set(id, target.startsWith("/") ? target.slice(1) : `xl/${target}`.replace(/xl\/\.\.\//, ""));
    }
  }

  const sstXml = files.get("xl/sharedStrings.xml")?.toString("utf8");
  const shared = sstXml ? parseSharedStrings(sstXml) : [];

  const sheets: ParsedSheet[] = [];
  for (const m of wbXml.toString("utf8").matchAll(/<(?:\w+:)?sheet\b[^>]*?\/?>/g)) {
    const name = attr(m[0], "name");
    const rid = /\br:id="([^"]*)"/.exec(m[0])?.[1] ?? /\bid="([^"]*)"/.exec(m[0])?.[1];
    const path = rid ? relTarget.get(rid) : undefined;
    const data = path ? files.get(path) : undefined;
    if (!name || !data) continue;
    sheets.push({ name, rows: parseSheet(data.toString("utf8"), shared, limits) });
  }
  if (!sheets.length) throw new XlsxError("File Excel không có sheet nào.");
  return sheets;
}
