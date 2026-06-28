import { create } from "zustand";
import client from "../api/client";

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  // Restore active user session on app load
  restoreSession: async () => {
    set({ loading: true });
    try {
      const response = await client.get("/auth/me");
      set({ user: response.data, loading: false });
    } catch (error) {
      console.error("No active session:", error.message);
      set({ user: null, loading: false });
    }
  },

  // Actions
  register: async (firstName, middleName, lastName, email, password, confirmPassword) => {
    const response = await client.post("/auth/register", {
      first_name: firstName,
      middle_name: middleName || null,
      last_name: lastName || null,
      email,
      password,
      confirm_password: confirmPassword,
    });
    return response.data;
  },

  verifyOtp: async (email, otpCode) => {
    const response = await client.post("/auth/verify-otp", {
      email,
      otp_code: otpCode,
    });
    // Cookies are set automatically by browser; now fetch profile
    const userResponse = await client.get("/auth/me");
    set({ user: userResponse.data });
    return userResponse.data;
  },

  resendOtp: async (email) => {
    const response = await client.post("/auth/resend-otp", { email });
    return response.data;
  },

  login: async (email, password) => {
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);

    await client.post("/auth/login", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Cookies are set automatically; now fetch profile
    const userResponse = await client.get("/auth/me");
    set({ user: userResponse.data });
    return userResponse.data;
  },

  logout: async () => {
    try {
      await client.post("/auth/logout");
    } catch (error) {
      console.error("Logout request failed:", error);
    }
    set({ user: null });
  },

  updateProfile: async (profileData) => {
    const response = await client.put("/auth/profile", profileData);
    set({ user: response.data });
    return response.data;
  },

  clearAuth: () => set({ user: null }),
}));

// Listen for global logout events (like Token Refresh failures) to clear store
if (typeof window !== "undefined") {
  window.addEventListener("auth_logout", () => {
    useAuthStore.getState().clearAuth();
  });
}
