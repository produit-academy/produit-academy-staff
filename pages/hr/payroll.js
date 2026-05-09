import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../../lib/auth';
import { apiGet, apiPost } from '../../lib/api';
import StaffLayout from '../../components/StaffLayout';

function Payroll() {
    const [wallets, setWallets] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('unpaid'); // 'unpaid' or 'wallets'
    const [payingTask, setPayingTask] = useState(null);
    const [payAmount, setPayAmount] = useState('');

    const [adjustWallet, setAdjustWallet] = useState(null);
    const [adjustForm, setAdjustForm] = useState({ type: 'credit', amount: '', note: '' });

    useEffect(() => {
        Promise.all([loadWallets(), loadTasks()]).finally(() => setLoading(false));
    }, []);

    const loadWallets = async () => {
        try { setWallets(await apiGet('/api/staff/manager/wallets/')); }
        catch { }
    };

    const loadTasks = async () => {
        try { setTasks(await apiGet('/api/staff/manager/tasks/?status=completed')); }
        catch { }
    };

    const unpaidTasks = tasks.filter(t => t.status === 'completed' && !t.is_paid);

    const markPaid = async (taskId) => {
        const amount = parseFloat(payAmount);
        if (!amount || amount <= 0) return alert('Enter a valid amount.');
        try {
            const res = await apiPost(`/api/staff/manager/tasks/${taskId}/pay/`, { amount });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                setPayingTask(null);
                setPayAmount('');
                loadWallets();
                loadTasks();
            } else {
                alert(data.error || 'Payment failed.');
            }
        } catch { }
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await apiPost(`/api/staff/manager/wallets/${adjustWallet.id}/transactions/`, adjustForm);
            const data = await res.json();
            if (res.ok) {
                alert('Wallet adjusted successfully.');
                setAdjustWallet(null);
                setAdjustForm({ type: 'credit', amount: '', note: '' });
                loadWallets();
            } else {
                alert(data.error || 'Adjustment failed.');
            }
        } catch { }
    };

    const totalEarned = wallets.reduce((sum, w) => sum + parseFloat(w.total_earned || 0), 0);
    const totalPaid = wallets.reduce((sum, w) => sum + parseFloat(w.total_paid || 0), 0);
    const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance || 0), 0);

    return (
        <StaffLayout title="Payroll">
            <Head><title>Payroll | Staff Portal</title></Head>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ textAlign: 'center', borderTop: '3px solid var(--green)' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Earned (All)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--green)' }}>₹{totalEarned.toFixed(2)}</div>
                </div>
                <div className="card" style={{ textAlign: 'center', borderTop: '3px solid var(--red)' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Paid Out</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--red)' }}>₹{totalPaid.toFixed(2)}</div>
                </div>
                <div className="card" style={{ textAlign: 'center', borderTop: '3px solid var(--accent)' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Pending Balance</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>₹{totalBalance.toFixed(2)}</div>
                </div>
                <div className="card" style={{ textAlign: 'center', borderTop: '3px solid #7c3aed' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Unpaid Tasks</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#7c3aed' }}>{unpaidTasks.length}</div>
                </div>
            </div>

            {/* Tabs & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className={`btn ${tab === 'unpaid' ? 'primary' : ''}`}
                        onClick={() => setTab('unpaid')} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                        Unpaid Tasks ({unpaidTasks.length})
                    </button>
                    <button className={`btn ${tab === 'wallets' ? 'primary' : ''}`}
                        onClick={() => setTab('wallets')} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                        All Wallets ({wallets.length})
                    </button>
                </div>
                <button className="btn" onClick={() => { setLoading(true); Promise.all([loadWallets(), loadTasks()]).finally(() => setLoading(false)); }}
                    style={{ fontSize: '0.82rem', padding: '6px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 1 0 2.6-6.4L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 1 0-2.6 6.4L3 16" /></svg>
                    Refresh Status
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
            ) : tab === 'unpaid' ? (
                /* Unpaid Tasks */
                unpaidTasks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {unpaidTasks.map(t => (
                            <div key={t.id} className="card" style={{ borderLeft: '4px solid var(--green)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 4px' }}>{t.title}</h4>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            Assigned to: <strong>{t.assigned_to_name || t.assigned_to_email}</strong>
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            {t.completed_at ? `Completed: ${new Date(t.completed_at).toLocaleDateString()}` : ''}
                                            {t.payment_amount > 0 ? ` · Agreed: ₹${t.payment_amount}` : ''}
                                        </div>
                                    </div>

                                    {payingTask === t.id ? (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input type="number" className="input" placeholder="₹ Amount"
                                                value={payAmount} onChange={e => setPayAmount(e.target.value)}
                                                style={{ width: '120px', padding: '6px 10px', fontSize: '0.85rem' }} />
                                            <button className="btn primary" onClick={() => markPaid(t.id)}
                                                style={{ fontSize: '0.82rem', padding: '6px 12px' }}>Pay</button>
                                            <button className="btn" onClick={() => { setPayingTask(null); setPayAmount(''); }}
                                                style={{ fontSize: '0.82rem', padding: '6px 12px' }}>Cancel</button>
                                        </div>
                                    ) : (
                                        <button className="btn primary" onClick={() => { setPayingTask(t.id); setPayAmount(t.payment_amount || ''); }}
                                            style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
                                            Mark Paid
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card empty-state"><h3>All caught up!</h3><p>No unpaid completed tasks.</p></div>
                )
            ) : (
                /* All Wallets */
                wallets.length > 0 ? (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Staff</th>
                                    <th>Role</th>
                                    <th>Total Earned</th>
                                    <th>Total Paid</th>
                                    <th>Balance</th>
                                    <th>Last Updated</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {wallets.map(w => (
                                    <tr key={w.id}>
                                        <td>
                                            <strong>{w.staff_name}</strong>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{w.staff_email}</div>
                                        </td>
                                        <td style={{ textTransform: 'capitalize' }}>{w.staff_role}</td>
                                        <td style={{ color: 'var(--green)', fontWeight: 600 }}>₹{w.total_earned}</td>
                                        <td style={{ color: 'var(--red)', fontWeight: 600 }}>₹{w.total_paid}</td>
                                        <td style={{ fontWeight: 700 }}>₹{w.balance}</td>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{new Date(w.updated_at).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn" onClick={() => setAdjustWallet(w)}
                                                style={{ fontSize: '0.78rem', padding: '4px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                                Adjust
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="card empty-state"><h3>No wallets</h3><p>Wallets are created when staff receive their first payment.</p></div>
                )
            )}

            {/* Adjust Wallet Modal */}
            {adjustWallet && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)',
                }} onClick={() => setAdjustWallet(null)}>
                    <div className="card" style={{
                        width: '100%', maxWidth: '400px', margin: '20px',
                        animation: 'fadeIn 0.2s ease',
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 className="section-title" style={{ marginBottom: '20px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                Adjust Wallet — {adjustWallet.staff_name}
                            </span>
                        </h3>
                        <form onSubmit={handleAdjustSubmit}>
                            <div style={{ display: 'grid', gap: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Adjustment Type</label>
                                    <select className="input" required value={adjustForm.type}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}>
                                        <option value="credit">Bonus / Correction (Adds to Total Earned)</option>
                                        <option value="debit">Payout / Deduction (Adds to Total Paid)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Amount (₹)</label>
                                    <input className="input" type="number" step="0.01" required value={adjustForm.amount}
                                        onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Note</label>
                                    <input className="input" type="text" required value={adjustForm.note} placeholder="e.g. Correction for overpayment"
                                        onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" style={{ padding: '8px 20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                                    onClick={() => setAdjustWallet(null)}>Cancel</button>
                                <button type="submit" className="btn primary" style={{ padding: '8px 24px' }}>Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </StaffLayout>
    );
}

export default withStaffAuth(Payroll);
