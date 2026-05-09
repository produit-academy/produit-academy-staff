import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext(null);

function decodeToken(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch { return null; }
}

export function StaffAuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('staff_access_token');
        if (token) {
            const decoded = decodeToken(token);
            if (decoded) {
                setUser(decoded);
            } else {
                localStorage.removeItem('staff_access_token');
                localStorage.removeItem('staff_refresh_token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${API_BASE}/api/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || data.error || 'Login failed');

        const decoded = decodeToken(data.access);
        const allowedRoles = ['admin', 'staff', 'manager'];
        if (!decoded || !allowedRoles.includes(decoded.role)) {
            throw new Error('This portal is for staff members only.');
        }

        localStorage.setItem('staff_access_token', data.access);
        localStorage.setItem('staff_refresh_token', data.refresh);
        setUser(decoded);
    };

    const logout = () => {
        localStorage.removeItem('staff_access_token');
        localStorage.removeItem('staff_refresh_token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

export function withStaffAuth(Component) {
    return function ProtectedRoute(props) {
        const { user, loading } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!loading && !user) {
                router.replace('/login');
            }
        }, [user, loading, router]);

        if (loading) return null;
        if (!user) return null;
        return <Component {...props} />;
    };
}
