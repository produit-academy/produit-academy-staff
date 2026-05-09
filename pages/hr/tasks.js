import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../../lib/auth';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api';
import StaffLayout from '../../components/StaffLayout';

function HRTasks() {
    const [tasks, setTasks] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', assigned_to: '', due_date: '', payment_amount: '' });

    useEffect(() => {
        Promise.all([loadTasks(), loadStaff()]).finally(() => setLoading(false));
    }, []);

    const loadTasks = async () => {
        try { setTasks(await apiGet('/api/staff/manager/tasks/')); }
        catch { }
    };

    const loadStaff = async () => {
        try { setStaff(await apiGet('/api/staff/manager/staff/')); }
        catch { }
    };

    const createTask = async () => {
        if (!form.title || !form.assigned_to) return alert('Title and assignee are required.');
        try {
            const data = {
                title: form.title,
                description: form.description,
                assigned_to: parseInt(form.assigned_to),
                due_date: form.due_date || null,
                payment_amount: form.payment_amount || 0,
            };
            await apiPost('/api/staff/manager/tasks/create/', data);
            setForm({ title: '', description: '', assigned_to: '', due_date: '', payment_amount: '' });
            setShowForm(false);
            loadTasks();
        } catch { }
    };

    const deleteTask = async (id) => {
        if (!confirm('Delete this task?')) return;
        try {
            await apiDelete(`/api/staff/manager/tasks/${id}/`);
            loadTasks();
        } catch { }
    };

    const revertTask = async (task) => {
        if (task.is_paid) return alert('Cannot revert a paid task.');
        if (!confirm('Revert this task to In Progress?')) return;
        try {
            await apiPatch(`/api/staff/manager/tasks/${task.id}/`, { status: 'in_progress' });
            loadTasks();
        } catch { }
    };

    const filtered = tasks.filter(t => filter === 'all' || t.status === filter);

    const statusColor = (s) => {
        if (s === 'completed') return 'var(--green)';
        if (s === 'in_progress') return 'var(--accent)';
        return 'var(--text-secondary)';
    };

    const statusBg = (s) => {
        if (s === 'completed') return 'var(--green-bg)';
        if (s === 'in_progress') return 'var(--accent-light)';
        return 'var(--bg-secondary)';
    };

    return (
        <StaffLayout title="Task Management">
            <Head><title>Task Management | Staff Portal</title></Head>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['all', 'pending', 'in_progress', 'completed'].map(f => (
                        <button key={f} className={`btn ${filter === f ? 'primary' : ''}`}
                            onClick={() => setFilter(f)}
                            style={{ fontSize: '0.82rem', padding: '6px 14px', textTransform: 'capitalize' }}>
                            {f === 'all' ? `All (${tasks.length})` : `${f.replace('_', ' ')} (${tasks.filter(t => t.status === f).length})`}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn" onClick={() => { setLoading(true); loadTasks().finally(() => setLoading(false)); }}
                        style={{ fontSize: '0.82rem', padding: '6px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 2.6-6.4L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 1 0-2.6 6.4L3 16"/></svg>
                        Refresh Status
                    </button>
                    <button className="btn primary" onClick={() => setShowForm(!showForm)}
                        style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                        {showForm ? 'Cancel' : '+ Create Task'}
                    </button>
                </div>
            </div>

            {/* Create Task Form */}
            {showForm && (
                <div className="card" style={{ marginBottom: '20px', borderTop: '3px solid var(--accent)' }}>
                    <h3 style={{ margin: '0 0 16px' }}>New Task</h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        <input type="text" className="input" placeholder="Task title *"
                            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            style={{ padding: '10px 14px' }} />
                        <textarea className="input" placeholder="Description (optional)"
                            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={3} style={{ padding: '10px 14px', resize: 'vertical' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                            <select className="input" value={form.assigned_to}
                                onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                                style={{ padding: '10px 14px' }}>
                                <option value="">Assign to... *</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
                                ))}
                            </select>
                            <input type="date" className="input" value={form.due_date}
                                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                                style={{ padding: '10px 14px' }} />
                            <input type="number" className="input" placeholder="Payment ₹"
                                value={form.payment_amount}
                                onChange={e => setForm(f => ({ ...f, payment_amount: e.target.value }))}
                                style={{ padding: '10px 14px' }} />
                        </div>
                        <button className="btn primary" onClick={createTask}
                            style={{ width: 'fit-content', padding: '10px 24px' }}>
                            Create Task
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
            ) : filtered.length > 0 ? (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Task</th>
                                <th>Assigned To</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th>Due Date</th>
                                <th>Created</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(t => (
                                <tr key={t.id}>
                                    <td>
                                        <strong>{t.title}</strong>
                                        {t.description && <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{t.description.substring(0, 80)}{t.description.length > 80 ? '...' : ''}</div>}
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>
                                        {t.assigned_to_name || t.assigned_to_email}
                                    </td>
                                    <td>
                                        <span className="badge" style={{ background: statusBg(t.status), color: statusColor(t.status) }}>
                                            {t.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{t.payment_amount > 0 ? `₹${t.payment_amount}` : '--'}</td>
                                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{t.due_date ? new Date(t.due_date).toLocaleDateString() : '--'}</td>
                                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {t.status === 'completed' && !t.is_paid && (
                                                <button className="btn" onClick={() => revertTask(t)}
                                                    style={{ fontSize: '0.78rem', padding: '4px 10px', background: 'var(--yellow-bg)', color: '#b8860b', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
                                                    Revert
                                                </button>
                                            )}
                                            <button className="btn" onClick={() => deleteTask(t.id)}
                                                style={{ fontSize: '0.78rem', padding: '4px 10px', color: 'var(--red)' }}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card empty-state"><h3>No tasks</h3><p>Create a task to get started.</p></div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(HRTasks);
