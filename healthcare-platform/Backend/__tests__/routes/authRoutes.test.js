// Backend/__tests__/routes/authRoutes.test.js
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");

// Mock the User model and token util
jest.mock("../../models/User");
jest.mock("../../utils/generateToken");

const User = require("../../models/User");
const generateToken = require("../../utils/generateToken");

// Stub protect middleware
jest.mock("../../middleware/authMiddleware", () => ({
  protect: (req, res, next) => {
    req.user = { _id: "u1", role: "patient" };
    next();
  },
}));

const authRoutes = require("../../routes/authRoutes");

describe("Auth API routes", () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(bodyParser.json());
    app.use("/api/auth", authRoutes);
    // Global error handler to format thrown errors as { message }
    app.use((err, req, res, next) => {
      res.status(res.statusCode || 500).json({ message: err.message });
    });
  });

  afterEach(() => jest.resetAllMocks());

  describe("POST /api/auth/register", () => {
    it("returns 400 if user already exists", async () => {
      User.findOne.mockResolvedValue({ _id: "u1" });

      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "a@b.com" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "User already exists" });
    });

    it("creates a new user and returns 201 + JSON", async () => {
      User.findOne.mockResolvedValue(null);
      const fakeUser = {
        _id: "u1", firstName: "Alice", lastName: "Smith",
        email: "a@b.com", role: "patient", location: "LOC1"
      };
      User.create.mockResolvedValue(fakeUser);

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Alice", lastName: "Smith",
          email: "a@b.com", password: "pw",
          role: "patient", location: "LOC1"
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(fakeUser);
      expect(User.findOne).toHaveBeenCalledWith({ email: "a@b.com" });
      expect(User.create).toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/login", () => {
    it("returns 200 + JSON with token on valid creds", async () => {
      const userInstance = {
        _id: "u1", firstName: "A", lastName: "B",
        email: "x@y.com", role: "patient", location: "LOC1",
        matchPassword: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(userInstance);
      generateToken.mockReturnValue("tok123");

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "x@y.com", password: "pw" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        _id: "u1", firstName: "A", lastName: "B",
        email: "x@y.com", role: "patient", location: "LOC1",
        token: "tok123",
      });
    });

    it("returns 401 on wrong password", async () => {
      const userInstance = { matchPassword: jest.fn().mockResolvedValue(false) };
      User.findOne.mockResolvedValue(userInstance);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "x@y.com", password: "bad" });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "Invalid email or password" });
    });

    it("returns 401 if user not found", async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "no@one.com", password: "pw" });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "Invalid email or password" });
    });
  });

  describe("GET /api/auth/profile", () => {
    it("returns 200 + user profile when authenticated", async () => {
      const fakeUser = {
        _id: "u1", firstName: "Alice", lastName: "Smith",
        email: "a@b.com", role: "patient", location: "LOC1"
      };
      User.findById.mockResolvedValue(fakeUser);

      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", "Bearer tok");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(fakeUser);
      expect(User.findById).toHaveBeenCalledWith("u1");
    });

    it("returns 404 if user not found", async () => {
      User.findById.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", "Bearer tok");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "User not found" });
    });
  });

  describe("PUT /api/auth/profile", () => {
    it("updates and returns profile", async () => {
      const userObj = {
        _id: "u1", firstName: "Old", lastName: "Name",
        email: "old@e.com", role: "patient", location: "LOC1",
        save: jest.fn().mockResolvedValue({
          _id: "u1", firstName: "New", lastName: "Name",
          email: "old@e.com", role: "patient", location: "LOC2"
        }),
      };
      User.findById.mockResolvedValue(userObj);
      generateToken.mockReturnValue("newtoken");

      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", "Bearer tok")
        .send({ firstName: "New", location: "LOC2" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        _id: "u1", firstName: "New", lastName: "Name",
        email: "old@e.com", role: "patient", location: "LOC2",
        token: "newtoken",
      });
      expect(userObj.save).toHaveBeenCalled();
    });

    it("returns 404 if user not found", async () => {
      User.findById.mockResolvedValue(null);

      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", "Bearer tok")
        .send({ firstName: "New" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "User not found" });
    });
  });

  describe("Fallback", () => {
    it("returns 404 for unknown auth route", async () => {
      const res = await request(app).get("/api/auth/unknown");
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Invalid Auth Route" });
    });
  });
});
