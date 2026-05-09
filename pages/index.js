import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { withStaffAuth, useAuth } from '../lib/auth';
import { apiGet } from '../lib/api';
import StaffLayout from '../components/StaffLayout';

function Dashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    const role = user?.role;
    const isAdmin = role === 'admin';
    const isManager = role === 'manager';

    useEffect(() => {
        const load = async () => {
            try {
                const modData = await apiGet('/api/staff/modules/').catch(() => ({ modules: [] }));
                setModules(modData.modules || []);

                // Load manager/admin stats
                if (isManager || isAdmin) {
                    const [staffData, taskData] = await Promise.all([
                        apiGet('/api/staff/manager/staff/').catch(() => []),
                        apiGet('/api/staff/manager/tasks/').catch(() => []),
                    ]);
                    const staffArr = Array.isArray(staffData) ? staffData : [];
                    const taskArr = Array.isArray(taskData) ? taskData : [];
                    setStats({
                        totalStaff: staffArr.length,
                        totalTasks: taskArr.length,
                        pendingTasks: taskArr.filter(t => t.status === 'pending').length,
                        inProgress: taskArr.filter(t => t.status === 'in_progress').length,
                        completed: taskArr.filter(t => t.status === 'completed').length,
                    });
                }
            } catch { }
            finally { setLoading(false); }
        };
        load();
    }, [isManager, isAdmin]);

    const MODULE_ROUTES = {
        support: '/complaints',
        careers: '/applications',
        classes: '/classes/onboard',
    };

    const MODULE_COLORS = {
        support: 'var(--red)',
        careers: 'var(--purple)',
        gate_content: 'var(--blue)',
        classes: 'var(--green)',
        analytics: 'var(--yellow)',
    };

    return (
        <StaffLayout title="Dashboard">
            <Head><title>Dashboard | Staff Portal</title></Head>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
            ) : (
                <>
                    {/* Manager/Admin Stats */}
                    {(isManager || isAdmin) && stats && (
                        <>
                            <div className="stats-grid" style={{ marginBottom: '28px' }}>
                                <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => router.push('/hr/staff')}>
                                    <div className="stat-value" style={{ color: 'var(--accent)' }}>{stats.totalStaff}</div>
                                    <div className="stat-label">Total Staff</div>
                                </div>
                                <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => router.push('/hr/tasks')}>
                                    <div className="stat-value" style={{ color: 'var(--blue)' }}>{stats.totalTasks}</div>
                                    <div className="stat-label">Total Tasks</div>
                                </div>
                                <div className="card stat-card">
                                    <div className="stat-value" style={{ color: 'var(--yellow)' }}>{stats.pendingTasks}</div>
                                    <div className="stat-label">Pending</div>
                                </div>
                                <div className="card stat-card">
                                    <div className="stat-value" style={{ color: 'var(--purple)' }}>{stats.inProgress}</div>
                                    <div className="stat-label">In Progress</div>
                                </div>
                                <div className="card stat-card">
                                    <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.completed}</div>
                                    <div className="stat-label">Completed</div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <h3 className="section-title">Quick Actions</h3>
                            <div className="module-grid" style={{ marginBottom: '28px' }}>
                                <div className="card module-card" style={{ borderLeftColor: 'var(--accent)' }}
                                    onClick={() => router.push('/hr/tasks')}>
                                    <h4>Manage Tasks</h4>
                                    <p>Create, assign, and track tasks</p>
                                </div>
                                <div className="card module-card" style={{ borderLeftColor: 'var(--purple)' }}
                                    onClick={() => router.push('/hr/payroll')}>
                                    <h4>Payroll</h4>
                                    <p>Process payments and view wallets</p>
                                </div>
                                <div className="card module-card" style={{ borderLeftColor: 'var(--blue)' }}
                                    onClick={() => router.push('/hr/staff')}>
                                    <h4>View Staff</h4>
                                    <p>All staff, teachers, and mentors</p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Staff Module Cards */}
                    {!isManager && !isAdmin && (
                        <>
                            <div className="stats-grid" style={{ marginBottom: '28px' }}>
                                <div className="card stat-card">
                                    <div className="stat-value" style={{ color: 'var(--accent)' }}>{modules.length}</div>
                                    <div className="stat-label">Assigned Modules</div>
                                </div>
                            </div>

                            <h3 className="section-title">Your Modules</h3>
                            {modules.length > 0 ? (
                                <div className="module-grid">
                                    {modules.map(m => (
                                        <div key={m.key} className="card module-card"
                                            style={{ borderLeftColor: MODULE_COLORS[m.key] || 'var(--accent)' }}
                                            onClick={() => router.push(MODULE_ROUTES[m.key] || '/')}>
                                            <h4>{m.label}</h4>
                                            <p>{m.description}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="card empty-state">
                                    <h3>No modules assigned</h3>
                                    <p>Contact your administrator to get access to platform modules.</p>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(Dashboard);
