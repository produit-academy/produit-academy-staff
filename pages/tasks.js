import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../lib/auth';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import StaffLayout from '../components/StaffLayout';

const STATUS_COLORS = {
    pending: { bg: '#fff7ed', color: '#c2410c', label: 'Pending' },
    in_progress: { bg: '#eff6ff', color: '#1d4ed8', label: 'In Progress' },
    completed: { bg: '#f0fdf4', color: '#15803d', label: 'Completed' },
};

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [status, setStatus] = useState('');
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState([]);
    const [saving, setSaving] = useState(false);
    const [commenting, setCommenting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => { loadTasks(); }, []);

    const loadTasks = async () => {
        try {
            const data = await apiGet('/staff/tasks/');
            setTasks(data);
        } catch { }
        finally { setLoading(false); }
    };

    const openTask = async (task) => {
        setSelectedTask(task);
        setRemarks(task.remarks || '');
        setStatus(task.status);
        setMessage('');
        setCommentText('');
        try {
            const data = await apiGet(`/staff/tasks/${task.id}/comments/`);
            setComments(data);
        } catch { setComments(task.comments || []); }
    };

    const saveTask = async () => {
        setSaving(true);
        setMessage('');
        try {
            const res = await apiPatch(`/staff/tasks/${selectedTask.id}/update/`, { status, remarks });
            if (res.ok) {
                const updated = await res.json();
                setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
                setSelectedTask(updated);
                setMessage('success:Saved successfully!');
            } else {
                setMessage('error:Failed to save.');
            }
        } catch { setMessage('error:Something went wrong.'); }
        finally { setSaving(false); }
    };

    const submitComment = async () => {
        if (!commentText.trim()) return;
        setCommenting(true);
        try {
            const res = await apiPost(`/staff/tasks/${selectedTask.id}/comments/`, { text: commentText });
            if (res.ok) {
                const c = await res.json();
                setComments(prev => [...prev, c]);
                setCommentText('');
            }
        } catch { }
        finally { setCommenting(false); }
    };

    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;

    const msgType = message.startsWith('success:') ? 'success' : 'error';
    const msgText = message.replace(/^(success|error):/, '');

    return (
        <StaffLayout title="My Tasks">
            <Head><title>My Tasks | Staff Portal</title></Head>

            <div className="stats-grid" style={{ marginBottom: '28px' }}>
                <div className="card stat-card">
                    <div className="stat-value" style={{ color: '#c2410c' }}>{pending}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-value" style={{ color: '#1d4ed8' }}>{inProgress}</div>
                    <div className="stat-label">In Progress</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-value" style={{ color: '#15803d' }}>{completed}</div>
                    <div className="stat-label">Completed</div>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
            ) : tasks.length === 0 ? (
                <div className="card empty-state">
                    <h3>No tasks assigned yet</h3>
                    <p>Your manager hasn't assigned any tasks yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {tasks.map(task => {
                        const s = STATUS_COLORS[task.status] || STATUS_COLORS.pending;
                        return (
                            <div key={task.id} className="card"
                                style={{ cursor: 'pointer', borderLeft: `4px solid ${s.color}`, padding: '18px 20px' }}
                                onClick={() => openTask(task)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{task.title}</div>
                                        {task.description && <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>{task.description}</div>}
                                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                                            {task.due_date && <span>📅 Due: {task.due_date}</span>}
                                            {task.payment_amount > 0 && <span>💰 ₹{task.payment_amount}</span>}
                                            {task.completed_at && <span>✓ Done: {new Date(task.completed_at).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                    <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedTask && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedTask(null)}>
                    <div className="modal-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <h2 style={{ margin: 0, fontSize: '18px' }}>{selectedTask.title}</h2>
                            <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
                        </div>

                        {selectedTask.description && <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>{selectedTask.description}</p>}

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '13px', marginBottom: '20px' }}>
                            {selectedTask.due_date && <span>📅 Due: {selectedTask.due_date}</span>}
                            {selectedTask.payment_amount > 0 && <span style={{ color: '#15803d', fontWeight: 600 }}>💰 Payment: ₹{selectedTask.payment_amount}</span>}
                        </div>

                        <div className="form-group">
                            <label className="label">Update Status</label>
                            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="label">Your Remarks</label>
                            <textarea className="input" rows={3} value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                                placeholder="Add your remarks about this task..."
                                style={{ resize: 'vertical' }} />
                        </div>

                        {msgText && <div className={`alert ${msgType}`} style={{ marginBottom: '16px' }}>{msgText}</div>}

                        <button className="btn primary" onClick={saveTask} disabled={saving} style={{ width: '100%', padding: '12px', marginBottom: '24px' }}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                            <h4 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>Comments ({comments.length})</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', maxHeight: '220px', overflowY: 'auto' }}>
                                {comments.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No comments yet.</p>
                                    : comments.map(c => (
                                        <div key={c.id} style={{ background: 'var(--bg)', borderRadius: '10px', padding: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 600 }}>{c.author_name}</span>
                                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{new Date(c.created_at).toLocaleString()}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '13px' }}>{c.text}</p>
                                        </div>
                                    ))}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input className="input" value={commentText} onChange={e => setCommentText(e.target.value)}
                                    placeholder="Write a comment..." onKeyDown={e => e.key === 'Enter' && submitComment()} style={{ flex: 1 }} />
                                <button className="btn primary" onClick={submitComment} disabled={commenting || !commentText.trim()} style={{ padding: '8px 16px' }}>
                                    {commenting ? '...' : 'Send'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(Tasks);