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
    localStorage.setItem("userRole", response.data.role); // Assuming role is in response
    // You might want to store more user info here, like ID, name, location
    // localStorage.setItem("userInfo", JSON.stringify({ id: response.data._id, role: response.data.role, location: response.data.location }));
    return response.data;
  } catch (error) {
    console.error("Login failed:", error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || "Invalid email or password.");
  }
};

// Clears local storage and redirects to login
export const logoutUser = () => {
  localStorage.clear(); // Clears all auth-related items
  // Redirect the user to the login page
  window.location.href = "/login"; // Using href for a full page reload
};

// Fetches the logged-in user's profile from the backend
export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      // If no token exists, we're not authenticated
      throw new Error("Unauthorized: No token found");
    }
    // API instance automatically adds the token header
    const response = await API.get("/api/auth/profile");
    return response.data; // This should contain user details including 'location'
  } catch (error) {
    console.error("Fetching user profile failed:", error.response?.data?.message || error.message);
    // If backend returns 401 (Unauthorized) or other auth errors, log out the user
    if (error.response?.status === 401 || error.message.includes("Unauthorized")) {
      console.warn("Auth check failed, logging out user.");
      logoutUser(); // Log out and redirect
    }
    throw new Error(error.response?.data?.message || "Failed to fetch profile.");
  }
};

// Updates the logged-in user's profile
export const updateUserProfile = async (profileData) => {
  try {
     // API instance automatically adds the token header
    const response = await API.put("/api/auth/profile", profileData);
    // Optional: Update local storage if user info changed (e.g., location)
    // const currentUserInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    // localStorage.setItem("userInfo", JSON.stringify({ ...currentUserInfo, ...profileData }));
    return response.data;
  } catch (error) {
    console.error("Updating profile failed:", error.response?.data?.message || error.message);
    if (error.response?.status === 401) {
       logoutUser();
    }
    throw new Error(error.response?.data?.message || "Profile update failed.");
  }
};

/**
 * ***Service Function: Request Password Reset ***
 * Endpoint: POST /api/auth/forgot-password-request
 * @param {Object} verificationData - { email, dob, securityQuestion, securityAnswer }
 * @returns {Promise<object>} A promise resolving to { message, verificationToken } on success.
 * Throws error on verification failure.
 */
export const requestPasswordReset = async (verificationData) => {
    try {
        // Send verification data to the backend endpoint.
        const response = await API.post("/api/auth/forgot-password-request", verificationData);
        return response.data; // Returns verification token on success.
    } catch (error) {
        console.error("Password reset request failed:", error.response?.data?.message || error.message);
        // Re-throw the specific error message for the frontend page to display.
        throw new Error(error.response?.data?.message || "Verification failed. Please check your details.");
    }
};

/**
 * *** Service Function: Reset Password ***
 * Endpoint: PUT /api/auth/reset-password
 * @param {string} verificationToken - The temporary token received from the request step.
 * @param {string} newPassword - The user's new password.
 * @param {string} confirmNewPassword - Confirmation of the new password.
 * @returns {Promise<object>} A promise resolving to { message } on success.
 * Throws error on failure (invalid token, passwords mismatch, complexity).
 */
export const resetPassword = async (verificationToken, newPassword, confirmNewPassword) => {
    // Data payload for the backend endpoint.
    const resetData = {
        newPassword,
        confirmNewPassword,
    };

    // The backend endpoint is protected by middleware that verifies the verificationToken.
    // This token needs to be sent in the Authorization header.
    try {
        const response = await API.put("/api/auth/reset-password", resetData, {
            headers: {
                // Include the verification token in the Authorization header.
                // The middleware will extract and verify this token.
                Authorization: `Bearer ${verificationToken}`,
            },
        });
        return response.data; // Returns success message on success.
    } catch (error) {
        console.error("Password reset failed:", error.response?.data?.message || error.message);
        // Re-throw the specific error message for the frontend page to display.
         if (error.response?.status === 401 || error.response?.status === 403) {
             // Handle expired/invalid token error explicitly if needed
             throw new Error(error.response?.data?.message || "Your reset link has expired or is invalid. Please request a new one.");
         }
        throw new Error(error.response?.data?.message || "Failed to reset password. Please try again.");
    }
};