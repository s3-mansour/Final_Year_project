import API from "./api";

/**
 * Registers a new user.
 */
export const registerUser = async (userData) => {
  try {
    const response = await API.post("/api/auth/register", userData);
    return response.data;
  } catch (error) {
    console.error("Registration failed:", error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || "Registration failed. Please try again.");
  }
};

/**
 * Logs in a user and stores token & role in localStorage.
 */
export const loginUser = async (userData) => {
  try {
    const response = await API.post("/api/auth/login", userData);
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("userRole", response.data.role);
    return response.data;
  } catch (error) {
    console.error("Login failed:", error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || "Invalid email or password.");
  }
};

/**
 * Logs out user by clearing localStorage.
 */
export const logoutUser = () => {
  localStorage.clear();
  return { message: "Logged out successfully" };
};

/**
 * Fetch user profile from the server using stored token.
 */
export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }
    const response = await API.get("/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Fetching user profile failed:", error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
      logoutUser();
      window.location.href = "/login";
    }
    throw new Error(error.response?.data?.message || "Failed to fetch profile.");
  }
};
