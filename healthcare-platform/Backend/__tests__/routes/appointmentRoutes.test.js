// Backend/__tests__/routes/appointmentRoutes.test.js
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");

// 1. Mock models
jest.mock("../../models/Appointment");
jest.mock("../../models/User");

const Appointment = require("../../models/Appointment");
const User = require("../../models/User");

// 2. Stub out auth so we don’t need real JWTs
jest.mock("../../middleware/authMiddleware", () => ({
  protect: (req, res, next) => {
    // simulate a logged-in patient with a location
    req.user = { _id: "u1", role: "patient", location: "LOC1" };
    next();
  },
  doctorAuth: (req, res, next) => next(),
}));

// 3. Bring in your real routes
const appointmentRoutes = require("../../routes/appointmentRoutes");

describe("Appointment API routes", () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(bodyParser.json());
    app.use("/api/appointments", appointmentRoutes);
  });

  afterEach(() => jest.resetAllMocks());

  describe("GET /api/appointments", () => {
    it("returns 200 + the patient’s appointments", async () => {
      const fakeList = [
        { _id: "a1", date: "2025-05-10", time: "10:00", patient: { _id: "u1" } },
      ];
      // Controller does: await Appointment.find({ "patient._id": req.user._id });
      Appointment.find.mockResolvedValue(fakeList);

      const res = await request(app).get("/api/appointments");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(fakeList);
      expect(Appointment.find).toHaveBeenCalledWith({ "patient._id": "u1" });
    });

    it("handles DB errors with a 500", async () => {
      Appointment.find.mockRejectedValue(new Error("DB down"));

      const res = await request(app).get("/api/appointments");

      expect(res.status).toBe(500);
    });
  });

  describe("POST /api/appointments", () => {
    it("creates a new appointment and returns 201 + object", async () => {
      const dto = { date: "2025-06-01", time: "14:00", message: "notes" };
      // Controller calls User.findOne and Appointment.findOne before create
      const doctor = { _id: "d1", firstName: "Doc", lastName: "Tor", email: "d@e", location: "LOC1" };
      User.findOne.mockResolvedValue(doctor);
      Appointment.findOne.mockResolvedValue(null);

      const created = {
        _id: "a2",
        patient: { _id: "u1", location: "LOC1" },
        doctor,
        date: dto.date,
        time: dto.time,
        notes: dto.message,
      };
      Appointment.create.mockResolvedValue(created);

      const res = await request(app)
        .post("/api/appointments")
        .send(dto);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(created);
      expect(User.findOne).toHaveBeenCalledWith({ role: "doctor", location: "LOC1" });
      expect(Appointment.findOne).toHaveBeenCalledWith({
        "doctor._id": "d1",
        date: dto.date,
        time: dto.time,
      });
      expect(Appointment.create).toHaveBeenCalledWith(expect.objectContaining({
        date: dto.date,
        time: dto.time,
        notes: dto.message,
      }));
    });

    it("rejects missing date/time with 400", async () => {
      const res = await request(app).post("/api/appointments").send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Please provide both date and time." });
    });
  });

  describe("DELETE /api/appointments/:id", () => {
    it("cancels an appointment and returns success message", async () => {
      // Controller first does Appointment.findById, then findByIdAndDelete
      const existing = { patient: { _id: "u1" }, doctor: { _id: "d1" } };
      Appointment.findById.mockResolvedValue(existing);
      Appointment.findByIdAndDelete.mockResolvedValue({ _id: "a1" });

      const res = await request(app).delete("/api/appointments/a1");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Appointment cancelled successfully" });
      expect(Appointment.findByIdAndDelete).toHaveBeenCalledWith("a1");
    });

    it("returns 404 if appointment not found", async () => {
      Appointment.findById.mockResolvedValue(null);

      const res = await request(app).delete("/api/appointments/a1");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Appointment not found" });
    });
  });
});
