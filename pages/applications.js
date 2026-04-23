import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../lib/auth';
import { apiGet, apiFetch } from '../lib/api';
import StaffLayout from '../components/StaffLayout';

function Applications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try { setApplications(await apiGet('/api/staff/module/careers/applications/')); }
        catch { }
        finally { setLoading(false); }
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

    const handleExport = () => {
        const headers = ['Date', 'Candidate Name', 'Role', 'Email', 'Phone', 'Portfolio', 'Interviewed'];
        const rows = [headers.join(',')];
        applications.forEach(app => {
            rows.push([
                `"${new Date(app.created_at).toLocaleDateString()}"`,
                `"${(app.name || '').replace(/"/g, '""')}"`,
                `"${app.position || ''}"`,
                `"${app.email}"`,
                `"${app.phone || ''}"`,
                `"${app.portfolio || ''}"`,
                `"${app.interviewed ? 'Yes' : 'No'}"`,
            ].join(','));
        });
        const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'job_applications.csv';
        link.click();
    };

    return (
        <StaffLayout title="Job Applications">
            <Head><title>Applications | Staff Portal</title></Head>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
                    All applications from the Careers portal ({applications.length})
                </p>
                {applications.length > 0 && (
                    <button className="btn" onClick={handleExport} style={{ fontSize: '0.82rem' }}>Export CSV</button>
                )}
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
                                <th>Portfolio</th>
                                <th style={{ textAlign: 'center' }}>Interviewed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.map(app => (
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
                                        {app.portfolio ? (
                                            <a href={app.portfolio} target="_blank" rel="noreferrer" style={{ fontWeight: '600' }}>
                                                View Link
                                            </a>
                                        ) : (
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card empty-state"><h3>No applications</h3><p>No job applications submitted yet.</p></div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(Applications);
