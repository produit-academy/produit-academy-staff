import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../../lib/auth';
import { apiGet, apiPost, apiDelete } from '../../lib/api';
import StaffLayout from '../../components/StaffLayout';
import { useRouter } from 'next/router';

const STATUS_COLORS = {
    pending: { bg: '#fff7ed', color: '#c2410c', label: 'Pending' },
    in_progress: { bg: '#eff6ff', color: '#1d4ed8', label: 'In Progress' },
    completed: { bg: '#f0fdf4', color: '#15803d', label: 'Completed' },
};

function HRTasks() {
    const router = useRouter();
    const { staff_id } = router.query;
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [commenting, setCommenting] = useState(false);
    const [paying, setPaying] = useState(false);
    const [message, setMessage] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (!router.isReady) return;
        loadTasks();
    }, [router.isReady, staff_id]);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const url = staff_id ? `/manager/tasks/?staff_id=${staff_id}` : '/manager/tasks/';
            const data = await apiGet(url);
            setTasks(data);
        } catch { }
        finally { setLoading(false); }
    };

    const openTask = async (task) => {
        setSelectedTask(task);
        setCommentText('');
        setMessage('');
        try {
            const data = await apiGet(`/manager/tasks/${task.id}/comments/`);
            setComments(data);
        } catch { setComments(task.comments || []); }
    };

    const submitComment = async () => {
        if (!commentText.trim()) return;
        setCommenting(true);
        try {
            const res = await apiPost(`/manager/tasks/${selectedTask.id}/comments/`, { text: commentText });
            if (res.ok) {
                const c = await res.json();
                setComments(prev => [...prev, c]);
                setCommentText('');
            }
        } catch { }
        finally { setCommenting(false); }
    };

    const markPaid = async () => {
        setPaying(true);
        setMessage('');
        try {
            const res = await apiPost(`/manager/tasks/${selectedTask.id}/pay/`, {});
            const data = await res.json();
            if (res.ok) {
                setMessage(`success:${data.message}`);
                loadTasks();
            } else {
                setMessage(`error:${data.error}`);
            }
        } catch { setMessage('error:Something went wrong.'); }
        finally { setPaying(false); }
    };

    const deleteTask = async (taskId) => {
        if (!confirm('Delete this task?')) return;
        try {
            const res = await apiDelete(`/manager/tasks/${taskId}/`);
            if (res.ok) {
                setTasks(prev => prev.filter(t => t.id !== taskId));
                setSelectedTask(null);
            }
        } catch { }
    };

    const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
    const msgType = message.startsWith('success:') ? 'success' : 'error';
    const msgText = message.replace(/^(success|error):/, '');

    return (
        <StaffLayout title={staff_id ? 'Staff Tasks' : 'All Tasks'}>
            <Head><title>Tasks | HR Portal</title></Head>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                {staff_id && (
                    <button onClick={() => router.push('/hr/staff')} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' }}>
                        ← Back to Staff
                    </button>
                )}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['all', 'pending', 'in_progress', 'completed'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', background: filter === f ? 'var(--accent)' : 'none', color: filter === f ? 'white' : 'inherit', fontWeight: filter === f ? 600 : 400 }}>
                            {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                            {' '}({(f === 'all' ? tasks : tasks.filter(t => t.status === f)).length})
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
                <div className="card empty-state"><h3>No tasks found</h3></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filtered.map(task => {
                        const s = STATUS_COLORS[task.status] || STATUS_COLORS.pending;
                        const isPaid = task.payment_amount > 0;
                        return (
                            <div key={task.id} className="card"
                                style={{ cursor: 'pointer', borderLeft: `4px solid ${s.color}`, padding: '16px 20px' }}
                                onClick={() => openTask(task)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{task.title}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            <span>👤 {task.assigned_to_email}</span>
                                            {task.due_date && <span>📅 {task.due_date}</span>}
                                            {isPaid && <span>💰 ₹{task.payment_amount}</span>}
                                            {task.remarks && <span>📝 Has remarks</span>}
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
                            <h2 style={{ margin: 0, fontSize: '17px' }}>{selectedTask.title}</h2>
                            <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>

                        {selectedTask.description && <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>{selectedTask.description}</p>}

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '13px', marginBottom: '16px' }}>
                            <span>👤 {selectedTask.assigned_to_email}</span>
                            {selectedTask.due_date && <span>📅 {selectedTask.due_date}</span>}
                            {selectedTask.payment_amount > 0 && <span style={{ color: '#15803d', fontWeight: 600 }}>💰 ₹{selectedTask.payment_amount}</span>}
                            {selectedTask.completed_at && <span>✓ {new Date(selectedTask.completed_at).toLocaleDateString()}</span>}
                        </div>

                        {selectedTask.remarks && (
                            <div style={{ background: 'var(--bg)', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>STAFF REMARKS</div>
                                <p style={{ margin: 0, fontSize: '14px' }}>{selectedTask.remarks}</p>
                            </div>
                        )}

                        {msgText && <div className={`alert ${msgType}`} style={{ marginBottom: '12px' }}>{msgText}</div>}

                        {/* Pay Button */}
                        {selectedTask.status === 'completed' && selectedTask.payment_amount > 0 && (
                            <button className="btn primary" onClick={markPaid} disabled={paying} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#15803d' }}>
                                {paying ? 'Processing...' : `💰 Mark as Paid (₹${selectedTask.payment_amount})`}
                            </button>
                        )}

                        {/* Comments */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                            <h4 style={{ marginBottom: '12px', fontSize: '13px', fontWeight: 600 }}>Comments ({comments.length})</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', maxHeight: '180px', overflowY: 'auto' }}>
                                {comments.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No comments yet.</p>
                                    : comments.map(c => (
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
                                <input className="input" value={commentText} onChange={e => setCommentText(e.target.value)}
                                    placeholder="Write a comment..." onKeyDown={e => e.key === 'Enter' && submitComment()} style={{ flex: 1 }} />
                                <button className="btn primary" onClick={submitComment} disabled={commenting || !commentText.trim()} style={{ padding: '8px 16px' }}>
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
        </StaffLayout>
    );
}

export default withStaffAuth(HRTasks);