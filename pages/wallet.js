import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../lib/auth';
import { apiGet } from '../lib/api';
import StaffLayout from '../components/StaffLayout';

function Wallet() {
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiGet('/staff/wallet/').then(setWallet).catch(() => { }).finally(() => setLoading(false));
    }, []);

    return (
        <StaffLayout title="My Wallet">
            <Head><title>My Wallet | Staff Portal</title></Head>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
            ) : wallet ? (
                <div style={{ maxWidth: '560px' }}>
                    {/* Balance Card */}
                    <div className="card" style={{ marginBottom: '24px', padding: '32px', textAlign: 'center', background: 'var(--accent)', color: 'white' }}>
                        <div style={{ fontSize: '13px', opacity: 0.85, marginBottom: '8px' }}>Available Balance</div>
                        <div style={{ fontSize: '42px', fontWeight: 700 }}>₹{Number(wallet.balance).toFixed(2)}</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '24px' }}>
                            <div>
                                <div style={{ fontSize: '12px', opacity: 0.8 }}>Total Earned</div>
                                <div style={{ fontSize: '18px', fontWeight: 600 }}>₹{Number(wallet.total_earned).toFixed(2)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', opacity: 0.8 }}>Total Paid Out</div>
                                <div style={{ fontSize: '18px', fontWeight: 600 }}>₹{Number(wallet.total_paid).toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Transactions */}
                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Transaction History</h3>
                        {wallet.transactions.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No transactions yet. Complete tasks to earn!</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {wallet.transactions.map(t => (
                                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg)', borderRadius: '10px' }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 500 }}>{t.note || (t.task_title ? `Task: ${t.task_title}` : 'Transaction')}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{new Date(t.created_at).toLocaleString()}</div>
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '15px', color: t.type === 'credit' ? '#15803d' : '#c2410c' }}>
                                            {t.type === 'credit' ? '+' : '-'}₹{Number(t.amount).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="card empty-state"><h3>Wallet not found</h3><p>Contact your manager.</p></div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(Wallet);