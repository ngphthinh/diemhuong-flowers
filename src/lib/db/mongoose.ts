import mongoose from "mongoose";
import { getServerEnv } from "@/lib/env";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Cache connection trên globalThis để tránh tạo nhiều kết nối khi hot-reload / serverless
const globalWithMongoose = globalThis as typeof globalThis & { _mongoose?: MongooseCache };
const cache: MongooseCache = (globalWithMongoose._mongoose ??= { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    const env = getServerEnv();
    if (!env.MONGODB_URI) throw new Error("MONGODB_URI is required");
    mongoose.set("strictQuery", true);
    // Chống NoSQL injection: KHÔNG truyền object thô từ request vào query. Mọi input đều đi qua Zod
    // (chuỗi/số/enum) rồi mới dựng filter ở service. Không bật `sanitizeFilter` toàn cục vì nó
    // sẽ biến các toán tử hợp lệ do server dựng ($in, $regex, $expr...) thành $eq.
    cache.promise = mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB,
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}
