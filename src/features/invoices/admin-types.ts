import type { PaymentMethod, PaymentStatus } from "./constants";

export interface AdminInvoiceItemDTO {
  productId: string;
  code: string;
  name: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface AdminInvoiceDTO {
  id: string;
  code: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  note?: string;
  items: AdminInvoiceItemDTO[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdBy: string;
  createdAt: string;
}

export interface AdminInvoiceList {
  items: AdminInvoiceDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
