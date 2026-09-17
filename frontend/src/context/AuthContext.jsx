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

      // No existing session
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
    try {
      const response = await api.post("/auth/login", {
        email: email?.trim(),
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

      if (!token || !loggedInUser) {
        throw new Error(
          "Invalid login response from server."
        );
      }

      // Save authentication token
      localStorage.setItem(
        "icecream_token",
        token
      );

      // Save user information
      localStorage.setItem(
        "icecream_user",
        JSON.stringify(loggedInUser)
      );

      // Update context
      setUser(loggedInUser);

      return loggedInUser;
    } catch (error) {
      console.error("Login failed:", error);

      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to login. Please try again."
      );
    }
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
     * Public registration supports:
     *
     * customer
     * staff
     *
     * Admin accounts must NOT be created
     * through the public registration page.
     */

    const normalizedRole = String(
      role || "customer"
    )
      .trim()
      .toLowerCase();

    // -------------------------------------------------------
    // Validate registration role
    // -------------------------------------------------------

    if (
      !["customer", "staff"].includes(
        normalizedRole
      )
    ) {
      throw new Error(
        "Invalid registration role."
      );
    }

    try {
      const response = await api.post(
        "/auth/register",
        {
          name: name?.trim(),
          email: email?.trim(),
          phone: phone?.trim() || "",
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

      if (!token || !registeredUser) {
        throw new Error(
          "Invalid registration response from server."
        );
      }

      // -----------------------------------------------------
      // Save authentication token
      // -----------------------------------------------------

      localStorage.setItem(
        "icecream_token",
        token
      );

      // -----------------------------------------------------
      // Save registered user
      // -----------------------------------------------------

      localStorage.setItem(
        "icecream_user",
        JSON.stringify(registeredUser)
      );

      // -----------------------------------------------------
      // Update authentication context
      // -----------------------------------------------------

      setUser(registeredUser);

      return registeredUser;
    } catch (error) {
      console.error(
        "Registration failed:",
        error
      );

      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create account. Please try again."
      );
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    // Remove authentication data
    localStorage.removeItem("icecream_token");
    localStorage.removeItem("icecream_user");

    // Clear React authentication state
    setUser(null);

    /*
     * IMPORTANT:
     *
     * The Home page now contains the Login/Register
     * interface.
     *
     * Therefore logout must return to "/"
     * instead of "/login".
     */

    window.location.href = "/";
  };

  // =========================================================
  // ROLE HELPERS
  // =========================================================

  const isAdmin =
    user?.role === "admin";

  const isStaff =
    user?.role === "staff";

  const isCustomer =
    user?.role === "customer";

  // =========================================================
  // AUTH CONTEXT VALUE
  // =========================================================

  const value = {
    // -------------------------------------------------------
    // User state
    // -------------------------------------------------------

    user,
    setUser,

    loading,

    isAuthenticated,

    // -------------------------------------------------------
    // Authentication methods
    // -------------------------------------------------------

    login,
    register,
    logout,

    // -------------------------------------------------------
    // Role helpers
    // -------------------------------------------------------

    isAdmin,
    isStaff,
    isCustomer,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ===========================================================
// USE AUTH HOOK
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