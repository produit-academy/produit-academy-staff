import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth, useAuth } from '../../lib/auth';
import { apiGet, apiPost, apiFetch, apiPatch } from '../../lib/api';
import StaffLayout from '../../components/StaffLayout';

const ACCOUNT_TYPES = [
    { key: 'platform_admin', label: 'Platform Admin', desc: 'Full access to GATE or Classes portal' },
    { key: 'manager', label: 'Manager', desc: 'Manages tasks, payroll & staff' },
    { key: 'support_staff', label: 'Support Staff', desc: 'Handles complaints for assigned platform(s)' },
    { key: 'contact_staff', label: 'Contact Staff', desc: 'Handles contact enquiries for assigned platform(s)' },
    { key: 'hr_staff', label: 'HR Staff', desc: 'Reviews applications & onboards teachers' },
    { key: 'custom_staff', label: 'Custom Staff', desc: 'Custom role with specified department & modules' },
];

const PLATFORMS = [
    { key: 'gate', label: 'GATE' },
    { key: 'classes', label: 'Classes' },
];

const ALL_MODULES = [
    { key: 'support', label: 'Support' },
    { key: 'careers', label: 'Careers' },
    { key: 'gate_content', label: 'GATE Content' },
    { key: 'classes', label: 'Classes' },
    { key: 'analytics', label: 'Analytics' },
];

function AdminUsers() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [existingUserData, setExistingUserData] = useState(null);
    const [filterType, setFilterType] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [accountType, setAccountType] = useState('platform_admin');
    const [form, setForm] = useState({
        first_name: '', last_name: '', email: '', password: '',
        phone_number: '', platform: 'gate', assigned_platforms: ['gate'],
        department_name: '', designation: '', modules: [],
        upgrade_existing: false,
    });

    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({
        first_name: '', last_name: '', email: '', phone_number: '',
        designation: '', department_name: '', modules: []
    });

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        setLoading(true);
        try { setUsers(await apiGet('/api/admin/users/')); }
        catch { setError('Failed to load users.'); }
        finally { setLoading(false); }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm({ ...form, [e.target.name]: value });
    };

    const togglePlatform = (p) => {
        const current = form.assigned_platforms;
        if (current.includes(p)) {
            if (current.length > 1) setForm({ ...form, assigned_platforms: current.filter(x => x !== p) });
        } else {
            setForm({ ...form, assigned_platforms: [...current, p] });
        }
    };

    const toggleModule = (m) => {
        const current = form.modules;
        if (current.includes(m)) {
            setForm({ ...form, modules: current.filter(x => x !== m) });
        } else {
            setForm({ ...form, modules: [...current, m] });
        }
    };

    const toggleEditModule = (m) => {
        const current = editForm.modules || [];
        if (current.includes(m)) {
            setEditForm({ ...editForm, modules: current.filter(x => x !== m) });
        } else {
            setEditForm({ ...editForm, modules: [...current, m] });
        }
    };

    const handleSubmit = async (e, forceUpgrade = false) => {
        if (e && e.preventDefault) e.preventDefault();
        setSubmitting(true); setError(''); setSuccess('');

        const shouldUpgrade = forceUpgrade || form.upgrade_existing;
        const payload = {
            first_name: form.first_name, last_name: form.last_name,
            email: form.email, password: form.password,
            phone_number: form.phone_number, account_type: accountType,
            upgrade_existing: shouldUpgrade,
        };

        if (accountType === 'platform_admin') {
            payload.platform = form.platform;
        } else if (accountType === 'support_staff' || accountType === 'contact_staff') {
            payload.assigned_platforms = form.assigned_platforms;
        } else if (accountType === 'custom_staff') {
            payload.department_name = form.department_name;
            payload.designation = form.designation;
            payload.modules = form.modules;
        }

        try {
            const res = await apiPost('/api/admin/users/create/', payload);
            const data = await res.json();
            if (res.ok) {
                setSuccess(data.message || 'Account created successfully.');
                setExistingUserData(null);
                setForm(prev => ({
                    ...prev, first_name: '', last_name: '', email: '', password: '',
                    phone_number: '', department_name: '', designation: '', modules: [],
                    upgrade_existing: false,
                }));
                setShowForm(false);
                loadUsers();
            } else {
                if (data.user_exists && data.existing_user) {
                    setExistingUserData(data.existing_user);
                } else {
                    setExistingUserData(null);
                }
                setError(data.error || JSON.stringify(data));
            }
        } catch {
            setError('Network error.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, email) => {
        if (!confirm(`Delete user ${email}?`)) return;
        try {
            const res = await apiFetch(`/api/admin/users/${id}/`, { method: 'DELETE' });
            if (res.ok) { setSuccess('User deleted.'); loadUsers(); }
        } catch { setError('Network error.'); }
    };

    const openEditModal = (u) => {
        setEditUser(u);
        setEditForm({
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            email: u.email || '',
            phone_number: u.phone_number || '',
            designation: u.designation || '',
            department_name: u.department_name || '',
            modules: Array.isArray(u.modules) ? u.modules : [],
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            const res = await apiPatch(`/api/admin/users/${editUser.id}/`, editForm);
            const data = await res.json();
            if (res.ok) {
                setSuccess('User updated successfully.');
                setEditUser(null);
                loadUsers();
            } else { setError(data.error || 'Failed to update user.'); }
        } catch { setError('Network error.'); }
    };


    const getTypeBadge = (u) => {
        if (u.role === 'manager') return { label: 'Manager', color: '#d97706', bg: '#fef3c7' };
        if (u.role === 'admin') return { label: 'Admin', color: 'var(--blue)', bg: 'var(--blue-bg)' };
        if (u.designation === 'Support Staff') return { label: 'Support', color: 'var(--red)', bg: 'var(--red-bg)' };
        if (u.designation === 'Contact Enquiry Staff') return { label: 'Contact', color: 'var(--yellow)', bg: 'var(--yellow-bg)' };
        if (u.designation === 'HR Staff') return { label: 'HR', color: 'var(--purple)', bg: 'var(--purple-bg)' };
        return { label: u.designation || u.role, color: 'var(--accent)', bg: 'var(--accent-light)' };
    };

    const getPlatformLabel = (u) => {
        if (u.role === 'admin') return u.platform?.toUpperCase() || '--';
        if (u.role === 'manager') return 'All';
        if (u.department_name) return u.department_name.replace('Support - ', '').replace('Contact - ', '').replace('HR - ', '');
        return '--';
    };

    const filteredUsers = users.filter(u => {
        if (!filterType) return true;
        if (filterType === 'admin') return u.role === 'admin';
        if (filterType === 'manager') return u.role === 'manager';
        if (filterType === 'support') return u.designation === 'Support Staff';
        if (filterType === 'contact') return u.designation === 'Contact Enquiry Staff';
        if (filterType === 'hr') return u.designation === 'HR Staff';
        if (filterType === 'custom') return u.role === 'staff' && !['Support Staff', 'Contact Enquiry Staff', 'HR Staff'].includes(u.designation);
        return true;
    });

    const needsPlatformSelect = accountType === 'support_staff' || accountType === 'contact_staff';

    if (!user?.is_superuser) {
        return (
            <StaffLayout title="Access Denied">
                <div className="card empty-state"><h3>Admin access required</h3><p>Only super admins can manage users.</p></div>
            </StaffLayout>
        );
    }

    return (
        <StaffLayout title="User Management">
            <Head><title>User Management | Staff Portal</title></Head>

            {success && <div className="alert success" style={{ marginBottom: '16px' }}>{success}</div>}
            
            {existingUserData ? (
                <div style={{
                    padding: '16px 20px', borderRadius: '10px', marginBottom: '18px',
                    background: '#fffbeb', border: '1px solid #fef3c7', color: '#92400e',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                }}>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg>
                                Existing User Detected
                            </span>
                            <span className="badge" style={{ background: '#fde68a', color: '#854d0e', fontSize: '0.75rem' }}>
                                {existingUserData.role_display}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.84rem', color: '#b45309', lineHeight: 1.4 }}>
                            An account with email <strong>{existingUserData.email}</strong> is currently registered as a {existingUserData.role_display}.
                            Would you like to upgrade this account to <strong>{ACCOUNT_TYPES.find(t => t.key === accountType)?.label || 'Staff'}</strong> and grant the selected department & module permissions?
                        </div>
                    </div>
                    <button
                        type="button"
                        className="btn primary"
                        disabled={submitting}
                        onClick={() => handleSubmit(null, true)}
                        style={{ padding: '9px 22px', fontSize: '0.88rem', whiteSpace: 'nowrap', background: '#d97706', borderColor: '#b45309' }}
                    >
                        {submitting ? 'Upgrading...' : `Upgrade to ${ACCOUNT_TYPES.find(t => t.key === accountType)?.label || 'Staff'} Now`}
                    </button>
                </div>
            ) : error ? (
                <div className="alert error" style={{ marginBottom: '16px' }}>{error}</div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                        { key: '', label: `All (${users.length})` },
                        { key: 'admin', label: 'Admins' },
                        { key: 'manager', label: 'Managers' },
                        { key: 'support', label: 'Support' },
                        { key: 'contact', label: 'Contact' },
                        { key: 'hr', label: 'HR' },
                        { key: 'custom', label: 'Custom' },
                    ].map(f => (
                        <button key={f.key} className={`btn ${filterType === f.key ? 'primary' : ''}`}
                            onClick={() => setFilterType(f.key)}
                            style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
                            {f.label}
                        </button>
                    ))}
                </div>
                <button className="btn primary" onClick={() => setShowForm(!showForm)}
                    style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                    {showForm ? 'Cancel' : '+ Create Account'}
                </button>
            </div>

            {/* Create Account Form */}
            {showForm && (
                <div className="card" style={{ marginBottom: '24px', maxWidth: '780px', borderTop: '3px solid var(--accent)' }}>
                    <h3 style={{ margin: '0 0 16px' }}>Create Account</h3>

                    {/* Account Type Selector */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                        {ACCOUNT_TYPES.map(t => (
                            <button key={t.key} type="button" onClick={() => setAccountType(t.key)}
                                style={{
                                    padding: '12px 10px', borderRadius: '12px', cursor: 'pointer',
                                    border: accountType === t.key ? '2px solid var(--accent)' : '1px solid var(--border)',
                                    background: accountType === t.key ? 'var(--accent-light)' : 'transparent',
                                    textAlign: 'left', transition: 'all 0.2s', fontFamily: 'inherit',
                                }}>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: accountType === t.key ? 'var(--accent-dark)' : 'var(--text-primary)', marginBottom: '2px' }}>
                                    {t.label}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>{t.desc}</div>
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Platform for Admin */}
                        {accountType === 'platform_admin' && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Platform</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {PLATFORMS.map(p => (
                                        <button key={p.key} type="button" onClick={() => setForm({ ...form, platform: p.key })}
                                            className="btn" style={{
                                                background: form.platform === p.key ? 'var(--accent-light)' : 'transparent',
                                                color: form.platform === p.key ? 'var(--accent-dark)' : 'var(--text-secondary)',
                                                borderColor: form.platform === p.key ? 'var(--accent)' : 'var(--border)',
                                                padding: '8px 20px', fontSize: '0.85rem',
                                            }}>
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Assigned Platforms for Support / Contact */}
                        {needsPlatformSelect && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Assigned Platform(s)</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {PLATFORMS.map(p => (
                                        <button key={p.key} type="button" onClick={() => togglePlatform(p.key)}
                                            className="btn" style={{
                                                background: form.assigned_platforms.includes(p.key) ? 'var(--accent-light)' : 'transparent',
                                                color: form.assigned_platforms.includes(p.key) ? 'var(--accent-dark)' : 'var(--text-secondary)',
                                                borderColor: form.assigned_platforms.includes(p.key) ? 'var(--accent)' : 'var(--border)',
                                                padding: '8px 20px', fontSize: '0.85rem',
                                            }}>
                                            {p.label} {form.assigned_platforms.includes(p.key) ? (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginLeft: '4px' }}><polyline points="20 6 9 17 4 12"/></svg>
                                            ) : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* HR note */}
                        {accountType === 'hr_staff' && (
                            <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--purple-bg)', color: 'var(--purple)', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 500 }}>
                                This user will be auto-assigned to Careers & Classes modules for reviewing applications and onboarding.
                            </div>
                        )}

                        {/* Manager note */}
                        {accountType === 'manager' && (
                            <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 500 }}>
                                Managers can view all staff, assign tasks, and manage payroll. They cannot create accounts.
                            </div>
                        )}

                        {/* Custom Staff Fields: Department, Designation, Modules */}
                        {accountType === 'custom_staff' && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Department Name</label>
                                        <input className="input" name="department_name" placeholder="e.g. Marketing"
                                            value={form.department_name} onChange={handleChange}
                                            style={{ padding: '10px 14px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Designation</label>
                                        <input className="input" name="designation" placeholder="e.g. Marketing Lead"
                                            value={form.designation} onChange={handleChange}
                                            style={{ padding: '10px 14px' }} />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Module Access</label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {ALL_MODULES.map(m => (
                                            <button key={m.key} type="button" onClick={() => toggleModule(m.key)}
                                                className="btn" style={{
                                                    background: form.modules.includes(m.key) ? 'var(--accent-light)' : 'transparent',
                                                    color: form.modules.includes(m.key) ? 'var(--accent-dark)' : 'var(--text-secondary)',
                                                    borderColor: form.modules.includes(m.key) ? 'var(--accent)' : 'var(--border)',
                                                    padding: '6px 14px', fontSize: '0.82rem',
                                                }}>
                                                {m.label} {form.modules.includes(m.key) ? (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginLeft: '4px' }}><polyline points="20 6 9 17 4 12"/></svg>
                                                ) : ''}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Name, Email, Password, Phone */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>First Name</label>
                                <input className="input" name="first_name" required value={form.first_name} onChange={handleChange} style={{ padding: '10px 14px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Last Name</label>
                                <input className="input" name="last_name" required value={form.last_name} onChange={handleChange} style={{ padding: '10px 14px' }} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Email *</label>
                                <input className="input" type="email" name="email" required value={form.email} onChange={handleChange} style={{ padding: '10px 14px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                                    Password (Optional)
                                </label>
                                <input
                                    className="input"
                                    type="text"
                                    name="password"
                                    placeholder="Leave blank to auto-generate & email"
                                    value={form.password}
                                    onChange={handleChange}
                                    style={{ padding: '10px 14px' }}
                                />
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--accent-dark)', marginTop: '4px' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    System auto-generates secure password and emails credentials
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Phone</label>
                                <input className="input" name="phone_number" value={form.phone_number} onChange={handleChange} style={{ padding: '10px 14px' }} />
                            </div>
                            <div style={{ paddingTop: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                                    <input
                                        type="checkbox"
                                        name="upgrade_existing"
                                        checked={form.upgrade_existing}
                                        onChange={handleChange}
                                        style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                                    />
                                    Upgrade account if email exists (e.g. convert Student to Staff)
                                </label>
                            </div>
                        </div>

                        <button type="submit" className="btn primary" disabled={submitting} style={{ marginTop: '16px', padding: '10px 24px' }}>
                            {submitting ? 'Processing...' : 'Create / Upgrade Account'}
                        </button>
                    </form>
                </div>
            )}

            {/* User Directory Table */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
            ) : filteredUsers.length > 0 ? (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr><th>Name</th><th>Type</th><th>Platform / Department</th><th>Email</th><th>Joined</th><th></th></tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => {
                                const badge = getTypeBadge(u);
                                return (
                                    <tr key={u.id}>
                                        <td><strong>{u.first_name} {u.last_name}</strong></td>
                                        <td><span className="badge" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span></td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{getPlatformLabel(u)}</div>
                                            {Array.isArray(u.modules) && u.modules.length > 0 && (
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                    {u.modules.map(m => (
                                                        <span key={m} className="badge" style={{
                                                            fontSize: '0.68rem', padding: '1px 6px',
                                                            background: m === 'support' ? 'var(--red-bg)' : m === 'careers' ? 'var(--purple-bg)' : m === 'classes' ? 'var(--green-bg)' : m === 'gate_content' ? 'var(--blue-bg)' : 'var(--yellow-bg)',
                                                            color: m === 'support' ? 'var(--red)' : m === 'careers' ? 'var(--purple)' : m === 'classes' ? 'var(--green)' : m === 'gate_content' ? 'var(--blue)' : 'var(--yellow)'
                                                        }}>
                                                            {m === 'gate_content' ? 'GATE' : m.toUpperCase()}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{u.email}</td>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{new Date(u.date_joined).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn" onClick={() => openEditModal(u)}
                                                    style={{ padding: '4px 12px', fontSize: '0.78rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                                    Edit
                                                </button>
                                                <button className="btn" onClick={() => handleDelete(u.id, u.email)}
                                                    style={{ padding: '4px 12px', fontSize: '0.78rem', color: 'var(--red)' }}>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card empty-state"><h3>No users found</h3><p>Create an account above or adjust filters.</p></div>
            )}

            {/* Edit User Modal */}
            {editUser && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)',
                }} onClick={() => setEditUser(null)}>
                    <div className="card" style={{
                        width: '100%', maxWidth: '580px', margin: '20px', maxHeight: '90vh', overflowY: 'auto',
                        animation: 'fadeIn 0.2s ease',
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 className="section-title" style={{ marginBottom: '20px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign:'middle',marginRight:'8px'}}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Edit User - {editUser.email}
                            </span>
                        </h3>
                        <form onSubmit={handleEditSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>First Name</label>
                                    <input className="input" required value={editForm.first_name}
                                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Last Name</label>
                                    <input className="input" required value={editForm.last_name}
                                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Email</label>
                                    <input className="input" type="email" required value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Phone</label>
                                    <input className="input" type="tel" value={editForm.phone_number}
                                        onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Department Name</label>
                                    <input className="input" value={editForm.department_name}
                                        placeholder="e.g. Technical"
                                        onChange={(e) => setEditForm({ ...editForm, department_name: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Designation</label>
                                    <input className="input" value={editForm.designation}
                                        placeholder="e.g. Tech Lead"
                                        onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })} />
                                </div>
                            </div>

                            {/* Module Permissions in Edit Modal */}
                            <div style={{ marginTop: '16px' }}>
                                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px' }}>Module Access Permissions</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {ALL_MODULES.map(m => (
                                        <button
                                            key={m.key}
                                            type="button"
                                            onClick={() => toggleEditModule(m.key)}
                                            className="btn"
                                            style={{
                                                background: (editForm.modules || []).includes(m.key) ? 'var(--accent-light)' : 'transparent',
                                                color: (editForm.modules || []).includes(m.key) ? 'var(--accent-dark)' : 'var(--text-secondary)',
                                                borderColor: (editForm.modules || []).includes(m.key) ? 'var(--accent)' : 'var(--border)',
                                                padding: '6px 14px', fontSize: '0.82rem',
                                            }}
                                        >
                                            {m.label} {(editForm.modules || []).includes(m.key) ? (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginLeft: '4px' }}><polyline points="20 6 9 17 4 12"/></svg>
                                            ) : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" style={{ padding: '8px 20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                                    onClick={() => setEditUser(null)}>Cancel</button>
                                <button type="submit" className="btn primary" style={{ padding: '8px 24px' }}>Save Changes</button>
                            </div>
                        </form>
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

export default withStaffAuth(AdminUsers);
