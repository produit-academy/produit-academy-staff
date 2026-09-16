import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../../lib/auth';
import { apiGet } from '../../lib/api';
import StaffLayout from '../../components/StaffLayout';

function GateMaterials() {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterClass, setFilterClass] = useState('ALL');

    useEffect(() => {
        apiGet('/api/materials/')
            .then(data => setMaterials(Array.isArray(data) ? data : []))
            .catch(() => setMaterials([]))
            .finally(() => setLoading(false));
    }, []);

    const classifications = ['ALL', 'PYQ', 'Notes', 'One-shots'];

    const filtered = materials.filter(m => {
        const matchesClass = filterClass === 'ALL' || m.classification === filterClass;
        const matchesSearch = !search || (m.title && m.title.toLowerCase().includes(search.toLowerCase())) ||
            (m.branch_name && m.branch_name.toLowerCase().includes(search.toLowerCase()));
        return matchesClass && matchesSearch;
    });

    return (
        <StaffLayout title="GATE Study Materials">
            <Head><title>GATE Content | Staff Portal</title></Head>

            <div style={{ marginBottom: '24px' }}>
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

                    <input
                        type="text"
                        className="input"
                        placeholder="Search materials or branches..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ padding: '8px 14px', minWidth: '240px' }}
                    />
                </div>

                <div className="stats-grid" style={{ marginBottom: '24px' }}>
                    <div className="card stat-card">
                        <div className="stat-value" style={{ color: 'var(--blue)' }}>{materials.length}</div>
                        <div className="stat-label">Total Materials</div>
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
            </div>

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
                                <th>Preview</th>
                                <th>File Link</th>
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
        </StaffLayout>
    );
}

export default withStaffAuth(GateMaterials);
