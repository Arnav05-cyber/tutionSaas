'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

interface FeeStatus {
  studentId: number;
  totalMonthlyFee: number;
  feesPaidForCurrentMonth: boolean;
}

interface AttendanceSummary {
  totalSessions: number;
  attendedSessions: number;
  percentage: number;
}

interface ScheduleSlot {
  dayOfWeek: string;
  startTime: string;
  durationMinutes: number;
}

interface Batch {
  id: number;
  name: string;
  grade: string;
  teacherName: string;
  monthlyFee: number;
  schedule: ScheduleSlot[];
  attendance?: AttendanceSummary;
}

interface Session {
  id: number;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
}

const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
  FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun'
};

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function ParentStudentDetailPage() {
  const { id } = useParams();
  const { getToken } = useAuth();
  
  const [feeStatus, setFeeStatus] = useState<FeeStatus | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const token = await getToken();

      const [feesRes, batchesRes, sessionsRes] = await Promise.all([
        api.get(`/api/parent/students/${id}/fees`, token),
        api.get(`/api/parent/students/${id}/batches`, token),
        api.get(`/api/parent/students/${id}/sessions`, token)
      ]);

      setFeeStatus(feesRes);
      setSessions(sessionsRes);

      // Fetch attendance for each batch
      const batchesWithAttendance = await Promise.all(
        batchesRes.map(async (batch: Batch) => {
          try {
            const attendance = await api.get(`/api/parent/students/${id}/attendance?batchId=${batch.id}`, token);
            return { ...batch, attendance };
          } catch (e) {
            return batch;
          }
        })
      );
      
      setBatches(batchesWithAttendance);
    } catch (e) {
      console.error(e);
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
      const orderData = await api.post(`/api/parent/students/${id}/fees/order`, {}, token);
      
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
            await api.post(`/api/parent/students/${id}/fees/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, token);
            
            alert('Fees paid successfully!');
            await loadData(); // Reload fee status
          } catch (err) {
            console.error('Verification failed', err);
            alert('Payment verification failed. Contact admin.');
          }
        },
        prefill: {
          name: 'Parent Name',
          email: 'parent@example.com',
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
        <h1 className="page-title">Student Details</h1>
        <p className="page-subtitle">Track performance, attendance, and fees</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* ─── Batches & Attendance ─── */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Enrolled Classes</h2>
            {batches.length === 0 ? (
              <div className="card empty-state"><p>Student is not enrolled in any batches yet.</p></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {batches.map(b => (
                  <div key={b.id} className="card">
                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{b.name}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      Teacher: {b.teacherName}
                    </p>
                    
                    {b.schedule && b.schedule.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        {b.schedule.map((s, i) => (
                          <span key={i} className="badge" style={{ marginRight: '4px', marginBottom: '4px' }}>
                            {DAY_SHORT[s.dayOfWeek]} {formatTime(s.startTime)}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance</p>
                      {b.attendance ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '24px', fontWeight: 600, color: b.attendance.percentage >= 75 ? 'var(--success)' : b.attendance.percentage >= 50 ? 'var(--accent)' : 'var(--danger)' }}>
                            {Math.round(b.attendance.percentage)}%
                          </span>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            {b.attendance.attendedSessions} / {b.attendance.totalSessions} classes
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No data yet</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Upcoming Sessions ─── */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Upcoming Schedule</h2>
            {sessions.length === 0 ? (
              <div className="card empty-state"><p>No upcoming sessions scheduled.</p></div>
            ) : (
              <div className="card">
                <table>
                  <thead>
                    <tr>
                      <th>Topic</th>
                      <th>Date & Time</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 500 }}>{s.title || 'Untitled Session'}</td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {new Date(s.scheduledAt).toLocaleString()}
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {s.durationMinutes} min
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* ─── Fee Summary (Sidebar) ─── */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Fee Summary</h2>
            
            {feeStatus?.totalMonthlyFee === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No fees due (Student is not in any paid batches).</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Monthly Total</span>
                  <span style={{ fontSize: '16px', fontWeight: 600 }}>₹{feeStatus?.totalMonthlyFee}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Status</span>
                  {feeStatus?.feesPaidForCurrentMonth ? (
                    <span className="badge badge-success">Paid</span>
                  ) : (
                    <span className="badge badge-danger">Unpaid</span>
                  )}
                </div>

                {!feeStatus?.feesPaidForCurrentMonth ? (
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '10px' }}
                    onClick={payFees}
                    disabled={paying}
                  >
                    {paying ? 'Processing...' : `Pay ₹${feeStatus?.totalMonthlyFee}`}
                  </button>
                ) : (
                  <div style={{ textAlign: 'center', padding: '8px', background: 'var(--surface-hover)', borderRadius: '6px' }}>
                    <span style={{ color: 'var(--success)', fontSize: '13px', fontWeight: 500 }}>
                      All caught up for this month!
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
