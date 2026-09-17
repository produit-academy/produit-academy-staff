import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { withStaffAuth, useAuth } from '../../lib/auth';
import { apiGet } from '../../lib/api';
import StaffLayout from '../../components/StaffLayout';

function GateQuestions() {
    const router = useRouter();
    const { user } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [page, setPage] = useState(1);
    const [hasAccess, setHasAccess] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (user?.role === 'staff') {
                const modData = await apiGet('/api/staff/modules/').catch(() => ({ modules: [] }));
                const mods = modData.modules || [];
                if (!mods.some(m => m.key === 'gate_content')) {
                    setHasAccess(false);
                    setLoading(false);
                    return;
                }
            }

            const branchData = await apiGet('/api/branches/').catch(() => []);
            setBranches(Array.isArray(branchData) ? branchData : []);

            const params = new URLSearchParams();
            params.set('page', page);
            if (search) params.set('search', search);
            if (branchFilter) params.set('branch', branchFilter);

            const qData = await apiGet(`/api/admin/questions/?${params.toString()}`);
            if (qData && qData.results) {
                setQuestions(qData.results);
                setTotalCount(qData.count || 0);
            } else if (Array.isArray(qData)) {
                setQuestions(qData);
                setTotalCount(qData.length);
            } else {
                setQuestions([]);
                setTotalCount(0);
            }
        } catch {
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    }, [user, page, search, branchFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const totalPages = Math.ceil(totalCount / 20) || 1;

    return (
        <StaffLayout title="GATE Question Bank">
            <Head><title>Question Bank | Staff Portal</title></Head>

            {!hasAccess ? (
                <div className="card empty-state" style={{ padding: '40px', textAlign: 'center', maxWidth: '520px', margin: '40px auto' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h3 style={{ color: 'var(--red)', marginBottom: '8px' }}>Access Restricted</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>You do not have permission to access the GATE Content module.</p>
                </div>
            ) : (
                <>
                    {/* Navigation Tabs */}
                    <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => router.push('/gate/materials')}
                            style={{ borderRadius: '8px 8px 0 0', padding: '8px 18px', borderBottom: 'none' }}
                        >
                            Study Materials
                        </button>
                        <button
                            type="button"
                            className="btn primary"
                            style={{ borderRadius: '8px 8px 0 0', padding: '8px 18px', borderBottom: 'none' }}
                        >
                            Question Bank Browser ({totalCount})
                        </button>
                    </div>

                    {/* Filter & Search Toolbar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <select
                                className="input"
                                value={branchFilter}
                                onChange={e => { setBranchFilter(e.target.value); setPage(1); }}
                                style={{ padding: '8px 12px', minWidth: '180px' }}
                            >
                                <option value="">All Branches</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                                ))}
                            </select>

                            <input
                                type="text"
                                className="input"
                                placeholder="Search question text or category..."
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                style={{ padding: '8px 14px', minWidth: '260px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                className="btn"
                                disabled={page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                            >
                                Previous
                            </button>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                className="btn"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    {/* Question List */}
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
                    ) : questions.length > 0 ? (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {questions.map((q, idx) => (
                                <div key={q.id || idx} className="card" style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                #{q.id}
                                            </span>
                                            {q.branch_name && (
                                                <span className="badge" style={{ background: 'var(--blue-bg)', color: 'var(--blue)', fontWeight: 600 }}>
                                                    {q.branch_name}
                                                </span>
                                            )}
                                            {q.category && (
                                                <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                                    {q.category}
                                                </span>
                                            )}
                                            <span className="badge" style={{
                                                background: q.question_type === 'NAT' ? 'var(--yellow-bg)' : 'var(--purple-bg)',
                                                color: q.question_type === 'NAT' ? 'var(--yellow)' : 'var(--purple)',
                                                fontWeight: 600,
                                            }}>
                                                {q.question_type || 'MCQ'}
                                            </span>
                                        </div>

                                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-dark)' }}>
                                            {q.marks || 1} Marks
                                        </div>
                                    </div>

                                    {/* Question Text */}
                                    <div style={{ fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '14px', color: 'var(--text-primary)' }}>
                                        {q.text}
                                    </div>

                                    {/* Question Image if any */}
                                    {q.image && (
                                        <div style={{ marginBottom: '14px' }}>
                                            <img src={q.image} alt="Question diagram" style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                        </div>
                                    )}

                                    {/* Choices or NAT Answer */}
                                    {q.question_type === 'NAT' ? (
                                        <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.88rem' }}>
                                            <strong>Accepted Range:</strong> {q.nat_min ?? '--'} to {q.nat_max ?? '--'}
                                        </div>
                                    ) : q.choices && q.choices.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                                            {q.choices.map((c, cIdx) => (
                                                <div
                                                    key={c.id || cIdx}
                                                    style={{
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        border: c.is_correct ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                                                        background: c.is_correct ? 'var(--accent-light)' : 'var(--bg-secondary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        fontSize: '0.86rem',
                                                    }}
                                                >
                                                    <span style={{
                                                        width: '20px', height: '20px', borderRadius: '50%',
                                                        background: c.is_correct ? 'var(--accent)' : 'var(--border)',
                                                        color: c.is_correct ? '#fff' : 'var(--text-secondary)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.72rem', fontWeight: 700, flexShrink: 0
                                                    }}>
                                                        {String.fromCharCode(65 + cIdx)}
                                                    </span>
                                                    <span style={{ color: c.is_correct ? 'var(--accent-dark)' : 'var(--text-primary)', fontWeight: c.is_correct ? 600 : 400 }}>
                                                        {c.text}
                                                    </span>
                                                    {c.is_correct && (
                                                        <span style={{ marginLeft: 'auto', color: 'var(--accent-dark)', display: 'flex' }}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12"/>
                                                            </svg>
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>No choices configured.</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
                            <h3>No Questions Found</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>No questions matched your search or branch selection.</p>
                        </div>
                    )}
                </>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(GateQuestions);
