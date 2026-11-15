/**
 * Ghi file .xlsx (SpreadsheetML) tối giản, không phụ thuộc gói ngoài.
 * Hỗ trợ: nhiều sheet, độ rộng cột, dòng tiêu đề có style, cố định dòng đầu, xuống dòng trong ô,
 * ô số/chuỗi/bool, dropdown (data validation dạng danh sách), định dạng văn bản cho cả cột.
 * Chuỗi luôn ghi dạng text (inlineStr) nên giá trị bắt đầu bằng = + - @ KHÔNG bị Excel hiểu là công thức.
 */
import { createZip } from "./zip";

export type CellValue = string | number | boolean | null | undefined;

export interface SheetColumn {
  width?: number;
  /** Cả cột là văn bản (vd. mã sản phẩm) — tránh Excel tự đổi kiểu. */
  text?: boolean;
  /** Định dạng số, vd. "#,##0". */
  numberFormat?: "integer";
  wrap?: boolean;
}

export interface ListValidation {
  /** Cột (0-based). */
  col: number;
  /** Danh sách cố định (tổng độ dài ≤ 255 ký tự) HOẶC công thức tham chiếu vùng, vd. "'Danh mục'!$A$2:$A$50". */
  list: string[] | { ref: string };
  /** Số dòng dữ liệu áp dụng (mặc định 1000). */
  rows?: number;
  title?: string;
  message?: string;
}

export interface SheetInput {
  name: string;
  /** Dòng đầu tiên coi là tiêu đề (style đậm, nền hồng). */
  rows: CellValue[][];
  columns?: SheetColumn[];
  headerRows?: number;
  freezeHeader?: boolean;
  validations?: ListValidation[];
  /** Style riêng cho vài dòng (vd. dòng ghi chú). 0-based theo `rows`. */
  noteRows?: number[];
  /** Dòng tiêu đề có tô nền cảnh báo ở các cột này (0-based). */
  errorHeaderCols?: number[];
}

// Chỉ số style trong styles.xml bên dưới
const S = { DEFAULT: 0, HEADER: 1, WRAP: 2, INT: 3, TEXT: 4, NOTE: 5, HEADER_ERR: 6, TEXT_WRAP: 7 } as const;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts>
<fonts count="3">
<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
<font><i/><sz val="10"/><color rgb="FF6B5B57"/><name val="Calibri"/><family val="2"/></font>
</fonts>
<fills count="5">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFC4707F"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFBEFF1"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFC0392B"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFE5D5D8"/></left><right style="thin"><color rgb="FFE5D5D8"/></right><top style="thin"><color rgb="FFE5D5D8"/></top><bottom style="thin"><color rgb="FFE5D5D8"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="8">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

/** Ký tự điều khiển không hợp lệ trong XML 1.0 (trừ tab, LF, CR). */
// eslint-disable-next-line no-control-regex
const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

export function escapeXml(s: string): string {
  return s.replace(INVALID_XML, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** 0 -> A, 25 -> Z, 26 -> AA */
export function colLetter(index: number): string {
  let n = index;
  let s = "";
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

/** Tên sheet hợp lệ: ≤31 ký tự, không chứa : \ / ? * [ ] */
export function safeSheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31) || "Sheet";
}

function cellXml(ref: string, v: CellValue, style: number): string {
  const s = style ? ` s="${style}"` : "";
  if (v === null || v === undefined || v === "") return style ? `<c r="${ref}"${s}/>` : "";
  if (typeof v === "number") return Number.isFinite(v) ? `<c r="${ref}"${s}><v>${v}</v></c>` : "";
  if (typeof v === "boolean") return `<c r="${ref}"${s} t="b"><v>${v ? 1 : 0}</v></c>`;
  // Excel giới hạn 32767 ký tự/ô
  const text = escapeXml(v.length > 32000 ? v.slice(0, 32000) : v);
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
}

function sheetXml(sheet: SheetInput): string {
  const headerRows = sheet.headerRows ?? 1;
  const cols = sheet.columns ?? [];
  const noteRows = new Set(sheet.noteRows ?? []);
  const errCols = new Set(sheet.errorHeaderCols ?? []);
  const width = Math.max(1, ...sheet.rows.map((r) => r.length), cols.length);
  const lastRow = Math.max(1, sheet.rows.length);

  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`;
  xml += `<dimension ref="A1:${colLetter(width - 1)}${lastRow}"/>`;
  xml += `<sheetViews><sheetView workbookViewId="0"${sheet.freezeHeader && headerRows > 0 ? `><pane ySplit="${headerRows}" topLeftCell="A${headerRows + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft"/></sheetView>` : "/>"}</sheetViews>`;
  xml += `<sheetFormatPr defaultRowHeight="15"/>`;
  if (cols.length) {
    xml += "<cols>";
    cols.forEach((c, i) => {
      xml += `<col min="${i + 1}" max="${i + 1}" width="${c.width ?? 14}" customWidth="1"/>`;
    });
    xml += "</cols>";
  }

  xml += "<sheetData>";
  sheet.rows.forEach((row, r) => {
    const isHeader = r < headerRows;
    const isNote = noteRows.has(r);
    let cells = "";
    for (let c = 0; c < width; c++) {
      const col = cols[c];
      let style: number = S.DEFAULT;
      if (isHeader) style = errCols.has(c) ? S.HEADER_ERR : S.HEADER;
      else if (isNote) style = S.NOTE;
      else if (col?.text) style = col.wrap ? S.TEXT_WRAP : S.TEXT;
      else if (col?.numberFormat === "integer") style = S.INT;
      else if (col?.wrap) style = S.WRAP;
      cells += cellXml(`${colLetter(c)}${r + 1}`, row[c], style);
    }
    xml += `<row r="${r + 1}"${isHeader ? ' ht="32" customHeight="1"' : ""}>${cells}</row>`;
  });
  xml += "</sheetData>";

  const vals = sheet.validations ?? [];
  if (vals.length) {
    xml += `<dataValidations count="${vals.length}">`;
    for (const v of vals) {
      const L = colLetter(v.col);
      const from = headerRows + 1;
      const to = from + (v.rows ?? 1000) - 1;
      const formula = Array.isArray(v.list) ? `"${v.list.map((x) => x.replace(/"/g, '""')).join(",")}"` : v.list.ref;
      const prompt = v.message ? ` showInputMessage="1" promptTitle="${escapeXml((v.title ?? "").slice(0, 32))}" prompt="${escapeXml(v.message.slice(0, 255))}"` : "";
      xml += `<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorTitle="Giá trị không hợp lệ" error="Vui lòng chọn một giá trị trong danh sách."${prompt} sqref="${L}${from}:${L}${to}"><formula1>${escapeXml(formula)}</formula1></dataValidation>`;
    }
    xml += "</dataValidations>";
  }
  xml += `<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`;
  return xml;
}

export function buildWorkbook(sheets: SheetInput[]): Buffer {
  if (!sheets.length) throw new Error("Workbook cần ít nhất một sheet");
  const names = sheets.map((s) => safeSheetName(s.name));

  const entries = [
    {
      name: "[Content_Types].xml",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets
          .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
          .join("")}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
      ),
    },
    {
      name: "_rels/.rels",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      ),
    },
    {
      name: "xl/workbook.xml",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${names
          .map((n, i) => `<sheet name="${escapeXml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
          .join("")}</sheets></workbook>`,
      ),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
          .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
          .join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
      ),
    },
    { name: "xl/styles.xml", data: Buffer.from(STYLES_XML) },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: Buffer.from(sheetXml(s)) })),
  ];
  return createZip(entries);
}
