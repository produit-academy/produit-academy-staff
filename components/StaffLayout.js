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
    wallet: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M16 12h2" />
        </svg>
    ),
    staff: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    money: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
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
    settings: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    shield: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
    ],
};

export default function StaffLayout({ children, title }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [modules, setModules] = useState([]);

    const role = user?.role;
    const isAdmin = role === 'admin';
    const isManager = role === 'manager';
    const isStaff = role === 'staff';

    useEffect(() => {
        // Only staff need to fetch module access — admin/manager see everything
        if (isStaff) {
            apiGet('/api/staff/modules/')
                .then(data => setModules(data.modules || []))
                .catch(() => setModules([]));
        }
    }, [isStaff]);

    // Build module nav items for staff based on their department
    const moduleNavItems = [];
    const hasModule = (key) => modules.some(m => m.key === key);
    if (isStaff) {
        modules.forEach(m => {
            if (MODULE_NAV[m.key]) {
                MODULE_NAV[m.key].forEach(item => moduleNavItems.push(item));
            }
        });
    }

    // HR staff has careers/classes modules
    const isHR = isStaff && (hasModule('careers') || hasModule('classes'));

    const navLink = (href, icon, label) => (
        <a key={href} href={href}
            className={`nav-item ${router.pathname === href ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setSidebarOpen(false); router.push(href); }}>
            <span className="nav-icon">{ICONS[icon]}</span> {label}
        </a>
    );

    const getRoleLabel = () => {
        if (isAdmin) return 'Admin';
        if (isManager) return 'Manager';
        return 'Staff';
    };

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
                    {/* Overview — all roles */}
                    <div className="nav-section">
                        <div className="nav-title">Overview</div>
                        {navLink('/', 'dashboard', 'Dashboard')}
                    </div>

                    {/* Staff self-service — staff & manager */}
                    {(isStaff || isManager) && (
                        <div className="nav-section">
                            <div className="nav-title">My Work</div>
                            {navLink('/tasks', 'tasks', 'My Tasks')}
                            {navLink('/wallet', 'wallet', 'My Wallet')}
                            {navLink('/profile', 'user', 'Profile')}
                        </div>
                    )}

                    {/* Module-specific items — staff only */}
                    {isStaff && moduleNavItems.length > 0 && (
                        <div className="nav-section">
                            <div className="nav-title">My Modules</div>
                            {moduleNavItems.map(item => navLink(item.href, item.icon, item.label))}
                        </div>
                    )}

                    {/* Manager / Admin — HR & Management */}
                    {(isManager || isAdmin) && (
                        <div className="nav-section">
                            <div className="nav-title">Management</div>
                            {navLink('/hr/staff', 'staff', 'All Staff')}
                            {navLink('/hr/tasks', 'tasks', 'Task Management')}
                            {navLink('/hr/payroll', 'money', 'Payroll')}
                        </div>
                    )}

                    {/* HR & Recruitment — HR staff only (not admin) */}
                    {isHR && (
                        <div className="nav-section">
                            <div className="nav-title">HR & Recruitment</div>
                            {navLink('/applications', 'briefcase', 'Applications')}
                            {navLink('/classes/onboard', 'user', 'Onboarding')}
                        </div>
                    )}

                    {/* Admin support */}
                    {isAdmin && (
                        <div className="nav-section">
                            <div className="nav-title">Support</div>
                            {navLink('/complaints', 'flag', 'Complaints')}
                            {navLink('/contacts', 'mail', 'Contact Enquiries')}
                        </div>
                    )}

                    {/* Super Admin — admin only */}
                    {isAdmin && (
                        <div className="nav-section">
                            <div className="nav-title">Super Admin</div>
                            {navLink('/admin/users', 'shield', 'User Management')}
                        </div>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{(user?.username?.[0] || 'S').toUpperCase()}</div>
                        <div>
                            <div className="user-name">{user?.username || 'Staff'}</div>
                            <div className="user-role">{getRoleLabel()}</div>
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
