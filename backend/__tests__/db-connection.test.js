/**
 * Database connection test.
 * Run from backend folder: npm run test:db
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import test, { describe, it } from "node:test";
import assert from "node:assert";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import { prisma } from "../lib/prisma.js";

test.after(() => prisma.$disconnect());

describe("Database connection", () => {
  it("should have DATABASE_URL set", () => {
    assert.ok(
      process.env.DATABASE_URL,
      "DATABASE_URL must be set in .env"
    );
  });

  it("should establish connection via Prisma client", async () => {
    await prisma.$connect();
    assert.ok(true, "Connected successfully");
  });

  it("should execute a simple query", async () => {
    const result = await prisma.$queryRaw`SELECT 1 as value`;
    assert.strictEqual(result[0]?.value, 1, "Query should return 1");
  });
});
