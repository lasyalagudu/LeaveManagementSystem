import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      try {
        const decoded = jwt_decode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          // Token expired
          logout();
        } else {
          setUser(decoded);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Token decode error:", error);
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post("/api/v1/auth/login", {
        email,
        password,
      });

      const { access_token, user: userData } = response.data;

      // Store token
      localStorage.setItem("token", access_token);
      setToken(access_token);

      // Set axios default header
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      // Decode and set user
      const decoded = jwt_decode(access_token);
      setUser(decoded);
      setIsAuthenticated(true);

      return { success: true, user: decoded };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Login failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common["Authorization"];
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put("/api/v1/users/me", profileData);
      const updatedUser = { ...user, ...response.data };
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error("Profile update error:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Profile update failed",
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put("/api/v1/users/me/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return { success: true };
    } catch (error) {
      console.error("Password change error:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Password change failed",
      };
    }
  };

  const refreshToken = async () => {
    try {
      const response = await axios.post("/api/v1/auth/refresh");
      const { access_token } = response.data;

      localStorage.setItem("token", access_token);
      setToken(access_token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      const decoded = jwt_decode(access_token);
      setUser(decoded);

      return { success: true };
    } catch (error) {
      console.error("Token refresh error:", error);
      logout();
      return { success: false };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};





