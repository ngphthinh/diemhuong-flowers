export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  fields?: Record<string, string>;
  extra?: Record<string, unknown>;
}

/** fetch JSON cho trang admin. Tự chuyển về trang đăng nhập khi session hết hạn (401). */
export async function apiRequest<T = unknown>(url: string, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; data?: T; error?: string; fields?: Record<string, string> } | null;
    if (res.status === 401 && !url.includes("/auth/")) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- điều hướng cứng để xóa sạch state khi hết phiên
      window.location.href = "/admin/login";
    }
    return { ok: res.ok, status: res.status, data: json?.data, error: json?.error, fields: json?.fields, extra: json ?? undefined };
  } catch {
    return { ok: false, status: 0, error: "Mất kết nối mạng. Kiểm tra internet và thử lại." };
  }
}

export async function uploadImage(file: File): Promise<ApiResult<{ url: string }>> {
  try {
    const form = new FormData();
    form.set("file", file);
    const res = await fetch("/api/admin/uploads", { method: "POST", body: form });
    const json = (await res.json().catch(() => null)) as { data?: { url: string }; error?: string } | null;
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- như trên
    if (res.status === 401) window.location.href = "/admin/login";
    return { ok: res.ok, status: res.status, data: json?.data, error: json?.error };
  } catch {
    return { ok: false, status: 0, error: "Mất kết nối mạng. Kiểm tra internet và thử lại." };
  }
}

// ---------- Excel (Phase 4) ----------

function fileNameFromResponse(res: Response, fallback: string): string {
  const cd = res.headers.get("content-disposition") ?? "";
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cd)?.[1];
  if (utf8) {
    try {
      return decodeURIComponent(utf8);
    } catch {
      /* dùng tên dự phòng */
    }
  }
  return /filename="([^"]+)"/i.exec(cd)?.[1] ?? fallback;
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function readError(res: Response): Promise<string> {
  const json = (await res.json().catch(() => null)) as { error?: string } | null;
  return json?.error ?? "Không tải được file. Vui lòng thử lại.";
}

/** Gửi file Excel (multipart) và nhận JSON — dùng cho preview / import. */
export async function postFile<T>(url: string, file: File): Promise<ApiResult<T>> {
  try {
    const form = new FormData();
    form.set("file", file);
    const res = await fetch(url, { method: "POST", body: form });
    const json = (await res.json().catch(() => null)) as { data?: T; error?: string } | null;
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- điều hướng cứng khi hết phiên
    if (res.status === 401) window.location.href = "/admin/login";
    return { ok: res.ok, status: res.status, data: json?.data, error: json?.error };
  } catch {
    return { ok: false, status: 0, error: "Mất kết nối mạng. Kiểm tra internet và thử lại." };
  }
}

/** Gọi endpoint trả file (GET/POST JSON/POST file) rồi lưu về máy. */
export async function downloadFile(
  url: string,
  opts: { json?: unknown; file?: File; fallbackName: string },
): Promise<{ ok: boolean; error?: string; fileName?: string; count?: number }> {
  try {
    let init: RequestInit = { method: "GET" };
    if (opts.file) {
      const form = new FormData();
      form.set("file", opts.file);
      init = { method: "POST", body: form };
    } else if (opts.json !== undefined) {
      init = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(opts.json) };
    }
    const res = await fetch(url, init);
    if (res.status === 401) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- điều hướng cứng khi hết phiên
      window.location.href = "/admin/login";
      return { ok: false, error: "Phiên đăng nhập đã hết hạn." };
    }
    if (!res.ok) return { ok: false, error: await readError(res) };
    const fileName = fileNameFromResponse(res, opts.fallbackName);
    saveBlob(await res.blob(), fileName);
    const count = Number(res.headers.get("x-export-count"));
    return { ok: true, fileName, count: Number.isFinite(count) && res.headers.has("x-export-count") ? count : undefined };
  } catch {
    return { ok: false, error: "Mất kết nối mạng. Kiểm tra internet và thử lại." };
  }
}
