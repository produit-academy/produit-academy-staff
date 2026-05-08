import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../../lib/auth';
import { apiGet, apiPost } from '../../lib/api';
import StaffLayout from '../../components/StaffLayout';

function Payroll() {
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [debitAmount, setDebitAmount] = useState('');
    const [debitNote, setDebitNote] = useState('');
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => { loadWallets(); }, []);

    const loadWallets = async () => {
        try {
            const data = await apiGet('/manager/wallets/');
            setWallets(data);
        } catch { }
        finally { setLoading(false); }
    };

    const processDebit = async () => {
        if (!debitAmount || !selectedWallet) return;
        setProcessing(true);
        setMessage('');
        try {
            const res = await apiPost(`/manager/wallets/${selectedWallet.id}/debit/`, {
                amount: debitAmount,
                note: debitNote || 'Salary payment',
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(`success:${data.message}`);
                setDebitAmount('');
                setDebitNote('');
                loadWallets();
                // refresh selected wallet
                const updated = await apiGet(`/manager/wallets/${selectedWallet.id}/`);
                setSelectedWallet(updated);
            } else {
                setMessage(`error:${data.error}`);
            }
        } catch { setMessage('error:Something went wrong.'); }
        finally { setProcessing(false); }
    };

    const totalEarned = wallets.reduce((s, w) => s + Number(w.total_earned), 0);
    const totalPaid = wallets.reduce((s, w) => s + Number(w.total_paid), 0);
    const totalBalance = wallets.reduce((s, w) => s + Number(w.balance), 0);

    const msgType = message.startsWith('success:') ? 'success' : 'error';
    const msgText = message.replace(/^(success|error):/, '');

    return (
        <StaffLayout title="Payroll & Wallets">
            <Head><title>Payroll | HR Portal</title></Head>

            {/* Summary */}
            <div className="stats-grid" style={{ marginBottom: '28px' }}>
                <div className="card stat-card">
                    <div className="stat-value" style={{ color: '#15803d' }}>₹{totalEarned.toFixed(2)}</div>
                    <div className="stat-label">Total Earned</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-value" style={{ color: '#1d4ed8' }}>₹{totalPaid.toFixed(2)}</div>
                    <div className="stat-label">Total Paid Out</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-value" style={{ color: '#c2410c' }}>₹{totalBalance.toFixed(2)}</div>
                    <div className="stat-label">Pending Balance</div>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
            ) : wallets.length === 0 ? (
                <div className="card empty-state"><h3>No wallets yet</h3><p>Wallets are created when staff complete tasks.</p></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {wallets.map(wallet => (
                        <div key={wallet.id} className="card" style={{ padding: '18px 20px', cursor: 'pointer' }}
                            onClick={() => { setSelectedWallet(wallet); setMessage(''); setDebitAmount(''); setDebitNote(''); }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700 }}>
                                        {(wallet.staff_name?.[0] || wallet.staff_email?.[0] || 'S').toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{wallet.staff_name || wallet.staff_email}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{wallet.staff_email}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, fontSize: '18px', color: Number(wallet.balance) > 0 ? '#c2410c' : '#15803d' }}>
                                        ₹{Number(wallet.balance).toFixed(2)}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>balance</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '24px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '13px' }}>
                                <span>Earned: <strong style={{ color: '#15803d' }}>₹{Number(wallet.total_earned).toFixed(2)}</strong></span>
                                <span>Paid: <strong style={{ color: '#1d4ed8' }}>₹{Number(wallet.total_paid).toFixed(2)}</strong></span>
                                <span>{wallet.transactions?.length || 0} transactions</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Wallet Detail Modal */}
            {selectedWallet && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedWallet(null)}>
                    <div className="modal-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '17px' }}>{selectedWallet.staff_name || selectedWallet.staff_email}</h2>
                            <button onClick={() => setSelectedWallet(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>

                        {/* Balance */}
                        <div style={{ background: 'var(--accent)', borderRadius: '12px', padding: '20px', color: 'white', textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ fontSize: '12px', opacity: 0.85 }}>Available Balance</div>
                            <div style={{ fontSize: '32px', fontWeight: 700 }}>₹{Number(selectedWallet.balance).toFixed(2)}</div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px', fontSize: '13px' }}>
                                <div><div style={{ opacity: 0.8 }}>Earned</div><div style={{ fontWeight: 600 }}>₹{Number(selectedWallet.total_earned).toFixed(2)}</div></div>
                                <div><div style={{ opacity: 0.8 }}>Paid Out</div><div style={{ fontWeight: 600 }}>₹{Number(selectedWallet.total_paid).toFixed(2)}</div></div>
                            </div>
                        </div>

                        {/* Pay Out */}
                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>Process Payment</h4>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input className="input" type="number" value={debitAmount} onChange={e => setDebitAmount(e.target.value)}
                                    placeholder="Amount (₹)" style={{ flex: 1 }} />
                                <input className="input" value={debitNote} onChange={e => setDebitNote(e.target.value)}
                                    placeholder="Note (optional)" style={{ flex: 2 }} />
                            </div>
                            {msgText && <div className={`alert ${msgType}`} style={{ marginBottom: '8px' }}>{msgText}</div>}
                            <button className="btn primary" onClick={processDebit}
                                disabled={processing || !debitAmount || Number(debitAmount) <= 0}
                                style={{ width: '100%', padding: '10px' }}>
                                {processing ? 'Processing...' : '💸 Process Payment'}
                            </button>
                        </div>

                        {/* Transaction History */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                            <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>Transaction History</h4>
                            {!selectedWallet.transactions || selectedWallet.transactions.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No transactions yet.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                    {selectedWallet.transactions.map(t => (
                                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg)', borderRadius: '8px' }}>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 500 }}>{t.note || t.task_title || 'Transaction'}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{new Date(t.created_at).toLocaleString()}</div>
                                            </div>
                                            <div style={{ fontWeight: 700, color: t.type === 'credit' ? '#15803d' : '#c2410c' }}>
                                                {t.type === 'credit' ? '+' : '-'}₹{Number(t.amount).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(Payroll);