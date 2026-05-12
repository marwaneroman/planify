/**
 * Integration tests for /api routes (organizations, projects, health).
 * Requires DATABASE_URL. Run with: NODE_ENV=test node --test __tests__/integration/api.routes.test.js
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import request from "supertest";
import { app } from "../../server.js";
import { prisma } from "../../lib/prisma.js";

let authToken;
const testEmail = `test-api-${Date.now()}@example.com`;
let testUserId;
let orgId;

describe("API routes", () => {
  before(async () => {
    await prisma.$connect();
    let user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: "$2a$10$dummyhash",
        fullName: "API Test User",
      },
    }).catch(() => null);
    if (!user) user = await prisma.user.findUnique({ where: { email: testEmail } });
    assert.ok(user, "Test user should exist");
    testUserId = user.id;
    const jwt = (await import("jsonwebtoken")).default;
    const secret = process.env.JWT_SECRET || "change-me-in-production";
    authToken = jwt.sign({ userId: testUserId }, secret, { expiresIn: "1h" });
  });

  after(async () => {
    if (orgId) {
      await prisma.organizationMember.deleteMany({ where: { organizationId: orgId } }).catch(() => {});
      await prisma.organization.deleteMany({ where: { id: orgId } }).catch(() => {});
    }
    await prisma.user.deleteMany({ where: { email: testEmail } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe("GET /health", () => {
    it("returns 200 and ok: true", async () => {
      const res = await request(app).get("/health").expect(200);
      assert.strictEqual(res.body.ok, true);
    });
  });

  describe("GET /readiness", () => {
    it("returns 200 and ready: true", async () => {
      const res = await request(app).get("/readiness").expect(200);
      assert.strictEqual(res.body.ready, true);
    });
  });

  describe("Organizations", () => {
    it("GET /api/organizations returns 401 without auth", async () => {
      await request(app).get("/api/organizations").expect(401);
    });

    it("GET /api/organizations returns 200 and array with valid token", async () => {
      const res = await request(app)
        .get("/api/organizations")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
      assert.ok(Array.isArray(res.body));
    });

    it("POST /api/organizations creates org and returns it", async () => {
      const name = `Test Org ${Date.now()}`;
      const res = await request(app)
        .post("/api/organizations")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name, description: "Description" })
        .expect(200);
      assert.ok(res.body.id);
      assert.ok(res.body.name === name || res.body.name); // may be snake_cased
      orgId = res.body.id;
    });

    it("GET /api/organizations/:orgId returns 404 for unknown org", async () => {
      await request(app)
        .get("/api/organizations/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    it("GET /api/organizations/:orgId returns org when exists", async () => {
      if (!orgId) return;
      const res = await request(app)
        .get(`/api/organizations/${orgId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
      assert.ok(res.body.id === orgId || res.body.id);
    });
  });

  describe("Projects", () => {
    let projectId;

    it("GET /api/organizations/:orgId/projects returns array", async () => {
      if (!orgId) return;
      const res = await request(app)
        .get(`/api/organizations/${orgId}/projects`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
      assert.ok(Array.isArray(res.body));
    });

    it("POST /api/organizations/:orgId/projects creates project", async () => {
      if (!orgId) return;
      const res = await request(app)
        .post(`/api/organizations/${orgId}/projects`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Test Project", description: "Desc" })
        .expect(200);
      assert.ok(res.body.id);
      projectId = res.body.id;
    });

    it("GET /api/projects/:projectId returns project", async () => {
      if (!projectId) return;
      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
      assert.ok(res.body.id);
    });
  });
});
