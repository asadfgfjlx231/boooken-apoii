export class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.token = null;
    }

    setToken(token) {
        this.token = token;
    }

    clearToken() {
        this.token = null;
    }

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
        return headers;
    }

    async get(path) {
        const res = await fetch(`${this.baseUrl}${path}`, {
            headers: this.getHeaders()
        });
        if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
        return res.json();
    }

    async post(path, body) {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `POST ${path} failed: ${res.status}`);
        }
        return res.json();
    }

    async put(path, body) {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `PUT ${path} failed: ${res.status}`);
        }
        const text = await res.text();
        return text ? JSON.parse(text) : {};
    }

    async delete(path) {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
        const text = await res.text();
        return text ? JSON.parse(text) : {};
    }
}
