import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../lib/auth';
import { apiGet } from '../lib/api';
import StaffLayout from '../components/StaffLayout';

function Wallet() {
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiGet('/api/staff/wallet/')
            .then(data => setWallet(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <StaffLayout title="My Wallet">
            <Head><title>Wallet | Staff Portal</title></Head>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
            ) : wallet ? (
                <>
                    {/* Header & Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: '1.5' }}>
                            <strong>How this works:</strong> <span style={{ color: 'var(--green)' }}>Total Earned</span> is money you've generated from tasks. 
                            <span style={{ color: 'var(--red)', marginLeft: '4px' }}>Total Paid</span> is money already transferred to your bank account. 
                            The <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Balance</span> is what the academy currently owes you.
                        </p>
                        <button className="btn" onClick={() => { setLoading(true); apiGet('/api/staff/wallet/').then(data => setWallet(data)).finally(() => setLoading(false)); }}
                            style={{ fontSize: '0.82rem', padding: '6px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 2.6-6.4L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 1 0-2.6 6.4L3 16"/></svg>
                            Refresh Status
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        <div className="card" style={{ textAlign: 'center', borderTop: '3px solid var(--green)' }}>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Earned</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--green)' }}>₹{wallet.total_earned}</div>
                        </div>
                        <div className="card" style={{ textAlign: 'center', borderTop: '3px solid var(--red)' }}>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Paid</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--red)' }}>₹{wallet.total_paid}</div>
                        </div>
                        <div className="card" style={{ textAlign: 'center', borderTop: '3px solid var(--accent)' }}>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Balance</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>₹{wallet.balance}</div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="card">
                        <h3 style={{ margin: '0 0 16px' }}>Transaction History</h3>
                        {wallet.transactions?.length > 0 ? (
                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Amount</th>
                                            <th>Task</th>
                                            <th>Note</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {wallet.transactions.map(t => (
                                            <tr key={t.id}>
                                                <td style={{ whiteSpace: 'nowrap' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <span className="badge" style={{
                                                        background: t.type === 'credit' ? 'var(--green-bg)' : 'var(--red-bg)',
                                                        color: t.type === 'credit' ? 'var(--green)' : 'var(--red)',
                                                    }}>
                                                        {t.type}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 600 }}>₹{t.amount}</td>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t.task_title || '--'}</td>
                                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t.note || '--'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>No transactions yet.</p>
                        )}
                    </div>
                </>
            ) : (
                <div className="card empty-state"><h3>Wallet not available</h3></div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(Wallet);
