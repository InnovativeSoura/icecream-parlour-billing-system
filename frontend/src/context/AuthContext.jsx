import { createContext, useContext, useEffect, useState } from "react";

import api from "../api/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(user);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("icecream_token");

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");

        if (response.data?.success && response.data?.user) {
          const restoredUser = response.data.user;

          setUser(restoredUser);

          localStorage.setItem("icecream_user", JSON.stringify(restoredUser));
        } else {
          localStorage.removeItem("icecream_token");
          localStorage.removeItem("icecream_user");

          setUser(null);
        }
      } catch (error) {
        console.error("Session restoration failed:", error);

        localStorage.removeItem("icecream_token");
        localStorage.removeItem("icecream_user");

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", {
        email: email?.trim(),
        password,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Login failed");
      }

      const { token, user: loggedInUser } = response.data;

      if (!token || !loggedInUser) {
        throw new Error("Invalid login response from server.");
      }

      localStorage.setItem("icecream_token", token);

      localStorage.setItem("icecream_user", JSON.stringify(loggedInUser));

      setUser(loggedInUser);

      return loggedInUser;
    } catch (error) {
      console.error("Login failed:", error);

      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to login. Please try again.",
      );
    }
  };

  const register = async ({
    name,
    email,
    phone,
    password,
    role = "customer",
  }) => {
    const normalizedRole = String(role || "customer")
      .trim()
      .toLowerCase();

    if (!["customer", "staff"].includes(normalizedRole)) {
      throw new Error("Invalid registration role.");
    }

    try {
      const response = await api.post("/auth/register", {
        name: name?.trim(),
        email: email?.trim(),
        phone: phone?.trim() || "",
        password,
        role: normalizedRole,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Registration failed");
      }

      const { token, user: registeredUser } = response.data;

      if (!token || !registeredUser) {
        throw new Error("Invalid registration response from server.");
      }

      localStorage.setItem("icecream_token", token);

      localStorage.setItem("icecream_user", JSON.stringify(registeredUser));

      setUser(registeredUser);

      return registeredUser;
    } catch (error) {
      console.error("Registration failed:", error);

      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create account. Please try again.",
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("icecream_token");
    localStorage.removeItem("icecream_user");

    setUser(null);

    window.location.href = "/";
  };

  const isAdmin = user?.role === "admin";

  const isStaff = user?.role === "staff";

  const isCustomer = user?.role === "customer";

  const value = {
    user,
    setUser,

    loading,

    isAuthenticated,

    login,
    register,
    logout,

    isAdmin,
    isStaff,
    isCustomer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};

export default AuthContext;
