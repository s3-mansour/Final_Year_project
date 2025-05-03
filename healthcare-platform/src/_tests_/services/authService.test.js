import * as authService from "../../services/authService";
import API from "../../services/api";

jest.mock("../../services/api", () => ({
  post: jest.fn(),
  put: jest.fn(),
}));

// Silence console.error from service error‐paths
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

describe("authService", () => {
  afterEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
  });

  describe("registerUser", () => {
    it("should call API.post and return data on success", async () => {
      const userData = { name: "Alice", email: "a@b.com", password: "pw" };
      const fakeResp = { id: "u1", ...userData };
      API.post.mockResolvedValue({ data: fakeResp });

      const result = await authService.registerUser(userData);
      expect(API.post).toHaveBeenCalledWith(
        "/api/auth/register",
        userData
      );
      expect(result).toEqual(fakeResp);
    });

    it("should throw with server message on failure", async () => {
      const err = { response: { data: { message: "Email exists" } } };
      API.post.mockRejectedValue(err);

      await expect(authService.registerUser({}))
        .rejects
        .toThrow("Email exists");
    });
  });

  describe("loginUser", () => {
    it("should store token/role and return data on success", async () => {
      const creds = { email: "a@b.com", password: "pw" };
      const fakeData = { token: "t1", role: "patient", name: "Alice" };
      API.post.mockResolvedValue({ data: fakeData });
      const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

      const result = await authService.loginUser(creds);

      expect(API.post).toHaveBeenCalledWith(
        "/api/auth/login",
        creds
      );
      expect(setItemSpy).toHaveBeenCalledWith("token", "t1");
      expect(setItemSpy).toHaveBeenCalledWith("userRole", "patient");
      expect(result).toEqual(fakeData);
    });

    it("should throw with server message on failure", async () => {
      const err = { response: { data: { message: "Invalid creds" } } };
      API.post.mockRejectedValue(err);

      await expect(authService.loginUser({}))
        .rejects
        .toThrow("Invalid creds");
    });
  });

  describe("logoutUser", () => {
    it("should clear localStorage and return message", () => {
      localStorage.setItem("foo", "bar");
      const result = authService.logoutUser();

      expect(localStorage.getItem("foo")).toBeNull();
      expect(result).toEqual({ message: "Logged out successfully" });
    });
  });

  describe("updateUserProfile", () => {
    it("should call API.put with bearer token and return data", async () => {
      const profileData = { name: "New Name" };
      // Ensure updateUserProfile reads our token:
      jest.spyOn(Storage.prototype, "getItem").mockReturnValue("tok123");

      const fakeResp = { id: "u1", name: "New Name" };
      API.put.mockResolvedValue({ data: fakeResp });

      const result = await authService.updateUserProfile(profileData);

      expect(API.put).toHaveBeenCalledWith(
        "/api/auth/profile",
        profileData,
        { headers: { Authorization: "Bearer tok123" } }
      );
      expect(result).toEqual(fakeResp);
    });

    it("should throw with server message on failure", async () => {
      // And again mock the token so the error path runs correctly:
      jest.spyOn(Storage.prototype, "getItem").mockReturnValue("tok123");
      const err = { response: { data: { message: "Update failed" } } };
      API.put.mockRejectedValue(err);

      await expect(authService.updateUserProfile({}))
        .rejects
        .toThrow("Update failed");
    });
  });
});
