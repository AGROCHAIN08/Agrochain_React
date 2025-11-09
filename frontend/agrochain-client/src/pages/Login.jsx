import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { GoogleLogin } from '@react-oauth/google';
import '../assets/css/login.css'; 

// Import the new central Navbar
import Navbar from '../components/Navbar'; 

// Login Page component
const Login = () => {
  // ... (all your existing login logic from the previous step) ...
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(300);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  // Timer logic from login.js
  useEffect(() => {
    let interval;
    if (showOtp && timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
      setStatus('OTP expired. Please resend.');
    }
    return () => clearInterval(interval);
  }, [showOtp, timer]);

  const redirectToRolePage = (user) => {
    if (user.email === "agrochain08@gmail.com") {
      navigate("/admin");
    } else if (user.role === 'farmer') {
      navigate('/farmer');
    } else if (user.role === 'dealer') {
      navigate('/dealer');
    } else if (user.role === 'retailer') {
      navigate('/retailer');
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);
    setStatus('Verifying Google Sign-In...');
    try {
      const res = await api.post('/auth/login-google', { token: credentialResponse.credential });
      const { user } = res.data;
      login(user); // Save to context
      setStatus(`Welcome back, ${user.firstName}! Redirecting...`);
      redirectToRolePage(user);
    } catch (error) {
      setStatus(error.response?.data?.msg || 'Google login failed');
    }
    setLoading(false);
  };

  const handleSendOtp = async (isResend = false) => {
    setLoading(true);
    setStatus('Sending OTP...');
    try {
      const response = await api.post('/auth/send-login-otp', { email });
      setStatus(response.data.msg);
      setShowOtp(true);
      setTimer(300); // Reset timer
    } catch (error) {
      setStatus(error.response?.data?.msg || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setStatus('Verifying OTP...');
    try {
      const response = await api.post('/auth/verify-login-otp', { email, otp });
      const { user } = response.data;
      login(user);
      setStatus(`Welcome back, ${user.firstName}! Redirecting...`);
      redirectToRolePage(user);
    } catch (error) {
      setStatus(error.response?.data?.msg || 'Invalid OTP');
    }
    setLoading(false);
  };


  return (
    <>
      <Navbar /> {/* <-- Use the imported component */}
      <div className="signup-container">
        {/* ... (all your login HTML) ... */}
         <h2>Login to AgroChain</h2>
        
        {status && 
          <div id="loginStatus" style={{
            display: 'block',
            padding: '12px',
            borderRadius: '4px',
            margin: '15px 0',
            color: status.includes('Failed') || status.includes('Error') || status.includes('expired') ? '#721c24' : '#155724',
            backgroundColor: status.includes('Failed') || status.includes('Error') || status.includes('expired') ? '#f8d7da' : '#d4edda'
          }}>
            {status}
          </div>
        }

        <div className="google-signin-section">
          <h4>Option 1: Sign in with Google</h4>
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => {
              console.log('Login Failed');
              setStatus('Google login failed. Please try again.');
            }}
            theme="outline"
            size="large"
            shape="rectangular"
            text="signin_with"
          />
        </div>
        
        <div className="divider"><span>OR</span></div>

        <div className="email-otp-section">
          <h4>Option 2: Login with Email + OTP</h4>
          <input 
            type="email" 
            id="loginEmail" 
            placeholder="Enter your email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={showOtp || loading}
          />
          <button type="button" id="sendOtpBtn" onClick={() => handleSendOtp(false)} disabled={loading || showOtp}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>

          {showOtp && (
            <div id="otpSection">
              <label>Enter OTP</label>
              <input 
                type="text" 
                id="otpInput" 
                maxLength="6" 
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
              />
              <button type="button" id="verifyOtpBtn" onClick={handleVerifyOtp} disabled={loading || otp.length < 6}>
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              
              <p className="otp-timer" id="otpTimer">
                {timer > 0 ? `Code expires in ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}` : 'Code expired'}
              </p>
              
              <button 
                type="button" 
                id="resendOtpBtn" 
                style={{ display: timer === 0 ? 'block' : 'none' }}
                onClick={() => handleSendOtp(true)}
                disabled={loading}
              >
                Resend Code
              </button>
            </div>
          )}
        </div>
        
        <div className="new-user-card">
          <p>New to AgroChain?</p>
          <Link to="/signup" className="signup-btn">
            <i className="fa fa-user-plus"></i> Sign Up
          </Link>
        </div>
      </div>
    </>
  );
};

export default Login;