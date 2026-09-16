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

    // Submit Completion Modal State
    const [submitModalTask, setSubmitModalTask] = useState(null);
    const [submissionReport, setSubmissionReport] = useState('');
    const [timeSpent, setTimeSpent] = useState('');
    const [submissionFile, setSubmissionFile] = useState(null);
    const [submissionImage, setSubmissionImage] = useState(null);
    const [submittingProof, setSubmittingProof] = useState(false);
    const [modalError, setModalError] = useState('');

    useEffect(() => { loadTasks(); }, []);

    const loadTasks = async () => {
        try {
            const data = await apiGet('/api/staff/tasks/');
            setTasks(Array.isArray(data) ? data : []);
        }
        catch { }
        finally { setLoading(false); }
    };

    const updateStatus = async (id, status) => {
        try {
            await apiPatch(`/api/staff/tasks/${id}/update/`, { status });
            loadTasks();
        } catch { }
    };

    const handleSubmitProof = async (e) => {
        e.preventDefault();
        if (!submitModalTask) return;
        if (!submissionReport.trim() && !submissionFile) {
            setModalError('Please provide a description of the work completed or upload a proof document.');
            return;
        }

        setSubmittingProof(true);
        setModalError('');

        const formData = new FormData();
        formData.append('submission_report', submissionReport);
        formData.append('time_spent_hours', timeSpent || 0);
        if (submissionFile) formData.append('submission_file', submissionFile);
        if (submissionImage) formData.append('submission_image', submissionImage);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/staff/tasks/${submitModalTask.id}/submit-completion/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                setSubmitModalTask(null);
                setSubmissionReport('');
                setTimeSpent('');
                setSubmissionFile(null);
                setSubmissionImage(null);
                loadTasks();
            } else {
                const errData = await res.json();
                setModalError(errData.error || 'Failed to submit deliverables.');
            }
        } catch {
            setModalError('Network error uploading proof deliverables.');
        } finally {
            setSubmittingProof(false);
        }
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

    const filtered = tasks.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'active') return ['assigned', 'in_progress', 'revision_required'].includes(t.status);
        if (filter === 'review') return t.status === 'submitted_for_review';
        if (filter === 'completed') return ['approved', 'completed'].includes(t.status);
        return t.status === filter;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'assigned':
                return <span className="status-badge badge-assigned">Assigned</span>;
            case 'in_progress':
                return <span className="status-badge badge-in-progress">In Progress</span>;
            case 'submitted_for_review':
                return <span className="status-badge badge-submitted">Under Review</span>;
            case 'revision_required':
                return <span className="status-badge badge-revision">Revision Required</span>;
            case 'approved':
                return <span className="status-badge badge-approved">Approved</span>;
            case 'completed':
                return <span className="status-badge badge-completed">Completed</span>;
            default:
                return <span className="status-badge">{status}</span>;
        }
    };

    const getPaymentBadge = (status, amount) => {
        const amtStr = amount > 0 ? ` (₹${amount})` : '';
        switch (status) {
            case 'not_assigned':
                return <span className="payment-badge not-assigned">Postpaid Evaluation Pending</span>;
            case 'awaiting_review':
                return <span className="payment-badge awaiting-review">Payment Under Review</span>;
            case 'amount_assigned':
                return <span className="payment-badge amount-assigned">Amount Assigned{amtStr}</span>;
            case 'approved':
                return <span className="payment-badge approved">Payment Approved{amtStr}</span>;
            case 'paid':
                return <span className="payment-badge paid">Paid{amtStr}</span>;
            default:
                return <span className="payment-badge not-assigned">{status}</span>;
        }
    };

    return (
        <StaffLayout title="My Tasks & Deliverables">
            <Head><title>My Tasks | Staff Portal</title></Head>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                        { id: 'all', label: `All (${tasks.length})` },
                        { id: 'active', label: `Active (${tasks.filter(t => ['assigned', 'in_progress', 'revision_required'].includes(t.status)).length})` },
                        { id: 'review', label: `Under Review (${tasks.filter(t => t.status === 'submitted_for_review').length})` },
                        { id: 'completed', label: `Completed (${tasks.filter(t => ['approved', 'completed'].includes(t.status)).length})` },
                    ].map(f => (
                        <button key={f.id} className={`btn ${filter === f.id ? 'primary' : ''}`}
                            onClick={() => setFilter(f.id)}
                            style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
                            {f.label}
                        </button>
                    ))}
                </div>
                <button className="btn" onClick={() => { setLoading(true); loadTasks().finally(() => setLoading(false)); }}
                    style={{ fontSize: '0.82rem', padding: '6px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ↻ Refresh
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
            ) : filtered.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {filtered.map(task => {
                        const isActionable = ['assigned', 'in_progress', 'revision_required'].includes(task.status);
                        const isUnderReview = task.status === 'submitted_for_review';
                        const isRevision = task.status === 'revision_required';

                        return (
                            <div key={task.id} className="card" style={{
                                borderLeft: isRevision ? '4px solid var(--red)' : isUnderReview ? '4px solid #6366f1' : task.status === 'completed' ? '4px solid var(--green)' : '4px solid var(--accent)',
                                padding: '20px',
                                transition: 'all 0.2s'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                        <div style={{ flex: 1, minWidth: '260px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{task.title}</h4>
                                                {getStatusBadge(task.status)}
                                            </div>
                                            {task.description && (
                                                <p style={{ margin: '0 0 10px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                    {task.description}
                                                </p>
                                            )}
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                {task.due_date && <span><strong>Due:</strong> {new Date(task.due_date).toLocaleDateString()}</span>}
                                                {task.assigned_by_name && <span><strong>Assigned by:</strong> {task.assigned_by_name}</span>}
                                                <span>{getPaymentBadge(task.payment_status, task.payment_amount)}</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            {task.status === 'assigned' && (
                                                <button
                                                    className="btn primary"
                                                    onClick={() => updateStatus(task.id, 'in_progress')}
                                                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                                                >
                                                    Start Working
                                                </button>
                                            )}

                                            {['in_progress', 'revision_required'].includes(task.status) && (
                                                <button
                                                    className="btn primary"
                                                    onClick={() => {
                                                        setSubmitModalTask(task);
                                                        setSubmissionReport('');
                                                        setTimeSpent('');
                                                        setSubmissionFile(null);
                                                        setSubmissionImage(null);
                                                        setModalError('');
                                                    }}
                                                    style={{ fontSize: '0.82rem', padding: '6px 16px', background: 'var(--accent-dark)' }}
                                                >
                                                    Submit Completion Proof
                                                </button>
                                            )}

                                            <button
                                                className="btn"
                                                onClick={() => toggleExpand(task.id)}
                                                style={{ fontSize: '0.78rem', padding: '6px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                                            >
                                                {expandedTask === task.id ? 'Hide Details' : 'Details & Proof'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Revision feedback alert */}
                                    {isRevision && task.reviewer_feedback && (
                                        <div style={{
                                            background: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            borderLeft: '4px solid #ef4444',
                                            padding: '12px 16px',
                                            borderRadius: '6px',
                                            marginTop: '12px',
                                            fontSize: '0.85rem',
                                            color: '#991b1b'
                                        }}>
                                            <strong style={{ display: 'block', marginBottom: '2px' }}>
                                                Revision Requested by Manager (Revision #{task.revision_count}):
                                            </strong>
                                            "{task.reviewer_feedback}"
                                        </div>
                                    )}

                                    {/* Under review alert */}
                                    {isUnderReview && (
                                        <div style={{
                                            background: '#f5f3ff',
                                            border: '1px solid #ddd6fe',
                                            padding: '10px 14px',
                                            borderRadius: '6px',
                                            marginTop: '12px',
                                            fontSize: '0.82rem',
                                            color: '#5b21b6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span>Deliverables submitted on {new Date(task.submitted_at || Date.now()).toLocaleDateString()}. Manager will review your work and evaluate postpaid compensation.</span>
                                        </div>
                                    )}
                                </div>

                                {/* Expanded: Submission Deliverables & Comments */}
                                {expandedTask === task.id && (
                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                        {/* Deliverables display */}
                                        {task.submission_report && (
                                            <div style={{ background: 'var(--bg)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                                                <h5 style={{ margin: '0 0 6px', fontSize: '0.85rem', fontWeight: 700 }}>Submitted Deliverables Report:</h5>
                                                <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#1e293b', whiteSpace: 'pre-wrap' }}>
                                                    {task.submission_report}
                                                </p>
                                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {task.time_spent_hours > 0 && <span><strong>Time Spent:</strong> {task.time_spent_hours} hrs</span>}
                                                    {task.submission_file && (
                                                        <a href={task.submission_file} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', fontWeight: 600 }}>
                                                            📄 View Attached Proof Document
                                                        </a>
                                                    )}
                                                    {task.submission_image && (
                                                        <a href={task.submission_image} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple)', fontWeight: 600 }}>
                                                            🖼 View Attached Screenshot
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Comments section */}
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px' }}>Task Comments</div>
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
                        );
                    })}
                </div>
            ) : (
                <div className="card empty-state"><h3>No tasks</h3><p>No tasks found for this filter.</p></div>
            )}

            {/* SUBMIT COMPLETION PROOF MODAL */}
            {submitModalTask && (
                <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ maxWidth: '520px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                                Submit Deliverables for Review
                            </h3>
                            <button onClick={() => setSubmitModalTask(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                            Task: <strong>{submitModalTask.title}</strong>
                        </p>

                        {modalError && (
                            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '14px' }}>
                                {modalError}
                            </div>
                        )}

                        <form onSubmit={handleSubmitProof}>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                                    Deliverables Summary & Description *
                                </label>
                                <textarea
                                    className="input"
                                    rows={4}
                                    placeholder="Describe what you did, milestones completed, links to resources or code..."
                                    value={submissionReport}
                                    onChange={e => setSubmissionReport(e.target.value)}
                                    style={{ width: '100%', resize: 'vertical' }}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                                    Time Spent (Hours)
                                </label>
                                <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    placeholder="e.g. 3.5"
                                    className="input"
                                    value={timeSpent}
                                    onChange={e => setTimeSpent(e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                                    Proof Document / PDF Deliverable
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.zip"
                                    onChange={e => setSubmissionFile(e.target.files[0] || null)}
                                    style={{ fontSize: '0.85rem' }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                                    Screenshot / Image Proof
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setSubmissionImage(e.target.files[0] || null)}
                                    style={{ fontSize: '0.85rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="btn" onClick={() => setSubmitModalTask(null)}>Cancel</button>
                                <button
                                    type="submit"
                                    className="btn primary"
                                    disabled={submittingProof}
                                >
                                    {submittingProof ? 'Uploading Proof...' : 'Submit to Manager'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(Tasks);
