// Tách riêng để Client Component import được mà không kéo mongoose vào bundle trình duyệt.
export const PAYMENT_METHODS = ["CASH", "TRANSFER", "OTHER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["PAID", "UNPAID"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Tiền mặt",
  TRANSFER: "Chuyển khoản",
  OTHER: "Khác",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PAID: "Đã thanh toán",
  UNPAID: "Chưa thanh toán",
};
