// tests/customer.test.ts
import request from "supertest";
import app from "../../app";
import { db } from "../../db";
import { Customers } from "../../db/schema";
import { eq } from "drizzle-orm";

const adminEmail = process.env.ADMIN_EMAIL!;
const adminPassword = process.env.ADMIN_PASSWORD!;

describe("Customer routes", () => {
  let adminToken: string;
  let testCustomerId: string;

  beforeAll(async () => {
    // get admin JWT
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: adminEmail, password: adminPassword });
    expect(login.status).toBe(200);
    adminToken = login.body.data.token;
  });

  afterAll(async () => {
    // remove any customers we created
    await db
      .delete(Customers)
      .where(eq(Customers.email, "create@test.com"))
      .execute();
    await db
      .delete(Customers)
      .where(eq(Customers.email, "update@test.com"))
      .execute();
  });

  describe("GET /api/customers", () => {
    it("401 when no token", async () => {
      const res = await request(app).get("/api/customers");
      expect(res.status).toBe(401);
    });

    it("200 returns array when authenticated", async () => {
      const res = await request(app)
        .get("/api/customers")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("POST /api/customers", () => {
    it("201 creates a customer with valid data", async () => {
      const payload = {
        name: "Test User",
        email: "create@test.com",
        phone: "1234567890",
        street: "123 Test St",
        city: "Testville",
        state: "TS",
        postalCode: "00000",
        country: "Testland",
      };
      const res = await request(app)
        .post("/api/customers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.email).toBe(payload.email);
      testCustomerId = res.body.data.id;
    });

    it("400 when missing required fields", async () => {
      const res = await request(app)
        .post("/api/customers")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ email: "no_name@test.com" });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Invalid input/i);
    });
  });

  describe("GET /api/customers/:id", () => {
    it("200 returns the customer if it exists", async () => {
      const res = await request(app)
        .get(`/api/customers/${testCustomerId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testCustomerId);
    });

    it("404 when customer not found", async () => {
      const res = await request(app)
        .get("/api/customers/does-not-exist")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
      expect(res.body.error.message).toMatch(/not found/i);
    });
  });

  describe("PUT /api/customers/:id", () => {
    it("200 updates the customer", async () => {
      const updated = { email: "update@test.com", city: "New City" };
      const res = await request(app)
        .put(`/api/customers/${testCustomerId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updated);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(updated.email);
      expect(res.body.data.city).toBe(updated.city);
    });

    it("404 when updating non-existent customer", async () => {
      const res = await request(app)
        .put("/api/customers/nonexistent")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "No One" });
      expect(res.status).toBe(404);
      expect(res.body.error.message).toMatch(/not found/i);
    });
  });

  describe("DELETE /api/customers/:id", () => {
    it("401 when no token provided", async () => {
      const res = await request(app).delete(`/api/customers/${testCustomerId}`);
      expect(res.status).toBe(401);
    });

    it("404 when deleting a non-existent customer", async () => {
      const res = await request(app)
        .delete("/api/customers/nonexistent")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
      expect(res.body.error.message).toMatch(/not found/i);
    });

    it("200 deletes the customer when admin", async () => {
      const res = await request(app)
        .delete(`/api/customers/${testCustomerId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBe(testCustomerId);
    });
  });
});
