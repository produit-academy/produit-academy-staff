import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth, useAuth } from '../lib/auth';
import { apiGet, apiPatch } from '../lib/api';
import StaffLayout from '../components/StaffLayout';

function Profile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});

    useEffect(() => {
        apiGet('/api/staff/profile/')
            .then(data => { setProfile(data); setForm(data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const saveProfile = async () => {
        try {
            const updated = await apiPatch('/api/staff/profile/', {
                bio: form.bio,
                designation: form.designation,
            });
            setProfile(updated);
            setEditing(false);
        } catch { }
    };

    return (
        <StaffLayout title="My Profile">
            <Head><title>Profile | Staff Portal</title></Head>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
            ) : profile ? (
                <div style={{ maxWidth: '600px' }}>
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: 'var(--accent)', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.5rem', fontWeight: 700,
                            }}>
                                {(profile.full_name?.[0] || 'S').toUpperCase()}
                            </div>
                            <div>
                                <h2 style={{ margin: 0 }}>{profile.full_name}</h2>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{profile.email}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Role</label>
                                <div style={{ fontSize: '0.92rem', textTransform: 'capitalize' }}>{profile.role}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Phone</label>
                                <div style={{ fontSize: '0.92rem' }}>{profile.phone_number || '--'}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Department</label>
                                <div style={{ fontSize: '0.92rem' }}>{profile.department_name || '--'}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Joined</label>
                                <div style={{ fontSize: '0.92rem' }}>{new Date(profile.joined_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0 }}>Details</h3>
                            <button className="btn" onClick={() => setEditing(!editing)}
                                style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
                                {editing ? 'Cancel' : 'Edit'}
                            </button>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                                Designation
                            </label>
                            {editing ? (
                                <input type="text" className="input" value={form.designation || ''}
                                    onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                                    style={{ width: '100%', padding: '8px 12px' }} />
                            ) : (
                                <div style={{ fontSize: '0.92rem' }}>{profile.designation || '--'}</div>
                            )}
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                                Bio
                            </label>
                            {editing ? (
                                <textarea className="input" value={form.bio || ''}
                                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                                    rows={3} style={{ width: '100%', padding: '8px 12px', resize: 'vertical' }} />
                            ) : (
                                <div style={{ fontSize: '0.92rem' }}>{profile.bio || '--'}</div>
                            )}
                        </div>

                        {editing && (
                            <button className="btn primary" onClick={saveProfile}
                                style={{ fontSize: '0.82rem', padding: '8px 20px' }}>
                                Save Changes
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="card empty-state"><h3>Profile not available</h3></div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(Profile);
