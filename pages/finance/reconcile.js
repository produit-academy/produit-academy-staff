import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { withStaffAuth, useAuth } from '../../lib/auth';
import { apiGet, apiPost } from '../../lib/api';
import StaffLayout from '../../components/StaffLayout';

function FinanceReconcilePage() {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [message, setMessage] = useState(null);

    // Rechecking state
    const [recheckingId, setRecheckingId] = useState(null);

    // Reconciliation modal
    const [reconcileModal, setReconcileModal] = useState(null); // payment object
    const [reconcileAction, setReconcileAction] = useState('mark_paid');
    const [reconcileReason, setReconcileReason] = useState('');
    const [reconciling, setReconciling] = useState(false);

    const loadPayments = useCallback(async () => {
        setLoading(true);
        try {
            if (user?.role === 'staff') {
                const modData = await apiGet('/api/staff/modules/').catch(() => ({ modules: [] }));
                const mods = modData.modules || [];
                if (!mods.some(m => m.key === 'finance')) {
                    setHasAccess(false);
                    setLoading(false);
                    return;
                }
            }
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== 'all') {
                params.set('status', statusFilter);
            }
            if (search) {
                params.set('search', search);
            }
            const data = await apiGet(`/api/classes/admin/payments/?${params.toString()}`);
            setPayments(Array.isArray(data) ? data : []);
        } catch {
            setPayments([]);
        } finally {
            setLoading(false);
        }
    }, [user, statusFilter, search]);

    useEffect(() => {
        loadPayments();
    }, [loadPayments]);

    const handleRecheckGateway = async (bookingId) => {
        setRecheckingId(bookingId);
        try {
            const res = await apiPost(`/api/classes/admin/payments/${bookingId}/recheck/`, {});
            const result = await res.json().catch(() => ({}));
            if (res.ok && result.success) {
                setMessage({ type: 'success', text: `Gateway sync for Booking #${bookingId}: ${result.message || 'Status updated from Razorpay.'}` });
            } else {
                setMessage({ type: 'error', text: result.error || result.message || 'Gateway sync check completed with errors.' });
            }
            loadPayments();
        } catch (err) {
            setMessage({ type: 'error', text: err?.message || 'Failed to re-check payment with gateway.' });
        } finally {
            setRecheckingId(null);
        }
    };

    const handleReconcileSubmit = async (e) => {
        e.preventDefault();
        if (!reconcileModal) return;
        if (!reconcileReason.trim()) {
            setMessage({ type: 'error', text: 'Reason is required for manual reconciliation.' });
            return;
        }

        setReconciling(true);
        try {
            const res = await apiPost(`/api/classes/admin/payments/${reconcileModal.id}/reconcile/`, {
                action: reconcileAction,
                reason: reconcileReason.trim()
            });
            const result = await res.json().catch(() => ({}));
            if (res.ok && result.success) {
                setMessage({ type: 'success', text: result.message || `Booking #${reconcileModal.id} successfully reconciled.` });
                setReconcileModal(null);
                setReconcileReason('');
                loadPayments();
            } else {
                setMessage({ type: 'error', text: result.error || result.message || 'Failed to reconcile payment.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err?.message || 'Error executing manual reconciliation.' });
        } finally {
            setReconciling(false);
        }
    };

    // Calculate summary statistics
    const totalVolume = payments.reduce((acc, p) => acc + (p.total_amount || 0), 0);
    const advancePaid = payments.reduce((acc, p) => acc + (['advance_paid', 'fully_paid'].includes(p.payment_status) ? (p.advance_amount || 0) : 0), 0);
    const pendingCount = payments.filter(p => p.payment_status === 'pending').length;
    const paidCount = payments.filter(p => ['advance_paid', 'fully_paid'].includes(p.payment_status)).length;

    const STATUS_TABS = [
        { key: 'all', label: 'All Transactions' },
        { key: 'paid', label: 'Paid / Confirmed' },
        { key: 'pending', label: 'Pending Sync' },
        { key: 'cancelled', label: 'Cancelled' },
    ];

    return (
        <StaffLayout title="Finance & Gateway Reconciliation">
            <Head><title>Finance & Reconciliation | Staff Portal</title></Head>

            {message && (
                <div className={`alert ${message.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{message.text}</span>
                        <button type="button" onClick={() => setMessage(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit' }}>✕</button>
                    </div>
                </div>
            )}

            {!hasAccess ? (
                <div className="card empty-state" style={{ padding: '40px', textAlign: 'center', maxWidth: '520px', margin: '40px auto' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h3 style={{ color: 'var(--red)', marginBottom: '8px' }}>Access Restricted</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>You do not have permission to access the Finance module.</p>
                </div>
            ) : (
                <>
                    {/* Metrics Summary */}
                    <div className="stats-grid" style={{ marginBottom: '24px' }}>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: 'var(--accent)' }}>₹{totalVolume.toLocaleString('en-IN')}</div>
                            <div className="stat-label">Total Booking Volume</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: 'var(--green)' }}>₹{advancePaid.toLocaleString('en-IN')}</div>
                            <div className="stat-label">Advance Collected ({paidCount})</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: pendingCount > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>
                                {pendingCount}
                            </div>
                            <div className="stat-label">Pending Gateway Sync</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: 'var(--blue)' }}>{payments.length}</div>
                            <div className="stat-label">Loaded Invoices / Orders</div>
                        </div>
                    </div>

                    {/* Filter Toolbar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {STATUS_TABS.map(t => (
                                <button
                                    key={t.key}
                                    className={`btn ${statusFilter === t.key ? 'primary' : ''}`}
                                    onClick={() => setStatusFilter(t.key)}
                                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                className="input"
                                placeholder="Search student, teacher, order ID..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ padding: '8px 14px', minWidth: '260px' }}
                            />
                            <button
                                className="btn"
                                onClick={loadPayments}
                                title="Refresh data"
                                style={{ padding: '8px 12px' }}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
                    ) : payments.length > 0 ? (
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Order ID & Booking</th>
                                        <th>Student</th>
                                        <th>Teacher & Course</th>
                                        <th>Amount</th>
                                        <th>Payment Status</th>
                                        <th>Gateway Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map(p => {
                                        const isPaid = ['advance_paid', 'fully_paid'].includes(p.payment_status);
                                        const isPending = p.payment_status === 'pending';
                                        const isRechecking = recheckingId === p.id;

                                        return (
                                            <tr key={p.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        Booking #{p.id}
                                                    </div>
                                                    {p.razorpay_order_id ? (
                                                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                                            {p.razorpay_order_id}
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Direct Enrollment</div>
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{p.student_name}</div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{p.student_email}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{p.teacher_name}</div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                                        {p.subject} • {p.course}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        ₹{p.advance_amount.toLocaleString('en-IN')}
                                                    </div>
                                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                                        Total: ₹{p.total_amount.toLocaleString('en-IN')}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge" style={{
                                                        background: isPaid ? 'var(--green-bg)' : isPending ? '#fef3c7' : 'var(--red-bg)',
                                                        color: isPaid ? 'var(--green)' : isPending ? '#d97706' : 'var(--red)',
                                                        fontWeight: 600,
                                                    }}>
                                                        {p.payment_status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge" style={{
                                                        background: p.gateway_status === 'captured' ? 'var(--accent-light)' : 'var(--bg-secondary)',
                                                        color: p.gateway_status === 'captured' ? 'var(--accent-dark)' : 'var(--text-secondary)',
                                                        fontSize: '0.75rem',
                                                    }}>
                                                        {p.gateway_status || 'uninitiated'}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(p.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button
                                                            type="button"
                                                            className="btn"
                                                            disabled={isRechecking}
                                                            onClick={() => handleRecheckGateway(p.id)}
                                                            title="Sync status with Razorpay"
                                                            style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            {isRechecking ? 'Syncing...' : 'Sync Gateway'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn primary"
                                                            onClick={() => {
                                                                setReconcileModal(p);
                                                                setReconcileAction(isPaid ? 'mark_failed' : 'mark_paid');
                                                                setReconcileReason('');
                                                            }}
                                                            style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                                                        >
                                                            Reconcile
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="card empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                                <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M16 12h2" />
                            </svg>
                            <h3>No Payment Records Found</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>No payment records matched the criteria.</p>
                        </div>
                    )}

                    {/* Manual Reconciliation Modal */}
                    {reconcileModal && (
                        <div style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                            backdropFilter: 'blur(4px)',
                        }} onClick={() => setReconcileModal(null)}>
                            <div className="card" style={{ width: '100%', maxWidth: '520px', margin: '20px' }} onClick={e => e.stopPropagation()}>
                                <h3 className="section-title" style={{ marginBottom: '14px' }}>
                                    Manual Reconciliation - Booking #{reconcileModal.id}
                                </h3>
                                <form onSubmit={handleReconcileSubmit}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                                        Student: <strong>{reconcileModal.student_name}</strong> ({reconcileModal.student_email})<br />
                                        Course: <strong>{reconcileModal.subject}</strong> • Amount: <strong>₹{reconcileModal.total_amount}</strong>
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px' }}>Reconciliation Action</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                type="button"
                                                className="btn"
                                                onClick={() => setReconcileAction('mark_paid')}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 8px',
                                                    fontSize: '0.82rem',
                                                    fontWeight: 600,
                                                    background: reconcileAction === 'mark_paid' ? 'var(--accent-light)' : 'var(--bg-secondary)',
                                                    borderColor: reconcileAction === 'mark_paid' ? 'var(--accent)' : 'var(--border)',
                                                    color: reconcileAction === 'mark_paid' ? 'var(--accent-dark)' : 'var(--text-secondary)',
                                                }}
                                            >
                                                Mark as Paid & Confirmed
                                            </button>
                                            <button
                                                type="button"
                                                className="btn"
                                                onClick={() => setReconcileAction('mark_failed')}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 8px',
                                                    fontSize: '0.82rem',
                                                    fontWeight: 600,
                                                    background: reconcileAction === 'mark_failed' ? '#fee2e2' : 'var(--bg-secondary)',
                                                    borderColor: reconcileAction === 'mark_failed' ? 'var(--red)' : 'var(--border)',
                                                    color: reconcileAction === 'mark_failed' ? 'var(--red)' : 'var(--text-secondary)',
                                                }}
                                            >
                                                Mark as Failed / Cancelled
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                                            Reason & Audit Log Entry *
                                        </label>
                                        <textarea
                                            className="input"
                                            rows={3}
                                            required
                                            placeholder="Specify why this transaction is being manually reconciled (e.g. Bank statement verification, offline payment, duplicate charge fix)..."
                                            value={reconcileReason}
                                            onChange={e => setReconcileReason(e.target.value)}
                                            style={{ padding: '10px 14px', resize: 'vertical' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button type="button" className="btn" onClick={() => setReconcileModal(null)}>Cancel</button>
                                        <button type="submit" className="btn primary" disabled={reconciling}>
                                            {reconciling ? 'Processing...' : 'Confirm Reconciliation'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(FinanceReconcilePage);
