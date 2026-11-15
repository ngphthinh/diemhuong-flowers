import { nextSequence } from "@/features/counters/model";
import { formatInvoiceCode } from "./model";

/** Sinh mã hóa đơn duy nhất, tăng dần: HD-000001, HD-000002... */
export async function generateInvoiceCode(): Promise<string> {
  return formatInvoiceCode(await nextSequence("invoice"));
}
