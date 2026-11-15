import { config } from "dotenv";
import path from "node:path";

// Ưu tiên .env.local (chuẩn Next.js), sau đó .env
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });
