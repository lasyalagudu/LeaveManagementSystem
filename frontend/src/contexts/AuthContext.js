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

  // Fetch full user profile from API
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get("/api/v1/users/me");
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Fetch user profile error:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Handle token change & load user
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        try {
          const decoded = jwt_decode(token);
          const currentTime = Date.now() / 1000;

          if (decoded.exp < currentTime) {
            logout();
            setLoading(false);
          } else {
            await fetchUserProfile();
          }
        } catch (error) {
          console.error("Token decode error:", error);
          logout();
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [token]);

  // Login function
  const login = async (email, password) => {
    try {
      // Call login endpoint to get token
      const response = await axios.post("/api/v1/auth/login", { email, password });
      const { access_token } = response.data;
  
      // Store token in localStorage and state
      localStorage.setItem("token", access_token);
      setToken(access_token);
  
      // Set default Authorization header for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
  
      // Fetch the user profile using the new token
      const userResponse = await axios.get("/api/v1/users/me");
      const userData = userResponse.data;
  
      // Set user and authentication state
      setUser(userData);
      setIsAuthenticated(true);
  
      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.detail || "Login failed",
      };
    }
  };
  

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common["Authorization"];
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put("/api/v1/users/me/password", profileData);
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

  // Change password
  const changePassword = async (oldPassword, newPassword, confirmPassword) => {
    try {
      await axios.put("/api/v1/users/me/password", {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
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
  

  // Refresh token
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


