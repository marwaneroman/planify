import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

// Load environment file based on NODE_ENV, falling back to .env in the backend dir.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = process.env.NODE_ENV || "development";
const envFiles = [`.env.${env}`, ".env"];

for (const file of envFiles) {
  const fullPath = path.resolve(__dirname, "..", file);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath, override: true });
    break;
  }
}

export const prisma = new PrismaClient();
