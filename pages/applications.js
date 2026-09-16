import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../lib/auth';
import { apiGet, apiFetch } from '../lib/api';
import StaffLayout from '../components/StaffLayout';

const isOnlyLink = (str) => {
    if (!str) return false;
    const trimmed = str.trim();
    return !/\s/.test(trimmed) && (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('www.'));
};

const getLinkHref = (str) => {
    const trimmed = str.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
};

function Applications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [positionFilter, setPositionFilter] = useState('all');
    const [accessDenied, setAccessDenied] = useState(false);

    // Extract unique positions from applications
    const uniquePositions = [...new Set(applications.map(app => app.position || 'General'))].filter(Boolean);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const data = await apiGet('/api/staff/module/careers/applications/');
            setApplications(Array.isArray(data) ? data : []);
        } catch (err) {
            if (err?.status === 403 || err?.message?.includes('403') || err?.message?.includes('permission')) {
                setAccessDenied(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleToggleInterview = async (id, currentStatus) => {
        try {
            const res = await apiFetch(`/api/staff/module/careers/applications/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ interviewed: !currentStatus }),
            });
            if (res.ok) {
                setApplications(applications.map(app =>
                    app.id === id ? { ...app, interviewed: !currentStatus } : app
                ));
            }
        } catch { }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this application?')) return;
        try {
            const res = await apiFetch(`/api/staff/module/careers/applications/${id}/`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setApplications(applications.filter(app => app.id !== id));
            } else {
                alert('Failed to delete application.');
            }
        } catch {
            alert('Error deleting application.');
        }
    };

    const handleExport = () => {
        const headers = ['Date', 'Candidate Name', 'Role', 'Email', 'Phone', 'Portfolio', 'Courses', 'Experience', 'Education', 'Status', 'Academy', 'Interviewed'];
        const rows = [headers.join(',')];
        applications.forEach(app => {
            rows.push([
                `"${new Date(app.created_at).toLocaleDateString()}"`,
                `"${(app.name || '').replace(/"/g, '""')}"`,
                `"${app.position || ''}"`,
                `"${app.email}"`,
                `"${app.phone || ''}"`,
                `"${(app.portfolio || '').replace(/"/g, '""')}"`,
                `"${(app.preferred_courses || '').replace(/"/g, '""')}"`,
                `"${(app.experience || '').replace(/"/g, '""')}"`,
                `"${(app.education || '').replace(/"/g, '""')}"`,
                `"${(app.current_status || '').replace(/"/g, '""')}"`,
                `"${(app.academy_details || '').replace(/"/g, '""')}"`,
                `"${app.interviewed ? 'Yes' : 'No'}"`,
            ].join(','));
        });
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'job_applications.csv';
        link.click();
    };
    const filteredApplications = applications.filter(app => {
        // Status filter
        if (filter === 'interviewed' && !app.interviewed) return false;
        if (filter === 'pending' && app.interviewed) return false;
        
        // Position filter
        const appPos = app.position || 'General';
        if (positionFilter !== 'all' && appPos !== positionFilter) return false;

        return true;
    });

    return (
        <StaffLayout title="Job Applications">
            <Head><title>Applications | Staff Portal</title></Head>
            {accessDenied ? (
                <div className="card empty-state" style={{ padding: '40px', textAlign: 'center', maxWidth: '520px', margin: '40px auto' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h3 style={{ color: 'var(--red)', marginBottom: '8px' }}>Access Restricted</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>You do not have permission to access the Careers & Recruitment module.</p>
                </div>
            ) : (
                <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Showing {filteredApplications.length} of {applications.length} applications
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select 
                        value={positionFilter} 
                        onChange={(e) => setPositionFilter(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'var(--card-bg)', maxWidth: '200px' }}
                    >
                        <option value="all">All Positions</option>
                        {uniquePositions.map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                        ))}
                    </select>

                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'var(--card-bg)' }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="interviewed">Interviewed</option>
                    </select>
                    {applications.length > 0 && (
                        <button className="btn" onClick={handleExport} style={{ fontSize: '0.82rem' }}>Export CSV</button>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
            ) : applications.length > 0 ? (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Name</th>
                                <th>Position</th>
                                <th>Contact</th>
                                <th>Details & Portfolio</th>
                                <th style={{ textAlign: 'center' }}>Interviewed</th>
                                <th style={{ textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredApplications.map(app => (
                                <tr key={app.id}>
                                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                                        {new Date(app.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td><strong>{app.name}</strong></td>
                                    <td>
                                        <span className="badge" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
                                            {app.position || 'General'}
                                        </span>
                                    </td>
                                    <td>
                                        <div><a href={`mailto:${app.email}`}>{app.email}</a></div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{app.phone || '--'}</div>
                                    </td>
                                    <td>
                                        {app.portfolio && (
                                            <div style={{ marginBottom: '4px' }}>
                                                <strong>Portfolio:</strong>{' '}
                                                {isOnlyLink(app.portfolio) ? (
                                                    <a href={getLinkHref(app.portfolio)} target="_blank" rel="noreferrer" style={{ fontWeight: '600', color: 'var(--accent)' }}>
                                                        View Link
                                                    </a>
                                                ) : (
                                                    <span style={{ whiteSpace: 'pre-wrap' }}>{app.portfolio}</span>
                                                )}
                                            </div>
                                        )}
                                        {app.preferred_courses && <div style={{ fontSize: '0.85rem', marginBottom: '2px' }}><strong>Courses:</strong> {app.preferred_courses}</div>}
                                        {app.experience && <div style={{ fontSize: '0.85rem', marginBottom: '2px' }}><strong>Experience:</strong> {app.experience}</div>}
                                        {app.education && <div style={{ fontSize: '0.85rem', marginBottom: '2px' }}><strong>Education:</strong> {app.education}</div>}
                                        {app.current_status && <div style={{ fontSize: '0.85rem', marginBottom: '2px' }}><strong>Status:</strong> {app.current_status}</div>}
                                        {app.academy_details && <div style={{ fontSize: '0.85rem', marginBottom: '2px' }}><strong>Academy:</strong> {app.academy_details}</div>}
                                        
                                        {!app.portfolio && !app.preferred_courses && !app.experience && !app.education && !app.current_status && !app.academy_details && (
                                            <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Not provided</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={app.interviewed || false}
                                                onChange={() => handleToggleInterview(app.id, app.interviewed)}
                                                style={{ cursor: 'pointer', transform: 'scale(1.3)', accentColor: 'var(--accent)' }}
                                            />
                                        </label>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button 
                                            onClick={() => handleDelete(app.id)}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-red, #e74c3c)', cursor: 'pointer', padding: '4px' }}
                                            title="Delete Application"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card empty-state"><h3>No applications</h3><p>No job applications submitted yet.</p></div>
            )}
            </>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(Applications);
