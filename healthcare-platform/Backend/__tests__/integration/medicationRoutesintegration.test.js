// Backend/__tests__/integration/medicationRoutes.integration.test.js
const express = require("express");
const request = require("supertest");

// 1) Stub out auth middleware so protect always attaches a valid patient
jest.mock("../../middleware/authMiddleware", () => ({
  protect: (req, _res, next) => {
    // 24-hex string + patient role
    req.user = { _id: "aaaaaaaaaaaaaaaaaaaaaaaa", role: "patient" };
    next();
  },
  doctorAuth: (_req, _res, next) => next(),
}));

// 2) Mock Medication model: make find().sort() resolve to our fake data
jest.mock("../../models/Medication");
const Medication = require("../../models/Medication");

// 3) Mount medicationRoutes on a fresh Express app
const medicationRoutes = require("../../routes/medicationRoutes");
const app = express();
app.use(express.json());
app.use("/api/medications", medicationRoutes);

describe("GET /api/medications (integration)", () => {
  beforeAll(() => {
    // chain find().sort()
    Medication.find.mockReturnValue({
      sort: () => Promise.resolve([{ _id: "m1", name: "MedA" }]),
    });
  });

  it("returns 200 and the mocked medication list", async () => {
    const res = await request(app).get("/api/medications");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ _id: "m1", name: "MedA" }]);
  });
});
