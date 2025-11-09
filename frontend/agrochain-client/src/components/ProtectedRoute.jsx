import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  // Admin Special Case
  if (user.email === "agrochain08@gmail.com") {
    // If user is admin, check if 'admin' is one of the allowed roles
    if (allowedRoles.includes('admin')) {
      return <Outlet />; // Admin is allowed, proceed
    } else {
      // Admin is trying to access a non-admin page (e.g., /farmer)
      // Deny this and send them back to their own dashboard
      return <Navigate to="/admin" replace />;
    }
  }
  
  // Regular User Role Check
  // Check if the user's role is in the allowedRoles array
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in, but wrong role (e.g., farmer trying to access /dealer)
    // Redirect them to their *own* dashboard
    if (user.role === 'farmer') return <Navigate to="/farmer" replace />;
    if (user.role === 'dealer') return <Navigate to="/dealer" replace />;
    if (user.role === 'retailer') return <Navigate to="/retailer" replace />;
    
    // Fallback just in case
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has the correct role
  return <Outlet />;
};

export default ProtectedRoute;