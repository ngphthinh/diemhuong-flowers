/**
 * Kiểm thử logic Excel thuần (xlsx/zip/chuyển đổi giá trị/file mẫu) — KHÔNG cần MongoDB.
 *   npm run verify:excel
 * Chạy bằng `tsx --conditions=react-server` để các module `server-only` import được ngoài Next.
 */
import assert from "node:assert/strict";
import { buildWorkbook } from "@/lib/xlsx/write";
import { readWorkbook, XlsxError } from "@/lib/xlsx/read";
import { createZip, readZip } from "@/lib/xlsx/zip";
import { COLUMNS } from "@/features/products/excel/columns";
import { analyzeWorkbookBuffer, ImportFileError, parseMoney } from "@/features/products/excel/parse";
import { buildTemplateWorkbook, datedFileName } from "@/features/products/excel/build";

let passed = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}\n`, e);
    process.exitCode = 1;
  }
}

const HEADERS = COLUMNS.map((c) => c.header);
const IMG = "https://placehold.co/800x1000/png?text=x";
type Row = (string | number | boolean | null)[];
/** Dựng file .xlsx giả lập người dùng nhập: tiêu đề + các dòng. */
const sheetFile = (rows: Row[]) => buildWorkbook([{ name: "Sản phẩm", rows: [HEADERS, ...rows] }]);
const row = (o: Partial<Record<(typeof COLUMNS)[number]["key"], string | number | boolean | null>>): Row =>
  COLUMNS.map((c) => (c.key in o ? o[c.key]! : c.key === "images" ? IMG : null));
const ok = (o: Parameters<typeof row>[0]) => row({ name: "Hoa test", description: "Mô tả", price: 100000, category: "Hoa sinh nhật", ...o });

// Dữ liệu giả lập danh mục / sản phẩm hiện có (không cần database)
const FIXTURE_CTX = {
  categories: [
    { id: "a00000000000000000000001", name: "Hoa sinh nhật", isActive: true },
    { id: "a00000000000000000000002", name: "Hoa kỷ niệm", isActive: true },
  ],
  products: [],
};

function analyze(rows: Row[]) {
  return analyzeWorkbookBuffer(sheetFile(rows), FIXTURE_CTX, "test.xlsx");
}

async function main() {
  console.log("XLSX (zip / ghi / đọc)");
  await test("ghi rồi đọc lại giữ nguyên unicode, xuống dòng, ký tự XML, số, bool", () => {
    const rows = [["Tên", "Giá", "Ghi chú", "Cờ"], ["Hồng đỏ & <trắng> \"A\" 'B'", 1890000, "dòng 1\ndòng 2", true], ["=SUM(A1)", 0.5, "  khoảng trắng  ", false], ["😀 emoji", -3, "", null]];
    const back = readWorkbook(buildWorkbook([{ name: "S", rows }]));
    assert.equal(back[0].name, "S");
    assert.deepEqual(back[0].rows[0], rows[0]);
    assert.deepEqual(back[0].rows[1], rows[1]);
    assert.equal(back[0].rows[2][0], "=SUM(A1)"); // vẫn là chuỗi, không phải công thức
    assert.equal(back[0].rows[2][2], "  khoảng trắng  ");
    assert.deepEqual(back[0].rows[3], ["😀 emoji", -3]); // ô trống ở cuối dòng không được tạo
  });
  await test("ký tự điều khiển bị loại, không làm hỏng file", () => {
    const back = readWorkbook(buildWorkbook([{ name: "S", rows: [["a\u0001b\u0000c", "ok"]] }]));
    assert.equal(back[0].rows[0][0], "abc");
  });
  await test("tên sheet nhiều + ký tự cấm được làm sạch", () => {
    const back = readWorkbook(buildWorkbook([{ name: "A:B/C", rows: [["x"]] }, { name: "Sheet2", rows: [["y"]] }]));
    assert.deepEqual(back.map((s) => s.name), ["A B C", "Sheet2"]);
  });
  await test("hàng trống ở giữa giữ nguyên số dòng", () => {
    const back = readWorkbook(buildWorkbook([{ name: "S", rows: [["h"], [], [], ["d"]] }]));
    assert.equal(back[0].rows.length, 4);
    assert.equal(back[0].rows[3][0], "d");
  });
  await test("file không phải xlsx / hỏng / rỗng → XlsxError", () => {
    for (const bad of [Buffer.from("tên,giá\nA,1"), Buffer.alloc(0), Buffer.from("PK\x03\x04garbage-garbage-garbage")]) {
      assert.throws(() => readWorkbook(bad), XlsxError);
    }
    const good = buildWorkbook([{ name: "S", rows: [["x"]] }]);
    assert.throws(() => readWorkbook(good.subarray(0, good.length - 30)), XlsxError); // cắt cụt
  });
  await test("zip có entry khai báo nhỏ nhưng giải nén lớn (zip-bomb) bị chặn", () => {
    const real = Buffer.alloc(5_000_000, 0x61);
    const z = createZip([{ name: "[Content_Types].xml", data: Buffer.from("<x/>") }, { name: "xl/workbook.xml", data: real }]);
    // Sửa kích thước khai báo trong central directory xuống 100 byte
    const cd = z.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]), z.indexOf("xl/workbook.xml") - 60);
    z.writeUInt32LE(100, cd + 24);
    assert.throws(() => readWorkbook(z), XlsxError);
  });

  console.log("Chuyển đổi giá trị");
  await test("parseMoney", () => {
    assert.equal(parseMoney(690000), 690000);
    assert.equal(parseMoney("690000"), 690000);
    assert.equal(parseMoney("1.290.000"), 1290000);
    assert.equal(parseMoney("1,290,000đ"), 1290000);
    assert.equal(parseMoney("1 290 000 VND"), 1290000);
    assert.equal(parseMoney(""), undefined);
    assert.equal(parseMoney(null), undefined);
    assert.equal(parseMoney("abc"), "invalid");
    assert.equal(parseMoney("12k"), "invalid");
  });
  await test("datedFileName theo giờ Việt Nam", () => {
    assert.equal(datedFileName("san-pham", new Date("2026-11-15T07:52:00Z")), "san-pham_2026-11-15_1452.xlsx");
    assert.equal(datedFileName("san-pham", new Date("2026-12-31T18:05:00Z")), "san-pham_2027-01-01_0105.xlsx");
  });

  console.log("Kiểm tra dữ liệu từng dòng");
  await test("dòng hợp lệ → create, danh mục khớp không phân biệt dấu/hoa-thường/khoảng trắng", () => {
    const a = analyze([ok({ category: "  HOA SINH NHAT " })]);
    assert.equal(a.ready.length, 1);
    assert.equal(a.ready[0].action, "create");
    assert.equal(a.ready[0].input.categoryId, FIXTURE_CTX.categories[0].id);
  });
  await test("thiếu tên → dòng lỗi, không nằm trong danh sách sẵn sàng ghi", () => {
    const a = analyze([ok({ name: "" }), ok({ name: "Hợp lệ" })]);
    assert.equal(a.ready.length, 1);
    assert.equal(a.preview.summary.error, 1);
  });

  console.log("File mẫu");
  await test("file mẫu: đúng tiêu đề, 3 sheet, có dropdown, đọc lại được", () => {
    const cats = [{ name: "Hoa sinh nhật", isActive: true }, { name: "Hoa kỷ niệm", isActive: true }];
    const buf = buildTemplateWorkbook(cats);
    const sheets = readWorkbook(buf);
    assert.deepEqual(sheets.map((s) => s.name), ["Sản phẩm", "Hướng dẫn", "Danh mục"]);
    assert.deepEqual(sheets[0].rows[0], HEADERS);
    assert.equal(sheets[0].rows.length, 1);
    assert.equal(sheets[2].rows.length, 1 + cats.length);
    const sheet1 = readZip(buf).get("xl/worksheets/sheet1.xml")!.toString("utf8");
    assert.equal((sheet1.match(/<dataValidation /g) ?? []).length, 4);
    assert.throws(() => analyzeWorkbookBuffer(buf, { categories: [], products: [] }), (e) => e instanceof ImportFileError && /không có dòng dữ liệu/.test(e.message));
  });
  await test("file mẫu khi chưa có danh mục vẫn tạo được", () => {
    assert.ok(readWorkbook(buildTemplateWorkbook([])).length === 3);
  });

  console.log(`\n${passed} kiểm thử đạt${process.exitCode ? " — CÓ LỖI" : ""}`);
}

main();
