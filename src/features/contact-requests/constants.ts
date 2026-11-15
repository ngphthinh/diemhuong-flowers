// Tách riêng khỏi model.ts để Client Component có thể import mà không kéo mongoose vào bundle trình duyệt.
export const CONTACT_STATUS = ["PENDING", "CONTACTED", "COMPLETED"] as const;
export type ContactStatus = (typeof CONTACT_STATUS)[number];
