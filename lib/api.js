const API_BASE = 'http://localhost:8000';

export async function apiFetch(endpoint, options = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('staff_access_token') : null;
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }
    const res = await fetch(`${API_BASE}/api${endpoint}`, {
        ...options,
        headers,
    });
    if (res.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('staff_access_token');
            localStorage.removeItem('staff_refresh_token');
            window.location.href = '/login';
        }
        throw new Error('Unauthorized');
    }
    return res;
}

export async function apiGet(endpoint) {
    const res = await apiFetch(endpoint);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
}

export async function apiPost(endpoint, data) {
    return apiFetch(endpoint, {
        method: 'POST',
        body: data instanceof FormData ? data : JSON.stringify(data),
    });
}

export async function apiPatch(endpoint, data) {
    return apiFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function apiDelete(endpoint) {
    return apiFetch(endpoint, { method: 'DELETE' });
}