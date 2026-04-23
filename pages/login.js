import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../lib/auth';

export default function Login() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
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
                        <div style={{ width: '56px', height: '56px', margin: '0 auto' }}>
                            <img src="/logo.png" alt="Produit Academy" width="56" height="56" style={{ borderRadius: '12px' }} />
                        </div>
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
                            <label className="label">Password</label>
                            <input className="input" type="password" value={password}
                                onChange={(e) => setPassword(e.target.value)} required
                                placeholder="Enter password" />
                        </div>
                        <button type="submit" className="btn primary" disabled={loading}
                            style={{ width: '100%', padding: '12px', marginTop: '8px' }}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
