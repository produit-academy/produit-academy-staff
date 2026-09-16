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
    const [form, setForm] = useState({ title: '', description: '', assigned_to: '', due_date: '' });

    // Review Modal State
    const [reviewTask, setReviewTask] = useState(null);
    const [reviewFeedback, setReviewFeedback] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);

    // Payment Evaluation Modal State
    const [paymentTask, setPaymentTask] = useState(null);
    const [evalAmount, setEvalAmount] = useState('');
    const [evalNotes, setEvalNotes] = useState('');
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Edit Task Modal State
    const [editTask, setEditTask] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', assigned_to: '', due_date: '', status: '', remarks: '' });
    const [editLoading, setEditLoading] = useState(false);

    useEffect(() => {
        Promise.all([loadTasks(), loadStaff()]).finally(() => setLoading(false));
    }, []);

    const loadTasks = async () => {
        try {
            const data = await apiGet('/api/staff/manager/tasks/');
            setTasks(Array.isArray(data) ? data : []);
        } catch { }
    };

    const loadStaff = async () => {
        try {
            const data = await apiGet('/api/staff/manager/staff/');
            setStaff(Array.isArray(data) ? data : []);
        } catch { }
    };

    const createTask = async () => {
        if (!form.title || !form.assigned_to) return alert('Title and assignee are required.');
        try {
            const data = {
                title: form.title,
                description: form.description,
                assigned_to: parseInt(form.assigned_to),
                due_date: form.due_date || null,
            };
            await apiPost('/api/staff/manager/tasks/create/', data);
            setForm({ title: '', description: '', assigned_to: '', due_date: '' });
            setShowForm(false);
            loadTasks();
        } catch (err) {
            alert('Failed to create task.');
        }
    };

    const openEditTask = (task) => {
        setEditTask(task);
        setEditForm({
            title: task.title || '',
            description: task.description || '',
            assigned_to: task.assigned_to ? String(task.assigned_to) : '',
            due_date: task.due_date ? task.due_date.slice(0, 10) : '',
            status: task.status || 'assigned',
            remarks: task.remarks || '',
        });
    };

    const handleSaveTaskEdit = async (e) => {
        e.preventDefault();
        if (!editTask) return;
        if (!editForm.title.trim()) return alert('Task title is required.');
        if (!editForm.assigned_to) return alert('Assignee is required.');

        setEditLoading(true);
        try {
            const payload = {
                title: editForm.title.trim(),
                description: editForm.description.trim(),
                assigned_to: parseInt(editForm.assigned_to),
                due_date: editForm.due_date || null,
                status: editForm.status,
                remarks: editForm.remarks.trim(),
            };
            const res = await apiPatch(`/api/staff/manager/tasks/${editTask.id}/`, payload);
            const d = await res.json();
            if (res.ok) {
                setEditTask(null);
                loadTasks();
            } else {
                alert(d.error || 'Failed to update task.');
            }
        } catch {
            alert('Network error updating task.');
        } finally {
            setEditLoading(false);
        }
    };

    const handleReviewAction = async (action) => {
        if (!reviewTask) return;
        if (action === 'request_revision' && !reviewFeedback.trim()) {
            alert('Please provide feedback explaining the requested changes.');
            return;
        }

        setReviewLoading(true);
        try {
            const res = await apiPost(`/api/staff/manager/tasks/${reviewTask.id}/review/`, {
                action,
                feedback: reviewFeedback.trim()
            });
            const d = await res.json();
            if (res.ok) {
                setReviewTask(null);
                setReviewFeedback('');
                loadTasks();
            } else {
                alert(d.error || 'Failed to submit review.');
            }
        } catch {
            alert('Network error during review.');
        } finally {
            setReviewLoading(false);
        }
    };

    const handleAssignPayment = async () => {
        if (!paymentTask) return;
        if (!evalAmount || parseFloat(evalAmount) <= 0) {
            alert('Please enter a valid compensation amount.');
            return;
        }

        setPaymentLoading(true);
        try {
            const res = await apiPost(`/api/staff/manager/tasks/${paymentTask.id}/payment/`, {
                action: 'assign_amount',
                amount: evalAmount,
                notes: evalNotes
            });
            const d = await res.json();
            if (res.ok) {
                setPaymentTask(null);
                setEvalAmount('');
                setEvalNotes('');
                loadTasks();
            } else {
                alert(d.error || 'Failed to assign payment.');
            }
        } catch {
            alert('Network error assigning payment.');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleApprovePayment = async (taskId) => {
        setPaymentLoading(true);
        try {
            const res = await apiPost(`/api/staff/manager/tasks/${taskId}/payment/`, {
                action: 'approve_payment',
                notes: 'Payment approved by manager'
            });
            const d = await res.json();
            if (res.ok) {
                loadTasks();
            } else {
                alert(d.error || 'Failed to approve payment.');
            }
        } catch {
            alert('Network error approving payment.');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleCreditWallet = async (task) => {
        if (!confirm(`Credit ₹${task.payment_amount} to ${task.assigned_to_name}'s wallet?`)) return;
        try {
            const res = await apiPost(`/api/staff/manager/tasks/${task.id}/pay/`, {
                amount: task.payment_amount
            });
            const d = await res.json();
            if (res.ok) {
                alert(d.message || 'Wallet credited successfully!');
                loadTasks();
            } else {
                alert(d.error || 'Failed to credit wallet.');
            }
        } catch {
            alert('Network error processing wallet payout.');
        }
    };

    const deleteTask = async (id) => {
        if (!confirm('Delete this task?')) return;
        try {
            await apiDelete(`/api/staff/manager/tasks/${id}/`);
            loadTasks();
        } catch { }
    };

    const filtered = tasks.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'review') return t.status === 'submitted_for_review';
        if (filter === 'active') return ['assigned', 'in_progress', 'revision_required'].includes(t.status);
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
                return <span className="status-badge badge-submitted">In Review</span>;
            case 'revision_required':
                return <span className="status-badge badge-revision">Revision Req</span>;
            case 'approved':
                return <span className="status-badge badge-approved">Approved</span>;
            case 'completed':
                return <span className="status-badge badge-completed">Completed</span>;
            default:
                return <span className="status-badge">{status}</span>;
        }
    };

    const getPaymentBadge = (status, amount) => {
        const amtStr = amount > 0 ? ` ₹${amount}` : '';
        switch (status) {
            case 'not_assigned':
                return <span className="payment-badge not-assigned">Postpaid Unassigned</span>;
            case 'awaiting_review':
                return <span className="payment-badge awaiting-review">Awaiting Review</span>;
            case 'amount_assigned':
                return <span className="payment-badge amount-assigned">Assigned:{amtStr}</span>;
            case 'approved':
                return <span className="payment-badge approved">Approved:{amtStr}</span>;
            case 'paid':
                return <span className="payment-badge paid">Paid:{amtStr}</span>;
            default:
                return <span className="payment-badge not-assigned">{status}</span>;
        }
    };

    return (
        <StaffLayout title="HR & Operations // Task Management">
            <Head><title>Task Management | Staff Portal</title></Head>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                        { id: 'all', label: `All Tasks (${tasks.length})` },
                        { id: 'review', label: `Deliverables In Review (${tasks.filter(t => t.status === 'submitted_for_review').length})` },
                        { id: 'active', label: `Active (${tasks.filter(t => ['assigned', 'in_progress', 'revision_required'].includes(t.status)).length})` },
                        { id: 'completed', label: `Approved / Done (${tasks.filter(t => ['approved', 'completed'].includes(t.status)).length})` },
                    ].map(f => (
                        <button
                            key={f.id}
                            className={`btn ${filter === f.id ? 'primary' : ''}`}
                            onClick={() => setFilter(f.id)}
                            style={{ fontSize: '0.82rem', padding: '7px 16px', borderRadius: '8px' }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="btn"
                        onClick={() => { setLoading(true); loadTasks().finally(() => setLoading(false)); }}
                        style={{ fontSize: '0.82rem', padding: '7px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                    >
                        ↻ Refresh
                    </button>
                    <button
                        className="btn primary"
                        onClick={() => setShowForm(!showForm)}
                        style={{ fontSize: '0.85rem', padding: '8px 18px', borderRadius: '8px' }}
                    >
                        {showForm ? 'Close Form' : '+ Create Task (Postpaid)'}
                    </button>
                </div>
            </div>

            {/* Create Task Form (Postpaid Model) */}
            {showForm && (
                <div className="card" style={{ marginBottom: '24px', borderTop: '4px solid var(--accent)', padding: '24px' }}>
                    <div style={{ marginBottom: '14px' }}>
                        <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 800 }}>Create New Staff Task</h3>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            Tasks utilize a postpaid model: compensation is determined and assigned after deliverables are reviewed based on complexity, time spent, and output quality.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gap: '14px' }}>
                        <input
                            type="text"
                            className="input"
                            placeholder="Task title *"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            style={{ padding: '10px 14px' }}
                        />
                        <textarea
                            className="input"
                            placeholder="Detailed requirements and deliverables expected..."
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={3}
                            style={{ padding: '10px 14px', resize: 'vertical' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                            <select
                                className="input"
                                value={form.assigned_to}
                                onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                                style={{ padding: '10px 14px' }}
                            >
                                <option value="">Assign to Staff Member *</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
                                ))}
                            </select>
                            <input
                                type="date"
                                className="input"
                                value={form.due_date}
                                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                                style={{ padding: '10px 14px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn" onClick={() => setShowForm(false)}>Cancel</button>
                            <button
                                className="btn primary"
                                onClick={createTask}
                                style={{ padding: '10px 24px' }}
                            >
                                Assign Task & Email Notification
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
            ) : filtered.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {filtered.map(task => {
                        const hasSubmission = task.submission_report || task.submission_file;
                        const isUnderReview = task.status === 'submitted_for_review';
                        const canAssignPayment = ['submitted_for_review', 'approved', 'completed'].includes(task.status) && task.payment_status !== 'paid';

                        return (
                            <div key={task.id} className="card" style={{
                                borderLeft: isUnderReview ? '4px solid #6366f1' : task.status === 'completed' ? '4px solid var(--green)' : '4px solid var(--accent)',
                                padding: '20px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                    <div style={{ flex: 1, minWidth: '280px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{task.title}</h4>
                                            {getStatusBadge(task.status)}
                                            {getPaymentBadge(task.payment_status, task.payment_amount)}
                                        </div>

                                        {task.description && (
                                            <p style={{ margin: '0 0 10px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                {task.description}
                                            </p>
                                        )}

                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <span><strong>Assignee:</strong> {task.assigned_to_name} ({task.assigned_to_email})</span>
                                            {task.due_date && <span><strong>Due:</strong> {new Date(task.due_date).toLocaleDateString()}</span>}
                                            {task.time_spent_hours > 0 && <span><strong>Time Reported:</strong> {task.time_spent_hours} hrs</span>}
                                        </div>
                                    </div>

                                    {/* Action Buttons for Manager */}
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        {/* Deliverables Review Button */}
                                        {hasSubmission && (
                                            <button
                                                className="btn primary"
                                                onClick={() => {
                                                    setReviewTask(task);
                                                    setReviewFeedback(task.reviewer_feedback || '');
                                                }}
                                                style={{ fontSize: '0.82rem', padding: '6px 14px', background: isUnderReview ? '#4338ca' : 'var(--accent)' }}
                                            >
                                                {isUnderReview ? 'Review Deliverables' : 'View Deliverables'}
                                            </button>
                                        )}

                                        {/* Postpaid Payment Actions */}
                                        {canAssignPayment && (
                                            <button
                                                className="btn"
                                                onClick={() => {
                                                    setPaymentTask(task);
                                                    setEvalAmount(task.payment_amount > 0 ? task.payment_amount : '');
                                                    setEvalNotes(task.payment_notes || '');
                                                }}
                                                style={{ fontSize: '0.82rem', padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                                            >
                                                {task.payment_amount > 0 ? `Adjust Amount (₹${task.payment_amount})` : 'Assign Amount ₹'}
                                            </button>
                                        )}

                                        {task.payment_status === 'amount_assigned' && (
                                            <button
                                                className="btn"
                                                onClick={() => handleApprovePayment(task.id)}
                                                style={{ fontSize: '0.82rem', padding: '6px 12px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                                            >
                                                Approve ₹{task.payment_amount}
                                            </button>
                                        )}

                                        {task.payment_status === 'approved' && (
                                            <button
                                                className="btn"
                                                onClick={() => handleCreditWallet(task)}
                                                style={{ fontSize: '0.82rem', padding: '6px 14px', background: '#15803d', color: '#ffffff', fontWeight: 700 }}
                                            >
                                                Pay ₹{task.payment_amount}
                                            </button>
                                        )}

                                        <button
                                            className="btn"
                                            onClick={() => openEditTask(task)}
                                            style={{ fontSize: '0.82rem', padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                                        >
                                            ✏️ Edit
                                        </button>

                                        <button
                                            className="btn"
                                            onClick={() => deleteTask(task.id)}
                                            style={{ fontSize: '0.78rem', padding: '6px 10px', color: 'var(--red)', border: '1px solid #fecaca' }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Deliverables summary in card if exists */}
                                {hasSubmission && (
                                    <div style={{ marginTop: '12px', padding: '12px 14px', background: 'var(--bg)', borderRadius: '8px', fontSize: '0.82rem' }}>
                                        <div style={{ fontWeight: 700, marginBottom: '4px', color: '#0f172a' }}>
                                            Staff Deliverables Proof:
                                        </div>
                                        <p style={{ margin: '0 0 6px', color: '#334155' }}>{task.submission_report}</p>
                                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                            {task.submission_file && (
                                                <a href={task.submission_file} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', fontWeight: 600 }}>
                                                    📄 Document Attachment
                                                </a>
                                            )}
                                            {task.submission_image && (
                                                <a href={task.submission_image} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple)', fontWeight: 600 }}>
                                                    🖼 Screenshot Attachment
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card empty-state"><h3>No tasks</h3><p>No tasks match your filter.</p></div>
            )}

            {/* DELIVERABLES REVIEW MODAL */}
            {reviewTask && (
                <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ maxWidth: '560px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                                Review Deliverables: {reviewTask.title}
                            </h3>
                            <button onClick={() => setReviewTask(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                        </div>

                        <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', marginBottom: '18px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Submitted by <strong>{reviewTask.assigned_to_name}</strong> on {new Date(reviewTask.submitted_at || Date.now()).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
                                {reviewTask.submission_report || 'No text report provided.'}
                            </div>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                                <span><strong>Time Spent:</strong> {reviewTask.time_spent_hours || 0} hrs</span>
                                {reviewTask.submission_file && (
                                    <a href={reviewTask.submission_file} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', fontWeight: 700 }}>
                                        📄 Open Proof File
                                    </a>
                                )}
                                {reviewTask.submission_image && (
                                    <a href={reviewTask.submission_image} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--purple)', fontWeight: 700 }}>
                                        🖼 View Screenshot
                                    </a>
                                )}
                            </div>
                        </div>

                        <div style={{ marginBottom: '18px' }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                                Reviewer Feedback / Instructions (Required if requesting revision)
                            </label>
                            <textarea
                                className="input"
                                rows={3}
                                placeholder="e.g. Excellent deliverable, ready for payment... or: please fix section 2 and re-upload..."
                                value={reviewFeedback}
                                onChange={e => setReviewFeedback(e.target.value)}
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => handleReviewAction('request_revision')}
                                disabled={reviewLoading}
                                style={{ color: '#dc2626', border: '1px solid #fecaca' }}
                            >
                                Request Revision
                            </button>
                            <button
                                type="button"
                                className="btn primary"
                                onClick={() => handleReviewAction('approve')}
                                disabled={reviewLoading}
                                style={{ background: '#059669' }}
                            >
                                {reviewLoading ? 'Processing...' : 'Approve Deliverables'}
                            </button>
                            <button
                                type="button"
                                className="btn primary"
                                onClick={() => handleReviewAction('complete')}
                                disabled={reviewLoading}
                            >
                                Mark Completed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* POSTPAID PAYMENT EVALUATION MODAL */}
            {paymentTask && (
                <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ maxWidth: '480px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                                Postpaid Compensation Evaluation
                            </h3>
                            <button onClick={() => setPaymentTask(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Evaluate compensation for <strong>{paymentTask.title}</strong> completed by <strong>{paymentTask.assigned_to_name}</strong> (Reported Time: {paymentTask.time_spent_hours || 0} hrs).
                        </p>

                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                                Compensation Amount (₹) *
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="10"
                                className="input"
                                placeholder="e.g. 1500"
                                value={evalAmount}
                                onChange={e => setEvalAmount(e.target.value)}
                                style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700 }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                                Evaluation Justification Notes:
                            </label>
                            <textarea
                                className="input"
                                rows={3}
                                placeholder="e.g. Based on 4 hours of high complexity deliverables, approved standard rate..."
                                value={evalNotes}
                                onChange={e => setEvalNotes(e.target.value)}
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn" onClick={() => setPaymentTask(null)}>Cancel</button>
                            <button
                                className="btn primary"
                                onClick={handleAssignPayment}
                                disabled={paymentLoading}
                            >
                                {paymentLoading ? 'Saving...' : 'Assign Amount'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT TASK MODAL */}
            {editTask && (
                <div className="overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ maxWidth: '560px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                                ✏️ Edit Staff Task #{editTask.id}
                            </h3>
                            <button onClick={() => setEditTask(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                        </div>

                        <form onSubmit={handleSaveTaskEdit}>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                                    Task Title *
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    required
                                    value={editForm.title}
                                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                                    style={{ width: '100%', padding: '10px 12px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                                    Detailed Requirements & Deliverables
                                </label>
                                <textarea
                                    className="input"
                                    rows={3}
                                    value={editForm.description}
                                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                    style={{ width: '100%', padding: '10px 12px', resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                                        Assignee *
                                    </label>
                                    <select
                                        className="input"
                                        required
                                        value={editForm.assigned_to}
                                        onChange={e => setEditForm(f => ({ ...f, assigned_to: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 12px' }}
                                    >
                                        <option value="">Select Staff Member</option>
                                        {staff.map(s => (
                                            <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={editForm.due_date}
                                        onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 12px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                                        Task Status
                                    </label>
                                    <select
                                        className="input"
                                        value={editForm.status}
                                        onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 12px' }}
                                    >
                                        <option value="assigned">Assigned</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="submitted_for_review">Submitted for Review</option>
                                        <option value="revision_required">Revision Required</option>
                                        <option value="approved">Approved</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                                        Remarks / Notes
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Internal notes..."
                                        value={editForm.remarks}
                                        onChange={e => setEditForm(f => ({ ...f, remarks: e.target.value }))}
                                        style={{ width: '100%', padding: '10px 12px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" className="btn" onClick={() => setEditTask(null)}>Cancel</button>
                                <button
                                    type="submit"
                                    className="btn primary"
                                    disabled={editLoading}
                                    style={{ padding: '8px 22px' }}
                                >
                                    {editLoading ? 'Saving Changes...' : 'Save Task Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(HRTasks);
