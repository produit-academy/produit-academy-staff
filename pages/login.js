import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../lib/auth';
import Logo from '../components/Logo';

export default function Login() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            router.push('/');
        } catch (err) {
            setError(err.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head><title>Staff Login | Produit Academy</title></Head>
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <Logo size={60} style={{ margin: '0 auto 12px' }} />
                        <h1>Produit Academy</h1>
                        <p>Staff Portal</p>
                    </div>

                    {error && <div className="alert error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="label">Email</label>
                            <input className="input" type="email" value={email}
                                onChange={(e) => setEmail(e.target.value)} required
                                placeholder="staff@produitacademy.com" />
                        </div>
                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label className="label" style={{ margin: 0 }}>Password</label>
                                <Link href="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 500 }}>
                                    Forgot password?
                                </Link>
                            </div>
                            <input className="input" type="password" value={password}
                                onChange={(e) => setPassword(e.target.value)} required
                                placeholder="Enter password" />
                        </div>
                        <button type="submit" className="btn primary" disabled={loading}
                            style={{ width: '100%', padding: '12px', marginTop: '8px' }}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Forgot your password? </span>
                        <Link href="/forgot-password" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            Reset it here
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
