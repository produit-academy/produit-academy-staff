import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { withStaffAuth, useAuth } from '../../lib/auth';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import StaffLayout from '../../components/StaffLayout';

function ClassSessionsPage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [search, setSearch] = useState('');
    const [message, setMessage] = useState(null);

    // Meet Link Modal state
    const [meetModal, setMeetModal] = useState(null); // session object
    const [meetLinkInput, setMeetLinkInput] = useState('');
    const [meetSaving, setMeetSaving] = useState(false);

    // Outcome Modal state
    const [outcomeModal, setOutcomeModal] = useState(null); // session object
    const [outcomeChoice, setOutcomeChoice] = useState('Completed');
    const [outcomeRemarks, setOutcomeRemarks] = useState('');
    const [outcomeTeacherNotes, setOutcomeTeacherNotes] = useState('');
    const [outcomeSaving, setOutcomeSaving] = useState(false);

    const loadSessions = useCallback(async () => {
        setLoading(true);
        try {
            if (user?.role === 'staff') {
                const modData = await apiGet('/api/staff/modules/').catch(() => ({ modules: [] }));
                const mods = modData.modules || [];
                if (!mods.some(m => m.key === 'classes')) {
                    setHasAccess(false);
                    setLoading(false);
                    return;
                }
            }
            const queryParams = new URLSearchParams();
            if (activeTab && activeTab !== 'All') {
                queryParams.set('status', activeTab);
            }
            if (search) {
                queryParams.set('search', search);
            }
            const data = await apiGet(`/api/classes/admin/sessions/?${queryParams.toString()}`);
            setSessions(Array.isArray(data) ? data : []);
        } catch (err) {
            setSessions([]);
        } finally {
            setLoading(false);
        }
    }, [user, activeTab, search]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const handleSaveMeetLink = async (e) => {
        e.preventDefault();
        if (!meetModal) return;
        setMeetSaving(true);
        try {
            await apiPatch(`/api/classes/sessions/${meetModal.id}/meet-link/`, {
                meeting_link: meetLinkInput.trim()
            });
            setMessage({ type: 'success', text: `Google Meet link updated for "${meetModal.title}".` });
            setMeetModal(null);
            loadSessions();
        } catch (err) {
            setMessage({ type: 'error', text: err?.message || 'Failed to update Google Meet link.' });
        } finally {
            setMeetSaving(false);
        }
    };

    const handleSaveOutcome = async (e) => {
        e.preventDefault();
        if (!outcomeModal) return;
        if (['Not Conducted', 'Cancelled'].includes(outcomeChoice) && !outcomeRemarks.trim()) {
            setMessage({ type: 'error', text: 'Remarks are required when marking as Not Conducted or Cancelled.' });
            return;
        }
        setOutcomeSaving(true);
        try {
            await apiPost(`/api/classes/sessions/${outcomeModal.id}/outcome/`, {
                outcome: outcomeChoice,
                remarks: outcomeRemarks.trim(),
                teacher_notes: outcomeTeacherNotes.trim()
            });
            setMessage({ type: 'success', text: `Class session marked as ${outcomeChoice}.` });
            setOutcomeModal(null);
            loadSessions();
        } catch (err) {
            setMessage({ type: 'error', text: err?.message || 'Failed to record session outcome.' });
        } finally {
            setOutcomeSaving(false);
        }
    };

    const TABS = ['All', 'Live', 'Needs Review', 'Scheduled', 'Completed', 'Not Conducted', 'Cancelled'];

    // Overall stats
    const totalCount = sessions.length;
    const liveCount = sessions.filter(s => s.effective_status === 'Live').length;
    const reviewCount = sessions.filter(s => s.effective_status === 'Needs Review').length;
    const completedCount = sessions.filter(s => s.effective_status === 'Completed' || s.status === 'Completed').length;

    return (
        <StaffLayout title="Class Sessions & Operations">
            <Head><title>Class Sessions | Staff Portal</title></Head>

            {message && (
                <div className={`alert ${message.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{message.text}</span>
                        <button type="button" onClick={() => setMessage(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit' }}>✕</button>
                    </div>
                </div>
            )}

            {!hasAccess ? (
                <div className="card empty-state" style={{ padding: '40px', textAlign: 'center', maxWidth: '520px', margin: '40px auto' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h3 style={{ color: 'var(--red)', marginBottom: '8px' }}>Access Restricted</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>You do not have permission to access the Classes & Operations module.</p>
                </div>
            ) : (
                <>
                    {/* Header Metrics */}
                    <div className="stats-grid" style={{ marginBottom: '24px' }}>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: 'var(--accent)' }}>{totalCount}</div>
                            <div className="stat-label">Total Loaded Sessions</div>
                        </div>
                        <div className="card stat-card" style={{ borderColor: liveCount > 0 ? '#10b981' : 'var(--border)' }}>
                            <div className="stat-value" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {liveCount}
                                {liveCount > 0 && <span className="pulsating-dot" />}
                            </div>
                            <div className="stat-label">Live Class Right Now</div>
                        </div>
                        <div className="card stat-card" style={{ borderColor: reviewCount > 0 ? '#f59e0b' : 'var(--border)' }}>
                            <div className="stat-value" style={{ color: '#f59e0b' }}>{reviewCount}</div>
                            <div className="stat-label">Needs Review / Outcome</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: 'var(--green)' }}>{completedCount}</div>
                            <div className="stat-label">Completed Sessions</div>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {TABS.map(t => (
                                <button
                                    key={t}
                                    className={`btn ${activeTab === t ? 'primary' : ''}`}
                                    onClick={() => setActiveTab(t)}
                                    style={{
                                        fontSize: '0.82rem',
                                        padding: '6px 14px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    {t === 'Live' && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeTab === 'Live' ? '#fff' : '#10b981' }} />}
                                    {t}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                className="input"
                                placeholder="Search teacher, student, course..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ padding: '8px 14px', minWidth: '260px' }}
                            />
                            <button
                                className="btn"
                                onClick={loadSessions}
                                title="Refresh"
                                style={{ padding: '8px 12px' }}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Sessions Table */}
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                            <div className="spinner" />
                        </div>
                    ) : sessions.length > 0 ? (
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Class Title & Course</th>
                                        <th>Teacher</th>
                                        <th>Student</th>
                                        <th>Schedule & Duration</th>
                                        <th>Meet Link</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.map(s => {
                                        const effStatus = s.effective_status || s.status;
                                        const isLive = effStatus === 'Live';
                                        const isNeedsReview = effStatus === 'Needs Review';
                                        const isCompleted = effStatus === 'Completed';
                                        const isCancelled = ['Cancelled', 'Not Conducted'].includes(effStatus);

                                        let badgeColor = 'var(--text-secondary)';
                                        let badgeBg = 'var(--bg-secondary)';
                                        if (isLive) { badgeColor = '#047857'; badgeBg = '#d1fae5'; }
                                        else if (isNeedsReview) { badgeColor = '#b45309'; badgeBg = '#fef3c7'; }
                                        else if (isCompleted) { badgeColor = '#15803d'; badgeBg = '#dcfce7'; }
                                        else if (isCancelled) { badgeColor = '#b91c1c'; badgeBg = '#fee2e2'; }
                                        else if (effStatus === 'Scheduled') { badgeColor = '#1d4ed8'; badgeBg = '#dbeafe'; }

                                        return (
                                            <tr key={s.id} style={{ background: isLive ? 'rgba(16, 185, 129, 0.04)' : undefined }}>
                                                <td>
                                                    <span className="badge" style={{
                                                        background: badgeBg,
                                                        color: badgeColor,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        fontWeight: 600
                                                    }}>
                                                        {isLive && <span className="pulsating-dot" />}
                                                        {effStatus}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.title}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        {s.course_name || 'Individual Class Session'}
                                                        {s.is_demo && <span className="badge" style={{ marginLeft: '6px', background: 'var(--purple-bg)', color: 'var(--purple)', fontSize: '0.7rem' }}>Demo</span>}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{s.teacher_name || 'Assigned Teacher'}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{s.student_name || 'Enrolled Student'}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '0.85rem' }}>
                                                        {new Date(s.scheduled_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                                        {new Date(s.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {s.duration_minutes} mins
                                                    </div>
                                                </td>
                                                <td>
                                                    {s.meeting_link ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <a
                                                                href={s.meeting_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn"
                                                                style={{ padding: '3px 8px', fontSize: '0.75rem', background: '#e0f2fe', color: '#0284c7', borderColor: '#bae6fd' }}
                                                            >
                                                                Join Meet
                                                            </a>
                                                            <button
                                                                type="button"
                                                                className="btn"
                                                                onClick={() => {
                                                                    setMeetModal(s);
                                                                    setMeetLinkInput(s.meeting_link || '');
                                                                }}
                                                                title="Edit Link"
                                                                style={{ padding: '3px 7px', fontSize: '0.75rem' }}
                                                            >
                                                                Edit
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="btn primary"
                                                            onClick={() => {
                                                                setMeetModal(s);
                                                                setMeetLinkInput('');
                                                            }}
                                                            style={{ padding: '3px 9px', fontSize: '0.75rem' }}
                                                        >
                                                            + Add Link
                                                        </button>
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button
                                                            type="button"
                                                            className="btn"
                                                            onClick={() => {
                                                                setOutcomeModal(s);
                                                                setOutcomeChoice(s.status === 'Scheduled' ? 'Completed' : s.status);
                                                                setOutcomeRemarks(s.outcome_remarks || '');
                                                                setOutcomeTeacherNotes(s.teacher_notes || '');
                                                            }}
                                                            style={{
                                                                padding: '4px 10px',
                                                                fontSize: '0.78rem',
                                                                background: isNeedsReview ? '#fef3c7' : 'var(--bg-secondary)',
                                                                borderColor: isNeedsReview ? '#f59e0b' : 'var(--border)',
                                                                color: isNeedsReview ? '#92400e' : 'var(--text-primary)',
                                                                fontWeight: isNeedsReview ? 600 : 400
                                                            }}
                                                        >
                                                            {s.status === 'Scheduled' ? 'Record Outcome' : 'Edit Outcome'}
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
                        <div className="card empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                            <h3>No Class Sessions Found</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>No sessions matched your filter criteria.</p>
                        </div>
                    )}

                    {/* Meet Link Modal */}
                    {meetModal && (
                        <div style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                            backdropFilter: 'blur(4px)',
                        }} onClick={() => setMeetModal(null)}>
                            <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '20px' }} onClick={e => e.stopPropagation()}>
                                <h3 className="section-title" style={{ marginBottom: '16px' }}>
                                    Google Meet Link - {meetModal.title}
                                </h3>
                                <form onSubmit={handleSaveMeetLink}>
                                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                                        Provide the Google Meet URL for this session. Updating this link will trigger an automated notification to both the student ({meetModal.student_name}) and teacher ({meetModal.teacher_name}).
                                    </p>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Google Meet Link</label>
                                        <input
                                            className="input"
                                            type="url"
                                            required
                                            placeholder="https://meet.google.com/abc-defg-hij"
                                            value={meetLinkInput}
                                            onChange={e => setMeetLinkInput(e.target.value)}
                                            style={{ padding: '10px 14px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button type="button" className="btn" onClick={() => setMeetModal(null)}>Cancel</button>
                                        <button type="submit" className="btn primary" disabled={meetSaving}>
                                            {meetSaving ? 'Saving...' : 'Save & Notify'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Outcome Modal */}
                    {outcomeModal && (
                        <div style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                            backdropFilter: 'blur(4px)',
                        }} onClick={() => setOutcomeModal(null)}>
                            <div className="card" style={{ width: '100%', maxWidth: '540px', margin: '20px' }} onClick={e => e.stopPropagation()}>
                                <h3 className="section-title" style={{ marginBottom: '16px' }}>
                                    Record Session Outcome - {outcomeModal.title}
                                </h3>
                                <form onSubmit={handleSaveOutcome}>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px' }}>Final Class Status</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {['Completed', 'Not Conducted', 'Cancelled'].map(opt => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    className="btn"
                                                    onClick={() => setOutcomeChoice(opt)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px 8px',
                                                        fontSize: '0.82rem',
                                                        fontWeight: 600,
                                                        background: outcomeChoice === opt ? (opt === 'Completed' ? '#dcfce7' : '#fee2e2') : 'var(--bg-secondary)',
                                                        borderColor: outcomeChoice === opt ? (opt === 'Completed' ? 'var(--accent)' : 'var(--red)') : 'var(--border)',
                                                        color: outcomeChoice === opt ? (opt === 'Completed' ? 'var(--accent-dark)' : 'var(--red)') : 'var(--text-secondary)',
                                                    }}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                                            Remarks / Reason {['Not Conducted', 'Cancelled'].includes(outcomeChoice) ? <span style={{ color: 'var(--red)' }}>*</span> : '(Optional)'}
                                        </label>
                                        <textarea
                                            className="input"
                                            rows={3}
                                            required={['Not Conducted', 'Cancelled'].includes(outcomeChoice)}
                                            placeholder={outcomeChoice === 'Completed' ? 'Session summary, topics covered...' : 'Why was this session not conducted or cancelled?'}
                                            value={outcomeRemarks}
                                            onChange={e => setOutcomeRemarks(e.target.value)}
                                            style={{ padding: '10px 14px', resize: 'vertical' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                                            Internal Staff / Teacher Notes (Optional)
                                        </label>
                                        <textarea
                                            className="input"
                                            rows={2}
                                            placeholder="Private operational notes..."
                                            value={outcomeTeacherNotes}
                                            onChange={e => setOutcomeTeacherNotes(e.target.value)}
                                            style={{ padding: '10px 14px', resize: 'vertical' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button type="button" className="btn" onClick={() => setOutcomeModal(null)}>Cancel</button>
                                        <button type="submit" className="btn primary" disabled={outcomeSaving}>
                                            {outcomeSaving ? 'Recording...' : 'Confirm Outcome'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}

            <style jsx>{`
                .pulsating-dot {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #10b981;
                    box-shadow: 0 0 0 rgba(16, 185, 129, 0.4);
                    animation: pulse 1.8s infinite;
                }
                @keyframes pulse {
                    0% {
                        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                    }
                    70% {
                        box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
                    }
                }
            `}</style>
        </StaffLayout>
    );
}

export default withStaffAuth(ClassSessionsPage);
