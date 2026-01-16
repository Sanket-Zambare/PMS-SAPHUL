import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to decode base64url
  const base64UrlDecode = (str) => {
    // Replace base64url characters with base64 characters
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    return atob(base64);
  };

  useEffect(() => {
    console.log("AuthContext useEffect start");
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const savedPermissions = localStorage.getItem("permissions");

    console.log("Token:", !!token, "SavedUser:", !!savedUser);

    if (token && savedUser) {
      console.log("Token and user found, verifying");
      try {
        setUser(JSON.parse(savedUser));
        if (savedPermissions) {
          setPermissions(JSON.parse(savedPermissions));
        }
        // Verify token is still valid and get fresh permissions
        authAPI.getCurrentUser()
          .then(async (response) => {
            console.log("getCurrentUser success");
            setUser(response.data);
            localStorage.setItem("user", JSON.stringify(response.data));

            // Get permissions from token (JWT uses base64url encoding)
            try {
              const tokenData = JSON.parse(base64UrlDecode(token.split('.')[1]));
              if (tokenData.permissions) {
                setPermissions(tokenData.permissions);
                localStorage.setItem("permissions", JSON.stringify(tokenData.permissions));
              }
            } catch (error) {
              console.warn("Could not decode permissions from token:", error);
            }
          })
          .catch((error) => {
            console.log("getCurrentUser failed:", error);
            // Token invalid, clear storage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("permissions");
            setUser(null);
            setPermissions([]);
          })
          .finally(() => {
            console.log("Setting loading to false");
            setLoading(false);
          });
      } catch (error) {
        console.log("Error in try block:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("permissions");
        setUser(null);
        setPermissions([]);
        setLoading(false);
      }
    } else {
      console.log("No token or user, setting loading to false");
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { access_token, permissions: userPermissions } = response.data;
      
      localStorage.setItem("token", access_token);
      
      // Store permissions from login response
      if (userPermissions) {
        setPermissions(userPermissions);
        localStorage.setItem("permissions", JSON.stringify(userPermissions));
      }
      
      // Get user info
      const userResponse = await authAPI.getCurrentUser();
      const userData = userResponse.data;
      
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login failed";
      
      if (error.code === "ECONNREFUSED" || error.message.includes("Network Error")) {
        errorMessage = "Cannot connect to server. Please ensure the backend is running on http://localhost:8000";
      } else if (error.response) {
        errorMessage = error.response.data?.detail || error.response.data?.message || "Login failed";
      } else if (error.request) {
        errorMessage = "No response from server. Please check if the backend is running.";
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
    setUser(null);
    setPermissions([]);
  };

  const value = {
    user,
    permissions,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
