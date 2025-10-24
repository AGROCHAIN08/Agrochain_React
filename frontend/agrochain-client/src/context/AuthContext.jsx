import { createContext, useState, useEffect } from "react";

// Create a global context
export const AuthContext = createContext();

/**
 * AuthProvider component wraps the entire app
 * and exposes the `user`, `login`, and `logout` functions.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load user data from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem("agroChainUser");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("agroChainUser");
      }
    }
  }, []);

  /**
   * Save user data and optionally JWT to localStorage
   * @param {Object} userData - { name, role, email, token }
   */
  const login = (userData) => {
    localStorage.setItem("agroChainUser", JSON.stringify(userData));
    setUser(userData);
  };

  /**
   * Clear user data (used during logout)
   */
  const logout = () => {
    localStorage.removeItem("agroChainUser");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
