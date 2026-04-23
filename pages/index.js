import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { withStaffAuth } from '../lib/auth';
import { apiGet } from '../lib/api';
import StaffLayout from '../components/StaffLayout';

function Dashboard() {
    const router = useRouter();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const modData = await apiGet('/api/staff/modules/').catch(() => ({ modules: [] }));
                setModules(modData.modules || []);
            } catch { }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const MODULE_ROUTES = {
        support: '/complaints',
        careers: '/applications',
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
        </StaffLayout>
    );
}

export default withStaffAuth(Dashboard);
