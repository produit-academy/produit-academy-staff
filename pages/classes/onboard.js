import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../../lib/auth';
import { apiGet, apiPost } from '../../lib/api';
import StaffLayout from '../../components/StaffLayout';

function HROnboarding() {
    const [staff, setStaff] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [approvingId, setApprovingId] = useState(null);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    // Form state
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('teacher');
    const [selectedSubjects, setSelectedSubjects] = useState([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [staffData, courseData] = await Promise.all([
                apiGet('/api/admin/onboard-staff/'),
                apiGet('/api/classes/courses/').catch(() => []),
            ]);
            setStaff(Array.isArray(staffData) ? staffData : []);
            setCourses(Array.isArray(courseData) ? courseData : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleOnboard = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);
        setError(null);
        try {
            const res = await apiPost('/api/admin/onboard-staff/', {
                email,
                role,
                subjects: selectedSubjects,
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                setEmail('');
                setSelectedSubjects([]);
                loadData();
            } else {
                setError(data.error || 'Failed to onboard.');
            }
        } catch (err) {
            setError('Network error.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (userId) => {
        setApprovingId(userId);
        try {
            const res = await apiPost('/api/admin/approve-staff/', { user_id: userId });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                loadData();
            } else {
                setError(data.error || data.message || 'Failed to approve.');
            }
        } catch (err) {
            setError('Network error.');
        } finally {
            setApprovingId(null);
        }
    };

    const toggleSubject = (id) => {
        setSelectedSubjects((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const pendingStaff = staff.filter(s => !s.is_verified);
    const approvedStaff = staff.filter(s => s.is_verified);

    return (
        <StaffLayout title="Classes — HR Onboarding">
            <Head><title>HR Onboarding | Staff Portal</title></Head>

            {message && <div className="alert success">{message}</div>}
            {error && <div className="alert error">{error}</div>}

            {/* Onboarding Form */}
            <div className="card" style={{ marginBottom: '28px' }}>
                <h3 className="section-title" style={{ marginBottom: '20px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                        Onboard New Staff
                    </span>
                </h3>

                <form onSubmit={handleOnboard}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label className="label">Email Address</label>
                            <input
                                className="input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="teacher@example.com"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Role</label>
                            <select
                                className="input"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="teacher">Teacher</option>
                                <option value="mentor">Mentor</option>
                            </select>
                        </div>
                    </div>

                    {role === 'teacher' && courses.length > 0 && (
                        <div className="form-group" style={{ marginTop: '4px' }}>
                            <label className="label">Assign Subjects (optional)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                {courses.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        className={`badge ${selectedSubjects.includes(c.id) ? 'selected' : ''}`}
                                        style={{
                                            cursor: 'pointer',
                                            border: selectedSubjects.includes(c.id) ? '2px solid var(--accent)' : '1px solid var(--border)',
                                            background: selectedSubjects.includes(c.id) ? 'var(--green-bg)' : 'transparent',
                                            color: selectedSubjects.includes(c.id) ? 'var(--accent-dark)' : 'var(--text-secondary)',
                                            padding: '6px 14px',
                                            transition: 'all 0.2s',
                                        }}
                                        onClick={() => toggleSubject(c.id)}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn primary"
                        disabled={submitting}
                        style={{ marginTop: '16px' }}
                    >
                        {submitting ? 'Sending Invitation...' : 'Send Onboarding Email'}
                    </button>
                </form>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <div className="spinner" />
                </div>
            ) : (
                <>
                    {/* Pending Approvals */}
                    <h3 className="section-title">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Pending Approvals ({pendingStaff.length})
                        </span>
                    </h3>

                    {pendingStaff.length > 0 ? (
                        <div className="table-wrapper" style={{ marginBottom: '28px' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Agreement</th>
                                        <th>Joined</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingStaff.map((s) => (
                                        <tr key={s.id}>
                                            <td><strong>{s.email}</strong></td>
                                            <td>
                                                <span className="badge" style={{
                                                    background: s.role === 'teacher' ? 'var(--blue-bg)' : 'var(--purple-bg)',
                                                    color: s.role === 'teacher' ? 'var(--blue)' : 'var(--purple)',
                                                }}>
                                                    {s.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge" style={{
                                                    background: s.has_signed ? 'var(--green-bg)' : 'var(--yellow-bg)',
                                                    color: s.has_signed ? 'var(--green)' : '#b8860b',
                                                }}>
                                                    {s.has_signed ? '✓ Signed' : '⏳ Pending'}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                                {new Date(s.date_joined).toLocaleDateString('en-IN')}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn primary"
                                                    style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                                                    disabled={!s.has_signed || approvingId === s.id}
                                                    onClick={() => handleApprove(s.id)}
                                                    title={!s.has_signed ? 'Staff must sign agreement first' : 'Approve this staff member'}
                                                >
                                                    {approvingId === s.id ? 'Approving...' : 'Approve'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="card empty-state" style={{ marginBottom: '28px' }}>
                            <h3>No pending approvals</h3>
                            <p>All staff members have been verified.</p>
                        </div>
                    )}

                    {/* Approved Staff */}
                    <h3 className="section-title">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            Active Staff ({approvedStaff.length})
                        </span>
                    </h3>

                    {approvedStaff.length > 0 ? (
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {approvedStaff.map((s) => (
                                        <tr key={s.id}>
                                            <td><strong>{s.first_name} {s.last_name}</strong></td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{s.email}</td>
                                            <td>
                                                <span className="badge" style={{
                                                    background: s.role === 'teacher' ? 'var(--blue-bg)' : 'var(--purple-bg)',
                                                    color: s.role === 'teacher' ? 'var(--blue)' : 'var(--purple)',
                                                }}>
                                                    {s.role}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                                {new Date(s.date_joined).toLocaleDateString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="card empty-state">
                            <h3>No active staff yet</h3>
                            <p>Onboard a teacher or mentor to get started.</p>
                        </div>
                    )}
                </>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(HROnboarding);
