/**
 * Integration tests for /auth routes.
 * Requires DATABASE_URL (e.g. test DB or main DB in CI).
 * Run with: NODE_ENV=test node --test __tests__/integration/auth.api.test.js
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import request from "supertest";
import { app } from "../../server.js";
import { prisma } from "../../lib/prisma.js";

const testEmail = `test-auth-${Date.now()}@example.com`;
const testPassword = "TestPassword123";

describe("Auth API", () => {
  before(async () => {
    await prisma.$connect();
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe("POST /auth/register", () => {
    it("returns 400 when email is missing", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ password: "secret" })
        .expect(400);
      assert.ok(res.body.error?.includes("required") || res.body.error);
    });

    it("returns 400 when password is missing", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ email: "a@b.com" })
        .expect(400);
      assert.ok(res.body.error);
    });

    it("registers a new user and returns session", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({
          email: testEmail,
          password: testPassword,
          full_name: "Test User",
        })
        .expect(200);
      assert.ok(res.body.session?.access_token);
      assert.strictEqual(res.body.user?.email, testEmail);
      assert.ok(res.body.user?.user_metadata?.full_name === "Test User" || res.body.user?.user_metadata?.full_name === "");
    });

    it("returns 400 when registering same email again", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ email: testEmail, password: "other" })
        .expect(400);
      assert.ok(res.body.error?.toLowerCase().includes("already"));
    });
  });

  describe("POST /auth/login", () => {
    it("returns 400 when email or password missing", async () => {
      await request(app).post("/auth/login").send({}).expect(400);
      await request(app).post("/auth/login").send({ email: "a@b.com" }).expect(400);
    });

    it("returns 401 for wrong password", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: testEmail, password: "WrongPassword" })
        .expect(401);
      assert.ok(res.body.error);
    });

    it("returns 401 for unknown email", async () => {
      await request(app)
        .post("/auth/login")
        .send({ email: "nonexistent@example.com", password: "any" })
        .expect(401);
    });

    it("returns session for valid credentials", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: testEmail, password: testPassword })
        .expect(200);
      assert.ok(res.body.session?.access_token);
      assert.strictEqual(res.body.user?.email, testEmail);
    });
  });

  describe("GET /auth/me", () => {
    let token;

    it("returns 401 without Authorization header", async () => {
      await request(app).get("/auth/me").expect(401);
    });

    it("returns 401 with invalid token", async () => {
      await request(app)
        .get("/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("returns user when valid token provided", async () => {
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: testEmail, password: testPassword });
      token = loginRes.body.session?.access_token;
      assert.ok(token);

      const res = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      assert.strictEqual(res.body.user?.email, testEmail);
    });
  });
});
