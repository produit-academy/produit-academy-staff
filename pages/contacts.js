import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../lib/auth';
import { apiGet, apiPatch } from '../lib/api';
import StaffLayout from '../components/StaffLayout';

function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [platform, setPlatform] = useState('all');

    useEffect(() => { load(); }, [platform]);

    const load = async () => {
        setLoading(true);
        try {
            const url = platform === 'all'
                ? '/api/staff/module/support/contacts/'
                : `/api/staff/module/support/contacts/?platform=${platform}`;
            setContacts(await apiGet(url));
        } catch { }
        finally { setLoading(false); }
    };

    const resolve = async (id) => {
        const comment = prompt('Resolution remark (optional):');
        if (comment === null) return; // User cancelled
        try {
            await apiPatch(`/api/staff/module/support/contacts/${id}/`, {
                status: 'Resolved',
                resolution_comment: comment || '',
            });
            load();
        } catch { }
    };

    const filtered = contacts.filter(c => filter === 'all' || c.status === filter);

    return (
        <StaffLayout title="Contact Enquiries">
            <Head><title>Contacts | Staff Portal</title></Head>

            {/* Platform Filter */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px' }}>Platform:</span>
                {[
                    { key: 'all', label: 'All' },
                    { key: 'gate', label: 'GATE' },
                    { key: 'classes', label: 'Classes' },
                ].map(p => (
                    <button key={p.key}
                        className={`btn ${platform === p.key ? 'primary' : ''}`}
                        onClick={() => setPlatform(p.key)}
                        style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {['all', 'Pending', 'Resolved'].map(f => (
                    <button key={f} className={`btn ${filter === f ? 'primary' : ''}`}
                        onClick={() => setFilter(f)}
                        style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
                        {f === 'all' ? `All (${contacts.length})` : `${f} (${contacts.filter(c => c.status === f).length})`}
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
                                    <h4 style={{ margin: '0 0 4px' }}>{c.name}</h4>
                                    <p style={{ margin: '0 0 8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{c.message}</p>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        <span>Course/Exam: {c.course || '--'}</span>
                                        <span>Email: <a href={`mailto:${c.email}`}>{c.email}</a></span>
                                        {c.phone && <span>Phone: {c.phone}</span>}
                                        <span className="badge" style={{
                                            background: c.platform === 'gate' ? 'var(--blue-bg)' : 'var(--green-bg)',
                                            color: c.platform === 'gate' ? 'var(--blue)' : 'var(--green)',
                                            fontSize: '0.72rem',
                                        }}>
                                            {c.platform === 'gate' ? 'GATE' : 'Classes'}
                                        </span>
                                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <span className="badge" style={{
                                    background: c.status === 'Pending' ? 'var(--red-bg)' : 'var(--green-bg)',
                                    color: c.status === 'Pending' ? 'var(--red)' : 'var(--green)',
                                }}>{c.status}</span>
                            </div>
                            {c.resolution_comment && (
                                <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: 'var(--accent-light)', fontSize: '0.85rem' }}>
                                    <strong>Resolution Remark:</strong> {c.resolution_comment}
                                </div>
                            )}
                            {c.status === 'Pending' && (
                                <button className="btn primary" onClick={() => resolve(c.id)}
                                    style={{ marginTop: '12px', fontSize: '0.82rem', padding: '6px 14px' }}>
                                    Mark as Resolved
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card empty-state"><h3>No enquiries</h3><p>No contact enquiries found for this filter.</p></div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(Contacts);
