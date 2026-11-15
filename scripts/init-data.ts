import "./load-env";
import mongoose from "mongoose";
import { describeInitResult, initData } from "../src/lib/db/init-data";

/**
 * Chạy thủ công bước khởi tạo dữ liệu (cùng logic với lúc server khởi động):
 *   npm run db:init
 * Chỉ seed nơi collection đang trống; database đã có dữ liệu thì không thay đổi gì.
 */
initData()
  .then((r) => console.log(`✅ ${describeInitResult(r)}`))
  .catch((e) => {
    console.error("❌ Lỗi:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
