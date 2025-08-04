// tests/auth.test.ts
import request from "supertest";
import app from "../../app"; // <-- path to your app.ts
import { db } from "../../db";
import { Users } from "../../db/schema";
import { eq } from "drizzle-orm";

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

describe("Auth routes", () => {
  let adminToken: string;
  let registeredUserId: string;

  beforeAll(async () => {
    // 1️⃣ Login with your real admin credentials to get a token
    const loginRes = await request(app).post("/api/auth/login").send({
      email: adminEmail,
      password: adminPassword,
    });
    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    if (registeredUserId) {
      await db.delete(Users).where(eq(Users.id, registeredUserId)).execute();
    }
  });

  describe("POST /api/auth/register", () => {
    it("201 when valid payload + admin token", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "newuser@test.com",
          password: "password123",
          username: "newuser",
          role: "manager",
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.email).toBe("newuser@test.com");
      registeredUserId = res.body.data.id;
    });

    it("400 when missing email/password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ username: "oops" });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/invalid input/i);
    });

    it("401 when no token provided", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "noauth@test.com",
        password: "doesntmatter",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/login", () => {
    it("200 & returns token on correct creds", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: adminEmail,
        password: adminPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("token");
    });

    it("400 when missing fields", async () => {
      const res = await request(app).post("/api/auth/login").send({});
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Invalid input:/i);
    });

    it("401 when invalid password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "loginuser@test.com",
        password: "wrongpass",
      });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/invalid credentials/i);
    });
  });
});
