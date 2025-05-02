// Backend/__tests__/utils/generateToken.test.js
const jwt = require("jsonwebtoken");
const generateToken = require("../../utils/generateToken");

jest.mock("jsonwebtoken");

describe("generateToken", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "mysecret";
  });

  it("should call jwt.sign with the user id and secret and return its result", () => {
    jwt.sign.mockReturnValue("fake.jwt.token");

    const token = generateToken("user123");

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: "user123" },
      "mysecret",
      { expiresIn: "30d" }
    );
    expect(token).toBe("fake.jwt.token");
  });
});
