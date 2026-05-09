import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../lib/auth';
import { apiGet, apiPatch, apiPost } from '../lib/api';
import StaffLayout from '../components/StaffLayout';

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expandedTask, setExpandedTask] = useState(null);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState({});

    useEffect(() => { loadTasks(); }, []);

    const loadTasks = async () => {
        try { setTasks(await apiGet('/api/staff/tasks/')); }
        catch { }
        finally { setLoading(false); }
    };

    const updateStatus = async (id, status) => {
        try {
            await apiPatch(`/api/staff/tasks/${id}/update/`, { status });
            loadTasks();
        } catch { }
    };

    const revertTask = async (task) => {
        if (task.is_paid) return alert('Cannot revert a paid task.');
        if (!confirm('Revert this task to In Progress?')) return;
        try {
            await apiPatch(`/api/staff/tasks/${task.id}/update/`, { status: 'in_progress' });
            loadTasks();
        } catch { }
    };

    const loadComments = async (taskId) => {
        try {
            const data = await apiGet(`/api/staff/tasks/${taskId}/comments/`);
            setComments(prev => ({ ...prev, [taskId]: data }));
        } catch { }
    };

    const addComment = async (taskId) => {
        if (!comment.trim()) return;
        try {
            await apiPost(`/api/staff/tasks/${taskId}/comments/`, { text: comment });
            setComment('');
            loadComments(taskId);
        } catch { }
    };

    const toggleExpand = (taskId) => {
        if (expandedTask === taskId) {
            setExpandedTask(null);
        } else {
            setExpandedTask(taskId);
            if (!comments[taskId]) loadComments(taskId);
        }
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
        <StaffLayout title="My Tasks">
            <Head><title>My Tasks | Staff Portal</title></Head>

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
                <button className="btn" onClick={() => { setLoading(true); loadTasks().finally(() => setLoading(false)); }}
                    style={{ fontSize: '0.82rem', padding: '6px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 2.6-6.4L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 1 0-2.6 6.4L3 16"/></svg>
                    Refresh Status
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
            ) : filtered.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filtered.map(task => (
                        <div key={task.id} className="card" style={{
                            borderLeft: `4px solid ${statusColor(task.status)}`,
                            cursor: 'pointer',
                        }}>
                            <div onClick={() => toggleExpand(task.id)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 4px' }}>{task.title}</h4>
                                        {task.description && (
                                            <p style={{ margin: '0 0 8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{task.description}</p>
                                        )}
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                            {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                                            {task.payment_amount > 0 && <span>₹{task.payment_amount}</span>}
                                            <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <span className="badge" style={{ background: statusBg(task.status), color: statusColor(task.status) }}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {task.status !== 'completed' && task.status === 'pending' && (
                                    <button className="btn primary" onClick={(e) => { e.stopPropagation(); updateStatus(task.id, 'in_progress'); }}
                                        style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
                                        Start Working
                                    </button>
                                )}
                                {task.status !== 'completed' && task.status === 'in_progress' && (
                                    <button className="btn" onClick={(e) => { e.stopPropagation(); updateStatus(task.id, 'completed'); }}
                                        style={{ fontSize: '0.82rem', padding: '6px 14px', background: 'var(--green)', color: '#fff' }}>
                                        Mark Complete
                                    </button>
                                )}
                                {task.status === 'completed' && !task.is_paid && (
                                    <button className="btn" onClick={(e) => { e.stopPropagation(); revertTask(task); }}
                                        style={{ fontSize: '0.78rem', padding: '6px 14px', background: 'var(--yellow-bg)', color: '#b8860b', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
                                        Revert to In Progress
                                    </button>
                                )}
                            </div>

                            {/* Expanded: Comments */}
                            {expandedTask === task.id && (
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px' }}>Comments</div>
                                    {(comments[task.id] || []).map(c => (
                                        <div key={c.id} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-secondary)', marginBottom: '6px', fontSize: '0.85rem' }}>
                                            <strong>{c.author_name}</strong>
                                            <span style={{ color: 'var(--text-secondary)', marginLeft: '8px', fontSize: '0.78rem' }}>
                                                {new Date(c.created_at).toLocaleString()}
                                            </span>
                                            <div style={{ marginTop: '4px' }}>{c.text}</div>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                        <input type="text" value={comment} onChange={e => setComment(e.target.value)}
                                            placeholder="Add a comment..." className="input"
                                            style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                                            onKeyDown={e => { if (e.key === 'Enter') addComment(task.id); }}
                                        />
                                        <button className="btn primary" onClick={() => addComment(task.id)}
                                            style={{ fontSize: '0.82rem', padding: '6px 14px' }}>Send</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card empty-state"><h3>No tasks</h3><p>No tasks found for this filter.</p></div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(Tasks);
