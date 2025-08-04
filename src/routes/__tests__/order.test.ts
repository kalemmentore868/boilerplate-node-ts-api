// tests/order.test.ts
import request from "supertest";
import app from "../../app";
import { db } from "../../db";
import { Customers, Products, Orders, OrderItems } from "../../db/schema";
import { eq } from "drizzle-orm";

const adminEmail = process.env.ADMIN_EMAIL!;
const adminPassword = process.env.ADMIN_PASSWORD!;

describe("Order routes", () => {
  let adminToken: string;
  let testCustomerId: string;
  let testProductId: string;
  let createdOrderId: string;

  beforeAll(async () => {
    // 1️⃣ Login as admin
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: adminEmail, password: adminPassword });
    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.data.token;

    // 2️⃣ Seed a customer
    const cust = await db
      .insert(Customers)
      .values({
        name: "Order Test",
        email: "order@test.com",
        phone: "000",
        street: "1 Test Ln",
        city: "T",
        state: "ST",
        postalCode: "00000",
        country: "TC",
      })
      .returning();
    testCustomerId = cust[0].id;

    // 3️⃣ Seed a product
    const [prod] = await db
      .insert(Products)
      .values({
        name: "TestProd",
        description: "Test product", // optional
        price: "10.00",
        category: "trucks", // ← **must** be one of your enum values
        imageUrl: "", // optional
        stockQuantity: 100, // has default(0) but you can override
        // createdAt/updatedAt will defaultNow()
      })
      .returning();

    testProductId = prod.id;
  });

  afterAll(async () => {
    // delete orders/items
    await db
      .delete(OrderItems)
      .where(eq(OrderItems.orderId, createdOrderId))
      .execute();
    await db
      .delete(Orders)
      .where(eq(Orders.customerId, testCustomerId))
      .execute();

    // cleanup customer & product
    await db
      .delete(Customers)
      .where(eq(Customers.id, testCustomerId))
      .execute();
    await db.delete(Products).where(eq(Products.id, testProductId)).execute();
  });

  describe("GET /api/customers/:customerId/orders", () => {
    it("401 without token", async () => {
      const res = await request(app).get(
        `/api/customers/${testCustomerId}/orders`
      );
      expect(res.status).toBe(401);
    });

    it("200 returns array when logged in", async () => {
      const res = await request(app)
        .get(`/api/customers/${testCustomerId}/orders`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("POST /api/customers/:customerId/orders", () => {
    it("201 creates order with items", async () => {
      const payload = {
        status: "pending",
        deliveryStreet: "123 Main St",
        deliveryCity: "City",
        deliveryCountry: "Country",
        totalAmount: "20.00",
        items: [
          {
            productId: testProductId,
            quantity: 2,
            unitPrice: "10.00",
            totalPrice: "20.00",
          },
        ],
      };

      const res = await request(app)
        .post(`/api/customers/${testCustomerId}/orders`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty("id");
      createdOrderId = res.body.data.id;
    });

    it("400 when missing required fields", async () => {
      const res = await request(app)
        .post(`/api/customers/${testCustomerId}/orders`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/invalid option/i);
    });
  });

  describe("GET /api/customers/:customerId/orders/:id", () => {
    it("200 returns order with item data", async () => {
      const res = await request(app)
        .get(`/api/customers/${testCustomerId}/orders/${createdOrderId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.order.id).toBe(createdOrderId);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it("404 when order not found", async () => {
      const res = await request(app)
        .get(`/api/customers/${testCustomerId}/orders/nonexistent`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/customers/:customerId/orders/:id", () => {
    it("200 updates order status", async () => {
      const res = await request(app)
        .put(`/api/customers/${testCustomerId}/orders/${createdOrderId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "processing" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("processing");
    });

    it("404 when updating non-existent order", async () => {
      const res = await request(app)
        .put(`/api/customers/${testCustomerId}/orders/nonexistent`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "shipped" });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/customers/:customerId/orders/:id", () => {
    it("401 without token", async () => {
      const res = await request(app).delete(
        `/api/customers/${testCustomerId}/orders/${createdOrderId}`
      );
      expect(res.status).toBe(401);
    });

    it("200 deletes the order", async () => {
      const res = await request(app)
        .delete(`/api/customers/${testCustomerId}/orders/${createdOrderId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBe(createdOrderId);
    });

    it("404 when order already deleted", async () => {
      const res = await request(app)
        .delete(`/api/customers/${testCustomerId}/orders/${createdOrderId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});
