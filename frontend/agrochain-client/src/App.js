import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Import Pages
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import FarmerDashboard from './pages/FarmerDashboard';
import DealerDashboard from './pages/DealerDashboard';
import RetailerDashboard from './pages/RetailerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Each Page component now renders its own Navbar */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Farmer Route */}
          <Route element={<ProtectedRoute allowedRoles={['farmer']} />}>
            <Route path="/farmer" element={<FarmerDashboard />} />
          </Route>

          {/* Protected Dealer Route */}
          <Route element={<ProtectedRoute allowedRoles={['dealer']} />}>
            <Route path="/dealer" element={<DealerDashboard />} />
          </Route>

          {/* Protected Retailer Route */}
          <Route element={<ProtectedRoute allowedRoles={['retailer']} />}>
            <Route path="/retailer" element={<RetailerDashboard />} />
          </Route>

          {/* Protected Admin Route */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          
          <Route path="*" element={
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
              <h1>404 Not Found</h1>
              <p>The page you are looking for does not exist.</p>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;