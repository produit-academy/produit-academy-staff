import Head from 'next/head';
import { useState, useEffect, useRef, useCallback } from 'react';
import { withStaffAuth } from '../../lib/auth';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api';
import StaffLayout from '../../components/StaffLayout';

function HROnboarding() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [approvingId, setApprovingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    // Form state
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [role, setRole] = useState('teacher');
    const [selectedSubjects, setSelectedSubjects] = useState([]);

    // Edit modal state
    const [editingStaff, setEditingStaff] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Delete confirmation
    const [confirmDelete, setConfirmDelete] = useState(null);

    // Course lazy loading state
    const [courses, setCourses] = useState([]);
    const [coursePage, setCoursePage] = useState(1);
    const [courseHasNext, setCourseHasNext] = useState(false);
    const [courseSearch, setCourseSearch] = useState('');
    const [courseLoading, setCourseLoading] = useState(false);
    const courseListRef = useRef(null);
    const searchTimerRef = useRef(null);

    const loadCourses = useCallback(async (page = 1, search = '', append = false) => {
        setCourseLoading(true);
        try {
            const params = new URLSearchParams({ page, page_size: 20 });
            if (search) params.set('search', search);
            const data = await apiGet(`/api/classes/courses/?${params}`);
            const results = data.results || [];
            setCourses(prev => append ? [...prev, ...results] : results);
            setCoursePage(data.page || page);
            setCourseHasNext(data.has_next || false);
        } catch {
            if (!append) setCourses([]);
        } finally {
            setCourseLoading(false);
        }
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const staffData = await apiGet('/api/admin/onboard-staff/');
            setStaff(Array.isArray(staffData) ? staffData : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
        loadCourses(1, '');
    };

    useEffect(() => { loadData(); }, []);

    // Debounced course search
    const handleCourseSearch = (val) => {
        setCourseSearch(val);
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            loadCourses(1, val, false);
        }, 350);
    };

    const loadMoreCourses = () => {
        if (courseHasNext && !courseLoading) {
            loadCourses(coursePage + 1, courseSearch, true);
        }
    };

    const handleCourseScroll = (e) => {
        const el = e.target;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
            loadMoreCourses();
        }
    };

    const clearAlerts = () => { setMessage(null); setError(null); };

    const handleOnboard = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        clearAlerts();
        try {
            const res = await apiPost('/api/admin/onboard-staff/', {
                email,
                first_name: firstName,
                last_name: lastName,
                phone_number: phoneNumber,
                role,
                subjects: selectedSubjects,
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                setEmail(''); setFirstName(''); setLastName(''); setPhoneNumber('');
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
        clearAlerts();
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

    const handleDelete = async (userId) => {
        setDeletingId(userId);
        clearAlerts();
        try {
            const res = await apiDelete(`/api/admin/onboard-staff/${userId}/`);
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message || 'Staff deleted successfully.');
                setConfirmDelete(null);
                loadData();
            } else {
                setError(data.error || 'Failed to delete.');
            }
        } catch (err) {
            setError('Network error.');
        } finally {
            setDeletingId(null);
        }
    };

    const openEditModal = (s) => {
        setEditingStaff(s);
        setEditForm({
            first_name: s.first_name || '',
            last_name: s.last_name || '',
            phone_number: s.phone_number || '',
            email: s.email || '',
            subjects: (s.subjects || []).map(sub => sub.id),
        });
    };

    const handleEditSave = async () => {
        clearAlerts();
        try {
            const res = await apiPatch(`/api/admin/onboard-staff/${editingStaff.id}/`, editForm);
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message || 'Staff updated.');
                setEditingStaff(null);
                loadData();
            } else {
                setError(data.error || 'Failed to update.');
            }
        } catch (err) {
            setError('Network error.');
        }
    };

    const toggleSubject = (id) => {
        setSelectedSubjects((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const toggleEditSubject = (id) => {
        setEditForm(prev => ({
            ...prev,
            subjects: prev.subjects.includes(id)
                ? prev.subjects.filter(s => s !== id)
                : [...prev.subjects, id],
        }));
    };

    const pendingStaff = staff.filter(s => !s.is_verified);
    const approvedStaff = staff.filter(s => s.is_verified);

    return (
        <StaffLayout title="Classes — HR Onboarding">
            <Head><title>HR Onboarding | Staff Portal</title></Head>

            {message && <div className="alert success" style={{ marginBottom: '20px' }}>{message}</div>}
            {error && <div className="alert error" style={{ marginBottom: '20px' }}>{error}</div>}

            {/* ───── Onboarding Form ───── */}
            <div className="card" style={{ marginBottom: '28px' }}>
                <h3 className="section-title" style={{ marginBottom: '20px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                        Onboard New Staff
                    </span>
                </h3>

                <form onSubmit={handleOnboard}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label className="label">First Name</label>
                            <input
                                className="input"
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="First Name"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Last Name</label>
                            <input
                                className="input"
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Last Name"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Email Address *</label>
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
                            <label className="label">Phone Number</label>
                            <input
                                className="input"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+91 9876543210"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Role *</label>
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

                    {role === 'teacher' && (
                        <div className="form-group" style={{ marginTop: '4px' }}>
                            <label className="label">Assign Subjects (optional)</label>

                            {/* Selected subjects preview */}
                            {selectedSubjects.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', marginBottom: '8px' }}>
                                    {selectedSubjects.map(id => {
                                        const c = courses.find(x => x.id === id);
                                        return (
                                            <span key={id} className="badge" style={{
                                                background: 'var(--green-bg)', color: 'var(--accent-dark)',
                                                border: '2px solid var(--accent)', padding: '4px 12px',
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                            }}>
                                                {c ? c.name : `#${id}`}
                                                <span style={{ cursor: 'pointer', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}
                                                    onClick={() => toggleSubject(id)}>×</span>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Search input */}
                            <input
                                className="input"
                                type="text"
                                placeholder="Search courses..."
                                value={courseSearch}
                                onChange={(e) => handleCourseSearch(e.target.value)}
                                style={{ marginTop: '4px', marginBottom: '0' }}
                            />

                            {/* Scrollable course list */}
                            <div
                                onScroll={handleCourseScroll}
                                style={{
                                    maxHeight: '180px', overflowY: 'auto', marginTop: '8px',
                                    border: '1px solid var(--border)', borderRadius: '8px',
                                    padding: '4px',
                                }}
                            >
                                {courses.length === 0 && !courseLoading && (
                                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                        {courseSearch ? 'No courses found.' : 'Loading courses...'}
                                    </div>
                                )}
                                {courses.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        style={{
                                            display: 'block', width: '100%', textAlign: 'left',
                                            padding: '8px 12px', border: 'none', borderRadius: '6px',
                                            cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'inherit',
                                            background: selectedSubjects.includes(c.id) ? 'var(--green-bg)' : 'transparent',
                                            color: selectedSubjects.includes(c.id) ? 'var(--accent-dark)' : 'var(--text-primary)',
                                            fontWeight: selectedSubjects.includes(c.id) ? 600 : 400,
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={(e) => { if (!selectedSubjects.includes(c.id)) e.target.style.background = 'rgba(0,0,0,0.03)'; }}
                                        onMouseLeave={(e) => { if (!selectedSubjects.includes(c.id)) e.target.style.background = 'transparent'; }}
                                        onClick={() => toggleSubject(c.id)}
                                    >
                                        {selectedSubjects.includes(c.id) ? '✓ ' : ''}{c.name}
                                    </button>
                                ))}
                                {courseLoading && (
                                    <div style={{ padding: '8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                                        Loading more...
                                    </div>
                                )}
                                {courseHasNext && !courseLoading && (
                                    <button
                                        type="button"
                                        onClick={loadMoreCourses}
                                        style={{
                                            display: 'block', width: '100%', padding: '6px',
                                            border: 'none', background: 'none', color: 'var(--accent)',
                                            cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit',
                                        }}
                                    >
                                        Load more courses...
                                    </button>
                                )}
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
                    {/* ───── Pending Approvals ───── */}
                    <h3 className="section-title">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            Pending Approvals ({pendingStaff.length})
                        </span>
                    </h3>

                    {pendingStaff.length > 0 ? (
                        <div className="table-wrapper" style={{ marginBottom: '28px' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Role</th>
                                        <th>Subjects</th>
                                        <th>Agreement</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingStaff.map((s) => (
                                        <tr key={s.id}>
                                            <td><strong>{s.first_name} {s.last_name}</strong></td>
                                            <td style={{ fontSize: '0.88rem' }}>{s.email}</td>
                                            <td style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{s.phone_number || '—'}</td>
                                            <td>
                                                <span className="badge" style={{
                                                    background: s.role === 'teacher' ? 'var(--blue-bg)' : 'var(--purple-bg)',
                                                    color: s.role === 'teacher' ? 'var(--blue)' : 'var(--purple)',
                                                }}>
                                                    {s.role}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>
                                                {s.subjects && s.subjects.length > 0
                                                    ? s.subjects.map(sub => sub.name).join(', ')
                                                    : <span style={{ color: 'var(--text-secondary)' }}>—</span>
                                                }
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
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    <button
                                                        className="btn primary"
                                                        style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                                                        disabled={!s.has_signed || approvingId === s.id}
                                                        onClick={() => handleApprove(s.id)}
                                                        title={!s.has_signed ? 'Staff must sign agreement first' : 'Approve this staff member'}
                                                    >
                                                        {approvingId === s.id ? '...' : 'Approve'}
                                                    </button>
                                                    <button
                                                        className="btn"
                                                        style={{ padding: '6px 12px', fontSize: '0.82rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                                                        onClick={() => openEditModal(s)}
                                                        title="Edit details"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="btn"
                                                        style={{ padding: '6px 12px', fontSize: '0.82rem', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', color: '#e74c3c' }}
                                                        onClick={() => setConfirmDelete(s)}
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
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

                    {/* ───── Active Staff ───── */}
                    <h3 className="section-title">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
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
                                        <th>Phone</th>
                                        <th>Role</th>
                                        <th>Subjects / Courses</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {approvedStaff.map((s) => (
                                        <tr key={s.id}>
                                            <td><strong>{s.first_name} {s.last_name}</strong></td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{s.email}</td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{s.phone_number || '—'}</td>
                                            <td>
                                                <span className="badge" style={{
                                                    background: s.role === 'teacher' ? 'var(--blue-bg)' : 'var(--purple-bg)',
                                                    color: s.role === 'teacher' ? 'var(--blue)' : 'var(--purple)',
                                                }}>
                                                    {s.role}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>
                                                {s.subjects && s.subjects.length > 0 ? (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                        {s.subjects.map(sub => (
                                                            <span key={sub.id} className="badge" style={{
                                                                background: 'var(--blue-bg)',
                                                                color: 'var(--blue)',
                                                                fontSize: '0.78rem',
                                                                padding: '3px 10px',
                                                            }}>
                                                                {sub.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-secondary)' }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                                {new Date(s.date_joined).toLocaleDateString('en-IN')}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="btn"
                                                        style={{ padding: '6px 12px', fontSize: '0.82rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                                                        onClick={() => openEditModal(s)}
                                                        title="Edit details"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="btn"
                                                        style={{ padding: '6px 12px', fontSize: '0.82rem', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', color: '#e74c3c' }}
                                                        onClick={() => setConfirmDelete(s)}
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
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

            {/* ───── Edit Modal ───── */}
            {editingStaff && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)',
                }} onClick={() => setEditingStaff(null)}>
                    <div className="card" style={{
                        width: '100%', maxWidth: '520px', margin: '20px',
                        animation: 'fadeIn 0.2s ease',
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 className="section-title" style={{ marginBottom: '20px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                ✏️ Edit Staff — {editingStaff.email}
                            </span>
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div className="form-group">
                                <label className="label">First Name</label>
                                <input className="input" value={editForm.first_name}
                                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="label">Last Name</label>
                                <input className="input" value={editForm.last_name}
                                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="label">Email</label>
                                <input className="input" type="email" value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="label">Phone</label>
                                <input className="input" type="tel" value={editForm.phone_number}
                                    onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })} />
                            </div>
                        </div>

                        {editingStaff.role === 'teacher' && courses.length > 0 && (
                            <div className="form-group" style={{ marginTop: '12px' }}>
                                <label className="label">Subjects</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                    {courses.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            className="badge"
                                            style={{
                                                cursor: 'pointer',
                                                border: editForm.subjects?.includes(c.id) ? '2px solid var(--accent)' : '1px solid var(--border)',
                                                background: editForm.subjects?.includes(c.id) ? 'var(--green-bg)' : 'transparent',
                                                color: editForm.subjects?.includes(c.id) ? 'var(--accent-dark)' : 'var(--text-secondary)',
                                                padding: '6px 14px',
                                                transition: 'all 0.2s',
                                            }}
                                            onClick={() => toggleEditSubject(c.id)}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                            <button className="btn" style={{ padding: '8px 20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                                onClick={() => setEditingStaff(null)}>Cancel</button>
                            <button className="btn primary" style={{ padding: '8px 24px' }}
                                onClick={handleEditSave}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ───── Delete Confirmation Modal ───── */}
            {confirmDelete && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)',
                }} onClick={() => setConfirmDelete(null)}>
                    <div className="card" style={{
                        width: '100%', maxWidth: '420px', margin: '20px', textAlign: 'center',
                        animation: 'fadeIn 0.2s ease',
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: 'rgba(231,76,60,0.1)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px', fontSize: '24px',
                        }}>
                            🗑️
                        </div>
                        <h3 style={{ marginBottom: '8px' }}>Delete Staff Member?</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                            Are you sure you want to delete <strong>{confirmDelete.first_name} {confirmDelete.last_name}</strong> ({confirmDelete.email})?
                            This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button className="btn" style={{ padding: '10px 24px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                                onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="btn" style={{
                                padding: '10px 24px', background: '#e74c3c', color: 'white', border: 'none',
                                borderRadius: '8px', fontWeight: 600,
                            }}
                                disabled={deletingId === confirmDelete.id}
                                onClick={() => handleDelete(confirmDelete.id)}>
                                {deletingId === confirmDelete.id ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </StaffLayout>
    );
}

export default withStaffAuth(HROnboarding);
