import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");

      const currentUser = response?.data?.user;

      if (currentUser?.role !== "customer") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        return;
      }

      setUser(currentUser);
      localStorage.setItem("user", JSON.stringify(currentUser));
    } catch (error) {
      console.error(
        "Session restoration failed:",
        error?.response?.data?.message || error.message,
      );

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const responseUser = response?.data?.user;
      const token = response?.data?.token;

      if (!token || !responseUser) {
        throw new Error("Invalid login response from server.");
      }

      if (responseUser.role !== "customer") {
        return {
          success: false,
          message:
            "This account is not a customer account. Please use the staff/admin portal.",
        };
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(responseUser));

      setUser(responseUser);

      return {
        success: true,
        user: responseUser,
        token,
      };
    } catch (error) {
      console.error(
        "Customer login failed:",
        error?.response?.data?.message || error.message,
      );

      return {
        success: false,
        message:
          error?.response?.data?.message ||
          "Login failed. Please check your email and password.",
      };
    }
  }, []);

  const register = useCallback(
    async ({ name, email, phone = "", password }) => {
      try {
        const normalizedName = name?.trim();
        const normalizedEmail = email?.trim().toLowerCase();
        const normalizedPhone = phone?.trim() || null;

        if (!normalizedName) {
          return {
            success: false,
            message: "Name is required.",
          };
        }

        if (!normalizedEmail) {
          return {
            success: false,
            message: "Email is required.",
          };
        }

        if (!password) {
          return {
            success: false,
            message: "Password is required.",
          };
        }

        if (password.length < 6) {
          return {
            success: false,
            message: "Password must contain at least 6 characters.",
          };
        }

        const response = await api.post("/auth/register", {
          name: normalizedName,
          email: normalizedEmail,
          phone: normalizedPhone,

          role: "customer",

          password,
        });

        const responseUser = response?.data?.user;
        const token = response?.data?.token;

        if (!token || !responseUser) {
          throw new Error("Invalid registration response from server.");
        }

        if (responseUser.role !== "customer") {
          return {
            success: false,
            message: "Customer registration could not be completed.",
          };
        }

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(responseUser));

        setUser(responseUser);

        return {
          success: true,
          user: responseUser,
          token,
        };
      } catch (error) {
        console.error(
          "Customer registration failed:",
          error?.response?.data?.message || error.message,
        );

        return {
          success: false,
          message:
            error?.response?.data?.message ||
            "Registration failed. Please try again.",
        };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);

    window.location.href = "/";
  }, []);

  const updateUser = useCallback((updatedUser) => {
    if (!updatedUser) {
      return;
    }

    if (updatedUser.role !== "customer") {
      return;
    }

    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }, []);

  const isAuthenticated = Boolean(user);
  const isCustomer = user?.role === "customer";

  const value = useMemo(
    () => ({
      user,
      loading,

      isAuthenticated,
      isCustomer,

      login,
      register,
      logout,
      updateUser,
      restoreSession,
    }),
    [
      user,
      loading,
      isAuthenticated,
      isCustomer,
      login,
      register,
      logout,
      updateUser,
      restoreSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
};

export default AuthContext;
