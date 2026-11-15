import "./load-env";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db/mongoose";
import { syncAllIndexes } from "../src/lib/db/indexes";

async function main() {
  await connectDB();
  const collections = await syncAllIndexes();
  console.log("✅ Đã đồng bộ index cho:", collections.join(", "));
}

main()
  .catch((e) => {
    console.error("❌ Lỗi:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
