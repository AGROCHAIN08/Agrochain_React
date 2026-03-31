import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../assets/css/payment.css';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('No session ID found');
        setLoading(false);
        return;
      }

      try {
        // First try to verify via session status
        const res = await api.get(`/payment/session-status/${sessionId}`);
        setSessionData(res.data);

        // If payment status shows as paid but order not yet completed,
        // trigger manual verification as a fallback
        if (res.data.status === 'paid' && res.data.paymentStatus === 'Pending') {
          try {
            await api.post('/payment/verify', { sessionId });
            // Re-fetch session status after verification
            const updatedRes = await api.get(`/payment/session-status/${sessionId}`);
            setSessionData(updatedRes.data);
          } catch (verifyErr) {
            console.log('Manual verification attempted:', verifyErr.message);
          }
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError('Unable to verify payment status. Please check your dashboard.');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  const getDashboardPath = () => {
    if (!sessionData) return '/login';
    if (sessionData.orderType === 'farmer-dealer') return '/dealer';
    if (sessionData.orderType === 'dealer-retailer') return '/retailer';
    return '/login';
  };

  const getRoleLabel = () => {
    if (!sessionData) return 'Dashboard';
    if (sessionData.orderType === 'farmer-dealer') return 'Dealer Dashboard';
    if (sessionData.orderType === 'dealer-retailer') return 'Retailer Dashboard';
    return 'Dashboard';
  };

  return (
    <div className="payment-result-container">
      <div className="payment-result-card">
        {loading ? (
          <div className="payment-loading">
            <div className="payment-spinner"></div>
            <p>Verifying your payment...</p>
          </div>
        ) : error ? (
          <>
            <div className="success-checkmark-container">
              <div className="cancel-circle">
                <span className="cancel-x">!</span>
              </div>
            </div>
            <h1>Verification Issue</h1>
            <p className="subtitle">{error}</p>
            <div className="payment-result-actions">
              <button className="btn-dashboard cancel-primary" onClick={() => navigate('/login')}>
                Go to Login
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="success-checkmark-container">
              <div className="success-circle">
                <span className="success-checkmark">✓</span>
              </div>
            </div>

            <h1>Payment Successful!</h1>
            <p className="subtitle">
              Your payment has been processed successfully. The order has been updated.
            </p>

            {sessionData && (
              <div className="payment-details-box">
                <div className="payment-detail-row">
                  <span className="payment-detail-label">Amount Paid</span>
                  <span className="payment-detail-value amount">
                    ₹{sessionData.amountTotal?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="payment-detail-row">
                  <span className="payment-detail-label">Payment Status</span>
                  <span className="payment-detail-value status-paid">
                    ✓ {sessionData.status === 'paid' ? 'Paid' : sessionData.status}
                  </span>
                </div>
                <div className="payment-detail-row">
                  <span className="payment-detail-label">Order Type</span>
                  <span className="payment-detail-value">
                    {sessionData.orderType === 'farmer-dealer' 
                      ? 'Farmer → Dealer' 
                      : 'Dealer → Retailer'}
                  </span>
                </div>
                <div className="payment-detail-row">
                  <span className="payment-detail-label">Email</span>
                  <span className="payment-detail-value">
                    {sessionData.customerEmail}
                  </span>
                </div>
              </div>
            )}

            <div className="payment-result-actions">
              <button 
                className="btn-dashboard primary" 
                onClick={() => navigate(getDashboardPath())}
              >
                ← Back to {getRoleLabel()}
              </button>
            </div>

            <div className="stripe-badge">
              <span>🔒 Securely processed by Stripe</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
