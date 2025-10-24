import { useState, useEffect } from "react";
import "../assets/css/signup.css";

// Utility: redirect by role
const redirectToRolePage = (role) => {
  const roleMap = { farmer: "/farmer", dealer: "/dealer", retailer: "/retailer" };
  window.location.href = roleMap[role] || "/login";
};

export default function Signup() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 data
  const [basic, setBasic] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
  });

  // Step 2 verification
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [googleVerified, setGoogleVerified] = useState(false);
  const [googleToken, setGoogleToken] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  // Step 3 role selection
  const [role, setRole] = useState("");

  // Step 4 details
  const [extra, setExtra] = useState({
    aadhaar: "",
    farmLocation: "",
    latitude: "",
    longitude: "",
    farmSize: "",
    businessName: "",
    gstin: "",
    warehouseAddress: "",
    preferredCommodities: "",
    shopName: "",
    shopAddress: "",
    shopType: "",
    monthlyPurchaseVolume: "",
  });

  // Timer countdown
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Format timer mm:ss
  const formatTimer = (t) => `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, "0")}`;

  // Step navigation
  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  // Google Sign-In setup
  useEffect(() => {
    /* global google */
    const handleGoogleSignIn = async (response) => {
      try {
        const res = await fetch("http://localhost:3000/api/auth/verify-google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: response.credential }),
        });
        const data = await res.json();
        if (res.ok) {
          setGoogleVerified(true);
          setGoogleToken(response.credential);
          setBasic({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            mobile: basic.mobile,
          });
          setEmailVerified(true);
          setStatusMsg(`✅ Google verification successful for ${data.email}`);
        } else {
          setStatusMsg(data.msg || "Google verification failed");
        }
      } catch {
        setStatusMsg("Google sign-in failed");
      }
    };

    if (window.google) {
      google.accounts.id.initialize({
        client_id:
          "262898642473-niisbi298nfo33a175rju6acmpkatrs4.apps.googleusercontent.com",
        callback: handleGoogleSignIn,
      });
      google.accounts.id.renderButton(document.getElementById("googleSignupBtn"), {
        theme: "outline",
        size: "large",
      });
    }
  }, [basic.mobile]);

  // Send OTP
  const sendOtp = async () => {
    if (!basic.email) return alert("Enter a valid email");
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: basic.email }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setOtpTimer(300);
        setStatusMsg(data.msg || "Verification code sent");
      } else {
        setStatusMsg(data.msg || "Failed to send OTP");
      }
    } catch {
      setStatusMsg("Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) return alert("Enter valid 6-digit OTP");
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: basic.email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailVerified(true);
        setStatusMsg(`✅ ${data.msg}`);
      } else {
        setStatusMsg(data.msg || "Invalid code");
      }
    } catch {
      setStatusMsg("Error verifying code");
    } finally {
      setLoading(false);
    }
  };

  // Get Geolocation
  const fetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lon = pos.coords.longitude.toFixed(6);
          setExtra({ ...extra, latitude: lat, longitude: lon });
          alert(`Location fetched: ${lat}, ${lon}`);
        },
        () => alert("Allow location permission to fetch coordinates")
      );
    } else alert("Geolocation not supported by browser");
  };

  // Submit final form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailVerified && !googleVerified) return alert("Verify your email first");
    setLoading(true);

    const payload = {
      ...basic,
      role,
      ...extra,
      emailVerified,
      googleToken: googleVerified ? googleToken : null,
    };

    try {
      const endpoint = googleVerified
        ? "http://localhost:3000/api/auth/signup-google"
        : "http://localhost:3000/api/auth/signup";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(`✅ ${data.msg}`);
        setTimeout(() => (window.location.href = "/login"), 1500);
      } else {
        setStatusMsg(data.msg || "Signup failed");
      }
    } catch {
      setStatusMsg("Error submitting form");
    } finally {
      setLoading(false);
    }
  };

  // Validation for Step 1
  const validateStep1 = () => {
    const namePattern = /^[A-Za-z]+$/;
    if (!basic.firstName || !basic.mobile || !basic.email)
      return alert("Please fill all required fields");
    if (!namePattern.test(basic.firstName))
      return alert("First name must contain only alphabets");
    if (basic.lastName && !namePattern.test(basic.lastName))
      return alert("Last name must contain only alphabets");
    if (!/^[0-9]{10}$/.test(basic.mobile))
      return alert("Mobile number must be exactly 10 digits");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(basic.email))
      return alert("Invalid email address");
    next();
  };

  return (
    <div className="signup-container">
      <h2 className="form-title">Sign up to AgroChain</h2>
      <ul className="stepper">
        <li className={step >= 1 ? "active" : ""}>1. Basic Info</li>
        <li className={step >= 2 ? "active" : ""}>2. Email Verification</li>
        <li className={step >= 3 ? "active" : ""}>3. Select Role</li>
        <li className={step >= 4 ? "active" : ""}>4. Additional Details</li>
      </ul>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="form-step">
            <label>First Name *</label>
            <input
              value={basic.firstName}
              onChange={(e) => setBasic({ ...basic, firstName: e.target.value })}
            />
            <label>Last Name</label>
            <input
              value={basic.lastName}
              onChange={(e) => setBasic({ ...basic, lastName: e.target.value })}
            />
            <label>Mobile *</label>
            <input
              value={basic.mobile}
              onChange={(e) => setBasic({ ...basic, mobile: e.target.value })}
            />
            <label>Email *</label>
            <input
              type="email"
              value={basic.email}
              onChange={(e) => setBasic({ ...basic, email: e.target.value })}
            />
            <div className="buttons">
              <button type="button" onClick={validateStep1}>
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Verification */}
        {step === 2 && (
          <div className="form-step">
            <div className="verification-container">
              <h3>Verify Your Email</h3>
              <p>Choose your verification method:</p>

              {!emailVerified && (
                <>
                  <div id="googleSignupBtn"></div>
                  <div className="divider"><span>OR</span></div>
                  <div className="email-otp-section">
                    <button type="button" onClick={sendOtp}>
                      {loading ? "Sending..." : otpSent ? "Resend Code" : "Send Verification Code"}
                    </button>

                    {otpSent && (
                      <div>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                        />
                        <button type="button" onClick={verifyOtp}>
                          {loading ? "Verifying..." : "Verify Code"}
                        </button>
                        {otpTimer > 0 && <p>Code expires in {formatTimer(otpTimer)}</p>}
                      </div>
                    )}
                  </div>
                </>
              )}

              {statusMsg && (
                <div
                  className={statusMsg.includes("✅") ? "message-success" : "message-error"}
                >
                  {statusMsg}
                </div>
              )}
            </div>

            <div className="buttons">
              <button type="button" onClick={back}>
                Back
              </button>
              <button
                type="button"
                onClick={next}
                disabled={!emailVerified && !googleVerified}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Role Selection */}
        {step === 3 && (
          <div className="form-step">
            <h3>Select your business type</h3>
            <div className="role-selection-grid">
              {["farmer", "dealer", "retailer"].map((r) => (
                <div
                  key={r}
                  className={`role-card ${role === r ? "active-role" : ""}`}
                  onClick={() => setRole(r)}
                >
                  <h4>{r.charAt(0).toUpperCase() + r.slice(1)}</h4>
                  <p>
                    {r === "farmer" && "Manage fields, inventory, and connect directly with partners."}
                    {r === "dealer" && "Manage stock, contracts, and logistics for multiple growers."}
                    {r === "retailer" && "Handle purchases, sales, and consumer connections."}
                  </p>
                </div>
              ))}
            </div>
            <div className="buttons">
              <button type="button" onClick={back}>
                Back
              </button>
              <button type="button" onClick={next} disabled={!role}>
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Additional Details */}
        {step === 4 && (
          <div className="form-step">
            {role === "farmer" && (
              <div>
                <label>Aadhaar *</label>
                <input
                  value={extra.aadhaar}
                  onChange={(e) => setExtra({ ...extra, aadhaar: e.target.value })}
                />
                <label>Farm Location *</label>
                <input
                  value={extra.farmLocation}
                  onChange={(e) => setExtra({ ...extra, farmLocation: e.target.value })}
                />
                <button type="button" onClick={fetchLocation}>📍 Get Geotag Location</button>
                <label>Latitude</label>
                <input value={extra.latitude} readOnly />
                <label>Longitude</label>
                <input value={extra.longitude} readOnly />
                <label>Farm Size *</label>
                <input
                  value={extra.farmSize}
                  onChange={(e) => setExtra({ ...extra, farmSize: e.target.value })}
                />
              </div>
            )}

            {role === "dealer" && (
              <div>
                <label>Business Name *</label>
                <input
                  value={extra.businessName}
                  onChange={(e) => setExtra({ ...extra, businessName: e.target.value })}
                />
                <label>GSTIN *</label>
                <input
                  value={extra.gstin}
                  onChange={(e) => setExtra({ ...extra, gstin: e.target.value })}
                />
                <label>Warehouse Address *</label>
                <input
                  value={extra.warehouseAddress}
                  onChange={(e) => setExtra({ ...extra, warehouseAddress: e.target.value })}
                />
                <label>Preferred Commodities</label>
                <input
                  value={extra.preferredCommodities}
                  onChange={(e) => setExtra({ ...extra, preferredCommodities: e.target.value })}
                />
              </div>
            )}

            {role === "retailer" && (
              <div>
                <label>Shop Name *</label>
                <input
                  value={extra.shopName}
                  onChange={(e) => setExtra({ ...extra, shopName: e.target.value })}
                />
                <label>Shop Address *</label>
                <input
                  value={extra.shopAddress}
                  onChange={(e) => setExtra({ ...extra, shopAddress: e.target.value })}
                />
                <label>Shop Type *</label>
                <input
                  value={extra.shopType}
                  onChange={(e) => setExtra({ ...extra, shopType: e.target.value })}
                />
                <label>Monthly Purchase Volume</label>
                <input
                  value={extra.monthlyPurchaseVolume}
                  onChange={(e) => setExtra({ ...extra, monthlyPurchaseVolume: e.target.value })}
                />
              </div>
            )}

            <div className="buttons">
              <button type="button" onClick={back}>
                Back
              </button>
              <button type="submit" disabled={loading}>
                {loading ? "Signing up..." : "Signup"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
