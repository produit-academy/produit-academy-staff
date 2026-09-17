import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Logo from '../components/Logo';

export default function ForgotPassword() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await fetch(`${API_BASE}/api/password-reset-otp/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('OTP sent successfully! Redirecting to verification...');
                setTimeout(() => {
                    router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
                }, 1200);
            } else {
                setError(data.detail || 'No account found with that email address.');
            }
        } catch (err) {
            setError('An error occurred. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head><title>Forgot Password | Staff Portal - Produit Academy</title></Head>
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <Logo size={60} style={{ margin: '0 auto 12px' }} />
                        <h1>Produit Academy</h1>
                        <p>Staff Portal • Password Recovery</p>
                    </div>

                    <div style={{ marginBottom: '20px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        Enter your registered staff email address to receive a 6-digit one-time password (OTP).
                    </div>

                    {error && <div className="alert error">{error}</div>}
                    {message && <div className="alert success">{message}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="label">Staff Email Address</label>
                            <input
                                className="input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="staff@produitacademy.com"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn primary"
                            disabled={loading}
                            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
                        >
                            {loading ? 'Sending OTP...' : 'Send Reset OTP'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
                        <Link href="/login" style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
