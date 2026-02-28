import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

// Always load .env from the backend directory so connection works regardless of cwd
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env"), override: true });

export const prisma = new PrismaClient();
