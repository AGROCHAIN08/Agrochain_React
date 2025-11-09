import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { GoogleLogin } from '@react-oauth/google';
import '../assets/css/signup.css'; 

// Import the new central Navbar
import Navbar from '../components/Navbar'; 

// Signup Page component
const Signup = () => {
  // ... (all your existing signup logic from the previous step) ...
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', mobile: '', email: '', role: '',
    aadhaar: '', farmLocation: '', latitude: '', longitude: '', farmSize: '',
    businessName: '', gstin: '', warehouseAddress: '',
    shopName: '', shopAddress: '', shopType: '',
  });
  const [otp, setOtp] = useState('');
  const [verificationMethod, setVerificationMethod] = useState(null);
  const [googleCredential, setGoogleCredential] = useState(null);
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleSelection = (role) => {
    setFormData(prev => ({ ...prev, role: role }));
  };

  const validateStep1 = () => {
    const { firstName, lastName, mobile, email } = formData;
    const namePattern = /^[A-Za-z]+$/;
    if (!firstName || !mobile || !email) { setMessage("Please fill all required fields."); return false; }
    if (!namePattern.test(firstName)) { setMessage("First name must contain only alphabets."); return false; }
    if (lastName && !namePattern.test(lastName)) { setMessage("Last name must contain only alphabets."); return false; }
    if (!/^\d{10}$/.test(mobile)) { setMessage("Mobile number must be exactly 10 digits."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMessage("Please enter a valid email address."); return false; }
    setMessage('');
    setStep(2);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setMessage('Verifying Google account...');
    try {
      const res = await api.post('/auth/verify-google', { token: credentialResponse.credential });
      const { email, firstName, lastName } = res.data;
      setFormData(prev => ({ ...prev, email, firstName, lastName }));
      setVerificationMethod('google');
      setGoogleCredential(credentialResponse.credential);
      setMessage('✅ Google verification successful!');
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Google verification failed');
    }
    setLoading(false);
  };
  
  const handleSendOtp = async () => {
    setLoading(true);
    setMessage('Sending OTP...');
    try {
      await api.post('/auth/send-otp', { email: formData.email });
      setMessage('OTP Sent to your email!');
      setShowOtpSection(true);
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Failed to send OTP');
    }
    setLoading(false);
  };
  
  const handleVerifyOtp = async () => {
    setLoading(true);
    setMessage('Verifying OTP...');
     try {
      await api.post('/auth/verify-otp', { email: formData.email, otp: otp });
      setMessage('✅ Email Verified!');
      setVerificationMethod('email');
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Invalid OTP');
    }
    setLoading(false);
  };
  
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lon = position.coords.longitude.toFixed(6);
          setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
          alert(`Location fetched successfully!`);
        },
        () => alert("Unable to fetch location. Please allow location access.")
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('Creating account...');
    
    let finalData = { ...formData };
    let endpoint = '';
    
    if (verificationMethod === 'google') {
      finalData.googleToken = googleCredential;
      endpoint = '/auth/signup-google';
    } else {
      finalData.emailVerified = true;
      endpoint = '/auth/signup';
    }

     try {
      await api.post(endpoint, finalData);
      setMessage('Signup successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Signup failed. Please check all fields.');
    }
    setLoading(false);
  };
  

  return (
    <>
      <Navbar /> {/* <-- Use the imported component */}
      <div className="signup-container">
        {/* ... (all your signup HTML and step logic) ... */}
         <h2 className="form-title">Sign up to AgroChain</h2>
        <ul className="stepper">
          <li className={step >= 1 ? 'active' : ''}>1. Basic Info</li>
          <li className={step >= 2 ? 'active' : ''}>2. Email Verification</li>
          <li className={step >= 3 ? 'active' : ''}>3. Select Role</li>
          <li className={step >= 4 ? 'active' : ''}>4. Additional Details</li>
        </ul>
        
        {message && 
          <div id="message" style={{
            padding: '12px', borderRadius: '4px', margin: '15px 0',
            color: message.includes('Failed') || message.includes('Error') || message.includes('must') ? '#721c24' : '#155724',
            backgroundColor: message.includes('Failed') || message.includes('Error') || message.includes('must') ? '#f8d7da' : '#d4edda'
          }}>
            {message}
          </div>
        }

        <form id="signupForm" onSubmit={handleFormSubmit}>
          {/* Step 1: Basic Info */}
          <div className="form-step" style={{ display: step === 1 ? 'block' : 'none' }}>
            <label>First Name <span className="required">*</span></label>
            <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
            
            <label>Last Name</label>
            <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} />
            
            <label>Mobile <span className="required">*</span></label>
            <input type="text" id="mobile" name="mobile" value={formData.mobile} onChange={handleInputChange} required />
            
            <label>Email <span className="required">*</span></label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
            
            <div className="buttons">
              <span></span>
              <button type="button" id="next1" onClick={validateStep1}>Continue</button>
            </div>
          </div>
          
          {/* Step 2: Email Verification */}
          <div className="form-step" style={{ display: step === 2 ? 'block' : 'none' }}>
            <div className="verification-container">
              <h3>Verify Your Email</h3>
              <p>Choose your verification method:</p>
              
              <div className="google-signin-section" style={{ opacity: verificationMethod === 'email' ? 0.5 : 1 }}>
                <h4>Option 1: Sign in with Google</h4>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setMessage('Google verification failed')}
                  disabled={verificationMethod === 'email'}
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  text="signup_with"
                />
              </div>

              <div className="divider"><span>OR</span></div>

              <div className="email-otp-section" style={{ opacity: verificationMethod === 'google' ? 0.5 : 1 }}>
                <h4>Option 2: Email Verification Code</h4>
                <p>We'll send a code to <span id="emailDisplay">{formData.email}</span></p>
                
                <button type="button" id="sendOtpBtn" className="otp-btn" onClick={handleSendOtp} disabled={loading || verificationMethod === 'google'}>
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
                
                {showOtpSection && (
                  <div id="otpSection">
                    <label>Enter 6-digit verification code</label>
                    <input type="text" id="otpInput" maxLength="6" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value)} />
                    <button type="button" id="verifyOtpBtn" className="otp-btn" onClick={handleVerifyOtp} disabled={loading || otp.length < 6}>
                      {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="buttons">
              <button type="button" id="back1" onClick={() => setStep(1)}>Back</button>
              <button type="button" id="next2" onClick={() => setStep(3)} disabled={!verificationMethod}>Continue</button>
            </div>
          </div>

          {/* Step 3: Select Role */}
          <div className="form-step" style={{ display: step === 3 ? 'block' : 'none' }}>
              <h3 className="role-grid-title">Select your business type</h3>
              <div className="role-selection-grid">
                  <div className={`role-card ${formData.role === 'farmer' ? 'active-role' : ''}`} onClick={() => handleRoleSelection('farmer')}>
                      <div className="role-icon"><span className="icon-text">🌾</span></div>
                      <h4 className="role-title">Farmer</h4>
                      <p className="role-subtitle">This account type can manage</p>
                      <ul className="role-features"><p>The core of the supply chain. Manage fields, track inventory, and connect directly with partners...</p></ul>
                  </div>
                  <div className={`role-card ${formData.role === 'dealer' ? 'active-role' : ''}`} onClick={() => handleRoleSelection('dealer')}>
                      <div className="role-icon"><span className="icon-text">🏢</span></div>
                      <h4 className="role-title">Dealer</h4>
                      <p className="role-subtitle">This account type can manage</p>
                      <ul className="role-features"><p>Your hub for trade. Manage stock, contracts, and logistics for multiple growers...</p></ul>
                  </div>
                  <div className={`role-card ${formData.role === 'retailer' ? 'active-role' : ''}`} onClick={() => handleRoleSelection('retailer')}>
                      <div className="role-icon"><span className="icon-text">🏪</span></div>
                      <h4 className="role-title">Retailer</h4>
                      <p className="role-subtitle">This account type can manage</p>
                      <ul className="role-features"><p>The final link to the consumer. Manage your retail sites, handle purchases, and track sales...</p></ul>
                  </div>
              </div>
              <input type="hidden" id="role" name="role" value={formData.role} required />
              <div className="buttons">
                <button type="button" id="back2" onClick={() => setStep(2)}>Back</button>
                <button type="button" id="next3" onClick={() => setStep(4)} disabled={!formData.role}>Continue</button>
              </div>
          </div>
          
          {/* Step 4: Additional Details */}
          <div className="form-step" style={{ display: step === 4 ? 'block' : 'none' }}>
            {formData.role === 'farmer' && (
              <div id="farmerFields">
                <label>Aadhaar (12 digits) <span className="required">*</span></label>
                <input type="text" id="aadhaar" name="aadhaar" value={formData.aadhaar} onChange={handleInputChange} />
                <label>Farm Location <span className="required">*</span></label>
                <input type="text" id="farmLocation" name="farmLocation" value={formData.farmLocation} onChange={handleInputChange} />
                <label>Latitude</label>
                <input type="text" id="latitude" name="latitude" value={formData.latitude} onChange={handleInputChange} readOnly />
                <label>Longitude</label>
                <input type="text" id="longitude" name="longitude" value={formData.longitude} onChange={handleInputChange} readOnly />
                <button type="button" id="getLocationBtn" className="otp-btn" onClick={handleGetLocation}>📍 Get Geotag Location</button>
                <label>Farm Size <span className="required">*</span></label>
                <input type="text" id="farmSize" name="farmSize" value={formData.farmSize} onChange={handleInputChange} />
              </div>
            )}

            {formData.role === 'dealer' && (
              <div id="dealerFields">
                <label>Business Name <span className="required">*</span></label>
                <input type="text" id="businessName" name="businessName" value={formData.businessName} onChange={handleInputChange} />
                <label>GSTIN <span className="required">*</span></label>
                <input type="text" id="gstin" name="gstin" value={formData.gstin} onChange={handleInputChange} />
                <label>Warehouse Address <span className="required">*</span></label>
                <input type="text" id="warehouseAddress" name="warehouseAddress" value={formData.warehouseAddress} onChange={handleInputChange} />
              </div>
            )}

            {formData.role === 'retailer' && (
              <div id="retailerFields">
                <label>Shop Name <span className="required">*</span></label>
                <input type="text" id="shopName" name="shopName" value={formData.shopName} onChange={handleInputChange} />
                <label>Shop Address <span className="required">*</span></label>
                <input type="text" id="shopAddress" name="shopAddress" value={formData.shopAddress} onChange={handleInputChange} />
                <label>Shop Type <span className="required">*</span></label>
                <input type="text" id="shopType" name="shopType" value={formData.shopType} onChange={handleInputChange} />
              </div>
            )}

            <div className="buttons">
              <button type="button" id="back3" onClick={() => setStep(3)}>Back</button>
              <button type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Signup'}</button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default Signup;