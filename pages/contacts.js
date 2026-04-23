import Head from 'next/head';
import { useState, useEffect } from 'react';
import { withStaffAuth } from '../lib/auth';
import { apiGet } from '../lib/api';
import StaffLayout from '../components/StaffLayout';

function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try { setContacts(await apiGet('/api/staff/module/support/contacts/')); }
            catch { }
            finally { setLoading(false); }
        };
        load();
    }, []);

    return (
        <StaffLayout title="Contact Enquiries">
            <Head><title>Contacts | Staff Portal</title></Head>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                All contact enquiries submitted across platforms ({contacts.length})
            </p>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
            ) : contacts.length > 0 ? (
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr><th>Date</th><th>Name</th><th>Email</th><th>Phone</th><th>Subject</th><th>Message</th></tr>
                        </thead>
                        <tbody>
                            {contacts.map(c => (
                                <tr key={c.id}>
                                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                                    <td><strong>{c.name}</strong></td>
                                    <td><a href={`mailto:${c.email}`}>{c.email}</a></td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{c.phone || '--'}</td>
                                    <td>{c.subject || '--'}</td>
                                    <td style={{ maxWidth: '250px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {c.message?.substring(0, 100)}{c.message?.length > 100 ? '...' : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card empty-state"><h3>No enquiries</h3><p>No contact enquiries submitted yet.</p></div>
            )}
        </StaffLayout>
    );
}

export default withStaffAuth(Contacts);
