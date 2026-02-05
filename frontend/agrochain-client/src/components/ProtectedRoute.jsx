import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Verifying Session...</div>;
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  // Admin Special Case (Specific Email Check)
  if (user.email === "agrochain08@gmail.com") {
    return allowedRoles.includes('admin') ? <Outlet /> : <Navigate to="/admin" replace />;
  }
  
  // Regular User Role Check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // 💡 Added 'admin' to rolePaths as a fallback
    const rolePaths = { 
        farmer: '/farmer', 
        dealer: '/dealer', 
        retailer: '/retailer',
        admin: '/admin' 
    };
    return <Navigate to={rolePaths[user.role] || '/'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;