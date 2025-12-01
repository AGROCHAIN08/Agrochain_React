import React, { createContext, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, logout as logoutAction, updateProfile } from '../redux/slices/authSlice';

// Create the context
export const AuthContext = createContext(null);

// Create the provider component
export const AuthProvider = ({ children }) => {
  // Get Redux state and dispatch
  const dispatch = useDispatch();
  const { user: reduxUser, token, isAuthenticated } = useSelector((state) => state.auth);
  
  // Keep local loading state for initial app load
  const [loading, setLoading] = useState(true);

  // Check localStorage for user on initial app load and sync with Redux
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("agroChainUser");
      const storedToken = localStorage.getItem("token");
      
      if (storedUser && storedToken) {
        // If user exists in localStorage but not in Redux, sync it
        if (!reduxUser) {
          dispatch(loginSuccess({ 
            user: JSON.parse(storedUser), 
            token: storedToken 
          }));
        }
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("agroChainUser");
      localStorage.removeItem("token");
    }
    setLoading(false); // Done loading
  }, [dispatch, reduxUser]);

  // Login function to update Redux state and localStorage
  const login = (userData, authToken = null) => {
    const token = authToken || localStorage.getItem("token") || "temp-token";
    
    // Update both localStorage (backward compatibility) and Redux
    localStorage.setItem("agroChainUser", JSON.stringify(userData));
    if (authToken) {
      localStorage.setItem("token", authToken);
    }
    
    // Dispatch to Redux
    dispatch(loginSuccess({ user: userData, token }));
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem("agroChainUser");
    localStorage.removeItem("token");
    localStorage.removeItem("dealerCart");
    localStorage.removeItem("retailerCart");
    localStorage.removeItem("dealerOrders");
    
    // Dispatch Redux logout action
    dispatch(logoutAction());
  };

  // Profile update function (for dashboards)
  const updateUserProfile = (updatedData) => {
    const updatedUser = { ...reduxUser, ...updatedData };
    localStorage.setItem("agroChainUser", JSON.stringify(updatedUser));
    dispatch(updateProfile(updatedData));
  };

  // Value to be passed to consuming components
  // Use Redux user as primary source, fallback to local state for backward compatibility
  const value = { 
    user: reduxUser, 
    token,
    isAuthenticated,
    login, 
    logout, 
    loading,
    updateUserProfile 
  };

  // Render children only when not loading
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
