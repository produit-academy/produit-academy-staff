import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../../lib/auth';
import { apiGet, apiPost } from '../../lib/api';
import StaffLayout from '../../components/StaffLayout';
import { useAuth } from '../../lib/auth';
import { useRouter } from 'next/router';

const STATUS_COLORS = {
    pending: { bg: '#fff7ed', color: '#c2410c', label: 'Pending' },
    in_progress: { bg: '#eff6ff', color: '#1d4ed8', label: 'In Progress' },
    completed: { bg: '#f0fdf4', color: '#15803d', label: 'Completed' },
};

function HRStaff() {
    const { user } = useAuth();
    const router = useRouter();
    const [staffList, setStaffList] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateStaff, setShowCreateStaff] = useState(false);
    const [showAssignTask, setShowAssignTask] = useState(null); // staff object
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const [staffForm, setStaffForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone_number: '', designation: '' });
    const [taskForm, setTaskForm] = useState({ title: '', description: '', due_date: '', payment_amount: '' });

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        try {
            const [s, t] = await Promise.all([
                apiGet('/manager/staff/'),
                apiGet('/manager/tasks/'),
            ]);
            setStaffList(s);
            setAllTasks(t);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const createStaff = async () => {
        if (!staffForm.email || !staffForm.password) return;
        setSaving(true);
        setMessage('');
        try {
            const res = await apiPost('/staff/signup/', staffForm);
            const data = await res.json();
            if (res.ok) {
                setMessage('success:Staff account created!');
                setShowCreateStaff(false);
                setStaffForm({ email: '', password: '', first_name: '', last_name: '', phone_number: '', designation: '' });
                loadAll();
            } else {
                setMessage(`error:${data.error || 'Failed to create staff.'}`);
            }
        } catch { setMessage('error:Something went wrong.'); }
        finally { setSaving(false); }
    };

    const assignTask = async () => {
        if (!taskForm.title || !showAssignTask) return;
        setSaving(true);
        setMessage('');
        try {
            const payload = {
                title: taskForm.title,
                description: taskForm.description,
                due_date: taskForm.due_date || null,
                payment_amount: taskForm.payment_amount || 0,
                assigned_to: showAssignTask.user,
            };
            const res = await apiPost('/manager/tasks/create/', payload);
            const data = await res.json();
            if (res.ok) {
                setMessage('success:Task assigned!');
                setShowAssignTask(null);
                setTaskForm({ title: '', description: '', due_date: '', payment_amount: '' });
                loadAll();
            } else {
                setMessage(`error:${JSON.stringify(data)}`);
            }
        } catch { setMessage('error:Something went wrong.'); }
        finally { setSaving(false); }
    };

    const msgType = message.startsWith('success:') ? 'success' : 'error';
    const msgText = message.replace(/^(success|error):/, '');

    const isAllowed = user?.role === 'admin' || user?.role === 'manager' || user?.is_staff;

    if (!isAllowed) {
        return <StaffLayout title="Access Denied"><div className="card empty-state"><h3>Access Denied</h3></div></StaffLayout>;
    }

    return (
        <StaffLayout title="Staff Members">
            <Head><title>Staff Members | HR Portal</title></Head>

            {msgText && <div className={`alert ${msgType}`} style={{ marginBottom: '16px' }}>{msgText}</div>}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="stats-grid" style={{ marginBottom: '28px' }}>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: 'var(--accent)' }}>{staffList.length}</div>
                            <div className="stat-label">Total Staff</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: '#c2410c' }}>{allTasks.filter(t => t.status === 'pending').length}</div>
                            <div className="stat-label">Pending Tasks</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: '#15803d' }}>{allTasks.filter(t => t.status === 'completed').length}</div>
                            <div className="stat-label">Completed</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 className="section-title" style={{ margin: 0 }}>All Staff Members</h3>
                        <button className="btn primary" onClick={() => setShowCreateStaff(true)} style={{ padding: '8px 16px' }}>+ Add Staff</button>
                    </div>

                    {staffList.length === 0 ? (
                        <div className="card empty-state"><h3>No staff yet</h3><p>Add staff members to get started.</p></div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {staffList.map(staff => {
                                const staffTasks = allTasks.filter(t => t.assigned_to === staff.user);
                                const done = staffTasks.filter(t => t.status === 'completed').length;
                                const total = staffTasks.length;
                                const progress = total > 0 ? Math.round((done / total) * 100) : 0;

                                return (
                                    <div key={staff.id} className="card" style={{ padding: '18px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, flexShrink: 0 }}>
                                                {(staff.full_name?.[0] || staff.email?.[0] || 'S').toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '15px' }}>{staff.full_name || staff.email}</div>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{staff.designation || 'Staff'} • {staff.email}</div>
                                                {staff.phone_number && <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>📞 {staff.phone_number}</div>}
                                                {total > 0 && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                                                            <span>{done}/{total} tasks done</span>
                                                            <span>{progress}%</span>
                                                        </div>
                                                        <div style={{ height: '4px', background: 'var(--border)', borderRadius: '4px' }}>
                                                            <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#15803d' : 'var(--accent)', borderRadius: '4px' }} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn primary" onClick={() => setShowAssignTask(staff)} style={{ padding: '6px 14px', fontSize: '13px' }}>
                                                    + Assign Task
                                                </button>
                                                <button onClick={() => router.push(`/hr/tasks?staff_id=${staff.user}`)}
                                                    style={{ padding: '6px 14px', fontSize: '13px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                                                    View Tasks
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Create Staff Modal */}
            {showCreateStaff && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreateStaff(false)}>
                    <div className="modal-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '17px' }}>Add New Staff</h2>
                            <button onClick={() => setShowCreateStaff(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        {[
                            { label: 'Email *', key: 'email', type: 'email', placeholder: 'staff@example.com' },
                            { label: 'Password *', key: 'password', type: 'password', placeholder: 'Set a password' },
                            { label: 'First Name', key: 'first_name', placeholder: 'First name' },
                            { label: 'Last Name', key: 'last_name', placeholder: 'Last name' },
                            { label: 'Phone', key: 'phone_number', placeholder: 'Phone number' },
                            { label: 'Designation', key: 'designation', placeholder: 'e.g. Content Manager' },
                        ].map(f => (
                            <div className="form-group" key={f.key}>
                                <label className="label">{f.label}</label>
                                <input className="input" type={f.type || 'text'} placeholder={f.placeholder}
                                    value={staffForm[f.key]} onChange={e => setStaffForm(p => ({ ...p, [f.key]: e.target.value }))} />
                            </div>
                        ))}
                        {msgText && <div className={`alert ${msgType}`} style={{ marginBottom: '12px' }}>{msgText}</div>}
                        <button className="btn primary" onClick={createStaff} disabled={saving || !staffForm.email || !staffForm.password} style={{ width: '100%', padding: '12px' }}>
                            {saving ? 'Creating...' : 'Create Staff Account'}
                        </button>
                    </div>
                </div>
            )}

            {/* Assign Task Modal */}
            {showAssignTask && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAssignTask(null)}>
                    <div className="modal-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h2 style={{ margin: 0, fontSize: '17px' }}>Assign Task</h2>
                            <button onClick={() => setShowAssignTask(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                            Assigning to: <strong>{showAssignTask.full_name || showAssignTask.email}</strong>
                        </p>
                        <div className="form-group">
                            <label className="label">Task Title *</label>
                            <input className="input" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title" />
                        </div>
                        <div className="form-group">
                            <label className="label">Description</label>
                            <textarea className="input" rows={3} value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} placeholder="Task details..." style={{ resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="label">Due Date</label>
                                <input className="input" type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="label">Payment (₹)</label>
                                <input className="input" type="number" value={taskForm.payment_amount} onChange={e => setTaskForm(p => ({ ...p, payment_amount: e.target.value }))} placeholder="0.00" />
                            </div>
                        </div>
                        {msgText && <div className={`alert ${msgType}`} style={{ marginBottom: '12px' }}>{msgText}</div>}
                        <button className="btn primary" onClick={assignTask} disabled={saving || !taskForm.title} style={{ width: '100%', padding: '12px' }}>
                            {saving ? 'Assigning...' : 'Assign Task'}
                        </button>
                    </div>
                </div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(HRStaff);