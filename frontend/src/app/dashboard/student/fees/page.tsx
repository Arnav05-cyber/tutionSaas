'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface FeeInfo {
  totalMonthlyFee: number;
  isFeesPaidForCurrentMonth: boolean;
}

export default function StudentFeesPage() {
  const { getToken } = useAuth();
  const [feeInfo, setFeeInfo] = useState<FeeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadFees();
  }, []);

  async function loadFees() {
    try {
      const token = await getToken();
      const data = await api.get('/api/student/fees', token);
      setFeeInfo(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function payFees() {
    setPaying(true);
    try {
      const { loadRazorpayScript } = await import('@/lib/razorpay');
      const isLoaded = await loadRazorpayScript();
      
      if (!isLoaded) {
        alert('Failed to load Razorpay SDK. Please check your connection.');
        setPaying(false);
        return;
      }

      const token = await getToken();
      
      // 1. Create order on backend
      const orderData = await api.post('/api/student/fees/order', {}, token);
      
      // 2. Initialize Razorpay options
      const options = {
        key: 'rzp_test_Sq5CvoRp7QVZ7n', // Provided test key
        amount: orderData.amount * 100, // paise
        currency: orderData.currency,
        name: 'EDUSHA',
        description: 'Monthly Tuition Fee',
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify payment on backend
            await api.post('/api/student/fees/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, token);
            
            alert('Payment successful!');
            await loadFees(); // Reload fee status
          } catch (err) {
            console.error('Verification failed', err);
            alert('Payment verification failed. Contact admin.');
          }
        },
        prefill: {
          name: 'Student Name',
          email: 'student@example.com',
        },
        theme: {
          color: '#09090B'
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        alert('Payment failed: ' + response.error.description);
      });
      paymentObject.open();

    } catch (err) {
      console.error(err);
      alert('Failed to initialize payment');
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Fees & Payments</h1>
        <p className="page-subtitle">Manage your monthly tuition fees</p>
      </div>

      <div className="card" style={{ maxWidth: '500px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Current Month Status</h2>

        {feeInfo?.totalMonthlyFee === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '8px', fontWeight: 600 }}>No Fees Due</h3>
            <p style={{ color: 'var(--text-muted)' }}>You are not enrolled in any paid batches.</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Monthly Fee</span>
              <span style={{ fontSize: '20px', fontWeight: 600 }}>₹{feeInfo?.totalMonthlyFee}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Payment Status</span>
              {feeInfo?.isFeesPaidForCurrentMonth ? (
                <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '14px' }}>Paid</span>
              ) : (
                <span className="badge badge-danger" style={{ padding: '6px 12px', fontSize: '14px' }}>Due</span>
              )}
            </div>

            {!feeInfo?.isFeesPaidForCurrentMonth && (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 500 }}
                onClick={payFees}
                disabled={paying}
              >
                {paying ? 'Processing...' : `Pay ₹${feeInfo?.totalMonthlyFee} Now`}
              </button>
            )}
            
            {feeInfo?.isFeesPaidForCurrentMonth && (
              <p style={{ textAlign: 'center', color: 'var(--success)', fontSize: '14px', fontWeight: 500 }}>
                You're all caught up for this month!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
