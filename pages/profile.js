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

                    {/* Change Password Card */}
                    <PasswordChangeCard />
                </div>
            ) : (
                <div className="card empty-state"><h3>Profile not available</h3></div>
            )}
        </StaffLayout>
    );
}

function PasswordChangeCard() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword) {
            setMessage({ type: 'error', text: 'Current and new password are required.' });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const res = await apiPost('/api/staff/change-password/', {
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            });
            const d = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: d.message || 'Password updated successfully.' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage({ type: 'error', text: d.error || 'Failed to change password.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error updating password.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ marginTop: '16px', borderTop: '3px solid var(--accent-dark)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700 }}>Security & Password</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Update your account password if you were provisioned with a temporary system-generated password.
            </p>

            {message && (
                <div style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    marginBottom: '14px',
                    background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                    color: message.type === 'success' ? '#065f46' : '#991b1b',
                    fontWeight: 600
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handlePasswordChange}>
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Current Password *
                    </label>
                    <input
                        type="password"
                        className="input"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px' }}
                        required
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                            New Password *
                        </label>
                        <input
                            type="password"
                            className="input"
                            placeholder="At least 6 characters"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px' }}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                            Confirm New Password *
                        </label>
                        <input
                            type="password"
                            className="input"
                            placeholder="Re-enter new password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px' }}
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn primary"
                    disabled={loading}
                    style={{ fontSize: '0.82rem', padding: '8px 20px' }}
                >
                    {loading ? 'Updating Password...' : 'Update Password'}
                </button>
            </form>
        </div>
    );
}

export default withStaffAuth(Profile);

