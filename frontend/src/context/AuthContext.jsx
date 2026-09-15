import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(user);

  // =========================================================
  // RESTORE EXISTING SESSION
  // =========================================================

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("icecream_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");

        if (response.data?.success) {
          const restoredUser = response.data.user;

          setUser(restoredUser);

          localStorage.setItem(
            "icecream_user",
            JSON.stringify(restoredUser)
          );
        } else {
          localStorage.removeItem("icecream_token");
          localStorage.removeItem("icecream_user");

          setUser(null);
        }
      } catch (error) {
        console.error(
          "Session restoration failed:",
          error
        );

        localStorage.removeItem("icecream_token");
        localStorage.removeItem("icecream_user");

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // =========================================================
  // LOGIN
  // =========================================================

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    if (!response.data?.success) {
      throw new Error(
        response.data?.message || "Login failed"
      );
    }

    const {
      token,
      user: loggedInUser,
    } = response.data;

    localStorage.setItem(
      "icecream_token",
      token
    );

    localStorage.setItem(
      "icecream_user",
      JSON.stringify(loggedInUser)
    );

    setUser(loggedInUser);

    return loggedInUser;
  };

  // =========================================================
  // REGISTER
  // =========================================================

  const register = async ({
    name,
    email,
    phone,
    password,
    role = "customer",
  }) => {
    /*
     * Public registration is intentionally limited to:
     * - customer
     * - staff
     *
     * Admin accounts should NOT be created through the
     * public registration page.
     */

    const normalizedRole = String(role || "customer")
      .trim()
      .toLowerCase();

    if (
      !["customer", "staff"].includes(
        normalizedRole
      )
    ) {
      throw new Error(
        "Invalid registration role."
      );
    }

    const response = await api.post(
      "/auth/register",
      {
        name,
        email,
        phone,
        password,
        role: normalizedRole,
      }
    );

    if (!response.data?.success) {
      throw new Error(
        response.data?.message ||
          "Registration failed"
      );
    }

    const {
      token,
      user: registeredUser,
    } = response.data;

    localStorage.setItem(
      "icecream_token",
      token
    );

    localStorage.setItem(
      "icecream_user",
      JSON.stringify(registeredUser)
    );

    setUser(registeredUser);

    return registeredUser;
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem("icecream_token");
    localStorage.removeItem("icecream_user");

    setUser(null);

    window.location.href = "/login";
  };

  // =========================================================
  // AUTH VALUE
  // =========================================================

  const value = {
    user,
    loading,
    isAuthenticated,

    login,
    register,
    logout,

    isAdmin: user?.role === "admin",
    isStaff: user?.role === "staff",
    isCustomer: user?.role === "customer",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ===========================================================
// USE AUTH
// ===========================================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};

export default AuthContext;