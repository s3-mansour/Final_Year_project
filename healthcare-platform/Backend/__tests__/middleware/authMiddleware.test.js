// Backend/__tests__/middleware/authMiddleware.test.js
jest.mock("../../models/User");
jest.mock("jsonwebtoken");

const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const { protect, doctorAuth } = require("../../middleware/authMiddleware");

describe("protect middleware", () => {
  let req, res, next;

  beforeAll(() => {
    process.env.JWT_SECRET = "testsecret";
  });

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jwt.verify.mockReset();
    User.findById.mockReset();
  });

  it("should 401 when no Authorization header", async () => {
    await protect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should 401 when token is invalid", async () => {
    req.headers.authorization = "Bearer bad.token";
    jwt.verify.mockImplementation(() => { throw new Error("invalid"); });

    await protect(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should attach req.user and call next on valid token", async () => {
    // Arrange
    req.headers.authorization = "Bearer good.token";
    const fakePayload = { id: "user123" };
    const fakeUser = { _id: "user123", name: "Alice" };

    jwt.verify.mockReturnValue(fakePayload);
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(fakeUser),
    });

    // Act
    await protect(req, res, next);

    // Assert
    expect(jwt.verify).toHaveBeenCalledWith("good.token", process.env.JWT_SECRET);
    expect(User.findById).toHaveBeenCalledWith("user123");
    // ensure select was called to strip password
    const query = User.findById();
    expect(query.select).toHaveBeenCalledWith("-password");

    expect(req.user).toEqual(fakeUser);
    expect(next).toHaveBeenCalledWith();
  });
});

describe("doctorAuth middleware", () => {
  let req, res, next;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it("should 401 if req.user is missing", async () => {
    req = {};
    await doctorAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should 403 if user.role !== 'doctor'", async () => {
    req = { user: { role: "patient" } };
    await doctorAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should call next() when user.role === 'doctor'", async () => {
    req = { user: { role: "doctor" } };
    await doctorAuth(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });
});
