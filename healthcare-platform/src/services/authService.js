// src/services/authService.js
import API from "./api";

export const registerUser = async (userData) => {
  try {
    const response = await API.post("/api/auth/register", userData);
    return response.data;
  } catch (error) {
    console.error("Registration failed:", error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || "Registration failed. Please try again.");
  }
};

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

export const logoutUser = () => {
  localStorage.clear();
  return { message: "Logged out successfully" };
};

export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }
    const response = await API.get("/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

export const updateUserProfile = async (profileData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await API.put("/api/auth/profile", profileData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // Optionally update localStorage if needed
    return response.data;
  } catch (error) {
    console.error("Updating profile failed:", error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || "Profile update failed.");
  }
};
