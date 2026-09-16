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
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'classes' | 'gate' | 'staff' | 'support' | 'users' | 'diagnostics'

    const fetchOmniData = () => {
        setLoading(true);
        setError(null);
        apiGet('/api/admin/omni-dashboard/')
            .then(res => {
                setData(res);
            })
            .catch(err => {
                console.error('Omni Dashboard fetch error:', err);
                setError({
                    message: err?.message || 'Failed to connect to Omni Dashboard API.',
                    status: err?.status || (err?.message?.includes('500') ? 500 : (err?.message?.includes('403') ? 403 : 'Network Error')),
                    detail: err?.detail || 'The server encountered an error while aggregating cross-platform metrics.'
                });
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchOmniData();
    }, []);

    // Super admin or admin role allowed
    const isAuthorized = user?.is_superuser || user?.role === 'admin';

    if (!isAuthorized) {
        return (
            <StaffLayout title="Omni Command Center">
                <div className="card" style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2',
                        color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', margin: '0 auto 16px', fontWeight: 800
                    }}>
                        ✕
                    </div>
                    <h3 style={{ color: 'var(--red)', marginBottom: '8px' }}>Access Restricted</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                        The Omni Command Center is restricted to Administrators and Super Administrators.
                    </p>
                    <button className="btn primary" onClick={() => router.push('/dashboard')}>
                        Return to Dashboard
                    </button>
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
    const systemHealth = data?.system_health || {};
    const subsystemErrors = data?.subsystem_errors || {};
    const hasDegradedSubsystems = Object.keys(subsystemErrors).length > 0;

    return (
        <StaffLayout title="Super Admin // Omni Command Center">
            <Head>
                <title>Omni Command Center | Produit Super Admin</title>
            </Head>

            <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '40px' }}>
                {/* Top Control Bar */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '20px', flexWrap: 'wrap', gap: '14px',
                    background: 'var(--bg-secondary)', padding: '16px 20px', borderRadius: '12px',
                    border: '1px solid var(--border)'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                                background: error ? '#ef4444' : hasDegradedSubsystems ? '#f59e0b' : '#10b981',
                                width: '10px', height: '10px', borderRadius: '50%',
                                boxShadow: error ? '0 0 8px #ef4444' : hasDegradedSubsystems ? '0 0 8px #f59e0b' : '0 0 8px #10b981'
                            }} />
                            <span style={{
                                fontSize: '0.8rem', fontWeight: 800,
                                color: error ? '#dc2626' : hasDegradedSubsystems ? '#d97706' : '#047857',
                                textTransform: 'uppercase', letterSpacing: '0.08em'
                            }}>
                                {error ? 'Telemetry Link Severed' : hasDegradedSubsystems ? 'Degraded Subsystem(s)' : 'Unified Real-Time Network (Online)'}
                            </span>
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0' }}>
                            Cross-Platform Omni Command Center
                        </h2>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {data?.latency_ms !== undefined && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--bg)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                Latency: <strong>{data.latency_ms} ms</strong>
                            </span>
                        )}
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            Sync: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Pending'}
                        </span>
                        <button
                            onClick={fetchOmniData}
                            disabled={loading}
                            className="btn primary"
                            style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 700 }}
                        >
                            {loading ? 'Refreshing...' : '↻ Refresh Stream'}
                        </button>
                    </div>
                </div>

                {/* API / Network Error Banner */}
                {error && (
                    <div className="card" style={{
                        padding: '24px', background: '#fef2f2', border: '1px solid #fecaca',
                        borderRadius: '12px', marginBottom: '24px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%', background: '#fee2e2',
                                color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.2rem', fontWeight: 800, flexShrink: 0
                            }}>
                                !
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 6px', color: '#991b1b', fontSize: '1.1rem' }}>
                                    API Telemetry Error: Status {error.status}
                                </h3>
                                <p style={{ color: '#b91c1c', fontSize: '0.88rem', margin: '0 0 12px' }}>
                                    {error.message}
                                </p>
                                <div style={{ fontSize: '0.82rem', color: '#7f1d1d', background: '#fee2e2', padding: '10px 12px', borderRadius: '6px', marginBottom: '14px', fontFamily: 'monospace' }}>
                                    Endpoint: <code>/api/admin/omni-dashboard/</code> &middot; Error: {error.detail}
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={fetchOmniData}
                                        className="btn primary"
                                        style={{ background: '#dc2626', borderColor: '#dc2626', padding: '6px 14px', fontSize: '0.82rem' }}>
                                        ↻ Retry Stream Connection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Degraded Subsystem Warning Banner */}
                {!error && hasDegradedSubsystems && (
                    <div className="card" style={{
                        padding: '16px 20px', background: '#fffbeb', border: '1px solid #fde68a',
                        borderRadius: '10px', marginBottom: '24px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                            <div style={{ flex: 1 }}>
                                <strong style={{ color: '#92400e', fontSize: '0.9rem' }}>
                                    Subsystem Warning Detected
                                </strong>
                                <div style={{ fontSize: '0.82rem', color: '#b45309', marginTop: '2px' }}>
                                    The following platform(s) experienced issues during aggregation:
                                    {Object.entries(subsystemErrors).map(([k, v]) => (
                                        <div key={k} style={{ fontFamily: 'monospace', marginTop: '2px' }}>
                                            &bull; <strong>{k.toUpperCase()}</strong>: {v}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={fetchOmniData}
                                className="btn"
                                style={{ fontSize: '0.78rem', padding: '4px 12px', background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}>
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* Subsystem Health Bar */}
                {!error && data && (
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '10px', marginBottom: '24px'
                    }}>
                        {[
                            { key: 'database', label: 'Neon DB', icon: '🗄️' },
                            { key: 'classes', label: 'Classes App', icon: '🎓' },
                            { key: 'gate', label: 'GATE Prep', icon: '📚' },
                            { key: 'staff', label: 'Staff & HR', icon: '💼' },
                            { key: 'support', label: 'Support Desk', icon: '🎧' },
                            { key: 'careers', label: 'Careers App', icon: '📝' },
                            { key: 'users', label: 'Auth & Users', icon: '👥' },
                        ].map(s => {
                            const status = systemHealth[s.key] || 'operational';
                            const isOperational = status === 'operational';
                            return (
                                <div key={s.key} style={{
                                    background: 'var(--card-bg)', border: '1px solid var(--border)',
                                    borderRadius: '8px', padding: '10px 14px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.label}</span>
                                    </div>
                                    <span style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: isOperational ? '#10b981' : '#ef4444',
                                        boxShadow: isOperational ? '0 0 6px #10b981' : '0 0 6px #ef4444'
                                    }} title={isOperational ? 'Operational' : 'Degraded'} />
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Navigation Drilldown Tabs */}
                <div style={{
                    display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto',
                    paddingBottom: '4px', borderBottom: '1px solid var(--border)'
                }}>
                    {[
                        { id: 'overview', label: '🌐 All Overview' },
                        { id: 'classes', label: '🎓 Classes Telemetry' },
                        { id: 'gate', label: '📚 GATE Telemetry' },
                        { id: 'staff', label: '💼 Staff & Payroll' },
                        { id: 'support', label: '🎧 Support & Careers' },
                        { id: 'users', label: '👥 Global Directory' },
                        { id: 'diagnostics', label: '⚙️ Diagnostics & Errors' },
                    ].map(t => (
                        <button
                            key={t.id}
                            className="btn"
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                fontSize: '0.85rem', padding: '8px 16px', borderRadius: '8px 8px 0 0',
                                borderBottom: activeTab === t.id ? '3px solid var(--accent)' : '3px solid transparent',
                                background: activeTab === t.id ? 'var(--card-bg)' : 'transparent',
                                fontWeight: activeTab === t.id ? 700 : 500,
                                color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)'
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content Loader */}
                {loading && !data ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div className="spinner" style={{ margin: '0 auto 16px', width: '36px', height: '36px' }} />
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Gathering cross-platform telemetry...</p>
                    </div>
                ) : !data ? (
                    <div className="card empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <h3>No Telemetry Data</h3>
                        <p>Click "Refresh Stream" above to connect to the backend.</p>
                    </div>
                ) : (
                    <>
                        {/* TAB 1: OVERVIEW */}
                        {activeTab === 'overview' && (
                            <div>
                                {/* Executive KPIs */}
                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                    gap: '16px', marginBottom: '24px'
                                }}>
                                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                            Total Ecosystem Users
                                        </span>
                                        <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0 0', color: 'var(--text-primary)' }}>
                                            {users.total_users || 0}
                                        </h3>
                                        <span style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: 600 }}>
                                            {users.active_users || 0} Active accounts &middot; {users.verified_users || 0} Verified
                                        </span>
                                    </div>

                                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                            Classes Advance Revenue
                                        </span>
                                        <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0 0', color: '#047857' }}>
                                            ₹{(classes.total_revenue || 0).toLocaleString('en-IN')}
                                        </h3>
                                        <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                                            {classes.confirmed_bookings || 0} Confirmed / {classes.total_bookings || 0} Total Bookings
                                        </span>
                                    </div>

                                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                            Staff & Teacher Payroll
                                        </span>
                                        <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0 0', color: '#6d28d9' }}>
                                            ₹{(staff.total_payroll_earned || 0).toLocaleString('en-IN')}
                                        </h3>
                                        <span style={{ fontSize: '0.78rem', color: '#8b5cf6', fontWeight: 600 }}>
                                            ₹{(staff.total_payroll_paid || 0).toLocaleString('en-IN')} Paid out (₹{(staff.total_payroll_balance || 0).toLocaleString('en-IN')} Pending)
                                        </span>
                                    </div>

                                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                            Action Queue
                                        </span>
                                        <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: '6px 0 0', color: '#d97706' }}>
                                            {(classes.needs_review_sessions || 0) + (staff.tasks_in_review || 0) + (support.pending_complaints || 0) + (careers.pending_applications || 0)}
                                        </h3>
                                        <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>
                                            {classes.needs_review_sessions || 0} Classes &middot; {staff.tasks_in_review || 0} Tasks &middot; {support.pending_complaints || 0} Complaints
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Shortcuts */}
                                <div style={{
                                    display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap'
                                }}>
                                    <button className="btn" onClick={() => router.push('/hr/payroll')}
                                        style={{ fontSize: '0.82rem', padding: '8px 16px', background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>💰</span> Open Payroll Center
                                    </button>
                                    <button className="btn" onClick={() => router.push('/hr/tasks')}
                                        style={{ fontSize: '0.82rem', padding: '8px 16px', background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>📋</span> Review Submitted Tasks ({staff.tasks_in_review || 0})
                                    </button>
                                    <button className="btn" onClick={() => router.push('/classes/onboard')}
                                        style={{ fontSize: '0.82rem', padding: '8px 16px', background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>👨‍🏫</span> Onboard & Approve Teachers
                                    </button>
                                    <button className="btn" onClick={() => router.push('/admin/users')}
                                        style={{ fontSize: '0.82rem', padding: '8px 16px', background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>👥</span> Manage All Users
                                    </button>
                                </div>

                                {/* Platform Summary Cards */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
                                    {/* Classes Platform */}
                                    <div className="card" style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%' }} />
                                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Produit Classes Platform</h3>
                                            </div>
                                            <button className="btn" onClick={() => setActiveTab('classes')} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                                                Deep Dive ➔
                                            </button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>COURSES</div>
                                                <strong style={{ fontSize: '1.1rem' }}>{classes.total_courses || 0}</strong> ({classes.active_courses || 0} Active)
                                            </div>
                                            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>TEACHERS</div>
                                                <strong style={{ fontSize: '1.1rem' }}>{classes.total_teachers || 0}</strong> ({classes.approved_teachers || 0} Approved)
                                            </div>
                                            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>STUDENTS</div>
                                                <strong style={{ fontSize: '1.1rem' }}>{classes.total_students || 0}</strong>
                                            </div>
                                            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>NEEDS REVIEW</div>
                                                <strong style={{ fontSize: '1.1rem', color: (classes.needs_review_sessions || 0) > 0 ? '#dc2626' : 'var(--text-primary)' }}>
                                                    {classes.needs_review_sessions || 0} Sessions
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* GATE Platform */}
                                    <div className="card" style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '50%' }} />
                                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Produit GATE Platform</h3>
                                            </div>
                                            <button className="btn" onClick={() => setActiveTab('gate')} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                                                Deep Dive ➔
                                            </button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>GATE STUDENTS</div>
                                                <strong style={{ fontSize: '1.1rem' }}>{gate.total_students || 0}</strong>
                                            </div>
                                            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>QUESTIONS BANK</div>
                                                <strong style={{ fontSize: '1.1rem' }}>{gate.total_questions || 0}</strong>
                                            </div>
                                            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>MOCK TESTS TAKEN</div>
                                                <strong style={{ fontSize: '1.1rem' }}>{gate.total_tests_taken || 0}</strong>
                                            </div>
                                            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>PENDING REQUESTS</div>
                                                <strong style={{ fontSize: '1.1rem', color: (gate.pending_requests || 0) > 0 ? '#d97706' : 'var(--text-primary)' }}>
                                                    {gate.pending_requests || 0} Requests
                                                </strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Staff Operations */}
                                    <div className="card" style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '10px', height: '10px', background: '#8b5cf6', borderRadius: '50%' }} />
                                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Staff & HR Operations</h3>
                                            </div>
                                            <button className="btn" onClick={() => setActiveTab('staff')} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                                                Deep Dive ➔
                                            </button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>STAFF & MANAGERS</div>
                                                <strong style={{ fontSize: '1.1rem' }}>{staff.total_staff || 0}</strong> ({staff.total_managers || 0} Mgrs)
                                            </div>
                                            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>TASKS IN REVIEW</div>
                                                <strong style={{ fontSize: '1.1rem', color: (staff.tasks_in_review || 0) > 0 ? '#d97706' : 'var(--text-primary)' }}>
                                                    {staff.tasks_in_review || 0}
                                                </strong>
                                            </div>
                                            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>TOTAL COMPLETED</div>
                                                <strong style={{ fontSize: '1.1rem', color: '#047857' }}>{staff.tasks_completed || 0}</strong>
                                            </div>
                                            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>AWAITING PAY</div>
                                                <strong style={{ fontSize: '1.1rem' }}>{staff.payments_awaiting_approval || 0}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Support & Careers */}
                                    <div className="card" style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '10px', height: '10px', background: '#f59e0b', borderRadius: '50%' }} />
                                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Support & Careers</h3>
                                            </div>
                                            <button className="btn" onClick={() => setActiveTab('support')} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                                                Deep Dive ➔
                                            </button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>PENDING TICKETS</div>
                                                <strong style={{ fontSize: '1.1rem', color: (support.pending_complaints || 0) > 0 ? '#dc2626' : 'var(--text-primary)' }}>
                                                    {support.pending_complaints || 0}
                                                </strong>
                                            </div>
                                            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>RESOLVED TICKETS</div>
                                                <strong style={{ fontSize: '1.1rem', color: '#047857' }}>{support.resolved_complaints || 0}</strong>
                                            </div>
                                            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>INQUIRIES</div>
                                                <strong style={{ fontSize: '1.1rem' }}>{support.total_inquiries || 0}</strong> ({support.pending_inquiries || 0} Open)
                                            </div>
                                            <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>JOB APPS</div>
                                                <strong style={{ fontSize: '1.1rem' }}>{careers.total_applications || 0}</strong> ({careers.pending_applications || 0} Pending)
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: CLASSES TELEMETRY */}
                        {activeTab === 'classes' && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>COURSES (ACTIVE/TOTAL)</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{classes.active_courses || 0} / {classes.total_courses || 0}</div>
                                    </div>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>APPROVED FACULTY</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>{classes.approved_teachers || 0} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>({classes.pending_teachers || 0} Pending)</span></div>
                                    </div>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>BOOKINGS & ADVANCE</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#047857' }}>₹{(classes.total_revenue || 0).toLocaleString('en-IN')}</div>
                                    </div>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SESSIONS THIS MONTH</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{classes.sessions_month || 0} ({classes.completed_sessions || 0} Held)</div>
                                    </div>
                                </div>

                                <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                                    <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>Class Sessions Lifecycle Distribution</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', textAlign: 'center' }}>
                                        <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#3b82f6' }}>{classes.scheduled_sessions || 0}</div>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Scheduled</span>
                                        </div>
                                        <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{classes.live_sessions || 0}</div>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Live / Active</span>
                                        </div>
                                        <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>{classes.completed_sessions || 0}</div>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Completed</span>
                                        </div>
                                        <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#d97706' }}>{classes.needs_review_sessions || 0}</div>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Needs Review</span>
                                        </div>
                                        <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#dc2626' }}>{classes.not_conducted_sessions || 0}</div>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Not Conducted</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card" style={{ padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>Recent Course Bookings Feed</h4>
                                    {(classes.recent_bookings || []).length > 0 ? (
                                        <div className="table-wrapper">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Student</th>
                                                        <th>Course</th>
                                                        <th>Advance</th>
                                                        <th>Booking Status</th>
                                                        <th>Payment</th>
                                                        <th>Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {classes.recent_bookings.map(b => (
                                                        <tr key={b.id}>
                                                            <td><strong>{b.student__email}</strong></td>
                                                            <td>{b.course__name}</td>
                                                            <td style={{ color: '#047857', fontWeight: 700 }}>₹{b.advance_amount}</td>
                                                            <td><span style={{ textTransform: 'capitalize' }}>{b.booking_status}</span></td>
                                                            <td><span style={{ textTransform: 'capitalize' }}>{b.payment_status}</span></td>
                                                            <td style={{ fontSize: '0.78rem' }}>{b.created_at ? new Date(b.created_at).toLocaleDateString() : 'N/A'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No recent bookings found.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: GATE TELEMETRY */}
                        {activeTab === 'gate' && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>GATE ASPIRANTS</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{gate.total_students || 0}</div>
                                    </div>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>QUESTIONS IN REPO</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{gate.total_questions || 0}</div>
                                    </div>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TESTS CONDUCTED</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{gate.total_tests_taken || 0}</div>
                                    </div>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>STUDY MODULES</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{gate.total_materials || 0}</div>
                                    </div>
                                </div>

                                <div className="card" style={{ padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>Recent GATE Course Requests</h4>
                                    {(gate.recent_requests || []).length > 0 ? (
                                        <div className="table-wrapper">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Student</th>
                                                        <th>Branch</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {gate.recent_requests.map(r => (
                                                        <tr key={r.id}>
                                                            <td><strong>{r.student__email}</strong></td>
                                                            <td>{r.branch__name}</td>
                                                            <td>
                                                                <span style={{
                                                                    padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                                                                    background: r.status === 'Approved' ? '#d1fae5' : r.status === 'Pending' ? '#fef3c7' : '#fee2e2',
                                                                    color: r.status === 'Approved' ? '#065f46' : r.status === 'Pending' ? '#92400e' : '#991b1b'
                                                                }}>
                                                                    {r.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No recent course requests.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 4: STAFF & PAYROLL */}
                        {activeTab === 'staff' && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL EARNED (ALL WALLETS)</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>₹{(staff.total_payroll_earned || 0).toFixed(2)}</div>
                                    </div>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL PAID OUT</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626' }}>₹{(staff.total_payroll_paid || 0).toFixed(2)}</div>
                                    </div>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>NET OUTSTANDING BALANCE</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: (staff.total_payroll_balance || 0) > 0 ? '#d97706' : '#059669' }}>
                                            ₹{(staff.total_payroll_balance || 0).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TASKS IN REVIEW</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed' }}>{staff.tasks_in_review || 0}</div>
                                    </div>
                                </div>

                                <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Submitted Tasks Awaiting Manager Review</h4>
                                        <button className="btn" onClick={() => router.push('/hr/tasks')} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                                            Open Review Queue ➔
                                        </button>
                                    </div>
                                    {(staff.recent_review_tasks || []).length > 0 ? (
                                        <div className="table-wrapper">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Task Title</th>
                                                        <th>Assigned Staff</th>
                                                        <th>Time Spent</th>
                                                        <th>Submitted At</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {staff.recent_review_tasks.map(t => (
                                                        <tr key={t.id}>
                                                            <td><strong>{t.title}</strong></td>
                                                            <td>{t.assigned_to__email}</td>
                                                            <td>{t.time_spent_hours} hrs</td>
                                                            <td style={{ fontSize: '0.78rem' }}>{t.submitted_at ? new Date(t.submitted_at).toLocaleDateString() : 'N/A'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No tasks currently in review.</p>
                                    )}
                                </div>

                                <div className="card" style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Recent Wallet Transactions / Direct Payouts</h4>
                                        <button className="btn" onClick={() => router.push('/hr/payroll')} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                                            Open Payroll ➔
                                        </button>
                                    </div>
                                    {(staff.recent_wallet_transactions || []).length > 0 ? (
                                        <div className="table-wrapper">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Staff</th>
                                                        <th>Type</th>
                                                        <th>Amount</th>
                                                        <th>Note</th>
                                                        <th>Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {staff.recent_wallet_transactions.map(tx => (
                                                        <tr key={tx.id}>
                                                            <td><strong>{tx.wallet__staff__email}</strong></td>
                                                            <td>
                                                                <span style={{
                                                                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                                                                    background: tx.type === 'credit' ? '#d1fae5' : '#fee2e2',
                                                                    color: tx.type === 'credit' ? '#065f46' : '#991b1b'
                                                                }}>
                                                                    {tx.type.toUpperCase()}
                                                                </span>
                                                            </td>
                                                            <td style={{ fontWeight: 700, color: tx.type === 'credit' ? '#059669' : '#dc2626' }}>₹{tx.amount}</td>
                                                            <td style={{ fontSize: '0.82rem' }}>{tx.note || 'Direct adjustment'}</td>
                                                            <td style={{ fontSize: '0.78rem' }}>{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'N/A'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No recent wallet transactions.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 5: SUPPORT & CAREERS */}
                        {activeTab === 'support' && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div className="card" style={{ padding: '20px' }}>
                                        <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>Recent Complaints & Support Tickets</h4>
                                        {(support.recent_complaints || []).length > 0 ? (
                                            <div className="table-wrapper">
                                                <table className="table">
                                                    <thead>
                                                        <tr>
                                                            <th>Student</th>
                                                            <th>Subject</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {support.recent_complaints.map(c => (
                                                            <tr key={c.id}>
                                                                <td><strong>{c.student__email}</strong></td>
                                                                <td style={{ fontSize: '0.82rem' }}>{c.subject}</td>
                                                                <td>
                                                                    <span style={{
                                                                        padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                                                                        background: c.status === 'Resolved' ? '#d1fae5' : '#fee2e2',
                                                                        color: c.status === 'Resolved' ? '#065f46' : '#991b1b'
                                                                    }}>
                                                                        {c.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No recent complaints.</p>
                                        )}
                                    </div>

                                    <div className="card" style={{ padding: '20px' }}>
                                        <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>Recent Contact Inquiries</h4>
                                        {(support.recent_inquiries || []).length > 0 ? (
                                            <div className="table-wrapper">
                                                <table className="table">
                                                    <thead>
                                                        <tr>
                                                            <th>Name & Email</th>
                                                            <th>Message / Course</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {support.recent_inquiries.map(inq => (
                                                            <tr key={inq.id}>
                                                                <td>
                                                                    <strong>{inq.name}</strong>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{inq.email}</div>
                                                                </td>
                                                                <td style={{ fontSize: '0.82rem' }}>{inq.message || inq.course}</td>
                                                                <td>
                                                                    <span style={{
                                                                        padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                                                                        background: inq.status === 'Resolved' ? '#d1fae5' : '#fef3c7',
                                                                        color: inq.status === 'Resolved' ? '#065f46' : '#92400e'
                                                                    }}>
                                                                        {inq.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No recent contact inquiries.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="card" style={{ padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>Recent Job Applications (Careers)</h4>
                                    {(careers.recent_applications || []).length > 0 ? (
                                        <div className="table-wrapper">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Candidate</th>
                                                        <th>Position</th>
                                                        <th>Interview Status</th>
                                                        <th>Applied Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {careers.recent_applications.map(app => (
                                                        <tr key={app.id}>
                                                            <td>
                                                                <strong>{app.name}</strong>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{app.email}</div>
                                                            </td>
                                                            <td><strong>{app.position}</strong></td>
                                                            <td>
                                                                <span style={{
                                                                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                                                                    background: app.interviewed ? '#d1fae5' : '#fef3c7',
                                                                    color: app.interviewed ? '#065f46' : '#92400e'
                                                                }}>
                                                                    {app.interviewed ? 'Interviewed' : 'Pending Interview'}
                                                                </span>
                                                            </td>
                                                            <td style={{ fontSize: '0.78rem' }}>{app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No recent applications.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 6: GLOBAL DIRECTORY */}
                        {activeTab === 'users' && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px', textAlign: 'center' }}>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6' }}>{users.role_breakdown?.students || 0}</div>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Students</span>
                                    </div>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{users.role_breakdown?.teachers || 0}</div>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Teachers</span>
                                    </div>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b5cf6' }}>{users.role_breakdown?.staff || 0}</div>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Staff</span>
                                    </div>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>{users.role_breakdown?.managers || 0}</div>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Managers</span>
                                    </div>
                                    <div className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{users.role_breakdown?.admins || 0}</div>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Admins</span>
                                    </div>
                                </div>

                                <div className="card" style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Recent Registered Users (All Platforms)</h4>
                                        <button className="btn" onClick={() => router.push('/admin/users')} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                                            Manage Users ➔
                                        </button>
                                    </div>
                                    {(users.recent_users || []).length > 0 ? (
                                        <div className="table-wrapper">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>User</th>
                                                        <th>Role</th>
                                                        <th>Platform</th>
                                                        <th>Registered On</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {users.recent_users.map(u => (
                                                        <tr key={u.id}>
                                                            <td>
                                                                <strong>{u.name}</strong>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                                                            </td>
                                                            <td><span style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                                                            <td><span style={{ textTransform: 'capitalize' }}>{u.platform || 'Global'}</span></td>
                                                            <td style={{ fontSize: '0.78rem' }}>{u.date_joined ? new Date(u.date_joined).toLocaleDateString() : 'N/A'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No recent users.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB 7: DIAGNOSTICS & AUDIT */}
                        {activeTab === 'diagnostics' && (
                            <div>
                                <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                                    <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem' }}>System Health & Subsystem Status</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                                        {Object.entries(systemHealth).map(([subsystem, status]) => (
                                            <div key={subsystem} style={{
                                                padding: '12px 16px', borderRadius: '8px',
                                                background: status === 'operational' ? '#f0fdf4' : '#fef2f2',
                                                border: `1px solid ${status === 'operational' ? '#bbf7d0' : '#fecaca'}`
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{subsystem}</span>
                                                    <span style={{
                                                        fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                                                        color: status === 'operational' ? '#166534' : '#991b1b'
                                                    }}>
                                                        {status}
                                                    </span>
                                                </div>
                                                {subsystemErrors[subsystem] && (
                                                    <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '6px', fontFamily: 'monospace' }}>
                                                        {subsystemErrors[subsystem]}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="card" style={{ padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem' }}>Raw Telemetry Payload Snapshot</h4>
                                    <pre style={{
                                        background: 'var(--bg)', padding: '16px', borderRadius: '8px',
                                        fontSize: '0.78rem', overflowX: 'auto', maxHeight: '400px'
                                    }}>
                                        {JSON.stringify(data, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </StaffLayout>
    );
}

export default withStaffAuth(OmniDashboard, ['admin', 'manager', 'staff']);
