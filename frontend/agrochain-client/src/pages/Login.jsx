import { useState, useEffect } from "react";
import "../assets/css/login.css";

// Define the role-based redirection mapping
const redirectToRolePage = (role, email) => {
  if (email === "agrochain08@gmail.com") {
    window.location.href = "/admin";
    return;
  }
  const rolePages = {
    farmer: "/farmer",
    dealer: "/dealer",
    retailer: "/retailer",
  };
  const redirectUrl = rolePages[role];
  if (redirectUrl) window.location.href = redirectUrl;
  else alert("Unknown role. Please contact support.");
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [resendVisible, setResendVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Timer countdown effect
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setResendVisible(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Format timer mm:ss
  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Send OTP
  const sendOtp = async () => {
    if (!email) return alert("Enter your email");
    try {
      setLoading(true);
      setStatusMsg("");
      const res = await fetch("http://localhost:3000/api/auth/send-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setOtpTimer(300); // 5 min
        setResendVisible(false);
        setStatusMsg(data.msg || "OTP sent successfully!");
      } else {
        setStatusMsg(data.msg || "Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
      setStatusMsg("Error: Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) return alert("Enter valid 6-digit OTP");
    try {
      setLoading(true);
      setStatusMsg("");
      const res = await fetch("http://localhost:3000/api/auth/verify-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(`✅ Welcome back ${data.user.firstName}!`);
        localStorage.setItem("agroChainUser", JSON.stringify(data.user));
        setTimeout(() => redirectToRolePage(data.role, data.user.email), 1000);
      } else {
        setStatusMsg(data.msg || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      setStatusMsg("OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In handler (GSI)
  useEffect(() => {
    /* global google */
    const handleGoogleLogin = async (response) => {
      try {
        const res = await fetch("http://localhost:3000/api/auth/login-google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: response.credential }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatusMsg(`✅ Welcome back ${data.user.firstName}!`);
          localStorage.setItem("agroChainUser", JSON.stringify(data.user));
          setTimeout(() => redirectToRolePage(data.role, data.user.email), 1000);
        } else {
          setStatusMsg(data.msg || "Google login failed");
        }
      } catch (err) {
        console.error(err);
        setStatusMsg("Google login failed");
      }
    };

    // Initialize Google Sign-In button
    if (window.google) {
      google.accounts.id.initialize({
        client_id:
          "262898642473-niisbi298nfo33a175rju6acmpkatrs4.apps.googleusercontent.com",
        callback: handleGoogleLogin,
      });
      google.accounts.id.renderButton(
        document.getElementById("gSignInBtn"),
        { theme: "outline", size: "large" }
      );
    }
  }, []);

  return (
    <div className="login-page">
      <nav className="navbar">
        <div className="nav-left">
          <img
            src="https://ik.imagekit.io/a2wpi1kd9/imgToUrl/image-to-url_ThyEiMVLh"
            alt="AgroChain Logo"
            className="logo"
          />
          <span className="brand-name">
            Agro<span className="chain-text">Chain</span>
          </span>
        </div>
      </nav>

      <div className="signup-container">
        <h2>Login to AgroChain</h2>

        <div className="google-signin-section">
          <h4>Option 1: Sign in with Google</h4>
          <div id="gSignInBtn"></div>
        </div>

        <div className="divider"><span>OR</span></div>

        <div className="email-otp-section">
          <h4>Option 2: Login with Email + OTP</h4>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={sendOtp} disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>

          {otpSent && (
            <div id="otpSection">
              <label>Enter OTP</label>
              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button onClick={verifyOtp} disabled={loading}>
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
              <p className="otp-timer">
                {otpTimer > 0
                  ? `Code expires in ${formatTimer(otpTimer)}`
                  : "Code expired"}
              </p>
              {resendVisible && (
                <button onClick={sendOtp}>Resend Code</button>
              )}
            </div>
          )}

          {statusMsg && (
            <div
              className="message-error"
              style={{ color: statusMsg.includes("✅") ? "green" : "red" }}
            >
              {statusMsg}
            </div>
          )}
        </div>

        <div className="new-user-card">
          <p>New to AgroChain?</p>
          <a href="/signup" className="signup-btn">
            <i className="fa fa-user-plus"></i> Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
