import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../lib/auth';
import { apiGet, apiPatch } from '../lib/api';
import StaffLayout from '../components/StaffLayout';

function Complaints() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => { load(); }, []);

    const load = async () => {
        try { setComplaints(await apiGet('/api/staff/module/support/complaints/')); }
        catch { }
        finally { setLoading(false); }
    };

    const resolve = async (id) => {
        const comment = prompt('Resolution comment (optional):');
        try {
            await apiPatch(`/api/staff/module/support/complaints/${id}/`, {
                status: 'Resolved',
                resolution_comment: comment || '',
            });
            load();
        } catch { }
    };

    const filtered = complaints.filter(c => filter === 'all' || c.status === filter);

    return (
        <StaffLayout title="Complaints">
            <Head><title>Complaints | Staff Portal</title></Head>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {['all', 'Pending', 'Resolved'].map(f => (
                    <button key={f} className={`btn ${filter === f ? 'primary' : ''}`}
                        onClick={() => setFilter(f)}
                        style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
                        {f === 'all' ? `All (${complaints.length})` : `${f} (${complaints.filter(c => c.status === f).length})`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
            ) : filtered.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filtered.map(c => (
                        <div key={c.id} className="card" style={{ borderLeft: `4px solid ${c.status === 'Pending' ? 'var(--red)' : 'var(--green)'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 4px' }}>{c.subject}</h4>
                                    <p style={{ margin: '0 0 8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{c.description}</p>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        Student: {c.student_name} &middot; {new Date(c.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <span className="badge" style={{
                                    background: c.status === 'Pending' ? 'var(--red-bg)' : 'var(--green-bg)',
                                    color: c.status === 'Pending' ? 'var(--red)' : 'var(--green)',
                                }}>{c.status}</span>
                            </div>
                            {c.resolution_comment && (
                                <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: 'var(--accent-light)', fontSize: '0.85rem' }}>
                                    <strong>Resolution:</strong> {c.resolution_comment}
                                </div>
                            )}
                            {c.status === 'Pending' && (
                                <button className="btn primary" onClick={() => resolve(c.id)}
                                    style={{ marginTop: '12px', fontSize: '0.82rem', padding: '6px 14px' }}>
                                    Resolve
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card empty-state"><h3>No complaints</h3><p>No complaints found for this filter.</p></div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(Complaints);
