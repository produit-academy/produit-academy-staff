import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../lib/auth';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';
import StaffLayout from '../components/StaffLayout';
import { useAuth } from '../lib/auth';

const STATUS_COLORS = {
    pending: { bg: '#fff7ed', color: '#c2410c', label: 'Pending' },
    in_progress: { bg: '#eff6ff', color: '#1d4ed8', label: 'In Progress' },
    completed: { bg: '#f0fdf4', color: '#15803d', label: 'Completed' },
};

function StaffManagement() {
    const { user } = useAuth();
    const [staffList, setStaffList] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [view, setView] = useState('staff'); // 'staff' | 'tasks'
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showCreateStaff, setShowCreateStaff] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [commenting, setCommenting] = useState(false);
    const [message, setMessage] = useState('');

    const [taskForm, setTaskForm] = useState({
        title: '', description: '', assigned_to: '', due_date: '', status: 'pending'
    });
    const [staffForm, setStaffForm] = useState({
        email: '', password: '', first_name: '', last_name: '', phone_number: '', designation: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        try {
            const [staffData, taskData] = await Promise.all([
                apiGet('/admin/staff/'),
                apiGet('/admin/staff/tasks/'),
            ]);
            setStaffList(staffData);
            setTasks(taskData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadStaffTasks = async (staffId) => {
        try {
            const data = await apiGet(`/admin/staff/tasks/?staff_id=${staffId}`);
            setTasks(data);
        } catch { }
    };

    const openStaff = (staff) => {
        setSelectedStaff(staff);
        setView('tasks');
        loadStaffTasks(staff.user);
    };

    const backToStaff = () => {
        setSelectedStaff(null);
        setView('staff');
        apiGet('/admin/staff/tasks/').then(setTasks).catch(() => { });
    };

    const openTaskDetail = async (task) => {
        setSelectedTask(task);
        setShowTaskModal(true);
        setCommentText('');
        try {
            const data = await apiGet(`/staff/tasks/${task.id}/comments/`);
            setComments(data);
        } catch {
            setComments(task.comments || []);
        }
    };

    const submitComment = async () => {
        if (!commentText.trim()) return;
        setCommenting(true);
        try {
            const res = await apiPost(`/staff/tasks/${selectedTask.id}/comments/`, { text: commentText });
            if (res.ok) {
                const newComment = await res.json();
                setComments(prev => [...prev, newComment]);
                setCommentText('');
            }
        } catch { }
        finally { setCommenting(false); }
    };

    const createTask = async () => {
        if (!taskForm.title || !taskForm.assigned_to) return;
        setSaving(true);
        setMessage('');
        try {
            const res = await apiPost('/admin/staff/tasks/create/', taskForm);
            if (res.ok) {
                const newTask = await res.json();
                setTasks(prev => [newTask, ...prev]);
                setTaskForm({ title: '', description: '', assigned_to: selectedStaff?.user || '', due_date: '', status: 'pending' });
                setMessage('✓ Task assigned successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                const err = await res.json();
                setMessage(JSON.stringify(err));
            }
        } catch {
            setMessage('Something went wrong.');
        } finally {
            setSaving(false);
        }
    };

    const createStaff = async () => {
        if (!staffForm.email || !staffForm.password) return;
        setSaving(true);
        setMessage('');
        try {
            const res = await apiPost('/staff/signup/', staffForm);
            if (res.ok) {
                const data = await res.json();
                setMessage('✓ Staff account created!');
                setShowCreateStaff(false);
                setStaffForm({ email: '', password: '', first_name: '', last_name: '', phone_number: '', designation: '' });
                loadAll();
                setTimeout(() => setMessage(''), 3000);
            } else {
                const err = await res.json();
                setMessage(err.error || 'Failed to create staff.');
            }
        } catch {
            setMessage('Something went wrong.');
        } finally {
            setSaving(false);
        }
    };

    const deleteTask = async (taskId) => {
        if (!confirm('Delete this task?')) return;
        try {
            const res = await apiDelete(`/admin/staff/tasks/${taskId}/`);
            if (res.ok) {
                setTasks(prev => prev.filter(t => t.id !== taskId));
                setShowTaskModal(false);
            }
        } catch { }
    };

    // Stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

    if (user?.role !== 'admin' && !user?.is_staff) {
        return (
            <StaffLayout title="Access Denied">
                <div className="card empty-state">
                    <h3>Access Denied</h3>
                    <p>Only admins can access this page.</p>
                </div>
            </StaffLayout>
        );
    }

    return (
        <StaffLayout title={view === 'tasks' && selectedStaff ? `${selectedStaff.full_name || selectedStaff.email}'s Tasks` : 'Staff Management'}>
            <Head><title>Staff Management | Admin Portal</title></Head>

            {message && (
                <div className={`alert ${message.startsWith('✓') ? 'success' : 'error'}`} style={{ marginBottom: '16px' }}>
                    {message}
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <div className="spinner" />
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="stats-grid" style={{ marginBottom: '28px' }}>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: 'var(--accent)' }}>{staffList.length}</div>
                            <div className="stat-label">Total Staff</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: '#c2410c' }}>{pendingTasks}</div>
                            <div className="stat-label">Pending Tasks</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: '#1d4ed8' }}>{inProgressTasks}</div>
                            <div className="stat-label">In Progress</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: '#15803d' }}>{completedTasks}</div>
                            <div className="stat-label">Completed</div>
                        </div>
                    </div>

                    {/* Staff List View */}
                    {view === 'staff' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 className="section-title" style={{ margin: 0 }}>All Staff Members</h3>
                                <button className="btn primary" onClick={() => setShowCreateStaff(true)}
                                    style={{ padding: '8px 16px' }}>
                                    + Add Staff
                                </button>
                            </div>

                            {staffList.length === 0 ? (
                                <div className="card empty-state">
                                    <h3>No staff members yet</h3>
                                    <p>Add staff members to get started.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {staffList.map(staff => {
                                        const staffTasks = tasks.filter(t => t.assigned_to === staff.user);
                                        const done = staffTasks.filter(t => t.status === 'completed').length;
                                        const total = staffTasks.length;
                                        const progress = total > 0 ? Math.round((done / total) * 100) : 0;

                                        return (
                                            <div key={staff.id} className="card"
                                                style={{ cursor: 'pointer', padding: '18px 20px' }}
                                                onClick={() => openStaff(staff)}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    {/* Avatar */}
                                                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, flexShrink: 0 }}>
                                                        {(staff.full_name?.[0] || staff.email?.[0] || 'S').toUpperCase()}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{staff.full_name || staff.email}</div>
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{staff.designation || 'Staff Member'} • {staff.email}</div>
                                                        {/* Progress bar */}
                                                        {total > 0 && (
                                                            <div style={{ marginTop: '8px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                                                    <span>{done}/{total} tasks completed</span>
                                                                    <span>{progress}%</span>
                                                                </div>
                                                                <div style={{ height: '4px', background: 'var(--border)', borderRadius: '4px' }}>
                                                                    <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#15803d' : 'var(--accent)', borderRadius: '4px', transition: 'width 0.3s' }} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                        {total} tasks →
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* All Tasks Section */}
                            <div style={{ marginTop: '32px' }}>
                                <h3 className="section-title">All Tasks</h3>
                                {tasks.length === 0 ? (
                                    <div className="card empty-state"><p>No tasks yet.</p></div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {tasks.map(task => {
                                            const s = STATUS_COLORS[task.status] || STATUS_COLORS.pending;
                                            return (
                                                <div key={task.id} className="card"
                                                    style={{ cursor: 'pointer', borderLeft: `4px solid ${s.color}`, padding: '14px 18px' }}
                                                    onClick={() => openTaskDetail(task)}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{task.title}</div>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                                Assigned to: {task.assigned_to_email} {task.due_date && `• Due: ${task.due_date}`}
                                                            </div>
                                                        </div>
                                                        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                                                            {s.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Staff Tasks View */}
                    {view === 'tasks' && selectedStaff && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <button onClick={backToStaff} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' }}>
                                    ← Back to Staff
                                </button>
                                <button className="btn primary" onClick={() => {
                                    setTaskForm({ title: '', description: '', assigned_to: selectedStaff.user, due_date: '', status: 'pending' });
                                    setMessage('');
                                }}
                                    style={{ padding: '8px 16px' }}>
                                    + Assign Task
                                </button>
                            </div>

                            {/* Assign Task Form */}
                            <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
                                <h4 style={{ marginBottom: '16px', fontSize: '14px' }}>Assign New Task</h4>
                                <div className="form-group">
                                    <label className="label">Title *</label>
                                    <input className="input" value={taskForm.title}
                                        onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))}
                                        placeholder="Task title" />
                                </div>
                                <div className="form-group">
                                    <label className="label">Description</label>
                                    <textarea className="input" rows={2} value={taskForm.description}
                                        onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Task description..."
                                        style={{ resize: 'vertical' }} />
                                </div>
                                <div className="form-group">
                                    <label className="label">Due Date</label>
                                    <input className="input" type="date" value={taskForm.due_date}
                                        onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))} />
                                </div>
                                <button className="btn primary" onClick={createTask} disabled={saving || !taskForm.title}
                                    style={{ padding: '10px 20px' }}>
                                    {saving ? 'Assigning...' : 'Assign Task'}
                                </button>
                            </div>

                            {/* Staff's Tasks */}
                            {tasks.length === 0 ? (
                                <div className="card empty-state">
                                    <h3>No tasks assigned</h3>
                                    <p>Assign a task above to get started.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {tasks.map(task => {
                                        const s = STATUS_COLORS[task.status] || STATUS_COLORS.pending;
                                        return (
                                            <div key={task.id} className="card"
                                                style={{ cursor: 'pointer', borderLeft: `4px solid ${s.color}`, padding: '14px 18px' }}
                                                onClick={() => openTaskDetail(task)}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{task.title}</div>
                                                        {task.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{task.description}</div>}
                                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                            {task.due_date && `Due: ${task.due_date}`}
                                                            {task.remarks && ` • Remarks: ${task.remarks}`}
                                                        </div>
                                                    </div>
                                                    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, marginLeft: '12px' }}>
                                                        {s.label}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Task Detail Modal */}
            {showTaskModal && selectedTask && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowTaskModal(false)}>
                    <div className="modal-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <h2 style={{ margin: 0, fontSize: '17px' }}>{selectedTask.title}</h2>
                            <button onClick={() => setShowTaskModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
                        </div>

                        {selectedTask.description && <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>{selectedTask.description}</p>}

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '13px', marginBottom: '16px' }}>
                            <span>👤 {selectedTask.assigned_to_email}</span>
                            {selectedTask.due_date && <span>📅 {selectedTask.due_date}</span>}
                            {selectedTask.completed_at && <span>✓ {new Date(selectedTask.completed_at).toLocaleDateString()}</span>}
                        </div>

                        {selectedTask.remarks && (
                            <div style={{ background: 'var(--bg)', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '14px' }}>
                                <strong style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>STAFF REMARKS</strong>
                                <p style={{ margin: '4px 0 0' }}>{selectedTask.remarks}</p>
                            </div>
                        )}

                        {/* Comments */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                            <h4 style={{ marginBottom: '12px', fontSize: '13px', fontWeight: 600 }}>Comments ({comments.length})</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                                {comments.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No comments yet.</p>
                                ) : comments.map(c => (
                                    <div key={c.id} style={{ background: 'var(--bg)', borderRadius: '10px', padding: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 600 }}>{c.author_name}</span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{new Date(c.created_at).toLocaleString()}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '13px' }}>{c.text}</p>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="input" value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    placeholder="Write a comment..."
                                    onKeyDown={e => e.key === 'Enter' && submitComment()}
                                    style={{ flex: 1 }} />
                                <button className="btn primary" onClick={submitComment} disabled={commenting || !commentText.trim()}
                                    style={{ padding: '8px 16px' }}>
                                    {commenting ? '...' : 'Send'}
                                </button>
                            </div>
                        </div>

                        <button onClick={() => deleteTask(selectedTask.id)}
                            style={{ marginTop: '16px', background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', width: '100%' }}>
                            Delete Task
                        </button>
                    </div>
                </div>
            )}

            {/* Create Staff Modal */}
            {showCreateStaff && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateStaff(false)}>
                    <div className="modal-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '17px' }}>Add New Staff</h2>
                            <button onClick={() => setShowCreateStaff(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div className="form-group">
                            <label className="label">Email *</label>
                            <input className="input" type="email" value={staffForm.email}
                                onChange={e => setStaffForm(p => ({ ...p, email: e.target.value }))}
                                placeholder="staff@example.com" />
                        </div>
                        <div className="form-group">
                            <label className="label">Password *</label>
                            <input className="input" type="password" value={staffForm.password}
                                onChange={e => setStaffForm(p => ({ ...p, password: e.target.value }))}
                                placeholder="Set a password" />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="label">First Name</label>
                                <input className="input" value={staffForm.first_name}
                                    onChange={e => setStaffForm(p => ({ ...p, first_name: e.target.value }))} />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="label">Last Name</label>
                                <input className="input" value={staffForm.last_name}
                                    onChange={e => setStaffForm(p => ({ ...p, last_name: e.target.value }))} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label">Phone</label>
                            <input className="input" value={staffForm.phone_number}
                                onChange={e => setStaffForm(p => ({ ...p, phone_number: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="label">Designation</label>
                            <input className="input" value={staffForm.designation}
                                onChange={e => setStaffForm(p => ({ ...p, designation: e.target.value }))}
                                placeholder="e.g. Content Manager" />
                        </div>
                        <button className="btn primary" onClick={createStaff} disabled={saving || !staffForm.email || !staffForm.password}
                            style={{ width: '100%', padding: '12px' }}>
                            {saving ? 'Creating...' : 'Create Staff Account'}
                        </button>
                    </div>
                </div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(StaffManagement);