import { useAuth } from '../lib/auth';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { apiGet } from '../lib/api';

const ICONS = {
    dashboard: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
    ),
    flag: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
        </svg>
    ),
    mail: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
        </svg>
    ),
    briefcase: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    tasks: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
    ),
    user: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    ),
};

const MODULE_NAV = {
    support: [
        { label: 'Complaints', href: '/complaints', icon: 'flag' },
        { label: 'Contact Enquiries', href: '/contacts', icon: 'mail' },
    ],
    careers: [
        { label: 'Applications', href: '/applications', icon: 'briefcase' },
    ],
    classes: [
        { label: 'HR Onboarding', href: '/classes/onboard', icon: 'user' },
        { label: 'Schedule Demo', href: '/classes/schedule', icon: 'tasks' },
    ],
};

export default function StaffLayout({ children, title }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [modules, setModules] = useState([]);

    useEffect(() => {
        apiGet('/api/staff/modules/')
            .then(data => setModules(data.modules || []))
            .catch(() => setModules([]));
    }, []);

    const moduleNavItems = [];
    modules.forEach(m => {
        if (MODULE_NAV[m.key]) {
            MODULE_NAV[m.key].forEach(item => moduleNavItems.push(item));
        }
    });

    return (
        <div className="app-layout">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? '\u2715' : '\u2630'}
            </button>

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="sidebar-brand-icon">
                            <img src="/logo.png" alt="Produit Academy" width="28" height="28" style={{ borderRadius: '6px' }} />
                        </div>
                        <div>
                            <div className="sidebar-brand-text">Produit Academy</div>
                            <div className="sidebar-brand-sub">Staff Portal</div>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {/* Overview */}
                    <div className="nav-section">
                        <div className="nav-title">Overview</div>
                        <a href="/" className={`nav-item ${router.pathname === '/' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setSidebarOpen(false); router.push('/'); }}>
                            <span className="nav-icon">{ICONS.dashboard}</span> Dashboard
                        </a>
                    </div>

                    {/* Module-specific items */}
                    {moduleNavItems.length > 0 && (
                        <div className="nav-section">
                            <div className="nav-title">My Modules</div>
                            {moduleNavItems.map(item => (
                                <a key={item.href} href={item.href}
                                    className={`nav-item ${router.pathname === item.href ? 'active' : ''}`}
                                    onClick={(e) => { e.preventDefault(); setSidebarOpen(false); router.push(item.href); }}>
                                    <span className="nav-icon">{ICONS[item.icon]}</span> {item.label}
                                </a>
                            ))}
                        </div>
                    )}

                    {/* HR & Recruitment — always visible */}
                    <div className="nav-section">
                        <div className="nav-title">HR & Recruitment</div>
                        <a href="/classes/onboard" className={`nav-item ${router.pathname === '/classes/onboard' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setSidebarOpen(false); router.push('/classes/onboard'); }}>
                            <span className="nav-icon">{ICONS.user}</span> Onboarding
                        </a>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{(user?.username?.[0] || 'S').toUpperCase()}</div>
                        <div>
                            <div className="user-name">{user?.username || 'Staff'}</div>
                            <div className="user-role">Staff Member</div>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={logout}>Log Out</button>
                </div>
            </aside>

            {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}

            <main className="main-content">
                {title && <h1 className="page-title">{title}</h1>}
                {children}
            </main>
        </div>
    );
}
