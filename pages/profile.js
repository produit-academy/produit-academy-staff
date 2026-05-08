import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../lib/auth';
import { apiGet, apiPatch } from '../lib/api';
import StaffLayout from '../components/StaffLayout';

function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [form, setForm] = useState({ designation: '', bio: '' });

    useEffect(() => { loadProfile(); }, []);

    const loadProfile = async () => {
        try {
            const data = await apiGet('/staff/profile/');
            setProfile(data);
            setForm({ designation: data.designation || '', bio: data.bio || '' });
        } catch { }
        finally { setLoading(false); }
    };

    const saveProfile = async () => {
        setSaving(true);
        setMessage('');
        try {
            const res = await apiPatch('/staff/profile/', form);
            if (res.ok) {
                const updated = await res.json();
                setProfile(updated);
                setMessage('success:Profile updated!');
            } else {
                setMessage('error:Failed to update.');
            }
        } catch { setMessage('error:Something went wrong.'); }
        finally { setSaving(false); }
    };

    const msgType = message.startsWith('success:') ? 'success' : 'error';
    const msgText = message.replace(/^(success|error):/, '');

    return (
        <StaffLayout title="My Profile">
            <Head><title>My Profile | Staff Portal</title></Head>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
            ) : profile ? (
                <div style={{ maxWidth: '560px' }}>
                    <div className="card" style={{ marginBottom: '24px', padding: '28px', textAlign: 'center' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, margin: '0 auto 16px' }}>
                            {(profile.full_name?.[0] || profile.email?.[0] || 'S').toUpperCase()}
                        </div>
                        <h2 style={{ margin: '0 0 4px', fontSize: '20px' }}>{profile.full_name || 'Staff Member'}</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px', fontSize: '14px' }}>{profile.email}</p>
                        {profile.designation && (
                            <span style={{ background: 'var(--bg)', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>{profile.designation}</span>
                        )}
                    </div>

                    <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
                        <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Account Info</h3>
                        {[
                            ['Email', profile.email],
                            ['Phone', profile.phone_number || '—'],
                            ['Role', profile.role],
                            ['Joined', new Date(profile.joined_at).toLocaleDateString()],
                        ].map(([label, value]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '12px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                                <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Edit Profile</h3>
                        <div className="form-group">
                            <label className="label">Designation</label>
                            <input className="input" value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} placeholder="e.g. Content Manager" />
                        </div>
                        <div className="form-group">
                            <label className="label">Bio</label>
                            <textarea className="input" rows={3} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="A short bio..." style={{ resize: 'vertical' }} />
                        </div>
                        {msgText && <div className={`alert ${msgType}`} style={{ marginBottom: '16px' }}>{msgText}</div>}
                        <button className="btn primary" onClick={saveProfile} disabled={saving} style={{ width: '100%', padding: '12px' }}>
                            {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="card empty-state"><h3>Profile not found</h3></div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(Profile);