import React, { createContext, useState, useEffect } from 'react';

// Create the context
export const AuthContext = createContext(null);

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Prevents flicker on load

  // Check localStorage for user on initial app load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("agroChainUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("agroChainUser");
    }
    setLoading(false); // Done loading
  }, []);

  // Login function to update state and localStorage
  const login = (userData) => {
    localStorage.setItem("agroChainUser", JSON.stringify(userData));
    setUser(userData);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("agroChainUser");
    setUser(null);
  };

  // Value to be passed to consuming components
  const value = { user, login, logout, loading };

  // Render children only when not loading
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};