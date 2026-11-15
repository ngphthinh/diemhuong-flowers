// Tách riêng khỏi model.ts để Client Component có thể import mà không kéo mongoose vào bundle trình duyệt.
export const AVAILABILITY = ["IN_STOCK", "OUT_OF_STOCK"] as const;
export type Availability = (typeof AVAILABILITY)[number];
