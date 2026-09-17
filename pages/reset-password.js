import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Logo from '../components/Logo';

export default function ResetPassword() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (router.query.email) {
            setEmail(router.query.email);
        }
    }, [router.query.email]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match. Please verify.');
            return;
        }

        setLoading(true);

        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await fetch(`${API_BASE}/api/password-reset-confirm/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    otp: otp.trim(),
                    password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Password reset successfully! Redirecting to sign in...');
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                setError(data.detail || 'Failed to reset password. Please verify the OTP code.');
            }
        } catch (err) {
            setError('An error occurred. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head><title>Reset Password | Staff Portal - Produit Academy</title></Head>
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <Logo size={60} style={{ margin: '0 auto 12px' }} />
                        <h1>Produit Academy</h1>
                        <p>Staff Portal • Set New Password</p>
                    </div>

                    <div style={{ marginBottom: '20px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        Enter the 6-digit verification code sent to your email and set your new password.
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

                        <div className="form-group">
                            <label className="label">6-Digit OTP Code</label>
                            <input
                                className="input"
                                type="text"
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                required
                                placeholder="123456"
                                style={{ letterSpacing: '4px', fontSize: '1.15rem', fontWeight: 600, textAlign: 'center' }}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label className="label" style={{ margin: 0 }}>New Password</label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--accent)',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        fontWeight: 500,
                                        padding: 0
                                    }}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            <input
                                className="input"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Enter at least 6 characters"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label className="label">Confirm New Password</label>
                            <input
                                className="input"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Re-enter new password"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn primary"
                            disabled={loading}
                            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
                        >
                            {loading ? 'Resetting Password...' : 'Reset Password'}
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
