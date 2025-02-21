import API from "./api";

// Register User
export const registerUser = async (userData) => {
  try {
    const response = await API.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    console.error("Registration failed:", error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || "Registration failed. Please try again.");
  }
};

// Login User
export const loginUser = async (userData) => {
  try {
    const response = await API.post("/auth/login", userData);
    
    // Store token & user role
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("userRole", response.data.role);

    return response.data;
  } catch (error) {
    console.error("Login failed:", error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || "Invalid email or password.");
  }
};

// Logout User
export const logoutUser = () => {
  localStorage.removeItem("token"); // Remove token
  localStorage.removeItem("userRole"); // Remove user role
  return { message: "Logged out successfully" };
};

// Get User Profile
export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      throw new Error("Unauthorized: No token found");
    }

    const response = await API.get("/auth/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Fetching user profile failed:", error.response?.data?.message || error.message);

    if (error.response?.status === 401) {
      logoutUser(); // Clear token if unauthorized
      window.location.href = "/login"; // Redirect to login page
    }

    throw new Error(error.response?.data?.message || "Failed to fetch profile.");
  }
};
