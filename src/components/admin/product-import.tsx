"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AlertTriangle, PackageCheck, FileDown, FileSpreadsheet, Loader2, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { TemplateDownloadButton } from "@/components/admin/template-download-button";
import { Card } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { downloadFile, postFile } from "@/lib/client-api";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  IMPORT_MAX_BYTES, IMPORT_MAX_ROWS, formatIssue,
  type ImportAction, type ImportCommitResult, type ImportPreview, type ImportRowPreview,
} from "@/features/products/excel/types";

type Filter = "all" | ImportAction | "warning";
const PAGE = 200;

const ACTION_LABEL: Record<ImportAction, string> = { create: "Thêm mới", update: "Cập nhật", unchanged: "Không đổi", error: "Lỗi" };
const ACTION_BADGE: Record<ImportAction, "sage" | "rose" | "muted" | "solid"> = { create: "sage", update: "rose", unchanged: "muted", error: "solid" };

export function ProductImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<ImportCommitResult | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(PAGE);
  const [dragging, setDragging] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);

  function reset() {
    setFile(null); setPreview(null); setError(null); setResult(null); setFilter("all"); setShown(PAGE);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function choose(f: File | undefined | null) {
    if (!f) return;
    setResult(null); setPreview(null); setError(null); setFilter("all"); setShown(PAGE);
    if (!/\.xlsx$/i.test(f.name)) { setFile(null); return void setError("Chỉ nhận file Excel .xlsx. Hãy dùng file mẫu."); }
    if (f.size > IMPORT_MAX_BYTES) { setFile(null); return void setError("File quá lớn (tối đa 5MB)."); }
    setFile(f);
    setChecking(true);
    const r = await postFile<ImportPreview>("/api/admin/products/import/preview", f);
    setChecking(false);
    if (!r.ok || !r.data) return void setError(r.error ?? "Không đọc được file.");
    setPreview(r.data);
  }

  async function doImport() {
    if (!file) return;
    setImporting(true);
    const r = await postFile<ImportCommitResult>("/api/admin/products/import", file);
    setImporting(false);
    setConfirmOpen(false);
    if (!r.ok || !r.data) return void toast.error(r.error ?? "Nhập dữ liệu thất bại");
    setResult(r.data);
    setPreview(null);
    toast.success(`Đã nhập xong: thêm ${r.data.created}, cập nhật ${r.data.updated}`);
  }

  async function downloadErrors() {
    if (!file) return;
    setReportBusy(true);
    const r = await downloadFile("/api/admin/products/import/errors", { file, fallbackName: "dong-loi.xlsx" });
    setReportBusy(false);
    if (!r.ok) toast.error(r.error ?? "Không tải được file lỗi");
  }

  const s = preview?.summary;
  const importable = s ? s.create + s.update : 0;

  const rows = preview
    ? preview.rows.filter((r) => (filter === "all" ? true : filter === "warning" ? r.warnings.length > 0 : r.action === filter))
    : [];

  return (
    <div className="space-y-6">
      {/* Bước 1 */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Bước 1 · Tải file mẫu</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Điền dữ liệu từ dòng 2 ở sheet “Sản phẩm” (có danh sách thả xuống cho danh mục/tình trạng; xem sheet “Hướng dẫn”).
              Để trống cột <strong>Mã sản phẩm</strong> để thêm mới; điền mã có sẵn để cập nhật. Tối đa {IMPORT_MAX_ROWS.toLocaleString("vi-VN")} dòng / 5MB mỗi lần.
            </p>
          </div>
          <TemplateDownloadButton />
        </div>
      </Card>

      {/* Bước 2 */}
      {!result && (
        <Card>
          <h2 className="text-lg font-semibold">Bước 2 · Chọn file để kiểm tra</h2>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); void choose(e.dataTransfer.files[0]); }}
            className={cn("mt-4 flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors", dragging ? "border-rose bg-rose-soft/50" : "border-rose/40 bg-white")}
          >
            {checking ? (
              <><Loader2 className="size-8 animate-spin text-rose-dark" /><p className="mt-3 text-sm" role="status">Đang đọc và kiểm tra {file?.name}…</p></>
            ) : (
              <>
                <span className="flex size-12 items-center justify-center rounded-full bg-rose-soft text-rose-dark"><FileSpreadsheet className="size-6" /></span>
                <p className="mt-3 text-sm">{file ? <>Đã chọn: <strong>{file.name}</strong></> : "Kéo thả file .xlsx vào đây hoặc"}</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={importing}><Upload /> {file ? "Chọn file khác" : "Chọn file Excel"}</Button>
                  {file && <Button variant="ghost" onClick={reset} disabled={importing}><RotateCcw /> Làm lại</Button>}
                </div>
              </>
            )}
            <input ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" aria-label="Chọn file Excel"
              onChange={(e) => void choose(e.target.files?.[0])} />
          </div>
          {error && (
            <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> <span>{error}</span>
            </div>
          )}
        </Card>
      )}

      {/* Bước 3: xem trước */}
      {preview && s && (
        <Card>
          <h2 className="text-lg font-semibold">Bước 3 · Xem trước &amp; xác nhận</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {preview.fileName} · sheet “{preview.sheetName}”. Chưa có gì được ghi vào hệ thống. Dòng lỗi sẽ bị bỏ qua, dòng hợp lệ vẫn được nhập.
          </p>

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Lọc dòng">
            {([
              ["all", "Tất cả", s.total], ["create", "Thêm mới", s.create], ["update", "Cập nhật", s.update],
              ["unchanged", "Không đổi", s.unchanged], ["error", "Lỗi", s.error], ["warning", "Cảnh báo", s.warning],
            ] as [Filter, string, number][]).map(([key, label, n]) => (
              <button key={key} type="button" aria-pressed={filter === key} onClick={() => { setFilter(key); setShown(PAGE); }}
                className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  filter === key ? "border-rose bg-rose text-white" : "border-border bg-white hover:bg-rose-soft",
                  n === 0 && filter !== key && "opacity-50")}>
                {label} <span className="font-semibold">{n}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 max-h-[32rem] overflow-auto rounded-2xl border border-border">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-border bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-medium">Dòng</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Kết quả</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Mã</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Tên sản phẩm</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Danh mục</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Giá</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {rows.slice(0, shown).map((r) => <PreviewRow key={r.row} r={r} />)}
                {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Không có dòng nào.</td></tr>}
              </tbody>
            </table>
          </div>
          {rows.length > shown && (
            <div className="mt-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => setShown((n) => n + PAGE)}>Hiển thị thêm ({rows.length - shown} dòng)</Button>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm" aria-live="polite">
              {importable > 0
                ? <>Sẽ nhập <strong>{importable}</strong> dòng hợp lệ{s.error > 0 && <> · bỏ qua <strong className="text-destructive">{s.error}</strong> dòng lỗi</>}.</>
                : s.unchanged > 0 && s.error === 0 ? "Không có thay đổi nào cần nhập." : "Không có dòng hợp lệ để nhập. Hãy sửa lỗi trong file rồi chọn lại."}
            </p>
            <div className="flex flex-wrap gap-2">
              {s.error > 0 && (
                <Button variant="outline" onClick={downloadErrors} disabled={reportBusy}>
                  {reportBusy ? <Loader2 className="animate-spin" /> : <FileDown />} Tải file dòng lỗi
                </Button>
              )}
              <Button onClick={() => setConfirmOpen(true)} disabled={importable === 0 || importing}>Nhập {importable} dòng hợp lệ</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Kết quả */}
      {result && (
        <Card>
          <div className="flex items-start gap-3">
            <PackageCheck className="mt-0.5 size-6 shrink-0 text-sage-dark" />
            <div>
              <h2 className="text-lg font-semibold">Đã nhập xong</h2>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Thêm mới: <strong>{result.created}</strong> sản phẩm</li>
                <li>Cập nhật: <strong>{result.updated}</strong> sản phẩm</li>
                {result.unchanged > 0 && <li>Không thay đổi: <strong>{result.unchanged}</strong> sản phẩm</li>}
                {result.skipped > 0 && <li className="text-destructive">Bỏ qua do lỗi dữ liệu: <strong>{result.skipped}</strong> dòng</li>}
              </ul>
              {result.failed.length > 0 && (
                <div role="alert" className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <p className="font-medium">Một số dòng không ghi được:</p>
                  <ul className="mt-1 list-disc pl-5">{result.failed.map((f) => <li key={f.row}>Dòng {f.row}: {f.message}</li>)}</ul>
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/admin/products" className={buttonVariants()}>Xem danh sách sản phẩm</Link>
                {result.skipped > 0 && (
                  <Button variant="outline" onClick={downloadErrors} disabled={reportBusy}>
                    {reportBusy ? <Loader2 className="animate-spin" /> : <FileDown />} Tải file dòng lỗi
                  </Button>
                )}
                <Button variant="ghost" onClick={reset}><RotateCcw /> Nhập file khác</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} loading={importing} onConfirm={doImport}
        title="Xác nhận nhập dữ liệu?" confirmLabel="Nhập dữ liệu"
        description={
          <>
            Sẽ thêm mới <strong className="text-brown">{s?.create ?? 0}</strong> và cập nhật <strong className="text-brown">{s?.update ?? 0}</strong> sản phẩm
            {(s?.update ?? 0) > 0 && " (dòng cập nhật sẽ ghi đè toàn bộ thông tin cũ của sản phẩm)"}
            {(s?.error ?? 0) > 0 && <>; bỏ qua {s?.error} dòng lỗi</>}.
          </>
        } />
    </div>
  );
}

function PreviewRow({ r }: { r: ImportRowPreview }) {
  return (
    <tr className={r.action === "error" ? "bg-destructive/5 align-top" : "align-top"}>
      <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{r.row}</td>
      <td className="px-3 py-2.5"><Badge variant={ACTION_BADGE[r.action]}>{ACTION_LABEL[r.action]}</Badge></td>
      <td className="px-3 py-2.5 font-mono text-xs">{r.code || "—"}</td>
      <td className="max-w-[16rem] px-3 py-2.5 font-medium">{r.name || <span className="text-muted-foreground">(trống)</span>}</td>
      <td className="px-3 py-2.5">{r.categoryName || "—"}</td>
      <td className="whitespace-nowrap px-3 py-2.5 text-right">
        {r.price != null ? (
          r.salePrice != null ? <><span className="font-medium text-rose-dark">{formatVND(r.salePrice)}</span><span className="block text-xs text-muted-foreground line-through">{formatVND(r.price)}</span></> : formatVND(r.price)
        ) : "—"}
      </td>
      <td className="min-w-[16rem] px-3 py-2.5">
        {r.errors.length > 0 && <ul className="space-y-0.5 text-destructive">{r.errors.map((e, i) => <li key={i}>• {formatIssue(e)}</li>)}</ul>}
        {r.warnings.length > 0 && <ul className={cn("space-y-0.5 text-amber-700", r.errors.length > 0 && "mt-1")}>{r.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}</ul>}
      </td>
    </tr>
  );
}
