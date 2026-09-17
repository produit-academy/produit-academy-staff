import Head from 'next/head';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { withStaffAuth, useAuth } from '../../lib/auth';
import { apiGet, apiPost } from '../../lib/api';
import StaffLayout from '../../components/StaffLayout';

function GateMaterials() {
    const router = useRouter();
    const { user } = useAuth();
    const [materials, setMaterials] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterClass, setFilterClass] = useState('ALL');
    const [hasAccess, setHasAccess] = useState(true);
    const [message, setMessage] = useState(null);

    // Upload Modal state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        title: '',
        classification: 'Notes',
        branch: '',
        is_preview: false,
        file: null,
    });
    const [uploading, setUploading] = useState(false);

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
            const [matData, branchData] = await Promise.all([
                apiGet('/api/materials/').catch(() => []),
                apiGet('/api/branches/').catch(() => []),
            ]);
            setMaterials(Array.isArray(matData) ? matData : []);
            const branchArr = Array.isArray(branchData) ? branchData : [];
            setBranches(branchArr);
            if (branchArr.length > 0 && !uploadForm.branch) {
                setUploadForm(f => ({ ...f, branch: branchArr[0].id }));
            }
        } catch {
            setMaterials([]);
        } finally {
            setLoading(false);
        }
    }, [user, uploadForm.branch]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadForm.file) {
            setMessage({ type: 'error', text: 'Please select a document/file to upload.' });
            return;
        }
        if (!uploadForm.branch) {
            setMessage({ type: 'error', text: 'Please select a branch.' });
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('title', uploadForm.title.trim());
            formData.append('classification', uploadForm.classification);
            formData.append('branch', uploadForm.branch);
            formData.append('is_preview', uploadForm.is_preview ? 'true' : 'false');
            formData.append('file', uploadForm.file);

            const res = await apiPost('/api/materials/upload/', formData);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || errData.error || 'Failed to upload material');
            }

            setMessage({ type: 'success', text: `Material "${uploadForm.title}" uploaded successfully.` });
            setShowUploadModal(false);
            setUploadForm({
                title: '',
                classification: 'Notes',
                branch: branches[0]?.id || '',
                is_preview: false,
                file: null,
            });
            loadData();
        } catch (err) {
            setMessage({ type: 'error', text: err?.message || 'Error uploading file.' });
        } finally {
            setUploading(false);
        }
    };

    const classifications = ['ALL', 'PYQ', 'Notes', 'One-shots'];

    const filtered = materials.filter(m => {
        const matchesClass = filterClass === 'ALL' || m.classification === filterClass;
        const matchesSearch = !search || (m.title && m.title.toLowerCase().includes(search.toLowerCase())) ||
            (m.branch_name && m.branch_name.toLowerCase().includes(search.toLowerCase()));
        return matchesClass && matchesSearch;
    });

    return (
        <StaffLayout title="GATE Content & Resources">
            <Head><title>GATE Materials | Staff Portal</title></Head>

            {message && (
                <div className={`alert ${message.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{message.text}</span>
                        <button type="button" onClick={() => setMessage(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit' }}>✕</button>
                    </div>
                </div>
            )}

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
                    {/* Module Nav Tabs */}
                    <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
                        <button
                            type="button"
                            className="btn primary"
                            style={{ borderRadius: '8px 8px 0 0', padding: '8px 18px', borderBottom: 'none' }}
                        >
                            Study Materials ({materials.length})
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => router.push('/gate/questions')}
                            style={{ borderRadius: '8px 8px 0 0', padding: '8px 18px', borderBottom: 'none' }}
                        >
                            Question Bank Browser
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid" style={{ marginBottom: '24px' }}>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: 'var(--blue)' }}>{materials.length}</div>
                            <div className="stat-label">Total Documents</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: 'var(--accent)' }}>
                                {materials.filter(m => m.classification === 'PYQ').length}
                            </div>
                            <div className="stat-label">PYQ Archives</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: 'var(--green)' }}>
                                {materials.filter(m => m.classification === 'Notes').length}
                            </div>
                            <div className="stat-label">Revision Notes</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-value" style={{ color: 'var(--purple)' }}>
                                {materials.filter(m => m.classification === 'One-shots').length}
                            </div>
                            <div className="stat-label">One-Shot Guides</div>
                        </div>
                    </div>

                    {/* Controls Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {classifications.map(c => (
                                <button
                                    key={c}
                                    className={`btn ${filterClass === c ? 'primary' : ''}`}
                                    onClick={() => setFilterClass(c)}
                                    style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                type="text"
                                className="input"
                                placeholder="Search materials or branches..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ padding: '8px 14px', minWidth: '220px' }}
                            />
                            <button
                                type="button"
                                className="btn primary"
                                onClick={() => setShowUploadModal(true)}
                                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Upload Material
                            </button>
                        </div>
                    </div>

                    {/* Materials Table */}
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
                    ) : filtered.length > 0 ? (
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Classification</th>
                                        <th>Branch</th>
                                        <th>Preview Access</th>
                                        <th>Document</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(m => (
                                        <tr key={m.id}>
                                            <td><strong>{m.title}</strong></td>
                                            <td>
                                                <span className="badge" style={{
                                                    background: m.classification === 'PYQ' ? 'var(--blue-bg)' : m.classification === 'Notes' ? 'var(--green-bg)' : 'var(--purple-bg)',
                                                    color: m.classification === 'PYQ' ? 'var(--blue)' : m.classification === 'Notes' ? 'var(--green)' : 'var(--purple)',
                                                }}>
                                                    {m.classification}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{m.branch_name || `Branch #${m.branch}`}</td>
                                            <td>
                                                <span className="badge" style={{ background: m.is_preview ? 'var(--accent-light)' : 'var(--bg-secondary)', color: m.is_preview ? 'var(--accent)' : 'var(--text-secondary)' }}>
                                                    {m.is_preview ? 'Public Preview' : 'Enrolled Only'}
                                                </span>
                                            </td>
                                            <td>
                                                {m.file ? (
                                                    <a href={m.file} target="_blank" rel="noopener noreferrer" className="btn" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                                                        View Document
                                                    </a>
                                                ) : '--'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="card empty-state">
                            <h3>No GATE materials found</h3>
                            <p>No materials matched your search criteria.</p>
                        </div>
                    )}

                    {/* Upload Modal */}
                    {showUploadModal && (
                        <div style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                            backdropFilter: 'blur(4px)',
                        }} onClick={() => setShowUploadModal(false)}>
                            <div className="card" style={{ width: '100%', maxWidth: '520px', margin: '20px' }} onClick={e => e.stopPropagation()}>
                                <h3 className="section-title" style={{ marginBottom: '16px' }}>
                                    Upload GATE Study Material
                                </h3>
                                <form onSubmit={handleUploadSubmit}>
                                    <div style={{ marginBottom: '14px' }}>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Material Title *</label>
                                        <input
                                            className="input"
                                            required
                                            placeholder="e.g. Signals & Systems Formula Sheet"
                                            value={uploadForm.title}
                                            onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                                            style={{ padding: '10px 14px' }}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Classification</label>
                                            <select
                                                className="input"
                                                value={uploadForm.classification}
                                                onChange={e => setUploadForm({ ...uploadForm, classification: e.target.value })}
                                                style={{ padding: '10px 14px' }}
                                            >
                                                <option value="Notes">Revision Notes</option>
                                                <option value="PYQ">PYQ Archives</option>
                                                <option value="One-shots">One-shot Guide</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Target Branch *</label>
                                            <select
                                                className="input"
                                                required
                                                value={uploadForm.branch}
                                                onChange={e => setUploadForm({ ...uploadForm, branch: e.target.value })}
                                                style={{ padding: '10px 14px' }}
                                            >
                                                {branches.map(b => (
                                                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Select Document File (.pdf, .doc) *</label>
                                        <input
                                            type="file"
                                            required
                                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                                            onChange={e => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                                            style={{ fontSize: '0.85rem', display: 'block', width: '100%' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                                            <input
                                                type="checkbox"
                                                checked={uploadForm.is_preview}
                                                onChange={e => setUploadForm({ ...uploadForm, is_preview: e.target.checked })}
                                                style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                                            />
                                            Mark as Public Preview (accessible by unenrolled students)
                                        </label>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button type="button" className="btn" onClick={() => setShowUploadModal(false)}>Cancel</button>
                                        <button type="submit" className="btn primary" disabled={uploading}>
                                            {uploading ? 'Uploading...' : 'Upload Document'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(GateMaterials);
