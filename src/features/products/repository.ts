import { nextSequence } from "@/features/counters/model";
import { formatProductCode } from "./model";

/** Sinh mã sản phẩm duy nhất, tăng dần: HOA-000001, HOA-000002... */
export async function generateProductCode(): Promise<string> {
  const seq = await nextSequence("product");
  return formatProductCode(seq);
}
