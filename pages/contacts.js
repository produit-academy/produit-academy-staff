import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { withStaffAuth, useAuth } from '../lib/auth';
import { apiGet, apiPatch } from '../lib/api';
import StaffLayout from '../components/StaffLayout';

function Contacts() {
    const { user } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [platform, setPlatform] = useState('all');
    const [hasAccess, setHasAccess] = useState(true);

    // Resolution Modal
    const [resolveModal, setResolveModal] = useState(null); // contact object
    const [resolutionComment, setResolutionComment] = useState('');
    const [resolving, setResolving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            if (user?.role === 'staff') {
                const modData = await apiGet('/api/staff/modules/').catch(() => ({ modules: [] }));
                const mods = modData.modules || [];
                if (!mods.some(m => m.key === 'support')) {
                    setHasAccess(false);
                    setLoading(false);
                    return;
                }
            }
            const url = platform === 'all'
                ? '/api/staff/module/support/contacts/'
                : `/api/staff/module/support/contacts/?platform=${platform}`;
            const data = await apiGet(url);
            setContacts(Array.isArray(data) ? data : []);
        } catch {
            setContacts([]);
        } finally {
            setLoading(false);
        }
    }, [user, platform]);

    useEffect(() => { load(); }, [load]);

    const handleConfirmResolve = async (e) => {
        e.preventDefault();
        if (!resolveModal) return;
        setResolving(true);
        try {
            await apiPatch(`/api/staff/module/support/contacts/${resolveModal.id}/`, {
                status: 'Resolved',
                resolution_comment: resolutionComment.trim(),
            });
            setResolveModal(null);
            setResolutionComment('');
            load();
        } catch { }
        finally { setResolving(false); }
    };

    const filtered = contacts.filter(c => filter === 'all' || c.status === filter);

    return (
        <StaffLayout title="Contact Enquiries">
            <Head><title>Contacts | Staff Portal</title></Head>

            {!hasAccess ? (
                <div className="card empty-state" style={{ padding: '40px', textAlign: 'center', maxWidth: '520px', margin: '40px auto' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h3 style={{ color: 'var(--red)', marginBottom: '8px' }}>Access Restricted</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>You do not have permission to access the Support module.</p>
                </div>
            ) : (
                <>
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
                                <div key={c.id} className="card" style={{ borderLeft: `4px solid ${c.status === 'Pending' ? 'var(--blue)' : 'var(--green)'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <h4 style={{ margin: 0 }}>{c.name}</h4>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>&lt;{c.email}&gt;</span>
                                                {c.phone && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>• {c.phone}</span>}
                                            </div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>{c.subject}</div>
                                            <p style={{ margin: '0 0 8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{c.message}</p>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
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
                                            background: c.status === 'Pending' ? 'var(--blue-bg)' : 'var(--green-bg)',
                                            color: c.status === 'Pending' ? 'var(--blue)' : 'var(--green)',
                                        }}>{c.status}</span>
                                    </div>
                                    {c.resolution_comment && (
                                        <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: 'var(--accent-light)', fontSize: '0.85rem' }}>
                                            <strong>Resolution:</strong> {c.resolution_comment}
                                        </div>
                                    )}
                                    {c.status === 'Pending' && (
                                        <button className="btn primary"
                                            onClick={() => {
                                                setResolveModal(c);
                                                setResolutionComment('');
                                            }}
                                            style={{ marginTop: '12px', fontSize: '0.82rem', padding: '6px 14px' }}>
                                            Mark as Contacted / Resolved
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card empty-state"><h3>No enquiries</h3><p>No contact enquiries found for this filter.</p></div>
                    )}

                    {/* Resolution Modal */}
                    {resolveModal && (
                        <div style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                            backdropFilter: 'blur(4px)',
                        }} onClick={() => setResolveModal(null)}>
                            <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '20px' }} onClick={e => e.stopPropagation()}>
                                <h3 className="section-title" style={{ marginBottom: '14px' }}>
                                    Resolve Enquiry from {resolveModal.name}
                                </h3>
                                <form onSubmit={handleConfirmResolve}>
                                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                        Email: <strong style={{ color: 'var(--text-primary)' }}>{resolveModal.email}</strong><br/>
                                        Subject: {resolveModal.subject}
                                    </div>
                                    <div style={{ marginBottom: '18px' }}>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                                            Resolution Remark (Optional)
                                        </label>
                                        <textarea
                                            className="input"
                                            rows={3}
                                            placeholder="Notes on communication or follow-up provided..."
                                            value={resolutionComment}
                                            onChange={e => setResolutionComment(e.target.value)}
                                            style={{ padding: '10px 14px', resize: 'vertical' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button type="button" className="btn" onClick={() => setResolveModal(null)}>Cancel</button>
                                        <button type="submit" className="btn primary" disabled={resolving}>
                                            {resolving ? 'Saving...' : 'Confirm Resolution'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(Contacts);
