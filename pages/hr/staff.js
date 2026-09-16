import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../../lib/auth';
import { apiGet } from '../../lib/api';
import StaffLayout from '../../components/StaffLayout';

function HRStaff() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => { loadStaff(); }, [roleFilter, search]);

    const loadStaff = async () => {
        try {
            let url = '/api/staff/manager/staff/?';
            if (roleFilter) url += `role=${roleFilter}&`;
            if (search) url += `search=${encodeURIComponent(search)}&`;
            setStaff(await apiGet(url));
        } catch { }
        finally { setLoading(false); }
    };

    const roleBadgeStyle = (role) => {
        const colors = {
            staff: { bg: 'var(--accent-light)', color: 'var(--accent)' },
            manager: { bg: '#fef3c7', color: '#d97706' },
            teacher: { bg: 'var(--green-bg)', color: 'var(--green)' },
            mentor: { bg: '#ede9fe', color: '#7c3aed' },
        };
        return colors[role] || { bg: 'var(--bg-secondary)', color: 'var(--text-secondary)' };
    };

    return (
        <StaffLayout title="All Staff">
            <Head><title>Staff Management | Staff Portal</title></Head>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input type="text" placeholder="Search by name or email..." className="input"
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ flex: 1, minWidth: '200px', padding: '8px 14px', fontSize: '0.88rem' }} />
                <select className="input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                    style={{ padding: '8px 14px', fontSize: '0.88rem', minWidth: '140px' }}>
                    <option value="">All Roles</option>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="teacher">Teacher</option>
                    <option value="mentor">Mentor</option>
                </select>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {staff.length} member{staff.length !== 1 ? 's' : ''} found
            </p>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
            ) : staff.length > 0 ? (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Modules</th>
                                <th>Tasks</th>
                                <th>Wallet</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map(s => (
                                <tr key={s.id}>
                                    <td><strong>{s.full_name}</strong></td>
                                    <td style={{ fontSize: '0.85rem' }}>{s.email}</td>
                                    <td>
                                        <span className="badge" style={roleBadgeStyle(s.role)}>
                                            {s.role}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.department_name || s.designation || '--'}</td>
                                    <td>
                                        {Array.isArray(s.modules) && s.modules.length > 0 ? (
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '200px' }}>
                                                {s.modules.map(m => (
                                                    <span key={m} className="badge" style={{
                                                        fontSize: '0.7rem', padding: '2px 6px',
                                                        background: m === 'support' ? 'var(--red-bg)' : m === 'careers' ? 'var(--purple-bg)' : m === 'classes' ? 'var(--green-bg)' : m === 'gate_content' ? 'var(--blue-bg)' : 'var(--yellow-bg)',
                                                        color: m === 'support' ? 'var(--red)' : m === 'careers' ? 'var(--purple)' : m === 'classes' ? 'var(--green)' : m === 'gate_content' ? 'var(--blue)' : 'var(--yellow)'
                                                    }}>
                                                        {m === 'gate_content' ? 'GATE' : m.toUpperCase()}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>--</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{s.task_count}</td>
                                    <td style={{ fontWeight: 600 }}>₹{s.wallet_balance}</td>
                                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{new Date(s.date_joined).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card empty-state"><h3>No staff found</h3></div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(HRStaff);
