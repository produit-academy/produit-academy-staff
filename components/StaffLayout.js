import { useAuth } from '../lib/auth';
import { useRouter } from 'next/router';
import { useState } from 'react';

const ICONS = {
    dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
    tasks: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
    user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    wallet: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M16 12h2" /></svg>,
    staff: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    money: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    flag: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>,
    mail: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
    briefcase: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
};

const STAFF_NAV = [
    { label: 'Dashboard', href: '/', icon: 'dashboard' },
    { label: 'My Tasks', href: '/tasks', icon: 'tasks' },
    { label: 'My Wallet', href: '/wallet', icon: 'wallet' },
    { label: 'My Profile', href: '/profile', icon: 'user' },
];

const MANAGER_NAV = [
    { label: 'Dashboard', href: '/', icon: 'dashboard' },
    { label: 'Staff Members', href: '/hr/staff', icon: 'staff' },
    { label: 'All Tasks', href: '/hr/tasks', icon: 'tasks' },
    { label: 'Payroll & Wallets', href: '/hr/payroll', icon: 'money' },
];

const ADMIN_NAV = [
    { label: 'Dashboard', href: '/', icon: 'dashboard' },
    { label: 'Staff Members', href: '/hr/staff', icon: 'staff' },
    { label: 'All Tasks', href: '/hr/tasks', icon: 'tasks' },
    { label: 'Payroll & Wallets', href: '/hr/payroll', icon: 'money' },
    { label: 'Complaints', href: '/complaints', icon: 'flag' },
    { label: 'Contacts', href: '/contacts', icon: 'mail' },
    { label: 'Applications', href: '/applications', icon: 'briefcase' },
];

export default function StaffLayout({ children, title }) {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const role = user?.role;
    const isManager = role === 'manager';
    const isAdmin = role === 'admin' || user?.is_staff;
    const isStaff = role === 'staff';

    const navItems = isAdmin ? ADMIN_NAV : isManager ? MANAGER_NAV : STAFF_NAV;

    const displayName = user?.username || user?.email || 'User';
    const displayRole = isAdmin ? 'Admin' : isManager ? 'Manager / HR' : 'Staff Member';

    return (
        <div className="app-layout">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? '✕' : '☰'}
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
                    <div className="nav-section">
                        {navItems.map(item => (
                            <a key={item.href} href={item.href}
                                className={`nav-item ${router.pathname === item.href ? 'active' : ''}`}
                                onClick={(e) => { e.preventDefault(); setSidebarOpen(false); router.push(item.href); }}>
                                <span className="nav-icon">{ICONS[item.icon]}</span> {item.label}
                            </a>
                        ))}
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{(displayName[0] || 'S').toUpperCase()}</div>
                        <div>
                            <div className="user-name">{displayName}</div>
                            <div className="user-role">{displayRole}</div>
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