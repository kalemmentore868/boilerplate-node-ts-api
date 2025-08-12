import request from "supertest";
import app from "../app";

it("returns ok + request id", async () => {
  const res = await request(app).get("/health");
  expect(res.status).toBe(200);
  expect(res.body.status).toBe("ok");
});
