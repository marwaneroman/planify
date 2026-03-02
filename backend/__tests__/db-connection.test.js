/**
 * Database connection test.
 * Run from backend folder: npm run test:db
 *
 * By default this test is optional locally (it will be skipped if a DATABASE_URL
 * is not configured or reachable). In CI, set REQUIRE_DB_TEST=true to enforce it.
 */
import test, { describe, it } from "node:test";
import assert from "node:assert";

import { prisma } from "../lib/prisma.js";

const REQUIRE_DB_TEST = process.env.REQUIRE_DB_TEST === "true";
const itDb = REQUIRE_DB_TEST ? it : it.skip;

test.after(() => prisma.$disconnect());

describe("Database connection", () => {
  it("should have DATABASE_URL set", () => {
    assert.ok(
      process.env.DATABASE_URL,
      "DATABASE_URL must be set for DB tests (e.g. in .env.test or CI env)"
    );
  });

  itDb("should establish connection via Prisma client", async () => {
    await prisma.$connect();
    assert.ok(true, "Connected successfully");
  });

  itDb("should execute a simple query", async () => {
    const result = await prisma.$queryRaw`SELECT 1 as value`;
    assert.strictEqual(result[0]?.value, 1, "Query should return 1");
  });
});
