import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { withStaffAuth, useAuth } from '../../lib/auth';
import { apiGet } from '../../lib/api';
import StaffLayout from '../../components/StaffLayout';

function OmniDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchOmniData = () => {
        setLoading(true);
        setError('');
        apiGet('/api/admin/omni-dashboard/')
            .then(res => setData(res))
            .catch(err => {
                console.error(err);
                setError('Failed to fetch omni-platform metrics. Ensure you are signed in as a super admin.');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchOmniData();
    }, []);

    if (!user?.is_superuser) {
        return (
            <StaffLayout title="Omni Command Center">
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--red)', marginBottom: '8px' }}>Access Restricted</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>The Omni Command Center is restricted to Super Administrators.</p>
                </div>
            </StaffLayout>
        );
    }

    const classes = data?.classes || {};
    const gate = data?.gate || {};
    const staff = data?.staff || {};
    const support = data?.support || {};
    const careers = data?.careers || {};
    const users = data?.users || {};

    return (
        <StaffLayout title="Super Admin // Omni Command Center">
            <Head>
                <title>Omni Command Center | Produit Super Admin</title>
            </Head>

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header Bar */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '24px', flexWrap: 'wrap', gap: '14px'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                                background: '#10b981', width: '8px', height: '8px',
                                borderRadius: '50%', boxShadow: '0 0 8px #10b981'
                            }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Unified Real-Time Network
                            </span>
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0' }}>
                            Global Cross-Platform Telemetry
                        </h2>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            Last Sync: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Just now'}
                        </span>
                        <button
                            onClick={fetchOmniData}
                            disabled={loading}
                            className="glass-btn"
                            style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 700 }}
                        >
                            {loading ? 'Refreshing...' : '↻ Refresh Stream'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{
                        padding: '14px 20px', background: 'var(--red-bg)',
                        border: '1px solid var(--red)', color: 'var(--red)',
                        borderRadius: '12px', marginBottom: '24px', fontWeight: 600
                    }}>
                        {error}
                    </div>
                )}

                {loading && !data ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Establishing cross-platform telemetry...</p>
                    </div>
                ) : (
                    <>
                        {/* Executive KPIs */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: '16px', marginBottom: '28px'
                        }}>
                            <div className="glass-card" style={{ padding: '22px', borderLeft: '4px solid #3b82f6' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Total Ecosystem Users
                                </span>
                                <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0 0', color: 'var(--text-primary)' }}>
                                    {users.total_users || 0}
                                </h3>
                                <span style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: 600 }}>
                                    {users.active_users || 0} Active accounts
                                </span>
                            </div>

                            <div className="glass-card" style={{ padding: '22px', borderLeft: '4px solid #10b981' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Classes Confirmed Revenue
                                </span>
                                <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0 0', color: '#047857' }}>
                                    ₹{(classes.total_revenue || 0).toLocaleString('en-IN')}
                                </h3>
                                <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                                    {classes.confirmed_bookings || 0} Confirmed bookings
                                </span>
                            </div>

                            <div className="glass-card" style={{ padding: '22px', borderLeft: '4px solid #8b5cf6' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Staff Operations & Payroll
                                </span>
                                <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0 0', color: '#6d28d9' }}>
                                    ₹{(staff.total_payroll_earned || 0).toLocaleString('en-IN')}
                                </h3>
                                <span style={{ fontSize: '0.78rem', color: '#8b5cf6', fontWeight: 600 }}>
                                    ₹{(staff.total_payroll_paid || 0).toLocaleString('en-IN')} Paid out
                                </span>
                            </div>

                            <div className="glass-card" style={{ padding: '22px', borderLeft: '4px solid #f59e0b' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Pending Attention
                                </span>
                                <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0 0', color: '#d97706' }}>
                                    {(support.pending_complaints || 0) + (support.pending_inquiries || 0) + (staff.tasks_in_review || 0)}
                                </h3>
                                <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>
                                    {staff.tasks_in_review || 0} Tasks &middot; {support.pending_complaints || 0} Complaints
                                </span>
                            </div>
                        </div>

                        {/* PLATFORMS GRID */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                            {/* 1. PRODUIT CLASSES PLATFORM */}
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%' }} />
                                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Produit Classes</h3>
                                    </div>
                                    <button
                                        onClick={() => window.open('http://localhost:3000/admin/dashboard', '_blank')}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                                    >
                                        Open Portal ↗
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Courses / Active</span>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                                            {classes.total_courses || 0} <span style={{ fontSize: '0.85rem', color: '#10b981' }}>({classes.active_courses || 0} Live)</span>
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Faculty / Approved</span>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                                            {classes.total_teachers || 0} <span style={{ fontSize: '0.85rem', color: '#10b981' }}>({classes.approved_teachers || 0} Ready)</span>
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Enrolled Students</span>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                                            {classes.total_students || 0}
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Classes This Month</span>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                                            {classes.sessions_month || 0}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '0.82rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Awaiting Outcome Confirmation:</span>
                                    <strong style={{ color: classes.live_or_needs_review > 0 ? '#d97706' : '#10b981' }}>
                                        {classes.live_or_needs_review || 0} Sessions
                                    </strong>
                                </div>
                            </div>

                            {/* 2. PRODUIT GATE PLATFORM */}
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '50%' }} />
                                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Produit GATE</h3>
                                    </div>
                                    <span className="telemetry-chip" style={{ fontSize: '0.7rem' }}>GATE Prep Hub</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>GATE Aspirants</span>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                                            {gate.total_students || 0}
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Mock Tests Taken</span>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                                            {gate.total_tests_taken || 0}
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Questions Bank</span>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                                            {gate.total_questions || 0}
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Study Notes</span>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                                            {gate.total_materials || 0}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '0.82rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Pending Course Inquiries:</span>
                                    <strong style={{ color: gate.pending_requests > 0 ? '#d97706' : '#10b981' }}>
                                        {gate.pending_requests || 0} Requests
                                    </strong>
                                </div>
                            </div>

                            {/* 3. STAFF & HR OPERATIONS */}
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '10px', height: '10px', background: '#8b5cf6', borderRadius: '50%' }} />
                                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Staff & HR Operations</h3>
                                    </div>
                                    <button
                                        onClick={() => router.push('/hr/tasks')}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                                    >
                                        Tasks Hub ↗
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Staff & Managers</span>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                                            {staff.total_staff || 0} <span style={{ fontSize: '0.85rem', color: '#8b5cf6' }}>({staff.total_managers || 0} Mgrs)</span>
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tasks In Review</span>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
                                            {staff.tasks_in_review || 0}
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tasks Completed</span>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857', marginTop: '2px' }}>
                                            {staff.tasks_completed || 0}
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Awaiting Payment</span>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                                            {staff.payments_awaiting_approval || 0}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '0.82rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Total Tasks Tracked:</span>
                                    <strong>{staff.total_tasks || 0} Assigned</strong>
                                </div>
                            </div>

                            {/* 4. SUPPORT, CAREERS & INQUIRIES */}
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '10px', height: '10px', background: '#f59e0b', borderRadius: '50%' }} />
                                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Support & Careers</h3>
                                    </div>
                                    <button
                                        onClick={() => router.push('/complaints')}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                                    >
                                        Tickets ↗
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Complaints Pending</span>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: support.pending_complaints > 0 ? '#dc2626' : '#10b981', marginTop: '2px' }}>
                                            {support.pending_complaints || 0}
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Complaints Resolved</span>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857', marginTop: '2px' }}>
                                            {support.resolved_complaints || 0}
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Contact Inquiries</span>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                                            {support.pending_inquiries || 0} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Pending</span>
                                        </div>
                                    </div>
                                    <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Job Applications</span>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                                            {careers.total_applications || 0} <span style={{ fontSize: '0.8rem', color: '#d97706' }}>({careers.pending_applications || 0} New)</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '0.82rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Support Resolution Rate:</span>
                                    <strong style={{ color: '#047857' }}>
                                        {support.resolved_complaints + support.pending_complaints > 0
                                            ? Math.round((support.resolved_complaints / (support.resolved_complaints + support.pending_complaints)) * 100)
                                            : 100}%
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* USER DIRECTORY DISTRIBUTION */}
                        <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                                        Global Identity Breakdown
                                    </h3>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                                        Users across all Produit Academy ecosystem nodes
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push('/admin/users')}
                                    className="glass-btn primary"
                                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                                >
                                    Manage All Users ↗
                                </button>
                            </div>

                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                gap: '14px', textAlign: 'center'
                            }}>
                                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '10px' }}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6' }}>{users.students || 0}</div>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Students</span>
                                </div>
                                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '10px' }}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{users.teachers || 0}</div>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Teachers</span>
                                </div>
                                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '10px' }}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b5cf6' }}>{users.staff || 0}</div>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Staff</span>
                                </div>
                                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '10px' }}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>{users.managers || 0}</div>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Managers</span>
                                </div>
                                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '10px' }}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{users.admins || 0}</div>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Admins</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </StaffLayout>
    );
}

export default withStaffAuth(OmniDashboard, ['admin', 'manager', 'staff']);
