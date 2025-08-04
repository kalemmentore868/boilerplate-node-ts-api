// tests/analytics.test.ts
import request from "supertest";
import app from "../../app";

const adminEmail = process.env.ADMIN_EMAIL!;
const adminPassword = process.env.ADMIN_PASSWORD!;

describe("Analytics routes", () => {
  let adminToken: string;

  beforeAll(async () => {
    // Log in as admin to get token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: adminEmail, password: adminPassword });
    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.data.token;
  });

  it("401 when no token provided", async () => {
    const res = await request(app).get("/api/analytics");
    expect(res.status).toBe(401);
  });

  it("200 returns dashboard data structure", async () => {
    const res = await request(app)
      .get("/api/analytics")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");

    const { data } = res.body;
    // totalCustomers should be a number
    expect(typeof data.totalCustomers).toBe("number");

    // ordersByDay should be an array of { day: string, count: number }
    expect(Array.isArray(data.ordersByDay)).toBe(true);
    data.ordersByDay.forEach((entry: any) => {
      expect(typeof entry.day).toBe("string");
      expect(typeof entry.count).toBe("number");
    });

    // locationData should be an array of { country: string, count: number }
    expect(Array.isArray(data.locationData)).toBe(true);
    data.locationData.forEach((entry: any) => {
      expect(typeof entry.country).toBe("string");
      expect(typeof entry.count).toBe("number");
    });

    // typeDistribution should be an array of { category: string, count: number }
    expect(Array.isArray(data.typeDistribution)).toBe(true);
    data.typeDistribution.forEach((entry: any) => {
      expect(typeof entry.category).toBe("string");
      expect(typeof entry.count).toBe("number");
    });
  });
});
