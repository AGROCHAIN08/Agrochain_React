import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../assets/css/payment.css';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderType = searchParams.get('order_type');
  const orderId = searchParams.get('order_id');

  const getDashboardPath = () => {
    if (orderType === 'farmer-dealer') return '/dealer';
    if (orderType === 'dealer-retailer') return '/retailer';
    return '/login';
  };

  const getRoleLabel = () => {
    if (orderType === 'farmer-dealer') return 'Dealer Dashboard';
    if (orderType === 'dealer-retailer') return 'Retailer Dashboard';
    return 'Dashboard';
  };

  return (
    <div className="payment-result-container">
      <div className="payment-result-card">
        <div className="success-checkmark-container">
          <div className="cancel-circle">
            <span className="cancel-x">✕</span>
          </div>
        </div>

        <h1>Payment Cancelled</h1>
        <p className="subtitle">
          Your payment was not completed. No charges were made. 
          You can try again from your dashboard whenever you're ready.
        </p>

        {orderId && (
          <div className="payment-details-box">
            <div className="payment-detail-row">
              <span className="payment-detail-label">Order ID</span>
              <span className="payment-detail-value">
                {orderId.substring(0, 12)}...
              </span>
            </div>
            <div className="payment-detail-row">
              <span className="payment-detail-label">Status</span>
              <span className="payment-detail-value" style={{color: '#f59e0b'}}>
                Payment Pending
              </span>
            </div>
          </div>
        )}

        <div className="payment-result-actions">
          <button 
            className="btn-dashboard cancel-primary" 
            onClick={() => navigate(getDashboardPath())}
          >
            ← Return to {getRoleLabel()}
          </button>
          <button 
            className="btn-dashboard secondary" 
            onClick={() => navigate('/')}
          >
            Go to Home
          </button>
        </div>

        <div className="stripe-badge">
          <span>🔒 No charges were made</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
