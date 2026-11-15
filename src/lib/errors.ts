/** Xung đột nghiệp vụ (trùng tên, danh mục không tồn tại...) -> API trả 409 kèm tên trường lỗi. */
export class ConflictError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ConflictError";
  }
}

/** Lỗi trùng khóa unique của MongoDB (E11000). */
export function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}
