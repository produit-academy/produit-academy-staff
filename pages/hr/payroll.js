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

    const [showDirectPay, setShowDirectPay] = useState(false);
    const [staffList, setStaffList] = useState([]);
    const [directPayForm, setDirectPayForm] = useState({ staff_id: '', type: 'credit', amount: '', note: '' });

    const [walletRoleFilter, setWalletRoleFilter] = useState('all');
    const [walletSearch, setWalletSearch] = useState('');

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

    const filteredWallets = wallets.filter(w => {
        if (walletRoleFilter !== 'all') {
            if (w.staff_role !== walletRoleFilter) return false;
        }
        if (walletSearch.trim()) {
            const q = walletSearch.toLowerCase();
            const nameMatch = (w.staff_name || '').toLowerCase().includes(q);
            const emailMatch = (w.staff_email || '').toLowerCase().includes(q);
            if (!nameMatch && !emailMatch) return false;
        }
        return true;
    });

    const staffCount = wallets.filter(w => w.staff_role === 'staff').length;
    const teacherCount = wallets.filter(w => w.staff_role === 'teacher').length;
    const managerCount = wallets.filter(w => w.staff_role === 'manager').length;

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

    const openDirectPay = async (preselectedStaff = null) => {
        setShowDirectPay(true);
        if (preselectedStaff) {
            setDirectPayForm({ staff_id: preselectedStaff.staff || preselectedStaff.id, type: 'credit', amount: '', note: '' });
        }
        if (staffList.length === 0) {
            try { setStaffList(await apiGet('/api/staff/manager/staff/')); }
            catch { }
        }
    };

    const handleDirectPaySubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await apiPost('/api/staff/manager/direct-pay/', directPayForm);
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                setShowDirectPay(false);
                setDirectPayForm({ staff_id: '', type: 'credit', amount: '', note: '' });
                loadWallets();
            } else {
                alert(data.error || 'Direct payment failed.');
            }
        } catch { }
    };

    const totalEarned = wallets.reduce((sum, w) => sum + parseFloat(w.total_earned || 0), 0);
    const totalPaid = wallets.reduce((sum, w) => sum + parseFloat(w.total_paid || 0), 0);
    const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance || 0), 0);

    return (
        <StaffLayout title="Payroll & Compensations">
            <Head><title>Payroll & Staff Compensation | Staff Portal</title></Head>

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
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: totalBalance > 0 ? 'var(--red)' : 'var(--accent)' }}>₹{totalBalance.toFixed(2)}</div>
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
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn" onClick={() => openDirectPay()}
                        style={{ fontSize: '0.82rem', padding: '6px 14px', background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Direct Payment
                    </button>
                    <button className="btn" onClick={() => { setLoading(true); Promise.all([loadWallets(), loadTasks()]).finally(() => setLoading(false)); }}
                        style={{ fontSize: '0.82rem', padding: '6px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 1 0 2.6-6.4L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 1 0-2.6 6.4L3 16" /></svg>
                        Refresh Status
                    </button>
                </div>
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
                <div>
                    {/* Filter Pills & Search Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                                className="btn"
                                onClick={() => setWalletRoleFilter('all')}
                                style={{
                                    fontSize: '0.78rem', padding: '5px 12px', borderRadius: '20px',
                                    background: walletRoleFilter === 'all' ? 'var(--accent)' : 'var(--bg-secondary)',
                                    color: walletRoleFilter === 'all' ? '#fff' : 'var(--text-secondary)',
                                    border: '1px solid var(--border)'
                                }}>
                                All ({wallets.length})
                            </button>
                            <button
                                className="btn"
                                onClick={() => setWalletRoleFilter('staff')}
                                style={{
                                    fontSize: '0.78rem', padding: '5px 12px', borderRadius: '20px',
                                    background: walletRoleFilter === 'staff' ? '#2563eb' : 'var(--bg-secondary)',
                                    color: walletRoleFilter === 'staff' ? '#fff' : 'var(--text-secondary)',
                                    border: '1px solid var(--border)'
                                }}>
                                Staff ({staffCount})
                            </button>
                            <button
                                className="btn"
                                onClick={() => setWalletRoleFilter('teacher')}
                                style={{
                                    fontSize: '0.78rem', padding: '5px 12px', borderRadius: '20px',
                                    background: walletRoleFilter === 'teacher' ? '#059669' : 'var(--bg-secondary)',
                                    color: walletRoleFilter === 'teacher' ? '#fff' : 'var(--text-secondary)',
                                    border: '1px solid var(--border)'
                                }}>
                                Teachers (Approved) ({teacherCount})
                            </button>
                            {managerCount > 0 && (
                                <button
                                    className="btn"
                                    onClick={() => setWalletRoleFilter('manager')}
                                    style={{
                                        fontSize: '0.78rem', padding: '5px 12px', borderRadius: '20px',
                                        background: walletRoleFilter === 'manager' ? '#7c3aed' : 'var(--bg-secondary)',
                                        color: walletRoleFilter === 'manager' ? '#fff' : 'var(--text-secondary)',
                                        border: '1px solid var(--border)'
                                    }}>
                                    Managers ({managerCount})
                                </button>
                            )}
                        </div>

                        <div style={{ position: 'relative', width: '260px' }}>
                            <input
                                type="text"
                                className="input"
                                placeholder="Search by name or email..."
                                value={walletSearch}
                                onChange={(e) => setWalletSearch(e.target.value)}
                                style={{ fontSize: '0.82rem', padding: '6px 12px 6px 30px', width: '100%', borderRadius: '8px' }}
                            />
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>
                    </div>

                    {filteredWallets.length > 0 ? (
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Staff / Teacher</th>
                                        <th>Role / Rate</th>
                                        <th>Total Earned</th>
                                        <th>Total Paid</th>
                                        <th>Pending Balance</th>
                                        <th>Last Updated</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredWallets.map(w => {
                                        const isTeacher = w.staff_role === 'teacher';
                                        const isManager = w.staff_role === 'manager';
                                        const isStaff = w.staff_role === 'staff';
                                        const roleBadgeBg = isTeacher ? '#d1fae5' : isManager ? '#ede9fe' : '#dbeafe';
                                        const roleBadgeColor = isTeacher ? '#065f46' : isManager ? '#5b21b6' : '#1e40af';

                                        return (
                                            <tr key={w.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{
                                                            width: '34px', height: '34px', borderRadius: '50%',
                                                            background: isTeacher ? '#10b981' : isManager ? '#8b5cf6' : '#3b82f6',
                                                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontWeight: 700, fontSize: '0.85rem'
                                                        }}>
                                                            {(w.staff_name || w.staff_email || '?')[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <strong style={{ fontSize: '0.9rem' }}>{w.staff_name}</strong>
                                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{w.staff_email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '3px 8px', borderRadius: '6px',
                                                        fontSize: '0.75rem', fontWeight: 700,
                                                        background: roleBadgeBg, color: roleBadgeColor
                                                    }}>
                                                        {w.role_display || (w.staff_role ? w.staff_role.toUpperCase() : 'STAFF')}
                                                    </span>
                                                    {isTeacher && w.hourly_rate && parseFloat(w.hourly_rate) > 0 && (
                                                        <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                                                            ₹{w.hourly_rate} / class
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ color: 'var(--green)', fontWeight: 600 }}>₹{w.total_earned}</td>
                                                <td style={{ color: 'var(--red)', fontWeight: 600 }}>₹{w.total_paid}</td>
                                                <td>
                                                    <span style={{
                                                        fontWeight: 700,
                                                        color: parseFloat(w.balance || 0) > 0 ? '#dc2626' : 'var(--text-primary)'
                                                    }}>
                                                        ₹{w.balance}
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(w.updated_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                        <button
                                                            className="btn"
                                                            onClick={() => openDirectPay(w)}
                                                            style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green)' }}
                                                            title="Direct Payment">
                                                            Pay
                                                        </button>
                                                        <button
                                                            className="btn"
                                                            onClick={() => setAdjustWallet(w)}
                                                            style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                                                            title="Adjust Balance">
                                                            Adjust
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
                        <div className="card empty-state">
                            <h3>No wallets match</h3>
                            <p>{wallets.length === 0 ? 'Wallets are created automatically for staff and approved teachers.' : 'Try changing your search or role filter.'}</p>
                        </div>
                    )}
                </div>
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
                                Adjust Wallet - {adjustWallet.staff_name}
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

            {/* Direct Pay Modal */}
            {showDirectPay && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)',
                }} onClick={() => setShowDirectPay(false)}>
                    <div className="card" style={{
                        width: '100%', maxWidth: '400px', margin: '20px',
                        animation: 'fadeIn 0.2s ease',
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 className="section-title" style={{ marginBottom: '20px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                Direct Payment
                            </span>
                        </h3>
                        <form onSubmit={handleDirectPaySubmit}>
                            <div style={{ display: 'grid', gap: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Staff Member</label>
                                    <select className="input" required value={directPayForm.staff_id}
                                        onChange={(e) => setDirectPayForm({ ...directPayForm, staff_id: e.target.value })}>
                                        <option value="">Select Staff...</option>
                                        {staffList.map(s => {
                                            const name = s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email;
                                            const roleLabel = s.role === 'teacher' ? 'Teacher' : s.role === 'manager' ? 'Manager' : 'Staff';
                                            return (
                                                <option key={s.id} value={s.id}>
                                                    {name} ({s.email}) — [{roleLabel}]
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Transaction Type</label>
                                    <select className="input" required value={directPayForm.type}
                                        onChange={(e) => setDirectPayForm({ ...directPayForm, type: e.target.value })}>
                                        <option value="credit">Add Earnings (Credit)</option>
                                        <option value="debit">Record Payout (Debit)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Amount (₹)</label>
                                    <input className="input" type="number" step="0.01" required value={directPayForm.amount}
                                        onChange={(e) => setDirectPayForm({ ...directPayForm, amount: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Note</label>
                                    <input className="input" type="text" required value={directPayForm.note} placeholder="e.g. Payment for teaching"
                                        onChange={(e) => setDirectPayForm({ ...directPayForm, note: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" style={{ padding: '8px 20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                                    onClick={() => setShowDirectPay(false)}>Cancel</button>
                                <button type="submit" className="btn primary" style={{ padding: '8px 24px', background: 'var(--green)' }}>Submit</button>
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
